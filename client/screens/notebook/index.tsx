import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, FlatList } from 'react-native';
import { Screen } from '@/components/Screen';
import { useSafeRouter } from '@/hooks/useSafeRouter';

interface Word {
  id: number;
  word: string;
  pronunciation: string;
  meaning: string;
  example: string;
}

export default function NotebookScreen() {
  const router = useSafeRouter();
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotebook = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/words/notebook`);
      const result = await response.json();
      if (result.success) {
        setWords(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch notebook:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotebook();
  }, [fetchNotebook]);

  const handleMarkKnown = async (wordId: number) => {
    try {
      await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/words/${wordId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'known' }),
      });
      setWords(prev => prev.filter(w => w.id !== wordId));
    } catch (error) {
      console.error('Failed to mark as known:', error);
    }
  };

  const renderItem = ({ item }: { item: Word }) => (
    <View style={styles.wordCard}>
      <View style={styles.wordHeader}>
        <Text style={styles.wordText}>{item.word}</Text>
        <Text style={styles.pronunciationText}>{item.pronunciation}</Text>
      </View>
      <Text style={styles.meaningText}>{item.meaning}</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.exampleText} numberOfLines={1}>{item.example}</Text>
        <TouchableOpacity 
          style={styles.knownBtn}
          onPress={() => handleMarkKnown(item.id)}
        >
          <Text style={styles.knownBtnText}>mark known</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Screen>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backBtn}>← back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>notebook</Text>
          <View style={styles.placeholder} />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>loading...</Text>
          </View>
        ) : words.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>no words yet</Text>
            <Text style={styles.emptyText}>
              words you mark as &quot;still learning&quot; will appear here
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.countContainer}>
              <Text style={styles.countText}>{words.length} words to review</Text>
            </View>
            <FlatList
              data={words}
              renderItem={renderItem}
              keyExtractor={item => item.id.toString()}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          </>
        )}
      </SafeAreaView>
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
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  backBtn: {
    fontSize: 14,
    color: '#000000',
    letterSpacing: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    letterSpacing: 2,
  },
  placeholder: {
    width: 50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#666666',
    letterSpacing: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
  },
  countContainer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  countText: {
    fontSize: 12,
    color: '#666666',
    letterSpacing: 1,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  wordCard: {
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 4,
    padding: 20,
    marginBottom: 12,
  },
  wordHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  wordText: {
    fontSize: 24,
    fontWeight: '400',
    color: '#000000',
  },
  pronunciationText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 12,
  },
  meaningText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 12,
  },
  exampleText: {
    flex: 1,
    fontSize: 12,
    color: '#666666',
    fontStyle: 'italic',
    marginRight: 12,
  },
  knownBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 2,
  },
  knownBtnText: {
    fontSize: 10,
    color: '#000000',
    letterSpacing: 1,
  },
});
