                                            
  import { useState } from 'react'; 
  import { View, Text, StyleSheet, ScrollView, Alert } from
  'react-native';                                                    import { MaterialCommunityIcons } from '@expo/vector-icons';
  import { Colors } from '@/constants/colors';                       import FadeInView from '@/components/FadeInView';                
  import AnimatedPressable from '@/components/AnimatedPressable';     
  interface Exercise {                                             
    name: string;
    sets: string;
    reps: string;
    rest: string;
    emoji: string;
  }

  interface WorkoutPlan {
    id: number;
    name: string;
    goal: string;
    assignedTo: string[];
    days: string;
    level: string;
    color: string;
    emoji: string;
    weeks: number;
    exercises: Exercise[];
  }

  const plans: WorkoutPlan[] = [
    {
      id: 1,
      name: 'Push-Pull-Legs Split',
      goal: 'Muscle Gain',
      assignedTo: ['Amit Singh', 'Arjun Sharma', 'Vikram Rao'],    
      days: 'Mon / Wed / Fri / Sat',
      level: 'Intermediate',
      color: Colors.accent,
      emoji: '💪',
      weeks: 12,
      exercises: [
        { name: 'Bench Press', sets: '4', reps: '8-10', rest:      
  '90s', emoji: '🏋️' },
        { name: 'Incline Dumbbell Press', sets: '3', reps: '10-12',
   rest: '75s', emoji: '💪' },
        { name: 'Cable Flyes', sets: '3', reps: '12-15', rest:     
  '60s', emoji: '🎯' },
        { name: 'Shoulder Press', sets: '4', reps: '8-10', rest:   
  '90s', emoji: '⬆️' },
        { name: 'Tricep Dips', sets: '3', reps: '10-12', rest:     
  '60s', emoji: '💥' },
      ],
    },
    {
      id: 2,
      name: 'Fat Loss Circuit',
      goal: 'Weight Loss',
      assignedTo: ['Priya Nair', 'Rahul Mehta', 'Kavita Desai'],   
      days: 'Mon / Tue / Thu / Fri',
      level: 'Beginner',
      color: Colors.orange,
      emoji: '🔥',
      weeks: 8,
      exercises: [
        { name: 'Jump Squats', sets: '3', reps: '15', rest: '45s', 
  emoji: '🦵' },
        { name: 'Burpees', sets: '3', reps: '10', rest: '60s',     
  emoji: '🔥' },
        { name: 'Mountain Climbers', sets: '3', reps: '20', rest:  
  '45s', emoji: '🧗' },
        { name: 'Kettlebell Swings', sets: '4', reps: '12', rest:  
  '60s', emoji: '⚡' },
        { name: 'Plank Hold', sets: '3', reps: '45s', rest: '30s', 
  emoji: '🧱' },
      ],
    },
    {
      id: 3,
      name: 'Yoga & Flexibility',
      goal: 'Flexibility & Recovery',
      assignedTo: ['Sneha Patel', 'Meena Joshi'],
      days: 'Tue / Thu / Sun',
      level: 'All Levels',
      color: '#8B5CF6',
      emoji: '🧘',
      weeks: 6,
      exercises: [
        { name: 'Sun Salutation', sets: '3', reps: '5 rounds',     
  rest: '30s', emoji: '🌅' },
        { name: 'Downward Dog', sets: '1', reps: '60s hold', rest: 
  '15s', emoji: '🧘' },
        { name: 'Warrior Pose', sets: '2', reps: '45s each', rest: 
  '15s', emoji: '⚔️' },
        { name: 'Hip Flexor Stretch', sets: '2', reps: '60s each', 
  rest: '10s', emoji: '🦵' },
        { name: 'Child\'s Pose', sets: '1', reps: '90s hold', rest:
   '0s', emoji: '🙏' },
      ],
    },
    {
      id: 4,
      name: 'Strength Foundations',
      goal: 'General Fitness',
      assignedTo: ['Vikram Rao'],
      days: 'Mon / Wed / Fri',
      level: 'Beginner',
      color: Colors.green,
      emoji: '🏗️',
      weeks: 6,
      exercises: [
        { name: 'Goblet Squat', sets: '3', reps: '12', rest: '75s',
   emoji: '🦵' },
        { name: 'Dumbbell Row', sets: '3', reps: '10 each', rest:  
  '60s', emoji: '💪' },
        { name: 'Push-Ups', sets: '3', reps: '12-15', rest: '60s', 
  emoji: '🔥' },
        { name: 'Romanian Deadlift', sets: '3', reps: '10', rest:  
  '75s', emoji: '🏋️' },
        { name: 'Plank', sets: '3', reps: '30-45s', rest: '30s',
  emoji: '🧱' },
      ],
    },
  ];

  const levelColor: Record<string, string> = {
    Beginner: Colors.green,
    Intermediate: Colors.orange,
    Advanced: Colors.red,
    'All Levels': Colors.accent,
  };

  export default function WorkoutPlansScreen() {
    const [expandedPlan, setExpandedPlan] = useState<number |      
  null>(null);

    return (
      <ScrollView style={styles.container}
  contentContainerStyle={styles.content}
  showsVerticalScrollIndicator={false}>

        {/* Header Stats */}
        <FadeInView delay={0}>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statEmoji}>📋</Text>
              <Text style={styles.statVal}>{plans.length}</Text>   
              <Text style={styles.statLabel}>Total Plans</Text>    
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statEmoji}>👥</Text>
              <Text style={styles.statVal}>{[...new
  Set(plans.flatMap(p => p.assignedTo))].length}</Text>
              <Text style={styles.statLabel}>Members</Text>        
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statEmoji}>💪</Text>
              <Text style={styles.statVal}>{plans.reduce((a, p) => 
  a + p.exercises.length, 0)}</Text>
              <Text style={styles.statLabel}>Exercises</Text>      
            </View>
          </View>
        </FadeInView>

        {/* Create New Plan Button */}
        <FadeInView delay={60}>
          <AnimatedPressable
            style={styles.createBtn}
            scaleDown={0.97}
            onPress={() => Alert.alert('Create Plan', 'Plan buildercoming soon!')}
          >
            <MaterialCommunityIcons name="plus-circle-outline"     
  size={22} color={Colors.accent} />
            <Text style={styles.createBtnText}>Create New Workout  
  Plan</Text>
          </AnimatedPressable>
        </FadeInView>

        {/* Plans */}
        {plans.map((plan, i) => {
          const isOpen = expandedPlan === plan.id;
          return (
            <FadeInView key={plan.id} delay={100 + i * 70}>        
              <View style={[styles.planCard, isOpen && {
  borderColor: plan.color + '50' }]}>

                {/* Plan Header */}
                <AnimatedPressable
                  style={styles.planHeader}
                  scaleDown={0.98}
                  onPress={() => setExpandedPlan(isOpen ? null :   
  plan.id)}
                >
                  <View style={[styles.planIcon, { backgroundColor:
   plan.color + '20' }]}>
                    <Text
  style={styles.planEmoji}>{plan.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.planName, isOpen && {     
  color: plan.color }]}>{plan.name}</Text>
                    <Text style={styles.planGoal}>🎯
  {plan.goal}</Text>
                  </View>
                  <MaterialCommunityIcons
                    name={isOpen ? 'chevron-up' : 'chevron-down'}  
                    size={22}
                    color={Colors.textMuted}
                  />
                </AnimatedPressable>

                {/* Plan Meta */}
                <View style={styles.planMeta}>
                  <View style={[styles.levelBadge, {
  backgroundColor: levelColor[plan.level] + '20' }]}>
                    <Text style={[styles.levelText, { color:       
  levelColor[plan.level] }]}>{plan.level}</Text>
                  </View>
                  <View style={styles.metaChip}>
                    <Text style={styles.metaText}>📅
  {plan.days}</Text>
                  </View>
                  <View style={styles.metaChip}>
                    <Text style={styles.metaText}>⏱ {plan.weeks}   
  weeks</Text>
                  </View>
                </View>

                {/* Assigned Members */}
                <View style={styles.assignedRow}>
                  <Text style={styles.assignedLabel}>👥 Assigned   
  to:</Text>
                  <ScrollView horizontal
  showsHorizontalScrollIndicator={false} contentContainerStyle={{  
  gap: 6 }}>
                    {plan.assignedTo.map(name => (
                      <View key={name} style={styles.memberChip}>  
                        <Text
  style={styles.memberChipText}>{name}</Text>
                      </View>
                    ))}
                  </ScrollView>
                </View>

                {/* Expanded Exercises */}
                {isOpen && (
                  <View style={styles.exercisesSection}>
                    <View style={styles.exercisesHeader}>
                      <Text style={styles.exercisesTitle}>📋       
  Exercises</Text>
                      <Text
  style={styles.exercisesCount}>{plan.exercises.length}
  exercises</Text>
                    </View>

                    {/* Table Header */}
                    <View style={styles.tableHeader}>
                      <Text style={[styles.tableHeaderText, { flex:
   2 }]}>Exercise</Text>
                      <Text
  style={styles.tableHeaderText}>Sets</Text>
                      <Text
  style={styles.tableHeaderText}>Reps</Text>
                      <Text
  style={styles.tableHeaderText}>Rest</Text>
                    </View>

                    {plan.exercises.map((ex, ei) => (
                      <View key={ei} style={[styles.exerciseRow, ei
   % 2 === 0 && styles.exerciseRowAlt]}>
                        <View style={[styles.exerciseName, { flex: 
  2 }]}>
                          <Text
  style={styles.exEmoji}>{ex.emoji}</Text>
                          <Text style={styles.exName}
  numberOfLines={1}>{ex.name}</Text>
                        </View>
                        <Text
  style={styles.exCell}>{ex.sets}</Text>
                        <Text
  style={styles.exCell}>{ex.reps}</Text>
                        <Text
  style={styles.exCell}>{ex.rest}</Text>
                      </View>
                    ))}

                    {/* Plan Actions */}
                    <View style={styles.planActions}>
                      <AnimatedPressable
                        style={styles.editBtn}
                        scaleDown={0.95}
                        onPress={() => Alert.alert('Edit Plan',    
  `Editing "${plan.name}"...`)}
                      >
                        <MaterialCommunityIcons
  name="pencil-outline" size={16} color={Colors.accent} />
                        <Text style={styles.editBtnText}>Edit      
  Plan</Text>
                      </AnimatedPressable>
                      <AnimatedPressable
                        style={styles.assignBtn}
                        scaleDown={0.95}
                        onPress={() => Alert.alert('Assign Plan',  
  `Assigning "${plan.name}" to member...`)}
                      >
                        <MaterialCommunityIcons
  name="account-plus-outline" size={16} color='#FFF' />
                        <Text style={styles.assignBtnText}>Assign  
  Member</Text>
                      </AnimatedPressable>
                    </View>
                  </View>
                )}
              </View>
            </FadeInView>
          );
        })}

        <View style={{ height: 24 }} />
      </ScrollView>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    content: { padding: 16, gap: 12 },

    statsRow: { flexDirection: 'row', gap: 8 },
    statBox: {
      flex: 1, alignItems: 'center', gap: 4,
      backgroundColor: Colors.bgCard, borderRadius: 12,
      paddingVertical: 14, borderWidth: 1, borderColor:
  Colors.border,
    },
    statEmoji: { fontSize: 20 },
    statVal: { fontSize: 20, fontWeight: '700', color: Colors.text 
  },
    statLabel: { fontSize: 10, color: Colors.textMuted },

    createBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent:  
  'center', gap: 10,
      paddingVertical: 14, borderRadius: 14,
      borderWidth: 1, borderColor: Colors.accent + '50',
      borderStyle: 'dashed', backgroundColor: Colors.accentMuted,  
    },
    createBtnText: { fontSize: 15, fontWeight: '600', color:       
  Colors.accent },

    planCard: {
      backgroundColor: Colors.bgCard, borderRadius: 16,
      borderWidth: 1, borderColor: Colors.border, overflow:        
  'hidden',
    },
    planHeader: { flexDirection: 'row', alignItems: 'center', gap: 
  12, padding: 14 },
    planIcon: { width: 46, height: 46, borderRadius: 12,
  justifyContent: 'center', alignItems: 'center' },
    planEmoji: { fontSize: 22 },
    planName: { fontSize: 15, fontWeight: '700', color: Colors.text
   },
    planGoal: { fontSize: 12, color: Colors.textMuted, marginTop: 2
   },

    planMeta: { flexDirection: 'row', gap: 8, paddingHorizontal:   
  14, paddingBottom: 10, flexWrap: 'wrap' },
    levelBadge: { borderRadius: 8, paddingHorizontal: 10,
  paddingVertical: 4 },
    levelText: { fontSize: 11, fontWeight: '700' },
    metaChip: { backgroundColor: Colors.bgElevated, borderRadius:  
  8, paddingHorizontal: 10, paddingVertical: 4 },
    metaText: { fontSize: 11, color: Colors.textSub, fontWeight:   
  '500' },

    assignedRow: { paddingHorizontal: 14, paddingBottom: 14, gap: 6
   },
    assignedLabel: { fontSize: 12, color: Colors.textMuted,        
  fontWeight: '600' },
    memberChip: {
      backgroundColor: Colors.accentMuted, borderRadius: 20,       
      paddingHorizontal: 12, paddingVertical: 5,
      borderWidth: 1, borderColor: Colors.accent + '30',
    },
    memberChipText: { fontSize: 12, fontWeight: '600', color:      
  Colors.accent },

    exercisesSection: { borderTopWidth: 1, borderTopColor:
  Colors.border, padding: 14, gap: 8 },
    exercisesHeader: { flexDirection: 'row', justifyContent:       
  'space-between', alignItems: 'center' },
    exercisesTitle: { fontSize: 14, fontWeight: '700', color:      
  Colors.text },
    exercisesCount: { fontSize: 12, color: Colors.textMuted },     

    tableHeader: { flexDirection: 'row', paddingVertical: 6,       
  paddingHorizontal: 4 },
    tableHeaderText: { flex: 1, fontSize: 11, fontWeight: '700',   
  color: Colors.textMuted, textAlign: 'center' },

    exerciseRow: { flexDirection: 'row', alignItems: 'center',     
  paddingVertical: 8, paddingHorizontal: 4, borderRadius: 8 },     
    exerciseRowAlt: { backgroundColor: Colors.bgElevated },        
    exerciseName: { flexDirection: 'row', alignItems: 'center',    
  gap: 6 },
    exEmoji: { fontSize: 16 },
    exName: { flex: 1, fontSize: 13, fontWeight: '500', color:     
  Colors.text },
    exCell: { flex: 1, fontSize: 13, color: Colors.textSub,        
  textAlign: 'center' },

    planActions: { flexDirection: 'row', gap: 10, marginTop: 4 },  
    editBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center',
  justifyContent: 'center',
      gap: 6, paddingVertical: 10, borderRadius: 10,
      borderWidth: 1, borderColor: Colors.accent + '40',
  backgroundColor: Colors.accentMuted,
    },
    editBtnText: { fontSize: 13, fontWeight: '600', color:
  Colors.accent },
    assignBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center',
  justifyContent: 'center',
      gap: 6, paddingVertical: 10, borderRadius: 10,
      backgroundColor: Colors.accent,
    },
    assignBtnText: { fontSize: 13, fontWeight: '600', color: '#FFF'
   },
  });