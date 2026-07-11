import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  Share, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import AnimatedPressable from '@/components/AnimatedPressable';
import FadeInView from '@/components/FadeInView';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

// ── Date range helpers ──────────────────────────────────────────
const RANGES = [
  { label: 'This Month',    key: 'month'   },
  { label: 'Last 3 Months', key: '3months' },
  { label: 'This Year',     key: 'year'    },
  { label: 'All Time',      key: 'all'     },
] as const;
type RangeKey = typeof RANGES[number]['key'];

function getDateRange(range: RangeKey): { from: string; to: string } {
  const now  = new Date();
  const to   = now.toISOString().split('T')[0];
  let from: string;
  switch (range) {
    case 'month':   from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]; break;
    case '3months': from = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString().split('T')[0]; break;
    case 'year':    from = `${now.getFullYear()}-01-01`; break;
    default:        from = '2020-01-01';
  }
  return { from, to };
}

// ── Export types ────────────────────────────────────────────────
type ExportType = 'members' | 'payments' | 'attendance';

const EXPORT_TYPES: { key: ExportType; label: string; desc: string; icon: IconName; color: string }[] = [
  { key: 'members',    label: 'Members List',       desc: 'Name, phone, plan, status, join date',    icon: 'account-group-outline',    color: '#3B82F6' },
  { key: 'payments',   label: 'Payments Report',    desc: 'Amount, method, date, member name',       icon: 'cash-multiple',            color: Colors.green },
  { key: 'attendance', label: 'Attendance Log',     desc: 'Member check-ins by date',                icon: 'calendar-check-outline',   color: Colors.accent },
];

// ── CSV builders ────────────────────────────────────────────────
function toCSV(rows: string[][]): string {
  return rows.map(row =>
    row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')
  ).join('\n');
}

export default function ExportScreen() {
  const { profile, activeGymId, branches } = useAuthStore();

  const [selectedTypes, setSelectedTypes] = useState<Set<ExportType>>(new Set(['members', 'payments']));
  const [range, setRange] = useState<RangeKey>('month');
  const [exporting, setExporting] = useState(false);

  const getGymIds = useCallback((): string[] => {
    const mainGymId = profile?.gym_id;
    if (!mainGymId) return [];
    if (activeGymId === 'all') return branches.length > 0 ? branches.map(b => b.id) : [mainGymId];
    return [activeGymId ?? mainGymId];
  }, [activeGymId, branches, profile?.gym_id]);

  const toggleType = (key: ExportType) => {
    setSelectedTypes(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const handleExport = async () => {
    if (selectedTypes.size === 0) {
      Alert.alert('Nothing selected', 'Please select at least one data type to export.');
      return;
    }

    setExporting(true);
    const gymIds = getGymIds();
    if (!gymIds.length) { setExporting(false); return; }

    const { from, to } = getDateRange(range);
    const sections: string[] = [];

    try {
      // ── Members ────────────────────────────────────────────
      if (selectedTypes.has('members')) {
        const { data: members } = await supabase
          .from('members')
          .select('full_name, phone, email, gender, goal, status, join_date, member_code')
          .in('gym_id', gymIds)
          .order('join_date', { ascending: false });

        if (members && members.length > 0) {
          const rows: string[][] = [
            ['Name', 'Phone', 'Email', 'Gender', 'Goal', 'Status', 'Join Date', 'Member Code'],
            ...members.map(m => [
              m.full_name, m.phone ?? '', m.email ?? '',
              m.gender ?? '', m.goal ?? '', m.status,
              m.join_date, m.member_code ?? '',
            ]),
          ];
          sections.push(`MEMBERS (${members.length})\n${toCSV(rows)}`);
        } else {
          sections.push('MEMBERS\nNo data found.');
        }
      }

      // ── Payments ───────────────────────────────────────────
      if (selectedTypes.has('payments')) {
        const { data: payments } = await supabase
          .from('payments')
          .select('amount, payment_date, payment_method, payment_type, receipt_number, profiles(full_name)')
          .in('gym_id', gymIds)
          .gte('payment_date', from)
          .lte('payment_date', to)
          .order('payment_date', { ascending: false });

        if (payments && payments.length > 0) {
          const total = payments.reduce((s, p) => s + (p.amount ?? 0), 0);
          const rows: string[][] = [
            ['Date', 'Member', 'Amount (₹)', 'Method', 'Type', 'Receipt'],
            ...payments.map((p: any) => [
              p.payment_date,
              p.profiles?.full_name ?? '',
              String(p.amount),
              p.payment_method,
              p.payment_type,
              p.receipt_number ?? '',
            ]),
            ['', 'TOTAL', String(total), '', '', ''],
          ];
          sections.push(`PAYMENTS (${payments.length} transactions | Total: ₹${total.toLocaleString('en-IN')})\n${toCSV(rows)}`);
        } else {
          sections.push('PAYMENTS\nNo data found in selected period.');
        }
      }

      // ── Attendance ─────────────────────────────────────────
      if (selectedTypes.has('attendance')) {
        const { data: attendance } = await supabase
          .from('attendance')
          .select('check_in_date, check_in_time, method, profiles(full_name)')
          .in('gym_id', gymIds)
          .gte('check_in_date', from)
          .lte('check_in_date', to)
          .order('check_in_date', { ascending: false });

        if (attendance && attendance.length > 0) {
          const rows: string[][] = [
            ['Date', 'Member', 'Check-in Time', 'Method'],
            ...attendance.map((a: any) => [
              a.check_in_date,
              a.profiles?.full_name ?? '',
              a.check_in_time ?? '',
              a.method ?? 'manual',
            ]),
          ];
          sections.push(`ATTENDANCE (${attendance.length} check-ins)\n${toCSV(rows)}`);
        } else {
          sections.push('ATTENDANCE\nNo data found in selected period.');
        }
      }

      const rangeLabel = RANGES.find(r => r.key === range)?.label ?? range;
      const exportedAt = new Date().toLocaleString('en-IN');
      const fullText = [
        `GYMSETU DATA EXPORT`,
        `Exported: ${exportedAt}`,
        `Period: ${rangeLabel} (${from} to ${to})`,
        `\n${'─'.repeat(50)}\n`,
        sections.join(`\n\n${'─'.repeat(50)}\n\n`),
      ].join('\n');

      await Share.share({
        message: fullText,
        title: `GymSetu Export — ${rangeLabel}`,
      });
    } catch (err: any) {
      Alert.alert('Export Failed', err.message ?? 'Something went wrong. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Export Data' }} />
      <SafeAreaView style={s.safe} edges={['bottom']}>
        <ScrollView style={s.container} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Hero ── */}
          <FadeInView delay={0}>
            <View style={s.hero}>
              <LinearGradient
                colors={[Colors.green + '12', 'transparent']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill} pointerEvents="none"
              />
              <View style={s.heroIcon}>
                <MaterialCommunityIcons name="cloud-upload-outline" size={26} color={Colors.green} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.heroMicro}>DATA EXPORT</Text>
                <Text style={s.heroTitle}>EXPORT DATA</Text>
                <Text style={s.heroSub}>Share with your CA or save for records</Text>
              </View>
            </View>
          </FadeInView>

          {/* ── What to export ── */}
          <FadeInView delay={60}>
            <Text style={s.sectionLabel}>SELECT DATA</Text>
            {EXPORT_TYPES.map(t => {
              const selected = selectedTypes.has(t.key);
              return (
                <AnimatedPressable
                  key={t.key}
                  style={[s.typeRow, selected && { borderColor: t.color + '60' }]}
                  scaleDown={0.98}
                  onPress={() => toggleType(t.key)}
                >
                  <View style={[s.typeIcon, { backgroundColor: t.color + (selected ? '20' : '12') }]}>
                    <MaterialCommunityIcons name={t.icon} size={20} color={t.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.typeLabel}>{t.label}</Text>
                    <Text style={s.typeDesc}>{t.desc}</Text>
                  </View>
                  <View style={[s.checkbox, selected && { backgroundColor: t.color, borderColor: t.color }]}>
                    {selected && <MaterialCommunityIcons name="check" size={14} color="#fff" />}
                  </View>
                </AnimatedPressable>
              );
            })}
          </FadeInView>

          {/* ── Date range ── */}
          <FadeInView delay={140}>
            <Text style={s.sectionLabel}>DATE RANGE</Text>
            <View style={s.rangeRow}>
              {RANGES.map(r => (
                <AnimatedPressable
                  key={r.key}
                  style={[s.rangeChip, range === r.key && s.rangeChipActive]}
                  scaleDown={0.94}
                  onPress={() => setRange(r.key)}
                >
                  <Text style={[s.rangeText, range === r.key && s.rangeTextActive]}>
                    {r.label}
                  </Text>
                </AnimatedPressable>
              ))}
            </View>
          </FadeInView>

          {/* ── Info box ── */}
          <FadeInView delay={200}>
            <View style={s.infoBox}>
              <MaterialCommunityIcons name="information-outline" size={14} color={Colors.textMuted} />
              <Text style={s.infoText}>
                Data exports as CSV text. You can share it directly to WhatsApp, email your CA, or save to Files.
              </Text>
            </View>
          </FadeInView>

          {/* ── Export button ── */}
          <FadeInView delay={240}>
            <AnimatedPressable
              style={[s.exportPressable, (exporting || selectedTypes.size === 0) && { opacity: 0.6 }]}
              onPress={handleExport}
              disabled={exporting || selectedTypes.size === 0}
              scaleDown={0.97}
            >
              <LinearGradient
                colors={[Colors.green, '#15803d']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={s.exportBtn}
              >
                {exporting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="share-variant" size={18} color="#fff" />
                    <Text style={s.exportBtnText}>EXPORT & SHARE</Text>
                  </>
                )}
              </LinearGradient>
            </AnimatedPressable>
          </FadeInView>

          <View style={{ height: 32 }} />
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const s = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: Colors.bg },
  container: { flex: 1 },
  scroll:    { paddingHorizontal: 16, paddingBottom: 24, paddingTop: 16, gap: 14 },

  // Hero
  hero: {
    backgroundColor: Colors.bgCard, borderRadius: 20, padding: 20,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderWidth: 1, borderColor: Colors.green + '30', overflow: 'hidden',
  },
  heroIcon: {
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: Colors.green + '18',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.green + '30',
  },
  heroMicro: { fontFamily: Fonts.medium, fontSize: 9, color: Colors.green, letterSpacing: 1.5 },
  heroTitle: { fontFamily: Fonts.condensedBold, fontSize: 28, color: Colors.text, letterSpacing: 0.5 },
  heroSub:   { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 2 },

  sectionLabel: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted, letterSpacing: 1.8, marginBottom: 6 },

  // Export type rows
  typeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.bgCard, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 14, paddingVertical: 14, marginBottom: 8,
  },
  typeIcon:  { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  typeLabel: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.text },
  typeDesc:  { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  checkbox: {
    width: 24, height: 24, borderRadius: 7,
    borderWidth: 1.5, borderColor: Colors.border,
    justifyContent: 'center', alignItems: 'center',
  },

  // Range chips
  rangeRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  rangeChip:     { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border },
  rangeChipActive: { backgroundColor: Colors.green + '18', borderColor: Colors.green + '60' },
  rangeText:     { fontFamily: Fonts.bold, fontSize: 11, color: Colors.textMuted },
  rangeTextActive: { color: Colors.green },

  // Info box
  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: Colors.bgElevated, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  infoText: { flex: 1, fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, lineHeight: 18 },

  // Export button
  exportPressable: {},
  exportBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 16, paddingVertical: 18, minHeight: 58 },
  exportBtnText: { fontFamily: Fonts.bold, fontSize: 14, color: '#fff', letterSpacing: 2 },
});
