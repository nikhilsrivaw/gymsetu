import { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, Pressable,
  ActivityIndicator, Share, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

import { toLocalDate } from '@/lib/date';
type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface GymPlan { id: string; name: string; duration_days: number; }

interface ParsedRow {
  raw: number;              // source line number
  name: string;
  phone: string;
  planText: string;
  validTill: string;        // as typed
  planId: string | null;    // resolved
  error: string | null;
}

interface DoneRow { name: string; phone: string; code: string; password: string; }

const DDMMYYYY = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
const cleanPhone = (p: string) => p.replace(/\D/g, '');
const validPhone = (p: string) => cleanPhone(p).length >= 10 && cleanPhone(p).length <= 15;

function parseDate(raw: string): string | null {
  const m = raw.trim().match(DDMMYYYY);
  if (!m) return null;
  return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
}

// Delimiter-aware CSV/TSV parser (Excel copy → tabs; files → commas).
function parseTable(text: string): string[][] {
  const delim = text.includes('\t') ? '\t' : ',';
  const rows: string[][] = [];
  let row: string[] = [], field = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
      else field += c;
    } else if (c === '"') { inQ = true; }
    else if (c === delim) { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some(x => x.trim() !== '')) rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); if (row.some(x => x.trim() !== '')) rows.push(row); }
  return rows;
}

export default function ImportMembersScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const gymId = profile?.gym_id;

  const [plans, setPlans]       = useState<GymPlan[]>([]);
  const [existingPhones, setExistingPhones] = useState<Set<string>>(new Set());
  const [text, setText]         = useState('');
  const [step, setStep]         = useState<'input' | 'preview' | 'done'>('input');
  const [rows, setRows]         = useState<ParsedRow[]>([]);
  const [defaultPlan, setDefaultPlan] = useState<string>('');
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone]         = useState<DoneRow[]>([]);
  const [failed, setFailed]     = useState<{ name: string; reason: string }[]>([]);

  useEffect(() => {
    if (!gymId) return;
    supabase.from('membership_plans').select('id, name, duration_days')
      .eq('gym_id', gymId).eq('is_active', true).order('price', { ascending: true })
      .then(({ data }) => {
        const gp = (data ?? []) as GymPlan[];
        setPlans(gp);
        if (gp[0]) setDefaultPlan(gp[0].id);
      });
    supabase.from('members').select('phone').eq('gym_id', gymId)
      .then(({ data }) => setExistingPhones(new Set((data ?? []).map((m: any) => cleanPhone(m.phone || '')).filter(Boolean))));
  }, [gymId]);

  // ── Parse + validate ─────────────────────────────────────────
  const parse = () => {
    const table = parseTable(text);
    if (table.length === 0) return;

    // Detect header row.
    const first = table[0].map(h => h.toLowerCase().trim());
    const looksLikeHeader = first.some(h => /name|phone|mobile|plan|till|expir|valid/.test(h));
    const header = looksLikeHeader ? first : null;
    const body = looksLikeHeader ? table.slice(1) : table;

    const col = (keys: string[], fallback: number) => {
      if (!header) return fallback;
      const i = header.findIndex(h => keys.some(k => h.includes(k)));
      return i >= 0 ? i : fallback;
    };
    const ci = {
      name: col(['name'], 0),
      phone: col(['phone', 'mobile', 'number'], 1),
      plan: col(['plan'], 2),
      till: col(['till', 'expir', 'valid', 'end'], 3),
    };

    const seen = new Set<string>();
    const parsed: ParsedRow[] = body.map((r, idx) => {
      const name = (r[ci.name] ?? '').trim();
      const phone = (r[ci.phone] ?? '').trim();
      const planText = (r[ci.plan] ?? '').trim();
      const validTill = (r[ci.till] ?? '').trim();
      const planId = planText
        ? (plans.find(p => p.name.toLowerCase() === planText.toLowerCase())?.id ?? null)
        : (defaultPlan || null);
      const cp = cleanPhone(phone);

      let error: string | null = null;
      if (!name) error = 'Missing name';
      else if (!phone || !validPhone(phone)) error = 'Invalid phone';
      else if (existingPhones.has(cp)) error = 'Already a member';
      else if (seen.has(cp)) error = 'Duplicate in list';
      else if (validTill && !parseDate(validTill)) error = 'Bad date (use DD/MM/YYYY)';
      else if (planText && !planId) error = `Unknown plan "${planText}"`;
      if (!error && cp) seen.add(cp);

      return { raw: idx + 1, name, phone, planText, validTill, planId, error };
    });
    setRows(parsed);
    setStep('preview');
  };

  const okRows = useMemo(() => rows.filter(r => !r.error), [rows]);

  // ── Import ───────────────────────────────────────────────────
  const runImport = async () => {
    if (!gymId) return;
    setImporting(true); setProgress(0);
    const imported: DoneRow[] = [];
    const fails: { name: string; reason: string }[] = [];
    const today = new Date();

    for (const r of okRows) {
      try {
        const { data: cred, error } = await supabase.functions.invoke('create-gym-user', {
          body: {
            role: 'member', gymId, fullName: r.name,
            extraData: { phone: cleanPhone(r.phone), created_by: profile?.id },
          },
        });
        if (error || !cred?.userId) throw new Error(error?.message ?? 'create failed');

        const planId = r.planId ?? defaultPlan;
        const plan = plans.find(p => p.id === planId);
        if (plan) {
          const { data: mrow } = await supabase.from('members').select('id')
            .eq('user_id', cred.userId).eq('gym_id', gymId).maybeSingle();
          const memberId = mrow?.id ?? cred.userId;

          const iso = r.validTill ? parseDate(r.validTill) : null;
          let startDate: string, endDate: string, status = 'active';
          if (iso) {
            endDate   = iso;
            startDate = toLocalDate(new Date(new Date(iso).getTime() - plan.duration_days * 86_400_000));
            status    = new Date(iso).getTime() >= today.getTime() ? 'active' : 'expired';
          } else {
            startDate = toLocalDate(today);
            endDate   = toLocalDate(new Date(today.getTime() + plan.duration_days * 86_400_000));
          }
          await supabase.from('member_plans').insert({
            member_id: memberId, gym_id: gymId, plan_id: plan.id,
            start_date: startDate, end_date: endDate, status, created_by: profile?.id ?? null,
          });
          if (status === 'expired') await supabase.from('profiles').update({ status: 'expired' }).eq('id', cred.userId);
        }

        imported.push({ name: r.name, phone: cleanPhone(r.phone), code: cred.code, password: cred.password });
      } catch (e) {
        fails.push({ name: r.name, reason: e instanceof Error ? e.message : 'failed' });
      }
      setProgress(imported.length + fails.length);
    }

    setDone(imported); setFailed(fails);
    setImporting(false); setStep('done');
  };

  const shareCreds = () => {
    const body = done.map(d => `${d.name} — ${d.phone}\n  ID: ${d.code}  ·  Password: ${d.password}`).join('\n\n');
    Share.share({ message: `GymSetu member logins\n\n${body}` }).catch(() => {});
  };

  // ── UI ───────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <Stack.Screen options={{ title: 'Import Members' }} />
      <ScrollView style={s.container} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {step === 'input' && (
          <>
            <View style={s.hero}>
              <MaterialCommunityIcons name="table-arrow-up" size={26} color={Colors.accent} />
              <Text style={s.heroTitle}>Bring your members over</Text>
              <Text style={s.heroSub}>Paste rows straight from Excel or a CSV. One member per line.</Text>
            </View>

            <View style={s.card}>
              <Text style={s.cardLabel}>EXPECTED COLUMNS</Text>
              <View style={s.formatRow}>
                {['Name', 'Phone', 'Plan', 'Valid till'].map((c, i) => (
                  <View key={c} style={s.formatChip}>
                    <Text style={s.formatChipText}>{c}{i < 2 ? ' *' : ''}</Text>
                  </View>
                ))}
              </View>
              <Text style={s.formatHint}>
                Name &amp; phone are required. Plan matches your plan names (else the default below). Valid till (DD/MM/YYYY)
                sets each member's real expiry — leave blank to start today. No receipts are created on import.
              </Text>
            </View>

            <Text style={s.label}>PASTE HERE</Text>
            <TextInput
              style={s.textarea}
              value={text}
              onChangeText={setText}
              multiline
              placeholder={'Rajesh Kumar\t9876543210\tMonthly\t20/08/2026\nPriya Nair\t9876500000\tQuarterly\t05/11/2026'}
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
            />

            <Pressable
              style={[s.primaryBtn, !text.trim() && { opacity: 0.5 }]}
              disabled={!text.trim()}
              onPress={parse}
            >
              <MaterialCommunityIcons name="magnify-scan" size={17} color="#fff" />
              <Text style={s.primaryBtnText}>Preview import</Text>
            </Pressable>
          </>
        )}

        {step === 'preview' && (
          <>
            <View style={s.summaryRow}>
              <Stat label="Ready" value={okRows.length} color={Colors.green} icon="check-circle-outline" />
              <Stat label="Skipped" value={rows.length - okRows.length} color={Colors.red} icon="alert-circle-outline" />
              <Stat label="Total" value={rows.length} color={Colors.accent} icon="account-multiple-outline" />
            </View>

            {plans.length > 0 && (
              <>
                <Text style={s.label}>DEFAULT PLAN (for rows with no/unknown plan)</Text>
                <View style={s.planRow}>
                  {plans.map(p => (
                    <Pressable key={p.id} style={[s.planChip, defaultPlan === p.id && s.planChipOn]} onPress={() => setDefaultPlan(p.id)}>
                      <Text style={[s.planChipTxt, defaultPlan === p.id && { color: Colors.accent }]}>{p.name}</Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}

            <Text style={[s.label, { marginTop: 16 }]}>ROWS</Text>
            <View style={s.previewList}>
              {rows.map((r, i) => (
                <View key={i} style={[s.prow, i < rows.length - 1 && s.prowBorder]}>
                  <MaterialCommunityIcons
                    name={r.error ? 'close-circle' : 'check-circle'}
                    size={16} color={r.error ? Colors.red : Colors.green}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={s.prowName}>{r.name || <Text style={{ color: Colors.textMuted }}>—</Text>}</Text>
                    <Text style={s.prowMeta}>
                      {cleanPhone(r.phone) || 'no phone'}
                      {r.planText ? ` · ${r.planText}` : ''}{r.validTill ? ` · till ${r.validTill}` : ''}
                    </Text>
                  </View>
                  {r.error && <Text style={s.prowErr}>{r.error}</Text>}
                </View>
              ))}
            </View>

            <Pressable
              style={[s.primaryBtn, (okRows.length === 0 || importing) && { opacity: 0.5 }]}
              disabled={okRows.length === 0 || importing}
              onPress={runImport}
            >
              {importing
                ? <><ActivityIndicator size="small" color="#fff" /><Text style={s.primaryBtnText}>Importing {progress}/{okRows.length}…</Text></>
                : <><MaterialCommunityIcons name="account-multiple-plus" size={17} color="#fff" /><Text style={s.primaryBtnText}>Import {okRows.length} member{okRows.length !== 1 ? 's' : ''}</Text></>}
            </Pressable>
            {!importing && (
              <Pressable style={s.ghostBtn} onPress={() => setStep('input')}>
                <Text style={s.ghostBtnText}>Back to edit</Text>
              </Pressable>
            )}
          </>
        )}

        {step === 'done' && (
          <>
            <View style={s.hero}>
              <MaterialCommunityIcons name="party-popper" size={26} color={Colors.green} />
              <Text style={s.heroTitle}>{done.length} member{done.length !== 1 ? 's' : ''} imported</Text>
              <Text style={s.heroSub}>
                {failed.length > 0 ? `${failed.length} row(s) failed. ` : ''}
                Share each member their login below so they can access the app.
              </Text>
            </View>

            {done.length > 0 && (
              <Pressable style={s.primaryBtn} onPress={shareCreds}>
                <MaterialCommunityIcons name="share-variant" size={17} color="#fff" />
                <Text style={s.primaryBtnText}>Share all logins</Text>
              </Pressable>
            )}

            <View style={[s.previewList, { marginTop: 16 }]}>
              {done.map((d, i) => (
                <View key={i} style={[s.prow, i < done.length - 1 && s.prowBorder]}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.prowName}>{d.name}</Text>
                    <Text style={s.credLine}>ID {d.code}  ·  Pass {d.password}</Text>
                  </View>
                </View>
              ))}
            </View>

            {failed.length > 0 && (
              <>
                <Text style={[s.label, { marginTop: 18 }]}>FAILED</Text>
                <View style={s.previewList}>
                  {failed.map((f, i) => (
                    <View key={i} style={[s.prow, i < failed.length - 1 && s.prowBorder]}>
                      <MaterialCommunityIcons name="close-circle" size={16} color={Colors.red} />
                      <View style={{ flex: 1 }}>
                        <Text style={s.prowName}>{f.name}</Text>
                        <Text style={s.prowErr}>{f.reason}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </>
            )}

            <Pressable style={s.primaryBtn} onPress={() => router.replace('/(owner)/members')}>
              <MaterialCommunityIcons name="check" size={17} color="#fff" />
              <Text style={s.primaryBtnText}>Done</Text>
            </Pressable>
          </>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value, color, icon }: { label: string; value: number; color: string; icon: IconName }) {
  return (
    <View style={s.stat}>
      <MaterialCommunityIcons name={icon} size={15} color={color} />
      <Text style={[s.statVal, { color }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  container: { flex: 1 },
  scroll: { padding: 16 },

  hero: { alignItems: 'center', paddingVertical: 14, marginBottom: 16 },
  heroTitle: { fontFamily: Fonts.condensedBold, fontSize: 24, color: Colors.text, marginTop: 8 },
  heroSub: { fontFamily: Fonts.regular, fontSize: 12.5, color: Colors.textMuted, textAlign: 'center', marginTop: 6, lineHeight: 18, maxWidth: 320 },

  card: { backgroundColor: Colors.bgCard, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 14, marginBottom: 18 },
  cardLabel: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted, letterSpacing: 1.5, marginBottom: 10 },
  formatRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  formatChip: { backgroundColor: Colors.accent + '12', borderWidth: 1, borderColor: Colors.accent + '30', borderRadius: 7, paddingHorizontal: 9, paddingVertical: 5 },
  formatChipText: { fontFamily: Fonts.bold, fontSize: 11, color: Colors.accent },
  formatHint: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, lineHeight: 16 },

  label: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted, letterSpacing: 1.5, marginBottom: 8 },
  textarea: {
    minHeight: 150, backgroundColor: Colors.bgInput, borderRadius: 12, borderWidth: 1, borderColor: Colors.border,
    padding: 12, color: Colors.text, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 12.5,
    textAlignVertical: 'top', marginBottom: 16,
  },

  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 15, marginTop: 6 },
  primaryBtnText: { fontFamily: Fonts.bold, fontSize: 14, color: '#fff', letterSpacing: 0.3 },
  ghostBtn: { alignItems: 'center', paddingVertical: 14, marginTop: 4 },
  ghostBtnText: { fontFamily: Fonts.bold, fontSize: 12, color: Colors.textMuted, letterSpacing: 0.5 },

  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  stat: { flex: 1, backgroundColor: Colors.bgCard, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', paddingVertical: 12, gap: 3 },
  statVal: { fontFamily: Fonts.condensedBold, fontSize: 22 },
  statLabel: { fontFamily: Fonts.bold, fontSize: 8.5, color: Colors.textMuted, letterSpacing: 1 },

  planRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  planChip: { borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgInput, borderRadius: 9, paddingHorizontal: 12, paddingVertical: 8 },
  planChipOn: { borderColor: Colors.accent, backgroundColor: Colors.accent + '12' },
  planChipTxt: { fontFamily: Fonts.bold, fontSize: 12, color: Colors.textSub },

  previewList: { backgroundColor: Colors.bgCard, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  prow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  prowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  prowName: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.text },
  prowMeta: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  prowErr: { fontFamily: Fonts.bold, fontSize: 10, color: Colors.red },
  credLine: { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 12, color: Colors.accent, marginTop: 3 },
});
