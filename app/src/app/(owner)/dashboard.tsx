import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, Dimensions, RefreshControl, Modal, Linking,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Location from 'expo-location';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from '@/components/AppLottie';
import { useAuthStore } from '@/store/authStore';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import { Links } from '@/constants/links';
import AnimatedPressable from '@/components/AnimatedPressable';
import FadeInView from '@/components/FadeInView';
import { supabase } from '@/lib/supabase';
import { askAI } from '@/lib/ai';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const SCREEN_W = Dimensions.get('window').width;
const CARD_W   = SCREEN_W - 32;

// ── Hero background decoration ──────────────────────────────────
const DOT_GAP  = 22;
const DOT_COLS = Math.ceil(CARD_W / DOT_GAP) + 1;
const DOT_ROWS = 10;
const heroDots = Array.from({ length: DOT_ROWS * DOT_COLS }, (_, idx) => ({
  col: idx % DOT_COLS,
  row: Math.floor(idx / DOT_COLS),
}));

function HeroBgDecor() {
  return (
    <>
      {/* Subtle dot grid */}
      {heroDots.map(({ col, row }, idx) => (
        <View
          key={idx}
          pointerEvents="none"
          style={{
            position:        'absolute',
            left:            col * DOT_GAP - 2,
            top:             row * DOT_GAP + 6,
            width:           1.5,
            height:          1.5,
            borderRadius:    1,
            backgroundColor: 'rgba(255,255,255,0.055)',
          }}
        />
      ))}
      {/* Concentric ring accent — top-right */}
      <View pointerEvents="none" style={{ position: 'absolute', top: -52, right: -52, width: 160, height: 160, borderRadius: 80,  borderWidth: 1, borderColor: 'rgba(255,77,0,0.09)' }} />
      <View pointerEvents="none" style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: 50,  borderWidth: 1, borderColor: 'rgba(255,77,0,0.06)' }} />
      {/* Bottom-left faint ring */}
      <View pointerEvents="none" style={{ position: 'absolute', bottom: -30, left: -30, width: 110, height: 110, borderRadius: 55, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' }} />
    </>
  );
}

// ── Wave bottom border — height-spanning technique = truly gap-free ──
const WAVE_N = 300;
function WaveBottomBorder() {
  const segW = CARD_W / WAVE_N;
  const freq = Math.PI * 3; // 1.5 full cycles across card width
  const amp  = 7;

  return (
    <View style={{ height: 26, position: 'relative' }}>
      {/* Soft outer glow — wide + low opacity */}
      {Array.from({ length: WAVE_N }).map((_, i) => {
        const p  = i / (WAVE_N - 1);
        const y  = Math.sin(p * freq) * amp;
        const ny = i < WAVE_N - 1 ? Math.sin(((i + 1) / (WAVE_N - 1)) * freq) * amp : y;
        const t  = Math.min(y, ny);
        const h  = Math.max(6, Math.abs(ny - y) + 6);
        return (
          <View key={`g${i}`} style={{
            position:        'absolute',
            left:            i * segW,
            width:           segW + 0.8,
            top:             11 + t - 3,
            height:          h,
            backgroundColor: Colors.accent,
            opacity:         0.10,
          }} />
        );
      })}
      {/* Core — each segment spans exactly to the next = zero gaps */}
      {Array.from({ length: WAVE_N }).map((_, i) => {
        const p    = i / (WAVE_N - 1);
        const sin  = Math.sin(p * freq);
        const y    = sin * amp;
        const ny   = i < WAVE_N - 1 ? Math.sin(((i + 1) / (WAVE_N - 1)) * freq) * amp : y;
        const topY = Math.min(y, ny);
        const h    = Math.max(1.8, Math.abs(ny - y) + 1.8);
        const peak = (sin + 1) / 2;
        return (
          <View key={i} style={{
            position:        'absolute',
            left:            i * segW,
            width:           segW + 0.8,
            top:             11 + topY - 0.4,
            height:          h,
            backgroundColor: Colors.accent,
            opacity:         0.42 + peak * 0.52,
          }} />
        );
      })}
    </View>
  );
}

// ── Quick actions ───────────────────────────────────────────────
const quickActions: { label: string; sub: string; icon: IconName; color: string; route: string }[] = [
  { label: 'Add Member',  sub: 'Onboard new member',  icon: 'account-plus-outline',    color: Colors.accent, route: '/(owner)/members/add'     },
  { label: 'Payment',     sub: 'Record a payment',    icon: 'credit-card-plus-outline', color: Colors.green,  route: '/(owner)/payments'        },
  { label: 'Attendance',  sub: 'Mark check-in',       icon: 'calendar-check-outline',  color: '#3B82F6',     route: '/(owner)/more/attendance' },
  { label: 'Plans',       sub: 'Manage gym plans',    icon: 'clipboard-list-outline',   color: '#A78BFA',     route: '/(owner)/plans'           },
];

interface Stats {
  todayCheckIns: number;
  expiredCount:  number;
  expiringCount: number;
  monthRevenue:  number;
  totalMembers:  number;
  activeMembers: number;
}

interface FeedItem {
  icon:  IconName;
  title: string;
  hint:  string;
  time:  string;
  color: string;
}

function timeAgo(dateStr: string): string {
  const diff  = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function DashboardScreen() {
  const { profile, subscription, tokenBalance, activeGymId, branches, setActiveGym } = useAuthStore();
  const router      = useRouter();
  const trialDays = (() => {
    if (subscription?.status !== 'trial' || !subscription?.trial_ends_at) return 0;
    return Math.max(0, Math.ceil((new Date(subscription.trial_ends_at).getTime() - Date.now()) / 86400000));
  })();

  const hour        = new Date().getHours();
  const greeting    = hour < 12 ? 'GOOD MORNING' : hour < 17 ? 'GOOD AFTERNOON' : 'GOOD EVENING';
  const todayLabel  = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });

  const getGymIds = useCallback((): string[] => {
    const mainGymId = profile?.gym_id;
    if (!mainGymId) return [];
    if (activeGymId === 'all') return branches.length > 0 ? branches.map(b => b.id) : [mainGymId];
    return [activeGymId ?? mainGymId];
  }, [activeGymId, branches, profile?.gym_id]);

  const [gymHasLocation, setGymHasLocation]   = useState<boolean | null>(null);
  const [locationSaving, setLocationSaving]   = useState(false);
  const [locationSuccessModal, setLocationSuccessModal] = useState(false);
  const [savedCoords, setSavedCoords]         = useState<{ lat: number; lng: number } | null>(null);

  // Check gym location independently so missing columns don't break the banner
  const checkGymLocation = useCallback(async () => {
    const gymId = profile?.gym_id;
    if (!gymId) return;
    try {
      const { data } = await supabase
        .from('gyms').select('lat, lng').eq('id', gymId).single();
      setGymHasLocation(!!(data?.lat && data?.lng));
    } catch {
      // Columns may not exist yet — show the banner anyway
      setGymHasLocation(false);
    }
  }, [profile?.gym_id]);

  const handleSetGymLocation = async () => {
    setLocationSaving(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to set gym location.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = loc.coords;
      const gymId = profile?.gym_id;
      if (!gymId) return;
      const { error } = await supabase
        .from('gyms')
        .update({ lat: latitude, lng: longitude })
        .eq('id', gymId);
      if (error) throw error;
      setGymHasLocation(true);
      setSavedCoords({ lat: latitude, lng: longitude });
      setLocationSuccessModal(true);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not save location.');
    } finally {
      setLocationSaving(false);
    }
  };

  const [stats, setStats]                         = useState<Stats>({ todayCheckIns: 0, expiredCount: 0, expiringCount: 0, monthRevenue: 0, totalMembers: 0, activeMembers: 0 });
  const [feedItems, setFeedItems]                 = useState<FeedItem[]>([]);
  const [aiInsights, setAiInsights]               = useState<string | null>(null);
  const [aiLoading, setAiLoading]                 = useState(false);
  const [growthTips, setGrowthTips]               = useState<string | null>(null);
  const [growthTipsLoading, setGrowthTipsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    const gymIds = getGymIds();
    if (gymIds.length === 0) return;
    const todayStr   = new Date().toISOString().split('T')[0];
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const [checkIns, revenue, expiredMembers, activeMembers, totalMembers] = await Promise.all([
      supabase.from('attendance').select('id', { count: 'exact', head: true }).in('gym_id', gymIds).eq('check_in_date', todayStr),
      supabase.from('payments').select('amount').in('gym_id', gymIds).gte('payment_date', monthStart),
      supabase.from('members').select('id', { count: 'exact', head: true }).in('gym_id', gymIds).eq('status', 'expired'),
      supabase.from('members').select('id, member_plans(end_date, status)').in('gym_id', gymIds).eq('status', 'active'),
      supabase.from('members').select('id', { count: 'exact', head: true }).in('gym_id', gymIds),
    ]);
    const monthTotal    = (revenue.data ?? []).reduce((s: number, p: any) => s + (p.amount || 0), 0);
    const weekLaterMs   = 7 * 24 * 60 * 60 * 1000;
    const expiringCount = (activeMembers.data ?? []).filter((m: any) => {
      const ap = m.member_plans?.find((mp: any) => mp.status === 'active');
      if (!ap?.end_date) return false;
      const diff = new Date(ap.end_date).getTime() - new Date(todayStr).getTime();
      return diff >= 0 && diff <= weekLaterMs;
    }).length;
    setStats({ todayCheckIns: checkIns.count ?? 0, expiredCount: expiredMembers.count ?? 0, expiringCount, monthRevenue: monthTotal, totalMembers: totalMembers.count ?? 0, activeMembers: activeMembers.data?.length ?? 0 });
  }, [getGymIds]);

  const fetchFeed = useCallback(async () => {
    const gymIds = getGymIds();
    if (gymIds.length === 0) return;
    const [paymentsRes, newMembersRes] = await Promise.all([
      supabase.from('payments').select('amount, payment_method, payment_date, profiles(full_name)').in('gym_id', gymIds).order('payment_date', { ascending: false }).limit(4),
      supabase.from('profiles').select('full_name, created_at').in('gym_id', gymIds).eq('role', 'member').order('created_at', { ascending: false }).limit(3),
    ]);
    const feed: FeedItem[] = [];
    (paymentsRes.data ?? []).forEach((p: any) => {
      feed.push({ icon: 'credit-card-check-outline', title: p.profiles?.full_name ?? 'Member', hint: `paid ₹${p.amount?.toLocaleString('en-IN')} · ${(p.payment_method ?? 'cash').replace('_', ' ').toUpperCase()}`, time: timeAgo(p.payment_date), color: Colors.green });
    });
    (newMembersRes.data ?? []).forEach((m: any) => {
      feed.push({ icon: 'account-plus-outline', title: m.full_name ?? 'New Member', hint: 'joined the gym', time: timeAgo(m.created_at), color: Colors.accent });
    });
    feed.sort((a, b) => {
      const ms = (t: string) => t.includes('m') ? parseInt(t) * 60000 : t.includes('h') ? parseInt(t) * 3600000 : parseInt(t) * 86400000;
      return ms(a.time) - ms(b.time);
    });
    setFeedItems(feed.slice(0, 6));
  }, [getGymIds]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchStats(), fetchFeed()]);
    setRefreshing(false);
  }, [fetchStats, fetchFeed]);

  useFocusEffect(useCallback(() => { fetchStats(); fetchFeed(); checkGymLocation(); }, [fetchStats, fetchFeed, checkGymLocation]));

  const handleAIInsights = async () => {
    setAiLoading(true); setAiInsights(null);
    try { setAiInsights(await askAI('dashboard_insights', { totalMembers: stats.totalMembers, activeMembers: stats.activeMembers, expiringThisWeek: stats.expiringCount, todayAttendance: stats.todayCheckIns, monthRevenue: stats.monthRevenue })); }
    catch { Alert.alert('Error', 'Could not generate insights'); }
    setAiLoading(false);
  };

  const handleGrowthTips = async () => {
    setGrowthTipsLoading(true); setGrowthTips(null);
    try { setGrowthTips(await askAI('growth_tips', { totalMembers: stats.totalMembers, activeMembers: stats.activeMembers, monthRevenue: stats.monthRevenue, expiredCount: stats.expiredCount })); }
    catch { Alert.alert('Error', 'Could not generate growth tips'); }
    setGrowthTipsLoading(false);
  };

  const fmt = (n: number) =>
    n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : n >= 1000 ? `₹${(n / 1000).toFixed(1)}K` : `₹${n}`;

  const pulseStats: { label: string; value: string; sub: string; color: string; icon: IconName }[] = [
    { label: 'TODAY IN',   value: stats.todayCheckIns.toString(), sub: 'check-ins', color: Colors.green,  icon: 'calendar-check-outline' },
    { label: 'EXPIRED',    value: stats.expiredCount.toString(),  sub: 'members',   color: Colors.red,    icon: 'account-off-outline'    },
    { label: 'EXPIRING',   value: stats.expiringCount.toString(), sub: 'this week', color: Colors.orange, icon: 'clock-alert-outline'    },
    { label: 'THIS MONTH', value: fmt(stats.monthRevenue),        sub: 'revenue',   color: Colors.accent, icon: 'trending-up'            },
  ];

  const weekInsights: { icon: IconName; color: string; label: string; value: string }[] = [
    { icon: 'calendar-check-outline', color: '#3B82F6',     label: `${stats.todayCheckIns} members checked in today`, value: stats.todayCheckIns.toString() },
    { icon: 'clock-alert-outline',    color: Colors.orange, label: `${stats.expiringCount} plans expiring this week`, value: stats.expiringCount.toString() },
    { icon: 'trending-up',            color: Colors.green,  label: 'Revenue collected this month',                    value: fmt(stats.monthRevenue)         },
    { icon: 'account-group-outline',  color: Colors.red,    label: `${stats.expiredCount} memberships expired`,       value: stats.expiredCount.toString()   },
  ];

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView
        style={s.container}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.accent}
            colors={[Colors.accent]}
            progressBackgroundColor={Colors.bgCard}
          />
        }
      >

        {/* ── Header ── */}
        <FadeInView delay={0}>
          <View style={s.header}>
            <View style={{ flex: 1 }}>
              <Text style={s.greeting}>{greeting} · {todayLabel.toUpperCase()}</Text>
              <Text style={s.ownerName}>{profile?.full_name?.toUpperCase() || 'OWNER'}</Text>
            </View>
            <AnimatedPressable style={s.avatarBtn} scaleDown={0.9} onPress={() => router.push('/(owner)/more/settings' as any)}>
              <MaterialCommunityIcons name="account-circle-outline" size={28} color={Colors.accent} />
            </AnimatedPressable>
          </View>
        </FadeInView>

        {/* ── Branch Switcher ── */}
        {branches.length > 0 && (
          <FadeInView delay={30}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.branchRow}
              style={s.branchScroll}
            >
              {/* All branches option */}
              <AnimatedPressable
                style={[s.branchChip, activeGymId === 'all' && s.branchChipActive]}
                scaleDown={0.93}
                onPress={() => setActiveGym('all')}
              >
                <MaterialCommunityIcons
                  name="domain"
                  size={12}
                  color={activeGymId === 'all' ? Colors.accent : Colors.textMuted}
                />
                <Text style={[s.branchChipText, activeGymId === 'all' && s.branchChipTextActive]}>
                  ALL
                </Text>
              </AnimatedPressable>

              {branches.map(b => {
                const isActive = activeGymId === b.id;
                return (
                  <AnimatedPressable
                    key={b.id}
                    style={[s.branchChip, isActive && s.branchChipActive]}
                    scaleDown={0.93}
                    onPress={() => setActiveGym(b.id)}
                  >
                    <MaterialCommunityIcons
                      name={b.is_branch ? 'source-branch' : 'home-city-outline'}
                      size={12}
                      color={isActive ? Colors.accent : Colors.textMuted}
                    />
                    <Text style={[s.branchChipText, isActive && s.branchChipTextActive]} numberOfLines={1}>
                      {b.name}
                    </Text>
                    {b.branch_city ? (
                      <Text style={s.branchCity}>{b.branch_city}</Text>
                    ) : null}
                  </AnimatedPressable>
                );
              })}
            </ScrollView>
          </FadeInView>
        )}

        {/* ── GPS Setup Banner ── */}
        {gymHasLocation === false && (
          <FadeInView delay={45}>
            <View style={s.gpsBanner}>
              <LinearGradient
                colors={['#3B82F615', 'transparent']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />
              <View style={s.gpsIconBox}>
                <MaterialCommunityIcons name="map-marker-alert-outline" size={18} color="#3B82F6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.gpsBannerTitle}>GYM LOCATION NOT SET</Text>
                <Text style={s.gpsBannerSub}>Required for member GPS check-in to work</Text>
              </View>
              <AnimatedPressable
                style={s.gpsSetBtn}
                scaleDown={0.93}
                onPress={handleSetGymLocation}
                disabled={locationSaving}
              >
                {locationSaving
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <>
                      <MaterialCommunityIcons name="crosshairs-gps" size={13} color="#fff" />
                      <Text style={s.gpsSetBtnText}>SET NOW</Text>
                    </>
                }
              </AnimatedPressable>
            </View>
          </FadeInView>
        )}

        {/* ── Hero Snapshot — Liquid Glass ── */}
        <FadeInView delay={60}>
          <View style={s.heroCard}>

            {/* ── Background decoration — dots + rings ── */}
            <HeroBgDecor />

            {/* Glass layer stack */}
            <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(10,7,5,0.52)' }]} />
            {/* Orange ambient — warm glow from top-right background orb */}
            <LinearGradient
              colors={['rgba(255,77,0,0.16)', 'rgba(255,77,0,0.05)', 'transparent']}
              start={{ x: 1, y: 0 }} end={{ x: 0.2, y: 1 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            {/* Very subtle top edge line — NOT a white shadow, just glass refraction */}
            <View style={s.heroEdgeLine} />

            {/* ── Hero top: bold title left + lottie right ── */}
            <View style={s.heroLottieRow}>
              <View style={s.heroTitleBlock}>
                <View style={s.heroEyebrowRow}>
                  <MaterialCommunityIcons name="lightning-bolt" size={10} color={Colors.accent} />
                  <Text style={s.heroEyebrow}>GYM SNAPSHOT</Text>
                </View>
                <Text style={s.heroTitle}>TODAY'S{'\n'}OVERVIEW</Text>
              </View>
              <LottieView
                source={require('@/assets/animations/Analytics.json')}
                autoPlay
                loop
                style={s.heroLottie}
              />
            </View>

            {/* ── Insight rows ── */}
            <View style={s.heroRows}>
              {weekInsights.map((ins, i) => (
                <View key={i} style={[s.insightRow, i < weekInsights.length - 1 && s.insightRowBorder]}>
                  <View style={[s.insightDot, { backgroundColor: ins.color + '18' }]}>
                    <MaterialCommunityIcons name={ins.icon} size={13} color={ins.color} />
                  </View>
                  <Text style={s.insightText} numberOfLines={1}>{ins.label}</Text>
                  <Text style={[s.insightValue, { color: ins.color }]}>{ins.value}</Text>
                </View>
              ))}
            </View>

            {/* ── Trial notice — blends inside the card before the wave ── */}
            {trialDays > 0 && (
              <View style={s.trialRow}>
                <View style={s.trialSep} />
                <View style={s.trialContent}>
                  <MaterialCommunityIcons
                    name={trialDays <= 2 ? 'alert-circle-outline' : 'gift-outline'}
                    size={13}
                    color={trialDays <= 2 ? Colors.red : Colors.accent}
                  />
                  <Text style={[s.trialText, trialDays <= 2 && { color: Colors.red }]}>
                    {trialDays <= 2
                      ? `Only ${trialDays} day${trialDays !== 1 ? 's' : ''} left in your trial`
                      : `Free trial · ${trialDays} days remaining`}
                  </Text>
                  <AnimatedPressable
                    style={[s.trialBtn, trialDays <= 2 && { borderColor: Colors.red + '40', backgroundColor: Colors.red + '12' }]}
                    scaleDown={0.93}
                    onPress={() => router.push('/paywall' as any)}
                  >
                    <Text style={[s.trialBtnText, trialDays <= 2 && { color: Colors.red }]}>Upgrade</Text>
                  </AnimatedPressable>
                </View>
              </View>
            )}

            {/* ── Wave bottom border — the actual lower edge of the card ── */}
            <View style={s.heroWaveWrap}>
              <WaveBottomBorder />
            </View>

          </View>
        </FadeInView>

        {/* ── Pulse Stats — 2×2 grid ── */}
        <FadeInView delay={160}>
          <View style={s.pulseGrid}>
            {pulseStats.map((p) => (
              <View key={p.label} style={[s.pulseBox, { borderColor: p.color + '20' }]}>

                {/* Soft vertical gradient — colour bleeds down from top */}
                <LinearGradient
                  colors={[p.color + '1A', 'transparent']}
                  start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                  style={StyleSheet.absoluteFill}
                  pointerEvents="none"
                />

                {/* 2.5 px top accent stripe */}
                <View style={[s.pulseTopLine, { backgroundColor: p.color }]} />

                {/* Ghost icon — large, bottom-right, barely visible */}
                <View style={s.pulseGhost} pointerEvents="none">
                  <MaterialCommunityIcons name={p.icon} size={68} color={p.color} />
                </View>

                {/* Icon + label pill — top of card */}
                <View style={[s.pulseChip, { backgroundColor: p.color + '14', borderColor: p.color + '22' }]}>
                  <MaterialCommunityIcons name={p.icon} size={11} color={p.color} />
                  <Text style={[s.pulseChipLabel, { color: p.color }]}>{p.label}</Text>
                </View>

                {/* Hero number */}
                <Text style={[s.pulseVal, { color: p.color }]}>{p.value}</Text>

                {/* Context sub-label */}
                <Text style={s.pulseSub}>{p.sub}</Text>

              </View>
            ))}
          </View>
        </FadeInView>

        {/* ── AI Insights ── */}
        <FadeInView delay={220}>
          <View style={s.aiCard}>
            <View style={s.aiCardGlow} />
            <View style={s.aiCardHead}>
              <View style={s.aiCardLeft}>
                <MaterialCommunityIcons name="robot-outline" size={16} color={Colors.accent} />
                <Text style={s.aiCardLabel}>AI INSIGHTS</Text>
              </View>
              <TouchableOpacity style={s.aiBtn} onPress={handleAIInsights} disabled={aiLoading}>
                {aiLoading ? <ActivityIndicator size="small" color={Colors.accent} /> : <Text style={s.aiBtnText}>✨ Analyse</Text>}
              </TouchableOpacity>
            </View>
            {aiInsights ? <Text style={s.aiBodyText}>{aiInsights}</Text> : <Text style={s.aiPlaceholder}>Tap Analyse to get AI-powered insights about your gym</Text>}
          </View>
        </FadeInView>

        {/* ── AI Growth Tips ── */}
        <FadeInView delay={240}>
          <View style={s.growthCard}>
            <View style={s.growthCardHead}>
              <View style={s.aiCardLeft}>
                <MaterialCommunityIcons name="lightbulb-on-outline" size={16} color={Colors.green} />
                <Text style={s.growthCardLabel}>AI GROWTH TIPS</Text>
              </View>
              <TouchableOpacity style={s.growthBtn} onPress={handleGrowthTips} disabled={growthTipsLoading}>
                {growthTipsLoading ? <ActivityIndicator size="small" color={Colors.green} /> : <Text style={s.growthBtnText}>💡 Get Tips</Text>}
              </TouchableOpacity>
            </View>
            {growthTips ? <Text style={s.aiBodyText}>{growthTips}</Text> : <Text style={s.aiPlaceholder}>Tap Get Tips for AI-powered business growth suggestions</Text>}
          </View>
        </FadeInView>

        {/* ── Token Balance (Pro only) ── */}
        {subscription?.plan && subscription.plan !== 'basic' && tokenBalance && (
          <FadeInView delay={250}>
            <View style={s.tokenCard}>
              <LinearGradient
                colors={['rgba(139,92,246,0.12)', 'transparent']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />
              <View style={s.tokenHead}>
                <View style={s.aiCardLeft}>
                  <MaterialCommunityIcons name="message-text-outline" size={16} color="#A78BFA" />
                  <Text style={s.tokenLabel}>WHATSAPP TOKENS</Text>
                </View>
                <View style={s.tokenBadge}>
                  <Text style={s.tokenBadgeText}>{tokenBalance.remaining} LEFT</Text>
                </View>
              </View>

              {/* Progress bar */}
              <View style={s.tokenBarBg}>
                <View style={[s.tokenBarFill, { width: `${Math.min(100, (tokenBalance.used / tokenBalance.total) * 100)}%` as any }]} />
              </View>
              <View style={s.tokenRow}>
                <Text style={s.tokenUsed}>{tokenBalance.used} used</Text>
                <Text style={s.tokenTotal}>of {tokenBalance.total}</Text>
              </View>

              {/* Buy More button */}
              <AnimatedPressable
                style={s.tokenBuyBtn}
                scaleDown={0.95}
                onPress={() => Linking.openURL(Links.tokens)}
              >
                <MaterialCommunityIcons name="cart-plus" size={14} color="#A78BFA" />
                <Text style={s.tokenBuyText}>BUY MORE TOKENS</Text>
                <MaterialCommunityIcons name="open-in-new" size={11} color="#A78BFA" style={{ opacity: 0.6 }} />
              </AnimatedPressable>
            </View>
          </FadeInView>
        )}

        {/* ── Quick Actions ── */}
        <FadeInView delay={260}>
          <Text style={s.sectionLabel}>QUICK ACTIONS</Text>
          <View style={s.actionsGrid}>
            {quickActions.map((a) => (
              <AnimatedPressable
                key={a.label}
                style={[s.actionCard, { borderColor: a.color + '22' }]}
                scaleDown={0.94}
                onPress={() => router.push(a.route as any)}
              >
                {/* Colour gradient wash */}
                <LinearGradient
                  colors={[a.color + '18', 'transparent']}
                  start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                  style={StyleSheet.absoluteFill}
                  pointerEvents="none"
                />

                {/* Arrow — top-right tap hint */}
                <View style={s.actionArrow}>
                  <MaterialCommunityIcons name="arrow-top-right" size={13} color={a.color} />
                </View>

                {/* Icon in a rounded square */}
                <View style={[s.actionIconWrap, { backgroundColor: a.color + '1C' }]}>
                  <MaterialCommunityIcons name={a.icon} size={26} color={a.color} />
                </View>

                {/* Label + sub */}
                <View>
                  <Text style={s.actionLabel}>{a.label}</Text>
                  <Text style={s.actionSub}>{a.sub}</Text>
                </View>

              </AnimatedPressable>
            ))}
          </View>
        </FadeInView>

        {/* ── Expiry Alert ── */}
        {stats.expiringCount > 0 && (
          <FadeInView delay={340}>
            <AnimatedPressable style={s.alertCard} scaleDown={0.98} onPress={() => router.push('/(owner)/more/reports-expiry' as any)}>
              <View style={s.alertAccent} />
              <View style={s.alertIconBox}>
                <MaterialCommunityIcons name="clock-alert-outline" size={22} color={Colors.orange} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.alertTitle}>{stats.expiringCount} MEMBERSHIP{stats.expiringCount !== 1 ? 'S' : ''} EXPIRING SOON</Text>
                <Text style={s.alertSub}>Tap to view and renew</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.orange} />
            </AnimatedPressable>
          </FadeInView>
        )}

        {/* ── Activity Feed ── */}
        <FadeInView delay={420}>
          <Text style={s.sectionLabel}>ACTIVITY FEED</Text>
          {feedItems.length === 0 ? (
            <View style={s.feedCard}>
              <Text style={[s.aiPlaceholder, { padding: 16, textAlign: 'center' }]}>No recent activity</Text>
            </View>
          ) : (
            <View style={s.feedCard}>
              {feedItems.map((item, i) => (
                <View key={i} style={[s.feedRow, i < feedItems.length - 1 && s.feedBorder]}>
                  <View style={[s.feedIconBox, { backgroundColor: item.color + '15' }]}>
                    <MaterialCommunityIcons name={item.icon} size={18} color={item.color} />
                  </View>
                  <View style={s.feedText}>
                    <Text style={s.feedTitle}>{item.title}</Text>
                    <Text style={s.feedHint}>{item.hint}</Text>
                  </View>
                  <Text style={s.feedTime}>{item.time}</Text>
                </View>
              ))}
            </View>
          )}
        </FadeInView>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ── GPS Location Success Modal ── */}
      <Modal visible={locationSuccessModal} transparent animationType="fade" onRequestClose={() => setLocationSuccessModal(false)}>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={s.locModalOverlay}>
          <View style={s.locModalCard}>
            <LinearGradient
              colors={[Colors.green + '12', 'transparent']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            {/* Top bar */}
            <View style={s.locModalTopBar} />

            {/* Icon ring */}
            <View style={s.locModalIconRing}>
              <View style={s.locModalIconInner}>
                <MaterialCommunityIcons name="map-marker-check" size={32} color={Colors.green} />
              </View>
            </View>

            <Text style={s.locModalTitle}>LOCATION SAVED</Text>
            <Text style={s.locModalGymName}>{profile?.gym_id ? 'Gym HQ' : 'Your Gym'}</Text>
            <Text style={s.locModalDesc}>
              Members can now GPS check-in within 100m of your gym. The banner on your dashboard will no longer appear.
            </Text>

            {/* Coords pill */}
            {savedCoords && (
              <View style={s.locCoordRow}>
                <View style={s.locCoordPill}>
                  <MaterialCommunityIcons name="latitude" size={11} color={Colors.green} />
                  <Text style={s.locCoordText}>{savedCoords.lat.toFixed(5)}°</Text>
                </View>
                <View style={s.locCoordPill}>
                  <MaterialCommunityIcons name="longitude" size={11} color={Colors.green} />
                  <Text style={s.locCoordText}>{savedCoords.lng.toFixed(5)}°</Text>
                </View>
              </View>
            )}

            {/* Radius info strip */}
            <View style={s.locRadiusStrip}>
              <MaterialCommunityIcons name="circle-outline" size={13} color={Colors.textMuted} />
              <Text style={s.locRadiusText}>100 metre check-in radius active</Text>
            </View>

            {/* Done button */}
            <AnimatedPressable
              style={s.locDoneBtn}
              scaleDown={0.96}
              onPress={() => setLocationSuccessModal(false)}
            >
              <LinearGradient
                colors={[Colors.green, '#15803d']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={s.locDoneBtnGrad}
              >
                <MaterialCommunityIcons name="check" size={16} color="#fff" />
                <Text style={s.locDoneBtnText}>DONE</Text>
              </LinearGradient>
            </AnimatedPressable>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: Colors.bg },
  container: { flex: 1 },
  scroll:    { paddingHorizontal: 16, paddingBottom: 24 },

  // ── Header ────────────────────────────────────────────────────
  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, marginBottom: 18 },
  greeting:  { fontFamily: Fonts.medium, fontSize: 9, color: Colors.accent, letterSpacing: 1.6 },
  ownerName: { fontFamily: Fonts.condensedBold, fontSize: 30, color: Colors.text, letterSpacing: 0.5, marginTop: 2 },
  avatarBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.bgCard, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.accent + '30' },

  // ── Hero glass card ───────────────────────────────────────────
  heroCard: {
    borderRadius:    22,
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.08)',
    overflow:        'hidden',
    marginBottom:    14,
    backgroundColor: 'rgba(14,10,7,0.90)',
  },
  // Barely-visible top edge — NOT a bright white shadow, just a subtle refraction hint
  heroEdgeLine: {
    position:        'absolute',
    top:             0,
    left:            24,
    right:           24,
    height:          1,
    backgroundColor: 'rgba(255,255,255,0.09)',
  },

  // Hero top row
  heroLottieRow: {
    flexDirection: 'row',
    alignItems:    'center',
    paddingLeft:   16,
    paddingRight:  4,
    paddingTop:    16,
    paddingBottom: 8,
  },
  heroTitleBlock: {
    flex: 1,
    gap:  4,
  },
  heroEyebrowRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           5,
    marginBottom:  2,
  },
  heroEyebrow: {
    fontFamily:    Fonts.bold,
    fontSize:      8,
    color:         Colors.accent,
    letterSpacing: 2.5,
  },
  heroTitle: {
    fontFamily:    Fonts.condensedBold,
    fontSize:      28,
    color:         Colors.text,
    lineHeight:    30,
    letterSpacing: 0.4,
  },
  heroLottie: { width: 118, height: 118, flexShrink: 0 },

  // Insight rows section
  heroRows: {
    paddingHorizontal: 16,
    paddingBottom:     8,
  },
  insightRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  insightRowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  insightDot:       { width: 26, height: 26, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  insightText:      { flex: 1, fontFamily: Fonts.regular, fontSize: 12, color: 'rgba(255,255,255,0.48)' },
  insightValue:     { fontFamily: Fonts.bold, fontSize: 12 },

  // ── Trial notice (inside hero card) ──────────────────────────
  trialRow: {
    paddingHorizontal: 16,
    paddingTop:        10,
  },
  trialSep: {
    height:          1,
    backgroundColor: 'rgba(255,77,0,0.14)',
    marginBottom:    10,
  },
  trialContent: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
  },
  trialText: {
    flex:          1,
    fontFamily:    Fonts.regular,
    fontSize:      11,
    color:         Colors.accent,
    opacity:       0.88,
  },
  trialBtn: {
    paddingHorizontal: 12,
    paddingVertical:   4,
    backgroundColor:   'rgba(255,77,0,0.10)',
    borderRadius:      20,
    borderWidth:       1,
    borderColor:       'rgba(255,77,0,0.28)',
  },
  trialBtnText: {
    fontFamily: Fonts.bold,
    fontSize:   10,
    color:      Colors.accent,
  },

  // Wave sits at the very bottom of the card — it IS the lower border
  heroWaveWrap: {
    paddingHorizontal: 0,
    paddingTop:        6,
  },

  // ── Pulse stats 2×2 grid ─────────────────────────────────────
  pulseGrid: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           10,
    marginBottom:  14,
  },
  pulseBox: {
    width:           (CARD_W - 10) / 2,
    backgroundColor: Colors.bgCard,
    borderRadius:    20,
    borderWidth:     1,
    paddingTop:      16,
    paddingBottom:   18,
    paddingHorizontal: 16,
    overflow:        'hidden',
  },

  // Top colour stripe
  pulseTopLine: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 2.5,
  },

  // Big faint ghost icon — bottom-right depth texture
  pulseGhost: {
    position: 'absolute',
    right:   -12,
    bottom:  -12,
    opacity:  0.055,
  },

  // Icon + label pill at top
  pulseChip: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               5,
    alignSelf:         'flex-start',
    borderRadius:      20,
    paddingHorizontal: 8,
    paddingVertical:   4,
    borderWidth:       1,
    marginBottom:      14,
  },
  pulseChipLabel: {
    fontFamily:    Fonts.bold,
    fontSize:      8,
    letterSpacing: 1.5,
  },

  // Hero number
  pulseVal: {
    fontFamily:    Fonts.condensedBold,
    fontSize:      42,
    letterSpacing: 0.3,
    lineHeight:    46,
    marginBottom:  4,
  },

  // Context line
  pulseSub: {
    fontFamily: Fonts.regular,
    fontSize:   10,
    color:      Colors.textMuted,
  },

  // ── AI cards ─────────────────────────────────────────────────
  aiCard:          { backgroundColor: Colors.bgCard, borderRadius: 18, borderWidth: 1, borderColor: Colors.accent + '30', padding: 16, marginBottom: 14, overflow: 'hidden' },
  aiCardGlow:      { position: 'absolute', bottom: -30, right: -30, width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.accentGlow },
  aiCardHead:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  aiCardLeft:      { flexDirection: 'row', alignItems: 'center', gap: 6 },
  aiCardLabel:     { fontFamily: Fonts.bold, fontSize: 9, color: Colors.accent, letterSpacing: 2 },
  aiBtn:           { paddingHorizontal: 14, paddingVertical: 7, backgroundColor: Colors.accentMuted, borderRadius: 10, borderWidth: 1, borderColor: Colors.accent + '40' },
  aiBtnText:       { fontFamily: Fonts.bold, fontSize: 11, color: Colors.accent, letterSpacing: 0.5 },
  aiBodyText:      { fontFamily: Fonts.regular, fontSize: 13, color: Colors.text, lineHeight: 20 },
  aiPlaceholder:   { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, lineHeight: 18 },

  growthCard:      { backgroundColor: Colors.bgCard, borderRadius: 18, borderWidth: 1, borderColor: Colors.green + '30', padding: 16, marginBottom: 20, overflow: 'hidden' },
  growthCardHead:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  growthCardLabel: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.green, letterSpacing: 2 },
  growthBtn:       { paddingHorizontal: 14, paddingVertical: 7, backgroundColor: Colors.green + '18', borderRadius: 10, borderWidth: 1, borderColor: Colors.green + '40' },
  growthBtnText:   { fontFamily: Fonts.bold, fontSize: 11, color: Colors.green, letterSpacing: 0.5 },

  // ── Token balance card ────────────────────────────────────────
  tokenCard: {
    backgroundColor: Colors.bgCard, borderRadius: 18, borderWidth: 1,
    borderColor: '#A78BFA30', padding: 16, marginBottom: 20, overflow: 'hidden',
  },
  tokenHead: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14,
  },
  tokenLabel: { fontFamily: Fonts.bold, fontSize: 9, color: '#A78BFA', letterSpacing: 2 },
  tokenBadge: {
    backgroundColor: '#A78BFA18', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: '#A78BFA30',
  },
  tokenBadgeText: { fontFamily: Fonts.bold, fontSize: 10, color: '#A78BFA', letterSpacing: 0.5 },
  tokenBarBg: {
    height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.06)', overflow: 'hidden',
  },
  tokenBarFill: {
    height: '100%', borderRadius: 4, backgroundColor: '#A78BFA',
  },
  tokenRow: {
    flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, marginBottom: 14,
  },
  tokenUsed:  { fontFamily: Fonts.bold, fontSize: 11, color: '#A78BFA' },
  tokenTotal: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted },
  tokenBuyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#A78BFA14', borderRadius: 12,
    paddingVertical: 11, borderWidth: 1, borderColor: '#A78BFA30',
  },
  tokenBuyText: { fontFamily: Fonts.bold, fontSize: 11, color: '#A78BFA', letterSpacing: 1 },

  sectionLabel: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted, letterSpacing: 1.8, marginBottom: 10, marginTop: 4 },

  // ── Quick actions 2×2 grid ────────────────────────────────────
  actionsGrid: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           10,
    marginBottom:  20,
  },
  actionCard: {
    width:           (CARD_W - 10) / 2,
    backgroundColor: Colors.bgCard,
    borderRadius:    20,
    borderWidth:     1,
    paddingTop:      14,
    paddingBottom:   18,
    paddingHorizontal: 16,
    overflow:        'hidden',
    gap:             12,
  },
  actionArrow: {
    position: 'absolute',
    top:      13,
    right:    13,
    opacity:  0.40,
  },
  actionIconWrap: {
    width:          50,
    height:         50,
    borderRadius:   15,
    justifyContent: 'center',
    alignItems:     'center',
  },
  actionLabel: {
    fontFamily:    Fonts.bold,
    fontSize:      13,
    color:         Colors.text,
    letterSpacing: 0.1,
    marginBottom:  3,
  },
  actionSub: {
    fontFamily: Fonts.regular,
    fontSize:   10,
    color:      Colors.textMuted,
  },

  // ── Expiry alert ──────────────────────────────────────────────
  alertCard:    { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgCard, borderRadius: 14, padding: 16, gap: 12, borderWidth: 1, borderColor: Colors.orange + '30', overflow: 'hidden', marginBottom: 20 },
  alertAccent:  { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: Colors.orange },
  alertIconBox: { width: 40, height: 40, borderRadius: 11, backgroundColor: Colors.orange + '15', justifyContent: 'center', alignItems: 'center' },
  alertTitle:   { fontFamily: Fonts.bold, fontSize: 12, color: Colors.text, letterSpacing: 0.5 },
  alertSub:     { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 3 },

  // ── Activity feed ─────────────────────────────────────────────
  feedCard:    { backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  feedRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14 },
  feedBorder:  { borderBottomWidth: 1, borderBottomColor: Colors.border },
  feedIconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  feedText:    { flex: 1 },
  feedTitle:   { fontFamily: Fonts.bold, fontSize: 13, color: Colors.text },
  feedHint:    { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  feedTime:    { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted },

  // ── GPS banner ────────────────────────────────────────────────
  gpsBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.bgCard, borderRadius: 16,
    borderWidth: 1, borderColor: '#3B82F630',
    padding: 14, marginBottom: 12, overflow: 'hidden',
  },
  gpsIconBox: {
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: '#3B82F614',
    borderWidth: 1, borderColor: '#3B82F630',
    justifyContent: 'center', alignItems: 'center',
  },
  gpsBannerTitle: { fontFamily: Fonts.bold, fontSize: 11, color: '#3B82F6', letterSpacing: 0.5 },
  gpsBannerSub:   { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted, marginTop: 2 },
  gpsSetBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#3B82F6', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 9, minWidth: 72, justifyContent: 'center',
  },
  gpsSetBtnText: { fontFamily: Fonts.bold, fontSize: 10, color: '#fff', letterSpacing: 0.5 },

  // ── GPS location success modal ────────────────────────────────
  locModalOverlay:  { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 28 },
  locModalCard: {
    width: '100%', backgroundColor: Colors.bgCard,
    borderRadius: 28, borderWidth: 1, borderColor: Colors.green + '35',
    overflow: 'hidden', alignItems: 'center',
    paddingHorizontal: 24, paddingBottom: 24,
  },
  locModalTopBar:   { alignSelf: 'stretch', height: 3, backgroundColor: Colors.green, marginBottom: 28 },
  locModalIconRing: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: Colors.green + '12',
    borderWidth: 1, borderColor: Colors.green + '35',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 18,
  },
  locModalIconInner:{
    width: 62, height: 62, borderRadius: 31,
    backgroundColor: Colors.green + '20',
    justifyContent: 'center', alignItems: 'center',
  },
  locModalTitle:    { fontFamily: Fonts.condensedBold, fontSize: 13, color: Colors.green, letterSpacing: 3, marginBottom: 6 },
  locModalGymName:  { fontFamily: Fonts.condensedBold, fontSize: 26, color: Colors.text, marginBottom: 10, textAlign: 'center' },
  locModalDesc:     { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, textAlign: 'center', lineHeight: 19, marginBottom: 16 },
  locCoordRow:      { flexDirection: 'row', gap: 8, marginBottom: 14 },
  locCoordPill:     {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.green + '12', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: Colors.green + '28',
  },
  locCoordText:     { fontFamily: Fonts.bold, fontSize: 11, color: Colors.green, letterSpacing: 0.3 },
  locRadiusStrip:   {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: Colors.bgElevated, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 9,
    borderWidth: 1, borderColor: Colors.border,
    alignSelf: 'stretch', justifyContent: 'center',
    marginBottom: 20,
  },
  locRadiusText:    { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted },
  locDoneBtn:       { alignSelf: 'stretch', borderRadius: 14, overflow: 'hidden' },
  locDoneBtnGrad:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  locDoneBtnText:   { fontFamily: Fonts.bold, fontSize: 13, color: '#fff', letterSpacing: 1.5 },

  // ── Branch switcher ───────────────────────────────────────────
  branchScroll: { marginBottom: 16 },
  branchRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 0, paddingRight: 16 },
  branchChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: Colors.bgCard,
    borderRadius: 20, borderWidth: 1, borderColor: Colors.border,
  },
  branchChipActive: {
    backgroundColor: Colors.accent + '18',
    borderColor: Colors.accent + '60',
  },
  branchChipText: {
    fontFamily: Fonts.bold, fontSize: 10,
    color: Colors.textMuted, letterSpacing: 0.8,
  },
  branchChipTextActive: { color: Colors.accent },
  branchCity: {
    fontFamily: Fonts.regular, fontSize: 9,
    color: Colors.textMuted,
    backgroundColor: Colors.bgElevated,
    paddingHorizontal: 5, paddingVertical: 1,
    borderRadius: 4,
  },
});
