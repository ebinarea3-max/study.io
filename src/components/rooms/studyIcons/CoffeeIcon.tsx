'use client';

import React, { useId } from 'react';
import type { StudyIconState } from './registry';

interface IconProps {
  state: StudyIconState;
  canAnimate: boolean;
  reducedMotion?: boolean;
}

export function CoffeeIcon({ state, canAnimate, reducedMotion }: IconProps) {
  const uid = useId().replace(/:/g, '_');
  const isPlaying = state === 'studying' && canAnimate && !reducedMotion;
  const isPaused = state === 'paused';
  const isIdle = state === 'idle';

  const playState = isPlaying ? 'running' : 'paused';

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
      <defs>
        <linearGradient id={`cup_body_${uid}`} x1="16" y1="28" x2="48" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDBA74" />
          <stop offset="100%" stopColor="#C2410C" />
        </linearGradient>
        <linearGradient id={`coffee_liquid_${uid}`} x1="18" y1="28" x2="46" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#451A03" />
          <stop offset="50%" stopColor="#78350F" />
          <stop offset="100%" stopColor="#290E00" />
        </linearGradient>
      </defs>

      <style>{`
        @keyframes steam-rise-1-${uid} {
          0% {
            transform: translateY(0px);
            opacity: 0;
          }
          30% {
            opacity: 0.85;
          }
          75% {
            opacity: 0.4;
          }
          100% {
            transform: translateY(-13px);
            opacity: 0;
          }
        }
        @keyframes steam-rise-2-${uid} {
          0% {
            transform: translateY(0px);
            opacity: 0;
          }
          30% {
            opacity: 0.75;
          }
          75% {
            opacity: 0.35;
          }
          100% {
            transform: translateY(-15px);
            opacity: 0;
          }
        }
        @keyframes steam-rise-3-${uid} {
          0% {
            transform: translateY(0px);
            opacity: 0;
          }
          30% {
            opacity: 0.8;
          }
          75% {
            opacity: 0.3;
          }
          100% {
            transform: translateY(-12px);
            opacity: 0;
          }
        }
        @keyframes cup-bob-${uid} {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-1px);
          }
        }
        .anim-steam-1-${uid} {
          animation: steam-rise-1-${uid} 3s ease-out infinite;
          animation-play-state: ${playState};
        }
        .anim-steam-2-${uid} {
          animation: steam-rise-2-${uid} 3s ease-out infinite 0.9s;
          animation-play-state: ${playState};
        }
        .anim-steam-3-${uid} {
          animation: steam-rise-3-${uid} 3s ease-out infinite 1.8s;
          animation-play-state: ${playState};
        }
        .anim-cup-bob-${uid} {
          animation: cup-bob-${uid} 3.2s ease-in-out infinite;
          animation-play-state: ${playState};
        }
      `}</style>

      {/* 3 Steam wisps rising with different delays */}
      <path
        className={`anim-steam-1-${uid}`}
        d="M25 24 C23 20 27 16 25 12"
        stroke="#FDE68A"
        strokeWidth="1.75"
        strokeLinecap="round"
        fill="none"
      />
      <path
        className={`anim-steam-2-${uid}`}
        d="M32 23 C34 19 30 15 32 10"
        stroke="#FDE68A"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        className={`anim-steam-3-${uid}`}
        d="M39 25 C37 21 41 17 39 13"
        stroke="#FDE68A"
        strokeWidth="1.75"
        strokeLinecap="round"
        fill="none"
      />

      {/* Entire Cup assembly with 1px bob animation */}
      <g className={`anim-cup-bob-${uid}`}>
        {/* Saucer */}
        <ellipse cx="32" cy="53" rx="20" ry="3.5" fill="#7C2D12" />
        <ellipse cx="32" cy="52" rx="16" ry="2.5" fill="#9A3412" />

        {/* Cup Handle */}
        <path
          d="M44 34 C51 34 52 44 43 45"
          stroke="#C2410C"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M44 34 C50 34 51 44 43 45"
          stroke="#FDBA74"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Cup Outer Body */}
        <path
          d="M17 28 C17 44 23 50 32 50 C41 50 47 44 47 28 Z"
          fill={`url(#cup_body_${uid})`}
        />

        {/* Cup Rim Highlight */}
        <ellipse cx="32" cy="28" rx="15" ry="3.5" fill="#EA580C" />
        <ellipse cx="32" cy="28" rx="14" ry="3" fill={`url(#coffee_liquid_${uid})`} />

        {/* Latte art / cream swirl */}
        <ellipse cx="32" cy="28" rx="7" ry="1.5" fill="#FDE68A" fillOpacity="0.4" />
        <circle cx="32" cy="28" r="1.5" fill="#FFFBEB" fillOpacity="0.6" />
      </g>

      {/* Paused state corner mark */}
      {isPaused && (
        <g transform="translate(47, 7)">
          <rect width="9" height="9" rx="2" fill="#000000" fillOpacity="0.6" />
          <rect x="2" y="2" width="2" height="5" rx="0.75" fill="#FDBA74" />
          <rect x="5" y="2" width="2" height="5" rx="0.75" fill="#FDBA74" />
        </g>
      )}
    </svg>
  );
}
