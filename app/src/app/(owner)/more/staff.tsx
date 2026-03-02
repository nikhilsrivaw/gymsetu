 import { View, Text, StyleSheet, ScrollView, Pressable, Modal } from                 'react-native';                                                                      import { SafeAreaView } from 'react-native-safe-area-context';                     
  import { useRouter } from 'expo-router';                                             import { MaterialCommunityIcons } from '@expo/vector-icons';                       
  import { useState } from 'react';                                                  
  import { Colors } from '@/constants/colors';                                         import { Fonts } from '@/constants/fonts';
  import FadeInView from '@/components/FadeInView';                                  
  import AnimatedPressable from '@/components/AnimatedPressable';                    

  type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];       

  const staff = [
    { id: '1', name: 'Arjun Verma',   role: 'Head Trainer',     shift: 'Morning',    
  status: 'active',  phone: '9876543210', since: 'Jan 2023', salary: '₹32,000',      
  sessions: 148, rating: 4.8, initials: 'AV', color: Colors.accent  },
    { id: '2', name: 'Priya Kapoor',  role: 'Nutritionist',     shift: 'Full Day',   
  status: 'active',  phone: '9812345678', since: 'Mar 2023', salary: '₹28,000',      
  sessions: 92,  rating: 4.9, initials: 'PK', color: Colors.green   },
    { id: '3', name: 'Ravi Shankar',  role: 'Trainer',          shift: 'Evening',    
  status: 'active',  phone: '9898989898', since: 'Jun 2023', salary: '₹22,000',      
  sessions: 211, rating: 4.6, initials: 'RS', color: '#3B82F6'       },
    { id: '4', name: 'Meena Joshi',   role: 'Receptionist',     shift: 'Morning',    
  status: 'active',  phone: '9123456789', since: 'Aug 2022', salary: '₹18,000',      
  sessions: 0,   rating: 4.7, initials: 'MJ', color: '#EC4899'       },
    { id: '5', name: 'Suresh Patil',  role: 'Trainer',          shift: 'Morning',    
  status: 'on-leave',phone: '9765432109', since: 'Nov 2022', salary: '₹22,000',      
  sessions: 176, rating: 4.5, initials: 'SP', color: Colors.orange   },
    { id: '6', name: 'Kavya Nair',    role: 'Yoga Instructor',  shift: 'Morning',    
  status: 'active',  phone: '9654321098', since: 'Feb 2024', salary: '₹20,000',      
  sessions: 64,  rating: 5.0, initials: 'KN', color: '#A78BFA'       },
  ];

  const roles   = ['All', 'Trainer', 'Nutritionist', 'Receptionist', 'Yoga Instructor'];
  const shifts  = ['Morning', 'Evening', 'Full Day'];
  const statuses= ['active', 'on-leave', 'inactive'];

  const statusMeta: Record<string, { label: string; color: string }> = {
    'active':   { label: 'ACTIVE',    color: Colors.green  },
    'on-leave': { label: 'ON LEAVE',  color: Colors.orange },
    'inactive': { label: 'INACTIVE',  color: Colors.red    },
  };

  const shiftIcon: Record<string, IconName> = {
    'Morning':  'weather-sunny',
    'Evening':  'weather-sunset',
    'Full Day': 'calendar-today',
  };

  export default function StaffScreen() {
    const router = useRouter();
    const [filter, setFilter]       = useState('All');
    const [selected, setSelected]   = useState<typeof staff[0] | null>(null);        
    const [addModal, setAddModal]   = useState(false);

    const active   = staff.filter(s => s.status === 'active').length;
    const onLeave  = staff.filter(s => s.status === 'on-leave').length;
    const filtered = filter === 'All' ? staff : staff.filter(s => s.role === filter);

    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScrollView style={styles.container} contentContainerStyle={styles.scroll}   
  showsVerticalScrollIndicator={false}>

          {/* ── Hero ───────────────────────────────────────── */}
          <FadeInView delay={0}>
            <View style={styles.hero}>
              <View style={styles.heroGlow} />
              <View style={{ flex: 1 }}>
                <Text style={styles.heroMicro}>STAFF MANAGEMENT</Text>
                <Text style={styles.heroTitle}>{staff.length} MEMBERS</Text>
                <Text style={styles.heroSub}>Manage your gym team</Text>
              </View>
              <View style={styles.heroStats}>
                <View style={styles.heroStatItem}>
                  <Text style={styles.heroStatVal}>{active}</Text>
                  <Text style={[styles.heroStatLabel, { color: Colors.green 
  }]}>ACTIVE</Text>
                </View>
                <View style={styles.heroStatDivider} />
                <View style={styles.heroStatItem}>
                  <Text style={styles.heroStatVal}>{onLeave}</Text>
                  <Text style={[styles.heroStatLabel, { color: Colors.orange
  }]}>LEAVE</Text>
                </View>
              </View>
            </View>
          </FadeInView>

          {/* ── Role Filter ─────────────────────────────────── */}
          <FadeInView delay={60}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
  contentContainerStyle={styles.chipRow}>
              {roles.map(r => (
                <Pressable
                  key={r}
                  style={[styles.chip, filter === r && styles.chipActive]}
                  onPress={() => setFilter(r)}
                >
                  <Text style={[styles.chipText, filter === r &&
  styles.chipTextActive]}>{r.toUpperCase()}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </FadeInView>

          {/* ── Staff Cards ─────────────────────────────────── */}
          <Text style={styles.sectionLabel}>{filtered.length} STAFF{filter !== 'All' 
  ? ` — ${filter.toUpperCase()}` : ''}</Text>

          {filtered.map((member, i) => {
            const meta = statusMeta[member.status];
            return (
              <FadeInView key={member.id} delay={120 + i * 55}>
                <AnimatedPressable
                  style={styles.card}
                  scaleDown={0.97}
                  onPress={() => setSelected(member)}
                >
                  {/* Left accent */}
                  <View style={[styles.cardAccent, { backgroundColor: member.color   
  }]} />

                  {/* Avatar */}
                  <View style={[styles.avatar, { backgroundColor: member.color +     
  '20', borderColor: member.color + '50' }]}>
                    <Text style={[styles.avatarText, { color: member.color
  }]}>{member.initials}</Text>
                  </View>

                  {/* Info */}
                  <View style={styles.cardInfo}>
                    <View style={styles.cardRow}>
                      <Text style={styles.cardName}>{member.name}</Text>
                      <View style={[styles.statusPill, { backgroundColor: meta.color 
  + '18' }]}>
                        <View style={[styles.statusDot, { backgroundColor: meta.color
   }]} />
                        <Text style={[styles.statusText, { color: meta.color
  }]}>{meta.label}</Text>
                      </View>
                    </View>
                    <Text style={styles.cardRole}>{member.role}</Text>
                    <View style={styles.cardMeta}>
                      <MaterialCommunityIcons name={shiftIcon[member.shift]}
  size={11} color={Colors.textMuted} />
                      <Text style={styles.cardMetaText}>{member.shift}</Text>        
                      {member.sessions > 0 && (
                        <>
                          <Text style={styles.cardMetaDot}>·</Text>
                          <Text style={styles.cardMetaText}>{member.sessions}        
  sessions</Text>
                        </>
                      )}
                      <Text style={styles.cardMetaDot}>·</Text>
                      <MaterialCommunityIcons name="star" size={11}
  color={Colors.accent} />
                      <Text style={[styles.cardMetaText, { color: Colors.accent      
  }]}>{member.rating}</Text>
                    </View>
                  </View>

                  <MaterialCommunityIcons name="chevron-right" size={18}
  color={Colors.textMuted} />
                </AnimatedPressable>
              </FadeInView>
            );
          })}

          {/* ── Add Staff Button ─────────────────────────────── */}
          <FadeInView delay={520}>
            <AnimatedPressable style={styles.addBtn} scaleDown={0.97} onPress={() => 
  setAddModal(true)}>
              <MaterialCommunityIcons name="plus" size={18} color={Colors.bg} />     
              <Text style={styles.addBtnText}>ADD STAFF MEMBER</Text>
            </AnimatedPressable>
          </FadeInView>

          <View style={{ height: 32 }} />
        </ScrollView>

        {/* ── Detail Modal ──────────────────────────────────── */}
        <Modal visible={!!selected} transparent animationType="slide"
  onRequestClose={() => setSelected(null)}>
          <Pressable style={styles.backdrop} onPress={() => setSelected(null)} />    
          {selected && (
            <View style={styles.sheet}>
              {/* Handle */}
              <View style={styles.handle} />

              {/* Header */}
              <View style={styles.sheetHeader}>
                <View style={[styles.sheetAvatar, { backgroundColor: selected.color +
   '20', borderColor: selected.color }]}>
                  <Text style={[styles.sheetAvatarText, { color: selected.color      
  }]}>{selected.initials}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sheetName}>{selected.name}</Text>
                  <Text style={styles.sheetRole}>{selected.role}</Text>
                </View>
                <Pressable style={styles.closeBtn} onPress={() => setSelected(null)}>
                  <MaterialCommunityIcons name="close" size={18}
  color={Colors.textMuted} />
                </Pressable>
              </View>

              {/* Stats */}
              <View style={styles.sheetStats}>
                {[
                  { label: 'SALARY',   val: selected.salary,              icon:      
  'cash-multiple'        as IconName },
                  { label: 'SESSIONS', val: String(selected.sessions),    icon:      
  'dumbbell'             as IconName },
                  { label: 'RATING',   val: `${selected.rating} ★`,      icon:       
  'star-outline'         as IconName },
                  { label: 'SINCE',    val: selected.since,               icon:      
  'calendar-outline'     as IconName },
                ].map(s => (
                  <View key={s.label} style={styles.sheetStat}>
                    <MaterialCommunityIcons name={s.icon} size={16}
  color={selected.color} />
                    <Text style={styles.sheetStatVal}>{s.val}</Text>
                    <Text style={styles.sheetStatLabel}>{s.label}</Text>
                  </View>
                ))}
              </View>

              {/* Details */}
              <View style={styles.sheetDetail}>
                {[
                  { label: 'SHIFT',  val: selected.shift,  icon:
  shiftIcon[selected.shift]      },
                  { label: 'PHONE',  val: selected.phone,  icon: 'phone-outline'  as 
  IconName   },
                  { label: 'STATUS', val: statusMeta[selected.status].label, icon:   
  'circle-outline' as IconName },
                ].map(d => (
                  <View key={d.label} style={styles.detailRow}>
                    <MaterialCommunityIcons name={d.icon} size={15}
  color={Colors.textMuted} />
                    <Text style={styles.detailLabel}>{d.label}</Text>
                    <Text style={styles.detailVal}>{d.val}</Text>
                  </View>
                ))}
              </View>

              {/* Actions */}
              <View style={styles.sheetActions}>
                <AnimatedPressable style={[styles.actionBtn, { backgroundColor:      
  Colors.green + '18', borderColor: Colors.green + '30' }]} scaleDown={0.95}>        
                  <MaterialCommunityIcons name="phone" size={16} color={Colors.green}
   />
                  <Text style={[styles.actionBtnText, { color: Colors.green
  }]}>CALL</Text>
                </AnimatedPressable>
                <AnimatedPressable style={[styles.actionBtn, { backgroundColor:      
  Colors.accent + '18', borderColor: Colors.accent + '30' }]} scaleDown={0.95}>      
                  <MaterialCommunityIcons name="pencil-outline" size={16}
  color={Colors.accent} />
                  <Text style={[styles.actionBtnText, { color: Colors.accent
  }]}>EDIT</Text>
                </AnimatedPressable>
                <AnimatedPressable style={[styles.actionBtn, { backgroundColor:      
  Colors.red + '18', borderColor: Colors.red + '30' }]} scaleDown={0.95}>
                  <MaterialCommunityIcons name="account-remove-outline" size={16}    
  color={Colors.red} />
                  <Text style={[styles.actionBtnText, { color: Colors.red
  }]}>REMOVE</Text>
                </AnimatedPressable>
              </View>
            </View>
          )}
        </Modal>

        {/* ── Add Modal ─────────────────────────────────────── */}
        <Modal visible={addModal} transparent animationType="slide"
  onRequestClose={() => setAddModal(false)}>
          <Pressable style={styles.backdrop} onPress={() => setAddModal(false)} />   
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <View style={styles.addModalHeader}>
              <Text style={styles.addModalTitle}>ADD STAFF MEMBER</Text>
              <Pressable style={styles.closeBtn} onPress={() => setAddModal(false)}> 
                <MaterialCommunityIcons name="close" size={18}
  color={Colors.textMuted} />
              </Pressable>
            </View>
            <Text style={styles.addModalSub}>Staff management form coming
  soon.</Text>
            <AnimatedPressable style={styles.addBtn} scaleDown={0.97} onPress={() => 
  setAddModal(false)}>
              <Text style={styles.addBtnText}>CLOSE</Text>
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
      flexDirection: 'row', alignItems: 'center', gap: 12,
      borderWidth: 1, borderColor: Colors.accent + '20',
      overflow: 'hidden', marginBottom: 16,
    },
    heroGlow: {
      position: 'absolute', top: -30, left: -20,
      width: 100, height: 100, borderRadius: 50,
      backgroundColor: Colors.accentGlow,
    },
    heroMicro:  { fontFamily: Fonts.medium, fontSize: 9, color: Colors.accent,       
  letterSpacing: 1.5 },
    heroTitle:  { fontFamily: Fonts.condensedBold, fontSize: 30, color: Colors.text, 
  letterSpacing: 0.5 },
    heroSub:    { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted,  
  marginTop: 2 },
    heroStats:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
    heroStatItem: { alignItems: 'center', gap: 2 },
    heroStatVal:  { fontFamily: Fonts.condensedBold, fontSize: 22, color: Colors.text
   },
    heroStatLabel:{ fontFamily: Fonts.bold, fontSize: 8, letterSpacing: 1 },
    heroStatDivider: { width: 1, height: 28, backgroundColor: Colors.border },       

    // Chips
    chipRow:    { gap: 8, paddingBottom: 16 },
    chip:       { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,       
  backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border },      
    chipActive: { backgroundColor: Colors.accentMuted, borderColor: Colors.accent }, 
    chipText:   { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted,      
  letterSpacing: 0.8 },
    chipTextActive: { color: Colors.accent },

    sectionLabel: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted,    
  letterSpacing: 1.8, marginBottom: 10, marginTop: 4 },

    // Staff Card
    card: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: Colors.bgCard, borderRadius: 14, padding: 14,
      borderWidth: 1, borderColor: Colors.border,
      overflow: 'hidden', marginBottom: 8,
    },
    cardAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },      
    avatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center',     
  alignItems: 'center', borderWidth: 2 },
    avatarText: { fontFamily: Fonts.condensedBold, fontSize: 16, letterSpacing: 0.5  
  },
    cardInfo:   { flex: 1 },
    cardRow:    { flexDirection: 'row', alignItems: 'center', justifyContent:        
  'space-between', marginBottom: 2 },
    cardName:   { fontFamily: Fonts.bold, fontSize: 14, color: Colors.text },        
    cardRole:   { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted,  
  marginBottom: 4 },
    cardMeta:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
    cardMetaText: { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted 
  },
    cardMetaDot:  { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted 
  },
    statusPill:   { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius:
   20, paddingHorizontal: 8, paddingVertical: 3 },
    statusDot:    { width: 5, height: 5, borderRadius: 3 },
    statusText:   { fontFamily: Fonts.bold, fontSize: 8, letterSpacing: 0.8 },       

    // Add button
    addBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,  
      backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 14,
  marginTop: 8,
    },
    addBtnText: { fontFamily: Fonts.bold, fontSize: 12, color: Colors.bg,
  letterSpacing: 1.2 },

    // Modal
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' 
  },
    sheet: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      backgroundColor: Colors.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 
  24,
      paddingHorizontal: 20, paddingBottom: 36, paddingTop: 12,
    },
    handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.border, 
  alignSelf: 'center', marginBottom: 20 },
    closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor:
  Colors.bgElevated, justifyContent: 'center', alignItems: 'center' },

    sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom:
   20 },
    sheetAvatar: { width: 54, height: 54, borderRadius: 27, justifyContent: 'center',
   alignItems: 'center', borderWidth: 2 },
    sheetAvatarText: { fontFamily: Fonts.condensedBold, fontSize: 20, letterSpacing: 
  0.5 },
    sheetName: { fontFamily: Fonts.bold, fontSize: 18, color: Colors.text },
    sheetRole: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted,   
  marginTop: 2 },

    sheetStats: { flexDirection: 'row', backgroundColor: Colors.bgElevated,
  borderRadius: 14, padding: 14, marginBottom: 16, gap: 4 },
    sheetStat:  { flex: 1, alignItems: 'center', gap: 3 },
    sheetStatVal:  { fontFamily: Fonts.condensedBold, fontSize: 15, color:
  Colors.text },
    sheetStatLabel:{ fontFamily: Fonts.bold, fontSize: 8, color: Colors.textMuted,   
  letterSpacing: 0.8 },

    sheetDetail: { backgroundColor: Colors.bgElevated, borderRadius: 14, overflow:   
  'hidden', marginBottom: 16 },
    detailRow:   { flexDirection: 'row', alignItems: 'center', gap: 10,
  paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1,
  borderBottomColor: Colors.border },
    detailLabel: { fontFamily: Fonts.medium, fontSize: 11, color: Colors.textMuted,  
  flex: 1 },
    detailVal:   { fontFamily: Fonts.bold, fontSize: 12, color: Colors.text },       

    sheetActions: { flexDirection: 'row', gap: 8 },
    actionBtn:    { flex: 1, flexDirection: 'row', alignItems: 'center',
  justifyContent: 'center', gap: 6, borderRadius: 10, paddingVertical: 12,
  borderWidth: 1 },
    actionBtnText:{ fontFamily: Fonts.bold, fontSize: 10, letterSpacing: 0.8 },      

    addModalHeader: { flexDirection: 'row', justifyContent: 'space-between',
  alignItems: 'center', marginBottom: 12 },
    addModalTitle:  { fontFamily: Fonts.condensedBold, fontSize: 20, color:
  Colors.text, letterSpacing: 0.5 },
    addModalSub:    { fontFamily: Fonts.regular, fontSize: 13, color:
  Colors.textMuted, marginBottom: 20 },
  });