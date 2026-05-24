import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { router } from 'expo-router';

export default function AnimatedSplash() {
  const [visible, setVisible] = useState(true);
  // 每个元素独立的动画状态
  const topLeftX = useSharedValue(-300);
  const topLeftY = useSharedValue(-250);
  const topLeftOpacity = useSharedValue(1);
  
  const topRightX = useSharedValue(300);
  const topRightY = useSharedValue(-250);
  const topRightOpacity = useSharedValue(0);
  
  const bottomLeftX = useSharedValue(-300);
  const bottomLeftY = useSharedValue(250);
  const bottomLeftOpacity = useSharedValue(0);
  
  const bottomRightX = useSharedValue(300);
  const bottomRightY = useSharedValue(250);
  const bottomRightOpacity = useSharedValue(0);

  useEffect(() => {
    // 第一个：左上角飞入
    topLeftX.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) });
    topLeftY.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) });
    
    // 第二个：左上角完成后再开始右上角
    setTimeout(() => {
      topRightOpacity.value = 1;
      topRightX.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) });
      topRightY.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) });
    }, 400);
    
    // 第三个：右上角完成后再开始左下角
    setTimeout(() => {
      bottomLeftOpacity.value = 1;
      bottomLeftX.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) });
      bottomLeftY.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) });
    }, 800);
    
    // 第四个：左下角完成后再开始右下角
    setTimeout(() => {
      bottomRightOpacity.value = 1;
      bottomRightX.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) });
      bottomRightY.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) });
    }, 1200);

    // 全部完成后隐藏并跳转首页
    const timer = setTimeout(() => {
      setVisible(false);
      router.replace('/');
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

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

  // 容器 300x249
  const topHeight = 150;
  const bottomHeight = 99;

  return (
    <View style={styles.container}>
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
    height: 249,
    position: 'relative',
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
