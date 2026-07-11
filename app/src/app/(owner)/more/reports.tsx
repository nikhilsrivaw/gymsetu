   
  import { useState } from 'react';                                                                                    
  import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';         import { MaterialCommunityIcons } from '@expo/vector-icons';                                                         
  import { useRouter, Stack } from 'expo-router';                                                                      
  import LottieView from '@/components/AppLottie';
  import { Colors } from '@/constants/colors';
  import { Fonts } from '@/constants/fonts';
  import AnimatedPressable from '@/components/AnimatedPressable';
  import FadeInView from '@/components/FadeInView';
  import { askAI } from '@/lib/ai';
  import { supabase } from '@/lib/supabase';
  import { useAuthStore } from '@/store/authStore';

  type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

  const reportCards: {
    title: string; desc: string;
    icon: IconName; color: string; route: string;
  }[] = [
    { title: 'Revenue',    desc: 'Collections, methods & trends',    icon: 'trending-up',           color: '#22c55e',  
  route: '/(owner)/more/reports-revenue'    },
    { title: 'Members',    desc: 'Growth, status & demographics',    icon: 'account-group-outline',  color:
  Colors.accent, route: '/(owner)/more/reports-members'    },
    { title: 'Attendance', desc: 'Weekly & monthly check-in trends', icon: 'calendar-check-outline', color: '#3B82F6', 
  route: '/(owner)/more/reports-attendance' },
    { title: 'Expiry',     desc: 'Expiring & expired memberships',   icon: 'clock-alert-outline',    color: '#f97316', 
  route: '/(owner)/more/reports-expiry'     },
  ];

  const currentMonth = new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' });

  export default function ReportsHubScreen() {
    const router = useRouter();
    const { profile, activeGymId, branches, subscription } = useAuthStore();
    const isPro = !!subscription?.plan && subscription.plan !== 'basic' &&
      (subscription?.status === 'trial' || subscription?.status === 'active');
    const [monthlyReport, setMonthlyReport] = useState<string | null>(null);
    const [reportLoading, setReportLoading] = useState(false);

    const handleMonthlyReport = async () => {
      if (!profile?.gym_id) return;
      setReportLoading(true);
      setMonthlyReport(null);

      try {
        const now        = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const mainGymId  = profile.gym_id;
        const gymIds     = activeGymId === 'all' ? branches.map(b => b.id) : [activeGymId ?? mainGymId];

        const [totalRes, newRes] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }).in('gym_id', gymIds).eq('role',       
  'member'),
          supabase.from('profiles').select('id', { count: 'exact', head: true }).in('gym_id', gymIds).eq('role',       
  'member').gte('created_at', monthStart),
        ]);

        const text = await askAI('monthly_report', {
          month:          now.toLocaleString('en-IN', { month: 'long' }),
          newMembers:     newRes.count ?? 0,
          totalMembers:   totalRes.count ?? 0,
          revenue:        'not tracked yet',
          attendanceDays: 'not tracked yet',
          renewals:       'not tracked yet',
          expired:        'not tracked yet',
        });

        setMonthlyReport(text);
      } catch {
        Alert.alert('Error', 'Could not generate monthly report');
      }
      setReportLoading(false);
    };

    return (
      <>
        <Stack.Screen options={{ title: '', headerStyle: { backgroundColor: '#0a0a0a' }, headerTintColor: '#fff' }} /> 
        <ScrollView style={s.container} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Lottie Banner ── */}
          <FadeInView delay={0}>
            <View style={s.lottieBanner}>
              <View style={s.lottieBannerLeft}>
                <Text style={s.lottieBannerMicro}>PERFORMANCE</Text>
                <Text style={s.lottieBannerTitle}>REPORTS &{'\n'}ANALYTICS</Text>
                <Text style={s.lottieBannerSub}>Track your gym's growth</Text>
              </View>
              <LottieView
                source={require('@/assets/animations/Analytics.json')}
                autoPlay loop
                style={s.lottieAnim}
              />
            </View>
          </FadeInView>

          {/* ── AI Monthly Report ── */}
          <FadeInView delay={60}>
            <Text style={s.sectionLabel}>AI INSIGHTS</Text>
            <View style={s.aiCard}>
              <View style={s.aiCardTop}>
                <View style={s.aiCardTopLeft}>
                  <View style={s.aiLiveDot} />
                  <View>
                    <Text style={s.aiCardTitle}>AI MONTHLY REPORT</Text>
                    <Text style={s.aiCardSub}>{currentMonth}</Text>
                  </View>
                </View>
                {isPro ? (
                  <TouchableOpacity
                    style={s.aiGenerateBtn}
                    onPress={handleMonthlyReport}
                    disabled={reportLoading}
                  >
                    {reportLoading
                      ? <ActivityIndicator size="small" color={Colors.accent} />
                      : <Text style={s.aiGenerateBtnText}>GENERATE</Text>
                    }
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={s.aiLockedBtn}
                    onPress={() => Alert.alert('⚡ Pro Feature', 'AI reports require the Pro plan.\n\nUpgrade at gymsetu.it.com/pricing', [{ text: 'OK' }])}
                  >
                    <MaterialCommunityIcons name="lock-outline" size={12} color={Colors.accent} />
                    <Text style={s.aiLockedBtnText}>PRO</Text>
                  </TouchableOpacity>
                )}
              </View>

              {monthlyReport ? (
                <Text style={s.aiReportText}>{monthlyReport}</Text>
              ) : (
                <Text style={s.aiReportPlaceholder}>
                  Tap Generate to get an AI-written monthly performance summary for your gym.
                </Text>
              )}
            </View>
          </FadeInView>

          {/* ── Report Cards ── */}
          <FadeInView delay={100}>
            <Text style={s.sectionLabel}>DEEP REPORTS</Text>
            <View style={s.reportList}>
              {reportCards.map((card, i) => (
                <AnimatedPressable
                  key={card.title}
                  style={[s.reportRow, i < reportCards.length - 1 && s.rowBorder]}
                  scaleDown={0.97}
                  onPress={() => router.push(card.route as any)}
                >
                  <View style={[s.reportIconWrap, { backgroundColor: card.color + '12' }]}>
                    <MaterialCommunityIcons name={card.icon} size={22} color={card.color} />
                  </View>
                  <View style={s.reportInfo}>
                    <Text style={s.reportTitle}>{card.title}</Text>
                    <Text style={s.reportDesc}>{card.desc}</Text>
                  </View>
                  <View style={[s.reportArrow, { backgroundColor: card.color + '10' }]}>
                    <MaterialCommunityIcons name="arrow-right" size={18} color={card.color} />
                  </View>
                </AnimatedPressable>
              ))}
            </View>
          </FadeInView>

          <View style={{ height: 40 }} />
        </ScrollView>
      </>
    );
  }

  const s = StyleSheet.create({
    // Layout
    container: { flex: 1, backgroundColor: '#0a0a0a' },
    scroll:    { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 },

    // Lottie Banner
    lottieBanner: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: '#141414', borderRadius: 20,
      paddingLeft: 20, paddingVertical: 20,
      borderWidth: 1, borderColor: Colors.accent + '25',
      marginBottom: 24, overflow: 'hidden',
    },
    lottieBannerLeft:  { flex: 1 },
    lottieBannerMicro: { fontFamily: Fonts.bold, fontSize: 10, color: Colors.accent, letterSpacing: 2 },
    lottieBannerTitle: { fontFamily: Fonts.condensedBold, fontSize: 30, color: '#fff', letterSpacing: 0.5, marginTop:  
  6, lineHeight: 34 },
    lottieBannerSub:   { fontFamily: Fonts.regular, fontSize: 13, color: '#555', marginTop: 8 },
    lottieAnim:        { width: 180, height: 180 },

    // Section label
    sectionLabel: { fontFamily: Fonts.bold, fontSize: 10, color: '#444', letterSpacing: 2, marginBottom: 12 },

    // AI Card
    aiCard:        { backgroundColor: '#141414', borderRadius: 18, borderWidth: 1, borderColor: Colors.accent + '25',  
  overflow: 'hidden', marginBottom: 28 },
    aiCardTop:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal:   
  18, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#1e1e1e' },
    aiCardTopLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
    aiLiveDot:     { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.accent, shadowColor:
  Colors.accent, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 6 },
    aiCardTitle:   { fontFamily: Fonts.bold, fontSize: 13, color: Colors.accent, letterSpacing: 1 },
    aiCardSub:     { fontFamily: Fonts.regular, fontSize: 12, color: '#555', marginTop: 2 },
    aiGenerateBtn: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: Colors.accent + '15', borderRadius:  
  12, borderWidth: 1, borderColor: Colors.accent + '40' },
    aiGenerateBtnText: { fontFamily: Fonts.bold, fontSize: 11, color: Colors.accent, letterSpacing: 1 },
    aiLockedBtn:     { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: Colors.accent + '15', borderRadius: 12, borderWidth: 1, borderColor: Colors.accent + '30' },
    aiLockedBtnText: { fontFamily: Fonts.bold, fontSize: 11, color: Colors.accent, letterSpacing: 1 },
    aiReportText:        { fontFamily: Fonts.regular, fontSize: 14, color: '#ccc', lineHeight: 22, padding: 18 },      
    aiReportPlaceholder: { fontFamily: Fonts.regular, fontSize: 14, color: '#333', lineHeight: 22, padding: 18 },      

    // Report list
    reportList: { backgroundColor: '#141414', borderRadius: 18, borderWidth: 1, borderColor: '#1e1e1e', overflow:      
  'hidden' },
    reportRow:  { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingVertical: 18 },   
    rowBorder:  { borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
    reportIconWrap: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },       
    reportInfo:     { flex: 1 },
    reportTitle:    { fontFamily: Fonts.bold, fontSize: 16, color: '#fff' },
    reportDesc:     { fontFamily: Fonts.regular, fontSize: 13, color: '#555', marginTop: 3 },
    reportArrow:    { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },       
  });
