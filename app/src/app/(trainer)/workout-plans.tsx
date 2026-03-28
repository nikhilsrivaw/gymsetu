import { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert,
  ActivityIndicator, TextInput, Modal, Keyboard, Pressable,
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

const GOAL_OPTIONS  = ['Muscle Gain', 'Weight Loss', 'Endurance', 'General Fitness'];
const LEVEL_OPTIONS = ['Beginner', 'Intermediate', 'Advanced'];
const DAYS_OPTIONS  = ['3', '4', '5', '6'];
const COLOR_OPTIONS = [Colors.accent, '#3B82F6', Colors.green, '#ef4444', '#8B5CF6', '#EC4899'];

const LEVEL_CFG: Record<string, { color: string; icon: IconName }> = {
  Beginner:     { color: Colors.green,  icon: 'sprout' },
  Intermediate: { color: Colors.orange, icon: 'fire'   },
  Advanced:     { color: Colors.red,    icon: 'lightning-bolt' },
};

interface Exercise { name: string; sets: string; reps: string; rest: string; }
interface AssignedMember { id: string; user_id: string; name: string; initials: string; }
interface WorkoutPlan {
  id: string; name: string; goal: string; days: string; level: string;
  color: string; weeks: number; exercises: Exercise[]; assignedTo: { id: string; name: string }[];
}

export default function WorkoutPlansScreen() {
  const { profile }  = useAuthStore();
  const insets       = useSafeAreaInsets();
  const navigation   = useNavigation();

  const [plans,        setPlans]        = useState<WorkoutPlan[]>([]);
  const [members,      setMembers]      = useState<AssignedMember[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [fetchError,   setFetchError]   = useState('');
  const [expandedId,   setExpandedId]   = useState<string | null>(null);

  // Create plan modal
  const [showCreate,   setShowCreate]   = useState(false);
  const [creating,     setCreating]     = useState(false);
  const [createError,  setCreateError]  = useState('');
  const [newName,      setNewName]      = useState('');
  const [newGoal,      setNewGoal]      = useState('Muscle Gain');
  const [newLevel,     setNewLevel]     = useState('Intermediate');
  const [newDays,      setNewDays]      = useState('4');
  const [newWeeks,     setNewWeeks]     = useState('8');
  const [newColor,     setNewColor]     = useState<string>(Colors.accent);

  // Exercise editor modal
  const [editingPlan,  setEditingPlan]  = useState<WorkoutPlan | null>(null);
  const [editExs,      setEditExs]      = useState<Exercise[]>([]);
  const [exName,       setExName]       = useState('');
  const [exSets,       setExSets]       = useState('3');
  const [exReps,       setExReps]       = useState('10');
  const [exRest,       setExRest]       = useState('60s');
  const [exSaving,     setExSaving]     = useState(false);
  const [exError,      setExError]      = useState('');

  // Assign modal
  const [assignPlan,   setAssignPlan]   = useState<WorkoutPlan | null>(null);
  const [assignSel,    setAssignSel]    = useState<Set<string>>(new Set());
  const [assignSaving, setAssignSaving] = useState(false);
  const [assignError,  setAssignError]  = useState('');

  // Load assigned members once (trainer_id lives on profiles, not members)
  useEffect(() => {
    if (!profile?.id || !profile?.gym_id) return;
    supabase
      .from('profiles')
      .select('id, full_name')
      .eq('gym_id', profile.gym_id)
      .eq('trainer_id', profile.id)
      .eq('role', 'member')
      .order('full_name')
      .then(async ({ data: profileRows }) => {
        if (!profileRows?.length) return;
        const { data: memberRows } = await supabase
          .from('members').select('id, user_id').in('user_id', profileRows.map((p: any) => p.id));
        const userToMemberId: Record<string, string> = {};
        (memberRows ?? []).forEach((m: any) => { userToMemberId[m.user_id] = m.id; });
        setMembers(profileRows.map((p: any) => ({
          id:      userToMemberId[p.id] ?? p.id,
          user_id: p.id,
          name:    p.full_name,
          initials: p.full_name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase(),
        })));
      });
  }, [profile?.id, profile?.gym_id]);

  const fetchPlans = useCallback(async () => {
    if (!profile?.id) { setLoading(false); return; }
    setFetchError(''); setLoading(true);
    try {
      const { data, error } = await supabase
        .from('workout_plans')
        .select('*, plan_assignments(member_id, profiles!member_id(full_name))')
        .eq('trainer_id', profile.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPlans((data ?? []).map((p: any) => ({
        id: p.id, name: p.name, goal: p.goal,
        days: p.days ?? '—', level: p.level,
        color: p.color ?? Colors.accent, weeks: p.weeks,
        exercises: p.exercises ?? [],
        assignedTo: (p.plan_assignments ?? []).map((a: any) => ({
          id: a.member_id,
          name: a.profiles?.full_name ?? 'Unknown',
        })),
      })));
    } catch (e: any) {
      setFetchError(e.message ?? 'Failed to load plans');
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useFocusEffect(useCallback(() => { fetchPlans(); }, [fetchPlans]));

  // ── Create plan ──────────────────────────────────────────────
  const handleCreate = async () => {
    if (!newName.trim()) { setCreateError('Plan name is required.'); return; }
    const weeks = parseInt(newWeeks);
    if (!weeks || weeks < 1) { setCreateError('Enter a valid duration.'); return; }
    Keyboard.dismiss(); setCreating(true); setCreateError('');
    try {
      const { error } = await supabase.from('workout_plans').insert({
        trainer_id: profile?.id, gym_id: profile?.gym_id,
        name: newName.trim(), goal: newGoal, level: newLevel,
        days: `${newDays} days/week`, weeks, color: newColor, exercises: [],
      });
      if (error) throw error;
      setShowCreate(false); setNewName('');
      await fetchPlans();
    } catch (e: any) {
      setCreateError(e.message ?? 'Could not create plan.');
    } finally { setCreating(false); }
  };

  // ── Delete plan ──────────────────────────────────────────────
  const handleDelete = (plan: WorkoutPlan) => {
    Alert.alert('Delete Plan', `Delete "${plan.name}"? This will also remove all member assignments.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await supabase.from('plan_assignments').delete().eq('plan_id', plan.id);
          await supabase.from('workout_plans').delete().eq('id', plan.id);
          setPlans(prev => prev.filter(p => p.id !== plan.id));
        } catch { fetchPlans(); }
      }},
    ]);
  };

  // ── Save exercises ───────────────────────────────────────────
  const addExercise = () => {
    if (!exName.trim()) { setExError('Exercise name is required.'); return; }
    setEditExs(prev => [...prev, { name: exName.trim(), sets: exSets, reps: exReps, rest: exRest }]);
    setExName(''); setExSets('3'); setExReps('10'); setExRest('60s'); setExError('');
  };

  const saveExercises = async () => {
    if (!editingPlan) return;
    setExSaving(true); setExError('');
    try {
      const { error } = await supabase
        .from('workout_plans').update({ exercises: editExs }).eq('id', editingPlan.id);
      if (error) throw error;
      setPlans(prev => prev.map(p => p.id === editingPlan.id ? { ...p, exercises: editExs } : p));
      setEditingPlan(null);
    } catch (e: any) {
      setExError(e.message ?? 'Could not save exercises');
    } finally { setExSaving(false); }
  };

  // ── Assign to members ────────────────────────────────────────
  const openAssign = (plan: WorkoutPlan) => {
    setAssignPlan(plan);
    setAssignSel(new Set(plan.assignedTo.map(a => a.id)));
    setAssignError('');
  };

  const saveAssignments = async () => {
    if (!assignPlan) return;
    setAssignSaving(true); setAssignError('');
    try {
      // Remove all existing assignments for this plan
      await supabase.from('plan_assignments').delete().eq('plan_id', assignPlan.id);

      // Insert new ones
      if (assignSel.size > 0) {
        const rows = Array.from(assignSel).map(memberId => ({
          plan_id:   assignPlan.id,
          member_id: memberId,
          gym_id:    profile?.gym_id,
        }));
        const { error } = await supabase.from('plan_assignments').insert(rows);
        if (error) throw error;
      }

      await fetchPlans();
      setAssignPlan(null);
    } catch (e: any) {
      setAssignError(e.message ?? 'Could not save assignments.');
    } finally { setAssignSaving(false); }
  };

  const totalExercises = plans.reduce((a, p) => a + p.exercises.length, 0);
  const totalAssigned  = new Set(plans.flatMap(p => p.assignedTo.map(a => a.id))).size;

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
            style={s.backBtn}
            scaleDown={0.9}
            onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.dispatch(DrawerActions.openDrawer())}
          >
            <MaterialCommunityIcons
              name={navigation.canGoBack() ? 'arrow-left' : 'menu'}
              size={20} color={Colors.text}
            />
          </AnimatedPressable>
          <View style={{ flex: 1 }}>
            <Text style={s.headerMicro}>TRAINER PANEL</Text>
            <Text style={s.headerTitle}>WORKOUT PLANS</Text>
          </View>
          <AnimatedPressable
            style={s.createHeaderBtn}
            scaleDown={0.94}
            onPress={() => { setCreateError(''); setNewName(''); setShowCreate(true); }}
          >
            <MaterialCommunityIcons name="plus" size={16} color={Colors.accent} />
            <Text style={s.createHeaderBtnText}>NEW PLAN</Text>
          </AnimatedPressable>
        </View>

        <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

          {/* Error */}
          {!!fetchError && (
            <View style={s.errorBanner}>
              <MaterialCommunityIcons name="alert-circle-outline" size={14} color={Colors.red} />
              <Text style={s.errorText}>{fetchError}</Text>
              <Pressable onPress={fetchPlans}><Text style={s.retryText}>Retry</Text></Pressable>
            </View>
          )}

          {/* Stats */}
          <FadeInView delay={0}>
            <View style={s.statsRow}>
              {[
                { val: plans.length,    label: 'PLANS',     color: Colors.accent, icon: 'clipboard-list-outline' as IconName },
                { val: totalAssigned,   label: 'MEMBERS',   color: '#3B82F6',    icon: 'account-group-outline' as IconName  },
                { val: totalExercises,  label: 'EXERCISES', color: '#A78BFA',    icon: 'dumbbell' as IconName               },
              ].map((item, i) => (
                <View key={item.label} style={[s.statCard, i < 2 && s.statBorder]}>
                  <View style={[s.statIcon, { backgroundColor: item.color + '14', borderColor: item.color + '25' }]}>
                    <MaterialCommunityIcons name={item.icon} size={13} color={item.color} />
                  </View>
                  <Text style={[s.statVal, { color: item.color }]}>{item.val}</Text>
                  <Text style={s.statLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
          </FadeInView>

          {/* Info banner */}
          <FadeInView delay={20}>
            <View style={s.infoBanner}>
              <MaterialCommunityIcons name="information-outline" size={14} color="#3B82F6" />
              <Text style={s.infoText}>
                Create a plan, add exercises, then assign it to your members. They'll see it on their Fitness screen automatically.
              </Text>
            </View>
          </FadeInView>

          {/* Empty */}
          {plans.length === 0 && (
            <FadeInView delay={60}>
              <View style={s.emptyCard}>
                <View style={s.emptyIconWrap}>
                  <MaterialCommunityIcons name="clipboard-list-outline" size={30} color={Colors.textMuted} />
                </View>
                <Text style={s.emptyTitle}>NO PLANS YET</Text>
                <Text style={s.emptySub}>Tap NEW PLAN to create your first workout plan</Text>
              </View>
            </FadeInView>
          )}

          {/* Plan cards */}
          {plans.map((plan, i) => {
            const isOpen  = expandedId === plan.id;
            const lvlCfg  = LEVEL_CFG[plan.level] ?? { color: Colors.accent, icon: 'dumbbell' };
            return (
              <FadeInView key={plan.id} delay={60 + i * 55}>
                <View style={[s.planCard, { borderColor: isOpen ? plan.color + '40' : Colors.border }]}>
                  <View style={[s.planAccent, { backgroundColor: isOpen ? plan.color : Colors.border }]} />

                  <View style={s.planBody}>
                    {/* Header row */}
                    <AnimatedPressable
                      style={s.planHeaderRow}
                      scaleDown={0.98}
                      onPress={() => setExpandedId(isOpen ? null : plan.id)}
                    >
                      <View style={[s.planIconBox, { backgroundColor: plan.color + '18', borderColor: plan.color + '30' }]}>
                        <MaterialCommunityIcons name="clipboard-list-outline" size={20} color={plan.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.planName, isOpen && { color: plan.color }]}>{plan.name}</Text>
                        <Text style={s.planGoal}>{plan.goal}</Text>
                      </View>
                      <MaterialCommunityIcons name={isOpen ? 'chevron-up' : 'chevron-down'} size={20} color={Colors.textMuted} />
                    </AnimatedPressable>

                    {/* Meta chips */}
                    <View style={s.planMeta}>
                      <View style={[s.levelBadge, { backgroundColor: lvlCfg.color + '14', borderColor: lvlCfg.color + '30' }]}>
                        <MaterialCommunityIcons name={lvlCfg.icon} size={10} color={lvlCfg.color} />
                        <Text style={[s.levelText, { color: lvlCfg.color }]}>{plan.level.toUpperCase()}</Text>
                      </View>
                      <View style={s.metaChip}>
                        <MaterialCommunityIcons name="calendar-week" size={11} color={Colors.textMuted} />
                        <Text style={s.metaText}>{plan.days}</Text>
                      </View>
                      <View style={s.metaChip}>
                        <MaterialCommunityIcons name="timer-outline" size={11} color={Colors.textMuted} />
                        <Text style={s.metaText}>{plan.weeks} weeks</Text>
                      </View>
                      <View style={s.metaChip}>
                        <MaterialCommunityIcons name="dumbbell" size={11} color={Colors.textMuted} />
                        <Text style={s.metaText}>{plan.exercises.length} exercises</Text>
                      </View>
                    </View>

                    {/* Assigned members */}
                    {plan.assignedTo.length > 0 && (
                      <View style={s.assignedRow}>
                        <MaterialCommunityIcons name="account-check-outline" size={12} color={plan.color} />
                        <Text style={[s.assignedLabel, { color: plan.color }]}>ASSIGNED TO</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                          {plan.assignedTo.map(a => (
                            <View key={a.id} style={[s.memberChip, { borderColor: plan.color + '40', backgroundColor: plan.color + '10' }]}>
                              <Text style={[s.memberChipText, { color: plan.color }]}>{a.name}</Text>
                            </View>
                          ))}
                        </ScrollView>
                      </View>
                    )}

                    {/* Always-visible action buttons */}
                    <View style={s.actionRow}>
                      <AnimatedPressable
                        style={s.actionBtn}
                        scaleDown={0.95}
                        onPress={() => { setEditExs([...plan.exercises]); setExName(''); setExError(''); setEditingPlan(plan); }}
                      >
                        <MaterialCommunityIcons name="pencil-outline" size={14} color={Colors.accent} />
                        <Text style={[s.actionBtnText, { color: Colors.accent }]}>EDIT EXERCISES</Text>
                      </AnimatedPressable>
                      <AnimatedPressable
                        style={[s.actionBtn, { borderColor: '#3B82F640', backgroundColor: '#3B82F610' }]}
                        scaleDown={0.95}
                        onPress={() => openAssign(plan)}
                      >
                        <MaterialCommunityIcons name="account-plus-outline" size={14} color="#3B82F6" />
                        <Text style={[s.actionBtnText, { color: '#3B82F6' }]}>ASSIGN</Text>
                      </AnimatedPressable>
                      <AnimatedPressable
                        style={[s.actionBtn, { borderColor: Colors.red + '35', backgroundColor: Colors.red + '0C' }]}
                        scaleDown={0.95}
                        onPress={() => handleDelete(plan)}
                      >
                        <MaterialCommunityIcons name="trash-can-outline" size={14} color={Colors.red} />
                        <Text style={[s.actionBtnText, { color: Colors.red }]}>DELETE</Text>
                      </AnimatedPressable>
                    </View>

                    {/* Expanded: exercises table */}
                    {isOpen && (
                      <View style={s.expandedSection}>
                        <View style={s.exSection}>
                          <View style={s.exHeader}>
                            <Text style={s.exTitle}>EXERCISES</Text>
                            <Text style={s.exCount}>{plan.exercises.length} total</Text>
                          </View>

                          {plan.exercises.length === 0 ? (
                            <View style={s.noExBox}>
                              <MaterialCommunityIcons name="dumbbell" size={18} color={Colors.textMuted} />
                              <Text style={s.noExText}>No exercises yet — tap EDIT EXERCISES to add</Text>
                            </View>
                          ) : (
                            <>
                              <View style={s.tableHead}>
                                <Text style={[s.thText, { flex: 2, textAlign: 'left' }]}>EXERCISE</Text>
                                <Text style={s.thText}>SETS</Text>
                                <Text style={s.thText}>REPS</Text>
                                <Text style={s.thText}>REST</Text>
                              </View>
                              {plan.exercises.map((ex, ei) => (
                                <View key={ei} style={[s.exRow, ei % 2 === 1 && s.exRowAlt]}>
                                  <View style={[s.exNameCol, { flex: 2 }]}>
                                    <View style={[s.exDot, { backgroundColor: plan.color }]} />
                                    <Text style={s.exName} numberOfLines={1}>{ex.name}</Text>
                                  </View>
                                  <Text style={s.exCell}>{ex.sets}</Text>
                                  <Text style={s.exCell}>{ex.reps}</Text>
                                  <Text style={s.exCell}>{ex.rest}</Text>
                                </View>
                              ))}
                            </>
                          )}
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              </FadeInView>
            );
          })}

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>

      {/* ── Create Plan Modal ── */}
      <Modal visible={showCreate} transparent animationType="slide">
        <Pressable style={s.backdrop} onPress={() => setShowCreate(false)} />
        <View style={[s.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={s.sheetHandle} />
          <View style={s.sheetTopRow}>
            <View>
              <Text style={s.sheetTitle}>NEW WORKOUT PLAN</Text>
              <Text style={s.sheetSub}>Fill details then add exercises</Text>
            </View>
            <Pressable style={s.closeBtn} onPress={() => setShowCreate(false)}>
              <MaterialCommunityIcons name="close" size={16} color={Colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={s.sheetScroll}>
            <Text style={s.fieldLabel}>PLAN NAME</Text>
            <View style={s.inputWrap}>
              <MaterialCommunityIcons name="clipboard-edit-outline" size={15} color={Colors.textMuted} />
              <TextInput
                style={s.input}
                placeholder="e.g. Push-Pull-Legs Split"
                placeholderTextColor={Colors.textMuted}
                value={newName}
                onChangeText={t => { setNewName(t); setCreateError(''); }}
                autoCapitalize="words"
              />
            </View>

            <Text style={s.fieldLabel}>GOAL</Text>
            <View style={s.chipGrid}>
              {GOAL_OPTIONS.map(g => (
                <Pressable key={g} style={[s.chip, newGoal === g && s.chipActive]} onPress={() => setNewGoal(g)}>
                  <Text style={[s.chipText, newGoal === g && s.chipTextActive]}>{g}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={s.fieldLabel}>LEVEL</Text>
            <View style={s.chipGrid}>
              {LEVEL_OPTIONS.map(l => {
                const cfg = LEVEL_CFG[l];
                const active = newLevel === l;
                return (
                  <Pressable key={l} style={[s.chip, active && { borderColor: cfg.color + '55', backgroundColor: cfg.color + '12' }]} onPress={() => setNewLevel(l)}>
                    <MaterialCommunityIcons name={cfg.icon} size={12} color={active ? cfg.color : Colors.textMuted} />
                    <Text style={[s.chipText, active && { color: cfg.color }]}>{l}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={s.fieldRow}>
              <View style={s.fieldHalf}>
                <Text style={s.fieldLabel}>DAYS/WEEK</Text>
                <View style={s.chipGrid}>
                  {DAYS_OPTIONS.map(d => (
                    <Pressable key={d} style={[s.chip, newDays === d && s.chipActive]} onPress={() => setNewDays(d)}>
                      <Text style={[s.chipText, newDays === d && s.chipTextActive]}>{d}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <View style={s.fieldHalf}>
                <Text style={s.fieldLabel}>DURATION (weeks)</Text>
                <View style={s.inputWrap}>
                  <MaterialCommunityIcons name="timer-outline" size={15} color={Colors.textMuted} />
                  <TextInput
                    style={s.input}
                    placeholder="8"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="numeric"
                    value={newWeeks}
                    onChangeText={setNewWeeks}
                  />
                </View>
              </View>
            </View>

            <Text style={s.fieldLabel}>PLAN COLOR</Text>
            <View style={s.colorRow}>
              {COLOR_OPTIONS.map(c => (
                <Pressable
                  key={c}
                  style={[s.colorDot, { backgroundColor: c }, newColor === c && s.colorDotActive]}
                  onPress={() => setNewColor(c)}
                />
              ))}
            </View>

            {!!createError && (
              <View style={s.errRow}>
                <MaterialCommunityIcons name="alert-circle-outline" size={13} color={Colors.red} />
                <Text style={s.errText}>{createError}</Text>
              </View>
            )}

            <AnimatedPressable style={[s.saveBtn, creating && { opacity: 0.6 }]} scaleDown={0.97} onPress={handleCreate} disabled={creating}>
              <LinearGradient colors={[Colors.accent, '#C55A00']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.saveBtnInner}>
                {creating ? <ActivityIndicator size="small" color="#fff" /> : (
                  <>
                    <MaterialCommunityIcons name="clipboard-plus-outline" size={18} color="#fff" />
                    <Text style={s.saveBtnText}>CREATE PLAN</Text>
                  </>
                )}
              </LinearGradient>
            </AnimatedPressable>
          </ScrollView>
        </View>
      </Modal>

      {/* ── Exercise Editor Modal ── */}
      <Modal visible={!!editingPlan} transparent animationType="slide">
        <Pressable style={s.backdrop} onPress={() => setEditingPlan(null)} />
        <View style={[s.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={s.sheetHandle} />
          <View style={s.sheetTopRow}>
            <View>
              <Text style={s.sheetTitle}>EXERCISES</Text>
              <Text style={s.sheetSub}>{editingPlan?.name}</Text>
            </View>
            <Pressable style={s.closeBtn} onPress={() => setEditingPlan(null)}>
              <MaterialCommunityIcons name="close" size={16} color={Colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={s.sheetScroll}>

            {/* Current exercises */}
            {editExs.length === 0 ? (
              <View style={s.noExBox}>
                <MaterialCommunityIcons name="dumbbell" size={20} color={Colors.textMuted} />
                <Text style={s.noExText}>No exercises yet — add one below</Text>
              </View>
            ) : (
              <View style={s.exListCard}>
                {editExs.map((ex, i) => (
                  <View key={i} style={[s.exEditorRow, i < editExs.length - 1 && s.exEditorBorder]}>
                    <View style={s.exEditorLeft}>
                      <View style={s.exEditorNumBox}>
                        <Text style={s.exEditorNum}>{i + 1}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.exEditorName}>{ex.name}</Text>
                        <Text style={s.exEditorMeta}>{ex.sets} sets · {ex.reps} reps · {ex.rest} rest</Text>
                      </View>
                    </View>
                    <Pressable onPress={() => setEditExs(prev => prev.filter((_, idx) => idx !== i))}>
                      <MaterialCommunityIcons name="close-circle-outline" size={20} color={Colors.red} />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            {/* Add exercise form */}
            <View style={s.addExForm}>
              <Text style={s.fieldLabel}>ADD EXERCISE</Text>
              <View style={s.inputWrap}>
                <MaterialCommunityIcons name="dumbbell" size={15} color={Colors.textMuted} />
                <TextInput
                  style={s.input}
                  placeholder="Exercise name"
                  placeholderTextColor={Colors.textMuted}
                  value={exName}
                  onChangeText={t => { setExName(t); setExError(''); }}
                />
              </View>
              <View style={s.fieldRow}>
                {[
                  { label: 'SETS', val: exSets, set: setExSets, ph: '3' },
                  { label: 'REPS', val: exReps, set: setExReps, ph: '10' },
                  { label: 'REST', val: exRest, set: setExRest, ph: '60s' },
                ].map(f => (
                  <View key={f.label} style={{ flex: 1 }}>
                    <Text style={s.fieldLabel}>{f.label}</Text>
                    <TextInput
                      style={[s.inputWrap, s.input, { paddingHorizontal: 12 }]}
                      value={f.val}
                      onChangeText={f.set}
                      placeholder={f.ph}
                      placeholderTextColor={Colors.textMuted}
                      keyboardType={f.label !== 'REST' ? 'numeric' : 'default'}
                    />
                  </View>
                ))}
              </View>
              <AnimatedPressable style={s.addExBtn} scaleDown={0.97} onPress={addExercise}>
                <MaterialCommunityIcons name="plus" size={15} color={Colors.accent} />
                <Text style={s.addExBtnText}>ADD TO LIST</Text>
              </AnimatedPressable>
            </View>

            {!!exError && (
              <View style={s.errRow}>
                <MaterialCommunityIcons name="alert-circle-outline" size={13} color={Colors.red} />
                <Text style={s.errText}>{exError}</Text>
              </View>
            )}

            <AnimatedPressable style={[s.saveBtn, exSaving && { opacity: 0.6 }]} scaleDown={0.97} onPress={saveExercises} disabled={exSaving}>
              <LinearGradient colors={[Colors.accent, '#C55A00']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.saveBtnInner}>
                {exSaving ? <ActivityIndicator size="small" color="#fff" /> : (
                  <>
                    <MaterialCommunityIcons name="content-save-outline" size={18} color="#fff" />
                    <Text style={s.saveBtnText}>SAVE EXERCISES</Text>
                  </>
                )}
              </LinearGradient>
            </AnimatedPressable>
          </ScrollView>
        </View>
      </Modal>

      {/* ── Assign to Members Modal ── */}
      <Modal visible={!!assignPlan} transparent animationType="slide">
        <Pressable style={s.backdrop} onPress={() => setAssignPlan(null)} />
        <View style={[s.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={s.sheetHandle} />
          <View style={s.sheetTopRow}>
            <View>
              <Text style={s.sheetTitle}>ASSIGN PLAN</Text>
              <Text style={s.sheetSub}>{assignPlan?.name}</Text>
            </View>
            <Pressable style={s.closeBtn} onPress={() => setAssignPlan(null)}>
              <MaterialCommunityIcons name="close" size={16} color={Colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.sheetScroll}>
            <Text style={s.fieldLabel}>SELECT MEMBERS TO ASSIGN</Text>

            {members.length === 0 ? (
              <View style={s.noExBox}>
                <MaterialCommunityIcons name="account-off-outline" size={20} color={Colors.textMuted} />
                <Text style={s.noExText}>No members assigned to you yet</Text>
              </View>
            ) : (
              <View style={s.memberListCard}>
                {members.map((m, i) => {
                  const checked = assignSel.has(m.user_id);
                  return (
                    <Pressable
                      key={m.id}
                      style={[s.assignMemberRow, i < members.length - 1 && s.assignMemberBorder, checked && s.assignMemberActive]}
                      onPress={() => {
                        setAssignSel(prev => {
                          const next = new Set(prev);
                          if (next.has(m.user_id)) next.delete(m.user_id);
                          else next.add(m.user_id);
                          return next;
                        });
                      }}
                    >
                      <View style={[s.assignAvatar, { borderColor: checked ? Colors.accent + '60' : Colors.border }]}>
                        <Text style={[s.assignInitials, { color: checked ? Colors.accent : Colors.textMuted }]}>{m.initials}</Text>
                      </View>
                      <Text style={[s.assignName, checked && { color: Colors.accent }]}>{m.name}</Text>
                      <View style={[s.checkbox, checked && s.checkboxActive]}>
                        {checked && <MaterialCommunityIcons name="check" size={13} color="#000" />}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}

            <Text style={s.assignHint}>
              {assignSel.size === 0
                ? 'No members selected — plan will be unassigned from all'
                : `${assignSel.size} member${assignSel.size > 1 ? 's' : ''} will receive this plan`}
            </Text>

            {!!assignError && (
              <View style={s.errRow}>
                <MaterialCommunityIcons name="alert-circle-outline" size={13} color={Colors.red} />
                <Text style={s.errText}>{assignError}</Text>
              </View>
            )}

            <AnimatedPressable style={[s.saveBtn, assignSaving && { opacity: 0.6 }]} scaleDown={0.97} onPress={saveAssignments} disabled={assignSaving}>
              <LinearGradient colors={[Colors.accent, '#C55A00']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.saveBtnInner}>
                {assignSaving ? <ActivityIndicator size="small" color="#fff" /> : (
                  <>
                    <MaterialCommunityIcons name="account-check-outline" size={18} color="#fff" />
                    <Text style={s.saveBtnText}>SAVE ASSIGNMENTS</Text>
                  </>
                )}
              </LinearGradient>
            </AnimatedPressable>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  fill:   { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  content:{ paddingHorizontal: 16, paddingTop: 14, gap: 12, paddingBottom: 8 },

  // Header
  header:          { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 12, paddingTop: 6, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.bg },
  backBtn:         { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.bgCard, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  headerMicro:     { fontFamily: Fonts.condensedBold, fontSize: 9, color: Colors.accent, letterSpacing: 2 },
  headerTitle:     { fontFamily: Fonts.condensedBold, fontSize: 26, color: Colors.text, letterSpacing: 0.5 },
  createHeaderBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.accentMuted, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1, borderColor: Colors.accent + '40' },
  createHeaderBtnText: { fontFamily: Fonts.bold, fontSize: 11, color: Colors.accent, letterSpacing: 0.8 },

  // Error
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.red + '12', borderRadius: 12, borderWidth: 1, borderColor: Colors.red + '28', paddingHorizontal: 14, paddingVertical: 11 },
  errorText:   { flex: 1, fontFamily: Fonts.regular, fontSize: 12, color: Colors.red },
  retryText:   { fontFamily: Fonts.bold, fontSize: 12, color: Colors.accent },

  // Stats
  statsRow:   { flexDirection: 'row', backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: Colors.border },
  statCard:   { flex: 1, alignItems: 'center', paddingVertical: 14, gap: 5 },
  statBorder: { borderRightWidth: 1, borderRightColor: Colors.border },
  statIcon:   { width: 26, height: 26, borderRadius: 8, borderWidth: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 1 },
  statVal:    { fontFamily: Fonts.condensedBold, fontSize: 22 },
  statLabel:  { fontFamily: Fonts.condensedBold, fontSize: 8, color: Colors.textMuted, letterSpacing: 1 },

  // Info banner
  infoBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, backgroundColor: '#3B82F610', borderRadius: 12, borderWidth: 1, borderColor: '#3B82F625', paddingHorizontal: 13, paddingVertical: 11 },
  infoText:   { fontFamily: Fonts.regular, fontSize: 12, color: '#3B82F6', flex: 1, lineHeight: 17 },

  // Empty
  emptyCard:    { alignItems: 'center', paddingVertical: 48, gap: 10, backgroundColor: Colors.bgCard, borderRadius: 18, borderWidth: 1, borderColor: Colors.border },
  emptyIconWrap:{ width: 58, height: 58, borderRadius: 17, backgroundColor: Colors.bgElevated, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  emptyTitle:   { fontFamily: Fonts.condensedBold, fontSize: 17, color: Colors.textMuted, letterSpacing: 1 },
  emptySub:     { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, textAlign: 'center', paddingHorizontal: 32 },

  // Plan card
  planCard:      { flexDirection: 'row', backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  planAccent:    { width: 3 },
  planBody:      { flex: 1 },
  planHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  planIconBox:   { width: 44, height: 44, borderRadius: 12, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  planName:      { fontFamily: Fonts.bold, fontSize: 15, color: Colors.text },
  planGoal:      { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  planMeta:      { flexDirection: 'row', gap: 6, paddingHorizontal: 14, paddingBottom: 12, flexWrap: 'wrap' },
  levelBadge:    { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4 },
  levelText:     { fontFamily: Fonts.bold, fontSize: 9, letterSpacing: 0.8 },
  metaChip:      { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.bgElevated, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: Colors.border },
  metaText:      { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted },
  assignedRow:   { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingBottom: 12 },
  assignedLabel: { fontFamily: Fonts.bold, fontSize: 9, letterSpacing: 1 },
  memberChip:    { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  memberChipText:{ fontFamily: Fonts.bold, fontSize: 11 },

  // Expanded section
  expandedSection: { borderTopWidth: 1, borderTopColor: Colors.border, padding: 14, gap: 12 },
  exSection:       { gap: 8 },
  exHeader:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  exTitle:         { fontFamily: Fonts.bold, fontSize: 10, color: Colors.accent, letterSpacing: 1.5 },
  exCount:         { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted },
  noExBox:         { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.bgElevated, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border },
  noExText:        { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted },
  tableHead:       { flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 4 },
  thText:          { flex: 1, fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted, textAlign: 'center', letterSpacing: 1 },
  exRow:           { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, paddingHorizontal: 4, borderRadius: 8 },
  exRowAlt:        { backgroundColor: Colors.bgElevated },
  exNameCol:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  exDot:           { width: 6, height: 6, borderRadius: 3 },
  exName:          { flex: 1, fontFamily: Fonts.bold, fontSize: 12, color: Colors.text },
  exCell:          { flex: 1, fontFamily: Fonts.condensedBold, fontSize: 13, color: Colors.text, textAlign: 'center' },
  actionRow:       { flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingBottom: 14 },
  actionBtn:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 11, borderRadius: 10, borderWidth: 1, borderColor: Colors.accent + '40', backgroundColor: Colors.accentMuted },
  actionBtnText:   { fontFamily: Fonts.bold, fontSize: 10, letterSpacing: 0.5 },

  // Modals
  backdrop:    { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.65)' },
  sheet:       { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.bgCard, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 20, paddingTop: 12, maxHeight: '90%' },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: 14 },
  sheetTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 },
  sheetTitle:  { fontFamily: Fonts.condensedBold, fontSize: 24, color: Colors.text, letterSpacing: 0.5 },
  sheetSub:    { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  closeBtn:    { width: 30, height: 30, borderRadius: 9, backgroundColor: Colors.bgElevated, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  sheetScroll: { gap: 12, paddingBottom: 8 },

  // Fields
  fieldLabel:  { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted, letterSpacing: 1.5 },
  inputWrap:   { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.bgElevated, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12, paddingVertical: 12 },
  input:       { flex: 1, fontFamily: Fonts.regular, fontSize: 14, color: Colors.text },
  chipGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chip:        { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 11, backgroundColor: Colors.bgElevated, borderWidth: 1, borderColor: Colors.border },
  chipActive:  { borderColor: Colors.accent + '55', backgroundColor: Colors.accentMuted },
  chipText:    { fontFamily: Fonts.bold, fontSize: 11, color: Colors.textMuted },
  chipTextActive: { color: Colors.accent },
  fieldRow:    { flexDirection: 'row', gap: 10 },
  fieldHalf:   { flex: 1, gap: 6 },
  colorRow:    { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  colorDot:    { width: 32, height: 32, borderRadius: 16 },
  colorDotActive: { borderWidth: 3, borderColor: '#fff' },
  errRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.red + '12', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: Colors.red + '28' },
  errText:     { fontFamily: Fonts.regular, fontSize: 12, color: Colors.red, flex: 1 },
  saveBtn:     {},
  saveBtnInner:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 16, paddingVertical: 16 },
  saveBtnText: { fontFamily: Fonts.bold, fontSize: 14, color: '#fff', letterSpacing: 1.5 },

  // Exercise editor
  exListCard:    { backgroundColor: Colors.bgElevated, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  exEditorRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  exEditorBorder:{ borderBottomWidth: 1, borderBottomColor: Colors.border },
  exEditorLeft:  { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  exEditorNumBox:{ width: 24, height: 24, borderRadius: 7, backgroundColor: Colors.bgCard, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  exEditorNum:   { fontFamily: Fonts.condensedBold, fontSize: 12, color: Colors.textMuted },
  exEditorName:  { fontFamily: Fonts.bold, fontSize: 13, color: Colors.text },
  exEditorMeta:  { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted, marginTop: 2 },
  addExForm:     { gap: 8, backgroundColor: Colors.bgElevated, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 14 },
  addExBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: Colors.accentMuted, borderRadius: 11, paddingVertical: 11, borderWidth: 1, borderColor: Colors.accent + '40' },
  addExBtnText:  { fontFamily: Fonts.bold, fontSize: 12, color: Colors.accent, letterSpacing: 0.8 },

  // Assign modal
  memberListCard:    { backgroundColor: Colors.bgElevated, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  assignMemberRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 13 },
  assignMemberBorder:{ borderBottomWidth: 1, borderBottomColor: Colors.border },
  assignMemberActive:{ backgroundColor: Colors.accentMuted },
  assignAvatar:      { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.bgCard, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },
  assignInitials:    { fontFamily: Fonts.condensedBold, fontSize: 14 },
  assignName:        { flex: 1, fontFamily: Fonts.bold, fontSize: 14, color: Colors.text },
  checkbox:          { width: 22, height: 22, borderRadius: 7, borderWidth: 1.5, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  checkboxActive:    { backgroundColor: Colors.accent, borderColor: Colors.accent },
  assignHint:        { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, textAlign: 'center', paddingVertical: 4 },
});
