'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Flame } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════
   1. STREAK FLAME
   Animated streak flame/counter badge with spring scale-up & glow pulse
   ═══════════════════════════════════════════════════════════════════════════ */
export interface StreakFlameProps {
  count: number;
  boosted?: boolean;
  className?: string;
  onClick?: () => void;
}

export function StreakFlame({
  count,
  boosted = false,
  className = '',
  onClick,
}: StreakFlameProps) {
  const shouldReduceMotion = useReducedMotion();
  const [prevCount, setPrevCount] = useState(count);
  const [isIncremented, setIsIncremented] = useState(false);

  useEffect(() => {
    if (count > prevCount) {
      setIsIncremented(true);
      const timer = setTimeout(() => setIsIncremented(false), 900);
      setPrevCount(count);
      return () => clearTimeout(timer);
    }
    setPrevCount(count);
  }, [count, prevCount]);

  return (
    <motion.div
      onClick={onClick}
      whileHover={shouldReduceMotion ? undefined : { scale: 1.05 }}
      whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
      animate={
        isIncremented && !shouldReduceMotion
          ? {
              scale: [1, 1.25, 0.95, 1.05, 1],
            }
          : { scale: 1 }
      }
      transition={{ type: 'spring', stiffness: 450, damping: 18 }}
      className={`relative inline-flex items-center h-8 sm:h-9 px-2.5 sm:px-3 rounded-xl border select-none cursor-default shadow-card gap-1.5 shrink-0 overflow-hidden will-change-transform transform-gpu ${className}`}
      style={{
        background: boosted
          ? 'linear-gradient(135deg, rgba(245,158,11,0.18) 0%, rgba(217,119,6,0.1) 100%)'
          : 'var(--surface)',
        borderColor: boosted
          ? 'rgba(245, 158, 11, 0.45)'
          : 'var(--border)',
        boxShadow: boosted
          ? '0 0 14px rgba(245, 158, 11, 0.22)'
          : undefined,
      }}
      title={`${count} Day Streak${boosted ? ' (Pro Boost Active)' : ''}`}
    >
      {/* Background Glow Flash when incremented or boosted */}
      <motion.div
        aria-hidden="true"
        animate={
          isIncremented && !shouldReduceMotion
            ? { opacity: [0, 0.65, 0] }
            : { opacity: boosted ? [0.2, 0.4, 0.2] : 0 }
        }
        transition={
          isIncremented
            ? { duration: 0.8, ease: 'easeOut' }
            : { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }
        }
        className="absolute inset-0 pointer-events-none rounded-xl"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(249,115,22,0.4) 0%, transparent 80%)',
        }}
      />

      {/* Flame Icon with Animated Bounce */}
      <motion.div
        animate={
          !shouldReduceMotion && count > 0
            ? {
                scale: [1, 1.1, 1],
                rotate: [0, -4, 4, 0],
              }
            : undefined
        }
        transition={{
          duration: 2.2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="will-change-transform transform-gpu shrink-0"
      >
        <Flame
          className={`w-4 h-4 shrink-0 drop-shadow-sm ${
            boosted ? 'text-amber-400' : 'text-orange-500'
          }`}
          fill="currentColor"
          strokeWidth={2}
        />
      </motion.div>

      {/* Numerical Streak Count */}
      <AnimatePresence mode="popLayout">
        <motion.span
          key={count}
          initial={shouldReduceMotion ? false : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={shouldReduceMotion ? undefined : { opacity: 0, y: 8 }}
          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          className={`text-xs font-bold font-mono tracking-tight min-w-[1ch] text-center inline-block ${
            boosted ? 'text-amber-300 font-extrabold' : 'text-[var(--text)]'
          }`}
        >
          {count}
        </motion.span>
      </AnimatePresence>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   2. COMPLETION BURST
   16 lightweight GPU-accelerated confetti particles radiating outward
   ═══════════════════════════════════════════════════════════════════════════ */
export interface CompletionBurstProps {
  trigger: boolean;
  onComplete?: () => void;
  className?: string;
  particleCount?: number;
}

interface ParticleData {
  id: number;
  angle: number;
  distance: number;
  size: number;
  color: string;
  rotation: number;
  shape: 'circle' | 'square' | 'pill';
}

const BURST_COLORS = [
  '#10B981', // Emerald
  '#34D399', // Mint
  '#F59E0B', // Amber
  '#E6C15A', // Pro Gold
  '#06B6D4', // Cyan
  '#8B5CF6', // Purple
  '#F43F5E', // Rose
];

export function CompletionBurst({
  trigger,
  onComplete,
  className = '',
  particleCount = 16,
}: CompletionBurstProps) {
  const shouldReduceMotion = useReducedMotion();
  const [bursting, setBursting] = useState(false);

  // Pre-compute deterministic particle paths
  const particles: ParticleData[] = useMemo(() => {
    return Array.from({ length: particleCount }, (_, i) => {
      const angle = (i * (360 / particleCount) + (i % 3) * 10) * (Math.PI / 180);
      const distance = 42 + (i % 4) * 16; // 42px to 90px
      const size = 5 + (i % 3) * 2; // 5px to 9px
      const color = BURST_COLORS[i % BURST_COLORS.length];
      const rotation = ((i * 47) % 360) - 180;
      const shapes: ('circle' | 'square' | 'pill')[] = ['circle', 'square', 'pill'];
      const shape = shapes[i % 3];

      return { id: i, angle, distance, size, color, rotation, shape };
    });
  }, [particleCount]);

  useEffect(() => {
    if (trigger) {
      setBursting(true);
      const timer = setTimeout(() => {
        setBursting(false);
        if (onComplete) onComplete();
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [trigger, onComplete]);

  if (!bursting || shouldReduceMotion) return null;

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 flex items-center justify-center z-50 overflow-visible ${className}`}
    >
      {particles.map((p) => {
        const destX = Math.cos(p.angle) * p.distance;
        const destY = Math.sin(p.angle) * p.distance;

        return (
          <motion.div
            key={p.id}
            initial={{
              transform: 'translate3d(0px, 0px, 0px) scale(0) rotate(0deg)',
              opacity: 1,
            }}
            animate={{
              transform: `translate3d(${destX}px, ${destY}px, 0px) scale(1) rotate(${p.rotation}deg)`,
              opacity: [1, 1, 0],
            }}
            transition={{
              duration: 0.75,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="absolute will-change-transform transform-gpu"
            style={{
              width: p.shape === 'pill' ? p.size * 1.6 : p.size,
              height: p.size,
              backgroundColor: p.color,
              borderRadius: p.shape === 'circle' ? '9999px' : p.shape === 'pill' ? '9999px' : '2px',
              boxShadow: `0 0 6px ${p.color}80`,
            }}
          />
        );
      })}
    </div>
  );
}

