import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Linking } from 'react-native';
import { Stack } from 'expo-router';
import { Colors } from '@/constants/colors';
import AnimatedPressable from '@/components/AnimatedPressable';
import FadeInView from '@/components/FadeInView';

interface FAQ {
  q: string;
  a: string;
  emoji: string;
}

const faqs: FAQ[] = [
  { emoji: '👥', q: 'How do I add a new member?', a: 'Go to the Members tab and tap the + button. Fill in the member details and tap Save. The member will appear in your members list immediately.' },
  { emoji: '💳', q: 'How do I record a payment?', a: 'Navigate to the Payments tab, tap the + button, select the member, enter the amount, choose payment method and tap Record. The payment will be logged with today\'s date.' },
  { emoji: '📋', q: 'How does attendance marking work?', a: 'Go to More → Attendance. You\'ll see all active members listed. Tap the checkbox next to each present member, then tap Save. You can also use "Mark All" for busy days.' },
  { emoji: '📊', q: 'Where can I see reports?', a: 'Go to More → Reports & Analytics. You\'ll find Revenue, Members, Attendance, and Expiry dashboards with charts and insights.' },
  { emoji: '⏰', q: 'How do I track expiring memberships?', a: 'Go to More → Reports → Expiry Dashboard. Members are sorted by urgency. You can call or renew directly from the card.' },
  { emoji: '👨‍💼', q: 'Can I add staff members?', a: 'Yes! Go to More → Staff Management. You can add staff with specific permissions — choose which actions (members, payments, attendance, reports, plans) each staff member can access.' },
  { emoji: '📝', q: 'How do I create a membership plan?', a: 'Go to the Plans tab and tap + to create a new plan. Enter the name, duration in days, price, and optional description. Toggle the plan active/inactive as needed.' },
  { emoji: '💾', q: 'Is my data backed up?', a: 'Go to More → Backup & Export to check your backup status. Auto-backup runs daily. You can also manually backup or export data as CSV anytime.' },
];

const contactOptions = [
  { emoji: '📧', label: 'Email Support', value: 'support@gymsetu.app', action: 'mailto:support@gymsetu.app' },
  { emoji: '📞', label: 'Phone Support', value: '+91 98765 43210', action: 'tel:+919876543210' },
  { emoji: '💬', label: 'WhatsApp', value: 'Chat with us', action: 'https://wa.me/919876543210' },
];

export default function HelpScreen() {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <>
      <Stack.Screen options={{ title: '❓ Help & Support' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <FadeInView delay={0}>
          <View style={styles.heroCard}>
            <Text style={styles.heroEmoji}>🤝</Text>
            <Text style={styles.heroTitle}>How can we help you?</Text>
            <Text style={styles.heroSub}>Find answers below or reach out to our support team</Text>
          </View>
        </FadeInView>

        {/* FAQ Section */}
        <FadeInView delay={100}>
          <Text style={styles.sectionTitle}>📖 Frequently Asked Questions</Text>
        </FadeInView>

        {faqs.map((faq, i) => {
          const isOpen = expanded === i;
          return (
            <FadeInView key={i} delay={150 + i * 40}>
              <AnimatedPressable
                style={[styles.faqCard, isOpen && styles.faqCardOpen]}
                scaleDown={0.98}
                onPress={() => setExpanded(isOpen ? null : i)}
              >
                <View style={styles.faqHeader}>
                  <Text style={styles.faqEmoji}>{faq.emoji}</Text>
                  <Text style={[styles.faqQ, isOpen && { color: Colors.accent }]}>{faq.q}</Text>
                  <Text style={styles.faqArrow}>{isOpen ? '▲' : '▼'}</Text>
                </View>
                {isOpen && (
                  <Text style={styles.faqA}>{faq.a}</Text>
                )}
              </AnimatedPressable>
            </FadeInView>
          );
        })}

        {/* Contact Section */}
        <FadeInView delay={500}>
          <Text style={styles.sectionTitle}>📞 Contact Support</Text>
        </FadeInView>

        {contactOptions.map((opt, i) => (
          <FadeInView key={opt.label} delay={550 + i * 60}>
            <AnimatedPressable
              style={styles.contactCard}
              scaleDown={0.97}
              onPress={() => Linking.openURL(opt.action)}
            >
              <View style={styles.contactIcon}>
                <Text style={styles.contactEmoji}>{opt.emoji}</Text>
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>{opt.label}</Text>
                <Text style={styles.contactValue}>{opt.value}</Text>
              </View>
              <Text style={styles.contactArrow}>→</Text>
            </AnimatedPressable>
          </FadeInView>
        ))}

        {/* App Info */}
        <FadeInView delay={700}>
          <View style={styles.appInfo}>
            <Text style={styles.appLogo}>💪</Text>
            <Text style={styles.appName}>GymSetu</Text>
            <Text style={styles.appVersion}>Version 1.0.0</Text>
            <Text style={styles.appCopy}>Made with ❤️ in India</Text>
          </View>
        </FadeInView>

        <View style={{ height: 32 }} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 16, gap: 10 },

  heroCard: {
    backgroundColor: Colors.accentMuted, borderRadius: 16, padding: 24, alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: Colors.accent + '25',
  },
  heroEmoji: { fontSize: 40 },
  heroTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  heroSub: { fontSize: 13, color: Colors.textSub, textAlign: 'center' },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginTop: 12, marginBottom: 4 },

  faqCard: {
    backgroundColor: Colors.bgCard, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border, gap: 10,
  },
  faqCardOpen: { borderColor: Colors.accent + '40' },
  faqHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  faqEmoji: { fontSize: 18 },
  faqQ: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.text },
  faqArrow: { fontSize: 10, color: Colors.textMuted },
  faqA: { fontSize: 13, color: Colors.textSub, lineHeight: 20, paddingLeft: 28 },

  contactCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgCard, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, gap: 12,
  },
  contactIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: Colors.accentMuted, justifyContent: 'center', alignItems: 'center' },
  contactEmoji: { fontSize: 20 },
  contactInfo: { flex: 1 },
  contactLabel: { fontSize: 14, fontWeight: '600', color: Colors.text },
  contactValue: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  contactArrow: { fontSize: 16, color: Colors.textMuted },

  appInfo: { alignItems: 'center', paddingVertical: 24, gap: 4 },
  appLogo: { fontSize: 36 },
  appName: { fontSize: 18, fontWeight: '700', color: Colors.text },
  appVersion: { fontSize: 13, color: Colors.textMuted },
  appCopy: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
});
