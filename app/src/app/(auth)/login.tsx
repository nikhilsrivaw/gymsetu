import { useState } from 'react';
  import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from   
  'react-native';
  import { useRouter, Link } from 'expo-router';
  import { TextInput } from 'react-native-paper';
  import { MaterialCommunityIcons } from '@expo/vector-icons';
  import { useAuthStore } from '@/store/authStore';
  import { Colors } from '@/constants/colors';
  import { Fonts } from '@/constants/fonts';

  export default function OwnerLoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [secureText, setSecureText] = useState(true);
    const signIn = useAuthStore((s) => s.signIn);

    const handleLogin = async () => {
      if (!email || !password) { Alert.alert('Error', 'Please fill in all fields'); return; }
      setLoading(true);
      const { error, role } = await signIn(email.trim(), password);
      setLoading(false);
      if (error) { Alert.alert('Login Failed', error); return; }
      if (role === 'gym_owner') router.replace('/(owner)/dashboard');
      else Alert.alert('Access Denied', 'This login is for gym owners only.');
    };

    const ip = {
      mode: 'outlined' as const,
      style: styles.input,
      outlineColor: Colors.border,
      activeOutlineColor: Colors.accent,
      textColor: Colors.text,
      theme: { colors: { onSurfaceVariant: Colors.textMuted } },
    };

    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>   
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled"
  showsVerticalScrollIndicator={false}>

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

          <View style={styles.form}>
            <TextInput label="Email address" value={email} onChangeText={setEmail} autoCapitalize="none"        
  keyboardType="email-address" {...ip} />
            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={secureText}
              right={<TextInput.Icon icon={secureText ? 'eye-off-outline' : 'eye-outline'} onPress={() =>       
  setSecureText(!secureText)} color={Colors.textMuted} />}
              {...ip}
            />
            <TouchableOpacity style={[styles.btn, loading && { opacity: 0.6 }]} onPress={handleLogin}
  disabled={loading} activeOpacity={0.82}>
              <Text style={styles.btnText}>{loading ? 'SIGNING IN...' : 'SIGN IN'}</Text>
              {!loading && <MaterialCommunityIcons name="arrow-right" size={18} color={Colors.bg} />}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>New to GymSetu? </Text>
            <Link href="/(auth)/register"><Text style={styles.link}>Create account</Text></Link>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    scroll: { flexGrow: 1, padding: 24, paddingTop: 16 },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.bgCard, justifyContent:
  'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border, marginBottom: 24 },
    header: { alignItems: 'center', marginBottom: 36, gap: 6 },
    logoBubble: { width: 72, height: 72, borderRadius: 22, backgroundColor: Colors.accentMuted, justifyContent: 
  'center', alignItems: 'center', borderWidth: 1.5, borderColor: Colors.accent + '40', marginBottom: 8 },       
    roleTag: { fontFamily: Fonts.bold, fontSize: 10, color: Colors.accent, letterSpacing: 2.5, backgroundColor: 
  Colors.accentMuted, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
    title: { fontFamily: Fonts.bold, fontSize: 26, color: Colors.text, marginTop: 6 },
    sub: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textMuted },
    form: { gap: 14 },
    input: { backgroundColor: Colors.bgCard },
    btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor:       
  Colors.accent, borderRadius: 14, paddingVertical: 16, marginTop: 6 },
    btnText: { fontFamily: Fonts.bold, fontSize: 15, color: Colors.bg, letterSpacing: 1.5 },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
    footerText: { fontFamily: Fonts.regular, color: Colors.textMuted, fontSize: 14 },
    link: { fontFamily: Fonts.bold, color: Colors.accent, fontSize: 14 },
  });
