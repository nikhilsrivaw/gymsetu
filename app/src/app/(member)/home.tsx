import { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  Image, Animated, Modal,
} from 'react-native';
import * as Location from 'expo-location';
import { useNavigation, useRouter, useFocusEffect } from 'expo-router';
import LottieView from 'lottie-react-native';
import { DrawerActions } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import FadeInView from '@/components/FadeInView';
import AnimatedPressable from '@/components/AnimatedPressable';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface LbEntry { rank: number; member_id: string; name: string; days: number; isMe: boolean; }
interface ActivePlanData {
  name: string;
  daysLeft: number;
  totalDays: number;
  startDate: string;
  endDate: string;
}
interface Notice { id: string; title: string; body: string; emoji: string; created_at: string; }

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

const MEDAL: Record<number, IconName> = { 1: 'trophy', 2: 'medal', 3: 'medal-outline' };
const MEDAL_COLOR: Record<number, string> = { 1: '#F5C542', 2: '#B0B0B0', 3: '#CD7F32' };

const MOTIVATIONS = [
  'Every rep counts. Show up today.',
  "Your only competition is yesterday's you.",
  'Sweat now. Shine always.',
  'Pain is temporary. Pride is forever.',
  'One more set. One more step.',
];

// ────────────────────────────────────────────────────────────────────────────
// WATER TRACKER COMPONENT
// ────────────────────────────────────────────────────────────────────────────
const WATER_GOAL = 8;
const WATER_COLOR = '#38bdf8';

function WaterDrop({ filled, onPress }: { filled: boolean; onPress: () => void }) {
  const scale = useRef(new Animated.Value(filled ? 1 : 0.85)).current;
  const bg    = useRef(new Animated.Value(filled ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: filled ? 1 : 0.85, tension: 120, friction: 8, useNativeDriver: false }),
      Animated.timing(bg,    { toValue: filled ? 1 : 0,  duration: 200, useNativeDriver: false }),
    ]).start();
  }, [filled]);

  const bgColor = bg.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.bgElevated, WATER_COLOR + '20'],
  });
  const borderColor = bg.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.border, WATER_COLOR + '50'],
  });

  return (
    <AnimatedPressable onPress={onPress} scaleDown={0.8}>
      <Animated.View style={[wt.drop, { transform: [{ scale }], backgroundColor: bgColor, borderColor }]}>
        <MaterialCommunityIcons
          name={filled ? 'water' : 'water-outline'}
          size={22}
          color={filled ? WATER_COLOR : Colors.border}
        />
      </Animated.View>
    </AnimatedPressable>
  );
}

function WaterTracker() {
  const [water, setWater] = useState(3);
  const pct = Math.round((water / WATER_GOAL) * 100);
  const done = water >= WATER_GOAL;
  const barColor = done ? Colors.green : WATER_COLOR;

  const add = () => setWater(v => Math.min(WATER_GOAL, v + 1));
  const sub = () => setWater(v => Math.max(0, v - 1));

  return (
    <View style={wt.card}>
      {/* Header */}
      <View style={wt.header}>
        <View style={[wt.iconBox, { backgroundColor: WATER_COLOR + '14', borderColor: WATER_COLOR + '28' }]}>
          <MaterialCommunityIcons name="water" size={14} color={WATER_COLOR} />
        </View>
        <Text style={wt.title}>WATER INTAKE</Text>
        {done && (
          <View style={wt.doneBadge}>
            <MaterialCommunityIcons name="check-circle" size={11} color={Colors.green} />
            <Text style={wt.doneBadgeText}>GOAL MET</Text>
          </View>
        )}
      </View>

      {/* Big counter + controls */}
      <View style={wt.counterRow}>
        <AnimatedPressable style={wt.controlBtn} scaleDown={0.88} onPress={sub}>
          <LinearGradient
            colors={[Colors.bgElevated, Colors.bgElevated]}
            style={wt.controlBtnInner}
          >
            <MaterialCommunityIcons name="minus" size={20} color={water === 0 ? Colors.border : Colors.text} />
          </LinearGradient>
        </AnimatedPressable>

        {/* Center display */}
        <View style={wt.counterCenter}>
          <View style={[wt.counterRing, { borderColor: barColor + '40' }]}>
            <LinearGradient
              colors={[barColor + '20', barColor + '08']}
              style={StyleSheet.absoluteFill}
            />
            <Text style={[wt.counterNum, { color: barColor }]}>{water}</Text>
            <Text style={[wt.counterDenom, { color: barColor + 'aa' }]}>/ {WATER_GOAL}</Text>
            <Text style={wt.counterLabel}>GLASSES</Text>
          </View>
          <Text style={[wt.counterPct, { color: barColor }]}>{pct}%</Text>
        </View>

        <AnimatedPressable style={wt.controlBtn} scaleDown={0.88} onPress={add}>
          <LinearGradient
            colors={[barColor, barColor + 'cc']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={wt.controlBtnInner}
          >
            <MaterialCommunityIcons name="plus" size={20} color="#fff" />
          </LinearGradient>
        </AnimatedPressable>
      </View>

      {/* Drop grid — tap any drop to set level */}
      <View style={wt.grid}>
        {Array.from({ length: WATER_GOAL }).map((_, i) => (
          <WaterDrop
            key={i}
            filled={i < water}
            onPress={() => {
              // tap filled → remove from that index; tap empty → fill up to that index
              setWater(i < water ? i : i + 1);
            }}
          />
        ))}
      </View>

      {/* Progress bar */}
      <View style={wt.barBg}>
        <LinearGradient
          colors={done ? [Colors.green, Colors.green + 'aa'] : [WATER_COLOR, WATER_COLOR + '70']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={[wt.barFill, { width: `${pct}%` as any }]}
        />
      </View>

      {/* Note */}
      <Text style={wt.note}>
        {done
          ? 'Great job! You hit your daily hydration goal.'
          : `${WATER_GOAL - water} more glass${WATER_GOAL - water !== 1 ? 'es' : ''} to reach your goal`}
      </Text>
    </View>
  );
}

const wt = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard, borderRadius: 18,
    borderWidth: 1, borderColor: Colors.border,
    padding: 16, gap: 14,
  },
  header:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBox:     { width: 26, height: 26, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  title:       { fontFamily: Fonts.bold, fontSize: 11, color: Colors.textMuted, letterSpacing: 1.2, flex: 1 },
  doneBadge:   { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.green + '14', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: Colors.green + '28' },
  doneBadgeText:{ fontFamily: Fonts.bold, fontSize: 8, color: Colors.green, letterSpacing: 0.5 },

  counterRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
  controlBtn:    { borderRadius: 16 },
  controlBtnInner:{ width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },

  counterCenter: { alignItems: 'center', gap: 4 },
  counterRing: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 2, justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden', gap: 0,
  },
  counterNum:   { fontFamily: Fonts.condensedBold, fontSize: 38, lineHeight: 40 },
  counterDenom: { fontFamily: Fonts.bold, fontSize: 11, letterSpacing: 0.5, lineHeight: 14 },
  counterLabel: { fontFamily: Fonts.bold, fontSize: 7, color: Colors.textMuted, letterSpacing: 1.2, marginTop: 2 },
  counterPct:   { fontFamily: Fonts.bold, fontSize: 11, letterSpacing: 0.5 },

  grid: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'space-between' },
  drop: {
    width: 38, height: 38, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5,
  },

  barBg:   { height: 5, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: 5, borderRadius: 3 },
  note:    { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, textAlign: 'center' },
});

// ────────────────────────────────────────────────────────────────────────────

export default function MemberHome() {
  const { session, gymProfile } = useAuthStore();
  const navigation = useNavigation();
  const router     = useRouter();
  const insets     = useSafeAreaInsets();

  // ── Check-in state ───────────────────────────────────────────
  const [checkInState, setCheckInState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [checkInMsg, setCheckInMsg]     = useState('');
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);

  const [membersTableId, setMembersTableId] = useState<string | null>(null);
  const [gymId, setGymId]               = useState<string | null>(null);
  const [memberName, setMemberName]     = useState('');
  const [memberCode, setMemberCode]     = useState('');
  const [activePlan, setActivePlan]     = useState<ActivePlanData | null>(null);
  const [daysThisMonth, setDaysThisMonth] = useState(0);
  const [streak, setStreak]             = useState(0);
  const [leaderboard, setLeaderboard]   = useState<LbEntry[]>([]);
  const [notices, setNotices]           = useState<Notice[]>([]);
  const [loading, setLoading]           = useState(true);
  const [fetchError, setFetchError]     = useState('');

  const today      = new Date().toISOString().split('T')[0];
  const monthStart = today.slice(0, 8) + '01';
  const hour       = new Date().getHours();
  const greeting   = hour < 12 ? 'GOOD MORNING' : hour < 17 ? 'GOOD AFTERNOON' : 'GOOD EVENING';
  const motivation = MOTIVATIONS[new Date().getDay() % MOTIVATIONS.length];

  useFocusEffect(useCallback(() => {
    let active = true;

    async function load() {
      if (!session?.user?.id) { setLoading(false); return; }
      setFetchError('');
      setLoading(true);

      try {
        // ── 1. Fetch profile ─────────────────────────────────────────
        const { data: profile, error: pErr } = await supabase
          .from('profiles')
          .select('id, full_name, gym_id, member_code')
          .eq('id', session.user.id)
          .single();

        if (pErr) throw pErr;
        if (!profile || !active) { setLoading(false); return; }

        setMemberName(profile.full_name);
        setMemberCode(profile.member_code ?? '');
        setGymId(profile.gym_id);

        // ── 2. Bridge profile → members.id ───────────────────────────
        // member_plans and attendance use members.id (not auth user id)
        const { data: memberRow } = await supabase
          .from('members')
          .select('id')
          .eq('user_id', profile.id)
          .eq('gym_id', profile.gym_id)
          .maybeSingle();

        const resolvedMembersId = memberRow?.id ?? null;
        setMembersTableId(resolvedMembersId);

        // Check if already checked in today (attendance uses profiles.id)
        const { count: todayCount } = await supabase
          .from('attendance')
          .select('id', { count: 'exact', head: true })
          .eq('member_id', profile.id)
          .eq('check_in_date', today);
        if (active) setCheckedInToday((todayCount ?? 0) > 0);

        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

        // ── 3. Parallel fetches using correct IDs ────────────────────
        const [planRes, attMonthRes, attStreakRes, lbRes, noticesRes] = await Promise.all([
          // Plan: use resolvedMembersId (local const, not stale state)
          resolvedMembersId
            ? supabase
                .from('member_plans')
                .select('start_date, end_date, membership_plans(name, duration_days)')
                .eq('member_id', resolvedMembersId)
                .eq('status', 'active')
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle()
            : Promise.resolve({ data: null }),

          // Visits this month (attendance.member_id = profiles.id)
          supabase
            .from('attendance')
            .select('id', { count: 'exact', head: true })
            .eq('member_id', profile.id)
            .gte('check_in_date', monthStart),

          // Streak (attendance.member_id = profiles.id)
          supabase
            .from('attendance')
            .select('check_in_date')
            .eq('member_id', profile.id)
            .gte('check_in_date', sixtyDaysAgo.toISOString().split('T')[0])
            .order('check_in_date', { ascending: false }),

          // Leaderboard: gym-wide monthly attendance
          supabase
            .from('attendance')
            .select('member_id, profiles(full_name)')
            .eq('gym_id', profile.gym_id)
            .gte('check_in_date', monthStart),

          // Announcements
          supabase
            .from('announcements')
            .select('id, title, body, emoji, created_at')
            .eq('gym_id', profile.gym_id)
            .order('created_at', { ascending: false })
            .limit(3),
        ]);

        if (!active) return;

        // ── Parse plan ───────────────────────────────────────────────
        if (planRes.data) {
          const pd = planRes.data as any;
          const end      = new Date(pd.end_date);
          const start    = pd.start_date ? new Date(pd.start_date) : null;
          const daysLeft = Math.max(0, Math.ceil((end.getTime() - Date.now()) / 86_400_000));
          const planInfo = pd.membership_plans;
          const totalDays = planInfo?.duration_days ??
            (start ? Math.ceil((end.getTime() - start.getTime()) / 86_400_000) : 30);

          setActivePlan({
            name:      planInfo?.name ?? 'Active Plan',
            daysLeft,
            totalDays,
            startDate: pd.start_date ?? '',
            endDate:   pd.end_date,
          });
        } else {
          setActivePlan(null);
        }

        // ── Parse visits ─────────────────────────────────────────────
        setDaysThisMonth(attMonthRes.count ?? 0);

        // ── Parse streak ─────────────────────────────────────────────
        const dateSet = new Set((attStreakRes.data ?? []).map((a: any) => a.check_in_date));
        let s = 0;
        const d = new Date();
        while (dateSet.has(d.toISOString().split('T')[0])) { s++; d.setDate(d.getDate() - 1); }
        setStreak(s);

        // ── Parse leaderboard ────────────────────────────────────────
        const lbMap = new Map<string, { name: string; days: number }>();
        for (const row of (lbRes.data ?? [])) {
          const key = (row as any).member_id;
          if (!lbMap.has(key)) lbMap.set(key, { name: (row as any).profiles?.full_name ?? '?', days: 0 });
          lbMap.get(key)!.days++;
        }
        const myLbId = profile.id; // attendance.member_id = profiles.id
        const lb: LbEntry[] = Array.from(lbMap.entries())
          .map(([id, v]) => ({ member_id: id, name: v.name, days: v.days, rank: 0, isMe: id === myLbId }))
          .sort((a, b) => b.days - a.days)
          .slice(0, 5)
          .map((e, i) => ({ ...e, rank: i + 1 }));
        setLeaderboard(lb);

        setNotices(noticesRes.data ?? []);
      } catch (e: any) {
        if (active) setFetchError(e.message ?? 'Failed to load dashboard');
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => { active = false; };
  }, [session?.user?.id, monthStart]));

  // ── GPS Check-in ─────────────────────────────────────────────
  const handleCheckIn = async () => {
    if (checkedInToday) {
      setCheckInMsg('Already checked in today!');
      setCheckInState('done');
      setShowCheckInModal(true);
      return;
    }
    if (!membersTableId || !gymId) {
      setCheckInMsg('Could not verify your membership. Please try again.');
      setCheckInState('error');
      setShowCheckInModal(true);
      return;
    }

    setCheckInState('loading');
    setShowCheckInModal(true);
    setCheckInMsg('Getting your location...');

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setCheckInMsg('Location permission denied. Please enable it in settings.');
        setCheckInState('error');
        return;
      }

      setCheckInMsg('Verifying you\'re at the gym...');
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = pos.coords;

      // Fetch gym location from gyms table
      const { data: gymData } = await supabase
        .from('gyms')
        .select('lat, lng, name')
        .eq('id', gymId)
        .single();

      if (!gymData?.lat || !gymData?.lng) {
        setCheckInMsg('Gym location not set up yet. Ask your gym owner to set it.');
        setCheckInState('error');
        return;
      }

      const dist = haversineDistance(latitude, longitude, gymData.lat, gymData.lng);

      if (dist > 100) {
        setCheckInMsg(`You're ${Math.round(dist)}m away from the gym.\nYou need to be within 100m to check in.`);
        setCheckInState('error');
        return;
      }

      // Insert attendance
      const todayStr = new Date().toISOString().split('T')[0];
      const now = new Date();
      const timeStr = now.toTimeString().slice(0, 8); // "HH:MM:SS"
      // attendance.member_id FK references profiles.id (auth user id), not members.id
      const { error: insertErr } = await supabase.from('attendance').insert({
        member_id:      session!.user.id,
        gym_id:         gymId,
        check_in_date:  todayStr,
        check_in_time:  timeStr,
        method:         'gps',
      });

      if (insertErr) throw insertErr;

      setCheckedInToday(true);
      setDaysThisMonth(v => v + 1);
      setCheckInMsg(`You're in! Welcome to ${gymData.name}. 💪`);
      setCheckInState('done');
    } catch (e: any) {
      setCheckInMsg(e.message ?? 'Check-in failed. Please try again.');
      setCheckInState('error');
    }
  };

  const daysUsed    = activePlan ? activePlan.totalDays - activePlan.daysLeft : 0;
  const usedPercent = activePlan
    ? Math.min(100, Math.round((daysUsed / activePlan.totalDays) * 100))
    : 0;

  const planColor = activePlan
    ? activePlan.daysLeft <= 3  ? Colors.red
      : activePlan.daysLeft <= 7 ? Colors.orange
        : Colors.green
    : Colors.textMuted;

  const urgency = activePlan
    ? activePlan.daysLeft <= 3  ? 'critical'
      : activePlan.daysLeft <= 7 ? 'warning'
        : 'ok'
    : 'none';

  // ── Loading ──────────────────────────────────────────────────────
  if (loading) return (
    <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
      <LottieView
        source={require('@/assets/animations/Turkey Power Walk.json')}
        autoPlay loop
        style={{ width: 180, height: 180 }}
      />
      <Text style={styles.loadingText}>LOADING YOUR DASHBOARD</Text>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Fetch Error ─────────────────────────────────────────── */}
      {!!fetchError && (
        <View style={styles.errorBanner}>
          <MaterialCommunityIcons name="alert-circle-outline" size={15} color={Colors.red} />
          <Text style={styles.errorText}>{fetchError}</Text>
        </View>
      )}

      {/* ════════════════════════════════════════════════════════════
          HERO CARD
      ════════════════════════════════════════════════════════════ */}
      <FadeInView delay={0}>
        <View style={styles.heroCard}>
          {/* Gradient wash behind content */}
          <LinearGradient
            colors={[Colors.accent + '18', 'transparent']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          {/* Glow orb */}
          <View style={styles.heroOrb} />

          {/* ── Top bar: menu | gym brand | streak ── */}
          <View style={styles.heroTopBar}>
            <AnimatedPressable
              style={styles.menuBtn}
              scaleDown={0.88}
              onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            >
              <MaterialCommunityIcons name="menu" size={20} color={Colors.text} />
            </AnimatedPressable>

            {/* Gym brand */}
            {gymProfile ? (
              <View style={styles.gymBrand}>
                {gymProfile.logo_url ? (
                  <Image source={{ uri: gymProfile.logo_url }} style={styles.gymLogo} resizeMode="contain" />
                ) : (
                  <View style={styles.gymLogoPlaceholder}>
                    <Text style={styles.gymLogoInitial}>{gymProfile.name[0].toUpperCase()}</Text>
                  </View>
                )}
                <View>
                  <Text style={styles.gymBrandLabel}>YOUR GYM</Text>
                  <Text style={styles.gymName} numberOfLines={1}>{gymProfile.name.toUpperCase()}</Text>
                </View>
              </View>
            ) : (
              <View style={{ flex: 1 }} />
            )}

            {/* Streak badge */}
            <View style={styles.streakBadge}>
              <View style={styles.streakIconBox}>
                <MaterialCommunityIcons name="fire" size={16} color={Colors.orange} />
              </View>
              <View>
                <Text style={styles.streakNum}>{streak}</Text>
                <Text style={styles.streakLabel}>STREAK</Text>
              </View>
            </View>
          </View>

          {/* ── Divider ── */}
          <View style={styles.heroDivider} />

          {/* ── Greeting block ── */}
          <View style={styles.heroGreet}>
            <View style={styles.greetingTag}>
              <MaterialCommunityIcons name="white-balance-sunny" size={11} color={Colors.accent} />
              <Text style={styles.greetSub}>{greeting}</Text>
            </View>
            <Text style={styles.greetName}>{memberName || 'Athlete'}</Text>
            {!!memberCode && (
              <View style={styles.memberCodePill}>
                <MaterialCommunityIcons name="identifier" size={11} color={Colors.textMuted} />
                <Text style={styles.memberCodeText}>{memberCode}</Text>
              </View>
            )}
            <Text style={styles.motivation}>"{motivation}"</Text>
          </View>

          {/* ── Quick stat strip ── */}
          <View style={styles.heroStats}>
            {[
              { icon: 'calendar-check-outline' as IconName, val: daysThisMonth, label: 'THIS MONTH',  color: Colors.accent },
              { icon: 'fire'                   as IconName, val: streak,         label: 'DAY STREAK', color: Colors.orange },
              { icon: 'water'                  as IconName, val: `${WATER_GOAL} goal`,   label: 'HYDRATION', color: '#38bdf8' },
            ].map((stat, i, arr) => (
              <View key={stat.label} style={[styles.heroStatCell, i < arr.length - 1 && styles.heroStatDivider]}>
                <View style={[styles.heroStatIcon, { backgroundColor: stat.color + '14' }]}>
                  <MaterialCommunityIcons name={stat.icon} size={13} color={stat.color} />
                </View>
                <Text style={[styles.heroStatVal, { color: stat.color }]}>{stat.val}</Text>
                <Text style={styles.heroStatLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </FadeInView>

      {/* ════════════════════════════════════════════════════════════
          MEMBERSHIP CARD
      ════════════════════════════════════════════════════════════ */}
      <FadeInView delay={80}>
        <View style={[styles.memberCard, { borderColor: planColor + '35' }]}>
          {/* Tint wash */}
          <LinearGradient
            colors={[planColor + '10', 'transparent']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          {/* Top accent bar */}
          <View style={[styles.memberCardTopBar, { backgroundColor: planColor }]} />

          <View style={styles.memberCardBody}>
            {/* Left: plan info */}
            <View style={{ flex: 1 }}>
              <View style={styles.memberCardLabelRow}>
                <View style={[styles.memberCardIconBox, { backgroundColor: planColor + '18', borderColor: planColor + '30' }]}>
                  <MaterialCommunityIcons name="card-account-details-outline" size={13} color={planColor} />
                </View>
                <Text style={styles.cardMicro}>MEMBERSHIP PLAN</Text>
              </View>
              <Text style={styles.memberCardPlan} numberOfLines={1}>
                {activePlan ? activePlan.name.toUpperCase() : 'NO ACTIVE PLAN'}
              </Text>

              {activePlan && (
                <View style={styles.planDatesRow}>
                  <MaterialCommunityIcons name="calendar-start" size={11} color={Colors.textMuted} />
                  <Text style={styles.planDateText}>
                    {activePlan.startDate ? fmtDate(activePlan.startDate) : '—'}
                    {'  →  '}
                    {fmtDate(activePlan.endDate)}
                  </Text>
                </View>
              )}
            </View>

            {/* Right: days left badge */}
            <View style={[styles.expiryBadge, { backgroundColor: planColor + '14', borderColor: planColor + '35' }]}>
              <Text style={[styles.expiryNum, { color: planColor }]}>
                {activePlan?.daysLeft ?? 0}
              </Text>
              <Text style={[styles.expiryUnit, { color: planColor }]}>DAYS{'\n'}LEFT</Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.progressSection}>
            <View style={styles.planTrackBg}>
              <LinearGradient
                colors={[planColor, planColor + 'aa']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={[styles.planTrackFill, { width: `${usedPercent}%` as any }]}
              />
            </View>
            <View style={styles.progressLabels}>
              <Text style={styles.planProgressText}>{usedPercent}% used</Text>
              <Text style={styles.planProgressText}>{activePlan?.daysLeft ?? 0} days left</Text>
            </View>
          </View>

          {/* Urgency strip */}
          {urgency === 'critical' && (
            <View style={[styles.urgencyStrip, { backgroundColor: Colors.red + '14', borderColor: Colors.red + '35' }]}>
              <MaterialCommunityIcons name="alert-circle" size={13} color={Colors.red} />
              <Text style={[styles.urgencyText, { color: Colors.red }]}>
                Plan expires in {activePlan!.daysLeft} day{activePlan!.daysLeft !== 1 ? 's' : ''}! Renew now.
              </Text>
            </View>
          )}
          {urgency === 'warning' && (
            <View style={[styles.urgencyStrip, { backgroundColor: Colors.orange + '12', borderColor: Colors.orange + '30' }]}>
              <MaterialCommunityIcons name="clock-alert-outline" size={13} color={Colors.orange} />
              <Text style={[styles.urgencyText, { color: Colors.orange }]}>
                Expiring soon — {activePlan!.daysLeft} days left.
              </Text>
            </View>
          )}
        </View>
      </FadeInView>

      {/* ── Quick Actions ─────────────────────────────────────────── */}
      <FadeInView delay={140}>
        <View style={styles.quickRow}>
          {/* CHECK IN — GPS wired */}
          <AnimatedPressable
            style={[styles.qrCard, checkedInToday && styles.qrCardDone]}
            scaleDown={0.95}
            onPress={handleCheckIn}
          >
            <View style={[styles.qrIconWrap, {
              backgroundColor: checkedInToday ? Colors.green + '20' : Colors.accent + '15',
              borderColor:     checkedInToday ? Colors.green + '40' : Colors.accent + '25',
            }]}>
              <MaterialCommunityIcons
                name={checkedInToday ? 'check-circle' : 'map-marker-check-outline'}
                size={22}
                color={checkedInToday ? Colors.green : Colors.accent}
              />
            </View>
            <Text style={styles.qrTitle}>{checkedInToday ? 'CHECKED IN' : 'CHECK IN'}</Text>
            <Text style={styles.qrSub}>{checkedInToday ? 'Done for today' : 'GPS verified'}</Text>
          </AnimatedPressable>

          <AnimatedPressable style={styles.qrCard} scaleDown={0.95}>
            <View style={[styles.qrIconWrap, { backgroundColor: Colors.green + '15', borderColor: Colors.green + '25' }]}>
              <MaterialCommunityIcons name="dumbbell" size={22} color={Colors.green} />
            </View>
            <Text style={styles.qrTitle}>WORKOUT</Text>
            <Text style={styles.qrSub}>Today's session</Text>
          </AnimatedPressable>

          <AnimatedPressable style={styles.qrCard} scaleDown={0.95}>
            <View style={[styles.qrIconWrap, { backgroundColor: Colors.orange + '15', borderColor: Colors.orange + '25' }]}>
              <MaterialCommunityIcons name="food-apple-outline" size={22} color={Colors.orange} />
            </View>
            <Text style={styles.qrTitle}>DIET</Text>
            <Text style={styles.qrSub}>Meal plan</Text>
          </AnimatedPressable>
        </View>
      </FadeInView>

      {/* ── Check-in Modal ────────────────────────────────────────── */}
      <Modal visible={showCheckInModal} transparent animationType="fade" onRequestClose={() => setShowCheckInModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.checkInModal}>
            {/* Top bar color */}
            <View style={[styles.modalTopBar, {
              backgroundColor: checkInState === 'done' ? Colors.green
                : checkInState === 'error' ? Colors.red
                : Colors.accent,
            }]} />

            {/* Icon */}
            <View style={[styles.modalIconRing, {
              backgroundColor: checkInState === 'done' ? Colors.green + '14'
                : checkInState === 'error' ? Colors.red + '14'
                : Colors.accent + '14',
              borderColor: checkInState === 'done' ? Colors.green + '35'
                : checkInState === 'error' ? Colors.red + '35'
                : Colors.accent + '35',
            }]}>
              {checkInState === 'loading' ? (
                <LottieView
                  source={require('@/assets/animations/Turkey Power Walk.json')}
                  autoPlay loop
                  style={{ width: 48, height: 48 }}
                />
              ) : (
                <MaterialCommunityIcons
                  name={checkInState === 'done' ? 'check-circle-outline' : checkInState === 'error' ? 'alert-circle-outline' : 'map-marker-check-outline'}
                  size={36}
                  color={checkInState === 'done' ? Colors.green : checkInState === 'error' ? Colors.red : Colors.accent}
                />
              )}
            </View>

            <Text style={styles.modalTitle}>
              {checkInState === 'loading' ? 'CHECKING IN...'
                : checkInState === 'done' ? 'CHECK-IN COMPLETE'
                : 'CHECK-IN FAILED'}
            </Text>
            <Text style={styles.modalMsg}>{checkInMsg}</Text>

            {checkInState !== 'loading' && (
              <AnimatedPressable
                style={[styles.modalBtn, {
                  backgroundColor: checkInState === 'done' ? Colors.green : Colors.red,
                }]}
                scaleDown={0.95}
                onPress={() => { setShowCheckInModal(false); setCheckInState('idle'); }}
              >
                <Text style={styles.modalBtnText}>
                  {checkInState === 'done' ? 'AWESOME!' : 'CLOSE'}
                </Text>
              </AnimatedPressable>
            )}
          </View>
        </View>
      </Modal>

      {/* ── Water Tracker ─────────────────────────────────────────── */}
      <FadeInView delay={200}>
        <WaterTracker />
      </FadeInView>

      {/* ── AI Coach ──────────────────────────────────────────────── */}
      <FadeInView delay={260}>
        <AnimatedPressable style={styles.aiCoachCard} scaleDown={0.97} onPress={() => router.push('/(member)/ai-coach')}>
          <LinearGradient
            colors={[Colors.accent + '14', 'transparent']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <LottieView
            source={require('@/assets/animations/aichatbot.json')}
            autoPlay loop
            style={styles.aiCoachLottie}
          />
          <View style={styles.aiCoachText}>
            <View style={styles.aiLiveRow}>
              <View style={styles.aiLiveDot} />
              <Text style={styles.aiCoachMicro}>AI-POWERED COACHING</Text>
            </View>
            <Text style={styles.aiCoachTitle}>YOUR FITNESS COACH</Text>
            <Text style={styles.aiCoachSub}>Personalised workout & diet plans</Text>
          </View>
          <View style={styles.aiCoachArrow}>
            <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.accent} />
          </View>
        </AnimatedPressable>
      </FadeInView>

      {/* ── Announcements ─────────────────────────────────────────── */}
      {notices.length > 0 && (
        <FadeInView delay={280}>
          <View style={styles.sectionHeader}>
            <View style={[styles.cardIconBox, { backgroundColor: Colors.accent + '14', borderColor: Colors.accent + '25' }]}>
              <MaterialCommunityIcons name="bullhorn-outline" size={13} color={Colors.accent} />
            </View>
            <Text style={styles.sectionTitle}>LATEST NOTICES</Text>
          </View>
          {notices.map((a, i) => (
            <FadeInView key={a.id} delay={280 + i * 50}>
              <View style={styles.noticeCard}>
                <View style={[styles.noticeBar, { backgroundColor: Colors.accent }]} />
                <View style={{ flex: 1, paddingLeft: 12 }}>
                  <View style={styles.noticeTop}>
                    <Text style={styles.noticeTitle}>{a.emoji} {a.title}</Text>
                    <Text style={styles.noticeTime}>{timeAgo(a.created_at)}</Text>
                  </View>
                  <Text style={styles.noticeBody} numberOfLines={2}>{a.body}</Text>
                </View>
              </View>
            </FadeInView>
          ))}
        </FadeInView>
      )}

      {/* ── Leaderboard ───────────────────────────────────────────── */}
      {leaderboard.length > 0 && (
        <FadeInView delay={340}>
          <View style={styles.sectionHeader}>
            <View style={[styles.cardIconBox, { backgroundColor: '#F5C54214', borderColor: '#F5C54225' }]}>
              <MaterialCommunityIcons name="trophy-outline" size={13} color="#F5C542" />
            </View>
            <Text style={styles.sectionTitle}>MONTHLY LEADERBOARD</Text>
          </View>
          <View style={styles.card}>
            {leaderboard.map((l, i) => (
              <View
                key={l.member_id}
                style={[
                  styles.lbRow,
                  l.isMe && styles.lbRowMe,
                  i < leaderboard.length - 1 && styles.lbRowBorder,
                ]}
              >
                {MEDAL[l.rank] ? (
                  <View style={[styles.lbMedalBox, { backgroundColor: MEDAL_COLOR[l.rank] + '15' }]}>
                    <MaterialCommunityIcons name={MEDAL[l.rank]} size={16} color={MEDAL_COLOR[l.rank]} />
                  </View>
                ) : (
                  <View style={styles.lbRankBox}>
                    <Text style={styles.lbRank}>{String(l.rank).padStart(2, '0')}</Text>
                  </View>
                )}
                <Text style={[styles.lbName, l.isMe && { color: Colors.accent }]} numberOfLines={1}>
                  {l.name}
                </Text>
                {l.isMe && (
                  <View style={styles.youChip}>
                    <Text style={styles.youChipText}>YOU</Text>
                  </View>
                )}
                <View style={styles.lbDaysChip}>
                  <MaterialCommunityIcons name="calendar-check" size={11} color={Colors.textMuted} />
                  <Text style={styles.lbDaysText}>{l.days}d</Text>
                </View>
              </View>
            ))}
          </View>
        </FadeInView>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.bg },
  content:     { paddingHorizontal: 16, gap: 12 },
  loadingText: { fontFamily: Fonts.condensedBold, fontSize: 13, color: Colors.textMuted, letterSpacing: 2, marginTop: 8 },

  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.red + '15', borderRadius: 10,
    borderWidth: 1, borderColor: Colors.red + '30',
    paddingHorizontal: 12, paddingVertical: 10,
  },
  errorText: { flex: 1, fontFamily: Fonts.regular, fontSize: 12, color: Colors.red },

  // ════════ HERO ════════════════════════════════════════════════════
  heroCard: {
    backgroundColor: Colors.bgCard, borderRadius: 22,
    borderWidth: 1, borderColor: Colors.accent + '20',
    overflow: 'hidden', padding: 18, gap: 14,
  },
  heroOrb: {
    position: 'absolute', top: -40, right: -20,
    width: 130, height: 130, borderRadius: 65,
    backgroundColor: Colors.accentGlow,
  },

  heroTopBar:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  menuBtn: {
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: Colors.bgElevated,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  gymBrand:          { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  gymLogo:           { width: 30, height: 30, borderRadius: 8, borderWidth: 1, borderColor: Colors.border },
  gymLogoPlaceholder:{
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: Colors.accent + '18',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.accent + '30',
  },
  gymLogoInitial: { fontFamily: Fonts.condensedBold, fontSize: 14, color: Colors.accent },
  gymBrandLabel:  { fontFamily: Fonts.bold, fontSize: 7, color: Colors.textMuted, letterSpacing: 1.2 },
  gymName:        { fontFamily: Fonts.condensedBold, fontSize: 13, color: Colors.text, letterSpacing: 1.5, maxWidth: 160 },

  streakBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.orange + '12',
    borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8,
    borderWidth: 1, borderColor: Colors.orange + '28',
  },
  streakIconBox: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: Colors.orange + '18',
    borderWidth: 1, borderColor: Colors.orange + '30',
    justifyContent: 'center', alignItems: 'center',
  },
  streakNum:   { fontFamily: Fonts.condensedBold, fontSize: 20, color: Colors.orange, lineHeight: 22 },
  streakLabel: { fontFamily: Fonts.bold, fontSize: 7, color: Colors.orange, letterSpacing: 0.8 },

  heroDivider: { height: 1, backgroundColor: Colors.border },

  heroGreet:     { gap: 4 },
  greetingTag: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: Colors.accent + '12',
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.accent + '25',
    marginBottom: 4,
  },
  greetSub:     { fontFamily: Fonts.bold, fontSize: 9, color: Colors.accent, letterSpacing: 1.2 },
  greetName:    { fontFamily: Fonts.condensedBold, fontSize: 32, color: Colors.text, letterSpacing: 0.5 },
  memberCodePill:{
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: Colors.bgElevated,
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.border,
    marginTop: 2,
  },
  memberCodeText:{ fontFamily: Fonts.bold, fontSize: 10, color: Colors.textMuted, letterSpacing: 0.5 },
  motivation:   { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, fontStyle: 'italic', marginTop: 4 },

  heroStats:    { flexDirection: 'row', backgroundColor: Colors.bgElevated, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  heroStatCell: { flex: 1, alignItems: 'center', paddingVertical: 12, gap: 4 },
  heroStatDivider:{ borderRightWidth: 1, borderRightColor: Colors.border },
  heroStatIcon: { width: 26, height: 26, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
  heroStatVal:  { fontFamily: Fonts.condensedBold, fontSize: 19 },
  heroStatLabel:{ fontFamily: Fonts.bold, fontSize: 7, color: Colors.textMuted, letterSpacing: 1 },

  // ════════ MEMBERSHIP CARD ════════════════════════════════════════
  memberCard: {
    backgroundColor: Colors.bgCard, borderRadius: 20,
    borderWidth: 1, overflow: 'hidden',
  },
  memberCardTopBar: { height: 3, alignSelf: 'stretch' },
  memberCardBody:   { flexDirection: 'row', alignItems: 'flex-start', padding: 16, gap: 12 },
  memberCardLabelRow:{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 6 },
  memberCardIconBox: {
    width: 26, height: 26, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1,
  },
  cardMicro:     { fontFamily: Fonts.bold, fontSize: 8, color: Colors.textMuted, letterSpacing: 1.3 },
  memberCardPlan:{ fontFamily: Fonts.condensedBold, fontSize: 22, color: Colors.text, letterSpacing: 0.3 },
  planDatesRow:  { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  planDateText:  { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted },

  expiryBadge: {
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10,
    alignItems: 'center', borderWidth: 1, minWidth: 64,
  },
  expiryNum:  { fontFamily: Fonts.condensedBold, fontSize: 28, lineHeight: 30 },
  expiryUnit: { fontFamily: Fonts.bold, fontSize: 7, letterSpacing: 0.8, textAlign: 'center', marginTop: 2 },

  progressSection:{ paddingHorizontal: 16, paddingBottom: 14, gap: 6 },
  planTrackBg:    { height: 5, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden' },
  planTrackFill:  { height: 5, borderRadius: 3 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  planProgressText:{ fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted },

  urgencyStrip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginBottom: 14,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9,
    borderWidth: 1,
  },
  urgencyText: { fontFamily: Fonts.bold, fontSize: 11, flex: 1 },

  // ── Quick actions
  quickRow: { flexDirection: 'row', gap: 8 },
  qrCard: {
    flex: 1, alignItems: 'center', gap: 7,
    backgroundColor: Colors.bgCard, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: Colors.border,
  },
  qrCardDone: { borderColor: Colors.green + '40', backgroundColor: Colors.green + '08' },
  qrIconWrap: {
    width: 46, height: 46, borderRadius: 13,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1,
  },
  qrTitle: { fontFamily: Fonts.bold, fontSize: 10, color: Colors.text, letterSpacing: 0.8 },
  qrSub:   { fontFamily: Fonts.regular, fontSize: 9, color: Colors.textMuted, textAlign: 'center' },

  // ── Check-in modal
  modalOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  checkInModal:   { width: '100%', backgroundColor: Colors.bgCard, borderRadius: 24, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', alignItems: 'center', paddingHorizontal: 24, paddingBottom: 28 },
  modalTopBar:    { alignSelf: 'stretch', height: 3, marginBottom: 28 },
  modalIconRing:  { width: 84, height: 84, borderRadius: 42, justifyContent: 'center', alignItems: 'center', borderWidth: 1, marginBottom: 18 },
  modalTitle:     { fontFamily: Fonts.condensedBold, fontSize: 16, color: Colors.text, letterSpacing: 2, marginBottom: 10, textAlign: 'center' },
  modalMsg:       { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  modalBtn:       { alignSelf: 'stretch', borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  modalBtnText:   { fontFamily: Fonts.bold, fontSize: 13, color: '#fff', letterSpacing: 1.5 },

  // ── Generic card
  card: {
    backgroundColor: Colors.bgCard, borderRadius: 16,
    padding: 16, gap: 12, borderWidth: 1, borderColor: Colors.border,
  },
  cardHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardIconBox:  {
    width: 26, height: 26, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1,
  },
  cardTitle: { fontFamily: Fonts.bold, fontSize: 11, color: Colors.textMuted, letterSpacing: 1.2 },

  // ── Water (handled in WaterTracker component styles)

  // ── AI Coach
  aiCoachCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgCard, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.accent + '30',
    overflow: 'hidden', paddingRight: 16, gap: 4,
  },
  aiCoachLottie: { width: 90, height: 90 },
  aiCoachText:   { flex: 1, gap: 3 },
  aiLiveRow:     { flexDirection: 'row', alignItems: 'center', gap: 5 },
  aiLiveDot:     { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.green },
  aiCoachMicro:  { fontFamily: Fonts.bold, fontSize: 8, color: Colors.accent, letterSpacing: 1.2 },
  aiCoachTitle:  { fontFamily: Fonts.condensedBold, fontSize: 18, color: Colors.text, letterSpacing: 0.5 },
  aiCoachSub:    { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted },
  aiCoachArrow:  {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: Colors.accentMuted,
    justifyContent: 'center', alignItems: 'center',
  },

  // ── Section header
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  sectionTitle:  { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted, letterSpacing: 1.5 },

  // ── Notices
  noticeCard: {
    flexDirection: 'row', backgroundColor: Colors.bgCard, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
    padding: 14, marginBottom: 6,
  },
  noticeBar:   { width: 3, borderRadius: 2, marginRight: -12 },
  noticeTop:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  noticeTitle: { flex: 1, fontFamily: Fonts.bold, fontSize: 13, color: Colors.text },
  noticeBody:  { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, lineHeight: 18 },
  noticeTime:  { fontFamily: Fonts.medium, fontSize: 10, color: Colors.textMuted, marginLeft: 8 },

  // ── Leaderboard
  lbRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  lbRowMe:     { backgroundColor: Colors.accentMuted, borderRadius: 10, paddingHorizontal: 10, marginHorizontal: -10 },
  lbRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  lbMedalBox:  { width: 30, height: 30, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  lbRankBox:   { width: 30, height: 30, borderRadius: 9, backgroundColor: Colors.bgElevated, justifyContent: 'center', alignItems: 'center' },
  lbRank:      { fontFamily: Fonts.condensedBold, fontSize: 14, color: Colors.textMuted },
  lbName:      { flex: 1, fontFamily: Fonts.bold, fontSize: 13, color: Colors.text },
  youChip:     { backgroundColor: Colors.accentMuted, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1, borderColor: Colors.accent + '40' },
  youChipText: { fontFamily: Fonts.bold, fontSize: 8, color: Colors.accent, letterSpacing: 0.5 },
  lbDaysChip:  { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.bgElevated, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  lbDaysText:  { fontFamily: Fonts.bold, fontSize: 11, color: Colors.textMuted },
});
