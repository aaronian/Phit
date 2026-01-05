/**
 * NotesSheet - Simple notes modal
 */
import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, TouchableWithoutFeedback, KeyboardAvoidingView, Platform } from 'react-native';

interface NotesSheetProps {
  visible: boolean;
  exerciseName: string;
  initialNotes?: string;
  onSave: (notes: string) => void;
  onDismiss: () => void;
}

export default function NotesSheet({ visible, exerciseName, initialNotes = '', onSave, onDismiss }: NotesSheetProps) {
  const [notes, setNotes] = useState(initialNotes);

  useEffect(() => {
    if (visible) setNotes(initialNotes);
  }, [visible, initialNotes]);

  const handleDismiss = () => {
    onSave(notes);
    onDismiss();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleDismiss}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={handleDismiss}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
        <View style={styles.container}>
          <Text style={styles.title}>{exerciseName}</Text>
          <Text style={styles.subtitle}>Notes</Text>
          <TextInput
            style={styles.input}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add notes..."
            placeholderTextColor="#8E8E93"
            multiline
          />
          <TouchableOpacity style={styles.doneButton} onPress={handleDismiss}>
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  container: { backgroundColor: '#1C1C1E', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40, minHeight: 300 },
  title: { fontSize: 20, fontWeight: '600', color: '#FFF' },
  subtitle: { fontSize: 14, color: '#8E8E93', marginBottom: 16 },
  input: { backgroundColor: '#2C2C2E', borderRadius: 12, padding: 16, fontSize: 16, color: '#FFF', minHeight: 120, textAlignVertical: 'top', marginBottom: 16 },
  doneButton: { backgroundColor: '#0A84FF', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  doneButtonText: { fontSize: 18, fontWeight: '600', color: '#FFF' },
});
