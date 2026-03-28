 import {
    View, Text, StyleSheet, Animated,
    Dimensions, ScrollView, TouchableOpacity,
  } from 'react-native';
  import { useAuthStore } from '@/store/authStore';
  import { useRouter } from 'expo-router';
  import { MaterialCommunityIcons } from '@expo/vector-icons';
  import { SafeAreaView } from 'react-native-safe-area-context';
  import { useRef, useEffect, useState, useCallback } from 'react';
  import LottieView from 'lottie-react-native';
  import { Colors } from '@/constants/colors';
  import { Fonts } from '@/constants/fonts';
  import { ActivityIndicator } from 'react-native';

  const { width: W } = Dimensions.get('window');
  type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

  const OWNER_FEATS: { icon: IconName; label: string; desc: string; color: string }[] = [
    { icon: 'account-group-outline',  label: 'Members',    desc: 'Add & track all members',  color: Colors.accent },   
    { icon: 'cash-multiple',          label: 'Payments',   desc: 'Fees, dues & history',      color: '#22c55e'     },  
    { icon: 'chart-bar',              label: 'Analytics',  desc: 'Revenue & deep insights',   color: '#3B82F6'     },  
    { icon: 'calendar-check-outline', label: 'Attendance', desc: 'Daily check-ins',           color: '#f97316'     },  
    { icon: 'account-tie-outline',    label: 'Trainers',   desc: 'Team & performance',        color: '#A78BFA'     },  
    { icon: 'trending-up',            label: 'Forecast',   desc: 'Revenue predictions',       color: '#EC4899'     },  
  ];

  const MEMBER_FEATS: { icon: IconName; label: string; desc: string; color: string }[] = [
    { icon: 'clipboard-list-outline', label: 'Workouts',   desc: 'Log sets & reps',      color: Colors.accent },       
    { icon: 'food-apple-outline',     label: 'Diet Plan',  desc: 'Meals & calories',     color: '#22c55e'     },       
    { icon: 'scale-bathroom',         label: 'BMI',        desc: 'Body mass index',      color: '#3B82F6'     },       
    { icon: 'trending-up',            label: 'Progress',   desc: 'Weight measurements',  color: '#f97316'     },       
    { icon: 'dumbbell',               label: 'Exercises',  desc: 'Library with guides',  color: '#A78BFA'     },       
    { icon: 'timer-outline',          label: 'Rest Timer', desc: 'Between-set timer',    color: '#EC4899'     },       
  ];

  const ROLES: {
    key: string; label: string; sub: string;
    icon: IconName; color: string; route: string; perk: string;
  }[] = [
    { key: 'owner',   label: 'GYM OWNER', sub: 'Run & manage your gym',     icon: 'crown-outline',   color:
  Colors.accent, route: '/(auth)/login',         perk: 'Members, payments & reports' },
    { key: 'member',  label: 'MEMBER',    sub: 'Track your fitness journey', icon: 'account-outline', color: '#22c55e',
       route: '/(auth)/member-login',  perk: 'Workouts, diet plan & BMI'   },
    { key: 'trainer', label: 'TRAINER',   sub: 'Manage your clients',        icon: 'whistle-outline', color: '#3B82F6',
       route: '/(auth)/trainer-login', perk: 'Client progress & sessions'  },
  ];

  type Screen = 'splash' | 'features' | 'roles';

  const ROLE_ROUTES: Record<string, string> = {
    owner:   '/(owner)/dashboard',
    member:  '/(member)/home',
    trainer: '/(trainer)/home',
  };

  export default function LandingScreen() {
    const router = useRouter();
    const { session, profile, isLoading, isInitialized } = useAuthStore();
    const [screen, setScreen] = useState<Screen>('splash');

    const ring1S = useRef(new Animated.Value(1)).current;
    const ring1O = useRef(new Animated.Value(0.5)).current;
    const ring2S = useRef(new Animated.Value(1)).current;
    const ring2O = useRef(new Animated.Value(0.3)).current;
    const titleO = useRef(new Animated.Value(0)).current;
    const titleY = useRef(new Animated.Value(30)).current;
    const bodyO  = useRef(new Animated.Value(0)).current;
    const btnO   = useRef(new Animated.Value(0)).current;
    const btnY   = useRef(new Animated.Value(20)).current;
    const outO   = useRef(new Animated.Value(1)).current;
    const inO    = useRef(new Animated.Value(0)).current;
    const inY    = useRef(new Animated.Value(30)).current;

    const pulseLoops = useRef<Animated.CompositeAnimation[]>([]);

    useEffect(() => {
      const pulse = (sv: Animated.Value, ov: Animated.Value, startO: number, delay: number) => {
        const timer = setTimeout(() => {
          const loop = Animated.loop(Animated.sequence([
            Animated.parallel([
              Animated.timing(sv, { toValue: 2.8, duration: 2600, useNativeDriver: true }),
              Animated.timing(ov, { toValue: 0,   duration: 2600, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(sv, { toValue: 1,      duration: 0, useNativeDriver: true }),
              Animated.timing(ov, { toValue: startO, duration: 0, useNativeDriver: true }),
            ]),
          ]));
          loop.start();
          pulseLoops.current.push(loop);
        }, delay);
        return timer;
      };

      const t0a = pulse(ring1S, ring1O, 0.5, 400);
      const t0b = pulse(ring2S, ring2O, 0.3, 1400);

      const t1 = setTimeout(() =>
        Animated.parallel([
          Animated.timing(titleO, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.spring(titleY, { toValue: 0, tension: 60, friction: 9, useNativeDriver: true }),
        ]).start(), 200);

      const t2 = setTimeout(() =>
        Animated.timing(bodyO, { toValue: 1, duration: 500, useNativeDriver: true }).start(), 600);

      const t3 = setTimeout(() =>
        Animated.parallel([
          Animated.timing(btnO, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.spring(btnY, { toValue: 0, tension: 60, friction: 9, useNativeDriver: true }),
        ]).start(), 950);

      return () => {
        clearTimeout(t0a); clearTimeout(t0b);
        clearTimeout(t1);  clearTimeout(t2); clearTimeout(t3);
        pulseLoops.current.forEach(l => l.stop());
        pulseLoops.current = [];
      };
    }, []);

    // Redirect already-logged-in users
    useEffect(() => {
      if (!isInitialized) return;

      // Session exists but no profile → stale/broken session, auto sign out
      if (session && !profile) {
        useAuthStore.getState().signOut();
        return;
      }

      if (!session || !profile) return;
      const route = ROLE_ROUTES[profile.role];
      if (route) router.replace(route as any);
    }, [isInitialized, session, profile, router]);

    const navigate = useCallback((to: Screen) => {
      Animated.timing(outO, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => {
        setScreen(to);
        inO.setValue(0); inY.setValue(30);
        Animated.parallel([
          Animated.timing(inO, { toValue: 1, duration: 320, useNativeDriver: true }),
          Animated.spring(inY, { toValue: 0, tension: 55, friction: 9, useNativeDriver: true }),
        ]).start(() => outO.setValue(1));
      });
    }, [outO, inO, inY]);

    // Show spinner while auth state is resolving
    if (!isInitialized || isLoading) {
      return (
        <SafeAreaView style={[s.safe, s.center]}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </SafeAreaView>
      );
    }

    // ── SPLASH ───────────────────────────────────────────────────────
    const renderSplash = () => (
      <Animated.View style={[s.fill, { opacity: outO }]}>
        <View style={s.glow1} />
        <View style={s.glow2} />

        <View style={s.splashCenter}>
          <View style={s.lottiezone}>
            <Animated.View style={[s.ring, { width: 280, height: 280, borderRadius: 140, opacity: ring1O, transform: [{
   scale: ring1S }] }]} />
            <Animated.View style={[s.ring, { width: 210, height: 210, borderRadius: 105, opacity: ring2O, transform: [{
   scale: ring2S }] }]} />
            <LottieView
              source={require('@/assets/animations/Welcome.json')}
              autoPlay loop
              style={s.welcomeLottie}
            />
          </View>

          <Animated.View style={[s.titleBlock, { opacity: titleO, transform: [{ translateY: titleY }] }]}>
            <Text style={s.appName}>GYMSETU</Text>
            <View style={s.divRow}>
              <View style={s.divLine} />
              <Text style={s.divText}>THE COMPLETE GYM OS</Text>
              <View style={s.divLine} />
            </View>
          </Animated.View>

          <Animated.View style={[s.splashBody, { opacity: bodyO }]}>
            <Text style={s.splashDesc}>
              Run your gym, track members, collect payments{'\n'}and grow your business — all in one app.
            </Text>
            <View style={s.statsRow}>
              {[
                { v: '500+', l: 'GYMS'    },
                { v: '50K+', l: 'MEMBERS' },
                { v: '4.9★', l: 'RATING'  },
              ].map((st, i) => (
                <View key={st.l} style={[s.statBox, i > 0 && s.statBorder]}>
                  <Text style={s.statVal}>{st.v}</Text>
                  <Text style={s.statLbl}>{st.l}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        </View>

        <Animated.View style={[s.splashBottom, { opacity: btnO, transform: [{ translateY: btnY }] }]}>
          <Text style={s.madeIn}>🇮🇳  Proudly built for Indian gyms</Text>
          <TouchableOpacity style={s.ctaBtn} activeOpacity={0.82} onPress={() => navigate('features')}>
            <Text style={s.ctaBtnText}>EXPLORE FEATURES</Text>
            <MaterialCommunityIcons name="arrow-right" size={20} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.65} onPress={() => navigate('roles')}>
            <Text style={s.skipText}>Skip  ·  Go straight to sign in</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    );

    // ── FEATURES ─────────────────────────────────────────────────────
    const renderFeatures = () => (
      <Animated.View style={[s.fill, { opacity: inO, transform: [{ translateY: inY }] }]}>
        <ScrollView style={s.fill} contentContainerStyle={s.featScroll} showsVerticalScrollIndicator={false}>
          <View style={s.featHero}>
            <View style={s.featHeroGlow} />
            <Text style={s.featMicro}>WHAT'S INSIDE</Text>
            <Text style={s.featTitle}>EVERYTHING YOUR{'\n'}GYM NEEDS</Text>
            <Text style={s.featSub}>One app for owners, members & trainers</Text>
          </View>

          <View style={s.pillRow}>
            <View style={[s.pill, { backgroundColor: Colors.accent + '18', borderColor: Colors.accent + '30' }]}>      
              <MaterialCommunityIcons name="crown-outline" size={12} color={Colors.accent} />
              <Text style={[s.pillText, { color: Colors.accent }]}>FOR GYM OWNERS</Text>
            </View>
          </View>
          <View style={s.featGrid}>
            {OWNER_FEATS.map(f => (
              <View key={f.label} style={[s.featCard, { borderColor: f.color + '25' }]}>
                <View style={[s.featCardIcon, { backgroundColor: f.color + '15' }]}>
                  <MaterialCommunityIcons name={f.icon} size={24} color={f.color} />
                </View>
                <Text style={s.featCardLabel}>{f.label}</Text>
                <Text style={s.featCardDesc}>{f.desc}</Text>
                <View style={[s.featCardAccent, { backgroundColor: f.color }]} />
              </View>
            ))}
          </View>

          <View style={[s.pillRow, { marginTop: 8 }]}>
            <View style={[s.pill, { backgroundColor: '#22c55e18', borderColor: '#22c55e30' }]}>
              <MaterialCommunityIcons name="account-outline" size={12} color="#22c55e" />
              <Text style={[s.pillText, { color: '#22c55e' }]}>FOR MEMBERS & TRAINERS</Text>
            </View>
          </View>
          <View style={s.featGrid}>
            {MEMBER_FEATS.map(f => (
              <View key={f.label} style={[s.featCard, { borderColor: f.color + '25' }]}>
                <View style={[s.featCardIcon, { backgroundColor: f.color + '15' }]}>
                  <MaterialCommunityIcons name={f.icon} size={24} color={f.color} />
                </View>
                <Text style={s.featCardLabel}>{f.label}</Text>
                <Text style={s.featCardDesc}>{f.desc}</Text>
                <View style={[s.featCardAccent, { backgroundColor: f.color }]} />
              </View>
            ))}
          </View>

          <View style={s.whyCard}>
            <Text style={s.whyTitle}>WHY GYMSETU?</Text>
            {[
              { icon: 'lightning-bolt'       as IconName, t: 'Built for speed — loads instantly'       },
              { icon: 'palette-outline'      as IconName, t: 'Premium dark UI for gym environments'    },
              { icon: 'wifi-off'             as IconName, t: 'Works offline for basic features'        },
              { icon: 'currency-inr'         as IconName, t: 'Affordable for Indian gym owners'        },
              { icon: 'shield-check-outline' as IconName, t: 'Data is private, secure & encrypted'     },
            ].map(w => (
              <View key={w.t} style={s.whyRow}>
                <View style={s.whyDot}>
                  <MaterialCommunityIcons name={w.icon} size={16} color={Colors.accent} />
                </View>
                <Text style={s.whyText}>{w.t}</Text>
              </View>
            ))}
          </View>

          <View style={{ height: 16 }} />
        </ScrollView>

        <View style={s.featBottom}>
          <TouchableOpacity style={s.ctaBtn} activeOpacity={0.82} onPress={() => navigate('roles')}>
            <Text style={s.ctaBtnText}>CHOOSE YOUR ROLE</Text>
            <MaterialCommunityIcons name="arrow-right" size={20} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.65} onPress={() => navigate('splash')}>
            <Text style={s.skipText}>← Back to intro</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );

    // ── ROLES ─────────────────────────────────────────────────────────
    const renderRoles = () => (
      <Animated.View style={[s.fill, { opacity: inO, transform: [{ translateY: inY }] }]}>
        <View style={s.glow1} />
        <View style={[s.glow2, { bottom: 120 }]} />

        <ScrollView style={s.fill} contentContainerStyle={s.rolesScroll} showsVerticalScrollIndicator={false}>
          <View style={s.rolesBanner}>
            <View style={s.rolesBannerLeft}>
              <View style={s.rolesBannerBadge}>
                <MaterialCommunityIcons name="lightning-bolt" size={11} color={Colors.accent} />
                <Text style={s.rolesBannerBadgeText}>GYMSETU</Text>
              </View>
              <Text style={s.rolesTitle}>I AM A...</Text>
              <Text style={s.rolesSub}>Select your role{'\n'}to get started</Text>
            </View>
            <LottieView
              source={require('@/assets/animations/aichatbot.json')}
              autoPlay loop
              style={s.rolesBannerLottie}
            />
          </View>

          <View style={s.rolesDivider}>
            <View style={s.rolesDivLine} />
            <Text style={s.rolesDivText}>CHOOSE YOUR PORTAL</Text>
            <View style={s.rolesDivLine} />
          </View>

          <View style={s.rolesCards}>
            {ROLES.map(role => (
              <TouchableOpacity
                key={role.key}
                activeOpacity={0.76}
                onPress={() => router.push(role.route as any)}
                style={[s.roleCard, { borderColor: role.color + '35' }]}
              >
                <View style={[s.roleLeftBar, { backgroundColor: role.color }]} />

                <View style={s.roleCardInner}>
                  <View style={s.roleIconOuter}>
                    <View style={[s.roleIconGlow, { backgroundColor: role.color + '18' }]} />
                    <View style={[s.roleIconWrap, { backgroundColor: role.color + '12', borderColor: role.color + '35' 
  }]}>
                      <MaterialCommunityIcons name={role.icon} size={34} color={role.color} />
                    </View>
                  </View>

                  <View style={s.roleInfo}>
                    <Text style={[s.roleLabel, { color: role.color }]}>{role.label}</Text>
                    <Text style={s.roleSub}>{role.sub}</Text>
                    <View style={s.rolePerk}>
                      <View style={[s.rolePerkDot, { backgroundColor: role.color }]} />
                      <Text style={s.rolePerkText}>{role.perk}</Text>
                    </View>
                  </View>

                  <View style={[s.roleArrow, { backgroundColor: role.color + '12', borderColor: role.color + '25' }]}> 
                    <MaterialCommunityIcons name="chevron-right" size={22} color={role.color} />
                  </View>
                </View>

                <View style={[s.roleShimmer, { backgroundColor: role.color + '12' }]} />
              </TouchableOpacity>
            ))}
          </View>

          <View style={s.rolesFooter}>
            <TouchableOpacity activeOpacity={0.65} onPress={() => navigate('features')}>
              <Text style={s.skipText}>← Back to features</Text>
            </TouchableOpacity>
            <View style={s.secureRow}>
              <MaterialCommunityIcons name="shield-check-outline" size={13} color="#444" />
              <Text style={s.secureNote}>Your data is private & encrypted</Text>
            </View>
          </View>
        </ScrollView>
      </Animated.View>
    );

    return (
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        {screen === 'splash'   && renderSplash()}
        {screen === 'features' && renderFeatures()}
        {screen === 'roles'    && renderRoles()}
      </SafeAreaView>
    );
  }

  const CARD_W = (W - 32 - 12) / 2;

  const s = StyleSheet.create({
    safe:   { flex: 1, backgroundColor: '#0a0a0a' },
    fill:   { flex: 1 },
    center: { justifyContent: 'center', alignItems: 'center' },

    glow1: { position: 'absolute', top: -100, right: -100, width: 300, height: 300, borderRadius: 150, backgroundColor:
   Colors.accent + '18' },
    glow2: { position: 'absolute', bottom: 200, left: -100, width: 240, height: 240, borderRadius: 120,
  backgroundColor: Colors.accent + '08' },

    // ── Splash
    splashCenter:  { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, gap: 28 },        
    lottiezone:    { width: 260, height: 260, justifyContent: 'center', alignItems: 'center' },
    ring:          { position: 'absolute', borderWidth: 1, borderColor: Colors.accent },
    welcomeLottie: { width: 220, height: 220 },

    titleBlock: { alignItems: 'center', gap: 12, alignSelf: 'stretch' },
    appName:    { fontFamily: Fonts.condensedBold, fontSize: 56, color: '#fff', letterSpacing: 12 },
    divRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'stretch' },
    divLine:    { flex: 1, height: 1, backgroundColor: Colors.accent + '30' },
    divText:    { fontFamily: Fonts.bold, fontSize: 9, color: Colors.accent, letterSpacing: 2.5 },

    splashBody: { alignSelf: 'stretch', gap: 16 },
    splashDesc: { fontFamily: Fonts.regular, fontSize: 15, color: '#666', textAlign: 'center', lineHeight: 24 },       

    statsRow:   { flexDirection: 'row', backgroundColor: '#141414', borderRadius: 18, borderWidth: 1, borderColor:     
  '#1e1e1e', paddingVertical: 16 },
    statBox:    { flex: 1, alignItems: 'center', gap: 4 },
    statBorder: { borderLeftWidth: 1, borderLeftColor: '#1e1e1e' },
    statVal:    { fontFamily: Fonts.condensedBold, fontSize: 24, color: Colors.accent },
    statLbl:    { fontFamily: Fonts.bold, fontSize: 8, color: '#444', letterSpacing: 1.2 },

    splashBottom: { paddingHorizontal: 24, paddingBottom: 12, gap: 14 },
    madeIn:       { fontFamily: Fonts.regular, fontSize: 13, color: '#444', textAlign: 'center' },

    // ── Shared CTA
    ctaBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor:      
  Colors.accent, borderRadius: 18, paddingVertical: 18 },
    ctaBtnText: { fontFamily: Fonts.bold, fontSize: 15, color: '#000', letterSpacing: 2 },
    skipText:   { fontFamily: Fonts.regular, fontSize: 13, color: '#444', textAlign: 'center' },

    // ── Features
    featScroll:    { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
    featHero:      { backgroundColor: '#141414', borderRadius: 20, padding: 22, marginBottom: 20, borderWidth: 1,      
  borderColor: Colors.accent + '25', overflow: 'hidden' },
    featHeroGlow:  { position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: 70,
  backgroundColor: Colors.accent + '20' },
    featMicro:     { fontFamily: Fonts.bold, fontSize: 10, color: Colors.accent, letterSpacing: 2 },
    featTitle:     { fontFamily: Fonts.condensedBold, fontSize: 34, color: '#fff', letterSpacing: 0.5, marginTop: 6,   
  lineHeight: 38 },
    featSub:       { fontFamily: Fonts.regular, fontSize: 14, color: '#555', marginTop: 8 },

    pillRow:  { marginBottom: 12 },
    pill:     { flexDirection: 'row', alignItems: 'center', gap: 7, alignSelf: 'flex-start', borderRadius: 20,
  paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1 },
    pillText: { fontFamily: Fonts.bold, fontSize: 10, letterSpacing: 1 },

    featGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
    featCard:       { width: CARD_W, backgroundColor: '#141414', borderRadius: 18, borderWidth: 1, padding: 16, gap: 8,
   overflow: 'hidden', position: 'relative' },
    featCardIcon:   { width: 50, height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },       
    featCardLabel:  { fontFamily: Fonts.bold, fontSize: 15, color: '#fff' },
    featCardDesc:   { fontFamily: Fonts.regular, fontSize: 12, color: '#555', lineHeight: 17 },
    featCardAccent: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3 },

    whyCard:  { backgroundColor: '#141414', borderRadius: 20, borderWidth: 1, borderColor: Colors.accent + '20',       
  padding: 20, gap: 14, marginTop: 8 },
    whyTitle: { fontFamily: Fonts.bold, fontSize: 12, color: Colors.accent, letterSpacing: 2, marginBottom: 4 },       
    whyRow:   { flexDirection: 'row', alignItems: 'center', gap: 14 },
    whyDot:   { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.accent + '12', justifyContent:        
  'center', alignItems: 'center' },
    whyText:  { fontFamily: Fonts.regular, fontSize: 14, color: '#888', flex: 1, lineHeight: 20 },

    featBottom: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12, gap: 12, borderTopWidth: 1, borderTopColor:
   '#141414', backgroundColor: '#0a0a0a' },

    // ── Roles
    rolesScroll: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 24 },

    rolesBanner:          { flexDirection: 'row', alignItems: 'center', backgroundColor: '#141414', borderRadius: 24,  
  borderWidth: 1, borderColor: Colors.accent + '25', padding: 20, marginBottom: 24, overflow: 'hidden' },
    rolesBannerLeft:      { flex: 1, gap: 8 },
    rolesBannerBadge:     { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
  backgroundColor: Colors.accent + '15', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1,  
  borderColor: Colors.accent + '30' },
    rolesBannerBadgeText: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.accent, letterSpacing: 2 },
    rolesTitle:           { fontFamily: Fonts.condensedBold, fontSize: 48, color: '#fff', letterSpacing: 1.5,
  lineHeight: 52 },
    rolesSub:             { fontFamily: Fonts.regular, fontSize: 13, color: '#555', lineHeight: 20 },
    rolesBannerLottie:    { width: 130, height: 130 },

    rolesDivider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    rolesDivLine: { flex: 1, height: 1, backgroundColor: '#1e1e1e' },
    rolesDivText: { fontFamily: Fonts.bold, fontSize: 9, color: '#333', letterSpacing: 2 },

    rolesCards: { gap: 14 },

    roleCard:      { backgroundColor: '#141414', borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
    roleLeftBar:   { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
    roleCardInner: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, paddingLeft: 22, paddingRight:   
  16, gap: 16 },

    roleIconOuter: { position: 'relative', width: 68, height: 68, justifyContent: 'center', alignItems: 'center' },    
    roleIconGlow:  { position: 'absolute', width: 68, height: 68, borderRadius: 34 },
    roleIconWrap:  { width: 62, height: 62, borderRadius: 18, justifyContent: 'center', alignItems: 'center',
  borderWidth: 1.5 },

    roleInfo:     { flex: 1, gap: 5 },
    roleLabel:    { fontFamily: Fonts.condensedBold, fontSize: 22, letterSpacing: 1.5 },
    roleSub:      { fontFamily: Fonts.regular, fontSize: 13, color: '#666', lineHeight: 18 },
    rolePerk:     { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 2 },
    rolePerkDot:  { width: 5, height: 5, borderRadius: 3 },
    rolePerkText: { fontFamily: Fonts.regular, fontSize: 11, color: '#555' },

    roleArrow:   { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center',
  borderWidth: 1 },
    roleShimmer: { height: 1, marginHorizontal: 22, marginBottom: 1 },

    rolesFooter: { marginTop: 28, gap: 14, alignItems: 'center' },
    secureRow:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
    secureNote:  { fontFamily: Fonts.regular, fontSize: 12, color: '#333' },
  });
