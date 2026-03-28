import { BlurView } from 'expo-blur';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@/constants/colors';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  innerStyle?: ViewStyle;
  intensity?: number;
  orangeGlow?: boolean;
  noPadding?: boolean;
}

export default function GlassCard({
  children,
  style,
  innerStyle,
  intensity = 18,
  orangeGlow = false,
  noPadding = false,
}: Props) {
  return (
    <BlurView intensity={intensity} tint="dark" style={[s.blur, orangeGlow && s.glowBorder, style]}>
      <View style={[s.inner, noPadding && s.noPad, innerStyle]}>
        {orangeGlow && <View style={s.glowLine} />}
        {children}
      </View>
    </BlurView>
  );
}

const s = StyleSheet.create({
  blur: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  glowBorder: {
    borderColor: 'rgba(232, 80, 26, 0.25)',
  },
  inner: {
    backgroundColor: Colors.glass,
    padding: 16,
    flex: 1,
  },
  noPad: {
    padding: 0,
  },
  glowLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: Colors.accent,
    opacity: 0.5,
  },
});
