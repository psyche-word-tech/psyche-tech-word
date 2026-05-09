import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { Ionicons } from '@expo/vector-icons';

interface TreeNode {
  id: string;
  label: string;
  page?: string;
  children?: TreeNode[];
  color?: string;
}

const treeData: TreeNode = {
  id: 'root',
  label: '第一章  人',
  color: '#4F46E5',
  children: [
    { id: '1', label: '（一）身体部位', page: '/ 1', color: '#0EA5E9' },
    { id: '2', label: '（二）属性特征', page: '/ 5', color: '#059669' },
    { id: '3', label: '（三）能力', page: '/ 6', color: '#D97706' },
    { id: '4', label: '（四）情绪', page: '/ 9', color: '#DC2626' },
    { id: '5', label: '（五）所欲', page: '/ 11', color: '#8B5CF6' },
    { id: '6', label: '（六）行为与限制', page: '/ 12', color: '#EC4899' },
    { id: '7', label: '（七）年龄', page: '/ 15', color: '#14B8A6' },
    { id: '8', label: '（八）谱系', page: '/ 16', color: '#F59E0B' },
    { id: '9', label: '（九）人类与群组', page: '/ 18', color: '#6366F1' },
    { id: '10', label: '（十）职业及其他', page: '/ 19', color: '#10B981' },
  ],
};

export default function TreeDiagramPage() {
  const router = useSafeRouter();

  const renderNode = (node: TreeNode, level: number = 0, isLast: boolean = true, parentLastStack: boolean[] = []) => {
    const indent = level * 24;
    const hasChildren = node.children && node.children.length > 0;

    return (
      <View key={node.id}>
        <View style={[styles.nodeRow, { marginLeft: indent }]}>
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

          <View style={[styles.nodeCard, { borderLeftColor: node.color || '#4F46E5' }]}>
            <View style={[styles.nodeDot, { backgroundColor: node.color || '#4F46E5' }]} />
            <View style={styles.nodeContent}>
              <Text style={styles.nodeLabel}>{node.label}</Text>
              {node.page && <Text style={styles.nodePage}>{node.page}</Text>}
            </View>
          </View>
        </View>

        {hasChildren &&
          node.children!.map((child, idx) =>
            renderNode(child, level + 1, idx === node.children!.length - 1, [...parentLastStack, isLast])
          )}
      </View>
    );
  };

  return (
    <Screen>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>思维导图</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Mind Map */}
        <View style={styles.treeContainer}>
          {renderNode(treeData)}
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
    marginBottom: 6,
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
    paddingVertical: 14,
    paddingHorizontal: 16,
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
    marginRight: 12,
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
  nodePage: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
});
