  import React, { useEffect, useRef } from 'react';                                                                      import { View, Text, Animated, StyleSheet } from 'react-native';
  import { Fonts } from '@/constants/fonts';                                                                           
  
  interface Props {
    label:         string;
    value:         number;
    total:         number;
    color?:        string;
    formatValue?:  (v: number) => string;
    delay?:        number;
  }

  export default function HorizontalBar({ label, value, total, color = '#6366f1', formatValue, delay = 0 }: Props) {   
    const anim = useRef(new Animated.Value(0)).current;
    const pct  = total > 0 ? Math.round((value / total) * 100) : 0;

    useEffect(() => {
      Animated.timing(anim, { toValue: pct, duration: 900, delay, useNativeDriver: false }).start();
    }, []);

    const widthInterp = anim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });

    return (
      <View style={s.container}>
        <View style={s.topRow}>
          <Text style={s.label}>{label}</Text>
          <View style={s.valueRow}>
            <Text style={[s.value, { color }]}>
              {formatValue ? formatValue(value) : value}
            </Text>
            <View style={[s.pctBadge, { backgroundColor: color + '18' }]}>
              <Text style={[s.pct, { color }]}>{pct}%</Text>
            </View>
          </View>
        </View>

        {/* Track */}
        <View style={s.track}>
          {/* Glow layer */}
          <Animated.View style={[s.glow, { width: widthInterp, backgroundColor: color + '30' }]} />
          {/* Fill */}
          <Animated.View style={[s.fill, { width: widthInterp, backgroundColor: color }]} />
        </View>
      </View>
    );
  }

  const s = StyleSheet.create({
    container: { gap: 8 },

    topRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    label:    { fontFamily: Fonts.bold, fontSize: 14, color: '#aaa', flex: 1 },
    valueRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    value:    { fontFamily: Fonts.condensedBold, fontSize: 20 },

    pctBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    pct:      { fontFamily: Fonts.bold, fontSize: 10, letterSpacing: 0.5 },

    track: { height: 10, backgroundColor: '#1e1e1e', borderRadius: 6, overflow: 'hidden', position: 'relative' },      
    glow:  { position: 'absolute', top: 0, left: 0, height: '100%', borderRadius: 6 },
    fill:  { height: '100%', borderRadius: 6 },
  });
