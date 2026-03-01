import { View, Text, StyleSheet, ScrollView, Linking } from 'react-native';
import { Stack } from 'expo-router';
import { Colors } from '@/constants/colors';
import AnimatedPressable from '@/components/AnimatedPressable';
import FadeInView from '@/components/FadeInView';

const gymInfo = {
  name: 'FitZone Gym & Fitness',
  tagline: 'Transform Your Body, Transform Your Life',
  address: '204, 2nd Floor, Lokhandwala Complex,\nAndheri West, Mumbai 400058',
  phone: '+91 98765 43210',
  email: 'fitzone.gym@gmail.com',
  website: 'www.fitzonegym.in',
  established: '2020',
  owner: 'Nikhil Sharma',
};

const timings = [
  { day: 'Mon - Fri', time: '5:30 AM - 10:30 PM', emoji: '🏋️' },
  { day: 'Saturday', time: '6:00 AM - 9:00 PM', emoji: '💪' },
  { day: 'Sunday', time: '7:00 AM - 1:00 PM', emoji: '🧘' },
];

const amenities = [
  { label: 'Cardio Zone', emoji: '🏃' },
  { label: 'Free Weights', emoji: '🏋️' },
  { label: 'Machines', emoji: '⚙️' },
  { label: 'Crossfit Area', emoji: '🔥' },
  { label: 'Yoga Studio', emoji: '🧘' },
  { label: 'Locker Room', emoji: '🔐' },
  { label: 'Steam Room', emoji: '♨️' },
  { label: 'Parking', emoji: '🅿️' },
  { label: 'Supplements', emoji: '💊' },
  { label: 'Personal Training', emoji: '👨‍🏫' },
  { label: 'Diet Plans', emoji: '🥗' },
  { label: 'AC', emoji: '❄️' },
];

const socialLinks = [
  { label: 'Instagram', emoji: '📸', handle: '@fitzone_gym', url: 'https://instagram.com/fitzone_gym' },
  { label: 'YouTube', emoji: '📺', handle: 'FitZone Gym', url: 'https://youtube.com/@fitzonegym' },
  { label: 'Facebook', emoji: '👍', handle: 'FitZone Gym Mumbai', url: 'https://facebook.com/fitzonegym' },
];

const stats = [
  { label: 'Members', value: '148+', emoji: '👥' },
  { label: 'Years', value: '6', emoji: '🏆' },
  { label: 'Trainers', value: '5', emoji: '👨‍🏫' },
  { label: 'Sqft', value: '3,500', emoji: '📐' },
];

export default function GymProfileScreen() {
  return (
    <>
      <Stack.Screen options={{ title: '🏢 Gym Profile' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <FadeInView delay={0}>
          <View style={styles.heroCard}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoEmoji}>💪</Text>
            </View>
            <Text style={styles.gymName}>{gymInfo.name}</Text>
            <Text style={styles.tagline}>{gymInfo.tagline}</Text>
            <Text style={styles.established}>Est. {gymInfo.established} · {gymInfo.owner}</Text>
          </View>
        </FadeInView>

        {/* Stats Row */}
        <FadeInView delay={100}>
          <View style={styles.statsRow}>
            {stats.map(s => (
              <View key={s.label} style={styles.statItem}>
                <Text style={styles.statEmoji}>{s.emoji}</Text>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </FadeInView>

        {/* Contact Info */}
        <FadeInView delay={200}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📍 Contact & Location</Text>
            <InfoItem emoji="📍" label="Address" value={gymInfo.address} />
            <InfoItem emoji="📞" label="Phone" value={gymInfo.phone} onPress={() => Linking.openURL(`tel:${gymInfo.phone}`)} />
            <InfoItem emoji="📧" label="Email" value={gymInfo.email} onPress={() => Linking.openURL(`mailto:${gymInfo.email}`)} />
            <InfoItem emoji="🌐" label="Website" value={gymInfo.website} />
          </View>
        </FadeInView>

        {/* Timings */}
        <FadeInView delay={300}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🕐 Operating Hours</Text>
            {timings.map(t => (
              <View key={t.day} style={styles.timingRow}>
                <Text style={styles.timingEmoji}>{t.emoji}</Text>
                <Text style={styles.timingDay}>{t.day}</Text>
                <Text style={styles.timingTime}>{t.time}</Text>
              </View>
            ))}
          </View>
        </FadeInView>

        {/* Amenities */}
        <FadeInView delay={400}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>✨ Amenities & Facilities</Text>
            <View style={styles.amenGrid}>
              {amenities.map(a => (
                <View key={a.label} style={styles.amenChip}>
                  <Text style={styles.amenEmoji}>{a.emoji}</Text>
                  <Text style={styles.amenLabel}>{a.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </FadeInView>

        {/* Social Links */}
        <FadeInView delay={500}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🔗 Social Media</Text>
            {socialLinks.map(s => (
              <AnimatedPressable
                key={s.label}
                style={styles.socialRow}
                scaleDown={0.97}
                onPress={() => Linking.openURL(s.url)}
              >
                <Text style={styles.socialEmoji}>{s.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.socialName}>{s.label}</Text>
                  <Text style={styles.socialHandle}>{s.handle}</Text>
                </View>
                <Text style={styles.socialArrow}>→</Text>
              </AnimatedPressable>
            ))}
          </View>
        </FadeInView>

        {/* Share Card */}
        <FadeInView delay={600}>
          <AnimatedPressable style={styles.shareCard} scaleDown={0.97}>
            <Text style={styles.shareEmoji}>📤</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.shareTitle}>Share Gym Profile</Text>
              <Text style={styles.shareSub}>Send your gym details to potential members</Text>
            </View>
          </AnimatedPressable>
        </FadeInView>

        <View style={{ height: 32 }} />
      </ScrollView>
    </>
  );
}

function InfoItem({ emoji, label, value, onPress }: { emoji: string; label: string; value: string; onPress?: () => void }) {
  const Wrapper = onPress ? AnimatedPressable : View;
  return (
    <Wrapper style={styles.infoItem} scaleDown={0.98} onPress={onPress}>
      <Text style={styles.infoEmoji}>{emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 16, gap: 12 },

  heroCard: {
    backgroundColor: Colors.accentMuted, borderRadius: 20, padding: 28, alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: Colors.accent + '25',
  },
  logoCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.bgCard, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: Colors.accent + '30', marginBottom: 8 },
  logoEmoji: { fontSize: 32 },
  gymName: { fontSize: 22, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  tagline: { fontSize: 13, color: Colors.textSub, fontStyle: 'italic', textAlign: 'center' },
  established: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },

  statsRow: { flexDirection: 'row', gap: 8 },
  statItem: { flex: 1, alignItems: 'center', backgroundColor: Colors.bgCard, borderRadius: 12, paddingVertical: 14, borderWidth: 1, borderColor: Colors.border, gap: 2 },
  statEmoji: { fontSize: 18 },
  statValue: { fontSize: 18, fontWeight: '700', color: Colors.text },
  statLabel: { fontSize: 11, color: Colors.textMuted },

  card: { backgroundColor: Colors.bgCard, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border, gap: 12 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },

  infoItem: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  infoEmoji: { fontSize: 16, marginTop: 2 },
  infoLabel: { fontSize: 12, color: Colors.textMuted },
  infoValue: { fontSize: 14, fontWeight: '500', color: Colors.text, marginTop: 1 },

  timingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  timingEmoji: { fontSize: 16 },
  timingDay: { flex: 1, fontSize: 14, fontWeight: '500', color: Colors.text },
  timingTime: { fontSize: 13, color: Colors.accent, fontWeight: '600' },

  amenGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  amenChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, backgroundColor: Colors.bgElevated },
  amenEmoji: { fontSize: 14 },
  amenLabel: { fontSize: 12, fontWeight: '500', color: Colors.textSub },

  socialRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  socialEmoji: { fontSize: 22 },
  socialName: { fontSize: 14, fontWeight: '600', color: Colors.text },
  socialHandle: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  socialArrow: { fontSize: 16, color: Colors.textMuted },

  shareCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.accent,
    borderRadius: 14, padding: 16,
  },
  shareEmoji: { fontSize: 24 },
  shareTitle: { fontSize: 15, fontWeight: '600', color: '#FFF' },
  shareSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
});
