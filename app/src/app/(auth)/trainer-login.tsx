  import { useState } from 'react';
  import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from   
  'react-native';
  import { useRouter } from 'expo-router';
  import { TextInput } from 'react-native-paper';
  import { MaterialCommunityIcons } from '@expo/vector-icons';
  import { useAuthStore } from '@/store/authStore';
  import { Colors } from '@/constants/colors';
  import { Fonts } from '@/constants/fonts';

  const TC = '#3B82F6';

  export default function TrainerLoginScreen() {
    const router = useRouter();
    const [trainerId, setTrainerId] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [secureText, setSecureText] = useState(true);
    const signIn = useAuthStore((s) => s.signIn);

    const handleLogin = async () => {
      if (!trainerId || !password) { Alert.alert('Error', 'Please fill in all fields'); return; }
      // GST-A3K9X → gst-a3k9x@gymsetu.app
      const email = trainerId.trim().toLowerCase() + '@gymsetu.app';
      setLoading(true);
      const { error, role } = await signIn(email, password);
      setLoading(false);
      if (error) { Alert.alert('Login Failed', 'Invalid Trainer ID or password'); return; }
      if (role === 'trainer') router.replace('/(trainer)/home');
      else Alert.alert('Access Denied', 'This login is for trainers only.');
    };

    const ip = {
      mode: 'outlined' as const,
      style: styles.input,
      outlineColor: Colors.border,
      activeOutlineColor: TC,
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
            <View style={[styles.logoBubble, { backgroundColor: TC + '18', borderColor: TC + '40' }]}>
              <MaterialCommunityIcons name="whistle-outline" size={30} color={TC} />
            </View>
            <Text style={[styles.roleTag, { color: TC, backgroundColor: TC + '18' }]}>TRAINER</Text>
            <Text style={styles.title}>Trainer Login</Text>
            <Text style={styles.sub}>Use the ID & password given by your gym</Text>
          </View>

          <View style={[styles.infoCard, { backgroundColor: TC + '10', borderColor: TC + '25' }]}>
            <MaterialCommunityIcons name="information-outline" size={15} color={TC} />
            <Text style={styles.infoText}>
              Your Trainer ID looks like: <Text style={[styles.infoCode, { color: TC }]}>GST-A3K9X</Text>       
            </Text>
          </View>

          <View style={styles.form}>
            <TextInput label="Trainer ID" value={trainerId} onChangeText={setTrainerId}
  autoCapitalize="characters" {...ip} />
            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={secureText}
              right={<TextInput.Icon icon={secureText ? 'eye-off-outline' : 'eye-outline'} onPress={() =>       
  setSecureText(!secureText)} color={Colors.textMuted} />}
              {...ip}
            />
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: TC }, loading && { opacity: 0.6 }]}
              onPress={handleLogin} disabled={loading} activeOpacity={0.82}
            >
              <Text style={styles.btnText}>{loading ? 'SIGNING IN...' : 'SIGN IN'}</Text>
              {!loading && <MaterialCommunityIcons name="arrow-right" size={18} color="#FFF" />}
            </TouchableOpacity>
          </View>

          <Text style={styles.helpText}>Forgot your ID or password?{'\n'}Contact your gym owner.</Text>

        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    scroll: { flexGrow: 1, padding: 24, paddingTop: 16 },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.bgCard, justifyContent:
  'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border, marginBottom: 24 },
    header: { alignItems: 'center', marginBottom: 24, gap: 6 },
    logoBubble: { width: 72, height: 72, borderRadius: 22, justifyContent: 'center', alignItems: 'center',      
  borderWidth: 1.5, marginBottom: 8 },
    roleTag: { fontFamily: Fonts.bold, fontSize: 10, letterSpacing: 2.5, paddingHorizontal: 12, paddingVertical:
   4, borderRadius: 20 },
    title: { fontFamily: Fonts.bold, fontSize: 26, color: Colors.text, marginTop: 6 },
    sub: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, textAlign: 'center' },
    infoCard: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, padding: 12, borderWidth: 
  1, marginBottom: 20 },
    infoText: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, flex: 1 },
    infoCode: { fontFamily: Fonts.bold },
    form: { gap: 14 },
    input: { backgroundColor: Colors.bgCard },
    btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14,      
  paddingVertical: 16, marginTop: 6 },
    btnText: { fontFamily: Fonts.bold, fontSize: 15, color: '#FFF', letterSpacing: 1.5 },
    helpText: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, textAlign: 'center',
  marginTop: 28, lineHeight: 20 },
  });
