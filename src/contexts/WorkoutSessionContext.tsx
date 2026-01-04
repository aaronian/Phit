/**
 * Workout Session Context
 *
 * WHAT IS CONTEXT?
 * React Context is a way to share data across your entire app without
 * having to pass props through every level of the component tree.
 *
 * Think of it like a "global variable" for your React app, but done
 * in a React-friendly way that updates components when the data changes.
 *
 * WHY USE IT HERE?
 * The workout session state needs to be accessed by:
 * - Side Panel (to show progress)
 * - Exercise Cards (to read/write set data)
 * - Overlays (to save input values)
 * - Timer (to persist across the session)
 *
 * Without Context, we'd have to pass props through many layers.
 * With Context, any component can directly access the session data.
 *
 * HOW TO USE:
 * 1. Wrap your app with <WorkoutSessionProvider>
 * 2. In any component, call useWorkoutSession() to get access to the data
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import type {
  Workout,
  WorkoutSession,
  ExerciseLog,
  SetLog,
  SectionProgress,
  ProgressState,
  LoadUnit,
} from '../types';
import {
  startWorkoutSession,
  subscribeToSession,
  updateSet,
  completeExercise,
  completeSession,
} from '../services/workoutService';

// Define the shape of our context
// This is TypeScript telling us what data and functions will be available
interface WorkoutSessionContextType {
  // Current state
  workout: Workout | null;
  session: WorkoutSession | null;
  isLoading: boolean;
  error: string | null;

  // Progress tracking
  sectionProgress: SectionProgress[];
  currentSectionIndex: number;

  // Actions (functions to modify state)
  startSession: (userId: string, workout: Workout) => Promise<void>;
  updateSetData: (
    exerciseId: string,
    setNumber: number,
    data: Partial<SetLog>
  ) => Promise<void>;
  markExerciseComplete: (exerciseId: string) => Promise<void>;
  markAllSetsFromFirst: (exerciseId: string) => Promise<void>;
  finishWorkout: () => Promise<void>;

  // Preferences
  defaultLoadUnit: LoadUnit;
  setDefaultLoadUnit: (unit: LoadUnit) => void;
}

// Create the context with undefined default
// We'll throw an error if someone tries to use it outside a Provider
const WorkoutSessionContext = createContext<
  WorkoutSessionContextType | undefined
>(undefined);

// Props for our Provider component
interface ProviderProps {
  children: ReactNode;
}

/**
 * WorkoutSessionProvider
 *
 * This component wraps your app and provides the workout session state
 * to all child components. Place it near the top of your component tree.
 *
 * Example:
 *   <WorkoutSessionProvider>
 *     <App />
 *   </WorkoutSessionProvider>
 */
export function WorkoutSessionProvider({ children }: ProviderProps) {
  // State for the current workout template and session
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // User preferences
  const [defaultLoadUnit, setDefaultLoadUnit] = useState<LoadUnit>('lb');

  // Track which section the user is currently viewing
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);

  /**
   * Calculate progress for each section
   *
   * useMemo is an optimization: it only recalculates when dependencies change.
   * This prevents unnecessary recalculations on every render.
   */
  const sectionProgress = useMemo((): SectionProgress[] => {
    if (!workout || !session) return [];

    return workout.sections.map((section) => {
      // Count completed exercises in this section
      const sectionExerciseIds = section.exercises.map((e) => e.id);
      const completedCount = session.exerciseLogs.filter(
        (log) =>
          sectionExerciseIds.includes(log.exerciseId) && log.isComplete
      ).length;

      const total = section.exercises.length;

      // Determine progress state for the visual indicator
      let state: ProgressState;
      if (completedCount === 0) {
        state = 'not_started';
      } else if (completedCount === total) {
        state = 'complete';
      } else {
        state = 'in_progress';
      }

      return {
        sectionId: section.id,
        name: section.name,
        completed: completedCount,
        total,
        state,
      };
    });
  }, [workout, session]);

  /**
   * Start a new workout session
   *
   * useCallback memoizes the function so it doesn't get recreated on every render.
   * This is important for performance, especially when passing functions as props.
   */
  const startSession = useCallback(
    async (userId: string, selectedWorkout: Workout) => {
      setIsLoading(true);
      setError(null);

      try {
        setWorkout(selectedWorkout);
        const sessionId = await startWorkoutSession(userId, selectedWorkout);

        // Subscribe to real-time updates
        // This means if you had multiple devices, they'd stay in sync
        subscribeToSession(sessionId, (updatedSession) => {
          setSession(updatedSession);
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to start session');
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Update a single set's data (reps, load, RPE)
   */
  const updateSetData = useCallback(
    async (exerciseId: string, setNumber: number, data: Partial<SetLog>) => {
      if (!session) return;

      try {
        await updateSet(session.id, exerciseId, setNumber, data);
        // Note: The subscribeToSession listener will automatically update our state
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update set');
      }
    },
    [session]
  );

  /**
   * Mark an exercise as complete
   */
  const markExerciseComplete = useCallback(
    async (exerciseId: string) => {
      if (!session) return;

      try {
        await completeExercise(session.id, exerciseId);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to complete exercise'
        );
      }
    },
    [session]
  );

  /**
   * Copy first set's values to all other sets (Mark All button)
   */
  const markAllSetsFromFirst = useCallback(
    async (exerciseId: string) => {
      if (!session) return;

      const exerciseLog = session.exerciseLogs.find(
        (log) => log.exerciseId === exerciseId
      );
      if (!exerciseLog || exerciseLog.sets.length === 0) return;

      const firstSet = exerciseLog.sets[0];

      // Update all sets (except the first) to match the first set's values
      try {
        await Promise.all(
          exerciseLog.sets.slice(1).map((set) =>
            updateSet(session.id, exerciseId, set.setNumber, {
              reps: firstSet.reps,
              load: firstSet.load,
              loadUnit: firstSet.loadUnit,
              rpe: firstSet.rpe,
            })
          )
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to copy set data'
        );
      }
    },
    [session]
  );

  /**
   * Complete the entire workout
   */
  const finishWorkout = useCallback(async () => {
    if (!session) return;

    try {
      await completeSession(session.id);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to complete workout'
      );
    }
  }, [session]);

  // Bundle all our state and functions into the context value
  const contextValue = useMemo(
    () => ({
      workout,
      session,
      isLoading,
      error,
      sectionProgress,
      currentSectionIndex,
      startSession,
      updateSetData,
      markExerciseComplete,
      markAllSetsFromFirst,
      finishWorkout,
      defaultLoadUnit,
      setDefaultLoadUnit,
    }),
    [
      workout,
      session,
      isLoading,
      error,
      sectionProgress,
      currentSectionIndex,
      startSession,
      updateSetData,
      markExerciseComplete,
      markAllSetsFromFirst,
      finishWorkout,
      defaultLoadUnit,
    ]
  );

  return (
    <WorkoutSessionContext.Provider value={contextValue}>
      {children}
    </WorkoutSessionContext.Provider>
  );
}

/**
 * Custom hook to use the workout session context
 *
 * WHAT IS A CUSTOM HOOK?
 * A custom hook is just a function that uses other hooks.
 * It's a way to reuse stateful logic across components.
 *
 * HOW TO USE:
 *   const { session, markExerciseComplete } = useWorkoutSession();
 */
export function useWorkoutSession(): WorkoutSessionContextType {
  const context = useContext(WorkoutSessionContext);

  // Throw an error if used outside the Provider
  // This helps catch bugs during development
  if (context === undefined) {
    throw new Error(
      'useWorkoutSession must be used within a WorkoutSessionProvider'
    );
  }

  return context;
}
