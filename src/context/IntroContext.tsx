'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import { useStudyMode } from './StudyModeContext';
import { getSupabase } from '../lib/supabase';

export interface IntroContextType {
  needsIntro: boolean;
  isReplayOpen: boolean;
  openReplay: () => void;
  closeReplay: () => void;
  completeIntro: (isSkipped?: boolean) => Promise<void>;
  hintsEnabled: boolean;
  isHintVisible: (hintKey: string) => boolean;
  dismissHint: (hintKey: string) => void;
}

const IntroContext = createContext<IntroContextType | undefined>(undefined);

export function IntroProvider({ children }: { children: ReactNode }) {
  const { user, isLoading, updateProfile } = useAuth();
  const { mode, loading: studyModeLoading, needsOnboarding: needsStudyModeOnboarding } = useStudyMode();

  const [isReplayOpen, setIsReplayOpen] = useState(false);
  const [localCompleted, setLocalCompleted] = useState<boolean | null>(null);
  const [dismissedHints, setDismissedHints] = useState<Record<string, boolean>>({});

  // Synchronize localStorage flag on mount or user change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!user?.id || user.id.startsWith('guest')) {
      setLocalCompleted(true);
      return;
    }
    const stored = localStorage.getItem(`studyio_intro_completed_${user.id}`);
    setLocalCompleted(stored === 'true');

    // Read dismissed hints
    try {
      const rawHints = localStorage.getItem(`studyio_dismissed_hints_${user.id}`);
      if (rawHints) {
        setDismissedHints(JSON.parse(rawHints));
      }
    } catch {
      // Ignore parse failure
    }
  }, [user?.id]);

  // Determine whether the intro should be displayed
  // Rule: Show ONLY when profile loaded, study mode chosen, and intro_completed_at is null.
  // Never flash while loading.
  const isProfileLoaded = !isLoading && !!user && !!user.id && !user.id.startsWith('guest');
  const hasStudyModeChosen = !studyModeLoading && !needsStudyModeOnboarding && !!user?.study_mode;
  const isIntroRecordedInDb = Boolean(user?.intro_completed_at || user?.introCompletedAt);

  const needsIntro = Boolean(
    isProfileLoaded &&
      hasStudyModeChosen &&
      !isIntroRecordedInDb &&
      localCompleted === false
  );

  // Complete intro (called on skip or finish)
  const completeIntro = useCallback(
    async (isSkipped = false) => {
      const userId = user?.id;
      if (!userId || userId.startsWith('guest')) {
        setIsReplayOpen(false);
        return;
      }

      // 1. Immediately update localStorage flag so it never loops
      try {
        localStorage.setItem(`studyio_intro_completed_${userId}`, 'true');
        // Hints are enabled only when finishing, not when skipping
        if (!isSkipped) {
          localStorage.setItem(`studyio_hints_enabled_${userId}`, 'true');
        }
      } catch {
        // LocalStorage fallback
      }
      setLocalCompleted(true);
      setIsReplayOpen(false);

      // 2. Optimistic user state update
      const nowIso = new Date().toISOString();
      updateProfile({
        intro_completed_at: nowIso,
        introCompletedAt: nowIso,
      } as any);

      // 3. Persist to Supabase via RPC complete_my_intro()
      try {
        const supabase = getSupabase();
        if (supabase) {
          const { error: rpcErr } = await supabase.rpc('complete_my_intro');
          if (rpcErr) {
            // Fallback: direct update in case RPC is not yet created
            await supabase
              .from('profiles')
              .update({ intro_completed_at: nowIso })
              .eq('id', userId);
          }
        }
      } catch (err) {
        // Silently caught: localStorage flag prevents looping even if DB migration is pending
        console.warn('[IntroContext] Notice: Supabase intro completion saved locally:', err);
      }
    },
    [user?.id, updateProfile]
  );

  const openReplay = useCallback(() => {
    setIsReplayOpen(true);
  }, []);

  const closeReplay = useCallback(() => {
    setIsReplayOpen(false);
  }, []);

  const hintsEnabled = typeof window !== 'undefined' && !!user?.id
    ? localStorage.getItem(`studyio_hints_enabled_${user.id}`) === 'true'
    : false;

  const isHintVisible = useCallback(
    (hintKey: string) => {
      if (!hintsEnabled) return false;
      if (dismissedHints[hintKey]) return false;
      return true;
    },
    [hintsEnabled, dismissedHints]
  );

  const dismissHint = useCallback(
    (hintKey: string) => {
      if (!user?.id) return;
      setDismissedHints((prev) => {
        const updated = { ...prev, [hintKey]: true };
        try {
          localStorage.setItem(`studyio_dismissed_hints_${user.id}`, JSON.stringify(updated));
        } catch {}
        return updated;
      });
    },
    [user?.id]
  );

  const value: IntroContextType = {
    needsIntro,
    isReplayOpen,
    openReplay,
    closeReplay,
    completeIntro,
    hintsEnabled,
    isHintVisible,
    dismissHint,
  };

  return <IntroContext.Provider value={value}>{children}</IntroContext.Provider>;
}

export function useIntro(): IntroContextType {
  const context = useContext(IntroContext);
  if (!context) {
    return {
      needsIntro: false,
      isReplayOpen: false,
      openReplay: () => {},
      closeReplay: () => {},
      completeIntro: async () => {},
      hintsEnabled: false,
      isHintVisible: () => false,
      dismissHint: () => {},
    };
  }
  return context;
}

