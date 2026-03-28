  import { useState, useCallback } from 'react';                                                                       
  import { View, Text, StyleSheet, ScrollView } from 'react-native';                                                     import { Stack, useFocusEffect } from 'expo-router';                                                                 
  import { MaterialCommunityIcons } from '@expo/vector-icons';                                                         
  import LottieView from 'lottie-react-native';
  import { Colors } from '@/constants/colors';
  import { Fonts } from '@/constants/fonts';
  import { supabase } from '@/lib/supabase';
  import { useAuthStore } from '@/store/authStore';
  import FadeInView from '@/components/FadeInView';
  import BarChart from '@/components/reports/BarChart';

  type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

  const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  interface AttendanceData {
    weekBars:             { label: string; value: number }[];
    monthBars:            { label: string; value: number }[];
    peakHourBars:         { label: string; value: number }[];
    todayCount:           number;
    weekTotal:            number;
    avgPerDay:            number;
    topDay:               string;
    topDayCount:          number;
    peakHour:             string;
    retentionRate:        number;
    retainedCount:        number;
    totalMembersWithPlan: number;
  }

  function formatHour(h: number): string {
    if (h === 0)  return '12a';
    if (h < 12)   return `${h}a`;
    if (h === 12) return '12p';
    return `${h - 12}p`;
  }

  export default function ReportsAttendanceScreen() {
    const { profile, activeGymId, branches } = useAuthStore();
    const [data, setData]       = useState<AttendanceData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
      if (!profile?.gym_id) return;
      setLoading(true);

      const mainGymId = profile.gym_id;
      const gymIds = activeGymId === 'all' ? branches.map(b => b.id) : [activeGymId ?? mainGymId];

      const now        = new Date();
      const todayStr   = now.toISOString().split('T')[0];
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

      const { data: attData } = await supabase
        .from('attendance')
        .select('check_in_date, created_at')
        .in('gym_id', gymIds)
        .gte('check_in_date', monthStart)
        .order('check_in_date');

      if (!attData) { setLoading(false); return; }

      const todayCount = attData.filter(a => a.check_in_date === todayStr).length;

      const dayMap: Record<string, number> = {};
      attData.forEach(a => { dayMap[a.check_in_date] = (dayMap[a.check_in_date] || 0) + 1; });

      const weekMap: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        const d   = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const key = d.toISOString().split('T')[0];
        weekMap[key] = dayMap[key] || 0;
      }
      const weekBars  = Object.entries(weekMap).map(([date, count]) => ({ label: DAY_LABELS[new Date(date).getDay()],  
  value: count }));
      const weekTotal = Object.values(weekMap).reduce((s, v) => s + v, 0);

      const daysWithData = Object.keys(dayMap).length;
      const avgPerDay    = daysWithData > 0 ? Math.round(attData.length / daysWithData) : 0;

      const topEntry    = Object.entries(dayMap).sort((a, b) => b[1] - a[1])[0];
      const topDay      = topEntry ? new Date(topEntry[0]).toLocaleDateString('en-IN', { weekday: 'short', day:        
  'numeric', month: 'short' }) : '—';
      const topDayCount = topEntry ? topEntry[1] : 0;

      const monthBars: { label: string; value: number }[] = [];
      for (let w = 0; w < 4; w++) {
        let weekCount = 0;
        for (let d = 0; d < 7; d++) {
          const day = new Date(now.getFullYear(), now.getMonth(), 1 + w * 7 + d);
          if (day.getMonth() !== now.getMonth()) break;
          weekCount += dayMap[day.toISOString().split('T')[0]] || 0;
        }
        monthBars.push({ label: `W${w + 1}`, value: weekCount });
      }

      const hourMap: Record<number, number> = {};
      attData.forEach(a => {
        if (!a.created_at) return;
        const h = new Date(a.created_at).getHours();
        hourMap[h] = (hourMap[h] || 0) + 1;
      });
      const peakHourBars: { label: string; value: number }[] = [];
      for (let h = 5; h <= 22; h++) peakHourBars.push({ label: formatHour(h), value: hourMap[h] || 0 });

      const peakHourEntry = Object.entries(hourMap).sort((a, b) => Number(b[1]) - Number(a[1]))[0];
      const peakHour = peakHourEntry ? `${formatHour(Number(peakHourEntry[0]))}  ·  ${peakHourEntry[1]} check-ins` :   
  '—';

      const { data: planData } = await supabase.from('member_plans').select('member_id').in('gym_id', gymIds);
      let retentionRate = 0, retainedCount = 0, totalMembersWithPlan = 0;
      if (planData) {
        const planCountMap: Record<string, number> = {};
        planData.forEach(p => { planCountMap[p.member_id] = (planCountMap[p.member_id] || 0) + 1; });
        totalMembersWithPlan = Object.keys(planCountMap).length;
        retainedCount        = Object.values(planCountMap).filter(c => c >= 2).length;
        retentionRate        = totalMembersWithPlan > 0 ? Math.round((retainedCount / totalMembersWithPlan) * 100) : 0;
      }

      setData({ weekBars, monthBars, peakHourBars, todayCount, weekTotal, avgPerDay, topDay, topDayCount, peakHour,    
  retentionRate, retainedCount, totalMembersWithPlan });
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
            <Text style={s.loadingTitle}>LOADING ATTENDANCE</Text>
            <Text style={s.loadingSub}>Analysing check-in data...</Text>
          </View>
        </>
      );
    }

    const quickStats: { label: string; value: string; color: string; icon: IconName }[] = [
      { label: 'TODAY',     value: (data?.todayCount ?? 0).toString(), color: '#22c55e',    icon: 'calendar-today'     
      },
      { label: 'THIS WEEK', value: (data?.weekTotal  ?? 0).toString(), color: Colors.accent, icon: 'calendar-week'     
      },
      { label: 'AVG / DAY', value: (data?.avgPerDay  ?? 0).toString(), color: '#3B82F6',    icon: 'chart-bar'
      },
    ];

    return (
      <>
        <Stack.Screen options={{ title: '', headerStyle: { backgroundColor: '#0a0a0a' }, headerTintColor: '#fff' }} /> 
        <ScrollView style={s.container} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Header ── */}
          <FadeInView delay={0}>
            <View style={s.header}>
              <Text style={s.headerMicro}>ANALYTICS</Text>
              <Text style={s.headerTitle}>ATTENDANCE</Text>
              <Text style={s.headerSub}>
                {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </Text>
            </View>
          </FadeInView>

          {/* ── Quick Stats ── */}
          <FadeInView delay={40}>
            <Text style={s.sectionLabel}>OVERVIEW</Text>
            <View style={s.statsCard}>
              {quickStats.map((stat, i) => (
                <View key={stat.label} style={[s.statRow, i < quickStats.length - 1 && s.rowBorder]}>
                  <View style={[s.statIconWrap, { backgroundColor: stat.color + '12' }]}>
                    <MaterialCommunityIcons name={stat.icon} size={20} color={stat.color} />
                  </View>
                  <Text style={s.statRowLabel}>{stat.label}</Text>
                  <Text style={[s.statRowVal, { color: stat.color }]}>{stat.value}</Text>
                </View>
              ))}
            </View>
          </FadeInView>

          {/* ── Retention Rate ── */}
          <FadeInView delay={80}>
            <Text style={s.sectionLabel}>RETENTION</Text>
            <View style={s.retentionCard}>
              <View style={s.retentionLeft}>
                <View style={[s.statIconWrap, { backgroundColor: '#22c55e12' }]}>
                  <MaterialCommunityIcons name="refresh" size={20} color="#22c55e" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.retentionTitle}>RENEWAL RETENTION RATE</Text>
                  <Text style={s.retentionSub}>
                    {data?.retainedCount ?? 0} of {data?.totalMembersWithPlan ?? 0} members renewed at least once      
                  </Text>
                </View>
              </View>
              <Text style={s.retentionPct}>{data?.retentionRate ?? 0}%</Text>
            </View>
          </FadeInView>

          {/* ── Last 7 Days ── */}
          <FadeInView delay={120}>
            <Text style={s.sectionLabel}>LAST 7 DAYS</Text>
            <View style={s.card}>
              <Text style={s.cardSub}>Daily check-ins this week</Text>
              {data?.weekBars && (
                <BarChart
                  data={data.weekBars.map(b => ({ ...b, color: '#3B82F6' }))}
                  maxHeight={100}
                  barColor="#3B82F6"
                />
              )}
            </View>
          </FadeInView>

          {/* ── This Month by Week ── */}
          <FadeInView delay={180}>
            <Text style={s.sectionLabel}>THIS MONTH BY WEEK</Text>
            <View style={s.card}>
              <Text style={s.cardSub}>Total check-ins per week</Text>
              {data?.monthBars && (
                <BarChart
                  data={data.monthBars.map(b => ({ ...b, color: Colors.accent }))}
                  maxHeight={100}
                  barColor={Colors.accent}
                />
              )}
            </View>
          </FadeInView>

          {/* ── Peak Hours ── */}
          <FadeInView delay={240}>
            <Text style={s.sectionLabel}>PEAK HOURS</Text>
            <View style={s.card}>
              <Text style={s.cardSub}>Check-in distribution  ·  5 AM – 10 PM</Text>
              {data?.peakHourBars && (
                <BarChart
                  data={data.peakHourBars.map(b => ({ ...b, color: '#f97316' }))}
                  maxHeight={90}
                  barColor="#f97316"
                />
              )}
              <View style={s.peakRow}>
                <View style={[s.statIconWrap, { backgroundColor: '#f9731612' }]}>
                  <MaterialCommunityIcons name="lightning-bolt" size={18} color="#f97316" />
                </View>
                <Text style={s.peakLabel}>BUSIEST SLOT</Text>
                <Text style={s.peakValue}>{data?.peakHour ?? '—'}</Text>
              </View>
            </View>
          </FadeInView>

          {/* ── Peak Day ── */}
          <FadeInView delay={300}>
            <Text style={s.sectionLabel}>PEAK DAY THIS MONTH</Text>
            <View style={s.peakDayCard}>
              <View style={[s.statIconWrap, { backgroundColor: '#f9731612' }]}>
                <MaterialCommunityIcons name="trophy-outline" size={22} color="#f97316" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.peakDayDate}>{data?.topDay ?? '—'}</Text>
                <Text style={s.peakDaySub}>Highest single-day attendance</Text>
              </View>
              <Text style={s.peakDayCount}>{data?.topDayCount ?? 0}</Text>
            </View>
          </FadeInView>

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
    headerTitle: { fontFamily: Fonts.condensedBold, fontSize: 42, color: '#fff', letterSpacing: 1, marginTop: 4 },     
    headerSub:   { fontFamily: Fonts.regular, fontSize: 14, color: '#555', marginTop: 4 },

    // Section label
    sectionLabel: { fontFamily: Fonts.bold, fontSize: 10, color: '#444', letterSpacing: 2, marginBottom: 12 },

    // Stats card (rows)
    statsCard:    { backgroundColor: '#141414', borderRadius: 18, borderWidth: 1, borderColor: '#1e1e1e', overflow:    
  'hidden', marginBottom: 24 },
    statRow:      { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingVertical: 16 }, 
    rowBorder:    { borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
    statIconWrap: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    statRowLabel: { fontFamily: Fonts.bold, fontSize: 14, color: '#888', flex: 1 },
    statRowVal:   { fontFamily: Fonts.condensedBold, fontSize: 28 },

    // Retention card
    retentionCard:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor:    
  '#141414', borderRadius: 18, borderWidth: 1, borderColor: '#22c55e30', padding: 18, marginBottom: 24 },
    retentionLeft:  { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
    retentionTitle: { fontFamily: Fonts.bold, fontSize: 12, color: '#22c55e', letterSpacing: 0.5 },
    retentionSub:   { fontFamily: Fonts.regular, fontSize: 13, color: '#555', marginTop: 3 },
    retentionPct:   { fontFamily: Fonts.condensedBold, fontSize: 42, color: '#22c55e' },

    // Chart card
    card:    { backgroundColor: '#141414', borderRadius: 18, borderWidth: 1, borderColor: '#1e1e1e', padding: 18,      
  marginBottom: 24 },
    cardSub: { fontFamily: Fonts.regular, fontSize: 13, color: '#555', marginBottom: 16 },

    // Peak row inside chart card
    peakRow:   { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 16, paddingTop: 16, borderTopWidth: 1,
   borderTopColor: '#1e1e1e' },
    peakLabel: { fontFamily: Fonts.bold, fontSize: 12, color: '#f97316', flex: 1 },
    peakValue: { fontFamily: Fonts.condensedBold, fontSize: 18, color: '#f97316' },

    // Peak day card
    peakDayCard:  { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#141414', borderRadius: 18, 
  borderWidth: 1, borderColor: '#f9731630', padding: 18, marginBottom: 24 },
    peakDayDate:  { fontFamily: Fonts.bold, fontSize: 18, color: '#fff' },
    peakDaySub:   { fontFamily: Fonts.regular, fontSize: 13, color: '#555', marginTop: 3 },
    peakDayCount: { fontFamily: Fonts.condensedBold, fontSize: 42, color: '#f97316' },
  });