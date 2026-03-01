import { View, Text, StyleSheet, ScrollView, Alert } from          'react-native';                                                  
  import { MaterialCommunityIcons } from '@expo/vector-icons';       import { Colors } from '@/constants/colors';                     
  import AnimatedPressable from '@/components/AnimatedPressable';  
  import FadeInView from '@/components/FadeInView';                

  const member = {
    name: 'Rahul Mehta',
    phone: '+91 98765 00001',
    email: 'rahul.mehta@gmail.com',
    joinDate: 'May 1, 2025',
    plan: 'Premium 3 Months',
    expiresIn: 18,
    dob: 'March 15, 1995',
    age: 30,
    height: '175 cm',
    weight: '79.1 kg',
    goal: 'Weight Loss',
    avatar: '🧑‍💼',
  };

  const stats = [
    { label: 'Days Visited', value: '14', emoji: '📅' },
    { label: 'Day Streak', value: '5', emoji: '🔥' },
    { label: 'Classes Done', value: '8', emoji: '🧘' },
    { label: 'Workouts', value: '22', emoji: '💪' },
  ];

  const achievements = [
    { title: 'First Check-in', emoji: '🎯', desc: 'Visited gym for the first time', earned: true },
    { title: '7-Day Streak', emoji: '🔥', desc: '7 consecutive daysat gym', earned: true },
    { title: 'Early Bird', emoji: '🌅', desc: 'Check in before 6 AM', earned: true },
    { title: 'Class Warrior', emoji: '🥋', desc: 'Attend 10 group   classes', earned: false },
    { title: '30-Day Streak', emoji: '💎', desc: '30 consecutive   days at gym', earned: false },
    { title: 'Weight Goal', emoji: '⚖️', desc: 'Reach your target   weight', earned: false },
    { title: 'Referral King', emoji: '👑', desc: 'Refer 5 friends  successfully', earned: false },
    { title: 'Night Owl', emoji: '🦉', desc: 'Check in after 9 PM',
   earned: true },
  ];

  type IconName = React.ComponentProps<typeof
  MaterialCommunityIcons>['name'];

  const menuItems: { label: string; icon: IconName; color: string  
  }[] = [
    { label: 'Edit Profile', icon: 'account-edit-outline', color:  
  Colors.accent },
    { label: 'Change Password', icon: 'lock-outline', color:       
  Colors.orange },
    { label: 'Notification Settings', icon: 'bell-outline', color: 
  '#8B5CF6' },
    { label: 'Privacy Policy', icon: 'shield-outline', color:      
  Colors.green },
    { label: 'Help & Support', icon: 'help-circle-outline', color: 
  '#3B82F6' },
  ];

  export default function ProfileScreen() {
    const earnedCount = achievements.filter(a => a.earned).length; 

    return (
      <ScrollView style={styles.container}
  contentContainerStyle={styles.content}
  showsVerticalScrollIndicator={false}>

        {/* Avatar & Name */}
        <FadeInView delay={0}>
          <View style={styles.heroCard}>
            <View style={styles.avatarRing}>
              <View style={styles.avatarCircle}>
                <Text
  style={styles.avatarEmoji}>{member.avatar}</Text>
              </View>
            </View>
            <Text style={styles.memberName}>{member.name}</Text>   
            <Text style={styles.memberPlan}>📋 {member.plan}</Text>
            <View style={styles.expiryChip}>
              <Text style={styles.expiryText}>⏳ {member.expiresIn}
   days left</Text>
            </View>
          </View>
        </FadeInView>

        {/* Stats Row */}
        <FadeInView delay={80}>
          <View style={styles.statsRow}>
            {stats.map(s => (
              <View key={s.label} style={styles.statBox}>
                <Text style={styles.statEmoji}>{s.emoji}</Text>    
                <Text style={styles.statVal}>{s.value}</Text>      
                <Text style={styles.statLabel}>{s.label}</Text>    
              </View>
            ))}
          </View>
        </FadeInView>

        {/* Personal Info */}
        <FadeInView delay={160}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>👤 Personal Info</Text> 
            {[
              { label: 'Phone', value: member.phone, emoji: '📞' },
              { label: 'Email', value: member.email, emoji: '📧' },
              { label: 'Date of Birth', value: `${member.dob}      
  (${member.age} yrs)`, emoji: '🎂' },
              { label: 'Member Since', value: member.joinDate,     
  emoji: '📅' },
            ].map(item => (
              <View key={item.label} style={styles.infoRow}>
                <Text style={styles.infoEmoji}>{item.emoji}</Text> 
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

        {/* Fitness Info */}
        <FadeInView delay={240}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>💪 Fitness
  Profile</Text>
            <View style={styles.fitnessGrid}>
              <View style={styles.fitnessBox}>
                <Text style={styles.fitnessEmoji}>📏</Text>        
                <Text
  style={styles.fitnessVal}>{member.height}</Text>
                <Text style={styles.fitnessLabel}>Height</Text>    
              </View>
              <View style={styles.fitnessBox}>
                <Text style={styles.fitnessEmoji}>⚖️</Text>        
                <Text
  style={styles.fitnessVal}>{member.weight}</Text>
                <Text style={styles.fitnessLabel}>Weight</Text>    
              </View>
              <View style={styles.fitnessBox}>
                <Text style={styles.fitnessEmoji}>🎯</Text>        
                <Text style={styles.fitnessVal}>22.6</Text>        
                <Text style={styles.fitnessLabel}>BMI</Text>       
              </View>
              <View style={styles.fitnessBox}>
                <Text style={styles.fitnessEmoji}>🏆</Text>        
                <Text
  style={styles.fitnessVal}>{member.goal}</Text>
                <Text style={styles.fitnessLabel}>Goal</Text>      
              </View>
            </View>
          </View>
        </FadeInView>

        {/* Achievements */}
        <FadeInView delay={320}>
          <View style={styles.card}>
            <View style={styles.achieveHeader}>
              <Text style={styles.cardTitle}>🏅 Achievements</Text>
              <View style={styles.achieveBadge}>
                <Text style={styles.achieveBadgeText}>{earnedCount}
  /{achievements.length} earned</Text>
              </View>
            </View>
            <View style={styles.achieveGrid}>
              {achievements.map(a => (
                <View key={a.title} style={[styles.achieveItem, !a.earned && styles.achieveItemLocked]}>
                  <Text style={[styles.achieveEmoji, !a.earned &&  
  styles.achieveEmojiLocked]}>
                    {a.earned ? a.emoji : '🔒'}
                  </Text>
                  <Text style={[styles.achieveTitle, !a.earned &&  
  styles.achieveTitleLocked]}>
                    {a.title}
                  </Text>
                  <Text style={styles.achieveDesc}>{a.desc}</Text> 
                </View>
              ))}
            </View>
          </View>
        </FadeInView>

        {/* Settings Menu */}
        <FadeInView delay={400}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>⚙️ Account
  Settings</Text>
            {menuItems.map((item, i) => (
              <AnimatedPressable
                key={item.label}
                style={[styles.menuRow, i < menuItems.length - 1 &&
   styles.menuRowBorder]}
                scaleDown={0.97}
                onPress={() => Alert.alert(item.label, 'Coming  soon!')}
              >
                <View style={[styles.menuIcon, { backgroundColor:  
  item.color + '20' }]}>
                  <MaterialCommunityIcons name={item.icon}
  size={18} color={item.color} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text> 
                <MaterialCommunityIcons name="chevron-right"   size={18} color={Colors.textMuted} />
              </AnimatedPressable>
            ))}
          </View>
        </FadeInView>

        {/* Logout */}
        <FadeInView delay={480}>
          <AnimatedPressable
            style={styles.logoutBtn}
            scaleDown={0.97}
            onPress={() => Alert.alert('Log Out', 'Are you sure you want to log out?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Log Out', style: 'destructive' },
            ])}
          >
            <Text style={styles.logoutText}>🚪 Log Out</Text>      
          </AnimatedPressable>
        </FadeInView>

        <Text style={styles.version}>💪 GymSetu v1.0.0</Text>      
        <View style={{ height: 24 }} />
      </ScrollView>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    content: { padding: 16, gap: 12 },

    heroCard: {
      backgroundColor: Colors.bgCard, borderRadius: 20, padding:   
  24,
      alignItems: 'center', gap: 8, borderWidth: 1, borderColor:   
  Colors.border,
    },
    avatarRing: {
      width: 88, height: 88, borderRadius: 44,
      borderWidth: 3, borderColor: Colors.accent,
      justifyContent: 'center', alignItems: 'center', marginBottom:
   4,
    },
    avatarCircle: {
      width: 76, height: 76, borderRadius: 38,
      backgroundColor: Colors.accentMuted,
      justifyContent: 'center', alignItems: 'center',
    },
    avatarEmoji: { fontSize: 36 },
    memberName: { fontSize: 22, fontWeight: '700', color:
  Colors.text },
    memberPlan: { fontSize: 13, color: Colors.textMuted },
    expiryChip: {
      backgroundColor: Colors.orangeMuted, borderRadius: 20,       
      paddingHorizontal: 14, paddingVertical: 5,
      borderWidth: 1, borderColor: Colors.orange + '30',
    },
    expiryText: { fontSize: 12, fontWeight: '600', color:
  Colors.orange },

    statsRow: { flexDirection: 'row', gap: 8 },
    statBox: {
      flex: 1, alignItems: 'center', gap: 3,
      backgroundColor: Colors.bgCard, borderRadius: 12,
      paddingVertical: 12, borderWidth: 1, borderColor:
  Colors.border,
    },
    statEmoji: { fontSize: 18 },
    statVal: { fontSize: 16, fontWeight: '700', color: Colors.text 
  },
    statLabel: { fontSize: 10, color: Colors.textMuted, textAlign: 
  'center' },

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

    fitnessGrid: { flexDirection: 'row', gap: 8 },
    fitnessBox: {
      flex: 1, alignItems: 'center', gap: 4,
      backgroundColor: Colors.bgElevated, borderRadius: 12,        
  paddingVertical: 12,
    },
    fitnessEmoji: { fontSize: 20 },
    fitnessVal: { fontSize: 14, fontWeight: '700', color:
  Colors.text, textAlign: 'center' },
    fitnessLabel: { fontSize: 10, color: Colors.textMuted },       

    achieveHeader: { flexDirection: 'row', justifyContent:
  'space-between', alignItems: 'center' },
    achieveBadge: { backgroundColor: Colors.accentMuted,
  borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },    
    achieveBadgeText: { fontSize: 12, fontWeight: '600', color:    
  Colors.accent },
    achieveGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8  
  },
    achieveItem: {
      width: '22%', minWidth: 74, alignItems: 'center', gap: 4,    
      backgroundColor: Colors.accentMuted, borderRadius: 12,       
      paddingVertical: 12, paddingHorizontal: 4,
      borderWidth: 1, borderColor: Colors.accent + '30',
    },
    achieveItemLocked: {
      backgroundColor: Colors.bgElevated,
      borderColor: Colors.border, opacity: 0.5,
    },
    achieveEmoji: { fontSize: 24 },
    achieveEmojiLocked: { opacity: 0.4 },
    achieveTitle: { fontSize: 10, fontWeight: '700', color:        
  Colors.text, textAlign: 'center' },
    achieveTitleLocked: { color: Colors.textMuted },
    achieveDesc: { fontSize: 9, color: Colors.textMuted, textAlign:
   'center', lineHeight: 13 },

    menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12,
   paddingVertical: 10 },
    menuRowBorder: { borderBottomWidth: 1, borderBottomColor:      
  Colors.border },
    menuIcon: { width: 34, height: 34, borderRadius: 9,
  justifyContent: 'center', alignItems: 'center' },
    menuLabel: { flex: 1, fontSize: 14, fontWeight: '500', color:  
  Colors.text },

    logoutBtn: {
      alignItems: 'center', paddingVertical: 14, borderRadius: 12, 
      backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: 
  Colors.red + '40',
    },
    logoutText: { fontSize: 15, fontWeight: '600', color:
  Colors.red },

    version: { textAlign: 'center', color: Colors.textMuted,       
  fontSize: 12 },
  });
