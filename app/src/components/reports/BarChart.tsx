import { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';

interface BarData {
  label: string;
  value: number;
}

interface Props {
  data: BarData[];
  color?: string;
  height?: number;
  suffix?: string;
  formatValue?: (v: number) => string;
}

export default function BarChart({ data, color = Colors.accent, height = 160, suffix = '', formatValue }: Props) {
  const maxValue = Math.max(...data.map(d => d.value));
  const anims = useRef(data.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.stagger(
      80,
      anims.map(a =>
        Animated.timing(a, { toValue: 1, duration: 600, useNativeDriver: false })
      )
    ).start();
  }, []);

  return (
    <View style={[styles.container, { height: height + 40 }]}>
      <View style={styles.barsRow}>
        {data.map((item, i) => {
          const barHeight = anims[i].interpolate({
            inputRange: [0, 1],
            outputRange: [0, (item.value / maxValue) * height],
          });

          const display = formatValue ? formatValue(item.value) : `${item.value}${suffix}`;

          return (
            <View key={item.label} style={styles.barCol}>
              <Text style={styles.barValue}>{display}</Text>
              <Animated.View
                style={[styles.bar, { height: barHeight, backgroundColor: color }]}
              />
              <Text style={styles.barLabel}>{item.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 4 },
  barsRow: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around' },
  barCol: { alignItems: 'center', flex: 1 },
  bar: { width: 28, borderRadius: 6, minHeight: 4 },
  barValue: { fontSize: 10, color: Colors.textSub, marginBottom: 4, fontWeight: '600' },
  barLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 6, fontWeight: '500' },
});
