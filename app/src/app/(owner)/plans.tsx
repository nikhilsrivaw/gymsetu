 import { useState } from 'react';
  import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';   import { FAB, Portal, Modal, TextInput } from 'react-native-paper';                  import { Stack } from 'expo-router';                                                 import { Colors } from '@/constants/colors';                                         import { Fonts } from '@/constants/fonts';                                         
  import AnimatedPressable from '@/components/AnimatedPressable';                      import FadeInView from '@/components/FadeInView';                                  
  import type { MembershipPlan } from '@/types/database';                                                                                                                 
  const planColors = [Colors.accent, Colors.green, '#4F6EF7', Colors.orange,         
  '#EC4899'];

  const mockPlans: (MembershipPlan & { member_count?: number })[] = [
    { id: '1', gym_id: 'g1', name: '1 Month Basic',     duration_days: 30,  price:   
  1500,  description: 'Access to gym floor and basic equipment',
  is_active: true, created_at: '2025-09-01', member_count: 28 },
    { id: '2', gym_id: 'g1', name: '3 Month Standard',  duration_days: 90,  price:   
  3500,  description: 'Full gym access with locker facility',
  is_active: true, created_at: '2025-09-01', member_count: 45 },
    { id: '3', gym_id: 'g1', name: '6 Month Premium',   duration_days: 180, price:   
  6000,  description: 'Full access + personal trainer 2×/week',
  is_active: true, created_at: '2025-09-01', member_count: 32 },
    { id: '4', gym_id: 'g1', name: '1 Year Ultimate',   duration_days: 365, price:   
  10000, description: 'All-inclusive: gym, trainer, supplements, steam',
  is_active: true, created_at: '2025-09-01', member_count: 18 },
    { id: '5', gym_id: 'g1', name: 'Day Pass',          duration_days: 1,   price:   
  200,   description: 'Single day access for walk-ins',
  is_active: true, created_at: '2025-10-15', member_count: 5  },
  ];

  const fmtDur = (d: number) =>
    d >= 365 ? `${Math.round(d / 365)} yr` : d >= 30 ? `${Math.round(d / 30)} mo` :  
  `${d} day`;

  export default function PlansScreen() {
    const [plans]             = useState(mockPlans);
    const [show, setShow]     = useState(false);
    const [name, setName]     = useState('');
    const [dur, setDur]       = useState('');
    const [price, setPrice]   = useState('');
    const [desc, setDesc]     = useState('');
    const [saving, setSaving] = useState(false);

    const ip = {
      mode: 'outlined' as const, style: styles.input,
      outlineColor: Colors.border, activeOutlineColor: Colors.accent,
      textColor: Colors.text, theme: { colors: { onSurfaceVariant: Colors.textMuted }
   },
    };

    const handleSave = () => {
      if (!name.trim() || !dur.trim() || !price.trim()) return;
      setSaving(true);
      setTimeout(() => {
        setSaving(false); setShow(false);
        setName(''); setDur(''); setPrice(''); setDesc('');
      }, 400);
    };

    return (
      <>
        <Stack.Screen options={{ title: 'Plans' }} />
        <View style={styles.container}>

          {/* Summary strip */}
          <FadeInView delay={0}>
            <View style={styles.strip}>
              <View style={styles.stripItem}>
                <Text style={styles.stripVal}>{plans.length}</Text>
                <Text style={styles.stripLabel}>PLANS</Text>
              </View>
              <View style={styles.stripDivider} />
              <View style={styles.stripItem}>
                <Text style={styles.stripVal}>{plans.reduce((s, p) => s +
  (p.member_count || 0), 0)}</Text>
                <Text style={styles.stripLabel}>MEMBERS</Text>
              </View>
              <View style={styles.stripDivider} />
              <View style={styles.stripItem}>
                <Text style={styles.stripVal}>{plans.filter(p =>
  p.is_active).length}</Text>
                <Text style={styles.stripLabel}>ACTIVE</Text>
              </View>
            </View>
          </FadeInView>

          {plans.length === 0 ? (
            <FadeInView delay={100} style={styles.empty}>
              <Text style={styles.emptyEmoji}>📋</Text>
              <Text style={styles.emptyTitle}>No plans yet</Text>
              <Text style={styles.emptyDesc}>Create membership plans to get
  started</Text>
            </FadeInView>
          ) : (
            <FlatList
              data={plans}
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.list}
              renderItem={({ item, index }) => {
                const color = planColors[index % planColors.length];
                return (
                  <FadeInView delay={index * 55}>
                    <AnimatedPressable style={styles.planCard} scaleDown={0.97}>     
                      {/* left accent bar */}
                      <View style={[styles.planBar, { backgroundColor: color }]} />  

                      <View style={styles.planInner}>
                        {/* Top row */}
                        <View style={styles.planTop}>
                          <Text style={styles.planName}>{item.name}</Text>
                          <Text style={[styles.planPrice, { color }]}>
                            ₹{item.price.toLocaleString('en-IN')}
                          </Text>
                        </View>

                        {/* Desc */}
                        <Text style={styles.planDesc}
  numberOfLines={1}>{item.description}</Text>

                        {/* Bottom chips */}
                        <View style={styles.planChips}>
                          <View style={[styles.chip, { backgroundColor: color + '18' 
  }]}>
                            <Text style={[styles.chipText, { color }]}>⏱
  {fmtDur(item.duration_days)}</Text>
                          </View>
                          {item.member_count !== undefined && (
                            <View style={styles.chip}>
                              <Text style={styles.chipText}>👥 {item.member_count}   
  members</Text>
                            </View>
                          )}
                          <View style={[styles.chip, { backgroundColor:
  item.is_active ? Colors.greenMuted : Colors.redMuted }]}>
                            <View style={[styles.chipDot, { backgroundColor:
  item.is_active ? Colors.green : Colors.red }]} />
                            <Text style={[styles.chipText, { color: item.is_active ? 
  Colors.green : Colors.red }]}>
                              {item.is_active ? 'ACTIVE' : 'INACTIVE'}
                            </Text>
                          </View>
                        </View>
                      </View>
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
              <Text style={styles.modalTitle}>NEW PLAN</Text>
              <View style={styles.modalForm}>
                <TextInput label="Plan name" value={name} onChangeText={setName}     
  {...ip} />
                <View style={styles.row}>
                  <TextInput label="Duration (days)" value={dur}
  onChangeText={setDur}   keyboardType="numeric" {...ip} style={[styles.input, {     
  flex: 1 }]} />
                  <TextInput label="Price (₹)"       value={price}
  onChangeText={setPrice} keyboardType="numeric" {...ip} style={[styles.input, {     
  flex: 1 }]} />
                </View>
                <TextInput label="Description (optional)" value={desc}
  onChangeText={setDesc} multiline {...ip} />
              </View>
              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setShow(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <AnimatedPressable
                  style={[styles.createBtn, (!name.trim() || !dur.trim() ||
  !price.trim()) && { opacity: 0.4 }]}
                  onPress={handleSave}
                  disabled={saving || !name.trim() || !dur.trim() || !price.trim()}  
                  scaleDown={0.95}
                >
                  <Text style={styles.createBtnText}>{saving ? 'CREATING...' :       
  'CREATE'}</Text>
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

    // Strip
    strip: {
      flexDirection: 'row', margin: 16,
      backgroundColor: Colors.bgCard, borderRadius: 14,
      borderWidth: 1, borderColor: Colors.border, padding: 16,
    },
    stripItem:    { flex: 1, alignItems: 'center', gap: 3 },
    stripVal:     { fontFamily: Fonts.condensedBold, fontSize: 24, color: Colors.text
   },
    stripLabel:   { fontFamily: Fonts.bold, fontSize: 8, color: Colors.textMuted,    
  letterSpacing: 1.2 },
    stripDivider: { width: 1, backgroundColor: Colors.border, marginHorizontal: 8 }, 

    // List
    list: { paddingHorizontal: 16, gap: 8, paddingBottom: 80 },
    planCard: {
      flexDirection: 'row',
      backgroundColor: Colors.bgCard, borderRadius: 14,
      borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
    },
    planBar:   { width: 3 },
    planInner: { flex: 1, padding: 14, gap: 6 },
    planTop:   { flexDirection: 'row', justifyContent: 'space-between', alignItems:  
  'center' },
    planName:  { fontFamily: Fonts.bold, fontSize: 15, color: Colors.text, flex: 1 },
    planPrice: { fontFamily: Fonts.condensedBold, fontSize: 20 },
    planDesc:  { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted }, 
    planChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },     
    chip: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
      backgroundColor: Colors.bgElevated,
    },
    chipDot:  { width: 5, height: 5, borderRadius: 3 },
    chipText: { fontFamily: Fonts.bold, fontSize: 8, color: Colors.textMuted,        
  letterSpacing: 0.5 },

    // Empty
    empty:      { flex: 1, justifyContent: 'center', alignItems: 'center',
  paddingBottom: 60 },
    emptyEmoji: { fontSize: 44, marginBottom: 12 },
    emptyTitle: { fontFamily: Fonts.bold,    fontSize: 16, color: Colors.text      },
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
    row:        { flexDirection: 'row', gap: 12 },
    modalActions: {
      flexDirection: 'row', justifyContent: 'flex-end',
      alignItems: 'center', gap: 16, marginTop: 24,
    },
    cancelText:    { fontFamily: Fonts.medium, fontSize: 14, color: Colors.textMuted 
  },
    createBtn:     { backgroundColor: Colors.accent, paddingHorizontal: 24,
  paddingVertical: 12, borderRadius: 12 },
    createBtnText: { fontFamily: Fonts.bold, fontSize: 12, color: '#FFF',
  letterSpacing: 1 },
  });
