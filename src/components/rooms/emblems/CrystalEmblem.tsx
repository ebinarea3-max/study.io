'use client';

import React, { useId } from 'react';
import type { EmblemStage } from './emblemStages';
import type { EmblemState } from './emblemRegistry';

interface CrystalEmblemProps {
  stage: EmblemStage;
  state: EmblemState;
  canAnimate: boolean;
  reducedMotion?: boolean;
}

export function CrystalEmblem({
  stage,
  state,
  canAnimate,
  reducedMotion,
}: CrystalEmblemProps) {
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
      transformOrigin: '60px 80px',
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
        {/* Crystal Body Gradients */}
        <linearGradient
          id={`crystal_main_${uid}`}
          x1="45"
          y1="25"
          x2="75"
          y2="88"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#E0F2FE" />
          <stop offset="35%" stopColor="#67E8F9" />
          <stop offset="70%" stopColor="#818CF8" />
          <stop offset="100%" stopColor="#312E81" />
        </linearGradient>

        <linearGradient
          id={`crystal_facet_l_${uid}`}
          x1="50"
          y1="30"
          x2="60"
          y2="88"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#BAE6FD" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>

        <linearGradient
          id={`crystal_facet_r_${uid}`}
          x1="60"
          y1="30"
          x2="70"
          y2="88"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#1E1B4B" />
        </linearGradient>

        {/* Diagonal Light Sweep Clip */}
        <clipPath id={`crystal_clip_${uid}`}>
          <polygon points="60,25 74,48 70,88 50,88 46,48" />
        </clipPath>

        <linearGradient
          id={`light_sweep_${uid}`}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="45%" stopColor="#FFFFFF" stopOpacity="0.75" />
          <stop offset="55%" stopColor="#67E8F9" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>

        {/* Ambient Glow Breathing Gradient */}
        <radialGradient
          id={`crystal_glow_${uid}`}
          cx="60"
          cy="60"
          r="45"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#67E8F9" stopOpacity="0.35" />
          <stop offset="60%" stopColor="#818CF8" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#818CF8" stopOpacity="0" />
        </radialGradient>
      </defs>

      <style>{`
        @keyframes light-sweep-${uid} {
          0% { transform: translateY(-70px) translateX(-40px) rotate(35deg); }
          60%, 100% { transform: translateY(70px) translateX(40px) rotate(35deg); }
        }
        @keyframes shard-bob-1-${uid} {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3.5px); }
        }
        @keyframes shard-bob-2-${uid} {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(3px); }
        }
        @keyframes glow-breathe-${uid} {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 0.85; }
        }
        .anim-sweep-${uid} {
          animation: light-sweep-${uid} 3.2s ease-in-out infinite;
          animation-play-state: ${playState};
        }
        .anim-shard-1-${uid} {
          animation: shard-bob-1-${uid} 2.6s ease-in-out infinite;
          animation-play-state: ${playState};
        }
        .anim-shard-2-${uid} {
          animation: shard-bob-2-${uid} 3s ease-in-out infinite 0.8s;
          animation-play-state: ${playState};
        }
        .anim-glow-${uid} {
          animation: glow-breathe-${uid} 3s ease-in-out infinite;
          animation-play-state: ${playState};
        }
      `}</style>

      {/* Stage 6: Radiant Geometric Light-Ray Fan (not a circle!) */}
      <g style={stageStyle(6)} opacity="0.65">
        <polygon points="60,60 20,20 28,15" fill="#67E8F9" fillOpacity="0.25" />
        <polygon points="60,60 40,10 49,8" fill="#A78BFA" fillOpacity="0.2" />
        <polygon points="60,60 71,8 80,10" fill="#67E8F9" fillOpacity="0.2" />
        <polygon points="60,60 92,15 100,20" fill="#A78BFA" fillOpacity="0.25" />
        <polygon points="60,60 108,36 105,45" fill="#67E8F9" fillOpacity="0.18" />
        <polygon points="60,60 12,36 15,45" fill="#A78BFA" fillOpacity="0.18" />
      </g>

      {/* Ambient Breathing Glow */}
      <circle
        className={`anim-glow-${uid}`}
        cx="60"
        cy="62"
        r="40"
        fill={`url(#crystal_glow_${uid})`}
        style={stageStyle(1)}
      />

      {/* Bedrock / Crystal Base Pedestal */}
      <ellipse cx="60" cy="94" rx="34" ry="7.5" fill="#0C0E24" />
      <polygon points="26,94 36,88 84,88 94,94 82,98 38,98" fill="#17193B" stroke="#25295C" strokeWidth="0.75" />

      {/* Stage 0: Tiny Solitary Shard */}
      <g style={stageStyle(0)}>
        <polygon points="60,78 64,84 60,88 56,84" fill="#67E8F9" />
        <polygon points="60,78 64,84 60,88" fill="#A78BFA" fillOpacity="0.6" />
      </g>

      {/* Stage 1: Small Cut Gem */}
      <g style={stageStyle(1)}>
        <polygon points="60,68 67,76 60,88 53,76" fill={`url(#crystal_main_${uid})`} />
        <polygon points="60,68 60,88 53,76" fill={`url(#crystal_facet_l_${uid})`} />
      </g>

      {/* Stage 2: Multi-faceted Gem Prism */}
      <g style={stageStyle(2)}>
        <polygon points="60,56 68,66 65,88 55,88 52,66" fill={`url(#crystal_main_${uid})`} />
        <polygon points="60,56 60,88 52,66" fill={`url(#crystal_facet_l_${uid})`} />
        <polygon points="60,56 68,66 60,88" fill={`url(#crystal_facet_r_${uid})`} />
        <polygon points="52,66 60,72 55,88" fill="#38BDF8" fillOpacity="0.4" />
      </g>

      {/* Stage 3+: Dual Crystals (Secondary Sister Crystal) */}
      <g style={stageStyle(3)}>
        {/* Sister crystal on right */}
        <polygon points="76,44 83,54 80,88 70,88 68,54" fill="#6366F1" />
        <polygon points="76,44 76,88 68,54" fill="#38BDF8" fillOpacity="0.7" />
        <polygon points="76,44 83,54 76,88" fill="#A78BFA" fillOpacity="0.9" />
      </g>

      {/* Stage 4+: Cluster of Three (Tertiary Crystal on Left) */}
      <g style={stageStyle(4)}>
        {/* Left tertiary crystal */}
        <polygon points="44,50 51,60 48,88 38,88 36,60" fill="#4F46E5" />
        <polygon points="44,50 44,88 36,60" fill="#67E8F9" fillOpacity="0.8" />
        <polygon points="44,50 51,60 44,88" fill="#818CF8" fillOpacity="0.7" />
      </g>

      {/* Stage 3-6: Towering Center Monarch Crystal */}
      <g style={stageStyle(3)}>
        {/* Main Monolith */}
        <polygon
          points="60,25 74,48 70,88 50,88 46,48"
          fill={`url(#crystal_main_${uid})`}
          stroke="#BAE6FD"
          strokeWidth="0.75"
        />
        {/* Left main facet */}
        <polygon points="60,25 60,88 46,48" fill={`url(#crystal_facet_l_${uid})`} fillOpacity="0.85" />
        {/* Right main facet */}
        <polygon points="60,25 74,48 60,88" fill={`url(#crystal_facet_r_${uid})`} fillOpacity="0.85" />
        {/* Top diamond facet */}
        <polygon points="60,25 67,42 60,52 53,42" fill="#E0F2FE" fillOpacity="0.6" />

        {/* Animated Light Sweep across facets */}
        <g clipPath={`url(#crystal_clip_${uid})`}>
          <rect
            className={`anim-sweep-${uid}`}
            x="30"
            y="20"
            width="60"
            height="18"
            fill={`url(#light_sweep_${uid})`}
            opacity="0.85"
          />
        </g>
      </g>

      {/* Stage 5+: 2 Floating Orbit Shards */}
      <g style={stageStyle(5)}>
        {/* Shard 1 (floating upper-left) */}
        <g className={`anim-shard-1-${uid}`}>
          <polygon points="26,34 30,39 27,45 23,40" fill="#67E8F9" />
          <polygon points="26,34 30,39 27,45" fill="#E0F2FE" />
        </g>
        {/* Shard 2 (floating upper-right) */}
        <g className={`anim-shard-2-${uid}`}>
          <polygon points="94,40 98,46 95,52 91,46" fill="#A78BFA" />
          <polygon points="94,40 98,46 95,52" fill="#E0F2FE" />
        </g>
      </g>

      {/* Stage 6: 4 Floating Orbit Shards Total */}
      <g style={stageStyle(6)}>
        {/* Shard 3 (floating apex high-right) */}
        <g className={`anim-shard-1-${uid}`}>
          <polygon points="82,22 86,27 83,32 79,27" fill="#67E8F9" />
          <polygon points="82,22 86,27 83,32" fill="#FFFFFF" fillOpacity="0.8" />
        </g>
        {/* Shard 4 (floating apex high-left) */}
        <g className={`anim-shard-2-${uid}`}>
          <polygon points="38,20 42,25 39,30 35,25" fill="#A78BFA" />
          <polygon points="38,20 42,25 39,30" fill="#FFFFFF" fillOpacity="0.8" />
        </g>
      </g>
    </svg>
  );
}
