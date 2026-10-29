'use client';

import React from 'react';
import { RankTierName } from '../../lib/rankedSystem';
import { getRankBadgeSources } from '../../lib/preloadRankBadges';
import { RankBadge, getRankBadgeTier } from './RankBadge';

export interface RankCrestBadgeProps {
  tier: RankTierName | string;
  division?: string;
  size?: number | string | 'sm' | 'md' | 'lg';
  compact?: boolean;
  className?: string;
  isGhost?: boolean;
  ghostColor?: string;
  isSettled?: boolean;
  priority?: boolean;
  interactive?: boolean;
  delay?: number;
}

/**
 * RankCrestBadge delegates to the unified RankBadge component
 * ensuring all ranks across dashboard, navbar, and leaderboard
 * display the authentic, normalized badges and prestige animations.
 */
export function RankCrestBadge({
  tier,
  division,
  size = 72,
  compact = false,
  className = '',
  isGhost = false,
  ghostColor,
  isSettled = true,
  priority = false,
  interactive = true,
  delay = 0,
}: RankCrestBadgeProps) {
  const fullTitle = `${tier || 'Bronze'} ${division || ''}`.trim();
  const sources = getRankBadgeSources(tier as any, division as any);
  const badgeTier = getRankBadgeTier(fullTitle);

  return (
    <RankBadge
      src={sources.png}
      tier={badgeTier}
      size={size}
      compact={compact}
      delay={delay}
      alt={`${fullTitle} Rank Badge`}
      rankTitle={fullTitle}
      priority={priority}
      className={`${className} ${isGhost ? 'opacity-40 grayscale' : ''}`}
    />
  );
}
