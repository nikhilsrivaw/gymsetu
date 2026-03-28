import { useState, useCallback } from 'react';                                                                                            
  import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';                                     import { Stack, useFocusEffect } from 'expo-router';                                                                                      
  import { Colors } from '@/constants/colors';                                                                                              
  import { Fonts } from '@/constants/fonts';
  import { supabase } from '@/lib/supabase';
  import { useAuthStore } from '@/store/authStore';
  import FadeInView from '@/components/FadeInView';

  type SortKey = 'ltv' | 'visits' | 'name';

  interface MemberLTV {
    id:        string;
    name:      string;
    ltv:       number;
    visits:    number;
    plans:     number;
    tier:      'VIP' | 'Regular' | 'At Risk';
    joinedAt:  string;
  }

  const TIER_COLOR: Record<string, string> = {
    'VIP':     '#F59E0B',
    'Regular': Colors.green,
    'At Risk': Colors.red,
  };

  export default function MemberLTVScreen() {
    const { profile, activeGymId, branches } = useAuthStore();
    const [members, setMembers] = useState<MemberLTV[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortBy,  setSortBy]  = useState<SortKey>('ltv');
    const [totalLTV, setTotalLTV] = useState(0);

    const fetchData = useCallback(async () => {
      if (!profile?.gym_id) return;
      setLoading(true);

      const mainGymId = profile.gym_id;
      const gymIds = activeGymId === 'all'
        ? branches.map(b => b.id)
        : [activeGymId ?? mainGymId];

      // 1. Get all members
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, full_name, created_at')
        .in('gym_id', gymIds)
        .eq('role', 'member');

      if (!profileData || profileData.length === 0) { setLoading(false); return; }

      const memberIds = profileData.map(p => p.id);

      // 2. Get total payments per member
      const { data: payData } = await supabase
        .from('payments')
        .select('member_id, amount')
        .in('member_id', memberIds);

      // 3. Get plan count per member
      const { data: planData } = await supabase
        .from('member_plans')
        .select('member_id')
        .in('member_id', memberIds);

      // 4. Get attendance count per member
      const { data: attData } = await supabase
        .from('attendance')
        .select('member_id')
        .in('member_id', memberIds);

      // Build maps
      const payMap:  Record<string, number> = {};
      const planMap: Record<string, number> = {};
      const attMap:  Record<string, number> = {};

      (payData  ?? []).forEach(p => { payMap[p.member_id]  = (payMap[p.member_id]  || 0) + (p.amount ?? 0); });
      (planData ?? []).forEach(p => { planMap[p.member_id] = (planMap[p.member_id] || 0) + 1; });
      (attData  ?? []).forEach(a => { attMap[a.member_id]  = (attMap[a.member_id]  || 0) + 1; });

      // Calculate tiers
      const ltvValues = profileData.map(p => payMap[p.id] ?? 0).sort((a, b) => b - a);
      const top20Threshold = ltvValues[Math.floor(ltvValues.length * 0.2)] ?? 0;
      const total = ltvValues.reduce((s, v) => s + v, 0);

      const result: MemberLTV[] = profileData.map(p => {
        const ltv    = payMap[p.id]  ?? 0;
        const visits = attMap[p.id]  ?? 0;
        const plans  = planMap[p.id] ?? 0;
        let tier: MemberLTV['tier'] = 'Regular';
        if (ltv >= top20Threshold && ltv > 0) tier = 'VIP';
        else if (ltv === 0 && visits === 0)   tier = 'At Risk';

        return {
          id:       p.id,
          name:     p.full_name ?? 'Unknown',
          ltv,
          visits,
          plans,
          tier,
          joinedAt: p.created_at,
        };
      });

      setTotalLTV(total);
      setMembers(result);
      setLoading(false);
    }, [profile?.gym_id, activeGymId, branches]);

    useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

    const sorted = [...members].sort((a, b) => {
      if (sortBy === 'ltv')   return b.ltv    - a.ltv;
      if (sortBy === 'visits') return b.visits - a.visits;
      return a.name.localeCompare(b.name);
    });

    const vipCount     = members.filter(m => m.tier === 'VIP').length;
    const atRiskCount  = members.filter(m => m.tier === 'At Risk').length;
    const avgLTV       = members.length > 0 ? Math.round(totalLTV / members.length) : 0;

    if (loading) return (
      <>
        <Stack.Screen options={{ title: 'Member LTV' }} />
        <View style={styles.center}><ActivityIndicator color={Colors.accent} size="large" /></View>
      </>
    );

    return (
      <>
        <Stack.Screen options={{ title: 'Member LTV Score' }} />
        <ScrollView style={styles.container} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Summary */}
          <FadeInView delay={0}>
            <View style={styles.statRow}>
              <View style={[styles.statBox, { borderColor: '#F59E0B40' }]}>
                <Text style={styles.statEmoji}>👑</Text>
                <Text style={[styles.statVal, { color: '#F59E0B' }]}>{vipCount}</Text>
                <Text style={styles.statLbl}>VIP</Text>
              </View>
              <View style={[styles.statBox, { borderColor: Colors.accent + '40' }]}>
                <Text style={styles.statEmoji}>💰</Text>
                <Text style={[styles.statVal, { color: Colors.accent }]}>₹{avgLTV.toLocaleString('en-IN')}</Text>
                <Text style={styles.statLbl}>AVG LTV</Text>
              </View>
              <View style={[styles.statBox, { borderColor: Colors.red + '40' }]}>
                <Text style={styles.statEmoji}>⚠️</Text>
                <Text style={[styles.statVal, { color: Colors.red }]}>{atRiskCount}</Text>
                <Text style={styles.statLbl}>AT RISK</Text>
              </View>
            </View>
          </FadeInView>

          {/* Total LTV */}
          <FadeInView delay={60}>
            <View style={styles.totalCard}>
              <Text style={styles.totalLabel}>TOTAL LIFETIME VALUE</Text>
              <Text style={styles.totalVal}>₹{totalLTV.toLocaleString('en-IN')}</Text>
              <Text style={styles.totalSub}>across {members.length} members</Text>
            </View>
          </FadeInView>

          {/* Sort tabs */}
          <FadeInView delay={100}>
            <View style={styles.sortRow}>
              <Text style={styles.sortLabel}>SORT BY</Text>
              {(['ltv', 'visits', 'name'] as SortKey[]).map(key => (
                <TouchableOpacity
                  key={key}
                  style={[styles.sortBtn, sortBy === key && styles.sortBtnActive]}
                  onPress={() => setSortBy(key)}
                >
                  <Text style={[styles.sortBtnText, sortBy === key && styles.sortBtnTextActive]}>
                    {key === 'ltv' ? '💰 Value' : key === 'visits' ? '📋 Visits' : '🔤 Name'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </FadeInView>

          {/* Member List */}
          {sorted.map((m, i) => (
            <FadeInView key={m.id} delay={140 + i * 30}>
              <View style={styles.memberRow}>
                {/* Rank */}
                <View style={styles.rankWrap}>
                  <Text style={styles.rank}>#{i + 1}</Text>
                </View>

                {/* Avatar */}
                <View style={[styles.avatar, { backgroundColor: TIER_COLOR[m.tier] + '20' }]}>
                  <Text style={[styles.avatarText, { color: TIER_COLOR[m.tier] }]}>
                    {m.name.charAt(0).toUpperCase()}
                  </Text>
                </View>

                {/* Info */}
                <View style={styles.memberInfo}>
                  <View style={styles.memberNameRow}>
                    <Text style={styles.memberName} numberOfLines={1}>{m.name}</Text>
                    <View style={[styles.tierBadge, { backgroundColor: TIER_COLOR[m.tier] + '20' }]}>
                      <Text style={[styles.tierText, { color: TIER_COLOR[m.tier] }]}>{m.tier}</Text>
                    </View>
                  </View>
                  <Text style={styles.memberMeta}>
                    {m.plans} plan{m.plans !== 1 ? 's' : ''} · {m.visits} visit{m.visits !== 1 ? 's' : ''}
                  </Text>
                </View>

                {/* LTV */}
                <Text style={styles.ltvVal}>₹{m.ltv.toLocaleString('en-IN')}</Text>
              </View>
            </FadeInView>
          ))}

          {members.length === 0 && (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>📭</Text>
              <Text style={styles.emptyText}>No member data yet.{'\n'}Add members and record payments to see LTV rankings.</Text>
            </View>
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      </>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    scroll:    { paddingHorizontal: 16, paddingTop: 16 },
    center:    { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg },

    statRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
    statBox: {
      flex: 1, backgroundColor: Colors.bgCard, borderRadius: 16,
      borderWidth: 1, padding: 14, alignItems: 'center', gap: 4,
    },
    statEmoji: { fontSize: 22 },
    statVal:   { fontFamily: Fonts.condensedBold, fontSize: 18 },
    statLbl:   { fontFamily: Fonts.bold, fontSize: 8, color: Colors.textMuted, letterSpacing: 1 },

    totalCard: {
      backgroundColor: Colors.bgCard, borderRadius: 18, borderWidth: 1,
      borderColor: Colors.accent + '30', padding: 20, alignItems: 'center',
      marginBottom: 14, gap: 4,
    },
    totalLabel: { fontFamily: Fonts.bold, fontSize: 10, color: Colors.accent, letterSpacing: 1.5 },
    totalVal:   { fontFamily: Fonts.condensedBold, fontSize: 36, color: Colors.text },
    totalSub:   { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted },

    sortRow:         { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
    sortLabel:       { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted, letterSpacing: 1 },
    sortBtn:         { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: Colors.bgCard, borderWidth: 1,
  borderColor: Colors.border },
    sortBtnActive:   { backgroundColor: Colors.accent, borderColor: Colors.accent },
    sortBtnText:     { fontFamily: Fonts.bold, fontSize: 11, color: Colors.textMuted },
    sortBtnTextActive: { color: '#000' },

    memberRow: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      backgroundColor: Colors.bgCard, borderRadius: 14, borderWidth: 1,
      borderColor: Colors.border, padding: 12, marginBottom: 8,
    },
    rankWrap:   { width: 24, alignItems: 'center' },
    rank:       { fontFamily: Fonts.bold, fontSize: 11, color: Colors.textMuted },
    avatar:     { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontFamily: Fonts.bold, fontSize: 16 },
    memberInfo:    { flex: 1 },
    memberNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    memberName:    { fontFamily: Fonts.bold, fontSize: 14, color: Colors.text, flex: 1 },
    tierBadge:     { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
    tierText:      { fontFamily: Fonts.bold, fontSize: 9, letterSpacing: 0.5 },
    memberMeta:    { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 2 },
    ltvVal:        { fontFamily: Fonts.condensedBold, fontSize: 16, color: Colors.text },

    emptyCard: {
      backgroundColor: Colors.bgCard, borderRadius: 18, borderWidth: 1,
      borderColor: Colors.border, padding: 32, alignItems: 'center', gap: 12,
    },
    emptyEmoji: { fontSize: 40 },
    emptyText:  { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
  });
