/**
 * LoadKeypad.tsx - Number Keypad for Entering Weight
 *
 * WHAT THIS COMPONENT DOES:
 * This is a bottom sheet overlay that displays a numeric keypad for users
 * to enter weight values (like 135 lb for bench press). It includes:
 * - A unit toggle (lb/kg) that remembers the user's preference
 * - A display showing the current value being entered
 * - A numeric keypad with 0-9, decimal point, and backspace
 * - A Done button to confirm and close
 *
 * BOTTOM SHEET PATTERN:
 * Bottom sheets are overlays that slide up from the bottom of the screen.
 * They're common in mobile apps for focused input tasks because:
 * - They keep context visible (you can still see part of the screen behind)
 * - They're easy to dismiss with a swipe or tap outside
 * - They feel natural on mobile devices
 *
 * DEPENDENCIES:
 * - @gorhom/bottom-sheet: Handles the sliding sheet behavior
 * - react-native-reanimated: Powers smooth animations
 * - react-native-gesture-handler: Enables swipe gestures
 */

import React, { useCallback, useState, useMemo, forwardRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import type { LoadUnit } from '../../types';

// Get screen dimensions for responsive sizing
const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Props Interface
 *
 * These are the inputs this component accepts from its parent:
 * - initialValue: The weight value to show when the keypad opens
 * - initialUnit: Whether to show lb or kg (defaults to user preference)
 * - onConfirm: Called when user presses Done with the final value
 * - onDismiss: Called when user closes the sheet without confirming
 * - onUnitChange: Called when user toggles between lb/kg (to save preference)
 */
interface LoadKeypadProps {
  initialValue?: number | null;
  initialUnit?: LoadUnit;
  onConfirm: (value: number, unit: LoadUnit) => void;
  onDismiss?: () => void;
  onUnitChange?: (unit: LoadUnit) => void;
}

/**
 * LoadKeypad Component
 *
 * We use forwardRef here because the parent component needs to control
 * when this sheet opens and closes. The ref gives the parent access to
 * methods like snapToIndex(0) to open and close(-1) to close.
 */
const LoadKeypad = forwardRef<BottomSheet, LoadKeypadProps>(
  (
    { initialValue, initialUnit = 'lb', onConfirm, onDismiss, onUnitChange },
    ref
  ) => {
    // State for the value being entered (stored as string for easy manipulation)
    // We use string because it's easier to handle backspace and decimal input
    const [displayValue, setDisplayValue] = useState<string>(
      initialValue?.toString() ?? ''
    );

    // State for the selected unit (lb or kg)
    const [unit, setUnit] = useState<LoadUnit>(initialUnit);

    /**
     * Snap Points
     *
     * These define the heights the sheet can "snap" to.
     * '50%' means the sheet will take up half the screen.
     * useMemo ensures this array isn't recreated on every render.
     */
    const snapPoints = useMemo(() => ['50%'], []);

    /**
     * Handle Keypad Button Press
     *
     * This function is called whenever a user presses a keypad button.
     * useCallback memoizes the function so it's not recreated on every render,
     * which is important for performance with many buttons.
     */
    const handleKeyPress = useCallback((key: string) => {
      setDisplayValue((current) => {
        // Handle backspace - remove the last character
        if (key === 'backspace') {
          return current.slice(0, -1);
        }

        // Handle decimal point - only allow one decimal
        if (key === '.') {
          // Don't add another decimal if one already exists
          if (current.includes('.')) return current;
          // If empty, start with "0."
          if (current === '') return '0.';
          return current + '.';
        }

        // Handle number input
        // Limit to reasonable length (prevents overflow)
        if (current.length >= 7) return current;

        // Don't allow leading zeros (except for decimals like "0.5")
        if (current === '0' && key !== '.') {
          return key;
        }

        return current + key;
      });
    }, []);

    /**
     * Handle Unit Toggle
     *
     * Switches between lb and kg and notifies the parent
     * so the preference can be saved.
     */
    const handleUnitToggle = useCallback(() => {
      const newUnit = unit === 'lb' ? 'kg' : 'lb';
      setUnit(newUnit);
      // Notify parent to persist the preference
      onUnitChange?.(newUnit);
    }, [unit, onUnitChange]);

    /**
     * Handle Done Button
     *
     * Parses the string value to a number and calls the onConfirm callback.
     */
    const handleDone = useCallback(() => {
      const numericValue = parseFloat(displayValue) || 0;
      onConfirm(numericValue, unit);
    }, [displayValue, unit, onConfirm]);

    /**
     * Handle Sheet Changes
     *
     * Called whenever the sheet position changes.
     * Index -1 means the sheet is fully closed.
     */
    const handleSheetChange = useCallback(
      (index: number) => {
        if (index === -1) {
          // Sheet was closed (swiped down or tapped outside)
          onDismiss?.();
        }
      },
      [onDismiss]
    );

    /**
     * Render Backdrop
     *
     * The backdrop is the semi-transparent overlay behind the sheet.
     * Tapping it closes the sheet (disappearsOnIndex: -1).
     */
    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          // appearsOnIndex: backdrop appears when sheet opens to index 0
          appearsOnIndex={0}
          // disappearsOnIndex: backdrop disappears when sheet closes to index -1
          disappearsOnIndex={-1}
          // Enable tapping backdrop to close
          pressBehavior="close"
        />
      ),
      []
    );

    /**
     * Keypad Button Component
     *
     * A reusable button for the numeric keypad.
     * We define it inside this component because it uses handleKeyPress.
     */
    const KeypadButton = ({
      value,
      display,
    }: {
      value: string;
      display?: string;
    }) => (
      <TouchableOpacity
        style={styles.keypadButton}
        onPress={() => handleKeyPress(value)}
        // Accessibility: make buttons accessible to screen readers
        accessibilityLabel={display || value}
        accessibilityRole="button"
      >
        <Text style={styles.keypadButtonText}>{display || value}</Text>
      </TouchableOpacity>
    );

    return (
      <BottomSheet
        ref={ref}
        // Start closed (index -1 means closed)
        index={-1}
        snapPoints={snapPoints}
        onChange={handleSheetChange}
        backdropComponent={renderBackdrop}
        // Enable swipe to close
        enablePanDownToClose={true}
        // Style the sheet handle (the little bar at the top)
        handleIndicatorStyle={styles.handleIndicator}
        backgroundStyle={styles.sheetBackground}
      >
        <BottomSheetView style={styles.container}>
          {/* Header with title and unit toggle */}
          <View style={styles.header}>
            <Text style={styles.title}>Load</Text>
            {/* Unit Toggle Button */}
            <TouchableOpacity
              style={styles.unitToggle}
              onPress={handleUnitToggle}
              accessibilityLabel={`Switch to ${unit === 'lb' ? 'kilograms' : 'pounds'}`}
              accessibilityRole="switch"
            >
              <View
                style={[
                  styles.unitOption,
                  unit === 'lb' && styles.unitOptionActive,
                ]}
              >
                <Text
                  style={[
                    styles.unitText,
                    unit === 'lb' && styles.unitTextActive,
                  ]}
                >
                  lb
                </Text>
              </View>
              <View
                style={[
                  styles.unitOption,
                  unit === 'kg' && styles.unitOptionActive,
                ]}
              >
                <Text
                  style={[
                    styles.unitText,
                    unit === 'kg' && styles.unitTextActive,
                  ]}
                >
                  kg
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Display showing current value */}
          <View style={styles.display}>
            <Text style={styles.displayText}>
              {displayValue || '0'}
            </Text>
          </View>

          {/* Numeric Keypad Grid */}
          <View style={styles.keypad}>
            {/* Row 1: 1, 2, 3 */}
            <View style={styles.keypadRow}>
              <KeypadButton value="1" />
              <KeypadButton value="2" />
              <KeypadButton value="3" />
            </View>
            {/* Row 2: 4, 5, 6 */}
            <View style={styles.keypadRow}>
              <KeypadButton value="4" />
              <KeypadButton value="5" />
              <KeypadButton value="6" />
            </View>
            {/* Row 3: 7, 8, 9 */}
            <View style={styles.keypadRow}>
              <KeypadButton value="7" />
              <KeypadButton value="8" />
              <KeypadButton value="9" />
            </View>
            {/* Row 4: ., 0, backspace */}
            <View style={styles.keypadRow}>
              <KeypadButton value="." />
              <KeypadButton value="0" />
              <KeypadButton value="backspace" display="⌫" />
            </View>
          </View>

          {/* Done Button */}
          <TouchableOpacity
            style={styles.doneButton}
            onPress={handleDone}
            accessibilityLabel="Confirm weight"
            accessibilityRole="button"
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </BottomSheetView>
      </BottomSheet>
    );
  }
);

/**
 * Styles
 *
 * StyleSheet.create provides better performance than inline styles
 * and catches typos at runtime in development mode.
 */
const styles = StyleSheet.create({
  // Sheet background style
  sheetBackground: {
    backgroundColor: '#1C1C1E', // Dark background matching iOS dark mode
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  // The drag indicator at the top of the sheet
  handleIndicator: {
    backgroundColor: '#5C5C5E',
    width: 40,
  },
  // Main container for sheet content
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  // Header row with title and toggle
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Unit toggle container
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
    padding: 2,
  },
  // Individual unit option
  unitOption: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
  },
  // Active unit option background
  unitOptionActive: {
    backgroundColor: '#0A84FF', // iOS blue
  },
  // Unit text style
  unitText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93', // Gray for inactive
  },
  // Active unit text
  unitTextActive: {
    color: '#FFFFFF',
  },
  // Value display area
  display: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  displayText: {
    fontSize: 48,
    fontWeight: '300', // Light weight for large numbers
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'], // Monospace numbers for alignment
  },
  // Keypad grid container
  keypad: {
    marginBottom: 16,
  },
  // Each row of keypad buttons
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  // Individual keypad button
  keypadButton: {
    width: (SCREEN_WIDTH - 60) / 3, // 3 buttons per row with gaps
    height: 56,
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keypadButtonText: {
    fontSize: 28,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  // Done confirmation button
  doneButton: {
    backgroundColor: '#0A84FF', // iOS blue
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

// Display name helps with debugging in React DevTools
LoadKeypad.displayName = 'LoadKeypad';

export default LoadKeypad;
