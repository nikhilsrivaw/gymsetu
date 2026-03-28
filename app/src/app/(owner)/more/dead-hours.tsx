import { useState, useCallback } from 'react';
  import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
  import { Stack, useFocusEffect } from 'expo-router';
  import { Colors } from '@/constants/colors';
  import { Fonts } from '@/constants/fonts';
  import { supabase } from '@/lib/supabase';
  import { useAuthStore } from '@/store/authStore';
  import FadeInView from '@/components/FadeInView';
  import BarChart from '@/components/reports/BarChart';

  const HOUR_LABELS: Record<number, string> = {
    5: '5 AM', 6: '6 AM', 7: '7 AM', 8: '8 AM', 9: '9 AM', 10: '10 AM',
    11: '11 AM', 12: '12 PM', 13: '1 PM', 14: '2 PM', 15: '3 PM', 16: '4 PM',
    17: '5 PM', 18: '6 PM', 19: '7 PM', 20: '8 PM', 21: '9 PM', 22: '10 PM',
  };

  const SUGGESTIONS: Record<string, string> = {
    'morning':   'Offer an early-bird discount for 6–9 AM slots',
    'midday':    'Run a lunch-hour express workout (45 min) promo',
    'afternoon': 'Promote student memberships for 1–4 PM',
    'evening':   'Add a group class or Zumba session to drive footfall',
    'night':     'Consider a late-night batch with special pricing',
  };

  function getSuggestion(hour: number): string {
    if (hour >= 5  && hour <= 9)  return SUGGESTIONS.morning;
    if (hour >= 10 && hour <= 12) return SUGGESTIONS.midday;
    if (hour >= 13 && hour <= 16) return SUGGESTIONS.afternoon;
    if (hour >= 17 && hour <= 20) return SUGGESTIONS.evening;
    return SUGGESTIONS.night;
  }

  function fmt(h: number): string {
    if (h === 0)  return '12 AM';
    if (h < 12)   return `${h} AM`;
    if (h === 12) return '12 PM';
    return `${h - 12} PM`;
  }

  interface HourStat {
    hour:  number;
    label: string;
    count: number;
  }

  export default function DeadHoursScreen() {
    const { profile, activeGymId, branches } = useAuthStore();
    const [hourStats,  setHourStats]  = useState<HourStat[]>([]);
    const [deadHours,  setDeadHours]  = useState<HourStat[]>([]);
    const [peakHour,   setPeakHour]   = useState<HourStat | null>(null);
    const [totalCheckIns, setTotalCheckIns] = useState(0);
    const [loading,    setLoading]    = useState(true);

    const fetchData = useCallback(async () => {
      if (!profile?.gym_id) return;
      setLoading(true);

      const mainGymId = profile.gym_id;
      const gymIds = activeGymId === 'all'
        ? branches.map(b => b.id)
        : [activeGymId ?? mainGymId];

      const now        = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString().split('T')[0];

      const { data: attData } = await supabase
        .from('attendance')
        .select('created_at')
        .in('gym_id', gymIds)
        .gte('check_in_date', monthStart);

      if (!attData) { setLoading(false); return; }

      // Build hour map
      const hourMap: Record<number, number> = {};
      attData.forEach(a => {
        if (!a.created_at) return;
        const h = new Date(a.created_at).getHours();
        hourMap[h] = (hourMap[h] || 0) + 1;
      });

      // Build stats for 5 AM – 10 PM
      const stats: HourStat[] = [];
      for (let h = 5; h <= 22; h++) {
        stats.push({ hour: h, label: fmt(h), count: hourMap[h] || 0 });
      }

      const sorted       = [...stats].sort((a, b) => b.count - a.count);
      const peak         = sorted[0] ?? null;
      // Dead hours = slots with data (gym was open) but lowest count — bottom 3 with count >= 0
      const withAnyData  = stats.filter(s => s.count > 0);
      const dead         = withAnyData.length >= 3
        ? withAnyData.sort((a, b) => a.count - b.count).slice(0, 3)
        : withAnyData.sort((a, b) => a.count - b.count);

      setHourStats(stats);
      setDeadHours(dead);
      setPeakHour(peak);
      setTotalCheckIns(attData.length);
      setLoading(false);
    }, [profile?.gym_id, activeGymId, branches]);

    useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

    const barData = hourStats.map(s => ({
      label: s.hour % 3 === 0 ? fmt(s.hour) : '',  // show every 3rd label to avoid crowding
      value: s.count,
      color: deadHours.find(d => d.hour === s.hour)
        ? Colors.red
        : s.hour === peakHour?.hour
          ? Colors.green
          : Colors.accent + '90',
    }));

    if (loading) return (
      <>
        <Stack.Screen options={{ title: 'Dead Hours Detector' }} />
        <View style={styles.center}><ActivityIndicator color={Colors.accent} size="large" /></View>
      </>
    );

    return (
      <>
        <Stack.Screen options={{ title: 'Dead Hours Detector' }} />
        <ScrollView style={styles.container} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Summary row */}
          <FadeInView delay={0}>
            <View style={styles.statRow}>
              <View style={[styles.statBox, { borderColor: Colors.green + '40' }]}>
                <Text style={styles.statEmoji}>⚡</Text>
                <Text style={[styles.statVal, { color: Colors.green }]}>{peakHour ? fmt(peakHour.hour) : '—'}</Text>
                <Text style={styles.statLbl}>PEAK HOUR</Text>
              </View>
              <View style={[styles.statBox, { borderColor: Colors.red + '40' }]}>
                <Text style={styles.statEmoji}>💤</Text>
                <Text style={[styles.statVal, { color: Colors.red }]}>{deadHours.length}</Text>
                <Text style={styles.statLbl}>DEAD SLOTS</Text>
              </View>
              <View style={[styles.statBox, { borderColor: Colors.accent + '40' }]}>
                <Text style={styles.statEmoji}>📋</Text>
                <Text style={[styles.statVal, { color: Colors.accent }]}>{totalCheckIns}</Text>
                <Text style={styles.statLbl}>THIS MONTH</Text>
              </View>
            </View>
          </FadeInView>

          {/* Bar chart */}
          <FadeInView delay={80}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>HOURLY TRAFFIC — THIS MONTH</Text>
              <Text style={styles.cardSub}>
                <Text style={{ color: Colors.green }}>■ </Text>Peak  ·
                <Text style={{ color: Colors.red }}> ■ </Text>Dead  ·
                <Text style={{ color: Colors.accent + '90' }}> ■ </Text>Normal
              </Text>
              <BarChart data={barData} maxHeight={100} barColor={Colors.accent} />
            </View>
          </FadeInView>

          {/* Dead hour cards */}
          {deadHours.length > 0 && (
            <FadeInView delay={160}>
              <Text style={styles.sectionLabel}>💤 DEAD HOURS — ACTION NEEDED</Text>
              {deadHours.map((slot, i) => (
                <View key={slot.hour} style={styles.deadCard}>
                  <View style={styles.deadLeft}>
                    <Text style={styles.deadTime}>{fmt(slot.hour)}</Text>
                    <Text style={styles.deadCount}>{slot.count} check-ins this month</Text>
                  </View>
                  <View style={styles.deadBadge}>
                    <Text style={styles.deadBadgeText}>#{i + 1} SLOWEST</Text>
                  </View>
                  <Text style={styles.deadSuggestion}>💡 {getSuggestion(slot.hour)}</Text>
                </View>
              ))}
            </FadeInView>
          )}

          {totalCheckIns === 0 && (
            <FadeInView delay={160}>
              <View style={styles.emptyCard}>
                <Text style={styles.emptyEmoji}>📭</Text>
                <Text style={styles.emptyText}>No attendance data this month yet.{'\n'}Start marking check-ins to see insights.</Text>      
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
    center:    { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg },

    statRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
    statBox: {
      flex: 1, backgroundColor: Colors.bgCard, borderRadius: 16,
      borderWidth: 1, padding: 14, alignItems: 'center', gap: 4,
    },
    statEmoji: { fontSize: 22 },
    statVal:   { fontFamily: Fonts.condensedBold, fontSize: 20 },
    statLbl:   { fontFamily: Fonts.bold, fontSize: 8, color: Colors.textMuted, letterSpacing: 1 },

    card: {
      backgroundColor: Colors.bgCard, borderRadius: 18, borderWidth: 1,
      borderColor: Colors.border, padding: 18, marginBottom: 14,
    },
    cardTitle: { fontFamily: Fonts.bold, fontSize: 10, color: Colors.textMuted, letterSpacing: 1.5 },
    cardSub:   { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 2, marginBottom: 14 },

    sectionLabel: {
      fontFamily: Fonts.bold, fontSize: 10, color: Colors.textMuted,
      letterSpacing: 1.5, marginBottom: 10,
    },

    deadCard: {
      backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 1,
      borderColor: Colors.red + '30', padding: 16, marginBottom: 10, gap: 8,
    },
    deadLeft:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    deadTime:        { fontFamily: Fonts.condensedBold, fontSize: 22, color: Colors.text },
    deadCount:       { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted },
    deadBadge:       { backgroundColor: Colors.red + '20', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf:
  'flex-start' },
    deadBadgeText:   { fontFamily: Fonts.bold, fontSize: 9, color: Colors.red, letterSpacing: 1 },
    deadSuggestion:  { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, lineHeight: 18 },

    emptyCard: {
      backgroundColor: Colors.bgCard, borderRadius: 18, borderWidth: 1,
      borderColor: Colors.border, padding: 32, alignItems: 'center', gap: 12,
    },
    emptyEmoji: { fontSize: 40 },
    emptyText:  { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
  });
