'use client';

import React from 'react';
import { RankTierName } from '../../lib/rankedSystem';
import { getRankBadgeSources } from '../../lib/preloadRankBadges';
import { RankBadge, getRankBadgeTier } from './RankBadge';
import { BadgeEffectsMode } from '../../lib/badgeFx';

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
  effects?: BadgeEffectsMode;
  showGlintPoints?: boolean;
  forcePaused?: boolean;
  replayEntrance?: boolean;
  onFlex?: () => void;
}

/**
 * RankCrestBadge delegates to the unified RankBadge component
 * ensuring all ranks across dashboard, navbar, and leaderboard
 * display the authentic crests and hardware-accelerated VFX.
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
  effects,
  showGlintPoints = false,
  forcePaused = false,
  replayEntrance,
  onFlex,
}: RankCrestBadgeProps) {
  const fullTitle = `${tier || 'Bronze'} ${division || ''}`.trim();
  const sources = getRankBadgeSources(tier as any, division as any);
  const badgeTier = getRankBadgeTier(fullTitle);

  return (
    <RankBadge
      src={sources.png}
      tier={badgeTier}
      division={division}
      size={size}
      compact={compact}
      delay={delay}
      alt={`${fullTitle} Rank Badge`}
      rankTitle={fullTitle}
      priority={priority}
      effects={effects}
      interactive={interactive}
      showGlintPoints={showGlintPoints}
      forcePaused={forcePaused}
      replayEntrance={replayEntrance}
      onFlex={onFlex}
      className={`${className} ${isGhost ? 'opacity-40 grayscale' : ''}`}
    />
  );
}
