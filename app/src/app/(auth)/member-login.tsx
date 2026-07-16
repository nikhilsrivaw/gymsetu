import { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, TouchableOpacity, Animated,
  Image, ActivityIndicator, Keyboard,
  TextInput as RNTextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/store/authStore';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import { supabase } from '@/lib/supabase';

interface GymBranding {
  name: string;
  logo_url: string | null;
}

export default function MemberLoginScreen() {
  const router = useRouter();
  const signIn = useAuthStore((s) => s.signIn);

  const [step, setStep]                 = useState<'code' | 'password'>('code');
  const [memberId, setMemberId]         = useState('');
  const [password, setPassword]         = useState('');
  const [secureText, setSecureText]     = useState(true);
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [loadingGym,   setLoadingGym]   = useState(false);
  const [gymBranding, setGymBranding]   = useState<GymBranding | null>(null);
  const [error, setError]               = useState('');
  const [idFocused, setIdFocused]       = useState(false);
  const [pwFocused, setPwFocused]       = useState(false);

  const fadeAnim  = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const animateTransition = (direction: 'forward' | 'back', onMid: () => void) => {
    const outY = direction === 'forward' ? -20 : 20;
    const inY  = direction === 'forward' ?  30 : -20;
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: outY, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      onMid();
      slideAnim.setValue(inY);
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 9, useNativeDriver: true }),
      ]).start();
    });
  };

  // ── Step 1 ─────────────────────────────────────────────────────
  const handleContinue = async () => {
    setError('');
    const cleanCode = memberId.trim().toUpperCase();
    if (!cleanCode) { setError('Enter your Member ID.'); return; }
    Keyboard.dismiss();
    setLoadingGym(true);

    // Await gym branding lookup before transitioning.
    // Logged-out callers cannot read profiles (that table holds login
    // passwords); this RPC returns gym name + logo for a code and nothing else.
    try {
      const { data } = await supabase.rpc('gym_branding_for_code', { code: cleanCode });
      const gym = Array.isArray(data) ? data[0] : data;
      if (gym?.gym_name) setGymBranding({ name: gym.gym_name, logo_url: gym.logo_url });
    } catch {}

    setLoadingGym(false);
    animateTransition('forward', () => setStep('password'));
  };

  // ── Step 2 ─────────────────────────────────────────────────────
  const handleLogin = async () => {
    setError('');
    if (!password) { setError('Enter your password.'); return; }
    const cleanCode = memberId.trim().toUpperCase();
    const email     = cleanCode.toLowerCase() + '@gymsetu.app';
    Keyboard.dismiss();
    setLoadingLogin(true);
    const { error: signInError, role } = await signIn(email, password);
    if (signInError) {
      setLoadingLogin(false);
      setError('Incorrect password. Contact your gym owner if you need help.');
      return;
    }
    if (role !== 'member') {
      setLoadingLogin(false);
      setError('This login is for members only.');
      return;
    }
    // Fetch gym branding now that session is active
    try {
      const { data } = await supabase.rpc('gym_branding_for_code', { code: cleanCode });
      const gym = Array.isArray(data) ? data[0] : data;
      if (gym?.gym_name) setGymBranding({ name: gym.gym_name, logo_url: gym.logo_url });
    } catch {}
    setLoadingLogin(false);
    router.replace('/(member)/home');
  };

  const handleBack = () => {
    setError('');
    animateTransition('back', () => {
      setStep('code');
      setPassword('');
      setGymBranding(null);
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* ── STEP 1: Enter Member ID ── */}
          {step === 'code' && (
            <View style={styles.stepWrap}>
              {/* Back row */}
              <TouchableOpacity style={styles.backRow} onPress={() => router.back()}>
                <MaterialCommunityIcons name="arrow-left" size={20} color={Colors.textMuted} />
                <Text style={styles.backLabel}>Back</Text>
              </TouchableOpacity>

              <View style={styles.iconWrap}>
                <MaterialCommunityIcons name="card-account-details-outline" size={38} color={Colors.green} />
              </View>

              <Text style={styles.stepTitle}>MEMBER PORTAL</Text>
              <Text style={styles.stepSub}>Enter your Member ID to continue</Text>

              <View style={styles.infoCard}>
                <MaterialCommunityIcons name="information-outline" size={14} color={Colors.green} />
                <Text style={styles.infoText}>
                  Your ID looks like{' '}
                  <Text style={styles.infoCode}>GS-M-A3K9X</Text>
                  {' '}— provided by your gym owner
                </Text>
              </View>

              {!!error && (
                <View style={styles.errorBanner}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={15} color="#f87171" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <View style={[styles.inputRow, idFocused && styles.inputRowFocused]}>
                <MaterialCommunityIcons
                  name="identifier" size={18}
                  color={idFocused ? Colors.green : Colors.textMuted}
                />
                <RNTextInput
                  style={styles.input}
                  value={memberId}
                  onChangeText={(v) => { setMemberId(v); setError(''); }}
                  placeholder="e.g. GS-M-A3K9X"
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleContinue}
                  onFocus={() => setIdFocused(true)}
                  onBlur={() => setIdFocused(false)}
                />
              </View>

              <TouchableOpacity
                style={[styles.btn, loadingGym && { opacity: 0.6 }]}
                onPress={handleContinue}
                disabled={loadingGym}
                activeOpacity={0.82}
              >
                <LinearGradient
                  colors={[Colors.green, '#15803d']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.btnGrad}
                >
                  {loadingGym
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <>
                        <Text style={styles.btnText}>CONTINUE</Text>
                        <MaterialCommunityIcons name="arrow-right" size={18} color="#fff" />
                      </>
                  }
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* ── STEP 2: Password Screen ── */}
          {step === 'password' && (
            <View style={styles.stepWrap}>
              {/* Back row — inside step, easy to reach */}
              <TouchableOpacity style={styles.backRow} onPress={handleBack}>
                <MaterialCommunityIcons name="arrow-left" size={20} color={Colors.textMuted} />
                <Text style={styles.backLabel}>Change ID</Text>
              </TouchableOpacity>

              {/* Compact gym hero */}
              <View style={styles.gymHero}>
                {gymBranding?.logo_url ? (
                  <Image source={{ uri: gymBranding.logo_url }} style={styles.gymLogo} resizeMode="contain" />
                ) : (
                  <View style={styles.gymLogoPlaceholder}>
                    {gymBranding
                      ? <Text style={styles.gymLogoInitial}>{gymBranding.name[0].toUpperCase()}</Text>
                      : <MaterialCommunityIcons name="dumbbell" size={30} color={Colors.green} />
                    }
                  </View>
                )}
                <Text style={styles.gymName} numberOfLines={1}>
                  {gymBranding ? gymBranding.name.toUpperCase() : 'YOUR GYM'}
                </Text>
              </View>

              {/* Verified chip */}
              <View style={styles.verifiedChip}>
                <MaterialCommunityIcons name="check-circle" size={14} color={Colors.green} />
                <Text style={styles.verifiedText}>{memberId.trim().toUpperCase()}  ·  VERIFIED</Text>
              </View>

              <Text style={styles.passwordHeading}>Enter your password</Text>
              <Text style={styles.passwordSub}>Use the password provided by your gym</Text>

              {!!error && (
                <View style={styles.errorBanner}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={15} color="#f87171" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Password field */}
              <View style={[styles.inputRow, pwFocused && styles.inputRowFocused]}>
                <MaterialCommunityIcons
                  name="lock-outline" size={18}
                  color={pwFocused ? Colors.green : Colors.textMuted}
                />
                <RNTextInput
                  style={styles.input}
                  value={password}
                  onChangeText={(v) => { setPassword(v); setError(''); }}
                  placeholder="Your password"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry={secureText}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  onFocus={() => setPwFocused(true)}
                  onBlur={() => setPwFocused(false)}
                />
                <TouchableOpacity onPress={() => setSecureText(v => !v)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <MaterialCommunityIcons
                    name={secureText ? 'eye-off-outline' : 'eye-outline'}
                    size={18} color={Colors.textMuted}
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.btn, loadingLogin && { opacity: 0.6 }]}
                onPress={handleLogin}
                disabled={loadingLogin}
                activeOpacity={0.82}
              >
                <LinearGradient
                  colors={[Colors.green, '#15803d']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.btnGrad}
                >
                  {loadingLogin
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <>
                        <Text style={styles.btnText}>
                          {gymBranding ? `ENTER ${gymBranding.name.toUpperCase()}` : 'SIGN IN'}
                        </Text>
                        <MaterialCommunityIcons name="arrow-right" size={18} color="#fff" />
                      </>
                  }
                </LinearGradient>
              </TouchableOpacity>

              <Text style={styles.helpText}>
                Forgot your password? Contact your gym owner for help.
              </Text>
            </View>
          )}

        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll:    { flexGrow: 1, padding: 24, paddingTop: 56 },

  // Back row — inside each step, easy to tap
  backRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginBottom: 32,
    alignSelf: 'flex-start',
    paddingVertical: 6, paddingRight: 12,
  },
  backLabel: { fontFamily: Fonts.medium, fontSize: 14, color: Colors.textMuted },

  stepWrap: {},

  // ── Step 1 ────────────────────────────────────────────────────
  iconWrap: {
    width: 76, height: 76, borderRadius: 22,
    backgroundColor: Colors.green + '12',
    borderWidth: 1.5, borderColor: Colors.green + '30',
    justifyContent: 'center', alignItems: 'center',
    alignSelf: 'center', marginBottom: 22,
  },
  stepTitle: {
    fontFamily: Fonts.condensedBold, fontSize: 34,
    color: Colors.text, textAlign: 'center',
    letterSpacing: 3, marginBottom: 8,
  },
  stepSub: {
    fontFamily: Fonts.regular, fontSize: 14,
    color: Colors.textMuted, textAlign: 'center',
    marginBottom: 24, lineHeight: 22,
  },
  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: Colors.green + '0e',
    borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: Colors.green + '25',
    marginBottom: 20,
  },
  infoText: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, flex: 1, lineHeight: 18 },
  infoCode: { fontFamily: Fonts.bold, color: Colors.green },

  // ── Error banner ──────────────────────────────────────────────
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#f8717115',
    borderWidth: 1, borderColor: '#f8717130',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    marginBottom: 16,
  },
  errorText: { fontFamily: Fonts.regular, fontSize: 13, color: '#f87171', flex: 1, lineHeight: 18 },

  // ── Input field ───────────────────────────────────────────────
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.bgCard,
    borderRadius: 14, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 16, paddingVertical: 16,
    marginBottom: 14,
  },
  inputRowFocused: { borderColor: Colors.green + '70' },
  input: {
    flex: 1, fontFamily: Fonts.regular, fontSize: 15,
    color: Colors.text, padding: 0,
  },

  // ── Button ────────────────────────────────────────────────────
  btn:     { borderRadius: 14, overflow: 'hidden', marginTop: 2 },
  btnGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 17, minHeight: 54,
  },
  btnText: { fontFamily: Fonts.bold, fontSize: 15, color: '#fff', letterSpacing: 1.5 },

  // ── Step 2 gym hero (compact) ─────────────────────────────────
  gymHero: {
    alignItems: 'center', paddingVertical: 12, marginBottom: 14,
  },
  gymLogo: {
    width: 72, height: 72, borderRadius: 18,
    marginBottom: 12, borderWidth: 1, borderColor: Colors.border,
  },
  gymLogoPlaceholder: {
    width: 72, height: 72, borderRadius: 18,
    backgroundColor: Colors.green + '15',
    borderWidth: 1.5, borderColor: Colors.green + '40',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
  },
  gymLogoInitial: { fontFamily: Fonts.condensedBold, fontSize: 32, color: Colors.green },
  gymName: {
    fontFamily: Fonts.condensedBold, fontSize: 26,
    color: Colors.text, letterSpacing: 1.5, textAlign: 'center',
    maxWidth: '80%',
  },

  verifiedChip: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    alignSelf: 'center',
    backgroundColor: Colors.green + '12',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
    borderWidth: 1, borderColor: Colors.green + '30',
    marginBottom: 20,
  },
  verifiedText: { fontFamily: Fonts.bold, fontSize: 11, color: Colors.green, letterSpacing: 0.8 },

  passwordHeading: {
    fontFamily: Fonts.condensedBold, fontSize: 24,
    color: Colors.text, textAlign: 'center',
    letterSpacing: 0.5, marginBottom: 5,
  },
  passwordSub: {
    fontFamily: Fonts.regular, fontSize: 13,
    color: Colors.textMuted, textAlign: 'center',
    marginBottom: 20, lineHeight: 20,
  },

  helpText: {
    fontFamily: Fonts.regular, fontSize: 12,
    color: Colors.textMuted, textAlign: 'center',
    marginTop: 20, lineHeight: 18,
  },
});
