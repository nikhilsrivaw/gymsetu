import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { FAB, Portal, Modal, TextInput } from 'react-native-paper';
import { Stack } from 'expo-router';
import { Colors } from '@/constants/colors';
import AnimatedPressable from '@/components/AnimatedPressable';
import FadeInView from '@/components/FadeInView';

interface Announcement {
  id: string;
  title: string;
  body: string;
  category: string;
  emoji: string;
  date: string;
  readCount: number;
  totalMembers: number;
}

const mockAnnouncements: Announcement[] = [
  {
    id: '1', title: 'Gym Closed on Holi', body: 'The gym will remain closed on 14th March for Holi. Happy Holi to all members! 🎨',
    category: 'Holiday', emoji: '🎉', date: '28 Feb 2026', readCount: 112, totalMembers: 148,
  },
  {
    id: '2', title: 'New Zumba Batch Starting', body: 'We are launching a new Zumba batch starting 5th March. Evening 6-7 PM. Limited 20 seats. Register at the front desk.',
    category: 'Class', emoji: '💃', date: '25 Feb 2026', readCount: 87, totalMembers: 148,
  },
  {
    id: '3', title: 'Maintenance: Steam Room', body: 'The steam room will be under maintenance from 1st to 3rd March. Sorry for the inconvenience.',
    category: 'Maintenance', emoji: '🔧', date: '22 Feb 2026', readCount: 95, totalMembers: 148,
  },
  {
    id: '4', title: 'February Fitness Challenge Winners', body: 'Congratulations to Rahul, Priya, and Arjun for completing the 30-day challenge! Come collect your prizes.',
    category: 'Event', emoji: '🏆', date: '20 Feb 2026', readCount: 134, totalMembers: 148,
  },
  {
    id: '5', title: 'Renewal Offer: 20% Off', body: 'Renew your membership this week and get 20% off on 3-month and 6-month plans. Offer valid till 28 Feb.',
    category: 'Offer', emoji: '🔥', date: '18 Feb 2026', readCount: 141, totalMembers: 148,
  },
];

const categories = [
  { label: 'General', emoji: '📢' },
  { label: 'Holiday', emoji: '🎉' },
  { label: 'Class', emoji: '💃' },
  { label: 'Maintenance', emoji: '🔧' },
  { label: 'Event', emoji: '🏆' },
  { label: 'Offer', emoji: '🔥' },
];

export default function AnnouncementsScreen() {
  const [announcements] = useState(mockAnnouncements);
  const [show, setShow] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [selectedCat, setSelectedCat] = useState('General');
  const [saving, setSaving] = useState(false);

  const ip = { mode: 'outlined' as const, style: styles.input, outlineColor: Colors.border, activeOutlineColor: Colors.accent, textColor: Colors.text, theme: { colors: { onSurfaceVariant: Colors.textSub } } };

  const handleSend = () => {
    if (!title.trim() || !body.trim()) return;
    setSaving(true);
    setTimeout(() => { setSaving(false); setShow(false); setTitle(''); setBody(''); setSelectedCat('General'); }, 400);
  };

  const getCatColor = (cat: string) => {
    const map: Record<string, string> = { Holiday: Colors.orange, Class: '#EC4899', Maintenance: Colors.textSub, Event: Colors.accent, Offer: Colors.red, General: Colors.green };
    return map[cat] || Colors.accent;
  };

  return (
    <>
      <Stack.Screen options={{ title: '📢 Announcements' }} />
      <View style={styles.container}>
        {/* Stats */}
        <FadeInView delay={0}>
          <View style={styles.statsBar}>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{announcements.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statDot} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>148</Text>
              <Text style={styles.statLabel}>Recipients</Text>
            </View>
            <View style={styles.statDot} />
            <View style={styles.statItem}>
              <Text style={[styles.statNum, { color: Colors.green }]}>92%</Text>
              <Text style={styles.statLabel}>Avg Read</Text>
            </View>
          </View>
        </FadeInView>

        <FlatList
          data={announcements}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => {
            const readPercent = Math.round((item.readCount / item.totalMembers) * 100);
            const catColor = getCatColor(item.category);

            return (
              <FadeInView delay={100 + index * 60}>
                <AnimatedPressable style={styles.card} scaleDown={0.98}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardEmoji}>{item.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitle}>{item.title}</Text>
                      <View style={styles.metaRow}>
                        <View style={[styles.catBadge, { backgroundColor: catColor + '18' }]}>
                          <Text style={[styles.catText, { color: catColor }]}>{item.category}</Text>
                        </View>
                        <Text style={styles.dateText}>{item.date}</Text>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.cardBody} numberOfLines={2}>{item.body}</Text>
                  <View style={styles.readBar}>
                    <View style={styles.readTrack}>
                      <View style={[styles.readFill, { width: `${readPercent}%`, backgroundColor: catColor }]} />
                    </View>
                    <Text style={styles.readText}>{item.readCount}/{item.totalMembers} read ({readPercent}%)</Text>
                  </View>
                </AnimatedPressable>
              </FadeInView>
            );
          }}
        />

        <FAB icon="plus" style={styles.fab} onPress={() => setShow(true)} color="#FFF" customSize={56} />

        {/* Compose Modal */}
        <Portal>
          <Modal visible={show} onDismiss={() => setShow(false)} contentContainerStyle={styles.modal}>
            <Text style={styles.modalTitle}>📝 New Announcement</Text>
            <View style={styles.modalForm}>
              <TextInput label="Title" value={title} onChangeText={setTitle} {...ip} />
              <TextInput label="Message" value={body} onChangeText={setBody} multiline numberOfLines={4} {...ip} />

              <Text style={styles.fieldLabel}>Category</Text>
              <View style={styles.catGrid}>
                {categories.map(c => (
                  <AnimatedPressable
                    key={c.label}
                    style={[styles.catChip, selectedCat === c.label && styles.catChipActive]}
                    scaleDown={0.95}
                    onPress={() => setSelectedCat(c.label)}
                  >
                    <Text style={styles.catChipEmoji}>{c.emoji}</Text>
                    <Text style={[styles.catChipText, selectedCat === c.label && styles.catChipTextActive]}>{c.label}</Text>
                  </AnimatedPressable>
                ))}
              </View>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setShow(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
              <AnimatedPressable
                style={[styles.sendBtn, (!title.trim() || !body.trim()) && { opacity: 0.4 }]}
                onPress={handleSend}
                disabled={saving || !title.trim() || !body.trim()}
                scaleDown={0.95}
              >
                <Text style={styles.sendBtnText}>{saving ? 'Sending...' : '📤 Send to All'}</Text>
              </AnimatedPressable>
            </View>
          </Modal>
        </Portal>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  statsBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', margin: 16, backgroundColor: Colors.bgCard, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.border, gap: 16 },
  statItem: { alignItems: 'center' },
  statNum: { fontSize: 18, fontWeight: '700', color: Colors.text },
  statLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  statDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.border },

  list: { paddingHorizontal: 16, gap: 10, paddingBottom: 80 },
  card: { backgroundColor: Colors.bgCard, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border, gap: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cardEmoji: { fontSize: 28, marginTop: 2 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  catBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  catText: { fontSize: 11, fontWeight: '600' },
  dateText: { fontSize: 11, color: Colors.textMuted },
  cardBody: { fontSize: 13, color: Colors.textSub, lineHeight: 19 },
  readBar: { gap: 4 },
  readTrack: { height: 4, borderRadius: 2, backgroundColor: Colors.bgInput, overflow: 'hidden' },
  readFill: { height: 4, borderRadius: 2 },
  readText: { fontSize: 11, color: Colors.textMuted },

  fab: { position: 'absolute', right: 20, bottom: 20, backgroundColor: Colors.accent, borderRadius: 16 },

  modal: { backgroundColor: Colors.bgCard, margin: 24, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: Colors.border, maxHeight: '85%' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: Colors.text, marginBottom: 16 },
  modalForm: { gap: 12 },
  input: { backgroundColor: Colors.bgElevated },
  fieldLabel: { fontSize: 13, color: Colors.textMuted, fontWeight: '500' },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: Colors.bgInput, borderWidth: 1, borderColor: Colors.border },
  catChipActive: { backgroundColor: Colors.accentMuted, borderColor: Colors.accent },
  catChipEmoji: { fontSize: 14 },
  catChipText: { fontSize: 12, fontWeight: '500', color: Colors.textMuted },
  catChipTextActive: { color: Colors.accent, fontWeight: '600' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 16, marginTop: 20 },
  cancelText: { fontSize: 15, color: Colors.textMuted, fontWeight: '500' },
  sendBtn: { backgroundColor: Colors.accent, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  sendBtnText: { fontSize: 15, fontWeight: '600', color: '#FFF' },
});
