import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Modal, TouchableOpacity } from 'react-native';
import { TextInput, SegmentedButtons } from 'react-native-paper';
import { Stack, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import AnimatedPressable from '@/components/AnimatedPressable';
import FadeInView from '@/components/FadeInView';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

interface Credentials { code: string; password: string; name: string; }

export default function AddMemberScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();

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
  const [credentials, setCredentials] = useState<Credentials | null>(null);

  const ip = {
    mode: 'outlined' as const,
    style: styles.input,
    outlineColor: Colors.border,
    activeOutlineColor: Colors.accent,
    textColor: Colors.text,
    theme: { colors: { onSurfaceVariant: Colors.textMuted } },
  };

  const seg = {
    colors: {
      secondaryContainer: Colors.accentMuted,
      onSecondaryContainer: Colors.accent,
      onSurface: Colors.textMuted,
      outline: Colors.border,
    },
  };

  const parseDob = (raw: string): string | null => {
    const parts = raw.split('/');
    if (parts.length === 3 && parts[2].length === 4) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return null;
  };

  const handleSave = async () => {
    if (!fullName.trim()) { Alert.alert('Required', 'Enter member name'); return; }
    if (!phone.trim()) { Alert.alert('Required', 'Enter phone number'); return; }
    if (!profile?.gym_id) { Alert.alert('Error', 'No gym found for your account'); return; }

    setSaving(true);

    // Step 1: Create Supabase auth user via edge function
    const { data: credData, error: credError } = await supabase.functions.invoke('create-gym-user', {
      body: { role: 'member', gymId: profile.gym_id, fullName: fullName.trim() },
    });


    if (credError || !credData?.userId) {
      setSaving(false);
      Alert.alert('Error', credError?.message ?? 'Failed to create member account');
      return;
    }

    // Step 2: Create member record with credentials
    const { error: memberError } = await supabase.from('members').insert({
      gym_id: profile.gym_id,
      user_id: credData.userId,
      member_code: credData.code,
      member_password: credData.password,
      full_name: fullName.trim(),
      phone: phone.trim(),
      email: email.trim() || null,
      gender: gender as any,
      date_of_birth: dob ? parseDob(dob) : null,
      height_cm: height ? parseFloat(height) : null,
      weight_kg: weight ? parseFloat(weight) : null,
      goal: goal as any,
      emergency_contact_name: emergencyName.trim() || null,
      emergency_contact_phone: emergencyPhone.trim() || null,
      notes: notes.trim() || null,
      status: 'active',
      join_date: new Date().toISOString().split('T')[0],
      created_by: profile.id,
    });

    if (memberError) {
      setSaving(false);
      Alert.alert('Error', memberError.message);
      return;
    }

   

    setSaving(false);

    // Step 4: Show credentials to owner
    setCredentials({ code: credData.code, password: credData.password, name: fullName.trim() });
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Add Member' }} />

      {/* Credentials Modal */}
      <Modal visible={!!credentials} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconRow}>
              <View style={styles.modalIcon}>
                <MaterialCommunityIcons name="check-circle-outline" size={36} color={Colors.green} />
              </View>
            </View>
            <Text style={styles.modalTitle}>Member Added!</Text>
            <Text style={styles.modalSub}>Share these credentials with {credentials?.name}</Text>

            <View style={styles.credCard}>
              <View style={styles.credRow}>
                <Text style={styles.credLabel}>MEMBER ID</Text>
                <Text style={styles.credValue}>{credentials?.code}</Text>
              </View>
              <View style={styles.credDivider} />
              <View style={styles.credRow}>
                <Text style={styles.credLabel}>PASSWORD</Text>
                <Text style={styles.credValue}>{credentials?.password}</Text>
              </View>
            </View>

            <View style={styles.warningRow}>
              <MaterialCommunityIcons name="alert-circle-outline" size={14} color={Colors.orange} />
              <Text style={styles.warningText}>Screenshot or write this down. The member uses these to log
                in.</Text>
            </View>

            <TouchableOpacity
              style={styles.modalBtn}
              onPress={() => { setCredentials(null); router.back(); }}
              activeOpacity={0.82}
            >
              <Text style={styles.modalBtnText}>DONE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Personal */}
        <FadeInView delay={0}>
          <Text style={styles.sectionLabel}>PERSONAL INFO</Text>
          <View style={styles.card}>
            <TextInput label="Full name *" value={fullName} onChangeText={setFullName} {...ip} />
            <TextInput label="Phone *" value={phone} onChangeText={setPhone}
              keyboardType="phone-pad"     {...ip} />
            <TextInput label="Email" value={email} onChangeText={setEmail}
              keyboardType="email-address" autoCapitalize="none" {...ip} />
            <Text style={styles.fieldLabel}>GENDER</Text>
            <SegmentedButtons
              value={gender} onValueChange={setGender}
              buttons={[
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
                { value: 'other', label: 'Other' },
              ]}
              theme={seg}
            />
            <TextInput label="Date of birth (DD/MM/YYYY)" value={dob} onChangeText={setDob}
              keyboardType="numeric" {...ip} />
          </View>
        </FadeInView>

        {/* Body Metrics */}
        <FadeInView delay={100}>
          <Text style={styles.sectionLabel}>BODY METRICS</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <TextInput label="Height (cm)" value={height} onChangeText={setHeight} keyboardType="numeric"
                {...ip} style={[styles.input, { flex: 1 }]} />
              <TextInput label="Weight (kg)" value={weight} onChangeText={setWeight} keyboardType="numeric"
                {...ip} style={[styles.input, { flex: 1 }]} />
            </View>
            <Text style={styles.fieldLabel}>GOAL</Text>
            <SegmentedButtons
              value={goal} onValueChange={setGoal}
              buttons={[
                { value: 'weight_loss', label: 'Lose' },
                { value: 'muscle_gain', label: 'Gain' },
                { value: 'general_fitness', label: 'Fit' },
                { value: 'other', label: 'Other' },
              ]}
              theme={seg}
            />
          </View>
        </FadeInView>

        {/* Emergency Contact */}
        <FadeInView delay={200}>
          <Text style={styles.sectionLabel}>EMERGENCY CONTACT</Text>
          <View style={styles.card}>
            <TextInput label="Name" value={emergencyName} onChangeText={setEmergencyName}  {...ip} />
            <TextInput label="Phone" value={emergencyPhone} onChangeText={setEmergencyPhone}
              keyboardType="phone-pad" {...ip} />
          </View>
        </FadeInView>

        {/* Notes */}
        <FadeInView delay={300}>
          <Text style={styles.sectionLabel}>NOTES</Text>
          <View style={styles.card}>
            <TextInput
              label="Additional notes"
              value={notes} onChangeText={setNotes}
              multiline numberOfLines={3}
              {...ip} style={[styles.input, { minHeight: 80 }]}
            />
          </View>
        </FadeInView>

        {/* Save */}
        <FadeInView delay={400}>
          <AnimatedPressable
            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
            scaleDown={0.97}
          >
            <Text style={styles.saveBtnText}>{saving ? 'CREATING ACCOUNT...' : '+ ADD MEMBER'}</Text>
          </AnimatedPressable>
        </FadeInView>

        <View style={{ height: 24 }} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: 16, gap: 6 },

  sectionLabel: {
    fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted, letterSpacing: 1.8,
    marginBottom: 8, marginTop: 4
  },
  card: {
    backgroundColor: Colors.bgCard, borderRadius: 16, padding: 16, marginBottom: 8, borderWidth:
      1, borderColor: Colors.border, gap: 14
  },
  input: { backgroundColor: Colors.bgElevated },
  fieldLabel: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted, letterSpacing: 1.5 },
  row: { flexDirection: 'row', gap: 12 },

  saveBtn: {
    backgroundColor: Colors.accent, borderRadius: 16, paddingVertical: 18, alignItems: 'center',
    marginTop: 8
  },
  saveBtnText: { fontFamily: Fonts.bold, fontSize: 15, color: '#FFF', letterSpacing: 2 },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center',
    padding: 24
  },
  modalCard: {
    backgroundColor: Colors.bgCard, borderRadius: 24, padding: 24, width: '100%', borderWidth:
      1, borderColor: Colors.border, gap: 12
  },
  modalIconRow: { alignItems: 'center', marginBottom: 4 },
  modalIcon: {
    width: 64, height: 64, borderRadius: 20, backgroundColor: Colors.green + '18',
    justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: Colors.green + '40'
  },
  modalTitle: {
    fontFamily: Fonts.condensedBold, fontSize: 28, color: Colors.text, textAlign: 'center',
    letterSpacing: 0.5
  },
  modalSub: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, textAlign: 'center' },

  credCard: {
    backgroundColor: Colors.bgElevated, borderRadius: 16, borderWidth: 1, borderColor:
      Colors.accent + '30', overflow: 'hidden', marginTop: 4
  },
  credRow: { padding: 16, gap: 6 },
  credDivider: { height: 1, backgroundColor: Colors.border },
  credLabel: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted, letterSpacing: 2 },
  credValue: { fontFamily: Fonts.condensedBold, fontSize: 28, color: Colors.accent, letterSpacing: 2 },

  warningRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: Colors.orange +
      '10', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: Colors.orange + '25'
  },
  warningText: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, flex: 1, lineHeight: 16 },

  modalBtn: {
    backgroundColor: Colors.accent, borderRadius: 14, paddingVertical: 16, alignItems: 'center',
    marginTop: 4
  },
  modalBtnText: { fontFamily: Fonts.bold, fontSize: 15, color: '#FFF', letterSpacing: 2 },
});