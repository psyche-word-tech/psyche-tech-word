/* eslint-disable react-hooks/refs */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  PanResponder,
  ScrollView,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = 110;
const CARD_HEIGHT = 56;
const CARD_GAP = 12;

interface Word {
  id: number;
  word: string;
  phonetic: string | null;
  meaning: string | null;
  example_sentence: string | null;
}

const CATEGORIES = [
  { key: 'known', label: '已会', color: '#22C55E' },
  { key: 'fuzzy', label: '模糊', color: '#F59E0B' },
  { key: 'unknown', label: '不会', color: '#EF4444' },
];

// ─── 单词卡片组件（独立处理点击）─────────────────────
function WordCard({
  word,
  index,
  onPress,
}: {
  word: Word;
  index: number;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={styles.card}
      onPress={onPress}
    >
      <Text style={styles.cardText}>{word.word}</Text>
    </TouchableOpacity>
  );
}

// ─── 主页面 ───────────────────────────────────────
export default function LearnPage() {
  const router = useSafeRouter();
  const { table = 'words_b' } = useSafeSearchParams<{ table: string }>();

  // ── 状态 ──
  const [words, setWords] = useState<Word[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [classifyingId, setClassifyingId] = useState<number | null>(null);
  const [draggingIdx, setDraggingIdx] = useState<number>(-1);
  const [catCounts, setCatCounts] = useState({ known: 0, vague: 0, unknown: 0 });

  // ── 动画值 ──
  const dragTx = useRef(new Animated.Value(0)).current;
  const dragTy = useRef(new Animated.Value(0)).current;
  const dragScale = useRef(new Animated.Value(1)).current;

  // 滚动偏移量追踪
  const scrollBaseRef = useRef(0);

  // 分类按钮位置
  const catBtnLayouts = useRef<Record<string, { x: number; y: number; w: number; h: number }>>({}).current;

  // 当前拖拽的单词信息
  const draggingWordRef = useRef<Word | null>(null);

  // ── fetchCategoryStats ──
  /**
   * 服务端文件：server/src/routes/wordbooks.ts
   * 接口：GET /api/v1/wordbooks/stats
   * 返回：{ learning: number, known: number, vague: number, unknown: number }
   */
  const fetchCatStats = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/wordbooks/stats`);
      if (res.ok) {
        const data = await res.json();
        setCatCounts({ known: data.known || 0, vague: data.vague || 0, unknown: data.unknown || 0 });
      }
    } catch (e) {
      console.error('fetchCatStats error:', e);
    }
  }, []);

  // ── fetchWords ──
  /**
   * 服务端文件：server/src/routes/wordbooks.ts
   * 接口：GET /api/v1/wordbooks/:table
   * Query 参数：offset: number, limit: number
   */
  const fetchWords = useCallback(async (newOffset?: number) => {
    try {
      const off = newOffset ?? offset;
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/wordbooks/${table}?offset=${off}&limit=20`
      );
      if (res.ok) {
        const data = await res.json();
        if (newOffset === undefined || newOffset === 0) {
          setWords(data.words || data || []);
        } else {
          setWords((prev) => [...prev, ...(data.words || data || [])]);
        }
      }
    } catch (e) {
      console.error('fetchWords error:', e);
    } finally {
      setLoading(false);
    }
  }, [table, offset]);

  // ── 加载初始数据 ──
  useEffect(() => {
    let cancelled = false;
    const doFetch = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/wordbooks/${table}?offset=${offset}&limit=20`
        );
        if (!cancelled && res.ok) {
          const data = await res.json();
          setWords(data.words || data || []);
        }
        if (!cancelled) { fetchCatStats(); }
      } catch (e) {
        console.error('fetchWords error:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    doFetch();
    return () => { cancelled = true; };
  }, [table]);

  // ── 点击单词 → 进入详情 ──
  const handleTapWord = useCallback((idx: number) => {
    if (idx >= 0 && idx < words.length) {
      router.push('/word-detail', { id: words[idx].id });
    }
  }, [router, words]);

  // ── 拖拽分类：将单词从 words_b 复制到目标表并删除 ──
  const handleClassify = useCallback(async (wordId: number, category: string) => {
    try {
      /**
       * 服务端文件：server/src/routes/user-words.ts
       * 接口：POST /api/v1/user-words/move
       * Body 参数：wordId: number, targetTable: string ('words_x'|'words_y'|'words_z')
       */
      const tableMap: Record<string, string> = { known: 'words_x', vague: 'words_y', unknown: 'words_z' };
      const targetTable = tableMap[category];
      if (!targetTable) return;

      const res = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/user-words/move`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wordId, targetTable }),
        }
      );
      if (res.ok) {
        setWords((prev) => prev.filter((w) => w.id !== wordId));
        fetchCatStats();
      }
    } catch (e) {
      console.error('classify error:', e);
    }
    setClassifyingId(null);
    setDraggingIdx(-1);
    draggingWordRef.current = null;
  }, [fetchCatStats]);

  // ── loadMore ──
  const loadMore = useCallback(() => {
    const newOff = offset + words.length;
    setOffset(newOff);
    fetchWords(newOff);
  }, [offset, words.length, fetchWords]);

  // ── handleCategoryPress ──
  const handleCategoryPress = useCallback((category: string) => {
    if (classifyingId !== null) {
      handleClassify(classifyingId, category);
    }
  }, [classifyingId, handleClassify]);

  // ── 单个卡片的拖拽 PanResponder（仅用于拖拽分类，不影响点击）──
  /* eslint-disable react-hooks/purity */
  const createDragResponder = useCallback((idx: number) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gs) => {
        // 只有向下移动超过阈值才激活（区分于水平滚动）
        return Math.abs(gs.dy) > 20 && gs.dy > 15 && Math.abs(gs.dy) > Math.abs(gs.dx) * 0.5;
      },

      onPanResponderGrant(_, gs) {
        if (idx < 0 || idx >= words.length) return;
        const word = words[idx];
        setClassifyingId(word.id);
        setDraggingIdx(idx);
        draggingWordRef.current = word;
        dragTx.setValue(0);
        dragTy.setValue(0);
        dragScale.setValue(1);
        Animated.spring(dragScale, { toValue: 1.08, useNativeDriver: true }).start();
      },

      onPanResponderMove(_, gs) {
        dragTx.setValue(gs.dx);
        dragTy.setValue(gs.dy);
      },

      onPanResponderRelease(_, gs) {
        const my = gs.moveY;
        const droppedCategory = Object.keys(catBtnLayouts).find((key) => {
          const b = catBtnLayouts[key];
          return b && my >= b.y && my <= b.y + b.h;
        });

        if (droppedCategory && classifyingId !== null) {
          handleClassify(classifyingId, droppedCategory);
        } else {
          // 回弹
          Animated.parallel([
            Animated.spring(dragTx, { toValue: 0, useNativeDriver: true }),
            Animated.spring(dragTy, { toValue: 0, useNativeDriver: true }),
            Animated.spring(dragScale, { toValue: 1, useNativeDriver: true }),
          ]).start(() => {
            setClassifyingId(null);
            setDraggingIdx(-1);
            draggingWordRef.current = null;
          });
        }
      },

      onPanResponderTerminate: () => {
        Animated.parallel([
          Animated.spring(dragTx, { toValue: 0, useNativeDriver: true }),
          Animated.spring(dragTy, { toValue: 0, useNativeDriver: true }),
          Animated.spring(dragScale, { toValue: 1, useNativeDriver: true }),
        ]).start(() => {
          setClassifyingId(null);
          setDraggingIdx(-1);
          draggingWordRef.current = null;
        });
      },
    })
  , [words, classifyingId, dragTx, dragTy, dragScale, handleClassify]);
  /* eslint-enable react-hooks/purity */

  // ── 渲染 ──
  const remaining = words.length;
  const rowWidth = words.length * (CARD_WIDTH + CARD_GAP);

  return (
    <Screen>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.backText}>back</Text>
        </TouchableOpacity>
        <Text style={styles.titleText}>词汇预览</Text>
        <TouchableOpacity hitSlop={8}>
          <FontAwesome6 name="calendar" size={18} color="#374151" />
        </TouchableOpacity>
      </View>

      {/* 剩余数量 */}
      <Text style={styles.remainingText}>剩余 {remaining} 个单词</Text>

      {/* 单词卡片行 — 用 ScrollView 实现原生水平滚动 */}
      <View style={styles.scrollContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.wordRow,
            { width: Math.max(rowWidth + 24, SCREEN_WIDTH) },
          ]}
          decelerationRate="fast"
          snapToInterval={CARD_WIDTH + CARD_GAP}
          onMomentumScrollEnd={(e) => {
            const offsetX = e.nativeEvent.contentOffset.x;
            scrollBaseRef.current = offsetX;
            // 接近末尾自动加载更多
            const visibleEnd = offsetX + SCREEN_WIDTH;
            const totalContent = words.length * (CARD_WIDTH + CARD_GAP);
            if (totalContent - visibleEnd < CARD_WIDTH * 3 && !loading) {
              loadMore();
            }
          }}
        >
          {words.map((word, index) => {
            // 被拖拽中的位置显示占位
            if (classifyingId === word.id && index === draggingIdx && draggingWordRef.current) {
              return <View key={word.id} style={[styles.card, styles.cardPlaceholder]} />;
            }

            const responder = createDragResponder(index);

            return (
              <View key={word.id} {...responder.panHandlers}>
                <WordCard word={word} index={index} onPress={() => handleTapWord(index)} />
              </View>
            );
          })}
        </ScrollView>

        {/* 拖拽中浮动的卡片 */}
        {classifyingId != null && draggingWordRef.current && (
          <Animated.View
            style={[
              styles.card,
              styles.draggingCard,
              {
                transform: [{ translateX: dragTx }, { translateY: dragTy }, { scale: dragScale }],
                position: 'absolute' as const,
                left: 16,
                top: 8,
              },
            ]}
          >
            <Text style={styles.cardText}>{draggingWordRef.current.word}</Text>
          </Animated.View>
        )}
      </View>

      {/* 分类按钮区 */}
      <View style={styles.categorySection}>
        <View style={styles.categoryRow}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[styles.catButton, { backgroundColor: cat.color }]}
              onPress={() => handleCategoryPress(cat.key)}
              activeOpacity={0.7}
              onLayout={(e) => {
                const l = e.nativeEvent.layout;
                catBtnLayouts[cat.key] = { x: l.x, y: l.y, w: l.width, h: l.height };
              }}
            >
              <Text style={styles.catLabel}>{cat.label}</Text>
              <Text style={styles.catCount}>
                ({cat.key === 'known' ? catCounts.known : cat.key === 'fuzzy' ? catCounts.vague : catCounts.unknown})
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.catHint}>
          {classifyingId != null ? '松手即可归类' : '单击卡片查看详情，长按向下拖拽可分类'}
        </Text>
      </View>

      {/* 加载提示 */}
      {loading && words.length === 0 && (
        <Text style={{ textAlign: 'center', color: '#999', marginTop: 40 }}>加载中...</Text>
      )}
    </Screen>
  );
}

// ─── 样式 ─────────────────────────────────────────
const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backText: { fontSize: 16, color: '#4F46E5', fontWeight: '500' },
  titleText: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  remainingText: { textAlign: 'center', color: '#6B7280', fontSize: 14, marginTop: 16, marginBottom: 24 },

  // 滚动容器：固定高度，用于定位浮动卡片
  scrollContainer: {
    height: CARD_HEIGHT + 32,
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: CARD_GAP,
  },

  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  cardPlaceholder: { opacity: 0, borderWidth: 0, elevation: 0, shadowOpacity: 0 },
  cardText: { fontSize: 17, fontWeight: '600', color: '#1F2937' },
  draggingCard: {
    zIndex: 100,
    elevation: 20,
    borderColor: '#4F46E5',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },

  categorySection: { marginTop: 36, paddingHorizontal: 20 },
  categoryRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  catButton: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  catLabel: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  catCount: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  catHint: { textAlign: 'center', color: '#9CA3AF', fontSize: 13, marginTop: 12 },
});
