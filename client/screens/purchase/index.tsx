import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';

interface Book {
  id: number;
  name: string;
  price: number;
}

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

export default function PurchasePage() {
  const router = useSafeRouter();
  const params = useSafeSearchParams<{ books?: string }>();
  const books: Book[] = params.books ? JSON.parse(params.books) : [];
  const bookName = books.map(b => b.name).join('、');

  const handleConfirm = async () => {
    try {
      // 调用 API 将 words_a 复制到 words_b
      await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/wordbooks/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceTable: 'words_a',
          targetTable: 'words_b'
        }),
      });

      // 返回购买界面
      router.replace('/vocabulary');
    } catch (error) {
      console.error('Purchase error:', error);
      // 即使失败也返回
      router.replace('/vocabulary');
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
          <Text style={styles.title}>购买</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Dialog */}
        <View style={styles.dialogContainer}>
          <View style={styles.dialog}>
            {/* Empty space */}
            <View style={styles.emptySpace} />
            
            {/* Main content */}
            <View style={styles.content}>
              <Text style={styles.mainText}>您是否确认购买蝴蝶单词{bookName}</Text>
              
              {/* Buttons */}
              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.button} onPress={handleConfirm}>
                  <Text style={styles.buttonText}>确认</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={() => router.back()}>
                  <Text style={styles.buttonText}>取消</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Notice */}
            <View style={styles.noticeBar}>
              <Text style={styles.noticeText}>注意：确认后显示是否支付成功</Text>
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
    marginBottom: 30,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 20,
  },
  button: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#333333',
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
