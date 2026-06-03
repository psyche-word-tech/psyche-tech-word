import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  PanResponder,
  ActivityIndicator,
  ScrollView,
  Modal,
  useWindowDimensions,
  Pressable,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetchWithRetry } from "@/utils/apiClient";
import { useSafeRouter } from "@/hooks/useSafeRouter";
import { Screen } from "@/components/Screen";
import { FontAwesome6 } from "@expo/vector-icons";

const CATEGORIES = [
  { key: "known", label: "已会", color: "#22c55e", lightColor: "#dcfce7" },
  { key: "fuzzy", label: "模糊", color: "#f97316", lightColor: "#ffedd5" },
  { key: "unknown", label: "不会", color: "#ef4444", lightColor: "#fee2e2" },
];

type Word = {
  id: number;
  word: string;
  phonetic?: string;
  meaning?: string;
  pos?: string;
  example?: string;
};

type WordStatus = {
  known: Word[];
  fuzzy: Word[];
  unknown: Word[];
};

export default function WordPreviewScreen() {
  const params = useLocalSearchParams();
  const router = useSafeRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const TABLE = params.table as string;

  const [allWords, setAllWords] = useState<Word[]>([]);
  const [queue, setQueue] = useState<Word[]>([]);
  const [status, setStatus] = useState<WordStatus>({
    known: [],
    fuzzy: [],
    unknown: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalCategory, setModalCategory] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Button refs for drop detection
  const buttonRefs = useRef<Array<View | null>>([null, null, null]);
  const buttonLayouts = useRef<
    Array<{ x: number; y: number; width: number; height: number } | null>
  >([null, null, null]);

  // Animated values for drag
  const dragAnim = useRef(new Animated.ValueXY()).current;
  const dragScale = useRef(new Animated.Value(1)).current;
  const [dragWord, setDragWord] = useState<Word | null>(null);
  const dragIndex = useRef<number>(-1);

  // Measure button positions
  const measureButtons = useCallback(() => {
    buttonRefs.current.forEach((ref, index) => {
      if (ref) {
        ref.measureInWindow((x, y, width, height) => {
          buttonLayouts.current[index] = { x, y, width, height };
        });
      }
    });
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await fetchWithRetry(`/api/words?table=${TABLE}`);
      const data = (await res.json()) || [];
      setAllWords(data);
      setQueue(data);
      setStatus({ known: [], fuzzy: [], unknown: [] });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [TABLE]);

  const didInit = useRef(false);
  useEffect(() => {
    if (!didInit.current) {
      didInit.current = true;
      fetchWithRetry(`/api/words?table=${TABLE}`).then(async (res: Response) => {
        const data = (await res.json()) || [];
        setAllWords(data);
        setQueue(data);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [TABLE]);

  // Re-measure buttons on layout changes
  useEffect(() => {
    const timer = setTimeout(measureButtons, 500);
    return () => clearTimeout(timer);
  }, [measureButtons, queue]);

  const getDropCategory = useCallback(
    (cardCenterX: number, cardCenterY: number) => {
      for (let i = 0; i < buttonLayouts.current.length; i++) {
        const layout = buttonLayouts.current[i];
        if (!layout) continue;
        if (
          cardCenterX >= layout.x &&
          cardCenterX <= layout.x + layout.width &&
          cardCenterY >= layout.y &&
          cardCenterY <= layout.y + layout.height
        ) {
          return CATEGORIES[i].key;
        }
      }
      return null;
    },
    []
  );

  const classify = useCallback(
    (word: Word, category: string) => {
      setQueue((prev) => prev.filter((w) => w.id !== word.id));
      setStatus((prev) => ({
        ...prev,
        [category]: [...prev[category as keyof WordStatus], word],
      }));
    },
    []
  );

  const handleCardPress = useCallback(
    (word: Word) => {
      if (!isDragging) {
        router.push(`/word-detail?word=${encodeURIComponent(word.word)}`);
      }
    },
    [isDragging, router]
  );

  const createPanResponder = useCallback(
    (word: Word, index: number) => {
      return PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gesture) => {
          return Math.abs(gesture.dy) > 5 || Math.abs(gesture.dx) > 5;
        },
        onPanResponderGrant: () => {
          dragIndex.current = index;
          setDragWord(word);
          setIsDragging(true);
          dragScale.setValue(1.1);
        },
        onPanResponderMove: (_, gesture) => {
          dragAnim.setValue({ x: gesture.dx, y: gesture.dy });
        },
        onPanResponderRelease: (_, gesture) => {
          const cardWidth = width > 500 ? 300 : (width - 48) / 3;
          const cardCenterX =
            16 + cardWidth * index + cardWidth / 2 + gesture.dx;
          const cardTopY = 80 + gesture.dy;
          const cardCenterY = cardTopY + 140;

          const category = getDropCategory(cardCenterX, cardCenterY);

          if (category && gesture.dy > 20) {
            // Drop on button - classify
            Animated.timing(dragAnim, {
              toValue: { x: 0, y: 200 },
              duration: 200,
              useNativeDriver: false,
            }).start(() => {
              classify(word, category);
              dragAnim.setValue({ x: 0, y: 0 });
              dragScale.setValue(1);
              setDragWord(null);
              setIsDragging(false);
              dragIndex.current = -1;
            });
          } else {
            // Snap back
            Animated.spring(dragAnim, {
              toValue: { x: 0, y: 0 },
              useNativeDriver: false,
            }).start(() => {
              dragAnim.setValue({ x: 0, y: 0 });
              dragScale.setValue(1);
              setDragWord(null);
              setIsDragging(false);
              dragIndex.current = -1;
            });
          }
        },
        onPanResponderTerminate: () => {
          Animated.spring(dragAnim, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start(() => {
            dragAnim.setValue({ x: 0, y: 0 });
            dragScale.setValue(1);
            setDragWord(null);
            setIsDragging(false);
            dragIndex.current = -1;
          });
        },
      });
    },
    [width, dragAnim, dragScale, getDropCategory, classify]
  );

  const currentCards = queue.slice(0, 3);
  const remaining = queue.length - currentCards.length;

  if (loading) {
    return (
      <Screen className="flex-1 bg-[#f3f4f6] items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </Screen>
    );
  }

  const phoneWidth = width > 500 ? 375 : width;
  const cardWidth = (phoneWidth - 48) / 3;

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: "#f3f4f6" }}
    >
      <View className="flex-1" style={{ alignItems: "center" }}>
        <View
          className="flex-1 bg-white"
          style={{
            width: phoneWidth,
            maxWidth: 375,
            borderRadius: width > 500 ? 16 : 0,
            overflow: "hidden",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: width > 500 ? 0.15 : 0,
            shadowRadius: width > 500 ? 12 : 0,
            elevation: width > 500 ? 8 : 0,
          }}
        >
          {/* Header */}
          <View
            className="flex-row items-center justify-between px-4 pt-4 pb-2"
            style={{ paddingTop: insets.top + 8 }}
          >
            <View>
              <Text className="text-xl font-bold text-gray-900">
                词汇预览
              </Text>
              <Text className="text-sm text-gray-500 mt-1">
                {allWords.length}个单词待分类
              </Text>
            </View>
            <TouchableOpacity
              onPress={fetchData}
              disabled={refreshing}
              className="bg-blue-500 px-4 py-2 rounded-lg"
            >
              <Text className="text-white font-semibold text-sm">
                {refreshing ? "刷新中" : "刷新"}
              </Text>
            </TouchableOpacity>
          </View>

          {currentCards.length === 0 ? (
            <View className="flex-1 items-center justify-center px-8">
              <FontAwesome6
                name="circle-check"
                size={64}
                color="#22c55e"
              />
              <Text className="text-xl font-bold text-gray-800 mt-4">
                分类完成
              </Text>
              <Text className="text-gray-500 text-center mt-2">
                已会 {status.known.length} · 模糊 {status.fuzzy.length} · 不会{" "}
                {status.unknown.length}
              </Text>
            </View>
          ) : (
            <>
              {/* Card area */}
              <View className="px-4 pt-4">
                <View className="flex-row justify-between">
                  {currentCards.map((word, index) => {
                    const panResponder = createPanResponder(word, index);
                    const isDraggingThis = dragWord?.id === word.id;

                    return (
                      <Animated.View
                        key={word.id}
                        {...panResponder.panHandlers}
                        style={[
                          {
                            width: cardWidth,
                            minHeight: 180,
                            backgroundColor: "#ffffff",
                            borderRadius: 12,
                            padding: 12,
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.08,
                            shadowRadius: 6,
                            elevation: 3,
                          },
                          isDraggingThis
                            ? {
                                transform: [
                                  {
                                    translateX: dragAnim.x as any,
                                  },
                                  {
                                    translateY: dragAnim.y as any,
                                  },
                                  { scale: dragScale as any },
                                ],
                                zIndex: 100,
                              }
                            : {},
                        ]}
                      >
                        {/* Disable text selection */}
                        <Pressable
                          onPress={() => handleCardPress(word)}
                          style={{ userSelect: "none" }}
                        >
                          <Text
                            className="text-xs text-gray-400 text-right mb-2"
                            style={{ userSelect: "none" }}
                          >
                            {allWords.length - queue.length + index + 1} /{" "}
                            {allWords.length}
                          </Text>
                          <Text
                            className="text-lg font-bold text-gray-900 mb-1"
                            style={{ userSelect: "none" }}
                          >
                            {word.word}
                          </Text>
                          {word.phonetic && (
                            <Text
                              className="text-xs text-gray-500 mb-2"
                              style={{ userSelect: "none" }}
                            >
                              {word.phonetic}
                            </Text>
                          )}
                          {word.meaning && (
                            <Text
                              className="text-sm text-blue-600"
                              style={{ userSelect: "none" }}
                            >
                              {word.meaning}
                              {word.pos ? ` (${word.pos})` : ""}
                            </Text>
                          )}
                        </Pressable>
                      </Animated.View>
                    );
                  })}
                </View>

                {remaining > 0 && (
                  <Text className="text-xs text-gray-400 text-center mt-3">
                    还有{remaining}个单词待分类
                  </Text>
                )}
              </View>

              {/* Buttons area */}
              <View
                className="px-4 pt-8 pb-4"
                onLayout={measureButtons}
              >
                <Text className="text-xs text-gray-400 text-center mb-4">
                  拖动单词到下方按钮分类
                </Text>
                <View className="flex-row justify-between">
                  {CATEGORIES.map((cat, index) => (
                    <View
                      key={cat.key}
                      ref={(ref) => { buttonRefs.current[index] = ref; }}
                      style={{
                        flex: 1,
                        marginHorizontal: 4,
                        paddingVertical: 12,
                        borderRadius: 10,
                        backgroundColor: cat.lightColor,
                        borderWidth: 1.5,
                        borderColor: cat.color,
                        alignItems: "center",
                      }}
                    >
                      <TouchableOpacity
                        onLongPress={() => setModalCategory(cat.key)}
                        delayLongPress={400}
                        style={{ alignItems: "center" }}
                      >
                        <Text
                          className="text-sm font-bold"
                          style={{ color: cat.color }}
                        >
                          {cat.label}
                        </Text>
                        <Text
                          className="text-xs mt-1"
                          style={{ color: cat.color }}
                        >
                          ({status[cat.key as keyof WordStatus].length})
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Category modal */}
      <Modal
        visible={modalCategory !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setModalCategory(null)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-2xl max-h-[70%]">
            <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
              <Text className="text-lg font-bold text-gray-900">
                {CATEGORIES.find((c) => c.key === modalCategory)?.label}列表
              </Text>
              <TouchableOpacity onPress={() => setModalCategory(null)}>
                <FontAwesome6 name="xmark" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <ScrollView className="px-4 pb-4">
              {(modalCategory
                ? status[modalCategory as keyof WordStatus]
                : []
              ).map((word) => (
                <View
                  key={word.id}
                  className="py-3 border-b border-gray-100"
                >
                  <Text className="text-base font-semibold text-gray-900">
                    {word.word}
                  </Text>
                  {word.phonetic && (
                    <Text className="text-xs text-gray-500">
                      {word.phonetic}
                    </Text>
                  )}
                  {word.meaning && (
                    <Text className="text-sm text-blue-600 mt-1">
                      {word.meaning}
                    </Text>
                  )}
                </View>
              ))}
              {modalCategory &&
                status[modalCategory as keyof WordStatus].length === 0 && (
                  <Text className="text-gray-400 text-center py-8">
                    暂无单词
                  </Text>
                )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
