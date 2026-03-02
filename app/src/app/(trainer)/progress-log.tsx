import { useState } from 'react';                                                    import { View, Text, StyleSheet, ScrollView, TextInput, Alert } from                 'react-native';                                                                      import { MaterialCommunityIcons } from '@expo/vector-icons';                       
  import { Colors } from '@/constants/colors';                                         import { Fonts } from '@/constants/fonts';                                         
  import FadeInView from '@/components/FadeInView';                                    import AnimatedPressable from '@/components/AnimatedPressable';                    
                                                                                       interface ProgressEntry {                                                              id: number;                                                                      
    member: string;                                                                  
    emoji: string;                                                                 
    date: string;                                                                    
    weight: string;
    note: string;
    mood: '😃' | '😊' | '😐' | '😕';
    tags: string[];
  }

  const initialLogs: ProgressEntry[] = [
    { id: 1, member: 'Amit Singh',   emoji: '💪', date: 'Feb 28, 2026', weight: '81.5kg', note: 'Increased bench press to 80kg. Excellent form. Ready to progress to next phase.', mood: '😃', tags: ['Strength Gain', 'PR Set'] },
    { id: 2, member: 'Priya Nair',   emoji: '🏃', date: 'Feb 28, 2026', weight: '63.kg', note: 'Lost 4.8kg total this month! Cardio endurance has improved significantly.',       mood: '😃', tags: ['Weight Loss', 'Goal Reached'] },        
    { id: 3, member: 'Rahul Mehta',  emoji: '🎯', date: 'Feb 27, 2026', weight: '79.1kg', note: 'Missed 3 sessions this week. Need to discuss consistency. Technique isimproving.', mood: '😐', tags: ['Consistency Issue'] },
    { id: 4, member: 'Sneha Patel',  emoji: '🧘', date: 'Feb 26, 2026', weight: '58.0 kg', note: 'Flexibility has improved a lot. Hip mobility now excellent. Progressing to advanced poses.', mood: '😊', tags: ['Flexibility', 'Progress'] },  
    { id: 5, member: 'Vikram Rao',   emoji: '🏋️', date: 'Feb 25, 2026', weight: '88.0kg', note: 'Deadlift hit 120kg today. Solid progress on compound lifts overall.',  mood: '😃', tags: ['Strength Gain', 'PR Set'] },
  ];

  const members = [
    { name: 'Amit Singh',   emoji: '💪' },
    { name: 'Priya Nair',   emoji: '🏃' },
    { name: 'Rahul Mehta',  emoji: '🎯' },
    { name: 'Sneha Patel',  emoji: '🧘' },
    { name: 'Vikram Rao',   emoji: '🏋️' },
    { name: 'Meena Joshi',  emoji: '🚴' },
    { name: 'Arjun Sharma', emoji: '💥' },
    { name: 'Kavita Desai', emoji: '🌟' },
  ];

  const moodOptions: Array<'😃' | '😊' | '😐' | '😕'> = ['😃', '😊', '😐', '😕'];    

  const tagOptions = ['Strength Gain', 'Weight Loss', 'PR Set', 'Goal Reached',      
  'Consistency Issue', 'Injury', 'Progress', 'Flexibility'];

  const tagColors: Record<string, string> = {
    'Strength Gain':    Colors.accent,
    'Weight Loss':      Colors.orange,
    'PR Set':           Colors.green,
    'Goal Reached':     Colors.green,
    'Consistency Issue':Colors.red,
    'Injury':           Colors.red,
    'Progress':         Colors.accent,
    'Flexibility':      '#8B5CF6',
  };

  export default function ProgressLogScreen() {
    const [logs, setLogs] = useState<ProgressEntry[]>(initialLogs);
    const [showForm, setShowForm] = useState(false);
    const [selectedMember, setSelectedMember] = useState('');
    const [weight, setWeight] = useState('');
    const [note, setNote] = useState('');
    const [mood, setMood] = useState<'😃' | '😊' | '😐' | '😕'>('😊');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [filterMember, setFilterMember] = useState('All');

    const toggleTag = (tag: string) => {
      setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) :     
  [...prev, tag]);
    };

    const handleSubmit = () => {
      if (!selectedMember || !note.trim()) {
        Alert.alert('Missing Info', 'Please select a member and add a note.');       
        return;
      }
      const memberData = members.find(m => m.name === selectedMember);
      const newLog: ProgressEntry = {
        id: Date.now(),
        member: selectedMember,
        emoji: memberData?.emoji ?? '👤',
        date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month:        
  'short', year: 'numeric' }),
        weight: weight ? `${weight} kg` : 'Not recorded',
        note: note.trim(),
        mood,
        tags: selectedTags,
      };
      setLogs(prev => [newLog, ...prev]);
      setShowForm(false);
      setSelectedMember(''); setWeight(''); setNote(''); setMood('😊');
  setSelectedTags([]);
      Alert.alert('Logged!', `Progress entry saved for ${selectedMember}.`);
    };

    const filteredLogs = filterMember === 'All' ? logs : logs.filter(l => l.member   
  === filterMember);

    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Stats */}
        <FadeInView delay={0}>
          <View style={styles.statsRow}>
            {[
              { emoji: '📝', val: logs.length,
                                label: 'TOTAL LOGS',  color: Colors.text },
              { emoji: '😃', val: logs.filter(l => l.mood === '😃' || l.mood ===     
  '😊').length,                    label: 'POSITIVE',    color: Colors.green },      
              { emoji: '🏆', val: logs.filter(l => l.tags.includes('PR Set') ||      
  l.tags.includes('Goal Reached')).length, label: 'MILESTONES', color: Colors.accent 
  },
            ].map(s => (
              <View key={s.label} style={styles.statBox}>
                <Text style={styles.statEmoji}>{s.emoji}</Text>
                <Text style={[styles.statVal, { color: s.color }]}>{s.val}</Text>    
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </FadeInView>

        {/* Add Log Button */}
        <FadeInView delay={60}>
          <AnimatedPressable
            style={styles.addBtn}
            scaleDown={0.97}
            onPress={() => setShowForm(!showForm)}
          >
            <MaterialCommunityIcons
              name={showForm ? 'close-circle-outline' : 'plus-circle-outline'}       
              size={20}
              color={Colors.accent}
            />
            <Text style={styles.addBtnText}>{showForm ? 'CANCEL' : 'LOG NEW PROGRESS ENTRY'}</Text>
          </AnimatedPressable>
        </FadeInView>

        {/* Form */}
        {showForm && (
          <FadeInView delay={0}>
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>NEW PROGRESS ENTRY</Text>

              <Text style={styles.fieldLabel}>SELECT MEMBER</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}
  contentContainerStyle={styles.memberRow}>
                {members.map(m => (
                  <AnimatedPressable
                    key={m.name}
                    style={[styles.memberChip, selectedMember === m.name &&
  styles.memberChipActive]}
                    scaleDown={0.92}
                    onPress={() => setSelectedMember(m.name)}
                  >
                    <Text style={styles.memberChipEmoji}>{m.emoji}</Text>
                    <Text style={[styles.memberChipText, selectedMember === m.name &&
   { color: Colors.accent }]}>
                      {m.name.split(' ')[0]}
                    </Text>
                  </AnimatedPressable>
                ))}
              </ScrollView>

              <Text style={styles.fieldLabel}>WEIGHT (KG) — OPTIONAL</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 78.5"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
                value={weight}
                onChangeText={setWeight}
              />

              <Text style={styles.fieldLabel}>SESSION MOOD</Text>
              <View style={styles.moodRow}>
                {moodOptions.map(m => (
                  <AnimatedPressable
                    key={m}
                    style={[styles.moodBtn, mood === m && styles.moodBtnActive]}     
                    scaleDown={0.85}
                    onPress={() => setMood(m)}
                  >
                    <Text style={styles.moodEmoji}>{m}</Text>
                  </AnimatedPressable>
                ))}
              </View>

              <Text style={styles.fieldLabel}>TAGS</Text>
              <View style={styles.tagsGrid}>
                {tagOptions.map(tag => {
                  const selected = selectedTags.includes(tag);
                  const tc = tagColors[tag] ?? Colors.accent;
                  return (
                    <AnimatedPressable
                      key={tag}
                      style={[styles.tagChip, selected && { backgroundColor: tc +    
  '18', borderColor: tc }]}
                      scaleDown={0.92}
                      onPress={() => toggleTag(tag)}
                    >
                      {selected && <View style={[styles.tagDot, { backgroundColor: tc
   }]} />}
                      <Text style={[styles.tagText, selected && { color: tc,
  fontFamily: Fonts.bold }]}>{tag}</Text>
                    </AnimatedPressable>
                  );
                })}
              </View>

              <Text style={styles.fieldLabel}>PROGRESS NOTES</Text>
              <TextInput
                style={styles.noteInput}
                placeholder="Describe today's session, improvements, concerns..."    
                placeholderTextColor={Colors.textMuted}
                value={note}
                onChangeText={setNote}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <AnimatedPressable style={styles.submitBtn} scaleDown={0.97}
  onPress={handleSubmit}>
                <Text style={styles.submitBtnText}>SAVE PROGRESS ENTRY</Text>        
              </AnimatedPressable>
            </View>
          </FadeInView>
        )}

        {/* Filter */}
        <FadeInView delay={100}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
  contentContainerStyle={styles.filterRow}>
            {['All', ...members.map(m => m.name.split(' ')[0])].map(f => (
              <AnimatedPressable
                key={f}
                style={[styles.filterChip, filterMember.startsWith(f) &&
  styles.filterChipActive]}
                scaleDown={0.93}
                onPress={() => setFilterMember(f === 'All' ? 'All' : members.find(m  => m.name.startsWith(f))?.name ?? 'All')}
              >
                <Text style={[styles.filterText, filterMember.startsWith(f) &&       
  styles.filterTextActive]}>
                  {f.toUpperCase()}
                </Text>
              </AnimatedPressable>
            ))}
          </ScrollView>
        </FadeInView>

        <Text style={styles.logsCount}>{filteredLogs.length} ENTR{filteredLogs.length
   !== 1 ? 'IES' : 'Y'}</Text>

        {/* Log Cards */}
        {filteredLogs.map((log, i) => (
          <FadeInView key={log.id} delay={140 + i * 55}>
            <View style={styles.logCard}>
              <View style={styles.logAccentBar} />
              <View style={styles.logInner}>
                <View style={styles.logHeader}>
                  <View style={styles.logAvatar}>
                    <Text style={styles.logEmoji}>{log.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.logMember}>{log.member}</Text>
                    <Text style={styles.logDate}>{log.date}</Text>
                  </View>
                  <Text style={styles.logMood}>{log.mood}</Text>
                  <View style={styles.logWeightChip}>
                    <Text style={styles.logWeight}>{log.weight}</Text>
                  </View>
                </View>

                {log.tags.length > 0 && (
                  <View style={styles.tagsRow}>
                    {log.tags.map(tag => {
                      const tc = tagColors[tag] ?? Colors.accent;
                      return (
                        <View key={tag} style={[styles.logTag, { backgroundColor: tc 
  + '18' }]}>
                          <Text style={[styles.logTagText, { color: tc
  }]}>{tag}</Text>
                        </View>
                      );
                    })}
                  </View>
                )}

                <Text style={styles.logNote}>{log.note}</Text>
              </View>
            </View>
          </FadeInView>
        ))}

        <View style={{ height: 24 }} />
      </ScrollView>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    content: { padding: 16, gap: 12 },

    statsRow: { flexDirection: 'row', gap: 8 },
    statBox: {
      flex: 1, alignItems: 'center', gap: 4,
      backgroundColor: Colors.bgCard, borderRadius: 12,
      paddingVertical: 14, borderWidth: 1, borderColor: Colors.border,
    },
    statEmoji: { fontSize: 18 },
    statVal: { fontSize: 22, fontFamily: Fonts.condensedBold },
    statLabel: { fontSize: 8, fontFamily: Fonts.bold, color: Colors.textMuted,       
  letterSpacing: 1, textAlign: 'center' },

    addBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, 
      paddingVertical: 14, borderRadius: 14, borderWidth: 1,
      borderColor: Colors.accent + '50', borderStyle: 'dashed', backgroundColor:     
  Colors.accentMuted,
    },
    addBtnText: { fontSize: 12, fontFamily: Fonts.bold, color: Colors.accent,        
  letterSpacing: 1.2 },

    formCard: {
      backgroundColor: Colors.bgCard, borderRadius: 16, padding: 16,
      borderWidth: 1, borderColor: Colors.accent + '30', gap: 12,
    },
    formTitle: { fontSize: 11, fontFamily: Fonts.bold, color: Colors.accent,
  letterSpacing: 1.5 },
    fieldLabel: { fontSize: 9, fontFamily: Fonts.bold, color: Colors.textMuted,      
  letterSpacing: 1.3 },

    memberRow: { gap: 8, paddingVertical: 2 },
    memberChip: {
      alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8,       
      borderRadius: 12, backgroundColor: Colors.bgElevated, borderWidth: 1,
  borderColor: Colors.border,
    },
    memberChipActive: { backgroundColor: Colors.accentMuted, borderColor:
  Colors.accent },
    memberChipEmoji: { fontSize: 18 },
    memberChipText: { fontSize: 10, fontFamily: Fonts.bold, color: Colors.textMuted, 
  letterSpacing: 0.5 },

    textInput: {
      backgroundColor: Colors.bgElevated, borderRadius: 10, padding: 12,
      fontSize: 14, fontFamily: Fonts.regular, color: Colors.text,
      borderWidth: 1, borderColor: Colors.border,
    },

    moodRow: { flexDirection: 'row', gap: 12 },
    moodBtn: {
      width: 52, height: 52, borderRadius: 14,
      backgroundColor: Colors.bgElevated, justifyContent: 'center', alignItems:      
  'center',
      borderWidth: 1, borderColor: Colors.border,
    },
    moodBtnActive: { backgroundColor: Colors.accentMuted, borderColor: Colors.accent,
   borderWidth: 2 },
    moodEmoji: { fontSize: 26 },

    tagsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    tagChip: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      paddingHorizontal: 11, paddingVertical: 6, borderRadius: 20,
      backgroundColor: Colors.bgElevated, borderWidth: 1, borderColor: Colors.border,
    },
    tagDot: { width: 5, height: 5, borderRadius: 3 },
    tagText: { fontSize: 11, fontFamily: Fonts.medium, color: Colors.textMuted },    

    noteInput: {
      backgroundColor: Colors.bgElevated, borderRadius: 12, padding: 14,
      fontSize: 14, fontFamily: Fonts.regular, color: Colors.text,
      borderWidth: 1, borderColor: Colors.border, minHeight: 100,
    },

    submitBtn: { backgroundColor: Colors.accent, borderRadius: 12, paddingVertical:  
  13, alignItems: 'center' },
    submitBtnText: { fontSize: 12, fontFamily: Fonts.bold, color: '#FFF',
  letterSpacing: 1.3 },

    filterRow: { gap: 8, paddingVertical: 2 },
    filterChip: {
      paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
      backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,    
    },
    filterChipActive: { backgroundColor: Colors.accentMuted, borderColor:
  Colors.accent },
    filterText: { fontSize: 10, fontFamily: Fonts.bold, color: Colors.textMuted,     
  letterSpacing: 1 },
    filterTextActive: { color: Colors.accent },

    logsCount: { fontSize: 10, fontFamily: Fonts.bold, color: Colors.textMuted,      
  letterSpacing: 1.5 },

    logCard: {
      flexDirection: 'row',
      backgroundColor: Colors.bgCard, borderRadius: 14,
      borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
    },
    logAccentBar: { width: 3, backgroundColor: Colors.accent },
    logInner: { flex: 1, padding: 14, gap: 9 },
    logHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    logAvatar: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: Colors.bgElevated, justifyContent: 'center', alignItems:      
  'center',
    },
    logEmoji: { fontSize: 20 },
    logMember: { fontSize: 14, fontFamily: Fonts.bold, color: Colors.text },
    logDate: { fontSize: 10, fontFamily: Fonts.regular, color: Colors.textMuted,     
  marginTop: 1 },
    logMood: { fontSize: 22 },
    logWeightChip: { backgroundColor: Colors.accentMuted, borderRadius: 7,
  paddingHorizontal: 8, paddingVertical: 4 },
    logWeight: { fontSize: 11, fontFamily: Fonts.bold, color: Colors.accent },       

    tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    logTag: { borderRadius: 7, paddingHorizontal: 9, paddingVertical: 4 },
    logTagText: { fontSize: 10, fontFamily: Fonts.bold, letterSpacing: 0.5 },        

    logNote: { fontSize: 13, fontFamily: Fonts.regular, color: Colors.textSub,       
  lineHeight: 20 },
  });
