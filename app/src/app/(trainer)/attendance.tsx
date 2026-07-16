import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import FadeInView from '@/components/FadeInView';
import AnimatedPressable from '@/components/AnimatedPressable';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { toLocalDate, todayLocal } from '@/lib/date';
type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface MemberRow {
  id:            string;
  name:          string;
  plan:          string;
  initials:      string;
  attendancePct: number;
  status:        'present' | 'absent' | 'unmarked';
  attendance_id: string | null;
}

interface AssignedAnalytic {
  id:       string;
  name:     string;
  initials: string;
  pct:      number;
  days:     number;
}

const today        = todayLocal();
const todayLabel   = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
const monthName    = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
const monthStart   = toLocalDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
const WORKING_DAYS = 26;

export default function AttendanceScreen() {
  const { profile } = useAuthStore();

  const [members,   setMembers]   = useState<MemberRow[]>([]);
  const [analytics, setAnalytics] = useState<AssignedAnalytic[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);

  const fetchData = useCallback(async () => {
    if (!profile?.gym_id) return;
    setLoading(true);
    setSaved(false);

    // attendance.member_id is profiles.id everywhere else in the app (member
    // GPS check-in, the owner's screen, member detail). This screen used to
    // list from `members` and write members.id, so a trainer-marked check-in
    // was invisible to the member and to the owner, and the same person could
    // get two rows for one day -- unique(member_id, check_in_date) can't stop
    // that when the two ids differ. Source from profiles so the id written
    // here is the same id everything else reads.
    const [memberRes, attRes, monthAttRes] = await Promise.all([
      // Include expired/frozen members: they still walk in, and a trainer
      // marking them present is how the owner learns to ask for a renewal.
      supabase
        .from('profiles')
        .select('id, full_name')
        .eq('gym_id', profile.gym_id)
        .eq('role', 'member')
        .in('status', ['active', 'expired', 'frozen'])
        .order('full_name'),
      supabase
        .from('attendance')
        .select('id, member_id')
        .eq('gym_id', profile.gym_id)
        .eq('check_in_date', today),
      supabase
        .from('attendance')
        .select('member_id')
        .eq('gym_id', profile.gym_id)
        .gte('check_in_date', monthStart),
    ]);

    // Plan names live on member_plans, which keys off members.id — resolve
    // profiles.id -> members.id to label each row.
    const profileIds = (memberRes.data ?? []).map((p: any) => p.id);
    const planByProfile: Record<string, string> = {};
    if (profileIds.length > 0) {
      const { data: memberRows } = await supabase
        .from('members').select('id, user_id').in('user_id', profileIds);
      const memberIds = (memberRows ?? []).map((m: any) => m.id);
      if (memberIds.length > 0) {
        const { data: plans } = await supabase
          .from('member_plans')
          .select('member_id, status, membership_plans(name)')
          .in('member_id', memberIds);
        const nameByMemberId: Record<string, string> = {};
        (plans ?? []).forEach((pl: any) => {
          if (!nameByMemberId[pl.member_id] || pl.status === 'active') {
            nameByMemberId[pl.member_id] = pl.membership_plans?.name ?? 'No plan';
          }
        });
        (memberRows ?? []).forEach((m: any) => {
          planByProfile[m.user_id] = nameByMemberId[m.id] ?? 'No plan';
        });
      }
    }

    const attMap: Record<string, string> = Object.fromEntries(
      (attRes.data ?? []).map((a: any) => [a.member_id, a.id])
    );
    const monthMap: Record<string, number> = {};
    (monthAttRes.data ?? []).forEach((a: any) => {
      monthMap[a.member_id] = (monthMap[a.member_id] || 0) + 1;
    });

    const rows: MemberRow[] = (memberRes.data ?? []).map((m: any) => {
      const initials   = m.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
      const monthCount = monthMap[m.id] || 0;
      return {
        id:            m.id,                       // profiles.id — what attendance keys on
        name:          m.full_name,
        plan:          planByProfile[m.id] ?? 'No plan',
        initials,
        attendancePct: Math.min(Math.round((monthCount / WORKING_DAYS) * 100), 100),
        status:        attMap[m.id] ? 'present' : 'unmarked',
        attendance_id: attMap[m.id] ?? null,
      };
    });

    // Assigned-member analytics. monthMap is keyed by attendance.member_id,
    // which is profiles.id — so no members.id translation here, that was the
    // bug: it looked up attendance counts under an id attendance never uses.
    let analRows: AssignedAnalytic[] = [];
    const { data: assignedProfiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('gym_id', profile.gym_id)
      .eq('trainer_id', profile.id)
      .eq('role', 'member')
      .order('full_name');
    if (assignedProfiles?.length) {
      analRows = assignedProfiles.map((p: any) => {
        const days = monthMap[p.id] || 0;
        return {
          id:       p.id,
          name:     p.full_name,
          initials: p.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase(),
          pct:      Math.min(Math.round((days / WORKING_DAYS) * 100), 100),
          days,
        };
      });
    }

    setMembers(rows);
    setAnalytics(analRows);
    setLoading(false);
  }, [profile?.gym_id, profile?.id]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const markStatus = (id: string, status: 'present' | 'absent') => {
    setMembers(prev => prev.map(m =>
      m.id === id ? { ...m, status: m.status === status ? 'unmarked' : status } : m
    ));
  };

  const markAll = (status: 'present' | 'absent') => {
    setMembers(prev => prev.map(m => ({ ...m, status })));
  };

  const handleSave = async () => {
    const unmarked = members.filter(m => m.status === 'unmarked').length;
    const doSave = async () => {
      if (!profile?.gym_id) return;
      setSaving(true);
      const presentMembers = members.filter(m => m.status === 'present' && !m.attendance_id);
      const absentMembers  = members.filter(m => m.status === 'absent'  && m.attendance_id);
      const inserts = presentMembers.map(m => ({
        gym_id: profile.gym_id, member_id: m.id,
        check_in_date: today, check_in_time: new Date().toTimeString().slice(0, 5),
        // Default is 'gps'; without this a trainer-marked check-in is
        // indistinguishable from one the member made themselves.
        method: 'manual',
        marked_by: profile.id,
      }));
      const deleteIds = absentMembers.map(m => m.attendance_id!);
      await Promise.all([
        inserts.length   > 0 ? supabase.from('attendance').insert(inserts) : Promise.resolve(),
        deleteIds.length > 0 ? supabase.from('attendance').delete().in('id', deleteIds) : Promise.resolve(),
      ]);
      setSaving(false);
      setSaved(true);
      Alert.alert('Saved!', 'Attendance recorded for today.');
      fetchData();
    };
    if (unmarked > 0) {
      Alert.alert('Unmarked Members', `${unmarked} member${unmarked > 1 ? 's' : ''} still unmarked. Save anyway?`,
        [{ text: 'Go Back', style: 'cancel' }, { text: 'Save', onPress: doSave }]
      );
    } else { doSave(); }
  };

  const presentCount  = members.filter(m => m.status === 'present').length;
  const absentCount   = members.filter(m => m.status === 'absent').length;
  const unmarkedCount = members.filter(m => m.status === 'unmarked').length;
  const avgPct        = analytics.length ? Math.round(analytics.reduce((s, a) => s + a.pct, 0) / analytics.length) : 0;
  const onTrack       = analytics.filter(a => a.pct >= 75).length;
  const atRisk        = analytics.filter(a => a.pct < 50).length;
  const sortedAnal    = [...analytics].sort((a, b) => b.pct - a.pct);

  if (loading) return (
    <View style={s.center}><ActivityIndicator color={Colors.accent} size="large" /></View>
  );

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

      {/* ── HERO ── */}
      <FadeInView delay={0}>
        <View style={s.hero}>
          <View style={s.heroGlow1} />
          <View style={s.heroGlow2} />
          <View style={s.heroTop}>
            <View style={{ flex: 1 }}>
              <Text style={s.heroMicro}>TRAINER PANEL</Text>
              <Text style={s.heroTitle}>ATTENDANCE</Text>
              <Text style={s.heroSub}>{todayLabel}</Text>
            </View>
            <View style={s.heroIconBox}>
              <MaterialCommunityIcons name="calendar-check-outline" size={28} color={Colors.accent} />
            </View>
          </View>

          {/* Today's quick stats */}
          <View style={s.heroStatsRow}>
            {[
              { val: presentCount,   label: 'PRESENT',  color: Colors.green   },
              { val: absentCount,    label: 'ABSENT',   color: Colors.red     },
              { val: unmarkedCount,  label: 'PENDING',  color: Colors.orange  },
              { val: members.length, label: 'TOTAL',    color: Colors.accent  },
            ].map((st, i) => (
              <View key={st.label} style={[s.heroStat, i < 3 && s.heroStatBorder]}>
                <Text style={[s.heroStatVal, { color: st.color }]}>{st.val}</Text>
                <Text style={s.heroStatLabel}>{st.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </FadeInView>

      {/* ── MY MEMBERS ANALYTICS ── */}
      {analytics.length > 0 && (
        <FadeInView delay={40}>
          <View style={s.card}>
            {/* Card header */}
            <View style={s.cardHeader}>
              <View style={s.cardHeaderLeft}>
                <View style={[s.cardIconBox, { backgroundColor: '#3B82F615', borderColor: '#3B82F625' }]}>
                  <MaterialCommunityIcons name="chart-line" size={16} color="#3B82F6" />
                </View>
                <View>
                  <Text style={s.cardTitle}>MY MEMBERS</Text>
                  <Text style={s.cardSub}>{monthName} · Attendance Analytics</Text>
                </View>
              </View>
              <View style={[s.avgBadge, { backgroundColor: avgPct >= 75 ? Colors.green + '18' : avgPct >= 50 ? Colors.orange + '18' : Colors.red + '18', borderColor: avgPct >= 75 ? Colors.green + '40' : avgPct >= 50 ? Colors.orange + '40' : Colors.red + '40' }]}>
                <Text style={[s.avgBadgeText, { color: avgPct >= 75 ? Colors.green : avgPct >= 50 ? Colors.orange : Colors.red }]}>{avgPct}% AVG</Text>
              </View>
            </View>

            {/* KPI strip */}
            <View style={s.kpiStrip}>
              {[
                { val: String(analytics.length), label: 'ASSIGNED',  icon: 'account-group-outline' as IconName, color: '#3B82F6'   },
                { val: String(onTrack),           label: 'ON TRACK',  icon: 'trending-up' as IconName,           color: Colors.green },
                { val: String(atRisk),            label: 'AT RISK',   icon: 'alert-outline' as IconName,         color: Colors.red   },
              ].map((k, i) => (
                <View key={k.label} style={[s.kpiBox, i < 2 && s.kpiBorder]}>
                  <View style={[s.kpiIcon, { backgroundColor: k.color + '15', borderColor: k.color + '25' }]}>
                    <MaterialCommunityIcons name={k.icon} size={13} color={k.color} />
                  </View>
                  <Text style={[s.kpiVal, { color: k.color }]}>{k.val}</Text>
                  <Text style={s.kpiLabel}>{k.label}</Text>
                </View>
              ))}
            </View>

            {/* Member list */}
            <View style={s.analList}>
              {sortedAnal.map((a, i) => {
                const color: string      = a.pct >= 75 ? Colors.green : a.pct >= 50 ? Colors.orange : Colors.red;
                const icon: IconName     = a.pct >= 75 ? 'check-decagram' : a.pct >= 50 ? 'clock-alert-outline' : 'alert-decagram-outline';
                const rankIcon: IconName = i === 0 ? 'medal' : i === 1 ? 'medal-outline' : 'chevron-right';
                const rankColor: string  = i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : Colors.textMuted;
                return (
                  <View key={a.id} style={[s.analRow, i < sortedAnal.length - 1 && s.analBorder]}>
                    {/* Rank */}
                    <MaterialCommunityIcons name={rankIcon} size={16} color={rankColor} style={{ width: 20 }} />

                    {/* Avatar */}
                    <View style={[s.analAvatar, { backgroundColor: color + '15', borderColor: color + '35' }]}>
                      <Text style={[s.analInitials, { color }]}>{a.initials}</Text>
                    </View>

                    {/* Name + bar */}
                    <View style={s.analMid}>
                      <View style={s.analNameRow}>
                        <Text style={s.analName} numberOfLines={1}>{a.name}</Text>
                        <MaterialCommunityIcons name={icon} size={12} color={color} />
                      </View>
                      <View style={s.analTrack}>
                        <View style={[s.analFill, { width: `${a.pct}%` as any, backgroundColor: color }]} />
                      </View>
                    </View>

                    {/* Pct */}
                    <View style={[s.analPctBox, { backgroundColor: color + '12', borderColor: color + '30' }]}>
                      <Text style={[s.analPct, { color }]}>{a.pct}%</Text>
                      <Text style={s.analDays}>{a.days}d</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </FadeInView>
      )}

      {analytics.length === 0 && (
        <FadeInView delay={40}>
          <View style={s.emptyAnalCard}>
            <MaterialCommunityIcons name="account-clock-outline" size={28} color={Colors.textMuted} />
            <Text style={s.emptyAnalTitle}>No Assigned Members</Text>
            <Text style={s.emptyAnalSub}>Analytics will appear here once the owner assigns members to you</Text>
          </View>
        </FadeInView>
      )}

      {/* ── MARK ATTENDANCE ── */}
      <FadeInView delay={80}>
        <View style={s.sectionRow}>
          <View style={s.sectionHeader}>
            <View style={s.sectionAccent} />
            <Text style={s.sectionTitle}>MARK TODAY'S ATTENDANCE</Text>
          </View>
          {saved && (
            <View style={s.savedPill}>
              <MaterialCommunityIcons name="check-circle" size={11} color={Colors.green} />
              <Text style={s.savedText}>SAVED</Text>
            </View>
          )}
        </View>
      </FadeInView>

      {/* Bulk actions */}
      <FadeInView delay={100}>
        <View style={s.bulkRow}>
          <AnimatedPressable
            style={[s.bulkBtn, { backgroundColor: Colors.green + '15', borderColor: Colors.green + '35' }]}
            scaleDown={0.94}
            onPress={() => markAll('present')}
          >
            <MaterialCommunityIcons name="check-all" size={15} color={Colors.green} />
            <Text style={[s.bulkText, { color: Colors.green }]}>ALL PRESENT</Text>
          </AnimatedPressable>
          <AnimatedPressable
            style={[s.bulkBtn, { backgroundColor: Colors.red + '12', borderColor: Colors.red + '30' }]}
            scaleDown={0.94}
            onPress={() => markAll('absent')}
          >
            <MaterialCommunityIcons name="close-circle-outline" size={15} color={Colors.red} />
            <Text style={[s.bulkText, { color: Colors.red }]}>ALL ABSENT</Text>
          </AnimatedPressable>
          <View style={s.bulkCount}>
            <Text style={s.bulkCountText}>{members.length} MEMBERS</Text>
          </View>
        </View>
      </FadeInView>

      {/* Member cards */}
      {members.map((m, i) => {
        const monthColor = m.attendancePct >= 75 ? Colors.green : m.attendancePct >= 50 ? Colors.orange : Colors.red;
        const isPresent  = m.status === 'present';
        const isAbsent   = m.status === 'absent';
        const accentColor = isPresent ? Colors.green : isAbsent ? Colors.red : Colors.border;
        return (
          <FadeInView key={m.id} delay={140 + i * 35}>
            <View style={[s.memberCard, isPresent && { borderColor: Colors.green + '45' }, isAbsent && { borderColor: Colors.red + '38' }]}>
              <View style={[s.memberAccent, { backgroundColor: accentColor }]} />

              <View style={s.memberBody}>
                {/* Row 1: avatar + name + buttons */}
                <View style={s.memberTop}>
                  <View style={[s.avatar, { backgroundColor: Colors.accent + '18', borderColor: Colors.accent + '30' }]}>
                    <Text style={s.avatarText}>{m.initials}</Text>
                  </View>

                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={s.memberName}>{m.name}</Text>
                    <View style={s.memberMetaRow}>
                      <MaterialCommunityIcons name="card-account-details-outline" size={10} color={Colors.textMuted} />
                      <Text style={s.memberPlan}>{m.plan}</Text>
                    </View>
                  </View>

                  <View style={s.markBtns}>
                    <AnimatedPressable
                      style={[s.markBtn, isPresent && s.markBtnPresent]}
                      scaleDown={0.85}
                      onPress={() => markStatus(m.id, 'present')}
                    >
                      <MaterialCommunityIcons name="check-bold" size={17} color={isPresent ? '#000' : Colors.green} />
                    </AnimatedPressable>
                    <AnimatedPressable
                      style={[s.markBtn, isAbsent && s.markBtnAbsent]}
                      scaleDown={0.85}
                      onPress={() => markStatus(m.id, 'absent')}
                    >
                      <MaterialCommunityIcons name="close-thick" size={17} color={isAbsent ? '#FFF' : Colors.red} />
                    </AnimatedPressable>
                  </View>
                </View>

                {/* Row 2: monthly progress */}
                <View style={s.memberFooter}>
                  <View style={s.attendTrack}>
                    <View style={[s.attendFill, { width: `${m.attendancePct}%` as any, backgroundColor: monthColor }]} />
                  </View>
                  <View style={[s.attendPill, { backgroundColor: monthColor + '14', borderColor: monthColor + '30' }]}>
                    <Text style={[s.attendPct, { color: monthColor }]}>{m.attendancePct}%</Text>
                    <Text style={s.attendMonth}>month</Text>
                  </View>
                </View>
              </View>
            </View>
          </FadeInView>
        );
      })}

      {/* ── SAVE ── */}
      <FadeInView delay={480}>
        <AnimatedPressable style={[s.saveBtn, saving && { opacity: 0.6 }]} scaleDown={0.97} onPress={handleSave} disabled={saving}>
          <LinearGradient colors={[Colors.green, '#16a34a']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.saveBtnInner}>
            {saving
              ? <ActivityIndicator size="small" color="#FFF" />
              : <>
                  <MaterialCommunityIcons name="content-save-check-outline" size={20} color="#FFF" />
                  <Text style={s.saveBtnText}>SAVE TODAY'S ATTENDANCE</Text>
                </>
            }
          </LinearGradient>
        </AnimatedPressable>
      </FadeInView>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content:   { padding: 16, gap: 12 },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg },

  // ── Hero ──────────────────────────────────────────────────────
  hero: {
    backgroundColor: Colors.bgCard, borderRadius: 22, padding: 18,
    borderWidth: 1, borderColor: Colors.accent + '22', overflow: 'hidden', gap: 16,
  },
  heroGlow1: { position: 'absolute', top: -40, left: -30, width: 130, height: 130, borderRadius: 65, backgroundColor: Colors.accent + '10' },
  heroGlow2: { position: 'absolute', bottom: -30, right: -20, width: 90, height: 90, borderRadius: 45, backgroundColor: Colors.accent + '07' },
  heroTop:       { flexDirection: 'row', alignItems: 'center' },
  heroMicro:     { fontFamily: Fonts.bold, fontSize: 9, color: Colors.accent, letterSpacing: 2, marginBottom: 2 },
  heroTitle:     { fontFamily: Fonts.condensedBold, fontSize: 30, color: Colors.text, letterSpacing: 1 },
  heroSub:       { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, marginTop: 3 },
  heroIconBox:   { width: 54, height: 54, borderRadius: 16, backgroundColor: Colors.bgElevated, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.accent + '28' },
  heroStatsRow:  { flexDirection: 'row', backgroundColor: Colors.bgElevated, borderRadius: 14, borderWidth: 1, borderColor: Colors.border },
  heroStat:      { flex: 1, alignItems: 'center', paddingVertical: 12, gap: 3 },
  heroStatBorder:{ borderRightWidth: 1, borderRightColor: Colors.border },
  heroStatVal:   { fontFamily: Fonts.condensedBold, fontSize: 22 },
  heroStatLabel: { fontFamily: Fonts.bold, fontSize: 7, color: Colors.textMuted, letterSpacing: 1 },

  // ── Card (analytics) ──────────────────────────────────────────
  card: { backgroundColor: Colors.bgCard, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingBottom: 12 },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardIconBox:    { width: 38, height: 38, borderRadius: 11, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  cardTitle:      { fontFamily: Fonts.bold, fontSize: 13, color: Colors.text },
  cardSub:        { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted, marginTop: 1 },
  avgBadge:       { borderRadius: 9, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 4 },
  avgBadgeText:   { fontFamily: Fonts.condensedBold, fontSize: 13, letterSpacing: 0.5 },

  // KPI strip
  kpiStrip:  { flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, borderColor: Colors.border },
  kpiBox:    { flex: 1, alignItems: 'center', paddingVertical: 13, gap: 5 },
  kpiBorder: { borderRightWidth: 1, borderRightColor: Colors.border },
  kpiIcon:   { width: 28, height: 28, borderRadius: 8, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  kpiVal:    { fontFamily: Fonts.condensedBold, fontSize: 21 },
  kpiLabel:  { fontFamily: Fonts.bold, fontSize: 7, color: Colors.textMuted, letterSpacing: 1.2 },

  // Analytics member rows
  analList:    { paddingHorizontal: 14, paddingVertical: 6 },
  analRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11 },
  analBorder:  { borderBottomWidth: 1, borderBottomColor: Colors.border },
  analAvatar:  { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },
  analInitials:{ fontFamily: Fonts.condensedBold, fontSize: 13 },
  analMid:     { flex: 1, gap: 6 },
  analNameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  analName:    { flex: 1, fontFamily: Fonts.bold, fontSize: 13, color: Colors.text },
  analTrack:   { height: 5, backgroundColor: Colors.bgElevated, borderRadius: 3, overflow: 'hidden' },
  analFill:    { height: 5, borderRadius: 3 },
  analPctBox:  { alignItems: 'center', borderRadius: 9, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4, minWidth: 42 },
  analPct:     { fontFamily: Fonts.condensedBold, fontSize: 14 },
  analDays:    { fontFamily: Fonts.regular, fontSize: 8, color: Colors.textMuted },

  // Empty analytics
  emptyAnalCard:  { backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyAnalTitle: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.text },
  emptyAnalSub:   { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, textAlign: 'center', paddingHorizontal: 28 },

  // ── Section header ────────────────────────────────────────────
  sectionRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionAccent: { width: 3, height: 14, borderRadius: 2, backgroundColor: Colors.accent },
  sectionTitle:  { fontFamily: Fonts.bold, fontSize: 10, color: Colors.textMuted, letterSpacing: 1.5 },
  savedPill:     { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.green + '15', borderRadius: 8, borderWidth: 1, borderColor: Colors.green + '35', paddingHorizontal: 9, paddingVertical: 4 },
  savedText:     { fontFamily: Fonts.bold, fontSize: 9, color: Colors.green, letterSpacing: 0.8 },

  // Bulk row
  bulkRow:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bulkBtn:       { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 11, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 9 },
  bulkText:      { fontFamily: Fonts.bold, fontSize: 10, letterSpacing: 0.5 },
  bulkCount:     { flex: 1, alignItems: 'flex-end' },
  bulkCountText: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted, letterSpacing: 1 },

  // ── Member card ───────────────────────────────────────────────
  memberCard:   { flexDirection: 'row', backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  memberAccent: { width: 3 },
  memberBody:   { flex: 1, padding: 13, gap: 10 },
  memberTop:    { flexDirection: 'row', alignItems: 'center', gap: 11 },

  avatar:    { width: 44, height: 44, borderRadius: 22, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  avatarText:{ fontFamily: Fonts.condensedBold, fontSize: 16, color: Colors.accent },

  memberName:    { fontFamily: Fonts.bold, fontSize: 14, color: Colors.text },
  memberMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  memberPlan:    { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted },

  markBtns:       { flexDirection: 'row', gap: 7 },
  markBtn:        { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bgElevated, borderWidth: 1, borderColor: Colors.border },
  markBtnPresent: { backgroundColor: Colors.green, borderColor: Colors.green },
  markBtnAbsent:  { backgroundColor: Colors.red,   borderColor: Colors.red   },

  memberFooter: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  attendTrack:  { flex: 1, height: 5, backgroundColor: Colors.bgElevated, borderRadius: 3, overflow: 'hidden' },
  attendFill:   { height: 5, borderRadius: 3 },
  attendPill:   { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 7, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 3 },
  attendPct:    { fontFamily: Fonts.condensedBold, fontSize: 12 },
  attendMonth:  { fontFamily: Fonts.regular, fontSize: 9, color: Colors.textMuted },

  // ── Save ──────────────────────────────────────────────────────
  saveBtn:      { borderRadius: 16, overflow: 'hidden' },
  saveBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 },
  saveBtnText:  { fontFamily: Fonts.bold, fontSize: 14, color: '#FFF', letterSpacing: 1.3 },
});
