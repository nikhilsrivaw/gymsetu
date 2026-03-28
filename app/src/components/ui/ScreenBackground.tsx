import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { height: H } = Dimensions.get('screen');
const ACCENT = '#FF7E1D';

export default function ScreenBackground({ children }: { children: React.ReactNode }) {
  return (
    <View style={s.root}>
      {/* Top-right warm orb */}
      <View style={s.orb1} />
      {/* Mid-left amber orb */}
      <View style={s.orb2} />
      {/* Bottom-right deep orb */}
      <View style={s.orb3} />

      {/* Subtle diagonal polish */}
      <LinearGradient
        colors={['rgba(255,255,255,0.020)', 'transparent', 'rgba(255,255,255,0.008)']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Fine grid lines */}
      {Array.from({ length: 14 }).map((_, i) => (
        <View key={i} pointerEvents="none" style={[s.line, { top: i * (H / 13) }]} />
      ))}

      {children}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#080808', overflow: 'hidden' },
  orb1: { position: 'absolute', width: 460, height: 460, borderRadius: 230, backgroundColor: `rgba(255,126,29,0.18)`, top: -130, right: -100 },
  orb2: { position: 'absolute', width: 320, height: 320, borderRadius: 160, backgroundColor: `rgba(255,160,30,0.10)`, top: H * 0.36, left: -120 },
  orb3: { position: 'absolute', width: 460, height: 460, borderRadius: 230, backgroundColor: `rgba(180,50,0,0.14)`, bottom: -150, right: -110 },
  line: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.030)' },
});
