/**
 * WorkoutScreen - The Main Workout View
 *
 * WHAT THIS SCREEN DOES:
 * This is the heart of the app - the screen where users actually do their workout.
 * It displays:
 * - A side panel for navigation between workout sections
 * - A vertical scrolling list of all exercises
 * - Overlays for data entry (weight, RPE, timer, notes, history)
 *
 * ARCHITECTURE:
 * ┌─────────────────────────────────────────────────┐
 * │                 WorkoutScreen                    │
 * ├────────┬────────────────────────────────────────┤
 * │        │                                        │
 * │  Side  │   ScrollView                           │
 * │  Panel │   ┌────────────────────────────────┐   │
 * │        │   │ ExerciseCard 1                 │   │
 * │ 80px   │   │ ExerciseCard 2                 │   │
 * │ width  │   │ ...                            │   │
 * │        │   └────────────────────────────────┘   │
 * │        │                                        │
 * └────────┴────────────────────────────────────────┘
 *           ↑ Overlays render on top of everything
 *
 * KEY PATTERNS:
 * 1. useRef for ScrollView - allows programmatic scrolling
 * 2. useRef for BottomSheets - allows opening/closing overlays
 * 3. Tracking scroll position to highlight active section
 * 4. Auto-scroll when exercise is completed
 */

import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  LayoutChangeEvent,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import { useWorkoutSession } from '../contexts/WorkoutSessionContext';
import { SidePanel } from '../components/SidePanel';
import ExerciseCard from '../components/ExerciseCard';
import {
  LoadKeypad,
  RPEPicker,
  TimerSheet,
  NotesSheet,
  HistorySheet,
  type HistoryEntry,
} from '../components/overlays';
import type { Exercise, ExerciseLog, SetLog, LoadUnit } from '../types';

// Get screen dimensions
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Side panel width
const SIDE_PANEL_WIDTH = 100;

// Main content width (screen minus side panel)
const CONTENT_WIDTH = SCREEN_WIDTH - SIDE_PANEL_WIDTH;

/**
 * State for tracking which overlay is open and for which cell
 *
 * When a user taps a cell (reps, load, or RPE), we need to track:
 * - Which exercise they're editing
 * - Which set number
 * - Which field (reps/load/rpe)
 */
interface ActiveCell {
  exerciseId: string;
  setNumber: number;
  field: 'reps' | 'load' | 'rpe';
  currentValue: number | null;
}

/**
 * State for tracking which toolbar action is open
 */
interface ActiveTool {
  exerciseId: string;
  tool: 'timer' | 'notes' | 'history';
  exerciseName: string;
}

/**
 * WorkoutScreen Component
 */
export default function WorkoutScreen() {
  // Get workout data from context
  const {
    workout,
    session,
    sectionProgress,
    updateSetData,
    markExerciseComplete,
    markAllSetsFromFirst,
    finishWorkout,
    defaultLoadUnit,
    setDefaultLoadUnit,
  } = useWorkoutSession();

  // Refs for scroll control
  const scrollViewRef = useRef<ScrollView>(null);

  // Refs for bottom sheet overlays
  const loadKeypadRef = useRef<BottomSheet>(null);
  const rpePickerRef = useRef<BottomSheet>(null);
  const timerSheetRef = useRef<BottomSheet>(null);
  const notesSheetRef = useRef<BottomSheet>(null);
  const historySheetRef = useRef<BottomSheet>(null);

  // Track which section is currently visible (for side panel highlight)
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);

  // Track the currently active cell being edited
  const [activeCell, setActiveCell] = useState<ActiveCell | null>(null);

  // Track the currently active tool
  const [activeTool, setActiveTool] = useState<ActiveTool | null>(null);

  // Track exercise card positions for scroll-to functionality
  // Maps section index to Y position
  const [sectionPositions, setSectionPositions] = useState<number[]>([]);

  // Track individual exercise positions for auto-scroll after completion
  const [exercisePositions, setExercisePositions] = useState<Map<string, number>>(new Map());

  // Mock history data (in real app, this would come from the hook)
  const [historyData, setHistoryData] = useState<HistoryEntry[]>([]);

  /**
   * Flatten all exercises from all sections into a single array
   * This makes it easier to render in the ScrollView
   *
   * useMemo ensures this only recalculates when workout changes
   */
  const allExercises = useMemo(() => {
    if (!workout) return [];

    return workout.sections.flatMap((section, sectionIndex) =>
      section.exercises.map((exercise, exerciseIndex) => ({
        exercise,
        sectionIndex,
        sectionName: section.name,
        isFirstInSection: exerciseIndex === 0,
        isLastInSection: exerciseIndex === section.exercises.length - 1,
      }))
    );
  }, [workout]);

  /**
   * Get the exercise log for a specific exercise
   */
  const getExerciseLog = useCallback(
    (exerciseId: string): ExerciseLog | undefined => {
      return session?.exerciseLogs.find((log) => log.exerciseId === exerciseId);
    },
    [session]
  );

  /**
   * Handle scroll events to update active section
   *
   * As the user scrolls, we determine which section is currently
   * most visible and highlight it in the side panel.
   */
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const scrollY = event.nativeEvent.contentOffset.y;

      // Find which section the current scroll position falls into
      for (let i = sectionPositions.length - 1; i >= 0; i--) {
        if (scrollY >= sectionPositions[i] - 50) {
          // 50px buffer
          if (activeSectionIndex !== i) {
            setActiveSectionIndex(i);
          }
          break;
        }
      }
    },
    [sectionPositions, activeSectionIndex]
  );

  /**
   * Handle side panel section press
   * Scrolls to the first exercise of the selected section
   */
  const handleSectionPress = useCallback(
    (sectionIndex: number) => {
      if (sectionPositions[sectionIndex] !== undefined) {
        scrollViewRef.current?.scrollTo({
          y: sectionPositions[sectionIndex],
          animated: true,
        });
        setActiveSectionIndex(sectionIndex);
      }
    },
    [sectionPositions]
  );

  /**
   * Handle exercise card layout to track positions
   *
   * When each exercise card renders, we record its Y position
   * so we can scroll to it later (for section jumps or auto-scroll)
   */
  const handleExerciseLayout = useCallback(
    (exerciseId: string, sectionIndex: number, isFirst: boolean) =>
      (event: LayoutChangeEvent) => {
        const { y } = event.nativeEvent.layout;

        // Track individual exercise positions
        setExercisePositions((prev) => {
          const next = new Map(prev);
          next.set(exerciseId, y);
          return next;
        });

        // Track section start positions (first exercise of each section)
        if (isFirst) {
          setSectionPositions((prev) => {
            const next = [...prev];
            next[sectionIndex] = y;
            return next;
          });
        }
      },
    []
  );

  /**
   * Handle cell press - opens the appropriate overlay
   */
  const handleCellPress = useCallback(
    (exerciseId: string, setNumber: number, field: 'reps' | 'load' | 'rpe') => {
      const exerciseLog = getExerciseLog(exerciseId);
      const setLog = exerciseLog?.sets.find((s) => s.setNumber === setNumber);

      let currentValue: number | null = null;
      if (setLog) {
        if (field === 'reps') currentValue = setLog.reps;
        else if (field === 'load') currentValue = setLog.load;
        else if (field === 'rpe') currentValue = setLog.rpe;
      }

      setActiveCell({ exerciseId, setNumber, field, currentValue });

      // Open the appropriate overlay
      if (field === 'reps' || field === 'load') {
        loadKeypadRef.current?.snapToIndex(0);
      } else if (field === 'rpe') {
        rpePickerRef.current?.snapToIndex(0);
      }
    },
    [getExerciseLog]
  );

  /**
   * Handle toolbar press - opens timer, notes, or history
   */
  const handleToolbarPress = useCallback(
    (exerciseId: string, tool: 'timer' | 'notes' | 'history') => {
      const exerciseItem = allExercises.find((e) => e.exercise.id === exerciseId);
      const exerciseName = exerciseItem?.exercise.name || 'Exercise';

      setActiveTool({ exerciseId, tool, exerciseName });

      // Open the appropriate overlay
      if (tool === 'timer') {
        timerSheetRef.current?.snapToIndex(0);
      } else if (tool === 'notes') {
        notesSheetRef.current?.snapToIndex(0);
      } else if (tool === 'history') {
        // In a real app, you'd fetch history here
        // For demo, we'll show empty or mock data
        setHistoryData([
          {
            id: '1',
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            sets: 3,
            reps: 8,
            load: 145,
            loadUnit: 'lb',
            rpe: 8.0,
          },
          {
            id: '2',
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            sets: 3,
            reps: 8,
            load: 140,
            loadUnit: 'lb',
            rpe: 7.5,
          },
        ]);
        historySheetRef.current?.snapToIndex(0);
      }
    },
    [allExercises]
  );

  /**
   * Handle Mark All - copies first set values to all sets
   */
  const handleMarkAll = useCallback(
    (exerciseId: string) => {
      markAllSetsFromFirst(exerciseId);
    },
    [markAllSetsFromFirst]
  );

  /**
   * Handle Done - marks exercise complete and auto-scrolls
   */
  const handleDone = useCallback(
    async (exerciseId: string) => {
      await markExerciseComplete(exerciseId);

      // Find the next exercise to scroll to
      const currentIndex = allExercises.findIndex(
        (e) => e.exercise.id === exerciseId
      );

      if (currentIndex < allExercises.length - 1) {
        // Scroll to next exercise
        const nextExercise = allExercises[currentIndex + 1];
        const nextPosition = exercisePositions.get(nextExercise.exercise.id);

        if (nextPosition !== undefined) {
          // Small delay to let the completion animation play
          setTimeout(() => {
            scrollViewRef.current?.scrollTo({
              y: nextPosition,
              animated: true,
            });
          }, 300);
        }

        // If next exercise is in a new section, update active section
        if (nextExercise.sectionIndex !== allExercises[currentIndex].sectionIndex) {
          setActiveSectionIndex(nextExercise.sectionIndex);
        }
      } else {
        // Last exercise - show completion modal
        Alert.alert(
          'Workout Complete! 🎉',
          'Great job finishing your workout!',
          [
            {
              text: 'Save & Exit',
              onPress: () => finishWorkout(),
            },
            {
              text: 'Review',
              style: 'cancel',
            },
          ]
        );
      }
    },
    [allExercises, exercisePositions, markExerciseComplete, finishWorkout]
  );

  /**
   * Handle Add Set - adds a new set to an exercise
   */
  const handleAddSet = useCallback(
    (exerciseId: string) => {
      // This would need to be implemented in the context/service
      // For now, we'll show an alert
      Alert.alert('Coming Soon', 'Add Set functionality will be implemented');
    },
    []
  );

  /**
   * Handle Load Keypad confirm
   */
  const handleLoadConfirm = useCallback(
    async (value: number, unit: LoadUnit) => {
      if (!activeCell) return;

      const { exerciseId, setNumber, field } = activeCell;

      if (field === 'reps') {
        await updateSetData(exerciseId, setNumber, { reps: value });
      } else if (field === 'load') {
        await updateSetData(exerciseId, setNumber, { load: value, loadUnit: unit });
        setDefaultLoadUnit(unit);
      }

      loadKeypadRef.current?.close();
      setActiveCell(null);
    },
    [activeCell, updateSetData, setDefaultLoadUnit]
  );

  /**
   * Handle RPE Picker confirm
   */
  const handleRPEConfirm = useCallback(
    async (value: number) => {
      if (!activeCell) return;

      const { exerciseId, setNumber } = activeCell;
      await updateSetData(exerciseId, setNumber, { rpe: value });

      rpePickerRef.current?.close();
      setActiveCell(null);
    },
    [activeCell, updateSetData]
  );

  /**
   * Handle Notes save
   */
  const handleNotesSave = useCallback(
    (notes: string) => {
      if (!activeTool) return;
      // In a real app, save notes to the exercise
      console.log('Saving notes for', activeTool.exerciseId, ':', notes);
    },
    [activeTool]
  );

  /**
   * Handle History selection (auto-fill from past workout)
   */
  const handleHistorySelect = useCallback(
    (entry: HistoryEntry) => {
      if (!activeTool) return;
      // In a real app, auto-fill the current exercise's sets with these values
      console.log('Auto-fill from history:', entry);
      historySheetRef.current?.close();
      Alert.alert(
        'Auto-Fill',
        `Would fill with ${entry.sets}x${entry.reps} @ ${entry.load} ${entry.loadUnit}`
      );
    },
    [activeTool]
  );

  /**
   * Close overlays and clear active state
   */
  const handleOverlayDismiss = useCallback(() => {
    setActiveCell(null);
    setActiveTool(null);
  }, []);

  // If no workout is loaded, show placeholder
  if (!workout || !session) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No workout loaded</Text>
        <Text style={styles.emptySubtext}>
          Start a workout to see it here
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Side Panel */}
      <View style={styles.sidePanel}>
        <SidePanel
          onSectionPress={handleSectionPress}
          activeSectionIndex={activeSectionIndex}
        />
      </View>

      {/* Main Content - Scrollable Exercise List */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16} // ~60fps scroll tracking
        showsVerticalScrollIndicator={true}
      >
        {allExercises.map((item, index) => {
          const exerciseLog = getExerciseLog(item.exercise.id);

          return (
            <View
              key={item.exercise.id}
              onLayout={handleExerciseLayout(
                item.exercise.id,
                item.sectionIndex,
                item.isFirstInSection
              )}
            >
              {/* Section Header (shown before first exercise of each section) */}
              {item.isFirstInSection && (
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionHeaderText}>{item.sectionName}</Text>
                  <Text style={styles.sectionHeaderCount}>
                    {sectionProgress[item.sectionIndex]?.completed || 0}/
                    {sectionProgress[item.sectionIndex]?.total || 0}
                  </Text>
                </View>
              )}

              {/* Exercise Card */}
              <ExerciseCard
                exercise={item.exercise}
                exerciseLog={exerciseLog || { exerciseId: item.exercise.id, isComplete: false, sets: [] }}
                isComplete={exerciseLog?.isComplete || false}
                onCellPress={handleCellPress}
                onToolbarPress={handleToolbarPress}
                onMarkAll={handleMarkAll}
                onDone={handleDone}
                onAddSet={handleAddSet}
              />
            </View>
          );
        })}

        {/* Bottom padding for last exercise */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* ===== OVERLAYS ===== */}
      {/* These render on top of everything else */}

      {/* Load/Reps Keypad */}
      <LoadKeypad
        ref={loadKeypadRef}
        initialValue={activeCell?.currentValue}
        initialUnit={defaultLoadUnit}
        onConfirm={handleLoadConfirm}
        onDismiss={handleOverlayDismiss}
        onUnitChange={setDefaultLoadUnit}
      />

      {/* RPE Picker */}
      <RPEPicker
        ref={rpePickerRef}
        initialValue={activeCell?.currentValue}
        onConfirm={handleRPEConfirm}
        onDismiss={handleOverlayDismiss}
      />

      {/* Timer Sheet */}
      <TimerSheet
        ref={timerSheetRef}
        exerciseName={activeTool?.exerciseName}
        onDismiss={handleOverlayDismiss}
      />

      {/* Notes Sheet */}
      <NotesSheet
        ref={notesSheetRef}
        exerciseName={activeTool?.exerciseName || 'Exercise'}
        initialNotes=""
        onSave={handleNotesSave}
        onDismiss={handleOverlayDismiss}
      />

      {/* History Sheet */}
      <HistorySheet
        ref={historySheetRef}
        exerciseName={activeTool?.exerciseName || 'Exercise'}
        history={historyData}
        onSelectHistory={handleHistorySelect}
        onDismiss={handleOverlayDismiss}
      />
    </View>
  );
}

/**
 * Styles
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#121212',
  },
  // Side panel container
  sidePanel: {
    width: SIDE_PANEL_WIDTH,
    backgroundColor: '#1A1A1A',
  },
  // Scrollable main content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
  },
  // Section header (Warmup, Rehab, etc.)
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 16,
    marginHorizontal: 16,
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
  },
  sectionHeaderText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sectionHeaderCount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  // Extra padding at bottom so last exercise is scrollable
  bottomPadding: {
    height: 100,
  },
  // Empty state when no workout
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8E8E93',
  },
});
