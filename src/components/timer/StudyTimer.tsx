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
import { getLocalDateString, isSessionToday, isSessionYesterday } from '../../lib/dateUtils';
import { Skeleton } from '../common/Skeleton';
import { useRankTheme } from '../../hooks/useRankTheme';

const EMPTY_STATE_QUOTES = [
  'Every long streak starts with one session.',
  'Future you will thank you for starting now.',
  "Small steps. Press Start whenever you're ready.",
];

export function StudyTimer() {
  const { user, isLoading, updateProfile } = useAuth();
  const { theme, userRank } = useRankTheme();
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
    hasHydrated,
    isLoadingSessions,
    isRemoteTransitioning,
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
        duration_seconds: seconds,
        started_at: startedAt,
        ended_at: endedAt,
        notes: notesToSave && notesToSave.trim().length > 0 ? notesToSave.trim() : null,
        mode: currentMode || 'stopwatch',
      };

      console.log("Saving focus session payload:", sessionPayload);
      console.log('[Timer Write: StudyTimer handleStopAndSave]', {
        timestamp: new Date().toISOString(),
        final_duration_saved: seconds,
        sessionPayload,
      });

      // 3. Insert the record into study_sessions matching exact column names
      let insertedRecordId: string | null = null;

      if (supabase && activeUser?.id) {
        try {
          const { data, error } = await supabase.from('study_sessions').insert([sessionPayload]).select();
          if (error) {
            console.error("Supabase session insert error:", error);
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
        subjectName: selectedSub.name || 'General Study',
        subjectColor: selectedSub.color || '#10b981',
        subject_name: selectedSub.name || 'General Study',
        startTime: startedAt,
        endTime: endedAt,
        durationSeconds: sessionPayload.duration_seconds,
        notes: notesToSave || '',
        mode: currentMode,
        createdAt: new Date().toISOString(),
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
        subjectName: selectedSub.name || 'General Study',
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

  // Filtered sessions for Today (browser-local timezone)
  const todaySessions = useMemo(() => {
    return sessions.filter(s => {
      const duration = Number(s.durationSeconds ?? (s as any).duration_seconds ?? (s as any).duration ?? 0);
      if (duration <= 0) return false;
      const rawName = (s.subject_name || s.subjectName || (s as any).subject?.name || (s as any).subject || '').trim().toLowerCase();
      if (rawName === 'unassigned') return false;
      return isSessionToday(s);
    });
  }, [sessions]);

  // Filtered sessions for Yesterday (browser-local timezone)
  const yesterdaySessions = useMemo(() => {
    return sessions.filter(s => {
      const duration = Number(s.durationSeconds ?? (s as any).duration_seconds ?? (s as any).duration ?? 0);
      if (duration <= 0) return false;
      const rawName = (s.subject_name || s.subjectName || (s as any).subject?.name || (s as any).subject || '').trim().toLowerCase();
      if (rawName === 'unassigned') return false;
      return isSessionYesterday(s);
    });
  }, [sessions]);

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
        {/* Main Timer Game-HUD Card with Targeting Reticle Corner Brackets */}
        <div
          className="relative rounded-3xl bg-[#14171D] border border-white/[0.08] p-3.5 sm:p-8 lg:p-10 shadow-2xl overflow-hidden flex-1 md:flex-initial flex flex-col justify-between transition-all hud-corner-frame"
          style={{ borderColor: `${theme.accent}35`, boxShadow: `0 0 35px -10px ${theme.glow}` }}
        >
          {/* Angular Targeting Reticle Corner Brackets */}
          <div className="hud-corner-bracket hud-corner-tl" />
          <div className="hud-corner-bracket hud-corner-tr" />
          <div className="hud-corner-bracket hud-corner-bl" />
          <div className="hud-corner-bracket hud-corner-br" />

          {/* Subtle Ambient Glow */}
          <div
            className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-[100px] opacity-15 pointer-events-none transition-all duration-700"
            style={{ backgroundColor: theme.accent }}
          />
          <div
            className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full blur-[100px] opacity-10 pointer-events-none transition-all duration-700"
            style={{ backgroundColor: theme.accent }}
          />

          {/* Subtle Previous Session Recovery Banner */}
          {showRecoveryBanner && (
            <div className="relative z-30 mb-3 sm:mb-6 flex items-center justify-between gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs font-semibold backdrop-blur-md shadow-lg shadow-amber-500/5 animate-in fade-in slide-in-from-top-2 duration-300 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <span className="font-hud tracking-wide">PREVIOUS SESSION RESTORED (PAUSED)</span>
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
              <div className="flex items-center gap-1 p-0.5 sm:p-1 rounded-2xl bg-[#0A0C10] border border-white/[0.08]">
                <button
                  onClick={() => { if (!isStudying) setTimerMode('stopwatch'); }}
                  disabled={isStudying}
                  className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-xl text-xs font-hud font-bold tracking-wider transition-all active:scale-95 ${
                    timerMode === 'stopwatch'
                      ? 'text-slate-950 shadow-md'
                      : 'text-neutral-400 hover:text-white'
                  } ${isStudying ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                  style={timerMode === 'stopwatch' ? { background: theme.gradient, boxShadow: `0 0 12px ${theme.glow}` } : undefined}
                >
                  STOPWATCH
                </button>
                <button
                  onClick={() => { if (!isStudying) setTimerMode('pomodoro'); }}
                  disabled={isStudying}
                  className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-xl text-xs font-hud font-bold tracking-wider transition-all active:scale-95 ${
                    timerMode === 'pomodoro'
                      ? 'text-slate-950 shadow-md'
                      : 'text-neutral-400 hover:text-white'
                  } ${isStudying ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                  style={timerMode === 'pomodoro' ? { background: theme.gradient, boxShadow: `0 0 12px ${theme.glow}` } : undefined}
                >
                  POMODORO
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

            <div className="flex items-center gap-2 sm:gap-3">
              {/* High-Contrast Fullscreen Focus Mode Button - Hidden on mobile */}
              <button
                onClick={() => setIsFocusModeOpen(true)}
                className="hidden md:flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-300 text-xs font-bold transition-all shadow-md shadow-emerald-500/10 active:scale-95 cursor-pointer"
              >
                <Maximize2 className="w-4 h-4 text-emerald-400" />
                <span>Fullscreen Focus Mode</span>
              </button>
            </div>
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
                  disabled={isStudying || isRemoteTransitioning}
                  title={isStudying ? "Subject cannot be changed while session is active" : "Select a subject to focus on"}
                  className={`w-full flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 bg-black/40 hover:bg-black/60 border rounded-2xl text-xs sm:text-sm font-semibold transition-all disabled:opacity-85 disabled:cursor-not-allowed cursor-pointer ${
                    subjectWarning
                      ? 'border-amber-500/80 ring-2 ring-amber-500/30 shadow-lg shadow-amber-500/10'
                      : isStudying
                      ? 'border-white/[0.12] bg-white/[0.02]'
                      : 'border-white/[0.08]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0 shadow-sm transition-colors"
                      style={{ backgroundColor: selectedSubject ? (selectedSubject?.color || subjectColor) : activeSubjects.length === 0 ? '#10B981' : '#64748B' }}
                    />
                    <span className={`truncate ${selectedSubject?.name ? "text-white font-bold tracking-tight" : activeSubjects.length === 0 ? "text-emerald-400 font-bold tracking-tight" : "text-neutral-400 font-medium tracking-tight"}`}>
                      {selectedSubject?.name || (activeSubjects.length === 0 ? '[ + Add a Subject ]' : '[ Select a Subject ]')}
                    </span>
                    {isStudying && (
                      <span className="text-[10px] uppercase font-bold text-neutral-400 bg-white/[0.08] px-1.5 py-0.5 rounded-md flex-shrink-0 ml-1">
                        Locked
                      </span>
                    )}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-neutral-400 flex-shrink-0 ml-1 transition-transform ${isStudying ? 'opacity-40' : ''}`} />
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

          {/* Center Timer Display - Game HUD Radar / Reactor Core Display */}
          <div className="relative z-10 flex flex-col items-center justify-center my-auto py-1 sm:py-6 flex-shrink-0">
            <div className={`relative flex items-center justify-center p-1 sm:p-2 w-64 h-64 sm:w-80 sm:h-80 mx-auto aspect-square transition-all duration-300 rounded-full ${
              isRemoteTransitioning
                ? 'scale-[1.03] ring-4 ring-white/50 shadow-[0_0_50px_var(--tier-glow)]'
                : ''
            }`}>
              {/* Outer Tier Accent Ambient Halo */}
              <div
                className="absolute inset-0 rounded-full blur-xl pointer-events-none transition-all duration-700 opacity-25"
                style={{ background: theme.gradient }}
              />

              {/* Segmented Radar / Reactor Core SVG Ring */}
              <svg
                viewBox="0 0 300 300"
                className="absolute inset-0 w-full h-full pointer-events-none select-none"
              >
                <defs>
                  <linearGradient id="timerTierGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={theme.accent} />
                    <stop offset="50%" stopColor={theme.accentHover} />
                    <stop offset="100%" stopColor={theme.accent} />
                  </linearGradient>
                </defs>

                {/* Outer Graduation Tick Marks (12 radial ticks) */}
                <g opacity="0.85">
                  {Array.from({ length: 12 }).map((_, i) => {
                    const angle = (i * 30 - 90) * (Math.PI / 180);
                    // Light up ticks progressively based on session progress
                    const isActiveTick = (i / 12) * 100 <= progressPercent && progressPercent > 0;
                    const rOuter = 144;
                    const rInner = isActiveTick ? 133 : 137;
                    const x1 = 150 + rOuter * Math.cos(angle);
                    const y1 = 150 + rOuter * Math.sin(angle);
                    const x2 = 150 + rInner * Math.cos(angle);
                    const y2 = 150 + rInner * Math.sin(angle);
                    return (
                      <line
                        key={i}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={isActiveTick ? theme.accent : 'rgba(255,255,255,0.1)'}
                        strokeWidth={isActiveTick ? 2 : 1}
                        strokeLinecap="round"
                        className="transition-all duration-500"
                      />
                    );
                  })}
                </g>

                {/* Background Track Circle */}
                <circle
                  cx="150"
                  cy="150"
                  r="124"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.06)"
                  strokeWidth="3.5"
                />

                {/* Dynamic Progress Arc */}
                <circle
                  cx="150"
                  cy="150"
                  r="124"
                  fill="none"
                  stroke="url(#timerTierGrad)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 124}
                  strokeDashoffset={2 * Math.PI * 124 - (progressPercent / 100) * (2 * Math.PI * 124)}
                  className="transition-all duration-500 ease-out"
                  style={{
                    filter: `drop-shadow(0 0 6px ${theme.glow})`,
                  }}
                  transform="rotate(-90 150 150)"
                />
              </svg>

              {/* Rotating Radar Scanline when Running */}
              {isStudying && !isPaused && (
                <div
                  className="absolute inset-5 rounded-full pointer-events-none animate-radar-sweep opacity-30"
                  style={{
                    background: `conic-gradient(from 0deg, transparent 0deg, transparent 270deg, ${theme.glow} 330deg, ${theme.accent} 360deg)`,
                  }}
                />
              )}

              {/* Inner Dial */}
              <div
                className="w-[78%] h-[78%] rounded-full bg-[#0A0C10] border flex flex-col items-center justify-center p-2.5 sm:p-6 text-center relative z-10 shadow-inner"
                style={{
                  borderColor: isStudying ? `${theme.accent}50` : 'rgba(255, 255, 255, 0.08)',
                  boxShadow: isStudying && !isPaused
                    ? `inset 0 0 30px ${theme.glow}, 0 0 25px ${theme.glow}`
                    : 'inset 0 0 20px rgba(0,0,0,0.8)',
                }}
              >
                {/* Pomodoro Phase / Subject Pill */}
                <div
                  className="mb-1 sm:mb-2 text-[10px] sm:text-[11px] font-hud font-bold px-2.5 sm:px-3 py-0.5 rounded-full border transition-colors max-w-[90%] truncate shadow-sm uppercase tracking-wider"
                  style={{
                    backgroundColor: selectedSubject ? theme.badgeBg : 'rgba(255, 255, 255, 0.05)',
                    borderColor: selectedSubject ? `${theme.accent}50` : 'rgba(255, 255, 255, 0.1)',
                    color: selectedSubject ? theme.textAccent : '#94a3b8',
                  }}
                >
                  {!selectedSubject
                    ? 'SELECT SUBJECT'
                    : timerMode === 'pomodoro'
                    ? pomodoroPhase === 'work'
                      ? `FOCUS // ${selectedSubject.name}`
                      : `RECHARGE // BREAK`
                    : selectedSubject.name}
                </div>

                {/* Big Technical Digital Numbers */}
                <div
                  className="font-hud font-black text-4xl sm:text-5xl md:text-6xl tracking-wider text-white drop-shadow-lg tabular-nums select-none"
                  style={{
                    textShadow: isStudying && !isPaused ? `0 0 16px ${theme.glow}` : undefined,
                  }}
                >
                  {displayTime}
                </div>

                {/* Animated HUD Monospace Status Readout */}
                <div className="mt-1.5 sm:mt-2 flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] font-hud-mono font-bold tracking-wider uppercase">
                  <span
                    className={`w-2 h-2 rounded-full transition-all ${
                      pomodoroCompletedPhase === 'work'
                        ? 'animate-ping'
                        : pomodoroCompletedPhase === 'break'
                        ? 'animate-bounce'
                        : isStudying
                        ? isPaused
                          ? ''
                          : 'animate-pulse'
                        : 'animate-[pulse_2s_ease-in-out_infinite]'
                    }`}
                    style={{
                      backgroundColor:
                        pomodoroCompletedPhase === 'work'
                          ? theme.accent
                          : isStudying
                          ? isPaused
                            ? '#f59e0b'
                            : theme.accent
                          : theme.accent,
                      boxShadow: `0 0 8px ${theme.accent}`,
                    }}
                  />
                  <span style={{ color: isStudying && !isPaused ? theme.textAccent : '#94A3B8' }}>
                    {pomodoroCompletedPhase === 'work'
                      ? '● COMPLETE // BLOCK FINISHED'
                      : pomodoroCompletedPhase === 'break'
                      ? '● BREAK OVER // READY'
                      : timerMode === 'pomodoro' && pomodoroPhase === 'shortBreak'
                      ? isPaused
                        ? '● HOLD // RECHARGE PAUSED'
                        : '● ACTIVE // RECHARGING'
                      : isStudying
                      ? isPaused
                        ? '● HOLD // SESSION PAUSED'
                        : '● ACTIVE // FOCUS LIVE'
                      : '● STANDBY // SYSTEM READY'}
                  </span>
                </div>
              </div>
            </div>

            {/* Focus Block Complete Alert Banner */}
            {pomodoroCompletedPhase === 'work' && (
              <div
                className="mt-6 w-full max-w-md flex items-center justify-between gap-3 px-5 py-3.5 rounded-2xl border text-xs font-semibold backdrop-blur-md shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-300"
                style={{
                  backgroundColor: theme.badgeBg,
                  borderColor: `${theme.accent}50`,
                  boxShadow: `0 0 20px ${theme.glow}`,
                }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-xl border flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: theme.badgeBg,
                      borderColor: `${theme.accent}50`,
                      color: theme.accent,
                    }}
                  >
                    <Sparkles className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <div className="text-sm font-hud font-black text-white tracking-wide">FOCUS BLOCK COMPLETE 🎉</div>
                    <div className="text-[11px] text-slate-300 font-normal">
                      Save session to trigger rank settlement and pause for break, or skip.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Break Over Alert Banner */}
            {pomodoroCompletedPhase === 'break' && (
              <div className="mt-6 w-full max-w-md flex items-center justify-between gap-3 px-5 py-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs font-semibold backdrop-blur-md shadow-xl shadow-amber-500/10 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center flex-shrink-0">
                    <Flame className="w-4 h-4 text-amber-300 animate-pulse" />
                  </div>
                  <div>
                    <div className="text-sm font-hud font-black text-white tracking-wide">BREAK OVER // READY TO STUDY?</div>
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

            {/* Action Buttons: Context-aware HUD controls */}
            <div className="mt-auto pt-4 sm:pt-8 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 relative z-10 w-full flex-shrink-0 pb-1 sm:pb-0">
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
                    disabled={isSaving || isRemoteTransitioning}
                    className="px-6 sm:px-8 py-3.5 rounded-xl font-hud font-bold text-xs sm:text-sm text-slate-950 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex-1 xs:flex-initial min-w-[150px] uppercase tracking-wider hud-btn-primary"
                    style={{ background: theme.gradient, boxShadow: `0 0 20px ${theme.glow}` }}
                  >
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        <span>SAVING...</span>
                      </>
                    ) : (
                      <>
                        <Coffee className="w-4 h-4 fill-current" />
                        <span>SAVE &amp; START BREAK</span>
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
                    disabled={isSaving || isRemoteTransitioning}
                    className="px-5 sm:px-6 py-3.5 rounded-xl bg-[#14171D] hover:bg-[#1B2028] border border-white/[0.12] text-slate-300 hover:text-white font-hud font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex-1 xs:flex-initial min-w-[120px] uppercase tracking-wider"
                  >
                    <SkipForward className="w-4 h-4" />
                    <span>SKIP BREAK</span>
                  </button>
                </>
              ) : timerMode === 'pomodoro' && pomodoroPhase === 'shortBreak' ? (
                /* Prompt 2: Break Mode Controls (Paused awaiting click vs Running) */
                isPaused ? (
                  <>
                    <button
                      onClick={startPomodoroBreak}
                      disabled={isSaving || isRemoteTransitioning}
                      className="px-6 sm:px-8 py-3.5 rounded-xl font-hud font-bold text-xs sm:text-sm text-slate-950 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex-1 xs:flex-initial min-w-[140px] uppercase tracking-wider hud-btn-primary"
                      style={{ background: theme.gradient, boxShadow: `0 0 20px ${theme.glow}` }}
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>START BREAK</span>
                    </button>
                    <button
                      onClick={handleReset}
                      disabled={isSaving || isRemoteTransitioning}
                      className="px-5 sm:px-6 py-3.5 rounded-xl bg-[#14171D] hover:bg-[#1B2028] border border-white/[0.08] text-slate-400 hover:text-white font-hud font-bold text-xs sm:text-sm transition-colors active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex-1 xs:flex-initial min-w-[110px] uppercase tracking-wider"
                    >
                      <span>SKIP BREAK</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handlePause}
                      disabled={isSaving || isRemoteTransitioning}
                      className="px-5 sm:px-7 py-3 rounded-xl bg-[#14171D] hover:bg-[#1B2028] text-amber-300 font-hud font-bold text-xs sm:text-sm border border-amber-500/40 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex-1 xs:flex-initial min-w-[120px] uppercase tracking-wider"
                    >
                      <Pause className="w-4 h-4" />
                      <span>PAUSE BREAK</span>
                    </button>
                    <button
                      onClick={handleReset}
                      disabled={isSaving || isRemoteTransitioning}
                      className="px-5 sm:px-6 py-3 rounded-xl bg-[#14171D] hover:bg-[#1B2028] border border-white/[0.08] text-slate-400 hover:text-white font-hud font-bold text-xs sm:text-sm transition-colors active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex-1 xs:flex-initial min-w-[110px] uppercase tracking-wider"
                    >
                      <span>END BREAK</span>
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
                  disabled={isSaving || isRemoteTransitioning}
                  className="px-8 sm:px-10 py-3.5 sm:py-4 font-hud font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2.5 w-full xs:w-auto hud-btn-primary cursor-pointer hover:scale-[1.02]"
                  style={{
                    background: theme.gradient,
                    boxShadow: `0 0 24px -2px ${theme.glow}`,
                  }}
                >
                  <Flame className="w-4 sm:w-5 h-4 sm:h-5 fill-current" />
                  <span>START FOCUS SESSION</span>
                </button>
              ) : !isStudying ? (
                /* 1. IDLE State: Beveled HUD Button */
                <button
                  onClick={handleStartSession}
                  disabled={!selectedSubject?.id || isSaving || isRemoteTransitioning}
                  className={`px-8 sm:px-10 py-3.5 sm:py-4 font-hud font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2.5 w-full xs:w-auto hud-btn-primary ${
                    !selectedSubject?.id || isRemoteTransitioning
                      ? 'opacity-40 cursor-not-allowed shadow-none'
                      : 'cursor-pointer hover:scale-[1.02]'
                  }`}
                  style={{
                    background: theme.gradient,
                    boxShadow: `0 0 24px -2px ${theme.glow}`,
                  }}
                  title={!selectedSubject?.id ? 'Please select a subject before starting the timer' : 'Start Focus Session'}
                >
                  <Play className="w-4 sm:w-5 h-4 sm:h-5 fill-current" />
                  <span>START SESSION</span>
                </button>
              ) : !isPaused ? (
                /* 2. RUNNING State: Two buttons (Pause & Stop & Save) */
                <>
                  <button
                    onClick={handlePause}
                    disabled={isSaving || isRemoteTransitioning}
                    className="px-5 sm:px-7 py-3 rounded-xl bg-[#14171D] hover:bg-[#1B2028] text-amber-300 font-hud font-bold text-xs sm:text-sm border border-amber-500/40 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex-1 xs:flex-initial min-w-[120px] shadow-sm tracking-wider uppercase"
                  >
                    <Pause className="w-4 h-4" />
                    <span>PAUSE</span>
                  </button>

                  <button
                    onClick={handleStopAndSave}
                    disabled={isSaving || isRemoteTransitioning}
                    className="px-5 sm:px-7 py-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 font-hud font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex-1 xs:flex-initial min-w-[140px] shadow-sm tracking-wider uppercase"
                    title={isSaving ? "Saving session..." : "Stop and save session"}
                  >
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-rose-300 border-t-transparent rounded-full animate-spin" />
                        <span>SAVING...</span>
                      </>
                    ) : (
                      <>
                        <Square className="w-4 h-4 fill-current" />
                        <span>STOP &amp; SAVE</span>
                      </>
                    )}
                  </button>
                </>
              ) : (
                /* 3. PAUSED State: Resume, Stop & Save, Reset */
                <>
                  <button
                    onClick={handleResume}
                    disabled={isSaving || isRemoteTransitioning}
                    className="px-6 sm:px-8 py-3 rounded-xl font-hud font-bold text-xs sm:text-sm text-slate-950 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex-1 xs:flex-initial min-w-[120px] tracking-wider uppercase hud-btn-primary"
                    style={{ background: theme.gradient, boxShadow: `0 0 16px ${theme.glow}` }}
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>RESUME</span>
                  </button>

                  <button
                    onClick={handleStopAndSave}
                    disabled={isSaving || isRemoteTransitioning}
                    className="px-5 sm:px-7 py-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 font-hud font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex-1 xs:flex-initial min-w-[140px] shadow-sm tracking-wider uppercase"
                    title={isSaving ? "Saving session..." : "Stop and save session"}
                  >
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-rose-300 border-t-transparent rounded-full animate-spin" />
                        <span>SAVING...</span>
                      </>
                    ) : (
                      <>
                        <Square className="w-4 h-4 fill-current" />
                        <span>STOP &amp; SAVE</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleReset}
                    disabled={isSaving || isRemoteTransitioning}
                    className="p-3 rounded-xl bg-[#14171D] hover:bg-[#1B2028] border border-white/[0.08] text-slate-400 hover:text-white transition-colors active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
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

        {/* 2. Unified HUD Stat Readout Panel */}
        <div
          className="rounded-2xl bg-[#14171D] border border-white/[0.08] p-5 shadow-xl space-y-4 transition-all relative overflow-hidden hud-corner-frame"
          style={{ borderColor: `${theme.accent}30` }}
        >
          <div className="hud-corner-bracket hud-corner-tl" />
          <div className="hud-corner-bracket hud-corner-tr" />
          <div className="hud-corner-bracket hud-corner-bl" />
          <div className="hud-corner-bracket hud-corner-br" />

          {/* Ambient Tier Glow */}
          <div
            className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl pointer-events-none opacity-20"
            style={{ backgroundColor: theme.accent }}
          />

          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] relative z-10">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" style={{ color: theme.accent }} />
              <span className="text-xs font-hud font-bold text-white tracking-widest uppercase">
                TELEMETRY OVERVIEW
              </span>
            </div>
            {/* Today vs Yesterday Toggle */}
            <div className="flex items-center gap-1 p-0.5 rounded-xl bg-[#0A0C10] border border-white/[0.08] text-[10px]">
              <button
                onClick={() => setOverviewView('today')}
                className={`px-2.5 py-1 rounded-lg font-hud font-bold tracking-wider uppercase transition-all cursor-pointer ${
                  overviewView === 'today'
                    ? 'text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                style={overviewView === 'today' ? { background: theme.gradient } : undefined}
              >
                TODAY
              </button>
              <button
                onClick={() => setOverviewView('yesterday')}
                className={`px-2.5 py-1 rounded-lg font-hud font-bold tracking-wider uppercase transition-all cursor-pointer ${
                  overviewView === 'yesterday'
                    ? 'text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                style={overviewView === 'yesterday' ? { background: theme.gradient } : undefined}
              >
                YESTERDAY
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold font-hud tracking-wider uppercase relative z-10">
            <span>{overviewView === 'today' ? "TODAY'S METRICS" : "YESTERDAY'S METRICS"}</span>
            <span className="font-hud-mono">
              {overviewView === 'today'
                ? new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                : new Date(Date.now() - 86400000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>

          {/* Unified HUD Stat Readout Strip */}
          <div className="rounded-xl bg-[#0A0C10] border border-white/[0.08] p-3 divide-y divide-white/[0.08] space-y-2 relative z-10">
            <div className="flex items-center justify-between pt-1">
              <div>
                <div className="text-[10px] font-hud font-bold tracking-widest text-slate-400 uppercase">
                  TOTAL FOCUS
                </div>
                <div className="text-xs text-slate-500 font-medium">Recorded study duration</div>
              </div>
              <div
                className="text-lg font-hud font-black tracking-tight tabular-nums"
                style={{ color: theme.textAccent }}
              >
                {(isLoading || isLoadingSessions) && !hasHydrated ? (
                  <Skeleton className="h-6 w-20 bg-slate-800" />
                ) : (
                  formatHoursAndMins(overviewView === 'today' ? overviewTodaySeconds : yesterdayTotalSeconds)
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div>
                <div className="text-[10px] font-hud font-bold tracking-widest text-slate-400 uppercase">
                  SESSIONS
                </div>
                <div className="text-xs text-slate-500 font-medium">Completed study blocks</div>
              </div>
              <div className="text-lg font-hud font-black text-white tracking-tight tabular-nums">
                {(isLoading || isLoadingSessions) && !hasHydrated ? (
                  <Skeleton className="h-6 w-12 bg-slate-800" />
                ) : (
                  overviewView === 'today' ? overviewTodaySessionsCount : yesterdaySessionsCount
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div>
                <div className="text-[10px] font-hud font-bold tracking-widest text-slate-400 uppercase">
                  ACTIVE STREAK
                </div>
                <div className="text-xs text-slate-500 font-medium">Daily consistency multiplier</div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 flex items-center justify-center animate-ember-glow">
                  <Flame className="w-full h-full fill-current" style={{ color: theme.accent }} />
                </div>
                <span className="text-lg font-hud font-black tracking-tight" style={{ color: theme.textAccent }}>
                  {user?.streakDays ?? 0}D
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Today's Boost / Motivation Card */}
        <div
          className="rounded-2xl bg-[#14171D] border border-white/[0.08] p-5 shadow-xl space-y-3 transition-all relative overflow-hidden hud-corner-frame"
          style={{ borderColor: `${theme.accent}30` }}
        >
          <div className="hud-corner-bracket hud-corner-tl" />
          <div className="hud-corner-bracket hud-corner-tr" />
          <div className="hud-corner-bracket hud-corner-bl" />
          <div className="hud-corner-bracket hud-corner-br" />

          <div className="flex items-center gap-2 pb-2.5 border-b border-white/[0.08] relative z-10">
            <MessageCircle className="w-4 h-4" style={{ color: theme.accent }} />
            <span className="text-xs font-hud font-bold text-white tracking-widest uppercase">
              OPERATIONAL DIRECTIVE
            </span>
          </div>

          <div className="min-h-[40px] flex flex-col justify-center relative z-10">
            <p className="text-[14px] font-semibold text-slate-200 leading-snug tracking-tight">
              {primaryBoostMessage}
            </p>
            {secondaryBoostMessage && (
              <p className="text-xs text-slate-400 mt-1.5 leading-normal font-medium">
                {secondaryBoostMessage}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
