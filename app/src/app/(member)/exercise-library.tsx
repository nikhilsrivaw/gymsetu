import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { Colors } from '@/constants/colors';
import AnimatedPressable from '@/components/AnimatedPressable';
import FadeInView from '@/components/FadeInView';

interface Exercise {
  name: string;
  emoji: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  muscle: string;
  steps: string[];
}

interface MuscleGroup {
  label: string;
  emoji: string;
  color: string;
  exercises: Exercise[];
}

const groups: MuscleGroup[] = [
  {
    label: 'Chest', emoji: '💪', color: Colors.red,
    exercises: [
      { name: 'Flat Bench Press', emoji: '🏋️', level: 'Intermediate', muscle: 'Pectorals, Triceps, Shoulders', steps: ['Lie flat on bench, grip bar slightly wider than shoulders', 'Unrack bar and lower slowly to mid-chest', 'Press bar up explosively, fully extend arms', 'Repeat for desired reps — keep feet flat on floor'] },
      { name: 'Push-Ups', emoji: '🔥', level: 'Beginner', muscle: 'Chest, Triceps, Core', steps: ['Start in high plank — hands shoulder-width apart', 'Lower chest to just above the floor', 'Push back up keeping core tight throughout', 'Keep elbows at 45° angle from body'] },
      { name: 'Cable Flyes', emoji: '🎯', level: 'Intermediate', muscle: 'Pectoral Isolation', steps: ['Set cables at shoulder height, stand in center', 'Hold handles with slight bend in elbows', 'Bring hands together in a hugging arc motion', 'Squeeze chest hard at peak, return slowly'] },
    ],
  },
  {
    label: 'Back', emoji: '🔙', color: Colors.accent,
    exercises: [
      { name: 'Deadlift', emoji: '💀', level: 'Advanced', muscle: 'Full Back, Hamstrings, Glutes', steps: ['Stand with feet hip-width, bar over mid-foot', 'Hinge at hips, grip bar just outside legs', 'Keep chest up, back flat — drive through heels', 'Lock hips out at top, lower bar under control'] },
      { name: 'Pull-Ups', emoji: '💪', level: 'Intermediate', muscle: 'Lats, Biceps, Rear Delts', steps: ['Hang from bar with overhand grip, arms fully extended', 'Drive elbows down and back to pull chest to bar', 'Pause briefly at top, lower slowly', 'Avoid swinging or kipping — full control'] },
      { name: 'Barbell Row', emoji: '🏋️', level: 'Intermediate', muscle: 'Middle Back, Lats, Biceps', steps: ['Hinge forward 45°, grip bar shoulder-width', 'Pull bar to lower chest / upper abdomen', 'Squeeze shoulder blades together at top', 'Lower bar slowly — maintain flat back throughout'] },
    ],
  },
  {
    label: 'Legs', emoji: '🦵', color: Colors.green,
    exercises: [
      { name: 'Barbell Squat', emoji: '👑', level: 'Intermediate', muscle: 'Quads, Glutes, Hamstrings', steps: ['Bar on upper traps, feet shoulder-width apart', 'Brace core, break at hips and knees together', 'Lower until thighs are parallel or below', 'Drive through heels to stand — keep chest up'] },
      { name: 'Romanian Deadlift', emoji: '🏋️', level: 'Intermediate', muscle: 'Hamstrings, Glutes', steps: ['Hold bar at hips, slight bend in knees', 'Hinge at hips — push them back behind you', 'Lower bar along legs until hamstrings stretch', 'Squeeze glutes to return to standing'] },
      { name: 'Walking Lunges', emoji: '🚶', level: 'Beginner', muscle: 'Quads, Glutes, Balance', steps: ['Stand tall holding dumbbells at your sides', 'Step forward and lower back knee toward floor', 'Push through front heel to bring feet together', 'Alternate legs — keep torso upright throughout'] },
    ],
  },
  {
    label: 'Arms', emoji: '💪', color: Colors.orange,
    exercises: [
      { name: 'Barbell Curl', emoji: '🔥', level: 'Beginner', muscle: 'Biceps', steps: ['Stand holding bar with underhand grip', 'Keep elbows pinned to sides throughout', 'Curl bar up squeezing biceps at the top', 'Lower slowly — do not swing torso'] },
      { name: 'Tricep Dips', emoji: '💥', level: 'Beginner', muscle: 'Triceps, Chest, Shoulders', steps: ['Hold parallel bars, arms fully extended', 'Lower body until upper arms are parallel to floor', 'Push up to start position — lock out at top', 'Lean forward slightly for more chest activation'] },
      { name: 'Skull Crushers', emoji: '💀', level: 'Intermediate', muscle: 'Triceps Long Head', steps: ['Lie on bench holding EZ-bar above chest', 'Keep upper arms vertical — only forearms move', 'Lower bar toward forehead in a controlled arc', 'Extend arms fully — squeeze triceps at top'] },
    ],
  },
  {
    label: 'Core', emoji: '🧱', color: '#EC4899',
    exercises: [
      { name: 'Hanging Leg Raise', emoji: '🔥', level: 'Intermediate', muscle: 'Lower Abs, Hip Flexors', steps: ['Hang from pull-up bar with arms fully extended', 'Brace core and raise legs to 90° or higher', 'Lower slowly — avoid swinging', 'For easier version: bend knees while raising'] },
      { name: 'Plank', emoji: '🧱', level: 'Beginner', muscle: 'Full Core, Shoulders', steps: ['Forearms on floor, elbows under shoulders', 'Body in a straight line head to heels', 'Squeeze glutes and brace abs hard', 'Hold 30-60 seconds — breathe normally'] },
      { name: 'Ab Wheel Rollout', emoji: '🎯', level: 'Advanced', muscle: 'Full Core, Lats', steps: ['Kneel on floor holding ab wheel with both hands', 'Roll forward slowly extending body as far as possible', 'Use core strength to pull back to start position', 'Keep lower back from sagging throughout'] },
    ],
  },
];

const levelColor: Record<string, string> = {
  Beginner: Colors.green,
  Intermediate: Colors.orange,
  Advanced: Colors.red,
};

export default function ExerciseLibraryScreen() {
  const [selectedGroup, setSelectedGroup] = useState(0);
  const [expandedEx, setExpandedEx] = useState<number | null>(null);
  const group = groups[selectedGroup];

  return (
    <>
      <Stack.Screen options={{ title: '📚 Exercise Library' }} />
      <View style={styles.container}>
        {/* Muscle Group Tabs */}
        <FadeInView delay={0}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
            {groups.map((g, i) => {
              const active = selectedGroup === i;
              return (
                <AnimatedPressable
                  key={g.label}
                  style={[styles.tab, active && { backgroundColor: g.color + '20', borderColor: g.color }]}
                  scaleDown={0.95}
                  onPress={() => { setSelectedGroup(i); setExpandedEx(null); }}
                >
                  <Text style={styles.tabEmoji}>{g.emoji}</Text>
                  <Text style={[styles.tabLabel, active && { color: g.color, fontWeight: '700' }]}>{g.label}</Text>
                </AnimatedPressable>
              );
            })}
          </ScrollView>
        </FadeInView>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Group Header */}
          <FadeInView delay={40}>
            <View style={[styles.groupHeader, { backgroundColor: group.color + '12' }]}>
              <Text style={styles.groupEmoji}>{group.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.groupTitle, { color: group.color }]}>{group.label} Exercises</Text>
                <Text style={styles.groupCount}>{group.exercises.length} exercises • Tap to expand</Text>
              </View>
            </View>
          </FadeInView>

          {/* Exercise Cards */}
          {group.exercises.map((ex, i) => {
            const open = expandedEx === i;
            return (
              <FadeInView key={`${selectedGroup}-${i}`} delay={100 + i * 70}>
                <AnimatedPressable
                  style={[styles.exCard, open && { borderColor: group.color + '50' }]}
                  scaleDown={0.98}
                  onPress={() => setExpandedEx(open ? null : i)}
                >
                  <View style={styles.exHeader}>
                    <Text style={styles.exEmoji}>{ex.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.exName, open && { color: group.color }]}>{ex.name}</Text>
                      <Text style={styles.exMuscle}>{ex.muscle}</Text>
                    </View>
                    <View style={[styles.levelBadge, { backgroundColor: levelColor[ex.level] + '20' }]}>
                      <Text style={[styles.levelText, { color: levelColor[ex.level] }]}>{ex.level}</Text>
                    </View>
                    <Text style={styles.arrow}>{open ? '▲' : '▼'}</Text>
                  </View>

                  {open && (
                    <View style={styles.steps}>
                      <Text style={styles.stepsTitle}>📋 How to perform:</Text>
                      {ex.steps.map((step, si) => (
                        <View key={si} style={styles.stepRow}>
                          <View style={[styles.stepNum, { backgroundColor: group.color }]}>
                            <Text style={styles.stepNumText}>{si + 1}</Text>
                          </View>
                          <Text style={styles.stepText}>{step}</Text>
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

  tabScroll: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
  },
  tabEmoji: { fontSize: 16 },
  tabLabel: { fontSize: 13, fontWeight: '500', color: Colors.textMuted },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, gap: 10 },

  groupHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 14, padding: 14, marginBottom: 4,
  },
  groupEmoji: { fontSize: 28 },
  groupTitle: { fontSize: 17, fontWeight: '700' },
  groupCount: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },

  exCard: {
    backgroundColor: Colors.bgCard, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, gap: 12,
  },
  exHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  exEmoji: { fontSize: 22 },
  exName: { fontSize: 15, fontWeight: '700', color: Colors.text },
  exMuscle: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  levelBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  levelText: { fontSize: 11, fontWeight: '700' },
  arrow: { fontSize: 10, color: Colors.textMuted },

  steps: { gap: 10 },
  stepsTitle: { fontSize: 13, fontWeight: '700', color: Colors.text },
  stepRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  stepNum: { width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', marginTop: 1 },
  stepNumText: { fontSize: 11, fontWeight: '700', color: '#FFF' },
  stepText: { flex: 1, fontSize: 13, color: Colors.textSub, lineHeight: 20 },
});
