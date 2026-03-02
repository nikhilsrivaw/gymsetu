import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import AnimatedPressable from '@/components/AnimatedPressable';
import FadeInView from '@/components/FadeInView';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const stats: {
  label: string; value: string; sub: string;
  icon: IconName; iconBg: string; iconColor: string;
}[] = [
  { label: 'MEMBERS',       value: '148', sub: 'total enrolled',    icon: 'account-group-outline',  iconBg: Colors.accentMuted, iconColor: Colors.accent },
  { label: 'ACTIVE',        value: '112', sub: 'valid plans',        icon: 'check-circle-outline',   iconBg: Colors.greenMuted,  iconColor: Colors.green  },
  { label: 'EXPIRING',      value: '6',   sub: 'within 7 days',      icon: 'clock-alert-outline',    iconBg: Colors.orangeMuted, iconColor: Colors.orange },
  { label: 'DUES',          value: '₹24.5K', sub: 'pending',         icon: 'alert-circle-outline',   iconBg: Colors.redMuted,    iconColor: Colors.red    },
  { label: 'ATTENDANCE',    value: '68',  sub: 'checked in today',   icon: 'calendar-check-outline', iconBg: Colors.greenMuted,  iconColor: Colors.green  },
  { label: 'REVENUE',       value: '₹1.96L', sub: 'this month',      icon: 'trending-up',            iconBg: Colors.accentMuted, iconColor: Colors.accent },
];

const quickActions: { label: string; emoji: string; icon: IconName; route: string }[] = [
  { label: 'ADD\nMEMBER',   emoji: '👤', icon: 'account-plus-outline',  route: '/(owner)/members/add'         },
  { label: 'PAYMENT',       emoji: '💳', icon: 'plus-circle-outline',   route: '/(owner)/payments'            },
  { label: 'ATTENDANCE',    emoji: '📝', icon: 'check-circle-outline',  route: '/(owner)/more/attendance'     },
  { label: 'PLANS',         emoji: '📄', icon: 'refresh',               route: '/(owner)/plans'               },
];

const recentActivity = [
  { emoji: '💳', text: 'Rahul Sharma paid ₹3,500',           time: '2h ago'  },
  { emoji: '👤', text: 'Sneha Gupta joined — 1 Month',       time: '5h ago'  },
  { emoji: '📋', text: '68 members checked in today',         time: '6h ago'  },
  { emoji: '⚠️', text: "Vikram Singh's plan expired",        time: '1d ago'  },
  { emoji: '💰', text: 'Priya Patel paid ₹6,000',            time: '1d ago'  },
];

export default function DashboardScreen() {
  const { profile } = useAuthStore();
  const router    = useRouter();
  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? 'GOOD MORNING' : hour < 17 ? 'GOOD AFTERNOON' : 'GOOD EVENING';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Header ───────────────────────────────────────────── */}
        <FadeInView delay={0}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.greeting}>{greeting}</Text>
              <Text style={styles.ownerName}>{profile?.full_name || 'OWNER'}</Text>
            </View>
            <AnimatedPressable
              style={styles.avatarBtn}
              scaleDown={0.9}
              onPress={() => router.push('/(owner)/more/settings' as any)}
            >
              <MaterialCommunityIcons name="account-circle-outline" size={28} color={Colors.accent} />
            </AnimatedPressable>
          </View>
        </FadeInView>

        {/* ── Stats Grid ───────────────────────────────────────── */}
        <View style={styles.statsGrid}>
          {stats.map((s, i) => (
            <FadeInView key={s.label} delay={60 + i * 55} style={styles.statWrap}>
              <AnimatedPressable style={styles.statCard} scaleDown={0.96}>
                {/* left accent bar */}
                <View style={[styles.statAccent, { backgroundColor: s.iconColor }]} />
                <View style={styles.statInner}>
                  <View style={[styles.statIcon, { backgroundColor: s.iconBg }]}>
                    <MaterialCommunityIcons name={s.icon} size={16} color={s.iconColor} />
                  </View>
                  <Text style={styles.statVal}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                  <Text style={styles.statSub}>{s.sub}</Text>
                </View>
              </AnimatedPressable>
            </FadeInView>
          ))}
        </View>

        {/* ── Quick Actions ─────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
        <View style={styles.actionsRow}>
          {quickActions.map((a, i) => (
            <FadeInView key={a.label} delay={440 + i * 55} style={{ flex: 1 }}>
              <AnimatedPressable
                style={styles.actionBtn}
                scaleDown={0.93}
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

        {/* ── Alert ────────────────────────────────────────────── */}
        <FadeInView delay={680}>
          <Text style={styles.sectionLabel}>ALERTS</Text>
          <AnimatedPressable
            style={styles.alertCard}
            scaleDown={0.98}
            onPress={() => router.push('/(owner)/more/reports-expiry' as any)}
          >
            <View style={styles.alertAccent} />
            <Text style={styles.alertEmoji}>⚠️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.alertTitle}>6 MEMBERSHIPS EXPIRING SOON</Text>
              <Text style={styles.alertSub}>2 expired today  ·  4 within this week</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.orange} />
          </AnimatedPressable>
        </FadeInView>

        {/* ── Recent Activity ───────────────────────────────────── */}
        <FadeInView delay={780}>
          <Text style={styles.sectionLabel}>RECENT ACTIVITY</Text>
          <View style={styles.activityCard}>
            {recentActivity.map((item, i) => (
              <View
                key={i}
                style={[styles.activityRow, i < recentActivity.length - 1 && styles.activityBorder]}
              >
                <Text style={styles.activityEmoji}>{item.emoji}</Text>
                <Text style={styles.activityText} numberOfLines={1}>{item.text}</Text>
                <Text style={styles.activityTime}>{item.time}</Text>
              </View>
            ))}
          </View>
        </FadeInView>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: Colors.bg },
  container: { flex: 1 },
  scroll:    { paddingHorizontal: 16, paddingBottom: 24 },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingTop: 16, marginBottom: 20,
  },
  greeting: {
    fontFamily: Fonts.medium,
    fontSize: 9, color: Colors.accent, letterSpacing: 1.8,
  },
  ownerName: {
    fontFamily: Fonts.condensedBold,
    fontSize: 30, color: Colors.text, letterSpacing: 0.5, marginTop: 2,
  },
  avatarBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.bgCard,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.accent + '30',
  },

  // Stats grid
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  statWrap:  { width: '48%' },
  statCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  statAccent: { width: 3 },
  statInner:  { flex: 1, padding: 14, gap: 3 },
  statIcon: {
    width: 30, height: 30, borderRadius: 9,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 6,
  },
  statVal: {
    fontFamily: Fonts.condensedBold,
    fontSize: 26, color: Colors.text,
  },
  statLabel: {
    fontFamily: Fonts.bold,
    fontSize: 9, color: Colors.textMuted, letterSpacing: 1.2,
  },
  statSub: {
    fontFamily: Fonts.regular,
    fontSize: 10, color: Colors.textMuted,
  },

  // Section label
  sectionLabel: {
    fontFamily: Fonts.bold,
    fontSize: 9, color: Colors.textMuted,
    letterSpacing: 1.8, marginBottom: 10, marginTop: 4,
  },

  // Quick actions
  actionsRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  actionBtn: {
    backgroundColor: Colors.bgCard,
    borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: Colors.border,
  },
  actionIcon: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: Colors.accentMuted,
    justifyContent: 'center', alignItems: 'center',
  },
  actionEmoji: { fontSize: 20 },
  actionLabel: {
    fontFamily: Fonts.bold,
    fontSize: 8, color: Colors.textMuted,
    letterSpacing: 0.8, textAlign: 'center',
  },

  // Alert
  alertCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: 14, padding: 16, gap: 12,
    borderWidth: 1, borderColor: Colors.orange + '30',
    overflow: 'hidden', marginBottom: 24,
  },
  alertAccent: {
    position: 'absolute', left: 0, top: 0, bottom: 0,
    width: 3, backgroundColor: Colors.orange,
  },
  alertEmoji: { fontSize: 26 },
  alertTitle: {
    fontFamily: Fonts.bold,
    fontSize: 12, color: Colors.text, letterSpacing: 0.5,
  },
  alertSub: {
    fontFamily: Fonts.regular,
    fontSize: 11, color: Colors.textMuted, marginTop: 3,
  },

  // Activity
  activityCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.border,
  },
  activityRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 10, paddingVertical: 13, paddingHorizontal: 14,
  },
  activityBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  activityEmoji: { fontSize: 15 },
  activityText: {
    flex: 1, fontFamily: Fonts.medium,
    fontSize: 13, color: Colors.text,
  },
  activityTime: {
    fontFamily: Fonts.regular,
    fontSize: 10, color: Colors.textMuted,
  },
});
