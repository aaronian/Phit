/**
 * HistorySheet.tsx - Past Performance Display
 *
 * WHAT THIS COMPONENT DOES:
 * This bottom sheet shows the user's history for a specific exercise.
 * It displays past sessions with:
 * - Date of the workout
 * - Sets x Reps @ Weight format (e.g., "3x8 @ 145 lb")
 * - RPE if recorded
 *
 * WHY SHOW HISTORY?
 * History is crucial for progressive overload - the principle that you
 * need to gradually increase weight/reps to build strength.
 * By showing past performance, users can:
 * - See their progress over time
 * - Know what weight to aim for today
 * - Quickly auto-fill values from a previous session
 *
 * TAP TO AUTO-FILL:
 * Tapping a history row calls onSelectHistory with that session's data.
 * This allows quick pre-filling of today's sets based on past performance.
 */

import React, { useCallback, useMemo, forwardRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import type { LoadUnit } from '../../types';

/**
 * HistoryEntry Interface
 *
 * Represents a single past workout session for this exercise.
 * This data would typically come from your database/API.
 */
export interface HistoryEntry {
  id: string;
  date: Date;
  sets: number;
  reps: number;
  load: number;
  loadUnit: LoadUnit;
  rpe: number | null;
}

/**
 * Props Interface
 */
interface HistorySheetProps {
  exerciseName: string;
  history: HistoryEntry[];
  onSelectHistory: (entry: HistoryEntry) => void;
  onDismiss?: () => void;
}

/**
 * Format a date for display
 *
 * Shows "Today", "Yesterday", or the formatted date.
 * This is a common UX pattern for relative dates.
 */
function formatDate(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const inputDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  if (inputDate.getTime() === today.getTime()) {
    return 'Today';
  }
  if (inputDate.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  }

  // Format: "Jan 2, 2026"
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format the workout summary
 *
 * Creates the "3x8 @ 145 lb" format string.
 */
function formatWorkoutSummary(entry: HistoryEntry): string {
  const setsReps = `${entry.sets}x${entry.reps}`;
  const weight = `${entry.load} ${entry.loadUnit}`;
  return `${setsReps} @ ${weight}`;
}

/**
 * HistorySheet Component
 */
const HistorySheet = forwardRef<BottomSheet, HistorySheetProps>(
  ({ exerciseName, history, onSelectHistory, onDismiss }, ref) => {
    // Sheet snap points
    const snapPoints = useMemo(() => ['60%'], []);

    /**
     * Handle History Item Press
     *
     * Calls the callback with the selected entry so the parent
     * can auto-fill today's sets with these values.
     */
    const handleSelectEntry = useCallback(
      (entry: HistoryEntry) => {
        onSelectHistory(entry);
      },
      [onSelectHistory]
    );

    /**
     * Handle Sheet Changes
     */
    const handleSheetChange = useCallback(
      (index: number) => {
        if (index === -1) {
          onDismiss?.();
        }
      },
      [onDismiss]
    );

    /**
     * Render Backdrop
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
     * Render History Item
     *
     * Each row shows a past workout session.
     * Pressing it selects that entry for auto-fill.
     */
    const renderHistoryItem = useCallback(
      (entry: HistoryEntry, index: number) => {
        const isFirst = index === 0;
        const isLast = index === history.length - 1;

        return (
          <TouchableOpacity
            key={entry.id}
            style={[
              styles.historyItem,
              isFirst && styles.historyItemFirst,
              isLast && styles.historyItemLast,
            ]}
            onPress={() => handleSelectEntry(entry)}
            accessibilityLabel={`${formatDate(entry.date)}: ${formatWorkoutSummary(entry)}${entry.rpe ? `, RPE ${entry.rpe}` : ''}`}
            accessibilityHint="Tap to use these values for today's workout"
            accessibilityRole="button"
          >
            {/* Date */}
            <Text style={styles.dateText}>{formatDate(entry.date)}</Text>

            {/* Workout details */}
            <View style={styles.detailsRow}>
              <Text style={styles.summaryText}>
                {formatWorkoutSummary(entry)}
              </Text>
              {entry.rpe && (
                <Text style={styles.rpeText}>RPE {entry.rpe.toFixed(1)}</Text>
              )}
            </View>
          </TouchableOpacity>
        );
      },
      [history.length, handleSelectEntry]
    );

    /**
     * Check if there's no history
     */
    const hasNoHistory = history.length === 0;

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
      >
        <BottomSheetView style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{exerciseName}</Text>
            <Text style={styles.subtitle}>History</Text>
          </View>

          {/* Helper text */}
          <Text style={styles.helperText}>
            Tap a row to use those values for today
          </Text>

          {/* History List */}
          {hasNoHistory ? (
            // Empty state
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📊</Text>
              <Text style={styles.emptyTitle}>No History Yet</Text>
              <Text style={styles.emptySubtitle}>
                Complete this exercise to start tracking your progress!
              </Text>
            </View>
          ) : (
            // Scrollable history list
            <BottomSheetScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={true}
            >
              <View style={styles.historyList}>
                {history.map((entry, index) => renderHistoryItem(entry, index))}
              </View>

              {/* Load more hint */}
              {history.length >= 10 && (
                <Text style={styles.loadMoreHint}>
                  Showing last {history.length} sessions
                </Text>
              )}
            </BottomSheetScrollView>
          )}
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
  // Header
  header: {
    marginBottom: 8,
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
  // Helper text
  helperText: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 16,
  },
  // Scroll view for history
  scrollView: {
    flex: 1,
  },
  // History list container
  historyList: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    overflow: 'hidden',
  },
  // Individual history item
  historyItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#3A3A3C',
  },
  historyItemFirst: {
    // First item styling if needed
  },
  historyItemLast: {
    borderBottomWidth: 0, // Remove border from last item
  },
  // Date text
  dateText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 4,
  },
  // Details row (summary + RPE)
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  // Workout summary text
  summaryText: {
    fontSize: 17,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  // RPE badge
  rpeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0A84FF',
  },
  // Empty state
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  // Load more hint
  loadMoreHint: {
    fontSize: 12,
    color: '#5C5C5E',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
});

HistorySheet.displayName = 'HistorySheet';

export default HistorySheet;
