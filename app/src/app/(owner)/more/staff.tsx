import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Switch } from 'react-native';
import { FAB, Portal, Modal, TextInput } from 'react-native-paper';
import { Stack } from 'expo-router';
import { Colors } from '@/constants/colors';
import AnimatedPressable from '@/components/AnimatedPressable';
import FadeInView from '@/components/FadeInView';

interface StaffMember {
  id: string;
  name: string;
  phone: string;
  role: string;
  avatar: string;
  joinDate: string;
  permissions: {
    members: boolean;
    payments: boolean;
    attendance: boolean;
    reports: boolean;
    plans: boolean;
  };
}

const mockStaff: StaffMember[] = [
  {
    id: '1', name: 'Vikram Trainer', phone: '+919876543210', role: 'Head Trainer',
    avatar: '🏋️', joinDate: '15 Oct 2025',
    permissions: { members: true, payments: false, attendance: true, reports: true, plans: false },
  },
  {
    id: '2', name: 'Anita Sharma', phone: '+919812345678', role: 'Front Desk',
    avatar: '👩', joinDate: '02 Dec 2025',
    permissions: { members: true, payments: true, attendance: true, reports: false, plans: false },
  },
  {
    id: '3', name: 'Ravi Kumar', phone: '+919898765432', role: 'Trainer',
    avatar: '💪', joinDate: '10 Jan 2026',
    permissions: { members: false, payments: false, attendance: true, reports: false, plans: false },
  },
];

const permLabels: { key: keyof StaffMember['permissions']; label: string; emoji: string }[] = [
  { key: 'members', label: 'Manage Members', emoji: '👥' },
  { key: 'payments', label: 'Record Payments', emoji: '💳' },
  { key: 'attendance', label: 'Mark Attendance', emoji: '📋' },
  { key: 'reports', label: 'View Reports', emoji: '📊' },
  { key: 'plans', label: 'Manage Plans', emoji: '📝' },
];

export default function StaffScreen() {
  const [staff] = useState(mockStaff);
  const [show, setShow] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('');
  const [perms, setPerms] = useState({ members: false, payments: false, attendance: true, reports: false, plans: false });
  const [saving, setSaving] = useState(false);

  const ip = { mode: 'outlined' as const, style: styles.input, outlineColor: Colors.border, activeOutlineColor: Colors.accent, textColor: Colors.text, theme: { colors: { onSurfaceVariant: Colors.textSub } } };

  const handleAdd = () => {
    if (!name.trim() || !phone.trim()) return;
    setSaving(true);
    setTimeout(() => { setSaving(false); setShow(false); setName(''); setPhone(''); setRole(''); }, 400);
  };

  const openDetail = (s: StaffMember) => {
    setSelectedStaff(s);
  };

  const activePerms = (p: StaffMember['permissions']) =>
    Object.values(p).filter(Boolean).length;

  return (
    <>
      <Stack.Screen options={{ title: '👨‍💼 Staff Management' }} />
      <View style={styles.container}>
        {/* Summary */}
        <FadeInView delay={0}>
          <View style={styles.summary}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryEmoji}>👨‍💼</Text>
              <Text style={styles.summaryLabel}>Total Staff</Text>
              <Text style={styles.summaryValue}>{staff.length}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryEmoji}>✅</Text>
              <Text style={styles.summaryLabel}>Active</Text>
              <Text style={styles.summaryValue}>{staff.length}</Text>
            </View>
          </View>
        </FadeInView>

        {staff.length === 0 ? (
          <FadeInView delay={150} style={styles.empty}>
            <Text style={styles.emptyEmoji}>👨‍💼</Text>
            <Text style={styles.emptyTitle}>No staff added yet</Text>
            <Text style={styles.emptyDesc}>Tap + to add your first team member</Text>
          </FadeInView>
        ) : (
          <FlatList
            data={staff}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
            renderItem={({ item, index }) => (
              <FadeInView delay={100 + index * 60}>
                <AnimatedPressable style={styles.staffRow} scaleDown={0.98} onPress={() => openDetail(item)}>
                  <View style={styles.avatarWrap}>
                    <Text style={styles.avatarEmoji}>{item.avatar}</Text>
                  </View>
                  <View style={styles.staffInfo}>
                    <Text style={styles.staffName}>{item.name}</Text>
                    <Text style={styles.staffRole}>{item.role}</Text>
                    <Text style={styles.staffMeta}>Since {item.joinDate} · {activePerms(item.permissions)} permissions</Text>
                  </View>
                  <View style={styles.permBadge}>
                    <Text style={styles.permBadgeText}>{activePerms(item.permissions)}/5</Text>
                  </View>
                </AnimatedPressable>
              </FadeInView>
            )}
          />
        )}

        <FAB icon="plus" style={styles.fab} onPress={() => setShow(true)} color="#FFF" customSize={56} />

        {/* Add Staff Modal */}
        <Portal>
          <Modal visible={show} onDismiss={() => setShow(false)} contentContainerStyle={styles.modal}>
            <Text style={styles.modalTitle}>➕ Add Staff Member</Text>
            <View style={styles.modalForm}>
              <TextInput label="Full name" value={name} onChangeText={setName} {...ip} />
              <TextInput label="Phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" {...ip} />
              <TextInput label="Role (e.g., Trainer)" value={role} onChangeText={setRole} {...ip} />

              <Text style={styles.permTitle}>🔐 Permissions</Text>
              {permLabels.map(p => (
                <View key={p.key} style={styles.permRow}>
                  <Text style={styles.permEmoji}>{p.emoji}</Text>
                  <Text style={styles.permLabel}>{p.label}</Text>
                  <Switch
                    value={perms[p.key]}
                    onValueChange={v => setPerms(prev => ({ ...prev, [p.key]: v }))}
                    trackColor={{ false: Colors.bgInput, true: Colors.accentSoft }}
                    thumbColor={perms[p.key] ? Colors.accent : Colors.textMuted}
                  />
                </View>
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setShow(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
              <AnimatedPressable
                style={[styles.recordBtn, (!name.trim() || !phone.trim()) && { opacity: 0.4 }]}
                onPress={handleAdd}
                disabled={saving || !name.trim() || !phone.trim()}
                scaleDown={0.95}
              >
                <Text style={styles.recordBtnText}>{saving ? 'Adding...' : '✅ Add Staff'}</Text>
              </AnimatedPressable>
            </View>
          </Modal>
        </Portal>

        {/* Staff Detail Modal */}
        <Portal>
          <Modal visible={!!selectedStaff} onDismiss={() => setSelectedStaff(null)} contentContainerStyle={styles.modal}>
            {selectedStaff && (
              <>
                <View style={styles.detailHeader}>
                  <Text style={styles.detailAvatar}>{selectedStaff.avatar}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailName}>{selectedStaff.name}</Text>
                    <Text style={styles.detailRole}>{selectedStaff.role} · Since {selectedStaff.joinDate}</Text>
                  </View>
                </View>
                <Text style={styles.detailPhone}>📞 {selectedStaff.phone}</Text>

                <Text style={styles.permTitle}>🔐 Permissions</Text>
                {permLabels.map(p => (
                  <View key={p.key} style={styles.permRow}>
                    <Text style={styles.permEmoji}>{p.emoji}</Text>
                    <Text style={styles.permLabel}>{p.label}</Text>
                    <View style={[styles.statusDot, { backgroundColor: selectedStaff.permissions[p.key] ? Colors.green : Colors.red }]} />
                    <Text style={[styles.statusText, { color: selectedStaff.permissions[p.key] ? Colors.green : Colors.textMuted }]}>
                      {selectedStaff.permissions[p.key] ? 'Yes' : 'No'}
                    </Text>
                  </View>
                ))}

                <View style={styles.modalActions}>
                  <AnimatedPressable style={styles.editBtn} scaleDown={0.95} onPress={() => setSelectedStaff(null)}>
                    <Text style={styles.editBtnText}>✏️ Edit</Text>
                  </AnimatedPressable>
                  <AnimatedPressable style={styles.removeBtn} scaleDown={0.95} onPress={() => setSelectedStaff(null)}>
                    <Text style={styles.removeBtnText}>🗑️ Remove</Text>
                  </AnimatedPressable>
                </View>
              </>
            )}
          </Modal>
        </Portal>
      </View>
    </>
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

  list: { paddingHorizontal: 16, gap: 8, paddingBottom: 80 },
  staffRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgCard, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border },
  avatarWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.accentMuted, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarEmoji: { fontSize: 22 },
  staffInfo: { flex: 1 },
  staffName: { fontSize: 15, fontWeight: '600', color: Colors.text },
  staffRole: { fontSize: 13, color: Colors.accent, fontWeight: '500', marginTop: 1 },
  staffMeta: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  permBadge: { backgroundColor: Colors.accentMuted, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  permBadgeText: { fontSize: 12, fontWeight: '700', color: Colors.accent },

  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: Colors.textSub },
  emptyDesc: { fontSize: 14, color: Colors.textMuted, marginTop: 6 },

  fab: { position: 'absolute', right: 20, bottom: 20, backgroundColor: Colors.accent, borderRadius: 16 },

  modal: { backgroundColor: Colors.bgCard, margin: 24, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: Colors.border, maxHeight: '85%' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: Colors.text, marginBottom: 16 },
  modalForm: { gap: 10 },
  input: { backgroundColor: Colors.bgElevated },
  permTitle: { fontSize: 14, fontWeight: '600', color: Colors.textSub, marginTop: 8 },
  permRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 8 },
  permEmoji: { fontSize: 16, width: 24 },
  permLabel: { flex: 1, fontSize: 14, color: Colors.text },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 12, marginTop: 20 },
  cancelText: { fontSize: 15, color: Colors.textMuted, fontWeight: '500' },
  recordBtn: { backgroundColor: Colors.accent, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  recordBtnText: { fontSize: 15, fontWeight: '600', color: '#FFF' },

  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  detailAvatar: { fontSize: 36 },
  detailName: { fontSize: 18, fontWeight: '700', color: Colors.text },
  detailRole: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  detailPhone: { fontSize: 14, color: Colors.textSub, marginBottom: 12 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 13, fontWeight: '500', width: 28 },
  editBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: Colors.accentMuted, alignItems: 'center' },
  editBtnText: { fontSize: 14, fontWeight: '600', color: Colors.accent },
  removeBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: Colors.redMuted, alignItems: 'center' },
  removeBtnText: { fontSize: 14, fontWeight: '600', color: Colors.red },
});
