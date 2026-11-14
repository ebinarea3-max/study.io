'use client';

import React, { useId } from 'react';
import type { StudyIconState } from './registry';

interface IconProps {
  state: StudyIconState;
  canAnimate: boolean;
  reducedMotion?: boolean;
}

export function LaptopIcon({ state, canAnimate, reducedMotion }: IconProps) {
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
        <radialGradient id={`screen_glow_${uid}`} cx="32" cy="28" r="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#0F172A" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`laptop_base_${uid}`} x1="32" y1="44" x2="32" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>
      </defs>

      <style>{`
        @keyframes code-type-1-${uid} {
          0% { transform: scaleX(0); }
          30%, 100% { transform: scaleX(1); }
        }
        @keyframes code-type-2-${uid} {
          0%, 20% { transform: scaleX(0); }
          50%, 100% { transform: scaleX(1); }
        }
        @keyframes code-type-3-${uid} {
          0%, 40% { transform: scaleX(0); }
          70%, 100% { transform: scaleX(1); }
        }
        @keyframes cursor-blink-${uid} {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        @keyframes screen-breathe-${uid} {
          0%, 100% { opacity: 0.70; }
          50% { opacity: 1.0; }
        }
        .anim-code-1-${uid} {
          animation: code-type-1-${uid} 3.5s ease-out infinite;
          animation-play-state: ${playState};
          transform-origin: 20px 24px;
        }
        .anim-code-2-${uid} {
          animation: code-type-2-${uid} 3.5s ease-out infinite;
          animation-play-state: ${playState};
          transform-origin: 22px 29px;
        }
        .anim-code-3-${uid} {
          animation: code-type-3-${uid} 3.5s ease-out infinite;
          animation-play-state: ${playState};
          transform-origin: 22px 34px;
        }
        .anim-cursor-${uid} {
          animation: cursor-blink-${uid} 0.8s steps(2, start) infinite;
          animation-play-state: ${playState};
        }
        .anim-screen-breathe-${uid} {
          animation: screen-breathe-${uid} 2.8s ease-in-out infinite;
          animation-play-state: ${playState};
        }
      `}</style>

      {/* Screen Frame / Lid */}
      <rect x="15" y="16" width="34" height="26" rx="2.5" fill="#1E293B" stroke="#475569" strokeWidth="1" />

      {/* Screen Bezel & Ambient Glow (breathes) */}
      <rect x="17" y="18" width="30" height="22" rx="1.5" fill="#030712" />
      <rect
        className={`anim-screen-breathe-${uid}`}
        x="17"
        y="18"
        width="30"
        height="22"
        rx="1.5"
        fill={`url(#screen_glow_${uid})`}
      />

      {/* Code Editor Header Bar */}
      <rect x="17" y="18" width="30" height="3" fill="#0F172A" />
      <circle cx="19" cy="19.5" r="0.75" fill="#EF4444" />
      <circle cx="21.5" cy="19.5" r="0.75" fill="#F59E0B" />
      <circle cx="24" cy="19.5" r="0.75" fill="#10B981" />

      {/* Code line 1: Cyan declaration (types in) */}
      <line
        className={`anim-code-1-${uid}`}
        x1="20"
        y1="25"
        x2="36"
        y2="25"
        stroke="#22D3EE"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Code line 2: Emerald function body (types in with delay) */}
      <line
        className={`anim-code-2-${uid}`}
        x1="23"
        y1="30"
        x2="42"
        y2="30"
        stroke="#34D399"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Code line 3: Return statement (types in with delay) */}
      <line
        className={`anim-code-3-${uid}`}
        x1="23"
        y1="35"
        x2="33"
        y2="35"
        stroke="#6EE7B7"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Blinking Cursor */}
      <rect
        className={`anim-cursor-${uid}`}
        x="36"
        y="33.5"
        width="1.5"
        height="3"
        fill="#22D3EE"
      />

      {/* Laptop Base & Keyboard */}
      <polygon points="10,48 54,48 49,42 15,42" fill={`url(#laptop_base_${uid})`} stroke="#475569" strokeWidth="0.75" />
      <rect x="20" y="43" width="24" height="3" rx="0.5" fill="#1E293B" />
      <rect x="28" y="47" width="8" height="0.75" rx="0.3" fill="#64748B" />

      {/* Paused state corner mark */}
      {isPaused && (
        <g transform="translate(47, 7)">
          <rect width="9" height="9" rx="2" fill="#000000" fillOpacity="0.6" />
          <rect x="2" y="2" width="2" height="5" rx="0.75" fill="#34D399" />
          <rect x="5" y="2" width="2" height="5" rx="0.75" fill="#34D399" />
        </g>
      )}
    </svg>
  );
}
