/**
 * ExerciseCard Component
 *
 * Main card component for displaying and interacting with an exercise.
 * Layout: Video (collapsible) -> Data table -> Action buttons -> Notes/History
 */
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Animated } from 'react-native';
import { Exercise, ExerciseLog } from '../../types';
import VideoPlayer from './VideoPlayer';
import DataTable from './DataTable';

interface ExerciseCardProps {
  exercise: Exercise;
  exerciseLog: ExerciseLog;
  isComplete: boolean;
  onCellPress: (exerciseId: string, setNumber: number, field: 'reps' | 'load' | 'rpe') => void;
  onToolbarPress: (exerciseId: string, tool: 'timer' | 'notes' | 'history') => void;
  onMarkAll: (exerciseId: string) => void;
  onDone: (exerciseId: string) => void;
  onAddSet: (exerciseId: string) => void;
}

const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  exerciseLog,
  isComplete,
  onCellPress,
  onToolbarPress,
  onMarkAll,
  onDone,
  onAddSet,
}) => {
  const [checkmarkOpacity] = useState(new Animated.Value(0));
  const [checkmarkScale] = useState(new Animated.Value(0.5));

  const animateCheckmark = useCallback(() => {
    checkmarkOpacity.setValue(0);
    checkmarkScale.setValue(0.5);
    Animated.parallel([
      Animated.timing(checkmarkOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(checkmarkScale, {
        toValue: 1,
        friction: 4,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [checkmarkOpacity, checkmarkScale]);

  const handleDonePress = useCallback(() => {
    if (!isComplete) {
      animateCheckmark();
    }
    onDone(exercise.id);
  }, [isComplete, animateCheckmark, onDone, exercise.id]);

  const handleMarkAllPress = useCallback(() => {
    onMarkAll(exercise.id);
  }, [onMarkAll, exercise.id]);

  const handleAddSetPress = useCallback(() => {
    onAddSet(exercise.id);
  }, [onAddSet, exercise.id]);

  return (
    <View style={[styles.container, isComplete && styles.containerComplete]}>
      {/* Exercise title */}
      <View style={styles.header}>
        <Text style={styles.exerciseName}>{exercise.name}</Text>
        {isComplete && (
          <Animated.View
            style={[
              styles.checkmarkContainer,
              {
                opacity: checkmarkOpacity,
                transform: [{ scale: checkmarkScale }],
              },
            ]}
          >
            <Text style={styles.checkmark}>✓</Text>
          </Animated.View>
        )}
      </View>

      {/* Collapsible video player */}
      <VideoPlayer videoId={exercise.youtubeVideoId} />

      {/* Data table for logging sets */}
      <DataTable
        exerciseId={exercise.id}
        sets={exerciseLog.sets}
        onCellPress={onCellPress}
        onAddSet={handleAddSetPress}
      />

      {/* Action buttons row */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.markAllButton}
          onPress={handleMarkAllPress}
          activeOpacity={0.7}
        >
          <Text style={styles.markAllButtonText}>Mark All</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.doneButton, isComplete && styles.doneButtonComplete]}
          onPress={handleDonePress}
          activeOpacity={0.7}
        >
          <Text style={[styles.doneButtonText, isComplete && styles.doneButtonTextComplete]}>
            {isComplete ? 'Done ✓' : 'Done'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notes & History at bottom */}
      <View style={styles.bottomTools}>
        <TouchableOpacity
          style={styles.bottomToolButton}
          onPress={() => onToolbarPress(exercise.id, 'notes')}
          activeOpacity={0.7}
        >
          <Text style={styles.bottomToolIcon}>📝</Text>
          <Text style={styles.bottomToolText}>Notes</Text>
        </TouchableOpacity>

        <View style={styles.toolSeparator} />

        <TouchableOpacity
          style={styles.bottomToolButton}
          onPress={() => onToolbarPress(exercise.id, 'history')}
          activeOpacity={0.7}
        >
          <Text style={styles.bottomToolIcon}>📊</Text>
          <Text style={styles.bottomToolText}>History</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 12,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  containerComplete: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F5F5F5',
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    flex: 1,
  },
  checkmarkContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  markAllButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markAllButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  doneButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonComplete: {
    backgroundColor: '#4CAF50',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  doneButtonTextComplete: {
    color: '#FFFFFF',
  },
  // Bottom tools (Notes & History)
  bottomTools: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  bottomToolButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  toolSeparator: {
    width: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 8,
  },
  bottomToolIcon: {
    fontSize: 14,
  },
  bottomToolText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666666',
  },
});

export default ExerciseCard;
