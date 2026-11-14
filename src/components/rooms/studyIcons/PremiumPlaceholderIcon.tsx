'use client';

import React, { useId } from 'react';
import type { StudyIconId, StudyIconState } from './registry';

interface PremiumPlaceholderProps {
  id: StudyIconId;
  state: StudyIconState;
  canAnimate: boolean;
  reducedMotion?: boolean;
}

export function PremiumPlaceholderIcon({
  id,
  state,
  canAnimate,
  reducedMotion,
}: PremiumPlaceholderProps) {
  const uid = useId().replace(/:/g, '_');
  const isPlaying = state === 'studying' && canAnimate && !reducedMotion;
  const isPaused = state === 'paused';
  const isIdle = state === 'idle';
  const playState = isPlaying ? 'running' : 'paused';

  // Render original flat vector silhouettes for each of the 6 premium icons
  const renderIconContent = () => {
    switch (id) {
      case 'owl':
        return (
          <g>
            <style>{`
              @keyframes owl-blink-${uid} {
                0%, 90%, 100% { transform: scaleY(1); }
                95% { transform: scaleY(0.1); }
              }
              .anim-owl-eyes-${uid} {
                animation: owl-blink-${uid} 4s ease-in-out infinite;
                animation-play-state: ${playState};
                transform-origin: 32px 30px;
              }
            `}</style>
            {/* Branch */}
            <rect x="14" y="48" width="36" height="4" rx="2" fill="#4C1D95" />
            {/* Body */}
            <ellipse cx="32" cy="34" rx="14" ry="16" fill="#7C3AED" />
            {/* Belly */}
            <ellipse cx="32" cy="38" rx="8" ry="10" fill="#A78BFA" fillOpacity="0.4" />
            {/* Ear Tufts */}
            <polygon points="20,20 25,26 18,27" fill="#6D28D9" />
            <polygon points="44,20 39,26 46,27" fill="#6D28D9" />
            {/* Eyes */}
            <g className={`anim-owl-eyes-${uid}`}>
              <circle cx="26" cy="30" r="5" fill="#DDD6FE" />
              <circle cx="26" cy="30" r="2.5" fill="#1E1B4B" />
              <circle cx="38" cy="30" r="5" fill="#DDD6FE" />
              <circle cx="38" cy="30" r="2.5" fill="#1E1B4B" />
            </g>
            {/* Beak */}
            <polygon points="32,32 30,36 34,36" fill="#FBBF24" />
          </g>
        );

      case 'cat':
        return (
          <g>
            <style>{`
              @keyframes cat-tail-${uid} {
                0%, 100% { transform: rotate(0deg); }
                50% { transform: rotate(15deg); }
              }
              .anim-cat-tail-${uid} {
                animation: cat-tail-${uid} 3.2s ease-in-out infinite;
                animation-play-state: ${playState};
                transform-origin: 44px 44px;
              }
            `}</style>
            {/* Cat body curled */}
            <ellipse cx="30" cy="38" rx="14" ry="12" fill="#EA580C" />
            {/* Head */}
            <circle cx="24" cy="28" r="9" fill="#FB923C" />
            {/* Ears */}
            <polygon points="17,16 23,24 16,24" fill="#C2410C" />
            <polygon points="25,16 31,24 24,24" fill="#C2410C" />
            {/* Closed sleeping/studying eyes */}
            <path d="M19 28 Q21 31 23 28" stroke="#7C2D12" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M26 28 Q28 31 30 28" stroke="#7C2D12" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            {/* Whiskers */}
            <line x1="13" y1="29" x2="18" y2="30" stroke="#FDBA74" strokeWidth="1" />
            <line x1="13" y1="32" x2="18" y2="32" stroke="#FDBA74" strokeWidth="1" />
            {/* Tail */}
            <path className={`anim-cat-tail-${uid}`} d="M42 42 Q50 38 48 30" stroke="#FB923C" strokeWidth="3" strokeLinecap="round" fill="none" />
            {/* Mini Book beside */}
            <polygon points="36,46 48,46 46,42 34,42" fill="#FED7AA" />
          </g>
        );

      case 'rocket':
        return (
          <g>
            <style>{`
              @keyframes rocket-flame-${uid} {
                0%, 100% { transform: scaleY(0.85); opacity: 0.8; }
                50% { transform: scaleY(1.15); opacity: 1; }
              }
              .anim-rocket-flame-${uid} {
                animation: rocket-flame-${uid} 0.8s ease-in-out infinite;
                animation-play-state: ${playState};
                transform-origin: 32px 47px;
              }
            `}</style>
            {/* Rocket Exhaust Flame */}
            <polygon
              className={`anim-rocket-flame-${uid}`}
              points="28,47 32,58 36,47"
              fill="#F97316"
            />
            <polygon
              className={`anim-rocket-flame-${uid}`}
              points="29.5,47 32,54 34.5,47"
              fill="#FDE047"
            />
            {/* Rocket Fins */}
            <polygon points="22,38 27,45 27,34" fill="#0284C7" />
            <polygon points="42,38 37,45 37,34" fill="#0284C7" />
            {/* Rocket Body */}
            <path d="M27 30 C27 20 32 12 32 12 C32 12 37 20 37 30 L37 47 L27 47 Z" fill="#E0F2FE" />
            {/* Rocket Nosecone Tip */}
            <path d="M28 20 C30 15 32 12 32 12 C32 12 34 15 36 20 Z" fill="#0284C7" />
            {/* Window */}
            <circle cx="32" cy="27" r="3.5" fill="#0284C7" />
            <circle cx="32" cy="27" r="2" fill="#38BDF8" />
          </g>
        );

      case 'sprout':
        return (
          <g>
            <style>{`
              @keyframes sprout-sway-${uid} {
                0%, 100% { transform: rotate(-3deg); }
                50% { transform: rotate(3deg); }
              }
              .anim-sprout-sway-${uid} {
                animation: sprout-sway-${uid} 3.5s ease-in-out infinite;
                animation-play-state: ${playState};
                transform-origin: 32px 50px;
              }
            `}</style>
            {/* Soil / Pot */}
            <ellipse cx="32" cy="50" rx="16" ry="3.5" fill="#14532D" />
            {/* Plant Stem + Leaves */}
            <g className={`anim-sprout-sway-${uid}`}>
              <path d="M32 50 Q31 36 32 26" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" fill="none" />
              {/* Left Leaf */}
              <path d="M31 34 C21 34 20 24 31 28 Z" fill="#4ADE80" />
              {/* Right Leaf */}
              <path d="M32 28 C42 28 43 18 32 22 Z" fill="#86EFAC" />
              {/* Little Water droplet */}
              <circle cx="38" cy="24" r="1.2" fill="#BAE6FD" />
            </g>
          </g>
        );

      case 'laptop':
        return (
          <g>
            <style>{`
              @keyframes screen-glow-${uid} {
                0%, 100% { opacity: 0.85; }
                50% { opacity: 1; }
              }
              .anim-screen-glow-${uid} {
                animation: screen-glow-${uid} 2.5s ease-in-out infinite;
                animation-play-state: ${playState};
              }
            `}</style>
            {/* Screen Lid */}
            <rect x="18" y="18" width="28" height="20" rx="2" fill="#1E293B" stroke="#475569" strokeWidth="1" />
            {/* Screen Glass */}
            <rect className={`anim-screen-glow-${uid}`} x="20" y="20" width="24" height="16" rx="1" fill="#0F172A" />
            {/* Code lines on screen */}
            <line x1="23" y1="24" x2="33" y2="24" stroke="#60A5FA" strokeWidth="1" strokeLinecap="round" />
            <line x1="25" y1="27" x2="38" y2="27" stroke="#34D399" strokeWidth="1" strokeLinecap="round" />
            <line x1="25" y1="30" x2="35" y2="30" stroke="#F472B6" strokeWidth="1" strokeLinecap="round" />
            <line x1="23" y1="33" x2="29" y2="33" stroke="#FBBF24" strokeWidth="1" strokeLinecap="round" />
            {/* Base / Keyboard */}
            <polygon points="12,46 52,46 48,39 16,39" fill="#334155" />
            <rect x="28" y="45" width="8" height="1" rx="0.5" fill="#64748B" />
          </g>
        );

      case 'night':
      default:
        return (
          <g>
            <style>{`
              @keyframes moon-halo-${uid} {
                0%, 100% { opacity: 0.4; }
                50% { opacity: 0.8; }
              }
              .anim-moon-halo-${uid} {
                animation: moon-halo-${uid} 3s ease-in-out infinite;
                animation-play-state: ${playState};
              }
            `}</style>
            {/* Soft Moon Halo */}
            <circle className={`anim-moon-halo-${uid}`} cx="28" cy="28" r="14" fill="#F0ABFC" fillOpacity="0.25" />
            {/* Crescent Moon */}
            <path
              d="M32 16 C25 16 19 22 19 29 C19 36 25 42 32 42 C30 38 29 33 29 29 C29 24 30 20 32 16 Z"
              fill="#F5D0FE"
            />
            {/* Stars */}
            <polygon points="42,18 43,20 45,21 43,22 42,24 41,22 39,21 41,20" fill="#E879F9" />
            <polygon points="46,30 47,32 49,33 47,34 46,36 45,34 43,33 45,32" fill="#F0ABFC" />
            <circle cx="37" cy="38" r="1" fill="#FFFFFF" fillOpacity="0.8" />
            {/* Clouds */}
            <ellipse cx="40" cy="46" rx="14" ry="4" fill="#4A0E4E" fillOpacity="0.6" />
          </g>
        );
    }
  };

  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      style={{
        opacity: isIdle ? 0.45 : 1,
        filter: isPaused ? 'saturate(0.6)' : undefined,
      }}
      aria-hidden="true"
    >
      {renderIconContent()}

      {/* Paused state corner mark */}
      {isPaused && (
        <g transform="translate(47, 7)">
          <rect width="9" height="9" rx="2" fill="#000000" fillOpacity="0.6" />
          <rect x="2" y="2" width="2" height="5" rx="0.75" fill="#FFFFFF" fillOpacity="0.8" />
          <rect x="5" y="2" width="2" height="5" rx="0.75" fill="#FFFFFF" fillOpacity="0.8" />
        </g>
      )}
    </svg>
  );
}
