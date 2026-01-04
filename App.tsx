/**
 * App.tsx - Main Entry Point
 *
 * This is the root component of your React Native app. It sets up:
 * 1. GestureHandlerRootView - Required for gesture-based interactions
 * 2. WorkoutSessionProvider - Provides workout state to all components
 * 3. SafeAreaProvider - Handles notches and safe areas on modern phones
 *
 * COMPONENT HIERARCHY:
 * App
 * └── GestureHandlerRootView (enables gestures for bottom sheets)
 *     └── SafeAreaProvider (handles screen safe areas)
 *         └── WorkoutSessionProvider (provides workout state)
 *             └── MainNavigator (handles screen navigation)
 *
 * GESTURE HANDLER:
 * React Native Gesture Handler is a library that replaces the default
 * touch handling system with a more performant one. It's required for
 * @gorhom/bottom-sheet to work properly.
 *
 * SAFE AREA:
 * Modern phones have notches, home indicators, and rounded corners.
 * SafeAreaProvider helps position content to avoid these areas.
 */

import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { WorkoutSessionProvider, useWorkoutSession } from './src/contexts/WorkoutSessionContext';
import WorkoutScreen from './src/screens/WorkoutScreen';
import { sampleWorkout } from './src/data/sampleWorkout';

/**
 * HomeScreen - Simple screen to start a workout
 *
 * In a full app, this would be a list of available workouts.
 * For now, it's just a button to start the sample workout.
 */
function HomeScreen() {
  const { startSession, session, isLoading } = useWorkoutSession();
  const [isStarting, setIsStarting] = useState(false);

  /**
   * Handle starting the workout
   *
   * In a real app, you'd get the userId from Firebase Auth.
   * For demo purposes, we use a mock user ID.
   */
  const handleStartWorkout = async () => {
    setIsStarting(true);
    try {
      // Mock user ID - in real app, get from Firebase Auth
      await startSession('demo-user-123', sampleWorkout);
    } catch (error) {
      console.error('Failed to start workout:', error);
    } finally {
      setIsStarting(false);
    }
  };

  // If a session is active, show the workout screen
  if (session) {
    return <WorkoutScreen />;
  }

  // Show the home screen with start button
  return (
    <SafeAreaView style={styles.homeContainer}>
      {/* App Header */}
      <View style={styles.homeHeader}>
        <Text style={styles.logoText}>PHIT</Text>
        <Text style={styles.tagline}>Your Personal Workout Tracker</Text>
      </View>

      {/* Workout Card */}
      <View style={styles.workoutCard}>
        <Text style={styles.workoutName}>{sampleWorkout.name}</Text>
        <Text style={styles.workoutDetails}>
          {sampleWorkout.sections.length} sections •{' '}
          {sampleWorkout.sections.reduce((acc, s) => acc + s.exercises.length, 0)} exercises
        </Text>

        {/* Section Preview */}
        <View style={styles.sectionPreview}>
          {sampleWorkout.sections.map((section) => (
            <View key={section.id} style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>{section.name}</Text>
              <Text style={styles.sectionBadgeCount}>
                {section.exercises.length}
              </Text>
            </View>
          ))}
        </View>

        {/* Start Button */}
        <TouchableOpacity
          style={styles.startButton}
          onPress={handleStartWorkout}
          disabled={isStarting || isLoading}
          activeOpacity={0.8}
        >
          {isStarting || isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.startButtonText}>Start Workout</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Tap a section in the side panel to jump between exercises
        </Text>
      </View>
    </SafeAreaView>
  );
}

/**
 * App Component - Root of the application
 */
export default function App() {
  return (
    // GestureHandlerRootView must wrap the entire app for gestures to work
    <GestureHandlerRootView style={styles.root}>
      {/* SafeAreaProvider handles notches and safe areas */}
      <SafeAreaProvider>
        {/* WorkoutSessionProvider makes workout state available everywhere */}
        <WorkoutSessionProvider>
          {/* StatusBar configuration */}
          <StatusBar style="light" />

          {/* Main app content */}
          <HomeScreen />
        </WorkoutSessionProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/**
 * Styles
 */
const styles = StyleSheet.create({
  // Root container - must have flex: 1 for GestureHandler
  root: {
    flex: 1,
    backgroundColor: '#121212',
  },
  // Home screen container
  homeContainer: {
    flex: 1,
    backgroundColor: '#121212',
    paddingHorizontal: 20,
  },
  // Header section
  homeHeader: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 30,
  },
  logoText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#4CAF50',
    letterSpacing: 4,
  },
  tagline: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 8,
  },
  // Workout card
  workoutCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
  },
  workoutName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  workoutDetails: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 16,
  },
  // Section preview badges
  sectionPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  sectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
  },
  sectionBadgeText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  sectionBadgeCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
  },
  // Start button
  startButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: '#5C5C5E',
    textAlign: 'center',
  },
});
