
  import { View, Text, StyleSheet, ScrollView } from 'react-native';
  import { MaterialCommunityIcons } from '@expo/vector-icons';
  import { useRouter, Stack } from 'expo-router';
  import { Colors } from '@/constants/colors';
  import { Fonts } from '@/constants/fonts';
  import AnimatedPressable from '@/components/AnimatedPressable';
  import FadeInView from '@/components/FadeInView';

  type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

  const menu: {
    label: string; desc: string;
    icon: IconName; emoji: string;
    color: string; route: string;
  }[] = [
    { label: 'Reports & Analytics', desc: 'Revenue, members & trends',       icon: 'chart-bar',
  emoji: '📊', color: Colors.accent,  route: '/(owner)/more/reports'       },
    { label: 'Trainers',            desc: 'Add & manage your training staff', icon: 'whistle-outline',
  emoji: '🏋️', color: '#3B82F6',      route: '/(owner)/trainers'           },
    { label: 'Attendance',          desc: 'Mark daily check-ins',             icon: 'check-circle-outline',     
  emoji: '📋', color: Colors.green,   route: '/(owner)/more/attendance'    },
    { label: 'Staff Management',    desc: 'Team members & permissions',       icon: 'account-group',
  emoji: '👨‍💼', color: '#4F6EF7',      route: '/(owner)/more/staff'         },
    { label: 'Announcements',       desc: 'Send notices to members',          icon: 'bullhorn',
  emoji: '📢', color: Colors.orange,  route: '/(owner)/more/announcements' },
    { label: 'Gym Profile',         desc: 'Public info, timings & amenities', icon: 'domain',
  emoji: '🏢', color: Colors.accent,  route: '/(owner)/more/gym-profile'   },
    { label: 'Backup & Export',     desc: 'Download data & backups',          icon: 'cloud-upload',
  emoji: '💾', color: Colors.green,   route: '/(owner)/more/backup'        },
    { label: 'Help & Support',      desc: 'FAQ & contact us',                 icon: 'help-circle-outline',      
  emoji: '❓', color: '#EC4899',      route: '/(owner)/more/help'          },
    { label: 'Settings',            desc: 'Gym info & account',               icon: 'cog-outline',
  emoji: '⚙️', color: Colors.textMuted, route: '/(owner)/more/settings'    },
  ];

  export default function MoreScreen() {
    const router = useRouter();

    return (
      <>
        <Stack.Screen options={{ title: 'More' }} />
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionLabel}>OPTIONS  —  {menu.length} AVAILABLE</Text>

          {menu.map((item, i) => (
            <FadeInView key={item.label} delay={i * 50}>
              <AnimatedPressable
                style={styles.row}
                scaleDown={0.97}
                onPress={() => router.push(item.route as any)}
              >
                <View style={[styles.rowBar, { backgroundColor: item.color }]} />

                <View style={[styles.iconWrap, { backgroundColor: item.color + '18' }]}>
                  <Text style={styles.emoji}>{item.emoji}</Text>
                </View>

                <View style={styles.rowText}>
                  <Text style={styles.rowLabel}>{item.label}</Text>
                  <Text style={styles.rowDesc}>{item.desc}</Text>
                </View>

                <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.textMuted} />
              </AnimatedPressable>
            </FadeInView>
          ))}

          <Text style={styles.version}>GYMSETU v1.0.0</Text>
          <View style={{ height: 24 }} />
        </ScrollView>
      </>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    scroll:    { paddingHorizontal: 16, paddingTop: 14, gap: 8 },

    sectionLabel: {
      fontFamily: Fonts.bold,
      fontSize: 9, color: Colors.textMuted,
      letterSpacing: 1.5, marginBottom: 6,
    },

    row: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: Colors.bgCard, borderRadius: 14,
      borderWidth: 1, borderColor: Colors.border,
      overflow: 'hidden', minHeight: 66,
    },
    rowBar:  { width: 3, alignSelf: 'stretch' },
    iconWrap: {
      width: 42, height: 42, borderRadius: 12,
      justifyContent: 'center', alignItems: 'center',
      marginHorizontal: 12,
    },
    emoji:   { fontSize: 20 },
    rowText: { flex: 1 },
    rowLabel:{ fontFamily: Fonts.bold,    fontSize: 14, color: Colors.text },
    rowDesc: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 2 },

    version: {
      fontFamily: Fonts.bold,
      fontSize: 9, color: Colors.textMuted,
      letterSpacing: 1.5, textAlign: 'center', marginTop: 16,
    },
  });
