 import { useState } from 'react';
  import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';   import { FAB, Portal, Modal, TextInput } from 'react-native-paper';                  import { Stack } from 'expo-router';                                                 import { Colors } from '@/constants/colors';                                         import { Fonts } from '@/constants/fonts';                                         
  import AnimatedPressable from '@/components/AnimatedPressable';                      import FadeInView from '@/components/FadeInView';                                  
                                                                                       interface Announcement {                                                           
    id: string; title: string; body: string;                                         
    category: string; emoji: string; date: string;       
    readCount: number; totalMembers: number;
  }

  const catColors: Record<string, string> = {
    Holiday: Colors.orange, Class: '#EC4899',
    Maintenance: Colors.textMuted, Event: Colors.accent,
    Offer: Colors.red, General: Colors.green,
  };

  const mockAnnouncements: Announcement[] = [
    { id: '1', title: 'Gym Closed on Holi',             body: 'The gym will remain closed on 14th March for Holi. Happy Holi to all members! 🎨',
                                       category: 'Holiday',     emoji: '🎉', date:   
  '28 Feb 2026', readCount: 112, totalMembers: 148 },
    { id: '2', title: 'New Zumba Batch Starting',        body: 'Launching a new Zumba batch from 5th March. Evening 6–7 PM. Limited 20 seats. Register at the front   desk.',                                  category: 'Class',       emoji: '💃',     
  date: '25 Feb 2026', readCount: 87,  totalMembers: 148 },
    { id: '3', title: 'Maintenance: Steam Room',         body: 'The steam room will  be under maintenance from 1st to 3rd March. Sorry for the inconvenience.',
                                        category: 'Maintenance', emoji: '🔧', date:  
  '22 Feb 2026', readCount: 95,  totalMembers: 148 },
    { id: '4', title: 'February Challenge Winners',      body: 'Congratulations to  Rahul, Priya, and Arjun for completing the 30-day challenge! Come collect your prizes.',                                  category: 'Event',       emoji: '🏆',   
  date: '20 Feb 2026', readCount: 134, totalMembers: 148 },
    { id: '5', title: 'Renewal Offer: 20% Off',          body: 'Renew your membership this week and get 20% off on 3-month and 6-month plans. Offer valid till 28 Feb.',
                                       category: 'Offer',       emoji: '🔥', date:   '18 Feb 2026', readCount: 141, totalMembers: 148 },
  ];

  const categories = [
    { label: 'General',     emoji: '📢' },
    { label: 'Holiday',     emoji: '🎉' },
    { label: 'Class',       emoji: '💃' },
    { label: 'Maintenance', emoji: '🔧' },
    { label: 'Event',       emoji: '🏆' },
    { label: 'Offer',       emoji: '🔥' },
  ];

  export default function AnnouncementsScreen() {
    const [announcements]          = useState(mockAnnouncements);
    const [show, setShow]          = useState(false);
    const [title, setTitle]        = useState('');
    const [body, setBody]          = useState('');
    const [selectedCat, setSelectedCat] = useState('General');
    const [saving, setSaving]      = useState(false);

    const ip = {
      mode: 'outlined' as const, style: styles.input,
      outlineColor: Colors.border, activeOutlineColor: Colors.accent,
      textColor: Colors.text, theme: { colors: { onSurfaceVariant: Colors.textMuted }
   },
    };

    const avgRead = Math.round(
      announcements.reduce((s, a) => s + (a.readCount / a.totalMembers) * 100, 0) /  
  announcements.length
    );

    const handleSend = () => {
      if (!title.trim() || !body.trim()) return;
      setSaving(true);
      setTimeout(() => { setSaving(false); setShow(false); setTitle(''); setBody('');
   setSelectedCat('General'); }, 400);
    };

    return (
      <>
        <Stack.Screen options={{ title: 'Announcements' }} />
        <View style={styles.container}>

          {/* ── Hero stats ──────────────────────────── */}
          <FadeInView delay={0}>
            <View style={styles.hero}>
              <View style={styles.heroGlow} />
              <View style={styles.heroLeft}>
                <Text style={styles.heroMicro}>ANNOUNCEMENTS</Text>
                <Text style={styles.heroTitle}>BROADCAST</Text>
                <Text style={styles.heroSub}>Send notices to all
  {announcements[0]?.totalMembers} members</Text>
              </View>
              <View style={styles.heroStats}>
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatVal}>{announcements.length}</Text>     
                  <Text style={styles.heroStatLabel}>TOTAL</Text>
                </View>
                <View style={styles.heroStatDivider} />
                <View style={styles.heroStat}>
                  <Text style={[styles.heroStatVal, { color: Colors.green
  }]}>{avgRead}%</Text>
                  <Text style={styles.heroStatLabel}>AVG READ</Text>
                </View>
              </View>
            </View>
          </FadeInView>

          {/* ── List ────────────────────────────────── */}
          <FlatList
            data={announcements}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
            renderItem={({ item, index }) => {
              const color      = catColors[item.category] || Colors.accent;
              const readPct    = Math.round((item.readCount / item.totalMembers) *   
  100);
              return (
                <FadeInView delay={80 + index * 60}>
                  <AnimatedPressable style={styles.card} scaleDown={0.98}>
                    {/* left accent bar */}
                    <View style={[styles.cardBar, { backgroundColor: color }]} />    

                    <View style={styles.cardBody}>
                      {/* top row */}
                      <View style={styles.cardTop}>
                        <Text style={styles.cardEmoji}>{item.emoji}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.cardTitle}
  numberOfLines={1}>{item.title}</Text>
                          <View style={styles.cardMeta}>
                            <View style={[styles.catBadge, { backgroundColor: color +
   '18' }]}>
                              <Text style={[styles.catBadgeText, { color
  }]}>{item.category.toUpperCase()}</Text>
                            </View>
                            <Text style={styles.cardDate}>{item.date}</Text>
                          </View>
                        </View>
                      </View>

                      {/* body */}
                      <Text style={styles.cardText}
  numberOfLines={2}>{item.body}</Text>

                      {/* read progress */}
                      <View style={styles.readRow}>
                        <View style={styles.readTrack}>
                          <View style={[styles.readFill, { width: `${readPct}%` as   
  any, backgroundColor: color }]} />
                        </View>
                        <Text style={styles.readLabel}>
                          {item.readCount}/{item.totalMembers}
                          <Text style={[styles.readPct, { color }]}>
  {readPct}%</Text>
                        </Text>
                      </View>
                    </View>
                  </AnimatedPressable>
                </FadeInView>
              );
            }}
          />

          <FAB icon="plus" style={styles.fab} onPress={() => setShow(true)}
  color="#FFF" customSize={56} />

          {/* ── Compose modal ───────────────────────── */}
          <Portal>
            <Modal visible={show} onDismiss={() => setShow(false)}
  contentContainerStyle={styles.modal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>NEW ANNOUNCEMENT</Text>
                <TouchableOpacity onPress={() => setShow(false)}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalForm}>
                <TextInput label="Title" value={title} onChangeText={setTitle}       
  {...ip} />
                <TextInput
                  label="Message"
                  value={body} onChangeText={setBody}
                  multiline numberOfLines={4} {...ip}
                />

                <Text style={styles.fieldLabel}>CATEGORY</Text>
                <View style={styles.catGrid}>
                  {categories.map(c => {
                    const active = selectedCat === c.label;
                    const color  = catColors[c.label] || Colors.accent;
                    return (
                      <AnimatedPressable
                        key={c.label}
                        style={[styles.catChip, active && { backgroundColor: color + 
  '20', borderColor: color }]}
                        scaleDown={0.94}
                        onPress={() => setSelectedCat(c.label)}
                      >
                        <Text style={styles.catChipEmoji}>{c.emoji}</Text>
                        <Text style={[styles.catChipText, active && { color,
  fontFamily: Fonts.bold }]}>
                          {c.label}
                        </Text>
                      </AnimatedPressable>
                    );
                  })}
                </View>
              </View>

              <AnimatedPressable
                style={[styles.sendBtn, (!title.trim() || !body.trim()) && { opacity:
   0.4 }]}
                onPress={handleSend}
                disabled={saving || !title.trim() || !body.trim()}
                scaleDown={0.97}
              >
                <Text style={styles.sendBtnText}>{saving ? 'SENDING...' : '📤  SEND TO ALL MEMBERS'}</Text>
              </AnimatedPressable>
            </Modal>
          </Portal>
        </View>
      </>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },

    // Hero
    hero: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',   
      margin: 16, backgroundColor: Colors.bgCard, borderRadius: 20,
      padding: 20, borderWidth: 1, borderColor: Colors.accent + '25', overflow:      
  'hidden',
    },
    heroGlow: {
      position: 'absolute', top: -30, left: -20,
      width: 110, height: 110, borderRadius: 55,
      backgroundColor: Colors.accentGlow,
    },
    heroLeft:      { flex: 1, gap: 4 },
    heroMicro:     { fontFamily: Fonts.bold, fontSize: 9, color: Colors.accent,      
  letterSpacing: 2 },
    heroTitle:     { fontFamily: Fonts.condensedBold, fontSize: 30, color:
  Colors.text, letterSpacing: 1 },
    heroSub:       { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted
   },
    heroStats:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
    heroStat:      { alignItems: 'center', gap: 3 },
    heroStatVal:   { fontFamily: Fonts.condensedBold, fontSize: 24, color:
  Colors.text },
    heroStatLabel: { fontFamily: Fonts.bold, fontSize: 8, color: Colors.textMuted,   
  letterSpacing: 1 },
    heroStatDivider: { width: 1, height: 30, backgroundColor: Colors.border },       

    // List
    list: { paddingHorizontal: 16, gap: 10, paddingBottom: 90 },
    card: {
      flexDirection: 'row',
      backgroundColor: Colors.bgCard, borderRadius: 16,
      borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
    },
    cardBar:  { width: 4 },
    cardBody: { flex: 1, padding: 14, gap: 10 },
    cardTop:  { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
    cardEmoji:{ fontSize: 26 },
    cardTitle:{ fontFamily: Fonts.bold, fontSize: 14, color: Colors.text },
    cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },  
    catBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    catBadgeText: { fontFamily: Fonts.bold, fontSize: 8, letterSpacing: 0.8 },       
    cardDate: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted },  
    cardText: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted,    
  lineHeight: 18 },

    // Read bar
    readRow:   { gap: 5 },
    readTrack: { height: 3, backgroundColor: Colors.bgElevated, borderRadius: 2,     
  overflow: 'hidden' },
    readFill:  { height: 3, borderRadius: 2 },
    readLabel: { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted }, 
    readPct:   { fontFamily: Fonts.bold, fontSize: 10 },

    fab: { position: 'absolute', right: 20, bottom: 20, backgroundColor:
  Colors.accent, borderRadius: 16 },

    // Modal
    modal: {
      backgroundColor: Colors.bgCard, margin: 20, borderRadius: 24,
      padding: 24, borderWidth: 1, borderColor: Colors.border,
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems:
   'center', marginBottom: 20 },
    modalTitle:  { fontFamily: Fonts.condensedBold, fontSize: 22, color: Colors.text,
   letterSpacing: 1 },
    modalClose:  { fontFamily: Fonts.bold, fontSize: 16, color: Colors.textMuted,    
  padding: 4 },
    modalForm:   { gap: 14 },
    input:       { backgroundColor: Colors.bgElevated },
    fieldLabel:  { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted,     
  letterSpacing: 1.5 },
    catGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    catChip: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
      backgroundColor: Colors.bgElevated, borderWidth: 1, borderColor: Colors.border,
    },
    catChipEmoji: { fontSize: 14 },
    catChipText:  { fontFamily: Fonts.medium, fontSize: 12, color: Colors.textMuted  
  },

    sendBtn: {
      backgroundColor: Colors.accent, borderRadius: 14,
      paddingVertical: 17, alignItems: 'center', marginTop: 20,
    },
    sendBtnText: { fontFamily: Fonts.bold, fontSize: 13, color: '#FFF',
  letterSpacing: 1 },
  });