import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/colors';
import AnimatedPressable from '@/components/AnimatedPressable';
import FadeInView from '@/components/FadeInView';

const plans = [
  { id: '1', name: '1 Month Basic', duration: '30 days', price: 1500, emoji: '🎫' },
  { id: '2', name: '3 Month Standard', duration: '90 days', price: 3500, emoji: '🎟️' },
  { id: '3', name: '6 Month Premium', duration: '180 days', price: 6000, emoji: '⭐' },
  { id: '4', name: '1 Year Ultimate', duration: '365 days', price: 10000, emoji: '👑' },
];

const payMethods = [
  { id: 'upi', label: 'UPI', emoji: '📱' },
  { id: 'cash', label: 'Cash', emoji: '💵' },
  { id: 'card', label: 'Card', emoji: '💳' },
  { id: 'bank', label: 'Bank', emoji: '🏦' },
];

export default function RenewPlanScreen() {
  const router = useRouter();
  const { memberId, memberName } = useLocalSearchParams<{ memberId: string; memberName: string }>();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState('upi');
  const [saving, setSaving] = useState(false);

  const plan = plans.find(p => p.id === selectedPlan);

  const handleRenew = () => {
    if (!selectedPlan) return;
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      Alert.alert(
        '✅ Plan Assigned!',
        `${plan?.name} assigned to ${memberName || 'member'}.\nPayment of ₹${plan?.price.toLocaleString('en-IN')} recorded via ${payMethods.find(m => m.id === selectedMethod)?.label}.`,
        [{ text: 'Done', onPress: () => router.back() }],
      );
    }, 600);
  };

  return (
    <>
      <Stack.Screen options={{ title: '🔄 Assign / Renew Plan' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Member Info */}
        <FadeInView delay={0}>
          <View style={styles.memberBanner}>
            <View style={styles.memberAvatar}>
              <Text style={styles.memberInitials}>
                {(memberName || 'M').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={styles.memberName}>{memberName || 'Member'}</Text>
              <Text style={styles.memberId}>Assigning new plan</Text>
            </View>
          </View>
        </FadeInView>

        {/* Select Plan */}
        <FadeInView delay={100}>
          <Text style={styles.sectionTitle}>📋 Select Plan</Text>
        </FadeInView>

        {plans.map((p, i) => {
          const active = selectedPlan === p.id;
          return (
            <FadeInView key={p.id} delay={150 + i * 50}>
              <AnimatedPressable
                style={[styles.planCard, active && styles.planCardActive]}
                scaleDown={0.97}
                onPress={() => setSelectedPlan(p.id)}
              >
                <Text style={styles.planEmoji}>{p.emoji}</Text>
                <View style={styles.planInfo}>
                  <Text style={[styles.planName, active && { color: Colors.accent }]}>{p.name}</Text>
                  <Text style={styles.planDuration}>{p.duration}</Text>
                </View>
                <Text style={styles.planPrice}>₹{p.price.toLocaleString('en-IN')}</Text>
                <View style={[styles.radio, active && styles.radioActive]}>
                  {active && <View style={styles.radioInner} />}
                </View>
              </AnimatedPressable>
            </FadeInView>
          );
        })}

        {/* Payment Method */}
        <FadeInView delay={400}>
          <Text style={styles.sectionTitle}>💰 Payment Method</Text>
          <View style={styles.methodRow}>
            {payMethods.map(m => {
              const active = selectedMethod === m.id;
              return (
                <AnimatedPressable
                  key={m.id}
                  style={[styles.methodChip, active && styles.methodChipActive]}
                  scaleDown={0.95}
                  onPress={() => setSelectedMethod(m.id)}
                >
                  <Text style={styles.methodEmoji}>{m.emoji}</Text>
                  <Text style={[styles.methodLabel, active && styles.methodLabelActive]}>{m.label}</Text>
                </AnimatedPressable>
              );
            })}
          </View>
        </FadeInView>

        {/* Summary */}
        {plan && (
          <FadeInView delay={500}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>🧾 Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Plan</Text>
                <Text style={styles.summaryValue}>{plan.name}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Duration</Text>
                <Text style={styles.summaryValue}>{plan.duration}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Payment</Text>
                <Text style={styles.summaryValue}>{payMethods.find(m => m.id === selectedMethod)?.label}</Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>₹{plan.price.toLocaleString('en-IN')}</Text>
              </View>
            </View>
          </FadeInView>
        )}

        {/* Confirm Button */}
        <FadeInView delay={600}>
          <AnimatedPressable
            style={[styles.confirmBtn, (!selectedPlan || saving) && { opacity: 0.5 }]}
            scaleDown={0.97}
            onPress={handleRenew}
            disabled={!selectedPlan || saving}
          >
            <Text style={styles.confirmBtnText}>
              {saving ? '⏳ Processing...' : '✅ Confirm & Assign Plan'}
            </Text>
          </AnimatedPressable>
        </FadeInView>

        <View style={{ height: 32 }} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 16, gap: 10 },

  memberBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: Colors.bgCard,
    borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.border,
  },
  memberAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.accentMuted, justifyContent: 'center', alignItems: 'center' },
  memberInitials: { fontSize: 16, fontWeight: '700', color: Colors.accent },
  memberName: { fontSize: 17, fontWeight: '700', color: Colors.text },
  memberId: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },

  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginTop: 8 },

  planCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.bgCard,
    borderRadius: 14, padding: 16, borderWidth: 1.5, borderColor: Colors.border,
  },
  planCardActive: { borderColor: Colors.accent, backgroundColor: Colors.accentMuted },
  planEmoji: { fontSize: 24 },
  planInfo: { flex: 1 },
  planName: { fontSize: 15, fontWeight: '600', color: Colors.text },
  planDuration: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  planPrice: { fontSize: 16, fontWeight: '700', color: Colors.accent },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  radioActive: { borderColor: Colors.accent },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.accent },

  methodRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  methodChip: {
    flex: 1, alignItems: 'center', gap: 4, paddingVertical: 12, borderRadius: 12,
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
  },
  methodChipActive: { backgroundColor: Colors.accentMuted, borderColor: Colors.accent },
  methodEmoji: { fontSize: 18 },
  methodLabel: { fontSize: 12, fontWeight: '500', color: Colors.textMuted },
  methodLabelActive: { color: Colors.accent, fontWeight: '600' },

  summaryCard: {
    backgroundColor: Colors.bgCard, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.border, gap: 10, marginTop: 4,
  },
  summaryTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontSize: 13, color: Colors.textMuted },
  summaryValue: { fontSize: 13, fontWeight: '600', color: Colors.text },
  totalRow: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 10, marginTop: 4 },
  totalLabel: { fontSize: 15, fontWeight: '700', color: Colors.text },
  totalValue: { fontSize: 18, fontWeight: '700', color: Colors.green },

  confirmBtn: { backgroundColor: Colors.accent, borderRadius: 14, paddingVertical: 18, alignItems: 'center', marginTop: 8 },
  confirmBtnText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
});
