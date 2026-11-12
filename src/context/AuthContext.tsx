'use client';

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { App as CapacitorApp } from '@capacitor/app';
import { UserProfile, StudyMode } from '../types';
import { INITIAL_USER, cleanupLegacyDemoData, calculateStreak, getCachedStreak, setCachedStreak } from '../lib/mockData';
import { getSupabase } from '../lib/supabase';
import { getRankFromRp, getSoftResetRp, HARD_RESET_CAP_RP, calculateSeasonRp, getCurrentMonthFocusSeconds, getRankTier, resolveLiveSeasonStats } from '../lib/ranks';
import { getCurrentSeasonId, resolveUserSeasonReset, getRankBadgePath } from '../lib/rankedSystem';
import { getLevelFromLifetimeXP, getScholarTitle } from '../lib/gamification';
import { resolveAppAvatar, isAppAvatar, getDeterministicDefaultAvatar } from '../lib/avatars';

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
  const router = useRouter();
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Deep-link listener for Capacitor return trip
  useEffect(() => {
    let handle: { remove: () => Promise<void> } | undefined;

    CapacitorApp.addListener('appUrlOpen', (event) => {
      const slug = event.url.split('vercel.app').pop();
      if (slug) router.push(slug);
    }).then((h) => {
      handle = h;
    }).catch((err) => {
      console.warn('Capacitor appUrlOpen listener error:', err);
    });

    return () => {
      handle?.remove();
    };
  }, [router]);

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
    const rawMetaName = (authUser.user_metadata?.full_name as string) || (authUser.user_metadata?.name as string) || (authUser.user_metadata?.display_name as string) || (authUser.email ? authUser.email.split('@')[0] : '');
    const cleanMetaName = rawMetaName.includes('(') ? rawMetaName.split(' (')[0].trim() : rawMetaName;

    setUser(prev => {
      // Prioritize existing local state to prevent flickering back to raw oauth names during background refetches
      const resolvedDisplayName = prev.username || prev.displayName || (authUser.user_metadata?.custom_username as string) || cleanMetaName || 'Focus Scholar';
      const cleanAvatar = resolveAppAvatar(prev.avatarUrl, prev.username || prev.displayName || cleanMetaName || authUser.id);
      
      const merged: UserProfile = {
        ...prev,
        id: authUser.id,
        email: authUser.email || prev.email || '',
        displayName: resolvedDisplayName,
        avatarUrl: cleanAvatar,
        user_metadata: {
          ...(authUser.user_metadata || {}),
          avatar_url: undefined,
          picture: undefined,
        },
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

      const currentMonthStudySeconds = getCurrentMonthFocusSeconds(dbSessions || []);
      const totalStudySeconds = dbSessions
        ? dbSessions.reduce((acc: any, s: any) => acc + (Number(s.duration_seconds ?? 0)), 0)
        : 0;
        
      const currentMonthStr = new Date().toISOString().substring(0, 7);
      const isNewSeason = !profile?.last_reset_month || profile.last_reset_month !== currentMonthStr || profile?.current_season_id !== currentMonthStr;

      // Compute exact reset for any user dynamically based on October study sessions & profile
      const userReset = resolveUserSeasonReset(profile, dbSessions || []);
      
      const carryoverRp = userReset.startingRP;
      const calculatedRP = calculateSeasonRp(currentMonthStudySeconds, carryoverRp);
      const currentRankObj = getRankTier(calculatedRP);
      const effectiveRankTitle = currentRankObj.name.toUpperCase();
      const effectiveBadge = currentRankObj.badge;
      
      let currentProfileRP = Number(profile?.season_rp ?? 0);
      
      // AUTO-REPAIR CORRUPTED PROFILES:
      let needsRepair = false;
      if (isNewSeason) {
        currentProfileRP = calculatedRP;
        needsRepair = true;
      } else if (Number(profile?.season_base_rp ?? 0) !== userReset.startingRP) {
        currentProfileRP = calculatedRP;
        needsRepair = true;
      } else if (Math.abs(currentProfileRP - calculatedRP) > 5 || Number(profile?.total_study_seconds ?? 0) > totalStudySeconds + 3600) {
        currentProfileRP = calculatedRP; // Reset RP
        needsRepair = true;
      }

      const syncedRP = calculatedRP;
      let currentLifetimeXP = Number(profile?.lifetime_xp ?? profile?.xp ?? 0);
      if (currentLifetimeXP === 0 && totalStudySeconds > 0) {
        currentLifetimeXP = Math.floor(totalStudySeconds / 60) * 10;
      }
      const calculatedLevel = getLevelFromLifetimeXP(currentLifetimeXP);
      const calculatedTitle = getScholarTitle(calculatedLevel);

      const mappedDbSessions = (dbSessions || []).map((s: any) => ({
        id: s.id,
        startTime: s.started_at,
        durationSeconds: Number(s.duration_seconds || 0),
      })) as any;
      const computedStreak = calculateStreak(mappedDbSessions);
      setCachedStreak(computedStreak);

      const dbStreak = Number(profile?.streak_days ?? 0);
      if (computedStreak !== dbStreak) {
        needsRepair = true;
      }

      if ((needsRepair || calculatedLevel > (profile?.level || 1)) && authUser.id && !authUser.id.startsWith('user-scholar')) {
        try {
          const updatePayload: any = { 
            level: Math.round(calculatedLevel), 
            lifetime_xp: Math.round(currentLifetimeXP),
            xp: Math.round(currentLifetimeXP),
            streak_days: computedStreak,
          };
          if (needsRepair) {
            updatePayload.season_rp = Math.round(calculatedRP);
            updatePayload.season_base_rp = carryoverRp;
            updatePayload.last_reset_month = currentMonthStr;
            updatePayload.rank_title = effectiveRankTitle;
            updatePayload.current_rank = effectiveRankTitle;
            updatePayload.rank_badge = effectiveBadge;
            updatePayload.last_season_rank = userReset.previousRankTitle;
            updatePayload.streak_days = computedStreak;
          }
          await supabase.from('profiles').update(updatePayload).eq('id', authUser.id);

          if (isNewSeason) {
            const pendingResetAlert = {
              needs_reset: true,
              previous_rank: userReset.previousRankTitle,
              new_rank: userReset.newRankTitle,
              starting_rp: userReset.startingRP,
              month_name: new Date().toLocaleString('en-US', { month: 'long' }),
            };
            try {
              localStorage.setItem(`studypulse_pending_season_reset_${currentMonthStr.replace('-', '_')}`, JSON.stringify(pendingResetAlert));
            } catch {}
          }
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
        const cleanAvatar = resolveAppAvatar(profile.avatar_url, profile.username || cleanMetaName || authUser.id);
        if (!isAppAvatar(profile.avatar_url)) {
          supabase.from('profiles').update({ avatar_url: cleanAvatar }).eq('id', authUser.id).then();
        }

        setUser(prev => {
          const finalStreak = computedStreak;
          setCachedStreak(finalStreak);
          const synced: UserProfile = {
            id: profile.id,
            email: authUser.email || prev.email || '',
            username: profile.username || prev.username,
            name: profile.name || prev.name,
            displayName: profile.username || profile.display_name || profile.name || prev.username || prev.displayName || (authUser.user_metadata?.custom_username as string) || cleanMetaName || 'Focus Scholar',
            avatarUrl: cleanAvatar,
            dailyGoalHours: Number(profile.daily_goal_hours ?? prev.dailyGoalHours ?? 4.0),
            streakDays: finalStreak,
            level: Number(profile.level ?? calculatedLevel),
            levelTitle: profile.level_title || calculatedTitle || prev.levelTitle,
            xp: currentLifetimeXP,
            lifetime_xp: currentLifetimeXP,
            lifetimeXp: currentLifetimeXP,
            currentSeasonId: prev.currentSeasonId || getCurrentSeasonId(),
            seasonRp: syncedRP,
            rp: syncedRP,
            rank_title: getRankTier(syncedRP).name.toUpperCase(),
            season_base_rp: carryoverRp,
            carryover_rp: carryoverRp,
            last_streak_bonus_date: streakBonusDate || prev.last_streak_bonus_date,
            lastStreakBonusDate: streakBonusDate || prev.last_streak_bonus_date,
            last_seen_level: Number((profile as Record<string, unknown>).last_seen_level ?? prev.last_seen_level ?? prev.level ?? 1),
            totalStudySeconds: totalStudySeconds,
            status: prev.status || 'resting',
            study_mode: (profile.study_mode as StudyMode) ?? prev.study_mode ?? null,
            studyMode: (profile.study_mode as StudyMode) ?? prev.studyMode ?? null,
            intro_completed_at: profile.intro_completed_at ?? prev.intro_completed_at ?? null,
            introCompletedAt: profile.intro_completed_at ?? prev.introCompletedAt ?? null,
            createdAt: profile.created_at || prev.createdAt || new Date().toISOString(),
            is_onboarded: profile.is_onboarded ?? prev.is_onboarded,
            user_metadata: {
              ...(authUser.user_metadata || {}),
              avatar_url: undefined,
              picture: undefined,
              level: Number(profile.level ?? calculatedLevel),
              levelTitle: profile.level_title || calculatedTitle || prev.levelTitle,
            },
          };
          try { localStorage.setItem('studypulse_active_user', JSON.stringify(synced)); } catch {}
          return synced;
        });
      } else {
        const defaultAvatar = getDeterministicDefaultAvatar(cleanMetaName || authUser.id);
        await supabase.from('profiles').upsert({
          id: authUser.id,
          username: cleanMetaName || 'Scholar',
          avatar_url: defaultAvatar,
          xp: 0,
          lifetime_xp: 0,
          level: 1,
        });
      }
    } catch {
      // fallback
    }
  }, []);

  const hasFetchedProfileRef = useRef<string | null>(null);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !user?.id || user.id.startsWith('user-scholar') || user.id.startsWith('guest')) return;
    if (hasFetchedProfileRef.current === user.id) return;
    hasFetchedProfileRef.current = user.id;

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (data && !error) {
          const currentMonthStr = new Date().toISOString().substring(0, 7);
          const { data: dbSessions } = await supabase
            .from('study_sessions')
            .select('id, user_id, duration_seconds, started_at')
            .eq('user_id', user.id);

          const liveStats = resolveLiveSeasonStats(data, dbSessions || []);
          const userReset = resolveUserSeasonReset(data, dbSessions || []);
          const newStartingRP = liveStats.startingRp;
          const resolvedSeasonRp = liveStats.seasonRp;
          const resolvedRankTitle = liveStats.rankTitle || userReset.newRankTitle;
          const prevRankTitle = userReset.previousRankTitle;
          const newBadge = liveStats.rankTier.badge;
          let lastResetMonth = data.last_reset_month;

          const mappedSess = (dbSessions || []).map((s: any) => ({
            id: s.id,
            startTime: s.started_at,
            durationSeconds: Number(s.duration_seconds || 0),
          })) as any;
          const computedStreak = calculateStreak(mappedSess);
          setCachedStreak(computedStreak);
          if (Number(data.streak_days ?? 0) !== computedStreak) {
            data.streak_days = computedStreak;
            try {
              await supabase.from('profiles').update({ streak_days: computedStreak }).eq('id', user.id);
            } catch {}
          }

          if (
            lastResetMonth !== currentMonthStr ||
            Number(data.season_base_rp ?? 0) !== newStartingRP ||
            Number(data.season_rp ?? 0) !== resolvedSeasonRp
          ) {
            lastResetMonth = currentMonthStr;

            try {
              await supabase.from('profiles').update({
                season_rp: resolvedSeasonRp,
                season_base_rp: newStartingRP,
                last_reset_month: lastResetMonth,
                rank_title: resolvedRankTitle,
                rank_badge: newBadge,
                current_rank: resolvedRankTitle,
                last_season_rank: prevRankTitle,
              }).eq('id', user.id);
            } catch (syncErr) {
              console.warn('[AuthContext] Profile update sync warning:', syncErr);
            }

            data.season_rp = resolvedSeasonRp;
            data.season_base_rp = newStartingRP;
            data.last_reset_month = lastResetMonth;
            data.rank_title = resolvedRankTitle;
            data.rank_badge = newBadge;
            data.current_rank = resolvedRankTitle;
            data.last_season_rank = prevRankTitle;
            if (data.level_title) data.level_title = resolvedRankTitle;

            const pendingResetAlert = {
              needs_reset: true,
              previous_rank: prevRankTitle,
              new_rank: resolvedRankTitle,
              starting_rp: newStartingRP,
              month_name: new Date().toLocaleString('en-US', { month: 'long' }),
            };
            try {
              localStorage.setItem(`studypulse_pending_season_reset_${currentMonthStr.replace('-', '_')}`, JSON.stringify(pendingResetAlert));
            } catch {}
          }
          const resolvedAvatar = resolveAppAvatar(data.avatar_url, data.username || user.username || user.displayName || user.id);
          if (!isAppAvatar(data.avatar_url)) {
            supabase.from('profiles').update({ avatar_url: resolvedAvatar }).eq('id', user.id).then();
          }

          setUser(prev => {
            const finalStreak = computedStreak;
            setCachedStreak(finalStreak);
            const updated = {
              ...prev,
              displayName: data.username || data.display_name || data.name || prev.username || prev.displayName,
              avatarUrl: resolvedAvatar,
              dailyGoalHours: data.daily_goal_hours ?? prev.dailyGoalHours,
              streakDays: finalStreak,
              level: data.level ?? prev.level,
              rp: resolvedSeasonRp,
              seasonRp: resolvedSeasonRp,
              season_base_rp: newStartingRP,
              carryover_rp: newStartingRP,
              rank_title: resolvedRankTitle,
              xp: data.lifetime_xp ?? data.xp ?? prev.xp,
              lifetime_xp: data.lifetime_xp ?? data.xp ?? prev.lifetime_xp,
              lifetimeXp: data.lifetime_xp ?? data.xp ?? prev.lifetimeXp,
              totalStudySeconds: data.total_study_seconds ?? prev.totalStudySeconds,
              levelTitle: resolvedRankTitle || data.level_title || prev.levelTitle,
              study_mode: (data.study_mode as StudyMode) ?? prev.study_mode ?? null,
              studyMode: (data.study_mode as StudyMode) ?? prev.studyMode ?? null,
              intro_completed_at: data.intro_completed_at ?? prev.intro_completed_at ?? null,
              introCompletedAt: data.intro_completed_at ?? prev.introCompletedAt ?? null,
              is_onboarded: data.is_onboarded ?? prev.is_onboarded,
              user_metadata: {
                ...(prev.user_metadata || {}),
                level: data.level ?? prev.level,
                levelTitle: resolvedRankTitle || data.level_title || prev.levelTitle
              }
            };
            try { localStorage.setItem('studypulse_active_user', JSON.stringify(updated)); } catch {}
            return updated;
          });
        }
      } catch (err) {
      }
    };

    fetchProfile();
  }, [user?.id]);

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
      const cachedStreak = getCachedStreak();
      const saved = localStorage.getItem('studypulse_active_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          parsed.avatarUrl = resolveAppAvatar(parsed.avatarUrl, parsed.username || parsed.displayName || parsed.id);
          parsed.streakDays = cachedStreak;
          const live = resolveLiveSeasonStats(parsed, []);
          if (live.startingRp > 0) {
            parsed.season_base_rp = Math.max(Number(parsed.season_base_rp || 0), live.startingRp);
            parsed.carryover_rp = Math.max(Number(parsed.carryover_rp || 0), live.startingRp);
            parsed.seasonRp = live.seasonRp;
            parsed.rp = live.seasonRp;
            parsed.rank_title = live.rankTitle;
          }
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
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        try {
          localStorage.removeItem('studypulse_sessions');
          localStorage.removeItem('studypulse_cached_profile');
          localStorage.removeItem('studypulse_todos');
          localStorage.removeItem('studypulse_active_sessions');
          if (session?.user) {
            localStorage.removeItem(`study_io_sessions_${session.user.id}`);
            localStorage.removeItem(`study_io_todos_${session.user.id}`);
          }
        } catch {}
      }

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
          localStorage.removeItem('studypulse_sessions');
          localStorage.removeItem('studypulse_subjects');
          localStorage.removeItem('studypulse_todos');
          localStorage.removeItem('studypulse_pending_sessions');
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
          options: {
            data: { display_name: name || normalizedEmail.split('@')[0] },
            emailRedirectTo: 'https://studyio-web.vercel.app/auth/callback',
          },
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
              avatar_url: getDeterministicDefaultAvatar(name?.trim() || normalizedEmail.split('@')[0] || data.user.id),
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
            redirectTo: 'https://studyio-web.vercel.app/auth/callback',
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

      if (updates.avatarUrl !== undefined) {
        updated.avatarUrl = resolveAppAvatar(updates.avatarUrl, prev.username || prev.displayName || prev.id);
      }

      if (updates.level !== undefined) {
        updated.level = updates.level;
      } else if (updates.lifetime_xp !== undefined || updates.xp !== undefined) {
        const xpVal = Number(updates.lifetime_xp ?? updates.xp ?? 0);
        updated.level = getLevelFromLifetimeXP(xpVal);
      }
      updated.levelTitle = updates.levelTitle || getScholarTitle(updated.level);

      updated.user_metadata = {
        ...(prev.user_metadata || {}),
        ...(updates.user_metadata || {}),
        level: updated.level,
        levelTitle: updated.levelTitle || (prev.user_metadata as any)?.levelTitle,
      };

      try {
        localStorage.setItem('studypulse_active_user', JSON.stringify(updated));
      } catch {}

      // Only send valid columns in the update payload to Supabase matching verified schema:
      // profiles: id, username, avatar_url, xp (integer), lifetime_xp (integer), level (integer)
      const supabase = getSupabase();
      if (supabase && prev.id && !prev.id.startsWith('user-scholar') && !prev.id.startsWith('guest')) {
        const payload: Record<string, any> = {};

        if (updates.username !== undefined && updates.username !== prev.username) {
          payload.username = updates.username.trim().toLowerCase();
        }
        if (updates.avatarUrl !== undefined && updates.avatarUrl !== prev.avatarUrl) {
          payload.avatar_url = resolveAppAvatar(updates.avatarUrl, prev.username || prev.displayName || prev.id);
        }
        if (updates.level !== undefined && Number(updates.level) !== Number(prev.level)) {
          payload.level = Math.round(Number(updates.level));
        }
        if (updates.lifetime_xp !== undefined || updates.lifetimeXp !== undefined) {
          const lXp = updates.lifetime_xp ?? updates.lifetimeXp;
          payload.lifetime_xp = Math.round(Number(lXp));
        }
        if (updates.xp !== undefined) {
          payload.xp = Math.round(Number(updates.xp));
        } else if (payload.lifetime_xp !== undefined) {
          // Strictly keep xp aligned with lifetime_xp as integer
          payload.xp = payload.lifetime_xp;
        }
        if (updates.dailyGoalHours !== undefined) {
          payload.daily_goal_minutes = Math.round(Number(updates.dailyGoalHours) * 60);
        }
        if (updates.streakDays !== undefined || (updates as any).streak_days !== undefined) {
          const s = Math.max(0, Math.round(Number(updates.streakDays ?? (updates as any).streak_days)));
          payload.streak_days = s;
          setCachedStreak(s);
        }
        if (updates.seasonRp !== undefined || updates.rp !== undefined) {
          payload.season_rp = Math.round(Number(updates.seasonRp ?? updates.rp));
        }
        if (updates.season_base_rp !== undefined || (updates as any).carryover_rp !== undefined) {
          payload.season_base_rp = Math.round(Number(updates.season_base_rp ?? (updates as any).carryover_rp));
        }
        if (updates.rank_title !== undefined) {
          payload.rank_title = updates.rank_title;
        }
        if ((updates as any).current_rank !== undefined || updates.rank_title !== undefined) {
          payload.current_rank = (updates as any).current_rank || updates.rank_title;
        }
        if ((updates as any).rank_badge !== undefined) {
          payload.rank_badge = (updates as any).rank_badge;
        }
        if ((updates as any).last_season_rank !== undefined) {
          payload.last_season_rank = (updates as any).last_season_rank;
        }
        if ((updates as any).last_reset_month !== undefined) {
          payload.last_reset_month = (updates as any).last_reset_month;
        }
        if (updates.study_mode !== undefined || (updates as any).studyMode !== undefined) {
          payload.study_mode = updates.study_mode ?? (updates as any).studyMode;
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
      localStorage.removeItem('study_io_selected_subject_guest');
      localStorage.removeItem('studypulse_selected_subject_id');
      localStorage.removeItem('studypulse_sessions');
      localStorage.removeItem('studypulse_subjects');
      localStorage.removeItem('studypulse_todos');
      localStorage.removeItem('studypulse_pending_sessions');
    } catch {}

    if (typeof window !== 'undefined') {
      if (window.location.pathname === '/') {
        window.location.reload();
      } else {
        window.location.href = '/';
      }
    }
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
    
    try {
      if (supabase && user.id && !user.id.startsWith('guest') && !user.id.startsWith('user-scholar')) {
        // 1. Call the Postgres RPC function to purge auth.users and all cascading tables
        const { error } = await supabase.rpc('delete_user');
        if (error) throw error;

        // 2. Sign out the local session completely
        await supabase.auth.signOut();
      }

      // 3. Clear all local application state and cached auth tokens
      localStorage.clear();
      sessionStorage.clear();

      saveUser(INITIAL_USER);
      setIsAuthenticated(false);
      setIsLoading(false);

      // 4. Redirect cleanly to login or landing page
      window.location.href = '/';
    } catch (err: any) {
      console.error("Account deletion failed:", err);
      alert(err.message || "Failed to completely delete account. Please try again.");
      setIsLoading(false);
    }
  }, [saveUser, user]);

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


