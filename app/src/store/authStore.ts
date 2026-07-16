import { create } from 'zustand';
import { Session, AuthChangeEvent, Subscription } from '@supabase/supabase-js';
import { uploadImageToSupabase } from '@/lib/uploadImage';
import { supabase } from '@/lib/supabase';
import { Profile, GymSubscription, SubscriptionTokens } from '@/types/database';

// ── Types ─────────────────────────────────────────────────────
interface BranchSummary {
  id: string;
  name: string;
  branch_code: string | null;
  branch_city: string | null;
  is_branch: boolean;
}

export interface GymProfile {
  id: string;
  name: string;
  logo_url: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  gstin: string | null;   // set ⇒ invoices render as Tax Invoice, not Receipt
}

export interface TokenBalance {
  total: number;
  used: number;
  remaining: number;
  monthYear: string;
}

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  gymProfile: GymProfile | null;
  subscription: GymSubscription | null;
  tokenBalance: TokenBalance | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  activeGymId: string | null;
  branches: BranchSummary[];

  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: string | null; role?: string }>;
  signUp: (email: string, password: string, fullName: string, gymName: string) => Promise<{ error: string | null }>;
  completeOwnerSetup: (fullName: string, gymName: string, logoUri: string | null, description: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  fetchBranches: () => Promise<void>;
  fetchGymProfile: () => Promise<void>;
  fetchSubscription: () => Promise<void>;
  spendTokens: (amount?: number, feature?: string) => Promise<{ error: string | null; remaining?: number }>;
  setActiveGym: (gymId: string) => void;
  clearError: () => void;
}

// ── Helpers ───────────────────────────────────────────────────
function currentMonthYear(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function tokensForPlan(plan: string | undefined | null): number {
  switch (plan) {
    case 'pro':      return 500;
    case 'pro_plus': return 1000;
    case 'pro_max':  return 2000;
    default:         return 0;
  }
}

// ── Singleton auth subscription ───────────────────────────────
let authSubscription: Subscription | null = null;

// ── Store ─────────────────────────────────────────────────────
export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  gymProfile: null,
  subscription: null,
  tokenBalance: null,
  isLoading: true,
  isInitialized: false,
  error: null,
  activeGymId: null,
  branches: [],

  clearError: () => set({ error: null }),

  // ── Initialize ─────────────────────────────────────────────
  initialize: async () => {
    if (get().isInitialized) return;

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;

      set({ session });

      if (session) {
        await get().fetchProfile();
        const isOwner = get().profile?.role === 'gym_owner';
        await Promise.all([
          get().fetchBranches(),
          get().fetchGymProfile(),
          ...(isOwner ? [get().fetchSubscription()] : []),
        ]);
      }
    } catch (err: any) {
      console.error('[AuthStore] initialize error:', err.message);
      set({ error: err.message });
    } finally {
      set({ isLoading: false, isInitialized: true });
    }

    if (authSubscription) authSubscription.unsubscribe();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session) => {
        set({ session });

        if (event === 'SIGNED_OUT') {
          set({
            profile: null, gymProfile: null,
            subscription: null, tokenBalance: null,
            activeGymId: null, branches: [],
            error: null,
          });
          return;
        }

        if (session && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
          await get().fetchProfile();
          const isOwner = get().profile?.role === 'gym_owner';
          await Promise.all([
            get().fetchBranches(),
            get().fetchGymProfile(),
            ...(isOwner ? [get().fetchSubscription()] : []),
          ]);
        }
      }
    );

    authSubscription = subscription;
  },

  // ── Fetch Profile ──────────────────────────────────────────
  fetchProfile: async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, gym_id, phone, avatar_url, member_code, height_cm, target_weight, created_at')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return;

      set({ profile: data as Profile });
      if (!get().activeGymId && (data as any).gym_id) {
        set({ activeGymId: (data as any).gym_id });
      }
    } catch (err: any) {
      console.error('[AuthStore] fetchProfile error:', err.message);
    }
  },

  // ── Fetch Gym Profile ──────────────────────────────────────
  fetchGymProfile: async () => {
    try {
      const gymId = (get().profile as any)?.gym_id;
      if (!gymId) return;

      const { data, error } = await supabase
        .from('gyms')
        .select('id, name, logo_url, phone, email, address, gstin')
        .eq('id', gymId)
        .maybeSingle();

      if (error) throw error;
      if (data) set({ gymProfile: data as GymProfile });
    } catch (e: any) {
      if (e?.name === 'AbortError') return;
      console.error('[AuthStore] fetchGymProfile error:', e.message);
    }
  },

  // ── Fetch Branches ─────────────────────────────────────────
  fetchBranches: async () => {
    try {
      const gymId = (get().profile as any)?.gym_id;
      if (!gymId) return;

      const { data, error } = await supabase
        .from('gyms')
        .select('id, name, branch_code, branch_city, is_branch, parent_gym_id')
        .or(`id.eq.${gymId},parent_gym_id.eq.${gymId}`)
        .order('is_branch', { ascending: true });

      if (error) throw error;
      if (data) set({ branches: data as BranchSummary[] });
    } catch (err: any) {
      console.error('[AuthStore] fetchBranches error:', err.message);
    }
  },

  // ── Fetch Subscription ─────────────────────────────────────
  fetchSubscription: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: sub, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subError) throw subError;
      set({ subscription: sub as GymSubscription | null });

      // Fetch token balance for current month (Pro tiers only)
      const planTokens = tokensForPlan(sub?.plan);
      if (sub && planTokens > 0 && sub.status !== 'expired' && sub.status !== 'cancelled') {
        const gymId = (get().profile as any)?.gym_id;
        if (!gymId) return;

        const monthYear = currentMonthYear();
        const { data: tokens } = await supabase
          .from('subscription_tokens')
          .select('*')
          .eq('gym_id', gymId)
          .eq('month_year', monthYear)
          .maybeSingle();

        if (tokens) {
          set({
            tokenBalance: {
              total: tokens.tokens_total,
              used: tokens.tokens_used,
              remaining: tokens.tokens_total - tokens.tokens_used,
              monthYear,
            },
          });
        } else {
          // No record yet this month — treat as full balance
          set({
            tokenBalance: { total: planTokens, used: 0, remaining: planTokens, monthYear },
          });
        }
      } else {
        set({ tokenBalance: null });
      }
    } catch (err: any) {
      console.error('[AuthStore] fetchSubscription error:', err.message);
    }
  },

  // ── Spend Tokens ───────────────────────────────────────────
  spendTokens: async (amount = 1, feature = 'unknown') => {
    try {
      const gymId = (get().profile as any)?.gym_id;
      if (!gymId) return { error: 'No gym found' };

      const sub = get().subscription;
      const planTotal = tokensForPlan(sub?.plan);
      if (!sub || planTotal === 0) return { error: 'Pro plan required' };

      const balance = get().tokenBalance;
      const remaining = balance?.remaining ?? 0;
      if (remaining < amount) return { error: 'Insufficient tokens' };

      const monthYear = currentMonthYear();
      const total = balance?.total ?? planTotal;
      const newUsed = (balance?.used ?? 0) + amount;

      const { error } = await supabase
        .from('subscription_tokens')
        .upsert(
          { gym_id: gymId, month_year: monthYear, tokens_total: total, tokens_used: newUsed },
          { onConflict: 'gym_id,month_year' }
        );

      if (error) return { error: error.message };

      // Log usage to token_usage_log for breakdown tracking (non-blocking)
      try {
        await supabase.from('token_usage_log').insert({
          gym_id: gymId,
          feature,
          tokens_spent: amount,
        });
      } catch {}

      const newBalance = { total, used: newUsed, remaining: total - newUsed, monthYear };
      set({ tokenBalance: newBalance });
      return { error: null, remaining: newBalance.remaining };
    } catch (err: any) {
      return { error: err.message };
    }
  },

  // ── Set Active Gym ─────────────────────────────────────────
  setActiveGym: (gymId: string) => set({ activeGymId: gymId }),

  // ── Sign In ────────────────────────────────────────────────
  signIn: async (email, password) => {
    try {
      set({ isLoading: true, error: null });

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        const msg = error.message.includes('Invalid login credentials')
          ? 'Invalid email or password'
          : error.message;
        set({ error: msg });
        return { error: msg };
      }

      if (!data.session) {
        return { error: 'Sign in failed — no session returned' };
      }

      set({ session: data.session });
      await get().fetchProfile();
      const isOwner = get().profile?.role === 'gym_owner';
      await Promise.all([
        get().fetchBranches(),
        get().fetchGymProfile(),
        ...(isOwner ? [get().fetchSubscription()] : []),
      ]);

      return { error: null, role: get().profile?.role };
    } catch (err: any) {
      const msg = 'Sign in failed. Please try again.';
      set({ error: msg });
      return { error: msg };
    } finally {
      set({ isLoading: false });
    }
  },

  // ── Sign Up ────────────────────────────────────────────────
  signUp: async (email, password, fullName, gymName) => {
    try {
      set({ isLoading: true, error: null });

      if (!email.trim() || !password || !fullName.trim() || !gymName.trim()) {
        return { error: 'All fields are required' };
      }
      if (password.length < 8) {
        return { error: 'Password must be at least 8 characters' };
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
      });

      if (authError) return { error: authError.message };
      if (!authData.user) return { error: 'Registration failed — no user returned' };
      if (!authData.session) return { error: 'Email confirmation is enabled — please disable it in Supabase Auth settings for now.' };

      const userId = authData.user.id;

      const { data: gymData, error: gymError } = await supabase
        .from('gyms')
        .insert({ name: gymName.trim(), owner_id: userId, is_branch: false })
        .select('id')
        .single();

      if (gymError) {
        await supabase.auth.admin?.deleteUser(userId);
        return { error: `Gym creation failed: ${gymError.message}` };
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          role: 'gym_owner',
          gym_id: gymData.id,
        });

      if (profileError) {
        return { error: `Profile creation failed: ${profileError.message}` };
      }

      set({ session: authData.session });
      await get().fetchProfile();
      await Promise.all([
        get().fetchBranches(),
        get().fetchGymProfile(),
        get().fetchSubscription(),
      ]);

      return { error: null };
    } catch (err: any) {
      return { error: 'Registration failed. Please try again.' };
    } finally {
      set({ isLoading: false });
    }
  },

  // ── Complete Owner Setup ────────────────────────────────────
  completeOwnerSetup: async (fullName, gymName, logoUri, description) => {
    try {
      set({ isLoading: true });

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) return { error: 'No active session. Please sign in again.' };

      let logoUrl: string | null = null;
      if (logoUri) {
        try {
          const ext  = logoUri.split('.').pop()?.split('?')[0] ?? 'jpg';
          const path = `${user.id}/logo.${ext}`;
          logoUrl = await uploadImageToSupabase(logoUri, 'gym-logos', path);
        } catch (uploadErr) {
          console.warn('[AuthStore] Logo upload skipped:', uploadErr);
        }
      }

      const { data: gymData, error: gymError } = await supabase
        .from('gyms')
        .insert({ name: gymName.trim(), owner_id: user.id, is_branch: false, description: description.trim() || null })
        .select('id')
        .single();
      if (gymError) return { error: `Gym creation failed: ${gymError.message}` };

      if (logoUrl) {
        await supabase.from('gyms').update({ logo_url: logoUrl }).eq('id', gymData.id);
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id:        user.id,
          full_name: fullName.trim(),
          email:     user.email ?? null,
          role:      'gym_owner',
          gym_id:    gymData.id,
        }, { onConflict: 'id' });
      if (profileError) return { error: `Profile creation failed: ${profileError.message}` };

      await get().fetchProfile();
      await Promise.all([
        get().fetchBranches(),
        get().fetchGymProfile(),
        get().fetchSubscription(),
      ]);

      return { error: null };
    } catch (e: any) {
      return { error: e.message ?? 'Setup failed. Please try again.' };
    } finally {
      set({ isLoading: false });
    }
  },

  // ── Sign Out ───────────────────────────────────────────────
  signOut: async () => {
    try {
      set({ isLoading: true });
      await supabase.auth.signOut();
      set({
        session: null,
        profile: null,
        gymProfile: null,
        subscription: null,
        tokenBalance: null,
        activeGymId: null,
        branches: [],
        error: null,
        // keep isInitialized: true so index.tsx doesn't spin forever
      });
    } catch (err: any) {
      console.error('[AuthStore] signOut error:', err.message);
    } finally {
      set({ isLoading: false });
    }
  },
}));
