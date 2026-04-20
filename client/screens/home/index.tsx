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

export default function HomeScreen() {
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
  const progressPercent = (todayProgress / progress.dailyGoal) * 100;

  return (
    <Screen>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>welcome to</Text>
          <Text style={styles.title}>word mastery</Text>
        </View>

        {/* Main Logo/Icon */}
        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoText}>W</Text>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          {/* Streak */}
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{progress.streak}</Text>
            <Text style={styles.statLabel}>day streak</Text>
          </View>
          
          <View style={styles.statDivider} />
          
          {/* Learned */}
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{progress.learnedCount}</Text>
            <Text style={styles.statLabel}>mastered</Text>
          </View>
          
          <View style={styles.statDivider} />
          
          {/* To Review */}
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{progress.reviewCount}</Text>
            <Text style={styles.statLabel}>to review</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>today&apos;s goal</Text>
            <Text style={styles.progressCount}>{todayProgress}/{progress.dailyGoal}</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.primaryBtn} 
            onPress={() => router.push('/study')}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryBtnText}>start learning</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryBtn} 
            onPress={() => router.push('/notebook')}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryBtnText}>notebook</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>phantasia connects us</Text>
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
    paddingHorizontal: 32,
    paddingTop: 48,
    alignItems: 'center',
  },
  greeting: {
    fontSize: 14,
    color: '#666666',
    letterSpacing: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: 1,
    marginTop: 4,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  logoIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 56,
    fontWeight: '300',
    color: '#000000',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    marginBottom: 32,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
    letterSpacing: 1,
  },
  statDivider: {
    width: 1,
    height: 40,
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
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
    letterSpacing: 1,
  },
  progressCount: {
    fontSize: 14,
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
    gap: 16,
  },
  primaryBtn: {
    backgroundColor: '#000000',
    paddingVertical: 18,
    borderRadius: 4,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 2,
  },
  secondaryBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    borderRadius: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#000000',
  },
  secondaryBtnText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999999',
    letterSpacing: 2,
  },
});
