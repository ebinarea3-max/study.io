'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useStudy } from '../../context/StudyContext';
import { useAuth } from '../../context/AuthContext';
import { DailyTodoList } from '../todo/DailyTodoList';
import { SubjectManagerModal, SubjectManager } from './SubjectManagerModal';
import { ErrorBoundary } from '../common/ErrorBoundary';
import {
  formatSeconds,
  formatHoursAndMins,
  getLocalStartOfDay,
  getLocalEndOfDay,
  getYesterdayRange,
} from '../../lib/utils';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Maximize2,
  FolderPlus,
  Flame,
  Clock,
  Sparkles,
  ChevronDown,
  MessageCircle,
  Check,
  X,
  Coffee,
  SkipForward,
} from 'lucide-react';
import { soundFx } from '../../lib/audio';
import confetti from 'canvas-confetti';
import { getSupabase } from '../../lib/supabase';
import { StudySession, Subject, TimerMode, UserProfile } from '../../types';
import { calculateFocusXP } from '../../lib/gamification';
import { calculateSessionRP } from '../../lib/rankedSystem';
import { getLocalDateString } from '../../lib/dateUtils';

const EMPTY_STATE_QUOTES = [
  'Every long streak starts with one session.',
  'Future you will thank you for starting now.',
  "Small steps. Press Start whenever you're ready.",
];

export function StudyTimer() {
  const { user, isLoading, updateProfile } = useAuth();
  const {
    subjects = [],
    selectedSubject,
    selectedSubjectId,
    setSelectedSubjectId,
    timerMode,
    setTimerMode,
    isStudying,
    isPaused,
    isRunning,
    startTimeRef,
    elapsedSeconds,
    pomodoroPhase,
    pomodoroWorkDuration,
    pomodoroBreakDuration,
    pomodoroPreset,
    setPomodoroPreset,
    pomodoroCompletedPhase,
    setPomodoroCompletedPhase,
    saveAndStartBreak,
    skipPomodoroBreak,
    startPomodoroBreak,
    setIsFocusModeOpen,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    resetTimer,
    restoreTimerSession,
    clearPersistedTimer,
    sessions,
    refetchSessions,
    addSession,
    currentNotes,
    triggerXpEarned,
    showRankSettlement,
    activeTaskId,
  } = useStudy();

  const subjectList = Array.isArray(subjects) ? subjects : [];
  const activeSubjects = useMemo(() => subjectList.filter(sub => sub && !sub.is_archived), [subjectList]);

  const [isManageSubjectsOpen, setIsManageSubjectsOpen] = useState(false);
  const isSubjectModalOpen = isManageSubjectsOpen;
  const setIsSubjectModalOpen = setIsManageSubjectsOpen;
  const [showDropdown, setShowDropdown] = useState(false);
  const [overviewView, setOverviewView] = useState<'today' | 'yesterday'>('today');
  const [isSaving, setIsSaving] = useState(false);
  const [showRecoveryBanner, setShowRecoveryBanner] = useState(false);
  const [subjectWarning, setSubjectWarning] = useState(false);

  // Safe handler to open Subject Manager / Add Subject
  const handleOpenSubjectManager = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setShowDropdown(false);
    setIsManageSubjectsOpen(true);
  }, []);

  // Lock the motivation quote in useState on initial load so it NEVER changes while timer is running
  const [lockedEmptyQuote] = useState(() => {
    return EMPTY_STATE_QUOTES[Math.floor(Math.random() * EMPTY_STATE_QUOTES.length)];
  });

  // Auto-dismiss subject warning after 5 seconds
  useEffect(() => {
    if (!subjectWarning) return;
    const timer = setTimeout(() => {
      setSubjectWarning(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, [subjectWarning]);

  // Maintain a fresh ref to the currently active subject to prevent stale closures in timer callbacks
  const activeSubjectRef = useRef<Subject | null>(selectedSubject);
  useEffect(() => {
    const sub =
      (Array.isArray(subjects) ? subjects : []).find(s => s && s.id === selectedSubjectId && !s.is_archived) ||
      selectedSubject ||
      null;
    activeSubjectRef.current = sub;
  }, [selectedSubject, selectedSubjectId, subjects]);

  // Streamlined control handlers cleanly controlling synchronized StudyContext timer engine
  const handleStartSession = useCallback(() => {
    const activeSub =
      activeSubjectRef.current ||
      selectedSubject ||
      activeSubjects.find(s => s && s.id === selectedSubjectId) ||
      null;

    if (!activeSub?.id || (activeSub.name || '').trim().toLowerCase() === 'unassigned') {
      alert("Please choose a subject before recording focus time.");
      setSubjectWarning(true);
      if (activeSubjects.length === 0) {
        handleOpenSubjectManager();
      } else {
        setShowDropdown(true);
      }
      return;
    }
    setSubjectWarning(false);
    setShowRecoveryBanner(false);
    startTimer(activeSub.id);
  }, [activeSubjects, selectedSubject, selectedSubjectId, startTimer, handleOpenSubjectManager]);

  const handlePause = useCallback(() => {
    pauseTimer();
  }, [pauseTimer]);

  const handleResume = useCallback(() => {
    setShowRecoveryBanner(false);
    resumeTimer();
  }, [resumeTimer]);

  const handleReset = useCallback(() => {
    resetTimer();
    clearPersistedTimer();
    setShowRecoveryBanner(false);
  }, [resetTimer, clearPersistedTimer]);

  const handleStopAndSave = useCallback(async () => {
    if (isSaving) return;

    // 1. Prevent race conditions: Capture exact real-time duration BEFORE mutating any state or resetting timer display
    const seconds = isRunning && startTimeRef?.current
      ? Math.max(elapsedSeconds, Math.floor((Date.now() - startTimeRef.current) / 1000))
      : elapsedSeconds;

    // Direct, fresh capture of active subject via ref and state/storage
    let activeSubject =
      activeSubjectRef.current ||
      selectedSubject ||
      activeSubjects.find(s => s && s.id === selectedSubjectId) ||
      subjectList.find(s => s && s.id === selectedSubjectId) ||
      null;

    if (!activeSubject && typeof window !== 'undefined') {
      try {
        const uid = user?.id || 'guest';
        const storedSubId =
          localStorage.getItem(`study_io_selected_subject_${uid}`) ||
          localStorage.getItem('study_io_selected_subject_guest') ||
          localStorage.getItem('studypulse_selected_subject_id');
        const storedSubs =
          localStorage.getItem(`study_io_subjects_${uid}`) ||
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
      alert("Please choose a subject before recording focus time.");
      setSubjectWarning(true);
      setShowDropdown(true);
      return;
    }

    const selectedSub = activeSubject;
    const isUuid = (id?: string | null) => typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    let subjectId = isUuid(selectedSub.id) ? selectedSub.id : null;
    const currentMode = timerMode || 'stopwatch';
    const notesToSave = currentNotes?.trim() || null;
    const now = new Date();
    const endedAt = now.toISOString();
    const startedAt = new Date(now.getTime() - seconds * 1000).toISOString();

    // Handle non-positive durations (allow any duration > 0 including short test sessions)
    if (seconds <= 0) {
      resetTimer();
      clearPersistedTimer();
      setShowRecoveryBanner(false);
      return;
    }

    setIsSaving(true);

    try {
      const supabase = getSupabase();

      // 2. Ensure active user is present via supabase.auth.getUser()
      let activeUser: any = null;
      if (supabase) {
        try {
          const authRes = await supabase.auth.getUser();
          if (!authRes.error && authRes.data?.user) {
            activeUser = authRes.data.user;
          }
        } catch (err) {
          console.warn('Error fetching active user via supabase.auth.getUser():', err);
        }
      }

      // If logged in but subjectId is not a UUID (e.g. local subject), resolve UUID from Supabase subjects table
      if (supabase && activeUser?.id && !subjectId && selectedSub.name) {
        try {
          const { data: matchedSub } = await supabase
            .from('subjects')
            .select('id')
            .eq('user_id', activeUser.id)
            .ilike('name', selectedSub.name.trim())
            .maybeSingle();

          if (matchedSub?.id) {
            subjectId = matchedSub.id;
          } else {
            const { data: createdSub } = await supabase
              .from('subjects')
              .insert({
                user_id: activeUser.id,
                name: selectedSub.name.trim(),
                color: selectedSub.color || '#10B981',
                daily_goal_minutes: selectedSub.daily_goal_minutes || 60,
              })
              .select('id')
              .single();
            if (createdSub?.id) {
              subjectId = createdSub.id;
            }
          }
        } catch (err) {
          console.warn('Could not resolve or create subject in Supabase:', err);
        }
      }

      const sessionPayload = {
        user_id: activeUser?.id || user?.id,
        subject_id: subjectId || selectedSub?.id || null,
        subject_name: selectedSub?.name || 'General Study',
        duration_seconds: seconds,
        created_at: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0],
        started_at: startedAt,
        ended_at: endedAt,
        mode: currentMode,
        notes: notesToSave,
      };

      console.log("Saving focus session payload:", sessionPayload);

      // 3. Insert the record into study_sessions
      let insertedRecordId: string | null = null;

      if (supabase && activeUser?.id) {
        try {
          const { data, error } = await supabase.from('study_sessions').insert([sessionPayload]).select();
          if (error) {
            console.error("Supabase session insert error:", error);
            // Schema fallback: if Postgres table does not have subject_name / date client columns, retry with DB-exact columns
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
                console.log('Session successfully persisted to Supabase:', retryRes.data);
              }
            }
          } else {
            insertedRecordId = data?.[0]?.id || null;
            console.log('Session successfully persisted to Supabase:', data);
          }
        } catch (err) {
          console.error('Exception during Supabase study_sessions insert:', err);
        }
      }

      // 4. Immediately append the new session to local state so Project Time Distribution and stats update in real time
      const newSession: StudySession = {
        id: insertedRecordId || `sess-${Date.now()}`,
        userId: sessionPayload.user_id || 'guest',
        userName: user?.displayName || 'Scholar',
        userAvatar: user?.avatarUrl,
        subjectId: sessionPayload.subject_id || selectedSub.id,
        subjectName: sessionPayload.subject_name,
        subjectColor: selectedSub.color || '#10b981',
        subject_name: sessionPayload.subject_name,
        startTime: startedAt,
        endTime: endedAt,
        durationSeconds: sessionPayload.duration_seconds,
        notes: notesToSave || '',
        mode: currentMode,
        createdAt: sessionPayload.created_at,
      };

      // 4. Immediately backup to localStorage cache and append to local state
      if (typeof window !== 'undefined') {
        try {
          const uid = sessionPayload.user_id || activeUser?.id || user?.id;
          if (uid) {
            const rawStored = localStorage.getItem(`study_io_sessions_${uid}`) || localStorage.getItem('studypulse_sessions');
            const parsedStored: StudySession[] = rawStored ? JSON.parse(rawStored) : [];
            const updated = [newSession, ...parsedStored.filter(s => s.id !== newSession.id)];
            localStorage.setItem(`study_io_sessions_${uid}`, JSON.stringify(updated));
            localStorage.setItem('studypulse_sessions', JSON.stringify(updated));
          }
        } catch {}
      }

      // Immediately update local Daily Overview and Analytics stats state
      addSession(newSession);

      // Trigger celebratory XP gain notification
      const earnedXP = calculateFocusXP(seconds);
      if (earnedXP > 0) {
        triggerXpEarned(earnedXP, `${Math.max(1, Math.round(seconds / 60))} min Focus Session`, 'focus');
      }

      soundFx.playStopChime();
      const todayStart = getLocalStartOfDay(new Date());
      const todayEnd = getLocalEndOfDay(new Date());
      const allSessionsWithNew = [newSession, ...sessions.filter(s => s.id !== newSession.id)];
      const totalToday = allSessionsWithNew
        .filter(s => {
          const t = new Date(s.startTime).getTime();
          return t >= todayStart.getTime() && t <= todayEnd.getTime();
        })
        .reduce((sum, s) => sum + s.durationSeconds, 0);

      const dailyGoalSeconds = (user?.dailyGoalHours || 2) * 3600;
      if (totalToday >= dailyGoalSeconds && totalToday - seconds < dailyGoalSeconds) {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.5 },
        });
        soundFx.playMilestoneBell();
      }

      // Free Fire RP Calculation & Post-Match Rank Settlement Trigger
      const todayString = getLocalDateString(new Date());
      let localStreakBonusDate: string | null = null;
      try {
        localStreakBonusDate = localStorage.getItem('studypulse_last_streak_bonus_date');
      } catch {}
      const lastStreakBonusDate = user?.last_streak_bonus_date || user?.lastStreakBonusDate || localStreakBonusDate;
      const hasStreakOrGoal = (user?.streakDays || 0) > 0 || totalToday >= dailyGoalSeconds;
      const hasCompletedTask = Boolean(activeTaskId);
      const rpBreakdown = calculateSessionRP(seconds, {
        hasStreakOrGoal,
        hasCompletedTask,
        lastStreakBonusDate,
        todayString,
      });

      const prevRP = Number((user as any)?.rp ?? user?.seasonRp ?? 0);
      const newRP = prevRP + rpBreakdown.totalGained;

      // Persist new RP and streak bonus date in profile
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

      // Trigger Free Fire Post-Match Settlement Modal immediately
      showRankSettlement({
        prevRP,
        newRP,
        breakdown: rpBreakdown,
        subjectName: sessionPayload.subject_name,
        subjectColor: selectedSub.color || '#10b981',
      });

      // Reset and stop active timer engine (syncs stopped to all devices)
      resetTimer();
      clearPersistedTimer();
      setShowRecoveryBanner(false);

      // Explicitly ensure active_sessions is cleared from Supabase
      if (activeUser?.id && supabase) {
        try {
          await supabase.from('active_sessions').delete().eq('user_id', activeUser.id);
        } catch (delErr) {
          console.warn('StudyTimer: Failed to clear active_session on save:', delErr);
        }
      }

      // Invalidate and refetch analytics queries
      if (activeUser?.id) {
        try {
          await refetchSessions();
        } catch (refetchErr) {
          console.warn('StudyTimer: Background refetch failed:', refetchErr);
        }
      }
    } finally {
      setIsSaving(false);
    }
  }, [
    isSaving,
    isRunning,
    startTimeRef,
    elapsedSeconds,
    selectedSubject,
    timerMode,
    user,
    currentNotes,
    addSession,
    soundFx,
    sessions,
    resetTimer,
    clearPersistedTimer,
    refetchSessions,
    activeTaskId,
    showRankSettlement,
    updateProfile,
  ]);

  useEffect(() => {
    refetchSessions();
  }, [refetchSessions]);

  // 1. State Persistence Strategy: Persist timer state in localStorage on every tick while running or state change
  useEffect(() => {
    if (isStudying && elapsedSeconds > 0) {
      try {
        localStorage.setItem('studyio_timer_seconds', String(elapsedSeconds));
        const subIdOrName = selectedSubject?.id || selectedSubject?.name || selectedSubjectId;
        if (subIdOrName) {
          localStorage.setItem('studyio_timer_subject', subIdOrName);
        }
        localStorage.setItem('studyio_timer_mode', timerMode || 'stopwatch');
      } catch (e) {
        console.warn('Failed to persist timer state to localStorage:', e);
      }
    }
  }, [isStudying, elapsedSeconds, selectedSubject, selectedSubjectId, timerMode]);

  // 2. On Component Mount / Page Load: Check localStorage and recover session in Paused state
  useEffect(() => {
    try {
      const savedSecondsStr = localStorage.getItem('studyio_timer_seconds');
      if (savedSecondsStr) {
        const savedSeconds = parseInt(savedSecondsStr, 10);
        if (!isNaN(savedSeconds) && savedSeconds > 0) {
          const savedSubject = localStorage.getItem('studyio_timer_subject') || undefined;
          const savedMode = localStorage.getItem('studyio_timer_mode') as TimerMode | null;
          const validatedMode = savedMode === 'pomodoro' || savedMode === 'stopwatch' ? savedMode : undefined;

          restoreTimerSession(savedSeconds, validatedMode, savedSubject);
          setShowRecoveryBanner(true);
        }
      }
    } catch (e) {
      console.warn('Failed to restore timer from localStorage:', e);
    }
  }, [restoreTimerSession]);

  // Auto-dismiss recovery banner after 8 seconds
  useEffect(() => {
    if (!showRecoveryBanner) return;
    const timer = setTimeout(() => {
      setShowRecoveryBanner(false);
    }, 8000);
    return () => clearTimeout(timer);
  }, [showRecoveryBanner]);

  // 3. beforeunload event listener: warn user before closing or reloading tab if timer is running or has unsaved progress
  useEffect(() => {
    const hasUnsavedProgress = isRunning || (isStudying && elapsedSeconds > 0) || elapsedSeconds > 0;
    if (!hasUnsavedProgress) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
      return '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isRunning, isStudying, elapsedSeconds]);

  // Local browser timezone day bounds
  const startOfToday = useMemo(() => getLocalStartOfDay(new Date()), []);
  const endOfToday = useMemo(() => getLocalEndOfDay(new Date()), []);
  const { startOfDay: startOfYesterday, endOfDay: endOfYesterday } = useMemo(() => getYesterdayRange(), []);

  // Filtered sessions for Today (browser-local timezone)
  const todaySessions = useMemo(() => {
    const todayLocalDate = new Date().toLocaleDateString();
    return sessions.filter(s => {
      const name = (s.subject_name || s.subjectName || (s as any).subject?.name || (s as any).subject || '').trim().toLowerCase();
      if (!name || name === 'unassigned' || (!s.subjectId && !(s as any).subject_id) || s.durationSeconds <= 0) return false;
      const sessionDateStr = s.startTime || (s as any).started_at || s.createdAt;
      if (!sessionDateStr) return false;
      const d = new Date(sessionDateStr);
      const t = d.getTime();
      return d.toLocaleDateString() === todayLocalDate || (t >= startOfToday.getTime() && t <= endOfToday.getTime());
    });
  }, [sessions, startOfToday, endOfToday]);

  // Filtered sessions for Yesterday (browser-local timezone)
  const yesterdaySessions = useMemo(() => {
    return sessions.filter(s => {
      const name = (s.subject_name || s.subjectName || (s as any).subject?.name || (s as any).subject || '').trim().toLowerCase();
      if (!name || name === 'unassigned' || (!s.subjectId && !(s as any).subject_id)) return false;
      const t = new Date(s.startTime).getTime();
      return t >= startOfYesterday.getTime() && t <= endOfYesterday.getTime();
    });
  }, [sessions, startOfYesterday, endOfYesterday]);

  // Overview metrics (Today & Yesterday) - calculated strictly from saved sessions, never recalculates during active ticks
  const overviewTodaySeconds = useMemo(() => {
    return todaySessions.reduce((sum, s) => sum + s.durationSeconds, 0);
  }, [todaySessions]);
  const overviewTodaySessionsCount = todaySessions.length;

  const yesterdayTotalSeconds = useMemo(() => {
    return yesterdaySessions.reduce((sum, s) => sum + s.durationSeconds, 0);
  }, [yesterdaySessions]);
  const yesterdaySessionsCount = yesterdaySessions.length;

  // Calculate today's subject study time (completed sessions only to avoid active ticking re-evaluations)
  const todaySubjectSeconds = useMemo(() => {
    if (!selectedSubject?.id) return 0;
    return todaySessions
      .filter(s => s && s.subjectId === selectedSubject.id)
      .reduce((sum, s) => sum + (s?.durationSeconds || 0), 0);
  }, [todaySessions, selectedSubject?.id]);

  // Time calculations strictly for display
  let displayTime = formatSeconds(elapsedSeconds);
  let progressPercent = 0;

  if (timerMode === 'pomodoro') {
    const target = pomodoroPhase === 'work' ? pomodoroWorkDuration : pomodoroBreakDuration;
    const remaining = Math.max(0, target - elapsedSeconds);
    displayTime = formatSeconds(remaining);
    progressPercent = Math.min(100, (elapsedSeconds / target) * 100);
  } else {
    const subjectTargetSeconds = ((selectedSubject?.targetMinutesPerDay || 120) * 60);
    progressPercent = selectedSubject?.id
      ? Math.min(100, ((todaySubjectSeconds + elapsedSeconds) / Math.max(1, subjectTargetSeconds)) * 100)
      : 0;
  }

  // Muted teal-gray (#5A6B6A) for General Focus, neutral slate-gray (#64748B) when no subject is selected
  const subjectColor = !selectedSubject
    ? '#64748B'
    : selectedSubject?.name === 'General Focus' && (selectedSubject?.color === '#3B82F6' || !selectedSubject?.color)
    ? '#5A6B6A'
    : selectedSubject?.color || '#10B981';

  // Recent 4 sessions (filtering unassigned / null-subject sessions)
  const recentSessions = [...sessions]
    .filter(s => {
      const name = (s.subject_name || s.subjectName || (s as any).subject?.name || (s as any).subject || '').trim().toLowerCase();
      return name && name !== 'unassigned' && (s.subjectId || (s as any).subject_id);
    })
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    .slice(0, 4);

  // Dynamic Motivation & Boost Messaging - memoized based on saved sessions and locked quote
  const { primaryBoostMessage, secondaryBoostMessage } = useMemo(() => {
    if (isLoading) {
      return {
        primaryBoostMessage: 'Ready to begin your session.',
        secondaryBoostMessage: '',
      };
    }

    const currentStreak = user?.streakDays ?? 0;
    const focusMinutes = Math.floor(overviewTodaySeconds / 60);
    const sessionCount = todaySessions.length;

    let primary = '';
    let secondary = '';

    // 1. Streak-based evaluation
    if (currentStreak >= 30) {
      primary = "🔥 30-day streak! You've basically made this a lifestyle.";
    } else if (currentStreak >= 14) {
      primary = "🔥 Two weeks strong — this is becoming a habit now.";
    } else if (currentStreak >= 7) {
      primary = "🔥 7-day streak! Consistency is compounding.";
    } else if (currentStreak >= 3) {
      primary = `🔥 You're on a ${currentStreak}-day streak — don't break the chain.`;
    } else if (currentStreak === 2) {
      primary = "🔥 You're on a 2-day streak — don't break the chain.";
    } else if (currentStreak === 1) {
      primary = "🔥 Day 1 logged. Come back tomorrow to start a streak.";
    }

    // 2. Session-length based evaluation (based on completed focus time)
    let sessionMsg = '';
    if (focusMinutes >= 240) {
      sessionMsg = '4+ hours today. Seriously — consider a break.';
    } else if (focusMinutes >= 120) {
      sessionMsg = '2 hours of deep focus already. Great pace.';
    } else if (focusMinutes >= 25) {
      sessionMsg = 'Nice, you completed a full focus block today.';
    }

    // Priority & secondary combining logic
    if (primary) {
      if (sessionMsg) {
        secondary = sessionMsg;
      }
    } else if (sessionMsg) {
      primary = sessionMsg;
    } else if (currentStreak === 0 && overviewTodaySeconds === 0 && sessionCount === 0) {
      // Locked quote evaluated once on page load
      primary = lockedEmptyQuote;
    } else {
      primary = 'No pressure — just hit Start and your streak begins.';
    }

    return {
      primaryBoostMessage: primary,
      secondaryBoostMessage: secondary,
    };
  }, [isLoading, user?.streakDays, overviewTodaySeconds, todaySessions.length, lockedEmptyQuote]);

  return (
    <div className="w-full max-w-6xl mx-auto h-[calc(100dvh-4rem)] md:h-auto flex flex-col md:grid md:grid-cols-1 lg:grid-cols-12 justify-between md:justify-start gap-4 lg:gap-6 overflow-hidden md:overflow-visible p-4 md:p-0">
      {/* Subject Manager Modal - Conditionally mounted strictly when open (Stop Background Rendering) */}
      {isManageSubjectsOpen && (
        <ErrorBoundary
          fallbackTitle="Subject Manager"
          resetKey={isManageSubjectsOpen}
          onClose={() => setIsManageSubjectsOpen(false)}
        >
          <SubjectManager
            isOpen={isManageSubjectsOpen}
            onClose={() => setIsManageSubjectsOpen(false)}
          />
        </ErrorBoundary>
      )}

      {/* Main Left Column (Timer & Subject Goal Progress) */}
      <div className="lg:col-span-8 flex-1 md:flex-initial flex flex-col justify-between overflow-hidden md:overflow-visible space-y-0 md:space-y-6">
        {/* Main Timer Glass Card */}
        <div className="relative rounded-3xl bg-neutral-900/50 border border-white/[0.08] hover:border-emerald-500/25 backdrop-blur-2xl p-3.5 sm:p-8 lg:p-10 shadow-2xl overflow-hidden flex-1 md:flex-initial flex flex-col justify-between transition-all">
          {/* Subtle Ambient Glow */}
          <div
            className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-[100px] opacity-15 pointer-events-none transition-all duration-700"
            style={{ backgroundColor: subjectColor }}
          />
          <div
            className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full blur-[100px] opacity-10 pointer-events-none transition-all duration-700"
            style={{ backgroundColor: subjectColor }}
          />

          {/* Subtle Previous Session Recovery Banner */}
          {showRecoveryBanner && (
            <div className="relative z-30 mb-3 sm:mb-6 flex items-center justify-between gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs font-semibold backdrop-blur-md shadow-lg shadow-amber-500/5 animate-in fade-in slide-in-from-top-2 duration-300 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <span>Previous session recovered and paused.</span>
              </div>
              <button
                onClick={() => setShowRecoveryBanner(false)}
                className="p-1.5 rounded-xl hover:bg-amber-500/20 text-amber-300 transition-colors cursor-pointer"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Top Controls: Mode Switcher, Preset Selector & Focus Mode Button */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-4 relative z-10 pb-3 sm:pb-6 border-b border-white/[0.08] flex-shrink-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {/* Mode Pill Toggle */}
              <div className="flex items-center gap-1 p-0.5 sm:p-1 rounded-2xl bg-black/60 border border-white/[0.08]">
                <button
                  onClick={() => { if (!isStudying) setTimerMode('stopwatch'); }}
                  disabled={isStudying}
                  className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                    timerMode === 'stopwatch'
                      ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30'
                      : 'text-neutral-400 hover:text-white'
                  } ${isStudying ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                >
                  Stopwatch
                </button>
                <button
                  onClick={() => { if (!isStudying) setTimerMode('pomodoro'); }}
                  disabled={isStudying}
                  className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                    timerMode === 'pomodoro'
                      ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30'
                      : 'text-neutral-400 hover:text-white'
                  } ${isStudying ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                >
                  Pomodoro
                </button>
              </div>

              {/* Clean Pill/Segment Preset Selector (25/5 and 50/10) */}
              {timerMode === 'pomodoro' && (
                <div
                  className="flex items-center gap-1 p-0.5 sm:p-1 rounded-2xl bg-black/60 border border-white/[0.08] animate-in fade-in zoom-in-95 duration-200"
                  title={isStudying ? "Interval presets are locked while session is running" : "Choose focus / break interval preset"}
                >
                  <button
                    onClick={() => {
                      if (!isStudying) setPomodoroPreset('25/5');
                    }}
                    disabled={isStudying}
                    className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 active:scale-95 ${
                      pomodoroPreset === '25/5'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm shadow-emerald-500/20'
                        : 'text-neutral-400 hover:text-white border border-transparent'
                    } ${isStudying ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                    title="25m Focus / 5m Break (Standard)"
                  >
                    <span>25 / 5</span>
                  </button>

                  <button
                    onClick={() => {
                      if (!isStudying) setPomodoroPreset('50/10');
                    }}
                    disabled={isStudying}
                    className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 active:scale-95 ${
                      pomodoroPreset === '50/10'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm shadow-emerald-500/20'
                        : 'text-neutral-400 hover:text-white border border-transparent'
                    } ${isStudying ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                    title="50m Focus / 10m Break (Deep Work)"
                  >
                    <span>50 / 10</span>
                  </button>
                </div>
              )}
            </div>

            {/* High-Contrast Fullscreen Focus Mode Button - Hidden on mobile */}
            <button
              onClick={() => setIsFocusModeOpen(true)}
              className="hidden md:flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-300 text-xs font-bold transition-all shadow-md shadow-emerald-500/10 active:scale-95 cursor-pointer"
            >
              <Maximize2 className="w-4 h-4 text-emerald-400" />
              <span>Fullscreen Focus Mode</span>
            </button>
          </div>

          {/* Subject Selection Bar - Compact on Mobile */}
          <div className="relative z-20 my-2 sm:my-5 flex-shrink-0">
            {/* Subject warning banner */}
            {subjectWarning && (
              <div className="mb-2 sm:mb-3 flex items-center justify-between gap-2.5 px-3 py-2 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs font-semibold backdrop-blur-md shadow-lg shadow-amber-500/10 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 text-xs">⚠️</span>
                  <span className="text-[11px] sm:text-xs">
                    {activeSubjects.length === 0 ? 'Please add a subject before starting.' : 'Please select a subject before starting.'}
                  </span>
                </div>
                <button
                  onClick={() => setSubjectWarning(false)}
                  className="p-1 rounded-lg hover:bg-amber-500/20 text-amber-300 transition-colors cursor-pointer"
                  title="Dismiss"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="flex items-center justify-between gap-2.5 sm:gap-3">
              {/* Subject Dropdown */}
              <div className="relative flex-1 min-w-0 w-full">
                <button
                  type="button"
                  onClick={(e) => {
                    if (activeSubjects.length === 0) {
                      handleOpenSubjectManager(e);
                    } else {
                      setShowDropdown(!showDropdown);
                    }
                  }}
                  disabled={isStudying}
                  className={`w-full flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 bg-black/40 hover:bg-black/60 border rounded-2xl text-xs sm:text-sm font-semibold transition-all disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer ${
                    subjectWarning
                      ? 'border-amber-500/80 ring-2 ring-amber-500/30 shadow-lg shadow-amber-500/10'
                      : 'border-white/[0.08]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0 shadow-sm transition-colors"
                      style={{ backgroundColor: selectedSubject ? (selectedSubject?.color || subjectColor) : activeSubjects.length === 0 ? '#10B981' : '#64748B' }}
                    />
                    <span className={`truncate ${selectedSubject?.name ? "text-white font-bold tracking-tight" : activeSubjects.length === 0 ? "text-emerald-400 font-bold tracking-tight" : "text-neutral-400 font-medium tracking-tight"}`}>
                      {selectedSubject?.name || (activeSubjects.length === 0 ? 'Add a Subject' : 'Select a Subject')}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-neutral-400 flex-shrink-0 ml-1" />
                </button>

                {showDropdown && !isStudying && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-[#0d0e12] border border-white/[0.08] rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500 select-none border-b border-white/[0.06] mb-1">
                      Select a subject to focus on
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-1">
                      {activeSubjects.map(sub => {
                        const itemColor =
                          sub?.name === 'General Focus' && (sub?.color === '#3B82F6' || !sub?.color)
                            ? '#5A6B6A'
                            : sub?.color || '#10B981';

                        return (
                          <button
                            type="button"
                            key={sub?.id || Math.random().toString()}
                            onClick={() => {
                              if (sub?.id) {
                                setSelectedSubjectId(sub.id);
                              }
                              setShowDropdown(false);
                              setSubjectWarning(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                              sub?.id && sub.id === selectedSubjectId
                                ? 'bg-white/[0.08] text-white'
                                : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: itemColor }}
                              />
                              <span className="truncate">{sub?.name || 'Untitled Subject'}</span>
                            </div>
                            <span className="text-[10px] text-neutral-400 font-mono flex-shrink-0 ml-2">
                              {Math.floor((sub?.targetMinutesPerDay || 60) / 60)}h goal
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="pt-2 mt-2 border-t border-white/[0.08]">
                      <button
                        type="button"
                        onClick={handleOpenSubjectManager}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold text-[#8FA3A1] hover:bg-white/[0.06] transition-colors cursor-pointer"
                      >
                        <FolderPlus className="w-3.5 h-3.5 text-[#8FA3A1]" />
                        <span>Manage / Add Subjects</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Manage Subjects Button - Hidden on mobile to keep top compact, accessible inside dropdown */}
              <button
                type="button"
                onClick={handleOpenSubjectManager}
                className="hidden sm:flex p-2.5 sm:py-2.5 sm:px-3.5 rounded-2xl bg-neutral-900/70 hover:bg-neutral-800 border border-white/[0.08] text-neutral-300 hover:text-white transition-colors items-center justify-center gap-2 text-xs font-semibold active:scale-95 cursor-pointer shadow-sm flex-shrink-0"
                title="Edit Subjects"
              >
                <FolderPlus className="w-4 h-4 text-[#8FA3A1]" />
                <span>Edit Subjects</span>
              </button>
            </div>
          </div>

          {/* Center Timer Circular Display - Scaled to w-64 h-64 on Mobile */}
          <div className="relative z-10 flex flex-col items-center justify-center my-auto py-1 sm:py-6 flex-shrink-0">
            <div className="relative flex items-center justify-center p-1 sm:p-2 w-64 h-64 sm:w-80 sm:h-80 mx-auto aspect-square">
              {/* Subtle Emerald Outer Halo / Gradient Rim */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-b from-emerald-500/20 via-emerald-500/5 to-transparent blur-lg pointer-events-none" />
              <div className="absolute inset-1 sm:inset-1.5 rounded-full border border-emerald-500/25 pointer-events-none" />

              {/* Outer Animated Ring */}
              <div
                className={`w-full h-full rounded-full border-4 flex items-center justify-center transition-all duration-700 relative z-10 ${
                  isStudying && !isPaused ? 'shadow-2xl' : 'shadow-[0_0_35px_rgba(16,185,129,0.12)]'
                }`}
                style={{
                  borderColor: isStudying ? `${subjectColor}50` : 'rgba(16, 185, 129, 0.35)',
                  boxShadow: isStudying && !isPaused
                    ? `0 0 50px ${subjectColor}30, 0 0 30px rgba(16, 185, 129, 0.2)`
                    : '0 0 35px rgba(16, 185, 129, 0.12)',
                }}
              >
                {/* Inner Dial */}
                <div
                  className="w-[84%] h-[84%] rounded-full bg-black/60 border border-white/[0.08] flex flex-col items-center justify-center p-2.5 sm:p-6 text-center shadow-inner"
                  style={{
                    borderColor: isStudying ? `${subjectColor}60` : undefined,
                  }}
                >
                  {/* Pomodoro Phase / Subject Pill */}
                  <div
                    className="mb-1 sm:mb-2 text-[10px] sm:text-[11px] font-bold px-2.5 sm:px-3 py-0.5 rounded-full border transition-colors max-w-[90%] truncate shadow-sm"
                    style={{
                      backgroundColor: selectedSubject ? `${subjectColor}18` : 'rgba(241, 245, 249, 0.95)',
                      borderColor: selectedSubject ? `${subjectColor}50` : 'rgba(203, 213, 225, 0.9)',
                      color: selectedSubject ? subjectColor : '#334155',
                    }}
                  >
                    {timerMode === 'pomodoro'
                      ? pomodoroPhase === 'work'
                        ? `🔥 Focus Sprint (${pomodoroPreset === '50/10' ? '50m' : '25m'})`
                        : `☕ Recharge Break (${pomodoroPreset === '50/10' ? '10m' : '5m'})`
                      : selectedSubject?.name || (activeSubjects.length === 0 ? 'Add a subject above' : 'Select a subject above')}
                  </div>

                  {/* Big Digital Numbers with Strict Tabular Monospaced Formatting */}
                  <div
                    className="font-mono text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white drop-shadow-md tabular-nums select-none"
                    style={{
                      fontVariantNumeric: 'tabular-nums',
                      fontFamily: 'var(--font-geist-mono), monospace',
                    }}
                  >
                    {displayTime}
                  </div>

                  {/* Status Indicator: Warm Neutral Pulsing Waiting Dot */}
                  <div className="mt-1.5 sm:mt-2 flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-neutral-300">
                    <span
                      className={`w-2 h-2 rounded-full transition-all ${
                        pomodoroCompletedPhase === 'work'
                          ? 'bg-emerald-500 animate-ping'
                          : pomodoroCompletedPhase === 'break'
                          ? 'bg-amber-500 animate-bounce'
                          : isStudying
                          ? isPaused
                            ? 'bg-amber-500'
                            : 'bg-emerald-500 animate-pulse'
                          : 'bg-amber-500 dark:bg-amber-200/90 shadow-[0_0_8px_rgba(245,158,11,0.35)] animate-[pulse_2s_ease-in-out_infinite]'
                      }`}
                    />
                    <span className="text-slate-700 dark:text-neutral-300 font-semibold">
                      {pomodoroCompletedPhase === 'work'
                        ? 'Focus Complete!'
                        : pomodoroCompletedPhase === 'break'
                        ? 'Break Over'
                        : timerMode === 'pomodoro' && pomodoroPhase === 'shortBreak'
                        ? isPaused
                          ? 'Break Paused — Ready'
                          : 'Recharging'
                        : isStudying
                        ? isPaused
                          ? 'Timer Paused'
                          : 'Studying Live'
                        : 'Ready to Start'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Focus Block Complete Alert Banner */}
            {pomodoroCompletedPhase === 'work' && (
              <div className="mt-6 w-full max-w-md flex items-center justify-between gap-3 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-teal-500/15 to-emerald-500/10 border border-emerald-500/40 text-emerald-200 text-xs font-semibold backdrop-blur-md shadow-xl shadow-emerald-500/10 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-emerald-300 animate-pulse" />
                  </div>
                  <div>
                    <div className="text-sm font-black text-white">Focus Block Complete! 🎉</div>
                    <div className="text-[11px] text-emerald-300/90 font-normal">
                      Save session to trigger rank settlement and pause for break, or skip.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Break Over Alert Banner */}
            {pomodoroCompletedPhase === 'break' && (
              <div className="mt-6 w-full max-w-md flex items-center justify-between gap-3 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-amber-500/15 to-transparent border border-amber-500/40 text-amber-200 text-xs font-semibold backdrop-blur-md shadow-xl shadow-amber-500/10 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center flex-shrink-0">
                    <Flame className="w-4 h-4 text-amber-300 animate-pulse" />
                  </div>
                  <div>
                    <div className="text-sm font-black text-white">Break Over — Ready to Study?</div>
                    <div className="text-[11px] text-amber-300/90 font-normal">
                      Timer switched back to focus mode. Click start when ready.
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setPomodoroCompletedPhase(null)}
                  className="p-1 rounded-lg hover:bg-amber-500/20 text-amber-300 transition-colors cursor-pointer"
                  title="Dismiss"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Action Buttons: Context-aware controls */}
            <div className="mt-auto pt-2 sm:pt-8 flex flex-wrap items-center justify-center gap-2 sm:gap-3 relative z-10 w-full flex-shrink-0 pb-1 sm:pb-0">
              {pomodoroCompletedPhase === 'work' ? (
                /* Prompt 1: Focus Block Complete -> Save & Start Break / Skip Break */
                <>
                  <button
                    onClick={async () => {
                      setIsSaving(true);
                      try {
                        await saveAndStartBreak();
                      } finally {
                        setIsSaving(false);
                      }
                    }}
                    disabled={isSaving}
                    className="px-5 sm:px-6 py-3 sm:py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs sm:text-sm transition-all shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 active:scale-95 hover:scale-[1.02] cursor-pointer disabled:opacity-50 flex-1 xs:flex-initial min-w-[140px]"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Coffee className="w-4 h-4 fill-current" />
                        <span>Save & Start Break</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={async () => {
                      setIsSaving(true);
                      try {
                        await skipPomodoroBreak();
                      } finally {
                        setIsSaving(false);
                      }
                    }}
                    disabled={isSaving}
                    className="px-5 sm:px-6 py-3 sm:py-3.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-white/[0.12] text-neutral-300 hover:text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer disabled:opacity-50 flex-1 xs:flex-initial min-w-[120px]"
                  >
                    <SkipForward className="w-4 h-4" />
                    <span>Skip Break</span>
                  </button>
                </>
              ) : timerMode === 'pomodoro' && pomodoroPhase === 'shortBreak' ? (
                /* Prompt 2: Break Mode Controls (Paused awaiting click vs Running) */
                isPaused ? (
                  <>
                    <button
                      onClick={startPomodoroBreak}
                      className="px-6 sm:px-8 py-3 sm:py-3.5 rounded-2xl bg-gradient-to-r from-teal-400 to-emerald-500 hover:from-teal-300 hover:to-emerald-400 text-slate-950 font-black text-xs sm:text-sm transition-all shadow-xl shadow-teal-500/25 flex items-center justify-center gap-2 active:scale-95 hover:scale-[1.02] cursor-pointer flex-1 xs:flex-initial min-w-[130px]"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>Start Break</span>
                    </button>
                    <button
                      onClick={handleReset}
                      className="px-4 sm:px-5 py-3 sm:py-3.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-white/[0.08] text-neutral-400 hover:text-white font-bold text-xs sm:text-sm transition-colors active:scale-95 cursor-pointer flex-1 xs:flex-initial min-w-[110px]"
                    >
                      <span>Skip Break</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handlePause}
                      className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-amber-300 font-bold text-xs sm:text-sm border border-amber-500/30 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer flex-1 xs:flex-initial min-w-[120px]"
                    >
                      <Pause className="w-4 h-4" />
                      <span>Pause Break</span>
                    </button>
                    <button
                      onClick={handleReset}
                      className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-2xl bg-neutral-900/80 hover:bg-neutral-800 border border-white/[0.08] text-neutral-400 hover:text-white font-bold text-xs sm:text-sm transition-colors active:scale-95 cursor-pointer flex-1 xs:flex-initial min-w-[110px]"
                    >
                      <span>End Break</span>
                    </button>
                  </>
                )
              ) : pomodoroCompletedPhase === 'break' ? (
                /* Break completed, waiting for user click */
                <button
                  onClick={() => {
                    setPomodoroCompletedPhase(null);
                    handleStartSession();
                  }}
                  className="px-6 sm:px-8 py-3 sm:py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs sm:text-sm transition-all shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 active:scale-95 hover:scale-[1.02] cursor-pointer w-full xs:w-auto"
                >
                  <Flame className="w-4 sm:w-5 h-4 sm:h-5 fill-current" />
                  <span>Start Focus Session</span>
                </button>
              ) : !isStudying ? (
                /* 1. IDLE State: One primary button */
                <button
                  onClick={handleStartSession}
                  className={`px-6 sm:px-8 py-3.5 sm:py-3.5 rounded-2xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 sm:gap-2.5 w-full xs:w-auto ${
                    !selectedSubject?.id
                      ? 'bg-neutral-800/80 text-neutral-500 border border-white/[0.08] opacity-50 cursor-not-allowed shadow-none'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-xl shadow-emerald-500/25 active:scale-95 hover:scale-[1.02] cursor-pointer'
                  }`}
                  title={!selectedSubject?.id ? 'Please select a subject before starting the timer' : 'Start Focus Session'}
                >
                  <Play className="w-4 sm:w-5 h-4 sm:h-5 fill-current" />
                  <span>Start Session</span>
                </button>
              ) : !isPaused ? (
                /* 2. RUNNING State: Two buttons (Pause & Stop & Save) */
                <>
                  <button
                    onClick={handlePause}
                    className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-amber-300 font-bold text-xs sm:text-sm border border-amber-500/30 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer flex-1 xs:flex-initial min-w-[110px]"
                  >
                    <Pause className="w-4 h-4" />
                    <span>Pause</span>
                  </button>

                  <button
                    onClick={handleStopAndSave}
                    disabled={isSaving}
                    className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex-1 xs:flex-initial min-w-[130px]"
                    title={isSaving ? "Saving session..." : "Stop and save session"}
                  >
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-rose-300 border-t-transparent rounded-full animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Square className="w-4 h-4 fill-current" />
                        <span>Stop & Save</span>
                      </>
                    )}
                  </button>
                </>
              ) : (
                /* 3. PAUSED State: Two buttons (Resume & Stop & Save) plus subtle Reset icon */
                <>
                  <button
                    onClick={handleResume}
                    disabled={isSaving}
                    className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 active:scale-95 cursor-pointer disabled:opacity-50 flex-1 xs:flex-initial min-w-[110px]"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Resume</span>
                  </button>

                  <button
                    onClick={handleStopAndSave}
                    disabled={isSaving}
                    className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex-1 xs:flex-initial min-w-[130px]"
                    title={isSaving ? "Saving session..." : "Stop and save session"}
                  >
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-rose-300 border-t-transparent rounded-full animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Square className="w-4 h-4 fill-current" />
                        <span>Stop & Save</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleReset}
                    className="p-2.5 sm:p-3 rounded-2xl bg-neutral-900/80 hover:bg-neutral-800 border border-white/[0.08] text-neutral-400 hover:text-white transition-colors active:scale-95 cursor-pointer flex-shrink-0"
                    title="Reset Timer"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Subject Today's Progress Card - Hidden on mobile single-screen view, visible on desktop */}
        <div className="hidden md:flex rounded-2xl bg-neutral-900/50 border border-white/[0.08] p-5 flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-md"
              style={{ backgroundColor: `${subjectColor}25`, borderColor: subjectColor, borderWidth: 1 }}
            >
              <Clock className="w-5 h-5" style={{ color: subjectColor }} />
            </div>
            <div>
              <div className="text-xs text-neutral-400">
                {selectedSubject?.name ? `Today on ${selectedSubject.name}` : 'Today on Subject'}
              </div>
              <div className="text-base font-bold text-white flex items-center gap-2">
                <span className="font-mono tabular-nums">{formatHoursAndMins(todaySubjectSeconds)}</span>
                {selectedSubject?.name && (
                  <span className="text-xs text-neutral-500 font-normal font-mono">
                    / {Math.floor((selectedSubject?.targetMinutesPerDay || 120) / 60)}h target
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Mini progress bar */}
          <div className="w-full sm:w-64">
            <div className="flex justify-between text-[11px] text-neutral-400 mb-1 font-medium">
              <span>Goal Progress</span>
              <span style={{ color: subjectColor }} className="font-mono font-bold tabular-nums">
                {Math.round(progressPercent)}%
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-black/50 overflow-hidden border border-white/[0.05]">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progressPercent}%`,
                  backgroundColor: subjectColor,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Right Secondary Column (Todo List, Daily Overview & Today's Boost - Home Page Sidebar, exclusively rendered in Tasks tab on mobile) */}
      <div className="hidden lg:block lg:col-span-4 space-y-6">
        {/* 1. Todo List Card - Google Notes / Keep Checklist */}
        <DailyTodoList />

        {/* 2. Daily Overview (Electric Violet / Indigo Accent) */}
        <div className="rounded-3xl bg-neutral-900/50 border border-white/[0.08] hover:border-violet-500/30 backdrop-blur-xl p-5 shadow-xl space-y-4 transition-all relative overflow-hidden group">
          {/* Subtle Ambient Violet Glow */}
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-violet-600/10 blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between pb-3 border-b border-violet-500/15 relative z-10">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-500 dark:text-violet-400" />
              <span className="text-xs font-bold text-slate-900 dark:text-violet-200 tracking-tight uppercase">Daily Overview</span>
            </div>
            {/* Today vs Yesterday Toggle */}
            <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-100 dark:bg-violet-950/50 border border-slate-200 dark:border-violet-800/40 text-[10px]">
              <button
                onClick={() => setOverviewView('today')}
                className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                  overviewView === 'today'
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-violet-300/70 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setOverviewView('yesterday')}
                className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                  overviewView === 'yesterday'
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-violet-300/70 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Yesterday
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-violet-300/70 font-semibold font-mono relative z-10">
            <span>{overviewView === 'today' ? "Today's Activity" : "Yesterday's Activity"}</span>
            <span>
              {overviewView === 'today'
                ? new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                : new Date(Date.now() - 86400000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 relative z-10">
            <div className="p-3 rounded-2xl bg-slate-100 dark:bg-violet-950/20 border border-slate-200 dark:border-violet-800/30 hover:border-violet-500/30 transition-colors space-y-1">
              <div className="text-[10px] uppercase font-semibold tracking-wider text-slate-500 dark:text-violet-300/70">Total Focus</div>
              <div className="text-lg font-bold text-slate-900 dark:text-violet-100 font-mono tabular-nums tracking-tight">
                {formatHoursAndMins(overviewView === 'today' ? overviewTodaySeconds : yesterdayTotalSeconds)}
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-100 dark:bg-violet-950/20 border border-slate-200 dark:border-violet-800/30 hover:border-violet-500/30 transition-colors space-y-1">
              <div className="text-[10px] uppercase font-semibold tracking-wider text-slate-500 dark:text-violet-300/70">Sessions</div>
              <div className="text-lg font-bold text-slate-900 dark:text-violet-100 font-mono tabular-nums tracking-tight">
                {overviewView === 'today' ? overviewTodaySessionsCount : yesterdaySessionsCount}
              </div>
            </div>
          </div>

          <div className="pt-1 flex items-center justify-between text-xs relative z-10">
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-neutral-400">
              <Flame className="w-3.5 h-3.5 text-[#f97316] fill-[#f97316]" />
              <span className="font-medium">Streak</span>
            </span>
            {(user?.streakDays ?? 0) > 0 ? (
              <span className="px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-700/40 text-orange-700 dark:text-[#f97316] font-mono font-bold text-xs tabular-nums shadow-sm shadow-orange-950/30">
                {user?.streakDays ?? 0} {(user?.streakDays ?? 0) === 1 ? 'day' : 'days'}
              </span>
            ) : (
              <span className="font-mono font-bold text-slate-500 dark:text-neutral-400 tabular-nums">Start today</span>
            )}
          </div>
        </div>

        {/* 3. Today's Boost / Motivation Card (Solar Amber / Warm Gold Accent) */}
        <div className="rounded-3xl bg-amber-950/10 border border-amber-500/20 hover:border-amber-500/35 backdrop-blur-xl p-5 shadow-xl space-y-3 transition-all relative overflow-hidden group">
          {/* Subtle Ambient Amber Glow */}
          <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

          <div className="flex items-center gap-2 pb-2.5 border-b border-amber-500/15 relative z-10">
            <MessageCircle className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            <span className="text-xs font-bold text-slate-800 dark:text-amber-300 tracking-tight uppercase">Today's Boost</span>
          </div>

          <div className="min-h-[40px] flex flex-col justify-center relative z-10">
            <p className="text-[15px] font-semibold text-slate-800 dark:text-amber-100/95 leading-snug tracking-tight drop-shadow-sm">
              {primaryBoostMessage}
            </p>
            {secondaryBoostMessage && (
              <p className="text-xs text-slate-700 dark:text-amber-300/80 mt-1.5 leading-normal font-medium">
                {secondaryBoostMessage}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
