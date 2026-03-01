 import { useState } from 'react';                                  import { View, Text, StyleSheet, ScrollView } from               
  'react-native';                                                    import { Stack } from 'expo-router';                             
  import { Colors } from '@/constants/colors';                     
  import AnimatedPressable from '@/components/AnimatedPressable';  
  import FadeInView from '@/components/FadeInView';

  interface Meal {
    id: number;
    time: string;
    label: string;
    emoji: string;
    items: string[];
    calories: number;
    protein: number;
    checked: boolean;
  }

  const initialMeals: Meal[] = [
    {
      id: 1, time: '6:30 AM', label: 'Early Morning', emoji: '🌅', 
      items: ['1 glass warm water with lemon', '5 soaked almonds', 
  '2 walnuts'],
      calories: 80, protein: 2, checked: false,
    },
    {
      id: 2, time: '8:00 AM', label: 'Breakfast', emoji: '🍳',     
      items: ['4 egg whites + 1 whole egg omelette', '2 whole wheattoast', '1 banana', '1 cup green tea'],
      calories: 420, protein: 32, checked: false,
    },
    {
      id: 3, time: '11:00 AM', label: 'Mid Morning Snack', emoji:  
  '🥜',
      items: ['1 scoop whey protein shake', '1 apple', 'Handful of mixed nuts'],
      calories: 280, protein: 26, checked: false,
    },
    {
      id: 4, time: '1:30 PM', label: 'Lunch', emoji: '🍱',
      items: ['2 chapati', '1 cup brown rice', '150g grilled chicken breast', '1 cup dal', 'Mixed salad with olive oil'],     
      calories: 680, protein: 48, checked: false,
    },
    {
      id: 5, time: '4:30 PM', label: 'Pre-Workout', emoji: '⚡',   
      items: ['1 banana', '1 cup black coffee (no sugar)', '5  dates'],
      calories: 180, protein: 3, checked: false,
    },
    {
      id: 6, time: '8:00 PM', label: 'Dinner', emoji: '🌙',        
      items: ['150g fish / paneer', '2 chapati', '1 cupvegetables', '1 cup curd'],
      calories: 520, protein: 42, checked: false,
    },
  ];

  const totalCalories = initialMeals.reduce((a, m) => a +
  m.calories, 0);
  const totalProtein = initialMeals.reduce((a, m) => a + m.protein,
   0);
  const calorieGoal = 2200;
  const proteinGoal = 160;

  export default function DietPlanScreen() {
    const [meals, setMeals] = useState<Meal[]>(initialMeals);      

    const toggle = (id: number) => {
      setMeals(prev => prev.map(m => m.id === id ? { ...m, checked:
   !m.checked } : m));
    };

    const eaten = meals.filter(m => m.checked);
    const caloriesEaten = eaten.reduce((a, m) => a + m.calories,   
  0);
    const proteinEaten = eaten.reduce((a, m) => a + m.protein, 0); 

    return (
      <>
        <Stack.Screen options={{ title: '🥗 Diet Plan' }} />       
        <ScrollView style={styles.container}
  contentContainerStyle={styles.content}
  showsVerticalScrollIndicator={false}>

          {/* Daily Targets */}
          <FadeInView delay={0}>
            <View style={styles.targetCard}>
              <Text style={styles.targetTitle}>📊 Today's
  Nutrition</Text>
              <View style={styles.macroRow}>
                {/* Calories */}
                <View style={styles.macroBox}>
                  <Text style={styles.macroEmoji}>🔥</Text>        
                  <Text
  style={styles.macroVal}>{caloriesEaten}</Text>
                  <Text style={styles.macroGoal}>/ {calorieGoal}   
  kcal</Text>
                  <View style={styles.macroBar}>
                    <View style={[styles.macroFill, { width:       
  `${Math.min((caloriesEaten / calorieGoal) * 100, 100)}%` as any, 
  backgroundColor: Colors.orange }]} />
                  </View>
                </View>
                <View style={styles.macroDivider} />
                {/* Protein */}
                <View style={styles.macroBox}>
                  <Text style={styles.macroEmoji}>💪</Text>        
                  <Text
  style={styles.macroVal}>{proteinEaten}g</Text>
                  <Text style={styles.macroGoal}>/ {proteinGoal}g  
  protein</Text>
                  <View style={styles.macroBar}>
                    <View style={[styles.macroFill, { width:       
  `${Math.min((proteinEaten / proteinGoal) * 100, 100)}%` as any,  
  backgroundColor: Colors.accent }]} />
                  </View>
                </View>
                <View style={styles.macroDivider} />
                {/* Meals done */}
                <View style={styles.macroBox}>
                  <Text style={styles.macroEmoji}>✅</Text>        
                  <Text
  style={styles.macroVal}>{eaten.length}</Text>
                  <Text style={styles.macroGoal}>/ {meals.length}  
  meals</Text>
                  <View style={styles.macroBar}>
                    <View style={[styles.macroFill, { width:       
  `${(eaten.length / meals.length) * 100}%` as any,
  backgroundColor: Colors.green }]} />
                  </View>
                </View>
              </View>
            </View>
          </FadeInView>

          {/* Meals */}
          {meals.map((meal, i) => (
            <FadeInView key={meal.id} delay={80 + i * 70}>
              <AnimatedPressable
                style={[styles.mealCard, meal.checked &&
  styles.mealCardDone]}
                scaleDown={0.98}
                onPress={() => toggle(meal.id)}
              >
                <View style={styles.mealTop}>
                  <View style={styles.mealLeft}>
                    <Text
  style={styles.mealEmoji}>{meal.emoji}</Text>
                    <View>
                      <Text
  style={styles.mealTime}>{meal.time}</Text>
                      <Text style={[styles.mealLabel, meal.checked 
  && { color: Colors.green }]}>{meal.label}</Text>
                    </View>
                  </View>
                  <View style={styles.mealRight}>
                    <Text style={styles.mealCal}>🔥 {meal.calories}
   kcal</Text>
                    <Text style={styles.mealPro}>💪
  {meal.protein}g</Text>
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
                      <View style={styles.itemDot} />
                      <Text style={[styles.itemText, meal.checked  
  && styles.itemTextDone]}>{item}</Text>
                    </View>
                  ))}
                </View>
              </AnimatedPressable>
            </FadeInView>
          ))}

          {/* Daily Totals */}
          <FadeInView delay={500}>
            <View style={styles.totalsCard}>
              <Text style={styles.totalsTitle}>📋 Full Day
  Summary</Text>
              <View style={styles.totalsRow}>
                <View style={styles.totalItem}>
                  <Text
  style={styles.totalVal}>{totalCalories}</Text>
                  <Text style={styles.totalLabel}>Total
  Calories</Text>
                </View>
                <View style={styles.totalItem}>
                  <Text
  style={styles.totalVal}>{totalProtein}g</Text>
                  <Text style={styles.totalLabel}>Total
  Protein</Text>
                </View>
                <View style={styles.totalItem}>
                  <Text style={styles.totalVal}>6</Text>
                  <Text style={styles.totalLabel}>Total
  Meals</Text>
                </View>
              </View>
              <View style={styles.tipBox}>
                <Text style={styles.tipText}>💡 Tip: Drink 500ml   
  water before each meal to improve digestion and feel
  fuller.</Text>
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
    content: { padding: 16, gap: 10 },

    targetCard: { backgroundColor: Colors.bgCard, borderRadius: 16,
   padding: 16, borderWidth: 1, borderColor: Colors.border, gap: 12
   },
    targetTitle: { fontSize: 15, fontWeight: '700', color:
  Colors.text },
    macroRow: { flexDirection: 'row', gap: 8 },
    macroBox: { flex: 1, alignItems: 'center', gap: 4 },
    macroEmoji: { fontSize: 20 },
    macroVal: { fontSize: 18, fontWeight: '700', color: Colors.text
   },
    macroGoal: { fontSize: 10, color: Colors.textMuted, textAlign: 
  'center' },
    macroBar: { height: 5, width: '100%', backgroundColor:
  Colors.border, borderRadius: 3, overflow: 'hidden' },
    macroFill: { height: 5, borderRadius: 3 },
    macroDivider: { width: 1, backgroundColor: Colors.border },    

    mealCard: {
      backgroundColor: Colors.bgCard, borderRadius: 16, padding:   
  14,
      borderWidth: 1, borderColor: Colors.border, gap: 10,
    },
    mealCardDone: { borderColor: Colors.green + '40',
  backgroundColor: Colors.green + '08' },
    mealTop: { flexDirection: 'row', alignItems: 'center', gap: 10 
  },
    mealLeft: { flex: 1, flexDirection: 'row', alignItems:
  'center', gap: 10 },
    mealEmoji: { fontSize: 26 },
    mealTime: { fontSize: 11, color: Colors.textMuted },
    mealLabel: { fontSize: 15, fontWeight: '700', color:
  Colors.text },
    mealRight: { alignItems: 'flex-end', gap: 2 },
    mealCal: { fontSize: 11, color: Colors.orange, fontWeight:     
  '600' },
    mealPro: { fontSize: 11, color: Colors.accent, fontWeight:     
  '600' },
    checkbox: { width: 24, height: 24, borderRadius: 12,
  borderWidth: 2, borderColor: Colors.border, justifyContent:      
  'center', alignItems: 'center' },
    checkboxDone: { backgroundColor: Colors.green, borderColor:    
  Colors.green },
    checkmark: { fontSize: 13, color: '#FFF', fontWeight: '700' }, 

    itemsList: { gap: 4, paddingLeft: 36 },
    itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8  
  },
    itemDot: { width: 5, height: 5, borderRadius: 3,
  backgroundColor: Colors.border },
    itemText: { fontSize: 13, color: Colors.textSub },
    itemTextDone: { color: Colors.textMuted, textDecorationLine:   
  'line-through' },

    totalsCard: { backgroundColor: Colors.bgCard, borderRadius: 16,
   padding: 16, borderWidth: 1, borderColor: Colors.border, gap: 14
   },
    totalsTitle: { fontSize: 15, fontWeight: '700', color:
  Colors.text },
    totalsRow: { flexDirection: 'row', justifyContent:
  'space-around' },
    totalItem: { alignItems: 'center', gap: 4 },
    totalVal: { fontSize: 20, fontWeight: '700', color:
  Colors.accent },
    totalLabel: { fontSize: 11, color: Colors.textMuted },
    tipBox: { backgroundColor: Colors.orangeMuted, borderRadius:   
  10, padding: 12 },
    tipText: { fontSize: 13, color: Colors.textSub, lineHeight: 19 
  },
  });
