import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import AnimatedPressable from '@/components/AnimatedPressable';
import FadeInView from '@/components/FadeInView';
import { useAuthStore } from '@/store/authStore';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

type MenuItem = {
  label: string; desc: string;
  icon: IconName; color: string; route: string;
};

// Routes that require Pro plan
const PRO_ONLY = new Set([
  '/(owner)/more/ask-gym',
  '/(owner)/more/revenue-forecast',
  '/(owner)/more/churn-watch',
  '/(owner)/more/member-ltv',
  '/(owner)/more/announcements',
]);

// Routes not yet built — show "coming soon" instead of navigating to 404.
// Empty: every item in the menu is now a real, working screen.
const COMING_SOON = new Set<string>([]);

const sections: { title: string; icon: IconName; color: string; items: MenuItem[] }[] = [
  {
    title: 'REPORTS', icon: 'chart-bar', color: Colors.accent,
    items: [
      { label: 'GymSetu se Poochho',    desc: 'AI se apne gym ke baare mein kuch bhi poochho', icon: 'robot-outline',   color: Colors.accent, route: '/(owner)/more/ask-gym'         },
      { label: 'Reports',               desc: 'Revenue, members & attendance',         icon: 'chart-bar',             color: Colors.accent, route: '/(owner)/more/reports'          },
      { label: 'Aaj Ka Summary',        desc: 'End of day snapshot',                   icon: 'view-dashboard-outline', color: '#22c55e',     route: '/(owner)/more/daily-summary'    },
      { label: 'Income Prediction',     desc: 'Predict your next 3 months earnings',   icon: 'trending-up',           color: Colors.accent, route: '/(owner)/more/revenue-forecast' },
      { label: 'Members Leaving Soon',  desc: 'Who might stop coming — act fast',      icon: 'alert-circle-outline',  color: '#ef4444',     route: '/(owner)/more/churn-watch'      },
      { label: 'Best Members',          desc: 'Members who pay the most over time',    icon: 'star-circle-outline',   color: '#f97316',     route: '/(owner)/more/member-ltv'       },
    ],
  },
  {
    title: 'PAISA', icon: 'cash-multiple', color: '#22c55e',
    items: [
      { label: 'Expenses',          desc: 'Rent, salary aur baki kharcha',       icon: 'cash-minus',            color: '#ef4444',     route: '/(owner)/more/expenses'      },
      { label: 'Profit Calculator', desc: 'Kitne members chahiye profitable hone ke liye', icon: 'scale-balance', color: '#22c55e',     route: '/(owner)/more/break-even'    },
      { label: 'Export Data',       desc: 'Apne CA ko data bhejo',                icon: 'cloud-upload',          color: '#22c55e',     route: '/(owner)/more/export'        },
    ],
  },
  {
    title: 'MEMBERS', icon: 'account-group-outline', color: '#3B82F6',
    items: [
      { label: 'Attendance',          desc: 'Aaj kaun aaya gym',                     icon: 'check-circle-outline', color: '#22c55e',  route: '/(owner)/more/attendance'    },
      { label: 'Send Notice',         desc: 'Members ko notice ya update bhejo',      icon: 'bullhorn',             color: '#f97316',  route: '/(owner)/more/announcements' },
    ],
  },
  {
    title: 'GYM MANAGEMENT', icon: 'cogs', color: '#A78BFA',
    items: [
      { label: 'Lockers',             desc: 'Member locker assign karo',            icon: 'locker',                 color: '#F59E0B', route: '/(owner)/more/lockers'    },
      { label: 'Equipment',           desc: 'Machines ka record aur service date',  icon: 'dumbbell',               color: '#A78BFA', route: '/(owner)/more/equipment'  },
      { label: 'Complaints',            desc: 'Members ki complaints dekho & solve karo', icon: 'message-alert-outline', color: '#ef4444', route: '/(owner)/more/incidents'  },
    ],
  },
  {
    title: 'SETTINGS', icon: 'cog-outline', color: '#666',
    items: [
      { label: 'My Plan & Billing',  desc: 'Basic / Pro plan aur token balance',  icon: 'crown-outline',       color: Colors.accent, route: '/paywall?view=1'                   },
      { label: 'Edit Gym Details',   desc: 'Naam, address aur contact update karo', icon: 'pencil-outline',    color: '#3B82F6',     route: '/(owner)/more/gym-profile?edit=1'  },
      { label: 'Branches',           desc: 'Multiple gym locations manage karo',   icon: 'source-branch',       color: Colors.accent, route: '/(owner)/branches'                 },
      { label: 'Gym Profile',        desc: 'Timings, amenities aur public info',   icon: 'domain',              color: Colors.accent, route: '/(owner)/more/gym-profile'         },
      { label: 'Help & Support',     desc: 'Problem hai? Humse baat karo',         icon: 'help-circle-outline', color: '#EC4899',     route: '/(owner)/more/help'                },
      { label: 'Settings',           desc: 'Account aur app settings',             icon: 'cog-outline',         color: '#666',        route: '/(owner)/more/settings'            },
    ],
  },
];

const totalItems = sections.reduce((s, sec) => s + sec.items.length, 0);

export default function MoreScreen() {
  const router = useRouter();
  const { subscription } = useAuthStore();
  const isPro = !!subscription?.plan && subscription.plan !== 'basic' &&
    (subscription?.status === 'trial' || subscription?.status === 'active');

  function handlePress(route: string) {
    if (COMING_SOON.has(route)) {
      Alert.alert(
        'Jald Aata Hai',
        'Yeh feature abhi development mein hai. Jaldi aa raha hai!',
        [{ text: 'OK', style: 'cancel' }]
      );
      return;
    }
    if (!isPro && PRO_ONLY.has(route)) {
      Alert.alert(
        'Pro Plan Chahiye',
        'Yeh feature sirf Pro plan mein milta hai (₹1,699/month).\n\nUpgrade karo aur AI tips, WhatsApp automation aur bahut kuch unlock karo.',
        [
          { text: 'Abhi Nahi', style: 'cancel' },
          { text: 'Plans Dekho', onPress: () => router.push('/paywall') },
        ]
      );
      return;
    }
    router.push(route as any);
  }

  return (
    <>
      <Stack.Screen options={{ title: '', headerStyle: { backgroundColor: '#0a0a0a' }, headerTintColor: '#fff' }} />
      <ScrollView style={s.container} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <FadeInView delay={0}>
          <View style={s.header}>
            <View>
              <Text style={s.headerMicro}>OWNER PANEL</Text>
              <Text style={s.headerTitle}>MORE</Text>
            </View>
            <View style={s.headerBadge}>
              <Text style={s.headerBadgeText}>{totalItems} TOOLS</Text>
            </View>
          </View>
        </FadeInView>

        {/* ── Plan badge ── */}
        <FadeInView delay={40}>
          <View style={[s.planBadge, isPro ? s.planBadgePro : s.planBadgeBasic]}>
            <MaterialCommunityIcons
              name={isPro ? 'crown' : 'crown-outline'}
              size={14}
              color={isPro ? Colors.accent : '#888'}
            />
            <Text style={[s.planBadgeText, isPro ? s.planBadgeTextPro : s.planBadgeTextBasic]}>
              {isPro
                ? `${(subscription?.plan ?? 'pro').toUpperCase().replace('_', ' ')} PLAN${subscription?.status === 'trial' ? ' · FREE TRIAL' : ' · ACTIVE'}`
                : 'BASIC PLAN · 🔒 wale features upgrade karne par milenge'}
            </Text>
          </View>
        </FadeInView>

        {/* ── Sections ── */}
        {sections.map((section, si) => (
          <FadeInView key={section.title} delay={si * 50 + 60}>
            <View style={s.section}>

              <View style={s.sectionHeader}>
                <View style={[s.sectionIconWrap, { backgroundColor: section.color + '15' }]}>
                  <MaterialCommunityIcons name={section.icon} size={14} color={section.color} />
                </View>
                <Text style={[s.sectionTitle, { color: section.color }]}>{section.title}</Text>
                <View style={s.sectionLine} />
              </View>

              <View style={s.itemsCard}>
                {section.items.map((item, i) => {
                  const locked = !isPro && PRO_ONLY.has(item.route);
                  const soon   = COMING_SOON.has(item.route);
                  return (
                    <AnimatedPressable
                      key={item.label}
                      style={[s.row, i < section.items.length - 1 && s.rowBorder]}
                      scaleDown={0.97}
                      onPress={() => handlePress(item.route)}
                    >
                      <View style={[s.iconWrap, { backgroundColor: (locked || soon) ? '#1a1a1a' : item.color + '12' }]}>
                        <MaterialCommunityIcons
                          name={item.icon}
                          size={20}
                          color={(locked || soon) ? '#444' : item.color}
                        />
                      </View>

                      <View style={s.rowText}>
                        <View style={s.rowLabelRow}>
                          <Text style={[s.rowLabel, (locked || soon) && s.rowLabelLocked]}>{item.label}</Text>
                          {locked && (
                            <View style={s.proBadge}>
                              <MaterialCommunityIcons name="crown" size={9} color={Colors.accent} />
                              <Text style={s.proBadgeText}>PRO</Text>
                            </View>
                          )}
                          {soon && (
                            <View style={s.soonBadge}>
                              <Text style={s.soonBadgeText}>SOON</Text>
                            </View>
                          )}
                        </View>
                        <Text style={[s.rowDesc, (locked || soon) && s.rowDescLocked]}>{item.desc}</Text>
                      </View>

                      <View style={[s.arrowWrap, { backgroundColor: (locked || soon) ? '#111' : item.color + '10' }]}>
                        <MaterialCommunityIcons
                          name={locked ? 'lock-outline' : soon ? 'clock-outline' : 'chevron-right'}
                          size={(locked || soon) ? 15 : 18}
                          color={(locked || soon) ? '#333' : item.color}
                        />
                      </View>
                    </AnimatedPressable>
                  );
                })}
              </View>

            </View>
          </FadeInView>
        ))}

        <Text style={s.version}>GYMSETU  ·  v1.0.0</Text>
        <View style={{ height: 32 }} />
      </ScrollView>
    </>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  scroll:    { paddingHorizontal: 16, paddingTop: 12 },

  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 20, marginBottom: 4 },
  headerMicro:     { fontFamily: Fonts.bold, fontSize: 10, color: Colors.accent, letterSpacing: 2 },
  headerTitle:     { fontFamily: Fonts.condensedBold, fontSize: 42, color: '#fff', letterSpacing: 1, marginTop: 2 },
  headerBadge:     { backgroundColor: Colors.accent + '15', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: Colors.accent + '30' },
  headerBadgeText: { fontFamily: Fonts.bold, fontSize: 11, color: Colors.accent, letterSpacing: 1 },

  planBadge:         { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 20, borderWidth: 1 },
  planBadgePro:      { backgroundColor: Colors.accent + '10', borderColor: Colors.accent + '30' },
  planBadgeBasic:    { backgroundColor: '#1a1a1a', borderColor: '#2a2a2a' },
  planBadgeText:     { fontFamily: Fonts.bold, fontSize: 11, letterSpacing: 0.5, flex: 1 },
  planBadgeTextPro:  { color: Colors.accent },
  planBadgeTextBasic:{ color: '#666' },

  section:       { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionIconWrap:{ width: 26, height: 26, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  sectionTitle:  { fontFamily: Fonts.bold, fontSize: 11, letterSpacing: 1.8 },
  sectionLine:   { flex: 1, height: 1, backgroundColor: '#1a1a1a' },

  itemsCard: { backgroundColor: '#141414', borderRadius: 18, borderWidth: 1, borderColor: '#1e1e1e', overflow: 'hidden' },
  row:       { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 16 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },

  iconWrap:     { width: 46, height: 46, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  rowText:      { flex: 1 },
  rowLabelRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowLabel:     { fontFamily: Fonts.bold, fontSize: 15, color: '#fff' },
  rowLabelLocked:{ color: '#444' },
  rowDesc:      { fontFamily: Fonts.regular, fontSize: 12, color: '#555', marginTop: 3 },
  rowDescLocked:{ color: '#333' },
  arrowWrap:    { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },

  proBadge:     { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: Colors.accent + '15', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: Colors.accent + '30' },
  proBadgeText: { fontFamily: Fonts.bold, fontSize: 8, color: Colors.accent, letterSpacing: 1 },
  soonBadge:    { backgroundColor: '#2a2a2a', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: '#333' },
  soonBadgeText:{ fontFamily: Fonts.bold, fontSize: 8, color: '#555', letterSpacing: 1 },

  version: { fontFamily: Fonts.bold, fontSize: 9, color: '#2a2a2a', letterSpacing: 2, textAlign: 'center', marginTop: 8 },
});
