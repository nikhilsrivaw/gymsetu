 import { useState } from 'react';                                  import { View, Text, StyleSheet, ScrollView, Alert, Share } from 
  'react-native';                                                    import { Stack } from 'expo-router';                             
  import { Colors } from '@/constants/colors';                     
  import AnimatedPressable from '@/components/AnimatedPressable';  
  import FadeInView from '@/components/FadeInView';

  const referralCode = 'RAHUL2024';

  const referralHistory = [
    { id: 1, name: 'Suresh Patel', date: 'Jan 15, 2026', status:   
  'Joined', reward: '₹200', emoji: '✅' },
    { id: 2, name: 'Meena Joshi', date: 'Dec 20, 2025', status:    
  'Joined', reward: '₹200', emoji: '✅' },
    { id: 3, name: 'Karan Mehta', date: 'Feb 10, 2026', status:    
  'Pending', reward: '—', emoji: '⏳' },
  ];

  const rewards = [
    { milestone: '1 referral', reward: '₹200 off next renewal',    
  emoji: '🎁', achieved: true },
    { milestone: '3 referrals', reward: '₹500 off next renewal',   
  emoji: '🏅', achieved: false },
    { milestone: '5 referrals', reward: '1 month free!', emoji:    
  '🏆', achieved: false },
  ];

  const totalEarned = referralHistory
    .filter(r => r.status === 'Joined')
    .reduce((a, r) => a + parseInt(r.reward.replace('₹',
  '').replace('—', '0') || '0'), 0);

  export default function ReferFriendScreen() {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
      setCopied(true);
      Alert.alert('✅ Copied!', `Referral code ${referralCode}     
  copied to clipboard.`);
      setTimeout(() => setCopied(false), 3000);
    };

    const handleShare = async () => {
      try {
        await Share.share({
          message: `Hey! Join me at FitZone Gym & Fitness 💪\n\nUse
   my referral code: *${referralCode}*\n\nGet ₹200 off your first  
  membership! 🎁\n\nCall: +91 98765 43210`,
          title: 'Join FitZone Gym!',
        });
      } catch {
        Alert.alert('Error', 'Could not share at this time.');     
      }
    };

    const joinedCount = referralHistory.filter(r => r.status ===   
  'Joined').length;

    return (
      <>
        <Stack.Screen options={{ title: '🎁 Refer a Friend' }} />  
        <ScrollView style={styles.container}
  contentContainerStyle={styles.content}
  showsVerticalScrollIndicator={false}>

          {/* Hero */}
          <FadeInView delay={0}>
            <View style={styles.heroCard}>
              <Text style={styles.heroEmoji}>🎁</Text>
              <Text style={styles.heroTitle}>Refer & Earn!</Text>  
              <Text style={styles.heroSub}>Invite friends to       
  FitZone and earn rewards for every successful referral</Text>    
              <View style={styles.heroStats}>
                <View style={styles.heroStat}>
                  <Text
  style={styles.heroStatVal}>{joinedCount}</Text>
                  <Text
  style={styles.heroStatLabel}>Referred</Text>
                </View>
                <View style={styles.heroStatDivider} />
                <View style={styles.heroStat}>
                  <Text
  style={styles.heroStatVal}>₹{totalEarned}</Text>
                  <Text style={styles.heroStatLabel}>Earned</Text> 
                </View>
                <View style={styles.heroStatDivider} />
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatVal}>₹200</Text>     
                  <Text style={styles.heroStatLabel}>Per
  Referral</Text>
                </View>
              </View>
            </View>
          </FadeInView>

          {/* Referral Code */}
          <FadeInView delay={80}>
            <View style={styles.codeCard}>
              <Text style={styles.codeLabel}>Your Referral
  Code</Text>
              <View style={styles.codeBox}>
                <Text style={styles.codeText}>{referralCode}</Text>
                <AnimatedPressable
                  style={[styles.copyBtn, copied && {
  backgroundColor: Colors.green }]}
                  scaleDown={0.9}
                  onPress={handleCopy}
                >
                  <Text style={styles.copyBtnText}>{copied ? '✓ Copied' : '📋 Copy'}</Text>
                </AnimatedPressable>
              </View>
              <AnimatedPressable style={styles.shareBtn}
  scaleDown={0.97} onPress={handleShare}>
                <Text style={styles.shareBtnText}>📤 Share with    
  Friends</Text>
              </AnimatedPressable>
            </View>
          </FadeInView>

          {/* How It Works */}
          <FadeInView delay={160}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>ℹ️ How It Works</Text>
              {[
                { step: '1', emoji: '📤', text: 'Share your  referral code with a friend' },
                { step: '2', emoji: '🏋️', text: 'Friend joins FitZone using your code' },
                { step: '3', emoji: '💰', text: 'You both get ₹200  off your next renewal' },
                { step: '4', emoji: '🏆', text: 'Earn bigger  rewards with more referrals!' },
              ].map(s => (
                <View key={s.step} style={styles.stepRow}>
                  <View style={styles.stepCircle}>
                    <Text style={styles.stepNum}>{s.step}</Text>   
                  </View>
                  <Text style={styles.stepEmoji}>{s.emoji}</Text>  
                  <Text style={styles.stepText}>{s.text}</Text>    
                </View>
              ))}
            </View>
          </FadeInView>

          {/* Reward Milestones */}
          <FadeInView delay={240}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🏆 Reward
  Milestones</Text>
              {rewards.map(r => (
                <View key={r.milestone}
  style={[styles.milestoneRow, r.achieved &&
  styles.milestoneAchieved]}>
                  <Text
  style={styles.milestoneEmoji}>{r.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.milestoneName, r.achieved 
  && { color: Colors.green }]}>{r.milestone}</Text>
                    <Text
  style={styles.milestoneReward}>{r.reward}</Text>
                  </View>
                  {r.achieved ? (
                    <View style={styles.achievedBadge}>
                      <Text style={styles.achievedText}>✓
  Done</Text>
                    </View>
                  ) : (
                    <View style={styles.pendingBadge}>
                      <Text
  style={styles.pendingText}>{joinedCount}/{parseInt(r.milestone)} 
  done</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </FadeInView>

          {/* Referral History */}
          <FadeInView delay={320}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>📜 Referral
  History</Text>
              {referralHistory.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyEmoji}>🤷</Text>        
                  <Text style={styles.emptyText}>No referrals yet. 
  Share your code!</Text>
                </View>
              ) : (
                referralHistory.map(r => (
                  <View key={r.id} style={styles.historyRow}>      
                    <Text
  style={styles.historyEmoji}>{r.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text
  style={styles.historyName}>{r.name}</Text>
                      <Text
  style={styles.historyDate}>{r.date}</Text>
                    </View>
                    <View style={styles.historyRight}>
                      <Text style={[
                        styles.historyStatus,
                        { color: r.status === 'Joined' ?
  Colors.green : Colors.orange }
                      ]}>{r.status}</Text>
                      <Text
  style={styles.historyReward}>{r.reward}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </FadeInView>

          {/* Terms */}
          <FadeInView delay={400}>
            <View style={styles.termsCard}>
              <Text style={styles.termsEmoji}>📌</Text>
              <Text style={styles.termsText}>
                Rewards are credited after the referred friend     
  completes their first month. Referral code is valid for new      
  members only. Terms subject to change.
              </Text>
            </View>
          </FadeInView>

          <View style={{ height: 24 }} />
        </ScrollView>
      </>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    content: { padding: 16, gap: 12 },

    heroCard: {
      backgroundColor: Colors.accent, borderRadius: 20, padding:   
  24,
      alignItems: 'center', gap: 10,
    },
    heroEmoji: { fontSize: 48 },
    heroTitle: { fontSize: 26, fontWeight: '700', color: '#FFF' }, 
    heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)',       
  textAlign: 'center', lineHeight: 20 },
    heroStats: { flexDirection: 'row', justifyContent:
  'space-around', width: '100%', marginTop: 8 },
    heroStat: { alignItems: 'center', gap: 2 },
    heroStatVal: { fontSize: 20, fontWeight: '700', color: '#FFF'  
  },
    heroStatLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)'  
  },
    heroStatDivider: { width: 1, backgroundColor:
  'rgba(255,255,255,0.3)' },

    codeCard: {
      backgroundColor: Colors.bgCard, borderRadius: 16, padding:   
  20,
      borderWidth: 1, borderColor: Colors.border, gap: 14,
  alignItems: 'center',
    },
    codeLabel: { fontSize: 13, color: Colors.textMuted, fontWeight:
   '600' },
    codeBox: { flexDirection: 'row', alignItems: 'center', gap: 12 
  },
    codeText: {
      fontSize: 28, fontWeight: '700', color: Colors.accent,       
      letterSpacing: 4, backgroundColor: Colors.accentMuted,       
      paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12,
      borderWidth: 1, borderColor: Colors.accent + '30',
    },
    copyBtn: { backgroundColor: Colors.accent, borderRadius: 10,   
  paddingHorizontal: 16, paddingVertical: 10 },
    copyBtnText: { fontSize: 13, fontWeight: '700', color: '#FFF'  
  },
    shareBtn: {
      width: '100%', backgroundColor: Colors.bgElevated,
  borderRadius: 12,
      paddingVertical: 14, alignItems: 'center', borderWidth: 1,   
  borderColor: Colors.border,
    },
    shareBtnText: { fontSize: 15, fontWeight: '600', color:        
  Colors.text },

    card: { backgroundColor: Colors.bgCard, borderRadius: 16,      
  padding: 16, borderWidth: 1, borderColor: Colors.border, gap: 12 
  },
    cardTitle: { fontSize: 15, fontWeight: '700', color:
  Colors.text },

    stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12 
  },
    stepCircle: {
      width: 28, height: 28, borderRadius: 14,
      backgroundColor: Colors.accent, justifyContent: 'center',    
  alignItems: 'center',
    },
    stepNum: { fontSize: 13, fontWeight: '700', color: '#FFF' },   
    stepEmoji: { fontSize: 20 },
    stepText: { flex: 1, fontSize: 13, color: Colors.textSub,      
  lineHeight: 19 },

    milestoneRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      padding: 12, borderRadius: 12, borderWidth: 1, borderColor:  
  Colors.border,
    },
    milestoneAchieved: { backgroundColor: Colors.green + '10',     
  borderColor: Colors.green + '40' },
    milestoneEmoji: { fontSize: 24 },
    milestoneName: { fontSize: 14, fontWeight: '600', color:       
  Colors.text },
    milestoneReward: { fontSize: 12, color: Colors.textMuted,      
  marginTop: 2 },
    achievedBadge: { backgroundColor: Colors.green + '20',
  borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },    
    achievedText: { fontSize: 12, fontWeight: '700', color:        
  Colors.green },
    pendingBadge: { backgroundColor: Colors.bgElevated,
  borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },    
    pendingText: { fontSize: 11, color: Colors.textMuted },        

    historyRow: { flexDirection: 'row', alignItems: 'center', gap: 
  12, paddingVertical: 6 },
    historyEmoji: { fontSize: 20 },
    historyName: { fontSize: 14, fontWeight: '600', color:
  Colors.text },
    historyDate: { fontSize: 12, color: Colors.textMuted,
  marginTop: 1 },
    historyRight: { alignItems: 'flex-end', gap: 2 },
    historyStatus: { fontSize: 12, fontWeight: '700' },
    historyReward: { fontSize: 13, fontWeight: '600', color:       
  Colors.text },

    emptyState: { alignItems: 'center', paddingVertical: 20, gap: 8
   },
    emptyEmoji: { fontSize: 36 },
    emptyText: { fontSize: 14, color: Colors.textMuted },

    termsCard: {
      flexDirection: 'row', gap: 10, alignItems: 'flex-start',     
      backgroundColor: Colors.bgCard, borderRadius: 12, padding:   
  14,
      borderWidth: 1, borderColor: Colors.border,
    },
    termsEmoji: { fontSize: 16, marginTop: 1 },
    termsText: { flex: 1, fontSize: 12, color: Colors.textMuted,   
  lineHeight: 18 },
  });