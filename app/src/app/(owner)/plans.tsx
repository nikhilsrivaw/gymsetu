import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { FAB, Portal, Modal, TextInput } from 'react-native-paper';
import { Colors } from '@/constants/colors';
import AnimatedPressable from '@/components/AnimatedPressable';
import FadeInView from '@/components/FadeInView';
import type { MembershipPlan } from '@/types/database';

const mockPlans: (MembershipPlan & { member_count?: number })[] = [
  { id: '1', gym_id: 'g1', name: '1 Month Basic', duration_days: 30, price: 1500, description: 'Access to gym floor and basic equipment', is_active: true, created_at: '2025-09-01', member_count: 28 },
  { id: '2', gym_id: 'g1', name: '3 Month Standard', duration_days: 90, price: 3500, description: 'Full gym access with locker facility', is_active: true, created_at: '2025-09-01', member_count: 45 },
  { id: '3', gym_id: 'g1', name: '6 Month Premium', duration_days: 180, price: 6000, description: 'Full access + personal trainer 2x/week', is_active: true, created_at: '2025-09-01', member_count: 32 },
  { id: '4', gym_id: 'g1', name: '1 Year Ultimate', duration_days: 365, price: 10000, description: 'All-inclusive: gym, trainer, supplements, steam', is_active: true, created_at: '2025-09-01', member_count: 18 },
  { id: '5', gym_id: 'g1', name: 'Day Pass', duration_days: 1, price: 200, description: 'Single day access for walk-ins', is_active: true, created_at: '2025-10-15', member_count: 5 },
];

export default function PlansScreen() {
  const [plans] = useState(mockPlans);
  const [show, setShow] = useState(false);
  const [name, setName] = useState('');
  const [dur, setDur] = useState('');
  const [price, setPrice] = useState('');
  const [desc, setDesc] = useState('');
  const [saving, setSaving] = useState(false);

  const ip = { mode: 'outlined' as const, style: styles.input, outlineColor: Colors.border, activeOutlineColor: Colors.accent, textColor: Colors.text, theme: { colors: { onSurfaceVariant: Colors.textSub } } };

  const handleSave = () => {
    if (!name.trim() || !dur.trim() || !price.trim()) return;
    setSaving(true);
    setTimeout(() => { setSaving(false); setShow(false); setName(''); setDur(''); setPrice(''); setDesc(''); }, 400);
  };

  const fmtDur = (d: number) => d >= 365 ? `${Math.round(d / 365)}y` : d >= 30 ? `${Math.round(d / 30)}mo` : `${d}d`;

  return (
    <View style={styles.container}>
      {plans.length === 0 ? (
        <FadeInView delay={100} style={styles.empty}>
          <Text style={styles.emptyEmoji}>{'\u{1F4CB}'}</Text>
          <Text style={styles.emptyTitle}>No plans yet</Text>
          <Text style={styles.emptyDesc}>Create membership plans to get started</Text>
        </FadeInView>
      ) : (
        <FlatList
          data={plans}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <FadeInView delay={index * 60}>
              <AnimatedPressable style={styles.planRow} scaleDown={0.98}>
                <View style={styles.planLeft}>
                  <View style={styles.planNameRow}>
                    <Text style={styles.planEmoji}>{'\u{1F3AB}'}</Text>
                    <Text style={styles.planName}>{item.name}</Text>
                  </View>
                  <View style={styles.planMeta}>
                    <Text style={styles.planDuration}>{'\u{1F552}'} {fmtDur(item.duration_days)}</Text>
                    {item.member_count !== undefined && (
                      <Text style={styles.planMembers}>{'\u2022'} {'\u{1F465}'} {item.member_count}</Text>
                    )}
                  </View>
                </View>
                <View style={styles.planRight}>
                  <Text style={styles.planPrice}>{'\u20B9'}{item.price.toLocaleString()}</Text>
                  <View style={[styles.dot, { backgroundColor: item.is_active ? Colors.green : Colors.textMuted }]} />
                </View>
              </AnimatedPressable>
            </FadeInView>
          )}
        />
      )}

      <FAB icon="plus" style={styles.fab} onPress={() => setShow(true)} color="#FFF" customSize={56} />

      <Portal>
        <Modal visible={show} onDismiss={() => setShow(false)} contentContainerStyle={styles.modal}>
          <Text style={styles.modalTitle}>{'\u{2728}'} New Plan</Text>
          <View style={styles.modalForm}>
            <TextInput label="Plan name" value={name} onChangeText={setName} {...ip} />
            <View style={styles.row}>
              <TextInput label="Duration (days)" value={dur} onChangeText={setDur} keyboardType="numeric" {...ip} style={[styles.input, { flex: 1 }]} />
              <TextInput label="Price (\u20B9)" value={price} onChangeText={setPrice} keyboardType="numeric" {...ip} style={[styles.input, { flex: 1 }]} />
            </View>
            <TextInput label="Description (optional)" value={desc} onChangeText={setDesc} multiline {...ip} />
          </View>
          <View style={styles.modalActions}>
            <TouchableOpacity onPress={() => setShow(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
            <AnimatedPressable
              style={[styles.createBtn, (!name.trim() || !dur.trim() || !price.trim()) && { opacity: 0.4 }]}
              onPress={handleSave}
              disabled={saving || !name.trim() || !dur.trim() || !price.trim()}
              scaleDown={0.95}
            >
              <Text style={styles.createBtnText}>{saving ? 'Creating...' : '\u{2705} Create'}</Text>
            </AnimatedPressable>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  list: { padding: 16, gap: 8 },
  planRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.bgCard, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.border, minHeight: 72 },
  planLeft: { flex: 1 },
  planNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  planEmoji: { fontSize: 16 },
  planName: { fontSize: 16, fontWeight: '600', color: Colors.text },
  planMeta: { flexDirection: 'row', gap: 6, marginTop: 4, marginLeft: 24 },
  planDuration: { fontSize: 13, color: Colors.textMuted, fontWeight: '500' },
  planMembers: { fontSize: 13, color: Colors.textMuted },
  planRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  planPrice: { fontSize: 18, fontWeight: '700', color: Colors.accent },
  dot: { width: 8, height: 8, borderRadius: 4 },

  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: Colors.textSub },
  emptyDesc: { fontSize: 14, color: Colors.textMuted, marginTop: 6 },

  fab: { position: 'absolute', right: 20, bottom: 20, backgroundColor: Colors.accent, borderRadius: 16 },

  modal: { backgroundColor: Colors.bgCard, margin: 24, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: Colors.border },
  modalTitle: { fontSize: 20, fontWeight: '700', color: Colors.text, marginBottom: 20 },
  modalForm: { gap: 14 },
  input: { backgroundColor: Colors.bgElevated },
  row: { flexDirection: 'row', gap: 12 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 16, marginTop: 24 },
  cancelText: { fontSize: 15, color: Colors.textMuted, fontWeight: '500' },
  createBtn: { backgroundColor: Colors.accent, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  createBtnText: { fontSize: 15, fontWeight: '600', color: '#FFF' },
});
