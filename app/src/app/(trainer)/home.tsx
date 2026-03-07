import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from
    'react-native';
import { useNavigation, useFocusEffect } from 'expo-router';
import { DrawerActions } from '@react-navigation/native'; import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors'; import { Fonts } from '@/constants/fonts';
import FadeInView from '@/components/FadeInView';
import AnimatedPressable from '@/components/AnimatedPressable';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

const todaySessions = [
    {
        id: 1, time: '6:00 AM', member: 'Amit Singh', type: 'Strength Training',
        duration: '60 min', status: 'done'
    },
    {
        id: 2, time: '7:30 AM', member: 'Priya Nair', type: 'Weight Loss',
        duration: '45 min', status: 'done'
    },
    {
        id: 3, time: '5:00 PM', member: 'Rahul Mehta', type: 'Muscle Gain',
        duration: '60 min', status: 'upcoming'
    },
    {
        id: 4, time: '6:30 PM', member: 'Sneha Patel', type: 'Yoga & Flexibility',
        duration: '50 min', status: 'upcoming'
    },
];

const alerts = [
    { id: 1, msg: 'Amit Singh missed 3 sessions this week', color: Colors.orange },
    { id: 2, msg: 'Priya Nair reached her weight goal! 🎉', color: Colors.green },
    { id: 3, msg: "Rahul Mehta's plan expires in 5 days", color: Colors.red },
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
    {
        label: 'Mark Attendance', emoji: '✅', color: Colors.green, screen:
            'attendance'
    },
    {
        label: 'Log Progress', emoji: '📈', color: Colors.accent, screen:
            'progress-log'
    },
    {
        label: 'View Members', emoji: '👥', color: Colors.orange, screen:
            'my-members'
    },
    {
        label: 'Workout Plans', emoji: '📋', color: '#8B5CF6', screen:
            'workout-plans'
    },
];

export default function TrainerHome() {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { profile } = useAuthStore();

    const [memberCount, setMemberCount] = useState(0);
    const [todayCheckIns, setTodayCheckIns] = useState(0);
    const [monthTotal, setMonthTotal] = useState(0);

    const fetchStats = useCallback(async () => {
        if (!profile?.gym_id) return;
        const todayStr = new Date().toISOString().split('T')[0];
        const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            .toISOString().split('T')[0];

        const [members, checkIns, monthAtt] = await Promise.all([
            supabase.from('members').select('id', { count: 'exact', head: true })
                .eq('gym_id', profile.gym_id).eq('status', 'active'),
            supabase.from('attendance').select('id', { count: 'exact', head: true })
                .eq('gym_id', profile.gym_id).eq('check_in_date', todayStr),
            supabase.from('attendance').select('id', { count: 'exact', head: true })
                .eq('gym_id', profile.gym_id).gte('check_in_date', monthStart),
        ]);

        setMemberCount(members.count ?? 0);
        setTodayCheckIns(checkIns.count ?? 0);
        setMonthTotal(monthAtt.count ?? 0);
    }, [profile?.gym_id]);

    useFocusEffect(useCallback(() => { fetchStats(); }, [fetchStats]));

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'GOOD MORNING' : hour < 17 ? 'GOOD AFTERNOON' :
        'GOOD EVENING';
    const upcomingSessions = todaySessions.filter(s => s.status ===
        'upcoming').length;

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}
            showsVerticalScrollIndicator={false}
        >
            {/* Top Bar */}
            <FadeInView delay={0}>
                <View style={styles.topBar}>
                    <TouchableOpacity
                        style={styles.menuBtn}
                        onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
                    >
                        <MaterialCommunityIcons name="menu" size={24} color={Colors.text} />
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.greetSub}>{greeting}</Text>
                        <Text style={styles.greetName}>{profile?.full_name?.toUpperCase() ||
                            'TRAINER'}</Text>
                    </View>
                    <View style={styles.ratingBadge}>
                        <Text style={styles.ratingVal}>4.9</Text>
                        <Text style={styles.ratingStar}>⭐</Text>
                    </View>
                </View>
            </FadeInView>

            {/* Stats Row */}
            <FadeInView delay={70}>
                <View style={styles.statsRow}>
                    <View style={[styles.statCard, { borderColor: Colors.green + '40' }]}>
                        <Text style={styles.statEmoji}>👥</Text>
                        <Text style={styles.statVal}>{memberCount}</Text>
                        <Text style={styles.statLabel}>MEMBERS</Text>
                    </View>
                    <View style={[styles.statCard, { borderColor: Colors.accent + '40' }]}>
                        <Text style={styles.statEmoji}>✅</Text>
                        <Text style={styles.statVal}>{todayCheckIns}</Text>
                        <Text style={styles.statLabel}>TODAY IN</Text>
                    </View>
                    <View style={[styles.statCard, { borderColor: Colors.orange + '40' }]}>
                        <Text style={styles.statEmoji}>📅</Text>
                        <Text style={styles.statVal}>{monthTotal}</Text>
                        <Text style={styles.statLabel}>THIS MONTH</Text>
                    </View>
                </View>
            </FadeInView>

            {/* Weekly Bar Chart */}
            <FadeInView delay={130}>
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>THIS WEEK'S SESSIONS</Text>
                    <View style={styles.barChart}>
                        {weekStats.map((w, i) => {
                            const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
                            const isToday = i === todayIndex;
                            const fillPct = (w.sessions / MAX_SESSIONS) * 100; return (<View key={i} style={styles.barCol}>                                                   <Text style={[styles.barVal, isToday && { color: Colors.accent }]}>{w.sessions}</Text>
                                <View style={styles.barTrack}>                                                         <View style={[styles.barFill, {
                                    height: `${fillPct}%` as any,
                                    backgroundColor: i === 6 ? Colors.border : isToday ? Colors.accent :
                                        Colors.green,
                                }]} />                                                                             </View>
                                <Text style={[styles.barDay, isToday && {
                                    color: Colors.accent
                                }]}>{w.day}</Text>
                            </View>
                            );
                        })}
                    </View>
                </View>
            </FadeInView>

            {/* Today's Sessions */}
            <FadeInView delay={190}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionLabel}>TODAY'S SESSIONS</Text>
                    <View style={styles.upcomingPill}>
                        <Text style={styles.upcomingPillText}>{upcomingSessions}
                            UPCOMING</Text>
                    </View>
                </View>
            </FadeInView>

            {todaySessions.map((s, i) => (
                <FadeInView key={s.id} delay={230 + i * 55}>
                    <View style={[styles.sessionCard, s.status === 'done' &&
                        styles.sessionCardDone]}>
                        <View style={[styles.sessionBar, {
                            backgroundColor: s.status === 'done'
                                ? Colors.green : Colors.accent
                        }]} />
                        <View style={styles.sessionTimeCol}>
                            <Text style={styles.sessionTimePrimary}>{s.time.split(' ')[0]}</Text>
                            <Text style={styles.sessionTimeSuffix}>{s.time.split(' ')[1]}</Text>
                        </View>
                        <View style={styles.sessionDivider} />
                        <View style={styles.sessionInfo}>
                            <Text style={[styles.sessionMember, s.status === 'done' && {
                                color:
                                    Colors.textMuted
                            }]}>
                                {s.member}
                            </Text>
                            <Text style={styles.sessionType}>{s.type} · {s.duration}</Text>
                        </View>
                        <View style={[styles.statusDot, {
                            backgroundColor: s.status === 'done'
                                ? Colors.green : Colors.accent
                        }]} />
                    </View>
                </FadeInView>
            ))}

            {/* Member Alerts */}
            <FadeInView delay={460}>
                <Text style={styles.sectionLabel}>MEMBER ALERTS</Text>
            </FadeInView>
            {alerts.map((a, i) => (
                <FadeInView key={a.id} delay={490 + i * 50}>
                    <View style={[styles.alertCard, { borderLeftColor: a.color }]}>
                        <View style={[styles.alertDot, { backgroundColor: a.color }]} />
                        <Text style={styles.alertMsg}>{a.msg}</Text>
                    </View>
                </FadeInView>
            ))}

            {/* Quick Actions */}
            <FadeInView delay={630}>
                <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
                <View style={styles.actionsGrid}>
                    {quickActions.map(a => (
                        <AnimatedPressable
                            key={a.label}
                            style={[styles.actionCard, { borderColor: a.color + '30' }]}
                            scaleDown={0.95}
                            onPress={() => navigation.navigate(a.screen as never)}
                        >
                            <View style={[styles.actionIconWrap, {
                                backgroundColor: a.color +
                                    '18'
                            }]}>
                                <Text style={styles.actionEmoji}>{a.emoji}</Text>
                            </View>
                            <Text style={styles.actionLabel}>{a.label}</Text>
                        </AnimatedPressable>
                    ))}
                </View>
            </FadeInView>

            <View style={{ height: 24 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    content: { padding: 16, gap: 12 },

    topBar: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingVertical: 4
    },
    menuBtn: {
        width: 40, height: 40, borderRadius: 12, backgroundColor:
            Colors.bgCard, justifyContent: 'center', alignItems: 'center', borderWidth: 1,
        borderColor: Colors.border
    },
    greetSub: {
        fontSize: 9, fontFamily: Fonts.bold, color:
            Colors.textMuted, letterSpacing: 1.5
    },
    greetName: {
        fontSize: 20, fontFamily: Fonts.condensedBold, color: Colors.text,
        letterSpacing: 0.3, marginTop: 2
    },
    ratingBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 3,
        backgroundColor: Colors.green + '18', borderRadius: 20, paddingHorizontal: 12,
        paddingVertical: 6, borderWidth: 1, borderColor: Colors.green + '30'
    },
    ratingVal: {
        fontSize: 15, fontFamily: Fonts.condensedBold, color: Colors.green
    },
    ratingStar: { fontSize: 12 },

    statsRow: { flexDirection: 'row', gap: 8 },
    statCard: {
        flex: 1, alignItems: 'center', gap: 4, backgroundColor:
            Colors.bgCard, borderRadius: 14, paddingVertical: 14, borderWidth: 1
    },
    statEmoji: { fontSize: 18 },
    statVal: {
        fontSize: 22, fontFamily: Fonts.condensedBold, color: Colors.text
    },
    statLabel: {
        fontSize: 8, fontFamily: Fonts.bold, color: Colors.textMuted,
        letterSpacing: 1.2
    },

    card: {
        backgroundColor: Colors.bgCard, borderRadius: 16, padding: 16,
        borderWidth: 1, borderColor: Colors.border, gap: 12
    },
    cardTitle: {
        fontSize: 11, fontFamily: Fonts.bold, color: Colors.accent,
        letterSpacing: 1.5
    },

    barChart: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 88 },
    barCol: { flex: 1, alignItems: 'center', gap: 4 },
    barVal: { fontSize: 10, fontFamily: Fonts.bold, color: Colors.textMuted },
    barTrack: {
        width: '100%', height: 60, backgroundColor: Colors.border,
        borderRadius: 6, overflow: 'hidden', justifyContent: 'flex-end'
    },
    barFill: { width: '100%', borderRadius: 6 },
    barDay: { fontSize: 10, fontFamily: Fonts.bold, color: Colors.textMuted },

    sectionHeader: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center'
    },
    sectionLabel: {
        fontSize: 11, fontFamily: Fonts.bold, color: Colors.accent,
        letterSpacing: 1.5
    },
    upcomingPill: {
        backgroundColor: Colors.accentMuted, borderRadius: 20,
        paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor:
            Colors.accent + '30'
    },
    upcomingPillText: {
        fontSize: 9, fontFamily: Fonts.bold, color: Colors.accent,
        letterSpacing: 1
    },

    sessionCard: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: Colors.bgCard, borderRadius: 14, borderWidth: 1, borderColor:
            Colors.border, overflow: 'hidden', marginBottom: 8
    },
    sessionCardDone: { opacity: 0.6 },
    sessionBar: { width: 3, alignSelf: 'stretch' },
    sessionTimeCol: {
        width: 54, alignItems: 'center', paddingVertical: 14, gap:
            1
    },
    sessionTimePrimary: {
        fontSize: 14, fontFamily: Fonts.condensedBold, color:
            Colors.text
    },
    sessionTimeSuffix: {
        fontSize: 9, fontFamily: Fonts.bold, color:
            Colors.textMuted, letterSpacing: 0.5
    },
    sessionDivider: { width: 1, height: 34, backgroundColor: Colors.border },
    sessionInfo: { flex: 1, paddingHorizontal: 12, paddingVertical: 14 },
    sessionMember: { fontSize: 14, fontFamily: Fonts.bold, color: Colors.text },
    sessionType: {
        fontSize: 11, fontFamily: Fonts.regular, color:
            Colors.textMuted, marginTop: 2
    },
    statusDot: { width: 7, height: 7, borderRadius: 4, marginRight: 14 },

    alertCard: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: Colors.bgCard, borderRadius: 12, padding: 14, borderWidth: 1,
        borderColor: Colors.border, borderLeftWidth: 3, marginBottom: 8
    },
    alertDot: { width: 6, height: 6, borderRadius: 3 },
    alertMsg: {
        flex: 1, fontSize: 13, fontFamily: Fonts.regular, color:
            Colors.textMuted, lineHeight: 19
    },

    actionsGrid: {
        flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10
    },
    actionCard: {
        width: '47%', alignItems: 'center', gap: 10, backgroundColor:
            Colors.bgCard, borderRadius: 14, paddingVertical: 18, borderWidth: 1
    },
    actionIconWrap: {
        width: 48, height: 48, borderRadius: 14, justifyContent:
            'center', alignItems: 'center'
    },
    actionEmoji: { fontSize: 24 },
    actionLabel: {
        fontSize: 12, fontFamily: Fonts.bold, color: Colors.text,
        textAlign: 'center', letterSpacing: 0.3
    },
});