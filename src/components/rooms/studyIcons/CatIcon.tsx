'use client';

import React, { useId } from 'react';
import type { StudyIconState } from './registry';

interface IconProps {
  state: StudyIconState;
  canAnimate: boolean;
  reducedMotion?: boolean;
}

export function CatIcon({ state, canAnimate, reducedMotion }: IconProps) {
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
        <linearGradient id={`cat_body_${uid}`} x1="32" y1="30" x2="32" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FB923C" />
          <stop offset="100%" stopColor="#C2410C" />
        </linearGradient>
        <radialGradient id={`headphone_glow_${uid}`} cx="32" cy="18" r="16" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
        </radialGradient>
      </defs>

      <style>{`
        @keyframes cat-head-bob-${uid} {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(2px); }
        }
        @keyframes cat-tail-sway-${uid} {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(18deg); }
        }
        @keyframes cat-ear-flick-${uid} {
          0%, 94% { transform: rotate(0deg); }
          96% { transform: rotate(-12deg); }
          98% { transform: rotate(4deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes headphone-glow-${uid} {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.9; }
        }
        .anim-cat-head-${uid} {
          animation: cat-head-bob-${uid} 1s ease-in-out infinite;
          animation-play-state: ${playState};
        }
        .anim-cat-tail-${uid} {
          animation: cat-tail-sway-${uid} 2.4s ease-in-out infinite;
          animation-play-state: ${playState};
          transform-origin: 43px 44px;
        }
        .anim-cat-ear-${uid} {
          animation: cat-ear-flick-${uid} 5s ease-in-out infinite;
          animation-play-state: ${playState};
          transform-origin: 24px 22px;
        }
        .anim-headphone-glow-${uid} {
          animation: headphone-glow-${uid} 2s ease-in-out infinite;
          animation-play-state: ${playState};
        }
      `}</style>

      {/* Desk surface */}
      <rect x="10" y="52" width="44" height="2" rx="1" fill="#334155" fillOpacity="0.5" />

      {/* Cat body */}
      <ellipse cx="32" cy="42" rx="13" ry="10" fill={`url(#cat_body_${uid})`} />
      <ellipse cx="32" cy="44" rx="7" ry="6" fill="#FDBA74" fillOpacity="0.5" />

      {/* Swaying Tail */}
      <path
        className={`anim-cat-tail-${uid}`}
        d="M42 43 C49 41 51 33 48 26"
        stroke="#FB923C"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />

      {/* Bobbing Head Assembly */}
      <g className={`anim-cat-head-${uid}`}>
        {/* Head Base */}
        <circle cx="32" cy="30" r="10" fill="#FDBA74" />

        {/* Right Ear (static) */}
        <polygon points="36,22 41,13 42,23" fill="#EA580C" />
        <polygon points="37,21 40,15 41,22" fill="#FED7AA" />

        {/* Left Ear (animated flick every 5s) */}
        <g className={`anim-cat-ear-${uid}`}>
          <polygon points="22,23 23,13 28,22" fill="#EA580C" />
          <polygon points="23,22 24,15 27,21" fill="#FED7AA" />
        </g>

        {/* Closed Study Eyes (calm listening expression) */}
        <path d="M26 30 Q28 33 30 30" stroke="#7C2D12" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <path d="M34 30 Q36 33 38 30" stroke="#7C2D12" strokeWidth="1.5" strokeLinecap="round" fill="none" />

        {/* Nose & Mouth */}
        <polygon points="31,33 33,33 32,34.5" fill="#C2410C" />
        <path d="M32 34.5 L30 36 M32 34.5 L34 36" stroke="#9A3412" strokeWidth="1" strokeLinecap="round" />

        {/* Whiskers */}
        <line x1="20" y1="31" x2="25" y2="32" stroke="#FED7AA" strokeWidth="0.8" />
        <line x1="20" y1="34" x2="25" y2="34" stroke="#FED7AA" strokeWidth="0.8" />
        <line x1="39" y1="32" x2="44" y2="31" stroke="#FED7AA" strokeWidth="0.8" />
        <line x1="39" y1="34" x2="44" y2="34" stroke="#FED7AA" strokeWidth="0.8" />

        {/* Headphone Glow Aura on Band */}
        <path
          className={`anim-headphone-glow-${uid}`}
          d="M21 30 C21 17 43 17 43 30"
          stroke="url(#headphone_glow_${uid})"
          strokeWidth="4"
          fill="none"
        />

        {/* Headphone Band */}
        <path
          d="M21 30 C21 17 43 17 43 30"
          stroke="#94A3B8"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Headphone Ear Cushions */}
        <rect x="19" y="26" width="4" height="8" rx="2" fill="#64748B" />
        <rect x="41" y="26" width="4" height="8" rx="2" fill="#64748B" />
        <rect x="20" y="27" width="2" height="6" rx="1" fill="#38BDF8" />
        <rect x="42" y="27" width="2" height="6" rx="1" fill="#38BDF8" />
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
