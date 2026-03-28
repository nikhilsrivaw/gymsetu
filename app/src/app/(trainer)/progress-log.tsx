import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  ActivityIndicator, Pressable, Keyboard, Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useFocusEffect } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { DrawerActions } from '@react-navigation/native';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import FadeInView from '@/components/FadeInView';
import AnimatedPressable from '@/components/AnimatedPressable';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface MemberProgress {
  id:           string;  // profiles.id
  name:         string;
  initials:     string;
  latestWeight: number | null;
  prevWeight:   number | null;
  measurements: { chest?: number; waist?: number; hips?: number; arms?: number; thighs?: number } | null;
  notes:        NoteEntry[];
}

interface NoteEntry {
  id:        string;
  mood:      string;
  tags:      string[];
  note:      string;
  weight:    string;
  logged_at: string;
}

interface GymMember { id: string; name: string; initials: string; }

const MOOD_OPTIONS: { val: string; icon: IconName; color: string; label: string }[] = [
  { val: '😃', icon: 'emoticon-excited-outline', color: Colors.green,  label: 'Great' },
  { val: '😊', icon: 'emoticon-happy-outline',   color: Colors.accent, label: 'Good'  },
  { val: '😐', icon: 'emoticon-neutral-outline',  color: Colors.orange, label: 'OK'    },
  { val: '😕', icon: 'emoticon-sad-outline',      color: Colors.red,    label: 'Poor'  },
];

const TAG_CFG: { label: string; icon: IconName; color: string }[] = [
  { label: 'Strength Gain',     icon: 'arm-flex-outline',       color: Colors.accent },
  { label: 'Weight Loss',       icon: 'scale-bathroom',         color: Colors.orange },
  { label: 'PR Set',            icon: 'trophy-outline',         color: Colors.green  },
  { label: 'Goal Reached',      icon: 'check-decagram-outline', color: Colors.green  },
  { label: 'Consistency Issue', icon: 'alert-outline',          color: Colors.red    },
  { label: 'Injury',            icon: 'bandage-outline',        color: Colors.red    },
  { label: 'Progress',          icon: 'trending-up',            color: Colors.accent },
  { label: 'Flexibility',       icon: 'human-handsup',          color: '#8B5CF6'     },
];

function mkInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function ProgressLogScreen() {
  const { profile } = useAuthStore();
  const insets      = useSafeAreaInsets();
  const navigation  = useNavigation();

  const [members,    setMembers]    = useState<MemberProgress[]>([]);
  const [gymMembers, setGymMembers] = useState<GymMember[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Note form
  const [showForm,   setShowForm]   = useState(false);
  const [formMember, setFormMember] = useState('');
  const [weight,     setWeight]     = useState('');
  const [note,       setNote]       = useState('');
  const [mood,       setMood]       = useState('😊');
  const [selTags,    setSelTags]    = useState<string[]>([]);
  const [saving,     setSaving]     = useState(false);
  const [saveError,  setSaveError]  = useState('');

  const fetchData = useCallback(async () => {
    if (!profile?.id || !profile?.gym_id) { setLoading(false); return; }
    setLoading(true);
    try {
      // 1. All gym members (for the note form picker)
      const { data: allMembers } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('gym_id', profile.gym_id)
        .eq('role', 'member')
        .order('full_name');

      const gymMemberList: GymMember[] = (allMembers ?? []).map((m: any) => ({
        id: m.id, name: m.full_name, initials: mkInitials(m.full_name),
      }));
      setGymMembers(gymMemberList);

      // 2. Progress notes this trainer has logged
      const { data: logsData } = await supabase
        .from('progress_logs')
        .select('id, member_id, mood, tags, note, weight, logged_at, profiles!progress_logs_member_id_fkey(full_name)')
        .eq('trainer_id', profile.id)
        .order('logged_at', { ascending: false });

      // Group notes by member
      const notesByMember: Record<string, { name: string; notes: NoteEntry[] }> = {};
      (logsData ?? []).forEach((l: any) => {
        const mid = l.member_id;
        if (!notesByMember[mid]) {
          notesByMember[mid] = { name: l.profiles?.full_name ?? 'Unknown', notes: [] };
        }
        notesByMember[mid].notes.push({
          id: l.id, mood: l.mood ?? '😊', tags: l.tags ?? [],
          note: l.note, weight: l.weight ?? '', logged_at: l.logged_at,
        });
      });

      const memberIds = Object.keys(notesByMember);
      if (memberIds.length === 0) { setMembers([]); setLoading(false); return; }

      // 3. Latest weights for these members
      const { data: weightData } = await supabase
        .from('weight_logs')
        .select('member_id, weight, logged_date')
        .in('member_id', memberIds)
        .order('logged_date', { ascending: false });

      const weightByMember: Record<string, number[]> = {};
      (weightData ?? []).forEach((w: any) => {
        if (!weightByMember[w.member_id]) weightByMember[w.member_id] = [];
        weightByMember[w.member_id].push(w.weight);
      });

      // 4. Latest measurements for these members
      const { data: measData } = await supabase
        .from('body_measurements')
        .select('member_id, chest, waist, hips, arms, thighs, logged_date')
        .in('member_id', memberIds)
        .order('logged_date', { ascending: false });

      const measByMember: Record<string, any> = {};
      (measData ?? []).forEach((m: any) => {
        if (!measByMember[m.member_id]) measByMember[m.member_id] = m;
      });

      // 5. Build combined rows
      const rows: MemberProgress[] = memberIds.map(mid => {
        const weights = weightByMember[mid] ?? [];
        return {
          id:           mid,
          name:         notesByMember[mid].name,
          initials:     mkInitials(notesByMember[mid].name),
          latestWeight: weights[0] ?? null,
          prevWeight:   weights[1] ?? null,
          measurements: measByMember[mid] ?? null,
          notes:        notesByMember[mid].notes,
        };
      });

      setMembers(rows);
    } finally {
      setLoading(false);
    }
  }, [profile?.id, profile?.gym_id]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const resetForm = () => {
    setFormMember(''); setWeight(''); setNote('');
    setMood('😊'); setSelTags([]); setSaveError('');
  };

  const toggleTag = (tag: string) =>
    setSelTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  const handleSubmit = async () => {
    setSaveError('');
    if (!formMember)  { setSaveError('Please select a member.'); return; }
    if (!note.trim()) { setSaveError('Please add a progress note.'); return; }
    Keyboard.dismiss();
    setSaving(true);
    try {
      const { error } = await supabase.from('progress_logs').insert({
        trainer_id: profile?.id,
        member_id:  formMember,
        gym_id:     profile?.gym_id,
        weight:     weight.trim() || null,
        note:       note.trim(),
        mood, tags: selTags,
      });
      if (error) throw error;
      setShowForm(false);
      resetForm();
      await fetchData();
    } catch (e: any) {
      setSaveError(e.message ?? 'Could not save entry.');
    } finally { setSaving(false); }
  };

  const totalNotes   = members.reduce((s, m) => s + m.notes.length, 0);
  const withWeight   = members.filter(m => m.latestWeight !== null).length;
  const milestones   = members.reduce((s, m) =>
    s + m.notes.filter(n => n.tags.includes('PR Set') || n.tags.includes('Goal Reached')).length, 0);

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

        {/* ── Header ── */}
        <View style={s.header}>
          <AnimatedPressable
            style={s.backBtn} scaleDown={0.9}
            onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.dispatch(DrawerActions.openDrawer())}
          >
            <MaterialCommunityIcons name={navigation.canGoBack() ? 'arrow-left' : 'menu'} size={20} color={Colors.text} />
          </AnimatedPressable>
          <View style={{ flex: 1 }}>
            <Text style={s.headerMicro}>TRAINER PANEL</Text>
            <Text style={s.headerTitle}>PROGRESS LOG</Text>
          </View>
          <AnimatedPressable
            style={s.newBtn} scaleDown={0.94}
            onPress={() => { resetForm(); setShowForm(true); }}
          >
            <MaterialCommunityIcons name="plus" size={16} color={Colors.accent} />
            <Text style={s.newBtnText}>ADD NOTE</Text>
          </AnimatedPressable>
        </View>

        <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

          {/* ── Stats strip ── */}
          <FadeInView delay={0}>
            <View style={s.statsRow}>
              {[
                { val: members.length, label: 'MEMBERS',    color: '#3B82F6',   icon: 'account-group-outline'    as IconName },
                { val: totalNotes,     label: 'NOTES',      color: Colors.accent, icon: 'clipboard-text-outline' as IconName },
                { val: withWeight,     label: 'WEIGHED',    color: Colors.green,  icon: 'weight-kilogram'        as IconName },
                { val: milestones,     label: 'MILESTONES', color: '#FFB347',     icon: 'trophy-outline'         as IconName },
              ].map((st, i) => (
                <View key={st.label} style={[s.statBox, i < 3 && s.statBorder]}>
                  <View style={[s.statIconBox, { backgroundColor: st.color + '15', borderColor: st.color + '25' }]}>
                    <MaterialCommunityIcons name={st.icon} size={12} color={st.color} />
                  </View>
                  <Text style={[s.statVal, { color: st.color }]}>{st.val}</Text>
                  <Text style={s.statLabel}>{st.label}</Text>
                </View>
              ))}
            </View>
          </FadeInView>

          {/* ── Empty state ── */}
          {members.length === 0 && (
            <FadeInView delay={60}>
              <View style={s.emptyCard}>
                <View style={s.emptyIconWrap}>
                  <MaterialCommunityIcons name="chart-timeline-variant" size={30} color={Colors.textMuted} />
                </View>
                <Text style={s.emptyTitle}>NO PROGRESS YET</Text>
                <Text style={s.emptySub}>Tap ADD NOTE to log your first member progress entry</Text>
              </View>
            </FadeInView>
          )}

          {/* ── Member progress cards ── */}
          {members.map((m, i) => {
            const isOpen      = expandedId === m.id;
            const weightDelta = m.latestWeight && m.prevWeight ? m.latestWeight - m.prevWeight : null;
            const deltaColor  = weightDelta === null ? Colors.textMuted : weightDelta < 0 ? Colors.green : weightDelta > 0 ? Colors.red : Colors.textMuted;
            const lastNote    = m.notes[0];
            const lastMood    = MOOD_OPTIONS.find(mo => mo.val === lastNote?.mood) ?? MOOD_OPTIONS[1];

            return (
              <FadeInView key={m.id} delay={60 + i * 50}>
                <View style={[s.memberCard, isOpen && { borderColor: Colors.accent + '35' }]}>
                  <View style={[s.cardAccent, { backgroundColor: isOpen ? Colors.accent : Colors.border }]} />

                  <View style={s.cardBody}>
                    {/* ── Card header (always visible) ── */}
                    <AnimatedPressable
                      style={s.cardHeaderRow}
                      scaleDown={0.98}
                      onPress={() => setExpandedId(isOpen ? null : m.id)}
                    >
                      <View style={[s.avatar, { backgroundColor: Colors.accent + '18', borderColor: Colors.accent + '30' }]}>
                        <Text style={s.avatarText}>{m.initials}</Text>
                      </View>

                      <View style={{ flex: 1, gap: 4 }}>
                        <Text style={s.memberName}>{m.name}</Text>
                        <View style={s.memberMetaRow}>
                          <MaterialCommunityIcons name="clipboard-text-outline" size={10} color={Colors.textMuted} />
                          <Text style={s.memberMeta}>{m.notes.length} note{m.notes.length !== 1 ? 's' : ''}</Text>
                          {m.latestWeight && (
                            <>
                              <Text style={s.metaDot}>·</Text>
                              <MaterialCommunityIcons name="weight-kilogram" size={10} color={Colors.textMuted} />
                              <Text style={s.memberMeta}>{m.latestWeight} kg</Text>
                            </>
                          )}
                        </View>
                      </View>

                      {/* Weight delta badge */}
                      {weightDelta !== null && (
                        <View style={[s.deltaBadge, { backgroundColor: deltaColor + '15', borderColor: deltaColor + '30' }]}>
                          <MaterialCommunityIcons
                            name={weightDelta < 0 ? 'trending-down' : weightDelta > 0 ? 'trending-up' : 'minus'}
                            size={12} color={deltaColor}
                          />
                          <Text style={[s.deltaText, { color: deltaColor }]}>
                            {weightDelta > 0 ? '+' : ''}{weightDelta.toFixed(1)} kg
                          </Text>
                        </View>
                      )}

                      <MaterialCommunityIcons
                        name={isOpen ? 'chevron-up' : 'chevron-down'}
                        size={18} color={Colors.textMuted}
                      />
                    </AnimatedPressable>

                    {/* ── Measurements chips (always visible if data exists) ── */}
                    {m.measurements && (
                      <View style={s.measRow}>
                        {(['chest', 'waist', 'hips', 'arms', 'thighs'] as const).map(key => {
                          const val = m.measurements![key];
                          if (!val) return null;
                          const measIcons: Record<string, IconName> = {
                            chest: 'human-male', waist: 'human-male-height', hips: 'circle-outline',
                            arms: 'arm-flex-outline', thighs: 'human-male-height-variant',
                          };
                          return (
                            <View key={key} style={s.measChip}>
                              <MaterialCommunityIcons name={measIcons[key] ?? 'ruler'} size={10} color="#8B5CF6" />
                              <Text style={s.measChipLabel}>{key.toUpperCase()}</Text>
                              <Text style={s.measChipVal}>{val}cm</Text>
                            </View>
                          );
                        })}
                      </View>
                    )}

                    {/* ── Expanded: full notes ── */}
                    {isOpen && (
                      <View style={s.notesSection}>
                        <View style={s.notesSectionHeader}>
                          <View style={s.sectionHeader}>
                            <View style={s.sectionAccent} />
                            <Text style={s.sectionTitle}>TRAINER NOTES</Text>
                          </View>
                          <AnimatedPressable
                            style={s.addNoteInlineBtn} scaleDown={0.93}
                            onPress={() => { resetForm(); setFormMember(m.id); setShowForm(true); }}
                          >
                            <MaterialCommunityIcons name="plus" size={12} color={Colors.accent} />
                            <Text style={s.addNoteInlineBtnText}>ADD NOTE</Text>
                          </AnimatedPressable>
                        </View>

                        {m.notes.map((n, ni) => {
                          const moodCfg = MOOD_OPTIONS.find(mo => mo.val === n.mood) ?? MOOD_OPTIONS[1];
                          return (
                            <View key={n.id} style={[s.noteCard, { borderColor: moodCfg.color + '25' }]}>
                              <View style={[s.noteAccent, { backgroundColor: moodCfg.color }]} />
                              <View style={s.noteInner}>
                                {/* Note header */}
                                <View style={s.noteHeader}>
                                  <View style={[s.moodBadge, { backgroundColor: moodCfg.color + '14', borderColor: moodCfg.color + '28' }]}>
                                    <MaterialCommunityIcons name={moodCfg.icon} size={12} color={moodCfg.color} />
                                    <Text style={[s.moodBadgeText, { color: moodCfg.color }]}>{moodCfg.label.toUpperCase()}</Text>
                                  </View>
                                  {!!n.weight && (
                                    <View style={s.weightChip}>
                                      <MaterialCommunityIcons name="weight-kilogram" size={10} color={Colors.accent} />
                                      <Text style={s.weightText}>{n.weight}kg</Text>
                                    </View>
                                  )}
                                  <View style={{ flex: 1 }} />
                                  <Text style={s.noteDate}>{fmtDate(n.logged_at)}</Text>
                                </View>
                                {/* Tags */}
                                {n.tags.length > 0 && (
                                  <View style={s.tagsRow}>
                                    {n.tags.map(tag => {
                                      const cfg = TAG_CFG.find(t => t.label === tag);
                                      const color = cfg?.color ?? Colors.accent;
                                      return (
                                        <View key={tag} style={[s.noteTag, { backgroundColor: color + '12', borderColor: color + '25' }]}>
                                          {cfg && <MaterialCommunityIcons name={cfg.icon} size={9} color={color} />}
                                          <Text style={[s.noteTagText, { color }]}>{tag}</Text>
                                        </View>
                                      );
                                    })}
                                  </View>
                                )}
                                {/* Note text */}
                                <Text style={s.noteText}>{n.note}</Text>
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    )}

                    {/* Latest note preview (collapsed) */}
                    {!isOpen && lastNote && (
                      <View style={s.notePreview}>
                        <View style={[s.notePreviewDot, { backgroundColor: lastMood.color }]} />
                        <Text style={s.notePreviewText} numberOfLines={1}>{lastNote.note}</Text>
                        <Text style={s.notePreviewDate}>{fmtDate(lastNote.logged_at)}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </FadeInView>
            );
          })}

          <View style={{ height: 32 }} />
        </ScrollView>
      </View>

      {/* ── Add Note Modal ── */}
      <Modal visible={showForm} transparent animationType="slide">
        <Pressable style={s.backdrop} onPress={() => !saving && setShowForm(false)} />
        <View style={[s.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={s.sheetHandle} />
          <View style={s.sheetTopRow}>
            <View style={s.sheetTitleRow}>
              <View style={[s.sheetIconBox, { backgroundColor: Colors.accent + '15', borderColor: Colors.accent + '30' }]}>
                <MaterialCommunityIcons name="clipboard-plus-outline" size={18} color={Colors.accent} />
              </View>
              <View>
                <Text style={s.sheetTitle}>ADD NOTE</Text>
                <Text style={s.sheetSub}>Log member progress</Text>
              </View>
            </View>
            <Pressable style={s.closeBtn} onPress={() => !saving && setShowForm(false)}>
              <MaterialCommunityIcons name="close" size={16} color={Colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={s.sheetScroll}>

            {/* Member picker */}
            <Text style={s.fieldLabel}>SELECT MEMBER</Text>
            {gymMembers.length === 0 ? (
              <View style={s.noMembersBox}>
                <MaterialCommunityIcons name="account-off-outline" size={18} color={Colors.textMuted} />
                <Text style={s.noMembersText}>No members found</Text>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.memberPickerRow}>
                {gymMembers.map(m => {
                  const active = formMember === m.id;
                  return (
                    <AnimatedPressable
                      key={m.id}
                      style={[s.memberChip, active && s.memberChipActive]}
                      scaleDown={0.92}
                      onPress={() => { setFormMember(m.id); setSaveError(''); }}
                    >
                      <View style={[s.memberChipAvatar, active && { backgroundColor: Colors.accent + '28', borderColor: Colors.accent }]}>
                        <Text style={[s.memberChipInitials, active && { color: Colors.accent }]}>{m.initials}</Text>
                      </View>
                      <Text style={[s.memberChipName, active && { color: Colors.accent }]}>
                        {m.name.split(' ')[0]}
                      </Text>
                    </AnimatedPressable>
                  );
                })}
              </ScrollView>
            )}

            {/* Weight */}
            <Text style={s.fieldLabel}>WEIGHT (KG) — OPTIONAL</Text>
            <View style={s.inputWrap}>
              <MaterialCommunityIcons name="weight-kilogram" size={15} color={Colors.textMuted} />
              <TextInput
                style={s.input} keyboardType="decimal-pad"
                placeholder="e.g. 78.5" placeholderTextColor={Colors.textMuted}
                value={weight} onChangeText={setWeight}
              />
              <Text style={s.inputUnit}>kg</Text>
            </View>

            {/* Mood */}
            <Text style={s.fieldLabel}>SESSION MOOD</Text>
            <View style={s.moodRow}>
              {MOOD_OPTIONS.map(m => {
                const active = mood === m.val;
                return (
                  <AnimatedPressable
                    key={m.val}
                    style={[s.moodBtn, active && { backgroundColor: m.color + '18', borderColor: m.color + '50', borderWidth: 1.5 }]}
                    scaleDown={0.88}
                    onPress={() => setMood(m.val)}
                  >
                    <MaterialCommunityIcons name={m.icon} size={22} color={active ? m.color : Colors.textMuted} />
                    <Text style={[s.moodLabel, active && { color: m.color }]}>{m.label.toUpperCase()}</Text>
                  </AnimatedPressable>
                );
              })}
            </View>

            {/* Tags */}
            <Text style={s.fieldLabel}>TAGS</Text>
            <View style={s.tagsGrid}>
              {TAG_CFG.map(tag => {
                const active = selTags.includes(tag.label);
                return (
                  <AnimatedPressable
                    key={tag.label}
                    style={[s.tagChip, active && { backgroundColor: tag.color + '14', borderColor: tag.color + '45' }]}
                    scaleDown={0.92}
                    onPress={() => toggleTag(tag.label)}
                  >
                    <MaterialCommunityIcons name={tag.icon} size={12} color={active ? tag.color : Colors.textMuted} />
                    <Text style={[s.tagText, active && { color: tag.color, fontFamily: Fonts.bold }]}>{tag.label}</Text>
                  </AnimatedPressable>
                );
              })}
            </View>

            {/* Note */}
            <Text style={s.fieldLabel}>PROGRESS NOTES *</Text>
            <TextInput
              style={s.noteInput}
              placeholder="Session observations, form corrections, improvements..."
              placeholderTextColor={Colors.textMuted}
              value={note}
              onChangeText={t => { setNote(t); setSaveError(''); }}
              multiline numberOfLines={4}
              textAlignVertical="top"
            />

            {!!saveError && (
              <View style={s.errRow}>
                <MaterialCommunityIcons name="alert-circle-outline" size={13} color={Colors.red} />
                <Text style={s.errText}>{saveError}</Text>
              </View>
            )}

            <AnimatedPressable style={[s.saveBtn, saving && { opacity: 0.6 }]} scaleDown={0.97} onPress={handleSubmit} disabled={saving}>
              <LinearGradient colors={[Colors.accent, '#C55A00']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.saveBtnInner}>
                {saving
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <>
                      <MaterialCommunityIcons name="content-save-outline" size={18} color="#fff" />
                      <Text style={s.saveBtnText}>SAVE PROGRESS NOTE</Text>
                    </>
                }
              </LinearGradient>
            </AnimatedPressable>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  fill:    { flex: 1, backgroundColor: Colors.bg },
  scroll:  { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 14, gap: 12, paddingBottom: 8 },

  // Header
  header:      { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 12, paddingTop: 6, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.bg },
  backBtn:     { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.bgCard, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  headerMicro: { fontFamily: Fonts.condensedBold, fontSize: 9, color: Colors.accent, letterSpacing: 2 },
  headerTitle: { fontFamily: Fonts.condensedBold, fontSize: 26, color: Colors.text, letterSpacing: 0.5 },
  newBtn:      { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.accentMuted, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1, borderColor: Colors.accent + '40' },
  newBtnText:  { fontFamily: Fonts.bold, fontSize: 11, color: Colors.accent, letterSpacing: 0.8 },

  // Stats
  statsRow:    { flexDirection: 'row', backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: Colors.border },
  statBox:     { flex: 1, alignItems: 'center', paddingVertical: 14, gap: 5 },
  statBorder:  { borderRightWidth: 1, borderRightColor: Colors.border },
  statIconBox: { width: 26, height: 26, borderRadius: 8, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  statVal:     { fontFamily: Fonts.condensedBold, fontSize: 20 },
  statLabel:   { fontFamily: Fonts.bold, fontSize: 7, color: Colors.textMuted, letterSpacing: 1 },

  // Empty
  emptyCard:    { alignItems: 'center', paddingVertical: 48, gap: 10, backgroundColor: Colors.bgCard, borderRadius: 18, borderWidth: 1, borderColor: Colors.border },
  emptyIconWrap:{ width: 60, height: 60, borderRadius: 18, backgroundColor: Colors.bgElevated, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  emptyTitle:   { fontFamily: Fonts.condensedBold, fontSize: 17, color: Colors.textMuted, letterSpacing: 1 },
  emptySub:     { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, textAlign: 'center', paddingHorizontal: 32 },

  // Member card
  memberCard:    { flexDirection: 'row', backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  cardAccent:    { width: 3 },
  cardBody:      { flex: 1, padding: 14, gap: 10 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  avatar:        { width: 44, height: 44, borderRadius: 22, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  avatarText:    { fontFamily: Fonts.condensedBold, fontSize: 16, color: Colors.accent },
  memberName:    { fontFamily: Fonts.bold, fontSize: 14, color: Colors.text },
  memberMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  memberMeta:    { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted },
  metaDot:       { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted },
  deltaBadge:    { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 4 },
  deltaText:     { fontFamily: Fonts.condensedBold, fontSize: 12 },

  // Measurements chips
  measRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  measChip:      { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#8B5CF615', borderRadius: 7, borderWidth: 1, borderColor: '#8B5CF625', paddingHorizontal: 7, paddingVertical: 3 },
  measChipLabel: { fontFamily: Fonts.bold, fontSize: 8, color: '#8B5CF6', letterSpacing: 0.8 },
  measChipVal:   { fontFamily: Fonts.condensedBold, fontSize: 11, color: Colors.text },

  // Note preview (collapsed)
  notePreview:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.bgElevated, borderRadius: 9, padding: 9 },
  notePreviewDot:  { width: 6, height: 6, borderRadius: 3 },
  notePreviewText: { flex: 1, fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted },
  notePreviewDate: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted },

  // Notes section (expanded)
  notesSection:       { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 12, gap: 8 },
  notesSectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionHeader:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionAccent:      { width: 3, height: 14, borderRadius: 2, backgroundColor: Colors.accent },
  sectionTitle:       { fontFamily: Fonts.bold, fontSize: 10, color: Colors.textMuted, letterSpacing: 1.5 },
  addNoteInlineBtn:   { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.accentMuted, borderRadius: 8, borderWidth: 1, borderColor: Colors.accent + '40', paddingHorizontal: 9, paddingVertical: 5 },
  addNoteInlineBtnText:{ fontFamily: Fonts.bold, fontSize: 9, color: Colors.accent, letterSpacing: 0.5 },

  noteCard:    { flexDirection: 'row', backgroundColor: Colors.bgElevated, borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  noteAccent:  { width: 3 },
  noteInner:   { flex: 1, padding: 11, gap: 7 },
  noteHeader:  { flexDirection: 'row', alignItems: 'center', gap: 7 },
  moodBadge:   { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 7, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 3 },
  moodBadgeText:{ fontFamily: Fonts.bold, fontSize: 8, letterSpacing: 0.8 },
  weightChip:  { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: Colors.accentMuted, borderRadius: 7, paddingHorizontal: 6, paddingVertical: 3, borderWidth: 1, borderColor: Colors.accent + '35' },
  weightText:  { fontFamily: Fonts.bold, fontSize: 10, color: Colors.accent },
  noteDate:    { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted },
  tagsRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  noteTag:     { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 6, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2 },
  noteTagText: { fontFamily: Fonts.bold, fontSize: 9 },
  noteText:    { fontFamily: Fonts.regular, fontSize: 12, color: Colors.text, lineHeight: 18 },

  // Modal
  backdrop:     { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.65)' },
  sheet:        { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.bgCard, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 20, paddingTop: 12, maxHeight: '92%' },
  sheetHandle:  { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: 14 },
  sheetTopRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  sheetTitleRow:{ flexDirection: 'row', alignItems: 'center', gap: 10 },
  sheetIconBox: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  sheetTitle:   { fontFamily: Fonts.condensedBold, fontSize: 22, color: Colors.text, letterSpacing: 0.5 },
  sheetSub:     { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  closeBtn:     { width: 30, height: 30, borderRadius: 9, backgroundColor: Colors.bgElevated, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  sheetScroll:  { gap: 12, paddingBottom: 8 },

  fieldLabel: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted, letterSpacing: 1.5 },
  noMembersBox:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.bgElevated, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: Colors.border },
  noMembersText: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted },

  memberPickerRow:    { gap: 8, paddingVertical: 2 },
  memberChip:         { alignItems: 'center', gap: 6, paddingHorizontal: 13, paddingVertical: 10, borderRadius: 13, backgroundColor: Colors.bgElevated, borderWidth: 1, borderColor: Colors.border },
  memberChipActive:   { backgroundColor: Colors.accentMuted, borderColor: Colors.accent + '60' },
  memberChipAvatar:   { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  memberChipInitials: { fontFamily: Fonts.condensedBold, fontSize: 12, color: Colors.textMuted },
  memberChipName:     { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted, letterSpacing: 0.5 },

  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.bgElevated, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12, paddingVertical: 12 },
  input:     { flex: 1, fontFamily: Fonts.regular, fontSize: 14, color: Colors.text },
  inputUnit: { fontFamily: Fonts.bold, fontSize: 10, color: Colors.textMuted },

  moodRow:   { flexDirection: 'row', gap: 8 },
  moodBtn:   { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 10, borderRadius: 12, backgroundColor: Colors.bgElevated, borderWidth: 1, borderColor: Colors.border },
  moodLabel: { fontFamily: Fonts.bold, fontSize: 8, color: Colors.textMuted, letterSpacing: 0.5 },

  tagsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  tagChip:  { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 20, backgroundColor: Colors.bgElevated, borderWidth: 1, borderColor: Colors.border },
  tagText:  { fontFamily: Fonts.medium, fontSize: 11, color: Colors.textMuted },

  noteInput: { backgroundColor: Colors.bgElevated, borderRadius: 12, padding: 14, fontFamily: Fonts.regular, fontSize: 13, color: Colors.text, borderWidth: 1, borderColor: Colors.border, minHeight: 100 },

  errRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.red + '12', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: Colors.red + '28' },
  errText: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.red, flex: 1 },

  saveBtn:      { borderRadius: 16, overflow: 'hidden' },
  saveBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 },
  saveBtnText:  { fontFamily: Fonts.bold, fontSize: 14, color: '#fff', letterSpacing: 1.3 },
});
