import React from 'react';
import { RankTierName, RANK_TIERS } from '../../lib/rankedSystem';

interface RankCrestBadgeProps {
  tier: RankTierName;
  division?: string;
  size?: number | string;
  className?: string;
  isGhost?: boolean;
  ghostColor?: string;
  showSheen?: boolean;
}

const TIER_SCALES: Record<string, number> = {
  Bronze: 1.0,
  Silver: 1.06,
  Gold: 1.12,
  Platinum: 1.18,
  Diamond: 1.25,
  Champion: 1.38,
  Master: 1.44,
  Grandmaster: 1.50,
};

const DIVISION_MAP: Record<string, string> = {
  'I': '1',
  'II': '2',
  'III': '3',
  'IV': '4'
};

export function RankCrestBadge({
  tier,
  division,
  size = 72,
  className = '',
  isGhost = false,
  ghostColor,
  showSheen = true,
}: RankCrestBadgeProps) {
  const scale = TIER_SCALES[tier] || 1.0;
  
  const actualSize = typeof size === 'number' ? size * scale : `calc(${size} * ${scale})`;

  const containerStyle: React.CSSProperties = {
    width: actualSize,
    height: actualSize,
    minWidth: actualSize,
    filter: isGhost && ghostColor ? `drop-shadow(0 0 10px ${ghostColor})` : `drop-shadow(0 4px 12px rgba(0,0,0,0.5))`,
  };

  const tierLower = tier.toLowerCase();
  
  let imageFileName = `${tierLower}.png`;
  
  if (division && !['Champion', 'Master', 'Grandmaster'].includes(tier)) {
      const divisionNumber = DIVISION_MAP[division] || '1';
      imageFileName = `${tierLower}-${divisionNumber}.png`;
  }

  const imageSrc = `/images/ranks/${imageFileName}`;

  let animationClass = '';
  if (!isGhost) {
    if (['Bronze', 'Silver', 'Gold'].includes(tier)) {
      animationClass = 'animate-rank-float';
    } else if (['Platinum', 'Diamond'].includes(tier)) {
      animationClass = 'animate-rank-float-intense';
    } else if (['Champion', 'Master', 'Grandmaster'].includes(tier)) {
      animationClass = 'animate-rank-float-legendary';
    }
  }

  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      style={containerStyle}
    >
      <img
        src={imageSrc}
        alt={`${tier} ${division || ''} Rank Badge`}
        className={`w-full h-full object-contain filter transition-all duration-500 ${animationClass}`}
        draggable={false}
      />

      {showSheen && !isGhost && (
        <div
          className="absolute inset-[8%] rounded-full pointer-events-none mix-blend-overlay overflow-hidden opacity-50"
          style={{ maskImage: 'radial-gradient(circle at center, black 65%, transparent 75%)', WebkitMaskImage: 'radial-gradient(circle at center, black 65%, transparent 75%)' }}
        >
          <div
            className="w-full h-full rounded-full"
            style={{
              background: 'conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(255,255,255,0.02) 40deg, rgba(255,255,255,0.6) 90deg, rgba(255,255,255,0.02) 140deg, transparent 180deg, rgba(255,255,255,0.4) 270deg, transparent 360deg)',
              animation: 'conicSheenRotate 6s linear infinite',
              willChange: 'transform',
            }}
          />
        </div>
      )}
    </div>
  );
}
