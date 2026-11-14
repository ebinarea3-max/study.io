'use client';

import React, { useId } from 'react';
import { motion } from 'framer-motion';
import { RoomFlairId, ROOM_FLAIRS } from '../../lib/roomFlairs';

interface RoomAvatarFlairProps {
  flair?: RoomFlairId | null;
  isStudying: boolean;
  isOnline?: boolean;
  size?: number;
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  showCustomBadge?: boolean;
}

export const RoomAvatarFlair = React.memo(function RoomAvatarFlair({
  flair = 'default',
  isStudying,
  isOnline = true,
  size = 64,
  children,
  className = '',
  onClick,
  showCustomBadge = false,
}: RoomAvatarFlairProps) {
  const uniqueId = useId().replace(/:/g, '_');
  const activeFlairId: RoomFlairId = (flair && ROOM_FLAIRS[flair]) ? flair : 'default';
  const config = ROOM_FLAIRS[activeFlairId];

  // Ring radius in 100x100 SVG space (avatar takes up ~68px diameter, ring sits just outside at R=37.5)
  const ringRadius = 37.5;

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Layer 1: Ambient Background Radial Glow */}
      <motion.div
        animate={{
          opacity: isStudying ? [0.75, 0.95, 0.75] : isOnline ? [0.4, 0.65, 0.4] : 0,
          scale: isStudying ? [0.98, 1.04, 0.98] : 1,
        }}
        transition={{
          duration: isStudying ? 2.5 : 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute inset-[-8px] rounded-full pointer-events-none -z-10 will-change-transform transform-gpu"
        style={{
          background: isStudying
            ? `radial-gradient(circle, ${config.glowColor} 0%, transparent 72%)`
            : isOnline
            ? 'radial-gradient(circle, rgba(245, 158, 11, 0.18) 0%, transparent 68%)'
            : 'transparent',
          filter: 'blur(8px)',
        }}
      />

      {/* Layer 2: 60fps GPU Animated Framer Motion SVG Rings */}
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-[-14px] w-[calc(100%+28px)] h-[calc(100%+28px)] pointer-events-none select-none overflow-visible z-0 will-change-transform transform-gpu"
        style={{
          filter: isStudying ? `drop-shadow(0 0 5px ${config.themeColor}90)` : undefined,
        }}
      >
        <defs>
          {/* Gradients */}
          <linearGradient id={`defaultGrad_${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="50%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>

          <linearGradient id={`solarGrad_${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="45%" stopColor="#F97316" />
            <stop offset="100%" stopColor="#EF4444" />
          </linearGradient>

          <linearGradient id={`solarInner_${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="50%" stopColor="#F97316" />
            <stop offset="100%" stopColor="#FDE047" />
          </linearGradient>

          <linearGradient id={`cyberCyan_${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>

          <linearGradient id={`cyberViolet_${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#D946EF" />
          </linearGradient>

          <linearGradient id={`voidGrad_${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A855F7" />
            <stop offset="50%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#3B0764" />
          </linearGradient>

          <linearGradient id={`voidInner_${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#818CF8" />
          </linearGradient>

          <linearGradient id={`zenGrad_${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="50%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#0D9488" />
          </linearGradient>

          <linearGradient id={`zenInner_${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#14B8A6" />
            <stop offset="100%" stopColor="#2DD4BF" />
          </linearGradient>
        </defs>

        {/* STATE A: NOT STUDYING / PAUSED (Calm Low-Power Amber Dashed Ring with Gentle Breathing) */}
        {!isStudying ? (
          <motion.g
            animate={
              isOnline
                ? {
                    rotate: [0, 360],
                    opacity: [0.55, 0.85, 0.55],
                  }
                : { opacity: 0.35 }
            }
            transition={
              isOnline
                ? {
                    rotate: { duration: 32, repeat: Infinity, ease: 'linear' },
                    opacity: { duration: 4.5, repeat: Infinity, ease: 'easeInOut' },
                  }
                : undefined
            }
            style={{ transformOrigin: '50px 50px' }}
          >
            {/* Subtle amber dashed ring gently breathing / rotating */}
            <circle
              cx="50"
              cy="50"
              r={ringRadius}
              fill="none"
              stroke="#F59E0B"
              strokeWidth="1.75"
              strokeDasharray="4.5 4.5"
              strokeLinecap="round"
              opacity="0.85"
            />
          </motion.g>
        ) : (
          /* STATE B: ACTIVELY STUDYING (Equipped Flair 60fps Framer Motion Animations) */
          <>
            {/* 1. DEFAULT FOCUS FLAIR - DUAL PULSE MATRIX */}
            {activeFlairId === 'default' && (
              <g>
                {/* Outer Neon Cyan Tech Ring (Rotating Counter-Clockwise) with 2 Nodes */}
                <motion.g
                  animate={{ rotate: [360, 0] }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                  style={{ transformOrigin: '50px 50px' }}
                >
                  <circle
                    cx="50"
                    cy="50"
                    r={ringRadius + 2.5}
                    fill="none"
                    stroke={`url(#cyberCyan_${uniqueId})`}
                    strokeWidth="1.6"
                    strokeDasharray="18 6 4 6"
                  />
                  {/* Outer Tech Nodes at 90° and 270° */}
                  <circle cx={50 + (ringRadius + 2.5)} cy="50" r="2.4" fill="#06B6D4" />
                  <circle cx={50 + (ringRadius + 2.5)} cy="50" r="1.2" fill="#FFFFFF" />
                  <circle cx={50 - (ringRadius + 2.5)} cy="50" r="2.4" fill="#06B6D4" />
                  <circle cx={50 - (ringRadius + 2.5)} cy="50" r="1.2" fill="#FFFFFF" />
                </motion.g>

                {/* Inner Emerald Pulse Ring (Rotating Clockwise) with 2 Nodes */}
                <motion.g
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                  style={{ transformOrigin: '50px 50px' }}
                >
                  <circle
                    cx="50"
                    cy="50"
                    r={ringRadius - 1.5}
                    fill="none"
                    stroke={`url(#defaultGrad_${uniqueId})`}
                    strokeWidth="1.6"
                    strokeDasharray="12 4 4 4"
                  />
                  {/* Inner Focus Nodes at 0° and 180° */}
                  <circle cx="50" cy={50 - (ringRadius - 1.5)} r="2.2" fill="#10B981" />
                  <circle cx="50" cy={50 - (ringRadius - 1.5)} r="1.1" fill="#FFFFFF" />
                  <circle cx="50" cy={50 + (ringRadius - 1.5)} r="2.2" fill="#10B981" />
                  <circle cx="50" cy={50 + (ringRadius - 1.5)} r="1.1" fill="#FFFFFF" />
                </motion.g>

                {/* 4 Diagonal Focus Reticle Ticks */}
                <line x1="21" y1="21" x2="18" y2="18" stroke="#10B981" strokeWidth="1.5" opacity="0.85" />
                <line x1="79" y1="21" x2="82" y2="18" stroke="#10B981" strokeWidth="1.5" opacity="0.85" />
                <line x1="21" y1="79" x2="18" y2="82" stroke="#06B6D4" strokeWidth="1.5" opacity="0.85" />
                <line x1="79" y1="79" x2="82" y2="82" stroke="#06B6D4" strokeWidth="1.5" opacity="0.85" />
              </g>
            )}

            {/* 2. SOLAR FLARE (Pro Exclusive) - CORONAL SUN ENGINE */}
            {activeFlairId === 'solar-flare' && (
              <g>
                {/* Outer Plasma Coronal Ring (Rotating Clockwise) with 3 Prominence Nodes */}
                <motion.g
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
                  style={{ transformOrigin: '50px 50px' }}
                >
                  <circle
                    cx="50"
                    cy="50"
                    r={ringRadius + 2.6}
                    fill="none"
                    stroke={`url(#solarGrad_${uniqueId})`}
                    strokeWidth="1.75"
                    strokeDasharray="20 6 4 6"
                  />
                  {/* 3 Prominence Flares at 0°, 120°, 240° */}
                  <circle cx="50" cy={50 - (ringRadius + 2.6)} r="2.6" fill="#F59E0B" />
                  <circle cx="50" cy={50 - (ringRadius + 2.6)} r="1.3" fill="#FFFBEB" />
                  <circle cx={50 + (ringRadius + 2.6) * 0.866} cy={50 + (ringRadius + 2.6) * 0.5} r="2.6" fill="#F97316" />
                  <circle cx={50 + (ringRadius + 2.6) * 0.866} cy={50 + (ringRadius + 2.6) * 0.5} r="1.3" fill="#FFFBEB" />
                  <circle cx={50 - (ringRadius + 2.6) * 0.866} cy={50 + (ringRadius + 2.6) * 0.5} r="2.6" fill="#EF4444" />
                  <circle cx={50 - (ringRadius + 2.6) * 0.866} cy={50 + (ringRadius + 2.6) * 0.5} r="1.3" fill="#FFFBEB" />
                </motion.g>

                {/* Inner Solar Core Ring (Rotating Counter-Clockwise) with 3 Flares */}
                <motion.g
                  animate={{ rotate: [360, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                  style={{ transformOrigin: '50px 50px' }}
                >
                  <circle
                    cx="50"
                    cy="50"
                    r={ringRadius - 1.6}
                    fill="none"
                    stroke={`url(#solarInner_${uniqueId})`}
                    strokeWidth="1.6"
                    strokeDasharray="14 5 3 5"
                  />
                  {/* 3 Inner Solar Flares at 60°, 180°, 300° */}
                  <circle cx={50 + (ringRadius - 1.6) * 0.866} cy={50 - (ringRadius - 1.6) * 0.5} r="2.2" fill="#FDE047" />
                  <circle cx={50 + (ringRadius - 1.6) * 0.866} cy={50 - (ringRadius - 1.6) * 0.5} r="1.1" fill="#FFFFFF" />
                  <circle cx="50" cy={50 + (ringRadius - 1.6)} r="2.2" fill="#F97316" />
                  <circle cx="50" cy={50 + (ringRadius - 1.6)} r="1.1" fill="#FFFFFF" />
                  <circle cx={50 - (ringRadius - 1.6) * 0.866} cy={50 - (ringRadius - 1.6) * 0.5} r="2.2" fill="#FDE047" />
                  <circle cx={50 - (ringRadius - 1.6) * 0.866} cy={50 - (ringRadius - 1.6) * 0.5} r="1.1" fill="#FFFFFF" />
                </motion.g>

                {/* 4 Cardinal Solar Ray Ticks */}
                <line x1="50" y1="5" x2="50" y2="9.5" stroke="#F59E0B" strokeWidth="1.6" opacity="0.85" />
                <line x1="50" y1="90.5" x2="50" y2="95" stroke="#F59E0B" strokeWidth="1.6" opacity="0.85" />
                <line x1="5" y1="50" x2="9.5" y2="50" stroke="#F97316" strokeWidth="1.6" opacity="0.85" />
                <line x1="90.5" y1="50" x2="95" y2="50" stroke="#F97316" strokeWidth="1.6" opacity="0.85" />
              </g>
            )}

            {/* 3. CYBER ORBIT (Pro Exclusive) */}
            {activeFlairId === 'cyber-orbit' && (
              <g>
                {/* Outer Neon Cyan Tech Ring (Rotating Clockwise) with 2 Nodes */}
                <motion.g
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
                  style={{ transformOrigin: '50px 50px' }}
                >
                  <circle
                    cx="50"
                    cy="50"
                    r={ringRadius + 2.5}
                    fill="none"
                    stroke={`url(#cyberCyan_${uniqueId})`}
                    strokeWidth="1.6"
                    strokeDasharray="18 6 4 6"
                  />
                  {/* Outer Orbit Nodes at 0° and 180° */}
                  <circle cx="50" cy={50 - (ringRadius + 2.5)} r="2.4" fill="#06B6D4" />
                  <circle cx="50" cy={50 - (ringRadius + 2.5)} r="1.2" fill="#FFFFFF" />
                  <circle cx="50" cy={50 + (ringRadius + 2.5)} r="2.4" fill="#06B6D4" />
                  <circle cx="50" cy={50 + (ringRadius + 2.5)} r="1.2" fill="#FFFFFF" />
                </motion.g>

                {/* Inner Neon Violet Tech Ring (Rotating Counter-Clockwise) with 2 Nodes */}
                <motion.g
                  animate={{ rotate: [360, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                  style={{ transformOrigin: '50px 50px' }}
                >
                  <circle
                    cx="50"
                    cy="50"
                    r={ringRadius - 1.5}
                    fill="none"
                    stroke={`url(#cyberViolet_${uniqueId})`}
                    strokeWidth="1.6"
                    strokeDasharray="14 6"
                  />
                  {/* Inner Orbit Nodes at 90° and 270° */}
                  <circle cx={50 + (ringRadius - 1.5)} cy="50" r="2.2" fill="#A855F7" />
                  <circle cx={50 + (ringRadius - 1.5)} cy="50" r="1.1" fill="#FFFFFF" />
                  <circle cx={50 - (ringRadius - 1.5)} cy="50" r="2.2" fill="#A855F7" />
                  <circle cx={50 - (ringRadius - 1.5)} cy="50" r="1.1" fill="#FFFFFF" />
                </motion.g>

                {/* 4 Tech Crosshair Ticks */}
                <line x1="50" y1="6" x2="50" y2="10" stroke="#06B6D4" strokeWidth="1.5" opacity="0.8" />
                <line x1="50" y1="90" x2="50" y2="94" stroke="#06B6D4" strokeWidth="1.5" opacity="0.8" />
                <line x1="6" y1="50" x2="10" y2="50" stroke="#8B5CF6" strokeWidth="1.5" opacity="0.8" />
                <line x1="90" y1="50" x2="94" y2="50" stroke="#8B5CF6" strokeWidth="1.5" opacity="0.8" />
              </g>
            )}

            {/* 4. VOID AURA (Pro Exclusive) - COSMIC SINGULARITY */}
            {activeFlairId === 'void-aura' && (
              <g>
                {/* Outer Abyssal Accretion Ring (Rotating Clockwise) with 2 Pulsar Nodes */}
                <motion.g
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                  style={{ transformOrigin: '50px 50px' }}
                >
                  <circle
                    cx="50"
                    cy="50"
                    r={ringRadius + 2.6}
                    fill="none"
                    stroke={`url(#voidGrad_${uniqueId})`}
                    strokeWidth="1.7"
                    strokeDasharray="22 6 4 6"
                  />
                  {/* Outer Pulsar Nodes at 45° and 225° */}
                  <circle cx={50 + (ringRadius + 2.6) * 0.707} cy={50 - (ringRadius + 2.6) * 0.707} r="2.5" fill="#A855F7" />
                  <circle cx={50 + (ringRadius + 2.6) * 0.707} cy={50 - (ringRadius + 2.6) * 0.707} r="1.2" fill="#FFFFFF" />
                  <circle cx={50 - (ringRadius + 2.6) * 0.707} cy={50 + (ringRadius + 2.6) * 0.707} r="2.5" fill="#A855F7" />
                  <circle cx={50 - (ringRadius + 2.6) * 0.707} cy={50 + (ringRadius + 2.6) * 0.707} r="1.2" fill="#FFFFFF" />
                </motion.g>

                {/* Inner Event Horizon Warp Ring (Rotating Counter-Clockwise) with 2 Dark Nodes */}
                <motion.g
                  animate={{ rotate: [360, 0] }}
                  transition={{ duration: 5.5, repeat: Infinity, ease: 'linear' }}
                  style={{ transformOrigin: '50px 50px' }}
                >
                  <circle
                    cx="50"
                    cy="50"
                    r={ringRadius - 1.6}
                    fill="none"
                    stroke={`url(#voidInner_${uniqueId})`}
                    strokeWidth="1.6"
                    strokeDasharray="16 5 3 5"
                  />
                  {/* Inner Singularity Nodes at 135° and 315° */}
                  <circle cx={50 + (ringRadius - 1.6) * 0.707} cy={50 + (ringRadius - 1.6) * 0.707} r="2.2" fill="#6366F1" />
                  <circle cx={50 + (ringRadius - 1.6) * 0.707} cy={50 + (ringRadius - 1.6) * 0.707} r="1.1" fill="#FFFFFF" />
                  <circle cx={50 - (ringRadius - 1.6) * 0.707} cy={50 - (ringRadius - 1.6) * 0.707} r="2.2" fill="#6366F1" />
                  <circle cx={50 - (ringRadius - 1.6) * 0.707} cy={50 - (ringRadius - 1.6) * 0.707} r="1.1" fill="#FFFFFF" />
                </motion.g>

                {/* 4 Gravitational Caliper Reticle Ticks */}
                <line x1="50" y1="6" x2="50" y2="10" stroke="#C084FC" strokeWidth="1.5" opacity="0.85" />
                <line x1="50" y1="90" x2="50" y2="94" stroke="#C084FC" strokeWidth="1.5" opacity="0.85" />
                <line x1="6" y1="50" x2="10" y2="50" stroke="#818CF8" strokeWidth="1.5" opacity="0.85" />
                <line x1="90" y1="50" x2="94" y2="50" stroke="#818CF8" strokeWidth="1.5" opacity="0.85" />
              </g>
            )}

            {/* 5. ZEN LOTUS (Pro Exclusive) - HARMONIC SACRED MANDALA */}
            {activeFlairId === 'zen-lotus' && (
              <g>
                {/* Outer Sacred Jade Ring (Rotating Clockwise) with 4 Spirit Orbs */}
                <motion.g
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 8.5, repeat: Infinity, ease: 'linear' }}
                  style={{ transformOrigin: '50px 50px' }}
                >
                  <circle
                    cx="50"
                    cy="50"
                    r={ringRadius + 2.5}
                    fill="none"
                    stroke={`url(#zenGrad_${uniqueId})`}
                    strokeWidth="1.7"
                    strokeDasharray="16 6 3 6"
                  />
                  {/* 4 Jade Spirit Orbs at 0°, 90°, 180°, 270° */}
                  <circle cx="50" cy={50 - (ringRadius + 2.5)} r="2.4" fill="#34D399" />
                  <circle cx="50" cy={50 - (ringRadius + 2.5)} r="1.2" fill="#FFFFFF" />
                  <circle cx={50 + (ringRadius + 2.5)} cy="50" r="2.4" fill="#34D399" />
                  <circle cx={50 + (ringRadius + 2.5)} cy="50" r="1.2" fill="#FFFFFF" />
                  <circle cx="50" cy={50 + (ringRadius + 2.5)} r="2.4" fill="#34D399" />
                  <circle cx="50" cy={50 + (ringRadius + 2.5)} r="1.2" fill="#FFFFFF" />
                  <circle cx={50 - (ringRadius + 2.5)} cy="50" r="2.4" fill="#34D399" />
                  <circle cx={50 - (ringRadius + 2.5)} cy="50" r="1.2" fill="#FFFFFF" />
                </motion.g>

                {/* Inner Celestite Teal Harmonics Ring (Rotating Counter-Clockwise) with 4 Resonance Nodes */}
                <motion.g
                  animate={{ rotate: [360, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                  style={{ transformOrigin: '50px 50px' }}
                >
                  <circle
                    cx="50"
                    cy="50"
                    r={ringRadius - 1.5}
                    fill="none"
                    stroke={`url(#zenInner_${uniqueId})`}
                    strokeWidth="1.6"
                    strokeDasharray="12 4 4 4"
                  />
                  {/* 4 Harmonic Nodes at 45°, 135°, 225°, 315° */}
                  <circle cx={50 + (ringRadius - 1.5) * 0.707} cy={50 - (ringRadius - 1.5) * 0.707} r="2.0" fill="#2DD4BF" />
                  <circle cx={50 + (ringRadius - 1.5) * 0.707} cy={50 - (ringRadius - 1.5) * 0.707} r="1.0" fill="#FFFFFF" />
                  <circle cx={50 + (ringRadius - 1.5) * 0.707} cy={50 + (ringRadius - 1.5) * 0.707} r="2.0" fill="#2DD4BF" />
                  <circle cx={50 + (ringRadius - 1.5) * 0.707} cy={50 + (ringRadius - 1.5) * 0.707} r="1.0" fill="#FFFFFF" />
                  <circle cx={50 - (ringRadius - 1.5) * 0.707} cy={50 + (ringRadius - 1.5) * 0.707} r="2.0" fill="#2DD4BF" />
                  <circle cx={50 - (ringRadius - 1.5) * 0.707} cy={50 + (ringRadius - 1.5) * 0.707} r="1.0" fill="#FFFFFF" />
                  <circle cx={50 - (ringRadius - 1.5) * 0.707} cy={50 - (ringRadius - 1.5) * 0.707} r="2.0" fill="#2DD4BF" />
                  <circle cx={50 - (ringRadius - 1.5) * 0.707} cy={50 - (ringRadius - 1.5) * 0.707} r="1.0" fill="#FFFFFF" />
                </motion.g>

                {/* 4 Crystal Diamond Finch Pointers at Cardinal Directions */}
                <polygon points="50,5.5 52,8 50,10.5 48,8" fill="#34D399" opacity="0.9" />
                <polygon points="50,89.5 52,92 50,94.5 48,92" fill="#34D399" opacity="0.9" />
                <polygon points="5.5,50 8,48 10.5,50 8,52" fill="#2DD4BF" opacity="0.9" />
                <polygon points="89.5,50 92,48 94.5,50 92,52" fill="#2DD4BF" opacity="0.9" />
              </g>
            )}
          </>
        )}
      </svg>

      {/* Layer 3: Central Avatar Node */}
      <div className="relative z-10 flex items-center justify-center rounded-full overflow-hidden">
        {children}
      </div>

      {/* Optional Hover Customize Trigger Pill */}
      {showCustomBadge && (
        <div className="absolute -bottom-1 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <span className="px-1.5 py-0.5 rounded-full bg-black/85 border border-amber-400/50 text-[9px] font-hud font-bold text-amber-300 tracking-wider uppercase shadow-md">
            FLAIR
          </span>
        </div>
      )}
    </div>
  );
});

RoomAvatarFlair.displayName = 'RoomAvatarFlair';
