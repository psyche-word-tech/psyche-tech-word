import { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Screen } from '@/components/Screen';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { FontAwesome6 } from '@expo/vector-icons';

interface WordItem {
  id: number;
  word: string;
  phonetic: string;
  meaning: string;
}

export default function SubcategoryWordsPage() {
  const router = useSafeRouter();
  const { table, title } = useSafeSearchParams<{ table: string; title: string }>();
  const [words, setWords] = useState<WordItem[]>([]);
  const [loading, setLoading] = useState(true);

  const pageTitle = title || '单词列表';

  useEffect(() => {
    if (!table) return;

    /**
     * 服务端文件：server/src/routes/wordbooks.ts
     * 接口：GET /api/v1/wordbooks/:table
     * Path 参数：table: string
     */
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/wordbooks/${table}`
        );
        const data = await response.json();
        if (Array.isArray(data)) {
          setWords(data);
        }
      } catch (error) {
        console.error('Error fetching words:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [table]);

  const renderItem = ({ item }: { item: WordItem }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      className="mx-4 mb-3 bg-white rounded-2xl p-4 shadow-sm"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="text-xl font-bold text-gray-900">{item.word}</Text>
          {item.phonetic ? (
            <Text className="text-sm text-gray-500 mt-1">{item.phonetic}</Text>
          ) : null}
        </View>
        <FontAwesome6 name="chevron-right" size={16} color="#CBD5E1" />
      </View>
      {item.meaning ? (
        <Text className="text-sm text-gray-600 mt-2 leading-5" numberOfLines={2}>
          {item.meaning}
        </Text>
      ) : null}
    </TouchableOpacity>
  );

  return (
    <Screen className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-3 pb-4 bg-white">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mr-3"
          activeOpacity={0.7}
        >
          <FontAwesome6 name="arrow-left" size={18} color="#374151" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-lg font-bold text-gray-900">{pageTitle}</Text>
          <Text className="text-xs text-gray-500 mt-0.5">{words.length} 个单词</Text>
        </View>
      </View>

      {/* Word List */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text className="text-gray-500 mt-3">加载中...</Text>
        </View>
      ) : (
        <FlatList
          data={words}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="items-center justify-center mt-20">
              <FontAwesome6 name="book-open" size={48} color="#CBD5E1" />
              <Text className="text-gray-400 mt-4 text-base">暂无单词</Text>
            </View>
          }
        />
      )}
    </Screen>
  );
}
