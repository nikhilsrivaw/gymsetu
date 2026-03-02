 import { View, Text, ScrollView, StyleSheet, Linking } from 'react-native';          import { Stack, useRouter } from 'expo-router';                                      import { MaterialCommunityIcons } from '@expo/vector-icons';                         import { Colors } from '@/constants/colors';                                       
  import { Fonts } from '@/constants/fonts';                                           import FadeInView from '@/components/FadeInView';                                  
  import AnimatedPressable from '@/components/AnimatedPressable';                      import { expiringMembers } from '@/components/reports/mockData';                   
                                                                                     
  type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];       

  function urgencyColor(days: number) {
    if (days <= 0) return Colors.red;
    if (days <= 3) return Colors.orange;
    return Colors.accent;
  }

  function urgencyLabel(days: number) {
    if (days <= 0) return 'EXPIRED';
    if (days <= 3) return 'URGENT';
    if (days <= 7) return 'SOON';
    return 'UPCOMING';
  }

  function urgencyIcon(days: number): IconName {
    if (days <= 0) return 'close-circle-outline';
    if (days <= 3) return 'alert-circle-outline';
    return 'clock-alert-outline';
  }

  function daysText(days: number) {
    if (days <= 0) return 'Expired today';
    if (days === 1) return '1 day left';
    return `${days} days left`;
  }

  export default function ExpiryDashboard() {
    const router = useRouter();

    const expired  = expiringMembers.filter(m => m.expiresIn <= 0);
    const urgent   = expiringMembers.filter(m => m.expiresIn > 0 && m.expiresIn <=   
  3);
    const soon     = expiringMembers.filter(m => m.expiresIn > 3 && m.expiresIn <=   
  7);
    const upcoming = expiringMembers.filter(m => m.expiresIn > 7);

    const criticalCount = expired.length + urgent.length;

    const groups = [
      { label: 'EXPIRED',  color: Colors.red,    members: expired  },
      { label: 'URGENT',   color: Colors.orange, members: urgent   },
      { label: 'SOON',     color: Colors.accent, members: soon     },
      { label: 'UPCOMING', color: Colors.green,  members: upcoming },
    ].filter(g => g.members.length > 0);

    return (
      <>
        <Stack.Screen options={{ title: 'Expiry Dashboard' }} />
        <ScrollView style={styles.container} contentContainerStyle={styles.content}  
  showsVerticalScrollIndicator={false}>

          {/* ── Hero ─────────────────────────────────────────── */}
          <FadeInView delay={0}>
            <View style={[styles.hero, { borderColor: criticalCount > 0 ? Colors.red 
  + '40' : Colors.border }]}>
              <View style={styles.heroGlow} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.heroMicro, { color: criticalCount > 0 ?
  Colors.red : Colors.accent }]}>
                  EXPIRY DASHBOARD
                </Text>
                <Text style={styles.heroTitle}>{expiringMembers.length}
  EXPIRING</Text>
                <Text style={styles.heroSub}>Members needing renewal action</Text>   
              </View>
              {criticalCount > 0 && (
                <View style={styles.criticalBadge}>
                  <MaterialCommunityIcons name="alert" size={16} color={Colors.red}  
  />
                  <Text style={styles.criticalVal}>{criticalCount}</Text>
                  <Text style={styles.criticalLabel}>CRITICAL</Text>
                </View>
              )}
            </View>
          </FadeInView>

          {/* ── Summary Pills ─────────────────────────────────── */}
          <FadeInView delay={60}>
            <View style={styles.pillsRow}>
              {[
                { label: 'EXPIRED',  val: expired.length,  color: Colors.red    },   
                { label: 'URGENT',   val: urgent.length,   color: Colors.orange },   
                { label: 'SOON',     val: soon.length,     color: Colors.accent },   
                { label: 'UPCOMING', val: upcoming.length, color: Colors.green  },   
              ].map(p => (
                <View key={p.label} style={[styles.pill, { backgroundColor: p.color +
   '12', borderColor: p.color + '30' }]}>
                  <Text style={[styles.pillVal, { color: p.color }]}>{p.val}</Text>  
                  <Text style={[styles.pillLabel, { color: p.color
  }]}>{p.label}</Text>
                </View>
              ))}
            </View>
          </FadeInView>

          {/* ── Alert Banner (only if critical) ──────────────── */}
          {criticalCount > 0 && (
            <FadeInView delay={100}>
              <View style={styles.alertBanner}>
                <View style={styles.alertAccent} />
                <Text style={styles.alertEmoji}>⚠️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.alertTitle}>{criticalCount}
  MEMBER{criticalCount > 1 ? 'S' : ''} NEED IMMEDIATE ATTENTION</Text>
                  <Text style={styles.alertSub}>
                    {expired.length > 0 ? `${expired.length} expired` : ''}
                    {expired.length > 0 && urgent.length > 0 ? '  ·  ' : ''}
                    {urgent.length > 0 ? `${urgent.length} expiring within 3 days` : 
  ''}
                  </Text>
                </View>
              </View>
            </FadeInView>
          )}

          {/* ── Grouped Member Cards ──────────────────────────── */}
          {groups.map((group, gi) => (
            <FadeInView key={group.label} delay={160 + gi * 60}>
              <Text style={styles.sectionLabel}>{group.label} —
  {group.members.length}</Text>
              {group.members.map((member, i) => {
                const uColor = urgencyColor(member.expiresIn);
                const uLabel = urgencyLabel(member.expiresIn);
                const uIcon  = urgencyIcon(member.expiresIn);

                return (
                  <View key={member.id} style={[styles.memberCard, { borderColor:    
  uColor + '30' }, i < group.members.length - 1 && { marginBottom: 8 }]}>
                    {/* Left urgency bar */}
                    <View style={[styles.memberCardBar, { backgroundColor: uColor }]}
   />

                    {/* Content */}
                    <View style={styles.memberCardInner}>
                      {/* Header */}
                      <View style={styles.memberHeader}>
                        <View style={[styles.memberAvatarWrap, { backgroundColor:    
  uColor + '15' }]}>
                          <Text style={styles.memberAvatar}>{member.avatar}</Text>   
                        </View>
                        <View style={styles.memberInfo}>
                          <Text style={styles.memberName}>{member.name}</Text>       
                          <Text style={styles.memberPlan}>{member.plan} plan</Text>  
                        </View>
                        <View style={[styles.urgBadge, { backgroundColor: uColor +   
  '18' }]}>
                          <MaterialCommunityIcons name={uIcon} size={11}
  color={uColor} />
                          <Text style={[styles.urgText, { color: uColor
  }]}>{uLabel}</Text>
                        </View>
                      </View>

                      {/* Days indicator */}
                      <View style={styles.daysRow}>
                        <MaterialCommunityIcons name="clock-outline" size={12}       
  color={uColor} />
                        <Text style={[styles.daysLeft, { color: uColor
  }]}>{daysText(member.expiresIn)}</Text>
                        {member.expiresIn > 0 && (
                          <View style={styles.daysTrack}>
                            <View style={[styles.daysFill, {
                              width: `${Math.min(100, (member.expiresIn / 30) *      
  100)}%` as any,
                              backgroundColor: uColor,
                            }]} />
                          </View>
                        )}
                      </View>

                      {/* Actions */}
                      <View style={styles.actionRow}>
                        <AnimatedPressable
                          style={[styles.actionBtn, { backgroundColor: Colors.green +
   '15', borderColor: Colors.green + '30' }]}
                          scaleDown={0.95}
                          onPress={() => Linking.openURL(`tel:${member.phone}`)}     
                        >
                          <MaterialCommunityIcons name="phone" size={14}
  color={Colors.green} />
                          <Text style={[styles.actionBtnText, { color: Colors.green  
  }]}>CALL</Text>
                        </AnimatedPressable>
                        <AnimatedPressable
                          style={[styles.actionBtn, { backgroundColor: '#25D366' +   
  '15', borderColor: '#25D366' + '30' }]}
                          scaleDown={0.95}
                          onPress={() =>
  Linking.openURL(`https://wa.me/91${member.phone}`)}
                        >
                          <MaterialCommunityIcons name="whatsapp" size={14}
  color="#25D366" />
                          <Text style={[styles.actionBtnText, { color: '#25D366'     
  }]}>WHATSAPP</Text>
                        </AnimatedPressable>
                        <AnimatedPressable
                          style={[styles.actionBtn, styles.renewBtn]}
                          scaleDown={0.95}
                          onPress={() => router.push('/(owner)/more/renew-plan' as   
  any)}
                        >
                          <MaterialCommunityIcons name="refresh" size={14}
  color={Colors.bg} />
                          <Text style={[styles.actionBtnText, { color: Colors.bg     
  }]}>RENEW</Text>
                        </AnimatedPressable>
                      </View>
                    </View>
                  </View>
                );
              })}
            </FadeInView>
          ))}

          {/* ── All Clear State ───────────────────────────────── */}
          {expiringMembers.length === 0 && (
            <FadeInView delay={100}>
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="check-circle-outline" size={52}        
  color={Colors.green} />
                <Text style={styles.emptyTitle}>ALL CLEAR</Text>
                <Text style={styles.emptySub}>No memberships expiring in the next 30 
  days.</Text>
              </View>
            </FadeInView>
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      </>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    content:   { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32, gap: 12 },

    // Hero
    hero: {
      backgroundColor: Colors.bgCard, borderRadius: 20, padding: 20,
      flexDirection: 'row', alignItems: 'center', gap: 14,
      borderWidth: 1, overflow: 'hidden',
    },
    heroGlow: {
      position: 'absolute', top: -30, left: -20,
      width: 100, height: 100, borderRadius: 50,
      backgroundColor: Colors.accentGlow,
    },
    heroMicro:     { fontFamily: Fonts.medium, fontSize: 9, letterSpacing: 1.5 },    
    heroTitle:     { fontFamily: Fonts.condensedBold, fontSize: 28, color:
  Colors.text, letterSpacing: 0.3 },
    heroSub:       { fontFamily: Fonts.regular, fontSize: 11, color:
  Colors.textMuted, marginTop: 2 },
    criticalBadge: { alignItems: 'center', backgroundColor: Colors.red + '15',       
  borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1,      
  borderColor: Colors.red + '30', gap: 2 },
    criticalVal:   { fontFamily: Fonts.condensedBold, fontSize: 24, color: Colors.red
   },
    criticalLabel: { fontFamily: Fonts.bold, fontSize: 8, color: Colors.red,
  letterSpacing: 1 },

    // Pills
    pillsRow: { flexDirection: 'row', gap: 8 },
    pill: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12,    
  borderWidth: 1, gap: 2 },
    pillVal:   { fontFamily: Fonts.condensedBold, fontSize: 20 },
    pillLabel: { fontFamily: Fonts.bold, fontSize: 7, letterSpacing: 0.8 },

    // Alert banner
    alertBanner: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: Colors.bgCard, borderRadius: 14, padding: 14,
      borderWidth: 1, borderColor: Colors.red + '30', overflow: 'hidden',
    },
    alertAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,       
  backgroundColor: Colors.red },
    alertEmoji:  { fontSize: 24 },
    alertTitle:  { fontFamily: Fonts.bold, fontSize: 12, color: Colors.text,
  letterSpacing: 0.3 },
    alertSub:    { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, 
  marginTop: 2 },

    sectionLabel: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted,    
  letterSpacing: 1.8, marginTop: 4, marginBottom: 6 },

    // Member card
    memberCard: {
      flexDirection: 'row', backgroundColor: Colors.bgCard,
      borderRadius: 14, borderWidth: 1, overflow: 'hidden',
    },
    memberCardBar:   { width: 3 },
    memberCardInner: { flex: 1, padding: 14, gap: 10 },
    memberHeader:    { flexDirection: 'row', alignItems: 'center', gap: 10 },        
    memberAvatarWrap:{ width: 40, height: 40, borderRadius: 20, justifyContent:      
  'center', alignItems: 'center' },
    memberAvatar:    { fontSize: 22 },
    memberInfo:      { flex: 1 },
    memberName:      { fontFamily: Fonts.bold, fontSize: 14, color: Colors.text },   
    memberPlan:      { fontFamily: Fonts.regular, fontSize: 11, color:
  Colors.textMuted, marginTop: 1 },
    urgBadge:        { flexDirection: 'row', alignItems: 'center', gap: 4,
  borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
    urgText:         { fontFamily: Fonts.bold, fontSize: 9, letterSpacing: 0.5 },    

    // Days row
    daysRow:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
    daysLeft:  { fontFamily: Fonts.bold, fontSize: 12 },
    daysTrack: { flex: 1, height: 4, backgroundColor: Colors.border, borderRadius: 2,
   overflow: 'hidden' },
    daysFill:  { height: 4, borderRadius: 2 },

    // Actions
    actionRow:     { flexDirection: 'row', gap: 8 },
    actionBtn:     { flex: 1, flexDirection: 'row', alignItems: 'center',
  justifyContent: 'center', gap: 5, borderRadius: 8, paddingVertical: 9, borderWidth:
   1 },
    actionBtnText: { fontFamily: Fonts.bold, fontSize: 10, letterSpacing: 0.5 },     
    renewBtn:      { backgroundColor: Colors.accent, borderColor: Colors.accent },   

    // Empty state
    emptyState: { alignItems: 'center', paddingVertical: 48, gap: 10 },
    emptyTitle: { fontFamily: Fonts.condensedBold, fontSize: 24, color: Colors.text, 
  letterSpacing: 0.5 },
    emptySub:   { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted,  
  textAlign: 'center' },
  });
