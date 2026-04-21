import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';

interface Word {
  id: number;
  word: string;
  phonetic: string;
  meaning: string;
  example?: string;
}

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

export default function WordListPage() {
  const router = useSafeRouter();
  const params = useSafeSearchParams<{ table?: string }>();
  const table = params.table || 'words_b'; // 默认从 words_b 获取
  
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWords();
  }, [table]);

  const fetchWords = async () => {
    try {
      // 从指定的词汇表获取单词
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/wordbooks/${table}`);
      const data = await response.json();
      setWords(data);
    } catch (error) {
      console.error('Error fetching words:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWordPress = (word: Word) => {
    router.push('/word-detail', { 
      word: JSON.stringify({
        id: word.id,
        word: word.word,
        phonetic: word.phonetic || '',
        meaning: word.meaning,
        example: word.example || ''
      }),
      table: table
    });
  };

  const renderItem = ({ item }: { item: Word }) => (
    <TouchableOpacity 
      style={styles.wordItem}
      onPress={() => handleWordPress(item)}
    >
      <View style={styles.wordHeader}>
        <Text style={styles.wordText}>{item.word}</Text>
        <Text style={styles.phoneticText}>{item.phonetic}</Text>
      </View>
      <Text style={styles.meaningText} numberOfLines={2}>{item.meaning}</Text>
    </TouchableOpacity>
  );

  return (
    <Screen>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>← back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>我的词汇书</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Word Count */}
        <View style={styles.countBar}>
          <Text style={styles.countText}>共 {words.length} 个单词</Text>
        </View>

        {/* Word List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>加载中...</Text>
          </View>
        ) : (
          <FlatList
            data={words}
            renderItem={renderItem}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
  },
  backText: {
    fontSize: 14,
    color: '#000000',
    fontFamily: 'serif',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    fontFamily: 'serif',
  },
  placeholder: {
    width: 50,
  },
  countBar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F0F0F0',
  },
  countText: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'serif',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#999999',
    fontFamily: 'serif',
  },
  listContent: {
    padding: 16,
  },
  wordItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  wordHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  wordText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    fontFamily: 'serif',
    marginRight: 8,
  },
  phoneticText: {
    fontSize: 14,
    color: '#999999',
    fontFamily: 'serif',
  },
  meaningText: {
    fontSize: 14,
    color: '#333333',
    fontFamily: 'serif',
    lineHeight: 20,
  },
});
