import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { askAI } from '@/lib/ai';
import { toLocalDate } from '@/lib/date';

/*
 * "GymSetu se poochho" — conversational business assistant.
 *
 * Cost-safe by design: we build a SMALL bounded snapshot of the gym's numbers
 * (a handful of aggregates + up to 6 expiring names) ONCE, then send only that
 * with each question. We never send raw member lists, so the OpenAI input stays
 * tiny no matter how big the gym is. Output is capped at 320 tokens server-side.
 */

const SUGGESTIONS = [
  'Is mahine kitni kamai hui?',
  'Pichle mahine se kitna better?',
  'Kaun members expire ho rahe hain?',
  'Kitne naye members aaye is mahine?',
];

export default function AskGymScreen() {
  const { profile, activeGymId, branches } = useAuthStore();
  const mainGymId = profile?.gym_id;

  const gymIds = useMemo(() => {
    if (activeGymId === 'all') return branches.length > 0 ? branches.map(b => b.id) : [mainGymId];
    return [activeGymId ?? mainGymId];
  }, [activeGymId, branches, mainGymId]);

  const [snapshot, setSnapshot] = useState<Record<string, any> | null>(null);
  const [snapLoading, setSnapLoading] = useState(true);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState('');

  // ── Build the bounded snapshot once ──────────────────────────
  const buildSnapshot = useCallback(async () => {
    setSnapLoading(true);
    try {
      const ids = gymIds.filter(Boolean) as string[];
      if (ids.length === 0) { setSnapshot({}); return; }

      const now = new Date();
      const monthStart = toLocalDate(new Date(now.getFullYear(), now.getMonth(), 1));
      const lastMonthStart = toLocalDate(new Date(now.getFullYear(), now.getMonth() - 1, 1));
      const today = toLocalDate(now);
      const in7 = toLocalDate(new Date(now.getTime() + 7 * 86_400_000));

      const [thisMonth, lastMonth, activeMembers, newMembers, expiring] = await Promise.all([
        supabase.from('payments').select('amount').in('gym_id', ids).gte('payment_date', monthStart),
        supabase.from('payments').select('amount').in('gym_id', ids).gte('payment_date', lastMonthStart).lt('payment_date', monthStart),
        supabase.from('members').select('id', { count: 'exact', head: true }).in('gym_id', ids).eq('status', 'active'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).in('gym_id', ids).eq('role', 'member').gte('created_at', monthStart),
        supabase.from('members').select('full_name, member_plans(end_date, status)').in('gym_id', ids).eq('status', 'active'),
      ]);

      const sum = (rows: any[] | null) => (rows ?? []).reduce((s, p) => s + (p.amount || 0), 0);

      // Expiring within 7 days — bounded to 6 names.
      const expNames: string[] = [];
      for (const m of (expiring.data ?? [])) {
        const plan = Array.isArray(m.member_plans) ? m.member_plans[0] : m.member_plans;
        if (!plan?.end_date) continue;
        if (plan.end_date >= today && plan.end_date <= in7) {
          expNames.push(`${m.full_name} (${plan.end_date})`);
          if (expNames.length >= 6) break;
        }
      }

      setSnapshot({
        monthRevenue: sum(thisMonth.data),
        lastMonthRevenue: sum(lastMonth.data),
        activeMembers: activeMembers.count ?? 0,
        newMembersThisMonth: newMembers.count ?? 0,
        expiringThisWeekCount: expNames.length,
        expiringThisWeek: expNames,
        asOf: today,
      });
    } catch {
      setSnapshot({});
    } finally {
      setSnapLoading(false);
    }
  }, [gymIds]);

  useEffect(() => { buildSnapshot(); }, [buildSnapshot]);

  const ask = async (q?: string) => {
    const query = (q ?? question).trim();
    if (!query || !snapshot) return;
    setQuestion(query);
    setAsking(true); setError(''); setAnswer('');
    try {
      const t = await askAI('ask_gym', { question: query, snapshot: JSON.stringify(snapshot) });
      setAnswer(t);
    } catch (e: any) {
      setError(e?.message || 'Could not answer. Try again.');
    } finally {
      setAsking(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'GymSetu se poochho' }} />
      <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <Text style={s.eyebrow}>AI BUSINESS ASSISTANT</Text>
          <Text style={s.headline}>Apne gym ke baare{'\n'}mein kuch bhi poochho</Text>
          <Text style={s.sub}>Aapke live data se jawab — Hinglish mein.</Text>

          {snapLoading ? (
            <View style={s.snapLoading}>
              <ActivityIndicator color={Colors.accent} />
              <Text style={s.muted}>Aapka data taiyaar ho raha hai…</Text>
            </View>
          ) : (
            <>
              {/* Answer area */}
              {(asking || answer !== '' || error !== '') && (
                <View style={s.answerCard}>
                  {question !== '' && <Text style={s.qEcho}>“{question}”</Text>}
                  {asking && (
                    <View style={s.answerLoading}>
                      <ActivityIndicator color={Colors.accent} size="small" />
                      <Text style={s.muted}>Soch raha hoon…</Text>
                    </View>
                  )}
                  {!asking && error !== '' && <Text style={[s.answer, { color: Colors.red }]}>{error}</Text>}
                  {!asking && answer !== '' && <Text style={s.answer}>{answer}</Text>}
                </View>
              )}

              {/* Suggestions */}
              <Text style={s.suggLabel}>Suggested</Text>
              <View style={s.suggWrap}>
                {SUGGESTIONS.map(q => (
                  <TouchableOpacity key={q} style={s.suggChip} onPress={() => ask(q)} disabled={asking}>
                    <Text style={s.suggText}>{q}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Input bar */}
        <View style={s.inputBar}>
          <TextInput
            style={s.input}
            value={question}
            onChangeText={setQuestion}
            placeholder="Apna sawaal likhein…"
            placeholderTextColor={Colors.textMuted}
            editable={!snapLoading && !asking}
            onSubmitEditing={() => ask()}
            returnKeyType="send"
            multiline
          />
          <TouchableOpacity
            style={[s.sendBtn, (!question.trim() || asking || snapLoading) && s.sendBtnOff]}
            onPress={() => ask()}
            disabled={!question.trim() || asking || snapLoading}
          >
            <Text style={s.sendBtnText}>→</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll:    { padding: 20, paddingBottom: 10 },
  eyebrow:   { fontFamily: Fonts.bold, fontSize: 10, color: Colors.accent, letterSpacing: 1.6 },
  headline:  { fontFamily: Fonts.condensedBold, fontSize: 30, color: Colors.text, marginTop: 8, lineHeight: 32 },
  sub:       { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textMuted, marginTop: 8, marginBottom: 22 },

  snapLoading: { paddingVertical: 50, alignItems: 'center', gap: 12 },
  muted:       { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted },

  answerCard:   { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.accent + '30', borderRadius: 18, padding: 18, marginBottom: 22, gap: 10 },
  qEcho:        { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, fontStyle: 'italic' },
  answerLoading:{ flexDirection: 'row', alignItems: 'center', gap: 10 },
  answer:       { fontFamily: Fonts.regular, fontSize: 16, color: Colors.text, lineHeight: 25 },

  suggLabel: { fontFamily: Fonts.bold, fontSize: 10, color: Colors.textMuted, letterSpacing: 1.4, marginBottom: 12 },
  suggWrap:  { gap: 10 },
  suggChip:  { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16 },
  suggText:  { fontFamily: Fonts.regular, fontSize: 15, color: Colors.text },

  inputBar:  { flexDirection: 'row', alignItems: 'flex-end', gap: 10, padding: 14, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.bg },
  input:     { flex: 1, maxHeight: 110, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, fontFamily: Fonts.regular, fontSize: 15, color: Colors.text },
  sendBtn:   { width: 48, height: 48, borderRadius: 16, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },
  sendBtnOff:{ opacity: 0.35 },
  sendBtnText:{ fontFamily: Fonts.bold, fontSize: 22, color: '#fff' },
});
