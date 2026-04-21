import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Image, Dimensions } from 'react-native';
import { Screen } from '@/components/Screen';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { LinearGradient } from 'expo-linear-gradient';

const iconMountain = require('@/assets/icon.png');
const iconRock = require('@/assets/rock.jpg');
const iconDang = require('@/assets/dang.png');
const iconMyVocab = require('@/assets/my-vocab.png');

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const GRID_SIZE = (SCREEN_WIDTH - 32) / 2; // 田字格边长，减去间距
const TOP_HEIGHT = SCREEN_HEIGHT / 2; // 上半部分高度（50%）
const BOTTOM_ITEM_HEIGHT = (SCREEN_HEIGHT / 2) / 2 - 4; // 下半部分每个格子高度

export default function StudyScreen() {
  const router = useSafeRouter();
  const params = useSafeSearchParams<{ engravedText?: string }>();
  const engravedText = params.engravedText || '';

  return (
    <Screen style={{ padding: 0 }}>
      <SafeAreaView style={styles.container}>
        {/* 上半部分：区域一（100% 宽，50% 高） */}
        <View style={styles.topSection}>
          <TouchableOpacity 
            style={styles.topCard} 
            activeOpacity={0.9} 
            onPress={() => router.push('/engrave')}
          >
            <Image source={iconRock} style={styles.topImage} resizeMode="cover" />
            {engravedText.length > 0 && (
              <View style={styles.engravedOverlay}>
                <LinearGradient
                  colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.4)']}
                  style={styles.engravedGradient}
                />
                <View style={styles.engravedTextContainer}>
                  {engravedText.split('').map((char, index) => (
                    <Text key={index} style={styles.engravedText}>{char}</Text>
                  ))}
                </View>
              </View>
            )}
            <View style={styles.topLabelContainer}>
              <Text style={styles.topLabel}>刻字</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 下半部分：2x2 田字格（区域二、三、四、五） */}
        <View style={styles.bottomSection}>
          {/* 上一行：区域二、区域三 */}
          <View style={styles.gridRow}>
            <TouchableOpacity 
              style={styles.gridItem} 
              activeOpacity={0.9} 
              onPress={() => router.push('/vocabulary')}
            >
              <Image source={iconDang} style={styles.gridImageFull} resizeMode="cover" />
              <View style={styles.gridLabelContainer}>
                <Text style={styles.gridLabel}>购买词汇书</Text>
              </View>
            </TouchableOpacity>
            <View style={styles.gridItem}>
              <View style={styles.emptyCard} />
            </View>
          </View>
          {/* 下一行：区域四、区域五 */}
          <View style={styles.gridRow}>
            <View style={styles.gridItem}>
              <View style={styles.emptyCard} />
            </View>
            <TouchableOpacity 
              style={styles.gridItem} 
              activeOpacity={0.9} 
              onPress={() => router.push('/my-vocabulary')}
            >
              <Image source={iconMyVocab} style={styles.gridImage} resizeMode="cover" />
              <View style={styles.gridLabelContainer}>
                <Text style={styles.gridLabel}>我的词汇书</Text>
              </View>
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
    backgroundColor: '#FFFFFF',
  },
  // 区域一：占满上半部分（100% 宽，50% 高）
  topSection: {
    height: TOP_HEIGHT,
    width: '100%',
    backgroundColor: '#FFFFFF',
    padding: 4,
  },
  topCard: {
    flex: 1,
    backgroundColor: '#E8E0D5',
  },
  topImage: {
    width: '100%',
    height: '100%',
  },
  topLabelContainer: {
    position: 'absolute',
    bottom: 12,
    left: 12,
  },
  topLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  // 下半部分：2x2 排列（区域二、三、四、五）
  bottomSection: {
    height: TOP_HEIGHT,
    width: '100%',
    padding: 4,
    paddingTop: 0,
  },
  gridRow: {
    flex: 1,
    flexDirection: 'row',
  },
  gridItem: {
    flex: 1,
    backgroundColor: '#E8E0D5',
    margin: 4,
  },
  // 布满整个区域的图片样式
  gridImageFull: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  emptyCard: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
  gridLabelContainer: {
    position: 'absolute',
    bottom: 8,
    left: 8,
  },
  gridLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  engravedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  engravedGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  engravedTextContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  engravedText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});
