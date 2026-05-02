/* eslint-disable react-hooks/refs */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
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
      <View style={styles.debugBtn} onTouchEnd={() => setVisible(true)}>
        <Text style={styles.debugBtnText}>[DEBUG]</Text>
      </View>
    );
  }
  const logText = logs.map((l) => `[${l.time}] ${l.msg}`).join('\n');
  return (
    <View style={styles.debugPanel}>
      <View style={styles.debugHeader}>
        <Text style={styles.debugTitle}>调试日志</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View onTouchEnd={onClear}><Text style={styles.debugAction}>清空</Text></View>
          <View onTouchEnd={() => setVisible(false)}><Text style={styles.debugAction}>收起</Text></View>
        </View>
      </View>
      <View style={styles.debugBody}>
        <Text selectable style={styles.debugText}>{logText || '(无日志)'}</Text>
      </View>
    </View>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TouchableOpacity({ children, style, onPress, ...rest }: any) {
  return (
    <View {...rest} style={style} onTouchEnd={onPress}>
      {children}
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
  const [catCounts, setCatCounts] = useState({ known: 0, vague: 0, unknown: 0 });
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);
  const [lastScrollX, setLastScrollX] = useState(0);

  // ── 动画值 ──
  const panX = useRef(new Animated.Value(0)).current;       // 水平滚动偏移
  const dragTx = useRef(new Animated.Value(0)).current;       // 拖拽 X 偏移
  const dragTy = useRef(new Animated.Value(0)).current;       // 拖拽 Y 偏移
  const dragScale = useRef(new Animated.Value(1)).current;    // 拖拽缩放

  // ── Refs ──
  const catBtnLayouts = useRef<Record<string, { x: number; y: number; w: number; h: number }>>({}).current;
  const wordsRef = useRef<Word[]>([]);
  useEffect(() => { wordsRef.current = words; }, [words]);

  // 手势状态机: 'idle' | 'scrolling' | 'dragging'
  const modeRef = useRef<'idle' | 'scrolling' | 'dragging'>('idle');
  const gestureStartX = useRef(0);   // 手势起始 X（屏幕坐标）
  const gestureStartY = useRef(0);   // 手势起始 Y
  const pressedIdx = useRef(-1);     // 按下的卡片索引
  const scrollXRef = useRef(0);      // 当前水平滚动位置（像素，负值表示左移）
  const maxScrollX = useRef(0);      // 最大可滚动距离
  const draggingInfo = useRef<{ word: Word; idx: number; originX: number; originY: number } | null>(null);
  const [, forceUpdate] = useState(0);

  // ── 日志工具 ──
  const addLog = useCallback((msg: string) => {
    const now = new Date();
    const t = `${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
    setDebugLogs((prev) => [...prev.slice(-40), { time: t, msg }]);
  }, []);

  // 计算最大滚动距离
  useEffect(() => {
    const totalWidth = words.length * (CARD_WIDTH + CARD_GAP) + 32;
    maxScrollX.current = Math.max(0, totalWidth - SCREEN_WIDTH + 16);
  }, [words.length]);

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
    } catch {}
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
        const arr = data.words || data || [];
        if (newOffset === undefined || newOffset === 0) setWords(arr);
        else setWords((prev) => [...prev, ...arr]);
      }
    } catch {} finally { setLoading(false); }
  }, [table, offset]);

  // ── 加载初始数据 ──
  useEffect(() => {
    let cancelled = false;
    const doFetch = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/wordbooks/${table}?offset=0&limit=20`);
        if (!cancelled && res.ok) {
          const data = await res.json();
          setWords(data.words || data || []);
        }
        if (!cancelled) fetchCatStats();
      } catch { if (!cancelled) setLoading(false); } finally { if (!cancelled) setLoading(false); }
    };
    doFetch();
    return () => { cancelled = true; };
  }, [table]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── loadMore ──
  const loadMore = useCallback(() => {
    if (loading) return;
    const n = offset + words.length;
    setOffset(n); fetchWords(n);
  }, [offset, words.length, loading, fetchWords]);

  // ── 吸附到最近卡片 ──
  const snapToNearest = useCallback(() => {
    const step = CARD_WIDTH + CARD_GAP;
    const currentRaw = -scrollXRef.current;
    const snapped = Math.round(currentRaw / step) * step;
    const clamped = Math.max(0, Math.min(snapped, maxScrollX.current));
    scrollXRef.current = -clamped;
    setLastScrollX(Math.round(clamped));
    Animated.spring(panX, { toValue: -clamped, useNativeDriver: true, friction: 8 }).start();
    // 自动加载更多
    if (maxScrollX.current - clamped < step * 2) loadMore();
  }, [panX, loadMore]);

  // ── 分类操作 ──
  const doClassify = useCallback(async (wordId: number, category: string) => {
    try {
      /**
       * 服务端文件：server/src/routes/user-words.ts
       * 接口：POST /api/v1/user-words/move
       * Body 参数：wordId: number, targetTable: string ('words_x'|'words_y'|'words_z')
       */
      const map: Record<string, string> = { known: 'words_x', vague: 'words_y', unknown: 'words_z' };
      const target = map[category];
      addLog(`分类: ${wordId} → ${target}`);
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/user-words/move`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ wordId, targetTable: target }) }
      );
      if (res.ok) { setWords((p) => p.filter((w) => w.id !== wordId)); fetchCatStats(); }
    } catch (e: any) { addLog(`分类错: ${e.message}`); }
  }, [fetchCatStats, addLog]);

  // ════════════════════════════════════════════════
  //  统一 PanResponder — 管理: 滑动 / 点击 / 拖拽
  // ════════════════════════════════════════════════
  /* eslint-disable react-hooks/purity */
  const mainResp = useRef(
    PanResponder.create({
      // ── 是否响应开始 ──
      onStartShouldSetPanResponder: () => true,

      // ── 是否响应移动 ──
      onMoveShouldSetPanResponder: () => true,

      // ── 手势开始 ──
      onPanResponderGrant(_e, gs) {
        gestureStartX.current = gs.x0;
        gestureStartY.current = gs.y0;
        modeRef.current = 'idle';

        // 判断点击了哪个卡片（将屏幕坐标转换为内容坐标系）
        const touchX = gs.x0 - scrollXRef.current;
        const clickedIdx = Math.floor((touchX - 16) / (CARD_WIDTH + CARD_GAP));
        if (clickedIdx >= 0 && clickedIdx < wordsRef.current.length) {
          pressedIdx.current = clickedIdx;
        } else {
          pressedIdx.current = -1;
        }

        // 记录当前滚动值作为基准
        panX.setOffset(scrollXRef.current);
        panX.setValue(0);

        dragTx.setValue(0);
        dragTy.setValue(0);
        dragScale.setValue(1);
      },

      // ── 手势移动 ──
      onPanResponderMove(_e, gs) {
        const dx = gs.dx;
        const dy = gs.dy;
        const mode = modeRef.current;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        if (mode === 'idle') {
          // 决定进入哪种模式
          if (absDy > 12 && dy > 0 && dy > absDx * 0.4 && pressedIdx.current >= 0) {
            // ── 进入拖拽模式 ──
            modeRef.current = 'dragging';
            const idx = pressedIdx.current;
            const w = wordsRef.current[idx];
            if (!w) return;
            addLog(`→ 拖拽模式: ${w.word}`);

            // 计算浮动卡片初始位置（相对于 scrollContainer）
            const originX = 16 + idx * (CARD_WIDTH + CARD_GAP) + scrollXRef.current;
            const originY = 8;

            draggingInfo.current = { word: w, idx, originX, originY };

            dragTx.setValue(dx);
            dragTy.setValue(dy);
            Animated.spring(dragScale, { toValue: 1.08, useNativeDriver: true }).start();

            // 强制刷新以显示浮动卡片
            forceUpdate((n) => n + 1);
          } else if (absDx > 3) {
            // ── 进入滚动模式 ──
            modeRef.current = 'scrolling';
            panX.setValue(dx);
            setLastScrollX(Math.round(Math.max(0, Math.abs(scrollXRef.current + dx))));
          }
        } else if (mode === 'scrolling') {
          // 继续滚动
          panX.setValue(dx);
          setLastScrollX(Math.round(Math.max(0, Math.abs(scrollXRef.current + dx))));
        } else if (mode === 'dragging') {
          // 继续拖拽浮动卡片
          dragTx.setValue(dx);
          dragTy.setValue(dy);
        }
      },

      // ── 手势结束 ──
      onPanResponderRelease(_e, gs) {
        const mode = modeRef.current;
        const dist = Math.sqrt(gs.dx * gs.dx + gs.dy * gs.dy);

        if (mode === 'idle' && dist < 10) {
          // ── 短按（几乎没移动）→ 点击事件 ──
          if (pressedIdx.current >= 0 && pressedIdx.current < wordsRef.current.length) {
            const word = wordsRef.current[pressedIdx.current];
            addLog(`点击: ${word.word}`);
            router.push('/word-detail', { id: word.id });
          }
        } else if (mode === 'scrolling') {
          // ── 滚动结束 → 吸附 ──
          const newX = Math.max(-maxScrollX.current, Math.min(0, scrollXRef.current + gs.dx));
          scrollXRef.current = newX;
          snapToNearest();
        } else if (mode === 'dragging') {
          // ── 拖拽结束 → 检测是否落在按钮上 ──
          if (draggingInfo.current) {
            const dropX = gestureStartX.current + gs.dx;
            const dropY = gestureStartY.current + gs.dy;
            addLog(`释放: (${dropX.toFixed(0)}, ${dropY.toFixed(0)})`);

            const dropped = Object.keys(catBtnLayouts).find((k) => {
              const b = catBtnLayouts[k];
              return b && dropY >= b.y && dropY <= b.y + b.h && dropX >= b.x && dropX <= b.x + b.w;
            });

            if (dropped) {
              addLog(`命中: ${dropped}`);
              doClassify(draggingInfo.current.word.id, dropped);
            } else {
              addLog('未命中按钮 → 取消');
            }
          }
          // 隐藏浮动卡片
          draggingInfo.current = null;
          forceUpdate((n) => n + 1);
        }

        // 清理
        modeRef.current = 'idle';
        pressedIdx.current = -1;
        panX.flattenOffset();
      },

      // ── 手势被抢夺 ──
      onPanResponderTerminate() {
        addLog('手势被终止');
        if (modeRef.current === 'scrolling') snapToNearest();
        else if (modeRef.current === 'dragging') {
          draggingInfo.current = null;
          forceUpdate((n) => n + 1);
        }
        modeRef.current = 'idle';
        panX.flattenOffset();
      },
    })
  ).current;
  /* eslint-enable react-hooks/purity */

  // ════════════════════════════════════════════════
  //  渲染
  // ════════════════════════════════════════════════
  const remaining = words.length;
  const rowWidth = words.length * (CARD_WIDTH + CARD_GAP) + 32;
  const drag = draggingInfo.current;
  const isDraggingAny = drag !== null;

  return (
    <Screen>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8} style={{ paddingVertical: 4 }}>
          <Text style={styles.backText}>back</Text>
        </TouchableOpacity>
        <Text style={styles.titleText}>词汇预览</Text>
        <TouchableOpacity hitSlop={8} style={{ paddingVertical: 4 }}>
          <FontAwesome6 name="calendar" size={18} color="#374151" />
        </TouchableOpacity>
      </View>

      {/* 剩余数量 */}
      <Text style={styles.remainingText}>剩余 {remaining} 个单词</Text>

      {/* 单词卡片区域 — 统一 PanResponder */}
      <View style={[styles.scrollContainer]} {...mainResp.panHandlers}>
        {/* 卡片行（通过 panX 平移实现水平滚动） */}
        <Animated.View
          style={[
            styles.wordRow,
            { width: Math.max(rowWidth, SCREEN_WIDTH), transform: [{ translateX: panX }] },
          ]}
        >
          {words.map((word, index) => {
            // 正在被拖拽的卡片显示为虚线占位
            if (isDraggingAny && drag.idx === index) {
              return (
                <View key={`ph-${word.id}`} style={[styles.card, styles.cardPlaceholder]} />
              );
            }
            return (
              <View key={word.id} style={styles.card}>
                <Text style={styles.cardText}>{word.word}</Text>
              </View>
            );
          })}
        </Animated.View>

        {/* 浮动拖拽卡片 */}
        {isDraggingAny && (
          <Animated.View
            style={[
              styles.card,
              styles.draggingCard,
              {
                position: 'absolute',
                left: drag.originX,
                top: drag.originY,
                transform: [
                  { translateX: dragTx },
                  { translateY: dragTy },
                  { scale: dragScale },
                ],
              },
            ]}
          >
            <Text style={styles.cardText}>{drag.word.word}</Text>
          </Animated.View>
        )}

        {/* 状态指示器 */}
        <View style={styles.statusBar}>
          <Text style={styles.statusText}>
            scrollX={lastScrollX} | 词数={remaining} | 模式={modeRef.current}
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
              onPress={() => {
                if (isDraggingAny) doClassify(drag.word.id, cat.key);
                else addLog(`点击${cat.label}(无拖拽目标)`);
              }}
              onLayout={(e: any) => {
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
          {isDraggingAny ? '松手即可归类' : '左右滑动浏览 · 单击查看详情 · 按住下拖可分类'}
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

  scrollContainer: { height: CARD_HEIGHT + 40, justifyContent: 'center', marginHorizontal: 8, overflow: 'hidden' },
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

  debugBtn: { position: 'absolute', right: 8, bottom: 8, backgroundColor: '#1F2937', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, elevation: 10, zIndex: 999 },
  debugBtnText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  debugPanel: { position: 'absolute', left: 8, right: 8, bottom: 8, backgroundColor: 'rgba(17,24,39,0.95)', borderRadius: 12, maxHeight: 220, elevation: 50, zIndex: 1000 },
  debugHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#374151', paddingHorizontal: 12, paddingVertical: 8 },
  debugTitle: { color: '#F9FAFB', fontSize: 13, fontWeight: '700' },
  debugAction: { color: '#60A5FA', fontSize: 12, fontWeight: '600' },
  debugBody: { padding: 10, maxHeight: 170 },
  debugText: { color: '#D1D5DB', fontSize: 10, fontFamily: 'monospace', lineHeight: 15 },
});
