import React, { useState, useEffect } from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

const AnimatedImage = Animated.createAnimatedComponent(Image);

export default function AnimatedSplash() {
  const [visible, setVisible] = useState(true);
  const [zIndex, setZIndex] = useState(999);
  const [showText, setShowText] = useState(false);

  // 每个元素独立的动画状态
  const topLeftX = useSharedValue(-300);
  const topLeftY = useSharedValue(-250);
  
  const topRightX = useSharedValue(300);
  const topRightY = useSharedValue(-250);
  const topRightOpacity = useSharedValue(0);
  
  const bottomLeftX = useSharedValue(-300);
  const bottomLeftY = useSharedValue(250);
  const bottomLeftOpacity = useSharedValue(0);
  
  const bottomRightX = useSharedValue(300);
  const bottomRightY = useSharedValue(250);
  const bottomRightOpacity = useSharedValue(0);

  const containerOpacity = useSharedValue(1);
  const textOpacity = useSharedValue(0);

  const handleAnimationComplete = () => {
    setVisible(false);
    setZIndex(-1);
  };

  useEffect(() => {
    let timeoutIds: NodeJS.Timeout[] = [];

    const startAnimation = () => {
      // 第一个：左上角飞入
      topLeftX.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) });
      topLeftY.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) });

      timeoutIds.push(setTimeout(() => {
        topRightOpacity.value = 1;
        topRightX.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) });
        topRightY.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) });
      }, 400));

      timeoutIds.push(setTimeout(() => {
        bottomLeftOpacity.value = 1;
        bottomLeftX.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) });
        bottomLeftY.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) });
      }, 800));

      timeoutIds.push(setTimeout(() => {
        bottomRightOpacity.value = 1;
        bottomRightX.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) });
        bottomRightY.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) });
      }, 1200));

      timeoutIds.push(setTimeout(() => {
        setShowText(true);
        textOpacity.value = withTiming(1, { duration: 500 });
      }, 1600));

      timeoutIds.push(setTimeout(() => {
        containerOpacity.value = withTiming(0, { duration: 300 }, (finished) => {
          if (finished) {
            runOnJS(handleAnimationComplete)();
          }
        });
      }, 3000));
    };

    // 先隐藏系统原生启动页，等待完成后再开始动画
    SplashScreen.hideAsync()
      .catch(() => {})
      .finally(() => {
        // 无论 hideAsync 成功还是失败，都延迟一小段时间确保原生层已释放
        setTimeout(startAnimation, 100);
      });

    // 安全兜底：即使 reanimated 崩溃或动画卡住，5 秒后强制进入主页
    const safetyTimeout = setTimeout(() => {
      handleAnimationComplete();
    }, 5000);
    timeoutIds.push(safetyTimeout);

    return () => {
      timeoutIds.forEach(id => clearTimeout(id));
    };
  }, []);

  const topLeftStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: topLeftX.value },
      { translateY: topLeftY.value },
    ],
  }));

  const topRightStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: topRightX.value },
      { translateY: topRightY.value },
    ],
    opacity: topRightOpacity.value,
  }));

  const bottomLeftStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: bottomLeftX.value },
      { translateY: bottomLeftY.value },
    ],
    opacity: bottomLeftOpacity.value,
  }));

  const bottomRightStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: bottomRightX.value },
      { translateY: bottomRightY.value },
    ],
    opacity: bottomRightOpacity.value,
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  // 容器 300x249
  const topHeight = 150;
  const bottomHeight = 99;

  if (!visible) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, containerStyle, { zIndex }]}>
      <View style={styles.logoContainer}>
        {/* 左上角 */}
        <View style={[styles.clipContainer, { width: 150, height: topHeight, top: 0, left: 0 }]}>
          <Animated.View style={[styles.imageContainer, topLeftStyle]}>
            <Image
              source={require('@/assets/splash-logo.png')}
              style={styles.imageTopLeft}
              resizeMode="contain"
            />
          </Animated.View>
        </View>

        {/* 右上角 */}
        <View style={[styles.clipContainer, { width: 150, height: topHeight, top: 0, right: 0 }]}>
          <Animated.View style={[styles.imageContainer, topRightStyle]}>
            <Image
              source={require('@/assets/splash-logo.png')}
              style={styles.imageTopRight}
              resizeMode="contain"
            />
          </Animated.View>
        </View>

        {/* 左下角 */}
        <View style={[styles.clipContainer, { width: 150, height: bottomHeight, bottom: 0, left: 0 }]}>
          <Animated.View style={[styles.imageContainer, bottomLeftStyle]}>
            <Image
              source={require('@/assets/splash-logo.png')}
              style={styles.imageBottomLeft}
              resizeMode="contain"
            />
          </Animated.View>
        </View>

        {/* 右下角 */}
        <View style={[styles.clipContainer, { width: 150, height: bottomHeight, bottom: 0, right: 0 }]}>
          <Animated.View style={[styles.imageContainer, bottomRightStyle]}>
            <Image
              source={require('@/assets/splash-logo.png')}
              style={styles.imageBottomRight}
              resizeMode="contain"
            />
          </Animated.View>
        </View>
      </View>
      
      {/* 文字：四个图形飞入完成后显示 */}
      {showText && (
        <Animated.Text style={[styles.slogan, textStyle]}>
          To Scientize Learning——Psyche Tech
        </Animated.Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: 300,
    height: 249,
    position: 'relative',
  },
  slogan: {
    marginTop: 40,
    fontSize: 14,
    fontStyle: 'italic',
    color: '#333333',
    letterSpacing: 1,
  },
  clipContainer: {
    position: 'absolute',
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'absolute',
    width: 300,
    height: 249,
  },
  imageTopLeft: {
    width: 300,
    height: 249,
  },
  imageTopRight: {
    width: 300,
    height: 249,
    position: 'absolute',
    left: -150,
    top: 0,
  },
  imageBottomLeft: {
    width: 300,
    height: 249,
    position: 'absolute',
    left: 0,
    top: -150,
  },
  imageBottomRight: {
    width: 300,
    height: 249,
    position: 'absolute',
    left: -150,
    top: -150,
  },
});
