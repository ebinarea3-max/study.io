'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { Subject, StudySession, TodoItem, TimerMode, PomodoroPhase } from '../types';
import { INITIAL_SUBJECTS, INITIAL_TODOS, getTodayDateString, calculateStreak, cleanupLegacyDemoData } from '../lib/mockData';
import { getLocalStartOfDay, getLocalEndOfDay } from '../lib/dateUtils';
import { useAuth } from './AuthContext';
import { getSupabase } from '../lib/supabase';
import { soundFx } from '../lib/audio';
import confetti from 'canvas-confetti';

interface StudyContextType {
  subjects: Subject[];
  selectedSubject: Subject | null;
  selectedSubjectId: string;
  setSelectedSubjectId: (id: string) => void;
  timerMode: TimerMode;
  setTimerMode: (mode: TimerMode) => void;
  isStudying: boolean;
  isPaused: boolean;
  elapsedSeconds: number;
  pomodoroPhase: PomodoroPhase;
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
  stopTimer: (notes?: string) => void;
  resetTimer: () => void;
  addSubject: (subject: Omit<Subject, 'id' | 'createdAt'>) => void;
  updateSubject: (id: string, updates: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;
  addTodo: (todo: Omit<TodoItem, 'id' | 'userId' | 'createdAt'>) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  updateTodoTitle: (id: string, title: string) => void;
  clearCompletedTodos: () => void;
  getTodayTotalSeconds: () => number;
  refetchSessions: () => Promise<void>;
  querySessionsByRange: (startOfDay: Date, endOfDay: Date) => Promise<StudySession[]>;
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

const StudyContext = createContext<StudyContextType | undefined>(undefined);

export function StudyProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, updateProfile } = useAuth();
  
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

  const sessionStartTimeRef = useRef<Date | null>(null);

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
        setSubjects(parsed.length > 0 ? parsed : INITIAL_SUBJECTS);
        setSelectedSubjectId(parsed[0]?.id || INITIAL_SUBJECTS[0]?.id || '');
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
          setSubjects(mappedSubjects);
          setSelectedSubjectId(mappedSubjects[0].id);
          try { localStorage.setItem('studypulse_subjects', JSON.stringify(mappedSubjects)); } catch {}
        } else {
          // Seed initial subjects into Supabase for new user
          for (const initSub of INITIAL_SUBJECTS) {
            await supabase.from('subjects').insert({
              user_id: user.id,
              name: initSub.name,
              color: initSub.color,
            });
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

  // Persist local subjects
  const saveSubjects = (newSubjects: Subject[]) => {
    setSubjects(newSubjects);
    try {
      localStorage.setItem('studypulse_subjects', JSON.stringify(newSubjects));
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
      const targetUserId = authUser?.id || user.id;
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
        try {
          localStorage.setItem('studypulse_sessions', JSON.stringify(mappedSessions));
        } catch {}

        const realStreak = calculateStreak(mappedSessions);
        const realTotalSeconds = mappedSessions.reduce((sum, s) => sum + s.durationSeconds, 0);
        updateProfile({
          streakDays: realStreak,
          totalStudySeconds: realTotalSeconds,
        });
      }
    } catch (err) {
      console.error("Failed to refetch sessions:", err);
    }
  }, [user.id, user.displayName, user.avatarUrl, updateProfile, syncPendingSessions]);

  // Persist study session immediately to Supabase, logging explicit error and caching locally on failure
  const persistStudySession = useCallback(async (sessionData: {
    subjectId?: string;
    subjectName?: string;
    subjectColor?: string;
    durationSeconds: number;
    startTime: string;
    endTime: string;
    notes?: string;
    mode?: TimerMode;
  }): Promise<boolean> => {
    if (sessionData.durationSeconds <= 0) return false;

    const supabase = getSupabase();
    const targetSub = subjects.find(s => s.id === sessionData.subjectId) || selectedSubject;
    const isUuid = sessionData.subjectId && sessionData.subjectId.length === 36;
    const subjectIdToSave = isUuid ? sessionData.subjectId : (targetSub?.id?.length === 36 ? targetSub.id : null);

    const newLocalSession: StudySession = {
      id: `sess-${Date.now()}`,
      userId: user.id,
      userName: user.displayName,
      userAvatar: user.avatarUrl,
      subjectId: targetSub?.id || sessionData.subjectId || '',
      subjectName: sessionData.subjectName || targetSub?.name || 'General Focus',
      subjectColor: sessionData.subjectColor || targetSub?.color || '#10B981',
      startTime: sessionData.startTime,
      endTime: sessionData.endTime,
      durationSeconds: sessionData.durationSeconds,
      notes: sessionData.notes || '',
      mode: sessionData.mode || timerMode,
      createdAt: new Date().toISOString(),
    };

    // Immediately cache in local sessions state and localStorage so data is never lost
    setSessions(prev => {
      const updated = [newLocalSession, ...prev];
      try {
        localStorage.setItem('studypulse_sessions', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    const cacheLocallyFallback = () => {
      try {
        const pendingRaw = localStorage.getItem('studypulse_pending_sessions');
        const pending: StudySession[] = pendingRaw ? JSON.parse(pendingRaw) : [];
        if (!pending.some(p => p.startTime === newLocalSession.startTime && p.durationSeconds === newLocalSession.durationSeconds)) {
          pending.push(newLocalSession);
          localStorage.setItem('studypulse_pending_sessions', JSON.stringify(pending));
        }
      } catch {
        // ignore
      }
    };

    if (!supabase) {
      console.error("Failed to save study session:", new Error("Supabase client not initialized"));
      cacheLocallyFallback();
      return false;
    }

    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) {
        console.error("Failed to save study session:", authError || new Error("No active authenticated user"));
        cacheLocallyFallback();
        return false;
      }

      const { error: insertError } = await supabase.from('study_sessions').insert({
        user_id: authUser.id,
        subject_id: subjectIdToSave,
        duration_seconds: sessionData.durationSeconds,
        started_at: sessionData.startTime,
        ended_at: sessionData.endTime,
        notes: sessionData.notes || null,
        mode: sessionData.mode || timerMode,
      });

      if (insertError) {
        console.error("Failed to save study session:", insertError);
        cacheLocallyFallback();
        return false;
      }

      return true;
    } catch (error) {
      console.error("Failed to save study session:", error);
      cacheLocallyFallback();
      return false;
    }
  }, [subjects, selectedSubject, user.id, user.displayName, user.avatarUrl, timerMode]);

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

    // Fallback to in-memory sessions filtered by local timestamp bounds
    return sessions.filter(s => {
      const t = new Date(s.startTime).getTime();
      return t >= startOfDay.getTime() && t <= endOfDay.getTime();
    });
  }, [user.id, user.displayName, user.avatarUrl, sessions]);

  // Active Timer Interval
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isStudying && !isPaused) {
      interval = setInterval(() => {
        setElapsedSeconds(prev => {
          const next = prev + 1;
          if (timerMode === 'pomodoro') {
            if (pomodoroPhase === 'work' && next >= pomodoroWorkDuration) {
              soundFx.playMilestoneBell();
              confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });

              // Automatically record & persist completed pomodoro block
              const sprintEndTime = new Date();
              const sprintStartTime = sessionStartTimeRef.current || new Date(sprintEndTime.getTime() - pomodoroWorkDuration * 1000);

              persistStudySession({
                subjectId: selectedSubject?.id,
                subjectName: selectedSubject?.name,
                subjectColor: selectedSubject?.color,
                durationSeconds: pomodoroWorkDuration,
                startTime: sprintStartTime.toISOString(),
                endTime: sprintEndTime.toISOString(),
                notes: currentNotes,
                mode: 'pomodoro',
              }).then(() => {
                refetchSessions();
              });

              setPomodoroPhase('shortBreak');
              sessionStartTimeRef.current = new Date();
              return 0;
            } else if (pomodoroPhase === 'shortBreak' && next >= pomodoroBreakDuration) {
              soundFx.playStartChime();
              setPomodoroPhase('work');
              sessionStartTimeRef.current = new Date();
              return 0;
            }
          }
          return next;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [
    isStudying,
    isPaused,
    timerMode,
    pomodoroPhase,
    pomodoroWorkDuration,
    pomodoroBreakDuration,
    selectedSubject,
    currentNotes,
    persistStudySession,
    refetchSessions,
  ]);

  // Start Timer
  const startTimer = (subjectId?: string, taskId?: string) => {
    if (subjectId) setSelectedSubjectId(subjectId);
    if (taskId) setActiveTaskId(taskId);
    
    sessionStartTimeRef.current = new Date();
    setIsStudying(true);
    setIsPaused(false);
    soundFx.playStartChime();

    const targetSub = subjects.find(s => s.id === (subjectId || selectedSubjectId)) || subjects[0];

    updateProfile({
      status: 'studying',
      currentSubjectId: targetSub?.id,
      currentSubjectName: targetSub?.name,
      currentSubjectColor: targetSub?.color,
      activeSessionStartTime: new Date().toISOString(),
    });
  };

  // Pause Timer
  const pauseTimer = () => {
    setIsPaused(true);
    soundFx.playStopChime();
    updateProfile({ status: 'resting' });
  };

  // Resume Timer
  const resumeTimer = () => {
    setIsPaused(false);
    soundFx.playStartChime();
    const targetSub = selectedSubject;
    updateProfile({
      status: 'studying',
      currentSubjectId: targetSub?.id,
      currentSubjectName: targetSub?.name,
      currentSubjectColor: targetSub?.color,
    });
  };

  // Stop Timer and save session to Supabase immediately with localStorage fallback
  const stopTimer = async (notesOverride?: string) => {
    if (!isStudying && elapsedSeconds === 0) return;

    soundFx.playStopChime();
    const endTime = new Date();
    const startTime = sessionStartTimeRef.current || new Date(endTime.getTime() - elapsedSeconds * 1000);
    const duration = elapsedSeconds;

    if (duration > 0) {
      const targetSub = selectedSubject;
      const notesToSave = notesOverride || currentNotes;

      await persistStudySession({
        subjectId: targetSub?.id,
        subjectName: targetSub?.name,
        subjectColor: targetSub?.color,
        durationSeconds: duration,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        notes: notesToSave,
        mode: timerMode,
      });

      // Check daily goal celebration in user's local browser day
      const todayStart = getLocalStartOfDay(new Date());
      const todayEnd = getLocalEndOfDay(new Date());
      const allSessionsNow = [
        {
          id: `sess-now-${Date.now()}`,
          userId: user.id,
          userName: user.displayName,
          userAvatar: user.avatarUrl,
          subjectId: targetSub?.id || '',
          subjectName: targetSub?.name || 'General Focus',
          subjectColor: targetSub?.color || '#10B981',
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          durationSeconds: duration,
          notes: notesToSave,
          mode: timerMode,
          createdAt: new Date().toISOString(),
        },
        ...sessions,
      ];

      const totalToday = allSessionsNow
        .filter(s => {
          const t = new Date(s.startTime).getTime();
          return t >= todayStart.getTime() && t <= todayEnd.getTime();
        })
        .reduce((sum, s) => sum + s.durationSeconds, 0);

      const dailyGoalSeconds = user.dailyGoalHours * 3600;
      if (totalToday >= dailyGoalSeconds && totalToday - duration < dailyGoalSeconds) {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.5 },
        });
        soundFx.playMilestoneBell();
      }

      const newStreak = calculateStreak(allSessionsNow);
      const totalSec = (user.totalStudySeconds || 0) + duration;
      updateProfile({
        totalStudySeconds: totalSec,
        streakDays: newStreak,
        status: 'resting',
        activeSessionStartTime: undefined,
      });

      // Automatically re-fetch sessions
      await refetchSessions();
    } else {
      updateProfile({
        status: 'resting',
        activeSessionStartTime: undefined,
      });
    }

    setIsStudying(false);
    setIsPaused(false);
    setElapsedSeconds(0);
    setActiveTaskId(null);
    setCurrentNotes('');
    sessionStartTimeRef.current = null;
  };

  const resetTimer = () => {
    setIsStudying(false);
    setIsPaused(false);
    setElapsedSeconds(0);
    setActiveTaskId(null);
    sessionStartTimeRef.current = null;
    updateProfile({ status: 'resting' });
  };

  // Subjects Management
  const addSubject = (newSub: Omit<Subject, 'id' | 'createdAt'>) => {
    const tempId = `sub-${Date.now()}`;
    const sub: Subject = {
      ...newSub,
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
          name: newSub.name,
          color: newSub.color,
        })
        .select()
        .single()
        .then(({ data }) => {
          if (data) {
            setSubjects(prev => prev.map(s => s.id === tempId ? { ...s, id: data.id } : s));
            setSelectedSubjectId(data.id);
          }
        });
    }
  };

  const updateSubject = (id: string, updates: Partial<Subject>) => {
    const updated = subjects.map(s => s.id === id ? { ...s, ...updates } : s);
    saveSubjects(updated);

    const supabase = getSupabase();
    if (supabase && user.id && id.length === 36) {
      supabase
        .from('subjects')
        .update({
          name: updates.name,
          color: updates.color,
        })
        .eq('id', id)
        .then();
    }
  };

  const deleteSubject = (id: string) => {
    const filtered = subjects.filter(s => s.id !== id);
    saveSubjects(filtered);
    if (selectedSubjectId === id && filtered.length > 0) {
      setSelectedSubjectId(filtered[0].id);
    }

    const supabase = getSupabase();
    if (supabase && user.id && id.length === 36) {
      supabase.from('subjects').delete().eq('id', id).then();
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
        startTimer,
        pauseTimer,
        resumeTimer,
        stopTimer,
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
