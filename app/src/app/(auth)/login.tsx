import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, TouchableOpacity, ActivityIndicator, Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Linking } from 'react-native';
import { TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import { Links, WEBSITE_DISPLAY } from '@/constants/links';

WebBrowser.maybeCompleteAuthSession();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function OwnerLoginScreen() {
  const router          = useRouter();
  const signIn          = useAuthStore((s) => s.signIn);
  const fetchProfile    = useAuthStore((s) => s.fetchProfile);
  const fetchBranches   = useAuthStore((s) => s.fetchBranches);
  const fetchGymProfile = useAuthStore((s) => s.fetchGymProfile);
  const profile         = useAuthStore((s) => s.profile);

  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [secureText, setSecureText] = useState(true);
  const [loading, setLoading]       = useState(false);
  const [oauthLoading, setOAuthLoading] = useState<'google' | 'apple' | null>(null);
  const [error, setError]           = useState('');

  const awaitingOAuth = useRef(false);

  useEffect(() => {
    if (!awaitingOAuth.current) return;
    if (!profile) return;
    awaitingOAuth.current = false;
    if (profile.role === 'gym_owner' && (profile as any).gym_id) {
      router.replace('/(owner)/dashboard');
    } else {
      // No gym profile — account not set up via website yet
      setError(`No gym found for this account. Please complete registration at ${WEBSITE_DISPLAY} first.`);
    }
  }, [profile]);

  const handleLogin = async () => {
    setError('');
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) { setError('Please fill in all fields.'); return; }
    if (!EMAIL_RE.test(trimmedEmail)) { setError('Enter a valid email address.'); return; }
    Keyboard.dismiss();
    setLoading(true);
    const { error: signInError, role } = await signIn(trimmedEmail, password);
    setLoading(false);
    if (signInError) { setError(signInError); return; }
    if (role === 'gym_owner') {
      router.replace('/(owner)/dashboard');
    } else {
      setError('This login is for gym owners only.');
    }
  };

  const handleGoogle = async () => {
    try {
      setError('');
      setOAuthLoading('google');
      const redirectTo = makeRedirectUri({ scheme: 'gymsetu' });
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (oauthError || !data?.url) {
        setError(oauthError?.message ?? 'Google sign-in failed.');
        return;
      }
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type === 'success' && result.url) {
        const { error: sessionError } = await supabase.auth.exchangeCodeForSession(result.url);
        if (sessionError) { setError(sessionError.message); return; }
        awaitingOAuth.current = true;
      }
    } catch (e: any) {
      setError(e.message ?? 'Google sign-in failed.');
    } finally {
      setOAuthLoading(null);
    }
  };

  const handleApple = async () => {
    if (Platform.OS !== 'ios') return;
    try {
      setError('');
      setOAuthLoading('apple');
      const AppleAuth = await import('expo-apple-authentication');
      const credential = await AppleAuth.signInAsync({
        requestedScopes: [
          AppleAuth.AppleAuthenticationScope.FULL_NAME,
          AppleAuth.AppleAuthenticationScope.EMAIL,
        ],
      });
      const idToken = credential.identityToken;
      if (!idToken) { setError('Apple sign-in failed — no token.'); return; }
      const { error: signInError } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: idToken,
      });
      if (signInError) { setError(signInError.message); return; }
      await fetchProfile();
      await Promise.all([fetchBranches(), fetchGymProfile()]);
      awaitingOAuth.current = true;
    } catch (e: any) {
      if (e.code !== 'ERR_REQUEST_CANCELED') {
        setError(e.message ?? 'Apple sign-in failed.');
      }
    } finally {
      setOAuthLoading(null);
    }
  };

  const ip = {
    mode: 'outlined' as const,
    style: styles.input,
    outlineColor: Colors.border,
    activeOutlineColor: Colors.accent,
    textColor: Colors.text,
    theme: { colors: { onSurfaceVariant: Colors.textMuted } },
  };

  const anyLoading = loading || !!oauthLoading;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={Colors.textMuted} />
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.logoBubble}>
            <MaterialCommunityIcons name="crown-outline" size={30} color={Colors.accent} />
          </View>
          <Text style={styles.roleTag}>GYM OWNER</Text>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.sub}>Sign in to manage your gym</Text>
        </View>

        {!!error && (
          <View style={styles.errorBanner}>
            <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#f87171" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.oauthRow}>
          <TouchableOpacity
            style={[styles.oauthBtn, oauthLoading === 'google' && styles.oauthBtnLoading]}
            onPress={handleGoogle}
            disabled={anyLoading}
            activeOpacity={0.8}
          >
            {oauthLoading === 'google'
              ? <ActivityIndicator size="small" color={Colors.text} />
              : (
                <>
                  <MaterialCommunityIcons name="google" size={20} color="#EA4335" />
                  <Text style={styles.oauthText}>Google</Text>
                </>
              )
            }
          </TouchableOpacity>

          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={[styles.oauthBtn, oauthLoading === 'apple' && styles.oauthBtnLoading]}
              onPress={handleApple}
              disabled={anyLoading}
              activeOpacity={0.8}
            >
              {oauthLoading === 'apple'
                ? <ActivityIndicator size="small" color={Colors.text} />
                : (
                  <>
                    <MaterialCommunityIcons name="apple" size={20} color={Colors.text} />
                    <Text style={styles.oauthText}>Apple</Text>
                  </>
                )
              }
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or sign in with email</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.form}>
          <TextInput
            label="Email address"
            value={email}
            onChangeText={(v) => { setEmail(v); setError(''); }}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            {...ip}
          />
          <TextInput
            label="Password"
            value={password}
            onChangeText={(v) => { setPassword(v); setError(''); }}
            secureTextEntry={secureText}
            right={
              <TextInput.Icon
                icon={secureText ? 'eye-off-outline' : 'eye-outline'}
                onPress={() => setSecureText((p) => !p)}
                color={Colors.textMuted}
              />
            }
            {...ip}
          />
          <TouchableOpacity
            style={[styles.btn, anyLoading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={anyLoading}
            activeOpacity={0.82}
          >
            {loading
              ? <ActivityIndicator size="small" color={Colors.bg} />
              : (
                <>
                  <Text style={styles.btnText}>SIGN IN</Text>
                  <MaterialCommunityIcons name="arrow-right" size={18} color={Colors.bg} />
                </>
              )
            }
          </TouchableOpacity>
        </View>

        {/* No account? CTA — matches the web PWA */}
        <View style={styles.signupBlock}>
          <Text style={styles.signupMicro}>[NEW HERE]</Text>
          <Text style={styles.signupTitle}>No account?{'\n'}Make one.</Text>
          <Text style={styles.signupSub}>
            Create your gym on the website — choose a plan, pay via Razorpay,
            come back here to sign in.
          </Text>
          <TouchableOpacity
            style={styles.signupBtn}
            onPress={() => Linking.openURL(Links.home)}
            activeOpacity={0.85}
          >
            <Text style={styles.signupBtnText}>
              VISIT {WEBSITE_DISPLAY.toUpperCase()}
            </Text>
            <MaterialCommunityIcons name="arrow-right" size={16} color={Colors.bg} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => Linking.openURL(Links.pricing)}
            activeOpacity={0.7}
            style={{ marginTop: 12 }}
          >
            <Text style={styles.pricingLink}>
              See plans · ₹999/mo onwards →
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll:    { flexGrow: 1, padding: 24, paddingTop: 16 },

  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.bgCard,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
    marginBottom: 24,
  },

  header:    { alignItems: 'center', marginBottom: 28, gap: 6 },
  logoBubble: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: Colors.accentMuted,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.accent + '40',
    marginBottom: 8,
  },
  roleTag: {
    fontFamily: Fonts.bold, fontSize: 10, color: Colors.accent,
    letterSpacing: 2.5, backgroundColor: Colors.accentMuted,
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20,
  },
  title: { fontFamily: Fonts.bold, fontSize: 26, color: Colors.text, marginTop: 6 },
  sub:   { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textMuted },

  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#f8717115',
    borderWidth: 1, borderColor: '#f8717130',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    marginBottom: 16,
  },
  errorText: { fontFamily: Fonts.regular, fontSize: 13, color: '#f87171', flex: 1, lineHeight: 18 },

  oauthRow:       { flexDirection: 'row', gap: 12, marginBottom: 20 },
  oauthBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: Colors.bgCard,
    borderRadius: 14, paddingVertical: 14,
    borderWidth: 1, borderColor: Colors.border,
    minHeight: 50,
  },
  oauthBtnLoading: { opacity: 0.6 },
  oauthText:       { fontFamily: Fonts.medium, fontSize: 14, color: Colors.text },

  dividerRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted },

  form:  { gap: 14 },
  input: { backgroundColor: Colors.bgCard },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: Colors.accent,
    borderRadius: 14, paddingVertical: 16, marginTop: 6,
    minHeight: 52,
  },
  btnDisabled: { opacity: 0.6 },
  btnText:     { fontFamily: Fonts.bold, fontSize: 15, color: Colors.bg, letterSpacing: 1.5 },

  footer:     { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
  footerText: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textMuted },
  link:       { fontFamily: Fonts.bold, fontSize: 14, color: Colors.accent },

  signupBlock: {
    marginTop: 32, paddingTop: 24,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  signupMicro: {
    fontFamily: Fonts.bold, fontSize: 10, color: Colors.textMuted,
    letterSpacing: 2, marginBottom: 10,
  },
  signupTitle: {
    fontFamily: Fonts.condensedBold ?? Fonts.bold, fontSize: 28,
    color: Colors.text, letterSpacing: -0.5, lineHeight: 32, marginBottom: 8,
  },
  signupSub: {
    fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted,
    lineHeight: 20, marginBottom: 18,
  },
  signupBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.accent,
    paddingHorizontal: 20, paddingVertical: 16,
    borderRadius: 999,
  },
  signupBtnText: {
    fontFamily: Fonts.bold, fontSize: 13, color: Colors.bg, letterSpacing: 1.2,
  },
  pricingLink: {
    fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted,
    textAlign: 'center', textDecorationLine: 'underline',
  },
});
