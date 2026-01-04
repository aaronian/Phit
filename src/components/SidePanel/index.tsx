/**
 * SidePanel Component
 *
 * WHAT IS THIS?
 * The side navigation panel for the workout app. It provides a visual overview
 * of workout progress and allows users to quickly jump between sections.
 *
 * STRUCTURE (from design spec):
 * ┌────────────┐
 * │  PHIT      │  <- App logo/name
 * ├────────────┤
 * │  ● Warmup  │  <- Section buttons with progress
 * │    (3/3)   │
 * │  ◐ Rehab   │
 * │    (2/5)   │
 * │  ○ Strength│
 * │    (0/6)   │
 * │  ○ Cooldown│
 * │    (0/3)   │
 * ├────────────┤
 * │  ⏱ 42:15   │  <- Total workout timer
 * └────────────┘
 *
 * KEY BEHAVIORS:
 * 1. Tap a section to jump to it (calls onSectionPress)
 * 2. Shows progress state: empty (not started), half (in progress), filled (complete)
 * 3. Active/current section has a highlighted background
 * 4. Timer counts up from when the workout session started
 *
 * REACT NATIVE CONCEPTS USED:
 * - View: The basic container component (like div in web)
 * - Text: For displaying text
 * - TouchableOpacity: Makes children tappable with press feedback
 * - StyleSheet: For defining styles
 * - useEffect: For side effects like timers
 * - useState: For component-local state (timer display)
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useWorkoutSession } from '../../contexts/WorkoutSessionContext';
import { SectionButton } from './SectionButton';

// Props interface defines what the parent component must/can pass in
interface SidePanelProps {
  /**
   * Callback function called when user taps a section.
   * The parent component uses this to scroll to that section.
   *
   * @param sectionIndex - The index of the tapped section (0, 1, 2, etc.)
   */
  onSectionPress: (sectionIndex: number) => void;

  /**
   * Index of the currently visible/active section.
   * Used to highlight the active section in the panel.
   */
  activeSectionIndex: number;
}

/**
 * SidePanel Component
 *
 * Main export of this module. Renders the complete side navigation panel
 * including header, section buttons, and workout timer.
 */
export function SidePanel({ onSectionPress, activeSectionIndex }: SidePanelProps) {
  // Get workout session data from context
  // This hook gives us access to the shared workout state
  const { session, sectionProgress } = useWorkoutSession();

  // Local state for the displayed timer text
  // We update this every second while the workout is active
  const [timerDisplay, setTimerDisplay] = useState('00:00');

  /**
   * Timer Effect
   *
   * WHAT IS useEffect?
   * useEffect runs code after the component renders. It's used for "side effects"
   * like timers, data fetching, or subscriptions that happen outside React's
   * normal render flow.
   *
   * HOW THIS TIMER WORKS:
   * 1. When session exists and isn't completed, we start an interval
   * 2. Every second, we calculate elapsed time and update the display
   * 3. The cleanup function (return statement) stops the interval when
   *    the component unmounts or session changes
   *
   * DEPENDENCY ARRAY [session]:
   * The array at the end tells React when to re-run this effect.
   * It will re-run whenever 'session' changes.
   */
  useEffect(() => {
    // Don't start timer if no session or if workout is already done
    if (!session || session.completedAt) {
      setTimerDisplay('00:00');
      return;
    }

    /**
     * Calculate and format elapsed time
     * This function runs immediately and then every second
     */
    const updateTimer = () => {
      // Get current time in milliseconds
      const now = Date.now();

      // Calculate how many milliseconds have passed since workout started
      // session.startedAt could be a Date object or Firestore Timestamp
      const startTime = session.startedAt instanceof Date
        ? session.startedAt.getTime()
        : new Date(session.startedAt).getTime();

      const elapsedMs = now - startTime;

      // Convert to minutes and seconds
      const totalSeconds = Math.floor(elapsedMs / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;

      // Format as MM:SS with leading zeros
      // padStart ensures we always have 2 digits (e.g., "05" instead of "5")
      const formatted = `${minutes.toString().padStart(2, '0')}:${seconds
        .toString()
        .padStart(2, '0')}`;

      setTimerDisplay(formatted);
    };

    // Run immediately to avoid 1-second delay on first render
    updateTimer();

    // Set up interval to update every second (1000ms)
    const intervalId = setInterval(updateTimer, 1000);

    // Cleanup function: This runs when component unmounts or before
    // the effect runs again. It prevents memory leaks and zombie timers.
    return () => {
      clearInterval(intervalId);
    };
  }, [session]); // Re-run effect when session changes

  return (
    // Main container for the entire side panel
    <View style={styles.container}>
      {/* Header section with app name */}
      <View style={styles.header}>
        <Text style={styles.logo}>PHIT</Text>
      </View>

      {/*
        Section list - maps over section progress to create buttons

        WHAT IS .map()?
        Array.map() transforms each item in an array into something else.
        Here, we transform each SectionProgress object into a SectionButton component.

        KEY PROP:
        React needs a unique 'key' for each item in a list to efficiently
        update the UI. We use sectionId since it's guaranteed unique.
      */}
      <View style={styles.sectionList}>
        {sectionProgress.map((section, index) => (
          <SectionButton
            key={section.sectionId}
            name={section.name}
            completed={section.completed}
            total={section.total}
            state={section.state}
            isActive={index === activeSectionIndex}
            // Arrow function creates a new function that calls onSectionPress with index
            // This is how we pass the correct index to the callback
            onPress={() => onSectionPress(index)}
          />
        ))}
      </View>

      {/*
        Spacer - pushes timer to the bottom

        flex: 1 makes this view take up all available space between
        the section list and the timer, effectively pushing the timer down.
      */}
      <View style={styles.spacer} />

      {/* Timer section at the bottom */}
      <View style={styles.timerContainer}>
        {/* Timer icon - using a simple stopwatch emoji */}
        <Text style={styles.timerIcon}>⏱</Text>
        <Text style={styles.timerText}>{timerDisplay}</Text>
      </View>
    </View>
  );
}

/**
 * Styles
 *
 * Organized by component section for easy maintenance.
 * Using a dark theme to match typical workout app aesthetics.
 */
const styles = StyleSheet.create({
  // Main container - takes full height with dark background
  container: {
    flex: 1, // Take up full height
    backgroundColor: '#1A1A1A', // Dark gray background
    paddingTop: 20, // Space at top (safe area consideration)
    paddingBottom: 20, // Space at bottom
  },

  // Header section containing the logo
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333333', // Subtle separator line
    marginBottom: 8, // Space before section list
  },

  // App logo text styling
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50', // Green to match progress indicators
    letterSpacing: 2, // Slight letter spacing for style
  },

  // Container for all section buttons
  sectionList: {
    paddingHorizontal: 8, // Slight horizontal padding
  },

  // Flexible spacer to push timer to bottom
  spacer: {
    flex: 1,
  },

  // Timer container at the bottom
  timerContainer: {
    flexDirection: 'row', // Icon and time side by side
    alignItems: 'center',
    justifyContent: 'center', // Center horizontally
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#333333', // Separator line above timer
    marginHorizontal: 16,
  },

  // Timer icon (stopwatch emoji)
  timerIcon: {
    fontSize: 18,
    marginRight: 8, // Space between icon and time
  },

  // Timer text display
  timerText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    // Use monospace-style font for consistent digit width
    // This prevents the timer from "jumping" as digits change
    fontVariant: ['tabular-nums'],
  },
});

// Default export for convenient importing
// Can be imported as: import { SidePanel } from './SidePanel'
// or: import SidePanel from './SidePanel'
export default SidePanel;
