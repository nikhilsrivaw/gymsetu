import { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import LottieView from '@/components/AppLottie';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import AnimatedPressable from '@/components/AnimatedPressable';
import FadeInView from '@/components/FadeInView';
import { askAI } from '@/lib/ai';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

import { todayLocal } from '@/lib/date';
interface Meal {
  id: number;
  time: string;
  label: string;
  items: string[];
  calories: number;
  protein: number;
  checked: boolean;
}

const DEFAULT_MEALS: Omit<Meal, 'checked'>[] = [
  {
    id: 1,
    time: '6:30 AM',
    label: 'Early Morning',
    items: ['1 glass warm water with lemon', '5 soaked almonds', '2 walnuts'],
    calories: 80,
    protein: 2,
  },
  {
    id: 2,
    time: '8:00 AM',
    label: 'Breakfast',
    items: ['4 egg whites + 1 whole egg omelette', '2 whole wheat toast', '1 banana', '1 cup green tea'],
    calories: 420,
    protein: 32,
  },
  {
    id: 3,
    time: '11:00 AM',
    label: 'Mid Morning Snack',
    items: ['1 scoop whey protein shake', '1 apple', 'Handful of mixed nuts'],
    calories: 280,
    protein: 26,
  },
  {
    id: 4,
    time: '1:30 PM',
    label: 'Lunch',
    items: ['2 chapati', '1 cup brown rice', '150g grilled chicken breast', '1 cup dal', 'Mixed salad'],
    calories: 680,
    protein: 48,
  },
  {
    id: 5,
    time: '4:30 PM',
    label: 'Pre-Workout',
    items: ['1 banana', '1 cup black coffee (no sugar)', '5 dates'],
    calories: 180,
    protein: 3,
  },
  {
    id: 6,
    time: '8:00 PM',
    label: 'Dinner',
    items: ['150g fish / paneer', '2 chapati', '1 cup vegetables', '1 cup curd'],
    calories: 520,
    protein: 42,
  },
];

const goalOptions       = ['Weight Loss', 'Muscle Gain', 'Maintain', 'General Health'];
const preferenceOptions = ['Non-Vegetarian', 'Vegetarian', 'Vegan'];

function DietBackBtn() {
  const navigation = useNavigation();
  const router = useRouter();
  const canGoBack = navigation.canGoBack();
  return (
    <Pressable
      onPress={() => canGoBack ? router.back() : navigation.dispatch(DrawerActions.openDrawer())}
      style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: Colors.bgCard,
        borderWidth: 1, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center',
        marginBottom: 10 }}
      hitSlop={8}
    >
      <MaterialCommunityIcons name={canGoBack ? 'arrow-left' : 'menu'} size={18} color={Colors.text} />
    </Pressable>
  );
}

export default function DietPlanScreen() {
  const { profile } = useAuthStore();

  const [meals, setMeals]                 = useState<Meal[]>([]);
  const [calorieGoal, setCalorieGoal]     = useState(2200);
  const [proteinGoal, setProteinGoal]     = useState(160);
  const [loading, setLoading]             = useState(true);
  const [dietPlanId, setDietPlanId]       = useState<string | null>(null);
  const [memberId, setMemberId]           = useState<string | null>(null);

  const [fetchError, setFetchError]       = useState<string | null>(null);
  const [toggleError, setToggleError]     = useState<string | null>(null);
  const [aiError, setAiError]             = useState<string | null>(null);
  const [saveError, setSaveError]         = useState<string | null>(null);
  const [savedOk, setSavedOk]             = useState(false);

  const [showAIDiet, setShowAIDiet]       = useState(false);
  const [selectedGoal, setSelectedGoal]   = useState('Muscle Gain');
  const [selectedPref, setSelectedPref]   = useState('Non-Vegetarian');
  const [aiDietPlan, setAiDietPlan]       = useState<string | null>(null);
  const [aiDietLoading, setAiDietLoading] = useState(false);

  const lottieRef = useRef<any>(null);
  const todayStr  = todayLocal();

  // ── Fetch ──────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true);
    setFetchError(null);

    try {
      // Get the members.id (different from profile.id / auth UUID)
      const { data: memberRow, error: memberErr } = await supabase
        .from('members')
        .select('id')
        .eq('user_id', profile.id)
        .maybeSingle();
      if (memberErr) throw memberErr;

      const mId = memberRow?.id ?? null;
      setMemberId(mId);

      const [planRes, logsRes] = await Promise.all([
        mId
          ? supabase
              .from('diet_plans')
              .select('id, meals, calorie_goal, protein_goal')
              .eq('member_id', mId)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        supabase
          .from('meal_logs')
          .select('meal_id')
          .eq('member_id', profile.id)   // meal_logs → profiles(id) ✓
          .eq('logged_date', todayStr),
      ]);

      if (planRes.error) throw planRes.error;
      if (logsRes.error) throw logsRes.error;

      const checkedIds  = new Set((logsRes.data ?? []).map((l: any) => l.meal_id));
      const baseMeals: Omit<Meal, 'checked'>[] = planRes.data?.meals ?? DEFAULT_MEALS;

      setMeals(baseMeals.map(m => ({ ...m, checked: checkedIds.has(m.id) })));
      setCalorieGoal(planRes.data?.calorie_goal ?? 2200);
      setProteinGoal(planRes.data?.protein_goal ?? 160);
      setDietPlanId(planRes.data?.id ?? null);
    } catch (err: any) {
      setFetchError(err.message ?? 'Failed to load diet plan');
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  // ── Toggle meal ────────────────────────────────────────────────
  const toggle = async (meal: Meal) => {
    if (!profile?.id) return;
    setToggleError(null);

    // Optimistic update
    setMeals(prev => prev.map(m => m.id === meal.id ? { ...m, checked: !m.checked } : m));

    try {
      if (!meal.checked) {
        const { error } = await supabase.from('meal_logs').upsert(
          { member_id: profile.id, meal_id: meal.id, logged_date: todayStr },
          { onConflict: 'member_id,meal_id,logged_date' }
        );
        if (error) throw error;
      } else {
        const { error } = await supabase.from('meal_logs').delete()
          .eq('member_id', profile.id)
          .eq('meal_id', meal.id)
          .eq('logged_date', todayStr);
        if (error) throw error;
      }
    } catch (err: any) {
      // Roll back optimistic update
      setMeals(prev => prev.map(m => m.id === meal.id ? { ...m, checked: meal.checked } : m));
      setToggleError(err.message ?? 'Failed to update meal log');
    }
  };

  // ── Generate AI diet plan ──────────────────────────────────────
  const handleGenerateDiet = async () => {
    setAiDietLoading(true);
    setAiDietPlan(null);
    setAiError(null);

    try {
      const text = await askAI('diet_plan', { goal: selectedGoal, preference: selectedPref });
      setAiDietPlan(text);
    } catch (err: any) {
      setAiError(err.message ?? 'Could not generate diet plan');
    } finally {
      setAiDietLoading(false);
    }
  };

  // ── Save as plan ───────────────────────────────────────────────
  const handleSaveAsPlan = async () => {
    if (!profile?.id || !aiDietPlan || !memberId) return;
    setSaveError(null);
    setSavedOk(false);

    try {
      const { error } = await supabase.from('diet_plans').upsert(
        {
          ...(dietPlanId ? { id: dietPlanId } : {}),
          member_id:    memberId,
          gym_id:       profile.gym_id,
          meals:        meals.map(m => { const { checked, ...rest } = m; return rest; }),
          calorie_goal: calorieGoal,
          protein_goal: proteinGoal,
        },
        { onConflict: 'id' }
      );
      if (error) throw error;
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 3000);
    } catch (err: any) {
      setSaveError(err.message ?? 'Failed to save plan');
    }
  };

  // ── Derived totals ─────────────────────────────────────────────
  const eaten         = meals.filter(m => m.checked);
  const caloriesEaten = eaten.reduce((a, m) => a + m.calories, 0);
  const proteinEaten  = eaten.reduce((a, m) => a + m.protein,  0);
  const calPct        = Math.min(Math.round((caloriesEaten / calorieGoal) * 100), 100);
  const proPct        = Math.min(Math.round((proteinEaten  / proteinGoal) * 100), 100);
  const mealPct       = meals.length ? Math.round((eaten.length / meals.length) * 100) : 0;
  const totalCalories = meals.reduce((a, m) => a + m.calories, 0);
  const totalProtein  = meals.reduce((a, m) => a + m.protein,  0);

  // ── Loading ────────────────────────────────────────────────────
  if (loading) return (
    <>
      <Stack.Screen options={{ title: 'Diet Plan' }} />
      <View style={styles.loadingWrap}>
        <LottieView
          ref={lottieRef}
          source={require('@/assets/animations/fitness.json')}
          autoPlay
          loop
          style={styles.loadingLottie}
        />
        <Text style={styles.loadingText}>Loading your nutrition plan…</Text>
      </View>
    </>
  );

  // ── Fetch error ────────────────────────────────────────────────
  if (fetchError) return (
    <>
      <Stack.Screen options={{ title: 'Diet Plan' }} />
      <View style={styles.loadingWrap}>
        <MaterialCommunityIcons name="wifi-off" size={40} color={Colors.textMuted} />
        <Text style={styles.errorText}>{fetchError}</Text>
        <AnimatedPressable style={styles.retryBtn} onPress={fetchData}>
          <Text style={styles.retryText}>RETRY</Text>
        </AnimatedPressable>
      </View>
    </>
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Diet Plan' }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >

        {/* ── BACK / MENU ── */}
        <DietBackBtn />

        {/* Toggle error banner */}
        {toggleError && (
          <View style={styles.errorBanner}>
            <MaterialCommunityIcons name="alert-circle-outline" size={14} color={Colors.red} />
            <Text style={styles.errorBannerText}>{toggleError}</Text>
          </View>
        )}

        {/* Macro Dashboard */}
        <FadeInView delay={0}>
          <View style={styles.macroCard}>
            <View style={styles.macroCardGlow} />
            <Text style={styles.sectionLabel}>TODAY'S NUTRITION</Text>
            <View style={styles.macroRow}>
              {[
                { val: caloriesEaten, goal: calorieGoal, unit: 'kcal', label: 'CALORIES', pct: calPct, color: Colors.orange },
                { val: proteinEaten,  goal: proteinGoal, unit: 'g',    label: 'PROTEIN',  pct: proPct, color: Colors.accent },
                { val: eaten.length,  goal: meals.length, unit: '',   label: 'MEALS',    pct: mealPct, color: Colors.green },
              ].map((m, i) => (
                <View key={i} style={styles.macroBox}>
                  <Text style={[styles.macroVal, { color: m.color }]}>{m.val}{m.unit}</Text>
                  <Text style={styles.macroGoal}>/{m.goal}{m.unit}</Text>
                  <Text style={styles.macroLabel}>{m.label}</Text>
                  <View style={styles.macroBarTrack}>
                    <View style={[styles.macroBarFill, { width: `${m.pct}%` as any, backgroundColor: m.color }]} />
                  </View>
                  <Text style={[styles.macroPct, { color: m.color }]}>{m.pct}%</Text>
                </View>
              ))}
            </View>
          </View>
        </FadeInView>

        {/* AI Diet Plan Card */}
        <FadeInView delay={60}>
          <View style={styles.aiCard}>
            <View style={styles.aiCardGlow} />
            <AnimatedPressable
              style={styles.aiCardHeader}
              scaleDown={0.98}
              onPress={() => setShowAIDiet(!showAIDiet)}
            >
              <View style={styles.aiCardLeft}>
                <MaterialCommunityIcons name="robot-outline" size={16} color={Colors.green} />
                <Text style={styles.aiCardLabel}>AI DIET PLAN</Text>
              </View>
              <MaterialCommunityIcons
                name={showAIDiet ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={Colors.textMuted}
              />
            </AnimatedPressable>

            {showAIDiet && (
              <View style={styles.aiCardBody}>
                <Text style={styles.aiPickerLabel}>YOUR GOAL</Text>
                <View style={styles.chipRow}>
                  {goalOptions.map(g => (
                    <AnimatedPressable
                      key={g}
                      style={[styles.chip, selectedGoal === g && styles.chipActive]}
                      scaleDown={0.95}
                      onPress={() => setSelectedGoal(g)}
                    >
                      <Text style={[styles.chipText, selectedGoal === g && styles.chipTextActive]}>{g}</Text>
                    </AnimatedPressable>
                  ))}
                </View>

                <Text style={styles.aiPickerLabel}>FOOD PREFERENCE</Text>
                <View style={styles.chipRow}>
                  {preferenceOptions.map(p => (
                    <AnimatedPressable
                      key={p}
                      style={[styles.chip, selectedPref === p && styles.chipActiveGreen]}
                      scaleDown={0.95}
                      onPress={() => setSelectedPref(p)}
                    >
                      <Text style={[styles.chipText, selectedPref === p && styles.chipTextGreen]}>{p}</Text>
                    </AnimatedPressable>
                  ))}
                </View>

                {/* AI error */}
                {aiError && (
                  <View style={styles.errorBanner}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={14} color={Colors.red} />
                    <Text style={styles.errorBannerText}>{aiError}</Text>
                  </View>
                )}

                <AnimatedPressable
                  style={[styles.generateBtn, aiDietLoading && { opacity: 0.7 }]}
                  scaleDown={0.97}
                  onPress={handleGenerateDiet}
                  disabled={aiDietLoading}
                >
                  {aiDietLoading
                    ? <ActivityIndicator size="small" color="#FFF" />
                    : (
                      <>
                        <MaterialCommunityIcons name="lightning-bolt" size={15} color="#FFF" />
                        <Text style={styles.generateBtnText}>GENERATE MY DIET PLAN</Text>
                      </>
                    )
                  }
                </AnimatedPressable>

                {aiDietPlan && (
                  <View style={styles.aiResult}>
                    <Text style={styles.aiResultText}>{aiDietPlan}</Text>

                    {/* Save error / success */}
                    {saveError && (
                      <View style={styles.errorBanner}>
                        <MaterialCommunityIcons name="alert-circle-outline" size={14} color={Colors.red} />
                        <Text style={styles.errorBannerText}>{saveError}</Text>
                      </View>
                    )}
                    {savedOk && (
                      <View style={styles.successBanner}>
                        <MaterialCommunityIcons name="check-circle-outline" size={14} color={Colors.green} />
                        <Text style={styles.successBannerText}>Diet plan saved to your profile!</Text>
                      </View>
                    )}

                    <AnimatedPressable
                      style={styles.savePlanBtn}
                      scaleDown={0.96}
                      onPress={handleSaveAsPlan}
                    >
                      <MaterialCommunityIcons name="content-save-outline" size={14} color={Colors.green} />
                      <Text style={styles.savePlanText}>SAVE AS MY PLAN</Text>
                    </AnimatedPressable>
                  </View>
                )}
              </View>
            )}
          </View>
        </FadeInView>

        {/* Meal Cards */}
        <Text style={styles.sectionLabel}>MEAL SCHEDULE — {meals.length} MEALS</Text>

        {meals.map((meal, i) => (
          <FadeInView key={meal.id} delay={100 + i * 65}>
            <AnimatedPressable
              style={[styles.mealCard, meal.checked && styles.mealCardDone]}
              scaleDown={0.98}
              onPress={() => toggle(meal)}
            >
              <View style={[styles.timeBar, { backgroundColor: meal.checked ? Colors.green : Colors.accent }]} />
              <View style={styles.mealContent}>
                <View style={styles.mealTop}>
                  <View style={styles.mealMeta}>
                    <Text style={styles.mealTime}>{meal.time}</Text>
                    <Text style={[styles.mealLabel, meal.checked && { color: Colors.green }]}>
                      {meal.label.toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.mealNums}>
                    <Text style={[styles.mealCal, { color: Colors.orange }]}>{meal.calories}</Text>
                    <Text style={styles.mealCalUnit}>kcal</Text>
                  </View>
                  <View style={styles.mealNums}>
                    <Text style={[styles.mealCal, { color: Colors.accent }]}>{meal.protein}g</Text>
                    <Text style={styles.mealCalUnit}>prot</Text>
                  </View>
                  <View style={[styles.checkbox, meal.checked && styles.checkboxDone]}>
                    {meal.checked && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                </View>
                <View style={styles.itemsList}>
                  {meal.items.map((item, idx) => (
                    <View key={idx} style={styles.itemRow}>
                      <View style={[styles.itemDot, meal.checked && { backgroundColor: Colors.green }]} />
                      <Text style={[styles.itemText, meal.checked && styles.itemTextDone]}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </AnimatedPressable>
          </FadeInView>
        ))}

        {/* Day Summary */}
        <FadeInView delay={500}>
          <View style={styles.summaryCard}>
            <Text style={styles.sectionLabel}>FULL DAY SUMMARY</Text>
            <View style={styles.summaryRow}>
              {[
                { val: totalCalories,       label: 'TOTAL KCAL',    color: Colors.orange },
                { val: `${totalProtein}g`,  label: 'TOTAL PROTEIN', color: Colors.accent },
                { val: meals.length,        label: 'TOTAL MEALS',   color: Colors.green  },
              ].map((s, i) => (
                <View key={i} style={styles.summaryItem}>
                  <Text style={[styles.summaryVal, { color: s.color }]}>{s.val}</Text>
                  <Text style={styles.summaryLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
            <View style={styles.tipBox}>
              <View style={styles.tipDot} />
              <Text style={styles.tipText}>
                Drink 500ml water before each meal to improve digestion and feel fuller.
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
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  content: {
    padding: 16,
    gap: 10,
  },

  // ── Loading / error ──────────────────────────────────────────
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bg,
    gap: 12,
  },
  loadingLottie: {
    width: 180,
    height: 180,
  },
  loadingText: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  errorText: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: Colors.accentMuted,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  retryText: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    color: Colors.accent,
    letterSpacing: 1,
  },

  // ── Inline banners ───────────────────────────────────────────
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.red + '18',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.red + '40',
  },
  errorBannerText: {
    flex: 1,
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Colors.red,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.green + '18',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.green + '40',
  },
  successBannerText: {
    flex: 1,
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Colors.green,
  },

  // ── Section label ────────────────────────────────────────────
  sectionLabel: {
    fontFamily: Fonts.medium,
    fontSize: 9,
    color: Colors.textMuted,
    letterSpacing: 1.5,
    marginVertical: 4,
  },

  // ── Macro card ───────────────────────────────────────────────
  macroCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 14,
    overflow: 'hidden',
  },
  macroCardGlow: {
    position: 'absolute',
    top: -30,
    right: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.accentGlow,
  },
  macroRow: {
    flexDirection: 'row',
  },
  macroBox: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  macroVal: {
    fontFamily: Fonts.condensedBold,
    fontSize: 22,
  },
  macroGoal: {
    fontFamily: Fonts.medium,
    fontSize: 10,
    color: Colors.textMuted,
  },
  macroLabel: {
    fontFamily: Fonts.medium,
    fontSize: 8,
    color: Colors.textMuted,
    letterSpacing: 0.8,
  },
  macroBarTrack: {
    width: '80%',
    height: 3,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  macroBarFill: {
    height: 3,
    borderRadius: 2,
  },
  macroPct: {
    fontFamily: Fonts.condensedBold,
    fontSize: 11,
  },

  // ── AI card ──────────────────────────────────────────────────
  aiCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.green + '30',
    overflow: 'hidden',
  },
  aiCardGlow: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.green + '10',
  },
  aiCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  aiCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiCardLabel: {
    fontFamily: Fonts.bold,
    fontSize: 10,
    color: Colors.green,
    letterSpacing: 1.5,
  },
  aiCardBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 10,
  },
  aiPickerLabel: {
    fontFamily: Fonts.bold,
    fontSize: 9,
    color: Colors.textMuted,
    letterSpacing: 1.5,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.accentMuted,
    borderColor: Colors.accent,
  },
  chipActiveGreen: {
    backgroundColor: Colors.green + '18',
    borderColor: Colors.green,
  },
  chipText: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Colors.textMuted,
  },
  chipTextActive: {
    color: Colors.accent,
    fontFamily: Fonts.bold,
  },
  chipTextGreen: {
    color: Colors.green,
    fontFamily: Fonts.bold,
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.green,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 4,
  },
  generateBtnText: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    color: '#FFF',
    letterSpacing: 1,
  },
  aiResult: {
    backgroundColor: Colors.bgElevated,
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: Colors.green,
    gap: 10,
  },
  aiResultText: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.text,
    lineHeight: 20,
  },
  savePlanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.green + '18',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.green + '40',
  },
  savePlanText: {
    fontFamily: Fonts.bold,
    fontSize: 10,
    color: Colors.green,
    letterSpacing: 0.8,
  },

  // ── Meal cards ───────────────────────────────────────────────
  mealCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  mealCardDone: {
    borderColor: Colors.green + '30',
    backgroundColor: '#121A12',
  },
  timeBar: {
    width: 3,
  },
  mealContent: {
    flex: 1,
    padding: 14,
    gap: 10,
  },
  mealTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mealMeta: {
    flex: 1,
  },
  mealTime: {
    fontFamily: Fonts.medium,
    fontSize: 10,
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  mealLabel: {
    fontFamily: Fonts.condensedBold,
    fontSize: 15,
    color: Colors.text,
    letterSpacing: 0.3,
  },
  mealNums: {
    alignItems: 'center',
  },
  mealCal: {
    fontFamily: Fonts.condensedBold,
    fontSize: 15,
  },
  mealCalUnit: {
    fontFamily: Fonts.medium,
    fontSize: 8,
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxDone: {
    backgroundColor: Colors.green,
    borderColor: Colors.green,
  },
  checkmark: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    color: '#FFF',
  },
  itemsList: {
    gap: 5,
    paddingLeft: 4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.accent,
  },
  itemText: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.textMuted,
  },
  itemTextDone: {
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },

  // ── Summary card ─────────────────────────────────────────────
  summaryCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
    gap: 4,
  },
  summaryVal: {
    fontFamily: Fonts.condensedBold,
    fontSize: 24,
  },
  summaryLabel: {
    fontFamily: Fonts.medium,
    fontSize: 8,
    color: Colors.textMuted,
    letterSpacing: 0.8,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: Colors.accentMuted,
    borderRadius: 10,
    padding: 12,
  },
  tipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent,
    marginTop: 4,
  },
  tipText: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.accent,
    lineHeight: 18,
  },
});
