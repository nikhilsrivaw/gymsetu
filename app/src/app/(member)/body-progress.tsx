                                                                  
  import { useState } from 'react';                                  import { View, Text, StyleSheet, ScrollView, TextInput, Alert }  
  from 'react-native';                                               import { Stack } from 'expo-router';                             
  import { MaterialCommunityIcons } from '@expo/vector-icons';     
  import { Colors } from '@/constants/colors';                     
  import AnimatedPressable from '@/components/AnimatedPressable';
  import FadeInView from '@/components/FadeInView';

  const weightHistory = [
    { date: 'Feb 1', weight: 82 },
    { date: 'Feb 7', weight: 81.2 },
    { date: 'Feb 14', weight: 80.5 },
    { date: 'Feb 21', weight: 79.8 },
    { date: 'Feb 28', weight: 79.1 },
  ];

  const measurements = [
    { label: 'Chest', current: '96 cm', change: '-2 cm', emoji:    
  '💪', positive: true },
    { label: 'Waist', current: '82 cm', change: '-3 cm', emoji:    
  '🎯', positive: true },
    { label: 'Hips', current: '94 cm', change: '-1 cm', emoji:     
  '📏', positive: true },
    { label: 'Arms', current: '34 cm', change: '+1 cm', emoji:     
  '💪', positive: true },
    { label: 'Thighs', current: '56 cm', change: '-1.5 cm', emoji: 
  '🦵', positive: true },
  ];

  const goals = [
    { label: 'Target Weight', target: '75 kg', current: '79.1 kg', 
  percent: 60, color: Colors.accent },
    { label: 'Body Fat %', target: '12%', current: '18%', percent: 
  40, color: Colors.orange },
    { label: 'Muscle Mass', target: '65 kg', current: '61 kg',     
  percent: 75, color: Colors.green },
  ];

  export default function BodyProgressScreen() {
    const [newWeight, setNewWeight] = useState('');
    const [logged, setLogged] = useState(false);

    const maxWeight = Math.max(...weightHistory.map(w =>
  w.weight));
    const minWeight = Math.min(...weightHistory.map(w =>
  w.weight));
    const range = maxWeight - minWeight || 1;

    const handleLogWeight = () => {
      const w = parseFloat(newWeight);
      if (!w || w < 30 || w > 300) {
        Alert.alert('Invalid weight', 'Please enter a valid weight between 30-300 kg');
        return;
      }
      setLogged(true);
      setNewWeight('');
      Alert.alert('✅ Logged!', `Weight ${w} kg saved for today.`);
    };

    return (
      <>
        <Stack.Screen options={{ title: '📊 Body Progress' }} />   
        <ScrollView style={styles.container}
  contentContainerStyle={styles.content}
  showsVerticalScrollIndicator={false}>

          {/* Summary Cards */}
          <FadeInView delay={0}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryEmoji}>⚖️</Text>        
                <Text style={styles.summaryVal}>79.1</Text>        
                <Text style={styles.summaryUnit}>kg now</Text>     
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryEmoji}>📉</Text>        
                <Text style={[styles.summaryVal, { color:
  Colors.green }]}>-2.9</Text>
                <Text style={styles.summaryUnit}>kg lost</Text>    
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryEmoji}>🎯</Text>        
                <Text style={styles.summaryVal}>75</Text>
                <Text style={styles.summaryUnit}>kg goal</Text>    
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryEmoji}>📅</Text>        
                <Text style={styles.summaryVal}>28d</Text>
                <Text style={styles.summaryUnit}>tracked</Text>    
              </View>
            </View>
          </FadeInView>

          {/* Log Weight */}
          <FadeInView delay={80}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>⚖️ Log Today's        
  Weight</Text>
              <View style={styles.logRow}>
                <TextInput
                  style={styles.logInput}
                  placeholder="e.g. 78.5"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                  value={newWeight}
                  onChangeText={setNewWeight}
                />
                <Text style={styles.logUnit}>kg</Text>
                <AnimatedPressable style={styles.logBtn}
  scaleDown={0.96} onPress={handleLogWeight}>
                  <Text style={styles.logBtnText}>Log</Text>       
                </AnimatedPressable>
              </View>
            </View>
          </FadeInView>

          {/* Weight Chart */}
          <FadeInView delay={160}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>📈 Weight Trend       
  (Feb)</Text>
              <View style={styles.chart}>
                {weightHistory.map((w, i) => {
                  const barHeight = 40 + ((w.weight - minWeight) / 
  range) * 60;
                  return (
                    <View key={i} style={styles.barCol}>
                      <Text style={styles.barVal}>{w.weight}</Text>
                      <View style={[styles.bar, { height:
  barHeight, backgroundColor: Colors.accent + (i ===
  weightHistory.length - 1 ? 'FF' : '60') }]} />
                      <Text
  style={styles.barDate}>{w.date.replace('Feb ', '')}</Text>       
                    </View>
                  );
                })}
              </View>
              <View style={styles.chartLegend}>
                <Text style={styles.legendText}>Start:
  {weightHistory[0].weight} kg</Text>
                <Text style={[styles.legendText, { color:
  Colors.green }]}>
                  Lost: {(weightHistory[0].weight -
  weightHistory[weightHistory.length - 1].weight).toFixed(1)} kg   
                </Text>
              </View>
            </View>
          </FadeInView>

          {/* Goals Progress */}
          <FadeInView delay={240}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🎯 Goal
  Progress</Text>
              {goals.map(g => (
                <View key={g.label} style={styles.goalItem}>       
                  <View style={styles.goalHeader}>
                    <Text style={styles.goalLabel}>{g.label}</Text>
                    <View style={styles.goalValues}>
                      <Text
  style={styles.goalCurrent}>{g.current}</Text>
                      <Text style={styles.goalArrow}> → </Text>    
                      <Text style={[styles.goalTarget, { color:    
  g.color }]}>{g.target}</Text>
                    </View>
                  </View>
                  <View style={styles.goalBar}>
                    <View style={[styles.goalFill, { width:        
  `${g.percent}%` as any, backgroundColor: g.color }]} />
                  </View>
                  <Text style={styles.goalPercent}>{g.percent}%    
  there</Text>
                </View>
              ))}
            </View>
          </FadeInView>

          {/* Measurements */}
          <FadeInView delay={320}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>📏 Body
  Measurements</Text>
              {measurements.map(m => (
                <View key={m.label} style={styles.measRow}>        
                  <Text style={styles.measEmoji}>{m.emoji}</Text>  
                  <Text style={styles.measLabel}>{m.label}</Text>  
                  <Text
  style={styles.measCurrent}>{m.current}</Text>
                  <View style={[styles.changeBadge, {
  backgroundColor: Colors.green + '20' }]}>
                    <Text style={[styles.changeText, { color:      
  Colors.green }]}>{m.change}</Text>
                  </View>
                </View>
              ))}
            </View>
          </FadeInView>

          {/* Motivational Footer */}
          <FadeInView delay={400}>
            <View style={styles.motivCard}>
              <Text style={styles.motivEmoji}>🏆</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.motivTitle}>Keep Going!</Text> 
                <Text style={styles.motivText}>You've lost 2.9 kg  
  this month. Just 4.1 kg more to your goal!</Text>
              </View>
            </View>
          </FadeInView>

          <View style={{ height: 24 }} />
        </ScrollView>
      </>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    content: { padding: 16, gap: 12 },

    summaryRow: { flexDirection: 'row', gap: 8 },
    summaryCard: {
      flex: 1, alignItems: 'center', backgroundColor:
  Colors.bgCard,
      borderRadius: 12, paddingVertical: 14, borderWidth: 1,       
  borderColor: Colors.border, gap: 2,
    },
    summaryEmoji: { fontSize: 18 },
    summaryVal: { fontSize: 17, fontWeight: '700', color:
  Colors.text },
    summaryUnit: { fontSize: 10, color: Colors.textMuted },        

    card: { backgroundColor: Colors.bgCard, borderRadius: 16,      
  padding: 16, borderWidth: 1, borderColor: Colors.border, gap: 12 
  },
    cardTitle: { fontSize: 15, fontWeight: '700', color:
  Colors.text },

    logRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    logInput: {
      flex: 1, backgroundColor: Colors.bgElevated, borderRadius:   
  10, padding: 12,
      fontSize: 16, color: Colors.text, borderWidth: 1,
  borderColor: Colors.border,
    },
    logUnit: { fontSize: 14, color: Colors.textMuted, fontWeight:  
  '600' },
    logBtn: { backgroundColor: Colors.accent, borderRadius: 10,    
  paddingHorizontal: 20, paddingVertical: 12 },
    logBtnText: { fontSize: 14, fontWeight: '700', color: '#FFF' },

    chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, 
  height: 120, paddingTop: 8 },
    barCol: { flex: 1, alignItems: 'center', gap: 4 },
    bar: { width: '100%', borderRadius: 6 },
    barVal: { fontSize: 9, color: Colors.textMuted, fontWeight:    
  '600' },
    barDate: { fontSize: 9, color: Colors.textMuted },
    chartLegend: { flexDirection: 'row', justifyContent:
  'space-between' },
    legendText: { fontSize: 12, color: Colors.textMuted,
  fontWeight: '500' },

    goalItem: { gap: 6 },
    goalHeader: { flexDirection: 'row', justifyContent:
  'space-between', alignItems: 'center' },
    goalLabel: { fontSize: 13, fontWeight: '600', color:
  Colors.text },
    goalValues: { flexDirection: 'row', alignItems: 'center' },    
    goalCurrent: { fontSize: 12, color: Colors.textMuted },        
    goalArrow: { fontSize: 12, color: Colors.textMuted },
    goalTarget: { fontSize: 12, fontWeight: '700' },
    goalBar: { height: 6, backgroundColor: Colors.border,
  borderRadius: 3, overflow: 'hidden' },
    goalFill: { height: 6, borderRadius: 3 },
    goalPercent: { fontSize: 11, color: Colors.textMuted },        

    measRow: { flexDirection: 'row', alignItems: 'center', gap: 10,
   paddingVertical: 4 },
    measEmoji: { fontSize: 16, width: 24 },
    measLabel: { flex: 1, fontSize: 14, fontWeight: '500', color:  
  Colors.text },
    measCurrent: { fontSize: 14, fontWeight: '600', color:
  Colors.text },
    changeBadge: { borderRadius: 6, paddingHorizontal: 8,
  paddingVertical: 3 },
    changeText: { fontSize: 12, fontWeight: '700' },

    motivCard: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: Colors.accentMuted, borderRadius: 14,       
  padding: 16,
      borderWidth: 1, borderColor: Colors.accent + '25',
    },
    motivEmoji: { fontSize: 32 },
    motivTitle: { fontSize: 15, fontWeight: '700', color:
  Colors.text },
    motivText: { fontSize: 13, color: Colors.textSub, marginTop: 2 
  },
  });