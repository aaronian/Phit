/**
 * Workout Service
 *
 * This service handles all database operations for workouts.
 * It's the "middle layer" between your React components and Firebase.
 *
 * Why separate this into a service?
 * - Keeps database logic out of UI components (cleaner code)
 * - Makes it easy to change database later if needed
 * - Centralizes error handling
 * - Makes testing easier
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import type {
  Workout,
  WorkoutSession,
  ExerciseLog,
  SetLog,
} from '../types';

// Collection names in Firestore
// Think of collections like tables in a traditional database
const COLLECTIONS = {
  WORKOUTS: 'workouts',
  SESSIONS: 'sessions',
  USER_NOTES: 'userNotes', // Persistent notes per exercise
};

/**
 * Fetches all workout templates for a user
 *
 * @param userId - The authenticated user's ID
 * @returns Array of workout templates
 */
export async function getWorkouts(userId: string): Promise<Workout[]> {
  // Create a query: get all workouts where userId matches
  const q = query(
    collection(db, COLLECTIONS.WORKOUTS),
    where('userId', '==', userId)
  );

  const snapshot = await getDocs(q);

  // Transform Firestore documents into our Workout type
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Workout[];
}

/**
 * Starts a new workout session
 *
 * This creates a new document in the 'sessions' collection
 * with all exercises initialized but not yet completed.
 *
 * @param userId - The authenticated user's ID
 * @param workout - The workout template to start
 * @returns The new session ID
 */
export async function startWorkoutSession(
  userId: string,
  workout: Workout
): Promise<string> {
  // Create a reference for a new document (auto-generates ID)
  const sessionRef = doc(collection(db, COLLECTIONS.SESSIONS));

  // Initialize exercise logs for each exercise in the workout
  // Each exercise starts with empty sets based on defaultSets
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

  const session: Omit<WorkoutSession, 'id'> = {
    workoutId: workout.id,
    userId,
    startedAt: new Date(),
    completedAt: null,
    exerciseLogs,
  };

  // Write to Firestore
  // Timestamp.fromDate converts JavaScript Date to Firestore Timestamp
  await setDoc(sessionRef, {
    ...session,
    startedAt: Timestamp.fromDate(session.startedAt),
  });

  return sessionRef.id;
}

/**
 * Subscribe to real-time updates for a workout session
 *
 * This is a "listener" that fires whenever the session data changes.
 * Useful for syncing across devices or if you want real-time updates.
 *
 * @param sessionId - The session to watch
 * @param onUpdate - Callback function called with new data
 * @returns Unsubscribe function (call this to stop listening)
 */
export function subscribeToSession(
  sessionId: string,
  onUpdate: (session: WorkoutSession | null) => void
): Unsubscribe {
  const sessionRef = doc(db, COLLECTIONS.SESSIONS, sessionId);

  // onSnapshot sets up a real-time listener
  return onSnapshot(sessionRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      onUpdate({
        id: snapshot.id,
        ...data,
        // Convert Firestore Timestamp back to JavaScript Date
        startedAt: data.startedAt.toDate(),
        completedAt: data.completedAt?.toDate() || null,
      } as WorkoutSession);
    } else {
      onUpdate(null);
    }
  });
}

/**
 * Update a single set's data
 *
 * @param sessionId - The current session
 * @param exerciseId - Which exercise
 * @param setNumber - Which set (1-indexed)
 * @param setData - The new set data
 */
export async function updateSet(
  sessionId: string,
  exerciseId: string,
  setNumber: number,
  setData: Partial<SetLog>
): Promise<void> {
  const sessionRef = doc(db, COLLECTIONS.SESSIONS, sessionId);
  const sessionSnap = await getDoc(sessionRef);

  if (!sessionSnap.exists()) {
    throw new Error('Session not found');
  }

  const session = sessionSnap.data() as Omit<WorkoutSession, 'id'>;

  // Find and update the specific set
  const updatedLogs = session.exerciseLogs.map((log) => {
    if (log.exerciseId !== exerciseId) return log;

    return {
      ...log,
      sets: log.sets.map((set) => {
        if (set.setNumber !== setNumber) return set;
        return { ...set, ...setData };
      }),
    };
  });

  await updateDoc(sessionRef, { exerciseLogs: updatedLogs });
}

/**
 * Mark an exercise as complete
 *
 * @param sessionId - The current session
 * @param exerciseId - Which exercise to mark done
 */
export async function completeExercise(
  sessionId: string,
  exerciseId: string
): Promise<void> {
  const sessionRef = doc(db, COLLECTIONS.SESSIONS, sessionId);
  const sessionSnap = await getDoc(sessionRef);

  if (!sessionSnap.exists()) {
    throw new Error('Session not found');
  }

  const session = sessionSnap.data() as Omit<WorkoutSession, 'id'>;

  const updatedLogs = session.exerciseLogs.map((log) => {
    if (log.exerciseId !== exerciseId) return log;
    return { ...log, isComplete: true };
  });

  await updateDoc(sessionRef, { exerciseLogs: updatedLogs });
}

/**
 * Complete the entire workout session
 *
 * @param sessionId - The session to complete
 */
export async function completeSession(sessionId: string): Promise<void> {
  const sessionRef = doc(db, COLLECTIONS.SESSIONS, sessionId);

  await updateDoc(sessionRef, {
    completedAt: Timestamp.fromDate(new Date()),
  });
}

/**
 * Get exercise history (last N sessions)
 *
 * Useful for showing past performance in the History bottom sheet.
 *
 * @param userId - The user
 * @param exerciseId - Which exercise to get history for
 * @param limitCount - How many past sessions to fetch (default 5)
 */
export async function getExerciseHistory(
  userId: string,
  exerciseId: string,
  limitCount: number = 5
): Promise<ExerciseLog[]> {
  // Query completed sessions, ordered by most recent
  const q = query(
    collection(db, COLLECTIONS.SESSIONS),
    where('userId', '==', userId),
    where('completedAt', '!=', null),
    orderBy('completedAt', 'desc'),
    limit(limitCount)
  );

  const snapshot = await getDocs(q);

  // Extract just the logs for this exercise from each session
  return snapshot.docs
    .map((doc) => {
      const session = doc.data() as Omit<WorkoutSession, 'id'>;
      return session.exerciseLogs.find((log) => log.exerciseId === exerciseId);
    })
    .filter((log): log is ExerciseLog => log !== undefined);
}
