'use client';

import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export interface ProFocusAuraProps {
  progress: number; // 0.0 to 1.0
  isActive: boolean;
  isPro: boolean;
  children?: React.ReactNode;
  size?: number; // default 320
  strokeWidth?: number; // default 4
  className?: string;
}

export function ProFocusAura({
  progress,
  isActive,
  isPro,
  children,
  size = 320,
  strokeWidth = 4,
  className = '',
}: ProFocusAuraProps) {
  const shouldReduceMotion = useReducedMotion();

  // Clamp progress strictly between 0 and 1
  const safeProgress = Math.max(0, Math.min(1, isNaN(progress) ? 0 : progress));

  // Geometry
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - safeProgress);

  // Palette tokens
  const strokeColor = isPro ? '#E6C15A' : 'var(--accent, #34D399)';
  const glowColor = isPro
    ? 'rgba(230, 193, 90, 0.28)'
    : 'rgba(52, 211, 153, 0.25)';

  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      {/* 1. GPU-Composited Soft Pulsing Radial Aura (active when studying/running) */}
      <motion.div
        aria-hidden="true"
        animate={
          shouldReduceMotion
            ? { opacity: isActive ? 0.35 : 0.12, scale: 1 }
            : {
                opacity: isActive ? [0.25, 0.55, 0.25] : 0.12,
                scale: isActive ? [1, 1.06, 1] : 1,
              }
        }
        transition={
          shouldReduceMotion
            ? { duration: 0.3 }
            : {
                duration: 3.5,
                repeat: isActive ? Infinity : 0,
                ease: 'easeInOut',
              }
        }
        className="absolute inset-0 rounded-full pointer-events-none will-change-transform transform-gpu"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${glowColor} 0%, transparent 70%)`,
          filter: 'blur(36px)',
        }}
      />

      {/* 2. Secondary Ambient Ring Layer for Pro Members */}
      {isPro && !shouldReduceMotion && (
        <motion.div
          aria-hidden="true"
          animate={
            isActive
              ? { rotate: 360, opacity: [0.15, 0.3, 0.15] }
              : { rotate: 0, opacity: 0.1 }
          }
          transition={{
            rotate: { duration: 24, repeat: Infinity, ease: 'linear' },
            opacity: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
          }}
          className="absolute inset-2 rounded-full pointer-events-none will-change-transform transform-gpu border border-dashed border-[#E6C15A]/25"
        />
      )}

      {/* 3. SVG Precision Circular Progress Ring */}
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0 w-full h-full pointer-events-none -rotate-90"
      >
        {/* Background Track Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={strokeWidth}
        />

        {/* Animated Progress Arc (Interpolating strokeDashoffset with Spring Physics) */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : {
                  type: 'spring',
                  stiffness: 90,
                  damping: 18,
                  mass: 0.5,
                }
          }
          style={{
            filter: `drop-shadow(0 0 6px ${isPro ? 'rgba(230,193,90,0.5)' : 'rgba(52,211,153,0.45)'})`,
          }}
        />
      </svg>

      {/* 4. Center Slotted Content (e.g. Timer Digits & Controls) */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  );
}

