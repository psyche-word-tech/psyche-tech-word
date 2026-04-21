import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';

interface Word {
  id: number;
  word: string;
  phonetic: string;
  meaning: string;
}

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

export default function WordListPage() {
  const router = useSafeRouter();
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWords();
  }, []);

  const fetchWords = async () => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/user-words`);
      const data = await response.json();
      setWords(data);
    } catch (error) {
      console.error('Error fetching words:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWordPress = (word: Word) => {
    router.push('/word-detail', { word: JSON.stringify(word) });
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
          <Text style={styles.title}>考研词汇</Text>
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
    borderBottomColor: '#F0F0F0',
  },
  backText: {
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 50,
  },
  countBar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F8F8F8',
  },
  countText: {
    fontSize: 14,
    color: '#999',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#999',
  },
  listContent: {
    padding: 16,
  },
  wordItem: {
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  wordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  wordText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 12,
  },
  phoneticText: {
    fontSize: 14,
    color: '#999',
  },
  meaningText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
