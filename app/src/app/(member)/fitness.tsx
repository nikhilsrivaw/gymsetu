import { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { supabase } from '@/lib/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import LottieView from '@/components/AppLottie';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import AnimatedPressable from '@/components/AnimatedPressable';
import FadeInView from '@/components/FadeInView';
import { useAuthStore } from '@/store/authStore';

import { toLocalDate, todayLocal } from '@/lib/date';
interface TrainerPlan {
  id: string;
  name: string;
  goal: string | null;
  level: string | null;
  days_per_week: number | null;
  duration_weeks: number | null;
  color: string | null;
  trainer_name: string;
  exercises: { name: string; sets: number; reps: string; rest: string }[];
}

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const tools: {
  label: string;
  desc: string;
  icon: IconName;
  color: string;
  route: string;
  tag: string;
  tagline: string;
}[] = [
  {
    label:   'Workout Tracker',
    desc:    'Log sets, reps & weight for every session',
    icon:    'clipboard-list-outline',
    color:   Colors.accent,
    route:   '/(member)/workout-tracker',
    tag:     'ACTIVE',
    tagline: "TODAY'S FOCUS",
  },
  {
    label:   'Body Progress',
    desc:    'Track weight, measurements & milestones',
    icon:    'trending-up',
    color:   Colors.green,
    route:   '/(member)/body-progress',
    tag:     'METRICS',
    tagline: 'TRACK GROWTH',
  },
  {
    label:   'Diet Plan',
    desc:    'Your daily meal plan & calorie targets',
    icon:    'food-apple-outline',
    color:   '#22C55E',
    route:   '/(member)/diet-plan',
    tag:     'NUTRITION',
    tagline: 'FUEL RIGHT',
  },
  {
    label:   'Exercise Library',
    desc:    'Browse 100+ exercises with form guides',
    icon:    'dumbbell',
    color:   Colors.orange,
    route:   '/(member)/exercise-library',
    tag:     'LIBRARY',
    tagline: 'LEARN FORM',
  },
  {
    label:   'BMI Calculator',
    desc:    'Check your body mass index & health range',
    icon:    'scale-bathroom',
    color:   '#3B82F6',
    route:   '/(member)/bmi-calculator',
    tag:     'HEALTH',
    tagline: 'KNOW YOUR BODY',
  },
];


const QUOTES = [
  'Your only competition is who you were yesterday.',
  'Pain is temporary. Pride is forever.',
  'Every rep counts. Every day matters.',
  'Strong body, stronger mind.',
];

function BackMenuBtn() {
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

export default function FitnessScreen() {
  const router  = useRouter();
  const lottieRef = useRef<any>(null);

  const { profile, gymProfile } = useAuthStore();

  const gymName    = gymProfile?.name ?? 'My Gym';
  const firstName  = profile?.full_name?.split(' ')[0] ?? 'Member';
  const quoteIndex = new Date().getDay() % QUOTES.length;

  const [liveStats, setLiveStats] = useState({ burned: 0, duration: 0, sets: 0, streak: 0 });
  const [trainerPlan, setTrainerPlan] = useState<TrainerPlan | null>(null);

  const fetchTrainerPlan = useCallback(async () => {
    if (!profile?.id || !profile?.gym_id) return;

    // Step 1: get this member's assigned trainer_id from their profile row
    const { data: myRow } = await supabase
      .from('profiles')
      .select('trainer_id')
      .eq('id', profile.id)
      .maybeSingle();

    const trainerId = (myRow as any)?.trainer_id;
    if (!trainerId) { setTrainerPlan(null); return; }

    // Step 2: get trainer's most recent workout plan
    const { data: wp } = await supabase
      .from('workout_plans')
      .select('*')
      .eq('trainer_id', trainerId)
      .eq('gym_id', profile.gym_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!wp) { setTrainerPlan(null); return; }

    // Step 3: get trainer's name
    const { data: trainerRow } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', trainerId)
      .maybeSingle();

    const w = wp as any;
    setTrainerPlan({
      id:             w.id,
      name:           w.name,
      goal:           w.goal ?? null,
      level:          w.level ?? null,
      days_per_week:  w.days ? parseInt(w.days) || null : (w.days_per_week ?? null),
      duration_weeks: w.weeks ?? w.duration_weeks ?? null,
      color:          w.color ?? null,
      trainer_name:   trainerRow?.full_name ?? 'Your Trainer',
      exercises:      Array.isArray(w.exercises) ? w.exercises : [],
    });
  }, [profile?.id, profile?.gym_id]);

  const fetchStats = useCallback(async () => {
    if (!profile?.id) return;
    const today = todayLocal();
    try {
      const { data: sessions } = await supabase
        .from('workout_sessions')
        .select('sets_done, logged_date')
        .eq('member_id', profile.id)
        .order('logged_date', { ascending: false })
        .limit(60);

      const todaySession = (sessions ?? []).find((s: any) => s.logged_date === today);
      const setsDone = todaySession?.sets_done ?? 0;

      const dateSet = new Set((sessions ?? []).map((s: any) => s.logged_date));
      let streak = 0;
      const check = new Date();
      check.setHours(0, 0, 0, 0);
      while (dateSet.has(toLocalDate(check))) {
        streak++;
        check.setDate(check.getDate() - 1);
      }

      setLiveStats({ burned: setsDone * 10, duration: setsDone * 3, sets: setsDone, streak });
    } catch { /* non-critical */ }
  }, [profile?.id]);

  useFocusEffect(useCallback(() => {
    fetchStats();
    fetchTrainerPlan();
  }, [fetchStats, fetchTrainerPlan]));

  const STAT_CATEGORIES = [
    { val: liveStats.burned > 0 ? String(liveStats.burned) : '—', unit: 'kcal', label: 'BURNED',   icon: 'fire' as IconName, color: '#FF6B6B' },
    { val: liveStats.duration > 0 ? String(liveStats.duration) : '—', unit: 'min',  label: 'DURATION', icon: 'timer-outline' as IconName,  color: Colors.accent },
    { val: liveStats.sets > 0 ? String(liveStats.sets) : '—',    unit: 'sets', label: 'VOLUME',   icon: 'arm-flex' as IconName,  color: Colors.green },
    { val: liveStats.streak > 0 ? String(liveStats.streak) : '—', unit: 'days', label: 'STREAK',   icon: 'lightning-bolt' as IconName,  color: '#FFB347' },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >

      {/* ── BACK / MENU ── */}
      <BackMenuBtn />

      {/* ── HERO ── */}
      <FadeInView delay={0}>
        <View style={styles.hero}>
          <View style={styles.heroGlow1} />
          <View style={styles.heroGlow2} />
          <View style={styles.heroTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroGym}>{gymName.toUpperCase()}</Text>
              <Text style={styles.heroTitle}>FITNESS HUB</Text>
              <Text style={styles.heroSub}>Hey {firstName}, let's crush it today</Text>
            </View>
            <View style={styles.heroIconBox}>
              <MaterialCommunityIcons name="dumbbell" size={30} color={Colors.accent} />
            </View>
          </View>
          <View style={styles.quoteBox}>
            <Text style={styles.quoteText}>"{QUOTES[quoteIndex]}"</Text>
          </View>
        </View>
      </FadeInView>

      {/* ── TRAINER PLAN ── */}
      {trainerPlan !== null && (
        <FadeInView delay={40}>
          <View style={[styles.trainerPlanCard, { borderColor: (trainerPlan.color ?? Colors.accent) + '40' }]}>
            {/* Top glow wash */}
            <View style={[styles.tpGlow, { backgroundColor: (trainerPlan.color ?? Colors.accent) + '10' }]} />

            {/* Header row */}
            <View style={styles.tpHeader}>
              <View style={[styles.tpIconBox, { backgroundColor: (trainerPlan.color ?? Colors.accent) + '20' }]}>
                <MaterialCommunityIcons name="clipboard-list-outline" size={20} color={trainerPlan.color ?? Colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.tpLabel}>MY TRAINER PLAN</Text>
                <Text style={styles.tpName}>{trainerPlan.name}</Text>
              </View>
              <View style={[styles.tpBadge, { backgroundColor: (trainerPlan.color ?? Colors.accent) + '20', borderColor: (trainerPlan.color ?? Colors.accent) + '40' }]}>
                <MaterialCommunityIcons name="account-tie-outline" size={11} color={trainerPlan.color ?? Colors.accent} />
                <Text style={[styles.tpBadgeText, { color: trainerPlan.color ?? Colors.accent }]}>{trainerPlan.trainer_name.split(' ')[0].toUpperCase()}</Text>
              </View>
            </View>

            {/* Meta chips */}
            <View style={styles.tpChipRow}>
              {trainerPlan.goal ? (
                <View style={styles.tpChip}>
                  <MaterialCommunityIcons name="target" size={11} color={Colors.textMuted} />
                  <Text style={styles.tpChipText}>{trainerPlan.goal}</Text>
                </View>
              ) : null}
              {trainerPlan.level ? (
                <View style={styles.tpChip}>
                  <MaterialCommunityIcons name="signal-cellular-2" size={11} color={Colors.textMuted} />
                  <Text style={styles.tpChipText}>{trainerPlan.level}</Text>
                </View>
              ) : null}
              {trainerPlan.days_per_week ? (
                <View style={styles.tpChip}>
                  <MaterialCommunityIcons name="calendar-week" size={11} color={Colors.textMuted} />
                  <Text style={styles.tpChipText}>{trainerPlan.days_per_week}d/wk</Text>
                </View>
              ) : null}
              {trainerPlan.duration_weeks ? (
                <View style={styles.tpChip}>
                  <MaterialCommunityIcons name="timer-outline" size={11} color={Colors.textMuted} />
                  <Text style={styles.tpChipText}>{trainerPlan.duration_weeks} wks</Text>
                </View>
              ) : null}
            </View>

            {/* Exercises */}
            {trainerPlan.exercises.length > 0 && (
              <View style={styles.tpExTable}>
                {/* Table header */}
                <View style={[styles.tpExRow, styles.tpExHeaderRow]}>
                  <Text style={[styles.tpExCell, styles.tpExNameCell, styles.tpExHeader]}>EXERCISE</Text>
                  <Text style={[styles.tpExCell, styles.tpExHeader]}>SETS</Text>
                  <Text style={[styles.tpExCell, styles.tpExHeader]}>REPS</Text>
                  <Text style={[styles.tpExCell, styles.tpExHeader]}>REST</Text>
                </View>
                {trainerPlan.exercises.map((ex, i) => (
                  <View key={i} style={[styles.tpExRow, i % 2 === 1 && styles.tpExRowAlt]}>
                    <View style={[styles.tpExCell, styles.tpExNameCell, { flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
                      <Text style={[styles.tpExNum, { color: trainerPlan.color ?? Colors.accent }]}>{i + 1}</Text>
                      <Text style={styles.tpExName}>{ex.name}</Text>
                    </View>
                    <Text style={[styles.tpExCell, styles.tpExVal]}>{ex.sets}</Text>
                    <Text style={[styles.tpExCell, styles.tpExVal]}>{ex.reps}</Text>
                    <Text style={[styles.tpExCell, styles.tpExVal]}>{ex.rest}</Text>
                  </View>
                ))}
              </View>
            )}

            {trainerPlan.exercises.length === 0 && (
              <Text style={styles.tpNoEx}>No exercises added yet — check back soon.</Text>
            )}
          </View>
        </FadeInView>
      )}

      {/* ── TODAY'S STATS ── */}
      <FadeInView delay={60}>
        <View style={styles.statsSection}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>TODAY'S SNAPSHOT</Text>
            </View>
            <LottieView
              ref={lottieRef}
              source={require('@/assets/animations/Analytics.json')}
              autoPlay
              loop
              style={styles.snapshotLottie}
            />
          </View>
          <View style={styles.statsGrid}>
            {STAT_CATEGORIES.map((s, i) => (
              <View key={i} style={[styles.statCard, { borderColor: s.color + '30' }]}>
                <View style={[styles.statGlow, { backgroundColor: s.color + '15' }]} />
                <MaterialCommunityIcons name={s.icon} size={18} color={s.color} />
                <Text style={[styles.statVal, { color: s.color }]}>{s.val}</Text>
                <Text style={styles.statUnit}>{s.unit}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </FadeInView>

      {/* ── SECTION LABEL ── */}
      <FadeInView delay={100}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionAccent} />
          <Text style={styles.sectionTitle}>YOUR TOOLS — {tools.length} AVAILABLE</Text>
        </View>
      </FadeInView>

      {/* ── TOOL CARDS ── */}
      {tools.map((tool, i) => (
        <FadeInView key={tool.label} delay={140 + i * 60}>
          <AnimatedPressable
            style={styles.toolCard}
            scaleDown={0.97}
            onPress={() => router.push(tool.route as any)}
          >
            <View style={[styles.toolAccentBar, { backgroundColor: tool.color }]} />

            <View style={[styles.toolIconBox, { backgroundColor: tool.color + '18' }]}>
              <MaterialCommunityIcons name={tool.icon} size={24} color={tool.color} />
            </View>

            <View style={styles.toolText}>
              <View style={styles.toolTopRow}>
                <Text style={styles.toolLabel}>{tool.label}</Text>
                <View style={[styles.tagBadge, { backgroundColor: tool.color + '15' }]}>
                  <Text style={[styles.tagText, { color: tool.color }]}>{tool.tag}</Text>
                </View>
              </View>
              <Text style={styles.toolDesc}>{tool.desc}</Text>
              <Text style={[styles.toolTagline, { color: tool.color }]}>{tool.tagline} →</Text>
            </View>

            <MaterialCommunityIcons
              name="chevron-right"
              size={18}
              color={Colors.textMuted}
              style={{ marginLeft: 4 }}
            />
          </AnimatedPressable>
        </FadeInView>
      ))}

      {/* ── MOTIVATION STRIP ── */}
      <FadeInView delay={500}>
        <View style={styles.motivationStrip}>
          <MaterialCommunityIcons name="trophy" size={28} color={Colors.accent} />
          <View style={{ flex: 1 }}>
            <Text style={styles.motivationTitle}>KEEP THE STREAK ALIVE</Text>
            <Text style={styles.motivationSub}>Log your workout before midnight</Text>
          </View>
          <AnimatedPressable
            style={styles.motivationBtn}
            scaleDown={0.94}
            onPress={() => router.push('/(member)/workout-tracker' as any)}
          >
            <Text style={styles.motivationBtnText}>LOG NOW</Text>
          </AnimatedPressable>
        </View>
      </FadeInView>

      {/* ── FOOTER ── */}
      <FadeInView delay={560}>
        <View style={styles.footer}>
          <Text style={styles.footerText}>{gymName.toUpperCase()} · FITNESS HUB</Text>
        </View>
      </FadeInView>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },

  // ── Hero ──────────────────────────────────────────────────────
  hero: {
    backgroundColor: Colors.bgCard,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.accent + '25',
    overflow: 'hidden',
    gap: 14,
  },
  heroGlow1: {
    position: 'absolute',
    top: -40,
    left: -30,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: Colors.accent + '12',
  },
  heroGlow2: {
    position: 'absolute',
    bottom: -30,
    right: -20,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.accent + '08',
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroGym: {
    fontSize: 9,
    fontFamily: Fonts.bold,
    color: Colors.accent,
    letterSpacing: 2,
    marginBottom: 2,
  },
  heroTitle: {
    fontSize: 30,
    fontFamily: Fonts.condensedBold,
    color: Colors.text,
    letterSpacing: 1,
  },
  heroSub: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    marginTop: 3,
  },
  heroIconBox: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: Colors.bgElevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.accent + '30',
  },
  quoteBox: {
    backgroundColor: Colors.bgElevated,
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent + '60',
  },
  quoteText: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    fontStyle: 'italic',
    lineHeight: 17,
  },

  // ── Stats ─────────────────────────────────────────────────────
  statsSection: {
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  snapshotLottie: {
    width: 44,
    height: 44,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  statGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 40,
    borderRadius: 14,
  },
  statIcon: {
    marginBottom: 2,
  },
  statVal: {
    fontSize: 20,
    fontFamily: Fonts.condensedBold,
  },
  statUnit: {
    fontSize: 9,
    fontFamily: Fonts.bold,
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  statLabel: {
    fontSize: 8,
    fontFamily: Fonts.medium,
    color: Colors.textMuted,
    letterSpacing: 0.8,
  },

  // ── Section header ────────────────────────────────────────────
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionAccent: {
    width: 3,
    height: 14,
    borderRadius: 2,
    backgroundColor: Colors.accent,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: Fonts.bold,
    color: Colors.textMuted,
    letterSpacing: 1.5,
  },

  // ── Tool cards ────────────────────────────────────────────────
  toolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    paddingVertical: 16,
    paddingRight: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  toolAccentBar: {
    width: 4,
    alignSelf: 'stretch',
    marginRight: 14,
  },
  toolIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  toolText: {
    flex: 1,
    gap: 3,
  },
  toolTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toolLabel: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: Colors.text,
    flex: 1,
  },
  toolDesc: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  toolTagline: {
    fontSize: 9,
    fontFamily: Fonts.bold,
    letterSpacing: 0.8,
    marginTop: 1,
  },
  tagBadge: {
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  tagText: {
    fontSize: 8,
    fontFamily: Fonts.bold,
    letterSpacing: 0.8,
  },

  // ── Motivation strip ──────────────────────────────────────────
  motivationStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.accent + '30',
    overflow: 'hidden',
  },
  motivationEmoji: {
    fontSize: 28,
  },
  motivationTitle: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: Colors.text,
    letterSpacing: 0.5,
  },
  motivationSub: {
    fontSize: 10,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    marginTop: 2,
  },
  motivationBtn: {
    backgroundColor: Colors.accent,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  motivationBtnText: {
    fontSize: 10,
    fontFamily: Fonts.bold,
    color: '#000',
    letterSpacing: 0.8,
  },

  // ── Trainer Plan ──────────────────────────────────────────────
  trainerPlanCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    overflow: 'hidden',
  },
  tpGlow: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 80,
    borderRadius: 18,
  },
  tpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tpIconBox: {
    width: 42,
    height: 42,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tpLabel: {
    fontSize: 9,
    fontFamily: Fonts.bold,
    color: Colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  tpName: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: Colors.text,
  },
  tpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tpBadgeText: {
    fontSize: 9,
    fontFamily: Fonts.bold,
    letterSpacing: 0.8,
  },
  tpChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tpChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.bgElevated,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tpChipText: {
    fontSize: 10,
    fontFamily: Fonts.bold,
    color: Colors.textMuted,
  },
  tpExTable: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  tpExHeaderRow: {
    backgroundColor: Colors.bgElevated,
  },
  tpExRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tpExRowAlt: {
    backgroundColor: Colors.bgElevated + '55',
  },
  tpExCell: {
    width: 46,
    textAlign: 'center',
  },
  tpExNameCell: {
    flex: 1,
    textAlign: 'left',
  },
  tpExHeader: {
    fontSize: 8,
    fontFamily: Fonts.bold,
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  tpExNum: {
    fontSize: 11,
    fontFamily: Fonts.condensedBold,
  },
  tpExName: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: Colors.text,
    flex: 1,
  },
  tpExVal: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: Colors.textMuted,
  },
  tpNoEx: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: 8,
  },

  // ── Footer ────────────────────────────────────────────────────
  footer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  footerText: {
    fontSize: 10,
    fontFamily: Fonts.bold,
    color: Colors.textMuted,
    letterSpacing: 2,
  },
});
