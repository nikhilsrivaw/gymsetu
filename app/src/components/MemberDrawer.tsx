import { View, Text, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import { useAuthStore } from '@/store/authStore';
import { confirmAction } from '@/lib/confirm';
import AnimatedPressable from '@/components/AnimatedPressable';

const menuItems: {
  name: string;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  tint: string;
}[] = [
  { name: 'home',        label: 'Home',        icon: 'home-variant',        tint: Colors.accent },
  { name: 'fitness',     label: 'Fitness',      icon: 'dumbbell',            tint: '#3B82F6' },
  { name: 'schedule',    label: 'Classes',      icon: 'calendar-clock',      tint: '#A855F7' },
  { name: 'my-payments', label: 'My Payments',  icon: 'credit-card-outline', tint: '#22C55E' },
  { name: 'my-plan',     label: 'My Plan',      icon: 'clipboard-text',      tint: '#F59E0B' },
  { name: 'gym-info',    label: 'Gym Info',     icon: 'information-outline', tint: '#06B6D4' },
  { name: 'feedback',    label: 'Feedback',     icon: 'message-star-outline',tint: '#EC4899' },
  { name: 'profile',     label: 'Profile',      icon: 'account-circle',      tint: '#8B5CF6' },
];

export default function MemberDrawer({ state, navigation }: DrawerContentComponentProps) {
  const insets = useSafeAreaInsets();
  const { profile, gymProfile, signOut } = useAuthStore();
  const activeRouteName = state.routes[state.index].name;

  const fullName = (profile as any)?.full_name ?? 'Member';
  const memberCode = (profile as any)?.member_code ?? '';
  const initials = fullName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

  const handleLogout = () => {
    confirmAction(
      'Log Out',
      'Are you sure you want to log out?',
      () => signOut(),
      { confirmText: 'Log Out', destructive: true },
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* ── Gym Brand Section ─────────────────────── */}
      {gymProfile && (
        <LinearGradient
          colors={[Colors.accent + '14', Colors.accent + '06', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gymBrandBar}
        >
          {gymProfile.logo_url ? (
            <Image source={{ uri: gymProfile.logo_url }} style={styles.gymLogo} resizeMode="contain" />
          ) : (
            <View style={styles.gymLogoPlaceholder}>
              <Text style={styles.gymLogoInitial}>{gymProfile.name[0].toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.gymBrandText}>
            <Text style={styles.gymName} numberOfLines={1}>{gymProfile.name.toUpperCase()}</Text>
            <Text style={styles.gymTagline}>POWERED BY GYMSETU</Text>
          </View>
        </LinearGradient>
      )}

      {/* ── Member Profile Section ──────────────────── */}
      <View style={styles.header}>
        <View style={styles.outerRing}>
          <View style={styles.innerRing}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          </View>
        </View>

        <View style={styles.headerMeta}>
          <Text style={styles.memberName} numberOfLines={1}>{fullName}</Text>

          <View style={styles.statusPill}>
            <MaterialCommunityIcons name="check-circle" size={12} color={Colors.green} />
            <Text style={styles.statusText}>ACTIVE MEMBER</Text>
          </View>

          {memberCode ? (
            <View style={styles.codePill}>
              <Text style={styles.codeText}>{memberCode}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* ── Menu ───────────────────────────────────── */}
      <ScrollView
        style={styles.menuList}
        contentContainerStyle={styles.menuContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>NAVIGATION</Text>
        {menuItems.map(item => {
          const isActive = activeRouteName === item.name;
          return (
            <AnimatedPressable
              key={item.name}
              style={[styles.menuItem, isActive && styles.menuItemActive]}
              onPress={() => navigation.navigate(item.name)}
              scaleDown={0.97}
            >
              {isActive && <View style={styles.activeAccentBar} />}

              <View style={[
                styles.iconBox,
                { backgroundColor: isActive ? item.tint + '22' : Colors.glass },
              ]}>
                <MaterialCommunityIcons
                  name={item.icon}
                  size={16}
                  color={isActive ? item.tint : Colors.textMuted}
                />
              </View>

              <Text style={[styles.menuLabel, isActive && styles.menuLabelActive]}>
                {item.label}
              </Text>

              <MaterialCommunityIcons
                name="chevron-right"
                size={16}
                color={isActive ? Colors.accent + '60' : Colors.textMuted + '40'}
              />
            </AnimatedPressable>
          );
        })}
      </ScrollView>

      {/* ── Footer ─────────────────────────────────── */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
        <View style={styles.divider} />

        <AnimatedPressable style={styles.logoutBtn} onPress={handleLogout} scaleDown={0.97}>
          <View style={styles.logoutIconBox}>
            <MaterialCommunityIcons name="logout" size={15} color={Colors.red} />
          </View>
          <Text style={styles.logoutText}>LOG OUT</Text>
        </AnimatedPressable>

        <Text style={styles.versionText}>GymSetu Member</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A08' },

  // ── Gym Brand Bar ──────────────────────────────────────
  gymBrandBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  gymLogo: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  gymLogoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.accent + '18',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.accent + '30',
  },
  gymLogoInitial: {
    fontFamily: Fonts.condensedBold,
    fontSize: 18,
    color: Colors.accent,
  },
  gymBrandText: { flex: 1, gap: 2 },
  gymName: {
    fontFamily: Fonts.condensedBold,
    fontSize: 15,
    color: Colors.text,
    letterSpacing: 2,
  },
  gymTagline: {
    fontFamily: Fonts.regular,
    fontSize: 8,
    color: Colors.textMuted,
    letterSpacing: 1.5,
  },

  // ── Member Profile Header ──────────────────────────────
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  outerRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: Colors.accent + '40',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.accentGlow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontFamily: Fonts.condensedBold,
    fontSize: 17,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  headerMeta: { flex: 1, gap: 5 },
  memberName: {
    fontFamily: Fonts.condensedBold,
    fontSize: 18,
    color: Colors.text,
    letterSpacing: 0.5,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    backgroundColor: Colors.greenMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  statusText: {
    fontFamily: Fonts.bold,
    fontSize: 9,
    color: Colors.green,
    letterSpacing: 0.8,
  },
  codePill: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.glass,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  codeText: {
    fontFamily: Fonts.medium,
    fontSize: 10,
    color: Colors.textSub,
    letterSpacing: 0.8,
  },

  // ── Menu ───────────────────────────────────────────────
  menuList: { flex: 1 },
  menuContent: { paddingVertical: 12, paddingHorizontal: 10, gap: 2 },
  sectionLabel: {
    fontFamily: Fonts.medium,
    fontSize: 9,
    color: Colors.textMuted,
    letterSpacing: 1.4,
    paddingHorizontal: 10,
    marginBottom: 6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 10,
    position: 'relative' as const,
    overflow: 'hidden' as const,
  },
  menuItemActive: {
    backgroundColor: Colors.accent + '12',
  },
  activeAccentBar: {
    position: 'absolute' as const,
    left: 0,
    top: 6,
    bottom: 6,
    width: 3,
    borderRadius: 2,
    backgroundColor: Colors.accent,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  menuLabel: {
    flex: 1,
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: Colors.textMuted,
  },
  menuLabelActive: {
    fontFamily: Fonts.bold,
    color: Colors.text,
  },

  // ── Footer ─────────────────────────────────────────────
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 8,
  },
  footer: {
    paddingHorizontal: 14,
    paddingTop: 8,
    gap: 8,
  },
  logoutBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: Colors.redMuted,
  },
  logoutIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.red + '18',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  logoutText: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    color: Colors.red,
    letterSpacing: 0.5,
  },
  versionText: {
    fontFamily: Fonts.regular,
    fontSize: 9,
    color: Colors.textMuted,
    textAlign: 'center' as const,
    letterSpacing: 1,
    paddingTop: 2,
  },
});
