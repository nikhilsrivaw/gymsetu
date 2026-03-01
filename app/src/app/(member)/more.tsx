 import { View, Text, StyleSheet, ScrollView } from                 'react-native';                                                    import { useRouter } from 'expo-router';                           import { MaterialCommunityIcons } from '@expo/vector-icons';     
  import { Colors } from '@/constants/colors';                       import { Fonts } from '@/constants/fonts';                       
  import AnimatedPressable from '@/components/AnimatedPressable';    import FadeInView from '@/components/FadeInView';                
                                                                     type IconName = React.ComponentProps<typeof                        MaterialCommunityIcons>['name'];                                 
                                                                   
  const menuItems: {
    label: string;
    desc: string;
    emoji: string;
    icon: IconName;
    color: string;
    route: string;
  }[] = [
    { label: 'My Payments', desc: 'Payment history & receipts',    
  emoji: '💳', icon: 'credit-card-outline', color: Colors.accent,  
  route: '/(member)/my-payments' },
    { label: 'My Plan', desc: 'Current plan & all available plans',
   emoji: '📋', icon: 'clipboard-list-outline', color:
  Colors.green, route: '/(member)/my-plan' },
    { label: 'Gym Info', desc: 'Timings, contact & amenities',     
  emoji: '🏢', icon: 'domain', color: Colors.orange, route:        
  '/(member)/gym-info' },
    { label: 'Give Feedback', desc: 'Rate your gym experience', emoji: '⭐', icon: 'star-outline', color: '#F59E0B', route: '/(member)/feedback' },
    { label: 'BMI Calculator', desc: 'Check your body mass index', emoji: '⚖️', icon: 'scale-bathroom', color: '#3B82F6', route: '/(member)/bmi-calculator' },
  ];

  const stats = [
    { label: 'VISITED', val: '14', unit: 'days', emoji: '📅' },    
    { label: 'STREAK', val: '5', unit: 'days', emoji: '🔥' },      
    { label: 'DUE', val: '₹0', unit: 'balance', emoji: '💰' },     
    { label: 'RANK', val: '3rd', unit: 'place', emoji: '🏆' },     
  ];

  const member = {
    name: 'Rahul Mehta',
    plan: 'Premium 3 Months',
    expiresIn: 18,
    avatar: '🧑‍💼',
  };

  export default function MoreScreen() {
    const router = useRouter();

    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Member Card */}
        <FadeInView delay={0}>
          <View style={styles.memberCard}>
            <View style={styles.memberAccentBar} />
            <View style={styles.memberInner}>
              <View style={styles.avatarRing}>
                <Text
  style={styles.avatarEmoji}>{member.avatar}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text
  style={styles.memberName}>{member.name}</Text>
                <Text
  style={styles.memberPlan}>{member.plan}</Text>
              </View>
              <View style={styles.expiryBox}>
                <Text
  style={styles.expiryVal}>{member.expiresIn}</Text>
                <Text
  style={styles.expiryLabel}>DAYS{'\n'}LEFT</Text>
              </View>
            </View>
          </View>
        </FadeInView>

        {/* Quick Stats */}
        <FadeInView delay={80}>
          <View style={styles.statsRow}>
            {stats.map(s => (
              <View key={s.label} style={styles.statBox}>
                <Text style={styles.statEmoji}>{s.emoji}</Text>    
                <Text style={styles.statVal}>{s.val}</Text>        
                <Text style={styles.statLabel}>{s.label}</Text>    
              </View>
            ))}
          </View>
        </FadeInView>

        {/* Section Label */}
        <FadeInView delay={110}>
          <Text style={styles.sectionLabel}>OPTIONS</Text>
        </FadeInView>

        {/* Menu Items */}
        {menuItems.map((item, i) => (
          <FadeInView key={item.label} delay={140 + i * 50}>       
            <AnimatedPressable
              style={styles.menuRow}
              scaleDown={0.97}
              onPress={() => router.push(item.route as any)}
            >
              <View style={[styles.iconBox, { backgroundColor:     
  item.color + '18' }]}>
                <Text style={styles.menuEmoji}>{item.emoji}</Text> 
              </View>
              <View style={styles.menuText}>
                <Text style={styles.menuLabel}>{item.label}</Text> 
                <Text style={styles.menuDesc}>{item.desc}</Text>   
              </View>
              <MaterialCommunityIcons name="chevron-right"
  size={18} color={Colors.textMuted} />
            </AnimatedPressable>
          </FadeInView>
        ))}

        {/* Logout */}
        <FadeInView delay={510}>
          <AnimatedPressable style={styles.logoutBtn}
  scaleDown={0.97}>
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
    content: { padding: 16, gap: 10 },

    /* Member Card */
    memberCard: {
      flexDirection: 'row',
      backgroundColor: Colors.bgCard, borderRadius: 18,
      borderWidth: 1, borderColor: Colors.accent + '40', overflow: 
  'hidden',
    },
    memberAccentBar: { width: 4, backgroundColor: Colors.accent }, 
    memberInner: { flex: 1, flexDirection: 'row', alignItems:      
  'center', gap: 14, padding: 16 },
    avatarRing: {
      width: 52, height: 52, borderRadius: 26,
      backgroundColor: Colors.bgElevated,
      justifyContent: 'center', alignItems: 'center',
      borderWidth: 2, borderColor: Colors.accent + '50',
    },
    avatarEmoji: { fontSize: 26 },
    memberName: { fontSize: 17, fontFamily: Fonts.bold, color:     
  Colors.text },
    memberPlan: { fontSize: 11, fontFamily: Fonts.regular, color:  
  Colors.textMuted, marginTop: 2 },
    expiryBox: { alignItems: 'center', backgroundColor:
  Colors.accentMuted, borderRadius: 10, paddingHorizontal: 12,     
  paddingVertical: 8 },
    expiryVal: { fontSize: 26, fontFamily: Fonts.condensedBold,    
  color: Colors.accent, lineHeight: 28 },
    expiryLabel: { fontSize: 8, fontFamily: Fonts.bold, color:     
  Colors.accent, letterSpacing: 1, textAlign: 'center' },

    /* Stats */
    statsRow: { flexDirection: 'row', gap: 8 },
    statBox: {
      flex: 1, alignItems: 'center', gap: 3,
      backgroundColor: Colors.bgCard, borderRadius: 12,
      paddingVertical: 12, borderWidth: 1, borderColor:
  Colors.border,
    },
    statEmoji: { fontSize: 16 },
    statVal: { fontSize: 18, fontFamily: Fonts.condensedBold,      
  color: Colors.text },
    statLabel: { fontSize: 9, fontFamily: Fonts.bold, color:       
  Colors.textMuted, letterSpacing: 1 },

    sectionLabel: { fontSize: 10, fontFamily: Fonts.bold, color:   
  Colors.textMuted, letterSpacing: 1.8, marginTop: 4 },

    /* Menu */
    menuRow: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      backgroundColor: Colors.bgCard, borderRadius: 14, padding:   
  14,
      borderWidth: 1, borderColor: Colors.border,
    },
    iconBox: { width: 44, height: 44, borderRadius: 12,
  justifyContent: 'center', alignItems: 'center' },
    menuEmoji: { fontSize: 22 },
    menuText: { flex: 1 },
    menuLabel: { fontSize: 14, fontFamily: Fonts.bold, color:      
  Colors.text },
    menuDesc: { fontSize: 11, fontFamily: Fonts.regular, color:    
  Colors.textMuted, marginTop: 2 },

    /* Logout */
    logoutBtn: {
      alignItems: 'center', paddingVertical: 14, borderRadius: 12, 
      backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: 
  Colors.red + '40',
      marginTop: 8,
    },
    logoutText: { fontSize: 13, fontFamily: Fonts.bold, color:     
  Colors.red, letterSpacing: 1.5 },

    version: { textAlign: 'center', fontFamily: Fonts.bold, color: 
  Colors.textMuted, fontSize: 10, letterSpacing: 2, marginTop: 8 },
  });