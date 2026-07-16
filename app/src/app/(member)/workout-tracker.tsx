import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Pressable,
} from 'react-native';
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
interface Set       { reps: string; weight: string; done: boolean; }
interface Exercise  { id: number; name: string; sets: Set[]; }
interface PastSession { id: string; logged_date: string; sets_done: number; total_sets: number; }

const goalOptions  = ['Weight Loss', 'Muscle Gain', 'Endurance', 'General Fitness'];
const levelOptions = ['Beginner', 'Intermediate', 'Advanced'];
const daysOptions  = ['3', '4', '5', '6'];

const DEFAULT_EXERCISES: Exercise[] = [
  { id: 1, name: 'Bench Press', sets: [{ reps: '10', weight: '60', done: false }, { reps: '8', weight: '65', done: false }] },
  { id: 2, name: 'Squats',      sets: [{ reps: '10', weight: '80', done: false }, { reps: '8', weight: '85', done: false }] },
];

const EXERCISE_ICONS: Record<string, string> = {
  bench: 'weight-lifter', squat: 'human-handsup', deadlift: 'weight',
  curl: 'arm-flex', press: 'arrow-up-bold', row: 'rowing',
  pull: 'human-handsdown', push: 'hand-right', default: 'dumbbell',
};

function getExerciseIcon(name: string): string {
  const lower = name.toLowerCase();
  for (const key of Object.keys(EXERCISE_ICONS)) {
    if (lower.includes(key)) return EXERCISE_ICONS[key];
  }
  return EXERCISE_ICONS.default;
}

function todayLabel(): string {
  return new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });
}

function WTBackBtn() {
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

export default function WorkoutTrackerScreen() {
  const { profile, gymProfile } = useAuthStore();
  const gymName = gymProfile?.name ?? 'My Gym';

  const [exercises, setExercises]       = useState<Exercise[]>(DEFAULT_EXERCISES);
  const [newName, setNewName]           = useState('');
  const [showAdd, setShowAdd]           = useState(false);
  const [finishing, setFinishing]       = useState(false);
  const [finishError, setFinishError]   = useState<string | null>(null);
  const [pastSessions, setPastSessions] = useState<PastSession[]>([]);
  const [justSaved, setJustSaved]       = useState(false);

  const [showAIPlan, setShowAIPlan]       = useState(false);
  const [selectedGoal, setSelectedGoal]   = useState('Muscle Gain');
  const [selectedLevel, setSelectedLevel] = useState('Intermediate');
  const [selectedDays, setSelectedDays]   = useState('4');
  const [aiPlan, setAiPlan]               = useState<string | null>(null);
  const [aiPlanLoading, setAiPlanLoading] = useState(false);
  const [aiError, setAiError]             = useState<string | null>(null);

  const fetchPastSessions = useCallback(async () => {
    if (!profile?.id) return;
    try {
      const { data, error } = await supabase
        .from('workout_sessions')
        .select('id, logged_date, sets_done, total_sets')
        .eq('member_id', profile.id)
        .order('logged_date', { ascending: false })
        .limit(3);
      if (error) throw error;
      setPastSessions(data ?? []);
    } catch {
      // non-critical — silently skip
    }
  }, [profile?.id]);

  useFocusEffect(useCallback(() => { fetchPastSessions(); }, [fetchPastSessions]));

  const toggleSet = (exIdx: number, setIdx: number) => {
    setExercises(prev => prev.map((ex, ei) =>
      ei === exIdx
        ? { ...ex, sets: ex.sets.map((s, si) => si === setIdx ? { ...s, done: !s.done } : s) }
        : ex
    ));
  };

  const updateSet = (exIdx: number, setIdx: number, field: 'reps' | 'weight', val: string) => {
    setExercises(prev => prev.map((ex, ei) =>
      ei === exIdx
        ? { ...ex, sets: ex.sets.map((s, si) => si === setIdx ? { ...s, [field]: val } : s) }
        : ex
    ));
  };

  const addSet = (exIdx: number) => {
    setExercises(prev => prev.map((ex, ei) =>
      ei === exIdx ? { ...ex, sets: [...ex.sets, { reps: '10', weight: '0', done: false }] } : ex
    ));
  };

  const removeExercise = (exIdx: number) => {
    setExercises(prev => prev.filter((_, ei) => ei !== exIdx));
  };

  const addExercise = () => {
    if (!newName.trim()) return;
    setExercises(prev => [
      ...prev,
      { id: Date.now(), name: newName.trim(), sets: [{ reps: '10', weight: '0', done: false }] },
    ]);
    setNewName('');
    setShowAdd(false);
  };

  const handleFinish = async () => {
    if (totalSets === 0) {
      Alert.alert('No exercises', 'Add at least one exercise first.');
      return;
    }
    setFinishing(true);
    setFinishError(null);
    try {
      const { error } = await supabase.from('workout_sessions').insert({
        member_id:   profile?.id,
        gym_id:      profile?.gym_id,
        exercises,
        total_sets:  totalSets,
        sets_done:   totalDone,
        logged_date: todayLocal(),
      });
      if (error) throw error;
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 3000);
      setExercises(DEFAULT_EXERCISES);
      fetchPastSessions();
    } catch (e: any) {
      setFinishError(e.message ?? 'Could not save workout. Try again.');
    } finally {
      setFinishing(false);
    }
  };

  const handleGeneratePlan = async () => {
    setAiPlanLoading(true);
    setAiPlan(null);
    setAiError(null);
    try {
      const text = await askAI('workout_plan', {
        goal: selectedGoal,
        level: selectedLevel,
        days: selectedDays,
      });
      setAiPlan(text);
    } catch (e: any) {
      setAiError(e.message ?? 'Could not generate plan. Try again.');
    } finally {
      setAiPlanLoading(false);
    }
  };

  const totalDone  = exercises.reduce((acc, ex) => acc + ex.sets.filter(s => s.done).length, 0);
  const totalSets  = exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  const pct        = totalSets ? Math.round((totalDone / totalSets) * 100) : 0;
  const isComplete = totalDone === totalSets && totalSets > 0;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── HEADER ── */}
        <FadeInView delay={0}>
          <WTBackBtn />
          <View style={styles.header}>
            <View style={styles.headerGlow} />
            <View style={{ flex: 1 }}>
              <Text style={styles.headerGym}>{gymName.toUpperCase()}</Text>
              <Text style={styles.headerTitle}>WORKOUT TRACKER</Text>
              <Text style={styles.headerDate}>{todayLabel()}</Text>
            </View>
            <View style={styles.headerIconBox}>
              <MaterialCommunityIcons name="clipboard-list-outline" size={28} color={Colors.accent} />
            </View>
          </View>
        </FadeInView>

        {/* ── SAVE SUCCESS BANNER ── */}
        {justSaved && (
          <FadeInView delay={0}>
            <View style={styles.successBanner}>
              <LottieView
                source={require('@/assets/animations/jumping.json')}
                autoPlay
                loop={false}
                style={styles.jumpingLottie}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.successTitle}>WORKOUT SAVED! 💪</Text>
                <Text style={styles.successSub}>Amazing effort — keep it up!</Text>
              </View>
            </View>
          </FadeInView>
        )}

        {/* ── FINISH ERROR ── */}
        {finishError && (
          <FadeInView delay={0}>
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>⚠️  {finishError}</Text>
            </View>
          </FadeInView>
        )}

        {/* ── PROGRESS CARD ── */}
        <FadeInView delay={40}>
          <View style={[styles.progressCard, isComplete && styles.progressCardComplete]}>
            <View style={styles.progressGlow} />
            <View style={styles.progressHeader}>
              <View>
                <Text style={styles.progressMicro}>SESSION PROGRESS</Text>
                <Text style={styles.progressTitle}>TODAY'S WORKOUT</Text>
              </View>
              <View style={[styles.pctCircle, isComplete && styles.pctCircleComplete]}>
                <Text style={[styles.pctNum, isComplete && { color: Colors.green }]}>{pct}</Text>
                <Text style={[styles.pctSymbol, isComplete && { color: Colors.green }]}>%</Text>
              </View>
            </View>

            <View style={styles.segmentRow}>
              {Array.from({ length: totalSets }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.segment,
                    { flex: 1 },
                    i < totalDone && { backgroundColor: isComplete ? Colors.green : Colors.accent },
                  ]}
                />
              ))}
            </View>

            <View style={styles.progressMeta}>
              <Text style={styles.progressCount}>
                <Text style={styles.progressCountNum}>{totalDone}</Text>
                <Text style={styles.progressCountDenom}> / {totalSets} sets complete</Text>
              </Text>
              {isComplete && (
                <View style={styles.completedChip}>
                  <Text style={styles.completedText}>COMPLETE 🎉</Text>
                </View>
              )}
            </View>

            <View style={styles.exercisePills}>
              {exercises.map((ex, i) => {
                const exDone  = ex.sets.filter(s => s.done).length;
                const allDone = exDone === ex.sets.length;
                return (
                  <View key={i} style={[styles.exPill, allDone && styles.exPillDone]}>
                    <Text style={[styles.exPillText, allDone && { color: Colors.green }]}>
                      {ex.name.split(' ')[0]}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </FadeInView>

        {/* ── PAST SESSIONS ── */}
        {pastSessions.length > 0 && (
          <FadeInView delay={60}>
            <View style={styles.historyCard}>
              <View style={styles.cardHeader}>
                <View style={styles.cardAccentBar} />
                <Text style={styles.cardTitle}>RECENT SESSIONS</Text>
              </View>
              {pastSessions.map((s, i) => {
                const sp      = s.total_sets ? Math.round((s.sets_done / s.total_sets) * 100) : 0;
                const perfect = s.sets_done === s.total_sets;
                return (
                  <View
                    key={s.id}
                    style={[styles.historyRow, i < pastSessions.length - 1 && styles.historyDivider]}
                  >
                    <View style={[styles.historyDot, perfect && { backgroundColor: Colors.green }]} />
                    <Text style={styles.historyDate}>
                      {new Date(s.logged_date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </Text>
                    <View style={styles.historyBarWrap}>
                      <View style={styles.historyBarTrack}>
                        <View style={[
                          styles.historyBarFill,
                          {
                            width: `${sp}%` as any,
                            backgroundColor: perfect ? Colors.green : Colors.accent,
                          },
                        ]} />
                      </View>
                    </View>
                    <Text style={styles.historySets}>{s.sets_done}/{s.total_sets}</Text>
                    <View style={[
                      styles.historyPctBadge,
                      { backgroundColor: perfect ? Colors.green + '18' : Colors.accent + '18' },
                    ]}>
                      <Text style={[
                        styles.historyPctText,
                        { color: perfect ? Colors.green : Colors.accent },
                      ]}>
                        {sp}%
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </FadeInView>
        )}

        {/* ── AI WORKOUT PLAN ── */}
        <FadeInView delay={80}>
          <View style={styles.aiCard}>
            <View style={styles.aiGlow} />
            <AnimatedPressable
              style={styles.aiHeader}
              onPress={() => setShowAIPlan(!showAIPlan)}
              scaleDown={0.98}
            >
              <View style={styles.aiHeaderLeft}>
                <View style={styles.aiIconBox}>
                  <MaterialCommunityIcons name="robot-outline" size={18} color={Colors.accent} />
                </View>
                <View>
                  <Text style={styles.aiLabel}>AI WORKOUT PLAN</Text>
                  <Text style={styles.aiSub}>Personalized for your goals</Text>
                </View>
              </View>
              <MaterialCommunityIcons
                name={showAIPlan ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={Colors.textMuted}
              />
            </AnimatedPressable>

            {showAIPlan && (
              <View style={styles.aiBody}>
                <Text style={styles.aiPickerLabel}>YOUR GOAL</Text>
                <View style={styles.chipRow}>
                  {goalOptions.map(g => (
                    <AnimatedPressable
                      key={g}
                      style={[styles.chip, selectedGoal === g && styles.chipActive]}
                      onPress={() => setSelectedGoal(g)}
                      scaleDown={0.93}
                    >
                      <Text style={[styles.chipText, selectedGoal === g && styles.chipTextActive]}>{g}</Text>
                    </AnimatedPressable>
                  ))}
                </View>

                <Text style={styles.aiPickerLabel}>FITNESS LEVEL</Text>
                <View style={styles.chipRow}>
                  {levelOptions.map(l => (
                    <AnimatedPressable
                      key={l}
                      style={[styles.chip, selectedLevel === l && styles.chipActive]}
                      onPress={() => setSelectedLevel(l)}
                      scaleDown={0.93}
                    >
                      <Text style={[styles.chipText, selectedLevel === l && styles.chipTextActive]}>{l}</Text>
                    </AnimatedPressable>
                  ))}
                </View>

                <Text style={styles.aiPickerLabel}>DAYS PER WEEK</Text>
                <View style={styles.chipRow}>
                  {daysOptions.map(d => (
                    <AnimatedPressable
                      key={d}
                      style={[styles.chip, selectedDays === d && styles.chipActive]}
                      onPress={() => setSelectedDays(d)}
                      scaleDown={0.93}
                    >
                      <Text style={[styles.chipText, selectedDays === d && styles.chipTextActive]}>{d} days</Text>
                    </AnimatedPressable>
                  ))}
                </View>

                {aiError && (
                  <View style={styles.errorBanner}>
                    <Text style={styles.errorText}>⚠️  {aiError}</Text>
                  </View>
                )}

                <AnimatedPressable
                  style={styles.generateBtn}
                  scaleDown={0.97}
                  onPress={handleGeneratePlan}
                  disabled={aiPlanLoading}
                >
                  {aiPlanLoading ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="lightning-bolt" size={15} color="#000" />
                      <Text style={styles.generateBtnText}>GENERATE MY PLAN</Text>
                    </>
                  )}
                </AnimatedPressable>

                {aiPlan && (
                  <View style={styles.aiResult}>
                    <View style={styles.aiResultHeader}>
                      <MaterialCommunityIcons name="robot-outline" size={14} color={Colors.accent} />
                      <Text style={styles.aiResultTitle}>YOUR PERSONALIZED PLAN</Text>
                    </View>
                    <Text style={styles.aiResultText}>{aiPlan}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </FadeInView>

        {/* ── EXERCISE CARDS ── */}
        {exercises.map((ex, exIdx) => {
          const exDone   = ex.sets.filter(s => s.done).length;
          const allDone  = exDone === ex.sets.length;
          const iconName = getExerciseIcon(ex.name) as any;
          return (
            <FadeInView key={ex.id} delay={120 + exIdx * 70}>
              <View style={[styles.exCard, allDone && styles.exCardDone]}>
                <View style={[styles.exAccentBar, allDone && { backgroundColor: Colors.green }]} />

                <View style={styles.exHeader}>
                  <View style={[styles.exIconBox, allDone && { backgroundColor: Colors.green + '20' }]}>
                    <MaterialCommunityIcons
                      name={iconName}
                      size={18}
                      color={allDone ? Colors.green : Colors.accent}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.exName, allDone && { color: Colors.green }]}>
                      {ex.name.toUpperCase()}
                    </Text>
                    <Text style={styles.exProgress}>{exDone}/{ex.sets.length} sets</Text>
                  </View>
                  {allDone && (
                    <View style={styles.exDoneBadge}>
                      <Text style={styles.exDoneText}>✓ DONE</Text>
                    </View>
                  )}
                  <AnimatedPressable onPress={() => removeExercise(exIdx)} scaleDown={0.85} style={{ padding: 4 }}>
                    <MaterialCommunityIcons name="trash-can-outline" size={18} color={Colors.red} />
                  </AnimatedPressable>
                </View>

                <View style={styles.setHeaderRow}>
                  <Text style={[styles.setHeaderText, { width: 32 }]}>#</Text>
                  <Text style={[styles.setHeaderText, { flex: 1, textAlign: 'center' }]}>REPS</Text>
                  <Text style={[styles.setHeaderText, { flex: 1, textAlign: 'center' }]}>KG</Text>
                  <Text style={[styles.setHeaderText, { width: 48, textAlign: 'center' }]}>DONE</Text>
                </View>

                {ex.sets.map((s, setIdx) => (
                  <View key={setIdx} style={[styles.setRow, s.done && styles.setRowDone]}>
                    <View style={styles.setNumBox}>
                      <Text style={styles.setNum}>{setIdx + 1}</Text>
                    </View>
                    <TextInput
                      style={[styles.setInput, s.done && styles.setInputDone]}
                      value={s.reps}
                      onChangeText={v => updateSet(exIdx, setIdx, 'reps', v)}
                      keyboardType="numeric"
                      selectTextOnFocus
                    />
                    <TextInput
                      style={[styles.setInput, s.done && styles.setInputDone]}
                      value={s.weight}
                      onChangeText={v => updateSet(exIdx, setIdx, 'weight', v)}
                      keyboardType="numeric"
                      selectTextOnFocus
                    />
                    <AnimatedPressable onPress={() => toggleSet(exIdx, setIdx)} scaleDown={0.82}>
                      <MaterialCommunityIcons
                        name={s.done ? 'check-circle' : 'check-circle-outline'}
                        size={30}
                        color={s.done ? Colors.accent : Colors.border}
                      />
                    </AnimatedPressable>
                  </View>
                ))}

                <AnimatedPressable style={styles.addSetBtn} scaleDown={0.97} onPress={() => addSet(exIdx)}>
                  <MaterialCommunityIcons name="plus" size={13} color={Colors.accent} />
                  <Text style={styles.addSetText}>ADD SET</Text>
                </AnimatedPressable>
              </View>
            </FadeInView>
          );
        })}

        {/* ── ADD EXERCISE ── */}
        {showAdd ? (
          <FadeInView delay={0}>
            <View style={styles.addCard}>
              <Text style={styles.addCardTitle}>NEW EXERCISE</Text>
              <TextInput
                style={styles.addInput}
                placeholder="Exercise name (e.g. Deadlift)"
                placeholderTextColor={Colors.textMuted}
                value={newName}
                onChangeText={setNewName}
                autoFocus
              />
              <View style={styles.addCardBtns}>
                <AnimatedPressable style={styles.cancelBtn} scaleDown={0.97} onPress={() => setShowAdd(false)}>
                  <Text style={styles.cancelBtnText}>CANCEL</Text>
                </AnimatedPressable>
                <AnimatedPressable style={styles.confirmBtn} scaleDown={0.97} onPress={addExercise}>
                  <MaterialCommunityIcons name="plus" size={14} color="#FFF" />
                  <Text style={styles.confirmBtnText}>ADD</Text>
                </AnimatedPressable>
              </View>
            </View>
          </FadeInView>
        ) : (
          <AnimatedPressable style={styles.addExBtn} scaleDown={0.97} onPress={() => setShowAdd(true)}>
            <MaterialCommunityIcons name="plus-circle-outline" size={18} color={Colors.accent} />
            <Text style={styles.addExText}>ADD EXERCISE</Text>
          </AnimatedPressable>
        )}

        {/* ── FINISH BUTTON ── */}
        <AnimatedPressable
          style={[styles.finishBtn, isComplete && styles.finishBtnComplete]}
          scaleDown={0.97}
          onPress={handleFinish}
          disabled={finishing}
        >
          {finishing ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <MaterialCommunityIcons name="flag-checkered" size={20} color="#000" />
              <Text style={styles.finishText}>
                {isComplete ? 'SAVE COMPLETED WORKOUT 🎉' : `FINISH WORKOUT · ${pct}%`}
              </Text>
            </>
          )}
        </AnimatedPressable>

        {/* ── FOOTER ── */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>{gymName.toUpperCase()} · WORKOUT TRACKER</Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content:   { padding: 16, gap: 12 },

  // HEADER
  header: {
    backgroundColor: Colors.bgCard,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.accent + '25',
    overflow: 'hidden',
  },
  headerGlow: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.accent + '15',
  },
  headerGym: {
    fontSize: 9,
    fontFamily: Fonts.bold,
    color: Colors.accent,
    letterSpacing: 2,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: Fonts.condensedBold,
    color: Colors.text,
    letterSpacing: 1,
  },
  headerDate: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    marginTop: 2,
  },
  headerIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.bgElevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.accent + '30',
  },

  // BANNERS
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.green + '15',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.green + '40',
    overflow: 'hidden',
    paddingRight: 16,
  },
  jumpingLottie: {
    width: 72,
    height: 72,
  },
  successTitle: {
    fontFamily: Fonts.condensedBold,
    fontSize: 16,
    color: Colors.green,
    letterSpacing: 0.5,
  },
  successSub: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.red + '15',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.red + '30',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  errorText: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.red,
  },

  // PROGRESS CARD
  progressCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 20,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  progressCardComplete: {
    borderColor: Colors.green + '50',
    backgroundColor: Colors.green + '08',
  },
  progressGlow: {
    position: 'absolute',
    top: -30,
    right: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.accentGlow,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  progressMicro: {
    fontSize: 9,
    fontFamily: Fonts.medium,
    color: Colors.textMuted,
    letterSpacing: 1.2,
  },
  progressTitle: {
    fontSize: 22,
    fontFamily: Fonts.condensedBold,
    color: Colors.text,
    letterSpacing: 0.5,
  },
  pctCircle: {
    backgroundColor: Colors.accentMuted,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
  },
  pctCircleComplete: {
    backgroundColor: Colors.green + '20',
  },
  pctNum: {
    fontSize: 28,
    fontFamily: Fonts.condensedBold,
    color: Colors.accent,
  },
  pctSymbol: {
    fontSize: 16,
    fontFamily: Fonts.condensedBold,
    color: Colors.accent,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 3,
    height: 6,
  },
  segment: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.border,
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressCount: {},
  progressCountNum: {
    fontSize: 16,
    fontFamily: Fonts.condensedBold,
    color: Colors.text,
  },
  progressCountDenom: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: Colors.textMuted,
  },
  completedChip: {
    backgroundColor: Colors.green + '20',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  completedText: {
    fontSize: 10,
    fontFamily: Fonts.bold,
    color: Colors.green,
    letterSpacing: 1,
  },
  exercisePills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  exPill: {
    backgroundColor: Colors.bgElevated,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  exPillDone: {
    borderColor: Colors.green + '60',
    backgroundColor: Colors.green + '12',
  },
  exPillText: {
    fontSize: 10,
    fontFamily: Fonts.bold,
    color: Colors.textMuted,
  },

  // HISTORY
  historyCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  cardAccentBar: {
    width: 3,
    height: 14,
    borderRadius: 2,
    backgroundColor: Colors.accent,
  },
  cardTitle: {
    fontSize: 10,
    fontFamily: Fonts.bold,
    color: Colors.textMuted,
    letterSpacing: 1.5,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  historyDivider: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  historyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
  },
  historyDate: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: Colors.text,
    width: 64,
  },
  historyBarWrap: { flex: 1 },
  historyBarTrack: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  historyBarFill: {
    height: 4,
    borderRadius: 2,
  },
  historySets: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    width: 44,
    textAlign: 'right',
  },
  historyPctBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  historyPctText: {
    fontSize: 11,
    fontFamily: Fonts.bold,
  },

  // AI CARD
  aiCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.accent + '30',
    overflow: 'hidden',
  },
  aiGlow: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.accentGlow,
  },
  aiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  aiHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aiIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.accentMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiLabel: {
    fontSize: 11,
    fontFamily: Fonts.bold,
    color: Colors.accent,
    letterSpacing: 1.5,
  },
  aiSub: {
    fontSize: 10,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    marginTop: 1,
  },
  aiBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 10,
  },
  aiPickerLabel: {
    fontSize: 9,
    fontFamily: Fonts.bold,
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
  chipText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: Colors.textMuted,
  },
  chipTextActive: {
    color: Colors.accent,
    fontFamily: Fonts.bold,
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 4,
  },
  generateBtnText: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: '#000',
    letterSpacing: 1,
  },
  aiResult: {
    backgroundColor: Colors.bgElevated,
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  aiResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aiResultTitle: {
    fontSize: 9,
    fontFamily: Fonts.bold,
    color: Colors.accent,
    letterSpacing: 1.5,
  },
  aiResultText: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.text,
    lineHeight: 20,
  },

  // EXERCISE CARD
  exCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
    overflow: 'hidden',
  },
  exCardDone: {
    borderColor: Colors.green + '40',
    backgroundColor: Colors.green + '06',
  },
  exAccentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: Colors.accent,
  },
  exHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 8,
  },
  exIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.accentMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exName: {
    fontSize: 15,
    fontFamily: Fonts.condensedBold,
    color: Colors.text,
    letterSpacing: 0.5,
  },
  exProgress: {
    fontSize: 10,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    marginTop: 1,
  },
  exDoneBadge: {
    backgroundColor: Colors.green + '20',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.green + '40',
  },
  exDoneText: {
    fontSize: 9,
    fontFamily: Fonts.bold,
    color: Colors.green,
    letterSpacing: 0.8,
  },
  setHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  setHeaderText: {
    fontSize: 9,
    fontFamily: Fonts.medium,
    color: Colors.textMuted,
    letterSpacing: 0.8,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
    paddingVertical: 5,
    borderRadius: 10,
  },
  setRowDone: {
    backgroundColor: Colors.accentMuted,
  },
  setNumBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.bgElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  setNum: {
    fontSize: 12,
    fontFamily: Fonts.condensedBold,
    color: Colors.textMuted,
  },
  setInput: {
    flex: 1,
    backgroundColor: Colors.bgElevated,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
    fontSize: 15,
    fontFamily: Fonts.bold,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    textAlign: 'center',
  },
  setInputDone: {
    borderColor: Colors.accent + '40',
    color: Colors.accent,
  },
  addSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.accent + '35',
    borderStyle: 'dashed',
  },
  addSetText: {
    fontSize: 10,
    fontFamily: Fonts.bold,
    color: Colors.accent,
    letterSpacing: 1,
  },

  // ADD EXERCISE
  addCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.accent + '30',
    gap: 12,
  },
  addCardTitle: {
    fontSize: 15,
    fontFamily: Fonts.condensedBold,
    color: Colors.text,
    letterSpacing: 0.5,
  },
  addInput: {
    backgroundColor: Colors.bgElevated,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addCardBtns: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Colors.bgElevated,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelBtnText: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: Colors.textMuted,
    letterSpacing: 0.8,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  confirmBtnText: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: '#FFF',
    letterSpacing: 0.8,
  },
  addExBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.accent + '40',
    borderStyle: 'dashed',
  },
  addExText: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: Colors.accent,
    letterSpacing: 0.8,
  },

  // FINISH
  finishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.green,
    borderRadius: 16,
    paddingVertical: 18,
    marginTop: 4,
  },
  finishBtnComplete: {
    backgroundColor: Colors.green,
  },
  finishText: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: '#000',
    letterSpacing: 0.8,
  },

  // FOOTER
  footer: { alignItems: 'center', paddingVertical: 8 },
  footerText: {
    fontSize: 10,
    fontFamily: Fonts.bold,
    color: Colors.textMuted,
    letterSpacing: 2,
  },
});
