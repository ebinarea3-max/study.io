'use client';

import React, { useId } from 'react';
import type { StudyIconState } from './registry';

interface IconProps {
  state: StudyIconState;
  canAnimate: boolean;
  reducedMotion?: boolean;
}

export function SproutIcon({ state, canAnimate, reducedMotion }: IconProps) {
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
        <linearGradient id={`sprout_pot_${uid}`} x1="32" y1="44" x2="32" y2="54" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1E293B" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>
        <linearGradient id={`sprout_leaf_l_${uid}`} x1="22" y1="24" x2="32" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#86EFAC" />
          <stop offset="100%" stopColor="#22C55E" />
        </linearGradient>
        <linearGradient id={`sprout_leaf_r_${uid}`} x1="42" y1="20" x2="32" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#A7F3D0" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
      </defs>

      <style>{`
        @keyframes stem-sway-${uid} {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(2deg); }
          75% { transform: rotate(-2deg); }
        }
        @keyframes leaf-grow-1-${uid} {
          0% { transform: scale(0.3); opacity: 0.3; }
          35%, 100% { transform: scale(1); opacity: 1; }
        }
        @keyframes leaf-grow-2-${uid} {
          0%, 25% { transform: scale(0.3); opacity: 0.3; }
          60%, 100% { transform: scale(1); opacity: 1; }
        }
        @keyframes dewdrop-sparkle-${uid} {
          0%, 100% { opacity: 0.3; transform: scale(0.6) rotate(0deg); }
          50% { opacity: 1; transform: scale(1.15) rotate(45deg); }
        }
        .anim-stem-sway-${uid} {
          animation: stem-sway-${uid} 3.6s ease-in-out infinite;
          animation-play-state: ${playState};
          transform-origin: 32px 48px;
        }
        .anim-leaf-1-${uid} {
          animation: leaf-grow-1-${uid} 6s ease-out infinite;
          animation-play-state: ${playState};
          transform-origin: 31px 33px;
        }
        .anim-leaf-2-${uid} {
          animation: leaf-grow-2-${uid} 6s ease-out infinite;
          animation-play-state: ${playState};
          transform-origin: 33px 26px;
        }
        .anim-dewdrop-${uid} {
          animation: dewdrop-sparkle-${uid} 2.4s ease-in-out infinite;
          animation-play-state: ${playState};
          transform-origin: 43px 21px;
        }
      `}</style>

      {/* Ceramic Pot / Mound */}
      <ellipse cx="32" cy="51" rx="16" ry="3.5" fill="#064E3B" />
      <path d="M19 46 L21 54 H43 L45 46 Z" fill={`url(#sprout_pot_${uid})`} stroke="#334155" strokeWidth="0.75" />
      <ellipse cx="32" cy="46" rx="13" ry="2.5" fill="#14532D" />

      {/* Stem and Leaves (sways +/- 2 degrees from pot base) */}
      <g className={`anim-stem-sway-${uid}`}>
        {/* Curving Stem */}
        <path
          d="M32 46 C32 38 30 30 32 20"
          stroke="#4ADE80"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Lower Left Leaf (scales in over 6s loop) */}
        <g className={`anim-leaf-1-${uid}`}>
          <path
            d="M31 34 C19 33 17 21 30 25 C31 29 31 32 31 34 Z"
            fill={`url(#sprout_leaf_l_${uid})`}
            stroke="#16A34A"
            strokeWidth="0.75"
          />
          <path d="M29 27 C24 28 22 30 20 32" stroke="#BBF7D0" strokeWidth="0.6" strokeLinecap="round" />
        </g>

        {/* Upper Right Leaf (scales in delayed over 6s loop) */}
        <g className={`anim-leaf-2-${uid}`}>
          <path
            d="M32 26 C45 25 46 13 33 17 C32 21 32 24 32 26 Z"
            fill={`url(#sprout_leaf_r_${uid})`}
            stroke="#059669"
            strokeWidth="0.75"
          />
          <path d="M34 19 C39 20 42 22 44 24" stroke="#D1FAE5" strokeWidth="0.6" strokeLinecap="round" />
        </g>

        {/* Dewdrop on right leaf tip (sparkles) */}
        <g className={`anim-dewdrop-${uid}`}>
          <circle cx="43" cy="21" r="2.2" fill="#E0F2FE" />
          <circle cx="43" cy="21" r="1.2" fill="#FFFFFF" />
          <path d="M43 18 L43.8 20.2 L46 21 L43.8 21.8 L43 24 L42.2 21.8 L40 21 L42.2 20.2 Z" fill="#A7F3D0" />
        </g>

        {/* Top budding shoot */}
        <circle cx="32" cy="19" r="1.5" fill="#86EFAC" />
      </g>

      {/* Paused state corner mark */}
      {isPaused && (
        <g transform="translate(47, 7)">
          <rect width="9" height="9" rx="2" fill="#000000" fillOpacity="0.6" />
          <rect x="2" y="2" width="2" height="5" rx="0.75" fill="#4ADE80" />
          <rect x="5" y="2" width="2" height="5" rx="0.75" fill="#4ADE80" />
        </g>
      )}
    </svg>
  );
}
