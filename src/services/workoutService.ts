/**
 * Workout Service - Local Mode
 *
 * This version works entirely in-memory without Firebase.
 * Replace with Firebase version when you're ready to set it up.
 */
import type {
  Workout,
  WorkoutSession,
  ExerciseLog,
  SetLog,
} from '../types';

// In-memory storage
let currentSession: WorkoutSession | null = null;
let sessionListeners: ((session: WorkoutSession | null) => void)[] = [];

function notifyListeners() {
  sessionListeners.forEach(listener => listener(currentSession));
}

export async function getWorkouts(userId: string): Promise<Workout[]> {
  return [];
}

export async function startWorkoutSession(
  userId: string,
  workout: Workout
): Promise<string> {
  const sessionId = `session-${Date.now()}`;

  const exerciseLogs: ExerciseLog[] = workout.sections.flatMap((section) =>
    section.exercises.map((exercise) => ({
      exerciseId: exercise.id,
      isComplete: false,
      sets: Array.from({ length: exercise.defaultSets }, (_, i) => ({
        setNumber: i + 1,
        reps: null,
        load: null,
        loadUnit: 'lb' as const,
        rpe: null,
      })),
    }))
  );

  currentSession = {
    id: sessionId,
    workoutId: workout.id,
    userId,
    startedAt: new Date(),
    completedAt: null,
    exerciseLogs,
  };

  // Notify listeners after a small delay to simulate async
  setTimeout(() => notifyListeners(), 10);

  return sessionId;
}

export function subscribeToSession(
  sessionId: string,
  onUpdate: (session: WorkoutSession | null) => void
): () => void {
  sessionListeners.push(onUpdate);

  // Immediately call with current session
  setTimeout(() => onUpdate(currentSession), 10);

  // Return unsubscribe function
  return () => {
    sessionListeners = sessionListeners.filter(l => l !== onUpdate);
  };
}

export async function updateSet(
  sessionId: string,
  exerciseId: string,
  setNumber: number,
  setData: Partial<SetLog>
): Promise<void> {
  if (!currentSession) return;

  currentSession = {
    ...currentSession,
    exerciseLogs: currentSession.exerciseLogs.map((log) => {
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

  notifyListeners();
}

export async function completeExercise(
  sessionId: string,
  exerciseId: string
): Promise<void> {
  if (!currentSession) return;

  currentSession = {
    ...currentSession,
    exerciseLogs: currentSession.exerciseLogs.map((log) => {
      if (log.exerciseId !== exerciseId) return log;
      return { ...log, isComplete: true };
    }),
  };

  notifyListeners();
}

export async function completeSession(sessionId: string): Promise<void> {
  if (!currentSession) return;

  currentSession = {
    ...currentSession,
    completedAt: new Date(),
  };

  notifyListeners();
}

export async function getExerciseHistory(
  userId: string,
  exerciseId: string,
  limitCount: number = 5
): Promise<ExerciseLog[]> {
  return [];
}
