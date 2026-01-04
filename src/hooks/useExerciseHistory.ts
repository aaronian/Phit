/**
 * useExerciseHistory Hook
 *
 * Fetches and caches exercise history from Firebase.
 * Shows past performance for a specific exercise.
 *
 * USAGE:
 *   const { history, isLoading, refresh } = useExerciseHistory(userId, exerciseId);
 */

import { useState, useEffect, useCallback } from 'react';
import { getExerciseHistory } from '../services/workoutService';
import type { ExerciseLog } from '../types';

interface UseExerciseHistoryReturn {
  history: ExerciseLog[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useExerciseHistory(
  userId: string | null,
  exerciseId: string | null
): UseExerciseHistoryReturn {
  const [history, setHistory] = useState<ExerciseLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch history from Firebase
  const fetchHistory = useCallback(async () => {
    // Don't fetch if we don't have required IDs
    if (!userId || !exerciseId) {
      setHistory([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await getExerciseHistory(userId, exerciseId, 5);
      setHistory(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setIsLoading(false);
    }
  }, [userId, exerciseId]);

  // Fetch when IDs change
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    history,
    isLoading,
    error,
    refresh: fetchHistory,
  };
}
