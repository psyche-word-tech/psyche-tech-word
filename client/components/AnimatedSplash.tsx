import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated, Easing } from 'react-native';

interface AnimatedSplashProps {
  onAnimationComplete?: () => void;
}

export default function AnimatedSplash({ onAnimationComplete }: AnimatedSplashProps) {
  // 上方两个图形动画
  const topLeftAnim = useRef(new Animated.Value(0)).current;
  const topRightAnim = useRef(new Animated.Value(0)).current;
  
  // 下方两个图形动画
  const bottomLeftAnim = useRef(new Animated.Value(0)).current;
  const bottomRightAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animations = Animated.sequence([
      // 第一步：上方两个图形飞入（只飞入70%，留下30%的缺口）
      Animated.parallel([
        Animated.timing(topLeftAnim, {
          toValue: 0.7,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(topRightAnim, {
          toValue: 0.7,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      // 第二步：下方两个图形飞入，先填补上方的缺口
      Animated.parallel([
        Animated.timing(bottomLeftAnim, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
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

  // 上方图形飞入 - 从上方飞入
  const topLeftTranslateY = topLeftAnim.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [-400, -120, -120], // 先飞入70%，然后停在-120
  });
  const topLeftTranslateX = topLeftAnim.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [-400, -10, -10], // 稍微有一点水平移动
  });

  const topRightTranslateY = topRightAnim.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [-400, -120, -120],
  });
  const topRightTranslateX = topRightAnim.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [400, 10, 10],
  });

  // 下方图形飞入 - 从下方飞入，先填补上方缺口
  const bottomLeftTranslateY = bottomLeftAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [400, 0],
  });
  const bottomLeftTranslateX = bottomLeftAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 0], // 先水平移动填补缺口
  });

  const bottomRightTranslateY = bottomRightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [400, 0],
  });
  const bottomRightTranslateX = bottomRightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [100, 0],
  });

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        {/* 左上角部分 */}
        <Animated.View
          style={[
            styles.topLeftClip,
            {
              transform: [
                { translateX: topLeftTranslateX },
                { translateY: topLeftTranslateY },
              ],
            },
          ]}
        >
          <Image
            source={require('@/assets/splash-logo.png')}
            style={styles.topLeftImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* 右上角部分 */}
        <Animated.View
          style={[
            styles.topRightClip,
            {
              transform: [
                { translateX: topRightTranslateX },
                { translateY: topRightTranslateY },
              ],
            },
          ]}
        >
          <Image
            source={require('@/assets/splash-logo.png')}
            style={styles.topRightImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* 左下角部分 */}
        <Animated.View
          style={[
            styles.bottomLeftClip,
            {
              transform: [
                { translateX: bottomLeftTranslateX },
                { translateY: bottomLeftTranslateY },
              ],
            },
          ]}
        >
          <Image
            source={require('@/assets/splash-logo.png')}
            style={styles.bottomLeftImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* 右下角部分 */}
        <Animated.View
          style={[
            styles.bottomRightClip,
            {
              transform: [
                { translateX: bottomRightTranslateX },
                { translateY: bottomRightTranslateY },
              ],
            },
          ]}
        >
          <Image
            source={require('@/assets/splash-logo.png')}
            style={styles.bottomRightImage}
            resizeMode="contain"
          />
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
    overflow: 'hidden',
  },
  logoContainer: {
    width: 300,
    height: 249,
    position: 'relative',
  },
  topLeftClip: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 150,
    height: 125,
    overflow: 'hidden',
  },
  topRightClip: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 150,
    height: 125,
    overflow: 'hidden',
  },
  bottomLeftClip: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 150,
    height: 124,
    overflow: 'hidden',
  },
  bottomRightClip: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 150,
    height: 124,
    overflow: 'hidden',
  },
  topLeftImage: {
    width: 300,
    height: 249,
  },
  topRightImage: {
    width: 300,
    height: 249,
    marginLeft: -150,
  },
  bottomLeftImage: {
    width: 300,
    height: 249,
    marginTop: -124,
  },
  bottomRightImage: {
    width: 300,
    height: 249,
    marginLeft: -150,
    marginTop: -124,
  },
});
