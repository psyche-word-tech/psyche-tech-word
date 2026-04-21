import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Image, Dimensions } from 'react-native';
import { Screen } from '@/components/Screen';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { LinearGradient } from 'expo-linear-gradient';

const iconMountain = require('@/assets/icon.png');
const iconRock = require('@/assets/rock.jpg');
const iconDang = require('@/assets/dang.png');
const iconMyVocab = require('@/assets/my-vocab.png');

export default function StudyScreen() {
  const router = useSafeRouter();
  const params = useSafeSearchParams<{ engravedText?: string }>();
  const engravedText = params.engravedText || '';

  return (
    <Screen>
      <SafeAreaView style={styles.container}>
        {/* Top Status Bar */}
        <View style={styles.statusBar} />

        {/* 上半部分：占屏幕 1/3，刻字（100% 宽，2:1 比例） */}
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

        {/* 下半部分：占屏幕 2/3，2x2 网格 */}
        <View style={styles.bottomSection}>
          {/* 左上：购买词汇书 */}
          <TouchableOpacity 
            style={styles.gridItem} 
            activeOpacity={0.9} 
            onPress={() => router.push('/vocabulary')}
          >
            <Image source={iconDang} style={styles.gridImage} resizeMode="cover" />
            <View style={styles.gridLabelContainer}>
              <Text style={styles.gridLabel}>购买词汇书</Text>
            </View>
          </TouchableOpacity>

          {/* 右上：空白 */}
          <View style={styles.gridItem}>
            <View style={styles.emptyCard} />
          </View>

          {/* 左下：空白 */}
          <View style={styles.gridItem}>
            <View style={styles.emptyCard} />
          </View>

          {/* 右下：我的词汇书 */}
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
      </SafeAreaView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  statusBar: {
    height: 40,
    backgroundColor: '#FFFFFF',
  },
  topSection: {
    width: '100%',
    height: '33.33%', // 占屏幕 1/3
  },
  topCard: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E8E0D5',
  },
  topImage: {
    width: '100%',
    height: '100%',
  },
  topLabelContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
  },
  topLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  bottomSection: {
    width: '100%',
    height: '66.67%', // 占屏幕 2/3
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridItem: {
    width: '50%',
    height: '50%',
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
    bottom: 12,
    left: 12,
  },
  gridLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  bottomLeftCard: {
    flex: 1,
    backgroundColor: '#E8E0D5',
  },
  bottomRightCard: {
    flex: 1,
    backgroundColor: '#E8E0D5',
  },
  bottomImage: {
    width: '100%',
    height: '100%',
  },
  bottomLabelContainer: {
    position: 'absolute',
    bottom: 12,
    left: 12,
  },
  bottomLabel: {
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
