 import { useRef, useCallback } from 'react';
  import { Animated, Pressable, ViewStyle, StyleProp } from
  'react-native';                                                                                    
  interface Props {                                                    onPress?: () => void;                                          
    style?: StyleProp<ViewStyle>;                                  
    children: React.ReactNode;                                         scaleDown?: number;                                            
    disabled?: boolean;                                            
  }

  export default function AnimatedPressable({
    onPress,
    style,
    children,
    scaleDown = 0.97,
    disabled,
  }: Props) {
    const scale   = useRef(new Animated.Value(1)).current;
    const opacity = useRef(new Animated.Value(1)).current;

    const onPressIn = useCallback(() => {
      Animated.parallel([
        Animated.spring(scale,   { toValue: scaleDown,
  useNativeDriver: true, speed: 60, bounciness: 2 }),
        Animated.timing(opacity, { toValue: 0.82, duration: 80,    
  useNativeDriver: true }),
      ]).start();
    }, [scale, opacity, scaleDown]);

    const onPressOut = useCallback(() => {
      Animated.parallel([
        Animated.spring(scale,   { toValue: 1, useNativeDriver:    
  true, speed: 60, bounciness: 2 }),
        Animated.timing(opacity, { toValue: 1, duration: 120,      
  useNativeDriver: true }),
      ]).start();
    }, [scale, opacity]);

    return (
      <Pressable onPress={onPress} onPressIn={onPressIn}
  onPressOut={onPressOut} disabled={disabled}>
        <Animated.View style={[style, { transform: [{ scale }],    
  opacity }]}>
          {children}
        </Animated.View>
      </Pressable>
    );
  }