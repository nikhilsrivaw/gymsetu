
  import { useState, useCallback } from 'react';
  import {
    View, Text, StyleSheet, FlatList,
    TouchableOpacity, ActivityIndicator, ScrollView, Alert,
  } from 'react-native';
  import { MaterialCommunityIcons } from '@expo/vector-icons';
  import { FAB, Portal, Modal, TextInput, SegmentedButtons } from 'react-native-paper';
  import { Stack, useFocusEffect } from 'expo-router';
  import { Colors } from '@/constants/colors';
  import { Fonts } from '@/constants/fonts';
  import AnimatedPressable from '@/components/AnimatedPressable';
  import FadeInView from '@/components/FadeInView';
  import { supabase } from '@/lib/supabase';
  import { useAuthStore } from '@/store/authStore';
  import type { PaymentMethod } from '@/types/database';
  import LottieView from '@/components/AppLottie';
  import { shareInvoice } from '@/lib/invoice';

  const methodIcon:  Record<string, string> = { cash: '💵', upi: '📱', card: '💳', bank_transfer: '🏦', other: '💸' }; 
  const methodColor: Record<string, string> = { cash: Colors.green, upi: '#4F6EF7', card: Colors.orange, bank_transfer:
   Colors.accent, other: Colors.textMuted };

  interface PaymentRow {
    id:             string;
    member_name:    string;
    member_phone:   string | null;
    amount:         number;
    payment_date:   string;
    date_raw:       string;
    receipt_number: string | null;
    payment_method: PaymentMethod;
    notes:          string | null;
  }

  interface MemberOption { id: string; full_name: string; phone?: string | null; }

  export default function PaymentsScreen() {
    const { profile, activeGymId, branches, gymProfile } = useAuthStore();

    const [payments, setPayments]               = useState<PaymentRow[]>([]);
    const [members, setMembers]                 = useState<MemberOption[]>([]);
    const [loading, setLoading]                 = useState(true);
    const [show, setShow]                       = useState(false);
    const [showPicker, setShowPicker]           = useState(false);
    const [selectedMember, setSelectedMember]   = useState<MemberOption | null>(null);
    const [amount, setAmount]                   = useState('');
    const [method, setMethod]                   = useState<string>('cash');
    const [note, setNote]                       = useState('');
    const [saving, setSaving]                   = useState(false);
    const [formError, setFormError]             = useState('');

    const ip = {
      mode: 'outlined' as const, style: styles.input,
      outlineColor: Colors.border, activeOutlineColor: Colors.accent,
      textColor: Colors.text, theme: { colors: { onSurfaceVariant: Colors.textMuted } },
    };

    const getGymIds = useCallback((): string[] => {
      const mainGymId = profile?.gym_id;
      if (!mainGymId) return [];
      if (activeGymId === 'all') return branches.length > 0 ? branches.map(b => b.id) : [mainGymId];
      return [activeGymId ?? mainGymId];
    }, [activeGymId, branches, profile?.gym_id]);

    const fetchPayments = useCallback(async () => {
      const gymIds = getGymIds();
      if (gymIds.length === 0) return;
      setLoading(true);

      try {
        const { data, error } = await supabase
          .from('payments')
          .select('id, amount, payment_date, payment_method, notes, member_id, receipt_number')
          .in('gym_id', gymIds)
          .order('payment_date', { ascending: false })
          .limit(50);

        if (error) throw error;
        if (!data) { setPayments([]); return; }

        const memberIds = [...new Set(data.map(p => p.member_id).filter(Boolean))];
        const nameMap: Record<string, string> = {};
        const phoneMap: Record<string, string | null> = {};

        // payments.member_id holds members.id, not profiles.id. Resolving it
        // against profiles matched nothing, so every row read "Unknown" — and
        // members added by import have no profiles row at all.
        if (memberIds.length > 0) {
          const { data: memberData } = await supabase
            .from('members')
            .select('id, full_name, phone')
            .in('id', memberIds);
          (memberData ?? []).forEach(m => { nameMap[m.id] = m.full_name; phoneMap[m.id] = m.phone; });
        }

        setPayments(data.map((p: any) => ({
          id:             p.id,
          member_name:    nameMap[p.member_id] ?? 'Unknown',
          member_phone:   phoneMap[p.member_id] ?? null,
          amount:         p.amount,
          payment_date:   new Date(p.payment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year:
  'numeric' }),
          date_raw:       p.payment_date,
          receipt_number: p.receipt_number ?? null,
          payment_method: p.payment_method,
          notes:          p.notes,
        })));
      } catch (err) {
        console.error('[Payments] fetchPayments error:', err);
      } finally {
        setLoading(false);
      }
    }, [getGymIds]);

    const fetchMembers = useCallback(async () => {
      const gymIds = getGymIds();
      if (gymIds.length === 0) return;
      try {
        // Must come from members: the id chosen here is written to
        // payments.member_id, which the member's Invoices screen reads by
        // members.id. A profiles.id here would file the payment under an id
        // that matches no member.
        const { data } = await supabase
          .from('members')
          .select('id, full_name, phone')
          .in('gym_id', gymIds)
          .neq('status', 'inactive')
          .order('full_name');
        if (data) setMembers(data);
      } catch (err) {
        console.error('[Payments] fetchMembers error:', err);
      }
    }, [getGymIds]);

    useFocusEffect(useCallback(() => {
      fetchPayments();
      fetchMembers();
    }, [fetchPayments, fetchMembers]));

    const total = payments.reduce((s, p) => s + p.amount, 0);

    const [sharingId, setSharingId] = useState<string | null>(null);
    const handleShareReceipt = async (p: PaymentRow) => {
      try {
        setSharingId(p.id);
        await shareInvoice({
          gym: {
            name:    gymProfile?.name ?? 'Your Gym',
            address: gymProfile?.address ?? null,
            phone:   gymProfile?.phone ?? null,
            logoUrl: gymProfile?.logo_url ?? null,
            gstin:   (gymProfile as any)?.gstin ?? null,
          },
          member:  { name: p.member_name, phone: p.member_phone, memberId: null },
          payment: {
            receiptNumber: p.receipt_number ?? p.id.slice(0, 8).toUpperCase(),
            date:          p.date_raw,
            method:        p.payment_method,
            amount:        p.amount,
            description:   p.notes,
          },
        });
      } catch (e) {
        Alert.alert('Could not create receipt', e instanceof Error ? e.message : 'Please try again.');
      } finally {
        setSharingId(null);
      }
    };

    const handleSave = async () => {
      setFormError('');

      if (!selectedMember) { setFormError('Please select a member.'); return; }
      if (!amount.trim())  { setFormError('Please enter an amount.'); return; }

      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        setFormError('Enter a valid amount greater than 0.');
        return;
      }

      const mainGymId = profile?.gym_id;
      const gymId = activeGymId === 'all' ? mainGymId : (activeGymId ?? mainGymId);
      if (!gymId) { setFormError('Gym not found. Please try again.'); return; }

      setSaving(true);
      try {
        const { error } = await supabase.from('payments').insert({
          gym_id:         gymId,
          member_id:      selectedMember.id,
          amount:         parsedAmount,
          payment_method: method as PaymentMethod,
          payment_date:   new Date().toISOString().split('T')[0],
          payment_type:   'full',
          notes:          note.trim() || null,
          created_by:     profile?.id,
        });
        if (error) throw error;

        // Send WhatsApp payment confirmation (fire-and-forget)
        if (selectedMember.phone) {
          supabase.functions.invoke('send-whatsapp', {
            body: {
              type: 'payment_confirm',
              phone: selectedMember.phone,
              gym_id: gymId,
              data: {
                member_name: selectedMember.full_name,
                amount: parsedAmount.toLocaleString('en-IN'),
                plan_name: method,
                gym_name: gymProfile?.name ?? 'Your Gym',
                expiry_date: '',
              },
            },
          }).catch(() => {});
        }

        setShow(false);
        setSelectedMember(null); setAmount(''); setMethod('cash'); setNote('');
        fetchPayments();
      } catch (err: any) {
        setFormError(err.message ?? 'Could not save payment. Try again.');
      } finally {
        setSaving(false);
      }
    };

    const handleCloseModal = () => {
      setShow(false);
      setFormError('');
    };

    // ── Loading ────────────────────────────────────────────────────
    if (loading) {
      return (
        <>
          <Stack.Screen options={{ title: 'Payments' }} />
          <View style={styles.loadingContainer}>
            <LottieView
              source={require('@/assets/animations/Turkey Power Walk.json')}
              autoPlay loop
              style={styles.loadingLottie}
            />
            <Text style={styles.loadingTitle}>LOADING PAYMENTS</Text>
            <Text style={styles.loadingSubtitle}>Crunching the numbers...</Text>
          </View>
        </>
      );
    }

    return (
      <>
        <Stack.Screen options={{ title: 'Payments' }} />
        <View style={styles.container}>

          {/* ── Summary Card ── */}
          <FadeInView delay={0}>
            <View style={styles.summaryCard}>
              <View style={styles.summaryAccent} />
              <View style={styles.summaryInner}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryVal}>₹{total.toLocaleString('en-IN')}</Text>
                  <Text style={styles.summaryLabel}>COLLECTED (LAST 50)</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryVal}>{payments.length}</Text>
                  <Text style={styles.summaryLabel}>TRANSACTIONS</Text>
                </View>
              </View>
            </View>
          </FadeInView>

          {/* ── List / Empty ── */}
          {payments.length === 0 ? (
            <FadeInView delay={150} style={styles.empty}>
              <Text style={styles.emptyEmoji}>💸</Text>
              <Text style={styles.emptyTitle}>No payments yet</Text>
              <Text style={styles.emptyDesc}>Tap + to record a payment</Text>
            </FadeInView>
          ) : (
            <FlatList
              data={payments}
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.list}
              renderItem={({ item, index }) => {
                const color = methodColor[item.payment_method] || Colors.accent;
                return (
                  <FadeInView delay={index * 40}>
                    <AnimatedPressable style={styles.payRow} scaleDown={0.98}>
                      <View style={[styles.payBar, { backgroundColor: color }]} />
                      <View style={[styles.payIcon, { backgroundColor: color + '18' }]}>
                        <Text style={styles.payEmoji}>{methodIcon[item.payment_method] || '💵'}</Text>
                      </View>
                      <View style={styles.payInfo}>
                        <Text style={styles.payName}>{item.member_name}</Text>
                        <Text style={styles.payMeta}>
                          {item.payment_date}  ·  {item.payment_method.replace('_', ' ').toUpperCase()}
                        </Text>
                        {item.notes ? <Text style={styles.payNote}>{item.notes}</Text> : null}
                      </View>
                      <View style={styles.payRight}>
                        <Text style={styles.payAmount}>+₹{item.amount.toLocaleString('en-IN')}</Text>
                        <TouchableOpacity
                          onPress={() => handleShareReceipt(item)}
                          disabled={sharingId === item.id}
                          hitSlop={8}
                          style={styles.receiptBtn}
                        >
                          {sharingId === item.id
                            ? <ActivityIndicator size="small" color={Colors.accent} />
                            : <>
                                <MaterialCommunityIcons name="receipt-text-outline" size={12} color={Colors.accent} />
                                <Text style={styles.receiptBtnText}>Receipt</Text>
                              </>}
                        </TouchableOpacity>
                      </View>
                    </AnimatedPressable>
                  </FadeInView>
                );
              }}
            />
          )}

          <FAB icon="plus" style={styles.fab} onPress={() => setShow(true)} color="#FFF" customSize={56} />

          {/* ── Record Payment Modal ── */}
          <Portal>
            <Modal visible={show} onDismiss={handleCloseModal} contentContainerStyle={styles.modal}>
              <Text style={styles.modalTitle}>RECORD PAYMENT</Text>

              <View style={styles.modalForm}>
                <TouchableOpacity style={styles.memberPicker} onPress={() => setShowPicker(true)}>
                  <Text style={selectedMember ? styles.pickerSelected : styles.pickerPlaceholder}>
                    {selectedMember ? selectedMember.full_name : 'Select member...'}
                  </Text>
                  <Text style={styles.pickerArrow}>▼</Text>
                </TouchableOpacity>

                <TextInput
                  label="Amount (₹)"
                  value={amount}
                  onChangeText={(v) => { setAmount(v); setFormError(''); }}
                  keyboardType="numeric"
                  {...ip}
                />

                <Text style={styles.fieldLabel}>METHOD</Text>
                <SegmentedButtons
                  value={method}
                  onValueChange={setMethod}
                  buttons={[
                    { value: 'cash', label: '💵 Cash' },
                    { value: 'upi',  label: '📱 UPI'  },
                    { value: 'card', label: '💳 Card' },
                  ]}
                  theme={{
                    colors: {
                      secondaryContainer: Colors.accentMuted,
                      onSecondaryContainer: Colors.accent,
                      onSurface: Colors.textMuted,
                      outline: Colors.border,
                    },
                  }}
                />

                <TextInput
                  label="Note (optional)"
                  value={note}
                  onChangeText={setNote}
                  {...ip}
                />

                {!!formError && (
                  <View style={styles.formErrorBox}>
                    <Text style={styles.formErrorText}>⚠️  {formError}</Text>
                  </View>
                )}
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity onPress={handleCloseModal}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <AnimatedPressable
                  style={[styles.recordBtn, (!selectedMember || !amount.trim()) && { opacity: 0.4 }]}
                  onPress={handleSave}
                  disabled={saving || !selectedMember || !amount.trim()}
                  scaleDown={0.95}
                >
                  {saving
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Text style={styles.recordBtnText}>RECORD</Text>
                  }
                </AnimatedPressable>
              </View>
            </Modal>
          </Portal>

          {/* ── Member Picker Modal ── */}
          <Portal>
            <Modal visible={showPicker} onDismiss={() => setShowPicker(false)}
  contentContainerStyle={styles.pickerModal}>
              <Text style={styles.modalTitle}>SELECT MEMBER</Text>
              <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
                {members.map(m => (
                  <TouchableOpacity
                    key={m.id}
                    style={[styles.pickerRow, selectedMember?.id === m.id && styles.pickerRowActive]}
                    onPress={() => { setSelectedMember(m); setShowPicker(false); setFormError(''); }}
                  >
                    <Text style={[styles.pickerRowText, selectedMember?.id === m.id && { color: Colors.accent }]}>     
                      {m.full_name}
                    </Text>
                  </TouchableOpacity>
                ))}
                {members.length === 0 && (
                  <Text style={styles.pickerEmpty}>No active members found. Add members first.</Text>
                )}
              </ScrollView>
            </Modal>
          </Portal>
        </View>
      </>
    );
  }

  const styles = StyleSheet.create({
    loadingContainer: { flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center' },
    loadingLottie:    { width: 200, height: 200 },
    loadingTitle:     { fontFamily: Fonts.condensedBold, fontSize: 16, color: Colors.text, letterSpacing: 3, marginTop:
   8 },
    loadingSubtitle:  { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, marginTop: 4 },

    container: { flex: 1, backgroundColor: Colors.bg },

    summaryCard:    { flexDirection: 'row', margin: 16, backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 
  1, borderColor: Colors.border, overflow: 'hidden' },
    summaryAccent:  { width: 3, backgroundColor: Colors.green },
    summaryInner:   { flex: 1, flexDirection: 'row', padding: 18 },
    summaryItem:    { flex: 1, alignItems: 'center', gap: 4 },
    summaryVal:     { fontFamily: Fonts.condensedBold, fontSize: 26, color: Colors.text },
    summaryLabel:   { fontFamily: Fonts.bold, fontSize: 8, color: Colors.textMuted, letterSpacing: 1.2 },
    summaryDivider: { width: 1, backgroundColor: Colors.border, marginHorizontal: 8 },

    list:      { paddingHorizontal: 16, gap: 6, paddingBottom: 80 },
    payRow:    { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgCard, borderRadius: 14,
  borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', minHeight: 66 },
    payBar:    { width: 3, alignSelf: 'stretch' },
    payIcon:   { width: 40, height: 40, borderRadius: 11, justifyContent: 'center', alignItems: 'center',
  marginHorizontal: 12 },
    payEmoji:  { fontSize: 18 },
    payInfo:   { flex: 1, paddingVertical: 10 },
    payName:   { fontFamily: Fonts.bold,    fontSize: 14, color: Colors.text },
    payMeta:   { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted, marginTop: 2 },
    payNote:   { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted + '99', marginTop: 2 },
    payAmount: { fontFamily: Fonts.condensedBold, fontSize: 18, color: Colors.green },
    payRight:  { alignItems: 'flex-end', gap: 7, marginRight: 12, paddingLeft: 6 },
    receiptBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 24,
      borderWidth: 1, borderColor: Colors.accent + '33', backgroundColor: Colors.accent + '12',
      borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4,
    },
    receiptBtnText: { fontFamily: Fonts.bold, fontSize: 10, color: Colors.accent, letterSpacing: 0.3 },

    empty:      { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 60 },
    emptyEmoji: { fontSize: 44, marginBottom: 12 },
    emptyTitle: { fontFamily: Fonts.bold,    fontSize: 16, color: Colors.text },
    emptyDesc:  { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, marginTop: 6 },

    fab: { position: 'absolute', right: 20, bottom: 20, backgroundColor: Colors.accent, borderRadius: 16 },

    modal:       { backgroundColor: Colors.bgCard, margin: 24, borderRadius: 20, padding: 24, borderWidth: 1,
  borderColor: Colors.border },
    pickerModal: { backgroundColor: Colors.bgCard, margin: 24, borderRadius: 20, padding: 24, borderWidth: 1,
  borderColor: Colors.border },
    modalTitle:  { fontFamily: Fonts.condensedBold, fontSize: 22, color: Colors.text, letterSpacing: 1, marginBottom:  
  20 },
    modalForm:   { gap: 14 },
    input:       { backgroundColor: Colors.bgElevated },
    fieldLabel:  { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted, letterSpacing: 1.5 },

    formErrorBox:  { backgroundColor: '#f8717115', borderRadius: 10, borderWidth: 1, borderColor: '#f8717130',
  paddingHorizontal: 12, paddingVertical: 10 },
    formErrorText: { fontFamily: Fonts.regular, fontSize: 12, color: '#f87171' },

    modalActions:  { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 16, marginTop: 24 }, 
    cancelText:    { fontFamily: Fonts.medium, fontSize: 14, color: Colors.textMuted },
    recordBtn:     { backgroundColor: Colors.accent, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12,     
  minWidth: 90, alignItems: 'center', justifyContent: 'center', minHeight: 42 },
    recordBtnText: { fontFamily: Fonts.bold, fontSize: 12, color: '#FFF', letterSpacing: 1 },

    memberPicker:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 
  Colors.bgElevated, borderRadius: 8, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14,
  paddingVertical: 14 },
    pickerSelected:    { fontFamily: Fonts.medium,  fontSize: 14, color: Colors.text },
    pickerPlaceholder: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textMuted },
    pickerArrow:       { fontFamily: Fonts.bold,    fontSize: 10, color: Colors.textMuted },
    pickerRow:         { paddingVertical: 14, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor:
  Colors.border },
    pickerRowActive:   { backgroundColor: Colors.accentMuted },
    pickerRowText:     { fontFamily: Fonts.medium, fontSize: 14, color: Colors.text },
    pickerEmpty:       { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, textAlign: 'center',        
  paddingVertical: 20 },
  });
