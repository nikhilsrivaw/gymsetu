import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import FadeInView from '@/components/FadeInView';
import AnimatedPressable from '@/components/AnimatedPressable';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface MemberRow {
  id:       string;
  name:     string;
  goal:     string | null;
  plan:     string;
  daysLeft: number;
  status:   'active' | 'expiring' | 'expired';
  initials: string;
}

const FILTERS = ['All', 'Active', 'Expiring', 'Expired'];

const STATUS_CONFIG: Record<string, { color: string; icon: IconName; label: string }> = {
  active:   { color: Colors.green,  icon: 'check-circle-outline',  label: 'ACTIVE'   },
  expiring: { color: Colors.orange, icon: 'clock-alert-outline',   label: 'EXPIRING' },
  expired:  { color: Colors.red,    icon: 'close-circle-outline',  label: 'EXPIRED'  },
};

export default function MyMembersScreen() {
  const router      = useRouter();
  const { profile } = useAuthStore();

  const [search,  setSearch]  = useState('');
  const [filter,  setFilter]  = useState('All');
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMembers = useCallback(async () => {
    if (!profile?.id || !profile?.gym_id) return;
    setLoading(true);
    try {
      // Step 1: profiles where trainer_id = this trainer
      const { data: profileRows, error: profErr } = await supabase
        .from('profiles')
        .select('id, full_name, goal, status')
        .eq('gym_id', profile.gym_id)
        .eq('trainer_id', profile.id)
        .eq('role', 'member')
        .order('full_name');

      if (profErr || !profileRows?.length) {
        setMembers([]);
        setLoading(false);
        return;
      }

      // Step 2: members.id lookup (member_plans uses members.id, not profiles.id)
      const userIds = profileRows.map((p: any) => p.id);
      const { data: memberRows } = await supabase
        .from('members').select('id, user_id').in('user_id', userIds);
      const userToMemberId: Record<string, string> = {};
      (memberRows ?? []).forEach((m: any) => { userToMemberId[m.user_id] = m.id; });

      // Step 3: active/latest plans
      const memberIds = Object.values(userToMemberId);
      const plansMap: Record<string, any> = {};
      if (memberIds.length > 0) {
        const { data: plans } = await supabase
          .from('member_plans')
          .select('member_id, end_date, status, membership_plans(name)')
          .in('member_id', memberIds);
        (plans ?? []).forEach((p: any) => {
          if (!plansMap[p.member_id] || p.status === 'active') plansMap[p.member_id] = p;
        });
      }

      const todayMs = new Date().setHours(0, 0, 0, 0);
      const rows: MemberRow[] = profileRows.map((p: any) => {
        const membersId = userToMemberId[p.id];
        const plan      = membersId ? plansMap[membersId] : null;
        const daysLeft  = plan?.end_date
          ? Math.round((new Date(plan.end_date).getTime() - todayMs) / 86_400_000)
          : -1;
        const rowStatus: MemberRow['status'] =
          daysLeft < 0  ? 'expired'  :
          daysLeft <= 7 ? 'expiring' : 'active';
        return {
          id:       p.id,
          name:     p.full_name,
          goal:     p.goal,
          plan:     plan?.membership_plans?.name ?? 'No plan',
          daysLeft, status: rowStatus,
          initials: p.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase(),
        };
      });
      setMembers(rows);
    } catch (e) {
      console.error('[MyMembers]', e);
    }
    setLoading(false);
  }, [profile?.id, profile?.gym_id]);

  useFocusEffect(useCallback(() => { fetchMembers(); }, [fetchMembers]));

  const filtered = members.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) ||
                        (m.goal ?? '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'All' || m.status === filter.toLowerCase();
    return matchSearch && matchFilter;
  });

  const counts = {
    active:   members.filter(m => m.status === 'active').length,
    expiring: members.filter(m => m.status === 'expiring').length,
    expired:  members.filter(m => m.status === 'expired').length,
  };

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Stats strip ── */}
      <FadeInView delay={0}>
        <View style={s.statsRow}>
          {[
            { label: 'ASSIGNED', val: members.length, color: '#3B82F6', icon: 'account-group-outline' as IconName },
            { label: 'ACTIVE',   val: counts.active,  color: Colors.green,  icon: 'check-circle-outline' as IconName },
            { label: 'EXPIRING', val: counts.expiring, color: Colors.orange, icon: 'clock-alert-outline' as IconName },
            { label: 'EXPIRED',  val: counts.expired, color: Colors.red,    icon: 'close-circle-outline' as IconName },
          ].map((stat, i) => (
            <View key={stat.label} style={[s.statCard, i < 3 && s.statBorder]}>
              <View style={[s.statIconBox, { backgroundColor: stat.color + '14', borderColor: stat.color + '25' }]}>
                <MaterialCommunityIcons name={stat.icon} size={13} color={stat.color} />
              </View>
              <Text style={[s.statVal, { color: stat.color }]}>{stat.val}</Text>
              <Text style={s.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </FadeInView>

      {/* ── Search ── */}
      <FadeInView delay={40}>
        <View style={s.searchBox}>
          <MaterialCommunityIcons name="magnify" size={18} color={Colors.textMuted} />
          <TextInput
            style={s.searchInput}
            placeholder="Search by name or goal..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <MaterialCommunityIcons name="close-circle" size={17} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </FadeInView>

      {/* ── Filter chips ── */}
      <FadeInView delay={70}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
          {FILTERS.map(f => {
            const active = filter === f;
            return (
              <AnimatedPressable
                key={f}
                style={[s.filterChip, active && s.filterChipActive]}
                scaleDown={0.93}
                onPress={() => setFilter(f)}
              >
                <Text style={[s.filterText, active && s.filterTextActive]}>{f.toUpperCase()}</Text>
              </AnimatedPressable>
            );
          })}
        </ScrollView>
      </FadeInView>

      {/* ── Result count ── */}
      <FadeInView delay={90}>
        <Text style={s.resultCount}>
          {loading ? 'LOADING...' : `${filtered.length} MEMBER${filtered.length !== 1 ? 'S' : ''}`}
        </Text>
      </FadeInView>

      {/* ── List ── */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={Colors.accent} size="large" />
        </View>
      ) : filtered.length === 0 ? (
        <FadeInView delay={120}>
          <View style={s.emptyCard}>
            <View style={s.emptyIconWrap}>
              <MaterialCommunityIcons name="account-group-outline" size={32} color={Colors.textMuted} />
            </View>
            <Text style={s.emptyTitle}>
              {members.length === 0 ? 'No Members Assigned' : 'No Results'}
            </Text>
            <Text style={s.emptySub}>
              {members.length === 0
                ? 'The owner assigns members to you from the owner panel'
                : 'Try a different search or filter'}
            </Text>
          </View>
        </FadeInView>
      ) : (
        filtered.map((m, i) => {
          const cfg   = STATUS_CONFIG[m.status];
          const color = cfg.color;
          return (
            <FadeInView key={m.id} delay={120 + i * 45}>
              <AnimatedPressable
                style={s.card}
                scaleDown={0.97}
                onPress={() => router.push({ pathname: '/(trainer)/member-detail', params: { id: m.id } } as any)}
              >
                {/* Left accent bar */}
                <View style={[s.cardBar, { backgroundColor: color }]} />

                <View style={s.cardBody}>
                  {/* Top row */}
                  <View style={s.cardTop}>
                    {/* Avatar */}
                    <View style={s.avatarOuter}>
                      <LinearGradient
                        colors={[color + '30', color + '10']}
                        style={s.avatarGrad}
                      />
                      <Text style={[s.avatarText, { color }]}>{m.initials}</Text>
                    </View>

                    {/* Name + goal */}
                    <View style={{ flex: 1 }}>
                      <Text style={s.memberName}>{m.name}</Text>
                      <View style={s.metaRow}>
                        <MaterialCommunityIcons name="target" size={11} color={Colors.textMuted} />
                        <Text style={s.metaText}>{m.goal ?? 'No goal set'}</Text>
                      </View>
                    </View>

                    {/* Status badge */}
                    <View style={[s.statusBadge, { backgroundColor: color + '14', borderColor: color + '30' }]}>
                      <MaterialCommunityIcons name={cfg.icon} size={11} color={color} />
                      <Text style={[s.statusText, { color }]}>{cfg.label}</Text>
                    </View>
                  </View>

                  {/* Bottom row */}
                  <View style={s.cardBottom}>
                    {/* Plan chip */}
                    <View style={s.chip}>
                      <MaterialCommunityIcons name="card-account-details-outline" size={11} color={Colors.textMuted} />
                      <Text style={s.chipText}>{m.plan}</Text>
                    </View>

                    {/* Days chip */}
                    <View style={[s.chip, { borderColor: color + '30', backgroundColor: color + '0A' }]}>
                      <MaterialCommunityIcons
                        name={m.daysLeft >= 0 ? 'calendar-clock' : 'calendar-remove'}
                        size={11}
                        color={color}
                      />
                      <Text style={[s.chipText, { color }]}>
                        {m.daysLeft >= 0 ? `${m.daysLeft}d left` : `Expired ${Math.abs(m.daysLeft)}d ago`}
                      </Text>
                    </View>

                    <View style={{ flex: 1 }} />
                    <MaterialCommunityIcons name="chevron-right" size={16} color={Colors.textMuted} />
                  </View>
                </View>
              </AnimatedPressable>
            </FadeInView>
          );
        })
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content:   { padding: 16, gap: 10 },
  center:    { paddingTop: 60, alignItems: 'center' },

  // Stats
  statsRow:   { flexDirection: 'row', backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, marginBottom: 4 },
  statCard:   { flex: 1, alignItems: 'center', paddingVertical: 14, gap: 5 },
  statBorder: { borderRightWidth: 1, borderRightColor: Colors.border },
  statIconBox:{ width: 26, height: 26, borderRadius: 8, borderWidth: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 1 },
  statVal:    { fontFamily: Fonts.condensedBold, fontSize: 20 },
  statLabel:  { fontFamily: Fonts.condensedBold, fontSize: 8, color: Colors.textMuted, letterSpacing: 1 },

  // Search
  searchBox:   { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.bgCard, borderRadius: 14, padding: 13, borderWidth: 1, borderColor: Colors.border },
  searchInput: { flex: 1, fontFamily: Fonts.regular, fontSize: 14, color: Colors.text },

  // Filters
  filterRow:        { gap: 8, paddingVertical: 2 },
  filterChip:       { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border },
  filterChipActive: { backgroundColor: Colors.accentMuted, borderColor: Colors.accent + '60' },
  filterText:       { fontFamily: Fonts.bold, fontSize: 11, color: Colors.textMuted, letterSpacing: 1 },
  filterTextActive: { color: Colors.accent },

  resultCount: { fontFamily: Fonts.condensedBold, fontSize: 10, color: Colors.textMuted, letterSpacing: 1.5, paddingHorizontal: 2 },

  // Member card
  card:    { flexDirection: 'row', backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  cardBar: { width: 3 },
  cardBody:{ flex: 1, padding: 14, gap: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },

  avatarOuter: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  avatarGrad:  { ...StyleSheet.absoluteFillObject, borderRadius: 23 },
  avatarText:  { fontFamily: Fonts.condensedBold, fontSize: 17, zIndex: 1 },

  memberName: { fontFamily: Fonts.bold, fontSize: 15, color: Colors.text },
  metaRow:    { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  metaText:   { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted },

  statusBadge:{ flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontFamily: Fonts.bold, fontSize: 9, letterSpacing: 0.8 },

  cardBottom: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chip:       { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.bgElevated, borderRadius: 8, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 8, paddingVertical: 4 },
  chipText:   { fontFamily: Fonts.bold, fontSize: 10, color: Colors.textMuted },

  // Empty
  emptyCard:    { alignItems: 'center', paddingVertical: 48, gap: 12, backgroundColor: Colors.bgCard, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, marginTop: 8 },
  emptyIconWrap:{ width: 64, height: 64, borderRadius: 20, backgroundColor: Colors.bgElevated, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  emptyTitle:   { fontFamily: Fonts.bold, fontSize: 16, color: Colors.text },
  emptySub:     { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, textAlign: 'center', paddingHorizontal: 32, lineHeight: 18 },
});
