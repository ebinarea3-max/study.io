'use client';

import React, { useId } from 'react';
import type { StudyIconState } from './registry';

interface IconProps {
  state: StudyIconState;
  canAnimate: boolean;
  reducedMotion?: boolean;
}

export function RocketIcon({ state, canAnimate, reducedMotion }: IconProps) {
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
        <linearGradient id={`rocket_body_${uid}`} x1="32" y1="12" x2="32" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#EFF6FF" />
          <stop offset="60%" stopColor="#DBEAFE" />
          <stop offset="100%" stopColor="#93C5FD" />
        </linearGradient>
        <linearGradient id={`rocket_flame_${uid}`} x1="32" y1="44" x2="32" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="40%" stopColor="#FB923C" />
          <stop offset="100%" stopColor="#EF4444" />
        </linearGradient>
      </defs>

      <style>{`
        @keyframes rocket-vibrate-${uid} {
          0%, 100% { transform: translate(0px, 0px); }
          25% { transform: translate(0.6px, -0.6px); }
          50% { transform: translate(-0.6px, 0.4px); }
          75% { transform: translate(0.4px, 0.6px); }
        }
        @keyframes flame-flicker-${uid} {
          0%, 100% { transform: scaleY(0.85); opacity: 0.85; }
          50% { transform: scaleY(1.25); opacity: 1; }
        }
        @keyframes star-streak-1-${uid} {
          0% { transform: translateY(-16px); opacity: 0; }
          30% { opacity: 0.9; }
          80% { opacity: 0.6; }
          100% { transform: translateY(54px); opacity: 0; }
        }
        @keyframes star-streak-2-${uid} {
          0% { transform: translateY(-16px); opacity: 0; }
          30% { opacity: 0.8; }
          80% { opacity: 0.5; }
          100% { transform: translateY(54px); opacity: 0; }
        }
        @keyframes star-streak-3-${uid} {
          0% { transform: translateY(-16px); opacity: 0; }
          30% { opacity: 0.85; }
          80% { opacity: 0.6; }
          100% { transform: translateY(54px); opacity: 0; }
        }
        .anim-rocket-vibe-${uid} {
          animation: rocket-vibrate-${uid} 0.15s ease-in-out infinite;
          animation-play-state: ${playState};
        }
        .anim-flame-${uid} {
          animation: flame-flicker-${uid} 0.3s ease-in-out infinite;
          animation-play-state: ${playState};
          transform-origin: 32px 44px;
        }
        .anim-streak-1-${uid} {
          animation: star-streak-1-${uid} 1.2s linear infinite;
          animation-play-state: ${playState};
        }
        .anim-streak-2-${uid} {
          animation: star-streak-2-${uid} 1.8s linear infinite 0.6s;
          animation-play-state: ${playState};
        }
        .anim-streak-3-${uid} {
          animation: star-streak-3-${uid} 2.2s linear infinite 1.1s;
          animation-play-state: ${playState};
        }
      `}</style>

      {/* 3 Falling Star Streaks */}
      <line className={`anim-streak-1-${uid}`} x1="14" y1="8" x2="14" y2="18" stroke="#93C5FD" strokeWidth="1.2" strokeLinecap="round" />
      <line className={`anim-streak-2-${uid}`} x1="50" y1="12" x2="50" y2="24" stroke="#60A5FA" strokeWidth="1.5" strokeLinecap="round" />
      <line className={`anim-streak-3-${uid}`} x1="20" y1="20" x2="20" y2="28" stroke="#BAE6FD" strokeWidth="1" strokeLinecap="round" />

      {/* Rocket Main Assembly (vibrates 1px) */}
      <g className={`anim-rocket-vibe-${uid}`}>
        {/* Exhaust Flame (animated flicker) */}
        <polygon
          className={`anim-flame-${uid}`}
          points="27,44 32,58 37,44"
          fill={`url(#rocket_flame_${uid})`}
        />
        <polygon
          className={`anim-flame-${uid}`}
          points="29,44 32,53 35,44"
          fill="#FFFBEB"
        />

        {/* Thruster Nozzle */}
        <rect x="28" y="42" width="8" height="3" rx="1" fill="#475569" />

        {/* Left Wing / Fin */}
        <polygon points="21,35 27,43 27,33" fill="#FB923C" />
        <polygon points="21,35 27,43 25,43" fill="#EA580C" />

        {/* Right Wing / Fin */}
        <polygon points="43,35 37,43 37,33" fill="#FB923C" />
        <polygon points="43,35 37,43 39,43" fill="#EA580C" />

        {/* Rocket Body */}
        <path
          d="M27 27 C27 18 32 11 32 11 C32 11 37 18 37 27 L37 43 L27 43 Z"
          fill={`url(#rocket_body_${uid})`}
        />

        {/* Nosecone tip */}
        <path
          d="M28.5 18 C30 14 32 11 32 11 C32 11 34 14 35.5 18 Z"
          fill="#3B82F6"
        />

        {/* Center Porthole Window */}
        <circle cx="32" cy="25" r="4.5" fill="#1E3A8A" />
        <circle cx="32" cy="25" r="3.2" fill="#60A5FA" />
        <circle cx="33" cy="24" r="1.2" fill="#FFFFFF" />

        {/* Side panel seams */}
        <line x1="28" y1="34" x2="36" y2="34" stroke="#93C5FD" strokeWidth="0.75" />
      </g>

      {/* Paused state corner mark */}
      {isPaused && (
        <g transform="translate(47, 7)">
          <rect width="9" height="9" rx="2" fill="#000000" fillOpacity="0.6" />
          <rect x="2" y="2" width="2" height="5" rx="0.75" fill="#60A5FA" />
          <rect x="5" y="2" width="2" height="5" rx="0.75" fill="#60A5FA" />
        </g>
      )}
    </svg>
  );
}
