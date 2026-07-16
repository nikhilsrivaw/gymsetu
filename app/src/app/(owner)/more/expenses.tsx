import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Alert,
  ActivityIndicator, Pressable, Modal, ScrollView,
  TextInput as RNTextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
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
import LottieView from '@/components/AppLottie';

import { toLocalDate, todayLocal } from '@/lib/date';
const CATEGORIES = [
  { label: 'Rent',        emoji: '🏢', color: '#4F6EF7' },
  { label: 'Electricity', emoji: '⚡', color: Colors.orange },
  { label: 'Equipment',   emoji: '🏋️', color: Colors.accent },
  { label: 'Salaries',    emoji: '👥', color: Colors.green },
  { label: 'Maintenance', emoji: '🔧', color: '#EC4899' },
  { label: 'Marketing',   emoji: '📢', color: '#A78BFA' },
  { label: 'Supplies',    emoji: '🛒', color: '#F59E0B' },
  { label: 'Other',       emoji: '💸', color: Colors.textMuted },
];

interface ExpenseRow {
  id: string;
  category: string;
  amount: number;
  description: string | null;
  expense_date: string;
}

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

// ── Custom field ──────────────────────────────────────────────────────────────
function Field({
  icon, label, value, onChange, required, prefix, accentColor, ...rest
}: {
  icon: IconName; label: string; value: string;
  onChange: (v: string) => void; required?: boolean;
  prefix?: string; accentColor?: string; [k: string]: any;
}) {
  const [focused, setFocused] = useState(false);
  const accent = accentColor ?? Colors.red;
  return (
    <View style={[f.outer, focused && { borderColor: accent + '70' }]}>
      <MaterialCommunityIcons
        name={icon} size={17}
        color={focused ? accent : Colors.textMuted}
        style={f.icon}
      />
      <View style={f.col}>
        <Text style={[f.lbl, focused && { color: accent }]}>
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
  icon:   { width: 20, textAlign: 'center' },
  col:    { flex: 1 },
  lbl:    { fontFamily: Fonts.bold, fontSize: 8, color: Colors.textMuted, letterSpacing: 1.4, marginBottom: 4 },
  prefix: { fontFamily: Fonts.bold, fontSize: 15, color: Colors.textMuted, marginRight: 2 },
  inp:    { fontFamily: Fonts.regular, fontSize: 14, color: Colors.text, padding: 0, flex: 1 },
});

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  n >= 100000 ? `₹${(n / 100000).toFixed(1)}L`
  : n >= 1000  ? `₹${(n / 1000).toFixed(1)}K`
  : `₹${n.toLocaleString('en-IN')}`;

const fmtFull = (n: number) =>
  `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

export default function ExpensesScreen() {
  const { profile, activeGymId, branches } = useAuthStore();

  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [show, setShow]         = useState(false);
  const [saving, setSaving]     = useState(false);
  const [selectedCat, setSelectedCat] = useState('Rent');
  const [amount, setAmount]           = useState('');
  const [description, setDescription] = useState('');
  const [period, setPeriod]           = useState<'month' | 'year'>('month');
  const [formError, setFormError]     = useState('');

  const getGymIds = useCallback((): string[] => {
    const mainGymId = (profile as any)?.gym_id;
    if (!mainGymId) return [];
    if (activeGymId === 'all') return branches.length > 0 ? branches.map(b => b.id) : [mainGymId];
    return [activeGymId ?? mainGymId];
  }, [activeGymId, branches, profile]);

  const fetchExpenses = useCallback(async () => {
    const gymIds = getGymIds();
    if (gymIds.length === 0) return;
    setLoading(true);
    const now   = new Date();
    const start = period === 'month'
      ? toLocalDate(new Date(now.getFullYear(), now.getMonth(), 1))
      : toLocalDate(new Date(now.getFullYear(), 0, 1));
    const { data, error } = await supabase
      .from('expenses').select('*')
      .in('gym_id', gymIds)
      .gte('expense_date', start)
      .order('expense_date', { ascending: false });
    if (!error && data) setExpenses(data);
    setLoading(false);
  }, [getGymIds, period]);

  useFocusEffect(useCallback(() => { fetchExpenses(); }, [fetchExpenses]));

  const handleSave = async () => {
    setFormError('');
    if (!amount.trim()) { setFormError('Amount is required.'); return; }
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) { setFormError('Enter a valid amount greater than 0.'); return; }
    const gymIds  = getGymIds();
    if (gymIds.length === 0) return;
    const mainGymId = (profile as any)?.gym_id;
    const gymId     = activeGymId === 'all' ? mainGymId : gymIds[0];

    setSaving(true);
    const { error } = await supabase.from('expenses').insert({
      gym_id: gymId, category: selectedCat,
      amount: parsed,
      description: description.trim() || null,
      expense_date: todayLocal(),
      created_by: profile?.id,
    });
    setSaving(false);
    if (error) { setFormError(error.message); return; }
    setShow(false);
    setAmount(''); setDescription(''); setSelectedCat('Rent'); setFormError('');
    fetchExpenses();
  };

  const closeModal = () => { setShow(false); setFormError(''); };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Expense', 'Remove this expense entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await supabase.from('expenses').delete().eq('id', id);
          fetchExpenses();
        },
      },
    ]);
  };

  const total     = expenses.reduce((s, e) => s + e.amount, 0);
  const catTotals = CATEGORIES.map(c => ({
    ...c,
    total: expenses.filter(e => e.category === c.label).reduce((s, e) => s + e.amount, 0),
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

  const topCat      = catTotals[0];
  const previewAmt  = parseFloat(amount) || 0;
  const activeCatObj = CATEGORIES.find(c => c.label === selectedCat) ?? CATEGORIES[CATEGORIES.length - 1];

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) return (
    <>
      <Stack.Screen options={{ title: 'Expenses' }} />
      <View style={s.loadingContainer}>
        <LottieView
          source={require('@/assets/animations/Turkey Power Walk.json')}
          autoPlay loop style={s.loadingLottie}
        />
        <Text style={s.loadingTitle}>LOADING EXPENSES</Text>
        <Text style={s.loadingSubtitle}>Crunching the numbers...</Text>
      </View>
    </>
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Expenses' }} />
      <View style={s.container}>

        {/* ── Period toggle ── */}
        <View style={s.periodRow}>
          {(['month', 'year'] as const).map(p => (
            <AnimatedPressable
              key={p}
              style={[s.periodChip, period === p && s.periodChipActive]}
              scaleDown={0.95}
              onPress={() => setPeriod(p)}
            >
              <Text style={[s.periodText, period === p && s.periodTextActive]}>
                {p === 'month' ? 'THIS MONTH' : 'THIS YEAR'}
              </Text>
            </AnimatedPressable>
          ))}
        </View>

        {/* ── Summary card ── */}
        <FadeInView delay={0}>
          <View style={s.summaryCard}>
            <LinearGradient
              colors={[Colors.red + '14', 'transparent']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill} pointerEvents="none"
            />
            <View style={[s.summaryAccent]} />

            <View style={s.summaryLeft}>
              <View style={s.summaryIconBox}>
                <MaterialCommunityIcons name="trending-down" size={20} color={Colors.red} />
              </View>
              <View>
                <Text style={s.summaryLabel}>TOTAL EXPENSES</Text>
                <Text style={s.summaryVal}>{fmt(total)}</Text>
                <Text style={s.summarySub}>{expenses.length} {expenses.length === 1 ? 'entry' : 'entries'}</Text>
              </View>
            </View>

            <View style={s.summaryRight}>
              {catTotals.slice(0, 3).map(c => (
                <View key={c.label} style={s.catPill}>
                  <Text style={s.catPillEmoji}>{c.emoji}</Text>
                  <Text style={[s.catPillAmt, { color: c.color }]}>{fmt(c.total)}</Text>
                </View>
              ))}
            </View>
          </View>
        </FadeInView>

        {/* ── Top category bar ── */}
        {topCat && total > 0 && (
          <FadeInView delay={60}>
            <View style={s.breakdownCard}>
              <Text style={s.breakdownTitle}>BREAKDOWN</Text>
              {catTotals.slice(0, 4).map(c => (
                <View key={c.label} style={s.barRow}>
                  <Text style={s.barEmoji}>{c.emoji}</Text>
                  <View style={s.barTrack}>
                    <View style={[s.barFill, { width: `${(c.total / total) * 100}%` as any, backgroundColor: c.color + 'BB' }]} />
                  </View>
                  <Text style={[s.barPct, { color: c.color }]}>{Math.round((c.total / total) * 100)}%</Text>
                  <Text style={s.barAmt}>{fmt(c.total)}</Text>
                </View>
              ))}
            </View>
          </FadeInView>
        )}

        {/* ── List / Empty ── */}
        {expenses.length === 0 ? (
          <FadeInView delay={100} style={s.empty}>
            <Text style={s.emptyEmoji}>💰</Text>
            <Text style={s.emptyTitle}>No expenses recorded</Text>
            <Text style={s.emptyDesc}>Tap + to log your first expense</Text>
          </FadeInView>
        ) : (
          <FlatList
            data={expenses}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.list}
            renderItem={({ item, index }) => {
              const cat = CATEGORIES.find(c => c.label === item.category) ?? CATEGORIES[CATEGORIES.length - 1];
              const dateStr = new Date(item.expense_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
              return (
                <FadeInView delay={index * 40}>
                  <Pressable style={s.row} onLongPress={() => handleDelete(item.id)}>
                    <View style={[s.rowBar, { backgroundColor: cat.color }]} />
                    <View style={[s.rowIcon, { backgroundColor: cat.color + '18' }]}>
                      <Text style={s.rowEmoji}>{cat.emoji}</Text>
                    </View>
                    <View style={s.rowInfo}>
                      <Text style={s.rowName}>{item.category}</Text>
                      <Text style={s.rowDate}>
                        {item.description ? `${item.description}  ·  ${dateStr}` : dateStr}
                      </Text>
                    </View>
                    <View style={s.rowRight}>
                      <Text style={s.rowAmount}>-{fmt(item.amount)}</Text>
                      <MaterialCommunityIcons name="dots-vertical" size={14} color={Colors.textMuted} />
                    </View>
                  </Pressable>
                </FadeInView>
              );
            }}
          />
        )}

        {/* ── FAB ── */}
        <AnimatedPressable
          style={s.fab}
          scaleDown={0.92}
          onPress={() => setShow(true)}
        >
          <LinearGradient
            colors={[Colors.red, '#990000']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={s.fabGrad}
          >
            <MaterialCommunityIcons name="plus" size={26} color="#fff" />
          </LinearGradient>
        </AnimatedPressable>

        {/* ── Add Expense Modal ── */}
        <Modal visible={show} transparent animationType="slide" onRequestClose={closeModal}>
          <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} />
          <Pressable style={s.backdrop} onPress={closeModal} />

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={s.sheetWrap}
          >
            <View style={s.sheet}>
              <View style={s.handle} />

              {/* Header */}
              <View style={s.sheetHeader}>
                <View style={s.sheetIconBox}>
                  <MaterialCommunityIcons name="trending-down" size={18} color={Colors.red} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.sheetTitle}>LOG EXPENSE</Text>
                  <Text style={s.sheetSub}>Record a new expense entry</Text>
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

                {/* ── Live preview ── */}
                {(previewAmt > 0 || selectedCat) && (
                  <View style={s.preview}>
                    <LinearGradient
                      colors={[Colors.red + '14', 'transparent']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFill} pointerEvents="none"
                    />
                    <View style={[s.previewBar, { backgroundColor: activeCatObj.color }]} />
                    <View style={[s.previewIcon, { backgroundColor: activeCatObj.color + '20' }]}>
                      <Text style={{ fontSize: 20 }}>{activeCatObj.emoji}</Text>
                    </View>
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={s.previewCat}>{activeCatObj.label}</Text>
                      {description.trim() ? (
                        <Text style={s.previewDesc} numberOfLines={1}>{description}</Text>
                      ) : (
                        <View style={[s.previewChip, { backgroundColor: activeCatObj.color + '18' }]}>
                          <Text style={[s.previewChipTxt, { color: activeCatObj.color }]}>TODAY</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[s.previewAmt, { color: Colors.red }]}>
                      {previewAmt > 0 ? `-${fmt(previewAmt)}` : '₹—'}
                    </Text>
                  </View>
                )}

                {/* ── Category grid ── */}
                <View style={s.sectionBlock}>
                  <Text style={s.sectionLabel}>CATEGORY</Text>
                  <View style={s.catGrid}>
                    {CATEGORIES.map(c => {
                      const active = selectedCat === c.label;
                      return (
                        <AnimatedPressable
                          key={c.label}
                          style={[s.catChip, active && { borderColor: c.color + '80', backgroundColor: c.color + '18' }]}
                          scaleDown={0.93}
                          onPress={() => setSelectedCat(c.label)}
                        >
                          <Text style={s.catChipEmoji}>{c.emoji}</Text>
                          <Text style={[s.catChipText, active && { color: c.color, fontFamily: Fonts.bold }]}>
                            {c.label}
                          </Text>
                          {active && (
                            <View style={[s.catChipDot, { backgroundColor: c.color }]} />
                          )}
                        </AnimatedPressable>
                      );
                    })}
                  </View>
                </View>

                {/* ── Fields ── */}
                <View style={s.fields}>
                  <Field
                    icon="currency-inr"
                    label="AMOUNT"
                    required
                    value={amount}
                    onChange={(v) => { setAmount(v); setFormError(''); }}
                    keyboardType="numeric"
                    placeholder="e.g. 5000"
                    prefix="₹"
                    accentColor={Colors.red}
                  />
                  <Field
                    icon="text-box-outline"
                    label="DESCRIPTION (OPTIONAL)"
                    value={description}
                    onChange={setDescription}
                    placeholder="What was this expense for?"
                    accentColor={Colors.red}
                  />
                </View>

                {/* ── Error ── */}
                {!!formError && (
                  <View style={s.errorBox}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={14} color={Colors.red} />
                    <Text style={s.errorText}>{formError}</Text>
                  </View>
                )}

                {/* ── Save button ── */}
                <AnimatedPressable
                  style={[s.savePressable, (saving || !amount.trim()) && { opacity: 0.5 }]}
                  onPress={handleSave}
                  disabled={saving || !amount.trim()}
                  scaleDown={0.97}
                >
                  <LinearGradient
                    colors={[Colors.red, '#990000']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={s.saveBtn}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <MaterialCommunityIcons name="check-circle-outline" size={18} color="#fff" />
                        <Text style={s.saveBtnText}>LOG EXPENSE</Text>
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

  // ── Period toggle ───────────────────────────────────────────────
  periodRow: { flexDirection: 'row', gap: 8, padding: 16, paddingBottom: 8 },
  periodChip: {
    flex: 1, paddingVertical: 9, borderRadius: 12,
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center',
  },
  periodChipActive: { backgroundColor: Colors.red + '20', borderColor: Colors.red + '60' },
  periodText:       { fontFamily: Fonts.bold, fontSize: 10, color: Colors.textMuted, letterSpacing: 1 },
  periodTextActive: { color: Colors.red },

  // ── Summary card ────────────────────────────────────────────────
  summaryCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    margin: 16, marginTop: 8, backgroundColor: Colors.bgCard,
    borderRadius: 18, padding: 18, borderWidth: 1, borderColor: Colors.red + '30',
    overflow: 'hidden',
  },
  summaryAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: Colors.red, borderTopLeftRadius: 18, borderBottomLeftRadius: 18 },
  summaryLeft:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  summaryIconBox: {
    width: 44, height: 44, borderRadius: 13,
    backgroundColor: Colors.red + '18',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.red + '30',
  },
  summaryLabel: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted, letterSpacing: 1.2 },
  summaryVal:   { fontFamily: Fonts.condensedBold, fontSize: 28, color: Colors.red },
  summarySub:   { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted },
  summaryRight: { gap: 6, alignItems: 'flex-end' },
  catPill:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  catPillEmoji: { fontSize: 12 },
  catPillAmt:   { fontFamily: Fonts.bold, fontSize: 11 },

  // ── Breakdown ───────────────────────────────────────────────────
  breakdownCard: {
    marginHorizontal: 16, marginBottom: 8,
    backgroundColor: Colors.bgCard, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border,
    padding: 16, gap: 10,
  },
  breakdownTitle: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted, letterSpacing: 1.5, marginBottom: 2 },
  barRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barEmoji: { fontSize: 14, width: 22, textAlign: 'center' },
  barTrack: { flex: 1, height: 5, backgroundColor: Colors.bgElevated, borderRadius: 3, overflow: 'hidden' },
  barFill:  { height: '100%', borderRadius: 3 },
  barPct:   { fontFamily: Fonts.bold, fontSize: 10, width: 30, textAlign: 'right' },
  barAmt:   { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted, width: 46, textAlign: 'right' },

  // ── List ────────────────────────────────────────────────────────
  list: { paddingHorizontal: 16, gap: 8, paddingBottom: 90 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.bgCard, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  rowBar:    { width: 3, alignSelf: 'stretch' },
  rowIcon:   { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginVertical: 12 },
  rowEmoji:  { fontSize: 20 },
  rowInfo:   { flex: 1, paddingVertical: 14 },
  rowName:   { fontFamily: Fonts.bold, fontSize: 14, color: Colors.text },
  rowDate:   { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  rowRight:  { flexDirection: 'row', alignItems: 'center', gap: 4, paddingRight: 14 },
  rowAmount: { fontFamily: Fonts.condensedBold, fontSize: 18, color: Colors.red },

  // ── Empty ───────────────────────────────────────────────────────
  empty:      { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 60 },
  emptyEmoji: { fontSize: 44, marginBottom: 12 },
  emptyTitle: { fontFamily: Fonts.bold, fontSize: 16, color: Colors.text },
  emptyDesc:  { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, marginTop: 6 },

  // ── FAB ─────────────────────────────────────────────────────────
  fab:     { position: 'absolute', right: 20, bottom: 20, borderRadius: 18, elevation: 8, shadowColor: Colors.red, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 },
  fabGrad: { width: 56, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },

  // ── Modal / Sheet ────────────────────────────────────────────────
  backdrop:  { ...StyleSheet.absoluteFillObject },
  sheetWrap: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    borderWidth: 1, borderColor: Colors.glassBorder,
    maxHeight: '92%', overflow: 'hidden',
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
    backgroundColor: Colors.red + '18',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.red + '30',
  },
  sheetTitle: { fontFamily: Fonts.condensedBold, fontSize: 20, color: Colors.text, letterSpacing: 0.5 },
  sheetSub:   { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted },
  closeBtn:   { width: 32, height: 32, borderRadius: 10, backgroundColor: Colors.bgElevated, justifyContent: 'center', alignItems: 'center' },
  sheetScroll: { padding: 20, gap: 16 },

  // ── Preview ──────────────────────────────────────────────────────
  preview: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.bgElevated,
    borderRadius: 16, borderWidth: 1, borderColor: Colors.red + '30',
    overflow: 'hidden',
  },
  previewBar:     { width: 3, alignSelf: 'stretch' },
  previewIcon:    { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginVertical: 12 },
  previewCat:     { fontFamily: Fonts.bold, fontSize: 14, color: Colors.text },
  previewDesc:    { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted },
  previewChip:    { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  previewChipTxt: { fontFamily: Fonts.bold, fontSize: 9, letterSpacing: 0.5 },
  previewAmt:     { fontFamily: Fonts.condensedBold, fontSize: 22, paddingRight: 14 },

  // ── Category section ─────────────────────────────────────────────
  sectionBlock: { gap: 10 },
  sectionLabel: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted, letterSpacing: 1.5 },
  catGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 8,
    borderRadius: 12, backgroundColor: Colors.bgElevated,
    borderWidth: 1, borderColor: Colors.border,
  },
  catChipEmoji: { fontSize: 14 },
  catChipText:  { fontFamily: Fonts.medium, fontSize: 11, color: Colors.textMuted },
  catChipDot:   { width: 5, height: 5, borderRadius: 3, marginLeft: 2 },

  // ── Fields ──────────────────────────────────────────────────────
  fields: { gap: 12 },

  // ── Error ───────────────────────────────────────────────────────
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.red + '14', borderRadius: 12,
    borderWidth: 1, borderColor: Colors.red + '30',
    paddingHorizontal: 14, paddingVertical: 10,
  },
  errorText: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.red, flex: 1 },

  // ── Save button ──────────────────────────────────────────────────
  savePressable: { marginTop: 4 },
  saveBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 16, paddingVertical: 17, minHeight: 56 },
  saveBtnText:   { fontFamily: Fonts.bold, fontSize: 14, color: '#fff', letterSpacing: 2 },
});
