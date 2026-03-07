import { useEffect, useRef } from 'react';                                           import { View, Text, StyleSheet, Animated } from 'react-native';                     import { Colors } from '@/constants/colors';                                         import { Fonts } from '@/constants/fonts';                                                                                                                                interface Props {                                                                      label: string;                                                                       value: number;                                                                   
    total: number;                                                                       color: string;                                                                   
    formatValue?: (v: number) => string;                                               }                                                                                  
                                                                                     
  export default function HorizontalBar({ label, value, total, color, formatValue }: 
  Props) {
    const widthAnim = useRef(new Animated.Value(0)).current;
    const pct = total > 0 ? (value / total) * 100 : 0;

    useEffect(() => {
      Animated.timing(widthAnim, {
        toValue:  pct,
        duration: 600,
        useNativeDriver: false,
      }).start();
    }, [value, total]);

    return (
      <View style={styles.row}>
        <Text style={styles.label} numberOfLines={1}>{label}</Text>
        <View style={styles.track}>
          <Animated.View
            style={[
              styles.fill,
              {
                backgroundColor: color,
                width: widthAnim.interpolate({
                  inputRange:  [0, 100],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
        <Text style={[styles.value, { color }]}>
          {formatValue ? formatValue(value) : value}
        </Text>
      </View>
    );
  }

  const styles = StyleSheet.create({
    row:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
    label: { fontFamily: Fonts.medium, fontSize: 12, color: Colors.textMuted, width: 
  72 },
    track: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden',
  backgroundColor: Colors.bgElevated },
    fill:  { height: '100%', borderRadius: 4 },
    value: { fontFamily: Fonts.bold, fontSize: 12, width: 50, textAlign: 'right' },  
  });