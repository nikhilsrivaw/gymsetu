  import { useState, useCallback } from 'react';
  import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
  import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
  import { MaterialCommunityIcons } from '@expo/vector-icons';
  import { Colors } from '@/constants/colors';
  import { Fonts } from '@/constants/fonts';
  import FadeInView from '@/components/FadeInView';
  import AnimatedPressable from '@/components/AnimatedPressable';
  import { askAI } from '@/lib/ai';
  import { supabase } from '@/lib/supabase';
  import { useAuthStore } from '@/store/authStore';

  const statusColor: Record<string, string> = {
    active: Colors.green, expiring: Colors.orange, expired: Colors.red,
  };

  const tabs = ['Overview', 'Progress', 'Attendance', 'Notes', 'AI'];

  interface NoteRow   { id: string; date: string; note: string; weight: string | null; mood: string | null }
  interface WeightRow { label: string; value: number }

  interface MemberDetail {
    name:     string;
    goal:     string | null;
    plan:     string;
    daysLeft: number;
    status:   'active' | 'expiring' | 'expired';
    phone:    string | null;
    joinDate: string;
    weight:   string | null;
    height:   string | null;
    age:      number | null;
    initials: string;
    lastSeen: string;
    attendance: number;   // check-ins this month
    streak:     number;   // consecutive days up to today
  }

  const fmtDay   = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const dayKey   = (d: Date)   => d.toISOString().split('T')[0];

  export default function MemberDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();   // profiles.id
    const router = useRouter();
    const { profile: me } = useAuthStore();
    const [activeTab, setActiveTab] = useState('Overview');

    const [member,  setMember]  = useState<MemberDetail | null>(null);
    const [notes,   setNotes]   = useState<NoteRow[]>([]);
    const [weights, setWeights] = useState<WeightRow[]>([]);
    const [week,    setWeek]    = useState<{ day: string; present: boolean }[]>([]);
    const [loading, setLoading] = useState(true);
    const [marking, setMarking] = useState(false);

    // AI states
    const [aiAssessment, setAiAssessment] = useState<string | null>(null);
    const [aiLoading, setAiLoading]       = useState(false);

    const fetchDetail = useCallback(async () => {
      if (!id) return;
      try {
        // Profile — the trainer list passes profiles.id
        const { data: p } = await supabase
          .from('profiles')
          .select('id, full_name, goal, phone, height_cm, weight_kg, date_of_birth, join_date')
          .eq('id', id)
          .single();
        if (!p) { setMember(null); setLoading(false); return; }

        // member_plans keys off members.id, not profiles.id
        const { data: mRow } = await supabase
          .from('members').select('id').eq('user_id', id).maybeSingle();

        let planName = 'No plan';
        let daysLeft = -1;
        if (mRow?.id) {
          const { data: plans } = await supabase
            .from('member_plans')
            .select('end_date, status, membership_plans(name)')
            .eq('member_id', mRow.id)
            .order('end_date', { ascending: false });
          const plan = (plans ?? []).find((x: any) => x.status === 'active') ?? (plans ?? [])[0];
          if (plan?.end_date) {
            planName = (plan as any).membership_plans?.name ?? 'No plan';
            daysLeft = Math.round(
              (new Date(plan.end_date).getTime() - new Date().setHours(0, 0, 0, 0)) / 86_400_000,
            );
          }
        }

        // Attendance — keyed by profiles.id
        const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const { data: att } = await supabase
          .from('attendance')
          .select('check_in_date')
          .eq('member_id', id)
          .gte('check_in_date', dayKey(new Date(Date.now() - 60 * 86_400_000)))
          .order('check_in_date', { ascending: false });
        const attDates = new Set((att ?? []).map((a: any) => a.check_in_date));
        const monthCount = (att ?? []).filter((a: any) => new Date(a.check_in_date) >= monthStart).length;

        // Streak — walk back from today until a gap. Today not yet marked is not
        // a break, so start counting from yesterday in that case.
        let streak = 0;
        const cursor = new Date();
        if (!attDates.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
        while (attDates.has(dayKey(cursor))) { streak++; cursor.setDate(cursor.getDate() - 1); }

        // This week, Monday-first
        const monday = new Date();
        monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
        const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
        setWeek(labels.map((lbl, i) => {
          const d = new Date(monday); d.setDate(monday.getDate() + i);
          return { day: lbl, present: attDates.has(dayKey(d)) };
        }));

        const lastDate = (att ?? [])[0]?.check_in_date;
        const lastSeen = !lastDate ? 'Never'
          : lastDate === dayKey(new Date()) ? 'Today'
          : lastDate === dayKey(new Date(Date.now() - 86_400_000)) ? 'Yesterday'
          : fmtDay(lastDate);

        const age = p.date_of_birth
          ? Math.floor((Date.now() - new Date(p.date_of_birth).getTime()) / (365.25 * 86_400_000))
          : null;

        setMember({
          name: p.full_name,
          goal: p.goal,
          plan: planName,
          daysLeft,
          status: daysLeft < 0 ? 'expired' : daysLeft <= 7 ? 'expiring' : 'active',
          phone: p.phone,
          joinDate: p.join_date ? fmtDay(p.join_date) : '—',
          weight: p.weight_kg ? String(p.weight_kg) : null,
          height: p.height_cm ? String(p.height_cm) : null,
          age,
          initials: p.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase(),
          lastSeen,
          attendance: monthCount,
          streak,
        });

        // Trainer notes (progress_logs.member_id is profiles.id, no FK to embed)
        const { data: logs } = await supabase
          .from('progress_logs')
          .select('id, note, weight, mood, created_at')
          .eq('member_id', id)
          .order('created_at', { ascending: false })
          .limit(20);
        setNotes((logs ?? []).map((l: any) => ({
          id: l.id, date: fmtDay(l.created_at), note: l.note, weight: l.weight, mood: l.mood,
        })));

        // Weight trend — self-logged weights, oldest first for the chart
        const { data: wl } = await supabase
          .from('weight_logs')
          .select('weight, logged_date')
          .eq('member_id', id)
          .order('logged_date', { ascending: false })
          .limit(6);
        setWeights((wl ?? []).reverse().map((w: any) => ({
          label: fmtDay(w.logged_date), value: Number(w.weight),
        })).filter(w => !Number.isNaN(w.value)));
      } catch (e) {
        console.error('[MemberDetail]', e);
      }
      setLoading(false);
    }, [id]);

    useFocusEffect(useCallback(() => { fetchDetail(); }, [fetchDetail]));

    const handleMarkAttendance = async () => {
      if (!id || !me?.gym_id) return;
      setMarking(true);
      try {
        const { error } = await supabase.from('attendance').insert({
          gym_id: me.gym_id, member_id: id,
          check_in_date: dayKey(new Date()),
          check_in_time: new Date().toTimeString().slice(0, 8),
          method: 'manual', marked_by: me.id,
        });
        // unique (member_id, check_in_date) — a repeat tap is already-marked, not an error
        if (error && !error.message.includes('duplicate')) throw error;
        Alert.alert('Attendance', error ? 'Already marked present today.' : 'Marked present for today.');
        await fetchDetail();
      } catch (e: any) {
        Alert.alert('Error', e.message ?? 'Could not mark attendance.');
      }
      setMarking(false);
    };

    if (loading) {
      return (
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      );
    }

    if (!member) {
      return (
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 32, gap: 8 }]}>
          <MaterialCommunityIcons name="account-question-outline" size={40} color={Colors.textMuted} />
          <Text style={styles.memberName}>Member not found</Text>
          <Text style={styles.lastSeen}>This member may have been removed.</Text>
        </View>
      );
    }

    const statusCol     = statusColor[member.status];
    const latestWeight  = weights.length ? weights[weights.length - 1].value : Number(member.weight ?? 0);
    const fitnessLevel  = member.attendance >= 16 ? 'Advanced' : member.attendance >= 8 ? 'Intermediate' : 'Beginner';

    const handleAIAssessment = async () => {
      setAiLoading(true);
      setAiAssessment(null);
      try {
        const text = await askAI('client_assessment', {
          clientName: member.name,
          age:        member.age,
          weight:     member.weight,
          height:     member.height,
          goal:       member.goal,
          level:      fitnessLevel,
        });
        setAiAssessment(text);
      } catch {
        Alert.alert('Error', 'Could not generate assessment');
      }
      setAiLoading(false);
    };

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Hero Card */}
        <FadeInView delay={0}>
          <View style={styles.heroCard}>
            <View style={styles.heroAccentBar} />
            <View style={styles.heroInner}>
              <View style={styles.avatarRing}>
                <Text style={styles.avatarInitials}>{member.initials}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.memberPlan}>{member.plan}</Text>
                <View style={styles.heroMeta}>
                  <View style={[styles.statusChip, { backgroundColor: statusCol + '18', borderColor: statusCol + '40' }]}>        
                    <Text style={[styles.statusText, { color: statusCol }]}>{member.status.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.lastSeen}>Last: {member.lastSeen}</Text>
                </View>
              </View>
              <View style={styles.daysBox}>
                <Text style={styles.daysVal}>{member.daysLeft < 0 ? '—' : member.daysLeft}</Text>
                <Text style={styles.daysLabel}>DAYS{'\n'}LEFT</Text>
              </View>
            </View>
          </View>
        </FadeInView>

        {/* Action Buttons */}
        <FadeInView delay={60}>
          <View style={styles.actionsRow}>
            <AnimatedPressable
              style={styles.actionBtn}
              scaleDown={0.95}
              onPress={() => member.phone
                ? Linking.openURL(`tel:${member.phone.replace(/\s/g, '')}`)
                : Alert.alert('No phone', 'This member has no phone number saved.')}
            >
              <Text style={styles.actionBtnEmoji}>📞</Text>
              <Text style={styles.actionBtnText}>CALL</Text>
            </AnimatedPressable>
            <AnimatedPressable
              style={styles.actionBtn}
              scaleDown={0.95}
              onPress={() => member.phone
                ? Linking.openURL(`https://wa.me/91${member.phone.replace(/\D/g, '').slice(-10)}`)
                : Alert.alert('No phone', 'This member has no phone number saved.')}
            >
              <Text style={styles.actionBtnEmoji}>💬</Text>
              <Text style={styles.actionBtnText}>MESSAGE</Text>
            </AnimatedPressable>
            <AnimatedPressable
              style={[styles.actionBtn, styles.actionBtnPrimary]}
              scaleDown={0.95}
              onPress={() => router.push('/(trainer)/progress-log' as any)}
            >
              <Text style={styles.actionBtnEmoji}>📈</Text>
              <Text style={[styles.actionBtnText, { color: Colors.accent }]}>LOG</Text>
            </AnimatedPressable>
            <AnimatedPressable
              style={styles.actionBtn}
              scaleDown={0.95}
              onPress={handleMarkAttendance}
              disabled={marking}
            >
              {marking
                ? <ActivityIndicator size="small" color={Colors.textMuted} />
                : <Text style={styles.actionBtnEmoji}>✅</Text>}
              <Text style={styles.actionBtnText}>MARK</Text>
            </AnimatedPressable>
          </View>
        </FadeInView>

        {/* Tabs */}
        <FadeInView delay={100}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
            {tabs.map(t => (
              <AnimatedPressable
                key={t}
                style={[styles.tab, activeTab === t && styles.tabActive, t === 'AI' && activeTab === t && styles.tabActiveAI]}    
                scaleDown={0.93}
                onPress={() => setActiveTab(t)}
              >
                <Text style={[styles.tabText, activeTab === t && styles.tabTextActive, t === 'AI' && activeTab === t && { color:  
  Colors.orange }]}>
                  {t === 'AI' ? '🤖 AI' : t.toUpperCase()}
                </Text>
              </AnimatedPressable>
            ))}
          </ScrollView>
        </FadeInView>

        {/* Overview Tab */}
        {activeTab === 'Overview' && (
          <>
            <FadeInView delay={140}>
              <View style={styles.statsRow}>
                {[
                  { label: 'ATTENDANCE', val: `${member.attendance}`, unit: 'days/mo' },
                  { label: 'STREAK',     val: `${member.streak}`,     unit: 'days'    },
                  { label: 'WEIGHT',     val: latestWeight ? `${latestWeight}` : '—', unit: latestWeight ? 'kg' : '' },
                ].map(s => (
                  <View key={s.label} style={styles.statBox}>
                    <Text style={styles.statVal}>{s.val}<Text style={styles.statUnit}>{s.unit}</Text></Text>
                    <Text style={styles.statLabel}>{s.label}</Text>
                  </View>
                ))}
              </View>
            </FadeInView>

            <FadeInView delay={180}>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>PERSONAL INFO</Text>
                {[
                  { label: 'GOAL',   val: member.goal   ?? 'Not set'              },
                  { label: 'HEIGHT', val: member.height ? `${member.height} cm` : '—' },
                  { label: 'WEIGHT', val: member.weight ? `${member.weight} kg` : '—' },
                  { label: 'AGE',    val: member.age    ? `${member.age} yrs`    : '—' },
                  { label: 'PHONE',  val: member.phone  ?? '—'                   },
                  { label: 'JOINED', val: member.joinDate                        },
                ].map((row, i, arr) => (
                  <View key={row.label} style={[styles.infoRow, i < arr.length - 1 && styles.infoRowBorder]}>
                    <Text style={styles.infoLabel}>{row.label}</Text>
                    <Text style={styles.infoVal}>{row.val}</Text>
                  </View>
                ))}
              </View>
            </FadeInView>
          </>
        )}

        {/* Progress Tab */}
        {activeTab === 'Progress' && (
          <FadeInView delay={140}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>GOAL</Text>
              <View style={styles.progressHeader}>
                <Text style={styles.progressGoal}>{member.goal ?? 'No goal set'}</Text>
                {latestWeight > 0 && (
                  <Text style={[styles.progressPct, { color: Colors.accent }]}>{latestWeight} kg</Text>
                )}
              </View>

              <Text style={[styles.cardTitle, { marginTop: 16 }]}>WEIGHT TREND</Text>
              {weights.length < 2 ? (
                <View style={styles.emptyBox}>
                  <MaterialCommunityIcons name="chart-line" size={26} color={Colors.textMuted} />
                  <Text style={styles.emptyText}>
                    {weights.length === 0
                      ? 'No weight logged yet. Weight entries appear here once the member or you log them.'
                      : 'Need at least two entries to show a trend.'}
                  </Text>
                </View>
              ) : (() => {
                // Scale bars across the observed range so small changes stay visible.
                const vals = weights.map(w => w.value);
                const min  = Math.min(...vals), max = Math.max(...vals);
                const span = max - min || 1;
                return (
                  <View style={styles.barChart}>
                    {weights.map((p, i) => {
                      const isLatest = i === weights.length - 1;
                      const pct      = 30 + ((p.value - min) / span) * 70;
                      return (
                        <View key={`${p.label}-${i}`} style={styles.barCol}>
                          <Text style={[styles.barVal, isLatest && { color: Colors.accent }]}>{p.value}</Text>
                          <View style={styles.barTrack}>
                            <View style={[styles.barFill, {
                              height: `${pct}%` as any,
                              backgroundColor: isLatest ? Colors.accent : Colors.accent + '40',
                            }]} />
                          </View>
                          <Text style={[styles.barDay, isLatest && { color: Colors.accent }]}>{p.label}</Text>
                        </View>
                      );
                    })}
                  </View>
                );
              })()}
            </View>
          </FadeInView>
        )}

        {/* Attendance Tab */}
        {activeTab === 'Attendance' && (
          <FadeInView delay={140}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>THIS WEEK</Text>
              <View style={styles.weekRow}>
                {week.map((w, i) => (
                  <View key={i} style={styles.dayCol}>
                    <View style={[styles.dayDot, { backgroundColor: w.present ? Colors.green : Colors.border }]}>
                      {w.present && <Text style={styles.dayCheck}>✓</Text>}
                    </View>
                    <Text style={[styles.dayLabel, w.present && { color: Colors.green }]}>{w.day}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.attendSummary}>
                <View style={styles.attendStat}>
                  <Text style={styles.attendVal}>{member.attendance}</Text>
                  <Text style={styles.attendLabel}>DAYS THIS MONTH</Text>
                </View>
                <View style={styles.attendDivider} />
                <View style={styles.attendStat}>
                  <Text style={[styles.attendVal, { color: Colors.green }]}>{week.filter(w => w.present).length}/7</Text>
                  <Text style={styles.attendLabel}>THIS WEEK</Text>
                </View>
                <View style={styles.attendDivider} />
                <View style={styles.attendStat}>
                  <Text style={[styles.attendVal, { color: Colors.orange }]}>{member.streak}</Text>
                  <Text style={styles.attendLabel}>DAY STREAK</Text>
                </View>
              </View>
            </View>
          </FadeInView>
        )}

        {/* Notes Tab */}
        {activeTab === 'Notes' && (
          <FadeInView delay={140}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>TRAINER NOTES</Text>
              {notes.length === 0 ? (
                <View style={styles.emptyBox}>
                  <MaterialCommunityIcons name="note-text-outline" size={26} color={Colors.textMuted} />
                  <Text style={styles.emptyText}>No notes logged for {member.name.split(' ')[0]} yet.</Text>
                </View>
              ) : notes.map((n, i) => (
                <View key={n.id} style={[styles.noteRow, i < notes.length - 1 && styles.noteRowBorder]}>
                  <Text style={styles.noteDate}>
                    {n.mood ? `${n.mood}  ` : ''}{n.date}{n.weight ? `  ·  ${n.weight} kg` : ''}
                  </Text>
                  <Text style={styles.noteText}>{n.note}</Text>
                </View>
              ))}
              <AnimatedPressable
                style={styles.addNoteBtn}
                scaleDown={0.97}
                onPress={() => router.push('/(trainer)/progress-log' as any)}
              >
                <Text style={styles.addNoteBtnText}>+ ADD NOTE</Text>
              </AnimatedPressable>
            </View>
          </FadeInView>
        )}

        {/* AI Tab */}
        {activeTab === 'AI' && (
          <FadeInView delay={140}>
            {/* Client snapshot */}
            <View style={styles.aiSnapshotCard}>
              <View style={styles.aiSnapshotRow}>
                <View style={styles.aiSnapshotAvatar}>
                  <Text style={styles.aiSnapshotInitials}>{member.initials}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.aiSnapshotName}>{member.name}</Text>
                  <Text style={styles.aiSnapshotSub}>
                    {[member.goal ?? 'No goal', fitnessLevel, member.age ? `${member.age} yrs` : null,
                      member.weight ? `${member.weight} kg` : null].filter(Boolean).join('  ·  ')}
                  </Text>
                </View>
              </View>
            </View>

            {/* AI Assessment Card */}
            <View style={styles.aiCard}>
              <View style={styles.aiCardGlow} />
              <View style={styles.aiCardHead}>
                <View style={styles.aiCardLeft}>
                  <MaterialCommunityIcons name="robot-outline" size={16} color={Colors.orange} />
                  <Text style={styles.aiCardLabel}>AI CLIENT ASSESSMENT</Text>
                </View>
              </View>
              <Text style={styles.aiCardDesc}>
                AI will analyse {member.name.split(' ')[0]}'s stats, goal, and fitness level to generate a professional assessment
   with a 4-week action plan.
              </Text>
              <TouchableOpacity style={styles.assessBtn} onPress={handleAIAssessment} disabled={aiLoading}>
                {aiLoading
                  ? <ActivityIndicator size="small" color="#FFF" />
                  : <>
                      <MaterialCommunityIcons name="clipboard-pulse-outline" size={16} color="#FFF" />
                      <Text style={styles.assessBtnText}>GENERATE ASSESSMENT</Text>
                    </>
                }
              </TouchableOpacity>
              {aiAssessment && (
                <View style={styles.aiResult}>
                  <Text style={styles.aiResultText}>{aiAssessment}</Text>
                </View>
              )}
            </View>
          </FadeInView>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    content:   { padding: 16, gap: 12 },

    heroCard:      { flexDirection: 'row', backgroundColor: Colors.bgCard, borderRadius: 16, overflow: 'hidden', borderWidth: 1,  
  borderColor: Colors.accent + '30' },
    heroAccentBar: { width: 4, backgroundColor: Colors.accent },
    heroInner:     { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
    avatarRing:    { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.bgElevated, justifyContent: 'center',       
  alignItems: 'center', borderWidth: 2, borderColor: Colors.accent + '40' },
    avatarInitials:{ fontSize: 18, fontFamily: Fonts.condensedBold, color: Colors.accent, letterSpacing: 0.5 },
    memberName:    { fontSize: 17, fontFamily: Fonts.bold, color: Colors.text },
    memberPlan:    { fontSize: 11, fontFamily: Fonts.regular, color: Colors.textMuted, marginTop: 1 },
    heroMeta:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5 },
    statusChip:    { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1 },
    statusText:    { fontSize: 9, fontFamily: Fonts.bold, letterSpacing: 1 },
    lastSeen:      { fontSize: 10, fontFamily: Fonts.regular, color: Colors.textMuted },
    daysBox:       { alignItems: 'center', backgroundColor: Colors.accentMuted, borderRadius: 10, paddingHorizontal: 10,
  paddingVertical: 8 },
    daysVal:       { fontSize: 24, fontFamily: Fonts.condensedBold, color: Colors.accent },
    daysLabel:     { fontSize: 8, fontFamily: Fonts.bold, color: Colors.accent, letterSpacing: 1, textAlign: 'center' },

    actionsRow:       { flexDirection: 'row', gap: 8 },
    actionBtn:        { flex: 1, alignItems: 'center', gap: 5, paddingVertical: 12, backgroundColor: Colors.bgCard, borderRadius: 
  12, borderWidth: 1, borderColor: Colors.border },
    actionBtnPrimary: { borderColor: Colors.accent + '40', backgroundColor: Colors.accentMuted },
    actionBtnEmoji:   { fontSize: 20 },
    actionBtnText:    { fontSize: 9, fontFamily: Fonts.bold, color: Colors.textMuted, letterSpacing: 1 },

    tabRow:        { gap: 8, paddingVertical: 2 },
    tab:           { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.bgCard, borderWidth: 1, 
  borderColor: Colors.border },
    tabActive:     { backgroundColor: Colors.accentMuted, borderColor: Colors.accent },
    tabActiveAI:   { backgroundColor: Colors.orange + '15', borderColor: Colors.orange + '50' },
    tabText:       { fontSize: 11, fontFamily: Fonts.bold, color: Colors.textMuted, letterSpacing: 1 },
    tabTextActive: { color: Colors.accent },

    statsRow: { flexDirection: 'row', gap: 8 },
    statBox:  { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 14, backgroundColor: Colors.bgCard, borderRadius: 12,     
  borderWidth: 1, borderColor: Colors.border },
    statVal:  { fontSize: 20, fontFamily: Fonts.condensedBold, color: Colors.text },
    statUnit: { fontSize: 10, fontFamily: Fonts.regular, color: Colors.textMuted },
    statLabel:{ fontSize: 8, fontFamily: Fonts.bold, color: Colors.textMuted, letterSpacing: 1.2 },

    card:      { backgroundColor: Colors.bgCard, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border, gap:  
  12 },
    cardTitle: { fontSize: 11, fontFamily: Fonts.bold, color: Colors.accent, letterSpacing: 1.5 },

    infoRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 9 },
    infoRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
    infoLabel:     { fontSize: 10, fontFamily: Fonts.bold, color: Colors.textMuted, letterSpacing: 1.2 },
    infoVal:       { fontSize: 14, fontFamily: Fonts.medium, color: Colors.text },

    progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    progressGoal:   { fontSize: 14, fontFamily: Fonts.bold, color: Colors.text },
    progressPct:    { fontSize: 22, fontFamily: Fonts.condensedBold },
    progressTrack:  { height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden' },
    progressFill:   { height: 6, borderRadius: 3 },

    emptyBox:  { alignItems: 'center', gap: 8, paddingVertical: 22, paddingHorizontal: 12 },
    emptyText: { fontSize: 12, fontFamily: Fonts.regular, color: Colors.textMuted, textAlign: 'center', lineHeight: 18 },

    barChart: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 100 },
    barCol:   { flex: 1, alignItems: 'center', gap: 4 },
    barVal:   { fontSize: 9, fontFamily: Fonts.bold, color: Colors.textMuted },
    barTrack: { width: '100%', height: 70, backgroundColor: Colors.border, borderRadius: 6, overflow: 'hidden', justifyContent:   
  'flex-end' },
    barFill:  { width: '100%', borderRadius: 6 },
    barDay:   { fontSize: 10, fontFamily: Fonts.bold, color: Colors.textMuted },

    weekRow:       { flexDirection: 'row', justifyContent: 'space-between' },
    dayCol:        { alignItems: 'center', gap: 5 },
    dayDot:        { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
    dayCheck:      { fontSize: 14, color: '#FFF', fontFamily: Fonts.bold },
    dayLabel:      { fontSize: 10, fontFamily: Fonts.bold, color: Colors.textMuted },
    attendSummary: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingTop: 12, borderTopWidth:  
  1, borderTopColor: Colors.border },
    attendStat:    { alignItems: 'center', gap: 4 },
    attendVal:     { fontSize: 22, fontFamily: Fonts.condensedBold, color: Colors.text },
    attendLabel:   { fontSize: 8, fontFamily: Fonts.bold, color: Colors.textMuted, letterSpacing: 1 },
    attendDivider: { width: 1, height: 36, backgroundColor: Colors.border },

    noteRow:       { paddingVertical: 10, gap: 4 },
    noteRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
    noteDate:      { fontSize: 10, fontFamily: Fonts.bold, color: Colors.accent, letterSpacing: 0.5 },
    noteText:      { fontSize: 13, fontFamily: Fonts.regular, color: Colors.text, lineHeight: 19 },
    addNoteBtn:    { paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: Colors.accent + '40', borderStyle:       
  'dashed', alignItems: 'center' },
    addNoteBtnText:{ fontSize: 12, fontFamily: Fonts.bold, color: Colors.accent, letterSpacing: 0.8 },

    // AI Tab
    aiSnapshotCard: { backgroundColor: Colors.bgCard, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.orange + 
  '30', marginBottom: 0 },
    aiSnapshotRow:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
    aiSnapshotAvatar:  { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.bgElevated, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.orange + '40' },
    aiSnapshotInitials:{ fontSize: 15, fontFamily: Fonts.condensedBold, color: Colors.orange },
    aiSnapshotName: { fontFamily: Fonts.bold, fontSize: 16, color: Colors.text },
    aiSnapshotSub:  { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 3 },

    aiCard:     { backgroundColor: Colors.bgCard, borderRadius: 18, borderWidth: 1, borderColor: Colors.orange + '30', padding:   
  18, overflow: 'hidden', gap: 14 },
    aiCardGlow: { position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: 40, backgroundColor:
  Colors.orange + '10' },
    aiCardHead: { flexDirection: 'row', alignItems: 'center' },
    aiCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    aiCardLabel:{ fontFamily: Fonts.bold, fontSize: 10, color: Colors.orange, letterSpacing: 1.5 },
    aiCardDesc: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, lineHeight: 18 },

    assessBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.orange,
   borderRadius: 12, paddingVertical: 14 },
    assessBtnText: { fontFamily: Fonts.bold, fontSize: 12, color: '#FFF', letterSpacing: 1 },

    aiResult:     { backgroundColor: Colors.bgElevated, borderRadius: 12, padding: 14, borderLeftWidth: 3, borderLeftColor:       
  Colors.orange },
    aiResultText: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.text, lineHeight: 20 },
  });