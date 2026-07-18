import { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TextInput as RNTextInput, Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useFocusEffect } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import FadeInView from '@/components/FadeInView';
import LottieView from '@/components/AppLottie';
import { toLocalDate } from '@/lib/date';

/*
 * Profit / break-even calculator.
 *
 * WHY THE OLD LOGIC WAS WRONG: it computed "revenue per member" as
 * (this month's collected payments ÷ active members). But members pay
 * quarterly/yearly, so only a fraction pay in any given month — that
 * understated each member's real monthly value and inflated the break-even
 * count, and it made "net profit" swing with payment timing rather than the
 * actual business.
 *
 * WHAT IT DOES NOW: models STEADY-STATE monthly economics.
 *   - avgFee = each active member's plan price ÷ its duration in months,
 *     averaged. That's the true recurring monthly value per member.
 *   - Monthly revenue (MRR) = activeMembers × avgFee.
 *   - Break-even members = fixedCosts ÷ avgFee.
 *   - Monthly profit = MRR − fixedCosts.
 *
 * And it's a real CALCULATOR: fixed cost and avg fee are editable levers that
 * recompute live (in JS, no DB round-trip), so an owner can model "what if I
 * charge ₹200 more?" or "what if I cut rent?".
 */

const fmt = (n: number) =>
  n >= 100000 ? `₹${(Math.abs(n) / 100000).toFixed(1)}L`
  : n >= 1000  ? `₹${(Math.abs(n) / 1000).toFixed(1)}K`
  : `₹${Math.round(Math.abs(n)).toLocaleString('en-IN')}`;

const MONTH_MS = 30;

interface Base {
  activeMembers:   number;
  autoAvgFee:      number;   // computed from plans
  autoFixedCost:   number;   // this month's expenses
  hasPlanData:     boolean;
}

export default function BreakEvenScreen() {
  const { profile, activeGymId, branches } = useAuthStore();

  const [base,    setBase]    = useState<Base | null>(null);
  const [loading, setLoading] = useState(true);

  // Editable levers (empty string = use the auto value)
  const [feeInput,  setFeeInput]  = useState('');
  const [costInput, setCostInput] = useState('');
  const [focus,     setFocus]     = useState<'fee' | 'cost' | null>(null);

  const fetchData = useCallback(async () => {
    if (!profile?.gym_id) return;
    setLoading(true);

    const mainGymId = profile.gym_id;
    const gymIds = activeGymId === 'all' ? branches.map(b => b.id) : [activeGymId ?? mainGymId];

    const now        = new Date();
    const monthStart = toLocalDate(new Date(now.getFullYear(), now.getMonth(), 1));
    const monthEnd   = toLocalDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));

    const [expRes, planRes] = await Promise.all([
      supabase.from('expenses').select('amount').in('gym_id', gymIds)
        .gte('expense_date', monthStart).lte('expense_date', monthEnd),
      // Active members' plans + the plan catalogue (price + duration) to derive
      // each member's true monthly fee. No FK embed — join in JS.
      supabase.from('member_plans').select('plan_id, membership_plans(price, duration_days)')
        .in('gym_id', gymIds).eq('status', 'active'),
    ]);

    const autoFixedCost = (expRes.data ?? []).reduce((s, e) => s + (e.amount ?? 0), 0);

    const plans = planRes.data ?? [];
    const monthlyFees: number[] = [];
    for (const mp of plans as any[]) {
      const cat = Array.isArray(mp.membership_plans) ? mp.membership_plans[0] : mp.membership_plans;
      const price = cat?.price ?? 0;
      const days  = cat?.duration_days ?? 30;
      if (price > 0 && days > 0) monthlyFees.push(price / (days / MONTH_MS));
    }
    const activeMembers = plans.length;
    const autoAvgFee = monthlyFees.length > 0
      ? Math.round(monthlyFees.reduce((s, f) => s + f, 0) / monthlyFees.length)
      : 0;

    setBase({ activeMembers, autoAvgFee, autoFixedCost, hasPlanData: monthlyFees.length > 0 });
    setLoading(false);
  }, [profile?.gym_id, activeGymId, branches]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  // ── Live-derived model (recomputes as levers change; no DB round-trip) ──────
  const m = useMemo(() => {
    const members   = base?.activeMembers ?? 0;
    const fee       = feeInput.trim()  !== '' ? Math.max(0, parseFloat(feeInput)  || 0) : (base?.autoAvgFee ?? 0);
    const fixedCost = costInput.trim() !== '' ? Math.max(0, parseFloat(costInput) || 0) : (base?.autoFixedCost ?? 0);
    const mrr        = members * fee;
    const profit     = mrr - fixedCost;
    const breakEven  = fee > 0 ? Math.ceil(fixedCost / fee) : 0;
    const needed     = Math.max(0, breakEven - members);
    const profitable = profit >= 0;
    const pct        = breakEven > 0 ? Math.min(Math.round((members / breakEven) * 100), 100) : (members > 0 ? 100 : 0);
    const feeEdited  = feeInput.trim()  !== '' && Math.round(fee) !== (base?.autoAvgFee ?? 0);
    const costEdited = costInput.trim() !== '' && Math.round(fixedCost) !== (base?.autoFixedCost ?? 0);
    return { members, fee, fixedCost, mrr, profit, breakEven, needed, profitable, pct, feeEdited, costEdited };
  }, [base, feeInput, costInput]);

  const statusColor = m.profitable ? Colors.green : Colors.red;
  const monthLabel  = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const noData      = !base || (base.activeMembers === 0 && !base.hasPlanData);
  const resetLevers = () => { setFeeInput(''); setCostInput(''); setFocus(null); };
  const edited      = m.feeEdited || m.costEdited;

  if (loading) return (
    <>
      <Stack.Screen options={{ title: 'Profit Calculator' }} />
      <View style={s.loadingContainer}>
        <LottieView source={require('@/assets/animations/Turkey Power Walk.json')} autoPlay loop style={s.loadingLottie} />
        <Text style={s.loadingTitle}>CRUNCHING NUMBERS</Text>
        <Text style={s.loadingSubtitle}>Calculating your break-even…</Text>
      </View>
    </>
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Profit Calculator' }} />
      <ScrollView style={s.container} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        {/* ── Hero: the one number that matters ── */}
        <FadeInView delay={0}>
          <View style={[s.hero, { borderColor: statusColor + '40' }]}>
            <LinearGradient colors={[statusColor + '1A', 'transparent']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} pointerEvents="none" />
            <View style={[s.heroAccent, { backgroundColor: statusColor }]} />
            <Text style={[s.heroKicker, { color: statusColor }]}>
              {noData ? 'GET STARTED' : m.profitable ? 'PROFITABLE' : 'BELOW BREAK-EVEN'} · {monthLabel.toUpperCase()}
            </Text>

            {noData ? (
              <Text style={s.heroBig}>—</Text>
            ) : m.profitable ? (
              <>
                <Text style={[s.heroBig, { color: statusColor }]}>+{fmt(m.profit)}</Text>
                <Text style={s.heroSub}>profit per month at {m.members} members</Text>
              </>
            ) : (
              <>
                <Text style={[s.heroBig, { color: statusColor }]}>{m.needed} more</Text>
                <Text style={s.heroSub}>member{m.needed !== 1 ? 's' : ''} to break even ({fmt(Math.abs(m.profit))}/mo short)</Text>
              </>
            )}

            {edited && (
              <View style={s.whatIfPill}>
                <MaterialCommunityIcons name="flask-outline" size={11} color={Colors.accent} />
                <Text style={s.whatIfText}>WHAT-IF · not your live numbers</Text>
              </View>
            )}
          </View>
        </FadeInView>

        {noData ? (
          <FadeInView delay={80}>
            <View style={s.emptyCard}>
              <View style={s.emptyIcon}><MaterialCommunityIcons name="scale-balance" size={26} color={Colors.accent} /></View>
              <Text style={s.emptyTitle}>Break-even nikaalne ke liye setup chahiye</Text>
              <Text style={s.emptyDesc}>
                Membership plans banao (price ke saath) aur members ko active plan pe rakho — phir app khud
                bata dega kitne members pe aap profit mein aa jaoge.
              </Text>
            </View>
          </FadeInView>
        ) : (
          <>
            {/* ── Break-even progress ── */}
            <FadeInView delay={70}>
              <View style={s.card}>
                <View style={s.rowBetween}>
                  <Text style={s.cardTitle}>BREAK-EVEN PROGRESS</Text>
                  <Text style={[s.pct, { color: m.profitable ? Colors.green : Colors.accent }]}>{m.pct}%</Text>
                </View>
                <View style={s.track}>
                  <LinearGradient
                    colors={m.profitable ? [Colors.green, Colors.green + 'BB'] : [Colors.accent, Colors.orange]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={[s.fill, { width: `${m.pct}%` as any }]} />
                </View>
                <View style={s.rowBetween}>
                  <Text style={s.trackLabel}>
                    <Text style={{ color: m.profitable ? Colors.green : Colors.accent, fontFamily: Fonts.bold }}>{m.members}</Text> active
                  </Text>
                  <Text style={s.trackLabel}>
                    break-even at <Text style={{ color: Colors.text, fontFamily: Fonts.bold }}>{m.breakEven}</Text>
                  </Text>
                </View>
              </View>
            </FadeInView>

            {/* ── Monthly economics ── */}
            <FadeInView delay={120}>
              <View style={s.econRow}>
                <View style={[s.econBox, { borderColor: Colors.green + '30' }]}>
                  <Text style={s.econLabel}>REVENUE / MO</Text>
                  <Text style={[s.econVal, { color: Colors.green }]}>{fmt(m.mrr)}</Text>
                  <Text style={s.econFoot}>{m.members} × {fmt(m.fee)}</Text>
                </View>
                <View style={[s.econBox, { borderColor: Colors.red + '30' }]}>
                  <Text style={s.econLabel}>COSTS / MO</Text>
                  <Text style={[s.econVal, { color: Colors.red }]}>{fmt(m.fixedCost)}</Text>
                  <Text style={s.econFoot}>{m.costEdited ? 'custom' : 'from expenses'}</Text>
                </View>
                <View style={[s.econBox, { borderColor: statusColor + '30' }]}>
                  <Text style={s.econLabel}>PROFIT / MO</Text>
                  <Text style={[s.econVal, { color: statusColor }]}>{m.profit >= 0 ? '+' : '-'}{fmt(m.profit)}</Text>
                  <Text style={s.econFoot}>{m.profitable ? 'in the green' : 'in the red'}</Text>
                </View>
              </View>
            </FadeInView>

            {/* ── The calculator: two live levers ── */}
            <FadeInView delay={170}>
              <View style={s.card}>
                <View style={s.rowBetween}>
                  <View style={s.rowTitle}>
                    <MaterialCommunityIcons name="tune-variant" size={14} color={Colors.accent} />
                    <Text style={s.cardTitle}>TRY DIFFERENT NUMBERS</Text>
                  </View>
                  {edited && (
                    <Pressable onPress={resetLevers} style={s.resetPill}>
                      <MaterialCommunityIcons name="refresh" size={11} color={Colors.accent} />
                      <Text style={s.resetText}>RESET</Text>
                    </Pressable>
                  )}
                </View>
                <Text style={s.cardSub}>Change these to model a scenario — profit updates instantly.</Text>

                <Lever
                  icon="account-cash-outline"
                  label="AVG FEE / MEMBER (MONTHLY)"
                  auto={base?.autoAvgFee ?? 0}
                  value={feeInput}
                  onChange={setFeeInput}
                  focused={focus === 'fee'}
                  onFocus={() => setFocus('fee')}
                  onBlur={() => setFocus(null)}
                  edited={m.feeEdited}
                />
                <Lever
                  icon="home-city-outline"
                  label="FIXED COSTS / MONTH"
                  auto={base?.autoFixedCost ?? 0}
                  value={costInput}
                  onChange={setCostInput}
                  focused={focus === 'cost'}
                  onFocus={() => setFocus('cost')}
                  onBlur={() => setFocus(null)}
                  edited={m.costEdited}
                />
              </View>
            </FadeInView>

            {/* ── Insight ── */}
            <FadeInView delay={220}>
              <View style={s.insight}>
                <LinearGradient colors={[Colors.accent + '10', 'transparent']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} pointerEvents="none" />
                <View style={s.rowTitle}>
                  <MaterialCommunityIcons name="lightbulb-on-outline" size={15} color={Colors.accent} />
                  <Text style={s.insightTitle}>WHAT THIS MEANS</Text>
                </View>
                <Text style={s.insightText}>
                  {m.fee <= 0
                    ? 'Set an average fee (or add plan prices) to see your break-even point.'
                    : m.profitable
                      ? `At ${m.members} members paying ~${fmt(m.fee)}/mo, you clear costs by ${fmt(m.profit)} every month. Each new member adds ${fmt(m.fee)} straight to profit.`
                      : `You're ${fmt(Math.abs(m.profit))}/mo short. ${m.needed} more member${m.needed !== 1 ? 's' : ''} at ${fmt(m.fee)} closes the gap — or raise the fee / trim costs above to see the effect.`}
                </Text>
              </View>
            </FadeInView>
          </>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </>
  );
}

// ── A single editable lever ─────────────────────────────────────────────────
function Lever({ icon, label, auto, value, onChange, focused, onFocus, onBlur, edited }: {
  icon: any; label: string; auto: number; value: string;
  onChange: (v: string) => void; focused: boolean; onFocus: () => void; onBlur: () => void; edited: boolean;
}) {
  return (
    <View style={s.leverWrap}>
      <View style={s.leverHead}>
        <Text style={s.leverLabel}>{label}</Text>
        {edited && <Text style={s.leverAuto}>auto: ₹{Math.round(auto).toLocaleString('en-IN')}</Text>}
      </View>
      <View style={[s.leverInput, focused && s.leverInputFocus, edited && s.leverInputEdited]}>
        <MaterialCommunityIcons name={icon} size={17} color={edited ? Colors.accent : Colors.textMuted} />
        <Text style={s.leverRs}>₹</Text>
        <RNTextInput
          style={s.leverField}
          value={value}
          onChangeText={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          keyboardType="numeric"
          placeholder={Math.round(auto).toLocaleString('en-IN')}
          placeholderTextColor={Colors.textMuted}
        />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll:    { padding: 16, paddingTop: 16 },

  loadingContainer: { flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center' },
  loadingLottie:    { width: 140, height: 140 },
  loadingTitle:     { fontFamily: Fonts.condensedBold, fontSize: 18, color: Colors.text, letterSpacing: 1, marginTop: 8 },
  loadingSubtitle:  { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, marginTop: 4 },

  // Hero
  hero:       { backgroundColor: Colors.bgCard, borderRadius: 20, borderWidth: 1, padding: 20, marginBottom: 14, overflow: 'hidden' },
  heroAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  heroKicker: { fontFamily: Fonts.bold, fontSize: 9, letterSpacing: 1.3 },
  heroBig:    { fontFamily: Fonts.condensedBold, fontSize: 44, color: Colors.text, marginTop: 8, lineHeight: 46 },
  heroSub:    { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  whatIfPill: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', marginTop: 12, backgroundColor: Colors.accentMuted, borderWidth: 1, borderColor: Colors.accent + '40', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  whatIfText: { fontFamily: Fonts.bold, fontSize: 8.5, color: Colors.accent, letterSpacing: 0.8 },

  // Cards
  card:      { backgroundColor: Colors.bgCard, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, padding: 16, marginBottom: 14 },
  cardTitle: { fontFamily: Fonts.bold, fontSize: 10, color: Colors.textMuted, letterSpacing: 1.4 },
  cardSub:   { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, marginTop: 6, marginBottom: 14 },
  rowBetween:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowTitle:  { flexDirection: 'row', alignItems: 'center', gap: 7 },

  // Progress
  pct:        { fontFamily: Fonts.condensedBold, fontSize: 18 },
  track:      { height: 12, borderRadius: 6, backgroundColor: Colors.bg, overflow: 'hidden', marginTop: 12, marginBottom: 10 },
  fill:       { height: '100%', borderRadius: 6 },
  trackLabel: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted },

  // Economics row
  econRow:  { flexDirection: 'row', gap: 8, marginBottom: 14 },
  econBox:  { flex: 1, backgroundColor: Colors.bgCard, borderRadius: 14, borderWidth: 1, padding: 12 },
  econLabel:{ fontFamily: Fonts.bold, fontSize: 8, color: Colors.textMuted, letterSpacing: 0.8 },
  econVal:  { fontFamily: Fonts.condensedBold, fontSize: 19, marginTop: 6 },
  econFoot: { fontFamily: Fonts.regular, fontSize: 9.5, color: Colors.textMuted, marginTop: 3 },

  // Levers
  resetPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.accentMuted, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4 },
  resetText: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.accent, letterSpacing: 0.6 },
  leverWrap:  { marginBottom: 14 },
  leverHead:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 },
  leverLabel: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted, letterSpacing: 1 },
  leverAuto:  { fontFamily: Fonts.regular, fontSize: 10, color: Colors.accent },
  leverInput:      { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.bgElevated, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  leverInputFocus: { borderColor: Colors.accent + '80' },
  leverInputEdited:{ borderColor: Colors.accent + '55', backgroundColor: Colors.accentMuted },
  leverRs:    { fontFamily: Fonts.bold, fontSize: 15, color: Colors.textMuted },
  leverField: { flex: 1, fontFamily: Fonts.condensedBold, fontSize: 18, color: Colors.text, padding: 0 },

  // Insight
  insight:      { backgroundColor: Colors.bgCard, borderRadius: 18, borderWidth: 1, borderColor: Colors.accent + '30', padding: 16, overflow: 'hidden' },
  insightTitle: { fontFamily: Fonts.bold, fontSize: 10, color: Colors.accent, letterSpacing: 1.4 },
  insightText:  { fontFamily: Fonts.regular, fontSize: 13.5, color: Colors.text, lineHeight: 21, marginTop: 10 },

  // Empty
  emptyCard:  { backgroundColor: Colors.bgCard, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, padding: 22, alignItems: 'center' },
  emptyIcon:  { width: 56, height: 56, borderRadius: 16, backgroundColor: Colors.accentMuted, borderWidth: 1, borderColor: Colors.accent + '30', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontFamily: Fonts.condensedBold, fontSize: 19, color: Colors.text, textAlign: 'center' },
  emptyDesc:  { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, marginTop: 8, textAlign: 'center', lineHeight: 20 },
});
