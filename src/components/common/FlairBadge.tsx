'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Crown } from 'lucide-react';
import { FlairFrame, FLAIR_FRAMES } from '../../lib/flair';

export function AvatarFlairRing({
  frame,
  children,
  className = '',
  size = 40,
}: {
  frame?: FlairFrame | null;
  children: React.ReactNode;
  className?: string;
  size?: number;
}) {
  const prefersReducedMotion = useReducedMotion();

  if (!frame) {
    return <>{children}</>;
  }

  const flairConfig = FLAIR_FRAMES[frame] || FLAIR_FRAMES.gold;

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full p-[2.5px] shrink-0 select-none ${className}`}
      style={{
        background: flairConfig.gradient,
        boxShadow: `0 0 12px ${flairConfig.glowColor}`,
      }}
    >
      {/* Inner Avatar slot */}
      <div className="rounded-full overflow-hidden w-full h-full relative z-0 flex items-center justify-center">
        {children}
      </div>

      {/* Soft one-time shimmer when row first appears (no loop, no rotating ring) */}
      {!prefersReducedMotion && (
        <motion.div
          initial={{ opacity: 0, x: '-120%' }}
          animate={{ opacity: [0, 0.6, 0], x: '160%' }}
          transition={{ duration: 1.1, ease: 'easeOut', delay: 0.2 }}
          className="absolute inset-0 rounded-full pointer-events-none z-10 overflow-hidden"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
          }}
        />
      )}
    </div>
  );
}

export function FlairCrown({
  frame,
  className = '',
  size = 14,
}: {
  frame?: FlairFrame | null;
  className?: string;
  size?: number;
}) {
  if (!frame) return null;
  const flairConfig = FLAIR_FRAMES[frame] || FLAIR_FRAMES.gold;

  return (
    <Crown
      style={{
        width: size,
        height: size,
        color: flairConfig.crownColor || flairConfig.starColor,
      }}
      className={`fill-current shrink-0 inline drop-shadow-sm ${className}`}
      aria-label={`${flairConfig.name} Pro Scholar`}
    />
  );
}

// Backwards compatibility alias for components importing FlairStar
export const FlairStar = FlairCrown;

