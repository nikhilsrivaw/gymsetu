import { useState, useCallback } from 'react';                                     
  import { View, Text, StyleSheet, ScrollView } from 'react-native';                   import { MaterialCommunityIcons } from '@expo/vector-icons';                       
  import { SafeAreaView } from 'react-native-safe-area-context';                     
  import { useRouter, useFocusEffect } from 'expo-router';
  import { useAuthStore } from '@/store/authStore';                                  
  import { Colors } from '@/constants/colors';                                         import { Fonts } from '@/constants/fonts';                                         
  import AnimatedPressable from '@/components/AnimatedPressable';                    
  import FadeInView from '@/components/FadeInView';
  import { supabase } from '@/lib/supabase';

  type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];       

  const quickActions: { label: string; icon: IconName; color: string; route: string  
  }[] = [
    { label: 'ADD\nMEMBER', icon: 'account-plus-outline',    color: Colors.accent,   
  route: '/(owner)/members/add'     },
    { label: 'PAYMENT',    icon: 'credit-card-plus-outline', color: Colors.green,    
  route: '/(owner)/payments'        },
    { label: 'ATTENDANCE', icon: 'calendar-check-outline',   color: '#3B82F6',       
  route: '/(owner)/more/attendance' },
    { label: 'PLANS',      icon: 'clipboard-list-outline',   color: '#A78BFA',       
  route: '/(owner)/plans'           },
  ];

  const todayFeed: { icon: IconName; title: string; hint: string; time: string;      
  color: string }[] = [
    { icon: 'credit-card-check-outline', title: 'Rahul Sharma',  hint: 'paid ₹3,500 ·UPI',        time: '2h ago', color: Colors.green  },
    { icon: 'account-plus-outline',      title: 'Sneha Gupta',   hint: 'joined · 1   Month Plan',    time: '5h ago', color: Colors.accent },
    { icon: 'clock-alert-outline',       title: 'Vikram Singh',  hint: 'plan expired today',        time: '6h ago', color: Colors.orange },
    { icon: 'credit-card-check-outline', title: 'Priya Patel',   hint: 'paid ₹6,000 ·Cash',       time: '1d ago', color: Colors.green  },
    { icon: 'calendar-check-outline',    title: 'Attendance',    hint: 'members  checked in today',  time: '1d ago', color: '#3B82F6'     },
    { icon: 'star-outline',              title: 'Feedback',      hint: '4.8 avg · 12 new reviews',  time: '2d ago', color: '#F59E0B'     },
  ];

  interface Stats {
    todayCheckIns: number;
    expiredCount:  number;
    expiringCount: number;
    monthRevenue:  number;
  }

  export default function DashboardScreen() {
    const { profile } = useAuthStore();
    const router = useRouter();
    const hour = new Date().getHours();
    const greeting  = hour < 12 ? 'GOOD MORNING' : hour < 17 ? 'GOOD AFTERNOON' :    
  'GOOD EVENING';
    const todayLabel = new Date().toLocaleDateString('en-IN', { weekday: 'long', day:
   'numeric', month: 'short' });

    const [stats, setStats] = useState<Stats>({ todayCheckIns: 0, expiredCount: 0,   
  expiringCount: 0, monthRevenue: 0 });

    const fetchStats = useCallback(async () => {
      if (!profile?.gym_id) return;

      const todayStr   = new Date().toISOString().split('T')[0];
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString().split('T')[0];

      const [checkIns, revenue, expiredMembers, activeMembers] = await Promise.all([ 
        // Today's check-ins count
        supabase
          .from('attendance')
          .select('id', { count: 'exact', head: true })
          .eq('gym_id', profile.gym_id)
          .eq('check_in_date', todayStr),

        // This month's revenue
        supabase
          .from('payments')
          .select('amount')
          .eq('gym_id', profile.gym_id)
          .gte('payment_date', monthStart),

        // Expired members count
        supabase
          .from('members')
          .select('id', { count: 'exact', head: true })
          .eq('gym_id', profile.gym_id)
          .eq('status', 'expired'),

        // Active members + their plans (to compute expiring in 7 days)
        supabase
          .from('members')
          .select('id, member_plans(end_date, status)')
          .eq('gym_id', profile.gym_id)
          .eq('status', 'active'),
      ]);

      const monthTotal = (revenue.data ?? []).reduce((s: number, p: any) => s +      
  (p.amount || 0), 0);

      const weekLaterMs = new Date(todayStr).getTime() + 7 * 24 * 60 * 60 * 1000;    
      const expiringCount = (activeMembers.data ?? []).filter((m: any) => {
        const activePlan = m.member_plans?.find((mp: any) => mp.status === 'active');
        if (!activePlan?.end_date) return false;
        const diff = new Date(activePlan.end_date).getTime() - new
  Date(todayStr).getTime();
        return diff >= 0 && diff <= weekLaterMs - new Date(todayStr).getTime();      
      }).length;

      setStats({
        todayCheckIns: checkIns.count  ?? 0,
        expiredCount:  expiredMembers.count ?? 0,
        expiringCount,
        monthRevenue:  monthTotal,
      });
    }, [profile?.gym_id]);

    useFocusEffect(useCallback(() => { fetchStats(); }, [fetchStats]));

    const fmtCurrency = (n: number) =>
      n >= 100000 ? `₹${(n / 100000).toFixed(2)}L`
      : n >= 1000  ? `₹${(n / 1000).toFixed(1)}K`
      : `₹${n}`;

    const pulseStats = [
      { label: 'TODAY IN',   value: stats.todayCheckIns.toString(),   sub:
  'check-ins', color: Colors.green  },
      { label: 'EXPIRED',    value: stats.expiredCount.toString(),     sub:
  'members',   color: Colors.red    },
      { label: 'EXPIRING',   value: stats.expiringCount.toString(),    sub: 'this  week', color: Colors.orange },
      { label: 'THIS MONTH', value: fmtCurrency(stats.monthRevenue),   sub:
  'revenue',   color: Colors.accent },
    ];

    const weekInsights: { icon: IconName; color: string; label: string; value: string
   }[] = [
      { icon: 'calendar-check-outline', color: '#3B82F6',     label:
  `${stats.todayCheckIns} members checked in today`,     value:
  stats.todayCheckIns.toString()    },
      { icon: 'clock-alert-outline',    color: Colors.orange, label:
  `${stats.expiringCount} plans expiring this week`,      value:
  stats.expiringCount.toString()    },
      { icon: 'trending-up',            color: Colors.green,  label: 'Revenue   collected this month',                         value:
  fmtCurrency(stats.monthRevenue)   },
      { icon: 'account-group-outline',  color: Colors.red,    label:
  `${stats.expiredCount} memberships expired`,             value:
  stats.expiredCount.toString()     },
    ];

    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <ScrollView style={s.container} contentContainerStyle={s.scroll}
  showsVerticalScrollIndicator={false}>

          {/* ── Header ── */}
          <FadeInView delay={0}>
            <View style={s.header}>
              <View style={{ flex: 1 }}>
                <Text style={s.greeting}>{greeting}  ·
  {todayLabel.toUpperCase()}</Text>
                <Text style={s.ownerName}>{profile?.full_name?.toUpperCase() ||      
  'OWNER'}</Text>
              </View>
              <AnimatedPressable style={s.avatarBtn} scaleDown={0.9} onPress={() =>  
  router.push('/(owner)/more/settings' as any)}>
                <MaterialCommunityIcons name="account-circle-outline" size={28}      
  color={Colors.accent} />
              </AnimatedPressable>
            </View>
          </FadeInView>

          {/* ── Gym Snapshot Banner ── */}
          <FadeInView delay={60}>
            <View style={s.insightBanner}>
              <View style={s.insightBannerGlow} />
              <View style={s.insightBannerHead}>
                <MaterialCommunityIcons name="lightning-bolt" size={13}
  color={Colors.accent} />
                <Text style={s.insightBannerLabel}>GYM SNAPSHOT</Text>
              </View>
              {weekInsights.map((ins, i) => (
                <View key={i} style={[s.insightRow, i < weekInsights.length - 1 &&   
  s.insightRowBorder]}>
                  <View style={[s.insightDot, { backgroundColor: ins.color + '20'    
  }]}>
                    <MaterialCommunityIcons name={ins.icon} size={13}
  color={ins.color} />
                  </View>
                  <Text style={s.insightText} numberOfLines={1}>{ins.label}</Text>   
                  <Text style={[s.insightValue, { color: ins.color
  }]}>{ins.value}</Text>
                </View>
              ))}
            </View>
          </FadeInView>

          {/* ── Pulse Stats ── */}
          <FadeInView delay={160}>
            <View style={s.pulseRow}>
              {pulseStats.map((p) => (
                <View key={p.label} style={[s.pulseBox, { borderColor: p.color + '30'
   }]}>
                  <View style={[s.pulseDot, { backgroundColor: p.color }]} />        
                  <Text style={[s.pulseVal, { color: p.color }]}>{p.value}</Text>    
                  <Text style={s.pulseLabel}>{p.label}</Text>
                  <Text style={s.pulseSub}>{p.sub}</Text>
                </View>
              ))}
            </View>
          </FadeInView>

          {/* ── Quick Actions ── */}
          <FadeInView delay={260}>
            <Text style={s.sectionLabel}>QUICK ACTIONS</Text>
            <View style={s.actionsRow}>
              {quickActions.map((a) => (
                <AnimatedPressable
                  key={a.label}
                  style={s.actionBtn}
                  scaleDown={0.93}
                  onPress={() => router.push(a.route as any)}
                >
                  <View style={[s.actionIcon, { backgroundColor: a.color + '18' }]}> 
                    <MaterialCommunityIcons name={a.icon} size={22} color={a.color}  
  />
                  </View>
                  <Text style={s.actionLabel}>{a.label}</Text>
                </AnimatedPressable>
              ))}
            </View>
          </FadeInView>

          {/* ── Expiry Alert (only shown when there are expiring members) ── */}    
          {stats.expiringCount > 0 && (
            <FadeInView delay={340}>
              <AnimatedPressable style={s.alertCard} scaleDown={0.98} onPress={() => 
  router.push('/(owner)/more/reports-expiry' as any)}>
                <View style={s.alertAccent} />
                <View style={s.alertIconBox}>
                  <MaterialCommunityIcons name="clock-alert-outline" size={22}       
  color={Colors.orange} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.alertTitle}>{stats.expiringCount}
  MEMBERSHIP{stats.expiringCount !== 1 ? 'S' : ''} EXPIRING SOON</Text>
                  <Text style={s.alertSub}>Tap to view and renew</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={18}
  color={Colors.orange} />
              </AnimatedPressable>
            </FadeInView>
          )}

          {/* ── Activity Feed (static for now) ── */}
          <FadeInView delay={420}>
            <Text style={s.sectionLabel}>ACTIVITY FEED</Text>
            <View style={s.feedCard}>
              {todayFeed.map((item, i) => (
                <View key={i} style={[s.feedRow, i < todayFeed.length - 1 &&
  s.feedBorder]}>
                  <View style={[s.feedIconBox, { backgroundColor: item.color + '15'  
  }]}>
                    <MaterialCommunityIcons name={item.icon} size={18}
  color={item.color} />
                  </View>
                  <View style={s.feedText}>
                    <Text style={s.feedTitle}>{item.title}</Text>
                    <Text style={s.feedHint}>{item.hint}</Text>
                  </View>
                  <Text style={s.feedTime}>{item.time}</Text>
                </View>
              ))}
            </View>
          </FadeInView>

          <View style={{ height: 32 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const s = StyleSheet.create({
    safe:      { flex: 1, backgroundColor: Colors.bg },
    container: { flex: 1 },
    scroll:    { paddingHorizontal: 16, paddingBottom: 24 },

    header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems:  
  'center', paddingTop: 16, marginBottom: 18 },
    greeting:  { fontFamily: Fonts.medium, fontSize: 9, color: Colors.accent,        
  letterSpacing: 1.6 },
    ownerName: { fontFamily: Fonts.condensedBold, fontSize: 30, color: Colors.text,  
  letterSpacing: 0.5, marginTop: 2 },
    avatarBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor:
  Colors.bgCard, justifyContent: 'center', alignItems: 'center', borderWidth: 1,     
  borderColor: Colors.accent + '30' },

    insightBanner:      { backgroundColor: Colors.bgCard, borderRadius: 18,
  borderWidth: 1, borderColor: Colors.accent + '22', padding: 16, marginBottom: 14,  
  overflow: 'hidden' },
    insightBannerGlow:  { position: 'absolute', top: -30, right: -30, width: 100,    
  height: 100, borderRadius: 50, backgroundColor: Colors.accentGlow },
    insightBannerHead:  { flexDirection: 'row', alignItems: 'center', gap: 6,        
  marginBottom: 12 },
    insightBannerLabel: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.accent, 
  letterSpacing: 2 },
    insightRow:         { flexDirection: 'row', alignItems: 'center', gap: 10,       
  paddingVertical: 9 },
    insightRowBorder:   { borderBottomWidth: 1, borderBottomColor: Colors.border },  
    insightDot:         { width: 26, height: 26, borderRadius: 8, justifyContent:    
  'center', alignItems: 'center' },
    insightText:        { flex: 1, fontFamily: Fonts.regular, fontSize: 12, color:   
  Colors.textMuted },
    insightValue:       { fontFamily: Fonts.bold, fontSize: 12 },

    pulseRow:   { flexDirection: 'row', gap: 8, marginBottom: 22 },
    pulseBox:   { flex: 1, backgroundColor: Colors.bgCard, borderRadius: 14,
  borderWidth: 1, paddingVertical: 12, paddingHorizontal: 10, gap: 2, alignItems:    
  'center' },
    pulseDot:   { width: 6, height: 6, borderRadius: 3, marginBottom: 4 },
    pulseVal:   { fontFamily: Fonts.condensedBold, fontSize: 18 },
    pulseLabel: { fontFamily: Fonts.bold, fontSize: 7, color: Colors.textMuted,      
  letterSpacing: 0.8, textAlign: 'center' },
    pulseSub:   { fontFamily: Fonts.regular, fontSize: 9, color: Colors.textMuted,   
  textAlign: 'center' },

    sectionLabel: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted,    
  letterSpacing: 1.8, marginBottom: 10, marginTop: 4 },

    actionsRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
    actionBtn:  { flex: 1, backgroundColor: Colors.bgCard, borderRadius: 14,
  paddingVertical: 14, alignItems: 'center', gap: 6, borderWidth: 1, borderColor:    
  Colors.border },
    actionIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', 
  alignItems: 'center' },
    actionLabel:{ fontFamily: Fonts.bold, fontSize: 8, color: Colors.textMuted,      
  letterSpacing: 0.8, textAlign: 'center' },

    alertCard:    { flexDirection: 'row', alignItems: 'center', backgroundColor:     
  Colors.bgCard, borderRadius: 14, padding: 16, gap: 12, borderWidth: 1, borderColor:
   Colors.orange + '30', overflow: 'hidden', marginBottom: 20 },
    alertAccent:  { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,      
  backgroundColor: Colors.orange },
    alertIconBox: { width: 40, height: 40, borderRadius: 11, backgroundColor:        
  Colors.orange + '15', justifyContent: 'center', alignItems: 'center' },
    alertTitle:   { fontFamily: Fonts.bold, fontSize: 12, color: Colors.text,        
  letterSpacing: 0.5 },
    alertSub:     { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted,
   marginTop: 3 },

    feedCard:    { backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 1, 
  borderColor: Colors.border, overflow: 'hidden' },
    feedRow:     { flexDirection: 'row', alignItems: 'center', gap: 12,
  paddingVertical: 12, paddingHorizontal: 14 },
    feedBorder:  { borderBottomWidth: 1, borderBottomColor: Colors.border },
    feedIconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center',
   alignItems: 'center' },
    feedText:    { flex: 1 },
    feedTitle:   { fontFamily: Fonts.bold, fontSize: 13, color: Colors.text },       
    feedHint:    { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, 
  marginTop: 1 },
    feedTime:    { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted  
  },
  });