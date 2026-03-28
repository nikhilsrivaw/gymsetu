  import React, { useEffect, useRef } from 'react';                                                                      import { View, Text, Animated, StyleSheet } from 'react-native';
  import { Fonts } from '@/constants/fonts';                                                                           
  
  interface BarItem { label: string; value: number; color?: string; }

  interface Props {
    data:          BarItem[];
    maxHeight?:    number;
    barColor?:     string;
    formatValue?:  (v: number) => string;
  }

  function AnimatedBar({ value, max, height, color, delay }: {
    value: number; max: number; height: number; color: string; delay: number;
  }) {
    const anim    = useRef(new Animated.Value(0)).current;
    const targetH = Math.max(6, (value / max) * height);

    useEffect(() => {
      Animated.timing(anim, { toValue: targetH, duration: 700, delay, useNativeDriver: false }).start();
    }, []);

    return (
      <Animated.View style={{
        height: anim, width: '100%',
        backgroundColor: color,
        borderRadius: 6,
      }} />
    );
  }

  export default function BarChart({ data, maxHeight = 120, barColor = '#6366f1', formatValue }: Props) {
    const max = Math.max(...data.map(d => d.value), 1);

    return (
      <View style={s.container}>
        {/* Bars */}
        <View style={[s.barsRow, { height: maxHeight }]}>
          {data.map((item, i) => (
            <View key={i} style={s.barCol}>
              {formatValue && item.value > 0 && (
                <Text style={[s.valueLabel, { color: item.color ?? barColor }]}>
                  {formatValue(item.value)}
                </Text>
              )}
              <AnimatedBar
                value={item.value}
                max={max}
                height={maxHeight - 24}
                color={item.color ?? barColor}
                delay={i * 60}
              />
            </View>
          ))}
        </View>

        {/* Labels row — separate so they never get clipped */}
        <View style={s.labelsRow}>
          {data.map((item, i) => (
            <View key={i} style={s.labelCol}>
              <Text style={s.axisLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
                {item.label}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  const s = StyleSheet.create({
    container:  { marginTop: 12 },
    barsRow:    { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
    barCol:     { flex: 1, alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: 3, gap: 4 },
    valueLabel: { fontSize: 9, fontFamily: Fonts.bold, letterSpacing: 0.3, marginBottom: 2 },
    labelsRow:  { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    labelCol:   { flex: 1, alignItems: 'center' },
    axisLabel:  { fontFamily: Fonts.bold, fontSize: 10, color: '#666', letterSpacing: 0.3, textAlign: 'center' },      
  });
