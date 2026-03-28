import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TextInput as RNTextInput, Pressable,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useFocusEffect } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import FadeInView from '@/components/FadeInView';
import AnimatedPressable from '@/components/AnimatedPressable';
import LottieView from 'lottie-react-native';

interface BreakEvenData {
  totalExpenses:       number;
  totalRevenue:        number;
  activeMembers:       number;
  avgRevenuePerMember: number;
  breakEvenCount:      number;
  netProfit:           number;
  progressPct:         number;
}

const fmt = (n: number) =>
  n >= 100000 ? `₹${(n / 100000).toFixed(1)}L`
  : n >= 1000  ? `₹${(n / 1000).toFixed(1)}K`
  : `₹${Math.abs(n).toLocaleString('en-IN')}`;

export default function BreakEvenScreen() {
  const { profile, activeGymId, branches } = useAuthStore();

  const [data,       setData]       = useState<BreakEvenData | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [manualCost, setManualCost] = useState('');
  const [overriding, setOverriding] = useState(false);
  const [inputFocus, setInputFocus] = useState(false);

  const fetchData = useCallback(async () => {
    if (!profile?.gym_id) return;
    setLoading(true);

    const mainGymId = profile.gym_id;
    const gymIds = activeGymId === 'all'
      ? branches.map(b => b.id)
      : [activeGymId ?? mainGymId];

    const now        = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const [expRes, payRes, planRes] = await Promise.all([
      supabase.from('expenses').select('amount').in('gym_id', gymIds).gte('date', monthStart).lte('date', monthEnd),
      supabase.from('payments').select('amount').in('gym_id', gymIds).gte('payment_date', monthStart).lte('payment_date', monthEnd),
      supabase.from('member_plans').select('member_id').in('gym_id', gymIds).eq('status', 'active'),
    ]);

    const totalExpenses = (expRes.data ?? []).reduce((s, e) => s + (e.amount ?? 0), 0);
    const totalRevenue  = (payRes.data ?? []).reduce((s, p) => s + (p.amount ?? 0), 0);
    const activeMembers = (planRes.data ?? []).length;

    const avgRevenuePerMember = activeMembers > 0 ? Math.round(totalRevenue / activeMembers) : 0;

    const fixedCosts = overriding && manualCost
      ? parseFloat(manualCost) || totalExpenses
      : totalExpenses;

    const breakEvenCount = avgRevenuePerMember > 0 ? Math.ceil(fixedCosts / avgRevenuePerMember) : 0;
    const netProfit      = totalRevenue - fixedCosts;
    const progressPct    = breakEvenCount > 0
      ? Math.min(Math.round((activeMembers / breakEvenCount) * 100), 100) : 0;

    setData({ totalExpenses, totalRevenue, activeMembers, avgRevenuePerMember, breakEvenCount, netProfit, progressPct });
    setLoading(false);
  }, [profile?.gym_id, activeGymId, branches, overriding, manualCost]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const isProfitable  = (data?.netProfit ?? 0) >= 0;
  const membersNeeded = Math.max(0, (data?.breakEvenCount ?? 0) - (data?.activeMembers ?? 0));
  const statusColor   = isProfitable ? Colors.green : Colors.red;
  const monthLabel    = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) return (
    <>
      <Stack.Screen options={{ title: 'Profit Calculator' }} />
      <View style={s.loadingContainer}>
        <LottieView
          source={require('@/assets/animations/Turkey Power Walk.json')}
          autoPlay loop style={s.loadingLottie}
        />
        <Text style={s.loadingTitle}>CRUNCHING NUMBERS</Text>
        <Text style={s.loadingSubtitle}>Calculating your break-even...</Text>
      </View>
    </>
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Profit Calculator' }} />
      <ScrollView
        style={s.container}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Status hero card ── */}
        <FadeInView delay={0}>
          <View style={[s.heroCard, { borderColor: statusColor + '35' }]}>
            <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
            <LinearGradient
              colors={[statusColor + '18', 'transparent']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill} pointerEvents="none"
            />
            <View style={[s.heroAccent, { backgroundColor: statusColor }]} />

            <View style={s.heroTop}>
              <View style={s.heroLeft}>
                <View style={[s.heroIconBox, { backgroundColor: statusColor + '18', borderColor: statusColor + '35' }]}>
                  <MaterialCommunityIcons
                    name={isProfitable ? 'trending-up' : 'trending-down'}
                    size={22} color={statusColor}
                  />
                </View>
                <View>
                  <Text style={[s.heroStatus, { color: statusColor }]}>
                    {isProfitable ? 'PROFITABLE' : 'BELOW BREAK-EVEN'}
                  </Text>
                  <Text style={s.heroMonth}>{monthLabel.toUpperCase()}</Text>
                </View>
              </View>
              <View style={s.heroNetBlock}>
                <Text style={s.heroNetLabel}>NET</Text>
                <Text style={[s.heroNet, { color: statusColor }]}>
                  {(data?.netProfit ?? 0) >= 0 ? '+' : '-'}{fmt(data?.netProfit ?? 0)}
                </Text>
              </View>
            </View>

            <Text style={s.heroDesc}>
              {isProfitable
                ? `You're covering all costs. Every new member adds ~${fmt(data?.avgRevenuePerMember ?? 0)} straight to profit.`
                : `Need ${membersNeeded} more paying member${membersNeeded !== 1 ? 's' : ''} to cover this month's costs.`}
            </Text>
          </View>
        </FadeInView>

        {/* ── Break-even progress ── */}
        <FadeInView delay={70}>
          <View style={s.card}>
            <View style={s.cardHeader}>
              <View style={s.cardTitleRow}>
                <MaterialCommunityIcons name="chart-timeline-variant" size={14} color={Colors.accent} />
                <Text style={s.cardTitle}>BREAK-EVEN PROGRESS</Text>
              </View>
              <Text style={[s.progressPct, { color: isProfitable ? Colors.green : Colors.accent }]}>
                {data?.progressPct ?? 0}%
              </Text>
            </View>

            {/* Segmented bar */}
            <View style={s.barTrack}>
              <LinearGradient
                colors={isProfitable
                  ? [Colors.green, Colors.green + 'BB']
                  : [Colors.accent, Colors.orange]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={[s.barFill, { width: `${data?.progressPct ?? 0}%` as any }]}
              />
              {/* Break-even marker */}
              {!isProfitable && (data?.progressPct ?? 0) < 98 && (
                <View style={s.markerLine}>
                  <View style={s.markerDot} />
                </View>
              )}
            </View>

            <View style={s.barLegend}>
              <View style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: isProfitable ? Colors.green : Colors.accent }]} />
                <Text style={s.legendText}>{data?.activeMembers ?? 0} active members</Text>
              </View>
              <View style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: Colors.border }]} />
                <Text style={s.legendText}>{data?.breakEvenCount ?? 0} needed</Text>
              </View>
            </View>
          </View>
        </FadeInView>

        {/* ── Key numbers 2×2 ── */}
        <FadeInView delay={130}>
          <View style={s.grid}>
            {[
              { label: 'EXPENSES',        value: fmt(data?.totalExpenses ?? 0),       color: Colors.red,    icon: 'trending-down'           as const },
              { label: 'REVENUE',         value: fmt(data?.totalRevenue ?? 0),         color: Colors.green,  icon: 'trending-up'             as const },
              { label: 'ACTIVE MEMBERS',  value: String(data?.activeMembers ?? 0),    color: Colors.accent, icon: 'account-group-outline'   as const },
              { label: 'AVG / MEMBER',    value: fmt(data?.avgRevenuePerMember ?? 0), color: Colors.orange, icon: 'account-cash-outline'    as const },
            ].map((item, i) => (
              <View key={i} style={[s.statBox, { borderColor: item.color + '25' }]}>
                <LinearGradient
                  colors={[item.color + '12', 'transparent']}
                  start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                  style={StyleSheet.absoluteFill} pointerEvents="none"
                />
                <View style={[s.statTopLine, { backgroundColor: item.color }]} />
                <View style={[s.statIconBox, { backgroundColor: item.color + '18' }]}>
                  <MaterialCommunityIcons name={item.icon} size={16} color={item.color} />
                </View>
                <Text style={[s.statVal, { color: item.color }]}>{item.value}</Text>
                <Text style={s.statLbl}>{item.label}</Text>
              </View>
            ))}
          </View>
        </FadeInView>

        {/* ── Fixed cost override ── */}
        <FadeInView delay={190}>
          <View style={s.card}>
            <View style={s.cardHeader}>
              <View style={s.cardTitleRow}>
                <MaterialCommunityIcons name="tune-variant" size={14} color={Colors.accent} />
                <Text style={s.cardTitle}>FIXED COST OVERRIDE</Text>
              </View>
              {overriding && (
                <Pressable
                  onPress={() => { setManualCost(''); setOverriding(false); fetchData(); }}
                  style={s.resetPill}
                >
                  <MaterialCommunityIcons name="refresh" size={11} color={Colors.red} />
                  <Text style={s.resetPillText}>RESET</Text>
                </Pressable>
              )}
            </View>

            <Text style={s.cardSub}>
              Auto-pulled from Expenses ({fmt(data?.totalExpenses ?? 0)}).
              Override if you have unlogged costs.
            </Text>

            <View style={[s.inputRow, inputFocus && s.inputRowFocused]}>
              <MaterialCommunityIcons
                name="currency-inr" size={17}
                color={inputFocus ? Colors.accent : Colors.textMuted}
              />
              <RNTextInput
                style={s.input}
                placeholder="Enter fixed monthly cost"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
                value={manualCost}
                onChangeText={v => { setManualCost(v); setOverriding(true); }}
                onFocus={() => setInputFocus(true)}
                onBlur={() => setInputFocus(false)}
              />
            </View>

            {overriding && manualCost ? (
              <AnimatedPressable scaleDown={0.97} onPress={fetchData} style={s.recalcBtn}>
                <LinearGradient
                  colors={[Colors.accent, '#C55A00']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={s.recalcGrad}
                >
                  <MaterialCommunityIcons name="calculator-variant-outline" size={16} color="#fff" />
                  <Text style={s.recalcText}>RECALCULATE</Text>
                </LinearGradient>
              </AnimatedPressable>
            ) : null}
          </View>
        </FadeInView>

        {/* ── Insight card ── */}
        <FadeInView delay={250}>
          <View style={s.insightCard}>
            <LinearGradient
              colors={[Colors.accent + '10', 'transparent']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill} pointerEvents="none"
            />
            <View style={s.insightHeader}>
              <MaterialCommunityIcons name="lightbulb-on-outline" size={15} color={Colors.accent} />
              <Text style={s.insightTitle}>INSIGHT</Text>
            </View>
            <Text style={s.insightText}>
              {data?.breakEvenCount === 0
                ? 'Add membership plans and record payments to start seeing break-even calculations.'
                : isProfitable
                  ? `You're covering all costs with ${data?.activeMembers} active members. Every new member adds ~${fmt(data?.avgRevenuePerMember ?? 0)} straight to profit.`
                  : `You need ${membersNeeded} more paying member${membersNeeded !== 1 ? 's' : ''} to cover this month's costs. Consider running a referral drive or a limited-time offer to close the gap.`}
            </Text>

            {/* Revenue vs expense comparison strip */}
            {(data?.totalRevenue ?? 0) > 0 && (
              <View style={s.compareRow}>
                <View style={s.compareItem}>
                  <Text style={s.compareLabel}>REVENUE</Text>
                  <Text style={[s.compareVal, { color: Colors.green }]}>{fmt(data?.totalRevenue ?? 0)}</Text>
                </View>
                <View style={s.compareDivider} />
                <View style={s.compareItem}>
                  <Text style={s.compareLabel}>COSTS</Text>
                  <Text style={[s.compareVal, { color: Colors.red }]}>{fmt(data?.totalExpenses ?? 0)}</Text>
                </View>
                <View style={s.compareDivider} />
                <View style={s.compareItem}>
                  <Text style={s.compareLabel}>NET</Text>
                  <Text style={[s.compareVal, { color: statusColor }]}>
                    {(data?.netProfit ?? 0) >= 0 ? '+' : '-'}{fmt(data?.netProfit ?? 0)}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </FadeInView>

        <View style={{ height: 32 }} />
      </ScrollView>
    </>
  );
}

const s = StyleSheet.create({
  // ── Loading ─────────────────────────────────────────────────────
  loadingContainer: { flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' },
  loadingLottie:    { width: 200, height: 200 },
  loadingTitle:     { fontFamily: Fonts.condensedBold, fontSize: 16, color: Colors.text, letterSpacing: 3, marginTop: 8 },
  loadingSubtitle:  { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, marginTop: 4 },

  container: { flex: 1, backgroundColor: Colors.bg },
  scroll:    { padding: 16, gap: 12 },

  // ── Hero card ───────────────────────────────────────────────────
  heroCard: {
    borderRadius: 22, borderWidth: 1,
    overflow: 'hidden', padding: 20,
    backgroundColor: 'rgba(14,10,7,0.90)',
    gap: 12,
  },
  heroAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, borderTopLeftRadius: 22, borderBottomLeftRadius: 22 },
  heroTop:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroLeft:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroIconBox:{
    width: 46, height: 46, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1,
  },
  heroStatus:    { fontFamily: Fonts.condensedBold, fontSize: 16, letterSpacing: 1 },
  heroMonth:     { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted, marginTop: 2 },
  heroNetBlock:  { alignItems: 'flex-end' },
  heroNetLabel:  { fontFamily: Fonts.bold, fontSize: 8, color: Colors.textMuted, letterSpacing: 1.5 },
  heroNet:       { fontFamily: Fonts.condensedBold, fontSize: 30, letterSpacing: 0.5 },
  heroDesc:      { fontFamily: Fonts.regular, fontSize: 13, color: 'rgba(255,255,255,0.50)', lineHeight: 20 },

  // ── Progress card ───────────────────────────────────────────────
  card: {
    backgroundColor: Colors.bgCard, borderRadius: 18,
    borderWidth: 1, borderColor: Colors.border, padding: 18, gap: 12,
  },
  cardHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitleRow:{ flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardTitle:   { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted, letterSpacing: 1.8 },
  cardSub:     { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, lineHeight: 17, marginTop: -4 },

  progressPct: { fontFamily: Fonts.condensedBold, fontSize: 24 },
  barTrack:    { height: 10, backgroundColor: Colors.bgElevated, borderRadius: 5, overflow: 'visible' },
  barFill:     { height: '100%', borderRadius: 5 },
  markerLine:  { position: 'absolute', right: 0, top: -4, bottom: -4, width: 2, backgroundColor: Colors.text + '40', alignItems: 'center' },
  markerDot:   { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.text + '60', marginTop: -2 },
  barLegend:   { flexDirection: 'row', justifyContent: 'space-between' },
  legendItem:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot:   { width: 7, height: 7, borderRadius: 3.5 },
  legendText:  { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted },

  // ── 2×2 stat grid ───────────────────────────────────────────────
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statBox: {
    width: '47.5%', backgroundColor: Colors.bgCard,
    borderRadius: 18, borderWidth: 1,
    padding: 16, gap: 6, overflow: 'hidden',
  },
  statTopLine: { position: 'absolute', top: 0, left: 0, right: 0, height: 2.5 },
  statIconBox: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  statVal:     { fontFamily: Fonts.condensedBold, fontSize: 22, marginTop: 4 },
  statLbl:     { fontFamily: Fonts.bold, fontSize: 8, color: Colors.textMuted, letterSpacing: 1.2 },

  // ── Override field ───────────────────────────────────────────────
  resetPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.red + '14', borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.red + '30',
  },
  resetPillText: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.red, letterSpacing: 0.5 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.bgElevated,
    borderRadius: 14, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 14, paddingVertical: 13,
  },
  inputRowFocused: { borderColor: Colors.accent + '70' },
  input: { flex: 1, fontFamily: Fonts.regular, fontSize: 14, color: Colors.text, padding: 0 },
  recalcBtn:  {},
  recalcGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, paddingVertical: 13 },
  recalcText: { fontFamily: Fonts.bold, fontSize: 13, color: '#fff', letterSpacing: 1.5 },

  // ── Insight card ─────────────────────────────────────────────────
  insightCard: {
    backgroundColor: Colors.bgCard, borderRadius: 18,
    borderWidth: 1, borderColor: Colors.accent + '30',
    padding: 18, gap: 10, overflow: 'hidden',
  },
  insightHeader: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  insightTitle:  { fontFamily: Fonts.bold, fontSize: 9, color: Colors.accent, letterSpacing: 1.8 },
  insightText:   { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, lineHeight: 20 },

  compareRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgElevated, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border,
    paddingVertical: 12,
  },
  compareItem:    { flex: 1, alignItems: 'center', gap: 3 },
  compareLabel:   { fontFamily: Fonts.bold, fontSize: 8, color: Colors.textMuted, letterSpacing: 1.2 },
  compareVal:     { fontFamily: Fonts.condensedBold, fontSize: 16 },
  compareDivider: { width: 1, height: 32, backgroundColor: Colors.border },
});
