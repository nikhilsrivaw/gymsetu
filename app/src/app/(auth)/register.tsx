import { View, Text, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useNavigation } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import { Links, WEBSITE_DISPLAY } from '@/constants/links';
import AnimatedPressable from '@/components/AnimatedPressable';
import { useAuthStore } from '@/store/authStore';

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const router     = useRouter();
  const navigation = useNavigation();
  const signOut    = useAuthStore((s) => s.signOut);

  function handleBack() {
    if (navigation.canGoBack()) {
      router.back();
    } else {
      router.replace('/(auth)/login');
    }
  }

  const steps = [
    { n: '1', text: `Visit ${WEBSITE_DISPLAY}/signup on your browser` },
    { n: '2', text: 'Enter your gym details and choose a plan' },
    { n: '3', text: 'Pay securely via PayU (Pro ₹1,699 · 7-day free trial)' },
    { n: '4', text: 'Come back here and sign in with your email & password' },
  ];

  return (
    <View style={[s.root, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }]}>

      <TouchableOpacity style={s.backBtn} onPress={handleBack} activeOpacity={0.7}>
        <MaterialCommunityIcons name="arrow-left" size={20} color="#888" />
      </TouchableOpacity>

      {/* Icon + heading */}
      <View style={s.hero}>
        <View style={s.iconWrap}>
          <MaterialCommunityIcons name="web" size={34} color={Colors.accent} />
        </View>
        <Text style={s.title}>Register on our Website</Text>
        <Text style={s.sub}>
          GymSetu accounts are created on our website so you can choose your plan and pay securely before getting started.
        </Text>
      </View>

      {/* Steps */}
      <View style={s.stepsCard}>
        {steps.map((step, i) => (
          <View key={step.n} style={[s.stepRow, i < steps.length - 1 && s.stepBorder]}>
            <View style={s.stepNum}>
              <Text style={s.stepNumText}>{step.n}</Text>
            </View>
            <Text style={s.stepText}>{step.text}</Text>
          </View>
        ))}
      </View>

      {/* Plans reminder */}
      <View style={s.plansRow}>
        <View style={[s.planChip, s.planChipPro]}>
          <Text style={[s.planChipLabel, { color: Colors.accent }]}>PRO</Text>
          <Text style={s.planChipPrice}>₹1,699<Text style={s.planChipPer}>/mo</Text></Text>
          <Text style={s.trialNote}>7-day free trial</Text>
        </View>
        <View style={s.planChip}>
          <Text style={s.planChipLabel}>PRO PLUS</Text>
          <Text style={s.planChipPrice}>₹2,199<Text style={s.planChipPer}>/mo</Text></Text>
        </View>
      </View>

      {/* CTA */}
      <View style={s.ctas}>
        <AnimatedPressable
          style={s.primaryBtn}
          scaleDown={0.97}
          onPress={() => Linking.openURL(Links.signup)}
        >
          <MaterialCommunityIcons name="open-in-new" size={18} color="#fff" />
          <Text style={s.primaryBtnText}>Open {WEBSITE_DISPLAY}/signup</Text>
        </AnimatedPressable>

        <AnimatedPressable
          style={s.secondaryBtn}
          scaleDown={0.97}
          onPress={() => router.replace('/(auth)/login')}
        >
          <Text style={s.secondaryBtnText}>Already registered? Sign in →</Text>
        </AnimatedPressable>
      </View>

      <TouchableOpacity style={s.signOutBtn} onPress={() => signOut()} activeOpacity={0.6}>
        <Text style={s.signOutText}>Sign out</Text>
      </TouchableOpacity>

    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0a', paddingHorizontal: 20 },

  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#141414', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#1e1e1e', marginBottom: 24,
  },

  hero:    { alignItems: 'center', marginBottom: 28 },
  iconWrap:{ width: 72, height: 72, borderRadius: 22, backgroundColor: Colors.accent + '15',
             justifyContent: 'center', alignItems: 'center',
             borderWidth: 1.5, borderColor: Colors.accent + '30', marginBottom: 14 },
  title:   { fontFamily: Fonts.condensedBold, fontSize: 28, color: '#fff', letterSpacing: 0.5, marginBottom: 8, textAlign: 'center' },
  sub:     { fontFamily: Fonts.regular, fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 22 },

  stepsCard:  { backgroundColor: '#141414', borderRadius: 18, borderWidth: 1, borderColor: '#1e1e1e', marginBottom: 16 },
  stepRow:    { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  stepBorder: { borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  stepNum:    { width: 28, height: 28, borderRadius: 8, backgroundColor: Colors.accent + '15',
                justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.accent + '30' },
  stepNumText:{ fontFamily: Fonts.bold, fontSize: 13, color: Colors.accent },
  stepText:   { flex: 1, fontFamily: Fonts.regular, fontSize: 13, color: '#ccc', lineHeight: 20 },

  plansRow:      { flexDirection: 'row', gap: 12, marginBottom: 24 },
  planChip:      { flex: 1, backgroundColor: '#141414', borderRadius: 14,
                   borderWidth: 1, borderColor: '#1e1e1e', padding: 14, alignItems: 'center', gap: 2 },
  planChipPro:   { borderColor: Colors.accent + '30', backgroundColor: Colors.accent + '08' },
  planChipLabel: { fontFamily: Fonts.bold, fontSize: 9, color: '#555', letterSpacing: 2 },
  planChipPrice: { fontFamily: Fonts.condensedBold, fontSize: 22, color: '#fff' },
  planChipPer:   { fontFamily: Fonts.regular, fontSize: 12, color: '#555' },
  trialNote:     { fontFamily: Fonts.regular, fontSize: 10, color: Colors.accent, marginTop: 2 },

  ctas: { gap: 12, marginBottom: 16 },

  primaryBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                    gap: 10, backgroundColor: Colors.accent, borderRadius: 16, paddingVertical: 16 },
  primaryBtnText: { fontFamily: Fonts.bold, fontSize: 15, color: '#fff' },

  secondaryBtn:     { alignItems: 'center', justifyContent: 'center',
                      backgroundColor: '#141414', borderRadius: 16, paddingVertical: 14,
                      borderWidth: 1, borderColor: '#1e1e1e' },
  secondaryBtnText: { fontFamily: Fonts.bold, fontSize: 14, color: '#888' },

  signOutBtn:  { alignItems: 'center', paddingVertical: 8 },
  signOutText: { fontFamily: Fonts.regular, fontSize: 13, color: '#333' },
});
