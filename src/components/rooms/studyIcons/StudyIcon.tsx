'use client';

import React, { useRef, useEffect, useState, useId } from 'react';
import type { StudyIconId, StudyIconState, StudyIconSize } from './registry';
import { STUDY_ICONS, getDefaultIconId, isFreeIconId } from './registry';
import { LampIcon } from './LampIcon';
import { BookIcon } from './BookIcon';
import { PencilIcon } from './PencilIcon';
import { CoffeeIcon } from './CoffeeIcon';
import { PremiumPlaceholderIcon } from './PremiumPlaceholderIcon';
import { useCanAnimateIcon } from './iconVisibilityManager';

export interface StudyIconProps {
  id?: StudyIconId | string | null;
  userId?: string;
  state?: StudyIconState;
  size?: StudyIconSize;
  isPremium?: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  style?: React.CSSProperties;
}

const SIZE_PX: Record<StudyIconSize, number> = {
  sm: 36,
  md: 64,
  lg: 120,
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

export function StudyIcon({
  id,
  userId,
  state = 'studying',
  size = 'md',
  isPremium = false,
  className = '',
  onClick,
  style,
}: StudyIconProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const uid = useId().replace(/:/g, '_');

  // Resolve icon ID with fallback
  let resolvedId: StudyIconId;
  const rawId = (id as StudyIconId) || null;

  if (rawId && STUDY_ICONS[rawId]) {
    // If icon is premium and user is NOT premium, fall back to stable free icon
    if (STUDY_ICONS[rawId].premium && !isPremium) {
      resolvedId = getDefaultIconId(userId || 'default_user');
    } else {
      resolvedId = rawId;
    }
  } else {
    // Member with no choice or unknown id gets stable free icon
    resolvedId = getDefaultIconId(userId || 'default_user');
  }

  const meta = STUDY_ICONS[resolvedId] || STUDY_ICONS.lamp;
  const isStudying = state === 'studying';
  const isPaused = state === 'paused';
  const isIdle = state === 'idle';

  // Performance hook: enforces visibility, 24-cap, and document visibility
  const canAnimate = useCanAnimateIcon(containerRef, isStudying);
  const px = SIZE_PX[size] || 64;

  const renderIconSvg = () => {
    switch (resolvedId) {
      case 'lamp':
        return <LampIcon state={state} canAnimate={canAnimate} reducedMotion={reducedMotion} />;
      case 'book':
        return <BookIcon state={state} canAnimate={canAnimate} reducedMotion={reducedMotion} />;
      case 'pencil':
        return <PencilIcon state={state} canAnimate={canAnimate} reducedMotion={reducedMotion} />;
      case 'coffee':
        return <CoffeeIcon state={state} canAnimate={canAnimate} reducedMotion={reducedMotion} />;
      case 'owl':
      case 'cat':
      case 'rocket':
      case 'sprout':
      case 'laptop':
      case 'night':
      default:
        return (
          <PremiumPlaceholderIcon
            id={resolvedId}
            state={state}
            canAnimate={canAnimate}
            reducedMotion={reducedMotion}
          />
        );
    }
  };

  const glowOpacityAnim = isStudying && canAnimate && !reducedMotion;

  return (
    <div
      ref={containerRef}
      onClick={onClick}
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
      style={{
        width: px,
        height: px,
        ...style,
      }}
      role="img"
      aria-label={`${meta.name} study icon (${state})`}
    >
      <style>{`
        @keyframes study-icon-glow-${uid} {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 0.85; }
        }
        .anim-study-icon-glow-${uid} {
          animation: study-icon-glow-${uid} 3.2s ease-in-out infinite;
        }
      `}</style>

      {/* 1. Ambient Glow Layer (key color, opacity-only fade) */}
      {!isIdle && (
        <div
          aria-hidden="true"
          className={`absolute pointer-events-none transition-opacity duration-500 ${
            glowOpacityAnim ? `anim-study-icon-glow-${uid}` : ''
          }`}
          style={{
            inset: -Math.round(px * 0.12),
            borderRadius: '26%',
            background: meta.palette.glow,
            filter: `blur(${Math.max(4, Math.round(px * 0.12))}px)`,
            opacity: isPaused ? 0.2 : 0.6,
            zIndex: 0,
          }}
        />
      )}

      {/* 2. Rounded-Square Tile (about 22% radius) */}
      <div
        className="relative w-full h-full overflow-hidden transition-all duration-300"
        style={{
          borderRadius: '22%',
          background: `linear-gradient(135deg, ${meta.palette.bg1} 0%, ${meta.palette.bg2} 100%)`,
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 2px 8px rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
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
              'radial-gradient(ellipse at top left, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0) 65%)',
          }}
        />

        {/* Flat Vector SVG Drawing */}
        <div
          className="absolute inset-0 flex items-center justify-center p-[6%]"
          style={{ zIndex: 2 }}
        >
          {renderIconSvg()}
        </div>
      </div>
    </div>
  );
}
