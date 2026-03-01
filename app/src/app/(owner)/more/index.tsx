import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { Colors } from '@/constants/colors';
import AnimatedPressable from '@/components/AnimatedPressable';
import FadeInView from '@/components/FadeInView';

const menu = [
  { label: 'Reports & Analytics', desc: 'Revenue, members & trends', icon: 'chart-bar' as const, emoji: '📊', route: '/(owner)/more/reports' },
  { label: 'Attendance', desc: 'Mark daily check-ins', icon: 'check-circle-outline' as const, emoji: '📋', route: '/(owner)/more/attendance' },
  { label: 'Staff Management', desc: 'Team members & permissions', icon: 'account-group' as const, emoji: '👨‍💼', route: '/(owner)/more/staff' },
  { label: 'Announcements', desc: 'Send notices to members', icon: 'bullhorn' as const, emoji: '📢', route: '/(owner)/more/announcements' },
  { label: 'Gym Profile', desc: 'Public info, timings & amenities', icon: 'domain' as const, emoji: '🏢', route: '/(owner)/more/gym-profile' },
  { label: 'BMI Calculator', desc: 'Check body mass index', icon: 'scale-bathroom' as const, emoji: '⚖️', route: '/(owner)/more/bmi-calculator' },
  { label: 'Workout & Diet Tips', desc: 'Exercise guides & nutrition', icon: 'dumbbell' as const, emoji: '🏋️', route: '/(owner)/more/workout-tips' },
  { label: 'Backup & Export', desc: 'Download data & backups', icon: 'cloud-upload' as const, emoji: '💾', route: '/(owner)/more/backup' },
  { label: 'Help & Support', desc: 'FAQ & contact us', icon: 'help-circle-outline' as const, emoji: '❓', route: '/(owner)/more/help' },
  { label: 'Settings', desc: 'Gym info & account', icon: 'cog-outline' as const, emoji: '⚙️', route: '/(owner)/more/settings' },
];

export default function MoreScreen() {
  const router = useRouter();
  return (
    <>
      <Stack.Screen options={{ title: 'More' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {menu.map((item, i) => (
          <FadeInView key={item.label} delay={i * 60}>
            <AnimatedPressable
              style={styles.row}
              scaleDown={0.97}
              onPress={() => router.push(item.route as any)}
            >
              <View style={styles.iconWrap}>
                <Text style={styles.emoji}>{item.emoji}</Text>
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>{item.label}</Text>
                <Text style={styles.rowDesc}>{item.desc}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.textMuted} />
            </AnimatedPressable>
          </FadeInView>
        ))}
        <Text style={styles.version}>💪 GymSetu v1.0.0</Text>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: 16, gap: 8, paddingBottom: 24 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgCard, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.border, minHeight: 68 },
  iconWrap: { width: 42, height: 42, borderRadius: 12, backgroundColor: Colors.accentMuted, justifyContent: 'center', alignItems: 'center' },
  emoji: { fontSize: 20 },
  rowText: { flex: 1, marginLeft: 14 },
  rowLabel: { fontSize: 16, fontWeight: '600', color: Colors.text },
  rowDesc: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  version: { textAlign: 'center', color: Colors.textMuted, fontSize: 12, marginTop: 'auto', paddingBottom: 16 },
});
