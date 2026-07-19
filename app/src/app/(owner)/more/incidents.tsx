import { useState, useCallback, useMemo } from 'react';
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

const CATEGORIES: Record<string, { label: string; emoji: string }> = {
  equipment:   { label: 'Equipment',   emoji: '🏋️' },
  cleanliness: { label: 'Cleanliness', emoji: '🧹' },
  staff:       { label: 'Staff',       emoji: '👥' },
  crowding:    { label: 'Crowding',    emoji: '🚶' },
  facilities:  { label: 'Facilities',  emoji: '🚿' },
  billing:     { label: 'Billing',     emoji: '💳' },
  other:       { label: 'Other',       emoji: '💬' },
};

const STATUS = {
  open:        { label: 'OPEN',        color: Colors.orange },
  in_progress: { label: 'IN PROGRESS', color: '#3B82F6' },
  resolved:    { label: 'RESOLVED',    color: Colors.green },
} as const;
type StatusKey = keyof typeof STATUS;

interface Complaint {
  id: string; category: string; subject: string; description: string | null;
  status: StatusKey; response: string | null; created_at: string;
  member_id: string; member_name: string;
}

export default function ComplaintsScreen() {
  const { profile, activeGymId, branches } = useAuthStore();
  const [items, setItems]   = useState<Complaint[]>([]);
  const [loading, setLoad]  = useState(true);
  const [filter, setFilter] = useState<'all' | StatusKey>('all');

  const [sel, setSel]         = useState<Complaint | null>(null);
  const [reply, setReply]     = useState('');
  const [saving, setSaving]   = useState(false);

  const getGymIds = useCallback((): string[] => {
    const main = (profile as any)?.gym_id;
    if (!main) return [];
    if (activeGymId === 'all') return branches.length > 0 ? branches.map(b => b.id) : [main];
    return [activeGymId ?? main];
  }, [profile, activeGymId, branches]);

  const fetchItems = useCallback(async () => {
    const gymIds = getGymIds();
    if (gymIds.length === 0) { setLoad(false); return; }
    setLoad(true);
    const { data } = await supabase.from('complaints')
      .select('id, category, subject, description, status, response, created_at, member_id, profiles(full_name)')
      .in('gym_id', gymIds)
      .order('created_at', { ascending: false });
    setItems((data ?? []).map((c: any) => ({
      ...c,
      member_name: Array.isArray(c.profiles) ? c.profiles[0]?.full_name : c.profiles?.full_name ?? 'Member',
    })) as Complaint[]);
    setLoad(false);
  }, [getGymIds]);

  useFocusEffect(useCallback(() => { fetchItems(); }, [fetchItems]));

  const counts = useMemo(() => ({
    all: items.length,
    open: items.filter(i => i.status === 'open').length,
    in_progress: items.filter(i => i.status === 'in_progress').length,
    resolved: items.filter(i => i.status === 'resolved').length,
  }), [items]);

  const shown = filter === 'all' ? items : items.filter(i => i.status === filter);

  const openDetail = (c: Complaint) => { setSel(c); setReply(c.response ?? ''); };

  const setStatus = async (status: StatusKey) => {
    if (!sel) return;
    setSaving(true);
    const patch: any = { status, response: reply.trim() || null };
    if (status === 'resolved') {
      patch.resolved_at = new Date().toISOString();
      patch.resolved_by = profile?.id ?? null;
    } else {
      patch.resolved_at = null; patch.resolved_by = null;
    }
    const { error } = await supabase.from('complaints').update(patch).eq('id', sel.id);
    setSaving(false);
    if (error) { Alert.alert('Error', error.message); return; }
    setSel(null); setReply('');
    fetchItems();
  };

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
        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
          {([['all', 'All'], ['open', 'Open'], ['in_progress', 'In progress'], ['resolved', 'Resolved']] as const).map(([k, label]) => {
            const on = filter === k;
            const c  = k === 'all' ? Colors.accent : STATUS[k as StatusKey].color;
            return (
              <Pressable key={k} style={[s.filterChip, on && { borderColor: c + '70', backgroundColor: c + '18' }]}
                onPress={() => setFilter(k as any)}>
                <Text style={[s.filterText, on && { color: c }]}>{label} · {counts[k as keyof typeof counts]}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          {shown.length === 0 ? (
            <FadeInView delay={50}>
              <View style={s.emptyCard}>
                <View style={s.emptyIcon}>
                  <MaterialCommunityIcons name="message-alert-outline" size={26} color={Colors.accent} />
                </View>
                <Text style={s.emptyTitle}>
                  {items.length === 0 ? 'No complaints yet' : `No ${filter.replace('_', ' ')} complaints`}
                </Text>
                <Text style={s.emptyDesc}>
                  {items.length === 0
                    ? 'Members can raise complaints from their app — equipment, cleanliness, staff and more. They\'ll appear here for you to respond.'
                    : 'Nothing in this filter right now.'}
                </Text>
              </View>
            </FadeInView>
          ) : shown.map((c, i) => {
            const st   = STATUS[c.status] ?? STATUS.open;
            const cObj = CATEGORIES[c.category] ?? CATEGORIES.other;
            return (
              <FadeInView key={c.id} delay={i * 35}>
                <Pressable style={[s.card, { borderLeftColor: st.color, borderLeftWidth: 3 }]} onPress={() => openDetail(c)}>
                  <View style={s.cardTop}>
                    <Text style={s.cardEmoji}>{cObj.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={s.cardSubject} numberOfLines={1}>{c.subject}</Text>
                      <Text style={s.cardMeta}>
                        {c.member_name} · {cObj.label} · {new Date(c.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </Text>
                    </View>
                    <View style={[s.badge, { backgroundColor: st.color + '18', borderColor: st.color + '45' }]}>
                      <Text style={[s.badgeText, { color: st.color }]}>{st.label}</Text>
                    </View>
                  </View>
                  {!!c.description && <Text style={s.cardDesc} numberOfLines={2}>{c.description}</Text>}
                  {!!c.response && (
                    <View style={s.repliedRow}>
                      <MaterialCommunityIcons name="reply" size={12} color={Colors.green} />
                      <Text style={s.repliedText} numberOfLines={1}>Replied: {c.response}</Text>
                    </View>
                  )}
                </Pressable>
              </FadeInView>
            );
          })}
          <View style={{ height: 30 }} />
        </ScrollView>
      </View>

      {/* Detail / respond sheet */}
      <Modal visible={!!sel} transparent animationType="slide" onRequestClose={() => setSel(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.modalWrap}>
          <Pressable style={s.backdrop} onPress={() => setSel(null)} />
          <View style={s.sheet}>
            <View style={s.sheetHead}>
              <View style={{ flex: 1 }}>
                <Text style={s.sheetEyebrow}>
                  {(CATEGORIES[sel?.category ?? 'other'] ?? CATEGORIES.other).label.toUpperCase()} · {sel?.member_name}
                </Text>
                <Text style={s.sheetTitle}>{sel?.subject}</Text>
              </View>
              <Pressable onPress={() => setSel(null)}><Text style={s.closeX}>✕</Text></Pressable>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {!!sel?.description && (
                <View style={s.quoteBox}><Text style={s.quoteText}>{sel.description}</Text></View>
              )}

              <Text style={s.fieldLbl}>YOUR REPLY (MEMBER WILL SEE THIS)</Text>
              <RNTextInput
                style={s.textarea}
                value={reply}
                onChangeText={setReply}
                placeholder="e.g. Treadmill theek kar diya gaya hai, kal se chalu."
                placeholderTextColor={Colors.textMuted}
                multiline
                textAlignVertical="top"
              />

              <Text style={s.fieldLbl}>SET STATUS</Text>
              <View style={s.actionRow}>
                <AnimatedPressable style={[s.actionBtn, { borderColor: '#3B82F650' }]} scaleDown={0.97}
                  onPress={() => setStatus('in_progress')} disabled={saving}>
                  <Text style={[s.actionText, { color: '#3B82F6' }]}>In progress</Text>
                </AnimatedPressable>
                <AnimatedPressable style={[s.actionBtn, { borderColor: Colors.green + '50', backgroundColor: Colors.green + '15' }]}
                  scaleDown={0.97} onPress={() => setStatus('resolved')} disabled={saving}>
                  {saving ? <ActivityIndicator size="small" color={Colors.green} />
                    : <Text style={[s.actionText, { color: Colors.green }]}>✓ Resolve</Text>}
                </AnimatedPressable>
              </View>

              {sel?.status !== 'open' && (
                <Pressable onPress={() => setStatus('open')} style={s.reopenBtn} disabled={saving}>
                  <Text style={s.reopenText}>Reopen complaint</Text>
                </Pressable>
              )}
              <View style={{ height: 12 }} />
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
  scroll:    { paddingHorizontal: 16, paddingTop: 6 },

  filterRow:  { paddingHorizontal: 16, paddingVertical: 14, gap: 8 },
  filterChip: { borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgCard, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  filterText: { fontFamily: Fonts.bold, fontSize: 12, color: Colors.textMuted },

  card:       { backgroundColor: Colors.bgCard, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 14, marginBottom: 10 },
  cardTop:    { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cardEmoji:  { fontSize: 19 },
  cardSubject:{ fontFamily: Fonts.bold, fontSize: 14.5, color: Colors.text },
  cardMeta:   { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  badge:      { borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText:  { fontFamily: Fonts.bold, fontSize: 8, letterSpacing: 0.7 },
  cardDesc:   { fontFamily: Fonts.regular, fontSize: 12.5, color: Colors.textMuted, marginTop: 9, lineHeight: 18 },
  repliedRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 9 },
  repliedText:{ flex: 1, fontFamily: Fonts.regular, fontSize: 11.5, color: Colors.green },

  emptyCard:  { backgroundColor: Colors.bgCard, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, padding: 26, alignItems: 'center', marginTop: 20 },
  emptyIcon:  { width: 56, height: 56, borderRadius: 16, backgroundColor: Colors.accentMuted, borderWidth: 1, borderColor: Colors.accent + '30', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle: { fontFamily: Fonts.condensedBold, fontSize: 18, color: Colors.text, textAlign: 'center' },
  emptyDesc:  { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, marginTop: 8, textAlign: 'center', lineHeight: 20 },

  modalWrap: { flex: 1, justifyContent: 'flex-end' },
  backdrop:  { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.72)' },
  sheet:     { backgroundColor: Colors.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 30, maxHeight: '85%', borderWidth: 1, borderColor: Colors.border },
  sheetHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 14 },
  sheetEyebrow:{ fontFamily: Fonts.bold, fontSize: 9, color: Colors.accent, letterSpacing: 1.2 },
  sheetTitle: { fontFamily: Fonts.condensedBold, fontSize: 19, color: Colors.text, marginTop: 3 },
  closeX:     { fontFamily: Fonts.bold, fontSize: 18, color: Colors.textMuted, paddingHorizontal: 6 },

  quoteBox:  { backgroundColor: Colors.bg, borderRadius: 12, padding: 13, borderLeftWidth: 3, borderLeftColor: Colors.border },
  quoteText: { fontFamily: Fonts.regular, fontSize: 13.5, color: Colors.text, lineHeight: 20 },

  fieldLbl: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted, letterSpacing: 1.2, marginTop: 18, marginBottom: 9 },
  textarea: { backgroundColor: Colors.bgElevated, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 14, minHeight: 92, fontFamily: Fonts.regular, fontSize: 14.5, color: Colors.text },

  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, borderWidth: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center', backgroundColor: Colors.bg },
  actionText:{ fontFamily: Fonts.bold, fontSize: 13 },
  reopenBtn: { alignItems: 'center', paddingVertical: 14, marginTop: 6 },
  reopenText:{ fontFamily: Fonts.bold, fontSize: 12, color: Colors.textMuted },
});
