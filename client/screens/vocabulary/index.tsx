import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';

interface Word {
  id: number;
  word: string;
  meaning: string;
}

export default function VocabularyPage() {
  const router = useSafeRouter();
  const [words] = useState<Word[]>([
    { id: 1, word: 'apple', meaning: '苹果' },
    { id: 2, word: 'book', meaning: '书' },
    { id: 3, word: 'cat', meaning: '猫' },
  ]);
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);

  const renderItem = ({ item }: { item: Word }) => (
    <TouchableOpacity 
      style={styles.wordItem}
      onPress={() => setSelectedWord(item)}
    >
      <Text style={styles.wordText}>{item.word}</Text>
      <Text style={styles.meaningText}>{item.meaning}</Text>
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

        {/* Word List */}
        <FlatList
          data={words}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          style={styles.list}
          contentContainerStyle={styles.listContent}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backText: {
    fontSize: 14,
    color: '#D4B896',
    fontFamily: 'serif',
  },
  title: {
    fontSize: 18,
    color: '#FFFFFF',
    fontFamily: 'serif',
    fontWeight: '600',
  },
  placeholder: {
    width: 50,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 20,
  },
  wordItem: {
    padding: 20,
    marginBottom: 10,
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#333',
  },
  wordText: {
    fontSize: 20,
    color: '#D4B896',
    fontFamily: 'serif',
    fontWeight: '600',
    marginBottom: 4,
  },
  meaningText: {
    fontSize: 14,
    color: '#888888',
    fontFamily: 'serif',
  },
});
