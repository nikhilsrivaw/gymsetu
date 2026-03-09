import { useState, useCallback } from 'react';
  import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
  import { Searchbar, FAB } from 'react-native-paper';
  import { useRouter, Stack, useFocusEffect } from 'expo-router';
  import { Colors } from '@/constants/colors';
  import { Fonts } from '@/constants/fonts';
  import AnimatedPressable from '@/components/AnimatedPressable';
  import FadeInView from '@/components/FadeInView';
  import { supabase } from '@/lib/supabase';
  import { useAuthStore } from '@/store/authStore';
  import { askAI } from '@/lib/ai';
  import type { MemberStatus } from '@/types/database';

  type FilterType = 'all' | 'active' | 'expired' | 'suspended';

  const filters: { label: string; value: FilterType }[] = [
    { label: 'ALL',       value: 'all'       },
    { label: 'ACTIVE',    value: 'active'    },
    { label: 'EXPIRED',   value: 'expired'   },
    { label: 'SUSPENDED', value: 'suspended' },
  ];

  const statusColors: Record<MemberStatus, string> = {
    active:    Colors.green,
    expired:   Colors.red,
    suspended: Colors.orange,
    inactive:  Colors.textMuted,
  };

  interface MemberRow {
    id: string;
    full_name: string;
    phone: string | null;
    status: MemberStatus;
    plan_name: string;
    expiry_date: string;
    rawExpiryDate: string;
  }

  const getRisk = (m: MemberRow): 'high' | 'medium' | null => {
    if (m.status === 'expired') return 'high';
    if (m.status !== 'active' || !m.rawExpiryDate) return null;
    const daysLeft = Math.ceil((new Date(m.rawExpiryDate).getTime() - Date.now()) / 86400000);
    if (daysLeft <= 3) return 'high';
    if (daysLeft <= 7) return 'medium';
    return null;
  };

  export default function MembersListScreen() {
    const { profile } = useAuthStore();
    const router = useRouter();
    const [search, setSearch]   = useState('');
    const [filter, setFilter]   = useState<FilterType>('all');
    const [members, setMembers] = useState<MemberRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [aiRiskSummary, setAiRiskSummary] = useState<string | null>(null);
    const [aiRiskLoading, setAiRiskLoading] = useState(false);

    const fetchMembers = useCallback(async () => {
      if (!profile?.gym_id) return;
      setLoading(true);

      const { data, error } = await supabase
        .from('members')
        .select(`
          id, full_name, phone, status,
          member_plans (
            end_date, status,
            membership_plans ( name )
          )
        `)
        .eq('gym_id', profile.gym_id)
        .order('full_name', { ascending: true });

      if (!error && data) {
        const rows: MemberRow[] = data.map((m: any) => {
          const activePlan = m.member_plans?.find((mp: any) => mp.status === 'active');
          const anyPlan    = m.member_plans?.[0];
          const plan       = activePlan ?? anyPlan;
          return {
            id:            m.id,
            full_name:     m.full_name,
            phone:         m.phone,
            status:        m.status,
            plan_name:     plan?.membership_plans?.name ?? 'No plan',
            expiry_date:   plan?.end_date ? new Date(plan.end_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', 
  year: 'numeric' }) : '—',
            rawExpiryDate: plan?.end_date ?? '',
          };
        });
        setMembers(rows);
      }
      setLoading(false);
    }, [profile?.gym_id]);

    useFocusEffect(useCallback(() => { fetchMembers(); }, [fetchMembers]));

    const handleAIRiskScan = async () => {
      const atRisk = members.filter(m => getRisk(m) !== null);
      if (atRisk.length === 0) {
        Alert.alert('All Good!', 'No at-risk members found right now.');
        return;
      }
      const membersStr = atRisk.map(m => {
        if (m.status === 'expired') return m.full_name + ' (expired)';
        const daysLeft = Math.ceil((new Date(m.rawExpiryDate).getTime() - Date.now()) / 86400000);
        return m.full_name + ' (expires in ' + daysLeft + ' days)';
      }).join(', ');

      setAiRiskLoading(true);
      setAiRiskSummary(null);
      try {
        const text = await askAI('risk_scan', { members: membersStr });
        setAiRiskSummary(text);
      } catch {
        Alert.alert('Error', 'Could not generate risk scan');
      }
      setAiRiskLoading(false);
    };

    const filtered = members.filter(m => {
      const matchSearch = m.full_name.toLowerCase().includes(search.toLowerCase()) || (m.phone ?? '').includes(search);
      const matchFilter = filter === 'all' || m.status === filter;
      return matchSearch && matchFilter;
    });

    const atRiskCount = members.filter(m => getRisk(m) !== null).length;

    return (
      <>
        <Stack.Screen options={{ title: 'Members' }} />
        <View style={styles.container}>

          <FadeInView delay={0}>
            <Searchbar
              placeholder="Search by name or phone..."
              value={search}
              onChangeText={setSearch}
              style={styles.searchbar}
              inputStyle={{ color: Colors.text, fontSize: 14, fontFamily: Fonts.regular }}
              iconColor={Colors.textMuted}
              placeholderTextColor={Colors.textMuted}
              theme={{ colors: { onSurfaceVariant: Colors.textMuted } }}
            />
          </FadeInView>

          <FadeInView delay={60}>
            <View style={styles.filterRow}>
              {filters.map(f => (
                <AnimatedPressable
                  key={f.value}
                  onPress={() => setFilter(f.value)}
                  style={[styles.filterChip, filter === f.value && styles.filterChipActive]}
                  scaleDown={0.94}
                >
                  <Text style={[styles.filterText, filter === f.value && styles.filterTextActive]}>
                    {f.label}
                  </Text>
                </AnimatedPressable>
              ))}
            </View>
          </FadeInView>

          {/* AI Risk Scan Banner */}
          {atRiskCount > 0 && (
            <FadeInView delay={80}>
              <View style={styles.riskBanner}>
                <View style={styles.riskBannerLeft}>
                  <Text style={styles.riskBannerEmoji}>⚠️</Text>
                  <View>
                    <Text style={styles.riskBannerTitle}>{atRiskCount} AT-RISK MEMBER{atRiskCount !== 1 ? 'S' : ''}</Text>        
                    <Text style={styles.riskBannerSub}>Expired or expiring soon</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.riskScanBtn} onPress={handleAIRiskScan} disabled={aiRiskLoading}>
                  {aiRiskLoading
                    ? <ActivityIndicator size="small" color={Colors.orange} />
                    : <Text style={styles.riskScanBtnText}>🤖 AI Scan</Text>
                  }
                </TouchableOpacity>
              </View>
              {aiRiskSummary && (
                <View style={styles.riskResult}>
                  <Text style={styles.riskResultText}>{aiRiskSummary}</Text>
                </View>
              )}
            </FadeInView>
          )}

          <Text style={styles.countLabel}>
            {loading ? 'Loading...' : `${filtered.length} MEMBER${filtered.length !== 1 ? 'S' : ''}`}
          </Text>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={Colors.accent} size="large" />
            </View>
          ) : filtered.length === 0 ? (
            <FadeInView delay={200} style={styles.empty}>
              <Text style={styles.emptyEmoji}>🏋️</Text>
              <Text style={styles.emptyTitle}>No members found</Text>
              <Text style={styles.emptyDesc}>
                {members.length === 0 ? 'Add your first member using the + button' : 'Try adjusting your search or filter'}       
              </Text>
            </FadeInView>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.list}
              renderItem={({ item, index }) => {
                const color    = statusColors[item.status];
                const initials = item.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                const risk     = getRisk(item);
                return (
                  <FadeInView delay={index * 40}>
                    <AnimatedPressable
                      style={styles.row}
                      scaleDown={0.98}
                      onPress={() => router.push(`/(owner)/members/${item.id}`)}
                    >
                      <View style={[styles.statusBar, { backgroundColor: color }]} />
                      <View style={[styles.avatar, { borderColor: color + '50' }]}>
                        <Text style={[styles.avatarText, { color }]}>{initials}</Text>
                      </View>
                      <View style={styles.rowInfo}>
                        <View style={styles.nameRow}>
                          <Text style={styles.rowName}>{item.full_name}</Text>
                          {risk === 'high'   && <View style={[styles.riskBadge, { backgroundColor: Colors.red    + '20' }]}><Text 
  style={[styles.riskBadgeText, { color: Colors.red    }]}>HIGH RISK</Text></View>}
                          {risk === 'medium' && <View style={[styles.riskBadge, { backgroundColor: Colors.orange + '20' }]}><Text 
  style={[styles.riskBadgeText, { color: Colors.orange }]}>AT RISK</Text></View>}
                        </View>
                        <Text style={styles.rowMeta}>{item.plan_name}  ·  Exp {item.expiry_date}</Text>
                      </View>
                      <View style={[styles.statusPill, { backgroundColor: color + '15' }]}>
                        <View style={[styles.statusDot, { backgroundColor: color }]} />
                        <Text style={[styles.statusLabel, { color }]}>{item.status.toUpperCase()}</Text>
                      </View>
                    </AnimatedPressable>
                  </FadeInView>
                );
              }}
            />
          )}

          <FAB
            icon="plus"
            style={styles.fab}
            onPress={() => router.push('/(owner)/members/add')}
            color="#FFF"
            customSize={56}
          />
        </View>
      </>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    center:    { flex: 1, justifyContent: 'center', alignItems: 'center' },

    searchbar: {
      marginHorizontal: 16, marginTop: 10, marginBottom: 10,
      backgroundColor: Colors.bgCard, borderRadius: 14,
      elevation: 0, borderWidth: 1, borderColor: Colors.border, height: 48,
    },
    filterRow:        { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
    filterChip:       { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: Colors.bgCard, borderWidth: 
  1, borderColor: Colors.border },
    filterChipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
    filterText:       { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted, letterSpacing: 1 },
    filterTextActive: { color: '#FFF' },

    riskBanner:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 16,
  marginBottom: 6, backgroundColor: Colors.orange + '12', borderRadius: 12, padding: 12, borderWidth: 1, borderColor:
  Colors.orange + '30' },
    riskBannerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
    riskBannerEmoji: { fontSize: 18 },
    riskBannerTitle: { fontFamily: Fonts.bold, fontSize: 11, color: Colors.orange, letterSpacing: 0.5 },
    riskBannerSub:   { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted, marginTop: 1 },
    riskScanBtn:     { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: Colors.orange + '20', borderRadius: 8,
  borderWidth: 1, borderColor: Colors.orange + '40' },
    riskScanBtnText: { fontFamily: Fonts.bold, fontSize: 11, color: Colors.orange },
    riskResult:      { marginHorizontal: 16, marginBottom: 8, backgroundColor: Colors.bgCard, borderRadius: 10, padding: 12,      
  borderLeftWidth: 3, borderLeftColor: Colors.orange },
    riskResultText:  { fontFamily: Fonts.regular, fontSize: 12, color: Colors.text, lineHeight: 18 },

    countLabel: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted, letterSpacing: 1.5, paddingHorizontal: 16,        
  marginBottom: 8 },

    list: { paddingHorizontal: 16, paddingBottom: 80, gap: 6 },
    row: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: Colors.bgCard,
      borderRadius: 14, paddingVertical: 14, paddingRight: 14,
      borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
    },
    statusBar:  { width: 3, alignSelf: 'stretch', marginRight: 12 },
    avatar:     { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.bgElevated, justifyContent: 'center',
  alignItems: 'center', borderWidth: 1.5, marginRight: 12 },
    avatarText: { fontFamily: Fonts.condensedBold, fontSize: 15 },
    rowInfo:    { flex: 1 },
    nameRow:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
    rowName:    { fontFamily: Fonts.bold, fontSize: 15, color: Colors.text },
    rowMeta:    { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 2 },
    riskBadge:     { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 },
    riskBadgeText: { fontFamily: Fonts.bold, fontSize: 7, letterSpacing: 0.5 },
    statusPill:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4  
  },
    statusDot:   { width: 5, height: 5, borderRadius: 3 },
    statusLabel: { fontFamily: Fonts.bold, fontSize: 8, letterSpacing: 0.8 },

    empty:      { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 60 },
    emptyEmoji: { fontSize: 44, marginBottom: 12 },
    emptyTitle: { fontFamily: Fonts.bold, fontSize: 16, color: Colors.text },
    emptyDesc:  { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, marginTop: 6, textAlign: 'center',
  paddingHorizontal: 32 },

    fab: { position: 'absolute', right: 20, bottom: 20, backgroundColor: Colors.accent, borderRadius: 16 },
  });
