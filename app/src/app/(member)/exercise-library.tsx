 import { useState } from 'react';                                  import { View, Text, StyleSheet, ScrollView } from                 'react-native';                                                    import { Stack } from 'expo-router';                             
  import { Colors } from '@/constants/colors';                       import { Fonts } from '@/constants/fonts';                       
  import AnimatedPressable from '@/components/AnimatedPressable';    import FadeInView from '@/components/FadeInView';                
                                                                   
  interface Exercise {                                             
    name: string;
    level: 'Beginner' | 'Intermediate' | 'Advanced';
    muscle: string;
    steps: string[];
  }

  interface MuscleGroup {
    label: string;
    color: string;
    exercises: Exercise[];
  }

  const groups: MuscleGroup[] = [
    {
      label: 'Chest', color: Colors.red,
      exercises: [
        { name: 'Flat Bench Press',  level: 'Intermediate', muscle:
   'Pectorals, Triceps, Shoulders', steps: ['Lie flat on bench, grip bar slightly wider than shoulders', 'Unrack bar and lower slowly to mid-chest', 'Press bar up explosively, fully extend arms', 'Repeat for desired reps — keep feet flat on floor'] },   
        { name: 'Push-Ups',          level: 'Beginner',     muscle:
   'Chest, Triceps, Core',           steps: ['Start in high plank —hands shoulder-width apart', 'Lower chest to just above the  floor', 'Push back up keeping core tight throughout', 'Keep elbows at 45° angle from body'] },
        { name: 'Cable Flyes',       level: 'Intermediate', muscle:
   'Pectoral Isolation',             steps: ['Set cables at shoulder height, stand in center', 'Hold handles with slight bend in elbows', 'Bring hands together in a hugging arc motion', 'Squeeze chest hard at peak, return slowly'] },
      ],
    },
    {
      label: 'Back', color: Colors.accent,
      exercises: [
        { name: 'Deadlift',          level: 'Advanced',     muscle:
   'Full Back, Hamstrings, Glutes',  steps: ['Stand with feet  hip-width, bar over mid-foot', 'Hinge at hips, grip bar just  outside legs', 'Keep chest up, back flat — drive through heels','Lock hips out at top, lower bar under control'] },
        { name: 'Pull-Ups',          level: 'Intermediate', muscle:
   'Lats, Biceps, Rear Delts',       steps: ['Hang from bar with overhand grip, arms fully extended', 'Drive elbows down and back to pull chest to bar', 'Pause briefly at top, lower slowly', 'Avoid swinging or kipping — full control'] },
        { name: 'Barbell Row',       level: 'Intermediate', muscle:
   'Middle Back, Lats, Biceps',      steps: ['Hinge forward 45°, grip bar shoulder-width', 'Pull bar to lower chest / upper abdomen', 'Squeeze shoulder blades together at top', 'Lower bar slowly — maintain flat back throughout'] },
      ],
    },
    {
      label: 'Legs', color: Colors.green,
      exercises: [
        { name: 'Barbell Squat',     level: 'Intermediate', muscle:
   'Quads, Glutes, Hamstrings',      steps: ['Bar on upper traps, feet shoulder-width apart', 'Brace core, break at hips and knees together', 'Lower until thighs are parallel or below', 'Drive through heels to stand — keep chest up'] },
        { name: 'Romanian Deadlift', level: 'Intermediate', muscle:
   'Hamstrings, Glutes',             steps: ['Hold bar at hips, slight bend in knees', 'Hinge at hips — push them back behind you', 'Lower bar along legs until hamstrings stretch', 'Squeeze glutes to return to standing'] },
        { name: 'Walking Lunges',    level: 'Beginner',     muscle:
   'Quads, Glutes, Balance',         steps: ['Stand tall holding   dumbbells at your sides', 'Step forward and lower back knee toward floor', 'Push through front heel to bring feet together','Alternate legs — keep torso upright throughout'] },
      ],
    },
    {
      label: 'Arms', color: Colors.orange,
      exercises: [
        { name: 'Barbell Curl',      level: 'Beginner',     muscle:
   'Biceps',                         steps: ['Stand holding bar  with underhand grip', 'Keep elbows pinned to sides throughout','Curl bar up squeezing biceps at the top', 'Lower slowly — do not swing torso'] },
        { name: 'Tricep Dips',       level: 'Beginner',     muscle:
   'Triceps, Chest, Shoulders',      steps: ['Hold parallel bars, arms fully extended', 'Lower body until upper arms are parallel to floor', 'Push up to start position — lock out at top', 'Lean forward slightly for more chest activation'] },
        { name: 'Skull Crushers',    level: 'Intermediate', muscle:
   'Triceps Long Head',              steps: ['Lie on bench holding EZ-bar above chest', 'Keep upper arms vertical — only forearms  move', 'Lower bar toward forehead in a controlled arc', 'Extend arms fully — squeeze triceps at top'] },
      ],
    },
    {
      label: 'Core', color: '#EC4899',
      exercises: [
        { name: 'Hanging Leg Raise', level: 'Intermediate', muscle:'Lower Abs, Hip Flexors',         steps: ['Hang from pull-up bar with arms fully extended', 'Brace core and raise legs to 90° or higher', 'Lower slowly — avoid swinging', 'For easier version: bend knees while raising'] },
        { name: 'Plank',             level: 'Beginner',     muscle:  'Full Core, Shoulders',           steps: ['Forearms on floor,elbows under shoulders', 'Body in a straight line head to heels','Squeeze glutes and brace abs hard', 'Hold 30-60 seconds — breathe normally'] },
        { name: 'Ab Wheel Rollout',  level: 'Advanced',     muscle:'Full Core, Lats',                steps: ['Kneel on floor holding ab wheel with both hands', 'Roll forward slowly extending body as far as possible', 'Use core strength to pull back to  start position', 'Keep lower back from sagging throughout'] },   
      ],
    },
  ];

  const levelColor: Record<string, string> = {
    Beginner:     Colors.green,
    Intermediate: Colors.orange,
    Advanced:     Colors.red,
  };

  export default function ExerciseLibraryScreen() {
    const [selectedGroup, setSelectedGroup] = useState(0);
    const [expandedEx, setExpandedEx] = useState<number |
  null>(null);
    const group = groups[selectedGroup];

    return (
      <>
        <Stack.Screen options={{ title: 'Exercise Library' }} />   
        <View style={styles.container}>

          {/* ── Muscle Group Tabs ─────────────── */}
          <FadeInView delay={0}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabScroll}
            >
              {groups.map((g, i) => {
                const active = selectedGroup === i;
                return (
                  <AnimatedPressable
                    key={g.label}
                    style={[styles.tab, active && {
  backgroundColor: g.color + '18', borderColor: g.color + '50' }]} 
                    scaleDown={0.93}
                    onPress={() => { setSelectedGroup(i);
  setExpandedEx(null); }}
                  >
                    {active && <View style={[styles.tabActiveDot, {
   backgroundColor: g.color }]} />}
                    <Text style={[styles.tabLabel, active && {     
  color: g.color, fontFamily: Fonts.bold }]}>
                      {g.label.toUpperCase()}
                    </Text>
                    <Text style={[styles.tabCount, active && {     
  color: g.color }]}>
                      {g.exercises.length}
                    </Text>
                  </AnimatedPressable>
                );
              })}
            </ScrollView>
          </FadeInView>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* ── Group Header ──────────────────── */}
            <FadeInView delay={40}>
              <View style={[styles.groupHeader, { borderLeftColor: 
  group.color }]}>
                <View>
                  <Text style={styles.groupMicro}>MUSCLE
  GROUP</Text>
                  <Text style={[styles.groupTitle, { color:        
  group.color }]}>
                    {group.label.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.groupCount}>
                  {group.exercises.length} EXERCISES
                </Text>
              </View>
            </FadeInView>

            {/* ── Exercise Cards ────────────────── */}
            {group.exercises.map((ex, i) => {
              const open = expandedEx === i;
              return (
                <FadeInView key={`${selectedGroup}-${i}`}
  delay={100 + i * 70}>
                  <AnimatedPressable
                    style={[styles.exCard, open && { borderColor:  
  group.color + '40' }]}
                    scaleDown={0.98}
                    onPress={() => setExpandedEx(open ? null : i)} 
                  >
                    {/* Left accent bar on open */}
                    {open && <View style={[styles.openBar, {       
  backgroundColor: group.color }]} />}

                    <View style={styles.exHeader}>
                      <View style={[styles.exIconBox, {
  backgroundColor: group.color + '15' }]}>
                        <Text style={styles.exIcon}>◈</Text>       
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.exName, open && {     
  color: group.color }]}>
                          {ex.name.toUpperCase()}
                        </Text>
                        <Text
  style={styles.exMuscle}>{ex.muscle}</Text>
                      </View>
                      <View style={[styles.levelBadge, {
  backgroundColor: levelColor[ex.level] + '18' }]}>
                        <Text style={[styles.levelText, { color:   
  levelColor[ex.level] }]}>
                          {ex.level.toUpperCase()}
                        </Text>
                      </View>
                      <Text style={[styles.arrow, open && { color: 
  group.color }]}>
                        {open ? '▲' : '▼'}
                      </Text>
                    </View>

                    {open && (
                      <View style={styles.steps}>
                        <Text style={styles.stepsTitle}>HOW TO     
  PERFORM</Text>
                        {ex.steps.map((step, si) => (
                          <View key={si} style={styles.stepRow}>   
                            <View style={[styles.stepNum, {        
  backgroundColor: group.color }]}>
                              <Text style={styles.stepNumText}>{si 
  + 1}</Text>
                            </View>
                            <Text
  style={styles.stepText}>{step}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </AnimatedPressable>
                </FadeInView>
              );
            })}

            <View style={{ height: 32 }} />
          </ScrollView>
        </View>
      </>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },

    tabScroll: { paddingHorizontal: 16, paddingVertical: 12, gap: 8
   },
    tab: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
      backgroundColor: Colors.bgCard,
      borderWidth: 1, borderColor: Colors.border,
    },
    tabActiveDot: {
      width: 5, height: 5, borderRadius: 3,
    },
    tabLabel: {
      fontFamily: Fonts.medium,
      fontSize: 11, color: Colors.textMuted, letterSpacing: 0.8,   
    },
    tabCount: {
      fontFamily: Fonts.condensedBold,
      fontSize: 13, color: Colors.textMuted,
    },

    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 16, gap: 10 },

    groupHeader: {
      flexDirection: 'row', alignItems: 'center', justifyContent:  
  'space-between',
      backgroundColor: Colors.bgCard,
      borderRadius: 14, padding: 16, marginBottom: 4,
      borderWidth: 1, borderColor: Colors.border,
      borderLeftWidth: 4,
    },
    groupMicro: {
      fontFamily: Fonts.medium,
      fontSize: 9, color: Colors.textMuted, letterSpacing: 1.2,    
    },
    groupTitle: {
      fontFamily: Fonts.condensedBold,
      fontSize: 26, letterSpacing: 0.5,
    },
    groupCount: {
      fontFamily: Fonts.bold,
      fontSize: 10, color: Colors.textMuted, letterSpacing: 0.8,   
    },

    exCard: {
      backgroundColor: Colors.bgCard, borderRadius: 14,
      borderWidth: 1, borderColor: Colors.border,
      overflow: 'hidden',
    },
    openBar: {
      position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,  
    },
    exHeader: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      padding: 14,
    },
    exIconBox: {
      width: 38, height: 38, borderRadius: 10,
      justifyContent: 'center', alignItems: 'center',
    },
    exIcon: { fontSize: 16, color: Colors.textMuted },
    exName: {
      fontFamily: Fonts.condensedBold,
      fontSize: 15, color: Colors.text, letterSpacing: 0.3,        
    },
    exMuscle: {
      fontFamily: Fonts.regular,
      fontSize: 11, color: Colors.textMuted, marginTop: 2,
    },
    levelBadge: { borderRadius: 6, paddingHorizontal: 8,
  paddingVertical: 4 },
    levelText: {
      fontFamily: Fonts.bold,
      fontSize: 9, letterSpacing: 0.6,
    },
    arrow: {
      fontFamily: Fonts.bold,
      fontSize: 9, color: Colors.textMuted,
    },

    steps: {
      gap: 10, paddingHorizontal: 14, paddingBottom: 14,
      borderTopWidth: 1, borderTopColor: Colors.border, paddingTop:
   12,
    },
    stepsTitle: {
      fontFamily: Fonts.bold,
      fontSize: 9, color: Colors.textMuted, letterSpacing: 1.2,    
    },
    stepRow: { flexDirection: 'row', gap: 10, alignItems:
  'flex-start' },
    stepNum: {
      width: 22, height: 22, borderRadius: 6,
      justifyContent: 'center', alignItems: 'center', marginTop: 1,
    },
    stepNumText: {
      fontFamily: Fonts.condensedBold,
      fontSize: 11, color: '#FFF',
    },
    stepText: {
      flex: 1,
      fontFamily: Fonts.regular,
      fontSize: 13, color: Colors.textSub, lineHeight: 20,
    },
  });