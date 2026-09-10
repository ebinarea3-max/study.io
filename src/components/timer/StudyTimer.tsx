'use client';

import React, { useState } from 'react';
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
  CheckCircle,
  FileText,
  Clock,
  Sparkles,
  ChevronDown,
} from 'lucide-react';

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
  } = useStudy();

  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Time calculations
  let displayTime = formatSeconds(elapsedSeconds);
  let progressPercent = 0;

  if (timerMode === 'pomodoro') {
    const target = pomodoroPhase === 'work' ? pomodoroWorkDuration : pomodoroBreakDuration;
    const remaining = Math.max(0, target - elapsedSeconds);
    displayTime = formatSeconds(remaining);
    progressPercent = Math.min(100, (elapsedSeconds / target) * 100);
  } else {
    // Progress towards daily target for this subject
    const subjectTargetSeconds = (selectedSubject?.targetMinutesPerDay || 120) * 60;
    const subjectTodaySeconds = sessions
      .filter(s => s.subjectId === selectedSubject?.id && s.startTime.startsWith(new Date().toISOString().slice(0, 10)))
      .reduce((sum, s) => sum + s.durationSeconds, 0) + (isStudying ? elapsedSeconds : 0);

    progressPercent = Math.min(100, (subjectTodaySeconds / subjectTargetSeconds) * 100);
  }

  const subjectColor = selectedSubject?.color || '#10B981';

  // Calculate today's subject study time
  const todaySubjectSeconds = sessions
    .filter(s => s.subjectId === selectedSubject?.id && s.startTime.startsWith(new Date().toISOString().slice(0, 10)))
    .reduce((sum, s) => sum + s.durationSeconds, 0) + (isStudying ? elapsedSeconds : 0);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Subject Manager Modal */}
      <SubjectManagerModal
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
      />

      {/* Main Timer Glass Card */}
      <div className="relative rounded-3xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl p-6 sm:p-10 shadow-2xl overflow-hidden">
        {/* Glow ambient background */}
        <div
          className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-[100px] opacity-25 pointer-events-none transition-all duration-700"
          style={{ backgroundColor: subjectColor }}
        />
        <div
          className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full blur-[100px] opacity-15 pointer-events-none transition-all duration-700"
          style={{ backgroundColor: subjectColor }}
        />

        {/* Top Controls: Mode Switcher & Focus Mode Button */}
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10 pb-6 border-b border-slate-800/80">
          {/* Mode Pill Toggle */}
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-950/80 border border-slate-800">
            <button
              onClick={() => { if (!isStudying) setTimerMode('stopwatch'); }}
              disabled={isStudying}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                timerMode === 'stopwatch'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              } disabled:cursor-not-allowed`}
            >
              Stopwatch
            </button>
            <button
              onClick={() => { if (!isStudying) setTimerMode('pomodoro'); }}
              disabled={isStudying}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                timerMode === 'pomodoro'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              } disabled:cursor-not-allowed`}
            >
              Pomodoro (25/5)
            </button>
          </div>

          {/* Fullscreen Focus Mode Quick Trigger */}
          <button
            onClick={() => setIsFocusModeOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-semibold transition-all hover:border-emerald-500/50 shadow-sm"
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
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 hover:border-slate-700 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-3.5 h-3.5 rounded-full shadow-sm flex-shrink-0"
                  style={{ backgroundColor: subjectColor }}
                />
                <div>
                  <div className="text-[10px] text-slate-400 font-medium">Selected Subject</div>
                  <div className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                    {selectedSubject?.name || 'Choose a subject'}
                  </div>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-white transition-transform" />
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute left-0 right-0 mt-2 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="text-[10px] font-semibold text-slate-500 uppercase px-2 py-1">
                  Your Subjects
                </div>
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {subjects.map(sub => (
                    <button
                      key={sub.id}
                      onClick={() => {
                        setSelectedSubjectId(sub.id);
                        setShowDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors ${
                        sub.id === selectedSubjectId
                          ? 'bg-slate-800 text-white font-bold'
                          : 'text-slate-300 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: sub.color }}
                        />
                        <span>{sub.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {Math.floor((sub.targetMinutesPerDay || 60) / 60)}h goal
                      </span>
                    </button>
                  ))}
                </div>

                <div className="pt-2 mt-2 border-t border-slate-800">
                  <button
                    onClick={() => {
                      setIsSubjectModalOpen(true);
                      setShowDropdown(false);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    <span>Manage / Add Subjects</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Manage Subjects Quick Button */}
          <button
            onClick={() => setIsSubjectModalOpen(true)}
            className="p-3.5 rounded-2xl bg-slate-950/90 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-xs font-semibold"
            title="Edit Subjects"
          >
            <FolderPlus className="w-4 h-4 text-emerald-400" />
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
                boxShadow: isStudying && !isPaused ? `0 0 50px ${subjectColor}30` : 'none',
              }}
            >
              {/* Inner Dial */}
              <div
                className="w-52 h-52 sm:w-68 sm:h-68 rounded-full bg-slate-950/90 border border-slate-800 flex flex-col items-center justify-center p-6 text-center"
                style={{
                  borderColor: isStudying ? `${subjectColor}60` : undefined,
                }}
              >
                {/* Pomodoro Phase / Subject Pill */}
                <div
                  className="mb-2 text-[11px] font-bold px-3 py-0.5 rounded-full border"
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
                    : selectedSubject?.name || 'Focus Session'}
                </div>

                {/* Big Digital Numbers */}
                <div
                  className="font-mono text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white drop-shadow-md"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {displayTime}
                </div>

                {/* Status Indicator */}
                <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isStudying && !isPaused ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                    }`}
                  />
                  <span>
                    {isStudying ? (isPaused ? 'Timer Paused' : 'Studying Live') : 'Ready to Start'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 relative z-10">
            {!isStudying ? (
              <button
                onClick={() => startTimer()}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm transition-all shadow-xl shadow-emerald-500/25 flex items-center gap-2.5 scale-100 hover:scale-105"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Start Studying</span>
              </button>
            ) : (
              <>
                {isPaused ? (
                  <button
                    onClick={resumeTimer}
                    className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-emerald-500/25 flex items-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Resume</span>
                  </button>
                ) : (
                  <button
                    onClick={pauseTimer}
                    className="px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-750 text-amber-300 font-bold text-sm border border-amber-500/30 transition-all flex items-center gap-2"
                  >
                    <Pause className="w-4 h-4" />
                    <span>Pause</span>
                  </button>
                )}

                <button
                  onClick={() => stopTimer()}
                  className="px-6 py-3 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold text-sm transition-all flex items-center gap-2"
                  title="Stop and save session"
                >
                  <Square className="w-4 h-4 fill-current" />
                  <span>Stop & Save</span>
                </button>

                <button
                  onClick={resetTimer}
                  className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                  title="Reset Timer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Current Session Reflection Notes Input */}
        <div className="relative z-10 mt-6 pt-6 border-t border-slate-800/80">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-2">
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>Session Notes & Key Learnings (Optional)</span>
          </div>
          <input
            type="text"
            value={currentNotes}
            onChange={e => setCurrentNotes(e.target.value)}
            placeholder="e.g. Solved problem set 3, learned dynamic programming memoization..."
            className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
      </div>

      {/* Subject Today's Progress Card */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800/60 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-md"
            style={{ backgroundColor: `${subjectColor}30`, borderColor: subjectColor, borderWidth: 1 }}
          >
            <Clock className="w-5 h-5" style={{ color: subjectColor }} />
          </div>
          <div>
            <div className="text-xs text-slate-400">Today on {selectedSubject?.name}</div>
            <div className="text-base font-bold text-white flex items-center gap-2">
              <span>{formatHoursAndMins(todaySubjectSeconds)}</span>
              <span className="text-xs text-slate-500 font-normal">
                / {Math.floor((selectedSubject?.targetMinutesPerDay || 120) / 60)}h target
              </span>
            </div>
          </div>
        </div>

        {/* Mini progress bar */}
        <div className="w-full sm:w-64">
          <div className="flex justify-between text-[11px] text-slate-400 mb-1 font-medium">
            <span>Goal Progress</span>
            <span style={{ color: subjectColor }}>{Math.round(progressPercent)}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
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
  );
}
