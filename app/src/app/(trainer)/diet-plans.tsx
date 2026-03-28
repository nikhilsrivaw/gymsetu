import { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  TextInput, Modal, Pressable, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useFocusEffect } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { DrawerActions } from '@react-navigation/native';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import FadeInView from '@/components/FadeInView';
import AnimatedPressable from '@/components/AnimatedPressable';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface MealEntry {
  id:       number;
  time:     string;
  label:    string;
  items:    string; // comma-separated in editor, stored as string[]
  calories: string;
  protein:  string;
}

interface MemberDietRow {
  id:           string; // members.id
  name:         string;
  initials:     string;
  goal:         string | null;
  hasPlan:      boolean;
  dietPlanId:   string | null;
  calorieGoal:  number;
  proteinGoal:  number;
  mealCount:    number;
}

const DEFAULT_MEALS: MealEntry[] = [
  { id: 1, time: '7:00 AM',  label: 'Breakfast',        items: '4 egg whites, 2 whole wheat toast, 1 banana, Green tea', calories: '420', protein: '32' },
  { id: 2, time: '10:30 AM', label: 'Mid Morning Snack', items: '1 scoop whey protein, 1 apple, Mixed nuts',              calories: '280', protein: '26' },
  { id: 3, time: '1:30 PM',  label: 'Lunch',             items: '2 chapati, 150g grilled chicken, 1 cup dal, Salad',     calories: '680', protein: '48' },
  { id: 4, time: '4:30 PM',  label: 'Pre-Workout',       items: '1 banana, Black coffee, 5 dates',                       calories: '180', protein: '3'  },
  { id: 5, time: '8:00 PM',  label: 'Dinner',            items: '150g fish, 2 chapati, Vegetables, Curd',                calories: '520', protein: '42' },
];

const MEAL_COLORS: string[] = [
  Colors.accent, '#3B82F6', Colors.green, Colors.orange, '#8B5CF6', '#EC4899',
];

export default function TrainerDietPlansScreen() {
  const { profile } = useAuthStore();
  const insets      = useSafeAreaInsets();
  const navigation  = useNavigation();

  const [members,   setMembers]   = useState<MemberDietRow[]>([]);
  const [loading,   setLoading]   = useState(true);

  // Editor modal
  const [editMember,    setEditMember]    = useState<MemberDietRow | null>(null);
  const [calorieGoal,   setCalorieGoal]   = useState('2200');
  const [proteinGoal,   setProteinGoal]   = useState('160');
  const [meals,         setMeals]         = useState<MealEntry[]>(DEFAULT_MEALS);
  const [saving,        setSaving]        = useState(false);
  const [saveError,     setSaveError]     = useState('');

  // Add meal form inside editor
  const [showAddMeal,   setShowAddMeal]   = useState(false);
  const [newMealTime,   setNewMealTime]   = useState('');
  const [newMealLabel,  setNewMealLabel]  = useState('');
  const [newMealItems,  setNewMealItems]  = useState('');
  const [newMealCal,    setNewMealCal]    = useState('');
  const [newMealProt,   setNewMealProt]   = useState('');

  // ── Fetch assigned members + their diet plans ─────────────────
  const fetchData = useCallback(async () => {
    if (!profile?.id || !profile?.gym_id) return;
    setLoading(true);
    try {
      // Step 1: profiles where trainer_id = this trainer (trainer_id lives on profiles, not members)
      const { data: profileRows } = await supabase
        .from('profiles')
        .select('id, full_name, goal')
        .eq('gym_id', profile.gym_id)
        .eq('trainer_id', profile.id)
        .eq('role', 'member')
        .order('full_name');

      if (!profileRows?.length) {
        setMembers([]);
        setLoading(false);
        return;
      }

      // Step 2: members.id lookup (diet_plans uses members.id, not profiles.id)
      const userIds = profileRows.map((p: any) => p.id);
      const { data: memberRows } = await supabase
        .from('members').select('id, user_id').in('user_id', userIds);
      const userToMemberId: Record<string, string> = {};
      (memberRows ?? []).forEach((m: any) => { userToMemberId[m.user_id] = m.id; });

      // Step 3: diet plans for these members
      const memberIds = Object.values(userToMemberId);
      const planMap: Record<string, any> = {};
      if (memberIds.length > 0) {
        const { data: plansData } = await supabase
          .from('diet_plans')
          .select('id, member_id, calorie_goal, protein_goal, meals')
          .in('member_id', memberIds);
        (plansData ?? []).forEach((p: any) => { planMap[p.member_id] = p; });
      }

      const rows: MemberDietRow[] = profileRows.map((p: any) => {
        const membersId = userToMemberId[p.id];
        const plan = membersId ? planMap[membersId] : null;
        const initials = p.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
        return {
          id:          membersId ?? p.id,
          name:        p.full_name,
          initials,
          goal:        p.goal,
          hasPlan:     !!plan,
          dietPlanId:  plan?.id ?? null,
          calorieGoal: plan?.calorie_goal ?? 2200,
          proteinGoal: plan?.protein_goal ?? 160,
          mealCount:   Array.isArray(plan?.meals) ? plan.meals.length : 0,
        };
      });
      setMembers(rows);
    } finally {
      setLoading(false);
    }
  }, [profile?.id, profile?.gym_id]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  // ── Open editor for a member ──────────────────────────────────
  const openEditor = async (m: MemberDietRow) => {
    setSaveError('');
    setShowAddMeal(false);
    setCalorieGoal(String(m.calorieGoal));
    setProteinGoal(String(m.proteinGoal));

    if (m.dietPlanId) {
      const { data } = await supabase
        .from('diet_plans')
        .select('meals')
        .eq('id', m.dietPlanId)
        .maybeSingle();
      const raw: any[] = Array.isArray(data?.meals) ? data.meals : [];
      setMeals(raw.map((meal: any) => ({
        id:       meal.id,
        time:     meal.time ?? '',
        label:    meal.label ?? '',
        items:    Array.isArray(meal.items) ? meal.items.join(', ') : (meal.items ?? ''),
        calories: String(meal.calories ?? ''),
        protein:  String(meal.protein ?? ''),
      })));
    } else {
      setMeals(DEFAULT_MEALS);
    }
    setEditMember(m);
  };

  // ── Add a new meal row ────────────────────────────────────────
  const addMeal = () => {
    if (!newMealLabel.trim()) return;
    const newId = meals.length > 0 ? Math.max(...meals.map(m => m.id)) + 1 : 1;
    setMeals(prev => [...prev, {
      id: newId, time: newMealTime.trim(), label: newMealLabel.trim(),
      items: newMealItems.trim(), calories: newMealCal.trim(), protein: newMealProt.trim(),
    }]);
    setNewMealTime(''); setNewMealLabel(''); setNewMealItems('');
    setNewMealCal(''); setNewMealProt(''); setShowAddMeal(false);
  };

  const removeMeal = (id: number) => setMeals(prev => prev.filter(m => m.id !== id));

  // ── Save diet plan ────────────────────────────────────────────
  const savePlan = async () => {
    if (!editMember) return;
    const cal = parseInt(calorieGoal);
    const prot = parseInt(proteinGoal);
    if (!cal || !prot) { setSaveError('Enter valid calorie and protein goals.'); return; }

    setSaving(true); setSaveError('');
    try {
      const mealsPayload = meals.map(m => ({
        id:       m.id,
        time:     m.time,
        label:    m.label,
        items:    m.items.split(',').map(s => s.trim()).filter(Boolean),
        calories: parseInt(m.calories) || 0,
        protein:  parseInt(m.protein)  || 0,
      }));

      if (editMember.dietPlanId) {
        const { error } = await supabase
          .from('diet_plans')
          .update({ meals: mealsPayload, calorie_goal: cal, protein_goal: prot })
          .eq('id', editMember.dietPlanId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('diet_plans')
          .insert({
            title:        `${editMember.name}'s Diet Plan`,
            member_id:    editMember.id,
            gym_id:       profile?.gym_id,
            trainer_id:   profile?.id,
            meals:        mealsPayload,
            calorie_goal: cal,
            protein_goal: prot,
          });
        if (error) throw error;
      }
      setEditMember(null);
      await fetchData();
    } catch (e: any) {
      setSaveError(e.message ?? 'Could not save diet plan.');
    } finally { setSaving(false); }
  };

  const deletePlan = (m: MemberDietRow) => {
    if (!m.dietPlanId) return;
    Alert.alert('Delete Plan', `Remove diet plan for ${m.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await supabase.from('diet_plans').delete().eq('id', m.dietPlanId!);
        fetchData();
      }},
    ]);
  };

  const totalPlans   = members.filter(m => m.hasPlan).length;
  const totalMissing = members.filter(m => !m.hasPlan).length;

  if (loading) return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[s.fill, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={Colors.accent} size="large" />
      </View>
    </>
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[s.fill, { paddingTop: insets.top }]}>

        {/* ── Header ── */}
        <View style={s.header}>
          <AnimatedPressable
            style={s.backBtn} scaleDown={0.9}
            onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.dispatch(DrawerActions.openDrawer())}
          >
            <MaterialCommunityIcons name={navigation.canGoBack() ? 'arrow-left' : 'menu'} size={20} color={Colors.text} />
          </AnimatedPressable>
          <View style={{ flex: 1 }}>
            <Text style={s.headerMicro}>TRAINER PANEL</Text>
            <Text style={s.headerTitle}>DIET PLANS</Text>
          </View>
        </View>

        <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

          {/* Stats strip */}
          <FadeInView delay={0}>
            <View style={s.statsRow}>
              {[
                { val: members.length, label: 'ASSIGNED',    color: '#3B82F6',    icon: 'account-group-outline' as IconName  },
                { val: totalPlans,     label: 'PLANS MADE',  color: Colors.green, icon: 'food-apple-outline' as IconName     },
                { val: totalMissing,   label: 'MISSING',     color: Colors.orange, icon: 'alert-circle-outline' as IconName  },
              ].map((st, i) => (
                <View key={st.label} style={[s.statBox, i < 2 && s.statBorder]}>
                  <View style={[s.statIcon, { backgroundColor: st.color + '15', borderColor: st.color + '25' }]}>
                    <MaterialCommunityIcons name={st.icon} size={13} color={st.color} />
                  </View>
                  <Text style={[s.statVal, { color: st.color }]}>{st.val}</Text>
                  <Text style={s.statLabel}>{st.label}</Text>
                </View>
              ))}
            </View>
          </FadeInView>

          {/* Info banner */}
          <FadeInView delay={20}>
            <View style={s.infoBanner}>
              <MaterialCommunityIcons name="information-outline" size={14} color="#3B82F6" />
              <Text style={s.infoText}>Create a diet plan for each member — they'll see it automatically on their Diet Plan screen.</Text>
            </View>
          </FadeInView>

          {/* Empty state */}
          {members.length === 0 && (
            <FadeInView delay={60}>
              <View style={s.emptyCard}>
                <View style={s.emptyIconWrap}>
                  <MaterialCommunityIcons name="food-apple-outline" size={30} color={Colors.textMuted} />
                </View>
                <Text style={s.emptyTitle}>NO ASSIGNED MEMBERS</Text>
                <Text style={s.emptySub}>The owner assigns members to you — diet plans will appear here once assigned</Text>
              </View>
            </FadeInView>
          )}

          {/* Member cards */}
          {members.map((m, i) => (
            <FadeInView key={m.id} delay={60 + i * 50}>
              <View style={[s.memberCard, m.hasPlan && { borderColor: Colors.green + '35' }]}>
                <View style={[s.cardAccent, { backgroundColor: m.hasPlan ? Colors.green : Colors.border }]} />

                <View style={s.cardBody}>
                  {/* Top row */}
                  <View style={s.cardTop}>
                    <View style={[s.avatar, { backgroundColor: (m.hasPlan ? Colors.green : Colors.accent) + '15', borderColor: (m.hasPlan ? Colors.green : Colors.accent) + '30' }]}>
                      <Text style={[s.avatarText, { color: m.hasPlan ? Colors.green : Colors.accent }]}>{m.initials}</Text>
                    </View>
                    <View style={{ flex: 1, gap: 3 }}>
                      <Text style={s.memberName}>{m.name}</Text>
                      {m.goal && (
                        <View style={s.goalRow}>
                          <MaterialCommunityIcons name="target" size={10} color={Colors.textMuted} />
                          <Text style={s.goalText}>{m.goal.replace(/_/g, ' ')}</Text>
                        </View>
                      )}
                    </View>
                    <View style={[s.statusBadge, m.hasPlan
                      ? { backgroundColor: Colors.green + '14', borderColor: Colors.green + '30' }
                      : { backgroundColor: Colors.orange + '14', borderColor: Colors.orange + '30' }
                    ]}>
                      <MaterialCommunityIcons
                        name={m.hasPlan ? 'check-circle-outline' : 'plus-circle-outline'}
                        size={11}
                        color={m.hasPlan ? Colors.green : Colors.orange}
                      />
                      <Text style={[s.statusText, { color: m.hasPlan ? Colors.green : Colors.orange }]}>
                        {m.hasPlan ? 'PLAN SET' : 'NO PLAN'}
                      </Text>
                    </View>
                  </View>

                  {/* Plan summary (if exists) */}
                  {m.hasPlan && (
                    <View style={s.planSummaryRow}>
                      <View style={s.summaryChip}>
                        <MaterialCommunityIcons name="fire" size={11} color={Colors.accent} />
                        <Text style={s.summaryChipText}>{m.calorieGoal} kcal</Text>
                      </View>
                      <View style={s.summaryChip}>
                        <MaterialCommunityIcons name="arm-flex-outline" size={11} color='#3B82F6' />
                        <Text style={s.summaryChipText}>{m.proteinGoal}g protein</Text>
                      </View>
                      <View style={s.summaryChip}>
                        <MaterialCommunityIcons name="food-outline" size={11} color={Colors.green} />
                        <Text style={s.summaryChipText}>{m.mealCount} meals</Text>
                      </View>
                    </View>
                  )}

                  {/* Action buttons */}
                  <View style={s.cardActions}>
                    <AnimatedPressable
                      style={[s.actionBtn, { flex: 2, borderColor: Colors.accent + '40', backgroundColor: Colors.accentMuted }]}
                      scaleDown={0.96}
                      onPress={() => openEditor(m)}
                    >
                      <MaterialCommunityIcons name={m.hasPlan ? 'pencil-outline' : 'plus'} size={14} color={Colors.accent} />
                      <Text style={[s.actionBtnText, { color: Colors.accent }]}>
                        {m.hasPlan ? 'EDIT PLAN' : 'CREATE PLAN'}
                      </Text>
                    </AnimatedPressable>
                    {m.hasPlan && (
                      <AnimatedPressable
                        style={[s.actionBtn, { borderColor: Colors.red + '35', backgroundColor: Colors.red + '0C' }]}
                        scaleDown={0.96}
                        onPress={() => deletePlan(m)}
                      >
                        <MaterialCommunityIcons name="trash-can-outline" size={14} color={Colors.red} />
                      </AnimatedPressable>
                    )}
                  </View>
                </View>
              </View>
            </FadeInView>
          ))}

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>

      {/* ── Diet Plan Editor Modal ── */}
      <Modal visible={!!editMember} transparent animationType="slide">
        <Pressable style={s.backdrop} onPress={() => !saving && setEditMember(null)} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.sheetWrap}>
          <View style={[s.sheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={s.sheetHandle} />

            {/* Sheet header */}
            <View style={s.sheetTopRow}>
              <View style={s.sheetHeaderLeft}>
                <View style={[s.sheetIconBox, { backgroundColor: Colors.green + '15', borderColor: Colors.green + '30' }]}>
                  <MaterialCommunityIcons name="food-apple-outline" size={18} color={Colors.green} />
                </View>
                <View>
                  <Text style={s.sheetTitle}>DIET PLAN</Text>
                  <Text style={s.sheetSub}>{editMember?.name}</Text>
                </View>
              </View>
              <Pressable style={s.closeBtn} onPress={() => !saving && setEditMember(null)}>
                <MaterialCommunityIcons name="close" size={16} color={Colors.textMuted} />
              </Pressable>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={s.sheetScroll}>

              {/* Goals row */}
              <View style={s.goalsRow}>
                <View style={s.goalField}>
                  <Text style={s.fieldLabel}>DAILY CALORIES</Text>
                  <View style={s.inputWrap}>
                    <MaterialCommunityIcons name="fire" size={15} color={Colors.accent} />
                    <TextInput
                      style={s.input} keyboardType="numeric"
                      placeholder="2200" placeholderTextColor={Colors.textMuted}
                      value={calorieGoal} onChangeText={setCalorieGoal}
                    />
                    <Text style={s.inputUnit}>kcal</Text>
                  </View>
                </View>
                <View style={s.goalField}>
                  <Text style={s.fieldLabel}>DAILY PROTEIN</Text>
                  <View style={s.inputWrap}>
                    <MaterialCommunityIcons name="arm-flex-outline" size={15} color="#3B82F6" />
                    <TextInput
                      style={s.input} keyboardType="numeric"
                      placeholder="160" placeholderTextColor={Colors.textMuted}
                      value={proteinGoal} onChangeText={setProteinGoal}
                    />
                    <Text style={s.inputUnit}>g</Text>
                  </View>
                </View>
              </View>

              {/* Meals section header */}
              <View style={s.mealsSectionHeader}>
                <View style={s.sectionHeader}>
                  <View style={s.sectionAccent} />
                  <Text style={s.sectionTitle}>MEALS ({meals.length})</Text>
                </View>
                <AnimatedPressable
                  style={s.addMealBtn} scaleDown={0.93}
                  onPress={() => setShowAddMeal(v => !v)}
                >
                  <MaterialCommunityIcons name={showAddMeal ? 'minus' : 'plus'} size={13} color={Colors.accent} />
                  <Text style={s.addMealBtnText}>{showAddMeal ? 'CANCEL' : 'ADD MEAL'}</Text>
                </AnimatedPressable>
              </View>

              {/* Add meal form */}
              {showAddMeal && (
                <View style={s.addMealForm}>
                  <View style={s.formRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.fieldLabel}>TIME</Text>
                      <TextInput style={s.smallInput} placeholder="e.g. 7:00 AM" placeholderTextColor={Colors.textMuted} value={newMealTime} onChangeText={setNewMealTime} />
                    </View>
                    <View style={{ flex: 2 }}>
                      <Text style={s.fieldLabel}>MEAL LABEL</Text>
                      <TextInput style={s.smallInput} placeholder="e.g. Breakfast" placeholderTextColor={Colors.textMuted} value={newMealLabel} onChangeText={setNewMealLabel} />
                    </View>
                  </View>
                  <Text style={s.fieldLabel}>FOOD ITEMS (comma-separated)</Text>
                  <TextInput
                    style={[s.smallInput, s.multiInput]}
                    placeholder="e.g. 4 egg whites, 2 toast, 1 banana"
                    placeholderTextColor={Colors.textMuted}
                    value={newMealItems} onChangeText={setNewMealItems}
                    multiline numberOfLines={2}
                  />
                  <View style={s.formRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.fieldLabel}>CALORIES</Text>
                      <TextInput style={s.smallInput} placeholder="420" placeholderTextColor={Colors.textMuted} keyboardType="numeric" value={newMealCal} onChangeText={setNewMealCal} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.fieldLabel}>PROTEIN (g)</Text>
                      <TextInput style={s.smallInput} placeholder="30" placeholderTextColor={Colors.textMuted} keyboardType="numeric" value={newMealProt} onChangeText={setNewMealProt} />
                    </View>
                  </View>
                  <AnimatedPressable style={s.addMealConfirmBtn} scaleDown={0.97} onPress={addMeal}>
                    <MaterialCommunityIcons name="plus" size={15} color={Colors.accent} />
                    <Text style={s.addMealConfirmText}>ADD TO PLAN</Text>
                  </AnimatedPressable>
                </View>
              )}

              {/* Meals list */}
              <View style={s.mealsList}>
                {meals.map((meal, i) => {
                  const mealColor = MEAL_COLORS[i % MEAL_COLORS.length];
                  return (
                    <View key={meal.id} style={s.mealCard}>
                      <View style={[s.mealAccent, { backgroundColor: mealColor }]} />
                      <View style={s.mealInner}>
                        {/* Meal header */}
                        <View style={s.mealHeader}>
                          <View style={[s.mealTimeBox, { backgroundColor: mealColor + '15', borderColor: mealColor + '30' }]}>
                            <MaterialCommunityIcons name="clock-outline" size={10} color={mealColor} />
                            <Text style={[s.mealTime, { color: mealColor }]}>{meal.time || '—'}</Text>
                          </View>
                          <Text style={s.mealLabel}>{meal.label}</Text>
                          <View style={s.mealMacros}>
                            <Text style={[s.mealMacroText, { color: Colors.accent }]}>{meal.calories || '—'} kcal</Text>
                            <Text style={s.mealMacroDot}>·</Text>
                            <Text style={[s.mealMacroText, { color: '#3B82F6' }]}>{meal.protein || '—'}g</Text>
                          </View>
                          <Pressable onPress={() => removeMeal(meal.id)} hitSlop={8}>
                            <MaterialCommunityIcons name="close-circle-outline" size={19} color={Colors.red + 'AA'} />
                          </Pressable>
                        </View>
                        {/* Items */}
                        <Text style={s.mealItems} numberOfLines={2}>{meal.items || 'No items added'}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>

              {!!saveError && (
                <View style={s.errRow}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={13} color={Colors.red} />
                  <Text style={s.errText}>{saveError}</Text>
                </View>
              )}

              {/* Save button */}
              <AnimatedPressable style={[s.saveBtn, saving && { opacity: 0.6 }]} scaleDown={0.97} onPress={savePlan} disabled={saving}>
                <LinearGradient colors={[Colors.green, '#16a34a']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.saveBtnInner}>
                  {saving
                    ? <ActivityIndicator size="small" color="#FFF" />
                    : <>
                        <MaterialCommunityIcons name="content-save-check-outline" size={18} color="#FFF" />
                        <Text style={s.saveBtnText}>SAVE DIET PLAN</Text>
                      </>
                  }
                </LinearGradient>
              </AnimatedPressable>

            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  fill:    { flex: 1, backgroundColor: Colors.bg },
  scroll:  { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 14, gap: 12, paddingBottom: 8 },

  // Header
  header:          { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 12, paddingTop: 6, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.bg },
  backBtn:         { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.bgCard, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  headerMicro:     { fontFamily: Fonts.condensedBold, fontSize: 9, color: Colors.green, letterSpacing: 2 },
  headerTitle:     { fontFamily: Fonts.condensedBold, fontSize: 26, color: Colors.text, letterSpacing: 0.5 },

  // Stats
  statsRow:   { flexDirection: 'row', backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: Colors.border },
  statBox:    { flex: 1, alignItems: 'center', paddingVertical: 14, gap: 5 },
  statBorder: { borderRightWidth: 1, borderRightColor: Colors.border },
  statIcon:   { width: 26, height: 26, borderRadius: 8, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  statVal:    { fontFamily: Fonts.condensedBold, fontSize: 22 },
  statLabel:  { fontFamily: Fonts.bold, fontSize: 8, color: Colors.textMuted, letterSpacing: 1 },

  // Info banner
  infoBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, backgroundColor: '#3B82F610', borderRadius: 12, borderWidth: 1, borderColor: '#3B82F625', paddingHorizontal: 13, paddingVertical: 11 },
  infoText:   { fontFamily: Fonts.regular, fontSize: 12, color: '#3B82F6', flex: 1, lineHeight: 17 },

  // Empty
  emptyCard:    { alignItems: 'center', paddingVertical: 48, gap: 10, backgroundColor: Colors.bgCard, borderRadius: 18, borderWidth: 1, borderColor: Colors.border },
  emptyIconWrap:{ width: 58, height: 58, borderRadius: 17, backgroundColor: Colors.bgElevated, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  emptyTitle:   { fontFamily: Fonts.condensedBold, fontSize: 17, color: Colors.textMuted, letterSpacing: 1 },
  emptySub:     { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, textAlign: 'center', paddingHorizontal: 32, lineHeight: 18 },

  // Member card
  memberCard:   { flexDirection: 'row', backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  cardAccent:   { width: 3 },
  cardBody:     { flex: 1, padding: 14, gap: 10 },
  cardTop:      { flexDirection: 'row', alignItems: 'center', gap: 11 },
  avatar:       { width: 44, height: 44, borderRadius: 22, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  avatarText:   { fontFamily: Fonts.condensedBold, fontSize: 16 },
  memberName:   { fontFamily: Fonts.bold, fontSize: 14, color: Colors.text },
  goalRow:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  goalText:     { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted, textTransform: 'capitalize' },
  statusBadge:  { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4 },
  statusText:   { fontFamily: Fonts.bold, fontSize: 9, letterSpacing: 0.8 },

  planSummaryRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  summaryChip:    { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.bgElevated, borderRadius: 8, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 8, paddingVertical: 4 },
  summaryChipText:{ fontFamily: Fonts.bold, fontSize: 10, color: Colors.textMuted },

  cardActions: { flexDirection: 'row', gap: 8 },
  actionBtn:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  actionBtnText:{ fontFamily: Fonts.bold, fontSize: 10, letterSpacing: 0.5 },

  // Modal
  backdrop:   { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.65)' },
  sheetWrap:  { position: 'absolute', bottom: 0, left: 0, right: 0 },
  sheet:      { backgroundColor: Colors.bgCard, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 20, paddingTop: 12, maxHeight: '92%' },
  sheetHandle:{ width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: 14 },
  sheetTopRow:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  sheetHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sheetIconBox:    { width: 40, height: 40, borderRadius: 12, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  sheetTitle: { fontFamily: Fonts.condensedBold, fontSize: 22, color: Colors.text, letterSpacing: 0.5 },
  sheetSub:   { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  closeBtn:   { width: 30, height: 30, borderRadius: 9, backgroundColor: Colors.bgElevated, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  sheetScroll:{ gap: 14, paddingBottom: 8 },

  // Goals row
  goalsRow:  { flexDirection: 'row', gap: 10 },
  goalField: { flex: 1, gap: 6 },
  fieldLabel:{ fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted, letterSpacing: 1.5 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.bgElevated, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 11, paddingVertical: 11 },
  input:     { flex: 1, fontFamily: Fonts.regular, fontSize: 14, color: Colors.text },
  inputUnit: { fontFamily: Fonts.bold, fontSize: 10, color: Colors.textMuted },

  // Meals section
  mealsSectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionHeader:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionAccent:      { width: 3, height: 14, borderRadius: 2, backgroundColor: Colors.green },
  sectionTitle:       { fontFamily: Fonts.bold, fontSize: 10, color: Colors.textMuted, letterSpacing: 1.5 },
  addMealBtn:         { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.accentMuted, borderRadius: 9, borderWidth: 1, borderColor: Colors.accent + '40', paddingHorizontal: 10, paddingVertical: 6 },
  addMealBtnText:     { fontFamily: Fonts.bold, fontSize: 10, color: Colors.accent, letterSpacing: 0.5 },

  // Add meal form
  addMealForm:       { backgroundColor: Colors.bgElevated, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 14, gap: 10 },
  formRow:           { flexDirection: 'row', gap: 10 },
  smallInput:        { fontFamily: Fonts.regular, fontSize: 13, color: Colors.text, backgroundColor: Colors.bgCard, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12, paddingVertical: 10 },
  multiInput:        { minHeight: 56, textAlignVertical: 'top' },
  addMealConfirmBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: Colors.accentMuted, borderRadius: 11, paddingVertical: 11, borderWidth: 1, borderColor: Colors.accent + '40' },
  addMealConfirmText:{ fontFamily: Fonts.bold, fontSize: 12, color: Colors.accent, letterSpacing: 0.8 },

  // Meals list
  mealsList: { gap: 8 },
  mealCard:  { flexDirection: 'row', backgroundColor: Colors.bgElevated, borderRadius: 13, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  mealAccent:{ width: 3 },
  mealInner: { flex: 1, padding: 12, gap: 6 },
  mealHeader:{ flexDirection: 'row', alignItems: 'center', gap: 8 },
  mealTimeBox:{ flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 6, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 3 },
  mealTime:  { fontFamily: Fonts.bold, fontSize: 9, letterSpacing: 0.5 },
  mealLabel: { flex: 1, fontFamily: Fonts.bold, fontSize: 12, color: Colors.text },
  mealMacros:{ flexDirection: 'row', alignItems: 'center', gap: 4 },
  mealMacroText: { fontFamily: Fonts.condensedBold, fontSize: 11 },
  mealMacroDot:  { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted },
  mealItems: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, lineHeight: 16 },

  // Error
  errRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.red + '12', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: Colors.red + '28' },
  errText: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.red, flex: 1 },

  // Save
  saveBtn:      { borderRadius: 16, overflow: 'hidden' },
  saveBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 },
  saveBtnText:  { fontFamily: Fonts.bold, fontSize: 14, color: '#FFF', letterSpacing: 1.3 },
});
