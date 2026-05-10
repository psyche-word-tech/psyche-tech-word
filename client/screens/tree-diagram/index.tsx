import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '@/utils/apiConfig';

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

interface WordItem {
  id: number;
  word: string;
  phonetic: string;
  meaning: string;
}

const leftNodes: BranchNode[] = [
  { id: '1', label: '（一）身体部位', page: '/ 1', color: '#0EA5E9' },
  { id: '2', label: '（二）属性特征', page: '/ 5', color: '#059669' },
];

const rightNodes: BranchNode[] = [
  { id: '6', label: '（六）行为与限制', page: '/ 12', color: '#EC4899' },
  { id: '7', label: '（七）年龄', page: '/ 15', color: '#14B8A6' },
];

const bottomNodes: BranchNode[] = [
  { id: '3', label: '（三）能力', page: '/ 6', color: '#D97706' },
  { id: '4', label: '（四）情绪', page: '/ 9', color: '#DC2626' },
  { id: '5', label: '（五）所欲', page: '/ 11', color: '#8B5CF6' },
  { id: '8', label: '（八）谱系', page: '/ 16', color: '#F59E0B' },
  { id: '9', label: '（九）人类与群组', page: '/ 18', color: '#6366F1' },
  { id: '10', label: '（十）职业及其他', page: '/ 19', color: '#10B981' },
];

const bodySubNodes: SubNode[] = [
  { id: '1-1', label: '1. 头~颈', parentId: '1' },
  { id: '1-2', label: '2. 肩~腹', parentId: '1' },
  { id: '1-3', label: '3. 腿脚', parentId: '1' },
];

// 分类到数据表的映射
const categoryTableMap: Record<string, string> = {
  '1': '11',
  '1-1': '111',
  '1-2': '112',
  '1-3': '113',
  '2': '21',
  '3': '22',
  '4': '23',
  '5': '24',
  '6': '25',
  '7': '26',
  '8': '27',
  '9': '28',
  '10': '29',
};

const centerColor = '#4F46E5';

function SubBranchCard({
  node,
  onPress,
  onDoublePress,
}: {
  node: SubNode;
  onPress?: () => void;
  onDoublePress?: () => void;
}) {
  const lastTapRef = useRef<{ time: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePress = () => {
    const now = Date.now();
    if (lastTapRef.current && now - lastTapRef.current.time < 300) {
      // 双击
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      lastTapRef.current = null;
      onDoublePress?.();
    } else {
      // 单击（延迟执行）
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        onPress?.();
        timerRef.current = null;
      }, 300);
      lastTapRef.current = { time: now };
    }
  };

  return (
    <TouchableOpacity style={styles.subCard} onPress={handlePress} activeOpacity={0.7}>
      <Text style={styles.subLabel}>{node.label}</Text>
    </TouchableOpacity>
  );
}

function BranchCard({
  node,
  align,
  onPress,
  onDoublePress,
  expanded,
  onToggle,
}: {
  node: BranchNode;
  align?: 'left' | 'right' | 'center';
  onPress?: () => void;
  onDoublePress?: () => void;
  expanded?: boolean;
  onToggle?: () => void;
}) {
  const isBody = node.id === '1';
  const lastTapRef = useRef<{ time: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePress = () => {
    const now = Date.now();
    if (lastTapRef.current && now - lastTapRef.current.time < 300) {
      // 双击
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      lastTapRef.current = null;
      onDoublePress?.();
    } else {
      // 单击（延迟执行）
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        if (isBody) {
          onToggle?.();
        } else {
          onPress?.();
        }
        timerRef.current = null;
      }, 300);
      lastTapRef.current = { time: now };
    }
  };

  const alignStyle =
    align === 'left' ? { alignItems: 'flex-end' as const } :
    align === 'center' ? { alignItems: 'center' as const } :
    { alignItems: 'flex-start' as const };

  const cardStyle =
    align === 'left' ? styles.branchLeft :
    align === 'center' ? styles.branchCenter :
    styles.branchRight;

  return (
    <View style={alignStyle}>
      <TouchableOpacity
        style={[styles.branchCard, cardStyle]}
        onPress={handlePress}
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
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalWords, setModalWords] = useState<WordItem[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [currentTable, setCurrentTable] = useState('');

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

  const fetchCategoryWords = useCallback(async (categoryId: string, title: string) => {
    const tableName = categoryTableMap[categoryId];
    setCurrentTable(tableName || '');

    if (!tableName) {
      setModalTitle(title);
      setModalWords([]);
      setModalVisible(true);
      return;
    }

    setModalLoading(true);
    setModalVisible(true);
    setModalTitle(title);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/wordbooks/${tableName}`);
      const data = await response.json();
      if (!Array.isArray(data)) {
        setModalWords([]);
        setModalLoading(false);
        return;
      }

      // 111 表过滤掉已在 x1/y1/z1 中分类的单词
      if (tableName === '111') {
        const [x1Res, y1Res, z1Res] = await Promise.all([
          fetch(`${API_BASE_URL}/api/v1/wordbooks/x1`),
          fetch(`${API_BASE_URL}/api/v1/wordbooks/y1`),
          fetch(`${API_BASE_URL}/api/v1/wordbooks/z1`),
        ]);
        const [x1Data, y1Data, z1Data] = await Promise.all([
          x1Res.json(),
          y1Res.json(),
          z1Res.json(),
        ]);
        const classifiedWords = new Set([
          ...(Array.isArray(x1Data) ? x1Data.map((w: any) => w.word) : []),
          ...(Array.isArray(y1Data) ? y1Data.map((w: any) => w.word) : []),
          ...(Array.isArray(z1Data) ? z1Data.map((w: any) => w.word) : []),
        ]);
        const filtered = data.filter((w: WordItem) => !classifiedWords.has(w.word));
        setModalWords(filtered);
      } else {
        setModalWords(data);
      }
    } catch (error) {
      console.error('Failed to fetch category words:', error);
      setModalWords([]);
    } finally {
      setModalLoading(false);
    }
  }, []);

  const handleWordPress = (word: WordItem) => {
    setModalVisible(false);
    if (!currentTable) return;
    router.push('/word-detail', {
      word: JSON.stringify(word),
      table: currentTable,
      from: 'mindmap',
    });
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
                      onDoublePress={() => fetchCategoryWords(leftNode.id, leftNode.label)}
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
                      onDoublePress={() => fetchCategoryWords(rightNode.id, rightNode.label)}
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
                          <View
                            key={sub.id}
                            style={[
                              styles.subItemWrapper,
                              { marginLeft: sIdx * 14 },
                            ]}
                          >
                            <View style={[styles.subConnectorHorizontal, { width: 14 + sIdx * 8 }]} />
                            <SubBranchCard
                              node={sub}
                              onPress={() => handleSubPress(sub)}
                              onDoublePress={() => fetchCategoryWords(sub.id, sub.label)}
                            />
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

          {/* Bottom nodes */}
          {bottomNodes.length > 0 && (
            <View style={styles.bottomSection}>
              <View style={styles.bottomConnectorLine} />
              <View style={styles.bottomNodesRow}>
                {bottomNodes.map((node) => (
                  <View key={node.id} style={styles.bottomNodeWrapper}>
                    <View style={styles.bottomConnectorVertical} />
                    <BranchCard
                      node={node}
                      align="center"
                      onPress={() => handleNodePress(node)}
                      onDoublePress={() => fetchCategoryWords(node.id, node.label)}
                    />
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Words Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{modalTitle}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Modal Body */}
            {modalLoading ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color={centerColor} />
                <Text style={styles.modalLoadingText}>加载中...</Text>
              </View>
            ) : modalWords.length === 0 ? (
              <View style={styles.modalEmpty}>
                <Ionicons name="document-text-outline" size={48} color="#D1D5DB" />
                <Text style={styles.modalEmptyText}>暂无单词</Text>
              </View>
            ) : (
              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.modalWordsGrid}>
                  {modalWords.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.modalWordCard}
                      onPress={() => handleWordPress(item)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.modalWordText}>{item.word}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
  branchCenter: {},
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
  // Bottom nodes styles
  bottomSection: {
    alignItems: 'center',
    marginTop: 4,
  },
  bottomConnectorLine: {
    width: 1,
    height: 24,
    backgroundColor: '#D1D5DB',
  },
  bottomNodesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
    paddingHorizontal: 12,
  },
  bottomNodeWrapper: {
    alignItems: 'center',
  },
  bottomConnectorVertical: {
    width: 1,
    height: 16,
    backgroundColor: '#D1D5DB',
    marginBottom: -1,
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
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#0EA5E9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  subLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0EA5E9',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    minHeight: 300,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalLoading: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  modalLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  modalEmpty: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  modalEmptyText: {
    marginTop: 12,
    fontSize: 15,
    color: '#9CA3AF',
  },
  modalScroll: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  modalWordsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  modalWordCard: {
    width: '31%',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    marginBottom: 6,
  },
  modalWordText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
});
