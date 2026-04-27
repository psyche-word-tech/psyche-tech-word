import { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Alert, TouchableOpacity, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { Screen } from '@/components/Screen';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { API_BASE_URL } from '@/utils/apiConfig';

interface Word {
  id: number;
  word: string;
  phonetic: string;
  meaning: string;
  example?: string | null;
  translation?: string | null;
}

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = 260;
const CARD_GAP = 20;
const ITEM_WIDTH = CARD_WIDTH + CARD_GAP;
const LOAD_MORE_THRESHOLD = 5;
const PAGE_SIZE = 20;

interface WordCardProps {
  word: Word;
}

function WordCard({ word }: WordCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardInner}>
        <Text style={styles.wordText}>{word.word}</Text>
        <Text style={styles.phoneticText}>{word.phonetic || ''}</Text>
        <View style={styles.divider} />
        <Text style={styles.meaningText}>{word.meaning}</Text>
        {word.example ? (
          <View style={styles.exampleBox}>
            <Text style={styles.exampleLabel}>例句</Text>
            <Text style={styles.exampleText}>{word.example}</Text>
            {word.translation ? (
              <Text style={styles.exampleTranslation}>{word.translation}</Text>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

export default function WordPreviewPage() {
  const scrollViewRef = useRef<ScrollView>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [categoryCounts, setCategoryCounts] = useState({ x: 0, y: 0, z: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const offsetRef = useRef(0);
  const currentIndexRef = useRef(0);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  const fetchWords = useCallback(async (append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setIsLoading(true);
      offsetRef.current = 0;
    }
    setError(null);
    try {
      const offset = append ? offsetRef.current : 0;
      const response = await fetch(
        `${API_BASE_URL}/api/v1/user-words/category/words_b?offset=${offset}&limit=${PAGE_SIZE}`
      );
      const data = await response.json();
      if (Array.isArray(data)) {
        if (data.length < PAGE_SIZE) {
          setHasMore(false);
        }
        if (append) {
          setWords(prev => [...prev, ...data]);
        } else {
          setWords(data);
          setCurrentIndex(0);
          scrollViewRef.current?.scrollTo({ x: 0, animated: false });
        }
        offsetRef.current = offset + data.length;
      } else {
        setError('返回数据格式错误');
      }
    } catch (err: any) {
      console.error('Failed to fetch words:', err);
      setError(err?.message || '网络请求失败');
    } finally {
      setIsLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const fetchCategoryCounts = useCallback(async () => {
    try {
      const [xRes, yRes, zRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/user-words/category/words_x/count`),
        fetch(`${API_BASE_URL}/api/v1/user-words/category/words_y/count`),
        fetch(`${API_BASE_URL}/api/v1/user-words/category/words_z/count`),
      ]);
      const [xData, yData, zData] = await Promise.all([xRes.json(), yRes.json(), zRes.json()]);
      setCategoryCounts({
        x: xData.count || 0,
        y: yData.count || 0,
        z: zData.count || 0,
      });
    } catch (error) {
      console.error('Failed to fetch category counts:', error);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchWords(false);
      fetchCategoryCounts();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchWords, fetchCategoryCounts]);

  useFocusEffect(
    useCallback(() => {
      fetchWords(false);
      fetchCategoryCounts();
    }, [fetchWords, fetchCategoryCounts])
  );

  const handleMoveComplete = useCallback(async (word: Word, targetTable: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/user-words/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wordId: word.id,
          targetTable: targetTable,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '移动失败');
      }

      setWords(prev => {
        const newWords = prev.filter(w => w.id !== word.id);
        const newIndex = Math.min(currentIndexRef.current, Math.max(0, newWords.length - 1));
        setCurrentIndex(newIndex);
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({ x: newIndex * ITEM_WIDTH, animated: false });
        }, 50);
        return newWords;
      });
      offsetRef.current = Math.max(0, offsetRef.current - 1);

      fetchCategoryCounts();
    } catch (error) {
      console.error('Failed to move word:', error);
      Alert.alert('错误', '移动失败，请重试');
    }
  }, [fetchCategoryCounts]);

  const handleScrollEnd = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / ITEM_WIDTH);
    setCurrentIndex(Math.max(0, Math.min(newIndex, words.length - 1)));
  }, [words.length]);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const offsetX = contentOffset.x;
    const maxOffset = contentSize.width - layoutMeasurement.width;
    if (offsetX > maxOffset - 200 && hasMore && !loadingMore && !isLoading) {
      fetchWords(true);
    }
  }, [hasMore, loadingMore, isLoading, fetchWords]);

  const scrollToPrev = useCallback(() => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      scrollViewRef.current?.scrollTo({ x: newIndex * ITEM_WIDTH, animated: true });
      setCurrentIndex(newIndex);
    }
  }, [currentIndex]);

  const scrollToNext = useCallback(() => {
    if (currentIndex < words.length - 1) {
      const newIndex = currentIndex + 1;
      scrollViewRef.current?.scrollTo({ x: newIndex * ITEM_WIDTH, animated: true });
      setCurrentIndex(newIndex);
    }
  }, [currentIndex, words.length]);

  const currentWord = words[currentIndex];
  const total = words.length;

  return (
    <Screen>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>词汇预览</Text>
          <Text style={styles.headerCount}>
            {isLoading ? '加载中...' : total > 0 ? `${currentIndex + 1} / ${total}` : '0 / 0'}
          </Text>
          <TouchableOpacity style={styles.refreshButton} onPress={() => fetchWords(false)}>
            <Text style={styles.refreshText}>刷新</Text>
          </TouchableOpacity>
        </View>

        {/* Cards ScrollView */}
        <View style={styles.scrollWrapper}>
          {isLoading ? (
            <View style={styles.centerBox}>
              <Text style={styles.emptyText}>加载中...</Text>
            </View>
          ) : error ? (
            <View style={styles.centerBox}>
              <Text style={styles.errorText}>加载失败: {error}</Text>
            </View>
          ) : total === 0 ? (
            <View style={styles.centerBox}>
              <Text style={styles.emptyText}>所有单词已分类完成！</Text>
            </View>
          ) : (
            <ScrollView
              ref={scrollViewRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={ITEM_WIDTH}
              decelerationRate="fast"
              scrollEventThrottle={16}
              onMomentumScrollEnd={handleScrollEnd}
              onScroll={handleScroll}
              contentContainerStyle={styles.scrollContent}
            >
              {words.map((word) => (
                <View key={word.id} style={styles.cardWrapper}>
                  <WordCard word={word} />
                </View>
              ))}
            </ScrollView>
          )}

          {loadingMore && (
            <View style={styles.loadingMoreBox}>
              <Text style={styles.loadingMoreText}>加载更多单词...</Text>
            </View>
          )}
        </View>

        {/* Navigation buttons */}
        <View style={styles.navRow}>
          <TouchableOpacity style={styles.navButton} onPress={scrollToPrev} disabled={currentIndex <= 0}>
            <Ionicons name="chevron-back" size={20} color={currentIndex <= 0 ? '#ccc' : '#666'} />
            <Text style={[styles.navText, currentIndex <= 0 && styles.navTextDisabled]}>上一个</Text>
          </TouchableOpacity>
          <Text style={styles.swipeHintText}>左右滑动切换单词</Text>
          <TouchableOpacity style={styles.navButton} onPress={scrollToNext} disabled={currentIndex >= total - 1}>
            <Text style={[styles.navText, currentIndex >= total - 1 && styles.navTextDisabled]}>下一个</Text>
            <Ionicons name="chevron-forward" size={20} color={currentIndex >= total - 1 ? '#ccc' : '#666'} />
          </TouchableOpacity>
        </View>

        {/* Category Buttons */}
        <View style={styles.categorySection}>
          <Text style={styles.dropHint}>将当前单词分类到</Text>
          <View style={styles.categoryRow}>
            <TouchableOpacity
              style={[styles.categoryButton, styles.knownButton]}
              onPress={() => currentWord && handleMoveComplete(currentWord, 'words_x')}
            >
              <Text style={styles.categoryLabel}>已会</Text>
              <Text style={styles.categoryCount}>{categoryCounts.x}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.categoryButton, styles.vagueButton]}
              onPress={() => currentWord && handleMoveComplete(currentWord, 'words_y')}
            >
              <Text style={styles.categoryLabel}>模糊</Text>
              <Text style={styles.categoryCount}>{categoryCounts.y}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.categoryButton, styles.unknownButton]}
              onPress={() => currentWord && handleMoveComplete(currentWord, 'words_z')}
            >
              <Text style={styles.categoryLabel}>不会</Text>
              <Text style={styles.categoryCount}>{categoryCounts.z}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333333',
  },
  headerCount: {
    fontSize: 14,
    color: '#999999',
    flex: 1,
    marginLeft: 12,
    textAlign: 'center',
  },
  refreshButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  refreshText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  scrollWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: (screenWidth - CARD_WIDTH) / 2,
    paddingVertical: 20,
    gap: 0,
  },
  cardWrapper: {
    width: ITEM_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  cardInner: {
    padding: 24,
    minHeight: 280,
    justifyContent: 'center',
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
  },
  wordText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },
  phoneticText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  meaningText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 24,
  },
  exampleBox: {
    marginTop: 20,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 12,
  },
  exampleLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 6,
  },
  exampleText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  exampleTranslation: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 6,
    lineHeight: 18,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  navText: {
    fontSize: 13,
    color: '#666666',
  },
  navTextDisabled: {
    color: '#CCCCCC',
  },
  swipeHintText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  loadingMoreBox: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  loadingMoreText: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  categorySection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
  },
  dropHint: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  categoryButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 16,
  },
  knownButton: {
    backgroundColor: '#4CAF50',
  },
  vagueButton: {
    backgroundColor: '#FF9800',
  },
  unknownButton: {
    backgroundColor: '#F44336',
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  categoryCount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 4,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  errorText: {
    fontSize: 14,
    color: '#E53935',
  },
});
