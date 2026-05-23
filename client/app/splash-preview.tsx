import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';

export default function SplashPreview() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Splash Logo */}
      <View style={styles.logoContainer}>
        <View style={[styles.block, { top: 7.5, left: 32.6 }]}>
          <View style={[styles.parallelogram, styles.topLeftShape]} />
        </View>
        <View style={[styles.block, { top: 7.5, right: 32.6 }]}>
          <View style={[styles.parallelogram, styles.topRightShape]} />
        </View>
        <View style={[styles.block, { bottom: 25, left: 65 }]}>
          <View style={[styles.parallelogram, styles.bottomLeftShape]} />
        </View>
        <View style={[styles.block, { bottom: 25, right: 233.8 }]}>
          <View style={[styles.parallelogram, styles.bottomRightShape]} />
        </View>
        <View style={styles.centerDot} />
      </View>

      {/* Back Button */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backText}>← 返回</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: 300,
    height: 190,
    position: 'relative',
  },
  block: {
    position: 'absolute',
  },
  parallelogram: {
    backgroundColor: '#000000',
  },
  topLeftShape: {
    width: 85,
    height: 75,
    transform: [{ skewX: '28deg' }],
  },
  topRightShape: {
    width: 85,
    height: 75,
    transform: [{ skewX: '-28deg' }],
  },
  bottomLeftShape: {
    width: 59,
    height: 52,
    transform: [{ skewX: '-28deg' }],
  },
  bottomRightShape: {
    width: 59,
    height: 52,
    transform: [{ skewX: '28deg' }],
  },
  centerDot: {
    position: 'absolute',
    left: 137,
    top: 82,
    width: 25,
    height: 25,
    backgroundColor: '#000000',
    borderRadius: 12.5,
  },
  backButton: {
    position: 'absolute',
    bottom: 50,
    padding: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  backText: {
    fontSize: 16,
    color: '#333',
  },
});
