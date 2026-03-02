
  import { View, Text, StyleSheet, ScrollView, Pressable, Modal, TextInput } from    
  'react-native';
  import { SafeAreaView } from 'react-native-safe-area-context';
  import { MaterialCommunityIcons } from '@expo/vector-icons';
  import { useState } from 'react';
  import { Colors } from '@/constants/colors';
  import { Fonts } from '@/constants/fonts';
  import FadeInView from '@/components/FadeInView';
  import AnimatedPressable from '@/components/AnimatedPressable';

  type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];       

  const gymData = {
    name:        'IronEdge Fitness',
    tagline:     'No Pain, No Gain',
    owner:       'Rajesh Kumar',
    phone:       '9876543210',
    email:       'ironedge@gmail.com',
    address:     'Plot 14, Sector 18, Noida, UP — 201301',
    established: '2019',
    gstin:       '09ABCDE1234F1Z5',
    capacity:    120,
    currentLoad: 148,
    rating:      4.7,
    totalReviews:214,
  };

  const timings = [
    { day: 'Mon – Fri', open: '5:30 AM', close: '10:00 PM' },
    { day: 'Saturday',  open: '6:00 AM', close: '9:00 PM'  },
    { day: 'Sunday',    open: '7:00 AM', close: '2:00 PM'  },
  ];

  const amenities: { label: string; icon: IconName; active: boolean }[] = [
    { label: 'AC',             icon: 'air-conditioner',        active: true  },      
    { label: 'Parking',        icon: 'car-outline',            active: true  },      
    { label: 'Locker Room',    icon: 'lock-outline',           active: true  },      
    { label: 'Steam Room',     icon: 'weather-fog',            active: true  },      
    { label: 'Juice Bar',      icon: 'cup-outline',            active: false },      
    { label: 'Personal Training',icon: 'account-supervisor-outline', active: true }, 
    { label: 'Yoga Room',      icon: 'yoga',                   active: true  },      
    { label: 'Cardio Zone',    icon: 'run-fast',               active: true  },      
  ];

  const socialLinks = [
    { platform: 'Instagram', handle: '@ironedgefitness', icon: 'instagram' as        
  IconName, color: '#E1306C' },
    { platform: 'Facebook',  handle: 'IronEdge Fitness', icon: 'facebook'  as        
  IconName, color: '#1877F2' },
    { platform: 'YouTube',   handle: 'IronEdge Official',icon: 'youtube'   as        
  IconName, color: '#FF0000' },
  ];

  export default function GymProfileScreen() {
    const [editModal, setEditModal] = useState(false);
    const [timingModal, setTimingModal] = useState(false);
    const [name, setName]     = useState(gymData.name);
    const [phone, setPhone]   = useState(gymData.phone);
    const [email, setEmail]   = useState(gymData.email);
    const [address, setAddress] = useState(gymData.address);

    const loadPct = Math.min(100, Math.round((gymData.currentLoad / gymData.capacity)
   * 100));

    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScrollView style={styles.container} contentContainerStyle={styles.scroll}   
  showsVerticalScrollIndicator={false}>

          {/* ── Hero ────────────────────────────────────────── */}
          <FadeInView delay={0}>
            <View style={styles.hero}>
              <View style={styles.heroGlow} />
              {/* Logo placeholder */}
              <View style={styles.logoWrap}>
                <View style={styles.logoCircle}>
                  <MaterialCommunityIcons name="dumbbell" size={28}
  color={Colors.accent} />
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroMicro}>GYM PROFILE</Text>
                <Text style={styles.heroTitle}>{gymData.name}</Text>
                <Text style={styles.heroTagline}>"{gymData.tagline}"</Text>
                <View style={styles.ratingRow}>
                  <MaterialCommunityIcons name="star" size={13} color={Colors.accent}
   />
                  <Text style={styles.ratingVal}>{gymData.rating}</Text>
                  <Text style={styles.ratingCount}>({gymData.totalReviews}
  reviews)</Text>
                </View>
              </View>
              <AnimatedPressable style={styles.editFab} scaleDown={0.9} onPress={()=> setEditModal(true)}>
                <MaterialCommunityIcons name="pencil-outline" size={16}
  color={Colors.accent} />
              </AnimatedPressable>
            </View>
          </FadeInView>

          {/* ── Capacity Bar ────────────────────────────────── */}
          <FadeInView delay={60}>
            <View style={styles.capacityCard}>
              <View style={styles.cardAccentBar} />
              <View style={styles.capacityInner}>
                <View style={styles.capacityTop}>
                  <Text style={styles.capacityLabel}>GYM CAPACITY</Text>
                  <Text style={styles.capacityFraction}>
                    <Text style={styles.capacityCurrent}>{gymData.currentLoad}</Text>
                    <Text style={styles.capacityTotal}> / {gymData.capacity}</Text>  
                  </Text>
                </View>
                <View style={styles.trackBg}>
                  <View style={[styles.trackFill, {
                    width: `${loadPct}%` as any,
                    backgroundColor: loadPct > 100 ? Colors.red : loadPct > 80 ?     
  Colors.orange : Colors.green,
                  }]} />
                </View>
                <View style={styles.capacityBottom}>
                  <Text style={styles.capacitySub}>{loadPct}% capacity
  utilised</Text>
                  <Text style={[styles.capacityStatus, {
                    color: loadPct > 100 ? Colors.red : loadPct > 80 ? Colors.orange 
  : Colors.green,
                  }]}>{loadPct > 100 ? 'OVER CAPACITY' : loadPct > 80 ? 'NEAR FULL' :
   'HEALTHY'}</Text>
                </View>
              </View>
            </View>
          </FadeInView>

          {/* ── Contact Info ─────────────────────────────────── */}
          <FadeInView delay={120}>
            <Text style={styles.sectionLabel}>CONTACT DETAILS</Text>
            <View style={styles.infoCard}>
              {[
                { icon: 'account-outline'    as IconName, label: 'OWNER',    val:    
  gymData.owner      },
                { icon: 'phone-outline'      as IconName, label: 'PHONE',    val:    
  gymData.phone      },
                { icon: 'email-outline'      as IconName, label: 'EMAIL',    val:    
  gymData.email      },
                { icon: 'map-marker-outline' as IconName, label: 'ADDRESS',  val:    
  gymData.address    },
                { icon: 'identifier'         as IconName, label: 'GSTIN',    val:    
  gymData.gstin      },
                { icon: 'calendar-outline'   as IconName, label: 'EST.',     val:    
  gymData.established},
              ].map((row, i, arr) => (
                <View key={row.label} style={[styles.infoRow, i < arr.length - 1 &&  
  styles.infoRowBorder]}>
                  <View style={styles.infoIconWrap}>
                    <MaterialCommunityIcons name={row.icon} size={15}
  color={Colors.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.infoLabel}>{row.label}</Text>
                    <Text style={styles.infoVal}>{row.val}</Text>
                  </View>
                </View>
              ))}
            </View>
          </FadeInView>

          {/* ── Timings ──────────────────────────────────────── */}
          <FadeInView delay={200}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>TIMINGS</Text>
              <Pressable onPress={() => setTimingModal(true)}>
                <Text style={styles.editLink}>EDIT</Text>
              </Pressable>
            </View>
            <View style={styles.infoCard}>
              {timings.map((t, i) => (
                <View key={t.day} style={[styles.timingRow, i < timings.length - 1 &&
   styles.infoRowBorder]}>
                  <MaterialCommunityIcons name="clock-outline" size={14}
  color={Colors.textMuted} />
                  <Text style={styles.timingDay}>{t.day}</Text>
                  <Text style={styles.timingHours}>{t.open} – {t.close}</Text>       
                </View>
              ))}
            </View>
          </FadeInView>

          {/* ── Amenities ────────────────────────────────────── */}
          <FadeInView delay={280}>
            <Text style={styles.sectionLabel}>AMENITIES</Text>
            <View style={styles.amenitiesGrid}>
              {amenities.map(a => (
                <View key={a.label} style={[styles.amenityChip, !a.active &&
  styles.amenityInactive]}>
                  <MaterialCommunityIcons
                    name={a.icon}
                    size={15}
                    color={a.active ? Colors.accent : Colors.textMuted}
                  />
                  <Text style={[styles.amenityLabel, !a.active &&
  styles.amenityLabelInactive]}>{a.label}</Text>
                  {!a.active && <Text style={styles.amenityNA}>N/A</Text>}
                </View>
              ))}
            </View>
          </FadeInView>

          {/* ── Social Links ─────────────────────────────────── */}
          <FadeInView delay={360}>
            <Text style={styles.sectionLabel}>SOCIAL MEDIA</Text>
            {socialLinks.map((s, i) => (
              <View key={s.platform} style={[styles.socialRow, i < socialLinks.length
   - 1 && { marginBottom: 8 }]}>
                <View style={[styles.socialIcon, { backgroundColor: s.color + '18'   
  }]}>
                  <MaterialCommunityIcons name={s.icon} size={18} color={s.color} /> 
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.socialPlatform}>{s.platform}</Text>
                  <Text style={styles.socialHandle}>{s.handle}</Text>
                </View>
                <MaterialCommunityIcons name="open-in-new" size={15}
  color={Colors.textMuted} />
              </View>
            ))}
          </FadeInView>

          <View style={{ height: 32 }} />
        </ScrollView>

        {/* ── Edit Modal ───────────────────────────────────── */}
        <Modal visible={editModal} transparent animationType="slide"
  onRequestClose={() => setEditModal(false)}>
          <Pressable style={styles.backdrop} onPress={() => setEditModal(false)} />  
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>EDIT GYM PROFILE</Text>
              <Pressable style={styles.closeBtn} onPress={() => setEditModal(false)}>
                <MaterialCommunityIcons name="close" size={18}
  color={Colors.textMuted} />
              </Pressable>
            </View>

            {[
              { label: 'GYM NAME', value: name,    setter: setName,    placeholder:  
  'Iron Edge Fitness' },
              { label: 'PHONE',    value: phone,   setter: setPhone,   placeholder:  
  '9876543210'         },
              { label: 'EMAIL',    value: email,   setter: setEmail,   placeholder:  
  'gym@email.com'      },
              { label: 'ADDRESS',  value: address, setter: setAddress, placeholder:  
  'Full address'       },
            ].map(f => (
              <View key={f.label} style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>{f.label}</Text>
                <TextInput
                  value={f.value}
                  onChangeText={f.setter}
                  placeholder={f.placeholder}
                  placeholderTextColor={Colors.textMuted}
                  style={styles.input}
                />
              </View>
            ))}

            <AnimatedPressable style={styles.saveBtn} scaleDown={0.97} onPress={() =>
   setEditModal(false)}>
              <Text style={styles.saveBtnText}>SAVE CHANGES</Text>
            </AnimatedPressable>
          </View>
        </Modal>

        {/* ── Timing Modal ─────────────────────────────────── */}
        <Modal visible={timingModal} transparent animationType="slide"
  onRequestClose={() => setTimingModal(false)}>
          <Pressable style={styles.backdrop} onPress={() => setTimingModal(false)} />
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>EDIT TIMINGS</Text>
              <Pressable style={styles.closeBtn} onPress={() =>
  setTimingModal(false)}>
                <MaterialCommunityIcons name="close" size={18}
  color={Colors.textMuted} />
              </Pressable>
            </View>
            <Text style={styles.modalSub}>Timing editor coming soon.</Text>
            <AnimatedPressable style={styles.saveBtn} scaleDown={0.97} onPress={() =>
   setTimingModal(false)}>
              <Text style={styles.saveBtnText}>CLOSE</Text>
            </AnimatedPressable>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  const styles = StyleSheet.create({
    safe:      { flex: 1, backgroundColor: Colors.bg },
    container: { flex: 1 },
    scroll:    { paddingHorizontal: 16, paddingBottom: 24, paddingTop: 16 },

    // Hero
    hero: {
      backgroundColor: Colors.bgCard, borderRadius: 20, padding: 20,
      flexDirection: 'row', alignItems: 'flex-start', gap: 14,
      borderWidth: 1, borderColor: Colors.accent + '20',
      overflow: 'hidden', marginBottom: 12,
    },
    heroGlow: {
      position: 'absolute', top: -30, left: -20,
      width: 100, height: 100, borderRadius: 50,
      backgroundColor: Colors.accentGlow,
    },
    logoWrap:   { alignItems: 'center' },
    logoCircle: {
      width: 56, height: 56, borderRadius: 28,
      backgroundColor: Colors.accentMuted,
      justifyContent: 'center', alignItems: 'center',
      borderWidth: 2, borderColor: Colors.accent + '40',
    },
    heroMicro:   { fontFamily: Fonts.medium, fontSize: 9, color: Colors.accent,      
  letterSpacing: 1.5 },
    heroTitle:   { fontFamily: Fonts.condensedBold, fontSize: 22, color: Colors.text,
   letterSpacing: 0.3, marginTop: 2 },
    heroTagline: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, 
  fontStyle: 'italic', marginTop: 2 },
    ratingRow:   { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6  
  },
    ratingVal:   { fontFamily: Fonts.bold, fontSize: 12, color: Colors.accent },     
    ratingCount: { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted  
  },
    editFab: {
      width: 34, height: 34, borderRadius: 17,
      backgroundColor: Colors.accentMuted,
      justifyContent: 'center', alignItems: 'center',
      borderWidth: 1, borderColor: Colors.accent + '30',
    },

    // Capacity
    capacityCard: {
      flexDirection: 'row', backgroundColor: Colors.bgCard,
      borderRadius: 14, borderWidth: 1, borderColor: Colors.border,
      overflow: 'hidden', marginBottom: 20,
    },
    cardAccentBar:  { width: 3, backgroundColor: Colors.accent },
    capacityInner:  { flex: 1, padding: 14, gap: 8 },
    capacityTop:    { flexDirection: 'row', justifyContent: 'space-between',
  alignItems: 'center' },
    capacityLabel:  { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted,  
  letterSpacing: 1.2 },
    capacityFraction:{ fontFamily: Fonts.regular, fontSize: 13, color:
  Colors.textMuted },
    capacityCurrent: { fontFamily: Fonts.condensedBold, fontSize: 20, color:
  Colors.text },
    capacityTotal:   { fontFamily: Fonts.regular, fontSize: 13, color:
  Colors.textMuted },
    trackBg:   { height: 6, backgroundColor: Colors.border, borderRadius: 3,
  overflow: 'hidden' },
    trackFill: { height: 6, borderRadius: 3 },
    capacityBottom: { flexDirection: 'row', justifyContent: 'space-between',
  alignItems: 'center' },
    capacitySub:    { fontFamily: Fonts.regular, fontSize: 10, color:
  Colors.textMuted },
    capacityStatus: { fontFamily: Fonts.bold, fontSize: 9, letterSpacing: 0.8 },

    // Section
    sectionLabel:  { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted,   
  letterSpacing: 1.8, marginBottom: 10, marginTop: 4 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between',
  alignItems: 'center' },
    editLink:      { fontFamily: Fonts.bold, fontSize: 9, color: Colors.accent,      
  letterSpacing: 1 },

    // Info card
    infoCard:     { backgroundColor: Colors.bgCard, borderRadius: 14, borderWidth: 1,
   borderColor: Colors.border, overflow: 'hidden', marginBottom: 20 },
    infoRow:      { flexDirection: 'row', alignItems: 'flex-start', gap: 12,
  paddingHorizontal: 14, paddingVertical: 12 },
    infoRowBorder:{ borderBottomWidth: 1, borderBottomColor: Colors.border },        
    infoIconWrap: { width: 30, height: 30, borderRadius: 8, backgroundColor:
  Colors.accentMuted, justifyContent: 'center', alignItems: 'center', marginTop: 1 },
    infoLabel:    { fontFamily: Fonts.bold, fontSize: 8, color: Colors.textMuted,    
  letterSpacing: 1, marginBottom: 2 },
    infoVal:      { fontFamily: Fonts.medium, fontSize: 13, color: Colors.text },    

    // Timings
    timingRow: { flexDirection: 'row', alignItems: 'center', gap: 10,
  paddingHorizontal: 14, paddingVertical: 12 },
    timingDay: { fontFamily: Fonts.medium, fontSize: 12, color: Colors.textMuted,    
  flex: 1 },
    timingHours: { fontFamily: Fonts.bold, fontSize: 12, color: Colors.text },       

    // Amenities
    amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20
   },
    amenityChip: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: Colors.bgCard, borderRadius: 20,
      paddingHorizontal: 12, paddingVertical: 7,
      borderWidth: 1, borderColor: Colors.accent + '30',
    },
    amenityInactive: { borderColor: Colors.border, opacity: 0.5 },
    amenityLabel:    { fontFamily: Fonts.medium, fontSize: 11, color: Colors.text }, 
    amenityLabelInactive: { color: Colors.textMuted },
    amenityNA:       { fontFamily: Fonts.bold, fontSize: 8, color: Colors.red,       
  letterSpacing: 0.5 },

    // Social
    socialRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: Colors.bgCard, borderRadius: 12, padding: 12,
      borderWidth: 1, borderColor: Colors.border,
    },
    socialIcon:     { width: 40, height: 40, borderRadius: 10, justifyContent:       
  'center', alignItems: 'center' },
    socialPlatform: { fontFamily: Fonts.bold, fontSize: 12, color: Colors.text },    
    socialHandle:   { fontFamily: Fonts.regular, fontSize: 11, color:
  Colors.textMuted, marginTop: 1 },

    // Modal
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' 
  },
    sheet: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      backgroundColor: Colors.bgCard,
      borderTopLeftRadius: 24, borderTopRightRadius: 24,
      paddingHorizontal: 20, paddingBottom: 36, paddingTop: 12,
    },
    handle:      { width: 36, height: 4, borderRadius: 2, backgroundColor:
  Colors.border, alignSelf: 'center', marginBottom: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems:
   'center', marginBottom: 20 },
    modalTitle:  { fontFamily: Fonts.condensedBold, fontSize: 20, color: Colors.text,
   letterSpacing: 0.5 },
    modalSub:    { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, 
  marginBottom: 20 },
    closeBtn:    { width: 32, height: 32, borderRadius: 16, backgroundColor:
  Colors.bgElevated, justifyContent: 'center', alignItems: 'center' },

    fieldWrap:  { marginBottom: 14 },
    fieldLabel: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted,      
  letterSpacing: 1.2, marginBottom: 6 },
    input: {
      backgroundColor: Colors.bgElevated, borderRadius: 10,
      borderWidth: 1, borderColor: Colors.border,
      paddingHorizontal: 14, paddingVertical: 11,
      fontFamily: Fonts.regular, fontSize: 14, color: Colors.text,
    },

    saveBtn:     { backgroundColor: Colors.accent, borderRadius: 12, paddingVertical:
   14, alignItems: 'center', marginTop: 8 },
    saveBtnText: { fontFamily: Fonts.bold, fontSize: 12, color: Colors.bg,
  letterSpacing: 1.2 },
  });