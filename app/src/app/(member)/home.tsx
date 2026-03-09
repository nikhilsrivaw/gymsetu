  import { useState, useCallback } from 'react';                                                                       import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
  import { useNavigation, useFocusEffect } from 'expo-router';                                                       
  import { DrawerActions } from '@react-navigation/native';                                                          
  import { MaterialCommunityIcons } from '@expo/vector-icons';
  import { useSafeAreaInsets } from 'react-native-safe-area-context';
  import { Colors } from '@/constants/colors';
  import { Fonts } from '@/constants/fonts';
  import FadeInView from '@/components/FadeInView';
  import AnimatedPressable from '@/components/AnimatedPressable';
  import { supabase } from '@/lib/supabase';
  import { useAuthStore } from '@/store/authStore';

  interface LbEntry { rank: number; member_id: string; name: string; days: number; isMe: boolean; }
  interface ActivePlanData { name: string; daysLeft: number; totalDays: number; }
  interface Notice { id: string; title: string; body: string; emoji: string; created_at: string; }

  function timeAgo(dateStr: string): string {
    const diff  = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (hours < 1)  return 'just now';
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }

  export default function MemberHome() {
    const { session } = useAuthStore();
    const [water, setWater] = useState(3);
    const waterGoal = 8;
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    const [memberName,    setMemberName]    = useState('');
    const [gymName,       setGymName]       = useState('');
    const [gymLogo,       setGymLogo]       = useState<string | null>(null);
    const [activePlan,    setActivePlan]    = useState<ActivePlanData | null>(null);
    const [daysThisMonth, setDaysThisMonth] = useState(0);
    const [streak,        setStreak]        = useState(0);
    const [leaderboard,   setLeaderboard]   = useState<LbEntry[]>([]);
    const [notices,       setNotices]       = useState<Notice[]>([]);
    const [loading,       setLoading]       = useState(true);

    const today      = new Date().toISOString().split('T')[0];
    const monthStart = today.slice(0, 8) + '01';

    const hour     = new Date().getHours();
    const greeting = hour < 12 ? 'GOOD MORNING' : hour < 17 ? 'GOOD AFTERNOON' : 'GOOD EVENING';

    useFocusEffect(useCallback(() => {
      let active = true;
      async function load() {
        if (!session?.user?.id) { setLoading(false); return; }
        setLoading(true);

        const { data: m } = await supabase
          .from('members')
          .select('id, full_name, gym_id')
          .eq('user_id', session.user.id)
          .single();

        if (!m || !active) { setLoading(false); return; }
        setMemberName(m.full_name);

        // Gym branding
        const { data: gym } = await supabase
          .from('gyms')
          .select('name, logo_url')
          .eq('id', m.gym_id)
          .single();
        if (gym && active) {
          setGymName(gym.name ?? '');
          setGymLogo(gym.logo_url ?? null);
        }

        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

        const [planRes, attMonthRes, attStreakRes, lbRes, noticesRes] = await Promise.all([
          supabase
            .from('member_plans')
            .select('end_date, membership_plans(name, duration_days)')
            .eq('member_id', m.id)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from('attendance')
            .select('check_in_date')
            .eq('member_id', m.id)
            .gte('check_in_date', monthStart),
          supabase
            .from('attendance')
            .select('check_in_date')
            .eq('member_id', m.id)
            .gte('check_in_date', sixtyDaysAgo.toISOString().split('T')[0])
            .order('check_in_date', { ascending: false }),
          supabase
            .from('attendance')
            .select('member_id, members(full_name)')
            .eq('gym_id', m.gym_id)
            .gte('check_in_date', monthStart),
          supabase
            .from('announcements')
            .select('id, title, body, emoji, created_at')
            .eq('gym_id', m.gym_id)
            .order('created_at', { ascending: false })
            .limit(3),
        ]);

        if (!active) return;

        if (planRes.data) {
          const end      = new Date(planRes.data.end_date);
          const daysLeft = Math.max(0, Math.ceil((end.getTime() - Date.now()) / 86400000));
          setActivePlan({
            name:      (planRes.data.membership_plans as any)?.name ?? 'Active Plan',
            daysLeft,
            totalDays: (planRes.data.membership_plans as any)?.duration_days ?? 30,
          });
        }

        setDaysThisMonth((attMonthRes.data ?? []).length);

        const dateSet = new Set((attStreakRes.data ?? []).map((a: any) => a.check_in_date));
        let s = 0;
        const d = new Date();
        while (dateSet.has(d.toISOString().split('T')[0])) { s++; d.setDate(d.getDate() - 1); }
        setStreak(s);

        const lbMap = new Map<string, { name: string; days: number }>();
        for (const row of (lbRes.data ?? [])) {
          const key = (row as any).member_id;
          if (!lbMap.has(key)) lbMap.set(key, { name: (row as any).members?.full_name ?? '?', days: 0 });
          lbMap.get(key)!.days++;
        }
        const lb: LbEntry[] = Array.from(lbMap.entries())
          .map(([id, v]) => ({ member_id: id, name: v.name, days: v.days, rank: 0, isMe: id === m.id }))
          .sort((a, b) => b.days - a.days)
          .slice(0, 5)
          .map((e, i) => ({ ...e, rank: i + 1 }));
        setLeaderboard(lb);

        setNotices(noticesRes.data ?? []);
        setLoading(false);
      }
      load();
      return () => { active = false; };
    }, [session?.user?.id, monthStart]));

    const usedPercent = activePlan
      ? Math.min(100, Math.round(((activePlan.totalDays - activePlan.daysLeft) / activePlan.totalDays) * 100))       
      : 0;

    if (loading) {
      return (
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator color={Colors.accent} size="large" />
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Gym Brand Header */}
        {gymName ? (
          <FadeInView delay={0}>
            <View style={styles.gymBrandRow}>
              {gymLogo ? (
                <Image source={{ uri: gymLogo }} style={styles.gymLogo} resizeMode="contain" />
              ) : (
                <View style={styles.gymLogoPlaceholder}>
                  <Text style={styles.gymLogoInitial}>{gymName[0].toUpperCase()}</Text>
                </View>
              )}
              <Text style={styles.gymBrandName}>{gymName.toUpperCase()}</Text>
            </View>
          </FadeInView>
        ) : null}

        {/* Top Bar */}
        <FadeInView delay={gymName ? 40 : 0}>
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.menuBtn}
              onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            >
              <MaterialCommunityIcons name="menu" size={22} color={Colors.text} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.greetSub}>{greeting}</Text>
              <Text style={styles.greetName}>{memberName}</Text>
            </View>
            <View style={styles.streakBadge}>
              <Text style={styles.streakNum}>{streak}</Text>
              <Text style={styles.streakLabel}>DAY{'\n'}STREAK</Text>
            </View>
          </View>
        </FadeInView>

        {/* Membership Card */}
        <FadeInView delay={80}>
          <View style={styles.memberCard}>
            <View style={styles.cardGlow} />
            <View style={styles.memberCardTop}>
              <View>
                <Text style={styles.cardMicroLabel}>ACTIVE PLAN</Text>
                <Text style={styles.memberCardPlan}>
                  {activePlan ? activePlan.name.toUpperCase() : 'NO ACTIVE PLAN'}
                </Text>
              </View>
              <View style={styles.expiryBadge}>
                <Text style={styles.expiryNum}>{activePlan?.daysLeft ?? 0}</Text>
                <Text style={styles.expiryUnit}>DAYS{'\n'}LEFT</Text>
              </View>
            </View>
            <View style={styles.planTrack}>
              <View style={[styles.planFill, { width: `${usedPercent}%` as any }]} />
            </View>
            <View style={styles.memberCardStats}>
              {[
                { val: daysThisMonth, label: 'VISITS' },
                { val: streak,        label: 'STREAK' },
                { val: `${Math.min(100, Math.round((daysThisMonth / 26) * 100))}%`, label: 'GOAL' },
              ].map((s, i) => (
                <View key={i} style={styles.mcStat}>
                  <Text style={styles.mcStatVal}>{s.val}</Text>
                  <Text style={styles.mcStatLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </FadeInView>

        {/* QR Check-In */}
        <FadeInView delay={160}>
          <AnimatedPressable style={styles.qrCard} scaleDown={0.97}>
            <View style={styles.qrIconWrap}>
              <MaterialCommunityIcons name="qrcode-scan" size={26} color={Colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.qrTitle}>TAP TO CHECK IN</Text>
              <Text style={styles.qrSub}>Show QR at the front desk</Text>
            </View>
            <View style={styles.qrArrow}>
              <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.accent} />
            </View>
          </AnimatedPressable>
        </FadeInView>

        {/* Water Tracker */}
        <FadeInView delay={240}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>WATER INTAKE</Text>
              <Text style={styles.waterCount}>
                <Text style={styles.waterNum}>{water}</Text>
                <Text style={styles.waterDenom}> / {waterGoal} glasses</Text>
              </Text>
            </View>
            <View style={styles.waterGrid}>
              {Array.from({ length: waterGoal }).map((_, i) => (
                <TouchableOpacity key={i} onPress={() => setWater(i + 1)}>
                  <View style={[styles.waterDrop, i < water && styles.waterDropFilled]}>
                    <MaterialCommunityIcons
                      name={i < water ? 'water' : 'water-outline'}
                      size={22}
                      color={i < water ? Colors.accent : Colors.border}
                    />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.waterBar}>
              <View style={[styles.waterFill, { width: `${(water / waterGoal) * 100}%` as any }]} />
            </View>
          </View>
        </FadeInView>

        {/* Announcements */}
        {notices.length > 0 && (
          <FadeInView delay={320}>
            <Text style={styles.sectionTitle}>LATEST NOTICES</Text>
            {notices.map(a => (
              <View key={a.id} style={styles.noticeCard}>
                <View style={styles.noticeDot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.noticeTitle}>{a.emoji} {a.title}</Text>
                  <Text style={styles.noticeBody}>{a.body}</Text>
                </View>
                <Text style={styles.noticeTime}>{timeAgo(a.created_at)}</Text>
              </View>
            ))}
          </FadeInView>
        )}

        {/* Leaderboard */}
        {leaderboard.length > 0 && (
          <FadeInView delay={400}>
            <Text style={styles.sectionTitle}>MONTHLY LEADERBOARD</Text>
            <View style={styles.card}>
              {leaderboard.map((l, i) => (
                <View
                  key={l.member_id}
                  style={[styles.lbRow, l.isMe && styles.lbRowMe, i < leaderboard.length - 1 && styles.lbRowBorder]} 
                >
                  <Text style={[styles.lbRank, l.rank === 1 && { color: Colors.accent }]}>
                    {String(l.rank).padStart(2, '0')}
                  </Text>
                  <Text style={[styles.lbName, l.isMe && { color: Colors.accent }]}>
                    {l.name}{l.isMe ? '  ← YOU' : ''}
                  </Text>
                  <Text style={styles.lbDays}>{l.days} days</Text>
                </View>
              ))}
            </View>
          </FadeInView>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    content:   { paddingHorizontal: 16, gap: 12 },

    gymBrandRow:        { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, paddingHorizontal: 
  4 },
    gymLogo:            { width: 28, height: 28, borderRadius: 6 },
    gymLogoPlaceholder: { width: 28, height: 28, borderRadius: 6, backgroundColor: Colors.accent + '20',
  justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.accent + '30' },
    gymLogoInitial:     { fontFamily: Fonts.condensedBold, fontSize: 14, color: Colors.accent },
    gymBrandName:       { fontFamily: Fonts.condensedBold, fontSize: 13, color: Colors.textMuted, letterSpacing: 2 },

    topBar:      { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
    menuBtn:     { width: 40, height: 40, borderRadius: 10, backgroundColor: Colors.bgCard, justifyContent: 'center',
   alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
    greetSub:    { fontFamily: Fonts.medium, fontSize: 9, color: Colors.textMuted, letterSpacing: 1.2 },
    greetName:   { fontFamily: Fonts.bold, fontSize: 20, color: Colors.text, marginTop: 1 },
    streakBadge: { backgroundColor: Colors.accentMuted, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, 
  alignItems: 'center', flexDirection: 'row', gap: 6, borderWidth: 1, borderColor: Colors.accent + '30' },
    streakNum:   { fontFamily: Fonts.condensedBold, fontSize: 24, color: Colors.accent },
    streakLabel: { fontFamily: Fonts.medium, fontSize: 8, color: Colors.accent, letterSpacing: 0.8, lineHeight: 11 },

    memberCard:      { backgroundColor: Colors.bgCard, borderRadius: 20, padding: 20, gap: 14, overflow: 'hidden',   
  borderWidth: 1, borderColor: Colors.border },
    cardGlow:        { position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: 60,        
  backgroundColor: Colors.accentGlow },
    memberCardTop:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    cardMicroLabel:  { fontFamily: Fonts.medium, fontSize: 9, color: Colors.textMuted, letterSpacing: 1.2,
  marginBottom: 4 },
    memberCardPlan:  { fontFamily: Fonts.condensedBold, fontSize: 22, color: Colors.text, letterSpacing: 0.5 },      
    expiryBadge:     { backgroundColor: Colors.accentMuted, borderRadius: 12, paddingHorizontal: 12, paddingVertical:
   8, alignItems: 'center' },
    expiryNum:       { fontFamily: Fonts.condensedBold, fontSize: 26, color: Colors.accent },
    expiryUnit:      { fontFamily: Fonts.medium, fontSize: 8, color: Colors.accent, letterSpacing: 0.8, textAlign:   
  'center' },
    planTrack:       { height: 3, backgroundColor: Colors.border, borderRadius: 2, overflow: 'hidden' },
    planFill:        { height: 3, backgroundColor: Colors.accent, borderRadius: 2 },
    memberCardStats: { flexDirection: 'row' },
    mcStat:          { flex: 1, alignItems: 'center', gap: 3 },
    mcStatVal:       { fontFamily: Fonts.condensedBold, fontSize: 24, color: Colors.text },
    mcStatLabel:     { fontFamily: Fonts.medium, fontSize: 9, color: Colors.textMuted, letterSpacing: 0.8 },

    qrCard:    { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: Colors.bgCard, borderRadius:  
  14, padding: 16, borderWidth: 1, borderColor: Colors.accent + '25' },
    qrIconWrap:{ width: 48, height: 48, borderRadius: 12, backgroundColor: Colors.accentMuted, justifyContent:       
  'center', alignItems: 'center' },
    qrTitle:   { fontFamily: Fonts.bold, fontSize: 13, color: Colors.text, letterSpacing: 0.5 },
    qrSub:     { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, marginTop: 2 },
    qrArrow:   { width: 32, height: 32, borderRadius: 8, backgroundColor: Colors.accentMuted, justifyContent:        
  'center', alignItems: 'center' },

    card:       { backgroundColor: Colors.bgCard, borderRadius: 16, padding: 16, gap: 12, borderWidth: 1,
  borderColor: Colors.border },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cardTitle:  { fontFamily: Fonts.bold, fontSize: 11, color: Colors.textMuted, letterSpacing: 1.2 },
    waterCount: {},
    waterNum:   { fontFamily: Fonts.condensedBold, fontSize: 18, color: Colors.accent },
    waterDenom: { fontFamily: Fonts.medium, fontSize: 12, color: Colors.textMuted },
    waterGrid:  { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
    waterDrop:  { width: 34, height: 34, borderRadius: 8, backgroundColor: Colors.bgElevated, justifyContent:        
  'center', alignItems: 'center' },
    waterDropFilled: { backgroundColor: Colors.accentMuted },
    waterBar:   { height: 3, backgroundColor: Colors.border, borderRadius: 2, overflow: 'hidden' },
    waterFill:  { height: 3, backgroundColor: Colors.accent, borderRadius: 2 },

    sectionTitle: { fontFamily: Fonts.bold, fontSize: 10, color: Colors.textMuted, letterSpacing: 1.5, marginTop: 4  
  },
    noticeCard:   { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: Colors.bgCard,
  borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 6 },
    noticeDot:    { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.accent, marginTop: 5 },
    noticeTitle:  { fontFamily: Fonts.bold, fontSize: 13, color: Colors.text },
    noticeBody:   { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, marginTop: 2 },
    noticeTime:   { fontFamily: Fonts.medium, fontSize: 10, color: Colors.textMuted },

    lbRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
    lbRowMe:     { backgroundColor: Colors.accentMuted + '50', borderRadius: 8, paddingHorizontal: 8,
  marginHorizontal: -8 },
    lbRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
    lbRank:      { fontFamily: Fonts.condensedBold, fontSize: 20, color: Colors.textMuted, width: 28 },
    lbName:      { flex: 1, fontFamily: Fonts.bold, fontSize: 14, color: Colors.text },
    lbDays:      { fontFamily: Fonts.medium, fontSize: 12, color: Colors.textMuted },
  });