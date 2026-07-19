import {
  View, Text, StyleSheet, ActivityIndicator, Linking, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import { Links, WEBSITE_DISPLAY } from '@/constants/links';
import AnimatedPressable from '@/components/AnimatedPressable';
import { useAuthStore } from '@/store/authStore';

const PLAN_HIGHLIGHTS = [
  { icon: 'account-group-outline',  text: 'Member management & attendance',  both: true  },
  { icon: 'wallet-outline',         text: 'Payments, receipts & reports',     both: true  },
  { icon: 'dumbbell',               text: 'Trainer & branch management',      both: true  },
  { icon: 'robot-outline',          text: 'AI insights & revenue forecast',   both: false },
  { icon: 'whatsapp',               text: 'WhatsApp automation (500–2,000 tokens)', both: false },
  { icon: 'alert-circle-outline',   text: 'Churn detection & member LTV',     both: false },
];

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const { fetchSubscription, signOut, subscription, tokenBalance } = useAuthStore();

  // When an owner opens this deliberately from "My Plan & Billing", show what
  // they're on instead of the activation wall.
  const hasPlan = !!subscription &&
    (subscription.status === 'active' || subscription.status === 'trial');
  const periodEnd = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : null;
  const [checking, setChecking] = useState(false);
  const router = useRouter();

  async function handleOpenWebsite() {
    const supported = await Linking.canOpenURL(Links.pricing);
    if (supported) {
      await Linking.openURL(Links.pricing);
    } else {
      Alert.alert('Error', `Could not open the website. Please visit ${WEBSITE_DISPLAY}/pricing in your browser.`);
    }
  }

  async function handleAlreadySubscribed() {
    setChecking(true);
    await fetchSubscription();
    setChecking(false);
    // Navigate explicitly. This used to rely on RouteGuard bouncing subscribed
    // owners off /paywall — but that same bounce made "My Plan & Billing"
    // impossible to open, so the guard no longer does it.
    const sub = useAuthStore.getState().subscription;
    if (sub && (sub.status === 'active' || sub.status === 'trial')) {
      router.replace('/(owner)/dashboard');
    } else {
      Alert.alert('Abhi tak subscription nahi mila', 'Payment ho gaya hai toh thodi der baad dobara check karein.');
    }
  }

  return (
    <View style={[s.root, { paddingTop: insets.top, paddingBottom: insets.bottom + 16 }]}>

      {/* ── Branding ── */}
      <View style={s.brand}>
        <View style={s.logoRow}>
          <View style={s.logoIcon}>
            <MaterialCommunityIcons name="dumbbell" size={24} color={Colors.accent} />
          </View>
          <Text style={s.logoText}>GYMSETU</Text>
        </View>
      </View>

      {/* ── Main card ── */}
      <View style={s.card}>
        <View style={s.cardTop}>
          <MaterialCommunityIcons name="crown-outline" size={32} color={Colors.accent} />
          {hasPlan ? (
            <>
              <Text style={s.cardTitle}>
                {(subscription?.plan ?? 'pro').toUpperCase().replace('_', ' ')} PLAN
              </Text>
              <Text style={s.cardSub}>
                {subscription?.status === 'trial' ? 'Free trial active' : 'Active'}
                {periodEnd ? ` · renews ${periodEnd}` : ''}
                {tokenBalance ? `\n${tokenBalance.remaining} of ${tokenBalance.total} AI/WhatsApp tokens left` : ''}
              </Text>
            </>
          ) : (
            <>
              <Text style={s.cardTitle}>Activate Your Gym</Text>
              <Text style={s.cardSub}>
                Choose a plan on our website to unlock GymSetu for your gym.
              </Text>
            </>
          )}
        </View>

        {/* Plan highlights */}
        <View style={s.highlights}>
          {PLAN_HIGHLIGHTS.map((h, i) => (
            <View key={i} style={s.highlightRow}>
              <View style={[s.highlightIcon, { backgroundColor: h.both ? '#22c55e15' : Colors.accent + '15' }]}>
                <MaterialCommunityIcons
                  name={h.icon as any}
                  size={16}
                  color={h.both ? '#22c55e' : Colors.accent}
                />
              </View>
              <Text style={s.highlightText}>{h.text}</Text>
              {!h.both && (
                <View style={s.proBadge}>
                  <Text style={s.proBadgeText}>PRO</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Pricing summary */}
        <View style={s.pricingGrid}>
          {[
            { name: 'PRO',      price: '₹1,699',  color: Colors.accent, members: '≤200',    trial: true  },
            { name: 'PRO PLUS', price: '₹2,199',  color: '#A78BFA', members: '200–500',   trial: false },
            { name: 'PRO MAX',  price: '₹2,999',  color: '#3B82F6', members: '500+',      trial: false },
          ].map((p, i) => (
            <View key={p.name} style={[s.pricingCard, { borderColor: p.color + '30' }]}>
              <Text style={[s.pricingPlan, { color: p.color }]}>{p.name}</Text>
              <Text style={s.pricingAmount}>{p.price}<Text style={s.pricingPer}>/mo</Text></Text>
              <Text style={s.pricingMembers}>{p.members}</Text>
              {p.trial && (
                <View style={s.trialBadge}>
                  <Text style={s.trialBadgeText}>7-DAY TRIAL</Text>
                </View>
              )}
            </View>
          ))}
        </View>
        <Text style={s.gstNote}>+18% GST applicable</Text>
      </View>

      {/* ── CTAs ── */}
      <View style={s.ctas}>
        <AnimatedPressable style={s.primaryBtn} scaleDown={0.97} onPress={handleOpenWebsite}>
          <MaterialCommunityIcons name="web" size={20} color="#fff" />
          <Text style={s.primaryBtnText}>View Plans on {WEBSITE_DISPLAY}</Text>
          <MaterialCommunityIcons name="arrow-right" size={18} color="#fff" />
        </AnimatedPressable>

        <AnimatedPressable
          style={s.secondaryBtn}
          scaleDown={0.97}
          onPress={handleAlreadySubscribed}
        >
          {checking
            ? <ActivityIndicator size="small" color={Colors.accent} />
            : (
              <>
                <MaterialCommunityIcons name="refresh" size={18} color={Colors.accent} />
                <Text style={s.secondaryBtnText}>I've already subscribed</Text>
              </>
            )
          }
        </AnimatedPressable>
      </View>

      {/* ── Sign out ── */}
      <AnimatedPressable style={s.signOutBtn} scaleDown={0.97} onPress={() => signOut()}>
        <Text style={s.signOutText}>Sign out</Text>
      </AnimatedPressable>

    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0a', paddingHorizontal: 20, justifyContent: 'space-between' },

  brand:   { alignItems: 'center', paddingTop: 12 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoIcon:{ width: 44, height: 44, borderRadius: 13, backgroundColor: Colors.accent + '20',
             justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.accent + '40' },
  logoText:{ fontFamily: Fonts.condensedBold, fontSize: 30, color: '#fff', letterSpacing: 4 },

  card:    { backgroundColor: '#141414', borderRadius: 24, borderWidth: 1, borderColor: '#1e1e1e', padding: 20 },
  cardTop: { alignItems: 'center', marginBottom: 20 },
  cardTitle:{ fontFamily: Fonts.condensedBold, fontSize: 30, color: '#fff', letterSpacing: 0.5, marginTop: 10, marginBottom: 6 },
  cardSub:  { fontFamily: Fonts.regular, fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20 },

  highlights:    { gap: 10, marginBottom: 20 },
  highlightRow:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  highlightIcon: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  highlightText: { flex: 1, fontFamily: Fonts.regular, fontSize: 13, color: '#ccc' },
  proBadge:      { backgroundColor: Colors.accent + '15', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2,
                   borderWidth: 1, borderColor: Colors.accent + '30' },
  proBadgeText:  { fontFamily: Fonts.bold, fontSize: 8, color: Colors.accent, letterSpacing: 1 },

  pricingGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pricingCard:   { width: '48%' as any, alignItems: 'center', padding: 12, gap: 3,
                   backgroundColor: '#0f0f0f', borderRadius: 14, borderWidth: 1 },
  pricingPlan:   { fontFamily: Fonts.bold, fontSize: 9, letterSpacing: 1.5 },
  pricingAmount: { fontFamily: Fonts.condensedBold, fontSize: 22, color: '#fff' },
  pricingPer:    { fontFamily: Fonts.regular, fontSize: 11, color: '#555' },
  pricingMembers:{ fontFamily: Fonts.regular, fontSize: 9, color: '#444' },
  trialBadge:    { backgroundColor: Colors.accent + '15', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, marginTop: 2 },
  trialBadgeText:{ fontFamily: Fonts.bold, fontSize: 7, color: Colors.accent, letterSpacing: 1 },
  gstNote:       { fontFamily: Fonts.regular, fontSize: 10, color: '#444', textAlign: 'center', marginTop: 8 },

  ctas: { gap: 12 },

  primaryBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
                    backgroundColor: Colors.accent, borderRadius: 16, paddingVertical: 16 },
  primaryBtnText: { fontFamily: Fonts.bold, fontSize: 15, color: '#fff', flex: 1, textAlign: 'center' },

  secondaryBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                      backgroundColor: '#141414', borderRadius: 16, paddingVertical: 14,
                      borderWidth: 1, borderColor: Colors.accent + '30' },
  secondaryBtnText: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.accent },

  signOutBtn:  { alignItems: 'center', paddingVertical: 8 },
  signOutText: { fontFamily: Fonts.regular, fontSize: 13, color: '#333' },
});
