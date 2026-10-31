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
import {
  TimetableItem,
  GoalStreakState,
  DayOfWeek,
  DAYS_OF_WEEK,
  DayOfWeekConfig,
  getTodayDayOfWeek,
  TIMETABLE_COLOR_PRESETS,
} from '../types/timetable';
import { useAuth } from './AuthContext';
import { useStudy } from './StudyContext';
import { getLocalDateString, parseLocalDateString, isSessionToday } from '../lib/dateUtils';
import { getSupabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { soundFx } from '../lib/audio';
import confetti from 'canvas-confetti';

interface ItemProgress {
  loggedSeconds: number;
  targetSeconds: number;
  percent: number;
  isCompleted: boolean;
}

interface DaySummary {
  totalTargetSeconds: number;
  totalLoggedSeconds: number;
  percent: number;
  isCompleted: boolean;
  isRestDay: boolean;
  itemCount: number;
}

interface WeekDayOverview {
  day: DayOfWeekConfig;
  dateStr: string;
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
  isRestDay: boolean;
  isCompleted: boolean;
  percent: number;
  itemCount: number;
}

interface TimetableContextType {
  selectedDay: DayOfWeek;
  setSelectedDay: (day: DayOfWeek) => void;
  items: TimetableItem[];
  itemsForSelectedDay: TimetableItem[];
  addItem: (item: Omit<TimetableItem, 'id'>) => Promise<void>;
  updateItem: (id: string, updates: Partial<TimetableItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  copyDaySchedule: (fromDay: DayOfWeek, toDays: DayOfWeek[]) => Promise<void>;
  clearDaySchedule: (day: DayOfWeek) => Promise<void>;
  loadDefaultSchedule: () => Promise<void>;
  streak: GoalStreakState;
  manualLogs: Record<string, number>;
  adjustOfflineTime: (itemId: string, addSeconds: number, dateStr?: string) => void;
  setSubjectCompleted: (itemId: string, completed: boolean, dateStr?: string) => void;
  focusOnSubject: (item: TimetableItem) => void;
  getItemProgress: (item: TimetableItem, dateStr?: string) => ItemProgress;
  getDaySummary: (day: DayOfWeek, dateStr?: string) => DaySummary;
  weekOverview: WeekDayOverview[];
  isTodayGoalCompleted: boolean;
  todayCompletionPercent: number;
  syncStatus: 'synced' | 'saving' | 'offline';
}

const DEFAULT_STARTER_SCHEDULE: TimetableItem[] = [
  { id: 'starter-mon-1', dayOfWeek: 'mon', subjectName: 'Digital Logic', targetSeconds: 7200, color: '#F59E0B' },
  { id: 'starter-mon-2', dayOfWeek: 'mon', subjectName: 'Data Structures', targetSeconds: 5400, color: '#3B82F6' },
  { id: 'starter-tue-1', dayOfWeek: 'tue', subjectName: 'Computer Networks', targetSeconds: 7200, color: '#10B981' },
  { id: 'starter-tue-2', dayOfWeek: 'tue', subjectName: 'Web Development', targetSeconds: 3600, color: '#8B5CF6' },
  { id: 'starter-wed-1', dayOfWeek: 'wed', subjectName: 'Data Structures', targetSeconds: 7200, color: '#3B82F6' },
  { id: 'starter-wed-2', dayOfWeek: 'wed', subjectName: 'Operating Systems', targetSeconds: 5400, color: '#EC4899' },
  { id: 'starter-thu-1', dayOfWeek: 'thu', subjectName: 'Digital Logic', targetSeconds: 5400, color: '#F59E0B' },
  { id: 'starter-thu-2', dayOfWeek: 'thu', subjectName: 'Computer Networks', targetSeconds: 7200, color: '#10B981' },
  { id: 'starter-fri-1', dayOfWeek: 'fri', subjectName: 'Web Development', targetSeconds: 7200, color: '#8B5CF6' },
  { id: 'starter-fri-2', dayOfWeek: 'fri', subjectName: 'Project Lab', targetSeconds: 5400, color: '#06B6D4' },
  { id: 'starter-sat-1', dayOfWeek: 'sat', subjectName: 'Revision & Practice', targetSeconds: 7200, color: '#F97316' },
];

const INITIAL_STREAK: GoalStreakState = {
  currentStreak: 0,
  longestStreak: 0,
  lastCompletedDate: null,
  history: {},
};

const TimetableContext = createContext<TimetableContextType | undefined>(undefined);

export function TimetableProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const {
    subjects,
    addSubject,
    setSelectedSubjectId,
    sessions,
    isStudying,
    selectedSubject,
    elapsedSeconds,
  } = useStudy();

  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(() => getTodayDayOfWeek());
  const [items, setItems] = useState<TimetableItem[]>([]);
  const [streak, setStreak] = useState<GoalStreakState>(INITIAL_STREAK);
  const [manualLogs, setManualLogs] = useState<Record<string, number>>({});
  const [syncStatus, setSyncStatus] = useState<'synced' | 'saving' | 'offline'>('synced');
  const [hasLoaded, setHasLoaded] = useState(false);

  const celebrationTriggeredDateRef = useRef<string | null>(null);

  const todayDate = useMemo(() => getLocalDateString(new Date()), []);
  const userStorageSuffix = user?.id || 'guest';

  // 1. Initial Load from LocalStorage
  useEffect(() => {
    try {
      const itemsKey = `studypulse_timetable_items_${userStorageSuffix}`;
      const savedItems = localStorage.getItem(itemsKey) || localStorage.getItem('studypulse_timetable_items');
      if (savedItems) {
        setItems(JSON.parse(savedItems));
      } else {
        // Initialize starter schedule
        setItems(DEFAULT_STARTER_SCHEDULE);
        try {
          localStorage.setItem(itemsKey, JSON.stringify(DEFAULT_STARTER_SCHEDULE));
        } catch {}
      }

      const streakKey = `studypulse_timetable_streaks_${userStorageSuffix}`;
      const savedStreak = localStorage.getItem(streakKey) || localStorage.getItem('studypulse_timetable_streaks');
      if (savedStreak) {
        setStreak(JSON.parse(savedStreak));
      }

      const manualKey = `studypulse_timetable_manual_${userStorageSuffix}`;
      const savedManual = localStorage.getItem(manualKey);
      if (savedManual) {
        setManualLogs(JSON.parse(savedManual));
      }
    } catch (err) {
      console.warn('Failed reading timetable from localStorage', err);
    } finally {
      setHasLoaded(true);
    }
  }, [userStorageSuffix]);

  // 2. Fetch from Supabase when user is authenticated
  useEffect(() => {
    if (!isAuthenticated || !user?.id || user.id.startsWith('user-scholar-')) return;
    const supabase = getSupabase();
    if (!supabase) return;

    let isCancelled = false;

    async function fetchFromSupabase() {
      const client = getSupabase();
      if (!client) return;

      try {
        // Fetch schedules
        const { data: scheduleData, error: scheduleError } = await client
          .from('timetable_schedules')
          .select('*')
          .eq('user_id', user.id);

        if (!scheduleError && scheduleData && scheduleData.length > 0 && !isCancelled) {
          const mapped: TimetableItem[] = scheduleData.map(row => ({
            id: row.id,
            dayOfWeek: row.day_of_week as DayOfWeek,
            subjectId: row.subject_id || undefined,
            subjectName: row.subject_name,
            targetSeconds: Number(row.target_seconds) || 3600,
            color: row.color || '#F59E0B',
            createdAt: row.created_at,
          }));
          setItems(mapped);
          try {
            localStorage.setItem(`studypulse_timetable_items_${user.id}`, JSON.stringify(mapped));
          } catch {}
        }

        // Fetch streaks
        const { data: streakData, error: streakError } = await client
          .from('timetable_streaks')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!streakError && streakData && !isCancelled) {
          const loadedStreak: GoalStreakState = {
            currentStreak: Number(streakData.current_streak) || 0,
            longestStreak: Number(streakData.longest_streak) || 0,
            lastCompletedDate: streakData.last_completed_date || null,
            history: streakData.history || {},
          };
          setStreak(loadedStreak);
          try {
            localStorage.setItem(`studypulse_timetable_streaks_${user.id}`, JSON.stringify(loadedStreak));
          } catch {}
        }
      } catch (e) {
        // Table may not exist yet, fallback to localStorage
        console.warn('Supabase timetable sync fallback to local', e);
      }
    }

    fetchFromSupabase();
    return () => {
      isCancelled = true;
    };
  }, [isAuthenticated, user?.id]);

  // Save to LocalStorage & Supabase
  const saveItems = useCallback(
    async (newItems: TimetableItem[]) => {
      setItems(newItems);
      try {
        localStorage.setItem(`studypulse_timetable_items_${userStorageSuffix}`, JSON.stringify(newItems));
        localStorage.setItem('studypulse_timetable_items', JSON.stringify(newItems));
      } catch {}

      if (isAuthenticated && user?.id && !user.id.startsWith('user-scholar-')) {
        const supabase = getSupabase();
        if (supabase) {
          setSyncStatus('saving');
          try {
            // Delete existing and upsert
            await supabase.from('timetable_schedules').delete().eq('user_id', user.id);
            if (newItems.length > 0) {
              const rows = newItems.map(it => ({
                id: it.id.includes('-') && it.id.length > 30 ? it.id : undefined,
                user_id: user.id,
                day_of_week: it.dayOfWeek,
                subject_name: it.subjectName,
                subject_id: it.subjectId || null,
                target_seconds: it.targetSeconds,
                color: it.color,
              }));
              await supabase.from('timetable_schedules').insert(rows);
            }
            setSyncStatus('synced');
          } catch {
            setSyncStatus('offline');
          }
        }
      }
    },
    [isAuthenticated, user?.id, userStorageSuffix]
  );

  const saveStreak = useCallback(
    async (newStreak: GoalStreakState) => {
      setStreak(newStreak);
      try {
        localStorage.setItem(`studypulse_timetable_streaks_${userStorageSuffix}`, JSON.stringify(newStreak));
        localStorage.setItem('studypulse_timetable_streaks', JSON.stringify(newStreak));
      } catch {}

      if (isAuthenticated && user?.id && !user.id.startsWith('user-scholar-')) {
        const supabase = getSupabase();
        if (supabase) {
          try {
            await supabase.from('timetable_streaks').upsert({
              user_id: user.id,
              current_streak: newStreak.currentStreak,
              longest_streak: newStreak.longestStreak,
              last_completed_date: newStreak.lastCompletedDate,
              history: newStreak.history,
              updated_at: new Date().toISOString(),
            });
          } catch {}
        }
      }
    },
    [isAuthenticated, user?.id, userStorageSuffix]
  );

  const saveManualLogs = useCallback(
    (newLogs: Record<string, number>) => {
      setManualLogs(newLogs);
      try {
        localStorage.setItem(`studypulse_timetable_manual_${userStorageSuffix}`, JSON.stringify(newLogs));
      } catch {}
    },
    [userStorageSuffix]
  );

  // 3. Subject Progress Calculation (Live Sync)
  const getItemProgress = useCallback(
    (item: TimetableItem, dateStr: string = todayDate): ItemProgress => {
      const isDateToday = dateStr === todayDate;

      // Completed sessions on that date
      const matchedSessions = sessions.filter(s => {
        let matchesDate = false;
        if (isDateToday) {
          matchesDate = isSessionToday(s);
        } else if (s.startTime) {
          matchesDate = getLocalDateString(new Date(s.startTime)) === dateStr;
        }

        if (!matchesDate) return false;

        // Match subject by id or normalized name
        const matchId = Boolean(item.subjectId && s.subjectId && item.subjectId === s.subjectId);
        const matchName = Boolean(
          s.subjectName &&
            item.subjectName &&
            s.subjectName.trim().toLowerCase() === item.subjectName.trim().toLowerCase()
        );
        return matchId || matchName;
      });

      const sessionsSeconds = matchedSessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);

      // Active live timer if studying today
      let activeSeconds = 0;
      if (isDateToday && isStudying && selectedSubject) {
        const matchActiveId = Boolean(item.subjectId && selectedSubject.id === item.subjectId);
        const matchActiveName = Boolean(
          selectedSubject.name &&
            item.subjectName &&
            selectedSubject.name.trim().toLowerCase() === item.subjectName.trim().toLowerCase()
        );
        if (matchActiveId || matchActiveName) {
          activeSeconds = elapsedSeconds || 0;
        }
      }

      // Manual offline adjustment
      const manualSeconds = manualLogs[`${dateStr}_${item.id}`] || 0;

      const totalLoggedSeconds = sessionsSeconds + activeSeconds + manualSeconds;
      const targetSeconds = Math.max(1, item.targetSeconds || 3600);
      const percent = Math.min(100, Math.round((totalLoggedSeconds / targetSeconds) * 100));
      const isCompleted = totalLoggedSeconds >= targetSeconds;

      return {
        loggedSeconds: totalLoggedSeconds,
        targetSeconds,
        percent,
        isCompleted,
      };
    },
    [todayDate, sessions, isStudying, selectedSubject, elapsedSeconds, manualLogs]
  );

  // 4. Day Summary Calculation
  const getDaySummary = useCallback(
    (day: DayOfWeek, dateStr: string = todayDate): DaySummary => {
      const dayItems = items.filter(it => it.dayOfWeek === day);
      if (dayItems.length === 0) {
        return {
          totalTargetSeconds: 0,
          totalLoggedSeconds: 0,
          percent: 100,
          isCompleted: false, // Rest Day
          isRestDay: true,
          itemCount: 0,
        };
      }

      let totalTarget = 0;
      let totalLogged = 0;
      let allItemsCompleted = true;

      dayItems.forEach(item => {
        const prog = getItemProgress(item, dateStr);
        totalTarget += prog.targetSeconds;
        totalLogged += prog.loggedSeconds;
        if (!prog.isCompleted) {
          allItemsCompleted = false;
        }
      });

      const percent = totalTarget > 0 ? Math.min(100, Math.round((totalLogged / totalTarget) * 100)) : 100;

      return {
        totalTargetSeconds: totalTarget,
        totalLoggedSeconds: totalLogged,
        percent,
        isCompleted: allItemsCompleted,
        isRestDay: false,
        itemCount: dayItems.length,
      };
    },
    [items, todayDate, getItemProgress]
  );

  // 5. Items for Currently Selected Day
  const itemsForSelectedDay = useMemo(() => {
    return items.filter(it => it.dayOfWeek === selectedDay);
  }, [items, selectedDay]);

  // Today's completion status
  const currentTodayDayOfWeek = useMemo(() => getTodayDayOfWeek(), []);
  const todaySummary = useMemo(() => {
    return getDaySummary(currentTodayDayOfWeek, todayDate);
  }, [getDaySummary, currentTodayDayOfWeek, todayDate]);

  const isTodayGoalCompleted = todaySummary.isCompleted && !todaySummary.isRestDay;
  const todayCompletionPercent = todaySummary.percent;

  // 6. Streak Evaluation Engine
  useEffect(() => {
    if (!hasLoaded) return;

    // Evaluate unbroken past streak walking backwards from yesterday
    let unbrokenPastStreak = 0;
    let daysWalked = 0;
    let streakBroken = false;

    // Check each past day up to 365 days
    while (!streakBroken && daysWalked < 365) {
      daysWalked++;
      const pastDateStr = getLocalDateString(new Date(), -daysWalked);
      const dateObj = parseLocalDateString(pastDateStr);
      const jsDay = dateObj.getDay();
      const dayCfg = DAYS_OF_WEEK.find(d => d.jsDay === jsDay);
      const dayKey = dayCfg ? dayCfg.key : 'mon';

      const scheduledForDay = items.filter(it => it.dayOfWeek === dayKey);

      if (scheduledForDay.length === 0) {
        // Rest Day does NOT break streak!
        continue;
      }

      // Check if day was marked completed in history or calculated from sessions
      const recordedCompleted = Boolean(streak.history[pastDateStr]);
      const calculatedCompleted = scheduledForDay.every(it => {
        const daySessions = sessions.filter(s => {
          const sDate = s.startTime ? getLocalDateString(new Date(s.startTime)) : '';
          const matchDate = sDate === pastDateStr;
          const matchId = Boolean(it.subjectId && s.subjectId && it.subjectId === s.subjectId);
          const matchName = Boolean(
            s.subjectName &&
              it.subjectName &&
              s.subjectName.trim().toLowerCase() === it.subjectName.trim().toLowerCase()
          );
          return matchDate && (matchId || matchName);
        });
        const logged =
          daySessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0) +
          (manualLogs[`${pastDateStr}_${it.id}`] || 0);
        return logged >= it.targetSeconds;
      });

      if (recordedCompleted || calculatedCompleted) {
        unbrokenPastStreak += 1;
      } else {
        // Missed scheduled study day
        streakBroken = true;
      }
    }

    // Now calculate effective current streak
    let newCurrentStreak = unbrokenPastStreak;
    let newLastCompletedDate = streak.lastCompletedDate;
    const updatedHistory = { ...streak.history };

    if (isTodayGoalCompleted) {
      newCurrentStreak = unbrokenPastStreak + 1;
      newLastCompletedDate = todayDate;
      updatedHistory[todayDate] = true;

      // Trigger celebratory chime & confetti if not triggered yet today
      if (celebrationTriggeredDateRef.current !== todayDate) {
        celebrationTriggeredDateRef.current = todayDate;
        soundFx.playMilestoneBell();
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'],
          });
        } catch {}
        toast.success(`🔥 Daily Goal Completed! Goal Streak: ${newCurrentStreak} days!`, {
          duration: 4000,
          icon: '🏆',
        });
      }
    }

    const newLongestStreak = Math.max(streak.longestStreak || 0, newCurrentStreak);

    // Save if changed
    if (
      newCurrentStreak !== streak.currentStreak ||
      newLongestStreak !== streak.longestStreak ||
      newLastCompletedDate !== streak.lastCompletedDate ||
      Boolean(streak.history[todayDate]) !== Boolean(updatedHistory[todayDate])
    ) {
      saveStreak({
        currentStreak: newCurrentStreak,
        longestStreak: newLongestStreak,
        lastCompletedDate: newLastCompletedDate,
        history: updatedHistory,
      });
    }
  }, [
    hasLoaded,
    items,
    isTodayGoalCompleted,
    todayDate,
    sessions,
    manualLogs,
    streak.currentStreak,
    streak.longestStreak,
    streak.lastCompletedDate,
    streak.history,
    saveStreak,
  ]);

  // 7. Week Overview (7-Day mini indicator)
  const weekOverview = useMemo((): WeekDayOverview[] => {
    const today = new Date();
    const currentJsDay = today.getDay(); // 0 = Sun, 1 = Mon ...
    // Calculate Monday of current week
    const diffToMonday = currentJsDay === 0 ? -6 : 1 - currentJsDay;

    return DAYS_OF_WEEK.map((dayCfg, index) => {
      // Offset from Monday
      const dayOffset = index; // 0 for Mon, 1 for Tue, ... 6 for Sun
      const dayDate = new Date(today);
      dayDate.setDate(today.getDate() + diffToMonday + dayOffset);
      const dateStr = getLocalDateString(dayDate);

      const isToday = dateStr === todayDate;
      const isPast = dateStr < todayDate;
      const isFuture = dateStr > todayDate;

      const summary = getDaySummary(dayCfg.key, dateStr);
      const isCompleted = summary.isCompleted || Boolean(streak.history[dateStr]);

      return {
        day: dayCfg,
        dateStr,
        isToday,
        isPast,
        isFuture,
        isRestDay: summary.isRestDay,
        isCompleted,
        percent: summary.percent,
        itemCount: summary.itemCount,
      };
    });
  }, [todayDate, getDaySummary, streak.history]);

  // 8. CRUD Actions
  const addItem = useCallback(
    async (item: Omit<TimetableItem, 'id'>) => {
      const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `item-${Date.now()}`;
      const newItem: TimetableItem = {
        ...item,
        id,
        createdAt: new Date().toISOString(),
      };

      const updated = [...items, newItem];
      await saveItems(updated);
      toast.success(`Added ${item.subjectName} to ${item.dayOfWeek.toUpperCase()}`);
    },
    [items, saveItems]
  );

  const updateItem = useCallback(
    async (id: string, updates: Partial<TimetableItem>) => {
      const updated = items.map(it => (it.id === id ? { ...it, ...updates } : it));
      await saveItems(updated);
      toast.success('Schedule item updated');
    },
    [items, saveItems]
  );

  const deleteItem = useCallback(
    async (id: string) => {
      const itemToDelete = items.find(it => it.id === id);
      const updated = items.filter(it => it.id !== id);
      await saveItems(updated);
      toast.success(`Removed ${itemToDelete?.subjectName || 'subject'} from schedule`);
    },
    [items, saveItems]
  );

  const copyDaySchedule = useCallback(
    async (fromDay: DayOfWeek, toDays: DayOfWeek[]) => {
      const sourceItems = items.filter(it => it.dayOfWeek === fromDay);
      if (sourceItems.length === 0) {
        toast.error(`No subjects found on ${fromDay.toUpperCase()} to copy`);
        return;
      }

      // Filter out existing items on destination days and replace with copied items
      const nonDestItems = items.filter(it => !toDays.includes(it.dayOfWeek));
      const copiedItems: TimetableItem[] = [];

      toDays.forEach(targetDay => {
        sourceItems.forEach(src => {
          copiedItems.push({
            ...src,
            id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `copy-${Date.now()}-${Math.random()}`,
            dayOfWeek: targetDay,
            createdAt: new Date().toISOString(),
          });
        });
      });

      const updated = [...nonDestItems, ...copiedItems];
      await saveItems(updated);
      toast.success(`Copied schedule to ${toDays.map(d => d.toUpperCase()).join(', ')}`);
    },
    [items, saveItems]
  );

  const clearDaySchedule = useCallback(
    async (day: DayOfWeek) => {
      const updated = items.filter(it => it.dayOfWeek !== day);
      await saveItems(updated);
      toast.success(`Cleared ${day.toUpperCase()} schedule`);
    },
    [items, saveItems]
  );

  const loadDefaultSchedule = useCallback(async () => {
    await saveItems(DEFAULT_STARTER_SCHEDULE);
    toast.success('Loaded weekly starter schedule');
  }, [saveItems]);

  // 9. Manual Offline Adjustments
  const adjustOfflineTime = useCallback(
    (itemId: string, addSeconds: number, dateStr: string = todayDate) => {
      const key = `${dateStr}_${itemId}`;
      const current = manualLogs[key] || 0;
      const updated = {
        ...manualLogs,
        [key]: Math.max(0, current + addSeconds),
      };
      saveManualLogs(updated);

      const mins = Math.round(addSeconds / 60);
      toast.success(`${mins > 0 ? `+${mins}m` : `${mins}m`} offline time logged!`);
    },
    [manualLogs, todayDate, saveManualLogs]
  );

  const setSubjectCompleted = useCallback(
    (itemId: string, completed: boolean, dateStr: string = todayDate) => {
      const item = items.find(it => it.id === itemId);
      if (!item) return;

      const key = `${dateStr}_${itemId}`;
      if (completed) {
        // Set manual logged seconds to meet target
        const currentProg = getItemProgress(item, dateStr);
        const diff = Math.max(0, item.targetSeconds - currentProg.loggedSeconds);
        const updated = {
          ...manualLogs,
          [key]: (manualLogs[key] || 0) + diff,
        };
        saveManualLogs(updated);
        soundFx.playReactionPop();
        toast.success(`Marked ${item.subjectName} completed for today!`);
      } else {
        // Reset manual adjustment
        const updated = { ...manualLogs };
        delete updated[key];
        saveManualLogs(updated);
        toast('Subject progress reset', { icon: '↩️' });
      }
    },
    [items, manualLogs, todayDate, getItemProgress, saveManualLogs]
  );

  // 10. Focus On This Button (Seamless Timer Integration)
  const focusOnSubject = useCallback(
    async (item: TimetableItem) => {
      // Find existing subject in study context
      let targetSubject = subjects.find(
        s =>
          (item.subjectId && s.id === item.subjectId) ||
          (s.name && s.name.trim().toLowerCase() === item.subjectName.trim().toLowerCase())
      );

      // If subject doesn't exist yet in subjects list, automatically add it!
      if (!targetSubject) {
        const targetMins = Math.round(item.targetSeconds / 60);
        try {
          await addSubject({
            name: item.subjectName,
            color: item.color || TIMETABLE_COLOR_PRESETS[0],
            daily_goal_minutes: targetMins,
            targetMinutesPerDay: targetMins,
          });
          // Re-query or select created subject
          targetSubject = subjects.find(
            s => s.name.trim().toLowerCase() === item.subjectName.trim().toLowerCase()
          );
        } catch (e) {
          console.warn('Failed auto-creating subject', e);
        }
      }

      if (targetSubject?.id) {
        setSelectedSubjectId(targetSubject.id);
      }

      // Switch to timer tab
      window.dispatchEvent(new CustomEvent('switch_tab', { detail: 'timer' }));
      soundFx.playStartChime();
      toast(`Focused on ${item.subjectName}! Ready to start study session.`, {
        icon: '🎯',
      });
    },
    [subjects, addSubject, setSelectedSubjectId]
  );

  const value: TimetableContextType = {
    selectedDay,
    setSelectedDay,
    items,
    itemsForSelectedDay,
    addItem,
    updateItem,
    deleteItem,
    copyDaySchedule,
    clearDaySchedule,
    loadDefaultSchedule,
    streak,
    manualLogs,
    adjustOfflineTime,
    setSubjectCompleted,
    focusOnSubject,
    getItemProgress,
    getDaySummary,
    weekOverview,
    isTodayGoalCompleted,
    todayCompletionPercent,
    syncStatus,
  };

  return <TimetableContext.Provider value={value}>{children}</TimetableContext.Provider>;
}

export function useTimetable(): TimetableContextType {
  const context = useContext(TimetableContext);
  if (!context) {
    throw new Error('useTimetable must be used within a TimetableProvider');
  }
  return context;
}
