 import { View, Text, StyleSheet, ScrollView } from                 'react-native';                                                  
  import { useRouter } from 'expo-router';                           import { MaterialCommunityIcons } from '@expo/vector-icons';     
  import { Colors } from '@/constants/colors';                     
  import AnimatedPressable from '@/components/AnimatedPressable';  
  import FadeInView from '@/components/FadeInView';

  type IconName = React.ComponentProps<typeof
  MaterialCommunityIcons>['name'];

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
    { label: 'Give Feedback', desc: 'Rate your gym experience',    
  emoji: '⭐', icon: 'star-outline', color: '#F59E0B', route:      
  '/(member)/feedback' },
    { label: 'Refer a Friend', desc: 'Earn rewards for referrals', 
  emoji: '🎁', icon: 'gift-outline', color: '#EC4899', route:      
  '/(member)/refer-friend' },
    { label: 'Workout Tips', desc: 'Expert guides by muscle group',
   emoji: '💡', icon: 'lightbulb-outline', color: '#8B5CF6', route:
   '/(member)/workout-tips' },
    { label: 'BMI Calculator', desc: 'Check your body mass index', 
  emoji: '⚖️', icon: 'scale-bathroom', color: '#3B82F6', route:    
  '/(member)/bmi-calculator' },
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
      <ScrollView style={styles.container}
  contentContainerStyle={styles.content}
  showsVerticalScrollIndicator={false}>

        {/* Member Card */}
        <FadeInView delay={0}>
          <View style={styles.memberCard}>
            <View style={styles.avatarCircle}>
              <Text
  style={styles.avatarEmoji}>{member.avatar}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.memberName}>{member.name}</Text> 
              <Text style={styles.memberPlan}>📋
  {member.plan}</Text>
            </View>
            <View style={styles.expiryBox}>
              <Text
  style={styles.expiryVal}>{member.expiresIn}</Text>
              <Text style={styles.expiryLabel}>days left</Text>    
            </View>
          </View>
        </FadeInView>

        {/* Quick Stats */}
        <FadeInView delay={80}>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statEmoji}>📅</Text>
              <Text style={styles.statVal}>14</Text>
              <Text style={styles.statLabel}>Days Visited</Text>   
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statEmoji}>🔥</Text>
              <Text style={styles.statVal}>5</Text>
              <Text style={styles.statLabel}>Day Streak</Text>     
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statEmoji}>💰</Text>
              <Text style={styles.statVal}>₹0</Text>
              <Text style={styles.statLabel}>Due</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statEmoji}>🏆</Text>
              <Text style={styles.statVal}>3rd</Text>
              <Text style={styles.statLabel}>Rank</Text>
            </View>
          </View>
        </FadeInView>

        {/* Menu Items */}
        <Text style={styles.sectionTitle}>⚙️ Options</Text>        
        {menuItems.map((item, i) => (
          <FadeInView key={item.label} delay={120 + i * 55}>       
            <AnimatedPressable
              style={styles.menuRow}
              scaleDown={0.97}
              onPress={() => router.push(item.route as any)}       
            >
              <View style={[styles.iconBox, { backgroundColor: 
  item.color + '20' }]}>
                <Text style={styles.menuEmoji}>{item.emoji}</Text> 
              </View>
              <View style={styles.menuText}>
                <Text style={styles.menuLabel}>{item.label}</Text> 
                <Text style={styles.menuDesc}>{item.desc}</Text>   
              </View>
              <MaterialCommunityIcons name="chevron-right"
  size={20} color={Colors.textMuted} />
            </AnimatedPressable>
          </FadeInView>
        ))}

        {/* Logout */}
        <FadeInView delay={500}>
          <AnimatedPressable style={styles.logoutBtn}
  scaleDown={0.97}>
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
    content: { padding: 16, gap: 10 },

    memberCard: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      backgroundColor: Colors.accent, borderRadius: 18, padding:   
  18,
    },
    avatarCircle: {
      width: 52, height: 52, borderRadius: 26,
      backgroundColor: 'rgba(255,255,255,0.2)',
      justifyContent: 'center', alignItems: 'center',
    },
    avatarEmoji: { fontSize: 26 },
    memberName: { fontSize: 18, fontWeight: '700', color: '#FFF' },
    memberPlan: { fontSize: 12, color: 'rgba(255,255,255,0.75)',   
  marginTop: 2 },
    expiryBox: { alignItems: 'center' },
    expiryVal: { fontSize: 24, fontWeight: '700', color: '#FFF' }, 
    expiryLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)' }, 

    statsRow: { flexDirection: 'row', gap: 8 },
    statBox: {
      flex: 1, alignItems: 'center', gap: 4,
      backgroundColor: Colors.bgCard, borderRadius: 12,
      paddingVertical: 14, borderWidth: 1, borderColor:
  Colors.border,
    },
    statEmoji: { fontSize: 18 },
    statVal: { fontSize: 16, fontWeight: '700', color: Colors.text 
  },
    statLabel: { fontSize: 10, color: Colors.textMuted, textAlign: 
  'center' },

    sectionTitle: { fontSize: 15, fontWeight: '700', color:        
  Colors.text, marginTop: 4 },

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
    menuLabel: { fontSize: 15, fontWeight: '600', color:
  Colors.text },
    menuDesc: { fontSize: 12, color: Colors.textMuted, marginTop: 2
   },

    logoutBtn: {
      alignItems: 'center', paddingVertical: 14, borderRadius: 12, 
      backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: 
  Colors.red + '40',
      marginTop: 8,
    },
    logoutText: { fontSize: 15, fontWeight: '600', color:
  Colors.red },

    version: { textAlign: 'center', color: Colors.textMuted,       
  fontSize: 12, marginTop: 8 },
  });