import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Image, Dimensions } from 'react-native';
import { Screen } from '@/components/Screen';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { LinearGradient } from 'expo-linear-gradient';

const iconMountain = require('@/assets/icon.png');
const iconRock = require('@/assets/rock.jpg');
const iconDang = require('@/assets/dang.png');
const iconMyVocab = require('@/assets/my-vocab.png');

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SQUARE_SIZE = SCREEN_WIDTH / 2; // 正方形边长 = 屏幕宽度的一半
const TOP_HEIGHT = SCREEN_HEIGHT - SQUARE_SIZE; // 上面部分高度

export default function StudyScreen() {
  const router = useSafeRouter();
  const params = useSafeSearchParams<{ engravedText?: string }>();
  const engravedText = params.engravedText || '';

  return (
    <Screen style={{ padding: 0 }}>
      <SafeAreaView style={styles.container}>
        {/* 上面部分：购买词汇书 + 我的词汇书（左右各半） */}
        <View style={styles.topSection}>
          {/* 左：购买词汇书 */}
          <TouchableOpacity 
            style={styles.topLeftCard} 
            activeOpacity={0.9} 
            onPress={() => router.push('/vocabulary')}
          >
            <Image source={iconDang} style={styles.topImage} resizeMode="cover" />
            <View style={styles.topLabelContainer}>
              <Text style={styles.topLabel}>购买词汇书</Text>
            </View>
          </TouchableOpacity>

          {/* 右：我的词汇书 */}
          <TouchableOpacity 
            style={styles.topRightCard} 
            activeOpacity={0.9} 
            onPress={() => router.push('/my-vocabulary')}
          >
            <Image source={iconMyVocab} style={styles.topImage} resizeMode="cover" />
            <View style={styles.topLabelContainer}>
              <Text style={styles.topLabel}>我的词汇书</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 下面部分：正方形田字格（2x2） */}
        <View style={styles.bottomSection}>
          {/* 上一行 */}
          <View style={styles.gridRow}>
            <TouchableOpacity 
              style={styles.gridItem} 
              activeOpacity={0.9} 
              onPress={() => router.push('/engrave')}
            >
              <Image source={iconRock} style={styles.gridImage} resizeMode="cover" />
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
              <View style={styles.gridLabelContainer}>
                <Text style={styles.gridLabel}>刻字</Text>
              </View>
            </TouchableOpacity>
            <View style={styles.gridItem}>
              <View style={styles.emptyCard} />
            </View>
          </View>
          {/* 下一行 */}
          <View style={styles.gridRow}>
            <View style={styles.gridItem}>
              <View style={styles.emptyCard} />
            </View>
            <View style={styles.gridItem}>
              <View style={styles.emptyCard} />
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
    backgroundColor: '#FFFFFF',
  },
  topSection: {
    flex: 1,
    flexDirection: 'row',
  },
  topLeftCard: {
    flex: 1,
    backgroundColor: '#E8E0D5',
  },
  topRightCard: {
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
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  bottomSection: {
    width: SQUARE_SIZE,
    height: SQUARE_SIZE,
  },
  gridRow: {
    flex: 1,
    flexDirection: 'row',
  },
  gridItem: {
    flex: 1,
    backgroundColor: '#E8E0D5',
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
  squareCard: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E8E0D5',
  },
  squareImage: {
    width: '100%',
    height: '100%',
  },
  squareLabelContainer: {
    position: 'absolute',
    bottom: 12,
    left: 12,
  },
  squareLabel: {
    fontSize: 14,
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
