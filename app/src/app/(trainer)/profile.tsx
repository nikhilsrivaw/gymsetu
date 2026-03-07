 import { useState } from 'react';                                                    import { View, Text, StyleSheet, ScrollView, Switch, Alert } from 'react-native';    import { Stack, useRouter } from 'expo-router';                                      import { Colors } from '@/constants/colors';                                         import { Fonts } from '@/constants/fonts';                                           import AnimatedPressable from '@/components/AnimatedPressable';                      import FadeInView from '@/components/FadeInView';                                    import { useAuthStore } from '@/store/authStore';                                  
                                                                                       const achievements = [                                                             
    { emoji: '🏆', label: 'Top Trainer',      desc: 'Q1 2026'    },                      { emoji: '💯', label: '100% Retention',   desc: '6 months'   },                  
    { emoji: '🔥', label: '1000+ Sessions',   desc: 'Milestone'  },                  
    { emoji: '⭐', label: 'Member Favourite', desc: '3× awarded' },                  
  ];

  const certifications = ['ISSA Certified PT', 'Nutrition Coach', 'CrossFit L2'];    

  const accountItems = [
    { emoji: '✏️', label: 'Edit Profile',    action: () => Alert.alert('Edit Profile',    'Coming soon!') },
    { emoji: '🔒', label: 'Change Password', action: () => Alert.alert('Change   Password', 'Coming soon!') },
    { emoji: '📋', label: 'View Contract',   action: () => Alert.alert('Contract',   
       'Your employment contract is active.') },
    { emoji: '🆘', label: 'Support',         action: () => Alert.alert('Support',    
       'Contact admin@gymsetu.in') },
  ];

  export default function TrainerProfileScreen() {
    const router          = useRouter();
    const { profile, session, signOut } = useAuthStore();

    const [notifications,    setNotifications]    = useState(true);
    const [sessionReminders, setSessionReminders] = useState(true);
    const [progressAlerts,   setProgressAlerts]   = useState(false);

    const toggleItems = [
      { label: 'Push Notifications', desc: 'New messages & alerts',    value:        
  notifications,    setter: setNotifications    },
      { label: 'Session Reminders',  desc: '15 min before class',      value:        
  sessionReminders, setter: setSessionReminders },
      { label: 'Progress Alerts',    desc: 'Member milestone updates', value:        
  progressAlerts,   setter: setProgressAlerts   },
    ];

    const name     = profile?.full_name ?? 'Trainer';
    const email    = session?.user?.email ?? '—';
    const initials = name.split(' ').map(n => n[0]).join('').slice(0,
  2).toUpperCase();

    const handleLogout = () => {
      Alert.alert('Log Out', 'Are you sure you want to log out?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: async () => {
          await signOut();
          router.replace('/');
        }},
      ]);
    };

    return (
      <>
        <Stack.Screen options={{ title: '👤 My Profile' }} />
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
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
                <View style={styles.onlineDot} />
              </View>
              <Text style={styles.trainerName}>{name}</Text>
              <Text style={styles.trainerRole}>Fitness Trainer</Text>
              <View style={styles.specBadge}>
                <Text style={styles.specText}>STRENGTH & CONDITIONING</Text>
              </View>
            </View>
          </FadeInView>

          {/* Stats */}
          <FadeInView delay={60}>
            <View style={styles.statsGrid}>
              {[
                { emoji: '👥', val: '—',   label: 'MEMBERS'       },
                { emoji: '🏋️', val: '—',   label: 'THIS MONTH'    },
                { emoji: '📊', val: '—',   label: 'TOTAL SESSIONS'},
                { emoji: '⭐', val: '4.9', label: 'RATING'        },
              ].map(s => (
                <View key={s.label} style={styles.statBox}>
                  <Text style={styles.statEmoji}>{s.emoji}</Text>
                  <Text style={styles.statVal}>{s.val}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
          </FadeInView>

          {/* Contact Info */}
          <FadeInView delay={110}>
            <Text style={styles.sectionLabel}>CONTACT INFO</Text>
            <View style={styles.card}>
              {[
                { icon: '📧', label: 'EMAIL', val: email },
                { icon: '📱', label: 'PHONE', val: profile?.phone ?? '—' },
              ].map((row, i) => (
                <View key={row.label} style={[styles.infoRow, i === 0 &&
  styles.infoRowBorder]}>
                  <Text style={styles.infoIcon}>{row.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.infoLabel}>{row.label}</Text>
                    <Text style={styles.infoVal}>{row.val}</Text>
                  </View>
                </View>
              ))}
            </View>
          </FadeInView>

          {/* Certifications */}
          <FadeInView delay={160}>
            <Text style={styles.sectionLabel}>CERTIFICATIONS</Text>
            <View style={styles.card}>
              {certifications.map((cert, i) => (
                <View key={cert} style={[styles.certRow, i < certifications.length - 
  1 && styles.certRowBorder]}>
                  <View style={styles.certDot} />
                  <Text style={styles.certText}>{cert}</Text>
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedText}>✓ VERIFIED</Text>
                  </View>
                </View>
              ))}
            </View>
          </FadeInView>

          {/* Achievements */}
          <FadeInView delay={200}>
            <Text style={styles.sectionLabel}>ACHIEVEMENTS</Text>
            <View style={styles.achieveGrid}>
              {achievements.map(a => (
                <View key={a.label} style={styles.achieveCard}>
                  <Text style={styles.achieveEmoji}>{a.emoji}</Text>
                  <Text style={styles.achieveLabel}>{a.label}</Text>
                  <Text style={styles.achieveDesc}>{a.desc}</Text>
                </View>
              ))}
            </View>
          </FadeInView>

          {/* Notifications */}
          <FadeInView delay={250}>
            <Text style={styles.sectionLabel}>NOTIFICATIONS</Text>
            <View style={styles.card}>
              {toggleItems.map((item, i) => (
                <View key={item.label} style={[styles.toggleRow, i <
  toggleItems.length - 1 && styles.toggleRowBorder]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.toggleLabel}>{item.label}</Text>
                    <Text style={styles.toggleDesc}>{item.desc}</Text>
                  </View>
                  <Switch
                    value={item.value}
                    onValueChange={item.setter}
                    trackColor={{ false: Colors.border, true: Colors.accent + '60' }}
                    thumbColor={item.value ? Colors.accent : Colors.textMuted}       
                  />
                </View>
              ))}
            </View>
          </FadeInView>

          {/* Account */}
          <FadeInView delay={300}>
            <Text style={styles.sectionLabel}>ACCOUNT</Text>
            <View style={styles.card}>
              {accountItems.map((item, i) => (
                <View key={item.label}>
                  <AnimatedPressable style={styles.menuRow} onPress={item.action}    
  scaleDown={0.97}>
                    <Text style={styles.menuEmoji}>{item.emoji}</Text>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                    <Text style={styles.menuArrow}>›</Text>
                  </AnimatedPressable>
                  {i < accountItems.length - 1 && <View style={styles.divider} />}   
                </View>
              ))}
            </View>
          </FadeInView>

          {/* Logout */}
          <FadeInView delay={360}>
            <AnimatedPressable style={styles.logoutBtn} scaleDown={0.97}
  onPress={handleLogout}>
              <Text style={styles.logoutText}>LOG OUT</Text>
            </AnimatedPressable>
          </FadeInView>

          <Text style={styles.version}>GYMSETU v1.0.0</Text>
          <View style={{ height: 32 }} />
        </ScrollView>
      </>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    content:   { padding: 16, gap: 12 },

    heroCard:    { backgroundColor: Colors.bgCard, borderRadius: 20, padding: 24,    
  alignItems: 'center', gap: 8, borderWidth: 1, borderColor: Colors.accent + '30' }, 
    avatarOuter: { position: 'relative', marginBottom: 4 },
    avatarInner: { width: 84, height: 84, borderRadius: 42, backgroundColor:
  Colors.bgElevated, borderWidth: 2, borderColor: Colors.accent, justifyContent:     
  'center', alignItems: 'center' },
    avatarText:  { fontSize: 30, fontFamily: Fonts.condensedBold, color:
  Colors.accent },
    onlineDot:   { position: 'absolute', bottom: 3, right: 3, width: 16, height: 16, 
  borderRadius: 8, backgroundColor: Colors.green, borderWidth: 2, borderColor:       
  Colors.bgCard },
    trainerName: { fontSize: 22, fontFamily: Fonts.condensedBold, color: Colors.text,
   letterSpacing: 0.5 },
    trainerRole: { fontSize: 12, fontFamily: Fonts.regular,       color:
  Colors.textMuted },
    specBadge:   { backgroundColor: Colors.accentMuted, borderRadius: 20,
  paddingHorizontal: 14, paddingVertical: 5, borderWidth: 1, borderColor:
  Colors.accent + '40' },
    specText:    { fontSize: 10, fontFamily: Fonts.bold, color: Colors.accent,       
  letterSpacing: 1.2 },

    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    statBox:   { flex: 1, minWidth: '45%', backgroundColor: Colors.bgCard,
  borderRadius: 14, padding: 14, alignItems: 'center', gap: 4, borderWidth: 1,       
  borderColor: Colors.border },
    statEmoji: { fontSize: 20 },
    statVal:   { fontSize: 22, fontFamily: Fonts.condensedBold, color: Colors.text },
    statLabel: { fontSize: 8, fontFamily: Fonts.bold, color: Colors.textMuted,       
  textAlign: 'center', letterSpacing: 1 },

    sectionLabel: { fontSize: 10, fontFamily: Fonts.bold, color: Colors.accent,      
  letterSpacing: 1.8, marginTop: 4 },

    card:    { backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 1,     
  borderColor: Colors.border, overflow: 'hidden' },
    divider: { height: 1, backgroundColor: Colors.border, marginHorizontal: 14 },    

    infoRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14
   },
    infoRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },       
    infoIcon:      { fontSize: 18, width: 26, textAlign: 'center' },
    infoLabel:     { fontSize: 9,  fontFamily: Fonts.bold,   color: Colors.textMuted,
   letterSpacing: 1.2 },
    infoVal:       { fontSize: 14, fontFamily: Fonts.medium, color: Colors.text,     
  marginTop: 2 },

    certRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14
   },
    certRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },       
    certDot:       { width: 7, height: 7, borderRadius: 4, backgroundColor:
  Colors.accent },
    certText:      { flex: 1, fontSize: 14, fontFamily: Fonts.medium, color:
  Colors.text },
    verifiedBadge: { backgroundColor: Colors.green + '18', borderRadius: 6,
  paddingHorizontal: 7, paddingVertical: 3 },
    verifiedText:  { fontSize: 9, fontFamily: Fonts.bold, color: Colors.green,       
  letterSpacing: 0.8 },

    achieveGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    achieveCard: { flex: 1, minWidth: '44%', backgroundColor: Colors.bgCard,
  borderRadius: 14, padding: 14, alignItems: 'center', gap: 4, borderWidth: 1,       
  borderColor: Colors.border },
    achieveEmoji:{ fontSize: 26 },
    achieveLabel:{ fontSize: 12, fontFamily: Fonts.bold,    color: Colors.text,      
   textAlign: 'center' },
    achieveDesc: { fontSize: 10, fontFamily: Fonts.regular, color: Colors.textMuted  
  },

    toggleRow:       { flexDirection: 'row', alignItems: 'center', padding: 14 },    
    toggleRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },     
    toggleLabel:     { fontSize: 14, fontFamily: Fonts.bold,    color: Colors.text },
    toggleDesc:      { fontSize: 11, fontFamily: Fonts.regular, color:
  Colors.textMuted, marginTop: 2 },

    menuRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }, 
    menuEmoji: { fontSize: 17, width: 26, textAlign: 'center' },
    menuLabel: { flex: 1, fontSize: 14, fontFamily: Fonts.medium, color: Colors.text 
  },
    menuArrow: { fontSize: 20, color: Colors.textMuted },

    logoutBtn:  { alignItems: 'center', paddingVertical: 14, borderRadius: 14,       
  backgroundColor: Colors.red + '12', borderWidth: 1, borderColor: Colors.red + '40' 
  },
    logoutText: { fontSize: 13, fontFamily: Fonts.bold, color: Colors.red,
  letterSpacing: 1.5 },

    version: { textAlign: 'center', fontFamily: Fonts.bold, color: Colors.textMuted, 
  fontSize: 10, letterSpacing: 2, marginTop: 4 },
  });
