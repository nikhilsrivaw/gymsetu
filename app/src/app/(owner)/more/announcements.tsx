import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Pressable } from 'react-native';
import { FAB, Portal, Modal, TextInput } from 'react-native-paper';
import { Stack, useFocusEffect } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import AnimatedPressable from '@/components/AnimatedPressable';
import FadeInView from '@/components/FadeInView';
import { askAI } from '@/lib/ai';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

interface Announcement {
  id: string;
  title: string;
  body: string;
  category: string;
  emoji: string;
  created_at: string;
}

const catColors: Record<string, string> = {
  Holiday: Colors.orange, Class: '#EC4899',
  Maintenance: Colors.textMuted, Event: Colors.accent,
  Offer: Colors.red, General: Colors.green,
};

const categories = [
  { label: 'General', emoji: '📢' },
  { label: 'Holiday', emoji: '🎉' },
  { label: 'Class', emoji: '💃' },
  { label: 'Maintenance', emoji: '🔧' },
  { label: 'Event', emoji: '🏆' },
  { label: 'Offer', emoji: '🔥' },
];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function AnnouncementsScreen() {
  const { profile } = useAuthStore();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [gymName, setGymName] = useState('Your Gym');
  const [show, setShow] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [selectedCat, setSelectedCat] = useState('General');
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
  const [promoLoading, setPromoLoading] = useState(false);

  const ip = {
    mode: 'outlined' as const, style: styles.input,
    outlineColor: Colors.border, activeOutlineColor: Colors.accent,
    textColor: Colors.text, theme: { colors: { onSurfaceVariant: Colors.textMuted } },
  };

  const fetchAnnouncements = useCallback(async (active = true) => {
    if (!profile?.gym_id) return;
    setLoading(true);

    const { data: gym } = await supabase.from('gyms').select('name').eq('id', profile.gym_id).single();
    if (gym && active) setGymName(gym.name ?? 'Your Gym');

    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('gym_id', profile.gym_id)
      .order('created_at', { ascending: false });

    if (active && !error && data) setAnnouncements(data);
    if (active) setLoading(false);
  }, [profile?.gym_id]);

  useFocusEffect(useCallback(() => {
    let active = true;
    fetchAnnouncements(active);
    return () => { active = false; };
  }, [fetchAnnouncements]));

  const resetForm = () => { setTitle(''); setBody(''); setSelectedCat('General'); };

  const handleSend = async () => {
    if (!title.trim() || !body.trim() || !profile?.gym_id) return;
    setSaving(true);
    const emoji = categories.find(c => c.label === selectedCat)?.emoji ?? '📢';
    const { error } = await supabase.from('announcements').insert({
      gym_id: profile.gym_id,
      title: title.trim(),
      body: body.trim(),
      category: selectedCat,
      emoji,
    });
    setSaving(false);
    if (error) { Alert.alert('Error', error.message); return; }
    setShow(false);
    resetForm();
    fetchAnnouncements();
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete', 'Remove this announcement?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await supabase.from('announcements').delete().eq('id', id);
          fetchAnnouncements();
        },
      },
    ]);
  };

  const handleAIWrite = async () => {
    if (!title.trim()) {
      Alert.alert('Add a title first', 'Enter a title so AI knows what to write about'); return;
    }
    setAiLoading(true);
    try {
      const text = await askAI('announcement', { topic: title, gymName });
      setBody(text);
    } catch (e: any) { Alert.alert('Error', e.message); }
    setAiLoading(false);
  };

  const handleAISocialPost = async () => {
    if (!title.trim()) {
      Alert.alert('Add a title first', 'Enter a title so AI can generate a social post');
      return;
    }
    setSocialLoading(true);
    try {
      const text = await askAI('social_post', { topic: title, category: selectedCat, gymName });
      setBody(text);
    } catch (e: any) { Alert.alert('Error', e.message); }
    setSocialLoading(false);
  };

  const handleAIPromo = async () => {
    if (!title.trim()) { Alert.alert('Add a title first', 'Enter a title for the promo campaign'); return; }
    setPromoLoading(true);
    try {
      const text = await askAI('promo_campaign', { occasion: title, gymName });
      setBody(text);
    } catch (e: any) { Alert.alert('Error', e.message); }
    setPromoLoading(false);
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Announcements' }} />
      <View style={styles.container}>

        <FadeInView delay={0}>
          <View style={styles.hero}>
            <View style={styles.heroGlow} />
            <View style={styles.heroLeft}>
              <Text style={styles.heroMicro}>ANNOUNCEMENTS</Text>
              <Text style={styles.heroTitle}>BROADCAST</Text>
              <Text style={styles.heroSub}>Notices sent to all members</Text>
            </View>
            <View style={styles.heroStats}>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatVal}>{announcements.length}</Text>
                <Text style={styles.heroStatLabel}>TOTAL</Text>
              </View>
            </View>
          </View>
        </FadeInView>

        {loading ? (
          <ActivityIndicator color={Colors.accent} size="large" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={announcements}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>📢</Text>
                <Text style={styles.emptyTitle}>No announcements yet</Text>
                <Text style={styles.emptyDesc}>Tap + to send your first notice to members</Text>
              </View>
            }
            renderItem={({ item, index }) => {
              const color = catColors[item.category] || Colors.green;
              return (
                <FadeInView delay={80 + index * 60}>
                  <Pressable
                    style={styles.card}
                    onLongPress={() => handleDelete(item.id)}
                  >
                    <View style={[styles.cardBar, { backgroundColor: color }]} />
                    <View style={styles.cardBody}>
                      <View style={styles.cardTop}>
                        <Text style={styles.cardEmoji}>{item.emoji}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                          <View style={styles.cardMeta}>
                            <View style={[styles.catBadge, { backgroundColor: color + '18' }]}>
                              <Text style={[styles.catBadgeText, { color }]}>{(item.category ??
                                'General').toUpperCase()}</Text>
                            </View>
                            <Text style={styles.cardDate}>{timeAgo(item.created_at)}</Text>
                          </View>
                        </View>
                      </View>
                      <Text style={styles.cardText} numberOfLines={2}>{item.body}</Text>
                    </View>
                  </Pressable> 
                </FadeInView>
              );
            }}
          />
        )}

        <FAB icon="plus" style={styles.fab} onPress={() => setShow(true)} color="#FFF" customSize={56} />

        <Portal>
          <Modal visible={show} onDismiss={() => { setShow(false); resetForm(); }}
            contentContainerStyle={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>NEW ANNOUNCEMENT</Text>
              <TouchableOpacity onPress={() => { setShow(false); resetForm(); }}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalForm}>
              <TextInput label="Title" value={title} onChangeText={setTitle} {...ip} />

              <View>
                <TextInput label="Message" value={body} onChangeText={setBody} multiline numberOfLines={4} {...ip}
                />
                <View style={styles.aiBtnRow}>
                  <TouchableOpacity style={styles.aiBtn} onPress={handleAIWrite} disabled={aiLoading}>
                    {aiLoading ? <ActivityIndicator size="small" color={Colors.accent} /> : <Text
                      style={styles.aiBtnText}>✨ AI Write</Text>}
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.aiBtn, {
                    borderColor: '#EC4899' + '40', backgroundColor:
                      '#EC4899' + '15'
                  }]} onPress={handleAISocialPost} disabled={socialLoading}>
                    {socialLoading ? <ActivityIndicator size="small" color="#EC4899" /> : <Text
                      style={[styles.aiBtnText, { color: '#EC4899' }]}>📱 Social</Text>}
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.aiBtn, {
                    borderColor: Colors.orange + '40', backgroundColor:
                      Colors.orange + '15'
                  }]} onPress={handleAIPromo} disabled={promoLoading}>
                    {promoLoading ? <ActivityIndicator size="small" color={Colors.orange} /> : <Text
                      style={[styles.aiBtnText, { color: Colors.orange }]}>🎯 Promo</Text>}
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.fieldLabel}>CATEGORY</Text>
              <View style={styles.catGrid}>
                {categories.map(c => {
                  const active = selectedCat === c.label;
                  const color = catColors[c.label] || Colors.accent;
                  return (
                    <AnimatedPressable
                      key={c.label}
                      style={[styles.catChip, active && { backgroundColor: color + '20', borderColor: color }]}
                      scaleDown={0.94}
                      onPress={() => setSelectedCat(c.label)}
                    >
                      <Text style={styles.catChipEmoji}>{c.emoji}</Text>
                      <Text style={[styles.catChipText, active && {
                        color, fontFamily: Fonts.bold
                      }]}>{c.label}</Text>
                    </AnimatedPressable>
                  );
                })}
              </View>
            </View>

            <AnimatedPressable
              style={[styles.sendBtn, (!title.trim() || !body.trim()) && { opacity: 0.4 }]}
              onPress={handleSend}
              disabled={saving || !title.trim() || !body.trim()}
              scaleDown={0.97}
            >
              {saving
                ? <ActivityIndicator color="#FFF" size="small" />
                : <Text style={styles.sendBtnText}>📤  SEND TO ALL MEMBERS</Text>
              }
            </AnimatedPressable>
          </Modal>
        </Portal>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  hero: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', margin: 16,
    backgroundColor: Colors.bgCard, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: Colors.accent + '25',
    overflow: 'hidden'
  },
  heroGlow: {
    position: 'absolute', top: -30, left: -20, width: 110, height: 110, borderRadius: 55,
    backgroundColor: Colors.accentGlow
  },
  heroLeft: { flex: 1, gap: 4 },
  heroMicro: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.accent, letterSpacing: 2 },
  heroTitle: { fontFamily: Fonts.condensedBold, fontSize: 30, color: Colors.text, letterSpacing: 1 },
  heroSub: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted },
  heroStats: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroStat: { alignItems: 'center', gap: 3 },
  heroStatVal: { fontFamily: Fonts.condensedBold, fontSize: 24, color: Colors.text },
  heroStatLabel: { fontFamily: Fonts.bold, fontSize: 8, color: Colors.textMuted, letterSpacing: 1 },
  heroStatDivider: { width: 1, height: 30, backgroundColor: Colors.border },

  list: { paddingHorizontal: 16, gap: 10, paddingBottom: 90 },
  card: {
    flexDirection: 'row', backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor:
      Colors.border, overflow: 'hidden'
  },
  cardBar: { width: 4 },
  cardBody: { flex: 1, padding: 14, gap: 10 },
  cardTop: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  cardEmoji: { fontSize: 26 },
  cardTitle: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.text },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  catBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  catBadgeText: { fontFamily: Fonts.bold, fontSize: 8, letterSpacing: 0.8 },
  cardDate: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted },
  cardText: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, lineHeight: 18 },

  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontFamily: Fonts.bold, fontSize: 16, color: Colors.text },
  emptyDesc: {
    fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, marginTop: 4, textAlign: 'center'
  },

  fab: { position: 'absolute', right: 20, bottom: 20, backgroundColor: Colors.accent, borderRadius: 16 },

  modal: {
    backgroundColor: Colors.bgCard, margin: 20, borderRadius: 24, padding: 24, borderWidth: 1,
    borderColor: Colors.border
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontFamily: Fonts.condensedBold, fontSize: 22, color: Colors.text, letterSpacing: 1 },
  modalClose: { fontFamily: Fonts.bold, fontSize: 16, color: Colors.textMuted, padding: 4 },
  modalForm: { gap: 14 },
  input: { backgroundColor: Colors.bgElevated },
  fieldLabel: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted, letterSpacing: 1.5 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 10, backgroundColor: Colors.bgElevated, borderWidth: 1, borderColor: Colors.border
  },
  catChipEmoji: { fontSize: 14 },
  catChipText: { fontFamily: Fonts.medium, fontSize: 12, color: Colors.textMuted },

  sendBtn: {
    backgroundColor: Colors.accent, borderRadius: 14, paddingVertical: 16, alignItems: 'center',
    marginTop: 20
  },
  sendBtnText: { fontFamily: Fonts.bold, fontSize: 13, color: '#FFF', letterSpacing: 1 },

  aiBtnRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 6 },
  aiBtn: {
    paddingHorizontal: 12, paddingVertical: 7, backgroundColor: Colors.accentMuted, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.accent + '40'
  },
  aiBtnText: { fontFamily: Fonts.bold, fontSize: 11, color: Colors.accent, letterSpacing: 0.5 },
});