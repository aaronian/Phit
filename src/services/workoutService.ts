/**
 * Workout Service
 *
 * Manages workout sessions with persistence via dataService.
 * Sessions are stored locally (AsyncStorage) and synced to Firebase when online.
 *
 * This service maintains the same API as the previous in-memory version,
 * so existing components don't need to change.
 */
import type {
  Workout,
  WorkoutSession,
  ExerciseLog,
  SetLog,
} from '../types';
import * as dataService from './dataService';

// In-memory cache of current session for fast access
// This is synchronized with persistent storage
let cachedSession: WorkoutSession | null = null;
let sessionListeners: ((session: WorkoutSession | null) => void)[] = [];
let initialized = false;

/**
 * Initialize the service by loading any existing session from storage
 */
async function ensureInitialized(): Promise<void> {
  if (initialized) return;

  try {
    cachedSession = await dataService.getCurrentSession();
    initialized = true;
  } catch (error) {
    console.error('Failed to load session from storage:', error);
    initialized = true; // Don't block on errors
  }
}

function notifyListeners() {
  sessionListeners.forEach(listener => listener(cachedSession));
}

/**
 * Persist the current session to storage and notify listeners
 */
async function persistAndNotify(): Promise<void> {
  if (cachedSession) {
    await dataService.updateCurrentSession(cachedSession);
  }
  notifyListeners();
}

/**
 * Get user's saved workout templates
 */
export async function getWorkouts(userId: string): Promise<Workout[]> {
  return dataService.getTemplates();
}

/**
 * Start a new workout session
 */
export async function startWorkoutSession(
  userId: string,
  workout: Workout
): Promise<string> {
  await ensureInitialized();

  // Build exercise logs from workout structure
  const exercises = workout.sections.flatMap((section) =>
    section.exercises.map((exercise) => ({
      exerciseId: exercise.id,
      defaultSets: exercise.defaultSets,
    }))
  );

  // Create session via dataService (handles ID generation and storage)
  cachedSession = await dataService.startSession(workout.id, exercises);

  notifyListeners();

  return cachedSession.id;
}

/**
 * Subscribe to session updates
 * Returns unsubscribe function
 */
export function subscribeToSession(
  sessionId: string,
  onUpdate: (session: WorkoutSession | null) => void
): () => void {
  sessionListeners.push(onUpdate);

  // Initialize and send current state
  ensureInitialized().then(() => {
    onUpdate(cachedSession);
  });

  // Return unsubscribe function
  return () => {
    sessionListeners = sessionListeners.filter(l => l !== onUpdate);
  };
}

/**
 * Get the current active session (if any)
 */
export async function getCurrentSession(): Promise<WorkoutSession | null> {
  await ensureInitialized();
  return cachedSession;
}

/**
 * Update a specific set in an exercise
 */
export async function updateSet(
  sessionId: string,
  exerciseId: string,
  setNumber: number,
  setData: Partial<SetLog>
): Promise<void> {
  await ensureInitialized();
  if (!cachedSession || cachedSession.id !== sessionId) return;

  cachedSession = {
    ...cachedSession,
    exerciseLogs: cachedSession.exerciseLogs.map((log) => {
      if (log.exerciseId !== exerciseId) return log;
      return {
        ...log,
        sets: log.sets.map((set) => {
          if (set.setNumber !== setNumber) return set;
          return { ...set, ...setData };
        }),
      };
    }),
  };

  await persistAndNotify();
}

/**
 * Add a new set to an exercise
 */
export async function addSet(
  sessionId: string,
  exerciseId: string
): Promise<void> {
  await ensureInitialized();
  if (!cachedSession || cachedSession.id !== sessionId) return;

  cachedSession = {
    ...cachedSession,
    exerciseLogs: cachedSession.exerciseLogs.map((log) => {
      if (log.exerciseId !== exerciseId) return log;
      const newSetNumber = log.sets.length + 1;
      return {
        ...log,
        sets: [
          ...log.sets,
          {
            setNumber: newSetNumber,
            reps: null,
            load: null,
            loadUnit: 'lb' as const,
            rpe: null,
          },
        ],
      };
    }),
  };

  await persistAndNotify();
}

/**
 * Remove the last set from an exercise
 */
export async function removeSet(
  sessionId: string,
  exerciseId: string
): Promise<void> {
  await ensureInitialized();
  if (!cachedSession || cachedSession.id !== sessionId) return;

  cachedSession = {
    ...cachedSession,
    exerciseLogs: cachedSession.exerciseLogs.map((log) => {
      if (log.exerciseId !== exerciseId) return log;
      if (log.sets.length <= 1) return log; // Keep at least one set
      return {
        ...log,
        sets: log.sets.slice(0, -1),
      };
    }),
  };

  await persistAndNotify();
}

/**
 * Mark an exercise as complete
 */
export async function completeExercise(
  sessionId: string,
  exerciseId: string
): Promise<void> {
  await ensureInitialized();
  if (!cachedSession || cachedSession.id !== sessionId) return;

  cachedSession = {
    ...cachedSession,
    exerciseLogs: cachedSession.exerciseLogs.map((log) => {
      if (log.exerciseId !== exerciseId) return log;
      return { ...log, isComplete: true };
    }),
  };

  await persistAndNotify();
}

/**
 * Mark an exercise as incomplete (undo complete)
 */
export async function uncompleteExercise(
  sessionId: string,
  exerciseId: string
): Promise<void> {
  await ensureInitialized();
  if (!cachedSession || cachedSession.id !== sessionId) return;

  cachedSession = {
    ...cachedSession,
    exerciseLogs: cachedSession.exerciseLogs.map((log) => {
      if (log.exerciseId !== exerciseId) return log;
      return { ...log, isComplete: false };
    }),
  };

  await persistAndNotify();
}

/**
 * Complete the workout session
 * Saves to history and clears current session
 */
export async function completeSession(sessionId: string): Promise<void> {
  await ensureInitialized();
  if (!cachedSession || cachedSession.id !== sessionId) return;

  // Complete via dataService (saves to history, queues for sync)
  await dataService.completeSession(cachedSession);

  cachedSession = null;
  notifyListeners();
}

/**
 * Discard the current session without saving
 */
export async function discardSession(sessionId: string): Promise<void> {
  await ensureInitialized();
  if (!cachedSession || cachedSession.id !== sessionId) return;

  await dataService.discardCurrentSession();

  cachedSession = null;
  notifyListeners();
}

/**
 * Get exercise history (previous logs for an exercise)
 */
export async function getExerciseHistory(
  userId: string,
  exerciseId: string,
  limitCount: number = 5
): Promise<ExerciseLog[]> {
  const logs = await dataService.getSessionsForExercise(exerciseId);

  // Sort by most recent and limit
  return logs
    .sort((a, b) => {
      // We don't have timestamps on individual logs, so just take last N
      return 0;
    })
    .slice(0, limitCount);
}

/**
 * Get all completed sessions
 */
export async function getSessionHistory(): Promise<WorkoutSession[]> {
  return dataService.getSessions();
}

/**
 * Save a workout template
 */
export async function saveWorkoutTemplate(workout: Workout): Promise<Workout> {
  return dataService.saveTemplate(workout);
}

/**
 * Delete a workout template
 */
export async function deleteWorkoutTemplate(workoutId: string): Promise<void> {
  return dataService.deleteTemplate(workoutId);
}
