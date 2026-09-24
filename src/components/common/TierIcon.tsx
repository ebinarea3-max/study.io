import React from 'react';
import { useRankTheme } from '../../hooks/useRankTheme';
import { RankCrestBadge } from './RankCrestBadge';
import { RankTierName } from '../../lib/rankedSystem';

interface TierIconProps {
  className?: string;
  style?: React.CSSProperties;
  tier?: string;
  division?: string;
  size?: number;
}

export function TierIcon({ className, style, tier, division, size = 24 }: TierIconProps) {
  const { userRank } = useRankTheme();
  
  const displayTier = (tier || userRank.tier) as RankTierName;

  return (
    <div style={style} className={className}>
      <RankCrestBadge
        tier={displayTier}
        size={size}
      />
    </div>
  );
}
