 import { View, Text, StyleSheet, ScrollView, Linking } from        'react-native';                                                  
  import { Stack } from 'expo-router';                               import { Colors } from '@/constants/colors';                     
  import { Fonts } from '@/constants/fonts';                         import AnimatedPressable from '@/components/AnimatedPressable';  
  import FadeInView from '@/components/FadeInView';                
                                                                     const gym = {                                                    
    name: 'FitZone Gym & Fitness',                                 
    tagline: 'Transform Your Body, Transform Your Life',
    address: '204, 2nd Floor, Lokhandwala Complex,\nAndheri West,Mumbai 400058',
    phone: '+91 98765 43210',
    email: 'fitzone.gym@gmail.com',
    established: '2020',
    owner: 'Nikhil Sharma',
  };

  const timings = [
    { day: 'Mon – Fri', time: '5:30 AM – 10:30 PM', emoji: '🏋️' }, 
    { day: 'Saturday', time: '6:00 AM – 9:00 PM', emoji: '💪' },   
    { day: 'Sunday', time: '7:00 AM – 1:00 PM', emoji: '🧘' },     
  ];

  const amenities = [
    { label: 'Cardio Zone', emoji: '🏃' },
    { label: 'Free Weights', emoji: '🏋️' },
    { label: 'Machines', emoji: '⚙️' },
    { label: 'Crossfit Area', emoji: '🔥' },
    { label: 'Yoga Studio', emoji: '🧘' },
    { label: 'Locker Room', emoji: '🔐' },
    { label: 'Steam Room', emoji: '♨️' },
    { label: 'Parking', emoji: '🅿️' },
    { label: 'Supplements', emoji: '💊' },
    { label: 'Personal Training', emoji: '👨‍🏫' },
    { label: 'Diet Plans', emoji: '🥗' },
    { label: 'AC', emoji: '❄️' },
  ];

  const trainers = [
    { name: 'Rajesh Kumar', specialty: 'Strength & Conditioning',  
  emoji: '🏋️', exp: '8 yrs' },
    { name: 'Priya Sharma', specialty: 'Yoga & Flexibility', emoji:
   '🧘', exp: '6 yrs' },
    { name: 'Amit Patel', specialty: 'Boxing & HIIT', emoji: '🥊', 
  exp: '5 yrs' },
    { name: 'Neha Verma', specialty: 'Zumba & Dance Fitness',      
  emoji: '💃', exp: '4 yrs' },
    { name: 'Vikram Singh', specialty: 'Nutrition & Weight Loss',  
  emoji: '🥗', exp: '7 yrs' },
  ];

  const rules = [
    'Carry your own towel at all times',
    'Re-rack weights after use',
    'No outside food or drinks (water allowed)',
    'Maintain gym decorum — no loud music without earphones',      
    'Wear proper gym shoes — no slippers',
    "Respect other members' personal space",
  ];

  export default function GymInfoScreen() {
    return (
      <>
        <Stack.Screen options={{ title: '🏢 Gym Info' }} />        
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Card */}
          <FadeInView delay={0}>
            <View style={styles.heroCard}>
              <View style={styles.logoRing}>
                <Text style={styles.logoEmoji}>💪</Text>
              </View>
              <Text style={styles.gymName}>{gym.name}</Text>       
              <Text style={styles.tagline}>"{gym.tagline}"</Text>  
              <View style={styles.heroDivider} />
              <View style={styles.heroMetaRow}>
                <View style={styles.heroMeta}>
                  <Text
  style={styles.heroMetaVal}>{gym.established}</Text>
                  <Text
  style={styles.heroMetaLabel}>ESTABLISHED</Text>
                </View>
                <View style={styles.heroMetaSep} />
                <View style={styles.heroMeta}>
                  <Text
  style={styles.heroMetaVal}>{gym.owner}</Text>
                  <Text style={styles.heroMetaLabel}>OWNER</Text>  
                </View>
              </View>
            </View>
          </FadeInView>

          {/* Contact & Location */}
          <FadeInView delay={80}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>CONTACT &
  LOCATION</Text>

              <View style={styles.infoRow}>
                <Text style={styles.infoEmoji}>📍</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>ADDRESS</Text>    
                  <Text
  style={styles.infoValue}>{gym.address}</Text>
                </View>
              </View>

              <AnimatedPressable
                style={styles.infoRow}
                scaleDown={0.98}
                onPress={() => Linking.openURL(`tel:${gym.phone}`)}
              >
                <Text style={styles.infoEmoji}>📞</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>PHONE</Text>      
                  <Text style={[styles.infoValue, { color:
  Colors.accent }]}>{gym.phone}</Text>
                </View>
                <Text style={styles.linkArrow}>→</Text>
              </AnimatedPressable>

              <AnimatedPressable
                style={styles.infoRow}
                scaleDown={0.98}
                onPress={() =>
  Linking.openURL(`mailto:${gym.email}`)}
              >
                <Text style={styles.infoEmoji}>📧</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>EMAIL</Text>      
                  <Text style={[styles.infoValue, { color:
  Colors.accent }]}>{gym.email}</Text>
                </View>
                <Text style={styles.linkArrow}>→</Text>
              </AnimatedPressable>

              <AnimatedPressable
                style={styles.mapBtn}
                scaleDown={0.97}
                onPress={() => Linking.openURL('https://maps.google.com/?q=Lokhandwala+Complex+Andheri+West+Mumbai')}
              >
                <Text style={styles.mapBtnText}>🗺  OPEN IN GOOGLE  
  MAPS</Text>
              </AnimatedPressable>
            </View>
          </FadeInView>

          {/* Timings */}
          <FadeInView delay={160}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>OPERATING HOURS</Text>
              {timings.map((t, i) => (
                <View key={t.day} style={[styles.timingRow, i <    
  timings.length - 1 && styles.timingRowBorder]}>
                  <Text style={styles.timingEmoji}>{t.emoji}</Text>
                  <Text style={styles.timingDay}>{t.day}</Text>    
                  <Text style={styles.timingTime}>{t.time}</Text>  
                </View>
              ))}
              <View style={styles.holidayNote}>
                <Text style={styles.holidayText}>🔔  Check
  announcements for holiday timings</Text>
              </View>
            </View>
          </FadeInView>

          {/* Amenities */}
          <FadeInView delay={240}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>AMENITIES &
  FACILITIES</Text>
              <View style={styles.amenGrid}>
                {amenities.map(a => (
                  <View key={a.label} style={styles.amenChip}>     
                    <Text style={styles.amenEmoji}>{a.emoji}</Text>
                    <Text style={styles.amenLabel}>{a.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </FadeInView>

          {/* Trainers */}
          <FadeInView delay={320}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>OUR TRAINERS</Text>   
              {trainers.map((t, i) => (
                <View key={t.name} style={[styles.trainerRow, i <  
  trainers.length - 1 && styles.trainerRowBorder]}>
                  <View style={styles.trainerAvatar}>
                    <Text
  style={styles.trainerEmoji}>{t.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
  style={styles.trainerName}>{t.name}</Text>
                    <Text
  style={styles.trainerSpec}>{t.specialty}</Text>
                  </View>
                  <View style={styles.expBadge}>
                    <Text style={styles.expVal}>{t.exp.replace(' yrs', '')}</Text>
                    <Text style={styles.expUnit}>YRS</Text>        
                  </View>
                </View>
              ))}
            </View>
          </FadeInView>

          {/* Rules */}
          <FadeInView delay={400}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>GYM RULES</Text>      
              {rules.map((r, i) => (
                <View key={i} style={styles.ruleRow}>
                  <View style={styles.ruleIndex}>
                    <Text style={styles.ruleIndexText}>{i +        
  1}</Text>
                  </View>
                  <Text style={styles.ruleText}>{r}</Text>
                </View>
              ))}
            </View>
          </FadeInView>

          {/* Emergency */}
          <FadeInView delay={480}>
            <AnimatedPressable
              style={styles.emergencyCard}
              scaleDown={0.97}
              onPress={() => Linking.openURL(`tel:${gym.phone}`)}  
            >
              <Text style={styles.emergencyEmoji}>🆘</Text>        
              <View style={{ flex: 1 }}>
                <Text style={styles.emergencyTitle}>EMERGENCY /    
  HELP</Text>
                <Text style={styles.emergencySub}>Tap to call the  
  gym directly</Text>
              </View>
              <Text style={styles.emergencyArrow}>→</Text>
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

    /* Hero */
    heroCard: {
      backgroundColor: Colors.bgCard, borderRadius: 20, padding:   
  24,
      alignItems: 'center', gap: 8, borderWidth: 1, borderColor:   
  Colors.accent + '30',
    },
    logoRing: {
      width: 72, height: 72, borderRadius: 36,
      backgroundColor: Colors.bgElevated,
      justifyContent: 'center', alignItems: 'center',
      borderWidth: 2, borderColor: Colors.accent + '50',
  marginBottom: 4,
    },
    logoEmoji: { fontSize: 32 },
    gymName: { fontSize: 20, fontFamily: Fonts.condensedBold,      
  color: Colors.text, textAlign: 'center', letterSpacing: 0.5 },   
    tagline: { fontSize: 12, fontFamily: Fonts.regular, color:     
  Colors.textMuted, fontStyle: 'italic', textAlign: 'center' },    
    heroDivider: { width: 40, height: 1, backgroundColor:
  Colors.accent + '40', marginVertical: 4 },
    heroMetaRow: { flexDirection: 'row', alignItems: 'center', gap:
   24 },
    heroMeta: { alignItems: 'center', gap: 2 },
    heroMetaVal: { fontSize: 16, fontFamily: Fonts.condensedBold,  
  color: Colors.accent },
    heroMetaLabel: { fontSize: 9, fontFamily: Fonts.bold, color:   
  Colors.textMuted, letterSpacing: 1.5 },
    heroMetaSep: { width: 1, height: 28, backgroundColor:
  Colors.border },

    /* Card */
    card: { backgroundColor: Colors.bgCard, borderRadius: 16,      
  padding: 16, borderWidth: 1, borderColor: Colors.border, gap: 12 
  },
    cardTitle: { fontSize: 11, fontFamily: Fonts.bold, color:      
  Colors.accent, letterSpacing: 1.5 },

    /* Contact */
    infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap:
   10 },
    infoEmoji: { fontSize: 16, marginTop: 14 },
    infoLabel: { fontSize: 9, fontFamily: Fonts.bold, color:       
  Colors.textMuted, letterSpacing: 1.3 },
    infoValue: { fontSize: 14, fontFamily: Fonts.medium, color:    
  Colors.text, marginTop: 2, lineHeight: 20 },
    linkArrow: { fontSize: 16, color: Colors.accent, marginTop: 14 
  },

    mapBtn: {
      backgroundColor: Colors.accentMuted, borderRadius: 10,       
  paddingVertical: 12,
      alignItems: 'center', borderWidth: 1, borderColor:
  Colors.accent + '30',
    },
    mapBtnText: { fontSize: 12, fontFamily: Fonts.bold, color:     
  Colors.accent, letterSpacing: 1.2 },

    /* Timings */
    timingRow: { flexDirection: 'row', alignItems: 'center', gap:  
  10, paddingVertical: 10 },
    timingRowBorder: { borderBottomWidth: 1, borderBottomColor:    
  Colors.border },
    timingEmoji: { fontSize: 16 },
    timingDay: { flex: 1, fontSize: 13, fontFamily: Fonts.medium,  
  color: Colors.textSub },
    timingTime: { fontSize: 15, fontFamily: Fonts.condensedBold,   
  color: Colors.accent, letterSpacing: 0.3 },
    holidayNote: { backgroundColor: Colors.bgElevated,
  borderRadius: 8, padding: 10 },
    holidayText: { fontSize: 11, fontFamily: Fonts.regular, color: 
  Colors.textMuted },

    /* Amenities */
    amenGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },  
    amenChip: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, 
      backgroundColor: Colors.bgElevated, borderWidth: 1,
  borderColor: Colors.border,
    },
    amenEmoji: { fontSize: 13 },
    amenLabel: { fontSize: 11, fontFamily: Fonts.medium, color:    
  Colors.textSub },

    /* Trainers */
    trainerRow: { flexDirection: 'row', alignItems: 'center', gap: 
  12, paddingVertical: 10 },
    trainerRowBorder: { borderBottomWidth: 1, borderBottomColor:   
  Colors.border },
    trainerAvatar: {
      width: 42, height: 42, borderRadius: 21,
      backgroundColor: Colors.bgElevated,
      justifyContent: 'center', alignItems: 'center',
      borderWidth: 1, borderColor: Colors.accent + '30',
    },
    trainerEmoji: { fontSize: 20 },
    trainerName: { fontSize: 14, fontFamily: Fonts.bold, color:    
  Colors.text },
    trainerSpec: { fontSize: 11, fontFamily: Fonts.regular, color: 
  Colors.textMuted, marginTop: 1 },
    expBadge: { alignItems: 'center', backgroundColor:
  Colors.accentMuted, borderRadius: 8, paddingHorizontal: 10,      
  paddingVertical: 6 },
    expVal: { fontSize: 18, fontFamily: Fonts.condensedBold, color:
   Colors.accent, lineHeight: 20 },
    expUnit: { fontSize: 8, fontFamily: Fonts.bold, color:
  Colors.accent, letterSpacing: 1 },

    /* Rules */
    ruleRow: { flexDirection: 'row', alignItems: 'flex-start', gap:
   10 },
    ruleIndex: {
      width: 20, height: 20, borderRadius: 10,
      backgroundColor: Colors.accentMuted, borderWidth: 1,
  borderColor: Colors.accent + '40',
      justifyContent: 'center', alignItems: 'center', marginTop: 1,
    },
    ruleIndexText: { fontSize: 10, fontFamily: Fonts.bold, color:  
  Colors.accent },
    ruleText: { flex: 1, fontSize: 13, fontFamily: Fonts.regular,  
  color: Colors.textSub, lineHeight: 20 },

    /* Emergency */
    emergencyCard: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: Colors.red + '12', borderRadius: 14,        
  padding: 16,
      borderWidth: 1, borderColor: Colors.red + '30',
    },
    emergencyEmoji: { fontSize: 28 },
    emergencyTitle: { fontSize: 13, fontFamily: Fonts.bold, color: 
  Colors.text, letterSpacing: 1 },
    emergencySub: { fontSize: 12, fontFamily: Fonts.regular, color:
   Colors.textMuted, marginTop: 2 },
    emergencyArrow: { fontSize: 18, color: Colors.red },
  });

