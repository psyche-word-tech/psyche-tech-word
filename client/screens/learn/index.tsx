import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const VIEWPORT_WIDTH = Math.min(320, SCREEN_WIDTH - 40);

// ===================== WordCard =====================
interface WordCardProps {
  word: string;
  onPress?: () => void;
}

function WordCard({ word, onPress }: WordCardProps) {
  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      <View style={styles.wordCardContent}>
        <Text style={styles.wordText} numberOfLines={1}>{word}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ===================== Main Page =====================
export default function LearnPage() {
  const router = useSafeRouter();
  const { table = 'words_b' } = useSafeSearchParams<{ table?: string }>();
  const [words, setWords] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<{ known: string[]; vague: string[]; unknown: string[] }>({
    known: [],
    vague: [],
    unknown: [],
  });
  const scrollViewRef = useRef<any>(null);

  // 分页状态
  const offsetRef = useRef(0);
  const loadingMoreRef = useRef(false);
  const hasMoreRef = useRef(true);

  // 从 Supabase 加载单词
  const fetchWords = async (append = false) => {
    if (loadingMoreRef.current || !hasMoreRef.current) return;
    loadingMoreRef.current = true;

    try {
      /**
       * 服务端文件：server/src/routes/wordbooks.ts
       * 接口：GET /api/v1/wordbooks/:table
       * Query 参数：offset?: number, limit?: number
       */
      const wRes = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/wordbooks/${table}?offset=${offsetRef.current}&limit=20`
      );
      const wordsData = await wRes.json();
      const newWords: string[] = Array.isArray(wordsData) ? wordsData : [];

      if (append) {
        setWords(prev => [...prev, ...newWords]);
      } else {
        setWords(newWords);
      }

      if (newWords.length === 0) {
        hasMoreRef.current = false;
      }
      offsetRef.current += newWords.length;
      setError('');
    } catch {
      setError('加载失败，请重试');
    } finally {
      setLoading(false);
      loadingMoreRef.current = false;
    }
  };

  // 首次加载
  useEffect(() => {
    fetchWords(false);
  }, []);

  // 加载更多
  const loadMore = () => {
    fetchWords(true);
  };

  // 滑动到末尾时自动加载更多
  const handleScroll = (event: any) => {
    const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
    const distanceToEnd = contentSize.width - (contentOffset.x + layoutMeasurement.width);
    if (distanceToEnd < VIEWPORT_WIDTH * 1.5 && !loadingMoreRef.current && hasMoreRef.current) {
      loadMore();
    }
  };

  // 分类操作
  const handleCategorize = useCallback((word: string, category: string) => {
    setWords(prev => prev.filter(w => w !== word));
    setCategories(prev => ({
      ...prev,
      [category]: [...prev[category as keyof typeof prev], word],
    }));
  }, []);

  const retry = () => {
    setError('');
    offsetRef.current = 0;
    hasMoreRef.current = true;
    fetchWords(false);
  };

  // 渲染单个单词卡片
  const renderWordItem = (item: string, index: number) => (
    <View key={`${item}-${index}`} style={styles.wordScrollItem}>
      <WordCard
        word={item}
        onPress={() => router.push('/word-detail', { word: item })}
      />
    </View>
  );

  // 主内容
  const renderContent = () => {
    if (loading && words.length === 0) {
      return (
        <View style={styles.centerArea}>
          <Text style={styles.hint}>加载中...</Text>
        </View>
      );
    }

    if (error && words.length === 0) {
      return (
        <View style={styles.centerArea}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={retry}>
            <Text style={styles.retryBtnText}>重新加载</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (words.length === 0) {
      return (
        <View style={styles.centerArea}>
          <Text style={styles.hint}>暂无待学习词汇</Text>
        </View>
      );
    }

    return (
      <>
        {/* 单词浏览区 - 原生 ScrollView 水平滑动 */}
        <View style={styles.wordsSection}>
          <Text style={styles.sectionTitle}>
            剩余 {words.length} 个单词 · 左右滑动浏览
          </Text>

          {/* 固定宽度视口 + overflow hidden 确保只显示3个左右单词 */}
          <View style={styles.wordViewport}>
            <ScrollView
              ref={scrollViewRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={VIEWPORT_WIDTH}
              decelerationRate="fast"
              contentContainerStyle={styles.wordScrollContent}
              onScroll={handleScroll}
              scrollEventThrottle={100}
            >
              {words.map(renderWordItem)}
            </ScrollView>
          </View>
        </View>

        {/* 分类按钮区 */}
        <View className="flex-row justify-between gap-3 mt-4">
          {(['known', 'vague', 'unknown'] as const).map(cat => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryBtn,
                cat === 'known' ? styles.catKnown :
                cat === 'vague' ? styles.catVague : styles.catUnknown,
              ]}
              onPress={() => {
                if (words.length > 0) handleCategorize(words[0], cat);
              }}
            >
              <Text
                style={[
                  styles.catBtnText,
                  cat === 'known' ? styles.catKnownText :
                  cat === 'vague' ? styles.catVagueText : styles.catUnknownText,
                ]}
              >
                {cat === 'known' ? '已会' : cat === 'vague' ? '模糊' : '不会'}
                {' '}({categories[cat].length})
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text className="text-gray-400 text-xs mt-4 text-center">
          点击分类按钮将当前首词归入对应类别
        </Text>
      </>
    );
  };

  return (
    <Screen>
      {/* Header */}
      <View style={styles.header} pointerEvents="auto">
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>词汇预览</Text>
        <TouchableOpacity style={styles.calendarIcon} activeOpacity={0.7}>
          <Text style={styles.calendarIconText}>Cal</Text>
        </TouchableOpacity>
      </View>

      {/* 内容 */}
      <View style={styles.container}>
        {renderContent()}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    position: 'relative',
    zIndex: 10,
  },
  backBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    zIndex: 10,
  },
  backBtnText: {
    fontSize: 15,
    color: '#374151',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
  },
  calendarIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  calendarIconText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },

  wordsSection: {},
  sectionTitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 10,
    marginLeft: 4,
  },
  // 视口容器：固定宽度 + overflow hidden
  wordViewport: {
    width: VIEWPORT_WIDTH,
    maxWidth: VIEWPORT_WIDTH,
    minWidth: 0,
    height: 52,
    overflow: 'hidden' as const,
  },
  // ScrollView 内容：每个 item 占满视口宽度
  wordScrollContent: {
    flexDirection: 'row',
  },
  wordScrollItem: {
    width: VIEWPORT_WIDTH,
    paddingHorizontal: 4,
  },

  // 单词卡片
  wordCardContent: {
    backgroundColor: '#E5E7EB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 9,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },

  // 分类按钮
  categoryBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
  },
  catKnown: { backgroundColor: '#D1FAE5' },
  catVague: { backgroundColor: '#FEF3C7' },
  catUnknown: { backgroundColor: '#FEE2E2' },
  catBtnText: { fontSize: 14, fontWeight: '600' },
  catKnownText: { color: '#059669' },
  catVagueText: { color: '#D97706' },
  catUnknownText: { color: '#DC2626' },

  centerArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    fontSize: 15,
    color: '#9CA3AF',
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 11,
    borderRadius: 10,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
