import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { Colors } from '@/constants/colors';
import AnimatedPressable from '@/components/AnimatedPressable';
import FadeInView from '@/components/FadeInView';
import StatCard from '@/components/reports/StatCard';
import { quickStats, formatINR } from '@/components/reports/mockData';

const reports = [
  { label: 'Revenue', desc: 'Income & collections', emoji: '💰', color: Colors.green, route: '/(owner)/more/reports-revenue' },
  { label: 'Members', desc: 'Growth & demographics', emoji: '👥', color: Colors.accent, route: '/(owner)/more/reports-members' },
  { label: 'Attendance', desc: 'Trends & consistency', emoji: '📊', color: Colors.orange, route: '/(owner)/more/reports-attendance' },
  { label: 'Expiry', desc: 'Renewals due soon', emoji: '⏰', color: Colors.red, route: '/(owner)/more/reports-expiry' },
];

export default function ReportsHub() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ title: 'Reports & Analytics' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Quick Stats */}
        <FadeInView delay={0}>
          <Text style={styles.sectionTitle}>📈 Quick Overview</Text>
          <View style={styles.statsRow}>
            <StatCard emoji="💰" label="Revenue" value={formatINR(quickStats.totalRevenue)} trend={quickStats.revenueTrend} />
            <StatCard emoji="👥" label="Members" value={`${quickStats.totalMembers}`} trend={quickStats.membersTrend} />
          </View>
          <View style={styles.statsRow}>
            <StatCard emoji="🏃" label="Avg Attendance" value={`${quickStats.avgAttendance}`} trend={quickStats.attendanceTrend} />
            <StatCard emoji="⚠️" label="Expiring" value={`${quickStats.expiringCount}`} />
          </View>
        </FadeInView>

        {/* Report Cards Grid */}
        <FadeInView delay={150}>
          <Text style={styles.sectionTitle}>📋 Detailed Reports</Text>
        </FadeInView>

        <View style={styles.grid}>
          {reports.map((item, i) => (
            <FadeInView key={item.label} delay={200 + i * 80} style={styles.gridItem}>
              <AnimatedPressable
                style={styles.reportCard}
                scaleDown={0.96}
                onPress={() => router.push(item.route as any)}
              >
                <View style={[styles.cardIcon, { backgroundColor: item.color + '18' }]}>
                  <Text style={styles.cardEmoji}>{item.emoji}</Text>
                </View>
                <Text style={styles.cardLabel}>{item.label}</Text>
                <Text style={styles.cardDesc}>{item.desc}</Text>
                <MaterialCommunityIcons
                  name="arrow-right-circle"
                  size={20}
                  color={item.color}
                  style={styles.cardArrow}
                />
              </AnimatedPressable>
            </FadeInView>
          ))}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 16, paddingBottom: 32 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 12, marginTop: 8 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridItem: { width: '48%' as any },
  reportCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 140,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardEmoji: { fontSize: 22 },
  cardLabel: { fontSize: 15, fontWeight: '700', color: Colors.text },
  cardDesc: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  cardArrow: { position: 'absolute', bottom: 14, right: 14 },
});
