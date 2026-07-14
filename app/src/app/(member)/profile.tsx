import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import LottieView from '@/components/AppLottie';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { confirmAction } from '@/lib/confirm';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import FadeInView from '@/components/FadeInView';
import AnimatedPressable from '@/components/AnimatedPressable';

// ── Helpers ──────────────────────────────────────────────────────

function getBMI(h: number | null, w: number | null) {
  if (!h || !w) return null;
  return parseFloat((w / ((h / 100) ** 2)).toFixed(1));
}

function getBMICategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: 'UNDERWEIGHT', color: '#60A5FA' };
  if (bmi < 25)   return { label: 'HEALTHY', color: Colors.green };
  if (bmi < 30)   return { label: 'OVERWEIGHT', color: Colors.orange };
  return { label: 'OBESE', color: Colors.red };
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

// ── Types ────────────────────────────────────────────────────────

interface ProfileData {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  gym_id: string | null;
  member_code: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  goal: string | null;
  created_at: string;
}

interface ActivePlan {
  name: string;
  start_date: string;
  end_date: string;
  duration_days: number;
}

// ── Screen ───────────────────────────────────────────────────────

export default function MemberProfileScreen() {
  const router = useRouter();
  const { session, gymProfile, signOut } = useAuthStore();

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [activePlan, setActivePlan] = useState<ActivePlan | null>(null);
  const [totalVisits, setTotalVisits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch all data on focus ─────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function load() {
        if (!session?.user?.id) return;
        setLoading(true);
        setError(null);

        try {
          // 1. Profile
          const { data: prof, error: profErr } = await supabase
            .from('profiles')
            .select('id, full_name, email, phone, gym_id, member_code, height_cm, weight_kg, goal, created_at')
            .eq('id', session.user.id)
            .single();
          if (profErr) throw profErr;
          if (cancelled) return;
          setProfileData(prof);

          // 2. Members bridge → membersTableId
          let membersTableId: string | null = null;
          if (prof.gym_id) {
            const { data: memberRow } = await supabase
              .from('members')
              .select('id')
              .eq('user_id', prof.id)
              .eq('gym_id', prof.gym_id)
              .maybeSingle();
            membersTableId = memberRow?.id ?? null;
          }

          // 3. Active plan (via membersTableId)
          if (membersTableId) {
            const { data: planRow } = await supabase
              .from('member_plans')
              .select('start_date, end_date, membership_plans(name, duration_days)')
              .eq('member_id', membersTableId)
              .eq('status', 'active')
              .order('end_date', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (!cancelled && planRow) {
              const mp = planRow.membership_plans as any;
              setActivePlan({
                name: mp?.name ?? 'Unknown Plan',
                start_date: planRow.start_date,
                end_date: planRow.end_date,
                duration_days: mp?.duration_days ?? 30,
              });
            }
          }

          // 4. Total attendance (uses profiles.id)
          const { count } = await supabase
            .from('attendance')
            .select('id', { count: 'exact', head: true })
            .eq('member_id', prof.id);
          if (!cancelled) setTotalVisits(count ?? 0);

        } catch (e: any) {
          if (!cancelled) setError(e.message ?? 'Failed to load profile.');
        } finally {
          if (!cancelled) setLoading(false);
        }
      }

      load();
      return () => { cancelled = true; };
    }, [session?.user?.id])
  );

  // ── Sign out handler ────────────────────────────────────────
  function handleSignOut() {
    confirmAction(
      'Sign Out',
      'Are you sure you want to sign out?',
      async () => {
        await signOut();
        router.replace('/(auth)/member-login');
      },
      { confirmText: 'Sign Out', destructive: true },
    );
  }

  // ── Loading state ───────────────────────────────────────────
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <LottieView source={require('@/assets/animations/runningCat.json')} autoPlay loop style={{ width: 180, height: 180 }} />
        <Text style={{ fontFamily: Fonts.condensedBold, fontSize: 13, color: Colors.textMuted, letterSpacing: 2, marginTop: 8 }}>LOADING PROFILE</Text>
      </View>
    );
  }

  // ── Error state ─────────────────────────────────────────────
  if (error || !profileData) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <View style={{ backgroundColor: Colors.red + '15', borderRadius: 12, borderWidth: 1, borderColor: Colors.red + '30', padding: 16, marginBottom: 16 }}>
          <Text style={{ fontFamily: Fonts.regular, fontSize: 13, color: Colors.red, textAlign: 'center' }}>
            {error ?? 'Profile not found.'}
          </Text>
        </View>
        <AnimatedPressable onPress={() => setLoading(true)} style={styles.retryBtn}>
          <Text style={{ fontFamily: Fonts.bold, fontSize: 12, color: Colors.accent, letterSpacing: 1.5 }}>TRY AGAIN</Text>
        </AnimatedPressable>
      </View>
    );
  }

  // ── Derived values ──────────────────────────────────────────
  const initials = getInitials(profileData.full_name);
  const bmi = getBMI(profileData.height_cm, profileData.weight_kg);
  const bmiCat = bmi ? getBMICategory(bmi) : null;

  // BMI bar position (range 12–40 mapped to 0–100%)
  const bmiBarPercent = bmi ? Math.min(100, Math.max(0, ((bmi - 12) / 28) * 100)) : 0;

  // Plan progress
  let daysLeft = 0;
  let planProgress = 0;
  let totalPlanDays = 0;
  if (activePlan) {
    const now = Date.now();
    const end = new Date(activePlan.end_date).getTime();
    const start = new Date(activePlan.start_date).getTime();
    daysLeft = Math.max(0, Math.ceil((end - now) / 86_400_000));
    totalPlanDays = Math.max(1, Math.ceil((end - start) / 86_400_000));
    const elapsed = totalPlanDays - daysLeft;
    planProgress = Math.min(1, Math.max(0, elapsed / totalPlanDays));
  }

  // ── Info rows config ────────────────────────────────────────
  const infoRows: { icon: string; label: string; value: string; color: string }[] = [
    { icon: 'phone', label: 'PHONE', value: profileData.phone ?? 'Not set', color: Colors.green },
    { icon: 'email-outline', label: 'EMAIL', value: profileData.email ?? 'Not set', color: Colors.blue },
    { icon: 'human-male-height', label: 'HEIGHT', value: profileData.height_cm ? `${profileData.height_cm} cm` : 'Not set', color: Colors.orange },
    { icon: 'weight-kilogram', label: 'WEIGHT', value: profileData.weight_kg ? `${profileData.weight_kg} kg` : 'Not set', color: '#A78BFA' },
    { icon: 'target', label: 'GOAL', value: profileData.goal ?? 'Not set', color: Colors.accent },
    { icon: 'calendar-check', label: 'MEMBER SINCE', value: formatDate(profileData.created_at), color: '#60A5FA' },
    { icon: 'map-marker-check', label: 'TOTAL VISITS', value: `${totalVisits}`, color: Colors.green },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* ── 1. Hero Section ──────────────────────────────────── */}
      <FadeInView delay={0}>
        <View style={styles.heroCard}>
          <LinearGradient
            colors={['rgba(255,126,29,0.15)', 'rgba(255,126,29,0.03)', 'transparent']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Avatar */}
          <View style={styles.avatarOuter}>
            <LinearGradient
              colors={[Colors.accent, '#FF5500']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarGlowRing}
            />
            <View style={styles.avatarInner}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          </View>

          {/* Name */}
          <Text style={styles.heroName}>{profileData.full_name}</Text>

          {/* Member code pill */}
          <View style={styles.codePill}>
            <MaterialCommunityIcons name="card-account-details-outline" size={12} color={Colors.accent} />
            <Text style={styles.codePillText}>{profileData.member_code ?? 'N/A'}</Text>
          </View>

          {/* Gym name pill */}
          {gymProfile?.name && (
            <View style={styles.gymPill}>
              <MaterialCommunityIcons name="dumbbell" size={11} color={Colors.textMuted} />
              <Text style={styles.gymPillText}>{gymProfile.name.toUpperCase()}</Text>
            </View>
          )}
        </View>
      </FadeInView>

      {/* ── 2. BMI Card ──────────────────────────────────────── */}
      {bmi && bmiCat && (
        <FadeInView delay={60}>
          <View style={styles.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.cardLabel}>BODY MASS INDEX</Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                <Text style={{ fontFamily: Fonts.condensedBold, fontSize: 28, color: bmiCat.color }}>{bmi}</Text>
                <Text style={{ fontFamily: Fonts.bold, fontSize: 10, color: bmiCat.color, letterSpacing: 1 }}>{bmiCat.label}</Text>
              </View>
            </View>

            {/* BMI bar */}
            <View style={styles.bmiBarTrack}>
              <LinearGradient
                colors={['#60A5FA', Colors.green, Colors.orange, Colors.red]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.bmiBarFill}
              />
              <View style={[styles.bmiIndicator, { left: `${bmiBarPercent}%` }]} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
              <Text style={styles.bmiRangeText}>12</Text>
              <Text style={styles.bmiRangeText}>18.5</Text>
              <Text style={styles.bmiRangeText}>25</Text>
              <Text style={styles.bmiRangeText}>30</Text>
              <Text style={styles.bmiRangeText}>40</Text>
            </View>
          </View>
        </FadeInView>
      )}

      {/* ── 3. Plan Card ─────────────────────────────────────── */}
      <FadeInView delay={120}>
        <View style={styles.card}>
          {activePlan ? (
            <>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardLabel}>ACTIVE PLAN</Text>
                  <Text style={{ fontFamily: Fonts.condensedBold, fontSize: 20, color: Colors.text, marginTop: 4 }}>
                    {activePlan.name}
                  </Text>
                </View>
                <View style={[styles.daysLeftBadge, daysLeft <= 7 && { backgroundColor: Colors.red + '20', borderColor: Colors.red + '40' }]}>
                  <Text style={[styles.daysLeftNum, daysLeft <= 7 && { color: Colors.red }]}>{daysLeft}</Text>
                  <Text style={[styles.daysLeftLabel, daysLeft <= 7 && { color: Colors.red }]}>DAYS LEFT</Text>
                </View>
              </View>

              {/* Dates */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSub }}>
                  {formatDate(activePlan.start_date)}
                </Text>
                <MaterialCommunityIcons name="arrow-right" size={12} color={Colors.textMuted} />
                <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSub }}>
                  {formatDate(activePlan.end_date)}
                </Text>
              </View>

              {/* Progress bar */}
              <View style={styles.planBarTrack}>
                <LinearGradient
                  colors={daysLeft <= 7 ? [Colors.red, '#FF6B6B'] : [Colors.accent, '#FF9F45']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.planBarFill, { width: `${Math.round(planProgress * 100)}%` }]}
                />
              </View>

              {/* Urgency strip */}
              {daysLeft <= 7 && daysLeft > 0 && (
                <View style={styles.urgencyStrip}>
                  <MaterialCommunityIcons name="alert-circle" size={13} color={Colors.red} />
                  <Text style={{ fontFamily: Fonts.bold, fontSize: 10, color: Colors.red, letterSpacing: 0.8 }}>
                    PLAN EXPIRES IN {daysLeft} DAY{daysLeft !== 1 ? 'S' : ''} — CONTACT YOUR GYM TO RENEW
                  </Text>
                </View>
              )}
              {daysLeft === 0 && (
                <View style={styles.urgencyStrip}>
                  <MaterialCommunityIcons name="alert-circle" size={13} color={Colors.red} />
                  <Text style={{ fontFamily: Fonts.bold, fontSize: 10, color: Colors.red, letterSpacing: 0.8 }}>
                    PLAN EXPIRED — CONTACT YOUR GYM TO RENEW
                  </Text>
                </View>
              )}
            </>
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: 12 }}>
              <MaterialCommunityIcons name="card-off-outline" size={28} color={Colors.textMuted} />
              <Text style={{ fontFamily: Fonts.medium, fontSize: 14, color: Colors.textSub, marginTop: 8 }}>No Active Plan</Text>
              <Text style={{ fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 2 }}>Contact your gym to get a plan assigned</Text>
            </View>
          )}
        </View>
      </FadeInView>

      {/* ── 4. Info Rows Card ────────────────────────────────── */}
      <FadeInView delay={180}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>PERSONAL INFORMATION</Text>
          {infoRows.map((row, i) => (
            <View
              key={row.label}
              style={[
                styles.infoRow,
                i < infoRows.length - 1 && { borderBottomWidth: 1, borderBottomColor: Colors.border },
              ]}
            >
              <View style={[styles.iconBox, { backgroundColor: row.color + '14', borderColor: row.color + '30' }]}>
                <MaterialCommunityIcons name={row.icon as any} size={14} color={row.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>{row.label}</Text>
                <Text style={styles.infoValue}>{row.value}</Text>
              </View>
            </View>
          ))}
        </View>
      </FadeInView>

      {/* ── 5. Sign Out Button ───────────────────────────────── */}
      <FadeInView delay={240}>
        <AnimatedPressable onPress={handleSignOut} style={styles.signOutCard}>
          <MaterialCommunityIcons name="logout" size={18} color={Colors.red} />
          <Text style={styles.signOutText}>SIGN OUT</Text>
        </AnimatedPressable>

        <Text style={styles.versionText}>GYMSETU  ·  v1.0.0</Text>
      </FadeInView>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ── Styles ───────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  content: {
    padding: 16,
    gap: 12,
  },

  // ── Hero
  heroCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 28,
    alignItems: 'center',
    gap: 10,
    overflow: 'hidden',
  },
  avatarOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarGlowRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    opacity: 0.4,
  },
  avatarInner: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: Colors.bgElevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.accent + '50',
  },
  avatarInitials: {
    fontFamily: Fonts.condensedBold,
    fontSize: 34,
    color: Colors.accent,
  },
  heroName: {
    fontFamily: Fonts.condensedBold,
    fontSize: 26,
    color: Colors.text,
    letterSpacing: 0.5,
    marginTop: 4,
  },
  codePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.accent + '14',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.accent + '30',
  },
  codePillText: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    color: Colors.accent,
    letterSpacing: 1.5,
  },
  gymPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.bgElevated,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  gymPillText: {
    fontFamily: Fonts.bold,
    fontSize: 9,
    color: Colors.textMuted,
    letterSpacing: 1.5,
  },

  // ── Card
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
  },
  cardLabel: {
    fontFamily: Fonts.bold,
    fontSize: 10,
    color: Colors.accent,
    letterSpacing: 1.5,
    marginBottom: 4,
  },

  // ── BMI
  bmiBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.bgElevated,
    marginTop: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  bmiBarFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 4,
  },
  bmiIndicator: {
    position: 'absolute',
    top: -3,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.text,
    borderWidth: 2.5,
    borderColor: Colors.bgCard,
    marginLeft: -7,
  },
  bmiRangeText: {
    fontFamily: Fonts.regular,
    fontSize: 9,
    color: Colors.textMuted,
  },

  // ── Plan
  daysLeftBadge: {
    alignItems: 'center',
    backgroundColor: Colors.accent + '14',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.accent + '30',
  },
  daysLeftNum: {
    fontFamily: Fonts.condensedBold,
    fontSize: 22,
    color: Colors.accent,
  },
  daysLeftLabel: {
    fontFamily: Fonts.bold,
    fontSize: 7,
    color: Colors.accent,
    letterSpacing: 1,
  },
  planBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.bgElevated,
    marginTop: 12,
    overflow: 'hidden',
  },
  planBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  urgencyStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.red + '10',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: Colors.red + '20',
  },

  // ── Info rows
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoLabel: {
    fontFamily: Fonts.bold,
    fontSize: 8,
    color: Colors.textMuted,
    letterSpacing: 1.2,
  },
  infoValue: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.text,
    marginTop: 2,
  },

  // ── Sign out
  signOutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.red + '10',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.red + '25',
    paddingVertical: 16,
  },
  signOutText: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    color: Colors.red,
    letterSpacing: 1.5,
  },

  // ── Misc
  retryBtn: {
    backgroundColor: Colors.accent + '14',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.accent + '30',
  },
  versionText: {
    fontFamily: Fonts.medium,
    fontSize: 9,
    color: Colors.textMuted,
    letterSpacing: 1.5,
    textAlign: 'center',
    marginTop: 8,
  },
});
