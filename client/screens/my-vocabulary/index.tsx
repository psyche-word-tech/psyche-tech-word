import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { fetchWithRetry } from '@/utils/apiClient';
import { Screen } from '@/components/Screen';

interface WordBook {
  id: number;
  name: string;
  purchased: boolean;
}

export default function MyVocabularyScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [boughtBooks, setBoughtBooks] = useState<WordBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const isMobile = width < 768;

  useEffect(() => {
    loadWordBooks();
  }, []);

  const loadWordBooks = async () => {
    try {
      setIsLoading(true);
      setErrorMsg('');
      const response = await fetchWithRetry('/api/v1/wordbooks');
      const data = await (response as Response).json();
      const purchased = data.filter((book: WordBook) => book.purchased);
      setBoughtBooks(purchased);
    } catch (err: any) {
      setErrorMsg(err.message || 'HTTP ' + (err.status || '?'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLearnPress = (book: WordBook) => {
    if (!book.purchased) {
      setAlertMessage('请先购买此词汇书');
      setShowAlert(true);
      return;
    }
    // 根据词汇书名称获取对应的表名
    const tableMap: Record<string, string> = {
      '高中词汇': 'a',
      '四级词汇': 'b',
      '六级词汇': 'c',
      '考研词汇': 'd',
    };
    const tableName = tableMap[book.name] || 'a';
    router.push(`/word-preview?table=${tableName}`);
  };

  const handleOldSchoolPress = () => {
    router.push('/tree-diagram');
  };

  // 响应式样式
  const containerStyle = {
    paddingHorizontal: isMobile ? 16 : 40,
    paddingTop: isMobile ? 20 : 60,
  };

  const gridStyle = {
    flexDirection: isMobile ? ('column' as const) : ('row' as const),
    alignItems: isMobile ? ('stretch' as const) : ('flex-start' as const),
    justifyContent: 'space-between',
    marginTop: isMobile ? 20 : 40,
  };

  const bookCardStyle = {
    backgroundColor: '#EBEBEB',
    borderRadius: isMobile ? 12 : 8,
    padding: isMobile ? 20 : 12,
    marginBottom: isMobile ? 16 : 0,
    alignItems: 'center' as const,
    flex: isMobile ? undefined : 1,
    marginHorizontal: isMobile ? 0 : 8,
  };

  const learnButtonStyle = {
    backgroundColor: '#4CAF50',
    paddingHorizontal: isMobile ? 32 : 12,
    paddingVertical: isMobile ? 14 : 8,
    borderRadius: isMobile ? 24 : 8,
    marginTop: isMobile ? 12 : 12,
    minWidth: isMobile ? 160 : 60,
  };

  return (
    <Screen>
      <View style={[styles.container, containerStyle]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace('/')}>
            <Text style={styles.backText}>← back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>我的词汇书</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Word Books Grid */}
        <View style={gridStyle}>
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
            <>
              {boughtBooks.map((book: WordBook) => (
                <View key={book.id} style={bookCardStyle}>
                  {/* Book Name Tag */}
                  <View style={styles.tagContainer}>
                    {book.name.split('').map((char, i) => (
                      <Text key={i} style={styles.tagText}>{char}</Text>
                    ))}
                  </View>
                  
                  {/* Learn Button */}
                  <TouchableOpacity 
                    style={learnButtonStyle} 
                    onPress={() => handleLearnPress(book)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.learnButtonText}>开始学习</Text>
                  </TouchableOpacity>
                </View>
              ))}

              {/* Old School Button - Only show on non-mobile */}
              {!isMobile && boughtBooks.length > 1 && (
                <TouchableOpacity style={styles.oldSchoolButton} onPress={handleOldSchoolPress}>
                  <Text style={styles.oldSchoolText}>old-school</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>暂无词汇书</Text>
              <Text style={styles.emptyHint}>请先购买词汇书</Text>
            </View>
          )}
        </View>

        {/* Alert Modal */}
        <Modal visible={showAlert} transparent animationType="fade" onRequestClose={() => setShowAlert(false)}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowAlert(false)}>
            <View style={styles.alertBox}>
              <Text style={styles.alertText}>{alertMessage}</Text>
              <TouchableOpacity style={styles.alertButton} onPress={() => setShowAlert(false)}>
                <Text style={styles.alertButtonText}>确定</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </Screen>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  backText: {
    fontSize: 16,
    color: '#666666',
    fontFamily: 'serif',
  },
  title: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#333333',
    fontFamily: 'serif',
  },
  placeholder: {
    width: 60,
  },
  oldSchoolButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'center' as const,
    marginTop: 40,
  },
  oldSchoolText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'serif',
    fontWeight: '600' as const,
  },
  tagContainer: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center' as const,
  },
  tagText: {
    fontSize: 16,
    color: '#333333',
    fontFamily: 'serif',
  },
  learnButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'serif',
    fontWeight: '600' as const,
    textAlign: 'center' as const,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
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
    fontSize: 12,
    color: '#F44336',
    fontFamily: 'monospace',
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
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
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  alertBox: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center' as const,
  },
  alertText: {
    fontSize: 16,
    color: '#333333',
    fontFamily: 'serif',
    marginBottom: 16,
    textAlign: 'center' as const,
  },
  alertButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 32,
    paddingVertical: 10,
    borderRadius: 8,
  },
  alertButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'serif',
    fontWeight: '600' as const,
  },
};
