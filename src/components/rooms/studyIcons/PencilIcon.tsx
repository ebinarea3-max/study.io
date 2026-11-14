'use client';

import React, { useId } from 'react';
import type { StudyIconState } from './registry';

interface IconProps {
  state: StudyIconState;
  canAnimate: boolean;
  reducedMotion?: boolean;
}

export function PencilIcon({ state, canAnimate, reducedMotion }: IconProps) {
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
        <linearGradient id={`pencil_body_${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#DDD6FE" />
          <stop offset="50%" stopColor="#C4B5FD" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>

      <style>{`
        @keyframes stroke-line-${uid} {
          0% {
            transform: scaleX(0);
            opacity: 1;
          }
          65% {
            transform: scaleX(1);
            opacity: 1;
          }
          85% {
            transform: scaleX(1);
            opacity: 0.8;
          }
          100% {
            transform: scaleX(1);
            opacity: 0;
          }
        }
        @keyframes pencil-writing-${uid} {
          0% {
            transform: translate(0px, 0px) rotate(-35deg);
          }
          65% {
            transform: translate(24px, 0px) rotate(-32deg);
          }
          75% {
            transform: translate(25px, -3px) rotate(-40deg);
          }
          100% {
            transform: translate(0px, 0px) rotate(-35deg);
          }
        }
        .anim-stroke-line-${uid} {
          animation: stroke-line-${uid} 3.6s ease-in-out infinite;
          animation-play-state: ${playState};
          transform-origin: 16px 42px;
        }
        .anim-pencil-writing-${uid} {
          animation: pencil-writing-${uid} 3.6s ease-in-out infinite;
          animation-play-state: ${playState};
          transform-origin: 20px 42px;
        }
      `}</style>

      {/* Notebook page background guide lines */}
      <rect x="10" y="14" width="44" height="38" rx="4" fill="#140D2E" fillOpacity="0.8" stroke="#4C1D95" strokeWidth="0.75" />
      <line x1="14" y1="24" x2="50" y2="24" stroke="#6D28D9" strokeWidth="0.75" strokeDasharray="2 2" strokeOpacity="0.5" />
      <line x1="14" y1="33" x2="50" y2="33" stroke="#6D28D9" strokeWidth="0.75" strokeDasharray="2 2" strokeOpacity="0.5" />
      <line x1="14" y1="42" x2="50" y2="42" stroke="#8B5CF6" strokeWidth="1" strokeOpacity="0.4" />

      {/* Growing written line (animated scaleX 0 to 1) */}
      <line
        className={`anim-stroke-line-${uid}`}
        x1="16"
        y1="42"
        x2="40"
        y2="42"
        stroke="#F0ABFC"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Pencil assembly (animated translation along the line) */}
      <g className={`anim-pencil-writing-${uid}`}>
        {/* Lead tip at (20, 42) */}
        <polygon points="20,42 22,37 25,40" fill="#2E1065" />
        {/* Wood cone collar */}
        <polygon points="22,37 25,40 28,34 25,31" fill="#FDE047" />
        {/* Pencil body hexagon bevel */}
        <rect x="26" y="19" width="7" height="15" rx="1.5" fill={`url(#pencil_body_${uid})`} transform="rotate(45 26 19)" />
        {/* Pencil ferrule (metal ring) */}
        <rect x="36" y="9" width="7" height="3" rx="0.5" fill="#E2E8F0" transform="rotate(45 36 9)" />
        {/* Eraser */}
        <rect x="38" y="7" width="7" height="4" rx="1.5" fill="#F472B6" transform="rotate(45 38 7)" />
      </g>

      {/* Small floating spark/star */}
      <circle cx="48" cy="18" r="1.5" fill="#F0ABFC" fillOpacity="0.8" />
      <circle cx="16" cy="18" r="1" fill="#C4B5FD" fillOpacity="0.6" />

      {/* Paused state corner mark */}
      {isPaused && (
        <g transform="translate(47, 7)">
          <rect width="9" height="9" rx="2" fill="#000000" fillOpacity="0.6" />
          <rect x="2" y="2" width="2" height="5" rx="0.75" fill="#C4B5FD" />
          <rect x="5" y="2" width="2" height="5" rx="0.75" fill="#C4B5FD" />
        </g>
      )}
    </svg>
  );
}
