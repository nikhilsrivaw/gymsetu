import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, AppStateStatus } from 'react-native';

// ── Env validation — fail fast with clear error ───────────────
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[Supabase] Missing environment variables.\n' +
    'Ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set in your .env file.'
  );
}

// ── Client ────────────────────────────────────────────────────
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'x-app-name': 'gymsetu-mobile',
    },
  },
});

// ── Auto-refresh token on app foreground ─────────────────────
const handleAppStateChange = (state: AppStateStatus) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
};

const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

// Export cleanup for if needed (e.g. in tests)
export const cleanupSupabase = () => {
  appStateSubscription.remove();
};