import { View, Text, ScrollView, StyleSheet, Linking } from 'react-native';
import { Stack } from 'expo-router';
import { Colors } from '@/constants/colors';
import AnimatedPressable from '@/components/AnimatedPressable';
import FadeInView from '@/components/FadeInView';
import { expiringMembers } from '@/components/reports/mockData';

function getUrgencyColor(days: number) {
  if (days <= 0) return Colors.red;
  if (days <= 3) return Colors.orange;
  return Colors.green;
}

function getUrgencyLabel(days: number) {
  if (days <= 0) return '🔴 Expired';
  if (days <= 3) return '🟠 Urgent';
  if (days <= 7) return '🟡 Soon';
  return '🟢 Upcoming';
}

export default function ExpiryDashboard() {
  const expired = expiringMembers.filter(m => m.expiresIn <= 0).length;
  const urgent = expiringMembers.filter(m => m.expiresIn > 0 && m.expiresIn <= 3).length;
  const upcoming = expiringMembers.length - expired - urgent;

  return (
    <>
      <Stack.Screen options={{ title: '⏰ Expiry Dashboard' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Alert Banner */}
        <FadeInView delay={0}>
          <View style={styles.alertBanner}>
            <Text style={styles.alertEmoji}>⚠️</Text>
            <View style={styles.alertText}>
              <Text style={styles.alertTitle}>
                {expired + urgent} members need attention
              </Text>
              <Text style={styles.alertSub}>
                {expired} expired · {urgent} expiring within 3 days · {upcoming} upcoming
              </Text>
            </View>
          </View>
        </FadeInView>

        {/* Summary Chips */}
        <FadeInView delay={100}>
          <View style={styles.chipRow}>
            <View style={[styles.summaryChip, { backgroundColor: Colors.redMuted }]}>
              <Text style={[styles.chipNum, { color: Colors.red }]}>{expired}</Text>
              <Text style={styles.chipLabel}>Expired</Text>
            </View>
            <View style={[styles.summaryChip, { backgroundColor: Colors.orangeMuted }]}>
              <Text style={[styles.chipNum, { color: Colors.orange }]}>{urgent}</Text>
              <Text style={styles.chipLabel}>Urgent</Text>
            </View>
            <View style={[styles.summaryChip, { backgroundColor: Colors.greenMuted }]}>
              <Text style={[styles.chipNum, { color: Colors.green }]}>{upcoming}</Text>
              <Text style={styles.chipLabel}>Upcoming</Text>
            </View>
          </View>
        </FadeInView>

        {/* Member Cards */}
        {expiringMembers.map((member, i) => {
          const urgColor = getUrgencyColor(member.expiresIn);
          const urgLabel = getUrgencyLabel(member.expiresIn);
          const daysText = member.expiresIn <= 0
            ? 'Expired today'
            : `${member.expiresIn} days left`;

          return (
            <FadeInView key={member.id} delay={200 + i * 80}>
              <View style={[styles.memberCard, { borderLeftColor: urgColor }]}>
                <View style={styles.memberHeader}>
                  <Text style={styles.memberAvatar}>{member.avatar}</Text>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    <Text style={styles.memberPlan}>{member.plan} plan</Text>
                  </View>
                  <View style={[styles.urgBadge, { backgroundColor: urgColor + '20' }]}>
                    <Text style={[styles.urgText, { color: urgColor }]}>{urgLabel}</Text>
                  </View>
                </View>

                <View style={styles.memberMeta}>
                  <Text style={[styles.daysLeft, { color: urgColor }]}>{daysText}</Text>
                </View>

                <View style={styles.actionRow}>
                  <AnimatedPressable
                    style={styles.callBtn}
                    scaleDown={0.95}
                    onPress={() => Linking.openURL(`tel:${member.phone}`)}
                  >
                    <Text style={styles.callText}>📞 Call</Text>
                  </AnimatedPressable>
                  <AnimatedPressable
                    style={styles.renewBtn}
                    scaleDown={0.95}
                    onPress={() => {}}
                  >
                    <Text style={styles.renewText}>🔄 Renew</Text>
                  </AnimatedPressable>
                </View>
              </View>
            </FadeInView>
          );
        })}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 16, paddingBottom: 40, gap: 12 },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.redMuted,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.red + '30',
    gap: 12,
  },
  alertEmoji: { fontSize: 28 },
  alertText: { flex: 1 },
  alertTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  alertSub: { fontSize: 12, color: Colors.textSub, marginTop: 2 },
  chipRow: { flexDirection: 'row', gap: 10 },
  summaryChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 2,
  },
  chipNum: { fontSize: 20, fontWeight: '700' },
  chipLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '500' },
  memberCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 4,
    gap: 10,
  },
  memberHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  memberAvatar: { fontSize: 24 },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 15, fontWeight: '600', color: Colors.text },
  memberPlan: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  urgBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  urgText: { fontSize: 11, fontWeight: '600' },
  memberMeta: { paddingLeft: 34 },
  daysLeft: { fontSize: 13, fontWeight: '600' },
  actionRow: { flexDirection: 'row', gap: 10, paddingLeft: 34 },
  callBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  callText: { fontSize: 13, fontWeight: '600', color: Colors.text },
  renewBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.accentMuted,
    alignItems: 'center',
  },
  renewText: { fontSize: 13, fontWeight: '600', color: Colors.accent },
});
