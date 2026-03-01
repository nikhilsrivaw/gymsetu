 import { useState } from 'react';
  import { View, Text, StyleSheet, ScrollView, TouchableOpacity }  
  from 'react-native';
  import { useNavigation } from 'expo-router';
  import { DrawerActions } from '@react-navigation/native';        
  import { MaterialCommunityIcons } from '@expo/vector-icons';     
  import { useSafeAreaInsets } from
  'react-native-safe-area-context';
  import { Colors } from '@/constants/colors';
  import FadeInView from '@/components/FadeInView';
  import AnimatedPressable from '@/components/AnimatedPressable';  

  const member = {
    name: 'Rahul Mehta',
    plan: 'Premium 3 Months',
    expiresIn: 18,
    daysAttended: 14,
    streak: 5,
    referralCode: 'RAHUL2024',
  };

  const announcements = [
    { id: 1, title: 'New Yoga Batch Starting!', body: 'Morning yoga batch starts Monday 6 AM.', emoji: '🧘', time: '2h ago' },      
    { id: 2, title: 'Gym Closed Sunday', body: 'Gym will be closed this Sunday for maintenance.', emoji: '🔔', time: '1d ago' },    
  ];

  const leaderboard = [
    { rank: 1, name: 'Amit Singh', days: 26, emoji: '🥇' },
    { rank: 2, name: 'Priya Nair', days: 24, emoji: '🥈' },        
    { rank: 3, name: 'Rahul Mehta', days: 14, emoji: '🥉', isMe:   
  true },
    { rank: 4, name: 'Sneha Patel', days: 12, emoji: '4️' },       
  ];

  export default function MemberHome() {
    const [water, setWater] = useState(3);
    const waterGoal = 8;
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop:      
  insets.top + 12 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Custom Header Row */}
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
              <Text style={styles.greetName}>{member.name}</Text>  
            </View>
            <View style={styles.streakBadge}>
              <Text style={styles.streakFire}>🔥</Text>
              <Text style={styles.streakText}>{member.streak} day  
  streak</Text>
            </View>
          </View>
        </FadeInView>

        {/* Membership Card */}
        <FadeInView delay={80}>
          <View style={styles.memberCard}>
            <View style={styles.memberCardTop}>
              <View>
                <Text style={styles.memberCardLabel}>Active        
  Plan</Text>
                <Text
  style={styles.memberCardPlan}>{member.plan}</Text>
              </View>
              <View style={styles.expiryBadge}>
                <Text style={styles.expiryText}>⏳
  {member.expiresIn}d left</Text>
              </View>
            </View>
            <View style={styles.memberCardStats}>
              <View style={styles.mcStat}>
                <Text
  style={styles.mcStatVal}>{member.daysAttended}</Text>
                <Text style={styles.mcStatLabel}>Days This
  Month</Text>
              </View>
              <View style={styles.mcDivider} />
              <View style={styles.mcStat}>
                <Text
  style={styles.mcStatVal}>{member.streak}</Text>
                <Text style={styles.mcStatLabel}>Current
  Streak</Text>
              </View>
              <View style={styles.mcDivider} />
              <View style={styles.mcStat}>
                <Text style={styles.mcStatVal}>85%</Text>
                <Text style={styles.mcStatLabel}>Goal
  Progress</Text>
              </View>
            </View>
          </View>
        </FadeInView>

        {/* QR Check-In */}
        <FadeInView delay={160}>
          <AnimatedPressable style={styles.qrCard}
  scaleDown={0.97}>
            <View style={styles.qrIcon}>
              <MaterialCommunityIcons name="qrcode-scan" size={32} 
  color={Colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.qrTitle}>Tap to Check In</Text>  
              <Text style={styles.qrSub}>Show QR at the front      
  desk</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} 
  color={Colors.textMuted} />
          </AnimatedPressable>
        </FadeInView>

        {/* Water Tracker */}
        <FadeInView delay={240}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>💧 Water Intake</Text>
              <Text style={styles.waterCount}>{water} / {waterGoal}
   glasses</Text>
            </View>
            <View style={styles.waterGrid}>
              {Array.from({ length: waterGoal }).map((_, i) => (   
                <TouchableOpacity key={i} onPress={() => setWater(i
   + 1)}>
                  <MaterialCommunityIcons
                    name={i < water ? 'cup' : 'cup-outline'}       
                    size={28}
                    color={i < water ? '#3B82F6' : Colors.border}  
                  />
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.waterBar}>
              <View style={[styles.waterFill, { width: `${(water / 
  waterGoal) * 100}%` as any }]} />
            </View>
          </View>
        </FadeInView>

        {/* Announcements */}
        <FadeInView delay={320}>
          <Text style={styles.sectionTitle}>📢 Latest
  Notices</Text>
          {announcements.map(a => (
            <View key={a.id} style={styles.noticeCard}>
              <Text style={styles.noticeEmoji}>{a.emoji}</Text>    
              <View style={{ flex: 1 }}>
                <Text style={styles.noticeTitle}>{a.title}</Text>  
                <Text style={styles.noticeBody}>{a.body}</Text>    
              </View>
              <Text style={styles.noticeTime}>{a.time}</Text>      
            </View>
          ))}
        </FadeInView>

        {/* Leaderboard */}
        <FadeInView delay={400}>
          <Text style={styles.sectionTitle}>🏆 Monthly
  Leaderboard</Text>
          <View style={styles.card}>
            {leaderboard.map(l => (
              <View key={l.rank} style={[styles.lbRow, l.isMe &&   
  styles.lbRowMe]}>
                <Text style={styles.lbEmoji}>{l.emoji}</Text>      
                <Text style={[styles.lbName, l.isMe && { color:    
  Colors.accent, fontWeight: '700' }]}>
                  {l.name}{l.isMe ? ' (You)' : ''}
                </Text>
                <Text style={styles.lbDays}>{l.days} days</Text>   
              </View>
            ))}
          </View>
        </FadeInView>

        <View style={{ height: 20 }} />
      </ScrollView>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    content: { padding: 16, gap: 12 },

    topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, 
  paddingVertical: 4 },
    menuBtn: { width: 40, height: 40, borderRadius: 12,
  backgroundColor: Colors.bgCard, justifyContent: 'center',        
  alignItems: 'center', borderWidth: 1, borderColor: Colors.border 
  },
    greetSub: { fontSize: 13, color: Colors.textMuted },
    greetName: { fontSize: 20, fontWeight: '700', color:
  Colors.text },
    streakBadge: { flexDirection: 'row', alignItems: 'center', gap:
   4, backgroundColor: Colors.orangeMuted, borderRadius: 20,       
  paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1,       
  borderColor: Colors.orange + '30' },
    streakFire: { fontSize: 14 },
    streakText: { fontSize: 12, fontWeight: '600', color:
  Colors.orange },

    memberCard: { backgroundColor: Colors.accent, borderRadius: 18,
   padding: 20, gap: 16 },
    memberCardTop: { flexDirection: 'row', justifyContent:
  'space-between', alignItems: 'flex-start' },
    memberCardLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)'
   },
    memberCardPlan: { fontSize: 18, fontWeight: '700', color:      
  '#FFF', marginTop: 2 },
    expiryBadge: { backgroundColor: 'rgba(255,255,255,0.2)',       
  borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },   
    expiryText: { fontSize: 12, color: '#FFF', fontWeight: '600' },
    memberCardStats: { flexDirection: 'row', justifyContent:       
  'space-around' },
    mcStat: { alignItems: 'center', gap: 2 },
    mcStatVal: { fontSize: 20, fontWeight: '700', color: '#FFF' }, 
    mcStatLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)' }, 
    mcDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)'
   },

    qrCard: { flexDirection: 'row', alignItems: 'center', gap: 14, 
  backgroundColor: Colors.accentMuted, borderRadius: 14, padding:  
  16, borderWidth: 1, borderColor: Colors.accent + '30' },
    qrIcon: { width: 52, height: 52, borderRadius: 14,
  backgroundColor: Colors.bgCard, justifyContent: 'center',        
  alignItems: 'center' },
    qrTitle: { fontSize: 16, fontWeight: '700', color: Colors.text 
  },
    qrSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },

    card: { backgroundColor: Colors.bgCard, borderRadius: 16,      
  padding: 16, borderWidth: 1, borderColor: Colors.border, gap: 12 
  },
    cardHeader: { flexDirection: 'row', justifyContent:
  'space-between', alignItems: 'center' },
    cardTitle: { fontSize: 15, fontWeight: '700', color:
  Colors.text },
    waterCount: { fontSize: 13, fontWeight: '600', color: '#3B82F6'
   },
    waterGrid: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' }, 
    waterBar: { height: 6, backgroundColor: Colors.border,
  borderRadius: 3, overflow: 'hidden' },
    waterFill: { height: 6, backgroundColor: '#3B82F6',
  borderRadius: 3 },

    sectionTitle: { fontSize: 15, fontWeight: '700', color:        
  Colors.text, marginTop: 4 },
    noticeCard: { flexDirection: 'row', alignItems: 'flex-start',  
  gap: 10, backgroundColor: Colors.bgCard, borderRadius: 12,       
  padding: 14, borderWidth: 1, borderColor: Colors.border,
  marginBottom: 8 },
    noticeEmoji: { fontSize: 20, marginTop: 2 },
    noticeTitle: { fontSize: 14, fontWeight: '600', color:
  Colors.text },
    noticeBody: { fontSize: 12, color: Colors.textMuted, marginTop:
   2 },
    noticeTime: { fontSize: 11, color: Colors.textMuted },

    lbRow: { flexDirection: 'row', alignItems: 'center', gap: 10,  
  paddingVertical: 8, borderBottomWidth: 1, borderBottomColor:     
  Colors.border },
    lbRowMe: { backgroundColor: Colors.accentMuted, borderRadius:  
  10, paddingHorizontal: 8, borderBottomWidth: 0, marginHorizontal:
   -4 },
    lbEmoji: { fontSize: 18, width: 28 },
    lbName: { flex: 1, fontSize: 14, fontWeight: '500', color:     
  Colors.text },
    lbDays: { fontSize: 13, fontWeight: '600', color:
  Colors.textMuted },
  });