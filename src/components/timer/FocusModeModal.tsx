'use client';

import React, { useState, useEffect } from 'react';
import { useStudy } from '../../context/StudyContext';
import { useAuth } from '../../context/AuthContext';
import { formatSeconds } from '../../lib/utils';
import { soundFx, AmbientSoundType } from '../../lib/audio';
import {
  Minimize2,
  Play,
  Pause,
  Square,
  RotateCcw,
  Volume2,
  VolumeX,
  Flame,
  CheckCircle2,
  CloudRain,
  Music,
  Waves,
  Sparkles,
  Edit3,
  Radio,
  Headphones,
  Coffee,
  SkipForward,
  X,
} from 'lucide-react';

const MOTIVATIONAL_QUOTES = [
  "Deep work is the superpower of the 21st century.",
  "Focus on the process, not the outcome.",
  "Small daily disciplines compound into monumental success.",
  "One focused hour beats four distracted hours.",
  "The pain of discipline is far less than the pain of regret.",
  "Lock in. The future you will thank you.",
];

export function FocusModeModal() {
  const { user } = useAuth();
  const {
    subjects,
    isFocusModeOpen,
    setIsFocusModeOpen,
    isStudying,
    isPaused,
    elapsedSeconds,
    selectedSubject,
    setSelectedSubjectId,
    timerMode,
    pomodoroPhase,
    pomodoroWorkDuration,
    pomodoroBreakDuration,
    pomodoroPreset,
    pomodoroCompletedPhase,
    setPomodoroCompletedPhase,
    saveAndStartBreak,
    skipPomodoroBreak,
    startPomodoroBreak,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    resetTimer,
    currentNotes,
    setCurrentNotes,
  } = useStudy();

  const [ambientSound, setAmbientSound] = useState<AmbientSoundType | 'none'>('none');
  const [ambientVolume, setAmbientVolume] = useState(0.5);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleStopAndSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await stopTimer();
    } finally {
      setIsSaving(false);
    }
  };

  // Quote rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex(prev => (prev + 1) % MOTIVATIONAL_QUOTES.length);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Ambient sound management and unmount safety
  useEffect(() => {
    if (!isFocusModeOpen) {
      soundFx.stopAmbient();
      setAmbientSound('none');
      return;
    }

    return () => {
      soundFx.stopAmbient();
      setAmbientSound('none');
    };
  }, [isFocusModeOpen]);

  // Clean unmount safety
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

  if (!isFocusModeOpen) return null;

  // Calculate display time based on mode
  let displayTime = formatSeconds(elapsedSeconds);
  let progressPercent = 100;
  if (timerMode === 'pomodoro') {
    const target = pomodoroPhase === 'work' ? pomodoroWorkDuration : pomodoroBreakDuration;
    const remaining = Math.max(0, target - elapsedSeconds);
    displayTime = formatSeconds(remaining);
    progressPercent = Math.min(100, (elapsedSeconds / target) * 100);
  }

  const subjectColor = selectedSubject?.color || '#5A6B6A';

  return (
    <div className="fixed inset-0 z-50 bg-[#050811] text-white flex flex-col justify-between p-6 sm:p-10 select-none overflow-hidden animate-in fade-in duration-300">
      {/* Background atmospheric ambient glowing blobs */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[140px] opacity-20 pointer-events-none transition-all duration-1000"
        style={{ backgroundColor: subjectColor }}
      />

      {/* Top Bar */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-3.5 h-3.5 rounded-full shadow-lg"
            style={{ backgroundColor: subjectColor }}
          />
          <div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <span>{selectedSubject?.name || 'No Subject Selected'}</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                {timerMode.toUpperCase()}
              </span>
            </div>
            <div className="text-xs text-slate-400">
              Studying as <span className="text-emerald-400 font-medium">{user.displayName}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Notes scratchpad toggle */}
          <button
            onClick={() => setShowNotes(!showNotes)}
            className={`p-2.5 rounded-xl border transition-all ${
              showNotes
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Focus Scratchpad"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          {/* Exit Focus Mode */}
          <button
            onClick={() => {
              soundFx.stopAmbient();
              setAmbientSound('none');
              setIsFocusModeOpen(false);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
          >
            <Minimize2 className="w-4 h-4" />
            <span>Exit Fullscreen</span>
          </button>
        </div>
      </div>

      {/* Center Digital Clock & Breathing Visualizer */}
      <div className="relative z-10 my-auto flex flex-col items-center justify-center text-center">
        {/* Breathing Ring Aura */}
        <div className="relative flex items-center justify-center">
          <div
            className="w-72 h-72 sm:w-96 sm:h-96 rounded-full border-2 border-dashed animate-pulse-breathe flex items-center justify-center transition-all duration-700"
            style={{
              borderColor: `${subjectColor}40`,
              boxShadow: isStudying && !isPaused ? `0 0 80px ${subjectColor}25` : 'none',
            }}
          >
            <div
              className="w-60 h-60 sm:w-80 sm:h-80 rounded-full border border-slate-800 bg-slate-950/60 backdrop-blur-2xl flex flex-col items-center justify-center p-6 shadow-2xl"
              style={{ borderColor: `${subjectColor}50` }}
            >
              {/* Pomodoro Phase Tag */}
              {timerMode === 'pomodoro' && (
                <div
                  className="mb-2 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border"
                  style={{
                    backgroundColor: `${subjectColor}15`,
                    borderColor: `${subjectColor}40`,
                    color: subjectColor,
                  }}
                >
                  {pomodoroPhase === 'work'
                    ? `🔥 Focus Sprint (${pomodoroPreset === '50/10' ? '50m' : '25m'})`
                    : `☕ Recharge Break (${pomodoroPreset === '50/10' ? '10m' : '5m'})`}
                </div>
              )}

              {/* Big Digital Clock */}
              <div
                className="font-mono text-5xl sm:text-6xl md:text-7xl font-black tracking-tight text-white drop-shadow-md"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {displayTime}
              </div>

              {/* Status pill */}
              <div className="mt-3 flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    pomodoroCompletedPhase === 'work'
                      ? 'bg-emerald-400 animate-ping'
                      : pomodoroCompletedPhase === 'break'
                      ? 'bg-amber-400 animate-bounce'
                      : isStudying && !isPaused
                      ? 'bg-emerald-400 animate-ping'
                      : 'bg-slate-500'
                  }`}
                />
                <span className="text-xs font-medium text-slate-400">
                  {pomodoroCompletedPhase === 'work'
                    ? 'Focus Complete!'
                    : pomodoroCompletedPhase === 'break'
                    ? 'Break Over'
                    : timerMode === 'pomodoro' && pomodoroPhase === 'shortBreak'
                    ? isPaused
                      ? 'Break Paused — Ready'
                      : 'Recharging Break'
                    : isStudying
                    ? isPaused
                      ? 'Paused'
                      : 'Focusing Deeply'
                    : 'Ready to begin'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Motivational quote */}
        <div className="mt-6 max-w-md px-4">
          <p className="text-xs sm:text-sm text-slate-400 italic font-medium transition-all duration-500">
            &ldquo;{MOTIVATIONAL_QUOTES[quoteIndex]}&rdquo;
          </p>
        </div>

        {/* Focus Block Complete Banner */}
        {pomodoroCompletedPhase === 'work' && (
          <div className="mt-4 flex items-center justify-between gap-3 px-5 py-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs font-semibold backdrop-blur-md shadow-xl shadow-emerald-500/10 animate-in fade-in duration-300">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-emerald-300 animate-pulse" />
              <span>Focus Block Complete! 🎉 Save session and take a break or skip.</span>
            </div>
          </div>
        )}

        {/* Break Over Banner */}
        {pomodoroCompletedPhase === 'break' && (
          <div className="mt-4 flex items-center justify-between gap-3 px-5 py-3 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs font-semibold backdrop-blur-md shadow-xl shadow-amber-500/10 animate-in fade-in duration-300">
            <div className="flex items-center gap-2.5">
              <Flame className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>Break Over — Ready to Study? Click Start when you are ready.</span>
            </div>
            <button
              onClick={() => setPomodoroCompletedPhase(null)}
              className="p-1 rounded-lg hover:bg-amber-500/20 text-amber-300 cursor-pointer"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Timer Control Buttons: Synchronized with StudyTimer */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {pomodoroCompletedPhase === 'work' ? (
            /* Prompt 1: Focus session reached 00:00 -> Save & Start Break / Skip Break */
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
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm transition-all shadow-xl shadow-emerald-500/25 flex items-center gap-2 active:scale-95 hover:scale-[1.02] cursor-pointer disabled:opacity-50"
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
                className="px-6 py-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-bold text-sm transition-all flex items-center gap-2 active:scale-95 cursor-pointer disabled:opacity-50"
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
                  className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-teal-400 to-emerald-500 hover:from-teal-300 hover:to-emerald-400 text-slate-950 font-black text-sm transition-all shadow-xl shadow-teal-500/25 flex items-center gap-2 active:scale-95 hover:scale-[1.02] cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start Break</span>
                </button>
                <button
                  onClick={resetTimer}
                  className="px-5 py-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white font-bold text-sm transition-colors active:scale-95 cursor-pointer"
                >
                  <span>Skip Break</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={pauseTimer}
                  className="px-6 py-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-amber-300 font-bold text-sm border border-amber-500/30 transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
                >
                  <Pause className="w-4 h-4" />
                  <span>Pause Break</span>
                </button>
                <button
                  onClick={resetTimer}
                  className="px-6 py-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white font-bold text-sm transition-colors active:scale-95 cursor-pointer"
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
                if (!selectedSubject) {
                  const subjectList = Array.isArray(subjects) ? subjects : [];
                  const general = subjectList.find(s => s && (s.name || '').toLowerCase() === 'general focus') || subjectList[0];
                  if (general?.id) {
                    setSelectedSubjectId(general.id);
                    startTimer(general.id);
                  } else {
                    startTimer();
                  }
                } else {
                  startTimer();
                }
              }}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm transition-all shadow-xl shadow-emerald-500/25 flex items-center gap-2 active:scale-95 hover:scale-[1.02] cursor-pointer"
            >
              <Flame className="w-5 h-5 fill-current" />
              <span>Start Focus Session</span>
            </button>
          ) : !isStudying ? (
            /* IDLE State: One primary button */
            <button
              onClick={() => {
                if (!selectedSubject) {
                  const subjectList = Array.isArray(subjects) ? subjects : [];
                  const general = subjectList.find(s => s && (s.name || '').toLowerCase() === 'general focus') || subjectList[0];
                  if (general?.id) {
                    setSelectedSubjectId(general.id);
                    startTimer(general.id);
                  } else {
                    startTimer();
                  }
                } else {
                  startTimer();
                }
              }}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm transition-all shadow-xl shadow-emerald-500/25 flex items-center gap-2.5 active:scale-95 hover:scale-[1.02] cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Start Session</span>
            </button>
          ) : !isPaused ? (
            /* RUNNING State: Two buttons (Pause & Stop & Save) */
            <>
              <button
                onClick={pauseTimer}
                className="px-6 py-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-amber-300 font-bold text-sm border border-amber-500/30 transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
              >
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </button>

              <button
                onClick={handleStopAndSave}
                disabled={isSaving}
                className="px-6 py-3 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold text-sm transition-all flex items-center gap-2 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
            /* PAUSED State: Two buttons (Resume & Stop & Save) plus subtle Reset icon */
            <>
              <button
                onClick={resumeTimer}
                disabled={isSaving}
                className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-emerald-500/25 flex items-center gap-2 active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Resume</span>
              </button>

              <button
                onClick={handleStopAndSave}
                disabled={isSaving}
                className="px-6 py-3 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold text-sm transition-all flex items-center gap-2 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
                onClick={resetTimer}
                className="p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-white/[0.08] text-neutral-400 hover:text-white transition-colors active:scale-95 cursor-pointer"
                title="Reset Timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Optional Side Notes Scratchpad Drawer */}
      {showNotes && (
        <div className="absolute right-6 top-20 bottom-24 w-80 bg-slate-900/95 border border-slate-800 rounded-2xl p-4 shadow-2xl backdrop-blur-xl flex flex-col z-20 animate-in slide-in-from-right-4 duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Session Scratchpad</span>
            </span>
            <button
              onClick={() => setShowNotes(false)}
              className="text-xs text-slate-500 hover:text-slate-300"
            >
              Close
            </button>
          </div>
          <textarea
            value={currentNotes}
            onChange={e => setCurrentNotes(e.target.value)}
            placeholder="Jot down quick thoughts, formulas, or concepts to review without breaking flow..."
            className="flex-1 w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 resize-none font-mono"
          />
        </div>
      )}

      {/* Bottom Controls: Ambient Sound Player */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/[0.08]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-neutral-400 mr-1 flex items-center gap-1.5">
            <Music className="w-3.5 h-3.5 text-emerald-400" />
            <span className="tracking-tight">Atmosphere:</span>
          </span>

          <button
            onClick={() => handleAmbientChange('none')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all duration-150 active:scale-95 cursor-pointer ${
              ambientSound === 'none'
                ? 'bg-white/[0.12] text-white border border-white/25 shadow-sm shadow-white/5'
                : 'bg-white/[0.03] hover:bg-white/[0.08] text-neutral-400 hover:text-white border border-white/[0.06] hover:border-white/[0.12]'
            }`}
          >
            {ambientSound === 'none' && <span className="w-1.5 h-1.5 rounded-full bg-neutral-300" />}
            <span>Silent</span>
          </button>

          <button
            onClick={() => handleAmbientChange('whitenoise')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all duration-150 active:scale-95 cursor-pointer ${
              ambientSound === 'whitenoise'
                ? 'bg-teal-500/15 text-teal-200 border border-teal-500/40 shadow-sm shadow-teal-500/20'
                : 'bg-white/[0.03] hover:bg-white/[0.08] text-neutral-400 hover:text-white border border-white/[0.06] hover:border-white/[0.12]'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-teal-400" />
            <span>White Noise</span>
            {ambientSound === 'whitenoise' && <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />}
          </button>

          <button
            onClick={() => handleAmbientChange('brownnoise')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all duration-150 active:scale-95 cursor-pointer ${
              ambientSound === 'brownnoise'
                ? 'bg-amber-600/20 text-amber-200 border border-amber-600/40 shadow-sm shadow-amber-500/20'
                : 'bg-white/[0.03] hover:bg-white/[0.08] text-neutral-400 hover:text-white border border-white/[0.06] hover:border-white/[0.12]'
            }`}
          >
            <Headphones className="w-3.5 h-3.5 text-amber-400" />
            <span>Brown Noise</span>
            {ambientSound === 'brownnoise' && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />}
          </button>

          <button
            onClick={() => handleAmbientChange('rain')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all duration-150 active:scale-95 cursor-pointer ${
              ambientSound === 'rain'
                ? 'bg-blue-500/15 text-blue-200 border border-blue-500/40 shadow-sm shadow-blue-500/20'
                : 'bg-white/[0.03] hover:bg-white/[0.08] text-neutral-400 hover:text-white border border-white/[0.06] hover:border-white/[0.12]'
            }`}
          >
            <CloudRain className="w-3.5 h-3.5 text-blue-400" />
            <span>Rain</span>
            {ambientSound === 'rain' && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />}
          </button>

          <button
            onClick={() => handleAmbientChange('lofi')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all duration-150 active:scale-95 cursor-pointer ${
              ambientSound === 'lofi'
                ? 'bg-purple-500/15 text-purple-200 border border-purple-500/40 shadow-sm shadow-purple-500/20'
                : 'bg-white/[0.03] hover:bg-white/[0.08] text-neutral-400 hover:text-white border border-white/[0.06] hover:border-white/[0.12]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Lofi Cafe</span>
            {ambientSound === 'lofi' && <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />}
          </button>

          <button
            onClick={() => handleAmbientChange('campfire')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all duration-150 active:scale-95 cursor-pointer ${
              ambientSound === 'campfire'
                ? 'bg-orange-500/15 text-orange-200 border border-orange-500/40 shadow-sm shadow-orange-500/20'
                : 'bg-white/[0.03] hover:bg-white/[0.08] text-neutral-400 hover:text-white border border-white/[0.06] hover:border-white/[0.12]'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span>Fireplace</span>
            {ambientSound === 'campfire' && <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />}
          </button>

          <button
            onClick={() => handleAmbientChange('waves')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all duration-150 active:scale-95 cursor-pointer ${
              ambientSound === 'waves'
                ? 'bg-cyan-500/15 text-cyan-200 border border-cyan-500/40 shadow-sm shadow-cyan-500/20'
                : 'bg-white/[0.03] hover:bg-white/[0.08] text-neutral-400 hover:text-white border border-white/[0.06] hover:border-white/[0.12]'
            }`}
          >
            <Waves className="w-3.5 h-3.5 text-cyan-400" />
            <span>Waves</span>
            {ambientSound === 'waves' && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />}
          </button>
        </div>

        {/* Volume Slider if sound active */}
        {ambientSound !== 'none' && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06]">
            <Volume2 className="w-4 h-4 text-neutral-400" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={ambientVolume}
              onChange={e => handleVolumeChange(parseFloat(e.target.value))}
              className="w-24 accent-emerald-400 bg-white/10 rounded-lg cursor-pointer"
            />
          </div>
        )}
      </div>
    </div>
  );
}
