import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';

const iconRock = require('@/assets/rock.jpg');
const iconDang = require('@/assets/iconDang.png');
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
              {engravedText.split(' ').map((word, wordIndex) => (
                <View key={wordIndex} style={styles.engravedWordColumn}>
                  {word.split('').map((char, charIndex) => (
                    <View key={charIndex} style={styles.engravedCharWrapper}>
                      <Text style={styles.engravedText}>{char}</Text>
                      <Text style={styles.engravedTextHighlight}>{char}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          )}
          {engravedText.length === 0 && (
            <View style={styles.labelContainer}>
              <Text style={styles.topLabel}>刻字</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* 下半部分：购买词汇书大图 + 我的词汇书 + 齿轮 */}
        <View style={styles.bottomSection}>
          {/* 购买词汇书 - 占据整个下半区域，右下角与我的词汇书左上角接触 */}
          <TouchableOpacity 
            style={styles.dangLargeContainer} 
            activeOpacity={0.9} 
            onPress={() => router.push('/vocabulary')}
          >
            <Image source={iconDang} style={styles.dangLargeImage} resizeMode="stretch" />
            <View style={styles.labelContainer}>
              <Text style={styles.gridLabel}>购买词汇书</Text>
            </View>
          </TouchableOpacity>
          
          {/* 我的词汇书 - 覆盖在右下角 */}
          <TouchableOpacity 
            style={styles.myVocabOverlay} 
            activeOpacity={0.9} 
            onPress={() => router.push('/my-vocabulary')}
          >
            <Image source={iconMyVocab} style={styles.gridImageFull} resizeMode="stretch" />
            <View style={styles.labelContainer}>
              <Text style={styles.gridLabel}>我的词汇书</Text>
            </View>
          </TouchableOpacity>
          
          {/* 齿轮 - 覆盖在左下角 */}
          <TouchableOpacity 
            style={styles.gearOverlay}
            activeOpacity={0.9}
            onPress={() => router.push('/login')}
          >
            <Ionicons name="settings-outline" size={48} color="#666666" />
          </TouchableOpacity>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // 文字在区域下方居中
  labelContainer: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
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
  // 下半部分：购买词汇书大图布局
  bottomSection: {
    height: HALF_HEIGHT,
    width: '100%',
    position: 'relative',
  },
  // 购买词汇书大图 - 覆盖整个下半区域
  dangLargeContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  dangLargeImage: {
    width: '100%',
    height: '100%',
  },
  // 我的词汇书覆盖层 - 右下角
  myVocabOverlay: {
    position: 'absolute',
    top: 0,
    left: '50%',
    width: '50%',
    height: '50%',
    zIndex: 2,
  },
  // 齿轮覆盖层 - 左下角
  gearOverlay: {
    position: 'absolute',
    top: '50%',
    left: 0,
    width: '50%',
    height: '50%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    zIndex: 2,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  engravedTextContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  engravedWordColumn: {
    flexDirection: 'column',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  engravedCharWrapper: {
    position: 'relative',
  },
  // 刻字主体
  engravedText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  // 高光层
  engravedTextHighlight: {
    position: 'absolute',
    top: -0.5,
    left: -0.5,
    fontSize: 20,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.9)',
  },
});
