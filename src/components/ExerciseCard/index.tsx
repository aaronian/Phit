/**
 * ExerciseCard Component
 *
 * Main card component for displaying and interacting with an exercise during a workout.
 * Displays a YouTube video, toolbar with quick actions, data table for logging sets,
 * and action buttons for completing the exercise.
 *
 * Layout:
 * - YouTube video player (16:9 aspect ratio)
 * - Toolbar row (Timer, Notes, History buttons)
 * - Data table (Set#, Reps, Load, RPE columns)
 * - Action buttons (Mark All, Done)
 */

import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Animated } from 'react-native';
import { Exercise, ExerciseLog } from '../../types';
import VideoPlayer from './VideoPlayer';
import Toolbar from './Toolbar';
import DataTable from './DataTable';

// Props interface for the ExerciseCard component
interface ExerciseCardProps {
  // The exercise definition (name, video, default sets)
  exercise: Exercise;
  // The current log data for this exercise (sets with reps/load/rpe)
  exerciseLog: ExerciseLog;
  // Whether the exercise has been marked complete
  isComplete: boolean;
  // Callback when a data cell is tapped for editing
  onCellPress: (exerciseId: string, setNumber: number, field: 'reps' | 'load' | 'rpe') => void;
  // Callback when a toolbar button is pressed
  onToolbarPress: (exerciseId: string, tool: 'timer' | 'notes' | 'history') => void;
  // Callback to copy first row values to all rows
  onMarkAll: (exerciseId: string) => void;
  // Callback when exercise is marked done
  onDone: (exerciseId: string) => void;
  // Callback to add a new set row
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
  // Animation value for the checkmark when exercise is completed
  const [checkmarkOpacity] = useState(new Animated.Value(0));
  const [checkmarkScale] = useState(new Animated.Value(0.5));

  /**
   * Triggers the green checkmark animation when exercise is marked done.
   * Uses a parallel animation for fade-in and scale-up effect.
   */
  const animateCheckmark = useCallback(() => {
    // Reset animation values
    checkmarkOpacity.setValue(0);
    checkmarkScale.setValue(0.5);

    // Run parallel animations for smooth appearance
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

  /**
   * Handles the Done button press.
   * Triggers animation if not already complete, then calls the callback.
   */
  const handleDonePress = useCallback(() => {
    if (!isComplete) {
      animateCheckmark();
    }
    onDone(exercise.id);
  }, [isComplete, animateCheckmark, onDone, exercise.id]);

  /**
   * Handles the Mark All button press.
   * Copies the first set's values to all other sets.
   */
  const handleMarkAllPress = useCallback(() => {
    onMarkAll(exercise.id);
  }, [onMarkAll, exercise.id]);

  /**
   * Handles the Add Set button press.
   * Adds a new empty set row to the exercise.
   */
  const handleAddSetPress = useCallback(() => {
    onAddSet(exercise.id);
  }, [onAddSet, exercise.id]);

  return (
    <View style={[styles.container, isComplete && styles.containerComplete]}>
      {/* Exercise title */}
      <View style={styles.header}>
        <Text style={styles.exerciseName}>{exercise.name}</Text>
        {/* Animated checkmark overlay when complete */}
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

      {/* YouTube video player section */}
      <VideoPlayer videoId={exercise.youtubeVideoId} />

      {/* Toolbar with Timer, Notes, History buttons */}
      <Toolbar
        exerciseId={exercise.id}
        onToolbarPress={onToolbarPress}
      />

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
    </View>
  );
};

const styles = StyleSheet.create({
  // Main card container with shadow and rounded corners
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  // Green border highlight when exercise is complete
  containerComplete: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  // Header row with exercise name
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F5F5F5',
  },
  // Exercise name text styling
  exerciseName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    flex: 1,
  },
  // Container for animated checkmark
  checkmarkContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Checkmark icon styling
  checkmark: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  // Bottom action buttons row
  actionRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  // Mark All button styling (secondary action)
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
  // Done button styling (primary action)
  doneButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Done button when exercise is complete
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
});

export default ExerciseCard;
