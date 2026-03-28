import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import { useEffect } from 'react';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSpring, withTiming, withSequence,
} from 'react-native-reanimated';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const NAV: { name: string; label: string; icon: IconName; iconFocused: IconName }[] = [
  { name: 'dashboard', label: 'Home',     icon: 'home-variant-outline',           iconFocused: 'home-variant'           },
  { name: 'members',   label: 'Members',  icon: 'account-group-outline',          iconFocused: 'account-group'          },
  { name: 'plans',     label: 'Plans',    icon: 'card-account-details-outline',   iconFocused: 'card-account-details'   },
  { name: 'payments',  label: 'Payments', icon: 'wallet-outline',                 iconFocused: 'wallet'                 },
  { name: 'trainers',  label: 'Trainers', icon: 'dumbbell',                       iconFocused: 'dumbbell'               },
  { name: 'more',      label: 'More',     icon: 'dots-horizontal-circle-outline', iconFocused: 'dots-horizontal-circle' },
];

// ── Single animated tab item ────────────────────────────────────
function NavItem({ tab, isFocused, onPress }: { tab: typeof NAV[0]; isFocused: boolean; onPress: () => void }) {
  const scale    = useSharedValue(1);
  const pipW     = useSharedValue(isFocused ? 20 : 0);
  const iconOpac = useSharedValue(isFocused ? 1 : 0.28);

  // Animate pip and icon opacity when focus changes
  useEffect(() => {
    pipW.value     = withSpring(isFocused ? 20 : 0, { damping: 20, stiffness: 280 });
    iconOpac.value = withTiming(isFocused ? 1 : 0.28, { duration: 200 });
  }, [isFocused]);

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const pipStyle = useAnimatedStyle(() => ({
    width: pipW.value,
  }));

  const handlePress = () => {
    scale.value = withSequence(
      withTiming(0.82, { duration: 80 }),
      withSpring(1, { damping: 14, stiffness: 500 }),
    );
    onPress();
  };

  return (
    <Pressable onPress={handlePress} style={s.navItem}>
      <Animated.View style={[s.navItemInner, scaleStyle]}>
        {/* Spring-animated orange pip */}
        <Animated.View style={[s.pip, pipStyle]} />
        <MaterialCommunityIcons
          name={isFocused ? tab.iconFocused : tab.icon}
          size={23}
          color={isFocused ? Colors.accent : 'rgba(255,255,255,0.28)'}
        />
        <Text style={[s.navLabel, isFocused && s.navLabelActive]}>{tab.label}</Text>
      </Animated.View>
    </Pressable>
  );
}

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {/* Top separator */}
      <View style={s.barLine} />
      {state.routes.map((route, index) => {
        const tab = NAV.find(t => t.name === route.name);
        if (!tab) return null;
        const isFocused = state.index === index;
        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!event.defaultPrevented) navigation.navigate(route.name);
        };
        return <NavItem key={route.key} tab={tab} isFocused={isFocused} onPress={onPress} />;
      })}
    </View>
  );
}

// ── Root layout ─────────────────────────────────────────────────
export default function OwnerLayout() {
  const { profile, isLoading } = useAuthStore();

  if (isLoading) return (
    <View style={{ flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator color={Colors.accent} />
    </View>
  );
  if (!profile || profile.role !== 'gym_owner') return null;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <Tabs
        tabBar={props => <CustomTabBar {...props} />}
        screenOptions={{
          headerStyle:         { backgroundColor: Colors.bg, elevation: 0, shadowOpacity: 0 },
          headerTintColor:     Colors.text,
          headerTitleStyle:    { fontFamily: Fonts.bold, fontSize: 18 },
          headerShadowVisible: false,
          lazy:                true,
        }}
      >
        <Tabs.Screen name="dashboard" options={{ title: 'Home',     headerShown: false }} />
        <Tabs.Screen name="members"   options={{ title: 'Members',  headerShown: false }} />
        <Tabs.Screen name="plans"     options={{ title: 'Plans'                        }} />
        <Tabs.Screen name="payments"  options={{ title: 'Payments'                     }} />
        <Tabs.Screen name="trainers"  options={{ title: 'Trainers', headerShown: false }} />
        <Tabs.Screen name="more"      options={{ title: 'More',     headerShown: false }} />
        <Tabs.Screen name="branches"  options={{ href: null, headerShown: false }} />
        <Tabs.Screen name="paywall"   options={{ href: null, headerShown: false }} />
      </Tabs>
    </View>
  );
}

const s = StyleSheet.create({
  // ── Bottom nav ───────────────────────────────────────────────
  bar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(8,8,8,0.96)',
    paddingTop: 10,
    position: 'relative',
  },
  barLine: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  navItem:      { flex: 1, alignItems: 'center' },
  navItemInner: { alignItems: 'center', gap: 4, paddingTop: 2 },
  pip: {
    height: 3, borderRadius: 2,
    backgroundColor: Colors.accent,
    marginBottom: 4,
    minWidth: 0,
  },
  navLabel:       { fontFamily: Fonts.bold, fontSize: 8, color: 'rgba(255,255,255,0.28)', letterSpacing: 0.2 },
  navLabelActive: { color: Colors.accent },
});
