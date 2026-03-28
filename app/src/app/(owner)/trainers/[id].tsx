  
  import { useState, useCallback } from 'react';                                                                       
  import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';                            import { Stack, useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';                                
  import { MaterialCommunityIcons } from '@expo/vector-icons';                                                         
  import LottieView from 'lottie-react-native';
  import { Colors } from '@/constants/colors';
  import { Fonts } from '@/constants/fonts';
  import FadeInView from '@/components/FadeInView';
  import AnimatedPressable from '@/components/AnimatedPressable';
  import { supabase } from '@/lib/supabase';

  type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

  interface TrainerProfile {
    id: string;
    full_name: string;
    phone: string | null;
    email: string | null;
    specialization: string | null;
    status: string;
    trainer_code: string | null;
    trainer_password: string | null;
    join_date: string | null;
  }

  interface AssignedMember {
    id: string;
    full_name: string;
    phone: string | null;
    status: string;
  }

  interface TrainerStats {
    totalMembers:  number;
    activeMembers: number;
    sessionsMonth: number;
    sessionsTotal: number;
    plansCreated:  number;
  }

  export default function TrainerDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router  = useRouter();

    const [trainer, setTrainer]     = useState<TrainerProfile | null>(null);
    const [stats, setStats]         = useState<TrainerStats | null>(null);
    const [members, setMembers]     = useState<AssignedMember[]>([]);
    const [loading, setLoading]     = useState(true);
    const [showCreds, setShowCreds] = useState(false);

    const fetchData = useCallback(async () => {
      if (!id) return;
      setLoading(true);

      const now        = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const [trainerRes, sessionsMonthRes, sessionsTotalRes, plansRes, membersRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', id).single(),
        supabase.from('trainer_sessions').select('id', { count: 'exact', head: true }).eq('trainer_id',
  id).gte('session_date', monthStart),
        supabase.from('trainer_sessions').select('id', { count: 'exact', head: true }).eq('trainer_id', id),
        supabase.from('workout_plans').select('id', { count: 'exact', head: true }).eq('trainer_id', id),
        supabase.from('profiles').select('id, full_name, phone, status').eq('trainer_id', id).eq('role', 'member'),    
      ]);

      if (trainerRes.data) setTrainer(trainerRes.data as TrainerProfile);

      const assignedMembers = (membersRes.data ?? []) as AssignedMember[];
      setMembers(assignedMembers);

      setStats({
        totalMembers:  assignedMembers.length,
        activeMembers: assignedMembers.filter(m => m.status === 'active').length,
        sessionsMonth: sessionsMonthRes.count ?? 0,
        sessionsTotal: sessionsTotalRes.count ?? 0,
        plansCreated:  plansRes.count ?? 0,
      });

      setLoading(false);
    }, [id]);

    useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

    const handleToggleStatus = () => {
      if (!trainer) return;
      const newStatus = trainer.status === 'active' ? 'inactive' : 'active';
      Alert.alert(
        newStatus === 'active' ? 'Activate Trainer?' : 'Deactivate Trainer?',
        `${trainer.full_name} will be marked as ${newStatus}.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Confirm', onPress: async () => {
            await supabase.from('profiles').update({ status: newStatus }).eq('id', trainer.id);
            fetchData();
          }},
        ]
      );
    };

    const handleDelete = () => {
      Alert.alert('Delete Trainer', `Permanently remove ${trainer?.full_name}?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => {
          await supabase.from('profiles').delete().eq('id', id);
          router.back();
        }},
      ]);
    };

    // ── Loading ──────────────────────────────────────────────────────
    if (loading) {
      return (
        <>
          <Stack.Screen options={{ title: '', headerStyle: { backgroundColor: '#0a0a0a' }, headerTintColor: '#fff' }}  
  />
          <View style={s.loadingContainer}>
            <LottieView
              source={require('@/assets/animations/Turkey Power Walk.json')}
              autoPlay loop style={s.loadingLottie}
            />
            <Text style={s.loadingTitle}>LOADING TRAINER</Text>
            <Text style={s.loadingSub}>Fetching profile data...</Text>
          </View>
        </>
      );
    }

    if (!trainer) {
      return (
        <>
          <Stack.Screen options={{ title: '', headerStyle: { backgroundColor: '#0a0a0a' }, headerTintColor: '#fff' }}  
  />
          <View style={s.loadingContainer}>
            <Text style={s.notFoundText}>Trainer not found</Text>
          </View>
        </>
      );
    }

    const initials  = trainer.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    const isActive  = trainer.status === 'active';
    const statColor = isActive ? '#22c55e' : '#555';

    const perfStats: { label: string; value: string; color: string; icon: IconName }[] = stats ? [
      { label: 'ASSIGNED',       value: stats.totalMembers.toString(),  color: Colors.accent, icon:
  'account-group-outline'  },
      { label: 'ACTIVE',         value: stats.activeMembers.toString(), color: '#22c55e',     icon:
  'account-check-outline'  },
      { label: 'SESSIONS / MO',  value: stats.sessionsMonth.toString(), color: '#3B82F6',     icon:
  'calendar-check-outline' },
      { label: 'TOTAL SESSIONS', value: stats.sessionsTotal.toString(), color: '#A78BFA',     icon: 'dumbbell'
        },
      { label: 'PLANS CREATED',  value: stats.plansCreated.toString(),  color: '#f97316',     icon:
  'clipboard-list-outline' },
    ] : [];

    return (
      <>
        <Stack.Screen options={{ title: '', headerStyle: { backgroundColor: '#0a0a0a' }, headerTintColor: '#fff' }} /> 
        <ScrollView style={s.container} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Hero ── */}
          <FadeInView delay={0}>
            <View style={s.hero}>
              <View style={[s.avatarRing, { borderColor: statColor + '50', shadowColor: statColor }]}>
                <View style={[s.avatarCore, { backgroundColor: statColor + '12' }]}>
                  <Text style={[s.avatarInitials, { color: statColor }]}>{initials}</Text>
                </View>
              </View>
              <Text style={s.heroName}>{trainer.full_name}</Text>
              <Text style={s.heroSpec}>{trainer.specialization ?? 'General Trainer'}</Text>
              <View style={[s.statusChip, { backgroundColor: statColor + '12', borderColor: statColor + '35' }]}>      
                <View style={[s.chipDot, { backgroundColor: statColor }]} />
                <Text style={[s.chipText, { color: statColor }]}>{trainer.status.toUpperCase()}</Text>
              </View>
            </View>
          </FadeInView>

          {/* ── Performance Stats ── */}
          <FadeInView delay={50}>
            <Text style={s.sectionLabel}>PERFORMANCE</Text>
            <View style={s.statsGrid}>
              {perfStats.map(p => (
                <View key={p.label} style={[s.statCard, { borderColor: p.color + '30' }]}>
                  <MaterialCommunityIcons name={p.icon} size={20} color={p.color} />
                  <Text style={[s.statVal, { color: p.color }]}>{p.value}</Text>
                  <Text style={s.statLabel}>{p.label}</Text>
                </View>
              ))}
            </View>
          </FadeInView>

          {/* ── Contact ── */}
          <FadeInView delay={100}>
            <Text style={s.sectionLabel}>CONTACT</Text>
            <View style={s.card}>
              {[
                { icon: 'phone-outline'    as IconName, label: 'PHONE',  val: trainer.phone ?? '—' },
                { icon: 'email-outline'    as IconName, label: 'EMAIL',  val: trainer.email ?? '—' },
                { icon: 'calendar-outline' as IconName, label: 'JOINED', val: trainer.join_date ? new
  Date(trainer.join_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—' },    
              ].map((row, i, arr) => (
                <View key={row.label} style={[s.infoRow, i < arr.length - 1 && s.rowBorder]}>
                  <View style={s.iconWrap}>
                    <MaterialCommunityIcons name={row.icon} size={16} color={Colors.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.infoLabel}>{row.label}</Text>
                    <Text style={s.infoVal}>{row.val}</Text>
                  </View>
                </View>
              ))}
            </View>
          </FadeInView>

          {/* ── Credentials ── */}
          <FadeInView delay={140}>
            <Text style={s.sectionLabel}>LOGIN CREDENTIALS</Text>
            <TouchableOpacity
              style={s.credsToggleBtn}
              onPress={() => setShowCreds(!showCreds)}
              activeOpacity={0.75}
            >
              <MaterialCommunityIcons
                name={showCreds ? 'eye-off-outline' : 'eye-outline'}
                size={18} color={Colors.accent}
              />
              <Text style={s.credsToggleText}>
                {showCreds ? 'HIDE CREDENTIALS' : 'SHOW CREDENTIALS'}
              </Text>
            </TouchableOpacity>

            {showCreds && (
              <View style={s.credsBox}>
                <View style={s.credRow}>
                  <Text style={s.credLabel}>TRAINER ID</Text>
                  <Text style={s.credVal}>{trainer.trainer_code ?? '—'}</Text>
                </View>
                <View style={[s.credRow, s.rowBorder, { borderTopWidth: 1, borderBottomWidth: 0 }]}>
                  <Text style={s.credLabel}>PASSWORD</Text>
                  <Text style={s.credVal}>{trainer.trainer_password ?? '—'}</Text>
                </View>
              </View>
            )}
          </FadeInView>

          {/* ── Assigned Members ── */}
          <FadeInView delay={180}>
            <Text style={s.sectionLabel}>ASSIGNED MEMBERS  ·  {members.length}</Text>
            {members.length === 0 ? (
              <View style={s.emptyCard}>
                <View style={s.emptyLine} />
                <Text style={s.emptyText}>No members assigned yet</Text>
              </View>
            ) : (
              <View style={s.card}>
                {members.map((m, i) => {
                  const mInitials = m.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                  const mColor    = m.status === 'active' ? '#22c55e' : '#555';
                  return (
                    <View key={m.id} style={[s.memberRow, i < members.length - 1 && s.rowBorder]}>
                      <View style={[s.memberAvatar, { borderColor: mColor + '50', backgroundColor: mColor + '10' }]}>  
                        <Text style={[s.memberAvatarText, { color: mColor }]}>{mInitials}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.memberName}>{m.full_name}</Text>
                        <Text style={s.memberPhone}>{m.phone ?? '—'}</Text>
                      </View>
                      <View style={[s.memberChip, { backgroundColor: mColor + '12', borderColor: mColor + '30' }]}>    
                        <View style={[s.chipDot, { backgroundColor: mColor }]} />
                        <Text style={[s.chipText, { color: mColor }]}>{m.status.toUpperCase()}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </FadeInView>

          {/* ── Actions ── */}
          <FadeInView delay={220}>
            <Text style={s.sectionLabel}>ACTIONS</Text>
            <View style={s.actionsRow}>
              <AnimatedPressable
                style={[s.actionBtn, {
                  borderColor:     isActive ? '#f97316' + '40' : '#22c55e' + '40',
                  backgroundColor: isActive ? '#f97316' + '10' : '#22c55e' + '10',
                }]}
                scaleDown={0.95}
                onPress={handleToggleStatus}
              >
                <MaterialCommunityIcons
                  name={isActive ? 'account-off-outline' : 'account-check-outline'}
                  size={18}
                  color={isActive ? '#f97316' : '#22c55e'}
                />
                <Text style={[s.actionBtnText, { color: isActive ? '#f97316' : '#22c55e' }]}>
                  {isActive ? 'DEACTIVATE' : 'ACTIVATE'}
                </Text>
              </AnimatedPressable>

              <AnimatedPressable
                style={[s.actionBtn, { borderColor: '#ef4444' + '40', backgroundColor: '#ef4444' + '10' }]}
                scaleDown={0.95}
                onPress={handleDelete}
              >
                <MaterialCommunityIcons name="delete-outline" size={18} color="#ef4444" />
                <Text style={[s.actionBtnText, { color: '#ef4444' }]}>DELETE</Text>
              </AnimatedPressable>
            </View>
          </FadeInView>

          <View style={{ height: 40 }} />
        </ScrollView>
      </>
    );
  }

  const s = StyleSheet.create({
    // Loading
    loadingContainer: { flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center' },
    loadingLottie:    { width: 200, height: 200 },
    loadingTitle:     { fontFamily: Fonts.condensedBold, fontSize: 20, color: '#fff', letterSpacing: 4, marginTop: 8 },
    loadingSub:       { fontFamily: Fonts.regular, fontSize: 14, color: '#444', marginTop: 6 },
    notFoundText:     { fontFamily: Fonts.regular, fontSize: 16, color: '#444' },

    // Layout
    container: { flex: 1, backgroundColor: '#0a0a0a' },
    scroll:    { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 },

    // Hero
    hero:           { alignItems: 'center', paddingTop: 28, paddingBottom: 28 },
    avatarRing:     { width: 110, height: 110, borderRadius: 55, borderWidth: 2, justifyContent: 'center', alignItems: 
  'center', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 28, elevation: 12 },
    avatarCore:     { width: 94, height: 94, borderRadius: 47, justifyContent: 'center', alignItems: 'center' },       
    avatarInitials: { fontFamily: Fonts.condensedBold, fontSize: 36 },
    heroName:       { fontFamily: Fonts.condensedBold, fontSize: 36, color: '#fff', marginTop: 16, letterSpacing: 0.5  
  },
    heroSpec:       { fontFamily: Fonts.regular, fontSize: 15, color: '#555', marginTop: 6 },
    statusChip:     { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingHorizontal: 16,
  paddingVertical: 8, borderRadius: 20, gap: 7, borderWidth: 1 },
    chipDot:        { width: 7, height: 7, borderRadius: 4 },
    chipText:       { fontFamily: Fonts.bold, fontSize: 11, letterSpacing: 1.2 },

    // Section label
    sectionLabel: { fontFamily: Fonts.bold, fontSize: 10, color: '#444', letterSpacing: 2, marginBottom: 10, marginTop:
   4 },

    // Stats grid
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
    statCard:  { width: '31%', backgroundColor: '#141414', borderRadius: 16, borderWidth: 1, padding: 14, alignItems:  
  'center', gap: 6 },
    statVal:   { fontFamily: Fonts.condensedBold, fontSize: 28 },
    statLabel: { fontFamily: Fonts.bold, fontSize: 8, color: '#444', letterSpacing: 0.8, textAlign: 'center' },        

    // Generic card
    card:    { backgroundColor: '#141414', borderRadius: 18, borderWidth: 1, borderColor: '#1e1e1e', overflow:
  'hidden', marginBottom: 24 },
    rowBorder: { borderTopWidth: 1, borderTopColor: '#1a1a1a' },

    // Info rows
    infoRow:   { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingVertical: 16 },    
    iconWrap:  { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.accent + '12', justifyContent:       
  'center', alignItems: 'center' },
    infoLabel: { fontFamily: Fonts.bold, fontSize: 10, color: '#444', letterSpacing: 1, marginBottom: 3 },
    infoVal:   { fontFamily: Fonts.medium, fontSize: 15, color: '#ddd' },

    // Credentials
    credsToggleBtn:  { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#141414', borderRadius:  
  14, padding: 18, borderWidth: 1, borderColor: Colors.accent + '30', marginBottom: 8 },
    credsToggleText: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.accent, letterSpacing: 1 },
    credsBox:        { backgroundColor: '#141414', borderRadius: 18, borderWidth: 1, borderColor: '#1e1e1e', overflow: 
  'hidden', marginBottom: 24 },
    credRow:         { paddingHorizontal: 18, paddingVertical: 18 },
    credLabel:       { fontFamily: Fonts.bold, fontSize: 10, color: '#444', letterSpacing: 1.5, marginBottom: 6 },     
    credVal:         { fontFamily: Fonts.condensedBold, fontSize: 26, color: Colors.accent },

    // Members list
    memberRow:        { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingVertical: 14
   },
    memberAvatar:     { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center',       
  borderWidth: 1.5 },
    memberAvatarText: { fontFamily: Fonts.condensedBold, fontSize: 16 },
    memberName:       { fontFamily: Fonts.bold, fontSize: 15, color: '#fff' },
    memberPhone:      { fontFamily: Fonts.regular, fontSize: 13, color: '#555', marginTop: 3 },
    memberChip:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6,
  borderRadius: 10, borderWidth: 1, gap: 5 },

    // Empty
    emptyCard: { backgroundColor: '#141414', borderRadius: 18, borderWidth: 1, borderColor: '#1e1e1e', paddingVertical:
   36, alignItems: 'center', marginBottom: 24, gap: 12 },
    emptyLine: { width: 36, height: 3, borderRadius: 2, backgroundColor: '#222' },
    emptyText: { fontFamily: Fonts.regular, fontSize: 14, color: '#444' },

    // Actions
    actionsRow:    { flexDirection: 'row', gap: 10, marginBottom: 24 },
    actionBtn:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  paddingVertical: 18, borderRadius: 16, borderWidth: 1 },
    actionBtnText: { fontFamily: Fonts.bold, fontSize: 12, letterSpacing: 0.8 },
  });
