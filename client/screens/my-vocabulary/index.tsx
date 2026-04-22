import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { useApiConfig } from '@/contexts/ApiConfigContext';

interface WordBook {
  id: number;
  name: string;
}

export default function MyVocabularyPage() {
  const router = useSafeRouter();
  const { apiBaseUrl, isConfigLoaded } = useApiConfig();
  const [boughtBooks, setBoughtBooks] = useState<WordBook[]>([]);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useFocusEffect(
    useCallback(() => {
      const loadBooks = async () => {
        if (!isConfigLoaded) return;
        
        setIsLoading(true);
        setErrorMsg('');
        
        try {
          const response = await fetch(`${apiBaseUrl}/api/v1/wordbooks`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          
          const allBooks = await response.json();
          
          if (!Array.isArray(allBooks)) {
            throw new Error('API返回数据格式错误');
          }
          
          // 只保留已购买的（根据 API 返回的 purchased 字段）
          const purchasedBooks = allBooks
            .filter((book: any) => book.purchased === true)
            .map((book: any) => ({ id: book.id, name: book.name }));
          
          setBoughtBooks(purchasedBooks);
        } catch (error: any) {
          console.error('[MyVocabulary] 加载失败:', error);
          setErrorMsg(error.message || '加载失败');
          setBoughtBooks([]);
        } finally {
          setIsLoading(false);
        }
      };
      
      loadBooks();
    }, [apiBaseUrl, isConfigLoaded])
  );

  const handleLearnPress = (book: WordBook) => {
    // 所有已购买的词汇书都使用 words_a 作为学习表
    router.push('/learn', { table: 'words_a' });
  };

  if (!isConfigLoaded) {
    return (
      <Screen>
        <View style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>加载中...</Text>
          </View>
        </View>
      </Screen>
    );
  }

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
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text style={styles.loadingText}>加载中...</Text>
            </View>
          ) : errorMsg ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>加载失败</Text>
              <Text style={styles.errorHint}>({errorMsg})</Text>
            </View>
          ) : boughtBooks.length > 0 ? (
            boughtBooks.map((book: WordBook, index: number) => (
              <View key={book.id} style={styles.bookItem}>
                <View style={styles.tagContainer}>
                  {book.name.split('').map((char, i) => (
                    <Text key={i} style={styles.tagText}>{char}</Text>
                  ))}
                </View>
                
                <TouchableOpacity style={styles.learnButton} onPress={() => handleLearnPress(book)}>
                  <View style={styles.learnTextContainer}>
                    <Text style={styles.learnText}>开</Text>
                    <Text style={styles.learnText}>始</Text>
                    <Text style={styles.learnText}>学</Text>
                    <Text style={styles.learnText}>习</Text>
                  </View>
                </TouchableOpacity>
                
                <View style={[styles.guideLine, index === 0 && styles.guideLineWithDot]} />
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>暂无词汇书</Text>
              <Text style={styles.emptyHint}>请先购买词汇书</Text>
            </View>
          )}
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
    width: 1,
    height: 30,
    backgroundColor: '#CCCCCC',
    marginTop: 8,
  },
  guideLineWithDot: {
    height: 0,
    marginTop: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999999',
    fontFamily: 'serif',
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 12,
    color: '#CCCCCC',
    fontFamily: 'serif',
  },
  errorHint: {
    fontSize: 10,
    color: '#F44336',
    fontFamily: 'monospace',
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#999999',
    fontFamily: 'serif',
    marginTop: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBox: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  alertText: {
    fontSize: 14,
    color: '#333333',
    fontFamily: 'serif',
    marginBottom: 16,
    textAlign: 'center',
  },
  alertButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 4,
  },
  alertButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'serif',
  },
});
