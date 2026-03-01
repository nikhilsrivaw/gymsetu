 import { useEffect, useRef } from 'react';
  import { Animated, ViewStyle, StyleProp, Easing } from
  'react-native';                                                                                    
  interface Props {                                                    delay?: number;                                                
    duration?: number;                                             
    style?: StyleProp<ViewStyle>;                                      children: React.ReactNode;                                     
  }                                                                

  export default function FadeInView({ delay = 0, duration = 320,
  style, children }: Props) {
    const opacity    = useRef(new Animated.Value(0)).current;      
    const translateY = useRef(new Animated.Value(12)).current;     

    useEffect(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration,
          delay,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration,
          delay,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }, []);

    return (
      <Animated.View style={[style, { opacity, transform: [{       
  translateY }] }]}>
        {children}
      </Animated.View>
    );
  }