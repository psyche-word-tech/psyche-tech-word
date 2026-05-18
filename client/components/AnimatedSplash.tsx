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

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.logoContainer}>
        {/* Top-left block: upper-wide, lower-narrow */}
        <Animated.View
          style={[
            styles.blockOuter,
            {
              top: 0,
              left: 4,
              width: 64,
              height: 74,
              transform: [
                { translateX: topLeftX },
                { translateY: topLeftY },
                { scale: scale1 },
              ],
            },
          ]}
        >
          <View style={[styles.innerShape, {
            width: 90,
            height: 90,
            marginLeft: -18,
            marginTop: -8,
            transform: [{ rotate: '-18deg' }],
          }]} />
        </Animated.View>

        {/* Top-right block: mirror */}
        <Animated.View
          style={[
            styles.blockOuter,
            {
              top: 0,
              right: 4,
              width: 64,
              height: 74,
              transform: [
                { translateX: topRightX },
                { translateY: topRightY },
                { scale: scale2 },
              ],
            },
          ]}
        >
          <View style={[styles.innerShape, {
            width: 90,
            height: 90,
            marginLeft: -8,
            marginTop: -8,
            transform: [{ rotate: '18deg' }],
          }]} />
        </Animated.View>

        {/* Bottom-left block: lower-wide, upper-narrow */}
        <Animated.View
          style={[
            styles.blockOuter,
            {
              bottom: 4,
              left: 8,
              width: 56,
              height: 60,
              transform: [
                { translateX: bottomLeftX },
                { translateY: bottomLeftY },
                { scale: scale3 },
              ],
            },
          ]}
        >
          <View style={[styles.innerShape, {
            width: 85,
            height: 85,
            marginLeft: -22,
            marginTop: -18,
            transform: [{ rotate: '20deg' }],
          }]} />
        </Animated.View>

        {/* Bottom-right block: mirror */}
        <Animated.View
          style={[
            styles.blockOuter,
            {
              bottom: 4,
              right: 8,
              width: 56,
              height: 60,
              transform: [
                { translateX: bottomRightX },
                { translateY: bottomRightY },
                { scale: scale4 },
              ],
            },
          ]}
        >
          <View style={[styles.innerShape, {
            width: 85,
            height: 85,
            marginLeft: -7,
            marginTop: -18,
            transform: [{ rotate: '-20deg' }],
          }]} />
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
  blockOuter: {
    position: 'absolute',
    overflow: 'hidden',
  },
  innerShape: {
    backgroundColor: '#000000',
  },
});
