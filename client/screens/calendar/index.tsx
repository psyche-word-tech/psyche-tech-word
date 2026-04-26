import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Screen } from '@/components/Screen';
import React from 'react';

interface DayData {
  day: string;
  value: number;
  label: string;
}

const mockData: DayData[] = [
  { day: '周一', value: 12, label: '12词' },
  { day: '周二', value: 8, label: '8词' },
  { day: '周三', value: 15, label: '15词' },
  { day: '周四', value: 20, label: '20词' },
  { day: '周五', value: 6, label: '6词' },
  { day: '周六', value: 18, label: '18词' },
  { day: '周日', value: 10, label: '10词' },
];

const MAX_VALUE = 25;

export default function CalendarPage() {
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
          <View style={styles.chartInner}>
            {mockData.map((item, index) => {
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
  barDay: {
    fontSize: 12,
    color: '#8D6E63',
    marginTop: 8,
  },
});
