  
  import { useState, useCallback } from 'react';                                                                       import { View, Text, StyleSheet, FlatList, Alert, ActivityIndicator, Pressable, TouchableOpacity } from            
  'react-native';                                                                                                    
  import { FAB, Portal, Modal, TextInput } from 'react-native-paper';                                                
  import { Stack, useFocusEffect } from 'expo-router';
  import { MaterialCommunityIcons } from '@expo/vector-icons';
  import { Colors } from '@/constants/colors';
  import { Fonts } from '@/constants/fonts';
  import AnimatedPressable from '@/components/AnimatedPressable';
  import FadeInView from '@/components/FadeInView';
  import { supabase } from '@/lib/supabase';
  import { useAuthStore } from '@/store/authStore';

  type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

  const STATUSES = [
    { label: 'Good',        color: Colors.green,   icon: 'check-circle-outline'  as IconName },
    { label: 'Needs Service',color: Colors.orange, icon: 'wrench-outline'        as IconName },
    { label: 'Broken',      color: Colors.red,     icon: 'alert-circle-outline'  as IconName },
    { label: 'Retired',     color: Colors.textMuted,icon: 'archive-outline'      as IconName },
  ];

  interface EquipmentRow {
    id: string;
    name: string;
    status: string;
    purchase_date: string | null;
    last_service: string | null;
    next_service: string | null;
    notes: string | null;
  }

  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  const daysUntil = (d: string | null) => {
    if (!d) return null;
    return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
  };

  export default function EquipmentScreen() {
    const { profile, activeGymId, branches } = useAuthStore();
    const [equipment, setEquipment] = useState<EquipmentRow[]>([]);
    const [loading, setLoading]     = useState(true);
    const [show, setShow]           = useState(false);
    const [saving, setSaving]       = useState(false);
    const [selectedStatus, setSelectedStatus] = useState('Good');
    const [name, setName]             = useState('');
    const [purchaseDate, setPurchaseDate] = useState('');
    const [lastService, setLastService]   = useState('');
    const [nextService, setNextService]   = useState('');
    const [notes, setNotes]           = useState('');

    const ip = {
      mode: 'outlined' as const, style: styles.input,
      outlineColor: Colors.border, activeOutlineColor: Colors.accent,
      textColor: Colors.text, theme: { colors: { onSurfaceVariant: Colors.textMuted } },
    };

    const getGymIds = useCallback((): string[] => {
      const mainGymId = (profile as any)?.gym_id;
      if (!mainGymId) return [];
      if (activeGymId === 'all') return branches.length > 0 ? branches.map(b => b.id) : [mainGymId];
      return [activeGymId ?? mainGymId];
    }, [activeGymId, branches, profile]);

    const fetchEquipment = useCallback(async () => {
      const gymIds = getGymIds();
      if (gymIds.length === 0) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .in('gym_id', gymIds)
        .order('created_at', { ascending: false });
      if (!error && data) setEquipment(data);
      setLoading(false);
    }, [getGymIds]);

    useFocusEffect(useCallback(() => { fetchEquipment(); }, [fetchEquipment]));

    const parseDate = (raw: string): string | null => {
      const parts = raw.split('/');
      if (parts.length === 3 && parts[2].length === 4)
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      return null;
    };

    const handleSave = async () => {
      if (!name.trim()) { Alert.alert('Required', 'Enter equipment name'); return; }
      const gymIds  = getGymIds();
      if (gymIds.length === 0) return;
      const mainGymId = (profile as any)?.gym_id;
      const gymId   = activeGymId === 'all' ? mainGymId : gymIds[0];

      setSaving(true);
      const { error } = await supabase.from('equipment').insert({
        gym_id:        gymId,
        name:          name.trim(),
        status:        selectedStatus.toLowerCase().replace(' ', '_'),
        purchase_date: purchaseDate ? parseDate(purchaseDate) : null,
        last_service:  lastService  ? parseDate(lastService)  : null,
        next_service:  nextService  ? parseDate(nextService)  : null,
        notes:         notes.trim() || null,
      });
      setSaving(false);
      if (error) { Alert.alert('Error', error.message); return; }
      setShow(false);
      setName(''); setPurchaseDate(''); setLastService(''); setNextService(''); setNotes('');
  setSelectedStatus('Good');
      fetchEquipment();
    };

    const handleUpdateStatus = (item: EquipmentRow, newStatus: string) => {
      Alert.alert('Update Status', `Mark "${item.name}" as ${newStatus}?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Update', onPress: async () => {
          await supabase.from('equipment').update({ status: newStatus.toLowerCase().replace(' ', '_') }).eq('id',    
  item.id);
          fetchEquipment();
        }},
      ]);
    };

    const handleDelete = (id: string, name: string) => {
      Alert.alert('Delete', `Remove "${name}" from equipment list?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => {
          await supabase.from('equipment').delete().eq('id', id);
          fetchEquipment();
        }},
      ]);
    };

    const getStatus = (raw: string) =>
      STATUSES.find(s => s.label.toLowerCase().replace(' ', '_') === raw) ?? STATUSES[0];

    const needsService = equipment.filter(e => {
      const days = daysUntil(e.next_service);
      return days !== null && days <= 7;
    }).length;

    const broken = equipment.filter(e => e.status === 'broken').length;

    return (
      <>
        <Stack.Screen options={{ title: 'Equipment Log' }} />
        <View style={styles.container}>

          <FadeInView delay={0}>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statVal}>{equipment.length}</Text>
                <Text style={styles.statLabel}>TOTAL</Text>
              </View>
              <View style={[styles.statBox, { borderColor: Colors.orange + '40' }]}>
                <Text style={[styles.statVal, { color: Colors.orange }]}>{needsService}</Text>
                <Text style={styles.statLabel}>DUE SERVICE</Text>
              </View>
              <View style={[styles.statBox, { borderColor: Colors.red + '40' }]}>
                <Text style={[styles.statVal, { color: Colors.red }]}>{broken}</Text>
                <Text style={styles.statLabel}>BROKEN</Text>
              </View>
            </View>
          </FadeInView>

          {needsService > 0 && (
            <FadeInView delay={40}>
              <View style={styles.alertBanner}>
                <MaterialCommunityIcons name="wrench-clock" size={16} color={Colors.orange} />
                <Text style={styles.alertText}>{needsService} item{needsService !== 1 ? 's' : ''} due for service    
  within 7 days</Text>
              </View>
            </FadeInView>
          )}

          {loading ? (
            <View style={styles.center}><ActivityIndicator color={Colors.accent} size="large" /></View>
          ) : equipment.length === 0 ? (
            <FadeInView delay={100} style={styles.empty}>
              <Text style={styles.emptyEmoji}>🏋️</Text>
              <Text style={styles.emptyTitle}>No equipment logged</Text>
              <Text style={styles.emptyDesc}>Tap + to add your first equipment</Text>
            </FadeInView>
          ) : (
            <FlatList
              data={equipment}
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.list}
              renderItem={({ item, index }) => {
                const status   = getStatus(item.status);
                const nextDays = daysUntil(item.next_service);
                const serviceUrgent = nextDays !== null && nextDays <= 7;
                return (
                  <FadeInView delay={index * 40}>
                    <Pressable
                      style={styles.card}
                      onLongPress={() => handleDelete(item.id, item.name)}
                    >
                      <View style={[styles.cardBar, { backgroundColor: status.color }]} />
                      <View style={styles.cardInner}>
                        <View style={styles.cardTop}>
                          <View style={styles.cardTitleRow}>
                            <Text style={styles.cardName}>{item.name}</Text>
                            <View style={[styles.statusBadge, { backgroundColor: status.color + '18' }]}>
                              <MaterialCommunityIcons name={status.icon} size={11} color={status.color} />
                              <Text style={[styles.statusText, { color: status.color }]}>
                                {status.label.toUpperCase()}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.cardDates}>
                            {item.purchase_date && (
                              <Text style={styles.dateText}>🛒 Bought: {fmtDate(item.purchase_date)}</Text>
                            )}
                            {item.last_service && (
                              <Text style={styles.dateText}>🔧 Last service: {fmtDate(item.last_service)}</Text>     
                            )}
                            {item.next_service && (
                              <Text style={[styles.dateText, serviceUrgent && { color: Colors.orange }]}>
                                ⏰ Next service: {fmtDate(item.next_service)}
                                {serviceUrgent && nextDays !== null && ` (${nextDays <= 0 ? 'OVERDUE' :
  `${nextDays}d`})`}
                              </Text>
                            )}
                            {item.notes && (
                              <Text style={styles.notesText} numberOfLines={1}>📝 {item.notes}</Text>
                            )}
                          </View>
                        </View>
                        <View style={styles.actionRow}>
                          {STATUSES.filter(s => s.label !== status.label).slice(0, 2).map(s => (
                            <TouchableOpacity
                              key={s.label}
                              style={[styles.actionBtn, { borderColor: s.color + '40', backgroundColor: s.color +    
  '10' }]}
                              onPress={() => handleUpdateStatus(item, s.label)}
                            >
                              <MaterialCommunityIcons name={s.icon} size={11} color={s.color} />
                              <Text style={[styles.actionBtnText, { color: s.color }]}>{s.label}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    </Pressable>
                  </FadeInView>
                );
              }}
            />
          )}

          <FAB icon="plus" style={styles.fab} onPress={() => setShow(true)} color="#FFF" customSize={56} />

          <Portal>
            <Modal visible={show} onDismiss={() => setShow(false)} contentContainerStyle={styles.modal}>
              <Text style={styles.modalTitle}>ADD EQUIPMENT</Text>

              <Text style={styles.fieldLabel}>STATUS</Text>
              <View style={styles.statusRow}>
                {STATUSES.map(s => (
                  <AnimatedPressable
                    key={s.label}
                    style={[styles.statusChip, selectedStatus === s.label && { borderColor: s.color, backgroundColor:
   s.color + '15' }]}
                    scaleDown={0.94}
                    onPress={() => setSelectedStatus(s.label)}
                  >
                    <MaterialCommunityIcons name={s.icon} size={13} color={selectedStatus === s.label ? s.color :    
  Colors.textMuted} />
                    <Text style={[styles.statusChipText, selectedStatus === s.label && { color: s.color, fontFamily: 
  Fonts.bold }]}>
                      {s.label}
                    </Text>
                  </AnimatedPressable>
                ))}
              </View>

              <View style={styles.modalForm}>
                <TextInput label="Equipment Name *" value={name} onChangeText={setName} {...ip} />
                <TextInput label="Purchase Date (DD/MM/YYYY)" value={purchaseDate} onChangeText={setPurchaseDate}    
  keyboardType="numeric" {...ip} />
                <TextInput label="Last Service (DD/MM/YYYY)"  value={lastService}  onChangeText={setLastService}     
  keyboardType="numeric" {...ip} />
                <TextInput label="Next Service (DD/MM/YYYY)"  value={nextService}  onChangeText={setNextService}     
  keyboardType="numeric" {...ip} />
                <TextInput label="Notes (optional)" value={notes} onChangeText={setNotes} multiline {...ip} />       
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setShow(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <AnimatedPressable
                  style={[styles.saveBtn, !name.trim() && { opacity: 0.4 }]}
                  onPress={handleSave}
                  disabled={saving || !name.trim()}
                  scaleDown={0.95}
                >
                  <Text style={styles.saveBtnText}>{saving ? 'SAVING...' : 'ADD'}</Text>
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
    center:    { flex: 1, justifyContent: 'center', alignItems: 'center' },

    statsRow: { flexDirection: 'row', gap: 8, margin: 16, marginBottom: 8 },
    statBox:  { flex: 1, backgroundColor: Colors.bgCard, borderRadius: 14, borderWidth: 1, borderColor:
  Colors.border, padding: 14, alignItems: 'center', gap: 4 },
    statVal:  { fontFamily: Fonts.condensedBold, fontSize: 28, color: Colors.text },
    statLabel:{ fontFamily: Fonts.bold, fontSize: 8, color: Colors.textMuted, letterSpacing: 1 },

    alertBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginBottom: 8,        
  backgroundColor: Colors.orange + '12', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: Colors.orange + 
  '30' },
    alertText:   { fontFamily: Fonts.medium, fontSize: 12, color: Colors.orange, flex: 1 },

    list: { paddingHorizontal: 16, gap: 8, paddingBottom: 80 },
    card: { flexDirection: 'row', backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor:     
  Colors.border, overflow: 'hidden' },
    cardBar:      { width: 3 },
    cardInner:    { flex: 1, padding: 14, gap: 10 },
    cardTop:      { gap: 6 },
    cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    cardName:     { fontFamily: Fonts.bold, fontSize: 15, color: Colors.text, flex: 1 },
    statusBadge:  { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4,    
  borderRadius: 8 },
    statusText:   { fontFamily: Fonts.bold, fontSize: 8, letterSpacing: 0.5 },
    cardDates:    { gap: 3 },
    dateText:     { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted },
    notesText:    { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, fontStyle: 'italic' },
    actionRow:    { flexDirection: 'row', gap: 8 },
    actionBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5,   
  borderRadius: 8, borderWidth: 1 },
    actionBtnText:{ fontFamily: Fonts.bold, fontSize: 9, letterSpacing: 0.5 },

    empty:      { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 60 },
    emptyEmoji: { fontSize: 44, marginBottom: 12 },
    emptyTitle: { fontFamily: Fonts.bold, fontSize: 16, color: Colors.text },
    emptyDesc:  { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, marginTop: 6 },

    fab: { position: 'absolute', right: 20, bottom: 20, backgroundColor: '#A78BFA', borderRadius: 16 },

    modal:      { backgroundColor: Colors.bgCard, margin: 20, borderRadius: 24, padding: 24, borderWidth: 1,
  borderColor: Colors.border },
    modalTitle: { fontFamily: Fonts.condensedBold, fontSize: 22, color: Colors.text, letterSpacing: 1, marginBottom: 
  16 },
    fieldLabel: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted, letterSpacing: 1.5, marginBottom: 8  
  },
    statusRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    statusChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 7,     
  borderRadius: 10, backgroundColor: Colors.bgElevated, borderWidth: 1, borderColor: Colors.border },
    statusChipText: { fontFamily: Fonts.medium, fontSize: 11, color: Colors.textMuted },
    modalForm:   { gap: 12 },
    input:       { backgroundColor: Colors.bgElevated },
    modalActions:{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 16, marginTop: 20 }, 
    cancelText:  { fontFamily: Fonts.medium, fontSize: 14, color: Colors.textMuted },
    saveBtn:     { backgroundColor: '#A78BFA', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },       
    saveBtnText: { fontFamily: Fonts.bold, fontSize: 12, color: '#FFF', letterSpacing: 1 },
  });