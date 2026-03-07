 import { useState, useCallback } from 'react';                                       import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from                'react-native';                                                                      import { Stack, useFocusEffect } from 'expo-router';                                 import { Colors } from '@/constants/colors';                                         import { Fonts } from '@/constants/fonts';                                           import { supabase } from '@/lib/supabase';                                           import { useAuthStore } from '@/store/authStore';                                  
  import FadeInView from '@/components/FadeInView';                                    import BarChart from '@/components/reports/BarChart';                              
  import HorizontalBar from '@/components/reports/HorizontalBar';                      import StatCard from '@/components/reports/StatCard';                              
                                                                                     
  const METHOD_COLORS: Record<string, string> = {                                    
    cash:          Colors.green,
    upi:           '#4F6EF7',
    card:          Colors.orange,
    bank_transfer: Colors.accent,
    other:         Colors.textMuted,
  };

  const MONTH_NAMES =
  ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  interface RevenueData {
    monthlyBars:     { label: string; value: number }[];
    methodBreakdown: { label: string; value: number; color: string }[];
    totalCollected:  number;
    txCount:         number;
    avgTx:           number;
  }

  export default function ReportsRevenueScreen() {
    const { profile } = useAuthStore();
    const [data, setData]       = useState<RevenueData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
      if (!profile?.gym_id) return;
      setLoading(true);

      const now         = new Date();
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)        
        .toISOString().split('T')[0];

      const { data: payments } = await supabase
        .from('payments')
        .select('amount, payment_date, payment_method')
        .eq('gym_id', profile.gym_id)
        .gte('payment_date', sixMonthsAgo)
        .order('payment_date');

      if (!payments) { setLoading(false); return; }

      // Build monthly bars (last 6 months)
      const monthMap: Record<string, number> = {};
      for (let i = 5; i >= 0; i--) {
        const d   = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,       
  '0')}`;
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

      // Payment method breakdown
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
        avgTx:   payments.length > 0 ? Math.round(totalCollected / payments.length) :
   0,
      });
      setLoading(false);
    }, [profile?.gym_id]);

    useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

    const fmt = (n: number) =>
      n >= 100000 ? `₹${(n / 100000).toFixed(1)}L`
      : n >= 1000  ? `₹${(n / 1000).toFixed(1)}K`
      : `₹${n}`;

    if (loading) return (
      <>
        <Stack.Screen options={{ title: 'Revenue Analytics' }} />
        <View style={styles.center}><ActivityIndicator color={Colors.accent}
  size="large" /></View>
      </>
    );

    const methodTotal = data?.methodBreakdown.reduce((s, m) => s + m.value, 0) || 1; 

    return (
      <>
        <Stack.Screen options={{ title: 'Revenue Analytics' }} />
        <ScrollView style={styles.container} contentContainerStyle={styles.scroll}   
  showsVerticalScrollIndicator={false}>

          <FadeInView delay={0}>
            <View style={styles.statRow}>
              <StatCard emoji="💰" label="TOTAL (6 MO)"
  value={fmt(data?.totalCollected ?? 0)} color={Colors.green}  />
              <StatCard emoji="🔁" label="TRANSACTIONS"   value={(data?.txCount ??   
  0).toString()} color={Colors.accent} />
              <StatCard emoji="📈" label="AVG / TXN"      value={fmt(data?.avgTx ??  
  0)}           color="#4F6EF7"       />
            </View>
          </FadeInView>

          <FadeInView delay={100}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>MONTHLY REVENUE</Text>
              <Text style={styles.cardSub}>Last 6 months</Text>
              {data?.monthlyBars && (
                <BarChart
                  data={data.monthlyBars.map(b => ({ ...b, color: Colors.green }))}  
                  maxHeight={110}
                  barColor={Colors.green}
                  formatValue={v => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : `${v}`}
                />
              )}
            </View>
          </FadeInView>

          <FadeInView delay={200}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>PAYMENT METHODS</Text>
              <Text style={styles.cardSub}>By collection amount</Text>
              <View style={styles.barsGap}>
                {data?.methodBreakdown.map(m => (
                  <HorizontalBar
                    key={m.label}
                    label={m.label}
                    value={m.value}
                    total={methodTotal}
                    color={m.color}
                    formatValue={fmt}
                  />
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
    center:    { flex: 1, justifyContent: 'center', alignItems: 'center',
  backgroundColor: Colors.bg },

    statRow:   { flexDirection: 'row', gap: 8, marginBottom: 14 },
    card:      { backgroundColor: Colors.bgCard, borderRadius: 18, borderWidth: 1,   
  borderColor: Colors.border, padding: 18, marginBottom: 14 },
    cardTitle: { fontFamily: Fonts.bold, fontSize: 10, color: Colors.textMuted,      
  letterSpacing: 1.5 },
    cardSub:   { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted,   
  marginTop: 2, marginBottom: 14 },
    barsGap:   { gap: 14 },
  });
