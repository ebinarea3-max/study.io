'use client';

import React, { useEffect, useRef } from 'react';
import { AVAILABLE_SCENES, FocusScene } from './scenes/registry';
import { Lock, Check, X, Sparkles, Sliders } from 'lucide-react';

interface ScenePickerProps {
  isOpen: boolean;
  onClose: () => void;
  activeSceneId: string;
  onSelectScene: (id: string) => void;
  dim: number;
  onDimChange: (newDim: number) => void;
  isPremium: boolean;
  triggerButtonRef?: React.RefObject<HTMLButtonElement | null>;
}

export function ScenePicker({
  isOpen,
  onClose,
  activeSceneId,
  onSelectScene,
  dim,
  onDimChange,
  isPremium,
  triggerButtonRef,
}: ScenePickerProps) {
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Return focus to trigger button when picker closes
  const handleClose = React.useCallback(() => {
    onClose();
    if (triggerButtonRef?.current) {
      triggerButtonRef.current.focus();
    }
  }, [onClose, triggerButtonRef]);

  // Keyboard navigation & Escape key listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        handleClose();
        return;
      }

      // Handle arrow navigation between cards if a card is currently focused
      const activeElement = document.activeElement;
      const currentIndex = cardRefs.current.findIndex((el) => el === activeElement);
      if (currentIndex === -1) return;

      const total = AVAILABLE_SCENES.length;
      let nextIndex = -1;

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          nextIndex = (currentIndex + 1) % total;
          break;
        case 'ArrowLeft':
          e.preventDefault();
          nextIndex = (currentIndex - 1 + total) % total;
          break;
        case 'ArrowDown':
          e.preventDefault();
          nextIndex = currentIndex + 2 < total ? currentIndex + 2 : currentIndex;
          break;
        case 'ArrowUp':
          e.preventDefault();
          nextIndex = currentIndex - 2 >= 0 ? currentIndex - 2 : currentIndex;
          break;
        default:
          break;
      }

      if (nextIndex !== -1 && cardRefs.current[nextIndex]) {
        cardRefs.current[nextIndex]?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Invisible backdrop overlay to catch outside clicks */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs sm:bg-transparent"
        onClick={handleClose}
      />

      {/* Popover / Bottom Sheet */}
      <div
        ref={containerRef}
        role="dialog"
        aria-label="Focus scenes picker"
        className="fixed sm:absolute bottom-0 sm:bottom-full left-0 right-0 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:mb-3 z-50 w-full sm:w-[420px] bg-neutral-950/95 sm:bg-black/90 backdrop-blur-2xl border border-white/10 sm:rounded-3xl rounded-t-3xl p-5 shadow-2xl text-white animate-in slide-in-from-bottom-3 fade-in duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--tier-accent,rgb(245,158,11))]" />
            <h3 className="text-sm font-bold tracking-tight text-white uppercase font-hud">
              Focus Scenes
            </h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close scenes picker"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2-column Grid of Scene Cards */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          {AVAILABLE_SCENES.map((scene: FocusScene, index: number) => {
            const isSelected = activeSceneId === scene.id;
            const isLocked = scene.premium && !isPremium;

            return (
              <button
                key={scene.id}
                ref={(el) => {
                  cardRefs.current[index] = el;
                }}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onSelectScene(scene.id)}
                className={`relative flex flex-col text-left p-2.5 rounded-2xl border transition-all duration-200 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--tier-accent,#f59e0b)] group ${
                  isSelected
                    ? 'border-[var(--tier-accent,#f59e0b)] bg-white/[0.08] shadow-lg shadow-[var(--tier-accent,#f59e0b)]/10 ring-1 ring-[var(--tier-accent,#f59e0b)]/40'
                    : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20'
                }`}
              >
                {/* Thumbnail gradient preview */}
                <div
                  className="w-full h-16 rounded-xl mb-2 relative overflow-hidden border border-white/10"
                  style={{ background: scene.thumbnail }}
                >
                  {/* Lock icon for premium scenes when user is not premium */}
                  {isLocked && (
                    <div className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/60 backdrop-blur-md text-amber-400 border border-amber-400/30">
                      <Lock className="w-3 h-3" />
                    </div>
                  )}

                  {/* Check badge when selected */}
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 p-1 rounded-md bg-[var(--tier-accent,#f59e0b)] text-slate-950 font-bold">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>

                {/* Name & Description */}
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-semibold text-neutral-100 group-hover:text-white truncate">
                    {scene.name}
                  </span>
                  {scene.premium && (
                    <span className="text-[10px] uppercase font-bold text-amber-400/90 font-mono tracking-wider ml-1">
                      PRO
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-neutral-400 leading-tight mt-0.5 line-clamp-1">
                  {scene.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Dim slider (0 to 60%) */}
        <div className="pt-3 border-t border-white/10 mb-3">
          <div className="flex items-center justify-between mb-1.5 text-xs">
            <span className="flex items-center gap-1.5 text-neutral-300 font-medium">
              <Sliders className="w-3.5 h-3.5 text-neutral-400" />
              <span>Background Dim</span>
            </span>
            <span className="font-mono text-neutral-400 font-semibold">{dim}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="60"
            step="1"
            value={dim}
            onChange={(e) => onDimChange(parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-white/15 rounded-lg appearance-none cursor-pointer accent-[var(--tier-accent,#f59e0b)]"
            aria-label="Background Dim"
          />
        </div>

        {/* Short muted battery note */}
        <div className="text-[11px] text-neutral-500 text-center leading-normal">
          Scenes use more battery. Choose Default to turn them off.
        </div>
      </div>
    </>
  );
}

export function ScenePreviewPill({
  secondsLeft,
  onUnlockClick,
}: {
  secondsLeft: number;
  onUnlockClick: () => void;
}) {
  return (
    <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2 rounded-full bg-black/85 backdrop-blur-md border border-amber-500/30 shadow-2xl text-xs text-neutral-200 animate-in fade-in slide-in-from-top-2 duration-300">
      <span className="flex items-center gap-1.5 text-amber-400 font-medium">
        <Sparkles className="w-3.5 h-3.5" />
        <span>Previewing ({secondsLeft}s)</span>
      </span>
      <span className="text-neutral-500">•</span>
      <button
        type="button"
        onClick={onUnlockClick}
        className="text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-2 transition-colors cursor-pointer"
      >
        Unlock with Premium
      </button>
    </div>
  );
}
