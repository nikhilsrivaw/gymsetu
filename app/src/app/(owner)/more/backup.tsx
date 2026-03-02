 import { View, Text, StyleSheet, ScrollView, Pressable, Modal } from                 'react-native';                                                                      import { SafeAreaView } from 'react-native-safe-area-context';                       import { MaterialCommunityIcons } from '@expo/vector-icons';                       
  import { useState } from 'react';                                                    import { Colors } from '@/constants/colors';                                       
  import { Fonts } from '@/constants/fonts';                                           import FadeInView from '@/components/FadeInView';                                  
  import AnimatedPressable from '@/components/AnimatedPressable';                    
                                                                                     
  type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

  const backupHistory = [
    { id: '1', date: 'Today, 2:00 AM',       size: '4.2 MB', type: 'Auto',   status: 
  'success', records: 148 },
    { id: '2', date: 'Yesterday, 2:00 AM',   size: '4.1 MB', type: 'Auto',   status: 
  'success', records: 146 },
    { id: '3', date: '28 May, 6:14 PM',      size: '3.9 MB', type: 'Manual', status: 
  'success', records: 141 },
    { id: '4', date: '27 May, 2:00 AM',      size: '3.9 MB', type: 'Auto',   status: 
  'failed',  records: 0   },
    { id: '5', date: '26 May, 2:00 AM',      size: '3.8 MB', type: 'Auto',   status: 
  'success', records: 139 },
  ];

  const dataCategories: { label: string; icon: IconName; color: string; size: string;
   records: number }[] = [
    { label: 'Members',     icon: 'account-group-outline',  color: Colors.accent,    
  size: '1.8 MB', records: 148 },
    { label: 'Payments',    icon: 'cash-multiple',           color: Colors.green,    
  size: '0.9 MB', records: 312 },
    { label: 'Plans',       icon: 'clipboard-list-outline',  color: '#3B82F6',       
  size: '0.2 MB', records: 6   },
    { label: 'Attendance',  icon: 'calendar-check-outline',  color: Colors.orange,   
  size: '1.1 MB', records: 1840},
    { label: 'Staff',       icon: 'badge-account-outline',   color: '#A78BFA',       
  size: '0.2 MB', records: 6   },
  ];

  const totalSize = '4.2 MB';
  const lastBackup = 'Today, 2:00 AM';
  const nextBackup  = 'Tomorrow, 2:00 AM';

  export default function BackupScreen() {
    const [restoreModal, setRestoreModal] = useState(false);
    const [restoreTarget, setRestoreTarget] = useState<typeof backupHistory[0] |     
  null>(null);
    const [backing, setBacking]   = useState(false);
    const [progress, setProgress] = useState(0);
    const [doneModal, setDoneModal] = useState(false);

    const startBackup = () => {
      setBacking(true);
      setProgress(0);
      let p = 0;
      const iv = setInterval(() => {
        p += 20;
        setProgress(p);
        if (p >= 100) {
          clearInterval(iv);
          setBacking(false);
          setDoneModal(true);
        }
      }, 400);
    };

    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScrollView style={styles.container} contentContainerStyle={styles.scroll}   
  showsVerticalScrollIndicator={false}>

          {/* ── Hero ─────────────────────────────────────────── */}
          <FadeInView delay={0}>
            <View style={styles.hero}>
              <View style={styles.heroGlow} />
              <View style={styles.heroIcon}>
                <MaterialCommunityIcons name="cloud-upload-outline" size={28}        
  color={Colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroMicro}>DATA PROTECTION</Text>
                <Text style={styles.heroTitle}>BACKUP & RESTORE</Text>
                <Text style={styles.heroSub}>Your data is safe & encrypted</Text>    
              </View>
              <View style={styles.heroBadge}>
                <MaterialCommunityIcons name="shield-check" size={14}
  color={Colors.green} />
                <Text style={styles.heroBadgeText}>SECURE</Text>
              </View>
            </View>
          </FadeInView>

          {/* ── Status Card ───────────────────────────────────── */}
          <FadeInView delay={60}>
            <View style={styles.statusCard}>
              <View style={styles.statusCardAccent} />
              <View style={styles.statusCardInner}>
                <View style={styles.statusRow}>
                  {[
                    { label: 'LAST BACKUP',  val: lastBackup, icon:
  'clock-check-outline'  as IconName, color: Colors.green  },
                    { label: 'NEXT BACKUP',  val: nextBackup,  icon: 'clock-outline' as IconName, color: Colors.accent },
                    { label: 'TOTAL SIZE',   val: totalSize,   icon:
  'database-outline'     as IconName, color: '#3B82F6'     },
                  ].map(s => (
                    <View key={s.label} style={styles.statusItem}>
                      <MaterialCommunityIcons name={s.icon} size={15} color={s.color}
   />
                      <Text style={[styles.statusVal, { color: s.color
  }]}>{s.val}</Text>
                      <Text style={styles.statusLabel}>{s.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </FadeInView>

          {/* ── Manual Backup Button ──────────────────────────── */}
          <FadeInView delay={120}>
            {backing ? (
              <View style={styles.progressCard}>
                <Text style={styles.progressTitle}>BACKING UP…</Text>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${progress}%` as any  
  }]} />
                </View>
                <Text style={styles.progressPct}>{progress}% complete</Text>
              </View>
            ) : (
              <AnimatedPressable style={styles.backupBtn} scaleDown={0.97}
  onPress={startBackup}>
                <MaterialCommunityIcons name="cloud-upload" size={20}
  color={Colors.bg} />
                <Text style={styles.backupBtnText}>BACKUP NOW</Text>
              </AnimatedPressable>
            )}
          </FadeInView>

          {/* ── Data Breakdown ────────────────────────────────── */}
          <FadeInView delay={180}>
            <Text style={styles.sectionLabel}>DATA BREAKDOWN</Text>
            <View style={styles.breakdownCard}>
              {dataCategories.map((cat, i) => (
                <View key={cat.label} style={[styles.breakdownRow, i <
  dataCategories.length - 1 && styles.rowBorder]}>
                  <View style={[styles.breakdownIcon, { backgroundColor: cat.color + 
  '18' }]}>
                    <MaterialCommunityIcons name={cat.icon} size={16}
  color={cat.color} />
                  </View>
                  <View style={styles.breakdownInfo}>
                    <Text style={styles.breakdownLabel}>{cat.label}</Text>
                    <Text
  style={styles.breakdownRecords}>{cat.records.toLocaleString('en-IN')}
  records</Text>
                  </View>
                  <Text style={styles.breakdownSize}>{cat.size}</Text>
                </View>
              ))}
              <View style={styles.breakdownTotal}>
                <Text style={styles.breakdownTotalLabel}>TOTAL BACKUP SIZE</Text>    
                <Text style={styles.breakdownTotalVal}>{totalSize}</Text>
              </View>
            </View>
          </FadeInView>

          {/* ── Backup History ────────────────────────────────── */}
          <FadeInView delay={260}>
            <Text style={styles.sectionLabel}>BACKUP HISTORY</Text>
            <View style={styles.historyCard}>
              {backupHistory.map((b, i) => (
                <View key={b.id} style={[styles.historyRow, i < backupHistory.length 
  - 1 && styles.rowBorder]}>
                  {/* Status dot */}
                  <View style={[styles.historyDot, { backgroundColor: b.status ===   
  'success' ? Colors.green : Colors.red }]} />

                  {/* Info */}
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyDate}>{b.date}</Text>
                    <View style={styles.historyMeta}>
                      <View style={[styles.typeBadge, { backgroundColor: b.type ===  
  'Manual' ? Colors.accent + '18' : Colors.bgElevated }]}>
                        <Text style={[styles.typeText, { color: b.type === 'Manual' ?
   Colors.accent : Colors.textMuted }]}>{b.type.toUpperCase()}</Text>
                      </View>
                      {b.status === 'success' && (
                        <Text style={styles.historySize}>{b.size}  ·  {b.records}    
  records</Text>
                      )}
                      {b.status === 'failed' && (
                        <Text style={[styles.historySize, { color: Colors.red        
  }]}>FAILED</Text>
                      )}
                    </View>
                  </View>

                  {/* Restore button */}
                  {b.status === 'success' && (
                    <AnimatedPressable
                      style={styles.restoreChip}
                      scaleDown={0.92}
                      onPress={() => { setRestoreTarget(b); setRestoreModal(true); }}
                    >
                      <Text style={styles.restoreChipText}>RESTORE</Text>
                    </AnimatedPressable>
                  )}
                  {b.status === 'failed' && (
                    <MaterialCommunityIcons name="alert-circle-outline" size={18}    
  color={Colors.red} />
                  )}
                </View>
              ))}
            </View>
          </FadeInView>

          {/* ── Export Options ────────────────────────────────── */}
          <FadeInView delay={340}>
            <Text style={styles.sectionLabel}>EXPORT DATA</Text>
            <View style={styles.exportRow}>
              {([
                { label: 'EXPORT CSV',  icon: 'file-delimited-outline' as IconName,  
  color: Colors.green  },
                { label: 'EXPORT PDF',  icon: 'file-pdf-box'           as IconName,  
  color: Colors.red    },
                { label: 'SHARE ZIP',   icon: 'folder-zip-outline'     as IconName,  
  color: Colors.accent },
              ] as const).map(e => (
                <AnimatedPressable key={e.label} style={styles.exportBtn}
  scaleDown={0.95}>
                  <MaterialCommunityIcons name={e.icon} size={20} color={e.color} /> 
                  <Text style={[styles.exportBtnText, { color: e.color
  }]}>{e.label}</Text>
                </AnimatedPressable>
              ))}
            </View>
          </FadeInView>

          <View style={{ height: 32 }} />
        </ScrollView>

        {/* ── Restore Confirm Modal ────────────────────────── */}
        <Modal visible={restoreModal} transparent animationType="slide"
  onRequestClose={() => setRestoreModal(false)}>
          <Pressable style={styles.backdrop} onPress={() => setRestoreModal(false)}  
  />
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>RESTORE BACKUP</Text>
              <Pressable style={styles.closeBtn} onPress={() =>
  setRestoreModal(false)}>
                <MaterialCommunityIcons name="close" size={18}
  color={Colors.textMuted} />
              </Pressable>
            </View>

            <View style={styles.warningBanner}>
              <MaterialCommunityIcons name="alert-outline" size={18}
  color={Colors.orange} />
              <Text style={styles.warningText}>
                Restoring will overwrite all current data with the selected backup.  
  This cannot be undone.
              </Text>
            </View>

            {restoreTarget && (
              <View style={styles.restoreDetail}>
                {[
                  { label: 'BACKUP DATE', val: restoreTarget.date    },
                  { label: 'SIZE',        val: restoreTarget.size    },
                  { label: 'RECORDS',     val: `${restoreTarget.records} records` }, 
                  { label: 'TYPE',        val: restoreTarget.type    },
                ].map(d => (
                  <View key={d.label} style={styles.restoreRow}>
                    <Text style={styles.restoreLabel}>{d.label}</Text>
                    <Text style={styles.restoreVal}>{d.val}</Text>
                  </View>
                ))}
              </View>
            )}

            <AnimatedPressable
              style={styles.restoreConfirmBtn}
              scaleDown={0.97}
              onPress={() => setRestoreModal(false)}
            >
              <MaterialCommunityIcons name="restore" size={18} color={Colors.bg} />  
              <Text style={styles.restoreConfirmText}>RESTORE NOW</Text>
            </AnimatedPressable>
            <AnimatedPressable style={styles.cancelBtn} scaleDown={0.97} onPress={() => setRestoreModal(false)}>
              <Text style={styles.cancelBtnText}>CANCEL</Text>
            </AnimatedPressable>
          </View>
        </Modal>

        {/* ── Backup Done Modal ────────────────────────────── */}
        <Modal visible={doneModal} transparent animationType="fade"
  onRequestClose={() => setDoneModal(false)}>
          <Pressable style={styles.backdrop} onPress={() => setDoneModal(false)} />  
          <View style={styles.doneSheet}>
            <MaterialCommunityIcons name="cloud-check" size={52} color={Colors.green}
   />
            <Text style={styles.doneTitle}>BACKUP COMPLETE</Text>
            <Text style={styles.doneSub}>All {148} records backed up
  successfully.</Text>
            <View style={styles.doneRow}>
              <Text style={styles.doneLabel}>SIZE</Text>
              <Text style={styles.doneVal}>{totalSize}</Text>
            </View>
            <AnimatedPressable style={styles.doneBtn} scaleDown={0.97} onPress={() =>
   setDoneModal(false)}>
              <Text style={styles.doneBtnText}>GREAT!</Text>
            </AnimatedPressable>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  const styles = StyleSheet.create({
    safe:      { flex: 1, backgroundColor: Colors.bg },
    container: { flex: 1 },
    scroll:    { paddingHorizontal: 16, paddingBottom: 24, paddingTop: 16 },

    // Hero
    hero: {
      backgroundColor: Colors.bgCard, borderRadius: 20, padding: 20,
      flexDirection: 'row', alignItems: 'center', gap: 14,
      borderWidth: 1, borderColor: Colors.accent + '20',
      overflow: 'hidden', marginBottom: 12,
    },
    heroGlow: {
      position: 'absolute', top: -30, left: -20,
      width: 100, height: 100, borderRadius: 50,
      backgroundColor: Colors.accentGlow,
    },
    heroIcon: {
      width: 54, height: 54, borderRadius: 27,
      backgroundColor: Colors.accentMuted,
      justifyContent: 'center', alignItems: 'center',
      borderWidth: 2, borderColor: Colors.accent + '30',
    },
    heroMicro:     { fontFamily: Fonts.medium, fontSize: 9, color: Colors.accent,    
  letterSpacing: 1.5 },
    heroTitle:     { fontFamily: Fonts.condensedBold, fontSize: 26, color:
  Colors.text, letterSpacing: 0.5 },
    heroSub:       { fontFamily: Fonts.regular, fontSize: 11, color:
  Colors.textMuted, marginTop: 2 },
    heroBadge:     { flexDirection: 'row', alignItems: 'center', gap: 4,
  backgroundColor: Colors.green + '15', borderRadius: 8, paddingHorizontal: 8,       
  paddingVertical: 5, borderWidth: 1, borderColor: Colors.green + '30' },
    heroBadgeText: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.green,       
  letterSpacing: 0.8 },

    // Status card
    statusCard:       { flexDirection: 'row', backgroundColor: Colors.bgCard,        
  borderRadius: 14, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',  
  marginBottom: 16 },
    statusCardAccent: { width: 3, backgroundColor: Colors.green },
    statusCardInner:  { flex: 1, padding: 14 },
    statusRow:        { flexDirection: 'row', justifyContent: 'space-between' },     
    statusItem:       { alignItems: 'center', gap: 4 },
    statusVal:        { fontFamily: Fonts.bold, fontSize: 11, textAlign: 'center' }, 
    statusLabel:      { fontFamily: Fonts.medium, fontSize: 8, color:
  Colors.textMuted, letterSpacing: 0.8 },

    // Backup button
    backupBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, 
      backgroundColor: Colors.accent, borderRadius: 14, paddingVertical: 16,
  marginBottom: 20,
    },
    backupBtnText: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.bg,
  letterSpacing: 1.5 },

    // Progress
    progressCard: {
      backgroundColor: Colors.bgCard, borderRadius: 14, padding: 18,
      borderWidth: 1, borderColor: Colors.accent + '30', marginBottom: 20, gap: 10,  
    },
    progressTitle: { fontFamily: Fonts.bold, fontSize: 12, color: Colors.accent,     
  letterSpacing: 1.2 },
    progressTrack: { height: 8, backgroundColor: Colors.border, borderRadius: 4,     
  overflow: 'hidden' },
    progressFill:  { height: 8, backgroundColor: Colors.accent, borderRadius: 4 },   
    progressPct:   { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted
   },

    sectionLabel: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted,    
  letterSpacing: 1.8, marginBottom: 10, marginTop: 4 },

    // Breakdown
    breakdownCard: { backgroundColor: Colors.bgCard, borderRadius: 14, borderWidth:  
  1, borderColor: Colors.border, overflow: 'hidden', marginBottom: 20 },
    breakdownRow:  { flexDirection: 'row', alignItems: 'center', gap: 12,
  paddingHorizontal: 14, paddingVertical: 12 },
    rowBorder:     { borderBottomWidth: 1, borderBottomColor: Colors.border },       
    breakdownIcon: { width: 36, height: 36, borderRadius: 10, justifyContent:        
  'center', alignItems: 'center' },
    breakdownInfo: { flex: 1 },
    breakdownLabel:  { fontFamily: Fonts.bold, fontSize: 13, color: Colors.text },   
    breakdownRecords:{ fontFamily: Fonts.regular, fontSize: 10, color:
  Colors.textMuted, marginTop: 1 },
    breakdownSize:   { fontFamily: Fonts.condensedBold, fontSize: 14, color:
  Colors.accent },
    breakdownTotal:  { flexDirection: 'row', justifyContent: 'space-between',        
  alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, backgroundColor: 
  Colors.bgElevated },
    breakdownTotalLabel: { fontFamily: Fonts.bold, fontSize: 10, color:
  Colors.textMuted, letterSpacing: 1 },
    breakdownTotalVal:   { fontFamily: Fonts.condensedBold, fontSize: 18, color:     
  Colors.text },

    // History
    historyCard: { backgroundColor: Colors.bgCard, borderRadius: 14, borderWidth: 1, 
  borderColor: Colors.border, overflow: 'hidden', marginBottom: 20 },
    historyRow:  { flexDirection: 'row', alignItems: 'center', gap: 12,
  paddingHorizontal: 14, paddingVertical: 12 },
    historyDot:  { width: 8, height: 8, borderRadius: 4 },
    historyInfo: { flex: 1 },
    historyDate: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.text },       
    historyMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3  
  },
    typeBadge:   { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },      
    typeText:    { fontFamily: Fonts.bold, fontSize: 8, letterSpacing: 0.6 },        
    historySize: { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted  
  },
    restoreChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6,       
  backgroundColor: Colors.accentMuted, borderWidth: 1, borderColor: Colors.accent +  
  '40' },
    restoreChipText: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.accent,    
  letterSpacing: 0.6 },

    // Export
    exportRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
    exportBtn: {
      flex: 1, alignItems: 'center', gap: 6,
      backgroundColor: Colors.bgCard, borderRadius: 12, paddingVertical: 14,
      borderWidth: 1, borderColor: Colors.border,
    },
    exportBtnText: { fontFamily: Fonts.bold, fontSize: 9, letterSpacing: 0.6 },      

    // Modal
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.65)'
   },
    sheet: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      backgroundColor: Colors.bgCard,
      borderTopLeftRadius: 24, borderTopRightRadius: 24,
      paddingHorizontal: 20, paddingBottom: 36, paddingTop: 12,
    },
    handle:      { width: 36, height: 4, borderRadius: 2, backgroundColor:
  Colors.border, alignSelf: 'center', marginBottom: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems:
   'center', marginBottom: 16 },
    modalTitle:  { fontFamily: Fonts.condensedBold, fontSize: 20, color: Colors.text,
   letterSpacing: 0.5 },
    closeBtn:    { width: 32, height: 32, borderRadius: 16, backgroundColor:
  Colors.bgElevated, justifyContent: 'center', alignItems: 'center' },

    warningBanner: {
      flexDirection: 'row', gap: 10, alignItems: 'flex-start',
      backgroundColor: Colors.orange + '12', borderRadius: 12, padding: 12,
      borderWidth: 1, borderColor: Colors.orange + '30', marginBottom: 16,
    },
    warningText: { flex: 1, fontFamily: Fonts.regular, fontSize: 12, color:
  Colors.textMuted, lineHeight: 18 },

    restoreDetail: { backgroundColor: Colors.bgElevated, borderRadius: 12, overflow: 
  'hidden', marginBottom: 16 },
    restoreRow:    { flexDirection: 'row', justifyContent: 'space-between',
  paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1,
  borderBottomColor: Colors.border },
    restoreLabel:  { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted,   
  letterSpacing: 1 },
    restoreVal:    { fontFamily: Fonts.bold, fontSize: 13, color: Colors.text },     

    restoreConfirmBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 
  'center', gap: 8, backgroundColor: Colors.orange, borderRadius: 12,
  paddingVertical: 14, marginBottom: 10 },
    restoreConfirmText: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.bg,    
  letterSpacing: 1.2 },
    cancelBtn:     { alignItems: 'center', paddingVertical: 12 },
    cancelBtnText: { fontFamily: Fonts.bold, fontSize: 12, color: Colors.textMuted,  
  letterSpacing: 1 },

    // Done modal
    doneSheet: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      backgroundColor: Colors.bgCard,
      borderTopLeftRadius: 28, borderTopRightRadius: 28,
      paddingHorizontal: 24, paddingBottom: 40, paddingTop: 32,
      alignItems: 'center', gap: 8,
    },
    doneTitle: { fontFamily: Fonts.condensedBold, fontSize: 26, color: Colors.text,  
  letterSpacing: 0.5 },
    doneSub:   { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted,   
  textAlign: 'center', marginBottom: 8 },
    doneRow:   { flexDirection: 'row', gap: 12, alignItems: 'center',
  backgroundColor: Colors.bgElevated, borderRadius: 10, paddingHorizontal: 20,       
  paddingVertical: 10 },
    doneLabel: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted,       
  letterSpacing: 1 },
    doneVal:   { fontFamily: Fonts.condensedBold, fontSize: 18, color: Colors.green  
  },
    doneBtn:   { width: '100%', backgroundColor: Colors.green, borderRadius: 12,     
  paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    doneBtnText: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.bg,
  letterSpacing: 1.5 },
  });
