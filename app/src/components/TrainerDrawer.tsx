import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import AnimatedPressable from '@/components/AnimatedPressable';
import { useAuthStore } from '@/store/authStore';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const MENU_ITEMS: { name: string; label: string; icon: IconName }[] = [
  { name: 'home',          label: 'Dashboard',    icon: 'view-dashboard-outline' },
  { name: 'my-members',    label: 'My Members',   icon: 'account-group-outline'  },
  { name: 'schedule',      label: 'Schedule',     icon: 'calendar-month-outline' },
  { name: 'workout-plans', label: 'Workout Plans',icon: 'dumbbell'               },
  { name: 'diet-plans',   label: 'Diet Plans',   icon: 'food-apple-outline'     },
  { name: 'attendance',   label: 'Attendance',   icon: 'check-circle-outline'   },
  { name: 'progress-log',  label: 'Progress Log', icon: 'chart-line'             },
  { name: 'profile',       label: 'My Profile',   icon: 'account-outline'        },
];

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function TrainerDrawer({ state, navigation }: DrawerContentComponentProps) {
  const insets  = useSafeAreaInsets();
  const { profile, gymProfile, signOut } = useAuthStore();

  const activeRouteName = state.routes[state.index].name;
  const trainerName     = profile?.full_name ?? 'Trainer';
  const trainerInitials = initials(trainerName);
  const specialization  = (profile as any)?.specialization ?? 'TRAINER';

  async function handleSignOut() {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => signOut() },
    ]);
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* ── Gym brand header ────────────────────────────────────── */}
      {gymProfile?.name && (
        <View style={styles.gymBrand}>
          <View style={styles.gymLogoWrap}>
            <Text style={styles.gymLogoInitial}>
              {gymProfile.name[0].toUpperCase()}
            </Text>
          </View>
          <Text style={styles.gymName} numberOfLines={1}>
            {gymProfile.name.toUpperCase()}
          </Text>
        </View>
      )}

      {/* ── Trainer profile card ─────────────────────────────────── */}
      <View style={styles.profileCard}>
        <LinearGradient
          colors={[Colors.accent + '18', 'transparent']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        {/* Double-ring avatar */}
        <View style={styles.avatarOuterRing}>
          <View style={styles.avatarInnerRing}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>{trainerInitials}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.trainerName}>{trainerName}</Text>

        <View style={styles.roleBadge}>
          <View style={styles.roleDot} />
          <Text style={styles.roleText}>{specialization.toUpperCase()}</Text>
        </View>

        {/* Active trainer pill */}
        <View style={styles.activePill}>
          <MaterialCommunityIcons name="whistle-outline" size={11} color={Colors.accent} />
          <Text style={styles.activePillText}>ACTIVE TRAINER</Text>
        </View>
      </View>

      {/* ── Menu items ───────────────────────────────────────────── */}
      <ScrollView
        style={styles.menuList}
        contentContainerStyle={styles.menuContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>TRAINER PANEL</Text>

        {MENU_ITEMS.map(item => {
          const isActive = activeRouteName === item.name;
          return (
            <AnimatedPressable
              key={item.name}
              style={[styles.menuItem, isActive && styles.menuItemActive]}
              scaleDown={0.97}
              onPress={() => navigation.navigate(item.name)}
            >
              {isActive && <View style={styles.activeBar} />}
              <View style={[styles.menuIconBox, {
                backgroundColor: isActive ? Colors.accent + '18' : Colors.bgElevated,
                borderColor:     isActive ? Colors.accent + '35' : Colors.border,
              }]}>
                <MaterialCommunityIcons
                  name={item.icon}
                  size={17}
                  color={isActive ? Colors.accent : Colors.textMuted}
                />
              </View>
              <Text style={[styles.menuLabel, isActive && styles.menuLabelActive]}>
                {item.label}
              </Text>
              {isActive && (
                <MaterialCommunityIcons name="circle-medium" size={14} color={Colors.accent} />
              )}
            </AnimatedPressable>
          );
        })}
      </ScrollView>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
        <View style={styles.footerDivider} />
        <AnimatedPressable style={styles.signOutBtn} scaleDown={0.97} onPress={handleSignOut}>
          <View style={styles.signOutIconBox}>
            <MaterialCommunityIcons name="logout" size={16} color={Colors.red} />
          </View>
          <Text style={styles.signOutText}>SIGN OUT</Text>
        </AnimatedPressable>
        <Text style={styles.version}>GYMSETU · TRAINER v1.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgCard },

  // Gym brand
  gymBrand: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 18, paddingTop: 14, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  gymLogoWrap: {
    width: 24, height: 24, borderRadius: 6,
    backgroundColor: Colors.accent + '18', borderWidth: 1, borderColor: Colors.accent + '30',
    justifyContent: 'center', alignItems: 'center',
  },
  gymLogoInitial: { fontFamily: Fonts.condensedBold, fontSize: 12, color: Colors.accent },
  gymName:        { fontFamily: Fonts.condensedBold, fontSize: 11, color: Colors.textMuted, letterSpacing: 1.5, flex: 1 },

  // Profile card
  profileCard: {
    paddingHorizontal: 18, paddingVertical: 20,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    gap: 8, overflow: 'hidden',
  },
  avatarOuterRing: {
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: Colors.accent + '18',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.accent + '25',
  },
  avatarInnerRing: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: Colors.accent + '25',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.accent + '40',
  },
  avatarCircle: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: Colors.accent,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInitials:  { fontFamily: Fonts.condensedBold, fontSize: 20, color: '#000', letterSpacing: 1 },
  trainerName:     { fontFamily: Fonts.bold, fontSize: 17, color: Colors.text },
  roleBadge:       { flexDirection: 'row', alignItems: 'center', gap: 6 },
  roleDot:         { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.accent },
  roleText:        { fontFamily: Fonts.condensedBold, fontSize: 10, color: Colors.accent, letterSpacing: 0.8 },
  activePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start',
    backgroundColor: Colors.accent + '12', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.accent + '25',
  },
  activePillText: { fontFamily: Fonts.condensedBold, fontSize: 9, color: Colors.accent, letterSpacing: 1 },

  // Menu
  menuList:    { flex: 1 },
  menuContent: { paddingHorizontal: 12, paddingVertical: 12, gap: 2 },
  sectionLabel:{ fontFamily: Fonts.condensedBold, fontSize: 9, color: Colors.textMuted, letterSpacing: 1.8, paddingHorizontal: 10, marginBottom: 6 },
  menuItem:    { flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 10, paddingVertical: 11, borderRadius: 11, overflow: 'hidden' },
  menuItemActive: { backgroundColor: Colors.accent + '0C' },
  activeBar:   { position: 'absolute', left: 0, top: 8, bottom: 8, width: 3, borderRadius: 2, backgroundColor: Colors.accent },
  menuIconBox: { width: 34, height: 34, borderRadius: 9, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  menuLabel:      { flex: 1, fontFamily: Fonts.regular, fontSize: 14, color: Colors.textMuted },
  menuLabelActive:{ fontFamily: Fonts.bold, color: Colors.text },

  // Footer
  footer:          { paddingHorizontal: 16, paddingTop: 6, gap: 6 },
  footerDivider:   { height: 1, backgroundColor: Colors.border, marginBottom: 4 },
  signOutBtn:      { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 10, paddingVertical: 11, borderRadius: 11 },
  signOutIconBox:  { width: 34, height: 34, borderRadius: 9, backgroundColor: Colors.red + '12', borderWidth: 1, borderColor: Colors.red + '25', justifyContent: 'center', alignItems: 'center' },
  signOutText:     { fontFamily: Fonts.bold, fontSize: 13, color: Colors.red, letterSpacing: 0.8 },
  version:         { fontFamily: Fonts.condensedBold, fontSize: 9, color: Colors.textMuted, textAlign: 'center', letterSpacing: 1.5, paddingBottom: 4 },
});
