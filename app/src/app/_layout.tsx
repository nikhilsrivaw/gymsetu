import { Slot } from 'expo-router';
import { usePushNotifications } from '@/hooks/usePushNotifications'; import { StatusBar } from 'expo-status-bar'; import { PaperProvider } from 'react-native-paper'; import { View } from 'react-native';
import { appTheme } from '@/lib/theme'; import { useFonts } from 'expo-font';
import {
  DMSans_400Regular,
  DMSans_500Medium, DMSans_700Bold,
} from '@expo-google-fonts/dm-sans'; import {
  BarlowCondensed_400Regular,
  BarlowCondensed_600SemiBold,
  BarlowCondensed_700Bold,
} from '@expo-google-fonts/barlow-condensed';
 import { useEffect } from 'react';
  import { useAuthStore } from '@/store/authStore';

import { Colors } from '@/constants/colors';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
    BarlowCondensed_400Regular,
    BarlowCondensed_600SemiBold,
    BarlowCondensed_700Bold,
  });
  // usePushNotifications();
   useEffect(() => {
    useAuthStore.getState().initialize();
  }, []);

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: Colors.bg }}
    />;
  }
  

  return (
    <PaperProvider theme={appTheme}>
      <Slot />
      <StatusBar style="light" backgroundColor={Colors.bg} />
    </PaperProvider>
  );
}
