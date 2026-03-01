import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated } from 'react-native';
import { TextInput } from 'react-native-paper';
import { Stack } from 'expo-router';
import { Colors } from '@/constants/colors';
import AnimatedPressable from '@/components/AnimatedPressable';
import FadeInView from '@/components/FadeInView';

interface BMIResult {
  value: number;
  category: string;
  emoji: string;
  color: string;
  tip: string;
}

function calculateBMI(heightCm: number, weightKg: number): BMIResult {
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);

  if (bmi < 18.5) return { value: bmi, category: 'Underweight', emoji: '🔵', color: '#3B82F6', tip: 'Consider increasing calorie intake with nutrient-rich foods. Add strength training to build muscle mass.' };
  if (bmi < 25) return { value: bmi, category: 'Normal', emoji: '🟢', color: Colors.green, tip: 'Great job! Maintain your current lifestyle with regular exercise and balanced diet.' };
  if (bmi < 30) return { value: bmi, category: 'Overweight', emoji: '🟡', color: Colors.orange, tip: 'Focus on portion control and increase cardio activities. Aim for 150 mins of moderate exercise per week.' };
  return { value: bmi, category: 'Obese', emoji: '🔴', color: Colors.red, tip: 'Consult a healthcare professional. Start with low-impact exercises like walking or swimming.' };
}

const ranges = [
  { label: 'Underweight', range: '< 18.5', color: '#3B82F6', emoji: '🔵' },
  { label: 'Normal', range: '18.5 - 24.9', color: Colors.green, emoji: '🟢' },
  { label: 'Overweight', range: '25.0 - 29.9', color: Colors.orange, emoji: '🟡' },
  { label: 'Obese', range: '≥ 30.0', color: Colors.red, emoji: '🔴' },
];

export default function BMICalculatorScreen() {
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [result, setResult] = useState<BMIResult | null>(null);
  const scaleAnim = useRef(new Animated.Value(0)).current;

  const ip = { mode: 'outlined' as const, style: styles.input, outlineColor: Colors.border, activeOutlineColor: Colors.accent, textColor: Colors.text, theme: { colors: { onSurfaceVariant: Colors.textSub } } };

  const handleCalculate = () => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (!h || !w || h < 50 || h > 300 || w < 10 || w > 500) return;
    const r = calculateBMI(h, w);
    setResult(r);
    scaleAnim.setValue(0);
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 8, bounciness: 12 }).start();
  };

  const handleReset = () => {
    setHeight('');
    setWeight('');
    setResult(null);
  };

  // BMI gauge position (0-40 mapped to 0-100%)
  const gaugePercent = result ? Math.min(Math.max((result.value / 40) * 100, 5), 95) : 0;

  return (
    <>
      <Stack.Screen options={{ title: '⚖️ BMI Calculator' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Hero */}
        <FadeInView delay={0}>
          <View style={styles.heroCard}>
            <Text style={styles.heroEmoji}>⚖️</Text>
            <Text style={styles.heroTitle}>Body Mass Index</Text>
            <Text style={styles.heroSub}>Enter height & weight to calculate BMI</Text>
          </View>
        </FadeInView>

        {/* Input */}
        <FadeInView delay={100}>
          <View style={styles.inputCard}>
            <View style={styles.inputRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>📏 Height (cm)</Text>
                <TextInput value={height} onChangeText={setHeight} keyboardType="numeric" placeholder="e.g. 175" {...ip} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>⚖️ Weight (kg)</Text>
                <TextInput value={weight} onChangeText={setWeight} keyboardType="numeric" placeholder="e.g. 72" {...ip} />
              </View>
            </View>

            <AnimatedPressable
              style={[styles.calcBtn, (!height || !weight) && { opacity: 0.5 }]}
              scaleDown={0.97}
              onPress={handleCalculate}
              disabled={!height || !weight}
            >
              <Text style={styles.calcBtnText}>🧮 Calculate BMI</Text>
            </AnimatedPressable>
          </View>
        </FadeInView>

        {/* Result */}
        {result && (
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <View style={[styles.resultCard, { borderColor: result.color + '40' }]}>
              <Text style={styles.resultEmoji}>{result.emoji}</Text>
              <Text style={[styles.resultValue, { color: result.color }]}>
                {result.value.toFixed(1)}
              </Text>
              <Text style={[styles.resultCategory, { color: result.color }]}>
                {result.category}
              </Text>

              {/* Gauge Bar */}
              <View style={styles.gauge}>
                <View style={[styles.gaugeSection, { flex: 18.5, backgroundColor: '#3B82F6' }]} />
                <View style={[styles.gaugeSection, { flex: 6.4, backgroundColor: Colors.green }]} />
                <View style={[styles.gaugeSection, { flex: 5, backgroundColor: Colors.orange }]} />
                <View style={[styles.gaugeSection, { flex: 10, backgroundColor: Colors.red }]} />
              </View>
              <View style={[styles.gaugePointer, { left: `${gaugePercent}%` }]}>
                <Text style={styles.gaugeArrow}>▼</Text>
              </View>

              {/* Tip */}
              <View style={styles.tipBox}>
                <Text style={styles.tipTitle}>💡 Recommendation</Text>
                <Text style={styles.tipText}>{result.tip}</Text>
              </View>

              <AnimatedPressable style={styles.resetBtn} scaleDown={0.95} onPress={handleReset}>
                <Text style={styles.resetBtnText}>🔄 Calculate Again</Text>
              </AnimatedPressable>
            </View>
          </Animated.View>
        )}

        {/* Reference Table */}
        <FadeInView delay={200}>
          <View style={styles.refCard}>
            <Text style={styles.refTitle}>📖 BMI Reference</Text>
            {ranges.map(r => (
              <View key={r.label} style={styles.refRow}>
                <Text style={styles.refEmoji}>{r.emoji}</Text>
                <Text style={[styles.refLabel, { color: r.color }]}>{r.label}</Text>
                <Text style={styles.refRange}>{r.range}</Text>
              </View>
            ))}
          </View>
        </FadeInView>

        {/* Quick Presets */}
        <FadeInView delay={300}>
          <Text style={styles.sectionTitle}>⚡ Quick Check</Text>
          <View style={styles.presetRow}>
            {[
              { h: '160', w: '50', label: '160cm / 50kg' },
              { h: '170', w: '70', label: '170cm / 70kg' },
              { h: '175', w: '85', label: '175cm / 85kg' },
              { h: '180', w: '100', label: '180cm / 100kg' },
            ].map(p => (
              <AnimatedPressable
                key={p.label}
                style={styles.presetChip}
                scaleDown={0.95}
                onPress={() => { setHeight(p.h); setWeight(p.w); }}
              >
                <Text style={styles.presetText}>{p.label}</Text>
              </AnimatedPressable>
            ))}
          </View>
        </FadeInView>

        <View style={{ height: 32 }} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 16, gap: 14 },

  heroCard: { backgroundColor: Colors.accentMuted, borderRadius: 16, padding: 24, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: Colors.accent + '25' },
  heroEmoji: { fontSize: 40 },
  heroTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  heroSub: { fontSize: 13, color: Colors.textSub },

  inputCard: { backgroundColor: Colors.bgCard, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border, gap: 14 },
  inputRow: { flexDirection: 'row', gap: 12 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSub, marginBottom: 4 },
  input: { backgroundColor: Colors.bgElevated },
  calcBtn: { backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  calcBtnText: { fontSize: 16, fontWeight: '600', color: '#FFF' },

  resultCard: {
    backgroundColor: Colors.bgCard, borderRadius: 16, padding: 20, borderWidth: 2, alignItems: 'center', gap: 6,
  },
  resultEmoji: { fontSize: 36 },
  resultValue: { fontSize: 48, fontWeight: '700' },
  resultCategory: { fontSize: 18, fontWeight: '600', marginBottom: 8 },

  gauge: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', width: '100%', marginTop: 8 },
  gaugeSection: { height: 8 },
  gaugePointer: { position: 'absolute', top: undefined, marginTop: -4, marginLeft: -8 },
  gaugeArrow: { fontSize: 14, color: Colors.text },

  tipBox: { backgroundColor: Colors.bgElevated, borderRadius: 12, padding: 14, width: '100%', marginTop: 12, gap: 4 },
  tipTitle: { fontSize: 14, fontWeight: '600', color: Colors.text },
  tipText: { fontSize: 13, color: Colors.textSub, lineHeight: 19 },

  resetBtn: { backgroundColor: Colors.bgElevated, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 20, marginTop: 8, borderWidth: 1, borderColor: Colors.border },
  resetBtnText: { fontSize: 13, fontWeight: '600', color: Colors.text },

  refCard: { backgroundColor: Colors.bgCard, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.border, gap: 10 },
  refTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  refRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  refEmoji: { fontSize: 14 },
  refLabel: { flex: 1, fontSize: 14, fontWeight: '600' },
  refRange: { fontSize: 13, color: Colors.textMuted, fontWeight: '500' },

  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  presetChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border },
  presetText: { fontSize: 12, fontWeight: '500', color: Colors.textSub },
});
