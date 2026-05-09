import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_W } = Dimensions.get('window');

interface BranchNode {
  id: string;
  label: string;
  page: string;
  color: string;
}

interface SubNode {
  id: string;
  label: string;
  parentId: string;
}

const leftNodes: BranchNode[] = [
  { id: '1', label: '（一）身体部位', page: '/ 1', color: '#0EA5E9' },
  { id: '2', label: '（二）属性特征', page: '/ 5', color: '#059669' },
  { id: '3', label: '（三）能力', page: '/ 6', color: '#D97706' },
  { id: '4', label: '（四）情绪', page: '/ 9', color: '#DC2626' },
  { id: '5', label: '（五）所欲', page: '/ 11', color: '#8B5CF6' },
];

const rightNodes: BranchNode[] = [
  { id: '6', label: '（六）行为与限制', page: '/ 12', color: '#EC4899' },
  { id: '7', label: '（七）年龄', page: '/ 15', color: '#14B8A6' },
  { id: '8', label: '（八）谱系', page: '/ 16', color: '#F59E0B' },
  { id: '9', label: '（九）人类与群组', page: '/ 18', color: '#6366F1' },
  { id: '10', label: '（十）职业及其他', page: '/ 19', color: '#10B981' },
];

const bodySubNodes: SubNode[] = [
  { id: '1-1', label: '1. 头~颈', parentId: '1' },
  { id: '1-2', label: '2. 肩~腹', parentId: '1' },
  { id: '1-3', label: '3. 腿脚', parentId: '1' },
];

const centerColor = '#4F46E5';

function SubBranchCard({ node, onPress }: { node: SubNode; onPress?: () => void }) {
  return (
    <TouchableOpacity style={styles.subCard} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.subLabel}>{node.label}</Text>
    </TouchableOpacity>
  );
}

function BranchCard({
  node,
  align,
  onPress,
  expanded,
  onToggle,
}: {
  node: BranchNode;
  align: 'left' | 'right';
  onPress?: () => void;
  expanded?: boolean;
  onToggle?: () => void;
}) {
  const isBody = node.id === '1';
  return (
    <View style={align === 'left' ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }}>
      <TouchableOpacity
        style={[styles.branchCard, align === 'left' ? styles.branchLeft : styles.branchRight]}
        onPress={isBody ? onToggle : onPress}
        activeOpacity={0.7}
      >
        <View style={[styles.branchDot, { backgroundColor: node.color }]} />
        <View style={styles.branchContent}>
          <Text style={styles.branchLabel} numberOfLines={1}>{node.label}</Text>
        </View>
        {isBody && (
          <Ionicons
            name={expanded ? 'chevron-down' : 'chevron-forward'}
            size={14}
            color={node.color}
            style={{ marginLeft: 4 }}
          />
        )}
      </TouchableOpacity>
    </View>
  );
}

function Connector({ align }: { align: 'left' | 'right' }) {
  return (
    <View style={[styles.connectorRow, align === 'left' ? { flexDirection: 'row-reverse' } : { flexDirection: 'row' }]}>
      <View style={styles.connectorDot} />
      <View style={styles.connectorLine} />
    </View>
  );
}

export default function TreeDiagramPage() {
  const router = useSafeRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleNodePress = (node: BranchNode) => {
    router.push('/word-preview', { category: node.label, categoryId: node.id });
  };

  const handleSubPress = (sub: SubNode) => {
    if (sub.id === '1-1') {
      router.push('/subcategory-words', { table: '111', title: '头~颈' });
    } else {
      router.push('/word-preview', { category: sub.label, subCategoryId: sub.id });
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const isBodyExpanded = expandedId === '1';

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

        {/* Mind Map Body */}
        <View style={styles.mapBody}>
          {leftNodes.map((leftNode, idx) => {
            const rightNode = rightNodes[idx];
            const isCenterRow = idx === 2;
            const isBodyRow = idx === 0;

            return (
              <View key={leftNode.id}>
                <View style={styles.row}>
                  {/* Left side */}
                  <View style={styles.side}>
                    <BranchCard
                      node={leftNode}
                      align="left"
                      onPress={() => handleNodePress(leftNode)}
                      expanded={isBodyExpanded}
                      onToggle={() => toggleExpand(leftNode.id)}
                    />
                  </View>

                  {/* Center connector or node */}
                  {isCenterRow ? (
                    <View style={styles.centerNodeContainer}>
                      <Connector align="left" />
                      <View style={styles.centerNode}>
                        <View style={[styles.centerDot, { backgroundColor: centerColor }]} />
                        <Text style={styles.centerLabel}>第一章</Text>
                        <Text style={styles.centerSubLabel}>人</Text>
                      </View>
                      <Connector align="right" />
                    </View>
                  ) : (
                    <View style={styles.centerSpacer}>
                      <View style={[styles.spacerLine, { marginTop: idx < 2 ? 30 : 10 }]} />
                    </View>
                  )}

                  {/* Right side */}
                  <View style={styles.side}>
                    <BranchCard
                      node={rightNode}
                      align="right"
                      onPress={() => handleNodePress(rightNode)}
                    />
                  </View>
                </View>

                {/* Sub nodes for body */}
                {isBodyRow && isBodyExpanded && (
                  <View style={styles.subRow}>
                    <View style={styles.subContainer}>
                      <View style={styles.subConnectorVertical} />
                      <View style={styles.subList}>
                        {bodySubNodes.map((sub, sIdx) => (
                          <View key={sub.id} style={styles.subItemWrapper}>
                            <View style={styles.subConnectorHorizontal} />
                            <SubBranchCard node={sub} onPress={() => handleSubPress(sub)} />
                            {sIdx < bodySubNodes.length - 1 && (
                              <View style={styles.subConnectorGap} />
                            )}
                          </View>
                        ))}
                      </View>
                    </View>
                    <View style={styles.centerSpacer} />
                    <View style={styles.side} />
                  </View>
                )}
              </View>
            );
          })}
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
  mapBody: {
    paddingHorizontal: 12,
    paddingTop: 24,
    paddingBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  side: {
    flex: 1,
    maxWidth: (SCREEN_W - 140) / 2,
  },
  branchCard: {
    backgroundColor: '#4CAF50',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 110,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  branchLeft: {},
  branchRight: {},
  branchDot: {
    display: 'none',
  },
  branchContent: {
    alignItems: 'center',
  },
  branchLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  branchPage: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  centerNodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  centerNode: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: centerColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 2,
    borderColor: centerColor,
  },
  centerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: 4,
  },
  centerLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: centerColor,
  },
  centerSubLabel: {
    fontSize: 20,
    fontWeight: '800',
    color: centerColor,
  },
  connectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 20,
  },
  connectorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#D1D5DB',
  },
  connectorDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#9CA3AF',
  },
  centerSpacer: {
    width: 90,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  spacerLine: {
    width: 1,
    height: 24,
    backgroundColor: '#D1D5DB',
  },
  // Sub nodes styles
  subRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginBottom: 14,
  },
  subContainer: {
    flex: 1,
    maxWidth: (SCREEN_W - 140) / 2,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
  },
  subConnectorVertical: {
    width: 1,
    height: 60,
    backgroundColor: '#D1D5DB',
    marginRight: -1,
    marginTop: -8,
  },
  subList: {
    alignItems: 'flex-start',
  },
  subItemWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subConnectorHorizontal: {
    width: 16,
    height: 1,
    backgroundColor: '#D1D5DB',
  },
  subConnectorGap: {
    width: 1,
    height: 12,
    backgroundColor: '#D1D5DB',
    marginLeft: 16,
  },
  subCard: {
    backgroundColor: '#E0F2FE',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#0EA5E9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  subLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0369A1',
  },
});
