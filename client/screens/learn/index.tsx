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
  ScrollView as RNScrollView,
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

interface DebugLog {
  time: string;
  msg: string;
}

const CATEGORIES = [
  { key: 'known', label: '已会', color: '#22C55E' },
  { key: 'fuzzy', label: '模糊', color: '#F59E0B' },
  { key: 'unknown', label: '不会', color: '#EF4444' },
];

// ─── 调试面板组件 ─────────────────────────────────
function DebugPanel({ logs, onClear }: { logs: DebugLog[]; onClear: () => void }) {
  const [visible, setVisible] = useState(false);

  if (!visible) {
    return (
      <TouchableOpacity style={styles.debugBtn} onPress={() => setVisible(true)}>
        <Text style={styles.debugBtnText}>[DEBUG]</Text>
      </TouchableOpacity>
    );
  }

  const logText = logs.map((l) => `[${l.time}] ${l.msg}`).join('\n');

  return (
    <View style={styles.debugPanel}>
      <View style={styles.debugHeader}>
        <Text style={styles.debugTitle}>调试日志 (可选中复制)</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity onPress={onClear}>
            <Text style={styles.debugAction}>清空</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setVisible(false)}>
            <Text style={styles.debugAction}>收起</Text>
          </TouchableOpacity>
        </View>
      </View>
      <RNScrollView nestedScrollEnabled style={styles.debugBody}>
        <Text selectable style={styles.debugText}>{logText || '(无日志)'}</Text>
      </RNScrollView>
    </View>
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
  // 调试日志
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);
  // 滚动事件记录
  const [lastScrollX, setLastScrollX] = useState(0);
  const [scrollEnabled, setScrollEnabled] = useState(true);

  // ── 动画值 ──
  const dragTx = useRef(new Animated.Value(0)).current;
  const dragTy = useRef(new Animated.Value(0)).current;
  const dragScale = useRef(new Animated.Value(1)).current;

  // 分类按钮位置
  const catBtnLayouts = useRef<Record<string, { x: number; y: number; w: number; h: number }>>({}).current;
  const draggingWordRef = useRef<Word | null>(null);
  const dragOriginRef = useRef({ x: 0, y: 0 });

  // ── 日志工具 ──
  const addLog = useCallback((msg: string) => {
    const now = new Date();
    const t = `${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
    setDebugLogs((prev) => [...prev.slice(-30), { time: t, msg }]);
  }, []);

  // ── fetchCategoryStats ──
  /**
   * 服务端文件：server/src/routes/wordbooks.ts
   * 接口：GET /api/v1/wordbooks/stats
   */
  const fetchCatStats = useCallback(async () => {
    try {
      addLog('fetchCatStats 开始请求');
      const res = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/wordbooks/stats`);
      addLog(`fetchCatStats 状态: ${res.status}`);
      if (res.ok) {
        const data = await res.json();
        addLog(`fetchCatStats 数据: ${JSON.stringify(data)}`);
        setCatCounts({ known: data.known || 0, vague: data.vague || 0, unknown: data.unknown || 0 });
      }
    } catch (e: any) {
      addLog(`fetchCatStats 错误: ${e.message}`);
    }
  }, [addLog]);

  // ── fetchWords ──
  /**
   * 服务端文件：server/src/routes/wordbooks.ts
   * 接口：GET /api/v1/wordbooks/:table
   * Query 参数：offset: number, limit: number
   */
  const fetchWords = useCallback(async (newOffset?: number) => {
    try {
      const off = newOffset ?? offset;
      addLog(`fetchWords 请求: table=${table}, offset=${off}, limit=20`);
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/wordbooks/${table}?offset=${off}&limit=20`
      );
      addLog(`fetchWords 状态: ${res.status}`);
      if (res.ok) {
        const data = await res.json();
        const arr = data.words || data || [];
        addLog(`fetchWords 返回 ${arr.length} 条, 首词: ${arr[0]?.word ?? '(空)'}`);
        if (newOffset === undefined || newOffset === 0) {
          setWords(arr);
        } else {
          setWords((prev) => [...prev, ...arr]);
        }
      }
    } catch (e: any) {
      addLog(`fetchWords 错误: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [table, offset, addLog]);

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
          addLog(`初始加载: ${(data.words||data||[]).length} 条`);
        }
        if (!cancelled) fetchCatStats();
      } catch (e: any) {
        addLog(`加载错误: ${e.message}`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    doFetch();
    return () => { cancelled = true; };
  }, [table]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 点击单词 → 进入详情 ──
  const handleTapWord = useCallback((idx: number) => {
    addLog(`点击单词 idx=${idx}, word=${words[idx]?.word ?? '(越界)'}, words.length=${words.length}`);
    if (idx >= 0 && idx < words.length) {
      router.push('/word-detail', { id: words[idx].id });
    }
  }, [router, words, addLog]);

  // ── 长按开始拖拽 ──
  const startDrag = useCallback((idx: number) => {
    addLog(`长按触发拖拽 idx=${idx}, word=${words[idx]?.word ?? '(越界)'}`);
    if (idx < 0 || idx >= words.length) return;
    const word = words[idx];
    draggingWordRef.current = word;
    dragOriginRef.current = { x: 16 + idx * (CARD_WIDTH + CARD_GAP), y: 8 };
    setClassifyingId(word.id);
    setDraggingIdx(idx);
    dragTx.setValue(0); dragTy.setValue(0); dragScale.setValue(1);
    Animated.spring(dragScale, { toValue: 1.08, useNativeDriver: true }).start();
  }, [words, dragTx, dragTy, dragScale, addLog]);

  // ── 拖拽分类 ──
  const handleClassify = useCallback(async (wordId: number, category: string) => {
    try {
      /**
       * 服务端文件：server/src/routes/user-words.ts
       * 接口：POST /api/v1/user-words/move
       * Body 参数：wordId: number, targetTable: string ('words_x'|'words_y'|'words_z')
       */
      const map: Record<string, string> = { known: 'words_x', vague: 'words_y', unknown: 'words_z' };
      const target = map[category];
      addLog(`分类操作: wordId=${wordId} → ${target} (${category})`);
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/user-words/move`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ wordId, targetTable: target }) }
      );
      addLog(`分类结果: ${res.status}`);
      if (res.ok) { setWords((p) => p.filter((w) => w.id !== wordId)); fetchCatStats(); }
    } catch (e: any) { addLog(`分类错误: ${e.message}`); }
    setClassifyingId(null); setDraggingIdx(-1); draggingWordRef.current = null;
  }, [fetchCatStats, addLog]);

  // ── 取消拖拽回弹 ──
  const cancelDrag = useCallback(() => {
    addLog('取消拖拽(回弹)');
    Animated.parallel([
      Animated.spring(dragTx, { toValue: 0, useNativeDriver: true }),
      Animated.spring(dragTy, { toValue: 0, useNativeDriver: true }),
      Animated.spring(dragScale, { toValue: 1, useNativeDriver: true }),
    ]).start(() => { setClassifyingId(null); setDraggingIdx(-1); draggingWordRef.current = null; });
  }, [dragTx, dragTy, dragScale, addLog]);

  // ── loadMore ──
  const loadMore = useCallback(() => {
    const n = offset + words.length;
    addLog(`自动加载更多: 新offset=${n}`);
    setOffset(n); fetchWords(n);
  }, [offset, words.length, fetchWords, addLog]);

  // ── 分类按钮点击 ──
  const handleCategoryPress = useCallback((c: string) => {
    if (classifyingId != null) handleClassify(classifyingId, c);
    else addLog(`点击分类按钮(${c}) 但无拖拽目标`);
  }, [classifyingId, handleClassify, addLog]);

  // ── 浮动卡片拖拽 PanResponder ──
  /* eslint-disable react-hooks/purity */
  const floatingDragResp = useCallback(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant() { addLog('拖拽 Grant'); dragTx.setValue(0); dragTy.setValue(0); },
        onPanResponderMove(_, gs) { dragTx.setValue(gs.dx); dragTy.setValue(gs.dy); },
        onPanResponderRelease(_, gs) {
          addLog(`拖拽 Release: dx=${gs.dx.toFixed(1)}, dy=${gs.dy.toFixed(1)}, moveY=${gs.moveY.toFixed(1)}`);
          const dropped = Object.keys(catBtnLayouts).find((k) => {
            const b = catBtnLayouts[k]; return b && gs.moveY >= b.y && gs.moveY <= b.y + b.h;
          });
          if (dropped && classifyingId != null) { handleClassify(classifyingId, dropped); } else { cancelDrag(); }
        },
        onPanResponderTerminate() { addLog('拖拽 Terminate'); cancelDrag(); },
      }),
    [dragTx, dragTy, classifyingId, handleClassify, cancelDrag, catBtnLayouts, addLog]
  );
  const dragRespInst = useRef(floatingDragResp()).current;
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

      {/* 单词卡片行 — ScrollView 原生水平滚动 */}
      <View style={[styles.scrollContainer, styles.scrollDebugBorder]}>
        <RNScrollView
          horizontal
          scrollEnabled={scrollEnabled}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.wordRow,
            { width: Math.max(rowWidth + 32, SCREEN_WIDTH) },
          ]}
          decelerationRate="fast"
          snapToInterval={CARD_WIDTH + CARD_GAP}
          onScroll={(e) => setLastScrollX(Math.round(e.nativeEvent.contentOffset.x))}
          onMomentumScrollEnd={(e) => {
            const ox = e.nativeEvent.contentOffset.x;
            addLog(`滚动结束: offsetX=${Math.round(ox)}, totalContent=${Math.round(rowWidth)}`);
            const visibleEnd = ox + SCREEN_WIDTH;
            if (rowWidth - visibleEnd < CARD_WIDTH * 3 && !loading) loadMore();
          }}
          onScrollBeginDrag={() => addLog('开始拖动滚动')}
          onTouchStart={() => addLog('ScrollView onTouchStart')}
          onContentSizeChange={(w, h) => addLog(`contentSize: w=${w}, h=${h}`)}
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
        </RNScrollView>

        {/* 浮动拖拽卡片 */}
        {classifyingId != null && draggingWordRef.current && (
          <Animated.View
            style={[
              styles.card, styles.draggingCard,
              { position: 'absolute', left: origin.x, top: origin.y,
                transform: [{ translateX: dragTx }, { translateY: dragTy }, { scale: dragScale }] },
            ]}
            {...dragRespInst.panHandlers}
          >
            <Text style={styles.cardText}>{draggingWordRef.current.word}</Text>
          </Animated.View>
        )}

        {/* 实时状态指示器 */}
        <View style={styles.statusBar}>
          <Text style={styles.statusText}>
            scrollX={lastScrollX} | 词数={remaining} | scroll={scrollEnabled ? 'ON' : 'OFF'}
          </Text>
        </View>
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

      {loading && words.length === 0 && (
        <Text style={{ textAlign: 'center', color: '#999', marginTop: 40 }}>加载中...</Text>
      )}

      {/* 调试面板 */}
      <DebugPanel logs={debugLogs} onClear={() => setDebugLogs([])} />
    </Screen>
  );
}

// ─── 样式 ─────────────────────────────────────────
const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  backText: { fontSize: 16, color: '#4F46E5', fontWeight: '500' },
  titleText: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  remainingText: { textAlign: 'center', color: '#6B7280', fontSize: 14, marginTop: 16, marginBottom: 24 },

  scrollContainer: { height: CARD_HEIGHT + 40, justifyContent: 'center', marginHorizontal: 8 },
  scrollDebugBorder: { borderWidth: 1, borderColor: '#FEF3C7', borderRadius: 10, borderStyle: 'dashed' },
  wordRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: CARD_GAP },

  card: {
    width: CARD_WIDTH, height: CARD_HEIGHT,
    backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1.5, borderColor: '#E5E7EB',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 8,
    elevation: 4,
  },
  cardPlaceholder: { opacity: 0.15, borderWidth: 1.5, borderColor: '#4F46E5', borderStyle: 'dashed' },
  cardText: { fontSize: 17, fontWeight: '600', color: '#1F2937' },
  draggingCard: {
    zIndex: 100, elevation: 20, borderColor: '#4F46E5', borderWidth: 2,
    shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16,
  },

  statusBar: { position: 'absolute', bottom: 4, left: 0, right: 0, alignItems: 'center' },
  statusText: { fontSize: 10, color: '#92400E', backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },

  categorySection: { marginTop: 36, paddingHorizontal: 20 },
  categoryRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  catButton: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  catLabel: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  catCount: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  catHint: { textAlign: 'center', color: '#9CA3AF', fontSize: 13, marginTop: 12 },

  // 调试面板样式
  debugBtn: { position: 'absolute', right: 8, bottom: 8, backgroundColor: '#1F2937', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, elevation: 10, zIndex: 999 },
  debugBtnText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  debugPanel: { position: 'absolute', left: 8, right: 8, bottom: 8, backgroundColor: 'rgba(17,24,39,0.95)', borderRadius: 12, maxHeight: 220, elevation: 50, zIndex: 1000 },
  debugHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#374151', paddingHorizontal: 12, paddingVertical: 8 },
  debugTitle: { color: '#F9FAFB', fontSize: 13, fontWeight: '700' },
  debugAction: { color: '#60A5FA', fontSize: 12, fontWeight: '600' },
  debugBody: { padding: 10, maxHeight: 170 },
  debugText: { color: '#D1D5DB', fontSize: 10, fontFamily: 'monospace', lineHeight: 15 },
});
