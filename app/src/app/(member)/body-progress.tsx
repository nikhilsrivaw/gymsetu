 import { useState } from 'react';                                  import { View, Text, StyleSheet, ScrollView, TextInput, Alert }  
  from 'react-native';                                               import { Stack } from 'expo-router';                             
  import { Colors } from '@/constants/colors';                       import { Fonts } from '@/constants/fonts';                       
  import AnimatedPressable from '@/components/AnimatedPressable';  
  import FadeInView from '@/components/FadeInView';                                                                                   
  const weightHistory = [                                          
    { date: '01', weight: 82.0 },
    { date: '07', weight: 81.2 },
    { date: '14', weight: 80.5 },
    { date: '21', weight: 79.8 },
    { date: '28', weight: 79.1 },
  ];

  const measurements = [
    { label: 'Chest',  current: '96 cm',  change: '-2 cm',
  positive: true },
    { label: 'Waist',  current: '82 cm',  change: '-3 cm',
  positive: true },
    { label: 'Hips',   current: '94 cm',  change: '-1 cm',
  positive: true },
    { label: 'Arms',   current: '34 cm',  change: '+1 cm',
  positive: true },
    { label: 'Thighs', current: '56 cm',  change: '-1.5 cm',       
  positive: true },
  ];

  const goals = [
    { label: 'Target Weight', target: '75 kg', current: '79.1 kg', 
  percent: 60, color: Colors.accent },
    { label: 'Body Fat %',    target: '12%',   current: '18%',     
  percent: 40, color: Colors.orange },
    { label: 'Muscle Mass',   target: '65 kg', current: '61 kg',   
  percent: 75, color: Colors.green },
  ];

  const summaryStats = [
    { val: '79.1', unit: 'kg',   label: 'CURRENT' },
    { val: '-2.9', unit: 'kg',   label: 'LOST',    color:
  Colors.green },
    { val: '75',   unit: 'kg',   label: 'GOAL' },
    { val: '28',   unit: 'days', label: 'TRACKED' },
  ];

  export default function BodyProgressScreen() {
    const [newWeight, setNewWeight] = useState('');

    const maxW = Math.max(...weightHistory.map(w => w.weight));    
    const minW = Math.min(...weightHistory.map(w => w.weight));    
    const range = maxW - minW || 1;

    const handleLogWeight = () => {
      const w = parseFloat(newWeight);
      if (!w || w < 30 || w > 300) {
        Alert.alert('Invalid weight', 'Enter a valid weight between 30–300 kg');
        return;
      }
      setNewWeight('');
      Alert.alert('Logged', `Weight ${w} kg saved for today.`);    
    };

    return (
      <>
        <Stack.Screen options={{ title: 'Body Progress' }} />      
        <ScrollView style={styles.container}
  contentContainerStyle={styles.content}
  showsVerticalScrollIndicator={false}>

          {/* ── Summary Row ───────────────────── */}
          <FadeInView delay={0}>
            <View style={styles.summaryRow}>
              {summaryStats.map((s, i) => (
                <View key={i} style={styles.summaryCard}>
                  <Text style={[styles.summaryVal, s.color ? {     
  color: s.color } : {}]}>{s.val}</Text>
                  <Text style={styles.summaryUnit}>{s.unit}</Text> 
                  <Text
  style={styles.summaryLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
          </FadeInView>

          {/* ── Log Weight ────────────────────── */}
          <FadeInView delay={80}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>LOG TODAY'S
  WEIGHT</Text>
              <View style={styles.logRow}>
                <TextInput
                  style={styles.logInput}
                  placeholder="e.g.  78.5"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                  value={newWeight}
                  onChangeText={setNewWeight}
                />
                <Text style={styles.logUnit}>KG</Text>
                <AnimatedPressable style={styles.logBtn}
  scaleDown={0.96} onPress={handleLogWeight}>
                  <Text style={styles.logBtnText}>LOG</Text>       
                </AnimatedPressable>
              </View>
            </View>
          </FadeInView>

          {/* ── Weight Chart ──────────────────── */}
          <FadeInView delay={160}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>WEIGHT TREND —      
  FEB</Text>
                <Text style={styles.cardSub}>
                  <Text style={{ color: Colors.green }}>
                    −{(weightHistory[0].weight -
  weightHistory[weightHistory.length - 1].weight).toFixed(1)} kg   
                  </Text>
                  {' '}this month
                </Text>
              </View>
              <View style={styles.chart}>
                {weightHistory.map((w, i) => {
                  const barH = 32 + ((w.weight - minW) / range) *  
  64;
                  const isLatest = i === weightHistory.length - 1; 
                  return (
                    <View key={i} style={styles.barCol}>
                      <Text style={[styles.barVal, isLatest && {   
  color: Colors.accent }]}>
                        {w.weight}
                      </Text>
                      <View style={styles.barTrack}>
                        <View style={[styles.bar, {
                          height: barH,
                          backgroundColor: isLatest ? Colors.accent
   : Colors.accent + '40',
                        }]} />
                      </View>
                      <Text style={styles.barDate}>{w.date}</Text> 
                    </View>
                  );
                })}
              </View>
            </View>
          </FadeInView>

          {/* ── Goal Progress ─────────────────── */}
          <FadeInView delay={240}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>GOAL PROGRESS</Text>  
              {goals.map((g, i) => (
                <View key={g.label} style={[styles.goalItem, i <   
  goals.length - 1 && styles.goalDivider]}>
                  <View style={styles.goalHeader}>
                    <Text
  style={styles.goalLabel}>{g.label.toUpperCase()}</Text>
                    <View style={styles.goalValues}>
                      <Text
  style={styles.goalCurrent}>{g.current}</Text>
                      <Text style={styles.goalArrow}>  →  </Text>  
                      <Text style={[styles.goalTarget, { color:    
  g.color }]}>{g.target}</Text>
                    </View>
                  </View>
                  <View style={styles.goalBarTrack}>
                    <View style={[styles.goalFill, { width:        
  `${g.percent}%` as any, backgroundColor: g.color }]} />
                  </View>
                  <Text style={[styles.goalPct, { color: g.color   
  }]}>{g.percent}% complete</Text>
                </View>
              ))}
            </View>
          </FadeInView>

          {/* ── Measurements ─────────────────── */}
          <FadeInView delay={320}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>BODY
  MEASUREMENTS</Text>
              {measurements.map((m, i) => (
                <View key={m.label} style={[styles.measRow, i <    
  measurements.length - 1 && styles.measDivider]}>
                  <Text
  style={styles.measLabel}>{m.label.toUpperCase()}</Text>
                  <Text
  style={styles.measCurrent}>{m.current}</Text>
                  <View style={[styles.changeBadge, {
  backgroundColor: Colors.green + '18' }]}>
                    <Text style={[styles.changeText, { color:      
  Colors.green }]}>{m.change}</Text>
                  </View>
                </View>
              ))}
            </View>
          </FadeInView>

          {/* ── Motivational Banner ───────────── */}
          <FadeInView delay={400}>
            <View style={styles.motivCard}>
              <View style={styles.motivGlow} />
              <View style={styles.motivLeft}>
                <Text style={styles.motivMicro}>PROGRESS
  REPORT</Text>
                <Text style={styles.motivTitle}>KEEP PUSHING</Text>
                <Text style={styles.motivText}>2.9 kg down — 4.1 kg
   to your goal!</Text>
              </View>
              <Text style={styles.motivNum}>60%</Text>
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

    summaryRow: { flexDirection: 'row', gap: 8 },
    summaryCard: {
      flex: 1, alignItems: 'center', gap: 2,
      backgroundColor: Colors.bgCard,
      borderRadius: 12, paddingVertical: 14,
      borderWidth: 1, borderColor: Colors.border,
    },
    summaryVal: {
      fontFamily: Fonts.condensedBold,
      fontSize: 20, color: Colors.text,
    },
    summaryUnit: {
      fontFamily: Fonts.medium,
      fontSize: 9, color: Colors.accent, letterSpacing: 0.5,       
    },
    summaryLabel: {
      fontFamily: Fonts.medium,
      fontSize: 8, color: Colors.textMuted, letterSpacing: 0.8,    
    },

    card: {
      backgroundColor: Colors.bgCard, borderRadius: 16, padding:   
  16,
      borderWidth: 1, borderColor: Colors.border, gap: 12,
    },
    cardHeader: { flexDirection: 'row', justifyContent:
  'space-between', alignItems: 'center' },
    cardTitle: {
      fontFamily: Fonts.bold,
      fontSize: 11, color: Colors.textMuted, letterSpacing: 1.2,   
    },
    cardSub: {
      fontFamily: Fonts.medium,
      fontSize: 12, color: Colors.textMuted,
    },

    logRow: { flexDirection: 'row', alignItems: 'center', gap: 10  
  },
    logInput: {
      flex: 1, backgroundColor: Colors.bgElevated, borderRadius:   
  10, padding: 12,
      fontFamily: Fonts.bold, fontSize: 16, color: Colors.text,    
      borderWidth: 1, borderColor: Colors.border,
    },
    logUnit: {
      fontFamily: Fonts.condensedBold,
      fontSize: 14, color: Colors.textMuted, letterSpacing: 1,     
    },
    logBtn: {
      backgroundColor: Colors.accent, borderRadius: 10,
      paddingHorizontal: 20, paddingVertical: 13,
    },
    logBtnText: {
      fontFamily: Fonts.bold, fontSize: 12, color: '#FFF',
  letterSpacing: 0.8,
    },

    chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, 
  height: 110 },
    barCol: { flex: 1, alignItems: 'center', gap: 4 },
    barTrack: { width: '100%', alignItems: 'center',
  justifyContent: 'flex-end' },
    bar: { width: '80%', borderRadius: 4, minHeight: 4 },
    barVal: {
      fontFamily: Fonts.condensedSemi,
      fontSize: 9, color: Colors.textMuted,
    },
    barDate: {
      fontFamily: Fonts.medium,
      fontSize: 9, color: Colors.textMuted,
    },

    goalItem: { gap: 6, paddingVertical: 4 },
    goalDivider: { borderBottomWidth: 1, borderBottomColor:        
  Colors.border, paddingBottom: 12, marginBottom: 4 },
    goalHeader: { flexDirection: 'row', justifyContent:
  'space-between', alignItems: 'center' },
    goalLabel: {
      fontFamily: Fonts.bold,
      fontSize: 11, color: Colors.text, letterSpacing: 0.6,        
    },
    goalValues: { flexDirection: 'row', alignItems: 'center' },    
    goalCurrent: { fontFamily: Fonts.medium, fontSize: 12, color:  
  Colors.textMuted },
    goalArrow: { fontFamily: Fonts.medium, fontSize: 11, color:    
  Colors.textMuted },
    goalTarget: { fontFamily: Fonts.bold, fontSize: 12 },
    goalBarTrack: { height: 4, backgroundColor: Colors.border,     
  borderRadius: 2, overflow: 'hidden' },
    goalFill: { height: 4, borderRadius: 2 },
    goalPct: {
      fontFamily: Fonts.medium,
      fontSize: 10, letterSpacing: 0.4,
    },

    measRow: { flexDirection: 'row', alignItems: 'center', gap: 10,
   paddingVertical: 6 },
    measDivider: { borderBottomWidth: 1, borderBottomColor:        
  Colors.border },
    measLabel: {
      flex: 1,
      fontFamily: Fonts.bold,
      fontSize: 11, color: Colors.textMuted, letterSpacing: 0.6,   
    },
    measCurrent: {
      fontFamily: Fonts.condensedSemi,
      fontSize: 15, color: Colors.text,
    },
    changeBadge: { borderRadius: 6, paddingHorizontal: 8,
  paddingVertical: 3 },
    changeText: {
      fontFamily: Fonts.bold, fontSize: 11, letterSpacing: 0.3,    
    },

    motivCard: {
      backgroundColor: Colors.bgCard, borderRadius: 18, padding:   
  20,
      flexDirection: 'row', alignItems: 'center', justifyContent:  
  'space-between',
      borderWidth: 1, borderColor: Colors.accent + '25', overflow: 
  'hidden',
    },
    motivGlow: {
      position: 'absolute', left: -20, top: -20,
      width: 100, height: 100, borderRadius: 50,
      backgroundColor: Colors.accentGlow,
    },
    motivLeft: { gap: 4 },
    motivMicro: {
      fontFamily: Fonts.medium,
      fontSize: 9, color: Colors.accent, letterSpacing: 1.2,       
    },
    motivTitle: {
      fontFamily: Fonts.condensedBold,
      fontSize: 26, color: Colors.text, letterSpacing: 0.5,        
    },
    motivText: {
      fontFamily: Fonts.regular,
      fontSize: 12, color: Colors.textMuted,
    },
    motivNum: {
      fontFamily: Fonts.condensedBold,
      fontSize: 48, color: Colors.accent, opacity: 0.25,
    },
  });