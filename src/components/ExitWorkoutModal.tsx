import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';

// Props interface for the ExitWorkoutModal component
// These callbacks allow the parent component to handle each action appropriately
interface ExitWorkoutModalProps {
  visible: boolean;           // Controls whether the modal is displayed
  onPauseTimer: () => void;   // Called when user wants to pause but stay on screen
  onSaveAndExit: () => void;  // Called when user wants to save progress and leave
  onCancelWorkout: () => void; // Called when user wants to discard progress entirely
  onDismiss: () => void;      // Called when user wants to continue workout (close modal)
}

// Theme colors matching the app's dark theme
const COLORS = {
  background: '#121212',      // Main app background
  card: '#1C1C1E',           // Card/modal background - slightly lighter than main bg
  accent: '#4CAF50',         // Green accent color for primary actions
  text: '#FFFFFF',           // Primary text color
  textSecondary: '#8E8E93',  // Secondary/muted text
  destructive: '#FF453A',    // Red color for destructive actions like cancel
  overlay: 'rgba(0, 0, 0, 0.7)', // Semi-transparent overlay behind modal
};

export default function ExitWorkoutModal({
  visible,
  onPauseTimer,
  onSaveAndExit,
  onCancelWorkout,
  onDismiss,
}: ExitWorkoutModalProps) {
  // Track whether we're showing the cancel confirmation step
  // This provides a safety net before discarding workout progress
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Reset confirmation state when modal closes
  // This ensures the modal always opens in its default state
  const handleDismiss = () => {
    setShowCancelConfirm(false);
    onDismiss();
  };

  // Handle the cancel workout flow
  // First press shows confirmation, second press actually cancels
  const handleCancelWorkout = () => {
    if (showCancelConfirm) {
      // User has confirmed - proceed with cancellation
      setShowCancelConfirm(false);
      onCancelWorkout();
    } else {
      // Show confirmation message before allowing cancellation
      setShowCancelConfirm(true);
    }
  };

  // Reset cancel confirmation if user changes their mind
  const handleBackFromConfirm = () => {
    setShowCancelConfirm(false);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleDismiss} // Android back button support
    >
      {/* Overlay that dims the background and allows tap-to-dismiss */}
      <Pressable style={styles.overlay} onPress={handleDismiss}>
        {/* Modal card - Pressable wrapper prevents taps inside from dismissing */}
        <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
          {/* Modal Title */}
          <Text style={styles.title}>Leaving Workout?</Text>

          {/* Conditional rendering based on whether we're in confirmation mode */}
          {showCancelConfirm ? (
            // Cancel Confirmation View
            // Shows a warning and asks user to confirm they want to discard progress
            <View style={styles.confirmContainer}>
              <Text style={styles.confirmText}>
                Are you sure? All progress will be lost.
              </Text>

              {/* Confirm Cancel Button - Red/destructive styling */}
              <TouchableOpacity
                style={[styles.button, styles.destructiveButton]}
                onPress={handleCancelWorkout}
                activeOpacity={0.7}
              >
                <Text style={styles.destructiveButtonText}>Yes, Cancel Workout</Text>
              </TouchableOpacity>

              {/* Go Back Button - Returns to main options */}
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={handleBackFromConfirm}
                activeOpacity={0.7}
              >
                <Text style={styles.secondaryButtonText}>Go Back</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // Main Options View
            // Shows the four main actions user can take
            <View style={styles.optionsContainer}>
              {/* Pause Timer - Stays on screen but pauses the timer */}
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={onPauseTimer}
                activeOpacity={0.7}
              >
                <Text style={styles.primaryButtonText}>Pause Timer</Text>
              </TouchableOpacity>

              {/* Save & Exit - Persists progress and navigates home */}
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={onSaveAndExit}
                activeOpacity={0.7}
              >
                <Text style={styles.primaryButtonText}>Save & Exit</Text>
              </TouchableOpacity>

              {/* Cancel Workout - Shows confirmation before discarding */}
              <TouchableOpacity
                style={[styles.button, styles.outlineButton]}
                onPress={handleCancelWorkout}
                activeOpacity={0.7}
              >
                <Text style={styles.outlineButtonText}>Cancel Workout</Text>
              </TouchableOpacity>

              {/* Keep Going - Dismisses modal and continues workout */}
              <TouchableOpacity
                style={styles.keepGoingButton}
                onPress={handleDismiss}
                activeOpacity={0.7}
              >
                <Text style={styles.keepGoingText}>Keep Going</Text>
              </TouchableOpacity>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // Full-screen overlay with semi-transparent background
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Modal card container
  modalContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 340,
    alignItems: 'center',
  },

  // Modal title styling
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 24,
    textAlign: 'center',
  },

  // Container for main options
  optionsContainer: {
    width: '100%',
    gap: 12, // Consistent spacing between buttons
  },

  // Container for confirmation view
  confirmContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },

  // Confirmation warning text
  confirmText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },

  // Base button styling - shared by all button variants
  button: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },

  // Primary action button - green background
  primaryButton: {
    backgroundColor: COLORS.accent,
  },

  primaryButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },

  // Outline button - transparent with border (for less prominent actions)
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.textSecondary,
  },

  outlineButtonText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },

  // Secondary button - subtle background
  secondaryButton: {
    backgroundColor: COLORS.background,
  },

  secondaryButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '500',
  },

  // Destructive button - red for dangerous actions
  destructiveButton: {
    backgroundColor: COLORS.destructive,
  },

  destructiveButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },

  // Keep Going link-style button at bottom
  keepGoingButton: {
    marginTop: 8,
    paddingVertical: 12,
  },

  keepGoingText: {
    color: COLORS.accent,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
