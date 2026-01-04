/**
 * TimerSheet.tsx - Stopwatch and Countdown Timer
 *
 * WHAT THIS COMPONENT DOES:
 * This bottom sheet provides two timer modes for workout tracking:
 *
 * 1. STOPWATCH MODE:
 *    - Counts up from 0:00.00
 *    - Start/Pause, Reset, and Lap buttons
 *    - Useful for timing exercises or rest periods
 *
 * 2. COUNTDOWN MODE:
 *    - Counts down from a preset time
 *    - Quick presets: 1:00, 1:30, 2:00
 *    - Custom time option
 *    - Useful for timed rest intervals
 *
 * TIMER PATTERNS:
 * We use setInterval for the timer, but with a key consideration:
 * - Store the START TIME, not elapsed time increments
 * - Calculate elapsed = now - startTime on each tick
 * - This prevents drift from interval timing inaccuracies
 *
 * STATE MANAGEMENT:
 * The timer state (running, elapsed, etc.) could be lifted to context
 * if you want the timer to persist when the sheet closes. For now,
 * it resets when the sheet is dismissed.
 */

import React, {
  useCallback,
  useState,
  useMemo,
  useRef,
  useEffect,
  forwardRef,
} from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import type { TimerMode } from '../../types';

/**
 * Props Interface
 */
interface TimerSheetProps {
  exerciseName?: string;
  onDismiss?: () => void;
  // Optional: save timer state to context/parent
  onTimerUpdate?: (elapsedMs: number, isRunning: boolean) => void;
}

/**
 * Lap Record Interface
 */
interface LapRecord {
  lapNumber: number;
  lapTime: number; // Time for this lap (ms)
  totalTime: number; // Total elapsed at this lap (ms)
}

/**
 * Quick Countdown Presets (in milliseconds)
 */
const COUNTDOWN_PRESETS = [
  { label: '1:00', value: 60000 },
  { label: '1:30', value: 90000 },
  { label: '2:00', value: 120000 },
];

/**
 * Format milliseconds to MM:SS.CC display
 *
 * @param ms - Time in milliseconds
 * @param showCentiseconds - Whether to show .CC precision
 */
function formatTime(ms: number, showCentiseconds = true): string {
  // Ensure non-negative
  const totalMs = Math.max(0, ms);

  const minutes = Math.floor(totalMs / 60000);
  const seconds = Math.floor((totalMs % 60000) / 1000);
  const centiseconds = Math.floor((totalMs % 1000) / 10);

  const minuteStr = minutes.toString().padStart(2, '0');
  const secondStr = seconds.toString().padStart(2, '0');

  if (showCentiseconds) {
    const centiStr = centiseconds.toString().padStart(2, '0');
    return `${minuteStr}:${secondStr}.${centiStr}`;
  }

  return `${minuteStr}:${secondStr}`;
}

/**
 * TimerSheet Component
 */
const TimerSheet = forwardRef<BottomSheet, TimerSheetProps>(
  ({ exerciseName = 'Exercise Timer', onDismiss, onTimerUpdate }, ref) => {
    // Timer mode: stopwatch counts up, countdown counts down
    const [mode, setMode] = useState<TimerMode>('stopwatch');

    // Timer state
    const [isRunning, setIsRunning] = useState(false);
    const [elapsedMs, setElapsedMs] = useState(0);
    const [targetMs, setTargetMs] = useState(60000); // Default 1 minute for countdown

    // Lap tracking (stopwatch only)
    const [laps, setLaps] = useState<LapRecord[]>([]);
    const [lastLapTime, setLastLapTime] = useState(0);

    // Refs for accurate timing
    const startTimeRef = useRef<number>(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Sheet snap points
    const snapPoints = useMemo(() => ['60%'], []);

    /**
     * Start the timer
     *
     * We store the start time and calculate elapsed on each tick.
     * This is more accurate than incrementing a counter.
     */
    const startTimer = useCallback(() => {
      // Calculate the correct start time based on current elapsed
      startTimeRef.current = Date.now() - elapsedMs;
      setIsRunning(true);

      // Update every 10ms for smooth centisecond display
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const newElapsed = now - startTimeRef.current;

        if (mode === 'countdown') {
          // For countdown, check if we've reached zero
          const remaining = targetMs - newElapsed;
          if (remaining <= 0) {
            setElapsedMs(targetMs);
            setIsRunning(false);
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            // TODO: Trigger vibration/sound when countdown completes
          } else {
            setElapsedMs(newElapsed);
          }
        } else {
          // Stopwatch: just count up
          setElapsedMs(newElapsed);
        }
      }, 10);
    }, [elapsedMs, mode, targetMs]);

    /**
     * Pause the timer
     */
    const pauseTimer = useCallback(() => {
      setIsRunning(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }, []);

    /**
     * Reset the timer
     */
    const resetTimer = useCallback(() => {
      pauseTimer();
      setElapsedMs(0);
      setLaps([]);
      setLastLapTime(0);
    }, [pauseTimer]);

    /**
     * Record a lap (stopwatch mode only)
     */
    const recordLap = useCallback(() => {
      if (!isRunning || mode !== 'stopwatch') return;

      const lapTime = elapsedMs - lastLapTime;
      setLaps((current) => [
        ...current,
        {
          lapNumber: current.length + 1,
          lapTime,
          totalTime: elapsedMs,
        },
      ]);
      setLastLapTime(elapsedMs);
    }, [isRunning, mode, elapsedMs, lastLapTime]);

    /**
     * Set countdown target from preset
     */
    const setCountdownPreset = useCallback(
      (ms: number) => {
        resetTimer();
        setMode('countdown');
        setTargetMs(ms);
      },
      [resetTimer]
    );

    /**
     * Toggle between stopwatch and countdown modes
     */
    const toggleMode = useCallback(
      (newMode: TimerMode) => {
        resetTimer();
        setMode(newMode);
      },
      [resetTimer]
    );

    /**
     * Clean up interval on unmount
     */
    useEffect(() => {
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }, []);

    /**
     * Notify parent of timer updates
     */
    useEffect(() => {
      onTimerUpdate?.(elapsedMs, isRunning);
    }, [elapsedMs, isRunning, onTimerUpdate]);

    /**
     * Handle Sheet Changes
     */
    const handleSheetChange = useCallback(
      (index: number) => {
        if (index === -1) {
          // Optionally pause timer when sheet closes
          // pauseTimer();
          onDismiss?.();
        }
      },
      [onDismiss]
    );

    /**
     * Render Backdrop
     */
    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          pressBehavior="close"
        />
      ),
      []
    );

    /**
     * Calculate display time based on mode
     */
    const displayTime = useMemo(() => {
      if (mode === 'countdown') {
        // Show remaining time
        return formatTime(Math.max(0, targetMs - elapsedMs));
      }
      // Stopwatch: show elapsed time
      return formatTime(elapsedMs);
    }, [mode, elapsedMs, targetMs]);

    /**
     * Check if countdown is complete
     */
    const isCountdownComplete = mode === 'countdown' && elapsedMs >= targetMs;

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        onChange={handleSheetChange}
        backdropComponent={renderBackdrop}
        enablePanDownToClose={true}
        handleIndicatorStyle={styles.handleIndicator}
        backgroundStyle={styles.sheetBackground}
      >
        <BottomSheetView style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{exerciseName}</Text>
          </View>

          {/* Mode Toggle */}
          <View style={styles.modeToggle}>
            <TouchableOpacity
              style={[
                styles.modeButton,
                mode === 'stopwatch' && styles.modeButtonActive,
              ]}
              onPress={() => toggleMode('stopwatch')}
            >
              <Text
                style={[
                  styles.modeButtonText,
                  mode === 'stopwatch' && styles.modeButtonTextActive,
                ]}
              >
                Stopwatch
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modeButton,
                mode === 'countdown' && styles.modeButtonActive,
              ]}
              onPress={() => toggleMode('countdown')}
            >
              <Text
                style={[
                  styles.modeButtonText,
                  mode === 'countdown' && styles.modeButtonTextActive,
                ]}
              >
                Countdown
              </Text>
            </TouchableOpacity>
          </View>

          {/* Timer Display */}
          <View
            style={[
              styles.display,
              isCountdownComplete && styles.displayComplete,
            ]}
          >
            <Text
              style={[
                styles.displayText,
                isCountdownComplete && styles.displayTextComplete,
              ]}
            >
              {displayTime}
            </Text>
          </View>

          {/* Stopwatch Controls */}
          {mode === 'stopwatch' && (
            <View style={styles.controls}>
              {/* Start/Pause Button */}
              <TouchableOpacity
                style={[
                  styles.controlButton,
                  isRunning ? styles.pauseButton : styles.startButton,
                ]}
                onPress={isRunning ? pauseTimer : startTimer}
              >
                <Text style={styles.controlButtonText}>
                  {isRunning ? 'Pause' : 'Start'}
                </Text>
              </TouchableOpacity>

              {/* Reset Button */}
              <TouchableOpacity
                style={[styles.controlButton, styles.resetButton]}
                onPress={resetTimer}
              >
                <Text style={styles.controlButtonText}>Reset</Text>
              </TouchableOpacity>

              {/* Lap Button */}
              <TouchableOpacity
                style={[
                  styles.controlButton,
                  styles.lapButton,
                  !isRunning && styles.controlButtonDisabled,
                ]}
                onPress={recordLap}
                disabled={!isRunning}
              >
                <Text style={styles.controlButtonText}>Lap</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Countdown Controls */}
          {mode === 'countdown' && (
            <View style={styles.countdownControls}>
              {/* Start/Pause if timer is set */}
              <View style={styles.controls}>
                <TouchableOpacity
                  style={[
                    styles.controlButton,
                    isRunning ? styles.pauseButton : styles.startButton,
                  ]}
                  onPress={isRunning ? pauseTimer : startTimer}
                >
                  <Text style={styles.controlButtonText}>
                    {isRunning ? 'Pause' : 'Start'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.controlButton, styles.resetButton]}
                  onPress={resetTimer}
                >
                  <Text style={styles.controlButtonText}>Reset</Text>
                </TouchableOpacity>
              </View>

              {/* Preset Buttons */}
              <View style={styles.presetSection}>
                <Text style={styles.presetLabel}>Rest:</Text>
                <View style={styles.presetRow}>
                  {COUNTDOWN_PRESETS.map((preset) => (
                    <TouchableOpacity
                      key={preset.value}
                      style={[
                        styles.presetButton,
                        targetMs === preset.value && styles.presetButtonActive,
                      ]}
                      onPress={() => setCountdownPreset(preset.value)}
                    >
                      <Text
                        style={[
                          styles.presetButtonText,
                          targetMs === preset.value &&
                            styles.presetButtonTextActive,
                        ]}
                      >
                        {preset.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Custom Time Button */}
                <TouchableOpacity
                  style={styles.customButton}
                  onPress={() => {
                    // TODO: Open a time picker for custom countdown
                    // For now, just set to 3 minutes
                    setCountdownPreset(180000);
                  }}
                >
                  <Text style={styles.customButtonText}>Custom</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Lap List (stopwatch only) */}
          {mode === 'stopwatch' && laps.length > 0 && (
            <View style={styles.lapList}>
              <Text style={styles.lapListTitle}>Laps</Text>
              {laps
                .slice()
                .reverse()
                .map((lap) => (
                  <View key={lap.lapNumber} style={styles.lapItem}>
                    <Text style={styles.lapNumber}>Lap {lap.lapNumber}</Text>
                    <Text style={styles.lapTime}>
                      {formatTime(lap.lapTime, false)}
                    </Text>
                    <Text style={styles.lapTotal}>
                      {formatTime(lap.totalTime, false)}
                    </Text>
                  </View>
                ))}
            </View>
          )}
        </BottomSheetView>
      </BottomSheet>
    );
  }
);

/**
 * Styles
 */
const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handleIndicator: {
    backgroundColor: '#5C5C5E',
    width: 40,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Mode toggle (stopwatch/countdown)
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
    padding: 2,
    marginBottom: 20,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  modeButtonActive: {
    backgroundColor: '#3A3A3C',
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  modeButtonTextActive: {
    color: '#FFFFFF',
  },
  // Timer display
  display: {
    backgroundColor: '#2C2C2E',
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  displayComplete: {
    backgroundColor: '#34C759', // Green when complete
  },
  displayText: {
    fontSize: 56,
    fontWeight: '200',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
    fontFamily: 'Menlo', // Monospace for stable width
  },
  displayTextComplete: {
    color: '#FFFFFF',
  },
  // Control buttons
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  controlButton: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 40, // Pill shape
    minWidth: 90,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#34C759', // Green
  },
  pauseButton: {
    backgroundColor: '#FF9500', // Orange
  },
  resetButton: {
    backgroundColor: '#2C2C2E',
  },
  lapButton: {
    backgroundColor: '#2C2C2E',
  },
  controlButtonDisabled: {
    opacity: 0.5,
  },
  controlButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Countdown-specific controls
  countdownControls: {
    marginBottom: 16,
  },
  presetSection: {
    marginTop: 8,
  },
  presetLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 8,
  },
  presetRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 12,
  },
  presetButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
  },
  presetButtonActive: {
    backgroundColor: '#0A84FF',
  },
  presetButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  presetButtonTextActive: {
    color: '#FFFFFF',
  },
  customButton: {
    paddingVertical: 12,
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
    alignItems: 'center',
  },
  customButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8E8E93',
  },
  // Lap list
  lapList: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 12,
    maxHeight: 150,
  },
  lapListTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 8,
  },
  lapItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#3A3A3C',
  },
  lapNumber: {
    fontSize: 14,
    color: '#FFFFFF',
    flex: 1,
  },
  lapTime: {
    fontSize: 14,
    color: '#0A84FF',
    fontVariant: ['tabular-nums'],
    flex: 1,
    textAlign: 'center',
  },
  lapTotal: {
    fontSize: 14,
    color: '#8E8E93',
    fontVariant: ['tabular-nums'],
    flex: 1,
    textAlign: 'right',
  },
});

TimerSheet.displayName = 'TimerSheet';

export default TimerSheet;
