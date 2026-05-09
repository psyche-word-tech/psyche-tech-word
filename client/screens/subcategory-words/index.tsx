import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
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

      {/* Word Grid - all on one page, no scroll indicator */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text className="text-gray-500 mt-3">加载中...</Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 12 }}
        >
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              gap: 8,
            }}
          >
            {words.map((item) => (
              <View
                key={item.id}
                style={{
                  width: '31%',
                  backgroundColor: '#fff',
                  borderRadius: 12,
                  paddingVertical: 10,
                  paddingHorizontal: 4,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
                  marginBottom: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '700',
                    color: '#1F2937',
                    textAlign: 'center',
                  }}
                  numberOfLines={1}
                >
                  {item.word}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </Screen>
  );
}
