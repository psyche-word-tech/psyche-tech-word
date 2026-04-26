import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Screen } from '@/components/Screen';
import React, { useEffect, useState } from 'react';

interface DayData {
  day: string;
  value: number;
  label: string;
}

interface StatsData {
  learning: number;
  known: number;
  vague: number;
  unknown: number;
}

const mockData: DayData[] = [
  { day: '周一', value: 0, label: '' },
  { day: '周二', value: 8, label: '8词' },
  { day: '周三', value: 15, label: '15词' },
  { day: '周四', value: 20, label: '20词' },
  { day: '周五', value: 6, label: '6词' },
  { day: '周六', value: 18, label: '18词' },
  { day: '周日', value: 10, label: '10词' },
];

const MAX_VALUE = 25;
const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

export default function CalendarPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchStats = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/wordbooks/stats`);
        const data = await response.json();
        if (!cancelled) {
          setStats(data);
        }
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    fetchStats();
    return () => {
      cancelled = true;
    };
  }, []);

  // 计算周一的总高度和各段比例
  const getMondaySegments = () => {
    if (!stats) return null;
    const known = stats.known || 0;
    const vague = stats.vague || 0;
    const unknown = stats.unknown || 0;
    const total = known + vague + unknown;
    if (total === 0) return null;

    const totalHeight = Math.min((total / MAX_VALUE) * 180, 180);
    return {
      total,
      totalHeight,
      knownHeight: (known / total) * totalHeight,
      vagueHeight: (vague / total) * totalHeight,
      unknownHeight: (unknown / total) * totalHeight,
      known,
      vague,
      unknown,
    };
  };

  const mondaySegments = getMondaySegments();

  return (
    <Screen>
      <ScrollView className="flex-1 bg-white" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* 标题区域 */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>学习统计</Text>
          <Text style={styles.headerSubtitle}>近7天单词学习量</Text>
        </View>

        {/* 柱状图区域 */}
        <View style={styles.chartContainer}>
          {loading && (
            <ActivityIndicator size="small" color="#5D4037" style={{ marginBottom: 12 }} />
          )}

          <View style={styles.chartInner}>
            {mockData.map((item, index) => {
              if (index === 0 && mondaySegments) {
                // 周一：分段柱
                return (
                  <View key={index} style={styles.barColumn}>
                    <Text style={styles.barLabel}>{mondaySegments.total}词</Text>
                    <View style={styles.barWrapper}>
                      {/* 不会 (红色) - z表 */}
                      <View
                        style={[
                          styles.segment,
                          {
                            height: Math.max(mondaySegments.unknownHeight, 2),
                            backgroundColor: '#E53935',
                            borderTopLeftRadius: 14,
                            borderTopRightRadius: 14,
                          },
                        ]}
                      />
                      {/* 模糊 (橙色) - y表 */}
                      <View
                        style={[
                          styles.segment,
                          {
                            height: Math.max(mondaySegments.vagueHeight, 2),
                            backgroundColor: '#FB8C00',
                          },
                        ]}
                      />
                      {/* 会 (绿色) - x表 */}
                      <View
                        style={[
                          styles.segment,
                          {
                            height: Math.max(mondaySegments.knownHeight, 2),
                            backgroundColor: '#43A047',
                            borderBottomLeftRadius: 14,
                            borderBottomRightRadius: 14,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.barDay}>{item.day}</Text>
                  </View>
                );
              }

              // 其他天：单色柱
              const barHeight = (item.value / MAX_VALUE) * 180;
              return (
                <View key={index} style={styles.barColumn}>
                  <Text style={styles.barLabel}>{item.label}</Text>
                  <View style={styles.barWrapper}>
                    <View style={[styles.bar, { height: Math.max(barHeight, 4) }]} />
                  </View>
                  <Text style={styles.barDay}>{item.day}</Text>
                </View>
              );
            })}
          </View>

          {/* 图例 */}
          {mondaySegments && (
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#43A047' }]} />
                <Text style={styles.legendText}>会的({mondaySegments.known})</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#FB8C00' }]} />
                <Text style={styles.legendText}>模糊的({mondaySegments.vague})</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#E53935' }]} />
                <Text style={styles.legendText}>不会的({mondaySegments.unknown})</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#3E2723',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8D6E63',
  },
  chartContainer: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: '#F5F0EB',
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  chartInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 220,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
  },
  barLabel: {
    fontSize: 11,
    color: '#5D4037',
    fontWeight: '600',
    marginBottom: 6,
  },
  barWrapper: {
    width: 28,
    height: 180,
    justifyContent: 'flex-end',
    backgroundColor: '#E8E0D8',
    borderRadius: 14,
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    backgroundColor: '#5D4037',
    borderRadius: 14,
  },
  segment: {
    width: '100%',
  },
  barDay: {
    fontSize: 12,
    color: '#8D6E63',
    marginTop: 8,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 4,
  },
  legendText: {
    fontSize: 11,
    color: '#5D4037',
  },
});
