import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { Colors } from '@/constants/colors';
import AnimatedPressable from '@/components/AnimatedPressable';
import FadeInView from '@/components/FadeInView';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface StatItem {
  label: string;
  value: string;
  emoji: string;
  icon: IconName;
  iconBg: string;
  iconColor: string;
}

const stats: StatItem[] = [
  { label: 'Total Members', value: '148', emoji: '📊', icon: 'account-group-outline', iconBg: Colors.accentMuted, iconColor: Colors.accent },
  { label: 'Active', value: '112', emoji: '✅', icon: 'check-circle-outline', iconBg: Colors.greenMuted, iconColor: Colors.green },
  { label: 'Expiring Soon', value: '6', emoji: '⏳', icon: 'clock-alert-outline', iconBg: Colors.orangeMuted, iconColor: Colors.orange },
  { label: 'Pending Dues', value: '₹24,500', emoji: '💰', icon: 'alert-circle-outline', iconBg: Colors.redMuted, iconColor: Colors.red },
  { label: 'Today Attendance', value: '68', emoji: '📋', icon: 'calendar-check-outline', iconBg: Colors.greenMuted, iconColor: Colors.green },
  { label: 'This Month', value: '₹1,96,000', emoji: '💸', icon: 'trending-up', iconBg: Colors.accentMuted, iconColor: Colors.accent },
];

interface ActionItem {
  label: string;
  emoji: string;
  icon: IconName;
  route: string;
}

const quickActions: ActionItem[] = [
  { label: 'Add Member', emoji: '👤', icon: 'account-plus-outline', route: '/(owner)/members/add' },
  { label: 'Payment', emoji: '💳', icon: 'plus-circle-outline', route: '/(owner)/payments' },
  { label: 'Attendance', emoji: '📝', icon: 'check-circle-outline', route: '/(owner)/more/attendance' },
  { label: 'Plans', emoji: '📄', icon: 'refresh', route: '/(owner)/plans' },
];

const recentActivity = [
  { emoji: '💳', text: 'Rahul Sharma paid ₹3,500', time: '2h ago' },
  { emoji: '👤', text: 'Sneha Gupta joined (1 Month)', time: '5h ago' },
  { emoji: '📋', text: '68 members checked in today', time: '6h ago' },
  { emoji: '⚠️', text: 'Vikram Singh\'s plan expired', time: '1d ago' },
  { emoji: '💰', text: 'Priya Patel paid ₹6,000', time: '1d ago' },
];

export default function DashboardScreen() {
  const { profile } = useAuthStore();
  const router = useRouter();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const greetEmoji = hour < 12 ? '🌤️' : hour < 17 ? '☀️' : '🌙';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <FadeInView delay={0}>
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>{greeting} {greetEmoji}</Text>
              <Text style={styles.name}>{profile?.full_name || 'Owner'}</Text>
            </View>
            <AnimatedPressable style={styles.avatarBtn} scaleDown={0.9} onPress={() => router.push('/(owner)/more/settings' as any)}>
              <MaterialCommunityIcons name="account-circle-outline" size={32} color={Colors.textSub} />
            </AnimatedPressable>
          </View>
        </FadeInView>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {stats.map((s, i) => (
            <FadeInView key={s.label} delay={80 + i * 60} style={styles.statCardWrap}>
              <AnimatedPressable style={styles.statCard} scaleDown={0.96}>
                <View style={styles.statTop}>
                  <View style={[styles.statIcon, { backgroundColor: s.iconBg }]}>
                    <MaterialCommunityIcons name={s.icon} size={18} color={s.iconColor} />
                  </View>
                  <Text style={styles.statEmoji}>{s.emoji}</Text>
                </View>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </AnimatedPressable>
            </FadeInView>
          ))}
        </View>

        {/* Quick Actions */}
        <FadeInView delay={500}>
          <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
        </FadeInView>
        <View style={styles.actionsRow}>
          {quickActions.map((a, i) => (
            <FadeInView key={a.label} delay={540 + i * 60} style={{ flex: 1 }}>
              <AnimatedPressable
                style={styles.actionBtn}
                scaleDown={0.94}
                onPress={() => router.push(a.route as any)}
              >
                <View style={styles.actionIcon}>
                  <Text style={styles.actionEmoji}>{a.emoji}</Text>
                </View>
                <Text style={styles.actionLabel}>{a.label}</Text>
              </AnimatedPressable>
            </FadeInView>
          ))}
        </View>

        {/* Alerts */}
        <FadeInView delay={800}>
          <Text style={styles.sectionTitle}>🔔 Alerts</Text>
          <AnimatedPressable style={styles.alertCard} scaleDown={0.98} onPress={() => router.push('/(owner)/more/reports-expiry' as any)}>
            <Text style={styles.alertEmoji}>⚠️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.alertTextMain}>6 memberships expiring soon</Text>
              <Text style={styles.alertText}>2 expired today · 4 within this week</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.textMuted} />
          </AnimatedPressable>
        </FadeInView>

        {/* Recent Activity */}
        <FadeInView delay={900}>
          <Text style={styles.sectionTitle}>💬 Recent Activity</Text>
          <View style={styles.activityCard}>
            {recentActivity.map((item, i) => (
              <View key={i} style={[styles.activityRow, i < recentActivity.length - 1 && styles.activityBorder]}>
                <Text style={styles.activityEmoji}>{item.emoji}</Text>
                <Text style={styles.activityText} numberOfLines={1}>{item.text}</Text>
                <Text style={styles.activityTime}>{item.time}</Text>
              </View>
            ))}
          </View>
        </FadeInView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 24 },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, marginBottom: 24 },
  greeting: { fontSize: 15, color: Colors.textSub },
  name: { fontSize: 24, fontWeight: '700', color: Colors.text, marginTop: 2 },
  avatarBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.bgCard, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },

  // Stats
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28 },
  statCardWrap: { width: '48%' },
  statCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  statIcon: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  statEmoji: { fontSize: 16 },
  statValue: { fontSize: 26, fontWeight: '700', color: Colors.text },
  statLabel: { fontSize: 13, color: Colors.textSub, marginTop: 4 },

  // Section
  sectionTitle: { fontSize: 17, fontWeight: '600', color: Colors.text, marginBottom: 12 },

  // Quick Actions
  actionsRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  actionBtn: {
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.accentMuted, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  actionEmoji: { fontSize: 20 },
  actionLabel: { fontSize: 11, fontWeight: '500', color: Colors.textSub, textAlign: 'center' },

  // Alerts
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.orangeMuted,
    borderRadius: 14,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.orange + '25',
    marginBottom: 28,
  },
  alertEmoji: { fontSize: 28 },
  alertTextMain: { fontSize: 15, fontWeight: '600', color: Colors.text },
  alertText: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },

  // Activity
  activityCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 14 },
  activityBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  activityEmoji: { fontSize: 16 },
  activityText: { flex: 1, fontSize: 13, color: Colors.text, fontWeight: '500' },
  activityTime: { fontSize: 11, color: Colors.textMuted },
});
