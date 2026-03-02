 import { useState } from 'react';              
  import { View, Text, StyleSheet, FlatList } from 'react-native';
  import { Searchbar, FAB } from 'react-native-paper';                                 import { useRouter, Stack } from 'expo-router';
  import { Colors } from '@/constants/colors';                                       
  import { Fonts } from '@/constants/fonts';                                           import AnimatedPressable from '@/components/AnimatedPressable';                    
  import FadeInView from '@/components/FadeInView';                                  
  import type { MemberStatus } from '@/types/database';                            

  type FilterType = 'all' | 'active' | 'expired' | 'suspended';

  const filters: { label: string; value: FilterType }[] = [
    { label: 'ALL',       value: 'all'       },
    { label: 'ACTIVE',    value: 'active'    },
    { label: 'EXPIRED',   value: 'expired'   },
    { label: 'SUSPENDED', value: 'suspended' },
  ];

  const statusColors: Record<MemberStatus, string> = {
    active:   Colors.green,
    expired:  Colors.red,
    suspended:Colors.orange,
    inactive: Colors.textMuted,
  };

  const mockMembers: {
    id: string; full_name: string; phone: string;
    status: MemberStatus; plan_name: string; expiry_date: string;
  }[] = [
    { id: '1',  full_name: 'Rahul Sharma',   phone: '+919876543210', status:
  'active',    plan_name: '3 Month',  expiry_date: '15 Apr 2026' },
    { id: '2',  full_name: 'Priya Patel',    phone: '+919812345678', status:
  'active',    plan_name: '6 Month',  expiry_date: '20 Jun 2026' },
    { id: '3',  full_name: 'Arjun Reddy',    phone: '+919898765432', status:
  'active',    plan_name: '1 Year',   expiry_date: '10 Dec 2026' },
    { id: '4',  full_name: 'Sneha Gupta',    phone: '+919845612378', status:
  'active',    plan_name: '1 Month',  expiry_date: '05 Mar 2026' },
    { id: '5',  full_name: 'Vikram Singh',   phone: '+919867543120', status:
  'expired',   plan_name: '3 Month',  expiry_date: '28 Feb 2026' },
    { id: '6',  full_name: 'Amit Kumar',     phone: '+919823456789', status:
  'expired',   plan_name: '1 Month',  expiry_date: '25 Feb 2026' },
    { id: '7',  full_name: 'Neha Verma',     phone: '+919834567890', status:
  'active',    plan_name: '3 Month',  expiry_date: '18 May 2026' },
    { id: '8',  full_name: 'Rohan Das',      phone: '+919845678901', status:
  'active',    plan_name: '6 Month',  expiry_date: '22 Jul 2026' },
    { id: '9',  full_name: 'Kavita Joshi',   phone: '+919856789012', status:
  'suspended', plan_name: '1 Month',  expiry_date: '10 Mar 2026' },
    { id: '10', full_name: 'Suresh Nair',    phone: '+919867890123', status:
  'active',    plan_name: '1 Year',   expiry_date: '01 Jan 2027' },
    { id: '11', full_name: 'Divya Menon',    phone: '+919878901234', status:
  'active',    plan_name: '3 Month',  expiry_date: '30 Apr 2026' },
    { id: '12', full_name: 'Manish Tiwari',  phone: '+919889012345', status:
  'expired',   plan_name: '1 Month',  expiry_date: '20 Feb 2026' },
  ];

  export default function MembersListScreen() {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<FilterType>('all');
    const router = useRouter();

    const filtered = mockMembers.filter(m => {
      const matchSearch = m.full_name.toLowerCase().includes(search.toLowerCase());  
      const matchFilter = filter === 'all' || m.status === filter;
      return matchSearch && matchFilter;
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
              inputStyle={{ color: Colors.text, fontSize: 14, fontFamily:
  Fonts.regular }}
              iconColor={Colors.textMuted}
              placeholderTextColor={Colors.textMuted}
              theme={{ colors: { onSurfaceVariant: Colors.textMuted } }}
            />
          </FadeInView>

          {/* Filters */}
          <FadeInView delay={60}>
            <View style={styles.filterRow}>
              {filters.map(f => (
                <AnimatedPressable
                  key={f.value}
                  onPress={() => setFilter(f.value)}
                  style={[styles.filterChip, filter === f.value &&
  styles.filterChipActive]}
                  scaleDown={0.94}
                >
                  <Text style={[styles.filterText, filter === f.value &&
  styles.filterTextActive]}>
                    {f.label}
                  </Text>
                </AnimatedPressable>
              ))}
            </View>
          </FadeInView>

          {/* Count */}
          <Text style={styles.countLabel}>
            {filtered.length} MEMBER{filtered.length !== 1 ? 'S' : ''}
          </Text>

          {/* List */}
          {filtered.length === 0 ? (
            <FadeInView delay={200} style={styles.empty}>
              <Text style={styles.emptyEmoji}>🏋️</Text>
              <Text style={styles.emptyTitle}>No members found</Text>
              <Text style={styles.emptyDesc}>Try adjusting your search or
  filter</Text>
            </FadeInView>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.list}
              renderItem={({ item, index }) => {
                const color = statusColors[item.status];
                const initials = item.full_name.split(' ').map(n =>
  n[0]).join('').slice(0, 2).toUpperCase();
                return (
                  <FadeInView delay={index * 45}>
                    <AnimatedPressable
                      style={styles.row}
                      scaleDown={0.98}
                      onPress={() => router.push(`/(owner)/members/${item.id}`)}     
                    >
                      {/* left status bar */}
                      <View style={[styles.statusBar, { backgroundColor: color }]} />

                      {/* Avatar */}
                      <View style={[styles.avatar, { borderColor: color + '50' }]}>  
                        <Text style={[styles.avatarText, { color
  }]}>{initials}</Text>
                      </View>

                      {/* Info */}
                      <View style={styles.rowInfo}>
                        <Text style={styles.rowName}>{item.full_name}</Text>
                        <Text style={styles.rowMeta}>{item.plan_name}  ·  Exp        
  {item.expiry_date}</Text>
                      </View>

                      {/* Status */}
                      <View style={[styles.statusPill, { backgroundColor: color +    
  '15' }]}>
                        <View style={[styles.statusDot, { backgroundColor: color }]} 
  />
                        <Text style={[styles.statusLabel, { color }]}>
                          {item.status.toUpperCase()}
                        </Text>
                      </View>
                    </AnimatedPressable>
                  </FadeInView>
                );
              }}
            />
          )}

          <FAB
            icon="plus"
            style={styles.fab}
            onPress={() => router.push('/(owner)/members/add')}
            color="#FFF"
            customSize={56}
          />
        </View>
      </>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },

    searchbar: {
      marginHorizontal: 16, marginTop: 10, marginBottom: 10,
      backgroundColor: Colors.bgCard, borderRadius: 14,
      elevation: 0, borderWidth: 1, borderColor: Colors.border, height: 48,
    },

    filterRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 6
   },
    filterChip: {
      paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
      backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,    
    },
    filterChipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
    filterText: {
      fontFamily: Fonts.bold,
      fontSize: 9, color: Colors.textMuted, letterSpacing: 1,
    },
    filterTextActive: { color: '#FFF' },

    countLabel: {
      fontFamily: Fonts.bold,
      fontSize: 9, color: Colors.textMuted,
      letterSpacing: 1.5, paddingHorizontal: 16, marginBottom: 8,
    },

    list: { paddingHorizontal: 16, paddingBottom: 80, gap: 6 },
    row: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: Colors.bgCard,
      borderRadius: 14, paddingVertical: 14, paddingRight: 14,
      borderWidth: 1, borderColor: Colors.border,
      overflow: 'hidden',
    },
    statusBar: { width: 3, alignSelf: 'stretch', marginRight: 12 },
    avatar: {
      width: 42, height: 42, borderRadius: 21,
      backgroundColor: Colors.bgElevated,
      justifyContent: 'center', alignItems: 'center',
      borderWidth: 1.5, marginRight: 12,
    },
    avatarText: { fontFamily: Fonts.condensedBold, fontSize: 15 },
    rowInfo: { flex: 1 },
    rowName: { fontFamily: Fonts.bold, fontSize: 15, color: Colors.text },
    rowMeta: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted,     
  marginTop: 2 },
    statusPill: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4,
    },
    statusDot: { width: 5, height: 5, borderRadius: 3 },
    statusLabel: { fontFamily: Fonts.bold, fontSize: 8, letterSpacing: 0.8 },        

    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 
  60 },
    emptyEmoji: { fontSize: 44, marginBottom: 12 },
    emptyTitle: { fontFamily: Fonts.bold, fontSize: 16, color: Colors.text },        
    emptyDesc: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted,   
  marginTop: 6 },

    fab: { position: 'absolute', right: 20, bottom: 20, backgroundColor:
  Colors.accent, borderRadius: 16 },
  });