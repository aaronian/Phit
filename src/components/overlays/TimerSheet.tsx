/**
 * TimerSheet - Simple timer modal
 */
import React, { useState, useEffect, useRef } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, TouchableWithoutFeedback } from 'react-native';

interface TimerSheetProps {
  visible: boolean;
  exerciseName?: string;
  onDismiss: () => void;
}

export default function TimerSheet({ visible, exerciseName = 'Timer', onDismiss }: TimerSheetProps) {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setElapsed(e => e + 10), 10);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  useEffect(() => {
    if (!visible) { setElapsed(0); setRunning(false); }
  }, [visible]);

  const formatTime = (ms: number) => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    const cents = Math.floor((ms % 1000) / 10);
    return `${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}.${cents.toString().padStart(2,'0')}`;
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <TouchableWithoutFeedback onPress={onDismiss}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>
      <View style={styles.container}>
        <Text style={styles.title}>{exerciseName}</Text>
        <View style={styles.display}>
          <Text style={styles.time}>{formatTime(elapsed)}</Text>
        </View>
        <View style={styles.buttons}>
          <TouchableOpacity style={[styles.btn, running ? styles.btnOrange : styles.btnGreen]} onPress={() => setRunning(!running)}>
            <Text style={styles.btnText}>{running ? 'Pause' : 'Start'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btn} onPress={() => { setElapsed(0); setRunning(false); }}>
            <Text style={styles.btnText}>Reset</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  container: { backgroundColor: '#1C1C1E', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  title: { fontSize: 18, fontWeight: '600', color: '#FFF', textAlign: 'center', marginBottom: 20 },
  display: { backgroundColor: '#2C2C2E', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 20 },
  time: { fontSize: 48, fontWeight: '200', color: '#FFF', fontVariant: ['tabular-nums'] },
  buttons: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
  btn: { paddingVertical: 14, paddingHorizontal: 28, borderRadius: 40, backgroundColor: '#2C2C2E' },
  btnGreen: { backgroundColor: '#34C759' },
  btnOrange: { backgroundColor: '#FF9500' },
  btnText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
});
