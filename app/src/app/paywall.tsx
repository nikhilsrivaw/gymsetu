import {
  View, Text, StyleSheet, ActivityIndicator, Linking, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import AnimatedPressable from '@/components/AnimatedPressable';
import { useAuthStore } from '@/store/authStore';

const WEBSITE_PRICING_URL = 'https://gymsetu.com/pricing';

const PLAN_HIGHLIGHTS = [
  { icon: 'account-group-outline',  text: 'Member management & attendance',  both: true  },
  { icon: 'wallet-outline',         text: 'Payments, receipts & reports',     both: true  },
  { icon: 'dumbbell',               text: 'Trainer & branch management',      both: true  },
  { icon: 'robot-outline',          text: 'AI insights & revenue forecast',   both: false },
  { icon: 'whatsapp',               text: 'WhatsApp automation (500 tokens)', both: false },
  { icon: 'alert-circle-outline',   text: 'Churn detection & member LTV',     both: false },
];

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const { fetchSubscription, signOut } = useAuthStore();
  const [checking, setChecking] = useState(false);

  async function handleOpenWebsite() {
    const supported = await Linking.canOpenURL(WEBSITE_PRICING_URL);
    if (supported) {
      await Linking.openURL(WEBSITE_PRICING_URL);
    } else {
      Alert.alert('Error', 'Could not open the website. Please visit gymsetu.com/pricing in your browser.');
    }
  }

  async function handleAlreadySubscribed() {
    setChecking(true);
    await fetchSubscription();
    setChecking(false);
    // RouteGuard in root layout will automatically redirect to dashboard
    // if subscription is now found — no manual navigation needed
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
          <Text style={s.cardTitle}>Activate Your Gym</Text>
          <Text style={s.cardSub}>
            Choose a plan on our website to unlock GymSetu for your gym.
          </Text>
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
        <View style={s.pricingRow}>
          <View style={s.pricingCard}>
            <Text style={s.pricingPlan}>BASIC</Text>
            <Text style={s.pricingAmount}>₹999<Text style={s.pricingPer}>/mo</Text></Text>
          </View>
          <View style={s.pricingDivider} />
          <View style={s.pricingCard}>
            <Text style={[s.pricingPlan, { color: Colors.accent }]}>PRO</Text>
            <Text style={s.pricingAmount}>₹1,699<Text style={s.pricingPer}>/mo</Text></Text>
            <View style={s.trialBadge}>
              <Text style={s.trialBadgeText}>7-DAY FREE TRIAL</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── CTAs ── */}
      <View style={s.ctas}>
        <AnimatedPressable style={s.primaryBtn} scaleDown={0.97} onPress={handleOpenWebsite}>
          <MaterialCommunityIcons name="web" size={20} color="#fff" />
          <Text style={s.primaryBtnText}>View Plans on gymsetu.com</Text>
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

  pricingRow:    { flexDirection: 'row', backgroundColor: '#0f0f0f', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#1e1e1e' },
  pricingCard:   { flex: 1, alignItems: 'center', padding: 14, gap: 2 },
  pricingDivider:{ width: 1, backgroundColor: '#1e1e1e' },
  pricingPlan:   { fontFamily: Fonts.bold, fontSize: 10, color: '#555', letterSpacing: 2 },
  pricingAmount: { fontFamily: Fonts.condensedBold, fontSize: 26, color: '#fff' },
  pricingPer:    { fontFamily: Fonts.regular, fontSize: 13, color: '#555' },
  trialBadge:    { backgroundColor: Colors.accent + '15', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, marginTop: 2 },
  trialBadgeText:{ fontFamily: Fonts.bold, fontSize: 8, color: Colors.accent, letterSpacing: 1 },

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
