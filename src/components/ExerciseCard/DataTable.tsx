/**
 * DataTable Component
 *
 * Displays a table of sets for an exercise with columns for:
 * - Set number
 * - Reps performed
 * - Load (weight) with unit
 * - RPE (Rate of Perceived Exertion)
 *
 * Each data cell is tappable to allow editing values.
 * Includes an "Add Set" button at the bottom.
 */

import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SetLog } from '../../types';
import SetRow from './SetRow';

// Props interface for DataTable component
interface DataTableProps {
  // ID of the exercise this table belongs to
  exerciseId: string;
  // Array of set logs to display
  sets: SetLog[];
  // Callback when a cell is tapped for editing
  onCellPress: (exerciseId: string, setNumber: number, field: 'reps' | 'load' | 'rpe') => void;
  // Callback to add a new set
  onAddSet: () => void;
}

// Column header configuration
const COLUMNS = [
  { key: 'set', label: 'Set', width: 50 },
  { key: 'reps', label: 'Reps', width: 70 },
  { key: 'load', label: 'Load', width: 90 },
  { key: 'rpe', label: 'RPE', width: 70 },
] as const;

const DataTable: React.FC<DataTableProps> = ({
  exerciseId,
  sets,
  onCellPress,
  onAddSet,
}) => {
  return (
    <View style={styles.container}>
      {/* Table header row */}
      <View style={styles.headerRow}>
        {COLUMNS.map((column) => (
          <View
            key={column.key}
            style={[styles.headerCell, { width: column.width, flex: column.key === 'rpe' ? 1 : 0 }]}
          >
            <Text style={styles.headerText}>{column.label}</Text>
          </View>
        ))}
      </View>

      {/* Set rows */}
      {sets.map((set) => (
        <SetRow
          key={set.setNumber}
          exerciseId={exerciseId}
          set={set}
          onCellPress={onCellPress}
        />
      ))}

      {/* Add Set button */}
      <TouchableOpacity
        style={styles.addSetButton}
        onPress={onAddSet}
        activeOpacity={0.7}
      >
        <Text style={styles.addSetIcon}>+</Text>
        <Text style={styles.addSetText}>Add Set</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  // Main container
  container: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  // Header row styling
  headerRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 6,
    marginBottom: 4,
  },
  // Individual header cell
  headerCell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Header text styling
  headerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Add Set button container
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    borderRadius: 8,
    gap: 6,
  },
  // Plus icon for Add Set button
  addSetIcon: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2196F3',
  },
  // Add Set button text
  addSetText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2196F3',
  },
});

export default DataTable;
