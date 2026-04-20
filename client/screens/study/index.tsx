import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Image, TextInput, Dimensions } from 'react-native';
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
  const [dangSize, setDangSize] = useState({ width: 200, height: 100 });

  return (
    <Screen>
      <View style={styles.mainContainer}>
        {/* 左侧预览区域 */}
        <View style={styles.previewContainer}>
          {/* 背景 */}
          <View style={styles.backgroundContainer}>
            <Image source={iconRock} style={styles.backgroundImage} resizeMode="cover" />
            <LinearGradient
              colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0)']}
              style={styles.gradient}
            />
          </View>

          {/* 刻字 */}
          <View style={styles.engraveContainer}>
            <Text style={styles.engraveText} numberOfLines={3}>{engravedText}</Text>
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

        {/* 右侧编辑面板 */}
        <View style={styles.editorContainer}>
          <Text style={styles.editorTitle}>编辑面板</Text>
          <Text style={styles.editorSubtitle}>购买词汇书</Text>

          <View style={styles.sliderSection}>
            <Text style={styles.sliderLabel}>X 位置</Text>
            <View style={styles.sliderRow}>
              <Text style={styles.sliderMin}>0</Text>
              <TextInput
                style={styles.sliderInput}
                value={String(dangPosition.x)}
                onChangeText={(text) => {
                  const val = parseInt(text) || 0;
                  setDangPosition(prev => ({ ...prev, x: val }));
                }}
                keyboardType="numeric"
              />
              <Text style={styles.sliderMax}>{Math.round(screenWidth * 0.6 - dangSize.width)}</Text>
            </View>
          </View>

          <View style={styles.sliderSection}>
            <Text style={styles.sliderLabel}>Y 位置</Text>
            <View style={styles.sliderRow}>
              <Text style={styles.sliderMin}>0</Text>
              <TextInput
                style={styles.sliderInput}
                value={String(dangPosition.y)}
                onChangeText={(text) => {
                  const val = parseInt(text) || 0;
                  setDangPosition(prev => ({ ...prev, y: val }));
                }}
                keyboardType="numeric"
              />
              <Text style={styles.sliderMax}>600</Text>
            </View>
          </View>

          <View style={styles.sliderSection}>
            <Text style={styles.sliderLabel}>宽度</Text>
            <View style={styles.sliderRow}>
              <Text style={styles.sliderMin}>50</Text>
              <TextInput
                style={styles.sliderInput}
                value={String(dangSize.width)}
                onChangeText={(text) => {
                  const val = parseInt(text) || 100;
                  setDangSize(prev => ({ ...prev, width: val }));
                }}
                keyboardType="numeric"
              />
              <Text style={styles.sliderMax}>400</Text>
            </View>
          </View>

          <View style={styles.sliderSection}>
            <Text style={styles.sliderLabel}>高度</Text>
            <View style={styles.sliderRow}>
              <Text style={styles.sliderMin}>30</Text>
              <TextInput
                style={styles.sliderInput}
                value={String(dangSize.height)}
                onChangeText={(text) => {
                  const val = parseInt(text) || 50;
                  setDangSize(prev => ({ ...prev, height: val }));
                }}
                keyboardType="numeric"
              />
              <Text style={styles.sliderMax}>300</Text>
            </View>
          </View>

          <View style={styles.valueDisplay}>
            <Text style={styles.valueText}>当前值: X={dangPosition.x}, Y={dangPosition.y}</Text>
            <Text style={styles.valueText}>尺寸: {dangSize.width} x {dangSize.height}</Text>
          </View>

          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => router.back()}
          >
            <Text style={styles.doneButtonText}>完成</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  previewContainer: {
    flex: 1.2,
    position: 'relative',
  },
  editorContainer: {
    flex: 0.8,
    backgroundColor: '#F5F5F5',
    padding: 20,
    paddingTop: 60,
  },
  backgroundContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  engraveContainer: {
    position: 'absolute',
    top: 40,
    left: 30,
  },
  engraveText: {
    fontSize: 20,
    fontFamily: 'serif',
    writingDirection: 'ltr',
    color: '#000000',
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  cardLeftTop: {
    position: 'absolute',
    alignItems: 'center',
  },
  cardLargeWrapper: {
    overflow: 'hidden',
    borderRadius: 12,
  },
  cardLarge: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 0,
  },
  cardIconLarge: {
    width: '100%',
    height: '100%',
  },
  cardLabelBelow: {
    fontSize: 12,
    color: '#000000',
    fontFamily: 'serif',
    marginTop: 8,
    textAlign: 'center',
  },
  cardRightMiddle: {
    position: 'absolute',
    top: 160,
    right: 30,
    alignItems: 'center',
  },
  card: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
  },
  cardIcon: {
    width: '100%',
    height: '100%',
  },
  cardLeftBottom: {
    position: 'absolute',
    top: 300,
    left: 30,
    alignItems: 'flex-start',
  },
  labelRight: {
    alignItems: 'flex-start',
    marginTop: 8,
  },
  redLine: {
    width: 60,
    height: 2,
    backgroundColor: '#CC0000',
    marginBottom: 4,
  },
  cardLabel: {
    fontSize: 12,
    color: '#000000',
    fontFamily: 'serif',
  },
  cardCenter: {
    position: 'absolute',
    top: 300,
    right: 30,
    alignItems: 'center',
  },
  cardBottomCenter: {
    position: 'absolute',
    bottom: 50,
    left: '50%',
    marginLeft: -40,
    alignItems: 'center',
  },
  redLineVertical: {
    width: 2,
    height: 40,
    backgroundColor: '#CC0000',
    marginTop: 4,
  },
  // 编辑面板样式
  editorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  editorSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  sliderSection: {
    marginBottom: 20,
  },
  sliderLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sliderMin: {
    fontSize: 12,
    color: '#999',
    width: 30,
  },
  sliderMax: {
    fontSize: 12,
    color: '#999',
    width: 40,
    textAlign: 'right',
  },
  sliderInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginHorizontal: 10,
    fontSize: 16,
    textAlign: 'center',
  },
  valueDisplay: {
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
    marginBottom: 20,
  },
  valueText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  doneButton: {
    backgroundColor: '#333',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 'auto',
  },
  doneButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
