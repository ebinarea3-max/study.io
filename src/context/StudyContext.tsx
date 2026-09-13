'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback, useMemo } from 'react';
import { Subject, StudySession, TodoItem, TimerMode, PomodoroPhase } from '../types';
import { INITIAL_SUBJECTS, INITIAL_TODOS, getTodayDateString, calculateStreak, cleanupLegacyDemoData } from '../lib/mockData';
import { getLocalStartOfDay, getLocalEndOfDay } from '../lib/dateUtils';
import { useAuth } from './AuthContext';
import { getSupabase } from '../lib/supabase';
import { soundFx } from '../lib/audio';
import confetti from 'canvas-confetti';
import {
  getLevelProgress,
  calculateFocusXP,
  LevelProgress,
} from '../lib/gamification';

interface StudyContextType {
  gamification: LevelProgress;
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
  elapsedSeconds: number;
  pomodoroPhase: PomodoroPhase;
  setPomodoroPhase: (phase: PomodoroPhase) => void;
  pomodoroWorkDuration: number;
  pomodoroBreakDuration: number;
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
  stopTimer: (durationOverride?: number, notesOverride?: string) => Promise<void>;
  completeTimer: (durationOverride?: number, notesOverride?: string) => Promise<void>;
  resetTimer: () => void;
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

export function deduplicateSubjects(list: Subject[]): Subject[] {
  const seen = new Set<string>();
  const result: Subject[] = [];
  for (const item of list) {
    const normalized = (item.name || '').trim().toLowerCase();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(item);
  }
  return result;
}

const StudyContext = createContext<StudyContextType | undefined>(undefined);

export function StudyProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, updateProfile } = useAuth();
  
  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // State
  const [subjects, setSubjects] = useState<Subject[]>(INITIAL_SUBJECTS);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(INITIAL_SUBJECTS[0]?.id || '');
  const [timerMode, setTimerMode] = useState<TimerMode>('stopwatch');
  
  const [isStudying, setIsStudying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [pomodoroPhase, setPomodoroPhase] = useState<PomodoroPhase>('work');
  const [pomodoroWorkDuration] = useState(25 * 60);
  const [pomodoroBreakDuration] = useState(5 * 60);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [currentNotes, setCurrentNotes] = useState('');
  const [isFocusModeOpen, setIsFocusModeOpen] = useState(false);

  const [sessions, setSessions] = useState<StudySession[]>([]);
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
    setLevelUpData(null);
  }, []);

  const dismissXpNotification = useCallback(() => {
    setLastXpEarned(null);
  }, []);

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
  const prevLevelRef = useRef<number | null>(null);
  useEffect(() => {
    if (prevLevelRef.current === null) {
      prevLevelRef.current = gamification.level;
      return;
    }

    if (gamification.level > prevLevelRef.current) {
      setLevelUpData({
        newLevel: gamification.level,
        oldLevel: prevLevelRef.current,
        title: gamification.title,
      });
    }
    prevLevelRef.current = gamification.level;

    // Synchronize level and XP onto active user profile
    if (user.level !== gamification.level || user.xp !== gamification.totalXP) {
      updateProfile({
        level: gamification.level,
        xp: gamification.totalXP,
        levelTitle: gamification.title,
      });
    }
  }, [gamification.level, gamification.totalXP, gamification.title, user.level, user.xp, updateProfile]);

  const sessionStartTimeRef = useRef<Date | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const isRunning = isStudying && !isPaused;

  // Synchronized 1-second timer interval engine across standard view and Fullscreen Focus Mode
  useEffect(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (isStudying && !isPaused) {
      timerIntervalRef.current = setInterval(() => {
        setElapsedSeconds(prev => {
          const next = prev + 1;
          if (timerMode === 'pomodoro') {
            if (pomodoroPhase === 'work' && next >= pomodoroWorkDuration) {
              soundFx.playMilestoneBell();
              confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
              setPomodoroPhase('shortBreak');
              return 0;
            } else if (pomodoroPhase === 'shortBreak' && next >= pomodoroBreakDuration) {
              soundFx.playStartChime();
              setPomodoroPhase('work');
              return 0;
            }
          }
          return next;
        });
      }, 1000);
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [isStudying, isPaused, timerMode, pomodoroPhase, pomodoroWorkDuration, pomodoroBreakDuration]);

  // Load from Supabase or localStorage fallback
  useEffect(() => {
    cleanupLegacyDemoData();

    // 1. Initial load from localStorage
    try {
      const savedSubjects = localStorage.getItem('studypulse_subjects');
      if (savedSubjects) {
        const parsed = JSON.parse(savedSubjects).map((s: Subject) =>
          s.name === 'General Focus' && (s.color === '#3B82F6' || !s.color) ? { ...s, color: '#5A6B6A' } : s
        );
        const unique = deduplicateSubjects(parsed);
        setSubjects(unique.length > 0 ? unique : INITIAL_SUBJECTS);
        setSelectedSubjectId(unique[0]?.id || INITIAL_SUBJECTS[0]?.id || '');
      } else {
        setSubjects(INITIAL_SUBJECTS);
        setSelectedSubjectId(INITIAL_SUBJECTS[0]?.id || '');
      }

      const savedSessions = localStorage.getItem('studypulse_sessions');
      if (savedSessions) {
        const parsedSessions: StudySession[] = JSON.parse(savedSessions);
        setSessions(parsedSessions);
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
        // Fetch Subjects
        const { data: dbSubjects } = await supabase
          .from('subjects')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (dbSubjects && dbSubjects.length > 0) {
          const mappedSubjects: Subject[] = dbSubjects.map(s => ({
            id: s.id,
            name: s.name,
            color: s.color,
            userId: s.user_id,
            createdAt: s.created_at,
          }));
          const uniqueSubjects = deduplicateSubjects(mappedSubjects);
          setSubjects(uniqueSubjects);
          if (uniqueSubjects.length > 0) {
            setSelectedSubjectId(prev => {
              const stillExists = uniqueSubjects.some(s => s.id === prev);
              return stillExists ? prev : uniqueSubjects[0].id;
            });
          }
          try { localStorage.setItem('studypulse_subjects', JSON.stringify(uniqueSubjects)); } catch {}
        } else {
          // Check again if subjects already exist in Supabase for user to prevent duplicate seeding
          const { data: existingSubjects } = await supabase
            .from('subjects')
            .select('id')
            .eq('user_id', user.id);

          if (!existingSubjects || existingSubjects.length === 0) {
            // Seed initial subjects into Supabase for new user
            const seededSubjects: Subject[] = [];
            for (const initSub of INITIAL_SUBJECTS) {
              const { data: created } = await supabase
                .from('subjects')
                .insert({
                  user_id: user.id,
                  name: initSub.name,
                  color: initSub.color,
                })
                .select()
                .single();

              if (created) {
                seededSubjects.push({
                  id: created.id,
                  name: created.name,
                  color: created.color,
                  userId: created.user_id,
                  createdAt: created.created_at,
                });
              }
            }

            if (seededSubjects.length > 0) {
              const uniqueSeeded = deduplicateSubjects(seededSubjects);
              setSubjects(uniqueSeeded);
              setSelectedSubjectId(uniqueSeeded[0].id);
              try { localStorage.setItem('studypulse_subjects', JSON.stringify(uniqueSeeded)); } catch {}
            }
          }
        }

        // Fetch Study Sessions with authenticated user
        const { data: { user: authUser } } = await supabase.auth.getUser();
        const activeUserId = authUser?.id || user.id;

        const { data: dbSessions, error: sessError } = await supabase
          .from('study_sessions')
          .select('*, subjects(name, color)')
          .eq('user_id', activeUserId)
          .order('started_at', { ascending: false });

        if (sessError) {
          console.error("Failed to fetch initial study sessions:", sessError);
        } else if (dbSessions) {
          const mappedSessions: StudySession[] = dbSessions.map(s => ({
            id: s.id,
            userId: s.user_id,
            userName: user.displayName,
            userAvatar: user.avatarUrl,
            subjectId: s.subject_id || '',
            subjectName: s.subjects?.name || 'General Focus',
            subjectColor: s.subjects?.color || '#10B981',
            startTime: s.started_at,
            endTime: s.ended_at,
            durationSeconds: s.duration_seconds,
            notes: s.notes || '',
            mode: (s.mode as TimerMode) || 'stopwatch',
            createdAt: s.created_at,
          }));
          setSessions(mappedSessions);
          try { localStorage.setItem('studypulse_sessions', JSON.stringify(mappedSessions)); } catch {}

          // Update real streak and total study seconds
          const realStreak = calculateStreak(mappedSessions);
          const realTotalSeconds = mappedSessions.reduce((sum, s) => sum + s.durationSeconds, 0);
          updateProfile({
            streakDays: realStreak,
            totalStudySeconds: realTotalSeconds,
          });
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

  // Persist local subjects with deduplication
  const saveSubjects = (newSubjects: Subject[]) => {
    const deduplicated = deduplicateSubjects(newSubjects);
    setSubjects(deduplicated);
    try {
      localStorage.setItem('studypulse_subjects', JSON.stringify(deduplicated));
    } catch {
      // ignore
    }
  };

  // Persist local sessions
  const saveSessions = (newSessions: StudySession[]) => {
    setSessions(newSessions);
    try {
      localStorage.setItem('studypulse_sessions', JSON.stringify(newSessions));
    } catch {
      // ignore
    }
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

  const selectedSubject = subjects.find(s => s.id === selectedSubjectId) || subjects[0] || null;

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

  // Re-fetch all historical sessions for the authenticated user without timezone mismatches
  const refetchSessions = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;

    try {
      await syncPendingSessions();

      const { data: { user: authUser } } = await supabase.auth.getUser();
      const currentUser = userRef.current;
      const targetUserId = authUser?.id || currentUser.id;
      if (!targetUserId || targetUserId.startsWith('user-scholar-')) return;

      const { data: dbSessions, error } = await supabase
        .from('study_sessions')
        .select('*, subjects(name, color)')
        .eq('user_id', targetUserId)
        .order('started_at', { ascending: false });

      if (error) {
        console.error("Error refetching study sessions:", error);
        return;
      }

      if (dbSessions) {
        const mappedSessions: StudySession[] = dbSessions.map(s => ({
          id: s.id,
          userId: s.user_id,
          userName: currentUser.displayName,
          userAvatar: currentUser.avatarUrl,
          subjectId: s.subject_id || '',
          subjectName: s.subjects?.name || s.subject || 'General Focus',
          subjectColor: s.subjects?.color || '#10B981',
          startTime: s.started_at,
          endTime: s.ended_at,
          durationSeconds: s.duration_seconds ?? s.duration ?? s.seconds ?? 0,
          notes: s.notes || '',
          mode: (s.mode as TimerMode) || 'stopwatch',
          createdAt: s.created_at,
        }));

        setSessions(mappedSessions);
        try {
          localStorage.setItem('studypulse_sessions', JSON.stringify(mappedSessions));
        } catch {}

        const realStreak = calculateStreak(mappedSessions);
        const realTotalSeconds = mappedSessions.reduce((sum, s) => sum + s.durationSeconds, 0);

        // Only update profile if streak or study seconds actually changed to avoid re-render thrashing
        if (currentUser.streakDays !== realStreak || currentUser.totalStudySeconds !== realTotalSeconds) {
          updateProfile({
            streakDays: realStreak,
            totalStudySeconds: realTotalSeconds,
          });
        }
      }
    } catch (err) {
      console.error("Failed to refetch sessions:", err);
    }
  }, [updateProfile, syncPendingSessions]);

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
    const targetSub = subjects.find(s => s.id === sessionData.subjectId) || selectedSubject;

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

    const newLocalSession: StudySession = {
      id: `sess-${Date.now()}`,
      userId: user.id,
      userName: user.displayName,
      userAvatar: user.avatarUrl,
      subjectId: subjectIdToSave || targetSub?.id || '',
      subjectName: sessionData.subjectName || targetSub?.name || 'General Focus',
      subjectColor: sessionData.subjectColor || targetSub?.color || '#10B981',
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
        duration_seconds: durationInt,
        started_at: sessionData.startTime,
        ended_at: sessionData.endTime,
        notes: sessionData.notes && sessionData.notes.trim().length > 0 ? sessionData.notes.trim() : null,
        mode: sessionData.mode || timerMode,
        subject: sessionData.subjectName || targetSub?.name || 'General Focus',
      };

      let insertRes = await supabase
        .from('study_sessions')
        .insert(payload)
        .select();

      if (insertRes.error && (insertRes.error.code === 'PGRST204' || insertRes.error.message?.includes('subject'))) {
        const fallback = { ...payload };
        delete fallback.subject;
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
            return dbSessions.map(s => ({
              id: s.id,
              userId: s.user_id,
              userName: user.displayName,
              userAvatar: user.avatarUrl,
              subjectId: s.subject_id || '',
              subjectName: s.subjects?.name || 'General Focus',
              subjectColor: s.subjects?.color || '#10B981',
              startTime: s.started_at,
              endTime: s.ended_at,
              durationSeconds: s.duration_seconds,
              notes: s.notes || '',
              mode: (s.mode as TimerMode) || 'stopwatch',
              createdAt: s.created_at,
            }));
          }
        }
      } catch (err) {
        console.error("Error querying sessions by range:", err);
      }
    }

    // Fallback to local sessions
    return sessions.filter(s => {
      const t = new Date(s.startTime).getTime();
      return t >= startOfDay.getTime() && t <= endOfDay.getTime();
    });
  }, [user.id, user.displayName, user.avatarUrl, sessions]);

  // Start Timer - sets isStudying and starts synchronous ticking
  const startTimer = useCallback((subjectId?: string, taskId?: string) => {
    if (subjectId) {
      setSelectedSubjectId(subjectId);
    }
    if (taskId) {
      setActiveTaskId(taskId);
    }
    sessionStartTimeRef.current = new Date();
    setIsStudying(true);
    setIsPaused(false);
    soundFx.playStartChime();
    const targetSub = subjects.find(s => s.id === (subjectId || selectedSubjectId)) || selectedSubject;
    updateProfile({
      status: 'studying',
      activeSessionStartTime: new Date().toISOString(),
      currentSubjectId: targetSub?.id,
      currentSubjectName: targetSub?.name,
      currentSubjectColor: targetSub?.color,
    });
  }, [selectedSubjectId, selectedSubject, subjects, updateProfile]);

  // Pause Timer - cleanly toggles isRunning to false while preserving exact elapsed seconds
  const pauseTimer = useCallback(() => {
    setIsPaused(true);
    soundFx.playStopChime();
    updateProfile({ status: 'resting' });
  }, [updateProfile]);

  // Resume Timer - cleanly toggles isRunning to true
  const resumeTimer = useCallback(() => {
    setIsPaused(false);
    soundFx.playStartChime();
    const targetSub = selectedSubject;
    updateProfile({
      status: 'studying',
      currentSubjectId: targetSub?.id,
      currentSubjectName: targetSub?.name,
      currentSubjectColor: targetSub?.color,
    });
  }, [selectedSubject, updateProfile]);

  // Instantly add a session and sync metrics, Daily Overview, and Analytics
  const addSession = useCallback((newSession: StudySession) => {
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== newSession.id);
      const updated = [newSession, ...filtered];
      try {
        localStorage.setItem('studypulse_sessions', JSON.stringify(updated));
      } catch {}

      const realStreak = calculateStreak(updated);
      const realTotalSeconds = updated.reduce((sum, s) => sum + s.durationSeconds, 0);
      updateProfile({
        streakDays: realStreak,
        totalStudySeconds: realTotalSeconds,
      });

      return updated;
    });
  }, [updateProfile]);

  // Stop Timer and save session to Supabase immediately with localStorage fallback
  const stopTimer = useCallback(async (durationOverride?: number, notesOverride?: string) => {
    // 1. Capture variables into local scope BEFORE touching state
    const seconds = durationOverride !== undefined ? durationOverride : elapsedSeconds;
    if (!isStudying && seconds === 0) return;

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (seconds <= 0) {
      setIsStudying(false);
      setIsPaused(false);
      setElapsedSeconds(0);
      setActiveTaskId(null);
      setCurrentNotes('');
      sessionStartTimeRef.current = null;
      return;
    }

    if (seconds < 5) {
      console.info(`StudyContext: Session was under 5 seconds (${seconds}s). Handling gracefully.`);
    }

    const now = new Date();
    const endedAt = now.toISOString();
    const startedAt = (sessionStartTimeRef.current || new Date(now.getTime() - seconds * 1000)).toISOString();
    const activeSubject = selectedSubject;
    const subjectName = (typeof activeSubject === 'string' ? activeSubject : activeSubject?.name) || 'General Focus';
    const subjectId = activeSubject?.id;
    const subjectColor = activeSubject?.color || '#10B981';
    const notesToSave = notesOverride !== undefined ? notesOverride : currentNotes;
    const currentMode = timerMode || 'stopwatch';
    const currentUser = userRef.current;

    // 2. Fetch active user from Supabase auth
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

    if (!activeUser) {
      console.warn('StudyContext: No active user session present. Logging session locally.');
    }

    // 3. Persist record into study_sessions
    let insertSuccess = false;
    let insertedRecordId: string | null = null;

    if (supabase && activeUser?.id) {
      const insertPayload: Record<string, any> = {
        user_id: activeUser.id,
        subject: subjectName,
        duration_seconds: seconds,
        mode: currentMode,
        created_at: endedAt,
        started_at: startedAt,
        ended_at: endedAt,
        notes: notesToSave && notesToSave.trim().length > 0 ? notesToSave.trim() : null,
      };

      if (subjectId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(subjectId)) {
        insertPayload.subject_id = subjectId;
      }

      try {
        let insertResponse = await supabase.from('study_sessions').insert(insertPayload).select();

        // If 'subject' column does not exist in the database schema cache, retry without 'subject'
        if (insertResponse.error && (insertResponse.error.code === 'PGRST204' || insertResponse.error.message?.includes('subject'))) {
          const fallbackPayload: Record<string, any> = { ...insertPayload };
          delete fallbackPayload.subject;
          insertResponse = await supabase.from('study_sessions').insert(fallbackPayload).select();
        }

        // If duration_seconds column does not exist, retry with duration
        if (insertResponse.error && (insertResponse.error.code === 'PGRST204' || insertResponse.error.message?.includes('duration_seconds'))) {
          const fallbackPayload: Record<string, any> = { ...insertPayload, duration: seconds };
          delete fallbackPayload.duration_seconds;
          insertResponse = await supabase.from('study_sessions').insert(fallbackPayload).select();
        }

        if (insertResponse.error) {
          console.error('StudyContext: Supabase insert error:', insertResponse.error);
        } else {
          insertSuccess = true;
          insertedRecordId = insertResponse.data?.[0]?.id || null;
        }
      } catch (err) {
        console.error('StudyContext: Exception inserting session:', err);
      }
    } else {
      // Local/guest mode allowed
      insertSuccess = true;
    }

    // 4. Only reset timer and update Daily Overview stats AFTER insert returns successfully
    if (insertSuccess) {
      const newSession: StudySession = {
        id: insertedRecordId || `sess-${Date.now()}`,
        userId: activeUser?.id || currentUser.id || 'guest',
        userName: currentUser.displayName,
        userAvatar: currentUser.avatarUrl,
        subjectId: subjectId || '',
        subjectName: subjectName,
        subjectColor: subjectColor,
        startTime: startedAt,
        endTime: endedAt,
        durationSeconds: seconds,
        notes: notesToSave,
        mode: currentMode,
        createdAt: endedAt,
      };

      addSession(newSession);
      soundFx.playStopChime();

      // Trigger gamification XP gain notification
      const earnedXP = calculateFocusXP(seconds);
      if (earnedXP > 0) {
        triggerXpEarned(earnedXP, `${Math.max(1, Math.round(seconds / 60))} min Focus Session`, 'focus');
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
      if (totalToday >= dailyGoalSeconds && totalToday - seconds < dailyGoalSeconds) {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.5 },
        });
        soundFx.playMilestoneBell();
      }

      setIsStudying(false);
      setIsPaused(false);
      setElapsedSeconds(0);
      setActiveTaskId(null);
      setCurrentNotes('');
      sessionStartTimeRef.current = null;

      if (activeUser?.id) {
        await refetchSessions();
      }
    } else {
      console.error('StudyContext: Session persistence failed. Timer state preserved.');
    }
  }, [
    isStudying,
    elapsedSeconds,
    selectedSubject,
    currentNotes,
    timerMode,
    sessions,
    addSession,
    refetchSessions,
  ]);

  // Complete Timer - alias for stopTimer
  const completeTimer = useCallback(async (durationOverride?: number, notesOverride?: string) => {
    await stopTimer(durationOverride, notesOverride);
  }, [stopTimer]);

  // Reset Timer - cleanly resets elapsed time and isRunning state without network calls
  const resetTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setIsStudying(false);
    setIsPaused(false);
    setElapsedSeconds(0);
    setActiveTaskId(null);
    sessionStartTimeRef.current = null;
    updateProfile({ status: 'resting', activeSessionStartTime: undefined });
  }, [updateProfile]);

  // Subjects Management
  const addSubject = (newSub: Omit<Subject, 'id' | 'createdAt'>) => {
    const trimmedName = (newSub.name || '').trim();
    if (!trimmedName) return;

    // Prevent duplicate subjects (case-insensitive)
    const existing = subjects.find(
      s => s.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );
    if (existing) {
      setSelectedSubjectId(existing.id);
      return;
    }

    const tempId = `sub-${Date.now()}`;
    const sub: Subject = {
      ...newSub,
      name: trimmedName,
      id: tempId,
      userId: user.id,
      createdAt: new Date().toISOString(),
    };
    saveSubjects([...subjects, sub]);
    setSelectedSubjectId(sub.id);

    const supabase = getSupabase();
    if (supabase && user.id && !user.id.startsWith('user-scholar-')) {
      supabase
        .from('subjects')
        .insert({
          user_id: user.id,
          name: trimmedName,
          color: newSub.color,
        })
        .select()
        .single()
        .then(({ data, error }) => {
          if (data && !error) {
            setSubjects(prev => {
              const updated = prev.map(s => s.id === tempId ? { ...s, id: data.id } : s);
              return deduplicateSubjects(updated);
            });
            setSelectedSubjectId(data.id);
          }
        });
    }
  };

  const updateSubject = (id: string, updates: Partial<Subject>) => {
    const trimmedUpdates = {
      ...updates,
      ...(updates.name !== undefined ? { name: updates.name.trim() } : {}),
    };
    const updated = subjects.map(s => s.id === id ? { ...s, ...trimmedUpdates } : s);
    saveSubjects(updated);

    const supabase = getSupabase();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (supabase && user.id && isUuid) {
      const dbUpdates: Record<string, any> = {};
      if (trimmedUpdates.name !== undefined) dbUpdates.name = trimmedUpdates.name;
      if (trimmedUpdates.color !== undefined) dbUpdates.color = trimmedUpdates.color;
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
    const filtered = subjects.filter(s => s.id !== id);
    if (filtered.length === 0) {
      const fallback: Subject = {
        id: `sub-${Date.now()}`,
        name: 'General Focus',
        color: '#5A6B6A',
        userId: user.id,
        createdAt: new Date().toISOString(),
      };
      saveSubjects([fallback]);
      setSelectedSubjectId(fallback.id);
    } else {
      saveSubjects(filtered);
      if (selectedSubjectId === id) {
        setSelectedSubjectId(filtered[0].id);
      }
    }

    const supabase = getSupabase();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (supabase && user.id && isUuid) {
      try {
        await supabase.from('subjects').delete().eq('id', id);
      } catch (err) {
        console.error("Failed to delete subject from Supabase:", err);
      }
    }
  };

  // To-Dos Management
  const addTodo = (newTodo: Omit<TodoItem, 'id' | 'userId' | 'createdAt'>) => {
    const tempId = `todo-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const targetSub = subjects.find(s => s.id === newTodo.subjectId);
    const item: TodoItem = {
      ...newTodo,
      id: tempId,
      userId: user.id,
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
        startTimer,
        pauseTimer,
        resumeTimer,
        stopTimer,
        completeTimer,
        resetTimer,
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
        querySessionsByRange,
        addSession,
        persistStudySession,
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
