'use client';

import React, { useId } from 'react';
import type { EmblemStage } from './emblemStages';
import type { EmblemState } from './emblemRegistry';

interface SparkEmblemProps {
  stage: EmblemStage;
  state: EmblemState;
  canAnimate: boolean;
  reducedMotion?: boolean;
}

export function SparkEmblem({
  stage,
  state,
  canAnimate,
  reducedMotion,
}: SparkEmblemProps) {
  const uid = useId().replace(/:/g, '_');
  const isStudying = state === 'studying';
  const isPaused = state === 'paused';
  const isPlaying = isStudying && canAnimate && !reducedMotion;
  const playState = isPlaying ? 'running' : 'paused';

  // Helper for stage reveal styles with 600ms tween
  const stageStyle = (minStage: EmblemStage): React.CSSProperties => {
    const isVisible = stage >= minStage;
    return {
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'scale(1)' : 'scale(0.8)',
      transition: reducedMotion
        ? 'opacity 600ms ease'
        : 'opacity 600ms ease, transform 600ms ease',
      transformOrigin: '60px 85px',
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
        {/* Warm Backdrop Glow for Stage 6 */}
        <radialGradient
          id={`spark_backdrop_${uid}`}
          cx="60"
          cy="75"
          r="50"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FF7A45" stopOpacity="0.45" />
          <stop offset="60%" stopColor="#E11D48" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#E11D48" stopOpacity="0" />
        </radialGradient>

        {/* Outer Flame Gradient */}
        <linearGradient
          id={`flame_outer_${uid}`}
          x1="60"
          y1="30"
          x2="60"
          y2="90"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FFC56B" />
          <stop offset="45%" stopColor="#FF7A45" />
          <stop offset="100%" stopColor="#E11D48" />
        </linearGradient>

        {/* Inner Core Flame Gradient */}
        <linearGradient
          id={`flame_inner_${uid}`}
          x1="60"
          y1="50"
          x2="60"
          y2="88"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FFFBEB" />
          <stop offset="50%" stopColor="#FED7AA" />
          <stop offset="100%" stopColor="#FFC56B" />
        </linearGradient>

        {/* Hearth Stone Base */}
        <linearGradient
          id={`hearth_stone_${uid}`}
          x1="60"
          y1="85"
          x2="60"
          y2="105"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#3F1D19" />
          <stop offset="100%" stopColor="#1C0A07" />
        </linearGradient>
      </defs>

      <style>{`
        @keyframes flame-sway-${uid} {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(2deg); }
          75% { transform: rotate(-2deg); }
        }
        @keyframes flame-flicker-${uid} {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(1.06); }
          80% { transform: scaleY(0.94); }
        }
        @keyframes spark-rise-1-${uid} {
          0% { transform: translate(0, 0); opacity: 0; }
          30% { opacity: 0.95; }
          80% { opacity: 0.5; }
          100% { transform: translate(-8px, -42px); opacity: 0; }
        }
        @keyframes spark-rise-2-${uid} {
          0% { transform: translate(0, 0); opacity: 0; }
          30% { opacity: 0.9; }
          80% { opacity: 0.45; }
          100% { transform: translate(10px, -48px); opacity: 0; }
        }
        @keyframes spark-rise-3-${uid} {
          0% { transform: translate(0, 0); opacity: 0; }
          30% { opacity: 1; }
          80% { opacity: 0.4; }
          100% { transform: translate(-3px, -36px); opacity: 0; }
        }
        .anim-flame-sway-${uid} {
          animation: flame-sway-${uid} 2.4s ease-in-out infinite;
          animation-play-state: ${playState};
          transform-origin: 60px 88px;
        }
        .anim-flame-flicker-${uid} {
          animation: flame-flicker-${uid} 0.9s ease-in-out infinite;
          animation-play-state: ${playState};
          transform-origin: 60px 88px;
        }
        .anim-spark-1-${uid} {
          animation: spark-rise-1-${uid} 2.2s ease-out infinite;
          animation-play-state: ${playState};
        }
        .anim-spark-2-${uid} {
          animation: spark-rise-2-${uid} 2.6s ease-out infinite 0.7s;
          animation-play-state: ${playState};
        }
        .anim-spark-3-${uid} {
          animation: spark-rise-3-${uid} 1.9s ease-out infinite 1.3s;
          animation-play-state: ${playState};
        }
      `}</style>

      {/* Stage 6: Warm Backdrop Glow */}
      <circle
        cx="60"
        cy="70"
        r="44"
        fill={`url(#spark_backdrop_${uid})`}
        style={stageStyle(6)}
      />

      {/* Stone Earth Base (Hearth) */}
      <ellipse cx="60" cy="94" rx="36" ry="8" fill={`url(#hearth_stone_${uid})`} />
      <ellipse cx="60" cy="92" rx="28" ry="5.5" fill="#58241C" fillOpacity="0.4" />

      {/* Stage 4+: Crossed Logs Base */}
      <g style={stageStyle(4)}>
        {/* Left crossed log */}
        <path
          d="M32 94 L84 84 L88 88 L36 98 Z"
          fill="#4A1E17"
          stroke="#2E100A"
          strokeWidth="1"
        />
        {/* Right crossed log */}
        <path
          d="M88 94 L36 84 L32 88 L84 98 Z"
          fill="#5E261D"
          stroke="#2E100A"
          strokeWidth="1"
        />
        {/* Glowing wood embers on logs */}
        <circle cx="56" cy="88" r="2" fill="#FF7A45" />
        <circle cx="64" cy="87" r="1.5" fill="#FFC56B" />
      </g>

      {/* Flame Container: applies sway & scaleY flicker */}
      <g className={`anim-flame-sway-${uid}`}>
        <g className={`anim-flame-flicker-${uid}`}>
          {/* Stage 0: Glowing Ember Mound */}
          <g style={stageStyle(0)}>
            <ellipse cx="60" cy="88" rx="7" ry="4" fill="#E11D48" />
            <circle cx="60" cy="87" r="3" fill="#FF7A45" />
            <circle cx="60" cy="86" r="1.5" fill="#FFC56B" />
          </g>

          {/* Stage 1: Small Flicker Flame */}
          <g style={stageStyle(1)}>
            <path
              d="M60 76 C55 82 54 87 60 88 C66 87 65 82 60 76 Z"
              fill={`url(#flame_outer_${uid})`}
            />
            <path
              d="M60 80 C58 83 58 86 60 87 C62 86 62 83 60 80 Z"
              fill={`url(#flame_inner_${uid})`}
            />
          </g>

          {/* Stage 2: Candle Flame */}
          <g style={stageStyle(2)}>
            <path
              d="M60 66 C53 74 52 86 60 88 C68 86 67 74 60 66 Z"
              fill={`url(#flame_outer_${uid})`}
            />
            <path
              d="M60 73 C56 78 56 85 60 87 C64 85 64 78 60 73 Z"
              fill={`url(#flame_inner_${uid})`}
            />
          </g>

          {/* Stage 3: Full Standing Flame */}
          <g style={stageStyle(3)}>
            <path
              d="M60 52 C50 63 46 76 52 86 C55 88 65 88 68 86 C74 76 70 63 60 52 Z"
              fill={`url(#flame_outer_${uid})`}
            />
            <path
              d="M60 62 C54 70 52 80 56 86 C58 87 62 87 64 86 C68 80 66 70 60 62 Z"
              fill={`url(#flame_inner_${uid})`}
            />
          </g>

          {/* Stage 5: Roaring Bonfire with Side Flames */}
          <g style={stageStyle(5)}>
            {/* Left satellite tongue */}
            <path
              d="M48 64 C42 72 44 82 50 86 C53 84 54 78 48 64 Z"
              fill="#E11D48"
            />
            {/* Right satellite tongue */}
            <path
              d="M72 64 C78 72 76 82 70 86 C67 84 66 78 72 64 Z"
              fill="#FF7A45"
            />
            {/* Main taller bonfire peak */}
            <path
              d="M60 40 C46 54 44 74 50 86 C55 89 65 89 70 86 C76 74 74 54 60 40 Z"
              fill={`url(#flame_outer_${uid})`}
            />
            <path
              d="M60 52 C52 64 52 78 56 86 C58 88 62 88 64 86 C68 78 68 64 60 52 Z"
              fill={`url(#flame_inner_${uid})`}
            />
          </g>

          {/* Stage 6: Blazing Towering Zenith Bonfire */}
          <g style={stageStyle(6)}>
            {/* Wild sweeping tongues */}
            <path
              d="M42 56 C36 68 39 82 48 87 C50 82 48 72 42 56 Z"
              fill="#E11D48"
              fillOpacity="0.85"
            />
            <path
              d="M78 56 C84 68 81 82 72 87 C70 82 72 72 78 56 Z"
              fill="#FF7A45"
              fillOpacity="0.85"
            />
            {/* Zenith Apex Flame */}
            <path
              d="M60 28 C42 46 40 70 48 87 C54 90 66 90 72 87 C80 70 78 46 60 28 Z"
              fill={`url(#flame_outer_${uid})`}
            />
            <path
              d="M60 42 C48 58 48 76 54 86 C57 88 63 88 66 86 C72 76 72 58 60 42 Z"
              fill={`url(#flame_inner_${uid})`}
            />
            <ellipse cx="60" cy="80" rx="4" ry="7" fill="#FFFFFF" />
          </g>
        </g>
      </g>

      {/* Floating Sparks Layer */}
      {/* Stage 0-2: Single Ember Spark */}
      <circle
        className={`anim-spark-1-${uid}`}
        cx="60"
        cy="80"
        r="1.2"
        fill="#FFC56B"
        style={stageStyle(0)}
      />

      {/* Stage 3-4: 3 Rising Sparks */}
      <g style={stageStyle(3)}>
        <circle className={`anim-spark-1-${uid}`} cx="56" cy="74" r="1.5" fill="#FFC56B" />
        <circle className={`anim-spark-2-${uid}`} cx="65" cy="76" r="1.8" fill="#FF7A45" />
        <circle className={`anim-spark-3-${uid}`} cx="60" cy="70" r="1.2" fill="#FED7AA" />
      </g>

      {/* Stage 5+: Many Rising Bonfire Embers */}
      <g style={stageStyle(5)}>
        <circle className={`anim-spark-1-${uid}`} cx="50" cy="68" r="1.8" fill="#FFC56B" />
        <circle className={`anim-spark-2-${uid}`} cx="70" cy="70" r="2.2" fill="#FF7A45" />
        <circle className={`anim-spark-3-${uid}`} cx="58" cy="62" r="1.5" fill="#FFFBEB" />
        <circle className={`anim-spark-1-${uid}`} cx="63" cy="55" r="1.6" fill="#FF7A45" />
      </g>
    </svg>
  );
}
