 import { useState, useCallback } from 'react';
  import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from
  'react-native';                   
  import { Stack, useFocusEffect } from 'expo-router';
  import { Colors } from '@/constants/colors';
  import { Fonts } from '@/constants/fonts';           
  import { supabase } from '@/lib/supabase';
  import { useAuthStore } from '@/store/authStore';    
  import FadeInView from '@/components/FadeInView';                                    import StatCard from '@/components/reports/StatCard';
  import HorizontalBar from '@/components/reports/HorizontalBar';                                                                                                         
  const GOAL_COLORS: Record<string, string> = {                                      
    'Weight Loss':     Colors.red,                                                   
    'Muscle Gain':     Colors.green,
    'Fitness':         Colors.accent,
    'Cardio':          '#3B82F6',
    'Flexibility':     '#EC4899',
    'General Health':  Colors.textMuted,
  };

  const PLAN_COLORS = [Colors.accent, Colors.green, '#4F6EF7', Colors.orange,        
  '#EC4899'];

  interface MembersData {
    total:          number;
    active:         number;
    expired:        number;
    suspended:      number;
    maleCount:      number;
    femaleCount:    number;
    otherCount:     number;
    goalBreakdown:  { label: string; value: number; color: string }[];
    planBreakdown:  { label: string; value: number; color: string }[];
  }

  export default function ReportsMembersScreen() {
    const { profile } = useAuthStore();
    const [data, setData]       = useState<MembersData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
      if (!profile?.gym_id) return;
      setLoading(true);

      const { data: members } = await supabase
        .from('members')
        .select('id, status, gender, goal, member_plans(status,membership_plans(name))')
        .eq('gym_id', profile.gym_id);

      if (!members) { setLoading(false); return; }

      const active    = members.filter(m => m.status === 'active').length;
      const expired   = members.filter(m => m.status === 'expired').length;
      const suspended = members.filter(m => m.status === 'suspended').length;        

      const maleCount   = members.filter(m => m.gender === 'male').length;
      const femaleCount = members.filter(m => m.gender === 'female').length;
      const otherCount  = members.length - maleCount - femaleCount;

      // Goal breakdown
      const goalMap: Record<string, number> = {};
      members.forEach((m: any) => {
        if (m.goal) goalMap[m.goal] = (goalMap[m.goal] || 0) + 1;
      });
      const goalBreakdown = Object.entries(goalMap)
        .map(([label, value]) => ({ label, value, color: GOAL_COLORS[label] ||       
  Colors.accent }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      // Plan popularity from active member_plans
      const planMap: Record<string, number> = {};
      members.forEach((m: any) => {
        const activePlan = m.member_plans?.find((mp: any) => mp.status === 'active');
        if (activePlan?.membership_plans?.name) {
          const name = activePlan.membership_plans.name;
          planMap[name] = (planMap[name] || 0) + 1;
        }
      });
      const planBreakdown = Object.entries(planMap)
        .map(([label, value], i) => ({ label, value, color: PLAN_COLORS[i %
  PLAN_COLORS.length] }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      setData({ total: members.length, active, expired, suspended, maleCount,        
  femaleCount, otherCount, goalBreakdown, planBreakdown });
      setLoading(false);
    }, [profile?.gym_id]);

    useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

    if (loading) return (
      <>
        <Stack.Screen options={{ title: 'Member Analytics' }} />
        <View style={styles.center}><ActivityIndicator color={Colors.accent}
  size="large" /></View>
      </>
    );

    const total = data?.total || 1;

    return (
      <>
        <Stack.Screen options={{ title: 'Member Analytics' }} />
        <ScrollView style={styles.container} contentContainerStyle={styles.scroll}   
  showsVerticalScrollIndicator={false}>

          <FadeInView delay={0}>
            <View style={styles.statRow}>
              <StatCard emoji="👥" label="TOTAL"   value={(data?.total    ??
  0).toString()} color={Colors.accent} />
              <StatCard emoji="✅" label="ACTIVE"  value={(data?.active   ??
  0).toString()} color={Colors.green}  />
              <StatCard emoji="❌" label="EXPIRED" value={(data?.expired  ??
  0).toString()} color={Colors.red}    />
            </View>
          </FadeInView>

          <FadeInView delay={80}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>MEMBERSHIP STATUS</Text>
              <View style={styles.barsGap}>
                <HorizontalBar label="Active"    value={data?.active    ?? 0}        
  total={total} color={Colors.green}  />
                <HorizontalBar label="Expired"   value={data?.expired   ?? 0}        
  total={total} color={Colors.red}    />
                <HorizontalBar label="Suspended" value={data?.suspended ?? 0}        
  total={total} color={Colors.orange} />
              </View>
            </View>
          </FadeInView>

          <FadeInView delay={160}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>GENDER SPLIT</Text>
              <View style={styles.barsGap}>
                <HorizontalBar label="Male"   value={data?.maleCount   ?? 0}
  total={total} color={Colors.accent}   />
                <HorizontalBar label="Female" value={data?.femaleCount ?? 0}
  total={total} color="#EC4899"          />
                <HorizontalBar label="Other"  value={data?.otherCount  ?? 0}
  total={total} color={Colors.textMuted} />
              </View>
            </View>
          </FadeInView>

          {(data?.goalBreakdown.length ?? 0) > 0 && (
            <FadeInView delay={240}>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>FITNESS GOALS</Text>
                <View style={styles.barsGap}>
                  {data!.goalBreakdown.map(g => (
                    <HorizontalBar key={g.label} label={g.label} value={g.value}     
  total={total} color={g.color} />
                  ))}
                </View>
              </View>
            </FadeInView>
          )}

          {(data?.planBreakdown.length ?? 0) > 0 && (
            <FadeInView delay={320}>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>POPULAR PLANS</Text>
                <View style={styles.barsGap}>
                  {data!.planBreakdown.map(p => (
                    <HorizontalBar key={p.label} label={p.label} value={p.value}     
  total={data?.active || 1} color={p.color} />
                  ))}
                </View>
              </View>
            </FadeInView>
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      </>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    scroll:    { paddingHorizontal: 16, paddingTop: 16 },
    center:    { flex: 1, justifyContent: 'center', alignItems: 'center',
  backgroundColor: Colors.bg },

    statRow:   { flexDirection: 'row', gap: 8, marginBottom: 14 },
    card:      { backgroundColor: Colors.bgCard, borderRadius: 18, borderWidth: 1,   
  borderColor: Colors.border, padding: 18, marginBottom: 14 },
    cardTitle: { fontFamily: Fonts.bold, fontSize: 10, color: Colors.textMuted,      
  letterSpacing: 1.5, marginBottom: 14 },
    barsGap:   { gap: 14 },
  });