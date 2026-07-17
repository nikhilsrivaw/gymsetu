import { toLocalDate } from '@/lib/date';
  import { useState, useCallback } from 'react';
  import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
  import { Stack, useFocusEffect } from 'expo-router';
  import { Colors } from '@/constants/colors';
  import { Fonts } from '@/constants/fonts';
  import { supabase } from '@/lib/supabase';
  import { useAuthStore } from '@/store/authStore';
  import FadeInView from '@/components/FadeInView';
  import InteractiveBarChart from '@/components/reports/InteractiveBarChart';
  import StatCard from '@/components/reports/StatCard';
  import { askAI } from '@/lib/ai';

  // Categorical palette, fixed per payment method (never cycled). Validated
  // colorblind-safe on the dark surface via the dataviz palette validator.
  const METHOD_COLORS: Record<string, string> = {
    cash:          '#3987e5',  // blue
    upi:           '#008300',  // green
    card:          '#d55181',  // magenta
    bank_transfer: '#c98500',  // yellow
    other:         '#199e70',  // aqua
  };

  const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  interface RevenueData {
    monthlyBars:     { label: string; value: number }[];
    methodBreakdown: { label: string; value: number; color: string }[];
    totalCollected:  number;
    txCount:         number;
    avgTx:           number;
  }

  export default function ReportsRevenueScreen() {
    const { profile, activeGymId, branches, subscription } = useAuthStore();
    const isPro = !!subscription?.plan && subscription.plan !== 'basic' &&
      (subscription?.status === 'trial' || subscription?.status === 'active');
    const [data, setData]           = useState<RevenueData | null>(null);
    const [loading, setLoading]     = useState(true);
    const [aiSummary, setAiSummary] = useState<string | null>(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [period, setPeriod]       = useState<6 | 12>(6);  // months shown
    const [selMonth, setSelMonth]   = useState(-1);          // selected bar (-1 = latest)

    const fetchData = useCallback(async () => {
      const mainGymId = (profile as any)?.gym_id;
      if (!mainGymId) return;
      setLoading(true);

      let gymIds: string[];
      if (activeGymId === 'all') {
        gymIds = branches.length > 0 ? branches.map(b => b.id) : [mainGymId];
      } else {
        gymIds = [activeGymId ?? mainGymId];
      }

      const now         = new Date();
      const periodStart = toLocalDate(new Date(now.getFullYear(), now.getMonth() - (period - 1), 1));

      const { data: payments } = await supabase
        .from('payments')
        .select('amount, payment_date, payment_method')
        .in('gym_id', gymIds)
        .gte('payment_date', periodStart)
        .order('payment_date');

      if (!payments) { setLoading(false); return; }

      const monthMap: Record<string, number> = {};
      for (let i = period - 1; i >= 0; i--) {
        const d   = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthMap[key] = 0;
      }
      payments.forEach(p => {
        const key = p.payment_date.slice(0, 7);
        if (key in monthMap) monthMap[key] += p.amount;
      });
      const monthlyBars = Object.entries(monthMap).map(([key, val]) => ({
        label: MONTH_NAMES[parseInt(key.split('-')[1]) - 1],
        value: Math.round(val),
      }));

      const methodMap: Record<string, number> = {};
      payments.forEach(p => {
        methodMap[p.payment_method] = (methodMap[p.payment_method] || 0) + p.amount;
      });
      const methodBreakdown = Object.entries(methodMap)
        .map(([method, total]) => ({
          label: method.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()),
          value: Math.round(total),
          color: METHOD_COLORS[method] || Colors.accent,
        }))
        .sort((a, b) => b.value - a.value);

      const totalCollected = payments.reduce((s, p) => s + p.amount, 0);

      setData({
        monthlyBars,
        methodBreakdown,
        totalCollected,
        txCount: payments.length,
        avgTx:   payments.length > 0 ? Math.round(totalCollected / payments.length) : 0,
      });
      setSelMonth(-1);   // reset selection to the latest month
      setLoading(false);
    }, [activeGymId, branches, period]);

    useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

    const handleAISummary = async () => {
      if (!data) return;
      const bars         = data.monthlyBars;
      const monthRevenue = bars[bars.length - 1]?.value ?? 0;
      const lastMonthRev = bars[bars.length - 2]?.value ?? 0;
      const topMethod    = data.methodBreakdown[0]?.label ?? 'cash';

      setAiLoading(true);
      setAiSummary(null);
      try {
        const text = await askAI('revenue_summary', {
          monthRevenue,
          lastMonthRevenue: lastMonthRev,
          transactions:     data.txCount,
          topMethod,
        });
        setAiSummary(text);
      } catch {
        Alert.alert('Error', 'Could not generate summary');
      }
      setAiLoading(false);
    };

    const fmt = (n: number) =>
      n >= 100000 ? `₹${(n / 100000).toFixed(1)}L`
      : n >= 1000  ? `₹${(n / 1000).toFixed(1)}K`
      : `₹${n}`;

    if (loading) return (
      <>
        <Stack.Screen options={{ title: 'Revenue Analytics' }} />
        <View style={styles.center}><ActivityIndicator color={Colors.accent} size="large" /></View>
      </>
    );

    const methodTotal = data?.methodBreakdown.reduce((s, m) => s + m.value, 0) || 1;

    // ── Derived values for the interactive chart + month-over-month card ──────
    const bars     = data?.monthlyBars ?? [];
    const selIdx   = selMonth < 0 ? bars.length - 1 : Math.min(selMonth, bars.length - 1);
    const selBar   = bars[selIdx];
    const selPrev  = bars[selIdx - 1];
    const selPct   = selBar && selPrev && selPrev.value > 0
      ? Math.round(((selBar.value - selPrev.value) / selPrev.value) * 100) : null;
    const curVal   = bars[bars.length - 1]?.value ?? 0;
    const prevVal  = bars[bars.length - 2]?.value ?? 0;
    const momPct   = prevVal > 0 ? Math.round(((curVal - prevVal) / prevVal) * 100) : null;
    const bestBar  = bars.length ? bars.reduce((a, b) => (b.value > a.value ? b : a), bars[0]) : null;

    return (
      <>
        <Stack.Screen options={{ title: 'Revenue Analytics' }} />
        <ScrollView style={styles.container} contentContainerStyle={styles.scroll}
  showsVerticalScrollIndicator={false}>

          <FadeInView delay={0}>
            <View style={styles.statRow}>
              <StatCard emoji="💰" label="TOTAL (6 MO)" value={fmt(data?.totalCollected ?? 0)} color={Colors.green}  
  />
              <StatCard emoji="🔁" label="TRANSACTIONS" value={(data?.txCount ?? 0).toString()} color={Colors.accent}
   />
              <StatCard emoji="📈" label="AVG / TXN"    value={fmt(data?.avgTx ?? 0)}           color="#4F6EF7"      
   />
            </View>
          </FadeInView>

          <FadeInView delay={60}>
            <View style={styles.aiCard}>
              <View style={styles.aiCardHead}>
                <View style={styles.aiCardLeft}>
                  <Text style={styles.aiCardIcon}>🤖</Text>
                  <Text style={styles.aiCardLabel}>AI REVENUE SUMMARY</Text>
                </View>
                {isPro ? (
                  <TouchableOpacity style={styles.aiBtn} onPress={handleAISummary} disabled={aiLoading}>
                    {aiLoading
                      ? <ActivityIndicator size="small" color={Colors.green} />
                      : <Text style={styles.aiBtnText}>✨ Summarise</Text>
                    }
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.aiLockedBtn}
                    onPress={() => Alert.alert('⚡ Pro Feature', 'AI revenue summaries require the Pro plan.\n\nUpgrade at gymsetu.it.com/pricing', [{ text: 'OK' }])}
                  >
                    <Text style={styles.aiLockedBtnText}>🔒 PRO</Text>
                  </TouchableOpacity>
                )}
              </View>
              {aiSummary ? (
                <Text style={styles.aiSummaryText}>{aiSummary}</Text>
              ) : (
                <Text style={styles.aiPlaceholder}>
                  {isPro ? 'Tap Summarise for an AI analysis of your revenue trends' : 'Upgrade to Pro to unlock AI revenue summaries'}
                </Text>    
              )}
            </View>
          </FadeInView>

          {/* Month-over-month headline */}
          <FadeInView delay={90}>
            <View style={styles.momCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.momLabel}>THIS MONTH</Text>
                <Text style={styles.momValue}>{fmt(curVal)}</Text>
              </View>
              <View style={styles.momDivider} />
              <View style={styles.momRight}>
                <Text style={styles.momLabel}>VS LAST MONTH</Text>
                {momPct === null ? (
                  <Text style={styles.momNeutral}>—</Text>
                ) : (
                  <Text style={[styles.momPct, { color: momPct >= 0 ? Colors.green : Colors.red }]}>
                    {momPct >= 0 ? '▲' : '▼'} {Math.abs(momPct)}%
                  </Text>
                )}
              </View>
            </View>
          </FadeInView>

          {/* Interactive monthly revenue chart */}
          <FadeInView delay={130}>
            <View style={styles.card}>
              <View style={styles.cardHeadRow}>
                <View>
                  <Text style={styles.cardTitle}>MONTHLY REVENUE</Text>
                  <Text style={styles.cardSub}>Tap a bar to see the month</Text>
                </View>
                <View style={styles.periodToggle}>
                  {([6, 12] as const).map(p => (
                    <TouchableOpacity
                      key={p}
                      style={[styles.periodChip, period === p && styles.periodChipOn]}
                      onPress={() => setPeriod(p)}
                    >
                      <Text style={[styles.periodChipText, period === p && styles.periodChipTextOn]}>{p}M</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Selected-month detail strip */}
              {selBar && (
                <View style={styles.detailStrip}>
                  <Text style={styles.detailMonth}>{selBar.label}</Text>
                  <Text style={styles.detailValue}>{fmt(selBar.value)}</Text>
                  {selPct !== null && (
                    <Text style={[styles.detailPct, { color: selPct >= 0 ? Colors.green : Colors.red }]}>
                      {selPct >= 0 ? '▲' : '▼'} {Math.abs(selPct)}% MoM
                    </Text>
                  )}
                </View>
              )}

              {bars.length > 0 && (
                <InteractiveBarChart
                  data={bars}
                  color={Colors.green}
                  height={130}
                  selected={selIdx}
                  onSelect={setSelMonth}
                  formatValue={v => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : `${v}`}
                />
              )}

              {bestBar && bestBar.value > 0 && (
                <Text style={styles.bestNote}>🏆 Best month: {bestBar.label} · {fmt(bestBar.value)}</Text>
              )}
            </View>
          </FadeInView>

          <FadeInView delay={200}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>PAYMENT METHODS</Text>
              <Text style={styles.cardSub}>Share of collections ({period}M)</Text>

              {/* Stacked proportion bar — 2px surface gaps between segments */}
              {data && data.methodBreakdown.length > 0 && (
                <View style={styles.stackBar}>
                  {data.methodBreakdown.map(m => (
                    <View key={m.label} style={{ flex: m.value, backgroundColor: m.color }} />
                  ))}
                </View>
              )}

              {/* Legend — colour dot + method + % + ₹ (identity never colour-alone) */}
              <View style={styles.legend}>
                {data?.methodBreakdown.map(m => (
                  <View key={m.label} style={styles.legendRow}>
                    <View style={[styles.legendDot, { backgroundColor: m.color }]} />
                    <Text style={styles.legendLabel}>{m.label}</Text>
                    <Text style={styles.legendPct}>{Math.round((m.value / methodTotal) * 100)}%</Text>
                    <Text style={styles.legendVal}>{fmt(m.value)}</Text>
                  </View>
                ))}
              </View>
            </View>
          </FadeInView>

          <View style={{ height: 32 }} />
        </ScrollView>
      </>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    scroll:    { paddingHorizontal: 16, paddingTop: 16 },
    center:    { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg },

    statRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },

    aiCard:       { backgroundColor: Colors.bgCard, borderRadius: 18, borderWidth: 1, borderColor: Colors.green +    
  '30', padding: 16, marginBottom: 14 },
    aiCardHead:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }, 
    aiCardLeft:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
    aiCardIcon:   { fontSize: 16 },
    aiCardLabel:  { fontFamily: Fonts.bold, fontSize: 9, color: Colors.green, letterSpacing: 1.5 },
    aiBtn:        { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: Colors.green + '15', borderRadius: 8,
   borderWidth: 1, borderColor: Colors.green + '40' },
    aiBtnText:       { fontFamily: Fonts.bold, fontSize: 11, color: Colors.green },
    aiLockedBtn:     { paddingHorizontal: 12, paddingVertical: 7, backgroundColor: Colors.accent + '15', borderRadius: 10, borderWidth: 1, borderColor: Colors.accent + '30' },
    aiLockedBtnText: { fontFamily: Fonts.bold, fontSize: 11, color: Colors.accent },
    aiSummaryText:{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.text, lineHeight: 19 },
    aiPlaceholder:{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, lineHeight: 18 },

    card:      { backgroundColor: Colors.bgCard, borderRadius: 18, borderWidth: 1, borderColor: Colors.border,       
  padding: 18, marginBottom: 14 },
    cardTitle: { fontFamily: Fonts.bold, fontSize: 10, color: Colors.textMuted, letterSpacing: 1.5, marginBottom: 2  
  },
    cardSub:   { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginBottom: 14 },

    // Month-over-month headline card
    momCard:    { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgCard, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, padding: 18, marginBottom: 14 },
    momLabel:   { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted, letterSpacing: 1.4, marginBottom: 5 },
    momValue:   { fontFamily: Fonts.condensedBold, fontSize: 28, color: Colors.text },
    momDivider: { width: 1, alignSelf: 'stretch', backgroundColor: Colors.border, marginHorizontal: 16 },
    momRight:   { alignItems: 'flex-end' },
    momPct:     { fontFamily: Fonts.condensedBold, fontSize: 24 },
    momNeutral: { fontFamily: Fonts.condensedBold, fontSize: 24, color: Colors.textMuted },

    // Period toggle
    cardHeadRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
    periodToggle:     { flexDirection: 'row', backgroundColor: Colors.bg, borderRadius: 10, padding: 3, gap: 2 },
    periodChip:       { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    periodChipOn:     { backgroundColor: Colors.green + '22' },
    periodChipText:   { fontFamily: Fonts.bold, fontSize: 11, color: Colors.textMuted },
    periodChipTextOn: { color: Colors.green },

    // Selected-month detail strip
    detailStrip:  { flexDirection: 'row', alignItems: 'baseline', gap: 10, marginBottom: 14, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
    detailMonth:  { fontFamily: Fonts.bold, fontSize: 12, color: Colors.textMuted, letterSpacing: 1 },
    detailValue:  { fontFamily: Fonts.condensedBold, fontSize: 22, color: Colors.text },
    detailPct:    { fontFamily: Fonts.bold, fontSize: 12 },
    bestNote:     { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, marginTop: 14 },

    // Payment-method stacked bar + legend
    stackBar:    { flexDirection: 'row', height: 24, borderRadius: 7, overflow: 'hidden', gap: 2, marginBottom: 16, backgroundColor: Colors.bg },
    legend:      { gap: 10 },
    legendRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
    legendDot:   { width: 11, height: 11, borderRadius: 3 },
    legendLabel: { flex: 1, fontFamily: Fonts.regular, fontSize: 13, color: Colors.text },
    legendPct:   { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textMuted, width: 44, textAlign: 'right' },
    legendVal:   { fontFamily: Fonts.bold, fontSize: 13, color: Colors.text, width: 74, textAlign: 'right' },
  });