import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types/database';

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string, gymName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  fetchProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  isLoading: true,

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    set({ session });

    if (session) {
      await get().fetchProfile();
    }

    set({ isLoading: false });

    supabase.auth.onAuthStateChange(async (_event, session) => {
      set({ session });
      if (session) {
        await get().fetchProfile();
      } else {
        set({ profile: null });
      }
    });
  },

  fetchProfile: async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', get().session?.user.id)
      .single();

    if (data) {
      set({ profile: data as Profile });
    }
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  },

  signUp: async (email, password, fullName, gymName) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) return { error: authError.message };
      if (!authData.user) return { error: 'Registration failed' };
      if (!authData.session) {
        return { error: 'No session returned. Disable "Confirm email" in Supabase Auth settings.' };
      }

      const userId = authData.user.id;

      const { data: gymData, error: gymError } = await supabase
        .from('gyms')
        .insert({ name: gymName, owner_id: userId })
        .select()
        .single();

      if (gymError) return { error: `Gym creation failed: ${gymError.message}` };

      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          gym_id: gymData.id,
          role: 'gym_owner',
          full_name: fullName,
        });

      if (profileError) return { error: `Profile creation failed: ${profileError.message}` };

      return { error: null };
    } catch (e: any) {
      return { error: e.message || 'An unexpected error occurred' };
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, profile: null });
  },
}));
