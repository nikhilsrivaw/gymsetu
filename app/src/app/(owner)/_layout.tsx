import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Redirect } from 'expo-router';
  import { useAuthStore } from '@/store/authStore';
  import { View, ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/colors';

export default function OwnerLayout() {
  const insets = useSafeAreaInsets();
    const { profile, isLoading } = useAuthStore();
  if (isLoading) return <View style={{ flex: 1, backgroundColor: Colors.bg, justifyContent: 'center',
  alignItems: 'center' }}><ActivityIndicator color={Colors.accent} /></View>;
  if (!profile || profile.role !== 'gym_owner') return <Redirect href="/" />;
  

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: Colors.bg, elevation: 0, shadowOpacity: 0 },
        headerTintColor: Colors.text,
        headerTitleStyle: { fontWeight: '600', fontSize: 18 },
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: Colors.bgCard,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          height: 64 + insets.bottom,
          paddingBottom: insets.bottom + 6,
          paddingTop: 8,
        },
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500', marginTop: 1 },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons name={focused ? 'home-variant' : 'home-variant-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="members"
        options={{
          title: 'Members',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons name={focused ? 'account-group' : 'account-group-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="plans"
        options={{
          title: 'Plans',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons name={focused ? 'card-account-details' : 'card-account-details-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          title: 'Payments',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons name={focused ? 'wallet' : 'wallet-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="dots-horizontal" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
