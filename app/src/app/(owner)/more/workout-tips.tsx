import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { Colors } from '@/constants/colors';
import AnimatedPressable from '@/components/AnimatedPressable';
import FadeInView from '@/components/FadeInView';

interface Tip {
  title: string;
  body: string;
  emoji: string;
}

interface Category {
  label: string;
  emoji: string;
  color: string;
  tips: Tip[];
}

const categories: Category[] = [
  {
    label: 'Chest', emoji: '💪', color: Colors.red,
    tips: [
      { emoji: '🏋️', title: 'Flat Bench Press', body: 'The king of chest exercises. Keep feet flat, arch slightly, lower to mid-chest. 4 sets × 8-12 reps.' },
      { emoji: '🔥', title: 'Incline Dumbbell Press', body: 'Set bench at 30-45°. Targets upper chest. Control the negative. 3 sets × 10-12 reps.' },
      { emoji: '💥', title: 'Cable Flyes', body: 'Great isolation move. Squeeze at the top. Keep slight bend in elbows. 3 sets × 12-15 reps.' },
      { emoji: '🎯', title: 'Push-ups (Finisher)', body: 'Drop set to failure at end of workout. Try wide, narrow, and decline variations.' },
    ],
  },
  {
    label: 'Back', emoji: '🔙', color: Colors.accent,
    tips: [
      { emoji: '💪', title: 'Deadlifts', body: 'Full body compound. Hinge at hips, keep spine neutral, drive through heels. 4 sets × 5-8 reps.' },
      { emoji: '🏋️', title: 'Pull-ups / Lat Pulldown', body: 'Wide grip for width. Full range of motion. Pull to upper chest. 4 sets × 8-12 reps.' },
      { emoji: '🔥', title: 'Barbell Rows', body: 'Bent over at 45°. Pull to lower chest. Squeeze shoulder blades. 3 sets × 8-10 reps.' },
      { emoji: '🎯', title: 'Face Pulls', body: 'Great for posture and rear delts. Light weight, high reps. 3 sets × 15-20 reps.' },
    ],
  },
  {
    label: 'Legs', emoji: '🦵', color: Colors.green,
    tips: [
      { emoji: '👑', title: 'Barbell Squats', body: 'The king of exercises. Below parallel depth. Keep core tight. 4 sets × 6-10 reps.' },
      { emoji: '🏋️', title: 'Romanian Deadlift', body: 'Targets hamstrings. Slow negative, feel the stretch. Keep bar close. 3 sets × 10-12 reps.' },
      { emoji: '🔥', title: 'Leg Press', body: 'High and wide foot placement for glutes. Don\'t lock knees at top. 4 sets × 12-15 reps.' },
      { emoji: '💥', title: 'Walking Lunges', body: 'Great for balance and single-leg strength. Dumbbells or bodyweight. 3 sets × 12 each leg.' },
    ],
  },
  {
    label: 'Arms', emoji: '💪', color: Colors.orange,
    tips: [
      { emoji: '🔥', title: 'Barbell Curls', body: 'Standing, strict form. No swinging. Squeeze at the top. 3 sets × 10-12 reps.' },
      { emoji: '💪', title: 'Tricep Dips', body: 'Lean slightly forward for chest, upright for triceps. 3 sets × 10-15 reps.' },
      { emoji: '🎯', title: 'Hammer Curls', body: 'Neutral grip works brachialis. Builds arm thickness. 3 sets × 12 reps.' },
      { emoji: '💥', title: 'Skull Crushers', body: 'Lying tricep extension. Lower to forehead, extend fully. 3 sets × 10-12 reps.' },
    ],
  },
  {
    label: 'Core', emoji: '🧱', color: '#EC4899',
    tips: [
      { emoji: '🔥', title: 'Hanging Leg Raises', body: 'Best lower ab exercise. Control the movement, no swinging. 3 sets × 12-15 reps.' },
      { emoji: '🧱', title: 'Plank Variations', body: 'Front plank, side plank, plank shoulder taps. Hold 30-60 seconds. 3 rounds.' },
      { emoji: '💪', title: 'Cable Woodchops', body: 'Rotational core strength. Great for sports. 3 sets × 12 each side.' },
      { emoji: '🎯', title: 'Ab Wheel Rollouts', body: 'Advanced move. Start from knees. Slow and controlled. 3 sets × 8-12 reps.' },
    ],
  },
  {
    label: 'Nutrition', emoji: '🥗', color: '#22C55E',
    tips: [
      { emoji: '🥩', title: 'Protein Intake', body: 'Aim for 1.6-2.2g per kg bodyweight daily. Spread across 4-5 meals. Include whey, chicken, eggs, paneer.' },
      { emoji: '🍚', title: 'Carb Timing', body: 'Complex carbs before training for energy. Simple carbs post-workout for recovery. Rice, oats, sweet potato.' },
      { emoji: '💧', title: 'Hydration', body: 'Drink 3-4 liters daily. More on training days. Start each morning with 500ml water.' },
      { emoji: '😴', title: 'Sleep & Recovery', body: 'Aim for 7-9 hours. Muscles grow during rest. Avoid screens 1 hour before bed.' },
    ],
  },
];

export default function WorkoutTipsScreen() {
  const [selectedCat, setSelectedCat] = useState(0);
  const [expandedTip, setExpandedTip] = useState<number | null>(null);
  const cat = categories[selectedCat];

  return (
    <>
      <Stack.Screen options={{ title: '🏋️ Workout & Diet Tips' }} />
      <View style={styles.container}>
        {/* Category Chips */}
        <FadeInView delay={0}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
            {categories.map((c, i) => {
              const active = selectedCat === i;
              return (
                <AnimatedPressable
                  key={c.label}
                  style={[styles.catChip, active && { backgroundColor: c.color + '20', borderColor: c.color }]}
                  scaleDown={0.95}
                  onPress={() => { setSelectedCat(i); setExpandedTip(null); }}
                >
                  <Text style={styles.catEmoji}>{c.emoji}</Text>
                  <Text style={[styles.catText, active && { color: c.color, fontWeight: '600' }]}>{c.label}</Text>
                </AnimatedPressable>
              );
            })}
          </ScrollView>
        </FadeInView>

        <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Category Header */}
          <FadeInView delay={50}>
            <View style={[styles.catHeader, { backgroundColor: cat.color + '12' }]}>
              <Text style={styles.catHeaderEmoji}>{cat.emoji}</Text>
              <Text style={[styles.catHeaderTitle, { color: cat.color }]}>{cat.label} Exercises</Text>
              <Text style={styles.catHeaderCount}>{cat.tips.length} tips</Text>
            </View>
          </FadeInView>

          {/* Tips */}
          {cat.tips.map((tip, i) => {
            const isOpen = expandedTip === i;
            return (
              <FadeInView key={`${selectedCat}-${i}`} delay={100 + i * 60}>
                <AnimatedPressable
                  style={[styles.tipCard, isOpen && { borderColor: cat.color + '40' }]}
                  scaleDown={0.98}
                  onPress={() => setExpandedTip(isOpen ? null : i)}
                >
                  <View style={styles.tipHeader}>
                    <Text style={styles.tipEmoji}>{tip.emoji}</Text>
                    <Text style={[styles.tipTitle, isOpen && { color: cat.color }]}>{tip.title}</Text>
                    <Text style={styles.tipArrow}>{isOpen ? '▲' : '▼'}</Text>
                  </View>
                  {isOpen && (
                    <Text style={styles.tipBody}>{tip.body}</Text>
                  )}
                </AnimatedPressable>
              </FadeInView>
            );
          })}

          {/* Pro Tip */}
          <FadeInView delay={400}>
            <View style={styles.proTip}>
              <Text style={styles.proTipEmoji}>💡</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.proTipTitle}>Pro Tip</Text>
                <Text style={styles.proTipText}>Progressive overload is key! Increase weight, reps, or sets each week to keep making gains.</Text>
              </View>
            </View>
          </FadeInView>

          <View style={{ height: 32 }} />
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  catScroll: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border },
  catEmoji: { fontSize: 16 },
  catText: { fontSize: 13, fontWeight: '500', color: Colors.textMuted },

  scrollArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, gap: 10, paddingBottom: 20 },

  catHeader: { borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  catHeaderEmoji: { fontSize: 24 },
  catHeaderTitle: { flex: 1, fontSize: 17, fontWeight: '700' },
  catHeaderCount: { fontSize: 12, color: Colors.textMuted, fontWeight: '500' },

  tipCard: { backgroundColor: Colors.bgCard, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border, gap: 8 },
  tipHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tipEmoji: { fontSize: 18 },
  tipTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.text },
  tipArrow: { fontSize: 10, color: Colors.textMuted },
  tipBody: { fontSize: 13, color: Colors.textSub, lineHeight: 20, paddingLeft: 28 },

  proTip: { flexDirection: 'row', gap: 12, backgroundColor: Colors.orangeMuted, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.orange + '25', marginTop: 4 },
  proTipEmoji: { fontSize: 24 },
  proTipTitle: { fontSize: 14, fontWeight: '700', color: Colors.text },
  proTipText: { fontSize: 13, color: Colors.textSub, lineHeight: 19, marginTop: 2 },
});
