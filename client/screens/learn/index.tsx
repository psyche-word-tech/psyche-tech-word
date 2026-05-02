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
const ROW_PADDING_LEFT = 16; // wordRow 的 paddingHorizontal

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

  // 分类按钮位置
  const catBtnLayouts = useRef<Record<string, { x: number; y: number; w: number; h: number }>>({}).current;

  // 当前拖拽的单词 + 初始位置
  const draggingWordRef = useRef<Word | null>(null);
  const dragOriginRef = useRef({ x: 0, y: 0 });

  // ScrollView 引用
  const scrollViewRef = useRef<ScrollView>(null);

  // ── fetchCategoryStats ──
  /**
   * 服务端文件：server/src/routes/wordbooks.ts
   * 接口：GET /api/v1/wordbooks/stats
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

  // ── 开始拖拽（由长按触发）──
  const startDrag = useCallback((idx: number) => {
    if (idx < 0 || idx >= words.length) return;
    const word = words[idx];
    draggingWordRef.current = word;

    // 基于索引计算卡片在 scrollContainer 内的相对 x 位置
    const cardX = ROW_PADDING_LEFT + idx * (CARD_WIDTH + CARD_GAP);
    const cardY = 8; // scrollContainer 内垂直居中偏移

    dragOriginRef.current = { x: cardX, y: cardY };
    setClassifyingId(word.id);
    setDraggingIdx(idx);
    dragTx.setValue(0);
    dragTy.setValue(0);
    dragScale.setValue(1);
    Animated.spring(dragScale, { toValue: 1.08, useNativeDriver: true }).start();
  }, [words, dragTx, dragTy, dragScale]);

  // ── 拖拽分类 ──
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
    // 直接重置拖拽状态
    setClassifyingId(null);
    setDraggingIdx(-1);
    draggingWordRef.current = null;
  }, [fetchCatStats]);

  // ── 取消拖拽回弹 ──
  const cancelDrag = useCallback(() => {
    Animated.parallel([
      Animated.spring(dragTx, { toValue: 0, useNativeDriver: true }),
      Animated.spring(dragTy, { toValue: 0, useNativeDriver: true }),
      Animated.spring(dragScale, { toValue: 1, useNativeDriver: true }),
    ]).start(() => {
      setClassifyingId(null);
      setDraggingIdx(-1);
      draggingWordRef.current = null;
    });
  }, [dragTx, dragTy, dragScale]);

  // ── loadMore ──
  const loadMore = useCallback(() => {
    const newOff = offset + words.length;
    setOffset(newOff);
    fetchWords(newOff);
  }, [offset, words.length, fetchWords]);

  // ── 分类按钮点击 ──
  const handleCategoryPress = useCallback((category: string) => {
    if (classifyingId !== null) {
      handleClassify(classifyingId, category);
    }
  }, [classifyingId, handleClassify]);

  // ── 浮动卡片拖拽 PanResponder（绑定在浮动卡片上，不影响 ScrollView）──
  /* eslint-disable react-hooks/purity */
  const floatingDragResponder = useCallback(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,

        onPanResponderGrant() {
          dragTx.setValue(0);
          dragTy.setValue(0);
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
            cancelDrag();
          }
        },

        onPanResponderTerminate: () => cancelDrag(),
      }),
    [dragTx, dragTy, classifyingId, handleClassify, cancelDrag]
  );
  // 实例化（useCallback 返回工厂函数，调用一次得到 responder）
  const dragResponderInstance = useRef(floatingDragResponder()).current;
  /* eslint-enable react-hooks/purity */

  // ── 渲染 ──
  const remaining = words.length;
  const rowWidth = words.length * (CARD_WIDTH + CARD_GAP);
  const origin = dragOriginRef.current;

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

      {/* 单词卡片行 — ScrollView 原生水平滚动（内部零手势冲突） */}
      <View style={styles.scrollContainer}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.wordRow,
            { width: Math.max(rowWidth + ROW_PADDING_LEFT * 2, SCREEN_WIDTH) },
          ]}
          decelerationRate="fast"
          snapToInterval={CARD_WIDTH + CARD_GAP}
          onMomentumScrollEnd={(e) => {
            const visibleEnd = e.nativeEvent.contentOffset.x + SCREEN_WIDTH;
            const totalContent = words.length * (CARD_WIDTH + CARD_GAP);
            if (totalContent - visibleEnd < CARD_WIDTH * 3 && !loading) {
              loadMore();
            }
          }}
        >
          {words.map((word, index) =>
            classifyingId === word.id && index === draggingIdx ? (
              <View key={word.id} style={[styles.card, styles.cardPlaceholder]} />
            ) : (
              <TouchableOpacity
                key={word.id}
                activeOpacity={0.8}
                style={styles.card}
                onPress={() => handleTapWord(index)}
                onLongPress={() => startDrag(index)}
                delayLongPress={350}
              >
                <Text style={styles.cardText}>{word.word}</Text>
              </TouchableOpacity>
            )
          )}
        </ScrollView>

        {/* 拖拽中浮动的卡片（绝对定位在 scrollContainer 内，不在 ScrollView 中） */}
        {classifyingId != null && draggingWordRef.current && (
          <Animated.View
            style={[
              styles.card,
              styles.draggingCard,
              {
                position: 'absolute',
                left: origin.x,
                top: origin.y,
                transform: [{ translateX: dragTx }, { translateY: dragTy }, { scale: dragScale }],
              },
            ]}
            {...dragResponderInstance.panHandlers}
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
          {classifyingId != null ? '松手即可归类' : '单击查看详情 · 长按拖拽可分类'}
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

  scrollContainer: {
    height: CARD_HEIGHT + 28,
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ROW_PADDING_LEFT,
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
  cardPlaceholder: {
    opacity: 0.15,
    borderWidth: 1.5,
    borderColor: '#4F46E5',
    borderStyle: 'dashed',
  },
  cardText: { fontSize: 17, fontWeight: '600', color: '#1F2937' },
  draggingCard: {
    zIndex: 100,
    elevation: 20,
    borderColor: '#4F46E5',
    borderWidth: 2,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },

  categorySection: { marginTop: 36, paddingHorizontal: 20 },
  categoryRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  catButton: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  catLabel: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  catCount: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  catHint: { textAlign: 'center', color: '#9CA3AF', fontSize: 13, marginTop: 12 },
});
