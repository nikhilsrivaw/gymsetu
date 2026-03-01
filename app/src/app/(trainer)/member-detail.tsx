  import { useState } from 'react';                                  import { View, Text, StyleSheet, ScrollView, Alert, Linking }      from 'react-native';                                               import { useLocalSearchParams, Stack } from 'expo-router';       
  import { MaterialCommunityIcons } from '@expo/vector-icons';       import { Colors } from '@/constants/colors';                     
  import FadeInView from '@/components/FadeInView';                  import AnimatedPressable from '@/components/AnimatedPressable';  
                                                                   
  const membersData: Record<string, any> = {
    '1': {
      name: 'Amit Singh', emoji: '💪', goal: 'Muscle Gain', plan:
  'Premium 3M',
      phone: '+91 98765 11111', email: 'amit.singh@gmail.com',     
      age: 28, height: '178 cm', weight: '82 kg', bmi: '25.9',     
      daysLeft: 22, attendance: 26, streak: 8, progress: 75,       
      joinDate: 'Dec 1, 2025', status: 'active',
      notes: 'Very dedicated. Increase bench press weight next  week.',
      workoutPlan: 'Push-Pull-Legs Split',
      measurements: [
        { label: 'Chest', value: '98 cm', change: '+2 cm' },       
        { label: 'Waist', value: '84 cm', change: '-2 cm' },       
        { label: 'Arms', value: '36 cm', change: '+1.5 cm' },      
      ],
      recentSessions: [
        { date: 'Feb 28', type: 'Push Day', duration: '65 min',    
  emoji: '💪' },
        { date: 'Feb 26', type: 'Pull Day', duration: '60 min',    
  emoji: '🏋️' },
        { date: 'Feb 24', type: 'Leg Day', duration: '70 min',     
  emoji: '🦵' },
      ],
    },
    '2': {
      name: 'Priya Nair', emoji: '🏃', goal: 'Weight Loss', plan:  
  'Standard 3M',
      phone: '+91 98765 22222', email: 'priya.nair@gmail.com',     
      age: 32, height: '162 cm', weight: '68 kg', bmi: '25.9',     
      daysLeft: 14, attendance: 24, streak: 12, progress: 90,      
      joinDate: 'Nov 15, 2025', status: 'expiring',
      notes: 'Reached weight goal! Discuss next phase - toning.',  
      workoutPlan: 'Cardio + Strength Circuit',
      measurements: [
        { label: 'Chest', value: '88 cm', change: '-3 cm' },       
        { label: 'Waist', value: '72 cm', change: '-5 cm' },       
        { label: 'Hips', value: '92 cm', change: '-3 cm' },        
      ],
      recentSessions: [
        { date: 'Feb 28', type: 'HIIT Cardio', duration: '45 min', 
  emoji: '🔥' },
        { date: 'Feb 27', type: 'Strength Circuit', duration: '50 min', emoji: '💪' },
        { date: 'Feb 25', type: 'Yoga Flow', duration: '60 min', emoji: '🧘' },
      ],
    },
  };

  const tabs = ['Overview', 'Sessions', 'Measurements', 'Notes'];  

  export default function MemberDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [activeTab, setActiveTab] = useState(0);
    const member = membersData[id ?? '1'] ?? membersData['1'];     

    const statusColor = member.status === 'active' ? Colors.green :
      member.status === 'expiring' ? Colors.orange : Colors.red;   

    return (
      <>
        <Stack.Screen options={{ title: `👤 ${member.name}` }} />  
        <ScrollView style={styles.container}
  contentContainerStyle={styles.content}
  showsVerticalScrollIndicator={false}>

          {/* Hero Card */}
          <FadeInView delay={0}>
            <View style={styles.heroCard}>
              <View style={styles.heroTop}>
                <View style={styles.avatarCircle}>
                  <Text
  style={styles.avatarEmoji}>{member.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text
  style={styles.heroName}>{member.name}</Text>
                  <Text style={styles.heroGoal}>🎯
  {member.goal}</Text>
                  <Text style={styles.heroPlan}>📋
  {member.plan}</Text>
                </View>
                <View style={[styles.statusBadge, {
  backgroundColor: statusColor + '20' }]}>
                  <Text style={[styles.statusText, { color:        
  statusColor }]}>
                    {member.status === 'active' ? '✓ Active' :     
  member.status === 'expiring' ? '⚠️ Expiring' : '😴 Inactive'}    
                  </Text>
                </View>
              </View>

              {/* Stats */}
              <View style={styles.heroStats}>
                <View style={styles.heroStat}>
                  <Text
  style={styles.heroStatVal}>{member.attendance}</Text>
                  <Text
  style={styles.heroStatLabel}>Days/Month</Text>
                </View>
                <View style={styles.heroStatDivider} />
                <View style={styles.heroStat}>
                  <Text
  style={styles.heroStatVal}>{member.streak}</Text>
                  <Text style={styles.heroStatLabel}>Streak</Text> 
                </View>
                <View style={styles.heroStatDivider} />
                <View style={styles.heroStat}>
                  <Text
  style={styles.heroStatVal}>{member.daysLeft}d</Text>
                  <Text style={styles.heroStatLabel}>Left</Text>   
                </View>
                <View style={styles.heroStatDivider} />
                <View style={styles.heroStat}>
                  <Text
  style={styles.heroStatVal}>{member.progress}%</Text>
                  <Text
  style={styles.heroStatLabel}>Progress</Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, {
                  width: `${member.progress}%` as any,
                  backgroundColor: member.progress >= 70 ?
  Colors.green : Colors.orange,
                }]} />
              </View>
            </View>
          </FadeInView>

          {/* Action Buttons */}
          <FadeInView delay={80}>
            <View style={styles.actionRow}>
              <AnimatedPressable
                style={[styles.actionBtn, { backgroundColor:       
  Colors.green + '20', borderColor: Colors.green + '40' }]}        
                scaleDown={0.93}
                onPress={() =>
  Linking.openURL(`tel:${member.phone}`)}
              >
                <MaterialCommunityIcons name="phone" size={18}     
  color={Colors.green} />
                <Text style={[styles.actionBtnText, { color:       
  Colors.green }]}>Call</Text>
              </AnimatedPressable>
              <AnimatedPressable
                style={[styles.actionBtn, { backgroundColor:       
  '#25D36620', borderColor: '#25D36640' }]}
                scaleDown={0.93}
                onPress={() =>
  Linking.openURL(`whatsapp://send?phone=${member.phone}`)}        
              >
                <MaterialCommunityIcons name="whatsapp" size={18}  
  color="#25D366" />
                <Text style={[styles.actionBtnText, { color:       
  '#25D366' }]}>WhatsApp</Text>
              </AnimatedPressable>
              <AnimatedPressable
                style={[styles.actionBtn, { backgroundColor:       
  Colors.accent + '20', borderColor: Colors.accent + '40' }]}      
                scaleDown={0.93}
                onPress={() => Alert.alert('Log Progress', 'Opening progress logger...')}
              >
                <MaterialCommunityIcons name="chart-line" size={18}
   color={Colors.accent} />
                <Text style={[styles.actionBtnText, { color:       
  Colors.accent }]}>Progress</Text>
              </AnimatedPressable>
              <AnimatedPressable
                style={[styles.actionBtn, { backgroundColor:       
  Colors.orange + '20', borderColor: Colors.orange + '40' }]}      
                scaleDown={0.93}
                onPress={() => Alert.alert('Workout Plan', 'Opening plan editor...')}
              >
                <MaterialCommunityIcons name="dumbbell" size={18}  
  color={Colors.orange} />
                <Text style={[styles.actionBtnText, { color:       
  Colors.orange }]}>Plan</Text>
              </AnimatedPressable>
            </View>
          </FadeInView>

          {/* Tabs */}
          <FadeInView delay={140}>
            <ScrollView horizontal
  showsHorizontalScrollIndicator={false}
  contentContainerStyle={styles.tabRow}>
              {tabs.map((t, i) => (
                <AnimatedPressable
                  key={t}
                  style={[styles.tab, activeTab === i &&
  styles.tabActive]}
                  scaleDown={0.93}
                  onPress={() => setActiveTab(i)}
                >
                  <Text style={[styles.tabText, activeTab === i && 
  styles.tabTextActive]}>{t}</Text>
                </AnimatedPressable>
              ))}
            </ScrollView>
          </FadeInView>

          {/* Tab: Overview */}
          {activeTab === 0 && (
            <FadeInView delay={180}>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>👤 Personal
  Info</Text>
                {[
                  { label: 'Phone', value: member.phone, emoji:    
  '📞' },
                  { label: 'Email', value: member.email, emoji:    
  '📧' },
                  { label: 'Age', value: `${member.age} years`,    
  emoji: '🎂' },
                  { label: 'Height', value: member.height, emoji:  
  '📏' },
                  { label: 'Weight', value: member.weight, emoji:  
  '⚖️' },
                  { label: 'BMI', value: member.bmi, emoji: '🧮' },
                  { label: 'Member Since', value: member.joinDate, 
  emoji: '📅' },
                  { label: 'Workout Plan', value:
  member.workoutPlan, emoji: '📋' },
                ].map(item => (
                  <View key={item.label} style={styles.infoRow}>   
                    <Text
  style={styles.infoEmoji}>{item.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text
  style={styles.infoLabel}>{item.label}</Text>
                      <Text
  style={styles.infoValue}>{item.value}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </FadeInView>
          )}

          {/* Tab: Sessions */}
          {activeTab === 1 && (
            <FadeInView delay={180}>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>🏋️ Recent
  Sessions</Text>
                {member.recentSessions.map((s: any, i: number) => (
                  <View key={i} style={styles.sessionRow}>
                    <Text
  style={styles.sessionEmoji}>{s.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text
  style={styles.sessionType}>{s.type}</Text>
                      <Text style={styles.sessionMeta}>{s.date} ·  
  {s.duration}</Text>
                    </View>
                    <MaterialCommunityIcons name="check-circle"    
  size={18} color={Colors.green} />
                  </View>
                ))}
              </View>
            </FadeInView>
          )}

          {/* Tab: Measurements */}
          {activeTab === 2 && (
            <FadeInView delay={180}>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>📏 Body
  Measurements</Text>
                {member.measurements.map((m: any, i: number) => (  
                  <View key={i} style={styles.measRow}>
                    <Text style={styles.measLabel}>{m.label}</Text>
                    <Text style={styles.measVal}>{m.value}</Text>  
                    <View style={[styles.changeBadge, {
  backgroundColor: Colors.green + '20' }]}>
                      <Text style={[styles.changeText, { color:    
  Colors.green }]}>{m.change}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </FadeInView>
          )}

          {/* Tab: Notes */}
          {activeTab === 3 && (
            <FadeInView delay={180}>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>📝 Trainer
  Notes</Text>
                <View style={styles.notesBox}>
                  <Text
  style={styles.notesText}>{member.notes}</Text>
                </View>
                <AnimatedPressable
                  style={styles.addNoteBtn}
                  scaleDown={0.97}
                  onPress={() => Alert.alert('Add Note', 'Note editor coming soon!')}
                >
                  <MaterialCommunityIcons name="plus" size={16}    
  color={Colors.accent} />
                  <Text style={styles.addNoteText}>Add Note</Text> 
                </AnimatedPressable>
              </View>
            </FadeInView>
          )}

          <View style={{ height: 24 }} />
        </ScrollView>
      </>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    content: { padding: 16, gap: 12 },

    heroCard: { backgroundColor: Colors.bgCard, borderRadius: 18,  
  padding: 18, borderWidth: 1, borderColor: Colors.border, gap: 14 
  },
    heroTop: { flexDirection: 'row', alignItems: 'center', gap: 12 
  },
    avatarCircle: { width: 56, height: 56, borderRadius: 28,       
  backgroundColor: Colors.bgElevated, justifyContent: 'center',    
  alignItems: 'center' },
    avatarEmoji: { fontSize: 28 },
    heroName: { fontSize: 18, fontWeight: '700', color: Colors.text
   },
    heroGoal: { fontSize: 12, color: Colors.textMuted, marginTop: 2
   },
    heroPlan: { fontSize: 12, color: Colors.textMuted },
    statusBadge: { borderRadius: 8, paddingHorizontal: 10,
  paddingVertical: 5 },
    statusText: { fontSize: 11, fontWeight: '700' },

    heroStats: { flexDirection: 'row', justifyContent:
  'space-around' },
    heroStat: { alignItems: 'center', gap: 2 },
    heroStatVal: { fontSize: 18, fontWeight: '700', color:
  Colors.text },
    heroStatLabel: { fontSize: 10, color: Colors.textMuted },      
    heroStatDivider: { width: 1, backgroundColor: Colors.border }, 

    progressBar: { height: 6, backgroundColor: Colors.border,      
  borderRadius: 3, overflow: 'hidden' },
    progressFill: { height: 6, borderRadius: 3 },

    actionRow: { flexDirection: 'row', gap: 8 },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems:        
  'center', justifyContent: 'center', gap: 5, paddingVertical: 12, 
  borderRadius: 12, borderWidth: 1 },
    actionBtnText: { fontSize: 12, fontWeight: '700' },

    tabRow: { gap: 8, paddingVertical: 2 },
    tab: { paddingHorizontal: 18, paddingVertical: 9, borderRadius:
   20, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor:
   Colors.border },
    tabActive: { backgroundColor: Colors.green + '20', borderColor:
   Colors.green },
    tabText: { fontSize: 13, fontWeight: '500', color:
  Colors.textMuted },
    tabTextActive: { color: Colors.green, fontWeight: '700' },     

    card: { backgroundColor: Colors.bgCard, borderRadius: 16,      
  padding: 16, borderWidth: 1, borderColor: Colors.border, gap: 12 
  },
    cardTitle: { fontSize: 15, fontWeight: '700', color:
  Colors.text },

    infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap:
   10 },
    infoEmoji: { fontSize: 16, marginTop: 2 },
    infoLabel: { fontSize: 11, color: Colors.textMuted },
    infoValue: { fontSize: 14, fontWeight: '500', color:
  Colors.text, marginTop: 1 },

    sessionRow: { flexDirection: 'row', alignItems: 'center', gap: 
  12, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: 
  Colors.border },
    sessionEmoji: { fontSize: 22 },
    sessionType: { fontSize: 14, fontWeight: '600', color:
  Colors.text },
    sessionMeta: { fontSize: 12, color: Colors.textMuted,
  marginTop: 2 },

    measRow: { flexDirection: 'row', alignItems: 'center', gap: 10,
   paddingVertical: 4 },
    measLabel: { flex: 1, fontSize: 14, fontWeight: '500', color:  
  Colors.text },
    measVal: { fontSize: 14, fontWeight: '600', color: Colors.text 
  },
    changeBadge: { borderRadius: 6, paddingHorizontal: 8,
  paddingVertical: 3 },
    changeText: { fontSize: 12, fontWeight: '700' },

    notesBox: { backgroundColor: Colors.bgElevated, borderRadius:  
  12, padding: 14 },
    notesText: { fontSize: 14, color: Colors.textSub, lineHeight:  
  21 },
    addNoteBtn: { flexDirection: 'row', alignItems: 'center',      
  justifyContent: 'center', gap: 6, paddingVertical: 10,
  borderRadius: 10, borderWidth: 1, borderColor: Colors.accent +   
  '40', borderStyle: 'dashed' },
    addNoteText: { fontSize: 13, fontWeight: '600', color:
  Colors.accent },
  });