import React from 'react';
import Image from 'next/image';
import { RankTierName } from '../../lib/rankedSystem';
import { getRankIconPath } from '../../utils/rankIcons';

interface RankCrestBadgeProps {
  tier: RankTierName | string;
  division?: string;
  size?: number;
  className?: string;
  isGhost?: boolean;
  ghostColor?: string;
  showSheen?: boolean;
}

export function RankCrestBadge({
  tier,
  division,
  size = 72,
  className = '',
  isGhost = false,
  ghostColor,
  showSheen = true,
}: RankCrestBadgeProps) {
  
  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{
        width: size,
        height: size,
        minWidth: size,
        filter: isGhost && ghostColor ? `drop-shadow(0 0 10px ${ghostColor})` : undefined,
      }}
    >
      <div className="absolute inset-0 animate-floating hover:animate-none hover:scale-110 transition-transform duration-300">
        <Image
          src={getRankIconPath(tier, division || 'I')}
          alt={`${tier} Rank`}
          width={size}
          height={size}
          priority
          unoptimized
          className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]"
          style={{ mixBlendMode: 'screen' }}
        />
        
        {showSheen && !isGhost && (
          <div
            className="absolute inset-[10%] rounded-full pointer-events-none mix-blend-overlay overflow-hidden opacity-60"
            style={{
              maskImage: 'radial-gradient(circle at center, black 65%, transparent 75%)',
              WebkitMaskImage: 'radial-gradient(circle at center, black 65%, transparent 75%)',
            }}
          >
            <div
              className="w-full h-full rounded-full"
              style={{
                background:
                  'conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(255,255,255,0.05) 40deg, rgba(255,255,255,0.8) 90deg, rgba(255,255,255,0.05) 140deg, transparent 180deg, rgba(255,255,255,0.5) 270deg, transparent 360deg)',
                animation: 'conicSheenRotate 6s linear infinite',
                willChange: 'transform',
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
