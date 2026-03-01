import { useState } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { Colors } from '@/constants/colors';

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [gymName, setGymName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureText, setSecureText] = useState(true);
  const signUp = useAuthStore((s) => s.signUp);

  const handleRegister = async () => {
    if (!fullName || !gymName || !email || !password) { Alert.alert('Error', 'Please fill in all fields'); return; }
    if (password.length < 6) { Alert.alert('Error', 'Password must be at least 6 characters'); return; }
    setLoading(true);
    const { error } = await signUp(email.trim(), password, fullName.trim(), gymName.trim());
    setLoading(false);
    if (error) Alert.alert('Registration Failed', error);
  };

  const ip = {
    mode: 'outlined' as const,
    style: styles.input,
    outlineColor: Colors.border,
    activeOutlineColor: Colors.accent,
    textColor: Colors.text,
    theme: { colors: { onSurfaceVariant: Colors.textSub } },
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <MaterialCommunityIcons name="dumbbell" size={28} color={Colors.accent} />
          </View>
          <Text style={styles.brand}>Create Account</Text>
          <Text style={styles.subtitle}>Set up your gym in 30 seconds</Text>
        </View>

        <View style={styles.form}>
          <TextInput label="Your name" value={fullName} onChangeText={setFullName} {...ip} />
          <TextInput label="Gym name" value={gymName} onChangeText={setGymName} {...ip} />
          <TextInput label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" {...ip} />
          <TextInput label="Password" value={password} onChangeText={setPassword} secureTextEntry={secureText} right={<TextInput.Icon icon={secureText ? 'eye-off-outline' : 'eye-outline'} onPress={() => setSecureText(!secureText)} />} {...ip} />
          <TouchableOpacity style={[styles.btn, loading && { opacity: 0.6 }]} onPress={handleRegister} disabled={loading} activeOpacity={0.8}>
            <Text style={styles.btnText}>{loading ? 'Creating...' : 'Create Account'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Link href="/(auth)/login"><Text style={styles.link}>Sign In</Text></Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 36 },
  logoBox: { width: 56, height: 56, borderRadius: 16, backgroundColor: Colors.accentMuted, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  brand: { fontSize: 28, fontWeight: '700', color: Colors.text },
  subtitle: { fontSize: 15, color: Colors.textSub, marginTop: 6 },
  form: { gap: 14 },
  input: { backgroundColor: Colors.bgCard },
  btn: { backgroundColor: Colors.accent, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
  footerText: { color: Colors.textMuted, fontSize: 14 },
  link: { color: Colors.accent, fontSize: 14, fontWeight: '600' },
});
