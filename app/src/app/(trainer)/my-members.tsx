 import { useState, useCallback } from 'react';                                       import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,            ActivityIndicator } from 'react-native';                                             import { useRouter, useFocusEffect } from 'expo-router';                             import { MaterialCommunityIcons } from '@expo/vector-icons';                         import { Colors } from '@/constants/colors';                                         import { Fonts } from '@/constants/fonts';                                           import FadeInView from '@/components/FadeInView';                                  
  import AnimatedPressable from '@/components/AnimatedPressable';                      import { supabase } from '@/lib/supabase';                                         
  import { useAuthStore } from '@/store/authStore';                                                                                                                       
  interface MemberRow {                                                              
    id:        string;                                                               
    name:      string;
    goal:      string | null;
    plan:      string;
    daysLeft:  number;
    status:    'active' | 'expiring' | 'expired';
    initials:  string;
  }

  const filterOptions = ['All', 'Active', 'Expiring', 'Expired'];

  const statusColor: Record<string, string> = {
    active:   Colors.green,
    expiring: Colors.orange,
    expired:  Colors.red,
  };

  export default function MyMembersScreen() {
    const router          = useRouter();
    const { profile }     = useAuthStore();
    const [search, setSearch]   = useState('');
    const [filter, setFilter]   = useState('All');
    const [members, setMembers] = useState<MemberRow[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchMembers = useCallback(async () => {
      if (!profile?.gym_id) return;
      setLoading(true);

      const { data, error } = await supabase
        .from('members')
        .select(`
          id, full_name, goal, status,
          member_plans ( end_date, status, membership_plans ( name ) )
        `)
        .eq('gym_id', profile.gym_id)
        .order('full_name');

      if (!error && data) {
        const todayMs = new Date().setHours(0, 0, 0, 0);
        const rows: MemberRow[] = data.map((m: any) => {
          const activePlan = m.member_plans?.find((mp: any) => mp.status ===
  'active');
          const anyPlan    = m.member_plans?.[0];
          const plan       = activePlan ?? anyPlan;
          const daysLeft   = plan?.end_date
            ? Math.round((new Date(plan.end_date).getTime() - todayMs) / (1000 * 60 *
   60 * 24))
            : -1;
          const rowStatus: MemberRow['status'] =
            daysLeft < 0       ? 'expired'  :
            daysLeft <= 7      ? 'expiring' : 'active';
          const initials = m.full_name.split(' ').map((n: string) =>
  n[0]).join('').slice(0, 2).toUpperCase();
          return {
            id:       m.id,
            name:     m.full_name,
            goal:     m.goal,
            plan:     plan?.membership_plans?.name ?? 'No plan',
            daysLeft,
            status:   rowStatus,
            initials,
          };
        });
        setMembers(rows);
      }
      setLoading(false);
    }, [profile?.gym_id]);

    useFocusEffect(useCallback(() => { fetchMembers(); }, [fetchMembers]));

    const filtered = members.filter(m => {
      const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) ||     
                          (m.goal ??
  '').toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === 'All' || m.status === filter.toLowerCase();     
      return matchSearch && matchFilter;
    });

    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary */}
        <FadeInView delay={0}>
          <View style={styles.summaryRow}>
            {[
              { emoji: '👥', val: members.length,
  label: 'TOTAL',    color: Colors.text    },
              { emoji: '✅', val: members.filter(m => m.status === 'active').length, 
    label: 'ACTIVE',   color: Colors.green   },
              { emoji: '⚠️', val: members.filter(m => m.status ===
  'expiring').length, label: 'EXPIRING', color: Colors.orange  },
              { emoji: '❌', val: members.filter(m => m.status === 'expired').length,
    label: 'EXPIRED',  color: Colors.red     },
            ].map(s => (
              <View key={s.label} style={styles.summaryCard}>
                <Text style={styles.summaryEmoji}>{s.emoji}</Text>
                <Text style={[styles.summaryVal, { color: s.color }]}>{s.val}</Text> 
                <Text style={styles.summaryLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </FadeInView>

        {/* Search */}
        <FadeInView delay={60}>
          <View style={styles.searchBox}>
            <MaterialCommunityIcons name="magnify" size={20} color={Colors.textMuted}
   />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or goal..."
              placeholderTextColor={Colors.textMuted}
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <MaterialCommunityIcons name="close-circle" size={18}
  color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </FadeInView>

        {/* Filter Chips */}
        <FadeInView delay={100}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
  contentContainerStyle={styles.filterRow}>
            {filterOptions.map(f => (
              <AnimatedPressable
                key={f}
                style={[styles.filterChip, filter === f && styles.filterChipActive]} 
                scaleDown={0.93}
                onPress={() => setFilter(f)}
              >
                <Text style={[styles.filterText, filter === f &&
  styles.filterTextActive]}>
                  {f.toUpperCase()}
                </Text>
              </AnimatedPressable>
            ))}
          </ScrollView>
        </FadeInView>

        {/* Count */}
        <FadeInView delay={130}>
          <Text style={styles.resultCount}>
            {loading ? 'Loading...' : `${filtered.length} MEMBER${filtered.length !==
   1 ? 'S' : ''}`}
          </Text>
        </FadeInView>

        {/* Loading */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.accent} size="large" />
          </View>
        ) : (
          <>
            {filtered.map((m, i) => {
              const color = statusColor[m.status];
              return (
                <FadeInView key={m.id} delay={160 + i * 55}>
                  <AnimatedPressable
                    style={styles.memberCard}
                    scaleDown={0.97}
                    onPress={() => router.push({ pathname:
  '/(trainer)/member-detail', params: { id: m.id } } as any)}
                  >
                    <View style={[styles.memberBar, { backgroundColor: color }]} />  
                    <View style={styles.memberInner}>
                      <View style={styles.memberTop}>
                        <View style={[styles.avatarCircle, { borderColor: color +    
  '50' }]}>
                          <Text style={[styles.initials, { color
  }]}>{m.initials}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.memberName}>{m.name}</Text>
                          <Text style={styles.memberGoal}>{m.goal ?? 'No goal set'} ·
   {m.plan}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: color + 
  '18' }]}>
                          <Text style={[styles.statusText, { color
  }]}>{m.status.toUpperCase()}</Text>
                        </View>
                      </View>
                      <View style={styles.memberBottom}>
                        <View style={styles.metaChip}>
                          <Text style={styles.metaText}>
                            {m.daysLeft >= 0 ? `⏳ ${m.daysLeft}d left` : `❌        
  ${Math.abs(m.daysLeft)}d ago`}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </AnimatedPressable>
                </FadeInView>
              );
            })}

            {filtered.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🔍</Text>
                <Text style={styles.emptyText}>No members found</Text>
                <Text style={styles.emptySub}>Try a different search or filter</Text>
              </View>
            )}
          </>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    content:   { padding: 16, gap: 10 },
    center:    { paddingTop: 60, alignItems: 'center' },

    summaryRow:   { flexDirection: 'row', gap: 8 },
    summaryCard:  { flex: 1, alignItems: 'center', gap: 3, backgroundColor:
  Colors.bgCard, borderRadius: 12, paddingVertical: 12, borderWidth: 1, borderColor: 
  Colors.border },
    summaryEmoji: { fontSize: 16 },
    summaryVal:   { fontSize: 20, fontFamily: Fonts.condensedBold },
    summaryLabel: { fontSize: 8, fontFamily: Fonts.bold, color: Colors.textMuted,    
  letterSpacing: 1.2 },

    searchBox:   { flexDirection: 'row', alignItems: 'center', gap: 10,
  backgroundColor: Colors.bgCard, borderRadius: 12, padding: 12, borderWidth: 1,     
  borderColor: Colors.border },
    searchInput: { flex: 1, fontSize: 14, fontFamily: Fonts.regular, color:
  Colors.text },

    filterRow:       { gap: 8, paddingVertical: 2 },
    filterChip:      { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,  
  backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border },      
    filterChipActive:{ backgroundColor: Colors.accentMuted, borderColor:
  Colors.accent },
    filterText:      { fontSize: 11, fontFamily: Fonts.bold, color: Colors.textMuted,
   letterSpacing: 1 },
    filterTextActive:{ color: Colors.accent },

    resultCount: { fontSize: 10, fontFamily: Fonts.bold, color: Colors.textMuted,    
  letterSpacing: 1.5 },

    memberCard:  { flexDirection: 'row', backgroundColor: Colors.bgCard,
  borderRadius: 16, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
    memberBar:   { width: 3 },
    memberInner: { flex: 1, padding: 14, gap: 10 },
    memberTop:   { flexDirection: 'row', alignItems: 'center', gap: 12 },

    avatarCircle: { width: 46, height: 46, borderRadius: 23, backgroundColor:        
  Colors.bgElevated, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5
   },
    initials:     { fontSize: 16, fontFamily: Fonts.condensedBold },
    memberName:   { fontSize: 15, fontFamily: Fonts.bold,    color: Colors.text },   
    memberGoal:   { fontSize: 11, fontFamily: Fonts.regular, color: Colors.textMuted,
   marginTop: 2 },
    statusBadge:  { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },     
    statusText:   { fontSize: 9, fontFamily: Fonts.bold, letterSpacing: 1 },

    memberBottom: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
    metaChip:     { backgroundColor: Colors.bgElevated, borderRadius: 8,
  paddingHorizontal: 9, paddingVertical: 4 },
    metaText:     { fontSize: 11, fontFamily: Fonts.medium, color: Colors.textMuted  
  },

    emptyState: { alignItems: 'center', paddingVertical: 48, gap: 8 },
    emptyEmoji: { fontSize: 44 },
    emptyText:  { fontSize: 16, fontFamily: Fonts.bold,    color: Colors.text },     
    emptySub:   { fontSize: 13, fontFamily: Fonts.regular, color: Colors.textMuted },
  });
