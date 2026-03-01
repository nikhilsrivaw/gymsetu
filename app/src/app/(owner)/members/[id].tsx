import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Linking } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import AnimatedPressable from '@/components/AnimatedPressable';
import FadeInView from '@/components/FadeInView';

type TabKey = 'info' | 'plans' | 'payments' | 'attendance';
const tabs: { key: TabKey; label: string; emoji: string }[] = [
  { key: 'info', label: 'Info', emoji: 'ℹ️' },
  { key: 'plans', label: 'Plans', emoji: '📄' },
  { key: 'payments', label: 'Payments', emoji: '💳' },
  { key: 'attendance', label: 'Attend', emoji: '📋' },
];

// Mock member data by ID
const membersDB: Record<string, {
  full_name: string; phone: string; email: string; status: 'active' | 'expired' | 'suspended';
  gender: string; dob: string; join_date: string; height_cm: number | null; weight_kg: number | null; goal: string;
}> = {
  '1': { full_name: 'Rahul Sharma', phone: '+919876543210', email: 'rahul@gmail.com', status: 'active', gender: 'Male', dob: '15 Jun 1995', join_date: '10 Sep 2025', height_cm: 175, weight_kg: 78, goal: 'Muscle Gain' },
  '2': { full_name: 'Priya Patel', phone: '+919812345678', email: 'priya@gmail.com', status: 'active', gender: 'Female', dob: '22 Sep 1998', join_date: '15 Oct 2025', height_cm: 162, weight_kg: 58, goal: 'Weight Loss' },
  '3': { full_name: 'Arjun Reddy', phone: '+919898765432', email: 'arjun@gmail.com', status: 'active', gender: 'Male', dob: '08 Mar 1992', join_date: '20 Aug 2025', height_cm: 180, weight_kg: 85, goal: 'Muscle Gain' },
  '4': { full_name: 'Sneha Gupta', phone: '+919845612378', email: 'sneha@gmail.com', status: 'active', gender: 'Female', dob: '14 Jan 2000', join_date: '05 Feb 2026', height_cm: 158, weight_kg: 52, goal: 'General Fitness' },
  '5': { full_name: 'Vikram Singh', phone: '+919867543120', email: 'vikram@gmail.com', status: 'expired', gender: 'Male', dob: '30 Nov 1990', join_date: '01 Dec 2025', height_cm: 182, weight_kg: 90, goal: 'Muscle Gain' },
  '6': { full_name: 'Amit Kumar', phone: '+919823456789', email: 'amit@gmail.com', status: 'expired', gender: 'Male', dob: '18 Jul 1997', join_date: '25 Jan 2026', height_cm: 170, weight_kg: 72, goal: 'Weight Loss' },
  '7': { full_name: 'Neha Verma', phone: '+919834567890', email: 'neha@gmail.com', status: 'active', gender: 'Female', dob: '05 Apr 1996', join_date: '18 Feb 2026', height_cm: 165, weight_kg: 60, goal: 'General Fitness' },
  '8': { full_name: 'Rohan Das', phone: '+919845678901', email: 'rohan@gmail.com', status: 'active', gender: 'Male', dob: '12 Dec 1993', join_date: '22 Jan 2026', height_cm: 178, weight_kg: 82, goal: 'Muscle Gain' },
  '9': { full_name: 'Kavita Joshi', phone: '+919856789012', email: 'kavita@gmail.com', status: 'suspended', gender: 'Female', dob: '28 Aug 1999', join_date: '10 Feb 2026', height_cm: 160, weight_kg: 55, goal: 'Weight Loss' },
  '10': { full_name: 'Suresh Nair', phone: '+919867890123', email: 'suresh@gmail.com', status: 'active', gender: 'Male', dob: '03 May 1988', join_date: '01 Jan 2026', height_cm: 176, weight_kg: 80, goal: 'General Fitness' },
  '11': { full_name: 'Divya Menon', phone: '+919878901234', email: 'divya@gmail.com', status: 'active', gender: 'Female', dob: '17 Feb 1997', join_date: '30 Jan 2026', height_cm: 163, weight_kg: 57, goal: 'Weight Loss' },
  '12': { full_name: 'Manish Tiwari', phone: '+919889012345', email: 'manish@gmail.com', status: 'expired', gender: 'Male', dob: '09 Oct 1994', join_date: '20 Jan 2026', height_cm: 172, weight_kg: 76, goal: 'General Fitness' },
};

// Mock plan history
const plansDB: Record<string, { plan: string; start: string; end: string; status: 'active' | 'expired'; price: number }[]> = {
  '1': [
    { plan: '3 Month Standard', start: '15 Jan 2026', end: '15 Apr 2026', status: 'active', price: 3500 },
    { plan: '1 Month Basic', start: '10 Dec 2025', end: '10 Jan 2026', status: 'expired', price: 1500 },
  ],
  '2': [{ plan: '6 Month Premium', start: '20 Dec 2025', end: '20 Jun 2026', status: 'active', price: 6000 }],
  '3': [{ plan: '1 Year Ultimate', start: '10 Dec 2025', end: '10 Dec 2026', status: 'active', price: 10000 }],
  '5': [{ plan: '3 Month Standard', start: '28 Nov 2025', end: '28 Feb 2026', status: 'expired', price: 3500 }],
};

// Mock payment history
const paymentsDB: Record<string, { date: string; amount: number; method: string; note: string }[]> = {
  '1': [
    { date: '15 Jan 2026', amount: 3500, method: 'UPI', note: '3 Month Standard' },
    { date: '10 Dec 2025', amount: 1500, method: 'Cash', note: '1 Month Basic' },
  ],
  '2': [{ date: '20 Dec 2025', amount: 6000, method: 'UPI', note: '6 Month Premium' }],
  '3': [{ date: '10 Dec 2025', amount: 10000, method: 'UPI', note: '1 Year Ultimate' }],
  '5': [{ date: '28 Nov 2025', amount: 3500, method: 'Cash', note: '3 Month Standard' }],
};

// Mock attendance
const attendanceDB: Record<string, { date: string; time: string }[]> = {
  '1': [
    { date: '28 Feb', time: '6:15 AM' }, { date: '27 Feb', time: '6:20 AM' }, { date: '26 Feb', time: '6:10 AM' },
    { date: '25 Feb', time: '6:30 AM' }, { date: '24 Feb', time: '6:18 AM' }, { date: '22 Feb', time: '6:25 AM' },
    { date: '21 Feb', time: '6:12 AM' }, { date: '20 Feb', time: '6:35 AM' },
  ],
  '2': [
    { date: '28 Feb', time: '7:00 PM' }, { date: '27 Feb', time: '7:10 PM' }, { date: '25 Feb', time: '6:55 PM' },
    { date: '24 Feb', time: '7:05 PM' }, { date: '22 Feb', time: '7:00 PM' },
  ],
  '3': [
    { date: '28 Feb', time: '5:30 AM' }, { date: '27 Feb', time: '5:35 AM' }, { date: '26 Feb', time: '5:25 AM' },
    { date: '25 Feb', time: '5:40 AM' }, { date: '24 Feb', time: '5:28 AM' }, { date: '23 Feb', time: '5:32 AM' },
    { date: '22 Feb', time: '5:30 AM' }, { date: '21 Feb', time: '5:45 AM' }, { date: '20 Feb', time: '5:30 AM' },
  ],
};

const defaultMember = { full_name: 'Member', phone: '-', email: '-', status: 'active' as const, gender: '-', dob: '-', join_date: '-', height_cm: null, weight_kg: null, goal: '-' };

export default function MemberProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>('info');

  const member = membersDB[id || ''] || defaultMember;
  const memberPlans = plansDB[id || ''] || [];
  const memberPayments = paymentsDB[id || ''] || [];
  const memberAttendance = attendanceDB[id || ''] || [];

  const statusColor = member.status === 'active' ? Colors.green : member.status === 'expired' ? Colors.red : Colors.orange;
  const statusEmoji = member.status === 'active' ? '✅' : member.status === 'expired' ? '🔴' : '🟡';

  const renderContent = () => {
    if (activeTab === 'info') {
      return (
        <View style={styles.infoList}>
          <InfoRow label="Phone" value={member.phone} emoji="📱" />
          <InfoRow label="Email" value={member.email} emoji="📧" />
          <InfoRow label="Gender" value={member.gender} emoji="👤" />
          <InfoRow label="Date of Birth" value={member.dob} emoji="🎂" />
          <InfoRow label="Member Since" value={member.join_date} emoji="📅" />
          <InfoRow label="Height" value={member.height_cm ? `${member.height_cm} cm` : '-'} emoji="📏" />
          <InfoRow label="Weight" value={member.weight_kg ? `${member.weight_kg} kg` : '-'} emoji="⚖️" />
          <InfoRow label="Goal" value={member.goal} emoji="🎯" />
        </View>
      );
    }

    if (activeTab === 'plans') {
      if (memberPlans.length === 0) return <EmptyTab emoji="📄" text="No plans assigned yet" />;
      return (
        <View style={styles.tabContent}>
          {memberPlans.map((p, i) => (
            <View key={i} style={[styles.planItem, { borderLeftColor: p.status === 'active' ? Colors.green : Colors.textMuted }]}>
              <View style={styles.planHeader}>
                <Text style={styles.planName}>🎫 {p.plan}</Text>
                <View style={[styles.planStatus, { backgroundColor: p.status === 'active' ? Colors.greenMuted : Colors.bgInput }]}>
                  <Text style={[styles.planStatusText, { color: p.status === 'active' ? Colors.green : Colors.textMuted }]}>
                    {p.status === 'active' ? '✅ Active' : '⏹ Expired'}
                  </Text>
                </View>
              </View>
              <Text style={styles.planDates}>{p.start} → {p.end}</Text>
              <Text style={styles.planPrice}>₹{p.price.toLocaleString('en-IN')}</Text>
            </View>
          ))}
        </View>
      );
    }

    if (activeTab === 'payments') {
      if (memberPayments.length === 0) return <EmptyTab emoji="💳" text="No payments recorded yet" />;
      return (
        <View style={styles.tabContent}>
          {memberPayments.map((p, i) => (
            <View key={i} style={styles.payItem}>
              <View style={styles.payLeft}>
                <Text style={styles.payEmoji}>{p.method === 'UPI' ? '📱' : p.method === 'Card' ? '💳' : '💵'}</Text>
                <View>
                  <Text style={styles.payNote}>{p.note}</Text>
                  <Text style={styles.payDate}>{p.date} · {p.method}</Text>
                </View>
              </View>
              <Text style={styles.payAmount}>+₹{p.amount.toLocaleString('en-IN')}</Text>
            </View>
          ))}
        </View>
      );
    }

    if (activeTab === 'attendance') {
      if (memberAttendance.length === 0) return <EmptyTab emoji="📋" text="No attendance records yet" />;
      return (
        <View style={styles.tabContent}>
          <View style={styles.attendSummary}>
            <Text style={styles.attendCount}>🔥 {memberAttendance.length} days</Text>
            <Text style={styles.attendLabel}>this month</Text>
          </View>
          {memberAttendance.map((a, i) => (
            <View key={i} style={styles.attendItem}>
              <Text style={styles.attendCheck}>✅</Text>
              <Text style={styles.attendDate}>{a.date}</Text>
              <Text style={styles.attendTime}>{a.time}</Text>
            </View>
          ))}
        </View>
      );
    }

    return null;
  };

  return (
    <>
      <Stack.Screen options={{ title: '' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
        {/* Profile Header */}
        <FadeInView delay={0}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {member.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.name}>{member.full_name}</Text>
            <View style={[styles.statusPill, { backgroundColor: statusColor + '18' }]}>
              <Text style={styles.statusEmoji}>{statusEmoji}</Text>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
              </Text>
            </View>
          </View>
        </FadeInView>

        {/* Quick Contact */}
        <FadeInView delay={50}>
          <View style={styles.contactRow}>
            <AnimatedPressable style={styles.contactBtn} scaleDown={0.95} onPress={() => Linking.openURL(`tel:${member.phone}`)}>
              <Text style={styles.contactBtnText}>📞 Call</Text>
            </AnimatedPressable>
            <AnimatedPressable style={styles.contactBtn} scaleDown={0.95} onPress={() => Linking.openURL(`https://wa.me/${member.phone.replace('+', '')}`)}>
              <Text style={styles.contactBtnText}>💬 WhatsApp</Text>
            </AnimatedPressable>
          </View>
        </FadeInView>

        {/* Action Buttons */}
        <FadeInView delay={100}>
          <View style={styles.actions}>
            <AnimatedPressable style={styles.actionBtn} scaleDown={0.94} onPress={() => router.push({ pathname: '/(owner)/more/renew-plan', params: { memberId: id, memberName: member.full_name } })}>
              <Text style={styles.actionEmoji}>💳</Text>
              <Text style={styles.actionLabel}>Renew Plan</Text>
            </AnimatedPressable>
            <AnimatedPressable style={styles.actionBtn} scaleDown={0.94} onPress={() => router.push('/(owner)/payments' as any)}>
              <Text style={styles.actionEmoji}>💰</Text>
              <Text style={styles.actionLabel}>Payment</Text>
            </AnimatedPressable>
            <AnimatedPressable style={styles.actionBtn} scaleDown={0.94} onPress={() => router.push({ pathname: '/(owner)/members/edit', params: { memberId: id } })}>
              <Text style={styles.actionEmoji}>✏️</Text>
              <Text style={styles.actionLabel}>Edit</Text>
            </AnimatedPressable>
          </View>
        </FadeInView>

        {/* Tabs */}
        <FadeInView delay={200}>
          <View style={styles.tabBar}>
            {tabs.map((t) => (
              <AnimatedPressable
                key={t.key}
                style={[styles.tab, activeTab === t.key && styles.tabActive]}
                onPress={() => setActiveTab(t.key)}
                scaleDown={0.95}
              >
                <Text style={styles.tabEmoji}>{t.emoji}</Text>
                <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>{t.label}</Text>
              </AnimatedPressable>
            ))}
          </View>
        </FadeInView>

        {/* Content */}
        <FadeInView delay={300}>
          <View style={styles.contentCard}>{renderContent()}</View>
        </FadeInView>
      </ScrollView>
    </>
  );
}

function InfoRow({ label, value, emoji }: { label: string; value: string; emoji: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoLeft}>
        <Text style={styles.infoEmoji}>{emoji}</Text>
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function EmptyTab({ emoji, text }: { emoji: string; text: string }) {
  return (
    <View style={styles.emptyTab}>
      <Text style={styles.emptyTabEmoji}>{emoji}</Text>
      <Text style={styles.emptyTabText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingBottom: 40 },

  profileHeader: { alignItems: 'center', paddingTop: 16, paddingBottom: 16 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.bgElevated, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: Colors.border },
  avatarText: { fontSize: 24, fontWeight: '700', color: Colors.textSub },
  name: { fontSize: 22, fontWeight: '700', color: Colors.text, marginTop: 12 },
  statusPill: { flexDirection: 'row', alignItems: 'center', marginTop: 8, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12, gap: 6 },
  statusEmoji: { fontSize: 12 },
  statusText: { fontSize: 13, fontWeight: '600' },

  contactRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 12 },
  contactBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  contactBtnText: { fontSize: 13, fontWeight: '600', color: Colors.text },

  actions: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 24 },
  actionBtn: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 64,
    justifyContent: 'center',
  },
  actionEmoji: { fontSize: 20 },
  actionLabel: { fontSize: 12, fontWeight: '500', color: Colors.textSub },

  tabBar: { flexDirection: 'row', marginHorizontal: 20, backgroundColor: Colors.bgCard, borderRadius: 12, padding: 4, marginBottom: 14 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10, gap: 2 },
  tabActive: { backgroundColor: Colors.bgElevated },
  tabEmoji: { fontSize: 14 },
  tabText: { fontSize: 12, fontWeight: '500', color: Colors.textMuted },
  tabTextActive: { color: Colors.text, fontWeight: '600' },

  contentCard: { marginHorizontal: 20, backgroundColor: Colors.bgCard, borderRadius: 16, padding: 4, borderWidth: 1, borderColor: Colors.border },

  infoList: {},
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  infoLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoEmoji: { fontSize: 15 },
  infoLabel: { fontSize: 14, color: Colors.textSub },
  infoValue: { fontSize: 14, fontWeight: '600', color: Colors.text },

  tabContent: { padding: 12, gap: 10 },

  planItem: { backgroundColor: Colors.bgElevated, borderRadius: 12, padding: 12, gap: 6, borderLeftWidth: 3 },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planName: { fontSize: 14, fontWeight: '600', color: Colors.text },
  planStatus: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  planStatusText: { fontSize: 11, fontWeight: '600' },
  planDates: { fontSize: 12, color: Colors.textMuted },
  planPrice: { fontSize: 14, fontWeight: '700', color: Colors.accent },

  payItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  payLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  payEmoji: { fontSize: 18 },
  payNote: { fontSize: 13, fontWeight: '600', color: Colors.text },
  payDate: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  payAmount: { fontSize: 14, fontWeight: '700', color: Colors.green },

  attendSummary: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  attendCount: { fontSize: 16, fontWeight: '700', color: Colors.text },
  attendLabel: { fontSize: 13, color: Colors.textMuted },
  attendItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  attendCheck: { fontSize: 14 },
  attendDate: { flex: 1, fontSize: 13, fontWeight: '500', color: Colors.text },
  attendTime: { fontSize: 12, color: Colors.textMuted },

  emptyTab: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyTabEmoji: { fontSize: 32 },
  emptyTabText: { fontSize: 14, color: Colors.textMuted },
});
