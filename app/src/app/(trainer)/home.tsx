 import { View, Text, StyleSheet, ScrollView, TouchableOpacity }    from 'react-native';                                               import { useNavigation } from 'expo-router';                       import { DrawerActions } from '@react-navigation/native';        
  import { MaterialCommunityIcons } from '@expo/vector-icons';       import { useSafeAreaInsets } from                                
  'react-native-safe-area-context';                                  import { Colors } from '@/constants/colors';                     
  import FadeInView from '@/components/FadeInView';                
  import AnimatedPressable from '@/components/AnimatedPressable';  

  const trainer = {
    name: 'Rajesh Kumar',
    specialty: 'Strength & Conditioning',
    rating: 4.9,
    totalMembers: 12,
    sessionsThisMonth: 38,
  };

  const todaySessions = [
    { id: 1, time: '6:00 AM', member: 'Amit Singh', type: 'StrengthTraining', duration: '60 min', status: 'done', emoji: '✅' },   
    { id: 2, time: '7:30 AM', member: 'Priya Nair', type: 'Weight Loss', duration: '45 min', status: 'done', emoji: '✅' },        
    { id: 3, time: '5:00 PM', member: 'Rahul Mehta', type: 'Muscle Gain', duration: '60 min', status: 'upcoming', emoji: '⏳' },    
    { id: 4, time: '6:30 PM', member: 'Sneha Patel', type: 'Yoga &  Flexibility', duration: '50 min', status: 'upcoming', emoji: '⏳'
   },
  ];

  const alerts = [
    { id: 1, msg: 'Amit Singh missed 3 sessions this week', emoji: 
  '⚠️', color: Colors.orange },
    { id: 2, msg: 'Priya Nair reached her weight goal! 🎉', emoji: 
  '🏆', color: Colors.green },
    { id: 3, msg: "Rahul Mehta's plan expires in 5 days", emoji:   
  '📅', color: Colors.red },
  ];

  const weekStats = [
    { day: 'M', sessions: 4, max: 5 },
    { day: 'T', sessions: 3, max: 5 },
    { day: 'W', sessions: 5, max: 5 },
    { day: 'T', sessions: 2, max: 5 },
    { day: 'F', sessions: 4, max: 5 },
    { day: 'S', sessions: 3, max: 5 },
    { day: 'S', sessions: 1, max: 5 },
  ];

  export default function TrainerHome() {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const doneSessions = todaySessions.filter(s => s.status ===    
  'done').length;
    const upcomingSessions = todaySessions.filter(s => s.status ===
   'upcoming').length;

    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop:      
  insets.top + 12 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Bar */}
        <FadeInView delay={0}>
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.menuBtn}
              onPress={() =>
  navigation.dispatch(DrawerActions.openDrawer())}
            >
              <MaterialCommunityIcons name="menu" size={26}        
  color={Colors.text} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.greetSub}>Good morning 👋</Text> 
              <Text style={styles.greetName}>{trainer.name}</Text> 
            </View>
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>⭐
  {trainer.rating}</Text>
            </View>
          </View>
        </FadeInView>

        {/* Stats Row */}
        <FadeInView delay={80}>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { borderColor:
  Colors.green + '40' }]}>
              <Text style={styles.statEmoji}>👥</Text>
              <Text
  style={styles.statVal}>{trainer.totalMembers}</Text>
              <Text style={styles.statLabel}>My Members</Text>     
            </View>
            <View style={[styles.statCard, { borderColor:
  Colors.accent + '40' }]}>
              <Text style={styles.statEmoji}>✅</Text>
              <Text style={styles.statVal}>{doneSessions}/{todaySessions.length}</Text>
              <Text style={styles.statLabel}>Today Done</Text>     
            </View>
            <View style={[styles.statCard, { borderColor:
  Colors.orange + '40' }]}>
              <Text style={styles.statEmoji}>📅</Text>
              <Text
  style={styles.statVal}>{trainer.sessionsThisMonth}</Text>        
              <Text style={styles.statLabel}>This Month</Text>     
            </View>
          </View>
        </FadeInView>

        {/* Weekly Bar Chart */}
        <FadeInView delay={140}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📊 This Week's
  Sessions</Text>
            <View style={styles.barChart}>
              {weekStats.map((w, i) => (
                <View key={i} style={styles.barCol}>
                  <Text style={styles.barVal}>{w.sessions}</Text>  
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, {
                      height: `${(w.sessions / w.max) * 100}%` as  
  any,
                      backgroundColor: i === 6 ? Colors.border :   
  Colors.green,
                    }]} />
                  </View>
                  <Text style={styles.barDay}>{w.day}</Text>       
                </View>
              ))}
            </View>
          </View>
        </FadeInView>

        {/* Today's Sessions */}
        <FadeInView delay={200}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🗓️ Today's
  Sessions</Text>
            <Text style={styles.sectionSub}>{upcomingSessions}     
  upcoming</Text>
          </View>
          {todaySessions.map((s, i) => (
            <FadeInView key={s.id} delay={240 + i * 60}>
              <View style={[styles.sessionCard, s.status === 'done'
   && styles.sessionCardDone]}>
                <View style={styles.sessionTime}>
                  <Text
  style={styles.sessionTimeText}>{s.time}</Text>
                  <Text
  style={styles.sessionEmoji}>{s.emoji}</Text>
                </View>
                <View style={styles.sessionDivider} />
                <View style={styles.sessionInfo}>
                  <Text style={[styles.sessionMember, s.status === 
  'done' && { color: Colors.textMuted }]}>
                    {s.member}
                  </Text>
                  <Text style={styles.sessionType}>{s.type} ·      
  {s.duration}</Text>
                </View>
                {s.status === 'upcoming' && (
                  <View style={styles.upcomingBadge}>
                    <Text
  style={styles.upcomingText}>Upcoming</Text>
                  </View>
                )}
              </View>
            </FadeInView>
          ))}
        </FadeInView>

        {/* Alerts */}
        <FadeInView delay={480}>
          <Text style={styles.sectionTitle}>🔔 Member Alerts</Text>
          {alerts.map(a => (
            <View key={a.id} style={[styles.alertCard, {
  borderLeftColor: a.color }]}>
              <Text style={styles.alertEmoji}>{a.emoji}</Text>     
              <Text style={styles.alertMsg}>{a.msg}</Text>
            </View>
          ))}
        </FadeInView>

        {/* Quick Actions */}
        <FadeInView delay={560}>
          <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {[
              { label: 'Mark Attendance', emoji: '✅', color:      
  Colors.green, screen: 'attendance' },
              { label: 'Log Progress', emoji: '📈', color:
  Colors.accent, screen: 'progress-log' },
              { label: 'View Members', emoji: '👥', color:
  Colors.orange, screen: 'my-members' },
              { label: 'Workout Plans', emoji: '📋', color:        
  '#8B5CF6', screen: 'workout-plans' },
            ].map(a => (
              <AnimatedPressable
                key={a.label}
                style={[styles.actionCard, { borderColor: a.color +
   '30' }]}
                scaleDown={0.95}
                onPress={() => navigation.navigate(a.screen as     
  never)}
              >
                <Text style={styles.actionEmoji}>{a.emoji}</Text>  
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

    topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, 
  paddingVertical: 4 },
    menuBtn: {
      width: 40, height: 40, borderRadius: 12,
      backgroundColor: Colors.bgCard, justifyContent: 'center',    
  alignItems: 'center',
      borderWidth: 1, borderColor: Colors.border,
    },
    greetSub: { fontSize: 13, color: Colors.textMuted },
    greetName: { fontSize: 20, fontWeight: '700', color:
  Colors.text },
    ratingBadge: {
      backgroundColor: Colors.green + '20', borderRadius: 20,      
      paddingHorizontal: 12, paddingVertical: 6,
      borderWidth: 1, borderColor: Colors.green + '30',
    },
    ratingText: { fontSize: 13, fontWeight: '700', color:
  Colors.green },

    statsRow: { flexDirection: 'row', gap: 8 },
    statCard: {
      flex: 1, alignItems: 'center', gap: 4,
      backgroundColor: Colors.bgCard, borderRadius: 14,
      paddingVertical: 14, borderWidth: 1,
    },
    statEmoji: { fontSize: 20 },
    statVal: { fontSize: 18, fontWeight: '700', color: Colors.text 
  },
    statLabel: { fontSize: 10, color: Colors.textMuted, textAlign: 
  'center' },

    card: { backgroundColor: Colors.bgCard, borderRadius: 16,      
  padding: 16, borderWidth: 1, borderColor: Colors.border, gap: 12 
  },
    cardTitle: { fontSize: 15, fontWeight: '700', color:
  Colors.text },

    barChart: { flexDirection: 'row', alignItems: 'flex-end', gap: 
  8, height: 80 },
    barCol: { flex: 1, alignItems: 'center', gap: 4 },
    barVal: { fontSize: 10, color: Colors.textMuted, fontWeight:   
  '600' },
    barTrack: { width: '100%', height: 60, backgroundColor:        
  Colors.border, borderRadius: 6, overflow: 'hidden',
  justifyContent: 'flex-end' },
    barFill: { width: '100%', borderRadius: 6 },
    barDay: { fontSize: 10, color: Colors.textMuted, fontWeight:   
  '600' },

    sectionHeader: { flexDirection: 'row', justifyContent:
  'space-between', alignItems: 'center' },
    sectionTitle: { fontSize: 15, fontWeight: '700', color:        
  Colors.text },
    sectionSub: { fontSize: 12, color: Colors.accent, fontWeight:  
  '600' },

    sessionCard: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: Colors.bgCard, borderRadius: 14, padding:   
  14,
      borderWidth: 1, borderColor: Colors.border, marginBottom: 8, 
    },
    sessionCardDone: { opacity: 0.6 },
    sessionTime: { alignItems: 'center', gap: 4, width: 56 },      
    sessionTimeText: { fontSize: 12, fontWeight: '700', color:     
  Colors.text },
    sessionEmoji: { fontSize: 16 },
    sessionDivider: { width: 1, height: 36, backgroundColor:       
  Colors.border },
    sessionInfo: { flex: 1 },
    sessionMember: { fontSize: 14, fontWeight: '700', color:       
  Colors.text },
    sessionType: { fontSize: 12, color: Colors.textMuted,
  marginTop: 2 },
    upcomingBadge: { backgroundColor: Colors.accent + '20',        
  borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },     
    upcomingText: { fontSize: 11, fontWeight: '700', color:        
  Colors.accent },

    alertCard: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      backgroundColor: Colors.bgCard, borderRadius: 12, padding:   
  14,
      borderWidth: 1, borderColor: Colors.border,
      borderLeftWidth: 4, marginBottom: 8,
    },
    alertEmoji: { fontSize: 18 },
    alertMsg: { flex: 1, fontSize: 13, color: Colors.textSub,      
  lineHeight: 19 },

    actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 
  },
    actionCard: {
      width: '47%', alignItems: 'center', gap: 8,
      backgroundColor: Colors.bgCard, borderRadius: 14,
      paddingVertical: 18, borderWidth: 1,
    },
    actionEmoji: { fontSize: 28 },
    actionLabel: { fontSize: 13, fontWeight: '600', color:
  Colors.text, textAlign: 'center' },
  });