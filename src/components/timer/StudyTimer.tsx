'use client';

import React, { useState, useEffect } from 'react';
import { useStudy } from '../../context/StudyContext';
import { useAuth } from '../../context/AuthContext';
import { SubjectManagerModal } from './SubjectManagerModal';
import { formatSeconds, formatHoursAndMins } from '../../lib/utils';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Maximize2,
  FolderPlus,
  Flame,
  FileText,
  Clock,
  Sparkles,
  ChevronDown,
  MessageCircle,
  Check,
  CheckSquare,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { soundFx } from '../../lib/audio';
import confetti from 'canvas-confetti';

const EMPTY_STATE_QUOTES = [
  'Every long streak starts with one session.',
  'Future you will thank you for starting now.',
  "Small steps. Press Start whenever you're ready.",
];

export function StudyTimer() {
  const { user } = useAuth();
  const {
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
    currentNotes,
    setCurrentNotes,
    setIsFocusModeOpen,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    resetTimer,
    sessions,
    todos,
    addTodo,
    toggleTodo,
    deleteTodo,
  } = useStudy();

  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [randomQuoteIndex, setRandomQuoteIndex] = useState(0);
  const [todoInput, setTodoInput] = useState('');

  const completedTodosCount = todos.filter(t => t.completed).length;
  const totalTodosCount = todos.length;
  const todoProgressPercent = totalTodosCount > 0 ? Math.round((completedTodosCount / totalTodosCount) * 100) : 0;

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!todoInput.trim()) return;

    addTodo({
      title: todoInput.trim(),
      date: new Date().toISOString().slice(0, 10),
      completed: false,
      priority: 'medium',
    });

    setTodoInput('');
  };

  const handleToggleTodo = (id: string, currentlyCompleted: boolean) => {
    if (!currentlyCompleted) {
      soundFx.playReactionPop();
      confetti({
        particleCount: 25,
        spread: 45,
        origin: { y: 0.6 },
      });
    }
    toggleTodo(id);
  };

  useEffect(() => {
    setRandomQuoteIndex(Math.floor(Math.random() * EMPTY_STATE_QUOTES.length));
  }, []);

  // Time calculations
  let displayTime = formatSeconds(elapsedSeconds);
  let progressPercent = 0;

  if (timerMode === 'pomodoro') {
    const target = pomodoroPhase === 'work' ? pomodoroWorkDuration : pomodoroBreakDuration;
    const remaining = Math.max(0, target - elapsedSeconds);
    displayTime = formatSeconds(remaining);
    progressPercent = Math.min(100, (elapsedSeconds / target) * 100);
  } else {
    const subjectTargetSeconds = (selectedSubject?.targetMinutesPerDay || 120) * 60;
    const subjectTodaySeconds = sessions
      .filter(s => s.subjectId === selectedSubject?.id && s.startTime.startsWith(new Date().toISOString().slice(0, 10)))
      .reduce((sum, s) => sum + s.durationSeconds, 0) + (isStudying ? elapsedSeconds : 0);

    progressPercent = Math.min(100, (subjectTodaySeconds / subjectTargetSeconds) * 100);
  }

  // Muted teal-gray (#5A6B6A) for General Focus, reserving vibrant emerald solely for primary actions
  const subjectColor =
    selectedSubject?.name === 'General Focus' && (selectedSubject?.color === '#3B82F6' || !selectedSubject?.color)
      ? '#5A6B6A'
      : selectedSubject?.color || '#5A6B6A';

  // Calculate today's subject study time
  const todaySubjectSeconds = sessions
    .filter(s => s.subjectId === selectedSubject?.id && s.startTime.startsWith(new Date().toISOString().slice(0, 10)))
    .reduce((sum, s) => sum + s.durationSeconds, 0) + (isStudying ? elapsedSeconds : 0);

  // Today's total focus time across all subjects
  const todayTotalSeconds = sessions
    .filter(s => s.startTime.startsWith(new Date().toISOString().slice(0, 10)))
    .reduce((sum, s) => sum + s.durationSeconds, 0) + (isStudying ? elapsedSeconds : 0);

  // Today's completed sessions count
  const todaySessionsCount = sessions.filter(s =>
    s.startTime.startsWith(new Date().toISOString().slice(0, 10))
  ).length;

  // Recent 4 sessions
  const recentSessions = [...sessions]
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    .slice(0, 4);

  // Dynamic Motivation & Boost Messaging
  const streak = user?.streakDays || 0;
  let primaryBoostMessage = '';
  let secondaryBoostMessage = '';

  // 1. Streak-based evaluation
  if (streak >= 30) {
    primaryBoostMessage = "🔥 30-day streak! You've basically made this a lifestyle.";
  } else if (streak >= 14) {
    primaryBoostMessage = "🔥 Two weeks strong — this is becoming a habit now.";
  } else if (streak >= 7) {
    primaryBoostMessage = "🔥 7-day streak! Consistency is compounding.";
  } else if (streak >= 3) {
    primaryBoostMessage = `🔥 You're on a ${streak}-day streak — don't break the chain.`;
  } else if (streak === 2) {
    primaryBoostMessage = "🔥 You're on a 2-day streak — don't break the chain.";
  } else if (streak === 1) {
    primaryBoostMessage = "🔥 Day 1 logged. Come back tomorrow to start a streak.";
  }

  // 2. Session-length based evaluation
  let sessionMessage = '';
  if (todayTotalSeconds >= 4 * 3600) {
    sessionMessage = "4+ hours today. Seriously — consider a break.";
  } else if (todayTotalSeconds >= 2 * 3600) {
    sessionMessage = "2 hours of deep focus already. Great pace.";
  } else if (todayTotalSeconds >= 25 * 60) {
    sessionMessage = "Nice, you completed a full focus block today.";
  }

  // Priority & secondary combining logic
  if (primaryBoostMessage) {
    if (sessionMessage) {
      secondaryBoostMessage = sessionMessage;
    }
  } else if (sessionMessage) {
    primaryBoostMessage = sessionMessage;
  } else if (streak === 0 && todayTotalSeconds === 0 && todaySessionsCount === 0) {
    // 3. Empty state (streak 0 AND totalFocusToday 0 AND sessions 0)
    primaryBoostMessage = EMPTY_STATE_QUOTES[randomQuoteIndex];
  } else {
    // Fallback when streak === 0
    primaryBoostMessage = "No pressure — just hit Start and your streak begins.";
  }

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
        <div className="relative rounded-3xl bg-neutral-900/50 border border-white/[0.08] backdrop-blur-2xl p-6 sm:p-10 shadow-2xl overflow-hidden">
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
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
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
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
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
            <div className="relative flex items-center justify-center">
              {/* Outer Animated Ring */}
              <div
                className={`w-64 h-64 sm:w-80 sm:h-80 rounded-full border-4 flex items-center justify-center transition-all duration-700 ${
                  isStudying && !isPaused ? 'shadow-2xl' : ''
                }`}
                style={{
                  borderColor: `${subjectColor}40`,
                  boxShadow: isStudying && !isPaused ? `0 0 50px ${subjectColor}25` : 'none',
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

            {/* Action Buttons: Emerald reserved exclusively for Primary Action (Start/Resume) */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 relative z-10">
              {!isStudying ? (
                <button
                  onClick={() => startTimer()}
                  className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm transition-all shadow-xl shadow-emerald-500/25 flex items-center gap-2.5 active:scale-95 hover:scale-[1.02] cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>Start Studying</span>
                </button>
              ) : (
                <>
                  {isPaused ? (
                    <button
                      onClick={resumeTimer}
                      className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-emerald-500/25 flex items-center gap-2 active:scale-95 cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>Resume</span>
                    </button>
                  ) : (
                    <button
                      onClick={pauseTimer}
                      className="px-6 py-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-amber-300 font-bold text-sm border border-amber-500/30 transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
                    >
                      <Pause className="w-4 h-4" />
                      <span>Pause</span>
                    </button>
                  )}

                  <button
                    onClick={() => stopTimer()}
                    className="px-6 py-3 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold text-sm transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
                    title="Stop and save session"
                  >
                    <Square className="w-4 h-4 fill-current" />
                    <span>Stop & Save</span>
                  </button>

                  <button
                    onClick={resetTimer}
                    className="p-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-white/[0.08] text-neutral-400 hover:text-white transition-colors active:scale-95 cursor-pointer"
                    title="Reset Timer"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Current Session Reflection Notes Input */}
          <div className="relative z-10 mt-6 pt-6 border-t border-white/[0.08]">
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400 mb-2">
              <FileText className="w-3.5 h-3.5 text-[#8FA3A1]" />
              <span>Session Notes & Key Learnings (Optional)</span>
            </div>
            <input
              type="text"
              value={currentNotes}
              onChange={e => setCurrentNotes(e.target.value)}
              placeholder="e.g. Solved problem set 3, learned dynamic programming memoization..."
              className="w-full px-4 py-2.5 bg-black/40 border border-white/[0.08] rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#5A6B6A] transition-colors font-mono"
            />
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
        {/* 1. Todo List Card (Moved to the top) */}
        <div className="rounded-3xl bg-neutral-900/50 border border-white/[0.08] backdrop-blur-xl p-5 shadow-xl space-y-3.5">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-[#8FA3A1]" />
              <span className="text-xs font-bold text-white tracking-tight uppercase">Todo List</span>
            </div>
            <span className="text-[11px] text-neutral-400 font-medium font-mono">
              <span className="text-emerald-400 font-bold">{completedTodosCount}</span> / {totalTodosCount} completed
            </span>
          </div>

          {/* Minimal Progress Bar */}
          {totalTodosCount > 0 && (
            <div className="h-1.5 w-full rounded-full bg-black/50 overflow-hidden border border-white/[0.05]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 shadow-sm shadow-emerald-500/20"
                style={{ width: `${todoProgressPercent}%` }}
              />
            </div>
          )}

          {/* Simple Add Task Input */}
          <form onSubmit={handleAddTodo} className="flex items-center gap-2">
            <input
              type="text"
              value={todoInput}
              onChange={e => setTodoInput(e.target.value)}
              placeholder="Add a new task... (press Enter)"
              className="w-full px-3.5 py-2.5 bg-black/40 border border-white/[0.08] rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#5A6B6A] transition-colors"
            />
          </form>

          {/* Todo List / Empty State */}
          {todos.length === 0 ? (
            <div className="py-7 text-center rounded-2xl border border-dashed border-white/[0.08] bg-black/20 px-3">
              <CheckCircle2 className="w-8 h-8 text-neutral-600 mx-auto mb-1.5" />
              <h3 className="text-xs font-bold text-neutral-300">Your checklist is empty</h3>
              <p className="text-[11px] text-neutral-500 mt-1">
                Type a task above and press Enter to add it to your daily plan.
              </p>
            </div>
          ) : (
            <div className="max-h-56 overflow-y-auto space-y-2 pr-0.5">
              {todos.map(task => (
                <div
                  key={task.id}
                  className={`group flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                    task.completed
                      ? 'bg-black/20 border-white/[0.04] opacity-70'
                      : 'bg-black/30 border-white/[0.06] hover:border-white/[0.1]'
                  }`}
                >
                  <div
                    onClick={() => handleToggleTodo(task.id, task.completed)}
                    className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer select-none"
                  >
                    <button
                      type="button"
                      aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
                      className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all flex-shrink-0 ${
                        task.completed
                          ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-sm'
                          : 'border-neutral-600 hover:border-emerald-400 bg-neutral-900/80 group-hover:scale-105'
                      }`}
                    >
                      {task.completed && <Check className="w-3 h-3 stroke-[3]" />}
                    </button>
                    <span
                      className={`text-xs transition-all truncate ${
                        task.completed ? 'line-through text-neutral-500' : 'text-neutral-200 font-medium'
                      }`}
                    >
                      {task.title}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteTodo(task.id)}
                    title="Delete task"
                    className="p-1 text-neutral-500 hover:text-rose-400 rounded-md hover:bg-rose-500/10 transition-colors ml-1.5 opacity-0 group-hover:opacity-100 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Footer: Clear completed */}
          {completedTodosCount > 0 && (
            <div className="pt-1 flex justify-end">
              <button
                type="button"
                onClick={() => todos.filter(t => t.completed).forEach(t => deleteTodo(t.id))}
                className="text-[11px] text-neutral-500 hover:text-rose-400 transition-colors cursor-pointer"
              >
                Clear completed ({completedTodosCount})
              </button>
            </div>
          )}
        </div>

        {/* 2. Daily Overview (Moved below Todo List) */}
        <div className="rounded-3xl bg-neutral-900/50 border border-white/[0.08] backdrop-blur-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#8FA3A1]" />
              <span className="text-xs font-bold text-white tracking-tight uppercase">Daily Overview</span>
            </div>
            <span className="text-[11px] text-neutral-400 font-medium font-mono">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-2xl bg-black/40 border border-white/[0.06] space-y-1">
              <div className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Total Focus</div>
              <div className="text-lg font-black text-white font-mono tabular-nums tracking-tight">
                {formatHoursAndMins(todayTotalSeconds)}
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-black/40 border border-white/[0.06] space-y-1">
              <div className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Sessions</div>
              <div className="text-lg font-black text-white font-mono tabular-nums tracking-tight">
                {todaySessionsCount}
              </div>
            </div>
          </div>

          <div className="pt-1 flex items-center justify-between text-xs text-neutral-400">
            <span className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-[#8FA3A1] fill-[#5A6B6A]" />
              <span>Streak</span>
            </span>
            <span className="font-mono font-bold text-white tabular-nums">
              {user.streakDays > 0 ? `${user.streakDays} days` : 'Start today'}
            </span>
          </div>
        </div>

        {/* 3. Today's Boost / Motivation Card (Stays last) */}
        <div className="rounded-3xl bg-neutral-900/50 border border-white/[0.08] backdrop-blur-xl p-5 shadow-xl space-y-3">
          <div className="flex items-center gap-2 pb-2.5 border-b border-white/[0.08]">
            <MessageCircle className="w-4 h-4 text-[#8FA3A1]" />
            <span className="text-xs font-bold text-white tracking-tight uppercase">Today's Boost</span>
          </div>

          <div className="min-h-[40px] flex flex-col justify-center">
            <p className="text-[15px] font-medium text-neutral-300 leading-snug">
              {primaryBoostMessage}
            </p>
            {secondaryBoostMessage && (
              <p className="text-xs text-neutral-400 mt-1 leading-normal">
                {secondaryBoostMessage}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
