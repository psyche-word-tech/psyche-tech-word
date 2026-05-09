import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { useApiConfig } from '@/contexts/ApiConfigContext';
import { Ionicons } from '@expo/vector-icons';

interface TreeNode {
  id: string;
  label: string;
  count?: number;
  children?: TreeNode[];
  color?: string;
}

export default function TreeDiagramPage() {
  const router = useSafeRouter();
  const { apiBaseUrl, isConfigLoaded } = useApiConfig();
  const [counts, setCounts] = useState({ b: 0, x: 0, y: 0, z: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const fetchCounts = useCallback(async () => {
    if (!isConfigLoaded) return;
    try {
      const [bRes, xRes, yRes, zRes] = await Promise.all([
        fetch(`${apiBaseUrl}/api/v1/user-words/category/words_b/count`),
        fetch(`${apiBaseUrl}/api/v1/user-words/category/words_x/count`),
        fetch(`${apiBaseUrl}/api/v1/user-words/category/words_y/count`),
        fetch(`${apiBaseUrl}/api/v1/user-words/category/words_z/count`),
      ]);
      const [bData, xData, yData, zData] = await Promise.all([
        bRes.json(), xRes.json(), yRes.json(), zRes.json(),
      ]);
      setCounts({
        b: bData.count || 0,
        x: xData.count || 0,
        y: yData.count || 0,
        z: zData.count || 0,
      });
    } catch (error) {
      console.error('Failed to fetch counts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [apiBaseUrl, isConfigLoaded]);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchCounts();
    }, [fetchCounts])
  );

  const treeData: TreeNode = {
    id: 'root',
    label: '我的词汇',
    count: counts.b + counts.x + counts.y + counts.z,
    color: '#4F46E5',
    children: [
      {
        id: 'learning',
        label: '学习中',
        count: counts.b,
        color: '#0EA5E9',
        children: [
          { id: 'daily', label: '每日学习', count: undefined, color: '#38BDF8' },
          { id: 'review', label: '复习巩固', count: undefined, color: '#38BDF8' },
        ],
      },
      {
        id: 'known',
        label: '已会单词',
        count: counts.x,
        color: '#059669',
      },
      {
        id: 'vague',
        label: '模糊单词',
        count: counts.y,
        color: '#D97706',
      },
      {
        id: 'unknown',
        label: '生词本',
        count: counts.z,
        color: '#DC2626',
      },
    ],
  };

  const renderNode = (node: TreeNode, level: number = 0, isLast: boolean = true, parentLastStack: boolean[] = []) => {
    const indent = level * 28;
    const hasChildren = node.children && node.children.length > 0;

    return (
      <View key={node.id}>
        <View style={[styles.nodeRow, { marginLeft: indent }]}>
          {/* Tree line indicators */}
          {level > 0 && (
            <View style={styles.lineContainer}>
              {parentLastStack.map((isParentLast, idx) => (
                <View key={idx} style={styles.lineSlot}>
                  {!isParentLast && <View style={styles.verticalLine} />}
                </View>
              ))}
              <View style={styles.lineSlot}>
                <View style={styles.horizontalLine} />
                {!isLast && <View style={styles.verticalLineExtended} />}
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.nodeCard, { borderLeftColor: node.color || '#4F46E5' }]}
            onPress={() => {
              if (node.id === 'known') router.push('/known-words');
              else if (node.id === 'vague') router.push('/vague-words');
              else if (node.id === 'unknown') router.push('/unknown-words');
              else if (node.id === 'learning' || node.id === 'daily' || node.id === 'review') router.push('/word-preview');
            }}
          >
            <View style={[styles.nodeDot, { backgroundColor: node.color || '#4F46E5' }]} />
            <View style={styles.nodeContent}>
              <Text style={styles.nodeLabel}>{node.label}</Text>
              {typeof node.count === 'number' && (
                <Text style={[styles.nodeCount, { color: node.color || '#4F46E5' }]}>
                  {node.count} 词
                </Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {hasChildren &&
          node.children!.map((child, idx) =>
            renderNode(child, level + 1, idx === node.children!.length - 1, [...parentLastStack, isLast])
          )}
      </View>
    );
  };

  if (!isConfigLoaded || isLoading) {
    return (
      <Screen>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>词汇树状图</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Tree Diagram */}
        <View style={styles.treeContainer}>
          {renderNode(treeData)}
        </View>

        {/* Summary Stats */}
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>统计概览</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { borderTopColor: '#0EA5E9' }]}>
              <Text style={[styles.statNumber, { color: '#0EA5E9' }]}>{counts.b}</Text>
              <Text style={styles.statLabel}>学习中</Text>
            </View>
            <View style={[styles.statCard, { borderTopColor: '#059669' }]}>
              <Text style={[styles.statNumber, { color: '#059669' }]}>{counts.x}</Text>
              <Text style={styles.statLabel}>已会</Text>
            </View>
            <View style={[styles.statCard, { borderTopColor: '#D97706' }]}>
              <Text style={[styles.statNumber, { color: '#D97706' }]}>{counts.y}</Text>
              <Text style={styles.statLabel}>模糊</Text>
            </View>
            <View style={[styles.statCard, { borderTopColor: '#DC2626' }]}>
              <Text style={[styles.statNumber, { color: '#DC2626' }]}>{counts.z}</Text>
              <Text style={styles.statLabel}>生词</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  contentContainer: {
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  placeholder: {
    width: 32,
  },
  treeContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  nodeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  lineContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginRight: 4,
    marginTop: 18,
  },
  lineSlot: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  verticalLine: {
    position: 'absolute',
    left: 10,
    top: -18,
    width: 1,
    height: 38,
    backgroundColor: '#D1D5DB',
  },
  verticalLineExtended: {
    position: 'absolute',
    left: 10,
    top: 2,
    width: 1,
    height: 28,
    backgroundColor: '#D1D5DB',
  },
  horizontalLine: {
    position: 'absolute',
    left: 10,
    top: 10,
    width: 12,
    height: 1,
    backgroundColor: '#D1D5DB',
  },
  nodeCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  nodeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  nodeContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nodeLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  nodeCount: {
    fontSize: 13,
    fontWeight: '500',
    marginRight: 4,
  },
  statsContainer: {
    marginTop: 8,
    paddingHorizontal: 16,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    marginLeft: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
});
