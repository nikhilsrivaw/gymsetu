import { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  Animated, Modal,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import LottieView from '@/components/AppLottie';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import AnimatedPressable from '@/components/AnimatedPressable';
import FadeInView from '@/components/FadeInView';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import { askAI } from '@/lib/ai';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

// ── Action definitions ────────────────────────────────────────
interface Action {
  key:     'workout_plan' | 'diet_plan' | 'progress_analysis';
  label:   string;
  desc:    string;
  icon:    IconName;
  color:   string;
  prompt:  string;
}

const ACTIONS: Action[] = [
  {
    key:    'workout_plan',
    label:  'Build My Workout Plan',
    desc:   'Personalised training program based on your goals',
    icon:   'dumbbell',
    color:  Colors.accent,
    prompt: 'Generate a personalised weekly workout plan',
  },
  {
    key:    'diet_plan',
    label:  'Create My Diet Plan',
    desc:   'Nutrition plan tailored to your body & targets',
    icon:   'food-apple-outline',
    color:  Colors.green,
    prompt: 'Create a balanced daily diet & meal plan',
  },
  {
    key:    'progress_analysis',
    label:  'Analyse My Progress',
    desc:   'AI insight on your fitness journey so far',
    icon:   'chart-line',
    color:  '#A78BFA',
    prompt: 'Analyse my current fitness progress and suggest improvements',
  },
];

// ── Helper: split markdown-ish text into paragraphs ──────────
function renderResponse(text: string) {
  // Split on double-newline or "## " headings
  const lines = text.split(/\n+/);
  return lines.map((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return null;

    if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
      const heading = trimmed.replace(/^#+\s*/, '');
      return (
        <Text key={i} style={styles.respHeading}>{heading}</Text>
      );
    }
    if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      const bullet = trimmed.replace(/^[-•]\s*/, '');
      return (
        <View key={i} style={styles.bulletRow}>
          <View style={styles.bulletDot} />
          <Text style={styles.bulletText}>{bullet}</Text>
        </View>
      );
    }
    if (trimmed.match(/^\d+\.\s/)) {
      return (
        <View key={i} style={styles.bulletRow}>
          <Text style={styles.bulletNum}>{trimmed.match(/^\d+/)?.[0]}.</Text>
          <Text style={styles.bulletText}>{trimmed.replace(/^\d+\.\s*/, '')}</Text>
        </View>
      );
    }
    if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
      return (
        <Text key={i} style={styles.respBold}>{trimmed.replace(/\*\*/g, '')}</Text>
      );
    }
    return <Text key={i} style={styles.respPara}>{trimmed}</Text>;
  }).filter(Boolean);
}

export default function AICoachScreen() {
  const router    = useRouter();
  const insets    = useSafeAreaInsets();
  const { profile } = useAuthStore();

  // member context state
  const [memberData, setMemberData] = useState<Record<string, any>>({});

  // AI state
  const [activeKey,   setActiveKey]   = useState<Action['key'] | null>(null);
  const [aiText,      setAiText]      = useState('');
  const [loading,     setLoading]     = useState(false);
  const [aiError,     setAiError]     = useState('');
  const [showResult,  setShowResult]  = useState(false);

  // ── Fetch member context once on focus ───────────────────────
  useFocusEffect(useCallback(() => {
    if (!profile) return;
    let active = true;

    async function load() {
      try {
        // Bridge: profiles.id → members.user_id → members.id
        const { data: memberRow } = await supabase
          .from('members')
          .select('id')
          .eq('user_id', profile!.id)
          .maybeSingle();

        const membersTableId = memberRow?.id ?? null;

        // Fetch active plan
        let planName = 'No active plan';
        let daysLeft = 0;
        if (membersTableId) {
          const { data: planRow } = await supabase
            .from('member_plans')
            .select('end_date, membership_plans(name, duration_days)')
            .eq('member_id', membersTableId)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          if (planRow) {
            planName = (planRow as any).membership_plans?.name ?? 'Active Plan';
            const end = new Date((planRow as any).end_date);
            daysLeft  = Math.max(0, Math.ceil((end.getTime() - Date.now()) / 86_400_000));
          }
        }

        // Total visits
        const { count: totalVisits } = await supabase
          .from('attendance')
          .select('id', { count: 'exact', head: true })
          .eq('member_id', profile!.id);

        if (active) {
          setMemberData({
            name:          profile!.full_name ?? 'Member',
            height_cm:     (profile as any).height_cm ?? null,
            target_weight: (profile as any).target_weight ?? null,
            plan_name:     planName,
            days_left:     daysLeft,
            total_visits:  totalVisits ?? 0,
          });
        }
      } catch {
        // non-critical — AI still works with partial data
      }
    }

    load();
    return () => { active = false; };
  }, [profile?.id]));

  // ── Trigger AI ───────────────────────────────────────────────
  async function handleAction(action: Action) {
    setActiveKey(action.key);
    setAiText('');
    setAiError('');
    setLoading(true);
    setShowResult(true);

    try {
      const payload = {
        ...memberData,
        request: action.prompt,
      };
      const result = await askAI(action.key, payload);
      setAiText(result);
    } catch (e: any) {
      setAiError(e.message ?? 'AI response failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const currentAction = ACTIONS.find(a => a.key === activeKey);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <View style={styles.header}>
        <AnimatedPressable style={styles.backBtn} scaleDown={0.9} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={Colors.text} />
        </AnimatedPressable>
        <View>
          <Text style={styles.headerTitle}>AI FITNESS COACH</Text>
          <Text style={styles.headerSub}>Powered by GymSetu AI</Text>
        </View>
        <View style={styles.liveChip}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero banner ───────────────────────────────────────── */}
        <FadeInView delay={0}>
          <View style={styles.heroBanner}>
            <LinearGradient
              colors={[Colors.accent + '18', 'transparent']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            <LottieView
              source={require('@/assets/animations/aichatbot.json')}
              autoPlay loop
              style={styles.heroLottie}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.heroGreet}>
                Hey {profile?.full_name?.split(' ')[0] ?? 'Athlete'} 👋
              </Text>
              <Text style={styles.heroTitle}>What can I help{'\n'}you with today?</Text>
              {memberData.plan_name && memberData.plan_name !== 'No active plan' && (
                <View style={styles.heroPlanChip}>
                  <MaterialCommunityIcons name="check-circle" size={11} color={Colors.green} />
                  <Text style={styles.heroPlanText}>{memberData.plan_name}</Text>
                </View>
              )}
            </View>
          </View>
        </FadeInView>

        {/* ── Context strip ─────────────────────────────────────── */}
        {(memberData.height_cm || memberData.target_weight || memberData.total_visits) && (
          <FadeInView delay={80}>
            <View style={styles.contextStrip}>
              {memberData.height_cm && (
                <View style={styles.ctxItem}>
                  <MaterialCommunityIcons name="human-male-height" size={14} color={Colors.accent} />
                  <Text style={styles.ctxVal}>{memberData.height_cm} cm</Text>
                  <Text style={styles.ctxLbl}>Height</Text>
                </View>
              )}
              {memberData.target_weight && (
                <View style={styles.ctxItem}>
                  <MaterialCommunityIcons name="weight" size={14} color={Colors.green} />
                  <Text style={styles.ctxVal}>{memberData.target_weight} kg</Text>
                  <Text style={styles.ctxLbl}>Target</Text>
                </View>
              )}
              {memberData.total_visits > 0 && (
                <View style={styles.ctxItem}>
                  <MaterialCommunityIcons name="map-marker-check-outline" size={14} color="#A78BFA" />
                  <Text style={styles.ctxVal}>{memberData.total_visits}</Text>
                  <Text style={styles.ctxLbl}>Visits</Text>
                </View>
              )}
            </View>
          </FadeInView>
        )}

        {/* ── Action cards ──────────────────────────────────────── */}
        <FadeInView delay={140}>
          <Text style={styles.sectionLabel}>CHOOSE AN ACTION</Text>
        </FadeInView>

        {ACTIONS.map((action, i) => (
          <FadeInView key={action.key} delay={160 + i * 60}>
            <AnimatedPressable
              style={styles.actionCard}
              scaleDown={0.97}
              onPress={() => handleAction(action)}
            >
              <LinearGradient
                colors={[action.color + '10', 'transparent']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />
              {/* Left accent bar */}
              <View style={[styles.actionBar, { backgroundColor: action.color }]} />

              <View style={[styles.actionIconBox, {
                backgroundColor: action.color + '18',
                borderColor:     action.color + '30',
              }]}>
                <MaterialCommunityIcons name={action.icon} size={22} color={action.color} />
              </View>

              <View style={styles.actionText}>
                <Text style={styles.actionLabel}>{action.label}</Text>
                <Text style={styles.actionDesc}>{action.desc}</Text>
              </View>

              <MaterialCommunityIcons name="chevron-right" size={18} color={action.color + 'AA'} />
            </AnimatedPressable>
          </FadeInView>
        ))}

        {/* ── Disclaimer ────────────────────────────────────────── */}
        <FadeInView delay={360}>
          <View style={styles.disclaimer}>
            <MaterialCommunityIcons name="shield-check-outline" size={13} color={Colors.textMuted} />
            <Text style={styles.disclaimerText}>
              AI suggestions are general guidance only. Consult a professional trainer for medical or injury-related advice.
            </Text>
          </View>
        </FadeInView>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Result Modal ─────────────────────────────────────────── */}
      <Modal
        visible={showResult}
        transparent
        animationType="slide"
        onRequestClose={() => { if (!loading) setShowResult(false); }}
      >
        <View style={styles.modalBackdrop}>
          {/* Sheet: explicit height so ScrollView flex:1 works */}
          <View style={styles.resultSheet}>
            {/* Top colour bar */}
            <View style={[styles.resultTopBar, {
              backgroundColor: currentAction?.color ?? Colors.accent,
            }]} />

            {/* Header row */}
            <View style={styles.resultHeader}>
              <View style={[styles.resultIconBox, {
                backgroundColor: (currentAction?.color ?? Colors.accent) + '18',
                borderColor:     (currentAction?.color ?? Colors.accent) + '30',
              }]}>
                <MaterialCommunityIcons
                  name={currentAction?.icon ?? 'robot-outline'}
                  size={20}
                  color={currentAction?.color ?? Colors.accent}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.resultTitle}>{currentAction?.label ?? 'AI Response'}</Text>
                <Text style={styles.resultSub}>
                  {loading ? 'Generating your personalised plan...' : aiError ? 'Something went wrong' : 'Your personalised plan is ready'}
                </Text>
              </View>
              {!loading && (
                <AnimatedPressable
                  style={styles.closeBtn}
                  scaleDown={0.9}
                  onPress={() => setShowResult(false)}
                >
                  <MaterialCommunityIcons name="close" size={18} color={Colors.textMuted} />
                </AnimatedPressable>
              )}
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Content — flex:1 works because resultSheet has explicit height */}
            <ScrollView
              style={styles.resultScroll}
              contentContainerStyle={styles.resultContent}
              showsVerticalScrollIndicator={false}
            >
              {loading ? (
                <View style={styles.loadingWrap}>
                  <LottieView
                    source={require('@/assets/animations/aichatbot.json')}
                    autoPlay loop
                    style={{ width: 120, height: 120 }}
                  />
                  <Text style={styles.loadingLabel}>AI is building your plan...</Text>
                  <Text style={styles.loadingHint}>Analysing your profile & fitness data</Text>
                </View>
              ) : aiError ? (
                <View style={styles.errorWrap}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={44} color={Colors.red} />
                  <Text style={styles.errorTitle}>Something went wrong</Text>
                  <Text style={styles.errorMsg}>{aiError || 'AI response failed. Please try again.'}</Text>
                  <AnimatedPressable
                    style={styles.retryBtn}
                    scaleDown={0.95}
                    onPress={() => currentAction && handleAction(currentAction)}
                  >
                    <MaterialCommunityIcons name="refresh" size={15} color={Colors.text} />
                    <Text style={styles.retryText}>TRY AGAIN</Text>
                  </AnimatedPressable>
                </View>
              ) : aiText ? (
                <View style={styles.responseWrap}>
                  <View style={styles.aiTag}>
                    <View style={styles.aiTagDot} />
                    <Text style={styles.aiTagText}>GENERATED BY GYMSETU AI</Text>
                  </View>
                  {renderResponse(aiText)}
                </View>
              ) : (
                <View style={styles.emptyWrap}>
                  <MaterialCommunityIcons name="robot-confused-outline" size={44} color={Colors.textMuted} />
                  <Text style={styles.emptyTitle}>No response yet</Text>
                  <Text style={styles.emptyMsg}>Tap REGENERATE to try again.</Text>
                </View>
              )}
            </ScrollView>

            {/* Footer — shown when not loading */}
            {!loading && (
              <View style={styles.resultFooter}>
                <AnimatedPressable
                  style={[styles.footerBtn, { backgroundColor: currentAction?.color ?? Colors.accent }]}
                  scaleDown={0.95}
                  onPress={() => { if (currentAction) handleAction(currentAction); }}
                >
                  <MaterialCommunityIcons name="refresh" size={15} color="#000" />
                  <Text style={styles.footerBtnText}>REGENERATE</Text>
                </AnimatedPressable>
                <AnimatedPressable
                  style={styles.footerBtnGhost}
                  scaleDown={0.95}
                  onPress={() => setShowResult(false)}
                >
                  <Text style={styles.footerBtnGhostText}>CLOSE</Text>
                </AnimatedPressable>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: Colors.bg },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.bgCard,
    borderWidth: 1, borderColor: Colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: {
    fontFamily: Fonts.condensedBold, fontSize: 15, color: Colors.text, letterSpacing: 1.2,
  },
  headerSub: {
    fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 1,
  },
  liveChip: {
    marginLeft: 'auto',
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.green + '14',
    borderWidth: 1, borderColor: Colors.green + '30',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  liveDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.green },
  liveText: { fontFamily: Fonts.condensedBold, fontSize: 10, color: Colors.green, letterSpacing: 1 },

  scroll: { paddingHorizontal: 16, paddingTop: 16 },

  // Hero
  heroBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border,
    padding: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  heroLottie:  { width: 80, height: 80, marginRight: 14 },
  heroGreet:   { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, marginBottom: 2 },
  heroTitle:   { fontFamily: Fonts.condensedBold, fontSize: 20, color: Colors.text, lineHeight: 24, letterSpacing: 0.3 },
  heroPlanChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8,
    backgroundColor: Colors.green + '14',
    borderWidth: 1, borderColor: Colors.green + '30',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, alignSelf: 'flex-start',
  },
  heroPlanText: { fontFamily: Fonts.condensedBold, fontSize: 10, color: Colors.green, letterSpacing: 0.8 },

  // Context strip
  contextStrip: {
    flexDirection: 'row',
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border,
    padding: 12,
    marginBottom: 16,
    gap: 0,
  },
  ctxItem:  { flex: 1, alignItems: 'center', gap: 3 },
  ctxVal:   { fontFamily: Fonts.bold, fontSize: 14, color: Colors.text },
  ctxLbl:   { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted },

  // Section label
  sectionLabel: {
    fontFamily: Fonts.condensedBold, fontSize: 11, color: Colors.textMuted,
    letterSpacing: 1.5, marginBottom: 10, marginLeft: 2,
  },

  // Action cards
  actionCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border,
    padding: 16,
    marginBottom: 10,
    gap: 12,
    overflow: 'hidden',
  },
  actionBar:     { width: 3, height: '100%', borderRadius: 2, position: 'absolute', left: 0, top: 0 },
  actionIconBox: {
    width: 44, height: 44, borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center', alignItems: 'center',
  },
  actionText:  { flex: 1, gap: 3 },
  actionLabel: { fontFamily: Fonts.condensedBold, fontSize: 14, color: Colors.text, letterSpacing: 0.3 },
  actionDesc:  { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted },

  // Disclaimer
  disclaimer: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 7,
    marginTop: 8,
    backgroundColor: Colors.bgCard,
    borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border,
    padding: 12,
  },
  disclaimerText: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, flex: 1, lineHeight: 17 },

  // Modal
  modalBackdrop: {
    flex: 1, justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  // Explicit height so the inner ScrollView's flex:1 is resolved correctly
  resultSheet: {
    height: '85%',
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderWidth: 1, borderColor: Colors.border,
    overflow: 'hidden',
  },
  resultTopBar:  { height: 4 },
  resultHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, gap: 0,
  },
  resultIconBox: {
    width: 40, height: 40, borderRadius: 11,
    borderWidth: 1,
    justifyContent: 'center', alignItems: 'center',
  },
  resultTitle: { fontFamily: Fonts.condensedBold, fontSize: 14, color: Colors.text, letterSpacing: 0.5 },
  resultSub:   { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: Colors.bg,
    borderWidth: 1, borderColor: Colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  divider:      { height: 1, backgroundColor: Colors.border, marginHorizontal: 16 },
  resultScroll: { flex: 1 },
  resultContent: { padding: 20, paddingBottom: 12 },

  // Loading state
  loadingWrap:  { alignItems: 'center', paddingVertical: 40 },
  loadingLabel: { fontFamily: Fonts.condensedBold, fontSize: 16, color: Colors.text, marginTop: 8, letterSpacing: 0.5 },
  loadingHint:  { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, marginTop: 6 },

  // Error state
  errorWrap:  { alignItems: 'center', paddingVertical: 40, gap: 10 },
  errorTitle: { fontFamily: Fonts.condensedBold, fontSize: 17, color: Colors.text },
  errorMsg:   { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 20, paddingHorizontal: 8 },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.bgElevated,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 24, paddingVertical: 11, borderRadius: 12, marginTop: 8,
  },
  retryText: { fontFamily: Fonts.condensedBold, fontSize: 12, color: Colors.text, letterSpacing: 1 },

  // Empty state
  emptyWrap:  { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyTitle: { fontFamily: Fonts.condensedBold, fontSize: 16, color: Colors.text },
  emptyMsg:   { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted },

  // Response rendering
  responseWrap: { gap: 4 },
  aiTag: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.accent + '12',
    borderWidth: 1, borderColor: Colors.accent + '25',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
    alignSelf: 'flex-start', marginBottom: 14,
  },
  aiTagDot:  { width: 5, height: 5, borderRadius: 2.5, backgroundColor: Colors.accent },
  aiTagText: { fontFamily: Fonts.condensedBold, fontSize: 9, color: Colors.accent, letterSpacing: 1.2 },

  respHeading: { fontFamily: Fonts.condensedBold, fontSize: 15, color: Colors.text, marginTop: 12, marginBottom: 4, letterSpacing: 0.5 },
  respBold:    { fontFamily: Fonts.bold, fontSize: 13, color: Colors.text, marginVertical: 4 },
  respPara:    { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSub, lineHeight: 21, marginBottom: 4 },
  bulletRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 5 },
  bulletDot:   { width: 5, height: 5, borderRadius: 2.5, backgroundColor: Colors.accent, marginTop: 8 },
  bulletNum:   { fontFamily: Fonts.bold, fontSize: 13, color: Colors.accent, minWidth: 22 },
  bulletText:  { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSub, flex: 1, lineHeight: 20 },

  // Footer
  resultFooter: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 28,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  footerBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 13, borderRadius: 12,
  },
  footerBtnText: { fontFamily: Fonts.condensedBold, fontSize: 13, color: '#000', letterSpacing: 0.8 },
  footerBtnGhost: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 13, borderRadius: 12,
    backgroundColor: Colors.bg,
    borderWidth: 1, borderColor: Colors.border,
  },
  footerBtnGhostText: { fontFamily: Fonts.condensedBold, fontSize: 13, color: Colors.textMuted, letterSpacing: 0.8 },
});
