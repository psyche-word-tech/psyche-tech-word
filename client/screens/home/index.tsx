import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Screen } from '@/components/Screen';
import { useSafeRouter } from '@/hooks/useSafeRouter';

const logo = require('@/assets/logo.png');
const backgroundImg = require('@/assets/home-bg.jpg');
const bookStoreImg = require('@/assets/book-store.png');
const booksStackImg = require('@/assets/books-stack.png');
const settingsIcon = require('@/assets/settings-icon.webp');

export default function HomeScreen() {
  const router = useSafeRouter();

  return (
    <Screen>
      <ScrollView style={styles.container} bounces={false}>
        {/* Top Background Image Area */}
        <View style={styles.topSection}>
          <Image 
            source={backgroundImg} 
            style={styles.backgroundImage}
            resizeMode="cover"
          />
          <View style={styles.imageOverlay}>
            <Text style={styles.imageLabel}>刻字</Text>
          </View>
        </View>

        {/* Book Store Section */}
        <TouchableOpacity 
          style={styles.bookStoreSection}
          activeOpacity={0.9}
          onPress={() => router.push('/purchase')}
        >
          <Image 
            source={bookStoreImg}
            style={styles.bookStoreImage}
            resizeMode="contain"
          />
          <View style={styles.bookStoreLabel}>
            <Text style={styles.bookStoreText}>购买词汇书</Text>
          </View>
        </TouchableOpacity>

        {/* Bottom Section - Two Cards */}
        <View style={styles.bottomSection}>
          {/* Left Card - Settings */}
          <TouchableOpacity 
            style={styles.leftCard}
            activeOpacity={0.8}
            onPress={() => router.push('/settings')}
          >
            <Image 
              source={settingsIcon}
              style={styles.settingsIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>

          {/* Right Card - My Vocabulary Books */}
          <TouchableOpacity 
            style={styles.rightCard}
            activeOpacity={0.8}
            onPress={() => router.push('/study')}
          >
            <Image 
              source={booksStackImg}
              style={styles.booksImage}
              resizeMode="contain"
            />
            <Text style={styles.myBooksText}>我的词汇书</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topSection: {
    height: 280,
    position: 'relative',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  imageLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'serif',
    fontWeight: '300',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  bookStoreSection: {
    marginTop: -30,
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  bookStoreImage: {
    width: '100%',
    height: 160,
  },
  bookStoreLabel: {
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  bookStoreText: {
    fontSize: 14,
    color: '#333333',
    fontFamily: 'serif',
  },
  bottomSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  leftCard: {
    flex: 1,
    height: 120,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  settingsIcon: {
    width: 40,
    height: 40,
  },
  rightCard: {
    flex: 1,
    height: 120,
    backgroundColor: '#1B4332',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  booksImage: {
    width: '80%',
    height: 70,
  },
  myBooksText: {
    fontSize: 12,
    color: '#FFFFFF',
    marginTop: 8,
    fontFamily: 'serif',
    letterSpacing: 1,
  },
});
