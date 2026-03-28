import { Drawer } from 'expo-router/drawer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar, View, ActivityIndicator, Pressable } from 'react-native';
import { Colors } from '@/constants/colors';
import TrainerDrawer from '@/components/TrainerDrawer';
import { Redirect, useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

function BackOrMenu() {
  const navigation = useNavigation();
  const router = useRouter();
  const canGoBack = navigation.canGoBack();
  return (
    <Pressable
      onPress={() => canGoBack ? router.back() : navigation.dispatch(DrawerActions.openDrawer())}
      style={{ marginLeft: 14, width: 36, height: 36, borderRadius: 10,
        backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
        justifyContent: 'center', alignItems: 'center' }}
      hitSlop={8}
    >
      <MaterialCommunityIcons
        name={canGoBack ? 'arrow-left' : 'menu'}
        size={18} color={Colors.text}
      />
    </Pressable>
  );
}

export default function TrainerLayout() {
  const { profile, isLoading } = useAuthStore();
  if (isLoading) return <View style={{ flex: 1, backgroundColor: Colors.bg, justifyContent: 'center',
  alignItems: 'center' }}><ActivityIndicator color={Colors.accent} /></View>;
  if (!profile || profile.role !== 'trainer') return <Redirect href="/" />;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        initialRouteName="home"
        drawerContent={(props) => <TrainerDrawer {...props} />}
        screenOptions={{
          headerStyle: {
            backgroundColor: Colors.bg, elevation:
              0, shadowOpacity: 0
          },
          headerTintColor: Colors.text,
          headerTitleStyle: { fontWeight: '600', fontSize: 18 },
          headerLeft: () => <BackOrMenu />,
          headerShadowVisible: false,
          headerStatusBarHeight: StatusBar.currentHeight ?? 24,
          drawerStyle: {
            backgroundColor: Colors.bgCard, width:
              280
          },
        }}
      >
        <Drawer.Screen name="home" options={{
          title: 'Home',
          headerShown: false
        }} />
        <Drawer.Screen name="my-members" options={{ title: '👥 MyMembers' }} />
        <Drawer.Screen name="schedule" options={{ title: '📅 Schedule' }} />
        <Drawer.Screen name="workout-plans" options={{ title: 'Workout Plans' }} />
        <Drawer.Screen name="diet-plans"   options={{ title: 'Diet Plans'    }} />
        <Drawer.Screen name="attendance"   options={{ title: 'Attendance'    }} />
        <Drawer.Screen name="progress-log" options={{ title: '📈Progress Log' }} />
        <Drawer.Screen name="profile" options={{ title: '👤 My  Profile' }} />

        {/* Hidden — accessed from within other screens */}
        <Drawer.Screen name="member-detail" options={{ title: 'Member Detail', drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="add-member" options={{ title: 'Add Member', drawerItemStyle: { display: 'none' } }} />
      </Drawer>
    </GestureHandlerRootView>
  );
}