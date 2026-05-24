import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';

interface AnimatedSplashProps {
  onAnimationComplete?: () => void;
}

export default function AnimatedSplash({ onAnimationComplete }: AnimatedSplashProps) {
  // 动画值：0=初始位置，1=最终位置
  const topLeftAnim = useRef(new Animated.Value(0)).current;
  const topRightAnim = useRef(new Animated.Value(0)).current;
  const bottomLeftAnim = useRef(new Animated.Value(0)).current;
  const bottomRightAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 依次启动动画：左上 → 右上 → 左下 → 右下
    const animations = Animated.sequence([
      // 左上角飞入
      Animated.timing(topLeftAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      // 右上角飞入
      Animated.parallel([
        Animated.timing(topRightAnim, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      // 左下角飞入
      Animated.parallel([
        Animated.timing(bottomLeftAnim, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      // 右下角飞入
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
      // 等待一下后关闭
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

  // 左上角：从左上方飞入
  const topLeftTranslateX = topLeftAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-400, 0],
  });
  const topLeftTranslateY = topLeftAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-400, 0],
  });

  // 右上角：从右上方飞入
  const topRightTranslateX = topRightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [400, 0],
  });
  const topRightTranslateY = topRightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-400, 0],
  });

  // 左下角：从左下方飞入
  const bottomLeftTranslateX = bottomLeftAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-400, 0],
  });
  const bottomLeftTranslateY = bottomLeftAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [400, 0],
  });

  // 右下角：从右下方飞入
  const bottomRightTranslateX = bottomRightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [400, 0],
  });
  const bottomRightTranslateY = bottomRightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [400, 0],
  });

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        {/* 左上角平行四边形 */}
        <Animated.View
          style={[
            styles.topLeftContainer,
            {
              transform: [
                { translateX: topLeftTranslateX },
                { translateY: topLeftTranslateY },
              ],
            },
          ]}
        >
          <View style={styles.topLeftParallelogram} />
        </Animated.View>

        {/* 右上角平行四边形 */}
        <Animated.View
          style={[
            styles.topRightContainer,
            {
              transform: [
                { translateX: topRightTranslateX },
                { translateY: topRightTranslateY },
              ],
            },
          ]}
        >
          <View style={styles.topRightParallelogram} />
        </Animated.View>

        {/* 左下角平行四边形 */}
        <Animated.View
          style={[
            styles.bottomLeftContainer,
            {
              transform: [
                { translateX: bottomLeftTranslateX },
                { translateY: bottomLeftTranslateY },
              ],
            },
          ]}
        >
          <View style={styles.bottomLeftParallelogram} />
        </Animated.View>

        {/* 右下角平行四边形 */}
        <Animated.View
          style={[
            styles.bottomRightContainer,
            {
              transform: [
                { translateX: bottomRightTranslateX },
                { translateY: bottomRightTranslateY },
              ],
            },
          ]}
        >
          <View style={styles.bottomRightParallelogram} />
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
    height: 190,
    position: 'relative',
  },
  topLeftContainer: {
    position: 'absolute',
    top: 7.5,
    left: 32.6,
  },
  topRightContainer: {
    position: 'absolute',
    top: 7.5,
    right: 32.6,
  },
  bottomLeftContainer: {
    position: 'absolute',
    bottom: 25,
    left: 65,
  },
  bottomRightContainer: {
    position: 'absolute',
    bottom: 25,
    right: 233.8,
  },
  // 平行四边形样式
  topLeftParallelogram: {
    width: 85,
    height: 75,
    backgroundColor: '#000000',
    transform: [{ skewX: '28deg' }],
  },
  topRightParallelogram: {
    width: 85,
    height: 75,
    backgroundColor: '#000000',
    transform: [{ skewX: '-28deg' }],
  },
  bottomLeftParallelogram: {
    width: 59,
    height: 52,
    backgroundColor: '#000000',
    transform: [{ skewX: '-28deg' }],
  },
  bottomRightParallelogram: {
    width: 59,
    height: 52,
    backgroundColor: '#000000',
    transform: [{ skewX: '28deg' }],
  },
});
