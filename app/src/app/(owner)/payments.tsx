   import { useState, useCallback } from 'react';
  import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert,
  ActivityIndicator, ScrollView } from 'react-native';
  import { FAB, Portal, Modal, TextInput, SegmentedButtons } from
  'react-native-paper';
  import { Stack, useFocusEffect } from 'expo-router';
  import { Colors } from '@/constants/colors';
  import { Fonts } from '@/constants/fonts';
  import AnimatedPressable from '@/components/AnimatedPressable';
  import FadeInView from '@/components/FadeInView';
  import { supabase } from '@/lib/supabase';
  import { useAuthStore } from '@/store/authStore';
  import type { PaymentMethod } from '@/types/database';

  const methodIcon:  Record<string, string> = { cash: '💵', upi: '📱', card: '💳',   
  bank_transfer: '🏦', other: '💸' };
  const methodColor: Record<string, string> = { cash: Colors.green, upi: '#4F6EF7',  
  card: Colors.orange, bank_transfer: Colors.accent, other: Colors.textMuted };      

  interface PaymentRow {
    id: string;
    member_name: string;
    amount: number;
    payment_date: string;
    payment_method: PaymentMethod;
    notes: string | null;
  }

  interface MemberOption { id: string; full_name: string; }

  export default function PaymentsScreen() {
    const { profile } = useAuthStore();
    const [payments, setPayments]     = useState<PaymentRow[]>([]);
    const [members, setMembers]       = useState<MemberOption[]>([]);
    const [loading, setLoading]       = useState(true);
    const [show, setShow]             = useState(false);
    const [showPicker, setShowPicker] = useState(false);
    const [selectedMember, setSelectedMember] = useState<MemberOption | null>(null); 
    const [amount, setAmount]         = useState('');
    const [method, setMethod]         = useState<string>('cash');
    const [note, setNote]             = useState('');
    const [saving, setSaving]         = useState(false);

    const ip = {
      mode: 'outlined' as const, style: styles.input,
      outlineColor: Colors.border, activeOutlineColor: Colors.accent,
      textColor: Colors.text, theme: { colors: { onSurfaceVariant: Colors.textMuted }
   },
    };

    const fetchPayments = useCallback(async () => {
      if (!profile?.gym_id) return;
      setLoading(true);

      const { data, error } = await supabase
        .from('payments')
        .select('id, amount, payment_date, payment_method, notes, members(full_name)')
        .eq('gym_id', profile.gym_id)
        .order('payment_date', { ascending: false })
        .limit(50);

      if (!error && data) {
        setPayments(data.map((p: any) => ({
          id:             p.id,
          member_name:    p.members?.full_name ?? 'Unknown',
          amount:         p.amount,
          payment_date:   new Date(p.payment_date).toLocaleDateString('en-IN', { day:
   '2-digit', month: 'short', year: 'numeric' }),
          payment_method: p.payment_method,
          notes:          p.notes,
        })));
      }
      setLoading(false);
    }, [profile?.gym_id]);

    const fetchMembers = useCallback(async () => {
      if (!profile?.gym_id) return;
      const { data } = await supabase
        .from('members')
        .select('id, full_name')
        .eq('gym_id', profile.gym_id)
        .eq('status', 'active')
        .order('full_name');
      if (data) setMembers(data);
    }, [profile?.gym_id]);

    useFocusEffect(useCallback(() => {
      fetchPayments();
      fetchMembers();
    }, [fetchPayments, fetchMembers]));

    const total = payments.reduce((s, p) => s + p.amount, 0);

    const handleSave = async () => {
      if (!selectedMember) { Alert.alert('Required', 'Select a member'); return; }   
      if (!amount.trim())  { Alert.alert('Required', 'Enter amount'); return; }      
      if (!profile?.gym_id) return;

      setSaving(true);
      const { error } = await supabase.from('payments').insert({
        gym_id:         profile.gym_id,
        member_id:      selectedMember.id,
        amount:         parseFloat(amount),
        payment_method: method as PaymentMethod,
        payment_date:   new Date().toISOString().split('T')[0],
        payment_type:   'full',
        notes:          note.trim() || null,
        created_by:     profile.id,
      });
      setSaving(false);
      if (error) { Alert.alert('Error', error.message); return; }
      setShow(false);
      setSelectedMember(null); setAmount(''); setMethod('cash'); setNote('');        
      fetchPayments();
    };

    return (
      <>
        <Stack.Screen options={{ title: 'Payments' }} />
        <View style={styles.container}>

          <FadeInView delay={0}>
            <View style={styles.summaryCard}>
              <View style={styles.summaryAccent} />
              <View style={styles.summaryInner}>
                <View style={styles.summaryItem}>
                  <Text
  style={styles.summaryVal}>₹{total.toLocaleString('en-IN')}</Text>
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

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={Colors.accent} size="large" />
            </View>
          ) : payments.length === 0 ? (
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
                      <View style={[styles.payIcon, { backgroundColor: color + '18'  
  }]}>
                        <Text
  style={styles.payEmoji}>{methodIcon[item.payment_method] || '💵'}</Text>
                      </View>
                      <View style={styles.payInfo}>
                        <Text style={styles.payName}>{item.member_name}</Text>       
                        <Text style={styles.payMeta}>
                          {item.payment_date}  ·  {item.payment_method.replace('_', ' ').toUpperCase()}
                        </Text>
                      </View>
                      <Text
  style={styles.payAmount}>+₹{item.amount.toLocaleString('en-IN')}</Text>
                    </AnimatedPressable>
                  </FadeInView>
                );
              }}
            />
          )}

          <FAB icon="plus" style={styles.fab} onPress={() => setShow(true)}
  color="#FFF" customSize={56} />

          {/* Record Payment Modal */}
          <Portal>
            <Modal visible={show} onDismiss={() => setShow(false)}
  contentContainerStyle={styles.modal}>
              <Text style={styles.modalTitle}>RECORD PAYMENT</Text>
              <View style={styles.modalForm}>

                {/* Member picker */}
                <TouchableOpacity
                  style={styles.memberPicker}
                  onPress={() => setShowPicker(true)}
                >
                  <Text style={selectedMember ? styles.pickerSelected :
  styles.pickerPlaceholder}>
                    {selectedMember ? selectedMember.full_name : 'Select member...'} 
                  </Text>
                  <Text style={styles.pickerArrow}>▼</Text>
                </TouchableOpacity>

                <TextInput label="Amount (₹)" value={amount} onChangeText={setAmount}
   keyboardType="numeric" {...ip} />

                <Text style={styles.fieldLabel}>METHOD</Text>
                <SegmentedButtons
                  value={method}
                  onValueChange={setMethod}
                  buttons={[
                    { value: 'cash', label: '💵 Cash' },
                    { value: 'upi',  label: '📱 UPI'  },
                    { value: 'card', label: '💳 Card' },
                  ]}
                  theme={{ colors: { secondaryContainer: Colors.accentMuted,
  onSecondaryContainer: Colors.accent, onSurface: Colors.textMuted, outline:
  Colors.border } }}
                />
                <TextInput label="Note (optional)" value={note}
  onChangeText={setNote} {...ip} />
              </View>
              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setShow(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <AnimatedPressable
                  style={[styles.recordBtn, (!selectedMember || !amount.trim()) && { 
  opacity: 0.4 }]}
                  onPress={handleSave}
                  disabled={saving || !selectedMember || !amount.trim()}
                  scaleDown={0.95}
                >
                  <Text style={styles.recordBtnText}>{saving ? 'SAVING...' :
  'RECORD'}</Text>
                </AnimatedPressable>
              </View>
            </Modal>
          </Portal>

          {/* Member picker modal */}
          <Portal>
            <Modal visible={showPicker} onDismiss={() => setShowPicker(false)}       
  contentContainerStyle={styles.pickerModal}>
              <Text style={styles.modalTitle}>SELECT MEMBER</Text>
              <ScrollView style={{ maxHeight: 360 }}
  showsVerticalScrollIndicator={false}>
                {members.map(m => (
                  <TouchableOpacity
                    key={m.id}
                    style={[styles.pickerRow, selectedMember?.id === m.id &&
  styles.pickerRowActive]}
                    onPress={() => { setSelectedMember(m); setShowPicker(false); }}  
                  >
                    <Text style={[styles.pickerRowText, selectedMember?.id === m.id  
  && { color: Colors.accent }]}>
                      {m.full_name}
                    </Text>
                  </TouchableOpacity>
                ))}
                {members.length === 0 && (
                  <Text style={styles.pickerEmpty}>No active members found. Add      
  members first.</Text>
                )}
              </ScrollView>
            </Modal>
          </Portal>
        </View>
      </>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    center:    { flex: 1, justifyContent: 'center', alignItems: 'center' },

    summaryCard:    { flexDirection: 'row', margin: 16, backgroundColor:
  Colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: Colors.border,       
  overflow: 'hidden' },
    summaryAccent:  { width: 3, backgroundColor: Colors.green },
    summaryInner:   { flex: 1, flexDirection: 'row', padding: 18 },
    summaryItem:    { flex: 1, alignItems: 'center', gap: 4 },
    summaryVal:     { fontFamily: Fonts.condensedBold, fontSize: 26, color:
  Colors.text },
    summaryLabel:   { fontFamily: Fonts.bold, fontSize: 8, color: Colors.textMuted,  
  letterSpacing: 1.2 },
    summaryDivider: { width: 1, backgroundColor: Colors.border, marginHorizontal: 8  
  },

    list:   { paddingHorizontal: 16, gap: 6, paddingBottom: 80 },
    payRow: { flexDirection: 'row', alignItems: 'center', backgroundColor:
  Colors.bgCard, borderRadius: 14, borderWidth: 1, borderColor: Colors.border,       
  overflow: 'hidden', minHeight: 66 },
    payBar:    { width: 3, alignSelf: 'stretch' },
    payIcon:   { width: 40, height: 40, borderRadius: 11, justifyContent: 'center',  
  alignItems: 'center', marginHorizontal: 12 },
    payEmoji:  { fontSize: 18 },
    payInfo:   { flex: 1 },
    payName:   { fontFamily: Fonts.bold,    fontSize: 14, color: Colors.text },      
    payMeta:   { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted,   
  marginTop: 2 },
    payAmount: { fontFamily: Fonts.condensedBold, fontSize: 18, color: Colors.green, 
  marginRight: 14 },

    empty:      { flex: 1, justifyContent: 'center', alignItems: 'center',
  paddingBottom: 60 },
    emptyEmoji: { fontSize: 44, marginBottom: 12 },
    emptyTitle: { fontFamily: Fonts.bold,    fontSize: 16, color: Colors.text },     
    emptyDesc:  { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted,  
  marginTop: 6 },

    fab: { position: 'absolute', right: 20, bottom: 20, backgroundColor:
  Colors.accent, borderRadius: 16 },

    modal: { backgroundColor: Colors.bgCard, margin: 24, borderRadius: 20, padding:  
  24, borderWidth: 1, borderColor: Colors.border },
    pickerModal: { backgroundColor: Colors.bgCard, margin: 24, borderRadius: 20,     
  padding: 24, borderWidth: 1, borderColor: Colors.border },
    modalTitle: { fontFamily: Fonts.condensedBold, fontSize: 22, color: Colors.text, 
  letterSpacing: 1, marginBottom: 20 },
    modalForm:  { gap: 14 },
    input:      { backgroundColor: Colors.bgElevated },
    fieldLabel: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted,      
  letterSpacing: 1.5 },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems:    
  'center', gap: 16, marginTop: 24 },
    cancelText:    { fontFamily: Fonts.medium, fontSize: 14, color: Colors.textMuted 
  },
    recordBtn:     { backgroundColor: Colors.accent, paddingHorizontal: 24,
  paddingVertical: 12, borderRadius: 12 },
    recordBtnText: { fontFamily: Fonts.bold, fontSize: 12, color: '#FFF',
  letterSpacing: 1 },

    memberPicker: { flexDirection: 'row', justifyContent: 'space-between',
  alignItems: 'center', backgroundColor: Colors.bgElevated, borderRadius: 8,
  borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14, paddingVertical:
   14 },
    pickerSelected:    { fontFamily: Fonts.medium, fontSize: 14, color: Colors.text  
  },
    pickerPlaceholder: { fontFamily: Fonts.regular, fontSize: 14, color:
  Colors.textMuted },
    pickerArrow:  { fontFamily: Fonts.bold, fontSize: 10, color: Colors.textMuted }, 
    pickerRow:    { paddingVertical: 14, paddingHorizontal: 4, borderBottomWidth: 1, 
  borderBottomColor: Colors.border },
    pickerRowActive: { backgroundColor: Colors.accentMuted, borderRadius: 8,
  paddingHorizontal: 8 },
    pickerRowText:   { fontFamily: Fonts.medium, fontSize: 14, color: Colors.text }, 
    pickerEmpty:     { fontFamily: Fonts.regular, fontSize: 13, color:
  Colors.textMuted, textAlign: 'center', paddingVertical: 20 },
  });
