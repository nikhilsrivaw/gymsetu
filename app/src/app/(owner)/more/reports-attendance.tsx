 import { useState, useCallback } from 'react';                                       import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from                'react-native';                                                                      import { Stack, useFocusEffect } from 'expo-router';                                 import { Colors } from '@/constants/colors';                                         import { Fonts } from '@/constants/fonts';                                           import { supabase } from '@/lib/supabase';                                           import { useAuthStore } from '@/store/authStore';                                  
  import FadeInView from '@/components/FadeInView';                                    import BarChart from '@/components/reports/BarChart';                              
  import StatCard from '@/components/reports/StatCard';                                                                                                                   
  const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];                                                                                                   
  interface AttendanceData {                                                         
    weekBars:    { label: string; value: number }[];
    monthBars:   { label: string; value: number }[];
    todayCount:  number;
    weekTotal:   number;
    avgPerDay:   number;
    topDay:      string;
    topDayCount: number;
  }

  export default function ReportsAttendanceScreen() {
    const { profile } = useAuthStore();
    const [data, setData]       = useState<AttendanceData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
      if (!profile?.gym_id) return;
      setLoading(true);

      const now        = new Date();
      const todayStr   = now.toISOString().split('T')[0];
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString().split('T')[0];

      const { data: attData } = await supabase
        .from('attendance')
        .select('check_in_date')
        .eq('gym_id', profile.gym_id)
        .gte('check_in_date', monthStart)
        .order('check_in_date');

      if (!attData) { setLoading(false); return; }

      // Today count
      const todayCount = attData.filter(a => a.check_in_date === todayStr).length;   

      // Per-day map for this month
      const dayMap: Record<string, number> = {};
      attData.forEach(a => {
        dayMap[a.check_in_date] = (dayMap[a.check_in_date] || 0) + 1;
      });

      // Last 7 days bars
      const weekMap: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        const d   = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const key = d.toISOString().split('T')[0];
        weekMap[key] = dayMap[key] || 0;
      }
      const weekBars = Object.entries(weekMap).map(([date, count]) => ({
        label: DAY_LABELS[new Date(date).getDay()],
        value: count,
      }));
      const weekTotal = Object.values(weekMap).reduce((s, v) => s + v, 0);

      // Avg per day (days that had any data)
      const daysWithData = Object.keys(dayMap).length;
      const avgPerDay    = daysWithData > 0
        ? Math.round(attData.length / daysWithData)
        : 0;

      // Top day this month
      const topEntry   = Object.entries(dayMap).sort((a, b) => b[1] - a[1])[0];      
      const topDay     = topEntry
        ? new Date(topEntry[0]).toLocaleDateString('en-IN', { weekday: 'short', day: 
  'numeric', month: 'short' })
        : '—';
      const topDayCount = topEntry ? topEntry[1] : 0;

      // Monthly by week (4 weeks)
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

      setData({ weekBars, monthBars, todayCount, weekTotal, avgPerDay, topDay,       
  topDayCount });
      setLoading(false);
    }, [profile?.gym_id]);

    useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

    if (loading) return (
      <>
        <Stack.Screen options={{ title: 'Attendance Analytics' }} />
        <View style={styles.center}><ActivityIndicator color={Colors.accent}
  size="large" /></View>
      </>
    );

    return (
      <>
        <Stack.Screen options={{ title: 'Attendance Analytics' }} />
        <ScrollView style={styles.container} contentContainerStyle={styles.scroll}   
  showsVerticalScrollIndicator={false}>

          <FadeInView delay={0}>
            <View style={styles.statRow}>
              <StatCard emoji="📅" label="TODAY"     value={(data?.todayCount ??     
  0).toString()} color={Colors.green}  />
              <StatCard emoji="📆" label="THIS WEEK" value={(data?.weekTotal  ??     
  0).toString()} color={Colors.accent} />
              <StatCard emoji="📊" label="AVG / DAY" value={(data?.avgPerDay  ??     
  0).toString()} color="#3B82F6"       />
            </View>
          </FadeInView>

          <FadeInView delay={100}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>LAST 7 DAYS</Text>
              <Text style={styles.cardSub}>Daily check-ins</Text>
              {data?.weekBars && (
                <BarChart
                  data={data.weekBars.map(b => ({ ...b, color: '#3B82F6' }))}        
                  maxHeight={100}
                  barColor="#3B82F6"
                />
              )}
            </View>
          </FadeInView>

          <FadeInView delay={200}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>THIS MONTH BY WEEK</Text>
              <Text style={styles.cardSub}>Total check-ins per week</Text>
              {data?.monthBars && (
                <BarChart
                  data={data.monthBars.map(b => ({ ...b, color: Colors.accent }))}   
                  maxHeight={100}
                  barColor={Colors.accent}
                />
              )}
            </View>
          </FadeInView>

          <FadeInView delay={300}>
            <View style={styles.peakCard}>
              <Text style={styles.peakLabel}>🏆  PEAK DAY THIS MONTH</Text>
              <Text style={styles.peakDay}>{data?.topDay ?? '—'}</Text>
              <Text style={styles.peakCount}>{data?.topDayCount ?? 0}
  check-ins</Text>
            </View>
          </FadeInView>

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
  letterSpacing: 1.5 },
    cardSub:   { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted,   
  marginTop: 2, marginBottom: 14 },

    peakCard:  { backgroundColor: Colors.bgCard, borderRadius: 18, borderWidth: 1,   
  borderColor: Colors.orange + '40', padding: 20, alignItems: 'center', gap: 6 },    
    peakLabel: { fontFamily: Fonts.bold, fontSize: 10, color: Colors.orange,
  letterSpacing: 1 },
    peakDay:   { fontFamily: Fonts.condensedBold, fontSize: 24, color: Colors.text },
    peakCount: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted }, 
  });
