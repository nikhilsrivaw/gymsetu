import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { FAB, Portal, Modal, TextInput, SegmentedButtons } from 'react-native-paper';
import { Colors } from '@/constants/colors';
import AnimatedPressable from '@/components/AnimatedPressable';
import FadeInView from '@/components/FadeInView';
import type { PaymentMethod } from '@/types/database';

const mockPayments: {
  id: string;
  member_name: string;
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod;
}[] = [
  { id: '1', member_name: 'Rahul Sharma', amount: 3500, payment_date: '28 Feb 2026', payment_method: 'upi' },
  { id: '2', member_name: 'Priya Patel', amount: 6000, payment_date: '27 Feb 2026', payment_method: 'upi' },
  { id: '3', member_name: 'Rohan Das', amount: 6000, payment_date: '26 Feb 2026', payment_method: 'bank_transfer' },
  { id: '4', member_name: 'Sneha Gupta', amount: 1500, payment_date: '25 Feb 2026', payment_method: 'cash' },
  { id: '5', member_name: 'Suresh Nair', amount: 10000, payment_date: '24 Feb 2026', payment_method: 'card' },
  { id: '6', member_name: 'Neha Verma', amount: 3500, payment_date: '22 Feb 2026', payment_method: 'upi' },
  { id: '7', member_name: 'Divya Menon', amount: 3500, payment_date: '20 Feb 2026', payment_method: 'cash' },
  { id: '8', member_name: 'Arjun Reddy', amount: 10000, payment_date: '18 Feb 2026', payment_method: 'upi' },
  { id: '9', member_name: 'Vikram Singh', amount: 3500, payment_date: '15 Feb 2026', payment_method: 'cash' },
  { id: '10', member_name: 'Manish Tiwari', amount: 1500, payment_date: '12 Feb 2026', payment_method: 'upi' },
];

export default function PaymentsScreen() {
  const [payments] = useState(mockPayments);
  const [show, setShow] = useState(false);
  const [memberName, setMemberName] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<string>('cash');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const ip = { mode: 'outlined' as const, style: styles.input, outlineColor: Colors.border, activeOutlineColor: Colors.accent, textColor: Colors.text, theme: { colors: { onSurfaceVariant: Colors.textSub } } };
  const total = payments.reduce((s, p) => s + p.amount, 0);

  const handleSave = () => {
    if (!memberName.trim() || !amount.trim()) return;
    setSaving(true);
    setTimeout(() => { setSaving(false); setShow(false); setMemberName(''); setAmount(''); setMethod('cash'); setNote(''); }, 400);
  };

  const methodEmoji: Record<string, string> = { cash: '\u{1F4B5}', upi: '\u{1F4F1}', card: '\u{1F4B3}' };

  return (
    <View style={styles.container}>
      {/* Summary */}
      <FadeInView delay={0}>
        <View style={styles.summary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryEmoji}>{'\u{1F4B0}'}</Text>
            <Text style={styles.summaryLabel}>Collected this month</Text>
            <Text style={styles.summaryValue}>{'\u20B9'}{total.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryEmoji}>{'\u{1F4C8}'}</Text>
            <Text style={styles.summaryLabel}>Transactions</Text>
            <Text style={styles.summaryValue}>{payments.length}</Text>
          </View>
        </View>
      </FadeInView>

      {payments.length === 0 ? (
        <FadeInView delay={150} style={styles.empty}>
          <Text style={styles.emptyEmoji}>{'\u{1F4B8}'}</Text>
          <Text style={styles.emptyTitle}>No payments yet</Text>
          <Text style={styles.emptyDesc}>Tap + to record a payment</Text>
        </FadeInView>
      ) : (
        <FlatList
          data={payments}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <FadeInView delay={index * 50}>
              <AnimatedPressable style={styles.payRow} scaleDown={0.98}>
                <View style={styles.payIcon}>
                  <Text style={styles.payIconEmoji}>{methodEmoji[item.payment_method] || '\u{1F4B5}'}</Text>
                </View>
                <View style={styles.payInfo}>
                  <Text style={styles.payName}>{item.member_name}</Text>
                  <Text style={styles.payMeta}>{item.payment_date}  {'\u2022'}  {item.payment_method.toUpperCase()}</Text>
                </View>
                <Text style={styles.payAmount}>+{'\u20B9'}{item.amount.toLocaleString()}</Text>
              </AnimatedPressable>
            </FadeInView>
          )}
        />
      )}

      <FAB icon="plus" style={styles.fab} onPress={() => setShow(true)} color="#FFF" customSize={56} />

      <Portal>
        <Modal visible={show} onDismiss={() => setShow(false)} contentContainerStyle={styles.modal}>
          <Text style={styles.modalTitle}>{'\u{1F4B3}'} Record Payment</Text>
          <View style={styles.modalForm}>
            <TextInput label="Member name" value={memberName} onChangeText={setMemberName} {...ip} />
            <TextInput label="Amount (\u20B9)" value={amount} onChangeText={setAmount} keyboardType="numeric" {...ip} />
            <Text style={styles.fieldLabel}>Method</Text>
            <SegmentedButtons
              value={method}
              onValueChange={setMethod}
              buttons={[{ value: 'cash', label: '\u{1F4B5} Cash' }, { value: 'upi', label: '\u{1F4F1} UPI' }, { value: 'card', label: '\u{1F4B3} Card' }]}
              theme={{ colors: { secondaryContainer: Colors.accentMuted, onSecondaryContainer: Colors.accent, onSurface: Colors.textMuted, outline: Colors.border } }}
            />
            <TextInput label="Note (optional)" value={note} onChangeText={setNote} {...ip} />
          </View>
          <View style={styles.modalActions}>
            <TouchableOpacity onPress={() => setShow(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
            <AnimatedPressable
              style={[styles.recordBtn, (!memberName.trim() || !amount.trim()) && { opacity: 0.4 }]}
              onPress={handleSave}
              disabled={saving || !memberName.trim() || !amount.trim()}
              scaleDown={0.95}
            >
              <Text style={styles.recordBtnText}>{saving ? 'Saving...' : '\u{2705} Record'}</Text>
            </AnimatedPressable>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  summary: { flexDirection: 'row', margin: 16, backgroundColor: Colors.bgCard, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: Colors.border },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryEmoji: { fontSize: 24, marginBottom: 6 },
  summaryLabel: { fontSize: 12, color: Colors.textMuted, marginBottom: 6 },
  summaryValue: { fontSize: 24, fontWeight: '700', color: Colors.text },
  summaryDivider: { width: 1, backgroundColor: Colors.border, marginHorizontal: 8 },

  list: { paddingHorizontal: 16, gap: 6, paddingBottom: 80 },
  payRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgCard, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border, minHeight: 68 },
  payIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.bgElevated, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  payIconEmoji: { fontSize: 18 },
  payInfo: { flex: 1 },
  payName: { fontSize: 15, fontWeight: '600', color: Colors.text },
  payMeta: { fontSize: 13, color: Colors.textMuted, marginTop: 3 },
  payAmount: { fontSize: 16, fontWeight: '700', color: Colors.green },

  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: Colors.textSub },
  emptyDesc: { fontSize: 14, color: Colors.textMuted, marginTop: 6 },

  fab: { position: 'absolute', right: 20, bottom: 20, backgroundColor: Colors.accent, borderRadius: 16 },

  modal: { backgroundColor: Colors.bgCard, margin: 24, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: Colors.border },
  modalTitle: { fontSize: 20, fontWeight: '700', color: Colors.text, marginBottom: 20 },
  modalForm: { gap: 14 },
  input: { backgroundColor: Colors.bgElevated },
  fieldLabel: { fontSize: 13, color: Colors.textMuted, fontWeight: '500' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 16, marginTop: 24 },
  cancelText: { fontSize: 15, color: Colors.textMuted, fontWeight: '500' },
  recordBtn: { backgroundColor: Colors.accent, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  recordBtnText: { fontSize: 15, fontWeight: '600', color: '#FFF' },
});
