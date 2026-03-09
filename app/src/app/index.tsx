  
  import {
    View, Text, StyleSheet, Animated, 
    Dimensions, ScrollView, TouchableOpacity,
  } from 'react-native';                         
  import { useRouter } from 'expo-router';
  import { MaterialCommunityIcons } from '@expo/vector-icons';
  import { SafeAreaView } from 'react-native-safe-area-context';
  import { useRef, useEffect, useState } from 'react';                                                            import { Colors } from '@/constants/colors';
  import { Fonts } from '@/constants/fonts';                                                                    
                                                                            
  const { width: W } = Dimensions.get('window');
  type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

  const OWNER_FEATS: { icon: IconName; label: string; desc: string; color: string }[] = [
    { icon: 'account-group-outline',  label: 'Members',    desc: 'Add & track all members',    color:
  Colors.accent },
    { icon: 'cash-multiple',          label: 'Payments',   desc: 'Fees, dues & history',        color:
  Colors.green  },
    { icon: 'chart-bar',              label: 'Analytics',  desc: 'Revenue & insights',          color: '#3B82F6'
       },
    { icon: 'calendar-check-outline', label: 'Attendance', desc: 'Daily check-ins',             color:
  Colors.orange },
    { icon: 'account-tie-outline',    label: 'Staff',      desc: 'Team & permissions',          color: '#A78BFA'
       },
    { icon: 'bullhorn-outline',       label: 'Announce',   desc: 'Notices to members',          color: '#EC4899'
       },
  ];

  const MEMBER_FEATS: { icon: IconName; label: string; desc: string; color: string }[] = [
    { icon: 'clipboard-list-outline', label: 'Workouts',   desc: 'Log sets & reps',             color:
  Colors.accent },
    { icon: 'food-apple-outline',     label: 'Diet Plan',  desc: 'Meals & calories',            color:
  Colors.green  },
    { icon: 'scale-bathroom',         label: 'BMI',        desc: 'Body mass index',             color: '#3B82F6'
       },
    { icon: 'trending-up',            label: 'Progress',   desc: 'Weight measurements',         color:
  Colors.orange },
    { icon: 'dumbbell',               label: 'Exercises',  desc: 'Library with guides',         color: '#A78BFA'
       },
    { icon: 'timer-outline',          label: 'Rest Timer', desc: 'Between-set timer',           color: '#EC4899'
       },
  ];

  const ROLES: {
    key: string; label: string; sub: string;
    icon: IconName; color: string; route: string; perk: string;
  }[] = [
    { key: 'owner',   label: 'GYM OWNER', sub: 'Run & manage your gym',       icon: 'crown-outline',   color:   
  Colors.accent, route: '/(auth)/login',         perk: 'Members, payments & reports'  },
    { key: 'member',  label: 'MEMBER',    sub: 'Track your fitness journey',   icon: 'account-outline', color:  
  Colors.green,  route: '/(auth)/member-login',  perk: 'Workouts, diet plan & BMI'     },
    { key: 'trainer', label: 'TRAINER',   sub: 'Manage your clients',          icon: 'whistle-outline', color:  
  '#3B82F6',     route: '/(auth)/trainer-login', perk: 'Client progress & sessions'    },
  ];

  type Screen = 'splash' | 'features' | 'roles';
  const CARD_W = (W - 32 - 10) / 2;

  export default function LandingScreen() {
    const router = useRouter();
    const [screen, setScreen] = useState<Screen>('splash');

    const ring1S = useRef(new Animated.Value(1)).current;
    const ring1O = useRef(new Animated.Value(0.55)).current;
    const ring2S = useRef(new Animated.Value(1)).current;
    const ring2O = useRef(new Animated.Value(0.35)).current;
    const ring3S = useRef(new Animated.Value(1)).current;
    const ring3O = useRef(new Animated.Value(0.18)).current;

    const logoS  = useRef(new Animated.Value(0)).current;
    const logoO  = useRef(new Animated.Value(0)).current;
    const titleY = useRef(new Animated.Value(28)).current;
    const titleO = useRef(new Animated.Value(0)).current;
    const bodyO  = useRef(new Animated.Value(0)).current;
    const btnO   = useRef(new Animated.Value(0)).current;
    const btnY   = useRef(new Animated.Value(18)).current;

    const outO = useRef(new Animated.Value(1)).current;
    const inO  = useRef(new Animated.Value(0)).current;
    const inY  = useRef(new Animated.Value(32)).current;

    useEffect(() => {
      Animated.parallel([
        Animated.spring(logoS, { toValue: 1, tension: 55, friction: 7, useNativeDriver: true }),
        Animated.timing(logoO, { toValue: 1, duration: 380, useNativeDriver: true }),
      ]).start();

      const t1 = setTimeout(() =>
        Animated.parallel([
          Animated.timing(titleO, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.spring(titleY, { toValue: 0, tension: 60, friction: 9, useNativeDriver: true }),
        ]).start(), 300);

      const t2 = setTimeout(() =>
        Animated.timing(bodyO, { toValue: 1, duration: 500, useNativeDriver: true }).start(), 600);

      const t3 = setTimeout(() =>
        Animated.parallel([
          Animated.timing(btnO, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.spring(btnY, { toValue: 0, tension: 60, friction: 9, useNativeDriver: true }),
        ]).start(), 950);

      const pulse = (sv: Animated.Value, ov: Animated.Value, startO: number, delay: number) => {
        setTimeout(() =>
          Animated.loop(
            Animated.sequence([
              Animated.parallel([
                Animated.timing(sv, { toValue: 2.6, duration: 2400, useNativeDriver: true }),
                Animated.timing(ov, { toValue: 0,      duration: 2400, useNativeDriver: true }),
              ]),
              Animated.parallel([
                Animated.timing(sv, { toValue: 1,      duration: 0, useNativeDriver: true }),
                Animated.timing(ov, { toValue: startO, duration: 0, useNativeDriver: true }),
              ]),
            ])
          ).start(), delay);
      };
      pulse(ring1S, ring1O, 0.55, 200);
      pulse(ring2S, ring2O, 0.35, 1000);
      pulse(ring3S, ring3O, 0.18, 1800);

      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }, []);

    const navigate = (to: Screen) => {
      Animated.timing(outO, { toValue: 0, duration: 240, useNativeDriver: true }).start(() => {
        setScreen(to);
        inO.setValue(0); inY.setValue(32);
        Animated.parallel([
          Animated.timing(inO, { toValue: 1, duration: 320, useNativeDriver: true }),
          Animated.spring(inY, { toValue: 0, tension: 55, friction: 9, useNativeDriver: true }),
        ]).start(() => outO.setValue(1));
      });
    };

    /* ══ SPLASH ══ */
    const renderSplash = () => (
      <Animated.View style={[s.fill, { opacity: outO }]}>
        <View style={s.bgGlow1} />
        <View style={s.bgGlow2} />

        <View style={s.splashCenter}>
          <View style={s.ringZone}>
            <Animated.View style={[s.ring, { width: 220, height: 220, borderRadius: 110, borderColor:
  Colors.accent, opacity: ring1O, transform: [{ scale: ring1S }] }]} />
            <Animated.View style={[s.ring, { width: 168, height: 168, borderRadius: 84,  borderColor:
  Colors.accent, opacity: ring2O, transform: [{ scale: ring2S }] }]} />
            <Animated.View style={[s.ring, { width: 124, height: 124, borderRadius: 62,  borderColor:
  Colors.orange, opacity: ring3O, transform: [{ scale: ring3S }] }]} />
            <Animated.View style={[s.logoBubble, { opacity: logoO, transform: [{ scale: logoS }] }]}>
              <MaterialCommunityIcons name="dumbbell" size={46} color={Colors.accent} />
            </Animated.View>
          </View>

          <Animated.View style={[{ alignItems: 'center', gap: 8 }, { opacity: titleO, transform: [{ translateY: 
  titleY }] }]}>
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
              {[{ v: '500+', l: 'GYMS' }, { v: '50K+', l: 'MEMBERS' }, { v: '4.9★', l: 'RATING' }].map((st, i)=> (
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
            <MaterialCommunityIcons name="arrow-right" size={18} color={Colors.bg} />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.65} onPress={() => navigate('roles')}>
            <Text style={s.skipText}>Skip  ·  Go straight to role selection</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    );

    /* ══ FEATURES ══ */
    const renderFeatures = () => (
      <Animated.View style={[s.fill, { opacity: inO, transform: [{ translateY: inY }] }]}>
        <ScrollView style={s.fill} contentContainerStyle={s.featScroll} showsVerticalScrollIndicator={false}>   

          <View style={s.featHero}>
            <View style={s.featHeroGlow} />
            <Text style={s.featMicro}>WHAT'S INSIDE</Text>
            <Text style={s.featTitle}>EVERYTHING YOUR{'\n'}GYM NEEDS</Text>
            <Text style={s.featSub}>One app for owners, members & trainers</Text>
          </View>

          <View style={s.sectionHeader}>
            <View style={[s.sectionPill, { backgroundColor: Colors.accent + '18' }]}>
              <MaterialCommunityIcons name="crown-outline" size={13} color={Colors.accent} />
              <Text style={[s.sectionPillText, { color: Colors.accent }]}>FOR GYM OWNERS</Text>
            </View>
          </View>
          <View style={s.cardGrid}>
            {OWNER_FEATS.map(f => (
              <View key={f.label} style={[s.featCard, { borderColor: f.color + '30' }]}>
                <View style={[s.featCardTop, { backgroundColor: f.color + '12' }]}>
                  <View style={[s.featCardIcon, { backgroundColor: f.color + '20' }]}>
                    <MaterialCommunityIcons name={f.icon} size={22} color={f.color} />
                  </View>
                  <View style={[s.featCardDot, { backgroundColor: f.color }]} />
                </View>
                <View style={s.featCardBody}>
                  <Text style={s.featCardLabel}>{f.label}</Text>
                  <Text style={s.featCardDesc}>{f.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={[s.sectionHeader, { marginTop: 16 }]}>
            <View style={[s.sectionPill, { backgroundColor: Colors.green + '18' }]}>
              <MaterialCommunityIcons name="account-outline" size={13} color={Colors.green} />
              <Text style={[s.sectionPillText, { color: Colors.green }]}>FOR MEMBERS & TRAINERS</Text>
            </View>
          </View>
          <View style={s.cardGrid}>
            {MEMBER_FEATS.map(f => (
              <View key={f.label} style={[s.featCard, { borderColor: f.color + '30' }]}>
                <View style={[s.featCardTop, { backgroundColor: f.color + '12' }]}>
                  <View style={[s.featCardIcon, { backgroundColor: f.color + '20' }]}>
                    <MaterialCommunityIcons name={f.icon} size={22} color={f.color} />
                  </View>
                  <View style={[s.featCardDot, { backgroundColor: f.color }]} />
                </View>
                <View style={s.featCardBody}>
                  <Text style={s.featCardLabel}>{f.label}</Text>
                  <Text style={s.featCardDesc}>{f.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={s.whyCard}>
            <View style={s.whyBar} />
            <View style={s.whyBody}>
              <Text style={s.whyTitle}>WHY GYMSETU?</Text>
              {[
                { icon: 'lightning-bolt'  as IconName, t: 'Built for speed — loads instantly'        },
                { icon: 'palette-outline' as IconName, t: 'Premium dark UI for gym environments'     },
                { icon: 'wifi-off'        as IconName, t: 'Works offline for basic features'         },
                { icon: 'currency-inr'    as IconName, t: 'Affordable for Indian gym owners'         },
              ].map(w => (
                <View key={w.t} style={s.whyRow}>
                  <MaterialCommunityIcons name={w.icon} size={14} color={Colors.accent} />
                  <Text style={s.whyText}>{w.t}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={{ height: 12 }} />
        </ScrollView>

        <View style={s.featBottom}>
          <TouchableOpacity style={s.ctaBtn} activeOpacity={0.82} onPress={() => navigate('roles')}>
            <Text style={s.ctaBtnText}>CHOOSE YOUR ROLE</Text>
            <MaterialCommunityIcons name="arrow-right" size={18} color={Colors.bg} />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.65} onPress={() => navigate('splash')}>
            <Text style={s.skipText}>← Back to intro</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );

    /* ══ ROLES ══ */
    const renderRoles = () => (
      <Animated.View style={[s.fill, { opacity: inO, transform: [{ translateY: inY }] }]}>
        <View style={s.bgGlow1} />

        <View style={s.rolesHeader}>
          <Text style={s.rolesMicro}>WELCOME TO GYMSETU</Text>
          <Text style={s.rolesTitle}>I AM A...</Text>
          <Text style={s.rolesSub}>Tap your role to sign in</Text>
        </View>

        <View style={s.cardsWrap}>
          {ROLES.map(role => (
            <TouchableOpacity
              key={role.key}
              activeOpacity={0.78}
              onPress={() => router.push(role.route as any)}
              style={[s.roleCard, { borderColor: role.color + '50' }]}
            >
              <View style={[s.roleBar, { backgroundColor: role.color }]} />
              <View style={[s.roleIconBubble, { backgroundColor: role.color + '15', borderColor: role.color +   
  '35' }]}>
                <MaterialCommunityIcons name={role.icon} size={28} color={role.color} />
              </View>
              <View style={s.roleTextBlock}>
                <Text style={[s.roleLabel, { color: role.color }]}>{role.label}</Text>
                <Text style={s.roleSub}>{role.sub}</Text>
                <View style={s.rolePerkRow}>
                  <MaterialCommunityIcons name="check-circle-outline" size={11} color={role.color} />
                  <Text style={s.rolePerkText}>{role.perk}</Text>
                </View>
              </View>
              <View style={[s.roleArrow, { backgroundColor: role.color + '18' }]}>
                <MaterialCommunityIcons name="arrow-right" size={22} color={role.color} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={s.rolesFooter}>
          <TouchableOpacity activeOpacity={0.65} onPress={() => navigate('features')}>
            <Text style={s.skipText}>← Back to features</Text>
          </TouchableOpacity>
          <Text style={s.secureNote}>🔒  Your data is private & secure</Text>
        </View>
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

  const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.bg },
    fill: { flex: 1 },

    bgGlow1: { position: 'absolute', top: -80,  right: -80,  width: 260, height: 260, borderRadius: 130,        
  backgroundColor: 'rgba(232,80,26,0.16)' },
    bgGlow2: { position: 'absolute', bottom: 180, left: -90, width: 220, height: 220, borderRadius: 110,        
  backgroundColor: 'rgba(232,80,26,0.09)' },

    /* Splash */
    splashCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, gap: 26 },  
    ringZone:     { width: 220, height: 220, justifyContent: 'center', alignItems: 'center' },
    ring:         { position: 'absolute', borderWidth: 1.5 },
    logoBubble: {
      width: 100, height: 100, borderRadius: 28,
      backgroundColor: Colors.bgCard,
      justifyContent: 'center', alignItems: 'center',
      borderWidth: 2, borderColor: Colors.accent + '55',
      shadowColor: Colors.accent, shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.45, shadowRadius: 22, elevation: 12,
    },
    appName:      { fontFamily: Fonts.condensedBold, fontSize: 52, color: Colors.text, letterSpacing: 10 },     
    divRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'stretch' },
    divLine:      { flex: 1, height: 1, backgroundColor: Colors.accent + '35' },
    divText:      { fontFamily: Fonts.bold, fontSize: 10, color: Colors.accent, letterSpacing: 2.5 },
    splashBody:   { alignSelf: 'stretch', gap: 16 },
    splashDesc:   { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textMuted, textAlign: 'center',      
  lineHeight: 22 },
    statsRow:     { flexDirection: 'row', backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 1,     
  borderColor: Colors.border, paddingVertical: 14 },
    statBox:      { flex: 1, alignItems: 'center', gap: 2 },
    statBorder:   { borderLeftWidth: 1, borderLeftColor: Colors.border },
    statVal:      { fontFamily: Fonts.condensedBold, fontSize: 20, color: Colors.accent },
    statLbl:      { fontFamily: Fonts.bold, fontSize: 8, color: Colors.textMuted, letterSpacing: 1 },
    splashBottom: { paddingHorizontal: 24, paddingBottom: 10, gap: 12 },
    madeIn:       { fontFamily: Fonts.medium, fontSize: 12, color: Colors.textMuted, textAlign: 'center' },     

    /* Shared */
    ctaBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
  backgroundColor: Colors.accent, borderRadius: 16, paddingVertical: 17 },
    ctaBtnText: { fontFamily: Fonts.bold, fontSize: 15, color: Colors.bg, letterSpacing: 2 },
    skipText:   { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, textAlign: 'center' },      

    /* Features */
    featScroll:      { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, gap: 10 },
    featHero:        { backgroundColor: Colors.bgCard, borderRadius: 20, padding: 20, gap: 6, borderWidth: 1,   
  borderColor: Colors.accent + '25', overflow: 'hidden', marginBottom: 4 },
    featHeroGlow:    { position: 'absolute', top: -28, right: -28, width: 110, height: 110, borderRadius: 55,   
  backgroundColor: 'rgba(232,80,26,0.30)' },
    featMicro:       { fontFamily: Fonts.medium, fontSize: 9, color: Colors.accent, letterSpacing: 1.8 },       
    featTitle:       { fontFamily: Fonts.condensedBold, fontSize: 30, color: Colors.text, letterSpacing: 0.5 }, 
    featSub:         { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted },
    sectionHeader:   { marginBottom: 4 },
    sectionPill:     { flexDirection: 'row', alignItems: 'center', gap: 7, alignSelf: 'flex-start',
  borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
    sectionPillText: { fontFamily: Fonts.bold, fontSize: 10, letterSpacing: 1 },
    cardGrid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    featCard:        { width: CARD_W, backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 1,
  overflow: 'hidden' },
    featCardTop:     { padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems:
  'flex-start' },
    featCardIcon:    { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center'  
  },
    featCardDot:     { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
    featCardBody:    { paddingHorizontal: 14, paddingBottom: 14, gap: 3 },
    featCardLabel:   { fontFamily: Fonts.bold, fontSize: 13, color: Colors.text },
    featCardDesc:    { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, lineHeight: 16 },      
    whyCard:         { flexDirection: 'row', backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 1,  
  borderColor: Colors.accent + '25', overflow: 'hidden', marginTop: 6 },
    whyBar:          { width: 4, backgroundColor: Colors.accent },
    whyBody:         { flex: 1, padding: 16, gap: 10 },
    whyTitle:        { fontFamily: Fonts.bold, fontSize: 11, color: Colors.accent, letterSpacing: 1.5,
  marginBottom: 2 },
    whyRow:          { flexDirection: 'row', alignItems: 'center', gap: 10 },
    whyText:         { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, flex: 1 },
    featBottom:      { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10, gap: 10, borderTopWidth: 1,    
  borderTopColor: Colors.border, backgroundColor: Colors.bg },

    /* Roles */
    rolesHeader:    { paddingTop: 32, paddingHorizontal: 24, paddingBottom: 20, gap: 4 },
    rolesMicro:     { fontFamily: Fonts.medium, fontSize: 10, color: Colors.accent, letterSpacing: 2.5 },       
    rolesTitle:     { fontFamily: Fonts.condensedBold, fontSize: 46, color: Colors.text, letterSpacing: 2 },    
    rolesSub:       { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted },
    cardsWrap:      { flex: 1, paddingHorizontal: 16, gap: 12, justifyContent: 'center' },
    roleCard:       { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgCard, borderRadius: 
  20, borderWidth: 1.5, overflow: 'hidden', paddingRight: 16, minHeight: 96 },
    roleBar:        { width: 6, alignSelf: 'stretch' },
    roleIconBubble: { width: 58, height: 58, borderRadius: 16, justifyContent: 'center', alignItems: 'center',  
  borderWidth: 1.5, marginHorizontal: 16 },
    roleTextBlock:  { flex: 1, gap: 4, paddingVertical: 18 },
    roleLabel:      { fontFamily: Fonts.condensedBold, fontSize: 24, letterSpacing: 0.5 },
    roleSub:        { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted },
    rolePerkRow:    { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
    rolePerkText:   { fontFamily: Fonts.medium, fontSize: 10, color: Colors.textMuted },
    roleArrow:      { width: 42, height: 42, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
    rolesFooter:    { alignItems: 'center', paddingBottom: 16, gap: 10 },
    secureNote:     { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted },
  });