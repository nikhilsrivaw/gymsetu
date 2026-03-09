import { useState } from 'react';
  import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';     
  import { MaterialCommunityIcons } from '@expo/vector-icons';
  import { useRouter, Stack } from 'expo-router';
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
    icon: IconName; emoji: string;
    color: string; route: string;
  }[] = [
    { title: 'Revenue',    desc: 'Collections, methods & trends',    icon: 'trending-up',           emoji: '💰',     
  color: Colors.green,  route: '/(owner)/more/reports-revenue'    },
    { title: 'Members',    desc: 'Growth, status & demographics',    icon: 'account-group-outline',  emoji: '👥',    
  color: Colors.accent, route: '/(owner)/more/reports-members'    },
    { title: 'Attendance', desc: 'Weekly & monthly check-in trends', icon: 'calendar-check-outline', emoji: '📋',    
  color: '#3B82F6',     route: '/(owner)/more/reports-attendance' },
    { title: 'Expiry',     desc: 'Expiring & expired memberships',   icon: 'clock-alert-outline',    emoji: '⏰',    
  color: Colors.orange, route: '/(owner)/more/reports-expiry'     },
  ];

  const currentMonth = new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' });

  export default function ReportsHubScreen() {
    const router = useRouter();
    const { profile } = useAuthStore();
    const [monthlyReport, setMonthlyReport] = useState<string | null>(null);
    const [reportLoading, setReportLoading] = useState(false);

    const handleMonthlyReport = async () => {
      if (!profile?.gym_id) return;
      setReportLoading(true);
      setMonthlyReport(null);

      try {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        // Fetch real data in parallel
        const [totalRes, newRes] = await Promise.all([
          supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('gym_id', profile.gym_id)
            .eq('role', 'member'),
          supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('gym_id', profile.gym_id)
            .eq('role', 'member')
            .gte('created_at', monthStart),
        ]);

        const totalMembers = totalRes.count ?? 0;
        const newMembers   = newRes.count ?? 0;

        const text = await askAI('monthly_report', {
          month:         now.toLocaleString('en-IN', { month: 'long' }),
          newMembers,
          totalMembers,
          revenue:       'not tracked yet',
          attendanceDays: 'not tracked yet',
          renewals:      'not tracked yet',
          expired:       'not tracked yet',
        });

        setMonthlyReport(text);
      } catch {
        Alert.alert('Error', 'Could not generate monthly report');
      }
      setReportLoading(false);
    };

    return (
      <>
        <Stack.Screen options={{ title: 'Reports & Analytics' }} />
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <FadeInView delay={0}>
            <Text style={styles.headline}>ANALYTICS</Text>
            <Text style={styles.sub}>Track your gym's performance</Text>
          </FadeInView>

          {/* AI Monthly Report Card */}
          <FadeInView delay={60}>
            <View style={styles.aiReportCard}>
              <View style={styles.aiReportHead}>
                <View style={styles.aiReportLeft}>
                  <Text style={styles.aiReportEmoji}>📊</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.aiReportTitle}>AI MONTHLY REPORT</Text>
                    <Text style={styles.aiReportSub}>Auto-generated summary · {currentMonth}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.aiReportBtn} onPress={handleMonthlyReport} disabled={reportLoading}>
                  {reportLoading
                    ? <ActivityIndicator size="small" color={Colors.accent} />
                    : <Text style={styles.aiReportBtnText}>✨ Generate</Text>
                  }
                </TouchableOpacity>
              </View>
              {monthlyReport ? (
                <Text style={styles.aiReportText}>{monthlyReport}</Text>
              ) : (
                <Text style={styles.aiReportPlaceholder}>
                  Tap Generate to get an AI-written monthly performance summary
                </Text>
              )}
            </View>
          </FadeInView>

          {/* Report Cards Grid */}
          <View style={styles.grid}>
            {reportCards.map((card, i) => (
              <FadeInView key={card.title} delay={120 + i * 80}>
                <AnimatedPressable
                  style={styles.card}
                  scaleDown={0.96}
                  onPress={() => router.push(card.route as any)}
                >
                  <View style={[styles.cardIcon, { backgroundColor: card.color + '18' }]}>
                    <Text style={styles.cardEmoji}>{card.emoji}</Text>
                  </View>
                  <Text style={styles.cardTitle}>{card.title}</Text>
                  <Text style={styles.cardDesc}>{card.desc}</Text>
                  <View style={[styles.cardChevron, { backgroundColor: card.color + '15' }]}>
                    <MaterialCommunityIcons name="arrow-right" size={14} color={card.color} />
                  </View>
                </AnimatedPressable>
              </FadeInView>
            ))}
          </View>

          <View style={{ height: 32 }} />
        </ScrollView>
      </>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    scroll:    { paddingHorizontal: 16, paddingTop: 20 },

    headline: { fontFamily: Fonts.condensedBold, fontSize: 32, color: Colors.text, letterSpacing: 1 },
    sub:      { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, marginTop: 4, marginBottom: 20 },  

    aiReportCard:        { backgroundColor: Colors.bgCard, borderRadius: 18, borderWidth: 1, borderColor:
  Colors.accent + '30', padding: 18, marginBottom: 20, overflow: 'hidden' },
    aiReportHead:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom:
   10 },
    aiReportLeft:        { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
    aiReportEmoji:       { fontSize: 26 },
    aiReportTitle:       { fontFamily: Fonts.bold, fontSize: 10, color: Colors.accent, letterSpacing: 1.5 },
    aiReportSub:         { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 1 },
    aiReportBtn:         { paddingHorizontal: 14, paddingVertical: 7, backgroundColor: Colors.accentMuted,
  borderRadius: 10, borderWidth: 1, borderColor: Colors.accent + '40' },
    aiReportBtnText:     { fontFamily: Fonts.bold, fontSize: 11, color: Colors.accent, letterSpacing: 0.5 },
    aiReportText:        { fontFamily: Fonts.regular, fontSize: 12, color: Colors.text, lineHeight: 19 },
    aiReportPlaceholder: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, lineHeight: 18 },       

    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },

    card: {
      width: '47.5%', backgroundColor: Colors.bgCard, borderRadius: 18,
      borderWidth: 1, borderColor: Colors.border, padding: 18, gap: 6,
    },
    cardIcon:    { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center',
  marginBottom: 4 },
    cardEmoji:   { fontSize: 24 },
    cardTitle:   { fontFamily: Fonts.bold, fontSize: 16, color: Colors.text },
    cardDesc:    { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, lineHeight: 16 },
    cardChevron: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  });