import React, { useEffect, useRef, useState, useCallback, Component } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  ScrollView,
  Modal,
  useWindowDimensions,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetchWithRetry } from "@/utils/apiClient";
import { useSafeRouter } from "@/hooks/useSafeRouter";

// Error boundary to catch any render errors
class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean; error: string }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: "" };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message + "\n" + (error.stack || "") };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20, backgroundColor: "#f3f4f6" }}>
          <Text style={{ color: "#EF4444", fontSize: 16, fontWeight: "700" }}>页面渲染出错</Text>
          <Text style={{ color: "#374151", fontSize: 12, marginTop: 12, textAlign: "center" }}>{this.state.error}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}
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

function WordPreviewContent() {
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
  const [error, setError] = useState<string | null>(null);
  const [modalCategory, setModalCategory] = useState<string | null>(null);

  // Drag visual state
  const [dragWord, setDragWord] = useState<Word | null>(null);
  const dragAnim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const dragScale = useRef(new Animated.Value(1)).current;
  const floatOrigin = useRef({ x: 0, y: 0 });

  // Drag logic stored in ref to avoid re-renders during gesture
  const dragRef = useRef<{
    active: boolean;
    word: Word | null;
    startX: number;
    startY: number;
    isClick: boolean;
  }>({ active: false, word: null, startX: 0, startY: 0, isClick: true });

  // Prevent duplicate handling when both touch and pointer events fire
  const gestureLock = useRef(false);

  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);
      const res = await fetchWithRetry(`/api/v1/words?table=${TABLE}`);
      const data = (await res.json()) || [];
      setAllWords(data);
      setQueue(data);
      setStatus({ known: [], fuzzy: [], unknown: [] });
    } catch (e: any) {
      console.error(e);
      setError(e.message || "加载失败，请检查网络连接");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [TABLE]);

  const didInit = useRef(false);
  useEffect(() => {
    if (!didInit.current) {
      didInit.current = true;
      fetchData();
    }
  }, [fetchData]);

  const loadMockData = useCallback(() => {
    const mock: Word[] = [
      { id: 1, word: "abandon", phonetic: "/əˈbændən/", meaning: "v. 放弃，遗弃" },
      { id: 2, word: "ability", phonetic: "/əˈbɪləti/", meaning: "n. 能力，才能" },
      { id: 3, word: "absolute", phonetic: "/ˈæbsəluːt/", meaning: "adj. 绝对的，完全的" },
      { id: 4, word: "academic", phonetic: "/ˌækəˈdemɪk/", meaning: "adj. 学术的，理论的" },
      { id: 5, word: "accept", phonetic: "/əkˈsept/", meaning: "v. 接受，认可" },
      { id: 6, word: "access", phonetic: "/ˈækses/", meaning: "n. 进入，通道" },
      { id: 7, word: "accident", phonetic: "/ˈæksɪdənt/", meaning: "n. 事故，意外" },
      { id: 8, word: "accurate", phonetic: "/ˈækjərət/", meaning: "adj. 精确的，准确的" },
      { id: 9, word: "achieve", phonetic: "/əˈtʃiːv/", meaning: "v. 达到，实现" },
    ];
    setAllWords(mock);
    setQueue(mock);
    setStatus({ known: [], fuzzy: [], unknown: [] });
    setError(null);
  }, []);

  const classify = useCallback((word: Word, category: string) => {
    setQueue((prev) => prev.filter((w) => w.id !== word.id));
    setStatus((prev) => ({
      ...prev,
      [category]: [...prev[category as keyof WordStatus], word],
    }));
  }, []);

  // Detect which drop zone the pointer is over using getBoundingClientRect
  const detectDropZone = useCallback(
    (clientX: number, clientY: number): string | null => {
      if (typeof document === "undefined") return null;
      const zones = [
        { id: "drop-known", key: "known" },
        { id: "drop-fuzzy", key: "fuzzy" },
        { id: "drop-unknown", key: "unknown" },
      ];
      for (const zone of zones) {
        const el = document.getElementById(zone.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (
            clientX >= rect.left &&
            clientX <= rect.right &&
            clientY >= rect.top &&
            clientY <= rect.bottom
          ) {
            return zone.key;
          }
        }
      }
      return null;
    },
    []
  );

  // Start drag or tap
  const startGesture = useCallback(
    (word: Word, clientX: number, clientY: number) => {
      if (gestureLock.current) return;
      gestureLock.current = true;

      dragRef.current = {
        active: true,
        word,
        startX: clientX,
        startY: clientY,
        isClick: true,
      };

      const phoneWidth = width > 500 ? 375 : width;
      const cw = (phoneWidth - 48) / 3;
      floatOrigin.current = {
        x: clientX - cw / 2,
        y: clientY - 90,
      };

      setDragWord(word);
      dragScale.setValue(1.08);
      dragAnim.setValue({ x: 0, y: 0 });
    },
    [width, dragAnim, dragScale]
  );

  // Move during drag
  const moveGesture = useCallback(
    (clientX: number, clientY: number) => {
      const state = dragRef.current;
      if (!state.active) return;

      const dx = clientX - state.startX;
      const dy = clientY - state.startY;

      // 20px threshold to distinguish tap from drag
      if (Math.abs(dx) > 20 || Math.abs(dy) > 20) {
        state.isClick = false;
      }

      dragAnim.setValue({ x: dx, y: dy });
    },
    [dragAnim]
  );

  // End drag or tap
  const endGesture = useCallback(
    (clientX: number, clientY: number) => {
      if (!gestureLock.current) return;
      gestureLock.current = false;

      const state = dragRef.current;
      if (!state.active) return;

      dragRef.current.active = false;

      if (state.isClick) {
        // Tap → detail page
        setDragWord(null);
        dragScale.setValue(1);
        if (state.word) {
          router.push(
            `/word-detail?word=${encodeURIComponent(state.word.word)}`
          );
        }
        return;
      }

      // Drag release → classify if over a button
      const category = detectDropZone(clientX, clientY);
      if (category && state.word) {
        setDragWord(null);
        dragScale.setValue(1);
        classify(state.word, category);
      } else {
        // Snap back
        Animated.spring(dragAnim, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
          friction: 5,
        }).start(() => {
          setDragWord(null);
          dragScale.setValue(1);
        });
      }
    },
    [classify, detectDropZone, router, dragAnim, dragScale]
  );

  // Global touch handlers (most reliable on mobile browsers)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) moveGesture(t.clientX, t.clientY);
    };

    const onTouchEnd = (e: TouchEvent) => {
      const t = e.changedTouches[0];
      if (t) endGesture(t.clientX, t.clientY);
    };

    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("touchcancel", onTouchEnd);

    return () => {
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [moveGesture, endGesture]);

  // Global pointer handlers (for desktop / stylus)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const onPointerMove = (e: PointerEvent) => {
      moveGesture(e.clientX, e.clientY);
    };

    const onPointerUp = (e: PointerEvent) => {
      endGesture(e.clientX, e.clientY);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [moveGesture, endGesture]);

  const handleTouchStartCard = useCallback(
    (word: Word) =>
      (e: any) => {
        // Prevent browser default scrolling / text-selection on the card
        if (e.preventDefault) e.preventDefault();

        const native = e.nativeEvent;
        const touch = native.touches?.[0] ?? native;
        const clientX = touch.clientX ?? 0;
        const clientY = touch.clientY ?? 0;
        startGesture(word, clientX, clientY);
      },
    [startGesture]
  );

  const handlePointerDownCard = useCallback(
    (word: Word) =>
      (e: any) => {
        if (e.preventDefault) e.preventDefault();

        const native = e.nativeEvent;
        const clientX = native.clientX ?? 0;
        const clientY = native.clientY ?? 0;
        startGesture(word, clientX, clientY);
      },
    [startGesture]
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
    <View className="flex-1" style={{ backgroundColor: "#f3f4f6" }}>
      {/* Floating drag card */}
      {dragWord && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: floatOrigin.current.x,
            top: floatOrigin.current.y,
            width: cardWidth,
            zIndex: 999,
            transform: [
              { translateX: dragAnim.x },
              { translateY: dragAnim.y },
              { scale: dragScale },
            ],
            opacity: 0.96,
          }}
        >
          <View
            style={{
              backgroundColor: "#ffffff",
              borderRadius: 12,
              padding: 12,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.22,
              shadowRadius: 14,
              elevation: 10,
              minHeight: 180,
              borderWidth: 2,
              borderColor: "#3b82f6",
            }}
          >
            <Text
              className="text-xs text-gray-400 text-right mb-2"
              style={{ userSelect: "none" }}
            >
              拖动中…
            </Text>
            <Text
              className="text-lg font-bold text-gray-900 mb-1"
              style={{ userSelect: "none" }}
            >
              {dragWord.word}
            </Text>
            {dragWord.phonetic && (
              <Text
                className="text-xs text-gray-500 mb-2"
                style={{ userSelect: "none" }}
              >
                {dragWord.phonetic}
              </Text>
            )}
            {dragWord.meaning && (
              <Text
                className="text-sm text-blue-600"
                style={{ userSelect: "none" }}
              >
                {dragWord.meaning}
                {dragWord.pos ? ` (${dragWord.pos})` : ""}
              </Text>
            )}
          </View>
        </Animated.View>
      )}

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
              {error ? (
                <>
                  <FontAwesome6
                    name="triangle-exclamation"
                    size={48}
                    color="#ef4444"
                  />
                  <Text className="text-base text-red-500 text-center mt-4">
                    {error}
                  </Text>
                  <TouchableOpacity
                    onPress={fetchData}
                    className="mt-4 bg-blue-500 px-6 py-3 rounded-xl"
                  >
                    <Text className="text-white font-semibold">重试</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
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
                </>
              )}
            </View>
          ) : (
            <>
              {/* Cards + Buttons grouped together and centred vertically */}
              <View className="flex-1 justify-center px-4">
                <View className="flex-row justify-between">
                  {currentCards.map((word, index) => {
                    const isDraggingThis = dragWord?.id === word.id;
                    return (
                      <View
                        key={word.id}
                        onTouchStart={handleTouchStartCard(word)}
                        onPointerDown={handlePointerDownCard(word)}
                        style={[
                          {
                            width: cardWidth,
                            minHeight: 180,
                            backgroundColor: isDraggingThis
                              ? "#f3f4f6"
                              : "#ffffff",
                            borderRadius: 12,
                            padding: 12,
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.08,
                            shadowRadius: 6,
                            elevation: 3,
                            opacity: isDraggingThis ? 0.35 : 1,
                            touchAction: "none",
                          },
                        ]}
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
                      </View>
                    );
                  })}
                </View>

                {remaining > 0 && (
                  <Text className="text-xs text-gray-400 text-center mt-3 mb-2">
                    还有{remaining}个单词待分类
                  </Text>
                )}

                <Text className="text-xs text-gray-400 text-center mt-4 mb-3">
                  拖动单词到下方按钮分类
                </Text>

                {/* Drop buttons */}
                <View className="flex-row justify-between">
                  {CATEGORIES.map((cat) => (
                    <View
                      key={cat.key}
                      nativeID={`drop-${cat.key}`}
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

export default function WordPreviewScreen() {
  return (
    <ErrorBoundary>
      <_WordPreviewScreen />
    </ErrorBoundary>
  );
}
