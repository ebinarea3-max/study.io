'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export interface ProFocusAuraProps {
  progress?: number; // 0.0 to 1.0
  isActive: boolean;
  isPro: boolean;
  children?: React.ReactNode;
  size?: number | string;
  className?: string;
  renderRing?: boolean; // Default false: purely background ambient radial glow to avoid duplicate circles
}

/**
 * ProFocusAura
 * A background-only ambient radial glow that gently pulses when the timer is active.
 * Guarantees zero layout interference and eliminates duplicate inner circles crowding the digits.
 */
export function ProFocusAura({
  progress = 0,
  isActive,
  isPro,
  children,
  className = '',
  renderRing = false,
}: ProFocusAuraProps) {
  const shouldReduceMotion = useReducedMotion();

  // Palette tokens
  const glowColor = isPro
    ? 'rgba(230, 193, 90, 0.24)'
    : 'var(--accent-soft, rgba(52, 211, 153, 0.2))';

  return (
    <div
      aria-hidden={!children}
      className={`absolute inset-0 w-full h-full pointer-events-none select-none flex items-center justify-center ${className}`}
    >
      {/* 1. GPU-Composited Soft Pulsing Radial Aura (Active while studying / timer running) */}
      <motion.div
        aria-hidden="true"
        animate={
          shouldReduceMotion
            ? { opacity: isActive ? 0.35 : 0.08, scale: 1 }
            : {
                opacity: isActive ? [0.2, 0.48, 0.2] : 0.08,
                scale: isActive ? [0.98, 1.04, 0.98] : 0.96,
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
          background: `radial-gradient(circle at 50% 50%, ${glowColor} 0%, transparent 72%)`,
          filter: 'blur(45px)',
        }}
      />

      {/* 2. Optional Secondary Ambient Gold Ring for Pro Members (only when explicitly requested) */}
      {isPro && renderRing && !shouldReduceMotion && (
        <motion.div
          aria-hidden="true"
          animate={
            isActive
              ? { rotate: 360, opacity: [0.12, 0.25, 0.12] }
              : { rotate: 0, opacity: 0.08 }
          }
          transition={{
            rotate: { duration: 28, repeat: Infinity, ease: 'linear' },
            opacity: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
          }}
          className="absolute inset-4 rounded-full pointer-events-none will-change-transform transform-gpu border border-dashed border-[#E6C15A]/20"
        />
      )}

      {/* 3. Center Children (if any passed, rendered with pointer-events-auto) */}
      {children && (
        <div className="relative z-10 pointer-events-auto flex flex-col items-center justify-center text-center">
          {children}
        </div>
      )}
    </div>
  );
}
