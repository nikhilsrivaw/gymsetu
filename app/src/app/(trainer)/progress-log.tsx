 import { useState } from 'react';                                  import { View, Text, StyleSheet, ScrollView, TextInput, Alert }    from 'react-native';                                               import { MaterialCommunityIcons } from '@expo/vector-icons';     
  import { Colors } from '@/constants/colors';                       import FadeInView from '@/components/FadeInView';                
  import AnimatedPressable from '@/components/AnimatedPressable';                                                                     
  interface ProgressEntry {                                        
    id: number;
    member: string;
    emoji: string;
    date: string;
    weight: string;
    note: string;
    mood: '😃' | '😊' | '😐' | '😕';
    tags: string[];
  }

  const initialLogs: ProgressEntry[] = [
    {
      id: 1, member: 'Amit Singh', emoji: '💪', date: 'Feb 28, 2026',
      weight: '81.5 kg', note: 'Increased bench press to 80kg. Excellent form. Ready to progress to next phase.',mood: '😃', tags: ['Strength Gain', 'PR Set'],
    },
    {
      id: 2, member: 'Priya Nair', emoji: '🏃', date: 'Feb 28,2026',
      weight: '63.2 kg', note: 'Lost 4.8kg total this month! Cardioendurance has improved significantly.',mood: '😃', tags: ['Weight Loss', 'Goal Reached'],
    },
    {
      id: 3, member: 'Rahul Mehta', emoji: '🎯', date: 'Feb 27, 2026',
      weight: '79.1 kg', note: 'Missed 3 sessions this week. Need to discuss consistency. Technique is improving.',mood: '😐', tags: ['Consistency Issue'],
    },
    {
      id: 4, member: 'Sneha Patel', emoji: '🧘', date: 'Feb 26,2026',
      weight: '58.0 kg', note: 'Flexibility has improved a lot. Hi mobility now excellent. Progressing to advanced poses.',  mood: '😊', tags: ['Flexibility', 'Progress'],
    },
    {
      id: 5, member: 'Vikram Rao', emoji: '🏋️', date: 'Feb 25, 2026',
      weight: '88.0 kg', note: 'Deadlift hit 120kg today. Solid progress on compound lifts overall.', mood: '😃', tags: ['Strength Gain', 'PR Set'],
    },
  ];

  const members = [
    { name: 'Amit Singh', emoji: '💪' },
    { name: 'Priya Nair', emoji: '🏃' },
    { name: 'Rahul Mehta', emoji: '🎯' },
    { name: 'Sneha Patel', emoji: '🧘' },
    { name: 'Vikram Rao', emoji: '🏋️' },
    { name: 'Meena Joshi', emoji: '🚴' },
    { name: 'Arjun Sharma', emoji: '💥' },
    { name: 'Kavita Desai', emoji: '🌟' },
  ];

  const moodOptions: Array<'😃' | '😊' | '😐' | '😕'> = ['😃',     
  '😊', '😐', '😕'];
  const tagOptions = ['Strength Gain', 'Weight Loss', 'PR Set',    
  'Goal Reached', 'Consistency Issue', 'Injury', 'Progress',       
  'Flexibility'];

  const tagColors: Record<string, string> = {
    'Strength Gain': Colors.accent,
    'Weight Loss': Colors.orange,
    'PR Set': Colors.green,
    'Goal Reached': Colors.green,
    'Consistency Issue': Colors.red,
    'Injury': Colors.red,
    'Progress': Colors.accent,
    'Flexibility': '#8B5CF6',
  };

  export default function ProgressLogScreen() {
    const [logs, setLogs] = useState<ProgressEntry[]>(initialLogs);
    const [showForm, setShowForm] = useState(false);
    const [selectedMember, setSelectedMember] = useState('');      
    const [weight, setWeight] = useState('');
    const [note, setNote] = useState('');
    const [mood, setMood] = useState<'😃' | '😊' | '😐' |
  '😕'>('😊');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [filterMember, setFilterMember] = useState('All');       

    const toggleTag = (tag: string) => {
      setSelectedTags(prev =>
        prev.includes(tag) ? prev.filter(t => t !== tag) :
  [...prev, tag]
      );
    };

    const handleSubmit = () => {
      if (!selectedMember || !note.trim()) {
        Alert.alert('Missing Info', 'Please select a member and add a note.');
        return;
      }
      const memberData = members.find(m => m.name ===
  selectedMember);
      const newLog: ProgressEntry = {
        id: Date.now(),
        member: selectedMember,
        emoji: memberData?.emoji ?? '👤',
        date: new Date().toLocaleDateString('en-IN', { day:        
  'numeric', month: 'short', year: 'numeric' }),
        weight: weight ? `${weight} kg` : 'Not recorded',
        note: note.trim(),
        mood,
        tags: selectedTags,
      };
      setLogs(prev => [newLog, ...prev]);
      setShowForm(false);
      setSelectedMember('');
      setWeight('');
      setNote('');
      setMood('😊');
      setSelectedTags([]);
      Alert.alert('✅ Logged!', `Progress entry saved for
  ${selectedMember}.`);
    };

    const filteredLogs = filterMember === 'All'
      ? logs
      : logs.filter(l => l.member === filterMember);

    return (
      <ScrollView style={styles.container}
  contentContainerStyle={styles.content}
  keyboardShouldPersistTaps="handled">

        {/* Stats */}
        <FadeInView delay={0}>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statEmoji}>📝</Text>
              <Text style={styles.statVal}>{logs.length}</Text>    
              <Text style={styles.statLabel}>Total Logs</Text>     
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statEmoji}>😃</Text>
              <Text style={[styles.statVal, { color: Colors.green  
  }]}>
                {logs.filter(l => l.mood === '😃' || l.mood ===    
  '😊').length}
              </Text>
              <Text style={styles.statLabel}>Positive</Text>       
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statEmoji}>🏆</Text>
              <Text style={[styles.statVal, { color: Colors.accent 
  }]}>
                {logs.filter(l => l.tags.includes('PR Set') ||     
  l.tags.includes('Goal Reached')).length}
              </Text>
              <Text style={styles.statLabel}>Milestones</Text>     
            </View>
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
              name={showForm ? 'close-circle-outline' :
  'plus-circle-outline'}
              size={22}
              color={Colors.accent}
            />
            <Text style={styles.addBtnText}>{showForm ? 'Cancel' : 
  'Log New Progress Entry'}</Text>
          </AnimatedPressable>
        </FadeInView>

        {/* Log Form */}
        {showForm && (
          <FadeInView delay={0}>
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>📝 New Progress       
  Entry</Text>

              {/* Member Selector */}
              <Text style={styles.fieldLabel}>Select Member</Text> 
              <ScrollView horizontal
  showsHorizontalScrollIndicator={false}
  contentContainerStyle={styles.memberRow}>
                {members.map(m => (
                  <AnimatedPressable
                    key={m.name}
                    style={[styles.memberChip, selectedMember ===  
  m.name && styles.memberChipActive]}
                    scaleDown={0.92}
                    onPress={() => setSelectedMember(m.name)}      
                  >
                    <Text
  style={styles.memberChipEmoji}>{m.emoji}</Text>
                    <Text style={[styles.memberChipText,
  selectedMember === m.name && { color: Colors.accent }]}>
                      {m.name.split(' ')[0]}
                    </Text>
                  </AnimatedPressable>
                ))}
              </ScrollView>

              {/* Weight */}
              <Text style={styles.fieldLabel}>⚖️ Weight (kg) —     
  optional</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 78.5"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
                value={weight}
                onChangeText={setWeight}
              />

              {/* Mood */}
              <Text style={styles.fieldLabel}>😊 Session
  Mood</Text>
              <View style={styles.moodRow}>
                {moodOptions.map(m => (
                  <AnimatedPressable
                    key={m}
                    style={[styles.moodBtn, mood === m &&
  styles.moodBtnActive]}
                    scaleDown={0.85}
                    onPress={() => setMood(m)}
                  >
                    <Text style={styles.moodEmoji}>{m}</Text>      
                  </AnimatedPressable>
                ))}
              </View>

              {/* Tags */}
              <Text style={styles.fieldLabel}>🏷️ Tags</Text>       
              <View style={styles.tagsGrid}>
                {tagOptions.map(tag => {
                  const selected = selectedTags.includes(tag);     
                  return (
                    <AnimatedPressable
                      key={tag}
                      style={[styles.tagChip, selected && {        
  backgroundColor: (tagColors[tag] ?? Colors.accent) + '20',       
  borderColor: tagColors[tag] ?? Colors.accent }]}
                      scaleDown={0.92}
                      onPress={() => toggleTag(tag)}
                    >
                      <Text style={[styles.tagText, selected && {  
  color: tagColors[tag] ?? Colors.accent, fontWeight: '700' }]}>   
                        {tag}
                      </Text>
                    </AnimatedPressable>
                  );
                })}
              </View>

              {/* Note */}
              <Text style={styles.fieldLabel}>📝 Progress
  Notes</Text>
              <TextInput
                style={styles.noteInput}
                placeholder="Describe today's session,
  improvements, concerns..."
                placeholderTextColor={Colors.textMuted}
                value={note}
                onChangeText={setNote}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              {/* Submit */}
              <AnimatedPressable style={styles.submitBtn}
  scaleDown={0.97} onPress={handleSubmit}>
                <Text style={styles.submitBtnText}>💾 Save Progress
   Entry</Text>
              </AnimatedPressable>
            </View>
          </FadeInView>
        )}

        {/* Filter */}
        <FadeInView delay={100}>
          <ScrollView horizontal
  showsHorizontalScrollIndicator={false}
  contentContainerStyle={styles.filterRow}>
            {['All', ...members.map(m => m.name.split(' ')[0])].map(f => (
              <AnimatedPressable
                key={f}
                style={[styles.filterChip,
  filterMember.startsWith(f) && styles.filterChipActive]}
                scaleDown={0.93}
                onPress={() => setFilterMember(f === 'All' ? 'All' 
  : members.find(m => m.name.startsWith(f))?.name ?? 'All')}       
              >
                <Text style={[styles.filterText,
  filterMember.startsWith(f) &&
  styles.filterTextActive]}>{f}</Text>
              </AnimatedPressable>
            ))}
          </ScrollView>
        </FadeInView>

        {/* Logs List */}
        <Text style={styles.logsCount}>{filteredLogs.length}       
  entr{filteredLogs.length !== 1 ? 'ies' : 'y'}</Text>

        {filteredLogs.map((log, i) => (
          <FadeInView key={log.id} delay={140 + i * 55}>
            <View style={styles.logCard}>
              <View style={styles.logHeader}>
                <View style={styles.logAvatar}>
                  <Text style={styles.logEmoji}>{log.emoji}</Text> 
                </View>
                <View style={{ flex: 1 }}>
                  <Text
  style={styles.logMember}>{log.member}</Text>
                  <Text style={styles.logDate}>{log.date}</Text>   
                </View>
                <Text style={styles.logMood}>{log.mood}</Text>     
                <Text style={styles.logWeight}>{log.weight}</Text> 
              </View>

              {/* Tags */}
              {log.tags.length > 0 && (
                <View style={styles.tagsRow}>
                  {log.tags.map(tag => (
                    <View key={tag} style={[styles.logTag, {       
  backgroundColor: (tagColors[tag] ?? Colors.accent) + '20' }]}>   
                      <Text style={[styles.logTagText, { color:    
  tagColors[tag] ?? Colors.accent }]}>{tag}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Note */}
              <Text style={styles.logNote}>{log.note}</Text>       
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
      paddingVertical: 14, borderWidth: 1, borderColor:
  Colors.border,
    },
    statEmoji: { fontSize: 20 },
    statVal: { fontSize: 20, fontWeight: '700', color: Colors.text 
  },
    statLabel: { fontSize: 10, color: Colors.textMuted },

    addBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent:  
  'center', gap: 10,
      paddingVertical: 14, borderRadius: 14, borderWidth: 1,       
      borderColor: Colors.accent + '50', borderStyle: 'dashed',    
      backgroundColor: Colors.accentMuted,
    },
    addBtnText: { fontSize: 15, fontWeight: '600', color:
  Colors.accent },

    formCard: {
      backgroundColor: Colors.bgCard, borderRadius: 16, padding:   
  16,
      borderWidth: 1, borderColor: Colors.accent + '30', gap: 12,  
    },
    formTitle: { fontSize: 16, fontWeight: '700', color:
  Colors.text },
    fieldLabel: { fontSize: 13, fontWeight: '600', color:
  Colors.textSub },

    memberRow: { gap: 8, paddingVertical: 2 },
    memberChip: {
      alignItems: 'center', gap: 4, paddingHorizontal: 12,
  paddingVertical: 8,
      borderRadius: 12, backgroundColor: Colors.bgElevated,        
      borderWidth: 1, borderColor: Colors.border,
    },
    memberChipActive: { backgroundColor: Colors.accentMuted,       
  borderColor: Colors.accent },
    memberChipEmoji: { fontSize: 18 },
    memberChipText: { fontSize: 11, fontWeight: '600', color:      
  Colors.textMuted },

    textInput: {
      backgroundColor: Colors.bgElevated, borderRadius: 10,        
  padding: 12,
      fontSize: 14, color: Colors.text, borderWidth: 1,
  borderColor: Colors.border,
    },

    moodRow: { flexDirection: 'row', gap: 12 },
    moodBtn: {
      width: 52, height: 52, borderRadius: 14,
      backgroundColor: Colors.bgElevated, justifyContent: 'center',
   alignItems: 'center',
      borderWidth: 1, borderColor: Colors.border,
    },
    moodBtnActive: { backgroundColor: Colors.accentMuted,
  borderColor: Colors.accent, borderWidth: 2 },
    moodEmoji: { fontSize: 26 },

    tagsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },  
    tagChip: {
      paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, 
      backgroundColor: Colors.bgElevated, borderWidth: 1,
  borderColor: Colors.border,
    },
    tagText: { fontSize: 12, fontWeight: '500', color:
  Colors.textMuted },

    noteInput: {
      backgroundColor: Colors.bgElevated, borderRadius: 12,        
  padding: 14,
      fontSize: 14, color: Colors.text, borderWidth: 1,
  borderColor: Colors.border,
      minHeight: 100,
    },

    submitBtn: { backgroundColor: Colors.accent, borderRadius: 12, 
  paddingVertical: 14, alignItems: 'center' },
    submitBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF'
   },

    filterRow: { gap: 8, paddingVertical: 2 },
    filterChip: {
      paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, 
      backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: 
  Colors.border,
    },
    filterChipActive: { backgroundColor: Colors.accent + '20',     
  borderColor: Colors.accent },
    filterText: { fontSize: 12, fontWeight: '500', color:
  Colors.textMuted },
    filterTextActive: { color: Colors.accent, fontWeight: '700' }, 

    logsCount: { fontSize: 13, color: Colors.textMuted, fontWeight:
   '500' },

    logCard: {
      backgroundColor: Colors.bgCard, borderRadius: 14, padding:   
  14,
      borderWidth: 1, borderColor: Colors.border, gap: 10,
    },
    logHeader: { flexDirection: 'row', alignItems: 'center', gap:  
  10 },
    logAvatar: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: Colors.bgElevated, justifyContent: 'center',
   alignItems: 'center',
    },
    logEmoji: { fontSize: 20 },
    logMember: { fontSize: 14, fontWeight: '700', color:
  Colors.text },
    logDate: { fontSize: 11, color: Colors.textMuted, marginTop: 1 
  },
    logMood: { fontSize: 22 },
    logWeight: { fontSize: 12, fontWeight: '600', color:
  Colors.accent },

    tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },   
    logTag: { borderRadius: 8, paddingHorizontal: 10,
  paddingVertical: 4 },
    logTagText: { fontSize: 11, fontWeight: '700' },

    logNote: { fontSize: 13, color: Colors.textSub, lineHeight: 20 
  },
  });
