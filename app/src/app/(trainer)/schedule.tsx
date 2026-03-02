 import { useState } from 'react';
  import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
  import { Colors } from '@/constants/colors';
  import { Fonts } from '@/constants/fonts';
  import FadeInView from '@/components/FadeInView';
  import AnimatedPressable from '@/components/AnimatedPressable';

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  interface Session {
    id: number;
    time: string;
    member: string;
    type: string;
    duration: string;
    emoji: string;
    color: string;
    location: string;
    status: 'upcoming' | 'done' | 'cancelled';
  }

  const schedule: Record<string, Session[]> = {
    Mon: [
      { id: 1,  time: '6:00 AM', member: 'Amit Singh',  type: 'Push Day',
  duration: '60 min', emoji: '💪', color: Colors.accent, location: 'Weight Room',    
  status: 'done' },
      { id: 2,  time: '7:30 AM', member: 'Priya Nair',  type: 'HIIT Cardio',
  duration: '45 min', emoji: '🔥', color: Colors.red,    location: 'Cardio Zone',    
  status: 'done' },
      { id: 3,  time: '5:00 PM', member: 'Rahul Mehta', type: 'Strength Training',   
  duration: '60 min', emoji: '🏋️', color: Colors.green,  location: 'Weight Room',    
  status: 'upcoming' },
      { id: 4,  time: '6:30 PM', member: 'Group Class', type: 'HIIT Blast',
  duration: '45 min', emoji: '⚡', color: Colors.orange, location: 'Studio A',       
  status: 'upcoming' },
    ],
    Tue: [
      { id: 5,  time: '7:00 AM', member: 'Sneha Patel', type: 'Yoga & Flexibility',  
  duration: '50 min', emoji: '🧘', color: '#8B5CF6',     location: 'Yoga Studio',    
  status: 'done' },
      { id: 6,  time: '5:30 PM', member: 'Vikram Rao',  type: 'Pull Day',
  duration: '65 min', emoji: '🏋️', color: Colors.accent, location: 'Weight Room',    
  status: 'upcoming' },
      { id: 7,  time: '7:00 PM', member: 'Arjun Sharma',type: 'Leg Day',
  duration: '70 min', emoji: '🦵', color: Colors.green,  location: 'Weight Room',    
  status: 'upcoming' },
    ],
    Wed: [
      { id: 8,  time: '6:00 AM', member: 'Meena Joshi', type: 'Cardio Circuit',      
  duration: '45 min', emoji: '🚴', color: Colors.orange, location: 'Cardio Zone',    
  status: 'upcoming' },
      { id: 9,  time: '8:00 AM', member: 'Kavita Desai',type: 'Full Body',
  duration: '60 min', emoji: '💥', color: Colors.red,    location: 'Weight Room',    
  status: 'upcoming' },
      { id: 10, time: '6:00 PM', member: 'Group Class', type: 'Strength Circuit',    
  duration: '60 min', emoji: '⚡', color: Colors.accent, location: 'Studio B',       
  status: 'upcoming' },
    ],
    Thu: [
      { id: 11, time: '7:00 AM', member: 'Amit Singh',  type: 'Pull Day',
  duration: '60 min', emoji: '💪', color: Colors.accent, location: 'Weight Room',    
  status: 'upcoming' },
      { id: 12, time: '5:00 PM', member: 'Priya Nair',  type: 'Strength Circuit',    
  duration: '50 min', emoji: '🔥', color: Colors.red,    location: 'Studio A',       
  status: 'upcoming' },
    ],
    Fri: [
      { id: 13, time: '6:30 AM', member: 'Vikram Rao',  type: 'Chest & Shoulders',   
  duration: '65 min', emoji: '💪', color: Colors.accent, location: 'Weight Room',    
  status: 'upcoming' },
      { id: 14, time: '5:30 PM', member: 'Rahul Mehta', type: 'Cardio + Core',       
  duration: '50 min', emoji: '🧱', color: '#EC4899',     location: 'Cardio Zone',    
  status: 'upcoming' },
      { id: 15, time: '7:00 PM', member: 'Group Class', type: 'Full Body Burn',      
  duration: '60 min', emoji: '🔥', color: Colors.orange, location: 'Studio A',       
  status: 'upcoming' },
    ],
    Sat: [
      { id: 16, time: '7:00 AM', member: 'Arjun Sharma',type: 'Leg Day',
  duration: '70 min', emoji: '🦵', color: Colors.green,  location: 'Weight Room',    
  status: 'upcoming' },
      { id: 17, time: '9:00 AM', member: 'Group Class', type: 'Saturday HIIT',       
  duration: '45 min', emoji: '⚡', color: Colors.red,    location: 'Studio A',       
  status: 'upcoming' },
    ],
    Sun: [],
  };

  const statusStyle: Record<string, { bg: string; text: string; label: string }> = { 
    upcoming:  { bg: Colors.accent + '18', text: Colors.accent, label: 'UPCOMING' }, 
    done:      { bg: Colors.green  + '18', text: Colors.green,  label: 'DONE' },     
    cancelled: { bg: Colors.red    + '18', text: Colors.red,    label: 'CANCELLED' },
  };

  const today = new Date().getDay();
  const todayIndex = today === 0 ? 6 : today - 1;

  export default function TrainerScheduleScreen() {
    const [selectedDay, setSelectedDay] = useState(todayIndex);
    const daySessions = schedule[days[selectedDay]] ?? [];
    const doneSessions = daySessions.filter(s => s.status === 'done').length;        

    const totalSessions = Object.values(schedule).flat().length;
    const totalDone = Object.values(schedule).flat().filter(s => s.status ===        
  'done').length;
    const activeDays = Object.values(schedule).filter(d => d.length > 0).length;     

    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Day Selector */}
        <FadeInView delay={0}>
          <View style={styles.overviewRow}>
            {days.map((d, i) => {
              const count = (schedule[d] ?? []).length;
              const isToday = i === todayIndex;
              const isSelected = i === selectedDay;
              return (
                <AnimatedPressable
                  key={d}
                  style={[styles.dayBox, isSelected && styles.dayBoxActive]}
                  scaleDown={0.88}
                  onPress={() => setSelectedDay(i)}
                >
                  <Text style={[styles.dayLabel, isSelected &&
  styles.dayLabelActive]}>{d}</Text>
                  <View style={[styles.dayCount, isSelected &&
  styles.dayCountActive]}>
                    <Text style={[styles.dayCountText, isSelected && { color: '#FFF' 
  }]}>{count}</Text>
                  </View>
                  {isToday && <View style={styles.todayDot} />}
                </AnimatedPressable>
              );
            })}
          </View>
        </FadeInView>

        {/* Day Summary */}
        <FadeInView delay={60}>
          <View style={styles.daySummary}>
            <View>
              <Text style={styles.daySummaryTitle}>
                {days[selectedDay]}{selectedDay === todayIndex ? ' — TODAY' : ''}    
              </Text>
              <Text style={styles.daySummaryCount}>
                {daySessions.length} session{daySessions.length !== 1 ? 's' : ''}    
                {selectedDay === todayIndex && daySessions.length > 0 ? ` ·
  ${doneSessions} done` : ''}
              </Text>
            </View>
            <AnimatedPressable
              style={styles.addBtn}
              scaleDown={0.95}
              onPress={() => Alert.alert('Add Session', 'Session scheduling coming    soon!')}
            >
              <Text style={styles.addBtnText}>+ ADD</Text>
            </AnimatedPressable>
          </View>
        </FadeInView>

        {/* Sessions */}
        {daySessions.length === 0 ? (
          <FadeInView delay={100}>
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>😴</Text>
              <Text style={styles.emptyTitle}>REST DAY</Text>
              <Text style={styles.emptySub}>No sessions scheduled. Enjoy the
  break!</Text>
            </View>
          </FadeInView>
        ) : (
          daySessions.map((s, i) => {
            const ss = statusStyle[s.status];
            return (
              <FadeInView key={s.id} delay={100 + i * 60}>
                <AnimatedPressable
                  style={[styles.sessionCard, s.status === 'done' &&
  styles.sessionCardDone]}
                  scaleDown={0.97}
                  onPress={() => Alert.alert(s.member, `${s.type}\n${s.time} ·       
  ${s.duration}\n📍 ${s.location}`)}
                >
                  {/* Color Bar */}
                  <View style={[styles.sessionColorBar, { backgroundColor: s.color   
  }]} />

                  {/* Time */}
                  <View style={styles.timeCol}>
                    <Text style={styles.timeMain}>{s.time.split(' ')[0]}</Text>      
                    <Text style={styles.timeSuffix}>{s.time.split(' ')[1]}</Text>    
                  </View>

                  <View style={styles.sessionDivider} />

                  {/* Info */}
                  <View style={styles.sessionInfo}>
                    <View style={styles.sessionTop}>
                      <Text style={styles.sessionEmoji}>{s.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.sessionMember, s.status === 'done' && { 
  color: Colors.textMuted }]}>
                          {s.member}
                        </Text>
                        <Text style={styles.sessionType}>{s.type}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: ss.bg }]}>
                        <Text style={[styles.statusText, { color: ss.text
  }]}>{ss.label}</Text>
                      </View>
                    </View>
                    <View style={styles.sessionMeta}>
                      <Text style={styles.metaText}>⏱ {s.duration}</Text>
                      <Text style={styles.metaText}>📍 {s.location}</Text>
                    </View>
                  </View>
                </AnimatedPressable>
              </FadeInView>
            );
          })
        )}

        {/* Week Stats */}
        <FadeInView delay={480}>
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>THIS WEEK</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statVal}>{totalSessions}</Text>
                <Text style={styles.statLabel}>TOTAL</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statVal, { color: Colors.green
  }]}>{totalDone}</Text>
                <Text style={styles.statLabel}>COMPLETED</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statVal}>{activeDays}</Text>
                <Text style={styles.statLabel}>ACTIVE DAYS</Text>
              </View>
            </View>
          </View>
        </FadeInView>

        <View style={{ height: 24 }} />
      </ScrollView>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    content: { padding: 16, gap: 12 },

    /* Day selector */
    overviewRow: { flexDirection: 'row', gap: 5 },
    dayBox: {
      flex: 1, alignItems: 'center', gap: 4,
      backgroundColor: Colors.bgCard, borderRadius: 12,
      paddingVertical: 10, borderWidth: 1, borderColor: Colors.border,
    },
    dayBoxActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },    
    dayLabel: { fontSize: 10, fontFamily: Fonts.bold, color: Colors.textMuted },     
    dayLabelActive: { color: '#FFF' },
    dayCount: {
      width: 20, height: 20, borderRadius: 10,
      backgroundColor: Colors.bgElevated, justifyContent: 'center', alignItems:      
  'center',
    },
    dayCountActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
    dayCountText: { fontSize: 10, fontFamily: Fonts.bold, color: Colors.text },      
    todayDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.orange 
  },

    /* Day summary */
    daySummary: { flexDirection: 'row', alignItems: 'center', justifyContent:        
  'space-between' },
    daySummaryTitle: { fontSize: 18, fontFamily: Fonts.condensedBold, color:
  Colors.text, letterSpacing: 0.5 },
    daySummaryCount: { fontSize: 12, fontFamily: Fonts.regular, color:
  Colors.textMuted, marginTop: 2 },
    addBtn: {
      backgroundColor: Colors.accentMuted, borderRadius: 10,
      paddingHorizontal: 16, paddingVertical: 8,
      borderWidth: 1, borderColor: Colors.accent + '40',
    },
    addBtnText: { fontSize: 12, fontFamily: Fonts.bold, color: Colors.accent,        
  letterSpacing: 1 },

    /* Empty */
    emptyCard: {
      alignItems: 'center', paddingVertical: 48, gap: 8,
      backgroundColor: Colors.bgCard, borderRadius: 16,
      borderWidth: 1, borderColor: Colors.border,
    },
    emptyEmoji: { fontSize: 44 },
    emptyTitle: { fontSize: 18, fontFamily: Fonts.condensedBold, color: Colors.text, 
  letterSpacing: 1.5 },
    emptySub: { fontSize: 13, fontFamily: Fonts.regular, color: Colors.textMuted },  

    /* Session card */
    sessionCard: {
      flexDirection: 'row', alignItems: 'stretch',
      backgroundColor: Colors.bgCard, borderRadius: 14,
      borderWidth: 1, borderColor: Colors.border,
      overflow: 'hidden', marginBottom: 2,
    },
    sessionCardDone: { opacity: 0.6 },
    sessionColorBar: { width: 3 },
    timeCol: { width: 54, alignItems: 'center', justifyContent: 'center', gap: 1,    
  paddingVertical: 14 },
    timeMain: { fontSize: 14, fontFamily: Fonts.condensedBold, color: Colors.text }, 
    timeSuffix: { fontSize: 9, fontFamily: Fonts.bold, color: Colors.textMuted,      
  letterSpacing: 0.5 },
    sessionDivider: { width: 1, backgroundColor: Colors.border, marginVertical: 10 },
    sessionInfo: { flex: 1, padding: 12, gap: 7 },
    sessionTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    sessionEmoji: { fontSize: 18 },
    sessionMember: { fontSize: 14, fontFamily: Fonts.bold, color: Colors.text },     
    sessionType: { fontSize: 11, fontFamily: Fonts.regular, color: Colors.textMuted, 
  marginTop: 1 },
    statusBadge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },      
    statusText: { fontSize: 9, fontFamily: Fonts.bold, letterSpacing: 1 },
    sessionMeta: { flexDirection: 'row', gap: 14 },
    metaText: { fontSize: 11, fontFamily: Fonts.regular, color: Colors.textMuted },  

    /* Stats */
    statsCard: {
      backgroundColor: Colors.bgCard, borderRadius: 14, padding: 16,
      borderWidth: 1, borderColor: Colors.border, gap: 12,
    },
    statsTitle: { fontSize: 11, fontFamily: Fonts.bold, color: Colors.accent,        
  letterSpacing: 1.5 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems:    
  'center' },
    statItem: { alignItems: 'center', gap: 4 },
    statVal: { fontSize: 26, fontFamily: Fonts.condensedBold, color: Colors.text },  
    statLabel: { fontSize: 9, fontFamily: Fonts.bold, color: Colors.textMuted,       
  letterSpacing: 1.2 },
    statDivider: { width: 1, height: 36, backgroundColor: Colors.border },
  });