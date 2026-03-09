 import { useState, useCallback } from 'react';                                                                  import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
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

  const todaySessions = [
    { id: 1, time: '6:00 AM', member: 'Amit Singh',  type: 'Strength Training',  duration: '60 min', status:    
  'done'     },
    { id: 2, time: '7:30 AM', member: 'Priya Nair',  type: 'Weight Loss',        duration: '45 min', status:    
  'done'     },
    { id: 3, time: '5:00 PM', member: 'Rahul Mehta', type: 'Muscle Gain',        duration: '60 min', status:    
  'upcoming' },
    { id: 4, time: '6:30 PM', member: 'Sneha Patel', type: 'Yoga & Flexibility', duration: '50 min', status:    
  'upcoming' },
  ];

  const alerts = [
    { id: 1, msg: 'Amit Singh missed 3 sessions this week', color: Colors.orange },
    { id: 2, msg: 'Priya Nair reached her weight goal! 🎉',  color: Colors.green  },
    { id: 3, msg: "Rahul Mehta's plan expires in 5 days",    color: Colors.red    },
  ];

  const weekStats = [
    { day: 'M', sessions: 4 },
    { day: 'T', sessions: 3 },
    { day: 'W', sessions: 5 },
    { day: 'T', sessions: 2 },
    { day: 'F', sessions: 4 },
    { day: 'S', sessions: 3 },
    { day: 'S', sessions: 1 },
  ];
  const MAX_SESSIONS = 5;

  const quickActions = [
    { label: 'Mark Attendance', emoji: '✅', color: Colors.green,  screen: 'attendance'    },
    { label: 'Log Progress',    emoji: '📈', color: Colors.accent, screen: 'progress-log'  },
    { label: 'View Members',    emoji: '👥', color: Colors.orange, screen: 'my-members'    },
    { label: 'Workout Plans',   emoji: '📋', color: '#8B5CF6',     screen: 'workout-plans' },
  ];

  export default function TrainerHome() {
    const navigation = useNavigation();
    const insets     = useSafeAreaInsets();
    const { profile } = useAuthStore();

    const [gymName,       setGymName]       = useState('');
    const [memberCount,   setMemberCount]   = useState(0);
    const [todayCheckIns, setTodayCheckIns] = useState(0);
    const [monthTotal,    setMonthTotal]    = useState(0);
    const [loading,       setLoading]       = useState(true);

    const today      = new Date().toISOString().split('T')[0];
    const monthStart = today.slice(0, 8) + '01';

    const hour     = new Date().getHours();
    const greeting = hour < 12 ? 'GOOD MORNING' : hour < 17 ? 'GOOD AFTERNOON' : 'GOOD EVENING';

    const doneSessions     = todaySessions.filter(s => s.status === 'done').length;
    const upcomingSessions = todaySessions.filter(s => s.status === 'upcoming').length;
    const donePercent      = Math.round((doneSessions / todaySessions.length) * 100);

    useFocusEffect(useCallback(() => {
      let active = true;
      async function load() {
        if (!profile?.gym_id) { setLoading(false); return; }
        setLoading(true);

        const { data: gym } = await supabase
          .from('gyms').select('name').eq('id', profile.gym_id).single();
        if (gym && active) setGymName(gym.name ?? '');

        const [members, checkIns, monthAtt] = await Promise.all([
          supabase.from('members').select('id', { count: 'exact', head: true })
            .eq('gym_id', profile.gym_id).eq('status', 'active'),
          supabase.from('attendance').select('id', { count: 'exact', head: true })
            .eq('gym_id', profile.gym_id).eq('check_in_date', today),
          supabase.from('attendance').select('id', { count: 'exact', head: true })
            .eq('gym_id', profile.gym_id).gte('check_in_date', monthStart),
        ]);

        if (active) {
          setMemberCount(members.count ?? 0);
          setTodayCheckIns(checkIns.count ?? 0);
          setMonthTotal(monthAtt.count ?? 0);
        }
        setLoading(false);
      }
      load();
      return () => { active = false; };
    }, [profile?.gym_id]));

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
              <View style={styles.gymLogoPlaceholder}>
                <Text style={styles.gymLogoInitial}>{gymName[0].toUpperCase()}</Text>
              </View>
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
              <Text style={styles.greetName}>{profile?.full_name ?? 'TRAINER'}</Text>
            </View>
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingNum}>4.9</Text>
              <Text style={styles.ratingLabel}>⭐{'\n'}RATING</Text>
            </View>
          </View>
        </FadeInView>

        {/* Overview Card */}
        <FadeInView delay={80}>
          <View style={styles.overviewCard}>
            <View style={styles.cardGlow} />
            <View style={styles.overviewCardTop}>
              <View>
                <Text style={styles.cardMicroLabel}>TODAY'S OVERVIEW</Text>
                <Text style={styles.overviewTitle}>
                  {doneSessions} of {todaySessions.length} sessions done
                </Text>
              </View>
              <View style={styles.sessionsBadge}>
                <Text style={styles.sessionsNum}>{upcomingSessions}</Text>
                <Text style={styles.sessionsUnit}>COMING{'\n'}UP</Text>
              </View>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${donePercent}%` as any }]} />
            </View>
            <View style={styles.overviewStats}>
              {[
                { val: memberCount,   label: 'MEMBERS'    },
                { val: todayCheckIns, label: 'CHECK-INS'  },
                { val: monthTotal,    label: 'THIS MONTH' },
              ].map((s, i) => (
                <View key={i} style={styles.ovStat}>
                  <Text style={styles.ovStatVal}>{s.val}</Text>
                  <Text style={styles.ovStatLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </FadeInView>

        {/* Quick Actions */}
        <FadeInView delay={160}>
          <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map(a => (
              <AnimatedPressable
                key={a.label}
                style={[styles.actionCard, { borderColor: a.color + '30' }]}
                scaleDown={0.95}
                onPress={() => navigation.navigate(a.screen as never)}
              >
                <View style={[styles.actionIconWrap, { backgroundColor: a.color + '18' }]}>
                  <Text style={styles.actionEmoji}>{a.emoji}</Text>
                </View>
                <Text style={styles.actionLabel}>{a.label}</Text>
              </AnimatedPressable>
            ))}
          </View>
        </FadeInView>

        {/* Today's Sessions */}
        <FadeInView delay={240}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>TODAY'S SESSIONS</Text>
            <View style={styles.upcomingPill}>
              <Text style={styles.upcomingPillText}>{upcomingSessions} UPCOMING</Text>
            </View>
          </View>
        </FadeInView>

        {todaySessions.map((s, i) => (
          <FadeInView key={s.id} delay={280 + i * 55}>
            <View style={[styles.sessionCard, s.status === 'done' && styles.sessionCardDone]}>
              <View style={[styles.sessionBar, { backgroundColor: s.status === 'done' ? Colors.green :
  Colors.accent }]} />
              <View style={styles.sessionTimeCol}>
                <Text style={styles.sessionTimePrimary}>{s.time.split(' ')[0]}</Text>
                <Text style={styles.sessionTimeSuffix}>{s.time.split(' ')[1]}</Text>
              </View>
              <View style={styles.sessionDivider} />
              <View style={styles.sessionInfo}>
                <Text style={[styles.sessionMember, s.status === 'done' && { color: Colors.textMuted
  }]}>{s.member}</Text>
                <Text style={styles.sessionType}>{s.type} · {s.duration}</Text>
              </View>
              <View style={[styles.statusDot, { backgroundColor: s.status === 'done' ? Colors.green :
  Colors.accent }]} />
            </View>
          </FadeInView>
        ))}

        {/* Weekly Bar Chart */}
        <FadeInView delay={520}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>THIS WEEK'S SESSIONS</Text>
            <View style={styles.barChart}>
              {weekStats.map((w, i) => {
                const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
                const isToday    = i === todayIndex;
                const fillPct    = (w.sessions / MAX_SESSIONS) * 100;
                return (
                  <View key={i} style={styles.barCol}>
                    <Text style={[styles.barVal, isToday && { color: Colors.accent }]}>{w.sessions}</Text>      
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, {
                        height: `${fillPct}%` as any,
                        backgroundColor: i === 6 ? Colors.border : isToday ? Colors.accent : Colors.green,      
                      }]} />
                    </View>
                    <Text style={[styles.barDay, isToday && { color: Colors.accent }]}>{w.day}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </FadeInView>

        {/* Member Alerts */}
        <FadeInView delay={600}>
          <Text style={styles.sectionTitle}>MEMBER ALERTS</Text>
          {alerts.map((a, i) => (
            <FadeInView key={a.id} delay={630 + i * 50}>
              <View style={styles.noticeCard}>
                <View style={[styles.noticeDot, { backgroundColor: a.color }]} />
                <Text style={styles.noticeBody}>{a.msg}</Text>
              </View>
            </FadeInView>
          ))}
        </FadeInView>

        <View style={{ height: 24 }} />
      </ScrollView>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    content:   { paddingHorizontal: 16, gap: 12 },

    gymBrandRow:        { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6,
  paddingHorizontal: 4 },
    gymLogoPlaceholder: { width: 28, height: 28, borderRadius: 6, backgroundColor: Colors.accent + '20',        
  justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.accent + '30' },
    gymLogoInitial:     { fontFamily: Fonts.condensedBold, fontSize: 14, color: Colors.accent },
    gymBrandName:       { fontFamily: Fonts.condensedBold, fontSize: 13, color: Colors.textMuted, letterSpacing:
   2 },

    topBar:      { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
    menuBtn:     { width: 40, height: 40, borderRadius: 10, backgroundColor: Colors.bgCard, justifyContent:     
  'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
    greetSub:    { fontFamily: Fonts.medium, fontSize: 9, color: Colors.textMuted, letterSpacing: 1.2 },        
    greetName:   { fontFamily: Fonts.bold, fontSize: 20, color: Colors.text, marginTop: 1 },
    ratingBadge: { backgroundColor: Colors.green + '18', borderRadius: 10, paddingHorizontal: 12,
  paddingVertical: 8, alignItems: 'center', flexDirection: 'row', gap: 6, borderWidth: 1, borderColor:
  Colors.green + '30' },
    ratingNum:   { fontFamily: Fonts.condensedBold, fontSize: 24, color: Colors.green },
    ratingLabel: { fontFamily: Fonts.medium, fontSize: 8, color: Colors.green, letterSpacing: 0.8, lineHeight:  
  11 },

    overviewCard:    { backgroundColor: Colors.bgCard, borderRadius: 20, padding: 20, gap: 14, overflow:        
  'hidden', borderWidth: 1, borderColor: Colors.border },
    cardGlow:        { position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: 60,   
  backgroundColor: Colors.accentGlow },
    overviewCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },       
    cardMicroLabel:  { fontFamily: Fonts.medium, fontSize: 9, color: Colors.textMuted, letterSpacing: 1.2,      
  marginBottom: 4 },
    overviewTitle:   { fontFamily: Fonts.condensedBold, fontSize: 22, color: Colors.text, letterSpacing: 0.5 }, 
    sessionsBadge:   { backgroundColor: Colors.accentMuted, borderRadius: 12, paddingHorizontal: 12,
  paddingVertical: 8, alignItems: 'center' },
    sessionsNum:     { fontFamily: Fonts.condensedBold, fontSize: 26, color: Colors.accent },
    sessionsUnit:    { fontFamily: Fonts.medium, fontSize: 8, color: Colors.accent, letterSpacing: 0.8,
  textAlign: 'center' },
    progressTrack:   { height: 3, backgroundColor: Colors.border, borderRadius: 2, overflow: 'hidden' },        
    progressFill:    { height: 3, backgroundColor: Colors.accent, borderRadius: 2 },
    overviewStats:   { flexDirection: 'row' },
    ovStat:          { flex: 1, alignItems: 'center', gap: 3 },
    ovStatVal:       { fontFamily: Fonts.condensedBold, fontSize: 24, color: Colors.text },
    ovStatLabel:     { fontFamily: Fonts.medium, fontSize: 9, color: Colors.textMuted, letterSpacing: 0.8 },    

    sectionTitle:      { fontFamily: Fonts.bold, fontSize: 10, color: Colors.textMuted, letterSpacing: 1.5,     
  marginTop: 4 },
    actionsGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
    actionCard:        { width: '47%', alignItems: 'center', gap: 10, backgroundColor: Colors.bgCard,
  borderRadius: 14, paddingVertical: 18, borderWidth: 1 },
    actionIconWrap:    { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center'
   },
    actionEmoji:       { fontSize: 22 },
    actionLabel:       { fontFamily: Fonts.bold, fontSize: 12, color: Colors.text, textAlign: 'center' },       

    sectionHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    upcomingPill:      { backgroundColor: Colors.accentMuted, borderRadius: 20, paddingHorizontal: 10,
  paddingVertical: 4, borderWidth: 1, borderColor: Colors.accent + '30' },
    upcomingPillText:  { fontSize: 9, fontFamily: Fonts.bold, color: Colors.accent, letterSpacing: 1 },
    sessionCard:       { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgCard,
  borderRadius: 14, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', marginBottom: 8 },
    sessionCardDone:   { opacity: 0.6 },
    sessionBar:        { width: 3, alignSelf: 'stretch' },
    sessionTimeCol:    { width: 54, alignItems: 'center', paddingVertical: 14, gap: 1 },
    sessionTimePrimary:{ fontSize: 14, fontFamily: Fonts.condensedBold, color: Colors.text },
    sessionTimeSuffix: { fontSize: 9, fontFamily: Fonts.bold, color: Colors.textMuted, letterSpacing: 0.5 },    
    sessionDivider:    { width: 1, height: 34, backgroundColor: Colors.border },
    sessionInfo:       { flex: 1, paddingHorizontal: 12, paddingVertical: 14 },
    sessionMember:     { fontSize: 14, fontFamily: Fonts.bold, color: Colors.text },
    sessionType:       { fontSize: 11, fontFamily: Fonts.regular, color: Colors.textMuted, marginTop: 2 },      
    statusDot:         { width: 7, height: 7, borderRadius: 4, marginRight: 14 },

    card:      { backgroundColor: Colors.bgCard, borderRadius: 16, padding: 16, gap: 12, borderWidth: 1,        
  borderColor: Colors.border },
    cardTitle: { fontFamily: Fonts.bold, fontSize: 11, color: Colors.textMuted, letterSpacing: 1.2 },
    barChart:  { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 88 },
    barCol:    { flex: 1, alignItems: 'center', gap: 4 },
    barVal:    { fontSize: 10, fontFamily: Fonts.bold, color: Colors.textMuted },
    barTrack:  { width: '100%', height: 60, backgroundColor: Colors.border, borderRadius: 6, overflow: 'hidden',
   justifyContent: 'flex-end' },
    barFill:   { width: '100%', borderRadius: 6 },
    barDay:    { fontSize: 10, fontFamily: Fonts.bold, color: Colors.textMuted },

    noticeCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: Colors.bgCard,      
  borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 6 },
    noticeDot:  { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
    noticeBody: { flex: 1, fontSize: 13, fontFamily: Fonts.regular, color: Colors.textMuted, lineHeight: 19 },  
  });
