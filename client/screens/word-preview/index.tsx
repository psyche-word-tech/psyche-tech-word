import React, { useEffect, useRef, useState, useCallback } from "react";
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
import { Screen } from "@/components/Screen";
import { FontAwesome6 } from "@expo/vector-icons";

const CATEGORIES = [
  { key: "known", label: "已会", color: "#22c55e", lightColor: "#dcfce7" },
  { key: "fuzzy", label: "模糊", color: "#f97316", lightColor: "#ffedd5" },
  { key: "unknown", label: "不会", color: "#ef4444", lightColor: "#fee2e2" },
];

const DROP_ZONES = [
  { key: "known", id: "drop-known" },
  { key: "fuzzy", id: "drop-fuzzy" },
  { key: "unknown", id: "drop-unknown" },
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

type DragState = {
  active: boolean;
  word: Word | null;
  startX: number;
  startY: number;
  isClick: boolean;
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

  // Drag state
  const dragStateRef = useRef<DragState>({
    active: false,
    word: null,
    startX: 0,
    startY: 0,
    isClick: true,
  });
  const [dragWord, setDragWord] = useState<Word | null>(null);
  const dragAnim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const dragScale = useRef(new Animated.Value(1)).current;
  const floatOrigin = useRef({ x: 0, y: 0 });

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
      fetchData();
    }
  }, [fetchData]);

  const classify = useCallback((word: Word, category: string) => {
    setQueue((prev) => prev.filter((w) => w.id !== word.id));
    setStatus((prev) => ({
      ...prev,
      [category]: [...prev[category as keyof WordStatus], word],
    }));
  }, []);

  const getCategoryFromPoint = useCallback(
    (clientX: number, clientY: number): string | null => {
      if (typeof document === "undefined") return null;
      const el = document.elementFromPoint(clientX, clientY);
      let target: Element | null = el;
      while (target) {
        const id = target.id;
        if (id === "drop-known") return "known";
        if (id === "drop-fuzzy") return "fuzzy";
        if (id === "drop-unknown") return "unknown";
        target = target.parentElement;
      }
      return null;
    },
    []
  );

  // Global pointer handlers for reliable drag on Web
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleMove = (e: PointerEvent) => {
      const state = dragStateRef.current;
      if (!state.active) return;

      const dx = e.clientX - state.startX;
      const dy = e.clientY - state.startY;

      // If moved more than 8px, treat as drag not click
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
        state.isClick = false;
      }

      // Use setValue for instant updates (no animation delay)
      dragAnim.setValue({ x: dx, y: dy });
    };

    const handleUp = (e: PointerEvent) => {
      const state = dragStateRef.current;
      if (!state.active) return;

      dragStateRef.current.active = false;

      if (state.isClick) {
        // Short press without significant movement → navigate to detail
        if (state.word) {
          router.push(
            `/word-detail?word=${encodeURIComponent(state.word.word)}`
          );
        }
      } else {
        // Drag release → check drop target
        const category = getCategoryFromPoint(e.clientX, e.clientY);
        if (category && state.word) {
          classify(state.word, category);
        }
      }

      // Reset animation
      Animated.spring(dragAnim, {
        toValue: { x: 0, y: 0 },
        useNativeDriver: false,
        friction: 5,
      }).start(() => {
        setDragWord(null);
        dragScale.setValue(1);
      });
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);

    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
    };
  }, [classify, getCategoryFromPoint, router, dragAnim, dragScale]);

  const handlePointerDown = useCallback(
    (word: Word) =>
      (e: any) => {
        const native = e.nativeEvent;
        const clientX = native.clientX ?? native.pageX ?? 0;
        const clientY = native.clientY ?? native.pageY ?? 0;

        dragStateRef.current = {
          active: true,
          word,
          startX: clientX,
          startY: clientY,
          isClick: true,
        };

        // Set float card origin so it follows the finger precisely
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
      {/* Floating drag card (rendered above everything) */}
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
              {/* Cards */}
              <View className="px-4 pt-4 flex-1 justify-center">
                <View className="flex-row justify-between">
                  {currentCards.map((word, index) => {
                    const isDraggingThis = dragWord?.id === word.id;
                    return (
                      <View
                        key={word.id}
                        onPointerDown={handlePointerDown(word)}
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
                  <Text className="text-xs text-gray-400 text-center mt-3">
                    还有{remaining}个单词待分类
                  </Text>
                )}
              </View>

              {/* Drop buttons */}
              <View className="px-4 pt-6 pb-4">
                <Text className="text-xs text-gray-400 text-center mb-4">
                  拖动单词到下方按钮分类
                </Text>
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
