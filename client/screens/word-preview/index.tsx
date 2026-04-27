import { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Alert,
  TouchableOpacity,
  PanResponder,
  useWindowDimensions,
} from 'react-native';
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

const CARD_WIDTH = 200;
const CARD_GAP = 16;
const ITEM_WIDTH = CARD_WIDTH + CARD_GAP;
const LOAD_MORE_THRESHOLD = 5;
const PAGE_SIZE = 20;

function WordCard({ word }: { word: Word }) {
  return (
    <View style={cardStyles.card}>
      <View style={cardStyles.cardInner}>
        <Text style={cardStyles.wordText}>{word.word}</Text>
        <Text style={cardStyles.phoneticText}>{word.phonetic || ''}</Text>
        <View style={cardStyles.divider} />
        <Text style={cardStyles.meaningText}>{word.meaning}</Text>
        {word.example ? (
          <View style={cardStyles.exampleBox}>
            <Text style={cardStyles.exampleLabel}>例句</Text>
            <Text style={cardStyles.exampleText}>{word.example}</Text>
            {word.translation ? (
              <Text style={cardStyles.exampleTranslation}>{word.translation}</Text>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

/* eslint-disable react-hooks/refs */
export default function WordPreviewPage() {
  const { width: windowWidth } = useWindowDimensions();
  const screenWidth = windowWidth || Dimensions.get('window').width || 393;
  const CENTER_BASE = (screenWidth - CARD_WIDTH) / 2;

  const [words, setWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [categoryCounts, setCategoryCounts] = useState({ x: 0, y: 0, z: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const offsetRef = useRef(0);
  const currentIndexRef = useRef(0);
  const wordsRef = useRef<Word[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const setCurrentIndexRef = useRef<React.Dispatch<React.SetStateAction<number>>>((_v) => {});
  const panX = useRef(new Animated.Value(0)).current;
  const panResponderRef = useRef<ReturnType<typeof PanResponder.create> | null>(null);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    wordsRef.current = words;
  }, [words]);

  useEffect(() => {
    setCurrentIndexRef.current = setCurrentIndex;
  }, []);

  useEffect(() => {
    panResponderRef.current = PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, gestureState) => {
        return Math.abs(gestureState.dx) > 5;
      },
      onPanResponderGrant: () => {
        panX.stopAnimation();
        panX.setValue(-currentIndexRef.current * ITEM_WIDTH);
      },
      onPanResponderMove: (_evt, gestureState) => {
        panX.setValue(-currentIndexRef.current * ITEM_WIDTH + gestureState.dx);
      },
      onPanResponderRelease: (_evt, gestureState) => {
        const currentIdx = currentIndexRef.current;
        const wordCount = wordsRef.current.length;

        if (gestureState.dx < -ITEM_WIDTH * 0.25 && currentIdx < wordCount - 1) {
          const newIdx = currentIdx + 1;
          Animated.timing(panX, {
            toValue: -newIdx * ITEM_WIDTH,
            duration: 250,
            useNativeDriver: false,
          }).start();
          setCurrentIndexRef.current(newIdx);
        } else if (gestureState.dx > ITEM_WIDTH * 0.25 && currentIdx > 0) {
          const newIdx = currentIdx - 1;
          Animated.timing(panX, {
            toValue: -newIdx * ITEM_WIDTH,
            duration: 250,
            useNativeDriver: false,
          }).start();
          setCurrentIndexRef.current(newIdx);
        } else {
          Animated.spring(panX, {
            toValue: -currentIdx * ITEM_WIDTH,
            friction: 8,
            useNativeDriver: false,
          }).start();
        }
      },
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const panHandlers = panResponderRef.current?.panHandlers;

  const fetchWords = useCallback(
    async (append = false) => {
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
            setWords((prev) => [...prev, ...data]);
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
    },
    [panX]
  );

  const fetchCategoryCounts = useCallback(async () => {
    try {
      const [xRes, yRes, zRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/user-words/category/words_x/count`),
        fetch(`${API_BASE_URL}/api/v1/user-words/category/words_y/count`),
        fetch(`${API_BASE_URL}/api/v1/user-words/category/words_z/count`),
      ]);
      const [xData, yData, zData] = await Promise.all([
        xRes.json(),
        yRes.json(),
        zRes.json(),
      ]);
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

  // 自动加载更多
  useEffect(() => {
    if (
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

  const handleMoveComplete = useCallback(
    async (word: Word, targetTable: string) => {
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

        setWords((prev) => {
          const newWords = prev.filter((w) => w.id !== word.id);
          const newIndex = Math.min(currentIndexRef.current, Math.max(0, newWords.length - 1));
          setCurrentIndexRef.current(newIndex);
          Animated.timing(panX, {
            toValue: -newIndex * ITEM_WIDTH,
            duration: 250,
            useNativeDriver: false,
          }).start();
          return newWords;
        });
        offsetRef.current = Math.max(0, offsetRef.current - 1);

        fetchCategoryCounts();
      } catch (error) {
        console.error('Failed to move word:', error);
        Alert.alert('错误', '移动失败，请重试');
      }
    },
    [panX, fetchCategoryCounts]
  );

  const scrollToPrev = useCallback(() => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      Animated.timing(panX, {
        toValue: -newIndex * ITEM_WIDTH,
        duration: 250,
        useNativeDriver: false,
      }).start();
      setCurrentIndex(newIndex);
    }
  }, [currentIndex, panX]);

  const scrollToNext = useCallback(() => {
    if (currentIndex < words.length - 1) {
      const newIndex = currentIndex + 1;
      Animated.timing(panX, {
        toValue: -newIndex * ITEM_WIDTH,
        duration: 250,
        useNativeDriver: false,
      }).start();
      setCurrentIndex(newIndex);
    }
  }, [currentIndex, words.length, panX]);

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
        <View style={styles.cardsArea}>
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
              {/* Cards */}
              {words.map((word, index) => {
                const distance = Math.abs(index - currentIndex);
                return (
                  <Animated.View
                    key={word.id}
                    style={[
                      cardStyles.card,
                      {
                        left: CENTER_BASE + index * ITEM_WIDTH,
                        transform: [
                          { translateX: panX },
                          {
                            scale: panX.interpolate({
                              inputRange: [
                                -(index + 1) * ITEM_WIDTH,
                                -index * ITEM_WIDTH,
                                -(index - 1) * ITEM_WIDTH,
                              ],
                              outputRange: [0.92, 1, 0.92],
                              extrapolate: 'clamp',
                            }),
                          },
                        ],
                        opacity: panX.interpolate({
                          inputRange: [
                            -(index + 2) * ITEM_WIDTH,
                            -(index + 1) * ITEM_WIDTH,
                            -index * ITEM_WIDTH,
                            -(index - 1) * ITEM_WIDTH,
                            -(index - 2) * ITEM_WIDTH,
                          ],
                          outputRange: [0, 0.5, 1, 0.5, 0],
                          extrapolate: 'clamp',
                        }),
                        zIndex: 100 - distance,
                      },
                    ]}
                  >
                    <WordCard word={word} />
                  </Animated.View>
                );
              })}
              {/* Transparent touch overlay to capture gestures */}
              {panHandlers && <View style={styles.touchOverlay} {...panHandlers} />}
            </>
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
          <TouchableOpacity
            style={styles.navButton}
            onPress={scrollToNext}
            disabled={currentIndex >= total - 1}
          >
            <Text style={[styles.navText, currentIndex >= total - 1 && styles.navTextDisabled]}>
              下一个
            </Text>
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
  cardsArea: {
    flex: 1,
    overflow: 'hidden',
  },
  touchOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 200,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#999999',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
  },
  loadingMoreBox: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  loadingMoreText: {
    fontSize: 12,
    color: '#999999',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  navText: {
    fontSize: 14,
    color: '#666666',
    marginHorizontal: 4,
  },
  navTextDisabled: {
    color: '#CCCCCC',
  },
  swipeHintText: {
    fontSize: 12,
    color: '#AAAAAA',
  },
  categorySection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  dropHint: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
    textAlign: 'center',
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  categoryButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  knownButton: {
    backgroundColor: '#DCFCE7',
  },
  vagueButton: {
    backgroundColor: '#FEF9C3',
  },
  unknownButton: {
    backgroundColor: '#FEE2E2',
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  categoryCount: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
});

const cardStyles = StyleSheet.create({
  card: {
    position: 'absolute',
    top: 20,
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
    padding: 20,
    minHeight: 280,
    justifyContent: 'center',
  },
  wordText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },
  phoneticText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 6,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 14,
  },
  meaningText: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 22,
  },
  exampleBox: {
    marginTop: 14,
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  exampleLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 6,
  },
  exampleText: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 20,
  },
  exampleTranslation: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
    fontStyle: 'italic',
  },
});
