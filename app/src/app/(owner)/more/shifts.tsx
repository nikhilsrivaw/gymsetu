import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  Modal, TextInput, Alert,
} from 'react-native';
import { Stack, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import AnimatedPressable from '@/components/AnimatedPressable';
import FadeInView from '@/components/FadeInView';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAYS_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Day index: 0 = Monday … 6 = Sunday
function todayIndex() {
  const d = new Date().getDay(); // 0=Sun, 1=Mon...
  return d === 0 ? 6 : d - 1;
}

interface StaffMember { id: string; full_name: string; }
interface Shift {
  id: string;
  staff_id: string;
  staff_name: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

const STAFF_COLORS = ['#FF7E1D', '#22C55E', '#3B82F6', '#A78BFA', '#EC4899', '#F59E0B', '#14B8A6'];
function staffColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return STAFF_COLORS[Math.abs(hash) % STAFF_COLORS.length];
}

// Format "09:00:00" → "9:00 AM"
function fmtTime(t: string) {
  if (!t) return '';
  const [hStr, mStr] = t.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr ?? '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${ampm}`;
}

// Validate "HH:MM" input
function isValidTime(t: string) {
  return /^\d{1,2}:\d{2}$/.test(t.trim());
}

// Normalize "9:30" → "09:30:00"
function normalizeTime(t: string) {
  const [h, m] = t.trim().split(':');
  return `${String(parseInt(h)).padStart(2, '0')}:${m}:00`;
}

export default function ShiftsScreen() {
  const { profile } = useAuthStore();
  const gymId = (profile as any)?.gym_id;

  const [activeDay,  setActiveDay]  = useState(todayIndex());
  const [staff,      setStaff]      = useState<StaffMember[]>([]);
  const [shifts,     setShifts]     = useState<Shift[]>([]);
  const [loading,    setLoading]    = useState(true);

  // Add shift modal
  const [showAdd,      setShowAdd]      = useState(false);
  const [selStaff,     setSelStaff]     = useState<StaffMember | null>(null);
  const [selDay,       setSelDay]       = useState(0);
  const [startTime,    setStartTime]    = useState('06:00');
  const [endTime,      setEndTime]      = useState('14:00');
  const [saving,       setSaving]       = useState(false);
  const [showStaffPick,setShowStaffPick]= useState(false);

  // ── Fetch ─────────────────────────────────────────────────
  useFocusEffect(useCallback(() => {
    if (!gymId) return;
    let active = true;

    async function load() {
      setLoading(true);
      try {
        // Staff / trainers list
        const { data: staffData } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('gym_id', gymId)
          .in('role', ['trainer', 'staff'])
          .order('full_name');

        // Shifts for this gym
        const { data: shiftData } = await supabase
          .from('staff_shifts')
          .select('id, staff_id, day_of_week, start_time, end_time')
          .eq('gym_id', gymId)
          .order('day_of_week')
          .order('start_time');

        if (!active) return;

        const staffList: StaffMember[] = (staffData ?? []).map((s: any) => ({
          id: s.id, full_name: s.full_name,
        }));
        setStaff(staffList);

        const nameMap = Object.fromEntries(staffList.map(s => [s.id, s.full_name]));
        const shiftList: Shift[] = (shiftData ?? []).map((s: any) => ({
          id:          s.id,
          staff_id:    s.staff_id,
          staff_name:  nameMap[s.staff_id] ?? 'Unknown',
          day_of_week: s.day_of_week,
          start_time:  s.start_time,
          end_time:    s.end_time,
        }));
        setShifts(shiftList);
      } catch {
        // table may not exist yet — show empty state
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => { active = false; };
  }, [gymId]));

  // ── Shifts for active day ──────────────────────────────────
  const dayShifts = shifts.filter(s => s.day_of_week === activeDay)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  // ── Weekly summary: count shifts per day ──────────────────
  const dayCounts = DAYS.map((_, i) => shifts.filter(s => s.day_of_week === i).length);

  // ── Add shift ─────────────────────────────────────────────
  function openAdd() {
    setSelStaff(null);
    setSelDay(activeDay);
    setStartTime('06:00');
    setEndTime('14:00');
    setShowAdd(true);
  }

  async function handleSave() {
    if (!selStaff) { Alert.alert('Select a staff member'); return; }
    if (!isValidTime(startTime)) { Alert.alert('Invalid start time', 'Use HH:MM format e.g. 06:00'); return; }
    if (!isValidTime(endTime))   { Alert.alert('Invalid end time',   'Use HH:MM format e.g. 14:00'); return; }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('staff_shifts')
        .insert({
          gym_id:      gymId,
          staff_id:    selStaff.id,
          day_of_week: selDay,
          start_time:  normalizeTime(startTime),
          end_time:    normalizeTime(endTime),
          created_by:  profile?.id,
        })
        .select('id, staff_id, day_of_week, start_time, end_time')
        .single();

      if (error) throw error;

      const newShift: Shift = {
        id:          data.id,
        staff_id:    data.staff_id,
        staff_name:  selStaff.full_name,
        day_of_week: data.day_of_week,
        start_time:  data.start_time,
        end_time:    data.end_time,
      };
      setShifts(prev => [...prev, newShift]);
      setShowAdd(false);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not save shift');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(shiftId: string) {
    Alert.alert('Remove Shift', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          const { error } = await supabase
            .from('staff_shifts')
            .delete()
            .eq('id', shiftId);
          if (!error) setShifts(prev => prev.filter(s => s.id !== shiftId));
        },
      },
    ]);
  }

  // ── Who's working summary (all days at a glance) ──────────
  const staffDayCoverage = staff.map(sm => ({
    ...sm,
    days: DAYS.map((_, i) => shifts.some(s => s.staff_id === sm.id && s.day_of_week === i)),
  }));

  return (
    <>
      <Stack.Screen options={{
        title: 'Staff Duty Schedule',
        headerStyle: { backgroundColor: Colors.bg },
        headerTintColor: Colors.text,
      }} />

      <ScrollView style={s.container} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Header card ─────────────────────────────────────── */}
        <FadeInView delay={0}>
          <View style={s.headerCard}>
            <LinearGradient
              colors={['#0EA5E914', 'transparent']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill} pointerEvents="none"
            />
            <View style={s.headerIcon}>
              <MaterialCommunityIcons name="calendar-clock" size={22} color="#0EA5E9" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.headerTitle}>Staff Duty Chart</Text>
              <Text style={s.headerSub}>
                {staff.length} staff · {shifts.length} shifts this week
              </Text>
            </View>
            <AnimatedPressable style={s.addBtn} scaleDown={0.93} onPress={openAdd}>
              <MaterialCommunityIcons name="plus" size={20} color="#0EA5E9" />
            </AnimatedPressable>
          </View>
        </FadeInView>

        {/* ── Day tabs ────────────────────────────────────────── */}
        <FadeInView delay={40}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.dayTabsScroll} contentContainerStyle={s.dayTabs}>
            {DAYS.map((day, i) => (
              <AnimatedPressable
                key={day}
                style={[s.dayTab, activeDay === i && s.dayTabActive, i === todayIndex() && s.dayTabToday]}
                scaleDown={0.93}
                onPress={() => setActiveDay(i)}
              >
                <Text style={[s.dayTabText, activeDay === i && s.dayTabTextActive]}>{day}</Text>
                {dayCounts[i] > 0 && (
                  <View style={[s.dayCount, activeDay === i && s.dayCountActive]}>
                    <Text style={[s.dayCountText, activeDay === i && s.dayCountTextActive]}>
                      {dayCounts[i]}
                    </Text>
                  </View>
                )}
                {i === todayIndex() && <View style={s.todayDot} />}
              </AnimatedPressable>
            ))}
          </ScrollView>
        </FadeInView>

        {/* ── Day label ───────────────────────────────────────── */}
        <FadeInView delay={60}>
          <View style={s.dayLabelRow}>
            <Text style={s.dayLabel}>{DAYS_FULL[activeDay]}</Text>
            {activeDay === todayIndex() && (
              <View style={s.todayBadge}>
                <Text style={s.todayBadgeText}>TODAY</Text>
              </View>
            )}
            <AnimatedPressable style={s.addShiftBtn} scaleDown={0.93} onPress={openAdd}>
              <MaterialCommunityIcons name="plus" size={14} color="#0EA5E9" />
              <Text style={s.addShiftBtnText}>ADD SHIFT</Text>
            </AnimatedPressable>
          </View>
        </FadeInView>

        {/* ── Shifts for selected day ──────────────────────────── */}
        {loading ? (
          <View style={s.emptyWrap}>
            <MaterialCommunityIcons name="calendar-clock" size={40} color={Colors.textMuted} />
            <Text style={s.emptyText}>Loading schedule...</Text>
          </View>
        ) : dayShifts.length === 0 ? (
          <FadeInView delay={80}>
            <View style={s.emptyWrap}>
              <MaterialCommunityIcons name="calendar-blank-outline" size={44} color={Colors.textMuted} />
              <Text style={s.emptyTitle}>No shifts on {DAYS_FULL[activeDay]}</Text>
              <Text style={s.emptyText}>Tap ADD SHIFT to assign staff</Text>
            </View>
          </FadeInView>
        ) : (
          dayShifts.map((shift, i) => {
            const color = staffColor(shift.staff_id);
            return (
              <FadeInView key={shift.id} delay={80 + i * 40}>
                <View style={s.shiftCard}>
                  <View style={[s.shiftBar, { backgroundColor: color }]} />
                  <View style={[s.shiftAvatar, { backgroundColor: color + '20', borderColor: color + '40' }]}>
                    <Text style={[s.shiftAvatarText, { color }]}>{initials(shift.staff_name)}</Text>
                  </View>
                  <View style={s.shiftInfo}>
                    <Text style={s.shiftName}>{shift.staff_name}</Text>
                    <View style={s.shiftTimeRow}>
                      <MaterialCommunityIcons name="clock-outline" size={12} color={Colors.textMuted} />
                      <Text style={s.shiftTime}>
                        {fmtTime(shift.start_time)} — {fmtTime(shift.end_time)}
                      </Text>
                    </View>
                  </View>
                  <AnimatedPressable
                    style={s.deleteBtn}
                    scaleDown={0.9}
                    onPress={() => handleDelete(shift.id)}
                  >
                    <MaterialCommunityIcons name="trash-can-outline" size={16} color={Colors.red} />
                  </AnimatedPressable>
                </View>
              </FadeInView>
            );
          })
        )}

        {/* ── Weekly overview grid ─────────────────────────────── */}
        {staffDayCoverage.length > 0 && (
          <FadeInView delay={200}>
            <View style={s.sectionHeader}>
              <View style={[s.sectionIcon, { backgroundColor: '#0EA5E915' }]}>
                <MaterialCommunityIcons name="table" size={13} color="#0EA5E9" />
              </View>
              <Text style={s.sectionTitle}>WEEKLY OVERVIEW</Text>
              <View style={s.sectionLine} />
            </View>

            <View style={s.gridCard}>
              {/* Header row */}
              <View style={s.gridHeaderRow}>
                <View style={s.gridNameCell} />
                {DAYS.map(d => (
                  <View key={d} style={s.gridDayCell}>
                    <Text style={s.gridDayText}>{d}</Text>
                  </View>
                ))}
              </View>

              {/* Staff rows */}
              {staffDayCoverage.map((sm, i) => {
                const color = staffColor(sm.id);
                return (
                  <View
                    key={sm.id}
                    style={[s.gridRow, i < staffDayCoverage.length - 1 && s.gridRowBorder]}
                  >
                    <View style={s.gridNameCell}>
                      <Text style={s.gridName} numberOfLines={1}>{sm.full_name.split(' ')[0]}</Text>
                    </View>
                    {sm.days.map((worked, di) => (
                      <View key={di} style={s.gridDayCell}>
                        {worked ? (
                          <View style={[s.gridDot, { backgroundColor: color }]} />
                        ) : (
                          <View style={s.gridDotEmpty} />
                        )}
                      </View>
                    ))}
                  </View>
                );
              })}
            </View>
          </FadeInView>
        )}

        {/* SQL note */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Add Shift Modal ──────────────────────────────────────── */}
      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <View style={s.modalBackdrop}>
          <View style={s.modalSheet}>
            <View style={[s.modalTopBar, { backgroundColor: '#0EA5E9' }]} />

            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>ADD SHIFT</Text>
              <AnimatedPressable style={s.modalClose} scaleDown={0.9} onPress={() => setShowAdd(false)}>
                <MaterialCommunityIcons name="close" size={18} color={Colors.textMuted} />
              </AnimatedPressable>
            </View>

            <ScrollView contentContainerStyle={s.modalContent} keyboardShouldPersistTaps="handled">

              {/* Staff picker */}
              <Text style={s.fieldLabel}>STAFF MEMBER</Text>
              <AnimatedPressable
                style={[s.pickerTrigger, selStaff && s.pickerTriggerSelected]}
                scaleDown={0.97}
                onPress={() => setShowStaffPick(true)}
              >
                {selStaff ? (
                  <View style={[s.miniAvatar, { backgroundColor: staffColor(selStaff.id) + '20' }]}>
                    <Text style={[s.miniAvatarText, { color: staffColor(selStaff.id) }]}>
                      {initials(selStaff.full_name)}
                    </Text>
                  </View>
                ) : (
                  <MaterialCommunityIcons name="account-search-outline" size={18} color={Colors.textMuted} />
                )}
                <Text style={[s.pickerTriggerText, selStaff && s.pickerTriggerTextSelected]}>
                  {selStaff ? selStaff.full_name : 'Select staff member'}
                </Text>
                <MaterialCommunityIcons name="chevron-down" size={16} color={Colors.textMuted} />
              </AnimatedPressable>

              {/* Day picker */}
              <Text style={[s.fieldLabel, { marginTop: 16 }]}>DAY</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
                {DAYS.map((d, i) => (
                  <AnimatedPressable
                    key={d}
                    style={[s.dayChip, selDay === i && s.dayChipActive]}
                    scaleDown={0.93}
                    onPress={() => setSelDay(i)}
                  >
                    <Text style={[s.dayChipText, selDay === i && s.dayChipTextActive]}>{d}</Text>
                  </AnimatedPressable>
                ))}
              </ScrollView>

              {/* Time inputs */}
              <View style={s.timeRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.fieldLabel, { marginTop: 16 }]}>START TIME</Text>
                  <View style={s.timeInput}>
                    <MaterialCommunityIcons name="clock-start" size={16} color={Colors.textMuted} />
                    <TextInput
                      style={s.timeInputText}
                      value={startTime}
                      onChangeText={setStartTime}
                      placeholder="06:00"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.fieldLabel, { marginTop: 16 }]}>END TIME</Text>
                  <View style={s.timeInput}>
                    <MaterialCommunityIcons name="clock-end" size={16} color={Colors.textMuted} />
                    <TextInput
                      style={s.timeInputText}
                      value={endTime}
                      onChangeText={setEndTime}
                      placeholder="14:00"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>

              <Text style={s.timehint}>Enter time in 24-hour format e.g. 06:00, 14:30, 21:00</Text>

              {/* Save button */}
              <AnimatedPressable
                style={[s.saveBtn, saving && { opacity: 0.6 }]}
                scaleDown={0.97}
                onPress={handleSave}
              >
                <LinearGradient
                  colors={['#0EA5E9', '#0284C7']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
                <MaterialCommunityIcons name={saving ? 'loading' : 'check'} size={17} color="#fff" />
                <Text style={s.saveBtnText}>{saving ? 'SAVING...' : 'SAVE SHIFT'}</Text>
              </AnimatedPressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Staff Picker ─────────────────────────────────────────── */}
      <Modal visible={showStaffPick} transparent animationType="slide" onRequestClose={() => setShowStaffPick(false)}>
        <View style={s.modalBackdrop}>
          <View style={[s.modalSheet, { maxHeight: '60%' }]}>
            <View style={[s.modalTopBar, { backgroundColor: '#0EA5E9' }]} />
            <Text style={[s.modalTitle, { padding: 16, paddingBottom: 8 }]}>SELECT STAFF</Text>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}>
              {staff.length === 0 ? (
                <View style={s.emptyWrap}>
                  <Text style={s.emptyText}>No trainers/staff found. Add trainers first.</Text>
                </View>
              ) : staff.map((sm, i) => {
                const color = staffColor(sm.id);
                return (
                  <AnimatedPressable
                    key={sm.id}
                    style={[s.staffPickRow, i < staff.length - 1 && s.staffPickRowBorder]}
                    scaleDown={0.97}
                    onPress={() => { setSelStaff(sm); setShowStaffPick(false); }}
                  >
                    <View style={[s.miniAvatar, { backgroundColor: color + '20', borderColor: color + '35' }]}>
                      <Text style={[s.miniAvatarText, { color }]}>{initials(sm.full_name)}</Text>
                    </View>
                    <Text style={s.staffPickName}>{sm.full_name}</Text>
                    {selStaff?.id === sm.id && (
                      <MaterialCommunityIcons name="check-circle" size={18} color={Colors.green} />
                    )}
                  </AnimatedPressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll:    { paddingHorizontal: 16, paddingTop: 8 },

  // Header
  headerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.bgCard, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border,
    padding: 16, marginBottom: 16, overflow: 'hidden',
  },
  headerIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#0EA5E914', borderWidth: 1, borderColor: '#0EA5E930',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontFamily: Fonts.condensedBold, fontSize: 17, color: Colors.text },
  headerSub:   { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  addBtn: {
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: '#0EA5E915', borderWidth: 1, borderColor: '#0EA5E930',
    justifyContent: 'center', alignItems: 'center',
  },

  // Day tabs
  dayTabsScroll:  { marginBottom: 12 },
  dayTabs:        { gap: 8, paddingRight: 8 },
  dayTab: {
    alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 12, backgroundColor: Colors.bgCard,
    borderWidth: 1, borderColor: Colors.border, minWidth: 54,
  },
  dayTabActive:  { backgroundColor: '#0EA5E920', borderColor: '#0EA5E960' },
  dayTabToday:   { borderColor: Colors.accent + '50' },
  dayTabText:    { fontFamily: Fonts.condensedBold, fontSize: 13, color: Colors.textMuted },
  dayTabTextActive: { color: '#0EA5E9' },
  dayCount:      { marginTop: 4, backgroundColor: Colors.bgElevated, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1 },
  dayCountActive:{ backgroundColor: '#0EA5E925' },
  dayCountText:  { fontFamily: Fonts.condensedBold, fontSize: 10, color: Colors.textMuted },
  dayCountTextActive: { color: '#0EA5E9' },
  todayDot:      { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.accent, marginTop: 3 },

  // Day label row
  dayLabelRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  dayLabel:     { fontFamily: Fonts.condensedBold, fontSize: 20, color: Colors.text, flex: 1 },
  todayBadge:   { backgroundColor: Colors.accent + '15', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: Colors.accent + '30' },
  todayBadgeText:{ fontFamily: Fonts.condensedBold, fontSize: 9, color: Colors.accent, letterSpacing: 1 },
  addShiftBtn:  { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#0EA5E915', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: '#0EA5E930' },
  addShiftBtnText:{ fontFamily: Fonts.condensedBold, fontSize: 11, color: '#0EA5E9', letterSpacing: 0.8 },

  // Shift card
  shiftCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.bgCard, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border,
    paddingRight: 12, marginBottom: 10, overflow: 'hidden',
  },
  shiftBar:       { width: 3, height: '100%', position: 'absolute', left: 0, top: 0, bottom: 0 },
  shiftAvatar:    { width: 42, height: 42, borderRadius: 11, borderWidth: 1, justifyContent: 'center', alignItems: 'center', marginLeft: 12 },
  shiftAvatarText:{ fontFamily: Fonts.condensedBold, fontSize: 15 },
  shiftInfo:      { flex: 1, paddingVertical: 14 },
  shiftName:      { fontFamily: Fonts.bold, fontSize: 15, color: Colors.text },
  shiftTimeRow:   { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  shiftTime:      { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted },
  deleteBtn:      { width: 32, height: 32, borderRadius: 9, backgroundColor: Colors.red + '12', justifyContent: 'center', alignItems: 'center' },

  // Empty
  emptyWrap:  { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyTitle: { fontFamily: Fonts.condensedBold, fontSize: 16, color: Colors.text },
  emptyText:  { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, textAlign: 'center' },

  // Section header
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20, marginBottom: 10 },
  sectionIcon:   { width: 22, height: 22, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  sectionTitle:  { fontFamily: Fonts.condensedBold, fontSize: 11, color: Colors.textMuted, letterSpacing: 1.5 },
  sectionLine:   { flex: 1, height: 1, backgroundColor: Colors.border },

  // Weekly grid
  gridCard:      { backgroundColor: Colors.bgCard, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', marginBottom: 8 },
  gridHeaderRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border, paddingVertical: 10, paddingHorizontal: 14 },
  gridRow:       { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 14 },
  gridRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  gridNameCell:  { width: 72 },
  gridDayCell:   { flex: 1, alignItems: 'center' },
  gridDayText:   { fontFamily: Fonts.condensedBold, fontSize: 11, color: Colors.textMuted, letterSpacing: 0.5 },
  gridName:      { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textSub },
  gridDot:       { width: 10, height: 10, borderRadius: 5 },
  gridDotEmpty:  { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.bgElevated, borderWidth: 1, borderColor: Colors.border },

  // Modal
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.65)' },
  modalSheet: {
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderWidth: 1, borderColor: Colors.border,
    overflow: 'hidden',
  },
  modalTopBar: { height: 4 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  modalTitle:  { fontFamily: Fonts.condensedBold, fontSize: 15, color: Colors.text, letterSpacing: 1 },
  modalClose:  { width: 30, height: 30, borderRadius: 9, backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  modalContent:{ padding: 20, paddingTop: 8, paddingBottom: 36 },

  // Form fields
  fieldLabel:    { fontFamily: Fonts.condensedBold, fontSize: 11, color: Colors.textMuted, letterSpacing: 1, marginBottom: 8 },
  pickerTrigger: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.bgElevated, borderRadius: 11, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 13 },
  pickerTriggerSelected: { borderColor: '#0EA5E950', backgroundColor: '#0EA5E908' },
  pickerTriggerText:     { flex: 1, fontFamily: Fonts.regular, fontSize: 14, color: Colors.textMuted },
  pickerTriggerTextSelected: { color: Colors.text, fontFamily: Fonts.bold },

  dayChip:         { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, backgroundColor: Colors.bgElevated, borderWidth: 1, borderColor: Colors.border },
  dayChipActive:   { backgroundColor: '#0EA5E920', borderColor: '#0EA5E960' },
  dayChipText:     { fontFamily: Fonts.condensedBold, fontSize: 12, color: Colors.textMuted },
  dayChipTextActive:{ color: '#0EA5E9' },

  timeRow:   { flexDirection: 'row', gap: 12 },
  timeInput: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.bgElevated, borderRadius: 11, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 13, paddingVertical: 12 },
  timeInputText: { flex: 1, fontFamily: Fonts.regular, fontSize: 14, color: Colors.text },
  timehint:  { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 8, marginBottom: 20 },

  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, borderRadius: 14, overflow: 'hidden' },
  saveBtnText: { fontFamily: Fonts.condensedBold, fontSize: 14, color: '#fff', letterSpacing: 0.8 },

  // Staff pick
  miniAvatar:     { width: 36, height: 36, borderRadius: 10, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  miniAvatarText: { fontFamily: Fonts.condensedBold, fontSize: 13 },
  staffPickRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13 },
  staffPickRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  staffPickName:  { flex: 1, fontFamily: Fonts.bold, fontSize: 14, color: Colors.text },
});
