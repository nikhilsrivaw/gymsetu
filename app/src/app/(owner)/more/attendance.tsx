import { useState, useCallback } from 'react';
  import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert,
  ActivityIndicator } from 'react-native';
  import { Searchbar } from 'react-native-paper';
  import { Stack, useFocusEffect } from 'expo-router';
  import { MaterialCommunityIcons } from '@expo/vector-icons';
  import { Colors } from '@/constants/colors';
  import { Fonts } from '@/constants/fonts';
  import FadeInView from '@/components/FadeInView';
  import AnimatedPressable from '@/components/AnimatedPressable';
  import { supabase } from '@/lib/supabase';
  import { useAuthStore } from '@/store/authStore';

  interface AttendanceRow {
    id: string;
    full_name: string;
    phone: string | null;
    checked_in: boolean;
    attendance_id: string | null;
  }

  export default function AttendanceScreen() {
    const { profile } = useAuthStore();
    const [members, setMembers]   = useState<AttendanceRow[]>([]);
    const [search, setSearch]     = useState('');
    const [loading, setLoading]   = useState(true);
    const [marking, setMarking]   = useState<string | null>(null);
    const today = new Date().toISOString().split('T')[0];

    const fetchData = useCallback(async () => {
      if (!profile?.gym_id) return;
      setLoading(true);

      // Fetch all active members
      const { data: memberData } = await supabase
        .from('members')
        .select('id, full_name, phone')
        .eq('gym_id', profile.gym_id)
        .eq('status', 'active')
        .order('full_name');

      // Fetch today's attendance
      const { data: attData } = await supabase
        .from('attendance')
        .select('id, member_id')
        .eq('gym_id', profile.gym_id)
        .eq('check_in_date', today);

      const checkedInIds = new Set((attData ?? []).map((a: any) => a.member_id));    
      const attMap = Object.fromEntries((attData ?? []).map((a: any) => [a.member_id,
   a.id]));

      const rows: AttendanceRow[] = (memberData ?? []).map((m: any) => ({
        id:            m.id,
        full_name:     m.full_name,
        phone:         m.phone,
        checked_in:    checkedInIds.has(m.id),
        attendance_id: attMap[m.id] ?? null,
      }));

      setMembers(rows);
      setLoading(false);
    }, [profile?.gym_id, today]);

    useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

    const toggleCheckIn = async (member: AttendanceRow) => {
      if (!profile?.gym_id) return;
      setMarking(member.id);

      if (member.checked_in && member.attendance_id) {
        // Undo check-in
        const { error } = await supabase.from('attendance').delete().eq('id',        
  member.attendance_id);
        if (error) { Alert.alert('Error', error.message); setMarking(null); return; }
      } else {
        // Mark check-in
        const { error } = await supabase.from('attendance').insert({
          gym_id:         profile.gym_id,
          member_id:      member.id,
          check_in_date:  today,
          check_in_time:  new Date().toTimeString().slice(0, 5),
          marked_by:      profile.id,
        });
        if (error) { Alert.alert('Error', error.message); setMarking(null); return; }
      }

      // Optimistic UI update
      setMembers(prev => prev.map(m =>
        m.id === member.id
          ? { ...m, checked_in: !m.checked_in, attendance_id: m.checked_in ? null :  
  'pending' }
          : m
      ));
      setMarking(null);
    };

    const filtered = members.filter(m =>
      m.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (m.phone ?? '').includes(search)
    );

    const checkedCount = members.filter(m => m.checked_in).length;

    const todayLabel = new Date().toLocaleDateString('en-IN', { weekday: 'long', day:
   'numeric', month: 'short' });

    return (
      <>
        <Stack.Screen options={{ title: 'Attendance' }} />
        <View style={styles.container}>

          {/* Header strip */}
          <FadeInView delay={0}>
            <View style={styles.strip}>
              <View style={styles.stripLeft}>
                <Text style={styles.stripDate}>{todayLabel.toUpperCase()}</Text>     
                <Text style={styles.stripSub}>TODAY'S ATTENDANCE</Text>
              </View>
              <View style={styles.stripRight}>
                <Text style={styles.stripCount}>{checkedCount}</Text>
                <Text style={styles.stripTotal}>/ {members.length}</Text>
              </View>
            </View>
          </FadeInView>

          {/* Search */}
          <FadeInView delay={60}>
            <Searchbar
              placeholder="Search member..."
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

          <Text style={styles.countLabel}>
            {loading ? 'Loading...' : `${filtered.length} MEMBER${filtered.length !==
   1 ? 'S' : ''}`}
          </Text>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={Colors.accent} size="large" />
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.list}
              renderItem={({ item, index }) => {
                const isLoading = marking === item.id;
                const initials = item.full_name.split(' ').map(n =>
  n[0]).join('').slice(0, 2).toUpperCase();
                return (
                  <FadeInView delay={index * 35}>
                    <AnimatedPressable
                      style={[styles.row, item.checked_in && styles.rowChecked]}     
                      scaleDown={0.98}
                      onPress={() => toggleCheckIn(item)}
                    >
                      {item.checked_in && <View style={styles.checkedBar} />}        
                      <View style={[styles.avatar, { borderColor: item.checked_in ?  
  Colors.green + '60' : Colors.border }]}>
                        <Text style={[styles.avatarText, { color: item.checked_in ?  
  Colors.green : Colors.textMuted }]}>
                          {initials}
                        </Text>
                      </View>
                      <View style={styles.rowInfo}>
                        <Text style={styles.rowName}>{item.full_name}</Text>
                        <Text style={styles.rowSub}>{item.phone ?? 'No phone'}</Text>
                      </View>
                      {isLoading ? (
                        <ActivityIndicator size="small" color={Colors.accent}        
  style={{ marginRight: 4 }} />
                      ) : (
                        <View style={[styles.checkBtn, item.checked_in &&
  styles.checkBtnDone]}>
                          <MaterialCommunityIcons
                            name={item.checked_in ? 'check-circle' :
  'circle-outline'}
                            size={26}
                            color={item.checked_in ? Colors.green : Colors.border}   
                          />
                        </View>
                      )}
                    </AnimatedPressable>
                  </FadeInView>
                );
              }}
            />
          )}
        </View>
      </>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    center:    { flex: 1, justifyContent: 'center', alignItems: 'center' },

    strip: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',   
      margin: 16, backgroundColor: Colors.bgCard, borderRadius: 14,
      borderWidth: 1, borderColor: Colors.border, padding: 16,
    },
    stripLeft:  { gap: 3 },
    stripDate:  { fontFamily: Fonts.bold, fontSize: 10, color: Colors.accent,        
  letterSpacing: 1.5 },
    stripSub:   { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted },
    stripRight: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
    stripCount: { fontFamily: Fonts.condensedBold, fontSize: 36, color: Colors.green 
  },
    stripTotal: { fontFamily: Fonts.condensedBold, fontSize: 20, color:
  Colors.textMuted },

    searchbar: {
      marginHorizontal: 16, marginBottom: 8,
      backgroundColor: Colors.bgCard, borderRadius: 14,
      elevation: 0, borderWidth: 1, borderColor: Colors.border, height: 48,
    },
    countLabel: {
      fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted,
      letterSpacing: 1.5, paddingHorizontal: 16, marginBottom: 6,
    },

    list: { paddingHorizontal: 16, paddingBottom: 40, gap: 6 },
    row: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: Colors.bgCard, borderRadius: 14,
      borderWidth: 1, borderColor: Colors.border,
      paddingVertical: 12, paddingHorizontal: 14, gap: 12,
      overflow: 'hidden',
    },
    rowChecked:  { borderColor: Colors.green + '40', backgroundColor:
  Colors.greenMuted },
    checkedBar:  { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,       
  backgroundColor: Colors.green },
    avatar: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: Colors.bgElevated,
      justifyContent: 'center', alignItems: 'center',
      borderWidth: 1.5,
    },
    avatarText: { fontFamily: Fonts.condensedBold, fontSize: 14 },
    rowInfo:    { flex: 1 },
    rowName:    { fontFamily: Fonts.bold,    fontSize: 14, color: Colors.text },     
    rowSub:     { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted,  
  marginTop: 1 },
    checkBtn:     { width: 36, height: 36, justifyContent: 'center', alignItems:     
  'center' },
    checkBtnDone: {},
  });
