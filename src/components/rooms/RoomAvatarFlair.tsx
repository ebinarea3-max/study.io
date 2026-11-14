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

export function RoomAvatarFlair({
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

          <linearGradient id={`zenGrad_${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="50%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#0D9488" />
          </linearGradient>

          {/* Glow Filters */}
          <filter id={`glow_${uniqueId}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor={config.themeColor} floodOpacity="0.75" />
          </filter>
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
            {/* 1. DEFAULT FOCUS FLAIR */}
            {activeFlairId === 'default' && (
              <g>
                {/* Outer soft pulsing ring */}
                <motion.circle
                  cx="50"
                  cy="50"
                  r={ringRadius + 3.5}
                  fill="none"
                  stroke="#06B6D4"
                  strokeWidth="1"
                  strokeDasharray="4 8"
                  animate={{
                    scale: [1, 1.03, 1],
                    opacity: [0.35, 0.65, 0.35],
                  }}
                  transition={{
                    duration: 2.8,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  style={{ transformOrigin: '50px 50px' }}
                />

                {/* Main focus ring */}
                <motion.circle
                  cx="50"
                  cy="50"
                  r={ringRadius}
                  fill="none"
                  stroke={`url(#defaultGrad_${uniqueId})`}
                  strokeWidth="2.5"
                  filter={`url(#glow_${uniqueId})`}
                  animate={{
                    scale: [1, 1.025, 1],
                    opacity: [0.9, 1, 0.9],
                  }}
                  transition={{
                    duration: 2.4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  style={{ transformOrigin: '50px 50px' }}
                />

                {/* Orbiting focus beacon node */}
                <motion.g
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                  style={{ transformOrigin: '50px 50px' }}
                >
                  <circle cx="50" cy={50 - ringRadius} r="3" fill="#10B981" filter={`url(#glow_${uniqueId})`} />
                  <circle cx="50" cy={50 - ringRadius} r="1.5" fill="#FFFFFF" />
                </motion.g>
              </g>
            )}

            {/* 2. SOLAR FLARE (Pro Exclusive) */}
            {activeFlairId === 'solar-flare' && (
              <g>
                {/* Main Fiery Plasma Ring */}
                <motion.circle
                  cx="50"
                  cy="50"
                  r={ringRadius}
                  fill="none"
                  stroke={`url(#solarGrad_${uniqueId})`}
                  strokeWidth="2.75"
                  filter={`url(#glow_${uniqueId})`}
                  animate={{
                    scale: [1, 1.035, 1],
                    opacity: [0.85, 1, 0.85],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  style={{ transformOrigin: '50px 50px' }}
                />

                {/* Counter-rotating micro plasma ring */}
                <motion.circle
                  cx="50"
                  cy="50"
                  r={ringRadius - 1.5}
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="1.25"
                  strokeDasharray="7 5 3 5"
                  opacity="0.7"
                  animate={{ rotate: [360, 0] }}
                  transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
                  style={{ transformOrigin: '50px 50px' }}
                />

                {/* Rotating Corona Plasma Particles (6 golden ember sparks) */}
                <motion.g
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                  style={{ transformOrigin: '50px 50px' }}
                >
                  {/* 0 deg */}
                  <circle cx="50" cy={50 - ringRadius - 1} r="2.5" fill="#FDE047" filter={`url(#glow_${uniqueId})`} />
                  {/* 60 deg */}
                  <circle cx={50 + (ringRadius + 1) * 0.866} cy={50 - (ringRadius + 1) * 0.5} r="2" fill="#F97316" />
                  {/* 120 deg */}
                  <circle cx={50 + (ringRadius + 1) * 0.866} cy={50 + (ringRadius + 1) * 0.5} r="2.5" fill="#FDE047" filter={`url(#glow_${uniqueId})`} />
                  {/* 180 deg */}
                  <circle cx="50" cy={50 + ringRadius + 1} r="2" fill="#EF4444" />
                  {/* 240 deg */}
                  <circle cx={50 - (ringRadius + 1) * 0.866} cy={50 + (ringRadius + 1) * 0.5} r="2.5" fill="#FDE047" filter={`url(#glow_${uniqueId})`} />
                  {/* 300 deg */}
                  <circle cx={50 - (ringRadius + 1) * 0.866} cy={50 - (ringRadius + 1) * 0.5} r="2" fill="#F97316" />
                </motion.g>
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
                    filter={`url(#glow_${uniqueId})`}
                  />
                  {/* Outer Orbit Nodes at 0° and 180° */}
                  <circle cx="50" cy={50 - (ringRadius + 2.5)} r="2.4" fill="#06B6D4" filter={`url(#glow_${uniqueId})`} />
                  <circle cx="50" cy={50 - (ringRadius + 2.5)} r="1.2" fill="#FFFFFF" />
                  <circle cx="50" cy={50 + (ringRadius + 2.5)} r="2.4" fill="#06B6D4" filter={`url(#glow_${uniqueId})`} />
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

            {/* 4. VOID AURA (Pro Exclusive) */}
            {activeFlairId === 'void-aura' && (
              <g>
                {/* Shockwave Ripple 1 */}
                <motion.circle
                  cx="50"
                  cy="50"
                  r={ringRadius}
                  fill="none"
                  stroke="#A855F7"
                  strokeWidth="1.5"
                  animate={{
                    scale: [0.96, 1.34],
                    opacity: [0.85, 0],
                  }}
                  transition={{
                    duration: 2.8,
                    repeat: Infinity,
                    ease: [0.1, 0.7, 0.1, 1],
                  }}
                  style={{ transformOrigin: '50px 50px' }}
                />

                {/* Shockwave Ripple 2 (Staggered Delay) */}
                <motion.circle
                  cx="50"
                  cy="50"
                  r={ringRadius}
                  fill="none"
                  stroke="#6366F1"
                  strokeWidth="1.5"
                  animate={{
                    scale: [0.96, 1.34],
                    opacity: [0.85, 0],
                  }}
                  transition={{
                    duration: 2.8,
                    repeat: Infinity,
                    ease: [0.1, 0.7, 0.1, 1],
                    delay: 1.4,
                  }}
                  style={{ transformOrigin: '50px 50px' }}
                />

                {/* Gravitational Singularity Core Ring */}
                <motion.circle
                  cx="50"
                  cy="50"
                  r={ringRadius}
                  fill="none"
                  stroke={`url(#voidGrad_${uniqueId})`}
                  strokeWidth="2.8"
                  filter={`url(#glow_${uniqueId})`}
                  animate={{
                    scale: [1, 1.03, 1],
                    opacity: [0.85, 1, 0.85],
                  }}
                  transition={{
                    duration: 2.4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  style={{ transformOrigin: '50px 50px' }}
                />

                {/* Orbiting singularity micro sparks */}
                <motion.circle
                  cx="50"
                  cy={50 - ringRadius}
                  r="1.8"
                  fill="#FFFFFF"
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: 'linear' }}
                  style={{ transformOrigin: '50px 50px' }}
                />
              </g>
            )}

            {/* 5. ZEN LOTUS (Pro Exclusive) */}
            {activeFlairId === 'zen-lotus' && (
              <g>
                {/* Harmonic Expanding Wave 1 */}
                <motion.circle
                  cx="50"
                  cy="50"
                  r={ringRadius}
                  fill="none"
                  stroke="#34D399"
                  strokeWidth="1.5"
                  animate={{
                    scale: [0.97, 1.32],
                    opacity: [0.75, 0],
                  }}
                  transition={{
                    duration: 3.3,
                    repeat: Infinity,
                    ease: 'easeOut',
                  }}
                  style={{ transformOrigin: '50px 50px' }}
                />

                {/* Harmonic Expanding Wave 2 */}
                <motion.circle
                  cx="50"
                  cy="50"
                  r={ringRadius}
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="1.5"
                  animate={{
                    scale: [0.97, 1.32],
                    opacity: [0.75, 0],
                  }}
                  transition={{
                    duration: 3.3,
                    repeat: Infinity,
                    ease: 'easeOut',
                    delay: 1.1,
                  }}
                  style={{ transformOrigin: '50px 50px' }}
                />

                {/* Harmonic Expanding Wave 3 */}
                <motion.circle
                  cx="50"
                  cy="50"
                  r={ringRadius}
                  fill="none"
                  stroke="#0D9488"
                  strokeWidth="1.5"
                  animate={{
                    scale: [0.97, 1.32],
                    opacity: [0.75, 0],
                  }}
                  transition={{
                    duration: 3.3,
                    repeat: Infinity,
                    ease: 'easeOut',
                    delay: 2.2,
                  }}
                  style={{ transformOrigin: '50px 50px' }}
                />

                {/* Harmonic Core Ring */}
                <motion.circle
                  cx="50"
                  cy="50"
                  r={ringRadius}
                  fill="none"
                  stroke={`url(#zenGrad_${uniqueId})`}
                  strokeWidth="2.5"
                  filter={`url(#glow_${uniqueId})`}
                  animate={{
                    scale: [1, 1.025, 1],
                    opacity: [0.9, 1, 0.9],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  style={{ transformOrigin: '50px 50px' }}
                />

                {/* 8 Nodal Lotus Petal Points around the ring */}
                {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
                  const rad = (angle * Math.PI) / 180;
                  const x = 50 + ringRadius * Math.cos(rad);
                  const y = 50 + ringRadius * Math.sin(rad);
                  return (
                    <circle
                      key={angle}
                      cx={x}
                      cy={y}
                      r="1.6"
                      fill="#A7F3D0"
                      opacity="0.9"
                    />
                  );
                })}
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
}
