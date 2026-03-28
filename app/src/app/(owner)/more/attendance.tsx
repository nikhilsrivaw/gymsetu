  import { useState, useCallback, useRef } from 'react';
  import {
    View, Text, StyleSheet, FlatList,
    ActivityIndicator,
  } from 'react-native';
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
    id:            string;
    full_name:     string;
    phone:         string | null;
    checked_in:    boolean;
    attendance_id: string | null;
  }

  export default function AttendanceScreen() {
    const { profile, activeGymId, branches } = useAuthStore();
    const [members, setMembers] = useState<AttendanceRow[]>([]);
    const [search, setSearch]   = useState('');
    const [loading, setLoading] = useState(true);
    const [marking, setMarking] = useState<string | null>(null);
    const [error, setError]     = useState('');
    const errorTimer            = useRef<ReturnType<typeof setTimeout> | null>(null);

    const today = new Date().toISOString().split('T')[0];

    const showError = (msg: string) => {
      setError(msg);
      if (errorTimer.current) clearTimeout(errorTimer.current);
      errorTimer.current = setTimeout(() => setError(''), 4000);
    };

    const fetchData = useCallback(async () => {
      const mainGymId = profile?.gym_id;
      if (!mainGymId) return;
      setLoading(true);

      const gymIds: string[] =
        activeGymId === 'all'
          ? (branches.length > 0 ? branches.map(b => b.id) : [mainGymId])
          : [activeGymId ?? mainGymId];

      try {
        const [memberRes, attRes] = await Promise.all([
          supabase
            .from('profiles')
            .select('id, full_name, phone')
            .in('gym_id', gymIds)
            .eq('role', 'member')
            .eq('status', 'active')
            .order('full_name'),
          supabase
            .from('attendance')
            .select('id, member_id')
            .in('gym_id', gymIds)
            .eq('check_in_date', today),
        ]);

        const checkedInIds = new Set((attRes.data ?? []).map((a: any) => a.member_id));
        const attMap = Object.fromEntries((attRes.data ?? []).map((a: any) => [a.member_id, a.id]));

        setMembers((memberRes.data ?? []).map((m: any) => ({
          id:            m.id,
          full_name:     m.full_name,
          phone:         m.phone,
          checked_in:    checkedInIds.has(m.id),
          attendance_id: attMap[m.id] ?? null,
        })));
      } catch (err) {
        console.error('[Attendance] fetchData error:', err);
        showError('Could not load members. Pull to retry.');
      } finally {
        setLoading(false);
      }
    }, [activeGymId, branches, profile?.gym_id, today]);

    useFocusEffect(useCallback(() => {
      fetchData();
      return () => {
        if (errorTimer.current) clearTimeout(errorTimer.current);
      };
    }, [fetchData]));

    const toggleCheckIn = async (member: AttendanceRow) => {
      const mainGymId = profile?.gym_id;
      const gymId = activeGymId === 'all' ? mainGymId : (activeGymId ?? mainGymId);
      if (!gymId) return;

      // Optimistic update
      setMarking(member.id);
      setMembers(prev => prev.map(m =>
        m.id === member.id
          ? { ...m, checked_in: !m.checked_in, attendance_id: m.checked_in ? null : 'pending' }
          : m
      ));

      try {
        if (member.checked_in && member.attendance_id) {
          const { error } = await supabase.from('attendance').delete().eq('id', member.attendance_id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('attendance').insert({
            gym_id:        gymId,
            member_id:     member.id,
            check_in_date: today,
            check_in_time: new Date().toTimeString().slice(0, 5),
            marked_by:     profile?.id,
          });
          if (error) throw error;
        }
        // Refresh to get real attendance_id after insert
        if (!member.checked_in) fetchData();
      } catch (err: any) {
        // Revert optimistic update
        setMembers(prev => prev.map(m =>
          m.id === member.id
            ? { ...m, checked_in: member.checked_in, attendance_id: member.attendance_id }
            : m
        ));
        showError(err.message ?? 'Could not update attendance. Try again.');
      } finally {
        setMarking(null);
      }
    };

    const filtered     = members.filter(m =>
      m.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (m.phone ?? '').includes(search)
    );
    const checkedCount = members.filter(m => m.checked_in).length;
    const todayLabel   = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });  

    return (
      <>
        <Stack.Screen options={{ title: 'Attendance' }} />
        <View style={styles.container}>

          {/* ── Date + Count Strip ── */}
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

          {/* ── Error Banner ── */}
          {!!error && (
            <View style={styles.errorBanner}>
              <MaterialCommunityIcons name="alert-circle-outline" size={14} color="#f87171" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* ── Search ── */}
          <FadeInView delay={60}>
            <Searchbar
              placeholder="Search member..."
              value={search}
              onChangeText={setSearch}
              style={styles.searchbar}
              inputStyle={{ color: Colors.text, fontSize: 14, fontFamily: Fonts.regular }}
              iconColor={Colors.textMuted}
              placeholderTextColor={Colors.textMuted}
              theme={{ colors: { onSurfaceVariant: Colors.textMuted } }}
            />
          </FadeInView>

          <Text style={styles.countLabel}>
            {loading ? 'Loading...' : `${filtered.length} MEMBER${filtered.length !== 1 ? 'S' : ''}`}
          </Text>

          {/* ── List ── */}
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
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Text style={styles.emptyEmoji}>📋</Text>
                  <Text style={styles.emptyTitle}>No active members</Text>
                  <Text style={styles.emptyDesc}>Add members to start tracking attendance</Text>
                </View>
              }
              renderItem={({ item, index }) => {
                const isLoading = marking === item.id;
                const initials  = item.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                return (
                  <FadeInView delay={index * 35}>
                    <AnimatedPressable
                      style={[styles.row, item.checked_in && styles.rowChecked]}
                      scaleDown={0.98}
                      onPress={() => !isLoading && toggleCheckIn(item)}
                    >
                      {item.checked_in && <View style={styles.checkedBar} />}
                      <View style={[styles.avatar, { borderColor: item.checked_in ? Colors.green + '60' : Colors.border
   }]}>
                        <Text style={[styles.avatarText, { color: item.checked_in ? Colors.green : Colors.textMuted    
  }]}>
                          {initials}
                        </Text>
                      </View>
                      <View style={styles.rowInfo}>
                        <Text style={styles.rowName}>{item.full_name}</Text>
                        <Text style={styles.rowSub}>{item.phone ?? 'No phone'}</Text>
                      </View>
                      {isLoading ? (
                        <ActivityIndicator size="small" color={Colors.accent} style={{ marginRight: 4 }} />
                      ) : (
                        <MaterialCommunityIcons
                          name={item.checked_in ? 'check-circle' : 'circle-outline'}
                          size={26}
                          color={item.checked_in ? Colors.green : Colors.border}
                        />
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
    stripDate:  { fontFamily: Fonts.bold, fontSize: 10, color: Colors.accent, letterSpacing: 1.5 },
    stripSub:   { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted },
    stripRight: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
    stripCount: { fontFamily: Fonts.condensedBold, fontSize: 36, color: Colors.green },
    stripTotal: { fontFamily: Fonts.condensedBold, fontSize: 20, color: Colors.textMuted },

    errorBanner: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      marginHorizontal: 16, marginBottom: 8,
      backgroundColor: '#f8717115', borderRadius: 10,
      paddingHorizontal: 12, paddingVertical: 8,
      borderWidth: 1, borderColor: '#f8717130',
    },
    errorText: { fontFamily: Fonts.regular, fontSize: 12, color: '#f87171', flex: 1 },

    searchbar: {
      marginHorizontal: 16, marginBottom: 8,
      backgroundColor: Colors.bgCard, borderRadius: 14,
      elevation: 0, borderWidth: 1, borderColor: Colors.border, height: 48,
    },
    countLabel: {
      fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted,
      letterSpacing: 1.5, paddingHorizontal: 16, marginBottom: 6,
    },

    list:       { paddingHorizontal: 16, paddingBottom: 40, gap: 6 },
    row:        { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgCard, borderRadius: 14,        
  borderWidth: 1, borderColor: Colors.border, paddingVertical: 12, paddingHorizontal: 14, gap: 12, overflow: 'hidden'  
  },
    rowChecked: { borderColor: Colors.green + '40', backgroundColor: Colors.green + '08' },
    checkedBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: Colors.green },
    avatar:     { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.bgElevated, justifyContent:
  'center', alignItems: 'center', borderWidth: 1.5 },
    avatarText: { fontFamily: Fonts.condensedBold, fontSize: 15 },
    rowInfo:    { flex: 1 },
    rowName:    { fontFamily: Fonts.bold, fontSize: 15, color: Colors.text },
    rowSub:     { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 2 },

    empty:      { alignItems: 'center', paddingVertical: 60 },
    emptyEmoji: { fontSize: 40, marginBottom: 12 },
    emptyTitle: { fontFamily: Fonts.bold, fontSize: 16, color: Colors.text },
    emptyDesc:  { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, marginTop: 6, textAlign: 'center'  
  },
  });