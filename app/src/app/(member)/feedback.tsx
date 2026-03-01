                                                                  
  import { useState } from 'react';                                  import { View, Text, StyleSheet, ScrollView, TextInput, Alert }  
  from 'react-native';                                               import { Stack } from 'expo-router';                             
  import { Colors } from '@/constants/colors';                     
  import AnimatedPressable from '@/components/AnimatedPressable';  
  import FadeInView from '@/components/FadeInView';                

  const categories = [
    { label: 'Cleanliness', emoji: '🧹' },
    { label: 'Equipment', emoji: '🏋️' },
    { label: 'Staff', emoji: '👨‍💼' },
    { label: 'Classes', emoji: '🧘' },
    { label: 'Atmosphere', emoji: '💫' },
    { label: 'Value', emoji: '💰' },
  ];

  const ratingLabels = ['', 'Terrible', 'Poor', 'Okay', 'Good',    
  'Excellent'];
  const ratingColors = ['', Colors.red, Colors.red, Colors.orange, 
  Colors.green, Colors.green];
  const ratingEmojis = ['', '😡', '😕', '😐', '😊', '🤩'];

  export default function FeedbackScreen() {
    const [overallRating, setOverallRating] = useState(0);
    const [categoryRatings, setCategoryRatings] =
  useState<Record<string, number>>({});
    const [comment, setComment] = useState('');
    const [anonymous, setAnonymous] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const setCatRating = (cat: string, val: number) => {
      setCategoryRatings(prev => ({ ...prev, [cat]: val }));       
    };

    const handleSubmit = () => {
      if (overallRating === 0) {
        Alert.alert('Rating Required', 'Please give an overall rating before submitting.');
        return;
      }
      setSubmitted(true);
    };

    if (submitted) {
      return (
        <>
          <Stack.Screen options={{ title: '⭐ Feedback' }} />      
          <View style={styles.successContainer}>
            <FadeInView delay={0}>
              <View style={styles.successCard}>
                <Text style={styles.successEmoji}>🎉</Text>        
                <Text style={styles.successTitle}>Thank You!</Text>
                <Text style={styles.successSub}>Your feedback helps
   us improve GymSetu for everyone.</Text>
                <View style={styles.ratingDisplay}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <Text key={s} style={{ fontSize: 28 }}>{s <=   
  overallRating ? '⭐' : '☆'}</Text>
                  ))}
                </View>
                <Text style={styles.successNote}>We'll share your  
  feedback with the team shortly.</Text>
              </View>
            </FadeInView>
          </View>
        </>
      );
    }

    return (
      <>
        <Stack.Screen options={{ title: '⭐ Give Feedback' }} />   
        <ScrollView style={styles.container}
  contentContainerStyle={styles.content}
  keyboardShouldPersistTaps="handled">

          {/* Header */}
          <FadeInView delay={0}>
            <View style={styles.headerCard}>
              <Text style={styles.headerEmoji}>💬</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.headerTitle}>Share Your        
  Experience</Text>
                <Text style={styles.headerSub}>Your feedback makes 
  our gym better for everyone</Text>
              </View>
            </View>
          </FadeInView>

          {/* Overall Star Rating */}
          <FadeInView delay={80}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>⭐ Overall
  Rating</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map(star => (
                  <AnimatedPressable key={star} scaleDown={0.8}    
  onPress={() => setOverallRating(star)}>
                    <Text style={styles.starIcon}>{star <=
  overallRating ? '⭐' : '☆'}</Text>
                  </AnimatedPressable>
                ))}
              </View>
              {overallRating > 0 && (
                <View style={styles.ratingLabelRow}>
                  <Text
  style={styles.ratingEmoji}>{ratingEmojis[overallRating]}</Text>  
                  <Text style={[styles.ratingLabel, { color:       
  ratingColors[overallRating] }]}>
                    {ratingLabels[overallRating]}
                  </Text>
                </View>
              )}
            </View>
          </FadeInView>

          {/* Category Ratings */}
          <FadeInView delay={160}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>📊 Rate by
  Category</Text>
              {categories.map((cat, i) => (
                <View key={cat.label} style={styles.catRow}>       
                  <Text style={styles.catEmoji}>{cat.emoji}</Text> 
                  <Text style={styles.catLabel}>{cat.label}</Text> 
                  <View style={styles.catStars}>
                    {[1, 2, 3, 4, 5].map(s => (
                      <AnimatedPressable key={s} scaleDown={0.85}  
  onPress={() => setCatRating(cat.label, s)}>
                        <Text style={styles.catStar}>
                          {s <= (categoryRatings[cat.label] || 0) ?
   '⭐' : '☆'}
                        </Text>
                      </AnimatedPressable>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          </FadeInView>

          {/* Comments */}
          <FadeInView delay={240}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>💬 Additional
  Comments</Text>
              <TextInput
                style={styles.commentInput}
                placeholder="Tell us what you loved, or what we can
   improve..."
                placeholderTextColor={Colors.textMuted}
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{comment.length} /    
  500</Text>
            </View>
          </FadeInView>

          {/* Quick Tags */}
          <FadeInView delay={300}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🏷️ Quick Tags</Text>  
              <View style={styles.tagsGrid}>
                {[
                  'Great equipment', 'Clean & hygienic', 'Friendly staff',
                  'Good trainers', 'Crowded at peak', 'Needs more  machines',
                  'Value for money', 'Good classes', 'Parking   issue',
                ].map(tag => {
                  const selected = comment.includes(tag);
                  return (
                    <AnimatedPressable
                      key={tag}
                      style={[styles.tag, selected &&
  styles.tagSelected]}
                      scaleDown={0.93}
                      onPress={() => {
                        if (selected) {
                          setComment(prev => prev.replace(tag,     
  '').trim());
                        } else {
                          setComment(prev => prev ? `${prev},      
  ${tag}` : tag);
                        }
                      }}
                    >
                      <Text style={[styles.tagText, selected &&    
  styles.tagTextSelected]}>{tag}</Text>
                    </AnimatedPressable>
                  );
                })}
              </View>
            </View>
          </FadeInView>

          {/* Anonymous Toggle */}
          <FadeInView delay={360}>
            <AnimatedPressable
              style={styles.anonRow}
              scaleDown={0.98}
              onPress={() => setAnonymous(prev => !prev)}
            >
              <View style={[styles.checkbox, anonymous &&
  styles.checkboxOn]}>
                {anonymous && <Text
  style={styles.checkmark}>✓</Text>}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.anonTitle}>Submit
  Anonymously</Text>
                <Text style={styles.anonSub}>Your name won't be    
  shown with this feedback</Text>
              </View>
            </AnimatedPressable>
          </FadeInView>

          {/* Submit Button */}
          <FadeInView delay={420}>
            <AnimatedPressable
              style={[styles.submitBtn, overallRating === 0 && {   
  opacity: 0.5 }]}
              scaleDown={0.97}
              onPress={handleSubmit}
              disabled={overallRating === 0}
            >
              <Text style={styles.submitText}>📤 Submit
  Feedback</Text>
            </AnimatedPressable>
          </FadeInView>

          <View style={{ height: 24 }} />
        </ScrollView>
      </>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    content: { padding: 16, gap: 12 },

    headerCard: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      backgroundColor: Colors.accentMuted, borderRadius: 16,       
  padding: 16,
      borderWidth: 1, borderColor: Colors.accent + '25',
    },
    headerEmoji: { fontSize: 32 },
    headerTitle: { fontSize: 17, fontWeight: '700', color:
  Colors.text },
    headerSub: { fontSize: 12, color: Colors.textMuted, marginTop: 
  2 },

    card: { backgroundColor: Colors.bgCard, borderRadius: 16,      
  padding: 16, borderWidth: 1, borderColor: Colors.border, gap: 12 
  },
    cardTitle: { fontSize: 15, fontWeight: '700', color:
  Colors.text },

    starsRow: { flexDirection: 'row', justifyContent: 'center',    
  gap: 8 },
    starIcon: { fontSize: 38 },
    ratingLabelRow: { flexDirection: 'row', alignItems: 'center',  
  justifyContent: 'center', gap: 8 },
    ratingEmoji: { fontSize: 22 },
    ratingLabel: { fontSize: 18, fontWeight: '700' },

    catRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    catEmoji: { fontSize: 18, width: 24 },
    catLabel: { flex: 1, fontSize: 14, fontWeight: '500', color:   
  Colors.text },
    catStars: { flexDirection: 'row', gap: 4 },
    catStar: { fontSize: 20 },

    commentInput: {
      backgroundColor: Colors.bgElevated, borderRadius: 12,        
  padding: 14,
      fontSize: 14, color: Colors.text, borderWidth: 1,
  borderColor: Colors.border,
      minHeight: 110,
    },
    charCount: { fontSize: 11, color: Colors.textMuted, textAlign: 
  'right' },

    tagsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },  
    tag: {
      paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, 
      backgroundColor: Colors.bgElevated, borderWidth: 1,
  borderColor: Colors.border,
    },
    tagSelected: { backgroundColor: Colors.accentMuted,
  borderColor: Colors.accent },
    tagText: { fontSize: 12, fontWeight: '500', color:
  Colors.textMuted },
    tagTextSelected: { color: Colors.accent, fontWeight: '700' },  

    anonRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: Colors.bgCard, borderRadius: 14, padding:   
  14,
      borderWidth: 1, borderColor: Colors.border,
    },
    checkbox: {
      width: 24, height: 24, borderRadius: 6,
      borderWidth: 2, borderColor: Colors.border,
      justifyContent: 'center', alignItems: 'center',
    },
    checkboxOn: { backgroundColor: Colors.accent, borderColor:     
  Colors.accent },
    checkmark: { fontSize: 13, color: '#FFF', fontWeight: '700' }, 
    anonTitle: { fontSize: 14, fontWeight: '600', color:
  Colors.text },
    anonSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 
  },

    submitBtn: { backgroundColor: Colors.accent, borderRadius: 14, 
  paddingVertical: 16, alignItems: 'center' },
    submitText: { fontSize: 16, fontWeight: '700', color: '#FFF' },

    successContainer: { flex: 1, backgroundColor: Colors.bg,       
  justifyContent: 'center', padding: 24 },
    successCard: {
      backgroundColor: Colors.bgCard, borderRadius: 20, padding:   
  32,
      alignItems: 'center', gap: 12, borderWidth: 1, borderColor:  
  Colors.border,
    },
    successEmoji: { fontSize: 56 },
    successTitle: { fontSize: 26, fontWeight: '700', color:        
  Colors.text },
    successSub: { fontSize: 14, color: Colors.textMuted, textAlign:
   'center', lineHeight: 21 },
    ratingDisplay: { flexDirection: 'row', gap: 4 },
    successNote: { fontSize: 12, color: Colors.textMuted,
  textAlign: 'center', marginTop: 8 },
  });