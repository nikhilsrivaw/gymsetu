import { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Modal,
  TextInput, ActivityIndicator, Keyboard, Image, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { uploadImageToSupabase } from '@/lib/uploadImage';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import FadeInView from '@/components/FadeInView';
import AnimatedPressable from '@/components/AnimatedPressable';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import type { Gym, GymAmenity, GymTiming, GymSocialLink } from '@/types/database';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const GYM_CAPACITY = 100;

const DEFAULT_TIMINGS: GymTiming[] = [
  { day: 'Mon – Fri', open: '5:30 AM', close: '10:00 PM' },
  { day: 'Saturday',  open: '6:00 AM', close: '9:00 PM'  },
  { day: 'Sunday',    open: '7:00 AM', close: '2:00 PM'  },
];

const DEFAULT_AMENITIES: GymAmenity[] = [
  { label: 'AC',                icon: 'air-conditioner',            active: false },
  { label: 'Parking',           icon: 'car-outline',                active: false },
  { label: 'Locker Room',       icon: 'lock-outline',               active: false },
  { label: 'Steam Room',        icon: 'weather-fog',                active: false },
  { label: 'Juice Bar',         icon: 'cup-outline',                active: false },
  { label: 'Personal Training', icon: 'account-supervisor-outline', active: false },
  { label: 'Yoga Room',         icon: 'yoga',                       active: false },
  { label: 'Cardio Zone',       icon: 'run-fast',                   active: false },
];

const DEFAULT_SOCIAL: GymSocialLink[] = [
  { platform: 'Instagram', handle: '', icon: 'instagram', color: '#E1306C' },
  { platform: 'Facebook',  handle: '', icon: 'facebook',  color: '#1877F2' },
  { platform: 'YouTube',   handle: '', icon: 'youtube',   color: '#FF0000' },
  { platform: 'WhatsApp',  handle: '', icon: 'whatsapp',  color: '#25D366' },
];

export default function GymProfileScreen() {
  const { profile, activeGymId, fetchGymProfile } = useAuthStore();
  const { edit } = useLocalSearchParams<{ edit?: string }>();

  const [gym, setGym]                 = useState<Gym | null>(null);
  const [ownerName, setOwnerName]     = useState('');
  const [activeCount, setActiveCount] = useState(0);
  const [loading, setLoading]         = useState(true);
  const [fetchError, setFetchError]   = useState('');

  // Display-only data (not editable)
  const [timings, setTimings]     = useState<GymTiming[]>(DEFAULT_TIMINGS);
  const [amenities, setAmenities] = useState<GymAmenity[]>(DEFAULT_AMENITIES);
  const [socialLinks, setSocialLinks] = useState<GymSocialLink[]>(DEFAULT_SOCIAL);

  // Edit modal
  const [editModal, setEditModal] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState('');
  const [logoKey, setLogoKey]     = useState(0); // force Image remount after upload

  // Edit form fields
  const [name, setName]               = useState('');
  const [phone, setPhone]             = useState('');
  const [email, setEmail]             = useState('');
  const [address, setAddress]         = useState('');
  // Set ⇒ receipts become GST tax invoices. Blank is correct for gyms below
  // the registration threshold, so this stays optional.
  const [gstin, setGstin]             = useState('');
  const [description, setDescription] = useState('');
  const [newLogoUri, setNewLogoUri]   = useState<string | null>(null);

  // Edit social links
  const [editSocial, setEditSocial] = useState<GymSocialLink[]>(DEFAULT_SOCIAL);

  // Auto-open edit modal when navigated with ?edit=1
  useEffect(() => {
    if (edit === '1' && !loading && gym) {
      setSaveError('');
      setEditModal(true);
    }
  }, [edit, loading, gym]);

  useFocusEffect(useCallback(() => {
    let active = true;

    async function load() {
      const mainGymId = profile?.gym_id;
      if (!mainGymId) { setLoading(false); return; }

      const gymId = activeGymId === 'all' ? mainGymId : (activeGymId ?? mainGymId);
      setFetchError('');
      setLoading(true);

      try {
        const [gymRes, countRes] = await Promise.all([
          supabase.from('gyms').select('*').eq('id', gymId).maybeSingle(),
          supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('gym_id', gymId)
            .eq('role', 'member')
            .eq('status', 'active'),
        ]);

        if (!active) return;
        if (gymRes.error) throw gymRes.error;

        if (gymRes.data) {
          const g = gymRes.data as Gym;
          setGym(g);
          setName(g.name ?? '');
          setPhone(g.phone ?? '');
          setEmail(g.email ?? '');
          setAddress(g.address ?? '');
          setGstin((g as any).gstin ?? '');
          setDescription(g.description ?? '');

          if (g.timings?.length)  setTimings(g.timings);
          if (g.amenities?.length) {
            const dbMap = new Map(g.amenities.map(a => [a.label, a.active]));
            setAmenities(DEFAULT_AMENITIES.map(a => ({
              ...a, active: dbMap.has(a.label) ? (dbMap.get(a.label) as boolean) : a.active,
            })));
          }
          if (g.social_links?.length) {
            const dbMap = new Map(g.social_links.map(s => [s.platform, s.handle]));
            const merged = DEFAULT_SOCIAL.map(s => ({ ...s, handle: (dbMap.get(s.platform) ?? '') as string }));
            setSocialLinks(merged);
            setEditSocial(merged);
          }

          if (g.owner_id) {
            const { data: ownerData } = await supabase
              .from('profiles').select('full_name').eq('id', g.owner_id).maybeSingle();
            if (active && ownerData) setOwnerName(ownerData.full_name);
          }
        }

        setActiveCount(countRes.count ?? 0);
      } catch (e: any) {
        if (active) setFetchError(e.message ?? 'Failed to load gym profile');
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => { active = false; };
  }, [activeGymId, profile?.gym_id]));

  const pickLogo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) setNewLogoUri(result.assets[0].uri);
  };

  const handleSave = async () => {
    if (!gym) return;
    if (!name.trim()) { setSaveError('Gym name cannot be empty'); return; }
    // Catch a malformed GSTIN here so the owner sees a readable message rather
    // than the database's check-constraint error.
    const cleanGstin = gstin.trim().toUpperCase();
    if (cleanGstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(cleanGstin)) {
      setSaveError('That GSTIN doesn\'t look right. It should be 15 characters, e.g. 27AAPFU0939F1ZV.');
      return;
    }
    Keyboard.dismiss();
    setSaveError('');
    setSaving(true);

    try {
      let logoUrl: string | null = gym.logo_url;

      if (newLogoUri) {
        const ext = newLogoUri.split('.').pop()?.split('?')[0] ?? 'jpg';
        logoUrl = await uploadImageToSupabase(newLogoUri, 'gym-logos', `${gym.owner_id}/logo.${ext}`);
      }

      const { error } = await supabase
        .from('gyms')
        .update({
          name:         name.trim(),
          phone:        phone.trim()       || null,
          email:        email.trim()       || null,
          address:      address.trim()     || null,
          gstin:        cleanGstin         || null,
          description:  description.trim() || null,
          logo_url:     logoUrl,
          social_links: editSocial,
        })
        .eq('id', gym.id);

      if (error) throw error;

      // Re-fetch from DB to get the definitive logo_url (busts image cache via fresh object ref)
      const { data: fresh } = await supabase
        .from('gyms').select('*').eq('id', gym.id).maybeSingle();
      if (fresh) {
        setGym(fresh as Gym);
        if ((fresh as Gym).social_links?.length) setSocialLinks((fresh as Gym).social_links!);
      }

      setNewLogoUri(null);
      setLogoKey(k => k + 1); // force <Image> remount
      await fetchGymProfile();
      setEditModal(false);
    } catch (e: any) {
      setSaveError(e.message ?? 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.centerState}>
          <ActivityIndicator color={Colors.accent} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  const loadPct      = Math.round((activeCount / GYM_CAPACITY) * 100);
  const activeSocial = socialLinks.filter(s => s.handle.trim());

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {!!fetchError && (
          <View style={styles.errorBanner}>
            <MaterialCommunityIcons name="alert-circle-outline" size={15} color={Colors.red} />
            <Text style={styles.errorText}>{fetchError}</Text>
          </View>
        )}

        {/* ── Hero ── */}
        <FadeInView delay={0}>
          <View style={styles.hero}>
            <View style={styles.heroGlow} />
            <View style={styles.logoWrap}>
              <View style={styles.logoCircle}>
                {gym?.logo_url
                  ? <Image key={logoKey} source={{ uri: gym.logo_url + '?v=' + logoKey }} style={styles.logoImage} />
                  : <MaterialCommunityIcons name="dumbbell" size={28} color={Colors.accent} />
                }
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroMicro}>GYM PROFILE</Text>
              <Text style={styles.heroTitle}>{gym?.name ?? ''}</Text>
              <Text style={styles.heroTagline}>{gym?.description || '"No Pain, No Gain"'}</Text>
              <View style={styles.ratingRow}>
                <MaterialCommunityIcons name="account-group-outline" size={13} color={Colors.accent} />
                <Text style={styles.ratingVal}>{activeCount}</Text>
                <Text style={styles.ratingCount}>active members</Text>
              </View>
            </View>
            <AnimatedPressable style={styles.editFab} scaleDown={0.9} onPress={() => { setSaveError(''); setEditModal(true); }}>
              <MaterialCommunityIcons name="pencil-outline" size={16} color={Colors.accent} />
            </AnimatedPressable>
          </View>
        </FadeInView>

        {/* ── Capacity Bar ── */}
        <FadeInView delay={60}>
          <View style={styles.capacityCard}>
            <View style={styles.cardAccentBar} />
            <View style={styles.capacityInner}>
              <View style={styles.capacityTop}>
                <Text style={styles.capacityLabel}>ACTIVE MEMBERS</Text>
                <Text style={styles.capacityFraction}>
                  <Text style={styles.capacityCurrent}>{activeCount}</Text>
                  <Text style={styles.capacityTotal}> / {GYM_CAPACITY}</Text>
                </Text>
              </View>
              <View style={styles.trackBg}>
                <View style={[styles.trackFill, {
                  width: `${Math.min(100, loadPct)}%` as any,
                  backgroundColor: loadPct > 100 ? Colors.red : loadPct > 80 ? Colors.orange : Colors.green,
                }]} />
              </View>
              <View style={styles.capacityBottom}>
                <Text style={styles.capacitySub}>{loadPct}% capacity utilised</Text>
                <Text style={[styles.capacityStatus, { color: loadPct > 100 ? Colors.red : loadPct > 80 ? Colors.orange : Colors.green }]}>
                  {loadPct > 100 ? 'OVER CAPACITY' : loadPct > 80 ? 'NEAR FULL' : 'HEALTHY'}
                </Text>
              </View>
            </View>
          </View>
        </FadeInView>

        {/* ── Contact Details ── */}
        <FadeInView delay={120}>
          <Text style={styles.sectionLabel}>CONTACT DETAILS</Text>
          <View style={styles.infoCard}>
            {([
              { icon: 'account-outline'    as IconName, label: 'OWNER',   val: ownerName || profile?.full_name || '—' },
              { icon: 'phone-outline'      as IconName, label: 'PHONE',   val: gym?.phone   ?? '—' },
              { icon: 'email-outline'      as IconName, label: 'EMAIL',   val: gym?.email   ?? '—' },
              { icon: 'map-marker-outline' as IconName, label: 'ADDRESS', val: gym?.address ?? '—' },
            ] as const).map((row, i, arr) => (
              <View key={row.label} style={[styles.infoRow, i < arr.length - 1 && styles.infoRowBorder]}>
                <View style={styles.infoIconWrap}>
                  <MaterialCommunityIcons name={row.icon} size={15} color={Colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>{row.label}</Text>
                  <Text style={styles.infoVal}>{row.val}</Text>
                </View>
              </View>
            ))}
          </View>
        </FadeInView>

        {/* ── Timings ── */}
        <FadeInView delay={200}>
          <Text style={styles.sectionLabel}>TIMINGS</Text>
          <View style={styles.infoCard}>
            {timings.map((t, i) => (
              <View key={t.day} style={[styles.timingRow, i < timings.length - 1 && styles.infoRowBorder]}>
                <MaterialCommunityIcons name="clock-outline" size={14} color={Colors.textMuted} />
                <Text style={styles.timingDay}>{t.day}</Text>
                <Text style={styles.timingHours}>{t.open} – {t.close}</Text>
              </View>
            ))}
          </View>
        </FadeInView>

        {/* ── Amenities ── */}
        <FadeInView delay={280}>
          <Text style={styles.sectionLabel}>AMENITIES</Text>
          <View style={styles.amenitiesGrid}>
            {amenities.map(a => (
              <View key={a.label} style={[styles.amenityChip, !a.active && styles.amenityInactive]}>
                <MaterialCommunityIcons name={a.icon as IconName} size={15} color={a.active ? Colors.accent : Colors.textMuted} />
                <Text style={[styles.amenityLabel, !a.active && styles.amenityLabelInactive]}>{a.label}</Text>
                {!a.active && <Text style={styles.amenityNA}>N/A</Text>}
              </View>
            ))}
          </View>
        </FadeInView>

        {/* ── Social Media ── */}
        <FadeInView delay={360}>
          <Text style={styles.sectionLabel}>SOCIAL MEDIA</Text>
          {activeSocial.length > 0 ? activeSocial.map((s, i) => (
            <View key={s.platform} style={[styles.socialRow, i < activeSocial.length - 1 && { marginBottom: 8 }]}>
              <View style={[styles.socialIconWrap, { backgroundColor: s.color + '18' }]}>
                <MaterialCommunityIcons name={s.icon as IconName} size={18} color={s.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.socialPlatform}>{s.platform}</Text>
                <Text style={styles.socialHandle}>{s.handle}</Text>
              </View>
              <MaterialCommunityIcons name="open-in-new" size={15} color={Colors.textMuted} />
            </View>
          )) : (
            <View style={styles.socialEmpty}>
              <MaterialCommunityIcons name="share-variant-outline" size={22} color={Colors.textMuted} />
              <Text style={styles.socialEmptyText}>No social links added yet</Text>
            </View>
          )}
        </FadeInView>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ── Edit Modal ── */}
      <Modal visible={editModal} transparent animationType="slide" onRequestClose={() => setEditModal(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.backdrop} onPress={() => setEditModal(false)} />
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>EDIT GYM INFO</Text>
              <Pressable style={styles.closeBtn} onPress={() => setEditModal(false)}>
                <MaterialCommunityIcons name="close" size={18} color={Colors.textMuted} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

              {/* Logo */}
              <TouchableOpacity style={styles.logoPicker} onPress={pickLogo} activeOpacity={0.8}>
                {newLogoUri || gym?.logo_url ? (
                  <Image source={{ uri: newLogoUri ?? gym!.logo_url! }} style={styles.logoPickerImage} />
                ) : (
                  <View style={styles.logoPickerPlaceholder}>
                    <MaterialCommunityIcons name="dumbbell" size={30} color={Colors.accent} />
                  </View>
                )}
                <View style={styles.logoPickerOverlay}>
                  <MaterialCommunityIcons name="camera-outline" size={18} color="#fff" />
                  <Text style={styles.logoPickerText}>CHANGE LOGO</Text>
                </View>
              </TouchableOpacity>

              {/* Basic fields */}
              {([
                { label: 'GYM NAME',            value: name,        setter: setName,        placeholder: 'Iron Edge Fitness', kb: 'default'       },
                { label: 'PHONE',               value: phone,       setter: setPhone,       placeholder: '9876543210',        kb: 'phone-pad'     },
                { label: 'EMAIL',               value: email,       setter: setEmail,       placeholder: 'gym@email.com',     kb: 'email-address' },
                { label: 'ADDRESS',             value: address,     setter: setAddress,     placeholder: 'Full address',      kb: 'default'       },
                { label: 'GSTIN (OPTIONAL)',    value: gstin,       setter: setGstin,       placeholder: '27AAPFU0939F1ZV',   kb: 'default'       },
              ] as const).map(f => (
                <View key={f.label} style={styles.fieldWrap}>
                  <Text style={styles.fieldLabel}>{f.label}</Text>
                  <TextInput
                    value={f.value}
                    onChangeText={f.setter as (v: string) => void}
                    placeholder={f.placeholder}
                    placeholderTextColor={Colors.textMuted}
                    keyboardType={f.kb as any}
                    autoCapitalize={f.kb === 'default' ? 'words' : 'none'}
                    style={styles.input}
                  />
                </View>
              ))}

              {/* Description */}
              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>DESCRIPTION / TAGLINE</Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder='"No Pain, No Gain"'
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  numberOfLines={3}
                  style={[styles.input, styles.inputMultiline]}
                />
              </View>

              {/* Social Links */}
              <Text style={styles.sectionLabelModal}>SOCIAL MEDIA</Text>
              {editSocial.map((s, i) => (
                <View key={s.platform} style={styles.socialEditRow}>
                  <View style={[styles.socialEditIcon, { backgroundColor: s.color + '18' }]}>
                    <MaterialCommunityIcons name={s.icon as IconName} size={18} color={s.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>{s.platform.toUpperCase()}</Text>
                    <TextInput
                      value={s.handle}
                      onChangeText={v => setEditSocial(prev => prev.map((x, xi) => xi === i ? { ...x, handle: v } : x))}
                      placeholder={s.platform === 'WhatsApp' ? '+91 9876543210' : `@your${s.platform.toLowerCase()}`}
                      placeholderTextColor={Colors.textMuted}
                      autoCapitalize="none"
                      style={styles.input}
                    />
                  </View>
                </View>
              ))}

              {!!saveError && (
                <View style={[styles.errorBanner, { marginTop: 8 }]}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={15} color={Colors.red} />
                  <Text style={styles.errorText}>{saveError}</Text>
                </View>
              )}

              <AnimatedPressable
                style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                scaleDown={0.97}
                onPress={handleSave}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator color={Colors.bg} size="small" />
                  : <Text style={styles.saveBtnText}>SAVE CHANGES</Text>
                }
              </AnimatedPressable>

              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.bg },
  container:   { flex: 1 },
  scroll:      { paddingHorizontal: 16, paddingBottom: 24, paddingTop: 16 },
  centerState: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.red + '15', borderRadius: 10, borderWidth: 1, borderColor: Colors.red + '30', paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 },
  errorText:   { flex: 1, fontFamily: Fonts.regular, fontSize: 12, color: Colors.red },

  hero:        { backgroundColor: Colors.bgCard, borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'flex-start', gap: 14, borderWidth: 1, borderColor: Colors.accent + '20', overflow: 'hidden', marginBottom: 12 },
  heroGlow:    { position: 'absolute', top: -30, left: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.accentGlow },
  logoWrap:    { alignItems: 'center' },
  logoCircle:  { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.accentMuted, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: Colors.accent + '40', overflow: 'hidden' },
  logoImage:   { width: 56, height: 56, borderRadius: 28 },
  heroMicro:   { fontFamily: Fonts.medium, fontSize: 9, color: Colors.accent, letterSpacing: 1.5 },
  heroTitle:   { fontFamily: Fonts.condensedBold, fontSize: 22, color: Colors.text, letterSpacing: 0.3, marginTop: 2 },
  heroTagline: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, fontStyle: 'italic', marginTop: 2 },
  ratingRow:   { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  ratingVal:   { fontFamily: Fonts.bold, fontSize: 12, color: Colors.accent },
  ratingCount: { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted },
  editFab:     { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.accentMuted, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.accent + '30' },

  capacityCard:     { flexDirection: 'row', backgroundColor: Colors.bgCard, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', marginBottom: 20 },
  cardAccentBar:    { width: 3, backgroundColor: Colors.accent },
  capacityInner:    { flex: 1, padding: 14, gap: 8 },
  capacityTop:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  capacityLabel:    { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted, letterSpacing: 1.2 },
  capacityFraction: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted },
  capacityCurrent:  { fontFamily: Fonts.condensedBold, fontSize: 20, color: Colors.text },
  capacityTotal:    { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted },
  trackBg:          { height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden' },
  trackFill:        { height: 6, borderRadius: 3 },
  capacityBottom:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  capacitySub:      { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted },
  capacityStatus:   { fontFamily: Fonts.bold, fontSize: 9, letterSpacing: 0.8 },

  sectionLabel: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted, letterSpacing: 1.8, marginBottom: 10, marginTop: 4 },

  infoCard:      { backgroundColor: Colors.bgCard, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', marginBottom: 20 },
  infoRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  infoIconWrap:  { width: 30, height: 30, borderRadius: 8, backgroundColor: Colors.accentMuted, justifyContent: 'center', alignItems: 'center', marginTop: 1 },
  infoLabel:     { fontFamily: Fonts.bold, fontSize: 8, color: Colors.textMuted, letterSpacing: 1, marginBottom: 2 },
  infoVal:       { fontFamily: Fonts.medium, fontSize: 13, color: Colors.text },

  timingRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12 },
  timingDay:   { fontFamily: Fonts.medium, fontSize: 12, color: Colors.textMuted, flex: 1 },
  timingHours: { fontFamily: Fonts.bold, fontSize: 12, color: Colors.text },

  amenitiesGrid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  amenityChip:          { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.bgCard, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: Colors.accent + '30' },
  amenityInactive:      { borderColor: Colors.border, opacity: 0.5 },
  amenityLabel:         { fontFamily: Fonts.medium, fontSize: 11, color: Colors.text },
  amenityLabelInactive: { color: Colors.textMuted },
  amenityNA:            { fontFamily: Fonts.bold, fontSize: 8, color: Colors.red, letterSpacing: 0.5 },

  socialRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.bgCard, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: Colors.border, marginBottom: 8 },
  socialIconWrap: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  socialPlatform: { fontFamily: Fonts.bold, fontSize: 12, color: Colors.text },
  socialHandle:   { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  socialEmpty:    { alignItems: 'center', gap: 8, paddingVertical: 20, backgroundColor: Colors.bgCard, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 20 },
  socialEmptyText: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted },

  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop:     { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet:        { height: '85%', backgroundColor: Colors.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 12 },
  handle:       { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: 20 },
  modalHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle:   { fontFamily: Fonts.condensedBold, fontSize: 20, color: Colors.text, letterSpacing: 0.5 },
  closeBtn:     { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.bgElevated, justifyContent: 'center', alignItems: 'center' },

  logoPicker:            { width: 90, height: 90, borderRadius: 20, overflow: 'hidden', marginBottom: 20, alignSelf: 'center' },
  logoPickerImage:       { width: 90, height: 90 },
  logoPickerPlaceholder: { width: 90, height: 90, backgroundColor: Colors.accentMuted, justifyContent: 'center', alignItems: 'center' },
  logoPickerOverlay:     { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', gap: 4 },
  logoPickerText:        { fontFamily: Fonts.bold, fontSize: 8, color: '#fff', letterSpacing: 1 },

  fieldWrap:      { marginBottom: 14 },
  fieldLabel:     { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted, letterSpacing: 1.2, marginBottom: 6 },
  input:          { backgroundColor: Colors.bgElevated, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 12, fontFamily: Fonts.regular, fontSize: 14, color: Colors.text },
  inputMultiline: { height: 80, textAlignVertical: 'top' },

  sectionLabelModal: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted, letterSpacing: 1.8, marginBottom: 10, marginTop: 4 },

  socialEditRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  socialEditIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 22 },

  saveBtn:     { backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', height: 48, marginTop: 8 },
  saveBtnText: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.bg, letterSpacing: 1.2 },
});
