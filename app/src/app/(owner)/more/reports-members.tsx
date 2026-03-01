import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { Colors } from '@/constants/colors';
import FadeInView from '@/components/FadeInView';
import BarChart from '@/components/reports/BarChart';
import HorizontalBar from '@/components/reports/HorizontalBar';
import StatCard from '@/components/reports/StatCard';
import {
  memberGrowth,
  membersByStatus,
  membersByGender,
  membersByGoal,
} from '@/components/reports/mockData';

export default function MembersReport() {
  const total = membersByStatus.reduce((s, m) => s + m.value, 0);
  const active = membersByStatus.find(m => m.label === 'Active')!;

  const statusBars = membersByStatus.map(m => ({
    label: `${m.label} (${m.value})`,
    percent: Math.round((m.value / total) * 100),
    color: m.color,
  }));

  const genderBars = membersByGender.map(m => ({
    label: `${m.label} (${m.value})`,
    percent: Math.round((m.value / total) * 100),
    color: m.color,
  }));

  return (
    <>
      <Stack.Screen options={{ title: '👥 Member Analytics' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Top Stats */}
        <FadeInView delay={0}>
          <View style={styles.statsRow}>
            <StatCard emoji="👥" label="Total Members" value={`${total}`} trend={13.0} />
            <StatCard emoji="✅" label="Active" value={`${active.value}`} trend={8.2} />
          </View>
        </FadeInView>

        {/* Growth Chart */}
        <FadeInView delay={150}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📈 Member Growth (6 months)</Text>
            <BarChart
              data={memberGrowth.map(m => ({ label: m.month, value: m.count }))}
              color={Colors.accent}
            />
          </View>
        </FadeInView>

        {/* Status Breakdown */}
        <FadeInView delay={300}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🔵 Status Breakdown</Text>
            <HorizontalBar data={statusBars} />
          </View>
        </FadeInView>

        {/* Gender Split */}
        <FadeInView delay={400}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>⚡ Gender Split</Text>
            <HorizontalBar data={genderBars} />
          </View>
        </FadeInView>

        {/* Goals */}
        <FadeInView delay={500}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🎯 Fitness Goals</Text>
            <HorizontalBar data={membersByGoal} />
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
    gap: 14,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
});
