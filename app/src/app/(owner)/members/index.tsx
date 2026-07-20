import { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, TextInput as RNTextInput,
  Animated, Pressable, Linking,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, Stack, useFocusEffect } from 'expo-router';
import LottieView from '@/components/AppLottie';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import AnimatedPressable from '@/components/AnimatedPressable';
import FadeInView from '@/components/FadeInView';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { askAI } from '@/lib/ai';

type FilterType   = 'all' | 'active' | 'expired' | 'frozen' | 'dues';
type MemberStatus = 'active' | 'expired' | 'suspended' | 'inactive' | 'frozen';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const filters: { label: string; value: FilterType; color: string; icon: IconName }[] = [
  { label: 'All',       value: 'all',       color: '#A0A0B0',    icon: 'account-group-outline' },
  { label: 'Active',    value: 'active',    color: Colors.green, icon: 'check-circle-outline'  },
  { label: 'Expired',   value: 'expired',   color: Colors.red,   icon: 'clock-alert-outline'   },
  { label: 'Frozen',    value: 'frozen',    color: '#3B82F6',   icon: 'pause-circle-outline'  },
  { label: 'Dues',      value: 'dues',      color: Colors.red,   icon: 'currency-inr'          },
];

const statusColors: Record<MemberStatus, string> = {
  active:    Colors.green,
  expired:   Colors.red,
  frozen:    '#3B82F6',
  suspended: Colors.orange,
  inactive:  Colors.textMuted,
};

const statusIcons: Record<MemberStatus, IconName> = {
  active:    'check-circle',
  expired:   'clock-alert',
  frozen:    'pause-circle',
  suspended: 'pause-circle',
  inactive:  'minus-circle',
};

interface MemberRow {
  id:            string;
  full_name:     string;
  phone:         string | null;
  status:        MemberStatus;
  plan_name:     string;
  expiry_date:   string;
  rawExpiryDate: string;
  due:           number;   // plan price − payments made against it
}

const getRisk = (m: MemberRow): 'high' | 'medium' | null => {
  if (m.status === 'expired') return 'high';
  if (m.status !== 'active' || !m.rawExpiryDate) return null;
  const daysLeft = Math.ceil((new Date(m.rawExpiryDate).getTime() - Date.now()) / 86400000);
  if (daysLeft <= 3) return 'high';
  if (daysLeft <= 7) return 'medium';
  return null;
};

const deriveStatus = (plans: any[]): MemberStatus => {
  if (!plans || plans.length === 0) return 'inactive';
  // A frozen plan outranks history: the member is paused, not lapsed.
  if (plans.some(p => p.status === 'frozen')) return 'frozen';
  const active = plans.find(p => p.status === 'active');
  if (active) return 'active';
  const latest = plans[0];
  if (latest?.end_date && new Date(latest.end_date) < new Date()) return 'expired';
  return 'inactive';
};

export default function MembersListScreen() {
  const { profile, activeGymId, branches } = useAuthStore();
  const router = useRouter();

  const [search, setSearch]               = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [filter, setFilter]               = useState<FilterType>('all');
  const [members, setMembers]             = useState<MemberRow[]>([]);
  const [loading, setLoading]             = useState(true);
  const [fetchError, setFetchError]       = useState('');
  const [aiRiskSummary, setAiRiskSummary] = useState<string | null>(null);
  const [aiRiskLoading, setAiRiskLoading] = useState(false);
  const [aiRiskError, setAiRiskError]     = useState('');
  const [allGoodMsg, setAllGoodMsg]       = useState(false);
  const [aiExpanded, setAiExpanded]       = useState(false);

  const fetchMembers = useCallback(async () => {
    const mainGymId = profile?.gym_id;
    if (!mainGymId) return;

    setLoading(true);
    setFetchError('');

    const gymIds: string[] =
      activeGymId === 'all'
        ? (branches.length > 0 ? branches.map(b => b.id) : [mainGymId])
        : [activeGymId ?? mainGymId];

    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, phone')
        .in('gym_id', gymIds)
        .eq('role', 'member')
        .order('full_name', { ascending: true });

      if (profileError) throw profileError;

      if (!profileData || profileData.length === 0) {
        setMembers([]);
        return;
      }

      const profileIds = profileData.map(m => m.id);

      const { data: memberRows } = await supabase
        .from('members')
        .select('id, user_id')
        .in('user_id', profileIds)
        .in('gym_id', gymIds);

      const profileToMemberId: Record<string, string> = {};
      (memberRows ?? []).forEach((m: any) => {
        if (m.user_id) profileToMemberId[m.user_id] = m.id;
      });

      const memberTableIds = profileIds
        .map(id => profileToMemberId[id])
        .filter(Boolean) as string[];

      const planLookupIds = memberTableIds.length > 0 ? memberTableIds : profileIds;

      const { data: planData } = await supabase
        .from('member_plans')
        .select('id, member_id, end_date, status, plan_id')
        .in('member_id', planLookupIds);

      const planIds = [...new Set((planData ?? []).map((p: any) => p.plan_id).filter(Boolean))];
      const planNames:  Record<string, string> = {};
      const planPrices: Record<string, number> = {};

      if (planIds.length > 0) {
        const { data: mpData } = await supabase
          .from('membership_plans')
          .select('id, name, price')
          .in('id', planIds);
        if (mpData) mpData.forEach((p: any) => {
          planNames[p.id]  = p.name;
          planPrices[p.id] = p.price ?? 0;
        });
      }

      // Dues = plan price − what's actually been paid against that plan.
      // Payments link to member_plans via member_plan_id (NOT plan_id).
      const memberPlanIds = (planData ?? []).map((p: any) => p.id).filter(Boolean);
      const paidByPlan: Record<string, number> = {};
      if (memberPlanIds.length > 0) {
        const { data: payData } = await supabase
          .from('payments')
          .select('member_plan_id, amount')
          .in('member_plan_id', memberPlanIds);
        (payData ?? []).forEach((p: any) => {
          if (!p.member_plan_id) return;
          paidByPlan[p.member_plan_id] = (paidByPlan[p.member_plan_id] ?? 0) + (p.amount ?? 0);
        });
      }

      const rows: MemberRow[] = profileData.map((m: any) => {
        const membersId  = profileToMemberId[m.id] ?? m.id;
        const plans      = (planData ?? []).filter((p: any) => p.member_id === membersId);
        // A frozen plan is the member's current plan, just paused.
        const activePlan = plans.find((p: any) => p.status === 'active' || p.status === 'frozen');
        const plan       = activePlan ?? plans[0];
        const status     = deriveStatus(plans);
        const price      = plan?.plan_id ? (planPrices[plan.plan_id] ?? 0) : 0;
        const paid       = plan?.id ? (paidByPlan[plan.id] ?? 0) : 0;
        const due        = Math.max(0, price - paid);
        return {
          id:            m.id,
          full_name:     m.full_name,
          phone:         m.phone,
          status,
          due,
          plan_name:     plan ? (planNames[plan.plan_id] ?? 'No plan') : 'No plan',
          expiry_date:   plan?.end_date
            ? new Date(plan.end_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
            : '—',
          rawExpiryDate: plan?.end_date ?? '',
        };
      });

      setMembers(rows);
    } catch (err: any) {
      setFetchError('Could not load members. Tap retry.');
    } finally {
      setLoading(false);
    }
  }, [activeGymId, branches, profile?.gym_id]);

  useFocusEffect(useCallback(() => { fetchMembers(); }, [fetchMembers]));

  const handleAIRiskScan = async () => {
    setAiRiskError('');
    setAiRiskSummary(null);
    setAllGoodMsg(false);
    setAiExpanded(true);

    const atRisk = members.filter(m => getRisk(m) !== null);
    if (atRisk.length === 0) {
      setAllGoodMsg(true);
      return;
    }

    const membersStr = atRisk.map(m => {
      if (m.status === 'expired') return `${m.full_name} (expired)`;
      const daysLeft = Math.ceil((new Date(m.rawExpiryDate).getTime() - Date.now()) / 86400000);
      return `${m.full_name} (expires in ${daysLeft} days)`;
    }).join(', ');

    setAiRiskLoading(true);
    try {
      const text = await askAI('risk_scan', { members: membersStr });
      setAiRiskSummary(text);
    } catch {
      setAiRiskError('Could not generate risk scan. Try again.');
    } finally {
      setAiRiskLoading(false);
    }
  };

  const filtered = members.filter(m => {
    const matchSearch = m.full_name.toLowerCase().includes(search.toLowerCase()) ||
                        (m.phone ?? '').includes(search);
    const matchFilter =
      filter === 'all'  ? true
      : filter === 'dues' ? m.due > 0        // everyone who still owes money
      : m.status === filter;
    return matchSearch && matchFilter;
  });

  const atRiskCount  = members.filter(m => getRisk(m) !== null).length;
  const activeCount  = members.filter(m => m.status === 'active').length;
  const expiredCount = members.filter(m => m.status === 'expired').length;

  // ── Loading ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={s.loadingContainer}>
        <LottieView
          source={require('@/assets/animations/Turkey Power Walk.json')}
          autoPlay loop
          style={s.loadingLottie}
        />
        <Text style={s.loadingTitle}>LOADING MEMBERS</Text>
        <Text style={s.loadingSubtitle}>Fetching your squad...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{
        title: 'Members',
        headerStyle: { backgroundColor: Colors.bg },
        headerTintColor: Colors.text,
      }} />

      <View style={s.container}>

        {/* ── Fetch Error ── */}
        {!!fetchError && (
          <View style={s.fetchErrorBanner}>
            <MaterialCommunityIcons name="alert-circle-outline" size={14} color={Colors.red} />
            <Text style={s.fetchErrorText}>{fetchError}</Text>
            <TouchableOpacity onPress={fetchMembers}>
              <Text style={s.fetchErrorRetry}>RETRY</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Stats Strip ── */}
        <FadeInView delay={0}>
          <View style={s.statsStrip}>
            {[
              { num: members.length, label: 'TOTAL',   color: Colors.text,   icon: 'account-group-outline' as IconName },
              { num: activeCount,    label: 'ACTIVE',  color: Colors.green,  icon: 'check-circle-outline'  as IconName },
              { num: expiredCount,   label: 'EXPIRED', color: Colors.red,    icon: 'clock-alert-outline'   as IconName },
              { num: atRiskCount,    label: 'AT RISK', color: Colors.orange, icon: 'alert-outline'         as IconName },
            ].map((stat, i, arr) => (
              <View key={stat.label} style={s.statCell}>
                <View style={[s.statIconBox, { backgroundColor: stat.color + '14', borderColor: stat.color + '30' }]}>
                  <MaterialCommunityIcons name={stat.icon} size={14} color={stat.color} />
                </View>
                <Text style={[s.statNum, { color: stat.color }]}>{stat.num}</Text>
                <Text style={s.statLabel}>{stat.label}</Text>
                {i < arr.length - 1 && <View style={s.statDivider} />}
              </View>
            ))}
          </View>
        </FadeInView>

        {/* ── Search ── */}
        <FadeInView delay={40}>
          <View style={[s.searchRow, searchFocused && s.searchRowFocused]}>
            <MaterialCommunityIcons
              name="magnify" size={18}
              color={searchFocused ? Colors.accent : Colors.textMuted}
            />
            <RNTextInput
              style={s.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Search name or phone..."
              placeholderTextColor={Colors.textMuted}
              returnKeyType="search"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
            {!!search && (
              <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialCommunityIcons name="close-circle" size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </FadeInView>

        {/* ── Filter chips ── */}
        <FadeInView delay={80}>
          <View style={s.filterRow}>
            {filters.map(f => {
              const active = filter === f.value;
              const count =
                f.value === 'all'       ? members.length :
                f.value === 'dues'      ? members.filter(m => m.due > 0).length :
                f.value === 'active'    ? members.filter(m => m.status === 'active').length :
                f.value === 'expired'   ? members.filter(m => m.status === 'expired').length :
                members.filter(m => m.status === 'frozen').length;
              return (
                <AnimatedPressable
                  key={f.value}
                  onPress={() => setFilter(f.value)}
                  style={[
                    s.filterChip,
                    active && { backgroundColor: f.color + '18', borderColor: f.color + '60' },
                  ]}
                  scaleDown={0.93}
                >
                  <MaterialCommunityIcons
                    name={f.icon}
                    size={13}
                    color={active ? f.color : Colors.textMuted}
                  />
                  <Text style={[s.filterLabel, { color: active ? f.color : Colors.textMuted }]}>
                    {f.label}
                  </Text>
                  <View style={[s.filterBadge, { backgroundColor: active ? f.color + '22' : Colors.bgElevated }]}>
                    <Text style={[s.filterBadgeText, { color: active ? f.color : Colors.textMuted }]}>
                      {count}
                    </Text>
                  </View>
                </AnimatedPressable>
              );
            })}
          </View>
        </FadeInView>

        {/* ── Risk Banner ── */}
        {atRiskCount > 0 && (
          <FadeInView delay={100}>
            <View style={s.riskBanner}>
              <View style={s.riskBannerLeft}>
                <View style={s.riskIconBox}>
                  <MaterialCommunityIcons name="alert" size={14} color={Colors.orange} />
                </View>
                <View>
                  <Text style={s.riskBannerTitle}>
                    {atRiskCount} AT-RISK MEMBER{atRiskCount !== 1 ? 'S' : ''}
                  </Text>
                  <Text style={s.riskBannerSub}>Expired or expiring soon</Text>
                </View>
              </View>
              <AnimatedPressable
                style={s.riskScanBtn}
                onPress={handleAIRiskScan}
                disabled={aiRiskLoading}
                scaleDown={0.93}
              >
                {aiRiskLoading ? (
                  <LottieView
                    source={require('@/assets/animations/Turkey Power Walk.json')}
                    autoPlay loop
                    style={{ width: 20, height: 20 }}
                  />
                ) : (
                  <>
                    <MaterialCommunityIcons name="robot-outline" size={13} color={Colors.orange} />
                    <Text style={s.riskScanBtnText}>AI SCAN</Text>
                  </>
                )}
              </AnimatedPressable>
            </View>

            {aiExpanded && (
              <>
                {allGoodMsg && (
                  <View style={[s.riskResult, { borderLeftColor: Colors.green }]}>
                    <MaterialCommunityIcons name="check-circle-outline" size={14} color={Colors.green} style={{ marginRight: 8 }} />
                    <Text style={[s.riskResultText, { color: Colors.green }]}>
                      All members are healthy — no action needed.
                    </Text>
                  </View>
                )}
                {!!aiRiskError && (
                  <View style={[s.riskResult, { borderLeftColor: Colors.red }]}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={14} color={Colors.red} style={{ marginRight: 8 }} />
                    <Text style={[s.riskResultText, { color: Colors.red }]}>{aiRiskError}</Text>
                  </View>
                )}
                {!!aiRiskSummary && (
                  <View style={s.riskResult}>
                    <Text style={s.riskResultText}>{aiRiskSummary}</Text>
                  </View>
                )}
              </>
            )}
          </FadeInView>
        )}

        {/* ── Count label ── */}
        <View style={s.countRow}>
          <Text style={s.countLabel}>
            {filtered.length} MEMBER{filtered.length !== 1 ? 'S' : ''}
            {filter !== 'all' ? `  ·  ${filter.toUpperCase()}` : ''}
          </Text>
          {search.length > 0 && (
            <Text style={s.countSub}>matching "{search}"</Text>
          )}
        </View>

        {/* ── List ── */}
        {filtered.length === 0 ? (
          <FadeInView delay={200} style={s.empty}>
            <View style={s.emptyIconBox}>
              <MaterialCommunityIcons
                name={members.length === 0 ? 'account-plus-outline' : 'magnify-remove-outline'}
                size={32} color={Colors.textMuted}
              />
            </View>
            <Text style={s.emptyTitle}>
              {members.length === 0 ? 'No members yet' : 'No results found'}
            </Text>
            <Text style={s.emptyDesc}>
              {members.length === 0
                ? 'Add your first member using the + button below'
                : 'Try a different search or filter'}
            </Text>
          </FadeInView>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.list}
            renderItem={({ item, index }) => {
              const color    = statusColors[item.status];
              const sIcon    = statusIcons[item.status];
              const initials = item.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
              const risk     = getRisk(item);

              return (
                <FadeInView delay={index * 30}>
                  <AnimatedPressable
                    style={s.card}
                    scaleDown={0.97}
                    onPress={() => router.push(`/(owner)/members/${item.id}`)}
                  >
                    {/* Left accent bar */}
                    <View style={[s.accentBar, { backgroundColor: color }]} />

                    {/* Avatar */}
                    <View style={[s.avatar, { borderColor: color + '50', backgroundColor: color + '12' }]}>
                      <Text style={[s.avatarText, { color }]}>{initials}</Text>
                      {/* Online dot for active */}
                      {item.status === 'active' && <View style={s.activeDot} />}
                    </View>

                    {/* Info */}
                    <View style={s.cardInfo}>
                      <View style={s.nameRow}>
                        <Text style={s.cardName} numberOfLines={1}>{item.full_name}</Text>
                        {risk === 'high' && (
                          <View style={[s.riskTag, { backgroundColor: Colors.red + '1a', borderColor: Colors.red + '40' }]}>
                            <MaterialCommunityIcons name="fire" size={9} color={Colors.red} />
                            <Text style={[s.riskTagText, { color: Colors.red }]}>HIGH</Text>
                          </View>
                        )}
                        {risk === 'medium' && (
                          <View style={[s.riskTag, { backgroundColor: Colors.orange + '1a', borderColor: Colors.orange + '40' }]}>
                            <MaterialCommunityIcons name="alert" size={9} color={Colors.orange} />
                            <Text style={[s.riskTagText, { color: Colors.orange }]}>RISK</Text>
                          </View>
                        )}
                      </View>

                      <View style={s.metaRow}>
                        <MaterialCommunityIcons name="ticket-outline" size={11} color={Colors.textMuted} />
                        <Text style={s.cardPlan} numberOfLines={1}>{item.plan_name}</Text>
                      </View>

                      <View style={s.metaRow}>
                        <MaterialCommunityIcons name="calendar-end" size={11} color={Colors.textMuted} />
                        <Text style={s.cardExpiry}>Expires {item.expiry_date}</Text>
                      </View>

                      {/* Dues + quick contact — money first, then reach them */}
                      <View style={s.actionRow}>
                        {item.due > 0 ? (
                          <View style={s.duePill}>
                            <MaterialCommunityIcons name="currency-inr" size={11} color={Colors.red} />
                            <Text style={s.dueText}>{item.due.toLocaleString('en-IN')} due</Text>
                          </View>
                        ) : (
                          <View style={s.paidPill}>
                            <MaterialCommunityIcons name="check" size={10} color={Colors.green} />
                            <Text style={s.paidText}>Paid</Text>
                          </View>
                        )}

                        {item.phone && (
                          <View style={s.contactBtns}>
                            <Pressable
                              style={s.iconBtn}
                              hitSlop={8}
                              onPress={(e) => { e.stopPropagation?.(); Linking.openURL(`tel:${item.phone}`); }}
                            >
                              <MaterialCommunityIcons name="phone-outline" size={14} color={Colors.textMuted} />
                            </Pressable>
                            <Pressable
                              style={s.iconBtn}
                              hitSlop={8}
                              onPress={(e) => {
                                e.stopPropagation?.();
                                const d = (item.phone ?? '').replace(/\D/g, '');
                                Linking.openURL(`https://wa.me/${d.length === 10 ? '91' + d : d}`);
                              }}
                            >
                              <MaterialCommunityIcons name="whatsapp" size={14} color="#25D366" />
                            </Pressable>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Right: status pill + chevron */}
                    <View style={s.cardRight}>
                      <View style={[s.statusPill, { backgroundColor: color + '14', borderColor: color + '35' }]}>
                        <MaterialCommunityIcons name={sIcon} size={11} color={color} />
                        <Text style={[s.statusText, { color }]}>{item.status.toUpperCase()}</Text>
                      </View>
                      <MaterialCommunityIcons name="chevron-right" size={16} color={Colors.textMuted + '60'} style={{ marginTop: 6 }} />
                    </View>
                  </AnimatedPressable>
                </FadeInView>
              );
            }}
          />
        )}

        {/* ── Import (secondary FAB) ── */}
        <AnimatedPressable
          style={s.fabImport}
          scaleDown={0.92}
          onPress={() => router.push('/(owner)/members/import')}
        >
          <MaterialCommunityIcons name="table-arrow-up" size={18} color={Colors.accent} />
          <Text style={s.fabImportText}>IMPORT</Text>
        </AnimatedPressable>

        {/* ── FAB ── */}
        <AnimatedPressable
          style={s.fab}
          scaleDown={0.92}
          onPress={() => router.push('/(owner)/members/add')}
        >
          <LinearGradient
            colors={[Colors.accent, '#C55A00']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={s.fabGrad}
          >
            <MaterialCommunityIcons name="account-plus" size={22} color="#fff" />
          </LinearGradient>
        </AnimatedPressable>

      </View>
    </>
  );
}

const s = StyleSheet.create({
  loadingContainer: { flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' },
  loadingLottie:    { width: 200, height: 200 },
  loadingTitle:     { fontFamily: Fonts.condensedBold, fontSize: 16, color: Colors.text, letterSpacing: 3, marginTop: 8 },
  loadingSubtitle:  { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, marginTop: 4 },

  container: { flex: 1, backgroundColor: Colors.bg },

  // ── Fetch error ──────────────────────────────────────────────────
  fetchErrorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginTop: 12,
    backgroundColor: Colors.red + '12', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: Colors.red + '30',
  },
  fetchErrorText:  { fontFamily: Fonts.regular, fontSize: 12, color: Colors.red, flex: 1 },
  fetchErrorRetry: { fontFamily: Fonts.bold, fontSize: 11, color: Colors.red, letterSpacing: 0.8 },

  // ── Stats strip ───────────────────────────────────────────────────
  statsStrip: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginTop: 14, marginBottom: 12,
    backgroundColor: Colors.bgCard, borderRadius: 18,
    borderWidth: 1, borderColor: Colors.border,
    paddingVertical: 14,
  },
  statCell: {
    flex: 1, alignItems: 'center', gap: 4, position: 'relative',
  },
  statIconBox: {
    width: 28, height: 28, borderRadius: 9,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, marginBottom: 2,
  },
  statNum:     { fontFamily: Fonts.condensedBold, fontSize: 22 },
  statLabel:   { fontFamily: Fonts.bold, fontSize: 7, color: Colors.textMuted, letterSpacing: 1.3 },
  statDivider: { position: 'absolute', right: 0, top: '20%', bottom: '20%', width: 1, backgroundColor: Colors.border },

  // ── Search ───────────────────────────────────────────────────────
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16, marginBottom: 10,
    backgroundColor: Colors.bgCard, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 14, paddingVertical: 13,
  },
  searchRowFocused: { borderColor: Colors.accent + '60' },
  searchInput: {
    flex: 1, fontFamily: Fonts.regular, fontSize: 14,
    color: Colors.text, padding: 0,
  },

  // ── Filter chips ─────────────────────────────────────────────────
  filterRow:      { flexDirection: 'row', paddingHorizontal: 16, gap: 7, marginBottom: 12 },
  filterChip:     {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 9, paddingHorizontal: 8, gap: 5,
    borderRadius: 12, backgroundColor: Colors.bgCard,
    borderWidth: 1, borderColor: Colors.border,
  },
  filterLabel:    { fontFamily: Fonts.bold, fontSize: 9, letterSpacing: 0.3 },
  filterBadge:    { borderRadius: 6, paddingHorizontal: 5, paddingVertical: 1 },
  filterBadgeText:{ fontFamily: Fonts.condensedBold, fontSize: 12 },

  // ── Risk banner ───────────────────────────────────────────────────
  riskBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 16, marginBottom: 8,
    backgroundColor: Colors.orange + '0e',
    borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: Colors.orange + '28',
  },
  riskBannerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  riskIconBox: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: Colors.orange + '14',
    borderWidth: 1, borderColor: Colors.orange + '30',
    justifyContent: 'center', alignItems: 'center',
  },
  riskBannerTitle: { fontFamily: Fonts.bold, fontSize: 11, color: Colors.orange, letterSpacing: 0.5 },
  riskBannerSub:   { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted, marginTop: 1 },
  riskScanBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: Colors.orange + '18', borderRadius: 10,
    borderWidth: 1, borderColor: Colors.orange + '40',
  },
  riskScanBtnText: { fontFamily: Fonts.bold, fontSize: 10, color: Colors.orange, letterSpacing: 0.5 },
  riskResult: {
    flexDirection: 'row', alignItems: 'flex-start',
    marginHorizontal: 16, marginBottom: 8,
    backgroundColor: Colors.bgCard, borderRadius: 12, padding: 12,
    borderLeftWidth: 3, borderLeftColor: Colors.orange,
    borderWidth: 1, borderColor: Colors.border,
  },
  riskResultText: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.text, lineHeight: 18, flex: 1 },

  // ── Count row ─────────────────────────────────────────────────────
  countRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, marginBottom: 8 },
  countLabel:{ fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted, letterSpacing: 1.5 },
  countSub:  { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted + '80' },

  // ── List ──────────────────────────────────────────────────────────
  list: { paddingHorizontal: 16, paddingBottom: 100, gap: 8 },

  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: 16, borderWidth: 1, borderColor: Colors.border,
    paddingVertical: 13, paddingRight: 12, overflow: 'hidden',
  },
  accentBar: { width: 3, alignSelf: 'stretch', marginRight: 12, borderRadius: 2 },

  avatar: {
    width: 46, height: 46, borderRadius: 23,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, marginRight: 12,
    position: 'relative',
  },
  avatarText: { fontFamily: Fonts.condensedBold, fontSize: 17 },
  activeDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: Colors.green,
    borderWidth: 2, borderColor: Colors.bgCard,
  },

  cardInfo:  { flex: 1, gap: 3 },
  nameRow:   { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  cardName:  { fontFamily: Fonts.bold, fontSize: 15, color: Colors.text },

  riskTag:     { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  riskTagText: { fontFamily: Fonts.bold, fontSize: 7, letterSpacing: 0.5 },

  metaRow:   { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cardPlan:  { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, flex: 1 },
  cardExpiry:{ fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted },
  cardPhone: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted },

  // Dues badge + quick contact on each member card
  actionRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  duePill:     { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: Colors.red + '15', borderWidth: 1, borderColor: Colors.red + '35', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4 },
  dueText:     { fontFamily: Fonts.bold, fontSize: 11, color: Colors.red },
  paidPill:    { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.green + '12', borderWidth: 1, borderColor: Colors.green + '30', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4 },
  paidText:    { fontFamily: Fonts.bold, fontSize: 10.5, color: Colors.green },
  contactBtns: { flexDirection: 'row', gap: 6 },
  iconBtn:     { width: 28, height: 28, borderRadius: 8, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' },

  cardRight: { alignItems: 'flex-end', gap: 2, marginLeft: 8 },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 5,
    borderRadius: 8, borderWidth: 1,
  },
  statusText: { fontFamily: Fonts.bold, fontSize: 8, letterSpacing: 0.8 },

  // ── Empty state ───────────────────────────────────────────────────
  empty:       { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 60 },
  emptyIconBox:{
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    justifyContent: 'center', alignItems: 'center', marginBottom: 14,
  },
  emptyTitle:  { fontFamily: Fonts.bold, fontSize: 16, color: Colors.text },
  emptyDesc:   { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, textAlign: 'center', paddingHorizontal: 40, marginTop: 6, lineHeight: 20 },

  // ── FAB ───────────────────────────────────────────────────────────
  fab:     { position: 'absolute', right: 20, bottom: 28, borderRadius: 30, elevation: 8 },
  fabGrad: { width: 58, height: 58, borderRadius: 29, justifyContent: 'center', alignItems: 'center' },
  fabImport: {
    position: 'absolute', right: 20, bottom: 96, flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.accent + '40',
    borderRadius: 22, paddingHorizontal: 14, paddingVertical: 10, elevation: 6,
  },
  fabImportText: { fontFamily: Fonts.bold, fontSize: 11, color: Colors.accent, letterSpacing: 0.8 },
});
