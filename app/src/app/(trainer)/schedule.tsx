                                                                    import { useState } from 'react';                                  import { View, Text, StyleSheet, ScrollView, Alert } from          'react-native';                                                    import { Colors } from '@/constants/colors';                     
  import FadeInView from '@/components/FadeInView';                  import AnimatedPressable from '@/components/AnimatedPressable';  
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
      { id: 1, time: '6:00 AM', member: 'Amit Singh', type: 'Push  Day', duration: '60 min', emoji: '💪', color: Colors.accent, location: 'Weight Room', status: 'done' },
      { id: 2, time: '7:30 AM', member: 'Priya Nair', type: 'HIIT Cardio', duration: '45 min', emoji: '🔥', color: Colors.red,  location: 'Cardio Zone', status: 'done' },
      { id: 3, time: '5:00 PM', member: 'Rahul Mehta', type:       
  'Strength Training', duration: '60 min', emoji: '🏋️', color:     
  Colors.green, location: 'Weight Room', status: 'upcoming' },     
      { id: 4, time: '6:30 PM', member: 'Group Class', type: 'HIIT Blast', duration: '45 min', emoji: '⚡', color: Colors.orange,    location: 'Studio A', status: 'upcoming' },
    ],
    Tue: [
      { id: 5, time: '7:00 AM', member: 'Sneha Patel', type: 'Yoga & Flexibility', duration: '50 min', emoji: '🧘', color:'#8B5CF6', location: 'Yoga Studio', status: 'done' },
      { id: 6, time: '5:30 PM', member: 'Vikram Rao', type: 'Pull  Day', duration: '65 min', emoji: '🏋️', color: Colors.accent,  location: 'Weight Room', status: 'upcoming' },
      { id: 7, time: '7:00 PM', member: 'Arjun Sharma', type: 'Leg Day', duration: '70 min', emoji: '🦵', color: Colors.green,  location: 'Weight Room', status: 'upcoming' },
    ],
    Wed: [
      { id: 8, time: '6:00 AM', member: 'Meena Joshi', type:       
  'Cardio Circuit', duration: '45 min', emoji: '🚴', color:        
  Colors.orange, location: 'Cardio Zone', status: 'upcoming' },    
      { id: 9, time: '8:00 AM', member: 'Kavita Desai', type: 'FullBody', duration: '60 min', emoji: '💥', color: Colors.red,  location: 'Weight Room', status: 'upcoming' },
      { id: 10, time: '6:00 PM', member: 'Group Class', type:      
  'Strength Circuit', duration: '60 min', emoji: '⚡', color:      
  Colors.accent, location: 'Studio B', status: 'upcoming' },       
    ],
    Thu: [
      { id: 11, time: '7:00 AM', member: 'Amit Singh', type: 'Pull Day', duration: '60 min', emoji: '💪', color: Colors.accent,  location: 'Weight Room', status: 'upcoming' },
      { id: 12, time: '5:00 PM', member: 'Priya Nair', type:       
  'Strength Circuit', duration: '50 min', emoji: '🔥', color:      
  Colors.red, location: 'Studio A', status: 'upcoming' },
    ],
    Fri: [
      { id: 13, time: '6:30 AM', member: 'Vikram Rao', type: 'Chest & Shoulders', duration: '65 min', emoji: '💪', color:Colors.accent, location: 'Weight Room', status: 'upcoming' },    
      { id: 14, time: '5:30 PM', member: 'Rahul Mehta', type:      
  'Cardio + Core', duration: '50 min', emoji: '🧱', color:
  '#EC4899', location: 'Cardio Zone', status: 'upcoming' },        
      { id: 15, time: '7:00 PM', member: 'Group Class', type: 'Full Body Burn', duration: '60 min', emoji: '🔥', color:Colors.orange, location: 'Studio A', status: 'upcoming' },       
    ],
    Sat: [
      { id: 16, time: '7:00 AM', member: 'Arjun Sharma', type: 'Leg Day', duration: '70 min', emoji: '🦵', color: Colors.green, location: 'Weight Room', status: 'upcoming' },
      { id: 17, time: '9:00 AM', member: 'Group Class', type:      
  'Saturday HIIT', duration: '45 min', emoji: '⚡', color:
  Colors.red, location: 'Studio A', status: 'upcoming' },
    ],
    Sun: [],
  };

  const statusStyle: Record<string, { bg: string; text: string;    
  label: string }> = {
    upcoming: { bg: Colors.accent + '20', text: Colors.accent,     
  label: 'Upcoming' },
    done:     { bg: Colors.green + '20',  text: Colors.green,      
  label: 'Done' },
    cancelled: { bg: Colors.red + '20',  text: Colors.red,
  label: 'Cancelled' },
  };

  const today = new Date().getDay();
  const todayIndex = today === 0 ? 6 : today - 1;

  export default function TrainerScheduleScreen() {
    const [selectedDay, setSelectedDay] = useState(todayIndex);    
    const daySessions = schedule[days[selectedDay]] ?? [];
    const doneSessions = daySessions.filter(s => s.status ===      
  'done').length;

    return (
      <ScrollView style={styles.container}
  contentContainerStyle={styles.content}
  showsVerticalScrollIndicator={false}>

        {/* Weekly Overview */}
        <FadeInView delay={0}>
          <View style={styles.overviewRow}>
            {days.map((d, i) => {
              const count = (schedule[d] ?? []).length;
              const isToday = i === todayIndex;
              const isSelected = i === selectedDay;
              return (
                <AnimatedPressable
                  key={d}
                  style={[styles.dayBox, isSelected &&
  styles.dayBoxActive]}
                  scaleDown={0.9}
                  onPress={() => setSelectedDay(i)}
                >
                  <Text style={[styles.dayLabel, isSelected &&     
  styles.dayLabelActive]}>{d}</Text>
                  <View style={[styles.dayCount, isSelected &&     
  styles.dayCountActive]}>
                    <Text style={[styles.dayCountText, isSelected  
  && { color: '#FFF' }]}>{count}</Text>
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
            <View style={styles.daySummaryLeft}>
              <Text style={styles.daySummaryTitle}>
                {days[selectedDay]}{selectedDay === todayIndex ? '(Today)' : ''}
              </Text>
              <Text style={styles.daySummaryCount}>
                {daySessions.length} session{daySessions.length !==
   1 ? 's' : ''}
                {selectedDay === todayIndex && ` · ${doneSessions} 
  done`}
              </Text>
            </View>
            <AnimatedPressable
              style={styles.addSessionBtn}
              scaleDown={0.95}
              onPress={() => Alert.alert('Add Session', 'Session  scheduling coming soon!')}
            >
              <Text style={styles.addSessionText}>+ Add</Text>     
            </AnimatedPressable>
          </View>
        </FadeInView>

        {/* Sessions List */}
        {daySessions.length === 0 ? (
          <FadeInView delay={100}>
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>😴</Text>
              <Text style={styles.emptyTitle}>Rest Day</Text>      
              <Text style={styles.emptySub}>No sessions scheduled. 
  Enjoy the break!</Text>
            </View>
          </FadeInView>
        ) : (
          daySessions.map((s, i) => {
            const ss = statusStyle[s.status];
            return (
              <FadeInView key={s.id} delay={100 + i * 65}>
                <AnimatedPressable
                  style={[styles.sessionCard, s.status === 'done'  
  && styles.sessionCardDone]}
                  scaleDown={0.97}
                  onPress={() => Alert.alert(s.member,
  `${s.type}\n${s.time} · ${s.duration}\n📍 ${s.location}`)}       
                >
                  {/* Time Column */}
                  <View style={styles.timeCol}>
                    <Text style={styles.timeText}>{s.time.split('  ')[0]}</Text>
                    <Text style={styles.timePeriod}>{s.time.split(' ')[1]}</Text>
                  </View>

                  <View style={[styles.colorBar, { backgroundColor:
   s.color }]} />

                  {/* Info */}
                  <View style={styles.sessionInfo}>
                    <View style={styles.sessionTop}>
                      <Text
  style={styles.sessionEmoji}>{s.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.sessionMember,        
  s.status === 'done' && { color: Colors.textMuted }]}>
                          {s.member}
                        </Text>
                        <Text
  style={styles.sessionType}>{s.type}</Text>
                      </View>
                      <View style={[styles.statusBadge, {
  backgroundColor: ss.bg }]}>
                        <Text style={[styles.statusText, { color:  
  ss.text }]}>{ss.label}</Text>
                      </View>
                    </View>
                    <View style={styles.sessionMeta}>
                      <Text style={styles.sessionMetaText}>⏱       
  {s.duration}</Text>
                      <Text style={styles.sessionMetaText}>📍      
  {s.location}</Text>
                    </View>
                  </View>
                </AnimatedPressable>
              </FadeInView>
            );
          })
        )}

        {/* Week Stats */}
        <FadeInView delay={500}>
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>📊 This Week</Text>    
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statVal}>
                  {Object.values(schedule).flat().length}
                </Text>
                <Text style={styles.statLabel}>Total
  Sessions</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statVal, { color: Colors.green
   }]}>
                  {Object.values(schedule).flat().filter(s =>      
  s.status === 'done').length}
                </Text>
                <Text style={styles.statLabel}>Completed</Text>    
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statVal}>
                  {Object.values(schedule).filter(d => d.length >  
  0).length}
                </Text>
                <Text style={styles.statLabel}>Active Days</Text>  
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

    overviewRow: { flexDirection: 'row', gap: 6 },
    dayBox: {
      flex: 1, alignItems: 'center', gap: 4,
      backgroundColor: Colors.bgCard, borderRadius: 12,
      paddingVertical: 10, borderWidth: 1, borderColor:
  Colors.border,
    },
    dayBoxActive: { backgroundColor: Colors.green, borderColor:    
  Colors.green },
    dayLabel: { fontSize: 11, fontWeight: '600', color:
  Colors.textMuted },
    dayLabelActive: { color: '#FFF' },
    dayCount: { width: 22, height: 22, borderRadius: 11,
  backgroundColor: Colors.bgElevated, justifyContent: 'center',    
  alignItems: 'center' },
    dayCountActive: { backgroundColor: 'rgba(255,255,255,0.3)' },  
    dayCountText: { fontSize: 11, fontWeight: '700', color:        
  Colors.text },
    todayDot: { width: 5, height: 5, borderRadius: 3,
  backgroundColor: Colors.orange },

    daySummary: { flexDirection: 'row', alignItems: 'center',      
  justifyContent: 'space-between' },
    daySummaryLeft: { gap: 2 },
    daySummaryTitle: { fontSize: 18, fontWeight: '700', color:     
  Colors.text },
    daySummaryCount: { fontSize: 13, color: Colors.textMuted },    
    addSessionBtn: { backgroundColor: Colors.green + '20',
  borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8,     
  borderWidth: 1, borderColor: Colors.green + '40' },
    addSessionText: { fontSize: 13, fontWeight: '700', color:      
  Colors.green },

    emptyCard: { alignItems: 'center', paddingVertical: 48, gap: 8,
   backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth:  
  1, borderColor: Colors.border },
    emptyEmoji: { fontSize: 48 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color:
  Colors.text },
    emptySub: { fontSize: 13, color: Colors.textMuted },

    sessionCard: {
      flexDirection: 'row', alignItems: 'stretch',
      backgroundColor: Colors.bgCard, borderRadius: 14,
      borderWidth: 1, borderColor: Colors.border, overflow:        
  'hidden', marginBottom: 2,
    },
    sessionCardDone: { opacity: 0.65 },
    timeCol: { width: 58, alignItems: 'center', justifyContent:    
  'center', gap: 2, paddingVertical: 14 },
    timeText: { fontSize: 14, fontWeight: '700', color: Colors.text
   },
    timePeriod: { fontSize: 10, color: Colors.textMuted,
  fontWeight: '600' },
    colorBar: { width: 4 },
    sessionInfo: { flex: 1, padding: 12, gap: 8 },
    sessionTop: { flexDirection: 'row', alignItems: 'center', gap: 
  8 },
    sessionEmoji: { fontSize: 20 },
    sessionMember: { fontSize: 14, fontWeight: '700', color:       
  Colors.text },
    sessionType: { fontSize: 12, color: Colors.textMuted,
  marginTop: 1 },
    statusBadge: { borderRadius: 8, paddingHorizontal: 8,
  paddingVertical: 3 },
    statusText: { fontSize: 11, fontWeight: '700' },
    sessionMeta: { flexDirection: 'row', gap: 12 },
    sessionMetaText: { fontSize: 12, color: Colors.textMuted },    

    statsCard: { backgroundColor: Colors.bgCard, borderRadius: 14, 
  padding: 16, borderWidth: 1, borderColor: Colors.border, gap: 12 
  },
    statsTitle: { fontSize: 15, fontWeight: '700', color:
  Colors.text },
    statsRow: { flexDirection: 'row', justifyContent:
  'space-around' },
    statItem: { alignItems: 'center', gap: 4 },
    statVal: { fontSize: 22, fontWeight: '700', color: Colors.text 
  },
    statLabel: { fontSize: 11, color: Colors.textMuted },
  });