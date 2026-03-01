import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { Colors } from '@/constants/colors';
import FadeInView from '@/components/FadeInView';
import BarChart from '@/components/reports/BarChart';
import HorizontalBar from '@/components/reports/HorizontalBar';
import PeriodSelector from '@/components/reports/PeriodSelector';
import StatCard from '@/components/reports/StatCard';
import {
  revenueMonthly,
  revenueDailyThisWeek,
  revenueByMethod,
  formatINR,
} from '@/components/reports/mockData';

export default function RevenueReport() {
  const [period, setPeriod] = useState('Month');

  const chartData = period === 'Week'
    ? revenueDailyThisWeek.map(d => ({ label: d.day, value: d.amount }))
    : revenueMonthly.map(d => ({ label: d.month, value: d.amount }));

  const totalThisMonth = revenueMonthly[revenueMonthly.length - 1].amount;
  const totalLastMonth = revenueMonthly[revenueMonthly.length - 2].amount;
  const growth = ((totalThisMonth - totalLastMonth) / totalLastMonth) * 100;

  return (
    <>
      <Stack.Screen options={{ title: '💰 Revenue Analytics' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Top Stats */}
        <FadeInView delay={0}>
          <View style={styles.statsRow}>
            <StatCard emoji="💰" label="This Month" value={formatINR(totalThisMonth)} trend={+growth} />
            <StatCard emoji="📅" label="Last Month" value={formatINR(totalLastMonth)} />
          </View>
        </FadeInView>

        {/* Period Selector */}
        <FadeInView delay={100}>
          <PeriodSelector options={['Week', 'Month']} selected={period} onSelect={setPeriod} />
        </FadeInView>

        {/* Revenue Bar Chart */}
        <FadeInView delay={200}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              📊 {period === 'Week' ? 'Daily Collection' : 'Monthly Revenue'}
            </Text>
            <BarChart
              data={chartData}
              color={Colors.green}
              formatValue={v => formatINR(v)}
            />
          </View>
        </FadeInView>

        {/* Payment Method Breakdown */}
        <FadeInView delay={350}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>💳 Payment Method Breakdown</Text>
            <HorizontalBar data={revenueByMethod.map(r => ({ label: r.method, percent: r.percent, color: r.color }))} />
          </View>
        </FadeInView>

        {/* Daily This Week */}
        <FadeInView delay={450}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📆 This Week — Daily</Text>
            <BarChart
              data={revenueDailyThisWeek.map(d => ({ label: d.day, value: d.amount }))}
              color={Colors.accent}
              height={120}
              formatValue={v => formatINR(v)}
            />
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
