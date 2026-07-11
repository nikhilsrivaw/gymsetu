import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from '@/components/AppLottie';

import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import AnimatedPressable from '@/components/AnimatedPressable';
import FadeInView from '@/components/FadeInView';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface MenuItem {
  label: string;
  desc: string;
  icon: IconName;
  color: string;
  route: string;
}

const menuItems: MenuItem[] = [
  {
    label: 'My Payments',
    desc: 'Payment history & receipts',
    icon: 'credit-card-outline',
    color: Colors.accent,
    route: '/(member)/my-payments',
  },
  {
    label: 'My Plan',
    desc: 'Current plan & all available plans',
    icon: 'clipboard-list-outline',
    color: Colors.green,
    route: '/(member)/my-plan',
  },
  {
    label: 'Gym Info',
    desc: 'Timings, contact & amenities',
    icon: 'domain',
    color: Colors.orange,
    route: '/(member)/gym-info',
  },
  {
    label: 'Give Feedback',
    desc: 'Rate your gym experience',
    icon: 'star-outline',
    color: '#F59E0B',
    route: '/(member)/feedback',
  },
  {
    label: 'BMI Calculator',
    desc: 'Check your body mass index',
    icon: 'scale-bathroom',
    color: '#3B82F6',
    route: '/(member)/bmi-calculator',
  },
];

export default function MoreScreen() {
  const router = useRouter();
  const { session, signOut } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState('');
  const [memberCode, setMemberCode] = useState('');
  const [planName, setPlanName] = useState<string | null>(null);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [visitsThisMonth, setVisitsThisMonth] = useState(0);
  const [streak, setStreak] = useState(0);

  const fetchData = useCallback(async () => {
    if (!session?.user?.id) return;
    setLoading(true);

    try {
      // 1. Profile
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('id, full_name, gym_id, member_code')
        .eq('id', session.user.id)
        .single();

      if (profileErr || !profile) {
        console.error('[More] profile fetch error:', profileErr?.message);
        setLoading(false);
        return;
      }

      setFullName(profile.full_name ?? '');
      setMemberCode(profile.member_code ?? '');

      // 2. Members table bridge (member_plans references members.id, not profiles.id)
      const { data: memberRow } = await supabase
        .from('members')
        .select('id')
        .eq('user_id', profile.id)
        .eq('gym_id', profile.gym_id)
        .maybeSingle();

      const membersTableId = memberRow?.id ?? null;

      // 3. Active plan
      if (membersTableId) {
        const { data: activePlan } = await supabase
          .from('member_plans')
          .select('end_date, membership_plans(name)')
          .eq('member_id', membersTableId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (activePlan) {
          const mpData = activePlan.membership_plans as any;
          setPlanName(mpData?.name ?? null);

          if (activePlan.end_date) {
            const endDate = new Date(activePlan.end_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            endDate.setHours(0, 0, 0, 0);
            const diff = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            setDaysLeft(Math.max(0, diff));
          } else {
            setDaysLeft(null);
          }
        } else {
          setPlanName(null);
          setDaysLeft(null);
        }
      } else {
        setPlanName(null);
        setDaysLeft(null);
      }

      // 4. Visits this month (attendance.member_id = profiles.id / auth user id)
      const now = new Date();
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

      const { count: visitCount } = await supabase
        .from('attendance')
        .select('id', { count: 'exact', head: true })
        .eq('member_id', profile.id)
        .gte('check_in_date', monthStart);

      setVisitsThisMonth(visitCount ?? 0);

      // 5. Streak: fetch attendance dates, count consecutive days backwards from today
      const { data: attendanceDates } = await supabase
        .from('attendance')
        .select('check_in_date')
        .eq('member_id', profile.id)
        .order('check_in_date', { ascending: false })
        .limit(90);

      if (attendanceDates && attendanceDates.length > 0) {
        const dateSet = new Set(
          attendanceDates.map((r: any) => r.check_in_date?.split('T')[0])
        );

        let consecutiveDays = 0;
        const cursor = new Date();
        cursor.setHours(0, 0, 0, 0);

        // Check today first, then go backwards
        for (let i = 0; i < 90; i++) {
          const key = cursor.toISOString().split('T')[0];
          if (dateSet.has(key)) {
            consecutiveDays++;
          } else {
            // If today is missing, still check yesterday (they might not have checked in yet today)
            if (i === 0) {
              cursor.setDate(cursor.getDate() - 1);
              continue;
            }
            break;
          }
          cursor.setDate(cursor.getDate() - 1);
        }
        setStreak(consecutiveDays);
      } else {
        setStreak(0);
      }
    } catch (err: any) {
      console.error('[More] data fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  // ── Loading ────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={s.loadingContainer}>
        <LottieView
          source={require('@/assets/animations/runningCat.json')}
          autoPlay
          loop
          style={{ width: 180, height: 180 }}
        />
        <Text style={s.loadingText}>LOADING...</Text>
      </View>
    );
  }

  // ── Initials ───────────────────────────────────────────────────
  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // ── Stats data ─────────────────────────────────────────────────
  const statsData: { label: string; val: string; icon: IconName; color: string }[] = [
    { label: 'VISITED', val: `${visitsThisMonth}`, icon: 'calendar-check', color: Colors.green },
    { label: 'STREAK', val: `${streak}`, icon: 'fire', color: Colors.accent },
    { label: 'PLAN', val: planName ? planName.split(' ')[0] : '--', icon: 'clipboard-list-outline', color: '#A855F7' },
    { label: 'DAYS LEFT', val: daysLeft !== null ? `${daysLeft}` : '--', icon: 'clock-outline', color: Colors.blue },
  ];

  // ── Handle sign out ────────────────────────────────────────────
  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Member Hero Card ─────────────────────────────────── */}
      <FadeInView delay={0}>
        <View style={s.heroCard}>
          <LinearGradient
            colors={[Colors.accent + '18', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={s.heroAccentBar} />
          <View style={s.heroInner}>
            <View style={s.avatarCircle}>
              <Text style={s.avatarInitials}>{initials || '??'}</Text>
            </View>
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={s.heroName}>{fullName || 'Member'}</Text>
              {memberCode ? (
                <View style={s.codePill}>
                  <MaterialCommunityIcons name="card-account-details-outline" size={11} color={Colors.accent} />
                  <Text style={s.codeText}>{memberCode}</Text>
                </View>
              ) : null}
              {planName ? (
                <Text style={s.heroPlan}>{planName}</Text>
              ) : (
                <Text style={[s.heroPlan, { color: Colors.textMuted }]}>No active plan</Text>
              )}
            </View>
            {daysLeft !== null && (
              <View style={s.daysLeftBadge}>
                <Text style={s.daysLeftVal}>{daysLeft}</Text>
                <Text style={s.daysLeftLabel}>DAYS{'\n'}LEFT</Text>
              </View>
            )}
          </View>
        </View>
      </FadeInView>

      {/* ── Stats Strip ──────────────────────────────────────── */}
      <FadeInView delay={80}>
        <View style={s.statsRow}>
          {statsData.map((stat) => (
            <View key={stat.label} style={s.statBox}>
              <View
                style={[
                  s.statIconBox,
                  { backgroundColor: stat.color + '14', borderColor: stat.color + '30' },
                ]}
              >
                <MaterialCommunityIcons name={stat.icon} size={15} color={stat.color} />
              </View>
              <Text style={s.statVal}>{stat.val}</Text>
              <Text style={s.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </FadeInView>

      {/* ── Section Label ────────────────────────────────────── */}
      <FadeInView delay={110}>
        <Text style={s.sectionLabel}>OPTIONS</Text>
      </FadeInView>

      {/* ── Menu Items ───────────────────────────────────────── */}
      {menuItems.map((item, i) => (
        <FadeInView key={item.label} delay={140 + i * 50}>
          <AnimatedPressable
            style={s.menuRow}
            scaleDown={0.97}
            onPress={() => router.push(item.route as any)}
          >
            <View
              style={[
                s.menuIconBox,
                { backgroundColor: item.color + '14', borderColor: item.color + '30' },
              ]}
            >
              <MaterialCommunityIcons name={item.icon} size={18} color={item.color} />
            </View>
            <View style={s.menuText}>
              <Text style={s.menuLabel}>{item.label}</Text>
              <Text style={s.menuDesc}>{item.desc}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.textMuted} />
          </AnimatedPressable>
        </FadeInView>
      ))}

      {/* ── Sign Out ─────────────────────────────────────────── */}
      <FadeInView delay={510}>
        <AnimatedPressable style={s.logoutBtn} scaleDown={0.97} onPress={handleSignOut}>
          <MaterialCommunityIcons name="logout" size={16} color={Colors.red} />
          <Text style={s.logoutText}>SIGN OUT</Text>
        </AnimatedPressable>
      </FadeInView>

      <Text style={s.version}>GYMSETU v1.0.0</Text>
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

// ── Styles ──────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 16, gap: 10 },

  /* Loading */
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: Fonts.condensedBold,
    fontSize: 14,
    color: Colors.textMuted,
    letterSpacing: 3,
    marginTop: 4,
  },

  /* Hero Card */
  heroCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.accent + '40',
    overflow: 'hidden',
  },
  heroAccentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: Colors.accent,
  },
  heroInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    paddingLeft: 20,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.accentMuted,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.accent + '50',
  },
  avatarInitials: {
    fontSize: 18,
    fontFamily: Fonts.condensedBold,
    color: Colors.accent,
  },
  heroName: {
    fontSize: 17,
    fontFamily: Fonts.bold,
    color: Colors.text,
  },
  codePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    backgroundColor: Colors.accentMuted,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  codeText: {
    fontSize: 10,
    fontFamily: Fonts.bold,
    color: Colors.accent,
    letterSpacing: 0.5,
  },
  heroPlan: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: Colors.textSub,
    marginTop: 0,
  },
  daysLeftBadge: {
    alignItems: 'center',
    backgroundColor: Colors.accentMuted,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  daysLeftVal: {
    fontSize: 26,
    fontFamily: Fonts.condensedBold,
    color: Colors.accent,
    lineHeight: 28,
  },
  daysLeftLabel: {
    fontSize: 8,
    fontFamily: Fonts.bold,
    color: Colors.accent,
    letterSpacing: 1,
    textAlign: 'center',
  },

  /* Stats */
  statsRow: { flexDirection: 'row', gap: 8 },
  statBox: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statVal: {
    fontSize: 18,
    fontFamily: Fonts.condensedBold,
    color: Colors.text,
  },
  statLabel: {
    fontSize: 8,
    fontFamily: Fonts.bold,
    color: Colors.textMuted,
    letterSpacing: 1,
  },

  /* Section */
  sectionLabel: {
    fontSize: 9,
    fontFamily: Fonts.bold,
    color: Colors.textMuted,
    letterSpacing: 1.5,
    marginTop: 4,
  },

  /* Menu */
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  menuIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuText: { flex: 1 },
  menuLabel: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: Colors.text,
  },
  menuDesc: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    marginTop: 2,
  },

  /* Logout */
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.red + '40',
    marginTop: 8,
  },
  logoutText: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: Colors.red,
    letterSpacing: 1.5,
  },

  /* Version */
  version: {
    textAlign: 'center',
    fontFamily: Fonts.bold,
    color: Colors.textMuted,
    fontSize: 10,
    letterSpacing: 2,
    marginTop: 8,
  },
});
