  import { useState } from 'react';
  import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
  import { MaterialCommunityIcons } from '@expo/vector-icons';
  import { Colors } from '@/constants/colors';   
  import { Fonts } from '@/constants/fonts';
  import FadeInView from '@/components/FadeInView';
  import AnimatedPressable from '@/components/AnimatedPressable';
  import { askAI } from '@/lib/ai';                                                                                                  
  interface Exercise {                                                                                                            
    name: string; sets: string; reps: string; rest: string; emoji: string;      
  }

  interface WorkoutPlan {
    id: number; name: string; goal: string; assignedTo: string[];
    days: string; level: string; color: string; emoji: string;
    weeks: number; exercises: Exercise[];
  }

  const plans: WorkoutPlan[] = [
    {
      id: 1, name: 'Push-Pull-Legs Split', goal: 'Muscle Gain',
      assignedTo: ['Amit Singh', 'Arjun Sharma', 'Vikram Rao'],
      days: 'Mon / Wed / Fri / Sat', level: 'Intermediate', color: Colors.accent, emoji: '💪', weeks: 12,
      exercises: [
        { name: 'Bench Press',           sets: '4', reps: '8-10',  rest: '90s', emoji: '🏋️' },
        { name: 'Incline Dumbbell Press', sets: '3', reps: '10-12', rest: '75s', emoji: '💪' },
        { name: 'Cable Flyes',            sets: '3', reps: '12-15', rest: '60s', emoji: '🎯' },
        { name: 'Shoulder Press',         sets: '4', reps: '8-10',  rest: '90s', emoji: '⬆️' },
        { name: 'Tricep Dips',            sets: '3', reps: '10-12', rest: '60s', emoji: '💥' },
      ],
    },
    {
      id: 2, name: 'Fat Loss Circuit', goal: 'Weight Loss',
      assignedTo: ['Priya Nair', 'Rahul Mehta', 'Kavita Desai'],
      days: 'Mon / Tue / Thu / Fri', level: 'Beginner', color: Colors.orange, emoji: '🔥', weeks: 8,
      exercises: [
        { name: 'Jump Squats',       sets: '3', reps: '15',  rest: '45s', emoji: '🦵' },
        { name: 'Burpees',           sets: '3', reps: '10',  rest: '60s', emoji: '🔥' },
        { name: 'Mountain Climbers', sets: '3', reps: '20',  rest: '45s', emoji: '🧗' },
        { name: 'Kettlebell Swings', sets: '4', reps: '12',  rest: '60s', emoji: '⚡' },
        { name: 'Plank Hold',        sets: '3', reps: '45s', rest: '30s', emoji: '🧱' },
      ],
    },
    {
      id: 3, name: 'Yoga & Flexibility', goal: 'Flexibility & Recovery',
      assignedTo: ['Sneha Patel', 'Meena Joshi'],
      days: 'Tue / Thu / Sun', level: 'All Levels', color: '#8B5CF6', emoji: '🧘', weeks: 6,
      exercises: [
        { name: 'Sun Salutation',     sets: '3', reps: '5 rounds', rest: '30s', emoji: '🌅' },
        { name: 'Downward Dog',       sets: '1', reps: '60s hold', rest: '15s', emoji: '🧘' },
        { name: 'Warrior Pose',       sets: '2', reps: '45s each', rest: '15s', emoji: '⚔️' },
        { name: 'Hip Flexor Stretch', sets: '2', reps: '60s each', rest: '10s', emoji: '🦵' },
        { name: "Child's Pose",       sets: '1', reps: '90s hold', rest: '0s',  emoji: '🙏' },
      ],
    },
    {
      id: 4, name: 'Strength Foundations', goal: 'General Fitness',
      assignedTo: ['Vikram Rao'],
      days: 'Mon / Wed / Fri', level: 'Beginner', color: Colors.green, emoji: '🏗️', weeks: 6,
      exercises: [
        { name: 'Goblet Squat',     sets: '3', reps: '12',     rest: '75s', emoji: '🦵' },
        { name: 'Dumbbell Row',     sets: '3', reps: '10 ea',  rest: '60s', emoji: '💪' },
        { name: 'Push-Ups',         sets: '3', reps: '12-15',  rest: '60s', emoji: '🔥' },
        { name: 'Romanian Deadlift',sets: '3', reps: '10',     rest: '75s', emoji: '🏋️'  },
        { name: 'Plank',            sets: '3', reps: '30-45s', rest: '30s', emoji: '🧱' },
      ],
    },
  ];

  const levelColor: Record<string, string> = {
    Beginner: Colors.green, Intermediate: Colors.orange,
    Advanced: Colors.red,   'All Levels': Colors.accent,
  };

  const goalOptions  = ['Muscle Gain', 'Weight Loss', 'Endurance', 'General Fitness'];
  const levelOptions = ['Beginner', 'Intermediate', 'Advanced'];
  const daysOptions  = ['3', '4', '5', '6'];

  const totalMembers   = [...new Set(plans.flatMap(p => p.assignedTo))].length;
  const totalExercises = plans.reduce((a, p) => a + p.exercises.length, 0);

  export default function WorkoutPlansScreen() {
    const [expandedPlan, setExpandedPlan] = useState<number | null>(null);

    // AI states
    const [showAI, setShowAI]               = useState(false);
    const [clientName, setClientName]       = useState('');
    const [selectedGoal, setSelectedGoal]   = useState('Muscle Gain');
    const [selectedLevel, setSelectedLevel] = useState('Intermediate');
    const [selectedDays, setSelectedDays]   = useState('4');
    const [aiPlan, setAiPlan]               = useState<string | null>(null);
    const [aiLoading, setAiLoading]         = useState(false);

    const handleGeneratePlan = async () => {
      if (!clientName.trim()) {
        Alert.alert('Client name required', 'Enter the client name to personalise the plan');
        return;
      }
      setAiLoading(true);
      setAiPlan(null);
      try {
        const text = await askAI('trainer_workout_plan', {
          clientName: clientName.trim(),
          goal:       selectedGoal,
          level:      selectedLevel,
          days:       selectedDays,
        });
        setAiPlan(text);
      } catch {
        Alert.alert('Error', 'Could not generate workout plan');
      }
      setAiLoading(false);
    };

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Stats */}
        <FadeInView delay={0}>
          <View style={styles.statsRow}>
            {[
              { emoji: '📋', val: plans.length,  label: 'PLANS'     },
              { emoji: '👥', val: totalMembers,   label: 'MEMBERS'   },
              { emoji: '💪', val: totalExercises, label: 'EXERCISES' },
            ].map(s => (
              <View key={s.label} style={styles.statBox}>
                <Text style={styles.statEmoji}>{s.emoji}</Text>
                <Text style={styles.statVal}>{s.val}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </FadeInView>

        {/* Create Button */}
        <FadeInView delay={60}>
          <AnimatedPressable
            style={styles.createBtn}
            scaleDown={0.97}
            onPress={() => Alert.alert('Create Plan', 'Plan builder coming soon!')}
          >
            <MaterialCommunityIcons name="plus-circle-outline" size={20} color={Colors.accent} />
            <Text style={styles.createBtnText}>CREATE NEW WORKOUT PLAN</Text>
          </AnimatedPressable>
        </FadeInView>

        {/* AI Plan Generator */}
        <FadeInView delay={100}>
          <View style={styles.aiCard}>
            <View style={styles.aiCardGlow} />
            <TouchableOpacity style={styles.aiCardHeader} onPress={() => setShowAI(!showAI)}>
              <View style={styles.aiCardLeft}>
                <MaterialCommunityIcons name="robot-outline" size={16} color={Colors.accent} />
                <Text style={styles.aiCardLabel}>AI PLAN GENERATOR</Text>
              </View>
              <MaterialCommunityIcons
                name={showAI ? 'chevron-up' : 'chevron-down'}
                size={18} color={Colors.textMuted}
              />
            </TouchableOpacity>

            {showAI && (
              <View style={styles.aiCardBody}>
                <Text style={styles.aiPickerLabel}>CLIENT NAME</Text>
                <TextInput
                  style={styles.aiInput}
                  placeholder="e.g. Rahul Sharma"
                  placeholderTextColor={Colors.textMuted}
                  value={clientName}
                  onChangeText={setClientName}
                />

                <Text style={styles.aiPickerLabel}>GOAL</Text>
                <View style={styles.chipRow}>
                  {goalOptions.map(g => (
                    <TouchableOpacity
                      key={g}
                      style={[styles.chip, selectedGoal === g && styles.chipActive]}
                      onPress={() => setSelectedGoal(g)}
                    >
                      <Text style={[styles.chipText, selectedGoal === g && styles.chipTextActive]}>{g}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.aiPickerLabel}>FITNESS LEVEL</Text>
                <View style={styles.chipRow}>
                  {levelOptions.map(l => (
                    <TouchableOpacity
                      key={l}
                      style={[styles.chip, selectedLevel === l && styles.chipActive]}
                      onPress={() => setSelectedLevel(l)}
                    >
                      <Text style={[styles.chipText, selectedLevel === l && styles.chipTextActive]}>{l}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.aiPickerLabel}>DAYS PER WEEK</Text>
                <View style={styles.chipRow}>
                  {daysOptions.map(d => (
                    <TouchableOpacity
                      key={d}
                      style={[styles.chip, selectedDays === d && styles.chipActive]}
                      onPress={() => setSelectedDays(d)}
                    >
                      <Text style={[styles.chipText, selectedDays === d && styles.chipTextActive]}>{d} days</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <AnimatedPressable style={styles.generateBtn} scaleDown={0.97} onPress={handleGeneratePlan} disabled={aiLoading}> 
                  {aiLoading
                    ? <ActivityIndicator size="small" color="#FFF" />
                    : <>
                        <MaterialCommunityIcons name="lightning-bolt" size={15} color="#FFF" />
                        <Text style={styles.generateBtnText}>GENERATE PLAN</Text>
                      </>
                  }
                </AnimatedPressable>

                {aiPlan && (
                  <View style={styles.aiResult}>
                    <Text style={styles.aiResultText}>{aiPlan}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </FadeInView>

        {/* Plans */}
        {plans.map((plan, i) => {
          const isOpen   = expandedPlan === plan.id;
          const lvlColor = levelColor[plan.level];
          return (
            <FadeInView key={plan.id} delay={160 + i * 65}>
              <View style={[styles.planCard, isOpen && { borderColor: plan.color + '50' }]}>
                <View style={[styles.planBar, { backgroundColor: isOpen ? plan.color : Colors.border }]} />
                <View style={styles.planBody}>

                  <AnimatedPressable style={styles.planHeader} scaleDown={0.98} onPress={() => setExpandedPlan(isOpen ? null :    
  plan.id)}>
                    <View style={[styles.planIcon, { backgroundColor: plan.color + '18' }]}>
                      <Text style={styles.planEmoji}>{plan.emoji}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.planName, isOpen && { color: plan.color }]}>{plan.name}</Text>
                      <Text style={styles.planGoal}>{plan.goal}</Text>
                    </View>
                    <MaterialCommunityIcons name={isOpen ? 'chevron-up' : 'chevron-down'} size={20} color={Colors.textMuted} />   
                  </AnimatedPressable>

                  <View style={styles.planMeta}>
                    <View style={[styles.levelBadge, { backgroundColor: lvlColor + '18', borderColor: lvlColor + '40' }]}>        
                      <Text style={[styles.levelText, { color: lvlColor }]}>{plan.level.toUpperCase()}</Text>
                    </View>
                    <View style={styles.metaChip}><Text style={styles.metaText}>📅 {plan.days}</Text></View>
                    <View style={styles.metaChip}><Text style={styles.metaText}>⏱ {plan.weeks}w</Text></View>
                  </View>

                  <View style={styles.assignedRow}>
                    <Text style={styles.assignedLabel}>ASSIGNED TO</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                      {plan.assignedTo.map(name => (
                        <View key={name} style={[styles.memberChip, { borderColor: plan.color + '40' }]}>
                          <Text style={[styles.memberChipText, { color: plan.color }]}>{name}</Text>
                        </View>
                      ))}
                    </ScrollView>
                  </View>

                  {isOpen && (
                    <View style={styles.exercisesSection}>
                      <View style={styles.exercisesHeader}>
                        <Text style={styles.exercisesTitle}>EXERCISES</Text>
                        <Text style={styles.exercisesCount}>{plan.exercises.length} total</Text>
                      </View>

                      <View style={styles.tableHeader}>
                        <Text style={[styles.thText, { flex: 2, textAlign: 'left' }]}>EXERCISE</Text>
                        <Text style={styles.thText}>SETS</Text>
                        <Text style={styles.thText}>REPS</Text>
                        <Text style={styles.thText}>REST</Text>
                      </View>

                      {plan.exercises.map((ex, ei) => (
                        <View key={ei} style={[styles.exRow, ei % 2 === 1 && styles.exRowAlt]}>
                          <View style={[styles.exNameCol, { flex: 2 }]}>
                            <Text style={styles.exEmoji}>{ex.emoji}</Text>
                            <Text style={styles.exName} numberOfLines={1}>{ex.name}</Text>
                          </View>
                          <Text style={styles.exCell}>{ex.sets}</Text>
                          <Text style={styles.exCell}>{ex.reps}</Text>
                          <Text style={styles.exCell}>{ex.rest}</Text>
                        </View>
                      ))}

                      <View style={styles.planActions}>
                        <AnimatedPressable style={styles.editBtn} scaleDown={0.95} onPress={() => Alert.alert('Edit Plan',        
  `Editing "${plan.name}"...`)}>
                          <MaterialCommunityIcons name="pencil-outline" size={15} color={Colors.accent} />
                          <Text style={styles.editBtnText}>EDIT</Text>
                        </AnimatedPressable>
                        <AnimatedPressable style={styles.assignBtn} scaleDown={0.95} onPress={() => Alert.alert('Assign Plan',    
  `Assigning "${plan.name}" to member...`)}>
                          <MaterialCommunityIcons name="account-plus-outline" size={15} color="#FFF" />
                          <Text style={styles.assignBtnText}>ASSIGN MEMBER</Text>
                        </AnimatedPressable>
                      </View>
                    </View>
                  )}
                </View>
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
    content:   { padding: 16, gap: 12 },

    statsRow:   { flexDirection: 'row', gap: 8 },
    statBox:    { flex: 1, alignItems: 'center', gap: 4, backgroundColor: Colors.bgCard, borderRadius: 12, paddingVertical: 14,   
  borderWidth: 1, borderColor: Colors.border },
    statEmoji:  { fontSize: 18 },
    statVal:    { fontSize: 22, fontFamily: Fonts.condensedBold, color: Colors.text },
    statLabel:  { fontSize: 8, fontFamily: Fonts.bold, color: Colors.textMuted, letterSpacing: 1.2 },

    createBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14,
  borderRadius: 14, borderWidth: 1, borderColor: Colors.accent + '50', borderStyle: 'dashed', backgroundColor: Colors.accentMuted 
  },
    createBtnText: { fontSize: 12, fontFamily: Fonts.bold, color: Colors.accent, letterSpacing: 1.2 },

    // AI card
    aiCard:       { backgroundColor: Colors.bgCard, borderRadius: 18, borderWidth: 1, borderColor: Colors.accent + '30', overflow:
   'hidden' },
    aiCardGlow:   { position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: 40, backgroundColor:
  Colors.accentGlow },
    aiCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
    aiCardLeft:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
    aiCardLabel:  { fontFamily: Fonts.bold, fontSize: 10, color: Colors.accent, letterSpacing: 1.5 },
    aiCardBody:   { paddingHorizontal: 16, paddingBottom: 16, gap: 10 },

    aiPickerLabel: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted, letterSpacing: 1.5 },
    aiInput:       { backgroundColor: Colors.bgElevated, borderRadius: 10, padding: 12, fontFamily: Fonts.medium, fontSize: 14,   
  color: Colors.text, borderWidth: 1, borderColor: Colors.border },
    chipRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip:          { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: Colors.bgElevated, borderWidth:
   1, borderColor: Colors.border },
    chipActive:    { backgroundColor: Colors.accentMuted, borderColor: Colors.accent },
    chipText:      { fontFamily: Fonts.medium, fontSize: 12, color: Colors.textMuted },
    chipTextActive:{ color: Colors.accent, fontFamily: Fonts.bold },

    generateBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor:
  Colors.accent, borderRadius: 12, paddingVertical: 14, marginTop: 4 },
    generateBtnText: { fontFamily: Fonts.bold, fontSize: 12, color: '#FFF', letterSpacing: 1 },

    aiResult:     { backgroundColor: Colors.bgElevated, borderRadius: 12, padding: 14, borderLeftWidth: 3, borderLeftColor:       
  Colors.accent },
    aiResultText: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.text, lineHeight: 20 },

    planCard:  { flexDirection: 'row', backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor:
  Colors.border, overflow: 'hidden' },
    planBar:   { width: 3 },
    planBody:  { flex: 1 },
    planHeader:{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
    planIcon:  { width: 46, height: 46, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    planEmoji: { fontSize: 22 },
    planName:  { fontSize: 15, fontFamily: Fonts.bold, color: Colors.text },
    planGoal:  { fontSize: 11, fontFamily: Fonts.regular, color: Colors.textMuted, marginTop: 2 },

    planMeta:   { flexDirection: 'row', gap: 7, paddingHorizontal: 14, paddingBottom: 10, flexWrap: 'wrap' },
    levelBadge: { borderRadius: 7, paddingHorizontal: 9, paddingVertical: 4, borderWidth: 1 },
    levelText:  { fontSize: 9, fontFamily: Fonts.bold, letterSpacing: 1 },
    metaChip:   { backgroundColor: Colors.bgElevated, borderRadius: 7, paddingHorizontal: 9, paddingVertical: 4 },
    metaText:   { fontSize: 11, fontFamily: Fonts.medium, color: Colors.textMuted },

    assignedRow:     { paddingHorizontal: 14, paddingBottom: 14, gap: 7 },
    assignedLabel:   { fontSize: 9, fontFamily: Fonts.bold, color: Colors.textMuted, letterSpacing: 1.3 },
    memberChip:      { backgroundColor: Colors.bgElevated, borderRadius: 20, paddingHorizontal: 11, paddingVertical: 5,
  borderWidth: 1 },
    memberChipText:  { fontSize: 11, fontFamily: Fonts.bold },

    exercisesSection:{ borderTopWidth: 1, borderTopColor: Colors.border, padding: 14, gap: 8 },
    exercisesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    exercisesTitle:  { fontSize: 11, fontFamily: Fonts.bold, color: Colors.accent, letterSpacing: 1.5 },
    exercisesCount:  { fontSize: 11, fontFamily: Fonts.regular, color: Colors.textMuted },

    tableHeader: { flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 4 },
    thText:      { flex: 1, fontSize: 9, fontFamily: Fonts.bold, color: Colors.textMuted, textAlign: 'center', letterSpacing: 1 },

    exRow:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, paddingHorizontal: 4, borderRadius: 8 },
    exRowAlt:  { backgroundColor: Colors.bgElevated },
    exNameCol: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    exEmoji:   { fontSize: 15 },
    exName:    { flex: 1, fontSize: 12, fontFamily: Fonts.medium, color: Colors.text },
    exCell:    { flex: 1, fontSize: 12, fontFamily: Fonts.condensedBold, color: Colors.text, textAlign: 'center' },

    planActions:   { flexDirection: 'row', gap: 10, marginTop: 4 },
    editBtn:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11,  
  borderRadius: 10, borderWidth: 1, borderColor: Colors.accent + '50', backgroundColor: Colors.accentMuted },
    editBtnText:   { fontFamily: Fonts.bold, fontSize: 11, color: Colors.accent, letterSpacing: 0.8 },
    assignBtn:     { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11,  
  borderRadius: 10, backgroundColor: Colors.accent },
    assignBtnText: { fontFamily: Fonts.bold, fontSize: 11, color: '#FFF', letterSpacing: 0.8 },
  });
