/**
 * HomeScreen - Dashboard with navigation cards
 *
 * Main hub for the app with cards for:
 * - Today's Workout (primary action)
 * - Create with AI
 * - Browse Catalog
 * - History
 * - Stats
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWorkoutSession } from '../contexts/WorkoutSessionContext';
import { sampleWorkout } from '../data/sampleWorkout';

// Reusable card component for dashboard items
interface DashboardCardProps {
  title: string;
  subtitle?: string;
  icon?: string;
  size: 'large' | 'medium' | 'small';
  onPress: () => void;
  disabled?: boolean;
  children?: React.ReactNode;
}

function DashboardCard({ title, subtitle, icon, size, onPress, disabled, children }: DashboardCardProps) {
  const cardStyles = [
    styles.card,
    size === 'large' && styles.cardLarge,
    size === 'medium' && styles.cardMedium,
    size === 'small' && styles.cardSmall,
  ];

  return (
    <TouchableOpacity
      style={cardStyles}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {icon && <Text style={styles.cardIcon}>{icon}</Text>}
      <Text style={[styles.cardTitle, size === 'large' && styles.cardTitleLarge]}>
        {title}
      </Text>
      {subtitle && <Text style={styles.cardSubtitle}>{subtitle}</Text>}
      {children}
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const { startSession, session, isLoading } = useWorkoutSession();
  const [isStarting, setIsStarting] = useState(false);

  // If there's an active session, the tab navigator will show WorkoutScreen
  // This screen is only shown when there's no active session

  const handleStartWorkout = async () => {
    setIsStarting(true);
    try {
      await startSession('demo-user-123', sampleWorkout);
    } catch (error) {
      console.error('Failed to start workout:', error);
    } finally {
      setIsStarting(false);
    }
  };

  const handleCreateWithAI = () => {
    // TODO: Navigate to WorkoutChatScreen
    console.log('Navigate to AI workout creation');
  };

  const handleBrowseCatalog = () => {
    // TODO: Navigate to CatalogScreen
    console.log('Navigate to exercise catalog');
  };

  const handleViewHistory = () => {
    // TODO: Navigate to HistoryScreen
    console.log('Navigate to workout history');
  };

  const handleViewStats = () => {
    // TODO: Navigate to StatsScreen
    console.log('Navigate to stats');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logoText}>PHIT</Text>
          <TouchableOpacity style={styles.settingsButton}>
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Today's Workout - Large Card */}
        <View style={styles.primaryCard}>
          <Text style={styles.primaryLabel}>TODAY'S WORKOUT</Text>
          <Text style={styles.primaryTitle}>{sampleWorkout.name}</Text>
          <Text style={styles.primaryDetails}>
            {sampleWorkout.sections.length} sections • {' '}
            {sampleWorkout.sections.reduce((acc, s) => acc + s.exercises.length, 0)} exercises
          </Text>

          <View style={styles.sectionPreview}>
            {sampleWorkout.sections.map((section) => (
              <View key={section.id} style={styles.sectionBadge}>
                <Text style={styles.sectionBadgeText}>{section.name}</Text>
                <Text style={styles.sectionBadgeCount}>{section.exercises.length}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartWorkout}
            disabled={isStarting || isLoading}
            activeOpacity={0.8}
          >
            {isStarting || isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.startButtonText}>Start Workout</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.notFeelingIt}>
            <Text style={styles.notFeelingItText}>Not feeling it? →</Text>
          </TouchableOpacity>
        </View>

        {/* Medium Cards Row - Create & Catalog */}
        <View style={styles.cardRow}>
          <DashboardCard
            title="Create with AI"
            icon="🤖"
            size="medium"
            onPress={handleCreateWithAI}
          />
          <DashboardCard
            title="Browse Catalog"
            icon="📚"
            size="medium"
            onPress={handleBrowseCatalog}
          />
        </View>

        {/* Small Cards Row - History & Stats */}
        <View style={styles.cardRow}>
          <DashboardCard
            title="History"
            subtitle="12 workouts"
            icon="📋"
            size="small"
            onPress={handleViewHistory}
          />
          <DashboardCard
            title="Stats"
            subtitle="🔥 5 day streak"
            icon="📊"
            size="small"
            onPress={handleViewStats}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100, // Space for bottom nav
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 20,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
    letterSpacing: 3,
  },
  settingsButton: {
    padding: 8,
  },
  settingsIcon: {
    fontSize: 24,
  },

  // Primary "Today's Workout" card
  primaryCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  primaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
    letterSpacing: 1,
    marginBottom: 8,
  },
  primaryTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  primaryDetails: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 16,
  },
  sectionPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  sectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
  },
  sectionBadgeText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  sectionBadgeCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
  },
  startButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  notFeelingIt: {
    alignItems: 'center',
    marginTop: 12,
  },
  notFeelingItText: {
    fontSize: 14,
    color: '#8E8E93',
  },

  // Card rows
  cardRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },

  // Generic card styles
  card: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    flex: 1,
  },
  cardLarge: {
    padding: 20,
  },
  cardMedium: {
    minHeight: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardSmall: {
    minHeight: 80,
  },
  cardIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cardTitleLarge: {
    fontSize: 18,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
});
