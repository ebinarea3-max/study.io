'use client';

import React, { useId } from 'react';
import type { EmblemStage } from './emblemStages';
import type { EmblemState } from './emblemRegistry';

interface SkylineEmblemProps {
  stage: EmblemStage;
  state: EmblemState;
  canAnimate: boolean;
  reducedMotion?: boolean;
}

export function SkylineEmblem({
  stage,
  state,
  canAnimate,
  reducedMotion,
}: SkylineEmblemProps) {
  const uid = useId().replace(/:/g, '_');
  const isStudying = state === 'studying';
  const isPaused = state === 'paused';
  const isPlaying = isStudying && canAnimate && !reducedMotion;
  const playState = isPlaying ? 'running' : 'paused';

  const stageStyle = (minStage: EmblemStage, origin: string = '60px 98px'): React.CSSProperties => {
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
        {/* Tower Facade Gradients */}
        <linearGradient
          id={`skyline_tall_tower_${uid}`}
          x1="60"
          y1="34"
          x2="60"
          y2="98"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#1E1B4B" />
          <stop offset="60%" stopColor="#0F172A" />
          <stop offset="100%" stopColor="#05050A" />
        </linearGradient>

        <linearGradient
          id={`skyline_bldg_cyan_${uid}`}
          x1="30"
          y1="60"
          x2="30"
          y2="98"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#164E63" />
          <stop offset="100%" stopColor="#082F49" />
        </linearGradient>

        <linearGradient
          id={`skyline_bldg_pink_${uid}`}
          x1="85"
          y1="60"
          x2="85"
          y2="98"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#831843" />
          <stop offset="100%" stopColor="#500724" />
        </linearGradient>

        {/* Searchlight Conical Beam Gradient (Stage 6) */}
        <linearGradient
          id={`searchlight_beam_${uid}`}
          x1="0"
          y1="1"
          x2="0"
          y2="0"
        >
          <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.75" />
          <stop offset="50%" stopColor="#22D3EE" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
        </linearGradient>

        {/* Light Bridge Pulse Gradient (Stage 5) */}
        <linearGradient
          id={`bridge_gradient_${uid}`}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="0%"
        >
          <stop offset="0%" stopColor="#F472B6" />
          <stop offset="50%" stopColor="#22D3EE" />
          <stop offset="100%" stopColor="#F472B6" />
        </linearGradient>
      </defs>

      <style>{`
        @keyframes beacon-blink-${uid} {
          0%, 100% { opacity: 1; transform: scale(1.2); }
          50% { opacity: 0.15; transform: scale(0.8); }
        }
        @keyframes window-flicker-a-${uid} {
          0%, 100% { opacity: 0.95; }
          45% { opacity: 0.4; }
          65% { opacity: 0.9; }
          85% { opacity: 0.55; }
        }
        @keyframes window-flicker-b-${uid} {
          0%, 100% { opacity: 0.5; }
          30% { opacity: 0.95; }
          70% { opacity: 0.3; }
        }
        @keyframes searchlight-sweep-${uid} {
          0%, 100% { transform: rotate(-24deg); }
          50% { transform: rotate(24deg); }
        }
        @keyframes cyber-cloud-${uid} {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(12px); }
        }

        .anim-beacon-${uid} {
          animation: beacon-blink-${uid} 1.1s ease-in-out infinite;
          animation-play-state: ${playState};
          transform-box: fill-box;
          transform-origin: center;
        }
        .anim-window-a-${uid} {
          animation: window-flicker-a-${uid} 3.2s ease-in-out infinite;
          animation-play-state: ${playState};
        }
        .anim-window-b-${uid} {
          animation: window-flicker-b-${uid} 2.6s ease-in-out infinite 0.8s;
          animation-play-state: ${playState};
        }
        .anim-searchlight-${uid} {
          animation: searchlight-sweep-${uid} 5.5s ease-in-out infinite;
          animation-play-state: ${playState};
          transform-origin: 60px 34px;
        }
        .anim-cyber-cloud-${uid} {
          animation: cyber-cloud-${uid} 9s ease-in-out infinite;
          animation-play-state: ${playState};
        }
      `}</style>

      {/* Stage 6: Searchlight Beam (Behind Towers, Sweeping Night Sky) */}
      <g style={stageStyle(6, '60px 34px')} className={`anim-searchlight-${uid}`}>
        <polygon
          points="58,34 62,34 88,2 32,2"
          fill={`url(#searchlight_beam_${uid})`}
        />
      </g>

      {/* Cyber Moon / Upper Backdrop Ambiance (Stylized Crescent) */}
      <g opacity="0.3">
        <circle cx="24" cy="22" r="0.8" fill="#FFF" />
        <circle cx="96" cy="18" r="0.8" fill="#22D3EE" />
        <circle cx="88" cy="30" r="0.7" fill="#F472B6" />
      </g>

      {/* Drifting Night Haze Cloud */}
      <g className={`anim-cyber-cloud-${uid}`} opacity="0.25">
        <path
          d="M 20 42 Q 28 38 36 40 Q 44 36 52 41 L 52 44 L 20 44 Z"
          fill="#A855F7"
        />
      </g>

      {/* Stage 4: Tall Central Skyscraper & Beacon Tower */}
      <g style={stageStyle(4, '60px 98px')}>
        {/* Main Monolith Body */}
        <rect
          x="50"
          y="34"
          width="20"
          height="64"
          fill={`url(#skyline_tall_tower_${uid})`}
          stroke="#38BDF8"
          strokeWidth="0.8"
        />
        {/* Slanted Glass Crown */}
        <polygon points="50,34 60,26 70,34" fill="#0284C7" stroke="#38BDF8" strokeWidth="0.8" />
        {/* Antenna Spire */}
        <line x1="60" y1="26" x2="60" y2="18" stroke="#F472B6" strokeWidth="1.2" />
        {/* Flashing Red/Neon Beacon */}
        <circle cx="60" cy="18" r="2.2" fill="#F43F5E" className={`anim-beacon-${uid}`} />
      </g>

      {/* Stage 2 & 3: Background Flanking Buildings */}
      <g style={stageStyle(2, '60px 98px')}>
        {/* Building 2 (Mid Left) */}
        <rect
          x="32"
          y="56"
          width="18"
          height="42"
          fill={`url(#skyline_bldg_cyan_${uid})`}
          stroke="#0284C7"
          strokeWidth="0.8"
        />
        {/* Building 3 (Mid Right) */}
        <rect
          x="70"
          y="52"
          width="18"
          height="46"
          fill={`url(#skyline_bldg_pink_${uid})`}
          stroke="#BE185D"
          strokeWidth="0.8"
        />
      </g>

      {/* Stage 3: Additional Buildings to reach 5 Buildings */}
      <g style={stageStyle(3, '60px 98px')}>
        {/* Far Left Building (Building 4) */}
        <rect
          x="16"
          y="68"
          width="16"
          height="30"
          fill="#0F172A"
          stroke="#475569"
          strokeWidth="0.8"
        />
        {/* Far Right Building (Building 5) */}
        <rect
          x="88"
          y="64"
          width="16"
          height="34"
          fill="#1E1B4B"
          stroke="#6366F1"
          strokeWidth="0.8"
        />
      </g>

      {/* Stage 1: Single Small Building (Foreground Left) */}
      <g style={stageStyle(1, '26px 98px')}>
        <rect
          x="22"
          y="74"
          width="14"
          height="24"
          fill="#0369A1"
          stroke="#38BDF8"
          strokeWidth="0.8"
        />
      </g>

      {/* Stage 0: Ground Construction Crane (Right) */}
      <g style={stageStyle(0, '86px 98px')}>
        {/* Vertical Crane Mast */}
        <line x1="86" y1="98" x2="86" y2="60" stroke="#F59E0B" strokeWidth="1.6" />
        {/* Horizontal Jib Arm */}
        <line x1="72" y1="60" x2="102" y2="60" stroke="#F59E0B" strokeWidth="1.4" />
        {/* Diagonal Truss Guy Wire */}
        <line x1="86" y1="54" x2="102" y2="60" stroke="#FDE68A" strokeWidth="0.8" />
        <line x1="86" y1="54" x2="76" y2="60" stroke="#FDE68A" strokeWidth="0.8" />
        <line x1="86" y1="60" x2="86" y2="54" stroke="#F59E0B" strokeWidth="1.4" />
        {/* Hoist Cable and Hook */}
        <line x1="96" y1="60" x2="96" y2="76" stroke="#94A3B8" strokeWidth="0.7" strokeDasharray="1 1" />
        <rect x="94" y="76" width="4" height="3" fill="#F59E0B" />
      </g>

      {/* Stage 0 Ground Line (Always present city bedrock) */}
      <g>
        <line x1="10" y1="98" x2="110" y2="98" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="12" y1="99" x2="108" y2="99" stroke="#0EA5E9" strokeWidth="0.8" opacity="0.4" />
      </g>

      {/* Stage 3: Lit Windows Across the 5 Buildings */}
      <g style={stageStyle(3, '60px 98px')}>
        {/* Tall Tower Windows (Neon Cyan & Gold) */}
        <g className={`anim-window-a-${uid}`}>
          <rect x="54" y="44" width="3" height="3" fill="#22D3EE" />
          <rect x="63" y="44" width="3" height="3" fill="#FDE68A" />
          <rect x="54" y="52" width="3" height="3" fill="#FDE68A" />
          <rect x="63" y="52" width="3" height="3" fill="#22D3EE" />
          <rect x="54" y="60" width="3" height="3" fill="#22D3EE" />
          <rect x="63" y="60" width="3" height="3" fill="#FDE68A" />
          <rect x="54" y="68" width="3" height="3" fill="#FDE68A" />
          <rect x="63" y="68" width="3" height="3" fill="#22D3EE" />
        </g>

        {/* Flanking Building Windows (Pink & Cyan) */}
        <g className={`anim-window-b-${uid}`}>
          <rect x="36" y="64" width="2.5" height="2.5" fill="#22D3EE" />
          <rect x="42" y="64" width="2.5" height="2.5" fill="#22D3EE" />
          <rect x="36" y="72" width="2.5" height="2.5" fill="#F472B6" />
          <rect x="42" y="72" width="2.5" height="2.5" fill="#22D3EE" />
          <rect x="74" y="60" width="2.5" height="2.5" fill="#F472B6" />
          <rect x="80" y="60" width="2.5" height="2.5" fill="#F472B6" />
          <rect x="74" y="68" width="2.5" height="2.5" fill="#22D3EE" />
          <rect x="80" y="68" width="2.5" height="2.5" fill="#F472B6" />
          <rect x="74" y="76" width="2.5" height="2.5" fill="#F472B6" />
          <rect x="80" y="76" width="2.5" height="2.5" fill="#22D3EE" />
        </g>
      </g>

      {/* Stage 5: Dense Skyline with Bridges of Light */}
      <g style={stageStyle(5, '60px 70px')}>
        {/* High Light Bridge between Left Building and Tall Tower */}
        <line
          x1="46"
          y1="64"
          x2="50"
          y2="64"
          stroke={`url(#bridge_gradient_${uid})`}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        {/* Mid Light Bridge between Tall Tower and Right Building */}
        <line
          x1="70"
          y1="68"
          x2="74"
          y2="68"
          stroke={`url(#bridge_gradient_${uid})`}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        {/* Low Skywalk Bridge */}
        <line
          x1="32"
          y1="78"
          x2="22"
          y2="78"
          stroke="#22D3EE"
          strokeWidth="1.6"
        />
      </g>

      {/* Stage 6: Neon Rooftop Trim Lines & Spire Accents */}
      <g style={stageStyle(6, '60px 50px')}>
        {/* Neon Crown on Tall Tower */}
        <line x1="50" y1="34" x2="70" y2="34" stroke="#F472B6" strokeWidth="1.8" />
        {/* Neon Edge on Mid-Left Tower */}
        <line x1="32" y1="56" x2="50" y2="56" stroke="#22D3EE" strokeWidth="1.6" />
        {/* Neon Edge on Mid-Right Tower */}
        <line x1="70" y1="52" x2="88" y2="52" stroke="#F472B6" strokeWidth="1.6" />
        {/* Far Buildings Neon Edges */}
        <line x1="16" y1="68" x2="32" y2="68" stroke="#38BDF8" strokeWidth="1.4" />
        <line x1="88" y1="64" x2="104" y2="64" stroke="#A855F7" strokeWidth="1.4" />
      </g>
    </svg>
  );
}
