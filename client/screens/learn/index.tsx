import { useState, useEffect } from 'react';
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

  useEffect(() => {
    fetchWords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

        {/* Word Cards Grid */}
        <View style={styles.gridContainer}>
          {words.map((word, index) => (
            <View key={word.id} style={styles.wordItem}>
              {/* Word Tag */}
              <TouchableOpacity 
                style={[styles.wordCard, index === currentIndex && styles.wordCardActive]}
                onPress={() => {
                  setCurrentIndex(index);
                  setShowMeaning(false);
                }}
              >
                <View style={styles.wordTextContainer}>
                  {word.word.split('').map((char, i) => (
                    <Text key={i} style={styles.wordText}>{char}</Text>
                  ))}
                </View>
              </TouchableOpacity>
              
              {/* Start Learn Button */}
              <TouchableOpacity style={styles.learnButton}>
                <View style={styles.learnTextContainer}>
                  <Text style={styles.learnText}>学</Text>
                  <Text style={styles.learnText}>习</Text>
                </View>
              </TouchableOpacity>
              
              {/* Guide Line */}
              <View style={[styles.guideLine, index === currentIndex && styles.guideLineActive]} />
            </View>
          ))}
        </View>

        {/* Word Detail Card */}
        {currentWord && (
          <View style={styles.detailContainer}>
            <View style={styles.detailCard}>
              <TouchableOpacity 
                style={styles.detailWordCard}
                onPress={() => setShowMeaning(!showMeaning)}
              >
                <Text style={styles.detailWord}>{currentWord.word}</Text>
                {showMeaning && (
                  <Text style={styles.detailMeaning}>{currentWord.meaning}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

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

        {/* Right Guide Line */}
        <View style={styles.rightLine} />
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
    backgroundColor: '#D8D8D8',
  },
  backText: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'serif',
  },
  title: {
    fontSize: 16,
    color: '#666666',
    fontFamily: 'serif',
    fontWeight: '600',
  },
  placeholder: {
    width: 50,
  },
  gridContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  wordItem: {
    alignItems: 'center',
    position: 'relative',
  },
  wordCard: {
    backgroundColor: '#EBEBEB',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
    minWidth: 50,
  },
  wordCardActive: {
    backgroundColor: '#333333',
  },
  wordTextContainer: {
    alignItems: 'center',
  },
  wordText: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'serif',
  },
  learnButton: {
    backgroundColor: '#EBEBEB',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 45,
  },
  learnTextContainer: {
    alignItems: 'center',
  },
  learnText: {
    fontSize: 11,
    color: '#666666',
    fontFamily: 'serif',
  },
  guideLine: {
    width: 1,
    height: 80,
    backgroundColor: '#B8D4E8',
    marginTop: 15,
  },
  guideLineActive: {
    backgroundColor: '#2C5F8A',
  },
  detailContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  detailCard: {
    flex: 1,
  },
  detailWordCard: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  detailWord: {
    fontSize: 36,
    fontWeight: '600',
    color: '#333333',
    fontFamily: 'serif',
  },
  detailMeaning: {
    fontSize: 16,
    color: '#666666',
    fontFamily: 'serif',
    marginTop: 20,
    textAlign: 'center',
  },
  navContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    paddingBottom: 30,
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
  rightLine: {
    position: 'absolute',
    right: 15,
    top: 80,
    bottom: 80,
    width: 1,
    backgroundColor: '#B8D4E8',
  },
});
