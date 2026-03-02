                                                                                     import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';        import { SafeAreaView } from 'react-native-safe-area-context';                       import { MaterialCommunityIcons } from '@expo/vector-icons';                         import { useState } from 'react';                                                  
  import { Colors } from '@/constants/colors';                                         import { Fonts } from '@/constants/fonts';                                         
  import FadeInView from '@/components/FadeInView';                                    import AnimatedPressable from '@/components/AnimatedPressable';                    
                                                                                     
  type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];       

  const faqs: { q: string; a: string; tag: string }[] = [
    {
      tag: 'MEMBERS',
      q: 'How do I add a new member?',
      a: 'Go to Members → tap the + button at the top right. Fill in personal   details, select a plan, and tap Save. The member will appear in your list instantly.',
    },
    {
      tag: 'PAYMENTS',
      q: 'How do I record a payment?',
      a: 'Go to Payments → tap RECORD PAYMENT. Select the member, enter the amount, choose the payment method, and confirm. A receipt is automatically generated.',    
    },
    {
      tag: 'PLANS',
      q: 'Can I create custom membership plans?',
      a: 'Yes! Go to Plans → tap ADD PLAN. Set the name, duration, price, and anyadditional features. Plans are available immediately for new member enrollments.', 
    },
    {
      tag: 'RENEWALS',
      q: 'How do I renew an expiring membership?',
      a: 'Go to More → Renew Plan. Youll see all expiring members. Tap a member, select the new plan, choose payment method, and confirm. The members expiry date updates automatically.',
    },
    {
      tag: 'ATTENDANCE',
      q: 'How does attendance tracking work?',
      a: 'Go to More → Attendance. Youll see todays member list. Toggle individual members as Present, or use Mark All Present. Tap Save Attendance to record the session.',
    },
    {
      tag: 'BACKUP',
      q: 'How often is my data backed up?',
      a: 'Auto backup runs every night at 2:00 AM. You can also trigger a manual backup anytime from More → Backup. All backups are encrypted and stored securely in the cloud.',
    },
    {
      tag: 'REPORTS',
      q: 'Where can I see revenue reports?',
      a: 'Go to More → Reports & Analytics. Youll find revenue trends, member growth, attendance patterns, and expiry alerts — all with visual charts and   filters.',
    },
    {
      tag: 'ACCOUNT',
      q: 'How do I change my PIN or password?',
      a: 'Go to More → Settings → Security → Change PIN. Enter your new 4-digit PIN   twice and confirm. For password changes, use the email reset link from the login screen.',
    },
  ];

  const contactOptions: { label: string; desc: string; icon: IconName; color: string;
   value: string }[] = [
    { label: 'WhatsApp Support', desc: 'Chat with us — usually replies in 5 min',    
  icon: 'whatsapp',          color: '#25D366', value: '+91 98765 43210' },
    { label: 'Email Support',    desc: 'Detailed queries & bug reports',
  icon: 'email-outline',     color: Colors.accent, value: 'support@gymsetu.in' },    
    { label: 'Call Us',          desc: 'Mon–Sat, 9 AM – 6 PM',
  icon: 'phone-outline',     color: '#3B82F6', value: '+91 98765 43210'    },        
    { label: 'Video Tutorial',   desc: 'Watch our getting started guide',
  icon: 'youtube',           color: '#FF0000', value: 'youtube.com/gymsetu' },       
  ];

  const quickGuides: { label: string; icon: IconName; color: string; steps: number   
  }[] = [
    { label: 'Getting Started',       icon: 'rocket-launch-outline', color:
  Colors.accent, steps: 5 },
    { label: 'Managing Members',      icon: 'account-group-outline',  color:
  Colors.green,  steps: 7 },
    { label: 'Payments & Billing',    icon: 'cash-multiple',          color:
  '#3B82F6',     steps: 4 },
    { label: 'Reports & Analytics',   icon: 'chart-line',             color:
  '#A78BFA',     steps: 6 },
  ];

  const tags = ['ALL', 'MEMBERS', 'PAYMENTS', 'PLANS', 'RENEWALS', 'ATTENDANCE',     
  'BACKUP', 'REPORTS', 'ACCOUNT'];

  export default function HelpScreen() {
    const [openFaq, setOpenFaq]     = useState<number | null>(null);
    const [activeTag, setActiveTag] = useState('ALL');

    const filtered = activeTag === 'ALL' ? faqs : faqs.filter(f => f.tag ===
  activeTag);

    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScrollView style={styles.container} contentContainerStyle={styles.scroll}   
  showsVerticalScrollIndicator={false}>

          {/* ── Hero ─────────────────────────────────────────── */}
          <FadeInView delay={0}>
            <View style={styles.hero}>
              <View style={styles.heroGlow} />
              <View style={styles.heroIcon}>
                <MaterialCommunityIcons name="help-circle-outline" size={28}
  color={Colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroMicro}>SUPPORT CENTER</Text>
                <Text style={styles.heroTitle}>HELP & FAQ</Text>
                <Text style={styles.heroSub}>Find answers or reach our team</Text>   
              </View>
              <View style={styles.heroBadge}>
                <View style={styles.heroBadgeDot} />
                <Text style={styles.heroBadgeText}>ONLINE</Text>
              </View>
            </View>
          </FadeInView>

          {/* ── Quick Guides ──────────────────────────────────── */}
          <FadeInView delay={60}>
            <Text style={styles.sectionLabel}>QUICK GUIDES</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
  contentContainerStyle={styles.guideRow}>
              {quickGuides.map(g => (
                <AnimatedPressable key={g.label} style={styles.guideCard}
  scaleDown={0.95}>
                  <View style={[styles.guideIcon, { backgroundColor: g.color + '18'  
  }]}>
                    <MaterialCommunityIcons name={g.icon} size={22} color={g.color}  
  />
                  </View>
                  <Text style={styles.guideLabel}>{g.label}</Text>
                  <Text style={styles.guideSteps}>{g.steps} steps</Text>
                  <View style={[styles.guideArrow, { backgroundColor: g.color + '18' 
  }]}>
                    <MaterialCommunityIcons name="arrow-right" size={12}
  color={g.color} />
                  </View>
                </AnimatedPressable>
              ))}
            </ScrollView>
          </FadeInView>

          {/* ── FAQ Filter ────────────────────────────────────── */}
          <FadeInView delay={120}>
            <Text style={styles.sectionLabel}>FREQUENTLY ASKED — {filtered.length}   
  ARTICLES</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
  contentContainerStyle={styles.tagRow}>
              {tags.map(t => (
                <Pressable
                  key={t}
                  style={[styles.tagChip, activeTag === t && styles.tagChipActive]}  
                  onPress={() => setActiveTag(t)}
                >
                  <Text style={[styles.tagText, activeTag === t &&
  styles.tagTextActive]}>{t}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </FadeInView>

          {/* ── FAQ Accordion ─────────────────────────────────── */}
          <View style={styles.faqCard}>
            {filtered.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <AnimatedPressable
                  key={i}
                  style={[styles.faqItem, i < filtered.length - 1 &&
  styles.faqBorder]}
                  scaleDown={0.99}
                  onPress={() => setOpenFaq(isOpen ? null : i)}
                >
                  <View style={styles.faqHeader}>
                    <View style={[styles.faqTagBadge, { backgroundColor:
  Colors.accent + '15' }]}>
                      <Text style={styles.faqTag}>{faq.tag}</Text>
                    </View>
                    <Text style={styles.faqQ}>{faq.q}</Text>
                    <MaterialCommunityIcons
                      name={isOpen ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={isOpen ? Colors.accent : Colors.textMuted}
                    />
                  </View>
                  {isOpen && (
                    <View style={styles.faqAnswer}>
                      <View style={styles.faqAnswerBar} />
                      <Text style={styles.faqA}>{faq.a}</Text>
                    </View>
                  )}
                </AnimatedPressable>
              );
            })}
          </View>

          {/* ── Contact Support ───────────────────────────────── */}
          <FadeInView delay={220}>
            <Text style={styles.sectionLabel}>CONTACT SUPPORT</Text>
            {contactOptions.map((c, i) => (
              <AnimatedPressable
                key={c.label}
                style={[styles.contactRow, i < contactOptions.length - 1 && {        
  marginBottom: 8 }]}
                scaleDown={0.97}
              >
                <View style={[styles.contactIcon, { backgroundColor: c.color + '18'  
  }]}>
                  <MaterialCommunityIcons name={c.icon} size={20} color={c.color} /> 
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactLabel}>{c.label}</Text>
                  <Text style={styles.contactDesc}>{c.desc}</Text>
                  <Text style={[styles.contactValue, { color: c.color
  }]}>{c.value}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={18}
  color={Colors.textMuted} />
              </AnimatedPressable>
            ))}
          </FadeInView>

          {/* ── App Info ──────────────────────────────────────── */}
          <FadeInView delay={300}>
            <View style={styles.appInfoCard}>
              <View style={styles.appInfoAccent} />
              <View style={styles.appInfoInner}>
                {[
                  { label: 'VERSION',   val: '1.0.0'            },
                  { label: 'BUILD',     val: '2024.06.01'       },
                  { label: 'PLATFORM',  val: 'React Native / Expo' },
                  { label: 'SUPPORT',   val: 'support@gymsetu.in'  },
                ].map(r => (
                  <View key={r.label} style={styles.appInfoRow}>
                    <Text style={styles.appInfoLabel}>{r.label}</Text>
                    <Text style={styles.appInfoVal}>{r.val}</Text>
                  </View>
                ))}
              </View>
            </View>
          </FadeInView>

          <Text style={styles.footer}>Made with ❤️ for gym owners across India</Text>
          <View style={{ height: 32 }} />
        </ScrollView>
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
      overflow: 'hidden', marginBottom: 20,
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
    heroMicro: { fontFamily: Fonts.medium, fontSize: 9, color: Colors.accent,        
  letterSpacing: 1.5 },
    heroTitle: { fontFamily: Fonts.condensedBold, fontSize: 28, color: Colors.text,  
  letterSpacing: 0.5 },
    heroSub:   { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted,   
  marginTop: 2 },
    heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor:
   Colors.green + '15', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5,   
  borderWidth: 1, borderColor: Colors.green + '30' },
    heroBadgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor:
  Colors.green },
    heroBadgeText: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.green,       
  letterSpacing: 0.8 },

    sectionLabel: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted,    
  letterSpacing: 1.8, marginBottom: 10, marginTop: 4 },

    // Quick guides
    guideRow: { gap: 10, paddingBottom: 20 },
    guideCard: {
      width: 140, backgroundColor: Colors.bgCard, borderRadius: 16,
      padding: 14, gap: 6, borderWidth: 1, borderColor: Colors.border,
    },
    guideIcon:  { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', 
  alignItems: 'center', marginBottom: 2 },
    guideLabel: { fontFamily: Fonts.bold, fontSize: 12, color: Colors.text },        
    guideSteps: { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted },
    guideArrow: { alignSelf: 'flex-start', width: 24, height: 24, borderRadius: 8,   
  justifyContent: 'center', alignItems: 'center', marginTop: 4 },

    // Tag filter
    tagRow:      { gap: 8, paddingBottom: 12 },
    tagChip:     { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,      
  backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border },      
    tagChipActive: { backgroundColor: Colors.accentMuted, borderColor: Colors.accent 
  },
    tagText:     { fontFamily: Fonts.bold, fontSize: 8, color: Colors.textMuted,     
  letterSpacing: 0.8 },
    tagTextActive: { color: Colors.accent },

    // FAQ
    faqCard:   { backgroundColor: Colors.bgCard, borderRadius: 14, borderWidth: 1,   
  borderColor: Colors.border, overflow: 'hidden', marginBottom: 20 },
    faqItem:   { paddingHorizontal: 14, paddingVertical: 14 },
    faqBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
    faqHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    faqTagBadge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },      
    faqTag:    { fontFamily: Fonts.bold, fontSize: 7, color: Colors.accent,
  letterSpacing: 0.6 },
    faqQ:      { flex: 1, fontFamily: Fonts.bold, fontSize: 13, color: Colors.text },
    faqAnswer: { flexDirection: 'row', gap: 10, marginTop: 12 },
    faqAnswerBar: { width: 3, borderRadius: 2, backgroundColor: Colors.accent + '50' 
  },
    faqA:      { flex: 1, fontFamily: Fonts.regular, fontSize: 12, color:
  Colors.textMuted, lineHeight: 20 },

    // Contact
    contactRow: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      backgroundColor: Colors.bgCard, borderRadius: 14, padding: 14,
      borderWidth: 1, borderColor: Colors.border,
    },
    contactIcon:  { width: 46, height: 46, borderRadius: 13, justifyContent:
  'center', alignItems: 'center' },
    contactInfo:  { flex: 1, gap: 2 },
    contactLabel: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.text },      
    contactDesc:  { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted 
  },
    contactValue: { fontFamily: Fonts.bold, fontSize: 11, letterSpacing: 0.3,        
  marginTop: 2 },

    // App info
    appInfoCard:  { flexDirection: 'row', backgroundColor: Colors.bgCard,
  borderRadius: 14, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',  
  marginBottom: 16 },
    appInfoAccent:{ width: 3, backgroundColor: Colors.accent },
    appInfoInner: { flex: 1, padding: 14, gap: 10 },
    appInfoRow:   { flexDirection: 'row', justifyContent: 'space-between',
  alignItems: 'center' },
    appInfoLabel: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted,    
  letterSpacing: 1 },
    appInfoVal:   { fontFamily: Fonts.medium, fontSize: 12, color: Colors.text },    

    footer: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted,      
  textAlign: 'center', marginTop: 4 },
  });