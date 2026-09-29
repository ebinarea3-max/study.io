'use client';

import React, { useEffect, useState, useRef } from 'react';
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

  const [isIdle, setIsIdle] = useState(false);
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-hide UI when mouse is idle
  useEffect(() => {
    if (!isFocusModeOpen) return;

    const resetIdleTimer = () => {
      setIsIdle(false);
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
      idleTimeoutRef.current = setTimeout(() => setIsIdle(true), 2500);
    };

    window.addEventListener('mousemove', resetIdleTimer);
    window.addEventListener('mousedown', resetIdleTimer);
    window.addEventListener('keydown', resetIdleTimer);

    // Initial timer
    resetIdleTimer();

    return () => {
      window.removeEventListener('mousemove', resetIdleTimer);
      window.removeEventListener('mousedown', resetIdleTimer);
      window.removeEventListener('keydown', resetIdleTimer);
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    };
  }, [isFocusModeOpen]);

  // Esc key listener to exit focus mode
  useEffect(() => {
    if (!isFocusModeOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFocusModeOpen(false);
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        } else if ((document as any).webkitFullscreenElement) {
          (document as any).webkitExitFullscreen();
        }
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

  const isBreak = timerMode === 'pomodoro' && pomodoroPhase !== 'work';
  const glowColor = isBreak ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.1)';

  return (
    <div 
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center select-none overflow-hidden animate-in fade-in duration-500 transition-colors ${
        isIdle ? 'cursor-none' : 'cursor-default'
      }`}
      style={{
        backgroundColor: '#050505',
        backgroundImage: `radial-gradient(circle at 50% 50%, ${glowColor} 0%, transparent 70%)`
      }}
    >
      
      {/* Invisible overlay that can be clicked to exit if they don't know ESC */}
      <div 
        className="absolute inset-0 z-0" 
        onDoubleClick={() => setIsFocusModeOpen(false)}
      />
      
      {/* Big Timer */}
      <div className={`relative z-10 flex flex-col items-center justify-center text-center transition-transform duration-700 ease-out ${isIdle ? 'scale-105' : 'scale-100'}`}>
        {timerMode === 'pomodoro' && (
          <div className="mb-8 text-sm md:text-lg font-bold text-slate-500 tracking-[0.3em] uppercase">
            {pomodoroPhase === 'work' ? 'Deep Focus' : 'Rest Phase'}
          </div>
        )}
        
        <div 
          className="font-hud font-black tracking-tighter text-white leading-none text-[16vw] md:text-[20vw] tabular-nums"
          style={{ textShadow: `0 0 120px ${glowColor}` }}
        >
          {displayTime}
        </div>
      </div>

      {/* Floating Exit Button */}
      <div 
        className={`absolute bottom-12 left-1/2 -translate-x-1/2 z-20 transition-all duration-500 ease-in-out ${
          isIdle ? 'opacity-0 translate-y-4 pointer-events-none' : 'opacity-100 translate-y-0'
        }`}
      >
        <button
          onClick={() => {
            setIsFocusModeOpen(false);
            if (document.fullscreenElement) {
              document.exitFullscreen().catch(() => {});
            } else if ((document as any).webkitFullscreenElement) {
              (document as any).webkitExitFullscreen();
            }
          }}
          className="flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-neutral-300 hover:text-white text-sm font-semibold transition-all shadow-2xl hover:scale-105 active:scale-95"
        >
          <Minimize2 className="w-4 h-4" />
          <span>Exit Fullscreen</span>
          <span className="hidden sm:inline-block ml-2 px-1.5 py-0.5 rounded text-[10px] bg-black/40 text-neutral-400 font-mono">ESC</span>
        </button>
      </div>

    </div>
  );
}
