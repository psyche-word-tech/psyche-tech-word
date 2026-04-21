import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Image, Dimensions } from 'react-native';
import { Screen } from '@/components/Screen';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { LinearGradient } from 'expo-linear-gradient';

const iconRock = require('@/assets/rock.jpg');
const iconDang = require('@/assets/dang.png');
const iconMyVocab = require('@/assets/my-vocab.png');

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HALF_HEIGHT = SCREEN_HEIGHT / 2; // 一半高度

export default function StudyScreen() {
  const router = useSafeRouter();
  const params = useSafeSearchParams<{ engravedText?: string }>();
  const engravedText = params.engravedText || '';

  return (
    <Screen safeAreaEdges={['left', 'right', 'bottom']}>
      <SafeAreaView style={styles.container}>
        {/* 上半部分：区域一（100% 宽，50% 高） */}
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
          <Text style={styles.topLabel}>刻字</Text>
        </TouchableOpacity>

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
              <Text style={styles.gridLabel}>购买词汇书</Text>
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
              <Image source={iconMyVocab} style={styles.gridImageFull} resizeMode="cover" />
              <Text style={styles.gridLabel}>我的词汇书</Text>
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
  },
  topCard: {
    height: HALF_HEIGHT,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topImage: {
    ...StyleSheet.absoluteFillObject,
  },
  topLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  // 下半部分：2x2 排列（区域二、三、四、五）
  bottomSection: {
    height: HALF_HEIGHT,
    width: '100%',
  },
  gridRow: {
    flex: 1,
    flexDirection: 'row',
  },
  gridItem: {
    flex: 1,
  },
  gridImageFull: {
    ...StyleSheet.absoluteFillObject,
  },
  gridLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  emptyCard: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
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
