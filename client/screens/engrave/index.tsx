import { View, Text, TextInput, StyleSheet, TouchableOpacity, SafeAreaView, Modal } from 'react-native';
import { Screen } from '@/components/Screen';
import { useSafeRouter } from '@/hooks/useSafeRouter';

export default function EngraveScreen() {
  const router = useSafeRouter();

  return (
    <Screen>
      <SafeAreaView style={styles.container}>
        {/* Dialog */}
        <View style={styles.dialog}>
          <Text style={styles.dialogTitle}>请输入你想刻的字</Text>
          
          <TextInput
            style={styles.input}
            placeholder=""
            placeholderTextColor="#999999"
            multiline
          />
          
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={styles.cancelBtn}
              onPress={() => router.back()}
            >
              <Text style={styles.cancelText}>取消</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.confirmBtn}
              onPress={() => router.back()}
            >
              <Text style={styles.confirmText}>确定</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialog: {
    width: 280,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#000000',
    padding: 20,
  },
  dialogTitle: {
    fontSize: 14,
    color: '#000000',
    fontFamily: 'serif',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#000000',
    minHeight: 100,
    padding: 12,
    fontSize: 14,
    fontFamily: 'serif',
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
    gap: 16,
  },
  cancelBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#000000',
  },
  cancelText: {
    fontSize: 12,
    color: '#000000',
    fontFamily: 'serif',
  },
  confirmBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#000000',
  },
  confirmText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: 'serif',
  },
});
