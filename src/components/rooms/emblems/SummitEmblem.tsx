'use client';

import React, { useId } from 'react';
import type { EmblemStage } from './emblemStages';
import type { EmblemState } from './emblemRegistry';

interface SummitEmblemProps {
  stage: EmblemStage;
  state: EmblemState;
  canAnimate: boolean;
  reducedMotion?: boolean;
}

export function SummitEmblem({
  stage,
  state,
  canAnimate,
  reducedMotion,
}: SummitEmblemProps) {
  const uid = useId().replace(/:/g, '_');
  const isStudying = state === 'studying';
  const isPaused = state === 'paused';
  const isPlaying = isStudying && canAnimate && !reducedMotion;
  const playState = isPlaying ? 'running' : 'paused';

  const stageStyle = (minStage: EmblemStage, origin: string = '60px 85px'): React.CSSProperties => {
    const isVisible = stage >= minStage;
    return {
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'scale(1)' : 'scale(0.85)',
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
        {/* Foothills Gradient (Stage 0) */}
        <linearGradient
          id={`summit_hills_${uid}`}
          x1="60"
          y1="82"
          x2="60"
          y2="108"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#312E81" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>

        {/* Tall Peak Gradient (Stage 2) */}
        <linearGradient
          id={`summit_tall_left_${uid}`}
          x1="30"
          y1="40"
          x2="60"
          y2="92"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#1E1B4B" />
        </linearGradient>

        <linearGradient
          id={`summit_tall_right_${uid}`}
          x1="60"
          y1="40"
          x2="85"
          y2="92"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#4338CA" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>

        {/* Secondary Peak Gradient */}
        <linearGradient
          id={`summit_ridge_2_${uid}`}
          x1="75"
          y1="55"
          x2="95"
          y2="96"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#818CF8" />
          <stop offset="100%" stopColor="#1E1B4B" />
        </linearGradient>

        {/* Small Front Peak (Stage 1) */}
        <linearGradient
          id={`summit_small_peak_${uid}`}
          x1="60"
          y1="68"
          x2="60"
          y2="98"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#312E81" />
        </linearGradient>

        {/* Rising Dawn Sun Glow Shape (Elliptical Dawn Glow - NOT a ring) */}
        <radialGradient
          id={`summit_dawn_glow_${uid}`}
          cx="76"
          cy="42"
          r="45"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FDBA74" stopOpacity="0.8" />
          <stop offset="40%" stopColor="#FB923C" stopOpacity="0.35" />
          <stop offset="80%" stopColor="#A78BFA" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#1E1B4B" stopOpacity="0" />
        </radialGradient>

        {/* Aurora Ribbons Gradient (Stage 6) */}
        <linearGradient
          id={`summit_aurora_${uid}`}
          x1="10"
          y1="10"
          x2="110"
          y2="35"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#86EFAC" stopOpacity="0.65" />
          <stop offset="50%" stopColor="#67E8F9" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#A78BFA" stopOpacity="0.4" />
        </linearGradient>
      </defs>

      <style>{`
        @keyframes sun-glow-breathe-${uid} {
          0%, 100% { opacity: 0.65; transform: scale(1); }
          50% { opacity: 0.95; transform: scale(1.06); }
        }
        @keyframes cloud-drift-1-${uid} {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(14px); }
        }
        @keyframes cloud-drift-2-${uid} {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(-12px); }
        }
        @keyframes flag-flutter-${uid} {
          0%, 100% { transform: scaleX(1); }
          50% { transform: scaleX(0.75); }
        }
        @keyframes aurora-wave-${uid} {
          0%, 100% { opacity: 0.45; transform: skewX(-2deg); }
          50% { opacity: 0.85; transform: skewX(3deg); }
        }
        @keyframes star-twinkle-s-${uid} {
          0%, 100% { opacity: 0.9; }
          50% { opacity: 0.3; }
        }

        .anim-sun-breathe-${uid} {
          animation: sun-glow-breathe-${uid} 3.6s ease-in-out infinite;
          animation-play-state: ${playState};
          transform-origin: 76px 42px;
        }
        .anim-cloud-1-${uid} {
          animation: cloud-drift-1-${uid} 7s ease-in-out infinite;
          animation-play-state: ${playState};
        }
        .anim-cloud-2-${uid} {
          animation: cloud-drift-2-${uid} 8.5s ease-in-out infinite;
          animation-play-state: ${playState};
        }
        .anim-flag-${uid} {
          animation: flag-flutter-${uid} 1.2s ease-in-out infinite;
          animation-play-state: ${playState};
          transform-origin: 52px 34px;
        }
        .anim-aurora-${uid} {
          animation: aurora-wave-${uid} 5s ease-in-out infinite;
          animation-play-state: ${playState};
          transform-origin: 60px 20px;
        }
        .anim-star-twinkle-${uid} {
          animation: star-twinkle-s-${uid} 2.5s ease-in-out infinite;
          animation-play-state: ${playState};
        }
      `}</style>

      {/* Background Starry Night */}
      <g opacity="0.45">
        <circle cx="20" cy="22" r="0.9" fill="#F8FAFC" className={`anim-star-twinkle-${uid}`} />
        <circle cx="38" cy="16" r="0.7" fill="#FDBA74" />
        <circle cx="95" cy="18" r="0.8" fill="#F8FAFC" className={`anim-star-twinkle-${uid}`} style={{ animationDelay: '1s' }} />
        <circle cx="82" cy="28" r="0.7" fill="#A78BFA" />
      </g>

      {/* Stage 6: Aurora Ribbons (Dancing Northern Lights) */}
      <g style={stageStyle(6, '60px 20px')} className={`anim-aurora-${uid}`}>
        <path
          d="M 10 24 Q 40 10 70 20 T 110 14 L 110 32 Q 75 22 45 30 T 10 36 Z"
          fill={`url(#summit_aurora_${uid})`}
        />
        <path
          d="M 15 16 Q 45 6 75 14 T 110 10 L 110 22 Q 75 16 45 22 T 15 24 Z"
          fill="#86EFAC"
          opacity="0.35"
        />
      </g>

      {/* Stage 4: Rising Dawn Sun Glow Shape (Behind Mountains, NOT a ring) */}
      <g style={stageStyle(4, '76px 42px')} className={`anim-sun-breathe-${uid}`}>
        {/* Soft radial glow shape */}
        <ellipse cx="76" cy="42" rx="32" ry="24" fill={`url(#summit_dawn_glow_${uid})`} />
        {/* Semi-visible dawn sun crest */}
        <path
          d="M 66 44 C 66 38 71 33 76 33 C 81 33 86 38 86 44 Z"
          fill="#FDE68A"
          opacity="0.85"
        />
      </g>

      {/* Stage 2: Tall Mountain Peak & Secondary Ridge */}
      <g style={stageStyle(2, '60px 85px')}>
        {/* Tall Peak (Left / Center) */}
        <g>
          {/* Sunny left face */}
          <polygon points="52,38 22,94 54,94" fill={`url(#summit_tall_left_${uid})`} />
          {/* Shadowed right face */}
          <polygon points="52,38 54,94 82,94" fill={`url(#summit_tall_right_${uid})`} />
          {/* Ridge spine line */}
          <line x1="52" y1="38" x2="54" y2="94" stroke="#818CF8" strokeWidth="0.8" opacity="0.6" />
        </g>

        {/* Secondary Craggy Peak (Right) */}
        <g>
          <polygon points="86,52 68,94 104,94" fill={`url(#summit_ridge_2_${uid})`} />
          <polygon points="86,52 88,94 104,94" fill="#1E1B4B" opacity="0.6" />
        </g>
      </g>

      {/* Stage 3: Snow Caps on Peaks */}
      <g style={stageStyle(3, '60px 60px')}>
        {/* Tall Peak Snow Cap */}
        <polygon
          points="52,38 41,56 46,54 52,60 58,54 63,57 52,38"
          fill="#F8FAFC"
        />
        {/* Shadow side of tall peak snow cap */}
        <polygon
          points="52,38 52,60 58,54 63,57 52,38"
          fill="#C7D2FE"
          opacity="0.75"
        />

        {/* Secondary Peak Snow Cap */}
        <polygon
          points="86,52 79,64 83,62 86,66 90,62 94,65 86,52"
          fill="#F8FAFC"
        />
        <polygon
          points="86,52 86,66 90,62 94,65 86,52"
          fill="#C7D2FE"
          opacity="0.75"
        />
      </g>

      {/* Stage 1: Small Peak (Foreground) */}
      <g style={stageStyle(1, '60px 90px')}>
        <polygon points="40,66 18,98 62,98" fill={`url(#summit_small_peak_${uid})`} />
        <polygon points="40,66 42,98 62,98" fill="#1E1B4B" opacity="0.5" />
        {/* Small peak mini snow dusting if stage >= 3 */}
        {stage >= 3 && (
          <polygon points="40,66 33,76 37,74 40,78 44,75 47,77 40,66" fill="#F8FAFC" />
        )}
      </g>

      {/* Stage 0: Rolling Foothills at Base (Always present ground) */}
      <g>
        <path
          d="M 12 90 Q 36 80 62 88 Q 90 82 108 92 L 108 108 L 12 108 Z"
          fill={`url(#summit_hills_${uid})`}
        />
        {/* Ridge shadow line */}
        <path
          d="M 12 94 Q 45 86 78 92 T 108 96"
          stroke="#4338CA"
          strokeWidth="1.2"
          opacity="0.5"
        />
      </g>

      {/* Stage 5: Drifting Alpine Clouds */}
      <g style={stageStyle(5, '60px 60px')}>
        {/* High Cloud Left */}
        <g className={`anim-cloud-1-${uid}`} opacity="0.85">
          <path
            d="M 24 50 Q 28 44 35 45 Q 42 42 46 47 Q 52 46 54 51 L 24 51 Z"
            fill="#F8FAFC"
          />
        </g>
        {/* Mid Cloud Right */}
        <g className={`anim-cloud-2-${uid}`} opacity="0.8">
          <path
            d="M 68 64 Q 72 58 79 59 Q 85 57 88 62 Q 94 61 96 66 L 68 66 Z"
            fill="#E0E7FF"
          />
        </g>
      </g>

      {/* Stage 6: Summit Flag on Highest Peak (52, 38) */}
      <g style={stageStyle(6, '52px 38px')}>
        {/* Flag Pole */}
        <line x1="52" y1="38" x2="52" y2="28" stroke="#F8FAFC" strokeWidth="1.2" />
        {/* Fluttering Summit Pennant Flag */}
        <polygon
          points="52,28 62,31 52,34"
          fill="#FDBA74"
          className={`anim-flag-${uid}`}
        />
        <circle cx="52" cy="28" r="1" fill="#FEF08A" />
      </g>
    </svg>
  );
}
