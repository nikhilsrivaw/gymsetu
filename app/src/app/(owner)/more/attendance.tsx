import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Checkbox, Searchbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { Colors } from '@/constants/colors';
import AnimatedPressable from '@/components/AnimatedPressable';
import FadeInView from '@/components/FadeInView';

const mockMembers: { id: string; name: string }[] = [
  { id: '1', name: 'Rahul Sharma' },
  { id: '2', name: 'Priya Patel' },
  { id: '3', name: 'Arjun Reddy' },
  { id: '4', name: 'Sneha Gupta' },
  { id: '7', name: 'Neha Verma' },
  { id: '8', name: 'Rohan Das' },
  { id: '10', name: 'Suresh Nair' },
  { id: '11', name: 'Divya Menon' },
  { id: '13', name: 'Pooja Rao' },
  { id: '14', name: 'Karthik Iyer' },
  { id: '15', name: 'Meera Deshmukh' },
  { id: '16', name: 'Aditya Kulkarni' },
];

export default function AttendanceScreen() {
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });
  const [search, setSearch] = useState('');
  const [marked, setMarked] = useState<Set<string>>(new Set());

  const filtered = mockMembers.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()));

  const toggle = (id: string) => {
    setMarked((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  const toggleAll = () => {
    if (marked.size === filtered.length) setMarked(new Set());
    else setMarked(new Set(filtered.map((m) => m.id)));
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Attendance' }} />
      <View style={styles.container}>
        {/* Date bar */}
        <FadeInView delay={0}>
          <View style={styles.dateBar}>
            <View style={styles.dateLeft}>
              <Text style={styles.dateEmoji}>{'\u{1F4C5}'}</Text>
              <Text style={styles.dateText}>{today}</Text>
            </View>
            <View style={styles.counter}>
              <Text style={styles.counterNum}>{marked.size}</Text>
              <Text style={styles.counterSlash}>/{mockMembers.length}</Text>
              <Text style={styles.counterEmoji}> {'\u{2705}'}</Text>
            </View>
          </View>
        </FadeInView>

        <FadeInView delay={80}>
          <Searchbar
            placeholder="Search members..."
            value={search}
            onChangeText={setSearch}
            style={styles.searchbar}
            inputStyle={{ color: Colors.text, fontSize: 15 }}
            iconColor={Colors.textMuted}
            placeholderTextColor={Colors.textMuted}
            theme={{ colors: { onSurfaceVariant: Colors.textSub } }}
          />
        </FadeInView>

        {mockMembers.length > 0 && (
          <FadeInView delay={120}>
            <AnimatedPressable style={styles.bulkRow} onPress={toggleAll} scaleDown={0.98}>
              <Checkbox status={marked.size === filtered.length && filtered.length > 0 ? 'checked' : 'unchecked'} color={Colors.accent} uncheckedColor={Colors.textMuted} />
              <Text style={styles.bulkText}>{marked.size === filtered.length ? '\u{274C} Unmark all' : '\u{2705} Mark all present'}</Text>
            </AnimatedPressable>
          </FadeInView>
        )}

        {mockMembers.length === 0 ? (
          <FadeInView delay={200} style={styles.empty}>
            <Text style={styles.emptyEmoji}>{'\u{1F4CB}'}</Text>
            <Text style={styles.emptyTitle}>No members</Text>
            <Text style={styles.emptyDesc}>Add members first to mark attendance</Text>
          </FadeInView>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
            renderItem={({ item, index }) => (
              <FadeInView delay={index * 40}>
                <AnimatedPressable
                  style={[styles.memberRow, marked.has(item.id) && styles.memberRowChecked]}
                  onPress={() => toggle(item.id)}
                  scaleDown={0.98}
                >
                  <Checkbox status={marked.has(item.id) ? 'checked' : 'unchecked'} color={Colors.green} uncheckedColor={Colors.textMuted} />
                  <Text style={styles.memberName}>{item.name}</Text>
                  {marked.has(item.id) && <Text style={styles.checkEmoji}>{'\u{2705}'}</Text>}
                </AnimatedPressable>
              </FadeInView>
            )}
          />
        )}

        {marked.size > 0 && (
          <AnimatedPressable style={styles.saveBtn} scaleDown={0.97}>
            <Text style={styles.saveBtnText}>{'\u{1F4BE}'} Save Attendance ({marked.size})</Text>
          </AnimatedPressable>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  dateBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 16, marginTop: 8, marginBottom: 12, backgroundColor: Colors.bgCard, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.border },
  dateLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dateEmoji: { fontSize: 18 },
  dateText: { fontSize: 15, fontWeight: '600', color: Colors.text },
  counter: { flexDirection: 'row', alignItems: 'baseline' },
  counterNum: { fontSize: 20, fontWeight: '700', color: Colors.accent },
  counterSlash: { fontSize: 14, color: Colors.textMuted, fontWeight: '500' },
  counterEmoji: { fontSize: 14 },

  searchbar: { marginHorizontal: 16, marginBottom: 8, backgroundColor: Colors.bgCard, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, elevation: 0, height: 48 },
  bulkRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 4 },
  bulkText: { fontSize: 14, color: Colors.textSub, fontWeight: '500' },

  list: { paddingHorizontal: 16, gap: 4, paddingBottom: 80 },
  memberRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgCard, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 10, borderWidth: 1, borderColor: Colors.border, minHeight: 56 },
  memberRowChecked: { borderColor: Colors.green + '30', backgroundColor: Colors.green + '08' },
  memberName: { flex: 1, fontSize: 15, fontWeight: '500', color: Colors.text, marginLeft: 6 },
  checkEmoji: { fontSize: 16, marginRight: 4 },

  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: Colors.textSub },
  emptyDesc: { fontSize: 14, color: Colors.textMuted, marginTop: 6 },

  saveBtn: { position: 'absolute', bottom: 20, left: 20, right: 20, backgroundColor: Colors.green, borderRadius: 14, paddingVertical: 18, alignItems: 'center' },
  saveBtnText: { fontSize: 16, fontWeight: '600', color: '#000' },
});
