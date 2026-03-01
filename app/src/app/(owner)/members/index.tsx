import { useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Searchbar, FAB } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { Colors } from '@/constants/colors';
import AnimatedPressable from '@/components/AnimatedPressable';
import FadeInView from '@/components/FadeInView';
import type { MemberStatus } from '@/types/database';

type FilterType = 'all' | 'active' | 'expired' | 'suspended';

const filters: { label: string; value: FilterType; emoji: string }[] = [
  { label: 'All', value: 'all', emoji: '\u{1F465}' },
  { label: 'Active', value: 'active', emoji: '\u{2705}' },
  { label: 'Expired', value: 'expired', emoji: '\u{1F534}' },
  { label: 'Suspended', value: 'suspended', emoji: '\u{23F8}\u{FE0F}' },
];

const statusColors: Record<MemberStatus, string> = {
  active: Colors.green,
  expired: Colors.red,
  suspended: Colors.orange,
  inactive: Colors.textMuted,
};

const mockMembers: {
  id: string;
  full_name: string;
  phone: string;
  status: MemberStatus;
  plan_name: string;
  expiry_date: string;
}[] = [
  { id: '1', full_name: 'Rahul Sharma', phone: '+919876543210', status: 'active', plan_name: '3 Month', expiry_date: '15 Apr 2026' },
  { id: '2', full_name: 'Priya Patel', phone: '+919812345678', status: 'active', plan_name: '6 Month', expiry_date: '20 Jun 2026' },
  { id: '3', full_name: 'Arjun Reddy', phone: '+919898765432', status: 'active', plan_name: '1 Year', expiry_date: '10 Dec 2026' },
  { id: '4', full_name: 'Sneha Gupta', phone: '+919845612378', status: 'active', plan_name: '1 Month', expiry_date: '05 Mar 2026' },
  { id: '5', full_name: 'Vikram Singh', phone: '+919867543120', status: 'expired', plan_name: '3 Month', expiry_date: '28 Feb 2026' },
  { id: '6', full_name: 'Amit Kumar', phone: '+919823456789', status: 'expired', plan_name: '1 Month', expiry_date: '25 Feb 2026' },
  { id: '7', full_name: 'Neha Verma', phone: '+919834567890', status: 'active', plan_name: '3 Month', expiry_date: '18 May 2026' },
  { id: '8', full_name: 'Rohan Das', phone: '+919845678901', status: 'active', plan_name: '6 Month', expiry_date: '22 Jul 2026' },
  { id: '9', full_name: 'Kavita Joshi', phone: '+919856789012', status: 'suspended', plan_name: '1 Month', expiry_date: '10 Mar 2026' },
  { id: '10', full_name: 'Suresh Nair', phone: '+919867890123', status: 'active', plan_name: '1 Year', expiry_date: '01 Jan 2027' },
  { id: '11', full_name: 'Divya Menon', phone: '+919878901234', status: 'active', plan_name: '3 Month', expiry_date: '30 Apr 2026' },
  { id: '12', full_name: 'Manish Tiwari', phone: '+919889012345', status: 'expired', plan_name: '1 Month', expiry_date: '20 Feb 2026' },
];

export default function MembersListScreen() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const router = useRouter();

  const filtered = mockMembers.filter((m) => {
    const matchesSearch = m.full_name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || m.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <>
      <Stack.Screen options={{ title: 'Members' }} />
      <View style={styles.container}>
        {/* Search */}
        <FadeInView delay={0}>
          <Searchbar
            placeholder="Search by name or phone..."
            value={search}
            onChangeText={setSearch}
            style={styles.searchbar}
            inputStyle={{ color: Colors.text, fontSize: 15 }}
            iconColor={Colors.textMuted}
            placeholderTextColor={Colors.textMuted}
            theme={{ colors: { onSurfaceVariant: Colors.textSub } }}
          />
        </FadeInView>

        {/* Filters */}
        <FadeInView delay={80}>
          <View style={styles.filterRow}>
            {filters.map((f) => (
              <AnimatedPressable
                key={f.value}
                onPress={() => setFilter(f.value)}
                style={[styles.filterChip, filter === f.value && styles.filterChipActive]}
                scaleDown={0.94}
              >
                <Text style={styles.filterEmoji}>{f.emoji}</Text>
                <Text style={[styles.filterText, filter === f.value && styles.filterTextActive]}>{f.label}</Text>
              </AnimatedPressable>
            ))}
          </View>
        </FadeInView>

        {/* List or Empty */}
        {filtered.length === 0 ? (
          <FadeInView delay={200} style={styles.empty}>
            <Text style={styles.emptyEmoji}>{'\u{1F3CB}\u{FE0F}'}</Text>
            <Text style={styles.emptyTitle}>
              {mockMembers.length === 0 ? 'No members yet' : 'No results'}
            </Text>
            <Text style={styles.emptyDesc}>
              {mockMembers.length === 0 ? 'Tap + to add your first member' : 'Try adjusting your search or filter'}
            </Text>
          </FadeInView>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
            renderItem={({ item, index }) => (
              <FadeInView delay={index * 50}>
                <AnimatedPressable
                  style={styles.row}
                  scaleDown={0.98}
                  onPress={() => router.push(`/(owner)/members/${item.id}`)}
                >
                  {/* Initials */}
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {item.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  {/* Info */}
                  <View style={styles.rowInfo}>
                    <Text style={styles.rowName}>{item.full_name}</Text>
                    <Text style={styles.rowMeta}>{item.plan_name}  {'\u2022'}  Exp {item.expiry_date}</Text>
                  </View>
                  {/* Status */}
                  <View style={[styles.statusPill, { backgroundColor: statusColors[item.status] + '18' }]}>
                    <View style={[styles.statusDot, { backgroundColor: statusColors[item.status] }]} />
                    <Text style={[styles.statusLabel, { color: statusColors[item.status] }]}>{item.status}</Text>
                  </View>
                </AnimatedPressable>
              </FadeInView>
            )}
          />
        )}

        <FAB icon="plus" style={styles.fab} onPress={() => router.push('/(owner)/members/add')} color="#FFF" customSize={56} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  searchbar: { marginHorizontal: 16, marginTop: 8, marginBottom: 12, backgroundColor: Colors.bgCard, borderRadius: 14, elevation: 0, borderWidth: 1, borderColor: Colors.border, height: 50 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border },
  filterChipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  filterEmoji: { fontSize: 13 },
  filterText: { fontSize: 13, fontWeight: '500', color: Colors.textMuted },
  filterTextActive: { color: '#FFF', fontWeight: '600' },

  list: { paddingHorizontal: 16, paddingBottom: 80, gap: 6 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 72,
  },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.bgElevated, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 14, fontWeight: '600', color: Colors.textSub },
  rowInfo: { flex: 1, marginLeft: 14 },
  rowName: { fontSize: 16, fontWeight: '600', color: Colors.text },
  rowMeta: { fontSize: 13, color: Colors.textMuted, marginTop: 3 },
  statusPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, gap: 5 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusLabel: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },

  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: Colors.textSub },
  emptyDesc: { fontSize: 14, color: Colors.textMuted, marginTop: 6, textAlign: 'center', paddingHorizontal: 40 },

  fab: { position: 'absolute', right: 20, bottom: 20, backgroundColor: Colors.accent, borderRadius: 16 },
});
