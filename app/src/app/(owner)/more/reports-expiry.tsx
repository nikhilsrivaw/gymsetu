 import { useState, useCallback } from 'react';                                       import { View, Text, StyleSheet, FlatList, TouchableOpacity, Linking,                ActivityIndicator } from 'react-native';                                             import { MaterialCommunityIcons } from '@expo/vector-icons';                         import { Stack, useFocusEffect } from 'expo-router';                                 import { Colors } from '@/constants/colors';                                         import { Fonts } from '@/constants/fonts';                                           import { supabase } from '@/lib/supabase';                                         
  import { useAuthStore } from '@/store/authStore';                                    import FadeInView from '@/components/FadeInView';                                  
                                                                                       interface ExpiryMember {                                                           
    id:        string;                                                               
    full_name: string;                                                               
    phone:     string | null;
    plan_name: string;
    end_date:  string;
    daysLeft:  number;
  }

  export default function ReportsExpiryScreen() {
    const { profile } = useAuthStore();
    const [expiring, setExpiring] = useState<ExpiryMember[]>([]);
    const [expired,  setExpired]  = useState<ExpiryMember[]>([]);
    const [loading,  setLoading]  = useState(true);

    const fetchData = useCallback(async () => {
      if (!profile?.gym_id) return;
      setLoading(true);

      const todayStr = new Date().toISOString().split('T')[0];

      const { data: rows } = await supabase
        .from('members')
        .select('id, full_name, phone, member_plans(end_date, status,membership_plans(name))')
        .eq('gym_id', profile.gym_id)
        .in('status', ['active', 'expired']);

      if (!rows) { setLoading(false); return; }

      const expiringList: ExpiryMember[] = [];
      const expiredList:  ExpiryMember[] = [];

      rows.forEach((m: any) => {
        const plan = m.member_plans?.find((mp: any) => mp.status === 'active')       
          ?? m.member_plans?.[0];
        if (!plan?.end_date) return;

        const daysLeft = Math.round(
          (new Date(plan.end_date).getTime() - new Date(todayStr).getTime())
          / (1000 * 60 * 60 * 24)
        );

        const item: ExpiryMember = {
          id:        m.id,
          full_name: m.full_name,
          phone:     m.phone,
          plan_name: plan.membership_plans?.name ?? 'Unknown Plan',
          end_date:  new Date(plan.end_date).toLocaleDateString('en-IN', { day:      
  '2-digit', month: 'short', year: 'numeric' }),
          daysLeft,
        };

        if (daysLeft >= 0 && daysLeft <= 30) expiringList.push(item);
        else if (daysLeft < 0 && daysLeft >= -30) expiredList.push(item);
      });

      expiringList.sort((a, b) => a.daysLeft - b.daysLeft);
      expiredList.sort((a,  b) => b.daysLeft - a.daysLeft);

      setExpiring(expiringList);
      setExpired(expiredList);
      setLoading(false);
    }, [profile?.gym_id]);

    useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

    const urgencyColor = (d: number) => {
      if (d < 0)  return Colors.red;
      if (d <= 3) return Colors.red;
      if (d <= 7) return Colors.orange;
      return Colors.green;
    };

    const urgencyLabel = (d: number) => {
      if (d < 0)   return `${Math.abs(d)}d ago`;
      if (d === 0) return 'Today';
      if (d === 1) return 'Tomorrow';
      return `${d}d left`;
    };

    const renderCard = ({ item, index }: { item: ExpiryMember; index: number }) => { 
      const color    = urgencyColor(item.daysLeft);
      const initials = item.full_name.split(' ').map(n => n[0]).join('').slice(0,    
  2).toUpperCase();
      return (
        <FadeInView delay={index * 45}>
          <View style={[styles.card, { borderColor: color + '35' }]}>
            <View style={[styles.cardBar, { backgroundColor: color }]} />
            <View style={[styles.avatar, { borderColor: color + '50' }]}>
              <Text style={[styles.avatarText, { color }]}>{initials}</Text>
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardName}>{item.full_name}</Text>
              <Text style={styles.cardMeta}>{item.plan_name}  ·
  {item.end_date}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: color + '15' }]}>
              <Text style={[styles.badgeText, { color
  }]}>{urgencyLabel(item.daysLeft)}</Text>
            </View>
            {item.phone && (
              <TouchableOpacity
                style={styles.callBtn}
                onPress={() => Linking.openURL(`tel:${item.phone}`)}
              >
                <MaterialCommunityIcons name="phone" size={18} color={Colors.green}  
  />
              </TouchableOpacity>
            )}
          </View>
        </FadeInView>
      );
    };

    if (loading) return (
      <>
        <Stack.Screen options={{ title: 'Expiry Dashboard' }} />
        <View style={styles.center}><ActivityIndicator color={Colors.accent} 
  size="large" /></View>
      </>
    );

    const allItems = [...expiring, ...expired];

    return (
      <>
        <Stack.Screen options={{ title: 'Expiry Dashboard' }} />
        <FlatList
          style={styles.container}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          data={allItems}
          keyExtractor={item => item.id}
          renderItem={renderCard}
          ListHeaderComponent={() => (
            <>
              {expiring.length > 0 && (
                <FadeInView delay={0}>
                  <View style={styles.alertBanner}>
                    <View style={styles.alertAccent} />
                    <MaterialCommunityIcons name="clock-alert-outline" size={22}     
  color={Colors.orange} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.alertTitle}>
                        {expiring.filter(m => m.daysLeft <= 7).length} expiring      
  within 7 days
                      </Text>
                      <Text style={styles.alertSub}>
                        {expiring.length} in next 30 days  ·  {expired.length}       
  already expired
                      </Text>
                    </View>
                  </View>
                </FadeInView>
              )}
              {expiring.length > 0 && (
                <Text style={styles.sectionLabel}>EXPIRING SOON</Text>
              )}
            </>
          )}
          ListFooterComponent={() =>
            expired.length > 0 ? (
              <Text style={[styles.sectionLabel, { marginTop: 20 }]}>RECENTLY        
  EXPIRED</Text>
            ) : null
          }
          ListEmptyComponent={() => (
            <FadeInView delay={100} style={styles.empty}>
              <Text style={styles.emptyEmoji}>✅</Text>
              <Text style={styles.emptyTitle}>All clear!</Text>
              <Text style={styles.emptyDesc}>No memberships expiring in the next 30  
  days</Text>
            </FadeInView>
          )}
        />
      </>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    scroll:    { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40, gap: 8 }, 
    center:    { flex: 1, justifyContent: 'center', alignItems: 'center',
  backgroundColor: Colors.bg },

    alertBanner: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: Colors.bgCard, borderRadius: 14,
      borderWidth: 1, borderColor: Colors.orange + '30',
      padding: 16, marginBottom: 20, overflow: 'hidden',
    },
    alertAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,       
  backgroundColor: Colors.orange },
    alertTitle:  { fontFamily: Fonts.bold,    fontSize: 13, color: Colors.text },    
    alertSub:    { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, 
  marginTop: 2 },

    sectionLabel: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted,    
  letterSpacing: 1.8, marginBottom: 10 },

    card:      { flexDirection: 'row', alignItems: 'center', gap: 10,
  backgroundColor: Colors.bgCard, borderRadius: 14, borderWidth: 1, paddingVertical: 
  12, paddingRight: 12, overflow: 'hidden' },
    cardBar:   { width: 3, alignSelf: 'stretch' },
    avatar:    { width: 40, height: 40, borderRadius: 20, backgroundColor:
  Colors.bgElevated, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5
   },
    avatarText:{ fontFamily: Fonts.condensedBold, fontSize: 14 },
    cardInfo:  { flex: 1 },
    cardName:  { fontFamily: Fonts.bold,    fontSize: 14, color: Colors.text },      
    cardMeta:  { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted,   
  marginTop: 2 },
    badge:     { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },        
    badgeText: { fontFamily: Fonts.bold, fontSize: 9, letterSpacing: 0.5 },
    callBtn:   { width: 36, height: 36, borderRadius: 10, backgroundColor:
  Colors.greenMuted, justifyContent: 'center', alignItems: 'center' },

    empty:      { alignItems: 'center', paddingTop: 80 },
    emptyEmoji: { fontSize: 44, marginBottom: 12 },
    emptyTitle: { fontFamily: Fonts.bold,    fontSize: 16, color: Colors.text },     
    emptyDesc:  { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted,  
  marginTop: 6, textAlign: 'center' },
  });