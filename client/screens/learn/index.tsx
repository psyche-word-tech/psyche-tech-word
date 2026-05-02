/* eslint-disable react-hooks/refs */
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  PanResponder,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = 110;
const CARD_HEIGHT = 56;
const CARD_GAP = 12;
const VISIBLE_CARDS = 3;

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

// ─── 纯工具函数（组件外部，无状态依赖）────────────

/**
 * 根据触摸位置从卡片位置表中查找对应的单词索引。
 * 比用 scrollOffset 计算更精确，不依赖偏移量同步。
 */
function findCardIndexAtX(
  touchX: number,
  cardLayouts: Map<number, { x: number; w: number }>
): number {
  let bestIdx = -1;
  let bestOverlap = -1;
  for (const [idx, layout] of cardLayouts) {
    const cardCenter = layout.x + layout.w / 2;
    const overlap = Math.max(0, Math.min(touchX, layout.x + layout.w) - Math.max(touchX, layout.x));
    if (overlap > bestOverlap) {
      bestOverlap = overlap;
      bestIdx = idx;
    }
    // 也考虑距离卡片中心的距离作为备选
  }
  // 如果没有重叠匹配，找最近的卡片中心
  if (bestIdx === -1 && cardLayouts.size > 0) {
    let minDist = Infinity;
    for (const [idx, layout] of cardLayouts) {
      const dist = Math.abs(touchX - (layout.x + layout.w / 2));
      if (dist < minDist) {
        minDist = dist;
        bestIdx = idx;
      }
    }
  }
  return bestIdx;
}

// ─── 单词卡片组件 ────────────────────────────────
function WordCard({
  word,
  index,
  onPress,
  onLayout,
  style,
}: {
  word: Word;
  index: number;
  onPress?: () => void;
  onLayout?: (x: number, w: number) => void;
  style?: any;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.card, style]}
      onLayout={(e) => {
        if (onLayout) {
          const { x, width } = e.nativeEvent.layout;
          onLayout(x, width);
        }
      }}
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
  const panX = useRef(new Animated.Value(0)).current;
  const dragTx = useRef(new Animated.Value(0)).current;
  const dragTy = useRef(new Animated.Value(0)).current;
  const dragScale = useRef(new Animated.Value(1)).current;

  // 用 ref 追踪当前滚动偏移量
  const scrollOffsetRef = useRef(0);

  // 每个卡片的屏幕位置映射表（index → {x, w}）
  // 用于精确查找触摸位置对应的单词，避免 scrollOffset 不同步问题
  const cardLayoutsRef = useRef<Map<number, { x: number; w: number }>>(new Map());

  const dragStartedRef = useRef(false);
  const scrollStartedRef = useRef(false);

  const registerCardLayout = useCallback((index: number, x: number, w: number) => {
    cardLayoutsRef.current.set(index, { x, w });
  }, []);

  const unregisterCardLayout = useCallback((index: number) => {
    cardLayoutsRef.current.delete(index);
  }, []);

  // 手势状态 ref
  const gestureStartPos = useRef({ x: 0, y: 0, time: 0 });
  const gestureMode = useRef<'idle' | 'scroll' | 'drag'>('idle');
  const tappedIndex = useRef(-1);
  const dragStartedRefRef = useRef(false);
  const scrollStartedRefRef = useRef(false);

  // 分类按钮位置
  const catBtnLayouts = useRef<{ [key: string]: { x: number; y: number; w: number; h: number } }>({}).current;

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
        // 获取分类统计
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

  // ── handleTapWord ──
  const handleTapWord = useCallback((idx: number) => {
    if (idx >= 0 && idx < words.length) {
      router.push('/word-detail', { id: words[idx].id });
    }
  }, [router, words]);

  // ── handleClassify：将单词从 words_b 复制到目标表并删除 ──
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
  }, []);

  // ── finishGesture ──
  const finishGesture = useCallback(
    (gs?: { dx: number; dy: number; moveY?: number }) => {
      const mode = gestureMode.current;
      const dt = Date.now() - gestureStartPos.current.time;
      const dx = gs?.dx ?? 0;
      const dy = gs?.dy ?? 0;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (mode === 'drag') {
        const my = gs?.moveY ?? 0;
        const droppedCategory = Object.keys(catBtnLayouts).find((key) => {
          const b = catBtnLayouts[key];
          return my >= b.y && my <= b.y + b.h;
        });
        if (droppedCategory && classifyingId !== null) {
          handleClassify(classifyingId, droppedCategory);
        }
        Animated.parallel([
          Animated.spring(dragTx, { toValue: 0, useNativeDriver: true }),
          Animated.spring(dragTy, { toValue: 0, useNativeDriver: true }),
          Animated.spring(dragScale, { toValue: 1, useNativeDriver: true }),
        ]).start(() => {
          setClassifyingId(null);
          setDraggingIdx(-1);
        });
      } else if (mode === 'scroll') {
        const totalWidth = Math.max(1, words.length) * (CARD_WIDTH + CARD_GAP);
        const maxOffset = Math.max(0, totalWidth - SCREEN_WIDTH + 40);
        let targetOffset = scrollOffsetRef.current + dx;
        targetOffset = Math.round(targetOffset / (CARD_WIDTH + CARD_GAP)) * (CARD_WIDTH + CARD_GAP);
        targetOffset = Math.max(-maxOffset, Math.min(0, targetOffset));

        Animated.spring(panX, {
          toValue: targetOffset,
          friction: 8,
          tension: 80,
          useNativeDriver: true,
        }).start();

        scrollOffsetRef.current = targetOffset;

        const currentIdx = Math.round(Math.abs(targetOffset) / (CARD_WIDTH + CARD_GAP));
        if (currentIdx + VISIBLE_CARDS + 2 >= words.length && !loading) {
          const newOff = offset + words.length;
          setOffset(newOff);
          fetchWords(newOff);
        }
      } else if (dt < 250 && dist < 12) {
        handleTapWord(tappedIndex.current);
      }

      gestureMode.current = 'idle';
    },
    [classifyingId, words.length, loading, offset, fetchWords, handleClassify, handleTapWord, panX, dragTx, dragTy, dragScale]
  );

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

  // ── PanResponder ──
  // eslint-disable-next-line react-hooks/purity
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,

        /* eslint-disable react-hooks/purity */
        onPanResponderGrant(_, gs) {
          gestureStartPos.current = { x: gs.x0, y: gs.y0, time: Date.now() };
          gestureMode.current = 'idle';
          dragStartedRef.current = false;
          scrollStartedRef.current = false;

          let foundIdx = -1;
          const touchX = gs.x0;
          for (const [idx, layout] of cardLayoutsRef.current.entries()) {
            if (touchX >= layout.x && touchX <= layout.x + layout.w) {
              foundIdx = idx;
              break;
            }
          }
          if (foundIdx < 0) {
            const step = CARD_WIDTH + CARD_GAP;
            foundIdx = Math.round((scrollOffsetRef.current + touchX) / step);
            foundIdx = Math.max(0, Math.min(foundIdx, words.length - 1));
          }
          tappedIndex.current = foundIdx;
        },

        onPanResponderMove(_, gs) {
          const dx = gs.dx;
          const dy = gs.dy;
          const dt = Date.now() - gestureStartPos.current.time;

          // 已确定模式 → 直接跟随
          if (gestureMode.current === 'drag') {
            dragTx.setValue(dx);
            dragTy.setValue(dy);
            return;
          }
          if (gestureMode.current === 'scroll') {
            panX.setValue(dx);
            return;
          }

          // idle 状态下判定模式
          const absDx = Math.abs(dx);
          const absDy = Math.abs(dy);

          // 向下拖拽 > 20px 且垂直分量更大 → 拖拽分类
          if (absDy > 20 && dy > 15 && absDy > absDx * 0.6 && dt > 120) {
            gestureMode.current = 'drag';
            dragStartedRef.current = true;
            const idx = tappedIndex.current;
            if (idx >= 0 && idx < words.length) {
              setClassifyingId(words[idx].id);
              setDraggingIdx(idx);
            }
            dragTx.setValue(dx);
            dragTy.setValue(dy);
            Animated.spring(dragScale, { toValue: 1.08, useNativeDriver: true }).start();
            return;
          }

          // 水平移动 > 6px → 滚动
          if (absDx > 6) {
            gestureMode.current = 'scroll';
            scrollStartedRef.current = true;
            panX.setOffset(scrollOffsetRef.current);
            panX.setValue(dx);
            return;
          }
        },
        /* eslint-enable react-hooks/purity */

        onPanResponderTerminate: () => finishGesture(),
        onPanResponderRelease: (_, gs) => {
          // release 时如果还是 scroll 模式，需要清理 offset 以便下次使用
          if (gestureMode.current === 'scroll') {
            panX.extractOffset();
            panX.setValue(0);
          }
          finishGesture(gs);
        },
      }),
    [panX, dragTx, dragTy, dragScale, words, finishGesture]
  );

  // ── 渲染 ──
  const remaining = words.length;

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

      {/* 单词卡片区 */}
      <View style={styles.scrollArea} {...panResponder.panHandlers}>
        {/* 正常显示的单词行 */}
        <Animated.View style={[styles.wordRow, { transform: [{ translateX: panX }] }]}>
          {words.map((word, index) =>
            word.id === classifyingId && index === draggingIdx ? (
              <View key={word.id} style={[styles.card, styles.cardPlaceholder]} />
            ) : (
              <WordCard key={word.id} word={word} index={index} onPress={() => handleTapWord(index)} onLayout={(x, w) => registerCardLayout(index, x, w)} />
            )
          )}
        </Animated.View>

        {/* 拖拽中浮动的卡片 */}
        {classifyingId !== null &&
          (() => {
            const w = words.find((word) => word.id === classifyingId);
            if (!w) return null;
            return (
              <Animated.View
                style={[
                  styles.card,
                  styles.draggingCard,
                  {
                    transform: [{ translateX: dragTx }, { translateY: dragTy }, { scale: dragScale }],
                    position: 'absolute' as const,
                  },
                ]}
              >
                <Text style={styles.cardText}>{w.word}</Text>
              </Animated.View>
            );
          })()}
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
              <Text style={styles.catCount}>({cat.key === 'known' ? catCounts.known : cat.key === 'fuzzy' ? catCounts.vague : catCounts.unknown})</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.catHint}>
          {classifyingId !== null ? '松手即可归类' : '单击卡片查看详情，长按拖拽可分类'}
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
  scrollArea: { height: CARD_HEIGHT + 40, justifyContent: 'center', overflow: 'visible' },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: (SCREEN_WIDTH - VISIBLE_CARDS * CARD_WIDTH - (VISIBLE_CARDS - 1) * CARD_GAP) / 2,
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
    marginRight: CARD_GAP,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  cardPlaceholder: { opacity: 0 },
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
