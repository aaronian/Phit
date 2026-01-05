/**
 * LoadKeypad - Number keypad using React Native Modal
 */
import React, { useState, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import type { LoadUnit } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface LoadKeypadProps {
  visible: boolean;
  initialValue?: number | null;
  initialUnit?: LoadUnit;
  onConfirm: (value: number, unit: LoadUnit) => void;
  onDismiss: () => void;
}

export default function LoadKeypad({
  visible,
  initialValue,
  initialUnit = 'lb',
  onConfirm,
  onDismiss,
}: LoadKeypadProps) {
  const [displayValue, setDisplayValue] = useState<string>(
    initialValue?.toString() ?? ''
  );
  const [unit, setUnit] = useState<LoadUnit>(initialUnit);

  // Reset when modal opens
  React.useEffect(() => {
    if (visible) {
      setDisplayValue(initialValue?.toString() ?? '');
      setUnit(initialUnit);
    }
  }, [visible, initialValue, initialUnit]);

  const handleKeyPress = useCallback((key: string) => {
    setDisplayValue((current) => {
      if (key === 'backspace') return current.slice(0, -1);
      if (key === '.') {
        if (current.includes('.')) return current;
        if (current === '') return '0.';
        return current + '.';
      }
      if (current.length >= 7) return current;
      if (current === '0' && key !== '.') return key;
      return current + key;
    });
  }, []);

  const handleDone = useCallback(() => {
    const numericValue = parseFloat(displayValue) || 0;
    onConfirm(numericValue, unit);
  }, [displayValue, unit, onConfirm]);

  const KeypadButton = ({ value, display }: { value: string; display?: string }) => (
    <TouchableOpacity
      style={styles.keypadButton}
      onPress={() => handleKeyPress(value)}
    >
      <Text style={styles.keypadButtonText}>{display || value}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <TouchableWithoutFeedback onPress={onDismiss}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Load</Text>
          <View style={styles.unitToggle}>
            <TouchableOpacity
              style={[styles.unitOption, unit === 'lb' && styles.unitOptionActive]}
              onPress={() => setUnit('lb')}
            >
              <Text style={[styles.unitText, unit === 'lb' && styles.unitTextActive]}>lb</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.unitOption, unit === 'kg' && styles.unitOptionActive]}
              onPress={() => setUnit('kg')}
            >
              <Text style={[styles.unitText, unit === 'kg' && styles.unitTextActive]}>kg</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.display}>
          <Text style={styles.displayText}>{displayValue || '0'}</Text>
        </View>
        <View style={styles.keypad}>
          {[['1','2','3'],['4','5','6'],['7','8','9'],['.','0','backspace']].map((row, i) => (
            <View key={i} style={styles.keypadRow}>
              {row.map((key) => (
                <KeypadButton key={key} value={key} display={key === 'backspace' ? '⌫' : key} />
              ))}
            </View>
          ))}
        </View>
        <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  container: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 16,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '600', color: '#FFF' },
  unitToggle: { flexDirection: 'row', backgroundColor: '#2C2C2E', borderRadius: 8, padding: 2 },
  unitOption: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 6 },
  unitOptionActive: { backgroundColor: '#0A84FF' },
  unitText: { fontSize: 14, fontWeight: '600', color: '#8E8E93' },
  unitTextActive: { color: '#FFF' },
  display: { backgroundColor: '#2C2C2E', borderRadius: 12, padding: 20, alignItems: 'center', marginBottom: 20 },
  displayText: { fontSize: 48, fontWeight: '300', color: '#FFF' },
  keypad: { marginBottom: 16 },
  keypadRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  keypadButton: { width: (SCREEN_WIDTH - 60) / 3, height: 56, backgroundColor: '#2C2C2E', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  keypadButtonText: { fontSize: 28, fontWeight: '400', color: '#FFF' },
  doneButton: { backgroundColor: '#0A84FF', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  doneButtonText: { fontSize: 18, fontWeight: '600', color: '#FFF' },
});
