import { View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert } from 'react-native';                   
  import { DrawerContentComponentProps } from
  '@react-navigation/drawer';
  import { useSafeAreaInsets } from                                  'react-native-safe-area-context';
  import { Colors } from '@/constants/colors';                       import { Fonts } from '@/constants/fonts';                       
                                                                   
  const menuItems = [                                              
    { name: 'home',          label: 'Dashboard',     icon: '⌂' },
    { name: 'my-members',    label: 'My Members',    icon: '◉' },  
    { name: 'schedule',      label: 'Schedule',      icon: '▦' },  
    { name: 'workout-plans', label: 'Workout Plans', icon: '▤' },  
    { name: 'attendance',    label: 'Attendance',    icon: '◈' },  
    { name: 'progress-log',  label: 'Progress Log',  icon: '◎' },  
    { name: 'profile',       label: 'My Profile',    icon: '○' },  
  ];

  const trainer = {
    name: 'Rajesh Kumar',
    role: 'STRENGTH & CONDITIONING',
    experience: '8 YRS',
    members: 12,
    sessionsToday: 4,
    rating: '4.9',
  };

  export default function TrainerDrawer({ state, navigation }:     
  DrawerContentComponentProps) {
    const insets = useSafeAreaInsets();
    const activeRouteName = state.routes[state.index].name;        

    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>

        {/* ── Header ─────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.glowRing}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>RK</Text>        
            </View>
          </View>

          <View style={styles.headerMeta}>
            <Text style={styles.trainerName}>{trainer.name}</Text> 
            <View style={styles.roleBadge}>
              <View style={styles.roleDot} />
              <Text style={styles.roleText}>{trainer.role}</Text>  
            </View>
            <Text style={styles.expText}>{trainer.experience}      
  EXPERIENCE</Text>
          </View>

          {/* Divider */}
          <View style={styles.headerDivider} />

          {/* Stats row */}
          <View style={styles.statsRow}>
            {[
              { val: trainer.members,      label: 'MEMBERS' },     
              { val: trainer.sessionsToday, label: 'TODAY' },      
              { val: trainer.rating + '★',  label: 'RATING' },     
            ].map((s, i) => (
              <View key={i} style={styles.statItem}>
                <Text style={styles.statVal}>{s.val}</Text>        
                <Text style={styles.statLabel}>{s.label}</Text>    
              </View>
            ))}
          </View>
        </View>

        {/* ── Menu ───────────────────────────────── */}
        <ScrollView
          style={styles.menuList}
          contentContainerStyle={styles.menuContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionLabel}>TRAINER PANEL</Text>   
          {menuItems.map(item => {
            const isActive = activeRouteName === item.name;        
            return (
              <TouchableOpacity
                key={item.name}
                style={[styles.menuItem, isActive &&
  styles.menuItemActive]}
                onPress={() => navigation.navigate(item.name)}     
                activeOpacity={0.75}
              >
                {isActive && <View style={styles.activeAccentBar}  
  />}
                <Text style={[styles.menuIcon, isActive &&
  styles.menuIconActive]}>
                  {item.icon}
                </Text>
                <Text style={[styles.menuLabel, isActive &&        
  styles.menuLabelActive]}>
                  {item.label}
                </Text>
                {isActive && <View style={styles.activeDot} />}    
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Footer ─────────────────────────────── */}
        <View style={[styles.footer, { paddingBottom: insets.bottom
   + 8 }]}>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.logoutBtn}
            activeOpacity={0.7}
            onPress={() =>
              Alert.alert('Log Out', 'Are you sure you want to log out?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Log Out', style: 'destructive' },
              ])
            }
          >
            <Text style={styles.logoutIcon}>⏻</Text>
            <Text style={styles.logoutText}>LOG OUT</Text>
          </TouchableOpacity>
          <Text style={styles.version}>GYMSETU  TRAINER
  v1.0</Text>
        </View>
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0F0C08' },

    // ── Header
    header: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 20,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
      gap: 12,
    },
    glowRing: {
      width: 72, height: 72, borderRadius: 36,
      backgroundColor: Colors.accentGlow,
      justifyContent: 'center', alignItems: 'center',
      alignSelf: 'flex-start',
    },
    avatarCircle: {
      width: 60, height: 60, borderRadius: 30,
      backgroundColor: Colors.accent,
      justifyContent: 'center', alignItems: 'center',
    },
    avatarInitials: {
      fontFamily: Fonts.condensedBold,
      fontSize: 22, color: '#FFF', letterSpacing: 1,
    },
    headerMeta: { gap: 3 },
    trainerName: {
      fontFamily: Fonts.bold,
      fontSize: 18, color: Colors.text,
    },
    roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 6
   },
    roleDot: {
      width: 6, height: 6, borderRadius: 3,
      backgroundColor: Colors.accent,
    },
    roleText: {
      fontFamily: Fonts.medium,
      fontSize: 10, color: Colors.accent, letterSpacing: 0.8,      
    },
    expText: {
      fontFamily: Fonts.medium,
      fontSize: 10, color: Colors.textMuted, letterSpacing: 0.6,   
    },

    headerDivider: {
      height: 1, backgroundColor: Colors.border,
    },

    statsRow: {
      flexDirection: 'row',
      backgroundColor: 'rgba(232, 80, 26, 0.08)',
      borderRadius: 12,
      paddingVertical: 10,
    },
    statItem: { flex: 1, alignItems: 'center', gap: 2 },
    statVal: {
      fontFamily: Fonts.condensedBold,
      fontSize: 18, color: Colors.text,
    },
    statLabel: {
      fontFamily: Fonts.medium,
      fontSize: 9, color: Colors.textMuted, letterSpacing: 0.8,    
    },

    // ── Menu
    menuList: { flex: 1 },
    menuContent: { paddingVertical: 12, paddingHorizontal: 12, gap:
   2 },
    sectionLabel: {
      fontFamily: Fonts.medium,
      fontSize: 9, color: Colors.textMuted,
      letterSpacing: 1.2, paddingHorizontal: 10, marginBottom: 4,  
    },
    menuItem: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingHorizontal: 14, paddingVertical: 12,
      borderRadius: 10, position: 'relative', overflow: 'hidden',  
    },
    menuItemActive: { backgroundColor: 'rgba(232, 80, 26, 0.10)' },
    activeAccentBar: {
      position: 'absolute', left: 0, top: 6, bottom: 6,
      width: 3, borderRadius: 2, backgroundColor: Colors.accent,   
    },
    menuIcon: { fontSize: 16, width: 24, textAlign: 'center',      
  color: Colors.textMuted },
    menuIconActive: { color: Colors.accent },
    menuLabel: {
      flex: 1,
      fontFamily: Fonts.medium,
      fontSize: 14, color: Colors.textMuted,
    },
    menuLabelActive: {
      fontFamily: Fonts.bold,
      color: Colors.text,
    },
    activeDot: {
      width: 5, height: 5, borderRadius: 3,
      backgroundColor: Colors.accent,
    },

    // ── Footer
    divider: { height: 1, backgroundColor: Colors.border,
  marginBottom: 8 },
    footer: { paddingHorizontal: 16, paddingTop: 8, gap: 6 },      
    logoutBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      paddingHorizontal: 14, paddingVertical: 11, borderRadius: 10,
    },
    logoutIcon: { fontSize: 16, color: Colors.red },
    logoutText: {
      fontFamily: Fonts.bold,
      fontSize: 12, color: Colors.red, letterSpacing: 0.8,
    },
    version: {
      fontFamily: Fonts.medium,
      fontSize: 9, color: Colors.textMuted,
      textAlign: 'center', letterSpacing: 1.5, paddingTop: 2,      
    },
  });
