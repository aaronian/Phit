/**
 * Data Service
 *
 * Unified API for all data operations. Components use this service
 * instead of accessing storage or Firebase directly.
 *
 * - All reads come from AsyncStorage (fast, offline-capable)
 * - All writes go to AsyncStorage first, then queue for sync
 * - Sync happens in background via syncService
 */

import type {
  Workout,
  WorkoutSession,
  UserPreferences,
  ExerciseLog,
} from '../types';
import type { SyncQueueItem, SyncCollection } from '../types/sync';
import * as storage from './storage';

// Helper to generate unique IDs (timestamp + random suffix)
const generateId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${randomPart}`;
};

// Helper to add item to sync queue
async function queueForSync(
  collection: SyncCollection,
  documentId: string,
  action: 'upsert' | 'delete',
  data?: unknown
): Promise<void> {
  const queueItem: SyncQueueItem = {
    id: generateId(),
    collection,
    documentId,
    action,
    data: data ?? null,
    createdAt: Date.now(),
    retryCount: 0,
  };
  await storage.addToSyncQueue(queueItem);
}

// ============ User Preferences ============

export async function getPreferences(): Promise<UserPreferences> {
  const synced = await storage.getPreferences();
  return synced.data;
}

export async function savePreferences(
  preferences: UserPreferences
): Promise<void> {
  await storage.setPreferences(preferences);

  // Queue for sync
  const userId = await storage.getUserId();
  if (userId) {
    await queueForSync('preferences', userId, 'upsert', preferences);
  }
}

// ============ Workout Templates ============

export async function getTemplates(): Promise<Workout[]> {
  const synced = await storage.getTemplates();
  return synced.data;
}

export async function saveTemplate(template: Workout): Promise<Workout> {
  // Assign ID if new
  const templateWithId = template.id ? template : { ...template, id: generateId() };

  const existing = await storage.getTemplates();
  const index = existing.data.findIndex(t => t.id === templateWithId.id);

  if (index === -1) {
    await storage.addTemplate(templateWithId);
  } else {
    await storage.updateTemplate(templateWithId);
  }

  // Queue for sync
  await queueForSync('templates', templateWithId.id, 'upsert', templateWithId);

  return templateWithId;
}

export async function deleteTemplate(templateId: string): Promise<void> {
  await storage.deleteTemplate(templateId);
  await queueForSync('templates', templateId, 'delete');
}

// ============ Workout Sessions ============

export async function getSessions(): Promise<WorkoutSession[]> {
  const synced = await storage.getSessions();
  return synced.data;
}

export async function getSessionById(
  sessionId: string
): Promise<WorkoutSession | null> {
  const sessions = await getSessions();
  return sessions.find(s => s.id === sessionId) ?? null;
}

export async function getSessionsForExercise(
  exerciseId: string
): Promise<ExerciseLog[]> {
  const sessions = await getSessions();

  // Find all exercise logs for this exercise across all sessions
  const logs: ExerciseLog[] = [];
  for (const session of sessions) {
    const log = session.exerciseLogs.find(l => l.exerciseId === exerciseId);
    if (log) {
      logs.push(log);
    }
  }

  return logs;
}

// ============ Current Session (In-Progress Workout) ============

export async function getCurrentSession(): Promise<WorkoutSession | null> {
  return storage.getCurrentSession();
}

export async function startSession(
  workoutId: string,
  exercises: { exerciseId: string; defaultSets: number }[]
): Promise<WorkoutSession> {
  const userId = (await storage.getUserId()) ?? 'local-user';

  const session: WorkoutSession = {
    id: generateId(),
    workoutId,
    userId,
    startedAt: new Date(),
    completedAt: null,
    exerciseLogs: exercises.map(ex => ({
      exerciseId: ex.exerciseId,
      isComplete: false,
      sets: Array.from({ length: ex.defaultSets }, (_, i) => ({
        setNumber: i + 1,
        reps: null,
        load: null,
        loadUnit: 'lb' as const,
        rpe: null,
      })),
    })),
  };

  await storage.setCurrentSession(session);
  return session;
}

export async function updateCurrentSession(
  session: WorkoutSession
): Promise<void> {
  await storage.setCurrentSession(session);
}

export async function completeSession(
  session: WorkoutSession
): Promise<WorkoutSession> {
  const completed: WorkoutSession = {
    ...session,
    completedAt: new Date(),
  };

  // Save to history
  await storage.addSession(completed);

  // Clear current session
  await storage.setCurrentSession(null);

  // Queue for sync
  await queueForSync('sessions', completed.id, 'upsert', completed);

  return completed;
}

export async function discardCurrentSession(): Promise<void> {
  await storage.setCurrentSession(null);
}

// ============ User Identity ============

export async function setUserId(userId: string): Promise<void> {
  await storage.setUserId(userId);
}

export async function getUserId(): Promise<string | null> {
  return storage.getUserId();
}

export async function clearUserData(): Promise<void> {
  await storage.clearAllData();
}

// ============ Sync Status ============

export async function getSyncQueueLength(): Promise<number> {
  const queue = await storage.getSyncQueue();
  return queue.length;
}

export async function hasPendingSyncs(): Promise<boolean> {
  const length = await getSyncQueueLength();
  return length > 0;
}
