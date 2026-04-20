import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { Screen } from '@/components/Screen';
import { useSafeRouter } from '@/hooks/useSafeRouter';

interface Word {
  id: number;
  word: string;
  pronunciation: string;
  meaning: string;
  example: string;
}

const { width } = Dimensions.get('window');

export default function LearnScreen() {
  const router = useSafeRouter();
  const [words, setWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchWords = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/words?category=new`);
      const result = await response.json();
      if (result.success) {
        setWords(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch words:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWords();
  }, [fetchWords]);

  const currentWord = words[currentIndex];

  const handleKnown = async () => {
    if (!currentWord) return;
    
    try {
      await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/words/${currentWord.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'known' }),
      });
    } catch (error) {
      console.error('Failed to update status:', error);
    }

    setShowMeaning(false);
    if (currentIndex < words.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      router.back();
    }
  };

  const handleUnknown = async () => {
    if (!currentWord) return;
    
    try {
      await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/words/${currentWord.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'unknown' }),
      });
    } catch (error) {
      console.error('Failed to update status:', error);
    }

    setShowMeaning(false);
    if (currentIndex < words.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      router.back();
    }
  };

  if (loading) {
    return (
      <Screen>
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>loading...</Text>
          </View>
        </SafeAreaView>
      </Screen>
    );
  }

  if (words.length === 0) {
    return (
      <Screen>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.backBtn}>← back</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>all done!</Text>
            <Text style={styles.emptyText}>you&apos;ve mastered all available words</Text>
          </View>
        </SafeAreaView>
      </Screen>
    );
  }

  return (
    <Screen>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backBtn}>← back</Text>
          </TouchableOpacity>
          <Text style={styles.progress}>{currentIndex + 1}/{words.length}</Text>
        </View>

        {/* Word Card */}
        <View style={styles.cardContainer}>
          <TouchableOpacity 
            style={styles.card} 
            onPress={() => setShowMeaning(!showMeaning)}
            activeOpacity={0.9}
          >
            {!showMeaning ? (
              <>
                <Text style={styles.wordText}>{currentWord.word}</Text>
                <Text style={styles.pronunciationText}>{currentWord.pronunciation}</Text>
                <Text style={styles.tapHint}>tap to reveal</Text>
              </>
            ) : (
              <>
                <Text style={styles.wordTextSmall}>{currentWord.word}</Text>
                <Text style={styles.meaningText}>{currentWord.meaning}</Text>
                <View style={styles.divider} />
                <Text style={styles.exampleText}>{currentWord.example}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.unknownBtn} 
            onPress={handleUnknown}
            activeOpacity={0.8}
          >
            <Text style={styles.unknownBtnText}>still learning</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.knownBtn} 
            onPress={handleKnown}
            activeOpacity={0.8}
          >
            <Text style={styles.knownBtnText}>got it</Text>
          </TouchableOpacity>
        </View>
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
  },
  backBtn: {
    fontSize: 14,
    color: '#000000',
    letterSpacing: 1,
  },
  progress: {
    fontSize: 14,
    color: '#666666',
    letterSpacing: 1,
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
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: width - 48,
    minHeight: 280,
    borderWidth: 1,
    borderColor: '#000000',
    padding: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wordText: {
    fontSize: 42,
    fontWeight: '300',
    color: '#000000',
    textAlign: 'center',
  },
  pronunciationText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 12,
  },
  tapHint: {
    fontSize: 12,
    color: '#999999',
    marginTop: 24,
    letterSpacing: 1,
  },
  wordTextSmall: {
    fontSize: 24,
    fontWeight: '400',
    color: '#000000',
    marginBottom: 16,
  },
  meaningText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
  },
  divider: {
    width: 40,
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 20,
  },
  exampleText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  unknownBtn: {
    flex: 1,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#000000',
  },
  unknownBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
  },
  knownBtn: {
    flex: 1,
    paddingVertical: 18,
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  knownBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
  },
});
