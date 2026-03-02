import { View, Text, ScrollView, StyleSheet } from 'react-native';                   import { Stack } from 'expo-router';                                                 import { MaterialCommunityIcons } from '@expo/vector-icons';                         import { Colors } from '@/constants/colors';                                       
  import { Fonts } from '@/constants/fonts';                                           import FadeInView from '@/components/FadeInView';                                  
  import BarChart from '@/components/reports/BarChart';                                import HorizontalBar from '@/components/reports/HorizontalBar';                    
  import StatCard from '@/components/reports/StatCard';                              
  import {                                                                           
    memberGrowth,
    membersByStatus,
    membersByGender,
    membersByGoal,
  } from '@/components/reports/mockData';

  type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];       

  export default function MembersReport() {
    const total  = membersByStatus.reduce((s, m) => s + m.value, 0);
    const active = membersByStatus.find(m => m.label === 'Active')!;
    const inactive = membersByStatus.find(m => m.label === 'Inactive')!;
    const frozen   = membersByStatus.find(m => m.label === 'Frozen');

    const retentionRate = Math.round((active.value / total) * 100);
    const netNew = memberGrowth[memberGrowth.length - 1].count -
  memberGrowth[memberGrowth.length - 2].count;

    const statusBars = membersByStatus.map(m => ({
      label:   `${m.label} (${m.value})`,
      percent: Math.round((m.value / total) * 100),
      color:   m.color,
    }));

    const genderBars = membersByGender.map(m => ({
      label:   `${m.label} (${m.value})`,
      percent: Math.round((m.value / total) * 100),
      color:   m.color,
    }));

    const summaryStats: { label: string; value: string; icon: IconName; color:       
  string; sub: string }[] = [
      { label: 'TOTAL',     value: String(total),          icon:
  'account-group-outline',  color: Colors.accent, sub: 'enrolled members'    },      
      { label: 'ACTIVE',    value: String(active.value),   icon:
  'check-circle-outline',   color: Colors.green,  sub: `${retentionRate}% retention` 
  },
      { label: 'INACTIVE',  value: String(inactive?.value ?? 0), icon:
  'account-off-outline', color: Colors.red, sub: 'no active plan'       },
      { label: 'NET NEW',   value: `+${netNew}`,           icon:
  'account-plus-outline',   color: '#3B82F6',     sub: 'added this month'    },      
    ];

    return (
      <>
        <Stack.Screen options={{ title: 'Member Analytics' }} />
        <ScrollView style={styles.container} contentContainerStyle={styles.content}  
  showsVerticalScrollIndicator={false}>

          {/* ── Hero ─────────────────────────────────────────── */}
          <FadeInView delay={0}>
            <View style={styles.hero}>
              <View style={styles.heroGlow} />
              <View style={{ flex: 1 }}>
                <Text style={styles.heroMicro}>MEMBER REPORT</Text>
                <Text style={styles.heroTitle}>{total} MEMBERS</Text>
                <Text style={styles.heroSub}>Total enrolled strength</Text>
              </View>
              <View style={styles.retentionWrap}>
                <Text style={styles.retentionVal}>{retentionRate}%</Text>
                <Text style={styles.retentionLabel}>RETENTION</Text>
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

          {/* ── Growth Chart ──────────────────────────────────── */}
          <FadeInView delay={140}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardDot, { backgroundColor: Colors.accent }]} />
                <Text style={styles.cardTitle}>MEMBER GROWTH — 6 MONTHS</Text>       
              </View>
              <BarChart
                data={memberGrowth.map(m => ({ label: m.month, value: m.count }))}   
                color={Colors.accent}
              />
              <View style={styles.growthFooter}>
                <MaterialCommunityIcons name="trending-up" size={13}
  color={Colors.green} />
                <Text style={styles.growthFooterText}>
                  +{netNew} new members this month vs last month
                </Text>
              </View>
            </View>
          </FadeInView>

          {/* ── Status Breakdown ──────────────────────────────── */}
          <FadeInView delay={240}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardDot, { backgroundColor: Colors.green }]} /> 
                <Text style={styles.cardTitle}>STATUS BREAKDOWN</Text>
              </View>
              <HorizontalBar data={statusBars} />
              <View style={styles.statusChips}>
                {membersByStatus.map(m => (
                  <View key={m.label} style={[styles.statusChip, { backgroundColor:  
  m.color + '15', borderColor: m.color + '30' }]}>
                    <View style={[styles.statusDot, { backgroundColor: m.color }]} />
                    <Text style={[styles.statusChipText, { color: m.color
  }]}>{m.label}</Text>
                    <Text style={[styles.statusChipVal, { color: m.color
  }]}>{m.value}</Text>
                  </View>
                ))}
              </View>
            </View>
          </FadeInView>

          {/* ── Gender Split ──────────────────────────────────── */}
          <FadeInView delay={340}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardDot, { backgroundColor: '#3B82F6' }]} />    
                <Text style={styles.cardTitle}>GENDER SPLIT</Text>
              </View>
              <HorizontalBar data={genderBars} />
              <View style={styles.genderRow}>
                {membersByGender.map(g => (
                  <View key={g.label} style={styles.genderItem}>
                    <Text style={[styles.genderVal, { color: g.color
  }]}>{g.value}</Text>
                    <Text style={styles.genderLabel}>{g.label.toUpperCase()}</Text>  
                    <Text style={styles.genderPct}>{Math.round((g.value / total) *   
  100)}%</Text>
                  </View>
                ))}
              </View>
            </View>
          </FadeInView>

          {/* ── Fitness Goals ─────────────────────────────────── */}
          <FadeInView delay={440}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardDot, { backgroundColor: '#A78BFA' }]} />    
                <Text style={styles.cardTitle}>FITNESS GOALS</Text>
              </View>
              <HorizontalBar data={membersByGoal} />
            </View>
          </FadeInView>

          {/* ── Quick Stats Row ───────────────────────────────── */}
          <FadeInView delay={520}>
            <Text style={styles.sectionLabel}>SNAPSHOT</Text>
            <View style={styles.snapshotRow}>
              <StatCard emoji="👥" label="Total"   value={String(total)}
  trend={13.0} />
              <StatCard emoji="✅" label="Active"  value={String(active.value)}      
  trend={8.2}  />
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
      borderWidth: 1, borderColor: Colors.accent + '20',
      overflow: 'hidden',
    },
    heroGlow: {
      position: 'absolute', top: -30, left: -20,
      width: 100, height: 100, borderRadius: 50,
      backgroundColor: Colors.accentGlow,
    },
    heroMicro:      { fontFamily: Fonts.medium, fontSize: 9, color: Colors.accent,   
  letterSpacing: 1.5 },
    heroTitle:      { fontFamily: Fonts.condensedBold, fontSize: 28, color:
  Colors.text, letterSpacing: 0.3 },
    heroSub:        { fontFamily: Fonts.regular, fontSize: 11, color:
  Colors.textMuted, marginTop: 2 },
    retentionWrap:  { alignItems: 'center', backgroundColor: Colors.green + '15',    
  borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1,      
  borderColor: Colors.green + '30' },
    retentionVal:   { fontFamily: Fonts.condensedBold, fontSize: 26, color:
  Colors.green },
    retentionLabel: { fontFamily: Fonts.bold, fontSize: 8, color: Colors.green,      
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

    sectionLabel: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted,    
  letterSpacing: 1.8, marginTop: 4 },

    // Card
    card: {
      backgroundColor: Colors.bgCard, borderRadius: 16,
      padding: 16, borderWidth: 1, borderColor: Colors.border, gap: 14,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    cardDot:    { width: 8, height: 8, borderRadius: 4 },
    cardTitle:  { fontFamily: Fonts.bold, fontSize: 11, color: Colors.text,
  letterSpacing: 0.8 },

    growthFooter:     { flexDirection: 'row', alignItems: 'center', gap: 6,
  marginTop: -6 },
    growthFooterText: { fontFamily: Fonts.regular, fontSize: 11, color:
  Colors.textMuted },

    // Status chips
    statusChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: -4 },  
    statusChip:  { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 
  20, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1 },
    statusDot:   { width: 6, height: 6, borderRadius: 3 },
    statusChipText: { fontFamily: Fonts.bold, fontSize: 9, letterSpacing: 0.5 },     
    statusChipVal:  { fontFamily: Fonts.condensedBold, fontSize: 13 },

    // Gender
    genderRow:   { flexDirection: 'row', gap: 8, marginTop: -4 },
    genderItem:  { flex: 1, alignItems: 'center', backgroundColor: Colors.bgElevated,
   borderRadius: 10, paddingVertical: 10, gap: 2 },
    genderVal:   { fontFamily: Fonts.condensedBold, fontSize: 22 },
    genderLabel: { fontFamily: Fonts.bold, fontSize: 8, color: Colors.textMuted,     
  letterSpacing: 0.8 },
    genderPct:   { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted  
  },

    snapshotRow: { flexDirection: 'row', gap: 10 },
  });