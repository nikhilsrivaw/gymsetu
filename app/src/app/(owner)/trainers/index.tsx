import { useState, useCallback } from 'react';                                                                       
  import { View, Text, StyleSheet, FlatList } from 'react-native';                                                       import { Searchbar, FAB } from 'react-native-paper';                                                                 
  import { useRouter, Stack, useFocusEffect } from 'expo-router';                                                      
  import LottieView from 'lottie-react-native';
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
    const { profile, activeGymId, branches } = useAuthStore();
    const router = useRouter();
    const [search, setSearch]     = useState('');
    const [trainers, setTrainers] = useState<TrainerRow[]>([]);
    const [loading, setLoading]   = useState(true);

    const fetchTrainers = useCallback(async () => {
      const mainGymId = (profile as any)?.gym_id;
      if (!mainGymId) return;
      setLoading(true);

      let gymIds: string[];
      if (activeGymId === 'all') {
        gymIds = branches.length > 0 ? branches.map(b => b.id) : [mainGymId];
      } else {
        gymIds = [activeGymId ?? mainGymId];
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone, specialization, status')
        .in('gym_id', gymIds)
        .eq('role', 'trainer')
        .order('full_name', { ascending: true });

      if (!error && data) {
        setTrainers(data.map((t: any) => ({
          id:             t.id,
          full_name:      t.full_name,
          phone:          t.phone ?? null,
          specialization: t.specialization ?? null,
          status:         t.status ?? 'active',
        })));
      }
      setLoading(false);
    }, [activeGymId, branches]);

    useFocusEffect(useCallback(() => { fetchTrainers(); }, [fetchTrainers]));

    const filtered = trainers.filter(t =>
      t.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (t.phone ?? '').includes(search)
    );

    const activeCount   = trainers.filter(t => t.status === 'active').length;
    const inactiveCount = trainers.length - activeCount;

    // ── Loading ──────────────────────────────────────────────────────
    if (loading) {
      return (
        <View style={s.loadingContainer}>
          <LottieView
            source={require('@/assets/animations/Turkey Power Walk.json')}
            autoPlay loop style={s.loadingLottie}
          />
          <Text style={s.loadingTitle}>LOADING TRAINERS</Text>
          <Text style={s.loadingSub}>Fetching your team...</Text>
        </View>
      );
    }

    return (
      <>
        <Stack.Screen options={{ title: 'Trainers', headerStyle: { backgroundColor: '#0a0a0a' }, headerTintColor:      
  '#fff' }} />
        <View style={s.container}>

          {/* ── Stats Strip ── */}
          <FadeInView delay={0}>
            <View style={s.statsStrip}>
              <View style={s.statBox}>
                <Text style={s.statNum}>{trainers.length}</Text>
                <Text style={s.statLabel}>TOTAL</Text>
              </View>
              <View style={s.statLine} />
              <View style={s.statBox}>
                <Text style={[s.statNum, { color: '#22c55e' }]}>{activeCount}</Text>
                <Text style={s.statLabel}>ACTIVE</Text>
              </View>
              <View style={s.statLine} />
              <View style={s.statBox}>
                <Text style={[s.statNum, { color: '#555' }]}>{inactiveCount}</Text>
                <Text style={s.statLabel}>INACTIVE</Text>
              </View>
            </View>
          </FadeInView>

          {/* ── Search ── */}
          <FadeInView delay={40}>
            <Searchbar
              placeholder="Search name or phone..."
              value={search}
              onChangeText={setSearch}
              style={s.searchbar}
              inputStyle={{ color: '#fff', fontSize: 15, fontFamily: Fonts.regular }}
              iconColor="#444"
              placeholderTextColor="#444"
              theme={{ colors: { onSurfaceVariant: '#444' } }}
            />
          </FadeInView>

          {/* ── Count ── */}
          <Text style={s.countLabel}>
            {filtered.length} TRAINER{filtered.length !== 1 ? 'S' : ''}
          </Text>

          {/* ── List / Empty ── */}
          {filtered.length === 0 ? (
            <FadeInView delay={200} style={s.empty}>
              <View style={s.emptyBar} />
              <Text style={s.emptyTitle}>No trainers found</Text>
              <Text style={s.emptyDesc}>
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
              contentContainerStyle={s.list}
              renderItem={({ item, index }) => {
                const isActive = item.status === 'active';
                const color    = isActive ? '#22c55e' : '#444';
                const initials = item.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                return (
                  <FadeInView delay={index * 40}>
                    <AnimatedPressable
                      style={s.row}
                      scaleDown={0.97}
                      onPress={() => router.push(`/(owner)/trainers/${item.id}` as any)}
                    >
                      {/* Accent bar */}
                      <View style={[s.accentBar, { backgroundColor: color }]} />

                      {/* Avatar */}
                      <View style={[s.avatar, { borderColor: color + '50', backgroundColor: color + '10' }]}>
                        <Text style={[s.avatarText, { color }]}>{initials}</Text>
                      </View>

                      {/* Info */}
                      <View style={s.rowInfo}>
                        <Text style={s.rowName}>{item.full_name}</Text>
                        <Text style={s.rowSpec}>
                          {item.specialization ?? 'General Trainer'}
                        </Text>
                        {item.phone && (
                          <Text style={s.rowPhone}>{item.phone}</Text>
                        )}
                      </View>

                      {/* Status */}
                      <View style={[s.statusChip, { backgroundColor: color + '12', borderColor: color + '35' }]}>      
                        <View style={[s.chipDot, { backgroundColor: color }]} />
                        <Text style={[s.chipText, { color }]}>{item.status.toUpperCase()}</Text>
                      </View>
                    </AnimatedPressable>
                  </FadeInView>
                );
              }}
            />
          )}

          <FAB
            icon="plus"
            style={s.fab}
            onPress={() => router.push('/(owner)/trainers/add')}
            color="#FFF"
            customSize={56}
          />
        </View>
      </>
    );
  }

  const s = StyleSheet.create({
    // Loading
    loadingContainer: { flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center' },
    loadingLottie:    { width: 200, height: 200 },
    loadingTitle:     { fontFamily: Fonts.condensedBold, fontSize: 20, color: '#fff', letterSpacing: 4, marginTop: 8 },
    loadingSub:       { fontFamily: Fonts.regular, fontSize: 14, color: '#444', marginTop: 6 },

    // Layout
    container: { flex: 1, backgroundColor: '#0a0a0a' },

    // Stats strip
    statsStrip: {
      flexDirection: 'row', alignItems: 'center',
      marginHorizontal: 16, marginTop: 14, marginBottom: 12,
      backgroundColor: '#141414', borderRadius: 18,
      padding: 20, borderWidth: 1, borderColor: '#1e1e1e',
    },
    statBox:  { flex: 1, alignItems: 'center' },
    statNum:  { fontFamily: Fonts.condensedBold, fontSize: 32, color: '#fff' },
    statLabel:{ fontFamily: Fonts.bold, fontSize: 9, color: '#444', letterSpacing: 1.2, marginTop: 4 },
    statLine: { width: 1, height: 40, backgroundColor: '#1e1e1e' },

    // Search
    searchbar: {
      marginHorizontal: 16, marginBottom: 12,
      backgroundColor: '#141414', borderRadius: 14,
      elevation: 0, borderWidth: 1, borderColor: '#1e1e1e', height: 52,
    },

    // Count
    countLabel: {
      fontFamily: Fonts.bold, fontSize: 10, color: '#444',
      letterSpacing: 1.8, paddingHorizontal: 16, marginBottom: 10,
    },

    // List
    list: { paddingHorizontal: 16, paddingBottom: 90, gap: 8 },

    row: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: '#141414', borderRadius: 18,
      paddingVertical: 16, paddingRight: 14,
      borderWidth: 1, borderColor: '#1e1e1e', overflow: 'hidden',
    },
    accentBar:  { width: 3, alignSelf: 'stretch', marginRight: 14, borderRadius: 2 },
    avatar:     { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', borderWidth:
   1.5, marginRight: 14 },
    avatarText: { fontFamily: Fonts.condensedBold, fontSize: 18 },
    rowInfo:    { flex: 1, gap: 3 },
    rowName:    { fontFamily: Fonts.bold, fontSize: 17, color: '#fff' },
    rowSpec:    { fontFamily: Fonts.medium, fontSize: 13, color: '#666' },
    rowPhone:   { fontFamily: Fonts.regular, fontSize: 12, color: '#444' },

    statusChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 
  10, borderWidth: 1, gap: 5 },
    chipDot:    { width: 6, height: 6, borderRadius: 3 },
    chipText:   { fontFamily: Fonts.bold, fontSize: 9, letterSpacing: 1 },

    // Empty
    empty:     { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 60, gap: 12 },
    emptyBar:  { width: 36, height: 3, borderRadius: 2, backgroundColor: '#222' },
    emptyTitle:{ fontFamily: Fonts.bold, fontSize: 18, color: '#fff' },
    emptyDesc: { fontFamily: Fonts.regular, fontSize: 14, color: '#444', textAlign: 'center', paddingHorizontal: 40,   
  lineHeight: 22 },

    // FAB
    fab: { position: 'absolute', right: 20, bottom: 24, backgroundColor: Colors.accent, borderRadius: 28 },
  });