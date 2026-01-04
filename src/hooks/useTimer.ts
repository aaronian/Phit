/**
 * useTimer Hook
 *
 * A custom React hook for timer functionality.
 * Provides both stopwatch (count up) and countdown modes.
 *
 * WHAT IS A HOOK?
 * Hooks are functions that let you "hook into" React features like state.
 * Custom hooks let you reuse stateful logic across components.
 * Any function starting with "use" is a hook by convention.
 *
 * USAGE:
 *   const timer = useTimer();
 *
 *   timer.start();        // Start counting
 *   timer.pause();        // Pause
 *   timer.reset();        // Reset to 0
 *   timer.setCountdown(60000);  // Set 60 second countdown
 *
 *   timer.elapsedMs;      // Current time in milliseconds
 *   timer.isRunning;      // Whether timer is active
 *   timer.formatted;      // Time as "MM:SS.ms" string
 */

import { useState, useRef, useCallback, useEffect } from 'react';

interface UseTimerReturn {
  // State
  elapsedMs: number;
  isRunning: boolean;
  isCountdown: boolean;
  isComplete: boolean; // True when countdown reaches 0

  // Formatted time string
  formatted: string;

  // Actions
  start: () => void;
  pause: () => void;
  reset: () => void;
  setCountdown: (durationMs: number) => void;
  setStopwatch: () => void;
}

/**
 * Format milliseconds into a readable time string
 *
 * @param ms - Milliseconds to format
 * @returns Formatted string like "01:32.45"
 */
function formatTime(ms: number): string {
  // Ensure we don't show negative time
  const absMs = Math.max(0, ms);

  const minutes = Math.floor(absMs / 60000);
  const seconds = Math.floor((absMs % 60000) / 1000);
  const centiseconds = Math.floor((absMs % 1000) / 10);

  // Pad with zeros: 01:05.03
  const minStr = minutes.toString().padStart(2, '0');
  const secStr = seconds.toString().padStart(2, '0');
  const csStr = centiseconds.toString().padStart(2, '0');

  return `${minStr}:${secStr}.${csStr}`;
}

export function useTimer(): UseTimerReturn {
  // Current elapsed time in milliseconds
  const [elapsedMs, setElapsedMs] = useState(0);

  // Whether the timer is currently running
  const [isRunning, setIsRunning] = useState(false);

  // Countdown mode settings
  const [isCountdown, setIsCountdown] = useState(false);
  const [countdownTargetMs, setCountdownTargetMs] = useState(0);

  // We use useRef for the interval ID because:
  // 1. We need to persist it across renders
  // 2. Changing it shouldn't trigger a re-render
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Track when the timer was started (for accurate time calculation)
  const startTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);

  // Calculate if countdown is complete
  const isComplete = isCountdown && elapsedMs >= countdownTargetMs;

  // Start the timer
  const start = useCallback(() => {
    if (isRunning) return; // Already running

    setIsRunning(true);

    // Record when we started (accounting for any previous elapsed time)
    startTimeRef.current = Date.now() - pausedAtRef.current;

    // Update every 10ms for smooth display
    // setInterval runs a function repeatedly at a given interval
    intervalRef.current = setInterval(() => {
      const newElapsed = Date.now() - startTimeRef.current;
      setElapsedMs(newElapsed);

      // Check if countdown complete
      if (isCountdown && newElapsed >= countdownTargetMs) {
        // Stop the timer
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setIsRunning(false);
        setElapsedMs(countdownTargetMs); // Ensure we show exactly 0:00
      }
    }, 10);
  }, [isRunning, isCountdown, countdownTargetMs]);

  // Pause the timer
  const pause = useCallback(() => {
    if (!isRunning) return;

    setIsRunning(false);
    pausedAtRef.current = elapsedMs;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [isRunning, elapsedMs]);

  // Reset the timer to 0
  const reset = useCallback(() => {
    setIsRunning(false);
    setElapsedMs(0);
    pausedAtRef.current = 0;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Switch to countdown mode with a specific duration
  const setCountdown = useCallback((durationMs: number) => {
    reset();
    setIsCountdown(true);
    setCountdownTargetMs(durationMs);
  }, [reset]);

  // Switch to stopwatch mode (count up)
  const setStopwatch = useCallback(() => {
    reset();
    setIsCountdown(false);
  }, [reset]);

  // Cleanup on unmount
  // useEffect with an empty dependency array runs once on mount
  // The returned function runs on unmount (cleanup)
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Format the display time
  // For countdown, show remaining time instead of elapsed
  const displayMs = isCountdown
    ? Math.max(0, countdownTargetMs - elapsedMs)
    : elapsedMs;

  return {
    elapsedMs: displayMs,
    isRunning,
    isCountdown,
    isComplete,
    formatted: formatTime(displayMs),
    start,
    pause,
    reset,
    setCountdown,
    setStopwatch,
  };
}
