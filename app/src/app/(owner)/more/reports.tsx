 import { View, Text, ScrollView, StyleSheet } from 'react-native';                 
  import { MaterialCommunityIcons } from '@expo/vector-icons';                       
  import { useRouter, Stack } from 'expo-router';                                      import { Colors } from '@/constants/colors';                                       
  import { Fonts } from '@/constants/fonts';                                           import AnimatedPressable from '@/components/AnimatedPressable';                      import FadeInView from '@/components/FadeInView';                                  
  import { quickStats, formatINR } from '@/components/reports/mockData';

  type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];       

  const reports: { label: string; desc: string; icon: IconName; color: string; route:
   string; stat: string }[] = [
    { label: 'Revenue',    desc: 'Income & collections',    icon: 'cash-multiple',   
         color: Colors.green,  route: '/(owner)/more/reports-revenue',    stat:      
  formatINR(quickStats.totalRevenue) },
    { label: 'Members',   desc: 'Growth & demographics',   icon:
  'account-group-outline',  color: Colors.accent, route:
  '/(owner)/more/reports-members',    stat: `${quickStats.totalMembers} total`  },   
    { label: 'Attendance',desc: 'Trends & consistency',    icon:
  'calendar-check-outline', color: Colors.orange, route:
  '/(owner)/more/reports-attendance', stat: `${quickStats.avgAttendance} avg`   },   
    { label: 'Expiry',    desc: 'Renewals due soon',       icon:
  'clock-alert-outline',    color: Colors.red,    route:
  '/(owner)/more/reports-expiry',     stat: `${quickStats.expiringCount} due`   },   
  ];

  const overviewStats = [
    { label: 'REVENUE',    value: formatINR(quickStats.totalRevenue), trend:
  `+${quickStats.revenueTrend}%`,   trendUp: true,  icon: 'trending-up'           as 
  IconName, color: Colors.green  },
    { label: 'MEMBERS',   value: String(quickStats.totalMembers),    trend:
  `+${quickStats.membersTrend}%`,   trendUp: true,  icon: 'account-group-outline'  as
   IconName, color: Colors.accent },
    { label: 'ATTENDANCE',value: String(quickStats.avgAttendance),   trend:
  `+${quickStats.attendanceTrend}%`,trendUp: true,  icon: 'calendar-check-outline' as
   IconName, color: Colors.orange },
    { label: 'EXPIRING',  value: String(quickStats.expiringCount),   trend: 'this week',                      trendUp: false, icon: 'clock-alert-outline'   as IconName, color: Colors.red    },
  ];

  export default function ReportsHub() {
    const router = useRouter();

    return (
      <>
        <Stack.Screen options={{ title: 'Reports & Analytics' }} />
        <ScrollView style={styles.container} contentContainerStyle={styles.content}  
  showsVerticalScrollIndicator={false}>

          {/* ── Hero ─────────────────────────────────────────── */}
          <FadeInView delay={0}>
            <View style={styles.hero}>
              <View style={styles.heroGlow} />
              <View style={{ flex: 1 }}>
                <Text style={styles.heroMicro}>ANALYTICS OVERVIEW</Text>
                <Text style={styles.heroTitle}>REPORTS</Text>
                <Text style={styles.heroSub}>Data-driven gym insights</Text>
              </View>
              <View style={styles.heroIcon}>
                <MaterialCommunityIcons name="chart-bar" size={28}
  color={Colors.accent} />
              </View>
            </View>
          </FadeInView>

          {/* ── Quick Stats Grid ──────────────────────────────── */}
          <FadeInView delay={60}>
            <Text style={styles.sectionLabel}>QUICK OVERVIEW</Text>
            <View style={styles.statsGrid}>
              {overviewStats.map(s => (
                <View key={s.label} style={styles.statCard}>
                  <View style={[styles.statCardBar, { backgroundColor: s.color }]} />
                  <View style={styles.statCardInner}>
                    <View style={[styles.statIcon, { backgroundColor: s.color + '18' 
  }]}>
                      <MaterialCommunityIcons name={s.icon} size={15} color={s.color}
   />
                    </View>
                    <Text style={styles.statVal}>{s.value}</Text>
                    <Text style={styles.statLabel}>{s.label}</Text>
                    <View style={[styles.trendBadge, { backgroundColor: s.trendUp ?  
  Colors.green + '18' : Colors.orange + '18' }]}>
                      <MaterialCommunityIcons
                        name={s.trendUp ? 'trending-up' : 'clock-outline'}
                        size={10}
                        color={s.trendUp ? Colors.green : Colors.orange}
                      />
                      <Text style={[styles.trendText, { color: s.trendUp ?
  Colors.green : Colors.orange }]}>{s.trend}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </FadeInView>

          {/* ── Report Cards ──────────────────────────────────── */}
          <FadeInView delay={120}>
            <Text style={styles.sectionLabel}>DETAILED REPORTS</Text>
          </FadeInView>

          <View style={styles.reportGrid}>
            {reports.map((item, i) => (
              <FadeInView key={item.label} delay={160 + i * 60}
  style={styles.reportGridItem}>
                <AnimatedPressable
                  style={[styles.reportCard, { borderColor: item.color + '30' }]}    
                  scaleDown={0.96}
                  onPress={() => router.push(item.route as any)}
                >
                  <View style={[styles.reportCardAccent, { backgroundColor:
  item.color }]} />
                  <View style={[styles.reportIcon, { backgroundColor: item.color +   
  '18' }]}>
                    <MaterialCommunityIcons name={item.icon} size={22}
  color={item.color} />
                  </View>
                  <Text style={styles.reportLabel}>{item.label}</Text>
                  <Text style={styles.reportDesc}>{item.desc}</Text>
                  <Text style={[styles.reportStat, { color: item.color
  }]}>{item.stat}</Text>
                  <View style={[styles.reportArrow, { backgroundColor: item.color +  
  '18' }]}>
                    <MaterialCommunityIcons name="arrow-right" size={14}
  color={item.color} />
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
    content:   { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 },

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
    heroMicro: { fontFamily: Fonts.medium, fontSize: 9, color: Colors.accent,        
  letterSpacing: 1.5 },
    heroTitle: { fontFamily: Fonts.condensedBold, fontSize: 30, color: Colors.text,  
  letterSpacing: 0.5 },
    heroSub:   { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted,   
  marginTop: 2 },
    heroIcon:  {
      width: 56, height: 56, borderRadius: 28,
      backgroundColor: Colors.accentMuted,
      justifyContent: 'center', alignItems: 'center',
      borderWidth: 2, borderColor: Colors.accent + '30',
    },

    sectionLabel: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted,    
  letterSpacing: 1.8, marginBottom: 10, marginTop: 4 },

    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }, 
    statCard: {
      width: '48%', flexDirection: 'row',
      backgroundColor: Colors.bgCard, borderRadius: 14,
      borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
    },
    statCardBar:   { width: 3 },
    statCardInner: { flex: 1, padding: 12, gap: 3 },
    statIcon:      { width: 28, height: 28, borderRadius: 8, justifyContent:
  'center', alignItems: 'center', marginBottom: 4 },
    statVal:       { fontFamily: Fonts.condensedBold, fontSize: 20, color:
  Colors.text },
    statLabel:     { fontFamily: Fonts.bold, fontSize: 8, color: Colors.textMuted,   
  letterSpacing: 1 },
    trendBadge:    { flexDirection: 'row', alignItems: 'center', gap: 3, alignSelf:  
  'flex-start', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2, marginTop:
   2 },
    trendText:     { fontFamily: Fonts.bold, fontSize: 8, letterSpacing: 0.4 },      

    reportGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    reportGridItem: { width: '48%' },
    reportCard: {
      backgroundColor: Colors.bgCard, borderRadius: 16,
      padding: 16, borderWidth: 1.5,
      overflow: 'hidden', minHeight: 150, gap: 4,
    },
    reportCardAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 3 },
    reportIcon:    { width: 44, height: 44, borderRadius: 12, justifyContent:        
  'center', alignItems: 'center', marginBottom: 4 },
    reportLabel:   { fontFamily: Fonts.condensedBold, fontSize: 18, color:
  Colors.text, letterSpacing: 0.3 },
    reportDesc:    { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted
   },
    reportStat:    { fontFamily: Fonts.bold, fontSize: 11, letterSpacing: 0.3,       
  marginTop: 4 },
    reportArrow:   { position: 'absolute', bottom: 14, right: 14, width: 26, height: 
  26, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  });