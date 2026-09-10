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
    isFocusModeOpen,
    setIsFocusModeOpen,
    isStudying,
    isPaused,
    elapsedSeconds,
    selectedSubject,
    timerMode,
    pomodoroPhase,
    pomodoroWorkDuration,
    pomodoroBreakDuration,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    currentNotes,
    setCurrentNotes,
  } = useStudy();

  const [ambientSound, setAmbientSound] = useState<AmbientSoundType | 'none'>('none');
  const [ambientVolume, setAmbientVolume] = useState(0.5);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [showNotes, setShowNotes] = useState(false);

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

  // When study session completes or stops
  useEffect(() => {
    if (!isStudying && ambientSound !== 'none') {
      soundFx.stopAmbient();
      setAmbientSound('none');
    }
  }, [isStudying, ambientSound]);

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

  const subjectColor = selectedSubject?.color || '#10B981';

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
              <span>{selectedSubject?.name || 'General Focus'}</span>
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
                  {pomodoroPhase === 'work' ? '🔥 Focus Sprint' : '☕ Recharge Break'}
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
                    isStudying && !isPaused ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'
                  }`}
                />
                <span className="text-xs font-medium text-slate-400">
                  {isStudying ? (isPaused ? 'Paused' : 'Focusing Deeply') : 'Ready to begin'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Motivational quote */}
        <div className="mt-8 max-w-md px-4">
          <p className="text-xs sm:text-sm text-slate-400 italic font-medium transition-all duration-500">
            &ldquo;{MOTIVATIONAL_QUOTES[quoteIndex]}&rdquo;
          </p>
        </div>

        {/* Timer Control Buttons */}
        <div className="mt-8 flex items-center gap-4">
          {!isStudying ? (
            <button
              onClick={() => startTimer()}
              className="px-8 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm transition-all shadow-xl shadow-emerald-500/25 flex items-center gap-2"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Start Session</span>
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
                  className="px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-sm border border-amber-500/30 transition-all flex items-center gap-2"
                >
                  <Pause className="w-4 h-4" />
                  <span>Pause</span>
                </button>
              )}

              <button
                onClick={() => {
                  soundFx.stopAmbient();
                  setAmbientSound('none');
                  stopTimer();
                }}
                className="px-6 py-3 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold text-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>Save & Finish</span>
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
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-900">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 mr-2 flex items-center gap-1.5">
            <Music className="w-3.5 h-3.5 text-emerald-400" />
            <span>Atmosphere:</span>
          </span>

          <button
            onClick={() => handleAmbientChange('none')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              ambientSound === 'none'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Silent
          </button>

          <button
            onClick={() => handleAmbientChange('whitenoise')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              ambientSound === 'whitenoise'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-teal-300" />
            <span>White Noise</span>
          </button>

          <button
            onClick={() => handleAmbientChange('brownnoise')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              ambientSound === 'brownnoise'
                ? 'bg-amber-600/25 text-amber-200 border border-amber-600/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Headphones className="w-3.5 h-3.5 text-amber-300" />
            <span>Brown Noise</span>
          </button>

          <button
            onClick={() => handleAmbientChange('rain')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              ambientSound === 'rain'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CloudRain className="w-3.5 h-3.5" />
            <span>Rain</span>
          </button>

          <button
            onClick={() => handleAmbientChange('lofi')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              ambientSound === 'lofi'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Lofi Cafe</span>
          </button>

          <button
            onClick={() => handleAmbientChange('campfire')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              ambientSound === 'campfire'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Fireplace</span>
          </button>

          <button
            onClick={() => handleAmbientChange('waves')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              ambientSound === 'waves'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Waves className="w-3.5 h-3.5" />
            <span>Waves</span>
          </button>
        </div>

        {/* Volume Slider if sound active */}
        {ambientSound !== 'none' && (
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-slate-400" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={ambientVolume}
              onChange={e => handleVolumeChange(parseFloat(e.target.value))}
              className="w-24 accent-emerald-500 bg-slate-800 cursor-pointer"
            />
          </div>
        )}
      </div>
    </div>
  );
}
