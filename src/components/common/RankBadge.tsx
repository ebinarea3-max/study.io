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
  size?: number | string | 'sm' | 'md' | 'lg';
  compact?: boolean;
  className?: string;
  alt?: string;
  priority?: boolean;
  scale?: number;
  rankTitle?: string;
}

const TIER_GLOW_MAP: Record<RankBadgeTier, { primary: string; secondary: string }> = {
  bronze: {
    primary: 'rgba(245, 158, 11, 0.70)',
    secondary: 'rgba(217, 119, 6, 0.40)',
  },
  silver: {
    primary: 'rgba(226, 232, 240, 0.80)',
    secondary: 'rgba(148, 163, 184, 0.45)',
  },
  gold: {
    primary: 'rgba(251, 191, 36, 0.85)',
    secondary: 'rgba(245, 158, 11, 0.45)',
  },
  platinum: {
    primary: 'rgba(34, 211, 238, 0.85)',
    secondary: 'rgba(6, 182, 212, 0.45)',
  },
  diamond: {
    primary: 'rgba(192, 132, 252, 0.85)',
    secondary: 'rgba(168, 85, 247, 0.45)',
  },
  champion: {
    primary: 'rgba(232, 121, 249, 0.85)',
    secondary: 'rgba(192, 70, 240, 0.45)',
  },
  master: {
    primary: 'rgba(129, 140, 248, 0.85)',
    secondary: 'rgba(99, 102, 241, 0.45)',
  },
  grandmaster: {
    primary: 'rgba(251, 191, 36, 0.90)',
    secondary: 'rgba(244, 63, 94, 0.50)',
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
  compact = false,
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

  const isSm = size === 'sm' || compact === true;
  const numericSize = isSm ? 32 : (typeof size === 'number' ? size : parseInt(String(size), 10) || 160);
  const isCompact = isSm || numericSize <= 48;
  const pixelSize = `${numericSize}px`;

  // Crisp, radiant glow applied directly to the rank icon itself (zero background aura)
  const glowFilter = isCompact
    ? `drop-shadow(0 0 2px ${glow.primary}) drop-shadow(0 0 5px ${glow.secondary})`
    : `drop-shadow(0 0 4px ${glow.primary}) drop-shadow(0 0 10px ${glow.secondary})`;

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
      {/* Badge Crest with contour glow directly on the icon artwork */}
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
