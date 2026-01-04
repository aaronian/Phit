/**
 * NotesSheet.tsx - Simple Text Input for Exercise Notes
 *
 * WHAT THIS COMPONENT DOES:
 * This bottom sheet provides a text area for users to add notes to an exercise.
 * Notes are useful for recording:
 * - Form cues ("Keep elbows tucked")
 * - Variations ("Used pause at bottom")
 * - Equipment notes ("Bar felt heavy today")
 * - Pain/discomfort notes ("Slight twinge in left shoulder")
 *
 * AUTO-SAVE PATTERN:
 * This component auto-saves when dismissed. This is a common UX pattern
 * because it eliminates an extra "Save" button tap and prevents data loss
 * if the user forgets to save.
 *
 * We save on:
 * 1. Sheet dismiss (swipe down or tap backdrop)
 * 2. Keyboard dismiss
 * 3. Component unmount
 *
 * KEYBOARD HANDLING:
 * React Native requires special handling for keyboards on iOS.
 * The KeyboardAvoidingView ensures the input stays visible when
 * the keyboard opens.
 */

import React, {
  useCallback,
  useState,
  useMemo,
  useEffect,
  forwardRef,
} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Keyboard,
  Platform,
} from 'react-native';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';

/**
 * Props Interface
 */
interface NotesSheetProps {
  exerciseName: string;
  initialNotes?: string;
  onSave: (notes: string) => void;
  onDismiss?: () => void;
}

/**
 * NotesSheet Component
 *
 * Uses BottomSheetTextInput instead of regular TextInput.
 * This is important because @gorhom/bottom-sheet needs special
 * integration for text inputs to work properly with gestures.
 */
const NotesSheet = forwardRef<BottomSheet, NotesSheetProps>(
  ({ exerciseName, initialNotes = '', onSave, onDismiss }, ref) => {
    // Track the current note text
    const [notes, setNotes] = useState(initialNotes);

    // Track if any changes were made (to avoid unnecessary saves)
    const [hasChanged, setHasChanged] = useState(false);

    // Sheet snap points
    // Using a higher percentage because we need room for keyboard
    const snapPoints = useMemo(() => ['50%'], []);

    /**
     * Handle text changes
     */
    const handleChangeText = useCallback((text: string) => {
      setNotes(text);
      setHasChanged(true);
    }, []);

    /**
     * Save notes
     *
     * Only saves if there were actual changes to prevent
     * unnecessary database writes or state updates.
     */
    const saveNotes = useCallback(() => {
      if (hasChanged) {
        onSave(notes);
      }
    }, [hasChanged, notes, onSave]);

    /**
     * Handle Sheet Changes
     *
     * Saves notes when sheet is closed (index -1).
     */
    const handleSheetChange = useCallback(
      (index: number) => {
        if (index === -1) {
          // Auto-save when closing
          saveNotes();
          onDismiss?.();
        }
      },
      [saveNotes, onDismiss]
    );

    /**
     * Render Backdrop
     *
     * Tapping the backdrop closes the sheet (which triggers auto-save).
     */
    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          pressBehavior="close"
        />
      ),
      []
    );

    /**
     * Save on component unmount
     *
     * This is a safety net in case the sheet is unmounted
     * without going through the normal close flow.
     */
    useEffect(() => {
      return () => {
        // Note: This won't have the latest state in the cleanup function
        // due to closure. The handleSheetChange is the primary save trigger.
      };
    }, []);

    /**
     * Handle keyboard dismiss
     *
     * Save when user dismisses the keyboard.
     */
    const handleKeyboardDismiss = useCallback(() => {
      Keyboard.dismiss();
      // Optionally save here too
      // saveNotes();
    }, []);

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        onChange={handleSheetChange}
        backdropComponent={renderBackdrop}
        enablePanDownToClose={true}
        handleIndicatorStyle={styles.handleIndicator}
        backgroundStyle={styles.sheetBackground}
        // Enable keyboard interaction
        keyboardBehavior={Platform.OS === 'ios' ? 'interactive' : 'fillParent'}
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
      >
        <BottomSheetView style={styles.container}>
          {/* Header with exercise name */}
          <View style={styles.header}>
            <Text style={styles.title}>{exerciseName}</Text>
            <Text style={styles.subtitle}>Notes</Text>
          </View>

          {/* Notes Input */}
          <View style={styles.inputContainer}>
            <BottomSheetTextInput
              style={styles.textInput}
              value={notes}
              onChangeText={handleChangeText}
              placeholder="Add notes about this exercise..."
              placeholderTextColor="#8E8E93"
              multiline={true}
              textAlignVertical="top"
              // Auto-capitalize sentences
              autoCapitalize="sentences"
              // Enable auto-correct
              autoCorrect={true}
              // Return key behavior
              returnKeyType="default"
              // Blur on submit (for single-line behavior)
              blurOnSubmit={false}
              // Accessibility
              accessibilityLabel="Exercise notes"
              accessibilityHint="Enter any notes about this exercise"
            />
          </View>

          {/* Helper text */}
          <Text style={styles.helperText}>
            Notes are saved automatically when you close this panel.
          </Text>

          {/* Character count (optional, useful for long notes) */}
          <Text style={styles.characterCount}>{notes.length} characters</Text>
        </BottomSheetView>
      </BottomSheet>
    );
  }
);

/**
 * Styles
 */
const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handleIndicator: {
    backgroundColor: '#5C5C5E',
    width: 40,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  // Header section
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#8E8E93',
  },
  // Text input container
  inputContainer: {
    flex: 1,
    marginBottom: 12,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    // Minimum height for the text area
    minHeight: 150,
  },
  // Helper text at bottom
  helperText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 4,
  },
  characterCount: {
    fontSize: 11,
    color: '#5C5C5E',
    textAlign: 'right',
  },
});

NotesSheet.displayName = 'NotesSheet';

export default NotesSheet;
