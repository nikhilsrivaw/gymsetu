import { Redirect } from 'expo-router';

// TODO: Revert this when Supabase is back up
// import { useAuthStore } from '@/store/authStore';
// export default function Index() {
//   const { session, profile } = useAuthStore();
//   if (!session) return <Redirect href="/(auth)/login" />;
//   if (profile?.role === 'gym_owner') return <Redirect href="/(owner)/dashboard" />;
//   return <Redirect href="/(auth)/login" />;
// }

export default function Index() {
  // return <Redirect href="/(member)/home" />;
    return <Redirect href="/(trainer)/home" />;  
}
