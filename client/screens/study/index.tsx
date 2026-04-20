import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import { Screen } from '@/components/Screen';
import { useSafeRouter } from '@/hooks/useSafeRouter';

const iconMountain = require('@/assets/icon.png');

export default function StudyScreen() {
  const router = useSafeRouter();

  return (
    <Screen>
      <SafeAreaView style={styles.container}>
        {/* Top Status Bar */}
        <View style={styles.statusBar}>
          <View style={styles.statusLeft}>
            <Text style={styles.statusText}>在线帮助</Text>
            <Text style={styles.statusText}>反馈问题</Text>
          </View>
          <View style={styles.statusRight}>
            <Text style={styles.statusIcon}>[ ]</Text>
            <Text style={styles.statusIcon}>==</Text>
          </View>
        </View>

        {/* Cards Grid */}
        <View style={styles.cardsContainer}>
          {/* Card 1 - Top Right */}
          <View style={styles.cardWrapper}>
            <TouchableOpacity 
              style={styles.card} 
              activeOpacity={0.8}
              onPress={() => router.push('/learn')}
            >
              <Image source={iconMountain} style={styles.cardIcon} resizeMode="contain" />
            </TouchableOpacity>
            <View style={styles.labelWrapper}>
              <View style={styles.redLine} />
              <Text style={styles.cardLabel}>刻字</Text>
            </View>
          </View>

          {/* Card 2 - Middle Left */}
          <View style={styles.cardWrapper}>
            <TouchableOpacity 
              style={styles.card} 
              activeOpacity={0.8}
              onPress={() => router.push('/notebook')}
            >
              <Image source={iconMountain} style={styles.cardIcon} resizeMode="contain" />
            </TouchableOpacity>
            <Text style={styles.cardLabelBottom}>我的词汇书</Text>
          </View>

          {/* Card 3 - Middle Right */}
          <View style={styles.cardWrapper}>
            <TouchableOpacity 
              style={styles.card} 
              activeOpacity={0.8}
            >
              <Image source={iconMountain} style={styles.cardIcon} resizeMode="contain" />
            </TouchableOpacity>
            <View style={styles.labelWrapper}>
              <View style={styles.redLine} />
              <Text style={styles.cardLabel}>书店</Text>
            </View>
          </View>

          {/* Card 4 - Bottom Left */}
          <View style={styles.cardWrapper}>
            <TouchableOpacity 
              style={styles.card} 
              activeOpacity={0.8}
            >
              <Image source={iconMountain} style={styles.cardIcon} resizeMode="contain" />
            </TouchableOpacity>
            <View style={styles.labelWrapper}>
              <View style={styles.redLine} />
              <Text style={styles.cardLabel}>磨刀石</Text>
            </View>
          </View>

          {/* Card 5 - Top Left */}
          <View style={styles.cardWrapper}>
            <TouchableOpacity 
              style={styles.card} 
              activeOpacity={0.8}
            >
              <Image source={iconMountain} style={styles.cardIcon} resizeMode="contain" />
            </TouchableOpacity>
          </View>

          {/* Card 6 - Bottom Center */}
          <View style={styles.cardWrapper}>
            <TouchableOpacity 
              style={styles.card} 
              activeOpacity={0.8}
            >
              <Image source={iconMountain} style={styles.cardIcon} resizeMode="contain" />
            </TouchableOpacity>
            <View style={[styles.labelWrapper, styles.bottomLabel]}>
              <View style={[styles.redLine, styles.bottomRedLine]} />
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
    backgroundColor: '#0A0A0A',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1A1A1A',
  },
  statusLeft: {
    alignItems: 'flex-start',
  },
  statusRight: {
    flexDirection: 'row',
    gap: 16,
  },
  statusText: {
    fontSize: 10,
    color: '#666666',
    fontFamily: 'serif',
  },
  statusIcon: {
    fontSize: 14,
    color: '#666666',
  },
  cardsContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingVertical: 30,
    position: 'relative',
  },
  cardWrapper: {
    width: '33.33%',
    alignItems: 'center',
    marginBottom: 40,
  },
  card: {
    width: 80,
    height: 80,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardIcon: {
    width: 50,
    height: 50,
    tintColor: '#FFFFFF',
  },
  cardLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: 'serif',
    marginTop: 4,
  },
  cardLabelBottom: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: 'serif',
    marginTop: 8,
  },
  labelWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  redLine: {
    width: 20,
    height: 2,
    backgroundColor: '#CC0000',
    marginRight: 4,
  },
  bottomLabel: {
    marginTop: 8,
  },
  bottomRedLine: {
    width: 30,
  },
});
