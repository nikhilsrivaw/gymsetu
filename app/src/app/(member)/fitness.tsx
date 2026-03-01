import { View, Text, StyleSheet, ScrollView } from                 'react-native';                                                  
  import { useRouter } from 'expo-router';                           import { MaterialCommunityIcons } from '@expo/vector-icons';     
  import { Colors } from '@/constants/colors';                       import { Fonts } from '@/constants/fonts';                       
  import AnimatedPressable from '@/components/AnimatedPressable';  
  import FadeInView from '@/components/FadeInView';                                                                                   
  type IconName = React.ComponentProps<typeof                      
  MaterialCommunityIcons>['name'];

  const tools: {
    label: string;
    desc: string;
    icon: IconName;
    color: string;
    route: string;
    tag: string;
  }[] = [
    { label: 'Workout Tracker',   desc: 'Log your sets, reps & weight',       icon: 'clipboard-list-outline', color:Colors.accent,  route: '/(member)/workout-tracker',  tag:        
  'ACTIVE' },
    { label: 'Body Progress',     desc: 'Track weight & measurements',         icon: 'trending-up',            color:Colors.green,   route: '/(member)/body-progress',    tag:'METRICS' },
    { label: 'Diet Plan',         desc: 'Your daily meal & calorie plan',      icon: 'food-apple-outline',     color: '#22C55E', route: '/(member)/diet-plan',        tag: 'NUTRITION' },       
    { label: 'Exercise Library',  desc: 'Browse exercises with form guides',   icon: 'dumbbell',               color: Colors.orange, route: '/(member)/exercise-library', tag: 'LIBRARY' },
    { label: 'Rest Timer',        desc: 'Between-set countdown timer',         icon: 'timer-outline',          color: '#EC4899',route: '/(member)/rest-timer',       tag: 'TIMER' },
    { label: 'BMI Calculator',    desc: 'Check your body mass index',          icon: 'scale-bathroom',         color:'#3B82F6',      route: '/(member)/bmi-calculator',   tag: 'HEALTH' },
  ];

  const todayStats = [
    { val: '320',  unit: 'kcal',  label: 'BURNED' },
    { val: '45',   unit: 'min',   label: 'DURATION' },
    { val: '12',   unit: 'sets',  label: 'VOLUME' },
    { val: '5',    unit: 'days',  label: 'STREAK' },
  ];

  export default function FitnessScreen() {
    const router = useRouter();

    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Banner ───────────────────────── */}
        <FadeInView delay={0}>
          <View style={styles.banner}>
            <View style={styles.bannerGlow} />
            <View style={styles.bannerLeft}>
              <Text style={styles.bannerMicro}>FITNESS HUB</Text>  
              <Text style={styles.bannerTitle}>YOUR TOOLKIT</Text> 
              <Text style={styles.bannerSub}>Everything to crush   
  your goals</Text>
            </View>
            <MaterialCommunityIcons name="dumbbell" size={52}      
  color={Colors.accent} style={{ opacity: 0.35 }} />
          </View>
        </FadeInView>

        {/* ── Today Stats ──────────────────────── */}
        <FadeInView delay={80}>
          <View style={styles.statsRow}>
            {todayStats.map((s, i) => (
              <View key={i} style={styles.statBox}>
                <Text style={styles.statVal}>{s.val}</Text>        
                <Text style={styles.statUnit}>{s.unit}</Text>      
                <Text style={styles.statLabel}>{s.label}</Text>    
              </View>
            ))}
          </View>
        </FadeInView>

        {/* ── Section Label ────────────────────── */}
        <Text style={styles.sectionLabel}>TOOLS  —  {tools.length} 
  AVAILABLE</Text>

        {/* ── Tool Cards ───────────────────────── */}
        {tools.map((tool, i) => (
          <FadeInView key={tool.label} delay={120 + i * 55}>       
            <AnimatedPressable
              style={styles.toolCard}
              scaleDown={0.97}
              onPress={() => router.push(tool.route as any)}       
            >
              {/* Left accent bar */}
              <View style={[styles.accentBar, { backgroundColor:   
  tool.color }]} />

              <View style={[styles.iconBox, { backgroundColor:     
  tool.color + '18' }]}>
                <MaterialCommunityIcons name={tool.icon} size={22} 
  color={tool.color} />
              </View>

              <View style={styles.toolText}>
                <Text style={styles.toolLabel}>{tool.label}</Text> 
                <Text style={styles.toolDesc}>{tool.desc}</Text>   
              </View>

              <View style={[styles.tagBadge, { backgroundColor:    
  tool.color + '15' }]}>
                <Text style={[styles.tagText, { color: tool.color  
  }]}>{tool.tag}</Text>
              </View>
            </AnimatedPressable>
          </FadeInView>
        ))}

        <View style={{ height: 32 }} />
      </ScrollView>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    content: { paddingHorizontal: 16, paddingTop: 16, gap: 10 },   

    // Banner
    banner: {
      backgroundColor: Colors.bgCard,
      borderRadius: 20, padding: 20,
      flexDirection: 'row', alignItems: 'center', justifyContent:  
  'space-between',
      borderWidth: 1, borderColor: Colors.accent + '20',
      overflow: 'hidden', marginBottom: 4,
    },
    bannerGlow: {
      position: 'absolute', top: -30, left: -20,
      width: 100, height: 100, borderRadius: 50,
      backgroundColor: Colors.accentGlow,
    },
    bannerLeft: { gap: 4 },
    bannerMicro: {
      fontFamily: Fonts.medium,
      fontSize: 9, color: Colors.accent, letterSpacing: 1.5,       
    },
    bannerTitle: {
      fontFamily: Fonts.condensedBold,
      fontSize: 32, color: Colors.text, letterSpacing: 1,
    },
    bannerSub: {
      fontFamily: Fonts.regular,
      fontSize: 12, color: Colors.textMuted,
    },

    // Stats
    statsRow: { flexDirection: 'row', gap: 8 },
    statBox: {
      flex: 1, alignItems: 'center', gap: 1,
      backgroundColor: Colors.bgCard,
      borderRadius: 12, paddingVertical: 12,
      borderWidth: 1, borderColor: Colors.border,
    },
    statVal: {
      fontFamily: Fonts.condensedBold,
      fontSize: 22, color: Colors.text,
    },
    statUnit: {
      fontFamily: Fonts.medium,
      fontSize: 9, color: Colors.accent, letterSpacing: 0.5,       
    },
    statLabel: {
      fontFamily: Fonts.medium,
      fontSize: 8, color: Colors.textMuted, letterSpacing: 0.8,    
    },

    sectionLabel: {
      fontFamily: Fonts.medium,
      fontSize: 9, color: Colors.textMuted,
      letterSpacing: 1.5, marginTop: 4,
    },

    // Tool cards
    toolCard: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      backgroundColor: Colors.bgCard,
      borderRadius: 14, padding: 16,
      borderWidth: 1, borderColor: Colors.border,
      overflow: 'hidden',
    },
    accentBar: {
      position: 'absolute', left: 0, top: 0, bottom: 0,
      width: 3, borderRadius: 2,
    },
    iconBox: {
      width: 44, height: 44, borderRadius: 12,
      justifyContent: 'center', alignItems: 'center',
    },
    toolText: { flex: 1 },
    toolLabel: {
      fontFamily: Fonts.bold,
      fontSize: 14, color: Colors.text,
    },
    toolDesc: {
      fontFamily: Fonts.regular,
      fontSize: 11, color: Colors.textMuted, marginTop: 2,
    },
    tagBadge: {
      borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4,   
    },
    tagText: {
      fontFamily: Fonts.bold,
      fontSize: 9, letterSpacing: 0.8,
    },
  });