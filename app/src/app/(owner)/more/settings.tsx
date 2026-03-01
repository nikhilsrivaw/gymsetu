import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { Colors } from '@/constants/colors';
import AnimatedPressable from '@/components/AnimatedPressable';
import FadeInView from '@/components/FadeInView';

export default function SettingsScreen() {
  const { signOut } = useAuthStore();
  const [gymName, setGymName] = useState('FitZone Gym & Fitness');
  const [address, setAddress] = useState('204, Andheri West, Mumbai 400058');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [email, setEmail] = useState('fitzone.gym@gmail.com');
  const [saving, setSaving] = useState(false);

  const ip = { mode: 'outlined' as const, style: styles.input, outlineColor: Colors.border, activeOutlineColor: Colors.accent, textColor: Colors.text, theme: { colors: { onSurfaceVariant: Colors.textSub } } };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => { setSaving(false); Alert.alert('Saved', 'Settings updated'); }, 400);
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Settings' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Logo placeholder */}
        <FadeInView delay={0}>
          <AnimatedPressable style={styles.logoSection} scaleDown={0.95}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoEmoji}>{'\u{1F4F7}'}</Text>
            </View>
            <Text style={styles.logoHint}>Tap to upload gym logo</Text>
          </AnimatedPressable>
        </FadeInView>

        {/* Form */}
        <FadeInView delay={100}>
          <Text style={styles.sectionLabel}>{'\u{1F3E2}'} Gym Information</Text>
          <View style={styles.card}>
            <TextInput label="Gym name" value={gymName} onChangeText={setGymName} {...ip} />
            <TextInput label="Address" value={address} onChangeText={setAddress} multiline {...ip} />
            <TextInput label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" {...ip} />
            <TextInput label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" {...ip} />
          </View>
        </FadeInView>

        <FadeInView delay={200}>
          <AnimatedPressable
            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
            scaleDown={0.97}
          >
            <Text style={styles.saveBtnText}>{saving ? 'Saving...' : '\u{1F4BE} Save Changes'}</Text>
          </AnimatedPressable>
        </FadeInView>

        <FadeInView delay={300}>
          <AnimatedPressable style={styles.signOutBtn} onPress={handleSignOut} scaleDown={0.97}>
            <Text style={styles.signOutEmoji}>{'\u{1F6AA}'}</Text>
            <Text style={styles.signOutText}>Sign Out</Text>
          </AnimatedPressable>
        </FadeInView>

        <View style={{ height: 32 }} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: 20 },
  logoSection: { alignItems: 'center', paddingVertical: 24 },
  logoCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.bgCard, borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
  logoEmoji: { fontSize: 28 },
  logoHint: { fontSize: 13, color: Colors.textMuted, marginTop: 10 },
  sectionLabel: { fontSize: 15, fontWeight: '600', color: Colors.textSub, marginBottom: 10 },
  card: { backgroundColor: Colors.bgCard, borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: Colors.border, gap: 14 },
  input: { backgroundColor: Colors.bgElevated },
  saveBtn: { backgroundColor: Colors.accent, borderRadius: 14, paddingVertical: 18, alignItems: 'center' },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  signOutBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 16, paddingVertical: 16, borderRadius: 14, borderWidth: 1, borderColor: Colors.red + '25' },
  signOutEmoji: { fontSize: 18 },
  signOutText: { fontSize: 15, fontWeight: '600', color: Colors.red },
});
