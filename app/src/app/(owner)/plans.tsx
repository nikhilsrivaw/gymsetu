import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, Alert, ActivityIndicator,
  Modal, TextInput as RNTextInput, ScrollView,
  Pressable, KeyboardAvoidingView, Platform,
} from 'react-native';
import { FAB } from 'react-native-paper';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useFocusEffect } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import AnimatedPressable from '@/components/AnimatedPressable';
import FadeInView from '@/components/FadeInView';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import type { MembershipPlan } from '@/types/database';
import LottieView from 'lottie-react-native';

const planColors = [Colors.accent, Colors.green, '#4F6EF7', Colors.orange, '#EC4899'];

const DURATION_PRESETS = [
  { label: '1 Mo',  days: 30  },
  { label: '2 Mo',  days: 60  },
  { label: '3 Mo',  days: 90  },
  { label: '6 Mo',  days: 180 },
  { label: '1 Yr',  days: 365 },
];

const fmtDur = (d: number) =>
  d >= 365 ? `${Math.round(d / 365)} yr`
  : d >= 30 ? `${Math.round(d / 30)} mo`
  : `${d} day`;

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

// ── Custom field ─────────────────────────────────────────────────
function Field({
  icon, label, value, onChange, required, prefix, ...rest
}: {
  icon: IconName; label: string; value: string;
  onChange: (v: string) => void; required?: boolean;
  prefix?: string; [k: string]: any;
}) {
  const [focused, setFocused] = useState(false);
  return (
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
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {prefix ? <Text style={f.prefix}>{prefix}</Text> : null}
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
  icon:   { width: 20, textAlign: 'center' },
  col:    { flex: 1 },
  lbl:    { fontFamily: Fonts.bold, fontSize: 8, color: Colors.textMuted, letterSpacing: 1.4, marginBottom: 4 },
  lblFocused: { color: Colors.accent },
  prefix: { fontFamily: Fonts.bold, fontSize: 15, color: Colors.textMuted, marginRight: 2 },
  inp:    { fontFamily: Fonts.regular, fontSize: 14, color: Colors.text, padding: 0, flex: 1 },
});

export default function PlansScreen() {
  const { profile, activeGymId, branches } = useAuthStore();

  const [plans, setPlans]         = useState<(MembershipPlan & { member_count?: number })[]>([]);
  const [loading, setLoading]     = useState(true);
  const [show, setShow]           = useState(false);
  const [name, setName]           = useState('');
  const [dur, setDur]             = useState('');
  const [price, setPrice]         = useState('');
  const [desc, setDesc]           = useState('');
  const [saving, setSaving]       = useState(false);
  const [formError, setFormError] = useState('');

  const getGymIds = useCallback((): string[] => {
    const mainGymId = profile?.gym_id;
    if (!mainGymId) return [];
    if (activeGymId === 'all') return branches.length > 0 ? branches.map(b => b.id) : [mainGymId];
    return [activeGymId ?? mainGymId];
  }, [activeGymId, branches, profile?.gym_id]);

  const fetchPlans = useCallback(async () => {
    const gymIds = getGymIds();
    if (gymIds.length === 0) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('membership_plans')
        .select('*')
        .in('gym_id', gymIds)
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (!data) { setPlans([]); return; }

      const planIds = data.map(p => p.id);
      const countMap: Record<string, number> = {};
      if (planIds.length > 0) {
        const { data: mpData } = await supabase
          .from('member_plans').select('plan_id').in('plan_id', planIds);
        (mpData ?? []).forEach((mp: any) => {
          countMap[mp.plan_id] = (countMap[mp.plan_id] || 0) + 1;
        });
      }
      setPlans(data.map(p => ({ ...p, member_count: countMap[p.id] ?? 0 })));
    } catch (err) {
      console.error('[Plans] fetchPlans error:', err);
    } finally {
      setLoading(false);
    }
  }, [getGymIds]);

  useFocusEffect(useCallback(() => { fetchPlans(); }, [fetchPlans]));

  const handleSave = async () => {
    setFormError('');
    if (!name.trim()) { setFormError('Plan name is required.'); return; }
    const parsedDur   = parseInt(dur, 10);
    const parsedPrice = parseFloat(price);
    if (!dur.trim() || isNaN(parsedDur) || parsedDur <= 0) {
      setFormError('Enter a valid duration in days (e.g. 30).'); return;
    }
    if (!price.trim() || isNaN(parsedPrice) || parsedPrice <= 0) {
      setFormError('Enter a valid price greater than 0.'); return;
    }
    const mainGymId = profile?.gym_id;
    const gymId = activeGymId === 'all' ? mainGymId : (activeGymId ?? mainGymId);
    if (!gymId) { setFormError('Gym not found. Try again.'); return; }

    setSaving(true);
    try {
      const { error } = await supabase.from('membership_plans').insert({
        gym_id: gymId, name: name.trim(),
        duration_days: parsedDur,
        price: parsedPrice,
        description: desc.trim() || null,
        is_active: true,
      });
      if (error) throw error;
      setShow(false);
      setName(''); setDur(''); setPrice(''); setDesc('');
      fetchPlans();
    } catch (err: any) {
      setFormError(err.message ?? 'Could not create plan. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const closeModal = () => { setShow(false); setFormError(''); };

  const toggleActive = async (plan: MembershipPlan) => {
    try {
      const { error } = await supabase
        .from('membership_plans').update({ is_active: !plan.is_active }).eq('id', plan.id);
      if (error) throw error;
      fetchPlans();
    } catch {
      Alert.alert('Error', 'Could not update plan status.');
    }
  };

  // Live preview values
  const previewPrice = parseFloat(price) || 0;
  const previewDur   = parseInt(dur, 10) || 0;

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Plans' }} />
        <View style={s.loadingContainer}>
          <LottieView
            source={require('@/assets/animations/Turkey Power Walk.json')}
            autoPlay loop style={s.loadingLottie}
          />
          <Text style={s.loadingTitle}>LOADING PLANS</Text>
          <Text style={s.loadingSubtitle}>Building your plan library...</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Plans' }} />
      <View style={s.container}>

        {/* ── Stats Strip ── */}
        <FadeInView delay={0}>
          <View style={s.strip}>
            {[
              { val: plans.length,                                          label: 'TOTAL',    color: Colors.text    },
              { val: plans.filter(p => p.is_active).length,                label: 'ACTIVE',   color: Colors.green   },
              { val: plans.reduce((a, p) => a + (p.member_count || 0), 0), label: 'ASSIGNED', color: Colors.accent  },
            ].map((item, i) => (
              <View key={i} style={{ flex: 1, alignItems: 'center', gap: 3 }}>
                <Text style={[s.stripVal, { color: item.color }]}>{item.val}</Text>
                <Text style={s.stripLabel}>{item.label}</Text>
                {i < 2 && <View style={s.stripDivider} />}
              </View>
            ))}
          </View>
        </FadeInView>

        {/* ── List / Empty ── */}
        {plans.length === 0 ? (
          <FadeInView delay={100} style={s.empty}>
            <Text style={s.emptyEmoji}>📋</Text>
            <Text style={s.emptyTitle}>No plans yet</Text>
            <Text style={s.emptyDesc}>Tap + to create your first membership plan</Text>
          </FadeInView>
        ) : (
          <FlatList
            data={plans}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.list}
            renderItem={({ item, index }) => {
              const color = planColors[index % planColors.length];
              return (
                <FadeInView delay={index * 55}>
                  <TouchableOpacity
                    style={s.planCard}
                    activeOpacity={0.85}
                    onLongPress={() =>
                      Alert.alert(
                        item.is_active ? 'Deactivate Plan?' : 'Activate Plan?',
                        `"${item.name}" will be ${item.is_active ? 'hidden from new assignments' : 'available again'}.`,
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: item.is_active ? 'Deactivate' : 'Activate', onPress: () => toggleActive(item) },
                        ]
                      )
                    }
                  >
                    <LinearGradient
                      colors={[color + '12', 'transparent']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFill} pointerEvents="none"
                    />
                    <View style={[s.planBar, { backgroundColor: color }]} />
                    <View style={s.planInner}>
                      <View style={s.planTop}>
                        <View style={{ flex: 1 }}>
                          <Text style={s.planName}>{item.name}</Text>
                          {item.description
                            ? <Text style={s.planDesc} numberOfLines={1}>{item.description}</Text>
                            : null}
                        </View>
                        <Text style={[s.planPrice, { color }]}>
                          ₹{item.price.toLocaleString('en-IN')}
                        </Text>
                      </View>
                      <View style={s.planChips}>
                        <View style={[s.chip, { backgroundColor: color + '18', borderColor: color + '30' }]}>
                          <MaterialCommunityIcons name="clock-outline" size={10} color={color} />
                          <Text style={[s.chipText, { color }]}>{fmtDur(item.duration_days)}</Text>
                        </View>
                        {(item.member_count ?? 0) > 0 && (
                          <View style={[s.chip, { backgroundColor: Colors.blueMuted, borderColor: Colors.blue + '30' }]}>
                            <MaterialCommunityIcons name="account-group-outline" size={10} color={Colors.blue} />
                            <Text style={[s.chipText, { color: Colors.blue }]}>{item.member_count} assigned</Text>
                          </View>
                        )}
                        <View style={[s.chip, {
                          backgroundColor: item.is_active ? Colors.greenMuted : Colors.redMuted,
                          borderColor: (item.is_active ? Colors.green : Colors.red) + '30',
                        }]}>
                          <View style={[s.chipDot, { backgroundColor: item.is_active ? Colors.green : Colors.red }]} />
                          <Text style={[s.chipText, { color: item.is_active ? Colors.green : Colors.red }]}>
                            {item.is_active ? 'ACTIVE' : 'INACTIVE'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                </FadeInView>
              );
            }}
          />
        )}

        <FAB icon="plus" style={s.fab} onPress={() => setShow(true)} color="#FFF" customSize={56} />

        {/* ── New Plan Modal ── */}
        <Modal visible={show} transparent animationType="slide" onRequestClose={closeModal}>
          <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} />
          <Pressable style={s.backdrop} onPress={closeModal} />

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={s.sheetWrap}
          >
            <View style={s.sheet}>
              {/* Top handle */}
              <View style={s.handle} />

              {/* Header */}
              <View style={s.sheetHeader}>
                <View style={s.sheetIconBox}>
                  <MaterialCommunityIcons name="card-account-details-outline" size={18} color={Colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.sheetTitle}>NEW PLAN</Text>
                  <Text style={s.sheetSub}>Define name, duration & price</Text>
                </View>
                <Pressable onPress={closeModal} style={s.closeBtn}>
                  <MaterialCommunityIcons name="close" size={18} color={Colors.textMuted} />
                </Pressable>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={s.sheetScroll}
              >

                {/* ── Live Preview ── */}
                {(name.trim() || previewPrice > 0 || previewDur > 0) && (
                  <View style={s.preview}>
                    <LinearGradient
                      colors={[Colors.accent + '14', 'transparent']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFill} pointerEvents="none"
                    />
                    <View style={[s.previewBar]} />
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={s.previewName} numberOfLines={1}>
                        {name.trim() || 'Plan Name'}
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        {previewDur > 0 && (
                          <View style={s.previewChip}>
                            <Text style={s.previewChipText}>{fmtDur(previewDur)}</Text>
                          </View>
                        )}
                        <View style={s.previewChip}>
                          <Text style={s.previewChipText}>NEW</Text>
                        </View>
                      </View>
                    </View>
                    <Text style={s.previewPrice}>
                      {previewPrice > 0 ? `₹${previewPrice.toLocaleString('en-IN')}` : '₹—'}
                    </Text>
                  </View>
                )}

                {/* ── Fields ── */}
                <View style={s.fields}>
                  <Field
                    icon="tag-outline"
                    label="PLAN NAME"
                    required
                    value={name}
                    onChange={(v) => { setName(v); setFormError(''); }}
                    placeholder="e.g. Monthly Basic"
                  />

                  {/* Duration with quick picks */}
                  <View style={s.durBlock}>
                    <Field
                      icon="clock-outline"
                      label="DURATION (DAYS)"
                      required
                      value={dur}
                      onChange={(v) => { setDur(v); setFormError(''); }}
                      keyboardType="numeric"
                      placeholder="e.g. 30"
                    />
                    <View style={s.presets}>
                      {DURATION_PRESETS.map(p => (
                        <Pressable
                          key={p.days}
                          style={[s.preset, dur === String(p.days) && s.presetActive]}
                          onPress={() => { setDur(String(p.days)); setFormError(''); }}
                        >
                          <Text style={[s.presetText, dur === String(p.days) && s.presetTextActive]}>
                            {p.label}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  <Field
                    icon="currency-inr"
                    label="PRICE"
                    required
                    value={price}
                    onChange={(v) => { setPrice(v); setFormError(''); }}
                    keyboardType="numeric"
                    placeholder="e.g. 999"
                    prefix="₹"
                  />

                  <Field
                    icon="text-box-outline"
                    label="DESCRIPTION (OPTIONAL)"
                    value={desc}
                    onChange={setDesc}
                    placeholder="What's included in this plan?"
                    multiline
                    numberOfLines={2}
                  />
                </View>

                {/* ── Error ── */}
                {!!formError && (
                  <View style={s.errorBox}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={14} color={Colors.red} />
                    <Text style={s.errorText}>{formError}</Text>
                  </View>
                )}

                {/* ── Create Button ── */}
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
                        <MaterialCommunityIcons name="check-circle-outline" size={18} color="#fff" />
                        <Text style={s.createBtnText}>CREATE PLAN</Text>
                      </>
                    )}
                  </LinearGradient>
                </AnimatedPressable>

                <View style={{ height: 8 }} />
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </>
  );
}

const s = StyleSheet.create({
  loadingContainer: { flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' },
  loadingLottie:    { width: 200, height: 200 },
  loadingTitle:     { fontFamily: Fonts.condensedBold, fontSize: 16, color: Colors.text, letterSpacing: 3, marginTop: 8 },
  loadingSubtitle:  { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, marginTop: 4 },

  container: { flex: 1, backgroundColor: Colors.bg },

  strip:        { flexDirection: 'row', margin: 16, backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, padding: 16 },
  stripVal:     { fontFamily: Fonts.condensedBold, fontSize: 26, color: Colors.text },
  stripLabel:   { fontFamily: Fonts.bold, fontSize: 8, color: Colors.textMuted, letterSpacing: 1.2 },
  stripDivider: { position: 'absolute', right: 0, top: 6, bottom: 6, width: 1, backgroundColor: Colors.border },

  list:      { paddingHorizontal: 16, gap: 10, paddingBottom: 90 },
  planCard:  { flexDirection: 'row', backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  planBar:   { width: 3 },
  planInner: { flex: 1, padding: 14, gap: 8 },
  planTop:   { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  planName:  { fontFamily: Fonts.bold, fontSize: 15, color: Colors.text },
  planPrice: { fontFamily: Fonts.condensedBold, fontSize: 22 },
  planDesc:  { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  planChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip:      { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: Colors.bgElevated, borderWidth: 1, borderColor: Colors.border },
  chipDot:   { width: 5, height: 5, borderRadius: 3 },
  chipText:  { fontFamily: Fonts.bold, fontSize: 8, color: Colors.textMuted, letterSpacing: 0.5 },

  empty:      { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 60 },
  emptyEmoji: { fontSize: 44, marginBottom: 12 },
  emptyTitle: { fontFamily: Fonts.bold, fontSize: 16, color: Colors.text },
  emptyDesc:  { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, marginTop: 6, textAlign: 'center', paddingHorizontal: 40 },

  fab: { position: 'absolute', right: 20, bottom: 20, backgroundColor: Colors.accent, borderRadius: 16 },

  // ── Modal / Sheet ─────────────────────────────────────────────
  backdrop:  { ...StyleSheet.absoluteFillObject },
  sheetWrap: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    borderWidth: 1, borderColor: Colors.glassBorder,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'center', marginTop: 12, marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  sheetIconBox: {
    width: 36, height: 36, borderRadius: 11,
    backgroundColor: Colors.accentMuted,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.accent + '30',
  },
  sheetTitle:   { fontFamily: Fonts.condensedBold, fontSize: 20, color: Colors.text, letterSpacing: 0.5 },
  sheetSub:     { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted },
  closeBtn:     { width: 32, height: 32, borderRadius: 10, backgroundColor: Colors.bgElevated, justifyContent: 'center', alignItems: 'center' },
  sheetScroll:  { padding: 20, gap: 16 },

  // ── Live preview ─────────────────────────────────────────────
  preview: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.bgElevated,
    borderRadius: 16, borderWidth: 1, borderColor: Colors.accent + '30',
    padding: 14, overflow: 'hidden',
  },
  previewBar:       { width: 3, alignSelf: 'stretch', backgroundColor: Colors.accent, borderRadius: 2 },
  previewName:      { fontFamily: Fonts.bold, fontSize: 14, color: Colors.text },
  previewChip:      { backgroundColor: Colors.accentMuted, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  previewChipText:  { fontFamily: Fonts.bold, fontSize: 9, color: Colors.accent, letterSpacing: 0.5 },
  previewPrice:     { fontFamily: Fonts.condensedBold, fontSize: 22, color: Colors.accent },

  // ── Fields ───────────────────────────────────────────────────
  fields:  { gap: 12 },
  durBlock: { gap: 8 },
  presets: { flexDirection: 'row', gap: 6 },
  preset:  {
    flex: 1, alignItems: 'center', paddingVertical: 8,
    borderRadius: 10, borderWidth: 1,
    borderColor: Colors.border, backgroundColor: Colors.bgElevated,
  },
  presetActive:     { borderColor: Colors.accent + '60', backgroundColor: Colors.accentMuted },
  presetText:       { fontFamily: Fonts.bold, fontSize: 10, color: Colors.textMuted },
  presetTextActive: { color: Colors.accent },

  // ── Error ────────────────────────────────────────────────────
  errorBox:  {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.red + '14', borderRadius: 12,
    borderWidth: 1, borderColor: Colors.red + '30',
    paddingHorizontal: 14, paddingVertical: 10,
  },
  errorText: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.red, flex: 1 },

  // ── Create button ────────────────────────────────────────────
  createPressable: { marginTop: 4 },
  createBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 16, paddingVertical: 17, minHeight: 56 },
  createBtnText:   { fontFamily: Fonts.bold, fontSize: 14, color: '#fff', letterSpacing: 2 },
});
