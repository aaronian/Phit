/**
 * HistorySheet - Past Performance Display using Modal
 */
import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import type { LoadUnit } from '../../types';

export interface HistoryEntry {
  id: string;
  date: Date;
  sets: number;
  reps: number;
  load: number;
  loadUnit: LoadUnit;
  rpe: number | null;
}

interface HistorySheetProps {
  visible: boolean;
  exerciseName: string;
  history: HistoryEntry[];
  onSelectHistory: (entry: HistoryEntry) => void;
  onDismiss: () => void;
}

function formatDate(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const inputDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (inputDate.getTime() === today.getTime()) return 'Today';
  if (inputDate.getTime() === yesterday.getTime()) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatWorkoutSummary(entry: HistoryEntry): string {
  return `${entry.sets}x${entry.reps} @ ${entry.load} ${entry.loadUnit}`;
}

export default function HistorySheet({ visible, exerciseName, history, onSelectHistory, onDismiss }: HistorySheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <TouchableWithoutFeedback onPress={onDismiss}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{exerciseName}</Text>
          <Text style={styles.subtitle}>History</Text>
        </View>
        <Text style={styles.helperText}>Tap a row to use those values for today</Text>

        {history.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No History Yet</Text>
            <Text style={styles.emptySubtitle}>Complete this exercise to start tracking your progress!</Text>
          </View>
        ) : (
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator>
            <View style={styles.historyList}>
              {history.map((entry, index) => (
                <TouchableOpacity
                  key={entry.id}
                  style={[styles.historyItem, index === history.length - 1 && styles.historyItemLast]}
                  onPress={() => onSelectHistory(entry)}
                >
                  <Text style={styles.dateText}>{formatDate(entry.date)}</Text>
                  <View style={styles.detailsRow}>
                    <Text style={styles.summaryText}>{formatWorkoutSummary(entry)}</Text>
                    {entry.rpe && <Text style={styles.rpeText}>RPE {entry.rpe.toFixed(1)}</Text>}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}

        <TouchableOpacity style={styles.doneButton} onPress={onDismiss}>
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  container: { backgroundColor: '#1C1C1E', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40, maxHeight: '60%' },
  header: { marginBottom: 8 },
  title: { fontSize: 20, fontWeight: '600', color: '#FFF', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#8E8E93' },
  helperText: { fontSize: 12, color: '#8E8E93', marginBottom: 16 },
  scrollView: { flexGrow: 0 },
  historyList: { backgroundColor: '#2C2C2E', borderRadius: 12, overflow: 'hidden' },
  historyItem: { paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#3A3A3C' },
  historyItemLast: { borderBottomWidth: 0 },
  dateText: { fontSize: 12, fontWeight: '500', color: '#8E8E93', marginBottom: 4 },
  detailsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryText: { fontSize: 17, fontWeight: '500', color: '#FFF' },
  rpeText: { fontSize: 14, fontWeight: '500', color: '#0A84FF' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#FFF', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#8E8E93', textAlign: 'center' },
  doneButton: { backgroundColor: '#0A84FF', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 16 },
  doneButtonText: { fontSize: 18, fontWeight: '600', color: '#FFF' },
});
