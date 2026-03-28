import { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Linking,
  Image,
  Animated,
  Pressable,
} from 'react-native';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import AnimatedPressable from '@/components/AnimatedPressable';
import FadeInView from '@/components/FadeInView';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

const DEFAULT_TIMINGS = [
  { day: 'Mon – Fri', time: '5:30 AM – 10:30 PM', emoji: '🏋️' },
  { day: 'Saturday',  time: '6:00 AM – 9:00 PM',  emoji: '💪' },
  { day: 'Sunday',    time: '7:00 AM – 1:00 PM',  emoji: '🧘' },
];

const DEFAULT_AMENITIES = [
  { label: 'Cardio Zone',       emoji: '🏃' },
  { label: 'Free Weights',      emoji: '🏋️' },
  { label: 'Machines',          emoji: '⚙️' },
  { label: 'Locker Room',       emoji: '🔐' },
  { label: 'Parking',           emoji: '🅿️' },
  { label: 'Personal Training', emoji: '👨‍🏫' },
];

const DEFAULT_RULES = [
  'Carry your own towel at all times',
  'Re-rack weights after use',
  'No outside food or drinks (water allowed)',
  'Maintain gym decorum — no loud music without earphones',
  'Wear proper gym shoes — no slippers',
  "Respect other members' personal space",
];

const TRAINER_EMOJIS = ['🏋️', '🧘', '🥊', '💃', '🥗', '🔥', '⚡', '🎯'];
const RULE_COLORS    = ['#FF6B6B', '#FFB347', '#FFE66D', '#4ECDC4', '#45B7D1', '#96E6A1'];

interface ExtraGymData {
  established: string | null;
  timings:     typeof DEFAULT_TIMINGS;
  amenities:   typeof DEFAULT_AMENITIES;
  rules:       string[];
  owner_name:  string;
}

interface Trainer {
  id:               string;
  full_name:        string;
  specialty:        string | null;
  experience_years: number | null;
}

// ── Pulsing status dot ────────────────────────────────────────
function PulseDot({ color }: { color: string }) {
  const anim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1.6, duration: 900, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1,   duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <View style={{ width: 10, height: 10, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: color + '40',
          transform: [{ scale: anim }],
          position: 'absolute',
        }}
      />
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────
function GymInfoBackBtn() {
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

export default function GymInfoScreen() {
  const { profile, gymProfile } = useAuthStore();

  const [extra, setExtra]         = useState<ExtraGymData | null>(null);
  const [trainers, setTrainers]   = useState<Trainer[]>([]);
  const [loading, setLoading]     = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const lottieRef = useRef<LottieView>(null);

  // ── Fetch ──────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!profile?.id || !profile?.gym_id) return;
    setLoading(true);
    setFetchError(null);

    try {
      const [gymRes, ownerRes, trainersRes] = await Promise.all([
        supabase
          .from('gyms')
          .select('established, timings, amenities, rules')
          .eq('id', profile.gym_id)
          .single(),
        supabase
          .from('profiles')
          .select('full_name')
          .eq('gym_id', profile.gym_id)
          .eq('role', 'gym_owner')
          .maybeSingle(),
        supabase
          .from('profiles')
          .select('id, full_name, specialty, experience_years')
          .eq('gym_id', profile.gym_id)
          .eq('role', 'trainer'),
      ]);

      if (gymRes.error) throw gymRes.error;

      const g = gymRes.data;
      setExtra({
        established: g?.established ?? null,
        timings:     g?.timings?.length   ? g.timings   : DEFAULT_TIMINGS,
        amenities:   g?.amenities?.length ? g.amenities : DEFAULT_AMENITIES,
        rules:       g?.rules?.length     ? g.rules     : DEFAULT_RULES,
        owner_name:  ownerRes.data?.full_name ?? '—',
      });

      setTrainers(trainersRes.data ?? []);
    } catch (err: any) {
      setFetchError(err.message ?? 'Failed to load gym info');
    } finally {
      setLoading(false);
    }
  }, [profile?.id, profile?.gym_id]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const gymName    = gymProfile?.name     ?? 'My Gym';
  const gymTagline = null;
  const gymLogo    = gymProfile?.logo_url ?? null;

  // ── Loading ────────────────────────────────────────────────
  if (loading) return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.loadingContainer}>
        <View style={styles.loadingCard}>
          <LottieView
            ref={lottieRef}
            source={require('@/assets/animations/aichatbot.json')}
            autoPlay
            loop
            style={styles.loadingLottie}
          />
          <Text style={styles.loadingText}>Loading gym info…</Text>
        </View>
      </View>
    </>
  );

  // ── Fetch error ────────────────────────────────────────────
  if (fetchError) return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.loadingContainer}>
        <View style={styles.loadingCard}>
          <MaterialCommunityIcons name="wifi-off" size={40} color={Colors.textMuted} />
          <Text style={styles.errorText}>{fetchError}</Text>
          <AnimatedPressable style={styles.retryBtn} onPress={fetchData}>
            <Text style={styles.retryText}>RETRY</Text>
          </AnimatedPressable>
        </View>
      </View>
    </>
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >

        {/* ── BACK / MENU ── */}
        <GymInfoBackBtn />

        {/* ── HERO ── */}
        <FadeInView delay={0}>
          <View style={styles.heroCard}>
            <View style={styles.heroGlow1} />
            <View style={styles.heroGlow2} />

            <View style={styles.logoRingOuter}>
              <View style={styles.logoRingInner}>
                {gymLogo
                  ? <Image source={{ uri: gymLogo }} style={styles.logoImage} />
                  : <Text style={styles.logoFallback}>{gymName.charAt(0).toUpperCase()}</Text>
                }
              </View>
            </View>

            <Text style={styles.heroName}>{gymName.toUpperCase()}</Text>
            {gymTagline && <Text style={styles.heroTagline}>"{gymTagline}"</Text>}

            <View style={styles.openPill}>
              <PulseDot color="#4ADE80" />
              <Text style={styles.openText}>OPEN NOW</Text>
            </View>

            {extra && (
              <View style={styles.metaStrip}>
                {extra.established && (
                  <>
                    <View style={styles.metaItem}>
                      <Text style={styles.metaVal}>{extra.established}</Text>
                      <Text style={styles.metaLabel}>EST.</Text>
                    </View>
                    <View style={styles.metaSep} />
                  </>
                )}
                <View style={styles.metaItem}>
                  <Text style={styles.metaVal}>{extra.owner_name.split(' ')[0]}</Text>
                  <Text style={styles.metaLabel}>OWNER</Text>
                </View>
                <View style={styles.metaSep} />
                <View style={styles.metaItem}>
                  <Text style={styles.metaVal}>{trainers.length}</Text>
                  <Text style={styles.metaLabel}>TRAINERS</Text>
                </View>
              </View>
            )}
          </View>
        </FadeInView>

        {/* ── QUICK ACTIONS ── */}
        {(gymProfile?.phone || gymProfile?.email || gymProfile?.address) && (
          <FadeInView delay={60}>
            <View style={styles.quickRow}>
              {gymProfile?.phone && (
                <AnimatedPressable
                  style={styles.quickBtn}
                  scaleDown={0.94}
                  onPress={() => Linking.openURL(`tel:${gymProfile.phone}`)}
                >
                  <MaterialCommunityIcons name="phone" size={22} color={Colors.accent} />
                  <Text style={styles.quickBtnLabel}>CALL</Text>
                </AnimatedPressable>
              )}
              {gymProfile?.email && (
                <AnimatedPressable
                  style={styles.quickBtn}
                  scaleDown={0.94}
                  onPress={() => Linking.openURL(`mailto:${gymProfile.email}`)}
                >
                  <MaterialCommunityIcons name="email-outline" size={22} color={Colors.accent} />
                  <Text style={styles.quickBtnLabel}>EMAIL</Text>
                </AnimatedPressable>
              )}
              {gymProfile?.address && (
                <AnimatedPressable
                  style={styles.quickBtn}
                  scaleDown={0.94}
                  onPress={() =>
                    Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(gymProfile.address!)}`)
                  }
                >
                  <MaterialCommunityIcons name="map-marker-outline" size={22} color={Colors.accent} />
                  <Text style={styles.quickBtnLabel}>MAP</Text>
                </AnimatedPressable>
              )}
            </View>
          </FadeInView>
        )}

        {/* ── CONTACT DETAILS ── */}
        {(gymProfile?.address || gymProfile?.phone || gymProfile?.email) && (
          <FadeInView delay={120}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardAccentBar} />
                <Text style={styles.cardTitle}>CONTACT & LOCATION</Text>
              </View>

              {gymProfile?.address && (
                <View style={styles.contactRow}>
                  <View style={styles.contactIconBox}>
                    <MaterialCommunityIcons name="map-marker" size={16} color={Colors.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contactLabel}>ADDRESS</Text>
                    <Text style={styles.contactValue}>{gymProfile.address}</Text>
                  </View>
                </View>
              )}

              {gymProfile?.phone && (
                <AnimatedPressable
                  style={styles.contactRow}
                  scaleDown={0.98}
                  onPress={() => Linking.openURL(`tel:${gymProfile.phone}`)}
                >
                  <View style={styles.contactIconBox}>
                    <MaterialCommunityIcons name="phone" size={16} color={Colors.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contactLabel}>PHONE</Text>
                    <Text style={[styles.contactValue, { color: Colors.accent }]}>{gymProfile.phone}</Text>
                  </View>
                  <View style={styles.tapChip}>
                    <Text style={styles.tapChipText}>TAP TO CALL</Text>
                  </View>
                </AnimatedPressable>
              )}

              {gymProfile?.email && (
                <AnimatedPressable
                  style={styles.contactRow}
                  scaleDown={0.98}
                  onPress={() => Linking.openURL(`mailto:${gymProfile.email}`)}
                >
                  <View style={styles.contactIconBox}>
                    <MaterialCommunityIcons name="email-outline" size={16} color={Colors.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contactLabel}>EMAIL</Text>
                    <Text style={[styles.contactValue, { color: Colors.accent }]}>{gymProfile.email}</Text>
                  </View>
                  <View style={styles.tapChip}>
                    <Text style={styles.tapChipText}>TAP TO MAIL</Text>
                  </View>
                </AnimatedPressable>
              )}
            </View>
          </FadeInView>
        )}

        {/* ── OPERATING HOURS ── */}
        {extra && (
          <FadeInView delay={180}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardAccentBar} />
                <Text style={styles.cardTitle}>OPERATING HOURS</Text>
              </View>
              {extra.timings.map((t: any, i: number) => (
                <View
                  key={i}
                  style={[
                    styles.timingRow,
                    i < extra.timings.length - 1 && styles.timingRowBorder,
                  ]}
                >
                  <View style={styles.timingEmojiBox}>
                    <Text style={styles.timingEmoji}>{t.emoji}</Text>
                  </View>
                  <Text style={styles.timingDay}>{t.day}</Text>
                  <View style={styles.timingTimePill}>
                    <Text style={styles.timingTime}>{t.time}</Text>
                  </View>
                </View>
              ))}
              <View style={styles.holidayBanner}>
                <Text style={styles.holidayText}>🔔  Check announcements for holiday timings</Text>
              </View>
            </View>
          </FadeInView>
        )}

        {/* ── AMENITIES ── */}
        {extra && (
          <FadeInView delay={240}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardAccentBar} />
                <Text style={styles.cardTitle}>AMENITIES & FACILITIES</Text>
              </View>
              <View style={styles.amenGrid}>
                {extra.amenities.map((a: any, i: number) => (
                  <View key={i} style={styles.amenChip}>
                    <Text style={styles.amenEmoji}>{a.emoji}</Text>
                    <Text style={styles.amenLabel}>{a.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </FadeInView>
        )}

        {/* ── TRAINERS ── */}
        {trainers.length > 0 && (
          <FadeInView delay={300}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardAccentBar} />
                <Text style={styles.cardTitle}>OUR TRAINERS</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{trainers.length}</Text>
                </View>
              </View>
              {trainers.map((t, i) => (
                <View
                  key={t.id}
                  style={[
                    styles.trainerRow,
                    i < trainers.length - 1 && styles.trainerRowBorder,
                  ]}
                >
                  <View style={styles.trainerAvatar}>
                    <Text style={styles.trainerEmoji}>{TRAINER_EMOJIS[i % TRAINER_EMOJIS.length]}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.trainerName}>{t.full_name}</Text>
                    <Text style={styles.trainerSpec}>{t.specialty ?? 'General Fitness'}</Text>
                  </View>
                  {t.experience_years ? (
                    <View style={styles.expBadge}>
                      <Text style={styles.expVal}>{t.experience_years}</Text>
                      <Text style={styles.expUnit}>YRS</Text>
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          </FadeInView>
        )}

        {/* ── GYM RULES ── */}
        {extra && (
          <FadeInView delay={360}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardAccentBar} />
                <Text style={styles.cardTitle}>GYM RULES</Text>
              </View>
              {extra.rules.map((r: string, i: number) => (
                <View key={i} style={styles.ruleRow}>
                  <View
                    style={[
                      styles.ruleIndex,
                      {
                        backgroundColor: RULE_COLORS[i % RULE_COLORS.length] + '20',
                        borderColor:     RULE_COLORS[i % RULE_COLORS.length] + '60',
                      },
                    ]}
                  >
                    <Text style={[styles.ruleIndexText, { color: RULE_COLORS[i % RULE_COLORS.length] }]}>
                      {i + 1}
                    </Text>
                  </View>
                  <Text style={styles.ruleText}>{r}</Text>
                </View>
              ))}
            </View>
          </FadeInView>
        )}

        {/* ── EMERGENCY ── */}
        {gymProfile?.phone && (
          <FadeInView delay={420}>
            <AnimatedPressable
              style={styles.emergencyCard}
              scaleDown={0.97}
              onPress={() => Linking.openURL(`tel:${gymProfile.phone}`)}
            >
              <View style={styles.emergencyGlow} />
              <View style={styles.emergencyIconBox}>
                <MaterialCommunityIcons name="alert-circle" size={24} color="#FF6B6B" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.emergencyTitle}>EMERGENCY / HELP</Text>
                <Text style={styles.emergencySub}>Tap to call {gymName} directly</Text>
              </View>
              <View style={styles.callNowBadge}>
                <Text style={styles.callNowText}>CALL NOW →</Text>
              </View>
            </AnimatedPressable>
          </FadeInView>
        )}

        {/* ── FOOTER ── */}
        <FadeInView delay={480}>
          <View style={styles.footer}>
            <Text style={styles.footerText}>{gymName.toUpperCase()} · MEMBER APP</Text>
          </View>
        </FadeInView>

        <View style={{ height: 32 }} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  content: {
    padding: 16,
    gap: 14,
  },

  // ── Loading / error ───────────────────────────────────────────
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
    gap: 12,
  },
  loadingLottie: {
    width: 160,
    height: 160,
  },
  loadingText: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: Colors.textMuted,
  },
  errorText: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: Colors.accentMuted,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  retryText: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    color: Colors.accent,
    letterSpacing: 1,
  },

  // ── Hero ──────────────────────────────────────────────────────
  heroCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.accent + '30',
    overflow: 'hidden',
  },
  heroGlow1: {
    position: 'absolute',
    top: -40,
    left: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.accent + '12',
  },
  heroGlow2: {
    position: 'absolute',
    bottom: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.accent + '08',
  },
  logoRingOuter: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 2,
    borderColor: Colors.accent + '40',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bgElevated,
  },
  logoRingInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.bgElevated,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  logoFallback: {
    fontSize: 34,
    fontFamily: Fonts.condensedBold,
    color: Colors.accent,
  },
  heroName: {
    fontSize: 24,
    fontFamily: Fonts.condensedBold,
    color: Colors.text,
    letterSpacing: 2,
    textAlign: 'center',
  },
  heroTagline: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  openPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#4ADE8020',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#4ADE8040',
  },
  openText: {
    fontSize: 10,
    fontFamily: Fonts.bold,
    color: '#4ADE80',
    letterSpacing: 1.5,
  },
  metaStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginTop: 4,
  },
  metaItem: {
    alignItems: 'center',
    gap: 2,
  },
  metaVal: {
    fontSize: 15,
    fontFamily: Fonts.condensedBold,
    color: Colors.accent,
  },
  metaLabel: {
    fontSize: 8,
    fontFamily: Fonts.bold,
    color: Colors.textMuted,
    letterSpacing: 1.5,
  },
  metaSep: {
    width: 1,
    height: 24,
    backgroundColor: Colors.border,
  },

  // ── Quick actions ─────────────────────────────────────────────
  quickRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickBtn: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickBtnEmoji: {
    fontSize: 22,
  },
  quickBtnLabel: {
    fontSize: 9,
    fontFamily: Fonts.bold,
    color: Colors.textMuted,
    letterSpacing: 1.5,
  },

  // ── Card ──────────────────────────────────────────────────────
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardAccentBar: {
    width: 3,
    height: 16,
    borderRadius: 2,
    backgroundColor: Colors.accent,
  },
  cardTitle: {
    fontSize: 11,
    fontFamily: Fonts.bold,
    color: Colors.accent,
    letterSpacing: 1.5,
    flex: 1,
  },
  countBadge: {
    backgroundColor: Colors.accentMuted,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countBadgeText: {
    fontSize: 11,
    fontFamily: Fonts.bold,
    color: Colors.accent,
  },

  // ── Contact ───────────────────────────────────────────────────
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  contactIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.bgElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactIcon: {
    fontSize: 16,
  },
  contactLabel: {
    fontSize: 9,
    fontFamily: Fonts.bold,
    color: Colors.textMuted,
    letterSpacing: 1.3,
  },
  contactValue: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.text,
    marginTop: 2,
    lineHeight: 20,
  },
  tapChip: {
    backgroundColor: Colors.accentMuted,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tapChipText: {
    fontSize: 8,
    fontFamily: Fonts.bold,
    color: Colors.accent,
    letterSpacing: 0.8,
  },

  // ── Timings ───────────────────────────────────────────────────
  timingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  timingRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  timingEmojiBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.bgElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timingEmoji: {
    fontSize: 15,
  },
  timingDay: {
    flex: 1,
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: Colors.textMuted,
  },
  timingTimePill: {
    backgroundColor: Colors.accentMuted,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  timingTime: {
    fontSize: 12,
    fontFamily: Fonts.condensedBold,
    color: Colors.accent,
    letterSpacing: 0.3,
  },
  holidayBanner: {
    backgroundColor: Colors.bgElevated,
    borderRadius: 10,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent + '60',
  },
  holidayText: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
  },

  // ── Amenities ─────────────────────────────────────────────────
  amenGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  amenEmoji: {
    fontSize: 14,
  },
  amenLabel: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: Colors.text,
  },

  // ── Trainers ──────────────────────────────────────────────────
  trainerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  trainerRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  trainerAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.bgElevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.accent + '40',
  },
  trainerEmoji: {
    fontSize: 22,
  },
  trainerName: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: Colors.text,
  },
  trainerSpec: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    marginTop: 2,
  },
  expBadge: {
    alignItems: 'center',
    backgroundColor: Colors.accentMuted,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.accent + '30',
  },
  expVal: {
    fontSize: 18,
    fontFamily: Fonts.condensedBold,
    color: Colors.accent,
    lineHeight: 20,
  },
  expUnit: {
    fontSize: 8,
    fontFamily: Fonts.bold,
    color: Colors.accent,
    letterSpacing: 1,
  },

  // ── Rules ─────────────────────────────────────────────────────
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  ruleIndex: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  ruleIndexText: {
    fontSize: 11,
    fontFamily: Fonts.bold,
  },
  ruleText: {
    flex: 1,
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.text,
    lineHeight: 20,
  },

  // ── Emergency ─────────────────────────────────────────────────
  emergencyCard: {
    backgroundColor: '#FF444420',
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: '#FF444440',
    overflow: 'hidden',
  },
  emergencyGlow: {
    position: 'absolute',
    top: -20,
    left: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF444420',
  },
  emergencyIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF444430',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emergencyEmoji: {
    fontSize: 24,
  },
  emergencyTitle: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: '#FF6B6B',
    letterSpacing: 0.5,
  },
  emergencySub: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    marginTop: 2,
  },
  callNowBadge: {
    backgroundColor: '#FF444430',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#FF444460',
  },
  callNowText: {
    fontSize: 9,
    fontFamily: Fonts.bold,
    color: '#FF6B6B',
    letterSpacing: 1,
  },

  // ── Footer ────────────────────────────────────────────────────
  footer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  footerText: {
    fontSize: 10,
    fontFamily: Fonts.bold,
    color: Colors.textMuted,
    letterSpacing: 2,
  },
});
