'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useStudy } from '../../context/StudyContext';
import { useAuth } from '../../context/AuthContext';
import { DailyTodoList } from '../todo/DailyTodoList';
import { SubjectManagerModal } from './SubjectManagerModal';
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
} from 'lucide-react';
import { soundFx } from '../../lib/audio';
import confetti from 'canvas-confetti';

const EMPTY_STATE_QUOTES = [
  'Every long streak starts with one session.',
  'Future you will thank you for starting now.',
  "Small steps. Press Start whenever you're ready.",
];

export function StudyTimer() {
  const { user, isLoading } = useAuth();
  const {
    subjects,
    selectedSubject,
    selectedSubjectId,
    setSelectedSubjectId,
    timerMode,
    setTimerMode,
    isStudying,
    isPaused,
    isRunning,
    elapsedSeconds,
    pomodoroPhase,
    pomodoroWorkDuration,
    pomodoroBreakDuration,
    setIsFocusModeOpen,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    resetTimer,
    sessions,
    refetchSessions,
  } = useStudy();

  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [overviewView, setOverviewView] = useState<'today' | 'yesterday'>('today');

  // Lock the motivation quote in useState on initial load so it NEVER changes while timer is running
  const [lockedEmptyQuote] = useState(() => {
    return EMPTY_STATE_QUOTES[Math.floor(Math.random() * EMPTY_STATE_QUOTES.length)];
  });

  // Streamlined control handlers cleanly controlling synchronized StudyContext timer engine
  const handleStartSession = useCallback(() => {
    startTimer();
  }, [startTimer]);

  const handlePause = useCallback(() => {
    pauseTimer();
  }, [pauseTimer]);

  const handleResume = useCallback(() => {
    resumeTimer();
  }, [resumeTimer]);

  const handleReset = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  const handleStopAndSave = useCallback(async () => {
    await stopTimer();
  }, [stopTimer]);

  useEffect(() => {
    refetchSessions();
  }, [refetchSessions]);

  // Local browser timezone day bounds
  const startOfToday = useMemo(() => getLocalStartOfDay(new Date()), []);
  const endOfToday = useMemo(() => getLocalEndOfDay(new Date()), []);
  const { startOfDay: startOfYesterday, endOfDay: endOfYesterday } = useMemo(() => getYesterdayRange(), []);

  // Filtered sessions for Today (browser-local timezone)
  const todaySessions = useMemo(() => {
    return sessions.filter(s => {
      const t = new Date(s.startTime).getTime();
      return t >= startOfToday.getTime() && t <= endOfToday.getTime();
    });
  }, [sessions, startOfToday, endOfToday]);

  // Filtered sessions for Yesterday (browser-local timezone)
  const yesterdaySessions = useMemo(() => {
    return sessions.filter(s => {
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
    return todaySessions
      .filter(s => s.subjectId === selectedSubject?.id)
      .reduce((sum, s) => sum + s.durationSeconds, 0);
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
    const subjectTargetSeconds = (selectedSubject?.targetMinutesPerDay || 120) * 60;
    progressPercent = Math.min(100, ((todaySubjectSeconds + elapsedSeconds) / subjectTargetSeconds) * 100);
  }

  // Muted teal-gray (#5A6B6A) for General Focus, reserving vibrant emerald solely for primary actions
  const subjectColor =
    selectedSubject?.name === 'General Focus' && (selectedSubject?.color === '#3B82F6' || !selectedSubject?.color)
      ? '#5A6B6A'
      : selectedSubject?.color || '#5A6B6A';

  // Recent 4 sessions
  const recentSessions = [...sessions]
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
    <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Subject Manager Modal */}
      <SubjectManagerModal
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
      />

      {/* Main Left Column (Timer & Subject Goal Progress) */}
      <div className="lg:col-span-8 space-y-6">
        {/* Main Timer Glass Card */}
        <div className="relative rounded-3xl bg-neutral-900/50 border border-white/[0.08] hover:border-emerald-500/25 backdrop-blur-2xl p-6 sm:p-10 shadow-2xl overflow-hidden transition-all">
          {/* Subtle Ambient Glow */}
          <div
            className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-[100px] opacity-15 pointer-events-none transition-all duration-700"
            style={{ backgroundColor: subjectColor }}
          />
          <div
            className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full blur-[100px] opacity-10 pointer-events-none transition-all duration-700"
            style={{ backgroundColor: subjectColor }}
          />

          {/* Top Controls: Mode Switcher & Focus Mode Button */}
          <div className="flex flex-wrap items-center justify-between gap-4 relative z-10 pb-6 border-b border-white/[0.08]">
            {/* Mode Pill Toggle */}
            <div className="flex items-center gap-1 p-1 rounded-2xl bg-black/60 border border-white/[0.08]">
              <button
                onClick={() => { if (!isStudying) setTimerMode('stopwatch'); }}
                disabled={isStudying}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                  timerMode === 'stopwatch'
                    ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30'
                    : 'text-neutral-400 hover:text-white'
                } disabled:cursor-not-allowed`}
              >
                Stopwatch
              </button>
              <button
                onClick={() => { if (!isStudying) setTimerMode('pomodoro'); }}
                disabled={isStudying}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                  timerMode === 'pomodoro'
                    ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30'
                    : 'text-neutral-400 hover:text-white'
                } disabled:cursor-not-allowed`}
              >
                Pomodoro (25/5)
              </button>
            </div>

            {/* High-Contrast Semi-Solid Fullscreen Focus Mode Button */}
            <button
              onClick={() => setIsFocusModeOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-300 text-xs font-bold transition-all shadow-md shadow-emerald-500/10 active:scale-95 cursor-pointer"
            >
              <Maximize2 className="w-4 h-4 text-emerald-400" />
              <span>Fullscreen Focus Mode</span>
            </button>
          </div>

          {/* Subject Selection Bar */}
          <div className="relative z-20 my-6 flex flex-wrap items-center justify-between gap-3">
            {/* Subject Dropdown */}
            <div className="relative flex-1 min-w-[240px]">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                disabled={isStudying}
                className="w-full flex items-center justify-between px-4 py-3 bg-black/40 hover:bg-black/60 border border-white/[0.08] rounded-2xl text-sm font-semibold transition-all disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: subjectColor }}
                  />
                  <span className="text-white font-bold tracking-tight">
                    {selectedSubject?.name || 'General Focus'}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-neutral-400" />
              </button>

              {showDropdown && !isStudying && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#0d0e12] border border-white/[0.08] rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="max-h-60 overflow-y-auto space-y-1">
                    {subjects.map(sub => {
                      const itemColor =
                        sub.name === 'General Focus' && (sub.color === '#3B82F6' || !sub.color)
                          ? '#5A6B6A'
                          : sub.color || '#5A6B6A';

                      return (
                        <button
                          key={sub.id}
                          onClick={() => {
                            setSelectedSubjectId(sub.id);
                            setShowDropdown(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            sub.id === selectedSubjectId
                              ? 'bg-white/[0.08] text-white'
                              : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: itemColor }}
                            />
                            <span>{sub.name}</span>
                          </div>
                          <span className="text-[10px] text-neutral-400 font-mono">
                            {Math.floor((sub.targetMinutesPerDay || 60) / 60)}h goal
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-2 mt-2 border-t border-white/[0.08]">
                    <button
                      onClick={() => {
                        setIsSubjectModalOpen(true);
                        setShowDropdown(false);
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold text-[#8FA3A1] hover:bg-white/[0.06] transition-colors cursor-pointer"
                    >
                      <FolderPlus className="w-3.5 h-3.5 text-[#8FA3A1]" />
                      <span>Manage / Add Subjects</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Manage Subjects Quick Button (Muted Teal-Gray Icon) */}
            <button
              onClick={() => setIsSubjectModalOpen(true)}
              className="p-3.5 rounded-2xl bg-neutral-900/70 hover:bg-neutral-800 border border-white/[0.08] text-neutral-300 hover:text-white transition-colors flex items-center gap-2 text-xs font-semibold active:scale-95 cursor-pointer shadow-sm"
              title="Edit Subjects"
            >
              <FolderPlus className="w-4 h-4 text-[#8FA3A1]" />
              <span className="hidden sm:inline">Edit Subjects</span>
            </button>
          </div>

          {/* Center Timer Circular Display */}
          <div className="relative z-10 flex flex-col items-center justify-center py-6">
            <div className="relative flex items-center justify-center p-2">
              {/* Subtle Emerald Outer Halo / Gradient Rim */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-b from-emerald-500/20 via-emerald-500/5 to-transparent blur-lg pointer-events-none" />
              <div className="absolute inset-1 sm:inset-1.5 rounded-full border border-emerald-500/25 pointer-events-none" />

              {/* Outer Animated Ring */}
              <div
                className={`w-64 h-64 sm:w-80 sm:h-80 rounded-full border-4 flex items-center justify-center transition-all duration-700 relative z-10 ${
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
                  className="w-52 h-52 sm:w-68 sm:h-68 rounded-full bg-black/60 border border-white/[0.08] flex flex-col items-center justify-center p-6 text-center shadow-inner"
                  style={{
                    borderColor: isStudying ? `${subjectColor}60` : undefined,
                  }}
                >
                  {/* Pomodoro Phase / Subject Pill */}
                  <div
                    className="mb-2 text-[11px] font-bold px-3 py-0.5 rounded-full border transition-colors"
                    style={{
                      backgroundColor: `${subjectColor}15`,
                      borderColor: `${subjectColor}40`,
                      color: subjectColor,
                    }}
                  >
                    {timerMode === 'pomodoro'
                      ? pomodoroPhase === 'work'
                        ? '🔥 Focus Sprint (25m)'
                        : '☕ Short Break (5m)'
                      : selectedSubject?.name || 'General Focus'}
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
                  <div className="mt-2 flex items-center gap-2 text-xs text-neutral-400">
                    <span
                      className={`w-2 h-2 rounded-full transition-all ${
                        isStudying
                          ? isPaused
                            ? 'bg-amber-400'
                            : 'bg-emerald-400 animate-pulse'
                          : 'bg-amber-200/90 shadow-[0_0_8px_rgba(251,191,36,0.3)] animate-[pulse_2s_ease-in-out_infinite]'
                      }`}
                    />
                    <span>
                      {isStudying ? (isPaused ? 'Timer Paused' : 'Studying Live') : 'Ready to Start'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons: Streamlined 3-state controls without redundant Complete button */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 relative z-10">
              {!isStudying ? (
                /* 1. IDLE State: One primary button */
                <button
                  onClick={handleStartSession}
                  className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm transition-all shadow-xl shadow-emerald-500/25 flex items-center gap-2.5 active:scale-95 hover:scale-[1.02] cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>Start Session</span>
                </button>
              ) : !isPaused ? (
                /* 2. RUNNING State: Two buttons (Pause & Stop & Save) */
                <>
                  <button
                    onClick={handlePause}
                    className="px-6 py-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-amber-300 font-bold text-sm border border-amber-500/30 transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
                  >
                    <Pause className="w-4 h-4" />
                    <span>Pause</span>
                  </button>

                  <button
                    onClick={handleStopAndSave}
                    className="px-6 py-3 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold text-sm transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
                    title="Stop and save session"
                  >
                    <Square className="w-4 h-4 fill-current" />
                    <span>Stop & Save</span>
                  </button>
                </>
              ) : (
                /* 3. PAUSED State: Two buttons (Resume & Stop & Save) plus subtle Reset icon */
                <>
                  <button
                    onClick={handleResume}
                    className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-emerald-500/25 flex items-center gap-2 active:scale-95 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Resume</span>
                  </button>

                  <button
                    onClick={handleStopAndSave}
                    className="px-6 py-3 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold text-sm transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
                    title="Stop and save session"
                  >
                    <Square className="w-4 h-4 fill-current" />
                    <span>Stop & Save</span>
                  </button>

                  <button
                    onClick={handleReset}
                    className="p-3 rounded-2xl bg-neutral-900/80 hover:bg-neutral-800 border border-white/[0.08] text-neutral-400 hover:text-white transition-colors active:scale-95 cursor-pointer"
                    title="Reset Timer"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Subject Today's Progress Card */}
        <div className="rounded-2xl bg-neutral-900/50 border border-white/[0.08] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-md"
              style={{ backgroundColor: `${subjectColor}25`, borderColor: subjectColor, borderWidth: 1 }}
            >
              <Clock className="w-5 h-5" style={{ color: subjectColor }} />
            </div>
            <div>
              <div className="text-xs text-neutral-400">Today on {selectedSubject?.name || 'General Focus'}</div>
              <div className="text-base font-bold text-white flex items-center gap-2">
                <span className="font-mono tabular-nums">{formatHoursAndMins(todaySubjectSeconds)}</span>
                <span className="text-xs text-neutral-500 font-normal font-mono">
                  / {Math.floor((selectedSubject?.targetMinutesPerDay || 120) / 60)}h target
                </span>
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

      {/* Right Secondary Column (Todo List, Daily Overview & Today's Boost - Home Page Sidebar) */}
      <div className="lg:col-span-4 space-y-6">
        {/* 1. Todo List Card - Google Notes / Keep Checklist */}
        <DailyTodoList />

        {/* 2. Daily Overview (Electric Violet / Indigo Accent) */}
        <div className="rounded-3xl bg-neutral-900/50 border border-white/[0.08] hover:border-violet-500/30 backdrop-blur-xl p-5 shadow-xl space-y-4 transition-all relative overflow-hidden group">
          {/* Subtle Ambient Violet Glow */}
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-violet-600/10 blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between pb-3 border-b border-violet-500/15 relative z-10">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span className="text-xs font-bold text-violet-200 tracking-tight uppercase">Daily Overview</span>
            </div>
            {/* Today vs Yesterday Toggle */}
            <div className="flex items-center gap-1 p-0.5 rounded-xl bg-violet-950/50 border border-violet-800/40 text-[10px]">
              <button
                onClick={() => setOverviewView('today')}
                className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                  overviewView === 'today'
                    ? 'bg-violet-500 text-slate-950 shadow-sm'
                    : 'text-violet-300/70 hover:text-white'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setOverviewView('yesterday')}
                className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                  overviewView === 'yesterday'
                    ? 'bg-violet-500 text-slate-950 shadow-sm'
                    : 'text-violet-300/70 hover:text-white'
                }`}
              >
                Yesterday
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-violet-300/70 font-medium font-mono relative z-10">
            <span>{overviewView === 'today' ? "Today's Activity" : "Yesterday's Activity"}</span>
            <span>
              {overviewView === 'today'
                ? new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                : new Date(Date.now() - 86400000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 relative z-10">
            <div className="p-3 rounded-2xl bg-violet-950/20 border border-violet-800/30 hover:border-violet-700/40 transition-colors space-y-1">
              <div className="text-[10px] uppercase font-bold tracking-wider text-violet-300/70">Total Focus</div>
              <div className="text-lg font-black text-violet-100 font-mono tabular-nums tracking-tight">
                {formatHoursAndMins(overviewView === 'today' ? overviewTodaySeconds : yesterdayTotalSeconds)}
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-violet-950/20 border border-violet-800/30 hover:border-violet-700/40 transition-colors space-y-1">
              <div className="text-[10px] uppercase font-bold tracking-wider text-violet-300/70">Sessions</div>
              <div className="text-lg font-black text-violet-100 font-mono tabular-nums tracking-tight">
                {overviewView === 'today' ? overviewTodaySessionsCount : yesterdaySessionsCount}
              </div>
            </div>
          </div>

          <div className="pt-1 flex items-center justify-between text-xs relative z-10">
            <span className="flex items-center gap-1.5 text-neutral-400">
              <Flame className="w-3.5 h-3.5 text-[#f97316] fill-[#f97316]" />
              <span className="font-medium">Streak</span>
            </span>
            {(user?.streakDays ?? 0) > 0 ? (
              <span className="px-2 py-0.5 rounded-full bg-orange-950/40 border border-orange-700/40 text-[#f97316] font-mono font-bold text-xs tabular-nums shadow-sm shadow-orange-950/30">
                {user?.streakDays ?? 0} {(user?.streakDays ?? 0) === 1 ? 'day' : 'days'}
              </span>
            ) : (
              <span className="font-mono font-bold text-neutral-400 tabular-nums">Start today</span>
            )}
          </div>
        </div>

        {/* 3. Today's Boost / Motivation Card (Solar Amber / Warm Gold Accent) */}
        <div className="rounded-3xl bg-amber-950/10 border border-amber-500/20 hover:border-amber-500/35 backdrop-blur-xl p-5 shadow-xl space-y-3 transition-all relative overflow-hidden group">
          {/* Subtle Ambient Amber Glow */}
          <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

          <div className="flex items-center gap-2 pb-2.5 border-b border-amber-500/15 relative z-10">
            <MessageCircle className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-amber-300 tracking-tight uppercase">Today's Boost</span>
          </div>

          <div className="min-h-[40px] flex flex-col justify-center relative z-10">
            <p className="text-[15px] font-semibold text-amber-100/95 leading-snug tracking-tight drop-shadow-sm">
              {primaryBoostMessage}
            </p>
            {secondaryBoostMessage && (
              <p className="text-xs text-amber-300/80 mt-1.5 leading-normal font-medium">
                {secondaryBoostMessage}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
