'use client';

import React, { useRef, useEffect, useState, useId } from 'react';
import type { EmblemStage } from './emblemStages';
import {
  type EmblemFamilyId,
  type EmblemState,
  type EmblemSize,
  EMBLEM_FAMILIES,
  resolveEmblemFamily,
} from './emblemRegistry';
import { SparkEmblem } from './SparkEmblem';
import { CrystalEmblem } from './CrystalEmblem';
import { useCanAnimateEmblem } from './emblemVisibilityManager';

export interface GrowthEmblemProps {
  family?: EmblemFamilyId | string | null;
  stage: EmblemStage;
  state?: EmblemState;
  size?: EmblemSize;
  isPremium?: boolean;
  className?: string;
  showPips?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  style?: React.CSSProperties;
}

const SIZE_PX: Record<EmblemSize, number> = {
  sm: 64,
  md: 112,
  lg: 200,
};

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return reduced;
}

export function GrowthEmblem({
  family,
  stage,
  state = 'studying',
  size = 'md',
  isPremium = false,
  className = '',
  showPips = true,
  onClick,
  style,
}: GrowthEmblemProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const uid = useId().replace(/:/g, '_');

  const resolvedFamily = resolveEmblemFamily(family, isPremium);
  const meta = EMBLEM_FAMILIES[resolvedFamily] || EMBLEM_FAMILIES.spark;

  const isStudying = state === 'studying';
  const isPaused = state === 'paused';
  const isOffline = state === 'offline';

  // Performance visibility manager (IntersectionObserver + 24 active animations cap)
  const canAnimate = useCanAnimateEmblem(containerRef, isStudying);
  const px = SIZE_PX[size] || 112;

  // Level-up moment state tracking
  const [isLevelingUp, setIsLevelingUp] = useState(false);
  const [showLevelUpChip, setShowLevelUpChip] = useState(false);
  const prevStageRef = useRef<number | null>(null);
  const isInitialMountRef = useRef(true);

  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      prevStageRef.current = stage;
      return;
    }

    if (
      prevStageRef.current !== null &&
      stage > prevStageRef.current &&
      typeof document !== 'undefined' &&
      !document.hidden
    ) {
      // Trigger level-up moment (700ms scale tween, sheen, sparkles, 3s chip)
      setIsLevelingUp(true);
      setShowLevelUpChip(true);

      const animTimer = setTimeout(() => {
        setIsLevelingUp(false);
      }, 750);

      const chipTimer = setTimeout(() => {
        setShowLevelUpChip(false);
      }, 3000);

      prevStageRef.current = stage;
      return () => {
        clearTimeout(animTimer);
        clearTimeout(chipTimer);
      };
    }

    prevStageRef.current = stage;
  }, [stage]);

  const renderScene = () => {
    switch (resolvedFamily) {
      case 'spark':
        return (
          <SparkEmblem
            stage={stage}
            state={state}
            canAnimate={canAnimate}
            reducedMotion={reducedMotion}
          />
        );
      case 'crystal':
        return (
          <CrystalEmblem
            stage={stage}
            state={state}
            canAnimate={canAnimate}
            reducedMotion={reducedMotion}
          />
        );
      case 'bloom':
      case 'stars':
      case 'summit':
      case 'skyline':
      default:
        // In Phase 1, Crystal serves as the premium implementation; Phase 2 expands the remaining 4
        return (
          <CrystalEmblem
            stage={stage}
            state={state}
            canAnimate={canAnimate}
            reducedMotion={reducedMotion}
          />
        );
    }
  };

  return (
    <div
      ref={containerRef}
      onClick={onClick}
      className={`relative inline-flex flex-col items-center shrink-0 select-none ${className}`}
      style={{
        width: px,
        ...style,
      }}
      role="img"
      aria-label={`${meta.name} emblem (Stage ${stage}, ${state})`}
    >
      <style>{`
        @keyframes emblem-glow-pulse-${uid} {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 0.8; }
        }
        @keyframes emblem-levelup-${uid} {
          0% { transform: scale(1); }
          40% { transform: scale(1.12); }
          100% { transform: scale(1); }
        }
        @keyframes sheen-sweep-${uid} {
          0% { transform: translateX(-150%) skewX(-25deg); opacity: 0; }
          40% { opacity: 0.8; }
          100% { transform: translateX(180%) skewX(-25deg); opacity: 0; }
        }
        @keyframes sparkle-burst-${uid} {
          0% { transform: translate(0, 0) scale(0.5); opacity: 0; }
          40% { opacity: 1; }
          100% { transform: translate(var(--tx), var(--ty)) scale(1.2); opacity: 0; }
        }
        .anim-emblem-glow-${uid} {
          animation: emblem-glow-pulse-${uid} 3.2s ease-in-out infinite;
        }
        .anim-levelup-${uid} {
          animation: emblem-levelup-${uid} 700ms ease-in-out;
        }
        .anim-sheen-${uid} {
          animation: sheen-sweep-${uid} 700ms ease-out;
        }
      `}</style>

      {/* 1. Ambient Glow Layer (family key color, opacity-only fade) */}
      {!isOffline && (
        <div
          aria-hidden="true"
          className={`absolute pointer-events-none transition-opacity duration-500 ${
            isStudying && canAnimate && !reducedMotion ? `anim-emblem-glow-${uid}` : ''
          }`}
          style={{
            top: 0,
            left: 0,
            right: 0,
            height: px,
            borderRadius: '26%',
            background: meta.palette.glow,
            filter: `blur(${Math.max(6, Math.round(px * 0.14))}px)`,
            opacity: isPaused ? 0.2 : 0.65,
            zIndex: 0,
          }}
        />
      )}

      {/* 2. Rounded-Square Diorama Tile (about 22% radius) */}
      <div
        className={`relative w-full overflow-hidden transition-all duration-300 ${
          isLevelingUp && !reducedMotion ? `anim-levelup-${uid}` : ''
        }`}
        style={{
          height: px,
          borderRadius: '22%',
          background: `linear-gradient(135deg, ${meta.palette.bg1} 0%, ${meta.palette.bg2} 100%)`,
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 4px 16px rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(255, 255, 255, 0.09)',
          opacity: isOffline ? 0.55 : 1,
          zIndex: 1,
        }}
      >
        {/* Soft Inner Highlight */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            borderRadius: '22%',
            background:
              'radial-gradient(ellipse at top left, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0) 65%)',
          }}
        />

        {/* Level-Up Sheen Sweep Overlay */}
        {isLevelingUp && !reducedMotion && (
          <div
            aria-hidden="true"
            className={`absolute inset-0 pointer-events-none z-20 anim-sheen-${uid}`}
            style={{
              background:
                'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.85), transparent)',
              width: '60%',
            }}
          />
        )}

        {/* Level-up Sparkles Burst */}
        {isLevelingUp && !reducedMotion && (
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none z-20">
            {[
              { x: '-18px', y: '-28px', delay: '0ms' },
              { x: '22px', y: '-32px', delay: '80ms' },
              { x: '-26px', y: '12px', delay: '120ms' },
              { x: '24px', y: '18px', delay: '60ms' },
              { x: '-10px', y: '-38px', delay: '150ms' },
              { x: '12px', y: '-40px', delay: '100ms' },
            ].map((sp, idx) => (
              <div
                key={idx}
                className="absolute w-1.5 h-1.5 rounded-full bg-white"
                style={{
                  top: '50%',
                  left: '50%',
                  '--tx': sp.x,
                  '--ty': sp.y,
                  animation: `sparkle-burst-${uid} 650ms ease-out forwards`,
                  animationDelay: sp.delay,
                  boxShadow: `0 0 6px ${meta.palette.key}`,
                } as any}
              />
            ))}
          </div>
        )}

        {/* Living SVG Artwork */}
        <div className="absolute inset-0 flex items-center justify-center p-[4%] z-10">
          {renderScene()}
        </div>
      </div>

      {/* 3. Stage Indicator: 7 Tiny Pips Below Tile */}
      {showPips && (
        <div className="flex items-center justify-center gap-1 mt-2 z-10">
          {([0, 1, 2, 3, 4, 5, 6] as const).map((pip) => {
            const isFilled = pip <= stage;
            return (
              <span
                key={pip}
                className={`transition-all duration-300 rounded-full ${
                  isFilled ? 'scale-100 opacity-100' : 'scale-75 opacity-25'
                }`}
                style={{
                  width: px >= 112 ? 4.5 : 3.5,
                  height: px >= 112 ? 4.5 : 3.5,
                  background: isFilled ? meta.palette.key : 'rgba(255, 255, 255, 0.4)',
                  boxShadow: isFilled ? `0 0 4px ${meta.palette.key}` : 'none',
                }}
              />
            );
          })}
        </div>
      )}

      {/* Level-Up Toast Chip: Fades in under emblem for 3 seconds */}
      {showLevelUpChip && (
        <div
          className="absolute -bottom-7 left-1/2 -translate-x-1/2 z-30 px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-hud font-bold text-[9px] uppercase tracking-wider shadow-lg shadow-amber-500/30 whitespace-nowrap animate-in fade-in zoom-in-95 duration-200"
          style={{
            animation: 'fadeIn 200ms ease, fadeOut 400ms ease 2600ms forwards',
          }}
        >
          Stage {stage} Reached!
        </div>
      )}
    </div>
  );
}
