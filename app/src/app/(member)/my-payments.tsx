import { View, Text, StyleSheet, ScrollView } from
  'react-native';    
  import { Colors } from '@/constants/colors';
  import { Fonts } from '@/constants/fonts';                         import FadeInView from '@/components/FadeInView';
  import AnimatedPressable from '@/components/AnimatedPressable';  
  import { Alert } from 'react-native';                            
  
  const summary = {
    totalPaid: 14500,
    activePlan: 'Premium 3 Months',
    nextDue: 'May 1, 2026',
    daysLeft: 18,
  };

  const payments = [
    { id: 1, date: 'Feb 1, 2026',  plan: 'Premium 3 Months',       
  amount: 4500, method: 'UPI',       status: 'paid',    txn:       
  'TXN8821049' },
    { id: 2, date: 'Nov 1, 2025',  plan: 'Premium 3 Months',       
  amount: 4500, method: 'Card',      status: 'paid',    txn:       
  'TXN7740312' },
    { id: 3, date: 'Aug 1, 2025',  plan: 'Premium 3 Months',       
  amount: 4500, method: 'UPI',       status: 'paid',    txn:       
  'TXN6630871' },
    { id: 4, date: 'May 1, 2025',  plan: 'Standard Monthly',       
  amount: 1200, method: 'Cash',      status: 'paid',    txn:       
  'TXN5510234' },
    { id: 5, date: 'Apr 1, 2025',  plan: 'Standard Monthly',       
  amount: 1200, method: 'Cash',      status: 'paid',    txn:       
  'TXN4490567' },
    { id: 6, date: 'May 1, 2026',  plan: 'Premium 3 Months',       
  amount: 4500, method: '—',         status: 'pending', txn: '—' },
  ];

  const methodColor: Record<string, string> = {
    UPI: Colors.accent, Card: Colors.green, Cash: '#8B5CF6', '—':  
  Colors.textMuted,
  };

  export default function MyPaymentsScreen() {
    const paid    = payments.filter(p => p.status === 'paid');     
    const pending = payments.filter(p => p.status === 'pending');  

    return (
      <ScrollView style={styles.container}
  contentContainerStyle={styles.content}
  showsVerticalScrollIndicator={false}>

        {/* ── Summary Card ──────────────────── */}
        <FadeInView delay={0}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryGlow} />

            <View style={styles.summaryTop}>
              <View>
                <Text style={styles.microLabel}>ACTIVE PLAN</Text> 
                <Text
  style={styles.planName}>{summary.activePlan.toUpperCase()}</Text>
              </View>
              <View style={styles.daysBox}>
                <Text
  style={styles.daysNum}>{summary.daysLeft}</Text>
                <Text
  style={styles.daysLabel}>DAYS{'\n'}LEFT</Text>
              </View>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryVal}>₹{summary.totalPaid.toLocaleString('en-IN')}</Text>
                <Text style={styles.summaryLabel}>TOTAL PAID</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text
  style={styles.summaryVal}>{paid.length}</Text>
                <Text style={styles.summaryLabel}>PAYMENTS</Text>  
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryVal, { color:
  Colors.orange }]}>{summary.nextDue}</Text>
                <Text style={styles.summaryLabel}>NEXT DUE</Text>  
              </View>
            </View>
          </View>
        </FadeInView>

        {/* ── Pending ───────────────────────── */}
        {pending.length > 0 && (
          <FadeInView delay={80}>
            <Text style={styles.sectionLabel}>UPCOMING
  PAYMENT</Text>
            {pending.map(p => (
              <View key={p.id} style={styles.pendingCard}>
                <View style={styles.pendingLeft}>
                  <Text
  style={styles.pendingPlan}>{p.plan.toUpperCase()}</Text>
                  <Text style={styles.pendingDate}>{p.date}</Text> 
                </View>
                <View style={styles.pendingRight}>
                  <Text style={styles.pendingAmount}>₹{p.amount.toLocaleString('en-IN')}</Text>
                  <AnimatedPressable
                    style={styles.payNowBtn}
                    scaleDown={0.96}
                    onPress={() => Alert.alert('Pay Now', 'Payment gateway coming soon!')}
                  >
                    <Text style={styles.payNowText}>PAY NOW</Text>
                  </AnimatedPressable>
                </View>
              </View>
            ))}
          </FadeInView>
        )}

        {/* ── History ───────────────────────── */}
        <FadeInView delay={140}>
          <Text style={styles.sectionLabel}>PAYMENT HISTORY  —     
  {paid.length} RECORDS</Text>
          <View style={styles.historyCard}>
            {paid.map((p, i) => (
              <View key={p.id} style={[styles.payRow, i <
  paid.length - 1 && styles.payRowBorder]}>
                {/* Left */}
                <View style={styles.payLeft}>
                  <View style={[styles.methodDot, {
  backgroundColor: methodColor[p.method] }]} />
                  <View>
                    <Text style={styles.payPlan}>{p.plan}</Text>   
                    <Text style={styles.payDate}>{p.date}  ·       
  {p.txn}</Text>
                  </View>
                </View>
                {/* Right */}
                <View style={styles.payRight}>
                  <Text style={styles.payAmount}>₹{p.amount.toLocaleString('en-IN')}</Text>
                  <View style={[styles.methodBadge, {
  backgroundColor: methodColor[p.method] + '18' }]}>
                    <Text style={[styles.methodText, { color:      
  methodColor[p.method] }]}>{p.method}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </FadeInView>

        {/* ── Download Button ───────────────── */}
        <FadeInView delay={220}>
          <AnimatedPressable
            style={styles.downloadBtn}
            scaleDown={0.97}
            onPress={() => Alert.alert('Download', 'Payment receipts export coming soon!')}
          >
            <Text style={styles.downloadText}>DOWNLOAD ALL
  RECEIPTS</Text>
          </AnimatedPressable>
        </FadeInView>

        <View style={{ height: 32 }} />
      </ScrollView>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    content: { padding: 16, gap: 12 },

    summaryCard: {
      backgroundColor: Colors.bgCard, borderRadius: 20, padding:   
  20,
      borderWidth: 1, borderColor: Colors.border, gap: 16,
  overflow: 'hidden',
    },
    summaryGlow: {
      position: 'absolute', top: -30, right: -20,
      width: 130, height: 130, borderRadius: 65,
      backgroundColor: Colors.accentGlow,
    },
    summaryTop: { flexDirection: 'row', justifyContent:
  'space-between', alignItems: 'flex-start' },
    microLabel: {
      fontFamily: Fonts.medium, fontSize: 9, color:
  Colors.textMuted, letterSpacing: 1.2, marginBottom: 4,
    },
    planName: {
      fontFamily: Fonts.condensedBold, fontSize: 20, color:        
  Colors.text, letterSpacing: 0.5,
    },
    daysBox: {
      backgroundColor: Colors.accentMuted, borderRadius: 12,       
      paddingHorizontal: 14, paddingVertical: 8, alignItems:       
  'center',
    },
    daysNum: { fontFamily: Fonts.condensedBold, fontSize: 28,      
  color: Colors.accent },
    daysLabel: { fontFamily: Fonts.medium, fontSize: 8, color:     
  Colors.accent, letterSpacing: 0.8, textAlign: 'center' },        

    summaryDivider: { height: 1, backgroundColor: Colors.border }, 

    summaryRow: { flexDirection: 'row' },
    summaryItem: { flex: 1, alignItems: 'center', gap: 3 },        
    summaryVal: { fontFamily: Fonts.condensedBold, fontSize: 16,   
  color: Colors.text },
    summaryLabel: { fontFamily: Fonts.medium, fontSize: 8, color:  
  Colors.textMuted, letterSpacing: 0.8 },

    sectionLabel: {
      fontFamily: Fonts.medium, fontSize: 9, color:
  Colors.textMuted, letterSpacing: 1.5,
    },

    pendingCard: {
      backgroundColor: Colors.bgCard, borderRadius: 14, padding:   
  16,
      borderWidth: 1, borderColor: Colors.orange + '35',
      flexDirection: 'row', alignItems: 'center', justifyContent:  
  'space-between',
    },
    pendingLeft: { gap: 4 },
    pendingPlan: { fontFamily: Fonts.condensedBold, fontSize: 15,  
  color: Colors.text },
    pendingDate: { fontFamily: Fonts.medium, fontSize: 11, color:  
  Colors.textMuted },
    pendingRight: { alignItems: 'flex-end', gap: 8 },
    pendingAmount: { fontFamily: Fonts.condensedBold, fontSize: 22,
   color: Colors.orange },
    payNowBtn: {
      backgroundColor: Colors.accent, borderRadius: 8,
      paddingHorizontal: 14, paddingVertical: 8,
    },
    payNowText: { fontFamily: Fonts.bold, fontSize: 11, color:     
  '#FFF', letterSpacing: 0.8 },

    historyCard: {
      backgroundColor: Colors.bgCard, borderRadius: 16,
      borderWidth: 1, borderColor: Colors.border, overflow:        
  'hidden',
    },
    payRow: { flexDirection: 'row', alignItems: 'center', padding: 
  14, gap: 12 },
    payRowBorder: { borderBottomWidth: 1, borderBottomColor:       
  Colors.border },
    payLeft: { flex: 1, flexDirection: 'row', alignItems: 'center',
   gap: 12 },
    methodDot: { width: 8, height: 8, borderRadius: 4 },
    payPlan: { fontFamily: Fonts.bold, fontSize: 13, color:        
  Colors.text },
    payDate: { fontFamily: Fonts.regular, fontSize: 10, color:     
  Colors.textMuted, marginTop: 2 },
    payRight: { alignItems: 'flex-end', gap: 4 },
    payAmount: { fontFamily: Fonts.condensedBold, fontSize: 16,    
  color: Colors.text },
    methodBadge: { borderRadius: 5, paddingHorizontal: 7,
  paddingVertical: 3 },
    methodText: { fontFamily: Fonts.bold, fontSize: 9,
  letterSpacing: 0.5 },

    downloadBtn: {
      borderRadius: 12, paddingVertical: 14, alignItems: 'center', 
      borderWidth: 1, borderColor: Colors.border,
      backgroundColor: Colors.bgCard,
    },
    downloadText: { fontFamily: Fonts.bold, fontSize: 12, color:   
  Colors.textMuted, letterSpacing: 1 },
  });