/**
 * Sync Service
 *
 * Manages periodic background synchronization between AsyncStorage and Firestore.
 *
 * Key behaviors:
 * - Runs every 2 minutes while app is in foreground
 * - Processes sync queue (uploads pending changes to Firestore)
 * - Downloads newer data from Firestore
 * - Silently handles errors, only surfaces persistent failures
 * - Respects network connectivity and auth state
 */

import { AppState, AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';

import { db, auth, isFirebaseEnabled } from './firebase';
import * as storage from './storage';
import type { SyncQueueItem, SyncResult, SyncError, SyncStatus, SyncCollection } from '../types/sync';

// Sync interval: 2 minutes in milliseconds
const SYNC_INTERVAL_MS = 2 * 60 * 1000;

// Max retries before we show an error to the user
const MAX_RETRY_COUNT = 5;

// Module-level state
let syncIntervalId: NodeJS.Timeout | null = null;
let appStateSubscription: ReturnType<typeof AppState.addEventListener> | null = null;
let currentSyncStatus: SyncStatus = 'idle';
let onStatusChange: ((status: SyncStatus) => void) | null = null;

/**
 * Get the current sync status
 */
export function getSyncStatus(): SyncStatus {
  return currentSyncStatus;
}

/**
 * Subscribe to sync status changes (for UI updates if needed)
 */
export function subscribeToSyncStatus(
  callback: (status: SyncStatus) => void
): () => void {
  onStatusChange = callback;
  return () => {
    onStatusChange = null;
  };
}

/**
 * Update sync status and notify subscribers
 */
function setStatus(status: SyncStatus): void {
  currentSyncStatus = status;
  onStatusChange?.(status);
}

/**
 * Check if we can sync (network available, Firebase configured, user authenticated)
 */
async function canSync(): Promise<{ canSync: boolean; reason?: string }> {
  // Check if Firebase is configured
  if (!isFirebaseEnabled() || !db) {
    return { canSync: false, reason: 'Firebase not configured' };
  }

  // Check network connectivity
  const netState = await NetInfo.fetch();
  if (!netState.isConnected) {
    return { canSync: false, reason: 'No network connection' };
  }

  // Check if user is authenticated with Firebase
  if (!auth?.currentUser) {
    return { canSync: false, reason: 'User not authenticated' };
  }

  return { canSync: true };
}

/**
 * Get the Firestore document path for a sync item
 */
function getDocPath(userId: string, collection: SyncCollection, documentId: string): string {
  // Firestore structure: users/{userId}/{collection}/{documentId}
  // For preferences, documentId is the userId itself (single doc)
  if (collection === 'preferences') {
    return `users/${userId}/preferences/settings`;
  }
  return `users/${userId}/${collection}/${documentId}`;
}

/**
 * Process a single sync queue item (upload to Firestore)
 */
async function processSyncItem(item: SyncQueueItem): Promise<{ success: boolean; error?: string }> {
  if (!db || !auth?.currentUser) {
    return { success: false, error: 'Firebase not available' };
  }

  const userId = auth.currentUser.uid;

  try {
    if (item.action === 'upsert') {
      // Get reference to the document
      const docPath = getDocPath(userId, item.collection, item.documentId);
      const pathParts = docPath.split('/');

      // Build doc reference from path
      // Path format: users/{userId}/{collection}/{docId} -> 4 parts
      const docRef = doc(db, pathParts[0], pathParts[1], pathParts[2], pathParts[3]);

      // Add metadata for sync tracking
      const dataWithMeta = {
        ...item.data as object,
        _syncedAt: Timestamp.now(),
        _lastModified: Timestamp.fromMillis(item.createdAt),
      };

      await setDoc(docRef, dataWithMeta, { merge: true });
    } else if (item.action === 'delete') {
      const docPath = getDocPath(userId, item.collection, item.documentId);
      const pathParts = docPath.split('/');
      const docRef = doc(db, pathParts[0], pathParts[1], pathParts[2], pathParts[3]);

      await deleteDoc(docRef);
    }

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Sync failed for ${item.collection}/${item.documentId}:`, message);
    return { success: false, error: message };
  }
}

/**
 * Process all items in the sync queue (upload phase)
 */
async function processQueue(): Promise<{ uploaded: number; errors: SyncError[] }> {
  const queue = await storage.getSyncQueue();

  if (queue.length === 0) {
    return { uploaded: 0, errors: [] };
  }

  const errors: SyncError[] = [];
  let uploaded = 0;

  for (const item of queue) {
    const result = await processSyncItem(item);

    if (result.success) {
      // Remove from queue on success
      await storage.removeFromSyncQueue(item.id);
      uploaded++;
    } else {
      // Increment retry count
      const newRetryCount = item.retryCount + 1;

      if (newRetryCount >= MAX_RETRY_COUNT) {
        // Too many retries - add to errors and remove from queue
        errors.push({
          collection: item.collection,
          documentId: item.documentId,
          message: result.error ?? 'Max retries exceeded',
          retryable: false,
        });
        await storage.removeFromSyncQueue(item.id);
      } else {
        // Update retry count for next attempt
        await storage.updateSyncQueueItem(item.id, { retryCount: newRetryCount });
        errors.push({
          collection: item.collection,
          documentId: item.documentId,
          message: result.error ?? 'Sync failed',
          retryable: true,
        });
      }
    }
  }

  return { uploaded, errors };
}

/**
 * Pull changes from Firestore that are newer than our last sync
 *
 * Note: This is a simple implementation for single-device usage.
 * For multi-device, we'd need more sophisticated conflict resolution.
 */
async function pullRemoteChanges(): Promise<{ downloaded: number; errors: SyncError[] }> {
  if (!db || !auth?.currentUser) {
    return { downloaded: 0, errors: [] };
  }

  const userId = auth.currentUser.uid;
  const lastSync = await storage.getLastSyncTimestamp();
  const lastSyncTimestamp = Timestamp.fromMillis(lastSync);

  let downloaded = 0;
  const errors: SyncError[] = [];

  try {
    // Pull sessions that were modified after our last sync
    // This handles the case where user synced from another device (future feature)
    const sessionsRef = collection(db, 'users', userId, 'sessions');
    const sessionsQuery = query(
      sessionsRef,
      where('_lastModified', '>', lastSyncTimestamp)
    );

    const sessionsSnapshot = await getDocs(sessionsQuery);

    if (!sessionsSnapshot.empty) {
      const currentSessions = await storage.getSessions();
      let updated = false;

      for (const docSnap of sessionsSnapshot.docs) {
        const remoteSession = docSnap.data();
        const sessionId = docSnap.id;

        // Check if we have this session locally
        const localIndex = currentSessions.data.findIndex(s => s.id === sessionId);

        if (localIndex === -1) {
          // New session from remote - add it
          // Remove sync metadata before storing locally
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { _syncedAt, _lastModified, ...sessionData } = remoteSession;
          currentSessions.data.push(sessionData as typeof currentSessions.data[0]);
          downloaded++;
          updated = true;
        }
        // For existing sessions, local is source of truth (single device assumption)
      }

      if (updated) {
        await storage.setSessions(currentSessions.data);
      }
    }

    // Pull templates
    const templatesRef = collection(db, 'users', userId, 'templates');
    const templatesQuery = query(
      templatesRef,
      where('_lastModified', '>', lastSyncTimestamp)
    );

    const templatesSnapshot = await getDocs(templatesQuery);

    if (!templatesSnapshot.empty) {
      const currentTemplates = await storage.getTemplates();
      let updated = false;

      for (const docSnap of templatesSnapshot.docs) {
        const remoteTemplate = docSnap.data();
        const templateId = docSnap.id;

        const localIndex = currentTemplates.data.findIndex(t => t.id === templateId);

        if (localIndex === -1) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { _syncedAt, _lastModified, ...templateData } = remoteTemplate;
          currentTemplates.data.push(templateData as typeof currentTemplates.data[0]);
          downloaded++;
          updated = true;
        }
      }

      if (updated) {
        await storage.setTemplates(currentTemplates.data);
      }
    }

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to pull remote changes:', message);
    errors.push({
      collection: 'sessions',
      documentId: '*',
      message,
      retryable: true,
    });
  }

  return { downloaded, errors };
}

/**
 * Perform a full sync cycle: upload pending changes, then download new data
 */
export async function performSync(): Promise<SyncResult> {
  const syncCheck = await canSync();

  if (!syncCheck.canSync) {
    console.log(`Sync skipped: ${syncCheck.reason}`);
    setStatus(syncCheck.reason === 'No network connection' ? 'offline' : 'idle');
    return {
      success: true, // Not a failure, just skipped
      itemsUploaded: 0,
      itemsDownloaded: 0,
      errors: [],
    };
  }

  setStatus('syncing');

  try {
    // Phase 1: Upload pending changes
    const uploadResult = await processQueue();

    // Phase 2: Download remote changes
    const downloadResult = await pullRemoteChanges();

    // Update last sync timestamp
    await storage.setLastSyncTimestamp(Date.now());

    const allErrors = [...uploadResult.errors, ...downloadResult.errors];
    const hasNonRetryableErrors = allErrors.some(e => !e.retryable);

    setStatus(hasNonRetryableErrors ? 'error' : 'idle');

    return {
      success: allErrors.length === 0,
      itemsUploaded: uploadResult.uploaded,
      itemsDownloaded: downloadResult.downloaded,
      errors: allErrors,
    };
  } catch (error) {
    console.error('Sync failed:', error);
    setStatus('error');
    return {
      success: false,
      itemsUploaded: 0,
      itemsDownloaded: 0,
      errors: [{
        collection: 'sessions',
        documentId: '*',
        message: error instanceof Error ? error.message : 'Unknown error',
        retryable: true,
      }],
    };
  }
}

/**
 * Start periodic sync (call when app enters foreground)
 */
export function startPeriodicSync(): void {
  // Don't start if already running
  if (syncIntervalId !== null) {
    return;
  }

  console.log('Starting periodic sync (every 2 minutes)');

  // Run initial sync
  performSync().catch(console.error);

  // Set up interval for subsequent syncs
  syncIntervalId = setInterval(() => {
    performSync().catch(console.error);
  }, SYNC_INTERVAL_MS);
}

/**
 * Stop periodic sync (call when app enters background)
 */
export function stopPeriodicSync(): void {
  if (syncIntervalId !== null) {
    console.log('Stopping periodic sync');
    clearInterval(syncIntervalId);
    syncIntervalId = null;
  }
}

/**
 * Handle app state changes (foreground/background)
 */
function handleAppStateChange(nextAppState: AppStateStatus): void {
  if (nextAppState === 'active') {
    // App came to foreground - start syncing
    startPeriodicSync();
  } else if (nextAppState === 'background' || nextAppState === 'inactive') {
    // App went to background - stop syncing
    stopPeriodicSync();
  }
}

/**
 * Initialize sync service with app lifecycle management
 * Call this once when the app starts
 */
export function initializeSyncService(): () => void {
  // Only initialize if Firebase is enabled
  if (!isFirebaseEnabled()) {
    console.log('Sync service disabled: Firebase not configured');
    return () => {};
  }

  // Subscribe to app state changes
  appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

  // If app is already active, start syncing
  if (AppState.currentState === 'active') {
    startPeriodicSync();
  }

  // Return cleanup function
  return () => {
    stopPeriodicSync();
    appStateSubscription?.remove();
    appStateSubscription = null;
  };
}

/**
 * Force an immediate sync (useful for "Sync Now" button)
 */
export async function syncNow(): Promise<SyncResult> {
  return performSync();
}
