'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback, useMemo } from 'react';
import { Subject, StudySession, TodoItem, TimerMode, PomodoroPhase, PomodoroPreset, PomodoroCompletedPhase, RankSettlementData, SeasonRecapData, UserProfile, ActiveSession } from '../types';
import { INITIAL_TODOS, getTodayDateString, calculateStreak, cleanupLegacyDemoData } from '../lib/mockData';
import { getLocalStartOfDay, getLocalEndOfDay, getLocalDateString } from '../lib/dateUtils';
import { useAuth } from './AuthContext';
import { getSupabase } from '../lib/supabase';
import { soundFx } from '../lib/audio';
import confetti from 'canvas-confetti';
import {
  getLevelProgress,
  calculateFocusXP,
  LevelProgress,
} from '../lib/gamification';
import {
  calculateSessionRP,
  calculateSeasonReset,
  getCurrentSeasonId,
} from '../lib/rankedSystem';

interface StudyContextType {
  gamification: LevelProgress;
  settlementData: RankSettlementData | null;
  showRankSettlement: (data: RankSettlementData) => void;
  dismissRankSettlement: () => void;
  seasonRecap: SeasonRecapData | null;
  dismissSeasonRecap: () => void;
  simulateSeasonReset: () => void;
  lastXpEarned: { id: string; amount: number; reason: string; type?: 'focus' | 'todo' | 'streak' | 'general' } | null;
  levelUpData: { newLevel: number; oldLevel: number; title: string } | null;
  dismissLevelUpModal: () => void;
  dismissXpNotification: () => void;
  triggerXpEarned: (amount: number, reason: string, type?: 'focus' | 'todo' | 'streak' | 'general') => void;
  subjects: Subject[];
  selectedSubject: Subject | null;
  selectedSubjectId: string;
  setSelectedSubjectId: (id: string) => void;
  timerMode: TimerMode;
  setTimerMode: (mode: TimerMode) => void;
  isStudying: boolean;
  isPaused: boolean;
  isRunning: boolean;
  startTimeRef: React.MutableRefObject<number | null>;
  elapsedSeconds: number;
  pomodoroPhase: PomodoroPhase;
  setPomodoroPhase: (phase: PomodoroPhase) => void;
  pomodoroWorkDuration: number;
  pomodoroBreakDuration: number;
  pomodoroPreset: PomodoroPreset;
  setPomodoroPreset: (preset: PomodoroPreset) => void;
  pomodoroCompletedPhase: PomodoroCompletedPhase;
  setPomodoroCompletedPhase: (phase: PomodoroCompletedPhase) => void;
  saveAndStartBreak: () => Promise<void>;
  skipPomodoroBreak: () => Promise<void>;
  startPomodoroBreak: () => void;
  activeTaskId: string | null;
  currentNotes: string;
  setCurrentNotes: (notes: string) => void;
  sessions: StudySession[];
  todos: TodoItem[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  isFocusModeOpen: boolean;
  setIsFocusModeOpen: (open: boolean) => void;
  startTimer: (subjectId?: string, taskId?: string) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: (durationOverride?: number, notesOverride?: string, subjectOverride?: Subject | null) => Promise<void>;
  completeTimer: (durationOverride?: number, notesOverride?: string, subjectOverride?: Subject | null) => Promise<void>;
  saveSession?: (sessionData: {
    user_id?: string;
    userId?: string;
    subject_id?: string;
    subjectId?: string;
    subject_name?: string;
    subjectName?: string;
    subject_color?: string;
    subjectColor?: string;
    duration_seconds?: number;
    durationSeconds?: number;
    duration?: number;
    created_at?: string;
    notes?: string;
    mode?: TimerMode;
  }) => Promise<boolean>;
  resetTimer: () => void;
  restoreTimerSession: (seconds: number, mode?: TimerMode, subjectIdOrName?: string) => void;
  clearPersistedTimer: () => void;
  addSubject: (subject: Omit<Subject, 'id' | 'createdAt'>) => void;
  updateSubject: (id: string, updates: Partial<Subject>) => void;
  deleteSubject: (id: string) => Promise<void>;
  addTodo: (todo: Omit<TodoItem, 'id' | 'userId' | 'createdAt'>) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  updateTodoTitle: (id: string, title: string) => void;
  clearCompletedTodos: () => void;
  getTodayTotalSeconds: () => number;
  refetchSessions: () => Promise<void>;
  fetchHistoricalSessions?: () => Promise<void>;
  querySessionsByRange: (startOfDay: Date, endOfDay: Date) => Promise<StudySession[]>;
  addSession: (session: StudySession) => void;
  persistStudySession: (sessionData: {
    subjectId?: string;
    subjectName?: string;
    subjectColor?: string;
    durationSeconds: number;
    startTime: string;
    endTime: string;
    notes?: string;
    mode?: TimerMode;
  }) => Promise<boolean>;
}

export const getSubjectStorageKey = (uid?: string) => `study_io_subjects_${uid || 'guest'}`;
export const getSelectedSubjectStorageKey = (uid?: string) => `study_io_selected_subject_${uid || 'guest'}`;
export const getSessionStorageKey = (uid?: string) => `study_io_sessions_${uid || 'guest'}`;

export function normalizeStudySessions(
  list: any[],
  subjectList: Subject[] = [],
  currentUser?: UserProfile
): StudySession[] {
  if (!Array.isArray(list)) return [];
  const validSubjects = Array.isArray(subjectList) ? subjectList : [];

  return list
    .filter(s => {
      if (!s || typeof s !== 'object') return false;
      const duration = Number(s.durationSeconds ?? (s as any).duration_seconds ?? (s as any).duration ?? (s as any).seconds ?? 0);
      if (duration <= 0) return false;
      const rawName = ((s as any).subject_name || s.subjectName || (s as any).subject?.name || (s as any).subject || '').trim().toLowerCase();
      // Only filter out legacy dummy unassigned sessions with no matched subject
      if (rawName === 'unassigned') {
        const subId = (s.subjectId || (s as any).subject_id || '').trim();
        const hasMatchedSub = validSubjects.some(sub => sub && sub.id === subId && sub.name.toLowerCase() !== 'unassigned');
        if (!hasMatchedSub) return false;
      }
      return true;
    })
    .map((s, idx): StudySession => {
      const subjectId = (s.subjectId || (s as any).subject_id || '').trim();
      const rawSubjectName = ((s as any).subject_name || s.subjectName || (s as any).subject?.name || (s as any).subject || '').trim();

      const matchedSub = validSubjects.find(
        sub => sub && (
          (subjectId && sub.id === subjectId) ||
          (rawSubjectName && sub.name && sub.name.trim().toLowerCase() === rawSubjectName.toLowerCase())
        )
      );

      const resolvedName = matchedSub?.name || (rawSubjectName && rawSubjectName.toLowerCase() !== 'unassigned' ? rawSubjectName : 'General Focus');
      const resolvedColor =
        matchedSub?.color ||
        (s.subjectColor && s.subjectColor !== '#5A6B6A' ? s.subjectColor : null) ||
        (s as any).subject_color ||
        (s as any).subjects?.color ||
        '#10B981';

      const startTime =
        s.startTime ||
        (s as any).started_at ||
        s.createdAt ||
        (s as any).created_at ||
        new Date().toISOString();

      const durationSeconds = Number(
        s.durationSeconds ?? (s as any).duration_seconds ?? (s as any).duration ?? (s as any).seconds ?? 0
      );

      return {
        id: s.id || `sess-${Date.now()}-${idx}`,
        userId: s.userId || (s as any).user_id || currentUser?.id || 'guest',
        userName: s.userName || currentUser?.displayName || 'Scholar',
        userAvatar: s.userAvatar || currentUser?.avatarUrl,
        subjectId: matchedSub?.id || subjectId || '',
        subjectName: resolvedName,
        subjectColor: resolvedColor,
        subject_name: resolvedName,
        subject_color: resolvedColor,
        subject: s.subject || s.subjects || matchedSub,
        startTime,
        endTime: s.endTime || (s as any).ended_at || (s as any).completed_at || startTime,
        durationSeconds,
        duration_seconds: durationSeconds,
        notes: s.notes || '',
        mode: (s.mode as TimerMode) || 'stopwatch',
        createdAt: s.createdAt || (s as any).created_at || startTime,
      };
    });
}

export function mergeAndDeduplicateSessions(existing: StudySession[], incoming: StudySession[]): StudySession[] {
  const map = new Map<string, StudySession>();

  const getDedupKey = (s: StudySession) => {
    const rawTime = s.startTime || (s as any).started_at || s.createdAt;
    const dur = s.durationSeconds ?? (s as any).duration_seconds ?? 0;
    return `${s.id || ''}__${rawTime}__${dur}`;
  };

  for (const s of existing) {
    if (!s) continue;
    map.set(getDedupKey(s), s);
  }

  for (const s of incoming) {
    if (!s) continue;
    const incomingDedup = getDedupKey(s);
    const timeKey = `${s.startTime || (s as any).started_at || s.createdAt}__${s.durationSeconds ?? (s as any).duration_seconds ?? 0}`;
    
    for (const [k, existingSess] of Array.from(map.entries())) {
      const existingTimeKey = `${existingSess.startTime || (existingSess as any).started_at || existingSess.createdAt}__${existingSess.durationSeconds ?? (existingSess as any).duration_seconds ?? 0}`;
      if (existingTimeKey === timeKey && k !== incomingDedup) {
        map.delete(k);
      }
    }
    map.set(incomingDedup, s);
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );
}

export function getStoredSessions(uid?: string, subjectList: Subject[] = [], currentUser?: UserProfile): StudySession[] {
  if (typeof window === 'undefined') return [];
  const map = new Map<string, StudySession>();

  const keys = [
    uid ? getSessionStorageKey(uid) : null,
    'study_io_sessions_guest',
    'studypulse_sessions',
    'studypulse_pending_sessions',
  ].filter(Boolean) as string[];

  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const normalized = normalizeStudySessions(parsed, subjectList, currentUser);
        for (const s of normalized) {
          const timeKey = `${s.startTime || (s as any).started_at || s.createdAt}__${s.durationSeconds}`;
          const idKey = s.id || timeKey;
          if (!map.has(idKey)) {
            map.set(idKey, s);
          }
        }
      }
    } catch {}
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );
}

export function persistSessionsToLocalStorage(sessions: StudySession[], uid?: string) {
  if (typeof window === 'undefined') return;
  try {
    const serialized = JSON.stringify(sessions);
    if (uid) {
      localStorage.setItem(getSessionStorageKey(uid), serialized);
    }
    localStorage.setItem('study_io_sessions_guest', serialized);
    localStorage.setItem('studypulse_sessions', serialized);
  } catch {}
}

export function deduplicateSubjects(list: Subject[]): Subject[] {
  if (!Array.isArray(list)) return [];
  const seenActiveNames = new Set<string>();
  const seenIds = new Set<string>();
  const result: Subject[] = [];

  // 1. Non-archived subjects first (deduplicated by normalized name)
  for (const item of list) {
    if (!item) continue;
    if (item.is_archived) continue;
    const normalized = (item.name || '').trim().toLowerCase();
    if (!normalized || seenActiveNames.has(normalized) || (item.id && seenIds.has(item.id))) continue;
    seenActiveNames.add(normalized);
    if (item.id) seenIds.add(item.id);
    result.push(item);
  }

  // 2. Archived subjects preserved by id for session lookups and historical analytics
  for (const item of list) {
    if (!item) continue;
    if (!item.is_archived) continue;
    if (item.id && seenIds.has(item.id)) continue;
    if (item.id) seenIds.add(item.id);
    result.push(item);
  }

  return result;
}

export const getStoredLastSeenLevel = (userId?: string): number | null => {
  if (typeof window === 'undefined') return null;
  try {
    if (userId) {
      const userVal = localStorage.getItem(`studypulse_last_seen_level_${userId}`);
      if (userVal !== null && !isNaN(Number(userVal))) return Number(userVal);
    }
    const globalVal = localStorage.getItem('last_seen_level') || localStorage.getItem('studypulse_last_seen_level');
    if (globalVal !== null && !isNaN(Number(globalVal))) return Number(globalVal);
  } catch {}
  return null;
};

export const setStoredLastSeenLevel = (level: number, userId?: string) => {
  if (typeof window === 'undefined') return;
  try {
    if (userId) {
      localStorage.setItem(`studypulse_last_seen_level_${userId}`, String(level));
    }
    localStorage.setItem('last_seen_level', String(level));
    localStorage.setItem('studypulse_last_seen_level', String(level));
  } catch {}
};

const StudyContext = createContext<StudyContextType | undefined>(undefined);

export function StudyProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, updateProfile } = useAuth();
  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Helper keys for user-scoped and local storage (module-level functions used)

  // State with immediate storage initialization
  const [subjects, setSubjectsState] = useState<Subject[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const uid = user?.id || 'guest';
        const saved =
          localStorage.getItem(getSubjectStorageKey(uid)) ||
          localStorage.getItem('study_io_subjects_guest') ||
          localStorage.getItem('studypulse_subjects');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return deduplicateSubjects(parsed);
          }
        }
      } catch {}
    }
    return [];
  });

  const [selectedSubjectId, setSelectedSubjectIdState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        const uid = user?.id || 'guest';
        const saved =
          localStorage.getItem(getSelectedSubjectStorageKey(uid)) ||
          localStorage.getItem('study_io_selected_subject_guest') ||
          localStorage.getItem('studypulse_selected_subject_id');
        if (saved) return saved;
      } catch {}
    }
    return '';
  });

  const activeSubjectRef = useRef<Subject | null>(null);

  const setSelectedSubjectId = useCallback((id: string) => {
    setSelectedSubjectIdState(id);
    const sub = (Array.isArray(subjects) ? subjects : []).find(s => s && s.id === id && !s.is_archived) || null;
    activeSubjectRef.current = sub;
    if (typeof window !== 'undefined') {
      try {
        const uid = userRef.current?.id || 'guest';
        localStorage.setItem(getSelectedSubjectStorageKey(uid), id);
        localStorage.setItem('studypulse_selected_subject_id', id);
      } catch {}
    }
  }, [subjects]);

  const [timerMode, setTimerMode] = useState<TimerMode>('stopwatch');
  
  const [isStudying, setIsStudying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [pomodoroPhase, setPomodoroPhase] = useState<PomodoroPhase>('work');
  const [pomodoroPreset, setPomodoroPresetState] = useState<PomodoroPreset>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('studypulse_pomodoro_preset');
        if (saved === '25/5' || saved === '50/10') return saved;
      } catch {}
    }
    return '25/5';
  });
  const [pomodoroCompletedPhase, setPomodoroCompletedPhase] = useState<PomodoroCompletedPhase>(null);

  const pomodoroWorkDuration = useMemo(() => {
    return pomodoroPreset === '50/10' ? 50 * 60 : 25 * 60;
  }, [pomodoroPreset]);

  const pomodoroBreakDuration = useMemo(() => {
    return pomodoroPreset === '50/10' ? 10 * 60 : 5 * 60;
  }, [pomodoroPreset]);

  const setPomodoroPreset = useCallback((preset: PomodoroPreset) => {
    if (isStudying) {
      console.warn('Cannot change Pomodoro preset while session is running.');
      return;
    }
    setPomodoroPresetState(preset);
    try {
      localStorage.setItem('studypulse_pomodoro_preset', preset);
    } catch {}
    setElapsedSeconds(0);
    accumulatedSecondsRef.current = 0;
  }, [isStudying]);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [currentNotes, setCurrentNotes] = useState('');
  const [isFocusModeOpen, setIsFocusModeOpen] = useState(false);

  const [sessions, setSessions] = useState<StudySession[]>(() => {
    let uid = user?.id;
    if (!uid && typeof window !== 'undefined') {
      try {
        const storedUser = localStorage.getItem('studypulse_active_user');
        if (storedUser) uid = JSON.parse(storedUser)?.id;
      } catch {}
    }
    return getStoredSessions(uid);
  });
  const [todos, setTodos] = useState<TodoItem[]>(INITIAL_TODOS);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString(0));

  // Gamification & Celebrations State
  const [lastXpEarned, setLastXpEarned] = useState<{
    id: string;
    amount: number;
    reason: string;
    type?: 'focus' | 'todo' | 'streak' | 'general';
  } | null>(null);

  const [levelUpData, setLevelUpData] = useState<{
    newLevel: number;
    oldLevel: number;
    title: string;
  } | null>(null);

  const triggerXpEarned = useCallback((
    amount: number,
    reason: string,
    type: 'focus' | 'todo' | 'streak' | 'general' = 'general'
  ) => {
    if (amount <= 0) return;
    setLastXpEarned({
      id: `xp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      amount,
      reason,
      type,
    });
  }, []);

  const dismissLevelUpModal = useCallback(() => {
    if (levelUpData) {
      setStoredLastSeenLevel(levelUpData.newLevel, user?.id);
      updateProfile({ last_seen_level: levelUpData.newLevel });
    }
    setLevelUpData(null);
  }, [levelUpData, user?.id, updateProfile]);

  const dismissXpNotification = useCallback(() => {
    setLastXpEarned(null);
  }, []);

  // Free Fire Ranked Settlement & Monthly Season State
  const [settlementData, setSettlementData] = useState<RankSettlementData | null>(null);
  const [seasonRecap, setSeasonRecap] = useState<SeasonRecapData | null>(null);

  const showRankSettlement = useCallback((data: RankSettlementData) => {
    setSettlementData(data);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as unknown as { __showRankSettlement?: (data: RankSettlementData) => void }).__showRankSettlement = showRankSettlement;
    }
  }, [showRankSettlement]);

  const dismissSeasonRecap = useCallback(() => {
    setSeasonRecap(null);
    try {
      localStorage.removeItem('studypulse_season_recap');
    } catch {}
  }, []);

  // Developer / Test simulation of monthly season soft-reset
  const simulateSeasonReset = useCallback(() => {
    const currentMonth = getCurrentSeasonId();
    const previousRP = user?.seasonRp || 1450; // Demo value or existing
    const resetResult = calculateSeasonReset(previousRP);
    const recap: SeasonRecapData = {
      previousSeasonId: '2026-08',
      newSeasonId: currentMonth,
      previousRP,
      previousTierTitle: resetResult.previousTier.fullTitle,
      newRP: resetResult.newRP,
      newTierTitle: resetResult.newTier.fullTitle,
    };
    updateProfile({
      currentSeasonId: currentMonth,
      seasonRp: resetResult.newRP,
    });
    setSeasonRecap(recap);
    try {
      localStorage.setItem('studypulse_season_recap', JSON.stringify(recap));
    } catch {}
  }, [user?.seasonRp, updateProfile]);

  // Monthly Ranked Season Check on app launch
  useEffect(() => {
    const currentMonth = getCurrentSeasonId();

    try {
      const savedRecap = localStorage.getItem('studypulse_season_recap');
      if (savedRecap) {
        setSeasonRecap(JSON.parse(savedRecap));
      }
    } catch {}

    if (user && user.id && !user.id.startsWith('user-scholar')) {
      if (user.currentSeasonId && user.currentSeasonId !== currentMonth) {
        const prevSeason = user.currentSeasonId;
        const prevRP = user.seasonRp || 0;
        const reset = calculateSeasonReset(prevRP);

        const recap: SeasonRecapData = {
          previousSeasonId: prevSeason,
          newSeasonId: currentMonth,
          previousRP: prevRP,
          previousTierTitle: reset.previousTier.fullTitle,
          newRP: reset.newRP,
          newTierTitle: reset.newTier.fullTitle,
        };

        updateProfile({
          currentSeasonId: currentMonth,
          seasonRp: reset.newRP,
        });

        setSeasonRecap(recap);
        try {
          localStorage.setItem('studypulse_season_recap', JSON.stringify(recap));
        } catch {}
      } else if (!user.currentSeasonId) {
        updateProfile({
          currentSeasonId: currentMonth,
          seasonRp: user.seasonRp ?? 0,
        });
      }
    }
  }, [user?.id, user?.currentSeasonId, user?.seasonRp, updateProfile]);

  // Compute total focus time in seconds from all saved sessions
  const totalStudySeconds = useMemo(() => {
    return sessions.reduce((sum, s) => sum + (s.durationSeconds || 0), 0);
  }, [sessions]);

  // Compute total completed tasks
  const completedTodosCount = useMemo(() => {
    return todos.filter(t => t.completed).length;
  }, [todos]);

  // Derive real-time Gamification level progress
  const gamification = useMemo(() => {
    return getLevelProgress(totalStudySeconds, completedTodosCount, user.streakDays || 0);
  }, [totalStudySeconds, completedTodosCount, user.streakDays]);

  // Monitor level changes to trigger celebratory modal and keep profile state synced
  const hasHydratedLevelRef = useRef(false);
  const lastUserIdRef = useRef<string | undefined>(user?.id);

  useEffect(() => {
    if (lastUserIdRef.current !== user?.id) {
      lastUserIdRef.current = user?.id;
      hasHydratedLevelRef.current = false;
    }

    const currentLevel = gamification.level;
    const storedLastSeen = getStoredLastSeenLevel(user?.id);

    // Initial mount or data hydration check: establish baseline last_seen_level and do NOT trigger modal on mount/login
    if (!hasHydratedLevelRef.current) {
      const baselineLevel = Math.max(
        storedLastSeen ?? 0,
        user?.last_seen_level ?? 0,
        user?.level ?? 1,
        currentLevel
      );
      setStoredLastSeenLevel(baselineLevel, user?.id);
      if (user?.last_seen_level !== baselineLevel) {
        updateProfile({ last_seen_level: baselineLevel });
      }
      hasHydratedLevelRef.current = true;
      return;
    }

    const effectiveLastSeen = storedLastSeen ?? user?.last_seen_level ?? user?.level ?? currentLevel;

    // Strict Progression Only: ONLY trigger if currentLevel strictly exceeds last_seen_level
    if (currentLevel > effectiveLastSeen) {
      setLevelUpData({
        newLevel: currentLevel,
        oldLevel: effectiveLastSeen,
        title: gamification.title,
      });

      // Update last_seen_level immediately when triggered / viewed
      setStoredLastSeenLevel(currentLevel, user?.id);
      updateProfile({
        last_seen_level: currentLevel,
      });
    }

    // Synchronize level and XP onto active user profile
    if (user?.level !== gamification.level || user?.xp !== gamification.totalXP) {
      updateProfile({
        level: gamification.level,
        xp: gamification.totalXP,
        levelTitle: gamification.title,
      });
    }
  }, [
    gamification.level,
    gamification.totalXP,
    gamification.title,
    user?.id,
    user?.level,
    user?.last_seen_level,
    user?.xp,
    updateProfile,
  ]);

  const startTimeRef = useRef<number | null>(null);
  const accumulatedSecondsRef = useRef<number>(0);
  const sessionStartTimeRef = useRef<Date | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastLocalActionRef = useRef<{ timestamp: number; status: string } | null>(null);

  const isRunning = isStudying && !isPaused;

  // Real-Time Delta Tracking: Synchronized interval engine running at 500ms tick to eliminate background throttling drift
  useEffect(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (isStudying && !isPaused) {
      // Ensure anchor timestamp exists
      if (startTimeRef.current === null) {
        startTimeRef.current = Date.now() - (accumulatedSecondsRef.current * 1000);
      }

      timerIntervalRef.current = setInterval(() => {
        if (startTimeRef.current === null) return;
        const actualElapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        accumulatedSecondsRef.current = actualElapsed;

        if (timerMode === 'pomodoro') {
          const target = pomodoroPhase === 'work' ? pomodoroWorkDuration : pomodoroBreakDuration;
          if (actualElapsed >= target) {
            if (pomodoroPhase === 'work') {
              // 1. Freeze at 00:00, chime, and wait for manual phase transition
              if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
              }
              accumulatedSecondsRef.current = target;
              setElapsedSeconds(target);
              startTimeRef.current = null;
              setIsPaused(true);
              setPomodoroCompletedPhase('work');
              soundFx.playMilestoneBell();
              confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
              return;
            } else {
              // 2. Break reached 00:00: chime, freeze, and switch to work in PAUSED state
              if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
              }
              startTimeRef.current = null;
              accumulatedSecondsRef.current = 0;
              setElapsedSeconds(0);
              setPomodoroPhase('work');
              setIsStudying(false);
              setIsPaused(true);
              setPomodoroCompletedPhase('break');
              soundFx.playMilestoneBell();
              confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
              return;
            }
          }
        }

        setElapsedSeconds(actualElapsed);
      }, 500);
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [isStudying, isPaused, timerMode, pomodoroPhase, pomodoroWorkDuration, pomodoroBreakDuration]);

  // Window Focus / Tab Visibility Resync:
  // When document.visibilityState === 'visible' and timer is running, immediately recalculate elapsed seconds from Date.now() - startTimeRef.current
  useEffect(() => {
    const handleVisibilityOrFocus = () => {
      if (
        document.visibilityState === 'visible' &&
        isStudying &&
        !isPaused &&
        startTimeRef.current !== null
      ) {
        const actualElapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        accumulatedSecondsRef.current = actualElapsed;

        if (timerMode === 'pomodoro') {
          const target = pomodoroPhase === 'work' ? pomodoroWorkDuration : pomodoroBreakDuration;
          if (actualElapsed >= target) {
            if (pomodoroPhase === 'work') {
              if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
              }
              accumulatedSecondsRef.current = target;
              setElapsedSeconds(target);
              startTimeRef.current = null;
              setIsPaused(true);
              setPomodoroCompletedPhase('work');
              soundFx.playMilestoneBell();
              confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
              return;
            } else {
              if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
              }
              startTimeRef.current = null;
              accumulatedSecondsRef.current = 0;
              setElapsedSeconds(0);
              setPomodoroPhase('work');
              setIsStudying(false);
              setIsPaused(true);
              setPomodoroCompletedPhase('break');
              soundFx.playMilestoneBell();
              confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
              return;
            }
          }
        }

        setElapsedSeconds(actualElapsed);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, [isStudying, isPaused, timerMode, pomodoroPhase, pomodoroWorkDuration, pomodoroBreakDuration]);

  // Cleanly wipe any persisted timer state from localStorage
  const clearPersistedTimer = useCallback(() => {
    try {
      localStorage.removeItem('studyio_timer_seconds');
      localStorage.removeItem('studyio_timer_subject');
      localStorage.removeItem('studyio_timer_mode');
    } catch (e) {
      console.warn('Failed to clear timer state from localStorage:', e);
    }
  }, []);

  // Multi-Device Realtime Sync: Write state transition to active_sessions table
  const syncActiveSessionToDb = useCallback(async (
    status: 'running' | 'paused' | 'stopped',
    extra?: {
      startedAt?: string | null;
      elapsedBeforePause?: number;
      subjectId?: string | null;
      subjectName?: string | null;
      mode?: TimerMode;
      targetDuration?: number | null;
    }
  ) => {
    const supabase = getSupabase();
    const uid = userRef.current?.id || user?.id;
    if (!supabase || !uid || uid.startsWith('user-scholar')) return;

    lastLocalActionRef.current = { timestamp: Date.now(), status };

    try {
      if (status === 'stopped') {
        await supabase.from('active_sessions').delete().eq('user_id', uid);
      } else {
        const sub = activeSubjectRef.current || (Array.isArray(subjects) ? subjects : []).find(s => s && s.id === selectedSubjectId);
        const isUuid = (id?: string | null) => typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        const activeSubId = extra?.subjectId !== undefined ? extra.subjectId : (isUuid(sub?.id) ? sub!.id : null);
        const activeSubName = extra?.subjectName !== undefined ? extra.subjectName : (sub?.name || null);
        const effectiveMode = extra?.mode || timerMode || 'stopwatch';
        const targetDuration = extra?.targetDuration !== undefined ? extra.targetDuration : (
          effectiveMode === 'pomodoro'
            ? (pomodoroPhase === 'work' ? pomodoroWorkDuration : pomodoroBreakDuration)
            : null
        );

        await supabase.from('active_sessions').upsert({
          user_id: uid,
          subject_id: activeSubId,
          subject_name: activeSubName,
          status,
          started_at: extra?.startedAt !== undefined ? extra.startedAt : (status === 'running' ? new Date().toISOString() : null),
          elapsed_before_pause: extra?.elapsedBeforePause !== undefined ? extra.elapsedBeforePause : accumulatedSecondsRef.current,
          timer_mode: effectiveMode,
          target_duration: targetDuration,
          updated_at: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.warn('Failed to sync active session to Supabase:', err);
    }
  }, [user?.id, selectedSubjectId, subjects, timerMode, pomodoroPhase, pomodoroWorkDuration, pomodoroBreakDuration]);

  // Multi-Device Realtime Sync: Synchronize remote payload into local timer state
  const handleRemoteSync = useCallback((remoteSession: any) => {
    if (!remoteSession) {
      // Row deleted -> other device stopped/saved session
      if (lastLocalActionRef.current && Date.now() - lastLocalActionRef.current.timestamp < 1500) {
        return;
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      startTimeRef.current = null;
      accumulatedSecondsRef.current = 0;
      sessionStartTimeRef.current = null;
      setElapsedSeconds(0);
      setIsStudying(false);
      setIsPaused(false);
      setPomodoroCompletedPhase(null);
      clearPersistedTimer();
      return;
    }

    const {
      status,
      started_at,
      elapsed_before_pause = 0,
      timer_mode = 'stopwatch',
      target_duration,
      subject_id,
      subject_name,
    } = remoteSession;

    // Ignore immediate echo of local action
    if (
      lastLocalActionRef.current &&
      lastLocalActionRef.current.status === status &&
      Date.now() - lastLocalActionRef.current.timestamp < 1500
    ) {
      return;
    }

    if (timer_mode && (timer_mode === 'stopwatch' || timer_mode === 'pomodoro')) {
      setTimerMode(timer_mode);
    }

    if (subject_id) {
      setSelectedSubjectId(subject_id);
    } else if (subject_name) {
      const found = (Array.isArray(subjects) ? subjects : []).find(
        s => (s.name || '').toLowerCase() === subject_name.toLowerCase()
      );
      if (found) setSelectedSubjectId(found.id);
    }

    if (status === 'running') {
      const elapsedBefore = Number(elapsed_before_pause) || 0;
      const startedAtMs = started_at ? new Date(started_at).getTime() : Date.now();
      const calculatedElapsed = elapsedBefore + Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000));

      if (timer_mode === 'pomodoro' && target_duration && calculatedElapsed >= target_duration) {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
        startTimeRef.current = null;
        accumulatedSecondsRef.current = target_duration;
        setElapsedSeconds(target_duration);
        setIsStudying(true);
        setIsPaused(true);
        setPomodoroCompletedPhase('work');
      } else {
        accumulatedSecondsRef.current = calculatedElapsed;
        startTimeRef.current = Date.now() - (calculatedElapsed * 1000);
        sessionStartTimeRef.current = started_at ? new Date(started_at) : new Date(startTimeRef.current);
        setElapsedSeconds(calculatedElapsed);
        setIsStudying(true);
        setIsPaused(false);
        setPomodoroCompletedPhase(null);
      }
    } else if (status === 'paused') {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      const pausedElapsed = Number(elapsed_before_pause) || 0;
      accumulatedSecondsRef.current = pausedElapsed;
      startTimeRef.current = null;
      setElapsedSeconds(pausedElapsed);
      setIsStudying(true);
      setIsPaused(true);
    } else if (status === 'stopped') {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      startTimeRef.current = null;
      accumulatedSecondsRef.current = 0;
      sessionStartTimeRef.current = null;
      setElapsedSeconds(0);
      setIsStudying(false);
      setIsPaused(false);
      setPomodoroCompletedPhase(null);
      clearPersistedTimer();
    }
  }, [subjects, clearPersistedTimer, setSelectedSubjectId]);

  // Supabase Realtime Subscription & Initial Hydration for multi-device sync
  useEffect(() => {
    const supabase = getSupabase();
    const uid = user?.id;
    if (!supabase || !uid || uid.startsWith('user-scholar')) return;

    let isMounted = true;

    // 1. Fetch existing active row for user.id from active_sessions
    supabase
      .from('active_sessions')
      .select('*')
      .eq('user_id', uid)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!isMounted) return;
        if (error) {
          console.warn('Error fetching active_sessions on mount:', error);
          return;
        }
        if (data) {
          handleRemoteSync(data);
        }
      });

    // 2. Subscribe to Realtime postgres changes filtered by user_id
    const channel = supabase
      .channel(`realtime:active_session:${uid}`)
      .on(
        'postgres_changes' as never,
        {
          event: '*',
          schema: 'public',
          table: 'active_sessions',
          filter: `user_id=eq.${uid}`,
        },
        (payload: any) => {
          if (!isMounted) return;
          if (payload.eventType === 'DELETE') {
            handleRemoteSync(null);
          } else {
            handleRemoteSync(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [user?.id, handleRemoteSync]);

  // Load from Supabase or localStorage fallback
  useEffect(() => {
    cleanupLegacyDemoData();

    // 1. Initial load from storage
    try {
      const uid = user?.id || 'guest';
      const savedSubjects =
        localStorage.getItem(getSubjectStorageKey(uid)) ||
        localStorage.getItem('study_io_subjects_guest') ||
        localStorage.getItem('studypulse_subjects');

      let currentLoadedSubjects: Subject[] = [];
      if (savedSubjects) {
        const parsed = JSON.parse(savedSubjects).map((s: Subject) =>
          s.name === 'General Focus' && (s.color === '#3B82F6' || !s.color) ? { ...s, color: '#5A6B6A' } : s
        );
        currentLoadedSubjects = deduplicateSubjects(parsed);
        if (currentLoadedSubjects.length > 0) {
          setSubjectsState(currentLoadedSubjects);
          const activeSubs = currentLoadedSubjects.filter(s => !s.is_archived);
          if (activeSubs.length > 0) {
            const storedSelected =
              localStorage.getItem(getSelectedSubjectStorageKey(uid)) ||
              localStorage.getItem('study_io_selected_subject_guest') ||
              localStorage.getItem('studypulse_selected_subject_id');
            const matched = activeSubs.find(s => s.id === storedSelected || s.name.toLowerCase() === (storedSelected || '').toLowerCase());
            setSelectedSubjectId(matched ? matched.id : activeSubs[0].id);
          }
        }
      }

      const localSessions = getStoredSessions(uid, subjects, user);
      if (localSessions.length > 0) {
        setSessions(localSessions);
      }

      const savedTodos = localStorage.getItem('studypulse_todos');
      if (savedTodos) {
        setTodos(JSON.parse(savedTodos));
      }
    } catch {
      // ignore
    }

    // 2. If Supabase is available and user is authenticated, query Supabase cloud tables
    const supabase = getSupabase();
    if (!supabase || !isAuthenticated || !user.id || user.id.startsWith('user-scholar-')) {
      return;
    }

    const fetchSupabaseData = async () => {
      try {
        const uid = user.id;
        // Fetch Subjects
        const { data: dbSubjects, error: subError } = await supabase
          .from('subjects')
          .select('*')
          .eq('user_id', uid)
          .order('created_at', { ascending: true });

        // Retrieve existing local cached subjects
        let localCached: Subject[] = [];
        try {
          const raw =
            localStorage.getItem(getSubjectStorageKey(uid)) ||
            localStorage.getItem('study_io_subjects_guest') ||
            localStorage.getItem('studypulse_subjects');
          if (raw) {
            const p = JSON.parse(raw);
            if (Array.isArray(p)) localCached = p;
          }
        } catch {}

        if (Array.isArray(dbSubjects) && dbSubjects.length > 0) {
          const mappedSubjects: Subject[] = dbSubjects.map(s => ({
            id: s.id,
            name: s.name || '',
            color: s.color || '#10B981',
            userId: s.user_id,
            createdAt: s.created_at,
            is_archived: Boolean(s.is_archived),
            daily_goal_minutes: s.daily_goal_minutes ?? s.target_minutes ?? 60,
            targetMinutesPerDay: s.daily_goal_minutes ?? s.target_minutes ?? 60,
          }));

          const merged = deduplicateSubjects([...mappedSubjects, ...localCached]);
          saveSubjects(merged);

          const activeSubs = merged.filter(s => !s.is_archived);
          if (activeSubs.length > 0) {
            const storedId =
              localStorage.getItem(getSelectedSubjectStorageKey(uid)) ||
              localStorage.getItem('studypulse_selected_subject_id');
            const matched = activeSubs.find(s => s.id === storedId || (s.name && storedId && s.name.toLowerCase() === storedId.toLowerCase()));
            setSelectedSubjectId(matched ? matched.id : activeSubs[0].id);
          }
        } else if (subError) {
          console.warn("Supabase subjects fetch error, retaining local cached subjects:", subError);
          // Retain cached subjects! Do NOT reset to []
          if (localCached.length > 0) {
            saveSubjects(localCached);
          }
        } else {
          // Supabase returned 0 rows. Check if we have cached subjects created locally:
          if (localCached.length > 0) {
            console.log("Supabase subjects empty but cached subjects found; preserving and syncing to cloud:", localCached);
            saveSubjects(localCached);
            // Sync local cached subjects to Supabase
            localCached.forEach(async (cachedSub) => {
              try {
                if (!cachedSub.name) return;
                await supabase.from('subjects').insert({
                  user_id: uid,
                  name: cachedSub.name,
                  color: cachedSub.color || '#10B981',
                  daily_goal_minutes: cachedSub.daily_goal_minutes || 60,
                  is_archived: Boolean(cachedSub.is_archived),
                });
              } catch (e) {
                console.warn("Error syncing cached subject to Supabase:", e);
              }
            });
          } else {
            // Truly new user with zero subjects anywhere
            setSubjectsState([]);
          }
        }

        // Fetch Study Sessions with authenticated user
        const { data: { user: authUser } } = await supabase.auth.getUser();
        const activeUserId = authUser?.id || user.id;

        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(activeUserId);
        if (isUuid) {
          const { data: dbSessions, error: sessError } = await supabase
            .from('study_sessions')
            .select('*, subjects(name, color)')
            .eq('user_id', activeUserId)
            .order('started_at', { ascending: false });

          if (sessError) {
            console.error("Failed to fetch initial study sessions:", sessError);
          } else if (dbSessions) {
            const subjectList = Array.isArray(subjects) ? subjects : [];
            const mappedSessions = normalizeStudySessions(dbSessions, subjectList, user);
            const localStored = getStoredSessions(activeUserId, subjectList, user);
            const merged = mergeAndDeduplicateSessions(localStored, mappedSessions);

            setSessions(merged);
            persistSessionsToLocalStorage(merged, activeUserId);

            // Update real streak, total study seconds, and ensure RP matches minimum expected from total study time
            const realStreak = calculateStreak(merged);
            const realTotalSeconds = merged.reduce((sum, s) => sum + s.durationSeconds, 0);
            const totalStudyMinutes = Math.floor(realTotalSeconds / 60);
            const minExpectedRP = totalStudyMinutes * 10;
            const currentRP = Number((userRef.current as any)?.rp ?? userRef.current?.seasonRp ?? 0);
            const finalRP = Math.max(minExpectedRP, currentRP);

            // Baseline sync for Supabase sessions to guarantee no false level-up on login
            const computedLevel = Math.max(1, Math.floor(Math.sqrt(Math.max(0, finalRP) / 100)) + 1);
            const storedLevel = getStoredLastSeenLevel(user.id);
            const updatedBaseline = Math.max(storedLevel ?? 0, computedLevel, user.level || 1);
            setStoredLastSeenLevel(updatedBaseline, user.id);

            updateProfile({
              streakDays: realStreak,
              totalStudySeconds: realTotalSeconds,
              seasonRp: finalRP,
              rp: finalRP,
              last_seen_level: updatedBaseline,
            });
          }
        }

        // Fetch Todos
        const { data: dbTodos } = await supabase
          .from('todos')
          .select('*, subjects(name, color)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (dbTodos) {
          const mappedTodos: TodoItem[] = dbTodos.map(t => ({
            id: t.id,
            userId: t.user_id,
            title: t.task,
            completed: t.is_completed,
            date: t.due_date,
            priority: t.priority || 'medium',
            estimatedMinutes: t.estimated_minutes,
            subjectId: t.subject_id,
            subjectName: t.subjects?.name,
            subjectColor: t.subjects?.color,
            createdAt: t.created_at,
          }));
          setTodos(mappedTodos);
          try { localStorage.setItem('studypulse_todos', JSON.stringify(mappedTodos)); } catch {}
        }
      } catch {
        // fallback to local data
      }
    };

    fetchSupabaseData();
  }, [user.id, isAuthenticated, updateProfile]);

  // Persist local subjects with deduplication and dual storage
  const saveSubjects = useCallback((newSubjects: Subject[]) => {
    const deduplicated = deduplicateSubjects(newSubjects);
    setSubjectsState(deduplicated);
    if (typeof window !== 'undefined') {
      try {
        const uid = userRef.current?.id || 'guest';
        const json = JSON.stringify(deduplicated);
        localStorage.setItem(getSubjectStorageKey(uid), json);
        localStorage.setItem('studypulse_subjects', json);
      } catch {
        // ignore
      }
    }
  }, []);

  // Persist local sessions to both user-scoped and global cache
  const saveSessions = (newSessions: StudySession[]) => {
    const normalized = normalizeStudySessions(newSessions, subjects, userRef.current);
    setSessions(normalized);
    const uid = userRef.current?.id || user?.id;
    persistSessionsToLocalStorage(normalized, uid);
  };

  // Persist local todos
  const saveTodos = (newTodos: TodoItem[]) => {
    setTodos(newTodos);
    try {
      localStorage.setItem('studypulse_todos', JSON.stringify(newTodos));
    } catch {
      // ignore
    }
  };

  const selectedSubject = useMemo(() => {
    if (!selectedSubjectId) return null;
    const subjectList = Array.isArray(subjects) ? subjects : [];
    const found = subjectList.find(s => s && s.id === selectedSubjectId);
    if (!found || found.is_archived) return null;
    return found;
  }, [selectedSubjectId, subjects]);

  // Synchronize pending sessions from localStorage fallback to Supabase
  const syncPendingSessions = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const pendingRaw = localStorage.getItem('studypulse_pending_sessions');
      if (!pendingRaw) return;

      const pending: StudySession[] = JSON.parse(pendingRaw);
      if (!Array.isArray(pending) || pending.length === 0) return;

      const remainingPending: StudySession[] = [];

      for (const item of pending) {
        const isUuid = item.subjectId && item.subjectId.length === 36;
        const { error } = await supabase.from('study_sessions').insert({
          user_id: authUser.id,
          subject_id: isUuid ? item.subjectId : null,
          duration_seconds: item.durationSeconds,
          started_at: item.startTime,
          ended_at: item.endTime,
          notes: item.notes || null,
          mode: item.mode || 'stopwatch',
        });

        if (error) {
          console.error("Failed to sync pending study session:", error);
          remainingPending.push(item);
        }
      }

      if (remainingPending.length === 0) {
        localStorage.removeItem('studypulse_pending_sessions');
      } else {
        localStorage.setItem('studypulse_pending_sessions', JSON.stringify(remainingPending));
      }
    } catch (err) {
      console.error("Error during pending session sync:", err);
    }
  }, []);

  // 1. Hydrate Session History on Mount & Re-fetch all historical sessions
  const refetchSessions = useCallback(async () => {
    const currentUser = userRef.current || user;
    const targetUserId = currentUser?.id;

    // Load from local storage cache first to prevent any UI flashing
    const initialLocal = getStoredSessions(targetUserId, subjects, currentUser);
    if (initialLocal.length > 0) {
      setSessions(initialLocal);
    }

    const supabase = getSupabase();
    if (!supabase || !targetUserId) return;

    try {
      await syncPendingSessions();

      const { data: { user: authUser } } = await supabase.auth.getUser();
      const activeUserId = authUser?.id || targetUserId;
      if (!activeUserId) return;

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(activeUserId);
      if (!isUuid) {
        // Guest user - don't query Supabase UUID columns with guest IDs
        if (initialLocal.length > 0) {
          const realStreak = calculateStreak(initialLocal);
          const realTotalSeconds = initialLocal.reduce((sum, s) => sum + s.durationSeconds, 0);
          if (currentUser.streakDays !== realStreak || currentUser.totalStudySeconds !== realTotalSeconds) {
            updateProfile({
              streakDays: realStreak,
              totalStudySeconds: realTotalSeconds,
            });
          }
        }
        return;
      }

      const { data: dbSessions, error } = await supabase
        .from('study_sessions')
        .select('*, subjects(name, color)')
        .eq('user_id', activeUserId)
        .order('created_at', { ascending: false });

      if (!error && dbSessions) {
        const mappedSessions = normalizeStudySessions(dbSessions, subjects, currentUser);

        setSessions(prev => {
          const localFromStorage = getStoredSessions(activeUserId, subjects, currentUser);
          const allLocal = mergeAndDeduplicateSessions(localFromStorage, prev);
          const merged = mergeAndDeduplicateSessions(allLocal, mappedSessions);

          persistSessionsToLocalStorage(merged, activeUserId);
          return merged;
        });

        setSessions(currentMerged => {
          const realStreak = calculateStreak(currentMerged);
          const realTotalSeconds = currentMerged.reduce((sum, s) => sum + s.durationSeconds, 0);
          const totalStudyMinutes = Math.floor(realTotalSeconds / 60);
          const minExpectedRP = totalStudyMinutes * 10;
          const currentRP = Number((currentUser as any)?.rp ?? currentUser.seasonRp ?? 0);
          const finalRP = Math.max(minExpectedRP, currentRP);

          if (
            currentUser.streakDays !== realStreak ||
            currentUser.totalStudySeconds !== realTotalSeconds ||
            currentRP < minExpectedRP
          ) {
            updateProfile({
              streakDays: realStreak,
              totalStudySeconds: realTotalSeconds,
              seasonRp: finalRP,
              rp: finalRP,
            });
          }
          return currentMerged;
        });
      } else {
        const localData = getStoredSessions(targetUserId, subjects, currentUser);
        if (localData.length > 0) {
          setSessions(localData);
          const realStreak = calculateStreak(localData);
          const realTotalSeconds = localData.reduce((sum, s) => sum + s.durationSeconds, 0);
          updateProfile({
            streakDays: realStreak,
            totalStudySeconds: realTotalSeconds,
          });
        }
      }
    } catch (err) {
      console.error("Failed to refetch sessions:", err);
      const localData = getStoredSessions(targetUserId, subjects, currentUser);
      if (localData.length > 0) {
        setSessions(localData);
      }
    }
  }, [updateProfile, syncPendingSessions, subjects, user?.id]);

  const fetchHistoricalSessions = refetchSessions;

  // Hydrate session history on mount when user.id becomes available
  useEffect(() => {
    if (user?.id) {
      refetchSessions();
    }
  }, [user?.id, refetchSessions]);

  // Listen to studypulse auth change event to automatically refresh dashboard stats & sessions
  useEffect(() => {
    const handleAuthChanged = () => {
      refetchSessions();
    };
    window.addEventListener('studypulse:auth-changed', handleAuthChanged);

    return () => {
      window.removeEventListener('studypulse:auth-changed', handleAuthChanged);
    };
  }, [refetchSessions]);

  // Persist study session immediately to Supabase, logging explicit error and caching locally on failure
  const persistStudySession = useCallback(async (sessionData: {
    subjectId?: string | null;
    subjectName?: string;
    subjectColor?: string;
    durationSeconds: number;
    startTime: string;
    endTime: string;
    notes?: string | null;
    mode?: TimerMode;
  }): Promise<boolean> => {
    const durationInt = Math.round(Number(sessionData.durationSeconds)) || 0;
    if (durationInt <= 0) return false;

    const supabase = getSupabase();
    const subjectList = Array.isArray(subjects) ? subjects : [];
    const targetSub = subjectList.find(s => s && s.id === sessionData.subjectId) || activeSubjectRef.current || selectedSubject;

    const subjectNameToSave = sessionData.subjectName || targetSub?.name;
    if (!subjectNameToSave || subjectNameToSave.trim().toLowerCase() === 'unassigned') {
      if (typeof window !== 'undefined') {
        alert("Please choose a subject before recording focus time.");
      }
      return false;
    }

    const isValidUuid = (val?: string | null): boolean => {
      if (!val || typeof val !== 'string') return false;
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());
    };

    let subjectIdToSave: string | null = null;
    if (isValidUuid(sessionData.subjectId)) {
      subjectIdToSave = sessionData.subjectId!.trim();
    } else if (isValidUuid(targetSub?.id)) {
      subjectIdToSave = targetSub!.id.trim();
    }

    const subjectColorToSave = sessionData.subjectColor || targetSub?.color || '#10b981';

    const newLocalSession: StudySession = {
      id: `sess-${Date.now()}`,
      userId: user.id,
      userName: user.displayName,
      userAvatar: user.avatarUrl,
      subjectId: subjectIdToSave || targetSub?.id || '',
      subjectName: subjectNameToSave,
      subjectColor: subjectColorToSave,
      subject_name: subjectNameToSave,
      startTime: sessionData.startTime,
      endTime: sessionData.endTime,
      durationSeconds: durationInt,
      notes: sessionData.notes || '',
      mode: sessionData.mode || timerMode,
      createdAt: new Date().toISOString(),
    };

    // Cache fallback helper
    const cacheLocallyFallback = () => {
      try {
        const pendingRaw = localStorage.getItem('studypulse_pending_sessions');
        const pending: StudySession[] = pendingRaw ? JSON.parse(pendingRaw) : [];
        if (!pending.some(p => p.startTime === newLocalSession.startTime && p.durationSeconds === newLocalSession.durationSeconds)) {
          pending.push(newLocalSession);
          localStorage.setItem('studypulse_pending_sessions', JSON.stringify(pending));
        }
      } catch {}
    };

    if (!supabase) {
      console.error("Error saving session:", new Error("Supabase client not initialized"));
      cacheLocallyFallback();
      return false;
    }

    try {
      const { data: authData } = await supabase.auth.getUser();
      const authUser = authData?.user;
      let authUserId: string | null = null;
      if (authUser?.id && isValidUuid(authUser.id)) {
        authUserId = authUser.id;
      } else if (isValidUuid(user.id)) {
        authUserId = user.id;
      }

      const payload: Record<string, any> = {
        user_id: authUserId,
        subject_id: subjectIdToSave,
        subject_name: subjectNameToSave,
        subject: subjectNameToSave,
        duration_seconds: durationInt,
        completed_at: sessionData.endTime || new Date().toISOString(),
        started_at: sessionData.startTime,
        ended_at: sessionData.endTime,
        notes: sessionData.notes && sessionData.notes.trim().length > 0 ? sessionData.notes.trim() : null,
        mode: sessionData.mode || timerMode,
      };

      let insertRes = await supabase
        .from('study_sessions')
        .insert(payload)
        .select();

      if (insertRes.error && (insertRes.error.code === 'PGRST204' || insertRes.error.message?.includes('subject_name') || insertRes.error.message?.includes('completed_at') || insertRes.error.message?.includes('subject'))) {
        const fallback = { ...payload };
        if (insertRes.error.code === 'PGRST204' || insertRes.error.message?.includes('subject_name')) {
          delete fallback.subject_name;
        }
        if (insertRes.error.code === 'PGRST204' || insertRes.error.message?.includes('completed_at')) {
          delete fallback.completed_at;
        }
        if (insertRes.error.code === 'PGRST204' || (insertRes.error.message?.includes('subject') && !insertRes.error.message?.includes('subject_id'))) {
          delete fallback.subject;
        }
        insertRes = await supabase.from('study_sessions').insert(fallback).select();
      }

      if (insertRes.error) {
        console.error("Error saving session:", insertRes.error);
        cacheLocallyFallback();
        return false;
      }

      console.log("Session saved successfully:", insertRes.data);

      // Immediately after a successful insert, trigger a refresh of the Daily Overview stats and session history
      if (authUserId) {
        await refetchSessions();
      }
      return true;
    } catch (error) {
      console.error("Error saving session:", error);
      cacheLocallyFallback();
      return false;
    }
  }, [subjects, selectedSubject, user.id, user.displayName, user.avatarUrl, timerMode, refetchSessions]);

  // Query sessions using browser-local timezone timestamp bounds (>= startOfDay, <= endOfDay)
  const querySessionsByRange = useCallback(async (startOfDay: Date, endOfDay: Date): Promise<StudySession[]> => {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        const targetUserId = authUser?.id || user.id;
        if (targetUserId && !targetUserId.startsWith('user-scholar-')) {
          const { data: dbSessions, error } = await supabase
            .from('study_sessions')
            .select('*, subjects(name, color)')
            .eq('user_id', targetUserId)
            .gte('started_at', startOfDay.toISOString())
            .lte('started_at', endOfDay.toISOString())
            .order('started_at', { ascending: false });

          if (!error && dbSessions) {
            return dbSessions
              .map((s): StudySession | null => {
                const subjectList = Array.isArray(subjects) ? subjects : [];
                const localSub = subjectList.find(sub => sub && sub.id === s.subject_id);
                const resolvedName = localSub?.name || s.subject_name || s.subjects?.name || (s.subject ? s.subject : null);
                if (!resolvedName || resolvedName.trim().toLowerCase() === 'unassigned' || !s.subject_id) {
                  return null;
                }
                const resolvedColor = localSub?.color || s.subjects?.color || (s as any).subject_color || '#10B981';
                return {
                  id: s.id,
                  userId: s.user_id,
                  userName: user.displayName,
                  userAvatar: user.avatarUrl,
                  subjectId: s.subject_id || '',
                  subjectName: resolvedName,
                  subjectColor: resolvedColor,
                  subject_name: resolvedName,
                  subject: s.subjects || s.subject,
                  startTime: s.started_at,
                  endTime: s.ended_at,
                  durationSeconds: s.duration_seconds,
                  notes: s.notes || '',
                  mode: (s.mode as TimerMode) || 'stopwatch',
                  createdAt: s.created_at,
                };
              })
              .filter((s): s is StudySession => s !== null);
          }
        }
      } catch (err) {
        console.error("Error querying sessions by range:", err);
      }
    }

    // Fallback to local sessions
    return sessions.filter(s => {
      const name = (s.subject_name || s.subjectName || '').trim().toLowerCase();
      if (!name || name === 'unassigned' || !s.subjectId) return false;
      const t = new Date(s.startTime).getTime();
      return t >= startOfDay.getTime() && t <= endOfDay.getTime();
    });
  }, [user.id, user.displayName, user.avatarUrl, sessions]);

  // Start Timer - sets anchor timestamp, starts real-time delta tracking, and syncs to Supabase
  const startTimer = useCallback((subjectId?: string, taskId?: string) => {
    const activeSubId = subjectId || selectedSubjectId;
    const subjectList = Array.isArray(subjects) ? subjects : [];
    const targetSub = subjectList.find(s => s && s.id === activeSubId && !s.is_archived) || selectedSubject;

    // Prevent timer start if no subject is selected
    if (!targetSub?.id) {
      console.warn("Cannot start timer: No active subject selected. Please select a subject first.");
      return false;
    }

    if (activeSubId) {
      setSelectedSubjectId(activeSubId);
    }
    if (taskId) {
      setActiveTaskId(taskId);
    }
    setPomodoroCompletedPhase(null);
    // Record start anchor timestamp
    const nowAnchor = Date.now() - (accumulatedSecondsRef.current * 1000);
    startTimeRef.current = nowAnchor;
    sessionStartTimeRef.current = new Date(nowAnchor);
    setIsStudying(true);
    setIsPaused(false);
    soundFx.playStartChime();
    updateProfile({
      status: timerMode === 'pomodoro' && pomodoroPhase === 'shortBreak' ? 'resting' : 'studying',
      activeSessionStartTime: new Date().toISOString(),
      currentSubjectId: targetSub.id,
      currentSubjectName: targetSub.name,
      currentSubjectColor: targetSub.color,
    });
    const isUuid = (id?: string | null) => typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    syncActiveSessionToDb('running', {
      startedAt: new Date(nowAnchor).toISOString(),
      elapsedBeforePause: accumulatedSecondsRef.current,
      subjectId: isUuid(targetSub.id) ? targetSub.id : null,
      subjectName: targetSub.name,
      mode: timerMode,
    });
    return true;
  }, [selectedSubjectId, selectedSubject, subjects, timerMode, pomodoroPhase, setSelectedSubjectId, updateProfile, syncActiveSessionToDb]);

  // Pause Timer - freeze accumulatedSeconds = actualElapsed, clear interval, and sync to Supabase
  const pauseTimer = useCallback(() => {
    let actualElapsed = accumulatedSecondsRef.current;
    if (startTimeRef.current !== null) {
      actualElapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      accumulatedSecondsRef.current = actualElapsed;
      setElapsedSeconds(actualElapsed);
    }
    startTimeRef.current = null;
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setIsPaused(true);
    soundFx.playStopChime();
    updateProfile({ status: 'resting' });
    syncActiveSessionToDb('paused', {
      startedAt: null,
      elapsedBeforePause: actualElapsed,
      mode: timerMode,
    });
  }, [updateProfile, syncActiveSessionToDb, timerMode]);

  // Resume Timer - recalculate startTimeRef.current = Date.now() - (accumulatedSeconds * 1000) and sync to Supabase
  const resumeTimer = useCallback(() => {
    const nowAnchor = Date.now() - (accumulatedSecondsRef.current * 1000);
    startTimeRef.current = nowAnchor;
    setIsPaused(false);
    setPomodoroCompletedPhase(null);
    soundFx.playStartChime();
    if (timerMode === 'pomodoro' && pomodoroPhase === 'shortBreak') {
      updateProfile({ status: 'resting' });
    } else {
      const targetSub = selectedSubject;
      updateProfile({
        status: 'studying',
        currentSubjectId: targetSub?.id,
        currentSubjectName: targetSub?.name,
        currentSubjectColor: targetSub?.color,
      });
    }
    syncActiveSessionToDb('running', {
      startedAt: new Date(nowAnchor).toISOString(),
      elapsedBeforePause: accumulatedSecondsRef.current,
      mode: timerMode,
    });
  }, [timerMode, pomodoroPhase, selectedSubject, updateProfile, syncActiveSessionToDb]);

  // Restore recovered timer session in paused state
  const restoreTimerSession = useCallback((seconds: number, mode?: TimerMode, subjectIdOrName?: string) => {
    if (seconds <= 0) return;
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    accumulatedSecondsRef.current = seconds;
    startTimeRef.current = null;
    setElapsedSeconds(seconds);
    setIsStudying(true);
    setIsPaused(true);
    if (mode && (mode === 'stopwatch' || mode === 'pomodoro')) {
      setTimerMode(mode);
    }
    if (subjectIdOrName) {
      const subjectList = Array.isArray(subjects) ? subjects : [];
      const match = subjectList.find(
        s => s && (s.id === subjectIdOrName || (s.name || '').toLowerCase() === subjectIdOrName.toLowerCase())
      );
      if (match) {
        setSelectedSubjectId(match.id);
      } else if (subjectIdOrName.trim()) {
        setSelectedSubjectId(subjectIdOrName.trim());
      }
    }
    updateProfile({ status: 'resting' });
  }, [subjects, updateProfile]);

  // Instantly add a session and sync metrics, Daily Overview, and Analytics
  const addSession = useCallback((newSession: StudySession) => {
    setSessions(prev => {
      const updated = mergeAndDeduplicateSessions(prev, [newSession]);
      const uid = userRef.current?.id || user?.id;
      persistSessionsToLocalStorage(updated, uid);

      const realStreak = calculateStreak(updated);
      const realTotalSeconds = updated.reduce((sum, s) => sum + s.durationSeconds, 0);
      updateProfile({
        streakDays: realStreak,
        totalStudySeconds: realTotalSeconds,
      });

      return updated;
    });
  }, [updateProfile, user?.id]);

  // Sync activeSubjectRef with current selectedSubject/subjects state
  useEffect(() => {
    const sub =
      (Array.isArray(subjects) ? subjects : []).find(s => s && s.id === selectedSubjectId && !s.is_archived) ||
      selectedSubject ||
      null;
    activeSubjectRef.current = sub;
  }, [selectedSubject, selectedSubjectId, subjects]);

  // Core helper to persist a session record to Supabase, update overview stats, and trigger Free Fire settlement
  const persistCompletedSession = useCallback(async (
    secondsToSave: number,
    notesOverride?: string,
    subjectOverride?: Subject | null
  ) => {
    if (secondsToSave <= 0) return false;

    const subjectList = Array.isArray(subjects) ? subjects : [];
    let activeSubject =
      subjectOverride ||
      activeSubjectRef.current ||
      selectedSubject ||
      subjectList.find(s => s && s.id === selectedSubjectId && !s.is_archived) ||
      null;

    if (!activeSubject && typeof window !== 'undefined') {
      try {
        const uid = userRef.current?.id || 'guest';
        const storedSubId =
          localStorage.getItem(getSelectedSubjectStorageKey(uid)) ||
          localStorage.getItem('study_io_selected_subject_guest') ||
          localStorage.getItem('studypulse_selected_subject_id');
        const storedSubs =
          localStorage.getItem(getSubjectStorageKey(uid)) ||
          localStorage.getItem('study_io_subjects_guest') ||
          localStorage.getItem('studypulse_subjects');
        if (storedSubs) {
          const parsed = JSON.parse(storedSubs);
          if (Array.isArray(parsed)) {
            activeSubject = parsed.find((s: any) => s && s.id === (selectedSubjectId || storedSubId));
          }
        }
      } catch {}
    }

    if (!activeSubject || !activeSubject.id || (activeSubject.name || '').trim().toLowerCase() === 'unassigned') {
      if (typeof window !== 'undefined') {
        alert("Please choose a subject before recording focus time.");
      }
      console.warn("persistCompletedSession: No active subject selected. Recording aborted.");
      return false;
    }

    const duration = secondsToSave;
    const now = new Date();
    const endedAt = now.toISOString();
    const startedAt = (sessionStartTimeRef.current || new Date(now.getTime() - duration * 1000)).toISOString();
    const subjectName = activeSubject.name;
    const subjectColor = activeSubject.color || '#10b981';
    const rawSubjectId = activeSubject.id;
    const isUuid = (id?: string | null) => typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    let subjectId = isUuid(rawSubjectId) ? rawSubjectId : null;
    const notesToSave = notesOverride !== undefined ? notesOverride : currentNotes;
    const currentMode = timerMode || 'pomodoro';
    const currentUser = userRef.current;

    const supabase = getSupabase();
    let activeUser = null;
    if (supabase) {
      try {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (!authError && authData?.user) {
          activeUser = authData.user;
        }
      } catch (err) {
        console.warn('StudyContext: Error getting auth user:', err);
      }
    }

    if (supabase && activeUser?.id && !subjectId && activeSubject.name) {
      try {
        const { data: matchedSub } = await supabase
          .from('subjects')
          .select('id')
          .eq('user_id', activeUser.id)
          .ilike('name', activeSubject.name.trim())
          .maybeSingle();

        if (matchedSub?.id) {
          subjectId = matchedSub.id;
        } else {
          const { data: createdSub } = await supabase
            .from('subjects')
            .insert({
              user_id: activeUser.id,
              name: activeSubject.name.trim(),
              color: activeSubject.color || '#10B981',
              daily_goal_minutes: (activeSubject as any).daily_goal_minutes || 60,
            })
            .select('id')
            .single();
          if (createdSub?.id) {
            subjectId = createdSub.id;
          }
        }
      } catch (err) {
        console.warn('StudyContext: Could not resolve or create subject in Supabase:', err);
      }
    }

    const sessionPayload = {
      user_id: activeUser?.id || currentUser.id,
      subject_id: subjectId || activeSubject?.id || null,
      subject_name: activeSubject?.name || 'General Study',
      duration_seconds: duration,
      created_at: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
      started_at: startedAt,
      ended_at: endedAt,
      mode: currentMode,
      notes: notesToSave && notesToSave.trim().length > 0 ? notesToSave.trim() : null,
    };

    console.log("Saving focus session payload:", sessionPayload);

    let insertedRecordId: string | null = null;

    if (supabase && activeUser?.id) {
      try {
        const { data, error } = await supabase.from('study_sessions').insert([sessionPayload]).select();
        if (error) {
          console.error("Supabase session insert error:", error);
          if (error.code === 'PGRST204' || error.message?.includes('column')) {
            const cleanPayload = {
              user_id: sessionPayload.user_id,
              subject_id: sessionPayload.subject_id,
              duration_seconds: sessionPayload.duration_seconds,
              started_at: sessionPayload.started_at,
              ended_at: sessionPayload.ended_at,
              notes: sessionPayload.notes,
              mode: sessionPayload.mode,
              created_at: sessionPayload.created_at,
            };
            const retryRes = await supabase.from('study_sessions').insert([cleanPayload]).select();
            if (retryRes.error) {
              console.error("Supabase session insert retry error:", retryRes.error);
            } else {
              insertedRecordId = retryRes.data?.[0]?.id || null;
            }
          }
        } else {
          insertedRecordId = data?.[0]?.id || null;
        }
      } catch (err) {
        console.error('StudyContext: Exception inserting session:', err);
      }
    }

    const newSession: StudySession = {
      id: insertedRecordId || `sess-${Date.now()}`,
      userId: sessionPayload.user_id || 'guest',
      userName: currentUser.displayName,
      userAvatar: currentUser.avatarUrl,
      subjectId: sessionPayload.subject_id || activeSubject.id,
      subjectName: sessionPayload.subject_name,
      subjectColor: activeSubject.color || '#10b981',
      subject_name: sessionPayload.subject_name,
      startTime: startedAt,
      endTime: endedAt,
      durationSeconds: sessionPayload.duration_seconds,
      notes: notesToSave,
      mode: currentMode as TimerMode,
      createdAt: sessionPayload.created_at,
    };

    // Immediately append the new session to the current day's session array
    addSession(newSession);

      const earnedXP = calculateFocusXP(secondsToSave);
      if (earnedXP > 0) {
        triggerXpEarned(earnedXP, `${Math.max(1, Math.round(secondsToSave / 60))} min Focus Session`, 'focus');
      }

      const todayStart = getLocalStartOfDay(new Date());
      const todayEnd = getLocalEndOfDay(new Date());
      const allSessionsNow = [newSession, ...sessions.filter(s => s.id !== newSession.id)];
      const totalToday = allSessionsNow
        .filter(s => {
          const t = new Date(s.startTime).getTime();
          return t >= todayStart.getTime() && t <= todayEnd.getTime();
        })
        .reduce((sum, s) => sum + s.durationSeconds, 0);

      const dailyGoalSeconds = (currentUser.dailyGoalHours || 4) * 3600;
      if (totalToday >= dailyGoalSeconds && totalToday - secondsToSave < dailyGoalSeconds) {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.5 },
        });
        soundFx.playMilestoneBell();
      }

      const todayString = getLocalDateString(new Date());
      let localStreakBonusDate: string | null = null;
      try {
        localStreakBonusDate = localStorage.getItem('studypulse_last_streak_bonus_date');
      } catch {}
      const lastStreakBonusDate = currentUser?.last_streak_bonus_date || currentUser?.lastStreakBonusDate || localStreakBonusDate;
      const hasStreakOrGoal = (currentUser?.streakDays || 0) > 0 || totalToday >= dailyGoalSeconds;
      const hasCompletedTask = Boolean(activeTaskId);
      const rpBreakdown = calculateSessionRP(secondsToSave, {
        hasStreakOrGoal,
        hasCompletedTask,
        lastStreakBonusDate,
        todayString,
      });

      const prevRP = Number((currentUser as any)?.rp ?? currentUser?.seasonRp ?? 0);
      const newRP = prevRP + rpBreakdown.totalGained;

      const profileUpdates: Partial<UserProfile> = {
        seasonRp: newRP,
        rp: newRP,
      };

      if (rpBreakdown.goalStreakBonus > 0) {
        profileUpdates.last_streak_bonus_date = todayString;
        profileUpdates.lastStreakBonusDate = todayString;
        try {
          localStorage.setItem('studypulse_last_streak_bonus_date', todayString);
        } catch {}
      }

      updateProfile(profileUpdates);

      setSettlementData({
        prevRP,
        newRP,
        breakdown: rpBreakdown,
        subjectName,
        subjectColor,
      });

      if (activeUser?.id) {
        try {
          await refetchSessions();
        } catch (refetchErr) {
          console.warn('StudyContext: Background refetch failed:', refetchErr);
        }
      }

      return true;
  }, [
    selectedSubject,
    selectedSubjectId,
    subjects,
    currentNotes,
    timerMode,
    activeTaskId,
    addSession,
    triggerXpEarned,
    sessions,
    updateProfile,
    refetchSessions,
  ]);

  // Stop Timer and save session to Supabase immediately with localStorage fallback
  const stopTimer = useCallback(async (
    durationOverride?: number,
    notesOverride?: string,
    subjectOverride?: Subject | null
  ) => {
    const currentActual = startTimeRef.current !== null && !isPaused
      ? Math.floor((Date.now() - startTimeRef.current) / 1000)
      : accumulatedSecondsRef.current;
    const seconds = durationOverride !== undefined ? durationOverride : Math.max(elapsedSeconds, currentActual);
    if (!isStudying && seconds === 0) return;

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    const activeSub = subjectOverride || activeSubjectRef.current || selectedSubject;
    if (!activeSub || !activeSub.id || (activeSub.name || '').trim().toLowerCase() === 'unassigned') {
      if (typeof window !== 'undefined') {
        alert("Please choose a subject before recording focus time.");
      }
      return;
    }

    if (seconds <= 0) {
      startTimeRef.current = null;
      accumulatedSecondsRef.current = 0;
      setIsStudying(false);
      setIsPaused(false);
      setElapsedSeconds(0);
      setActiveTaskId(null);
      setCurrentNotes('');
      sessionStartTimeRef.current = null;
      clearPersistedTimer();
      syncActiveSessionToDb('stopped');
      return;
    }

    const saved = await persistCompletedSession(seconds, notesOverride, activeSub);
    if (!saved) return;

    // Clear references and reset state to 0 on save
    startTimeRef.current = null;
    accumulatedSecondsRef.current = 0;
    setIsStudying(false);
    setIsPaused(false);
    setElapsedSeconds(0);
    setActiveTaskId(null);
    setCurrentNotes('');
    sessionStartTimeRef.current = null;
    clearPersistedTimer();
    syncActiveSessionToDb('stopped');
  }, [
    isStudying,
    isPaused,
    elapsedSeconds,
    selectedSubject,
    persistCompletedSession,
    clearPersistedTimer,
    syncActiveSessionToDb,
  ]);

  // General saveSession method directly callable with subject details or session data
  const saveSession = useCallback(async (sessionDataInput: {
    user_id?: string;
    userId?: string;
    subject_id?: string;
    subjectId?: string;
    subject_name?: string;
    subjectName?: string;
    subject_color?: string;
    subjectColor?: string;
    duration_seconds?: number;
    durationSeconds?: number;
    duration?: number;
    created_at?: string;
    notes?: string;
    mode?: TimerMode;
  }): Promise<boolean> => {
    const duration = sessionDataInput.duration_seconds ?? sessionDataInput.durationSeconds ?? sessionDataInput.duration ?? 0;
    if (duration <= 0) return false;

    const subId = sessionDataInput.subject_id || sessionDataInput.subjectId;
    const subName = sessionDataInput.subject_name || sessionDataInput.subjectName;
    const subColor = sessionDataInput.subject_color || sessionDataInput.subjectColor;

    const subjectList = Array.isArray(subjects) ? subjects : [];
    let matchedSub: Subject | null = null;
    if (subId) {
      matchedSub = subjectList.find(s => s && s.id === subId && !s.is_archived) || null;
    }
    if (!matchedSub && subName) {
      matchedSub = subjectList.find(s => s && s.name.trim().toLowerCase() === subName.trim().toLowerCase() && !s.is_archived) || null;
    }
    if (!matchedSub) {
      matchedSub = activeSubjectRef.current || selectedSubject || null;
    }

    if (!matchedSub && (!subId || !subName)) {
      if (typeof window !== 'undefined') {
        alert("Please choose a subject before recording focus time.");
      }
      return false;
    }

    const resolvedSub: Subject = matchedSub || {
      id: subId || `sub-${Date.now()}`,
      name: subName || 'Focus',
      color: subColor || '#10b981',
      createdAt: new Date().toISOString(),
    };

    return persistCompletedSession(duration, sessionDataInput.notes, resolvedSub);
  }, [subjects, selectedSubject, persistCompletedSession]);

  // Save completed Pomodoro Focus session to Supabase and switch to Break mode in PAUSED state
  const saveAndStartBreak = useCallback(async () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    const secondsToSave = pomodoroWorkDuration;
    await persistCompletedSession(secondsToSave);

    // Switch timer to Break mode in a PAUSED state!
    setPomodoroPhase('shortBreak');
    setElapsedSeconds(0);
    accumulatedSecondsRef.current = 0;
    startTimeRef.current = null;
    sessionStartTimeRef.current = null;
    setIsStudying(true);
    setIsPaused(true);
    setPomodoroCompletedPhase(null);
    clearPersistedTimer();
    updateProfile({ status: 'resting' });
    syncActiveSessionToDb('paused', {
      startedAt: null,
      elapsedBeforePause: 0,
      mode: 'pomodoro',
      targetDuration: pomodoroBreakDuration,
    });
  }, [pomodoroWorkDuration, pomodoroBreakDuration, persistCompletedSession, clearPersistedTimer, updateProfile, syncActiveSessionToDb]);

  // Skip Break: Save session and reset timer for another study round
  const skipPomodoroBreak = useCallback(async () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    const secondsToSave = pomodoroWorkDuration;
    await persistCompletedSession(secondsToSave);

    // Reset timer for another study round
    setPomodoroPhase('work');
    setElapsedSeconds(0);
    accumulatedSecondsRef.current = 0;
    startTimeRef.current = null;
    sessionStartTimeRef.current = null;
    setIsStudying(false);
    setIsPaused(false);
    setPomodoroCompletedPhase(null);
    clearPersistedTimer();
    updateProfile({ status: 'resting' });
    syncActiveSessionToDb('stopped');
  }, [pomodoroWorkDuration, persistCompletedSession, clearPersistedTimer, updateProfile, syncActiveSessionToDb]);

  // Explicitly start the break countdown from paused break state
  const startPomodoroBreak = useCallback(() => {
    const nowAnchor = Date.now();
    setPomodoroPhase('shortBreak');
    accumulatedSecondsRef.current = 0;
    startTimeRef.current = nowAnchor;
    sessionStartTimeRef.current = new Date(nowAnchor);
    setElapsedSeconds(0);
    setIsStudying(true);
    setIsPaused(false);
    setPomodoroCompletedPhase(null);
    soundFx.playStartChime();
    updateProfile({ status: 'resting' });
    syncActiveSessionToDb('running', {
      startedAt: new Date(nowAnchor).toISOString(),
      elapsedBeforePause: 0,
      mode: 'pomodoro',
      targetDuration: pomodoroBreakDuration,
    });
  }, [updateProfile, pomodoroBreakDuration, syncActiveSessionToDb]);

  // Complete Timer - alias for stopTimer
  const completeTimer = useCallback(async (
    durationOverride?: number,
    notesOverride?: string,
    subjectOverride?: Subject | null
  ) => {
    await stopTimer(durationOverride, notesOverride, subjectOverride);
  }, [stopTimer]);

  // Reset Timer - cleanly resets elapsed time, references, and isRunning state, syncing to active_sessions
  const resetTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    startTimeRef.current = null;
    accumulatedSecondsRef.current = 0;
    sessionStartTimeRef.current = null;
    setIsStudying(false);
    setIsPaused(false);
    setElapsedSeconds(0);
    setPomodoroCompletedPhase(null);
    setPomodoroPhase('work');
    setActiveTaskId(null);
    clearPersistedTimer();
    updateProfile({ status: 'resting', activeSessionStartTime: undefined });
    syncActiveSessionToDb('stopped');
  }, [clearPersistedTimer, updateProfile, syncActiveSessionToDb]);

  const dismissRankSettlement = useCallback(() => {
    setSettlementData(null);
    // Keep paused break state intact if transitioning to break
    if (timerMode !== 'pomodoro' || pomodoroPhase !== 'shortBreak') {
      resetTimer();
    }
    setCurrentNotes('');
    setIsFocusModeOpen(false);
    refetchSessions();
  }, [timerMode, pomodoroPhase, resetTimer, refetchSessions]);

  // Subjects Management
  const addSubject = (newSub: Omit<Subject, 'id' | 'createdAt'>) => {
    if (!newSub) return;
    const trimmedName = (newSub.name || '').trim();
    if (!trimmedName) return;

    const subjectList = Array.isArray(subjects) ? subjects : [];

    // Prevent duplicate subjects (case-insensitive)
    const existing = subjectList.find(
      s => s && (s.name || '').trim().toLowerCase() === trimmedName.toLowerCase()
    );
    if (existing) {
      if (existing.is_archived) {
        updateSubject(existing.id, {
          is_archived: false,
          color: newSub.color || '#10B981',
          targetMinutesPerDay: newSub.targetMinutesPerDay || 60,
        });
        setSelectedSubjectId(existing.id);
        return;
      }
      setSelectedSubjectId(existing.id);
      return;
    }

    const tempId = `sub-${Date.now()}`;
    const targetUserId = user?.id || newSub.userId || '';
    const targetDailyMins = newSub.daily_goal_minutes || newSub.targetMinutesPerDay || 60;
    const sub: Subject = {
      ...newSub,
      name: trimmedName,
      color: newSub.color || '#10B981',
      targetMinutesPerDay: targetDailyMins,
      daily_goal_minutes: targetDailyMins,
      id: tempId,
      userId: targetUserId,
      createdAt: new Date().toISOString(),
      is_archived: false,
    };
    saveSubjects([...subjectList, sub]);
    setSelectedSubjectId(sub.id);

    const supabase = getSupabase();
    if (supabase) {
      supabase.auth.getUser().then(({ data: authData }) => {
        const activeUserId = authData?.user?.id || targetUserId;
        if (activeUserId && !activeUserId.startsWith('user-scholar-')) {
          supabase
            .from('subjects')
            .insert({
              user_id: activeUserId,
              name: trimmedName,
              color: newSub.color || '#10B981',
              daily_goal_minutes: targetDailyMins,
              is_archived: false,
            })
            .select()
            .single()
            .then(({ data, error }) => {
              if (data && !error) {
                setSubjectsState(prev => {
                  const prevList = Array.isArray(prev) ? prev : [];
                  const updated = prevList.map(s => (s && s.id === tempId ? { ...s, id: data.id, userId: activeUserId } : s));
                  const deduped = deduplicateSubjects(updated);
                  saveSubjects(deduped);
                  return deduped;
                });
                setSelectedSubjectId(data.id);
              } else if (error) {
                console.error("Failed to insert subject into Supabase:", error);
              }
            });
        }
      });
    }
  };

  const updateSubject = (id: string, updates: Partial<Subject>) => {
    if (!id) return;
    const subjectList = Array.isArray(subjects) ? subjects : [];
    const trimmedUpdates = {
      ...updates,
      ...(updates.name !== undefined ? { name: (updates.name || '').trim() } : {}),
    };
    const targetSubject = subjectList.find(s => s && s.id === id);
    const oldName = targetSubject?.name;
    const updated = subjectList.map(s => s && s.id === id ? { ...s, ...trimmedUpdates } : s);
    saveSubjects(updated);

    // Synchronize sessions in local state and localStorage if subject color or name changed
    if (trimmedUpdates.color || trimmedUpdates.name) {
      setSessions(prev => {
        const updatedSessions = prev.map(sess => {
          const sessSubId = sess.subjectId || (sess as any).subject_id;
          const sessSubName = (sess.subjectName || (sess as any).subject_name || '').trim().toLowerCase();
          const isMatch =
            (sessSubId && sessSubId === id) ||
            (oldName && sessSubName === oldName.trim().toLowerCase());

          if (isMatch) {
            return {
              ...sess,
              ...(trimmedUpdates.color ? { subjectColor: trimmedUpdates.color, subject_color: trimmedUpdates.color } : {}),
              ...(trimmedUpdates.name ? { subjectName: trimmedUpdates.name, subject_name: trimmedUpdates.name } : {}),
            };
          }
          return sess;
        });

        try {
          localStorage.setItem('studypulse_sessions', JSON.stringify(updatedSessions));
        } catch {}
        return updatedSessions;
      });
    }

    const supabase = getSupabase();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (supabase && user?.id && isUuid) {
      const dbUpdates: Record<string, any> = {};
      if (trimmedUpdates.name !== undefined) dbUpdates.name = trimmedUpdates.name;
      if (trimmedUpdates.color !== undefined) dbUpdates.color = trimmedUpdates.color;
      if (trimmedUpdates.is_archived !== undefined) dbUpdates.is_archived = trimmedUpdates.is_archived;
      if (Object.keys(dbUpdates).length > 0) {
        supabase
          .from('subjects')
          .update(dbUpdates)
          .eq('id', id)
          .then(() => {}, (err) => console.error("Failed to update subject in Supabase:", err));
      }
    }
  };

  const deleteSubject = async (id: string): Promise<void> => {
    if (!id) return;
    // Soft-delete / archive: Keep the subject record and past sessions intact
    const subjectList = Array.isArray(subjects) ? subjects : [];
    const updated = subjectList.map(s => (s && s.id === id ? { ...s, is_archived: true } : s));
    const activeSubjects = updated.filter(s => s && !s.is_archived);

    saveSubjects(updated);
    if (selectedSubjectId === id) {
      setSelectedSubjectId(activeSubjects.length > 0 ? activeSubjects[0].id : '');
    }

    const supabase = getSupabase();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (supabase && user?.id && isUuid) {
      try {
        const { error } = await supabase
          .from('subjects')
          .update({ is_archived: true })
          .eq('id', id);
        if (error) {
          console.warn("Failed to soft-delete subject in Supabase:", error);
        }
      } catch (err) {
        console.error("Failed to archive subject in Supabase:", err);
      }
    }
  };

  // To-Dos Management
  const addTodo = (newTodo: Omit<TodoItem, 'id' | 'userId' | 'createdAt'>) => {
    const tempId = `todo-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const subjectList = Array.isArray(subjects) ? subjects : [];
    const targetSub = subjectList.find(s => s && s.id === newTodo.subjectId);
    const item: TodoItem = {
      ...newTodo,
      id: tempId,
      userId: user?.id || '',
      subjectName: targetSub?.name,
      subjectColor: targetSub?.color,
      createdAt: new Date().toISOString(),
    };

    setTodos(prev => {
      const updated = [item, ...prev];
      try {
        localStorage.setItem('studypulse_todos', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    const supabase = getSupabase();
    if (supabase && user.id && !user.id.startsWith('user-scholar-')) {
      const isSubUuid = targetSub?.id && targetSub.id.length === 36;
      supabase
        .from('todos')
        .insert({
          user_id: user.id,
          task: newTodo.title,
          is_completed: newTodo.completed,
          due_date: newTodo.date,
          priority: newTodo.priority,
          estimated_minutes: newTodo.estimatedMinutes || 30,
          subject_id: isSubUuid ? targetSub.id : null,
        })
        .select()
        .single()
        .then(
          ({ data }) => {
            if (data) {
              setTodos(prev => {
                const updated = prev.map(t => (t.id === tempId ? { ...t, id: data.id } : t));
                try {
                  localStorage.setItem('studypulse_todos', JSON.stringify(updated));
                } catch {}
                return updated;
              });
            }
          },
          (err: unknown) => {
            console.warn('Supabase todo insert error:', err);
          }
        );
    }
  };

  const toggleTodo = (id: string) => {
    let nextCompleted = false;
    setTodos(prev => {
      const target = prev.find(t => t.id === id);
      if (!target) return prev;
      nextCompleted = !target.completed;
      if (nextCompleted) {
        soundFx.playReactionPop();
        triggerXpEarned(25, 'Task Completed', 'todo');
      }

      const updated = prev.map(t => {
        if (t.id === id) {
          return {
            ...t,
            completed: nextCompleted,
            completedAt: nextCompleted ? new Date().toISOString() : undefined,
          };
        }
        return t;
      });
      try {
        localStorage.setItem('studypulse_todos', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    const supabase = getSupabase();
    if (supabase && id.length === 36) {
      supabase
        .from('todos')
        .update({ is_completed: nextCompleted })
        .eq('id', id)
        .then(
          () => {},
          (err: unknown) => console.warn('Supabase todo update error:', err)
        );
    }
  };

  const deleteTodo = (id: string) => {
    setTodos(prev => {
      const filtered = prev.filter(t => t.id !== id);
      try {
        localStorage.setItem('studypulse_todos', JSON.stringify(filtered));
      } catch {}
      return filtered;
    });

    const supabase = getSupabase();
    if (supabase && id.length === 36) {
      supabase
        .from('todos')
        .delete()
        .eq('id', id)
        .then(
          () => {},
          (err: unknown) => console.warn('Supabase todo delete error:', err)
        );
    }
  };

  const updateTodoTitle = (id: string, title: string) => {
    setTodos(prev => {
      const updated = prev.map(t => (t.id === id ? { ...t, title } : t));
      try {
        localStorage.setItem('studypulse_todos', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    const supabase = getSupabase();
    if (supabase && id.length === 36) {
      supabase
        .from('todos')
        .update({ task: title })
        .eq('id', id)
        .then(
          () => {},
          (err: unknown) => console.warn('Supabase todo update error:', err)
        );
    }
  };

  const clearCompletedTodos = () => {
    let completedIds: string[] = [];
    setTodos(prev => {
      completedIds = prev.filter(t => t.completed).map(t => t.id);
      const active = prev.filter(t => !t.completed);
      try {
        localStorage.setItem('studypulse_todos', JSON.stringify(active));
      } catch {}
      return active;
    });

    const supabase = getSupabase();
    if (supabase) {
      completedIds.forEach(id => {
        if (id.length === 36) {
          supabase.from('todos').delete().eq('id', id).then(() => {}, () => {});
        }
      });
    }
  };

  const getTodayTotalSeconds = () => {
    const startOfToday = getLocalStartOfDay(new Date());
    const endOfToday = getLocalEndOfDay(new Date());
    const loggedToday = sessions
      .filter(s => {
        const t = new Date(s.startTime).getTime();
        return t >= startOfToday.getTime() && t <= endOfToday.getTime();
      })
      .reduce((sum, s) => sum + s.durationSeconds, 0);

    return loggedToday + (isStudying ? elapsedSeconds : 0);
  };

  return (
    <StudyContext.Provider
      value={{
        gamification,
        settlementData,
        showRankSettlement,
        dismissRankSettlement,
        seasonRecap,
        dismissSeasonRecap,
        simulateSeasonReset,
        lastXpEarned,
        levelUpData,
        dismissLevelUpModal,
        dismissXpNotification,
        triggerXpEarned,
        subjects,
        selectedSubject,
        selectedSubjectId,
        setSelectedSubjectId,
        timerMode,
        setTimerMode,
        isStudying,
        isPaused,
        elapsedSeconds,
        pomodoroPhase,
        setPomodoroPhase,
        pomodoroWorkDuration,
        pomodoroBreakDuration,
        pomodoroPreset,
        setPomodoroPreset,
        pomodoroCompletedPhase,
        setPomodoroCompletedPhase,
        saveAndStartBreak,
        skipPomodoroBreak,
        startPomodoroBreak,
        activeTaskId,
        currentNotes,
        setCurrentNotes,
        sessions,
        todos,
        selectedDate,
        setSelectedDate,
        isFocusModeOpen,
        setIsFocusModeOpen,
        isRunning,
        startTimeRef,
        startTimer,
        pauseTimer,
        resumeTimer,
        stopTimer,
        completeTimer,
        resetTimer,
        restoreTimerSession,
        clearPersistedTimer,
        addSubject,
        updateSubject,
        deleteSubject,
        addTodo,
        toggleTodo,
        deleteTodo,
        updateTodoTitle,
        clearCompletedTodos,
        getTodayTotalSeconds,
        refetchSessions,
        fetchHistoricalSessions,
        querySessionsByRange,
        addSession,
        persistStudySession,
        saveSession,
      }}
    >
      {children}
    </StudyContext.Provider>
  );
}

export function useStudy() {
  const context = useContext(StudyContext);
  if (!context) {
    throw new Error('useStudy must be used within a StudyProvider');
  }
  return context;
}
