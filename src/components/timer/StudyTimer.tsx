'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useStudy } from '../../context/StudyContext';
import { toast } from 'react-hot-toast';
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
  Zap,
  SkipForward,
  Music,
  Volume2,
  CloudRain,
  Radio,
  Headphones,
  ChevronUp,
Settings } from 'lucide-react';
import { soundFx, AmbientSoundType } from '../../lib/audio';
import confetti from 'canvas-confetti';
import { CountdownEditor } from './CountdownEditor';
import { getSupabase } from '../../lib/supabase';
import { getDailyQuote } from '../../lib/quotes';
import { StudySession, Subject, TimerMode, UserProfile } from '../../types';
import { calculateFocusXP, getLevelFromLifetimeXP, getScholarTitle } from '../../lib/gamification';
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
  const dailyQuote = getDailyQuote();
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
    isBlockedByOtherTab,
    startTimeRef,
    elapsedSeconds,
    pomodoroPhase,
    pomodoroWorkDuration,
    pomodoroBreakDuration,
    pomodoroPreset,
    setPomodoroPreset,
    pomodoroCompletedPhase,
    setPomodoroPhase,
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
    triggerLevelUp,
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
  const [ambientSound, setAmbientSound] = useState<AmbientSoundType | 'none'>('none');
  const [ambientVolume, setAmbientVolume] = useState(0.5);
  const [isAmbientMenuOpen, setIsAmbientMenuOpen] = useState(false);
  const [countdownTarget, setCountdownTarget] = useState<number>(3600);
  const [customCountdownInput, setCustomCountdownInput] = useState("");
  const [isEditingCountdown, setIsEditingCountdown] = useState(false);

  useEffect(() => {
    return () => {
      soundFx.stopAmbient();
    };
  }, []);

  const handleAmbientChange = (type: AmbientSoundType | 'none') => {
    setAmbientSound(type);
    if (type === 'none') {
      soundFx.stopAmbient();
    } else {
      soundFx.startAmbient(type, ambientVolume);
    }
  };

  const handleVolumeChange = (vol: number) => {
    setAmbientVolume(vol);
    soundFx.setAmbientVolume(vol);
  };

  const [showDropdown, setShowDropdown] = useState(false);
  
  // Auto-open Focus Mode on mobile landscape rotation
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(orientation: landscape)');
    const handleOrientation = (e: MediaQueryListEvent) => {
      if (e.matches && window.innerWidth < 1024) {
        setIsFocusModeOpen(true);
      }
    };
    // Add event listener
    if (mql.addEventListener) mql.addEventListener('change', handleOrientation);
    else mql.addListener(handleOrientation); // fallback for older Safari
    
    return () => {
      if (mql.removeEventListener) mql.removeEventListener('change', handleOrientation);
      else mql.removeListener(handleOrientation);
    };
  }, [setIsFocusModeOpen]);
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

      // XP Calculation & Anti-Exploit Rules:
      // Award rate: 10 XP per full minute of recorded focus time: Math.floor(duration_seconds / 60) * 10
      // Duration gate: If session duration is under 60 seconds (< 1 min), earned focus XP is strictly 0.
      // Daily consistency streak bonus (+100 XP): First valid session (>= 60s) of the day
      const isValidSession = seconds >= 60;
      const focusXP = isValidSession ? Math.floor(seconds / 60) * 10 : 0;
      const appliedStreakBonus = isValidSession && (lastStreakBonusDate !== todayString);
      const totalEarnedXP = focusXP + (appliedStreakBonus ? 100 : 0);

      // Permanently increment lifetime_xp (never resets across seasons)
      const prevLifetimeXP = Number(user?.lifetime_xp ?? user?.lifetimeXp ?? user?.xp ?? 0);
      const newLifetimeXP = prevLifetimeXP + totalEarnedXP;
      const newLevel = getLevelFromLifetimeXP(newLifetimeXP);
      const newScholarTitle = getScholarTitle(newLevel);

      // Trigger celebratory XP gain notification
      if (totalEarnedXP > 0) {
        const mins = Math.floor(seconds / 60);
        const reason = appliedStreakBonus
          ? `${mins} min Focus (+100 Daily Streak)`
          : `${mins} min Focus Session`;
        triggerXpEarned(totalEarnedXP, reason, 'focus');
      }

      const prevLevel = getLevelFromLifetimeXP(prevLifetimeXP);
      if (newLevel > prevLevel) {
        triggerLevelUp(prevLevel, newLevel, newScholarTitle);
      }

      // Persist new RP, lifetime XP, level, and streak bonus date in profile
      const profileUpdates: Partial<UserProfile> = {
        seasonRp: Math.round(newRP),
        rp: Math.round(newRP),
        lifetime_xp: Math.round(newLifetimeXP),
        lifetimeXp: Math.round(newLifetimeXP),
        xp: Math.round(newLifetimeXP),
        level: Math.round(newLevel),
        levelTitle: newScholarTitle,
      };

      if (appliedStreakBonus || rpBreakdown.goalStreakBonus > 0) {
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
        if (timerMode === 'countdown') {
          localStorage.setItem('studyio_timer_countdown_target', String(countdownTarget));
        } else if (timerMode === 'pomodoro') {
          localStorage.setItem('studyio_timer_pomodoro_phase', pomodoroPhase);
        }
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
          const validatedMode = savedMode === 'pomodoro' || savedMode === 'stopwatch' || savedMode === 'countdown' ? savedMode : undefined;

          if (validatedMode === 'countdown') {
             const savedTargetStr = localStorage.getItem('studyio_timer_countdown_target');
             if (savedTargetStr) {
               const savedTarget = parseInt(savedTargetStr, 10);
               if (!isNaN(savedTarget) && savedTarget > 0) {
                 setCountdownTarget(savedTarget);
               }
             }
          } else if (validatedMode === 'pomodoro') {
             const savedPhase = localStorage.getItem('studyio_timer_pomodoro_phase') as any;
             if (savedPhase === 'work' || savedPhase === 'shortBreak' || savedPhase === 'longBreak') {
                setPomodoroPhase(savedPhase);
             }
          }

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

  // Handle Countdown Completion
  useEffect(() => {
    if (timerMode === 'countdown' && isStudying && elapsedSeconds >= countdownTarget) {
      soundFx.playMilestoneBell();
      toast.success('Countdown completed! Great focus! 🚀', { duration: 5000 });
      if (typeof document !== 'undefined' && document.hidden && 'Notification' in window && Notification.permission === 'granted') {
        const iconUrl = typeof window !== 'undefined' ? `${window.location.origin}/icon-192.png` : '/icon-192.png';
        new Notification('Countdown completed! 🚀', { body: 'Your timer is up!', icon: iconUrl });
      }
      confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
      handleStopAndSave();
    }
  }, [timerMode, isStudying, elapsedSeconds, countdownTarget, handleStopAndSave]);

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
  } else if (timerMode === 'countdown') {
    const target = countdownTarget;
    const remaining = Math.max(0, target - elapsedSeconds);
    displayTime = formatSeconds(remaining);
    progressPercent = Math.min(100, (elapsedSeconds / Math.max(1, target)) * 100);
  } else {
    const subjectTargetSeconds = ((selectedSubject?.targetMinutesPerDay || 120) * 60);
    progressPercent = selectedSubject?.id
      ? Math.min(100, ((todaySubjectSeconds + elapsedSeconds) / Math.max(1, subjectTargetSeconds)) * 100)
      : 0;
  }

  // Muted teal-gray (#5A6B6A) for General Focus, neutral slate-gray (#64748B) when no subject is selected
  const subjectColor = !selectedSubject
    ? '#64748B'
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
        secondaryBoostMessage: 'hover:scale-[1.02]',
      };
    }

    const currentStreak = user?.streakDays ?? 0;
    const focusMinutes = Math.floor(overviewTodaySeconds / 60);
    const sessionCount = todaySessions.length;

    let primary = '';
    let secondary = '';

    // 1. Streak-based evaluation
    if (currentStreak >= 30) {
      primary = "30-day streak! You've basically made this a lifestyle.";
    } else if (currentStreak >= 14) {
      primary = "Two weeks strong — this is becoming a habit now.";
    } else if (currentStreak >= 7) {
      primary = "7-day streak! Consistency is compounding.";
    } else if (currentStreak >= 3) {
      primary = `You're on a ${currentStreak}-day streak — don't break the chain.`;
    } else if (currentStreak === 2) {
      primary = "You're on a 2-day streak — don't break the chain.";
    } else if (currentStreak === 1) {
      primary = "Day 1 logged. Come back tomorrow to start a streak.";
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

  // Sweep arc for dial (1 rev/min in stopwatch while active, or progress percent in countdown/pomodoro)
  const dialSweepPercent = useMemo(() => {
    if (timerMode === 'pomodoro' || timerMode === 'countdown') {
      return progressPercent;
    }
    return isStudying && !isPaused ? ((elapsedSeconds % 60) / 60) * 100 : 0;
  }, [timerMode, progressPercent, isStudying, isPaused, elapsedSeconds]);

  return (
    <div className="max-w-[580px] w-full mx-auto flex flex-col items-center justify-center py-4 sm:py-8 px-4 animate-in fade-in duration-250">
      {/* Subject Manager Modal - Conditionally mounted strictly when open */}
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

      {/* Main Timer Card */}
      <div className="relative w-full rounded-2xl border border-white/[0.08] bg-[#0c0e14]/70 backdrop-blur-xl p-5 sm:p-7 shadow-sm overflow-hidden flex flex-col justify-between transition-all">
        {/* Session Resumed Alert Banner */}
        {showRecoveryBanner && (
          <div className="mb-4 w-full px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 backdrop-blur-md flex items-center justify-between shadow-sm z-50 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2 text-amber-300 text-xs font-medium">
              <Zap className="w-3.5 h-3.5 fill-current animate-pulse" />
              <span>Previous session restored (paused)</span>
            </div>
            <button
              onClick={() => setShowRecoveryBanner(false)}
              className="p-1 rounded-lg hover:bg-amber-500/20 text-amber-300 transition-colors cursor-pointer"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Top Controls: Mode Switcher & Ghost Focus Button */}
        <div className="w-full flex items-center justify-between gap-2 flex-wrap">
          {/* Mode Segmented Control in Sentence Case */}
          <div className="inline-flex items-center p-1 bg-white/[0.04] border border-white/[0.08] rounded-full gap-0.5">
            <button
              type="button"
              onClick={() => { if (!isStudying) setTimerMode('stopwatch'); }}
              disabled={isStudying}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-full transition-all duration-150 active:scale-[0.98] ${
                timerMode === 'stopwatch'
                  ? 'bg-white/[0.1] text-white shadow-sm border border-white/[0.15]'
                  : 'text-zinc-400 hover:text-zinc-200'
              } ${isStudying ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
            >
              Stopwatch
            </button>
            <button
              type="button"
              onClick={() => { if (!isStudying) setTimerMode('countdown'); }}
              disabled={isStudying}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-full transition-all duration-150 active:scale-[0.98] ${
                timerMode === 'countdown'
                  ? 'bg-white/[0.1] text-white shadow-sm border border-white/[0.15]'
                  : 'text-zinc-400 hover:text-zinc-200'
              } ${isStudying ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
            >
              Countdown
            </button>
            <button
              type="button"
              onClick={() => { if (!isStudying) setTimerMode('pomodoro'); }}
              disabled={isStudying}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-full transition-all duration-150 active:scale-[0.98] ${
                timerMode === 'pomodoro'
                  ? 'bg-white/[0.1] text-white shadow-sm border border-white/[0.15]'
                  : 'text-zinc-400 hover:text-zinc-200'
              } ${isStudying ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
            >
              Pomodoro
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Pomodoro Presets */}
            {timerMode === 'pomodoro' && (
              <div
                className="inline-flex items-center p-0.5 bg-white/[0.04] border border-white/[0.08] rounded-full gap-0.5 animate-in fade-in duration-150"
                title={isStudying ? "Interval presets are locked while session is running" : "Choose interval preset"}
              >
                <button
                  type="button"
                  onClick={() => { if (!isStudying) setPomodoroPreset('25/5'); }}
                  disabled={isStudying}
                  className={`px-2.5 py-1 rounded-full text-xs font-mono transition-colors ${
                    pomodoroPreset === '25/5'
                      ? 'bg-white/[0.1] text-white font-medium border border-white/[0.15]'
                      : 'text-zinc-400 hover:text-zinc-200'
                  } ${isStudying ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                >
                  25/5
                </button>
                <button
                  type="button"
                  onClick={() => { if (!isStudying) setPomodoroPreset('50/10'); }}
                  disabled={isStudying}
                  className={`px-2.5 py-1 rounded-full text-xs font-mono transition-colors ${
                    pomodoroPreset === '50/10'
                      ? 'bg-white/[0.1] text-white font-medium border border-white/[0.15]'
                      : 'text-zinc-400 hover:text-zinc-200'
                  } ${isStudying ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                >
                  50/10
                </button>
              </div>
            )}

            {/* Quiet Ghost Focus Button */}
            <button
              type="button"
              onClick={() => {
                setIsFocusModeOpen(true);
                const el = document.documentElement;
                const lockLandscape = () => {
                  const orientation = window.screen?.orientation as any;
                  if (orientation && orientation.lock) {
                    orientation.lock('landscape').catch(() => {});
                  }
                };
                if (el.requestFullscreen) {
                  el.requestFullscreen().then(lockLandscape).catch(() => {});
                } else if ((el as any).webkitRequestFullscreen) {
                  (el as any).webkitRequestFullscreen();
                  setTimeout(lockLandscape, 100);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/[0.08] hover:border-white/[0.18] bg-transparent hover:bg-white/[0.04] text-zinc-400 hover:text-zinc-200 transition-all duration-150 text-xs font-normal cursor-pointer shrink-0 active:scale-[0.98]"
              title="Fullscreen Focus Mode"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Focus</span>
            </button>
          </div>
        </div>

        {/* Subject warning banner */}
        {subjectWarning && (
          <div className="mt-3 flex items-center justify-between gap-2.5 px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs font-medium backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-150">
            <span>
              {activeSubjects.length === 0 ? 'Please add a subject before starting.' : 'Please select a subject before starting.'}
            </span>
            <button
              onClick={() => setSubjectWarning(false)}
              className="p-1 rounded-lg hover:bg-amber-500/20 text-amber-300 transition-colors cursor-pointer"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Subject Selector & Atmosphere in One Tidy Row */}
        <div className="w-full flex items-center gap-2.5 mt-4 mb-2 relative z-20">
          {/* Subject Dropdown */}
          <div className="relative flex-1 min-w-0">
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
              className={`w-full flex items-center justify-between px-3.5 py-2.5 bg-white/[0.03] hover:bg-white/[0.06] border rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer ${
                subjectWarning
                  ? 'border-amber-500/60 ring-1 ring-amber-500/30'
                  : 'border-white/[0.08]'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 transition-colors"
                  style={{ backgroundColor: selectedSubject ? (selectedSubject?.color || subjectColor) : '#64748B' }}
                />
                <span className={`truncate ${selectedSubject?.name ? "text-white/90" : "text-zinc-400"}`}>
                  {selectedSubject?.name || (activeSubjects.length === 0 ? 'Add a subject' : 'Select a subject')}
                </span>
                {isStudying && (
                  <span className="text-[10px] text-zinc-500 bg-white/[0.05] px-1.5 py-0.5 rounded ml-1 shrink-0">
                    Locked
                  </span>
                )}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0 ml-1" />
            </button>

            {showDropdown && !isStudying && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#0e1015]/95 backdrop-blur-xl border border-white/[0.08] rounded-xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2.5 py-1 text-[10px] uppercase font-mono tracking-wider text-zinc-500 border-b border-white/[0.06] mb-1">
                  Subjects
                </div>
                <div className="max-h-60 overflow-y-auto space-y-0.5">
                  {activeSubjects.map(sub => (
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
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        sub?.id && sub.id === selectedSubjectId
                          ? 'bg-white/[0.08] text-white'
                          : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: sub?.color || '#10B981' }}
                        />
                        <span className="truncate">{sub?.name || 'Untitled subject'}</span>
                      </div>
                      <span className="text-[11px] text-zinc-500 font-mono shrink-0 ml-2">
                        {Math.floor((sub?.targetMinutesPerDay || 60) / 60)}h goal
                      </span>
                    </button>
                  ))}
                </div>

                <div className="pt-1.5 mt-1.5 border-t border-white/[0.06]">
                  <button
                    type="button"
                    onClick={handleOpenSubjectManager}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-colors cursor-pointer"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    <span>Manage subjects</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Atmosphere Selector in Same Row */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setIsAmbientMenuOpen(!isAmbientMenuOpen)}
              className="px-3.5 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] text-zinc-300 hover:text-white text-xs sm:text-sm font-medium flex items-center gap-2 transition-all duration-150 cursor-pointer select-none"
            >
              <Music className={`w-3.5 h-3.5 ${ambientSound !== 'none' ? 'text-[var(--tier-accent)]' : 'text-zinc-400'}`} />
              <span className="hidden sm:inline">
                {ambientSound === 'pinknoise' ? 'Pink Noise' :
                 ambientSound === 'brownnoise' ? 'Brown Noise' :
                 ambientSound === 'whitenoise' ? 'White Noise' :
                 ambientSound === 'rain' ? 'Rain' :
                 ambientSound === 'campfire' ? 'Fireplace' : 'Atmosphere'}
              </span>
              <span className="sm:hidden">Sound</span>
              {ambientSound !== 'none' && <span className="w-1.5 h-1.5 rounded-full bg-[var(--tier-accent)] animate-pulse" />}
              <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${isAmbientMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isAmbientMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsAmbientMenuOpen(false)}
                />
                <div className="absolute top-full right-0 mt-2 z-[100] bg-[#0e1015]/95 backdrop-blur-md border border-white/[0.08] rounded-xl p-2 shadow-xl min-w-[210px] animate-in fade-in duration-150">
                  <div className="flex flex-col gap-0.5">
                    {[
                      { id: 'none', label: 'Silent', icon: <span className="w-3.5 h-3.5 rounded-full bg-zinc-600 mx-0.5" /> },
                      { id: 'pinknoise', label: 'Pink Noise', icon: <Radio className="w-3.5 h-3.5 text-zinc-400" /> },
                      { id: 'brownnoise', label: 'Brown Noise', icon: <Headphones className="w-3.5 h-3.5 text-zinc-400" /> },
                      { id: 'whitenoise', label: 'White Noise', icon: <Radio className="w-3.5 h-3.5 text-zinc-400" /> },
                      { id: 'rain', label: 'Rain', icon: <CloudRain className="w-3.5 h-3.5 text-zinc-400" /> },
                      { id: 'campfire', label: 'Fireplace', icon: <Flame className="w-3.5 h-3.5 text-zinc-400" /> }
                    ].map(option => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleAmbientChange(option.id as any);
                          setTimeout(() => setIsAmbientMenuOpen(false), 50);
                        }}
                        className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                          ambientSound === option.id
                            ? 'bg-white/[0.08] text-white'
                            : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {option.icon}
                          <span>{option.label}</span>
                        </div>
                        {ambientSound === option.id && <Check className="w-3.5 h-3.5 text-[var(--tier-accent)]" />}
                      </button>
                    ))}
                  </div>

                  {ambientSound !== 'none' && (
                    <div className="mt-2 pt-2 border-t border-white/[0.08] flex items-center gap-2.5 px-2">
                      <Volume2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={ambientVolume}
                        onClick={e => e.stopPropagation()}
                        onChange={e => handleVolumeChange(parseFloat(e.target.value))}
                        className="flex-1 accent-[var(--tier-accent)] bg-white/10 rounded-lg cursor-pointer h-1.5"
                      />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Dial Display Area */}
        <div className="relative z-10 flex flex-col items-center justify-center py-4 sm:py-6 my-auto w-full">
          {/* Circular Dial with Soft Accent Glow Behind */}
          <div className="relative flex items-center justify-center mx-auto aspect-square w-64 h-64 sm:w-80 sm:h-80 shrink-0">
            {/* Soft Low-Opacity Accent Glow behind dial */}
            <div
              className="absolute inset-4 rounded-full opacity-[0.07] blur-3xl pointer-events-none transition-opacity duration-500"
              style={{ backgroundColor: 'var(--tier-accent)' }}
            />

            {/* SVG Ring Track & Ticks */}
            <svg viewBox="0 0 300 300" className="absolute inset-0 w-full h-full pointer-events-none select-none">
              {/* 12 Sparse tick marks raised to ~30% white */}
              <g stroke="rgba(255, 255, 255, 0.30)" strokeWidth="1.5" strokeLinecap="round">
                {Array.from({ length: 12 }).map((_, i) => {
                  const angle = (i * 30 - 90) * (Math.PI / 180);
                  const rOuter = 142;
                  const rInner = 133;
                  return (
                    <line
                      key={i}
                      x1={150 + rOuter * Math.cos(angle)}
                      y1={150 + rOuter * Math.sin(angle)}
                      x2={150 + rInner * Math.cos(angle)}
                      y2={150 + rInner * Math.sin(angle)}
                    />
                  );
                })}
              </g>

              {/* 2px Ring Track visible at ~12% white */}
              <circle
                cx="150"
                cy="150"
                r="124"
                fill="none"
                stroke="rgba(255, 255, 255, 0.12)"
                strokeWidth="2"
              />

              {/* Sweeping accent arc */}
              {dialSweepPercent > 0 && (
                <circle
                  cx="150"
                  cy="150"
                  r="124"
                  fill="none"
                  stroke="var(--tier-accent)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 124}
                  strokeDashoffset={2 * Math.PI * 124 - (dialSweepPercent / 100) * (2 * Math.PI * 124)}
                  transform="rotate(-90 150 150)"
                  className="transition-[stroke-dashoffset] duration-300 ease-linear"
                />
              )}
            </svg>

            {/* Center Numerals and Sentence Case Status Line */}
            <div className="relative z-10 flex flex-col items-center justify-center text-center">
              <div className="font-hud font-bold text-white text-5xl sm:text-6xl tabular-nums tracking-tight select-none">
                {timerMode === 'countdown' && !isStudying ? (
                  isEditingCountdown ? (
                    <CountdownEditor
                      initialSeconds={countdownTarget}
                      onSave={(seconds) => { setCountdownTarget(seconds); setIsEditingCountdown(false); }}
                      onCancel={() => setIsEditingCountdown(false)}
                    />
                  ) : (
                    <span
                      onClick={() => setIsEditingCountdown(true)}
                      className="cursor-pointer hover:text-zinc-300 transition-colors pointer-events-auto"
                      title="Click to edit duration"
                    >
                      {displayTime}
                    </span>
                  )
                ) : (
                  <span>{displayTime}</span>
                )}
              </div>

              {/* Sentence-case Status line with small dot */}
              <div className="flex items-center justify-center gap-1.5 text-xs text-zinc-400 font-normal mt-2 select-none">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    !isStudying
                      ? 'bg-zinc-500'
                      : isPaused
                      ? 'bg-amber-400'
                      : 'bg-[var(--tier-accent)] animate-pulse'
                  }`}
                />
                <span>
                  {!isStudying ? 'Ready to start' : isPaused ? 'Paused' : 'Studying'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Focus Block Complete Alert Banner */}
        {pomodoroCompletedPhase === 'work' && (
          <div className="my-3 w-full max-w-sm mx-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-white/[0.1] bg-white/[0.04] text-xs backdrop-blur-md shadow-sm animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-[var(--tier-accent)] shrink-0" />
              <div>
                <div className="font-medium text-white">Focus block complete</div>
                <div className="text-[11px] text-zinc-400">Save session to pause for break, or skip.</div>
              </div>
            </div>
          </div>
        )}

        {/* Break Over Alert Banner */}
        {pomodoroCompletedPhase === 'break' && (
          <div className="my-3 w-full max-w-sm mx-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs backdrop-blur-md shadow-sm animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <Flame className="w-4 h-4 text-amber-300 shrink-0" />
              <div>
                <div className="font-medium text-white">Break finished</div>
                <div className="text-[11px] text-zinc-400">Timer switched back to focus mode.</div>
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

        {/* Action Controls: The Only Filled Accent Element on Screen is the Primary Action */}
        <div className="pt-2 pb-1 flex items-center justify-center relative z-10 w-full">
          {pomodoroCompletedPhase === 'work' ? (
            <div className="flex items-center justify-center gap-2.5 w-full max-w-xs mx-auto">
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
                className="flex-1 py-2.5 px-4 rounded-full text-slate-950 bg-[var(--tier-accent)] hover:brightness-105 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 text-xs sm:text-sm font-medium cursor-pointer shadow-sm disabled:opacity-50"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Coffee className="w-4 h-4" />
                )}
                <span>Save &amp; break</span>
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
                className="py-2.5 px-4 rounded-full border border-white/[0.12] bg-white/[0.04] text-zinc-300 hover:text-white hover:bg-white/[0.08] active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-1.5 text-xs sm:text-sm font-medium cursor-pointer disabled:opacity-50"
              >
                <SkipForward className="w-4 h-4" />
                <span>Skip break</span>
              </button>
            </div>
          ) : timerMode === 'pomodoro' && pomodoroPhase === 'shortBreak' ? (
            isPaused ? (
              <div className="flex items-center justify-center gap-2.5 w-full max-w-xs mx-auto">
                <button
                  onClick={startPomodoroBreak}
                  disabled={isSaving || isRemoteTransitioning}
                  className="flex-1 py-2.5 px-4 rounded-full text-slate-950 bg-[var(--tier-accent)] hover:brightness-105 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 text-xs sm:text-sm font-medium cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start break</span>
                </button>
                <button
                  onClick={handleReset}
                  disabled={isSaving || isRemoteTransitioning}
                  className="py-2.5 px-4 rounded-full border border-white/[0.12] bg-white/[0.04] text-zinc-300 hover:text-white hover:bg-white/[0.08] active:scale-[0.98] transition-all duration-150 text-xs sm:text-sm font-medium cursor-pointer disabled:opacity-50"
                >
                  <span>Skip break</span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleReset}
                disabled={isSaving || isRemoteTransitioning}
                className="w-full max-w-[220px] mx-auto py-2.5 px-5 rounded-full border border-white/[0.12] bg-white/[0.04] text-zinc-300 hover:text-white hover:bg-white/[0.08] active:scale-[0.98] transition-all duration-150 text-xs sm:text-sm font-medium cursor-pointer disabled:opacity-50"
              >
                <span>End break</span>
              </button>
            )
          ) : pomodoroCompletedPhase === 'break' ? (
            <button
              onClick={() => {
                setPomodoroCompletedPhase(null);
                handleStartSession();
              }}
              disabled={isSaving || isRemoteTransitioning}
              className="w-full max-w-[240px] mx-auto py-3 px-6 rounded-full font-medium text-sm text-slate-950 bg-[var(--tier-accent)] hover:brightness-105 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(var(--tier-accent-rgb),0.25)] cursor-pointer"
            >
              <Flame className="w-4 h-4 fill-current" />
              <span>Start session</span>
            </button>
          ) : !isStudying ? (
            /* Idle State: Centered pill button at content width (220-260px) */
            <button
              onClick={handleStartSession}
              disabled={!selectedSubject?.id || isSaving || isRemoteTransitioning}
              className={`w-full max-w-[240px] mx-auto py-3 px-6 rounded-full font-medium text-sm text-slate-950 bg-[var(--tier-accent)] hover:brightness-105 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(var(--tier-accent-rgb),0.25)] ${
                !selectedSubject?.id || isRemoteTransitioning
                  ? 'opacity-40 cursor-not-allowed shadow-none hover:brightness-100'
                  : 'cursor-pointer'
              }`}
              title={!selectedSubject?.id ? 'Please select a subject before starting the timer' : 'Start session'}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start session</span>
            </button>
          ) : !isPaused ? (
            /* Running State: Pause and Stop & Save */
            <div className="flex items-center justify-center gap-3 w-full max-w-xs mx-auto">
              <button
                onClick={handlePause}
                disabled={isSaving || isRemoteTransitioning}
                className="flex-1 py-2.5 px-5 rounded-full border border-white/[0.12] bg-white/[0.04] text-zinc-200 hover:bg-white/[0.08] active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 text-xs sm:text-sm font-medium cursor-pointer disabled:opacity-50"
              >
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </button>
              <button
                onClick={handleStopAndSave}
                disabled={isSaving || isRemoteTransitioning}
                className="flex-1 py-2.5 px-5 rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 text-xs sm:text-sm font-medium cursor-pointer disabled:opacity-50"
                title={isSaving ? "Saving session..." : "Stop and save session"}
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-rose-300 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Square className="w-4 h-4 fill-current" />
                )}
                <span>Stop &amp; save</span>
              </button>
            </div>
          ) : (
            /* Paused State: Resume, Stop & Save, Reset */
            <div className="flex items-center justify-center gap-2.5 w-full max-w-sm mx-auto">
              <button
                onClick={handleResume}
                disabled={isSaving || isRemoteTransitioning}
                className="flex-1 py-2.5 px-5 rounded-full text-slate-950 bg-[var(--tier-accent)] hover:brightness-105 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 text-xs sm:text-sm font-medium cursor-pointer shadow-sm disabled:opacity-50"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Resume</span>
              </button>
              <button
                onClick={handleStopAndSave}
                disabled={isSaving || isRemoteTransitioning}
                className="flex-1 py-2.5 px-5 rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 text-xs sm:text-sm font-medium cursor-pointer disabled:opacity-50"
                title={isSaving ? "Saving session..." : "Stop and save session"}
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-rose-300 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Square className="w-4 h-4 fill-current" />
                )}
                <span>Stop &amp; save</span>
              </button>
              <button
                onClick={handleReset}
                disabled={isSaving || isRemoteTransitioning}
                className="p-2.5 rounded-full border border-white/[0.08] bg-white/[0.03] text-zinc-400 hover:text-white hover:bg-white/[0.08] active:scale-[0.98] transition-all duration-150 cursor-pointer disabled:opacity-50"
                title="Reset timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {isEditingCountdown && (
        <CountdownEditor
          initialSeconds={countdownTarget}
          onSave={(seconds) => { setCountdownTarget(seconds); setIsEditingCountdown(false); }}
          onCancel={() => setIsEditingCountdown(false)}
        />
      )}
    </div>
  );
}

