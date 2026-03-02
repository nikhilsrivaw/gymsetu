import { useState } from 'react';                                                  
  import { View, Text, StyleSheet, FlatList } from 'react-native';                   
  import { Checkbox, Searchbar } from 'react-native-paper';                          
  import { Stack } from 'expo-router';                                                 import { Colors } from '@/constants/colors';
  import { Fonts } from '@/constants/fonts';                                         
  import AnimatedPressable from '@/components/AnimatedPressable';                    
  import FadeInView from '@/components/FadeInView';

  const mockMembers: { id: string; name: string }[] = [
    { id: '1',  name: 'Rahul Sharma'    },
    { id: '2',  name: 'Priya Patel'     },
    { id: '3',  name: 'Arjun Reddy'     },
    { id: '4',  name: 'Sneha Gupta'     },
    { id: '7',  name: 'Neha Verma'      },
    { id: '8',  name: 'Rohan Das'       },
    { id: '10', name: 'Suresh Nair'     },
    { id: '11', name: 'Divya Menon'     },
    { id: '13', name: 'Pooja Rao'       },
    { id: '14', name: 'Karthik Iyer'    },
    { id: '15', name: 'Meera Deshmukh'  },
    { id: '16', name: 'Aditya Kulkarni' },
  ];

  export default function AttendanceScreen() {
    const today = new Date().toLocaleDateString('en-IN', {
      weekday: 'long', day: 'numeric', month: 'long',
    });
    const [search, setSearch] = useState('');
    const [marked, setMarked] = useState<Set<string>>(new Set());

    const filtered   = mockMembers.filter(m =>
      m.name.toLowerCase().includes(search.toLowerCase())
    );
    const total      = mockMembers.length;
    const present    = marked.size;
    const absent     = total - present;
    const pct        = total > 0 ? Math.round((present / total) * 100) : 0;
    const allMarked  = filtered.length > 0 && marked.size === filtered.length;       

    const toggle = (id: string) =>
      setMarked(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) :        
  n.add(id); return n; });

    const toggleAll = () =>
      setMarked(allMarked ? new Set() : new Set(filtered.map(m => m.id)));

    return (
      <>
        <Stack.Screen options={{ title: 'Attendance' }} />
        <View style={styles.container}>

          {/* ── Hero ─────────────────────────────────── */}
          <FadeInView delay={0}>
            <View style={styles.hero}>
              <View style={styles.heroGlow} />

              {/* left: date + breakdown */}
              <View style={styles.heroLeft}>
                <Text style={styles.heroMicro}>TODAY</Text>
                <Text style={styles.heroDate}>{today}</Text>

                <View style={styles.breakdown}>
                  <View style={styles.breakdownItem}>
                    <View style={[styles.breakdownDot, { backgroundColor:
  Colors.green }]} />
                    <Text style={styles.breakdownVal}>{present}</Text>
                    <Text style={styles.breakdownLabel}>PRESENT</Text>
                  </View>
                  <View style={styles.breakdownDivider} />
                  <View style={styles.breakdownItem}>
                    <View style={[styles.breakdownDot, { backgroundColor: Colors.red 
  }]} />
                    <Text style={styles.breakdownVal}>{absent}</Text>
                    <Text style={styles.breakdownLabel}>ABSENT</Text>
                  </View>
                </View>
              </View>

              {/* right: big ring */}
              <View style={styles.ringWrap}>
                <View style={styles.ringOuter}>
                  <View style={styles.ringInner}>
                    <Text style={styles.ringVal}>{present}</Text>
                    <Text style={styles.ringTotal}>/{total}</Text>
                  </View>
                </View>
                <Text style={styles.ringPct}>{pct}%</Text>
              </View>
            </View>

            {/* Progress bar */}
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${pct}%` as any }]} />    
            </View>
          </FadeInView>

          {/* ── Search ───────────────────────────────── */}
          <FadeInView delay={80}>
            <Searchbar
              placeholder="Search members..."
              value={search}
              onChangeText={setSearch}
              style={styles.searchbar}
              inputStyle={{ color: Colors.text, fontSize: 14, fontFamily:
  Fonts.regular }}
              iconColor={Colors.textMuted}
              placeholderTextColor={Colors.textMuted}
              theme={{ colors: { onSurfaceVariant: Colors.textMuted } }}
            />
          </FadeInView>

          {/* ── Bulk toggle ──────────────────────────── */}
          <FadeInView delay={120}>
            <AnimatedPressable style={styles.bulkRow} onPress={toggleAll}
  scaleDown={0.98}>
              <View style={[styles.bulkCheck, allMarked && styles.bulkCheckActive]}> 
                {allMarked && <Text style={styles.bulkCheckMark}>✓</Text>}
              </View>
              <Text style={styles.bulkText}>
                {allMarked ? 'UNMARK ALL' : 'MARK ALL PRESENT'}
              </Text>
              <Text style={styles.bulkCount}>{filtered.length} members</Text>        
            </AnimatedPressable>
          </FadeInView>

          {/* ── Member list ──────────────────────────── */}
          <FlatList
            data={filtered}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
            renderItem={({ item, index }) => {
              const isPresent = marked.has(item.id);
              const initials  = item.name.split(' ').map(n => n[0]).join('').slice(0,
   2).toUpperCase();
              return (
                <FadeInView delay={index * 30}>
                  <AnimatedPressable
                    style={[styles.memberRow, isPresent && styles.memberRowPresent]} 
                    onPress={() => toggle(item.id)}
                    scaleDown={0.98}
                  >
                    <View style={[styles.memberBar, { backgroundColor: isPresent ?   
  Colors.green : Colors.border }]} />

                    <View style={[styles.memberAvatar, isPresent &&
  styles.memberAvatarPresent]}>
                      <Text style={[styles.memberInitials, isPresent &&
  styles.memberInitialsPresent]}>
                        {initials}
                      </Text>
                    </View>

                    <Text style={[styles.memberName, isPresent &&
  styles.memberNamePresent]}>
                      {item.name}
                    </Text>

                    {isPresent
                      ? <View style={styles.presentBadge}><Text
  style={styles.presentBadgeText}>✓ PRESENT</Text></View>
                      : <View style={styles.absentBadge}><Text
  style={styles.absentBadgeText}>ABSENT</Text></View>
                    }
                  </AnimatedPressable>
                </FadeInView>
              );
            }}
          />

          {/* ── Save button ──────────────────────────── */}
          {marked.size > 0 && (
            <View style={styles.saveWrap}>
              <AnimatedPressable style={styles.saveBtn} scaleDown={0.97}>
                <Text style={styles.saveBtnText}>💾  SAVE ATTENDANCE</Text>
                <View style={styles.saveBadge}>
                  <Text style={styles.saveBadgeText}>{marked.size}</Text>
                </View>
              </AnimatedPressable>
            </View>
          )}
        </View>
      </>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },

    // Hero
    hero: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',   
      margin: 16, marginBottom: 0,
      backgroundColor: Colors.bgCard, borderRadius: 20, padding: 20,
      borderWidth: 1, borderColor: Colors.accent + '25', overflow: 'hidden',
    },
    heroGlow: {
      position: 'absolute', top: -30, left: -20,
      width: 120, height: 120, borderRadius: 60,
      backgroundColor: Colors.accentGlow,
    },
    heroLeft:  { flex: 1, gap: 12 },
    heroMicro: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.accent,
  letterSpacing: 2 },
    heroDate:  { fontFamily: Fonts.bold, fontSize: 15, color: Colors.text },
    breakdown: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    breakdownItem:   { alignItems: 'center', gap: 3 },
    breakdownDot:    { width: 7, height: 7, borderRadius: 4 },
    breakdownVal:    { fontFamily: Fonts.condensedBold, fontSize: 22, color:
  Colors.text },
    breakdownLabel:  { fontFamily: Fonts.bold, fontSize: 8, color: Colors.textMuted, 
  letterSpacing: 1 },
    breakdownDivider:{ width: 1, height: 28, backgroundColor: Colors.border },       

    // Ring
    ringWrap:  { alignItems: 'center', gap: 4 },
    ringOuter: {
      width: 76, height: 76, borderRadius: 38,
      backgroundColor: Colors.accentMuted,
      borderWidth: 3, borderColor: Colors.accent + '50',
      justifyContent: 'center', alignItems: 'center',
    },
    ringInner: { flexDirection: 'row', alignItems: 'baseline' },
    ringVal:   { fontFamily: Fonts.condensedBold, fontSize: 26, color: Colors.accent 
  },
    ringTotal: { fontFamily: Fonts.medium, fontSize: 13, color: Colors.textMuted },  
    ringPct:   { fontFamily: Fonts.bold, fontSize: 10, color: Colors.accent,
  letterSpacing: 1 },

    // Progress bar
    progressTrack: {
      height: 3, backgroundColor: Colors.border,
      marginHorizontal: 16, marginTop: 12, marginBottom: 10, borderRadius: 2,        
    },
    progressFill: { height: 3, backgroundColor: Colors.green, borderRadius: 2 },     

    // Search
    searchbar: {
      marginHorizontal: 16, marginBottom: 4,
      backgroundColor: Colors.bgCard, borderRadius: 14,
      elevation: 0, borderWidth: 1, borderColor: Colors.border, height: 46,
    },

    // Bulk
    bulkRow: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      marginHorizontal: 16, marginVertical: 6,
      backgroundColor: Colors.bgCard, borderRadius: 12,
      paddingHorizontal: 14, paddingVertical: 11,
      borderWidth: 1, borderColor: Colors.border,
    },
    bulkCheck: {
      width: 22, height: 22, borderRadius: 6,
      borderWidth: 1.5, borderColor: Colors.textMuted,
      justifyContent: 'center', alignItems: 'center',
    },
    bulkCheckActive: { backgroundColor: Colors.accent, borderColor: Colors.accent }, 
    bulkCheckMark:   { fontFamily: Fonts.bold, fontSize: 12, color: '#FFF' },        
    bulkText:  { flex: 1, fontFamily: Fonts.bold, fontSize: 10, color: Colors.text,  
  letterSpacing: 1 },
    bulkCount: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted }, 

    // List
    list: { paddingHorizontal: 16, paddingTop: 4, gap: 5, paddingBottom: 100 },      
    memberRow: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: Colors.bgCard, borderRadius: 12,
      borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', minHeight: 54, 
    },
    memberRowPresent: { borderColor: Colors.green + '40', backgroundColor:
  Colors.green + '06' },
    memberBar:        { width: 3, alignSelf: 'stretch' },
    memberAvatar: {
      width: 34, height: 34, borderRadius: 17,
      backgroundColor: Colors.bgElevated,
      justifyContent: 'center', alignItems: 'center',
      marginHorizontal: 10,
    },
    memberAvatarPresent: { backgroundColor: Colors.green + '20' },
    memberInitials:        { fontFamily: Fonts.bold, fontSize: 11, color:
  Colors.textMuted },
    memberInitialsPresent: { color: Colors.green },
    memberName:        { flex: 1, fontFamily: Fonts.medium, fontSize: 14, color:     
  Colors.textSub },
    memberNamePresent: { fontFamily: Fonts.bold, color: Colors.text },

    presentBadge: {
      backgroundColor: Colors.greenMuted, borderRadius: 8,
      paddingHorizontal: 9, paddingVertical: 4, marginRight: 10,
    },
    presentBadgeText: { fontFamily: Fonts.bold, fontSize: 8, color: Colors.green,    
  letterSpacing: 0.8 },
    absentBadge: {
      backgroundColor: Colors.bgElevated, borderRadius: 8,
      paddingHorizontal: 9, paddingVertical: 4, marginRight: 10,
      borderWidth: 1, borderColor: Colors.border,
    },
    absentBadgeText: { fontFamily: Fonts.bold, fontSize: 8, color: Colors.textMuted, 
  letterSpacing: 0.8 },

    // Save
    saveWrap: { position: 'absolute', bottom: 20, left: 16, right: 16 },
    saveBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      backgroundColor: Colors.green, borderRadius: 16,
      paddingVertical: 16, gap: 10,
    },
    saveBtnText: { fontFamily: Fonts.bold, fontSize: 13, color: '#000',
  letterSpacing: 1.2 },
    saveBadge: {
      backgroundColor: 'rgba(0,0,0,0.2)', width: 26, height: 26,
      borderRadius: 13, justifyContent: 'center', alignItems: 'center',
    },
    saveBadgeText: { fontFamily: Fonts.condensedBold, fontSize: 14, color: '#000' }, 
  });