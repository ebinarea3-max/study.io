'use client';

import React, { useEffect } from 'react';
import { useStudy } from '../../context/StudyContext';
import { formatSeconds } from '../../lib/utils';
import { Minimize2 } from 'lucide-react';

export function FocusModeModal() {
  const {
    isFocusModeOpen,
    setIsFocusModeOpen,
    elapsedSeconds,
    timerMode,
    pomodoroPhase,
    pomodoroWorkDuration,
    pomodoroBreakDuration,
  } = useStudy();

  // Esc key listener to exit focus mode
  useEffect(() => {
    if (!isFocusModeOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFocusModeOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocusModeOpen, setIsFocusModeOpen]);

  if (!isFocusModeOpen) return null;

  // Calculate display time based on mode
  let displayTime = formatSeconds(elapsedSeconds);
  if (timerMode === 'pomodoro') {
    const target = pomodoroPhase === 'work' ? pomodoroWorkDuration : pomodoroBreakDuration;
    const remaining = Math.max(0, target - elapsedSeconds);
    displayTime = formatSeconds(remaining);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col items-center justify-center select-none overflow-hidden animate-in fade-in duration-300">
      
      {/* Invisible overlay that can be clicked to exit if they don't know ESC */}
      <div 
        className="absolute inset-0 z-0 cursor-default" 
        onDoubleClick={() => setIsFocusModeOpen(false)}
      />
      
      {/* Subtle Exit Hint (Hover or Top Left) */}
      <button
        onClick={() => setIsFocusModeOpen(false)}
        className="absolute top-6 left-6 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-neutral-500 hover:text-white text-[11px] font-medium transition-all opacity-0 hover:opacity-100 cursor-pointer group"
      >
        <Minimize2 className="w-4 h-4" />
        <span>Press ESC to exit</span>
      </button>

      {/* Big Timer */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center">
        {timerMode === 'pomodoro' && (
          <div className="mb-6 text-sm md:text-base font-bold text-slate-400 tracking-widest uppercase">
            {pomodoroPhase === 'work' ? 'Focus Sprint' : 'Rest Phase'}
          </div>
        )}
        
        <div className="font-hud font-black tracking-tighter text-white drop-shadow-[0_0_80px_rgba(255,255,255,0.15)] leading-none text-[20vw] md:text-[18vw]">
          {displayTime}
        </div>
      </div>
    </div>
  );
}
