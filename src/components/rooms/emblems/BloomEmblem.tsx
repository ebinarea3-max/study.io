'use client';

import React, { useId } from 'react';
import type { EmblemStage } from './emblemStages';
import type { EmblemState } from './emblemRegistry';

interface BloomEmblemProps {
  stage: EmblemStage;
  state: EmblemState;
  canAnimate: boolean;
  reducedMotion?: boolean;
}

export function BloomEmblem({
  stage,
  state,
  canAnimate,
  reducedMotion,
}: BloomEmblemProps) {
  const uid = useId().replace(/:/g, '_');
  const isStudying = state === 'studying';
  const isPaused = state === 'paused';
  const isPlaying = isStudying && canAnimate && !reducedMotion;
  const playState = isPlaying ? 'running' : 'paused';

  const stageStyle = (minStage: EmblemStage, origin: string = '60px 90px'): React.CSSProperties => {
    const isVisible = stage >= minStage;
    return {
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'scale(1)' : 'scale(0.8)',
      transition: reducedMotion
        ? 'opacity 600ms ease'
        : 'opacity 600ms ease, transform 600ms ease',
      transformOrigin: origin,
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
        {/* Soil Base Gradient */}
        <linearGradient
          id={`bloom_soil_${uid}`}
          x1="60"
          y1="82"
          x2="60"
          y2="108"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#1E3A24" />
          <stop offset="100%" stopColor="#0B1C10" />
        </linearGradient>

        {/* Stem & Leaves Gradient */}
        <linearGradient
          id={`bloom_stem_${uid}`}
          x1="60"
          y1="40"
          x2="60"
          y2="92"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#86EFAC" />
          <stop offset="70%" stopColor="#22C55E" />
          <stop offset="100%" stopColor="#15803D" />
        </linearGradient>

        {/* Petal Gradient (Half/Full Open) */}
        <linearGradient
          id={`bloom_petal_${uid}`}
          x1="60"
          y1="25"
          x2="60"
          y2="60"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FDF2F8" />
          <stop offset="40%" stopColor="#F9A8D4" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>

        {/* Blossom Center Gradient */}
        <linearGradient
          id={`bloom_center_${uid}`}
          x1="60"
          y1="42"
          x2="60"
          y2="54"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="100%" stopColor="#EAB308" />
        </linearGradient>

        {/* Stage 6 Mystic Glow (Diamond/Organic shape glow, NOT a ring) */}
        <radialGradient
          id={`bloom_aura_${uid}`}
          cx="60"
          cy="48"
          r="45"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#86EFAC" stopOpacity="0.38" />
          <stop offset="50%" stopColor="#F9A8D4" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#15803D" stopOpacity="0" />
        </radialGradient>
      </defs>

      <style>{`
        @keyframes stem-sway-${uid} {
          0%, 100% { transform: rotate(0deg); }
          30% { transform: rotate(2deg); }
          75% { transform: rotate(-2deg); }
        }
        @keyframes petal-breathe-${uid} {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }
        @keyframes pollen-float-1-${uid} {
          0% { transform: translate(0, 0); opacity: 0; }
          30% { opacity: 0.9; }
          75% { opacity: 0.7; }
          100% { transform: translate(-10px, -32px); opacity: 0; }
        }
        @keyframes pollen-float-2-${uid} {
          0% { transform: translate(0, 0); opacity: 0; }
          30% { opacity: 0.85; }
          75% { opacity: 0.6; }
          100% { transform: translate(12px, -36px); opacity: 0; }
        }
        @keyframes firefly-wander-1-${uid} {
          0%, 100% { transform: translate(0, 0); opacity: 0.2; }
          25% { transform: translate(-8px, -10px); opacity: 1; }
          50% { transform: translate(4px, -16px); opacity: 0.4; }
          75% { transform: translate(-5px, -6px); opacity: 0.9; }
        }
        @keyframes firefly-wander-2-${uid} {
          0%, 100% { transform: translate(0, 0); opacity: 0.3; }
          30% { transform: translate(9px, -8px); opacity: 0.95; }
          65% { transform: translate(-4px, -14px); opacity: 0.25; }
          85% { transform: translate(6px, -4px); opacity: 0.8; }
        }

        .anim-stem-sway-${uid} {
          animation: stem-sway-${uid} 3.2s ease-in-out infinite;
          animation-play-state: ${playState};
          transform-origin: 60px 90px;
        }
        .anim-petal-breathe-${uid} {
          animation: petal-breathe-${uid} 2.6s ease-in-out infinite;
          animation-play-state: ${playState};
          transform-origin: 60px 48px;
        }
        .anim-pollen-1-${uid} {
          animation: pollen-float-1-${uid} 2.8s ease-out infinite;
          animation-play-state: ${playState};
        }
        .anim-pollen-2-${uid} {
          animation: pollen-float-2-${uid} 3.4s ease-out infinite 0.9s;
          animation-play-state: ${playState};
        }
        .anim-firefly-1-${uid} {
          animation: firefly-wander-1-${uid} 4s ease-in-out infinite;
          animation-play-state: ${playState};
        }
        .anim-firefly-2-${uid} {
          animation: firefly-wander-2-${uid} 4.6s ease-in-out infinite 1.2s;
          animation-play-state: ${playState};
        }
      `}</style>

      {/* Stage 6: Mystic Botanical Backdrop Glow */}
      <rect
        x="15"
        y="8"
        width="90"
        height="85"
        fill={`url(#bloom_aura_${uid})`}
        style={stageStyle(6, '60px 48px')}
      />

      {/* Soil Mound (Always present as botanical foundation) */}
      <g>
        <path
          d="M 18 96 Q 60 84 102 96 L 102 108 L 18 108 Z"
          fill={`url(#bloom_soil_${uid})`}
        />
        {/* Subtle moss & soil pebbles */}
        <ellipse cx="44" cy="93" rx="4" ry="1.8" fill="#15803D" opacity="0.6" />
        <ellipse cx="76" cy="92" rx="5" ry="2" fill="#22C55E" opacity="0.45" />
        <ellipse cx="60" cy="94" rx="3" ry="1.4" fill="#14532D" opacity="0.8" />
      </g>

      {/* Stage 0: Dormant Seed in Soil */}
      <g style={stageStyle(0, '60px 90px')}>
        <path
          d="M 60 86 C 57 88 56 91 58 93 C 60 95 63 94 64 92 C 65 90 63 87 60 86 Z"
          fill="#D97706"
          stroke="#92400E"
          strokeWidth="0.8"
        />
        {/* Tiny golden vital spark inside seed */}
        <circle cx="60" cy="91" r="1.2" fill="#FDE68A" />
      </g>

      {/* Plant Hierarchy (Stem & Foliage that sways) */}
      <g className={`anim-stem-sway-${uid}`}>
        {/* Stage 1: Sprout with 2 leaves */}
        <g style={stageStyle(1, '60px 90px')}>
          {/* Young stem base */}
          <path
            d="M 60 92 Q 60 82 60 76"
            stroke={`url(#bloom_stem_${uid})`}
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          {/* Left leaf */}
          <path
            d="M 60 80 Q 51 77 48 81 Q 54 84 60 81"
            fill="#86EFAC"
            stroke="#22C55E"
            strokeWidth="0.8"
          />
          {/* Right leaf */}
          <path
            d="M 60 78 Q 69 75 72 79 Q 66 82 60 79"
            fill="#4ADE80"
            stroke="#16A34A"
            strokeWidth="0.8"
          />
        </g>

        {/* Stage 2: Taller Stem with 4 Leaves */}
        <g style={stageStyle(2, '60px 90px')}>
          {/* Extended stem */}
          <path
            d="M 60 76 Q 59 66 60 58"
            stroke={`url(#bloom_stem_${uid})`}
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          {/* Higher left leaf */}
          <path
            d="M 60 68 Q 49 64 46 68 Q 53 72 60 69"
            fill="#86EFAC"
            stroke="#22C55E"
            strokeWidth="0.8"
          />
          {/* Higher right leaf */}
          <path
            d="M 60 64 Q 71 60 74 65 Q 67 69 60 65"
            fill="#4ADE80"
            stroke="#16A34A"
            strokeWidth="0.8"
          />
        </g>

        {/* Stage 3: Bud at the Apex */}
        <g style={stageStyle(3, '60px 58px')}>
          {/* Stem tip */}
          <path
            d="M 60 58 L 60 52"
            stroke={`url(#bloom_stem_${uid})`}
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Calyx sepals */}
          <path d="M 57 52 Q 54 48 56 44 Q 59 48 58 52" fill="#22C55E" />
          <path d="M 63 52 Q 66 48 64 44 Q 61 48 62 52" fill="#22C55E" />
          {/* Emerging pink bud core */}
          <path
            d="M 58 50 C 56 45 59 40 60 38 C 61 40 64 45 62 50 Z"
            fill={`url(#bloom_petal_${uid})`}
          />
        </g>

        {/* Stage 4: Half-Open Flower */}
        <g style={stageStyle(4, '60px 48px')}>
          {/* Back petals opening */}
          <path
            d="M 60 48 Q 48 38 46 44 Q 53 49 60 49"
            fill="#F472B6"
            opacity="0.85"
          />
          <path
            d="M 60 48 Q 72 38 74 44 Q 67 49 60 49"
            fill="#F472B6"
            opacity="0.85"
          />
          {/* Upright opening blossom */}
          <path
            d="M 54 47 C 52 38 58 33 60 31 C 62 33 68 38 66 47 Z"
            fill={`url(#bloom_petal_${uid})`}
          />
        </g>

        {/* Stage 5: Full Radiant Flower with Breathing Animation */}
        <g
          style={stageStyle(5, '60px 48px')}
          className={`anim-petal-breathe-${uid}`}
        >
          {/* Outer Layer of Blossom Petals (8 organic geometric petals) */}
          <g>
            {/* Top */}
            <path d="M 60 48 C 55 38 56 26 60 23 C 64 26 65 38 60 48 Z" fill={`url(#bloom_petal_${uid})`} />
            {/* Top Right */}
            <path d="M 60 48 C 68 40 78 35 81 38 C 79 43 70 48 60 48 Z" fill="#F472B6" />
            {/* Right */}
            <path d="M 60 48 C 72 46 84 48 85 52 C 82 56 70 53 60 48 Z" fill={`url(#bloom_petal_${uid})`} />
            {/* Bottom Right */}
            <path d="M 60 48 C 68 55 76 63 73 66 C 68 65 63 56 60 48 Z" fill="#EC4899" />
            {/* Bottom Left */}
            <path d="M 60 48 C 52 55 44 63 47 66 C 52 65 57 56 60 48 Z" fill="#EC4899" />
            {/* Left */}
            <path d="M 60 48 C 48 46 36 48 35 52 C 38 56 50 53 60 48 Z" fill={`url(#bloom_petal_${uid})`} />
            {/* Top Left */}
            <path d="M 60 48 C 52 40 42 35 39 38 C 41 43 50 48 60 48 Z" fill="#F472B6" />
          </g>

          {/* Inner Golden Pollen Center */}
          <ellipse
            cx="60"
            cy="48"
            rx="6.5"
            ry="6"
            fill={`url(#bloom_center_${uid})`}
            stroke="#FEF08A"
            strokeWidth="0.8"
          />
          {/* Stamen detailing */}
          <circle cx="58" cy="46" r="1.1" fill="#713F12" opacity="0.6" />
          <circle cx="62" cy="46" r="1.1" fill="#713F12" opacity="0.6" />
          <circle cx="60" cy="50" r="1.1" fill="#713F12" opacity="0.6" />
          <circle cx="57" cy="49" r="0.9" fill="#713F12" opacity="0.5" />
          <circle cx="63" cy="49" r="0.9" fill="#713F12" opacity="0.5" />
        </g>
      </g>

      {/* Stage 5: Floating Pollen Motes */}
      <g style={stageStyle(5, '60px 48px')}>
        <circle cx="56" cy="42" r="1.5" fill="#FDE68A" className={`anim-pollen-1-${uid}`} />
        <circle cx="65" cy="44" r="1.3" fill="#FEF08A" className={`anim-pollen-2-${uid}`} />
        <circle cx="59" cy="38" r="1.2" fill="#FDE68A" className={`anim-pollen-1-${uid}`} style={{ animationDelay: '1.4s' }} />
        <circle cx="63" cy="36" r="1.4" fill="#FEF08A" className={`anim-pollen-2-${uid}`} style={{ animationDelay: '2.1s' }} />
      </g>

      {/* Stage 6: Bioluminescent Fireflies */}
      <g style={stageStyle(6, '60px 48px')}>
        {/* Firefly 1 */}
        <g className={`anim-firefly-1-${uid}`}>
          <ellipse cx="38" cy="42" rx="2" ry="1.5" fill="#86EFAC" />
          <circle cx="38" cy="42" r="3.5" fill="#86EFAC" opacity="0.35" />
        </g>
        {/* Firefly 2 */}
        <g className={`anim-firefly-2-${uid}`}>
          <ellipse cx="82" cy="46" rx="2" ry="1.5" fill="#FDE68A" />
          <circle cx="82" cy="46" r="3.5" fill="#FDE68A" opacity="0.35" />
        </g>
        {/* Firefly 3 */}
        <g className={`anim-firefly-1-${uid}`} style={{ animationDelay: '2.2s' }}>
          <ellipse cx="48" cy="28" rx="1.8" ry="1.4" fill="#86EFAC" />
          <circle cx="48" cy="28" r="3" fill="#86EFAC" opacity="0.3" />
        </g>
        {/* Firefly 4 */}
        <g className={`anim-firefly-2-${uid}`} style={{ animationDelay: '3.1s' }}>
          <ellipse cx="72" cy="24" rx="1.8" ry="1.4" fill="#FDE68A" />
          <circle cx="72" cy="24" r="3" fill="#FDE68A" opacity="0.3" />
        </g>
      </g>
    </svg>
  );
}
