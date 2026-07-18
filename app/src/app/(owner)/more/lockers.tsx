import { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, FlatList, Pressable, Modal,
  TextInput as RNTextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Stack, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import FadeInView from '@/components/FadeInView';
import AnimatedPressable from '@/components/AnimatedPressable';

interface Locker {
  id: string;
  locker_number: string;
  member_id: string | null;
  member_name: string | null;
  assigned_at: string | null;
}
interface Member { id: string; full_name: string; status: string }

export default function LockersScreen() {
  const { profile, activeGymId, branches } = useAuthStore();

  const [lockers, setLockers] = useState<Locker[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  const [addOpen, setAddOpen]   = useState(false);
  const [addMode, setAddMode]   = useState<'single' | 'bulk'>('single');
  const [singleNum, setSingleNum] = useState('');
  const [bulkFrom, setBulkFrom] = useState('1');
  const [bulkTo, setBulkTo]     = useState('20');
  const [bulkPrefix, setBulkPrefix] = useState('');
  const [saving, setSaving]     = useState(false);
  const [addError, setAddError] = useState('');

  const [assignFor, setAssignFor] = useState<Locker | null>(null);
  const [memberSearch, setMemberSearch] = useState('');

  const gymId = useCallback(() => {
    const main = (profile as any)?.gym_id;
    return activeGymId === 'all' ? main : (activeGymId ?? main);
  }, [profile, activeGymId]);

  const getGymIds = useCallback((): string[] => {
    const main = (profile as any)?.gym_id;
    if (!main) return [];
    if (activeGymId === 'all') return branches.length > 0 ? branches.map(b => b.id) : [main];
    return [activeGymId ?? main];
  }, [profile, activeGymId, branches]);

  const fetchData = useCallback(async () => {
    const gymIds = getGymIds();
    if (gymIds.length === 0) { setLoading(false); return; }
    setLoading(true);
    const [lockRes, memRes] = await Promise.all([
      supabase.from('lockers')
        .select('id, locker_number, member_id, assigned_at, profiles(full_name)')
        .in('gym_id', gymIds).order('locker_number'),
      supabase.from('profiles')
        .select('id, full_name, status')
        .in('gym_id', gymIds).eq('role', 'member')
        .in('status', ['active', 'expired', 'frozen']).order('full_name'),
    ]);
    const rows: Locker[] = (lockRes.data ?? []).map((l: any) => ({
      id: l.id, locker_number: l.locker_number, member_id: l.member_id,
      assigned_at: l.assigned_at,
      member_name: Array.isArray(l.profiles) ? l.profiles[0]?.full_name : l.profiles?.full_name ?? null,
    }));
    // natural sort so "2" comes before "10"
    rows.sort((a, b) => a.locker_number.localeCompare(b.locker_number, undefined, { numeric: true }));
    setLockers(rows);
    setMembers((memRes.data ?? []) as Member[]);
    setLoading(false);
  }, [getGymIds]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const occupied = lockers.filter(l => l.member_id).length;
  const free     = lockers.length - occupied;
  const memberLockerMap = useMemo(() => {
    const m: Record<string, string> = {};
    lockers.forEach(l => { if (l.member_id) m[l.member_id] = l.locker_number; });
    return m;
  }, [lockers]);

  // ── Add locker(s) ───────────────────────────────────────────────────────
  const openAdd = () => { setSingleNum(''); setBulkFrom('1'); setBulkTo('20'); setBulkPrefix(''); setAddError(''); setAddOpen(true); };

  const saveLockers = async () => {
    setAddError('');
    const gid = gymId();
    if (!gid) return;
    const existing = new Set(lockers.map(l => l.locker_number.toLowerCase()));
    let toAdd: string[] = [];

    if (addMode === 'single') {
      const n = singleNum.trim();
      if (!n) { setAddError('Enter a locker number.'); return; }
      if (existing.has(n.toLowerCase())) { setAddError(`Locker "${n}" already exists.`); return; }
      toAdd = [n];
    } else {
      const from = parseInt(bulkFrom, 10), to = parseInt(bulkTo, 10);
      if (isNaN(from) || isNaN(to) || from > to) { setAddError('Enter a valid range (from ≤ to).'); return; }
      if (to - from > 200) { setAddError('Max 200 lockers at once.'); return; }
      const pfx = bulkPrefix.trim();
      for (let i = from; i <= to; i++) {
        const num = pfx ? `${pfx}${i}` : String(i);
        if (!existing.has(num.toLowerCase())) toAdd.push(num);
      }
      if (toAdd.length === 0) { setAddError('All lockers in that range already exist.'); return; }
    }

    setSaving(true);
    const { error } = await supabase.from('lockers').insert(
      toAdd.map(num => ({ gym_id: gid, locker_number: num }))
    );
    setSaving(false);
    if (error) { setAddError(error.message); return; }
    setAddOpen(false);
    fetchData();
  };

  // ── Assign / free ───────────────────────────────────────────────────────
  const assignMember = async (member: Member) => {
    if (!assignFor) return;
    // If this member already holds another locker, block (one locker per member).
    const held = memberLockerMap[member.id];
    if (held && held !== assignFor.locker_number) {
      Alert.alert('Already has a locker', `${member.full_name} is already on locker ${held}. Free that first.`);
      return;
    }
    const { error } = await supabase.from('lockers')
      .update({ member_id: member.id, assigned_at: new Date().toISOString() })
      .eq('id', assignFor.id);
    if (error) { Alert.alert('Error', error.message); return; }
    setAssignFor(null); setMemberSearch('');
    fetchData();
  };

  const freeLocker = (l: Locker) => {
    Alert.alert('Free this locker?', `Locker ${l.locker_number} is with ${l.member_name}. Free it?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Free', style: 'destructive', onPress: async () => {
        await supabase.from('lockers').update({ member_id: null, assigned_at: null }).eq('id', l.id);
        fetchData();
      } },
    ]);
  };

  const deleteLocker = (l: Locker) => {
    Alert.alert('Delete locker?', `Remove locker ${l.locker_number} entirely?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await supabase.from('lockers').delete().eq('id', l.id);
        fetchData();
      } },
    ]);
  };

  const onLockerPress = (l: Locker) => {
    if (l.member_id) freeLocker(l);
    else setAssignFor(l);
  };

  const filteredMembers = members.filter(m =>
    m.full_name.toLowerCase().includes(memberSearch.trim().toLowerCase()));

  if (loading) return (
    <>
      <Stack.Screen options={{ title: 'Lockers' }} />
      <View style={s.center}><ActivityIndicator color={Colors.accent} /></View>
    </>
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Lockers' }} />
      <View style={s.container}>
        {/* Summary */}
        <View style={s.summaryRow}>
          <View style={s.summaryBox}>
            <Text style={s.summaryVal}>{lockers.length}</Text>
            <Text style={s.summaryLbl}>TOTAL</Text>
          </View>
          <View style={[s.summaryBox, { borderColor: Colors.red + '30' }]}>
            <Text style={[s.summaryVal, { color: Colors.red }]}>{occupied}</Text>
            <Text style={s.summaryLbl}>OCCUPIED</Text>
          </View>
          <View style={[s.summaryBox, { borderColor: Colors.green + '30' }]}>
            <Text style={[s.summaryVal, { color: Colors.green }]}>{free}</Text>
            <Text style={s.summaryLbl}>FREE</Text>
          </View>
        </View>

        {lockers.length === 0 ? (
          <FadeInView delay={60}>
            <View style={s.emptyCard}>
              <View style={s.emptyIcon}><MaterialCommunityIcons name="locker-multiple" size={26} color={Colors.accent} /></View>
              <Text style={s.emptyTitle}>Abhi koi locker nahi hai</Text>
              <Text style={s.emptyDesc}>
                Apne gym ke lockers add karo — phir members ko ek-ek locker assign kar sakte ho aur free hone pe wapas le sakte ho.
              </Text>
              <AnimatedPressable style={s.emptyCta} scaleDown={0.97} onPress={openAdd}>
                <MaterialCommunityIcons name="plus" size={18} color="#fff" />
                <Text style={s.emptyCtaText}>Add lockers</Text>
              </AnimatedPressable>
            </View>
          </FadeInView>
        ) : (
          <FlatList
            data={lockers}
            keyExtractor={l => l.id}
            numColumns={3}
            contentContainerStyle={s.grid}
            columnWrapperStyle={{ gap: 10 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const taken = !!item.member_id;
              const c = taken ? Colors.red : Colors.green;
              return (
                <Pressable
                  style={[s.locker, { borderColor: c + '45', backgroundColor: c + '10' }]}
                  onPress={() => onLockerPress(item)}
                  onLongPress={() => deleteLocker(item)}
                >
                  <View style={s.lockerTop}>
                    <MaterialCommunityIcons name={taken ? 'lock' : 'lock-open-variant-outline'} size={15} color={c} />
                    <Text style={[s.lockerNum, { color: c }]}>{item.locker_number}</Text>
                  </View>
                  {taken ? (
                    <Text style={s.lockerName} numberOfLines={2}>{item.member_name}</Text>
                  ) : (
                    <Text style={s.lockerFree}>Tap to assign</Text>
                  )}
                </Pressable>
              );
            }}
            ListFooterComponent={<Text style={s.hint}>Tap a locker to assign or free it · long-press to delete</Text>}
          />
        )}

        {/* Add FAB */}
        {lockers.length > 0 && (
          <AnimatedPressable style={s.fab} scaleDown={0.9} onPress={openAdd}>
            <MaterialCommunityIcons name="plus" size={26} color="#fff" />
          </AnimatedPressable>
        )}
      </View>

      {/* ── Add lockers modal ── */}
      <Modal visible={addOpen} transparent animationType="slide" onRequestClose={() => setAddOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.modalWrap}>
          <Pressable style={s.backdrop} onPress={() => setAddOpen(false)} />
          <View style={s.sheet}>
            <View style={s.sheetHead}>
              <Text style={s.sheetTitle}>ADD LOCKERS</Text>
              <Pressable onPress={() => setAddOpen(false)}><Text style={s.closeX}>✕</Text></Pressable>
            </View>

            <View style={s.modeRow}>
              {(['single', 'bulk'] as const).map(mode => (
                <Pressable key={mode} style={[s.modeChip, addMode === mode && s.modeChipOn]} onPress={() => { setAddMode(mode); setAddError(''); }}>
                  <Text style={[s.modeText, addMode === mode && s.modeTextOn]}>{mode === 'single' ? 'One locker' : 'A range'}</Text>
                </Pressable>
              ))}
            </View>

            {addMode === 'single' ? (
              <View style={s.field}>
                <Text style={s.fieldLbl}>LOCKER NUMBER</Text>
                <RNTextInput style={s.input} value={singleNum} onChangeText={t => { setSingleNum(t); setAddError(''); }}
                  placeholder="e.g. A-12" placeholderTextColor={Colors.textMuted} />
              </View>
            ) : (
              <>
                <View style={s.field}>
                  <Text style={s.fieldLbl}>PREFIX (OPTIONAL)</Text>
                  <RNTextInput style={s.input} value={bulkPrefix} onChangeText={t => { setBulkPrefix(t); setAddError(''); }}
                    placeholder="e.g. A-  (makes A-1, A-2, …)" placeholderTextColor={Colors.textMuted} />
                </View>
                <View style={s.rangeRow}>
                  <View style={[s.field, { flex: 1 }]}>
                    <Text style={s.fieldLbl}>FROM</Text>
                    <RNTextInput style={s.input} value={bulkFrom} onChangeText={t => { setBulkFrom(t); setAddError(''); }}
                      keyboardType="numeric" placeholderTextColor={Colors.textMuted} />
                  </View>
                  <View style={[s.field, { flex: 1 }]}>
                    <Text style={s.fieldLbl}>TO</Text>
                    <RNTextInput style={s.input} value={bulkTo} onChangeText={t => { setBulkTo(t); setAddError(''); }}
                      keyboardType="numeric" placeholderTextColor={Colors.textMuted} />
                  </View>
                </View>
              </>
            )}

            {!!addError && <Text style={s.errText}>{addError}</Text>}

            <AnimatedPressable style={[s.saveBtn, saving && { opacity: 0.5 }]} scaleDown={0.97} onPress={saveLockers} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={s.saveBtnText}>{addMode === 'single' ? 'ADD LOCKER' : 'ADD RANGE'}</Text>}
            </AnimatedPressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Assign member modal ── */}
      <Modal visible={!!assignFor} transparent animationType="slide" onRequestClose={() => setAssignFor(null)}>
        <View style={s.modalWrap}>
          <Pressable style={s.backdrop} onPress={() => { setAssignFor(null); setMemberSearch(''); }} />
          <View style={[s.sheet, { maxHeight: '75%' }]}>
            <View style={s.sheetHead}>
              <Text style={s.sheetTitle}>ASSIGN LOCKER {assignFor?.locker_number}</Text>
              <Pressable onPress={() => { setAssignFor(null); setMemberSearch(''); }}><Text style={s.closeX}>✕</Text></Pressable>
            </View>
            <View style={s.searchBar}>
              <MaterialCommunityIcons name="magnify" size={17} color={Colors.textMuted} />
              <RNTextInput style={s.searchInput} value={memberSearch} onChangeText={setMemberSearch}
                placeholder="Search member…" placeholderTextColor={Colors.textMuted} />
            </View>
            <FlatList
              data={filteredMembers}
              keyExtractor={m => m.id}
              keyboardShouldPersistTaps="handled"
              style={{ marginTop: 4 }}
              ListEmptyComponent={<Text style={s.noMembers}>No members found.</Text>}
              renderItem={({ item }) => {
                const held = memberLockerMap[item.id];
                return (
                  <Pressable style={s.memberRow} onPress={() => assignMember(item)}>
                    <View style={s.memberAvatar}><Text style={s.memberInitial}>{item.full_name.charAt(0).toUpperCase()}</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.memberName}>{item.full_name}</Text>
                      {held ? <Text style={s.memberHeld}>On locker {held}</Text>
                        : <Text style={s.memberStatus}>{item.status}</Text>}
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.textMuted} />
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center:    { flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center' },

  summaryRow: { flexDirection: 'row', gap: 8, padding: 16, paddingBottom: 6 },
  summaryBox: { flex: 1, backgroundColor: Colors.bgCard, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, paddingVertical: 14, alignItems: 'center' },
  summaryVal: { fontFamily: Fonts.condensedBold, fontSize: 24, color: Colors.text },
  summaryLbl: { fontFamily: Fonts.bold, fontSize: 8, color: Colors.textMuted, letterSpacing: 1, marginTop: 3 },

  grid: { padding: 16, paddingTop: 10, gap: 10 },
  locker:    { flex: 1, borderRadius: 14, borderWidth: 1, padding: 12, minHeight: 78, justifyContent: 'space-between' },
  lockerTop: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  lockerNum: { fontFamily: Fonts.condensedBold, fontSize: 15 },
  lockerName:{ fontFamily: Fonts.regular, fontSize: 11, color: Colors.text, marginTop: 6 },
  lockerFree:{ fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted, marginTop: 6 },
  hint:      { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, textAlign: 'center', marginTop: 16 },

  fab: { position: 'absolute', right: 20, bottom: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: Colors.accent, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },

  emptyCard:  { margin: 16, backgroundColor: Colors.bgCard, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, padding: 24, alignItems: 'center' },
  emptyIcon:  { width: 56, height: 56, borderRadius: 16, backgroundColor: Colors.accentMuted, borderWidth: 1, borderColor: Colors.accent + '30', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontFamily: Fonts.condensedBold, fontSize: 19, color: Colors.text, textAlign: 'center' },
  emptyDesc:  { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, marginTop: 8, textAlign: 'center', lineHeight: 20 },
  emptyCta:   { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.accent, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 24, marginTop: 22 },
  emptyCtaText:{ fontFamily: Fonts.bold, fontSize: 14, color: '#fff' },

  // modals
  modalWrap: { flex: 1, justifyContent: 'flex-end' },
  backdrop:  { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.72)' },
  sheet:     { backgroundColor: Colors.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 32, borderWidth: 1, borderColor: Colors.border },
  sheetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  sheetTitle:{ fontFamily: Fonts.condensedBold, fontSize: 18, color: Colors.text, letterSpacing: 0.5 },
  closeX:    { fontFamily: Fonts.bold, fontSize: 18, color: Colors.textMuted, paddingHorizontal: 6 },

  modeRow:   { flexDirection: 'row', gap: 8, marginBottom: 18 },
  modeChip:  { flex: 1, paddingVertical: 11, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', backgroundColor: Colors.bg },
  modeChipOn:{ borderColor: Colors.accent + '70', backgroundColor: Colors.accentMuted },
  modeText:  { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textMuted },
  modeTextOn:{ color: Colors.accent },

  field:    { marginBottom: 14 },
  fieldLbl: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted, letterSpacing: 1, marginBottom: 7 },
  input:    { backgroundColor: Colors.bgElevated, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontFamily: Fonts.regular, fontSize: 15, color: Colors.text },
  rangeRow: { flexDirection: 'row', gap: 12 },
  errText:  { fontFamily: Fonts.regular, fontSize: 12, color: Colors.red, marginBottom: 12 },

  saveBtn:     { backgroundColor: Colors.accent, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 6 },
  saveBtnText: { fontFamily: Fonts.bold, fontSize: 14, color: '#fff', letterSpacing: 1 },

  searchBar:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.bgElevated, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  searchInput:{ flex: 1, fontFamily: Fonts.regular, fontSize: 15, color: Colors.text, padding: 0 },
  noMembers:  { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, textAlign: 'center', paddingVertical: 30 },
  memberRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  memberAvatar:{ width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.accentMuted, alignItems: 'center', justifyContent: 'center' },
  memberInitial:{ fontFamily: Fonts.condensedBold, fontSize: 16, color: Colors.accent },
  memberName: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.text },
  memberStatus:{ fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 1, textTransform: 'capitalize' },
  memberHeld: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.orange, marginTop: 1 },
});
