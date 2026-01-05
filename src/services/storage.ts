/**
 * AsyncStorage Wrapper
 *
 * Provides typed, JSON-safe access to AsyncStorage.
 * All local data goes through this layer for consistency.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  Workout,
  WorkoutSession,
  UserPreferences,
} from '../types';
import type { SyncQueueItem, SyncedData } from '../types/sync';

// Storage key constants - all keys prefixed with @phit/
const STORAGE_KEYS = {
  USER_ID: '@phit/userId',
  PREFERENCES: '@phit/preferences',
  TEMPLATES: '@phit/templates',
  SESSIONS: '@phit/sessions',
  CURRENT_SESSION: '@phit/currentSession',
  SYNC_QUEUE: '@phit/syncQueue',
  LAST_SYNC_TIMESTAMP: '@phit/lastSyncTimestamp',
} as const;

export { STORAGE_KEYS };

// Generic typed get/set helpers

async function getItem<T>(key: string): Promise<T | null> {
  try {
    const value = await AsyncStorage.getItem(key);
    if (value === null) return null;
    return JSON.parse(value) as T;
  } catch (error) {
    console.error(`Storage read error for ${key}:`, error);
    return null;
  }
}

async function setItem<T>(key: string, value: T): Promise<boolean> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Storage write error for ${key}:`, error);
    return false;
  }
}

async function removeItem(key: string): Promise<boolean> {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Storage remove error for ${key}:`, error);
    return false;
  }
}

// User ID (from Clerk)

export async function getUserId(): Promise<string | null> {
  return getItem<string>(STORAGE_KEYS.USER_ID);
}

export async function setUserId(userId: string): Promise<boolean> {
  return setItem(STORAGE_KEYS.USER_ID, userId);
}

export async function clearUserId(): Promise<boolean> {
  return removeItem(STORAGE_KEYS.USER_ID);
}

// User Preferences

const DEFAULT_PREFERENCES: UserPreferences = {
  defaultLoadUnit: 'lb',
  autoScrollOnComplete: true,
};

export async function getPreferences(): Promise<SyncedData<UserPreferences>> {
  const data = await getItem<SyncedData<UserPreferences>>(STORAGE_KEYS.PREFERENCES);
  if (!data) {
    return {
      data: DEFAULT_PREFERENCES,
      lastModified: Date.now(),
      syncedAt: null,
    };
  }
  return data;
}

export async function setPreferences(
  preferences: UserPreferences
): Promise<boolean> {
  const synced: SyncedData<UserPreferences> = {
    data: preferences,
    lastModified: Date.now(),
    syncedAt: null, // Will be updated after sync
  };
  return setItem(STORAGE_KEYS.PREFERENCES, synced);
}

// Workout Templates (custom user templates)

export async function getTemplates(): Promise<SyncedData<Workout[]>> {
  const data = await getItem<SyncedData<Workout[]>>(STORAGE_KEYS.TEMPLATES);
  if (!data) {
    return {
      data: [],
      lastModified: Date.now(),
      syncedAt: null,
    };
  }
  return data;
}

export async function setTemplates(templates: Workout[]): Promise<boolean> {
  const synced: SyncedData<Workout[]> = {
    data: templates,
    lastModified: Date.now(),
    syncedAt: null,
  };
  return setItem(STORAGE_KEYS.TEMPLATES, synced);
}

export async function addTemplate(template: Workout): Promise<boolean> {
  const current = await getTemplates();
  current.data.push(template);
  return setTemplates(current.data);
}

export async function updateTemplate(template: Workout): Promise<boolean> {
  const current = await getTemplates();
  const index = current.data.findIndex(t => t.id === template.id);
  if (index === -1) return false;
  current.data[index] = template;
  return setTemplates(current.data);
}

export async function deleteTemplate(templateId: string): Promise<boolean> {
  const current = await getTemplates();
  current.data = current.data.filter(t => t.id !== templateId);
  return setTemplates(current.data);
}

// Workout Sessions (completed workouts history)

export async function getSessions(): Promise<SyncedData<WorkoutSession[]>> {
  const data = await getItem<SyncedData<WorkoutSession[]>>(STORAGE_KEYS.SESSIONS);
  if (!data) {
    return {
      data: [],
      lastModified: Date.now(),
      syncedAt: null,
    };
  }
  return data;
}

export async function setSessions(sessions: WorkoutSession[]): Promise<boolean> {
  const synced: SyncedData<WorkoutSession[]> = {
    data: sessions,
    lastModified: Date.now(),
    syncedAt: null,
  };
  return setItem(STORAGE_KEYS.SESSIONS, synced);
}

export async function addSession(session: WorkoutSession): Promise<boolean> {
  const current = await getSessions();
  current.data.push(session);
  return setSessions(current.data);
}

export async function updateSession(session: WorkoutSession): Promise<boolean> {
  const current = await getSessions();
  const index = current.data.findIndex(s => s.id === session.id);
  if (index === -1) {
    // New session, add it
    current.data.push(session);
  } else {
    current.data[index] = session;
  }
  return setSessions(current.data);
}

// Current Session (in-progress workout)

export async function getCurrentSession(): Promise<WorkoutSession | null> {
  return getItem<WorkoutSession>(STORAGE_KEYS.CURRENT_SESSION);
}

export async function setCurrentSession(
  session: WorkoutSession | null
): Promise<boolean> {
  if (session === null) {
    return removeItem(STORAGE_KEYS.CURRENT_SESSION);
  }
  return setItem(STORAGE_KEYS.CURRENT_SESSION, session);
}

// Sync Queue (pending uploads to Firestore)

export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  const data = await getItem<SyncQueueItem[]>(STORAGE_KEYS.SYNC_QUEUE);
  return data ?? [];
}

export async function setSyncQueue(queue: SyncQueueItem[]): Promise<boolean> {
  return setItem(STORAGE_KEYS.SYNC_QUEUE, queue);
}

export async function addToSyncQueue(item: SyncQueueItem): Promise<boolean> {
  const queue = await getSyncQueue();
  queue.push(item);
  return setSyncQueue(queue);
}

export async function removeFromSyncQueue(itemId: string): Promise<boolean> {
  const queue = await getSyncQueue();
  const filtered = queue.filter(item => item.id !== itemId);
  return setSyncQueue(filtered);
}

export async function updateSyncQueueItem(
  itemId: string,
  updates: Partial<SyncQueueItem>
): Promise<boolean> {
  const queue = await getSyncQueue();
  const index = queue.findIndex(item => item.id === itemId);
  if (index === -1) return false;
  queue[index] = { ...queue[index], ...updates };
  return setSyncQueue(queue);
}

// Last Sync Timestamp

export async function getLastSyncTimestamp(): Promise<number> {
  const data = await getItem<number>(STORAGE_KEYS.LAST_SYNC_TIMESTAMP);
  return data ?? 0;
}

export async function setLastSyncTimestamp(timestamp: number): Promise<boolean> {
  return setItem(STORAGE_KEYS.LAST_SYNC_TIMESTAMP, timestamp);
}

// Clear all data (for logout)

export async function clearAllData(): Promise<boolean> {
  try {
    const keys = Object.values(STORAGE_KEYS);
    await AsyncStorage.multiRemove(keys);
    return true;
  } catch (error) {
    console.error('Failed to clear all data:', error);
    return false;
  }
}
