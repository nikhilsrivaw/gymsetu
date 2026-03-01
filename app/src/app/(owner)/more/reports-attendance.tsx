import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { Colors } from '@/constants/colors';
import FadeInView from '@/components/FadeInView';
import BarChart from '@/components/reports/BarChart';
import PeriodSelector from '@/components/reports/PeriodSelector';
import StatCard from '@/components/reports/StatCard';
import {
  attendanceWeekly,
  attendanceMonthly,
  topConsistentMembers,
} from '@/components/reports/mockData';

const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];

export default function AttendanceReport() {
  const [period, setPeriod] = useState('Week');

  const chartData = period === 'Week'
    ? attendanceWeekly.map(d => ({ label: d.day, value: d.count }))
    : attendanceMonthly.map(d => ({ label: d.month, value: d.avg }));

  const peakDay = [...attendanceWeekly].sort((a, b) => b.count - a.count)[0];
  const avgWeekly = Math.round(attendanceWeekly.reduce((s, d) => s + d.count, 0) / 7);

  return (
    <>
      <Stack.Screen options={{ title: '📊 Attendance Analytics' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Top Stats */}
        <FadeInView delay={0}>
          <View style={styles.statsRow}>
            <StatCard emoji="📈" label="Daily Avg" value={`${avgWeekly}`} trend={6.1} />
            <StatCard emoji="🔥" label="Peak Day" value={`${peakDay.day} (${peakDay.count})`} />
          </View>
        </FadeInView>

        {/* Period Selector */}
        <FadeInView delay={100}>
          <PeriodSelector options={['Week', 'Month']} selected={period} onSelect={setPeriod} />
        </FadeInView>

        {/* Attendance Chart */}
        <FadeInView delay={200}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              📊 {period === 'Week' ? 'This Week' : 'Monthly Average'}
            </Text>
            <BarChart data={chartData} color={Colors.orange} />
          </View>
        </FadeInView>

        {/* Top Consistent Members */}
        <FadeInView delay={400}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🏆 Most Consistent Members</Text>
            <Text style={styles.cardSub}>Top 5 by attendance this month</Text>
            {topConsistentMembers.map((member, i) => (
              <View key={member.name} style={styles.memberRow}>
                <Text style={styles.medal}>{medals[i]}</Text>
                <Text style={styles.memberAvatar}>{member.avatar}</Text>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{member.name}</Text>
                  <Text style={styles.memberDays}>{member.days} days this month</Text>
                </View>
                <View style={styles.daysBadge}>
                  <Text style={styles.daysNum}>{member.days}</Text>
                </View>
              </View>
            ))}
          </View>
        </FadeInView>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 16, paddingBottom: 40, gap: 14 },
  statsRow: { flexDirection: 'row', gap: 10 },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  cardSub: { fontSize: 12, color: Colors.textMuted, marginTop: -6 },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 10,
  },
  medal: { fontSize: 20, width: 28, textAlign: 'center' },
  memberAvatar: { fontSize: 22 },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 14, fontWeight: '600', color: Colors.text },
  memberDays: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  daysBadge: {
    backgroundColor: Colors.accentMuted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  daysNum: { fontSize: 14, fontWeight: '700', color: Colors.accent },
});
