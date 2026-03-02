 import { useState } from 'react';                                                    import { View, Text, ScrollView, StyleSheet } from 'react-native';                   import { Stack } from 'expo-router';                                                 import { MaterialCommunityIcons } from '@expo/vector-icons';                       
  import { Colors } from '@/constants/colors';                                         import { Fonts } from '@/constants/fonts';                                         
  import FadeInView from '@/components/FadeInView';                                    import BarChart from '@/components/reports/BarChart';                              
  import HorizontalBar from '@/components/reports/HorizontalBar';                    
  import PeriodSelector from '@/components/reports/PeriodSelector';                  
  import {
    revenueMonthly,
    revenueDailyThisWeek,
    revenueByMethod,
    formatINR,
  } from '@/components/reports/mockData';

  type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];       

  export default function RevenueReport() {
    const [period, setPeriod] = useState('Month');

    const chartData = period === 'Week'
      ? revenueDailyThisWeek.map(d => ({ label: d.day,   value: d.amount }))
      : revenueMonthly.map(d      => ({ label: d.month,  value: d.amount }));        

    const totalThisMonth = revenueMonthly[revenueMonthly.length - 1].amount;
    const totalLastMonth = revenueMonthly[revenueMonthly.length - 2].amount;
    const growth = ((totalThisMonth - totalLastMonth) / totalLastMonth) * 100;       
    const totalYear = revenueMonthly.reduce((s, d) => s + d.amount, 0);
    const avgMonthly = Math.round(totalYear / revenueMonthly.length);

    const topMethod = [...revenueByMethod].sort((a, b) => b.percent - a.percent)[0]; 

    const summaryStats: { label: string; value: string; icon: IconName; color:       
  string; sub: string }[] = [
      { label: 'THIS MONTH',  value: formatINR(totalThisMonth), icon:
  'calendar-month-outline', color: Colors.green,  sub: `+${growth.toFixed(1)}% vs    
  last month` },
      { label: 'LAST MONTH',  value: formatINR(totalLastMonth), icon:
  'calendar-outline',       color: Colors.accent, sub: 'previous period'
            },
      { label: 'YEARLY TOTAL',value: formatINR(totalYear),      icon: 'trending-up', 
             color: '#3B82F6',     sub: `${revenueMonthly.length} months`        },  
      { label: 'AVG / MONTH', value: formatINR(avgMonthly),     icon: 'chart-line',  
             color: '#A78BFA',     sub: 'rolling average'                        },  
    ];

    return (
      <>
        <Stack.Screen options={{ title: 'Revenue Analytics' }} />
        <ScrollView style={styles.container} contentContainerStyle={styles.content}  
  showsVerticalScrollIndicator={false}>

          {/* ── Hero ─────────────────────────────────────────── */}
          <FadeInView delay={0}>
            <View style={styles.hero}>
              <View style={styles.heroGlow} />
              <View style={{ flex: 1 }}>
                <Text style={styles.heroMicro}>FINANCIAL REPORT</Text>
                <Text style={styles.heroTitle}>{formatINR(totalThisMonth)}</Text>    
                <Text style={styles.heroSub}>Revenue this month</Text>
              </View>
              <View style={[styles.growthBadge, { backgroundColor: growth >= 0 ?     
  Colors.green + '18' : Colors.red + '18' }]}>
                <MaterialCommunityIcons
                  name={growth >= 0 ? 'trending-up' : 'trending-down'}
                  size={14}
                  color={growth >= 0 ? Colors.green : Colors.red}
                />
                <Text style={[styles.growthText, { color: growth >= 0 ? Colors.green 
  : Colors.red }]}>
                  {growth >= 0 ? '+' : ''}{growth.toFixed(1)}%
                </Text>
              </View>
            </View>
          </FadeInView>

          {/* ── Summary Stats Grid ────────────────────────────── */}
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
                <View style={[styles.cardHeaderDot, { backgroundColor: Colors.green  
  }]} />
                <Text style={styles.cardTitle}>
                  {period === 'Week' ? 'DAILY COLLECTION' : 'MONTHLY REVENUE'}       
                </Text>
              </View>
              <BarChart
                data={chartData}
                color={Colors.green}
                formatValue={v => formatINR(v)}
              />
            </View>
          </FadeInView>

          {/* ── Payment Method Breakdown ──────────────────────── */}
          <FadeInView delay={320}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardHeaderDot, { backgroundColor: Colors.accent 
  }]} />
                <Text style={styles.cardTitle}>PAYMENT METHOD BREAKDOWN</Text>       
              </View>
              <View style={styles.topMethodRow}>
                <MaterialCommunityIcons name="star-circle-outline" size={14}
  color={Colors.accent} />
                <Text style={styles.topMethodText}>
                  Top method: <Text style={{ color: Colors.accent
  }}>{topMethod.method}</Text> ({topMethod.percent}%)
                </Text>
              </View>
              <HorizontalBar
                data={revenueByMethod.map(r => ({ label: r.method, percent:
  r.percent, color: r.color }))}
              />
            </View>
          </FadeInView>

          {/* ── Daily This Week ───────────────────────────────── */}
          <FadeInView delay={440}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardHeaderDot, { backgroundColor: Colors.accent 
  }]} />
                <Text style={styles.cardTitle}>THIS WEEK — DAILY BREAKDOWN</Text>    
              </View>
              <BarChart
                data={revenueDailyThisWeek.map(d => ({ label: d.day, value: d.amount 
  }))}
                color={Colors.accent}
                height={120}
                formatValue={v => formatINR(v)}
              />
            </View>
          </FadeInView>

          {/* ── Method Detail Rows ────────────────────────────── */}
          <FadeInView delay={520}>
            <Text style={styles.sectionLabel}>COLLECTION BY METHOD</Text>
            <View style={styles.methodCard}>
              {revenueByMethod.map((m, i) => (
                <View key={m.method} style={[styles.methodRow, i <
  revenueByMethod.length - 1 && styles.rowBorder]}>
                  <View style={[styles.methodDot, { backgroundColor: m.color }]} />  
                  <Text style={styles.methodName}>{m.method}</Text>
                  <View style={styles.methodRight}>
                    <Text style={[styles.methodPct, { color: m.color
  }]}>{m.percent}%</Text>
                    <View style={styles.methodBar}>
                      <View style={[styles.methodBarFill, { width: `${m.percent}%` as
   any, backgroundColor: m.color }]} />
                    </View>
                  </View>
                </View>
              ))}
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
      borderWidth: 1, borderColor: Colors.green + '30',
      overflow: 'hidden',
    },
    heroGlow: {
      position: 'absolute', top: -30, left: -20,
      width: 100, height: 100, borderRadius: 50,
      backgroundColor: Colors.accentGlow,
    },
    heroMicro:   { fontFamily: Fonts.medium, fontSize: 9, color: Colors.green,       
  letterSpacing: 1.5 },
    heroTitle:   { fontFamily: Fonts.condensedBold, fontSize: 28, color: Colors.text,
   letterSpacing: 0.3 },
    heroSub:     { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, 
  marginTop: 2 },
    growthBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 
  10, paddingHorizontal: 10, paddingVertical: 7 },
    growthText:  { fontFamily: Fonts.condensedBold, fontSize: 16, letterSpacing: 0.3 
  },

    // Stats grid
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
    statVal:   { fontFamily: Fonts.condensedBold, fontSize: 17, color: Colors.text },
    statLabel: { fontFamily: Fonts.bold, fontSize: 8, color: Colors.textMuted,       
  letterSpacing: 1 },
    statSub:   { fontFamily: Fonts.regular, fontSize: 9, color: Colors.textMuted,    
  marginTop: 1 },

    sectionLabel: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted,    
  letterSpacing: 1.8, marginTop: 4 },

    // Card
    card: {
      backgroundColor: Colors.bgCard, borderRadius: 16,
      padding: 16, borderWidth: 1, borderColor: Colors.border, gap: 14,
    },
    cardHeader:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
    cardHeaderDot: { width: 8, height: 8, borderRadius: 4 },
    cardTitle:     { fontFamily: Fonts.bold, fontSize: 11, color: Colors.text,       
  letterSpacing: 0.8 },

    topMethodRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -6
   },
    topMethodText: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted
   },

    // Method rows
    methodCard: {
      backgroundColor: Colors.bgCard, borderRadius: 14,
      borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
    },
    methodRow:  { flexDirection: 'row', alignItems: 'center', gap: 12,
  paddingHorizontal: 14, paddingVertical: 12 },
    rowBorder:  { borderBottomWidth: 1, borderBottomColor: Colors.border },
    methodDot:  { width: 8, height: 8, borderRadius: 4 },
    methodName: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.text, flex: 1  
  },
    methodRight:{ alignItems: 'flex-end', gap: 4 },
    methodPct:  { fontFamily: Fonts.condensedBold, fontSize: 15 },
    methodBar:  { width: 80, height: 4, backgroundColor: Colors.border, borderRadius:
   2, overflow: 'hidden' },
    methodBarFill: { height: 4, borderRadius: 2 },
  });