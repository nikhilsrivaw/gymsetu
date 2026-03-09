  import { useState } from 'react';                                                                               import {                                                                                                      
    View, Text, StyleSheet, ScrollView, TextInput,                                                              
    TouchableOpacity, ActivityIndicator, Alert, Modal,
  } from 'react-native';
  import { Stack, useRouter } from 'expo-router';
  import { MaterialCommunityIcons } from '@expo/vector-icons';
  import { Colors } from '@/constants/colors';
  import { Fonts } from '@/constants/fonts';
  import FadeInView from '@/components/FadeInView';
  import AnimatedPressable from '@/components/AnimatedPressable';
  import { supabase } from '@/lib/supabase';
  import { useAuthStore } from '@/store/authStore';

  const ACCENT = '#3B82F6';

  export default function AddTrainerScreen() {
    const { profile } = useAuthStore();
    const router = useRouter();

    const [fullName,       setFullName]       = useState('');
    const [phone,          setPhone]          = useState('');
    const [specialization, setSpecialization] = useState('');
    const [loading,        setLoading]        = useState(false);

    const [showModal,       setShowModal]       = useState(false);
    const [trainerCode,     setTrainerCode]     = useState('');
    const [trainerPassword, setTrainerPassword] = useState('');

    const handleCreate = async () => {
      if (!fullName.trim()) {
        Alert.alert('Required', "Please enter the trainer's full name.");
        return;
      }
      if (!profile?.gym_id) {
        Alert.alert('Error', 'No gym found for your account');
        return;
      }

      setLoading(true);
      try {
        // 1. Create auth user + profile via edge function
        const { data: fnData, error: fnError } = await supabase.functions.invoke('create-gym-user', {
          body: { role: 'trainer', gymId: profile.gym_id, fullName: fullName.trim() },
        });
        if (fnError || !fnData?.userId) throw new Error(fnError?.message ?? 'Failed to create trainer account');

        const { userId, code, password } = fnData;

        // 2. Insert into trainers table
        const { error: insertError } = await supabase.from('trainers').insert({
          gym_id:           profile.gym_id,
          user_id:          userId,
          full_name:        fullName.trim(),
          phone:            phone.trim() || null,
          specialization:   specialization.trim() || null,
          status:           'active',
          trainer_code:     code,
          trainer_password: password,
        });
        if (insertError) throw new Error(insertError.message);

        setTrainerCode(code);
        setTrainerPassword(password);
        setShowModal(true);
      } catch (err: any) {
        Alert.alert('Error', err.message ?? 'Could not create trainer');
      }
      setLoading(false);
    };

    return (
      <>
        <Stack.Screen options={{ title: 'Add Trainer' }} />
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <FadeInView delay={0}>
            <Text style={styles.headline}>NEW TRAINER</Text>
            <Text style={styles.sub}>Credentials will be auto-generated</Text>
          </FadeInView>

          <FadeInView delay={60}>
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>TRAINER INFO</Text>

              <View style={styles.fieldWrap}>
                <Text style={styles.label}>Full Name <Text style={styles.req}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="e.g. Ramesh Kumar"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              <View style={styles.fieldWrap}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="e.g. 9876543210"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.fieldWrap}>
                <Text style={styles.label}>Specialization</Text>
                <TextInput
                  style={styles.input}
                  value={specialization}
                  onChangeText={setSpecialization}
                  placeholder="e.g. Weight Training, Yoga, CrossFit"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
            </View>
          </FadeInView>

          <FadeInView delay={120}>
            <View style={styles.infoCard}>
              <MaterialCommunityIcons name="information-outline" size={16} color={ACCENT} />
              <Text style={styles.infoText}>
                A unique Trainer ID (GST-XXXXXX) and password will be generated automatically. Share these with 
  the trainer to log in.
              </Text>
            </View>
          </FadeInView>

          <FadeInView delay={160}>
            <AnimatedPressable
              style={[styles.submitBtn, loading && { opacity: 0.6 }]}
              scaleDown={0.97}
              onPress={handleCreate}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#FFF" size="small" />
                : <Text style={styles.submitText}>CREATE TRAINER</Text>
              }
            </AnimatedPressable>
          </FadeInView>

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Credentials Modal */}
        <Modal visible={showModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalEmoji}>🎉</Text>
              <Text style={styles.modalTitle}>Trainer Created!</Text>
              <Text style={styles.modalSub}>Share these credentials with the trainer</Text>

              <View style={styles.credBox}>
                <View style={styles.credRow}>
                  <Text style={styles.credLabel}>TRAINER ID</Text>
                  <Text style={styles.credValue}>{trainerCode}</Text>
                </View>
                <View style={[styles.credRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.credLabel}>PASSWORD</Text>
                  <Text style={styles.credValue}>{trainerPassword}</Text>
                </View>
              </View>

              <View style={styles.warningRow}>
                <MaterialCommunityIcons name="alert-circle-outline" size={13} color={Colors.orange} />
                <Text style={styles.warningText}>
                  Screenshot or write this down — password won't be shown again
                </Text>
              </View>

              <TouchableOpacity
                style={styles.doneBtn}
                onPress={() => { setShowModal(false); router.back(); }}
              >
                <Text style={styles.doneBtnText}>DONE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    scroll:    { paddingHorizontal: 16, paddingTop: 20 },

    headline: { fontFamily: Fonts.condensedBold, fontSize: 32, color: Colors.text, letterSpacing: 1 },
    sub:      { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, marginTop: 4, marginBottom: 20
   },

    section: {
      backgroundColor: Colors.bgCard, borderRadius: 18,
      borderWidth: 1, borderColor: Colors.border,
      padding: 16, marginBottom: 16, gap: 14,
    },
    sectionLabel: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted, letterSpacing: 1.5 },

    fieldWrap: { gap: 6 },
    label:     { fontFamily: Fonts.bold, fontSize: 11, color: Colors.textMuted, letterSpacing: 0.5 },
    req:       { color: Colors.red },
    input: {
      backgroundColor: Colors.bgElevated, borderRadius: 12,
      borderWidth: 1, borderColor: Colors.border,
      paddingHorizontal: 14, paddingVertical: 12,
      fontFamily: Fonts.regular, fontSize: 14, color: Colors.text,
    },

    infoCard: {
      flexDirection: 'row', alignItems: 'flex-start', gap: 8,
      backgroundColor: ACCENT + '12', borderRadius: 12,
      borderWidth: 1, borderColor: ACCENT + '30',
      padding: 12, marginBottom: 20,
    },
    infoText: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, flex: 1, lineHeight: 18 },    

    submitBtn: {
      backgroundColor: ACCENT, borderRadius: 14,
      paddingVertical: 16, alignItems: 'center',
    },
    submitText: { fontFamily: Fonts.bold, fontSize: 14, color: '#FFF', letterSpacing: 1 },

    modalOverlay: { flex: 1, backgroundColor: '#000000AA', justifyContent: 'center', alignItems: 'center',      
  padding: 24 },
    modalCard: {
      backgroundColor: Colors.bgCard, borderRadius: 24, padding: 24,
      width: '100%', alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
    },
    modalEmoji:  { fontSize: 40, marginBottom: 10 },
    modalTitle:  { fontFamily: Fonts.condensedBold, fontSize: 24, color: Colors.text, letterSpacing: 0.5 },     
    modalSub:    { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, marginTop: 4, marginBottom:
   20, textAlign: 'center' },

    credBox: {
      width: '100%', backgroundColor: Colors.bgElevated,
      borderRadius: 14, borderWidth: 1, borderColor: Colors.border,
      marginBottom: 14, overflow: 'hidden',
    },
    credRow:   {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: 16, paddingVertical: 14,
      borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
    credLabel: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted, letterSpacing: 1 },
    credValue: { fontFamily: Fonts.condensedBold, fontSize: 18, color: Colors.text, letterSpacing: 1 },

    warningRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 20 },
    warningText: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.orange, flex: 1, lineHeight: 16 },    

    doneBtn:     { backgroundColor: ACCENT, borderRadius: 12, paddingVertical: 14, width: '100%', alignItems:   
  'center' },
    doneBtnText: { fontFamily: Fonts.bold, fontSize: 14, color: '#FFF', letterSpacing: 1 },
  });