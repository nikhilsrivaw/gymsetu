 import { Drawer } from 'expo-router/drawer';                       import { GestureHandlerRootView } from                           
  'react-native-gesture-handler';                                  
  import { StatusBar } from 'react-native';
  import { Colors } from '@/constants/colors';
  import MemberDrawer from '@/components/MemberDrawer';

  export default function MemberLayout() {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Drawer
          drawerContent={(props) => <MemberDrawer {...props} />}   
          screenOptions={{
            headerStyle: { backgroundColor: Colors.bg, elevation:  
  0, shadowOpacity: 0 },
            headerTintColor: Colors.text,
            headerTitleStyle: { fontWeight: '600', fontSize: 18 }, 
            headerShadowVisible: false,
            headerStatusBarHeight: StatusBar.currentHeight ?? 24,  
            drawerStyle: { backgroundColor: Colors.bgCard, width:  
  280 },
          }}
        >
          <Drawer.Screen name="home" options={{ title: 'Home', headerShown: false }} />
          <Drawer.Screen name="fitness" options={{ title: '⚡ Fitness' }} />
          <Drawer.Screen name="schedule" options={{ title: '📅 Classes' }} />
          <Drawer.Screen name="my-payments" options={{ title: '💳 My Payments' }} />
          <Drawer.Screen name="my-plan" options={{ title: '📋 My  Plan' }} />
          <Drawer.Screen name="gym-info" options={{ title: '🏢 Gym Info' }} />
          <Drawer.Screen name="feedback" options={{ title: '⭐ Feedback' }} />
          <Drawer.Screen name="profile" options={{ title: '👤 Profile' }} />

          <Drawer.Screen name="workout-tracker" options={{ title:  
  '📝 Workout Tracker', drawerItemStyle: { display: 'none' } }} /> 
          <Drawer.Screen name="body-progress" options={{ title: '📊Body Progress', drawerItemStyle: { display: 'none' } }} />      
          <Drawer.Screen name="diet-plan" options={{ title: '🥗  Diet Plan', drawerItemStyle: { display: 'none' } }} />
          <Drawer.Screen name="exercise-library" options={{ title: 
  '📚 Exercise Library', drawerItemStyle: { display: 'none' } }} />
          <Drawer.Screen name="rest-timer" options={{ title: '⏱️  Rest Timer', drawerItemStyle: { display: 'none' } }} />
          <Drawer.Screen name="bmi-calculator" options={{ title:   
  '⚖️ BMI Calculator', drawerItemStyle: { display: 'none' } }} />  
          <Drawer.Screen name="more" options={{ drawerItemStyle: { display: 'none' } }} />
        </Drawer>
      </GestureHandlerRootView>
    );
  }
