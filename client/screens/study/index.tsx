import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { Screen } from '@/components/Screen';
import { useSafeRouter } from '@/hooks/useSafeRouter';

interface Progress {
  learnedCount: number;
  reviewCount: number;
  dailyGoal: number;
  streak: number;
  totalWords: number;
}

export default function StudyScreen() {
  const router = useSafeRouter();
  const [progress, setProgress] = useState<Progress>({
    learnedCount: 0,
    reviewCount: 0,
    dailyGoal: 10,
    streak: 0,
    totalWords: 20,
  });
  const [loading, setLoading] = useState(true);

  const fetchProgress = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/words/progress`);
      const result = await response.json();
      if (result.success) {
        setProgress(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch progress:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const todayProgress = Math.min(progress.learnedCount % progress.dailyGoal, progress.dailyGoal);
  const progressPercent = progress.dailyGoal > 0 ? (todayProgress / progress.dailyGoal) * 100 : 0;

  return (
    <Screen>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>← back</Text>
          </TouchableOpacity>
        </View>

        {/* Logo */}
        <View style={styles.logoSection}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoText}>W</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{progress.streak}</Text>
              <Text style={styles.statLabel}>day streak</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{progress.learnedCount}</Text>
              <Text style={styles.statLabel}>mastered</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{progress.reviewCount}</Text>
              <Text style={styles.statLabel}>to review</Text>
            </View>
          </View>
        </View>

        {/* Progress */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>today&apos;s goal</Text>
            <Text style={styles.progressCount}>{todayProgress}/{progress.dailyGoal}</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.primaryBtn} 
            onPress={() => router.push('/learn')}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryBtnText}>start learning</Text>
          </TouchableOpacity>

          {progress.reviewCount > 0 && (
            <TouchableOpacity 
              style={styles.secondaryBtn} 
              onPress={() => router.push('/notebook')}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryBtnText}>review ({progress.reviewCount})</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  backText: {
    fontSize: 14,
    color: '#000000',
    letterSpacing: 1,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 48,
    marginBottom: 48,
  },
  logoIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 48,
    fontWeight: '300',
    color: '#000000',
  },
  statsContainer: {
    paddingHorizontal: 32,
    marginBottom: 32,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
  },
  statLabel: {
    fontSize: 11,
    color: '#666666',
    marginTop: 4,
    letterSpacing: 1,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E0E0E0',
  },
  progressSection: {
    paddingHorizontal: 32,
    marginBottom: 48,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 13,
    color: '#000000',
    fontWeight: '500',
    letterSpacing: 1,
  },
  progressCount: {
    fontSize: 13,
    color: '#666666',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#F0F0F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#000000',
    borderRadius: 3,
  },
  actions: {
    paddingHorizontal: 32,
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: '#000000',
    paddingVertical: 18,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 2,
  },
  secondaryBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#000000',
  },
  secondaryBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 2,
  },
});
