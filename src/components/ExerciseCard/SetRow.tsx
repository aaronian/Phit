/**
 * SetRow Component
 *
 * Displays a single row in the sets data table.
 * Shows the set number and tappable cells for reps, load, and RPE.
 *
 * Each data cell displays:
 * - The current value if set, or a dash "-" placeholder if null
 * - Load includes the unit (lb/kg)
 * - Cells are tappable to trigger editing
 */

import React, { useCallback } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SetLog } from '../../types';

// Type for editable fields in a set
type EditableField = 'reps' | 'load' | 'rpe';

// Props interface for SetRow component
interface SetRowProps {
  // ID of the exercise this row belongs to
  exerciseId: string;
  // The set data to display
  set: SetLog;
  // Callback when a cell is tapped for editing
  onCellPress: (exerciseId: string, setNumber: number, field: EditableField) => void;
}

// Column width configuration (must match DataTable headers)
const COLUMN_WIDTHS = {
  set: 50,
  reps: 80,
};

const SetRow: React.FC<SetRowProps> = ({ exerciseId, set, onCellPress }) => {
  /**
   * Creates a press handler for a specific field.
   * Memoized for performance optimization.
   */
  const createPressHandler = useCallback(
    (field: EditableField) => () => {
      onCellPress(exerciseId, set.setNumber, field);
    },
    [exerciseId, set.setNumber, onCellPress]
  );

  /**
   * Formats a value for display.
   * Returns "-" for null values, otherwise formats the number.
   */
  const formatValue = (value: number | null): string => {
    if (value === null) return '-';
    return value.toString();
  };

  /**
   * Formats the load value with its unit.
   * Returns "-" if no load is set.
   */
  const formatLoad = (): string => {
    if (set.load === null) return '-';
    return `${set.load} ${set.loadUnit}`;
  };

  // Determine if row has any data entered
  const hasData = set.reps !== null || set.load !== null;

  return (
    <View style={[styles.row, !hasData && styles.rowEmpty]}>
      {/* Set number (not editable) */}
      <View style={[styles.cell, { width: COLUMN_WIDTHS.set }]}>
        <View style={styles.setNumberBadge}>
          <Text style={styles.setNumberText}>{set.setNumber}</Text>
        </View>
      </View>

      {/* Reps cell (tappable) */}
      <TouchableOpacity
        style={[styles.cell, styles.editableCell, { width: COLUMN_WIDTHS.reps }]}
        onPress={createPressHandler('reps')}
        activeOpacity={0.6}
        accessibilityLabel={`Edit reps for set ${set.setNumber}`}
      >
        <Text style={[styles.cellValue, set.reps === null && styles.cellValueEmpty]}>
          {formatValue(set.reps)}
        </Text>
      </TouchableOpacity>

      {/* Load cell (tappable) */}
      <TouchableOpacity
        style={[styles.cell, styles.editableCell, { flex: 1 }]}
        onPress={createPressHandler('load')}
        activeOpacity={0.6}
        accessibilityLabel={`Edit load for set ${set.setNumber}`}
      >
        <Text style={[styles.cellValue, set.load === null && styles.cellValueEmpty]}>
          {formatLoad()}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  // Row container
  row: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    alignItems: 'center',
  },
  // Row styling when no data is entered yet
  rowEmpty: {
    backgroundColor: '#FAFAFA',
  },
  // Base cell styling
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Additional styling for editable cells
  editableCell: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#F5F5F5',
    marginHorizontal: 2,
  },
  // Set number badge styling
  setNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Set number text
  setNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
  },
  // Cell value text
  cellValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
  },
  // Empty cell value styling (shows dash)
  cellValueEmpty: {
    color: '#BDBDBD',
  },
});

export default SetRow;
