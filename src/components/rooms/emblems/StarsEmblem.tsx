'use client';

import React, { useId } from 'react';
import type { EmblemStage } from './emblemStages';
import type { EmblemState } from './emblemRegistry';

interface StarsEmblemProps {
  stage: EmblemStage;
  state: EmblemState;
  canAnimate: boolean;
  reducedMotion?: boolean;
}

export function StarsEmblem({
  stage,
  state,
  canAnimate,
  reducedMotion,
}: StarsEmblemProps) {
  const uid = useId().replace(/:/g, '_');
  const isStudying = state === 'studying';
  const isPaused = state === 'paused';
  const isPlaying = isStudying && canAnimate && !reducedMotion;
  const playState = isPlaying ? 'running' : 'paused';

  const stageStyle = (minStage: EmblemStage): React.CSSProperties => {
    const isVisible = stage >= minStage;
    return {
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'scale(1)' : 'scale(0.8)',
      transition: reducedMotion
        ? 'opacity 600ms ease'
        : 'opacity 600ms ease, transform 600ms ease',
      transformOrigin: '60px 60px',
      pointerEvents: isVisible ? 'auto' : 'none',
    };
  };

  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      style={{
        filter: isPaused ? 'saturate(0.6)' : undefined,
      }}
      aria-hidden="true"
    >
      <defs>
        {/* Soft Nebula Wash Gradient (Organic rhombus/diamond, NOT a ring) */}
        <radialGradient
          id={`nebula_wash_${uid}`}
          cx="60"
          cy="52"
          r="48"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#818CF8" stopOpacity="0.32" />
          <stop offset="45%" stopColor="#6366F1" stopOpacity="0.16" />
          <stop offset="80%" stopColor="#C7D2FE" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#0B132B" stopOpacity="0" />
        </radialGradient>

        {/* Shooting Star Gradient */}
        <linearGradient
          id={`shooting_star_${uid}`}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#FFF" stopOpacity="1" />
          <stop offset="35%" stopColor="#FDE68A" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#818CF8" stopOpacity="0" />
        </linearGradient>

        {/* Starlight Glow Def */}
        <filter id={`starlight_${uid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <style>{`
        @keyframes twinkle-a-${uid} {
          0%, 100% { opacity: 0.95; transform: scale(1); }
          50% { opacity: 0.35; transform: scale(0.8); }
        }
        @keyframes twinkle-b-${uid} {
          0%, 100% { opacity: 0.4; transform: scale(0.85); }
          50% { opacity: 1; transform: scale(1.15); }
        }
        @keyframes twinkle-c-${uid} {
          0%, 100% { opacity: 0.85; transform: scale(1); }
          35% { opacity: 0.25; transform: scale(0.75); }
          70% { opacity: 1; transform: scale(1.1); }
        }
        @keyframes line-glow-${uid} {
          0%, 100% { stroke-opacity: 0.55; stroke-width: 1.1; }
          50% { stroke-opacity: 0.9; stroke-width: 1.4; }
        }
        @keyframes shooting-star-anim-${uid} {
          0% {
            transform: translate(0, 0);
            opacity: 0;
          }
          4% {
            opacity: 1;
          }
          14% {
            transform: translate(-70px, 45px);
            opacity: 0;
          }
          100% {
            transform: translate(-70px, 45px);
            opacity: 0;
          }
        }

        .anim-twinkle-a-${uid} {
          animation: twinkle-a-${uid} 2.2s ease-in-out infinite;
          animation-play-state: ${playState};
          transform-box: fill-box;
          transform-origin: center;
        }
        .anim-twinkle-b-${uid} {
          animation: twinkle-b-${uid} 2.8s ease-in-out infinite 0.6s;
          animation-play-state: ${playState};
          transform-box: fill-box;
          transform-origin: center;
        }
        .anim-twinkle-c-${uid} {
          animation: twinkle-c-${uid} 3.4s ease-in-out infinite 1.2s;
          animation-play-state: ${playState};
          transform-box: fill-box;
          transform-origin: center;
        }
        .anim-line-glow-${uid} {
          animation: line-glow-${uid} 3s ease-in-out infinite;
          animation-play-state: ${playState};
        }
        .anim-shooting-star-${uid} {
          animation: shooting-star-anim-${uid} 6s linear infinite;
          animation-play-state: ${playState};
        }
      `}</style>

      {/* Stage 5 & 6: Soft Nebula Wash */}
      <rect
        x="10"
        y="10"
        width="100"
        height="100"
        fill={`url(#nebula_wash_${uid})`}
        style={stageStyle(5)}
      />

      {/* Subtle background star dust (always quietly visible) */}
      <g opacity="0.35">
        <circle cx="22" cy="28" r="0.8" fill="#FFF" />
        <circle cx="98" cy="32" r="0.7" fill="#C7D2FE" />
        <circle cx="28" cy="74" r="0.7" fill="#FDE68A" />
        <circle cx="94" cy="80" r="0.8" fill="#FFF" />
        <circle cx="50" cy="102" r="0.6" fill="#C7D2FE" />
      </g>

      {/* Constellation Connecting Lines */}
      <g className={`anim-line-glow-${uid}`}>
        {/* Stage 0 Base Triangle Lines: (60,18) to (40,88) and (80,88) */}
        <g style={stageStyle(0)}>
          <line x1="60" y1="20" x2="40" y2="88" stroke="#818CF8" strokeWidth="1" strokeDasharray="1.5 1.5" />
          <line x1="60" y1="20" x2="80" y2="88" stroke="#818CF8" strokeWidth="1" strokeDasharray="1.5 1.5" />
          <line x1="40" y1="88" x2="80" y2="88" stroke="#818CF8" strokeWidth="0.9" strokeDasharray="1.5 1.5" />
        </g>

        {/* Stage 1 Line to Center Hearth (60,68) */}
        <g style={stageStyle(1)}>
          <line x1="40" y1="88" x2="60" y2="68" stroke="#A5B4FC" strokeWidth="1.1" />
          <line x1="80" y1="88" x2="60" y2="68" stroke="#A5B4FC" strokeWidth="1.1" />
          <line x1="60" y1="20" x2="60" y2="68" stroke="#818CF8" strokeWidth="1" strokeDasharray="2 1.5" />
        </g>

        {/* Stage 2 Line to Mid Left (36,54) */}
        <g style={stageStyle(2)}>
          <line x1="40" y1="88" x2="36" y2="54" stroke="#A5B4FC" strokeWidth="1.1" />
          <line x1="36" y1="54" x2="60" y2="68" stroke="#A5B4FC" strokeWidth="1.1" />
        </g>

        {/* Stage 3 Lines to Mid Right (84,54) and High Left Wing (48,36) */}
        <g style={stageStyle(3)}>
          <line x1="80" y1="88" x2="84" y2="54" stroke="#A5B4FC" strokeWidth="1.1" />
          <line x1="84" y1="54" x2="60" y2="68" stroke="#A5B4FC" strokeWidth="1.1" />
          <line x1="36" y1="54" x2="48" y2="36" stroke="#C7D2FE" strokeWidth="1.1" />
          <line x1="48" y1="36" x2="60" y2="20" stroke="#C7D2FE" strokeWidth="1.1" />
        </g>

        {/* Stage 4 Line to High Right Wing (72,36) */}
        <g style={stageStyle(4)}>
          <line x1="84" y1="54" x2="72" y2="36" stroke="#C7D2FE" strokeWidth="1.1" />
          <line x1="72" y1="36" x2="60" y2="20" stroke="#C7D2FE" strokeWidth="1.1" />
          <line x1="48" y1="36" x2="72" y2="36" stroke="#C7D2FE" strokeWidth="0.9" strokeDasharray="2 2" />
        </g>

        {/* Stage 5 Lines to Core Keystone (60,48) & Lower Base (60,96) */}
        <g style={stageStyle(5)}>
          <line x1="60" y1="48" x2="48" y2="36" stroke="#FDE68A" strokeWidth="1.1" />
          <line x1="60" y1="48" x2="72" y2="36" stroke="#FDE68A" strokeWidth="1.1" />
          <line x1="60" y1="48" x2="60" y2="68" stroke="#FDE68A" strokeWidth="1.2" />
          <line x1="40" y1="88" x2="60" y2="96" stroke="#818CF8" strokeWidth="1" />
          <line x1="80" y1="88" x2="60" y2="96" stroke="#818CF8" strokeWidth="1" />
        </g>

        {/* Stage 6 Apex Spire to Zenith Star (60,10) */}
        <g style={stageStyle(6)}>
          <line x1="60" y1="20" x2="60" y2="10" stroke="#FDE68A" strokeWidth="1.4" />
        </g>
      </g>

      {/* Constellation Stars (11 Stars Revealed Progressively) */}
      <g>
        {/* --- STAGE 0: 3 Initial Stars --- */}
        {/* 1. Apex Star (60, 20) */}
        <g style={stageStyle(0)} className={`anim-twinkle-a-${uid}`}>
          <polygon points="60,15 62,19 66,20 62,21 60,25 58,21 54,20 58,19" fill="#FFF" />
          <circle cx="60" cy="20" r="2.8" fill="#FDE68A" />
        </g>
        {/* 2. Left Anchor (40, 88) */}
        <g style={stageStyle(0)} className={`anim-twinkle-b-${uid}`}>
          <circle cx="40" cy="88" r="2.2" fill="#FDE68A" />
          <circle cx="40" cy="88" r="4.2" fill="#818CF8" opacity="0.3" />
        </g>
        {/* 3. Right Anchor (80, 88) */}
        <g style={stageStyle(0)} className={`anim-twinkle-c-${uid}`}>
          <circle cx="80" cy="88" r="2.2" fill="#FDE68A" />
          <circle cx="80" cy="88" r="4.2" fill="#818CF8" opacity="0.3" />
        </g>

        {/* --- STAGE 1: 4th Star --- */}
        {/* 4. Center Hearth (60, 68) */}
        <g style={stageStyle(1)} className={`anim-twinkle-a-${uid}`}>
          <polygon points="60,64 61.5,67 64,68 61.5,69 60,72 58.5,69 56,68 58.5,67" fill="#FDE68A" />
          <circle cx="60" cy="68" r="2.4" fill="#FFF" />
        </g>

        {/* --- STAGE 2: 5th Star --- */}
        {/* 5. Mid Left (36, 54) */}
        <g style={stageStyle(2)} className={`anim-twinkle-b-${uid}`}>
          <circle cx="36" cy="54" r="2.2" fill="#C7D2FE" />
          <circle cx="36" cy="54" r="3.8" fill="#818CF8" opacity="0.3" />
        </g>

        {/* --- STAGE 3: 6th & 7th Stars --- */}
        {/* 6. Mid Right (84, 54) */}
        <g style={stageStyle(3)} className={`anim-twinkle-c-${uid}`}>
          <circle cx="84" cy="54" r="2.2" fill="#C7D2FE" />
          <circle cx="84" cy="54" r="3.8" fill="#818CF8" opacity="0.3" />
        </g>
        {/* 7. High Left Wing (48, 36) */}
        <g style={stageStyle(3)} className={`anim-twinkle-a-${uid}`}>
          <circle cx="48" cy="36" r="2.4" fill="#FDE68A" />
        </g>

        {/* --- STAGE 4: 8th Star --- */}
        {/* 8. High Right Wing (72, 36) */}
        <g style={stageStyle(4)} className={`anim-twinkle-b-${uid}`}>
          <circle cx="72" cy="36" r="2.4" fill="#FDE68A" />
        </g>

        {/* --- STAGE 5: 9th & 10th Stars --- */}
        {/* 9. Core Keystone (60, 48) */}
        <g style={stageStyle(5)} className={`anim-twinkle-c-${uid}`}>
          <polygon points="60,43 62,47 66,48 62,49 60,53 58,49 54,48 58,47" fill="#FFF" />
          <circle cx="60" cy="48" r="3" fill="#FDE68A" />
        </g>
        {/* 10. Lower Base Center (60, 96) */}
        <g style={stageStyle(5)} className={`anim-twinkle-a-${uid}`}>
          <circle cx="60" cy="96" r="2" fill="#818CF8" />
        </g>

        {/* --- STAGE 6: 11th Zenith Star --- */}
        {/* 11. Zenith Beacon (60, 10) */}
        <g style={stageStyle(6)} className={`anim-twinkle-b-${uid}`}>
          <polygon points="60,4 62.5,9 67,10 62.5,11 60,16 57.5,11 53,10 57.5,9" fill="#FFF" />
          <circle cx="60" cy="10" r="3.2" fill="#FDE68A" />
          <circle cx="60" cy="10" r="6" fill="#FDE68A" opacity="0.25" />
        </g>
      </g>

      {/* Stage 6: Shooting Star every 6s */}
      <g style={stageStyle(6)} className={`anim-shooting-star-${uid}`}>
        <line
          x1="108"
          y1="16"
          x2="92"
          y2="26"
          stroke={`url(#shooting_star_${uid})`}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <circle cx="92" cy="26" r="1.8" fill="#FFF" />
      </g>
    </svg>
  );
}
