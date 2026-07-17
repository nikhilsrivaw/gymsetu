import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { Fonts } from '@/constants/fonts';

interface Bar { label: string; value: number; }

interface Props {
  data:         Bar[];
  color?:       string;
  height?:      number;
  selected:     number;              // index of the highlighted bar
  onSelect:     (i: number) => void; // tap a bar
  formatValue?: (v: number) => string;
}

function Col({ value, max, height, color, on, delay }: {
  value: number; max: number; height: number; color: string; on: boolean; delay: number;
}) {
  const anim   = useRef(new Animated.Value(0)).current;
  const target = Math.max(5, (value / max) * height);
  useEffect(() => {
    Animated.timing(anim, { toValue: target, duration: 650, delay, useNativeDriver: false }).start();
  }, [target]);
  // Selected bar is full-strength; the rest are dimmed so the selection reads.
  return (
    <Animated.View style={{
      height: anim, width: '58%',
      backgroundColor: on ? color : color + '4D',
      borderTopLeftRadius: 5, borderTopRightRadius: 5,
      borderBottomLeftRadius: 2, borderBottomRightRadius: 2,
    }} />
  );
}

// A tappable bar chart. Tapping a bar calls onSelect; the selected bar is
// highlighted and its neighbours dim, so the choice is obvious. Interactivity
// per the dataviz guidance (per-mark hit target, larger than the mark).
export default function InteractiveBarChart({
  data, color = '#22C55E', height = 130, selected, onSelect, formatValue,
}: Props) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <View>
      <View style={[s.row, { height }]}>
        {data.map((b, i) => {
          const on = i === selected;
          return (
            <TouchableOpacity key={i} style={s.col} activeOpacity={0.7} onPress={() => onSelect(i)}>
              {formatValue && b.value > 0 && (
                <Text style={[s.val, { color: on ? color : color + '99' }]}>{formatValue(b.value)}</Text>
              )}
              <Col value={b.value} max={max} height={height - 26} color={color} on={on} delay={i * 55} />
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={s.labels}>
        {data.map((b, i) => (
          <TouchableOpacity key={i} style={s.labelCol} activeOpacity={0.7} onPress={() => onSelect(i)}>
            <Text style={[s.axis, i === selected && { color, fontFamily: Fonts.bold }]} numberOfLines={1}
              adjustsFontSizeToFit minimumFontScale={0.6}>
              {b.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  row:      { flexDirection: 'row', alignItems: 'flex-end' },
  col:      { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' },
  val:      { fontFamily: Fonts.bold, fontSize: 9, marginBottom: 4 },
  labels:   { flexDirection: 'row', marginTop: 8 },
  labelCol: { flex: 1, alignItems: 'center' },
  axis:     { fontFamily: Fonts.regular, fontSize: 10, color: '#8a8a8a' },
});
