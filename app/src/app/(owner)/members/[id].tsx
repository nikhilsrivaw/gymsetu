import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Linking, TextInput,
  ActivityIndicator, TouchableOpacity, Share, Modal, Pressable, Alert,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import LottieView from '@/components/AppLottie';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import AnimatedPressable from '@/components/AnimatedPressable';
import FadeInView from '@/components/FadeInView';
import { supabase } from '@/lib/supabase';
import { askAI } from '@/lib/ai';
import { useAuthStore } from '@/store/authStore';

import { toLocalDate, todayLocal } from '@/lib/date';
interface GymPlan { id: string; name: string; price: number; duration_days: number; }

type TabKey  = 'info' | 'plans' | 'payments' | 'attendance';
type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const tabs: { key: TabKey; label: string; icon: IconName }[] = [
  { key: 'info',       label: 'INFO',      icon: 'account-outline'        },
  { key: 'plans',      label: 'PLANS',     icon: 'clipboard-list-outline' },
  { key: 'payments',   label: 'PAYMENTS',  icon: 'cash-multiple'          },
  { key: 'attendance', label: 'ATTENDANCE',icon: 'calendar-check-outline' },
];

interface MemberProfile {
  id: string; full_name: string; phone: string | null;
  email: string | null; gender: string | null; date_of_birth: string | null;
  join_date: string | null; height_cm: number | null; weight_kg: number | null;
  goal: string | null; status: string | null; gym_id: string | null;
  created_at: string; member_code: string | null; member_password: string | null;
  trainer_id: string | null;
}
interface GymTrainer { id: string; name: string; specialization: string | null; status: string; }
interface PlanRow    { id: string; planName: string; startDate: string; endDate: string; rawEndDate: string; status: string; price: number; }
interface PaymentRow { id: string; date: string; planName: string; amount: number; method: string; planId: string | null; }
interface AttendRow  { id: string; date: string; time: string; }

const goalLabel: Record<string, string> = {
  weight_loss: 'Weight Loss', muscle_gain: 'Muscle Gain',
  general_fitness: 'General Fitness', other: 'Other',
};

const fmtMoney = (n: number) =>
  n >= 100000 ? `₹${(n / 100000).toFixed(1)}L`
  : n >= 1000  ? `₹${(n / 1000).toFixed(1)}K`
  : `₹${n.toLocaleString('en-IN')}`;

export default function MemberProfileScreen() {
  const { id }  = useLocalSearchParams<{ id: string }>();
  const router  = useRouter();
  const { profile } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabKey>('info');

  // Renew / upgrade
  const [membersTableId, setMembersTableId] = useState<string | null>(null);
  const [gymPlans,   setGymPlans]   = useState<GymPlan[]>([]);
  const [showRenew,  setShowRenew]  = useState(false);
  const [renewPlanId, setRenewPlanId] = useState('');
  const [renewMethod, setRenewMethod] = useState<'cash' | 'upi' | 'card'>('cash');
  // Blank = collecting the full plan price; less leaves a balance due.
  const [renewAmount, setRenewAmount] = useState('');
  const [renewing,   setRenewing]   = useState(false);
  const [freezing,   setFreezing]   = useState(false);
  const [collecting, setCollecting] = useState(false);

  const [member,         setMember]         = useState<MemberProfile | null>(null);
  const [plans,          setPlans]          = useState<PlanRow[]>([]);
  const [payments,       setPayments]       = useState<PaymentRow[]>([]);
  const [attendance,     setAttendance]     = useState<AttendRow[]>([]);
  const [thisMonthCount, setThisMonthCount] = useState(0);
  const [loading,        setLoading]        = useState(true);
  const [availablePlans, setAvailablePlans] = useState('');

  const [gymTrainers,      setGymTrainers]      = useState<GymTrainer[]>([]);
  const [assignedTrainer,  setAssignedTrainer]  = useState<GymTrainer | null>(null);
  const [showTrainerModal, setShowTrainerModal] = useState(false);
  const [assigning,        setAssigning]        = useState(false);

  const [aiRenewalMsg,     setAiRenewalMsg]     = useState<string | null>(null);
  const [aiRenewalLoading, setAiRenewalLoading] = useState(false);
  const [aiRenewalError,   setAiRenewalError]   = useState('');
  const [aiPlanRec,        setAiPlanRec]        = useState<string | null>(null);
  const [aiPlanLoading,    setAiPlanLoading]    = useState(false);
  const [aiPlanError,      setAiPlanError]      = useState('');

  const today      = todayLocal();
  const monthStart = today.slice(0, 8) + '01';

  useFocusEffect(useCallback(() => {
    if (!id) return;
    let active = true;
    async function load() {
      setLoading(true);
      try {
        // member_plans.member_id references members.id, NOT profiles.id
        // Look up the members table row first so we query plans correctly
        const { data: memberRow } = await supabase
          .from('members')
          .select('id')
          .eq('user_id', id)
          .maybeSingle();
        const membersTableId = memberRow?.id ?? id; // fallback to profiles.id
        if (active) setMembersTableId(membersTableId);

        const [memberRes, plansRes, paymentsRes, attRes, attCountRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', id).single(),
          supabase.from('member_plans')
            .select('id, start_date, end_date, status, membership_plans(name, price)')
            .eq('member_id', membersTableId).order('created_at', { ascending: false }),
          supabase.from('payments')
            .select('id, amount, payment_date, payment_method, member_plan_id, payment_type, member_plans(membership_plans(name))')
            .eq('member_id', membersTableId).order('payment_date', { ascending: false }),
          supabase.from('attendance')
            .select('id, check_in_date, check_in_time')
            .eq('member_id', id).order('check_in_date', { ascending: false }).limit(30),
          supabase.from('attendance')
            .select('id', { count: 'exact', head: true })
            .eq('member_id', id).gte('check_in_date', monthStart),
        ]);
        if (!active) { setLoading(false); return; }
        if (memberRes.data) {
          const m = memberRes.data as MemberProfile;
          setMember(m);

          // Fetch gym trainers + assigned trainer in parallel
          const [gymPlansRes, trainersRes] = await Promise.all([
            supabase.from('membership_plans').select('id, name, price, duration_days')
              .eq('gym_id', m.gym_id).eq('is_active', true).order('price', { ascending: true }),
            supabase.from('profiles').select('id, full_name, specialization, status')
              .eq('gym_id', m.gym_id).eq('role', 'trainer').eq('status', 'active'),
          ]);
          const gp: GymPlan[] = (gymPlansRes.data ?? []).map((p: any) => ({
            id: p.id, name: p.name, price: p.price, duration_days: p.duration_days,
          }));
          if (active) setGymPlans(gp);
          setAvailablePlans(gp.map(p => `${p.name} (Rs.${p.price}, ${p.duration_days} days)`).join(', '));

          const trainerList: GymTrainer[] = (trainersRes.data ?? []).map((t: any) => ({
            id: t.id, name: t.full_name, specialization: t.specialization, status: t.status,
          }));
          setGymTrainers(trainerList);
          if (m.trainer_id) {
            setAssignedTrainer(trainerList.find(t => t.id === m.trainer_id) ?? null);
          } else {
            setAssignedTrainer(null);
          }
        }
        setPlans((plansRes.data ?? []).map((p: any) => ({
          id: p.id, planName: p.membership_plans?.name ?? 'Plan',
          startDate: new Date(p.start_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          endDate:   new Date(p.end_date).toLocaleDateString('en-IN',   { day: '2-digit', month: 'short', year: 'numeric' }),
          rawEndDate: p.end_date, status: p.status, price: p.membership_plans?.price ?? 0,
        })));
        setPayments((paymentsRes.data ?? []).map((p: any) => ({
          id: p.id, date: new Date(p.payment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          planName: p.member_plans?.membership_plans?.name ?? 'Membership',
          amount: p.amount, method: p.payment_method, planId: p.member_plan_id ?? null,
        })));
        setAttendance((attRes.data ?? []).map((a: any) => ({
          id: a.id,
          date: new Date(a.check_in_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
          time: a.check_in_time ?? '—',
        })));
        setThisMonthCount(attCountRes.count ?? 0);
      } catch (err) {
        console.error('[MemberProfile] load error:', err);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [id, monthStart]));

  const handleAIRenewal = async () => {
    if (!member) return;
    setAiRenewalLoading(true); setAiRenewalMsg(null); setAiRenewalError('');
    const activePlan = plans.find(p => p.status === 'active');
    const daysLeft   = activePlan?.rawEndDate
      ? Math.max(0, Math.ceil((new Date(activePlan.rawEndDate).getTime() - Date.now()) / 86400000)) : 0;
    try {
      setAiRenewalMsg(await askAI('renewal_message', {
        memberName: member.full_name, planName: activePlan?.planName ?? 'membership',
        daysLeft, gymName: 'GymSetu',
      }));
    } catch { setAiRenewalError('Could not generate message. Try again.'); }
    setAiRenewalLoading(false);
  };

  const handleAIPlanRec = async () => {
    if (!member) return;
    setAiPlanLoading(true); setAiPlanRec(null); setAiPlanError('');
    const activePlan = plans.find(p => p.status === 'active');
    try {
      setAiPlanRec(await askAI('plan_recommender', {
        goal: member.goal ?? 'general fitness', currentPlan: activePlan?.planName ?? 'none',
        visitFrequency: thisMonthCount, availablePlans: availablePlans || 'various plans available',
      }));
    } catch { setAiPlanError('Could not generate recommendation. Try again.'); }
    setAiPlanLoading(false);
  };

  const handleAssignTrainer = async (trainer: GymTrainer | null) => {
    if (!member) return;
    setAssigning(true);
    try {
      const { error } = await supabase.from('profiles')
        .update({ trainer_id: trainer?.id ?? null })
        .eq('id', member.id);
      if (error) throw error;
      setAssignedTrainer(trainer);
      setMember(prev => prev ? { ...prev, trainer_id: trainer?.id ?? null } : prev);
    } catch (e: any) {
      console.error('[AssignTrainer]', e.message);
    } finally {
      setAssigning(false);
      setShowTrainerModal(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────
  if (loading || !member) return (
    <>
      <Stack.Screen options={{ title: '', headerStyle: { backgroundColor: Colors.bg }, headerTintColor: Colors.text }} />
      <View style={s.loadingContainer}>
        <LottieView source={require('@/assets/animations/Turkey Power Walk.json')} autoPlay loop style={s.loadingLottie} />
        <Text style={s.loadingTitle}>LOADING PROFILE</Text>
        <Text style={s.loadingSub}>Fetching member data...</Text>
      </View>
    </>
  );

  const memberStatus = member.status ?? 'inactive';
  const statusColor  = memberStatus === 'active' ? Colors.green
                     : memberStatus === 'expired' ? Colors.red
                     : memberStatus === 'frozen'  ? '#3B82F6'
                     : Colors.orange;
  const initials     = member.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const joinDate     = member.join_date ?? member.created_at;
  // A frozen plan is still the member's current plan — it is just paused.
  const activePlan   = plans.find(p => p.status === 'active');
  const frozenPlan   = plans.find(p => p.status === 'frozen');
  const currentPlan  = activePlan ?? frozenPlan;
  const isFrozen     = !!frozenPlan;
  const totalSpend   = payments.reduce((sum, p) => sum + p.amount, 0);

  // Balance on the current plan = its price minus everything paid against it.
  // A plan with no linked payment at all is NOT treated as fully unpaid: that
  // is exactly the shape of a member migrated from the gym's old system, who
  // paid before GymSetu existed and gets no payment row by design. Showing
  // them the full price as "due" would invent a debt. A balance is only
  // claimed once at least one payment references this plan.
  const paidOnCurrent = currentPlan
    ? payments.filter(p => p.planId === currentPlan.id).reduce((s, p) => s + p.amount, 0)
    : 0;
  const balanceDue = currentPlan && payments.some(p => p.planId === currentPlan.id)
    ? Math.max(0, currentPlan.price - paidOnCurrent)
    : 0;

  const fmtDay = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  // Collect an outstanding balance: another payment row against the same plan,
  // so the dues arithmetic stays a simple sum rather than a mutable field.
  const handleCollectDue = async () => {
    if (!member || !membersTableId || !currentPlan || balanceDue <= 0) return;
    setCollecting(true);
    try {
      const today = todayLocal();
      const { error } = await supabase.from('payments').insert({
        gym_id: member.gym_id, member_id: membersTableId, member_plan_id: currentPlan.id,
        amount: balanceDue, payment_method: renewMethod, payment_date: today,
        payment_type: 'full', notes: `${currentPlan.planName} — balance`,
        created_by: profile?.id ?? null,
      });
      if (error) throw new Error(error.message);
      setPayments(prev => [
        { id: `tmp-due-${Date.now()}`, date: fmtDay(today), planName: `${currentPlan.planName} — balance`,
          amount: balanceDue, method: renewMethod, planId: currentPlan.id },
        ...prev,
      ]);
      Alert.alert('Balance collected', `₹${balanceDue.toLocaleString('en-IN')} recorded. A receipt was saved to their Invoices.`);
    } catch (e) {
      Alert.alert('Could not record payment', e instanceof Error ? e.message : 'Please try again.');
    } finally { setCollecting(false); }
  };

  // Freeze pauses the countdown; resume pushes end_date out by the days paused.
  // Both go through RPCs so member_plans/members/profiles can't drift apart —
  // the daily WhatsApp cron reads members.status, so a half-applied freeze
  // would keep nudging someone who is away.
  const handleFreezeToggle = async () => {
    const plan = currentPlan;
    if (!plan) return;
    if (isFrozen) {
      setFreezing(true);
      try {
        const { data, error } = await supabase.rpc('resume_member_plan', { p_plan_id: plan.id });
        if (error) throw new Error(error.message);
        const newEnd = typeof data === 'string' ? data : plan.rawEndDate;
        setPlans(prev => prev.map(p => p.id === plan.id
          ? { ...p, status: 'active', rawEndDate: newEnd, endDate: fmtDay(newEnd) } : p));
        setMember(prev => (prev ? { ...prev, status: 'active' } : prev));
        Alert.alert('Membership resumed', `${member.full_name}'s plan now runs to ${fmtDay(newEnd)}.`);
      } catch (e) {
        Alert.alert('Could not resume', e instanceof Error ? e.message : 'Please try again.');
      } finally { setFreezing(false); }
      return;
    }

    Alert.alert(
      'Freeze membership?',
      `${member.full_name}'s plan stops counting down from today. When you resume, the paused days are added back to their expiry. They won't get expiry or attendance reminders while frozen.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Freeze', onPress: async () => {
          setFreezing(true);
          try {
            const { error } = await supabase.rpc('freeze_member_plan', { p_plan_id: plan.id });
            if (error) throw new Error(error.message);
            setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, status: 'frozen' } : p));
            setMember(prev => (prev ? { ...prev, status: 'frozen' } : prev));
            Alert.alert('Membership frozen', `${member.full_name}'s plan is paused. Resume it any time.`);
          } catch (e) {
            Alert.alert('Could not freeze', e instanceof Error ? e.message : 'Please try again.');
          } finally { setFreezing(false); }
        } },
      ],
    );
  };

  const handleRenew = async () => {
    if (!member || !membersTableId) return;
    const plan = gymPlans.find(p => p.id === renewPlanId);
    if (!plan) { Alert.alert('Select a plan', 'Please choose a plan to continue.'); return; }
    setRenewing(true);
    try {
      // Renewal: if the current plan hasn't lapsed yet, extend from its end date;
      // otherwise (or on upgrade of an expired member) start today.
      const now    = Date.now();
      const curEnd = activePlan?.rawEndDate ? new Date(activePlan.rawEndDate).getTime() : 0;
      const base   = curEnd > now ? curEnd : now;
      const startDate = toLocalDate(new Date(base));
      const endDate   = toLocalDate(new Date(base + plan.duration_days * 86_400_000));
      const today     = todayLocal();

      await supabase.from('member_plans').update({ status: 'expired' })
        .eq('member_id', membersTableId).eq('status', 'active');

      const { data: planRow, error: planErr } = await supabase.from('member_plans').insert({
        member_id: membersTableId, gym_id: member.gym_id, plan_id: plan.id,
        start_date: startDate, end_date: endDate, status: 'active', created_by: profile?.id ?? null,
      }).select('id').single();
      if (planErr) throw new Error(planErr.message);

      // Records the payment → shows up as the member's invoice. member_plan_id
      // ties it to this plan so any balance is computable.
      const collected = renewAmount.trim() === '' ? plan.price : Number(renewAmount) || 0;
      const { error: payErr } = await supabase.from('payments').insert({
        gym_id: member.gym_id, member_id: membersTableId, member_plan_id: planRow?.id ?? null,
        amount: collected,
        payment_method: renewMethod, payment_date: today,
        payment_type: collected < plan.price ? 'partial' : 'full',
        notes: plan.name, created_by: profile?.id ?? null,
      });
      if (payErr) console.warn('[renew] payment record failed:', payErr.message);

      await supabase.from('profiles').update({ status: 'active' }).eq('id', id);

      // Reflect immediately.
      setPlans(prev => [
        // Use the real inserted id so the payment below links to it and the
        // balance-due arithmetic works before the next refetch.
        { id: planRow?.id ?? `tmp-${now}`, planName: plan.name, startDate: fmtDay(startDate), endDate: fmtDay(endDate),
          rawEndDate: endDate, status: 'active', price: plan.price },
        ...prev.map(p => (p.status === 'active' ? { ...p, status: 'expired' } : p)),
      ]);
      setPayments(prev => [
        { id: `tmp-pay-${now}`, date: fmtDay(today), planName: plan.name, amount: collected,
          method: renewMethod, planId: planRow?.id ?? null },
        ...prev,
      ]);

      setShowRenew(false);
      setRenewPlanId('');
      setRenewAmount('');
      Alert.alert('Plan updated', `${member.full_name} is now on ${plan.name}. A receipt was saved to their Invoices.`);
    } catch (e) {
      Alert.alert('Could not update plan', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setRenewing(false);
    }
  };

  // ── Tab content renderer ──────────────────────────────────────
  const renderContent = () => {
    if (activeTab === 'info') {
      const rows: { label: string; value: string; icon: IconName }[] = [
        { label: 'PHONE',  icon: 'phone-outline',          value: member.phone ?? '—' },
        { label: 'EMAIL',  icon: 'email-outline',          value: member.email ?? '—' },
        { label: 'GENDER', icon: 'gender-male-female',     value: member.gender ?? '—' },
        { label: 'DOB',    icon: 'cake-variant-outline',   value: member.date_of_birth ? new Date(member.date_of_birth).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—' },
        { label: 'JOINED', icon: 'calendar-plus',          value: new Date(joinDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) },
        { label: 'HEIGHT', icon: 'human-male-height',      value: member.height_cm ? `${member.height_cm} cm` : '—' },
        { label: 'WEIGHT', icon: 'weight-kilogram',        value: member.weight_kg ? `${member.weight_kg} kg` : '—' },
        { label: 'GOAL',   icon: 'flag-outline',           value: member.goal ? (goalLabel[member.goal] ?? member.goal) : '—' },
      ];
      return (
        <View>
          {rows.map((row, i) => (
            <View key={row.label} style={[s.infoRow, s.infoRowBorder]}>
              <View style={s.infoIconBox}>
                <MaterialCommunityIcons name={row.icon} size={15} color={Colors.textMuted} />
              </View>
              <Text style={s.infoLabel}>{row.label}</Text>
              <Text style={s.infoValue} numberOfLines={1}>{row.value}</Text>
            </View>
          ))}

          {/* Trainer assignment row */}
          <View style={[s.infoRow, { alignItems: 'flex-start', paddingVertical: 12 }]}>
            <View style={s.infoIconBox}>
              <MaterialCommunityIcons name="whistle-outline" size={15} color={Colors.accent} />
            </View>
            <Text style={[s.infoLabel, { paddingTop: 2 }]}>TRAINER</Text>
            <View style={{ flex: 1, alignItems: 'flex-end', gap: 6 }}>
              {assignedTrainer ? (
                <View style={s.trainerChip}>
                  <View style={s.trainerChipDot} />
                  <Text style={s.trainerChipName} numberOfLines={1}>{assignedTrainer.name}</Text>
                </View>
              ) : (
                <Text style={[s.infoValue, { color: Colors.textMuted }]}>Not assigned</Text>
              )}
              <TouchableOpacity
                style={s.assignTrainerBtn}
                onPress={() => setShowTrainerModal(true)}
                activeOpacity={0.75}
              >
                <MaterialCommunityIcons name="account-switch-outline" size={11} color={Colors.accent} />
                <Text style={s.assignTrainerBtnText}>
                  {assignedTrainer ? 'CHANGE' : 'ASSIGN'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    if (activeTab === 'plans') {
      if (!plans.length) return <EmptyTab icon="clipboard-list-outline" text="No plans assigned yet" />;
      return (
        <View style={s.tabContent}>
          {plans.map(p => {
            const c = p.status === 'active' ? Colors.green
                    : p.status === 'frozen' ? '#3B82F6'
                    : Colors.textMuted;
            return (
              <View key={p.id} style={s.planCard}>
                <LinearGradient
                  colors={[c + '10', 'transparent']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill} pointerEvents="none"
                />
                <View style={[s.planBar, { backgroundColor: c }]} />
                <View style={s.planInner}>
                  <View style={s.planTop}>
                    <Text style={s.planName} numberOfLines={1}>{p.planName}</Text>
                    <View style={[s.statusChip, { backgroundColor: c + '18', borderColor: c + '40' }]}>
                      <View style={[s.chipDot, { backgroundColor: c }]} />
                      <Text style={[s.chipText, { color: c }]}>{p.status.toUpperCase()}</Text>
                    </View>
                  </View>
                  <View style={s.planMeta}>
                    <MaterialCommunityIcons name="calendar-range-outline" size={12} color={Colors.textMuted} />
                    <Text style={s.planDates}>{p.startDate}  →  {p.endDate}</Text>
                  </View>
                  <Text style={[s.planPrice, { color: c }]}>{fmtMoney(p.price)}</Text>
                </View>
              </View>
            );
          })}
        </View>
      );
    }

    if (activeTab === 'payments') {
      if (!payments.length) return <EmptyTab icon="cash-multiple" text="No payments recorded yet" />;
      return (
        <View style={s.tabContent}>
          {/* Lifetime spend strip */}
          <View style={s.lifetimeStrip}>
            <LinearGradient
              colors={[Colors.green + '12', 'transparent']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill} pointerEvents="none"
            />
            <View style={[s.lifetimeIcon, { backgroundColor: Colors.green + '18' }]}>
              <MaterialCommunityIcons name="cash-multiple" size={16} color={Colors.green} />
            </View>
            <View>
              <Text style={s.lifetimeLabel}>LIFETIME VALUE</Text>
              <Text style={[s.lifetimeVal, { color: Colors.green }]}>{fmtMoney(totalSpend)}</Text>
            </View>
          </View>

          {payments.map((p, i) => (
            <View key={p.id} style={[s.payRow, i < payments.length - 1 && s.rowBorder]}>
              <View style={[s.payIconBox, { backgroundColor: Colors.green + '14' }]}>
                <MaterialCommunityIcons name="credit-card-check-outline" size={16} color={Colors.green} />
              </View>
              <View style={s.payLeft}>
                <Text style={s.payPlan} numberOfLines={1}>{p.planName}</Text>
                <Text style={s.payMeta}>{p.date}  ·  {p.method.replace('_', ' ').toUpperCase()}</Text>
              </View>
              <Text style={s.payAmount}>+{fmtMoney(p.amount)}</Text>
            </View>
          ))}
        </View>
      );
    }

    if (activeTab === 'attendance') {
      if (!attendance.length) return <EmptyTab icon="calendar-check-outline" text="No attendance records yet" />;
      return (
        <View style={s.tabContent}>
          {/* Month / total strip */}
          <View style={s.attendStrip}>
            <View style={s.attendStripItem}>
              <Text style={[s.attendBigNum, { color: Colors.accent }]}>{thisMonthCount}</Text>
              <Text style={s.attendBigLabel}>THIS MONTH</Text>
            </View>
            <View style={s.attendStripDivider} />
            <View style={s.attendStripItem}>
              <Text style={[s.attendBigNum, { color: Colors.text }]}>{attendance.length}</Text>
              <Text style={s.attendBigLabel}>RECENT RECORDS</Text>
            </View>
          </View>

          {attendance.map((a, i) => (
            <View key={a.id} style={[s.attendRow, i < attendance.length - 1 && s.rowBorder]}>
              <View style={s.attendIconBox}>
                <MaterialCommunityIcons name="check-circle-outline" size={16} color={Colors.accent} />
              </View>
              <View style={s.attendInfo}>
                <Text style={s.attendDate}>{a.date}</Text>
                <Text style={s.attendTime}>{a.time}</Text>
              </View>
              <View style={[s.attendBadge, { backgroundColor: Colors.accent + '14' }]}>
                <MaterialCommunityIcons name="login" size={11} color={Colors.accent} />
                <Text style={s.attendBadgeText}>CHECK IN</Text>
              </View>
            </View>
          ))}
        </View>
      );
    }
    return null;
  };

  return (
    <>
      <Stack.Screen options={{ title: '', headerStyle: { backgroundColor: Colors.bg }, headerTintColor: Colors.text }} />
      <ScrollView style={s.container} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Hero ── */}
        <FadeInView delay={0}>
          <View style={s.hero}>
            {/* Background gradient */}
            <LinearGradient
              colors={[statusColor + '22', statusColor + '06', 'transparent']}
              start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFill} pointerEvents="none"
            />

            {/* Avatar */}
            <View style={[s.avatarRing, { borderColor: statusColor + '50', shadowColor: statusColor }]}>
              <View style={[s.avatarCore, { backgroundColor: statusColor + '18' }]}>
                <Text style={[s.avatarInitials, { color: statusColor }]}>{initials}</Text>
              </View>
            </View>

            <Text style={s.heroName}>{member.full_name}</Text>

            {/* Status chip */}
            <View style={[s.statusChip, { backgroundColor: statusColor + '14', borderColor: statusColor + '40' }]}>
              <View style={[s.chipDot, { backgroundColor: statusColor }]} />
              <Text style={[s.chipText, { color: statusColor }]}>{memberStatus.toUpperCase()}</Text>
            </View>

            {/* Active plan pill */}
            {activePlan && (
              <View style={s.heroPlanRow}>
                <MaterialCommunityIcons name="clipboard-check-outline" size={12} color={Colors.textMuted} />
                <Text style={s.heroPlan}>{activePlan.planName}  ·  Exp {activePlan.endDate}</Text>
              </View>
            )}

            {/* Member code */}
            {member.member_code && (
              <View style={s.heroCodePill}>
                <MaterialCommunityIcons name="identifier" size={11} color={Colors.accent} />
                <Text style={s.heroCodeText}>{member.member_code}</Text>
              </View>
            )}
          </View>
        </FadeInView>

        {/* ── Stats strip ── */}
        <FadeInView delay={50}>
          <View style={s.statsStrip}>
            {[
              { label: 'VISITS THIS MONTH', value: String(thisMonthCount), color: Colors.accent, icon: 'calendar-check-outline' as IconName },
              { label: 'TOTAL PLANS',       value: String(plans.length),   color: '#3B82F6',     icon: 'clipboard-list-outline' as IconName },
              { label: 'LIFETIME VALUE',    value: fmtMoney(totalSpend),   color: Colors.green,  icon: 'cash-multiple'          as IconName },
            ].map((stat, i) => (
              <View key={i} style={[s.statCell, i < 2 && s.statCellBorder]}>
                <View style={[s.statIconBox, { backgroundColor: stat.color + '15', borderColor: stat.color + '25' }]}>
                  <MaterialCommunityIcons name={stat.icon} size={13} color={stat.color} />
                </View>
                <Text style={[s.statNum, { color: stat.color }]}>{stat.value}</Text>
                <Text style={s.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </FadeInView>

        {/* ── Action buttons ── */}
        <FadeInView delay={80}>
          {/* Row 1: Contact */}
          <View style={s.actionRow}>
            <AnimatedPressable
              style={s.actionBtnHalf} scaleDown={0.95}
              onPress={() => member.phone && Linking.openURL(`tel:${member.phone}`)}
            >
              <View style={[s.actionBigIcon, { backgroundColor: '#3B82F615', borderColor: '#3B82F625' }]}>
                <MaterialCommunityIcons name="phone-outline" size={22} color="#3B82F6" />
              </View>
              <View>
                <Text style={[s.actionBtnTitle, { color: '#3B82F6' }]}>Call Member</Text>
                <Text style={s.actionBtnSub}>{member.phone ?? 'No number'}</Text>
              </View>
            </AnimatedPressable>

            <AnimatedPressable
              style={s.actionBtnHalf} scaleDown={0.95}
              onPress={() => member.phone && Linking.openURL(`https://wa.me/${member.phone.replace(/\D/g, '')}`)}
            >
              <View style={[s.actionBigIcon, { backgroundColor: Colors.green + '15', borderColor: Colors.green + '25' }]}>
                <MaterialCommunityIcons name="whatsapp" size={22} color={Colors.green} />
              </View>
              <View>
                <Text style={[s.actionBtnTitle, { color: Colors.green }]}>WhatsApp</Text>
                <Text style={s.actionBtnSub}>Send message</Text>
              </View>
            </AnimatedPressable>
          </View>

          {/* Row 1b: Outstanding balance on the current plan */}
          {balanceDue > 0 && (
            <View style={s.dueBanner}>
              <MaterialCommunityIcons name="alert-circle-outline" size={20} color={Colors.orange} />
              <View style={{ flex: 1 }}>
                <Text style={s.dueTitle}>₹{balanceDue.toLocaleString('en-IN')} due</Text>
                <Text style={s.dueSub}>
                  Paid ₹{paidOnCurrent.toLocaleString('en-IN')} of ₹{currentPlan!.price.toLocaleString('en-IN')} for {currentPlan!.planName}
                </Text>
              </View>
              <AnimatedPressable
                style={s.dueBtn}
                scaleDown={0.93}
                onPress={handleCollectDue}
                disabled={collecting}
              >
                {collecting
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={s.dueBtnText}>COLLECT</Text>}
              </AnimatedPressable>
            </View>
          )}

          {/* Row 2: Renew / Upgrade (full width primary) */}
          <AnimatedPressable
            style={s.renewBtn} scaleDown={0.97}
            onPress={() => { setRenewPlanId(''); setRenewMethod('cash'); setRenewAmount(''); setShowRenew(true); }}
          >
            <LinearGradient
              colors={[Colors.accent, '#C55A00']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill} pointerEvents="none"
            />
            <MaterialCommunityIcons name="autorenew" size={20} color="#fff" />
            <View>
              <Text style={s.renewBtnTitle}>Renew / Upgrade Plan</Text>
              <Text style={s.renewBtnSub}>
                {isFrozen        ? 'Paused — resume to continue'
                  : currentPlan  ? `Expires ${currentPlan.endDate}`
                  : 'No active plan'}
              </Text>
            </View>
            <View style={{ flex: 1 }} />
            <MaterialCommunityIcons name="chevron-right" size={20} color="#fff" />
          </AnimatedPressable>

          {/* Row 2b: Freeze / Resume — only meaningful with a plan to pause */}
          {currentPlan && (
            <AnimatedPressable
              style={[s.freezeBtn, isFrozen && s.freezeBtnActive]}
              scaleDown={0.97}
              onPress={handleFreezeToggle}
              disabled={freezing}
            >
              {freezing
                ? <ActivityIndicator size="small" color="#3B82F6" />
                : <MaterialCommunityIcons
                    name={isFrozen ? 'play-circle-outline' : 'pause-circle-outline'}
                    size={20} color="#3B82F6" />}
              <View>
                <Text style={s.freezeBtnTitle}>
                  {isFrozen ? 'Resume Membership' : 'Freeze Membership'}
                </Text>
                <Text style={s.freezeBtnSub}>
                  {isFrozen
                    ? 'Paused days get added back to expiry'
                    : 'Pause the plan for travel or injury'}
                </Text>
              </View>
              <View style={{ flex: 1 }} />
              <MaterialCommunityIcons name="chevron-right" size={20} color="#3B82F6" />
            </AnimatedPressable>
          )}

          {/* Row 3: Edit */}
          <AnimatedPressable
            style={s.editBtn} scaleDown={0.97}
            onPress={() => router.push({ pathname: '/(owner)/members/edit', params: { memberId: id } })}
          >
            <View style={[s.actionBigIcon, { backgroundColor: '#A78BFA15', borderColor: '#A78BFA25' }]}>
              <MaterialCommunityIcons name="pencil-outline" size={20} color="#A78BFA" />
            </View>
            <View>
              <Text style={[s.actionBtnTitle, { color: '#A78BFA' }]}>Edit Member</Text>
              <Text style={s.actionBtnSub}>Update info & details</Text>
            </View>
            <View style={{ flex: 1 }} />
            <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.textMuted} />
          </AnimatedPressable>
        </FadeInView>

        {/* ── Credentials ── */}
        <CredentialsCard code={member.member_code} password={member.member_password} />

        {/* ── AI Tools ── */}
        <FadeInView delay={100}>
          <View style={s.aiCard}>
            {/* Header */}
            <View style={s.aiCardHeader}>
              <View style={s.aiCardTitleRow}>
                <View style={s.aiIconBox}>
                  <MaterialCommunityIcons name="robot-outline" size={15} color={Colors.accent} />
                </View>
                <Text style={s.aiCardTitle}>AI TOOLS</Text>
              </View>
              <View style={s.aiLivePill}>
                <View style={s.aiLiveDot} />
                <Text style={s.aiLiveText}>LIVE</Text>
              </View>
            </View>

            {/* Renewal message */}
            <AnimatedPressable style={s.aiRow} scaleDown={0.98} onPress={handleAIRenewal}>
              <View style={s.aiRowLeft}>
                <View style={[s.aiRowIcon, { backgroundColor: Colors.accent + '18' }]}>
                  <MaterialCommunityIcons name="message-text-outline" size={16} color={Colors.accent} />
                </View>
                <View>
                  <Text style={s.aiRowTitle}>Renewal Message</Text>
                  <Text style={s.aiRowSub}>Generate WhatsApp reminder</Text>
                </View>
              </View>
              {aiRenewalLoading
                ? <ActivityIndicator size="small" color={Colors.accent} />
                : <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.textMuted} />}
            </AnimatedPressable>

            {!!aiRenewalError && <Text style={s.aiErrorText}>{aiRenewalError}</Text>}
            {aiRenewalMsg && (
              <View style={[s.aiOutput, { borderLeftColor: Colors.accent }]}>
                <Text style={s.aiOutputText}>{aiRenewalMsg}</Text>
                <TouchableOpacity
                  style={s.aiSendBtn}
                  onPress={() => member.phone && Linking.openURL(
                    'https://wa.me/' + member.phone.replace(/\D/g, '') + '?text=' + encodeURIComponent(aiRenewalMsg)
                  )}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="whatsapp" size={14} color={Colors.green} />
                  <Text style={s.aiSendBtnText}>SEND ON WHATSAPP</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={s.aiSeparator} />

            {/* Plan recommendation */}
            <AnimatedPressable style={s.aiRow} scaleDown={0.98} onPress={handleAIPlanRec}>
              <View style={s.aiRowLeft}>
                <View style={[s.aiRowIcon, { backgroundColor: '#A78BFA18' }]}>
                  <MaterialCommunityIcons name="star-circle-outline" size={16} color="#A78BFA" />
                </View>
                <View>
                  <Text style={s.aiRowTitle}>Plan Recommendation</Text>
                  <Text style={s.aiRowSub}>Best plan for this member</Text>
                </View>
              </View>
              {aiPlanLoading
                ? <ActivityIndicator size="small" color="#A78BFA" />
                : <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.textMuted} />}
            </AnimatedPressable>

            {!!aiPlanError && <Text style={s.aiErrorText}>{aiPlanError}</Text>}
            {aiPlanRec && (
              <View style={[s.aiOutput, { borderLeftColor: '#A78BFA' }]}>
                <Text style={s.aiOutputText}>{aiPlanRec}</Text>
              </View>
            )}
          </View>
        </FadeInView>

        {/* ── Tab bar ── */}
        <FadeInView delay={120}>
          <ScrollView
            horizontal showsHorizontalScrollIndicator={false}
            style={s.tabBarScroll}
            contentContainerStyle={s.tabBarContent}
          >
            {tabs.map(t => {
              const active = activeTab === t.key;
              return (
                <AnimatedPressable
                  key={t.key}
                  style={[s.tab, active && s.tabActive]}
                  onPress={() => setActiveTab(t.key)}
                  scaleDown={0.94}
                >
                  <MaterialCommunityIcons
                    name={t.icon}
                    size={15}
                    color={active ? Colors.accent : Colors.textMuted}
                  />
                  <Text style={[s.tabText, active && s.tabTextActive]}>{t.label}</Text>
                  {active && <View style={s.tabAccentBar} />}
                </AnimatedPressable>
              );
            })}
          </ScrollView>
        </FadeInView>

        {/* ── Tab content ── */}
        <FadeInView delay={140}>
          <View style={s.contentCard}>{renderContent()}</View>
        </FadeInView>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Trainer Assignment Modal ── */}
      <Modal visible={showTrainerModal} transparent animationType="slide">
        <Pressable style={s.backdrop} onPress={() => !assigning && setShowTrainerModal(false)} />
        <View style={s.trainerSheet}>
          <View style={s.sheetHandle} />

          {/* Header */}
          <View style={s.sheetTopRow}>
            <View style={s.sheetTitleRow}>
              <View style={s.sheetIconBox}>
                <MaterialCommunityIcons name="whistle-outline" size={18} color={Colors.accent} />
              </View>
              <View>
                <Text style={s.sheetTitle}>ASSIGN TRAINER</Text>
                <Text style={s.sheetSub}>Select a trainer for {member?.full_name?.split(' ')[0]}</Text>
              </View>
            </View>
            <Pressable style={s.closeBtn} onPress={() => !assigning && setShowTrainerModal(false)}>
              <MaterialCommunityIcons name="close" size={16} color={Colors.textMuted} />
            </Pressable>
          </View>

          {/* Currently assigned */}
          {assignedTrainer && (
            <View style={s.currentTrainerBanner}>
              <MaterialCommunityIcons name="check-circle-outline" size={14} color={Colors.green} />
              <Text style={s.currentTrainerText}>Currently: <Text style={{ color: Colors.text }}>{assignedTrainer.name}</Text></Text>
            </View>
          )}

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 8 }}>
            {gymTrainers.length === 0 && (
              <View style={s.noTrainersBox}>
                <MaterialCommunityIcons name="account-off-outline" size={28} color={Colors.textMuted} />
                <Text style={s.noTrainersText}>No active trainers found.</Text>
                <Text style={s.noTrainersSubText}>Add trainers first from the Trainers section.</Text>
              </View>
            )}

            {gymTrainers.map(t => {
              const isSelected = assignedTrainer?.id === t.id;
              const tInitials  = t.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
              return (
                <AnimatedPressable
                  key={t.id}
                  style={[s.trainerOptionRow, isSelected && s.trainerOptionRowActive]}
                  scaleDown={0.97}
                  onPress={() => handleAssignTrainer(t)}
                  disabled={assigning}
                >
                  <View style={[s.trainerOptionAvatar, isSelected && { backgroundColor: Colors.accent + '28', borderColor: Colors.accent }]}>
                    <Text style={[s.trainerOptionInitials, isSelected && { color: Colors.accent }]}>{tInitials}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.trainerOptionName, isSelected && { color: Colors.accent }]}>{t.name}</Text>
                    <Text style={s.trainerOptionSpec}>{t.specialization ?? 'General Trainer'}</Text>
                  </View>
                  {assigning && isSelected
                    ? <ActivityIndicator size="small" color={Colors.accent} />
                    : isSelected
                      ? <MaterialCommunityIcons name="check-circle" size={20} color={Colors.accent} />
                      : <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.textMuted} />
                  }
                </AnimatedPressable>
              );
            })}

            {/* Remove trainer option */}
            {assignedTrainer && (
              <AnimatedPressable
                style={s.removeTrainerBtn}
                scaleDown={0.97}
                onPress={() => handleAssignTrainer(null)}
                disabled={assigning}
              >
                <MaterialCommunityIcons name="account-remove-outline" size={16} color={Colors.red} />
                <Text style={s.removeTrainerText}>Remove Trainer Assignment</Text>
              </AnimatedPressable>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* ── Renew / Upgrade Plan Modal ── */}
      <Modal visible={showRenew} transparent animationType="slide">
        <Pressable style={s.backdrop} onPress={() => !renewing && setShowRenew(false)} />
        <View style={s.trainerSheet}>
          <View style={s.sheetHandle} />

          <View style={s.sheetTopRow}>
            <View style={s.sheetTitleRow}>
              <View style={s.sheetIconBox}>
                <MaterialCommunityIcons name="autorenew" size={18} color={Colors.accent} />
              </View>
              <View>
                <Text style={s.sheetTitle}>RENEW / UPGRADE PLAN</Text>
                <Text style={s.sheetSub}>Renew or move {member?.full_name?.split(' ')[0]} to a new plan</Text>
              </View>
            </View>
            <Pressable style={s.closeBtn} onPress={() => !renewing && setShowRenew(false)}>
              <MaterialCommunityIcons name="close" size={16} color={Colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
            {gymPlans.length === 0 ? (
              <View style={s.noTrainersBox}>
                <MaterialCommunityIcons name="clipboard-alert-outline" size={28} color={Colors.textMuted} />
                <Text style={s.noTrainersText}>No active plans found.</Text>
                <Text style={s.noTrainersSubText}>Create plans first in the Plans tab.</Text>
              </View>
            ) : (
              <>
                <Text style={s.rnLabel}>CHOOSE PLAN</Text>
                <View style={s.rnPlanGrid}>
                  {gymPlans.map(p => {
                    const on = renewPlanId === p.id;
                    const isCurrent = activePlan?.planName === p.name;
                    return (
                      <Pressable key={p.id} style={[s.rnPlanCard, on && s.rnPlanCardOn]} onPress={() => setRenewPlanId(p.id)}>
                        <View style={s.rnPlanTop}>
                          <MaterialCommunityIcons name={on ? 'check-circle' : 'circle-outline'} size={15} color={on ? Colors.accent : Colors.textMuted} />
                          <Text style={[s.rnPlanName, on && { color: Colors.text }]} numberOfLines={1}>{p.name}</Text>
                        </View>
                        <Text style={[s.rnPlanPrice, on && { color: Colors.accent }]}>₹{p.price.toLocaleString('en-IN')}</Text>
                        <Text style={s.rnPlanDays}>{p.duration_days} days{isCurrent ? ' · current' : ''}</Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={[s.rnLabel, { marginTop: 16 }]}>PAID VIA</Text>
                <View style={s.rnPayRow}>
                  {(['cash', 'upi', 'card'] as const).map(m => {
                    const on = renewMethod === m;
                    return (
                      <Pressable key={m} style={[s.rnChip, on && s.rnChipOn]} onPress={() => setRenewMethod(m)}>
                        <Text style={[s.rnChipTxt, on && { color: Colors.green }]}>{m.toUpperCase()}</Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={[s.rnLabel, { marginTop: 16 }]}>AMOUNT COLLECTED</Text>
                <TextInput
                  style={s.rnAmountInput}
                  value={renewAmount}
                  onChangeText={(t: string) => setRenewAmount(t.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                  placeholder={String(gymPlans.find(p => p.id === renewPlanId)?.price ?? 0)}
                  placeholderTextColor={Colors.textMuted}
                />

                {(() => {
                  const price     = gymPlans.find(p => p.id === renewPlanId)?.price ?? 0;
                  const collected = renewAmount.trim() === '' ? price : Number(renewAmount) || 0;
                  const due       = Math.max(0, price - collected);
                  return (
                    <>
                      <Pressable
                        style={[s.rnConfirm, (!renewPlanId || renewing) && { opacity: 0.5 }]}
                        disabled={!renewPlanId || renewing}
                        onPress={handleRenew}
                      >
                        {renewing
                          ? <ActivityIndicator size="small" color="#fff" />
                          : <>
                              <MaterialCommunityIcons name="check" size={17} color="#fff" />
                              <Text style={s.rnConfirmTxt}>
                                Confirm{renewPlanId ? ` · ₹${collected.toLocaleString('en-IN')}` : ''} &amp; save invoice
                              </Text>
                            </>}
                      </Pressable>
                      <Text style={s.rnFoot}>
                        {due > 0
                          ? `Part payment — ₹${due.toLocaleString('en-IN')} stays due on this plan. You can collect it later from this screen.`
                          : "Records the payment and saves a receipt to the member's Invoices."}
                      </Text>
                    </>
                  );
                })()}
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

// ── Credentials card ─────────────────────────────────────────────────────────
function CredentialsCard({ code, password }: { code: string | null; password: string | null }) {
  const [showPass, setShowPass] = useState(false);
  if (!code) return null;

  const handleShare = () => {
    Share.share({ message: `Your GymSetu login credentials:\nMember ID: ${code}\nPassword: ${password ?? '—'}` });
  };

  return (
    <FadeInView delay={90}>
      <View style={s.credCard}>
        <LinearGradient
          colors={[Colors.accent + '10', 'transparent']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill} pointerEvents="none"
        />
        {/* Header */}
        <View style={s.credHeader}>
          <View style={s.credHeaderLeft}>
            <View style={s.credIconBox}>
              <MaterialCommunityIcons name="key-variant" size={14} color={Colors.accent} />
            </View>
            <Text style={s.credTitle}>LOGIN CREDENTIALS</Text>
          </View>
          <TouchableOpacity style={s.credShareBtn} onPress={handleShare} activeOpacity={0.7}>
            <MaterialCommunityIcons name="share-variant-outline" size={13} color={Colors.accent} />
            <Text style={s.credShareText}>SHARE</Text>
          </TouchableOpacity>
        </View>

        {/* ID row */}
        <View style={s.credRow}>
          <Text style={s.credLabel}>MEMBER ID</Text>
          <Text style={s.credValue}>{code}</Text>
        </View>

        <View style={s.credSep} />

        {/* Password row */}
        <View style={s.credRow}>
          <Text style={s.credLabel}>PASSWORD</Text>
          <View style={s.credPassRow}>
            <Text style={s.credValue}>{showPass ? (password ?? '—') : '••••••••'}</Text>
            <TouchableOpacity style={s.credEyeBtn} onPress={() => setShowPass(v => !v)} activeOpacity={0.7}>
              <MaterialCommunityIcons
                name={showPass ? 'eye-off-outline' : 'eye-outline'}
                size={14} color={Colors.textMuted}
              />
              <Text style={s.credEyeText}>{showPass ? 'HIDE' : 'SHOW'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Warning */}
        <View style={s.credWarn}>
          <MaterialCommunityIcons name="shield-alert-outline" size={13} color={Colors.orange} />
          <Text style={s.credWarnText}>Keep these private — share only with the member directly</Text>
        </View>
      </View>
    </FadeInView>
  );
}

// ── Empty tab ─────────────────────────────────────────────────────────────────
function EmptyTab({ icon, text }: { icon: IconName; text: string }) {
  return (
    <View style={s.emptyTab}>
      <View style={s.emptyIconBox}>
        <MaterialCommunityIcons name={icon} size={28} color={Colors.textMuted + '60'} />
      </View>
      <Text style={s.emptyText}>{text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  loadingContainer: { flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' },
  loadingLottie:    { width: 200, height: 200 },
  loadingTitle:     { fontFamily: Fonts.condensedBold, fontSize: 20, color: Colors.text, letterSpacing: 4, marginTop: 8 },
  loadingSub:       { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textMuted, marginTop: 6 },

  container: { flex: 1, backgroundColor: Colors.bg },
  scroll:    { paddingBottom: 40 },

  // ── Hero ─────────────────────────────────────────────────────
  hero: {
    alignItems: 'center', paddingTop: 28, paddingBottom: 24,
    paddingHorizontal: 16, overflow: 'hidden',
  },
  avatarRing: {
    width: 108, height: 108, borderRadius: 54, borderWidth: 2,
    justifyContent: 'center', alignItems: 'center',
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.55, shadowRadius: 24, elevation: 12,
  },
  avatarCore:     { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center' },
  avatarInitials: { fontFamily: Fonts.condensedBold, fontSize: 36 },
  heroName:       { fontFamily: Fonts.condensedBold, fontSize: 32, color: Colors.text, marginTop: 16, letterSpacing: 0.5, textAlign: 'center' },
  heroPlanRow:    { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  heroPlan:       { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted },
  heroCodePill:   { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10, backgroundColor: Colors.accentMuted, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: Colors.accent + '30' },
  heroCodeText:   { fontFamily: Fonts.bold, fontSize: 11, color: Colors.accent, letterSpacing: 1 },

  statusChip: { flexDirection: 'row', alignItems: 'center', marginTop: 10, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, gap: 6, borderWidth: 1 },
  chipDot:    { width: 6, height: 6, borderRadius: 3 },
  chipText:   { fontFamily: Fonts.bold, fontSize: 10, letterSpacing: 1.2 },

  // ── Stats strip ──────────────────────────────────────────────
  statsStrip:     { flexDirection: 'row', marginHorizontal: 16, marginBottom: 14, backgroundColor: Colors.bgCard, borderRadius: 18, borderWidth: 1, borderColor: Colors.border },
  statCell:       { flex: 1, alignItems: 'center', paddingVertical: 16, gap: 6 },
  statCellBorder: { borderRightWidth: 1, borderRightColor: Colors.border },
  statIconBox:    { width: 28, height: 28, borderRadius: 8, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  statNum:        { fontFamily: Fonts.condensedBold, fontSize: 22, color: Colors.text },
  statLabel:      { fontFamily: Fonts.bold, fontSize: 7, color: Colors.textMuted, letterSpacing: 0.8, textAlign: 'center' },

  // ── Action buttons ───────────────────────────────────────────
  actionRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 10 },
  actionBtnHalf: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.bgCard, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: Colors.border,
  },
  actionBigIcon: { width: 42, height: 42, borderRadius: 12, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  actionBtnTitle:{ fontFamily: Fonts.bold, fontSize: 13, color: Colors.text },
  actionBtnSub:  { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted, marginTop: 2 },

  renewBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginHorizontal: 16, marginBottom: 10, borderRadius: 16,
    paddingHorizontal: 18, paddingVertical: 16, overflow: 'hidden',
  },
  renewBtnTitle: { fontFamily: Fonts.bold, fontSize: 15, color: '#fff' },
  renewBtnSub:   { fontFamily: Fonts.regular, fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  rnAmountInput: {
    backgroundColor: Colors.bgElevated, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 14, paddingVertical: 12, marginTop: 8,
    fontFamily: Fonts.bold, fontSize: 15, color: Colors.text,
  },

  dueBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.orange + '12', borderRadius: 14,
    borderWidth: 1, borderColor: Colors.orange + '40',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  dueTitle:   { fontFamily: Fonts.bold, fontSize: 15, color: Colors.orange },
  dueSub:     { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  dueBtn: {
    backgroundColor: Colors.orange, borderRadius: 9,
    paddingHorizontal: 14, paddingVertical: 9, minWidth: 78,
    alignItems: 'center', justifyContent: 'center',
  },
  dueBtnText: { fontFamily: Fonts.bold, fontSize: 10, color: '#fff', letterSpacing: 0.5 },

  freezeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.bgCard, borderRadius: 14,
    borderWidth: 1, borderColor: '#3B82F640',
    paddingHorizontal: 16, paddingVertical: 14, overflow: 'hidden',
  },
  freezeBtnActive: { backgroundColor: '#3B82F612', borderColor: '#3B82F6' },
  freezeBtnTitle:  { fontFamily: Fonts.bold, fontSize: 15, color: Colors.text },
  freezeBtnSub:    { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 2 },

  // Renew / upgrade modal
  rnLabel:     { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted, letterSpacing: 1.5, marginBottom: 10 },
  rnPlanGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  rnPlanCard:  { width: '48%', backgroundColor: Colors.bgInput, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, padding: 12 },
  rnPlanCardOn:{ borderColor: Colors.accent, backgroundColor: Colors.accent + '10' },
  rnPlanTop:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  rnPlanName:  { fontFamily: Fonts.bold, fontSize: 12, color: Colors.textSub, flex: 1 },
  rnPlanPrice: { fontFamily: Fonts.condensedBold, fontSize: 20, color: Colors.text },
  rnPlanDays:  { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted, marginTop: 1 },
  rnPayRow:    { flexDirection: 'row', gap: 8 },
  rnChip:      { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgInput },
  rnChipOn:    { borderColor: Colors.green, backgroundColor: Colors.green + '15' },
  rnChipTxt:   { fontFamily: Fonts.bold, fontSize: 11, color: Colors.textMuted, letterSpacing: 0.8 },
  rnConfirm:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 15, marginTop: 20 },
  rnConfirmTxt:{ fontFamily: Fonts.bold, fontSize: 14, color: '#fff', letterSpacing: 0.3 },
  rnFoot:      { fontFamily: Fonts.regular, fontSize: 10.5, color: Colors.textMuted, textAlign: 'center', marginTop: 12, lineHeight: 15 },

  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginHorizontal: 16, marginBottom: 14, borderRadius: 16,
    paddingHorizontal: 18, paddingVertical: 14,
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
  },

  // ── Credentials card ─────────────────────────────────────────
  credCard:        { marginHorizontal: 16, marginBottom: 14, backgroundColor: Colors.bgCard, borderRadius: 18, borderWidth: 1, borderColor: Colors.accent + '30', overflow: 'hidden' },
  credHeader:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  credHeaderLeft:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  credIconBox:     { width: 28, height: 28, borderRadius: 8, backgroundColor: Colors.accentMuted, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.accent + '30' },
  credTitle:       { fontFamily: Fonts.bold, fontSize: 10, color: Colors.accent, letterSpacing: 2 },
  credShareBtn:    { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.accentMuted, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: Colors.accent + '35' },
  credShareText:   { fontFamily: Fonts.bold, fontSize: 9, color: Colors.accent, letterSpacing: 1 },
  credRow:         { paddingHorizontal: 16, paddingVertical: 16, gap: 5 },
  credLabel:       { fontFamily: Fonts.bold, fontSize: 8, color: Colors.textMuted, letterSpacing: 2 },
  credValue:       { fontFamily: Fonts.condensedBold, fontSize: 28, color: Colors.text, letterSpacing: 1.5 },
  credPassRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  credEyeBtn:      { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.bgElevated, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  credEyeText:     { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted, letterSpacing: 0.8 },
  credSep:         { height: 1, backgroundColor: Colors.border, marginHorizontal: 16 },
  credWarn:        { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.orange + '10', borderTopWidth: 1, borderTopColor: Colors.orange + '20', paddingHorizontal: 16, paddingVertical: 11 },
  credWarnText:    { fontFamily: Fonts.regular, fontSize: 11, color: Colors.orange, flex: 1, lineHeight: 16 },

  // ── AI card ──────────────────────────────────────────────────
  aiCard:       { marginHorizontal: 16, marginBottom: 14, backgroundColor: Colors.bgCard, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  aiCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  aiCardTitleRow:{ flexDirection: 'row', alignItems: 'center', gap: 8 },
  aiIconBox:    { width: 28, height: 28, borderRadius: 8, backgroundColor: Colors.accentMuted, justifyContent: 'center', alignItems: 'center' },
  aiCardTitle:  { fontFamily: Fonts.bold, fontSize: 10, color: Colors.accent, letterSpacing: 2 },
  aiLivePill:   { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.green + '14', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4, borderWidth: 1, borderColor: Colors.green + '30' },
  aiLiveDot:    { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.green },
  aiLiveText:   { fontFamily: Fonts.bold, fontSize: 8, color: Colors.green, letterSpacing: 1 },
  aiRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16 },
  aiRowLeft:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  aiRowIcon:    { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  aiRowTitle:   { fontFamily: Fonts.bold, fontSize: 14, color: Colors.text },
  aiRowSub:     { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  aiSeparator:  { height: 1, backgroundColor: Colors.border, marginHorizontal: 16 },
  aiOutput:     { marginHorizontal: 16, marginBottom: 16, marginTop: 2, backgroundColor: Colors.bgElevated, borderRadius: 12, padding: 14, borderLeftWidth: 3, borderWidth: 1, borderColor: Colors.border },
  aiOutputText: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, lineHeight: 20 },
  aiSendBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12, borderRadius: 10, paddingVertical: 10, borderWidth: 1, borderColor: Colors.green + '40', backgroundColor: Colors.green + '10' },
  aiSendBtnText:{ fontFamily: Fonts.bold, fontSize: 11, color: Colors.green, letterSpacing: 1 },
  aiErrorText:  { fontFamily: Fonts.regular, fontSize: 12, color: Colors.red, paddingHorizontal: 16, paddingBottom: 10 },

  // ── Tab bar ──────────────────────────────────────────────────
  tabBarScroll:  { marginHorizontal: 16, marginBottom: 10 },
  tabBarContent: { gap: 8, paddingVertical: 2 },
  tab:           { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 16, paddingVertical: 11, borderRadius: 12, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, position: 'relative', overflow: 'hidden' },
  tabActive:     { backgroundColor: Colors.accent + '10', borderColor: Colors.accent + '40' },
  tabText:       { fontFamily: Fonts.bold, fontSize: 11, color: Colors.textMuted, letterSpacing: 0.5 },
  tabTextActive: { color: Colors.accent },
  tabAccentBar:  { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, borderRadius: 1, backgroundColor: Colors.accent },

  // ── Content card ─────────────────────────────────────────────
  contentCard: { marginHorizontal: 16, backgroundColor: Colors.bgCard, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },

  // INFO tab
  infoRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  infoIconBox:   { width: 28, height: 28, borderRadius: 8, backgroundColor: Colors.bgElevated, justifyContent: 'center', alignItems: 'center' },
  infoLabel:     { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted, letterSpacing: 1.2, width: 52 },
  infoValue:     { fontFamily: Fonts.medium, fontSize: 14, color: Colors.text, flex: 1, textAlign: 'right' },

  // Shared
  tabContent: { padding: 14, gap: 10 },
  rowBorder:  { borderBottomWidth: 1, borderBottomColor: Colors.border },

  // PLANS tab
  planCard:  { borderRadius: 14, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', flexDirection: 'row' },
  planBar:   { width: 3 },
  planInner: { flex: 1, padding: 14, gap: 6 },
  planTop:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planName:  { fontFamily: Fonts.bold, fontSize: 15, color: Colors.text, flex: 1, marginRight: 8 },
  planMeta:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
  planDates: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted },
  planPrice: { fontFamily: Fonts.condensedBold, fontSize: 22 },

  // PAYMENTS tab
  lifetimeStrip: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.bgElevated, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.green + '25', overflow: 'hidden', marginBottom: 4 },
  lifetimeIcon:  { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  lifetimeLabel: { fontFamily: Fonts.bold, fontSize: 8, color: Colors.textMuted, letterSpacing: 1.2 },
  lifetimeVal:   { fontFamily: Fonts.condensedBold, fontSize: 24, marginTop: 2 },
  payRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13 },
  payIconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  payLeft:    { flex: 1 },
  payPlan:    { fontFamily: Fonts.bold, fontSize: 13, color: Colors.text },
  payMeta:    { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 3 },
  payAmount:  { fontFamily: Fonts.condensedBold, fontSize: 18, color: Colors.green },

  // ATTENDANCE tab
  attendStrip:       { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgElevated, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, marginBottom: 4 },
  attendStripItem:   { flex: 1, alignItems: 'center', paddingVertical: 14 },
  attendBigNum:      { fontFamily: Fonts.condensedBold, fontSize: 36 },
  attendBigLabel:    { fontFamily: Fonts.bold, fontSize: 8, color: Colors.textMuted, letterSpacing: 1, marginTop: 4 },
  attendStripDivider:{ width: 1, height: 44, backgroundColor: Colors.border },
  attendRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  attendIconBox:{ width: 32, height: 32, borderRadius: 9, backgroundColor: Colors.accent + '14', justifyContent: 'center', alignItems: 'center' },
  attendInfo:  { flex: 1 },
  attendDate:  { fontFamily: Fonts.bold, fontSize: 13, color: Colors.text },
  attendTime:  { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  attendBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 4 },
  attendBadgeText: { fontFamily: Fonts.bold, fontSize: 8, color: Colors.accent, letterSpacing: 0.5 },

  // Empty
  emptyTab:    { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyIconBox:{ width: 56, height: 56, borderRadius: 16, backgroundColor: Colors.bgElevated, justifyContent: 'center', alignItems: 'center' },
  emptyText:   { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted },

  // Trainer assignment (INFO tab)
  trainerChip:     { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.accent + '14', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: Colors.accent + '30' },
  trainerChipDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.accent },
  trainerChipName: { fontFamily: Fonts.bold, fontSize: 12, color: Colors.accent },
  assignTrainerBtn:{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.accentMuted, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4, borderWidth: 1, borderColor: Colors.accent + '35' },
  assignTrainerBtnText: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.accent, letterSpacing: 0.8 },

  // Trainer assignment modal
  backdrop:     { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.65)' },
  trainerSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.bgCard, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 18, paddingTop: 12, paddingBottom: 32, maxHeight: '80%' },
  sheetHandle:  { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: 14 },
  sheetTopRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sheetTitleRow:{ flexDirection: 'row', alignItems: 'center', gap: 10 },
  sheetIconBox: { width: 42, height: 42, borderRadius: 12, backgroundColor: Colors.accent + '15', borderWidth: 1, borderColor: Colors.accent + '30', justifyContent: 'center', alignItems: 'center' },
  sheetTitle:   { fontFamily: Fonts.condensedBold, fontSize: 22, color: Colors.text, letterSpacing: 0.5 },
  sheetSub:     { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  closeBtn:     { width: 30, height: 30, borderRadius: 9, backgroundColor: Colors.bgElevated, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },

  currentTrainerBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.green + '12', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: Colors.green + '25', marginBottom: 12 },
  currentTrainerText:   { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, flex: 1 },

  noTrainersBox:    { alignItems: 'center', paddingVertical: 36, gap: 8 },
  noTrainersText:   { fontFamily: Fonts.bold, fontSize: 14, color: Colors.textMuted },
  noTrainersSubText:{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, textAlign: 'center' },

  trainerOptionRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.bgElevated, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border },
  trainerOptionRowActive: { backgroundColor: Colors.accent + '0C', borderColor: Colors.accent + '40' },
  trainerOptionAvatar:    { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  trainerOptionInitials:  { fontFamily: Fonts.condensedBold, fontSize: 16, color: Colors.textMuted },
  trainerOptionName:      { fontFamily: Fonts.bold, fontSize: 14, color: Colors.text },
  trainerOptionSpec:      { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 2 },

  removeTrainerBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.red + '10', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.red + '28', marginTop: 4 },
  removeTrainerText: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.red, letterSpacing: 0.5 },
});
