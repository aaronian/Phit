/**
 * SidePanel Component - Collapsible
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useWorkoutSession } from '../../contexts/WorkoutSessionContext';
import { SectionButton } from './SectionButton';

interface SidePanelProps {
  onSectionPress: (sectionIndex: number) => void;
  activeSectionIndex: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function SidePanel({ onSectionPress, activeSectionIndex, isCollapsed, onToggleCollapse }: SidePanelProps) {
  const { session, sectionProgress } = useWorkoutSession();
  const [timerDisplay, setTimerDisplay] = useState('00:00');

  useEffect(() => {
    if (!session || session.completedAt) {
      setTimerDisplay('00:00');
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const startTime = session.startedAt instanceof Date
        ? session.startedAt.getTime()
        : new Date(session.startedAt).getTime();
      const elapsedMs = now - startTime;
      const totalSeconds = Math.floor(elapsedMs / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      setTimerDisplay(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const intervalId = setInterval(updateTimer, 1000);
    return () => clearInterval(intervalId);
  }, [session]);

  // Collapsed view - just icons
  if (isCollapsed) {
    return (
      <View style={styles.collapsedContainer}>
        <TouchableOpacity style={styles.expandButton} onPress={onToggleCollapse}>
          <Text style={styles.expandIcon}>›</Text>
        </TouchableOpacity>

        {sectionProgress.map((section, index) => (
          <TouchableOpacity
            key={section.sectionId}
            style={[styles.collapsedSection, index === activeSectionIndex && styles.collapsedSectionActive]}
            onPress={() => onSectionPress(index)}
          >
            <View style={[
              styles.progressDot,
              section.state === 'complete' && styles.progressDotComplete,
              section.state === 'in_progress' && styles.progressDotInProgress,
            ]} />
          </TouchableOpacity>
        ))}

        <View style={styles.spacer} />
        <Text style={styles.collapsedTimer}>{timerDisplay}</Text>
      </View>
    );
  }

  // Expanded view - full panel
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>PHIT</Text>
        <TouchableOpacity onPress={onToggleCollapse} style={styles.collapseButton}>
          <Text style={styles.collapseIcon}>‹</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionList}>
        {sectionProgress.map((section, index) => (
          <SectionButton
            key={section.sectionId}
            name={section.name}
            completed={section.completed}
            total={section.total}
            state={section.state}
            isActive={index === activeSectionIndex}
            onPress={() => onSectionPress(index)}
          />
        ))}
      </View>

      <View style={styles.spacer} />

      <View style={styles.timerContainer}>
        <Text style={styles.timerIcon}>⏱</Text>
        <Text style={styles.timerText}>{timerDisplay}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Expanded styles
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    paddingTop: 50,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    marginBottom: 8,
  },
  logo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    letterSpacing: 1,
  },
  collapseButton: {
    padding: 4,
  },
  collapseIcon: {
    fontSize: 20,
    color: '#8E8E93',
  },
  sectionList: {
    paddingHorizontal: 6,
  },
  spacer: {
    flex: 1,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
    marginHorizontal: 12,
  },
  timerIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  timerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    fontVariant: ['tabular-nums'],
  },

  // Collapsed styles
  collapsedContainer: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    paddingTop: 50,
    paddingBottom: 20,
    alignItems: 'center',
  },
  expandButton: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  expandIcon: {
    fontSize: 20,
    color: '#4CAF50',
  },
  collapsedSection: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginVertical: 2,
    borderRadius: 6,
  },
  collapsedSectionActive: {
    backgroundColor: '#2C2C2E',
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3A3A3C',
    borderWidth: 2,
    borderColor: '#5C5C5E',
  },
  progressDotComplete: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  progressDotInProgress: {
    backgroundColor: '#FF9500',
    borderColor: '#FF9500',
  },
  collapsedTimer: {
    fontSize: 10,
    color: '#8E8E93',
    fontVariant: ['tabular-nums'],
  },
});

export default SidePanel;
