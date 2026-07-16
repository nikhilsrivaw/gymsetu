import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
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
const goalOptions = ['Weight Loss', 'Muscle Gain', 'Maintain', 'General Fitness'];

interface WeightLog    { id: string; weight: number; logged_date: string; }
interface Measurements { chest?: number; waist?: number; hips?: number; arms?: number; thighs?: number; logged_date?: string; }

const MEAS_ICONS: Record<string, string> = {
  chest: '🫁', waist: '📏', hips: '🔵', arms: '💪', thighs: '🦵',
};

function BPBackBtn() {
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

export default function BodyProgressScreen() {
  const { profile, gymProfile } = useAuthStore();
  const gymName = gymProfile?.name ?? 'My Gym';

  const [weightLogs, setWeightLogs]       = useState<WeightLog[]>([]);
  const [prevMeas, setPrevMeas]           = useState<Measurements | null>(null);
  const [latestMeas, setLatestMeas]       = useState<Measurements | null>(null);
  const [loading, setLoading]             = useState(true);
  const [fetchError, setFetchError]       = useState<string | null>(null);
  const [newWeight, setNewWeight]         = useState('');
  const [logSaving, setLogSaving]         = useState(false);
  const [logError, setLogError]           = useState<string | null>(null);
  const [showMeasModal, setShowMeasModal] = useState(false);
  const [measInputs, setMeasInputs]       = useState({ chest: '', waist: '', hips: '', arms: '', thighs: '' });
  const [measSaving, setMeasSaving]       = useState(false);
  const [measError, setMeasError]         = useState<string | null>(null);
  const [showAI, setShowAI]               = useState(false);
  const [selectedGoal, setSelectedGoal]   = useState('Weight Loss');
  const [aiAnalysis, setAiAnalysis]       = useState<string | null>(null);
  const [aiLoading, setAiLoading]         = useState(false);
  const [aiError, setAiError]             = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true);
    setFetchError(null);
    try {
      const [logsRes, measRes] = await Promise.all([
        supabase.from('weight_logs').select('id, weight, logged_date')
          .eq('member_id', profile.id).order('logged_date', { ascending: true }).limit(7),
        supabase.from('body_measurements').select('chest, waist, hips, arms, thighs, logged_date')
          .eq('member_id', profile.id).order('logged_date', { ascending: false }).limit(2),
      ]);
      if (logsRes.error) throw logsRes.error;
      setWeightLogs(logsRes.data ?? []);
      setLatestMeas(measRes.data?.[0] ?? null);
      setPrevMeas(measRes.data?.[1] ?? null);
    } catch (e: any) {
      setFetchError(e.message ?? 'Failed to load progress data.');
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const handleLogWeight = async () => {
    const w = parseFloat(newWeight);
    if (!w || w < 30 || w > 300) {
      Alert.alert('Invalid weight', 'Enter a valid weight between 30–300 kg');
      return;
    }
    setLogSaving(true);
    setLogError(null);
    try {
      const todayStr = todayLocal();
      const { error } = await supabase.from('weight_logs').upsert(
        { member_id: profile?.id, gym_id: profile?.gym_id, weight: w, logged_date: todayStr },
        { onConflict: 'member_id,logged_date' }
      );
      if (error) throw error;
      setNewWeight('');
      await fetchData();
    } catch (e: any) {
      setLogError(e.message ?? 'Could not save weight. Try again.');
    } finally {
      setLogSaving(false);
    }
  };

  const handleSaveMeasurements = async () => {
    const payload: any = { member_id: profile?.id, gym_id: profile?.gym_id };
    let hasValue = false;
    (['chest', 'waist', 'hips', 'arms', 'thighs'] as const).forEach(k => {
      const v = parseFloat(measInputs[k]);
      if (!isNaN(v) && v > 0) { payload[k] = v; hasValue = true; }
    });
    if (!hasValue) {
      Alert.alert('Enter at least one measurement');
      return;
    }
    setMeasSaving(true);
    setMeasError(null);
    try {
      const { error } = await supabase.from('body_measurements').insert(payload);
      if (error) throw error;
      setMeasInputs({ chest: '', waist: '', hips: '', arms: '', thighs: '' });
      setShowMeasModal(false);
      await fetchData();
    } catch (e: any) {
      setMeasError(e.message ?? 'Could not save measurements. Try again.');
    } finally {
      setMeasSaving(false);
    }
  };

  const handleAIAnalysis = async () => {
    setAiLoading(true);
    setAiAnalysis(null);
    setAiError(null);
    try {
      const currentWeight = weightLogs[weightLogs.length - 1]?.weight ?? 0;
      const startWeight   = weightLogs[0]?.weight ?? currentWeight;
      const heightCm      = profile?.height_cm ?? 170;
      const heightM       = heightCm / 100;
      const currentBMI    = (currentWeight / (heightM * heightM)).toFixed(1);
      const weeks         = Math.max(1, Math.round(weightLogs.length * 4));
      const text = await askAI('progress_analysis', {
        currentWeight, startWeight, currentBMI, goal: selectedGoal, weeks,
      });
      setAiAnalysis(text);
    } catch (e: any) {
      setAiError(e.message ?? 'Could not generate analysis. Try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const currentWeight  = weightLogs[weightLogs.length - 1]?.weight ?? null;
  const startWeight    = weightLogs[0]?.weight ?? null;
  const weightLost     = startWeight && currentWeight ? +(startWeight - currentWeight).toFixed(1) : null;
  const targetWeight   = profile?.target_weight ?? null;
  const chartMax       = weightLogs.length ? Math.max(...weightLogs.map(w => w.weight)) : 1;
  const chartMin       = weightLogs.length ? Math.min(...weightLogs.map(w => w.weight)) : 0;
  const chartRange     = chartMax - chartMin || 1;
  const weightGoalPct  = targetWeight && startWeight && currentWeight && startWeight !== targetWeight
    ? Math.min(100, Math.round(((startWeight - currentWeight) / (startWeight - targetWeight)) * 100))
    : 0;

  const measFields: { key: keyof Measurements; label: string }[] = [
    { key: 'chest',  label: 'Chest'  },
    { key: 'waist',  label: 'Waist'  },
    { key: 'hips',   label: 'Hips'   },
    { key: 'arms',   label: 'Arms'   },
    { key: 'thighs', label: 'Thighs' },
  ];

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <LottieView
            source={require('@/assets/animations/forecast.json')}
            autoPlay
            loop
            style={styles.loadingLottie}
          />
          <Text style={styles.loadingText}>LOADING YOUR PROGRESS</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── BACK / MENU ── */}
        <BPBackBtn />

        {/* ── HEADER ── */}
        <FadeInView delay={0}>
          <View style={styles.header}>
            <View style={styles.headerGlow} />
            <View style={{ flex: 1 }}>
              <Text style={styles.headerGym}>{gymName.toUpperCase()}</Text>
              <Text style={styles.headerTitle}>BODY PROGRESS</Text>
              <Text style={styles.headerSub}>Track your transformation journey</Text>
            </View>
            <View style={styles.headerIconBox}>
              <MaterialCommunityIcons name="trending-up" size={28} color={Colors.green} />
            </View>
          </View>
        </FadeInView>

        {/* ── FETCH ERROR ── */}
        {fetchError && (
          <FadeInView delay={0}>
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>⚠️  {fetchError}</Text>
              <AnimatedPressable onPress={fetchData} style={styles.retryBtn} scaleDown={0.93}>
                <Text style={styles.retryText}>Retry</Text>
              </AnimatedPressable>
            </View>
          </FadeInView>
        )}

        {/* ── SUMMARY STATS ── */}
        <FadeInView delay={40}>
          <View style={styles.statsRow}>
            {[
              {
                val: currentWeight != null ? `${currentWeight}` : '—',
                unit: 'kg', label: 'CURRENT', icon: '⚖️', color: Colors.text,
              },
              {
                val: weightLost != null
                  ? (weightLost >= 0 ? `−${weightLost}` : `+${Math.abs(weightLost)}`)
                  : '—',
                unit: 'kg', label: 'CHANGE',
                icon: weightLost != null && weightLost > 0 ? '📉' : '📈',
                color: weightLost != null && weightLost > 0 ? Colors.green : Colors.orange,
              },
              {
                val: targetWeight != null ? `${targetWeight}` : '—',
                unit: 'kg', label: 'GOAL', icon: '🎯', color: Colors.accent,
              },
              {
                val: `${weightLogs.length}`,
                unit: 'logs', label: 'TRACKED', icon: '📅', color: Colors.text,
              },
            ].map((s, i) => (
              <View key={i} style={styles.statCard}>
                <Text style={styles.statIcon}>{s.icon}</Text>
                <Text style={[styles.statVal, { color: s.color }]}>{s.val}</Text>
                <Text style={styles.statUnit}>{s.unit}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </FadeInView>

        {/* ── LOG WEIGHT ── */}
        <FadeInView delay={80}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardAccentBar} />
              <Text style={styles.cardTitle}>LOG TODAY'S WEIGHT</Text>
            </View>
            {logError && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>⚠️  {logError}</Text>
              </View>
            )}
            <View style={styles.logRow}>
              <TextInput
                style={styles.logInput}
                placeholder="e.g. 78.5"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
                value={newWeight}
                onChangeText={setNewWeight}
              />
              <View style={styles.logUnitBox}>
                <Text style={styles.logUnit}>KG</Text>
              </View>
              <AnimatedPressable
                style={styles.logBtn}
                scaleDown={0.96}
                onPress={handleLogWeight}
                disabled={logSaving}
              >
                {logSaving ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Text style={styles.logBtnText}>LOG IT</Text>
                )}
              </AnimatedPressable>
            </View>
            {currentWeight != null && (
              <Text style={styles.lastLogNote}>
                Last logged: <Text style={{ color: Colors.accent }}>{currentWeight} kg</Text>
                {' · '}
                {new Date(weightLogs[weightLogs.length - 1]?.logged_date).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                })}
              </Text>
            )}
          </View>
        </FadeInView>

        {/* ── WEIGHT CHART ── */}
        <FadeInView delay={140}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardAccentBar} />
              <Text style={styles.cardTitle}>WEIGHT TREND</Text>
              {weightLost != null && (
                <View style={[
                  styles.trendBadge,
                  { backgroundColor: (weightLost > 0 ? Colors.green : Colors.orange) + '18' },
                ]}>
                  <Text style={[
                    styles.trendBadgeText,
                    { color: weightLost > 0 ? Colors.green : Colors.orange },
                  ]}>
                    {weightLost > 0 ? `−${weightLost}` : `+${Math.abs(weightLost)}`} kg total
                  </Text>
                </View>
              )}
            </View>
            {weightLogs.length === 0 ? (
              <View style={styles.emptyBox}>
                <LottieView
                  source={require('@/assets/animations/forecast.json')}
                  autoPlay
                  loop
                  style={styles.emptyLottie}
                />
                <Text style={styles.emptyText}>Log your weight to see your trend chart</Text>
              </View>
            ) : (
              <>
                <View style={styles.chart}>
                  {weightLogs.map((w, i) => {
                    const barH     = 28 + ((w.weight - chartMin) / chartRange) * 68;
                    const isLatest = i === weightLogs.length - 1;
                    const dateLabel = new Date(w.logged_date).getDate().toString().padStart(2, '0');
                    const isDown   = i > 0 && w.weight < weightLogs[i - 1].weight;
                    return (
                      <View key={w.id} style={styles.barCol}>
                        <Text style={[styles.barVal, isLatest && { color: Colors.accent }]}>{w.weight}</Text>
                        <View style={styles.barTrack}>
                          <View style={[
                            styles.bar,
                            { height: barH },
                            isLatest && { backgroundColor: Colors.accent },
                            !isLatest && isDown && { backgroundColor: Colors.green + '80' },
                            !isLatest && !isDown && { backgroundColor: Colors.accent + '35' },
                          ]} />
                        </View>
                        <Text style={styles.barDate}>{dateLabel}</Text>
                      </View>
                    );
                  })}
                </View>
                <View style={styles.chartLegend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: Colors.accent }]} />
                    <Text style={styles.legendText}>Latest</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: Colors.green + '80' }]} />
                    <Text style={styles.legendText}>Drop</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: Colors.accent + '35' }]} />
                    <Text style={styles.legendText}>Previous</Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </FadeInView>

        {/* ── GOAL PROGRESS ── */}
        {(targetWeight != null || weightLogs.length > 0) && (
          <FadeInView delay={200}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardAccentBar} />
                <Text style={styles.cardTitle}>WEIGHT GOAL</Text>
              </View>
              {targetWeight == null ? (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyEmoji}>🎯</Text>
                  <Text style={styles.emptyText}>No target set. Ask your trainer to update your profile.</Text>
                </View>
              ) : (
                <View style={styles.goalBlock}>
                  <View style={styles.goalWeightRow}>
                    <View style={styles.goalWeightBox}>
                      <Text style={styles.goalWeightVal}>{currentWeight ?? '—'}</Text>
                      <Text style={styles.goalWeightUnit}>kg now</Text>
                    </View>
                    <View style={styles.goalArrowTrack}>
                      <View style={[styles.goalArrowFill, { width: `${weightGoalPct}%` as any }]} />
                      <Text style={styles.goalArrowIcon}>→</Text>
                    </View>
                    <View style={[styles.goalWeightBox, { borderColor: Colors.accent + '50' }]}>
                      <Text style={[styles.goalWeightVal, { color: Colors.accent }]}>{targetWeight}</Text>
                      <Text style={styles.goalWeightUnit}>kg goal</Text>
                    </View>
                  </View>
                  <View style={styles.goalBarWrap}>
                    <View style={styles.goalBarTrack}>
                      <View style={[styles.goalBarFill, { width: `${weightGoalPct}%` as any }]} />
                    </View>
                    <Text style={styles.goalPct}>{weightGoalPct}%</Text>
                  </View>
                  {weightLost != null && weightLost > 0 && targetWeight && currentWeight && (
                    <Text style={styles.goalNote}>
                      {weightLost} kg lost · {Math.max(0, +(currentWeight - targetWeight).toFixed(1))} kg to go
                    </Text>
                  )}
                </View>
              )}
            </View>
          </FadeInView>
        )}

        {/* ── BODY MEASUREMENTS ── */}
        <FadeInView delay={260}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardAccentBar} />
              <Text style={styles.cardTitle}>BODY MEASUREMENTS</Text>
              <AnimatedPressable
                style={styles.addMeasBtn}
                scaleDown={0.94}
                onPress={() => setShowMeasModal(true)}
              >
                <MaterialCommunityIcons name="plus" size={13} color={Colors.accent} />
                <Text style={styles.addMeasText}>LOG</Text>
              </AnimatedPressable>
            </View>
            {latestMeas == null ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyEmoji}>📐</Text>
                <Text style={styles.emptyText}>No measurements yet. Tap LOG to add your first.</Text>
              </View>
            ) : (
              <View style={styles.measGrid}>
                {measFields.map((f) => {
                  const curr = latestMeas[f.key] as number | undefined;
                  const prev = prevMeas?.[f.key] as number | undefined;
                  const diff = curr != null && prev != null ? +((curr - prev)).toFixed(1) : null;
                  if (curr == null) return null;
                  const improved = diff != null && diff < 0;
                  return (
                    <View key={f.key} style={styles.measCard}>
                      <Text style={styles.measIcon}>{MEAS_ICONS[f.key]}</Text>
                      <Text style={styles.measVal}>{curr}</Text>
                      <Text style={styles.measUnit}>cm</Text>
                      <Text style={styles.measLabel}>{f.label.toUpperCase()}</Text>
                      {diff != null && (
                        <View style={[
                          styles.measChangeBadge,
                          { backgroundColor: (improved ? Colors.green : Colors.orange) + '18' },
                        ]}>
                          <Text style={[
                            styles.measChangeText,
                            { color: improved ? Colors.green : Colors.orange },
                          ]}>
                            {diff > 0 ? `+${diff}` : diff}
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </FadeInView>

        {/* ── AI ANALYSIS ── */}
        <FadeInView delay={320}>
          <View style={styles.aiCard}>
            <View style={styles.aiGlow} />
            <AnimatedPressable
              style={styles.aiHeader}
              onPress={() => setShowAI(!showAI)}
              scaleDown={0.98}
            >
              <View style={styles.aiHeaderLeft}>
                <View style={styles.aiIconBox}>
                  <MaterialCommunityIcons name="robot-outline" size={18} color={Colors.orange} />
                </View>
                <View>
                  <Text style={styles.aiLabel}>AI PROGRESS ANALYSIS</Text>
                  <Text style={styles.aiSub}>Get personalized feedback on your data</Text>
                </View>
              </View>
              <MaterialCommunityIcons
                name={showAI ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={Colors.textMuted}
              />
            </AnimatedPressable>

            {showAI && (
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

                {aiError && (
                  <View style={styles.errorBanner}>
                    <Text style={styles.errorText}>⚠️  {aiError}</Text>
                  </View>
                )}

                {weightLogs.length === 0 ? (
                  <Text style={styles.emptyText}>Log your weight first to get an AI analysis.</Text>
                ) : (
                  <AnimatedPressable
                    style={styles.analyseBtn}
                    scaleDown={0.97}
                    onPress={handleAIAnalysis}
                    disabled={aiLoading}
                  >
                    {aiLoading ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <>
                        <MaterialCommunityIcons name="chart-line" size={15} color="#FFF" />
                        <Text style={styles.analyseBtnText}>ANALYSE MY PROGRESS</Text>
                      </>
                    )}
                  </AnimatedPressable>
                )}

                {aiAnalysis && (
                  <View style={styles.aiResult}>
                    <View style={styles.aiResultHeader}>
                      <MaterialCommunityIcons name="robot-outline" size={13} color={Colors.orange} />
                      <Text style={styles.aiResultTitle}>AI ANALYSIS</Text>
                    </View>
                    <Text style={styles.aiResultText}>{aiAnalysis}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </FadeInView>

        {/* ── MOTIVATION CARD ── */}
        {currentWeight != null && targetWeight != null && (
          <FadeInView delay={400}>
            <View style={styles.motivCard}>
              <View style={styles.motivGlow} />
              <View style={{ flex: 1 }}>
                <Text style={styles.motivMicro}>{gymName.toUpperCase()} · PROGRESS REPORT</Text>
                <Text style={styles.motivTitle}>KEEP PUSHING</Text>
                <Text style={styles.motivText}>
                  {weightLost != null && weightLost > 0
                    ? `${weightLost} kg down — ${Math.max(0, +(currentWeight - targetWeight).toFixed(1))} kg to go!`
                    : `${Math.max(0, +(currentWeight - targetWeight).toFixed(1))} kg to your goal!`}
                </Text>
              </View>
              <View style={styles.motivCircle}>
                <Text style={styles.motivPct}>{weightGoalPct}</Text>
                <Text style={styles.motivPctSymbol}>%</Text>
              </View>
            </View>
          </FadeInView>
        )}

        {/* ── FOOTER ── */}
        <FadeInView delay={460}>
          <View style={styles.footer}>
            <Text style={styles.footerText}>{gymName.toUpperCase()} · BODY PROGRESS</Text>
          </View>
        </FadeInView>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ── MEASUREMENTS MODAL ── */}
      <Modal visible={showMeasModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>LOG MEASUREMENTS</Text>
                <Text style={styles.modalSub}>Enter any measurements in cm</Text>
              </View>
              <Pressable
                onPress={() => setShowMeasModal(false)}
                style={({ pressed }) => [styles.modalClose, pressed && { opacity: 0.6 }]}
              >
                <MaterialCommunityIcons name="close" size={18} color={Colors.textMuted} />
              </Pressable>
            </View>
            {measError && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>⚠️  {measError}</Text>
              </View>
            )}
            {(['chest', 'waist', 'hips', 'arms', 'thighs'] as const).map(k => (
              <View key={k} style={styles.modalRow}>
                <Text style={styles.modalRowIcon}>{MEAS_ICONS[k]}</Text>
                <Text style={styles.modalLabel}>{k.charAt(0).toUpperCase() + k.slice(1)}</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="cm"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                  value={measInputs[k]}
                  onChangeText={v => setMeasInputs(prev => ({ ...prev, [k]: v }))}
                />
              </View>
            ))}
            <AnimatedPressable
              style={styles.modalSaveBtn}
              scaleDown={0.97}
              onPress={handleSaveMeasurements}
              disabled={measSaving}
            >
              {measSaving ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Text style={styles.modalSaveBtnText}>SAVE MEASUREMENTS</Text>
              )}
            </AnimatedPressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content:   { padding: 16, gap: 12 },

  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingLottie: {
    width: 200,
    height: 200,
  },
  loadingText: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: Colors.textMuted,
    letterSpacing: 2,
  },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  retryBtn: {
    backgroundColor: Colors.red + '25',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  retryText: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    color: Colors.red,
    letterSpacing: 0.5,
  },

  // HEADER
  header: {
    backgroundColor: Colors.bgCard,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.green + '30',
    overflow: 'hidden',
  },
  headerGlow: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.green + '15',
  },
  headerGym: {
    fontSize: 9,
    fontFamily: Fonts.bold,
    color: Colors.green,
    letterSpacing: 2,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: Fonts.condensedBold,
    color: Colors.text,
    letterSpacing: 1,
  },
  headerSub: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    marginTop: 2,
  },
  headerIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.green + '18',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // STATS
  statsRow: { flexDirection: 'row', gap: 8 },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statIcon:  { fontSize: 16, marginBottom: 2 },
  statVal:   { fontSize: 18, fontFamily: Fonts.condensedBold },
  statUnit:  { fontSize: 9, fontFamily: Fonts.bold, color: Colors.accent, letterSpacing: 0.5 },
  statLabel: { fontSize: 8, fontFamily: Fonts.medium, color: Colors.textMuted, letterSpacing: 0.8 },

  // CARD
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardAccentBar: {
    width: 3,
    height: 14,
    borderRadius: 2,
    backgroundColor: Colors.accent,
  },
  cardTitle: {
    fontSize: 11,
    fontFamily: Fonts.bold,
    color: Colors.textMuted,
    letterSpacing: 1.5,
    flex: 1,
  },
  trendBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  trendBadgeText: {
    fontSize: 10,
    fontFamily: Fonts.bold,
    letterSpacing: 0.5,
  },

  // LOG WEIGHT
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logInput: {
    flex: 1,
    backgroundColor: Colors.bgElevated,
    borderRadius: 12,
    padding: 14,
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  logUnitBox: {
    backgroundColor: Colors.bgElevated,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  logUnit: {
    fontSize: 12,
    fontFamily: Fonts.condensedBold,
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  logBtn: {
    backgroundColor: Colors.accent,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
    minWidth: 72,
    alignItems: 'center',
  },
  logBtnText: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: '#000',
    letterSpacing: 0.8,
  },
  lastLogNote: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
  },

  // CHART
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 5,
    height: 120,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  barTrack: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '75%',
    borderRadius: 5,
    minHeight: 4,
  },
  barVal: {
    fontSize: 8,
    fontFamily: Fonts.condensedBold,
    color: Colors.textMuted,
  },
  barDate: {
    fontSize: 9,
    fontFamily: Fonts.medium,
    color: Colors.textMuted,
  },
  chartLegend: {
    flexDirection: 'row',
    gap: 14,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
  },

  // GOAL
  goalBlock: { gap: 12 },
  goalWeightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  goalWeightBox: {
    alignItems: 'center',
    backgroundColor: Colors.bgElevated,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  goalWeightVal: {
    fontSize: 22,
    fontFamily: Fonts.condensedBold,
    color: Colors.text,
  },
  goalWeightUnit: {
    fontSize: 9,
    fontFamily: Fonts.bold,
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  goalArrowTrack: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  goalArrowFill: {
    height: 4,
    backgroundColor: Colors.accent,
    borderRadius: 2,
  },
  goalArrowIcon: {
    position: 'absolute',
    right: -6,
    top: -8,
    fontSize: 16,
    color: Colors.accent,
  },
  goalBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  goalBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  goalBarFill: {
    height: 6,
    backgroundColor: Colors.accent,
    borderRadius: 3,
  },
  goalPct: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: Colors.accent,
    width: 36,
    textAlign: 'right',
  },
  goalNote: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
  },

  // MEASUREMENTS
  addMeasBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: Colors.accentMuted,
    borderWidth: 1,
    borderColor: Colors.accent + '40',
  },
  addMeasText: {
    fontSize: 10,
    fontFamily: Fonts.bold,
    color: Colors.accent,
    letterSpacing: 0.8,
  },
  measGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  measCard: {
    width: '30%',
    alignItems: 'center',
    backgroundColor: Colors.bgElevated,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 2,
  },
  measIcon:  { fontSize: 20, marginBottom: 4 },
  measVal:   { fontSize: 18, fontFamily: Fonts.condensedBold, color: Colors.text },
  measUnit:  { fontSize: 9, fontFamily: Fonts.bold, color: Colors.textMuted },
  measLabel: { fontSize: 8, fontFamily: Fonts.medium, color: Colors.textMuted, letterSpacing: 0.8 },
  measChangeBadge: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 2,
  },
  measChangeText: {
    fontSize: 9,
    fontFamily: Fonts.bold,
  },

  // EMPTY
  emptyBox: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 16,
  },
  emptyLottie: {
    width: 120,
    height: 80,
  },
  emptyEmoji: { fontSize: 32 },
  emptyText: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },

  // AI
  aiCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.orange + '30',
    overflow: 'hidden',
  },
  aiGlow: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.orange + '10',
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
    backgroundColor: Colors.orange + '18',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiLabel: {
    fontSize: 11,
    fontFamily: Fonts.bold,
    color: Colors.orange,
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
    backgroundColor: Colors.orange + '18',
    borderColor: Colors.orange,
  },
  chipText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: Colors.textMuted,
  },
  chipTextActive: {
    color: Colors.orange,
    fontFamily: Fonts.bold,
  },
  analyseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.orange,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 4,
  },
  analyseBtnText: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: '#FFF',
    letterSpacing: 1,
  },
  aiResult: {
    backgroundColor: Colors.bgElevated,
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  aiResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aiResultTitle: {
    fontSize: 9,
    fontFamily: Fonts.bold,
    color: Colors.orange,
    letterSpacing: 1.5,
  },
  aiResultText: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.text,
    lineHeight: 20,
  },

  // MOTIVATION
  motivCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 18,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: Colors.accent + '25',
    overflow: 'hidden',
  },
  motivGlow: {
    position: 'absolute',
    left: -20,
    top: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.accentGlow,
  },
  motivMicro: {
    fontSize: 8,
    fontFamily: Fonts.bold,
    color: Colors.accent,
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  motivTitle: {
    fontSize: 24,
    fontFamily: Fonts.condensedBold,
    color: Colors.text,
    letterSpacing: 0.5,
  },
  motivText: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    marginTop: 2,
  },
  motivCircle: {
    backgroundColor: Colors.accentMuted,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 1,
  },
  motivPct: {
    fontSize: 32,
    fontFamily: Fonts.condensedBold,
    color: Colors.accent,
  },
  motivPctSymbol: {
    fontSize: 16,
    fontFamily: Fonts.condensedBold,
    color: Colors.accent,
  },

  // FOOTER
  footer: { alignItems: 'center', paddingVertical: 8 },
  footerText: {
    fontSize: 10,
    fontFamily: Fonts.bold,
    color: Colors.textMuted,
    letterSpacing: 2,
  },

  // MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    gap: 14,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  modalTitle: {
    fontSize: 15,
    fontFamily: Fonts.condensedBold,
    color: Colors.text,
    letterSpacing: 0.8,
  },
  modalSub: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    marginTop: 2,
  },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.bgElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalRowIcon: {
    fontSize: 18,
    width: 24,
    textAlign: 'center',
  },
  modalLabel: {
    flex: 1,
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: Colors.text,
  },
  modalInput: {
    backgroundColor: Colors.bgElevated,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    width: 80,
    textAlign: 'center',
  },
  modalSaveBtn: {
    backgroundColor: Colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  modalSaveBtnText: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: '#000',
    letterSpacing: 1,
  },
});
