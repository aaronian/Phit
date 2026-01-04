/**
 * SectionButton Component
 *
 * WHAT IS THIS?
 * A single button in the side panel representing one workout section
 * (e.g., Warmup, Rehab, Strength, Cooldown). It displays:
 * - A progress indicator (empty, half-filled, or filled circle)
 * - The section name
 * - A progress count (e.g., "2/5" meaning 2 of 5 exercises complete)
 *
 * VISUAL STATES:
 * - Not started (0 done): Empty circle (outline only)
 * - In progress (1+ done): Half-filled circle
 * - Complete (all done): Filled green circle
 * - Active section: Has a highlighted background
 *
 * WHY SEPARATE COMPONENT?
 * Breaking this out from the main SidePanel keeps code organized and makes
 * it easier to understand, test, and modify independently. This follows
 * React's principle of small, focused components.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { ProgressState, SectionName } from '../../types';

// Define what props this component accepts
// TypeScript interfaces help catch errors and provide autocomplete
interface SectionButtonProps {
  /** The name of the section to display */
  name: SectionName;

  /** How many exercises have been completed in this section */
  completed: number;

  /** Total number of exercises in this section */
  total: number;

  /** Current progress state for the visual indicator */
  state: ProgressState;

  /** Whether this section is currently being viewed/active */
  isActive: boolean;

  /** Function to call when the button is pressed */
  onPress: () => void;
}

/**
 * SectionButton Component
 *
 * Renders a tappable button showing section progress.
 * Uses TouchableOpacity for press feedback (button dims slightly when pressed).
 */
export function SectionButton({
  name,
  completed,
  total,
  state,
  isActive,
  onPress,
}: SectionButtonProps) {
  return (
    // TouchableOpacity provides visual feedback when pressed
    // activeOpacity controls how dim the button gets (0.7 = 70% opacity)
    <TouchableOpacity
      style={[
        styles.container,
        // Conditionally add active background if this section is selected
        // The spread syntax with && adds the style only when isActive is true
        isActive && styles.activeContainer,
      ]}
      onPress={onPress}
      // accessibilityLabel helps screen readers describe the button
      accessibilityLabel={`${name} section, ${completed} of ${total} exercises complete`}
      accessibilityRole="button"
    >
      {/* Progress Indicator - shows visual state of section completion */}
      <ProgressIndicator state={state} />

      {/* Section info container - holds name and count */}
      <View style={styles.textContainer}>
        {/* Section name (e.g., "Warmup", "Strength") */}
        <Text style={styles.sectionName}>{name}</Text>

        {/* Progress count (e.g., "(2/5)") */}
        <Text style={styles.progressCount}>
          ({completed}/{total})
        </Text>
      </View>
    </TouchableOpacity>
  );
}

/**
 * ProgressIndicator Component
 *
 * WHAT IS THIS?
 * A small internal component that renders the circular progress indicator.
 * Keeping it separate makes the SectionButton code cleaner and easier to read.
 *
 * VISUAL REPRESENTATION:
 * - not_started: Empty circle (just an outline)
 * - in_progress: Half-filled circle (using a clever clipping technique)
 * - complete: Fully filled green circle
 */
interface ProgressIndicatorProps {
  state: ProgressState;
}

function ProgressIndicator({ state }: ProgressIndicatorProps) {
  return (
    <View style={styles.indicatorContainer}>
      {/* Base circle - always shows the outline */}
      <View
        style={[
          styles.indicator,
          // Add filled background for complete state
          state === 'complete' && styles.indicatorComplete,
        ]}
      >
        {/*
          Half-fill effect for in_progress state
          We create this by placing a smaller half-circle inside
          This is positioned to cover half of the parent circle
        */}
        {state === 'in_progress' && (
          <View style={styles.halfFill} />
        )}
      </View>
    </View>
  );
}

/**
 * Styles
 *
 * StyleSheet.create is React Native's way of defining styles.
 * It's similar to CSS but uses JavaScript objects and camelCase properties.
 *
 * Benefits of StyleSheet.create over inline styles:
 * 1. Performance: Styles are processed once, not on every render
 * 2. Validation: RN validates style properties at creation time
 * 3. Organization: All styles in one place, easy to maintain
 */
const styles = StyleSheet.create({
  // Main container for the button
  container: {
    flexDirection: 'row', // Arrange children horizontally (indicator + text)
    alignItems: 'center', // Center children vertically
    paddingVertical: 12, // Space above and below
    paddingHorizontal: 16, // Space left and right
    borderRadius: 8, // Rounded corners
  },

  // Additional styles when section is active/selected
  activeContainer: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)', // Light green transparent background
  },

  // Container for the circular progress indicator
  indicatorContainer: {
    width: 24, // Fixed width for consistent alignment
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Base circle style
  indicator: {
    width: 18,
    height: 18,
    borderRadius: 9, // Half of width/height makes a perfect circle
    borderWidth: 2,
    borderColor: '#4CAF50', // Green border
    backgroundColor: 'transparent', // Empty by default
    overflow: 'hidden', // Required for the half-fill effect to clip properly
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Filled circle for complete state
  indicatorComplete: {
    backgroundColor: '#4CAF50', // Solid green fill
  },

  // Half-circle fill for in_progress state
  // This creates a vertical half by positioning a rectangle
  halfFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '50%', // Only covers left half
    backgroundColor: '#4CAF50',
  },

  // Container for text elements
  textContainer: {
    marginLeft: 12, // Space between indicator and text
    flex: 1, // Take remaining horizontal space
  },

  // Section name styling
  sectionName: {
    fontSize: 16,
    fontWeight: '600', // Semi-bold
    color: '#FFFFFF', // White text for dark theme
    marginBottom: 2, // Small gap before count
  },

  // Progress count styling (e.g., "(2/5)")
  progressCount: {
    fontSize: 13,
    color: '#A0A0A0', // Lighter gray for secondary info
  },
});
