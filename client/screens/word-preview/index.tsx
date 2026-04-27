import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Animated, PanResponder, Dimensions, Alert, TouchableOpacity } from 'react-native';
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
const CARD_WIDTH = screenWidth - 56;
const CARD_MARGIN = 8;
const ITEM_WIDTH = CARD_WIDTH + CARD_MARGIN;
const LOAD_MORE_THRESHOLD = 5;
const PAGE_SIZE = 20;

interface WordCardProps {
  word: Word;
  index: number;
  currentIndex: number;
  panX: Animated.Value;
}

// 单个单词卡片（纯展示，无手势）
function WordCard({ word, index, currentIndex, panX }: WordCardProps) {
  const translateX = useMemo(() =>
    panX.interpolate({
      inputRange: [-screenWidth, 0, screenWidth],
      outputRange: [
        (index - currentIndex) * ITEM_WIDTH - screenWidth,
        (index - currentIndex) * ITEM_WIDTH,
        (index - currentIndex) * ITEM_WIDTH + screenWidth,
      ],
    }),
  [panX, index, currentIndex]);

  const scale = useMemo(() =>
    panX.interpolate({
      inputRange: [-screenWidth, 0, screenWidth],
      outputRange: [
        index === currentIndex + 1 ? 1 : 0.92,
        index === currentIndex ? 1 : 0.92,
        index === currentIndex - 1 ? 1 : 0.92,
      ],
    }),
  [panX, index, currentIndex]);

  const opacity = useMemo(() =>
    panX.interpolate({
      inputRange: [-screenWidth, 0, screenWidth],
      outputRange: [
        index >= currentIndex - 1 && index <= currentIndex + 2 ? 1 : 0,
        index >= currentIndex - 1 && index <= currentIndex + 2 ? 1 : 0,
        index >= currentIndex - 2 && index <= currentIndex + 1 ? 1 : 0,
      ],
    }),
  [panX, index, currentIndex]);

  return (
    <Animated.View
      style={[
        styles.card,
        {
          transform: [{ translateX }, { scale }],
          opacity,
          zIndex: 100 - Math.abs(index - currentIndex),
        },
      ]}
    >
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
    </Animated.View>
  );
}

export default function WordPreviewPage() {
  const [words, setWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [categoryCounts, setCategoryCounts] = useState({ x: 0, y: 0, z: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const offsetRef = useRef(0);

  // 共享的位移值，控制整组卡片
  const panX = useMemo(() => new Animated.Value(0), []);
  const currentIndexRef = useRef(currentIndex);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  // 获取词汇列表（分页）
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
          panX.setValue(0);
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
  }, [panX]);

  // 获取分类数量
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

  // 页面加载时获取数据
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

  // 移动单词到分类
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

      // 从列表中移除并更新索引
      setWords(prev => {
        const newWords = prev.filter(w => w.id !== word.id);
        if (currentIndexRef.current >= newWords.length && newWords.length > 0) {
          const newIdx = newWords.length - 1;
          setCurrentIndex(newIdx);
          panX.setValue(0);
        }
        return newWords;
      });
      offsetRef.current = Math.max(0, offsetRef.current - 1);

      fetchCategoryCounts();
    } catch (error) {
      console.error('Failed to move word:', error);
      Alert.alert('错误', '移动失败，请重试');
    }
  }, [fetchCategoryCounts, panX]);

  // 手势处理：控制整组卡片
  const startXRef = useRef(0);
  /* eslint-disable react-hooks/refs */
  const panResponder = useMemo(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_evt, gestureState) => {
        return Math.abs(gestureState.dx) > 5;
      },
      onPanResponderGrant: () => {
        startXRef.current = -currentIndexRef.current * ITEM_WIDTH;
        panX.setOffset(startXRef.current);
        panX.setValue(0);
      },
      onPanResponderMove: (_evt, gestureState) => {
        panX.setValue(gestureState.dx);
      },
      onPanResponderRelease: (_evt, gestureState) => {
        panX.flattenOffset();
        const currentIdx = currentIndexRef.current;
        const total = words.length;

        if (gestureState.dx < -ITEM_WIDTH * 0.3 && currentIdx < total - 1) {
          // 向左滑够 → 下一张
          const newIdx = currentIdx + 1;
          setCurrentIndex(newIdx);
          Animated.timing(panX, {
            toValue: -newIdx * ITEM_WIDTH,
            duration: 250,
            useNativeDriver: false,
          }).start();
        } else if (gestureState.dx > ITEM_WIDTH * 0.3 && currentIdx > 0) {
          // 向右滑够 → 上一张
          const newIdx = currentIdx - 1;
          setCurrentIndex(newIdx);
          Animated.timing(panX, {
            toValue: -newIdx * ITEM_WIDTH,
            duration: 250,
            useNativeDriver: false,
          }).start();
        } else {
          // 回弹到当前位置
          Animated.spring(panX, {
            toValue: -currentIdx * ITEM_WIDTH,
            friction: 8,
            useNativeDriver: false,
          }).start();
        }
      },
    }),
  [panX, words.length]);
  /* eslint-enable react-hooks/refs */

  // 自动加载更多
  useEffect(() => {
    if (
      words.length > 0 &&
      currentIndex >= words.length - LOAD_MORE_THRESHOLD &&
      hasMore &&
      !loadingMore &&
      !isLoading
    ) {
      const timer = setTimeout(() => {
        fetchWords(true);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, words.length, hasMore, loadingMore, isLoading, fetchWords]);

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

        {/* Cards Area */}
        <View style={styles.cardsArea} {...panResponder.panHandlers}>
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
            <>
              {words.map((word, index) => (
                <WordCard
                  key={word.id}
                  word={word}
                  index={index}
                  currentIndex={currentIndex}
                  panX={panX}
                />
              ))}
            </>
          )}

          {loadingMore && (
            <View style={styles.loadingMoreBox}>
              <Text style={styles.loadingMoreText}>加载更多单词...</Text>
            </View>
          )}
        </View>

        {/* Swipe hint */}
        <View style={styles.swipeHintRow}>
          <Ionicons name="chevron-back" size={16} color="#999" />
          <Text style={styles.swipeHintText}>左右滑动切换单词</Text>
          <Ionicons name="chevron-forward" size={16} color="#999" />
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
  cardsArea: {
    flex: 1,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
  },
  card: {
    position: 'absolute',
    left: 24,
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
  swipeHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 12,
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
