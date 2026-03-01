 import { useState, useRef } from 'react';                          import { View, Text, StyleSheet, ScrollView, Animated } from       'react-native';                                                    import { TextInput } from 'react-native-paper';                  
  import { Stack } from 'expo-router';                               import { Colors } from '@/constants/colors';                     
  import { Fonts } from '@/constants/fonts';                         import AnimatedPressable from '@/components/AnimatedPressable';  
  import FadeInView from '@/components/FadeInView';                
                                                                     interface BMIResult {                                            
    value: number;                                                 
    category: string;
    color: string;
    tip: string;
  }

  function calculateBMI(heightCm: number, weightKg: number):       
  BMIResult {
    const heightM = heightCm / 100;
    const bmi = weightKg / (heightM * heightM);
    if (bmi < 18.5) return { value: bmi, category: 'UNDERWEIGHT',  
  color: '#3B82F6', tip: 'Consider increasing calorie intake with nutrient-rich foods. Add strength training to build muscle mass.'};if (bmi < 25)  return { value: bmi, category: 'NORMAL', color: Colors.green,  tip: 'Great job! Maintain your current lifestyle with regular exercise and a balanced diet.' };if (bmi < 30)  return { value: bmi, category: 'OVERWEIGHT',  color: Colors.orange, tip: 'Focus on portion control and increase cardio. Aim for 150 mins of moderate exercise per week.' }; return           { value: bmi, category: 'OBESE' , color: Colors.red,    tip: 'Consult a healthcare professional.Start with low-impact exercises like walking or swimming.' };    
  }

  const ranges = [
    { label: 'Underweight', range: '< 18.5',      color: '#3B82F6' 
  },
    { label: 'Normal',      range: '18.5 – 24.9', color:
  Colors.green },
    { label: 'Overweight',  range: '25.0 – 29.9', color:
  Colors.orange },
    { label: 'Obese',       range: '≥ 30.0',      color: Colors.red
   },
  ];

  const presets = [
    { h: '160', w: '50', label: '160 / 50' },
    { h: '170', w: '70', label: '170 / 70' },
    { h: '175', w: '85', label: '175 / 85' },
    { h: '180', w: '100', label: '180 / 100' },
  ];

  export default function BMICalculatorScreen() {
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [result, setResult] = useState<BMIResult | null>(null);  
    const scaleAnim = useRef(new Animated.Value(0)).current;       

    const ip = {
      mode: 'outlined' as const,
      style: styles.input,
      outlineColor: Colors.border,
      activeOutlineColor: Colors.accent,
      textColor: Colors.text,
      theme: { colors: { onSurfaceVariant: Colors.textMuted } },   
    };

    const handleCalculate = () => {
      const h = parseFloat(height);
      const w = parseFloat(weight);
      if (!h || !w || h < 50 || h > 300 || w < 10 || w > 500)      
  return;
      const r = calculateBMI(h, w);
      setResult(r);
      scaleAnim.setValue(0);
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver:    
  true, speed: 8, bounciness: 12 }).start();
    };

    const handleReset = () => {
      setHeight('');
      setWeight('');
      setResult(null);
    };

    const gaugePercent = result ? Math.min(Math.max((result.value /
   40) * 100, 5), 95) : 0;

    return (
      <>
        <Stack.Screen options={{ title: '⚖️ BMI Calculator' }} />  
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <FadeInView delay={0}>
            <View style={styles.heroCard}>
              <View style={styles.heroAccentBar} />
              <View style={styles.heroInner}>
                <Text style={styles.heroEmoji}>⚖️</Text>
                <View>
                  <Text style={styles.heroTitle}>BODY MASS
  INDEX</Text>
                  <Text style={styles.heroSub}>Enter height &      
  weight to calculate your BMI</Text>
                </View>
              </View>
            </View>
          </FadeInView>

          {/* Inputs */}
          <FadeInView delay={80}>
            <View style={styles.inputCard}>
              <View style={styles.inputRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>HEIGHT
  (CM)</Text>
                  <TextInput
                    value={height}
                    onChangeText={setHeight}
                    keyboardType="numeric"
                    placeholder="e.g. 175"
                    {...ip}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>WEIGHT
  (KG)</Text>
                  <TextInput
                    value={weight}
                    onChangeText={setWeight}
                    keyboardType="numeric"
                    placeholder="e.g. 72"
                    {...ip}
                  />
                </View>
              </View>

              {/* Quick presets */}
              <View>
                <Text style={styles.presetLabel}>QUICK PRESETS (cm 
  / kg)</Text>
                <View style={styles.presetRow}>
                  {presets.map(p => (
                    <AnimatedPressable
                      key={p.label}
                      style={[styles.presetChip, height === p.h && 
  weight === p.w && styles.presetChipActive]}
                      scaleDown={0.93}
                      onPress={() => { setHeight(p.h);
  setWeight(p.w); }}
                    >
                      <Text style={[styles.presetText, height ===  
  p.h && weight === p.w && styles.presetTextActive]}>
                        {p.label}
                      </Text>
                    </AnimatedPressable>
                  ))}
                </View>
              </View>

              <AnimatedPressable
                style={[styles.calcBtn, (!height || !weight) &&    
  styles.calcBtnDisabled]}
                scaleDown={0.97}
                onPress={handleCalculate}
                disabled={!height || !weight}
              >
                <Text style={styles.calcBtnText}>CALCULATE
  BMI</Text>
              </AnimatedPressable>
            </View>
          </FadeInView>

          {/* Result */}
          {result && (
            <Animated.View style={{ transform: [{ scale: scaleAnim 
  }] }}>
              <View style={[styles.resultCard, { borderColor:      
  result.color + '50' }]}>
                {/* BMI Value */}
                <View style={styles.resultTop}>
                  <View style={styles.resultValBlock}>
                    <Text style={[styles.resultValue, { color:     
  result.color }]}>
                      {result.value.toFixed(1)}
                    </Text>
                    <Text style={styles.resultUnit}>BMI</Text>     
                  </View>
                  <View style={[styles.resultCategoryChip, {       
  backgroundColor: result.color + '18', borderColor: result.color +
   '40' }]}>
                    <Text style={[styles.resultCategory, { color:  
  result.color }]}>{result.category}</Text>
                  </View>
                </View>

                {/* Gauge */}
                <View style={styles.gaugeWrap}>
                  <View style={styles.gauge}>
                    <View style={[styles.gaugeSection, { flex:     
  18.5, backgroundColor: '#3B82F6' }]} />
                    <View style={[styles.gaugeSection, { flex: 6.4,
    backgroundColor: Colors.green }]} />
                    <View style={[styles.gaugeSection, { flex: 5,  
    backgroundColor: Colors.orange }]} />
                    <View style={[styles.gaugeSection, { flex: 10, 
    backgroundColor: Colors.red }]} />
                  </View>
                  <View style={[styles.gaugePointer, { left:       
  `${gaugePercent}%` as any }]}>
                    <Text style={[styles.gaugeArrow, { color:      
  result.color }]}>▼</Text>
                  </View>
                </View>

                {/* Tip */}
                <View style={styles.tipBox}>
                  <Text
  style={styles.tipTitle}>RECOMMENDATION</Text>
                  <Text style={styles.tipText}>{result.tip}</Text> 
                </View>

                <AnimatedPressable style={styles.resetBtn}
  scaleDown={0.95} onPress={handleReset}>
                  <Text style={styles.resetBtnText}>CALCULATE      
  AGAIN</Text>
                </AnimatedPressable>
              </View>
            </Animated.View>
          )}

          {/* Reference Table */}
          <FadeInView delay={200}>
            <View style={styles.refCard}>
              <Text style={styles.refTitle}>BMI REFERENCE</Text>   
              {ranges.map((r, i) => (
                <View key={r.label} style={[styles.refRow, i <     
  ranges.length - 1 && styles.refRowBorder]}>
                  <View style={[styles.refDot, { backgroundColor:  
  r.color }]} />
                  <Text style={[styles.refLabel, { color: r.color  
  }]}>{r.label}</Text>
                  <Text style={styles.refRange}>{r.range}</Text>   
                </View>
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
    content: { padding: 16, gap: 12 },

    /* Hero */
    heroCard: {
      flexDirection: 'row', backgroundColor: Colors.bgCard,        
      borderRadius: 16, overflow: 'hidden',
      borderWidth: 1, borderColor: Colors.accent + '30',
    },
    heroAccentBar: { width: 4, backgroundColor: Colors.accent },   
    heroInner: { flex: 1, flexDirection: 'row', alignItems:        
  'center', gap: 14, padding: 16 },
    heroEmoji: { fontSize: 32 },
    heroTitle: { fontSize: 15, fontFamily: Fonts.bold, color:      
  Colors.text, letterSpacing: 1.2 },
    heroSub: { fontSize: 12, fontFamily: Fonts.regular, color:     
  Colors.textMuted, marginTop: 3 },

    /* Input */
    inputCard: { backgroundColor: Colors.bgCard, borderRadius: 16, 
  padding: 16, borderWidth: 1, borderColor: Colors.border, gap: 14 
  },
    inputRow: { flexDirection: 'row', gap: 12 },
    inputLabel: { fontSize: 9, fontFamily: Fonts.bold, color:      
  Colors.textMuted, letterSpacing: 1.3, marginBottom: 6 },
    input: { backgroundColor: Colors.bgElevated },

    presetLabel: { fontSize: 9, fontFamily: Fonts.bold, color:     
  Colors.textMuted, letterSpacing: 1.3, marginBottom: 8 },
    presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, 
    presetChip: { paddingHorizontal: 12, paddingVertical: 7,       
  borderRadius: 8, backgroundColor: Colors.bgElevated, borderWidth:
   1, borderColor: Colors.border },
    presetChipActive: { backgroundColor: Colors.accentMuted,       
  borderColor: Colors.accent },
    presetText: { fontSize: 11, fontFamily: Fonts.medium, color:   
  Colors.textMuted },
    presetTextActive: { color: Colors.accent, fontFamily:
  Fonts.bold },

    calcBtn: { backgroundColor: Colors.accent, borderRadius: 12,   
  paddingVertical: 15, alignItems: 'center' },
    calcBtnDisabled: { opacity: 0.45 },
    calcBtnText: { fontSize: 13, fontFamily: Fonts.bold, color:    
  '#FFF', letterSpacing: 1.5 },

    /* Result */
    resultCard: {
      backgroundColor: Colors.bgCard, borderRadius: 16, padding:   
  20,
      borderWidth: 2, gap: 14,
    },
    resultTop: { flexDirection: 'row', alignItems: 'center',       
  justifyContent: 'space-between' },
    resultValBlock: { flexDirection: 'row', alignItems: 'baseline',
   gap: 6 },
    resultValue: { fontSize: 52, fontFamily: Fonts.condensedBold,  
  lineHeight: 56 },
    resultUnit: { fontSize: 14, fontFamily: Fonts.bold, color:     
  Colors.textMuted, letterSpacing: 1 },
    resultCategoryChip: { borderRadius: 10, paddingHorizontal: 14, 
  paddingVertical: 8, borderWidth: 1 },
    resultCategory: { fontSize: 14, fontFamily: Fonts.bold,        
  letterSpacing: 1.5 },

    gaugeWrap: { position: 'relative', paddingBottom: 16 },        
    gauge: { flexDirection: 'row', height: 8, borderRadius: 4,     
  overflow: 'hidden' },
    gaugeSection: { height: 8 },
    gaugePointer: { position: 'absolute', bottom: 0, marginLeft: -6
   },
    gaugeArrow: { fontSize: 14 },

    tipBox: { backgroundColor: Colors.bgElevated, borderRadius: 12,
   padding: 14, gap: 6 },
    tipTitle: { fontSize: 10, fontFamily: Fonts.bold, color:       
  Colors.accent, letterSpacing: 1.5 },
    tipText: { fontSize: 13, fontFamily: Fonts.regular, color:     
  Colors.textSub, lineHeight: 20 },

    resetBtn: { backgroundColor: Colors.bgElevated, borderRadius:  
  10, paddingVertical: 11, alignItems: 'center', borderWidth: 1,   
  borderColor: Colors.border },
    resetBtnText: { fontSize: 11, fontFamily: Fonts.bold, color:   
  Colors.textMuted, letterSpacing: 1.3 },

    /* Reference */
    refCard: { backgroundColor: Colors.bgCard, borderRadius: 14,   
  padding: 16, borderWidth: 1, borderColor: Colors.border, gap: 0  
  },
    refTitle: { fontSize: 11, fontFamily: Fonts.bold, color:       
  Colors.accent, letterSpacing: 1.5, marginBottom: 12 },
    refRow: { flexDirection: 'row', alignItems: 'center', gap: 10, 
  paddingVertical: 10 },
    refRowBorder: { borderBottomWidth: 1, borderBottomColor:       
  Colors.border },
    refDot: { width: 8, height: 8, borderRadius: 4 },
    refLabel: { flex: 1, fontSize: 14, fontFamily: Fonts.bold },   
    refRange: { fontSize: 14, fontFamily: Fonts.condensedBold,     
  color: Colors.textMuted },
  });