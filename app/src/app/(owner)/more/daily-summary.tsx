 import { useState, useCallback } from 'react';                                                                       
  import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';                                   import { Stack, useFocusEffect } from 'expo-router';                                                                 
  import { MaterialCommunityIcons } from '@expo/vector-icons';                                                         
  import LottieView from 'lottie-react-native';
  import { Colors } from '@/constants/colors';
  import { Fonts } from '@/constants/fonts';
  import FadeInView from '@/components/FadeInView';
  import { supabase } from '@/lib/supabase';
  import { useAuthStore } from '@/store/authStore';

  type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

  interface SummaryData {
    revenueToday:   number;
    revenueMonth:   number;
    checkInsToday:  number;
    newMembers:     number;
    activeMembers:  number;
    expiringSoon:   number;
    expensesMonth:  number;
    recentPayments: { member_name: string; amount: number; method: string }[];
    recentCheckIns: { full_name: string; check_in_time: string }[];
  }

  export default function DailySummaryScreen() {
    const { profile, activeGymId, branches } = useAuthStore();
    const [data, setData]               = useState<SummaryData | null>(null);
    const [loading, setLoading]         = useState(true);
    const [lastRefresh, setLastRefresh] = useState(new Date());

    const getGymIds = useCallback((): string[] => {
      const mainGymId = (profile as any)?.gym_id;
      if (!mainGymId) return [];
      if (activeGymId === 'all') return branches.length > 0 ? branches.map(b => b.id) : [mainGymId];
      return [activeGymId ?? mainGymId];
    }, [activeGymId, branches, profile]);

    const fetchSummary = useCallback(async () => {
      const gymIds = getGymIds();
      if (gymIds.length === 0) return;
      setLoading(true);

      const today      = new Date().toISOString().split('T')[0];
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];     
      const in7Days    = new Date(); in7Days.setDate(in7Days.getDate() + 7);
      const in7Str     = in7Days.toISOString().split('T')[0];

      const [
        paymentsTodayRes,
        paymentsMonthRes,
        checkInsTodayRes,
        newMembersRes,
        activeMembersRes,
        expiringRes,
        expensesRes,
        recentCheckInsRes,
      ] = await Promise.all([
        supabase.from('payments').select('amount').in('gym_id', gymIds).eq('payment_date', today),
        supabase.from('payments').select('amount').in('gym_id', gymIds).gte('payment_date', monthStart),
        supabase.from('attendance').select('id', { count: 'exact', head: true }).in('gym_id',
  gymIds).eq('check_in_date', today),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).in('gym_id', gymIds).eq('role',
  'member').gte('created_at', monthStart),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).in('gym_id', gymIds).eq('role',
  'member').eq('status', 'active'),
        supabase.from('member_plans').select('id', { count: 'exact', head: true }).in('gym_id', gymIds).lte('end_date',
   in7Str).eq('status', 'active'),
        supabase.from('expenses').select('amount').in('gym_id', gymIds).gte('expense_date', monthStart),
        supabase.from('attendance').select('member_id, check_in_time').in('gym_id', gymIds).eq('check_in_date',        
  today).order('check_in_time', { ascending: false }).limit(5),
      ]);

      const { data: recentPay } = await supabase
        .from('payments')
        .select('amount, payment_method, member_id')
        .in('gym_id', gymIds)
        .eq('payment_date', today)
        .order('created_at', { ascending: false })
        .limit(5);

      const checkInMemberIds = (recentCheckInsRes.data ?? []).map((c: any) => c.member_id);
      const paymentMemberIds = (recentPay ?? []).map((p: any) => p.member_id);
      const allMemberIds     = [...new Set([...checkInMemberIds, ...paymentMemberIds])];

      let nameMap: Record<string, string> = {};
      if (allMemberIds.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', allMemberIds);     
        (profiles ?? []).forEach(p => { nameMap[p.id] = p.full_name; });
      }

      setData({
        revenueToday:   (paymentsTodayRes.data ?? []).reduce((s: number, p: any) => s + p.amount, 0),
        revenueMonth:   (paymentsMonthRes.data ?? []).reduce((s: number, p: any) => s + p.amount, 0),
        checkInsToday:  checkInsTodayRes.count ?? 0,
        newMembers:     newMembersRes.count ?? 0,
        activeMembers:  activeMembersRes.count ?? 0,
        expiringSoon:   expiringRes.count ?? 0,
        expensesMonth:  (expensesRes.data ?? []).reduce((s: number, e: any) => s + e.amount, 0),
        recentPayments: (recentPay ?? []).map((p: any) => ({
          member_name: nameMap[p.member_id] ?? 'Unknown',
          amount:      p.amount,
          method:      p.payment_method,
        })),
        recentCheckIns: (recentCheckInsRes.data ?? []).map((c: any) => ({
          full_name:     nameMap[c.member_id] ?? 'Unknown',
          check_in_time: c.check_in_time ?? '',
        })),
      });

      setLastRefresh(new Date());
      setLoading(false);
    }, [getGymIds]);

    useFocusEffect(useCallback(() => { fetchSummary(); }, [fetchSummary]));

    const fmt = (n: number) =>
      n >= 100000 ? `₹${(n / 100000).toFixed(1)}L`
      : n >= 1000  ? `₹${(n / 1000).toFixed(1)}K`
      : `₹${n}`;

    // ── Loading ──────────────────────────────────────────────────────
    if (loading) {
      return (
        <>
          <Stack.Screen options={{ title: '', headerStyle: { backgroundColor: '#0a0a0a' }, headerTintColor: '#fff' }}  
  />
          <View style={s.loadingContainer}>
            <LottieView
              source={require('@/assets/animations/Turkey Power Walk.json')}
              autoPlay loop style={s.loadingLottie}
            />
            <Text style={s.loadingTitle}>LOADING SUMMARY</Text>
            <Text style={s.loadingSub}>Crunching today's numbers...</Text>
          </View>
        </>
      );
    }

    const todayLabel = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });     
    const net        = (data?.revenueMonth ?? 0) - (data?.expensesMonth ?? 0);

    const statCards: { label: string; value: string; color: string; icon: IconName }[] = data ? [
      { label: "TODAY'S REVENUE",  value: fmt(data.revenueToday),        color: '#22c55e', icon: 'trending-up'
    },
      { label: 'MONTH REVENUE',    value: fmt(data.revenueMonth),        color: Colors.accent, icon: 'chart-line'      
    },
      { label: 'CHECK-INS TODAY',  value: data.checkInsToday.toString(), color: '#3B82F6', icon: 'door-open'
    },
      { label: 'NEW THIS MONTH',   value: data.newMembers.toString(),    color: '#A78BFA', icon: 'account-plus-outline'
    },
      { label: 'ACTIVE MEMBERS',   value: data.activeMembers.toString(), color: '#22c55e', icon:
  'account-check-outline' },
      { label: 'EXPIRING SOON',    value: data.expiringSoon.toString(),  color: '#f97316', icon: 'clock-alert-outline' 
    },
      { label: 'EXPENSES (MONTH)', value: fmt(data.expensesMonth),       color: '#ef4444', icon: 'cash-minus'
    },
      { label: 'NET THIS MONTH',   value: fmt(net), color: net >= 0 ? '#22c55e' : '#ef4444', icon: 'scale-balance'     
   },
    ] : [];

    return (
      <>
        <Stack.Screen options={{ title: '', headerStyle: { backgroundColor: '#0a0a0a' }, headerTintColor: '#fff' }} /> 
        <ScrollView style={s.container} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Lottie Banner ── */}
          <FadeInView delay={0}>
            <View style={s.lottieBanner}>
              <View style={s.lottieBannerLeft}>
                <Text style={s.lottieBannerMicro}>DAILY SNAPSHOT</Text>
                <Text style={s.lottieBannerTitle}>{todayLabel.toUpperCase()}</Text>
                <Text style={s.lottieBannerSub}>
                  Refreshed {lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <LottieView
                source={require('@/assets/animations/Analytics.json')}
                autoPlay loop
                style={s.lottieAnim}
              />
            </View>
          </FadeInView>

          {/* ── Refresh Button ── */}
          <FadeInView delay={40}>
            <TouchableOpacity style={s.refreshBtn} onPress={fetchSummary}>
              <MaterialCommunityIcons name="refresh" size={18} color={Colors.accent} />
              <Text style={s.refreshBtnText}>REFRESH DATA</Text>
            </TouchableOpacity>
          </FadeInView>

          {/* ── Stats ── */}
          <Text style={s.sectionLabel}>TODAY AT A GLANCE</Text>
          <View style={s.statsCard}>
            {statCards.map((card, i) => (
              <FadeInView key={card.label} delay={80 + i * 40}>
                <View style={[s.statRow, i < statCards.length - 1 && s.statRowBorder]}>
                  <View style={[s.statIconWrap, { backgroundColor: card.color + '12' }]}>
                    <MaterialCommunityIcons name={card.icon} size={20} color={card.color} />
                  </View>
                  <Text style={s.statRowLabel}>{card.label}</Text>
                  <Text style={[s.statRowVal, { color: card.color }]}>{card.value}</Text>
                </View>
              </FadeInView>
            ))}
          </View>

          {/* ── Recent Check-ins ── */}
          {(data?.recentCheckIns.length ?? 0) > 0 && (
            <FadeInView delay={400}>
              <Text style={s.sectionLabel}>RECENT CHECK-INS</Text>
              <View style={s.card}>
                {data!.recentCheckIns.map((c, i) => (
                  <View key={i} style={[s.listRow, i < data!.recentCheckIns.length - 1 && s.rowBorder]}>
                    <View style={s.listAvatar}>
                      <Text style={s.listAvatarText}>
                        {c.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={s.listName}>{c.full_name}</Text>
                    <Text style={s.listMeta}>{c.check_in_time}</Text>
                  </View>
                ))}
              </View>
            </FadeInView>
          )}

          {/* ── Recent Payments ── */}
          {(data?.recentPayments.length ?? 0) > 0 && (
            <FadeInView delay={440}>
              <Text style={s.sectionLabel}>TODAY'S PAYMENTS</Text>
              <View style={s.card}>
                {data!.recentPayments.map((p, i) => (
                  <View key={i} style={[s.listRow, i < data!.recentPayments.length - 1 && s.rowBorder]}>
                    <View style={[s.listAvatar, { backgroundColor: '#22c55e18' }]}>
                      <Text style={[s.listAvatarText, { color: '#22c55e' }]}>
                        {p.member_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.listName}>{p.member_name}</Text>
                      <Text style={s.listMeta}>{p.method.replace('_', ' ').toUpperCase()}</Text>
                    </View>
                    <Text style={s.listAmount}>+{fmt(p.amount)}</Text>
                  </View>
                ))}
              </View>
            </FadeInView>
          )}

          {/* ── Expiry Alert ── */}
          {(data?.expiringSoon ?? 0) > 0 && (
            <FadeInView delay={480}>
              <View style={s.alertCard}>
                <View style={s.alertIconWrap}>
                  <MaterialCommunityIcons name="clock-alert-outline" size={22} color="#f97316" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.alertTitle}>{data!.expiringSoon} MEMBERSHIPS EXPIRING</Text>
                  <Text style={s.alertDesc}>Within the next 7 days — take action now</Text>
                </View>
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

    // Lottie Banner
    lottieBanner: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: '#141414', borderRadius: 20,
      paddingLeft: 20, paddingVertical: 20,
      borderWidth: 1, borderColor: Colors.accent + '25',
      marginBottom: 12, overflow: 'hidden',
    },
    lottieBannerLeft:  { flex: 1 },
    lottieBannerMicro: { fontFamily: Fonts.bold, fontSize: 10, color: Colors.accent, letterSpacing: 2 },
    lottieBannerTitle: { fontFamily: Fonts.condensedBold, fontSize: 26, color: '#fff', letterSpacing: 0.5, marginTop: 4
   },
    lottieBannerSub:   { fontFamily: Fonts.regular, fontSize: 13, color: '#555', marginTop: 6 },
    lottieAnim:        { width: 180, height: 180 },

    // Refresh
    refreshBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 8, backgroundColor: '#141414', borderRadius: 14,
      paddingVertical: 14, borderWidth: 1, borderColor: Colors.accent + '30',
      marginBottom: 20,
    },
    refreshBtnText: { fontFamily: Fonts.bold, fontSize: 12, color: Colors.accent, letterSpacing: 1.5 },

    // Section label
    sectionLabel: { fontFamily: Fonts.bold, fontSize: 10, color: '#444', letterSpacing: 2, marginBottom: 12 },

    // Stats card
    statsCard:     { backgroundColor: '#141414', borderRadius: 18, borderWidth: 1, borderColor: '#1e1e1e', overflow:   
  'hidden', marginBottom: 24 },
    statRow:       { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingVertical: 16 },
    statRowBorder: { borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
    statIconWrap:  { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },        
    statRowLabel:  { fontFamily: Fonts.bold, fontSize: 13, color: '#888', letterSpacing: 0.5, flex: 1 },
    statRowVal:    { fontFamily: Fonts.condensedBold, fontSize: 26 },

    // Generic card
    card:      { backgroundColor: '#141414', borderRadius: 18, borderWidth: 1, borderColor: '#1e1e1e', overflow:       
  'hidden', marginBottom: 24 },
    rowBorder: { borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },

    // List rows
    listRow:        { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingVertical: 16  
  },
    listAvatar:     { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.accent + '15', justifyContent:  
  'center', alignItems: 'center' },
    listAvatarText: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.accent },
    listName:       { fontFamily: Fonts.bold, fontSize: 15, color: '#fff', flex: 1 },
    listMeta:       { fontFamily: Fonts.regular, fontSize: 13, color: '#555' },
    listAmount:     { fontFamily: Fonts.condensedBold, fontSize: 22, color: '#22c55e' },

    // Alert
    alertCard:     { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#f9731610', borderRadius:  
  18, padding: 18, borderWidth: 1, borderColor: '#f9731630', marginBottom: 16 },
    alertIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#f9731618', justifyContent: 'center',  
  alignItems: 'center' },
    alertTitle:    { fontFamily: Fonts.bold, fontSize: 14, color: '#f97316', letterSpacing: 0.5 },
    alertDesc:     { fontFamily: Fonts.regular, fontSize: 13, color: '#777', marginTop: 3 },
  });
