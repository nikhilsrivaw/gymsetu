                                                                                      import { View, Text, StyleSheet, ScrollView, Pressable, Modal, TextInput } from      'react-native';                                                                      import { SafeAreaView } from 'react-native-safe-area-context';                       import { MaterialCommunityIcons } from '@expo/vector-icons';                       
  import { useState } from 'react';                                                    import { Colors } from '@/constants/colors';                                       
  import { Fonts } from '@/constants/fonts';                                           import FadeInView from '@/components/FadeInView';                                  
  import AnimatedPressable from '@/components/AnimatedPressable';                    
                                                                                     
  type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

  const expiringMembers = [
    { id: '1', name: 'Vikram Singh',   plan: '1 Month',   daysLeft: 0,  paid:        
  '₹1,500', initials: 'VS', color: Colors.red    },
    { id: '2', name: 'Anjali Sharma',  plan: '3 Months',  daysLeft: 2,  paid:        
  '₹3,800', initials: 'AS', color: Colors.orange },
    { id: '3', name: 'Rohit Mehra',    plan: '1 Month',   daysLeft: 3,  paid:        
  '₹1,500', initials: 'RM', color: Colors.orange },
    { id: '4', name: 'Pooja Tiwari',   plan: '6 Months',  daysLeft: 5,  paid:        
  '₹7,200', initials: 'PT', color: Colors.orange },
    { id: '5', name: 'Karan Malhotra', plan: '1 Month',   daysLeft: 6,  paid:        
  '₹1,500', initials: 'KM', color: Colors.accent },
    { id: '6', name: 'Sneha Joshi',    plan: '3 Months',  daysLeft: 7,  paid:        
  '₹3,800', initials: 'SJ', color: Colors.accent },
  ];

  const plans = [
    { id: 'p1', label: '1 Month',   price: 1500, tag: 'BASIC',   color: Colors.accent
   },
    { id: 'p2', label: '3 Months',  price: 3800, tag: 'POPULAR', color: Colors.green 
   },
    { id: 'p3', label: '6 Months',  price: 7200, tag: 'VALUE',   color: '#3B82F6'    
   },
    { id: 'p4', label: '12 Months', price: 12000,tag: 'BEST',    color: '#A78BFA'    
   },
  ];

  const paymentMethods: { label: string; icon: IconName; color: string }[] = [       
    { label: 'UPI',          icon: 'qrcode-scan',      color: '#4F6EF7' },
    { label: 'Cash',         icon: 'cash',              color: Colors.green },       
    { label: 'Card',         icon: 'credit-card-outline',color: Colors.orange },     
    { label: 'Bank Transfer',icon: 'bank-outline',      color: Colors.accent },      
  ];

  export default function RenewPlanScreen() {
    const [selected, setSelected]   = useState<typeof expiringMembers[0] |
  null>(null);
    const [selectedPlan, setSelectedPlan] = useState(plans[0].id);
    const [payMethod, setPayMethod] = useState('Cash');
    const [note, setNote]           = useState('');
    const [successModal, setSuccessModal] = useState(false);

    const expired  = expiringMembers.filter(m => m.daysLeft === 0).length;
    const critical = expiringMembers.filter(m => m.daysLeft > 0 && m.daysLeft <=     
  3).length;
    const upcoming = expiringMembers.filter(m => m.daysLeft > 3).length;

    const activePlan = plans.find(p => p.id === selectedPlan)!;

    const urgencyColor = (days: number) => {
      if (days === 0) return Colors.red;
      if (days <= 3)  return Colors.orange;
      return Colors.accent;
    };

    const urgencyLabel = (days: number) => {
      if (days === 0) return 'EXPIRED';
      if (days === 1) return '1 DAY LEFT';
      return `${days} DAYS LEFT`;
    };

    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScrollView style={styles.container} contentContainerStyle={styles.scroll}   
  showsVerticalScrollIndicator={false}>

          {/* ── Hero ─────────────────────────────────────────── */}
          <FadeInView delay={0}>
            <View style={styles.hero}>
              <View style={styles.heroGlow} />
              <View style={{ flex: 1 }}>
                <Text style={styles.heroMicro}>RENEWAL DASHBOARD</Text>
                <Text style={styles.heroTitle}>EXPIRING SOON</Text>
                <Text style={styles.heroSub}>Act fast to retain members</Text>       
              </View>
              <View style={styles.heroCountWrap}>
                <Text style={styles.heroCountVal}>{expiringMembers.length}</Text>    
                <Text style={styles.heroCountLabel}>MEMBERS</Text>
              </View>
            </View>
          </FadeInView>

          {/* ── Summary Pills ─────────────────────────────────── */}
          <FadeInView delay={60}>
            <View style={styles.summaryRow}>
              {[
                { label: 'EXPIRED',  val: expired,  color: Colors.red    },
                { label: 'CRITICAL', val: critical, color: Colors.orange },
                { label: 'UPCOMING', val: upcoming, color: Colors.accent },
              ].map(s => (
                <View key={s.label} style={[styles.summaryPill, { borderColor:       
  s.color + '30', backgroundColor: s.color + '10' }]}>
                  <Text style={[styles.summaryVal, { color: s.color
  }]}>{s.val}</Text>
                  <Text style={[styles.summaryLabel, { color: s.color
  }]}>{s.label}</Text>
                </View>
              ))}
            </View>
          </FadeInView>

          {/* ── Member Cards ──────────────────────────────────── */}
          <Text style={styles.sectionLabel}>SELECT MEMBER TO RENEW</Text>

          {expiringMembers.map((member, i) => {
            const isSelected = selected?.id === member.id;
            const uColor = urgencyColor(member.daysLeft);
            return (
              <FadeInView key={member.id} delay={100 + i * 50}>
                <AnimatedPressable
                  style={[styles.memberCard, isSelected &&
  styles.memberCardSelected]}
                  scaleDown={0.97}
                  onPress={() => setSelected(isSelected ? null : member)}
                >
                  {/* Left urgency bar */}
                  <View style={[styles.cardBar, { backgroundColor: uColor }]} />     

                  {/* Avatar */}
                  <View style={[styles.avatar, { backgroundColor: member.color +     
  '20', borderColor: member.color + '50' }]}>
                    <Text style={[styles.avatarText, { color: member.color
  }]}>{member.initials}</Text>
                  </View>

                  {/* Info */}
                  <View style={styles.cardInfo}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    <Text style={styles.memberPlan}>{member.plan}  ·
  {member.paid}</Text>
                  </View>

                  {/* Urgency badge */}
                  <View style={[styles.urgencyBadge, { backgroundColor: uColor + '18'
   }]}>
                    <Text style={[styles.urgencyText, { color: uColor
  }]}>{urgencyLabel(member.daysLeft)}</Text>
                  </View>

                  {isSelected && (
                    <MaterialCommunityIcons name="check-circle" size={18}
  color={Colors.accent} />
                  )}
                </AnimatedPressable>
              </FadeInView>
            );
          })}

          {/* ── Plan Selector ─────────────────────────────────── */}
          {selected && (
            <FadeInView delay={0}>
              <Text style={styles.sectionLabel}>SELECT NEW PLAN</Text>
              <View style={styles.planGrid}>
                {plans.map(p => {
                  const isActive = selectedPlan === p.id;
                  return (
                    <AnimatedPressable
                      key={p.id}
                      style={[styles.planCard, isActive && { borderColor: p.color,   
  backgroundColor: p.color + '10' }]}
                      scaleDown={0.96}
                      onPress={() => setSelectedPlan(p.id)}
                    >
                      <View style={[styles.planTag, { backgroundColor: p.color + '20'
   }]}>
                        <Text style={[styles.planTagText, { color: p.color
  }]}>{p.tag}</Text>
                      </View>
                      <Text style={[styles.planPrice, { color: isActive ? p.color :  
  Colors.text }]}>
                        ₹{p.price.toLocaleString('en-IN')}
                      </Text>
                      <Text style={styles.planDuration}>{p.label}</Text>
                      {isActive && (
                        <View style={[styles.planCheck, { backgroundColor: p.color   
  }]}>
                          <MaterialCommunityIcons name="check" size={10} color="#fff"
   />
                        </View>
                      )}
                    </AnimatedPressable>
                  );
                })}
              </View>

              {/* Payment Method */}
              <Text style={styles.sectionLabel}>PAYMENT METHOD</Text>
              <View style={styles.payRow}>
                {paymentMethods.map(m => (
                  <AnimatedPressable
                    key={m.label}
                    style={[styles.payChip, payMethod === m.label && { borderColor:  
  m.color, backgroundColor: m.color + '12' }]}
                    scaleDown={0.95}
                    onPress={() => setPayMethod(m.label)}
                  >
                    <MaterialCommunityIcons name={m.icon} size={15} color={payMethod 
  === m.label ? m.color : Colors.textMuted} />
                    <Text style={[styles.payChipText, payMethod === m.label && {     
  color: m.color }]}>{m.label}</Text>
                  </AnimatedPressable>
                ))}
              </View>

              {/* Note */}
              <Text style={styles.sectionLabel}>NOTE (OPTIONAL)</Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Add a note for this renewal..."
                placeholderTextColor={Colors.textMuted}
                style={styles.noteInput}
                multiline
                numberOfLines={2}
              />

              {/* Summary */}
              <View style={styles.summaryCard}>
                <View style={styles.summaryCardBar} />
                <View style={styles.summaryCardInner}>
                  <View style={styles.summaryCardRow}>
                    <Text style={styles.summaryCardLabel}>MEMBER</Text>
                    <Text style={styles.summaryCardVal}>{selected.name}</Text>       
                  </View>
                  <View style={styles.summaryCardRow}>
                    <Text style={styles.summaryCardLabel}>NEW PLAN</Text>
                    <Text style={styles.summaryCardVal}>{activePlan.label}</Text>    
                  </View>
                  <View style={styles.summaryCardRow}>
                    <Text style={styles.summaryCardLabel}>AMOUNT</Text>
                    <Text style={[styles.summaryCardVal, { color: Colors.green }]}>  
                      ₹{activePlan.price.toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <View style={styles.summaryCardRow}>
                    <Text style={styles.summaryCardLabel}>PAYMENT</Text>
                    <Text style={styles.summaryCardVal}>{payMethod}</Text>
                  </View>
                </View>
              </View>

              {/* Confirm Button */}
              <AnimatedPressable
                style={styles.confirmBtn}
                scaleDown={0.97}
                onPress={() => setSuccessModal(true)}
              >
                <MaterialCommunityIcons name="refresh" size={18} color={Colors.bg} />
                <Text style={styles.confirmBtnText}>CONFIRM RENEWAL</Text>
              </AnimatedPressable>
            </FadeInView>
          )}

          <View style={{ height: 32 }} />
        </ScrollView>

        {/* ── Success Modal ────────────────────────────────── */}
        <Modal visible={successModal} transparent animationType="fade"
  onRequestClose={() => setSuccessModal(false)}>
          <Pressable style={styles.backdrop} onPress={() => setSuccessModal(false)}  
  />
          <View style={styles.successSheet}>
            <View style={styles.successIcon}>
              <MaterialCommunityIcons name="check-circle" size={48}
  color={Colors.green} />
            </View>
            <Text style={styles.successTitle}>RENEWAL CONFIRMED!</Text>
            <Text style={styles.successSub}>
              {selected?.name}'s plan has been renewed for {activePlan.label}.       
            </Text>
            <View style={styles.successDetail}>
              {[
                { label: 'AMOUNT PAID', val:
  `₹${activePlan.price.toLocaleString('en-IN')}` },
                { label: 'METHOD',      val: payMethod },
                { label: 'VALID FOR',   val: activePlan.label },
              ].map(d => (
                <View key={d.label} style={styles.successRow}>
                  <Text style={styles.successLabel}>{d.label}</Text>
                  <Text style={styles.successVal}>{d.val}</Text>
                </View>
              ))}
            </View>
            <AnimatedPressable
              style={styles.successBtn}
              scaleDown={0.97}
              onPress={() => { setSuccessModal(false); setSelected(null); }}
            >
              <Text style={styles.successBtnText}>DONE</Text>
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
      borderWidth: 1, borderColor: Colors.orange + '30',
      overflow: 'hidden', marginBottom: 12,
    },
    heroGlow: {
      position: 'absolute', top: -30, left: -20,
      width: 100, height: 100, borderRadius: 50,
      backgroundColor: Colors.accentGlow,
    },
    heroMicro:     { fontFamily: Fonts.medium, fontSize: 9, color: Colors.orange,    
  letterSpacing: 1.5 },
    heroTitle:     { fontFamily: Fonts.condensedBold, fontSize: 30, color:
  Colors.text, letterSpacing: 0.5 },
    heroSub:       { fontFamily: Fonts.regular, fontSize: 11, color:
  Colors.textMuted, marginTop: 2 },
    heroCountWrap: { alignItems: 'center', backgroundColor: Colors.orange + '15',    
  borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
    heroCountVal:  { fontFamily: Fonts.condensedBold, fontSize: 28, color:
  Colors.orange },
    heroCountLabel:{ fontFamily: Fonts.bold, fontSize: 8, color: Colors.orange,      
  letterSpacing: 1 },

    // Summary pills
    summaryRow:   { flexDirection: 'row', gap: 8, marginBottom: 20 },
    summaryPill:  { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius:
   12, borderWidth: 1, gap: 2 },
    summaryVal:   { fontFamily: Fonts.condensedBold, fontSize: 22 },
    summaryLabel: { fontFamily: Fonts.bold, fontSize: 8, letterSpacing: 0.8 },       

    sectionLabel: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted,    
  letterSpacing: 1.8, marginBottom: 10, marginTop: 4 },

    // Member card
    memberCard: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: Colors.bgCard, borderRadius: 14, padding: 14,
      borderWidth: 1, borderColor: Colors.border,
      overflow: 'hidden', marginBottom: 8,
    },
    memberCardSelected: { borderColor: Colors.accent, backgroundColor:
  Colors.accentMuted },
    cardBar:    { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },      
    avatar:     { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', 
  alignItems: 'center', borderWidth: 2 },
    avatarText: { fontFamily: Fonts.condensedBold, fontSize: 14, letterSpacing: 0.5  
  },
    cardInfo:   { flex: 1 },
    memberName: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.text },        
    memberPlan: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted,  
  marginTop: 2 },
    urgencyBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },     
    urgencyText:  { fontFamily: Fonts.bold, fontSize: 9, letterSpacing: 0.6 },       

    // Plan grid
    planGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },  
    planCard: {
      width: '48%', backgroundColor: Colors.bgCard, borderRadius: 14,
      borderWidth: 1.5, borderColor: Colors.border,
      padding: 14, gap: 4, overflow: 'hidden',
    },
    planTag:      { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 7,  
  paddingVertical: 3, marginBottom: 4 },
    planTagText:  { fontFamily: Fonts.bold, fontSize: 8, letterSpacing: 0.8 },       
    planPrice:    { fontFamily: Fonts.condensedBold, fontSize: 24 },
    planDuration: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted 
  },
    planCheck: {
      position: 'absolute', top: 10, right: 10,
      width: 18, height: 18, borderRadius: 9,
      justifyContent: 'center', alignItems: 'center',
    },

    // Payment
    payRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20  
  },
    payChip:     { flexDirection: 'row', alignItems: 'center', gap: 6,
  paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor:      
  Colors.bgCard, borderWidth: 1, borderColor: Colors.border },
    payChipText: { fontFamily: Fonts.bold, fontSize: 10, color: Colors.textMuted,    
  letterSpacing: 0.5 },

    // Note
    noteInput: {
      backgroundColor: Colors.bgCard, borderRadius: 12,
      borderWidth: 1, borderColor: Colors.border,
      paddingHorizontal: 14, paddingVertical: 12,
      fontFamily: Fonts.regular, fontSize: 13, color: Colors.text,
      marginBottom: 20, textAlignVertical: 'top',
    },

    // Summary card
    summaryCard: {
      flexDirection: 'row', backgroundColor: Colors.bgCard,
      borderRadius: 14, borderWidth: 1, borderColor: Colors.green + '30',
      overflow: 'hidden', marginBottom: 16,
    },
    summaryCardBar:   { width: 3, backgroundColor: Colors.green },
    summaryCardInner: { flex: 1, padding: 14, gap: 8 },
    summaryCardRow:   { flexDirection: 'row', justifyContent: 'space-between',       
  alignItems: 'center' },
    summaryCardLabel: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted,
   letterSpacing: 1 },
    summaryCardVal:   { fontFamily: Fonts.bold, fontSize: 13, color: Colors.text },  

    // Confirm
    confirmBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,  
      backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 15,
    },
    confirmBtnText: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.bg,        
  letterSpacing: 1.2 },

    // Modal
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)' 
  },
    successSheet: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      backgroundColor: Colors.bgCard,
      borderTopLeftRadius: 28, borderTopRightRadius: 28,
      paddingHorizontal: 24, paddingBottom: 40, paddingTop: 32,
      alignItems: 'center',
    },
    successIcon:  { marginBottom: 16 },
    successTitle: { fontFamily: Fonts.condensedBold, fontSize: 26, color:
  Colors.text, letterSpacing: 0.5, marginBottom: 6 },
    successSub:   { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted,
   textAlign: 'center', marginBottom: 24 },
    successDetail:{ width: '100%', backgroundColor: Colors.bgElevated, borderRadius: 
  14, overflow: 'hidden', marginBottom: 24 },
    successRow:   { flexDirection: 'row', justifyContent: 'space-between',
  alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
  borderBottomWidth: 1, borderBottomColor: Colors.border },
    successLabel: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted,    
  letterSpacing: 1 },
    successVal:   { fontFamily: Fonts.bold, fontSize: 13, color: Colors.text },      
    successBtn:   { width: '100%', backgroundColor: Colors.green, borderRadius: 12,  
  paddingVertical: 14, alignItems: 'center' },
    successBtnText: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.bg,        
  letterSpacing: 1.5 },
  });
