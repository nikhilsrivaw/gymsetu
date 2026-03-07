 import { useState, useCallback } from 'react';                                       import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from         'react-native';                                                                      import { useFocusEffect } from 'expo-router';                                        import { Colors } from '@/constants/colors';                                         import { Fonts } from '@/constants/fonts';                                           import FadeInView from '@/components/FadeInView';                                    import AnimatedPressable from '@/components/AnimatedPressable';                    
  import { supabase } from '@/lib/supabase';                                           import { useAuthStore } from '@/store/authStore';                                  
                                                                                       interface PaymentRow {                                                             
    id: string;                                                                      
    date: string;                                                                    
    planName: string;
    amount: number;
    method: string;
  }

  const methodColor: Record<string, string> = {
    cash: '#8B5CF6', upi: Colors.accent, card: Colors.green,
    bank_transfer: '#3B82F6', other: Colors.textMuted,
  };
  const methodLabel: Record<string, string> = {
    cash: 'Cash', upi: 'UPI', card: 'Card', bank_transfer: 'Bank', other: 'Other',   
  };

  export default function MyPaymentsScreen() {
    const { session } = useAuthStore();
    const [payments, setPayments]         = useState<PaymentRow[]>([]);
    const [totalPaid, setTotalPaid]       = useState(0);
    const [activePlanName, setActivePlanName] = useState('');
    const [daysLeft, setDaysLeft]         = useState(0);
    const [nextDue, setNextDue]           = useState('');
    const [loading, setLoading]           = useState(true);

    useFocusEffect(useCallback(() => {
      let active = true;
      async function load() {
        if (!session?.user?.id) { setLoading(false); return; }
        setLoading(true);

        const { data: m } = await supabase
          .from('members')
          .select('id')
          .eq('user_id', session.user.id)
          .single();

        if (!m || !active) { setLoading(false); return; }

        const [payRes, planRes] = await Promise.all([
          supabase
            .from('payments')
            .select('id, amount, payment_date, payment_method,member_plans(membership_plans(name))')
            .eq('member_id', m.id)
            .order('payment_date', { ascending: false }),
          supabase
            .from('member_plans')
            .select('end_date, membership_plans(name)')
            .eq('member_id', m.id)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        if (!active) return;

        const rows: PaymentRow[] = (payRes.data ?? []).map((p: any) => ({
          id:       p.id,
          date:     new Date(p.payment_date).toLocaleDateString('en-IN', { day:      
  '2-digit', month: 'short', year: 'numeric' }),
          planName: p.member_plans?.membership_plans?.name ?? 'Membership',
          amount:   p.amount,
          method:   p.payment_method,
        }));

        setPayments(rows);
        setTotalPaid(rows.reduce((s, p) => s + p.amount, 0));

        if (planRes.data) {
          const end = new Date(planRes.data.end_date);
          const dl  = Math.max(0, Math.ceil((end.getTime() - Date.now()) /
  86400000));
          setDaysLeft(dl);
          setActivePlanName((planRes.data.membership_plans as any)?.name ?? 'Active  Plan');
          setNextDue(end.toLocaleDateString('en-IN', { day: '2-digit', month:        
  'short', year: 'numeric' }));
        }

        setLoading(false);
      }
      load();
      return () => { active = false; };
    }, [session?.user?.id]));

    if (loading) {
      return (
        <View style={{ flex: 1, backgroundColor: Colors.bg, justifyContent: 'center',
   alignItems: 'center' }}>
          <ActivityIndicator color={Colors.accent} size="large" />
        </View>
      );
    }

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}   showsVerticalScrollIndicator={false}>

        {/* ── Summary Card ──────────────────── */}
        <FadeInView delay={0}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryGlow} />
            <View style={styles.summaryTop}>
              <View>
                <Text style={styles.microLabel}>ACTIVE PLAN</Text>
                <Text style={styles.planName}>
                  {activePlanName ? activePlanName.toUpperCase() : 'NO ACTIVE PLAN'} 
                </Text>
              </View>
              <View style={styles.daysBox}>
                <Text style={styles.daysNum}>{daysLeft}</Text>
                <Text style={styles.daysLabel}>DAYS{'\n'}LEFT</Text>
              </View>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text
  style={styles.summaryVal}>₹{totalPaid.toLocaleString('en-IN')}</Text>
                <Text style={styles.summaryLabel}>TOTAL PAID</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryVal}>{payments.length}</Text>
                <Text style={styles.summaryLabel}>PAYMENTS</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryVal, { color: Colors.orange, fontSize: 13
   }]}>
                  {nextDue || '—'}
                </Text>
                <Text style={styles.summaryLabel}>NEXT DUE</Text>
              </View>
            </View>
          </View>
        </FadeInView>

        {/* ── History ───────────────────────── */}
        {payments.length > 0 ? (
          <FadeInView delay={80}>
            <Text style={styles.sectionLabel}>PAYMENT HISTORY — {payments.length} RECORDS</Text>
            <View style={styles.historyCard}>
              {payments.map((p, i) => {
                const color = methodColor[p.method] ?? Colors.textMuted;
                return (
                  <View key={p.id} style={[styles.payRow, i < payments.length - 1 && 
  styles.payRowBorder]}>
                    <View style={styles.payLeft}>
                      <View style={[styles.methodDot, { backgroundColor: color }]} />
                      <View>
                        <Text style={styles.payPlan}>{p.planName}</Text>
                        <Text style={styles.payDate}>{p.date}</Text>
                      </View>
                    </View>
                    <View style={styles.payRight}>
                      <Text
  style={styles.payAmount}>₹{p.amount.toLocaleString('en-IN')}</Text>
                      <View style={[styles.methodBadge, { backgroundColor: color +   
  '18' }]}>
                        <Text style={[styles.methodText, { color }]}>
                          {methodLabel[p.method] ?? p.method.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </FadeInView>
        ) : (
          <FadeInView delay={80} style={styles.empty}>
            <Text style={styles.emptyEmoji}>💸</Text>
            <Text style={styles.emptyTitle}>No payments yet</Text>
            <Text style={styles.emptyDesc}>Your payment history will appear
  here</Text>
          </FadeInView>
        )}

        {/* ── Download Button ───────────────── */}
        <FadeInView delay={220}>
          <AnimatedPressable
            style={styles.downloadBtn}
            scaleDown={0.97}
            onPress={() => Alert.alert('Download', 'Payment receipts export coming soon!')}
          >
            <Text style={styles.downloadText}>DOWNLOAD ALL RECEIPTS</Text>
          </AnimatedPressable>
        </FadeInView>

        <View style={{ height: 32 }} />
      </ScrollView>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    content: { padding: 16, gap: 12 },

    summaryCard: { backgroundColor: Colors.bgCard, borderRadius: 20, padding: 20,    
  borderWidth: 1, borderColor: Colors.border, gap: 16, overflow: 'hidden' },
    summaryGlow: { position: 'absolute', top: -30, right: -20, width: 130, height:   
  130, borderRadius: 65, backgroundColor: Colors.accentGlow },
    summaryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 
  'flex-start' },
    microLabel: { fontFamily: Fonts.medium, fontSize: 9, color: Colors.textMuted,    
  letterSpacing: 1.2, marginBottom: 4 },
    planName: { fontFamily: Fonts.condensedBold, fontSize: 20, color: Colors.text,   
  letterSpacing: 0.5 },
    daysBox: { backgroundColor: Colors.accentMuted, borderRadius: 12,
  paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center' },
    daysNum: { fontFamily: Fonts.condensedBold, fontSize: 28, color: Colors.accent },
    daysLabel: { fontFamily: Fonts.medium, fontSize: 8, color: Colors.accent,        
  letterSpacing: 0.8, textAlign: 'center' },

    summaryDivider: { height: 1, backgroundColor: Colors.border },
    summaryRow: { flexDirection: 'row' },
    summaryItem: { flex: 1, alignItems: 'center', gap: 3 },
    summaryVal: { fontFamily: Fonts.condensedBold, fontSize: 16, color: Colors.text  
  },
    summaryLabel: { fontFamily: Fonts.medium, fontSize: 8, color: Colors.textMuted,  
  letterSpacing: 0.8 },

    sectionLabel: { fontFamily: Fonts.medium, fontSize: 9, color: Colors.textMuted,  
  letterSpacing: 1.5 },

    historyCard: { backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 1, 
  borderColor: Colors.border, overflow: 'hidden' },
    payRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },    
    payRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },        
    payLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },       
    methodDot: { width: 8, height: 8, borderRadius: 4 },
    payPlan: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.text },
    payDate: { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted,     
  marginTop: 2 },
    payRight: { alignItems: 'flex-end', gap: 4 },
    payAmount: { fontFamily: Fonts.condensedBold, fontSize: 16, color: Colors.text },
    methodBadge: { borderRadius: 5, paddingHorizontal: 7, paddingVertical: 3 },      
    methodText: { fontFamily: Fonts.bold, fontSize: 9, letterSpacing: 0.5 },

    empty: { alignItems: 'center', paddingVertical: 48 },
    emptyEmoji: { fontSize: 44, marginBottom: 12 },
    emptyTitle: { fontFamily: Fonts.bold, fontSize: 16, color: Colors.text },        
    emptyDesc: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted,   
  marginTop: 6 },

    downloadBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center',      
  borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgCard },      
    downloadText: { fontFamily: Fonts.bold, fontSize: 12, color: Colors.textMuted,   
  letterSpacing: 1 },
  });
