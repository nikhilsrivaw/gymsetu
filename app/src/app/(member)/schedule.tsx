import { useState } from 'react';                                  import { View, Text, StyleSheet, ScrollView, Alert } from        
  'react-native';                                                    import { Colors } from '@/constants/colors';                     
  import { Fonts } from '@/constants/fonts';                         import AnimatedPressable from '@/components/AnimatedPressable';  
  import FadeInView from '@/components/FadeInView';                
                                                                     const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];  
                                                                     interface GymClass {                                             
    id: number; name: string; trainer: string; time: string;
    duration: string; spots: number; enrolled: number;
    color: string; booked: boolean;
  }

  const schedule: Record<string, GymClass[]> = {
    Mon: [
      { id: 1,  name: 'Morning Yoga',     trainer: 'Priya Sharma', 
   time: '6:00 AM',  duration: '60 min', spots: 15, enrolled: 12,  
  color: '#8B5CF6', booked: true  },
      { id: 2,  name: 'HIIT Blast',       trainer: 'Rajesh Kumar', 
   time: '7:30 AM',  duration: '45 min', spots: 20, enrolled: 18,  
  color: Colors.red, booked: false },
      { id: 3,  name: 'Strength Training',trainer: 'Amit Patel',   
   time: '6:00 PM',  duration: '60 min', spots: 12, enrolled: 8,   
  color: Colors.accent, booked: false },
    ],
    Tue: [
      { id: 4,  name: 'Zumba Dance',      trainer: 'Neha Verma',   
   time: '7:00 AM',  duration: '50 min', spots: 25, enrolled: 20,  
  color: Colors.orange, booked: false },
      { id: 5,  name: 'Core & Abs',       trainer: 'Rajesh Kumar', 
   time: '5:30 PM',  duration: '30 min', spots: 20, enrolled: 14,  
  color: '#EC4899',  booked: true  },
    ],
    Wed: [
      { id: 6,  name: 'Morning Yoga',     trainer: 'Priya Sharma', 
   time: '6:00 AM',  duration: '60 min', spots: 15, enrolled: 15,  
  color: '#8B5CF6', booked: false },
      { id: 7,  name: 'Spinning',         trainer: 'Vikram Singh', 
   time: '7:00 AM',  duration: '45 min', spots: 18, enrolled: 16,  
  color: Colors.green, booked: false },
      { id: 8,  name: 'Boxing Basics',    trainer: 'Amit Patel',   
   time: '6:30 PM',  duration: '60 min', spots: 10, enrolled: 7,   
  color: Colors.red, booked: false },
    ],
    Thu: [
      { id: 9,  name: 'HIIT Blast',       trainer: 'Rajesh Kumar', 
   time: '7:30 AM',  duration: '45 min', spots: 20, enrolled: 19,  
  color: Colors.red, booked: false },
      { id: 10, name: 'Pilates',          trainer: 'Neha Verma',   
   time: '5:00 PM',  duration: '55 min', spots: 15, enrolled: 10,  
  color: '#22C55E', booked: true  },
    ],
    Fri: [
      { id: 11, name: 'Full Body Burn',   trainer: 'Vikram Singh', 
   time: '6:30 AM',  duration: '60 min', spots: 20, enrolled: 12,  
  color: Colors.accent, booked: false },
      { id: 12, name: 'Yoga Flow',        trainer: 'Priya Sharma', 
   time: '7:00 PM',  duration: '60 min', spots: 15, enrolled: 9,   
  color: '#8B5CF6', booked: false },
    ],
    Sat: [
      { id: 13, name: 'Zumba Dance',      trainer: 'Neha Verma',   
   time: '8:00 AM',  duration: '50 min', spots: 25, enrolled: 22,  
  color: Colors.orange, booked: false },
      { id: 14, name: 'Strength Circuit', trainer: 'Amit Patel',   
   time: '10:00 AM', duration: '75 min', spots: 12, enrolled: 11,  
  color: Colors.accent, booked: true  },
    ],
    Sun: [
      { id: 15, name: 'Morning Stretch',  trainer: 'Priya Sharma', 
   time: '7:00 AM',  duration: '45 min', spots: 20, enrolled: 6,   
  color: '#22C55E', booked: false },
    ],
  };

  const today = new Date().getDay();
  const dayIndex = today === 0 ? 6 : today - 1;

  export default function ScheduleScreen() {
    const [selectedDay, setSelectedDay] = useState(dayIndex);      
    const [bookings, setBookings] = useState<Record<number,        
  boolean>>(() => {
      const init: Record<number, boolean> = {};
      Object.values(schedule).flat().forEach(c => { if (c.booked)  
  init[c.id] = true; });
      return init;
    });

    const toggleBooking = (cls: GymClass) => {
      const isBooked = bookings[cls.id];
      const isFull   = cls.enrolled >= cls.spots && !isBooked;     
      if (isFull) { Alert.alert('Class Full', 'This class is fully oked. Try another slot.'); return; }
      if (isBooked) {
        Alert.alert('Cancel Booking', `Cancel your spot in
  ${cls.name}?`, [
          { text: 'Keep It', style: 'cancel' },
          { text: 'Cancel', style: 'destructive', onPress: () =>   
            setBookings(prev => { const n = { ...prev }; delete    
  n[cls.id]; return n; }) },
        ]);
      } else {
        setBookings(prev => ({ ...prev, [cls.id]: true }));        
        Alert.alert('Booked', `Registered for ${cls.name} at       
  ${cls.time}.`);
      }
    };

    const dayClasses        = schedule[days[selectedDay]] || [];   
    const myBookingsCount   = Object.keys(bookings).length;        

    return (
      <ScrollView style={styles.container}
  contentContainerStyle={styles.content}
  showsVerticalScrollIndicator={false}>

        {/* ── Booking Banner ────────────────── */}
        {myBookingsCount > 0 && (
          <FadeInView delay={0}>
            <View style={styles.bookingBanner}>
              <View style={styles.bannerDot} />
              <Text style={styles.bannerText}>
                <Text style={{ color: Colors.accent, fontFamily:   
  Fonts.bold }}>{myBookingsCount}</Text>
                {' '}upcoming class{myBookingsCount > 1 ? 'es' :   
  ''} this week
              </Text>
            </View>
          </FadeInView>
        )}

        {/* ── Day Selector ──────────────────── */}
        <FadeInView delay={40}>
          <ScrollView horizontal
  showsHorizontalScrollIndicator={false}
  contentContainerStyle={styles.dayScroll}>
            {days.map((d, i) => {
              const active  = selectedDay === i;
              const isToday = i === dayIndex;
              const count   = (schedule[d] || []).length;
              return (
                <AnimatedPressable
                  key={d}
                  style={[styles.dayChip, active &&
  styles.dayChipActive]}
                  scaleDown={0.9}
                  onPress={() => setSelectedDay(i)}
                >
                  <Text style={[styles.dayText, active &&
  styles.dayTextActive]}>{d.toUpperCase()}</Text>
                  <Text style={[styles.dayCount, active && { color:
   '#FFF' }]}>{count}</Text>
                  {isToday && <View style={[styles.todayDot, active
   && { backgroundColor: '#FFF' }]} />}
                </AnimatedPressable>
              );
            })}
          </ScrollView>
        </FadeInView>

        {/* ── Day Label ─────────────────────── */}
        <View style={styles.dayHeader}>
          <Text style={styles.dayHeaderTitle}>{days[selectedDay].toUpperCase()}</Text>
          {selectedDay === dayIndex && <View
  style={styles.todayBadge}><Text
  style={styles.todayBadgeText}>TODAY</Text></View>}
          <Text style={styles.dayHeaderCount}>{dayClasses.length}  
  CLASSES</Text>
        </View>

        {/* ── Classes ───────────────────────── */}
        {dayClasses.length === 0 ? (
          <FadeInView delay={80}>
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>REST DAY</Text>      
              <Text style={styles.emptySub}>No classes scheduled — 
  enjoy the recovery!</Text>
            </View>
          </FadeInView>
        ) : (
          dayClasses.map((cls, i) => {
            const isBooked  = !!bookings[cls.id];
            const isFull    = cls.enrolled >= cls.spots &&
  !isBooked;
            const spotsLeft = cls.spots - cls.enrolled;
            const fillPct   = Math.round((cls.enrolled / cls.spots)
   * 100);

            return (
              <FadeInView key={cls.id} delay={80 + i * 70}>        
                <View style={[styles.classCard, isBooked && {      
  borderColor: cls.color + '40' }]}>
                  {/* Left color bar */}
                  <View style={[styles.classBar, { backgroundColor:
   cls.color }]} />

                  <View style={styles.classBody}>
                    {/* Top row */}
                    <View style={styles.classTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.className, isBooked &&
   { color: cls.color }]}>
                          {cls.name.toUpperCase()}
                        </Text>
                        <Text
  style={styles.classTrainer}>{cls.trainer}</Text>
                      </View>
                      {isBooked && (
                        <View style={[styles.bookedBadge, {        
  backgroundColor: cls.color + '18' }]}>
                          <Text style={[styles.bookedText, { color:
   cls.color }]}>BOOKED</Text>
                        </View>
                      )}
                    </View>

                    {/* Info chips */}
                    <View style={styles.chipRow}>
                      {[cls.time, cls.duration].map((v, ci) => (   
                        <View key={ci} style={styles.chip}>        
                          <Text style={styles.chipText}>{v}</Text> 
                        </View>
                      ))}
                      <View style={[styles.chip, isFull && {       
  backgroundColor: Colors.red + '15' }]}>
                        <Text style={[styles.chipText, isFull && { 
  color: Colors.red }]}>
                          {isFull ? 'FULL' : `${spotsLeft} LEFT`}  
                        </Text>
                      </View>
                    </View>

                    {/* Capacity bar */}
                    <View style={styles.capacityRow}>
                      <View style={styles.capacityTrack}>
                        <View style={[styles.capacityFill, {       
                          width: `${fillPct}%` as any,
                          backgroundColor: isFull ? Colors.red :   
  cls.color,
                        }]} />
                      </View>
                      <Text
  style={styles.capacityText}>{cls.enrolled}/{cls.spots}</Text>    
                    </View>

                    {/* Book button */}
                    <AnimatedPressable
                      style={[
                        styles.bookBtn,
                        isBooked  && styles.bookBtnCancelled,      
                        isFull && !isBooked && styles.bookBtnFull, 
                        !isBooked && !isFull && { backgroundColor: 
  cls.color },
                      ]}
                      scaleDown={0.97}
                      onPress={() => toggleBooking(cls)}
                    >
                      <Text style={[styles.bookBtnText, (isBooked  
  || isFull) && { color: Colors.textMuted }]}>
                        {isBooked ? 'CANCEL BOOKING' : isFull ?    
  'CLASS FULL' : 'BOOK THIS CLASS'}
                      </Text>
                    </AnimatedPressable>
                  </View>
                </View>
              </FadeInView>
            );
          })
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    content: { padding: 16, gap: 12 },

    bookingBanner: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      backgroundColor: Colors.accentMuted, borderRadius: 12,       
  padding: 14,
      borderWidth: 1, borderColor: Colors.accent + '30',
    },
    bannerDot: { width: 8, height: 8, borderRadius: 4,
  backgroundColor: Colors.accent },
    bannerText: { fontFamily: Fonts.regular, fontSize: 13, color:  
  Colors.textSub },

    dayScroll: { gap: 8, paddingVertical: 4 },
    dayChip: {
      width: 52, alignItems: 'center', paddingVertical: 10,        
      borderRadius: 10, backgroundColor: Colors.bgCard,
      borderWidth: 1, borderColor: Colors.border, gap: 3,
    },
    dayChipActive: { backgroundColor: Colors.accent, borderColor:  
  Colors.accent },
    dayText: { fontFamily: Fonts.bold, fontSize: 11, color:        
  Colors.textMuted, letterSpacing: 0.5 },
    dayTextActive: { color: '#FFF' },
    dayCount: { fontFamily: Fonts.condensedBold, fontSize: 14,     
  color: Colors.textMuted },
    todayDot: { width: 4, height: 4, borderRadius: 2,
  backgroundColor: Colors.accent },

    dayHeader: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
    },
    dayHeaderTitle: {
      fontFamily: Fonts.condensedBold,
      fontSize: 28, color: Colors.text, letterSpacing: 0.5, flex:  
  1,
    },
    todayBadge: {
      backgroundColor: Colors.accentMuted, borderRadius: 6,        
      paddingHorizontal: 8, paddingVertical: 3,
    },
    todayBadgeText: {
      fontFamily: Fonts.bold, fontSize: 9, color: Colors.accent,   
  letterSpacing: 0.8,
    },
    dayHeaderCount: {
      fontFamily: Fonts.medium, fontSize: 10, color:
  Colors.textMuted, letterSpacing: 0.8,
    },

    emptyCard: {
      alignItems: 'center', paddingVertical: 52,
      backgroundColor: Colors.bgCard, borderRadius: 16,
      borderWidth: 1, borderColor: Colors.border, gap: 8,
    },
    emptyTitle: { fontFamily: Fonts.condensedBold, fontSize: 28,   
  color: Colors.textMuted, letterSpacing: 1 },
    emptySub: { fontFamily: Fonts.regular, fontSize: 13, color:    
  Colors.textMuted },

    classCard: {
      backgroundColor: Colors.bgCard, borderRadius: 14,
      borderWidth: 1, borderColor: Colors.border,
      flexDirection: 'row', overflow: 'hidden',
    },
    classBar: { width: 4 },
    classBody: { flex: 1, padding: 14, gap: 10 },
    classTop: { flexDirection: 'row', alignItems: 'flex-start' },  
    className: {
      fontFamily: Fonts.condensedBold,
      fontSize: 16, color: Colors.text, letterSpacing: 0.3,        
    },
    classTrainer: {
      fontFamily: Fonts.regular, fontSize: 12, color:
  Colors.textMuted, marginTop: 2,
    },
    bookedBadge: { borderRadius: 6, paddingHorizontal: 8,
  paddingVertical: 4 },
    bookedText: { fontFamily: Fonts.bold, fontSize: 9,
  letterSpacing: 0.8 },

    chipRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },   
    chip: {
      backgroundColor: Colors.bgElevated, borderRadius: 6,
      paddingHorizontal: 10, paddingVertical: 5,
    },
    chipText: { fontFamily: Fonts.medium, fontSize: 11, color:     
  Colors.textSub },

    capacityRow: { flexDirection: 'row', alignItems: 'center', gap:
   10 },
    capacityTrack: {
      flex: 1, height: 3, backgroundColor: Colors.border,
  borderRadius: 2, overflow: 'hidden',
    },
    capacityFill: { height: 3, borderRadius: 2 },
    capacityText: { fontFamily: Fonts.condensedSemi, fontSize: 12, 
  color: Colors.textMuted },

    bookBtn: { borderRadius: 10, paddingVertical: 12, alignItems:  
  'center' },
    bookBtnCancelled: { backgroundColor: Colors.bgElevated,        
  borderWidth: 1, borderColor: Colors.border },
    bookBtnFull: { backgroundColor: Colors.bgElevated, opacity: 0.5
   },
    bookBtnText: { fontFamily: Fonts.bold, fontSize: 12, color:    
  '#FFF', letterSpacing: 0.8 },
  });