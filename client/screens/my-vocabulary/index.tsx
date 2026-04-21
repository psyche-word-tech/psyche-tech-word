import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface WordBook {
  id: number;
  name: string;
}

const STORAGE_KEY = 'bought_wordbooks';

export default function MyVocabularyPage() {
  const router = useSafeRouter();
  const params = useSafeSearchParams<{ books?: string }>();
  const [boughtBooks, setBoughtBooks] = useState<WordBook[]>([]);

  useFocusEffect(
    useCallback(() => {
      const loadBooks = async () => {
        // 如果有传入的books参数，先合并保存
        if (params.books) {
          const newBooks: WordBook[] = JSON.parse(params.books);
          // 获取已有的
          const existing = await AsyncStorage.getItem(STORAGE_KEY);
          const existingBooks: WordBook[] = existing ? JSON.parse(existing) : [];
          // 合并去重
          const merged = [...existingBooks];
          newBooks.forEach(newBook => {
            if (!merged.find(b => b.id === newBook.id)) {
              merged.push(newBook);
            }
          });
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          setBoughtBooks(merged);
        } else {
          // 从存储读取
          const stored = await AsyncStorage.getItem(STORAGE_KEY);
          if (stored) {
            setBoughtBooks(JSON.parse(stored));
          }
        }
      };
      loadBooks();
    }, [params.books])
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

        {/* Word Books Grid */}
        <View style={styles.gridContainer}>
          {boughtBooks.map((book: WordBook, index: number) => (
            <View key={book.id} style={styles.bookItem}>
              {/* Book Tag */}
              <View style={styles.tagContainer}>
                {book.name.split('').map((char, i) => (
                  <Text key={i} style={styles.tagText}>{char}</Text>
                ))}
              </View>
              
              {/* Learn Button */}
              <TouchableOpacity style={styles.learnButton} onPress={() => router.push('/word-list', { table: 'words_b' })}>
                <View style={styles.learnTextContainer}>
                  <Text style={styles.learnText}>开</Text>
                  <Text style={styles.learnText}>始</Text>
                  <Text style={styles.learnText}>学</Text>
                  <Text style={styles.learnText}>习</Text>
                </View>
              </TouchableOpacity>
              
              {/* Guide Line */}
              <View style={[styles.guideLine, index === 0 && styles.guideLineWithDot]} />
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
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 12,
    alignItems: 'center',
    minWidth: 40,
  },
  tagText: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'serif',
  },
  learnButton: {
    backgroundColor: '#EBEBEB',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 40,
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
