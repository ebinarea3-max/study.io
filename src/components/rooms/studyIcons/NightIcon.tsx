'use client';

import React, { useId } from 'react';
import type { StudyIconState } from './registry';

interface IconProps {
  state: StudyIconState;
  canAnimate: boolean;
  reducedMotion?: boolean;
}

export function NightIcon({ state, canAnimate, reducedMotion }: IconProps) {
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
        <radialGradient id={`moon_halo_${uid}`} cx="26" cy="27" r="16" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.4" />
          <stop offset="60%" stopColor="#FDE68A" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#FDE68A" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`moon_body_${uid}`} x1="18" y1="18" x2="34" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFBEB" />
          <stop offset="50%" stopColor="#FDE68A" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>

      <style>{`
        @keyframes moon-float-${uid} {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-2px); }
        }
        @keyframes star-twinkle-${uid} {
          0%, 100% { opacity: 0.2; transform: scale(0.6); }
          50% { opacity: 1; transform: scale(1.15); }
        }
        @keyframes shooting-star-${uid} {
          0% { transform: translate(-10px, -10px); opacity: 0; }
          10% { opacity: 1; }
          25% { transform: translate(50px, 40px); opacity: 0; }
          100% { transform: translate(50px, 40px); opacity: 0; }
        }
        .anim-moon-float-${uid} {
          animation: moon-float-${uid} 3.2s ease-in-out infinite;
          animation-play-state: ${playState};
        }
        .anim-star-1-${uid} {
          animation: star-twinkle-${uid} 2.2s ease-in-out infinite 0s;
          animation-play-state: ${playState};
          transform-origin: 43px 18px;
        }
        .anim-star-2-${uid} {
          animation: star-twinkle-${uid} 2.6s ease-in-out infinite 0.7s;
          animation-play-state: ${playState};
          transform-origin: 51px 32px;
        }
        .anim-star-3-${uid} {
          animation: star-twinkle-${uid} 2s ease-in-out infinite 1.4s;
          animation-play-state: ${playState};
          transform-origin: 15px 16px;
        }
        .anim-star-4-${uid} {
          animation: star-twinkle-${uid} 2.8s ease-in-out infinite 2.1s;
          animation-play-state: ${playState};
          transform-origin: 39px 44px;
        }
        .anim-star-5-${uid} {
          animation: star-twinkle-${uid} 2.4s ease-in-out infinite 1s;
          animation-play-state: ${playState};
          transform-origin: 18px 46px;
        }
        .anim-shooting-star-${uid} {
          animation: shooting-star-${uid} 6s linear infinite;
          animation-play-state: ${playState};
        }
      `}</style>

      {/* Diagonal Shooting Star crossing every 6s */}
      <g className={`anim-shooting-star-${uid}`}>
        <line x1="8" y1="12" x2="22" y2="23" stroke="#818CF8" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="22" cy="23" r="1.5" fill="#FFFFFF" />
      </g>

      {/* Floating Crescent Moon (floats 2px) */}
      <g className={`anim-moon-float-${uid}`}>
        {/* Soft Moon Halo */}
        <circle cx="26" cy="27" r="16" fill={`url(#moon_halo_${uid})`} />

        {/* Crescent Moon Path */}
        <path
          d="M31 15 C21 15 15 23 15 31 C15 39 21 47 31 47 C25 43 23 37 23 31 C23 25 25 19 31 15 Z"
          fill={`url(#moon_body_${uid})`}
        />

        {/* Gentle craters on moon */}
        <circle cx="21" cy="28" r="1.5" fill="#F59E0B" fillOpacity="0.4" />
        <circle cx="23" cy="36" r="1.2" fill="#F59E0B" fillOpacity="0.3" />
      </g>

      {/* 5 Stars twinkling at different phases */}
      {/* Star 1 (upper right, 4-point) */}
      <g className={`anim-star-1-${uid}`}>
        <path d="M43 15 L44 17.5 L46.5 18 L44 18.5 L43 21 L42 18.5 L39.5 18 L42 17.5 Z" fill="#FDE68A" />
      </g>

      {/* Star 2 (middle right, bright star) */}
      <g className={`anim-star-2-${uid}`}>
        <circle cx="51" cy="32" r="1.8" fill="#818CF8" />
        <circle cx="51" cy="32" r="0.9" fill="#FFFFFF" />
      </g>

      {/* Star 3 (upper left, small star) */}
      <g className={`anim-star-3-${uid}`}>
        <circle cx="15" cy="16" r="1.2" fill="#FDE68A" />
      </g>

      {/* Star 4 (lower right) */}
      <g className={`anim-star-4-${uid}`}>
        <path d="M39 42 L39.6 43.6 L41.2 44 L39.6 44.4 L39 46 L38.4 44.4 L36.8 44 L38.4 43.6 Z" fill="#818CF8" />
      </g>

      {/* Star 5 (lower left) */}
      <g className={`anim-star-5-${uid}`}>
        <circle cx="18" cy="46" r="1.2" fill="#C7D2FE" />
      </g>

      {/* Soft night cloud layer along bottom */}
      <ellipse cx="44" cy="53" rx="16" ry="4" fill="#1E1B4B" fillOpacity="0.7" />
      <ellipse cx="28" cy="55" rx="18" ry="4.5" fill="#1E1B4B" fillOpacity="0.5" />

      {/* Paused state corner mark */}
      {isPaused && (
        <g transform="translate(47, 7)">
          <rect width="9" height="9" rx="2" fill="#000000" fillOpacity="0.6" />
          <rect x="2" y="2" width="2" height="5" rx="0.75" fill="#FDE68A" />
          <rect x="5" y="2" width="2" height="5" rx="0.75" fill="#FDE68A" />
        </g>
      )}
    </svg>
  );
}
