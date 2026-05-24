import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated, Easing } from 'react-native';

interface AnimatedSplashProps {
  onAnimationComplete?: () => void;
}

export default function AnimatedSplash({ onAnimationComplete }: AnimatedSplashProps) {
  const topLeftAnim = useRef(new Animated.Value(0)).current;
  const topRightAnim = useRef(new Animated.Value(0)).current;
  const bottomLeftAnim = useRef(new Animated.Value(0)).current;
  const bottomRightAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animations = Animated.sequence([
      Animated.timing(topLeftAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(topRightAnim, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(bottomLeftAnim, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(bottomRightAnim, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]);

    animations.start(() => {
      setTimeout(() => {
        onAnimationComplete?.();
      }, 1000);
    });

    return () => {
      topLeftAnim.stopAnimation();
      topRightAnim.stopAnimation();
      bottomLeftAnim.stopAnimation();
      bottomRightAnim.stopAnimation();
    };
  }, []);

  // 原图尺寸 400x332，容器 300x249 (保持比例)
  // 每个象限的大小
  const quadrantW = 150;
  const quadrantH = 124.5;

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        {/* 左上角 */}
        <Animated.View
          style={[
            styles.quadrant,
            {
              left: 0,
              top: 0,
              opacity: topLeftAnim,
              transform: [
                { translateX: topLeftAnim.interpolate({ inputRange: [0, 1], outputRange: [-300, 0] }) },
                { translateY: topLeftAnim.interpolate({ inputRange: [0, 1], outputRange: [-250, 0] }) },
              ],
            },
          ]}
        >
          <View style={styles.clipContainer}>
            <Image
              source={require('@/assets/splash-logo.png')}
              style={[styles.fullImage, { left: 0, top: 0 }]}
              resizeMode="contain"
            />
          </View>
        </Animated.View>

        {/* 右上角 */}
        <Animated.View
          style={[
            styles.quadrant,
            {
              right: 0,
              top: 0,
              opacity: topRightAnim,
              transform: [
                { translateX: topRightAnim.interpolate({ inputRange: [0, 1], outputRange: [300, 0] }) },
                { translateY: topRightAnim.interpolate({ inputRange: [0, 1], outputRange: [-250, 0] }) },
              ],
            },
          ]}
        >
          <View style={styles.clipContainer}>
            <Image
              source={require('@/assets/splash-logo.png')}
              style={[styles.fullImage, { right: 0, top: 0, left: 'auto' }]}
              resizeMode="contain"
            />
          </View>
        </Animated.View>

        {/* 左下角 */}
        <Animated.View
          style={[
            styles.quadrant,
            {
              left: 0,
              bottom: 0,
              opacity: bottomLeftAnim,
              transform: [
                { translateX: bottomLeftAnim.interpolate({ inputRange: [0, 1], outputRange: [-300, 0] }) },
                { translateY: bottomLeftAnim.interpolate({ inputRange: [0, 1], outputRange: [250, 0] }) },
              ],
            },
          ]}
        >
          <View style={styles.clipContainer}>
            <Image
              source={require('@/assets/splash-logo.png')}
              style={[styles.fullImage, { left: 0, bottom: 0, top: 'auto' }]}
              resizeMode="contain"
            />
          </View>
        </Animated.View>

        {/* 右下角 */}
        <Animated.View
          style={[
            styles.quadrant,
            {
              right: 0,
              bottom: 0,
              opacity: bottomRightAnim,
              transform: [
                { translateX: bottomRightAnim.interpolate({ inputRange: [0, 1], outputRange: [300, 0] }) },
                { translateY: bottomRightAnim.interpolate({ inputRange: [0, 1], outputRange: [250, 0] }) },
              ],
            },
          ]}
        >
          <View style={styles.clipContainer}>
            <Image
              source={require('@/assets/splash-logo.png')}
              style={[styles.fullImage, { right: 0, bottom: 0, left: 'auto', top: 'auto' }]}
              resizeMode="contain"
            />
          </View>
        </Animated.View>
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
  quadrant: {
    position: 'absolute',
    width: 150,
    height: 124.5,
    overflow: 'hidden',
  },
  clipContainer: {
    width: 150,
    height: 124.5,
    overflow: 'hidden',
  },
  fullImage: {
    width: 300,
    height: 249,
    position: 'absolute',
  },
});
