 import { View, Text, StyleSheet, ScrollView, Linking } from        'react-native';                                                  
  import { Stack } from 'expo-router';                               import { Colors } from '@/constants/colors';                     
  import AnimatedPressable from '@/components/AnimatedPressable';  
  import FadeInView from '@/components/FadeInView';                

  const gym = {
    name: 'FitZone Gym & Fitness',
    tagline: 'Transform Your Body, Transform Your Life',
    address: '204, 2nd Floor, Lokhandwala Complex,\nAndheri West,   Mumbai 400058',
    phone: '+91 98765 43210',
    email: 'fitzone.gym@gmail.com',
    established: '2020',
    owner: 'Nikhil Sharma',
  };

  const timings = [
    { day: 'Mon - Fri', time: '5:30 AM – 10:30 PM', emoji: '🏋️' }, 
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
    'Respect other members\' personal space',
  ];

  export default function GymInfoScreen() {
    return (
      <>
        <Stack.Screen options={{ title: '🏢 Gym Info' }} />        
        <ScrollView style={styles.container}
  contentContainerStyle={styles.content}
  showsVerticalScrollIndicator={false}>

          {/* Hero Card */}
          <FadeInView delay={0}>
            <View style={styles.heroCard}>
              <View style={styles.logoCircle}>
                <Text style={styles.logoEmoji}>💪</Text>
              </View>
              <Text style={styles.gymName}>{gym.name}</Text>       
              <Text style={styles.tagline}>{gym.tagline}</Text>    
              <Text style={styles.established}>Est.
  {gym.established} · Owner: {gym.owner}</Text>
            </View>
          </FadeInView>

          {/* Contact */}
          <FadeInView delay={80}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>📍 Contact &
  Location</Text>

              <View style={styles.infoRow}>
                <Text style={styles.infoEmoji}>📍</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>Address</Text>    
                  <Text
  style={styles.infoValue}>{gym.address}</Text>
                </View>
              </View>

              <AnimatedPressable style={styles.infoRow}
  scaleDown={0.98} onPress={() =>
  Linking.openURL(`tel:${gym.phone}`)}>
                <Text style={styles.infoEmoji}>📞</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>Phone</Text>      
                  <Text style={[styles.infoValue, { color:
  Colors.accent }]}>{gym.phone}</Text>
                </View>
                <Text style={styles.linkArrow}>→</Text>
              </AnimatedPressable>

              <AnimatedPressable style={styles.infoRow}
  scaleDown={0.98} onPress={() =>
  Linking.openURL(`mailto:${gym.email}`)}>
                <Text style={styles.infoEmoji}>📧</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>Email</Text>      
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
                <Text style={styles.mapBtnText}>🗺️ Open in Google  
  Maps</Text>
              </AnimatedPressable>
            </View>
          </FadeInView>

          {/* Timings */}
          <FadeInView delay={160}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🕐 Operating
  Hours</Text>
              {timings.map(t => (
                <View key={t.day} style={styles.timingRow}>        
                  <Text style={styles.timingEmoji}>{t.emoji}</Text>
                  <Text style={styles.timingDay}>{t.day}</Text>    
                  <Text style={styles.timingTime}>{t.time}</Text>  
                </View>
              ))}
              <View style={styles.holidayNote}>
                <Text style={styles.holidayText}>🔔 Check
  announcements for holiday timings</Text>
              </View>
            </View>
          </FadeInView>

          {/* Amenities */}
          <FadeInView delay={240}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>✨ Amenities &        
  Facilities</Text>
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
              <Text style={styles.cardTitle}>👨‍🏫 Our Trainers</Text>
              {trainers.map(t => (
                <View key={t.name} style={styles.trainerRow}>      
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
                    <Text style={styles.expText}>{t.exp}</Text>    
                  </View>
                </View>
              ))}
            </View>
          </FadeInView>

          {/* Gym Rules */}
          <FadeInView delay={400}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>📌 Gym Rules</Text>   
              {rules.map((r, i) => (
                <View key={i} style={styles.ruleRow}>
                  <View style={styles.ruleDot} />
                  <Text style={styles.ruleText}>{r}</Text>
                </View>
              ))}
            </View>
          </FadeInView>

          {/* Emergency Contact */}
          <FadeInView delay={480}>
            <AnimatedPressable
              style={styles.emergencyCard}
              scaleDown={0.97}
              onPress={() => Linking.openURL(`tel:${gym.phone}`)}  
            >
              <Text style={styles.emergencyEmoji}>🆘</Text>        
              <View style={{ flex: 1 }}>
                <Text style={styles.emergencyTitle}>Emergency /    
  Help</Text>
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

    heroCard: {
      backgroundColor: Colors.accentMuted, borderRadius: 20,       
  padding: 24,
      alignItems: 'center', gap: 6, borderWidth: 1, borderColor:   
  Colors.accent + '25',
    },
    logoCircle: {
      width: 68, height: 68, borderRadius: 34, backgroundColor:    
  Colors.bgCard,
      justifyContent: 'center', alignItems: 'center',
      borderWidth: 2, borderColor: Colors.accent + '30',
  marginBottom: 6,
    },
    logoEmoji: { fontSize: 30 },
    gymName: { fontSize: 20, fontWeight: '700', color: Colors.text,
   textAlign: 'center' },
    tagline: { fontSize: 13, color: Colors.textSub, fontStyle:     
  'italic', textAlign: 'center' },
    established: { fontSize: 12, color: Colors.textMuted,
  marginTop: 2 },

    card: { backgroundColor: Colors.bgCard, borderRadius: 16,      
  padding: 16, borderWidth: 1, borderColor: Colors.border, gap: 12 
  },
    cardTitle: { fontSize: 15, fontWeight: '700', color:
  Colors.text },

    infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap:
   10 },
    infoEmoji: { fontSize: 16, marginTop: 2 },
    infoLabel: { fontSize: 11, color: Colors.textMuted },
    infoValue: { fontSize: 14, fontWeight: '500', color:
  Colors.text, marginTop: 1 },
    linkArrow: { fontSize: 16, color: Colors.accent, marginTop: 8  
  },

    mapBtn: {
      backgroundColor: Colors.accentMuted, borderRadius: 10,       
  paddingVertical: 12,
      alignItems: 'center', borderWidth: 1, borderColor:
  Colors.accent + '30',
    },
    mapBtnText: { fontSize: 14, fontWeight: '600', color:
  Colors.accent },

    timingRow: { flexDirection: 'row', alignItems: 'center', gap:  
  10, paddingVertical: 4 },
    timingEmoji: { fontSize: 16 },
    timingDay: { flex: 1, fontSize: 14, fontWeight: '500', color:  
  Colors.text },
    timingTime: { fontSize: 13, color: Colors.accent, fontWeight:  
  '600' },
    holidayNote: { backgroundColor: Colors.bgElevated,
  borderRadius: 8, padding: 10 },
    holidayText: { fontSize: 12, color: Colors.textMuted },        

    amenGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },  
    amenChip: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, 
      backgroundColor: Colors.bgElevated,
    },
    amenEmoji: { fontSize: 14 },
    amenLabel: { fontSize: 12, fontWeight: '500', color:
  Colors.textSub },

    trainerRow: { flexDirection: 'row', alignItems: 'center', gap: 
  12, paddingVertical: 4 },
    trainerAvatar: {
      width: 42, height: 42, borderRadius: 21,
      backgroundColor: Colors.accentMuted, justifyContent:
  'center', alignItems: 'center',
    },
    trainerEmoji: { fontSize: 20 },
    trainerName: { fontSize: 14, fontWeight: '600', color:
  Colors.text },
    trainerSpec: { fontSize: 12, color: Colors.textMuted,
  marginTop: 1 },
    expBadge: { backgroundColor: Colors.bgElevated, borderRadius:  
  8, paddingHorizontal: 8, paddingVertical: 4 },
    expText: { fontSize: 12, fontWeight: '600', color:
  Colors.accent },

    ruleRow: { flexDirection: 'row', alignItems: 'flex-start', gap:
   10 },
    ruleDot: { width: 6, height: 6, borderRadius: 3,
  backgroundColor: Colors.accent, marginTop: 6 },
    ruleText: { flex: 1, fontSize: 13, color: Colors.textSub,      
  lineHeight: 20 },

    emergencyCard: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: Colors.red + '15', borderRadius: 14,        
  padding: 16,
      borderWidth: 1, borderColor: Colors.red + '30',
    },
    emergencyEmoji: { fontSize: 28 },
    emergencyTitle: { fontSize: 15, fontWeight: '700', color:      
  Colors.text },
    emergencySub: { fontSize: 12, color: Colors.textMuted,
  marginTop: 2 },
    emergencyArrow: { fontSize: 18, color: Colors.red },
  });
