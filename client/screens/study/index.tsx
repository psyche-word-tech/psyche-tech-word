import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Image, PanResponder, Modal, TextInput, Dimensions } from 'react-native';
import { Screen } from '@/components/Screen';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';

const iconMountain = require('@/assets/icon.png');
const iconRock = require('@/assets/rock.png');
const iconDang = require('@/assets/dang.png');

export default function StudyScreen() {
  const router = useSafeRouter();
  const params = useSafeSearchParams<{ engravedText?: string }>();
  const engravedText = params.engravedText || '';

  const screenWidth = Dimensions.get('window').width;

  // 购买词汇书卡片位置和大小
  const [dangPosition, setDangPosition] = useState({ x: 30, y: 150 });
  const [dangSize, setDangSize] = useState({ width: 300, height: 150 });

  // 编辑对话框状态
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [tempX, setTempX] = useState('30');
  const [tempY, setTempY] = useState('150');
  const [tempWidth, setTempWidth] = useState('300');
  const [tempHeight, setTempHeight] = useState('150');

  // 打开编辑对话框
  const openEditModal = () => {
    setTempX(String(dangPosition.x));
    setTempY(String(dangPosition.y));
    setTempWidth(String(dangSize.width));
    setTempHeight(String(dangSize.height));
    setEditModalVisible(true);
  };

  // 保存设置
  const saveSettings = () => {
    setDangPosition({
      x: parseInt(tempX) || 30,
      y: parseInt(tempY) || 150,
    });
    setDangSize({
      width: parseInt(tempWidth) || 300,
      height: parseInt(tempHeight) || 150,
    });
    setEditModalVisible(false);
  };

  return (
    <Screen>
      <SafeAreaView style={styles.container}>
        {/* Top Status Bar */}
        <View style={styles.statusBar} />

        {/* Cards Container */}
        <View style={styles.cardsContainer}>
          {/* Card 1 - Top Center */}
          <View style={styles.cardTopCenter}>
            <View style={styles.cardLargeWrapper}>
              <TouchableOpacity 
                style={styles.cardLarge} 
                activeOpacity={0.8} 
                onPress={() => router.push('/engrave')}
              >
                <Image source={iconRock} style={styles.cardIconLarge} resizeMode="cover" />
                {engravedText.length > 0 && (
                  <View style={styles.engravedContainer}>
                    <LinearGradient
                      colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.3)']}
                      style={styles.engravedGradient}
                    />
                    <View style={styles.engravedTextContainer}>
                      {engravedText.split('').map((char, index) => (
                        <View key={index} style={styles.engravedCharWrapper}>
                          <Text style={styles.engravedText}>{char}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            </View>
            <View style={styles.labelRight}>
              <View style={styles.redLine} />
              <Text style={styles.cardLabel}>刻字</Text>
            </View>
          </View>

          {/* Card 2 - Left Top */}
          <View style={[styles.cardLeftTop, { left: dangPosition.x, top: dangPosition.y, width: dangSize.width, height: dangSize.height }]}>
            <View style={styles.cardLargeWrapper}>
              <TouchableOpacity style={styles.cardLarge} activeOpacity={0.8} onPress={() => router.push('/vocabulary')}>
                <Image source={iconDang} style={styles.cardIconLarge} resizeMode="cover" />
              </TouchableOpacity>
            </View>
            <Text style={styles.cardLabelBelow}>购买词汇书</Text>
          </View>

          {/* Card 3 - Right Middle */}
          <View style={styles.cardRightMiddle}>
            <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={() => router.push('/my-vocabulary')}>
              <Image source={iconMountain} style={styles.cardIcon} resizeMode="contain" />
            </TouchableOpacity>
            <Text style={styles.cardLabelBelow}>我的词汇书</Text>
          </View>

          {/* Card 4 - Left Bottom */}
          <View style={styles.cardLeftBottom}>
            <TouchableOpacity style={styles.card} activeOpacity={0.8}>
              <Image source={iconMountain} style={styles.cardIcon} resizeMode="cover" />
            </TouchableOpacity>
            <View style={styles.labelRight}>
              <View style={styles.redLine} />
              <Text style={styles.cardLabel}>磨刀石</Text>
            </View>
          </View>

          {/* Card 5 - Center */}
          <View style={styles.cardCenter}>
            <TouchableOpacity style={styles.card} activeOpacity={0.8}>
              <Image source={iconMountain} style={styles.cardIcon} resizeMode="cover" />
            </TouchableOpacity>
          </View>

          {/* Card 6 - Bottom Center */}
          <View style={styles.cardBottomCenter}>
            <TouchableOpacity style={styles.card} activeOpacity={0.8}>
              <Image source={iconMountain} style={styles.cardIcon} resizeMode="cover" />
            </TouchableOpacity>
            <View style={styles.redLineVertical} />
          </View>
        </View>

        {/* 编辑按钮 */}
        <TouchableOpacity style={styles.editButton} onPress={openEditModal}>
          <Text style={styles.editButtonText}>编辑</Text>
        </TouchableOpacity>

        {/* 编辑对话框 */}
        <Modal
          visible={editModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setEditModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>调整卡片位置和大小</Text>

              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>X 位置:</Text>
                <TextInput
                  style={styles.input}
                  value={tempX}
                  onChangeText={setTempX}
                  keyboardType="numeric"
                  placeholder="0-375"
                />
              </View>

              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Y 位置:</Text>
                <TextInput
                  style={styles.input}
                  value={tempY}
                  onChangeText={setTempY}
                  keyboardType="numeric"
                  placeholder="100-600"
                />
              </View>

              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>宽度:</Text>
                <TextInput
                  style={styles.input}
                  value={tempWidth}
                  onChangeText={setTempWidth}
                  keyboardType="numeric"
                  placeholder="100-300"
                />
              </View>

              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>高度:</Text>
                <TextInput
                  style={styles.input}
                  value={tempHeight}
                  onChangeText={setTempHeight}
                  keyboardType="numeric"
                  placeholder="50-200"
                />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setEditModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>取消</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={saveSettings}
                >
                  <Text style={styles.saveButtonText}>保存</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  statusBar: {
    height: 40,
    backgroundColor: '#FFFFFF',
  },
  cardsContainer: {
    flex: 1,
    position: 'relative',
  },
  card: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardLargeWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  cardLarge: {
    width: 200,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 0,
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardIcon: {
    width: 50,
    height: 50,
  },
  cardIconLarge: {
    width: '80%',
    height: '80%',
  },
  engravedContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 发光外层（外发光）
  engravedGlow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  engravedText: {
    fontSize: 28,
    color: '#D4B896',
    fontFamily: 'serif',
    fontWeight: '600',
    textShadowColor: '#8B6914',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
    marginBottom: -8,
  },
  engravedCharWrapper: {
    marginRight: 12,
  },
  engravedTextContainer: {
    flexDirection: 'column',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    maxHeight: 180,
  },
  engravedGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cardTopCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  imageWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  cardLeftTop: {
    position: 'absolute',
    alignItems: 'flex-start',
  },
  cardRightMiddle: {
    position: 'absolute',
    top: 320,
    right: 30,
    alignItems: 'center',
  },
  cardLeftBottom: {
    position: 'absolute',
    top: 450,
    left: 30,
    alignItems: 'flex-start',
  },
  cardCenter: {
    position: 'absolute',
    top: 300,
    right: 80,
    alignItems: 'center',
  },
  cardBottomCenter: {
    position: 'absolute',
    bottom: 40,
    left: '50%',
    marginLeft: -40,
    alignItems: 'center',
  },
  labelRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  redLine: {
    width: 25,
    height: 2,
    backgroundColor: '#CC0000',
    marginRight: 4,
  },
  redLineVertical: {
    width: 2,
    height: 30,
    backgroundColor: '#CC0000',
    marginTop: 8,
  },
  cardLabel: {
    fontSize: 12,
    color: '#000000',
    fontFamily: 'serif',
  },
  cardLabelBelow: {
    fontSize: 12,
    color: '#000000',
    fontFamily: 'serif',
    marginTop: 8,
  },
  // 编辑按钮
  editButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: '#333',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    zIndex: 100,
  },
  editButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // 对话框
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 24,
    width: '85%',
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    width: 70,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#333',
    marginLeft: 10,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
});
