import { View, Text, StyleSheet, ScrollView, Alert } from
  'react-native';                                
  import { Colors } from '@/constants/colors';
  import { Fonts } from '@/constants/fonts';  
  import FadeInView from '@/components/FadeInView';
  import AnimatedPressable from '@/components/AnimatedPressable';
                                                                     const currentPlan = {
    name: 'Premium 3 Months',                                      
    price: 3500,                                                   
    startDate: 'Jan 1, 2025',
    endDate: 'Mar 31, 2025',
    daysLeft: 59,
    totalDays: 90,
    features: [
      'Unlimited gym access',
      'Personal trainer (2x/week)',
      'Diet plan included',
      'Body progress tracking',
      'Group classes access',
      'Locker room access',
    ],
  };

  const allPlans = [
    { id: 1, name: 'Basic Monthly', price: 1000, duration: '1  Month', features: ['Gym access', 'Locker room'], highlight: false
   },
    { id: 2, name: 'Standard 3M', price: 2500, duration: '3  Months', features: ['Gym access', 'Group classes', 'Locker  room'], highlight: false },
    { id: 3, name: 'Premium 3M', price: 3500, duration: '3 Months',
   features: ['Everything in Standard', 'Personal trainer 2x/week',
   'Diet plan', 'Progress tracking'], highlight: true },
    { id: 4, name: 'Annual Gold', price: 10000, duration: '12  Months', features: ['Everything in Premium', 'Unlimited trainer sessions', 'Nutrition coaching', 'Priority booking'], highlight:false },
  ];

  const formatINR = (n: number) =>
    '₹' + n.toLocaleString('en-IN');

  const usedPercent = Math.round(((currentPlan.totalDays -
  currentPlan.daysLeft) / currentPlan.totalDays) * 100);

  export default function MyPlanScreen() {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Active Plan Card */}
        <FadeInView delay={0}>
          <View style={styles.activePlanCard}>
            <View style={styles.activePlanAccentBar} />
            <View style={styles.activePlanInner}>
              {/* Header */}
              <View style={styles.activePlanHeader}>
                <View>
                  <Text style={styles.activePlanLabel}>CURRENT     
  PLAN</Text>
                  <Text
  style={styles.activePlanName}>{currentPlan.name}</Text>
                </View>
                <View style={styles.activeBadge}>
                  <Text
  style={styles.activeBadgeText}>ACTIVE</Text>
                </View>
              </View>

              {/* Price + Dates */}
              <View style={styles.activePlanMeta}>
                <View style={styles.priceBlock}>
                  <Text
  style={styles.priceValue}>{formatINR(currentPlan.price)}</Text>  
                  <Text style={styles.priceLabel}>TOTAL PAID</Text>
                </View>
                <View style={styles.metaDivider} />
                <View style={styles.dateBlock}>
                  <Text
  style={styles.dateText}>{currentPlan.startDate}</Text>
                  <Text style={styles.dateArrow}>→</Text>
                  <Text
  style={styles.dateText}>{currentPlan.endDate}</Text>
                </View>
              </View>

              {/* Progress */}
              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>PLAN
  USAGE</Text>
                  <View style={styles.daysLeftChip}>
                    <Text
  style={styles.daysLeftNum}>{currentPlan.daysLeft}</Text>
                    <Text style={styles.daysLeftUnit}> DAYS        
  LEFT</Text>
                  </View>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width:      
  `${usedPercent}%` as any }]} />
                </View>
                <Text style={styles.progressSub}>{usedPercent}%    
  used · {currentPlan.totalDays - currentPlan.daysLeft} of
  {currentPlan.totalDays} days</Text>
              </View>

              {/* Features */}
              <View style={styles.featureGrid}>
                {currentPlan.features.map((f, i) => (
                  <View key={i} style={styles.featureRow}>
                    <View style={styles.featureDot} />
                    <Text style={styles.featureText}>{f}</Text>    
                  </View>
                ))}
              </View>
            </View>
          </View>
        </FadeInView>

        {/* Renewal Prompt */}
        <FadeInView delay={80}>
          <View style={styles.renewCard}>
            <View style={styles.renewLeft}>
              <Text style={styles.renewTitle}>Renew Before
  Expiry</Text>
              <Text style={styles.renewSub}>Lock in your current   
  rate. Visit front desk to renew.</Text>
            </View>
            <AnimatedPressable
              style={styles.renewBtn}
              scaleDown={0.95}
              onPress={() => Alert.alert('Renew Plan', 'Please  visit the front desk or contact your trainer to renew your  membership.')}
            >
              <Text style={styles.renewBtnText}>RENEW</Text>       
            </AnimatedPressable>
          </View>
        </FadeInView>

        {/* All Plans */}
        <FadeInView delay={140}>
          <Text style={styles.sectionLabel}>ALL PLANS</Text>       
        </FadeInView>

        {allPlans.map((plan, i) => {
          const isCurrent = plan.id === 3;
          const isUpgrade = plan.price > currentPlan.price;        
          const isDowngrade = plan.price < currentPlan.price;      

          return (
            <FadeInView key={plan.id} delay={180 + i * 60}>        
              <View style={[styles.planCard, isCurrent &&
  styles.planCardCurrent]}>
                {isCurrent && <View style={styles.planAccentBar}   
  />}
                <View style={styles.planInner}>
                  <View style={styles.planTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.planName, isCurrent &&  
  styles.planNameCurrent]}>
                        {plan.name}
                      </Text>
                      <Text
  style={styles.planDuration}>{plan.duration}</Text>
                    </View>
                    <View style={styles.planPriceCol}>
                      <Text style={[styles.planPrice, isCurrent && 
  styles.planPriceCurrent]}>
                        {formatINR(plan.price)}
                      </Text>
                      {isCurrent ? (
                        <View style={styles.currentChip}>
                          <Text style={styles.currentChipText}>YOUR
   PLAN</Text>
                        </View>
                      ) : isUpgrade ? (
                        <AnimatedPressable
                          style={styles.upgradeBtn}
                          scaleDown={0.95}
                          onPress={() => Alert.alert('Upgrade Plan', `Contact the front desk to upgrade to ${plan.name}.`)}    
                        >
                          <Text
  style={styles.upgradeBtnText}>UPGRADE</Text>
                        </AnimatedPressable>
                      ) : (
                        <AnimatedPressable
                          style={styles.downgradeBtn}
                          scaleDown={0.95}
                          onPress={() => Alert.alert('Change Plan',
   `Contact the front desk to switch to ${plan.name}.`)}
                        >
                          <Text
  style={styles.downgradeBtnText}>SELECT</Text>
                        </AnimatedPressable>
                      )}
                    </View>
                  </View>

                  <View style={styles.planFeatures}>
                    {plan.features.map((f, fi) => (
                      <View key={fi} style={styles.planFeatureRow}>
                        <Text style={[styles.planFeatureDot,       
  isCurrent && { color: Colors.accent }]}>◆</Text>
                        <Text style={[styles.planFeatureText,      
  isCurrent && { color: Colors.textSub }]}>{f}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </FadeInView>
          );
        })}

        {/* Info Note */}
        <FadeInView delay={450}>
          <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>ℹ</Text>
            <Text style={styles.infoText}>
              To upgrade, downgrade, or renew your plan, please    
  visit the front desk or speak to your trainer directly.
            </Text>
          </View>
        </FadeInView>

        <View style={{ height: 32 }} />
      </ScrollView>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    content: { padding: 16, gap: 12 },

    /* Active Plan Card */
    activePlanCard: {
      flexDirection: 'row',
      backgroundColor: Colors.bgCard,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: Colors.accent + '40',
      overflow: 'hidden',
    },
    activePlanAccentBar: { width: 4, backgroundColor: Colors.accent
   },
    activePlanInner: { flex: 1, padding: 16, gap: 14 },

    activePlanHeader: { flexDirection: 'row', alignItems:
  'flex-start', justifyContent: 'space-between' },
    activePlanLabel: { fontSize: 10, fontFamily: Fonts.bold, color:
   Colors.accent, letterSpacing: 1.5 },
    activePlanName: { fontSize: 20, fontFamily:
  Fonts.condensedBold, color: Colors.text, letterSpacing: 0.5,     
  marginTop: 2 },
    activeBadge: { backgroundColor: Colors.green + '20',
  borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,       
  borderWidth: 1, borderColor: Colors.green + '40' },
    activeBadgeText: { fontSize: 10, fontFamily: Fonts.bold, color:
   Colors.green, letterSpacing: 1.2 },

    activePlanMeta: { flexDirection: 'row', alignItems: 'center',  
  gap: 16 },
    priceBlock: { gap: 2 },
    priceValue: { fontSize: 28, fontFamily: Fonts.condensedBold,   
  color: Colors.accent, letterSpacing: 0.5 },
    priceLabel: { fontSize: 9, fontFamily: Fonts.bold, color:      
  Colors.textMuted, letterSpacing: 1.5 },
    metaDivider: { width: 1, height: 36, backgroundColor:
  Colors.border },
    dateBlock: { gap: 2 },
    dateText: { fontSize: 12, fontFamily: Fonts.medium, color:     
  Colors.textSub },
    dateArrow: { fontSize: 11, color: Colors.textMuted },

    progressSection: { gap: 6 },
    progressHeader: { flexDirection: 'row', justifyContent:        
  'space-between', alignItems: 'center' },
    progressLabel: { fontSize: 10, fontFamily: Fonts.bold, color:  
  Colors.textMuted, letterSpacing: 1.2 },
    daysLeftChip: { flexDirection: 'row', alignItems: 'baseline',  
  backgroundColor: Colors.accentMuted, paddingHorizontal: 8,       
  paddingVertical: 3, borderRadius: 6 },
    daysLeftNum: { fontSize: 15, fontFamily: Fonts.condensedBold,  
  color: Colors.accent },
    daysLeftUnit: { fontSize: 9, fontFamily: Fonts.bold, color:    
  Colors.accent, letterSpacing: 1 },
    progressTrack: { height: 5, backgroundColor: Colors.border,    
  borderRadius: 3, overflow: 'hidden' },
    progressFill: { height: 5, backgroundColor: Colors.accent,     
  borderRadius: 3 },
    progressSub: { fontSize: 11, fontFamily: Fonts.regular, color: 
  Colors.textMuted },

    featureGrid: { gap: 6 },
    featureRow: { flexDirection: 'row', alignItems: 'center', gap: 
  8 },
    featureDot: { width: 5, height: 5, borderRadius: 3,
  backgroundColor: Colors.accent },
    featureText: { fontSize: 13, fontFamily: Fonts.regular, color: 
  Colors.textSub },

    /* Renew Card */
    renewCard: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: Colors.bgElevated, borderRadius: 14,        
  padding: 14,
      borderWidth: 1, borderColor: Colors.border,
    },
    renewLeft: { flex: 1, gap: 3 },
    renewTitle: { fontSize: 14, fontFamily: Fonts.bold, color:     
  Colors.text },
    renewSub: { fontSize: 12, fontFamily: Fonts.regular, color:    
  Colors.textMuted },
    renewBtn: {
      backgroundColor: Colors.accent, borderRadius: 10,
      paddingHorizontal: 16, paddingVertical: 9,
    },
    renewBtnText: { fontSize: 12, fontFamily: Fonts.bold, color:   
  '#FFF', letterSpacing: 1.2 },

    sectionLabel: { fontSize: 11, fontFamily: Fonts.bold, color:   
  Colors.textMuted, letterSpacing: 1.5, marginTop: 4 },

    /* Plan Cards */
    planCard: {
      flexDirection: 'row',
      backgroundColor: Colors.bgCard, borderRadius: 14,
      borderWidth: 1, borderColor: Colors.border,
      overflow: 'hidden',
    },
    planCardCurrent: { borderColor: Colors.accent + '50' },        
    planAccentBar: { width: 3, backgroundColor: Colors.accent },   
    planInner: { flex: 1, padding: 14, gap: 10 },

    planTop: { flexDirection: 'row', alignItems: 'flex-start' },   
    planName: { fontSize: 16, fontFamily: Fonts.bold, color:       
  Colors.textSub },
    planNameCurrent: { color: Colors.text },
    planDuration: { fontSize: 11, fontFamily: Fonts.regular, color:
   Colors.textMuted, marginTop: 2 },

    planPriceCol: { alignItems: 'flex-end', gap: 6 },
    planPrice: { fontSize: 22, fontFamily: Fonts.condensedBold,    
  color: Colors.textSub, letterSpacing: 0.5 },
    planPriceCurrent: { color: Colors.accent },

    currentChip: { backgroundColor: Colors.accentMuted,
  borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,       
  borderWidth: 1, borderColor: Colors.accent + '40' },
    currentChipText: { fontSize: 9, fontFamily: Fonts.bold, color: 
  Colors.accent, letterSpacing: 1.2 },

    upgradeBtn: { backgroundColor: Colors.accent, borderRadius: 8, 
  paddingHorizontal: 12, paddingVertical: 6 },
    upgradeBtnText: { fontSize: 10, fontFamily: Fonts.bold, color: 
  '#FFF', letterSpacing: 1 },
    downgradeBtn: { backgroundColor: Colors.bgElevated,
  borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6,      
  borderWidth: 1, borderColor: Colors.border },
    downgradeBtnText: { fontSize: 10, fontFamily: Fonts.bold,      
  color: Colors.textMuted, letterSpacing: 1 },

    planFeatures: { gap: 5 },
    planFeatureRow: { flexDirection: 'row', alignItems: 'center',  
  gap: 7 },
    planFeatureDot: { fontSize: 7, color: Colors.textMuted },      
    planFeatureText: { fontSize: 12, fontFamily: Fonts.regular,    
  color: Colors.textMuted },

    /* Info */
    infoCard: {
      flexDirection: 'row', alignItems: 'flex-start', gap: 10,     
      backgroundColor: Colors.bgElevated, borderRadius: 12,        
  padding: 14,
      borderWidth: 1, borderColor: Colors.border,
    },
    infoIcon: { fontSize: 16, color: Colors.textMuted, marginTop: 1
   },
    infoText: { flex: 1, fontSize: 12, fontFamily: Fonts.regular,  
  color: Colors.textMuted, lineHeight: 18 },
  });