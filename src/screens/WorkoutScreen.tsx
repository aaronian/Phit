/**
 * WorkoutScreen - The Main Workout View
 */
import React, { useRef, useState, useCallback, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  LayoutChangeEvent,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Text,
  Alert,
} from 'react-native';
import { useWorkoutSession } from '../contexts/WorkoutSessionContext';
import { SidePanel } from '../components/SidePanel';
import ExerciseCard from '../components/ExerciseCard';
import {
  LoadKeypad,
  NotesSheet,
  HistorySheet,
  type HistoryEntry,
} from '../components/overlays';
import type { ExerciseLog, LoadUnit } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDE_PANEL_WIDTH_EXPANDED = 130;
const SIDE_PANEL_WIDTH_COLLAPSED = 50;

interface ActiveCell {
  exerciseId: string;
  setNumber: number;
  field: 'reps' | 'load';
  currentValue: number | null;
}

interface ActiveTool {
  exerciseId: string;
  tool: 'notes' | 'history';
  exerciseName: string;
}

export default function WorkoutScreen() {
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

  const scrollViewRef = useRef<ScrollView>(null);

  // Overlay visibility state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showLoadKeypad, setShowLoadKeypad] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [activeCell, setActiveCell] = useState<ActiveCell | null>(null);
  const [activeTool, setActiveTool] = useState<ActiveTool | null>(null);
  const [sectionPositions, setSectionPositions] = useState<number[]>([]);
  const [exercisePositions, setExercisePositions] = useState<Map<string, number>>(new Map());
  const [historyData, setHistoryData] = useState<HistoryEntry[]>([]);

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

  const getExerciseLog = useCallback(
    (exerciseId: string): ExerciseLog | undefined => {
      return session?.exerciseLogs.find((log) => log.exerciseId === exerciseId);
    },
    [session]
  );

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const scrollY = event.nativeEvent.contentOffset.y;
      for (let i = sectionPositions.length - 1; i >= 0; i--) {
        if (scrollY >= sectionPositions[i] - 50) {
          if (activeSectionIndex !== i) setActiveSectionIndex(i);
          break;
        }
      }
    },
    [sectionPositions, activeSectionIndex]
  );

  const handleSectionPress = useCallback(
    (sectionIndex: number) => {
      if (sectionPositions[sectionIndex] !== undefined) {
        scrollViewRef.current?.scrollTo({ y: sectionPositions[sectionIndex], animated: true });
        setActiveSectionIndex(sectionIndex);
      }
    },
    [sectionPositions]
  );

  const handleExerciseLayout = useCallback(
    (exerciseId: string, sectionIndex: number, isFirst: boolean) =>
      (event: LayoutChangeEvent) => {
        const { y } = event.nativeEvent.layout;
        setExercisePositions((prev) => {
          const next = new Map(prev);
          next.set(exerciseId, y);
          return next;
        });
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

      if (field === 'reps' || field === 'load') {
        setShowLoadKeypad(true);
      }
    },
    [getExerciseLog]
  );

  const handleToolbarPress = useCallback(
    (exerciseId: string, tool: 'timer' | 'notes' | 'history') => {
      const exerciseItem = allExercises.find((e) => e.exercise.id === exerciseId);
      const exerciseName = exerciseItem?.exercise.name || 'Exercise';

      setActiveTool({ exerciseId, tool, exerciseName });

      if (tool === 'notes') {
        setShowNotes(true);
      } else if (tool === 'history') {
        setHistoryData([
          { id: '1', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), sets: 3, reps: 8, load: 145, loadUnit: 'lb', rpe: 8.0 },
          { id: '2', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), sets: 3, reps: 8, load: 140, loadUnit: 'lb', rpe: 7.5 },
        ]);
        setShowHistory(true);
      }
    },
    [allExercises]
  );

  const handleMarkAll = useCallback((exerciseId: string) => {
    markAllSetsFromFirst(exerciseId);
  }, [markAllSetsFromFirst]);

  const handleDone = useCallback(
    async (exerciseId: string) => {
      await markExerciseComplete(exerciseId);
      const currentIndex = allExercises.findIndex((e) => e.exercise.id === exerciseId);

      if (currentIndex < allExercises.length - 1) {
        const nextExercise = allExercises[currentIndex + 1];
        const nextPosition = exercisePositions.get(nextExercise.exercise.id);
        if (nextPosition !== undefined) {
          setTimeout(() => {
            scrollViewRef.current?.scrollTo({ y: nextPosition, animated: true });
          }, 300);
        }
        if (nextExercise.sectionIndex !== allExercises[currentIndex].sectionIndex) {
          setActiveSectionIndex(nextExercise.sectionIndex);
        }
      } else {
        Alert.alert('Workout Complete!', 'Great job finishing your workout!', [
          { text: 'Save & Exit', onPress: () => finishWorkout() },
          { text: 'Review', style: 'cancel' },
        ]);
      }
    },
    [allExercises, exercisePositions, markExerciseComplete, finishWorkout]
  );

  const handleAddSet = useCallback((exerciseId: string) => {
    Alert.alert('Coming Soon', 'Add Set functionality will be implemented');
  }, []);

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

      setShowLoadKeypad(false);
      setActiveCell(null);
    },
    [activeCell, updateSetData, setDefaultLoadUnit]
  );

  const handleNotesSave = useCallback(
    (notes: string) => {
      if (!activeTool) return;
      console.log('Saving notes for', activeTool.exerciseId, ':', notes);
    },
    [activeTool]
  );

  const handleHistorySelect = useCallback(
    (entry: HistoryEntry) => {
      if (!activeTool) return;
      console.log('Auto-fill from history:', entry);
      setShowHistory(false);
      Alert.alert('Auto-Fill', `Would fill with ${entry.sets}x${entry.reps} @ ${entry.load} ${entry.loadUnit}`);
    },
    [activeTool]
  );

  const handleLoadKeypadDismiss = useCallback(() => {
    setShowLoadKeypad(false);
    setActiveCell(null);
  }, []);

  const handleNotesDismiss = useCallback(() => {
    setShowNotes(false);
    setActiveTool(null);
  }, []);

  const handleHistoryDismiss = useCallback(() => {
    setShowHistory(false);
    setActiveTool(null);
  }, []);

  if (!workout || !session) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No workout loaded</Text>
        <Text style={styles.emptySubtext}>Start a workout to see it here</Text>
      </View>
    );
  }

  const sidePanelWidth = sidebarCollapsed ? SIDE_PANEL_WIDTH_COLLAPSED : SIDE_PANEL_WIDTH_EXPANDED;

  return (
    <View style={styles.container}>
      <View style={[styles.sidePanel, { width: sidePanelWidth }]}>
        <SidePanel
          onSectionPress={handleSectionPress}
          activeSectionIndex={activeSectionIndex}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator
      >
        {allExercises.map((item) => {
          const exerciseLog = getExerciseLog(item.exercise.id);
          return (
            <View
              key={item.exercise.id}
              onLayout={handleExerciseLayout(item.exercise.id, item.sectionIndex, item.isFirstInSection)}
            >
              {item.isFirstInSection && (
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionHeaderText}>{item.sectionName}</Text>
                  <Text style={styles.sectionHeaderCount}>
                    {sectionProgress[item.sectionIndex]?.completed || 0}/{sectionProgress[item.sectionIndex]?.total || 0}
                  </Text>
                </View>
              )}
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
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Overlays */}
      <LoadKeypad
        visible={showLoadKeypad}
        initialValue={activeCell?.currentValue}
        initialUnit={defaultLoadUnit}
        onConfirm={handleLoadConfirm}
        onDismiss={handleLoadKeypadDismiss}
      />

      <NotesSheet
        visible={showNotes}
        exerciseName={activeTool?.exerciseName || 'Exercise'}
        initialNotes=""
        onSave={handleNotesSave}
        onDismiss={handleNotesDismiss}
      />

      <HistorySheet
        visible={showHistory}
        exerciseName={activeTool?.exerciseName || 'Exercise'}
        history={historyData}
        onSelectHistory={handleHistorySelect}
        onDismiss={handleHistoryDismiss}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: '#121212' },
  sidePanel: { backgroundColor: '#1A1A1A' },
  scrollView: { flex: 1 },
  scrollContent: { paddingTop: 8 },
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
  sectionHeaderText: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  sectionHeaderCount: { fontSize: 14, fontWeight: '500', color: '#8E8E93' },
  bottomPadding: { height: 100 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' },
  emptyText: { fontSize: 20, fontWeight: '600', color: '#FFF', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#8E8E93' },
});
