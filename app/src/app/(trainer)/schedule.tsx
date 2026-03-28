import { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  ActivityIndicator, Modal, TextInput,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { DrawerActions } from '@react-navigation/native';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import FadeInView from '@/components/FadeInView';
import AnimatedPressable from '@/components/AnimatedPressable';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const DAYS       = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const todayIndex = (() => { const d = new Date().getDay(); return d === 0 ? 6 : d - 1; })();

const SESSION_TYPES: { label: string; icon: IconName; color: string }[] = [
  { label: 'Strength Training', icon: 'dumbbell',            color: '#3B82F6'     },
  { label: 'Cardio',            icon: 'run',                 color: Colors.green  },
  { label: 'HIIT',              icon: 'lightning-bolt',      color: '#ef4444'     },
  { label: 'Yoga',              icon: 'yoga',                color: '#8B5CF6'     },
  { label: 'Stretching',        icon: 'human-handsup',       color: '#14B8A6'     },
  { label: 'Personal Training', icon: 'account-star-outline', color: Colors.accent },
];

const STATUS_CFG: Record<string, { color: string; icon: IconName; label: string }> = {
  upcoming:  { color: Colors.accent, icon: 'clock-outline',        label: 'UPCOMING'  },
  done:      { color: Colors.green,  icon: 'check-circle-outline', label: 'DONE'      },
  cancelled: { color: Colors.red,    icon: 'close-circle-outline', label: 'CANCELLED' },
};

const WEEK_MAX = 6; // max sessions per day for bar scaling

interface AssignedMember { id: string; user_id: string; name: string; initials: string; }
interface Session {
  id: string; time: string; member_name: string; member_id: string | null;
  session_type: string; duration: string; location: string;
  status: 'upcoming' | 'done' | 'cancelled'; day_of_week: string; color: string;
}

export default function TrainerScheduleScreen() {
  const { profile } = useAuthStore();
  const insets     = useSafeAreaInsets();
  const navigation = useNavigation();

  const [selectedDay,  setSelectedDay]  = useState(todayIndex);
  const [sessions,     setSessions]     = useState<Session[]>([]);
  const [members,      setMembers]      = useState<AssignedMember[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [fetchError,   setFetchError]   = useState('');
  const [updatingId,   setUpdatingId]   = useState<string | null>(null);
  const [sheetSession, setSheetSession] = useState<Session | null>(null);

  // Add modal
  const [showAdd,     setShowAdd]     = useState(false);
  const [selMember,   setSelMember]   = useState<AssignedMember | null>(null);
  const [selType,     setSelType]     = useState(SESSION_TYPES[0]);
  const [addTime,     setAddTime]     = useState('09:00 AM');
  const [addDuration, setAddDuration] = useState('60 min');
  const [addLocation, setAddLocation] = useState('Main Floor');
  const [addSaving,   setAddSaving]   = useState(false);
  const [addError,    setAddError]    = useState('');

  useEffect(() => {
    if (!profile?.id || !profile?.gym_id) return;
    // trainer_id is on profiles, not members — query profiles first
    supabase
      .from('profiles')
      .select('id, full_name')
      .eq('gym_id', profile.gym_id)
      .eq('trainer_id', profile.id)
      .eq('role', 'member')
      .order('full_name')
      .then(async ({ data: profileRows }) => {
        if (!profileRows?.length) return;
        // get members.id for each profile (needed for session member_id)
        const { data: memberRows } = await supabase
          .from('members').select('id, user_id')
          .in('user_id', profileRows.map((p: any) => p.id));
        const userToMemberId: Record<string, string> = {};
        (memberRows ?? []).forEach((m: any) => { userToMemberId[m.user_id] = m.id; });
        setMembers(profileRows.map((p: any) => ({
          id:      userToMemberId[p.id] ?? p.id,
          user_id: p.id,
          name:    p.full_name,
          initials: p.full_name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase(),
        })));
      });
  }, [profile?.id, profile?.gym_id]);

  const fetchSessions = useCallback(async () => {
    if (!profile?.id) { setLoading(false); return; }
    setFetchError('');
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('trainer_sessions')
        .select('*')
        .eq('trainer_id', profile.id)
        .order('time');
      if (error) throw error;
      setSessions(data ?? []);
    } catch (e: any) {
      setFetchError(e.message ?? 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useFocusEffect(useCallback(() => { fetchSessions(); }, [fetchSessions]));

  const handleAdd = async () => {
    if (!selMember) { setAddError('Please select a member.'); return; }
    if (!addTime.trim()) { setAddError('Time is required.'); return; }
    setAddSaving(true); setAddError('');
    try {
      const { data, error } = await supabase
        .from('trainer_sessions')
        .insert({
          trainer_id:   profile?.id,
          gym_id:       profile?.gym_id,
          member_id:    selMember.user_id,
          member_name:  selMember.name,
          session_type: selType.label,
          time:         addTime.trim(),
          duration:     addDuration.trim() || '60 min',
          location:     addLocation.trim() || 'Main Floor',
          color:        selType.color,
          status:       'upcoming',
          day_of_week:  DAYS[selectedDay],
        })
        .select().single();
      if (error) throw error;
      setSessions(prev => [...prev, data as Session]);
      setShowAdd(false);
      setSelMember(null); setSelType(SESSION_TYPES[0]);
      setAddTime('09:00 AM'); setAddDuration('60 min'); setAddLocation('Main Floor');
    } catch (e: any) {
      setAddError(e.message ?? 'Could not add session.');
    } finally {
      setAddSaving(false);
    }
  };

  const updateStatus = async (session: Session, newStatus: 'done' | 'cancelled') => {
    setSheetSession(null);
    setSessions(prev => prev.map(s => s.id === session.id ? { ...s, status: newStatus } : s));
    setUpdatingId(session.id);
    try {
      const { error } = await supabase
        .from('trainer_sessions').update({ status: newStatus }).eq('id', session.id);
      if (error) throw error;
    } catch {
      setSessions(prev => prev.map(s => s.id === session.id ? { ...s, status: session.status } : s));
    } finally { setUpdatingId(null); }
  };

  const daySessions    = sessions.filter(s => s.day_of_week === DAYS[selectedDay]);
  const doneSessions   = daySessions.filter(s => s.status === 'done').length;
  const totalWeek      = sessions.length;
  const totalDone      = sessions.filter(s => s.status === 'done').length;
  const activeDays     = DAYS.filter(d => sessions.some(s => s.day_of_week === d)).length;

  if (loading) return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[s.fill, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={Colors.accent} size="large" />
      </View>
    </>
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[s.fill, { paddingTop: insets.top }]}>

        {/* ── Sticky top: header + day picker ── */}
        <View style={s.stickyTop}>

          {/* Header row */}
          <View style={s.topRow}>
            {/* Back / menu button */}
            <AnimatedPressable
              style={s.backBtn}
              scaleDown={0.9}
              onPress={() => {
                if (navigation.canGoBack()) navigation.goBack();
                else navigation.dispatch(DrawerActions.openDrawer());
              }}
            >
              <MaterialCommunityIcons
                name={navigation.canGoBack() ? 'arrow-left' : 'menu'}
                size={20}
                color={Colors.text}
              />
            </AnimatedPressable>

            <View style={{ flex: 1 }}>
              <Text style={s.topMicro}>TRAINER PANEL</Text>
              <Text style={s.topTitle}>SCHEDULE</Text>
            </View>

            {/* Week summary pills */}
            <View style={s.topPills}>
              <View style={s.topPill}>
                <MaterialCommunityIcons name="check-circle-outline" size={12} color={Colors.green} />
                <Text style={[s.topPillText, { color: Colors.green }]}>{totalDone} done</Text>
              </View>
              <View style={s.topPill}>
                <MaterialCommunityIcons name="calendar-month-outline" size={12} color={Colors.textMuted} />
                <Text style={s.topPillText}>{totalWeek} total</Text>
              </View>
            </View>
          </View>

          {/* Week bar mini chart + day selector */}
          <View style={s.weekRow}>
            {DAYS.map((d, i) => {
              const count      = sessions.filter(s => s.day_of_week === d).length;
              const doneCount  = sessions.filter(s => s.day_of_week === d && s.status === 'done').length;
              const isToday    = i === todayIndex;
              const isSelected = i === selectedDay;
              const barH       = count > 0 ? Math.max(6, Math.round((count / WEEK_MAX) * 36)) : 4;
              const doneH      = doneCount > 0 ? Math.round((doneCount / count) * barH) : 0;

              return (
                <AnimatedPressable
                  key={d}
                  style={[s.dayCol, isSelected && s.dayColActive]}
                  scaleDown={0.88}
                  onPress={() => setSelectedDay(i)}
                >
                  {/* Stacked bar */}
                  <View style={[s.barTrack, { height: 36 }]}>
                    {count > 0 && (
                      <View style={[s.barFill, { height: barH, backgroundColor: isSelected ? Colors.accent : Colors.border }]}>
                        {doneH > 0 && (
                          <View style={[s.barDoneOverlay, { height: doneH, backgroundColor: Colors.green }]} />
                        )}
                      </View>
                    )}
                  </View>

                  {/* Count */}
                  <Text style={[s.dayCountNum, isSelected && { color: Colors.accent }]}>
                    {count > 0 ? count : ''}
                  </Text>

                  {/* Day label */}
                  <Text style={[s.dayLabel, isSelected && s.dayLabelActive]}>{d}</Text>

                  {/* Today dot */}
                  {isToday && <View style={[s.todayDot, isSelected && { backgroundColor: '#fff' }]} />}
                </AnimatedPressable>
              );
            })}
          </View>
        </View>

        {/* ── Scrollable content ── */}
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Error */}
          {!!fetchError && (
            <View style={s.errorBanner}>
              <MaterialCommunityIcons name="alert-circle-outline" size={14} color={Colors.red} />
              <Text style={s.errorText}>{fetchError}</Text>
              <Pressable onPress={fetchSessions}>
                <Text style={s.retryText}>Retry</Text>
              </Pressable>
            </View>
          )}

          {/* Purpose info banner */}
          <FadeInView delay={0}>
            <View style={s.infoBanner}>
              <MaterialCommunityIcons name="information-outline" size={14} color="#3B82F6" />
              <Text style={s.infoText}>
                Schedule sessions for your assigned members — they'll see it on their Schedule screen.
              </Text>
            </View>
          </FadeInView>

          {/* Day header */}
          <FadeInView delay={20}>
            <View style={s.dayHeader}>
              <View style={s.dayHeaderLeft}>
                <Text style={s.dayHeaderDay}>{DAYS[selectedDay].toUpperCase()}</Text>
                {selectedDay === todayIndex && (
                  <View style={s.todayBadge}>
                    <Text style={s.todayBadgeText}>TODAY</Text>
                  </View>
                )}
              </View>
              <View style={s.dayHeaderRight}>
                <Text style={s.dayHeaderCount}>
                  {daySessions.length} session{daySessions.length !== 1 ? 's' : ''}
                  {doneSessions > 0 ? `  ·  ${doneSessions} done` : ''}
                </Text>
                <AnimatedPressable
                  style={s.addBtn}
                  scaleDown={0.94}
                  onPress={() => { setAddError(''); setSelMember(null); setShowAdd(true); }}
                >
                  <MaterialCommunityIcons name="plus" size={14} color={Colors.accent} />
                  <Text style={s.addBtnText}>ADD</Text>
                </AnimatedPressable>
              </View>
            </View>
          </FadeInView>

          {/* Sessions */}
          {daySessions.length === 0 ? (
            <FadeInView delay={40}>
              <View style={s.emptyCard}>
                <View style={s.emptyIconWrap}>
                  <MaterialCommunityIcons name="calendar-blank-outline" size={28} color={Colors.textMuted} />
                </View>
                <Text style={s.emptyTitle}>NO SESSIONS</Text>
                <Text style={s.emptySub}>Tap ADD to schedule a session for {DAYS[selectedDay]}</Text>
              </View>
            </FadeInView>
          ) : (
            <View style={s.timeline}>
              {daySessions.map((session, i) => {
                const cfg      = STATUS_CFG[session.status];
                const typeInfo = SESSION_TYPES.find(t => t.label === session.session_type);
                const color    = session.color || typeInfo?.color || Colors.accent;
                const icon     = typeInfo?.icon ?? 'dumbbell';
                const isLast   = i === daySessions.length - 1;

                return (
                  <FadeInView key={session.id} delay={i * 55}>
                    <View style={s.timelineRow}>
                      {/* Time + connector */}
                      <View style={s.timelineLeft}>
                        <Text style={s.timelineTime}>{session.time.split(' ')[0]}</Text>
                        <Text style={s.timelineAmpm}>{session.time.split(' ')[1] ?? ''}</Text>
                        {!isLast && <View style={s.timelineConnector} />}
                      </View>

                      {/* Card */}
                      <View style={{ flex: 1 }}>
                      <AnimatedPressable
                        style={[s.sessionCard, { borderColor: color + '30' }, session.status === 'done' && s.sessionCardDone]}
                        scaleDown={0.97}
                        onPress={() => setSheetSession(session)}
                      >
                        <View style={[s.sessionAccent, { backgroundColor: color }]} />

                        <View style={s.sessionContent}>
                          {/* Top */}
                          <View style={s.sessionTop}>
                            <View style={[s.sessionTypeIcon, { backgroundColor: color + '18', borderColor: color + '30' }]}>
                              <MaterialCommunityIcons name={icon} size={16} color={color} />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={[s.sessionMember, session.status === 'done' && { color: Colors.textMuted }]}>
                                {session.member_name}
                              </Text>
                              <Text style={s.sessionType}>{session.session_type}</Text>
                            </View>
                            {updatingId === session.id
                              ? <ActivityIndicator size="small" color={Colors.accent} />
                              : (
                                <View style={[s.statusBadge, { backgroundColor: cfg.color + '12', borderColor: cfg.color + '28' }]}>
                                  <MaterialCommunityIcons name={cfg.icon} size={10} color={cfg.color} />
                                  <Text style={[s.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                                </View>
                              )
                            }
                          </View>

                          {/* Meta chips */}
                          <View style={s.metaRow}>
                            <View style={s.metaChip}>
                              <MaterialCommunityIcons name="timer-outline" size={10} color={Colors.textMuted} />
                              <Text style={s.metaText}>{session.duration}</Text>
                            </View>
                            <View style={s.metaChip}>
                              <MaterialCommunityIcons name="map-marker-outline" size={10} color={Colors.textMuted} />
                              <Text style={s.metaText}>{session.location}</Text>
                            </View>
                          </View>
                        </View>
                      </AnimatedPressable>
                      </View>
                    </View>
                  </FadeInView>
                );
              })}
            </View>
          )}

          {/* Week stats */}
          <FadeInView delay={300}>
            <View style={s.weekStatsCard}>
              <Text style={s.weekStatsLabel}>THIS WEEK</Text>
              <View style={s.weekStatsRow}>
                {[
                  { val: totalWeek,  label: 'TOTAL',       color: '#3B82F6',    icon: 'calendar-month-outline' as IconName  },
                  { val: totalDone,  label: 'DONE',        color: Colors.green, icon: 'check-circle-outline' as IconName    },
                  { val: activeDays, label: 'ACTIVE DAYS', color: Colors.accent,icon: 'calendar-check-outline' as IconName  },
                  { val: members.length, label: 'MEMBERS', color: '#A78BFA',    icon: 'account-group-outline' as IconName   },
                ].map((item, i) => (
                  <View key={item.label} style={[s.weekStatItem, i < 3 && s.weekStatBorder]}>
                    <View style={[s.weekStatIcon, { backgroundColor: item.color + '14', borderColor: item.color + '25' }]}>
                      <MaterialCommunityIcons name={item.icon} size={12} color={item.color} />
                    </View>
                    <Text style={[s.weekStatVal, { color: item.color }]}>{item.val}</Text>
                    <Text style={s.weekStatLbl}>{item.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </FadeInView>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>

      {/* ── Add Session Modal ── */}
      <Modal visible={showAdd} transparent animationType="slide">
        <Pressable style={s.backdrop} onPress={() => setShowAdd(false)} />
        <View style={[s.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={s.sheetHandle} />

          {/* Sheet header */}
          <View style={s.sheetTopRow}>
            <View>
              <Text style={s.sheetTitle}>NEW SESSION</Text>
              <Text style={s.sheetSubtitle}>{DAYS[selectedDay].toUpperCase()}</Text>
            </View>
            <Pressable style={s.sheetCloseBtn} onPress={() => setShowAdd(false)}>
              <MaterialCommunityIcons name="close" size={16} color={Colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={s.sheetScroll}>

            {/* Member picker */}
            <Text style={s.fieldLabel}>SELECT MEMBER</Text>
            {members.length === 0 ? (
              <View style={s.noMembersBox}>
                <MaterialCommunityIcons name="account-off-outline" size={18} color={Colors.textMuted} />
                <Text style={s.noMembersText}>No members assigned to you</Text>
              </View>
            ) : (
              <View style={s.memberList}>
                {members.map(m => {
                  const active = selMember?.id === m.id;
                  return (
                    <Pressable
                      key={m.id}
                      style={[s.memberItem, active && s.memberItemActive]}
                      onPress={() => { setSelMember(m); setAddError(''); }}
                    >
                      <View style={[s.memberAvatar, { borderColor: active ? Colors.accent + '60' : Colors.border }]}>
                        <Text style={[s.memberInitials, { color: active ? Colors.accent : Colors.textMuted }]}>{m.initials}</Text>
                      </View>
                      <Text style={[s.memberName, active && { color: Colors.accent }]} numberOfLines={1}>{m.name}</Text>
                      {active && <MaterialCommunityIcons name="check-circle" size={16} color={Colors.accent} />}
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* Session type */}
            <Text style={[s.fieldLabel, { marginTop: 4 }]}>SESSION TYPE</Text>
            <View style={s.typeGrid}>
              {SESSION_TYPES.map(t => {
                const active = selType.label === t.label;
                return (
                  <Pressable
                    key={t.label}
                    style={[s.typeChip, active && { borderColor: t.color + '60', backgroundColor: t.color + '12' }]}
                    onPress={() => setSelType(t)}
                  >
                    <View style={[s.typeChipDot, { backgroundColor: active ? t.color : Colors.border }]} />
                    <MaterialCommunityIcons name={t.icon} size={13} color={active ? t.color : Colors.textMuted} />
                    <Text style={[s.typeChipText, active && { color: t.color }]}>{t.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Time + Duration */}
            <View style={s.fieldRow}>
              <View style={s.fieldHalf}>
                <Text style={s.fieldLabel}>TIME</Text>
                <View style={s.fieldInputWrap}>
                  <MaterialCommunityIcons name="clock-outline" size={15} color={Colors.textMuted} />
                  <TextInput
                    style={s.fieldInput}
                    value={addTime}
                    onChangeText={setAddTime}
                    placeholder="09:00 AM"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
              </View>
              <View style={s.fieldHalf}>
                <Text style={s.fieldLabel}>DURATION</Text>
                <View style={s.fieldInputWrap}>
                  <MaterialCommunityIcons name="timer-outline" size={15} color={Colors.textMuted} />
                  <TextInput
                    style={s.fieldInput}
                    value={addDuration}
                    onChangeText={setAddDuration}
                    placeholder="60 min"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
              </View>
            </View>

            {/* Location */}
            <Text style={s.fieldLabel}>LOCATION</Text>
            <View style={s.fieldInputWrap}>
              <MaterialCommunityIcons name="map-marker-outline" size={15} color={Colors.textMuted} />
              <TextInput
                style={s.fieldInput}
                value={addLocation}
                onChangeText={setAddLocation}
                placeholder="Main Floor"
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            {/* Error */}
            {!!addError && (
              <View style={s.addError}>
                <MaterialCommunityIcons name="alert-circle-outline" size={13} color={Colors.red} />
                <Text style={s.addErrorText}>{addError}</Text>
              </View>
            )}

            {/* Save */}
            <AnimatedPressable
              style={[s.saveBtn, addSaving && { opacity: 0.6 }]}
              scaleDown={0.97}
              onPress={handleAdd}
              disabled={addSaving}
            >
              <LinearGradient colors={[Colors.accent, '#C55A00']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.saveBtnInner}>
                {addSaving
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <>
                      <MaterialCommunityIcons name="calendar-plus" size={18} color="#fff" />
                      <Text style={s.saveBtnText}>SCHEDULE SESSION</Text>
                    </>
                }
              </LinearGradient>
            </AnimatedPressable>

          </ScrollView>
        </View>
      </Modal>

      {/* ── Session detail sheet ── */}
      <Modal visible={!!sheetSession} transparent animationType="slide" onRequestClose={() => setSheetSession(null)}>
        <Pressable style={s.backdrop} onPress={() => setSheetSession(null)} />
        {sheetSession && (() => {
          const cfg      = STATUS_CFG[sheetSession.status];
          const typeInfo = SESSION_TYPES.find(t => t.label === sheetSession.session_type);
          const color    = sheetSession.color || typeInfo?.color || Colors.accent;
          const icon     = typeInfo?.icon ?? 'dumbbell';
          return (
            <View style={[s.detailSheet, { paddingBottom: insets.bottom + 24 }]}>
              <View style={s.sheetHandle} />

              {/* Hero */}
              <LinearGradient colors={[color + '12', 'transparent']} style={s.detailGrad} pointerEvents="none" />
              <View style={s.detailHero}>
                <View style={[s.detailIconBox, { backgroundColor: color + '18', borderColor: color + '35' }]}>
                  <MaterialCommunityIcons name={icon} size={24} color={color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.detailMember}>{sheetSession.member_name}</Text>
                  <Text style={s.detailType}>{sheetSession.session_type}</Text>
                </View>
                <View style={[s.statusBadge, { backgroundColor: cfg.color + '14', borderColor: cfg.color + '30' }]}>
                  <MaterialCommunityIcons name={cfg.icon} size={11} color={cfg.color} />
                  <Text style={[s.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                </View>
              </View>

              {/* Meta list */}
              <View style={s.detailMetaCard}>
                {[
                  { icon: 'clock-outline' as IconName,      label: `${sheetSession.time}` },
                  { icon: 'timer-outline' as IconName,      label: sheetSession.duration  },
                  { icon: 'map-marker-outline' as IconName, label: sheetSession.location  },
                  { icon: 'calendar-outline' as IconName,   label: sheetSession.day_of_week },
                ].map((row, i, arr) => (
                  <View key={row.icon} style={[s.detailMetaRow, i < arr.length - 1 && s.detailMetaDivider]}>
                    <View style={s.detailMetaIcon}>
                      <MaterialCommunityIcons name={row.icon} size={14} color={Colors.textMuted} />
                    </View>
                    <Text style={s.detailMetaText}>{row.label}</Text>
                  </View>
                ))}
              </View>

              {/* Actions */}
              {sheetSession.status === 'upcoming' && (
                <View style={s.detailActions}>
                  <AnimatedPressable style={s.doneBtn} scaleDown={0.97} onPress={() => updateStatus(sheetSession, 'done')}>
                    <MaterialCommunityIcons name="check-circle-outline" size={16} color={Colors.green} />
                    <Text style={s.doneBtnText}>MARK DONE</Text>
                  </AnimatedPressable>
                  <AnimatedPressable style={s.cancelBtn} scaleDown={0.97} onPress={() => updateStatus(sheetSession, 'cancelled')}>
                    <MaterialCommunityIcons name="close-circle-outline" size={16} color={Colors.red} />
                    <Text style={s.cancelBtnText}>CANCEL</Text>
                  </AnimatedPressable>
                </View>
              )}

              <AnimatedPressable style={s.closeBtn} scaleDown={0.97} onPress={() => setSheetSession(null)}>
                <Text style={s.closeBtnText}>CLOSE</Text>
              </AnimatedPressable>
            </View>
          );
        })()}
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  fill:   { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 14, gap: 12 },

  // Sticky top
  stickyTop: { backgroundColor: Colors.bg, paddingHorizontal: 16, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },

  topRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 6, paddingBottom: 14 },
  backBtn:     { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.bgCard, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  topMicro:    { fontFamily: Fonts.condensedBold, fontSize: 9, color: Colors.accent, letterSpacing: 2 },
  topTitle:    { fontFamily: Fonts.condensedBold, fontSize: 32, color: Colors.text, letterSpacing: 0.5, marginTop: 1 },
  topPills:    { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  topPill:     { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.bgCard, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: Colors.border },
  topPillText: { fontFamily: Fonts.bold, fontSize: 11, color: Colors.textMuted },

  // Week bar row
  weekRow:    { flexDirection: 'row', gap: 4 },
  dayCol:     { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 8, borderRadius: 12, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border },
  dayColActive:{ backgroundColor: Colors.accent + '10', borderColor: Colors.accent + '45' },
  barTrack:   { justifyContent: 'flex-end', alignItems: 'center', width: '70%' },
  barFill:    { width: '100%', borderRadius: 3, overflow: 'hidden', justifyContent: 'flex-start' },
  barDoneOverlay: { width: '100%', borderRadius: 3 },
  dayCountNum:{ fontFamily: Fonts.condensedBold, fontSize: 11, color: Colors.textMuted, minHeight: 14 },
  dayLabel:   { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted, letterSpacing: 0.5 },
  dayLabelActive: { color: Colors.accent },
  todayDot:   { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.accent, position: 'absolute', top: 6, right: 7 },

  // Info banner
  infoBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, backgroundColor: '#3B82F610', borderRadius: 12, borderWidth: 1, borderColor: '#3B82F625', paddingHorizontal: 13, paddingVertical: 11 },
  infoText:   { fontFamily: Fonts.regular, fontSize: 12, color: '#3B82F6', flex: 1, lineHeight: 17 },

  // Error
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.red + '12', borderRadius: 12, borderWidth: 1, borderColor: Colors.red + '28', paddingHorizontal: 14, paddingVertical: 11 },
  errorText:   { flex: 1, fontFamily: Fonts.regular, fontSize: 12, color: Colors.red },
  retryText:   { fontFamily: Fonts.bold, fontSize: 12, color: Colors.accent },

  // Day header
  dayHeader:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  dayHeaderLeft:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dayHeaderDay:   { fontFamily: Fonts.condensedBold, fontSize: 28, color: Colors.text, letterSpacing: 0.5 },
  todayBadge:     { backgroundColor: Colors.accent + '18', borderRadius: 8, paddingHorizontal: 9, paddingVertical: 3, borderWidth: 1, borderColor: Colors.accent + '35' },
  todayBadgeText: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.accent, letterSpacing: 1 },
  dayHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dayHeaderCount: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted },
  addBtn:         { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.accentMuted, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: Colors.accent + '40' },
  addBtnText:     { fontFamily: Fonts.bold, fontSize: 11, color: Colors.accent, letterSpacing: 0.8 },

  // Empty
  emptyCard:    { alignItems: 'center', paddingVertical: 48, gap: 10, backgroundColor: Colors.bgCard, borderRadius: 18, borderWidth: 1, borderColor: Colors.border },
  emptyIconWrap:{ width: 58, height: 58, borderRadius: 17, backgroundColor: Colors.bgElevated, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  emptyTitle:   { fontFamily: Fonts.condensedBold, fontSize: 17, color: Colors.textMuted, letterSpacing: 1 },
  emptySub:     { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, textAlign: 'center', paddingHorizontal: 32 },

  // Timeline
  timeline:       { gap: 0 },
  timelineRow:    { flexDirection: 'row', gap: 12, marginBottom: 10 },
  timelineLeft:   { width: 44, alignItems: 'center', paddingTop: 14 },
  timelineTime:   { fontFamily: Fonts.condensedBold, fontSize: 14, color: Colors.text, lineHeight: 16 },
  timelineAmpm:   { fontFamily: Fonts.condensedBold, fontSize: 8, color: Colors.textMuted, letterSpacing: 0.5 },
  timelineConnector: { flex: 1, width: 1, backgroundColor: Colors.border, marginTop: 6 },

  // Session card
  sessionCard:     { flexDirection: 'row', backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  sessionCardDone: { opacity: 0.5 },
  sessionAccent:   { width: 3 },
  sessionContent:  { flex: 1, padding: 13, gap: 9 },
  sessionTop:      { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sessionTypeIcon: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  sessionMember:   { fontFamily: Fonts.bold, fontSize: 14, color: Colors.text },
  sessionType:     { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  statusBadge:     { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 4 },
  statusText:      { fontFamily: Fonts.bold, fontSize: 9, letterSpacing: 0.8 },
  metaRow:         { flexDirection: 'row', gap: 6 },
  metaChip:        { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.bgElevated, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: Colors.border },
  metaText:        { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted },

  // Week stats
  weekStatsCard:  { backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, padding: 16 },
  weekStatsLabel: { fontFamily: Fonts.condensedBold, fontSize: 9, color: Colors.textMuted, letterSpacing: 1.8, marginBottom: 14 },
  weekStatsRow:   { flexDirection: 'row' },
  weekStatItem:   { flex: 1, alignItems: 'center', gap: 5 },
  weekStatBorder: { borderRightWidth: 1, borderRightColor: Colors.border },
  weekStatIcon:   { width: 26, height: 26, borderRadius: 8, borderWidth: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
  weekStatVal:    { fontFamily: Fonts.condensedBold, fontSize: 22 },
  weekStatLbl:    { fontFamily: Fonts.condensedBold, fontSize: 8, color: Colors.textMuted, letterSpacing: 1, textAlign: 'center' },

  // Modals
  backdrop:    { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.65)' },
  sheet:       { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.bgCard, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 20, paddingTop: 12, maxHeight: '88%' },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: 14 },
  sheetTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 },
  sheetTitle:  { fontFamily: Fonts.condensedBold, fontSize: 24, color: Colors.text, letterSpacing: 0.5 },
  sheetSubtitle:{ fontFamily: Fonts.condensedBold, fontSize: 11, color: Colors.accent, letterSpacing: 1.5, marginTop: 2 },
  sheetCloseBtn:{ width: 30, height: 30, borderRadius: 9, backgroundColor: Colors.bgElevated, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  sheetScroll: { gap: 12, paddingBottom: 8 },

  // Member picker
  fieldLabel:       { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted, letterSpacing: 1.5 },
  noMembersBox:     { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.bgElevated, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border },
  noMembersText:    { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted },
  memberList:       { gap: 6 },
  memberItem:       { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.bgElevated, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: Colors.border },
  memberItemActive: { borderColor: Colors.accent + '55', backgroundColor: Colors.accentMuted },
  memberAvatar:     { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.bgCard, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },
  memberInitials:   { fontFamily: Fonts.condensedBold, fontSize: 14 },
  memberName:       { flex: 1, fontFamily: Fonts.bold, fontSize: 14, color: Colors.text },

  // Type grid
  typeGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  typeChip:     { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 11, paddingVertical: 8, borderRadius: 11, backgroundColor: Colors.bgElevated, borderWidth: 1, borderColor: Colors.border },
  typeChipDot:  { width: 5, height: 5, borderRadius: 3 },
  typeChipText: { fontFamily: Fonts.bold, fontSize: 11, color: Colors.textMuted },

  // Fields
  fieldRow:      { flexDirection: 'row', gap: 10 },
  fieldHalf:     { flex: 1, gap: 6 },
  fieldInputWrap:{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.bgElevated, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12, paddingVertical: 12 },
  fieldInput:    { flex: 1, fontFamily: Fonts.regular, fontSize: 14, color: Colors.text },

  addError:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.red + '12', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: Colors.red + '28' },
  addErrorText: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.red, flex: 1 },

  saveBtn:      {},
  saveBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 16, paddingVertical: 16 },
  saveBtnText:  { fontFamily: Fonts.bold, fontSize: 14, color: '#fff', letterSpacing: 1.5 },

  // Detail sheet
  detailSheet:   { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.bgCard, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 20, paddingTop: 12, gap: 14, overflow: 'hidden' },
  detailGrad:    { position: 'absolute', top: 0, left: 0, right: 0, height: 100 },
  detailHero:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  detailIconBox: { width: 52, height: 52, borderRadius: 16, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  detailMember:  { fontFamily: Fonts.condensedBold, fontSize: 22, color: Colors.text },
  detailType:    { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  detailMetaCard:{ backgroundColor: Colors.bgElevated, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  detailMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  detailMetaDivider: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  detailMetaIcon:{ width: 28, height: 28, borderRadius: 8, backgroundColor: Colors.bgCard, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  detailMetaText:{ fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted },
  detailActions: { flexDirection: 'row', gap: 10 },
  doneBtn:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.green + '12', borderRadius: 14, paddingVertical: 14, borderWidth: 1, borderColor: Colors.green + '30' },
  doneBtnText:   { fontFamily: Fonts.bold, fontSize: 13, color: Colors.green, letterSpacing: 0.5 },
  cancelBtn:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.red + '10', borderRadius: 14, paddingVertical: 14, borderWidth: 1, borderColor: Colors.red + '25' },
  cancelBtnText: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.red, letterSpacing: 0.5 },
  closeBtn:      { backgroundColor: Colors.bgElevated, borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  closeBtnText:  { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textMuted, letterSpacing: 1 },
});
