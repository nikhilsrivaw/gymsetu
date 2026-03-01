import { useState } from 'react';                                  import { View, Text, StyleSheet, ScrollView, TextInput, Alert }
  from 'react-native';                                               import { Stack } from 'expo-router';                             
  import { MaterialCommunityIcons } from '@expo/vector-icons';     
  import { Colors } from '@/constants/colors';                     
  import AnimatedPressable from '@/components/AnimatedPressable';
  import FadeInView from '@/components/FadeInView';

  interface Set {
    reps: string;
    weight: string;
    done: boolean;
  }

  interface Exercise {
    id: number;
    name: string;
    sets: Set[];
  }

  const defaultExercises: Exercise[] = [
    { id: 1, name: 'Bench Press', sets: [{ reps: '10', weight:     
  '60', done: false }, { reps: '8', weight: '65', done: false }] },
    { id: 2, name: 'Squats', sets: [{ reps: '10', weight: '80',    
  done: false }, { reps: '8', weight: '85', done: false }] },      
  ];

  export default function WorkoutTrackerScreen() {
    const [exercises, setExercises] =
  useState<Exercise[]>(defaultExercises);
    const [newName, setNewName] = useState('');
    const [showAdd, setShowAdd] = useState(false);

    const toggleSet = (exIdx: number, setIdx: number) => {
      setExercises(prev => prev.map((ex, ei) =>
        ei === exIdx
          ? { ...ex, sets: ex.sets.map((s, si) => si === setIdx ? {
   ...s, done: !s.done } : s) }
          : ex
      ));
    };

    const updateSet = (exIdx: number, setIdx: number, field: 'reps'
   | 'weight', val: string) => {
      setExercises(prev => prev.map((ex, ei) =>
        ei === exIdx
          ? { ...ex, sets: ex.sets.map((s, si) => si === setIdx ? {
   ...s, [field]: val } : s) }
          : ex
      ));
    };

    const addSet = (exIdx: number) => {
      setExercises(prev => prev.map((ex, ei) =>
        ei === exIdx
          ? { ...ex, sets: [...ex.sets, { reps: '10', weight: '0', 
  done: false }] }
          : ex
      ));
    };

    const removeExercise = (exIdx: number) => {
      setExercises(prev => prev.filter((_, ei) => ei !== exIdx));  
    };

    const addExercise = () => {
      if (!newName.trim()) return;
      setExercises(prev => [...prev, {
        id: Date.now(),
        name: newName.trim(),
        sets: [{ reps: '10', weight: '0', done: false }],
      }]);
      setNewName('');
      setShowAdd(false);
    };

    const totalDone = exercises.reduce((acc, ex) => acc +
  ex.sets.filter(s => s.done).length, 0);
    const totalSets = exercises.reduce((acc, ex) => acc +
  ex.sets.length, 0);

    return (
      <>
        <Stack.Screen options={{ title: '📝 Workout Tracker' }} /> 
        <ScrollView style={styles.container}
  contentContainerStyle={styles.content}
  keyboardShouldPersistTaps="handled">

          {/* Progress Bar */}
          <FadeInView delay={0}>
            <View style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressTitle}>Today's
  Workout</Text>
                <Text style={styles.progressCount}>{totalDone} /   
  {totalSets} sets</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width:        
  totalSets ? `${(totalDone / totalSets) * 100}%` as any : '0%' }]}
   />
              </View>
              {totalDone === totalSets && totalSets > 0 && (       
                <Text style={styles.completedText}>🎉 Workout      
  Complete! Great job!</Text>
              )}
            </View>
          </FadeInView>

          {/* Exercises */}
          {exercises.map((ex, exIdx) => (
            <FadeInView key={ex.id} delay={60 + exIdx * 80}>       
              <View style={styles.exCard}>
                <View style={styles.exHeader}>
                  <Text style={styles.exName}>💪 {ex.name}</Text>  
                  <AnimatedPressable onPress={() =>
  removeExercise(exIdx)} scaleDown={0.9}>
                    <MaterialCommunityIcons
  name="trash-can-outline" size={18} color={Colors.red} />
                  </AnimatedPressable>
                </View>

                {/* Set Headers */}
                <View style={styles.setHeaderRow}>
                  <Text style={[styles.setHeaderText, { width: 36  
  }]}>SET</Text>
                  <Text style={[styles.setHeaderText, { flex: 1    
  }]}>REPS</Text>
                  <Text style={[styles.setHeaderText, { flex: 1    
  }]}>KG</Text>
                  <Text style={[styles.setHeaderText, { width: 40 
  }]}>DONE</Text>
                </View>

                {ex.sets.map((s, setIdx) => (
                  <View key={setIdx} style={[styles.setRow, s.done 
  && styles.setRowDone]}>
                    <Text style={styles.setNum}>{setIdx + 1}</Text>
                    <TextInput
                      style={styles.setInput}
                      value={s.reps}
                      onChangeText={v => updateSet(exIdx, setIdx,  
  'reps', v)}
                      keyboardType="numeric"
                      selectTextOnFocus
                    />
                    <TextInput
                      style={styles.setInput}
                      value={s.weight}
                      onChangeText={v => updateSet(exIdx, setIdx,  
  'weight', v)}
                      keyboardType="numeric"
                      selectTextOnFocus
                    />
                    <AnimatedPressable onPress={() =>
  toggleSet(exIdx, setIdx)} scaleDown={0.85}>
                      <MaterialCommunityIcons
                        name={s.done ? 'check-circle' :
  'check-circle-outline'}
                        size={26}
                        color={s.done ? Colors.green :
  Colors.border}
                      />
                    </AnimatedPressable>
                  </View>
                ))}

                <AnimatedPressable style={styles.addSetBtn}        
  scaleDown={0.97} onPress={() => addSet(exIdx)}>
                  <MaterialCommunityIcons name="plus" size={16}    
  color={Colors.accent} />
                  <Text style={styles.addSetText}>Add Set</Text>   
                </AnimatedPressable>
              </View>
            </FadeInView>
          ))}

          {/* Add Exercise */}
          {showAdd ? (
            <FadeInView delay={0}>
              <View style={styles.addCard}>
                <Text style={styles.addCardTitle}>➕ New
  Exercise</Text>
                <TextInput
                  style={styles.addInput}
                  placeholder="Exercise name (e.g. Deadlift)"      
                  placeholderTextColor={Colors.textMuted}
                  value={newName}
                  onChangeText={setNewName}
                  autoFocus
                />
                <View style={styles.addCardBtns}>
                  <AnimatedPressable style={styles.cancelBtn}      
  scaleDown={0.97} onPress={() => setShowAdd(false)}>
                    <Text
  style={styles.cancelBtnText}>Cancel</Text>
                  </AnimatedPressable>
                  <AnimatedPressable style={styles.confirmBtn}     
  scaleDown={0.97} onPress={addExercise}>
                    <Text style={styles.confirmBtnText}>Add</Text> 
                  </AnimatedPressable>
                </View>
              </View>
            </FadeInView>
          ) : (
            <AnimatedPressable style={styles.addExBtn}
  scaleDown={0.97} onPress={() => setShowAdd(true)}>
              <MaterialCommunityIcons name="plus-circle-outline"   
  size={20} color={Colors.accent} />
              <Text style={styles.addExText}>Add Exercise</Text>   
            </AnimatedPressable>
          )}

          {/* Finish Button */}
          <AnimatedPressable
            style={styles.finishBtn}
            scaleDown={0.97}
            onPress={() => Alert.alert('Workout Saved! 💪', `You   
  completed ${totalDone} sets today. Keep it up!`)}
          >
            <Text style={styles.finishText}>🏁 Finish
  Workout</Text>
          </AnimatedPressable>

          <View style={{ height: 24 }} />
        </ScrollView>
      </>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    content: { padding: 16, gap: 12 },

    progressCard: { backgroundColor: Colors.bgCard, borderRadius:  
  16, padding: 16, borderWidth: 1, borderColor: Colors.border, gap:
   10 },
    progressHeader: { flexDirection: 'row', justifyContent:        
  'space-between' },
    progressTitle: { fontSize: 15, fontWeight: '700', color:       
  Colors.text },
    progressCount: { fontSize: 14, fontWeight: '600', color:       
  Colors.accent },
    progressBar: { height: 8, backgroundColor: Colors.border,      
  borderRadius: 4, overflow: 'hidden' },
    progressFill: { height: 8, backgroundColor: Colors.accent,     
  borderRadius: 4 },
    completedText: { fontSize: 13, color: Colors.green, fontWeight:
   '600', textAlign: 'center' },

    exCard: { backgroundColor: Colors.bgCard, borderRadius: 16,    
  padding: 14, borderWidth: 1, borderColor: Colors.border, gap: 8  
  },
    exHeader: { flexDirection: 'row', justifyContent:
  'space-between', alignItems: 'center' },
    exName: { fontSize: 15, fontWeight: '700', color: Colors.text  
  },

    setHeaderRow: { flexDirection: 'row', alignItems: 'center',    
  gap: 8, paddingHorizontal: 4 },
    setHeaderText: { fontSize: 10, fontWeight: '700', color:       
  Colors.textMuted, textAlign: 'center' },

    setRow: { flexDirection: 'row', alignItems: 'center', gap: 8,  
  paddingHorizontal: 4, paddingVertical: 4, borderRadius: 8 },     
    setRowDone: { backgroundColor: Colors.green + '10' },
    setNum: { width: 28, fontSize: 13, fontWeight: '600', color:   
  Colors.textMuted, textAlign: 'center' },
    setInput: {
      flex: 1, backgroundColor: Colors.bgElevated, borderRadius: 8,
   paddingVertical: 6,
      paddingHorizontal: 10, fontSize: 14, fontWeight: '600',      
  color: Colors.text,
      borderWidth: 1, borderColor: Colors.border, textAlign:       
  'center',
    },

    addSetBtn: { flexDirection: 'row', alignItems: 'center', gap:  
  6, justifyContent: 'center', paddingVertical: 8, borderRadius: 8,
   borderWidth: 1, borderColor: Colors.accent + '40', borderStyle: 
  'dashed' },
    addSetText: { fontSize: 13, fontWeight: '600', color:
  Colors.accent },

    addCard: { backgroundColor: Colors.bgCard, borderRadius: 16,   
  padding: 16, borderWidth: 1, borderColor: Colors.border, gap: 12 
  },
    addCardTitle: { fontSize: 15, fontWeight: '700', color:        
  Colors.text },
    addInput: { backgroundColor: Colors.bgElevated, borderRadius:  
  10, padding: 12, fontSize: 14, color: Colors.text, borderWidth:  
  1, borderColor: Colors.border },
    addCardBtns: { flexDirection: 'row', gap: 10 },
    cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10,   
  backgroundColor: Colors.bgElevated, alignItems: 'center',        
  borderWidth: 1, borderColor: Colors.border },
    cancelBtnText: { fontSize: 14, fontWeight: '600', color:       
  Colors.textMuted },
    confirmBtn: { flex: 1, paddingVertical: 12, borderRadius: 10,  
  backgroundColor: Colors.accent, alignItems: 'center' },
    confirmBtnText: { fontSize: 14, fontWeight: '600', color:      
  '#FFF' },

    addExBtn: { flexDirection: 'row', alignItems: 'center',        
  justifyContent: 'center', gap: 8, paddingVertical: 14,
  borderRadius: 12, borderWidth: 1, borderColor: Colors.accent +   
  '50', borderStyle: 'dashed' },
    addExText: { fontSize: 14, fontWeight: '600', color:
  Colors.accent },

    finishBtn: { backgroundColor: Colors.accent, borderRadius: 14, 
  paddingVertical: 16, alignItems: 'center' },
    finishText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  });