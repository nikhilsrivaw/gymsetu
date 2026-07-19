import { toLocalDate, todayLocal } from '@/lib/date';
 import { useState, useCallback } from 'react';                                                                       import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';                              
  import { Stack, useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';                                import { MaterialCommunityIcons } from '@expo/vector-icons';                                                         import { Colors } from '@/constants/colors';                                                                         import { Fonts } from '@/constants/fonts';                                                                           import AnimatedPressable from '@/components/AnimatedPressable';                                                      import FadeInView from '@/components/FadeInView';                                                                    import { supabase } from '@/lib/supabase';                                                                           import { useAuthStore } from '@/store/authStore';                                                                                                                                                                                         interface BranchDetail {                                                                                               id: string;                                                                                                      
    name: string;
    branch_code: string | null;
    branch_city: string | null;
    branch_address: string | null;
    phone: string | null;
    is_branch: boolean;
  }

  interface Stats {
    totalMembers: number;
    activeMembers: number;
    todayCheckIns: number;
    monthRevenue: number;
    trainerCount: number;
    expiredCount: number;
  }

  export default function BranchDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router  = useRouter();
    const { setActiveGym, activeGymId } = useAuthStore();

    const [branch,  setBranch]  = useState<BranchDetail | null>(null);
    const [stats,   setStats]   = useState<Stats>({ totalMembers: 0, activeMembers: 0, todayCheckIns: 0,
  monthRevenue: 0, trainerCount: 0, expiredCount: 0 });
    const [loading, setLoading] = useState(true);

    useFocusEffect(useCallback(() => {
      if (!id) return;
      let active = true;

      async function load() {
        setLoading(true);

        const today      = todayLocal();
        const monthStart = toLocalDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1)); 

        const [gymRes, membersRes, activeMembersRes, expiredRes, trainersRes, checkInsRes, revenueRes] = await       
  Promise.all([
          supabase.from('gyms').select('*').eq('id', id).single(),
          supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('gym_id', id).eq('role',
  'member'),
          supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('gym_id', id).eq('role',
  'member').eq('status', 'active'),
          supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('gym_id', id).eq('role',
  'member').eq('status', 'expired'),
          supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('gym_id', id).eq('role',
  'trainer'),
          supabase.from('attendance').select('id', { count: 'exact', head: true }).eq('gym_id',
  id).eq('check_in_date', today),
          supabase.from('payments').select('amount').eq('gym_id', id).gte('payment_date', monthStart),
        ]);

        if (!active) { setLoading(false); return; }

        if (gymRes.data) setBranch(gymRes.data as BranchDetail);

        const monthRevenue = (revenueRes.data ?? []).reduce((s: number, p: any) => s + (p.amount || 0), 0);

        setStats({
          totalMembers:  membersRes.count       ?? 0,
          activeMembers: activeMembersRes.count ?? 0,
          todayCheckIns: checkInsRes.count      ?? 0,
          monthRevenue,
          trainerCount:  trainersRes.count      ?? 0,
          expiredCount:  expiredRes.count       ?? 0,
        });

        setLoading(false);
      }

      load();
      return () => { active = false; };
    }, [id]));

    const fmtCurrency = (n: number) =>
      n >= 100000 ? `₹${(n / 100000).toFixed(1)}L`
      : n >= 1000  ? `₹${(n / 1000).toFixed(1)}K`
      : `₹${n}`;

    const isActive = activeGymId === id;

    if (loading) return (
      <>
        <Stack.Screen options={{ title: '' }} />
        <View style={{ flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center' }}>       
          <ActivityIndicator color={Colors.accent} size="large" />
        </View>
      </>
    );

    return (
      <>
        <Stack.Screen options={{ title: branch?.name ?? 'Branch' }} />
        <ScrollView style={styles.container} contentContainerStyle={styles.scroll}
  showsVerticalScrollIndicator={false}>

          {/* Hero */}
          <FadeInView delay={0}>
            <View style={styles.heroCard}>
              <View style={styles.heroIcon}>
                <MaterialCommunityIcons
                  name={branch?.is_branch ? 'source-branch' : 'crown-outline'}
                  size={32} color={Colors.accent}
                />
              </View>
              <Text style={styles.heroName}>{branch?.name}</Text>
              {branch?.branch_code && (
                <View style={styles.codeBadge}>
                  <Text style={styles.codeText}>{branch.branch_code}</Text>
                </View>
              )}
              {(branch?.branch_city || branch?.branch_address) && (
                <Text style={styles.heroLocation}>
                  📍 {[branch.branch_city, branch.branch_address].filter(Boolean).join(' · ')}
                </Text>
              )}
              {branch?.phone && (
                <Text style={styles.heroPhone}>📞 {branch.phone}</Text>
              )}
            </View>
          </FadeInView>

          {/* Switch Button */}
          <FadeInView delay={50}>
            <AnimatedPressable
              style={[styles.switchBtn, isActive && styles.switchBtnActive]}
              scaleDown={0.97}
              onPress={() => setActiveGym(id)}
            >
              <MaterialCommunityIcons
                name={isActive ? 'check-circle' : 'swap-horizontal'}
                size={18}
                color={isActive ? Colors.green : Colors.accent}
              />
              <Text style={[styles.switchBtnText, isActive && { color: Colors.green }]}>
                {isActive ? 'CURRENTLY MANAGING THIS BRANCH' : 'SWITCH TO THIS BRANCH'}
              </Text>
            </AnimatedPressable>
          </FadeInView>

          {/* Stats Grid */}
          <FadeInView delay={100}>
            <View style={styles.statsGrid}>
              {[
                { emoji: '👥', val: stats.totalMembers,          label: 'TOTAL MEMBERS',  color: Colors.text    },   
                { emoji: '✅', val: stats.activeMembers,         label: 'ACTIVE',          color: Colors.green   },  
                { emoji: '❌', val: stats.expiredCount,          label: 'EXPIRED',         color: Colors.red     },  
                { emoji: '🏋️', val: stats.trainerCount,          label: 'TRAINERS',        color: '#3B82F6'      },  
                { emoji: '📅', val: stats.todayCheckIns,         label: 'TODAY IN',        color: Colors.orange  },  
                { emoji: '💰', val: fmtCurrency(stats.monthRevenue), label: 'THIS MONTH', color: Colors.accent  },   
              ].map(s => (
                <View key={s.label} style={styles.statBox}>
                  <Text style={styles.statEmoji}>{s.emoji}</Text>
                  <Text style={[styles.statVal, { color: s.color }]}>{s.val}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
          </FadeInView>

          {/* Quick Actions */}
          <FadeInView delay={160}>
            <Text style={styles.sectionLabel}>MANAGE THIS BRANCH</Text>
            <View style={styles.actionsGrid}>
              {[
                { label: 'Members',    emoji: '👥', route: '/(owner)/members'   },
                { label: 'Trainers',   emoji: '🏋️', route: '/(owner)/trainers'  },
                { label: 'Payments',   emoji: '💳', route: '/(owner)/payments'  },
                { label: 'Attendance', emoji: '📋', route: '/(owner)/more/attendance' },
              ].map(a => (
                <AnimatedPressable
                  key={a.label}
                  style={styles.actionCard}
                  scaleDown={0.95}
                  onPress={() => {
                    setActiveGym(id);
                    router.push(a.route as any);
                  }}
                >
                  <Text style={styles.actionEmoji}>{a.emoji}</Text>
                  <Text style={styles.actionLabel}>{a.label}</Text>
                </AnimatedPressable>
              ))}
            </View>
          </FadeInView>

          <View style={{ height: 32 }} />
        </ScrollView>
      </>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    scroll:    { padding: 16, gap: 12 },

    heroCard:     { backgroundColor: Colors.bgCard, borderRadius: 20, padding: 24, alignItems: 'center', gap: 8,     
  borderWidth: 1, borderColor: Colors.accent + '30' },
    heroIcon:     { width: 64, height: 64, borderRadius: 18, backgroundColor: Colors.accentMuted, justifyContent:    
  'center', alignItems: 'center', marginBottom: 4 },
    heroName:     { fontFamily: Fonts.condensedBold, fontSize: 26, color: Colors.text, letterSpacing: 0.5 },
    codeBadge:    { backgroundColor: Colors.accentMuted, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4, 
  borderWidth: 1, borderColor: Colors.accent + '40' },
    codeText:     { fontFamily: Fonts.bold, fontSize: 13, color: Colors.accent, letterSpacing: 2 },
    heroLocation: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted },
    heroPhone:    { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted },

    switchBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
  paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: Colors.accent + '50', backgroundColor:
  Colors.accentMuted },
    switchBtnActive: { borderColor: Colors.green + '50', backgroundColor: Colors.green + '10' },
    switchBtnText:   { fontFamily: Fonts.bold, fontSize: 12, color: Colors.accent, letterSpacing: 1 },

    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    statBox:   { width: '31%', backgroundColor: Colors.bgCard, borderRadius: 14, padding: 14, alignItems: 'center',  
  gap: 4, borderWidth: 1, borderColor: Colors.border },
    statEmoji: { fontSize: 20 },
    statVal:   { fontFamily: Fonts.condensedBold, fontSize: 20 },
    statLabel: { fontFamily: Fonts.bold, fontSize: 8, color: Colors.textMuted, letterSpacing: 1, textAlign: 'center' 
  },

    sectionLabel: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted, letterSpacing: 1.8 },

    actionsGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    actionCard:   { width: '47%', backgroundColor: Colors.bgCard, borderRadius: 14, padding: 18, alignItems:
  'center', gap: 8, borderWidth: 1, borderColor: Colors.border },
    actionEmoji:  { fontSize: 28 },
    actionLabel:  { fontFamily: Fonts.bold, fontSize: 13, color: Colors.text },
  });