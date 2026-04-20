import { View, Text, TextInput, StyleSheet, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import { Screen } from '@/components/Screen';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { useState } from 'react';

const iconRock = require('@/assets/rock.png');

export default function EngraveScreen() {
  const router = useSafeRouter();
  const [text, setText] = useState('');

  return (
    <Screen>
      <SafeAreaView style={styles.container}>
        {/* Top Image */}
        <Image source={iconRock} style={styles.topImage} resizeMode="cover" />

        {/* Content */}
        <View style={styles.content}>
          {/* Dialog */}
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>请输入你想刻的字</Text>
            
            <TextInput
              style={styles.input}
              placeholder=""
              placeholderTextColor="#999999"
              value={text}
              onChangeText={setText}
              multiline
            />
            
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={styles.undoBtn}
                onPress={() => setText('')}
              >
                <Text style={styles.undoText}>撤销</Text>
              </TouchableOpacity>
              
              <View style={styles.buttonSpacer} />
              
              <TouchableOpacity 
                style={styles.cancelBtn}
                onPress={() => router.back()}
              >
                <Text style={styles.cancelText}>取消</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.confirmBtn}
                onPress={() => {
                  if (text.trim()) {
                    router.replace('/study', { engravedText: text.trim() });
                  } else {
                    router.back();
                  }
                }}
              >
                <Text style={styles.confirmText}>确定</Text>
              </TouchableOpacity>
            </View>
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
  },
  topImage: {
    width: '100%',
    height: 150,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  dialog: {
    width: '100%',
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
    gap: 6,
  },
  buttonSpacer: {
    flex: 1,
  },
  undoBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#000000',
  },
  undoText: {
    fontSize: 10,
    color: '#000000',
    fontFamily: 'serif',
  },
  cancelBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#000000',
  },
  cancelText: {
    fontSize: 10,
    color: '#000000',
    fontFamily: 'serif',
  },
  confirmBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#000000',
  },
  confirmText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: 'serif',
  },
});
