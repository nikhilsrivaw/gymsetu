  
  import { useState, useCallback } from 'react';                                                                       
  import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Modal, Pressable, TextInput, ActivityIndicator } from 'react-native';
  import { Stack, useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';

  import { MaterialCommunityIcons } from '@expo/vector-icons';                                                         
  import LottieView from '@/components/AppLottie';
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

    // ── Assign members to this trainer (PT allocation) ────────────────────
    const [assignOpen, setAssignOpen]   = useState(false);
    const [allMembers, setAllMembers]   = useState<{ id: string; full_name: string; trainer_id: string | null }[]>([]);
    const [picked, setPicked]           = useState<Set<string>>(new Set());
    const [memberSearch, setMemberSearch] = useState('');
    const [savingAssign, setSavingAssign] = useState(false);

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

      // Every member in this trainer's gym, so the owner can pick who to assign.
      if (trainerRes.data?.gym_id) {
        const { data: roster } = await supabase
          .from('profiles')
          .select('id, full_name, trainer_id')
          .eq('gym_id', trainerRes.data.gym_id)
          .eq('role', 'member')
          .order('full_name');
        setAllMembers((roster ?? []) as any);
      }

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

    // Open the picker pre-ticked with whoever is already assigned here.
    const openAssign = () => {
      setPicked(new Set(members.map(m => m.id)));
      setMemberSearch('');
      setAssignOpen(true);
    };

    const togglePick = (memberId: string) => {
      setPicked(prev => {
        const next = new Set(prev);
        next.has(memberId) ? next.delete(memberId) : next.add(memberId);
        return next;
      });
    };

    const saveAssignments = async () => {
      if (!trainer) return;
      setSavingAssign(true);

      const before = new Set(members.map(m => m.id));
      const toAdd    = [...picked].filter(x => !before.has(x));
      const toRemove = [...before].filter(x => !picked.has(x));

      try {
        // Assign: point these members at this trainer.
        if (toAdd.length > 0) {
          const { error } = await supabase.from('profiles')
            .update({ trainer_id: trainer.id }).in('id', toAdd);
          if (error) throw error;
        }
        // Unassign: only clear rows still pointing at THIS trainer, so we never
        // wipe an assignment someone else made while this sheet was open.
        if (toRemove.length > 0) {
          const { error } = await supabase.from('profiles')
            .update({ trainer_id: null }).in('id', toRemove).eq('trainer_id', trainer.id);
          if (error) throw error;
        }
        setAssignOpen(false);
        await fetchData();
      } catch (e: any) {
        Alert.alert('Could not save', e?.message ?? 'Please try again.');
      } finally {
        setSavingAssign(false);
      }
    };

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
            <View style={s.sectionHeadRow}>
              <Text style={s.sectionLabel}>ASSIGNED MEMBERS  ·  {members.length}</Text>
              <AnimatedPressable style={s.assignBtn} scaleDown={0.95} onPress={openAssign}>
                <MaterialCommunityIcons name="account-plus-outline" size={14} color={Colors.accent} />
                <Text style={s.assignBtnText}>ASSIGN</Text>
              </AnimatedPressable>
            </View>
            {members.length === 0 ? (
              <AnimatedPressable style={s.emptyCard} scaleDown={0.98} onPress={openAssign}>
                <View style={s.emptyLine} />
                <Text style={s.emptyText}>No members assigned yet</Text>
                <Text style={s.emptyHint}>Tap to allot members for personal training</Text>
              </AnimatedPressable>
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

        {/* ── Assign members sheet ── */}
        <Modal visible={assignOpen} transparent animationType="slide" onRequestClose={() => setAssignOpen(false)}>
          <View style={s.modalWrap}>
            <Pressable style={s.backdrop} onPress={() => setAssignOpen(false)} />
            <View style={s.sheet}>
              <View style={s.sheetHead}>
                <View style={{ flex: 1 }}>
                  <Text style={s.sheetEyebrow}>PERSONAL TRAINING</Text>
                  <Text style={s.sheetTitle}>Assign members to {trainer?.full_name}</Text>
                </View>
                <Pressable onPress={() => setAssignOpen(false)}><Text style={s.closeX}>✕</Text></Pressable>
              </View>

              <View style={s.searchBar}>
                <MaterialCommunityIcons name="magnify" size={17} color={Colors.textMuted} />
                <TextInput
                  style={s.searchInput}
                  value={memberSearch}
                  onChangeText={setMemberSearch}
                  placeholder="Search members…"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              <Text style={s.pickedNote}>
                {picked.size} selected · tap to add or remove
              </Text>

              <ScrollView style={{ maxHeight: 380 }} keyboardShouldPersistTaps="handled">
                {allMembers
                  .filter(m => m.full_name.toLowerCase().includes(memberSearch.trim().toLowerCase()))
                  .map(m => {
                    const on         = picked.has(m.id);
                    // Assigned to a DIFFERENT trainer — warn before poaching.
                    const otherTrainer = !!m.trainer_id && m.trainer_id !== trainer?.id;
                    return (
                      <Pressable key={m.id} style={[s.pickRow, on && s.pickRowOn]} onPress={() => togglePick(m.id)}>
                        <View style={[s.checkbox, on && s.checkboxOn]}>
                          {on && <MaterialCommunityIcons name="check" size={13} color="#fff" />}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={s.pickName}>{m.full_name}</Text>
                          {otherTrainer && !on && (
                            <Text style={s.pickWarn}>Already with another trainer</Text>
                          )}
                        </View>
                      </Pressable>
                    );
                  })}
                {allMembers.length === 0 && (
                  <Text style={s.pickEmpty}>No members in this gym yet.</Text>
                )}
              </ScrollView>

              <AnimatedPressable
                style={[s.saveBtn, savingAssign && { opacity: 0.5 }]}
                scaleDown={0.97}
                onPress={saveAssignments}
                disabled={savingAssign}
              >
                {savingAssign
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={s.saveBtnText}>SAVE ASSIGNMENTS</Text>}
              </AnimatedPressable>
            </View>
          </View>
        </Modal>
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
    emptyHint: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.accent, marginTop: 6 },

    // Assign members
    sectionHeadRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    assignBtn:      { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.accent + '15', borderWidth: 1, borderColor: Colors.accent + '40', borderRadius: 9, paddingHorizontal: 11, paddingVertical: 6, marginBottom: 10, marginTop: 8 },
    assignBtnText:  { fontFamily: Fonts.bold, fontSize: 10, color: Colors.accent, letterSpacing: 0.8 },

    modalWrap:  { flex: 1, justifyContent: 'flex-end' },
    backdrop:   { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.72)' },
    sheet:      { backgroundColor: Colors.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 30, borderWidth: 1, borderColor: Colors.border },
    sheetHead:  { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 14 },
    sheetEyebrow:{ fontFamily: Fonts.bold, fontSize: 9, color: Colors.accent, letterSpacing: 1.3 },
    sheetTitle: { fontFamily: Fonts.condensedBold, fontSize: 19, color: Colors.text, marginTop: 3 },
    closeX:     { fontFamily: Fonts.bold, fontSize: 18, color: Colors.textMuted, paddingHorizontal: 6 },

    searchBar:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.bgElevated, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
    searchInput:{ flex: 1, fontFamily: Fonts.regular, fontSize: 15, color: Colors.text, padding: 0 },
    pickedNote: { fontFamily: Fonts.bold, fontSize: 10, color: Colors.textMuted, letterSpacing: 1, marginTop: 14, marginBottom: 8 },

    pickRow:    { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 10, borderRadius: 12, marginBottom: 4 },
    pickRowOn:  { backgroundColor: Colors.accent + '12' },
    checkbox:   { width: 22, height: 22, borderRadius: 7, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
    checkboxOn: { backgroundColor: Colors.accent, borderColor: Colors.accent },
    pickName:   { fontFamily: Fonts.bold, fontSize: 14.5, color: Colors.text },
    pickWarn:   { fontFamily: Fonts.regular, fontSize: 11, color: Colors.orange, marginTop: 2 },
    pickEmpty:  { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, textAlign: 'center', paddingVertical: 26 },

    saveBtn:     { backgroundColor: Colors.accent, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 14 },
    saveBtnText: { fontFamily: Fonts.bold, fontSize: 14, color: '#fff', letterSpacing: 1 },

    // Actions
    actionsRow:    { flexDirection: 'row', gap: 10, marginBottom: 24 },
    actionBtn:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  paddingVertical: 18, borderRadius: 16, borderWidth: 1 },
    actionBtnText: { fontFamily: Fonts.bold, fontSize: 12, letterSpacing: 0.8 },
  });
