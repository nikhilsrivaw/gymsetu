 import { useState } from 'react';
  import { View, Text, StyleSheet, ScrollView, TextInput, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
  import { Stack } from 'expo-router';
  import { MaterialCommunityIcons } from '@expo/vector-icons';
  import { Colors } from '@/constants/colors';
  import { Fonts } from '@/constants/fonts';
  import AnimatedPressable from '@/components/AnimatedPressable';
  import FadeInView from '@/components/FadeInView';                                                                                 import { askAI } from '@/lib/ai';
                                                                                                                                  
  interface Set { reps: string; weight: string; done: boolean; }
  interface Exercise { id: number; name: string; sets: Set[]; }

  const defaultExercises: Exercise[] = [
    { id: 1, name: 'Bench Press', sets: [{ reps: '10', weight: '60', done: false }, { reps: '8', weight: '65', done: false }] },  
    { id: 2, name: 'Squats',      sets: [{ reps: '10', weight: '80', done: false }, { reps: '8', weight: '85', done: false }] },  
  ];

  const goalOptions    = ['Weight Loss', 'Muscle Gain', 'Endurance', 'General Fitness'];
  const levelOptions   = ['Beginner', 'Intermediate', 'Advanced'];
  const daysOptions    = ['3', '4', '5', '6'];

  export default function WorkoutTrackerScreen() {
    const [exercises, setExercises] = useState<Exercise[]>(defaultExercises);
    const [newName, setNewName]     = useState('');
    const [showAdd, setShowAdd]     = useState(false);

    // AI Plan states
    const [showAIPlan, setShowAIPlan]   = useState(false);
    const [selectedGoal, setSelectedGoal]   = useState('Muscle Gain');
    const [selectedLevel, setSelectedLevel] = useState('Intermediate');
    const [selectedDays, setSelectedDays]   = useState('4');
    const [aiPlan, setAiPlan]               = useState<string | null>(null);
    const [aiPlanLoading, setAiPlanLoading] = useState(false);

    const toggleSet = (exIdx: number, setIdx: number) => {
      setExercises(prev => prev.map((ex, ei) =>
        ei === exIdx ? { ...ex, sets: ex.sets.map((s, si) => si === setIdx ? { ...s, done: !s.done } : s) } : ex
      ));
    };

    const updateSet = (exIdx: number, setIdx: number, field: 'reps' | 'weight', val: string) => {
      setExercises(prev => prev.map((ex, ei) =>
        ei === exIdx ? { ...ex, sets: ex.sets.map((s, si) => si === setIdx ? { ...s, [field]: val } : s) } : ex
      ));
    };

    const addSet = (exIdx: number) => {
      setExercises(prev => prev.map((ex, ei) =>
        ei === exIdx ? { ...ex, sets: [...ex.sets, { reps: '10', weight: '0', done: false }] } : ex
      ));
    };

    const removeExercise = (exIdx: number) => {
      setExercises(prev => prev.filter((_, ei) => ei !== exIdx));
    };

    const addExercise = () => {
      if (!newName.trim()) return;
      setExercises(prev => [...prev, { id: Date.now(), name: newName.trim(), sets: [{ reps: '10', weight: '0', done: false }] }]);
      setNewName('');
      setShowAdd(false);
    };

    const handleGeneratePlan = async () => {
      setAiPlanLoading(true);
      setAiPlan(null);
      try {
        const text = await askAI('workout_plan', {
          goal:  selectedGoal,
          level: selectedLevel,
          days:  selectedDays,
        });
        setAiPlan(text);
      } catch {
        Alert.alert('Error', 'Could not generate workout plan');
      }
      setAiPlanLoading(false);
    };

    const totalDone = exercises.reduce((acc, ex) => acc + ex.sets.filter(s => s.done).length, 0);
    const totalSets = exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
    const pct       = totalSets ? Math.round((totalDone / totalSets) * 100) : 0;

    return (
      <>
        <Stack.Screen options={{ title: 'Workout Tracker' }} />
        <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {/* Progress Card */}
          <FadeInView delay={0}>
            <View style={styles.progressCard}>
              <View style={styles.progressGlow} />
              <View style={styles.progressHeader}>
                <View>
                  <Text style={styles.progressMicro}>SESSION PROGRESS</Text>
                  <Text style={styles.progressTitle}>TODAY'S WORKOUT</Text>
                </View>
                <View style={styles.pctCircle}>
                  <Text style={styles.pctNum}>{pct}</Text>
                  <Text style={styles.pctSymbol}>%</Text>
                </View>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${pct}%` as any }]} />
              </View>
              <View style={styles.progressMeta}>
                <Text style={styles.progressCount}>
                  <Text style={styles.progressCountNum}>{totalDone}</Text>
                  <Text style={styles.progressCountDenom}> / {totalSets} sets complete</Text>
                </Text>
                {totalDone === totalSets && totalSets > 0 && (
                  <Text style={styles.completedText}>WORKOUT COMPLETE</Text>
                )}
              </View>
            </View>
          </FadeInView>

          {/* AI Workout Plan Card */}
          <FadeInView delay={60}>
            <View style={styles.aiCard}>
              <View style={styles.aiCardGlow} />
              <TouchableOpacity style={styles.aiCardHeader} onPress={() => setShowAIPlan(!showAIPlan)}>
                <View style={styles.aiCardLeft}>
                  <MaterialCommunityIcons name="robot-outline" size={16} color={Colors.accent} />
                  <Text style={styles.aiCardLabel}>AI WORKOUT PLAN</Text>
                </View>
                <MaterialCommunityIcons
                  name={showAIPlan ? 'chevron-up' : 'chevron-down'}
                  size={18} color={Colors.textMuted}
                />
              </TouchableOpacity>

              {showAIPlan && (
                <View style={styles.aiCardBody}>
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

                  <AnimatedPressable style={styles.generateBtn} scaleDown={0.97} onPress={handleGeneratePlan}
  disabled={aiPlanLoading}>
                    {aiPlanLoading
                      ? <ActivityIndicator size="small" color="#FFF" />
                      : <>
                          <MaterialCommunityIcons name="lightning-bolt" size={15} color="#FFF" />
                          <Text style={styles.generateBtnText}>GENERATE MY PLAN</Text>
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

          {/* Exercise Cards */}
          {exercises.map((ex, exIdx) => (
            <FadeInView key={ex.id} delay={120 + exIdx * 80}>
              <View style={styles.exCard}>
                <View style={styles.accentBar} />
                <View style={styles.exHeader}>
                  <Text style={styles.exName}>{ex.name.toUpperCase()}</Text>
                  <AnimatedPressable onPress={() => removeExercise(exIdx)} scaleDown={0.9}>
                    <MaterialCommunityIcons name="trash-can-outline" size={18} color={Colors.red} />
                  </AnimatedPressable>
                </View>

                <View style={styles.setHeaderRow}>
                  <Text style={[styles.setHeaderText, { width: 32 }]}>#</Text>
                  <Text style={[styles.setHeaderText, { flex: 1 }]}>REPS</Text>
                  <Text style={[styles.setHeaderText, { flex: 1 }]}>KG</Text>
                  <Text style={[styles.setHeaderText, { width: 44 }]}>DONE</Text>
                </View>

                {ex.sets.map((s, setIdx) => (
                  <View key={setIdx} style={[styles.setRow, s.done && styles.setRowDone]}>
                    <Text style={styles.setNum}>{setIdx + 1}</Text>
                    <TextInput
                      style={[styles.setInput, s.done && styles.setInputDone]}
                      value={s.reps}
                      onChangeText={v => updateSet(exIdx, setIdx, 'reps', v)}
                      keyboardType="numeric"
                      selectTextOnFocus
                    />
                    <TextInput
                      style={[styles.setInput, s.done && styles.setInputDone]}
                      value={s.weight}
                      onChangeText={v => updateSet(exIdx, setIdx, 'weight', v)}
                      keyboardType="numeric"
                      selectTextOnFocus
                    />
                    <AnimatedPressable onPress={() => toggleSet(exIdx, setIdx)} scaleDown={0.85}>
                      <MaterialCommunityIcons
                        name={s.done ? 'check-circle' : 'check-circle-outline'}
                        size={28}
                        color={s.done ? Colors.accent : Colors.textMuted}
                      />
                    </AnimatedPressable>
                  </View>
                ))}

                <AnimatedPressable style={styles.addSetBtn} scaleDown={0.97} onPress={() => addSet(exIdx)}>
                  <MaterialCommunityIcons name="plus" size={14} color={Colors.accent} />
                  <Text style={styles.addSetText}>ADD SET</Text>
                </AnimatedPressable>
              </View>
            </FadeInView>
          ))}

          {/* Add Exercise */}
          {showAdd ? (
            <FadeInView delay={0}>
              <View style={styles.addCard}>
                <Text style={styles.addCardTitle}>NEW EXERCISE</Text>
                <TextInput
                  style={styles.addInput}
                  placeholder="Exercise name (e.g. Deadlift)"
                  placeholderTextColor={Colors.textMuted}
                  value={newName}
                  onChangeText={setNewName}
                  autoFocus
                />
                <View style={styles.addCardBtns}>
                  <AnimatedPressable style={styles.cancelBtn} scaleDown={0.97} onPress={() => setShowAdd(false)}>
                    <Text style={styles.cancelBtnText}>CANCEL</Text>
                  </AnimatedPressable>
                  <AnimatedPressable style={styles.confirmBtn} scaleDown={0.97} onPress={addExercise}>
                    <Text style={styles.confirmBtnText}>ADD</Text>
                  </AnimatedPressable>
                </View>
              </View>
            </FadeInView>
          ) : (
            <AnimatedPressable style={styles.addExBtn} scaleDown={0.97} onPress={() => setShowAdd(true)}>
              <MaterialCommunityIcons name="plus" size={16} color={Colors.accent} />
              <Text style={styles.addExText}>ADD EXERCISE</Text>
            </AnimatedPressable>
          )}

          {/* Finish Button */}
          <AnimatedPressable
            style={styles.finishBtn}
            scaleDown={0.97}
            onPress={() => Alert.alert('Workout Saved', `${totalDone} sets completed. Keep it up!`)}
          >
            <MaterialCommunityIcons name="flag-checkered" size={20} color="#FFF" />
            <Text style={styles.finishText}>FINISH WORKOUT</Text>
          </AnimatedPressable>

          <View style={{ height: 32 }} />
        </ScrollView>
      </>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    content:   { padding: 16, gap: 12 },

    progressCard: {
      backgroundColor: Colors.bgCard, borderRadius: 20, padding: 20,
      gap: 12, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
    },
    progressGlow: {
      position: 'absolute', top: -30, right: -20,
      width: 120, height: 120, borderRadius: 60,
      backgroundColor: Colors.accentGlow,
    },
    progressHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    progressMicro:      { fontFamily: Fonts.medium, fontSize: 9, color: Colors.textMuted, letterSpacing: 1.2 },
    progressTitle:      { fontFamily: Fonts.condensedBold, fontSize: 24, color: Colors.text, letterSpacing: 0.5 },
    pctCircle:          { backgroundColor: Colors.accentMuted, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8,       
  alignItems: 'center', flexDirection: 'row', gap: 2 },
    pctNum:             { fontFamily: Fonts.condensedBold, fontSize: 28, color: Colors.accent },
    pctSymbol:          { fontFamily: Fonts.condensedBold, fontSize: 16, color: Colors.accent },
    progressTrack:      { height: 4, backgroundColor: Colors.border, borderRadius: 2, overflow: 'hidden' },
    progressFill:       { height: 4, backgroundColor: Colors.accent, borderRadius: 2 },
    progressMeta:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    progressCount:      {},
    progressCountNum:   { fontFamily: Fonts.condensedBold, fontSize: 16, color: Colors.text },
    progressCountDenom: { fontFamily: Fonts.medium, fontSize: 12, color: Colors.textMuted },
    completedText:      { fontFamily: Fonts.bold, fontSize: 10, color: Colors.green, letterSpacing: 1 },

    // AI Plan card
    aiCard:       { backgroundColor: Colors.bgCard, borderRadius: 18, borderWidth: 1, borderColor: Colors.accent + '30', overflow:
   'hidden' },
    aiCardGlow:   { position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: 40, backgroundColor:
  Colors.accentGlow },
    aiCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
    aiCardLeft:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
    aiCardLabel:  { fontFamily: Fonts.bold, fontSize: 10, color: Colors.accent, letterSpacing: 1.5 },
    aiCardBody:   { paddingHorizontal: 16, paddingBottom: 16, gap: 10 },

    aiPickerLabel: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted, letterSpacing: 1.5 },
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

    // Exercise card
    exCard:    { backgroundColor: Colors.bgCard, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: Colors.border, gap:  
  8, overflow: 'hidden' },
    accentBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: Colors.accent },
    exHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingLeft: 8 },
    exName:    { fontFamily: Fonts.condensedBold, fontSize: 17, color: Colors.text, letterSpacing: 0.5 },

    setHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 },
    setHeaderText:{ fontFamily: Fonts.medium, fontSize: 9, color: Colors.textMuted, textAlign: 'center', letterSpacing: 0.8 },    

    setRow:       { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4, paddingVertical: 4, borderRadius: 8 
  },
    setRowDone:   { backgroundColor: Colors.accentMuted },
    setNum:       { width: 28, fontFamily: Fonts.condensedBold, fontSize: 14, color: Colors.textMuted, textAlign: 'center' },     
    setInput:     { flex: 1, backgroundColor: Colors.bgElevated, borderRadius: 8, paddingVertical: 7, paddingHorizontal: 8,       
  fontFamily: Fonts.bold, fontSize: 15, color: Colors.text, borderWidth: 1, borderColor: Colors.border, textAlign: 'center' },    
    setInputDone: { borderColor: Colors.accent + '40', color: Colors.accent },

    addSetBtn:  { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', paddingVertical: 8, borderRadius: 
  8, borderWidth: 1, borderColor: Colors.accent + '35', borderStyle: 'dashed' },
    addSetText: { fontFamily: Fonts.bold, fontSize: 11, color: Colors.accent, letterSpacing: 0.8 },

    addCard:      { backgroundColor: Colors.bgCard, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.accent +   
  '30', gap: 12 },
    addCardTitle: { fontFamily: Fonts.condensedBold, fontSize: 16, color: Colors.text, letterSpacing: 0.5 },
    addInput:     { backgroundColor: Colors.bgElevated, borderRadius: 10, padding: 12, fontFamily: Fonts.medium, fontSize: 14,    
  color: Colors.text, borderWidth: 1, borderColor: Colors.border },
    addCardBtns:  { flexDirection: 'row', gap: 10 },
    cancelBtn:    { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: Colors.bgElevated, alignItems: 'center',     
  borderWidth: 1, borderColor: Colors.border },
    cancelBtnText:{ fontFamily: Fonts.bold, fontSize: 12, color: Colors.textMuted, letterSpacing: 0.8 },
    confirmBtn:   { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: Colors.accent, alignItems: 'center' },       
    confirmBtnText:{ fontFamily: Fonts.bold, fontSize: 12, color: '#FFF', letterSpacing: 0.8 },

    addExBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 
  14, borderWidth: 1, borderColor: Colors.accent + '40', borderStyle: 'dashed' },
    addExText: { fontFamily: Fonts.bold, fontSize: 12, color: Colors.accent, letterSpacing: 0.8 },

    finishBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: Colors.green,   
  borderRadius: 14, paddingVertical: 16 },
    finishText: { fontFamily: Fonts.bold, fontSize: 13, color: '#FFF', letterSpacing: 1 },
  });
