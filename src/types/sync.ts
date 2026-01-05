/**
 * Sync-related Type Definitions
 *
 * Types for tracking sync state between AsyncStorage and Firestore.
 */

// Collections that can be synced to Firestore
export type SyncCollection = 'preferences' | 'templates' | 'sessions';

// Represents a pending sync operation in the queue
export interface SyncQueueItem {
  id: string; // Unique ID for this queue item
  collection: SyncCollection;
  documentId: string; // ID of the document being synced
  action: 'upsert' | 'delete';
  data: unknown; // The actual data to sync (for upsert)
  createdAt: number; // When this item was queued
  retryCount: number; // Number of failed sync attempts
}

// Wrapper for data that tracks sync state
export interface SyncedData<T> {
  data: T;
  lastModified: number; // Timestamp of last local modification
  syncedAt: number | null; // Timestamp of last successful sync, null if never synced
}

// Sync operation result
export interface SyncResult {
  success: boolean;
  itemsUploaded: number;
  itemsDownloaded: number;
  errors: SyncError[];
}

// Sync error details
export interface SyncError {
  collection: SyncCollection;
  documentId: string;
  message: string;
  retryable: boolean;
}

// Sync status for UI (if we ever want to show it)
export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';
