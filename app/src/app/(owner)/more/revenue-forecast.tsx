 
  import { useState, useCallback } from 'react';                                                                       
  import { View, Text, StyleSheet, ScrollView } from 'react-native';                                                     import { Stack, useFocusEffect } from 'expo-router';                                                                 
  import { MaterialCommunityIcons } from '@expo/vector-icons';                                                         
  import LottieView from '@/components/AppLottie';
  import { Colors } from '@/constants/colors';
  import { Fonts } from '@/constants/fonts';
  import { supabase } from '@/lib/supabase';
  import { useAuthStore } from '@/store/authStore';
  import FadeInView from '@/components/FadeInView';
  import BarChart from '@/components/reports/BarChart';

  type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

  interface MonthRevenue {
    label:    string;
    value:    number;
    forecast: boolean;
  }

  interface ForecastData {
    chartData:      MonthRevenue[];
    last3Avg:       number;
    trend:          'growing' | 'declining' | 'stable';
    trendPct:       number;
    activeMembers:  number;
    expiringNext30: number;
    renewalRate:    number;
    forecast1:      number;
    forecast2:      number;
    forecast3:      number;
  }

  function getMonthLabel(offset: number): string {
    const d = new Date();
    d.setMonth(d.getMonth() + offset);
    return d.toLocaleString('en-IN', { month: 'short', year: '2-digit' });
  }

  export default function RevenueForecastScreen() {
    const { profile, activeGymId, branches } = useAuthStore();
    const [data,    setData]    = useState<ForecastData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
      if (!profile?.gym_id) return;
      setLoading(true);

      const mainGymId = profile.gym_id;
      const gymIds = activeGymId === 'all'
        ? branches.map(b => b.id)
        : [activeGymId ?? mainGymId];

      const now = new Date();

      const monthRanges: { label: string; start: string; end: string }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d     = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const start = d.toISOString().split('T')[0];
        const end   = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
        monthRanges.push({
          label: d.toLocaleString('en-IN', { month: 'short', year: '2-digit' }),
          start, end,
        });
      }

      const { data: payData } = await supabase
        .from('payments')
        .select('amount, payment_date')
        .in('gym_id', gymIds)
        .gte('payment_date', monthRanges[0].start)
        .lte('payment_date', monthRanges[5].end);

      const { data: activePlans } = await supabase
        .from('member_plans')
        .select('member_id, end_date')
        .in('gym_id', gymIds)
        .eq('status', 'active');

      const { data: allPlans } = await supabase
        .from('member_plans')
        .select('member_id')
        .in('gym_id', gymIds);

      const monthlyRevenue: number[] = monthRanges.map(range =>
        (payData ?? [])
          .filter(p => p.payment_date >= range.start && p.payment_date <= range.end)
          .reduce((s, p) => s + (p.amount ?? 0), 0)
      );

      const activeMembers  = (activePlans ?? []).length;
      const day30Fwd       = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
      const today          = now.toISOString().split('T')[0];
      const expiringNext30 = (activePlans ?? []).filter(p => p.end_date >= today && p.end_date <= day30Fwd).length;    

      const planCountMap: Record<string, number> = {};
      (allPlans ?? []).forEach(p => { planCountMap[p.member_id] = (planCountMap[p.member_id] || 0) + 1; });
      const totalWithPlans = Object.keys(planCountMap).length;
      const renewedCount   = Object.values(planCountMap).filter(c => c >= 2).length;
      const renewalRate    = totalWithPlans > 0 ? Math.round((renewedCount / totalWithPlans) * 100) : 70;

      const recent3   = monthlyRevenue.slice(3).reduce((s, v) => s + v, 0);
      const previous3 = monthlyRevenue.slice(0, 3).reduce((s, v) => s + v, 0);
      const last3Avg  = Math.round(recent3 / 3);

      let trend: ForecastData['trend'] = 'stable';
      let trendPct = 0;
      if (previous3 > 0) {
        trendPct = Math.round(((recent3 - previous3) / previous3) * 100);
        if (trendPct > 5)       trend = 'growing';
        else if (trendPct < -5) trend = 'declining';
      }

      const trendFactor = 1 + (trendPct / 100) * 0.4;
      const forecast1   = Math.round(last3Avg * trendFactor);
      const forecast2   = Math.round(forecast1 * trendFactor);
      const forecast3   = Math.round(forecast2 * trendFactor);

      const chartData: MonthRevenue[] = [
        ...monthRanges.map((r, i) => ({ label: r.label, value: monthlyRevenue[i], forecast: false })),
        { label: getMonthLabel(1), value: forecast1, forecast: true },
        { label: getMonthLabel(2), value: forecast2, forecast: true },
        { label: getMonthLabel(3), value: forecast3, forecast: true },
      ];

      setData({ chartData, last3Avg, trend, trendPct, activeMembers, expiringNext30, renewalRate, forecast1, forecast2,
   forecast3 });
      setLoading(false);
    }, [profile?.gym_id, activeGymId, branches]);

    useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

    // ── Loading ──────────────────────────────────────────────────────
    if (loading) {
      return (
        <>
          <Stack.Screen options={{ title: '', headerStyle: { backgroundColor: '#0a0a0a' }, headerTintColor: '#fff' }}  
  />
          <View style={s.loadingContainer}>
            <LottieView
              source={require('@/assets/animations/Turkey Power Walk.json')}
              autoPlay loop style={s.loadingLottie}
            />
            <Text style={s.loadingTitle}>LOADING FORECAST</Text>
            <Text style={s.loadingSub}>Analysing revenue trends...</Text>
          </View>
        </>
      );
    }

    const trendColor = data?.trend === 'growing' ? '#22c55e' : data?.trend === 'declining' ? '#ef4444' : '#f97316';    
    const trendIcon: IconName  = data?.trend === 'growing' ? 'trending-up' : data?.trend === 'declining' ?
  'trending-down' : 'trending-neutral';
    const trendLabel = data?.trend === 'growing' ? 'REVENUE GROWING' : data?.trend === 'declining' ? 'REVENUE DECLINING' : 'REVENUE STABLE';

    const factorRows: { label: string; value: string; color: string; icon: IconName }[] = [
      { label: 'Active Members',          value: (data?.activeMembers  ?? 0).toString(), color: '#22c55e', icon:       
  'account-check-outline'  },
      { label: 'Expiring in 30 Days',     value: (data?.expiringNext30 ?? 0).toString(), color: '#f97316', icon:       
  'clock-alert-outline'    },
      { label: 'Historical Renewal Rate', value: `${data?.renewalRate ?? 0}%`,           color: Colors.accent, icon:   
  'refresh'             },
      { label: '3-Month Avg Revenue',     value: `₹${(data?.last3Avg ?? 0).toLocaleString('en-IN')}`, color: '#A78BFA',
   icon: 'chart-bar' },
    ];

    return (
      <>
        <Stack.Screen options={{ title: '', headerStyle: { backgroundColor: '#0a0a0a' }, headerTintColor: '#fff' }} /> 
        <ScrollView style={s.container} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Lottie Banner ── */}
          <FadeInView delay={0}>
            <View style={s.lottieBanner}>
              <View style={s.lottieBannerLeft}>
                <Text style={s.lottieBannerMicro}>AI-POWERED</Text>
                <Text style={s.lottieBannerTitle}>REVENUE{'\n'}FORECAST</Text>
                <Text style={s.lottieBannerSub}>Based on last 6 months</Text>
              </View>
              <LottieView
                source={require('@/assets/animations/forecast.json')}
                autoPlay loop
                style={s.lottieAnim}
              />
            </View>
          </FadeInView>

          {/* ── Trend Banner ── */}
          <FadeInView delay={40}>
            <View style={[s.trendBanner, { borderColor: trendColor + '40', backgroundColor: trendColor + '08' }]}>     
              <View style={[s.trendIconWrap, { backgroundColor: trendColor + '18' }]}>
                <MaterialCommunityIcons name={trendIcon} size={24} color={trendColor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.trendTitle, { color: trendColor }]}>{trendLabel}</Text>
                <Text style={s.trendSub}>
                  {Math.abs(data?.trendPct ?? 0)}%
                  {data?.trend === 'growing' ? ' increase' : data?.trend === 'declining' ? ' decrease' : ' change'}    
                  {' '}vs previous 3 months
                </Text>
              </View>
              <Text style={[s.trendPct, { color: trendColor }]}>
                {(data?.trendPct ?? 0) > 0 ? '+' : ''}{data?.trendPct ?? 0}%
              </Text>
            </View>
          </FadeInView>

          {/* ── Chart ── */}
          <FadeInView delay={80}>
            <Text style={s.sectionLabel}>HISTORY + FORECAST</Text>
            <View style={s.card}>
              <View style={s.legendRow}>
                <View style={s.legendItem}>
                  <View style={[s.legendDot, { backgroundColor: Colors.accent }]} />
                  <Text style={s.legendText}>ACTUAL</Text>
                </View>
                <View style={s.legendItem}>
                  <View style={[s.legendDot, { backgroundColor: Colors.accent + '50' }]} />
                  <Text style={s.legendText}>FORECASTED</Text>
                </View>
              </View>
              <BarChart
                data={(data?.chartData ?? []).map(d => ({
                  label: d.label,
                  value: d.value,
                  color: d.forecast ? Colors.accent + '55' : Colors.accent,
                }))}
                maxHeight={100}
                barColor={Colors.accent}
              />
            </View>
          </FadeInView>

          {/* ── 3-Month Forecast ── */}
          <FadeInView delay={120}>
            <Text style={s.sectionLabel}>3-MONTH FORECAST</Text>
            <View style={s.forecastRow}>
              {[
                { month: getMonthLabel(1), val: data?.forecast1 ?? 0, conf: 'HIGH',   opacity: 1.0 },
                { month: getMonthLabel(2), val: data?.forecast2 ?? 0, conf: 'MEDIUM', opacity: 0.75 },
                { month: getMonthLabel(3), val: data?.forecast3 ?? 0, conf: 'LOW',    opacity: 0.55 },
              ].map((f, i) => (
                <View key={i} style={[s.forecastBox, { opacity: f.opacity }]}>
                  <Text style={s.forecastMonth}>{f.month}</Text>
                  <Text style={s.forecastVal}>₹{f.val >= 1000 ? (f.val / 1000).toFixed(1) + 'K' : f.val}</Text>        
                  <View style={[s.confBadge, { backgroundColor: Colors.accent + '15' }]}>
                    <Text style={s.confText}>{f.conf}</Text>
                  </View>
                </View>
              ))}
            </View>
          </FadeInView>

          {/* ── Forecast Factors ── */}
          <FadeInView delay={160}>
            <Text style={s.sectionLabel}>FORECAST FACTORS</Text>
            <View style={s.card}>
              {factorRows.map((row, i) => (
                <View key={row.label} style={[s.factorRow, i < factorRows.length - 1 && s.rowBorder]}>
                  <View style={[s.factorIconWrap, { backgroundColor: row.color + '12' }]}>
                    <MaterialCommunityIcons name={row.icon} size={18} color={row.color} />
                  </View>
                  <Text style={s.factorLabel}>{row.label}</Text>
                  <Text style={[s.factorVal, { color: row.color }]}>{row.value}</Text>
                </View>
              ))}
            </View>
          </FadeInView>

          {/* ── Disclaimer ── */}
          <FadeInView delay={200}>
            <Text style={s.disclaimer}>
              Forecast is based on historical payment data and renewal patterns. Actual results may vary.
            </Text>
          </FadeInView>

          <View style={{ height: 40 }} />
        </ScrollView>
      </>
    );
  }

  const s = StyleSheet.create({
    // Loading
    loadingContainer: { flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center' },
    loadingLottie:    { width: 200, height: 200 },
    loadingTitle:     { fontFamily: Fonts.condensedBold, fontSize: 20, color: '#fff', letterSpacing: 4, marginTop: 8 },
    loadingSub:       { fontFamily: Fonts.regular, fontSize: 14, color: '#444', marginTop: 6 },

    // Layout
    container: { flex: 1, backgroundColor: '#0a0a0a' },
    scroll:    { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 },

    // Lottie Banner
    lottieBanner: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: '#141414', borderRadius: 20,
      paddingLeft: 20, paddingVertical: 20,
      borderWidth: 1, borderColor: Colors.accent + '25',
      marginBottom: 14, overflow: 'hidden',
    },
    lottieBannerLeft:  { flex: 1 },
    lottieBannerMicro: { fontFamily: Fonts.bold, fontSize: 10, color: Colors.accent, letterSpacing: 2 },
    lottieBannerTitle: { fontFamily: Fonts.condensedBold, fontSize: 30, color: '#fff', letterSpacing: 0.5, marginTop:  
  6, lineHeight: 34 },
    lottieBannerSub:   { fontFamily: Fonts.regular, fontSize: 13, color: '#555', marginTop: 8 },
    lottieAnim:        { width: 180, height: 180 },

    // Trend Banner
    trendBanner:   { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 18, borderWidth: 1, padding:   
  18, marginBottom: 20 },
    trendIconWrap: { width: 50, height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },        
    trendTitle:    { fontFamily: Fonts.bold, fontSize: 14, letterSpacing: 0.5 },
    trendSub:      { fontFamily: Fonts.regular, fontSize: 13, color: '#666', marginTop: 3 },
    trendPct:      { fontFamily: Fonts.condensedBold, fontSize: 32 },

    // Section label
    sectionLabel: { fontFamily: Fonts.bold, fontSize: 10, color: '#444', letterSpacing: 2, marginBottom: 12 },

    // Card
    card:      { backgroundColor: '#141414', borderRadius: 18, borderWidth: 1, borderColor: '#1e1e1e', overflow:       
  'hidden', marginBottom: 24 },
    rowBorder: { borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },

    // Legend
    legendRow:  { flexDirection: 'row', gap: 16, paddingHorizontal: 18, paddingTop: 16, paddingBottom: 8 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot:  { width: 8, height: 8, borderRadius: 4 },
    legendText: { fontFamily: Fonts.bold, fontSize: 9, color: '#555', letterSpacing: 1 },

    // Forecast boxes
    forecastRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
    forecastBox: {
      flex: 1, backgroundColor: '#141414', borderRadius: 18,
      borderWidth: 1, borderColor: Colors.accent + '30',
      padding: 16, alignItems: 'center', gap: 8,
    },
    forecastMonth: { fontFamily: Fonts.bold, fontSize: 10, color: '#555', letterSpacing: 1 },
    forecastVal:   { fontFamily: Fonts.condensedBold, fontSize: 22, color: Colors.accent },
    confBadge:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    confText:      { fontFamily: Fonts.bold, fontSize: 8, color: Colors.accent, letterSpacing: 1 },

    // Factor rows
    factorRow:     { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingVertical: 16 },
    factorIconWrap:{ width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },        
    factorLabel:   { fontFamily: Fonts.bold, fontSize: 13, color: '#888', flex: 1 },
    factorVal:     { fontFamily: Fonts.condensedBold, fontSize: 24 },

    // Disclaimer
    disclaimer: { fontFamily: Fonts.regular, fontSize: 12, color: '#333', textAlign: 'center', paddingHorizontal: 20,  
  lineHeight: 18, marginBottom: 8 },
  });
