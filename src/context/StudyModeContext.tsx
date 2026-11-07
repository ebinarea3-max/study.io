'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import { StudyMode } from '../types';
import { getSupabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export interface StudyModeContextType {
  mode: StudyMode;
  isFocus: boolean;
  isSubject: boolean;
  loading: boolean;
  needsOnboarding: boolean;
  setMode: (newMode: StudyMode) => Promise<void>;
}

const StudyModeContext = createContext<StudyModeContextType | undefined>(undefined);

export function StudyModeProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading: authLoading, updateProfile } = useAuth();
  const [optimisticMode, setOptimisticMode] = useState<StudyMode | null>(null);

  // Distinguish real registered Supabase accounts from guest / mock accounts
  const isRealUser = Boolean(
    isAuthenticated &&
      user?.id &&
      !user.id.startsWith('user-scholar') &&
      !user.id.startsWith('guest')
  );

  // Raw mode from user profile
  const profileMode: StudyMode | null = (user?.study_mode as StudyMode) ?? (user?.studyMode as StudyMode) ?? null;

  // Loading state: true while authentication or profile data is still resolving
  const loading = authLoading;

  // needsOnboarding is true ONLY when profile has finished loading, it's a real user, and study_mode is null
  const needsOnboarding = Boolean(
    !loading && isRealUser && profileMode === null && optimisticMode === null
  );

  // Effective mode: optimistic mode takes precedence if set, then profileMode, falling back to 'subject'
  const effectiveRawMode = optimisticMode ?? profileMode;
  const mode: StudyMode = effectiveRawMode === 'focus' ? 'focus' : 'subject';
  const isFocus = mode === 'focus';
  const isSubject = mode === 'subject';

  // Keep a ref to current effective mode for rollbacks and focus refresh checks
  const modeRef = useRef<{ raw: StudyMode | null; effective: StudyMode }>({
    raw: effectiveRawMode,
    effective: mode,
  });
  useEffect(() => {
    modeRef.current = { raw: effectiveRawMode, effective: mode };
  }, [effectiveRawMode, mode]);

  // If user profile updates from remote to a non-null study_mode, clear local optimistic override
  useEffect(() => {
    if (profileMode !== null && optimisticMode === profileMode) {
      setOptimisticMode(null);
    }
  }, [profileMode, optimisticMode]);

  // Update mode: optimistic update -> RPC -> rollback on error
  const setMode = useCallback(
    async (newMode: StudyMode): Promise<void> => {
      if (newMode !== 'focus' && newMode !== 'subject') return;

      const previousRaw = modeRef.current.raw;

      // 1. Optimistic update
      setOptimisticMode(newMode);
      updateProfile({ study_mode: newMode, studyMode: newMode });

      if (!isRealUser) {
        // Guest mode / local-only preview
        return;
      }

      const supabase = getSupabase();
      if (!supabase) return;

      try {
        const { error } = await supabase.rpc('set_my_study_mode', { p_mode: newMode });
        if (error) {
          throw error;
        }
      } catch (err: unknown) {
        // Rollback on failure
        setOptimisticMode(previousRaw);
        updateProfile({ study_mode: previousRaw, studyMode: previousRaw });
        const errMsg = err instanceof Error ? err.message : 'Unknown database error';
        toast.error(`Failed to update study mode: ${errMsg}`);
        throw err;
      }
    },
    [isRealUser, updateProfile]
  );

  // Refresh study_mode on window focus so changes made on another device appear automatically
  useEffect(() => {
    if (!isRealUser || typeof window === 'undefined') return;

    const handleWindowFocus = async () => {
      const supabase = getSupabase();
      if (!supabase || !user?.id) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('study_mode')
          .eq('id', user.id)
          .maybeSingle();

        if (data && !error && data.study_mode !== undefined) {
          const remoteMode = (data.study_mode as StudyMode) || null;
          if (remoteMode !== profileMode) {
            setOptimisticMode(null);
            updateProfile({ study_mode: remoteMode, studyMode: remoteMode });
          }
        }
      } catch {
        // Quietly ignore background network errors during focus refresh
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    return () => {
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [isRealUser, user?.id, profileMode, updateProfile]);

  const value = useMemo<StudyModeContextType>(
    () => ({
      mode,
      isFocus,
      isSubject,
      loading,
      needsOnboarding,
      setMode,
    }),
    [mode, isFocus, isSubject, loading, needsOnboarding, setMode]
  );

  return (
    <StudyModeContext.Provider value={value}>
      {children}
    </StudyModeContext.Provider>
  );
}

export function useStudyMode(): StudyModeContextType {
  const context = useContext(StudyModeContext);
  if (!context) {
    throw new Error('useStudyMode must be used within a StudyModeProvider');
  }
  return context;
}

