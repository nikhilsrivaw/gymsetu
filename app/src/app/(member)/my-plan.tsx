 import { View, Text, StyleSheet, ScrollView } from                 'react-native';                                                  
  import { Stack } from 'expo-router';                               import { MaterialCommunityIcons } from '@expo/vector-icons';     
  import { Colors } from '@/constants/colors';                     
  import FadeInView from '@/components/FadeInView';                

  const currentPlan = {
    name: 'Premium 3 Months',
    emoji: '👑',
    price: 3500,
    startDate: 'Feb 1, 2026',
    endDate: 'Apr 30, 2026',
    daysLeft: 59,
    totalDays: 90,
    features: [
      'Unlimited gym access',
      'All group classes included',
      'Personal trainer: 2 sessions/month',
      'Diet consultation: 1 session/month',
      'Locker & steam room access',
      'Guest pass: 2 per month',
    ],
  };

  const allPlans = [
    {
      id: 1,
      name: 'Basic Monthly',
      emoji: '🥉',
      price: 1000,
      duration: '1 Month',
      color: Colors.textMuted,
      popular: false,
      features: ['Unlimited gym access', 'Locker room access',     
  'Basic equipment'],
    },
    {
      id: 2,
      name: 'Standard 3 Months',
      emoji: '🥈',
      price: 2500,
      duration: '3 Months',
      color: Colors.accent,
      popular: false,
      features: ['Unlimited gym access', 'Group classes (3/week)', 
  'Locker room access', 'Save ₹500 vs monthly'],
    },
    {
      id: 3,
      name: 'Premium 3 Months',
      emoji: '👑',
      price: 3500,
      duration: '3 Months',
      color: '#F59E0B',
      popular: true,
      isCurrent: true,
      features: ['Unlimited gym access', 'All group classes', 'PT sessions (2/month)', 'Diet consultation', 'Locker & steam room', 'Guest passes (2/month)'],
    },
    {
      id: 4,
      name: 'Annual Gold',
      emoji: '🏆',
      price: 10000,
      duration: '12 Months',
      color: '#EF4444',
      popular: false,
      features: ['Everything in Premium', 'PT sessions (4/month)', 
  'Unlimited guest passes', 'Priority class booking', 'Free protein shake/month', 'Save ₹32,000 vs monthly'],
    },
  ];

  function formatINR(amount: number) {
    return '₹' + amount.toLocaleString('en-IN');
  }

  export default function MyPlanScreen() {
    const progressPercent = Math.round(((currentPlan.totalDays -   
  currentPlan.daysLeft) / currentPlan.totalDays) * 100);

    return (
      <>
        <Stack.Screen options={{ title: '📋 My Plan' }} />
        <ScrollView style={styles.container}
  contentContainerStyle={styles.content}
  showsVerticalScrollIndicator={false}>

          {/* Current Plan Card */}
          <FadeInView delay={0}>
            <View style={styles.currentCard}>
              <View style={styles.currentTop}>
                <Text
  style={styles.currentEmoji}>{currentPlan.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.currentLabel}>Current        
  Plan</Text>
                  <Text
  style={styles.currentName}>{currentPlan.name}</Text>
                </View>
                <View style={styles.activeBadge}>
                  <Text style={styles.activeText}>✓ Active</Text>  
                </View>
              </View>

              {/* Progress */}
              <View style={styles.progressSection}>
                <View style={styles.progressLabels}>
                  <Text
  style={styles.progressStart}>{currentPlan.startDate}</Text>      
                  <Text
  style={styles.progressMid}>{currentPlan.daysLeft} days
  left</Text>
                  <Text
  style={styles.progressEnd}>{currentPlan.endDate}</Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width:      
  `${progressPercent}%` as any }]} />
                </View>
                <Text
  style={styles.progressPercent}>{progressPercent}%
  completed</Text>
              </View>

              {/* Price */}
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Plan Cost</Text>   
                <Text
  style={styles.priceVal}>{formatINR(currentPlan.price)}</Text>    
              </View>

              {/* Features */}
              <View style={styles.featuresList}>
                {currentPlan.features.map((f, i) => (
                  <View key={i} style={styles.featureRow}>
                    <MaterialCommunityIcons name="check-circle"    
  size={16} color={Colors.green} />
                    <Text style={styles.featureText}>{f}</Text>    
                  </View>
                ))}
              </View>
            </View>
          </FadeInView>

          {/* Renewal Prompt */}
          <FadeInView delay={100}>
            <View style={styles.renewCard}>
              <Text style={styles.renewEmoji}>⏳</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.renewTitle}>Plan expires in    
  {currentPlan.daysLeft} days</Text>
                <Text style={styles.renewSub}>Contact front desk to
   renew and continue your streak!</Text>
              </View>
            </View>
          </FadeInView>

          {/* All Plans */}
          <Text style={styles.sectionTitle}>📦 All Available       
  Plans</Text>

          {allPlans.map((plan, i) => (
            <FadeInView key={plan.id} delay={150 + i * 70}>        
              <View style={[
                styles.planCard,
                plan.isCurrent && { borderColor: plan.color + '60',
   borderWidth: 2 },
              ]}>
                {/* Popular / Current Badge */}
                {(plan.popular || plan.isCurrent) && (
                  <View style={[styles.topBadge, { backgroundColor:
   plan.color }]}>
                    <Text
  style={styles.topBadgeText}>{plan.isCurrent ? '✓ Your Plan' : '⭐ Most Popular'}</Text>
                  </View>
                )}

                <View style={styles.planHeader}>
                  <Text
  style={styles.planEmoji}>{plan.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text
  style={styles.planName}>{plan.name}</Text>
                    <Text style={styles.planDuration}>⏱
  {plan.duration}</Text>
                  </View>
                  <View style={styles.planPriceBox}>
                    <Text style={[styles.planPrice, { color:       
  plan.color }]}>{formatINR(plan.price)}</Text>
                    <Text
  style={styles.planPriceSub}>one-time</Text>
                  </View>
                </View>

                <View style={styles.planFeatures}>
                  {plan.features.map((f, fi) => (
                    <View key={fi} style={styles.planFeatureRow}>  
                      <MaterialCommunityIcons
                        name="check-circle-outline"
                        size={14}
                        color={plan.isCurrent ? plan.color :       
  Colors.textMuted}
                      />
                      <Text style={[styles.planFeatureText,        
  plan.isCurrent && { color: Colors.textSub }]}>{f}</Text>
                    </View>
                  ))}
                </View>

                {!plan.isCurrent && (
                  <View style={styles.upgradeRow}>
                    <Text style={[styles.upgradeText, { color:     
  plan.color }]}>
                      {plan.price > currentPlan.price ? '⬆️  Upgrade' : '⬇️ Downgrade'} → Contact front desk
                    </Text>
                  </View>
                )}
              </View>
            </FadeInView>
          ))}

          {/* Info Note */}
          <FadeInView delay={500}>
            <View style={styles.infoCard}>
              <Text style={styles.infoEmoji}>ℹ️</Text>
              <Text style={styles.infoText}>To change your plan or 
  renew, visit the front desk or contact your gym admin. All plans 
  are non-refundable.</Text>
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

    currentCard: {
      backgroundColor: Colors.bgCard, borderRadius: 18, padding:   
  18,
      borderWidth: 2, borderColor: '#F59E0B' + '50', gap: 14,      
    },
    currentTop: { flexDirection: 'row', alignItems: 'center', gap: 
  12 },
    currentEmoji: { fontSize: 32 },
    currentLabel: { fontSize: 11, color: Colors.textMuted },       
    currentName: { fontSize: 18, fontWeight: '700', color:
  Colors.text, marginTop: 2 },
    activeBadge: { backgroundColor: Colors.green + '20',
  borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },    
    activeText: { fontSize: 12, fontWeight: '700', color:
  Colors.green },

    progressSection: { gap: 6 },
    progressLabels: { flexDirection: 'row', justifyContent:        
  'space-between' },
    progressStart: { fontSize: 11, color: Colors.textMuted },      
    progressMid: { fontSize: 11, fontWeight: '700', color:
  Colors.accent },
    progressEnd: { fontSize: 11, color: Colors.textMuted },        
    progressBar: { height: 8, backgroundColor: Colors.border,      
  borderRadius: 4, overflow: 'hidden' },
    progressFill: { height: 8, backgroundColor: Colors.accent,     
  borderRadius: 4 },
    progressPercent: { fontSize: 11, color: Colors.textMuted,      
  textAlign: 'center' },

    priceRow: { flexDirection: 'row', justifyContent:
  'space-between', alignItems: 'center', paddingTop: 4,
  borderTopWidth: 1, borderTopColor: Colors.border },
    priceLabel: { fontSize: 13, color: Colors.textMuted },
    priceVal: { fontSize: 20, fontWeight: '700', color: Colors.text
   },

    featuresList: { gap: 8 },
    featureRow: { flexDirection: 'row', alignItems: 'center', gap: 
  8 },
    featureText: { fontSize: 13, color: Colors.textSub },

    renewCard: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: Colors.orangeMuted, borderRadius: 14,       
  padding: 14,
      borderWidth: 1, borderColor: Colors.orange + '30',
    },
    renewEmoji: { fontSize: 28 },
    renewTitle: { fontSize: 14, fontWeight: '700', color:
  Colors.text },
    renewSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2
   },

    sectionTitle: { fontSize: 15, fontWeight: '700', color:        
  Colors.text, marginTop: 4 },

    planCard: {
      backgroundColor: Colors.bgCard, borderRadius: 16, padding:   
  16,
      borderWidth: 1, borderColor: Colors.border, gap: 12,
  overflow: 'hidden',
    },
    topBadge: { position: 'absolute', top: 0, right: 0,
  paddingHorizontal: 12, paddingVertical: 5,
  borderBottomLeftRadius: 12 },
    topBadgeText: { fontSize: 11, fontWeight: '700', color: '#FFF' 
  },
    planHeader: { flexDirection: 'row', alignItems: 'center', gap: 
  12, paddingRight: 80 },
    planEmoji: { fontSize: 28 },
    planName: { fontSize: 15, fontWeight: '700', color: Colors.text
   },
    planDuration: { fontSize: 12, color: Colors.textMuted,
  marginTop: 2 },
    planPriceBox: { position: 'absolute', right: 0, alignItems:    
  'flex-end' },
    planPrice: { fontSize: 20, fontWeight: '700' },
    planPriceSub: { fontSize: 10, color: Colors.textMuted },       

    planFeatures: { gap: 6 },
    planFeatureRow: { flexDirection: 'row', alignItems: 'center',  
  gap: 8 },
    planFeatureText: { fontSize: 12, color: Colors.textMuted },    

    upgradeRow: { paddingTop: 8, borderTopWidth: 1, borderTopColor:
   Colors.border },
    upgradeText: { fontSize: 12, fontWeight: '600' },

    infoCard: {
      flexDirection: 'row', gap: 10, alignItems: 'flex-start',     
      backgroundColor: Colors.bgCard, borderRadius: 12, padding:   
  14,
      borderWidth: 1, borderColor: Colors.border,
    },
    infoEmoji: { fontSize: 16, marginTop: 1 },
    infoText: { flex: 1, fontSize: 13, color: Colors.textMuted,    
  lineHeight: 19 },
  });
