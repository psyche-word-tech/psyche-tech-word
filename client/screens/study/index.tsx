import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Image, Dimensions } from 'react-native';
import { Screen } from '@/components/Screen';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { LinearGradient } from 'expo-linear-gradient';

const iconMountain = require('@/assets/icon.png');
const iconRock = require('@/assets/rock.jpg');
const iconDang = require('@/assets/dang.png');
const iconMyVocab = require('@/assets/my-vocab.png');

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_SIZE = (SCREEN_WIDTH - 48) / 2; // 2列网格，每格正方形，间距16

export default function StudyScreen() {
  const router = useSafeRouter();
  const params = useSafeSearchParams<{ engravedText?: string }>();
  const engravedText = params.engravedText || '';

  return (
    <Screen>
      <SafeAreaView style={styles.container}>
        {/* Top Status Bar */}
        <View style={styles.statusBar} />

        {/* 2x2 Grid Container */}
        <View style={styles.gridContainer}>
          {/* 左上 - 购买词汇书（悬崖图） */}
          <View style={styles.gridItem}>
            <TouchableOpacity 
              style={styles.gridCard} 
              activeOpacity={0.8} 
              onPress={() => router.push('/vocabulary')}
            >
              <Image source={iconDang} style={styles.gridImage} resizeMode="cover" />
            </TouchableOpacity>
            <Text style={styles.gridLabel}>购买词汇书</Text>
          </View>

          {/* 右上 - 空白 */}
          <View style={styles.gridItem}>
            <View style={styles.emptyCard} />
          </View>

          {/* 左下 - 我的词汇书（书房图） */}
          <View style={styles.gridItem}>
            <TouchableOpacity 
              style={styles.gridCard} 
              activeOpacity={0.8} 
              onPress={() => router.push('/my-vocabulary')}
            >
              <Image source={iconMyVocab} style={styles.gridImage} resizeMode="cover" />
            </TouchableOpacity>
            <Text style={styles.gridLabel}>我的词汇书</Text>
          </View>

          {/* 右下 - 古风桌案图（磨刀石/刻字） */}
          <View style={styles.gridItem}>
            <TouchableOpacity 
              style={styles.gridCard} 
              activeOpacity={0.8} 
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
            </TouchableOpacity>
            <Text style={styles.gridLabel}>刻字</Text>
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
  statusBar: {
    height: 40,
    backgroundColor: '#FFFFFF',
  },
  gridContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
  },
  gridItem: {
    width: `${50}%`,
    aspectRatio: 1,
    padding: 8,
    alignItems: 'center',
  },
  gridCard: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#E8E0D5',
    shadowColor: '#8B7355',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  emptyCard: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E0D5',
  },
  gridLabel: {
    marginTop: 8,
    fontSize: 14,
    color: '#5C4033',
    fontWeight: '500',
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
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});
