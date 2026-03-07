import { useEffect, useRef } from 'react';
  import { View, Text, StyleSheet, Animated } from 'react-native';
  import { Colors } from '@/constants/colors';
  import { Fonts } from '@/constants/fonts';

  interface Bar {
    label: string;
    value: number;
    color?: string;
  }

  interface Props {
    data: Bar[];
    maxHeight?: number;
    barColor?: string;
    formatValue?: (v: number) => string;
  }

  export default function BarChart({ data, maxHeight = 120, barColor = Colors.accent,
   formatValue }: Props) {
    const maxVal = Math.max(...data.map(d => d.value), 1);
    const anims  = useRef(data.map(() => new Animated.Value(0))).current;

    useEffect(() => {
      Animated.stagger(
        60,
        anims.map((anim, i) =>
          Animated.timing(anim, {
            toValue:  (data[i].value / maxVal) * maxHeight,
            duration: 500,
            useNativeDriver: false,
          })
        )
      ).start();
    }, [data]);

    return (
      <View style={styles.container}>
        {data.map((bar, i) => (
          <View key={i} style={styles.col}>
            <Text style={[styles.valLabel, { color: bar.color ?? barColor }]}>       
              {formatValue ? formatValue(bar.value) : bar.value}
            </Text>
            <View style={[styles.track, { height: maxHeight }]}>
              <Animated.View
                style={[styles.bar, { height: anims[i], backgroundColor: bar.color ??
   barColor }]}
              />
            </View>
            <Text style={styles.axisLabel} numberOfLines={1}>{bar.label}</Text>      
          </View>
        ))}
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, paddingTop: 8 
  },
    col:       { flex: 1, alignItems: 'center', gap: 4 },
    valLabel:  { fontFamily: Fonts.bold, fontSize: 8 },
    track:     { width: '100%', justifyContent: 'flex-end', borderRadius: 6,
  overflow: 'hidden', backgroundColor: Colors.bgElevated },
    bar:       { width: '100%', borderRadius: 6 },
    axisLabel: { fontFamily: Fonts.regular, fontSize: 8, color: Colors.textMuted,    
  textAlign: 'center' },
  });
