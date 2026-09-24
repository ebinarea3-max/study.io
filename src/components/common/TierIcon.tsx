import React from 'react';
import Image from 'next/image';
import { useRankTheme } from '../../hooks/useRankTheme';
import { getRankIconPath } from '../../utils/rankIcons';

interface TierIconProps {
  className?: string;
  style?: React.CSSProperties;
  tier?: string;
  division?: string;
  size?: number;
}

export function TierIcon({ className, style, tier, division, size = 24 }: TierIconProps) {
  const { userRank } = useRankTheme();
  
  const displayTier = tier || userRank.tier;
  const displayDivision = division || userRank.division;

  return (
    <Image
      src={getRankIconPath(displayTier, displayDivision)}
      alt={`${displayTier} icon`}
      width={size}
      height={size}
      className={`object-contain ${className || ''}`}
      style={style}
      unoptimized
    />
  );
}
