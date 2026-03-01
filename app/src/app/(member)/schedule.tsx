  import { useState } from 'react';                                  import { View, Text, StyleSheet, ScrollView, Alert } from        
  'react-native';                                                    import { Colors } from '@/constants/colors';                     
  import AnimatedPressable from '@/components/AnimatedPressable';  
  import FadeInView from '@/components/FadeInView';                

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];  

  interface GymClass {
    id: number;
    name: string;
    trainer: string;
    time: string;
    duration: string;
    spots: number;
    enrolled: number;
    emoji: string;
    color: string;
    booked: boolean;
  }

  const schedule: Record<string, GymClass[]> = {
    Mon: [
      { id: 1, name: 'Morning Yoga', trainer: 'Priya Sharma', time:
   '6:00 AM', duration: '60 min', spots: 15, enrolled: 12, emoji:  
  '🧘', color: '#8B5CF6', booked: true },
      { id: 2, name: 'HIIT Blast', trainer: 'Rajesh Kumar', time:  
  '7:30 AM', duration: '45 min', spots: 20, enrolled: 18, emoji:   
  '🔥', color: Colors.red, booked: false },
      { id: 3, name: 'Strength Training', trainer: 'Amit Patel',   
  time: '6:00 PM', duration: '60 min', spots: 12, enrolled: 8,     
  emoji: '🏋️', color: Colors.accent, booked: false },
    ],
    Tue: [
      { id: 4, name: 'Zumba Dance', trainer: 'Neha Verma', time:   
  '7:00 AM', duration: '50 min', spots: 25, enrolled: 20, emoji:   
  '💃', color: Colors.orange, booked: false },
      { id: 5, name: 'Core & Abs', trainer: 'Rajesh Kumar', time:  
  '5:30 PM', duration: '30 min', spots: 20, enrolled: 14, emoji:   
  '🧱', color: '#EC4899', booked: true },
    ],
    Wed: [
      { id: 6, name: 'Morning Yoga', trainer: 'Priya Sharma', time:
   '6:00 AM', duration: '60 min', spots: 15, enrolled: 15, emoji:  
  '🧘', color: '#8B5CF6', booked: false },
      { id: 7, name: 'Spinning', trainer: 'Vikram Singh', time:    
  '7:00 AM', duration: '45 min', spots: 18, enrolled: 16, emoji:   
  '🚴', color: Colors.green, booked: false },
      { id: 8, name: 'Boxing Basics', trainer: 'Amit Patel', time: 
  '6:30 PM', duration: '60 min', spots: 10, enrolled: 7, emoji:    
  '🥊', color: Colors.red, booked: false },
    ],
    Thu: [
      { id: 9, name: 'HIIT Blast', trainer: 'Rajesh Kumar', time:  
  '7:30 AM', duration: '45 min', spots: 20, enrolled: 19, emoji:   
  '🔥', color: Colors.red, booked: false },
      { id: 10, name: 'Pilates', trainer: 'Neha Verma', time: '5:00PM', duration: '55 min', spots: 15, enrolled: 10, emoji: '🤸', color: '#22C55E', booked: true },
    ],
    Fri: [
      { id: 11, name: 'Full Body Burn', trainer: 'Vikram Singh',   
  time: '6:30 AM', duration: '60 min', spots: 20, enrolled: 12,    
  emoji: '💪', color: Colors.accent, booked: false },
      { id: 12, name: 'Yoga Flow', trainer: 'Priya Sharma', time:  
  '7:00 PM', duration: '60 min', spots: 15, enrolled: 9, emoji:    
  '🧘', color: '#8B5CF6', booked: false },
    ],
    Sat: [
      { id: 13, name: 'Zumba Dance', trainer: 'Neha Verma', time:  
  '8:00 AM', duration: '50 min', spots: 25, enrolled: 22, emoji:   
  '💃', color: Colors.orange, booked: false },
      { id: 14, name: 'Strength Circuit', trainer: 'Amit Patel',   
  time: '10:00 AM', duration: '75 min', spots: 12, enrolled: 11,   
  emoji: '🏋️', color: Colors.accent, booked: true },
    ],
    Sun: [
      { id: 15, name: 'Morning Stretch', trainer: 'Priya Sharma',  
  time: '7:00 AM', duration: '45 min', spots: 20, enrolled: 6,
  emoji: '🌅', color: '#22C55E', booked: false },
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
      const isFull = cls.enrolled >= cls.spots && !isBooked;       

      if (isFull) {
        Alert.alert('Class Full', 'This class is fully booked. Try another time slot.');
        return;
      }

      if (isBooked) {
        Alert.alert('Cancel Booking', `Cancel your spot in
  ${cls.name}?`, [
          { text: 'Keep It', style: 'cancel' },
          { text: 'Cancel Booking', style: 'destructive', onPress: 
  () => setBookings(prev => { const n = { ...prev }; delete        
  n[cls.id]; return n; }) },
        ]);
      } else {
        setBookings(prev => ({ ...prev, [cls.id]: true }));        
        Alert.alert('✅ Booked!', `You're registered for
  ${cls.name} at ${cls.time}.`);
      }
    };

    const dayClasses = schedule[days[selectedDay]] || [];
    const myBookingsCount = Object.keys(bookings).length;

    return (
      <ScrollView style={styles.container}
  contentContainerStyle={styles.content}
  showsVerticalScrollIndicator={false}>

        {/* My Bookings Banner */}
        {myBookingsCount > 0 && (
          <FadeInView delay={0}>
            <View style={styles.bookingBanner}>
              <Text style={styles.bannerEmoji}>📅</Text>
              <Text style={styles.bannerText}>You have <Text       
  style={{ color: Colors.accent, fontWeight: '700'
  }}>{myBookingsCount}</Text> upcoming class{myBookingsCount > 1 ? 
  'es' : ''} this week</Text>
            </View>
          </FadeInView>
        )}

        {/* Day Selector */}
        <FadeInView delay={40}>
          <ScrollView horizontal
  showsHorizontalScrollIndicator={false}
  contentContainerStyle={styles.dayScroll}>
            {days.map((d, i) => {
              const active = selectedDay === i;
              const isToday = i === dayIndex;
              return (
                <AnimatedPressable
                  key={d}
                  style={[styles.dayChip, active &&
  styles.dayChipActive]}
                  scaleDown={0.92}
                  onPress={() => setSelectedDay(i)}
                >
                  <Text style={[styles.dayText, active &&
  styles.dayTextActive]}>{d}</Text>
                  {isToday && <View style={styles.todayDot} />}    
                </AnimatedPressable>
              );
            })}
          </ScrollView>
        </FadeInView>

        {/* Classes */}
        {dayClasses.length === 0 ? (
          <FadeInView delay={80}>
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>😴</Text>
              <Text style={styles.emptyText}>No classes
  scheduled</Text>
              <Text style={styles.emptySub}>Enjoy your rest        
  day!</Text>
            </View>
          </FadeInView>
        ) : (
          dayClasses.map((cls, i) => {
            const isBooked = !!bookings[cls.id];
            const isFull = cls.enrolled >= cls.spots && !isBooked; 
            const spotsLeft = cls.spots - cls.enrolled;

            return (
              <FadeInView key={cls.id} delay={80 + i * 70}>        
                <View style={[styles.classCard, isBooked && {      
  borderColor: cls.color + '50' }]}>
                  {/* Top Row */}
                  <View style={styles.classTop}>
                    <View style={[styles.classIcon, {
  backgroundColor: cls.color + '20' }]}>
                      <Text
  style={styles.classEmoji}>{cls.emoji}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.className, isBooked && {
   color: cls.color }]}>{cls.name}</Text>
                      <Text style={styles.classTrainer}>👨‍🏫      
  {cls.trainer}</Text>
                    </View>
                    {isBooked && (
                      <View style={[styles.bookedBadge, {
  backgroundColor: cls.color + '20' }]}>
                        <Text style={[styles.bookedText, { color:  
  cls.color }]}>✓ Booked</Text>
                      </View>
                    )}
                  </View>

                  {/* Info Row */}
                  <View style={styles.classInfo}>
                    <View style={styles.infoChip}>
                      <Text style={styles.infoChipText}>🕐
  {cls.time}</Text>
                    </View>
                    <View style={styles.infoChip}>
                      <Text style={styles.infoChipText}>⏱
  {cls.duration}</Text>
                    </View>
                    <View style={[styles.infoChip, isFull && {     
  backgroundColor: Colors.red + '15' }]}>
                      <Text style={[styles.infoChipText, isFull && 
  { color: Colors.red }]}>
                        {isFull ? '🔴 Full' : `🟢 ${spotsLeft}     
  spots left`}
                      </Text>
                    </View>
                  </View>

                  {/* Spots Bar */}
                  <View style={styles.spotsBar}>
                    <View style={[styles.spotsFill, {
                      width: `${(cls.enrolled / cls.spots) * 100}%`as any,
                      backgroundColor: isFull ? Colors.red :       
  cls.color,
                    }]} />
                  </View>
                  <Text
  style={styles.spotsText}>{cls.enrolled}/{cls.spots}
  enrolled</Text>

                  {/* Book Button */}
                  <AnimatedPressable
                    style={[
                      styles.bookBtn,
                      isBooked && { backgroundColor:
  Colors.bgElevated, borderWidth: 1, borderColor: Colors.border }, 
                      isFull && !isBooked && { backgroundColor:    
  Colors.bgElevated, opacity: 0.5 },
                      !isBooked && !isFull && { backgroundColor:   
  cls.color },
                    ]}
                    scaleDown={0.97}
                    onPress={() => toggleBooking(cls)}
                  >
                    <Text style={[styles.bookBtnText, isBooked && {
   color: Colors.textMuted }]}>
                      {isBooked ? '✕ Cancel Booking' : isFull ?    
  'Class Full' : '+ Book This Class'}
                    </Text>
                  </AnimatedPressable>
                </View>
              </FadeInView>
            );
          })
        )}

        <View style={{ height: 24 }} />
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
    bannerEmoji: { fontSize: 22 },
    bannerText: { fontSize: 13, color: Colors.textSub, flex: 1 },  

    dayScroll: { gap: 8, paddingVertical: 4 },
    dayChip: {
      width: 52, alignItems: 'center', paddingVertical: 10,        
  borderRadius: 12,
      backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: 
  Colors.border, gap: 4,
    },
    dayChipActive: { backgroundColor: Colors.accent, borderColor:  
  Colors.accent },
    dayText: { fontSize: 13, fontWeight: '600', color:
  Colors.textMuted },
    dayTextActive: { color: '#FFF' },
    todayDot: { width: 5, height: 5, borderRadius: 3,
  backgroundColor: Colors.accent },

    emptyCard: { alignItems: 'center', paddingVertical: 48, gap: 8 
  },
    emptyEmoji: { fontSize: 48 },
    emptyText: { fontSize: 16, fontWeight: '600', color:
  Colors.text },
    emptySub: { fontSize: 13, color: Colors.textMuted },

    classCard: {
      backgroundColor: Colors.bgCard, borderRadius: 16, padding:   
  14,
      borderWidth: 1, borderColor: Colors.border, gap: 10,
    },
    classTop: { flexDirection: 'row', alignItems: 'center', gap: 12
   },
    classIcon: { width: 48, height: 48, borderRadius: 12,
  justifyContent: 'center', alignItems: 'center' },
    classEmoji: { fontSize: 24 },
    className: { fontSize: 16, fontWeight: '700', color:
  Colors.text },
    classTrainer: { fontSize: 12, color: Colors.textMuted,
  marginTop: 2 },
    bookedBadge: { borderRadius: 8, paddingHorizontal: 10,
  paddingVertical: 4 },
    bookedText: { fontSize: 12, fontWeight: '700' },

    classInfo: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' }, 
    infoChip: { backgroundColor: Colors.bgElevated, borderRadius:  
  8, paddingHorizontal: 10, paddingVertical: 5 },
    infoChipText: { fontSize: 12, fontWeight: '500', color:        
  Colors.textSub },

    spotsBar: { height: 5, backgroundColor: Colors.border,
  borderRadius: 3, overflow: 'hidden' },
    spotsFill: { height: 5, borderRadius: 3 },
    spotsText: { fontSize: 11, color: Colors.textMuted },

    bookBtn: { borderRadius: 10, paddingVertical: 12, alignItems:  
  'center' },
    bookBtnText: { fontSize: 14, fontWeight: '700', color: '#FFF'  
  },
  });