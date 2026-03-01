                                                                   import { Drawer } from 'expo-router/drawer';                       import { GestureHandlerRootView } from                             'react-native-gesture-handler';                                  
  import { StatusBar } from 'react-native';                          import { Colors } from '@/constants/colors';                     
import TrainerDrawer from '@/components/TrainerDrawer';
//   import TrainerDrawer from '@/components/TrainerDrawer';          
                                                                     export default function TrainerLayout() {                        
    return (                                                       
      <GestureHandlerRootView style={{ flex: 1 }}>                 
        <Drawer
          drawerContent={(props) => <TrainerDrawer {...props} />}  
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
          <Drawer.Screen name="home" options={{ title: 'Home',     
  headerShown: false }} />
          <Drawer.Screen name="my-members" options={{ title: '👥 MyMembers' }} />
          <Drawer.Screen name="schedule" options={{ title: '📅 Schedule' }} />
          <Drawer.Screen name="workout-plans" options={{ title: ' Workout Plans' }} />
          <Drawer.Screen name="attendance" options={{ title: '✅  Attendance' }} />
          <Drawer.Screen name="progress-log" options={{ title: '📈Progress Log' }} />
          <Drawer.Screen name="profile" options={{ title: '👤 My  Profile' }} />

          {/* Hidden — accessed from within other screens */}      
          <Drawer.Screen name="member-detail" options={{ title: 'Member Detail', drawerItemStyle: { display: 'none' } }} />      
        </Drawer>
      </GestureHandlerRootView>
    );
  }