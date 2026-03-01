import { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';

interface Props {
  percent: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  centerText?: string;
}

export default function ProgressRing({
  percent,
  size = 80,
  strokeWidth = 6,
  color = Colors.accent,
  label,
  centerText,
}: Props) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: percent, duration: 800, useNativeDriver: false }).start();
  }, [percent]);

  const innerSize = size - strokeWidth * 2;

  // We use two half-circles technique for the ring
  const rotate1 = anim.interpolate({
    inputRange: [0, 50, 100],
    outputRange: ['0deg', '180deg', '180deg'],
    extrapolate: 'clamp',
  });

  const rotate2 = anim.interpolate({
    inputRange: [0, 50, 100],
    outputRange: ['0deg', '0deg', '180deg'],
    extrapolate: 'clamp',
  });

  const opacity2 = anim.interpolate({
    inputRange: [0, 49.9, 50, 100],
    outputRange: [0, 0, 1, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.wrapper}>
      <View style={[styles.ring, { width: size, height: size, borderRadius: size / 2, borderColor: Colors.bgInput, borderWidth: strokeWidth }]}>
        {/* Left half (0-50%) */}
        <View style={[styles.halfClip, { width: size / 2, height: size, left: 0 }]}>
          <Animated.View
            style={[
              styles.halfCircle,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                borderWidth: strokeWidth,
                borderColor: color,
                left: 0,
                transform: [{ rotate: rotate1 }],
                transformOrigin: `${size / 2}px ${size / 2}px`,
              },
            ]}
          />
        </View>

        {/* Right half (50-100%) */}
        <Animated.View style={[styles.halfClip, { width: size / 2, height: size, right: 0, opacity: opacity2 }]}>
          <Animated.View
            style={[
              styles.halfCircle,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                borderWidth: strokeWidth,
                borderColor: color,
                right: 0,
                transform: [{ rotate: rotate2 }],
                transformOrigin: `${size / 2}px ${size / 2}px`,
              },
            ]}
          />
        </Animated.View>

        {/* Center */}
        <View style={[styles.center, { width: innerSize, height: innerSize, borderRadius: innerSize / 2 }]}>
          <Text style={styles.centerText}>{centerText ?? `${Math.round(percent)}%`}</Text>
        </View>
      </View>
      {label && <Text style={styles.label}>{label}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', gap: 6 },
  ring: { position: 'relative', overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  halfClip: { position: 'absolute', overflow: 'hidden', top: -3 },
  halfCircle: { position: 'absolute', top: -3, borderColor: 'transparent' },
  center: { backgroundColor: Colors.bgCard, justifyContent: 'center', alignItems: 'center', zIndex: 2 },
  centerText: { fontSize: 14, fontWeight: '700', color: Colors.text },
  label: { fontSize: 12, color: Colors.textSub, fontWeight: '500', textAlign: 'center' },
});
