import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface WordBook {
  id: number;
  name: string;
}

const STORAGE_KEY = 'bought_wordbooks';

// 词汇书ID对应的数据库表
// 只有已购买的词汇书才能调取对应数据库
const BOOK_TABLE_MAP: Record<number, { table: string | null; purchased: boolean }> = {
  1: { table: 'words_a', purchased: true }, // 高中词汇 - 已购买
  2: { table: 'words_b', purchased: true }, // 考研词汇 - 已购买
  3: { table: null, purchased: false }, // 四级词汇 - 未购买
  4: { table: null, purchased: false }, // 六级词汇 - 未购买
};

export default function MyVocabularyPage() {
  const router = useSafeRouter();
  const params = useSafeSearchParams<{ books?: string }>();
  const [boughtBooks, setBoughtBooks] = useState<WordBook[]>([]);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

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

  const handleLearnPress = (book: WordBook) => {
    const config = BOOK_TABLE_MAP[book.id];
    
    if (config && config.table && config.purchased) {
      // 已购买且有数据库，跳转到学习页面
      router.push('/learn', { table: config.table });
    } else {
      // 未购买或无数据库，显示提示
      setAlertMessage(`${book.name}暂未开放，请先购买`);
      setAlertVisible(true);
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
              <TouchableOpacity style={styles.learnButton} onPress={() => handleLearnPress(book)}>
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

        {/* Alert Modal */}
        <Modal
          visible={alertVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setAlertVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.alertBox}>
              <Text style={styles.alertText}>{alertMessage}</Text>
              <TouchableOpacity 
                style={styles.alertButton}
                onPress={() => setAlertVisible(false)}
              >
                <Text style={styles.alertButtonText}>确定</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
    fontSize: 12,
    color: '#666666',
    fontFamily: 'serif',
  },
  guideLine: {
    position: 'absolute',
    top: 60,
    left: -30,
    width: 60,
    height: 1,
    backgroundColor: '#CCCCCC',
  },
  guideLineWithDot: {
    backgroundColor: 'transparent',
  },
  // Modal 样式
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBox: {
    backgroundColor: '#FFFFFF',
    padding: 30,
    borderRadius: 8,
    minWidth: 250,
    alignItems: 'center',
  },
  alertText: {
    fontSize: 16,
    color: '#333333',
    fontFamily: 'serif',
    marginBottom: 20,
    textAlign: 'center',
  },
  alertButton: {
    backgroundColor: '#333333',
    paddingHorizontal: 40,
    paddingVertical: 10,
  },
  alertButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'serif',
  },
});
