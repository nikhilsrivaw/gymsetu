 import React, { useEffect, useRef } from 'react';
  import { View, Text, Animated, StyleSheet } from 'react-native';
  import { Colors } from '@/constants/colors';

  interface BarItem { label: string; value: number; color?: string; }

  interface Props {
    data: BarItem[];
    maxHeight?: number;
    barColor?: string;
    formatValue?: (v: number) => string;
  }

  function AnimatedBar({ value, max, height, color, delay }: {
    value: number; max: number; height: number; color: string; delay: number;
  }) {
    const anim = useRef(new Animated.Value(0)).current;
    const targetH = Math.max(4, (value / max) * height);

    useEffect(() => {
      Animated.timing(anim, { toValue: targetH, duration: 700, delay, useNativeDriver: false }).start();
    }, []);

    return <Animated.View style={{ height: anim, width: '100%', backgroundColor: color, borderRadius: 4 }} />;       
  }

  export default function BarChart({ data, maxHeight = 110, barColor = Colors.accent, formatValue }: Props) {        
    const max = Math.max(...data.map(d => d.value), 1);
    return (
      <View style={{ height: maxHeight + 40, marginTop: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: maxHeight, justifyContent:
  'space-between' }}>
          {data.map((item, i) => (
            <View key={i} style={styles.barCol}>
              {formatValue && (
                <Text style={styles.valueLabel}>{formatValue(item.value)}</Text>
              )}
              <AnimatedBar
                value={item.value}
                max={max}
                height={maxHeight - 20}
                color={item.color ?? barColor}
                delay={i * 60}
              />
              <Text style={styles.axisLabel} numberOfLines={1}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  const styles = StyleSheet.create({
    barCol:     { flex: 1, alignItems: 'center', justifyContent: 'flex-end', marginHorizontal: 2, gap: 4 },
    valueLabel: { fontSize: 9, color: Colors.textMuted, textAlign: 'center' },
    axisLabel:  { fontSize: 10, color: Colors.textMuted, textAlign: 'center', marginTop: 4 },
  });
