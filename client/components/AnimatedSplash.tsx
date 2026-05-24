import React, { useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useSpring } from 'react-native-reanimated';

interface AnimatedSplashProps {
  onAnimationComplete?: () => void;
}

export default function AnimatedSplash({ onAnimationComplete }: AnimatedSplashProps) {
  // 四个角的动画值
  const topLeftX = useSharedValue(-400);
  const topLeftY = useSharedValue(-300);
  
  const topRightX = useSharedValue(400);
  const topRightY = useSharedValue(-300);
  
  const bottomLeftX = useSharedValue(-400);
  const bottomLeftY = useSharedValue(300);
  
  const bottomRightX = useSharedValue(400);
  const bottomRightY = useSharedValue(300);

  useEffect(() => {
    // 左上角先飞入
    topLeftX.value = withDelay(0, withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) }));
    topLeftY.value = withDelay(0, withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) }));
    
    // 然后右上角
    topRightX.value = withDelay(400, withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) }));
    topRightY.value = withDelay(400, withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) }));
    
    // 然后左下角
    bottomLeftX.value = withDelay(800, withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) }));
    bottomLeftY.value = withDelay(800, withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) }));
    
    // 最后右下角
    bottomRightX.value = withDelay(1200, withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) }));
    bottomRightY.value = withDelay(1200, withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) }));

    // 动画完成后关闭
    const timer = setTimeout(() => {
      onAnimationComplete?.();
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  // 四个象限的裁剪容器
  // 原图 400x332，容器 300x249
  // 上方图形约占60%高度，下方约占40%，所以分割线在约60%处
  
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
  }));

  const bottomLeftStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: bottomLeftX.value },
      { translateY: bottomLeftY.value },
    ],
  }));

  const bottomRightStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: bottomRightX.value },
      { translateY: bottomRightY.value },
    ],
  }));

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        {/* 左上角 - 裁剪显示左上部分 */}
        <View style={styles.clipTopLeft}>
          <Animated.View style={[styles.imageWrapperTopLeft, topLeftStyle]}>
            <Image
              source={require('@/assets/splash-logo.png')}
              style={styles.fullImage}
              resizeMode="contain"
            />
          </Animated.View>
        </View>

        {/* 右上角 - 裁剪显示右上部分 */}
        <View style={styles.clipTopRight}>
          <Animated.View style={[styles.imageWrapperTopRight, topRightStyle]}>
            <Image
              source={require('@/assets/splash-logo.png')}
              style={styles.fullImage}
              resizeMode="contain"
            />
          </Animated.View>
        </View>

        {/* 左下角 - 裁剪显示左下部分 */}
        <View style={styles.clipBottomLeft}>
          <Animated.View style={[styles.imageWrapperBottomLeft, bottomLeftStyle]}>
            <Image
              source={require('@/assets/splash-logo.png')}
              style={styles.fullImage}
              resizeMode="contain"
            />
          </Animated.View>
        </View>

        {/* 右下角 - 裁剪显示右下部分 */}
        <View style={styles.clipBottomRight}>
          <Animated.View style={[styles.imageWrapperBottomRight, bottomRightStyle]}>
            <Image
              source={require('@/assets/splash-logo.png')}
              style={styles.fullImage}
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
  // 裁剪容器 - 横向分割在60%处（上方图形更大）
  clipTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 150,
    height: 150,
    overflow: 'hidden',
  },
  clipTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 150,
    height: 150,
    overflow: 'hidden',
  },
  clipBottomLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 150,
    height: 99,
    overflow: 'hidden',
  },
  clipBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 150,
    height: 99,
    overflow: 'hidden',
  },
  // 图片定位 - 让每块显示正确区域
  imageWrapperTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  imageWrapperTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  imageWrapperBottomLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
  imageWrapperBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  fullImage: {
    width: 300,
    height: 249,
  },
});
