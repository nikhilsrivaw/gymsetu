import { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Animated,
  Pressable,
} from 'react-native';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import LottieView from '@/components/AppLottie';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import AnimatedPressable from '@/components/AnimatedPressable';
import FadeInView from '@/components/FadeInView';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

import { toLocalDate } from '@/lib/date';
const DAYS     = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const today    = new Date().getDay();
const dayIndex = today === 0 ? 6 : today - 1;

const CLASS_EMOJIS: Record<string, string> = {
  yoga: '🧘', zumba: '💃', hiit: '🔥', spin: '🚴', boxing: '🥊',
  pilates: '🤸', cardio: '🏃', strength: '🏋️', crossfit: '⚡', default: '💪',
};

function getClassEmoji(name: string) {
  const lower = name.toLowerCase();
  for (const key of Object.keys(CLASS_EMOJIS)) {
    if (lower.includes(key)) return CLASS_EMOJIS[key];
  }
  return CLASS_EMOJIS.default;
}

function getWeekStart(): string {
  const d = new Date();
  const diff = d.getDay() === 0 ? -6 : 1 - d.getDay();
  d.setDate(d.getDate() + diff);
  return toLocalDate(d);
}

function getWeekDates(): string[] {
  const d = new Date();
  const diff = d.getDay() === 0 ? -6 : 1 - d.getDay();
  d.setDate(d.getDate() + diff);
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(d);
    date.setDate(d.getDate() + i);
    return String(date.getDate());
  });
}

interface GymClass {
  id: string;
  name: string;
  trainer_name: string;
  time: string;
  duration: string;
  spots: number;
  enrolled: number;
  color: string;
  day_of_week: string;
  booked: boolean;
}

interface TrainerSession {
  id: string;
  time: string;
  session_type: string;
  duration: string;
  location: string;
  status: 'upcoming' | 'done' | 'cancelled';
  day_of_week: string;
  trainer_name: string;
  color: string;
}

function ScheduleBackBtn() {
  const navigation = useNavigation();
  const router = useRouter();
  const canGoBack = navigation.canGoBack();
  return (
    <Pressable
      onPress={() => canGoBack ? router.back() : navigation.dispatch(DrawerActions.openDrawer())}
      style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: Colors.bgCard,
        borderWidth: 1, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center',
        marginBottom: 10 }}
      hitSlop={8}
    >
      <MaterialCommunityIcons name={canGoBack ? 'arrow-left' : 'menu'} size={18} color={Colors.text} />
    </Pressable>
  );
}

export default function ScheduleScreen() {
  const { profile, gymProfile } = useAuthStore();
  const [selectedDay, setSelectedDay]         = useState(dayIndex);
  const [classes, setClasses]                 = useState<GymClass[]>([]);
  const [trainerSessions, setTrainerSessions] = useState<TrainerSession[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [fetchError, setFetchError]           = useState<string | null>(null);
  const [bookingId, setBookingId]             = useState<string | null>(null);
  const [bookingError, setBookingError]       = useState<string | null>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const weekStart = getWeekStart();
  const weekDates = getWeekDates();
  const gymName   = gymProfile?.name ?? 'My Gym';

  const fetchData = useCallback(async () => {
    if (!profile?.id || !profile?.gym_id) return;
    setLoading(true);
    setFetchError(null);
    try {
      const [classesRes, bookingsRes, sessionsRes] = await Promise.all([
        supabase.from('gym_classes').select('*').eq('gym_id', profile.gym_id).order('time'),
        supabase.from('class_bookings').select('class_id')
          .eq('member_id', profile.id).eq('week_start', weekStart),
        supabase.from('trainer_sessions')
          .select('*, profiles!trainer_id(full_name)')
          .eq('member_id', profile.id)
          .eq('gym_id', profile.gym_id)
          .order('time'),
      ]);
      if (classesRes.error) throw classesRes.error;
      const bookedIds = new Set((bookingsRes.data ?? []).map((b: any) => b.class_id));
      setClasses((classesRes.data ?? []).map((c: any) => ({ ...c, booked: bookedIds.has(c.id) })));
      setTrainerSessions((sessionsRes.data ?? []).map((s: any) => ({
        ...s,
        trainer_name: s.profiles?.full_name ?? 'Your Trainer',
      })));
    } catch (e: any) {
      setFetchError(e.message ?? 'Failed to load schedule.');
    } finally {
      setLoading(false);
    }
  }, [profile?.id, profile?.gym_id]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const selectDay = (i: number) => {
    Animated.timing(slideAnim, { toValue: 0, duration: 80, useNativeDriver: true }).start(() => {
      setSelectedDay(i);
      Animated.timing(slideAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  };

  const toggleBooking = async (cls: GymClass) => {
    if (!profile?.id || !profile?.gym_id || bookingId === cls.id) return;
    const isFull = cls.enrolled >= cls.spots && !cls.booked;
    if (isFull) {
      Alert.alert('Class Full', 'This class is fully booked. Try another slot.');
      return;
    }
    setBookingError(null);

    if (cls.booked) {
      Alert.alert('Cancel Booking', `Cancel your spot in ${cls.name}?`, [
        { text: 'Keep It', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: async () => {
            setBookingId(cls.id);
            try {
              const { error } = await supabase.from('class_bookings').delete()
                .eq('class_id', cls.id).eq('member_id', profile.id).eq('week_start', weekStart);
              if (error) throw error;
              await supabase.from('gym_classes')
                .update({ enrolled: Math.max(0, cls.enrolled - 1) }).eq('id', cls.id);
              await fetchData();
            } catch (e: any) {
              setBookingError(e.message ?? 'Could not cancel booking.');
            } finally {
              setBookingId(null);
            }
          },
        },
      ]);
    } else {
      setBookingId(cls.id);
      try {
        const { error } = await supabase.from('class_bookings').insert({
          class_id: cls.id,
          member_id: profile.id,
          gym_id: profile.gym_id,
          week_start: weekStart,
        });
        if (error) throw error;
        await supabase.from('gym_classes').update({ enrolled: cls.enrolled + 1 }).eq('id', cls.id);
        Alert.alert('Booked! 🎉', `You're in for ${cls.name} at ${cls.time}.`);
        await fetchData();
      } catch (e: any) {
        setBookingError(e.message ?? 'Could not book class. Try again.');
      } finally {
        setBookingId(null);
      }
    }
  };

  const dayClasses        = classes.filter(c => c.day_of_week === DAYS[selectedDay]);
  const dayTrainerSessions = trainerSessions.filter(s => s.day_of_week === DAYS[selectedDay]);
  const myBookingsCount   = classes.filter(c => c.booked).length;
  const classesByDay    = DAYS.reduce((acc, d) => {
    acc[d] = classes.filter(c => c.day_of_week === d).length;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <View style={styles.loadingCard}>
            <LottieView source={require('@/assets/animations/runningCat.json')} autoPlay loop style={{ width: 180, height: 180 }} />
            <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 13, color: 'rgba(255,255,255,0.28)', letterSpacing: 2, marginTop: 8 }}>LOADING...</Text>
          </View>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── BACK / MENU ── */}
        <ScheduleBackBtn />

        {/* ── HEADER ── */}
        <FadeInView delay={0}>
          <View style={styles.header}>
            <View style={styles.headerGlow} />
            <View style={{ flex: 1 }}>
              <Text style={styles.headerSub}>{gymName.toUpperCase()}</Text>
              <Text style={styles.headerTitle}>CLASS SCHEDULE</Text>
              <Text style={styles.headerWeek}>Week of {weekStart}</Text>
            </View>
            <View style={styles.calIcon}>
              <MaterialCommunityIcons name="calendar-month" size={26} color={Colors.accent} />
            </View>
          </View>
        </FadeInView>

        {/* ── FETCH ERROR ── */}
        {fetchError && (
          <FadeInView delay={0}>
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>⚠️  {fetchError}</Text>
              <AnimatedPressable onPress={fetchData} style={styles.retryBtn} scaleDown={0.93}>
                <Text style={styles.retryText}>Retry</Text>
              </AnimatedPressable>
            </View>
          </FadeInView>
        )}

        {/* ── BOOKING ERROR ── */}
        {bookingError && (
          <FadeInView delay={0}>
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>⚠️  {bookingError}</Text>
            </View>
          </FadeInView>
        )}

        {/* ── BOOKINGS BANNER ── */}
        {myBookingsCount > 0 && (
          <FadeInView delay={40}>
            <View style={styles.bookingBanner}>
              <View style={styles.bannerPulse} />
              <Text style={styles.bannerEmoji}>✅</Text>
              <Text style={styles.bannerText}>
                You have{' '}
                <Text style={{ color: Colors.accent, fontFamily: Fonts.bold }}>
                  {myBookingsCount} class{myBookingsCount > 1 ? 'es' : ''}
                </Text>
                {' '}booked this week
              </Text>
            </View>
          </FadeInView>
        )}

        {/* ── WEEK OVERVIEW DOTS ── */}
        <FadeInView delay={60}>
          <View style={styles.weekOverview}>
            {DAYS.map((d, i) => {
              const count      = classesByDay[d] ?? 0;
              const isToday    = i === dayIndex;
              const isSelected = i === selectedDay;
              return (
                <View key={d} style={styles.weekDot}>
                  <View style={[
                    styles.dotBar,
                    { height: Math.max(4, Math.min(24, count * 6)) },
                    isSelected && { backgroundColor: Colors.accent },
                    isToday && !isSelected && { backgroundColor: Colors.accent + '60' },
                  ]} />
                  <Text style={[styles.dotLabel, isSelected && { color: Colors.accent }]}>
                    {d.charAt(0)}
                  </Text>
                </View>
              );
            })}
          </View>
        </FadeInView>

        {/* ── DAY SELECTOR ── */}
        <FadeInView delay={80}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dayScroll}
          >
            {DAYS.map((d, i) => {
              const active  = selectedDay === i;
              const isToday = i === dayIndex;
              const count   = classesByDay[d] ?? 0;
              return (
                <AnimatedPressable
                  key={d}
                  style={[styles.dayChip, active && styles.dayChipActive]}
                  scaleDown={0.88}
                  onPress={() => selectDay(i)}
                >
                  {isToday && !active && <View style={styles.todayDot} />}
                  <Text style={[styles.dayDate, active && { color: '#FFF' }]}>
                    {weekDates[i]}
                  </Text>
                  <Text style={[styles.dayText, active && styles.dayTextActive]}>
                    {d.toUpperCase()}
                  </Text>
                  <View style={[
                    styles.dayCountPill,
                    active && { backgroundColor: 'rgba(255,255,255,0.25)' },
                  ]}>
                    <Text style={[styles.dayCount, active && { color: '#FFF' }]}>{count}</Text>
                  </View>
                </AnimatedPressable>
              );
            })}
          </ScrollView>
        </FadeInView>

        {/* ── DAY LABEL ── */}
        <Animated.View style={[styles.dayHeader, { opacity: slideAnim }]}>
          <Text style={styles.dayHeaderTitle}>{DAY_FULL[selectedDay].toUpperCase()}</Text>
          <View style={styles.dayHeaderRight}>
            {selectedDay === dayIndex && (
              <View style={styles.todayBadge}>
                <Text style={styles.todayBadgeText}>TODAY</Text>
              </View>
            )}
            <Text style={styles.dayHeaderCount}>{dayClasses.length} CLASSES</Text>
          </View>
        </Animated.View>

        {/* ── TRAINER SESSIONS ── */}
        {dayTrainerSessions.length > 0 && (
          <FadeInView delay={90}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconBox}>
                <MaterialCommunityIcons name="whistle-outline" size={13} color={Colors.accent} />
              </View>
              <Text style={styles.sectionTitle}>MY TRAINER SESSIONS</Text>
              <View style={styles.sectionPill}>
                <Text style={styles.sectionPillText}>{dayTrainerSessions.length}</Text>
              </View>
            </View>
            {dayTrainerSessions.map((ts, i) => {
              const statusColor =
                ts.status === 'done'      ? Colors.green  :
                ts.status === 'cancelled' ? Colors.red    : Colors.accent;
              const statusLabel =
                ts.status === 'done'      ? 'DONE'       :
                ts.status === 'cancelled' ? 'CANCELLED'  : 'UPCOMING';
              const cardColor = ts.color || Colors.accent;
              return (
                <View
                  key={ts.id}
                  style={[styles.trainerSessionCard, { borderColor: cardColor + '30' }]}
                >
                  <View style={[styles.trainerSessionBar, { backgroundColor: cardColor }]} />
                  <View style={styles.trainerSessionBody}>
                    <View style={styles.trainerSessionTop}>
                      <View style={[styles.trainerSessionIconBox, { backgroundColor: cardColor + '18', borderColor: cardColor + '30' }]}>
                        <MaterialCommunityIcons name="dumbbell" size={16} color={cardColor} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.trainerSessionType}>{ts.session_type}</Text>
                        <Text style={styles.trainerSessionTrainer}>with {ts.trainer_name}</Text>
                      </View>
                      <View style={[styles.trainerStatusBadge, { backgroundColor: statusColor + '14', borderColor: statusColor + '30' }]}>
                        <Text style={[styles.trainerStatusText, { color: statusColor }]}>{statusLabel}</Text>
                      </View>
                    </View>
                    <View style={styles.trainerSessionMeta}>
                      <View style={styles.trainerChip}>
                        <MaterialCommunityIcons name="clock-outline" size={11} color={Colors.textMuted} />
                        <Text style={styles.trainerChipText}>{ts.time}</Text>
                      </View>
                      <View style={styles.trainerChip}>
                        <MaterialCommunityIcons name="timer-outline" size={11} color={Colors.textMuted} />
                        <Text style={styles.trainerChipText}>{ts.duration}</Text>
                      </View>
                      <View style={styles.trainerChip}>
                        <MaterialCommunityIcons name="map-marker-outline" size={11} color={Colors.textMuted} />
                        <Text style={styles.trainerChipText}>{ts.location}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </FadeInView>
        )}

        {/* ── GYM CLASSES HEADER ── */}
        {classes.length > 0 && (
          <FadeInView delay={95}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconBox, { backgroundColor: '#3B82F614', borderColor: '#3B82F625' }]}>
                <MaterialCommunityIcons name="account-group-outline" size={13} color="#3B82F6" />
              </View>
              <Text style={[styles.sectionTitle, { color: '#3B82F6' }]}>GYM CLASSES</Text>
            </View>
          </FadeInView>
        )}

        {/* ── CLASSES ── */}
        {classes.length === 0 ? (
          <FadeInView delay={100}>
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>🗓️</Text>
              <Text style={styles.emptyTitle}>NO CLASSES YET</Text>
              <Text style={styles.emptySub}>
                {gymName} hasn't added any classes yet. Check back soon!
              </Text>
            </View>
          </FadeInView>
        ) : dayClasses.length === 0 ? (
          <FadeInView delay={100}>
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>🛌</Text>
              <Text style={styles.emptyTitle}>REST DAY</Text>
              <Text style={styles.emptySub}>
                No classes on {DAY_FULL[selectedDay]} — recover well!
              </Text>
            </View>
          </FadeInView>
        ) : (
          dayClasses.map((cls, i) => {
            const isBooked  = cls.booked;
            const isFull    = cls.enrolled >= cls.spots && !isBooked;
            const spotsLeft = cls.spots - cls.enrolled;
            const fillPct   = Math.min(100, Math.round((cls.enrolled / cls.spots) * 100));
            const isLoading = bookingId === cls.id;
            const emoji     = getClassEmoji(cls.name);

            return (
              <FadeInView key={cls.id} delay={100 + i * 70}>
                <View style={[
                  styles.classCard,
                  isBooked && { borderColor: cls.color + '50', backgroundColor: cls.color + '08' },
                ]}>
                  <View style={[styles.classBar, { backgroundColor: cls.color }]} />
                  <View style={styles.classBody}>
                    <View style={styles.classTop}>
                      <View style={[styles.classEmojiBox, { backgroundColor: cls.color + '20' }]}>
                        <Text style={styles.classEmoji}>{emoji}</Text>
                      </View>
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={[styles.className, { color: isBooked ? cls.color : Colors.text }]}>
                          {cls.name.toUpperCase()}
                        </Text>
                        <Text style={styles.classTrainer}>👤 {cls.trainer_name}</Text>
                      </View>
                      {isBooked && (
                        <View style={[
                          styles.bookedBadge,
                          { backgroundColor: cls.color + '20', borderColor: cls.color + '50' },
                        ]}>
                          <Text style={[styles.bookedText, { color: cls.color }]}>✓ BOOKED</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.chipRow}>
                      <View style={styles.chip}>
                        <Text style={styles.chipEmoji}>🕐</Text>
                        <Text style={styles.chipText}>{cls.time}</Text>
                      </View>
                      <View style={styles.chip}>
                        <Text style={styles.chipEmoji}>⏱</Text>
                        <Text style={styles.chipText}>{cls.duration}</Text>
                      </View>
                      <View style={[styles.chip, isFull && styles.chipFull]}>
                        <Text style={styles.chipEmoji}>{isFull ? '🔴' : '🟢'}</Text>
                        <Text style={[styles.chipText, isFull && { color: '#FF6B6B' }]}>
                          {isFull ? 'FULL' : `${spotsLeft} spots`}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.capacityRow}>
                      <View style={styles.capacityTrack}>
                        <View style={[
                          styles.capacityFill,
                          {
                            width: `${fillPct}%` as any,
                            backgroundColor: isFull ? '#FF6B6B' : cls.color,
                          },
                        ]} />
                      </View>
                      <Text style={styles.capacityText}>{cls.enrolled}/{cls.spots}</Text>
                    </View>

                    <AnimatedPressable
                      style={[
                        styles.bookBtn,
                        isBooked && styles.bookBtnCancelled,
                        isFull && !isBooked && styles.bookBtnFull,
                        !isBooked && !isFull && { backgroundColor: cls.color },
                      ]}
                      scaleDown={0.97}
                      onPress={() => toggleBooking(cls)}
                      disabled={isLoading || (isFull && !isBooked)}
                    >
                      {isLoading ? (
                        <ActivityIndicator size="small" color={isBooked ? Colors.textMuted : '#FFF'} />
                      ) : (
                        <Text style={[
                          styles.bookBtnText,
                          (isBooked || isFull) && { color: Colors.textMuted },
                        ]}>
                          {isBooked
                            ? '✕  CANCEL BOOKING'
                            : isFull
                            ? 'CLASS FULL'
                            : `BOOK · ${cls.name.toUpperCase()}`}
                        </Text>
                      )}
                    </AnimatedPressable>
                  </View>
                </View>
              </FadeInView>
            );
          })
        )}

        {/* ── FOOTER ── */}
        <FadeInView delay={500}>
          <View style={styles.footer}>
            <Text style={styles.footerText}>{gymName.toUpperCase()} · CLASS SCHEDULE</Text>
          </View>
        </FadeInView>

        <View style={{ height: 32 }} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content:   { padding: 16, gap: 12 },

  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  loadingEmoji: { fontSize: 40 },
  loadingText: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: Colors.textMuted,
    marginTop: 10,
  },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.red + '15',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.red + '30',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  errorText: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.red,
  },
  retryBtn: {
    backgroundColor: Colors.red + '25',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  retryText: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    color: Colors.red,
    letterSpacing: 0.5,
  },

  // HEADER
  header: {
    backgroundColor: Colors.bgCard,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.accent + '30',
    overflow: 'hidden',
  },
  headerGlow: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.accent + '15',
  },
  headerSub: {
    fontSize: 9,
    fontFamily: Fonts.bold,
    color: Colors.accent,
    letterSpacing: 2,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: Fonts.condensedBold,
    color: Colors.text,
    letterSpacing: 1,
  },
  headerWeek: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    marginTop: 2,
  },
  calIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.bgElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calEmoji: { fontSize: 26 },

  // BOOKING BANNER
  bookingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.accentMuted,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.accent + '30',
    overflow: 'hidden',
  },
  bannerPulse: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: Colors.accent,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  bannerEmoji: { fontSize: 18 },
  bannerText: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.textMuted,
    flex: 1,
  },

  // WEEK OVERVIEW
  weekOverview: {
    flexDirection: 'row',
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    padding: 12,
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    borderWidth: 1,
    borderColor: Colors.border,
    height: 60,
  },
  weekDot: {
    alignItems: 'center',
    gap: 4,
    justifyContent: 'flex-end',
  },
  dotBar: {
    width: 14,
    borderRadius: 3,
    backgroundColor: Colors.border,
  },
  dotLabel: {
    fontSize: 9,
    fontFamily: Fonts.bold,
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },

  // DAY SELECTOR
  dayScroll: { gap: 8, paddingVertical: 4 },
  dayChip: {
    width: 58,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 2,
    position: 'relative',
  },
  dayChipActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  todayDot: {
    position: 'absolute',
    top: 6,
    right: 8,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.accent,
  },
  dayDate: {
    fontSize: 16,
    fontFamily: Fonts.condensedBold,
    color: Colors.textMuted,
  },
  dayText: {
    fontSize: 9,
    fontFamily: Fonts.bold,
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  dayTextActive: { color: '#FFF' },
  dayCountPill: {
    backgroundColor: Colors.bgElevated,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 2,
  },
  dayCount: {
    fontSize: 10,
    fontFamily: Fonts.bold,
    color: Colors.textMuted,
  },

  // DAY HEADER
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  dayHeaderTitle: {
    fontSize: 26,
    fontFamily: Fonts.condensedBold,
    color: Colors.text,
    letterSpacing: 0.5,
    flex: 1,
  },
  dayHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  todayBadge: {
    backgroundColor: Colors.accentMuted,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  todayBadgeText: {
    fontSize: 9,
    fontFamily: Fonts.bold,
    color: Colors.accent,
    letterSpacing: 0.8,
  },
  dayHeaderCount: {
    fontSize: 11,
    fontFamily: Fonts.medium,
    color: Colors.textMuted,
  },

  // EMPTY
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 52,
    backgroundColor: Colors.bgCard,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: {
    fontSize: 22,
    fontFamily: Fonts.condensedBold,
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  emptySub: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 28,
    lineHeight: 20,
  },

  // CLASS CARD
  classCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  classBar: { width: 4 },
  classBody: {
    flex: 1,
    padding: 14,
    gap: 10,
  },
  classTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  classEmojiBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  classEmoji: { fontSize: 20 },
  className: {
    fontSize: 15,
    fontFamily: Fonts.condensedBold,
    letterSpacing: 0.3,
  },
  classTrainer: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    marginTop: 2,
  },
  bookedBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
  },
  bookedText: {
    fontSize: 9,
    fontFamily: Fonts.bold,
    letterSpacing: 0.8,
  },

  chipRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.bgElevated,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  chipFull: { backgroundColor: '#FF6B6B15' },
  chipEmoji: { fontSize: 10 },
  chipText: {
    fontSize: 11,
    fontFamily: Fonts.medium,
    color: Colors.textMuted,
  },

  capacityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  capacityTrack: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  capacityFill: {
    height: 4,
    borderRadius: 2,
  },
  capacityText: {
    fontSize: 11,
    fontFamily: Fonts.medium,
    color: Colors.textMuted,
  },

  bookBtn: {
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  bookBtnCancelled: {
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bookBtnFull: {
    backgroundColor: Colors.bgElevated,
    opacity: 0.4,
  },
  bookBtnText: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: '#FFF',
    letterSpacing: 0.8,
  },

  // FOOTER
  footer: { alignItems: 'center', paddingVertical: 8 },
  footerText: {
    fontSize: 10,
    fontFamily: Fonts.bold,
    color: Colors.textMuted,
    letterSpacing: 2,
  },

  // SECTION HEADER
  sectionHeader:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionIconBox:  { width: 26, height: 26, borderRadius: 8, backgroundColor: Colors.accent + '14', borderWidth: 1, borderColor: Colors.accent + '25', justifyContent: 'center', alignItems: 'center' },
  sectionTitle:    { fontFamily: Fonts.bold, fontSize: 11, color: Colors.accent, letterSpacing: 1.5, flex: 1 },
  sectionPill:     { backgroundColor: Colors.accent + '18', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: Colors.accent + '30' },
  sectionPillText: { fontFamily: Fonts.bold, fontSize: 10, color: Colors.accent },

  // TRAINER SESSION CARDS
  trainerSessionCard:     { flexDirection: 'row', backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: 8 },
  trainerSessionBar:      { width: 3 },
  trainerSessionBody:     { flex: 1, padding: 13, gap: 9 },
  trainerSessionTop:      { flexDirection: 'row', alignItems: 'center', gap: 10 },
  trainerSessionIconBox:  { width: 36, height: 36, borderRadius: 10, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  trainerSessionType:     { fontFamily: Fonts.bold, fontSize: 14, color: Colors.text },
  trainerSessionTrainer:  { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  trainerStatusBadge:     { borderRadius: 8, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 4 },
  trainerStatusText:      { fontFamily: Fonts.bold, fontSize: 9, letterSpacing: 0.8 },
  trainerSessionMeta:     { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  trainerChip:            { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.bgElevated, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: Colors.border },
  trainerChipText:        { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted },
});
