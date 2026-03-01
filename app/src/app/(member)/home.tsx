import { useState } from 'react';                                  import { View, Text, StyleSheet, ScrollView, TouchableOpacity }  
  from 'react-native';                                               import { useNavigation } from 'expo-router';                     
  import { DrawerActions } from '@react-navigation/native';          import { MaterialCommunityIcons } from '@expo/vector-icons';     
  import { useSafeAreaInsets } from                                
  'react-native-safe-area-context';                                  import { Colors } from '@/constants/colors';                     
  import { Fonts } from '@/constants/fonts';                       
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
    { rank: 1, name: 'Amit Singh',  days: 26, medal: '01' },       
    { rank: 2, name: 'Priya Nair',  days: 24, medal: '02' },       
    { rank: 3, name: 'Rahul Mehta', days: 14, medal: '03', isMe:   
  true },
    { rank: 4, name: 'Sneha Patel', days: 12, medal: '04' },       
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
        {/* ── Top Bar ───────────────────────────── */}
        <FadeInView delay={0}>
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.menuBtn}
              onPress={() =>
  navigation.dispatch(DrawerActions.openDrawer())}
            >
              <MaterialCommunityIcons name="menu" size={22}        
  color={Colors.text} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.greetSub}>GOOD MORNING</Text>    
              <Text style={styles.greetName}>{member.name}</Text>  
            </View>
            <View style={styles.streakBadge}>
              <Text style={styles.streakNum}>{member.streak}</Text>
              <Text
  style={styles.streakLabel}>DAY{'\n'}STREAK</Text>
            </View>
          </View>
        </FadeInView>

        {/* ── Membership Card ───────────────────── */}
        <FadeInView delay={80}>
          <View style={styles.memberCard}>
            {/* Ambient glow */}
            <View style={styles.cardGlow} />

            <View style={styles.memberCardTop}>
              <View>
                <Text style={styles.cardMicroLabel}>ACTIVE
  PLAN</Text>
                <Text
  style={styles.memberCardPlan}>{member.plan.toUpperCase()}</Text> 
              </View>
              <View style={styles.expiryBadge}>
                <Text
  style={styles.expiryNum}>{member.expiresIn}</Text>
                <Text
  style={styles.expiryUnit}>DAYS{'\n'}LEFT</Text>
              </View>
            </View>

            {/* Progress bar */}
            <View style={styles.planTrack}>
              <View style={[styles.planFill, { width:
  `${(member.expiresIn / 90) * 100}%` }]} />
            </View>

            <View style={styles.memberCardStats}>
              {[
                { val: member.daysAttended, label: 'VISITS' },     
                { val: member.streak,       label: 'STREAK' },     
                { val: '85%',               label: 'GOAL' },       
              ].map((s, i) => (
                <View key={i} style={styles.mcStat}>
                  <Text style={styles.mcStatVal}>{s.val}</Text>    
                  <Text style={styles.mcStatLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </FadeInView>

        {/* ── QR Check-In ──────────────────────── */}
        <FadeInView delay={160}>
          <AnimatedPressable style={styles.qrCard}
  scaleDown={0.97}>
            <View style={styles.qrIconWrap}>
              <MaterialCommunityIcons name="qrcode-scan" size={26} 
  color={Colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.qrTitle}>TAP TO CHECK IN</Text>  
              <Text style={styles.qrSub}>Show QR at the front      
  desk</Text>
            </View>
            <View style={styles.qrArrow}>
              <MaterialCommunityIcons name="chevron-right"
  size={20} color={Colors.accent} />
            </View>
          </AnimatedPressable>
        </FadeInView>

        {/* ── Water Tracker ────────────────────── */}
        <FadeInView delay={240}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>WATER INTAKE</Text>   
              <Text style={styles.waterCount}>
                <Text style={styles.waterNum}>{water}</Text>       
                <Text style={styles.waterDenom}> / {waterGoal}     
  glasses</Text>
              </Text>
            </View>
            <View style={styles.waterGrid}>
              {Array.from({ length: waterGoal }).map((_, i) => (   
                <TouchableOpacity key={i} onPress={() => setWater(i
   + 1)}>
                  <View style={[styles.waterDrop, i < water &&     
  styles.waterDropFilled]}>
                    <MaterialCommunityIcons
                      name={i < water ? 'water' : 'water-outline'} 
                      size={22}
                      color={i < water ? Colors.accent :
  Colors.border}
                    />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.waterBar}>
              <View style={[styles.waterFill, { width: `${(water / 
  waterGoal) * 100}%` as any }]} />
            </View>
          </View>
        </FadeInView>

        {/* ── Announcements ────────────────────── */}
        <FadeInView delay={320}>
          <Text style={styles.sectionTitle}>LATEST NOTICES</Text>  
          {announcements.map(a => (
            <View key={a.id} style={styles.noticeCard}>
              <View style={styles.noticeDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.noticeTitle}>{a.title}</Text>  
                <Text style={styles.noticeBody}>{a.body}</Text>    
              </View>
              <Text style={styles.noticeTime}>{a.time}</Text>      
            </View>
          ))}
        </FadeInView>

        {/* ── Leaderboard ──────────────────────── */}
        <FadeInView delay={400}>
          <Text style={styles.sectionTitle}>MONTHLY
  LEADERBOARD</Text>
          <View style={styles.card}>
            {leaderboard.map((l, i) => (
              <View key={l.rank} style={[styles.lbRow, l.isMe &&   
  styles.lbRowMe, i < leaderboard.length - 1 &&
  styles.lbRowBorder]}>
                <Text style={[styles.lbRank, l.rank === 1 && {     
  color: Colors.accent }]}>
                  {l.medal}
                </Text>
                <Text style={[styles.lbName, l.isMe && { color:    
  Colors.accent }]}>
                  {l.name}{l.isMe ? '  ← YOU' : ''}
                </Text>
                <Text style={styles.lbDays}>{l.days} days</Text>   
              </View>
            ))}
          </View>
        </FadeInView>

        <View style={{ height: 24 }} />
      </ScrollView>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    content: { paddingHorizontal: 16, gap: 12 },

    // Top bar
    topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, 
  paddingVertical: 4 },
    menuBtn: {
      width: 40, height: 40, borderRadius: 10,
      backgroundColor: Colors.bgCard,
      justifyContent: 'center', alignItems: 'center',
      borderWidth: 1, borderColor: Colors.border,
    },
    greetSub: {
      fontFamily: Fonts.medium,
      fontSize: 9, color: Colors.textMuted, letterSpacing: 1.2,    
    },
    greetName: {
      fontFamily: Fonts.bold,
      fontSize: 20, color: Colors.text, marginTop: 1,
    },
    streakBadge: {
      backgroundColor: Colors.accentMuted,
      borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, 
      alignItems: 'center', flexDirection: 'row', gap: 6,
      borderWidth: 1, borderColor: Colors.accent + '30',
    },
    streakNum: {
      fontFamily: Fonts.condensedBold,
      fontSize: 24, color: Colors.accent,
    },
    streakLabel: {
      fontFamily: Fonts.medium,
      fontSize: 8, color: Colors.accent, letterSpacing: 0.8,       
  lineHeight: 11,
    },

    // Membership card
    memberCard: {
      backgroundColor: Colors.bgCard,
      borderRadius: 20, padding: 20, gap: 14,
      overflow: 'hidden',
      borderWidth: 1, borderColor: Colors.border,
    },
    cardGlow: {
      position: 'absolute', top: -20, right: -20,
      width: 120, height: 120, borderRadius: 60,
      backgroundColor: Colors.accentGlow,
    },
    memberCardTop: { flexDirection: 'row', justifyContent:
  'space-between', alignItems: 'flex-start' },
    cardMicroLabel: {
      fontFamily: Fonts.medium,
      fontSize: 9, color: Colors.textMuted, letterSpacing: 1.2,    
  marginBottom: 4,
    },
    memberCardPlan: {
      fontFamily: Fonts.condensedBold,
      fontSize: 22, color: Colors.text, letterSpacing: 0.5,        
    },
    expiryBadge: {
      backgroundColor: Colors.accentMuted,
      borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, 
      alignItems: 'center',
    },
    expiryNum: {
      fontFamily: Fonts.condensedBold,
      fontSize: 26, color: Colors.accent,
    },
    expiryUnit: {
      fontFamily: Fonts.medium,
      fontSize: 8, color: Colors.accent, letterSpacing: 0.8,       
  textAlign: 'center',
    },
    planTrack: {
      height: 3, backgroundColor: Colors.border, borderRadius: 2,  
  overflow: 'hidden',
    },
    planFill: {
      height: 3, backgroundColor: Colors.accent, borderRadius: 2,  
    },
    memberCardStats: { flexDirection: 'row' },
    mcStat: { flex: 1, alignItems: 'center', gap: 3 },
    mcStatVal: {
      fontFamily: Fonts.condensedBold,
      fontSize: 24, color: Colors.text,
    },
    mcStatLabel: {
      fontFamily: Fonts.medium,
      fontSize: 9, color: Colors.textMuted, letterSpacing: 0.8,    
    },

    // QR card
    qrCard: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      backgroundColor: Colors.bgCard,
      borderRadius: 14, padding: 16,
      borderWidth: 1, borderColor: Colors.accent + '25',
    },
    qrIconWrap: {
      width: 48, height: 48, borderRadius: 12,
      backgroundColor: Colors.accentMuted,
      justifyContent: 'center', alignItems: 'center',
    },
    qrTitle: {
      fontFamily: Fonts.bold,
      fontSize: 13, color: Colors.text, letterSpacing: 0.5,        
    },
    qrSub: {
      fontFamily: Fonts.regular,
      fontSize: 12, color: Colors.textMuted, marginTop: 2,
    },
    qrArrow: {
      width: 32, height: 32, borderRadius: 8,
      backgroundColor: Colors.accentMuted,
      justifyContent: 'center', alignItems: 'center',
    },

    // Generic card
    card: {
      backgroundColor: Colors.bgCard,
      borderRadius: 16, padding: 16, gap: 12,
      borderWidth: 1, borderColor: Colors.border,
    },
    cardHeader: { flexDirection: 'row', justifyContent:
  'space-between', alignItems: 'center' },
    cardTitle: {
      fontFamily: Fonts.bold,
      fontSize: 11, color: Colors.textMuted, letterSpacing: 1.2,   
    },
    waterCount: {},
    waterNum: {
      fontFamily: Fonts.condensedBold,
      fontSize: 18, color: Colors.accent,
    },
    waterDenom: {
      fontFamily: Fonts.medium,
      fontSize: 12, color: Colors.textMuted,
    },
    waterGrid: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' }, 
    waterDrop: {
      width: 34, height: 34, borderRadius: 8,
      backgroundColor: Colors.bgElevated,
      justifyContent: 'center', alignItems: 'center',
    },
    waterDropFilled: { backgroundColor: Colors.accentMuted },      
    waterBar: { height: 3, backgroundColor: Colors.border,
  borderRadius: 2, overflow: 'hidden' },
    waterFill: { height: 3, backgroundColor: Colors.accent,        
  borderRadius: 2 },

    // Section title
    sectionTitle: {
      fontFamily: Fonts.bold,
      fontSize: 10, color: Colors.textMuted,
      letterSpacing: 1.5, marginTop: 4,
    },

    // Notice cards
    noticeCard: {
      flexDirection: 'row', alignItems: 'flex-start', gap: 12,     
      backgroundColor: Colors.bgCard,
      borderRadius: 12, padding: 14,
      borderWidth: 1, borderColor: Colors.border, marginBottom: 6, 
    },
    noticeDot: {
      width: 8, height: 8, borderRadius: 4,
      backgroundColor: Colors.accent, marginTop: 5,
    },
    noticeTitle: {
      fontFamily: Fonts.bold,
      fontSize: 13, color: Colors.text,
    },
    noticeBody: {
      fontFamily: Fonts.regular,
      fontSize: 12, color: Colors.textMuted, marginTop: 2,
    },
    noticeTime: {
      fontFamily: Fonts.medium,
      fontSize: 10, color: Colors.textMuted,
    },

    // Leaderboard
    lbRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingVertical: 10, paddingHorizontal: 4,
    },
    lbRowBorder: { borderBottomWidth: 1, borderBottomColor:        
  Colors.border },
    lbRowMe: {
      backgroundColor: Colors.accentMuted,
      borderRadius: 10, paddingHorizontal: 10, marginHorizontal:   
  -4,
    },
    lbRank: {
      fontFamily: Fonts.condensedBold,
      fontSize: 15, color: Colors.textMuted, width: 28,
    },
    lbName: {
      flex: 1,
      fontFamily: Fonts.medium,
      fontSize: 13, color: Colors.text,
    },
    lbDays: {
      fontFamily: Fonts.condensedSemi,
      fontSize: 14, color: Colors.textMuted,
    },
  });