import { Stack } from 'expo-router';
import { Colors } from '@/constants/colors';

export default function MoreLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.bg },
        headerTintColor: Colors.text,
        headerTitleStyle: { fontWeight: '600', fontSize: 18 },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: Colors.bg },
      }}
    />
  );
}
