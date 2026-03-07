 import { useState, useCallback } from 'react';                                     
  import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from
  'react-native';                                                                      import { useFocusEffect } from 'expo-router';  
  import { MaterialCommunityIcons } from '@expo/vector-icons';                       
  import { Colors } from '@/constants/colors';      
  import { Fonts } from '@/constants/fonts';
  import AnimatedPressable from '@/components/AnimatedPressable';
  import FadeInView from '@/components/FadeInView';
  import { supabase } from '@/lib/supabase';                                           import { useAuthStore } from '@/store/authStore';
  import type { Member } from '@/types/database';                                       
  type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];       

  const menuItems: { label: string; icon: IconName; color: string }[] = [
    { label: 'Edit Profile',          icon: 'account-edit-outline', color:
  Colors.accent  },
    { label: 'Change Password',       icon: 'lock-outline',         color:
  Colors.orange  },
    { label: 'Notification Settings', icon: 'bell-outline',         color: '#8B5CF6' 
       },
    { label: 'Privacy Policy',        icon: 'shield-outline',       color:
  Colors.green   },
    { label: 'Help & Support',        icon: 'help-circle-outline',  color: '#3B82F6' 
       },
  ];

  const achievements = [
    { title: 'First Check-in', emoji: '🎯', desc: 'Visited gym for the first time',  
  earned: true  },
    { title: '7-Day Streak',   emoji: '🔥', desc: '7 consecutive days at gym',       
  earned: true  },
    { title: 'Early Bird',     emoji: '🌅', desc: 'Check in before 6 AM',
  earned: true  },
    { title: 'Night Owl',      emoji: '🦉', desc: 'Check in after 9 PM',
  earned: true  },
    { title: 'Class Warrior',  emoji: '🥋', desc: 'Attend 10 group classes',
  earned: false },
    { title: '30-Day Streak',  emoji: '💎', desc: '30 consecutive days',
  earned: false },
    { title: 'Weight Goal',    emoji: '⚖️', desc: 'Reach your target weight',        
  earned: false },
    { title: 'Referral King',  emoji: '👑', desc: 'Refer 5 friends',
  earned: false },
  ];

  const goalLabel: Record<string, string> = {
    weight_loss: 'Weight Loss', muscle_gain: 'Muscle Gain',
    general_fitness: 'General Fitness', other: 'Other',
  };

  export default function ProfileScreen() {
    const { session, signOut } = useAuthStore();
    const [member, setMember]           = useState<Member | null>(null);
    const [totalVisits, setTotalVisits] = useState(0);
    const [streak, setStreak]           = useState(0);
    const [daysLeft, setDaysLeft]       = useState(0);
    const [planName, setPlanName]       = useState('');
    const [loading, setLoading]         = useState(true);

    useFocusEffect(useCallback(() => {
      let active = true;
      async function load() {
        if (!session?.user?.id) { setLoading(false); return; }
        setLoading(true);

        const { data: m } = await supabase
          .from('members')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (!m || !active) { setLoading(false); return; }
        setMember(m);

        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

        const [totalRes, streakRes, planRes] = await Promise.all([
          supabase
            .from('attendance')
            .select('id', { count: 'exact', head: true })
            .eq('member_id', m.id),
          supabase
            .from('attendance')
            .select('check_in_date')
            .eq('member_id', m.id)
            .gte('check_in_date', sixtyDaysAgo.toISOString().split('T')[0])
            .order('check_in_date', { ascending: false }),
          supabase
            .from('member_plans')
            .select('end_date, membership_plans(name)')
            .eq('member_id', m.id)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        if (!active) return;

        setTotalVisits(totalRes.count ?? 0);

        const dateSet = new Set((streakRes.data ?? []).map((a: any) =>
  a.check_in_date));
        let s = 0;
        const d = new Date();
        while (dateSet.has(d.toISOString().split('T')[0])) { s++;
  d.setDate(d.getDate() - 1); }
        setStreak(s);

        if (planRes.data) {
          const end = new Date(planRes.data.end_date);
          setDaysLeft(Math.max(0, Math.ceil((end.getTime() - Date.now()) /
  86400000)));
          setPlanName((planRes.data.membership_plans as any)?.name ?? '');
        }

        setLoading(false);
      }
      load();
      return () => { active = false; };
    }, [session?.user?.id]));

    if (loading) {
      return (
        <View style={{ flex: 1, backgroundColor: Colors.bg, justifyContent: 'center',
   alignItems: 'center' }}>
          <ActivityIndicator color={Colors.accent} size="large" />
        </View>
      );
    }

    const bmi = member?.height_cm && member?.weight_kg
      ? (member.weight_kg / Math.pow(member.height_cm / 100, 2)).toFixed(1)
      : '—';

    const personalInfo = [
      { label: 'PHONE',        value: member?.phone ?? 'Not set',         emoji: '📞'
   },
      { label: 'EMAIL',        value: session?.user?.email ?? 'Not set',  emoji: '📧'
   },
      {
        label: 'DATE OF BIRTH',
        value: member?.date_of_birth
          ? new Date(member.date_of_birth).toLocaleDateString('en-IN', { day:        
  '2-digit', month: 'long', year: 'numeric' })
          : 'Not set',
        emoji: '🎂',
      },
      {
        label: 'MEMBER SINCE',
        value: member?.join_date
          ? new Date(member.join_date).toLocaleDateString('en-IN', { day: '2-digit', 
  month: 'short', year: 'numeric' })
          : 'Not set',
        emoji: '📅',
      },
    ];

    const earnedCount = achievements.filter(a => a.earned).length;

    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <FadeInView delay={0}>
          <View style={styles.heroCard}>
            <View style={styles.avatarOuter}>
              <View style={styles.avatarInner}>
                <Text style={styles.avatarEmoji}>🧑‍💼</Text>
              </View>
            </View>
            <Text style={styles.memberName}>{member?.full_name ?? ''}</Text>
            <Text style={styles.memberPlan}>{planName || (member?.goal ?
  goalLabel[member.goal] ?? '' : '')}</Text>
            <View style={styles.expiryChip}>
              <Text style={styles.expiryNum}>{daysLeft}</Text>
              <Text style={styles.expiryLabel}> DAYS LEFT</Text>
            </View>
          </View>
        </FadeInView>

        {/* Stats */}
        <FadeInView delay={80}>
          <View style={styles.statsRow}>
            {[
              { label: 'VISITED',  value: String(totalVisits), emoji: '📅' },        
              { label: 'STREAK',   value: String(streak),      emoji: '🔥' },        
              { label: 'CLASSES',  value: '—',                 emoji: '🧘' },        
              { label: 'WORKOUTS', value: '—',                 emoji: '💪' },        
            ].map(s => (
              <View key={s.label} style={styles.statBox}>
                <Text style={styles.statEmoji}>{s.emoji}</Text>
                <Text style={styles.statVal}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </FadeInView>

        {/* Personal Info */}
        <FadeInView delay={160}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>PERSONAL INFO</Text>
            {personalInfo.map((item, i) => (
              <View key={item.label} style={[styles.infoRow, i < personalInfo.length 
  - 1 && styles.infoRowBorder]}>
                <Text style={styles.infoEmoji}>{item.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>{item.label}</Text>
                  <Text style={styles.infoValue}>{item.value}</Text>
                </View>
              </View>
            ))}
          </View>
        </FadeInView>

        {/* Fitness Profile */}
        <FadeInView delay={240}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>FITNESS PROFILE</Text>
            <View style={styles.fitnessGrid}>
              {[
                { emoji: '📏', val: member?.height_cm ? String(member.height_cm) :   
  '—', unit: 'cm',  label: 'HEIGHT' },
                { emoji: '⚖️', val: member?.weight_kg ? String(member.weight_kg) :   
  '—',  unit: 'kg',  label: 'WEIGHT' },
                { emoji: '🎯', val: bmi,
       unit: 'bmi', label: 'BMI'    },
                { emoji: '🏆', val: member?.goal ? (goalLabel[member.goal]?.split(' ')[0] ?? '—') : '—', unit: member?.goal ? 'goal' : '', label: 'GOAL' },
              ].map(f => (
                <View key={f.label} style={styles.fitnessBox}>
                  <Text style={styles.fitnessEmoji}>{f.emoji}</Text>
                  <View style={styles.fitnessValRow}>
                    <Text style={styles.fitnessVal}>{f.val}</Text>
                    <Text style={styles.fitnessUnit}>{f.unit}</Text>
                  </View>
                  <Text style={styles.fitnessLabel}>{f.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </FadeInView>

        {/* Achievements */}
        <FadeInView delay={320}>
          <View style={styles.card}>
            <View style={styles.achieveHeader}>
              <Text style={styles.cardTitle}>ACHIEVEMENTS</Text>
              <View style={styles.achieveBadge}>
                <Text style={styles.achieveBadgeNum}>{earnedCount}</Text>
                <Text style={styles.achieveBadgeOf}>/{achievements.length}</Text>    
              </View>
            </View>
            <View style={styles.achieveGrid}>
              {achievements.map(a => (
                <View key={a.title} style={[styles.achieveItem, !a.earned &&
  styles.achieveItemLocked]}>
                  <Text style={[styles.achieveEmoji, !a.earned && { opacity: 0.3 }]}>
                    {a.earned ? a.emoji : '🔒'}
                  </Text>
                  <Text style={[styles.achieveTitle, !a.earned &&
  styles.achieveTitleLocked]}>
                    {a.title}
                  </Text>
                  <Text style={styles.achieveDesc}>{a.desc}</Text>
                </View>
              ))}
            </View>
          </View>
        </FadeInView>

        {/* Account Settings */}
        <FadeInView delay={400}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>ACCOUNT SETTINGS</Text>
            {menuItems.map((item, i) => (
              <AnimatedPressable
                key={item.label}
                style={[styles.menuRow, i < menuItems.length - 1 &&
  styles.menuRowBorder]}
                scaleDown={0.97}
                onPress={() => Alert.alert(item.label, 'Coming soon!')}
              >
                <View style={[styles.menuIcon, { backgroundColor: item.color + '18'  
  }]}>
                  <MaterialCommunityIcons name={item.icon} size={18}
  color={item.color} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <MaterialCommunityIcons name="chevron-right" size={18}
  color={Colors.textMuted} />
              </AnimatedPressable>
            ))}
          </View>
        </FadeInView>

        {/* Logout */}
        <FadeInView delay={480}>
          <AnimatedPressable
            style={styles.logoutBtn}
            scaleDown={0.97}
            onPress={() =>
              Alert.alert('Log Out', 'Are you sure you want to log out?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Log Out', style: 'destructive', onPress: signOut },
              ])
            }
          >
            <Text style={styles.logoutText}>LOG OUT</Text>
          </AnimatedPressable>
        </FadeInView>

        <Text style={styles.version}>GYMSETU v1.0.0</Text>
        <View style={{ height: 24 }} />
      </ScrollView>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    content: { padding: 16, gap: 12 },

    heroCard: { backgroundColor: Colors.bgCard, borderRadius: 20, padding: 24,       
  alignItems: 'center', gap: 8, borderWidth: 1, borderColor: Colors.accent + '30' }, 
    avatarOuter: { width: 92, height: 92, borderRadius: 46, borderWidth: 2,
  borderColor: Colors.accent, justifyContent: 'center', alignItems: 'center',        
  marginBottom: 4 },
    avatarInner: { width: 78, height: 78, borderRadius: 39, backgroundColor:
  Colors.bgElevated, justifyContent: 'center', alignItems: 'center' },
    avatarEmoji: { fontSize: 36 },
    memberName: { fontSize: 22, fontFamily: Fonts.condensedBold, color: Colors.text, 
  letterSpacing: 0.5 },
    memberPlan: { fontSize: 12, fontFamily: Fonts.regular, color: Colors.textMuted },
    expiryChip: { flexDirection: 'row', alignItems: 'baseline', backgroundColor:     
  Colors.accentMuted, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5,   
  borderWidth: 1, borderColor: Colors.accent + '30' },
    expiryNum: { fontSize: 18, fontFamily: Fonts.condensedBold, color: Colors.accent 
  },
    expiryLabel: { fontSize: 10, fontFamily: Fonts.bold, color: Colors.accent,       
  letterSpacing: 1 },

    statsRow: { flexDirection: 'row', gap: 8 },
    statBox: { flex: 1, alignItems: 'center', gap: 3, backgroundColor: Colors.bgCard,
   borderRadius: 12, paddingVertical: 12, borderWidth: 1, borderColor: Colors.border 
  },
    statEmoji: { fontSize: 16 },
    statVal: { fontSize: 20, fontFamily: Fonts.condensedBold, color: Colors.text },  
    statLabel: { fontSize: 8, fontFamily: Fonts.bold, color: Colors.textMuted,       
  letterSpacing: 1 },

    card: { backgroundColor: Colors.bgCard, borderRadius: 16, padding: 16,
  borderWidth: 1, borderColor: Colors.border, gap: 12 },
    cardTitle: { fontSize: 11, fontFamily: Fonts.bold, color: Colors.accent,
  letterSpacing: 1.5 },

    infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10,
  paddingVertical: 8 },
    infoRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },       
    infoEmoji: { fontSize: 16, marginTop: 12 },
    infoLabel: { fontSize: 9, fontFamily: Fonts.bold, color: Colors.textMuted,       
  letterSpacing: 1.3 },
    infoValue: { fontSize: 14, fontFamily: Fonts.medium, color: Colors.text,
  marginTop: 2 },

    fitnessGrid: { flexDirection: 'row', gap: 8 },
    fitnessBox: { flex: 1, alignItems: 'center', gap: 3, backgroundColor:
  Colors.bgElevated, borderRadius: 12, paddingVertical: 12 },
    fitnessEmoji: { fontSize: 18 },
    fitnessValRow: { flexDirection: 'row', alignItems: 'baseline', gap: 1 },
    fitnessVal: { fontSize: 16, fontFamily: Fonts.condensedBold, color: Colors.text  
  },
    fitnessUnit: { fontSize: 9, fontFamily: Fonts.bold, color: Colors.textMuted },   
    fitnessLabel: { fontSize: 8, fontFamily: Fonts.bold, color: Colors.textMuted,    
  letterSpacing: 1 },

    achieveHeader: { flexDirection: 'row', justifyContent: 'space-between',
  alignItems: 'center' },
    achieveBadge: { flexDirection: 'row', alignItems: 'baseline', backgroundColor:   
  Colors.accentMuted, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,    
  borderWidth: 1, borderColor: Colors.accent + '30' },
    achieveBadgeNum: { fontSize: 16, fontFamily: Fonts.condensedBold, color:
  Colors.accent },
    achieveBadgeOf: { fontSize: 11, fontFamily: Fonts.regular, color: Colors.accent  
  },
    achieveGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    achieveItem: { width: '22%', minWidth: 74, alignItems: 'center', gap: 4,
  backgroundColor: Colors.accentMuted, borderRadius: 12, paddingVertical: 12,        
  paddingHorizontal: 4, borderWidth: 1, borderColor: Colors.accent + '30' },
    achieveItemLocked: { backgroundColor: Colors.bgElevated, borderColor:
  Colors.border, opacity: 0.45 },
    achieveEmoji: { fontSize: 24 },
    achieveTitle: { fontSize: 9, fontFamily: Fonts.bold, color: Colors.text,
  textAlign: 'center', letterSpacing: 0.3 },
    achieveTitleLocked: { color: Colors.textMuted },
    achieveDesc: { fontSize: 8, fontFamily: Fonts.regular, color: Colors.textMuted,  
  textAlign: 'center', lineHeight: 12 },

    menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 
  10 },
    menuRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },       
    menuIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center',   
  alignItems: 'center' },
    menuLabel: { flex: 1, fontSize: 14, fontFamily: Fonts.medium, color: Colors.text 
  },

    logoutBtn: { alignItems: 'center', paddingVertical: 14, borderRadius: 12,        
  backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.red + '40' },  
    logoutText: { fontSize: 13, fontFamily: Fonts.bold, color: Colors.red,
  letterSpacing: 1.5 },

    version: { textAlign: 'center', fontFamily: Fonts.bold, color: Colors.textMuted, 
  fontSize: 10, letterSpacing: 2, marginTop: 4 },
  });
