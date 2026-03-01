import { useState } from 'react';                                  import { View, Text, StyleSheet, ScrollView, Alert } from          'react-native';                                                    import { MaterialCommunityIcons } from '@expo/vector-icons';     
  import { Colors } from '@/constants/colors';                       import FadeInView from '@/components/FadeInView';                
  import AnimatedPressable from '@/components/AnimatedPressable';                                                                     
  interface Member {                                               
    id: number;
    name: string;
    emoji: string;
    plan: string;
    attendance: number;
    total: number;
    streak: number;
    status: 'present' | 'absent' | 'unmarked';
  }

  const initialMembers: Member[] = [
    { id: 1, name: 'Amit Singh',   emoji: '💪', plan: 'Premium 3M',
     attendance: 26, total: 28, streak: 8,  status: 'unmarked' },  
    { id: 2, name: 'Priya Nair',   emoji: '🏃', plan: 'Standard 3M',  attendance: 24, total: 28, streak: 12, status: 'unmarked'  
  },
    { id: 3, name: 'Rahul Mehta',  emoji: '🎯', plan: 'Premium 3M',
     attendance: 14, total: 28, streak: 3,  status: 'unmarked' },  
    { id: 4, name: 'Sneha Patel',  emoji: '🧘', plan: 'Basic Monthly', attendance: 12, total: 28, streak: 2,  status:'unmarked' },
    { id: 5, name: 'Vikram Rao',   emoji: '🏋️', plan: 'Annual Gold',  attendance: 20, total: 28, streak: 5,  status: 'unmarked'
   },
    { id: 6, name: 'Meena Joshi',  emoji: '🚴', plan: 'Standard  3M',  attendance: 8,  total: 28, streak: 0,  status: 'unmarked'  
  },
    { id: 7, name: 'Arjun Sharma', emoji: '💥', plan: 'Premium 3M',
     attendance: 22, total: 28, streak: 7,  status: 'unmarked' },  
    { id: 8, name: 'Kavita Desai', emoji: '🌟', plan: 'Basic Monthly', attendance: 10, total: 28, streak: 1,  status:'unmarked' },
  ];

  const today = new Date().toLocaleDateString('en-IN', { weekday:  
  'long', day: 'numeric', month: 'long' });

  export default function AttendanceScreen() {
    const [members, setMembers] =
  useState<Member[]>(initialMembers);
    const [saved, setSaved] = useState(false);

    const markStatus = (id: number, status: 'present' | 'absent') => {
      setMembers(prev => prev.map(m =>
        m.id === id ? { ...m, status: m.status === status ?        
  'unmarked' : status } : m
      ));
    };

    const markAll = (status: 'present' | 'absent') => {
      setMembers(prev => prev.map(m => ({ ...m, status })));       
    };

    const handleSave = () => {
      const unmarked = members.filter(m => m.status ===
  'unmarked').length;
      if (unmarked > 0) {
        Alert.alert(
          'Unmarked Members',
          `${unmarked} member${unmarked > 1 ? 's' : ''} still      
  unmarked. Save anyway?`,
          [
            { text: 'Go Back', style: 'cancel' },
            { text: 'Save', onPress: () => { setSaved(true);       
  Alert.alert('✅ Saved!', 'Attendance recorded for today.'); } }, 
          ]
        );
      } else {
        setSaved(true);
        Alert.alert('✅ Saved!', 'Attendance recorded for today.');
      }
    };

    const presentCount = members.filter(m => m.status ===
  'present').length;
    const absentCount = members.filter(m => m.status ===
  'absent').length;
    const unmarkedCount = members.filter(m => m.status ===
  'unmarked').length;

    return (
      <ScrollView style={styles.container}
  contentContainerStyle={styles.content}
  showsVerticalScrollIndicator={false}>

        {/* Date Header */}
        <FadeInView delay={0}>
          <View style={styles.dateCard}>
            <View style={styles.dateLeft}>
              <Text style={styles.dateLabel}>Marking attendance    
  for</Text>
              <Text style={styles.dateText}>📅 {today}</Text>      
            </View>
            {saved && (
              <View style={styles.savedBadge}>
                <Text style={styles.savedText}>✓ Saved</Text>      
              </View>
            )}
          </View>
        </FadeInView>

        {/* Summary Row */}
        <FadeInView delay={60}>
          <View style={styles.summaryRow}>
            <View style={[styles.summaryBox, { borderColor: 
  Colors.green + '40' }]}>
              <Text style={styles.summaryEmoji}>✅</Text>
              <Text style={[styles.summaryVal, { color:
  Colors.green }]}>{presentCount}</Text>
              <Text style={styles.summaryLabel}>Present</Text>     
            </View>
            <View style={[styles.summaryBox, { borderColor:        
  Colors.red + '40' }]}>
              <Text style={styles.summaryEmoji}>❌</Text>
              <Text style={[styles.summaryVal, { color: Colors.red 
  }]}>{absentCount}</Text>
              <Text style={styles.summaryLabel}>Absent</Text>      
            </View>
            <View style={[styles.summaryBox, { borderColor:        
  Colors.border }]}>
              <Text style={styles.summaryEmoji}>⏳</Text>
              <Text
  style={styles.summaryVal}>{unmarkedCount}</Text>
              <Text style={styles.summaryLabel}>Unmarked</Text>    
            </View>
            <View style={[styles.summaryBox, { borderColor:        
  Colors.accent + '40' }]}>
              <Text style={styles.summaryEmoji}>👥</Text>
              <Text style={[styles.summaryVal, { color:
  Colors.accent }]}>{members.length}</Text>
              <Text style={styles.summaryLabel}>Total</Text>       
            </View>
          </View>
        </FadeInView>

        {/* Bulk Actions */}
        <FadeInView delay={100}>
          <View style={styles.bulkRow}>
            <Text style={styles.bulkLabel}>Mark all as:</Text>     
            <AnimatedPressable
              style={[styles.bulkBtn, { backgroundColor:
  Colors.green + '20', borderColor: Colors.green + '40' }]}        
              scaleDown={0.93}
              onPress={() => markAll('present')}
            >
              <Text style={[styles.bulkBtnText, { color:
  Colors.green }]}>✅ All Present</Text>
            </AnimatedPressable>
            <AnimatedPressable
              style={[styles.bulkBtn, { backgroundColor: Colors.red
   + '20', borderColor: Colors.red + '40' }]}
              scaleDown={0.93}
              onPress={() => markAll('absent')}
            >
              <Text style={[styles.bulkBtnText, { color: Colors.red
   }]}>❌ All Absent</Text>
            </AnimatedPressable>
          </View>
        </FadeInView>

        {/* Members List */}
        {members.map((m, i) => {
          const attendancePercent = Math.round((m.attendance /     
  m.total) * 100);
          return (
            <FadeInView key={m.id} delay={140 + i * 55}>
              <View style={[
                styles.memberCard,
                m.status === 'present' && styles.memberCardPresent,
                m.status === 'absent' && styles.memberCardAbsent,  
              ]}>
                <View style={styles.memberTop}>
                  {/* Avatar */}
                  <View style={styles.avatar}>
                    <Text
  style={styles.avatarEmoji}>{m.emoji}</Text>
                  </View>

                  {/* Info */}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.memberName}>{m.name}</Text>
                    <Text style={styles.memberPlan}>{m.plan}</Text>
                  </View>

                  {/* Streak */}
                  {m.streak >= 3 && (
                    <View style={styles.streakBadge}>
                      <Text style={styles.streakText}>🔥
  {m.streak}</Text>
                    </View>
                  )}

                  {/* Mark Buttons */}
                  <View style={styles.markBtns}>
                    <AnimatedPressable
                      style={[styles.markBtn, m.status ===
  'present' && styles.markBtnPresent]}
                      scaleDown={0.88}
                      onPress={() => markStatus(m.id, 'present')}  
                    >
                      <MaterialCommunityIcons
                        name="check"
                        size={18}
                        color={m.status === 'present' ? '#FFF' :   
  Colors.green}
                      />
                    </AnimatedPressable>
                    <AnimatedPressable
                      style={[styles.markBtn, m.status === 'absent'
   && styles.markBtnAbsent]}
                      scaleDown={0.88}
                      onPress={() => markStatus(m.id, 'absent')}   
                    >
                      <MaterialCommunityIcons
                        name="close"
                        size={18}
                        color={m.status === 'absent' ? '#FFF' :    
  Colors.red}
                      />
                    </AnimatedPressable>
                  </View>
                </View>

                {/* Attendance Bar */}
                <View style={styles.attendanceRow}>
                  <View style={styles.attendanceBar}>
                    <View style={[styles.attendanceFill, {
                      width: `${attendancePercent}%` as any,       
                      backgroundColor: attendancePercent >= 75 ?   
  Colors.green : attendancePercent >= 50 ? Colors.orange :
  Colors.red,
                    }]} />
                  </View>
                  <Text
  style={styles.attendanceText}>{m.attendance}/{m.total} days      
  ({attendancePercent}%)</Text>
                </View>
              </View>
            </FadeInView>
          );
        })}

        {/* Save Button */}
        <FadeInView delay={600}>
          <AnimatedPressable style={styles.saveBtn}
  scaleDown={0.97} onPress={handleSave}>
            <MaterialCommunityIcons name="content-save-outline"    
  size={20} color="#FFF" />
            <Text style={styles.saveBtnText}>Save Today's
  Attendance</Text>
          </AnimatedPressable>
        </FadeInView>

        <View style={{ height: 24 }} />
      </ScrollView>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    content: { padding: 16, gap: 10 },

    dateCard: {
      flexDirection: 'row', alignItems: 'center', justifyContent:  
  'space-between',
      backgroundColor: Colors.bgCard, borderRadius: 14, padding:   
  16,
      borderWidth: 1, borderColor: Colors.border,
    },
    dateLeft: { gap: 2 },
    dateLabel: { fontSize: 12, color: Colors.textMuted },
    dateText: { fontSize: 16, fontWeight: '700', color: Colors.text
   },
    savedBadge: { backgroundColor: Colors.green + '20',
  borderRadius: 10, paddingHorizontal: 12, paddingVertical: 5 },   
    savedText: { fontSize: 13, fontWeight: '700', color:
  Colors.green },

    summaryRow: { flexDirection: 'row', gap: 8 },
    summaryBox: {
      flex: 1, alignItems: 'center', gap: 3,
      backgroundColor: Colors.bgCard, borderRadius: 12,
      paddingVertical: 12, borderWidth: 1,
    },
    summaryEmoji: { fontSize: 18 },
    summaryVal: { fontSize: 18, fontWeight: '700', color:
  Colors.text },
    summaryLabel: { fontSize: 10, color: Colors.textMuted },       

    bulkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, 
  flexWrap: 'wrap' },
    bulkLabel: { fontSize: 13, color: Colors.textMuted, fontWeight:
   '600' },
    bulkBtn: { paddingHorizontal: 14, paddingVertical: 8,
  borderRadius: 10, borderWidth: 1 },
    bulkBtnText: { fontSize: 12, fontWeight: '700' },

    memberCard: {
      backgroundColor: Colors.bgCard, borderRadius: 14, padding:   
  14,
      borderWidth: 1, borderColor: Colors.border, gap: 10,
    },
    memberCardPresent: { borderColor: Colors.green + '50',
  backgroundColor: Colors.green + '08' },
    memberCardAbsent: { borderColor: Colors.red + '40',
  backgroundColor: Colors.red + '06' },
    memberTop: { flexDirection: 'row', alignItems: 'center', gap:  
  10 },
    avatar: {
      width: 42, height: 42, borderRadius: 21,
      backgroundColor: Colors.bgElevated,
      justifyContent: 'center', alignItems: 'center',
    },
    avatarEmoji: { fontSize: 20 },
    memberName: { fontSize: 14, fontWeight: '700', color:
  Colors.text },
    memberPlan: { fontSize: 12, color: Colors.textMuted, marginTop:
   1 },
    streakBadge: { backgroundColor: Colors.orangeMuted,
  borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },     
    streakText: { fontSize: 11, fontWeight: '700', color:
  Colors.orange },

    markBtns: { flexDirection: 'row', gap: 8 },
    markBtn: {
      width: 38, height: 38, borderRadius: 10,
      justifyContent: 'center', alignItems: 'center',
      backgroundColor: Colors.bgElevated, borderWidth: 1,
  borderColor: Colors.border,
    },
    markBtnPresent: { backgroundColor: Colors.green, borderColor:  
  Colors.green },
    markBtnAbsent: { backgroundColor: Colors.red, borderColor:     
  Colors.red },

    attendanceRow: { gap: 5 },
    attendanceBar: { height: 5, backgroundColor: Colors.border,    
  borderRadius: 3, overflow: 'hidden' },
    attendanceFill: { height: 5, borderRadius: 3 },
    attendanceText: { fontSize: 11, color: Colors.textMuted },     

    saveBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent:  
  'center',
      gap: 10, backgroundColor: Colors.green, borderRadius: 14,    
  paddingVertical: 16,
    },
    saveBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF'  
  },
  });
