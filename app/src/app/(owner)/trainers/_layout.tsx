import { Stack } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';

export default function TrainersLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.bg },
        headerTintColor: Colors.text,
        headerTitleStyle: { fontFamily: Fonts.bold, fontSize: 18 },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: Colors.bg },
        animation: 'slide_from_right',
        gestureEnabled: true,
        gestureDirection: 'horizontal',
      }}
    />
  );
}
