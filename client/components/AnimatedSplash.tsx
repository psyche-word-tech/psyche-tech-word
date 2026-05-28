import React, { useState, useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Text, Animated, Easing } from 'react-native';

export default function AnimatedSplash({ onStatusChange }: { onStatusChange?: (status: string) => void }) {
  const [visible, setVisible] = useState(true);

  const report = (msg: string) => {
    console.log('[AnimatedSplash]', msg);
    onStatusChange?.(msg);
  };

  // 使用 React Native 内置 Animated API，不依赖 reanimated
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
      // 左上角
      flyIn(topLeftX, topLeftY, 0),
      // 右上角淡入 + 飞入
      Animated.parallel([fadeIn(topRightOpacity, 0), flyIn(topRightX, topRightY, 0)]),
      // 左下角
      Animated.parallel([fadeIn(bottomLeftOpacity, 0), flyIn(bottomLeftX, bottomLeftY, 0)]),
      // 右下角
      Animated.parallel([fadeIn(bottomRightOpacity, 0), flyIn(bottomRightX, bottomRightY, 0)]),
      // 文字显示
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      // 停留 1.5 秒
      Animated.delay(1500),
      // 容器淡出
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

    // 安全兜底：即使动画系统异常，8 秒后强制进入主页
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
        {/* 左上角 */}
        <View style={[styles.clipContainer, { width: 150, height: 150, top: 0, left: 0 }]}>
          <Animated.View
            style={[
              styles.imageContainer,
              { transform: [{ translateX: topLeftX }, { translateY: topLeftY }] },
            ]}
          >
            <Image
              source={require('@/assets/splash-logo.png')}
              style={styles.imageTopLeft}
              resizeMode="contain"
            />
          </Animated.View>
        </View>

        {/* 右上角 */}
        <View style={[styles.clipContainer, { width: 150, height: 150, top: 0, right: 0 }]}>
          <Animated.View
            style={[
              styles.imageContainer,
              { opacity: topRightOpacity, transform: [{ translateX: topRightX }, { translateY: topRightY }] },
            ]}
          >
            <Image
              source={require('@/assets/splash-logo.png')}
              style={styles.imageTopRight}
              resizeMode="contain"
            />
          </Animated.View>
        </View>

        {/* 左下角 */}
        <View style={[styles.clipContainer, { width: 150, height: 99, bottom: 0, left: 0 }]}>
          <Animated.View
            style={[
              styles.imageContainer,
              { opacity: bottomLeftOpacity, transform: [{ translateX: bottomLeftX }, { translateY: bottomLeftY }] },
            ]}
          >
            <Image
              source={require('@/assets/splash-logo.png')}
              style={styles.imageBottomLeft}
              resizeMode="contain"
            />
          </Animated.View>
        </View>

        {/* 右下角 */}
        <View style={[styles.clipContainer, { width: 150, height: 99, bottom: 0, right: 0 }]}>
          <Animated.View
            style={[
              styles.imageContainer,
              { opacity: bottomRightOpacity, transform: [{ translateX: bottomRightX }, { translateY: bottomRightY }] },
            ]}
          >
            <Image
              source={require('@/assets/splash-logo.png')}
              style={styles.imageBottomRight}
              resizeMode="contain"
            />
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
    // borderRadius forces Android to properly clip absolutely-positioned children
    borderRadius: 1,
  },
  imageContainer: {
    width: 300,
    height: 249,
    position: 'absolute',
  },
  imageTopLeft: {
    width: 300,
    height: 249,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  imageTopRight: {
    width: 300,
    height: 249,
    position: 'absolute',
    top: 0,
    right: 0,
  },
  imageBottomLeft: {
    width: 300,
    height: 249,
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
  imageBottomRight: {
    width: 300,
    height: 249,
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  slogan: {
    marginTop: 24,
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});
