 import { useState, useCallback } from 'react';                                                                
  import {        
    View, Text, StyleSheet, ScrollView, Pressable,
    Modal, TextInput, Alert, ActivityIndicator, Linking,
  } from 'react-native';
  import { SafeAreaView } from 'react-native-safe-area-context';
  import { MaterialCommunityIcons } from '@expo/vector-icons';
  import { useFocusEffect } from 'expo-router';
  import { Colors } from '@/constants/colors';
  import { Fonts } from '@/constants/fonts';
  import FadeInView from '@/components/FadeInView';
  import AnimatedPressable from '@/components/AnimatedPressable';
  import { supabase } from '@/lib/supabase';
  import { useAuthStore } from '@/store/authStore';

  type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

  const COLORS = [Colors.accent, Colors.green, '#3B82F6', '#EC4899', Colors.orange, '#A78BFA'];

  const statusMeta: Record<string, { label: string; color: string }> = {
    'active':   { label: 'ACTIVE',   color: Colors.green  },
    'on-leave': { label: 'ON LEAVE', color: Colors.orange },
    'inactive': { label: 'INACTIVE', color: Colors.red    },
  };

  const shiftIcon: Record<string, IconName> = {
    'Morning':  'weather-sunny',
    'Evening':  'weather-sunset',
    'Full Day': 'calendar-today',
  };

  const SHIFTS  = ['Morning', 'Evening', 'Full Day'];
  const STATUSES = ['active', 'on-leave', 'inactive'];

  interface StaffRow {
    id: string;
    full_name: string;
    role: string;
    shift: string;
    status: string;
    phone: string | null;
    salary: string | null;
    sessions: number;
    rating: number;
    joined_date: string;
  }

  export default function StaffScreen() {
    const { profile } = useAuthStore();
    const [staff,     setStaff]     = useState<StaffRow[]>([]);
    const [loading,   setLoading]   = useState(true);
    const [filter,    setFilter]    = useState('All');
    const [selected,  setSelected]  = useState<StaffRow | null>(null);
    const [addModal,  setAddModal]  = useState(false);
    const [saving,    setSaving]    = useState(false);

    // Add form state
    const [name,        setName]        = useState('');
    const [role,        setRole]        = useState('');
    const [shift,       setShift]       = useState('Morning');
    const [phone,       setPhone]       = useState('');
    const [salary,      setSalary]      = useState('');

    const fetchStaff = useCallback(async (active = true) => {                                                     
    if (!profile?.gym_id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('gym_id', profile.gym_id)
      .order('full_name', { ascending: true });
    if (active && !error && data) setStaff(data);
    if (active) setLoading(false);
  }, [profile?.gym_id]);

    useFocusEffect(useCallback(() => {
    let active = true;
    fetchStaff(active);
    return () => { active = false; };
  }, [fetchStaff]));

    const roles    = ['All', ...Array.from(new Set(staff.map(s => s.role)))];
    const filtered = filter === 'All' ? staff : staff.filter(s => s.role === filter);
    const active   = staff.filter(s => s.status === 'active').length;
    const onLeave  = staff.filter(s => s.status === 'on-leave').length;

    const getColor    = (index: number) => COLORS[index % COLORS.length];
    const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();    

    const resetForm = () => { setName(''); setRole(''); setShift('Morning'); setPhone(''); setSalary(''); };    

    const handleAdd = async () => {
      if (!name.trim() || !role.trim()) {
        Alert.alert('Required', 'Name and role are required.');
        return;
      }
      if (!profile?.gym_id) return;
      setSaving(true);
      const { error } = await supabase.from('staff').insert({
        gym_id:    profile.gym_id,
        full_name: name.trim(),
        role:      role.trim(),
        shift,
        phone:     phone.trim() || null,
        salary:    salary.trim() || null,
        status:    'active',
      });
      setSaving(false);
      if (error) { Alert.alert('Error', error.message); return; }
      setAddModal(false);
      resetForm();
      fetchStaff(true);
    };

    const handleRemove = async (id: string) => {
      Alert.alert('Remove Staff', 'Are you sure you want to remove this staff member?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove', style: 'destructive',
          onPress: async () => {
            await supabase.from('staff').delete().eq('id', id);
            setSelected(null);
            fetchStaff(true);
          },
        },
      ]);
    };

    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScrollView style={styles.container} contentContainerStyle={styles.scroll}
  showsVerticalScrollIndicator={false}>

          {/* Hero */}
          <FadeInView delay={0}>
            <View style={styles.hero}>
              <View style={styles.heroGlow} />
              <View style={{ flex: 1 }}>
                <Text style={styles.heroMicro}>STAFF MANAGEMENT</Text>
                <Text style={styles.heroTitle}>{staff.length} MEMBERS</Text>
                <Text style={styles.heroSub}>Manage your gym team</Text>
              </View>
              <View style={styles.heroStats}>
                <View style={styles.heroStatItem}>
                  <Text style={styles.heroStatVal}>{active}</Text>
                  <Text style={[styles.heroStatLabel, { color: Colors.green }]}>ACTIVE</Text>
                </View>
                <View style={styles.heroStatDivider} />
                <View style={styles.heroStatItem}>
                  <Text style={styles.heroStatVal}>{onLeave}</Text>
                  <Text style={[styles.heroStatLabel, { color: Colors.orange }]}>LEAVE</Text>
                </View>
              </View>
            </View>
          </FadeInView>

          {/* Role Filter */}
          <FadeInView delay={60}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
  contentContainerStyle={styles.chipRow}>
              {roles.map(r => (
                <Pressable key={r} style={[styles.chip, filter === r && styles.chipActive]} onPress={() =>      
  setFilter(r)}>
                  <Text style={[styles.chipText, filter === r &&
  styles.chipTextActive]}>{r.toUpperCase()}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </FadeInView>

          <Text style={styles.sectionLabel}>
            {loading ? 'LOADING...' : `${filtered.length} STAFF${filter !== 'All' ? ` — ${filter.toUpperCase()}`
   : ''}`}
          </Text>

          {loading ? (
            <ActivityIndicator color={Colors.accent} size="large" style={{ marginTop: 40 }} />
          ) : filtered.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>👨‍💼</Text>
              <Text style={styles.emptyTitle}>{staff.length === 0 ? 'No staff yet' : 'No match'}</Text>
              <Text style={styles.emptyDesc}>{staff.length === 0 ? 'Add your first staff member below' : 'Try a different filter'}</Text>
            </View>
          ) : (
            filtered.map((member, i) => {
              const meta    = statusMeta[member.status] ?? statusMeta['active'];
              const color   = getColor(staff.indexOf(member));
              const initials = getInitials(member.full_name);
              return (
                <FadeInView key={member.id} delay={120 + i * 55}>
                  <AnimatedPressable style={styles.card} scaleDown={0.97} onPress={() => setSelected(member)}>  
                    <View style={[styles.cardAccent, { backgroundColor: color }]} />
                    <View style={[styles.avatar, { backgroundColor: color + '20', borderColor: color + '50' }]}>
                      <Text style={[styles.avatarText, { color }]}>{initials}</Text>
                    </View>
                    <View style={styles.cardInfo}>
                      <View style={styles.cardRow}>
                        <Text style={styles.cardName}>{member.full_name}</Text>
                        <View style={[styles.statusPill, { backgroundColor: meta.color + '18' }]}>
                          <View style={[styles.statusDot, { backgroundColor: meta.color }]} />
                          <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
                        </View>
                      </View>
                      <Text style={styles.cardRole}>{member.role}</Text>
                      <View style={styles.cardMeta}>
                        <MaterialCommunityIcons name={shiftIcon[member.shift] ?? 'clock-outline'} size={11}     
  color={Colors.textMuted} />
                        <Text style={styles.cardMetaText}>{member.shift}</Text>
                        {member.sessions > 0 && (
                          <>
                            <Text style={styles.cardMetaDot}>·</Text>
                            <Text style={styles.cardMetaText}>{member.sessions} sessions</Text>
                          </>
                        )}
                        {member.rating > 0 && (
                          <>
                            <Text style={styles.cardMetaDot}>·</Text>
                            <MaterialCommunityIcons name="star" size={11} color={Colors.accent} />
                            <Text style={[styles.cardMetaText, { color: Colors.accent }]}>{member.rating}</Text>
                          </>
                        )}
                      </View>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.textMuted} />
                  </AnimatedPressable>
                </FadeInView>
              );
            })
          )}

          {/* Add Button */}
          <FadeInView delay={520}>
            <AnimatedPressable style={styles.addBtn} scaleDown={0.97} onPress={() => setAddModal(true)}>        
              <MaterialCommunityIcons name="plus" size={18} color={Colors.bg} />
              <Text style={styles.addBtnText}>ADD STAFF MEMBER</Text>
            </AnimatedPressable>
          </FadeInView>

          <View style={{ height: 32 }} />
        </ScrollView>

        {/* Detail Modal */}
        <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}> 
          <Pressable style={styles.backdrop} onPress={() => setSelected(null)} />
          {selected && (() => {
            const color    = getColor(staff.indexOf(selected));
            const initials = getInitials(selected.full_name);
            const meta     = statusMeta[selected.status] ?? statusMeta['active'];
            return (
              <View style={styles.sheet}>
                <View style={styles.handle} />
                <View style={styles.sheetHeader}>
                  <View style={[styles.sheetAvatar, { backgroundColor: color + '20', borderColor: color }]}>    
                    <Text style={[styles.sheetAvatarText, { color }]}>{initials}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sheetName}>{selected.full_name}</Text>
                    <Text style={styles.sheetRole}>{selected.role}</Text>
                  </View>
                  <Pressable style={styles.closeBtn} onPress={() => setSelected(null)}>
                    <MaterialCommunityIcons name="close" size={18} color={Colors.textMuted} />
                  </Pressable>
                </View>

                <View style={styles.sheetStats}>
                  {[
                    { label: 'SALARY',   val: selected.salary ?? '—',           icon: 'cash-multiple'    as     
  IconName },
                    { label: 'SESSIONS', val: String(selected.sessions),         icon: 'dumbbell'         as    
  IconName },
                    { label: 'RATING',   val: selected.rating > 0 ? `${selected.rating} ★` : '—', icon:
  'star-outline' as IconName },
                    { label: 'SINCE',    val: new Date(selected.joined_date).toLocaleDateString('en-IN', {      
  month: 'short', year: 'numeric' }), icon: 'calendar-outline' as IconName },
                  ].map(s => (
                    <View key={s.label} style={styles.sheetStat}>
                      <MaterialCommunityIcons name={s.icon} size={16} color={color} />
                      <Text style={styles.sheetStatVal}>{s.val}</Text>
                      <Text style={styles.sheetStatLabel}>{s.label}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.sheetDetail}>
                  {[
                    { label: 'SHIFT',  val: selected.shift,    icon: shiftIcon[selected.shift] ??
  'clock-outline' as IconName },
                    { label: 'PHONE',  val: selected.phone ?? '—', icon: 'phone-outline' as IconName },
                    { label: 'STATUS', val: meta.label,         icon: 'circle-outline'  as IconName },
                  ].map((d, i) => (
                    <View key={d.label} style={[styles.detailRow, i < 2 && { borderBottomWidth: 1,
  borderBottomColor: Colors.border }]}>
                      <MaterialCommunityIcons name={d.icon} size={15} color={Colors.textMuted} />
                      <Text style={styles.detailLabel}>{d.label}</Text>
                      <Text style={styles.detailVal}>{d.val}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.sheetActions}>
                  <AnimatedPressable
                    style={[styles.actionBtn, { backgroundColor: Colors.green + '18', borderColor: Colors.green 
  + '30' }]}
                    scaleDown={0.95}
                    onPress={() => selected.phone && Linking.openURL(`tel:${selected.phone}`)}
                  >
                    <MaterialCommunityIcons name="phone" size={16} color={Colors.green} />
                    <Text style={[styles.actionBtnText, { color: Colors.green }]}>CALL</Text>
                  </AnimatedPressable>
                  <AnimatedPressable
                    style={[styles.actionBtn, { backgroundColor: Colors.red + '18', borderColor: Colors.red +   
  '30' }]}
                    scaleDown={0.95}
                    onPress={() => handleRemove(selected.id)}
                  >
                    <MaterialCommunityIcons name="account-remove-outline" size={16} color={Colors.red} />       
                    <Text style={[styles.actionBtnText, { color: Colors.red }]}>REMOVE</Text>
                  </AnimatedPressable>
                </View>
              </View>
            );
          })()}
        </Modal>

        {/* Add Modal */}
        <Modal visible={addModal} transparent animationType="slide" onRequestClose={() => { setAddModal(false); 
  resetForm(); }}>
          <Pressable style={styles.backdrop} onPress={() => { setAddModal(false); resetForm(); }} />
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <View style={styles.addModalHeader}>
              <Text style={styles.addModalTitle}>ADD STAFF MEMBER</Text>
              <Pressable style={styles.closeBtn} onPress={() => { setAddModal(false); resetForm(); }}>
                <MaterialCommunityIcons name="close" size={18} color={Colors.textMuted} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>FULL NAME *</Text>
                <TextInput style={styles.formInput} value={name} onChangeText={setName} placeholder="e.g. Arjun 
  Verma" placeholderTextColor={Colors.textMuted} />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>ROLE *</Text>
                <TextInput style={styles.formInput} value={role} onChangeText={setRole} placeholder="e.g.       
  Trainer, Receptionist" placeholderTextColor={Colors.textMuted} />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>SHIFT</Text>
                <View style={styles.shiftRow}>
                  {SHIFTS.map(s => (
                    <Pressable key={s} style={[styles.shiftChip, shift === s && styles.shiftChipActive]}        
  onPress={() => setShift(s)}>
                      <Text style={[styles.shiftChipText, shift === s && styles.shiftChipTextActive]}>{s}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>PHONE</Text>
                <TextInput style={styles.formInput} value={phone} onChangeText={setPhone} placeholder="e.g.     
  9876543210" placeholderTextColor={Colors.textMuted} keyboardType="phone-pad" />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>SALARY</Text>
                <TextInput style={styles.formInput} value={salary} onChangeText={setSalary} placeholder="e.g.   
  ₹22,000" placeholderTextColor={Colors.textMuted} />
              </View>

              <AnimatedPressable style={[styles.addBtn, saving && { opacity: 0.6 }]} scaleDown={0.97}
  onPress={handleAdd} disabled={saving}>
                {saving
                  ? <ActivityIndicator color={Colors.bg} size="small" />
                  : <Text style={styles.addBtnText}>ADD STAFF MEMBER</Text>
                }
              </AnimatedPressable>

              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  const styles = StyleSheet.create({
    safe:      { flex: 1, backgroundColor: Colors.bg },
    container: { flex: 1 },
    scroll:    { paddingHorizontal: 16, paddingBottom: 24, paddingTop: 16 },

    hero:           { backgroundColor: Colors.bgCard, borderRadius: 20, padding: 20, flexDirection: 'row',      
  alignItems: 'center', gap: 12, borderWidth: 1, borderColor: Colors.accent + '20', overflow: 'hidden',
  marginBottom: 16 },
    heroGlow:       { position: 'absolute', top: -30, left: -20, width: 100, height: 100, borderRadius: 50,     
  backgroundColor: Colors.accentGlow },
    heroMicro:      { fontFamily: Fonts.medium, fontSize: 9, color: Colors.accent, letterSpacing: 1.5 },        
    heroTitle:      { fontFamily: Fonts.condensedBold, fontSize: 30, color: Colors.text, letterSpacing: 0.5 },  
    heroSub:        { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 2 },
    heroStats:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
    heroStatItem:   { alignItems: 'center', gap: 2 },
    heroStatVal:    { fontFamily: Fonts.condensedBold, fontSize: 22, color: Colors.text },
    heroStatLabel:  { fontFamily: Fonts.bold, fontSize: 8, letterSpacing: 1 },
    heroStatDivider:{ width: 1, height: 28, backgroundColor: Colors.border },

    chipRow:        { gap: 8, paddingBottom: 16 },
    chip:           { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor:
  Colors.bgCard, borderWidth: 1, borderColor: Colors.border },
    chipActive:     { backgroundColor: Colors.accentMuted, borderColor: Colors.accent },
    chipText:       { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted, letterSpacing: 0.8 },       
    chipTextActive: { color: Colors.accent },

    sectionLabel: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted, letterSpacing: 1.8,
  marginBottom: 10, marginTop: 4 },

    empty:      { alignItems: 'center', paddingVertical: 48 },
    emptyEmoji: { fontSize: 40, marginBottom: 12 },
    emptyTitle: { fontFamily: Fonts.bold, fontSize: 16, color: Colors.text },
    emptyDesc:  { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, marginTop: 4 },

    card:         { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.bgCard,        
  borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', marginBottom: 8
   },
    cardAccent:   { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
    avatar:       { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center',    
  borderWidth: 2 },
    avatarText:   { fontFamily: Fonts.condensedBold, fontSize: 16, letterSpacing: 0.5 },
    cardInfo:     { flex: 1 },
    cardRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2
   },
    cardName:     { fontFamily: Fonts.bold, fontSize: 14, color: Colors.text },
    cardRole:     { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginBottom: 4 },        
    cardMeta:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
    cardMetaText: { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted },
    cardMetaDot:  { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted },
    statusPill:   { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 20, paddingHorizontal: 8, 
  paddingVertical: 3 },
    statusDot:    { width: 5, height: 5, borderRadius: 3 },
    statusText:   { fontFamily: Fonts.bold, fontSize: 8, letterSpacing: 0.8 },

    addBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor:
   Colors.accent, borderRadius: 12, paddingVertical: 14, marginTop: 8 },
    addBtnText: { fontFamily: Fonts.bold, fontSize: 12, color: Colors.bg, letterSpacing: 1.2 },

    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
    sheet:    { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.bgCard,
  borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingBottom: 36, paddingTop: 12,  
  maxHeight: '90%' },
    handle:   { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center',     
  marginBottom: 20 },
    closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.bgElevated, justifyContent:    
  'center', alignItems: 'center' },

    sheetHeader:     { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
    sheetAvatar:     { width: 54, height: 54, borderRadius: 27, justifyContent: 'center', alignItems: 'center', 
  borderWidth: 2 },
    sheetAvatarText: { fontFamily: Fonts.condensedBold, fontSize: 20, letterSpacing: 0.5 },
    sheetName:       { fontFamily: Fonts.bold, fontSize: 18, color: Colors.text },
    sheetRole:       { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, marginTop: 2 },        

    sheetStats:    { flexDirection: 'row', backgroundColor: Colors.bgElevated, borderRadius: 14, padding: 14,   
  marginBottom: 16, gap: 4 },
    sheetStat:     { flex: 1, alignItems: 'center', gap: 3 },
    sheetStatVal:  { fontFamily: Fonts.condensedBold, fontSize: 15, color: Colors.text },
    sheetStatLabel:{ fontFamily: Fonts.bold, fontSize: 8, color: Colors.textMuted, letterSpacing: 0.8 },        

    sheetDetail: { backgroundColor: Colors.bgElevated, borderRadius: 14, overflow: 'hidden', marginBottom: 16 },
    detailRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 
  12 },
    detailLabel: { fontFamily: Fonts.medium, fontSize: 11, color: Colors.textMuted, flex: 1 },
    detailVal:   { fontFamily: Fonts.bold, fontSize: 12, color: Colors.text },

    sheetActions:  { flexDirection: 'row', gap: 8 },
    actionBtn:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,     
  borderRadius: 10, paddingVertical: 12, borderWidth: 1 },
    actionBtnText: { fontFamily: Fonts.bold, fontSize: 11, letterSpacing: 0.8 },

    addModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom:
   20 },
    addModalTitle:  { fontFamily: Fonts.condensedBold, fontSize: 22, color: Colors.text, letterSpacing: 0.5 },  

    formGroup:  { marginBottom: 16 },
    formLabel:  { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted, letterSpacing: 1.5,
  marginBottom: 8 },
    formInput:  { backgroundColor: Colors.bgElevated, borderRadius: 12, borderWidth: 1, borderColor:
  Colors.border, paddingHorizontal: 14, paddingVertical: 12, fontFamily: Fonts.regular, fontSize: 14, color:    
  Colors.text },

    shiftRow:          { flexDirection: 'row', gap: 8 },
    shiftChip:         { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: Colors.bgElevated,    
  borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
    shiftChipActive:   { backgroundColor: Colors.accentMuted, borderColor: Colors.accent },
    shiftChipText:     { fontFamily: Fonts.bold, fontSize: 10, color: Colors.textMuted },
    shiftChipTextActive: { color: Colors.accent },
  });