'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';
import { usePremium } from './PremiumContext';
import { getSupabase } from '../lib/supabase';

export interface GoalProgressData {
  dailyMinutes: number | null;
  weeklyMinutes: number | null;
  todaySeconds: number;
  thisWeekSeconds: number;
  goalStreak: number;
}

interface FocusGoalContextType {
  goals: GoalProgressData;
  loading: boolean;
  isSaving: boolean;
  saveGoals: (dailyMinutes: number, weeklyHours: number) => Promise<{ success: boolean; error?: string }>;
  refreshGoals: () => Promise<void>;
  checkGoalReached: (additionalSeconds?: number) => void;
}

const DEFAULT_GOALS: GoalProgressData = {
  dailyMinutes: null,
  weeklyMinutes: null,
  todaySeconds: 0,
  thisWeekSeconds: 0,
  goalStreak: 0,
};

const FocusGoalContext = createContext<FocusGoalContextType>({
  goals: DEFAULT_GOALS,
  loading: false,
  isSaving: false,
  saveGoals: async () => ({ success: false }),
  refreshGoals: async () => {},
  checkGoalReached: () => {},
});

export function FocusGoalProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const { isPremium, loading: premiumLoading } = usePremium();

  const [goals, setGoals] = useState<GoalProgressData>(DEFAULT_GOALS);
  const [loading, setLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Track initial today seconds when app loads to know if goal was reached during this session
  const initialTodaySecsRef = useRef<number | null>(null);

  const getTodayDateKey = useCallback(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: tz });
      return formatter.format(new Date()); // YYYY-MM-DD
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  }, []);

  const triggerGoalToastOncePerDay = useCallback(() => {
    if (!user?.id) return;
    const todayKey = getTodayDateKey();
    const storageKey = `studypulse_goal_reached_${user.id}_${todayKey}`;

    if (typeof window !== 'undefined') {
      const alreadyNotified = localStorage.getItem(storageKey);
      if (alreadyNotified === 'true') {
        return;
      }
      localStorage.setItem(storageKey, 'true');
    }

    toast('Daily goal reached', {
      id: 'daily-goal-reached',
      duration: 4000,
      icon: '🎯',
      style: {
        background: 'var(--surface)',
        color: 'var(--text)',
        border: '1px solid var(--border)',
        fontSize: '13px',
        fontWeight: '600',
        letterSpacing: '0.02em',
      },
    });
  }, [user?.id, getTodayDateKey]);

  const refreshGoals = useCallback(async () => {
    if (premiumLoading || !isPremium || !user?.id) {
      setGoals(DEFAULT_GOALS);
      return;
    }

    const supabase = getSupabase();
    if (!supabase) return;

    setLoading(true);
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      const { data, error } = await supabase.rpc('get_my_goal_progress', { p_tz: tz });

      if (error) {
        console.warn('Error fetching goal progress:', error);
      } else if (data) {
        const raw = data as any;
        const newTodaySecs = Number(raw.today_seconds || 0);
        const dailyMins = raw.daily_minutes !== null ? Number(raw.daily_minutes) : null;

        // Remember initial state on first successful fetch
        if (initialTodaySecsRef.current === null) {
          initialTodaySecsRef.current = newTodaySecs;
        }

        setGoals({
          dailyMinutes: dailyMins,
          weeklyMinutes: raw.weekly_minutes !== null ? Number(raw.weekly_minutes) : null,
          todaySeconds: newTodaySecs,
          thisWeekSeconds: Number(raw.this_week_seconds || 0),
          goalStreak: Number(raw.goal_streak || 0),
        });

        // If goal is set and reached, check if we should notify
        if (dailyMins && dailyMins > 0) {
          const targetSecs = dailyMins * 60;
          // Only trigger toast if today reached target
          if (newTodaySecs >= targetSecs) {
            triggerGoalToastOncePerDay();
          }
        }
      }
    } catch (err) {
      console.warn('Exception during goal progress fetch:', err);
    } finally {
      setLoading(false);
    }
  }, [premiumLoading, isPremium, user?.id, triggerGoalToastOncePerDay]);

  useEffect(() => {
    if (!premiumLoading && isPremium && isAuthenticated) {
      refreshGoals();
    } else {
      setGoals(DEFAULT_GOALS);
      initialTodaySecsRef.current = null;
    }
  }, [premiumLoading, isPremium, isAuthenticated, refreshGoals]);

  const saveGoals = useCallback(
    async (dailyMinutes: number, weeklyHours: number) => {
      if (!isPremium || !user?.id) {
        return { success: false, error: 'Premium subscription required.' };
      }

      const supabase = getSupabase();
      if (!supabase) {
        return { success: false, error: 'Database service not available.' };
      }

      // Validate bounds per SQL schema:
      // daily_minutes: 5 to 720
      // weekly_minutes: 30 to 5040
      const clampedDaily = Math.min(Math.max(Math.round(dailyMinutes), 5), 720);
      const weeklyMinutes = Math.min(Math.max(Math.round(weeklyHours * 60), 30), 5040);

      setIsSaving(true);
      try {
        const { error } = await supabase.from('focus_goals').upsert(
          {
            user_id: user.id,
            daily_minutes: clampedDaily,
            weekly_minutes: weeklyMinutes,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );

        if (error) {
          return { success: false, error: error.message };
        }

        await refreshGoals();
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Failed to save focus goals.' };
      } finally {
        setIsSaving(false);
      }
    },
    [isPremium, user?.id, refreshGoals]
  );

  const checkGoalReached = useCallback(
    (additionalSeconds: number = 0) => {
      if (!isPremium || !goals.dailyMinutes || goals.dailyMinutes <= 0) return;
      const totalSecs = goals.todaySeconds + additionalSeconds;
      if (totalSecs >= goals.dailyMinutes * 60) {
        triggerGoalToastOncePerDay();
      }
    },
    [isPremium, goals.dailyMinutes, goals.todaySeconds, triggerGoalToastOncePerDay]
  );

  return (
    <FocusGoalContext.Provider
      value={{
        goals,
        loading,
        isSaving,
        saveGoals,
        refreshGoals,
        checkGoalReached,
      }}
    >
      {children}
    </FocusGoalContext.Provider>
  );
}

export function useFocusGoals() {
  return useContext(FocusGoalContext);
}
