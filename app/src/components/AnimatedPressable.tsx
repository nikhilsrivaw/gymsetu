import { useRef, useCallback } from 'react';
import { Animated, Pressable, ViewStyle, StyleProp } from 'react-native';

interface Props {
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  scaleDown?: number;
  disabled?: boolean;
}

export default function AnimatedPressable({ onPress, style, children, scaleDown = 0.97, disabled }: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = useCallback(() => {
    Animated.spring(scale, { toValue: scaleDown, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  }, [scale, scaleDown]);

  const onPressOut = useCallback(() => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  }, [scale]);

  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} disabled={disabled}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
