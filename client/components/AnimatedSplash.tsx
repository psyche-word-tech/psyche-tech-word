import React, { useState, useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Text, Animated, Easing } from 'react-native';

export default function AnimatedSplash() {
  const [visible, setVisible] = useState(true);
  const [showText, setShowText] = useState(false);

  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const textOpacityAnim = useRef(new Animated.Value(0)).current;
  const containerOpacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 第一阶段：Logo 整体缩放+淡入
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // 第二阶段：显示文字
      setShowText(true);
      Animated.timing(textOpacityAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        // 第三阶段：停留后淡出整个启动页
        setTimeout(() => {
          Animated.timing(containerOpacityAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            setVisible(false);
          });
        }, 1400);
      });
    });

    return () => {
      scaleAnim.stopAnimation();
      opacityAnim.stopAnimation();
      textOpacityAnim.stopAnimation();
      containerOpacityAnim.stopAnimation();
    };
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: containerOpacityAnim },
      ]}
    >
      <Animated.View
        style={[
          styles.logoWrapper,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        <Image
          source={require('@/assets/splash-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      {showText && (
        <Animated.View style={[styles.sloganContainer, { opacity: textOpacityAnim }]}>
          <Text style={styles.sloganLine1}>To Scientize Learning</Text>
          <Text style={styles.sloganLine2}>——Psyche Tech</Text>
        </Animated.View>
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
    zIndex: 999,
  },
  logoWrapper: {
    width: 300,
    height: 249,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  sloganContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  sloganLine1: {
    fontSize: 22,
    fontStyle: 'italic',
    color: '#333333',
    letterSpacing: 1,
  },
  sloganLine2: {
    marginTop: 8,
    fontSize: 20,
    color: '#333333',
    letterSpacing: 1,
  },
});
