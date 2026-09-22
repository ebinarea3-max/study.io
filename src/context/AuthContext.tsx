'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { UserProfile } from '../types';
import { INITIAL_USER, cleanupLegacyDemoData } from '../lib/mockData';
import { getSupabase } from '../lib/supabase';
import { getCurrentSeasonId } from '../lib/rankedSystem';

export type StoredAccount = {
  id: string;
  email: string;
  password: string;
  displayName: string;
  avatarUrl: string;
  createdAt: string;
};

interface AuthContextType {
  user: UserProfile;
  isAuthenticated: boolean;
  isLoading: boolean;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name?: string) => Promise<void>;
  loginWithEmail: (email: string, pass: string, name?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => void;
  logout: () => void;
  resetAllData: () => void;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Helper to persist to localStorage
  const saveUser = useCallback((newUser: UserProfile) => {
    setUser(newUser);
    try {
      localStorage.setItem('studypulse_active_user', JSON.stringify(newUser));
    } catch {
      // ignore
    }
  }, []);

  // Fetch or create profile row in Supabase
  const syncSupabaseProfile = useCallback(async (supabase: ReturnType<typeof getSupabase>, authUser: { id: string; email?: string; user_metadata?: Record<string, unknown> }) => {
    if (!supabase || !authUser?.id) return;

    // Immediately extract user_metadata for stable, zero-flicker UI
    const metaAvatar = (authUser.user_metadata?.avatar_url as string) || (authUser.user_metadata?.picture as string) || '';
    const metaName = (authUser.user_metadata?.full_name as string) || (authUser.user_metadata?.name as string) || (authUser.user_metadata?.display_name as string) || authUser.email?.split('@')[0] || 'Focus Scholar';

    setUser(prev => {
      const merged: UserProfile = {
        ...prev,
        id: authUser.id,
        email: authUser.email || prev.email || '',
        displayName: metaName || prev.displayName,
        avatarUrl: metaAvatar || prev.avatarUrl,
        user_metadata: authUser.user_metadata,
      };
      try { localStorage.setItem('studypulse_active_user', JSON.stringify(merged)); } catch {}
      return merged;
    });

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      // Compute total accumulated study minutes across all rows in study_sessions for the current user
      const { data: dbSessions } = await supabase
        .from('study_sessions')
        .select('id, user_id, subject_id, duration_seconds, started_at, ended_at, notes, mode')
        .eq('user_id', authUser.id);

      // Also check local storage sessions in case offline / pending sessions exist
      let localSessionSeconds = 0;
      try {
        const rawSess = localStorage.getItem(`study_io_sessions_${authUser.id}`) || localStorage.getItem('studypulse_sessions');
        if (rawSess) {
          const parsed = JSON.parse(rawSess);
          if (Array.isArray(parsed)) {
            localSessionSeconds = parsed.reduce((acc: number, s: any) => acc + (Number(s.durationSeconds ?? s.duration_seconds ?? 0)), 0);
          }
        }
      } catch {}

      const dbSessionSeconds = dbSessions
        ? dbSessions.reduce((acc, s: any) => acc + (Number(s.duration_seconds ?? 0)), 0)
        : 0;

      const totalStudySeconds = Math.max(dbSessionSeconds, localSessionSeconds, Number(profile?.total_study_seconds ?? 0));
      const totalRankedMinutes = Math.floor(totalStudySeconds / 60);
      const calculatedRP = totalRankedMinutes * 10;
      const currentProfileRP = Number(profile?.rp ?? profile?.season_rp ?? 0);
      const syncedRP = Math.max(calculatedRP, currentProfileRP);
      const calculatedLevel = Math.max(1, Math.floor(Math.sqrt(Math.max(0, syncedRP) / 100)) + 1);

      // Only update valid columns (level) if level increased
      if (calculatedLevel > (profile?.level || 1) && authUser.id && !authUser.id.startsWith('user-scholar')) {
        try {
          await supabase.from('profiles').update({ level: calculatedLevel }).eq('id', authUser.id);
        } catch (e) {
          console.warn('Failed to sync level to Supabase profile:', e);
        }
      }

      let storedStreakBonusDate: string | undefined;
      try {
        storedStreakBonusDate = localStorage.getItem('studypulse_last_streak_bonus_date') || undefined;
      } catch {}

      const streakBonusDate = profile?.last_streak_bonus_date || storedStreakBonusDate;

      if (profile) {
        setUser(prev => {
          const synced: UserProfile = {
            id: profile.id,
            email: authUser.email || prev.email || '',
            displayName: profile.name || metaName || prev.displayName,
            avatarUrl: profile.avatar_url || metaAvatar || prev.avatarUrl,
            dailyGoalHours: Number(profile.daily_goal_hours ?? prev.dailyGoalHours ?? 4.0),
            streakDays: Number(profile.streak_days ?? prev.streakDays ?? 0),
            level: Number(profile.level ?? prev.level ?? 1),
            xp: Number(profile.xp ?? prev.xp ?? 0),
            currentSeasonId: profile.current_season_id || prev.currentSeasonId || getCurrentSeasonId(),
            seasonRp: syncedRP,
            rp: syncedRP,
            last_streak_bonus_date: streakBonusDate || prev.last_streak_bonus_date,
            lastStreakBonusDate: streakBonusDate || prev.last_streak_bonus_date,
            last_seen_level: Number((profile as Record<string, unknown>).last_seen_level ?? prev.last_seen_level ?? prev.level ?? 1),
            totalStudySeconds: totalStudySeconds,
            status: prev.status || 'resting',
            createdAt: profile.created_at || prev.createdAt || new Date().toISOString(),
            user_metadata: {
              ...(authUser.user_metadata || {}),
              level: Number(profile.level ?? calculatedLevel),
              levelTitle: profile.level_title || prev.levelTitle,
            },
          };
          try { localStorage.setItem('studypulse_active_user', JSON.stringify(synced)); } catch {}
          return synced;
        });
      } else {
        await supabase.from('profiles').upsert({
          id: authUser.id,
          name: metaName,
          avatar_url: metaAvatar || null,
          rp: syncedRP,
          season_rp: syncedRP,
          total_study_seconds: totalStudySeconds,
        });
      }
    } catch {
      // fallback
    }
  }, []);

  // Clean legacy demo data and setup Supabase Auth Listener
  useEffect(() => {
    let isSubscribed = true;
    cleanupLegacyDemoData();

    // Check local storage initial state
    try {
      const savedAuth = localStorage.getItem('studypulse_is_authenticated');
      if (savedAuth === 'true') {
        setIsAuthenticated(true);
      }
      const saved = localStorage.getItem('studypulse_active_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          if (!parsed.user_metadata) parsed.user_metadata = {};
          if (parsed.level && !parsed.user_metadata.level) {
            parsed.user_metadata.level = parsed.level;
          }
          if (parsed.levelTitle && !parsed.user_metadata.levelTitle) {
            parsed.user_metadata.levelTitle = parsed.levelTitle;
          }
        }
        setUser(parsed);
      } else {
        setUser(INITIAL_USER);
      }
    } catch {
      setUser(INITIAL_USER);
    }

    const supabase = getSupabase();
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    // If currently on /auth/callback route, keep isLoading true while the server exchanges the code
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/auth/callback')) {
      return () => {
        isSubscribed = false;
      };
    }

    // Check current active session in Supabase
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isSubscribed) return;
      if (session?.user) {
        setIsAuthenticated(true);
        try { localStorage.setItem('studypulse_is_authenticated', 'true'); } catch {}
        await syncSupabaseProfile(supabase, session.user);
      }
      if (isSubscribed) {
        setIsLoading(false);
      }
    }).catch(() => {
      if (isSubscribed) {
        setIsLoading(false);
      }
    });

    // Listen to real-time auth changes (Sign In, Sign Out, Token Refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isSubscribed) return;
      if (session?.user) {
        setIsAuthenticated(true);
        try {
          localStorage.setItem('studypulse_is_authenticated', 'true');
          localStorage.removeItem(`study_io_selected_subject_${session.user.id}`);
          localStorage.removeItem('study_io_selected_subject_guest');
          localStorage.removeItem('studypulse_selected_subject_id');
        } catch {}
        await syncSupabaseProfile(supabase, session.user);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('studypulse:auth-changed', { detail: { session } }));
        }
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setUser(INITIAL_USER);
        try {
          localStorage.removeItem('studypulse_is_authenticated');
          localStorage.removeItem('studypulse_active_user');
          localStorage.removeItem('study_io_selected_subject_guest');
          localStorage.removeItem('studypulse_selected_subject_id');
        } catch {}
      }
      if (isSubscribed) {
        setIsLoading(false);
      }
    });

    return () => {
      isSubscribed = false;
      subscription.unsubscribe();
    };
  }, [syncSupabaseProfile]);

  const getStoredAccounts = (): Record<string, StoredAccount> => {
    try {
      const raw = localStorage.getItem('studyio_registered_accounts');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  };

  const saveStoredAccount = (acc: StoredAccount) => {
    try {
      const accounts = getStoredAccounts();
      accounts[acc.email.toLowerCase()] = acc;
      localStorage.setItem('studyio_registered_accounts', JSON.stringify(accounts));
    } catch {
      // ignore
    }
  };


  // Sign Up: Requires valid email, min 6 char password
  const signUpWithEmail = useCallback(async (email: string, pass: string, name?: string) => {
    setIsLoading(true);
    const normalizedEmail = email.toLowerCase().trim();

    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      setIsLoading(false);
      throw new Error('Please enter a valid email address.');
    }

    if (!pass || pass.length < 6) {
      setIsLoading(false);
      throw new Error('Password must be at least 6 characters long.');
    }

    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password: pass,
          options: { data: { display_name: name || normalizedEmail.split('@')[0] } },
        });

        if (error) {
          setIsLoading(false);
          throw new Error(formatAuthError(error));
        }

        if (data?.user) {
          // Explicitly save name into profiles table
          try {
            await supabase.from('profiles').upsert({
              id: data.user.id,
              name: name?.trim() || normalizedEmail.split('@')[0],
              avatar_url: null,
            });
          } catch {
            // ignore
          }

          await syncSupabaseProfile(supabase, data.user);
          setIsAuthenticated(true);
          try { localStorage.setItem('studypulse_is_authenticated', 'true'); } catch {}
          setIsLoading(false);
          return;
        }
      } catch (err: unknown) {
        setIsLoading(false);
        throw new Error(formatAuthError(err));
      }
    }

    // Local Accounts Storage Fallback
    const accounts = getStoredAccounts();
    if (accounts[normalizedEmail]) {
      setIsLoading(false);
      throw new Error('An account with this email already exists. Please sign in.');
    }

    const newAccount: StoredAccount = {
      id: `user-${Date.now()}`,
      email: normalizedEmail,
      password: pass,
      displayName: name?.trim() || normalizedEmail.split('@')[0],
      avatarUrl: '',
      createdAt: new Date().toISOString(),
    };
    saveStoredAccount(newAccount);

    const newProfile: UserProfile = {
      id: newAccount.id,
      email: newAccount.email,
      displayName: newAccount.displayName,
      avatarUrl: newAccount.avatarUrl,
      dailyGoalHours: 4.0,
      streakDays: 0,
      level: 1,
      totalStudySeconds: 0,
      status: 'resting',
      createdAt: newAccount.createdAt,
    };
    saveUser(newProfile);
    setIsAuthenticated(true);
    try { localStorage.setItem('studypulse_is_authenticated', 'true'); } catch {}
    setIsLoading(false);
  }, [syncSupabaseProfile, saveUser]);

  // Sign In: Validates password and email
  const signInWithEmail = useCallback(async (email: string, pass: string) => {
    setIsLoading(true);
    const normalizedEmail = email.toLowerCase().trim();

    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      setIsLoading(false);
      throw new Error('Please enter a valid email address.');
    }

    if (!pass) {
      setIsLoading(false);
      throw new Error('Please enter your password.');
    }

    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password: pass,
        });

        if (error) {
          setIsLoading(false);
          throw new Error('Invalid email or password. Please try again.');
        }

        if (data?.user) {
          await syncSupabaseProfile(supabase, data.user);
          setIsAuthenticated(true);
          try { localStorage.setItem('studypulse_is_authenticated', 'true'); } catch {}
          setIsLoading(false);
          return;
        }
      } catch (err: unknown) {
        setIsLoading(false);
        const message = err instanceof Error ? err.message : 'Invalid credentials';
        throw new Error(message);
      }
    }

    // Local Accounts Verification Fallback
    const accounts = getStoredAccounts();
    const existing = accounts[normalizedEmail];

    if (!existing) {
      setIsLoading(false);
      throw new Error('No account found with this email. Please click "Create one" to sign up.');
    }

    if (existing.password !== pass) {
      setIsLoading(false);
      throw new Error('Incorrect password. Please verify your password and try again.');
    }

    setUser(prev => {
      const updatedProfile: UserProfile = {
        ...prev,
        id: existing.id,
        email: existing.email,
        displayName: existing.displayName,
        avatarUrl: existing.avatarUrl,
        status: 'resting',
      };
      try { localStorage.setItem('studypulse_active_user', JSON.stringify(updatedProfile)); } catch {}
      return updatedProfile;
    });
    setIsAuthenticated(true);
    try { localStorage.setItem('studypulse_is_authenticated', 'true'); } catch {}
    setIsLoading(false);
  }, [syncSupabaseProfile]);

  const loginWithEmail = useCallback(async (email: string, pass: string, name?: string) => {
    if (name) {
      await signUpWithEmail(email, pass, name);
    } else {
      await signInWithEmail(email, pass);
    }
  }, [signUpWithEmail, signInWithEmail]);

  const loginWithGoogle = useCallback(async () => {
    setIsLoading(true);
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: typeof window !== 'undefined'
              ? `${window.location.origin}/auth/callback?next=/dashboard`
              : undefined,
          },
        });
        if (error) throw error;
        return;
      } catch (err) {
        setIsLoading(false);
        throw err;
      }
    }

    // Local development fallback
    setUser(prev => {
      const googleProfile: UserProfile = {
        ...prev,
        id: 'google-user-' + Math.floor(Math.random() * 10000),
        email: 'user.google@gmail.com',
        displayName: 'Google Scholar',
        avatarUrl: '',
      };
      try { localStorage.setItem('studypulse_active_user', JSON.stringify(googleProfile)); } catch {}
      return googleProfile;
    });
    setIsAuthenticated(true);
    try { localStorage.setItem('studypulse_is_authenticated', 'true'); } catch {}
    setIsLoading(false);
  }, []);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setUser(prev => {
      // Guard against unnecessary state updates & render loops
      let hasChanges = false;
      for (const [key, val] of Object.entries(updates)) {
        if ((prev as any)[key] !== val) {
          hasChanges = true;
          break;
        }
      }
      if (!hasChanges) return prev;

      const updated: UserProfile = {
        ...prev,
        ...updates,
      };

      if (updates.level !== undefined) {
        updated.level = updates.level;
      } else if (updates.xp !== undefined) {
        updated.level = Math.max(1, Math.floor(Math.sqrt(Math.max(0, updates.xp) / 100)) + 1);
      }

      updated.user_metadata = {
        ...(prev.user_metadata || {}),
        ...(updates.user_metadata || {}),
        level: updated.level,
        levelTitle: updated.levelTitle || (prev.user_metadata as any)?.levelTitle,
      };

      try {
        localStorage.setItem('studypulse_active_user', JSON.stringify(updated));
      } catch {}

      // Only send valid columns in the update payload to Supabase:
      // (name, avatar_url, daily_goal_hours, streak_days, level)
      // and query against 'id' as the primary key: .from('profiles').update(updates).eq('id', user.id)
      const supabase = getSupabase();
      if (supabase && prev.id && !prev.id.startsWith('user-scholar') && !prev.id.startsWith('guest')) {
        const payload: Record<string, any> = {};

        if (updates.displayName !== undefined && updates.displayName !== prev.displayName) {
          payload.name = updates.displayName.trim();
        }
        if (updates.avatarUrl !== undefined && updates.avatarUrl !== prev.avatarUrl) {
          payload.avatar_url = updates.avatarUrl || null;
        }
        if (updates.dailyGoalHours !== undefined && Number(updates.dailyGoalHours) !== Number(prev.dailyGoalHours)) {
          payload.daily_goal_hours = Number(updates.dailyGoalHours);
        }
        if (updates.streakDays !== undefined && Number(updates.streakDays) !== Number(prev.streakDays)) {
          payload.streak_days = Number(updates.streakDays);
        }
        if (updates.level !== undefined && Number(updates.level) !== Number(prev.level)) {
          payload.level = Number(updates.level);
        }

        if (Object.keys(payload).length > 0) {
          supabase
            .from('profiles')
            .update(payload)
            .eq('id', prev.id)
            .then(({ error }) => {
              if (error) {
                console.warn('[AuthContext] Profile update error:', error);
              }
            });
        }
      }

      return updated;
    });
  }, []);

  const logout = useCallback(async () => {
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore
      }
    }
    saveUser(INITIAL_USER);
    setIsAuthenticated(false);
    try {
      localStorage.removeItem('studypulse_is_authenticated');
      localStorage.removeItem('studypulse_active_user');
    } catch {}
  }, [saveUser]);

  const resetAllData = useCallback(async () => {
    const supabase = getSupabase();
    setUser(prev => {
      if (supabase && prev.id) {
        try {
          supabase.from('study_sessions').delete().eq('user_id', prev.id).then();
          supabase.from('todos').delete().eq('user_id', prev.id).then();
        } catch {
          // ignore
        }
      }
      return INITIAL_USER;
    });

    try {
      localStorage.removeItem('studypulse_active_user');
      localStorage.removeItem('studypulse_is_authenticated');
      localStorage.removeItem('studypulse_sessions');
      localStorage.removeItem('studypulse_todos');
      localStorage.removeItem('studypulse_subjects');
      localStorage.removeItem('studyio_registered_accounts');
    } catch {
      // ignore
    }
    saveUser(INITIAL_USER);
    setIsAuthenticated(false);
  }, [saveUser]);

  const deleteAccount = useCallback(async () => {
    setIsLoading(true);
    const supabase = getSupabase();
    setUser(prev => {
      if (supabase && prev.id) {
        try {
          supabase.from('study_sessions').delete().eq('user_id', prev.id).then();
          supabase.from('todos').delete().eq('user_id', prev.id).then();
          supabase.from('subjects').delete().eq('user_id', prev.id).then();
          supabase.from('room_presence').delete().eq('user_id', prev.id).then();
          supabase.from('profiles').delete().eq('id', prev.id).then();
          supabase.auth.signOut().then();
        } catch {
          // ignore
        }
      }
      if (prev.email) {
        const accounts = getStoredAccounts();
        if (accounts[prev.email.toLowerCase()]) {
          delete accounts[prev.email.toLowerCase()];
          try {
            localStorage.setItem('studyio_registered_accounts', JSON.stringify(accounts));
          } catch {}
        }
      }
      return INITIAL_USER;
    });

    try {
      localStorage.removeItem('studypulse_active_user');
      localStorage.removeItem('studypulse_is_authenticated');
      localStorage.removeItem('studypulse_sessions');
      localStorage.removeItem('studypulse_todos');
      localStorage.removeItem('studypulse_subjects');
      localStorage.removeItem('studypulse_selected_subject');
      localStorage.removeItem('studypulse_custom_rooms');
    } catch {
      // ignore
    }

    saveUser(INITIAL_USER);
    setIsAuthenticated(false);
    setIsLoading(false);
  }, [saveUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        signInWithEmail,
        signUpWithEmail,
        loginWithEmail,
        loginWithGoogle,
        updateProfile,
        logout,
        resetAllData,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function formatAuthError(err: unknown): string {
  if (!err) return 'Authentication failed. Please try again.';
  const raw = err instanceof Error ? err.message : String(err);
  const msg = raw.toLowerCase();

  if (msg.includes('invalid login credentials') || msg.includes('invalid_grant') || msg.includes('invalid credentials')) {
    return 'Invalid email or password. Please check your credentials and try again.';
  }
  if (msg.includes('user already registered') || msg.includes('already been registered') || msg.includes('already exists')) {
    return 'An account with this email already exists. Please switch to Sign In.';
  }
  if (msg.includes('password should be at least') || msg.includes('weak_password')) {
    return 'Password must be at least 6 characters long.';
  }
  if (msg.includes('email rate limit exceeded') || msg.includes('rate limit')) {
    return 'Too many attempts. Please wait a few moments and try again.';
  }
  if (msg.includes('unable to validate email address') || msg.includes('valid email')) {
    return 'Please enter a valid email address.';
  }
  if (msg.includes('signup is disabled') || msg.includes('signups not allowed')) {
    return 'New account registrations are temporarily restricted.';
  }
  if (msg.includes('network') || msg.includes('failed to fetch')) {
    return 'Unable to reach authentication server. Please check your connection.';
  }
  return raw || 'Authentication encountered an error. Please try again.';
}

