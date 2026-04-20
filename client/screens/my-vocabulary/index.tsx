import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';

interface WordBook {
  id: number;
  name: string;
}

export default function MyVocabularyPage() {
  const router = useSafeRouter();
  const wordBooks: WordBook[] = [
    { id: 1, name: '高中' },
    { id: 2, name: '四级' },
    { id: 3, name: '六级' },
    { id: 4, name: '考研' },
  ];

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

        {/* Word Books Grid */}
        <View style={styles.gridContainer}>
          {wordBooks.map((book: WordBook, index: number) => (
            <View key={book.id} style={styles.bookItem}>
              {/* Book Tag */}
              <View style={styles.tagContainer}>
                <Text style={styles.tagText}>{book.name}</Text>
              </View>
              
              {/* Learn Button */}
              <TouchableOpacity style={styles.learnButton}>
                <Text style={styles.learnText}>开始学习</Text>
              </TouchableOpacity>
              
              {/* Guide Line */}
              <View style={[styles.guideLine, index === 0 && styles.guideLineWithDot]} />
              {index === 0 && <View style={styles.dot} />}
            </View>
          ))}
        </View>
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
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  bookItem: {
    alignItems: 'center',
    position: 'relative',
  },
  tagContainer: {
    backgroundColor: '#EBEBEB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  tagText: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'serif',
  },
  learnButton: {
    backgroundColor: '#EBEBEB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  learnText: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'serif',
  },
  guideLine: {
    width: 1,
    height: 200,
    backgroundColor: '#B8D4E8',
    marginTop: 20,
  },
  guideLineWithDot: {
    position: 'relative',
  },
  dot: {
    position: 'absolute',
    bottom: -4,
    left: -3,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#333333',
  },
});
