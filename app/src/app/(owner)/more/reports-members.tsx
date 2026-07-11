 import { useState, useCallback } from 'react';                                                                       
  import { View, Text, StyleSheet, ScrollView } from 'react-native';                                                     import { Stack, useFocusEffect } from 'expo-router';                                                                 
  import { MaterialCommunityIcons } from '@expo/vector-icons';                                                         
  import LottieView from '@/components/AppLottie';
  import { Colors } from '@/constants/colors';
  import { Fonts } from '@/constants/fonts';
  import { supabase } from '@/lib/supabase';
  import { useAuthStore } from '@/store/authStore';
  import FadeInView from '@/components/FadeInView';
  import HorizontalBar from '@/components/reports/HorizontalBar';

  type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

  const GOAL_COLORS: Record<string, string> = {
    'Weight Loss':    '#ef4444',
    'Muscle Gain':    '#22c55e',
    'Fitness':        Colors.accent,
    'Cardio':         '#3B82F6',
    'Flexibility':    '#EC4899',
    'General Health': '#888',
  };

  const PLAN_COLORS = [Colors.accent, '#22c55e', '#4F6EF7', '#f97316', '#EC4899'];

  interface MembersData {
    total:         number;
    active:        number;
    expired:       number;
    suspended:     number;
    maleCount:     number;
    femaleCount:   number;
    otherCount:    number;
    goalBreakdown: { label: string; value: number; color: string }[];
    planBreakdown: { label: string; value: number; color: string }[];
  }

  export default function ReportsMembersScreen() {
    const { profile, activeGymId, branches } = useAuthStore();
    const [data, setData]       = useState<MembersData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
      if (!profile?.gym_id) return;
      setLoading(true);

      const mainGymId = profile.gym_id;
      const gymIds    = activeGymId === 'all' ? branches.map(b => b.id) : [activeGymId ?? mainGymId];

      const { data: members } = await supabase
        .from('profiles')
        .select('id, status, gender, goal')
        .in('gym_id', gymIds)
        .eq('role', 'member');

      if (!members) { setLoading(false); return; }

      const active    = members.filter(m => m.status === 'active').length;
      const expired   = members.filter(m => m.status === 'expired').length;
      const suspended = members.filter(m => m.status === 'suspended').length;

      const maleCount   = members.filter(m => m.gender === 'male').length;
      const femaleCount = members.filter(m => m.gender === 'female').length;
      const otherCount  = members.length - maleCount - femaleCount;

      const goalMap: Record<string, number> = {};
      members.forEach((m: any) => {
        if (m.goal) goalMap[m.goal] = (goalMap[m.goal] || 0) + 1;
      });
      const goalBreakdown = Object.entries(goalMap)
        .map(([label, value]) => ({ label, value, color: GOAL_COLORS[label] ?? Colors.accent }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      const memberIds = members.map(m => m.id);
      let planBreakdown: { label: string; value: number; color: string }[] = [];

      if (memberIds.length > 0) {
        const { data: planData } = await supabase
          .from('member_plans')
          .select('member_id, membership_plans(name)')
          .in('member_id', memberIds)
          .eq('status', 'active');

        const planMap: Record<string, number> = {};
        (planData ?? []).forEach((p: any) => {
          const name = p.membership_plans?.name;
          if (name) planMap[name] = (planMap[name] || 0) + 1;
        });
        planBreakdown = Object.entries(planMap)
          .map(([label, value], i) => ({ label, value, color: PLAN_COLORS[i % PLAN_COLORS.length] }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5);
      }

      setData({ total: members.length, active, expired, suspended, maleCount, femaleCount, otherCount, goalBreakdown,  
  planBreakdown });
      setLoading(false);
    }, [profile?.gym_id, activeGymId, branches]);

    useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

    // ── Loading ──────────────────────────────────────────────────────
    if (loading) {
      return (
        <>
          <Stack.Screen options={{ title: '', headerStyle: { backgroundColor: '#0a0a0a' }, headerTintColor: '#fff' }}  
  />
          <View style={s.loadingContainer}>
            <LottieView source={require('@/assets/animations/Turkey Power Walk.json')} autoPlay loop
  style={s.loadingLottie} />
            <Text style={s.loadingTitle}>LOADING MEMBERS</Text>
            <Text style={s.loadingSub}>Analysing member data...</Text>
          </View>
        </>
      );
    }

    const total = data?.total || 1;

    const topStats: { label: string; value: number; color: string; icon: IconName }[] = [
      { label: 'TOTAL MEMBERS', value: data?.total     ?? 0, color: Colors.accent, icon: 'account-group-outline'  },
      { label: 'ACTIVE',        value: data?.active    ?? 0, color: '#22c55e',     icon: 'account-check-outline'  },   
      { label: 'EXPIRED',       value: data?.expired   ?? 0, color: '#ef4444',     icon: 'account-off-outline'    },   
      { label: 'SUSPENDED',     value: data?.suspended ?? 0, color: '#f97316',     icon: 'account-cancel-outline' },   
    ];

    return (
      <>
        <Stack.Screen options={{ title: '', headerStyle: { backgroundColor: '#0a0a0a' }, headerTintColor: '#fff' }} /> 
        <ScrollView style={s.container} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Header ── */}
          <FadeInView delay={0}>
            <View style={s.header}>
              <Text style={s.headerMicro}>ANALYTICS</Text>
              <Text style={s.headerTitle}>MEMBER{'\n'}INSIGHTS</Text>
              <Text style={s.headerSub}>
                {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </Text>
            </View>
          </FadeInView>

          {/* ── Top Stats ── */}
          <FadeInView delay={40}>
            <Text style={s.sectionLabel}>OVERVIEW</Text>
            <View style={s.statsCard}>
              {topStats.map((stat, i) => (
                <View key={stat.label} style={[s.statRow, i < topStats.length - 1 && s.rowBorder]}>
                  <View style={[s.statIconWrap, { backgroundColor: stat.color + '12' }]}>
                    <MaterialCommunityIcons name={stat.icon} size={20} color={stat.color} />
                  </View>
                  <Text style={s.statRowLabel}>{stat.label}</Text>
                  <Text style={[s.statRowVal, { color: stat.color }]}>{stat.value}</Text>
                </View>
              ))}
            </View>
          </FadeInView>

          {/* ── Membership Status ── */}
          <FadeInView delay={80}>
            <Text style={s.sectionLabel}>MEMBERSHIP STATUS</Text>
            <View style={s.card}>
              <HorizontalBar label="Active"    value={data?.active    ?? 0} total={total} color="#22c55e"     />       
              <HorizontalBar label="Expired"   value={data?.expired   ?? 0} total={total} color="#ef4444"     />       
              <HorizontalBar label="Suspended" value={data?.suspended ?? 0} total={total} color="#f97316"     />       
            </View>
          </FadeInView>

          {/* ── Gender Split ── */}
          <FadeInView delay={140}>
            <Text style={s.sectionLabel}>GENDER SPLIT</Text>
            <View style={s.card}>
              <HorizontalBar label="Male"   value={data?.maleCount   ?? 0} total={total} color={Colors.accent} />      
              <HorizontalBar label="Female" value={data?.femaleCount ?? 0} total={total} color="#EC4899"        />     
              <HorizontalBar label="Other"  value={data?.otherCount  ?? 0} total={total} color="#555"           />     
            </View>
          </FadeInView>

          {/* ── Fitness Goals ── */}
          {(data?.goalBreakdown.length ?? 0) > 0 && (
            <FadeInView delay={200}>
              <Text style={s.sectionLabel}>FITNESS GOALS</Text>
              <View style={s.card}>
                {data!.goalBreakdown.map(g => (
                  <HorizontalBar key={g.label} label={g.label} value={g.value} total={total} color={g.color} />        
                ))}
              </View>
            </FadeInView>
          )}

          {/* ── Popular Plans ── */}
          {(data?.planBreakdown.length ?? 0) > 0 && (
            <FadeInView delay={260}>
              <Text style={s.sectionLabel}>POPULAR PLANS</Text>
              <View style={s.card}>
                {data!.planBreakdown.map(p => (
                  <HorizontalBar key={p.label} label={p.label} value={p.value} total={data?.active || 1}
  color={p.color} />
                ))}
              </View>
            </FadeInView>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </>
    );
  }

  const s = StyleSheet.create({
    // Loading
    loadingContainer: { flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center' },
    loadingLottie:    { width: 200, height: 200 },
    loadingTitle:     { fontFamily: Fonts.condensedBold, fontSize: 20, color: '#fff', letterSpacing: 4, marginTop: 8 },
    loadingSub:       { fontFamily: Fonts.regular, fontSize: 14, color: '#444', marginTop: 6 },

    // Layout
    container: { flex: 1, backgroundColor: '#0a0a0a' },
    scroll:    { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 },

    // Header
    header:      { paddingVertical: 20, marginBottom: 8 },
    headerMicro: { fontFamily: Fonts.bold, fontSize: 10, color: Colors.accent, letterSpacing: 2 },
    headerTitle: { fontFamily: Fonts.condensedBold, fontSize: 42, color: '#fff', letterSpacing: 1, marginTop: 4,       
  lineHeight: 46 },
    headerSub:   { fontFamily: Fonts.regular, fontSize: 14, color: '#555', marginTop: 6 },

    // Section label
    sectionLabel: { fontFamily: Fonts.bold, fontSize: 10, color: '#444', letterSpacing: 2, marginBottom: 12 },

    // Stats card
    statsCard:    { backgroundColor: '#141414', borderRadius: 18, borderWidth: 1, borderColor: '#1e1e1e', overflow:    
  'hidden', marginBottom: 24 },
    statRow:      { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingVertical: 16 }, 
    rowBorder:    { borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
    statIconWrap: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    statRowLabel: { fontFamily: Fonts.bold, fontSize: 14, color: '#888', flex: 1 },
    statRowVal:   { fontFamily: Fonts.condensedBold, fontSize: 28 },

    // Card for horizontal bars
    card: { backgroundColor: '#141414', borderRadius: 18, borderWidth: 1, borderColor: '#1e1e1e', padding: 18,
  marginBottom: 24, gap: 14 },
  });
