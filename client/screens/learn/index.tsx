import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';

interface Word {
  id: number;
  word: string;
  meaning: string;
}

export default function LearnPage() {
  const router = useSafeRouter();
  const [words, setWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);

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

  const handleStartLearn = () => {
    setCurrentIndex(0);
    setShowMeaning(false);
    fetchWords();
  };

  const currentWord = words[currentIndex];

  const handleNext = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowMeaning(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setShowMeaning(false);
    }
  };

  return (
    <Screen>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>← back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>学习</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        {words.length === 0 ? (
          <View style={styles.emptyContainer}>
            <TouchableOpacity style={styles.startButton} onPress={handleStartLearn}>
              <Text style={styles.startButtonText}>开始学习</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.learnContainer}>
            {/* Word Card */}
            <TouchableOpacity 
              style={styles.wordCard}
              onPress={() => setShowMeaning(!showMeaning)}
            >
              <Text style={styles.wordText}>{currentWord?.word}</Text>
              {showMeaning && (
                <Text style={styles.meaningText}>{currentWord?.meaning}</Text>
              )}
            </TouchableOpacity>

            {/* Progress */}
            <Text style={styles.progressText}>
              {currentIndex + 1} / {words.length}
            </Text>

            {/* Navigation */}
            <View style={styles.navContainer}>
              <TouchableOpacity 
                style={[styles.navButton, currentIndex === 0 && styles.navButtonDisabled]} 
                onPress={handlePrev}
                disabled={currentIndex === 0}
              >
                <Text style={styles.navButtonText}>←</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.navButton, currentIndex === words.length - 1 && styles.navButtonDisabled]} 
                onPress={handleNext}
                disabled={currentIndex === words.length - 1}
              >
                <Text style={styles.navButtonText}>→</Text>
              </TouchableOpacity>
            </View>
          </View>
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
    fontSize: 14,
    color: '#333333',
    fontFamily: 'serif',
  },
  placeholder: {
    width: 50,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#333333',
    paddingHorizontal: 40,
    paddingVertical: 15,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'serif',
  },
  learnContainer: {
    flex: 1,
    padding: 20,
  },
  wordCard: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginBottom: 20,
  },
  wordText: {
    fontSize: 32,
    fontWeight: '600',
    color: '#333333',
    fontFamily: 'serif',
  },
  meaningText: {
    fontSize: 16,
    color: '#666666',
    fontFamily: 'serif',
    marginTop: 20,
  },
  progressText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#999999',
    fontFamily: 'serif',
    marginBottom: 20,
  },
  navContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
  },
  navButton: {
    backgroundColor: '#333333',
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  navButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
  },
});
