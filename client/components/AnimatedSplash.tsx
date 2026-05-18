import React, { useEffect, useMemo, useState } from 'react';
import { Animated, View, StyleSheet, Dimensions } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

const { width, height } = Dimensions.get('window');

interface AnimatedSplashProps {
  onAnimationComplete?: () => void;
}

export default function AnimatedSplash({ onAnimationComplete }: AnimatedSplashProps) {
  const [visible, setVisible] = useState(true);

  // Use useMemo to create Animated.Value instances only once
  const fadeAnim = useMemo(() => new Animated.Value(1), []);

  // Four block positions
  const topLeftX = useMemo(() => new Animated.Value(-width * 0.6), []);
  const topLeftY = useMemo(() => new Animated.Value(-height * 0.6), []);
  const topRightX = useMemo(() => new Animated.Value(width * 0.6), []);
  const topRightY = useMemo(() => new Animated.Value(-height * 0.6), []);
  const bottomLeftX = useMemo(() => new Animated.Value(-width * 0.6), []);
  const bottomLeftY = useMemo(() => new Animated.Value(height * 0.6), []);
  const bottomRightX = useMemo(() => new Animated.Value(width * 0.6), []);
  const bottomRightY = useMemo(() => new Animated.Value(height * 0.6), []);

  // Scale animation for subtle "snap" effect when arriving
  const scale1 = useMemo(() => new Animated.Value(0.5), []);
  const scale2 = useMemo(() => new Animated.Value(0.5), []);
  const scale3 = useMemo(() => new Animated.Value(0.5), []);
  const scale4 = useMemo(() => new Animated.Value(0.5), []);

  useEffect(() => {
    // Hide native splash screen first
    SplashScreen.hideAsync().catch(() => { /* ignore */ });

    const animateBlock = (
      animX: Animated.Value,
      animY: Animated.Value,
      animScale: Animated.Value,
      delay: number
    ) => {
      return Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(animX, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(animY, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(animScale, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ]);
    };

    // Start animations: top-left, top-right, bottom-left, bottom-right
    Animated.parallel([
      animateBlock(topLeftX, topLeftY, scale1, 0),
      animateBlock(topRightX, topRightY, scale2, 200),
      animateBlock(bottomLeftX, bottomLeftY, scale3, 400),
      animateBlock(bottomRightX, bottomRightY, scale4, 600),
    ]).start(() => {
      // Hold for a moment then fade out
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => {
          setVisible(false);
          onAnimationComplete?.();
        });
      }, 600);
    });
  }, []);

  if (!visible) return null;

  // Each block is a rotated square (diamond shape) to match the logo aesthetic
  const blockSize = 50;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.logoContainer}>
        {/* Top-left block */}
        <Animated.View
          style={[
            styles.block,
            {
              transform: [
                { translateX: topLeftX },
                { translateY: topLeftY },
                { scale: scale1 },
                { rotate: '45deg' },
              ],
              top: 0,
              left: 0,
            },
          ]}
        />
        {/* Top-right block */}
        <Animated.View
          style={[
            styles.block,
            {
              transform: [
                { translateX: topRightX },
                { translateY: topRightY },
                { scale: scale2 },
                { rotate: '45deg' },
              ],
              top: 0,
              right: 0,
            },
          ]}
        />
        {/* Bottom-left block */}
        <Animated.View
          style={[
            styles.block,
            {
              transform: [
                { translateX: bottomLeftX },
                { translateY: bottomLeftY },
                { scale: scale3 },
                { rotate: '45deg' },
              ],
              bottom: 0,
              left: 0,
            },
          ]}
        />
        {/* Bottom-right block */}
        <Animated.View
          style={[
            styles.block,
            {
              transform: [
                { translateX: bottomRightX },
                { translateY: bottomRightY },
                { scale: scale4 },
                { rotate: '45deg' },
              ],
              bottom: 0,
              right: 0,
            },
          ]}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffffff',
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: 120,
    height: 120,
    position: 'relative',
  },
  block: {
    position: 'absolute',
    width: 50,
    height: 50,
    backgroundColor: '#000000',
    margin: 5,
  },
});
