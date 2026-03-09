  import { useEffect } from 'react';
  import { Platform } from 'react-native';
  import Constants from 'expo-constants';

  // expo-notifications crashes in Expo Go since SDK 53
  // Only import when NOT in Expo Go
  const isExpoGo = Constants.appOwnership === 'expo';

  const PROJECT_ID = 'c3892d96-d06c-4e38-85f7-2c118007074d';

  export function usePushNotifications() {
    useEffect(() => {
      if (isExpoGo) return;
      registerForPushNotifications();
    }, []);
  }

  async function registerForPushNotifications() {
    try {
      const Notifications = await import('expo-notifications');

      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'GymSetu',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
        });
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') return;

      const token = await Notifications.getExpoPushTokenAsync({ projectId: PROJECT_ID });
      return token?.data;
    } catch (e) {
      // silently fail in unsupported environments
    }
  }
