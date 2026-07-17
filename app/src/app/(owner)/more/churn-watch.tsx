import { useState, useCallback } from 'react';                                                                                            
  import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Linking, Alert, Modal, TextInput } from 'react-native';
  import { Stack, useFocusEffect } from 'expo-router';
  import { Colors } from '@/constants/colors';
  import { Fonts } from '@/constants/fonts';
  import { supabase } from '@/lib/supabase';
  import { useAuthStore } from '@/store/authStore';
  import FadeInView from '@/components/FadeInView';
import LottieView from '@/components/AppLottie';
import { askAI } from '@/lib/ai';

import { toLocalDate } from '@/lib/date';
  type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW';

  interface AtRiskMember {
    id:           string;
    name:         string;
    phone:        string;
    riskLevel:    RiskLevel;
    reasons:      string[];
    lastVisit:    string | null;
    daysSinceVisit: number;
    planExpiry:   string | null;
    daysToExpiry: number | null;
    recentVisits: number;
    prevVisits:   number;
  }

  const RISK_COLOR: Record<RiskLevel, string> = {
    HIGH:   Colors.red,
    MEDIUM: Colors.orange,
    LOW:    '#F59E0B',
  };

  export default function ChurnWatchScreen() {
    const { profile, activeGymId, branches } = useAuthStore();
    const [atRisk,  setAtRisk]  = useState<AtRiskMember[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
      if (!profile?.gym_id) return;
      setLoading(true);

      const mainGymId = profile.gym_id;
      const gymIds = activeGymId === 'all'
        ? branches.map(b => b.id)
        : [activeGymId ?? mainGymId];

      const now      = new Date();
      const today    = toLocalDate(now);

      // Date ranges
      const day30Ago = toLocalDate(new Date(Date.now() - 30 * 86400000));
      const day14Ago = toLocalDate(new Date(Date.now() - 14 * 86400000));
      const day7Ago  = toLocalDate(new Date(Date.now() -  7 * 86400000));
      const day7Fwd  = toLocalDate(new Date(Date.now() +  7 * 86400000));

      // Fetch active members
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, full_name, phone')
        .in('gym_id', gymIds)
        .eq('role', 'member');

      if (!profileData || profileData.length === 0) { setLoading(false); return; }

      const memberIds = profileData.map(p => p.id);

      // Attendance last 30 days
      const { data: attData } = await supabase
        .from('attendance')
        .select('member_id, check_in_date')
        .in('member_id', memberIds)
        .gte('check_in_date', day30Ago)
        .order('check_in_date', { ascending: false });

      // Active plans with expiry
      const { data: planData } = await supabase
        .from('member_plans')
        .select('member_id, end_date, status')
        .in('member_id', memberIds)
        .eq('status', 'active');

      // Build maps
      const lastVisitMap:   Record<string, string>   = {};
      const recentMap:      Record<string, number>   = {}; // last 14 days
      const prevMap:        Record<string, number>   = {}; // 15–30 days ago
      const expiryMap:      Record<string, string>   = {};

      (attData ?? []).forEach(a => {
        if (!lastVisitMap[a.member_id]) lastVisitMap[a.member_id] = a.check_in_date;
        if (a.check_in_date >= day14Ago) {
          recentMap[a.member_id] = (recentMap[a.member_id] || 0) + 1;
        } else {
          prevMap[a.member_id] = (prevMap[a.member_id] || 0) + 1;
        }
      });

      (planData ?? []).forEach(p => {
        expiryMap[p.member_id] = p.end_date;
      });

      // Score each member
      const result: AtRiskMember[] = [];

      profileData.forEach(p => {
        const lastVisit    = lastVisitMap[p.id] ?? null;
        const recentVisits = recentMap[p.id] ?? 0;
        const prevVisits   = prevMap[p.id]   ?? 0;
        const planExpiry   = expiryMap[p.id] ?? null;

        const daysSinceVisit = lastVisit
          ? Math.floor((Date.now() - new Date(lastVisit).getTime()) / 86400000)
          : 999;

        const daysToExpiry = planExpiry
          ? Math.ceil((new Date(planExpiry).getTime() - Date.now()) / 86400000)
          : null;

        const reasons: string[] = [];
        let riskScore = 0;

        // No visits in 14+ days
        if (daysSinceVisit >= 14) { reasons.push(`No visit in ${daysSinceVisit} days`); riskScore += 3; }
        else if (daysSinceVisit >= 7) { reasons.push(`No visit in ${daysSinceVisit} days`); riskScore += 1; }

        // Attendance dropped >50%
        if (prevVisits > 0 && recentVisits < prevVisits * 0.5) {
          const drop = Math.round(((prevVisits - recentVisits) / prevVisits) * 100);
          reasons.push(`Attendance dropped ${drop}% this fortnight`);
          riskScore += 2;
        }

        // Plan expiring soon
        if (daysToExpiry !== null && daysToExpiry <= 7 && daysToExpiry >= 0) {
          reasons.push(`Plan expires in ${daysToExpiry} day${daysToExpiry !== 1 ? 's' : ''}`);
          riskScore += 2;
        }

        // Plan already expired
        if (daysToExpiry !== null && daysToExpiry < 0) {
          reasons.push(`Plan expired ${Math.abs(daysToExpiry)} days ago`);
          riskScore += 4;
        }

        // No plan at all
        if (!planExpiry) {
          reasons.push('No active membership plan');
          riskScore += 2;
        }

        if (reasons.length === 0) return; // not at risk

        let riskLevel: RiskLevel = 'LOW';
        if (riskScore >= 5) riskLevel = 'HIGH';
        else if (riskScore >= 3) riskLevel = 'MEDIUM';

        result.push({
          id: p.id,
          name:        p.full_name ?? 'Unknown',
          phone:       p.phone ?? '',
          riskLevel,
          reasons,
          lastVisit,
          daysSinceVisit,
          planExpiry,
          daysToExpiry,
          recentVisits,
          prevVisits,
        });
      });

      // Sort by risk: HIGH first
      result.sort((a, b) => {
        const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
        return order[a.riskLevel] - order[b.riskLevel];
      });

      setAtRisk(result);
      setLoading(false);
    }, [profile?.gym_id, activeGymId, branches]);

    useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

    const highCount   = atRisk.filter(m => m.riskLevel === 'HIGH').length;
    const medCount    = atRisk.filter(m => m.riskLevel === 'MEDIUM').length;
    const lowCount    = atRisk.filter(m => m.riskLevel === 'LOW').length;

    const handleCall = (phone: string, name: string) => {
      if (!phone) { Alert.alert('No phone', `${name} has no phone number saved.`); return; }
      Linking.openURL(`tel:${phone}`);
    };

    const handleWhatsApp = (phone: string, name: string) => {
      if (!phone) { Alert.alert('No phone', `${name} has no phone number saved.`); return; }
      const msg = encodeURIComponent(`Hi ${name}! We miss you at the gym. Come back and crush your goals 💪`);
      Linking.openURL(`https://wa.me/91${phone.replace(/\D/g, '')}?text=${msg}`);
    };

    // ── AI retention assistant (win-back message + renewal call script) ──────
    const [aiFor,     setAiFor]     = useState<AtRiskMember | null>(null);
    const [aiMode,    setAiMode]    = useState<'menu' | 'winback' | 'script'>('menu');
    const [aiLoading, setAiLoading] = useState(false);
    const [aiText,    setAiText]    = useState('');
    const [aiError,   setAiError]   = useState('');

    const openAI  = (m: AtRiskMember) => { setAiFor(m); setAiMode('menu'); setAiText(''); setAiError(''); };
    const closeAI = () => { setAiFor(null); setAiText(''); setAiError(''); };

    const genWinback = async () => {
      if (!aiFor) return;
      setAiMode('winback'); setAiLoading(true); setAiError('');
      try {
        setAiText(await askAI('winback', {
          memberName: aiFor.name, daysSinceVisit: aiFor.daysSinceVisit, plan: 'gym membership',
        }));
      } catch (e: any) { setAiError(e?.message || 'Could not generate.'); }
      finally { setAiLoading(false); }
    };

    const genScript = async () => {
      if (!aiFor) return;
      setAiMode('script'); setAiLoading(true); setAiError('');
      try {
        setAiText(await askAI('renewal_script', {
          memberName: aiFor.name, plan: 'gym membership',
          daysLeft: aiFor.daysToExpiry != null ? aiFor.daysToExpiry : 'soon',
        }));
      } catch (e: any) { setAiError(e?.message || 'Could not generate.'); }
      finally { setAiLoading(false); }
    };

    const sendAiWhatsApp = () => {
      if (!aiFor?.phone) { Alert.alert('No phone', `${aiFor?.name} has no phone saved.`); return; }
      Linking.openURL(`https://wa.me/91${aiFor.phone.replace(/\D/g, '')}?text=${encodeURIComponent(aiText)}`);
      closeAI();
    };

   if (loading) return (
    <>
      <Stack.Screen options={{ title: 'Churn Watch' }} />
      <View style={{ flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center' }}>
        <LottieView
          source={require('@/assets/animations/Turkey Power Walk.json')}
          autoPlay loop
          style={{ width: 200, height: 200 }}
        />
        <Text style={{ fontFamily: Fonts.condensedBold, fontSize: 20, color: '#fff', letterSpacing: 4, marginTop: 8 }}>
          LOADING
        </Text>
      </View>
    </>
  );

    return (
      <>
        <Stack.Screen options={{ title: 'Churn Watch' }} />
        <ScrollView style={styles.container} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Summary */}
          <FadeInView delay={0}>
            <View style={styles.statRow}>
              <View style={[styles.statBox, { borderColor: Colors.red + '40' }]}>
                <Text style={styles.statEmoji}>🔴</Text>
                <Text style={[styles.statVal, { color: Colors.red }]}>{highCount}</Text>
                <Text style={styles.statLbl}>HIGH RISK</Text>
              </View>
              <View style={[styles.statBox, { borderColor: Colors.orange + '40' }]}>
                <Text style={styles.statEmoji}>🟠</Text>
                <Text style={[styles.statVal, { color: Colors.orange }]}>{medCount}</Text>
                <Text style={styles.statLbl}>MEDIUM</Text>
              </View>
              <View style={[styles.statBox, { borderColor: '#F59E0B40' }]}>
                <Text style={styles.statEmoji}>🟡</Text>
                <Text style={[styles.statVal, { color: '#F59E0B' }]}>{lowCount}</Text>
                <Text style={styles.statLbl}>LOW RISK</Text>
              </View>
            </View>
          </FadeInView>

          {atRisk.length === 0 ? (
            <FadeInView delay={60}>
              <View style={styles.allGoodCard}>
                <Text style={styles.allGoodEmoji}>🎉</Text>
                <Text style={styles.allGoodTitle}>ALL MEMBERS LOOK GOOD</Text>
                <Text style={styles.allGoodSub}>No churn signals detected. Keep up the great work!</Text>
              </View>
            </FadeInView>
          ) : (
            <>
              <FadeInView delay={60}>
                <Text style={styles.sectionLabel}>⚠️ {atRisk.length} MEMBERS NEED ATTENTION</Text>
              </FadeInView>

              {atRisk.map((m, i) => (
                <FadeInView key={m.id} delay={100 + i * 40}>
                  <View style={[styles.memberCard, { borderColor: RISK_COLOR[m.riskLevel] + '40' }]}>
                    {/* Header */}
                    <View style={styles.cardHeader}>
                      <View style={[styles.avatar, { backgroundColor: RISK_COLOR[m.riskLevel] + '20' }]}>
                        <Text style={[styles.avatarText, { color: RISK_COLOR[m.riskLevel] }]}>
                          {m.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.cardHeaderInfo}>
                        <Text style={styles.memberName}>{m.name}</Text>
                        <Text style={styles.memberMeta}>
                          Last visit: {m.lastVisit
                            ? new Date(m.lastVisit).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                            : 'Never'}
                        </Text>
                      </View>
                      <View style={[styles.riskBadge, { backgroundColor: RISK_COLOR[m.riskLevel] + '20' }]}>
                        <Text style={[styles.riskText, { color: RISK_COLOR[m.riskLevel] }]}>{m.riskLevel}</Text>
                      </View>
                    </View>

                    {/* Reasons */}
                    <View style={styles.reasonsWrap}>
                      {m.reasons.map((r, ri) => (
                        <View key={ri} style={styles.reasonRow}>
                          <Text style={styles.reasonDot}>•</Text>
                          <Text style={styles.reasonText}>{r}</Text>
                        </View>
                      ))}
                    </View>

                    {/* Actions */}
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => handleCall(m.phone, m.name)}
                      >
                        <Text style={styles.actionBtnText}>📞 Call</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.actionBtnWa]}
                        onPress={() => handleWhatsApp(m.phone, m.name)}
                      >
                        <Text style={[styles.actionBtnText, { color: '#25D366' }]}>💬 WhatsApp</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.actionBtnAi]}
                        onPress={() => openAI(m)}
                      >
                        <Text style={[styles.actionBtnText, { color: Colors.accent }]}>🤖 AI</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </FadeInView>
              ))}
            </>
          )}

          <View style={{ height: 32 }} />
        </ScrollView>

        {/* ── AI retention assistant modal ────────────────────────── */}
        <Modal visible={!!aiFor} transparent animationType="fade" onRequestClose={closeAI}>
          <View style={styles.aiOverlay}>
            <View style={styles.aiCard}>
              <View style={styles.aiHeader}>
                <View>
                  <Text style={styles.aiEyebrow}>AI RETENTION · {aiFor?.name}</Text>
                  <Text style={styles.aiTitle}>
                    {aiMode === 'winback' ? 'Win-back message' : aiMode === 'script' ? 'Renewal call script' : 'AI se madad lein'}
                  </Text>
                </View>
                <TouchableOpacity onPress={closeAI}><Text style={styles.aiClose}>✕</Text></TouchableOpacity>
              </View>

              {aiMode === 'menu' && !aiLoading && (
                <View style={{ gap: 10 }}>
                  <TouchableOpacity style={styles.aiOption} onPress={genWinback}>
                    <Text style={styles.aiOptionEmoji}>💬</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.aiOptionTitle}>Win-back WhatsApp message</Text>
                      <Text style={styles.aiOptionSub}>Personal message draft — edit &amp; send</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.aiOption} onPress={genScript}>
                    <Text style={styles.aiOptionEmoji}>📞</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.aiOptionTitle}>Renewal call script</Text>
                      <Text style={styles.aiOptionSub}>Talking points before you call</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              )}

              {aiLoading && (
                <View style={{ paddingVertical: 30, alignItems: 'center', gap: 12 }}>
                  <ActivityIndicator color={Colors.accent} />
                  <Text style={styles.aiMuted}>AI likh raha hai…</Text>
                </View>
              )}

              {!aiLoading && aiError !== '' && (
                <View style={{ paddingVertical: 20, gap: 12 }}>
                  <Text style={[styles.aiMuted, { color: Colors.red, textAlign: 'center' }]}>{aiError}</Text>
                  <TouchableOpacity style={styles.aiPrimary} onPress={aiMode === 'script' ? genScript : genWinback}>
                    <Text style={styles.aiPrimaryText}>Try again</Text>
                  </TouchableOpacity>
                </View>
              )}

              {!aiLoading && aiError === '' && aiMode === 'winback' && aiText !== '' && (
                <View style={{ gap: 12 }}>
                  <TextInput
                    style={styles.aiTextArea}
                    value={aiText}
                    onChangeText={setAiText}
                    multiline
                    placeholderTextColor={Colors.textMuted}
                  />
                  <Text style={styles.aiMuted}>Edit karke bhej sakte ho.</Text>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity style={[styles.aiGhost, { flex: 0 }]} onPress={genWinback}>
                      <Text style={styles.aiGhostText}>↻</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.aiPrimary, { flex: 1 }]} onPress={sendAiWhatsApp}>
                      <Text style={styles.aiPrimaryText}>💬 Send on WhatsApp</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {!aiLoading && aiError === '' && aiMode === 'script' && aiText !== '' && (
                <View style={{ gap: 12 }}>
                  <ScrollView style={{ maxHeight: 260 }}>
                    <Text style={styles.aiScript}>{aiText}</Text>
                  </ScrollView>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity style={[styles.aiGhost, { flex: 0 }]} onPress={genScript}>
                      <Text style={styles.aiGhostText}>↻</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.aiPrimary, { flex: 1 }]} onPress={() => handleCall(aiFor!.phone, aiFor!.name)}>
                      <Text style={styles.aiPrimaryText}>📞 Call {aiFor?.name}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>
        </Modal>
      </>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    scroll:    { paddingHorizontal: 16, paddingTop: 16 },
    center:    { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg },

    statRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
    statBox: {
      flex: 1, backgroundColor: Colors.bgCard, borderRadius: 16,
      borderWidth: 1, padding: 14, alignItems: 'center', gap: 4,
    },
    statEmoji: { fontSize: 22 },
    statVal:   { fontFamily: Fonts.condensedBold, fontSize: 22 },
    statLbl:   { fontFamily: Fonts.bold, fontSize: 8, color: Colors.textMuted, letterSpacing: 1 },

    sectionLabel: {
      fontFamily: Fonts.bold, fontSize: 10, color: Colors.textMuted,
      letterSpacing: 1.5, marginBottom: 10,
    },

    memberCard: {
      backgroundColor: Colors.bgCard, borderRadius: 16, borderWidth: 1,
      padding: 16, marginBottom: 12, gap: 12,
    },
    cardHeader:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
    avatar:         { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    avatarText:     { fontFamily: Fonts.bold, fontSize: 18 },
    cardHeaderInfo: { flex: 1 },
    memberName:     { fontFamily: Fonts.bold, fontSize: 15, color: Colors.text },
    memberMeta:     { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 1 },
    riskBadge:      { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
    riskText:       { fontFamily: Fonts.bold, fontSize: 10, letterSpacing: 1 },

    reasonsWrap: { gap: 4, paddingLeft: 4 },
    reasonRow:   { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
    reasonDot:   { fontFamily: Fonts.bold, fontSize: 12, color: Colors.textMuted, marginTop: 1 },
    reasonText:  { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, flex: 1, lineHeight: 18 },

    actionRow:      { flexDirection: 'row', gap: 8 },
    actionBtn:      { flex: 1, paddingVertical: 9, borderRadius: 10, backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border,
   alignItems: 'center' },
    actionBtnWa:    { borderColor: '#25D36640' },
    actionBtnAi:    { borderColor: Colors.accent + '55', flex: 0.6 },
    actionBtnText:  { fontFamily: Fonts.bold, fontSize: 12, color: Colors.text },

    // AI retention modal
    aiOverlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'flex-end' },
    aiCard:         { backgroundColor: Colors.bgCard, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, paddingBottom: 34, borderWidth: 1, borderColor: Colors.border, gap: 14 },
    aiHeader:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    aiEyebrow:      { fontFamily: Fonts.bold, fontSize: 9, color: Colors.accent, letterSpacing: 1.4 },
    aiTitle:        { fontFamily: Fonts.condensedBold, fontSize: 22, color: Colors.text, marginTop: 3 },
    aiClose:        { fontFamily: Fonts.bold, fontSize: 18, color: Colors.textMuted, paddingHorizontal: 6 },
    aiOption:       { flexDirection: 'row', alignItems: 'center', gap: 13, backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, padding: 15 },
    aiOptionEmoji:  { fontSize: 22 },
    aiOptionTitle:  { fontFamily: Fonts.bold, fontSize: 14, color: Colors.text },
    aiOptionSub:    { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, marginTop: 2 },
    aiMuted:        { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted },
    aiTextArea:     { backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, padding: 14, minHeight: 120, fontFamily: Fonts.regular, fontSize: 15, color: Colors.text, textAlignVertical: 'top' },
    aiScript:       { fontFamily: Fonts.regular, fontSize: 15, color: Colors.text, lineHeight: 24 },
    aiPrimary:      { backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
    aiPrimaryText:  { fontFamily: Fonts.bold, fontSize: 14, color: '#fff' },
    aiGhost:        { borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
    aiGhostText:    { fontFamily: Fonts.bold, fontSize: 16, color: Colors.textMuted },

    allGoodCard: {
      backgroundColor: Colors.bgCard, borderRadius: 18, borderWidth: 1,
      borderColor: Colors.green + '40', padding: 32, alignItems: 'center', gap: 10,
    },
    allGoodEmoji: { fontSize: 48 },
    allGoodTitle: { fontFamily: Fonts.bold, fontSize: 12, color: Colors.green, letterSpacing: 1.5 },
    allGoodSub:   { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
  });
