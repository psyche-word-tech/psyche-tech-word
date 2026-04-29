import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  PanResponder,
  ScrollView,
  Dimensions,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';

interface WordItem {
  id: number;
  word: string;
  phonetic: string;
  meaning: string;
  created_at: string;
  example: string;
  translation: string;
  image_url: string | null;
}

const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

export default function LearnPage() {
  const router = useSafeRouter();
  const { table } = useSafeSearchParams<{ table?: string }>();
  const tableName = table || 'words_b';

  // 状态
  const [words, setWords] = useState<WordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 分类计数
  const [knownCount, setKnownCount] = useState(0);
  const [fuzzyCount, setFuzzyCount] = useState(0);
  const [unknownCount, setUnknownCount] = useState(0);

  // 滑动模式状态
  const [isSwipeMode, setIsSwipeMode] = useState(false);

  // 分页
  const offsetRef = useRef(0);
  const loadingMoreRef = useRef(false);

  // 获取单词数据
  const fetchWords = useCallback(async (offset: number) => {
    if (!tableName) return [];
    try {
      /**
       * 服务端文件：server/src/routes/wordbooks.ts
       * 接口：GET /api/v1/wordbooks/:table
       * Query 参数：offset?: number, limit?: number
       */
      const wRes = await fetch(
        `${API_BASE_URL}/api/v1/wordbooks/${tableName}?offset=${offset}&limit=50`
      );
      const wordsData = await wRes.json();
      return Array.isArray(wordsData) ? wordsData : [];
    } catch (err) {
      console.error('fetchWords error:', err);
      return [];
    }
  }, [tableName]);

  // 初始化加载
  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      setLoading(true);
      setError(null);
      const data = await fetchWords(0);
      if (!mounted) return;
      if (data.length > 0) {
        setWords(data);
        offsetRef.current = data.length;
        setKnownCount(20);
        setFuzzyCount(20);
        setUnknownCount(17);
      } else {
        setError('暂无待学习词汇');
      }
      setLoading(false);
    };
    loadData();
    return () => { mounted = false; };
  }, [fetchWords]);

  // 加载更多（滑动到末尾）
  const loadMore = async () => {
    if (loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    const more = await fetchWords(offsetRef.current);
    if (more.length > 0) {
      setWords((prev) => [...prev, ...more]);
      offsetRef.current += more.length;
    }
    loadingMoreRef.current = false;
  };

  // 返回
  const handleBack = () => router.back();

  // 进入详情页
  const handleWordPress = (word: WordItem) => {
    if (isSwipeMode) return;
    router.push('/word-detail', { id: String(word.id), tableName });
  };

  // 分类操作
  const handleCategorize = async (category: 'known' | 'fuzzy' | 'unknown', word: WordItem) => {
    try {
      /**
       * 服务端文件：server/src/routes/wordbooks.ts
       * 接口：POST /api/v1/wordbooks/:table/:id/category
       * Body 参数：category: string
       */
      await fetch(`${API_BASE_URL}/api/v1/wordbooks/${tableName}/${word.id}/category`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category }),
      });

      if (category === 'known') setKnownCount((c) => c + 1);
      else if (category === 'fuzzy') setFuzzyCount((c) => c + 1);
      else setUnknownCount((c) => c + 1);

      setWords((prev) => prev.filter((w) => w.id !== word.id));
    } catch (err) {
      console.error('分类失败:', err);
    }
  };

  // 长按激活滑动模式
  const activateSwipeMode = () => setIsSwipeMode(true);

  // 退出滑动模式
  const exitSwipeMode = () => setIsSwipeMode(false);

  // 单词卡片组件（支持长按+点击+拖动分类）
  function WordCard({
    word,
    onPress,
    onLongPress,
    onCategorize,
  }: {
    word: WordItem;
    onPress: () => void;
    onLongPress: () => void;
    onCategorize: (cat: 'known' | 'fuzzy' | 'unknown') => void;
  }) {
    const [dragY, setDragY] = useState(0);
    const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const triggeredLongPress = useRef(false);

    const pr = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gs) => gs.dy > 15 && gs.dy > Math.abs(gs.dx),
        onPanResponderGrant: () => {
          longPressTimer.current = setTimeout(() => {
            triggeredLongPress.current = true;
            onLongPress();
          }, 350);
        },
        onPanResponderMove: (_, gs) => {
          if (Math.abs(gs.dx) > 8 || Math.abs(gs.dy) > 8) {
            if (longPressTimer.current) {
              clearTimeout(longPressTimer.current);
              longPressTimer.current = null;
            }
          }
          if (gs.dy > 10) setDragY(gs.dy);
        },
        onPanResponderRelease: (_, gs) => {
          if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
          }

          if (triggeredLongPress.current) {
            triggeredLongPress.current = false;
            setDragY(0);
            return;
          }

          if (gs.dy > 80) {
            const third = Dimensions.get('window').width / 3;
            if (gs.dx < -third) onCategorize('unknown');
            else if (gs.dx > third) onCategorize('known');
            else onCategorize('fuzzy');
          }
          setDragY(0);
        },
        onPanResponderTerminate: () => {
          if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
          }
          setDragY(0);
        },
      })
    ).current;

    return (
      <View
        {...pr.panHandlers}
        style={[
          styles.wordCardContainer,
          { transform: [{ translateY: dragY }] },
          isSwipeMode && styles.wordCardActive,
        ]}
      >
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={isSwipeMode ? 1 : 0.7}
          style={styles.wordCardInner}
        >
          <Text style={styles.wordText}>{word.word}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 加载中
  if (loading) {
    return (
      <Screen>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </Screen>
    );
  }

  // 错误/空
  if (error || words.length === 0) {
    return (
      <Screen>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>{'<- Back'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>词汇预览</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{error || '暂无待学习词汇'}</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>词汇预览</Text>

        <TouchableOpacity
          style={styles.calButton}
        >
          <FontAwesome6 name="calendar" size={18} color="#333" />
        </TouchableOpacity>
      </View>

      {/* 主内容区 */}
      <View style={styles.mainContent}>
        {/* 剩余单词提示 */}
        <View style={styles.countRow}>
          <Text style={styles.countText}>
            剩余 {words.length} 个单词
          </Text>
          {isSwipeMode && (
            <TouchableOpacity
              style={styles.doneButton}
              onPress={exitSwipeMode}
            >
              <Text style={styles.doneButtonText}>完成</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 提示文字 */}
        <Text style={styles.hintText}>
          {isSwipeMode ? '<- 左右滑动切换单词 ->' : '长按单词可左右滑动'}
        </Text>

        {/* 单词视口容器（固定宽度320px + overflow:hidden） */}
        <View style={styles.wordViewport}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={320}
            decelerationRate="fast"
            contentContainerStyle={styles.wordsScrollContent}
            onMomentumScrollEnd={(e) => {
              const offsetX = e.nativeEvent.contentOffset.x;
              const contentWidth = e.nativeEvent.layoutMeasurement.width;
              const totalWidth = e.nativeEvent.contentSize.width;
              if (offsetX + contentWidth >= totalWidth - 100) {
                loadMore();
              }
            }}
          >
            {words.map((word) => (
              <WordCard
                key={word.id}
                word={word}
                onPress={() => handleWordPress(word)}
                onLongPress={activateSwipeMode}
                onCategorize={(cat) => handleCategorize(cat, word)}
              />
            ))}
          </ScrollView>
        </View>

        {/* 分类区域 */}
        <View style={styles.categoryArea}>
          <View style={styles.categoryButtons}>
            <TouchableOpacity
              style={[styles.categoryButton, styles.knownButton]}
              activeOpacity={0.7}
            >
              <Text style={styles.categoryTitle}>已会</Text>
              <Text style={styles.categoryCount}>({knownCount})</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.categoryButton, styles.fuzzyButton]}
              activeOpacity={0.7}
            >
              <Text style={styles.categoryTitle}>模糊</Text>
              <Text style={styles.categoryCount}>({fuzzyCount})</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.categoryButton, styles.unknownButton]}
              activeOpacity={0.7}
            >
              <Text style={styles.categoryTitle}>不会</Text>
              <Text style={styles.categoryCount}>({unknownCount})</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.dragHint}>
            拖动单词到上方分类区域
          </Text>
        </View>
      </View>
    </Screen>
  );
}

// 样式
const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F5F5F5',
  },
  backButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  backButtonText: {
    fontSize: 16,
    color: '#333',
  },
  calButton: {
    width: 40,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222',
  },

  mainContent: {
    flex: 1,
  },

  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 8,
  },
  countText: {
    fontSize: 14,
    color: '#888',
  },
  doneButton: {
    backgroundColor: '#22c55e',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  doneButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },

  hintText: {
    textAlign: 'center',
    fontSize: 11,
    color: '#aaa',
    marginBottom: 12,
    marginTop: 4,
  },

  wordViewport: {
    width: 320,
    maxWidth: 320,
    minWidth: 0,
    height: 56,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    position: 'relative',
    overflow: 'hidden',
  },

  wordsScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 8,
  },

  wordCardContainer: {
    width: 96,
    minWidth: 96,
    height: 44,
    zIndex: 1,
  },
  wordCardActive: {
    borderWidth: 2,
    borderColor: '#22c55e',
    borderRadius: 10,
  },
  wordCardInner: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  wordText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },

  categoryArea: {
    marginTop: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  categoryButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  categoryButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 72,
  },
  knownButton: {
    backgroundColor: '#22c55e',
  },
  fuzzyButton: {
    backgroundColor: '#f59e0b',
  },
  unknownButton: {
    backgroundColor: '#ef4444',
  },
  categoryTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  categoryCount: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  dragHint: {
    marginTop: 12,
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
