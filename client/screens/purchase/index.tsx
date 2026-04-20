import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';

export default function PurchasePage() {
  const router = useSafeRouter();

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
              <Text style={styles.mainText}>您是否确认购买蝴蝶单词四级版</Text>
              
              {/* Buttons */}
              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.button} onPress={() => router.back()}>
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
    fontSize: 14,
    color: '#333333',
    fontFamily: 'serif',
  },
  placeholder: {
    width: 50,
  },
  dialogContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  dialog: {
    width: '100%',
    borderWidth: 2,
    borderColor: '#4A90D9',
    borderStyle: 'dashed',
    backgroundColor: '#FFFFFF',
  },
  emptySpace: {
    height: 80,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  mainText: {
    fontSize: 14,
    color: '#333333',
    fontFamily: 'serif',
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 30,
  },
  button: {
    backgroundColor: '#7CB342',
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'serif',
    fontWeight: '600',
  },
  noticeBar: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
  },
  noticeText: {
    fontSize: 12,
    color: '#888888',
    fontFamily: 'serif',
    textAlign: 'center',
  },
});
