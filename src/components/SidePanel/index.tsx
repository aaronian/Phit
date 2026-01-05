/**
 * SidePanel Component - Collapsible with Overlay
 * 
 * When collapsed: Renders as a narrow inline strip (50px) within the layout
 * When expanded: Renders as an overlay on top of content with a semi-transparent backdrop
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, Dimensions } from 'react-native';
import { useWorkoutSession } from '../../contexts/WorkoutSessionContext';
import { SectionButton } from './SectionButton';

interface SidePanelProps {
  onSectionPress: (sectionIndex: number) => void;
  activeSectionIndex: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  /** Optional callback for backdrop press - defaults to onToggleCollapse if not provided */
  onBackdropPress?: () => void;
}

export function SidePanel({ 
  onSectionPress, 
  activeSectionIndex, 
  isCollapsed, 
  onToggleCollapse,
  onBackdropPress 
}: SidePanelProps) {
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
      setTimerDisplay(minutes.toString().padStart(2, '0') + ':' + seconds.toString().padStart(2, '0'));
    };

    updateTimer();
    const intervalId = setInterval(updateTimer, 1000);
    return () => clearInterval(intervalId);
  }, [session]);

  // Handle backdrop press - use provided callback or fall back to toggle
  const handleBackdropPress = () => {
    if (onBackdropPress) {
      onBackdropPress();
    } else {
      onToggleCollapse();
    }
  };

  // Collapsed view - just icons (inline, takes up 50px in parent flex row)
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

  // Expanded view - overlay with backdrop
  // Uses absolute positioning to overlay on top of content
  return (
    <View style={styles.overlayWrapper}>
      {/* Semi-transparent backdrop - tapping closes the panel */}
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>
      
      {/* The actual panel content */}
      <View style={styles.expandedPanel}>
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
    </View>
  );
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const EXPANDED_PANEL_WIDTH = 200;

const styles = StyleSheet.create({
  // Overlay wrapper - positions absolutely to cover the entire screen
  overlayWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    flexDirection: 'row',
  },
  
  // Semi-transparent backdrop behind the panel
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  
  // Expanded panel styles - positioned on the left side
  expandedPanel: {
    width: EXPANDED_PANEL_WIDTH,
    backgroundColor: '#1A1A1A',
    paddingTop: 50,
    paddingBottom: 20,
    // Slight shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
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

  // Collapsed styles - inline strip
  collapsedContainer: {
    width: 50,
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
