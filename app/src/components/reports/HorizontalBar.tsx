import { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';

interface BarItem {
  label: string;
  percent: number;
  color: string;
}

interface Props {
  data: BarItem[];
}

export default function HorizontalBar({ data }: Props) {
  const anims = useRef(data.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.stagger(
      100,
      anims.map(a =>
        Animated.timing(a, { toValue: 1, duration: 500, useNativeDriver: false })
      )
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      {data.map((item, i) => {
        const width = anims[i].interpolate({
          inputRange: [0, 1],
          outputRange: ['0%', `${item.percent}%`],
        });

        return (
          <View key={item.label} style={styles.row}>
            <View style={styles.labelRow}>
              <View style={[styles.dot, { backgroundColor: item.color }]} />
              <Text style={styles.label}>{item.label}</Text>
              <Text style={styles.percent}>{item.percent}%</Text>
            </View>
            <View style={styles.track}>
              <Animated.View style={[styles.fill, { width, backgroundColor: item.color }]} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  row: { gap: 6 },
  labelRow: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  label: { flex: 1, fontSize: 13, color: Colors.textSub, marginLeft: 8, fontWeight: '500' },
  percent: { fontSize: 13, color: Colors.text, fontWeight: '600' },
  track: { height: 8, borderRadius: 4, backgroundColor: Colors.bgInput, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
});
