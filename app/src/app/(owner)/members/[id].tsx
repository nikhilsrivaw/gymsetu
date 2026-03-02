  import { useState } from 'react';                                                    import { View, Text, StyleSheet, ScrollView, Linking } from 'react-native';          import { Stack, useLocalSearchParams, useRouter } from 'expo-router';                import { Colors } from '@/constants/colors';                                         import { Fonts } from '@/constants/fonts';                                           import AnimatedPressable from '@/components/AnimatedPressable';                    
  import FadeInView from '@/components/FadeInView';                                                                                                                       
  type TabKey = 'info' | 'plans' | 'payments' | 'attendance';                          const tabs: { key: TabKey; label: string }[] = [                                   
    { key: 'info',       label: 'INFO'       },                                      
    { key: 'plans',      label: 'PLANS'      },
    { key: 'payments',   label: 'PAYMENTS'   },
    { key: 'attendance', label: 'ATTEND'     },
  ];

  const membersDB: Record<string, {
    full_name: string; phone: string; email: string;
    status: 'active' | 'expired' | 'suspended';
    gender: string; dob: string; join_date: string;
    height_cm: number | null; weight_kg: number | null; goal: string;
  }> = {
    '1':  { full_name: 'Rahul Sharma',  phone: '+919876543210', email:
  'rahul@gmail.com',  status: 'active',    gender: 'Male',   dob: '15 Jun 1995',     
  join_date: '10 Sep 2025', height_cm: 175, weight_kg: 78, goal: 'Muscle Gain'       
  },
    '2':  { full_name: 'Priya Patel',   phone: '+919812345678', email:
  'priya@gmail.com',  status: 'active',    gender: 'Female', dob: '22 Sep 1998',     
  join_date: '15 Oct 2025', height_cm: 162, weight_kg: 58, goal: 'Weight Loss'       
  },
    '3':  { full_name: 'Arjun Reddy',   phone: '+919898765432', email:
  'arjun@gmail.com',  status: 'active',    gender: 'Male',   dob: '08 Mar 1992',     
  join_date: '20 Aug 2025', height_cm: 180, weight_kg: 85, goal: 'Muscle Gain'       
  },
    '4':  { full_name: 'Sneha Gupta',   phone: '+919845612378', email:
  'sneha@gmail.com',  status: 'active',    gender: 'Female', dob: '14 Jan 2000',     
  join_date: '05 Feb 2026', height_cm: 158, weight_kg: 52, goal: 'General Fitness'   
  },
    '5':  { full_name: 'Vikram Singh',  phone: '+919867543120', email:
  'vikram@gmail.com', status: 'expired',   gender: 'Male',   dob: '30 Nov 1990',     
  join_date: '01 Dec 2025', height_cm: 182, weight_kg: 90, goal: 'Muscle Gain'       
  },
    '6':  { full_name: 'Amit Kumar',    phone: '+919823456789', email:
  'amit@gmail.com',   status: 'expired',   gender: 'Male',   dob: '18 Jul 1997',     
  join_date: '25 Jan 2026', height_cm: 170, weight_kg: 72, goal: 'Weight Loss'       
  },
    '7':  { full_name: 'Neha Verma',    phone: '+919834567890', email:
  'neha@gmail.com',   status: 'active',    gender: 'Female', dob: '05 Apr 1996',     
  join_date: '18 Feb 2026', height_cm: 165, weight_kg: 60, goal: 'General Fitness'   
  },
    '8':  { full_name: 'Rohan Das',     phone: '+919845678901', email:
  'rohan@gmail.com',  status: 'active',    gender: 'Male',   dob: '12 Dec 1993',     
  join_date: '22 Jan 2026', height_cm: 178, weight_kg: 82, goal: 'Muscle Gain'       
  },
    '9':  { full_name: 'Kavita Joshi',  phone: '+919856789012', email:
  'kavita@gmail.com', status: 'suspended', gender: 'Female', dob: '28 Aug 1999',     
  join_date: '10 Feb 2026', height_cm: 160, weight_kg: 55, goal: 'Weight Loss'       
  },
    '10': { full_name: 'Suresh Nair',   phone: '+919867890123', email:
  'suresh@gmail.com', status: 'active',    gender: 'Male',   dob: '03 May 1988',     
  join_date: '01 Jan 2026', height_cm: 176, weight_kg: 80, goal: 'General Fitness'   
  },
    '11': { full_name: 'Divya Menon',   phone: '+919878901234', email:
  'divya@gmail.com',  status: 'active',    gender: 'Female', dob: '17 Feb 1997',     
  join_date: '30 Jan 2026', height_cm: 163, weight_kg: 57, goal: 'Weight Loss'       
  },
    '12': { full_name: 'Manish Tiwari', phone: '+919889012345', email:
  'manish@gmail.com', status: 'expired',   gender: 'Male',   dob: '09 Oct 1994',
  join_date: '20 Jan 2026', height_cm: 172, weight_kg: 76, goal: 'General Fitness'   
  },
  };

  const plansDB: Record<string, { plan: string; start: string; end: string; status:  
  'active' | 'expired'; price: number }[]> = {
    '1': [
      { plan: '3 Month Standard', start: '15 Jan 2026', end: '15 Apr 2026', status:  
  'active',  price: 3500 },
      { plan: '1 Month Basic',    start: '10 Dec 2025', end: '10 Jan 2026', status:  
  'expired', price: 1500 },
    ],
    '2': [{ plan: '6 Month Premium', start: '20 Dec 2025', end: '20 Jun 2026',       
  status: 'active',  price: 6000  }],
    '3': [{ plan: '1 Year Ultimate', start: '10 Dec 2025', end: '10 Dec 2026',       
  status: 'active',  price: 10000 }],
    '5': [{ plan: '3 Month Standard', start: '28 Nov 2025', end: '28 Feb 2026',      
  status: 'expired', price: 3500 }],
  };

  const paymentsDB: Record<string, { date: string; amount: number; method: string;   
  note: string }[]> = {
    '1': [
      { date: '15 Jan 2026', amount: 3500,  method: 'UPI',  note: '3 Month Standard' 
  },
      { date: '10 Dec 2025', amount: 1500,  method: 'Cash', note: '1 Month Basic'    
  },
    ],
    '2': [{ date: '20 Dec 2025', amount: 6000,  method: 'UPI',  note: '6 Month   Premium' }],
    '3': [{ date: '10 Dec 2025', amount: 10000, method: 'UPI',  note: '1 Year   Ultimate' }],
    '5': [{ date: '28 Nov 2025', amount: 3500,  method: 'Cash', note: '3 Month  Standard' }],
  };

  const attendanceDB: Record<string, { date: string; time: string }[]> = {
    '1': [
      { date: '28 Feb', time: '6:15 AM' }, { date: '27 Feb', time: '6:20 AM' },      
      { date: '26 Feb', time: '6:10 AM' }, { date: '25 Feb', time: '6:30 AM' },      
      { date: '24 Feb', time: '6:18 AM' }, { date: '22 Feb', time: '6:25 AM' },      
      { date: '21 Feb', time: '6:12 AM' }, { date: '20 Feb', time: '6:35 AM' },      
    ],
    '2': [
      { date: '28 Feb', time: '7:00 PM' }, { date: '27 Feb', time: '7:10 PM' },      
      { date: '25 Feb', time: '6:55 PM' }, { date: '24 Feb', time: '7:05 PM' },      
      { date: '22 Feb', time: '7:00 PM' },
    ],
    '3': [
      { date: '28 Feb', time: '5:30 AM' }, { date: '27 Feb', time: '5:35 AM' },      
      { date: '26 Feb', time: '5:25 AM' }, { date: '25 Feb', time: '5:40 AM' },      
      { date: '24 Feb', time: '5:28 AM' }, { date: '23 Feb', time: '5:32 AM' },      
      { date: '22 Feb', time: '5:30 AM' }, { date: '21 Feb', time: '5:45 AM' },      
      { date: '20 Feb', time: '5:30 AM' },
    ],
  };

  const defaultMember = {
    full_name: 'Member', phone: '-', email: '-', status: 'active' as const,
    gender: '-', dob: '-', join_date: '-', height_cm: null, weight_kg: null, goal:   
  '-',
  };

  export default function MemberProfileScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router  = useRouter();
    const [activeTab, setActiveTab] = useState<TabKey>('info');

    const member         = membersDB[id || ''] || defaultMember;
    const memberPlans    = plansDB[id || '']    || [];
    const memberPayments = paymentsDB[id || ''] || [];
    const memberAttend   = attendanceDB[id || ''] || [];

    const statusColor = member.status === 'active' ? Colors.green : member.status ===
   'expired' ? Colors.red : Colors.orange;
    const initials    = member.full_name.split(' ').map(n => n[0]).join('').slice(0, 
  2).toUpperCase();

    const renderContent = () => {
      if (activeTab === 'info') {
        return (
          <View>
            {[
              { label: 'PHONE',   value: member.phone,
     emoji: '📱' },
              { label: 'EMAIL',   value: member.email,
     emoji: '📧' },
              { label: 'GENDER',  value: member.gender,
     emoji: '👤' },
              { label: 'DOB',     value: member.dob,
     emoji: '🎂' },
              { label: 'JOINED',  value: member.join_date,
     emoji: '📅' },
              { label: 'HEIGHT',  value: member.height_cm ? `${member.height_cm} cm` 
  : '—', emoji: '📏' },
              { label: 'WEIGHT',  value: member.weight_kg ? `${member.weight_kg} kg` 
  : '—', emoji: '⚖️' },
              { label: 'GOAL',    value: member.goal,
     emoji: '🎯' },
            ].map((row, i, arr) => (
              <View key={row.label} style={[styles.infoRow, i < arr.length - 1 &&    
  styles.infoRowBorder]}>
                <Text style={styles.infoEmoji}>{row.emoji}</Text>
                <Text style={styles.infoLabel}>{row.label}</Text>
                <Text style={styles.infoValue}>{row.value}</Text>
              </View>
            ))}
          </View>
        );
      }

      if (activeTab === 'plans') {
        if (!memberPlans.length) return <EmptyTab emoji="📄" text="No plans assigned 
  yet" />;
        return (
          <View style={styles.tabContent}>
            {memberPlans.map((p, i) => {
              const c = p.status === 'active' ? Colors.green : Colors.textMuted;     
              return (
                <View key={i} style={[styles.planItem, { borderLeftColor: c }]}>     
                  <View style={styles.planHeader}>
                    <Text style={styles.planName}>{p.plan}</Text>
                    <View style={[styles.planBadge, { backgroundColor: c + '18' }]}> 
                      <Text style={[styles.planBadgeText, { color: c }]}>
                        {p.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.planDates}>{p.start}  →  {p.end}</Text>        
                  <Text
  style={styles.planPrice}>₹{p.price.toLocaleString('en-IN')}</Text>
                </View>
              );
            })}
          </View>
        );
      }

      if (activeTab === 'payments') {
        if (!memberPayments.length) return <EmptyTab emoji="💳" text="No payments    
  recorded yet" />;
        return (
          <View style={styles.tabContent}>
            {memberPayments.map((p, i) => (
              <View key={i} style={[styles.payItem, i < memberPayments.length - 1 && 
  styles.payItemBorder]}>
                <Text style={styles.payEmoji}>
                  {p.method === 'UPI' ? '📱' : p.method === 'Card' ? '💳' : '💵'}    
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.payNote}>{p.note}</Text>
                  <Text style={styles.payDate}>{p.date}  ·  {p.method}</Text>        
                </View>
                <Text
  style={styles.payAmount}>+₹{p.amount.toLocaleString('en-IN')}</Text>
              </View>
            ))}
          </View>
        );
      }

      if (activeTab === 'attendance') {
        if (!memberAttend.length) return <EmptyTab emoji="📋" text="No attendance  records yet" />;
        return (
          <View style={styles.tabContent}>
            <View style={styles.attendSummary}>
              <Text style={styles.attendCount}>{memberAttend.length}</Text>
              <Text style={styles.attendUnit}>days</Text>
              <Text style={styles.attendLabel}>  THIS MONTH</Text>
            </View>
            {memberAttend.map((a, i) => (
              <View key={i} style={[styles.attendRow, i < memberAttend.length - 1 && 
  styles.attendRowBorder]}>
                <View style={styles.attendDot} />
                <Text style={styles.attendDate}>{a.date}</Text>
                <Text style={styles.attendTime}>{a.time}</Text>
              </View>
            ))}
          </View>
        );
      }
      return null;
    };

    return (
      <>
        <Stack.Screen options={{ title: '' }} />
        <ScrollView style={styles.container} contentContainerStyle={styles.scroll}   
  showsVerticalScrollIndicator={false}>

          {/* Hero */}
          <FadeInView delay={0}>
            <View style={styles.hero}>
              <View style={[styles.avatarRing, { borderColor: statusColor + '60' }]}>
                <View style={[styles.avatarInner, { backgroundColor: statusColor +   
  '18' }]}>
                  <Text style={[styles.avatarText, { color: statusColor
  }]}>{initials}</Text>
                </View>
              </View>
              <Text style={styles.heroName}>{member.full_name}</Text>
              <View style={[styles.statusPill, { backgroundColor: statusColor + '18' 
  }]}>
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <Text style={[styles.statusText, { color: statusColor }]}>
                  {member.status.toUpperCase()}
                </Text>
              </View>
            </View>
          </FadeInView>

          {/* Action buttons */}
          <FadeInView delay={50}>
            <View style={styles.actions}>
              <AnimatedPressable style={styles.actionBtn} scaleDown={0.94}
                onPress={() => Linking.openURL(`tel:${member.phone}`)}>
                <Text style={styles.actionEmoji}>📞</Text>
                <Text style={styles.actionLabel}>CALL</Text>
              </AnimatedPressable>
              <AnimatedPressable style={styles.actionBtn} scaleDown={0.94}
                onPress={() =>
  Linking.openURL(`https://wa.me/${member.phone.replace('+', '')}`)}>
                <Text style={styles.actionEmoji}>💬</Text>
                <Text style={styles.actionLabel}>WHATSAPP</Text>
              </AnimatedPressable>
              <AnimatedPressable style={[styles.actionBtn, styles.actionBtnAccent]}  
  scaleDown={0.94}
                onPress={() => router.push({ pathname: '/(owner)/more/renew-plan',   
  params: { memberId: id, memberName: member.full_name } })}>
                <Text style={styles.actionEmoji}>🔄</Text>
                <Text style={[styles.actionLabel, { color: Colors.accent
  }]}>RENEW</Text>
              </AnimatedPressable>
              <AnimatedPressable style={styles.actionBtn} scaleDown={0.94}
                onPress={() => router.push({ pathname: '/(owner)/members/edit',   params: { memberId: id } })}>
                <Text style={styles.actionEmoji}>✏️</Text>
                <Text style={styles.actionLabel}>EDIT</Text>
              </AnimatedPressable>
            </View>
          </FadeInView>

          {/* Tab bar */}
          <FadeInView delay={120}>
            <View style={styles.tabBar}>
              {tabs.map(t => (
                <AnimatedPressable
                  key={t.key}
                  style={[styles.tab, activeTab === t.key && styles.tabActive]}      
                  onPress={() => setActiveTab(t.key)}
                  scaleDown={0.95}
                >
                  <Text style={[styles.tabText, activeTab === t.key &&
  styles.tabTextActive]}>
                    {t.label}
                  </Text>
                  {activeTab === t.key && <View style={styles.tabUnderline} />}      
                </AnimatedPressable>
              ))}
            </View>
          </FadeInView>

          {/* Content */}
          <FadeInView delay={200}>
            <View style={styles.contentCard}>{renderContent()}</View>
          </FadeInView>

          <View style={{ height: 32 }} />
        </ScrollView>
      </>
    );
  }

  function EmptyTab({ emoji, text }: { emoji: string; text: string }) {
    return (
      <View style={styles.emptyTab}>
        <Text style={styles.emptyTabEmoji}>{emoji}</Text>
        <Text style={styles.emptyTabText}>{text}</Text>
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    scroll:    { paddingBottom: 40 },

    // Hero
    hero: { alignItems: 'center', paddingTop: 20, paddingBottom: 20 },
    avatarRing: {
      width: 84, height: 84, borderRadius: 42,
      borderWidth: 2, justifyContent: 'center', alignItems: 'center',
    },
    avatarInner: {
      width: 72, height: 72, borderRadius: 36,
      justifyContent: 'center', alignItems: 'center',
    },
    avatarText:   { fontFamily: Fonts.condensedBold, fontSize: 26 },
    heroName:     { fontFamily: Fonts.condensedBold, fontSize: 28, color:
  Colors.text, marginTop: 12, letterSpacing: 0.5 },
    statusPill:   { flexDirection: 'row', alignItems: 'center', marginTop: 8,        
  paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10, gap: 6 },
    statusDot:    { width: 6, height: 6, borderRadius: 3 },
    statusText:   { fontFamily: Fonts.bold, fontSize: 9, letterSpacing: 1 },

    // Actions
    actions: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 20 
  },
    actionBtn: {
      flex: 1, backgroundColor: Colors.bgCard,
      borderRadius: 12, paddingVertical: 14,
      alignItems: 'center', gap: 5,
      borderWidth: 1, borderColor: Colors.border,
    },
    actionBtnAccent: { borderColor: Colors.accent + '40', backgroundColor:
  Colors.accentMuted },
    actionEmoji: { fontSize: 18 },
    actionLabel: { fontFamily: Fonts.bold, fontSize: 8, color: Colors.textMuted,     
  letterSpacing: 0.8 },

    // Tabs
    tabBar: {
      flexDirection: 'row', marginHorizontal: 16,
      backgroundColor: Colors.bgCard, borderRadius: 12,
      padding: 4, marginBottom: 12,
      borderWidth: 1, borderColor: Colors.border,
    },
    tab:          { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius:
   10, position: 'relative' },
    tabActive:    { backgroundColor: Colors.bgElevated },
    tabText:      { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted,    
  letterSpacing: 0.8 },
    tabTextActive:{ color: Colors.accent },
    tabUnderline: { position: 'absolute', bottom: 4, width: 16, height: 2,
  borderRadius: 1, backgroundColor: Colors.accent },

    // Content card
    contentCard: {
      marginHorizontal: 16, backgroundColor: Colors.bgCard,
      borderRadius: 16, borderWidth: 1, borderColor: Colors.border, overflow:        
  'hidden',
    },

    // Info tab
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 
  13, paddingHorizontal: 16 },
    infoRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },       
    infoEmoji: { fontSize: 14, width: 22, textAlign: 'center' },
    infoLabel: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted,       
  letterSpacing: 1, width: 60 },
    infoValue: { flex: 1, fontFamily: Fonts.medium, fontSize: 13, color: Colors.text,
   textAlign: 'right' },

    tabContent: { padding: 12, gap: 8 },

    // Plans tab
    planItem: {
      backgroundColor: Colors.bgElevated, borderRadius: 10,
      padding: 12, gap: 4, borderLeftWidth: 3,
    },
    planHeader:    { flexDirection: 'row', justifyContent: 'space-between',
  alignItems: 'center' },
    planName:      { fontFamily: Fonts.bold, fontSize: 13, color: Colors.text },     
    planBadge:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },    
    planBadgeText: { fontFamily: Fonts.bold, fontSize: 8, letterSpacing: 0.8 },      
    planDates:     { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted
   },
    planPrice:     { fontFamily: Fonts.condensedBold, fontSize: 16, color:
  Colors.accent },

    // Payments tab
    payItem:       { flexDirection: 'row', alignItems: 'center', gap: 10,
  paddingVertical: 12 },
    payItemBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },       
    payEmoji:      { fontSize: 18 },
    payNote:       { fontFamily: Fonts.bold, fontSize: 13, color: Colors.text },     
    payDate:       { fontFamily: Fonts.regular, fontSize: 11, color:
  Colors.textMuted, marginTop: 2 },
    payAmount:     { fontFamily: Fonts.condensedBold, fontSize: 16, color:
  Colors.green },

    // Attendance tab
    attendSummary: { flexDirection: 'row', alignItems: 'baseline', paddingBottom: 10,
   marginBottom: 4, borderBottomWidth: 1, borderBottomColor: Colors.border },        
    attendCount:   { fontFamily: Fonts.condensedBold, fontSize: 28, color:
  Colors.accent },
    attendUnit:    { fontFamily: Fonts.medium, fontSize: 12, color: Colors.accent,   
  marginLeft: 3 },
    attendLabel:   { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted,   
  letterSpacing: 1 },
    attendRow:     { flexDirection: 'row', alignItems: 'center', gap: 10,
  paddingVertical: 9 },
    attendRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },     
    attendDot:     { width: 7, height: 7, borderRadius: 4, backgroundColor:
  Colors.green },
    attendDate:    { flex: 1, fontFamily: Fonts.medium, fontSize: 13, color:
  Colors.text },
    attendTime:    { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted
   },

    // Empty
    emptyTab:      { alignItems: 'center', paddingVertical: 40, gap: 8 },
    emptyTabEmoji: { fontSize: 30 },
    emptyTabText:  { fontFamily: Fonts.medium, fontSize: 13, color: Colors.textMuted 
  },
  });
