'use client';

import React from 'react';

interface BezelTick {
  index: number;
  isMajor: boolean;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

// Pre-computed 60 ticks geometry for 300x300 viewBox
const BEZEL_TICKS: BezelTick[] = Array.from({ length: 60 }, (_, i) => {
  const angle = (i * 6 - 90) * (Math.PI / 180);
  const isMajor = i % 5 === 0;
  const rOuter = 144;
  const rInner = isMajor ? 134 : 139;
  return {
    index: i,
    isMajor,
    x1: 150 + rOuter * Math.cos(angle),
    y1: 150 + rOuter * Math.sin(angle),
    x2: 150 + rInner * Math.cos(angle),
    y2: 150 + rInner * Math.sin(angle),
  };
});

// Memoized Bezel tick marks - Static geometry, only colors update with litCount
const Bezel = React.memo(function Bezel({ litCount }: { litCount: number }) {
  return (
    <g className="pointer-events-none select-none">
      {BEZEL_TICKS.map((tick) => {
        const isLit = tick.index < litCount;
        return (
          <line
            key={tick.index}
            x1={tick.x1}
            y1={tick.y1}
            x2={tick.x2}
            y2={tick.y2}
            stroke={isLit ? 'var(--accent)' : tick.isMajor ? 'rgb(var(--fg) / 0.45)' : 'rgb(var(--fg) / 0.28)'}
            strokeWidth={tick.isMajor ? 1.75 : 1}
            strokeLinecap="round"
            className="transition-colors duration-200"
          />
        );
      })}
    </g>
  );
});
Bezel.displayName = 'Bezel';

// Memoized soft ambient radial glow behind the dial (accent at about 8-10% opacity, very large, blurred)
export const AmbientGlow = React.memo(function AmbientGlow({ isRunning }: { isRunning: boolean }) {
  return (
    <div
      className={`absolute inset-0 -z-10 pointer-events-none transition-opacity duration-300 ${
        isRunning ? 'opacity-100' : 'opacity-70'
      }`}
      style={{
        display: 'var(--dial-glow-display, block)',
        background:
          'radial-gradient(circle at 50% 50%, var(--accent-soft) 0%, rgb(var(--fg) / 0.02) 45%, transparent 70%)',
        filter: 'blur(50px)',
      }}
    />
  );
});
AmbientGlow.displayName = 'AmbientGlow';

interface TimerDialProps {
  displayTime: string;
  ringPercent: number;
  litCount: number;
  statusText: string;
  subjectName?: string;
  isRunning: boolean;
  isPaused: boolean;
  isStudying: boolean;
  shouldReduceMotion?: boolean;
  timerMode: 'stopwatch' | 'countdown' | 'pomodoro';
  onStartCountdownEdit?: () => void;
}

const RADIUS = 124;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export const TimerDial = React.memo(function TimerDial({
  displayTime,
  ringPercent,
  litCount,
  statusText,
  subjectName,
  isRunning,
  isPaused,
  isStudying,
  shouldReduceMotion = false,
  timerMode,
  onStartCountdownEdit,
}: TimerDialProps) {
  const safePercent = Math.max(0, Math.min(100, ringPercent || 0));
  const strokeDashoffset = CIRCUMFERENCE - (safePercent / 100) * CIRCUMFERENCE;

  return (
    <div className="relative flex items-center justify-center w-[min(420px,80vw)] h-[min(420px,80vw)] aspect-square mx-auto select-none my-2 sm:my-4">
      <style>{`
        @keyframes timerDotPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
        .timer-status-pulse {
          animation: timerDotPulse 2s ease-in-out infinite;
        }
      `}</style>

      {/* Soft Ambient Radial Glow */}
      <AmbientGlow isRunning={isRunning} />

      {/* SVG Bezel and Progress Arc */}
      <svg
        viewBox="0 0 300 300"
        className="absolute inset-0 w-full h-full pointer-events-none select-none"
      >
        {/* 60-tick watch bezel */}
        <Bezel litCount={litCount} />

        {/* 2px Faint Background Track (fg at 14%) */}
        <circle
          cx="150"
          cy="150"
          r={RADIUS}
          fill="none"
          stroke="rgb(var(--fg) / 0.14)"
          strokeWidth="2"
        />

        {/* 3px Accent Arc with 1s linear transition */}
        <circle
          cx="150"
          cy="150"
          r={RADIUS}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 150 150)"
          style={{
            transition: shouldReduceMotion ? 'none' : 'stroke-dashoffset 1s linear',
            filter: 'drop-shadow(0 0 4px var(--accent-glow))',
          }}
        />
      </svg>

      {/* Centre Stack */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 max-w-[75%]">
        {/* Small subject name above (text-dim at 13px) */}
        <span
          className="text-[13px] font-mono text-[var(--text-dim)] truncate max-w-[200px] mb-1 min-h-[16px] tracking-tight"
          title={subjectName || ''}
        >
          {subjectName || ''}
        </span>

        {/* Digits in display font with tabular numerals at about 22% of dial width */}
        <div className="font-mono tabular-nums font-bold text-[var(--text)] text-5xl sm:text-6xl tracking-tight leading-none text-center select-none py-1">
          {timerMode === 'countdown' && !isStudying ? (
            <button
              type="button"
              onClick={onStartCountdownEdit}
              className="cursor-pointer hover:text-[var(--accent)] transition-colors pointer-events-auto font-mono tabular-nums inline-block text-center"
              title="Click to edit duration"
            >
              {displayTime}
            </button>
          ) : (
            <span className="font-mono tabular-nums inline-block text-center">{displayTime}</span>
          )}
        </div>

        {/* Status Line in sentence case with small dot */}
        <div className="flex items-center justify-center gap-1.5 mt-2">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isRunning && !shouldReduceMotion
                ? 'timer-status-pulse bg-emerald-400'
                : isPaused
                ? 'bg-amber-400'
                : 'bg-zinc-500'
            }`}
          />
          <span className="text-xs font-mono text-[var(--text-dim)] font-medium">
            {statusText}
          </span>
        </div>
      </div>
    </div>
  );
});
TimerDial.displayName = 'TimerDial';
