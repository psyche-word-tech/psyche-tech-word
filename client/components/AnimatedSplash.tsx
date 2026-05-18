import React, { useEffect, useMemo, useState } from 'react';
import { Animated, View, StyleSheet, Dimensions } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

const { width, height } = Dimensions.get('window');

interface AnimatedSplashProps {
  onAnimationComplete?: () => void;
}

export default function AnimatedSplash({ onAnimationComplete }: AnimatedSplashProps) {
  const [visible, setVisible] = useState(true);
  const fadeAnim = useMemo(() => new Animated.Value(1), []);

  const topLeftX = useMemo(() => new Animated.Value(-width * 0.7), []);
  const topLeftY = useMemo(() => new Animated.Value(-height * 0.7), []);
  const topRightX = useMemo(() => new Animated.Value(width * 0.7), []);
  const topRightY = useMemo(() => new Animated.Value(-height * 0.7), []);
  const bottomLeftX = useMemo(() => new Animated.Value(-width * 0.7), []);
  const bottomLeftY = useMemo(() => new Animated.Value(height * 0.7), []);
  const bottomRightX = useMemo(() => new Animated.Value(width * 0.7), []);
  const bottomRightY = useMemo(() => new Animated.Value(height * 0.7), []);

  const scale1 = useMemo(() => new Animated.Value(0.5), []);
  const scale2 = useMemo(() => new Animated.Value(0.5), []);
  const scale3 = useMemo(() => new Animated.Value(0.5), []);
  const scale4 = useMemo(() => new Animated.Value(0.5), []);

  useEffect(() => {
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
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(animY, {
            toValue: 0,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(animScale, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }),
        ]),
      ]);
    };

    Animated.parallel([
      animateBlock(topLeftX, topLeftY, scale1, 0),
      animateBlock(topRightX, topRightY, scale2, 200),
      animateBlock(bottomLeftX, bottomLeftY, scale3, 400),
      animateBlock(bottomRightX, bottomRightY, scale4, 600),
    ]).start(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setVisible(false);
        onAnimationComplete?.();
      });
    });
  }, []);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.logoContainer}>
        {/* Top-left parallelogram */}
        <Animated.View
          style={[
            styles.blockWrapper,
            {
              top: 0,
              left: 4,
              transform: [
                { translateX: topLeftX },
                { translateY: topLeftY },
                { scale: scale1 },
              ],
            },
          ]}
        >
          <View style={[styles.parallelogram, styles.topLeftShape]} />
        </Animated.View>

        {/* Top-right parallelogram */}
        <Animated.View
          style={[
            styles.blockWrapper,
            {
              top: 0,
              right: 4,
              transform: [
                { translateX: topRightX },
                { translateY: topRightY },
                { scale: scale2 },
              ],
            },
          ]}
        >
          <View style={[styles.parallelogram, styles.topRightShape]} />
        </Animated.View>

        {/* Bottom-left parallelogram */}
        <Animated.View
          style={[
            styles.blockWrapper,
            {
              bottom: 4,
              left: 8,
              transform: [
                { translateX: bottomLeftX },
                { translateY: bottomLeftY },
                { scale: scale3 },
              ],
            },
          ]}
        >
          <View style={[styles.parallelogram, styles.bottomLeftShape]} />
        </Animated.View>

        {/* Bottom-right parallelogram */}
        <Animated.View
          style={[
            styles.blockWrapper,
            {
              bottom: 4,
              right: 8,
              transform: [
                { translateX: bottomRightX },
                { translateY: bottomRightY },
                { scale: scale4 },
              ],
            },
          ]}
        >
          <View style={[styles.parallelogram, styles.bottomRightShape]} />
        </Animated.View>
      </View>
    </Animated.View>
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
    width: 140,
    height: 160,
    position: 'relative',
  },
  blockWrapper: {
    position: 'absolute',
    width: 60,
    height: 70,
    overflow: 'hidden',
  },
  parallelogram: {
    width: 70,
    height: 80,
    backgroundColor: '#000000',
  },
  topLeftShape: {
    transform: [{ skewX: '-25deg' }, { rotate: '-8deg' }],
    marginLeft: -8,
    marginTop: -4,
  },
  topRightShape: {
    transform: [{ skewX: '25deg' }, { rotate: '8deg' }],
    marginLeft: -2,
    marginTop: -4,
  },
  bottomLeftShape: {
    transform: [{ skewX: '25deg' }, { rotate: '8deg' }],
    marginLeft: -6,
    marginTop: -6,
  },
  bottomRightShape: {
    transform: [{ skewX: '-25deg' }, { rotate: '-8deg' }],
    marginLeft: -4,
    marginTop: -6,
  },
});
