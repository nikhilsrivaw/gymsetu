import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Linking, Alert, ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import { Links, WEBSITE_DISPLAY } from '@/constants/links';
import AnimatedPressable from '@/components/AnimatedPressable';
import FadeInView from '@/components/FadeInView';
import { useAuthStore } from '@/store/authStore';

/*
 * My Plan & Billing — lives INSIDE the (owner) group on purpose.
 *
 * This used to link to the root-level /paywall route. Pushing a root route from
 * inside the (owner) tab navigator left the tabs mounted with no screen to
 * render, so the page showed a spinner forever — the "stuck loading" bug. Every
 * other menu item works because they're all (owner)/more/*, so this one is too.
 *
 * /paywall still exists and is still what RouteGuard forces an owner WITHOUT a
 * subscription into. This screen is the read-only "what am I on" view for an
 * owner who already has one.
 */

const PLAN_LABEL: Record<string, string> = {
  basic: 'BASIC', pro: 'PRO', pro_plus: 'PRO PLUS', pro_max: 'PRO MAX',
};

const PLANS = [
  { id: 'pro',      name: 'PRO',      price: '1,699', members: '≤200 members',   color: Colors.accent },
  { id: 'pro_plus', name: 'PRO PLUS', price: '2,199', members: '200–500 members', color: '#A78BFA' },
  { id: 'pro_max',  name: 'PRO MAX',  price: '2,999', members: '500+ members',    color: '#3B82F6' },
];

export default function BillingScreen() {
  const { subscription, tokenBalance, fetchSubscription } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);

  const plan       = subscription?.plan ?? null;
  const status     = subscription?.status ?? null;
  const isActive   = status === 'active' || status === 'trial';
  const planLabel  = plan ? (PLAN_LABEL[plan] ?? plan.toUpperCase()) : '—';
  const periodEnd  = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : null;

  const used  = tokenBalance?.used ?? 0;
  const total = tokenBalance?.total ?? 0;
  const left  = tokenBalance?.remaining ?? Math.max(0, total - used);
  const pct   = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;

  const statusColor = !isActive ? Colors.red : status === 'trial' ? Colors.orange : Colors.green;

  const openPricing = async () => {
    try {
      const ok = await Linking.canOpenURL(Links.pricing);
      if (ok) await Linking.openURL(Links.pricing);
      else Alert.alert('Could not open', `Visit ${WEBSITE_DISPLAY}/pricing in your browser.`);
    } catch {
      Alert.alert('Could not open', `Visit ${WEBSITE_DISPLAY}/pricing in your browser.`);
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    await fetchSubscription();
    setRefreshing(false);
  };

  return (
    <>
      <Stack.Screen options={{ title: 'My Plan & Billing' }} />
      <ScrollView style={s.container} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Current plan */}
        <FadeInView delay={0}>
          <View style={[s.planCard, { borderColor: statusColor + '40' }]}>
            <LinearGradient
              colors={[statusColor + '18', 'transparent']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill} pointerEvents="none"
            />
            <View style={[s.planAccent, { backgroundColor: statusColor }]} />
            <View style={s.planTop}>
              <MaterialCommunityIcons name="crown" size={22} color={statusColor} />
              <Text style={[s.planStatus, { color: statusColor }]}>
                {!isActive ? 'NO ACTIVE PLAN' : status === 'trial' ? 'FREE TRIAL' : 'ACTIVE'}
              </Text>
            </View>
            <Text style={s.planName}>{planLabel}{isActive ? ' PLAN' : ''}</Text>
            {periodEnd && (
              <Text style={s.planMeta}>
                {status === 'trial' ? 'Trial ends' : 'Renews'} on {periodEnd}
              </Text>
            )}
          </View>
        </FadeInView>

        {/* Token balance */}
        {total > 0 && (
          <FadeInView delay={60}>
            <View style={s.card}>
              <View style={s.rowBetween}>
                <Text style={s.cardTitle}>AI & WHATSAPP TOKENS</Text>
                <Text style={s.tokenLeft}>{left.toLocaleString('en-IN')} left</Text>
              </View>
              <View style={s.track}>
                <View style={[s.fill, { width: `${pct}%` as any, backgroundColor: pct > 85 ? Colors.red : Colors.accent }]} />
              </View>
              <Text style={s.cardSub}>
                {used.toLocaleString('en-IN')} of {total.toLocaleString('en-IN')} used this month
              </Text>
            </View>
          </FadeInView>
        )}

        {/* Upgrade options */}
        <FadeInView delay={120}>
          <Text style={s.sectionLabel}>PLANS</Text>
          <View style={s.planRow}>
            {PLANS.map(p => {
              const current = plan === p.id;
              return (
                <View key={p.id} style={[s.tier, current && { borderColor: p.color + '80', backgroundColor: p.color + '12' }]}>
                  <Text style={[s.tierName, { color: current ? p.color : Colors.textMuted }]}>{p.name}</Text>
                  <Text style={s.tierPrice}>₹{p.price}<Text style={s.tierPer}>/mo</Text></Text>
                  <Text style={s.tierMembers}>{p.members}</Text>
                  {current && (
                    <View style={[s.currentPill, { backgroundColor: p.color + '20' }]}>
                      <Text style={[s.currentPillText, { color: p.color }]}>CURRENT</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
          <Text style={s.gstNote}>+18% GST applicable · quarterly/yearly plans are cheaper</Text>
        </FadeInView>

        {/* Actions */}
        <FadeInView delay={180}>
          <AnimatedPressable style={s.primaryBtn} scaleDown={0.97} onPress={openPricing}>
            <MaterialCommunityIcons name="open-in-new" size={17} color="#fff" />
            <Text style={s.primaryBtnText}>
              {isActive ? 'Manage plan on website' : 'Choose a plan'}
            </Text>
          </AnimatedPressable>

          <AnimatedPressable style={s.ghostBtn} scaleDown={0.97} onPress={refresh} disabled={refreshing}>
            {refreshing
              ? <ActivityIndicator size="small" color={Colors.accent} />
              : (
                <>
                  <MaterialCommunityIcons name="refresh" size={16} color={Colors.accent} />
                  <Text style={s.ghostBtnText}>Refresh plan status</Text>
                </>
              )}
          </AnimatedPressable>

          <Text style={s.helpNote}>
            Payments are handled on {WEBSITE_DISPLAY}. After paying, tap “Refresh plan status” to sync.
          </Text>
        </FadeInView>

        <View style={{ height: 32 }} />
      </ScrollView>
    </>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll:    { padding: 16 },

  planCard:   { backgroundColor: Colors.bgCard, borderRadius: 20, borderWidth: 1, padding: 20, marginBottom: 14, overflow: 'hidden' },
  planAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  planTop:    { flexDirection: 'row', alignItems: 'center', gap: 9 },
  planStatus: { fontFamily: Fonts.bold, fontSize: 9, letterSpacing: 1.4 },
  planName:   { fontFamily: Fonts.condensedBold, fontSize: 34, color: Colors.text, marginTop: 8 },
  planMeta:   { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, marginTop: 4 },

  card:      { backgroundColor: Colors.bgCard, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, padding: 16, marginBottom: 14 },
  cardTitle: { fontFamily: Fonts.bold, fontSize: 10, color: Colors.textMuted, letterSpacing: 1.4 },
  cardSub:   { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, marginTop: 8 },
  rowBetween:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tokenLeft: { fontFamily: Fonts.condensedBold, fontSize: 16, color: Colors.accent },
  track:     { height: 10, borderRadius: 5, backgroundColor: Colors.bg, overflow: 'hidden', marginTop: 12 },
  fill:      { height: '100%', borderRadius: 5 },

  sectionLabel: { fontFamily: Fonts.bold, fontSize: 10, color: Colors.textMuted, letterSpacing: 1.4, marginBottom: 10 },
  planRow:   { flexDirection: 'row', gap: 8 },
  tier:      { flex: 1, backgroundColor: Colors.bgCard, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 12, alignItems: 'center' },
  tierName:  { fontFamily: Fonts.bold, fontSize: 10, letterSpacing: 0.8 },
  tierPrice: { fontFamily: Fonts.condensedBold, fontSize: 19, color: Colors.text, marginTop: 6 },
  tierPer:   { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted },
  tierMembers:{ fontFamily: Fonts.regular, fontSize: 9.5, color: Colors.textMuted, marginTop: 3, textAlign: 'center' },
  currentPill:{ borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, marginTop: 8 },
  currentPillText:{ fontFamily: Fonts.bold, fontSize: 8, letterSpacing: 0.6 },
  gstNote:   { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, textAlign: 'center', marginTop: 12 },

  primaryBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, backgroundColor: Colors.accent, borderRadius: 14, paddingVertical: 15, marginTop: 20 },
  primaryBtnText:{ fontFamily: Fonts.bold, fontSize: 14, color: '#fff' },
  ghostBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, paddingVertical: 14, marginTop: 10 },
  ghostBtnText:  { fontFamily: Fonts.bold, fontSize: 13, color: Colors.accent },
  helpNote:      { fontFamily: Fonts.regular, fontSize: 11.5, color: Colors.textMuted, textAlign: 'center', marginTop: 16, lineHeight: 17 },
});
