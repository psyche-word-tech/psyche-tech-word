import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Screen } from '@/components/Screen';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';

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
    <Screen safeAreaEdges={[]}>
      <View style={styles.container}>
        {/* 上半部分：区域一（100% 宽，50% 高） */}
        <TouchableOpacity 
          style={styles.topCard} 
          activeOpacity={0.9} 
          onPress={() => router.push('/engrave')}
        >
          <Image source={iconRock} style={styles.topImage} resizeMode="stretch" />
          {engravedText.length > 0 && (
            <View style={styles.engravedTextContainer}>
              {engravedText.split('').map((char, index) => (
                <View key={index} style={styles.engravedCharWrapper}>
                  <Text style={styles.engravedText}>{char}</Text>
                  <Text style={styles.engravedTextHighlight}>{char}</Text>
                </View>
              ))}
            </View>
          )}
          {engravedText.length === 0 && (
            <Text style={styles.topLabel}>刻字</Text>
          )}
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
              <Image source={iconDang} style={styles.gridImageFull} resizeMode="stretch" />
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
              <Image source={iconMyVocab} style={styles.gridImageFull} resizeMode="stretch" />
              <Text style={styles.gridLabel}>我的词汇书</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
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
  engravedTextContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  engravedCharWrapper: {
    position: 'relative',
    marginVertical: 4,
  },
  // 刻字主体 - 深色凿刻效果
  engravedText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A0F08',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  // 高光层 - 模拟光照
  engravedTextHighlight: {
    position: 'absolute',
    top: -1,
    left: -1,
    fontSize: 32,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.3)',
  },
});
