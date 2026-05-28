import React, { useState, useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Text, Animated, Easing } from 'react-native';

export default function AnimatedSplash({ onStatusChange }: { onStatusChange?: (status: string) => void }) {
  const [visible, setVisible] = useState(true);

  const report = (msg: string) => {
    console.log('[AnimatedSplash]', msg);
    onStatusChange?.(msg);
  };

  // 四个碎片分别从屏幕四角飞入的偏移量
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
    report('useEffect executed – animation starting');

    const flyIn = (x: Animated.Value, y: Animated.Value, delay: number) =>
      Animated.parallel([
        Animated.timing(x, {
          toValue: 0,
          duration: 400,
          delay,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(y, {
          toValue: 0,
          duration: 400,
          delay,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]);

    const fadeIn = (value: Animated.Value, delay: number) =>
      Animated.timing(value, {
        toValue: 1,
        duration: 50,
        delay,
        useNativeDriver: true,
      });

    const sequence = Animated.sequence([
      flyIn(topLeftX, topLeftY, 0),
      Animated.parallel([fadeIn(topRightOpacity, 0), flyIn(topRightX, topRightY, 0)]),
      Animated.parallel([fadeIn(bottomLeftOpacity, 0), flyIn(bottomLeftX, bottomLeftY, 0)]),
      Animated.parallel([fadeIn(bottomRightOpacity, 0), flyIn(bottomRightX, bottomRightY, 0)]),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.delay(1500),
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]);

    sequence.start(({ finished }) => {
      report(`animation finished=${finished}`);
      if (finished) {
        setVisible(false);
        report('visible=false via animation finish');
      }
    });

    const safety = setTimeout(() => {
      report('SAFETY TIMEOUT fired – forcing visible=false');
      setVisible(false);
    }, 8000);

    return () => {
      sequence.stop();
      clearTimeout(safety);
    };
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, { opacity: containerOpacity }]}>
      <View style={styles.logoContainer}>
        {/* 左上角：imageContainer 固定在 clipContainer 左上 */}
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

        {/* 右上角：imageContainer 固定在 clipContainer 右上 */}
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

        {/* 左下角：imageContainer 固定在 clipContainer 左下 */}
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

        {/* 右下角：imageContainer 固定在 clipContainer 右下 */}
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
