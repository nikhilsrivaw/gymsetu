import { useState } from 'react';
  import { View, Text, StyleSheet, ScrollView, Switch, Alert } from
   'react-native';
  import { Stack, router } from 'expo-router';
  import { Colors } from '@/constants/colors';
  import AnimatedPressable from '@/components/AnimatedPressable';  
  import FadeInView from '@/components/FadeInView';

  const trainer = {
    name: 'Arjun Mehta',
    role: 'Senior Fitness Trainer',
    email: 'arjun.mehta@gymsetu.in',
    phone: '+91 98765 43210',
    experience: '6 Years',
    specialization: 'Strength & Conditioning',
    certifications: ['ISSA Certified PT', 'Nutrition Coach',       
  'CrossFit L2'],
    joinDate: 'March 2019',
    rating: 4.9,
    totalReviews: 134,
    activeMembers: 18,
    sessionsThisMonth: 62,
    totalSessions: 1480,
  };

  const stats = [
    { label: 'Active Members', value: '18', emoji: '👥' },
    { label: 'Sessions / Month', value: '62', emoji: '🏋️' },       
    { label: 'Total Sessions', value: '1,480', emoji: '📊' },      
    { label: 'Rating', value: '4.9★', emoji: '⭐' },
  ];

  const achievements = [
    { emoji: '🏆', label: 'Top Trainer', desc: 'Q1 2026' },        
    { emoji: '💯', label: '100% Retention', desc: '6 months' },    
    { emoji: '🔥', label: '1000+ Sessions', desc: 'Milestone' },   
    { emoji: '⭐', label: 'Member Fav', desc: '3× awarded' },      
  ];

  export default function TrainerProfileScreen() {
    const [notifications, setNotifications] = useState(true);      
    const [sessionReminders, setSessionReminders] = useState(true);
    const [progressAlerts, setProgressAlerts] = useState(false);   

    return (
      <>
        <Stack.Screen options={{ title: '👤 My Profile' }} />      
        <ScrollView style={styles.container}
  contentContainerStyle={styles.content}
  showsVerticalScrollIndicator={false}>

          {/* Profile Header */}
          <FadeInView delay={0}>
            <View style={styles.profileCard}>
              <View style={styles.avatarWrap}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>AM</Text>        
                </View>
                <View style={styles.onlineDot} />
              </View>
              <Text style={styles.name}>{trainer.name}</Text>      
              <Text style={styles.role}>{trainer.role}</Text>      
              <View style={styles.specBadge}>
                <Text style={styles.specText}>💪
  {trainer.specialization}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.meta}>📅 Since
  {trainer.joinDate}</Text>
                <Text style={styles.metaDot}>•</Text>
                <Text style={styles.meta}>🎯 {trainer.experience}  
  Exp</Text>
              </View>
            </View>
          </FadeInView>

          {/* Stats Grid */}
          <FadeInView delay={60}>
            <View style={styles.statsGrid}>
              {stats.map((s) => (
                <View key={s.label} style={styles.statBox}>        
                  <Text style={styles.statEmoji}>{s.emoji}</Text>  
                  <Text style={styles.statValue}>{s.value}</Text>  
                  <Text style={styles.statLabel}>{s.label}</Text>  
                </View>
              ))}
            </View>
          </FadeInView>

          {/* Contact Info */}
          <FadeInView delay={120}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contact Info</Text>
              <View style={styles.card}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoIcon}>📧</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.infoLabel}>Email</Text>    
                    <Text
  style={styles.infoValue}>{trainer.email}</Text>
                  </View>
                </View>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <Text style={styles.infoIcon}>📱</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.infoLabel}>Phone</Text>    
                    <Text
  style={styles.infoValue}>{trainer.phone}</Text>
                  </View>
                </View>
              </View>
            </View>
          </FadeInView>

          {/* Certifications */}
          <FadeInView delay={160}>
            <View style={styles.section}>
              <Text
  style={styles.sectionTitle}>Certifications</Text>
              <View style={styles.card}>
                {trainer.certifications.map((cert, i) => (
                  <View key={cert}>
                    <View style={styles.certRow}>
                      <View style={styles.certDot} />
                      <Text style={styles.certText}>{cert}</Text>  
                      <Text style={styles.certBadge}>✓
  Verified</Text>
                    </View>
                    {i < trainer.certifications.length - 1 && <View
   style={styles.divider} />}
                  </View>
                ))}
              </View>
            </View>
          </FadeInView>

          {/* Achievements */}
          <FadeInView delay={200}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Achievements</Text>
              <View style={styles.achieveGrid}>
                {achievements.map((a) => (
                  <View key={a.label} style={styles.achieveCard}>  
                    <Text
  style={styles.achieveEmoji}>{a.emoji}</Text>
                    <Text
  style={styles.achieveLabel}>{a.label}</Text>
                    <Text
  style={styles.achieveDesc}>{a.desc}</Text>
                  </View>
                ))}
              </View>
            </View>
          </FadeInView>

          {/* Notifications */}
          <FadeInView delay={240}>
            <View style={styles.section}>
              <Text
  style={styles.sectionTitle}>Notifications</Text>
              <View style={styles.card}>
                {[
                  { label: 'Push Notifications', desc: 'New   messages & alerts', value: notifications, setter:
  setNotifications },
                  { label: 'Session Reminders', desc: '15 min  before class', value: sessionReminders, setter:
  setSessionReminders },
                  { label: 'Progress Alerts', desc: 'Member milestone updates', value: progressAlerts, setter:
  setProgressAlerts },
                ].map((item, i, arr) => (
                  <View key={item.label}>
                    <View style={styles.toggleRow}>
                      <View style={{ flex: 1 }}>
                        <Text
  style={styles.toggleLabel}>{item.label}</Text>
                        <Text
  style={styles.toggleDesc}>{item.desc}</Text>
                      </View>
                      <Switch
                        value={item.value}
                        onValueChange={item.setter}
                        trackColor={{ false: Colors.border, true:  
  Colors.green + '60' }}
                        thumbColor={item.value ? Colors.green :    
  Colors.textMuted}
                      />
                    </View>
                    {i < arr.length - 1 && <View
  style={styles.divider} />}
                  </View>
                ))}
              </View>
            </View>
          </FadeInView>

          {/* Actions */}
          <FadeInView delay={280}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Account</Text>     
              <View style={styles.card}>
                {[
                  { emoji: '✏️', label: 'Edit Profile', action: () => Alert.alert('Edit Profile', 'Coming soon!') },
                  { emoji: '🔒', label: 'Change Password', action: 
  () => Alert.alert('Change Password', 'Coming soon!') },
                  { emoji: '📋', label: 'View Contract', action: ()=> Alert.alert('Contract', 'Your employment contract is active.') },
                  { emoji: '🆘', label: 'Support', action: () => Alert.alert('Support', 'Contact admin@gymsetu.in') },
                ].map((item, i, arr) => (
                  <View key={item.label}>
                    <AnimatedPressable style={styles.menuRow}      
  onPress={item.action} scaleDown={0.97}>
                      <Text
  style={styles.menuEmoji}>{item.emoji}</Text>
                      <Text
  style={styles.menuLabel}>{item.label}</Text>
                      <Text style={styles.menuArrow}>›</Text>      
                    </AnimatedPressable>
                    {i < arr.length - 1 && <View
  style={styles.divider} />}
                  </View>
                ))}
              </View>
            </View>
          </FadeInView>

          {/* Logout */}
          <FadeInView delay={320}>
            <AnimatedPressable
              style={styles.logoutBtn}
              scaleDown={0.97}
              onPress={() => Alert.alert('Logout', 'Are you sure  you want to logout?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Logout', style: 'destructive', onPress: () => router.replace('/') },
              ])}
            >
              <Text style={styles.logoutText}>🚪 Logout</Text>     
            </AnimatedPressable>
          </FadeInView>

          <View style={{ height: 40 }} />
        </ScrollView>
      </>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    content: { paddingHorizontal: 16, paddingTop: 20, gap: 16 },   

    profileCard: {
      backgroundColor: Colors.bgCard, borderRadius: 20, padding:   
  24,
      alignItems: 'center', borderWidth: 1, borderColor:
  Colors.border,
    },
    avatarWrap: { position: 'relative', marginBottom: 14 },        
    avatar: {
      width: 80, height: 80, borderRadius: 40,
      backgroundColor: Colors.green + '20', borderWidth: 2,        
  borderColor: Colors.green,
      justifyContent: 'center', alignItems: 'center',
    },
    avatarText: { fontSize: 28, fontWeight: '700', color:
  Colors.green },
    onlineDot: {
      position: 'absolute', bottom: 2, right: 2,
      width: 16, height: 16, borderRadius: 8,
      backgroundColor: Colors.green, borderWidth: 2, borderColor:  
  Colors.bgCard,
    },
    name: { fontSize: 22, fontWeight: '800', color: Colors.text,   
  marginBottom: 4 },
    role: { fontSize: 13, color: Colors.textMuted, marginBottom: 10
   },
    specBadge: {
      backgroundColor: Colors.green + '15', borderRadius: 20,      
      paddingHorizontal: 14, paddingVertical: 6, marginBottom: 12, 
    },
    specText: { fontSize: 13, fontWeight: '600', color:
  Colors.green },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8  
  },
    meta: { fontSize: 12, color: Colors.textMuted },
    metaDot: { color: Colors.border, fontSize: 12 },

    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    statBox: {
      flex: 1, minWidth: '45%', backgroundColor: Colors.bgCard,    
      borderRadius: 14, padding: 14, alignItems: 'center',
      borderWidth: 1, borderColor: Colors.border,
    },
    statEmoji: { fontSize: 22, marginBottom: 6 },
    statValue: { fontSize: 20, fontWeight: '800', color:
  Colors.text },
    statLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 
  2, textAlign: 'center' },

    section: { gap: 8 },
    sectionTitle: { fontSize: 13, fontWeight: '700', color:        
  Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8,
   marginLeft: 4 },
    card: { backgroundColor: Colors.bgCard, borderRadius: 16,      
  borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
    divider: { height: 1, backgroundColor: Colors.border,
  marginHorizontal: 16 },

    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12,
   padding: 14 },
    infoIcon: { fontSize: 20, width: 28, textAlign: 'center' },    
    infoLabel: { fontSize: 11, color: Colors.textMuted,
  marginBottom: 2 },
    infoValue: { fontSize: 14, fontWeight: '600', color:
  Colors.text },

    certRow: { flexDirection: 'row', alignItems: 'center', gap: 12,
   padding: 14 },
    certDot: { width: 8, height: 8, borderRadius: 4,
  backgroundColor: Colors.green },
    certText: { flex: 1, fontSize: 14, fontWeight: '600', color:   
  Colors.text },
    certBadge: { fontSize: 11, color: Colors.green, fontWeight:    
  '700' },

    achieveGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 
  },
    achieveCard: {
      flex: 1, minWidth: '44%', backgroundColor: Colors.bgCard,    
      borderRadius: 14, padding: 14, alignItems: 'center',
      borderWidth: 1, borderColor: Colors.border,
    },
    achieveEmoji: { fontSize: 26, marginBottom: 6 },
    achieveLabel: { fontSize: 12, fontWeight: '700', color:        
  Colors.text, textAlign: 'center' },
    achieveDesc: { fontSize: 11, color: Colors.textMuted,
  marginTop: 2 },

    toggleRow: { flexDirection: 'row', alignItems: 'center',       
  padding: 14 },
    toggleLabel: { fontSize: 14, fontWeight: '600', color:
  Colors.text },
    toggleDesc: { fontSize: 12, color: Colors.textMuted, marginTop:
   2 },

    menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12,
   padding: 14 },
    menuEmoji: { fontSize: 18, width: 28, textAlign: 'center' },   
    menuLabel: { flex: 1, fontSize: 14, fontWeight: '600', color:  
  Colors.text },
    menuArrow: { fontSize: 20, color: Colors.textMuted },

    logoutBtn: {
      backgroundColor: Colors.red + '15', borderRadius: 16,        
  padding: 16,
      alignItems: 'center', borderWidth: 1, borderColor: Colors.red
   + '40',
    },
    logoutText: { fontSize: 15, fontWeight: '700', color:
  Colors.red },
  });