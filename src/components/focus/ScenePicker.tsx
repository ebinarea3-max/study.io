import React, { useEffect, useRef, useCallback, useState } from 'react';
import { AVAILABLE_SCENES, FocusScene } from './scenes/registry';
import {
  Lock,
  Check,
  X,
  Sparkles,
  Sliders,
  Crown,
  Music,
  CloudRain,
  Flame,
  Waves,
  Coffee,
  Headphones,
  Radio,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { getSceneThumbnailDataUrl } from './scenes/thumbnailRenderer';
import { getSvgScene } from './scenes/svgScenes';
import { useAtmosphere, AtmosphereOption, AtmosphereSoundId } from './useAtmosphere';

interface ScenePickerProps {
  isOpen: boolean;
  onClose: () => void;
  activeSceneId: string;
  onSelectScene: (id: string) => void;
  dim: number;
  onDimChange: (newDim: number) => void;
  isPremium: boolean;
  triggerButtonRef?: React.RefObject<HTMLButtonElement | null>;
  initialTab?: 'scenes' | 'atmosphere';
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
  initialTab = 'scenes',
}: ScenePickerProps) {
  const [activeTab, setActiveTab] = useState<'scenes' | 'atmosphere'>(initialTab);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const {
    ambientSound,
    ambientVolume,
    selectAtmosphere,
    setVolume: setAtmosphereVolume,
    options: atmosphereOptions,
  } = useAtmosphere();

  // Reset tab when reopened
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Return focus to trigger button when picker closes
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

      // Handle arrow navigation between cards if a card is currently focused
      const activeElement = document.activeElement;
      const currentIndex = cardRefs.current.findIndex((el) => el === activeElement);
      if (currentIndex === -1) return;

      const total = activeTab === 'scenes' ? AVAILABLE_SCENES.length : atmosphereOptions.length;
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
  }, [isOpen, handleClose, activeTab, atmosphereOptions.length]);

  if (!isOpen) return null;

  const renderAtmosphereIcon = (id: AtmosphereSoundId, isSelected: boolean) => {
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

      {/* Picker: bottom sheet on mobile (<640px) and anchored side panel on desktop to avoid covering center timer digits */}
      <div
        role="dialog"
        aria-label="Focus scenes picker"
        className="fixed z-50 bg-neutral-950/95 sm:bg-neutral-950/90 backdrop-blur-2xl border border-white/10 shadow-2xl text-white animate-in slide-in-from-bottom-3 fade-in duration-200
          max-sm:inset-x-0 max-sm:bottom-0 max-sm:rounded-t-3xl max-sm:p-5 max-sm:max-h-[75vh] max-sm:overflow-y-auto
          sm:right-8 sm:bottom-8 sm:w-[420px] sm:rounded-3xl sm:p-5"
      >
        {/* Header with Scenes / Atmosphere Tabs */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3.5">
          <div className="flex items-center gap-1.5 p-0.5 rounded-full bg-white/[0.06] border border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab('scenes')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'scenes'
                  ? 'bg-white/90 text-neutral-950 shadow-sm font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Scenes
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('atmosphere')}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'atmosphere'
                  ? 'bg-white/90 text-neutral-950 shadow-sm font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Music className="w-3 h-3" />
              <span>Atmosphere</span>
              {ambientSound !== 'none' && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
              )}
            </button>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close picker"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {activeTab === 'scenes' ? (
          <>
            {/* 2-column Grid of 16:9 Scene Cards */}
            <div className="grid grid-cols-2 gap-3 mb-4 max-h-[50vh] sm:max-h-[380px] overflow-y-auto pr-0.5 scrollbar-thin">
              {AVAILABLE_SCENES.map((scene: FocusScene, index: number) => {
                const isSelected = activeSceneId === scene.id;
                const isLocked = scene.premium && !isPremium;
                const svgMarkup = getSvgScene(scene.id);
                const thumbUrl = !svgMarkup ? getSceneThumbnailDataUrl(scene.id) : null;

                return (
                  <button
                    key={scene.id}
                    ref={(el) => {
                      cardRefs.current[index] = el;
                    }}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => onSelectScene(scene.id)}
                    className={`relative flex flex-col rounded-2xl border overflow-hidden transition-all duration-200 cursor-pointer outline-none group text-left ${
                      isSelected
                        ? 'border-[var(--tier-accent,#f59e0b)] ring-2 ring-[var(--tier-accent,#f59e0b)]/60 shadow-[0_0_24px_rgba(245,158,11,0.35)] scale-[1.01]'
                        : 'border-white/10 bg-white/[0.03] hover:border-white/30 hover:bg-white/[0.06] hover:scale-[1.01]'
                    }`}
                  >
                    {/* 16:9 Thumbnail preview filling the card */}
                    <div
                      className="w-full aspect-video relative overflow-hidden bg-neutral-900"
                      style={{ background: scene.thumbnail }}
                    >
                      {svgMarkup ? (
                        <div
                          className="w-full h-full pointer-events-none select-none transition-transform duration-300 group-hover:scale-105 [&_svg]:w-full [&_svg]:h-full [&_svg]:object-cover [&_svg_*]:!animation-none"
                          dangerouslySetInnerHTML={{ __html: svgMarkup }}
                        />
                      ) : thumbUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={thumbUrl}
                          alt={scene.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : null}

                      {/* Lock overlay for free users on premium scenes */}
                      {isLocked && (
                        <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px] flex items-center justify-center">
                          <div className="p-1.5 rounded-full bg-black/75 border border-amber-400/40 text-[#E6C15A] shadow-md">
                            <Lock className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      )}

                      {/* Check badge when selected */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 p-1 rounded-md bg-[var(--tier-accent,#f59e0b)] text-slate-950 font-bold shadow-md z-10">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}

                      {/* Soft bottom gradient overlay with name and crown */}
                      <div className="absolute inset-x-0 bottom-0 pt-6 pb-2 px-2.5 bg-gradient-to-t from-black/95 via-black/60 to-transparent flex items-center justify-between pointer-events-none">
                        <span className="text-[11px] sm:text-xs font-semibold text-white drop-shadow-md truncate">
                          {scene.name}
                        </span>
                        {scene.premium && (
                          <Crown className="w-3.5 h-3.5 text-[#E6C15A] fill-[#E6C15A] shrink-0 drop-shadow ml-1" />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Background Dim slider (default 20%, range 0 to 60%) */}
            <div className="pt-2.5 border-t border-white/10 mb-2.5">
              <div className="flex items-center justify-between mb-1.5 text-xs">
                <span className="flex items-center gap-1.5 text-neutral-300 font-medium">
                  <Sliders className="w-3 h-3 text-neutral-400" />
                  <span>Background Dim</span>
                </span>
                <span className="font-mono text-neutral-400 text-[11px] font-semibold">{dim}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                step="1"
                value={dim}
                onChange={(e) => onDimChange(parseInt(e.target.value, 10))}
                className="w-full h-1 bg-white/15 rounded-lg appearance-none cursor-pointer accent-[var(--tier-accent,#f59e0b)]"
                aria-label="Background Dim"
              />
            </div>

            {/* Quiet battery consumption note */}
            <div className="text-[10px] text-neutral-400 text-center tracking-tight">
              Scenes use more battery • Choose Default to turn off
            </div>
          </>
        ) : (
          <>
            {/* Atmosphere Soundscape Grid */}
            <div className="grid grid-cols-2 gap-2 mb-3.5 max-h-[50vh] sm:max-h-[340px] overflow-y-auto pr-0.5 scrollbar-thin">
              {atmosphereOptions.map((opt: AtmosphereOption, index: number) => {
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
                    <div className="mt-0.5">{renderAtmosphereIcon(opt.id, isSelected)}</div>
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
                  onChange={(e) => setAtmosphereVolume(parseFloat(e.target.value))}
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
          </>
        )}
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
