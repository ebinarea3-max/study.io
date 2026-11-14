'use client';

import React, { useId } from 'react';
import type { StudyIconState } from './registry';

interface IconProps {
  state: StudyIconState;
  canAnimate: boolean;
  reducedMotion?: boolean;
}

export function LampIcon({ state, canAnimate, reducedMotion }: IconProps) {
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
        <radialGradient
          id={`lamp_cone_${uid}`}
          cx="30"
          cy="24"
          r="36"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FFC56B" stopOpacity="0.8" />
          <stop offset="60%" stopColor="#FF9F43" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#FF9F43" stopOpacity="0" />
        </radialGradient>
        <radialGradient
          id={`lamp_bulb_${uid}`}
          cx="28"
          cy="23"
          r="6"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FFFDF0" />
          <stop offset="50%" stopColor="#FFDE8A" />
          <stop offset="100%" stopColor="#FF9F43" />
        </radialGradient>
      </defs>

      <style>{`
        @keyframes lamp-cone-breathe-${uid} {
          0%, 100% { opacity: 0.70; }
          50% { opacity: 1.0; }
        }
        @keyframes lamp-bulb-flicker-${uid} {
          0%, 100% { opacity: 1.0; }
          25% { opacity: 0.88; }
          45% { opacity: 0.98; }
          70% { opacity: 0.82; }
          85% { opacity: 1.0; }
        }
        @keyframes lamp-mote1-${uid} {
          0% { transform: translate(0, 0); opacity: 0; }
          30% { opacity: 0.8; }
          80% { opacity: 0.4; }
          100% { transform: translate(-3px, -15px); opacity: 0; }
        }
        @keyframes lamp-mote2-${uid} {
          0% { transform: translate(0, 0); opacity: 0; }
          30% { opacity: 0.9; }
          80% { opacity: 0.3; }
          100% { transform: translate(4px, -18px); opacity: 0; }
        }
        @keyframes lamp-mote3-${uid} {
          0% { transform: translate(0, 0); opacity: 0; }
          30% { opacity: 0.85; }
          80% { opacity: 0.35; }
          100% { transform: translate(-2px, -12px); opacity: 0; }
        }
        .anim-lamp-cone-${uid} {
          animation: lamp-cone-breathe-${uid} 3.2s ease-in-out infinite;
          animation-play-state: ${playState};
        }
        .anim-lamp-bulb-${uid} {
          animation: lamp-bulb-flicker-${uid} 3.2s ease-in-out infinite;
          animation-play-state: ${playState};
        }
        .anim-lamp-mote1-${uid} {
          animation: lamp-mote1-${uid} 3.2s ease-out infinite;
          animation-play-state: ${playState};
        }
        .anim-lamp-mote2-${uid} {
          animation: lamp-mote2-${uid} 3.2s ease-out infinite 1.1s;
          animation-play-state: ${playState};
        }
        .anim-lamp-mote3-${uid} {
          animation: lamp-mote3-${uid} 3.2s ease-out infinite 2.2s;
          animation-play-state: ${playState};
        }
      `}</style>

      {/* Desk surface line */}
      <rect x="8" y="54" width="48" height="2.5" rx="1.25" fill="#5A3A1B" fillOpacity="0.4" />

      {/* Lamp Base */}
      <rect x="36" y="51" width="16" height="3" rx="1.5" fill="#42250E" />
      <rect x="38" y="50" width="12" height="2" rx="1" fill="#78471D" />

      {/* Lamp Stem / Arm */}
      <path
        d="M44 50 L44 32 L31 22"
        stroke="#5A3212"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M44 50 L44 32 L31 22"
        stroke="#8D5523"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Arm Joints */}
      <circle cx="44" cy="32" r="2.5" fill="#D98A36" />
      <circle cx="31" cy="22" r="2" fill="#D98A36" />

      {/* Light cone beam (animated breathe) */}
      <polygon
        className={`anim-lamp-cone-${uid}`}
        points="24,24 35,21 54,54 6,54"
        fill={`url(#lamp_cone_${uid})`}
        style={{ mixBlendMode: 'screen' }}
      />

      {/* Lamp Shade */}
      <g transform="rotate(22 28 22)">
        <path
          d="M21 16 L35 18 L38 27 L18 25 Z"
          fill="#D98A36"
        />
        <path
          d="M21 16 L35 18 L34 20 L22 18 Z"
          fill="#F5B25B"
        />
        <ellipse cx="28" cy="26" rx="10" ry="2" fill="#8D5523" />
      </g>

      {/* Glowing Bulb (animated flicker) */}
      <circle
        className={`anim-lamp-bulb-${uid}`}
        cx="28"
        cy="25"
        r="3.5"
        fill={`url(#lamp_bulb_${uid})`}
      />

      {/* 3 tiny dust motes drifting upward */}
      <circle
        className={`anim-lamp-mote1-${uid}`}
        cx="26"
        cy="44"
        r="1"
        fill="#FFEAA7"
      />
      <circle
        className={`anim-lamp-mote2-${uid}`}
        cx="33"
        cy="48"
        r="1.2"
        fill="#FFD27D"
      />
      <circle
        className={`anim-lamp-mote3-${uid}`}
        cx="21"
        cy="40"
        r="0.8"
        fill="#FFF4CF"
      />

      {/* Paused state corner mark */}
      {isPaused && (
        <g transform="translate(47, 7)">
          <rect width="9" height="9" rx="2" fill="#000000" fillOpacity="0.6" />
          <rect x="2" y="2" width="2" height="5" rx="0.75" fill="#FFC56B" />
          <rect x="5" y="2" width="2" height="5" rx="0.75" fill="#FFC56B" />
        </g>
      )}
    </svg>
  );
}
