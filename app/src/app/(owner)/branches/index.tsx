 import { useState, useCallback } from 'react';
  import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
  import { Stack, useRouter, useFocusEffect } from 'expo-router';
  import { MaterialCommunityIcons } from '@expo/vector-icons';
  import { Colors } from '@/constants/colors';
  import { Fonts } from '@/constants/fonts';
  import AnimatedPressable from '@/components/AnimatedPressable';
  import FadeInView from '@/components/FadeInView';
  import { supabase } from '@/lib/supabase';
  import { useAuthStore } from '@/store/authStore';
   import LottieView from 'lottie-react-native';

  interface BranchStats {
    id: string;
    name: string;
    branch_code: string | null;
    branch_city: string | null;
    branch_address: string | null;
    is_branch: boolean;
    memberCount: number;
    monthRevenue: number;
    todayCheckIns: number;
  }

  export default function BranchesScreen() {
    const { profile, activeGymId, setActiveGym, fetchBranches } = useAuthStore();
    const router  = useRouter();
    const [branches, setBranches] = useState<BranchStats[]>([]);
    const [loading, setLoading]  = useState(true);

    const fetchData = useCallback(async () => {
      if (!(profile as any)?.gym_id) return;
      setLoading(true);

      const mainGymId = (profile as any).gym_id;
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];   
      const today      = new Date().toISOString().split('T')[0];

      // Fetch all gyms (main + branches)
      const { data: gyms } = await supabase
        .from('gyms')
        .select('id, name, branch_code, branch_city, branch_address, is_branch')
        .or(`id.eq.${mainGymId},parent_gym_id.eq.${mainGymId}`)
        .order('is_branch', { ascending: true });

      if (!gyms) { setLoading(false); return; }

      // Fetch stats for each gym in parallel
      const statsPromises = gyms.map(async (gym) => {
        const [membersRes, revenueRes, checkInsRes] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true })
            .eq('gym_id', gym.id).eq('role', 'member'),
          supabase.from('payments').select('amount')
            .eq('gym_id', gym.id).gte('payment_date', monthStart),
          supabase.from('attendance').select('id', { count: 'exact', head: true })
            .eq('gym_id', gym.id).eq('check_in_date', today),
        ]);

        const monthRevenue = (revenueRes.data ?? []).reduce((s: number, p: any) => s + (p.amount || 0), 0);

        return {
          ...gym,
          memberCount:   membersRes.count   ?? 0,
          monthRevenue,
          todayCheckIns: checkInsRes.count  ?? 0,
        } as BranchStats;
      });

      const results = await Promise.all(statsPromises);
      setBranches(results);
      setLoading(false);
    }, [(profile as any)?.gym_id]);

    useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

    const fmtCurrency = (n: number) =>
      n >= 100000 ? `₹${(n / 100000).toFixed(1)}L`
      : n >= 1000  ? `₹${(n / 1000).toFixed(1)}K`
      : `₹${n}`;

    const totalMembers  = branches.reduce((s, b) => s + b.memberCount, 0);
    const totalRevenue  = branches.reduce((s, b) => s + b.monthRevenue, 0);
    const totalCheckIns = branches.reduce((s, b) => s + b.todayCheckIns, 0);

    if (loading) return (
    <>
      <Stack.Screen options={{ title: 'Branches' }} />
      <View style={{ flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center' }}>
        <LottieView
          source={require('@/assets/animations/Turkey Power Walk.json')}
          autoPlay loop
          style={{ width: 200, height: 200 }}
        />
        <Text style={{ fontFamily: Fonts.condensedBold, fontSize: 20, color: '#fff', letterSpacing: 4, marginTop: 8 }}>
          loading branch ..
        </Text>
      </View>
    </>
  );

    return (
      <>
        <Stack.Screen options={{ title: 'Branches' }} />
        <ScrollView style={styles.container} contentContainerStyle={styles.scroll}
  showsVerticalScrollIndicator={false}>

          {/* Consolidated Stats */}
          <FadeInView delay={0}>
            <View style={styles.consolidatedCard}>
              <View style={styles.consolidatedGlow} />
              <Text style={styles.consolidatedLabel}>CONSOLIDATED — ALL BRANCHES</Text>
              <View style={styles.consolidatedStats}>
                {[
                  { emoji: '🏪', val: branches.length, label: 'LOCATIONS'   },
                  { emoji: '👥', val: totalMembers,    label: 'MEMBERS'     },
                  { emoji: '📅', val: totalCheckIns,   label: 'TODAY'       },
                  { emoji: '💰', val: fmtCurrency(totalRevenue), label: 'THIS MONTH' },
                ].map(s => (
                  <View key={s.label} style={styles.cStat}>
                    <Text style={styles.cStatEmoji}>{s.emoji}</Text>
                    <Text style={styles.cStatVal}>{s.val}</Text>
                    <Text style={styles.cStatLabel}>{s.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </FadeInView>

          {/* Add Branch Button */}
          <FadeInView delay={60}>
            <AnimatedPressable
              style={styles.addBtn}
              scaleDown={0.97}
              onPress={() => router.push('/(owner)/branches/add' as any)}
            >
              <MaterialCommunityIcons name="plus-circle-outline" size={20} color={Colors.accent} />
              <Text style={styles.addBtnText}>ADD NEW BRANCH</Text>
            </AnimatedPressable>
          </FadeInView>

          {/* Branch Cards */}
          <Text style={styles.sectionLabel}>{branches.length} LOCATION{branches.length !== 1 ? 'S' : ''}</Text>      
          {branches.map((branch, i) => {
            const isActive = activeGymId === branch.id;
            return (
              <FadeInView key={branch.id} delay={80 + i * 60}>
                <AnimatedPressable
                  style={[styles.branchCard, isActive && styles.branchCardActive]}
                  scaleDown={0.98}
                  onPress={() => {
                    setActiveGym(branch.id);
                    router.push(`/(owner)/branches/${branch.id}` as any);
                  }}
                >
                  <View style={styles.branchCardTop}>
                    <View style={styles.branchIcon}>
                      <MaterialCommunityIcons
                        name={branch.is_branch ? 'source-branch' : 'crown-outline'}
                        size={22} color={Colors.accent}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.branchNameRow}>
                        <Text style={styles.branchName}>{branch.name}</Text>
                        {!branch.is_branch && (
                          <View style={styles.mainBadge}>
                            <Text style={styles.mainBadgeText}>MAIN</Text>
                          </View>
                        )}
                        {isActive && (
                          <View style={styles.activeBadge}>
                            <Text style={styles.activeBadgeText}>ACTIVE</Text>
                          </View>
                        )}
                      </View>
                      {(branch.branch_city || branch.branch_code) && (
                        <Text style={styles.branchCity}>
                          {branch.branch_code ? `[${branch.branch_code}]  ` : ''}{branch.branch_city ?? ''}
                        </Text>
                      )}
                      {branch.branch_address && (
                        <Text style={styles.branchAddress} numberOfLines={1}>{branch.branch_address}</Text>
                      )}
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.textMuted} />
                  </View>

                  <View style={styles.branchStats}>
                    {[
                      { val: branch.memberCount,              label: 'MEMBERS'     },
                      { val: branch.todayCheckIns,            label: 'TODAY IN'    },
                      { val: fmtCurrency(branch.monthRevenue), label: 'THIS MONTH' },
                    ].map(s => (
                      <View key={s.label} style={styles.branchStat}>
                        <Text style={styles.branchStatVal}>{s.val}</Text>
                        <Text style={styles.branchStatLabel}>{s.label}</Text>
                      </View>
                    ))}
                  </View>

                  <AnimatedPressable
                    style={[styles.switchBtn, isActive && styles.switchBtnActive]}
                    scaleDown={0.95}
                    onPress={() => setActiveGym(branch.id)}
                  >
                    <MaterialCommunityIcons
                      name={isActive ? 'check-circle' : 'swap-horizontal'}
                      size={14}
                      color={isActive ? Colors.green : Colors.accent}
                    />
                    <Text style={[styles.switchBtnText, isActive && { color: Colors.green }]}>
                      {isActive ? 'CURRENTLY MANAGING' : 'SWITCH TO THIS BRANCH'}
                    </Text>
                  </AnimatedPressable>
                </AnimatedPressable>
              </FadeInView>
            );
          })}

          <View style={{ height: 32 }} />
        </ScrollView>
      </>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    scroll:    { padding: 16, gap: 12 },

    consolidatedCard:  { backgroundColor: Colors.bgCard, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: 
  Colors.accent + '30', overflow: 'hidden', gap: 14 },
    consolidatedGlow:  { position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: 50,      
  backgroundColor: Colors.accentGlow },
    consolidatedLabel: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.accent, letterSpacing: 1.8 },
    consolidatedStats: { flexDirection: 'row' },
    cStat:      { flex: 1, alignItems: 'center', gap: 3 },
    cStatEmoji: { fontSize: 18 },
    cStatVal:   { fontFamily: Fonts.condensedBold, fontSize: 20, color: Colors.text },
    cStatLabel: { fontFamily: Fonts.bold, fontSize: 8, color: Colors.textMuted, letterSpacing: 1 },

    addBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14,
   borderRadius: 14, borderWidth: 1, borderColor: Colors.accent + '50', borderStyle: 'dashed', backgroundColor:      
  Colors.accentMuted },
    addBtnText: { fontFamily: Fonts.bold, fontSize: 12, color: Colors.accent, letterSpacing: 1.2 },

    sectionLabel: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted, letterSpacing: 1.5 },

    branchCard:       { backgroundColor: Colors.bgCard, borderRadius: 16, padding: 16, borderWidth: 1, borderColor:  
  Colors.border, gap: 14 },
    branchCardActive: { borderColor: Colors.accent + '50' },
    branchCardTop:    { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    branchIcon:       { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.accentMuted, justifyContent:
   'center', alignItems: 'center' },
    branchNameRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
    branchName:       { fontFamily: Fonts.bold, fontSize: 16, color: Colors.text },
    branchCity:       { fontFamily: Fonts.medium, fontSize: 12, color: Colors.textMuted, marginTop: 2 },
    branchAddress:    { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 1 },
    mainBadge:        { backgroundColor: Colors.accent + '18', borderRadius: 6, paddingHorizontal: 7,
  paddingVertical: 2 },
    mainBadgeText:    { fontFamily: Fonts.bold, fontSize: 8, color: Colors.accent, letterSpacing: 1 },
    activeBadge:      { backgroundColor: Colors.green + '18', borderRadius: 6, paddingHorizontal: 7, paddingVertical:
   2 },
    activeBadgeText:  { fontFamily: Fonts.bold, fontSize: 8, color: Colors.green, letterSpacing: 1 },

    branchStats:     { flexDirection: 'row', backgroundColor: Colors.bgElevated, borderRadius: 10, padding: 12 },    
    branchStat:      { flex: 1, alignItems: 'center', gap: 3 },
    branchStatVal:   { fontFamily: Fonts.condensedBold, fontSize: 18, color: Colors.text },
    branchStatLabel: { fontFamily: Fonts.bold, fontSize: 8, color: Colors.textMuted, letterSpacing: 1 },

    switchBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical:
   10, borderRadius: 10, borderWidth: 1, borderColor: Colors.accent + '40', backgroundColor: Colors.accentMuted },   
    switchBtnActive: { borderColor: Colors.green + '40', backgroundColor: Colors.green + '10' },
    switchBtnText:   { fontFamily: Fonts.bold, fontSize: 11, color: Colors.accent, letterSpacing: 0.8 },
  });
