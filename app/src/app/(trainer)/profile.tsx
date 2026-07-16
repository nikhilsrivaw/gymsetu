import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Switch, Alert,
  ActivityIndicator, Modal, TextInput, Pressable, Keyboard,
} from 'react-native';
import { Stack, useFocusEffect } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { DrawerActions } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import AnimatedPressable from '@/components/AnimatedPressable';
import FadeInView from '@/components/FadeInView';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';

import { toLocalDate } from '@/lib/date';
type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const CERTS = [
  { label: 'ISSA Certified PT',    icon: 'certificate-outline' as IconName },
  { label: 'Nutrition Coach',      icon: 'food-apple-outline'  as IconName },
  { label: 'CrossFit Level 2',     icon: 'dumbbell'            as IconName },
];

const ACHIEVEMENTS: { icon: IconName; color: string; label: string; desc: string }[] = [
  { icon: 'trophy-outline',        color: '#F59E0B', label: 'Top Trainer',      desc: 'Q1 2026'    },
  { icon: 'check-decagram-outline',color: Colors.green,  label: '100% Retention',  desc: '6 months'   },
  { icon: 'fire',                  color: Colors.accent, label: '1000+ Sessions',  desc: 'Milestone'  },
  { icon: 'star-outline',          color: '#8B5CF6', label: 'Member Favourite', desc: '3× awarded' },
];

interface Stats {
  memberCount:       number;
  sessionsThisMonth: number;
  totalSessions:     number;
}

export default function TrainerProfileScreen() {
  const navigation = useNavigation();
  const insets     = useSafeAreaInsets();
  const { profile, gymProfile, session, signOut } = useAuthStore();

  const [stats,      setStats]      = useState<Stats>({ memberCount: 0, sessionsThisMonth: 0, totalSessions: 0 });
  const [loading,    setLoading]    = useState(true);
  const [statsError, setStatsError] = useState('');

  const [notifications,    setNotifications]    = useState(true);
  const [sessionReminders, setSessionReminders] = useState(true);
  const [progressAlerts,   setProgressAlerts]   = useState(false);

  // Edit Profile modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editPhone,     setEditPhone]     = useState('');
  const [editSaving,    setEditSaving]    = useState(false);
  const [editError,     setEditError]     = useState('');

  // Change Password modal
  const [showPwModal, setShowPwModal] = useState(false);
  const [newPw,       setNewPw]       = useState('');
  const [confirmPw,   setConfirmPw]   = useState('');
  const [pwSaving,    setPwSaving]    = useState(false);
  const [pwError,     setPwError]     = useState('');
  const [pwOk,        setPwOk]        = useState(false);

  const fetchStats = useCallback(async () => {
    if (!profile?.id || !profile?.gym_id) { setLoading(false); return; }
    setStatsError(''); setLoading(true);
    try {
      const monthStart = toLocalDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
      const [membersRes, allRes, monthRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true })
          .eq('gym_id', profile.gym_id).eq('role', 'member'),
        supabase.from('trainer_sessions').select('id', { count: 'exact', head: true })
          .eq('trainer_id', profile.id),
        supabase.from('trainer_sessions').select('id', { count: 'exact', head: true })
          .eq('trainer_id', profile.id).gte('session_date', monthStart),
      ]);
      if (membersRes.error) throw membersRes.error;
      if (allRes.error)     throw allRes.error;
      if (monthRes.error)   throw monthRes.error;
      setStats({ memberCount: membersRes.count ?? 0, totalSessions: allRes.count ?? 0, sessionsThisMonth: monthRes.count ?? 0 });
    } catch (e: any) {
      setStatsError(e.message ?? 'Failed to load stats');
    } finally { setLoading(false); }
  }, [profile?.id, profile?.gym_id]);

  useFocusEffect(useCallback(() => { fetchStats(); }, [fetchStats]));

  const handleSavePhone = async () => {
    Keyboard.dismiss();
    setEditSaving(true); setEditError('');
    try {
      const { error } = await supabase.from('profiles').update({ phone: editPhone.trim() || null }).eq('id', profile!.id);
      if (error) throw error;
      setShowEditModal(false);
    } catch (e: any) { setEditError(e.message ?? 'Failed to update'); }
    finally { setEditSaving(false); }
  };

  const handleChangePassword = async () => {
    if (newPw.length < 8)   { setPwError('Min. 8 characters.'); return; }
    if (newPw !== confirmPw) { setPwError('Passwords do not match.'); return; }
    Keyboard.dismiss();
    setPwSaving(true); setPwError('');
    try {
      const { error } = await supabase.auth.updateUser({ password: newPw });
      if (error) throw error;
      setPwOk(true); setNewPw(''); setConfirmPw('');
      setTimeout(() => { setPwOk(false); setShowPwModal(false); }, 1500);
    } catch (e: any) { setPwError(e.message ?? 'Failed to change password'); }
    finally { setPwSaving(false); }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  const name         = profile?.full_name ?? 'Trainer';
  const email        = session?.user?.email ?? '—';
  const phone        = (profile as any)?.phone ?? '—';
  const specialization = (profile as any)?.specialization ?? 'Fitness Trainer';
  const initials     = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const gymName      = gymProfile?.name ?? '';

  const ACCOUNT_ITEMS: { icon: IconName; color: string; label: string; onPress: () => void }[] = [
    { icon: 'pencil-outline',      color: Colors.accent, label: 'Edit Profile',    onPress: () => { setEditPhone(phone === '—' ? '' : phone); setEditError(''); setShowEditModal(true); } },
    { icon: 'lock-outline',        color: '#8B5CF6',     label: 'Change Password', onPress: () => { setNewPw(''); setConfirmPw(''); setPwError(''); setPwOk(false); setShowPwModal(true); } },
    { icon: 'file-document-outline', color: Colors.green, label: 'View Contract',  onPress: () => Alert.alert('Contract', 'Your employment contract is active.') },
    { icon: 'headset',             color: '#F59E0B',     label: 'Support',         onPress: () => Alert.alert('Support', 'Contact admin@gymsetu.in') },
  ];

  const TOGGLE_ITEMS = [
    { icon: 'bell-outline' as IconName,    color: Colors.accent, label: 'Push Notifications', desc: 'New messages & alerts',    value: notifications,    setter: setNotifications    },
    { icon: 'clock-outline' as IconName,   color: Colors.green,  label: 'Session Reminders',  desc: '15 min before class',      value: sessionReminders, setter: setSessionReminders },
    { icon: 'trending-up' as IconName,     color: '#8B5CF6',     label: 'Progress Alerts',    desc: 'Member milestone updates', value: progressAlerts,   setter: setProgressAlerts   },
  ];

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[s.fill, { paddingTop: insets.top }]}>

        {/* ── Custom Header ── */}
        <View style={s.header}>
          <AnimatedPressable
            style={s.backBtn} scaleDown={0.9}
            onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.dispatch(DrawerActions.openDrawer())}
          >
            <MaterialCommunityIcons name={navigation.canGoBack() ? 'arrow-left' : 'menu'} size={20} color={Colors.text} />
          </AnimatedPressable>
          <View style={{ flex: 1 }}>
            <Text style={s.headerMicro}>TRAINER PANEL</Text>
            <Text style={s.headerTitle}>MY PROFILE</Text>
          </View>
          <View style={s.onlineChip}>
            <View style={s.onlineDot} />
            <Text style={s.onlineText}>ONLINE</Text>
          </View>
        </View>

        <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

          {/* ── Hero Card ── */}
          <FadeInView delay={0}>
            <View style={s.heroCard}>
              <LinearGradient
                colors={[Colors.accent + '14', 'transparent']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />

              {/* Gym badge */}
              {!!gymName && (
                <View style={s.gymBadge}>
                  <MaterialCommunityIcons name="office-building-outline" size={10} color={Colors.accent} />
                  <Text style={s.gymBadgeText}>{gymName.toUpperCase()}</Text>
                </View>
              )}

              {/* Avatar */}
              <View style={s.avatarOuterRing}>
                <View style={s.avatarInnerRing}>
                  <View style={s.avatarCircle}>
                    <Text style={s.avatarText}>{initials}</Text>
                  </View>
                </View>
                <View style={s.activeDot} />
              </View>

              <Text style={s.heroName}>{name}</Text>

              <View style={s.roleBadge}>
                <View style={s.roleDot} />
                <Text style={s.roleText}>{specialization.toUpperCase()}</Text>
              </View>

              <View style={s.trainerPill}>
                <MaterialCommunityIcons name="whistle-outline" size={11} color={Colors.accent} />
                <Text style={s.trainerPillText}>CERTIFIED TRAINER</Text>
              </View>
            </View>
          </FadeInView>

          {/* ── Stats Strip ── */}
          <FadeInView delay={60}>
            {loading ? (
              <View style={s.statsLoading}>
                <ActivityIndicator color={Colors.accent} size="small" />
                <Text style={s.statsLoadingText}>Loading stats...</Text>
              </View>
            ) : statsError ? (
              <View style={s.errorBanner}>
                <MaterialCommunityIcons name="alert-circle-outline" size={15} color={Colors.red} />
                <Text style={s.errorText}>{statsError}</Text>
              </View>
            ) : (
              <View style={s.statsRow}>
                {[
                  { val: stats.memberCount,       label: 'MEMBERS',      icon: 'account-group-outline' as IconName, color: '#3B82F6'    },
                  { val: stats.sessionsThisMonth, label: 'THIS MONTH',   icon: 'calendar-check-outline' as IconName, color: Colors.green },
                  { val: stats.totalSessions,     label: 'SESSIONS',     icon: 'dumbbell' as IconName,              color: Colors.accent },
                  { val: '4.9',                   label: 'RATING',       icon: 'star-outline' as IconName,          color: '#F59E0B'     },
                ].map((st, i) => (
                  <View key={st.label} style={[s.statBox, i < 3 && s.statBorder]}>
                    <View style={[s.statIconBox, { backgroundColor: st.color + '15', borderColor: st.color + '25' }]}>
                      <MaterialCommunityIcons name={st.icon} size={13} color={st.color} />
                    </View>
                    <Text style={[s.statVal, { color: st.color }]}>{st.val}</Text>
                    <Text style={s.statLabel}>{st.label}</Text>
                  </View>
                ))}
              </View>
            )}
          </FadeInView>

          {/* ── Contact Info ── */}
          <FadeInView delay={110}>
            <View style={s.sectionHeader}>
              <View style={s.sectionAccent} />
              <Text style={s.sectionTitle}>CONTACT INFO</Text>
            </View>
            <View style={s.card}>
              {[
                { icon: 'email-outline' as IconName,  color: Colors.accent, label: 'EMAIL', val: email },
                { icon: 'phone-outline' as IconName,  color: Colors.green,  label: 'PHONE', val: phone },
              ].map((row, i) => (
                <View key={row.label} style={[s.infoRow, i > 0 && s.rowBorderTop]}>
                  <View style={[s.infoIconBox, { backgroundColor: row.color + '14', borderColor: row.color + '28' }]}>
                    <MaterialCommunityIcons name={row.icon} size={15} color={row.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.infoLabel}>{row.label}</Text>
                    <Text style={s.infoVal} numberOfLines={1}>{row.val}</Text>
                  </View>
                </View>
              ))}
            </View>
          </FadeInView>

          {/* ── Certifications ── */}
          <FadeInView delay={155}>
            <View style={s.sectionHeader}>
              <View style={s.sectionAccent} />
              <Text style={s.sectionTitle}>CERTIFICATIONS</Text>
            </View>
            <View style={s.card}>
              {CERTS.map((cert, i) => (
                <View key={cert.label} style={[s.certRow, i > 0 && s.rowBorderTop]}>
                  <View style={[s.certIconBox]}>
                    <MaterialCommunityIcons name={cert.icon} size={15} color={Colors.accent} />
                  </View>
                  <Text style={s.certText}>{cert.label}</Text>
                  <View style={s.verifiedBadge}>
                    <MaterialCommunityIcons name="check-circle-outline" size={10} color={Colors.green} />
                    <Text style={s.verifiedText}>VERIFIED</Text>
                  </View>
                </View>
              ))}
            </View>
          </FadeInView>

          {/* ── Achievements ── */}
          <FadeInView delay={195}>
            <View style={s.sectionHeader}>
              <View style={s.sectionAccent} />
              <Text style={s.sectionTitle}>ACHIEVEMENTS</Text>
            </View>
            <View style={s.achieveGrid}>
              {ACHIEVEMENTS.map(a => (
                <View key={a.label} style={s.achieveCard}>
                  <View style={[s.achieveIconBox, { backgroundColor: a.color + '14', borderColor: a.color + '28' }]}>
                    <MaterialCommunityIcons name={a.icon} size={20} color={a.color} />
                  </View>
                  <Text style={s.achieveLabel}>{a.label}</Text>
                  <Text style={s.achieveDesc}>{a.desc}</Text>
                </View>
              ))}
            </View>
          </FadeInView>

          {/* ── Notifications ── */}
          <FadeInView delay={235}>
            <View style={s.sectionHeader}>
              <View style={s.sectionAccent} />
              <Text style={s.sectionTitle}>NOTIFICATIONS</Text>
            </View>
            <View style={s.card}>
              {TOGGLE_ITEMS.map((item, i) => (
                <View key={item.label} style={[s.toggleRow, i > 0 && s.rowBorderTop]}>
                  <View style={[s.toggleIconBox, { backgroundColor: item.color + '14', borderColor: item.color + '28' }]}>
                    <MaterialCommunityIcons name={item.icon} size={15} color={item.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.toggleLabel}>{item.label}</Text>
                    <Text style={s.toggleDesc}>{item.desc}</Text>
                  </View>
                  <Switch
                    value={item.value}
                    onValueChange={item.setter}
                    trackColor={{ false: Colors.border, true: Colors.accent + '55' }}
                    thumbColor={item.value ? Colors.accent : Colors.textMuted}
                  />
                </View>
              ))}
            </View>
          </FadeInView>

          {/* ── Account ── */}
          <FadeInView delay={275}>
            <View style={s.sectionHeader}>
              <View style={s.sectionAccent} />
              <Text style={s.sectionTitle}>ACCOUNT</Text>
            </View>
            <View style={s.card}>
              {ACCOUNT_ITEMS.map((item, i) => (
                <View key={item.label}>
                  <AnimatedPressable style={s.menuRow} scaleDown={0.97} onPress={item.onPress}>
                    <View style={[s.menuIconBox, { backgroundColor: item.color + '14', borderColor: item.color + '28' }]}>
                      <MaterialCommunityIcons name={item.icon} size={15} color={item.color} />
                    </View>
                    <Text style={s.menuLabel}>{item.label}</Text>
                    <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.textMuted} />
                  </AnimatedPressable>
                  {i < ACCOUNT_ITEMS.length - 1 && <View style={s.divider} />}
                </View>
              ))}
            </View>
          </FadeInView>

          {/* ── Logout ── */}
          <FadeInView delay={315}>
            <AnimatedPressable style={s.logoutBtn} scaleDown={0.97} onPress={handleLogout}>
              <View style={s.logoutIconBox}>
                <MaterialCommunityIcons name="logout" size={16} color={Colors.red} />
              </View>
              <Text style={s.logoutText}>SIGN OUT</Text>
            </AnimatedPressable>
          </FadeInView>

          <Text style={s.version}>GYMSETU · TRAINER v1.0</Text>
          <View style={{ height: 32 }} />
        </ScrollView>
      </View>

      {/* ── Edit Profile Modal ── */}
      <Modal visible={showEditModal} transparent animationType="slide">
        <Pressable style={s.backdrop} onPress={() => !editSaving && setShowEditModal(false)} />
        <View style={[s.sheet, { paddingBottom: insets.bottom + 20 }]}>
          <View style={s.sheetHandle} />
          <View style={s.sheetTopRow}>
            <View style={s.sheetTitleRow}>
              <View style={[s.sheetIconBox, { backgroundColor: Colors.accent + '15', borderColor: Colors.accent + '30' }]}>
                <MaterialCommunityIcons name="pencil-outline" size={18} color={Colors.accent} />
              </View>
              <View>
                <Text style={s.sheetTitle}>EDIT PROFILE</Text>
                <Text style={s.sheetSub}>Update your contact details</Text>
              </View>
            </View>
            <Pressable style={s.closeBtn} onPress={() => !editSaving && setShowEditModal(false)}>
              <MaterialCommunityIcons name="close" size={16} color={Colors.textMuted} />
            </Pressable>
          </View>

          <Text style={s.fieldLabel}>PHONE NUMBER</Text>
          <View style={s.inputWrap}>
            <MaterialCommunityIcons name="phone-outline" size={15} color={Colors.textMuted} />
            <TextInput
              style={s.input}
              placeholder="+91 98765 43210"
              placeholderTextColor={Colors.textMuted}
              value={editPhone}
              onChangeText={t => { setEditPhone(t); setEditError(''); }}
              keyboardType="phone-pad"
            />
          </View>

          {!!editError && (
            <View style={s.errRow}>
              <MaterialCommunityIcons name="alert-circle-outline" size={13} color={Colors.red} />
              <Text style={s.errText}>{editError}</Text>
            </View>
          )}

          <AnimatedPressable style={[s.saveBtn, editSaving && { opacity: 0.6 }]} scaleDown={0.97} onPress={handleSavePhone} disabled={editSaving}>
            <LinearGradient colors={[Colors.accent, '#C55A00']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.saveBtnInner}>
              {editSaving
                ? <ActivityIndicator size="small" color="#fff" />
                : <>
                    <MaterialCommunityIcons name="content-save-outline" size={17} color="#fff" />
                    <Text style={s.saveBtnText}>SAVE CHANGES</Text>
                  </>
              }
            </LinearGradient>
          </AnimatedPressable>
        </View>
      </Modal>

      {/* ── Change Password Modal ── */}
      <Modal visible={showPwModal} transparent animationType="slide">
        <Pressable style={s.backdrop} onPress={() => !pwSaving && setShowPwModal(false)} />
        <View style={[s.sheet, { paddingBottom: insets.bottom + 20 }]}>
          <View style={s.sheetHandle} />
          <View style={s.sheetTopRow}>
            <View style={s.sheetTitleRow}>
              <View style={[s.sheetIconBox, { backgroundColor: '#8B5CF615', borderColor: '#8B5CF630' }]}>
                <MaterialCommunityIcons name="lock-outline" size={18} color="#8B5CF6" />
              </View>
              <View>
                <Text style={s.sheetTitle}>CHANGE PASSWORD</Text>
                <Text style={s.sheetSub}>Min. 8 characters required</Text>
              </View>
            </View>
            <Pressable style={s.closeBtn} onPress={() => !pwSaving && setShowPwModal(false)}>
              <MaterialCommunityIcons name="close" size={16} color={Colors.textMuted} />
            </Pressable>
          </View>

          <Text style={s.fieldLabel}>NEW PASSWORD</Text>
          <View style={[s.inputWrap, { marginBottom: 10 }]}>
            <MaterialCommunityIcons name="lock-outline" size={15} color={Colors.textMuted} />
            <TextInput
              style={s.input}
              placeholder="Min. 8 characters"
              placeholderTextColor={Colors.textMuted}
              value={newPw}
              onChangeText={t => { setNewPw(t); setPwError(''); }}
              secureTextEntry
            />
          </View>

          <Text style={s.fieldLabel}>CONFIRM PASSWORD</Text>
          <View style={s.inputWrap}>
            <MaterialCommunityIcons name="lock-check-outline" size={15} color={Colors.textMuted} />
            <TextInput
              style={s.input}
              placeholder="Repeat new password"
              placeholderTextColor={Colors.textMuted}
              value={confirmPw}
              onChangeText={t => { setConfirmPw(t); setPwError(''); }}
              secureTextEntry
            />
          </View>

          {!!pwError && (
            <View style={s.errRow}>
              <MaterialCommunityIcons name="alert-circle-outline" size={13} color={Colors.red} />
              <Text style={s.errText}>{pwError}</Text>
            </View>
          )}
          {pwOk && (
            <View style={[s.errRow, { backgroundColor: Colors.green + '12', borderColor: Colors.green + '28' }]}>
              <MaterialCommunityIcons name="check-circle-outline" size={13} color={Colors.green} />
              <Text style={[s.errText, { color: Colors.green }]}>Password changed successfully!</Text>
            </View>
          )}

          <AnimatedPressable style={[s.saveBtn, pwSaving && { opacity: 0.6 }]} scaleDown={0.97} onPress={handleChangePassword} disabled={pwSaving}>
            <LinearGradient colors={['#8B5CF6', '#6D28D9']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.saveBtnInner}>
              {pwSaving
                ? <ActivityIndicator size="small" color="#fff" />
                : <>
                    <MaterialCommunityIcons name="lock-reset" size={17} color="#fff" />
                    <Text style={s.saveBtnText}>UPDATE PASSWORD</Text>
                  </>
              }
            </LinearGradient>
          </AnimatedPressable>
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
  onlineChip:  { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.green + '14', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: Colors.green + '30' },
  onlineDot:   { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.green },
  onlineText:  { fontFamily: Fonts.condensedBold, fontSize: 9, color: Colors.green, letterSpacing: 1 },

  // Hero
  heroCard:         { backgroundColor: Colors.bgCard, borderRadius: 20, padding: 24, alignItems: 'center', gap: 10, borderWidth: 1, borderColor: Colors.accent + '30', overflow: 'hidden' },
  gymBadge:         { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.accent + '10', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: Colors.accent + '22' },
  gymBadgeText:     { fontFamily: Fonts.condensedBold, fontSize: 9, color: Colors.accent, letterSpacing: 1.5 },
  avatarOuterRing:  { position: 'relative', width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.accent + '18', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.accent + '25' },
  avatarInnerRing:  { width: 68, height: 68, borderRadius: 34, backgroundColor: Colors.accent + '25', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.accent + '40' },
  avatarCircle:     { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.accent, justifyContent: 'center', alignItems: 'center' },
  avatarText:       { fontFamily: Fonts.condensedBold, fontSize: 22, color: '#000', letterSpacing: 1 },
  activeDot:        { position: 'absolute', bottom: 2, right: 2, width: 14, height: 14, borderRadius: 7, backgroundColor: Colors.green, borderWidth: 2, borderColor: Colors.bgCard },
  heroName:         { fontFamily: Fonts.bold, fontSize: 20, color: Colors.text },
  roleBadge:        { flexDirection: 'row', alignItems: 'center', gap: 6 },
  roleDot:          { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.accent },
  roleText:         { fontFamily: Fonts.condensedBold, fontSize: 10, color: Colors.accent, letterSpacing: 0.8 },
  trainerPill:      { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.accent + '12', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: Colors.accent + '28' },
  trainerPillText:  { fontFamily: Fonts.condensedBold, fontSize: 9, color: Colors.accent, letterSpacing: 1 },

  // Stats strip
  statsLoading:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: Colors.bgCard, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: Colors.border },
  statsLoadingText: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted },
  errorBanner:      { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.red + '12', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: Colors.red + '28' },
  errorText:        { flex: 1, fontFamily: Fonts.regular, fontSize: 12, color: Colors.red },
  statsRow:         { flexDirection: 'row', backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: Colors.border },
  statBox:          { flex: 1, alignItems: 'center', paddingVertical: 14, gap: 5 },
  statBorder:       { borderRightWidth: 1, borderRightColor: Colors.border },
  statIconBox:      { width: 28, height: 28, borderRadius: 8, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  statVal:          { fontFamily: Fonts.condensedBold, fontSize: 20 },
  statLabel:        { fontFamily: Fonts.bold, fontSize: 7, color: Colors.textMuted, letterSpacing: 1, textAlign: 'center' },

  // Section header
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  sectionAccent: { width: 3, height: 14, borderRadius: 2, backgroundColor: Colors.accent },
  sectionTitle:  { fontFamily: Fonts.condensedBold, fontSize: 11, color: Colors.textMuted, letterSpacing: 2 },

  card:        { backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  rowBorderTop:{ borderTopWidth: 1, borderTopColor: Colors.border },
  divider:     { height: 1, backgroundColor: Colors.border, marginHorizontal: 14 },

  // Contact
  infoRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  infoIconBox: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  infoLabel:   { fontFamily: Fonts.bold, fontSize: 8, color: Colors.textMuted, letterSpacing: 1.2 },
  infoVal:     { fontFamily: Fonts.medium, fontSize: 13, color: Colors.text, marginTop: 2 },

  // Certifications
  certRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  certIconBox:  { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.accent + '14', borderWidth: 1, borderColor: Colors.accent + '28', justifyContent: 'center', alignItems: 'center' },
  certText:     { flex: 1, fontFamily: Fonts.medium, fontSize: 13, color: Colors.text },
  verifiedBadge:{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: Colors.green + '14', borderRadius: 7, paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderColor: Colors.green + '28' },
  verifiedText: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.green, letterSpacing: 0.5 },

  // Achievements
  achieveGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  achieveCard:    { flex: 1, minWidth: '44%', backgroundColor: Colors.bgCard, borderRadius: 14, padding: 14, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: Colors.border },
  achieveIconBox: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  achieveLabel:   { fontFamily: Fonts.bold, fontSize: 11, color: Colors.text, textAlign: 'center' },
  achieveDesc:    { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted },

  // Notifications
  toggleRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  toggleIconBox: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  toggleLabel:   { fontFamily: Fonts.bold, fontSize: 13, color: Colors.text },
  toggleDesc:    { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 2 },

  // Account
  menuRow:    { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  menuIconBox:{ width: 36, height: 36, borderRadius: 10, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  menuLabel:  { flex: 1, fontFamily: Fonts.medium, fontSize: 13, color: Colors.text },

  // Logout
  logoutBtn:     { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.red + '12', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16, borderWidth: 1, borderColor: Colors.red + '30' },
  logoutIconBox: { width: 34, height: 34, borderRadius: 9, backgroundColor: Colors.red + '18', borderWidth: 1, borderColor: Colors.red + '30', justifyContent: 'center', alignItems: 'center' },
  logoutText:    { flex: 1, fontFamily: Fonts.bold, fontSize: 13, color: Colors.red, letterSpacing: 1.2, textAlign: 'center' },

  version: { textAlign: 'center', fontFamily: Fonts.condensedBold, fontSize: 9, color: Colors.textMuted, letterSpacing: 1.5 },

  // Modal / sheet
  backdrop:     { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.65)' },
  sheet:        { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.bgCard, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 20, paddingTop: 12, gap: 12 },
  sheetHandle:  { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: 6 },
  sheetTopRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sheetTitleRow:{ flexDirection: 'row', alignItems: 'center', gap: 10 },
  sheetIconBox: { width: 42, height: 42, borderRadius: 12, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  sheetTitle:   { fontFamily: Fonts.condensedBold, fontSize: 22, color: Colors.text, letterSpacing: 0.5 },
  sheetSub:     { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  closeBtn:     { width: 30, height: 30, borderRadius: 9, backgroundColor: Colors.bgElevated, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },

  fieldLabel: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted, letterSpacing: 1.5 },
  inputWrap:  { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.bgElevated, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12, paddingVertical: 13 },
  input:      { flex: 1, fontFamily: Fonts.regular, fontSize: 14, color: Colors.text },

  errRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.red + '12', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: Colors.red + '28' },
  errText: { flex: 1, fontFamily: Fonts.regular, fontSize: 12, color: Colors.red },

  saveBtn:      { borderRadius: 16, overflow: 'hidden' },
  saveBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 },
  saveBtnText:  { fontFamily: Fonts.bold, fontSize: 14, color: '#fff', letterSpacing: 1.2 },
});
