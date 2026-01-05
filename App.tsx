/**
 * App.tsx - Main Entry Point with Navigation
 *
 * Sets up:
 * - React Navigation with bottom tabs
 * - SafeAreaProvider for safe area handling
 * - WorkoutSessionProvider for global workout state
 * - Sync service for background Firestore sync
 */
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { WorkoutSessionProvider, useWorkoutSession } from './src/contexts/WorkoutSessionContext';
import { initializeSyncService } from './src/services/syncService';
import HomeScreen from './src/screens/HomeScreen';
import WorkoutScreen from './src/screens/WorkoutScreen';

// Define the tab navigator param list for type safety
export type RootTabParamList = {
  Home: undefined;
  Workout: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

// Custom dark theme for navigation
const DarkTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#121212',
    card: '#1C1C1E',
    text: '#FFFFFF',
    border: '#2C2C2E',
    primary: '#4CAF50',
  },
};

/**
 * TabNavigator - Bottom tab navigation
 *
 * Shows:
 * - Home tab (always visible)
 * - Workout tab (highlighted when session is active)
 */
function TabNavigator() {
  const { session } = useWorkoutSession();
  const hasActiveSession = session !== null;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Text style={[styles.tabIcon, { color }]}>🏠</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Workout"
        component={WorkoutScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <View style={styles.workoutTabIcon}>
              <Text style={[styles.tabIcon, { color: hasActiveSession ? '#4CAF50' : color }]}>
                💪
              </Text>
              {hasActiveSession && <View style={styles.activeIndicator} />}
            </View>
          ),
          tabBarLabel: hasActiveSession ? 'Active' : 'Workout',
        }}
      />
    </Tab.Navigator>
  );
}

/**
 * App - Root component
 *
 * Wraps the app with providers:
 * 1. SafeAreaProvider - handles notch/safe areas
 * 2. NavigationContainer - React Navigation root
 * 3. WorkoutSessionProvider - workout state management
 *
 * Also initializes background sync service for Firestore.
 */
export default function App() {
  // Initialize sync service on app start
  // The service handles AppState changes internally (starts/stops sync on foreground/background)
  useEffect(() => {
    const cleanup = initializeSyncService();
    return cleanup;
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={DarkTheme}>
        <WorkoutSessionProvider>
          <StatusBar style="light" />
          <TabNavigator />
        </WorkoutSessionProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#1C1C1E',
    borderTopColor: '#2C2C2E',
    borderTopWidth: 1,
    paddingTop: 8,
    paddingBottom: 8,
    height: 60,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  tabIcon: {
    fontSize: 24,
  },
  workoutTabIcon: {
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    top: -2,
    right: -6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
  },
});
