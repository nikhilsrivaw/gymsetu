import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, SegmentedButtons } from 'react-native-paper';
import { Stack, useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import AnimatedPressable from '@/components/AnimatedPressable';
import FadeInView from '@/components/FadeInView';

export default function AddMemberScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('male');
  const [dob, setDob] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [goal, setGoal] = useState('general_fitness');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const ip = {
    mode: 'outlined' as const,
    style: styles.input,
    outlineColor: Colors.border,
    activeOutlineColor: Colors.accent,
    textColor: Colors.text,
    theme: { colors: { onSurfaceVariant: Colors.textSub } },
  };

  const seg = {
    colors: { secondaryContainer: Colors.accentMuted, onSecondaryContainer: Colors.accent, onSurface: Colors.textMuted, outline: Colors.border },
  };

  const handleSave = async () => {
    if (!fullName.trim()) { Alert.alert('Required', 'Enter member name'); return; }
    if (!phone.trim()) { Alert.alert('Required', 'Enter phone number'); return; }
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      Alert.alert('Done', 'Member added', [{ text: 'OK', onPress: () => router.back() }]);
    }, 400);
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Add Member' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <FadeInView delay={0}>
          <Text style={styles.sectionLabel}>{'\u{1F464}'} Personal</Text>
          <View style={styles.card}>
            <TextInput label="Full name *" value={fullName} onChangeText={setFullName} {...ip} />
            <TextInput label="Phone *" value={phone} onChangeText={setPhone} keyboardType="phone-pad" {...ip} />
            <TextInput label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" {...ip} />
            <Text style={styles.fieldLabel}>Gender</Text>
            <SegmentedButtons value={gender} onValueChange={setGender} buttons={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'other', label: 'Other' }]} theme={seg} />
            <TextInput label="Date of birth (DD/MM/YYYY)" value={dob} onChangeText={setDob} keyboardType="numeric" {...ip} />
          </View>
        </FadeInView>

        <FadeInView delay={100}>
          <Text style={styles.sectionLabel}>{'\u{1F4CF}'} Body Metrics</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <TextInput label="Height (cm)" value={height} onChangeText={setHeight} keyboardType="numeric" {...ip} style={[styles.input, { flex: 1 }]} />
              <TextInput label="Weight (kg)" value={weight} onChangeText={setWeight} keyboardType="numeric" {...ip} style={[styles.input, { flex: 1 }]} />
            </View>
            <Text style={styles.fieldLabel}>Goal</Text>
            <SegmentedButtons value={goal} onValueChange={setGoal} buttons={[{ value: 'weight_loss', label: 'Lose' }, { value: 'muscle_gain', label: 'Gain' }, { value: 'general_fitness', label: 'Fit' }, { value: 'other', label: 'Other' }]} theme={seg} />
          </View>
        </FadeInView>

        <FadeInView delay={200}>
          <Text style={styles.sectionLabel}>{'\u{1F6A8}'} Emergency Contact</Text>
          <View style={styles.card}>
            <TextInput label="Name" value={emergencyName} onChangeText={setEmergencyName} {...ip} />
            <TextInput label="Phone" value={emergencyPhone} onChangeText={setEmergencyPhone} keyboardType="phone-pad" {...ip} />
          </View>
        </FadeInView>

        <FadeInView delay={300}>
          <Text style={styles.sectionLabel}>{'\u{1F4DD}'} Notes</Text>
          <View style={styles.card}>
            <TextInput label="Additional notes" value={notes} onChangeText={setNotes} multiline numberOfLines={3} {...ip} style={[styles.input, { minHeight: 80 }]} />
          </View>
        </FadeInView>

        <FadeInView delay={400}>
          <AnimatedPressable
            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
            scaleDown={0.97}
          >
            <Text style={styles.saveBtnText}>{saving ? 'Saving...' : '\u{2795}  Add Member'}</Text>
          </AnimatedPressable>
        </FadeInView>
        <View style={{ height: 24 }} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: 20 },
  sectionLabel: { fontSize: 15, fontWeight: '600', color: Colors.textSub, marginBottom: 10, marginTop: 4 },
  card: { backgroundColor: Colors.bgCard, borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: Colors.border, gap: 14 },
  input: { backgroundColor: Colors.bgElevated },
  fieldLabel: { fontSize: 13, color: Colors.textMuted, fontWeight: '500' },
  row: { flexDirection: 'row', gap: 12 },
  saveBtn: { backgroundColor: Colors.accent, borderRadius: 14, paddingVertical: 18, alignItems: 'center' },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});
