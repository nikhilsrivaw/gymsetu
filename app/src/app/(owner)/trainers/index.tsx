  import { useState, useCallback } from 'react';
  import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
  import { Searchbar, FAB } from 'react-native-paper';
  import { useRouter, Stack, useFocusEffect } from 'expo-router';
  import { Colors } from '@/constants/colors';
  import { Fonts } from '@/constants/fonts';
  import AnimatedPressable from '@/components/AnimatedPressable';
  import FadeInView from '@/components/FadeInView';
  import { supabase } from '@/lib/supabase';
  import { useAuthStore } from '@/store/authStore';

  interface TrainerRow {
    id: string;
    full_name: string;
    phone: string | null;
    specialization: string | null;
    status: string;
  }

  export default function TrainersListScreen() {
    const { profile } = useAuthStore();
    const router = useRouter();
    const [search,   setSearch]   = useState('');
    const [trainers, setTrainers] = useState<TrainerRow[]>([]);
    const [loading,  setLoading]  = useState(true);

    const fetchTrainers = useCallback(async () => {
      if (!profile?.gym_id) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('trainers')
        .select('id, full_name, phone, specialization, status')
        .eq('gym_id', profile.gym_id)
        .order('full_name', { ascending: true });
      if (!error && data) setTrainers(data);
      setLoading(false);
    }, [profile?.gym_id]);

    useFocusEffect(useCallback(() => { fetchTrainers(); }, [fetchTrainers]));

    const filtered = trainers.filter(t =>
      t.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (t.phone ?? '').includes(search)
    );

    return (
      <>
        <Stack.Screen options={{ title: 'Trainers' }} />
        <View style={styles.container}>

          <FadeInView delay={0}>
            <Searchbar
              placeholder="Search by name or phone..."
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
            {loading ? 'Loading...' : `${filtered.length} TRAINER${filtered.length !== 1 ? 'S' : ''}`}
          </Text>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={Colors.accent} size="large" />
            </View>
          ) : filtered.length === 0 ? (
            <FadeInView delay={200} style={styles.empty}>
              <Text style={styles.emptyEmoji}>🏋️</Text>
              <Text style={styles.emptyTitle}>No trainers found</Text>
              <Text style={styles.emptyDesc}>
                {trainers.length === 0
                  ? 'Add your first trainer using the + button'
                  : 'Try adjusting your search'}
              </Text>
            </FadeInView>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.list}
              renderItem={({ item, index }) => {
                const color    = item.status === 'active' ? Colors.green : Colors.textMuted;
                const initials = item.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();   
                return (
                  <FadeInView delay={index * 40}>
                    <AnimatedPressable
                      style={styles.row}
                      scaleDown={0.98}
                      onPress={() => router.push(`/(owner)/trainers/${item.id}` as any)}
                    >
                      <View style={[styles.statusBar, { backgroundColor: color }]} />
                      <View style={[styles.avatar, { borderColor: color + '50' }]}>
                        <Text style={[styles.avatarText, { color }]}>{initials}</Text>
                      </View>
                      <View style={styles.rowInfo}>
                        <Text style={styles.rowName}>{item.full_name}</Text>
                        <Text style={styles.rowMeta}>
                          {item.specialization ?? 'General Trainer'}
                          {item.phone ? '  ·  ' + item.phone : ''}
                        </Text>
                      </View>
                      <View style={[styles.statusPill, { backgroundColor: color + '15' }]}>
                        <View style={[styles.statusDot, { backgroundColor: color }]} />
                        <Text style={[styles.statusLabel, { color }]}>{item.status.toUpperCase()}</Text>        
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
            onPress={() => router.push('/(owner)/trainers/add')}
            color="#FFF"
            customSize={56}
          />
        </View>
      </>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    center:    { flex: 1, justifyContent: 'center', alignItems: 'center' },

    searchbar: {
      marginHorizontal: 16, marginTop: 10, marginBottom: 10,
      backgroundColor: Colors.bgCard, borderRadius: 14,
      elevation: 0, borderWidth: 1, borderColor: Colors.border, height: 48,
    },
    countLabel: {
      fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted,
      letterSpacing: 1.5, paddingHorizontal: 16, marginBottom: 8,
    },

    list: { paddingHorizontal: 16, paddingBottom: 80, gap: 6 },
    row: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: Colors.bgCard, borderRadius: 14,
      paddingVertical: 14, paddingRight: 14,
      borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
    },
    statusBar:  { width: 3, alignSelf: 'stretch', marginRight: 12 },
    avatar:     {
      width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.bgElevated,
      justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, marginRight: 12,
    },
    avatarText: { fontFamily: Fonts.condensedBold, fontSize: 15 },
    rowInfo:    { flex: 1 },
    rowName:    { fontFamily: Fonts.bold, fontSize: 15, color: Colors.text },
    rowMeta:    { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 2 },
    statusPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4,
  borderRadius: 8, gap: 4 },
    statusDot:  { width: 5, height: 5, borderRadius: 3 },
    statusLabel:{ fontFamily: Fonts.bold, fontSize: 8, letterSpacing: 0.8 },

    empty:      { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 60 },
    emptyEmoji: { fontSize: 44, marginBottom: 12 },
    emptyTitle: { fontFamily: Fonts.bold, fontSize: 16, color: Colors.text },
    emptyDesc:  {
      fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted,
      marginTop: 6, textAlign: 'center', paddingHorizontal: 32,
    },

    fab: { position: 'absolute', right: 20, bottom: 20, backgroundColor: Colors.accent, borderRadius: 16 },     
  });