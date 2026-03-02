  import { useState } from 'react';
  import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
  import { FAB, Portal, Modal, TextInput, SegmentedButtons } from
  'react-native-paper';                          
  import { Stack } from 'expo-router';
  import { Colors } from '@/constants/colors';
  import { Fonts } from '@/constants/fonts';                                           import AnimatedPressable from '@/components/AnimatedPressable';
  import FadeInView from '@/components/FadeInView';                                    import type { PaymentMethod } from '@/types/database';                             
                                                                                     
  const mockPayments: {                                                              
    id: string; member_name: string; amount: number;
    payment_date: string; payment_method: PaymentMethod;
  }[] = [
    { id: '1',  member_name: 'Rahul Sharma',  amount: 3500,  payment_date: '28 Feb  2026', payment_method: 'upi'           },
    { id: '2',  member_name: 'Priya Patel',   amount: 6000,  payment_date: '27 Feb  2026', payment_method: 'upi'           },
    { id: '3',  member_name: 'Rohan Das',     amount: 6000,  payment_date: '26 Feb  2026', payment_method: 'bank_transfer' },
    { id: '4',  member_name: 'Sneha Gupta',   amount: 1500,  payment_date: '25 Feb  2026', payment_method: 'cash'          },
    { id: '5',  member_name: 'Suresh Nair',   amount: 10000, payment_date: '24 Feb  2026', payment_method: 'card'          },
    { id: '6',  member_name: 'Neha Verma',    amount: 3500,  payment_date: '22 Feb  2026', payment_method: 'upi'           },
    { id: '7',  member_name: 'Divya Menon',   amount: 3500,  payment_date: '20 Feb  2026', payment_method: 'cash'          },
    { id: '8',  member_name: 'Arjun Reddy',   amount: 10000, payment_date: '18 Feb  2026', payment_method: 'upi'           },
    { id: '9',  member_name: 'Vikram Singh',  amount: 3500,  payment_date: '15 Feb  2026', payment_method: 'cash'          },
    { id: '10', member_name: 'Manish Tiwari', amount: 1500,  payment_date: '12 Feb 2026', payment_method: 'upi'           },
  ];

  const methodEmoji: Record<string, string> = { cash: '💵', upi: '📱', card: '💳',   
  bank_transfer: '🏦' };
  const methodColor: Record<string, string> = { cash: Colors.green, upi: '#4F6EF7',  
  card: Colors.orange, bank_transfer: Colors.accent };

  export default function PaymentsScreen() {
    const [payments]    = useState(mockPayments);
    const [show, setShow]           = useState(false);
    const [memberName, setMemberName] = useState('');
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

    const total = payments.reduce((s, p) => s + p.amount, 0);

    const handleSave = () => {
      if (!memberName.trim() || !amount.trim()) return;
      setSaving(true);
      setTimeout(() => {
        setSaving(false); setShow(false);
        setMemberName(''); setAmount(''); setMethod('cash'); setNote('');
      }, 400);
    };

    return (
      <>
        <Stack.Screen options={{ title: 'Payments' }} />
        <View style={styles.container}>

          {/* Summary */}
          <FadeInView delay={0}>
            <View style={styles.summaryCard}>
              <View style={styles.summaryAccent} />
              <View style={styles.summaryInner}>
                <View style={styles.summaryItem}>
                  <Text
  style={styles.summaryVal}>₹{total.toLocaleString('en-IN')}</Text>
                  <Text style={styles.summaryLabel}>COLLECTED THIS MONTH</Text>      
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryVal}>{payments.length}</Text>
                  <Text style={styles.summaryLabel}>TRANSACTIONS</Text>
                </View>
              </View>
            </View>
          </FadeInView>

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
                  <FadeInView delay={index * 45}>
                    <AnimatedPressable style={styles.payRow} scaleDown={0.98}>       
                      {/* left bar */}
                      <View style={[styles.payBar, { backgroundColor: color }]} />   

                      <View style={[styles.payIcon, { backgroundColor: color + '18'  
  }]}>
                        <Text
  style={styles.payEmoji}>{methodEmoji[item.payment_method] || '💵'}</Text>
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

          <Portal>
            <Modal visible={show} onDismiss={() => setShow(false)}
  contentContainerStyle={styles.modal}>
              <Text style={styles.modalTitle}>RECORD PAYMENT</Text>
              <View style={styles.modalForm}>
                <TextInput label="Member name" value={memberName}
  onChangeText={setMemberName} {...ip} />
                <TextInput label="Amount (₹)"  value={amount}
  onChangeText={setAmount}     keyboardType="numeric" {...ip} />
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
                  style={[styles.recordBtn, (!memberName.trim() || !amount.trim()) &&
   { opacity: 0.4 }]}
                  onPress={handleSave}
                  disabled={saving || !memberName.trim() || !amount.trim()}
                  scaleDown={0.95}
                >
                  <Text style={styles.recordBtnText}>{saving ? 'SAVING...' :
  'RECORD'}</Text>
                </AnimatedPressable>
              </View>
            </Modal>
          </Portal>
        </View>
      </>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },

    // Summary
    summaryCard: {
      flexDirection: 'row', margin: 16,
      backgroundColor: Colors.bgCard, borderRadius: 16,
      borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
    },
    summaryAccent: { width: 3, backgroundColor: Colors.green },
    summaryInner:  { flex: 1, flexDirection: 'row', padding: 18 },
    summaryItem:   { flex: 1, alignItems: 'center', gap: 4 },
    summaryVal: {
      fontFamily: Fonts.condensedBold,
      fontSize: 26, color: Colors.text,
    },
    summaryLabel: {
      fontFamily: Fonts.bold,
      fontSize: 8, color: Colors.textMuted, letterSpacing: 1.2,
    },
    summaryDivider: { width: 1, backgroundColor: Colors.border, marginHorizontal: 8  
  },

    // List
    list:   { paddingHorizontal: 16, gap: 6, paddingBottom: 80 },
    payRow: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: Colors.bgCard,
      borderRadius: 14,
      borderWidth: 1, borderColor: Colors.border,
      overflow: 'hidden', minHeight: 66,
    },
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

    // Empty
    empty:      { flex: 1, justifyContent: 'center', alignItems: 'center',
  paddingBottom: 60 },
    emptyEmoji: { fontSize: 44, marginBottom: 12 },
    emptyTitle: { fontFamily: Fonts.bold,    fontSize: 16, color: Colors.text    },  
    emptyDesc:  { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted,  
  marginTop: 6 },

    fab: { position: 'absolute', right: 20, bottom: 20, backgroundColor:
  Colors.accent, borderRadius: 16 },

    // Modal
    modal: {
      backgroundColor: Colors.bgCard, margin: 24, borderRadius: 20,
      padding: 24, borderWidth: 1, borderColor: Colors.border,
    },
    modalTitle: {
      fontFamily: Fonts.condensedBold,
      fontSize: 22, color: Colors.text, letterSpacing: 1, marginBottom: 20,
    },
    modalForm:  { gap: 14 },
    input:      { backgroundColor: Colors.bgElevated },
    fieldLabel: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted,      
  letterSpacing: 1.5 },
    modalActions: {
      flexDirection: 'row', justifyContent: 'flex-end',
      alignItems: 'center', gap: 16, marginTop: 24,
    },
    cancelText:    { fontFamily: Fonts.medium, fontSize: 14, color: Colors.textMuted 
  },
    recordBtn:     { backgroundColor: Colors.accent, paddingHorizontal: 24,
  paddingVertical: 12, borderRadius: 12 },
    recordBtnText: { fontFamily: Fonts.bold, fontSize: 12, color: '#FFF',
  letterSpacing: 1 },
  });