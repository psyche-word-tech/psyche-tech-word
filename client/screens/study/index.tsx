import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import { Screen } from '@/components/Screen';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { LinearGradient } from 'expo-linear-gradient';

const iconMountain = require('@/assets/icon.png');
const iconRock = require('@/assets/rock.png');
const iconDang = require('@/assets/dang.png');

export default function StudyScreen() {
  const router = useSafeRouter();
  const params = useSafeSearchParams<{ engravedText?: string }>();
  const engravedText = params.engravedText || '';

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
          <View style={styles.cardLeftTop}>
            <TouchableOpacity style={styles.cardMediumLeft} activeOpacity={0.8} onPress={() => router.push('/vocabulary')}>
              <Image source={iconDang} style={styles.cardIconMedium} resizeMode="cover" />
            </TouchableOpacity>
            <Text style={styles.cardLabelBelow}>购买词汇书</Text>
          </View>

          {/* Card 3 - Right Middle */}
          <View style={styles.cardRightMiddle}>
            <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={() => router.push('/my-vocabulary')}>
            </TouchableOpacity>
            <Text style={styles.cardLabelBelow}>我的词汇书</Text>
          </View>

          {/* Card 4 - Left Bottom */}
          <View style={styles.cardLeftBottom}>
            <TouchableOpacity style={styles.card} activeOpacity={0.8}>
            </TouchableOpacity>
            <View style={styles.labelRight}>
              <View style={styles.redLine} />
              <Text style={styles.cardLabel}>磨刀石</Text>
            </View>
          </View>

          {/* Card 5 - Center */}
          <View style={styles.cardCenter}>
            <TouchableOpacity style={styles.card} activeOpacity={0.8}>
            </TouchableOpacity>
          </View>

          {/* Card 6 - Bottom Center */}
          <View style={styles.cardBottomCenter}>
            <TouchableOpacity style={styles.card} activeOpacity={0.8}>
            </TouchableOpacity>
            <View style={styles.redLineVertical} />
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
    width: '100%',
    height: 150,
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
    width: '100%',
    height: '100%',
  },
  cardMedium: {
    width: '50%',
    height: 75,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#8B7355',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  cardMediumLeft: {
    width: '50%',
    height: 75,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#8B7355',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    alignSelf: 'flex-start',
  },
  cardIconMedium: {
    width: '100%',
    height: '100%',
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
    top: 220,
    left: 30,
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
    alignSelf: 'flex-start',
  },
});
