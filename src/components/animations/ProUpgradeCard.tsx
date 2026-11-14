'use client';

import React, { useRef, useState, useCallback } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion';
import { Crown, Sparkles } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════
   1. PRO UPGRADE CARD
   GPU-composited rotating gradient border, 3D tilt (capped ±6deg), shimmer pass
   ═══════════════════════════════════════════════════════════════════════════ */
export interface ProUpgradeCardProps {
  children: React.ReactNode;
  className?: string;
  isPro?: boolean;
  onClick?: () => void;
  accentGradient?: string;
}

export function ProUpgradeCard({
  children,
  className = '',
  isPro = false,
  onClick,
  accentGradient,
}: ProUpgradeCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [isHovered, setIsHovered] = useState(false);

  // Motion values for tilt (-0.5 to +0.5 normalized coordinates)
  const normX = useMotionValue(0);
  const normY = useMotionValue(0);

  // Spring physics for butter-smooth 60fps tilt
  const springConfig = { stiffness: 260, damping: 25, mass: 0.5 };
  const smoothX = useSpring(normX, springConfig);
  const smoothY = useSpring(normY, springConfig);

  // Tilt transform strictly capped at ±6 degrees
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [6, -6]);
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-6, 6]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (shouldReduceMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    normX.set(Math.max(-0.5, Math.min(0.5, x)));
    normY.set(Math.max(-0.5, Math.min(0.5, y)));
  }, [shouldReduceMotion, normX, normY]);

  const handlePointerEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handlePointerLeave = useCallback(() => {
    setIsHovered(false);
    normX.set(0);
    normY.set(0);
  }, [normX, normY]);

  return (
    <motion.div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onClick={onClick}
      style={{
        perspective: 1000,
        transformStyle: 'preserve-3d',
        rotateX: shouldReduceMotion ? 0 : rotateX,
        rotateY: shouldReduceMotion ? 0 : rotateY,
      }}
      whileHover={shouldReduceMotion ? undefined : { scale: 1.015 }}
      whileTap={shouldReduceMotion ? undefined : { scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      className={`relative rounded-3xl p-[1.5px] overflow-hidden will-change-transform transform-gpu select-none transition-shadow ${className}`}
    >
      {/* Layer 1: GPU-composited Rotating Gradient Border Highlight */}
      <motion.div
        aria-hidden="true"
        animate={shouldReduceMotion ? undefined : { rotate: 360 }}
        transition={
          shouldReduceMotion
            ? undefined
            : {
                repeat: Infinity,
                duration: isHovered ? 4 : 8,
                ease: 'linear',
              }
        }
        className="absolute -inset-[150%] pointer-events-none will-change-transform transform-gpu"
        style={{
          background:
            accentGradient ||
            'conic-gradient(from 0deg, transparent 0deg, rgba(230,193,90,0.1) 60deg, #F5E6A8 120deg, #E6C15A 180deg, #B8892B 240deg, transparent 320deg, transparent 360deg)',
          opacity: isPro ? 0.7 : 0.9,
        }}
      />

      {/* Layer 2: Card Inner Content Shell */}
      <div className="relative w-full h-full rounded-[23px] bg-[#0A0C11]/95 backdrop-blur-xl overflow-hidden border border-white/[0.08] shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
        {/* Layer 3: Ambient Shimmer Pass (translates horizontally across card) */}
        {!shouldReduceMotion && (
          <motion.div
            aria-hidden="true"
            initial={{ transform: 'translateX(-120%)' }}
            animate={{
              transform: isHovered
                ? ['translateX(-120%)', 'translateX(220%)']
                : ['translateX(-120%)', 'translateX(-120%)'],
            }}
            transition={{
              duration: 1.4,
              ease: [0.16, 1, 0.3, 1],
              repeat: isHovered ? Infinity : 0,
              repeatDelay: 2,
            }}
            className="absolute inset-y-0 w-1/2 pointer-events-none -skew-x-12 will-change-transform transform-gpu z-20"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%)',
            }}
          />
        )}

        {/* Ambient Top Glow */}
        <div
          aria-hidden="true"
          className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-32 rounded-full pointer-events-none blur-3xl z-0"
          style={{
            background: isPro
              ? 'rgba(230, 193, 90, 0.16)'
              : 'rgba(52, 211, 153, 0.14)',
          }}
        />

        {/* Content Children */}
        <div className="relative z-10 w-full h-full">{children}</div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   2. PRO BADGE PILL
   Compact badge for displaying active Pro status in Header, Navbar & Profile
   ═══════════════════════════════════════════════════════════════════════════ */
export interface ProBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showCrown?: boolean;
  label?: string;
  onClick?: () => void;
}

export function ProBadge({
  size = 'md',
  className = '',
  showCrown = true,
  label = 'PRO',
  onClick,
}: ProBadgeProps) {
  const shouldReduceMotion = useReducedMotion();

  const sizeStyles = {
    sm: 'text-[9px] px-2 py-0.5 gap-1',
    md: 'text-[10px] px-2.5 py-1 gap-1.5',
    lg: 'text-xs px-3.5 py-1.5 gap-2',
  }[size];

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }[size];

  return (
    <motion.div
      onClick={onClick}
      whileHover={shouldReduceMotion ? undefined : { scale: 1.05 }}
      whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className={`inline-flex items-center font-hud font-bold tracking-widest uppercase rounded-full select-none cursor-default border shadow-sm relative overflow-hidden will-change-transform transform-gpu ${sizeStyles} ${className}`}
      style={{
        background: 'linear-gradient(135deg, rgba(245,230,168,0.18) 0%, rgba(230,193,90,0.12) 100%)',
        borderColor: 'rgba(230, 193, 90, 0.35)',
        color: '#E6C15A',
        boxShadow: '0 0 12px rgba(230, 193, 90, 0.12)',
      }}
      title="Pro Scholar Active"
    >
      {/* Subtle background shimmer */}
      {!shouldReduceMotion && (
        <motion.div
          aria-hidden="true"
          animate={{
            transform: ['translateX(-100%)', 'translateX(200%)'],
          }}
          transition={{
            duration: 2.8,
            repeat: Infinity,
            repeatDelay: 3,
            ease: 'easeInOut',
          }}
          className="absolute inset-y-0 w-1/2 -skew-x-12 pointer-events-none will-change-transform transform-gpu"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)',
          }}
        />
      )}

      {showCrown && (
        <Crown
          className={`${iconSizes} text-[#E6C15A] fill-[#E6C15A] shrink-0 drop-shadow-sm`}
        />
      )}
      <span className="leading-none pt-0.5">{label}</span>
    </motion.div>
  );
}

