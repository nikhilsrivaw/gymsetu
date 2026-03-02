 import { useState } from 'react';                                        import { View, Text, ScrollView, StyleSheet } from 'react-native';                 
import { Stack } from 'expo-router';
  import { MaterialCommunityIcons } from '@expo/vector-icons';                       
  import { Colors } from '@/constants/colors';                                         import { Fonts } from '@/constants/fonts';                                         
  import FadeInView from '@/components/FadeInView';                                    import BarChart from '@/components/reports/BarChart';                              
  import PeriodSelector from '@/components/reports/PeriodSelector';                    import {                                                                               attendanceWeekly,                                                                
    attendanceMonthly,
    topConsistentMembers,
  } from '@/components/reports/mockData';

  type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];       

  const medals: { icon: IconName; color: string }[] = [
    { icon: 'medal',        color: '#FFD700' },
    { icon: 'medal',        color: '#C0C0C0' },
    { icon: 'medal',        color: '#CD7F32' },
    { icon: 'numeric-4-circle-outline', color: Colors.textMuted },
    { icon: 'numeric-5-circle-outline', color: Colors.textMuted },
  ];

  export default function AttendanceReport() {
    const [period, setPeriod] = useState('Week');

    const chartData = period === 'Week'
      ? attendanceWeekly.map(d  => ({ label: d.day,   value: d.count }))
      : attendanceMonthly.map(d => ({ label: d.month, value: d.avg   }));

    const peakDay    = [...attendanceWeekly].sort((a, b) => b.count - a.count)[0];   
    const lowDay     = [...attendanceWeekly].sort((a, b) => a.count - b.count)[0];   
    const avgWeekly  = Math.round(attendanceWeekly.reduce((s, d) => s + d.count, 0) /
   attendanceWeekly.length);
    const totalWeek  = attendanceWeekly.reduce((s, d) => s + d.count, 0);

    const summaryStats: { label: string; value: string; icon: IconName; color:       
  string; sub: string }[] = [
      { label: 'DAILY AVG',  value: String(avgWeekly),          icon: 'chart-bar',   
            color: Colors.orange, sub: 'check-ins per day'  },
      { label: 'PEAK DAY',   value: peakDay.day,                icon: 'fire',        
            color: Colors.accent, sub: `${peakDay.count} check-ins` },
      { label: 'LOWEST DAY', value: lowDay.day,                 icon:
  'arrow-down-circle-outline', color: '#3B82F6', sub: `${lowDay.count} check-ins` }, 
      { label: 'THIS WEEK',  value: String(totalWeek),          icon:
  'calendar-week-outline', color: Colors.green,  sub: 'total check-ins'    },        
    ];

    // Day-of-week heatmap data
    const maxCount = Math.max(...attendanceWeekly.map(d => d.count));

    return (
      <>
        <Stack.Screen options={{ title: 'Attendance Analytics' }} />
        <ScrollView style={styles.container} contentContainerStyle={styles.content}  
  showsVerticalScrollIndicator={false}>

          {/* ── Hero ─────────────────────────────────────────── */}
          <FadeInView delay={0}>
            <View style={styles.hero}>
              <View style={styles.heroGlow} />
              <View style={{ flex: 1 }}>
                <Text style={styles.heroMicro}>ATTENDANCE REPORT</Text>
                <Text style={styles.heroTitle}>{avgWeekly} / DAY</Text>
                <Text style={styles.heroSub}>Average daily check-ins</Text>
              </View>
              <View style={styles.peakWrap}>
                <MaterialCommunityIcons name="fire" size={18} color={Colors.orange}  
  />
                <Text style={styles.peakVal}>{peakDay.count}</Text>
                <Text style={styles.peakLabel}>PEAK</Text>
              </View>
            </View>
          </FadeInView>

          {/* ── Summary Stats ─────────────────────────────────── */}
          <FadeInView delay={60}>
            <View style={styles.statsGrid}>
              {summaryStats.map(s => (
                <View key={s.label} style={styles.statCard}>
                  <View style={[styles.statBar, { backgroundColor: s.color }]} />    
                  <View style={styles.statInner}>
                    <View style={[styles.statIcon, { backgroundColor: s.color + '18' 
  }]}>
                      <MaterialCommunityIcons name={s.icon} size={14} color={s.color}
   />
                    </View>
                    <Text style={styles.statVal}>{s.value}</Text>
                    <Text style={styles.statLabel}>{s.label}</Text>
                    <Text style={styles.statSub}>{s.sub}</Text>
                  </View>
                </View>
              ))}
            </View>
          </FadeInView>

          {/* ── Period Selector ───────────────────────────────── */}
          <FadeInView delay={120}>
            <PeriodSelector options={['Week', 'Month']} selected={period}
  onSelect={setPeriod} />
          </FadeInView>

          {/* ── Bar Chart ─────────────────────────────────────── */}
          <FadeInView delay={200}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardDot, { backgroundColor: Colors.orange }]} />
                <Text style={styles.cardTitle}>
                  {period === 'Week' ? 'THIS WEEK — DAILY' : 'MONTHLY AVERAGE'}      
                </Text>
              </View>
              <BarChart data={chartData} color={Colors.orange} />
            </View>
          </FadeInView>

          {/* ── Day Heatmap ───────────────────────────────────── */}
          <FadeInView delay={300}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardDot, { backgroundColor: Colors.accent }]} />
                <Text style={styles.cardTitle}>WEEKLY HEATMAP</Text>
              </View>
              <View style={styles.heatmapRow}>
                {attendanceWeekly.map(d => {
                  const intensity = d.count / maxCount;
                  return (
                    <View key={d.day} style={styles.heatmapCol}>
                      <View style={[
                        styles.heatmapBox,
                        { backgroundColor: Colors.orange + Math.round(intensity *    
  255).toString(16).padStart(2, '0') }
                      ]}>
                        <Text style={styles.heatmapVal}>{d.count}</Text>
                      </View>
                      <Text style={styles.heatmapDay}>{d.day.slice(0,
  2).toUpperCase()}</Text>
                    </View>
                  );
                })}
              </View>
              <View style={styles.heatmapLegend}>
                <Text style={styles.heatmapLegendLabel}>LOW</Text>
                <View style={styles.heatmapGradient}>
                  {[0.1, 0.3, 0.5, 0.7, 0.9].map(i => (
                    <View
                      key={i}
                      style={[styles.heatmapGradientBox, {
                        backgroundColor: Colors.orange + Math.round(i *
  255).toString(16).padStart(2, '0'),
                      }]}
                    />
                  ))}
                </View>
                <Text style={styles.heatmapLegendLabel}>HIGH</Text>
              </View>
            </View>
          </FadeInView>

          {/* ── Top Consistent Members ────────────────────────── */}
          <FadeInView delay={420}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardDot, { backgroundColor: '#FFD700' }]} />    
                <Text style={styles.cardTitle}>MOST CONSISTENT MEMBERS</Text>        
              </View>
              <Text style={styles.cardSub}>Top 5 by attendance this month</Text>     
              {topConsistentMembers.map((member, i) => (
                <View key={member.name} style={[styles.memberRow, i <
  topConsistentMembers.length - 1 && styles.rowBorder]}>
                  {/* Medal */}
                  <MaterialCommunityIcons name={medals[i].icon} size={22}
  color={medals[i].color} />

                  {/* Avatar */}
                  <View style={styles.memberAvatarWrap}>
                    <Text style={styles.memberAvatar}>{member.avatar}</Text>
                  </View>

                  {/* Info */}
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    <View style={styles.memberBarWrap}>
                      <View style={styles.memberBarTrack}>
                        <View style={[styles.memberBarFill, { width: `${(member.days 
  / 30) * 100}%` as any }]} />
                      </View>
                      <Text style={styles.memberDays}>{member.days}/30 days</Text>   
                    </View>
                  </View>

                  {/* Badge */}
                  <View style={[styles.daysBadge, i === 0 && { backgroundColor:      
  '#FFD700' + '20' }]}>
                    <Text style={[styles.daysNum, i === 0 && { color: '#FFD700'      
  }]}>{member.days}</Text>
                  </View>
                </View>
              ))}
            </View>
          </FadeInView>

          {/* ── Monthly Trend ─────────────────────────────────── */}
          <FadeInView delay={520}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardDot, { backgroundColor: Colors.green }]} /> 
                <Text style={styles.cardTitle}>MONTHLY TREND</Text>
              </View>
              <BarChart
                data={attendanceMonthly.map(d => ({ label: d.month, value: d.avg }))}
                color={Colors.green}
                height={120}
              />
            </View>
          </FadeInView>

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
      borderWidth: 1, borderColor: Colors.orange + '30',
      overflow: 'hidden',
    },
    heroGlow: {
      position: 'absolute', top: -30, left: -20,
      width: 100, height: 100, borderRadius: 50,
      backgroundColor: Colors.accentGlow,
    },
    heroMicro: { fontFamily: Fonts.medium, fontSize: 9, color: Colors.orange,        
  letterSpacing: 1.5 },
    heroTitle: { fontFamily: Fonts.condensedBold, fontSize: 28, color: Colors.text,  
  letterSpacing: 0.3 },
    heroSub:   { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted,   
  marginTop: 2 },
    peakWrap:  { alignItems: 'center', backgroundColor: Colors.orange + '15',        
  borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1,      
  borderColor: Colors.orange + '30', gap: 2 },
    peakVal:   { fontFamily: Fonts.condensedBold, fontSize: 26, color: Colors.orange 
  },
    peakLabel: { fontFamily: Fonts.bold, fontSize: 8, color: Colors.orange,
  letterSpacing: 1 },

    // Stats
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    statCard: {
      width: '48%', flexDirection: 'row',
      backgroundColor: Colors.bgCard, borderRadius: 14,
      borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
    },
    statBar:   { width: 3 },
    statInner: { flex: 1, padding: 12, gap: 2 },
    statIcon:  { width: 28, height: 28, borderRadius: 8, justifyContent: 'center',   
  alignItems: 'center', marginBottom: 5 },
    statVal:   { fontFamily: Fonts.condensedBold, fontSize: 20, color: Colors.text },
    statLabel: { fontFamily: Fonts.bold, fontSize: 8, color: Colors.textMuted,       
  letterSpacing: 1 },
    statSub:   { fontFamily: Fonts.regular, fontSize: 9, color: Colors.textMuted,    
  marginTop: 1 },

    // Card
    card: {
      backgroundColor: Colors.bgCard, borderRadius: 16,
      padding: 16, borderWidth: 1, borderColor: Colors.border, gap: 14,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    cardDot:    { width: 8, height: 8, borderRadius: 4 },
    cardTitle:  { fontFamily: Fonts.bold, fontSize: 11, color: Colors.text,
  letterSpacing: 0.8 },
    cardSub:    { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted,  
  marginTop: -6 },

    // Heatmap
    heatmapRow:    { flexDirection: 'row', justifyContent: 'space-between' },        
    heatmapCol:    { alignItems: 'center', gap: 6 },
    heatmapBox:    { width: 38, height: 38, borderRadius: 10, justifyContent:        
  'center', alignItems: 'center' },
    heatmapVal:    { fontFamily: Fonts.condensedBold, fontSize: 14, color:
  Colors.text },
    heatmapDay:    { fontFamily: Fonts.bold, fontSize: 8, color: Colors.textMuted,   
  letterSpacing: 0.6 },
    heatmapLegend: { flexDirection: 'row', alignItems: 'center', gap: 8,
  justifyContent: 'center', marginTop: -4 },
    heatmapLegendLabel: { fontFamily: Fonts.bold, fontSize: 8, color:
  Colors.textMuted },
    heatmapGradient:    { flexDirection: 'row', gap: 3 },
    heatmapGradientBox: { width: 18, height: 8, borderRadius: 2 },

    // Members
    memberRow:       { flexDirection: 'row', alignItems: 'center', gap: 10,
  paddingVertical: 10 },
    rowBorder:       { borderBottomWidth: 1, borderBottomColor: Colors.border },     
    memberAvatarWrap:{ width: 36, height: 36, borderRadius: 18, backgroundColor:     
  Colors.bgElevated, justifyContent: 'center', alignItems: 'center' },
    memberAvatar:    { fontSize: 20 },
    memberInfo:      { flex: 1, gap: 5 },
    memberName:      { fontFamily: Fonts.bold, fontSize: 13, color: Colors.text },   
    memberBarWrap:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
    memberBarTrack:  { flex: 1, height: 4, backgroundColor: Colors.border,
  borderRadius: 2, overflow: 'hidden' },
    memberBarFill:   { height: 4, backgroundColor: Colors.orange, borderRadius: 2 }, 
    memberDays:      { fontFamily: Fonts.regular, fontSize: 9, color:
  Colors.textMuted },
    daysBadge:       { backgroundColor: Colors.accentMuted, paddingHorizontal: 10,   
  paddingVertical: 5, borderRadius: 8 },
    daysNum:         { fontFamily: Fonts.condensedBold, fontSize: 16, color:
  Colors.accent },
  });