import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
} from 'react-native';
import { useNavigation, useFocusEffect } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from '@/components/AppLottie';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import FadeInView from '@/components/FadeInView';
import AnimatedPressable from '@/components/AnimatedPressable';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

import { todayLocal } from '@/lib/date';
type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

// ── Quick actions config ──────────────────────────────────────
const QUICK_ACTIONS: {
  label: string; sub: string; icon: IconName;
  color: string; screen: string; countKey: string;
}[] = [
  { label: 'My Members',      sub: 'Active members in your gym',     icon: 'account-group-outline',  color: '#3B82F6',     screen: 'my-members',   countKey: 'members'   },
  { label: 'Mark Attendance', sub: 'Track who showed up today',      icon: 'check-circle-outline',   color: Colors.green,  screen: 'attendance',   countKey: 'checkins'  },
  { label: 'Workout Plans',   sub: 'Plans created by you',           icon: 'dumbbell',               color: '#A78BFA',     screen: 'workout-plans',countKey: 'plans'     },
  { label: 'Log Progress',    sub: 'Progress entries logged by you', icon: 'chart-line',             color: Colors.accent, screen: 'progress-log', countKey: 'logs'      },
];

// ── Mock today sessions (no sessions table yet) ───────────────
const MOCK_SESSIONS = [
  { id: 1, time: '6:00', ampm: 'AM', member: 'Amit Singh',  type: 'Strength Training',  status: 'done'     },
  { id: 2, time: '7:30', ampm: 'AM', member: 'Priya Nair',  type: 'Weight Loss',        status: 'done'     },
  { id: 3, time: '5:00', ampm: 'PM', member: 'Rahul Mehta', type: 'Muscle Gain',        status: 'upcoming' },
  { id: 4, time: '6:30', ampm: 'PM', member: 'Sneha Patel', type: 'Yoga & Flexibility', status: 'upcoming' },
];

// ── Mock weekly data (no sessions table yet) ──────────────────
const WEEK_BARS = [
  { day: 'M', val: 4 },
  { day: 'T', val: 3 },
  { day: 'W', val: 5 },
  { day: 'T', val: 2 },
  { day: 'F', val: 4 },
  { day: 'S', val: 3 },
  { day: 'S', val: 1 },
];
const WEEK_MAX = 5;

export default function TrainerHome() {
  const navigation = useNavigation();
  const insets     = useSafeAreaInsets();
  const { profile, gymProfile } = useAuthStore();

  const [memberCount,   setMemberCount]   = useState(0);
  const [todayCheckIns, setTodayCheckIns] = useState(0);
  const [monthTotal,    setMonthTotal]    = useState(0);
  const [plansCount,    setPlansCount]    = useState(0);
  const [logsCount,     setLogsCount]     = useState(0);
  const [loading,       setLoading]       = useState(true);

  const today      = todayLocal();
  const monthStart = today.slice(0, 8) + '01';

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'GOOD MORNING' : hour < 17 ? 'GOOD AFTERNOON' : 'GOOD EVENING';
  const firstName = profile?.full_name?.split(' ')[0] ?? 'Trainer';

  const doneSessions     = MOCK_SESSIONS.filter(s => s.status === 'done').length;
  const upcomingSessions = MOCK_SESSIONS.filter(s => s.status === 'upcoming').length;
  const todayIndex       = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

  useFocusEffect(useCallback(() => {
    let active = true;
    async function load() {
      if (!profile?.gym_id) { setLoading(false); return; }
      setLoading(true);

      const [members, checkIns, monthAtt, plans, logs] = await Promise.all([
        supabase.from('members').select('id', { count: 'exact', head: true })
          .eq('gym_id', profile.gym_id).eq('status', 'active'),
        supabase.from('attendance').select('id', { count: 'exact', head: true })
          .eq('gym_id', profile.gym_id).eq('check_in_date', today),
        supabase.from('attendance').select('id', { count: 'exact', head: true })
          .eq('gym_id', profile.gym_id).gte('check_in_date', monthStart),
        supabase.from('workout_plans').select('id', { count: 'exact', head: true })
          .eq('trainer_id', profile.id),
        supabase.from('progress_logs').select('id', { count: 'exact', head: true })
          .eq('trainer_id', profile.id),
      ]);

      if (active) {
        setMemberCount(members.count ?? 0);
        setTodayCheckIns(checkIns.count ?? 0);
        setMonthTotal(monthAtt.count ?? 0);
        setPlansCount(plans.count ?? 0);
        setLogsCount(logs.count ?? 0);
      }
      if (active) setLoading(false);
    }
    load();
    return () => { active = false; };
  }, [profile?.gym_id]));

  // ── Loading ──────────────────────────────────────────────────
  if (loading) return (
    <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
      <LottieView
        source={require('@/assets/animations/runningCat.json')}
        autoPlay loop
        style={{ width: 160, height: 160 }}
      />
      <Text style={s.loadingText}>LOADING YOUR DASHBOARD</Text>
    </View>
  );

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={[s.scroll, { paddingTop: insets.top + 10 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Top bar ─────────────────────────────────────────────── */}
      <FadeInView delay={0}>
        <View style={s.topBar}>
          <AnimatedPressable
            style={s.menuBtn}
            scaleDown={0.9}
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          >
            <MaterialCommunityIcons name="menu" size={22} color={Colors.text} />
          </AnimatedPressable>

          {/* Gym brand */}
          <View style={s.gymBrand}>
            {gymProfile?.logo_url ? (
              <View style={s.gymLogoWrap}>
                <MaterialCommunityIcons name="domain" size={14} color={Colors.accent} />
              </View>
            ) : (
              <View style={s.gymLogoWrap}>
                <Text style={s.gymLogoInitial}>
                  {(gymProfile?.name ?? 'G')[0].toUpperCase()}
                </Text>
              </View>
            )}
            <Text style={s.gymName} numberOfLines={1}>
              {gymProfile?.name?.toUpperCase() ?? ''}
            </Text>
          </View>

          <View style={s.trainerBadge}>
            <MaterialCommunityIcons name="whistle-outline" size={13} color={Colors.accent} />
            <Text style={s.trainerBadgeText}>TRAINER</Text>
          </View>
        </View>
      </FadeInView>

      {/* ── Hero card ───────────────────────────────────────────── */}
      <FadeInView delay={40}>
        <View style={s.heroCard}>
          <LinearGradient
            colors={[Colors.accent + '18', 'transparent']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          {/* Left accent bar */}
          <View style={s.heroBar} />

          <View style={{ flex: 1, paddingLeft: 14 }}>
            <Text style={s.heroGreeting}>{greeting}</Text>
            <Text style={s.heroName}>{firstName.toUpperCase()}</Text>
            <View style={s.heroSessionRow}>
              <View style={[s.heroSessionDot, { backgroundColor: upcomingSessions > 0 ? Colors.accent : Colors.green }]} />
              <Text style={s.heroSessionText}>
                {upcomingSessions > 0
                  ? `${upcomingSessions} session${upcomingSessions > 1 ? 's' : ''} coming up today`
                  : 'All sessions done for today'}
              </Text>
            </View>
          </View>

          {/* Sessions done ring */}
          <View style={s.heroRing}>
            <Text style={s.heroRingNum}>{doneSessions}</Text>
            <Text style={s.heroRingLabel}>DONE{'\n'}TODAY</Text>
          </View>
        </View>
      </FadeInView>

      {/* ── Stats strip ─────────────────────────────────────────── */}
      <FadeInView delay={80}>
        <View style={s.statsRow}>
          {[
            { val: memberCount,   label: 'MEMBERS',    icon: 'account-group-outline' as IconName,    color: '#3B82F6'    },
            { val: todayCheckIns, label: 'TODAY',      icon: 'map-marker-check-outline' as IconName, color: Colors.green },
            { val: monthTotal,    label: 'THIS MONTH', icon: 'calendar-month-outline' as IconName,   color: '#A78BFA'    },
          ].map((stat, i) => (
            <View key={i} style={[s.statCard, i < 2 && s.statCardBorder]}>
              <View style={[s.statIconBox, { backgroundColor: stat.color + '14', borderColor: stat.color + '25' }]}>
                <MaterialCommunityIcons name={stat.icon} size={14} color={stat.color} />
              </View>
              <Text style={s.statVal}>{stat.val}</Text>
              <Text style={s.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </FadeInView>

      {/* ── Add Member button ───────────────────────────────────── */}
      <FadeInView delay={100}>
        <AnimatedPressable
          style={s.addMemberBtn}
          scaleDown={0.97}
          onPress={() => navigation.navigate('add-member' as never)}
        >
          <LinearGradient
            colors={[Colors.accent, '#C55A00']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={s.addMemberBtnInner}
          >
            <MaterialCommunityIcons name="account-plus-outline" size={20} color="#fff" />
            <Text style={s.addMemberBtnText}>ADD NEW MEMBER</Text>
          </LinearGradient>
        </AnimatedPressable>
      </FadeInView>

      {/* ── Quick actions ────────────────────────────────────────── */}
      <FadeInView delay={120}>
        <View style={s.sectionHeader}>
          <View style={[s.sectionIconBox, { backgroundColor: Colors.accent + '14', borderColor: Colors.accent + '25' }]}>
            <MaterialCommunityIcons name="lightning-bolt" size={12} color={Colors.accent} />
          </View>
          <Text style={s.sectionTitle}>QUICK ACTIONS</Text>
        </View>

        <View style={s.actionsCard}>
          {QUICK_ACTIONS.map((a, i) => {
            const count = a.countKey === 'members'  ? memberCount
                        : a.countKey === 'checkins' ? todayCheckIns
                        : a.countKey === 'plans'    ? plansCount
                        : a.countKey === 'logs'     ? logsCount
                        : null;
            return (
              <AnimatedPressable
                key={a.label}
                style={[s.actionRow, i < QUICK_ACTIONS.length - 1 && s.actionRowBorder]}
                scaleDown={0.97}
                onPress={() => navigation.navigate(a.screen as never)}
              >
                {/* Left accent */}
                <View style={[s.actionAccent, { backgroundColor: a.color }]} />

                {/* Icon box */}
                <View style={[s.actionIconWrap, { backgroundColor: a.color + '18', borderColor: a.color + '30' }]}>
                  <MaterialCommunityIcons name={a.icon} size={20} color={a.color} />
                </View>

                {/* Text */}
                <View style={s.actionText}>
                  <Text style={s.actionLabel}>{a.label}</Text>
                  <Text style={s.actionSub}>{a.sub}</Text>
                </View>

                {/* Count badge — only shown when countKey is not 'none' */}
                {count !== null && (
                  <View style={[s.actionCountBadge, { backgroundColor: a.color + '14', borderColor: a.color + '25' }]}>
                    <Text style={[s.actionCount, { color: a.color }]}>{count}</Text>
                  </View>
                )}

                <MaterialCommunityIcons name="chevron-right" size={16} color={Colors.textMuted} style={{ marginLeft: 4 }} />
              </AnimatedPressable>
            );
          })}
        </View>
      </FadeInView>

      {/* ── Today's sessions ─────────────────────────────────────── */}
      <FadeInView delay={180}>
        <View style={s.sectionHeader}>
          <View style={[s.sectionIconBox, { backgroundColor: Colors.accent + '14', borderColor: Colors.accent + '25' }]}>
            <MaterialCommunityIcons name="clock-outline" size={12} color={Colors.accent} />
          </View>
          <Text style={s.sectionTitle}>TODAY'S SESSIONS</Text>
          {upcomingSessions > 0 && (
            <View style={s.upcomingPill}>
              <Text style={s.upcomingPillText}>{upcomingSessions} UPCOMING</Text>
            </View>
          )}
        </View>
      </FadeInView>

      {MOCK_SESSIONS.map((session, i) => {
        const done  = session.status === 'done';
        const color = done ? Colors.green : Colors.accent;
        return (
          <FadeInView key={session.id} delay={200 + i * 50}>
            <View style={[s.sessionCard, done && s.sessionCardDone]}>
              <View style={[s.sessionBar, { backgroundColor: color }]} />
              <View style={s.sessionTime}>
                <Text style={[s.sessionTimeNum, { color: done ? Colors.textMuted : Colors.text }]}>
                  {session.time}
                </Text>
                <Text style={s.sessionAmPm}>{session.ampm}</Text>
              </View>
              <View style={s.sessionDivider} />
              <View style={s.sessionInfo}>
                <Text style={[s.sessionMember, done && { color: Colors.textMuted }]}>
                  {session.member}
                </Text>
                <Text style={s.sessionType}>{session.type}</Text>
              </View>
              <View style={[s.sessionStatus, { backgroundColor: color + '14', borderColor: color + '30' }]}>
                <MaterialCommunityIcons
                  name={done ? 'check-circle-outline' : 'clock-fast'}
                  size={14}
                  color={color}
                />
              </View>
            </View>
          </FadeInView>
        );
      })}

      {/* ── Weekly bar chart ─────────────────────────────────────── */}
      <FadeInView delay={440}>
        <View style={s.sectionHeader}>
          <View style={[s.sectionIconBox, { backgroundColor: '#3B82F614', borderColor: '#3B82F625' }]}>
            <MaterialCommunityIcons name="chart-bar" size={12} color="#3B82F6" />
          </View>
          <Text style={s.sectionTitle}>THIS WEEK</Text>
        </View>
        <View style={s.chartCard}>
          <View style={s.barChart}>
            {WEEK_BARS.map((w, i) => {
              const isToday = i === todayIndex;
              const pct     = (w.val / WEEK_MAX) * 100;
              const color   = isToday ? Colors.accent : i < todayIndex ? Colors.green : Colors.border;
              return (
                <View key={i} style={s.barCol}>
                  <Text style={[s.barVal, isToday && { color: Colors.accent }]}>{w.val}</Text>
                  <View style={s.barTrack}>
                    <View style={[s.barFill, { height: `${pct}%` as any, backgroundColor: color }]} />
                  </View>
                  <Text style={[s.barDay, isToday && { color: Colors.accent }]}>{w.day}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </FadeInView>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────
const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.bg },
  scroll:      { paddingHorizontal: 16 },
  loadingText: { fontFamily: Fonts.condensedBold, fontSize: 13, color: Colors.textMuted, marginTop: 12, letterSpacing: 1.5 },

  // Top bar
  topBar:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  menuBtn:    { width: 40, height: 40, borderRadius: 11, backgroundColor: Colors.bgCard, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  gymBrand:   { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 7 },
  gymLogoWrap:{ width: 26, height: 26, borderRadius: 7, backgroundColor: Colors.accent + '18', borderWidth: 1, borderColor: Colors.accent + '30', justifyContent: 'center', alignItems: 'center' },
  gymLogoInitial: { fontFamily: Fonts.condensedBold, fontSize: 13, color: Colors.accent },
  gymName:    { fontFamily: Fonts.condensedBold, fontSize: 13, color: Colors.textMuted, letterSpacing: 1.5, flex: 1 },
  trainerBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.accent + '14', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: Colors.accent + '30' },
  trainerBadgeText: { fontFamily: Fonts.condensedBold, fontSize: 10, color: Colors.accent, letterSpacing: 1 },

  // Hero card
  heroCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: 16, borderWidth: 1, borderColor: Colors.border,
    padding: 18, marginBottom: 12, overflow: 'hidden',
  },
  heroBar:         { width: 3, height: '100%', borderRadius: 2, backgroundColor: Colors.accent, position: 'absolute', left: 0, top: 0, bottom: 0 },
  heroGreeting:    { fontFamily: Fonts.condensedBold, fontSize: 10, color: Colors.textMuted, letterSpacing: 1.5 },
  heroName:        { fontFamily: Fonts.condensedBold, fontSize: 26, color: Colors.text, letterSpacing: 0.5, marginTop: 1 },
  heroSessionRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  heroSessionDot:  { width: 6, height: 6, borderRadius: 3 },
  heroSessionText: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted },
  heroRing: {
    alignItems: 'center', justifyContent: 'center',
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: Colors.accent + '14',
    borderWidth: 2, borderColor: Colors.accent + '35',
  },
  heroRingNum:   { fontFamily: Fonts.condensedBold, fontSize: 22, color: Colors.accent },
  heroRingLabel: { fontFamily: Fonts.condensedBold, fontSize: 8, color: Colors.accent, letterSpacing: 0.5, textAlign: 'center', lineHeight: 10 },

  // Stats
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.bgCard,
    borderRadius: 14, borderWidth: 1, borderColor: Colors.border,
    marginBottom: 16,
  },
  statCard:       { flex: 1, alignItems: 'center', paddingVertical: 14, gap: 5 },
  statCardBorder: { borderRightWidth: 1, borderRightColor: Colors.border },
  statIconBox:    { width: 28, height: 28, borderRadius: 8, borderWidth: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
  statVal:        { fontFamily: Fonts.condensedBold, fontSize: 22, color: Colors.text },
  statLabel:      { fontFamily: Fonts.condensedBold, fontSize: 9, color: Colors.textMuted, letterSpacing: 1 },

  // Section header
  sectionHeader:  { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 },
  sectionIconBox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  sectionTitle:   { fontFamily: Fonts.condensedBold, fontSize: 11, color: Colors.textMuted, letterSpacing: 1.5, flex: 1 },
  upcomingPill:   { backgroundColor: Colors.accent + '14', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, borderColor: Colors.accent + '30' },
  upcomingPillText:{ fontFamily: Fonts.condensedBold, fontSize: 9, color: Colors.accent, letterSpacing: 1 },

  // Add Member button
  addMemberBtn:      { marginBottom: 16 },
  addMemberBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 16, paddingVertical: 16 },
  addMemberBtnText:  { fontFamily: Fonts.bold, fontSize: 15, color: '#fff', letterSpacing: 1.5 },

  // Quick actions
  actionsCard:     { backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, marginBottom: 20, overflow: 'hidden' },
  actionRow:       { flexDirection: 'row', alignItems: 'center', gap: 13, paddingHorizontal: 16, paddingVertical: 14, overflow: 'hidden' },
  actionRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  actionAccent:    { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  actionIconWrap:  { width: 44, height: 44, borderRadius: 12, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  actionText:      { flex: 1 },
  actionLabel:     { fontFamily: Fonts.bold, fontSize: 14, color: Colors.text },
  actionSub:       { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  actionCountBadge:{ minWidth: 38, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  actionCount:     { fontFamily: Fonts.condensedBold, fontSize: 15 },

  // Session cards
  sessionCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: 13, borderWidth: 1, borderColor: Colors.border,
    marginBottom: 8, overflow: 'hidden',
  },
  sessionCardDone: { opacity: 0.5 },
  sessionBar:    { width: 3, alignSelf: 'stretch' },
  sessionTime:   { width: 52, alignItems: 'center', paddingVertical: 14, gap: 1 },
  sessionTimeNum:{ fontFamily: Fonts.condensedBold, fontSize: 15, color: Colors.text },
  sessionAmPm:   { fontFamily: Fonts.condensedBold, fontSize: 9, color: Colors.textMuted, letterSpacing: 0.5 },
  sessionDivider:{ width: 1, height: 32, backgroundColor: Colors.border },
  sessionInfo:   { flex: 1, paddingHorizontal: 12, paddingVertical: 14 },
  sessionMember: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.text },
  sessionType:   { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  sessionStatus: { width: 34, height: 34, borderRadius: 10, borderWidth: 1, justifyContent: 'center', alignItems: 'center', marginRight: 12 },

  // Chart
  chartCard:  { backgroundColor: Colors.bgCard, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 16, marginBottom: 8 },
  barChart:   { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 90 },
  barCol:     { flex: 1, alignItems: 'center', gap: 4 },
  barVal:     { fontFamily: Fonts.condensedBold, fontSize: 10, color: Colors.textMuted },
  barTrack:   { width: '100%', height: 60, backgroundColor: Colors.bgElevated, borderRadius: 6, overflow: 'hidden', justifyContent: 'flex-end' },
  barFill:    { width: '100%', borderRadius: 6 },
  barDay:     { fontFamily: Fonts.condensedBold, fontSize: 10, color: Colors.textMuted },
});
