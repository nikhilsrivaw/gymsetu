import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/colors';

// This screen just bounces to the root-level paywall.
// Using useEffect instead of <Redirect> to avoid render-loop.
export default function OwnerPaywallBridge() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/paywall');
  }, []);
  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator color={Colors.accent} />
    </View>
  );
}
