 import { useState, useCallback } from 'react';
  import { View, Text, StyleSheet, ScrollView, Linking, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
  import { Stack, useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
  import { Colors } from '@/constants/colors';   
  import { Fonts } from '@/constants/fonts';
  import AnimatedPressable from '@/components/AnimatedPressable';
  import FadeInView from '@/components/FadeInView';
  import { supabase } from '@/lib/supabase';                                                                                        import { askAI } from '@/lib/ai';
  import type { Member } from '@/types/database';                                                                                 
                                                                                                                                  
  type TabKey = 'info' | 'plans' | 'payments' | 'attendance';

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'info',       label: 'INFO'     },
    { key: 'plans',      label: 'PLANS'    },
    { key: 'payments',   label: 'PAYMENTS' },
    { key: 'attendance', label: 'ATTEND'   },
  ];

  interface PlanRow    { id: string; planName: string; startDate: string; endDate: string; rawEndDate: string; status: string;    
  price: number; }
  interface PaymentRow { id: string; date: string; planName: string; amount: number; method: string; }
  interface AttendRow  { id: string; date: string; time: string; }

  const goalLabel: Record<string, string> = {
    weight_loss: 'Weight Loss', muscle_gain: 'Muscle Gain',
    general_fitness: 'General Fitness', other: 'Other',
  };
  const methodEmoji: Record<string, string> = {
    upi: '📱', card: '💳', cash: '💵', bank_transfer: '🏦', other: '💸',
  };

  export default function MemberProfileScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router  = useRouter();
    const [activeTab, setActiveTab] = useState<TabKey>('info');

    const [member, setMember]               = useState<Member | null>(null);
    const [plans, setPlans]                 = useState<PlanRow[]>([]);
    const [payments, setPayments]           = useState<PaymentRow[]>([]);
    const [attendance, setAttendance]       = useState<AttendRow[]>([]);
    const [thisMonthCount, setThisMonthCount] = useState(0);
    const [loading, setLoading]             = useState(true);
    const [availablePlans, setAvailablePlans] = useState('');

    const [aiRenewalMsg, setAiRenewalMsg]       = useState<string | null>(null);
    const [aiRenewalLoading, setAiRenewalLoading] = useState(false);
    const [aiPlanRec, setAiPlanRec]             = useState<string | null>(null);
    const [aiPlanLoading, setAiPlanLoading]     = useState(false);

    const today      = new Date().toISOString().split('T')[0];
    const monthStart = today.slice(0, 8) + '01';

    useFocusEffect(useCallback(() => {
      if (!id) return;
      let active = true;
      async function load() {
        setLoading(true);

        const [memberRes, plansRes, paymentsRes, attRes, attCountRes] = await Promise.all([
          supabase.from('members').select('*').eq('id', id).single(),
          supabase.from('member_plans').select('id, start_date, end_date, status, membership_plans(name, price)').eq('member_id', id).order('created_at', { ascending: false }),
          supabase.from('payments').select('id, amount, payment_date, payment_method member_plans(membership_plans(name))').eq('member_id', id).order('payment_date', { ascending: false }),
          supabase.from('attendance').select('id, check_in_date, check_in_time').eq('member_id', id).order('check_in_date', {  ascending: false }).limit(30),
          supabase.from('attendance').select('id', { count: 'exact', head: true }).eq('member_id', id).gte('check_in_date',  monthStart),
        ]);

        if (!active) return;

        if (memberRes.data) {
          setMember(memberRes.data);

          // Fetch available gym plans for AI recommender
          const { data: gymPlans } = await supabase
            .from('membership_plans')
            .select('name, price, duration_days')
            .eq('gym_id', memberRes.data.gym_id)
            .eq('is_active', true);

          const plansStr = (gymPlans ?? []).map((p: any) => p.name + ' (Rs.' + p.price + ', ' + p.duration_days + 'days)').join(', ');
          setAvailablePlans(plansStr);
        }

        setPlans((plansRes.data ?? []).map((p: any) => ({
          id:         p.id,
          planName:   p.membership_plans?.name ?? 'Plan',
          startDate:  new Date(p.start_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),    
          endDate:    new Date(p.end_date).toLocaleDateString('en-IN',   { day: '2-digit', month: 'short', year: 'numeric' }),
          rawEndDate: p.end_date,
          status:     p.status,
          price:      p.membership_plans?.price ?? 0,
        })));

        setPayments((paymentsRes.data ?? []).map((p: any) => ({
          id:       p.id,
          date:     new Date(p.payment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),    
          planName: p.member_plans?.membership_plans?.name ?? 'Membership',
          amount:   p.amount,
          method:   p.payment_method,
        })));

        setAttendance((attRes.data ?? []).map((a: any) => ({
          id:   a.id,
          date: new Date(a.check_in_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
          time: a.check_in_time ?? '—',
        })));

        setThisMonthCount(attCountRes.count ?? 0);
        setLoading(false);
      }
      load();
      return () => { active = false; };
    }, [id, monthStart]));

    const handleAIRenewal = async () => {
      if (!member) return;
      const activePlan = plans.find(p => p.status === 'active');
      const daysLeft   = activePlan?.rawEndDate
        ? Math.max(0, Math.ceil((new Date(activePlan.rawEndDate).getTime() - Date.now()) / 86400000))
        : 0;
      setAiRenewalLoading(true);
      setAiRenewalMsg(null);
      try {
        const text = await askAI('renewal_message', {
          memberName: member.full_name,
          planName:   activePlan?.planName ?? 'membership',
          daysLeft,
          gymName:    'GymSetu',
        });
        setAiRenewalMsg(text);
      } catch {
        Alert.alert('Error', 'Could not generate message');
      }
      setAiRenewalLoading(false);
    };

    const handleAIPlanRec = async () => {
      if (!member) return;
      const activePlan = plans.find(p => p.status === 'active');
      setAiPlanLoading(true);
      setAiPlanRec(null);
      try {
        const text = await askAI('plan_recommender', {
          goal:           member.goal ?? 'general fitness',
          currentPlan:    activePlan?.planName ?? 'none',
          visitFrequency: thisMonthCount,
          availablePlans: availablePlans || 'various plans available',
        });
        setAiPlanRec(text);
      } catch {
        Alert.alert('Error', 'Could not generate recommendation');
      }
      setAiPlanLoading(false);
    };

    if (loading || !member) {
      return (
        <>
          <Stack.Screen options={{ title: '' }} />
          <View style={{ flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator color={Colors.accent} size="large" />
          </View>
        </>
      );
    }

    const statusColor = member.status === 'active' ? Colors.green
      : member.status === 'expired' ? Colors.red : Colors.orange;
    const initials = member.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

    const renderContent = () => {
      if (activeTab === 'info') {
        return (
          <View>
            {[
              { label: 'PHONE',  value: member.phone ?? '—',  emoji: '📱' },
              { label: 'EMAIL',  value: member.email ?? '—',  emoji: '📧' },
              { label: 'GENDER', value: member.gender ?? '—', emoji: '👤' },
              { label: 'DOB',    value: member.date_of_birth ? new Date(member.date_of_birth).toLocaleDateString('en-IN', { day:  
  '2-digit', month: 'short', year: 'numeric' }) : '—', emoji: '🎂' },
              { label: 'JOINED', value: new Date(member.join_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short',  
  year: 'numeric' }), emoji: '📅' },
              { label: 'HEIGHT', value: member.height_cm ? `${member.height_cm} cm` : '—', emoji: '📏' },
              { label: 'WEIGHT', value: member.weight_kg ? `${member.weight_kg} kg` : '—', emoji: '⚖️' },
              { label: 'GOAL',   value: member.goal ? (goalLabel[member.goal] ?? member.goal) : '—', emoji: '🎯' },
            ].map((row, i, arr) => (
              <View key={row.label} style={[styles.infoRow, i < arr.length - 1 && styles.infoRowBorder]}>
                <Text style={styles.infoEmoji}>{row.emoji}</Text>
                <Text style={styles.infoLabel}>{row.label}</Text>
                <Text style={styles.infoValue}>{row.value}</Text>
              </View>
            ))}
          </View>
        );
      }

      if (activeTab === 'plans') {
        if (!plans.length) return <EmptyTab emoji="📄" text="No plans assigned yet" />;
        return (
          <View style={styles.tabContent}>
            {plans.map(p => {
              const c = p.status === 'active' ? Colors.green : Colors.textMuted;
              return (
                <View key={p.id} style={[styles.planItem, { borderLeftColor: c }]}>
                  <View style={styles.planHeader}>
                    <Text style={styles.planName}>{p.planName}</Text>
                    <View style={[styles.planBadge, { backgroundColor: c + '18' }]}>
                      <Text style={[styles.planBadgeText, { color: c }]}>{p.status.toUpperCase()}</Text>
                    </View>
                  </View>
                  <Text style={styles.planDates}>{p.startDate}  →  {p.endDate}</Text>
                  <Text style={styles.planPrice}>₹{p.price.toLocaleString('en-IN')}</Text>
                </View>
              );
            })}
          </View>
        );
      }

      if (activeTab === 'payments') {
        if (!payments.length) return <EmptyTab emoji="💳" text="No payments recorded yet" />;
        return (
          <View style={styles.tabContent}>
            {payments.map((p, i) => (
              <View key={p.id} style={[styles.payItem, i < payments.length - 1 && styles.payItemBorder]}>
                <Text style={styles.payEmoji}>{methodEmoji[p.method] ?? '💵'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.payNote}>{p.planName}</Text>
                  <Text style={styles.payDate}>{p.date}  ·  {p.method.replace('_', ' ').toUpperCase()}</Text>
                </View>
                <Text style={styles.payAmount}>+₹{p.amount.toLocaleString('en-IN')}</Text>
              </View>
            ))}
          </View>
        );
      }

      if (activeTab === 'attendance') {
        if (!attendance.length) return <EmptyTab emoji="📋" text="No attendance records yet" />;
        return (
          <View style={styles.tabContent}>
            <View style={styles.attendSummary}>
              <Text style={styles.attendCount}>{thisMonthCount}</Text>
              <Text style={styles.attendUnit}>days</Text>
              <Text style={styles.attendLabel}>  THIS MONTH</Text>
            </View>
            {attendance.map((a, i) => (
              <View key={a.id} style={[styles.attendRow, i < attendance.length - 1 && styles.attendRowBorder]}>
                <View style={styles.attendDot} />
                <Text style={styles.attendDate}>{a.date}</Text>
                <Text style={styles.attendTime}>{a.time}</Text>
              </View>
            ))}
          </View>
        );
      }
      return null;
    };

    return (
      <>
        <Stack.Screen options={{ title: '' }} />
        <ScrollView style={styles.container} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Hero */}
          <FadeInView delay={0}>
            <View style={styles.hero}>
              <View style={[styles.avatarRing, { borderColor: statusColor + '60' }]}>
                <View style={[styles.avatarInner, { backgroundColor: statusColor + '18' }]}>
                  <Text style={[styles.avatarText, { color: statusColor }]}>{initials}</Text>
                </View>
              </View>
              <Text style={styles.heroName}>{member.full_name}</Text>
              <View style={[styles.statusPill, { backgroundColor: statusColor + '18' }]}>
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <Text style={[styles.statusText, { color: statusColor }]}>{member.status.toUpperCase()}</Text>
              </View>
            </View>
          </FadeInView>

          {/* Action buttons */}
          <FadeInView delay={50}>
            <View style={styles.actions}>
              <AnimatedPressable style={styles.actionBtn} scaleDown={0.94}
                onPress={() => member.phone && Linking.openURL(`tel:${member.phone}`)}>
                <Text style={styles.actionEmoji}>📞</Text>
                <Text style={styles.actionLabel}>CALL</Text>
              </AnimatedPressable>
              <AnimatedPressable style={styles.actionBtn} scaleDown={0.94}
                onPress={() => member.phone && Linking.openURL(`https://wa.me/${member.phone.replace(/\D/g, '')}`)}>
                <Text style={styles.actionEmoji}>💬</Text>
                <Text style={styles.actionLabel}>WHATSAPP</Text>
              </AnimatedPressable>
              <AnimatedPressable style={[styles.actionBtn, styles.actionBtnAccent]} scaleDown={0.94}
                onPress={() => router.push({ pathname: '/(owner)/more/renew-plan', params: { memberId: id, memberName:
  member.full_name } })}>
                <Text style={styles.actionEmoji}>🔄</Text>
                <Text style={[styles.actionLabel, { color: Colors.accent }]}>RENEW</Text>
              </AnimatedPressable>
              <AnimatedPressable style={styles.actionBtn} scaleDown={0.94}
                onPress={() => router.push({ pathname: '/(owner)/members/edit', params: { memberId: id } })}>
                <Text style={styles.actionEmoji}>✏️</Text>
                <Text style={styles.actionLabel}>EDIT</Text>
              </AnimatedPressable>
            </View>
          </FadeInView>

          {/* AI Tools Card */}
          <FadeInView delay={80}>
            <View style={styles.aiCard}>
              <View style={styles.aiCardHeader}>
                <Text style={styles.aiCardTitle}>🤖  AI TOOLS</Text>
              </View>

              {/* Renewal Message */}
              <TouchableOpacity style={styles.aiToolRow} onPress={handleAIRenewal} disabled={aiRenewalLoading}>
                <View style={styles.aiToolLeft}>
                  <Text style={styles.aiToolEmoji}>✨</Text>
                  <View>
                    <Text style={styles.aiToolLabel}>AI Renewal Message</Text>
                    <Text style={styles.aiToolSub}>Generate WhatsApp reminder</Text>
                  </View>
                </View>
                {aiRenewalLoading
                  ? <ActivityIndicator size="small" color={Colors.accent} />
                  : <Text style={styles.aiToolArrow}>›</Text>
                }
              </TouchableOpacity>

              {aiRenewalMsg && (
                <View style={styles.aiResult}>
                  <Text style={styles.aiResultText}>{aiRenewalMsg}</Text>
                  <TouchableOpacity
                    style={styles.aiSendBtn}
                    onPress={() => member.phone && Linking.openURL('https://wa.me/' + member.phone.replace(/\D/g, '') + '?text=' +
   encodeURIComponent(aiRenewalMsg))}
                  >
                    <Text style={styles.aiSendBtnText}>📱  Send on WhatsApp</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.aiDivider} />

              {/* Plan Recommender */}
              <TouchableOpacity style={styles.aiToolRow} onPress={handleAIPlanRec} disabled={aiPlanLoading}>
                <View style={styles.aiToolLeft}>
                  <Text style={styles.aiToolEmoji}>🎯</Text>
                  <View>
                    <Text style={styles.aiToolLabel}>AI Plan Recommendation</Text>
                    <Text style={styles.aiToolSub}>Best plan for this member</Text>
                  </View>
                </View>
                {aiPlanLoading
                  ? <ActivityIndicator size="small" color="#A78BFA" />
                  : <Text style={styles.aiToolArrow}>›</Text>
                }
              </TouchableOpacity>

              {aiPlanRec && (
                <View style={[styles.aiResult, { borderLeftColor: '#A78BFA' }]}>
                  <Text style={styles.aiResultText}>{aiPlanRec}</Text>
                </View>
              )}
            </View>
          </FadeInView>

          {/* Tab bar */}
          <FadeInView delay={120}>
            <View style={styles.tabBar}>
              {tabs.map(t => (
                <AnimatedPressable
                  key={t.key}
                  style={[styles.tab, activeTab === t.key && styles.tabActive]}
                  onPress={() => setActiveTab(t.key)}
                  scaleDown={0.95}
                >
                  <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>{t.label}</Text>
                  {activeTab === t.key && <View style={styles.tabUnderline} />}
                </AnimatedPressable>
              ))}
            </View>
          </FadeInView>

          {/* Content */}
          <FadeInView delay={200}>
            <View style={styles.contentCard}>{renderContent()}</View>
          </FadeInView>

          <View style={{ height: 32 }} />
        </ScrollView>
      </>
    );
  }

  function EmptyTab({ emoji, text }: { emoji: string; text: string }) {
    return (
      <View style={styles.emptyTab}>
        <Text style={styles.emptyTabEmoji}>{emoji}</Text>
        <Text style={styles.emptyTabText}>{text}</Text>
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    scroll:    { paddingBottom: 40 },

    hero:        { alignItems: 'center', paddingTop: 20, paddingBottom: 20 },
    avatarRing:  { width: 84, height: 84, borderRadius: 42, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },     
    avatarInner: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center' },
    avatarText:  { fontFamily: Fonts.condensedBold, fontSize: 26 },
    heroName:    { fontFamily: Fonts.condensedBold, fontSize: 28, color: Colors.text, marginTop: 12, letterSpacing: 0.5 },        
    statusPill:  { flexDirection: 'row', alignItems: 'center', marginTop: 8, paddingHorizontal: 12, paddingVertical: 5,
  borderRadius: 10, gap: 6 },
    statusDot:   { width: 6, height: 6, borderRadius: 3 },
    statusText:  { fontFamily: Fonts.bold, fontSize: 9, letterSpacing: 1 },

    actions:         { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12 },
    actionBtn:       { flex: 1, backgroundColor: Colors.bgCard, borderRadius: 12, paddingVertical: 14, alignItems: 'center', gap: 
  5, borderWidth: 1, borderColor: Colors.border },
    actionBtnAccent: { borderColor: Colors.accent + '40', backgroundColor: Colors.accentMuted },
    actionEmoji:     { fontSize: 18 },
    actionLabel:     { fontFamily: Fonts.bold, fontSize: 8, color: Colors.textMuted, letterSpacing: 0.8 },

    aiCard:       { marginHorizontal: 16, marginBottom: 12, backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 1,     
  borderColor: Colors.accent + '25', overflow: 'hidden' },
    aiCardHeader: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
    aiCardTitle:  { fontFamily: Fonts.bold, fontSize: 10, color: Colors.accent, letterSpacing: 1.5 },
    aiToolRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16,
  paddingVertical: 12 },
    aiToolLeft:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
    aiToolEmoji:  { fontSize: 20 },
    aiToolLabel:  { fontFamily: Fonts.bold, fontSize: 13, color: Colors.text },
    aiToolSub:    { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 1 },
    aiToolArrow:  { fontFamily: Fonts.bold, fontSize: 20, color: Colors.textMuted },
    aiDivider:    { height: 1, backgroundColor: Colors.border, marginHorizontal: 16 },
    aiResult:     { marginHorizontal: 16, marginBottom: 12, backgroundColor: Colors.bgElevated, borderRadius: 10, padding: 12,    
  borderLeftWidth: 3, borderLeftColor: Colors.accent },
    aiResultText: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.text, lineHeight: 20 },
    aiSendBtn:    { marginTop: 10, backgroundColor: Colors.green + '18', borderRadius: 8, paddingVertical: 8, alignItems:
  'center', borderWidth: 1, borderColor: Colors.green + '40' },
    aiSendBtnText:{ fontFamily: Fonts.bold, fontSize: 12, color: Colors.green },

    tabBar:        { flexDirection: 'row', marginHorizontal: 16, backgroundColor: Colors.bgCard, borderRadius: 12, padding: 4,    
  marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
    tab:           { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10, position: 'relative' },
    tabActive:     { backgroundColor: Colors.bgElevated },
    tabText:       { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted, letterSpacing: 0.8 },
    tabTextActive: { color: Colors.accent },
    tabUnderline:  { position: 'absolute', bottom: 4, width: 16, height: 2, borderRadius: 1, backgroundColor: Colors.accent },    

    contentCard: { marginHorizontal: 16, backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor:
  Colors.border, overflow: 'hidden' },

    infoRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13, paddingHorizontal: 16 },
    infoRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
    infoEmoji:     { fontSize: 14, width: 22, textAlign: 'center' },
    infoLabel:     { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted, letterSpacing: 1, width: 60 },
    infoValue:     { flex: 1, fontFamily: Fonts.medium, fontSize: 13, color: Colors.text, textAlign: 'right' },

    tabContent: { padding: 12, gap: 8 },

    planItem:      { backgroundColor: Colors.bgElevated, borderRadius: 10, padding: 12, gap: 4, borderLeftWidth: 3 },
    planHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    planName:      { fontFamily: Fonts.bold, fontSize: 13, color: Colors.text },
    planBadge:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    planBadgeText: { fontFamily: Fonts.bold, fontSize: 8, letterSpacing: 0.8 },
    planDates:     { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted },
    planPrice:     { fontFamily: Fonts.condensedBold, fontSize: 16, color: Colors.accent },

    payItem:       { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
    payItemBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
    payEmoji:      { fontSize: 18 },
    payNote:       { fontFamily: Fonts.bold, fontSize: 13, color: Colors.text },
    payDate:       { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 2 },
    payAmount:     { fontFamily: Fonts.condensedBold, fontSize: 16, color: Colors.green },

    attendSummary:  { flexDirection: 'row', alignItems: 'baseline', paddingBottom: 10, marginBottom: 4, borderBottomWidth: 1,     
  borderBottomColor: Colors.border },
    attendCount:    { fontFamily: Fonts.condensedBold, fontSize: 28, color: Colors.accent },
    attendUnit:     { fontFamily: Fonts.medium, fontSize: 12, color: Colors.accent, marginLeft: 3 },
    attendLabel:    { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted, letterSpacing: 1 },
    attendRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9 },
    attendRowBorder:{ borderBottomWidth: 1, borderBottomColor: Colors.border },
    attendDot:      { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.green },
    attendDate:     { flex: 1, fontFamily: Fonts.medium, fontSize: 13, color: Colors.text },
    attendTime:     { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted },

    emptyTab:      { alignItems: 'center', paddingVertical: 40, gap: 8 },
    emptyTabEmoji: { fontSize: 30 },
    emptyTabText:  { fontFamily: Fonts.medium, fontSize: 13, color: Colors.textMuted },
  });