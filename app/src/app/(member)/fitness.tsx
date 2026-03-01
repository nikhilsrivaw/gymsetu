import { View, Text, StyleSheet, ScrollView } from                 'react-native';
  import { useRouter } from 'expo-router';                           import { MaterialCommunityIcons } from '@expo/vector-icons';     
  import { Colors } from '@/constants/colors';                     
  import AnimatedPressable from '@/components/AnimatedPressable';  
  import FadeInView from '@/components/FadeInView';

  type IconName = React.ComponentProps<typeof
  MaterialCommunityIcons>['name'];

  const tools: {
    label: string;
    desc: string;
    emoji: string;
    icon: IconName;
    color: string;
    route: string;
  }[] = [
    { label: 'Workout Tracker', desc: 'Log your sets, reps &  weight', emoji: '📝', icon: 'clipboard-list-outline', color: Colors.accent, route: '/(member)/workout-tracker' },
    { label: 'Body Progress', desc: 'Track weight & measurements', 
  emoji: '📊', icon: 'trending-up', color: Colors.green, route:    
  '/(member)/body-progress' },
    { label: 'Diet Plan', desc: 'Your daily meal & calorie plan',  
  emoji: '🥗', icon: 'food-apple-outline', color: '#22C55E', route:
   '/(member)/diet-plan' },
    { label: 'Exercise Library', desc: 'Browse exercises with form guides', emoji: '📚', icon: 'dumbbell', color: Colors.orange, route: '/(member)/exercise-library' },
    { label: 'Rest Timer', desc: 'Between-set countdown timer',    
  emoji: '⏱️', icon: 'timer-outline', color: '#EC4899', route:     
  '/(member)/rest-timer' },
    { label: 'Workout & Diet Tips', desc: 'Expert tips by muscle group', emoji: '💡', icon: 'lightbulb-outline', color: '#8B5CF6',route: '/(member)/workout-tips' },
    { label: 'BMI Calculator', desc: 'Check your body mass index', 
  emoji: '⚖️', icon: 'scale-bathroom', color: '#3B82F6', route:    
  '/(member)/bmi-calculator' },
  ];

  export default function FitnessScreen() {
    const router = useRouter();

    return (
      <ScrollView style={styles.container}
  contentContainerStyle={styles.content}
  showsVerticalScrollIndicator={false}>
        {/* Header Banner */}
        <FadeInView delay={0}>
          <View style={styles.banner}>
            <Text style={styles.bannerEmoji}>🏋️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>Fitness Tools</Text>
              <Text style={styles.bannerSub}>Everything you need to
   crush your goals</Text>
            </View>
          </View>
        </FadeInView>

        {/* Today's Quick Stats */}
        <FadeInView delay={80}>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statEmoji}>🔥</Text>
              <Text style={styles.statVal}>320</Text>
              <Text style={styles.statLabel}>Calories</Text>       
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statEmoji}>⏱️</Text>
              <Text style={styles.statVal}>45m</Text>
              <Text style={styles.statLabel}>Duration</Text>       
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statEmoji}>💪</Text>
              <Text style={styles.statVal}>12</Text>
              <Text style={styles.statLabel}>Sets Done</Text>      
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statEmoji}>📅</Text>
              <Text style={styles.statVal}>5</Text>
              <Text style={styles.statLabel}>Day Streak</Text>     
            </View>
          </View>
        </FadeInView>

        {/* Tool Cards */}
        <Text style={styles.sectionTitle}>🛠️ Your Fitness
  Toolkit</Text>
        {tools.map((tool, i) => (
          <FadeInView key={tool.label} delay={120 + i * 60}>       
            <AnimatedPressable
              style={styles.toolCard}
              scaleDown={0.97}
              onPress={() => router.push(tool.route as any)}       
            >
              <View style={[styles.iconBox, { backgroundColor:     
  tool.color + '20' }]}>
                <Text style={styles.toolEmoji}>{tool.emoji}</Text> 
              </View>
              <View style={styles.toolText}>
                <Text style={styles.toolLabel}>{tool.label}</Text> 
                <Text style={styles.toolDesc}>{tool.desc}</Text>   
              </View>
              <MaterialCommunityIcons name="chevron-right" 
  size={20} color={Colors.textMuted} />
            </AnimatedPressable>
          </FadeInView>
        ))}

        <View style={{ height: 24 }} />
      </ScrollView>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    content: { padding: 16, gap: 10 },

    banner: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      backgroundColor: Colors.accentMuted, borderRadius: 16,       
  padding: 18,
      borderWidth: 1, borderColor: Colors.accent + '25',
  marginBottom: 4,
    },
    bannerEmoji: { fontSize: 36 },
    bannerTitle: { fontSize: 20, fontWeight: '700', color:
  Colors.text },
    bannerSub: { fontSize: 13, color: Colors.textMuted, marginTop: 
  2 },

    statsRow: { flexDirection: 'row', gap: 8 },
    statBox: {
      flex: 1, alignItems: 'center', backgroundColor:
  Colors.bgCard,
      borderRadius: 12, paddingVertical: 12, borderWidth: 1,       
  borderColor: Colors.border, gap: 2,
    },
    statEmoji: { fontSize: 16 },
    statVal: { fontSize: 16, fontWeight: '700', color: Colors.text 
  },
    statLabel: { fontSize: 10, color: Colors.textMuted },

    sectionTitle: { fontSize: 15, fontWeight: '700', color:        
  Colors.text, marginTop: 4 },

    toolCard: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      backgroundColor: Colors.bgCard, borderRadius: 14, padding:   
  16,
      borderWidth: 1, borderColor: Colors.border,
    },
    iconBox: { width: 46, height: 46, borderRadius: 12,
  justifyContent: 'center', alignItems: 'center' },
    toolEmoji: { fontSize: 22 },
    toolText: { flex: 1 },
    toolLabel: { fontSize: 15, fontWeight: '600', color:
  Colors.text },
    toolDesc: { fontSize: 12, color: Colors.textMuted, marginTop: 2
   },
  });