import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

interface AnimatedSplashProps {
  onAnimationComplete?: () => void;
}

export default function AnimatedSplash({ onAnimationComplete }: AnimatedSplashProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => { /* ignore */ });

    const timer = setTimeout(() => {
      setVisible(false);
      onAnimationComplete?.();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        {/* Top-left parallelogram */}
        <View style={[styles.block, { top: 7.5, left: 32.6 }]}>
          <View style={[styles.parallelogram, styles.topLeftShape]} />
        </View>

        {/* Top-right parallelogram */}
        <View style={[styles.block, { top: 7.5, right: 32.6 }]}>
          <View style={[styles.parallelogram, styles.topRightShape]} />
        </View>

        {/* Bottom-left parallelogram */}
        <View style={[styles.block, { bottom: 25, left: 65 }]}>
          <View style={[styles.parallelogram, styles.bottomLeftShape]} />
        </View>

        {/* Bottom-right parallelogram */}
        <View style={[styles.block, { bottom: 25, right: 233.8 }]}>
          <View style={[styles.parallelogram, styles.bottomRightShape]} />
        </View>

        {/* Center dot */}
        <View style={styles.centerDot} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
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
  },
});
