import React, { useEffect, useRef } from 'react';
  import { View, Text, Animated, StyleSheet } from 'react-native';
  import { Colors } from '@/constants/colors';

  interface Props {
    label: string;
    value: number;
    total: number;
    color?: string;
    formatValue?: (v: number) => string;
    delay?: number;
  }

  export default function HorizontalBar({ label, value, total, color = Colors.accent, formatValue, delay = 0 }:      
  Props) {
    const anim = useRef(new Animated.Value(0)).current;
    const pct = total > 0 ? Math.round((value / total) * 100) : 0;

    useEffect(() => {
      Animated.timing(anim, { toValue: pct, duration: 800, delay, useNativeDriver: false }).start();
    }, []);

    const widthInterp = anim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });

    return (
      <View style={styles.container}>
        <View style={styles.row}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.value}>
            {formatValue ? formatValue(value) : value}{' '}
            <Text style={styles.pct}>({pct}%)</Text>
          </Text>
        </View>
        <View style={styles.track}>
          <Animated.View style={[styles.fill, { width: widthInterp, backgroundColor: color }]} />
        </View>
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: { marginBottom: 14 },
    row:       { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    label:     { fontSize: 13, color: Colors.text, fontWeight: '500' },
    value:     { fontSize: 13, color: Colors.text, fontWeight: '600' },
    pct:       { color: Colors.textMuted, fontWeight: '400', fontSize: 12 },
    track:     { height: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' },
    fill:      { height: '100%', borderRadius: 4 },
  });