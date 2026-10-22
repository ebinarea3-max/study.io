'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useStudy } from '../../context/StudyContext';
import { formatSeconds } from '../../lib/utils';
import { Minimize2, Sparkles } from 'lucide-react';
import { FocusSceneLayer } from '../focus/FocusSceneLayer';
import { useFocusScene } from '../focus/useFocusScene';
import { ScenePicker, ScenePreviewPill } from '../focus/ScenePicker';

function exitFullscreenSafely() {
  if (typeof document === 'undefined') return;

  interface VendorDoc extends Document {
    webkitFullscreenElement?: Element;
    webkitExitFullscreen?: () => Promise<void> | void;
  }
  interface VendorOrientation {
    unlock?: () => Promise<void> | void;
  }

  const vendorDoc = document as VendorDoc;
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
  } else if (vendorDoc.webkitFullscreenElement && vendorDoc.webkitExitFullscreen) {
    vendorDoc.webkitExitFullscreen();
  }

  const orientation = window.screen?.orientation as unknown as VendorOrientation | undefined;
  if (orientation?.unlock) {
    orientation.unlock();
  }
}

export function FocusModeModal() {
  const {
    isFocusModeOpen,
    setIsFocusModeOpen,
    elapsedSeconds,
    timerMode,
    pomodoroPhase,
    pomodoroWorkDuration,
    pomodoroBreakDuration,
    isStudying,
    isPaused,
  } = useStudy();

  const [isIdle, setIsIdle] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sceneButtonRef = useRef<HTMLButtonElement | null>(null);

  // Focus scenes state & soft gating
  const {
    activeSceneId,
    dim,
    setDim,
    selectScene,
    isPremium,
    previewSceneId,
    previewSecondsLeft,
    openPremiumModal,
  } = useFocusScene();

  // Speed multiplier: while timer is running -> 1.0, while idle or paused -> 0.5
  const speedMultiplier = isStudying && !isPaused ? 1.0 : 0.5;

  // Auto-hide UI when mouse is idle (keep visible while picker is open)
  useEffect(() => {
    if (!isFocusModeOpen) return;

    const resetIdleTimer = () => {
      setIsIdle(false);
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
      if (!isPickerOpen) {
        idleTimeoutRef.current = setTimeout(() => setIsIdle(true), 2500);
      }
    };

    window.addEventListener('mousemove', resetIdleTimer);
    window.addEventListener('mousedown', resetIdleTimer);
    window.addEventListener('keydown', resetIdleTimer);

    resetIdleTimer();

    return () => {
      window.removeEventListener('mousemove', resetIdleTimer);
      window.removeEventListener('mousedown', resetIdleTimer);
      window.removeEventListener('keydown', resetIdleTimer);
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    };
  }, [isFocusModeOpen, isPickerOpen]);

  // Esc key listener to exit focus mode (only if picker is not open; picker handles its own ESC)
  useEffect(() => {
    if (!isFocusModeOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isPickerOpen) {
        setIsFocusModeOpen(false);
        exitFullscreenSafely();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocusModeOpen, isPickerOpen, setIsFocusModeOpen]);

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
      data-theme="rank"
      style={{ colorScheme: 'dark' }}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center select-none overflow-hidden animate-in fade-in duration-500 transition-colors bg-black ${
        isIdle && !isPickerOpen ? 'cursor-none' : 'cursor-default'
      }`}
    >
      {/* 1. Animated / Living Focus Scene Layer behind all content (z-0, pointer-events none) */}
      <FocusSceneLayer
        sceneId={activeSceneId}
        dim={dim}
        speedMultiplier={speedMultiplier}
      />

      {/* 2. Free User 8-Second Preview Toast / Pill */}
      {previewSceneId && previewSecondsLeft > 0 && (
        <ScenePreviewPill
          secondsLeft={previewSecondsLeft}
          onUnlockClick={() => openPremiumModal()}
        />
      )}

      {/* Invisible overlay that can be clicked to exit if they don't know ESC */}
      <div
        className="absolute inset-0 z-0"
        onDoubleClick={() => setIsFocusModeOpen(false)}
      />

      {/* 3. Big Timer with high-contrast radial mask */}
      <div
        className={`relative z-10 flex flex-col items-center justify-center text-center transition-transform duration-700 ease-out ${
          isIdle && !isPickerOpen ? 'scale-105' : 'scale-100'
        }`}
      >
        {timerMode === 'pomodoro' && (
          <div className="mb-8 text-sm md:text-lg font-bold text-slate-400 tracking-[0.3em] uppercase drop-shadow-md">
            {pomodoroPhase === 'work' ? 'Deep Focus' : 'Rest Phase'}
          </div>
        )}

        <div
          className="font-hud font-black tracking-tighter text-white leading-none text-[16vw] md:text-[20vw] tabular-nums drop-shadow-[0_4px_30px_rgba(0,0,0,0.8)]"
          style={{ textShadow: `0 0 120px ${glowColor}` }}
        >
          {displayTime}
        </div>
      </div>

      {/* 4. Floating Control Bar (Scene Picker & Exit Fullscreen) */}
      <div
        className={`absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 transition-all duration-500 ease-in-out ${
          isIdle && !isPickerOpen ? 'opacity-0 translate-y-4 pointer-events-none' : 'opacity-100 translate-y-0'
        }`}
      >
        {/* Scene Picker Trigger Button */}
        <div className="relative">
          <button
            ref={sceneButtonRef}
            type="button"
            onClick={() => setIsPickerOpen((prev) => !prev)}
            aria-haspopup="dialog"
            aria-expanded={isPickerOpen}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-neutral-300 hover:text-white text-xs sm:text-sm font-semibold transition-all shadow-2xl hover:scale-105 active:scale-95 cursor-pointer"
            title="Focus scenes"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Scene</span>
          </button>

          {/* Scene Picker Popover / Bottom Sheet */}
          <ScenePicker
            isOpen={isPickerOpen}
            onClose={() => setIsPickerOpen(false)}
            activeSceneId={activeSceneId}
            onSelectScene={(id) => selectScene(id)}
            dim={dim}
            onDimChange={setDim}
            isPremium={isPremium}
            triggerButtonRef={sceneButtonRef}
          />
        </div>

        {/* Exit Fullscreen Button */}
        <button
          type="button"
          onClick={() => {
            setIsFocusModeOpen(false);
            exitFullscreenSafely();
          }}
          className="flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-neutral-300 hover:text-white text-xs sm:text-sm font-semibold transition-all shadow-2xl hover:scale-105 active:scale-95 cursor-pointer"
        >
          <Minimize2 className="w-4 h-4" />
          <span>Exit Fullscreen</span>
          <span className="hidden sm:inline-block ml-2 px-1.5 py-0.5 rounded text-[10px] bg-black/40 text-neutral-400 font-mono">
            ESC
          </span>
        </button>
      </div>
    </div>
  );
}
