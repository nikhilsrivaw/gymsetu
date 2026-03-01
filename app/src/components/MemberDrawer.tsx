 import { View, Text, StyleSheet, ScrollView, TouchableOpacity,   
  Alert } from 'react-native';
  import { DrawerContentComponentProps } from
  '@react-navigation/drawer';
  import { useSafeAreaInsets } from
  'react-native-safe-area-context';
  import { Colors } from '@/constants/colors';

  const menuItems = [
    { name: 'home',         label: 'Home',          emoji: '🏠' }, 
    { name: 'fitness',      label: 'Fitness',        emoji: '⚡' },
    { name: 'schedule',     label: 'Classes',        emoji: '📅' },
    { name: 'my-payments',  label: 'My Payments',    emoji: '💳' },
    { name: 'my-plan',      label: 'My Plan',        emoji: '📋' },
    { name: 'gym-info',     label: 'Gym Info',       emoji: '🏢' },
    { name: 'feedback',     label: 'Feedback',       emoji: '⭐' },
    { name: 'refer-friend', label: 'Refer a Friend', emoji: '🎁' },
    { name: 'profile',      label: 'Profile',        emoji: '👤' },
  ];

  export default function MemberDrawer({ state, navigation }:      
  DrawerContentComponentProps) {
    const insets = useSafeAreaInsets();
    const activeRouteName = state.routes[state.index].name;        

    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>

        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatarRing}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarEmoji}>🧑‍💼</Text>        
            </View>
          </View>
          <Text style={styles.memberName}>Rahul Mehta</Text>       
          <Text style={styles.memberPlan}>👑 Premium 3
  Months</Text>
          <View style={styles.expiryChip}>
            <Text style={styles.expiryText}>⏳ 18 days left</Text> 
          </View>

          {/* Quick Stats */}
          <View style={styles.quickStats}>
            <View style={styles.quickStat}>
              <Text style={styles.quickStatVal}>14</Text>
              <Text style={styles.quickStatLabel}>Visits</Text>    
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStat}>
              <Text style={styles.quickStatVal}>🔥 5</Text>        
              <Text style={styles.quickStatLabel}>Streak</Text>    
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStat}>
              <Text style={styles.quickStatVal}>3rd</Text>
              <Text style={styles.quickStatLabel}>Rank</Text>      
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <ScrollView
          style={styles.menuList}
          contentContainerStyle={styles.menuContent}
          showsVerticalScrollIndicator={false}
        >
          {menuItems.map(item => {
            const isActive = activeRouteName === item.name;        
            return (
              <TouchableOpacity
                key={item.name}
                style={[styles.menuItem, isActive &&
  styles.menuItemActive]}
                onPress={() => navigation.navigate(item.name)}     
                activeOpacity={0.7}
              >
                <Text style={styles.menuEmoji}>{item.emoji}</Text> 
                <Text style={[styles.menuLabel, isActive &&        
  styles.menuLabelActive]}>
                  {item.label}
                </Text>
                {isActive && <View style={styles.activeBar} />}    
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: insets.bottom
   + 8 }]}>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.logoutBtn}
            activeOpacity={0.7}
            onPress={() =>
              Alert.alert('Log Out', 'Are you sure?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Log Out', style: 'destructive' },
              ])
            }
          >
            <Text style={styles.logoutEmoji}>🚪</Text>
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
          <Text style={styles.version}>💪 GymSetu v1.0.0</Text>    
        </View>
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bgCard },        

    header: {
      backgroundColor: Colors.accent,
      padding: 20,
      alignItems: 'center',
      gap: 6,
      paddingBottom: 20,
    },
    avatarRing: {
      width: 80, height: 80, borderRadius: 40,
      borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)',        
      justifyContent: 'center', alignItems: 'center', marginBottom:
   4,
    },
    avatarCircle: {
      width: 68, height: 68, borderRadius: 34,
      backgroundColor: 'rgba(255,255,255,0.2)',
      justifyContent: 'center', alignItems: 'center',
    },
    avatarEmoji: { fontSize: 32 },
    memberName: { fontSize: 18, fontWeight: '700', color: '#FFF' },
    memberPlan: { fontSize: 12, color: 'rgba(255,255,255,0.85)' }, 
    expiryChip: {
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4, 
    },
    expiryText: { fontSize: 11, color: '#FFF', fontWeight: '600' },

    quickStats: {
      flexDirection: 'row', marginTop: 8,
      backgroundColor: 'rgba(255,255,255,0.15)',
      borderRadius: 12, paddingVertical: 10, paddingHorizontal: 20,
      gap: 16,
    },
    quickStat: { alignItems: 'center', gap: 2 },
    quickStatVal: { fontSize: 15, fontWeight: '700', color: '#FFF' 
  },
    quickStatLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)' 
  },
    quickStatDivider: { width: 1, backgroundColor:
  'rgba(255,255,255,0.3)' },

    menuList: { flex: 1 },
    menuContent: { paddingVertical: 8, paddingHorizontal: 10 },    
    menuItem: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      paddingHorizontal: 14, paddingVertical: 13,
      borderRadius: 12, marginVertical: 1,
      position: 'relative',
    },
    menuItemActive: { backgroundColor: Colors.accentMuted },       
    menuEmoji: { fontSize: 20, width: 26, textAlign: 'center' },   
    menuLabel: { flex: 1, fontSize: 15, fontWeight: '500', color:  
  Colors.textSub },
    menuLabelActive: { color: Colors.accent, fontWeight: '700' },  
    activeBar: {
      position: 'absolute', right: 10,
      width: 4, height: 22, borderRadius: 2,
      backgroundColor: Colors.accent,
    },

    divider: { height: 1, backgroundColor: Colors.border,
  marginBottom: 8 },
    footer: { paddingHorizontal: 16, paddingTop: 8, gap: 4 },      
    logoutBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10,
    },
    logoutEmoji: { fontSize: 18 },
    logoutText: { fontSize: 14, fontWeight: '600', color:
  Colors.red },
    version: { textAlign: 'center', fontSize: 11, color:
  Colors.textMuted, paddingTop: 4 },
  });
