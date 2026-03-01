import { View, Text, StyleSheet, ScrollView, Alert } from          'react-native';                                                    import { MaterialCommunityIcons } from '@expo/vector-icons';       import { Colors } from '@/constants/colors';                     
  import { Fonts } from '@/constants/fonts';                         import AnimatedPressable from '@/components/AnimatedPressable';  
  import FadeInView from '@/components/FadeInView';                                                                                   
  const member = {                                                 
    name: 'Rahul Mehta',                                               phone: '+91 98765 00001',                                      
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
    { label: 'VISITED', value: '14', emoji: '📅' },
    { label: 'STREAK', value: '5', emoji: '🔥' },
    { label: 'CLASSES', value: '8', emoji: '🧘' },
    { label: 'WORKOUTS', value: '22', emoji: '💪' },
  ];

  const achievements = [
    { title: 'First Check-in', emoji: '🎯', desc: 'Visited gym for the first time', earned: true },
    { title: '7-Day Streak', emoji: '🔥', desc: '7 consecutive days at gym', earned: true },
    { title: 'Early Bird', emoji: '🌅', desc: 'Check in before 6 AM', earned: true },
    { title: 'Night Owl', emoji: '🦉', desc: 'Check in after 9 PM',
   earned: true },
    { title: 'Class Warrior', emoji: '🥋', desc: 'Attend 10 group classes', earned: false },
    { title: '30-Day Streak', emoji: '💎', desc: '30 consecutive days', earned: false },
    { title: 'Weight Goal', emoji: '⚖️', desc: 'Reach your target  weight', earned: false },
    { title: 'Referral King', emoji: '👑', desc: 'Refer 5 friends',
   earned: false },
  ];

  const personalInfo = [
    { label: 'PHONE', value: member.phone, emoji: '📞' },
    { label: 'EMAIL', value: member.email, emoji: '📧' },
    { label: 'DATE OF BIRTH', value: `${member.dob} (${member.age} 
  yrs)`, emoji: '🎂' },
    { label: 'MEMBER SINCE', value: member.joinDate, emoji: '📅' },
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
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <FadeInView delay={0}>
          <View style={styles.heroCard}>
            <View style={styles.avatarOuter}>
              <View style={styles.avatarInner}>
                <Text
  style={styles.avatarEmoji}>{member.avatar}</Text>
              </View>
            </View>
            <Text style={styles.memberName}>{member.name}</Text>   
            <Text style={styles.memberPlan}>{member.plan}</Text>   
            <View style={styles.expiryChip}>
              <Text
  style={styles.expiryNum}>{member.expiresIn}</Text>
              <Text style={styles.expiryLabel}> DAYS LEFT</Text>   
            </View>
          </View>
        </FadeInView>

        {/* Stats */}
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
            <Text style={styles.cardTitle}>PERSONAL INFO</Text>    
            {personalInfo.map((item, i) => (
              <View key={item.label} style={[styles.infoRow, i <personalInfo.length - 1 && styles.infoRowBorder]}>
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

        {/* Fitness Profile */}
        <FadeInView delay={240}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>FITNESS PROFILE</Text>  
            <View style={styles.fitnessGrid}>
              {[
                { emoji: '📏', val: '175', unit: 'cm', label:      
  'HEIGHT' },
                { emoji: '⚖️', val: '79.1', unit: 'kg', label:     
  'WEIGHT' },
                { emoji: '🎯', val: '22.6', unit: 'bmi', label:    
  'BMI' },
                { emoji: '🏆', val: 'Loss', unit: 'wt.', label:   'GOAL' },
              ].map(f => (
                <View key={f.label} style={styles.fitnessBox}>     
                  <Text
  style={styles.fitnessEmoji}>{f.emoji}</Text>
                  <View style={styles.fitnessValRow}>
                    <Text style={styles.fitnessVal}>{f.val}</Text> 
                    <Text
  style={styles.fitnessUnit}>{f.unit}</Text>
                  </View>
                  <Text
  style={styles.fitnessLabel}>{f.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </FadeInView>

        {/* Achievements */}
        <FadeInView delay={320}>
          <View style={styles.card}>
            <View style={styles.achieveHeader}>
              <Text style={styles.cardTitle}>ACHIEVEMENTS</Text>   
              <View style={styles.achieveBadge}>
                <Text
  style={styles.achieveBadgeNum}>{earnedCount}</Text>
                <Text
  style={styles.achieveBadgeOf}>/{achievements.length}</Text>      
              </View>
            </View>
            <View style={styles.achieveGrid}>
              {achievements.map(a => (
                <View
                  key={a.title}
                  style={[styles.achieveItem, !a.earned &&
  styles.achieveItemLocked]}
                >
                  <Text style={[styles.achieveEmoji, !a.earned && {
   opacity: 0.3 }]}>
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

        {/* Account Settings */}
        <FadeInView delay={400}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>ACCOUNT SETTINGS</Text> 
            {menuItems.map((item, i) => (
              <AnimatedPressable
                key={item.label}
                style={[styles.menuRow, i < menuItems.length - 1 &&
   styles.menuRowBorder]}
                scaleDown={0.97}
                onPress={() => Alert.alert(item.label, 'Coming   soon!')}
              >
                <View style={[styles.menuIcon, { backgroundColor:item.color + '18' }]}>
                  <MaterialCommunityIcons name={item.icon}
  size={18} color={item.color} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text> 
                <MaterialCommunityIcons name="chevron-right"       
  size={18} color={Colors.textMuted} />
              </AnimatedPressable>
            ))}
          </View>
        </FadeInView>

        {/* Logout */}
        <FadeInView delay={480}>
          <AnimatedPressable
            style={styles.logoutBtn}
            scaleDown={0.97}
            onPress={() =>
              Alert.alert('Log Out', 'Are you sure you want to log out?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Log Out', style: 'destructive' },
              ])
            }
          >
            <Text style={styles.logoutText}>LOG OUT</Text>
          </AnimatedPressable>
        </FadeInView>

        <Text style={styles.version}>GYMSETU v1.0.0</Text>
        <View style={{ height: 24 }} />
      </ScrollView>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    content: { padding: 16, gap: 12 },

    /* Hero */
    heroCard: {
      backgroundColor: Colors.bgCard, borderRadius: 20, padding:   
  24,
      alignItems: 'center', gap: 8, borderWidth: 1, borderColor:   
  Colors.accent + '30',
    },
    avatarOuter: {
      width: 92, height: 92, borderRadius: 46,
      borderWidth: 2, borderColor: Colors.accent,
      justifyContent: 'center', alignItems: 'center', marginBottom:
   4,
    },
    avatarInner: {
      width: 78, height: 78, borderRadius: 39,
      backgroundColor: Colors.bgElevated,
      justifyContent: 'center', alignItems: 'center',
    },
    avatarEmoji: { fontSize: 36 },
    memberName: { fontSize: 22, fontFamily: Fonts.condensedBold,   
  color: Colors.text, letterSpacing: 0.5 },
    memberPlan: { fontSize: 12, fontFamily: Fonts.regular, color:  
  Colors.textMuted },
    expiryChip: {
      flexDirection: 'row', alignItems: 'baseline',
      backgroundColor: Colors.accentMuted, borderRadius: 20,       
      paddingHorizontal: 14, paddingVertical: 5,
      borderWidth: 1, borderColor: Colors.accent + '30',
    },
    expiryNum: { fontSize: 18, fontFamily: Fonts.condensedBold,    
  color: Colors.accent },
    expiryLabel: { fontSize: 10, fontFamily: Fonts.bold, color:    
  Colors.accent, letterSpacing: 1 },

    /* Stats */
    statsRow: { flexDirection: 'row', gap: 8 },
    statBox: {
      flex: 1, alignItems: 'center', gap: 3,
      backgroundColor: Colors.bgCard, borderRadius: 12,
      paddingVertical: 12, borderWidth: 1, borderColor:
  Colors.border,
    },
    statEmoji: { fontSize: 16 },
    statVal: { fontSize: 20, fontFamily: Fonts.condensedBold,      
  color: Colors.text },
    statLabel: { fontSize: 8, fontFamily: Fonts.bold, color:       
  Colors.textMuted, letterSpacing: 1 },

    /* Card */
    card: { backgroundColor: Colors.bgCard, borderRadius: 16,      
  padding: 16, borderWidth: 1, borderColor: Colors.border, gap: 12 
  },
    cardTitle: { fontSize: 11, fontFamily: Fonts.bold, color:      
  Colors.accent, letterSpacing: 1.5 },

    /* Info */
    infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap:
   10, paddingVertical: 8 },
    infoRowBorder: { borderBottomWidth: 1, borderBottomColor:      
  Colors.border },
    infoEmoji: { fontSize: 16, marginTop: 12 },
    infoLabel: { fontSize: 9, fontFamily: Fonts.bold, color:       
  Colors.textMuted, letterSpacing: 1.3 },
    infoValue: { fontSize: 14, fontFamily: Fonts.medium, color:    
  Colors.text, marginTop: 2 },

    /* Fitness */
    fitnessGrid: { flexDirection: 'row', gap: 8 },
    fitnessBox: {
      flex: 1, alignItems: 'center', gap: 3,
      backgroundColor: Colors.bgElevated, borderRadius: 12,        
  paddingVertical: 12,
    },
    fitnessEmoji: { fontSize: 18 },
    fitnessValRow: { flexDirection: 'row', alignItems: 'baseline', 
  gap: 1 },
    fitnessVal: { fontSize: 16, fontFamily: Fonts.condensedBold,   
  color: Colors.text },
    fitnessUnit: { fontSize: 9, fontFamily: Fonts.bold, color:     
  Colors.textMuted },
    fitnessLabel: { fontSize: 8, fontFamily: Fonts.bold, color:    
  Colors.textMuted, letterSpacing: 1 },

    /* Achievements */
    achieveHeader: { flexDirection: 'row', justifyContent:
  'space-between', alignItems: 'center' },
    achieveBadge: {
      flexDirection: 'row', alignItems: 'baseline',
      backgroundColor: Colors.accentMuted, borderRadius: 8,        
      paddingHorizontal: 10, paddingVertical: 4,
      borderWidth: 1, borderColor: Colors.accent + '30',
    },
    achieveBadgeNum: { fontSize: 16, fontFamily:
  Fonts.condensedBold, color: Colors.accent },
    achieveBadgeOf: { fontSize: 11, fontFamily: Fonts.regular,     
  color: Colors.accent },
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
      borderColor: Colors.border, opacity: 0.45,
    },
    achieveEmoji: { fontSize: 24 },
    achieveTitle: { fontSize: 9, fontFamily: Fonts.bold, color:    
  Colors.text, textAlign: 'center', letterSpacing: 0.3 },
    achieveTitleLocked: { color: Colors.textMuted },
    achieveDesc: { fontSize: 8, fontFamily: Fonts.regular, color:  
  Colors.textMuted, textAlign: 'center', lineHeight: 12 },

    /* Settings */
    menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12,
   paddingVertical: 10 },
    menuRowBorder: { borderBottomWidth: 1, borderBottomColor:      
  Colors.border },
    menuIcon: { width: 36, height: 36, borderRadius: 10,
  justifyContent: 'center', alignItems: 'center' },
    menuLabel: { flex: 1, fontSize: 14, fontFamily: Fonts.medium,  
  color: Colors.text },

    /* Logout */
    logoutBtn: {
      alignItems: 'center', paddingVertical: 14, borderRadius: 12, 
      backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: 
  Colors.red + '40',
    },
    logoutText: { fontSize: 13, fontFamily: Fonts.bold, color:     
  Colors.red, letterSpacing: 1.5 },

    version: { textAlign: 'center', fontFamily: Fonts.bold, color: 
  Colors.textMuted, fontSize: 10, letterSpacing: 2, marginTop: 4 },
  });