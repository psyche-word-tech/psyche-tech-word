import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { useOfflineWords } from '@/hooks/useOfflineData';
import { API_BASE_URL } from '@/utils/apiConfig';

const EXPO_PUBLIC_BACKEND_BASE_URL = API_BASE_URL;

interface Word {
  id: number;
  word: string;
  meaning: string;
  phonetic?: string;
  example?: string;
  example_translation?: string;
  image_url?: string;
  example_image_url?: string;
  translation?: string;
}

export default function WordListPage() {
  const router = useSafeRouter();
  const params = useSafeSearchParams<{ table?: string }>();
  const table = params.table || 'words_b';

  const { words: offlineWords, loading: offlineLoading } = useOfflineWords(table);
  const [words, setWords] = useState<Word[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const fetchWords = async () => {
        setLoading(true);
        try {
          // 优先使用离线数据
          if (offlineWords.length > 0) {
            setWords(offlineWords);
            setLoading(false);
            return;
          }

          // 离线无数据，回退到远程API
          const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/wordbooks/${table}`);
          const data = await response.json();
          if (Array.isArray(data)) {
            setWords(data);
          }
        } catch (error) {
          console.error('Failed to fetch words:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchWords();
    }, [table, offlineWords.length])
  );

  const filteredWords = words.filter(word =>
    word.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
    word.meaning.includes(searchQuery)
  );

  const handleWordPress = (word: Word) => {
    router.push('/word-detail', {
      word: JSON.stringify({
        id: word.id,
        word: word.word,
        phonetic: word.phonetic || '',
        meaning: word.meaning,
        example: word.example || '',
        example_translation: word.example_translation || word.translation || '',
        image_url: word.image_url || word.example_image_url || ''
      }),
      table: table
    });
  };

  return (
    <Screen>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>← back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>单词列表</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="搜索单词..."
            placeholderTextColor="#999999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Loading */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        )}

        {/* Word List */}
        {!loading && (
          <ScrollView style={styles.listContainer}>
            {filteredWords.length > 0 ? (
              filteredWords.map((word) => (
                <TouchableOpacity
                  key={word.id}
                  style={styles.wordItem}
                  onPress={() => handleWordPress(word)}
                >
                  <View style={styles.wordRow}>
                    <Text style={styles.wordText}>{word.word}</Text>
                    {word.phonetic && (
                      <Text style={styles.phoneticText}>{word.phonetic}</Text>
                    )}
                  </View>
                  <Text style={styles.meaningText}>{word.meaning}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.emptyText}>暂无单词</Text>
            )}
          </ScrollView>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backText: {
    fontSize: 16,
    color: '#007AFF',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  placeholder: {
    width: 50,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  searchInput: {
    height: 40,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#333333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  wordItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  wordText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginRight: 8,
  },
  phoneticText: {
    fontSize: 14,
    color: '#666666',
  },
  meaningText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#999999',
    marginTop: 60,
  },
});
