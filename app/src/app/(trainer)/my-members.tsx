                                                                    import { useState } from 'react';                                  import { View, Text, StyleSheet, ScrollView, TextInput,            TouchableOpacity } from 'react-native';                          
  import { useRouter } from 'expo-router';                           import { MaterialCommunityIcons } from '@expo/vector-icons';     
  import { Colors } from '@/constants/colors';                       import { Fonts } from '@/constants/fonts';                       
  import FadeInView from '@/components/FadeInView';                
  import AnimatedPressable from '@/components/AnimatedPressable';  

  interface Member {
    id: number;
    name: string;
    goal: string;
    plan: string;
    daysLeft: number;
    attendance: number;
    lastSeen: string;
    emoji: string;
    status: 'active' | 'inactive' | 'expiring';
    progress: number;
  }

  const members: Member[] = [
    { id: 1, name: 'Amit Singh',   goal: 'Muscle Gain',    plan:   
  'Premium 3M',    daysLeft: 22, attendance: 26, lastSeen: 'Today',
       emoji: '💪', status: 'active',   progress: 75 },
    { id: 2, name: 'Priya Nair',   goal: 'Weight Loss',    plan:   
  'Standard 3M',   daysLeft: 14, attendance: 24, lastSeen: 'Today',
       emoji: '🏃', status: 'expiring', progress: 90 },
    { id: 3, name: 'Rahul Mehta',  goal: 'Weight Loss',    plan:   
  'Premium 3M',    daysLeft: 18, attendance: 14, lastSeen:
  'Yesterday', emoji: '🎯', status: 'active',   progress: 45 },    
    { id: 4, name: 'Sneha Patel',  goal: 'Flexibility',    plan:   
  'Basic Monthly', daysLeft: 5,  attendance: 12, lastSeen: '2 days ago',emoji: '🧘', status: 'expiring', progress: 60 },
    { id: 5, name: 'Vikram Rao',   goal: 'Muscle Gain',    plan:   
  'Annual Gold',   daysLeft: 180,attendance: 20, lastSeen: 'Today',
       emoji: '🏋️', status: 'active',   progress: 55 },
    { id: 6, name: 'Meena Joshi',  goal: 'Cardio Fitness', plan:   
  'Standard 3M',   daysLeft: 45, attendance: 8,  lastSeen: '5 days ago',emoji: '🚴', status: 'inactive', progress: 30 },
    { id: 7, name: 'Arjun Sharma', goal: 'Muscle Gain',    plan:   
  'Premium 3M',    daysLeft: 60, attendance: 22, lastSeen: 'Today',
       emoji: '💥', status: 'active',   progress: 80 },
    { id: 8, name: 'Kavita Desai', goal: 'Weight Loss',    plan: 'Basic Monthly', daysLeft: 8,  attendance: 10, lastSeen: '3 days ago',emoji: '🌟', status: 'expiring', progress: 40 },
  ];

  const filterOptions = ['All', 'Active', 'Expiring', 'Inactive']; 

  const statusColor: Record<string, string> = {
    active: Colors.green,
    expiring: Colors.orange,
    inactive: Colors.red,
  };

  const statusLabel: Record<string, string> = {
    active: 'ACTIVE',
    expiring: 'EXPIRING',
    inactive: 'INACTIVE',
  };

  export default function MyMembersScreen() {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('All');

    const filtered = members.filter(m => {
      const matchSearch =
        m.name.toLowerCase().includes(search.toLowerCase()) ||     
        m.goal.toLowerCase().includes(search.toLowerCase());       
      const matchFilter = filter === 'All' || m.status ===
  filter.toLowerCase();
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
                          label: 'TOTAL',    color: Colors.text }, 
              { emoji: '✅', val: members.filter(m => m.status === 
  'active').length,   label: 'ACTIVE',   color: Colors.green },    
              { emoji: '⚠️', val: members.filter(m => m.status === 
  'expiring').length, label: 'EXPIRING', color: Colors.orange },   
              { emoji: '😴', val: members.filter(m => m.status === 
  'inactive').length, label: 'INACTIVE', color: Colors.red },      
            ].map(s => (
              <View key={s.label} style={styles.summaryCard}>      
                <Text style={styles.summaryEmoji}>{s.emoji}</Text> 
                <Text style={[styles.summaryVal, { color: s.color  
  }]}>{s.val}</Text>
                <Text style={styles.summaryLabel}>{s.label}</Text> 
              </View>
            ))}
          </View>
        </FadeInView>

        {/* Search */}
        <FadeInView delay={60}>
          <View style={styles.searchBox}>
            <MaterialCommunityIcons name="magnify" size={20}       
  color={Colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or goal..."
              placeholderTextColor={Colors.textMuted}
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>     
                <MaterialCommunityIcons name="close-circle"        
  size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </FadeInView>

        {/* Filter Chips */}
        <FadeInView delay={100}>
          <ScrollView horizontal
  showsHorizontalScrollIndicator={false}
  contentContainerStyle={styles.filterRow}>
            {filterOptions.map(f => (
              <AnimatedPressable
                key={f}
                style={[styles.filterChip, filter === f &&
  styles.filterChipActive]}
                scaleDown={0.93}
                onPress={() => setFilter(f)}
              >
                <Text style={[styles.filterText, filter === f &&   
  styles.filterTextActive]}>{f.toUpperCase()}</Text>
              </AnimatedPressable>
            ))}
          </ScrollView>
        </FadeInView>

        {/* Count */}
        <FadeInView delay={130}>
          <Text style={styles.resultCount}>{filtered.length}       
  MEMBER{filtered.length !== 1 ? 'S' : ''}</Text>
        </FadeInView>

        {/* Member Cards */}
        {filtered.map((m, i) => (
          <FadeInView key={m.id} delay={160 + i * 55}>
            <AnimatedPressable
              style={styles.memberCard}
              scaleDown={0.97}
              onPress={() => router.push({ pathname:
  '/(trainer)/member-detail', params: { id: m.id } } as any)}      
            >
              {/* Left status bar */}
              <View style={[styles.memberBar, { backgroundColor:   
  statusColor[m.status] }]} />

              <View style={styles.memberInner}>
                {/* Top Row */}
                <View style={styles.memberTop}>
                  <View style={styles.avatarCircle}>
                    <Text
  style={styles.memberEmoji}>{m.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.memberName}>{m.name}</Text>
                    <Text style={styles.memberGoal}>{m.goal} ·     
  {m.plan}</Text>
                  </View>
                  <View style={[styles.statusBadge, {
  backgroundColor: statusColor[m.status] + '18' }]}>
                    <Text style={[styles.statusText, { color:      
  statusColor[m.status] }]}>
                      {statusLabel[m.status]}
                    </Text>
                  </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressSection}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>GOAL        
  PROGRESS</Text>
                    <Text
  style={styles.progressVal}>{m.progress}%</Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, {
                      width: `${m.progress}%` as any,
                      backgroundColor: m.progress >= 70 ?
  Colors.green : m.progress >= 40 ? Colors.orange : Colors.red,    
                    }]} />
                  </View>
                </View>

                {/* Meta chips */}
                <View style={styles.memberBottom}>
                  <View style={styles.metaChip}>
                    <Text style={styles.metaText}>📅 {m.attendance}
   days/mo</Text>
                  </View>
                  <View style={styles.metaChip}>
                    <Text style={styles.metaText}>⏳ {m.daysLeft}d 
  left</Text>
                  </View>
                  <View style={styles.metaChip}>
                    <Text style={styles.metaText}>🕐
  {m.lastSeen}</Text>
                  </View>
                </View>
              </View>
            </AnimatedPressable>
          </FadeInView>
        ))}

        {/* Empty */}
        {filtered.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyText}>No members found</Text> 
            <Text style={styles.emptySub}>Try a different search or
   filter</Text>
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    content: { padding: 16, gap: 10 },

    summaryRow: { flexDirection: 'row', gap: 8 },
    summaryCard: {
      flex: 1, alignItems: 'center', gap: 3,
      backgroundColor: Colors.bgCard, borderRadius: 12,
      paddingVertical: 12, borderWidth: 1, borderColor:
  Colors.border,
    },
    summaryEmoji: { fontSize: 16 },
    summaryVal: { fontSize: 20, fontFamily: Fonts.condensedBold }, 
    summaryLabel: { fontSize: 8, fontFamily: Fonts.bold, color:    
  Colors.textMuted, letterSpacing: 1.2 },

    searchBox: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      backgroundColor: Colors.bgCard, borderRadius: 12, padding:   
  12,
      borderWidth: 1, borderColor: Colors.border,
    },
    searchInput: { flex: 1, fontSize: 14, fontFamily:
  Fonts.regular, color: Colors.text },

    filterRow: { gap: 8, paddingVertical: 2 },
    filterChip: {
      paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, 
      backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: 
  Colors.border,
    },
    filterChipActive: { backgroundColor: Colors.accentMuted,       
  borderColor: Colors.accent },
    filterText: { fontSize: 11, fontFamily: Fonts.bold, color:     
  Colors.textMuted, letterSpacing: 1 },
    filterTextActive: { color: Colors.accent },

    resultCount: { fontSize: 10, fontFamily: Fonts.bold, color:    
  Colors.textMuted, letterSpacing: 1.5 },

    memberCard: {
      flexDirection: 'row',
      backgroundColor: Colors.bgCard, borderRadius: 16,
      borderWidth: 1, borderColor: Colors.border,
      overflow: 'hidden',
    },
    memberBar: { width: 3 },
    memberInner: { flex: 1, padding: 14, gap: 10 },

    memberTop: { flexDirection: 'row', alignItems: 'center', gap:  
  12 },
    avatarCircle: {
      width: 46, height: 46, borderRadius: 23,
      backgroundColor: Colors.bgElevated,
      justifyContent: 'center', alignItems: 'center',
    },
    memberEmoji: { fontSize: 22 },
    memberName: { fontSize: 15, fontFamily: Fonts.bold, color:     
  Colors.text },
    memberGoal: { fontSize: 11, fontFamily: Fonts.regular, color:  
  Colors.textMuted, marginTop: 2 },
    statusBadge: { borderRadius: 8, paddingHorizontal: 8,
  paddingVertical: 4 },
    statusText: { fontSize: 9, fontFamily: Fonts.bold,
  letterSpacing: 1 },

    progressSection: { gap: 5 },
    progressHeader: { flexDirection: 'row', justifyContent:        
  'space-between' },
    progressLabel: { fontSize: 9, fontFamily: Fonts.bold, color:   
  Colors.textMuted, letterSpacing: 1.2 },
    progressVal: { fontSize: 11, fontFamily: Fonts.condensedBold,  
  color: Colors.text },
    progressTrack: { height: 5, backgroundColor: Colors.border,    
  borderRadius: 3, overflow: 'hidden' },
    progressFill: { height: 5, borderRadius: 3 },

    memberBottom: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' 
  },
    metaChip: {
      backgroundColor: Colors.bgElevated, borderRadius: 8,
      paddingHorizontal: 9, paddingVertical: 4,
    },
    metaText: { fontSize: 11, fontFamily: Fonts.medium, color:     
  Colors.textSub },

    emptyState: { alignItems: 'center', paddingVertical: 48, gap: 8
   },
    emptyEmoji: { fontSize: 44 },
    emptyText: { fontSize: 16, fontFamily: Fonts.bold, color:      
  Colors.text },
    emptySub: { fontSize: 13, fontFamily: Fonts.regular, color:    
  Colors.textMuted },
  });
