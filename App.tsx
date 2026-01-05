/**
 * App.tsx - Main Entry Point
 */
import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { WorkoutSessionProvider, useWorkoutSession } from './src/contexts/WorkoutSessionContext';
import WorkoutScreen from './src/screens/WorkoutScreen';
import { sampleWorkout } from './src/data/sampleWorkout';

function HomeScreen() {
  const { startSession, session, isLoading } = useWorkoutSession();
  const [isStarting, setIsStarting] = useState(false);

  const handleStartWorkout = async () => {
    setIsStarting(true);
    try {
      await startSession('demo-user-123', sampleWorkout);
    } catch (error) {
      console.error('Failed to start workout:', error);
    } finally {
      setIsStarting(false);
    }
  };

  if (session) {
    return <WorkoutScreen />;
  }

  return (
    <SafeAreaView style={styles.homeContainer}>
      <View style={styles.homeHeader}>
        <Text style={styles.logoText}>PHIT</Text>
        <Text style={styles.tagline}>Your Personal Workout Tracker</Text>
      </View>

      <View style={styles.workoutCard}>
        <Text style={styles.workoutName}>{sampleWorkout.name}</Text>
        <Text style={styles.workoutDetails}>
          {sampleWorkout.sections.length} sections •{' '}
          {sampleWorkout.sections.reduce((acc, s) => acc + s.exercises.length, 0)} exercises
        </Text>

        <View style={styles.sectionPreview}>
          {sampleWorkout.sections.map((section) => (
            <View key={section.id} style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>{section.name}</Text>
              <Text style={styles.sectionBadgeCount}>{section.exercises.length}</Text>
            </View>
          ))}
        </View>

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

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Tap a section in the side panel to jump between exercises
        </Text>
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <WorkoutSessionProvider>
        <StatusBar style="light" />
        <View style={styles.root}>
          <HomeScreen />
        </View>
      </WorkoutSessionProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#121212',
  },
  homeContainer: {
    flex: 1,
    backgroundColor: '#121212',
    paddingHorizontal: 20,
  },
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
