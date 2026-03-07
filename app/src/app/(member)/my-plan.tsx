import { useState, useCallback } from 'react';                                       import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from         'react-native';                                                                      import { useFocusEffect } from 'expo-router';                                        import { Colors } from '@/constants/colors';                                         import { Fonts } from '@/constants/fonts';                                           import FadeInView from '@/components/FadeInView';                                    import AnimatedPressable from '@/components/AnimatedPressable';                    
  import { supabase } from '@/lib/supabase';                                           import { useAuthStore } from '@/store/authStore';                                  
                                                                                       interface ActivePlanInfo {                                                         
    planId: string;                                                                      name: string;                                                                        price: number;                                                                   
    startDate: string;
    endDate: string;
    daysLeft: number;
    totalDays: number;
    description: string | null;
  }

  interface PlanOption {
    id: string;
    name: string;
    price: number;
    duration_days: number;
    description: string | null;
  }

  const formatINR = (n: number) => '₹' + n.toLocaleString('en-IN');

  const fmtDuration = (d: number) =>
    d >= 365
      ? `${Math.round(d / 365)} Year`
      : d >= 30
      ? `${Math.round(d / 30)} Month${Math.round(d / 30) > 1 ? 's' : ''}`
      : `${d} Days`;

  export default function MyPlanScreen() {
    const { session } = useAuthStore();
    const [activePlan, setActivePlan] = useState<ActivePlanInfo | null>(null);       
    const [allPlans, setAllPlans]     = useState<PlanOption[]>([]);
    const [loading, setLoading]       = useState(true);

    useFocusEffect(useCallback(() => {
      let active = true;
      async function load() {
        if (!session?.user?.id) { setLoading(false); return; }
        setLoading(true);

        const { data: m } = await supabase
          .from('members')
          .select('id, gym_id')
          .eq('user_id', session.user.id)
          .single();

        if (!m || !active) { setLoading(false); return; }

        const [planRes, plansRes] = await Promise.all([
          supabase
            .from('member_plans')
            .select('plan_id, start_date, end_date, membership_plans(name, price, duration_days, description)')
            .eq('member_id', m.id)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from('membership_plans')
            .select('id, name, price, duration_days, description')
            .eq('gym_id', m.gym_id)
            .eq('is_active', true)
            .order('price', { ascending: true }),
        ]);

        if (!active) return;

        if (planRes.data) {
          const mp = planRes.data.membership_plans as any;
          const end = new Date(planRes.data.end_date);
          const daysLeft = Math.max(0, Math.ceil((end.getTime() - Date.now()) /      
  86400000));
          setActivePlan({
            planId:      planRes.data.plan_id,
            name:        mp?.name ?? 'Active Plan',
            price:       mp?.price ?? 0,
            startDate:   new
  Date(planRes.data.start_date).toLocaleDateString('en-IN', { day: '2-digit', month: 
  'short', year: 'numeric' }),
            endDate:     new Date(planRes.data.end_date).toLocaleDateString('en-IN', 
  { day: '2-digit', month: 'short', year: 'numeric' }),
            daysLeft,
            totalDays:   mp?.duration_days ?? 30,
            description: mp?.description ?? null,
          });
        }

        setAllPlans(plansRes.data ?? []);
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

    const usedPercent = activePlan
      ? Math.min(100, Math.round(((activePlan.totalDays - activePlan.daysLeft) /     
  activePlan.totalDays) * 100))
      : 0;

    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Active Plan Card */}
        <FadeInView delay={0}>
          {activePlan ? (
            <View style={styles.activePlanCard}>
              <View style={styles.activePlanAccentBar} />
              <View style={styles.activePlanInner}>
                <View style={styles.activePlanHeader}>
                  <View>
                    <Text style={styles.activePlanLabel}>CURRENT PLAN</Text>
                    <Text style={styles.activePlanName}>{activePlan.name}</Text>     
                  </View>
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>ACTIVE</Text>
                  </View>
                </View>

                <View style={styles.activePlanMeta}>
                  <View style={styles.priceBlock}>
                    <Text
  style={styles.priceValue}>{formatINR(activePlan.price)}</Text>
                    <Text style={styles.priceLabel}>TOTAL PAID</Text>
                  </View>
                  <View style={styles.metaDivider} />
                  <View style={styles.dateBlock}>
                    <Text style={styles.dateText}>{activePlan.startDate}</Text>      
                    <Text style={styles.dateArrow}>→</Text>
                    <Text style={styles.dateText}>{activePlan.endDate}</Text>        
                  </View>
                </View>

                <View style={styles.progressSection}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>PLAN USAGE</Text>
                    <View style={styles.daysLeftChip}>
                      <Text style={styles.daysLeftNum}>{activePlan.daysLeft}</Text>  
                      <Text style={styles.daysLeftUnit}> DAYS LEFT</Text>
                    </View>
                  </View>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${usedPercent}%` as 
  any }]} />
                  </View>
                  <Text style={styles.progressSub}>
                    {usedPercent}% used · {activePlan.totalDays -
  activePlan.daysLeft} of {activePlan.totalDays} days
                  </Text>
                </View>

                {activePlan.description ? (
                  <Text style={styles.descText}>{activePlan.description}</Text>      
                ) : null}
              </View>
            </View>
          ) : (
            <View style={styles.noPlanCard}>
              <Text style={styles.noPlanEmoji}>📋</Text>
              <Text style={styles.noPlanTitle}>No Active Plan</Text>
              <Text style={styles.noPlanSub}>Contact the front desk to get
  started</Text>
            </View>
          )}
        </FadeInView>

        {/* Renewal Prompt */}
        {activePlan && (
          <FadeInView delay={80}>
            <View style={styles.renewCard}>
              <View style={styles.renewLeft}>
                <Text style={styles.renewTitle}>Renew Before Expiry</Text>
                <Text style={styles.renewSub}>Lock in your current rate. Visit front 
  desk to renew.</Text>
              </View>
              <AnimatedPressable
                style={styles.renewBtn}
                scaleDown={0.95}
                onPress={() => Alert.alert('Renew Plan', 'Please visit the front desk or contact your trainer to renew your membership.')}
              >
                <Text style={styles.renewBtnText}>RENEW</Text>
              </AnimatedPressable>
            </View>
          </FadeInView>
        )}

        {/* All Plans */}
        {allPlans.length > 0 && (
          <FadeInView delay={140}>
            <Text style={styles.sectionLabel}>ALL PLANS</Text>
          </FadeInView>
        )}

        {allPlans.map((plan, i) => {
          const isCurrent  = plan.id === activePlan?.planId;
          const isUpgrade  = activePlan ? plan.price > activePlan.price : false;     

          return (
            <FadeInView key={plan.id} delay={180 + i * 60}>
              <View style={[styles.planCard, isCurrent && styles.planCardCurrent]}>  
                {isCurrent && <View style={styles.planAccentBar} />}
                <View style={styles.planInner}>
                  <View style={styles.planTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.planName, isCurrent &&
  styles.planNameCurrent]}>
                        {plan.name}
                      </Text>
                      <Text
  style={styles.planDuration}>{fmtDuration(plan.duration_days)}</Text>
                    </View>
                    <View style={styles.planPriceCol}>
                      <Text style={[styles.planPrice, isCurrent &&
  styles.planPriceCurrent]}>
                        {formatINR(plan.price)}
                      </Text>
                      {isCurrent ? (
                        <View style={styles.currentChip}>
                          <Text style={styles.currentChipText}>YOUR PLAN</Text>      
                        </View>
                      ) : isUpgrade ? (
                        <AnimatedPressable
                          style={styles.upgradeBtn}
                          scaleDown={0.95}
                          onPress={() => Alert.alert('Upgrade Plan', `Contact the    
  front desk to upgrade to ${plan.name}.`)}
                        >
                          <Text style={styles.upgradeBtnText}>UPGRADE</Text>
                        </AnimatedPressable>
                      ) : (
                        <AnimatedPressable
                          style={styles.downgradeBtn}
                          scaleDown={0.95}
                          onPress={() => Alert.alert('Change Plan', `Contact the     
  front desk to switch to ${plan.name}.`)}
                        >
                          <Text style={styles.downgradeBtnText}>SELECT</Text>        
                        </AnimatedPressable>
                      )}
                    </View>
                  </View>
                  {plan.description ? (
                    <Text style={[styles.descText, isCurrent && { color:
  Colors.textSub }]}>
                      {plan.description}
                    </Text>
                  ) : null}
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
              To upgrade, downgrade, or renew your plan, please visit the front desk 
  or speak to your trainer directly.
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

    activePlanCard: { flexDirection: 'row', backgroundColor: Colors.bgCard,
  borderRadius: 16, borderWidth: 1, borderColor: Colors.accent + '40', overflow:     
  'hidden' },
    activePlanAccentBar: { width: 4, backgroundColor: Colors.accent },
    activePlanInner: { flex: 1, padding: 16, gap: 14 },
    activePlanHeader: { flexDirection: 'row', alignItems: 'flex-start',
  justifyContent: 'space-between' },
    activePlanLabel: { fontSize: 10, fontFamily: Fonts.bold, color: Colors.accent,   
  letterSpacing: 1.5 },
    activePlanName: { fontSize: 20, fontFamily: Fonts.condensedBold, color:
  Colors.text, letterSpacing: 0.5, marginTop: 2 },
    activeBadge: { backgroundColor: Colors.green + '20', borderRadius: 6,
  paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: Colors.green
   + '40' },
    activeBadgeText: { fontSize: 10, fontFamily: Fonts.bold, color: Colors.green,    
  letterSpacing: 1.2 },

    activePlanMeta: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    priceBlock: { gap: 2 },
    priceValue: { fontSize: 28, fontFamily: Fonts.condensedBold, color:
  Colors.accent, letterSpacing: 0.5 },
    priceLabel: { fontSize: 9, fontFamily: Fonts.bold, color: Colors.textMuted,      
  letterSpacing: 1.5 },
    metaDivider: { width: 1, height: 36, backgroundColor: Colors.border },
    dateBlock: { gap: 2 },
    dateText: { fontSize: 12, fontFamily: Fonts.medium, color: Colors.textSub },     
    dateArrow: { fontSize: 11, color: Colors.textMuted },

    progressSection: { gap: 6 },
    progressHeader: { flexDirection: 'row', justifyContent: 'space-between',
  alignItems: 'center' },
    progressLabel: { fontSize: 10, fontFamily: Fonts.bold, color: Colors.textMuted,  
  letterSpacing: 1.2 },
    daysLeftChip: { flexDirection: 'row', alignItems: 'baseline', backgroundColor:   
  Colors.accentMuted, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },   
    daysLeftNum: { fontSize: 15, fontFamily: Fonts.condensedBold, color:
  Colors.accent },
    daysLeftUnit: { fontSize: 9, fontFamily: Fonts.bold, color: Colors.accent,       
  letterSpacing: 1 },
    progressTrack: { height: 5, backgroundColor: Colors.border, borderRadius: 3,     
  overflow: 'hidden' },
    progressFill: { height: 5, backgroundColor: Colors.accent, borderRadius: 3 },    
    progressSub: { fontSize: 11, fontFamily: Fonts.regular, color: Colors.textMuted  
  },
    descText: { fontSize: 12, fontFamily: Fonts.regular, color: Colors.textMuted,    
  lineHeight: 18 },

    noPlanCard: { backgroundColor: Colors.bgCard, borderRadius: 16, padding: 32,     
  alignItems: 'center', gap: 8, borderWidth: 1, borderColor: Colors.border },        
    noPlanEmoji: { fontSize: 40 },
    noPlanTitle: { fontSize: 16, fontFamily: Fonts.bold, color: Colors.text },       
    noPlanSub: { fontSize: 13, fontFamily: Fonts.regular, color: Colors.textMuted,   
  textAlign: 'center' },

    renewCard: { flexDirection: 'row', alignItems: 'center', gap: 12,
  backgroundColor: Colors.bgElevated, borderRadius: 14, padding: 14, borderWidth: 1, 
  borderColor: Colors.border },
    renewLeft: { flex: 1, gap: 3 },
    renewTitle: { fontSize: 14, fontFamily: Fonts.bold, color: Colors.text },        
    renewSub: { fontSize: 12, fontFamily: Fonts.regular, color: Colors.textMuted },  
    renewBtn: { backgroundColor: Colors.accent, borderRadius: 10, paddingHorizontal: 
  16, paddingVertical: 9 },
    renewBtnText: { fontSize: 12, fontFamily: Fonts.bold, color: '#FFF',
  letterSpacing: 1.2 },

    sectionLabel: { fontSize: 11, fontFamily: Fonts.bold, color: Colors.textMuted,   
  letterSpacing: 1.5, marginTop: 4 },

    planCard: { flexDirection: 'row', backgroundColor: Colors.bgCard, borderRadius:  
  14, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
    planCardCurrent: { borderColor: Colors.accent + '50' },
    planAccentBar: { width: 3, backgroundColor: Colors.accent },
    planInner: { flex: 1, padding: 14, gap: 10 },
    planTop: { flexDirection: 'row', alignItems: 'flex-start' },
    planName: { fontSize: 16, fontFamily: Fonts.bold, color: Colors.textSub },       
    planNameCurrent: { color: Colors.text },
    planDuration: { fontSize: 11, fontFamily: Fonts.regular, color: Colors.textMuted,
   marginTop: 2 },
    planPriceCol: { alignItems: 'flex-end', gap: 6 },
    planPrice: { fontSize: 22, fontFamily: Fonts.condensedBold, color:
  Colors.textSub, letterSpacing: 0.5 },
    planPriceCurrent: { color: Colors.accent },
    currentChip: { backgroundColor: Colors.accentMuted, borderRadius: 6,
  paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor:
  Colors.accent + '40' },
    currentChipText: { fontSize: 9, fontFamily: Fonts.bold, color: Colors.accent,    
  letterSpacing: 1.2 },
    upgradeBtn: { backgroundColor: Colors.accent, borderRadius: 8, paddingHorizontal:
   12, paddingVertical: 6 },
    upgradeBtnText: { fontSize: 10, fontFamily: Fonts.bold, color: '#FFF',
  letterSpacing: 1 },
    downgradeBtn: { backgroundColor: Colors.bgElevated, borderRadius: 8,
  paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor:
  Colors.border },
    downgradeBtnText: { fontSize: 10, fontFamily: Fonts.bold, color:
  Colors.textMuted, letterSpacing: 1 },

    infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10,
  backgroundColor: Colors.bgElevated, borderRadius: 12, padding: 14, borderWidth: 1, 
  borderColor: Colors.border },
    infoIcon: { fontSize: 16, color: Colors.textMuted, marginTop: 1 },
    infoText: { flex: 1, fontSize: 12, fontFamily: Fonts.regular, color:
  Colors.textMuted, lineHeight: 18 },
  });
