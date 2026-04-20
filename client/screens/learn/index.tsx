import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';

interface Word {
  id: number;
  word: string;
  meaning: string;
}

interface Category {
  id: number;
  name: string;
  letter: string;
  count: number;
}

export default function LearnPage() {
  const router = useSafeRouter();
  const [words, setWords] = useState<Word[]>([]);
  const [categories, setCategories] = useState<Category[]>([
    { id: 1, name: '已会', letter: 'x', count: 0 },
    { id: 2, name: '模糊', letter: 'y', count: 0 },
    { id: 3, name: '不会', letter: 'z', count: 0 },
  ]);
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);

  useEffect(() => {
    fetchWords();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchWords = async () => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/words`);
      const result = await response.json();
      if (result.data) {
        setWords(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch words:', error);
    }
  };

  const handleWordClick = (word: Word) => {
    setSelectedWord(word);
  };

  const handleCategoryClick = (category: Category) => {
    if (selectedWord) {
      setCategories(cats =>
        cats.map(cat =>
          cat.id === category.id ? { ...cat, count: cat.count + 1 } : cat
        )
      );
      setWords(words.filter(w => w.id !== selectedWord.id));
      setSelectedWord(null);
    }
  };

  return (
    <Screen>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>← back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>词汇预览</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsText}>
            依次展示按照一定的顺序安排的单词，下面三个或者同时展示或者单独一个展示（只展示在中间一个），长按拖曳将单词拖入下面的三本单词书（里面的&quot;x&quot;、&quot;y&quot;、&quot;z&quot;显示加入后的词汇库数量）
          </Text>
        </View>

        {/* Word Cards */}
        <View style={styles.wordCardsContainer}>
          {words.length > 0 ? (
            words.map((word) => (
              <View key={word.id} style={styles.wordItemContainer}>
                <TouchableOpacity 
                  style={[styles.wordCard, selectedWord?.id === word.id && styles.wordCardSelected]}
                  onPress={() => handleWordClick(word)}
                  onLongPress={() => handleWordClick(word)}
                >
                  <Text style={styles.wordCardText}>{word.word}</Text>
                </TouchableOpacity>
                {/* Guide Line */}
                <View style={styles.guideLine} />
                {/* Category Button */}
                <TouchableOpacity 
                  style={[styles.categoryCard, selectedWord?.id === word.id && styles.categoryCardActive]}
                  onPress={() => {
                    if (selectedWord?.id === word.id) {
                      handleCategoryClick(categories[words.indexOf(word) % 3]);
                    }
                  }}
                >
                  <Text style={styles.categoryCardText}>
                    {categories[words.indexOf(word) % 3].name} ({categories[words.indexOf(word) % 3].letter})
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>暂无单词</Text>
            </View>
          )}
        </View>

        {/* Category Summary */}
        <View style={styles.categorySummaryContainer}>
          <Text style={styles.summaryTitle}>词汇库统计</Text>
          <View style={styles.summaryRow}>
            {categories.map((cat) => (
              <View key={cat.id} style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>{cat.name}</Text>
                <Text style={styles.summaryCount}>{cat.letter}: {cat.count}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#E5E5E5',
  },
  backText: {
    fontSize: 14,
    color: '#000000',
    fontFamily: 'serif',
  },
  title: {
    fontSize: 16,
    color: '#333333',
    fontFamily: 'serif',
    fontWeight: '600',
  },
  placeholder: {
    width: 50,
  },
  instructionsContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  instructionsText: {
    fontSize: 13,
    color: '#666666',
    fontFamily: 'serif',
    lineHeight: 20,
  },
  wordCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  wordItemContainer: {
    alignItems: 'center',
  },
  wordCard: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minWidth: 80,
    alignItems: 'center',
  },
  wordCardSelected: {
    backgroundColor: '#333333',
    borderColor: '#333333',
  },
  wordCardText: {
    fontSize: 14,
    color: '#333333',
    fontFamily: 'serif',
  },
  guideLine: {
    width: 1,
    height: 40,
    backgroundColor: '#4A90D9',
    marginVertical: 10,
  },
  categoryCard: {
    backgroundColor: '#4A4A4A',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  categoryCardActive: {
    backgroundColor: '#2C5F8A',
  },
  categoryCardText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontFamily: 'serif',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#999999',
    fontFamily: 'serif',
  },
  categorySummaryContainer: {
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 30,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  summaryTitle: {
    fontSize: 14,
    color: '#333333',
    fontFamily: 'serif',
    fontWeight: '600',
    marginBottom: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#666666',
    fontFamily: 'serif',
    marginBottom: 5,
  },
  summaryCount: {
    fontSize: 14,
    color: '#333333',
    fontFamily: 'serif',
    fontWeight: '600',
  },
});
