 import { useState } from 'react';                                  import { View, Text, StyleSheet, ScrollView, Alert } from        
  'react-native';                                                    import { useLocalSearchParams, useRouter } from 'expo-router';   
  import { Colors } from '@/constants/colors';                     
  import { Fonts } from '@/constants/fonts';                         import FadeInView from '@/components/FadeInView';                
  import AnimatedPressable from '@/components/AnimatedPressable';  

  const members = [                                                
    { id: 1, name: 'Amit Singh',   goal: 'Muscle Gain',    plan:
  'Premium 3M',    daysLeft: 22, attendance: 26, lastSeen: 'Today',
        emoji: '💪', status: 'active',   progress: 75,  phone: '+9198765 00001', joinDate: 'Jan 1, 2025',  weight: '82 kg', height:'178 cm', age: 28, streak: 6 },
    { id: 2, name: 'Priya Nair',   goal: 'Weight Loss',    plan:   
  'Standard 3M',   daysLeft: 14, attendance: 24, lastSeen: 'Today',
        emoji: '🏃', status: 'expiring', progress: 90,  phone: '+9198765 00002', joinDate: 'Dec 1, 2024', weight: '61 kg', height: '162 cm', age: 25, streak: 10 },
    { id: 3, name: 'Rahul Mehta',  goal: 'Weight Loss',    plan:   
  'Premium 3M',    daysLeft: 18, attendance: 14, lastSeen:
  'Yesterday', emoji: '🎯', status: 'active',   progress: 45,      
  phone: '+91 98765 00003', joinDate: 'Jan 15, 2025', weight: '79  kg', height: '175 cm', age: 30, streak: 2 },
    { id: 4, name: 'Sneha Patel',  goal: 'Flexibility',    plan:   
  'Basic Monthly', daysLeft: 5,  attendance: 12, lastSeen: '2 days  ago', emoji: '🧘', status: 'expiring', progress: 60,  phone: '+9198765 00004', joinDate: 'Feb 1, 2025',  weight: '55 kg', height:'158 cm', age: 27, streak: 0 },
    { id: 5, name: 'Vikram Rao',   goal: 'Muscle Gain',    plan:   
  'Annual Gold',   daysLeft: 180,attendance: 20, lastSeen: 'Today',
        emoji: '🏋️', status: 'active',   progress: 55,  phone: '+9198765 00005', joinDate: 'Mar 1, 2024',  weight: '88 kg', height:'182 cm', age: 32, streak: 4 },
    { id: 6, name: 'Meena Joshi',  goal: 'Cardio Fitness', plan:   
  'Standard 3M',   daysLeft: 45, attendance: 8,  lastSeen: '5 days ago', emoji: '🚴', status: 'inactive', progress: 30,  phone: '+9198765 00006', joinDate: 'Nov 15, 2024', weight: '68 kg', height:
   '160 cm', age: 35, streak: 0 },
    { id: 7, name: 'Arjun Sharma', goal: 'Muscle Gain',    plan:   
  'Premium 3M',    daysLeft: 60, attendance: 22, lastSeen: 'Today',
        emoji: '💥', status: 'active',   progress: 80,  phone: '+9198765 00007', joinDate: 'Dec 15, 2024', weight: '76 kg', height:
   '176 cm', age: 24, streak: 8 },
    { id: 8, name: 'Kavita Desai', goal: 'Weight Loss',    plan:   
  'Basic Monthly', daysLeft: 8,  attendance: 10, lastSeen: '3 days  ago', emoji: '🌟', status: 'expiring', progress: 40,  phone: '+9198765 00008', joinDate: 'Feb 5, 2025',  weight: '72 kg', height:'165 cm', age: 29, streak: 1 },
  ];

  const statusColor: Record<string, string> = {
    active: Colors.green,
    expiring: Colors.orange,
    inactive: Colors.red,
  };

  const tabs = ['Overview', 'Progress', 'Attendance', 'Notes'];    

  const weekAttendance = [
    { day: 'M', present: true },
    { day: 'T', present: true },
    { day: 'W', present: false },
    { day: 'T', present: true },
    { day: 'F', present: true },
    { day: 'S', present: false },
    { day: 'S', present: false },
  ];

  const progressHistory = [
    { month: 'Oct', value: 20 },
    { month: 'Nov', value: 35 },
    { month: 'Dec', value: 52 },
    { month: 'Jan', value: 68 },
    { month: 'Feb', value: 75 },
  ];

  export default function MemberDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('Overview');        

    const member = members.find(m => m.id === Number(id)) ??       
  members[0];
    const statusCol = statusColor[member.status];
    const progressColor = member.progress >= 70 ? Colors.green : member.progress >= 40 ? Colors.orange : Colors.red;

    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card */}
        <FadeInView delay={0}>
          <View style={styles.heroCard}>
            <View style={styles.heroAccentBar} />
            <View style={styles.heroInner}>
              <View style={styles.avatarRing}>
                <Text
  style={styles.avatarEmoji}>{member.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text
  style={styles.memberName}>{member.name}</Text>
                <Text
  style={styles.memberPlan}>{member.plan}</Text>
                <View style={styles.heroMeta}>
                  <View style={[styles.statusChip, {
  backgroundColor: statusCol + '18', borderColor: statusCol + '40' 
  }]}>
                    <Text style={[styles.statusText, { color:      
  statusCol }]}>{member.status.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.lastSeen}>Last:
  {member.lastSeen}</Text>
                </View>
              </View>
              <View style={styles.daysBox}>
                <Text
  style={styles.daysVal}>{member.daysLeft}</Text>
                <Text
  style={styles.daysLabel}>DAYS{'\n'}LEFT</Text>
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
              onPress={() => Alert.alert('Call', `Calling
  ${member.phone}`)}
            >
              <Text style={styles.actionBtnEmoji}>📞</Text>        
              <Text style={styles.actionBtnText}>CALL</Text>       
            </AnimatedPressable>
            <AnimatedPressable
              style={styles.actionBtn}
              scaleDown={0.95}
              onPress={() => Alert.alert('Message', 'Messaging   coming soon!')}
            >
              <Text style={styles.actionBtnEmoji}>💬</Text>        
              <Text style={styles.actionBtnText}>MESSAGE</Text>    
            </AnimatedPressable>
            <AnimatedPressable
              style={[styles.actionBtn, styles.actionBtnPrimary]}  
              scaleDown={0.95}
              onPress={() => Alert.alert('Log Progress', 'Progress  logging coming soon!')}
            >
              <Text style={styles.actionBtnEmoji}>📈</Text>        
              <Text style={[styles.actionBtnText, { color:Colors.accent }]}>LOG</Text>
            </AnimatedPressable>
            <AnimatedPressable
              style={styles.actionBtn}
              scaleDown={0.95}
              onPress={() => Alert.alert('Attendance', 'Mark  attendance coming soon!')}
            >
              <Text style={styles.actionBtnEmoji}>✅</Text>        
              <Text style={styles.actionBtnText}>MARK</Text>       
            </AnimatedPressable>
          </View>
        </FadeInView>

        {/* Tabs */}
        <FadeInView delay={100}>
          <ScrollView horizontal
  showsHorizontalScrollIndicator={false}
  contentContainerStyle={styles.tabRow}>
            {tabs.map(t => (
              <AnimatedPressable
                key={t}
                style={[styles.tab, activeTab === t &&
  styles.tabActive]}
                scaleDown={0.93}
                onPress={() => setActiveTab(t)}
              >
                <Text style={[styles.tabText, activeTab === t &&   
  styles.tabTextActive]}>{t.toUpperCase()}</Text>
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
                  { label: 'ATTENDANCE', val:
  `${member.attendance}`, unit: 'days/mo' },
                  { label: 'STREAK',     val: `${member.streak}`,  
     unit: 'days' },
                  { label: 'PROGRESS',   val: `${member.progress}`,
     unit: '%' },
                ].map(s => (
                  <View key={s.label} style={styles.statBox}>      
                    <Text style={styles.statVal}>{s.val}<Text      
  style={styles.statUnit}>{s.unit}</Text></Text>
                    <Text style={styles.statLabel}>{s.label}</Text>
                  </View>
                ))}
              </View>
            </FadeInView>

            <FadeInView delay={180}>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>PERSONAL INFO</Text>
                {[
                  { label: 'GOAL',      val: member.goal },        
                  { label: 'HEIGHT',    val: member.height },      
                  { label: 'WEIGHT',    val: member.weight },      
                  { label: 'AGE',       val: `${member.age} yrs` },
                  { label: 'PHONE',     val: member.phone },       
                  { label: 'JOINED',    val: member.joinDate },    
                ].map((row, i, arr) => (
                  <View key={row.label} style={[styles.infoRow, i <
   arr.length - 1 && styles.infoRowBorder]}>
                    <Text
  style={styles.infoLabel}>{row.label}</Text>
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
              <Text style={styles.cardTitle}>GOAL PROGRESS</Text>  
              <View style={styles.progressHeader}>
                <Text
  style={styles.progressGoal}>{member.goal}</Text>
                <Text style={[styles.progressPct, { color:
  progressColor }]}>{member.progress}%</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width:        
  `${member.progress}%` as any, backgroundColor: progressColor }]} 
  />
              </View>

              <Text style={[styles.cardTitle, { marginTop: 16      
  }]}>MONTHLY TREND</Text>
              <View style={styles.barChart}>
                {progressHistory.map((p, i) => {
                  const isLatest = i === progressHistory.length -  
  1;
                  return (
                    <View key={p.month} style={styles.barCol}>     
                      <Text style={[styles.barVal, isLatest && {   
  color: progressColor }]}>{p.value}%</Text>
                      <View style={styles.barTrack}>
                        <View style={[styles.barFill, {
                          height: `${p.value}%` as any,
                          backgroundColor: isLatest ? progressColor
   : progressColor + '40',
                        }]} />
                      </View>
                      <Text style={[styles.barDay, isLatest && {   
  color: progressColor }]}>{p.month}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </FadeInView>
        )}

        {/* Attendance Tab */}
        {activeTab === 'Attendance' && (
          <FadeInView delay={140}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>THIS WEEK</Text>      
              <View style={styles.weekRow}>
                {weekAttendance.map((w, i) => (
                  <View key={i} style={styles.dayCol}>
                    <View style={[styles.dayDot, { backgroundColor:
   w.present ? Colors.green : Colors.border }]}>
                      {w.present && <Text
  style={styles.dayCheck}>✓</Text>}
                    </View>
                    <Text style={[styles.dayLabel, w.present && {  
  color: Colors.green }]}>{w.day}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.attendSummary}>
                <View style={styles.attendStat}>
                  <Text
  style={styles.attendVal}>{member.attendance}</Text>
                  <Text style={styles.attendLabel}>DAYS THIS       
  MONTH</Text>
                </View>
                <View style={styles.attendDivider} />
                <View style={styles.attendStat}>
                  <Text style={[styles.attendVal, { color:
  Colors.green }]}>
                    {weekAttendance.filter(w =>
  w.present).length}/7
                  </Text>
                  <Text style={styles.attendLabel}>THIS WEEK</Text>
                </View>
                <View style={styles.attendDivider} />
                <View style={styles.attendStat}>
                  <Text style={[styles.attendVal, { color:
  Colors.orange }]}>{member.streak}</Text>
                  <Text style={styles.attendLabel}>DAY
  STREAK</Text>
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
              {[
                { date: 'Feb 28', note: 'Good form on deadlifts today. Increase weight next session.' },
                { date: 'Feb 25', note: 'Struggling with shoulder mobility. Added stretching routine.' },
                { date: 'Feb 20', note: 'Hit a new PR on bench press — 80 kg. Great progress!' },
              ].map((n, i) => (
                <View key={i} style={[styles.noteRow, i < 2 &&     
  styles.noteRowBorder]}>
                  <Text style={styles.noteDate}>{n.date}</Text>    
                  <Text style={styles.noteText}>{n.note}</Text>    
                </View>
              ))}
              <AnimatedPressable
                style={styles.addNoteBtn}
                scaleDown={0.97}
                onPress={() => Alert.alert('Add Note', 'Note adding  coming soon!')}
              >
                <Text style={styles.addNoteBtnText}>+ ADD
  NOTE</Text>
              </AnimatedPressable>
            </View>
          </FadeInView>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    content: { padding: 16, gap: 12 },

    /* Hero */
    heroCard: {
      flexDirection: 'row', backgroundColor: Colors.bgCard,        
      borderRadius: 16, overflow: 'hidden',
      borderWidth: 1, borderColor: Colors.accent + '30',
    },
    heroAccentBar: { width: 4, backgroundColor: Colors.accent },   
    heroInner: { flex: 1, flexDirection: 'row', alignItems:        
  'center', gap: 12, padding: 14 },
    avatarRing: {
      width: 56, height: 56, borderRadius: 28,
      backgroundColor: Colors.bgElevated,
      justifyContent: 'center', alignItems: 'center',
      borderWidth: 2, borderColor: Colors.accent + '40',
    },
    avatarEmoji: { fontSize: 26 },
    memberName: { fontSize: 17, fontFamily: Fonts.bold, color:     
  Colors.text },
    memberPlan: { fontSize: 11, fontFamily: Fonts.regular, color:  
  Colors.textMuted, marginTop: 1 },
    heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 8,
   marginTop: 5 },
    statusChip: { borderRadius: 6, paddingHorizontal: 7,
  paddingVertical: 3, borderWidth: 1 },
    statusText: { fontSize: 9, fontFamily: Fonts.bold,
  letterSpacing: 1 },
    lastSeen: { fontSize: 10, fontFamily: Fonts.regular, color:    
  Colors.textMuted },
    daysBox: { alignItems: 'center', backgroundColor:
  Colors.accentMuted, borderRadius: 10, paddingHorizontal: 10,     
  paddingVertical: 8 },
    daysVal: { fontSize: 24, fontFamily: Fonts.condensedBold,      
  color: Colors.accent },
    daysLabel: { fontSize: 8, fontFamily: Fonts.bold, color:       
  Colors.accent, letterSpacing: 1, textAlign: 'center' },

    /* Actions */
    actionsRow: { flexDirection: 'row', gap: 8 },
    actionBtn: {
      flex: 1, alignItems: 'center', gap: 5, paddingVertical: 12,  
      backgroundColor: Colors.bgCard, borderRadius: 12,
      borderWidth: 1, borderColor: Colors.border,
    },
    actionBtnPrimary: { borderColor: Colors.accent + '40',
  backgroundColor: Colors.accentMuted },
    actionBtnEmoji: { fontSize: 20 },
    actionBtnText: { fontSize: 9, fontFamily: Fonts.bold, color:   
  Colors.textMuted, letterSpacing: 1 },

    /* Tabs */
    tabRow: { gap: 8, paddingVertical: 2 },
    tab: {
      paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, 
      backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: 
  Colors.border,
    },
    tabActive: { backgroundColor: Colors.accentMuted, borderColor: 
  Colors.accent },
    tabText: { fontSize: 11, fontFamily: Fonts.bold, color:        
  Colors.textMuted, letterSpacing: 1 },
    tabTextActive: { color: Colors.accent },

    /* Stats Row */
    statsRow: { flexDirection: 'row', gap: 8 },
    statBox: {
      flex: 1, alignItems: 'center', gap: 4, paddingVertical: 14,  
      backgroundColor: Colors.bgCard, borderRadius: 12,
      borderWidth: 1, borderColor: Colors.border,
    },
    statVal: { fontSize: 20, fontFamily: Fonts.condensedBold,      
  color: Colors.text },
    statUnit: { fontSize: 10, fontFamily: Fonts.regular, color:    
  Colors.textMuted },
    statLabel: { fontSize: 8, fontFamily: Fonts.bold, color:       
  Colors.textMuted, letterSpacing: 1.2 },

    /* Card */
    card: { backgroundColor: Colors.bgCard, borderRadius: 16,      
  padding: 16, borderWidth: 1, borderColor: Colors.border, gap: 12 
  },
    cardTitle: { fontSize: 11, fontFamily: Fonts.bold, color:      
  Colors.accent, letterSpacing: 1.5 },

    /* Info rows */
    infoRow: { flexDirection: 'row', justifyContent:
  'space-between', alignItems: 'center', paddingVertical: 9 },     
    infoRowBorder: { borderBottomWidth: 1, borderBottomColor:      
  Colors.border },
    infoLabel: { fontSize: 10, fontFamily: Fonts.bold, color:      
  Colors.textMuted, letterSpacing: 1.2 },
    infoVal: { fontSize: 14, fontFamily: Fonts.medium, color:      
  Colors.text },

    /* Progress */
    progressHeader: { flexDirection: 'row', justifyContent:        
  'space-between', alignItems: 'center' },
    progressGoal: { fontSize: 14, fontFamily: Fonts.bold, color:   
  Colors.text },
    progressPct: { fontSize: 22, fontFamily: Fonts.condensedBold },
    progressTrack: { height: 6, backgroundColor: Colors.border,    
  borderRadius: 3, overflow: 'hidden' },
    progressFill: { height: 6, borderRadius: 3 },

    /* Bar chart */
    barChart: { flexDirection: 'row', alignItems: 'flex-end', gap: 
  8, height: 100 },
    barCol: { flex: 1, alignItems: 'center', gap: 4 },
    barVal: { fontSize: 9, fontFamily: Fonts.bold, color:
  Colors.textMuted },
    barTrack: { width: '100%', height: 70, backgroundColor:        
  Colors.border, borderRadius: 6, overflow: 'hidden',
  justifyContent: 'flex-end' },
    barFill: { width: '100%', borderRadius: 6 },
    barDay: { fontSize: 10, fontFamily: Fonts.bold, color:
  Colors.textMuted },

    /* Attendance */
    weekRow: { flexDirection: 'row', justifyContent:
  'space-between' },
    dayCol: { alignItems: 'center', gap: 5 },
    dayDot: {
      width: 34, height: 34, borderRadius: 17,
      justifyContent: 'center', alignItems: 'center',
    },
    dayCheck: { fontSize: 14, color: '#FFF', fontFamily: Fonts.bold
   },
    dayLabel: { fontSize: 10, fontFamily: Fonts.bold, color:       
  Colors.textMuted },
    attendSummary: { flexDirection: 'row', justifyContent:
  'space-around', alignItems: 'center', paddingTop: 12,
  borderTopWidth: 1, borderTopColor: Colors.border },
    attendStat: { alignItems: 'center', gap: 4 },
    attendVal: { fontSize: 22, fontFamily: Fonts.condensedBold,    
  color: Colors.text },
    attendLabel: { fontSize: 8, fontFamily: Fonts.bold, color:     
  Colors.textMuted, letterSpacing: 1 },
    attendDivider: { width: 1, height: 36, backgroundColor:        
  Colors.border },

    /* Notes */
    noteRow: { paddingVertical: 10, gap: 4 },
    noteRowBorder: { borderBottomWidth: 1, borderBottomColor:      
  Colors.border },
    noteDate: { fontSize: 10, fontFamily: Fonts.bold, color:       
  Colors.accent, letterSpacing: 1 },
    noteText: { fontSize: 13, fontFamily: Fonts.regular, color:    
  Colors.textSub, lineHeight: 19 },
    addNoteBtn: {
      alignItems: 'center', paddingVertical: 10, borderRadius: 10, 
      borderWidth: 1, borderColor: Colors.accent + '40',
      borderStyle: 'dashed',
    },
    addNoteBtnText: { fontSize: 11, fontFamily: Fonts.bold, color: 
  Colors.accent, letterSpacing: 1.2 },
  });
