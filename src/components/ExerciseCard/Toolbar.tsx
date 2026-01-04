/**
 * Toolbar Component
 *
 * A row of action buttons for quick access to exercise-related features:
 * - Timer: Opens a rest timer or stopwatch
 * - Notes: Opens notes editor for the exercise
 * - History: Shows previous performance data for this exercise
 *
 * Each button triggers a callback with the tool type, allowing parent
 * components to handle the specific action (e.g., opening a modal).
 */

import React, { useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';

// Type for the available toolbar tools
type ToolType = 'timer' | 'notes' | 'history';

// Props interface for Toolbar component
interface ToolbarProps {
  // ID of the exercise this toolbar belongs to
  exerciseId: string;
  // Callback when any toolbar button is pressed
  onToolbarPress: (exerciseId: string, tool: ToolType) => void;
}

// Configuration for each toolbar button
interface ToolButton {
  id: ToolType;
  icon: string;
  label: string;
}

// Define the toolbar buttons with their icons and labels
const TOOL_BUTTONS: ToolButton[] = [
  { id: 'timer', icon: '⏱', label: 'Timer' },
  { id: 'notes', icon: '📝', label: 'Notes' },
  { id: 'history', icon: '📊', label: 'History' },
];

const Toolbar: React.FC<ToolbarProps> = ({ exerciseId, onToolbarPress }) => {
  /**
   * Creates a handler for a specific tool button.
   * Uses useCallback to memoize the handler for performance.
   */
  const createPressHandler = useCallback(
    (tool: ToolType) => () => {
      onToolbarPress(exerciseId, tool);
    },
    [exerciseId, onToolbarPress]
  );

  return (
    <View style={styles.container}>
      {TOOL_BUTTONS.map((button, index) => (
        <React.Fragment key={button.id}>
          {/* Add separator between buttons */}
          {index > 0 && <View style={styles.separator} />}

          <TouchableOpacity
            style={styles.button}
            onPress={createPressHandler(button.id)}
            activeOpacity={0.6}
            accessibilityLabel={`${button.label} button`}
            accessibilityHint={`Opens the ${button.label.toLowerCase()} feature`}
          >
            <Text style={styles.icon}>{button.icon}</Text>
            <Text style={styles.label}>{button.label}</Text>
          </TouchableOpacity>
        </React.Fragment>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  // Container row with border separators
  container: {
    flexDirection: 'row',
    backgroundColor: '#FAFAFA',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E0E0E0',
  },
  // Individual button styling
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  // Vertical separator between buttons
  separator: {
    width: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 8,
  },
  // Emoji icon styling
  icon: {
    fontSize: 16,
  },
  // Button label text
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
  },
});

export default Toolbar;
