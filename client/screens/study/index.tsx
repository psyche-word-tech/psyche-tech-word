import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import { Screen } from '@/components/Screen';
import { useSafeRouter } from '@/hooks/useSafeRouter';

const iconMountain = require('@/assets/icon.png');
const iconRock = require('@/assets/rock.png');

export default function StudyScreen() {
  const router = useSafeRouter();

  return (
    <Screen>
      <SafeAreaView style={styles.container}>
        {/* Top Status Bar */}
        <View style={styles.statusBar} />

        {/* Cards Container */}
        <View style={styles.cardsContainer}>
          {/* Card 1 - Top Center */}
          <View style={styles.cardTopCenter}>
            <TouchableOpacity style={styles.cardLarge} activeOpacity={0.8}>
              <Image source={iconRock} style={styles.cardIconLarge} resizeMode="contain" />
            </TouchableOpacity>
            <View style={styles.labelRight}>
              <View style={styles.redLine} />
              <Text style={styles.cardLabel}>刻字</Text>
            </View>
          </View>

          {/* Card 2 - Left Top */}
          <View style={styles.cardLeftTop}>
            <TouchableOpacity style={styles.card} activeOpacity={0.8}>
              <Image source={iconMountain} style={styles.cardIcon} resizeMode="contain" />
            </TouchableOpacity>
            <Text style={styles.cardLabelBelow}>我的词汇书</Text>
          </View>

          {/* Card 3 - Right Middle */}
          <View style={styles.cardRightMiddle}>
            <TouchableOpacity style={styles.card} activeOpacity={0.8}>
              <Image source={iconMountain} style={styles.cardIcon} resizeMode="contain" />
            </TouchableOpacity>
            <Text style={styles.cardLabelBelow}>书店</Text>
          </View>

          {/* Card 4 - Left Bottom */}
          <View style={styles.cardLeftBottom}>
            <TouchableOpacity style={styles.card} activeOpacity={0.8}>
              <Image source={iconMountain} style={styles.cardIcon} resizeMode="contain" />
            </TouchableOpacity>
            <View style={styles.labelRight}>
              <View style={styles.redLine} />
              <Text style={styles.cardLabel}>磨刀石</Text>
            </View>
          </View>

          {/* Card 5 - Center */}
          <View style={styles.cardCenter}>
            <TouchableOpacity style={styles.card} activeOpacity={0.8}>
              <Image source={iconMountain} style={styles.cardIcon} resizeMode="contain" />
            </TouchableOpacity>
          </View>

          {/* Card 6 - Bottom Center */}
          <View style={styles.cardBottomCenter}>
            <TouchableOpacity style={styles.card} activeOpacity={0.8}>
              <Image source={iconMountain} style={styles.cardIcon} resizeMode="contain" />
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
  cardLarge: {
    width: '100%',
    height: 180,
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
  cardTopCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  cardLeftTop: {
    position: 'absolute',
    top: 160,
    left: 30,
    alignItems: 'flex-start',
  },
  cardRightMiddle: {
    position: 'absolute',
    top: 160,
    right: 30,
    alignItems: 'center',
  },
  cardLeftBottom: {
    position: 'absolute',
    top: 300,
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
});
