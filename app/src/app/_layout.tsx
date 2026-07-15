import '@/lib/webAlert'; // patch Alert.alert to work on web (PWA) — must run before any Alert use
import { Slot, useSegments, useRouter } from 'expo-router';
import { LogBox, Platform, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { View, ActivityIndicator } from 'react-native';
import { appTheme } from '@/lib/theme';
import { useFonts } from 'expo-font';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import {
  BarlowCondensed_400Regular,
  BarlowCondensed_600SemiBold,
  BarlowCondensed_700Bold,
} from '@expo-google-fonts/barlow-condensed';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Colors } from '@/constants/colors';

LogBox.ignoreLogs(['Text strings must be rendered within a <Text> component']);

// ── Route guard — centralised, runs at root level ─────────────
// This is the recommended expo-router pattern to avoid child-layout
// redirect loops caused by react-navigation's useSyncState.
function RouteGuard() {
  const { isLoading, isInitialized, session, profile, subscription } = useAuthStore();
  const segments  = useSegments();
  const router    = useRouter();

  // Use only the top-level segment to minimise effect re-fires
  const topSegment = segments[0] as string | undefined;

  useEffect(() => {
    if (!isInitialized || isLoading) return;

    const inOwner   = topSegment === '(owner)';
    const inPaywall = topSegment === 'paywall';

    // ── Not logged in ──────────────────────────────────────────
    if (!session || !profile) {
      if (inOwner || inPaywall) router.replace('/');
      return;
    }

    // ── Gym owner ──────────────────────────────────────────────
    if (profile.role === 'gym_owner') {
      const noSub =
        !subscription ||
        subscription.status === 'expired' ||
        subscription.status === 'cancelled';

      if (noSub && !inPaywall) {
        router.replace('/paywall');
      } else if (!noSub && inPaywall) {
        router.replace('/(owner)/dashboard');
      } else if (!inOwner && !inPaywall) {
        router.replace('/(owner)/dashboard');
      }
    }
  // Stringify segments so the array reference doesn't cause spurious fires
  }, [isInitialized, isLoading, session?.user?.id, profile?.role, subscription?.status, topSegment]);

  return null;
}

// ── Root layout ───────────────────────────────────────────────
export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
    BarlowCondensed_400Regular,
    BarlowCondensed_600SemiBold,
    BarlowCondensed_700Bold,
  });

  useEffect(() => {
    useAuthStore.getState().initialize();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  const content = (
    <>
      <RouteGuard />
      <Slot />
      <StatusBar style="light" backgroundColor={Colors.bg} />
    </>
  );

  return (
    <PaperProvider theme={appTheme}>
      {Platform.OS === 'web' ? (
        // On web, constrain the mobile layout to a centered phone-width column
        // so it doesn't stretch edge-to-edge and look distorted on desktop.
        <View style={webShell.outer}>
          <View style={webShell.frame}>{content}</View>
        </View>
      ) : (
        content
      )}
    </PaperProvider>
  );
}

const webShell = StyleSheet.create({
  outer: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#000',
  },
  frame: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    backgroundColor: Colors.bg,
    overflow: 'hidden',
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
});
