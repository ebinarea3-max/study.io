'use client';

import React from 'react';

export type RankBadgeTier =
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'platinum'
  | 'diamond'
  | 'champion'
  | 'master'
  | 'grandmaster';

export interface RankBadgeProps {
  src: string;
  tier?: RankBadgeTier;
  delay?: number;
  size?: number | string;
  className?: string;
  alt?: string;
  priority?: boolean;
  scale?: number;
  rankTitle?: string;
}

const TIER_GLOW_MAP: Record<RankBadgeTier, { primary: string; secondary: string; backlight: string }> = {
  bronze: {
    primary: 'rgba(217, 119, 6, 0.55)',
    secondary: 'rgba(180, 83, 9, 0.35)',
    backlight: 'rgba(217, 119, 6, 0.35)',
  },
  silver: {
    primary: 'rgba(203, 213, 225, 0.60)',
    secondary: 'rgba(148, 163, 184, 0.35)',
    backlight: 'rgba(186, 206, 235, 0.30)',
  },
  gold: {
    primary: 'rgba(245, 158, 11, 0.65)',
    secondary: 'rgba(234, 179, 8, 0.40)',
    backlight: 'rgba(251, 191, 36, 0.40)',
  },
  platinum: {
    primary: 'rgba(6, 182, 212, 0.65)',
    secondary: 'rgba(56, 189, 248, 0.40)',
    backlight: 'rgba(6, 182, 212, 0.40)',
  },
  diamond: {
    primary: 'rgba(168, 85, 247, 0.70)',
    secondary: 'rgba(192, 132, 252, 0.45)',
    backlight: 'rgba(168, 85, 247, 0.45)',
  },
  champion: {
    primary: 'rgba(192, 70, 240, 0.75)',
    secondary: 'rgba(147, 51, 234, 0.45)',
    backlight: 'rgba(178, 79, 232, 0.45)',
  },
  master: {
    primary: 'rgba(99, 102, 241, 0.75)',
    secondary: 'rgba(129, 140, 248, 0.45)',
    backlight: 'rgba(99, 102, 241, 0.45)',
  },
  grandmaster: {
    primary: 'rgba(251, 191, 36, 0.80)',
    secondary: 'rgba(244, 63, 94, 0.50)',
    backlight: 'rgba(251, 191, 36, 0.50)',
  },
};

/**
 * Derives the tier from a rank title.
 * Preserves high tiers: Diamond, Champion, Master, Grandmaster.
 */
export function getRankBadgeTier(rankTitle: string): RankBadgeTier {
  const name = (rankTitle || '').toLowerCase();
  if (name.includes('grandmaster')) return 'grandmaster';
  if (name.includes('master')) return 'master';
  if (name.includes('champ')) return 'champion';
  if (name.includes('diamond')) return 'diamond';
  if (name.includes('plat')) return 'platinum';
  if (name.includes('gold')) return 'gold';
  if (name.includes('bronze')) return 'bronze';
  return 'silver';
}

/**
 * RankBadge displaying the authentic rank crest image with a calm, static,
 * tier-colored ambient glow for all ranks. Zero animation, zero flickering.
 */
export function RankBadge({
  src,
  tier,
  size = 160,
  className = '',
  alt = 'Rank Badge',
  priority = false,
  rankTitle = '',
}: RankBadgeProps) {
  const titleLower = (rankTitle || alt || '').toLowerCase();

  // Resolve active tier taking into account either tier prop or rankTitle string
  let activeTier: RankBadgeTier = tier || 'silver';
  if (titleLower.includes('grandmaster') || activeTier === 'grandmaster') activeTier = 'grandmaster';
  else if (titleLower.includes('master') || activeTier === 'master') activeTier = 'master';
  else if (titleLower.includes('champ') || activeTier === 'champion') activeTier = 'champion';
  else if (titleLower.includes('diamond') || activeTier === 'diamond') activeTier = 'diamond';
  else if (titleLower.includes('plat') || activeTier === 'platinum') activeTier = 'platinum';
  else if (titleLower.includes('gold') || activeTier === 'gold') activeTier = 'gold';
  else if (titleLower.includes('bronze') || activeTier === 'bronze') activeTier = 'bronze';

  const glow = TIER_GLOW_MAP[activeTier] || TIER_GLOW_MAP.silver;

  const numericSize = typeof size === 'number' ? size : parseInt(String(size), 10) || 160;
  const isCompact = numericSize <= 48;
  const pixelSize = typeof size === 'number' ? `${size}px` : size;

  const glowFilter = isCompact
    ? `drop-shadow(0 0 5px ${glow.primary}) drop-shadow(0 0 10px ${glow.secondary})`
    : `drop-shadow(0 0 12px ${glow.primary}) drop-shadow(0 0 26px ${glow.secondary})`;

  return (
    <div
      className={`relative flex items-center justify-center shrink-0 select-none overflow-visible ${className}`}
      style={{
        width: pixelSize,
        height: pixelSize,
        minWidth: pixelSize,
        minHeight: pixelSize,
      }}
    >
      {/* Static soft ambient backlight glow */}
      <div
        className="absolute pointer-events-none rounded-full"
        style={{
          inset: isCompact ? '12%' : '16%',
          background: `radial-gradient(circle, ${glow.backlight} 0%, transparent 72%)`,
          filter: isCompact ? 'blur(6px)' : 'blur(18px)',
          opacity: isCompact ? 0.45 : 0.65,
        }}
      />

      {/* Badge Crest with layered contour drop-shadow glow */}
      <img
        src={src}
        alt={alt || rankTitle || 'Rank Badge'}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        draggable={false}
        className="w-full h-full object-contain pointer-events-none select-none relative z-10"
        style={{
          filter: glowFilter,
        }}
      />
    </div>
  );
}
