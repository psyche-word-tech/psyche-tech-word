import React, { useState, useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Text, Animated, Easing } from 'react-native';

export default function AnimatedSplash() {
  const [visible, setVisible] = useState(true);

  const report = (msg: string) => {
    console.log('[AnimatedSplash]', msg);
  };

  const topLeftX = useRef(new Animated.Value(-300)).current;
  const topLeftY = useRef(new Animated.Value(-250)).current;

  const topRightX = useRef(new Animated.Value(300)).current;
  const topRightY = useRef(new Animated.Value(-250)).current;
  const topRightOpacity = useRef(new Animated.Value(0)).current;

  const bottomLeftX = useRef(new Animated.Value(-300)).current;
  const bottomLeftY = useRef(new Animated.Value(250)).current;
  const bottomLeftOpacity = useRef(new Animated.Value(0)).current;

  const bottomRightX = useRef(new Animated.Value(300)).current;
  const bottomRightY = useRef(new Animated.Value(250)).current;
  const bottomRightOpacity = useRef(new Animated.Value(0)).current;

  const containerOpacity = useRef(new Animated.Value(1)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    report('useEffect executed');

    const timers: number[] = [];

    // Step 1: top-left fly in
    timers.push(setTimeout(() => {
      Animated.parallel([
        Animated.timing(topLeftX, { toValue: 0, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(topLeftY, { toValue: 0, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    }, 0));

    // Step 2: top-right fade in + fly in
    timers.push(setTimeout(() => {
      Animated.parallel([
        Animated.timing(topRightOpacity, { toValue: 1, duration: 50, useNativeDriver: true }),
        Animated.timing(topRightX, { toValue: 0, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(topRightY, { toValue: 0, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    }, 400));

    // Step 3: bottom-left fade in + fly in
    timers.push(setTimeout(() => {
      Animated.parallel([
        Animated.timing(bottomLeftOpacity, { toValue: 1, duration: 50, useNativeDriver: true }),
        Animated.timing(bottomLeftX, { toValue: 0, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(bottomLeftY, { toValue: 0, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    }, 800));

    // Step 4: bottom-right fade in + fly in
    timers.push(setTimeout(() => {
      Animated.parallel([
        Animated.timing(bottomRightOpacity, { toValue: 1, duration: 50, useNativeDriver: true }),
        Animated.timing(bottomRightX, { toValue: 0, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(bottomRightY, { toValue: 0, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    }, 1200));

    // Step 5: text fade in
    timers.push(setTimeout(() => {
      Animated.timing(textOpacity, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    }, 1600));

    // Step 6: container fade out (start animation, but don't rely on callback)
    timers.push(setTimeout(() => {
      Animated.timing(containerOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start();
    }, 3600));

    // Step 7: hide splash after fade out completes (use timeout, not animation callback)
    timers.push(setTimeout(() => {
      setVisible(false);
      report('visible=false via timeout');
    }, 4000));

    const safety = setTimeout(() => {
      report('SAFETY TIMEOUT fired');
      setVisible(false);
    }, 5000);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(safety);
    };
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, { opacity: containerOpacity }]}>
      <View style={styles.logoContainer}>
        <View style={[styles.clipContainer, { width: 150, height: 150, top: 0, left: 0 }]}>
          <Animated.View
            style={[
              styles.imageContainer,
              { top: 0, left: 0, transform: [{ translateX: topLeftX }, { translateY: topLeftY }] },
            ]}
          >
            <Image source={require('@/assets/splash-logo.png')} style={styles.image} resizeMode="contain" />
          </Animated.View>
        </View>

        <View style={[styles.clipContainer, { width: 150, height: 150, top: 0, right: 0 }]}>
          <Animated.View
            style={[
              styles.imageContainer,
              { top: 0, right: 0, opacity: topRightOpacity, transform: [{ translateX: topRightX }, { translateY: topRightY }] },
            ]}
          >
            <Image source={require('@/assets/splash-logo.png')} style={styles.image} resizeMode="contain" />
          </Animated.View>
        </View>

        <View style={[styles.clipContainer, { width: 150, height: 99, bottom: 0, left: 0 }]}>
          <Animated.View
            style={[
              styles.imageContainer,
              { bottom: 0, left: 0, opacity: bottomLeftOpacity, transform: [{ translateX: bottomLeftX }, { translateY: bottomLeftY }] },
            ]}
          >
            <Image source={require('@/assets/splash-logo.png')} style={styles.image} resizeMode="contain" />
          </Animated.View>
        </View>

        <View style={[styles.clipContainer, { width: 150, height: 99, bottom: 0, right: 0 }]}>
          <Animated.View
            style={[
              styles.imageContainer,
              { bottom: 0, right: 0, opacity: bottomRightOpacity, transform: [{ translateX: bottomRightX }, { translateY: bottomRightY }] },
            ]}
          >
            <Image source={require('@/assets/splash-logo.png')} style={styles.image} resizeMode="contain" />
          </Animated.View>
        </View>
      </View>

      <Animated.Text style={[styles.slogan, { opacity: textOpacity }]}>
        To Scientize Learning——Psyche Tech
      </Animated.Text>
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
    width: 300,
    height: 249,
    position: 'relative',
  },
  clipContainer: {
    position: 'absolute',
    overflow: 'hidden',
    borderRadius: 1,
  },
  imageContainer: {
    width: 300,
    height: 249,
    position: 'absolute',
  },
  image: {
    width: 300,
    height: 249,
  },
  slogan: {
    marginTop: 24,
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});
