 import { useState } from 'react';                                  import { View, Text, StyleSheet, ScrollView } from               
  'react-native';                                                    import { Stack } from 'expo-router';                             
  import { Colors } from '@/constants/colors';                       import { Fonts } from '@/constants/fonts';                       
  import AnimatedPressable from '@/components/AnimatedPressable';  
  import FadeInView from '@/components/FadeInView';                                                                                   
  interface Meal {                                                 
    id: number; time: string; label: string; items: string[];    
    calories: number; protein: number; checked: boolean;
  }

  const initialMeals: Meal[] = [
    { id: 1, time: '6:30 AM',  label: 'Early Morning',     items:  
  ['1 glass warm water with lemon', '5 soaked almonds', ' 2 walnuts'],calories: 80,  protein: 2,  checked: false },
    { id: 2, time: '8:00 AM',  label: 'Breakfast',          items: 
  ['4 egg whites + 1 whole egg omelette', '2 whole wheat toast', '1banana', '1 cup green tea'],calories: 420, protein: 32, checked: false },
    { id: 3, time: '11:00 AM', label: 'Mid Morning Snack',  items: 
  ['1 scoop whey protein shake', '1 apple', 'Handful of mixed nuts'],calories: 280, protein: 26, checked: false },
    { id: 4, time: '1:30 PM',  label: 'Lunch',              items: 
  ['2 chapati', '1 cup brown rice', '150g grilled chicken breast', 
  '1 cup dal', 'Mixed salad with olive oil'],
  calories: 680, protein: 48, checked: false },
    { id: 5, time: '4:30 PM',  label: 'Pre-Workout',        items: 
  ['1 banana', '1 cup black coffee (no sugar)', '5 dates'],        

  calories: 180, protein: 3,  checked: false },
    { id: 6, time: '8:00 PM',  label: 'Dinner',             items: 
  ['150g fish / paneer', '2 chapati', '1 cup vegetables', '1 cup  curd'], calories: 520, protein: 42, checked: false },
  ];

  const totalCalories = initialMeals.reduce((a, m) => a +
  m.calories, 0);
  const totalProtein  = initialMeals.reduce((a, m) => a +
  m.protein,  0);
  const calorieGoal   = 2200;
  const proteinGoal   = 160;

  export default function DietPlanScreen() {
    const [meals, setMeals] = useState<Meal[]>(initialMeals);      

    const toggle = (id: number) =>
      setMeals(prev => prev.map(m => m.id === id ? { ...m, checked:
   !m.checked } : m));

    const eaten          = meals.filter(m => m.checked);
    const caloriesEaten  = eaten.reduce((a, m) => a + m.calories,  
  0);
    const proteinEaten   = eaten.reduce((a, m) => a + m.protein,   
  0);
    const calPct         = Math.min(Math.round((caloriesEaten /    
  calorieGoal) * 100), 100);
    const proPct         = Math.min(Math.round((proteinEaten  /    
  proteinGoal)  * 100), 100);
    const mealPct        = Math.round((eaten.length / meals.length)
   * 100);

    return (
      <>
        <Stack.Screen options={{ title: 'Diet Plan' }} />
        <ScrollView style={styles.container}
  contentContainerStyle={styles.content}
  showsVerticalScrollIndicator={false}>

          {/* ── Macro Dashboard ───────────────── */}
          <FadeInView delay={0}>
            <View style={styles.macroCard}>
              <View style={styles.macroCardGlow} />
              <Text style={styles.sectionLabel}>TODAY'S
  NUTRITION</Text>

              <View style={styles.macroRow}>
                {[
                  { val: caloriesEaten, goal: calorieGoal, unit:   
  'kcal', label: 'CALORIES', pct: calPct, color: Colors.orange },  
                  { val: proteinEaten,  goal: proteinGoal, unit:   
  'g',    label: 'PROTEIN',  pct: proPct, color: Colors.accent },  
                  { val: eaten.length,  goal: meals.length, unit:  
  '',    label: 'MEALS',    pct: mealPct, color: Colors.green },   
                ].map((m, i) => (
                  <View key={i} style={styles.macroBox}>
                    <Text style={[styles.macroVal, { color: m.color
   }]}>{m.val}{m.unit}</Text>
                    <Text style={styles.macroGoal}>/
  {m.goal}{m.unit}</Text>
                    <Text
  style={styles.macroLabel}>{m.label}</Text>
                    <View style={styles.macroBarTrack}>
                      <View style={[styles.macroBarFill, { width:  
  `${m.pct}%` as any, backgroundColor: m.color }]} />
                    </View>
                    <Text style={[styles.macroPct, { color: m.color
   }]}>{m.pct}%</Text>
                  </View>
                ))}
              </View>
            </View>
          </FadeInView>

          {/* ── Meal Cards ────────────────────── */}
          <Text style={styles.sectionLabel}>MEAL SCHEDULE  —       
  {meals.length} MEALS</Text>

          {meals.map((meal, i) => (
            <FadeInView key={meal.id} delay={80 + i * 65}>
              <AnimatedPressable
                style={[styles.mealCard, meal.checked &&
  styles.mealCardDone]}
                scaleDown={0.98}
                onPress={() => toggle(meal.id)}
              >
                {/* Left time bar */}
                <View style={[styles.timeBar, { backgroundColor:   
  meal.checked ? Colors.green : Colors.accent }]} />

                <View style={styles.mealContent}>
                  <View style={styles.mealTop}>
                    <View style={styles.mealMeta}>
                      <Text
  style={styles.mealTime}>{meal.time}</Text>
                      <Text style={[styles.mealLabel, meal.checked 
  && { color: Colors.green }]}>
                        {meal.label.toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.mealNums}>
                      <Text style={[styles.mealCal, { color:       
  Colors.orange }]}>{meal.calories}</Text>
                      <Text style={styles.mealCalUnit}>kcal</Text> 
                    </View>
                    <View style={styles.mealNums}>
                      <Text style={[styles.mealCal, { color:       
  Colors.accent }]}>{meal.protein}g</Text>
                      <Text style={styles.mealCalUnit}>prot</Text> 
                    </View>
                    <View style={[styles.checkbox, meal.checked && 
  styles.checkboxDone]}>
                      {meal.checked && <Text
  style={styles.checkmark}>✓</Text>}
                    </View>
                  </View>

                  <View style={styles.itemsList}>
                    {meal.items.map((item, idx) => (
                      <View key={idx} style={styles.itemRow}>      
                        <View style={[styles.itemDot, meal.checked 
  && { backgroundColor: Colors.green }]} />
                        <Text style={[styles.itemText, meal.checked
   && styles.itemTextDone]}>{item}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </AnimatedPressable>
            </FadeInView>
          ))}

          {/* ── Day Summary ───────────────────── */}
          <FadeInView delay={500}>
            <View style={styles.summaryCard}>
              <Text style={styles.sectionLabel}>FULL DAY
  SUMMARY</Text>
              <View style={styles.summaryRow}>
                {[
                  { val: totalCalories, label: 'TOTAL KCAL',       
  color: Colors.orange },
                  { val: `${totalProtein}g`, label: 'TOTAL PROTEIN', color: Colors.accent },
                  { val: meals.length, label: 'TOTAL MEALS',       
  color: Colors.green },
                ].map((s, i) => (
                  <View key={i} style={styles.summaryItem}>        
                    <Text style={[styles.summaryVal, { color:      
  s.color }]}>{s.val}</Text>
                    <Text
  style={styles.summaryLabel}>{s.label}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.tipBox}>
                <View style={styles.tipDot} />
                <Text style={styles.tipText}>
                  Drink 500ml water before each meal to improve    
  digestion and feel fuller.
                </Text>
              </View>
            </View>
          </FadeInView>

          <View style={{ height: 32 }} />
        </ScrollView>
      </>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    content: { padding: 16, gap: 10 },

    sectionLabel: {
      fontFamily: Fonts.medium,
      fontSize: 9, color: Colors.textMuted,
      letterSpacing: 1.5, marginVertical: 4,
    },

    // Macro card
    macroCard: {
      backgroundColor: Colors.bgCard, borderRadius: 18, padding:   
  18,
      borderWidth: 1, borderColor: Colors.border, gap: 14,
  overflow: 'hidden',
    },
    macroCardGlow: {
      position: 'absolute', top: -30, right: -20,
      width: 120, height: 120, borderRadius: 60,
      backgroundColor: Colors.accentGlow,
    },
    macroRow: { flexDirection: 'row' },
    macroBox: { flex: 1, alignItems: 'center', gap: 3 },
    macroVal: {
      fontFamily: Fonts.condensedBold,
      fontSize: 22,
    },
    macroGoal: {
      fontFamily: Fonts.medium,
      fontSize: 10, color: Colors.textMuted,
    },
    macroLabel: {
      fontFamily: Fonts.medium,
      fontSize: 8, color: Colors.textMuted, letterSpacing: 0.8,    
    },
    macroBarTrack: {
      width: '80%', height: 3, backgroundColor: Colors.border,     
      borderRadius: 2, overflow: 'hidden',
    },
    macroBarFill: { height: 3, borderRadius: 2 },
    macroPct: {
      fontFamily: Fonts.condensedSemi,
      fontSize: 11,
    },

    // Meal cards
    mealCard: {
      backgroundColor: Colors.bgCard, borderRadius: 14,
      borderWidth: 1, borderColor: Colors.border,
      flexDirection: 'row', overflow: 'hidden',
    },
    mealCardDone: {
      borderColor: Colors.green + '30',
      backgroundColor: '#121A12',
    },
    timeBar: { width: 3 },
    mealContent: { flex: 1, padding: 14, gap: 10 },
    mealTop: { flexDirection: 'row', alignItems: 'center', gap: 10 
  },
    mealMeta: { flex: 1 },
    mealTime: {
      fontFamily: Fonts.medium,
      fontSize: 10, color: Colors.textMuted, letterSpacing: 0.5,   
    },
    mealLabel: {
      fontFamily: Fonts.condensedBold,
      fontSize: 15, color: Colors.text, letterSpacing: 0.3,        
    },
    mealNums: { alignItems: 'center' },
    mealCal: {
      fontFamily: Fonts.condensedBold,
      fontSize: 15,
    },
    mealCalUnit: {
      fontFamily: Fonts.medium,
      fontSize: 8, color: Colors.textMuted, letterSpacing: 0.5,    
    },
    checkbox: {
      width: 24, height: 24, borderRadius: 6,
      borderWidth: 1.5, borderColor: Colors.border,
      justifyContent: 'center', alignItems: 'center',
    },
    checkboxDone: { backgroundColor: Colors.green, borderColor:    
  Colors.green },
    checkmark: {
      fontFamily: Fonts.bold,
      fontSize: 12, color: '#FFF',
    },

    itemsList: { gap: 5, paddingLeft: 4 },
    itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8  
  },
    itemDot: {
      width: 4, height: 4, borderRadius: 2,
      backgroundColor: Colors.accent,
    },
    itemText: {
      fontFamily: Fonts.regular,
      fontSize: 12, color: Colors.textSub,
    },
    itemTextDone: {
      color: Colors.textMuted, textDecorationLine: 'line-through', 
    },

    // Summary card
    summaryCard: {
      backgroundColor: Colors.bgCard, borderRadius: 16, padding:   
  16,
      borderWidth: 1, borderColor: Colors.border, gap: 14,
    },
    summaryRow: { flexDirection: 'row', justifyContent:
  'space-around' },
    summaryItem: { alignItems: 'center', gap: 4 },
    summaryVal: {
      fontFamily: Fonts.condensedBold,
      fontSize: 24,
    },
    summaryLabel: {
      fontFamily: Fonts.medium,
      fontSize: 8, color: Colors.textMuted, letterSpacing: 0.8,    
    },
    tipBox: {
      flexDirection: 'row', alignItems: 'flex-start', gap: 10,     
      backgroundColor: Colors.accentMuted,
      borderRadius: 10, padding: 12,
    },
    tipDot: {
      width: 6, height: 6, borderRadius: 3,
      backgroundColor: Colors.accent, marginTop: 4,
    },
    tipText: {
      flex: 1,
      fontFamily: Fonts.regular,
      fontSize: 12, color: Colors.textSub, lineHeight: 18,
    },
  });