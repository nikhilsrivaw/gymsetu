import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  TextInput as RNTextInput, Modal, Pressable,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import AnimatedPressable from '@/components/AnimatedPressable';
import FadeInView from '@/components/FadeInView';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

// ── Custom field ──────────────────────────────────────────────────────────────
function Field({
  icon, label, value, onChange, required, hint, ...rest
}: {
  icon: IconName; label: string; value: string;
  onChange: (v: string) => void; required?: boolean;
  hint?: string; [k: string]: any;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View>
      <View style={[f.outer, focused && f.outerFocused]}>
        <MaterialCommunityIcons
          name={icon} size={17}
          color={focused ? Colors.accent : Colors.textMuted}
          style={f.icon}
        />
        <View style={f.col}>
          <Text style={[f.lbl, focused && f.lblFocused]}>
            {label}{required ? ' *' : ''}
          </Text>
          <RNTextInput
            style={f.inp}
            value={value}
            onChangeText={onChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholderTextColor={Colors.textMuted}
            {...rest}
          />
        </View>
      </View>
      {hint ? <Text style={f.hint}>{hint}</Text> : null}
    </View>
  );
}

const f = StyleSheet.create({
  outer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgElevated,
    borderRadius: 14, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 14, paddingVertical: 13, gap: 12,
  },
  outerFocused: { borderColor: Colors.accent + '70' },
  icon:         { width: 20, textAlign: 'center' },
  col:          { flex: 1 },
  lbl:          { fontFamily: Fonts.bold, fontSize: 8, color: Colors.textMuted, letterSpacing: 1.4, marginBottom: 4 },
  lblFocused:   { color: Colors.accent },
  inp:          { fontFamily: Fonts.regular, fontSize: 14, color: Colors.text, padding: 0 },
  hint:         { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted, marginTop: 5, marginLeft: 14 },
});

export default function AddBranchScreen() {
  const { profile, fetchBranches } = useAuthStore();
  const router = useRouter();

  const [name,     setName]     = useState('');
  const [code,     setCode]     = useState('');
  const [city,     setCity]     = useState('');
  const [address,  setAddress]  = useState('');
  const [phone,    setPhone]    = useState('');
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState(false);

  const handleSave = async () => {
    setError('');
    if (!name.trim()) { setError('Branch name is required.'); return; }
    const mainGymId = (profile as any)?.gym_id;
    if (!mainGymId) { setError('No gym found. Please try again.'); return; }

    setSaving(true);

    const { data: mainGym } = await supabase
      .from('gyms').select('owner_id').eq('id', mainGymId).single();

    const { error: insertError } = await supabase.from('gyms').insert({
      name:           name.trim(),
      owner_id:       mainGym?.owner_id,
      parent_gym_id:  mainGymId,
      is_branch:      true,
      branch_code:    code.trim().toUpperCase() || null,
      branch_city:    city.trim() || null,
      branch_address: address.trim() || null,
      phone:          phone.trim() || null,
    });

    if (insertError) {
      setSaving(false);
      setError(insertError.message);
      return;
    }

    await fetchBranches();
    setSaving(false);
    setSuccess(true);
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Add Branch' }} />
      <ScrollView
        style={s.container}
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* ── Info banner ── */}
        <FadeInView delay={0}>
          <View style={s.infoBanner}>
            <LinearGradient
              colors={[Colors.accent + '12', 'transparent']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill} pointerEvents="none"
            />
            <View style={s.infoIconBox}>
              <MaterialCommunityIcons name="source-branch" size={20} color={Colors.accent} />
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={s.infoTitle}>NEW BRANCH</Text>
              <Text style={s.infoDesc}>
                Each branch is fully independent — own members, trainers, payments & attendance.
              </Text>
            </View>
          </View>
        </FadeInView>

        {/* ── Fields ── */}
        <FadeInView delay={60}>
          <Text style={s.sectionLabel}>BRANCH DETAILS</Text>
          <View style={s.card}>
            <Field
              icon="store-outline"
              label="BRANCH NAME"
              required
              value={name}
              onChange={(v) => { setName(v); setError(''); }}
              placeholder="e.g. GymSetu Andheri"
            />
            <Field
              icon="tag-outline"
              label="BRANCH CODE"
              value={code}
              onChange={(v) => { setCode(v.toUpperCase()); setError(''); }}
              autoCapitalize="characters"
              maxLength={5}
              placeholder="e.g. ANH"
              hint="Short 2–5 letter identifier shown on reports"
            />
            <Field
              icon="city-variant-outline"
              label="CITY"
              value={city}
              onChange={setCity}
              placeholder="e.g. Mumbai"
            />
            <Field
              icon="map-marker-outline"
              label="ADDRESS"
              value={address}
              onChange={setAddress}
              placeholder="Full branch address"
              multiline
              numberOfLines={2}
            />
            <Field
              icon="phone-outline"
              label="PHONE"
              value={phone}
              onChange={setPhone}
              keyboardType="phone-pad"
              placeholder="+91 98765 43210"
            />
          </View>
        </FadeInView>

        {/* ── Tip card ── */}
        <FadeInView delay={120}>
          <View style={s.tipCard}>
            <MaterialCommunityIcons name="lightbulb-on-outline" size={14} color={Colors.orange} />
            <Text style={s.tipText}>
              After creating, switch to the branch from the dashboard to add its members and trainers.
            </Text>
          </View>
        </FadeInView>

        {/* ── Inline error ── */}
        {!!error && (
          <FadeInView delay={0}>
            <View style={s.errorBox}>
              <MaterialCommunityIcons name="alert-circle-outline" size={14} color={Colors.red} />
              <Text style={s.errorText}>{error}</Text>
            </View>
          </FadeInView>
        )}

        {/* ── Create button ── */}
        <FadeInView delay={180}>
          <AnimatedPressable
            style={[s.createPressable, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
            scaleDown={0.97}
          >
            <LinearGradient
              colors={[Colors.accent, '#C55A00']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={s.createBtn}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <MaterialCommunityIcons name="source-branch-plus" size={18} color="#fff" />
                  <Text style={s.createBtnText}>CREATE BRANCH</Text>
                </>
              )}
            </LinearGradient>
          </AnimatedPressable>
        </FadeInView>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ── Success overlay ── */}
      <Modal visible={success} transparent animationType="fade" onRequestClose={() => {}}>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={s.successOverlay}>
          <View style={s.successCard}>
            <LinearGradient
              colors={[Colors.green + '14', 'transparent']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill} pointerEvents="none"
            />
            {/* Top accent */}
            <View style={s.successTopBar} />

            {/* Icon */}
            <View style={s.successIconRing}>
              <View style={s.successIconInner}>
                <MaterialCommunityIcons name="check" size={32} color={Colors.green} />
              </View>
            </View>

            <Text style={s.successTitle}>BRANCH CREATED</Text>
            <Text style={s.successName}>{name}</Text>
            <Text style={s.successDesc}>
              Your new branch is ready. Switch to it from the dashboard branch switcher to start managing it.
            </Text>

            {/* Details row */}
            <View style={s.successDetails}>
              {code ? (
                <View style={s.successPill}>
                  <MaterialCommunityIcons name="tag-outline" size={11} color={Colors.accent} />
                  <Text style={s.successPillText}>{code}</Text>
                </View>
              ) : null}
              {city ? (
                <View style={s.successPill}>
                  <MaterialCommunityIcons name="city-variant-outline" size={11} color={Colors.accent} />
                  <Text style={s.successPillText}>{city}</Text>
                </View>
              ) : null}
            </View>

            {/* Button */}
            <AnimatedPressable
              style={s.successBtn}
              scaleDown={0.96}
              onPress={() => { setSuccess(false); router.back(); }}
            >
              <LinearGradient
                colors={[Colors.green, '#1a7a3c']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={s.successBtnGrad}
              >
                <MaterialCommunityIcons name="arrow-left" size={16} color="#fff" />
                <Text style={s.successBtnText}>GO BACK</Text>
              </LinearGradient>
            </AnimatedPressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll:    { padding: 16, gap: 14 },

  // ── Info banner ───────────────────────────────────────────────
  infoBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.bgCard, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.accent + '30',
    padding: 16, overflow: 'hidden',
  },
  infoIconBox: {
    width: 44, height: 44, borderRadius: 13,
    backgroundColor: Colors.accentMuted,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.accent + '30',
  },
  infoTitle: { fontFamily: Fonts.bold, fontSize: 11, color: Colors.accent, letterSpacing: 1.3 },
  infoDesc:  { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, lineHeight: 18 },

  // ── Fields ───────────────────────────────────────────────────
  sectionLabel: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted, letterSpacing: 1.8, marginBottom: 8 },
  card:         { backgroundColor: Colors.bgCard, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: Colors.border, gap: 12 },

  // ── Tip ──────────────────────────────────────────────────────
  tipCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: Colors.orange + '10', borderRadius: 12,
    borderWidth: 1, borderColor: Colors.orange + '25',
    paddingHorizontal: 14, paddingVertical: 12,
  },
  tipText: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, lineHeight: 18, flex: 1 },

  // ── Error ────────────────────────────────────────────────────
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.red + '14', borderRadius: 12,
    borderWidth: 1, borderColor: Colors.red + '30',
    paddingHorizontal: 14, paddingVertical: 10,
  },
  errorText: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.red, flex: 1 },

  // ── Create button ────────────────────────────────────────────
  createPressable: {},
  createBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 16, paddingVertical: 18, minHeight: 58 },
  createBtnText:   { fontFamily: Fonts.bold, fontSize: 14, color: '#fff', letterSpacing: 2 },

  // ── Success overlay ──────────────────────────────────────────
  successOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  successCard: {
    width: '100%', backgroundColor: Colors.bgCard,
    borderRadius: 28, borderWidth: 1, borderColor: Colors.green + '40',
    overflow: 'hidden', alignItems: 'center',
    paddingHorizontal: 28, paddingBottom: 28,
  },
  successTopBar: {
    alignSelf: 'stretch', height: 3,
    backgroundColor: Colors.green, marginBottom: 28,
  },
  successIconRing: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.green + '14',
    borderWidth: 1, borderColor: Colors.green + '40',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 20,
  },
  successIconInner: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: Colors.green + '22',
    justifyContent: 'center', alignItems: 'center',
  },
  successTitle:  { fontFamily: Fonts.condensedBold, fontSize: 14, color: Colors.green, letterSpacing: 3, marginBottom: 8 },
  successName:   { fontFamily: Fonts.condensedBold, fontSize: 26, color: Colors.text, textAlign: 'center', marginBottom: 10 },
  successDesc:   { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: 16 },
  successDetails:{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 24 },
  successPill:   {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.accentMuted, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: Colors.accent + '30',
  },
  successPillText: { fontFamily: Fonts.bold, fontSize: 10, color: Colors.accent, letterSpacing: 0.5 },
  successBtn:    { alignSelf: 'stretch' },
  successBtnGrad:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 16 },
  successBtnText:{ fontFamily: Fonts.bold, fontSize: 13, color: '#fff', letterSpacing: 1.5 },
});
