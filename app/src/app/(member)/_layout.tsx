  import { Drawer } from 'expo-router/drawer';
  import { GestureHandlerRootView } from 'react-native-gesture-handler';
  import { StatusBar, View, Text, Image, ActivityIndicator, Pressable } from 'react-native';
  import { Colors } from '@/constants/colors';
  import { Fonts } from '@/constants/fonts';
  import MemberDrawer from '@/components/MemberDrawer';
  import { Redirect, useRouter } from 'expo-router';
  import { useAuthStore } from '@/store/authStore';
  import { useNavigation } from '@react-navigation/native';
  import { DrawerActions } from '@react-navigation/native';
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

  function GymHeaderTitle() {
    const { gymProfile } = useAuthStore();
    const name = gymProfile?.name ?? '';
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {gymProfile?.logo_url ? (
          <Image
            source={{ uri: gymProfile.logo_url }}
            style={{ width: 26, height: 26, borderRadius: 6 }}
            resizeMode="contain"
          />
        ) : (
          <View style={{
            width: 26, height: 26, borderRadius: 6,
            backgroundColor: Colors.accent + '20',
            justifyContent: 'center', alignItems: 'center',
            borderWidth: 1, borderColor: Colors.accent + '30',
          }}>
            <Text style={{ fontFamily: Fonts.condensedBold, fontSize: 12, color: Colors.accent }}>
              {name ? name[0].toUpperCase() : '🏋️'}
            </Text>
          </View>
        )}
        {name ? (
          <Text style={{ fontFamily: Fonts.bold, fontSize: 16, color: Colors.text }}>
            {name}
          </Text>
        ) : (
          <ActivityIndicator size="small" color={Colors.accent} />
        )}
      </View>
    );
  }

  export default function MemberLayout() {
    const { profile, isLoading } = useAuthStore();

    if (isLoading) return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={Colors.accent} />
      </View>
    );

    if (!profile || profile.role !== 'member') return <Redirect href="/" />;

    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Drawer
          drawerContent={(props) => <MemberDrawer {...props} />}
          screenOptions={{
            headerStyle: { backgroundColor: Colors.bg, elevation: 0, shadowOpacity: 0 },
            headerTintColor: Colors.text,
            headerTitle: () => <GymHeaderTitle />,
            headerShadowVisible: false,
            headerLeft: () => <BackOrMenu />,
            headerStatusBarHeight: StatusBar.currentHeight ?? 24,
            drawerStyle: { backgroundColor: Colors.bgCard, width: 280 },
            overlayColor: 'rgba(0,0,0,0.65)',
            swipeEdgeWidth: 60,
          }}
        >
          {/* ── screens with their own custom header ── */}
          <Drawer.Screen name="home"             options={{ headerShown: false }} />
          <Drawer.Screen name="fitness"          options={{ headerShown: false }} />
          <Drawer.Screen name="schedule"         options={{ headerShown: false }} />
          <Drawer.Screen name="gym-info"         options={{ headerShown: false }} />
          <Drawer.Screen name="workout-tracker"  options={{ headerShown: false, drawerItemStyle: { display: 'none' } }}
   />
          <Drawer.Screen name="body-progress"    options={{ headerShown: false, drawerItemStyle: { display: 'none' } }}
   />
          <Drawer.Screen name="diet-plan"        options={{ headerShown: false, drawerItemStyle: { display: 'none' } }}
   />

          {/* ── screens using the gym-branded drawer header ── */}
          <Drawer.Screen name="my-payments"      options={{ title: 'My Payments' }} />
          <Drawer.Screen name="my-plan"          options={{ title: 'My Plan' }} />
          <Drawer.Screen name="feedback"         options={{ title: 'Feedback' }} />
          <Drawer.Screen name="profile"          options={{ title: 'Profile' }} />

          {/* ── hidden from drawer ── */}
          <Drawer.Screen name="exercise-library" options={{ title: 'Exercise Library', drawerItemStyle: { display:
  'none' } }} />
          <Drawer.Screen name="bmi-calculator"   options={{ title: 'BMI Calculator',   drawerItemStyle: { display:
  'none' } }} />
          <Drawer.Screen name="more"             options={{ drawerItemStyle: { display: 'none' } }} />
          <Drawer.Screen name="ai-coach"         options={{ headerShown: false, drawerItemStyle: { display: 'none' } }} />
        </Drawer>
      </GestureHandlerRootView>
    );
  }
