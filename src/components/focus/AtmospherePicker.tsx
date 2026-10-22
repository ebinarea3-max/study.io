'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import {
  X,
  Check,
  Volume2,
  VolumeX,
  CloudRain,
  Flame,
  Waves,
  Coffee,
  Headphones,
  Radio,
  Music,
} from 'lucide-react';
import { useAtmosphere, AtmosphereOption, AtmosphereSoundId } from './useAtmosphere';

interface AtmospherePickerProps {
  isOpen: boolean;
  onClose: () => void;
  triggerButtonRef?: React.RefObject<HTMLButtonElement | null>;
}

export function AtmospherePicker({
  isOpen,
  onClose,
  triggerButtonRef,
}: AtmospherePickerProps) {
  const {
    ambientSound,
    ambientVolume,
    selectAtmosphere,
    setVolume,
    options,
  } = useAtmosphere();

  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleClose = useCallback(() => {
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

      const activeElement = document.activeElement;
      const currentIndex = cardRefs.current.findIndex((el) => el === activeElement);
      if (currentIndex === -1) return;

      const total = options.length;
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
  }, [isOpen, handleClose, options.length]);

  if (!isOpen) return null;

  const renderIcon = (id: AtmosphereSoundId, isSelected: boolean) => {
    const iconClass = `w-4 h-4 shrink-0 transition-colors ${
      isSelected ? 'text-[var(--tier-accent,#f59e0b)]' : 'text-neutral-400 group-hover:text-white'
    }`;

    switch (id) {
      case 'none':
        return <VolumeX className={iconClass} />;
      case 'rain':
        return <CloudRain className={iconClass} />;
      case 'campfire':
        return <Flame className={iconClass} />;
      case 'waves':
        return <Waves className={iconClass} />;
      case 'lofi':
        return <Coffee className={iconClass} />;
      case 'brownnoise':
        return <Headphones className={iconClass} />;
      case 'pinknoise':
        return <Radio className={iconClass} />;
      case 'whitenoise':
        return <Radio className={iconClass} />;
      default:
        return <Music className={iconClass} />;
    }
  };

  return (
    <>
      {/* Invisible backdrop overlay to catch outside clicks */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs sm:bg-transparent"
        onClick={handleClose}
      />

      {/* Picker: bottom sheet on mobile (<640px) and anchored floating panel on desktop */}
      <div
        role="dialog"
        aria-label="Atmosphere audio picker"
        className="fixed z-50 bg-neutral-950/95 sm:bg-neutral-950/92 backdrop-blur-2xl border border-white/10 shadow-2xl text-white animate-in slide-in-from-bottom-3 fade-in duration-200
          max-sm:inset-x-0 max-sm:bottom-0 max-sm:rounded-t-3xl max-sm:p-5 max-sm:max-h-[80vh] max-sm:overflow-y-auto
          sm:left-1/2 sm:-translate-x-1/2 sm:bottom-24 sm:w-[400px] sm:rounded-3xl sm:p-5"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--tier-accent,#f59e0b)] shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
            <h3 className="text-xs sm:text-sm font-bold tracking-tight text-white uppercase font-hud flex items-center gap-2">
              <Music className="w-4 h-4 text-[var(--tier-accent,#f59e0b)]" />
              <span>Atmosphere</span>
            </h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close atmosphere picker"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2-column Grid of Atmosphere Cards */}
        <div className="grid grid-cols-2 gap-2 mb-3.5 max-h-[320px] overflow-y-auto pr-0.5 scrollbar-thin">
          {options.map((opt: AtmosphereOption, index: number) => {
            const isSelected = ambientSound === opt.id;

            return (
              <button
                key={opt.id}
                ref={(el) => {
                  cardRefs.current[index] = el;
                }}
                type="button"
                aria-pressed={isSelected}
                onClick={() => selectAtmosphere(opt.id)}
                className={`relative flex items-start gap-2.5 p-3 rounded-2xl border text-left transition-all duration-150 cursor-pointer outline-none group ${
                  isSelected
                    ? 'border-[var(--tier-accent,#f59e0b)] bg-[var(--tier-accent,#f59e0b)]/10 ring-1 ring-[var(--tier-accent,#f59e0b)]/50 shadow-[0_0_18px_rgba(245,158,11,0.2)]'
                    : 'border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]'
                }`}
              >
                <div className="mt-0.5">{renderIcon(opt.id, isSelected)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-semibold text-white truncate drop-shadow-sm">
                      {opt.label}
                    </span>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-[var(--tier-accent,#f59e0b)] shrink-0 stroke-[2.5]" />
                    )}
                  </div>
                  <p className="text-[10px] text-neutral-400 truncate mt-0.5 leading-snug">
                    {opt.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Volume Slider Section */}
        {ambientSound !== 'none' && (
          <div className="pt-3 border-t border-white/10 mb-2">
            <div className="flex items-center justify-between mb-2 text-xs">
              <span className="flex items-center gap-1.5 text-neutral-300 font-medium">
                <Volume2 className="w-3.5 h-3.5 text-neutral-400" />
                <span>Volume</span>
              </span>
              <span className="font-mono text-neutral-400 text-[11px] font-semibold">
                {Math.round(ambientVolume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={ambientVolume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-white/15 rounded-lg appearance-none cursor-pointer accent-[var(--tier-accent,#f59e0b)]"
              aria-label="Atmosphere Volume"
            />
          </div>
        )}

        {/* Bottom Helper Note */}
        <div className="text-[10px] text-neutral-400 text-center tracking-tight pt-1">
          {ambientSound === 'none'
            ? 'Select a soundscape to play calming background audio'
            : 'Audio loops seamlessly in the background'}
        </div>
      </div>
    </>
  );
}
