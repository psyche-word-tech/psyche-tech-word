import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import { Screen } from '@/components/Screen';

const backgroundImg = require('@/assets/home-bg.jpg');

export default function HomeScreen() {
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
    height: '100%',
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
});
