 import { useState } from 'react';                                                    import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';            import { TextInput, SegmentedButtons } from 'react-native-paper';                    import { Stack, useRouter } from 'expo-router';                                      import { Colors } from '@/constants/colors';                                         import { Fonts } from '@/constants/fonts';                                         
  import AnimatedPressable from '@/components/AnimatedPressable';                      import FadeInView from '@/components/FadeInView';                                  
                                                                                       export default function AddMemberScreen() {                                        
    const router = useRouter();                                                      
    const [fullName, setFullName]             = useState('');                        
    const [phone, setPhone]                   = useState('');
    const [email, setEmail]                   = useState('');
    const [gender, setGender]                 = useState('male');
    const [dob, setDob]                       = useState('');
    const [height, setHeight]                 = useState('');
    const [weight, setWeight]                 = useState('');
    const [goal, setGoal]                     = useState('general_fitness');
    const [emergencyName, setEmergencyName]   = useState('');
    const [emergencyPhone, setEmergencyPhone] = useState('');
    const [notes, setNotes]                   = useState('');
    const [saving, setSaving]                 = useState(false);

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

    const handleSave = () => {
      if (!fullName.trim()) { Alert.alert('Required', 'Enter member name'); return; }
      if (!phone.trim())    { Alert.alert('Required', 'Enter phone number'); return; 
  }
      setSaving(true);
      setTimeout(() => {
        setSaving(false);
        Alert.alert('Done', 'Member added', [{ text: 'OK', onPress: () =>
  router.back() }]);
      }, 400);
    };

    return (
      <>
        <Stack.Screen options={{ title: 'Add Member' }} />
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
              <TextInput label="Full name *"                value={fullName}
  onChangeText={setFullName}       {...ip} />
              <TextInput label="Phone *"                    value={phone}
  onChangeText={setPhone}          keyboardType="phone-pad"    {...ip} />
              <TextInput label="Email"                      value={email}
  onChangeText={setEmail}          keyboardType="email-address" autoCapitalize="none"
   {...ip} />
              <Text style={styles.fieldLabel}>GENDER</Text>
              <SegmentedButtons
                value={gender} onValueChange={setGender}
                buttons={[{ value: 'male', label: 'Male' }, { value: 'female', label:
   'Female' }, { value: 'other', label: 'Other' }]}
                theme={seg}
              />
              <TextInput label="Date of birth (DD/MM/YYYY)" value={dob}
  onChangeText={setDob}   keyboardType="numeric" {...ip} />
            </View>
          </FadeInView>

          {/* Body Metrics */}
          <FadeInView delay={100}>
            <Text style={styles.sectionLabel}>BODY METRICS</Text>
            <View style={styles.card}>
              <View style={styles.row}>
                <TextInput label="Height (cm)" value={height}
  onChangeText={setHeight} keyboardType="numeric" {...ip} style={[styles.input, {    
  flex: 1 }]} />
                <TextInput label="Weight (kg)" value={weight}
  onChangeText={setWeight} keyboardType="numeric" {...ip} style={[styles.input, {    
  flex: 1 }]} />
              </View>
              <Text style={styles.fieldLabel}>GOAL</Text>
              <SegmentedButtons
                value={goal} onValueChange={setGoal}
                buttons={[
                  { value: 'weight_loss',      label: 'Lose'  },
                  { value: 'muscle_gain',      label: 'Gain'  },
                  { value: 'general_fitness',  label: 'Fit'   },
                  { value: 'other',            label: 'Other' },
                ]}
                theme={seg}
              />
            </View>
          </FadeInView>

          {/* Emergency Contact */}
          <FadeInView delay={200}>
            <Text style={styles.sectionLabel}>EMERGENCY CONTACT</Text>
            <View style={styles.card}>
              <TextInput label="Name"  value={emergencyName}
  onChangeText={setEmergencyName}  {...ip} />
              <TextInput label="Phone" value={emergencyPhone}
  onChangeText={setEmergencyPhone} keyboardType="phone-pad" {...ip} />
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
              <Text style={styles.saveBtnText}>{saving ? 'SAVING...' : '+ ADD   MEMBER'}</Text>
            </AnimatedPressable>
          </FadeInView>

          <View style={{ height: 24 }} />
        </ScrollView>
      </>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    scroll:    { padding: 16, gap: 6 },

    sectionLabel: {
      fontFamily: Fonts.bold,
      fontSize: 9, color: Colors.textMuted,
      letterSpacing: 1.8, marginBottom: 8, marginTop: 4,
    },
    card: {
      backgroundColor: Colors.bgCard,
      borderRadius: 16, padding: 16,
      marginBottom: 8,
      borderWidth: 1, borderColor: Colors.border,
      gap: 14,
    },
    input:      { backgroundColor: Colors.bgElevated },
    fieldLabel: {
      fontFamily: Fonts.bold,
      fontSize: 9, color: Colors.textMuted, letterSpacing: 1.5,
    },
    row: { flexDirection: 'row', gap: 12 },

    saveBtn: {
      backgroundColor: Colors.accent,
      borderRadius: 14, paddingVertical: 18,
      alignItems: 'center', marginTop: 8,
    },
    saveBtnText: {
      fontFamily: Fonts.bold,
      fontSize: 13, color: '#FFF', letterSpacing: 1.5,
    },
  });