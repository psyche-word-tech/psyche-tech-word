import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { API_BASE_URL } from '@/utils/apiConfig';
import { useState } from 'react';

// 词汇书ID到数据库表的映射（与 vocabulary 页面一致）
// id: vocabulary 页面的词汇书ID
// sourceTable: 源数据表
// name: 词汇书名称
const BOOK_TABLE_MAP: Record<number, { sourceTable: string; name: string }> = {
  1: { sourceTable: 'words_a', name: '高中词汇' },  // 高中词汇 -> words_a
  2: { sourceTable: 'words_c', name: '四级词汇' },  // 四级词汇 -> words_c
  3: { sourceTable: 'words_d', name: '六级词汇' },  // 六级词汇 -> words_d
  4: { sourceTable: 'words_a', name: '考研词汇' },  // 考研词汇 -> 复制 words_a 到 words_b
};

export default function PurchasePage() {
  const router = useSafeRouter();
  const params = useSafeSearchParams<{ books?: string }>();
  const [isLoading, setIsLoading] = useState(false);

  // 解析选择的书籍
  interface Book {
    id: number;
    name: string;
    price: number;
  }
  const books: Book[] = params.books ? JSON.parse(params.books) : [];
  const selectedBook = books[0]; // 取第一个选择的书籍
  const bookConfig = selectedBook ? BOOK_TABLE_MAP[selectedBook.id] : null;

  const handleConfirm = async () => {
    if (!bookConfig) {
      Alert.alert('错误', '未选择词汇书');
      return;
    }

    // 考研词汇无需复制，直接标记已购买
    if (bookConfig.sourceTable === 'words_b') {
      try {
        setIsLoading(true);
        
        // 调用 API 标记词汇书为已购买
        await fetch(`${API_BASE_URL}/api/v1/wordbooks/purchase`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookId: selectedBook.id }),
        });

        Alert.alert('成功', '购买成功！', [
          { text: '确定', onPress: () => router.replace('/my-vocabulary') }
        ]);
      } catch (error) {
        console.error('Purchase error:', error);
        Alert.alert('错误', '购买失败，请重试');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    try {
      setIsLoading(true);

      // 调用 API 复制词汇
      const response = await fetch(`${API_BASE_URL}/api/v1/wordbooks/copy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceTable: bookConfig.sourceTable,
          targetTable: 'words_b',
          bookId: selectedBook.id,
        }),
      });

      const result = await response.json();

      if (result.success) {
        Alert.alert('成功', `已成功购买《${bookConfig.name}》，包含 ${result.copiedCount || 0} 个单词`, [
          { text: '确定', onPress: () => router.replace('/my-vocabulary') }
        ]);
      } else {
        Alert.alert('失败', result.error || '购买失败，请重试');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      Alert.alert('错误', '网络错误，请检查网络连接');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <Screen>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>← 返回</Text>
          </TouchableOpacity>
          <Text style={styles.title}>确认购买</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Dialog */}
        <View style={styles.dialogContainer}>
          <View style={styles.dialog}>
            {/* Empty space */}
            <View style={styles.emptySpace} />
            
            {/* Main content */}
            <View style={styles.content}>
              <Text style={styles.mainText}>
                您是否确认购买《{bookConfig?.name || ''}》
              </Text>
              
              {bookConfig && bookConfig.sourceTable !== 'words_b' && (
                <Text style={styles.subText}>
                  购买后，{bookConfig.name}的单词将复制到您的学习区
                </Text>
              )}
              
              {/* Button */}
              <View style={styles.buttonRow}>
                <TouchableOpacity 
                  style={[styles.button, styles.confirmButton]} 
                  onPress={handleConfirm}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={[styles.buttonText, styles.confirmButtonText]}>确认</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Notice */}
            <View style={styles.noticeBar}>
              <Text style={styles.noticeText}>点击确认后将开始复制词汇</Text>
            </View>
          </View>
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
    backgroundColor: '#E5E5E5',
  },
  backText: {
    fontSize: 14,
    color: '#000000',
    fontFamily: 'serif',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    fontFamily: 'serif',
  },
  placeholder: {
    width: 50,
  },
  dialogContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialog: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#333333',
  },
  emptySpace: {
    height: 80,
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  mainText: {
    fontSize: 16,
    color: '#000000',
    textAlign: 'center',
    fontFamily: 'serif',
    marginBottom: 16,
  },
  subText: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    fontFamily: 'serif',
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 20,
  },
  button: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#333333',
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  confirmButtonText: {
    color: '#FFFFFF',
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
  },
  buttonText: {
    fontSize: 14,
    color: '#000000',
    fontFamily: 'serif',
  },
  noticeBar: {
    backgroundColor: '#E5E5E5',
    padding: 12,
    alignItems: 'center',
  },
  noticeText: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'serif',
  },
});
