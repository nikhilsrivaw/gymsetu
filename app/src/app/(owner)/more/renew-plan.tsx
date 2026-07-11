import {
  View, Text, StyleSheet, ScrollView, Pressable, Modal,
  TextInput, ActivityIndicator, Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect, useCallback } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import FadeInView from '@/components/FadeInView';
import AnimatedPressable from '@/components/AnimatedPressable';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

type ExpiringMember = {
  profileId: string;   // profiles.id
  membersId: string;   // members.id  (used for member_plans)
  name:      string;
  phone:     string | null;
  planName:  string;
  daysLeft:  number;
  initials:  string;
  color:     string;
};

type Plan = {
  id:            string;
  label:         string;
  price:         number;
  duration_days: number;
  tag:           string;
  color:         string;
};

const PLAN_COLORS = ['#4F6EF7', Colors.green, Colors.orange, '#A78BFA'];
const PLAN_TAGS   = ['BASIC', 'POPULAR', 'VALUE', 'BEST'];

const PAY_METHODS: { label: string; icon: IconName; color: string }[] = [
  { label: 'UPI',           icon: 'qrcode-scan',         color: '#4F6EF7'     },
  { label: 'Cash',          icon: 'cash',                color: Colors.green  },
  { label: 'Card',          icon: 'credit-card-outline',  color: Colors.orange },
  { label: 'Bank Transfer', icon: 'bank-outline',         color: Colors.accent },
];

function getInitials(name: string) {
  const p = name.trim().split(' ');
  return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
}
function urgencyColor(days: number) {
  return days <= 0 ? Colors.red : days <= 3 ? Colors.orange : Colors.accent;
}
function urgencyLabel(days: number) {
  return days <= 0 ? 'EXPIRED' : days === 1 ? '1 DAY LEFT' : `${days} DAYS LEFT`;
}

export default function RenewPlanScreen() {
  const { profile, gymProfile } = useAuthStore();
  const params      = useLocalSearchParams<{ memberId?: string }>();
  const gymId       = profile?.gym_id;

  const [members,      setMembers]      = useState<ExpiringMember[]>([]);
  const [plans,        setPlans]        = useState<Plan[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [fetchError,   setFetchError]   = useState('');

  const [selected,       setSelected]       = useState<ExpiringMember | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [payMethod,      setPayMethod]      = useState('Cash');
  const [note,           setNote]           = useState('');
  const [confirming,     setConfirming]     = useState(false);
  const [confirmError,   setConfirmError]   = useState('');
  const [successModal,   setSuccessModal]   = useState(false);

  const load = useCallback(async () => {
    if (!gymId) return;
    setFetchError(''); setLoading(true);
    try {
      const today  = new Date().toISOString().split('T')[0];
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() + 14);
      const cutoffStr = cutoff.toISOString().split('T')[0];

      // ── Step 1: expiring member_plans for this gym ──────────────
      const { data: expPlans, error: expErr } = await supabase
        .from('member_plans')
        .select('id, member_id, end_date, status, membership_plans(name)')
        .eq('gym_id', gymId)
        .in('status', ['active', 'expired'])
        .lte('end_date', cutoffStr)
        .order('end_date', { ascending: true });
      if (expErr) throw expErr;
      if (!expPlans || expPlans.length === 0) {
        setMembers([]); setLoading(false); return;
      }

      // ── Step 2: look up members rows to get user_id (profiles.id) ─
      const memberIds = [...new Set(expPlans.map((p: any) => p.member_id))];
      const { data: membersRows } = await supabase
        .from('members')
        .select('id, user_id, phone')
        .in('id', memberIds);

      // map members.id → user_id, members.id → phone
      const memberToUser: Record<string, string> = {};
      const memberToPhone: Record<string, string | null> = {};
      (membersRows ?? []).forEach((m: any) => { memberToUser[m.id] = m.user_id; memberToPhone[m.id] = m.phone; });

      // ── Step 3: fetch profile names ─────────────────────────────
      const userIds = [...new Set(Object.values(memberToUser))].filter(Boolean);
      const { data: profileRows } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      const userToName: Record<string, string> = {};
      (profileRows ?? []).forEach((p: any) => { userToName[p.id] = p.full_name; });

      // ── Step 4: fetch available plans ──────────────────────────
      const { data: plansData, error: plansErr } = await supabase
        .from('membership_plans')
        .select('id, name, price, duration_days')
        .eq('gym_id', gymId)
        .eq('is_active', true)
        .order('price', { ascending: true });
      if (plansErr) throw plansErr;

      // ── Step 5: build expiring list (deduplicate by membersId) ──
      const todayMs = new Date(today).getTime();
      const seen    = new Set<string>();
      const list: ExpiringMember[] = [];

      for (const p of expPlans as any[]) {
        if (seen.has(p.member_id)) continue;
        seen.add(p.member_id);
        const userId   = memberToUser[p.member_id];
        const name     = userId ? (userToName[userId] ?? 'Unknown') : 'Unknown';
        const daysLeft = Math.ceil((new Date(p.end_date).getTime() - todayMs) / 86_400_000);
        list.push({
          profileId: userId ?? p.member_id,
          membersId: p.member_id,
          name,
          phone:     memberToPhone[p.member_id] ?? null,
          planName:  (p.membership_plans as any)?.name ?? 'Unknown Plan',
          daysLeft,
          initials:  getInitials(name),
          color:     urgencyColor(daysLeft),
        });
      }

      const planList: Plan[] = (plansData ?? []).map((p: any, i: number) => ({
        id:            p.id,
        label:         p.name,
        price:         p.price,
        duration_days: p.duration_days,
        tag:           PLAN_TAGS[i] ?? 'PLAN',
        color:         PLAN_COLORS[i % PLAN_COLORS.length],
      }));

      setMembers(list);
      setPlans(planList);
      if (planList.length > 0) setSelectedPlanId(planList[0].id);

      // Auto-select if navigated from member detail
      if (params.memberId) {
        const pre = list.find(m => m.profileId === params.memberId);
        if (pre) setSelected(pre);
      }
    } catch (e: any) {
      setFetchError(e.message ?? 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [gymId, params.memberId]);

  useEffect(() => { load(); }, [load]);

  const activePlan = plans.find(p => p.id === selectedPlanId);

  const handleConfirm = async () => {
    if (!selected || !activePlan || !gymId || !profile) return;
    Keyboard.dismiss();
    setConfirmError(''); setConfirming(true);
    try {
      const today   = new Date().toISOString().split('T')[0];
      const endDate = new Date(Date.now() + activePlan.duration_days * 86_400_000)
        .toISOString().split('T')[0];

      // Mark previous active plan as expired
      await supabase.from('member_plans')
        .update({ status: 'expired' })
        .eq('member_id', selected.membersId)
        .eq('status', 'active');

      // Insert new plan
      const { error: planErr } = await supabase.from('member_plans').insert({
        member_id:  selected.membersId,
        gym_id:     gymId,
        plan_id:    activePlan.id,
        start_date: today,
        end_date:   endDate,
        status:     'active',
        created_by: profile.id,
      });
      if (planErr) throw planErr;

      // Record payment
      const { error: payErr } = await supabase.from('payments').insert({
        gym_id:         gymId,
        member_id:      selected.membersId,
        amount:         activePlan.price,
        payment_method: payMethod,
        note:           note.trim() || null,
        payment_date:   today,
      });
      if (payErr) throw payErr;

      // Update member status to active
      await supabase.from('profiles').update({ status: 'active' }).eq('id', selected.profileId);

      // Send WhatsApp payment confirmation (fire-and-forget)
      if (selected.phone) {
        supabase.functions.invoke('send-whatsapp', {
          body: {
            type: 'payment_confirm',
            phone: selected.phone,
            gym_id: gymId,
            data: {
              member_name: selected.name,
              amount: activePlan.price.toLocaleString('en-IN'),
              plan_name: activePlan.label,
              gym_name: gymProfile?.name ?? 'Your Gym',
              expiry_date: endDate,
            },
          },
        }).catch(() => {});
      }

      setSuccessModal(true);
    } catch (e: any) {
      setConfirmError(e.message ?? 'Renewal failed. Please try again.');
    } finally {
      setConfirming(false);
    }
  };

  const handleDone = () => { setSuccessModal(false); setSelected(null); setNote(''); load(); };

  const expired  = members.filter(m => m.daysLeft <= 0).length;
  const critical = members.filter(m => m.daysLeft > 0 && m.daysLeft <= 3).length;
  const upcoming = members.filter(m => m.daysLeft > 3).length;

  if (loading) return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <View style={s.center}>
        <ActivityIndicator color={Colors.accent} size="large" />
        <Text style={s.centerText}>Loading members…</Text>
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <ScrollView style={s.container} contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {!!fetchError && (
          <View style={s.errBanner}>
            <MaterialCommunityIcons name="alert-circle-outline" size={15} color={Colors.red} />
            <Text style={s.errText}>{fetchError}</Text>
            <Pressable onPress={load}><Text style={s.retryText}>Retry</Text></Pressable>
          </View>
        )}

        {/* Hero */}
        <FadeInView delay={0}>
          <View style={s.hero}>
            <LinearGradient colors={[Colors.orange + '18', 'transparent']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill} pointerEvents="none" />
            <View style={{ flex: 1 }}>
              <Text style={s.heroMicro}>RENEWAL DASHBOARD</Text>
              <Text style={s.heroTitle}>RENEW PLAN</Text>
              <Text style={s.heroSub}>Expiring in the next 14 days</Text>
            </View>
            <View style={s.heroCount}>
              <Text style={s.heroCountVal}>{members.length}</Text>
              <Text style={s.heroCountLabel}>MEMBERS</Text>
            </View>
          </View>
        </FadeInView>

        {/* Pills */}
        <FadeInView delay={50}>
          <View style={s.pillRow}>
            {[
              { label: 'EXPIRED',  val: expired,  color: Colors.red    },
              { label: 'CRITICAL', val: critical, color: Colors.orange  },
              { label: 'UPCOMING', val: upcoming, color: Colors.accent  },
            ].map(p => (
              <View key={p.label} style={[s.pill, { borderColor: p.color + '30', backgroundColor: p.color + '10' }]}>
                <Text style={[s.pillVal,   { color: p.color }]}>{p.val}</Text>
                <Text style={[s.pillLabel, { color: p.color }]}>{p.label}</Text>
              </View>
            ))}
          </View>
        </FadeInView>

        {/* Empty */}
        {members.length === 0 && !fetchError && (
          <FadeInView delay={80}>
            <View style={s.empty}>
              <View style={s.emptyIcon}>
                <MaterialCommunityIcons name="check-circle-outline" size={32} color={Colors.green} />
              </View>
              <Text style={s.emptyTitle}>All Clear!</Text>
              <Text style={s.emptySub}>No members expiring in the next 14 days.</Text>
            </View>
          </FadeInView>
        )}

        {/* Member list */}
        {members.length > 0 && <Text style={s.sectionLabel}>SELECT MEMBER TO RENEW</Text>}
        {members.map((m, i) => {
          const isSel = selected?.membersId === m.membersId;
          return (
            <FadeInView key={m.membersId} delay={80 + i * 40}>
              <AnimatedPressable
                style={[s.memberCard, isSel && s.memberCardSel]}
                scaleDown={0.97}
                onPress={() => setSelected(isSel ? null : m)}
              >
                <View style={[s.cardBar, { backgroundColor: m.color }]} />
                <View style={[s.avatar, { backgroundColor: m.color + '20', borderColor: m.color + '50' }]}>
                  <Text style={[s.avatarText, { color: m.color }]}>{m.initials}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.memberName}>{m.name}</Text>
                  <Text style={s.memberPlan}>{m.planName}</Text>
                </View>
                <View style={[s.badge, { backgroundColor: m.color + '18', borderColor: m.color + '30' }]}>
                  <Text style={[s.badgeText, { color: m.color }]}>{urgencyLabel(m.daysLeft)}</Text>
                </View>
                {isSel && <MaterialCommunityIcons name="check-circle" size={18} color={Colors.accent} />}
              </AnimatedPressable>
            </FadeInView>
          );
        })}

        {/* Renewal form */}
        {selected && plans.length > 0 && (
          <FadeInView delay={0}>
            <Text style={s.sectionLabel}>SELECT NEW PLAN</Text>
            <View style={s.planGrid}>
              {plans.map((p) => {
                const isAct = selectedPlanId === p.id;
                return (
                  <AnimatedPressable key={p.id}
                    style={[s.planCard, isAct && { borderColor: p.color, backgroundColor: p.color + '10' }]}
                    scaleDown={0.96} onPress={() => setSelectedPlanId(p.id)}>
                    <View style={[s.planTag, { backgroundColor: p.color + '20' }]}>
                      <Text style={[s.planTagText, { color: p.color }]}>{p.tag}</Text>
                    </View>
                    <Text style={[s.planPrice, { color: isAct ? p.color : Colors.text }]}>
                      ₹{p.price.toLocaleString('en-IN')}
                    </Text>
                    <Text style={s.planName2}>{p.label}</Text>
                    <Text style={s.planDays}>{p.duration_days} days</Text>
                    {isAct && (
                      <View style={[s.planCheck, { backgroundColor: p.color }]}>
                        <MaterialCommunityIcons name="check" size={10} color="#fff" />
                      </View>
                    )}
                  </AnimatedPressable>
                );
              })}
            </View>

            <Text style={s.sectionLabel}>PAYMENT METHOD</Text>
            <View style={s.payRow}>
              {PAY_METHODS.map(m => (
                <AnimatedPressable key={m.label} scaleDown={0.95}
                  style={[s.payChip, payMethod === m.label && { borderColor: m.color, backgroundColor: m.color + '12' }]}
                  onPress={() => setPayMethod(m.label)}>
                  <MaterialCommunityIcons name={m.icon} size={15}
                    color={payMethod === m.label ? m.color : Colors.textMuted} />
                  <Text style={[s.payChipText, payMethod === m.label && { color: m.color }]}>{m.label}</Text>
                </AnimatedPressable>
              ))}
            </View>

            <Text style={s.sectionLabel}>NOTE (OPTIONAL)</Text>
            <TextInput value={note} onChangeText={setNote}
              placeholder="Add a note for this renewal..."
              placeholderTextColor={Colors.textMuted}
              style={s.noteInput} multiline numberOfLines={2} />

            {activePlan && (
              <View style={s.summaryCard}>
                <View style={s.summaryBar} />
                <View style={s.summaryInner}>
                  {[
                    { label: 'MEMBER',   val: selected.name,                                  green: false },
                    { label: 'NEW PLAN', val: activePlan.label,                               green: false },
                    { label: 'AMOUNT',   val: `₹${activePlan.price.toLocaleString('en-IN')}`, green: true  },
                    { label: 'PAYMENT',  val: payMethod,                                      green: false },
                  ].map(d => (
                    <View key={d.label} style={s.summaryRow2}>
                      <Text style={s.summaryLabel}>{d.label}</Text>
                      <Text style={[s.summaryVal, d.green && { color: Colors.green }]}>{d.val}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {!!confirmError && (
              <View style={s.errBanner}>
                <MaterialCommunityIcons name="alert-circle-outline" size={15} color={Colors.red} />
                <Text style={s.errText}>{confirmError}</Text>
              </View>
            )}

            <AnimatedPressable style={[s.confirmBtn, confirming && { opacity: 0.7 }]}
              scaleDown={0.97} onPress={handleConfirm} disabled={confirming}>
              <LinearGradient colors={[Colors.accent, '#C55A00']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill} pointerEvents="none" />
              {confirming
                ? <ActivityIndicator color="#fff" size="small" />
                : <>
                    <MaterialCommunityIcons name="autorenew" size={18} color="#fff" />
                    <Text style={s.confirmBtnText}>CONFIRM RENEWAL</Text>
                  </>
              }
            </AnimatedPressable>
          </FadeInView>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Success Modal */}
      <Modal visible={successModal} transparent animationType="fade" onRequestClose={handleDone}>
        <Pressable style={s.backdrop} onPress={handleDone} />
        <View style={s.successSheet}>
          <LinearGradient colors={[Colors.green + '18', 'transparent']}
            start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius: 28 }]} pointerEvents="none" />
          <View style={s.successIconBox}>
            <MaterialCommunityIcons name="check-circle" size={44} color={Colors.green} />
          </View>
          <Text style={s.successTitle}>RENEWAL CONFIRMED!</Text>
          <Text style={s.successSub}>{selected?.name}'s plan has been renewed.</Text>
          {activePlan && (
            <View style={s.successDetail}>
              {[
                { label: 'AMOUNT PAID', val: `₹${activePlan.price.toLocaleString('en-IN')}` },
                { label: 'METHOD',      val: payMethod        },
                { label: 'NEW PLAN',    val: activePlan.label },
                { label: 'VALID FOR',   val: `${activePlan.duration_days} days` },
              ].map((d, i, arr) => (
                <View key={d.label} style={[s.successRow, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: Colors.border }]}>
                  <Text style={s.successLabel}>{d.label}</Text>
                  <Text style={s.successVal}>{d.val}</Text>
                </View>
              ))}
            </View>
          )}
          <AnimatedPressable style={s.successBtn} scaleDown={0.97} onPress={handleDone}>
            <Text style={s.successBtnText}>DONE</Text>
          </AnimatedPressable>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: Colors.bg },
  container: { flex: 1 },
  scroll:    { paddingHorizontal: 16, paddingBottom: 32, paddingTop: 16 },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  centerText:{ fontFamily: Fonts.regular, fontSize: 14, color: Colors.textMuted },

  errBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.red + '15', borderRadius: 10, borderWidth: 1, borderColor: Colors.red + '30', paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 },
  errText:   { flex: 1, fontFamily: Fonts.regular, fontSize: 12, color: Colors.red },
  retryText: { fontFamily: Fonts.bold, fontSize: 12, color: Colors.accent },

  hero:          { backgroundColor: Colors.bgCard, borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderColor: Colors.orange + '30', overflow: 'hidden', marginBottom: 12 },
  heroMicro:     { fontFamily: Fonts.bold, fontSize: 9, color: Colors.orange, letterSpacing: 1.5 },
  heroTitle:     { fontFamily: Fonts.condensedBold, fontSize: 30, color: Colors.text, letterSpacing: 0.5 },
  heroSub:       { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  heroCount:     { alignItems: 'center', backgroundColor: Colors.orange + '15', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: Colors.orange + '25' },
  heroCountVal:  { fontFamily: Fonts.condensedBold, fontSize: 28, color: Colors.orange },
  heroCountLabel:{ fontFamily: Fonts.bold, fontSize: 8, color: Colors.orange, letterSpacing: 1 },

  pillRow:   { flexDirection: 'row', gap: 8, marginBottom: 20 },
  pill:      { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, borderWidth: 1, gap: 2 },
  pillVal:   { fontFamily: Fonts.condensedBold, fontSize: 22 },
  pillLabel: { fontFamily: Fonts.bold, fontSize: 8, letterSpacing: 0.8 },

  empty:     { alignItems: 'center', gap: 10, paddingVertical: 48, backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: Colors.green + '20' },
  emptyIcon: { width: 60, height: 60, borderRadius: 18, backgroundColor: Colors.green + '12', borderWidth: 1, borderColor: Colors.green + '25', justifyContent: 'center', alignItems: 'center' },
  emptyTitle:{ fontFamily: Fonts.condensedBold, fontSize: 20, color: Colors.text },
  emptySub:  { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted },

  sectionLabel: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted, letterSpacing: 1.8, marginBottom: 10, marginTop: 4 },

  memberCard:    { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.bgCard, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', marginBottom: 8 },
  memberCardSel: { borderColor: Colors.accent + '60', backgroundColor: Colors.accent + '08' },
  cardBar:       { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  avatar:        { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5 },
  avatarText:    { fontFamily: Fonts.condensedBold, fontSize: 14 },
  memberName:    { fontFamily: Fonts.bold, fontSize: 14, color: Colors.text },
  memberPlan:    { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  badge:         { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1 },
  badgeText:     { fontFamily: Fonts.bold, fontSize: 9, letterSpacing: 0.6 },

  planGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  planCard:    { width: '48%', backgroundColor: Colors.bgCard, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.border, padding: 14, gap: 4, overflow: 'hidden' },
  planTag:     { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, marginBottom: 4 },
  planTagText: { fontFamily: Fonts.bold, fontSize: 8, letterSpacing: 0.8 },
  planPrice:   { fontFamily: Fonts.condensedBold, fontSize: 24 },
  planName2:   { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted },
  planDays:    { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted, letterSpacing: 0.5 },
  planCheck:   { position: 'absolute', top: 10, right: 10, width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },

  payRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  payChip:     { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border },
  payChipText: { fontFamily: Fonts.bold, fontSize: 10, color: Colors.textMuted, letterSpacing: 0.5 },

  noteInput:   { backgroundColor: Colors.bgCard, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 12, fontFamily: Fonts.regular, fontSize: 13, color: Colors.text, marginBottom: 20, textAlignVertical: 'top' },

  summaryCard:  { flexDirection: 'row', backgroundColor: Colors.bgCard, borderRadius: 14, borderWidth: 1, borderColor: Colors.green + '30', overflow: 'hidden', marginBottom: 16 },
  summaryBar:   { width: 3, backgroundColor: Colors.green },
  summaryInner: { flex: 1, padding: 14, gap: 8 },
  summaryRow2:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted, letterSpacing: 1 },
  summaryVal:   { fontFamily: Fonts.bold, fontSize: 13, color: Colors.text },

  confirmBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 16, paddingVertical: 16, overflow: 'hidden' },
  confirmBtnText: { fontFamily: Fonts.bold, fontSize: 14, color: '#fff', letterSpacing: 1.2 },

  backdrop:       { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)' },
  successSheet:   { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.bgCard, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingBottom: 40, paddingTop: 32, alignItems: 'center', overflow: 'hidden' },
  successIconBox: { width: 72, height: 72, borderRadius: 20, backgroundColor: Colors.green + '15', borderWidth: 1, borderColor: Colors.green + '30', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  successTitle:   { fontFamily: Fonts.condensedBold, fontSize: 26, color: Colors.text, letterSpacing: 0.5, marginBottom: 6 },
  successSub:     { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, textAlign: 'center', marginBottom: 24 },
  successDetail:  { width: '100%', backgroundColor: Colors.bgElevated, borderRadius: 14, overflow: 'hidden', marginBottom: 24 },
  successRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  successLabel:   { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted, letterSpacing: 1 },
  successVal:     { fontFamily: Fonts.bold, fontSize: 13, color: Colors.text },
  successBtn:     { width: '100%', backgroundColor: Colors.green, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  successBtnText: { fontFamily: Fonts.bold, fontSize: 13, color: '#000', letterSpacing: 1.5 },
});
