import { useState } from 'react';                                  import { View, Text, StyleSheet, ScrollView, TextInput, Alert }  
  from 'react-native';                                               import { Stack } from 'expo-router';                             
  import { Colors } from '@/constants/colors';                       import { Fonts } from '@/constants/fonts';                       
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

  const ratingLabels = ['', 'TERRIBLE', 'POOR', 'OKAY', 'GOOD',    
  'EXCELLENT'];
  const ratingColors = ['', Colors.red, Colors.red, Colors.orange, 
  Colors.green, Colors.green];
  const ratingEmojis = ['', '😡', '😕', '😐', '😊', '🤩'];

  const quickTags = [
    'Great equipment', 'Clean & hygienic', 'Friendly staff',       
    'Good trainers', 'Crowded at peak', 'Needs more machines',     
    'Value for money', 'Good classes', 'Parking issue',
  ];

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
                <Text style={styles.successTitle}>THANK YOU</Text> 
                <Text style={styles.successSub}>Your feedback helps
   us improve GymSetu for everyone.</Text>
                <View style={styles.ratingDisplay}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <Text key={s} style={{ fontSize: 30 }}>{s <=   
  overallRating ? '⭐' : '☆'}</Text>
                  ))}
                </View>
                <View style={styles.successNote}>
                  <Text style={styles.successNoteText}>We'll share 
  your feedback with the team shortly.</Text>
                </View>
              </View>
            </FadeInView>
          </View>
        </>
      );
    }

    return (
      <>
        <Stack.Screen options={{ title: '⭐ Give Feedback' }} />   
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header Banner */}
          <FadeInView delay={0}>
            <View style={styles.headerCard}>
              <View style={styles.headerAccentBar} />
              <View style={styles.headerInner}>
                <Text style={styles.headerEmoji}>💬</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.headerTitle}>SHARE YOUR      
  EXPERIENCE</Text>
                  <Text style={styles.headerSub}>Your feedback     
  makes our gym better for everyone</Text>
                </View>
              </View>
            </View>
          </FadeInView>

          {/* Overall Star Rating */}
          <FadeInView delay={80}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>OVERALL RATING</Text> 
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map(star => (
                  <AnimatedPressable
                    key={star}
                    scaleDown={0.75}
                    onPress={() => setOverallRating(star)}
                  >
                    <Text style={[styles.starIcon, star <=
  overallRating && styles.starIconFilled]}>
                      {star <= overallRating ? '⭐' : '☆'}
                    </Text>
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
              <Text style={styles.cardTitle}>RATE BY
  CATEGORY</Text>
              {categories.map((cat, i) => (
                <View key={cat.label} style={[styles.catRow, i <   
  categories.length - 1 && styles.catRowBorder]}>
                  <Text style={styles.catEmoji}>{cat.emoji}</Text> 
                  <Text style={styles.catLabel}>{cat.label}</Text> 
                  <View style={styles.catStars}>
                    {[1, 2, 3, 4, 5].map(s => (
                      <AnimatedPressable key={s} scaleDown={0.8}   
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

          {/* Quick Tags */}
          <FadeInView delay={240}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>QUICK TAGS</Text>     
              <View style={styles.tagsGrid}>
                {quickTags.map(tag => {
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
  '').replace(/^,\s*|,\s*$/, '').trim());
                        } else {
                          setComment(prev => prev ? `${prev},      
  ${tag}` : tag);
                        }
                      }}
                    >
                      {selected && <View style={styles.tagDot} />} 
                      <Text style={[styles.tagText, selected &&    
  styles.tagTextSelected]}>{tag}</Text>
                    </AnimatedPressable>
                  );
                })}
              </View>
            </View>
          </FadeInView>

          {/* Comments */}
          <FadeInView delay={300}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>ADDITIONAL
  COMMENTS</Text>
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
                maxLength={500}
              />
              <Text style={[styles.charCount, comment.length > 450 
  && { color: Colors.orange }]}>
                {comment.length} / 500
              </Text>
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
              <View style={[styles.anonBadge, anonymous &&
  styles.anonBadgeOn]}>
                <Text style={[styles.anonBadgeText, anonymous && { 
  color: Colors.accent }]}>
                  {anonymous ? 'ON' : 'OFF'}
                </Text>
              </View>
            </AnimatedPressable>
          </FadeInView>

          {/* Submit */}
          <FadeInView delay={420}>
            <AnimatedPressable
              style={[styles.submitBtn, overallRating === 0 &&     
  styles.submitBtnDisabled]}
              scaleDown={0.97}
              onPress={handleSubmit}
              disabled={overallRating === 0}
            >
              <Text style={styles.submitText}>SUBMIT
  FEEDBACK</Text>
            </AnimatedPressable>
            {overallRating === 0 && (
              <Text style={styles.submitHint}>Rate your overall    
  experience to submit</Text>
            )}
          </FadeInView>

          <View style={{ height: 24 }} />
        </ScrollView>
      </>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    content: { padding: 16, gap: 12 },

    /* Header */
    headerCard: {
      flexDirection: 'row', backgroundColor: Colors.bgCard,        
      borderRadius: 16, overflow: 'hidden',
      borderWidth: 1, borderColor: Colors.accent + '30',
    },
    headerAccentBar: { width: 4, backgroundColor: Colors.accent }, 
    headerInner: { flex: 1, flexDirection: 'row', alignItems:      
  'center', gap: 14, padding: 16 },
    headerEmoji: { fontSize: 30 },
    headerTitle: { fontSize: 13, fontFamily: Fonts.bold, color:    
  Colors.text, letterSpacing: 1.2 },
    headerSub: { fontSize: 12, fontFamily: Fonts.regular, color:   
  Colors.textMuted, marginTop: 3 },

    /* Card */
    card: { backgroundColor: Colors.bgCard, borderRadius: 16,      
  padding: 16, borderWidth: 1, borderColor: Colors.border, gap: 12 
  },
    cardTitle: { fontSize: 11, fontFamily: Fonts.bold, color:      
  Colors.accent, letterSpacing: 1.5 },

    /* Stars */
    starsRow: { flexDirection: 'row', justifyContent: 'center',    
  gap: 10 },
    starIcon: { fontSize: 36, color: Colors.textMuted },
    starIconFilled: { color: Colors.orange },
    ratingLabelRow: { flexDirection: 'row', alignItems: 'center',  
  justifyContent: 'center', gap: 8 },
    ratingEmoji: { fontSize: 24 },
    ratingLabel: { fontSize: 20, fontFamily: Fonts.condensedBold,  
  letterSpacing: 1.5 },

    /* Category */
    catRow: { flexDirection: 'row', alignItems: 'center', gap: 8,  
  paddingVertical: 8 },
    catRowBorder: { borderBottomWidth: 1, borderBottomColor:       
  Colors.border },
    catEmoji: { fontSize: 17, width: 26 },
    catLabel: { flex: 1, fontSize: 13, fontFamily: Fonts.medium,   
  color: Colors.textSub },
    catStars: { flexDirection: 'row', gap: 3 },
    catStar: { fontSize: 19 },

    /* Tags */
    tagsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },  
    tag: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, 
      backgroundColor: Colors.bgElevated, borderWidth: 1,
  borderColor: Colors.border,
    },
    tagSelected: { backgroundColor: Colors.accentMuted,
  borderColor: Colors.accent },
    tagDot: { width: 5, height: 5, borderRadius: 3,
  backgroundColor: Colors.accent },
    tagText: { fontSize: 12, fontFamily: Fonts.medium, color:      
  Colors.textMuted },
    tagTextSelected: { color: Colors.accent, fontFamily: Fonts.bold
   },

    /* Comment */
    commentInput: {
      backgroundColor: Colors.bgElevated, borderRadius: 12,        
  padding: 14,
      fontSize: 14, fontFamily: Fonts.regular, color: Colors.text, 
      borderWidth: 1, borderColor: Colors.border, minHeight: 110,  
    },
    charCount: { fontSize: 11, fontFamily: Fonts.regular, color:   
  Colors.textMuted, textAlign: 'right' },

    /* Anonymous */
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
    checkmark: { fontSize: 13, fontFamily: Fonts.bold, color:      
  '#FFF' },
    anonTitle: { fontSize: 14, fontFamily: Fonts.bold, color:      
  Colors.text },
    anonSub: { fontSize: 12, fontFamily: Fonts.regular, color:     
  Colors.textMuted, marginTop: 2 },
    anonBadge: { backgroundColor: Colors.bgElevated, borderRadius: 
  6, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1,     
  borderColor: Colors.border },
    anonBadgeOn: { backgroundColor: Colors.accentMuted,
  borderColor: Colors.accent + '50' },
    anonBadgeText: { fontSize: 10, fontFamily: Fonts.bold, color:  
  Colors.textMuted, letterSpacing: 1 },

    /* Submit */
    submitBtn: { backgroundColor: Colors.accent, borderRadius: 14, 
  paddingVertical: 16, alignItems: 'center' },
    submitBtnDisabled: { opacity: 0.45 },
    submitText: { fontSize: 14, fontFamily: Fonts.bold, color:     
  '#FFF', letterSpacing: 1.5 },
    submitHint: { fontSize: 11, fontFamily: Fonts.regular, color:  
  Colors.textMuted, textAlign: 'center', marginTop: 8 },

    /* Success */
    successContainer: { flex: 1, backgroundColor: Colors.bg,       
  justifyContent: 'center', padding: 24 },
    successCard: {
      backgroundColor: Colors.bgCard, borderRadius: 20, padding:   
  32,
      alignItems: 'center', gap: 12, borderWidth: 1, borderColor:  
  Colors.accent + '30',
    },
    successEmoji: { fontSize: 56 },
    successTitle: { fontSize: 28, fontFamily: Fonts.condensedBold, 
  color: Colors.text, letterSpacing: 2 },
    successSub: { fontSize: 14, fontFamily: Fonts.regular, color:  
  Colors.textMuted, textAlign: 'center', lineHeight: 21 },
    ratingDisplay: { flexDirection: 'row', gap: 4 },
    successNote: { backgroundColor: Colors.bgElevated,
  borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },  
    successNoteText: { fontSize: 12, fontFamily: Fonts.regular,    
  color: Colors.textMuted, textAlign: 'center' },
  });