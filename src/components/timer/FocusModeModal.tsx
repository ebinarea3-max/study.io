'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  ChevronUp,
  Check,
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
    isSyncConnected,
    isRemoteTransitioning,
  } = useStudy();

  const [ambientSound, setAmbientSound] = useState<AmbientSoundType | 'none'>('none');
  const [ambientVolume, setAmbientVolume] = useState(0.5);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAmbientMenuOpen, setIsAmbientMenuOpen] = useState(false);

  // Maintain activeSubjectRef to prevent stale closures in callbacks
  const activeSubjectRef = useRef(selectedSubject);
  useEffect(() => {
    activeSubjectRef.current = selectedSubject;
  }, [selectedSubject]);

  const handleStopAndSave = async () => {
    if (isSaving) return;
    const activeSub = activeSubjectRef.current || selectedSubject;
    if (!activeSub || !activeSub.id || (activeSub.name || '').trim().toLowerCase() === 'unassigned') {
      alert("Please choose a subject before recording focus time.");
      return;
    }
    setIsSaving(true);
    try {
      await stopTimer(undefined, undefined, activeSub);
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
    <div className="fixed inset-0 z-50 bg-[var(--bg)] text-white flex flex-col justify-between p-6 sm:p-10 select-none overflow-hidden animate-in fade-in duration-300">
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
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono tracking-widest uppercase">
                {timerMode.toUpperCase()}
              </span>
            </div>
            <div className="text-xs text-slate-400">
              Studying as <span className="text-amber-400 font-medium">{user.displayName}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Live Sync Status Indicator */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold backdrop-blur-md transition-all bg-white/5 border border-white/10 text-neutral-300"
            title={isSyncConnected ? "Cross-device timer sync is active" : "Reconnecting to cloud sync..."}
          >
            <span
              className={`w-2 h-2 rounded-full transition-transform duration-300 ${
                isSyncConnected ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
              } ${isRemoteTransitioning ? 'scale-150 ring-4 ring-emerald-400/40 animate-ping' : ''}`}
            />
            <span className="text-[11px] font-bold hidden sm:inline">
              {isSyncConnected ? 'Synced' : 'Reconnecting'}
            </span>
          </div>

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
        {/* Soft Radial Gradient Glow Behind Timer */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(217,119,6,0.12)_0%,transparent_70%)] pointer-events-none" />
        {/* Breathing Ring Aura */}
        <div className={`relative flex items-center justify-center rounded-full transition-all duration-300 ${
          isRemoteTransitioning ? 'ring-4 ring-emerald-400/50 scale-[1.03] shadow-[0_0_60px_rgba(16,185,129,0.4)]' : ''
        }`}>
          <div
            className="w-72 h-72 sm:w-96 sm:h-96 rounded-full border-2 border-dashed border-amber-500/20 animate-pulse-breathe flex items-center justify-center transition-all duration-700"
            style={{ boxShadow: isStudying && !isPaused ? `0 0 80px ${subjectColor}25` : 'none' }}
          >
            <div
              className="w-60 h-60 sm:w-80 sm:h-80 rounded-full border border-amber-500/20 bg-gradient-to-b from-[#0c0d12] to-[#121318] flex flex-col items-center justify-center p-6 shadow-2xl"
              
            >
              {/* Pomodoro Phase Tag */}
              {timerMode === 'pomodoro' && (
                <div
                  className="mb-2 flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border"
                  style={{
                    backgroundColor: `${subjectColor}15`,
                    borderColor: `${subjectColor}40`,
                    color: subjectColor,
                  }}
                >
                  {pomodoroPhase === 'work' ? (
                    <>
                      <Flame className="w-3.5 h-3.5" />
                      <span>Focus Sprint ({pomodoroPreset === '50/10' ? '50m' : '25m'})</span>
                    </>
                  ) : (
                    <>
                      <Coffee className="w-3.5 h-3.5" />
                      <span>Recharge Break ({pomodoroPreset === '50/10' ? '10m' : '5m'})</span>
                    </>
                  )}
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
                      ? 'bg-amber-400 animate-ping'
                      : pomodoroCompletedPhase === 'break'
                      ? 'bg-amber-400 animate-bounce'
                      : isStudying && !isPaused
                      ? 'bg-amber-400 animate-ping'
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
              <span>Focus Block Complete! Save session and take a break or skip.</span>
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
                disabled={isSaving || isRemoteTransitioning}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm transition-all shadow-xl shadow-emerald-500/25 flex items-center gap-2 active:scale-95 hover:scale-[1.02] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
                disabled={isSaving || isRemoteTransitioning}
                className="px-6 py-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-bold text-sm transition-all flex items-center gap-2 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
                  disabled={isSaving || isRemoteTransitioning}
                  className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-teal-400 to-emerald-500 hover:from-teal-300 hover:to-emerald-400 text-slate-950 font-black text-sm transition-all shadow-xl shadow-teal-500/25 flex items-center gap-2 active:scale-95 hover:scale-[1.02] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start Break</span>
                </button>
                <button
                  onClick={resetTimer}
                  disabled={isSaving || isRemoteTransitioning}
                  className="px-5 py-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white font-bold text-sm transition-colors active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Skip Break</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={pauseTimer}
                  disabled={isSaving || isRemoteTransitioning}
                  className="px-6 py-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-amber-300 font-bold text-sm border border-amber-500/30 transition-all flex items-center gap-2 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Pause className="w-4 h-4" />
                  <span>Pause Break</span>
                </button>
                <button
                  onClick={resetTimer}
                  disabled={isSaving || isRemoteTransitioning}
                  className="px-6 py-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white font-bold text-sm transition-colors active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
                const activeSub = activeSubjectRef.current || selectedSubject;
                if (!activeSub || !activeSub.id || (activeSub.name || '').trim().toLowerCase() === 'unassigned') {
                  alert("Please choose a subject before recording focus time.");
                  return;
                }
                startTimer(activeSub.id);
              }}
              disabled={isSaving || isRemoteTransitioning}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm transition-all shadow-xl shadow-emerald-500/25 flex items-center gap-2 active:scale-95 hover:scale-[1.02] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Flame className="w-5 h-5 fill-current" />
              <span>Start Focus Session</span>
            </button>
          ) : !isStudying ? (
            /* IDLE State: One primary button */
            <button
              onClick={() => {
                const activeSub = activeSubjectRef.current || selectedSubject;
                if (!activeSub || !activeSub.id || (activeSub.name || '').trim().toLowerCase() === 'unassigned') {
                  alert("Please choose a subject before recording focus time.");
                  return;
                }
                startTimer(activeSub.id);
              }}
              disabled={isSaving || isRemoteTransitioning}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-semibold text-sm transition-all duration-300 shadow-[0_0_30px_rgba(245,158,11,0.35)] flex items-center gap-2.5 active:scale-95 hover:scale-[1.02] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Start Session</span>
            </button>
          ) : !isPaused ? (
            /* RUNNING State: Two buttons (Pause & Stop & Save) */
            <>
              <button
                onClick={pauseTimer}
                disabled={isSaving || isRemoteTransitioning}
                className="px-6 py-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-amber-300 font-bold text-sm border border-amber-500/30 transition-all flex items-center gap-2 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </button>

              <button
                onClick={handleStopAndSave}
                disabled={isSaving || isRemoteTransitioning}
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
                disabled={isSaving || isRemoteTransitioning}
                className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-emerald-500/25 flex items-center gap-2 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Resume</span>
              </button>

              <button
                onClick={handleStopAndSave}
                disabled={isSaving || isRemoteTransitioning}
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
                disabled={isSaving || isRemoteTransitioning}
                className="p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-[var(--border)] text-neutral-400 hover:text-white transition-colors active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[var(--border)]">
        
        {/* Relative container for the popover positioning */}
        <div className="relative">
          <button
            onClick={() => setIsAmbientMenuOpen(!isAmbientMenuOpen)}
            className="bg-white/[0.04] border border-white/10 hover:border-amber-500/30 text-neutral-300 text-xs px-3.5 py-1.5 rounded-full flex items-center gap-2 transition-all cursor-pointer select-none"
          >
            <Music className={`w-3.5 h-3.5 ${ambientSound !== 'none' ? 'text-amber-500' : 'text-neutral-400'}`} />
            <span className="tracking-tight">
              Atmosphere: {
                ambientSound === 'whitenoise' ? 'White Noise' :
                ambientSound === 'brownnoise' ? 'Brown Noise' :
                ambientSound === 'rain' ? 'Rain' :
                ambientSound === 'lofi' ? 'Lofi Cafe' :
                ambientSound === 'campfire' ? 'Fireplace' :
                ambientSound === 'waves' ? 'Waves' : 'Silent'
              }
            </span>
            {ambientSound !== 'none' && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse ml-0.5" />}
            <ChevronUp className={`w-3.5 h-3.5 text-neutral-500 transition-transform ${isAmbientMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Floating Popover Menu */}
          {isAmbientMenuOpen && (
            <>
              {/* Invisible overlay to catch clicks outside */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsAmbientMenuOpen(false)} 
              />
              <div className="absolute bottom-full left-0 mb-3 z-50 bg-[#0e1015]/95 backdrop-blur-md border border-white/10 rounded-2xl p-2.5 shadow-2xl min-w-[220px] animate-in slide-in-from-bottom-2 fade-in duration-200">
                <div className="flex flex-col gap-1">
                  {[
                    { id: 'none', label: 'Silent', icon: <span className="w-3.5 h-3.5 rounded-full bg-neutral-300 mx-0.5" /> },
                    { id: 'whitenoise', label: 'White Noise', icon: <Radio className="w-4 h-4" /> },
                    { id: 'brownnoise', label: 'Brown Noise', icon: <Headphones className="w-4 h-4" /> },
                    { id: 'rain', label: 'Rain', icon: <CloudRain className="w-4 h-4" /> },
                    { id: 'lofi', label: 'Lofi Cafe', icon: <Sparkles className="w-4 h-4" /> },
                    { id: 'campfire', label: 'Fireplace', icon: <Flame className="w-4 h-4" /> },
                    { id: 'waves', label: 'Waves', icon: <Waves className="w-4 h-4" /> }
                  ].map(option => (
                    <button
                      key={option.id}
                      onClick={() => {
                        handleAmbientChange(option.id as any);
                        setIsAmbientMenuOpen(false);
                      }}
                      className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors cursor-pointer ${
                        ambientSound === option.id 
                          ? 'bg-amber-500/15 text-amber-300' 
                          : 'text-neutral-400 hover:text-white hover:bg-white/[0.06]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {option.icon}
                        <span>{option.label}</span>
                      </div>
                      {ambientSound === option.id && <Check className="w-4 h-4 text-amber-400" />}
                    </button>
                  ))}
                </div>

                {/* Volume Slider if sound active */}
                {ambientSound !== 'none' && (
                  <div className="mt-2 pt-2 border-t border-white/10 flex items-center gap-3 px-2">
                    <Volume2 className="w-4 h-4 text-neutral-500" />
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={ambientVolume}
                      onClick={e => e.stopPropagation()}
                      onChange={e => handleVolumeChange(parseFloat(e.target.value))}
                      className="flex-1 accent-amber-500 bg-white/10 rounded-lg cursor-pointer h-1.5"
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
