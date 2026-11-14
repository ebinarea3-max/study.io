'use client';

import React, { useId } from 'react';
import type { StudyIconState } from './registry';

interface IconProps {
  state: StudyIconState;
  canAnimate: boolean;
  reducedMotion?: boolean;
}

export function OwlIcon({ state, canAnimate, reducedMotion }: IconProps) {
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
        <linearGradient id={`owl_body_${uid}`} x1="32" y1="24" x2="32" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#4C1D95" />
        </linearGradient>
        <linearGradient id={`owl_belly_${uid}`} x1="32" y1="36" x2="32" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#C4B5FD" />
          <stop offset="100%" stopColor="#A78BFA" />
        </linearGradient>
      </defs>

      <style>{`
        @keyframes owl-head-tilt-${uid} {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(3deg); }
          75% { transform: rotate(-3deg); }
        }
        @keyframes owl-blink-${uid} {
          0%, 94% { transform: scaleY(1); }
          96% { transform: scaleY(0.1); }
          98%, 100% { transform: scaleY(1); }
        }
        @keyframes owl-star-${uid} {
          0%, 100% { opacity: 0.2; transform: scale(0.6) rotate(0deg); }
          50% { opacity: 1; transform: scale(1.1) rotate(45deg); }
        }
        .anim-owl-head-${uid} {
          animation: owl-head-tilt-${uid} 5s ease-in-out infinite;
          animation-play-state: ${playState};
          transform-origin: 32px 36px;
        }
        .anim-owl-blink-${uid} {
          animation: owl-blink-${uid} 4s ease-in-out infinite;
          animation-play-state: ${playState};
          transform-origin: 32px 28px;
        }
        .anim-owl-star-${uid} {
          animation: owl-star-${uid} 3.2s ease-in-out infinite;
          animation-play-state: ${playState};
          transform-origin: 49px 15px;
        }
      `}</style>

      {/* Perch branch */}
      <rect x="12" y="50" width="40" height="3" rx="1.5" fill="#3B1C54" />
      <circle cx="28" cy="50" r="1.5" fill="#FCD34D" />
      <circle cx="36" cy="50" r="1.5" fill="#FCD34D" />

      {/* Owl body & wings */}
      <ellipse cx="32" cy="38" rx="15" ry="13" fill={`url(#owl_body_${uid})`} />
      <ellipse cx="32" cy="41" rx="9" ry="8" fill={`url(#owl_belly_${uid})`} fillOpacity="0.85" />
      {/* Belly feather marks */}
      <path d="M30 38 Q32 40 34 38" stroke="#7C3AED" strokeWidth="1" strokeLinecap="round" fill="none" />
      <path d="M28 42 Q30 44 32 42" stroke="#7C3AED" strokeWidth="1" strokeLinecap="round" fill="none" />
      <path d="M32 42 Q34 44 36 42" stroke="#7C3AED" strokeWidth="1" strokeLinecap="round" fill="none" />

      {/* Head assembly (tilts slowly) */}
      <g className={`anim-owl-head-${uid}`}>
        {/* Head circle */}
        <circle cx="32" cy="27" r="12" fill="#7C3AED" />

        {/* Ear tufts */}
        <polygon points="21,14 26,22 19,23" fill="#6D28D9" />
        <polygon points="43,14 38,22 45,23" fill="#6D28D9" />

        {/* Brow outline */}
        <path d="M22 23 Q27 21 32 24 Q37 21 42 23" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round" fill="none" />

        {/* Eye sockets & Animated Blinking Eyes */}
        <g className={`anim-owl-blink-${uid}`}>
          {/* Left Eye */}
          <circle cx="26" cy="28" r="5" fill="#DDD6FE" />
          <circle cx="26" cy="28" r="3.2" fill="#1E1B4B" />
          <circle cx="27" cy="27" r="1.2" fill="#FFFFFF" />

          {/* Right Eye */}
          <circle cx="38" cy="28" r="5" fill="#DDD6FE" />
          <circle cx="38" cy="28" r="3.2" fill="#1E1B4B" />
          <circle cx="39" cy="27" r="1.2" fill="#FFFFFF" />
        </g>

        {/* Golden Beak */}
        <polygon points="32,29 29,34 35,34" fill="#FCD34D" />
      </g>

      {/* Twinkling star beside owl */}
      <g className={`anim-owl-star-${uid}`}>
        <path
          d="M49 11 L50 14 L53 15 L50 16 L49 19 L48 16 L45 15 L48 14 Z"
          fill="#FCD34D"
        />
        <circle cx="49" cy="15" r="1" fill="#FFFFFF" />
      </g>

      {/* Paused state corner mark */}
      {isPaused && (
        <g transform="translate(47, 7)">
          <rect width="9" height="9" rx="2" fill="#000000" fillOpacity="0.6" />
          <rect x="2" y="2" width="2" height="5" rx="0.75" fill="#A78BFA" />
          <rect x="5" y="2" width="2" height="5" rx="0.75" fill="#A78BFA" />
        </g>
      )}
    </svg>
  );
}
