'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useStudy } from '../../context/StudyContext';
import { formatSeconds } from '../../lib/utils';
import { Minimize2, Sliders, Crown, Music, Play, Pause, Square } from 'lucide-react';
import { FocusSceneLayer } from '../focus/FocusSceneLayer';
import { useFocusScene } from '../focus/useFocusScene';
import { ScenePicker, ScenePreviewPill } from '../focus/ScenePicker';
import { AtmospherePicker } from '../focus/AtmospherePicker';
import { useAtmosphere } from '../focus/useAtmosphere';
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
    isStudying,
    isPaused,
    isRunning,
    pauseTimer,
    resumeTimer,
    stopTimer,
    startTimer,
  } = useStudy();

  const [isSaving, setIsSaving] = useState(false);
  const [isIdle, setIsIdle] = useState(false);
  const isIdleRef = useRef(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isAtmosphereOpen, setIsAtmosphereOpen] = useState(false);
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const settingsButtonRef = useRef<HTMLButtonElement | null>(null);
  const atmosphereButtonRef = useRef<HTMLButtonElement | null>(null);

  const handlePause = () => {
    pauseTimer();
  };

  const handleResume = () => {
    resumeTimer();
  };

  const handleStop = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      setIsFocusModeOpen(false);
      exitFullscreenSafely();
      await stopTimer();
    } catch (err) {
      console.error('Error stopping focus session:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStart = () => {
    if (selectedSubject?.id) {
      startTimer(selectedSubject.id);
    } else {
      startTimer();
    }
  };

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

  // Atmosphere ambient audio hook
  const { ambientSound, activeOption: activeAtmosphereOption } = useAtmosphere();

  // Auto-hide UI when mouse is idle (keep visible while picker or atmosphere is open)
  // Debounced with requestAnimationFrame to eliminate all mousemove main-thread jank
  useEffect(() => {
    if (!isFocusModeOpen) return;

    let rafId: number | null = null;
    let lastActivityTime = 0;

    const handlePointerActivity = () => {
      const now = Date.now();

      // Only update React state if currently idle (prevents re-renders while moving mouse)
      if (isIdleRef.current) {
        isIdleRef.current = false;
        setIsIdle(false);
      }

      // Throttle timeout resets to at most once per 250ms
      if (now - lastActivityTime < 250) return;
      lastActivityTime = now;

      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
      if (!isPickerOpen && !isAtmosphereOpen) {
        idleTimeoutRef.current = setTimeout(() => {
          isIdleRef.current = true;
          setIsIdle(true);
        }, 3000);
      }
    };

    const onPointerEvent = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        handlePointerActivity();
      });
    };

    window.addEventListener('mousemove', onPointerEvent, { passive: true });
    window.addEventListener('mousedown', onPointerEvent, { passive: true });
    window.addEventListener('keydown', onPointerEvent, { passive: true });

    handlePointerActivity();

    return () => {
      window.removeEventListener('mousemove', onPointerEvent);
      window.removeEventListener('mousedown', onPointerEvent);
      window.removeEventListener('keydown', onPointerEvent);
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    };
  }, [isFocusModeOpen, isPickerOpen, isAtmosphereOpen]);

  // Arrow keys navigation (ArrowLeft / ArrowRight) & Escape key listener
  useEffect(() => {
    if (!isFocusModeOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isAtmosphereOpen) {
          setIsAtmosphereOpen(false);
          return;
        }
        if (isPickerOpen) {
          setIsPickerOpen(false);
          return;
        }
        setIsFocusModeOpen(false);
        exitFullscreenSafely();
        return;
      }

      // Do not trigger shortcuts if focus is inside an input, textarea or slider
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

      // Spacebar toggles pause / resume / start
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        if (isStudying && !isPaused) {
          handlePause();
        } else if (isStudying && isPaused) {
          handleResume();
        } else if (!isStudying) {
          handleStart();
        }
        return;
      }

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
  }, [
    isFocusModeOpen,
    isPickerOpen,
    isAtmosphereOpen,
    activeSceneId,
    selectScene,
    setIsFocusModeOpen,
    isStudying,
    isPaused,
    handlePause,
    handleResume,
    handleStart,
  ]);

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
      style={{ colorScheme: 'dark' }}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center select-none overflow-hidden animate-in fade-in duration-500 bg-[#05060a] ${
        isIdle && !isPickerOpen && !isAtmosphereOpen ? 'cursor-none' : 'cursor-default'
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
        className="absolute inset-0 z-0 pointer-events-auto"
        onDoubleClick={() => setIsFocusModeOpen(false)}
      />

      {/* 3. Big Clock with Space Grotesk tabular digits and scene-specific ambient glow */}
      <div
        className="relative z-10 flex flex-col items-center justify-center text-center pointer-events-none"
        style={{
          contain: 'layout style',
          transform: 'translate3d(0, 0, 0)',
          isolation: 'isolate',
        }}
      >
        {/* Soft GPU-accelerated ambient glow layer behind clock (zero per-tick rasterization lag) */}
        <div
          className="absolute inset-0 -z-10 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 70% 50% at 50% 50%, ${sceneGlow} 0%, transparent 75%)`,
            opacity: 0.75,
            transition: 'background 0.9s ease',
          }}
        />

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
            textShadow: `0 0 20px ${sceneGlow}, 0 2px 14px rgba(0,0,0,0.6)`,
            transition: 'text-shadow 0.9s ease',
          }}
        >
          {displayTime}
        </div>

        <div
          className="mt-3.5 text-base sm:text-lg font-medium text-white/75 select-none flex items-center justify-center gap-2.5"
          style={{
            fontFamily: "'Outfit', var(--font-geist-sans), sans-serif",
            textShadow: '0 1px 12px rgba(0,0,0,.5)',
          }}
        >
          <span>{subjectSubtitle}</span>
          {isPaused && (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-hud font-bold tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm animate-pulse">
              Paused
            </span>
          )}
        </div>
      </div>

      {/* 4. Bottom Control Bar: Compact Timer Playback, Scene Selector & Utility Controls */}
      <div
        className={`absolute bottom-[calc(22px+env(safe-area-inset-bottom,0px))] left-1/2 z-20 flex flex-col items-center justify-center gap-2.5 max-w-[calc(100%-24px)] transition-[opacity,transform] duration-250 ease-out will-change-[opacity,transform] ${
          isIdle && !isPickerOpen && !isAtmosphereOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        style={{
          transform: isIdle && !isPickerOpen && !isAtmosphereOpen
            ? 'translate3d(-50%, 12px, 0)'
            : 'translate3d(-50%, 0, 0)',
          contain: 'layout style',
          isolation: 'isolate',
          backfaceVisibility: 'hidden',
        }}
      >
        {/* Compact Timer Playback Controls (Start / Pause / Resume / Stop) positioned right above scene pills */}
        <div className="flex items-center justify-center gap-2">
          {isStudying && !isPaused ? (
            <>
              <button
                type="button"
                onClick={handlePause}
                className="flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/15 hover:bg-white/25 border border-white/25 hover:border-white/40 text-white font-medium text-xs sm:text-[13px] backdrop-blur-md shadow-[0_4px_16px_rgba(0,0,0,0.4)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
                title="Pause timer (Space)"
              >
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause</span>
              </button>

              <button
                type="button"
                onClick={handleStop}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 hover:border-rose-400 text-rose-200 font-medium text-xs sm:text-[13px] backdrop-blur-md shadow-[0_4px_16px_rgba(244,63,94,0.2)] hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                title="Stop & save session"
              >
                {isSaving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-rose-300 border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Stop</span>
                  </>
                )}
              </button>
            </>
          ) : isStudying && isPaused ? (
            <>
              <button
                type="button"
                onClick={handleResume}
                className="flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-emerald-500/25 hover:bg-emerald-500/35 border border-emerald-400/50 hover:border-emerald-300 text-emerald-200 font-semibold text-xs sm:text-[13px] backdrop-blur-md shadow-[0_4px_16px_rgba(16,185,129,0.25)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
                title="Resume timer (Space)"
              >
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                <span>Resume</span>
              </button>

              <button
                type="button"
                onClick={handleStop}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 hover:border-rose-400 text-rose-200 font-medium text-xs sm:text-[13px] backdrop-blur-md shadow-[0_4px_16px_rgba(244,63,94,0.2)] hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                title="Stop & save session"
              >
                {isSaving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-rose-300 border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Stop</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleStart}
              className="flex items-center gap-1.5 px-4 sm:px-4.5 py-1.5 sm:py-2 rounded-full bg-white hover:bg-neutral-100 text-neutral-950 font-semibold text-xs sm:text-[13px] shadow-[0_4px_16px_rgba(255,255,255,0.25)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
              title="Start timer (Space)"
            >
              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
              <span>Start</span>
            </button>
          )}
        </div>

        {/* Pill Group matching concept design without heavy backdrop-filter blur passes */}
        <div
          role="group"
          aria-label="Scene selector"
          className="flex items-center gap-1 p-1 max-w-[calc(100vw-32px)] overflow-x-auto scrollbar-none rounded-full bg-[#090b14]/92 border border-white/15 shadow-[0_12px_40px_rgba(0,0,0,0.7)]"
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
                className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full text-xs sm:text-[13px] font-medium transition-colors shrink-0 cursor-pointer ${
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

        {/* Action Controls: Atmosphere, Dim & Exit Fullscreen */}
        <div className="flex items-center gap-2">

          {/* Atmosphere Audio Soundscapes Toggle */}
          <button
            ref={atmosphereButtonRef}
            type="button"
            onClick={() => {
              setIsAtmosphereOpen((prev) => !prev);
              if (isPickerOpen) setIsPickerOpen(false);
            }}
            aria-haspopup="dialog"
            aria-expanded={isAtmosphereOpen}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-full border text-xs sm:text-[13px] font-medium shadow-[0_8px_24px_rgba(0,0,0,0.5)] transition-colors cursor-pointer ${
              ambientSound !== 'none'
                ? 'bg-white/20 text-white border-white/35 font-semibold'
                : 'bg-[#090b14]/92 hover:bg-white/15 border-white/15 text-white/80 hover:text-white'
            }`}
            title="Atmosphere soundscapes"
          >
            <Music className={`w-3.5 h-3.5 ${ambientSound !== 'none' ? 'text-amber-400' : 'text-white/80'}`} />
            <span>Atmosphere</span>
            {ambientSound !== 'none' ? (
              <span className="flex items-center gap-1">
                <span className="font-mono text-[11px] text-white/80 max-w-[95px] truncate hidden sm:inline">
                  {activeAtmosphereOption?.label} {isPaused ? '(Paused)' : ''}
                </span>
                <span
                  className={`w-1.5 h-1.5 rounded-full ml-0.5 ${
                    isPaused ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'
                  }`}
                />
              </span>
            ) : null}
          </button>

          {/* Dim & Scene Drawer Toggle */}
          <button
            ref={settingsButtonRef}
            type="button"
            onClick={() => {
              setIsPickerOpen((prev) => !prev);
              if (isAtmosphereOpen) setIsAtmosphereOpen(false);
            }}
            aria-haspopup="dialog"
            aria-expanded={isPickerOpen}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-[#090b14]/92 hover:bg-white/15 border border-white/15 text-white/80 hover:text-white text-xs sm:text-[13px] font-medium shadow-[0_8px_24px_rgba(0,0,0,0.5)] transition-colors cursor-pointer"
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
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#090b14]/92 hover:bg-white/15 border border-white/15 text-white/80 hover:text-white text-xs sm:text-[13px] font-medium shadow-[0_8px_24px_rgba(0,0,0,0.5)] transition-colors cursor-pointer"
            title="Exit Fullscreen (ESC)"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exit</span>
            <span className="ml-1 px-1 py-0.2 rounded text-[10px] bg-black/40 text-white/50 font-mono">
              ESC
            </span>
          </button>
        </div>

        {/* Atmosphere Audio Drawer Popover */}
        <AtmospherePicker
          isOpen={isAtmosphereOpen}
          onClose={() => setIsAtmosphereOpen(false)}
          triggerButtonRef={atmosphereButtonRef}
        />

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
