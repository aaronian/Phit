/**
 * RPEPicker - Simple RPE selector using Modal
 */
import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, TouchableWithoutFeedback, ScrollView } from 'react-native';

const RPE_VALUES = [6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0, 9.5, 10.0];

interface RPEPickerProps {
  visible: boolean;
  initialValue?: number | null;
  onConfirm: (value: number) => void;
  onDismiss: () => void;
}

export default function RPEPicker({ visible, initialValue, onConfirm, onDismiss }: RPEPickerProps) {
  const [selected, setSelected] = useState(initialValue ?? 8.0);

  React.useEffect(() => {
    if (visible) setSelected(initialValue ?? 8.0);
  }, [visible, initialValue]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <TouchableWithoutFeedback onPress={onDismiss}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>
      <View style={styles.container}>
        <Text style={styles.title}>Rate of Perceived Exertion</Text>
        <Text style={styles.selectedValue}>{selected.toFixed(1)}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.picker}>
          {RPE_VALUES.map((val) => (
            <TouchableOpacity
              key={val}
              style={[styles.option, selected === val && styles.optionActive]}
              onPress={() => setSelected(val)}
            >
              <Text style={[styles.optionText, selected === val && styles.optionTextActive]}>
                {val.toFixed(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity style={styles.doneButton} onPress={() => onConfirm(selected)}>
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  container: { backgroundColor: '#1C1C1E', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  title: { fontSize: 18, fontWeight: '600', color: '#FFF', textAlign: 'center', marginBottom: 16 },
  selectedValue: { fontSize: 64, fontWeight: '200', color: '#0A84FF', textAlign: 'center', marginBottom: 20 },
  picker: { marginBottom: 20 },
  option: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#2C2C2E', borderRadius: 8, marginRight: 8 },
  optionActive: { backgroundColor: '#0A84FF' },
  optionText: { fontSize: 18, color: '#8E8E93' },
  optionTextActive: { color: '#FFF', fontWeight: '600' },
  doneButton: { backgroundColor: '#0A84FF', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  doneButtonText: { fontSize: 18, fontWeight: '600', color: '#FFF' },
});
