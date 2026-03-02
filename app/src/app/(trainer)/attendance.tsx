 import { useState } from 'react';                                                    import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';            import { MaterialCommunityIcons } from '@expo/vector-icons';                         import { Colors } from '@/constants/colors';                                       
  import { Fonts } from '@/constants/fonts';                                           import FadeInView from '@/components/FadeInView';                                  
  import AnimatedPressable from '@/components/AnimatedPressable';                                                                                                         
  interface Member {                                                                 
    id: number;                                                                          name: string;                                                                    
    emoji: string;                                                                   
    plan: string;
    attendance: number;
    total: number;
    streak: number;
    status: 'present' | 'absent' | 'unmarked';
  }

  const initialMembers: Member[] = [
    { id: 1, name: 'Amit Singh',   emoji: '💪', plan: 'Premium 3M',    attendance:   
  26, total: 28, streak: 8,  status: 'unmarked' },
    { id: 2, name: 'Priya Nair',   emoji: '🏃', plan: 'Standard 3M',   attendance:   
  24, total: 28, streak: 12, status: 'unmarked' },
    { id: 3, name: 'Rahul Mehta',  emoji: '🎯', plan: 'Premium 3M',    attendance:   
  14, total: 28, streak: 3,  status: 'unmarked' },
    { id: 4, name: 'Sneha Patel',  emoji: '🧘', plan: 'Basic Monthly', attendance:   
  12, total: 28, streak: 2,  status: 'unmarked' },
    { id: 5, name: 'Vikram Rao',   emoji: '🏋️', plan: 'Annual Gold',   attendance:   
  20, total: 28, streak: 5,  status: 'unmarked' },
    { id: 6, name: 'Meena Joshi',  emoji: '🚴', plan: 'Standard 3M',   attendance: 8,
    total: 28, streak: 0,  status: 'unmarked' },
    { id: 7, name: 'Arjun Sharma', emoji: '💥', plan: 'Premium 3M',    attendance:   
  22, total: 28, streak: 7,  status: 'unmarked' },
    { id: 8, name: 'Kavita Desai', emoji: '🌟', plan: 'Basic Monthly', attendance:   
  10, total: 28, streak: 1,  status: 'unmarked' },
  ];

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day:       
  'numeric', month: 'long' });

  export default function AttendanceScreen() {
    const [members, setMembers] = useState<Member[]>(initialMembers);
    const [saved, setSaved] = useState(false);

    const markStatus = (id: number, status: 'present' | 'absent') => {
      setMembers(prev => prev.map(m =>
        m.id === id ? { ...m, status: m.status === status ? 'unmarked' : status } : m
      ));
    };

    const markAll = (status: 'present' | 'absent') => {
      setMembers(prev => prev.map(m => ({ ...m, status })));
    };

    const handleSave = () => {
      const unmarked = members.filter(m => m.status === 'unmarked').length;
      if (unmarked > 0) {
        Alert.alert(
          'Unmarked Members',
          `${unmarked} member${unmarked > 1 ? 's' : ''} still unmarked. Save
  anyway?`,
          [
            { text: 'Go Back', style: 'cancel' },
            { text: 'Save', onPress: () => { setSaved(true); Alert.alert('Saved!',   
  'Attendance recorded for today.'); } },
          ]
        );
      } else {
        setSaved(true);
        Alert.alert('Saved!', 'Attendance recorded for today.');
      }
    };

    const presentCount  = members.filter(m => m.status === 'present').length;        
    const absentCount   = members.filter(m => m.status === 'absent').length;
    const unmarkedCount = members.filter(m => m.status === 'unmarked').length;       

    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Date Header */}
        <FadeInView delay={0}>
          <View style={styles.dateCard}>
            <View style={styles.dateAccentBar} />
            <View style={styles.dateInner}>
              <View style={{ flex: 1 }}>
                <Text style={styles.dateLabel}>MARKING ATTENDANCE FOR</Text>
                <Text style={styles.dateText}>{today}</Text>
              </View>
              {saved && (
                <View style={styles.savedBadge}>
                  <Text style={styles.savedText}>✓ SAVED</Text>
                </View>
              )}
            </View>
          </View>
        </FadeInView>

        {/* Summary */}
        <FadeInView delay={60}>
          <View style={styles.summaryRow}>
            {[
              { emoji: '✅', val: presentCount,  label: 'PRESENT',  color:
  Colors.green },
              { emoji: '❌', val: absentCount,   label: 'ABSENT',   color: Colors.red
   },
              { emoji: '⏳', val: unmarkedCount, label: 'UNMARKED', color:
  Colors.textMuted },
              { emoji: '👥', val: members.length,label: 'TOTAL',    color:
  Colors.accent },
            ].map(s => (
              <View key={s.label} style={[styles.summaryBox, { borderColor: s.color +
   '35' }]}>
                <Text style={styles.summaryEmoji}>{s.emoji}</Text>
                <Text style={[styles.summaryVal, { color: s.color }]}>{s.val}</Text> 
                <Text style={styles.summaryLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </FadeInView>

        {/* Bulk Actions */}
        <FadeInView delay={100}>
          <View style={styles.bulkRow}>
            <Text style={styles.bulkLabel}>MARK ALL AS</Text>
            <AnimatedPressable
              style={[styles.bulkBtn, { backgroundColor: Colors.green + '18',        
  borderColor: Colors.green + '40' }]}
              scaleDown={0.93}
              onPress={() => markAll('present')}
            >
              <Text style={[styles.bulkBtnText, { color: Colors.green }]}>✅ ALL     
  PRESENT</Text>
            </AnimatedPressable>
            <AnimatedPressable
              style={[styles.bulkBtn, { backgroundColor: Colors.red + '18',
  borderColor: Colors.red + '40' }]}
              scaleDown={0.93}
              onPress={() => markAll('absent')}
            >
              <Text style={[styles.bulkBtnText, { color: Colors.red }]}>❌ ALL       
  ABSENT</Text>
            </AnimatedPressable>
          </View>
        </FadeInView>

        {/* Member Cards */}
        {members.map((m, i) => {
          const pct = Math.round((m.attendance / m.total) * 100);
          const barColor = pct >= 75 ? Colors.green : pct >= 50 ? Colors.orange :    
  Colors.red;
          const isPresent = m.status === 'present';
          const isAbsent  = m.status === 'absent';

          return (
            <FadeInView key={m.id} delay={140 + i * 50}>
              <View style={[
                styles.memberCard,
                isPresent && styles.memberCardPresent,
                isAbsent  && styles.memberCardAbsent,
              ]}>
                {/* Status bar on left */}
                <View style={[
                  styles.memberBar,
                  isPresent && { backgroundColor: Colors.green },
                  isAbsent  && { backgroundColor: Colors.red },
                  !isPresent && !isAbsent && { backgroundColor: Colors.border },     
                ]} />

                <View style={styles.memberInner}>
                  <View style={styles.memberTop}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarEmoji}>{m.emoji}</Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.memberName}>{m.name}</Text>
                      <Text style={styles.memberPlan}>{m.plan}</Text>
                    </View>

                    {m.streak >= 3 && (
                      <View style={styles.streakBadge}>
                        <Text style={styles.streakVal}>{m.streak}</Text>
                        <Text style={styles.streakFire}>🔥</Text>
                      </View>
                    )}

                    <View style={styles.markBtns}>
                      <AnimatedPressable
                        style={[styles.markBtn, isPresent && styles.markBtnPresent]} 
                        scaleDown={0.85}
                        onPress={() => markStatus(m.id, 'present')}
                      >
                        <MaterialCommunityIcons
                          name="check"
                          size={18}
                          color={isPresent ? '#FFF' : Colors.green}
                        />
                      </AnimatedPressable>
                      <AnimatedPressable
                        style={[styles.markBtn, isAbsent && styles.markBtnAbsent]}   
                        scaleDown={0.85}
                        onPress={() => markStatus(m.id, 'absent')}
                      >
                        <MaterialCommunityIcons
                          name="close"
                          size={18}
                          color={isAbsent ? '#FFF' : Colors.red}
                        />
                      </AnimatedPressable>
                    </View>
                  </View>

                  {/* Attendance bar */}
                  <View style={styles.attendRow}>
                    <View style={styles.attendTrack}>
                      <View style={[styles.attendFill, { width: `${pct}%` as any,    
  backgroundColor: barColor }]} />
                    </View>
                    <Text style={[styles.attendText, { color: barColor }]}>
                      {m.attendance}/{m.total} <Text
  style={styles.attendPct}>({pct}%)</Text>
                    </Text>
                  </View>
                </View>
              </View>
            </FadeInView>
          );
        })}

        {/* Save Button */}
        <FadeInView delay={580}>
          <AnimatedPressable style={styles.saveBtn} scaleDown={0.97}
  onPress={handleSave}>
            <MaterialCommunityIcons name="content-save-outline" size={18}
  color="#FFF" />
            <Text style={styles.saveBtnText}>SAVE TODAY'S ATTENDANCE</Text>
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
      flexDirection: 'row',
      backgroundColor: Colors.bgCard, borderRadius: 14,
      borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
    },
    dateAccentBar: { width: 4, backgroundColor: Colors.accent },
    dateInner: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 14,   
  gap: 12 },
    dateLabel: { fontSize: 9, fontFamily: Fonts.bold, color: Colors.textMuted,       
  letterSpacing: 1.3 },
    dateText: { fontSize: 16, fontFamily: Fonts.condensedBold, color: Colors.text,   
  marginTop: 3, letterSpacing: 0.3 },
    savedBadge: { backgroundColor: Colors.green + '18', borderRadius: 8,
  paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor:
  Colors.green + '40' },
    savedText: { fontSize: 10, fontFamily: Fonts.bold, color: Colors.green,
  letterSpacing: 1 },

    summaryRow: { flexDirection: 'row', gap: 8 },
    summaryBox: {
      flex: 1, alignItems: 'center', gap: 3,
      backgroundColor: Colors.bgCard, borderRadius: 12,
      paddingVertical: 12, borderWidth: 1,
    },
    summaryEmoji: { fontSize: 16 },
    summaryVal: { fontSize: 20, fontFamily: Fonts.condensedBold },
    summaryLabel: { fontSize: 8, fontFamily: Fonts.bold, color: Colors.textMuted,    
  letterSpacing: 1 },

    bulkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap'  
  },
    bulkLabel: { fontSize: 9, fontFamily: Fonts.bold, color: Colors.textMuted,       
  letterSpacing: 1.3 },
    bulkBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
  borderWidth: 1 },
    bulkBtnText: { fontSize: 10, fontFamily: Fonts.bold, letterSpacing: 1 },

    memberCard: {
      flexDirection: 'row',
      backgroundColor: Colors.bgCard, borderRadius: 14,
      borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
    },
    memberCardPresent: { borderColor: Colors.green + '50' },
    memberCardAbsent:  { borderColor: Colors.red + '40' },
    memberBar: { width: 3 },
    memberInner: { flex: 1, padding: 12, gap: 9 },

    memberTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    avatar: {
      width: 42, height: 42, borderRadius: 21,
      backgroundColor: Colors.bgElevated,
      justifyContent: 'center', alignItems: 'center',
    },
    avatarEmoji: { fontSize: 20 },
    memberName: { fontSize: 14, fontFamily: Fonts.bold, color: Colors.text },        
    memberPlan: { fontSize: 11, fontFamily: Fonts.regular, color: Colors.textMuted,  
  marginTop: 1 },

    streakBadge: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: Colors.orangeMuted, borderRadius: 8,
      paddingHorizontal: 7, paddingVertical: 3,
    },
    streakVal: { fontSize: 13, fontFamily: Fonts.condensedBold, color: Colors.orange 
  },
    streakFire: { fontSize: 11 },

    markBtns: { flexDirection: 'row', gap: 7 },
    markBtn: {
      width: 38, height: 38, borderRadius: 10,
      justifyContent: 'center', alignItems: 'center',
      backgroundColor: Colors.bgElevated, borderWidth: 1, borderColor: Colors.border,
    },
    markBtnPresent: { backgroundColor: Colors.green, borderColor: Colors.green },    
    markBtnAbsent:  { backgroundColor: Colors.red,   borderColor: Colors.red },      

    attendRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    attendTrack: { flex: 1, height: 5, backgroundColor: Colors.border, borderRadius: 
  3, overflow: 'hidden' },
    attendFill: { height: 5, borderRadius: 3 },
    attendText: { fontSize: 12, fontFamily: Fonts.condensedBold, minWidth: 70,       
  textAlign: 'right' },
    attendPct: { fontSize: 10, fontFamily: Fonts.regular, color: Colors.textMuted }, 

    saveBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 10, backgroundColor: Colors.green, borderRadius: 14, paddingVertical: 15, 
    },
    saveBtnText: { fontSize: 13, fontFamily: Fonts.bold, color: '#FFF',
  letterSpacing: 1.3 },
  });
