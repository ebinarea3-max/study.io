'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useStudy } from '../../context/StudyContext';
import { formatSeconds } from '../../lib/utils';
import { Minimize2, Sliders, Crown } from 'lucide-react';
import { FocusSceneLayer } from '../focus/FocusSceneLayer';
import { useFocusScene } from '../focus/useFocusScene';
import { ScenePicker, ScenePreviewPill } from '../focus/ScenePicker';
import { AVAILABLE_SCENES, getSceneById } from '../focus/scenes/registry';

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
    selectedSubject,
  } = useStudy();

  const [isIdle, setIsIdle] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const settingsButtonRef = useRef<HTMLButtonElement | null>(null);

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

  // Arrow keys navigation (ArrowLeft / ArrowRight) & Escape key listener
  useEffect(() => {
    if (!isFocusModeOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isPickerOpen) {
        setIsFocusModeOpen(false);
        exitFullscreenSafely();
        return;
      }

      // Do not trigger arrow cycling if focus is inside an input/slider
      if (document.activeElement?.tagName === 'INPUT') return;

      const keys = AVAILABLE_SCENES.map((s) => s.id);
      const curIndex = keys.indexOf(activeSceneId);

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        const nextKey = keys[(curIndex + 1) % keys.length];
        selectScene(nextKey);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const prevKey = keys[(curIndex - 1 + keys.length) % keys.length];
        selectScene(prevKey);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocusModeOpen, isPickerOpen, activeSceneId, selectScene, setIsFocusModeOpen]);

  if (!isFocusModeOpen) return null;

  // Calculate display time based on mode
  let displayTime = formatSeconds(elapsedSeconds);
  if (timerMode === 'pomodoro') {
    const target = pomodoroPhase === 'work' ? pomodoroWorkDuration : pomodoroBreakDuration;
    const remaining = Math.max(0, target - elapsedSeconds);
    displayTime = formatSeconds(remaining);
  }

  const isBreak = timerMode === 'pomodoro' && pomodoroPhase !== 'work';

  // Scene ambient text glow matching design concept
  const activeScene = getSceneById(activeSceneId);
  const sceneGlow = isBreak
    ? 'rgba(59, 130, 246, 0.4)'
    : activeScene?.glow || 'rgba(255,170,120,.45)';

  const subjectSubtitle = isBreak
    ? 'Rest Phase'
    : `Studying ${selectedSubject?.name || 'Deep Work'}`;

  return (
    <div
      data-theme="rank"
      style={{ colorScheme: 'dark' }}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center select-none overflow-hidden animate-in fade-in duration-500 transition-colors bg-[#05060a] ${
        isIdle && !isPickerOpen ? 'cursor-none' : 'cursor-default'
      }`}
    >
      {/* 1. Animated / Living Focus Scene Layer (z-0, pointer-events none) */}
      <FocusSceneLayer sceneId={activeSceneId} dim={dim} />

      {/* 2. Free User 8-Second Preview Toast / Pill */}
      {previewSceneId && previewSecondsLeft > 0 && (
        <ScenePreviewPill
          secondsLeft={previewSecondsLeft}
          onUnlockClick={() => openPremiumModal()}
        />
      )}

      {/* Invisible overlay that can be double-clicked to exit */}
      <div
        className="absolute inset-0 z-0"
        onDoubleClick={() => setIsFocusModeOpen(false)}
      />

      {/* 3. Big Clock with Space Grotesk tabular digits and scene-specific ambient glow */}
      <div
        className={`relative z-10 flex flex-col items-center justify-center text-center pointer-events-none transition-transform duration-700 ease-out ${
          isIdle && !isPickerOpen ? 'scale-105' : 'scale-100'
        }`}
      >
        {timerMode === 'pomodoro' && (
          <div className="mb-3 text-xs md:text-sm font-bold text-white/50 tracking-[0.3em] uppercase drop-shadow">
            {pomodoroPhase === 'work' ? 'Deep Focus' : 'Rest Phase'}
          </div>
        )}

        <div
          className="font-bold leading-none text-white tabular-nums select-none"
          style={{
            fontFamily: "'Space Grotesk', var(--font-hud), sans-serif",
            fontSize: 'clamp(64px, 14vw, 175px)',
            letterSpacing: '-0.03em',
            textShadow: `0 0 60px ${sceneGlow}, 0 2px 26px rgba(0,0,0,.45)`,
            transition: 'text-shadow 0.9s ease',
          }}
        >
          {displayTime}
        </div>

        <div
          className="mt-3.5 text-base sm:text-lg font-medium text-white/75 select-none"
          style={{
            fontFamily: "'Outfit', var(--font-geist-sans), sans-serif",
            textShadow: '0 1px 12px rgba(0,0,0,.5)',
          }}
        >
          {subjectSubtitle}
        </div>
      </div>

      {/* 4. Bottom Control Bar: Sleek Scene Pill Selector & Action Buttons */}
      <div
        className={`absolute bottom-[calc(22px+env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2 z-20 flex flex-wrap items-center justify-center gap-2 max-w-[calc(100%-24px)] transition-all duration-500 ease-in-out ${
          isIdle && !isPickerOpen ? 'opacity-0 translate-y-4 pointer-events-none' : 'opacity-100 translate-y-0'
        }`}
      >
        {/* Pill Group matching concept design */}
        <div
          role="group"
          aria-label="Scene selector"
          className="flex items-center gap-1 p-1 max-w-[calc(100vw-32px)] overflow-x-auto scrollbar-none rounded-full bg-[rgba(10,12,20,0.55)] border border-white/15 backdrop-blur-xl shadow-2xl"
        >
          {AVAILABLE_SCENES.map((scene) => {
            const isActive = activeSceneId === scene.id;
            const isLocked = scene.premium && !isPremium;

            return (
              <button
                key={scene.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => selectScene(scene.id)}
                className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full text-xs sm:text-[13px] font-medium transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-white/92 text-[#0b0d14] font-semibold shadow-md'
                    : 'bg-transparent text-white/80 hover:text-white hover:bg-white/10'
                }`}
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                <span>{scene.name}</span>
                {isLocked && (
                  <Crown className="w-3 h-3 text-[#E6C15A] fill-[#E6C15A] shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Action Controls: Dim / Customize & Exit Fullscreen */}
        <div className="flex items-center gap-2">
          {/* Dim & Scene Drawer Toggle */}
          <button
            ref={settingsButtonRef}
            type="button"
            onClick={() => setIsPickerOpen((prev) => !prev)}
            aria-haspopup="dialog"
            aria-expanded={isPickerOpen}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-[rgba(10,12,20,0.55)] hover:bg-white/15 border border-white/15 text-white/80 hover:text-white text-xs sm:text-[13px] font-medium backdrop-blur-xl shadow-xl transition-all cursor-pointer"
            title="Adjust dim & options"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Dim</span>
            <span className="font-mono text-[11px] text-white/60">{dim}%</span>
          </button>

          {/* Exit Fullscreen */}
          <button
            type="button"
            onClick={() => {
              setIsFocusModeOpen(false);
              exitFullscreenSafely();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[rgba(10,12,20,0.55)] hover:bg-white/15 border border-white/15 text-white/80 hover:text-white text-xs sm:text-[13px] font-medium backdrop-blur-xl shadow-xl transition-all cursor-pointer"
            title="Exit Fullscreen (ESC)"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exit</span>
            <span className="ml-1 px-1 py-0.2 rounded text-[10px] bg-black/40 text-white/50 font-mono">
              ESC
            </span>
          </button>
        </div>

        {/* Detailed Scene Drawer Popover */}
        <ScenePicker
          isOpen={isPickerOpen}
          onClose={() => setIsPickerOpen(false)}
          activeSceneId={activeSceneId}
          onSelectScene={(id) => selectScene(id)}
          dim={dim}
          onDimChange={setDim}
          isPremium={isPremium}
          triggerButtonRef={settingsButtonRef}
        />
      </div>
    </div>
  );
}
