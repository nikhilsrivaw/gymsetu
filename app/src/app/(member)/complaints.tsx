import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput as RNTextInput,
  ActivityIndicator, Pressable, Modal, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Stack, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import FadeInView from '@/components/FadeInView';
import AnimatedPressable from '@/components/AnimatedPressable';

const CATEGORIES = [
  { id: 'equipment',   label: 'Equipment',   emoji: '🏋️' },
  { id: 'cleanliness', label: 'Safai',       emoji: '🧹' },
  { id: 'staff',       label: 'Staff',       emoji: '👥' },
  { id: 'crowding',    label: 'Bheed',       emoji: '🚶' },
  { id: 'facilities',  label: 'Facilities',  emoji: '🚿' },
  { id: 'billing',     label: 'Billing',     emoji: '💳' },
  { id: 'other',       label: 'Other',       emoji: '💬' },
];

const STATUS = {
  open:        { label: 'OPEN',        color: Colors.orange },
  in_progress: { label: 'IN PROGRESS', color: '#3B82F6' },
  resolved:    { label: 'RESOLVED',    color: Colors.green },
} as const;

interface Complaint {
  id: string; category: string; subject: string; description: string | null;
  status: keyof typeof STATUS; response: string | null; created_at: string;
}

export default function MemberComplaintsScreen() {
  const { profile } = useAuthStore();
  const [items, setItems]     = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen]       = useState(false);
  const [cat, setCat]         = useState('equipment');
  const [subject, setSubject] = useState('');
  const [desc, setDesc]       = useState('');
  const [saving, setSaving]   = useState(false);
  const [err, setErr]         = useState('');

  const fetchItems = useCallback(async () => {
    if (!profile?.id) { setLoading(false); return; }
    setLoading(true);
    // RLS already restricts to this member's own rows.
    const { data } = await supabase.from('complaints')
      .select('id, category, subject, description, status, response, created_at')
      .order('created_at', { ascending: false });
    setItems((data ?? []) as Complaint[]);
    setLoading(false);
  }, [profile?.id]);

  useFocusEffect(useCallback(() => { fetchItems(); }, [fetchItems]));

  const submit = async () => {
    setErr('');
    if (!subject.trim()) { setErr('Kya problem hai, chhota sa title likhiye.'); return; }
    if (!profile?.id || !profile?.gym_id) { setErr('Profile load nahi hua. Dobara try karein.'); return; }
    setSaving(true);
    const { error } = await supabase.from('complaints').insert({
      gym_id: profile.gym_id,
      member_id: profile.id,
      category: cat,
      subject: subject.trim(),
      description: desc.trim() || null,
    });
    setSaving(false);
    if (error) { setErr(error.message); return; }
    setOpen(false); setSubject(''); setDesc(''); setCat('equipment');
    fetchItems();
    Alert.alert('Bhej diya ✅', 'Aapki complaint gym tak pahunch gayi hai. Jawab yahin dikhega.');
  };

  const openCount = items.filter(i => i.status !== 'resolved').length;

  if (loading) return (
    <>
      <Stack.Screen options={{ title: 'Complaints' }} />
      <View style={s.center}><ActivityIndicator color={Colors.accent} /></View>
    </>
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Complaints' }} />
      <View style={s.container}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <Text style={s.eyebrow}>APKI AAWAAZ</Text>
          <Text style={s.headline}>Koi problem hai?{'\n'}Gym ko bataiye</Text>
          <Text style={s.sub}>
            Equipment, safai, staff — kuch bhi. Aapki complaint sirf gym owner dekhta hai, doosre members nahi.
          </Text>

          <AnimatedPressable style={s.newBtn} scaleDown={0.97} onPress={() => setOpen(true)}>
            <MaterialCommunityIcons name="plus" size={18} color="#fff" />
            <Text style={s.newBtnText}>Nayi complaint likhein</Text>
          </AnimatedPressable>

          {items.length > 0 && (
            <Text style={s.listLabel}>
              AAPKI COMPLAINTS ({items.length}{openCount > 0 ? ` · ${openCount} open` : ''})
            </Text>
          )}

          {items.length === 0 ? (
            <FadeInView delay={60}>
              <View style={s.emptyCard}>
                <Text style={s.emptyEmoji}>💬</Text>
                <Text style={s.emptyTitle}>Abhi koi complaint nahi</Text>
                <Text style={s.emptyDesc}>Kuch theek nahi lag raha? Upar button dabakar bata dijiye — gym dekh lega.</Text>
              </View>
            </FadeInView>
          ) : items.map((c, i) => {
            const st  = STATUS[c.status] ?? STATUS.open;
            const cObj = CATEGORIES.find(x => x.id === c.category) ?? CATEGORIES[CATEGORIES.length - 1];
            return (
              <FadeInView key={c.id} delay={i * 40}>
                <View style={[s.card, { borderLeftColor: st.color }]}>
                  <View style={s.cardTop}>
                    <View style={s.catBubble}>
                      <Text style={s.cardEmoji}>{cObj.emoji}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.cardSubject}>{c.subject}</Text>
                      <Text style={s.cardMeta}>
                        {cObj.label} · {new Date(c.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </Text>
                    </View>
                    <View style={[s.badge, { backgroundColor: st.color + '18', borderColor: st.color + '45' }]}>
                      <Text style={[s.badgeText, { color: st.color }]}>{st.label}</Text>
                    </View>
                  </View>

                  {!!c.description && <Text style={s.cardDesc}>{c.description}</Text>}

                  {c.response ? (
                    <View style={s.replyBox}>
                      <View style={s.replyHead}>
                        <MaterialCommunityIcons name="reply" size={13} color={Colors.green} />
                        <Text style={s.replyLabel}>GYM KA JAWAB</Text>
                      </View>
                      <Text style={s.replyText}>{c.response}</Text>
                    </View>
                  ) : c.status !== 'resolved' ? (
                    <View style={s.waitingRow}>
                      <MaterialCommunityIcons name="clock-outline" size={12} color={Colors.textMuted} />
                      <Text style={s.waitingText}>Gym ke jawab ka intezaar</Text>
                    </View>
                  ) : null}
                </View>
              </FadeInView>
            );
          })}

          <View style={{ height: 30 }} />
        </ScrollView>
      </View>

      {/* New complaint sheet */}
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.modalWrap}>
          <Pressable style={s.backdrop} onPress={() => setOpen(false)} />
          <View style={s.sheet}>
            <View style={s.sheetHead}>
              <Text style={s.sheetTitle}>NAYI COMPLAINT</Text>
              <Pressable onPress={() => setOpen(false)}><Text style={s.closeX}>✕</Text></Pressable>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text style={s.fieldLbl}>KIS BAARE MEIN?</Text>
              <View style={s.catWrap}>
                {CATEGORIES.map(c => {
                  const on = cat === c.id;
                  return (
                    <Pressable key={c.id} style={[s.catChip, on && s.catChipOn]} onPress={() => setCat(c.id)}>
                      <Text style={s.catEmoji}>{c.emoji}</Text>
                      <Text style={[s.catText, on && s.catTextOn]}>{c.label}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={s.fieldLbl}>PROBLEM KYA HAI?</Text>
              <RNTextInput
                style={s.input}
                value={subject}
                onChangeText={t => { setSubject(t); setErr(''); }}
                placeholder="e.g. Treadmill number 3 band hai"
                placeholderTextColor={Colors.textMuted}
              />

              <Text style={s.fieldLbl}>DETAIL (OPTIONAL)</Text>
              <RNTextInput
                style={[s.input, s.textarea]}
                value={desc}
                onChangeText={setDesc}
                placeholder="Thoda detail mein bataiye…"
                placeholderTextColor={Colors.textMuted}
                multiline
                textAlignVertical="top"
              />

              {!!err && <Text style={s.errText}>{err}</Text>}

              <AnimatedPressable style={[s.submitBtn, saving && { opacity: 0.5 }]} scaleDown={0.97}
                onPress={submit} disabled={saving}>
                {saving ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={s.submitText}>COMPLAINT BHEJEIN</Text>}
              </AnimatedPressable>
              <View style={{ height: 10 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center:    { flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center' },
  scroll:    { padding: 20 },

  eyebrow:  { fontFamily: Fonts.bold, fontSize: 10, color: Colors.accent, letterSpacing: 1.6 },
  headline: { fontFamily: Fonts.condensedBold, fontSize: 28, color: Colors.text, marginTop: 8, lineHeight: 31 },
  sub:      { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, marginTop: 8, lineHeight: 20 },

  newBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.accent, borderRadius: 14, paddingVertical: 15, marginTop: 20 },
  newBtnText: { fontFamily: Fonts.bold, fontSize: 14, color: '#fff' },

  listLabel: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted, letterSpacing: 1.4, marginTop: 26, marginBottom: 12 },

  card:       { backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, borderLeftWidth: 3, padding: 15, marginBottom: 11 },
  cardTop:    { flexDirection: 'row', alignItems: 'center', gap: 11 },
  catBubble:  { width: 38, height: 38, borderRadius: 12, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' },
  cardEmoji:  { fontSize: 19 },
  cardSubject:{ fontFamily: Fonts.bold, fontSize: 15, color: Colors.text, lineHeight: 20 },
  cardMeta:   { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  badge:      { borderWidth: 1, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4 },
  badgeText:  { fontFamily: Fonts.bold, fontSize: 8, letterSpacing: 0.7 },
  cardDesc:   { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, marginTop: 11, lineHeight: 19 },

  replyBox:   { backgroundColor: Colors.green + '12', borderRadius: 12, padding: 13, marginTop: 13 },
  replyHead:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  replyLabel: { fontFamily: Fonts.bold, fontSize: 8.5, color: Colors.green, letterSpacing: 1.2 },
  replyText:  { fontFamily: Fonts.regular, fontSize: 13.5, color: Colors.text, marginTop: 7, lineHeight: 20 },
  waitingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 13, paddingTop: 11, borderTopWidth: 1, borderTopColor: Colors.border },
  waitingText:{ fontFamily: Fonts.regular, fontSize: 11.5, color: Colors.textMuted },

  emptyCard:  { backgroundColor: Colors.bgCard, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, padding: 26, alignItems: 'center', marginTop: 26 },
  emptyEmoji: { fontSize: 34 },
  emptyTitle: { fontFamily: Fonts.bold, fontSize: 15, color: Colors.text, marginTop: 12 },
  emptyDesc:  { fontFamily: Fonts.regular, fontSize: 12.5, color: Colors.textMuted, marginTop: 6, textAlign: 'center', lineHeight: 19 },

  modalWrap: { flex: 1, justifyContent: 'flex-end' },
  backdrop:  { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.72)' },
  sheet:     { backgroundColor: Colors.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 30, maxHeight: '88%', borderWidth: 1, borderColor: Colors.border },
  sheetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sheetTitle:{ fontFamily: Fonts.condensedBold, fontSize: 18, color: Colors.text, letterSpacing: 0.5 },
  closeX:    { fontFamily: Fonts.bold, fontSize: 18, color: Colors.textMuted, paddingHorizontal: 6 },

  fieldLbl: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted, letterSpacing: 1.2, marginBottom: 9, marginTop: 6 },
  catWrap:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  catChip:  { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bg, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8 },
  catChipOn:{ borderColor: Colors.accent + '70', backgroundColor: Colors.accentMuted },
  catEmoji: { fontSize: 13 },
  catText:  { fontFamily: Fonts.bold, fontSize: 12, color: Colors.textMuted },
  catTextOn:{ color: Colors.accent },

  input:    { backgroundColor: Colors.bgElevated, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontFamily: Fonts.regular, fontSize: 15, color: Colors.text, marginBottom: 6 },
  textarea: { minHeight: 96 },
  errText:  { fontFamily: Fonts.regular, fontSize: 12, color: Colors.red, marginTop: 8 },

  submitBtn:  { backgroundColor: Colors.accent, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 18 },
  submitText: { fontFamily: Fonts.bold, fontSize: 14, color: '#fff', letterSpacing: 1 },
});
