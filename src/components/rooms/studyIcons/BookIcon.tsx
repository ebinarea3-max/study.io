'use client';

import React, { useId } from 'react';
import type { StudyIconState } from './registry';

interface IconProps {
  state: StudyIconState;
  canAnimate: boolean;
  reducedMotion?: boolean;
}

export function BookIcon({ state, canAnimate, reducedMotion }: IconProps) {
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
        <linearGradient id={`book_left_${uid}`} x1="12" y1="20" x2="32" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0B2B3E" />
          <stop offset="100%" stopColor="#041421" />
        </linearGradient>
        <linearGradient id={`book_right_${uid}`} x1="32" y1="20" x2="52" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0E354C" />
          <stop offset="100%" stopColor="#061A28" />
        </linearGradient>
        <linearGradient id={`book_flip_${uid}`} x1="32" y1="22" x2="51" y2="46" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#144A68" />
          <stop offset="100%" stopColor="#09283B" />
        </linearGradient>
      </defs>

      <style>{`
        @keyframes page-turn-${uid} {
          0%, 65% {
            transform: scaleX(1);
            opacity: 1;
          }
          78.75% {
            transform: scaleX(0);
            opacity: 0.9;
          }
          92.5% {
            transform: scaleX(-1);
            opacity: 1;
          }
          95%, 100% {
            transform: scaleX(1);
            opacity: 0;
          }
        }
        @keyframes sparkle-twinkle-${uid} {
          0%, 100% {
            transform: scale(0.3) rotate(0deg);
            opacity: 0.1;
          }
          50% {
            transform: scale(1.1) rotate(90deg);
            opacity: 1;
          }
        }
        .anim-book-page-${uid} {
          animation: page-turn-${uid} 4s ease-in-out infinite;
          animation-play-state: ${playState};
          transform-origin: 32px 34px;
        }
        .anim-book-sparkle-${uid} {
          animation: sparkle-twinkle-${uid} 2.6s ease-in-out infinite;
          animation-play-state: ${playState};
          transform-origin: 47px 18px;
        }
      `}</style>

      {/* Book base cover shadow / thick pages edge */}
      <path
        d="M10 47 C18 45 28 46 32 49 C36 46 46 45 54 47 L54 50 C46 48 36 49 32 52 C28 49 18 48 10 50 Z"
        fill="#04101A"
      />
      <path
        d="M10 45 C18 43 28 44 32 47 C36 44 46 43 54 45 L54 47 C46 45 36 46 32 49 C28 46 18 45 10 47 Z"
        fill="#134759"
      />

      {/* Left fixed page */}
      <path
        d="M11 22 C18 20 28 21 32 25 L32 46 C28 43 18 42 11 44 Z"
        fill={`url(#book_left_${uid})`}
        stroke="#22D3EE"
        strokeWidth="0.75"
        strokeOpacity="0.4"
      />

      {/* Left text lines */}
      <line x1="15" y1="27" x2="28" y2="28" stroke="#5EEAD4" strokeWidth="1" strokeOpacity="0.6" strokeLinecap="round" />
      <line x1="15" y1="31" x2="27" y2="32" stroke="#5EEAD4" strokeWidth="1" strokeOpacity="0.5" strokeLinecap="round" />
      <line x1="15" y1="35" x2="28" y2="36" stroke="#5EEAD4" strokeWidth="1" strokeOpacity="0.6" strokeLinecap="round" />
      <line x1="15" y1="39" x2="25" y2="40" stroke="#5EEAD4" strokeWidth="1" strokeOpacity="0.4" strokeLinecap="round" />

      {/* Right fixed page */}
      <path
        d="M53 22 C46 20 36 21 32 25 L32 46 C36 43 46 42 53 44 Z"
        fill={`url(#book_right_${uid})`}
        stroke="#22D3EE"
        strokeWidth="0.75"
        strokeOpacity="0.4"
      />

      {/* Right text lines */}
      <line x1="36" y1="28" x2="49" y2="27" stroke="#22D3EE" strokeWidth="1" strokeOpacity="0.6" strokeLinecap="round" />
      <line x1="36" y1="32" x2="48" y2="31" stroke="#22D3EE" strokeWidth="1" strokeOpacity="0.5" strokeLinecap="round" />
      <line x1="36" y1="36" x2="49" y2="35" stroke="#22D3EE" strokeWidth="1" strokeOpacity="0.6" strokeLinecap="round" />
      <line x1="36" y1="40" x2="46" y2="39" stroke="#22D3EE" strokeWidth="1" strokeOpacity="0.4" strokeLinecap="round" />

      {/* Turning page (animated scaleX 1 -> -1 around spine at x=32) */}
      <g className={`anim-book-page-${uid}`}>
        <path
          d="M52 23 C45 21 36 22 32 25 L32 46 C36 43 45 42 52 44 Z"
          fill={`url(#book_flip_${uid})`}
          stroke="#5EEAD4"
          strokeWidth="0.75"
          strokeOpacity="0.8"
        />
        <line x1="36" y1="29" x2="48" y2="28" stroke="#5EEAD4" strokeWidth="0.8" strokeOpacity="0.7" strokeLinecap="round" />
        <line x1="36" y1="33" x2="47" y2="32" stroke="#5EEAD4" strokeWidth="0.8" strokeOpacity="0.6" strokeLinecap="round" />
        <line x1="36" y1="37" x2="48" y2="36" stroke="#5EEAD4" strokeWidth="0.8" strokeOpacity="0.7" strokeLinecap="round" />
      </g>

      {/* Center Spine highlight */}
      <line x1="32" y1="24" x2="32" y2="47" stroke="#5EEAD4" strokeWidth="1.5" strokeLinecap="round" />

      {/* Twinkling Sparkle at upper-right */}
      <g className={`anim-book-sparkle-${uid}`}>
        <path
          d="M47 13 L48.5 17 L52.5 18 L48.5 19 L47 23 L45.5 19 L41.5 18 L45.5 17 Z"
          fill="#5EEAD4"
        />
        <circle cx="47" cy="18" r="1.5" fill="#FFFFFF" />
      </g>

      {/* Paused state corner mark */}
      {isPaused && (
        <g transform="translate(47, 7)">
          <rect width="9" height="9" rx="2" fill="#000000" fillOpacity="0.6" />
          <rect x="2" y="2" width="2" height="5" rx="0.75" fill="#5EEAD4" />
          <rect x="5" y="2" width="2" height="5" rx="0.75" fill="#5EEAD4" />
        </g>
      )}
    </svg>
  );
}
