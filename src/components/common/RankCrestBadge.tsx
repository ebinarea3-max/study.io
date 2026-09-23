import React from 'react';
import { getRankTheme, RankTierName } from '../../lib/rankTheme';
import { TierIcon } from './TierIcon';

interface RankCrestBadgeProps {
  tier: RankTierName;
  className?: string;
  size?: number;
}

export function RankCrestBadge({ tier, className = '', size = 44 }: RankCrestBadgeProps) {
  const theme = getRankTheme(tier);

  // Animated sheen for higher tiers
  const hasSheen = ['Diamond', 'Heroic', 'Master', 'Grandmaster'].includes(tier);

  return (
    <div 
      className={`relative flex items-center justify-center shrink-0 ${className}`}
      style={{ 
        width: size, 
        height: size,
        filter: `drop-shadow(0 4px 6px ${theme.glow})` 
      }}
    >
      {/* Outer crest shape: Hexagon */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-slate-200 via-slate-400 to-slate-700"
        style={{
          clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
        }}
      />
      
      {/* Inner crest body (slightly smaller for metallic border effect) */}
      <div 
        className="absolute inset-[1.5px] overflow-hidden"
        style={{
          clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
          background: `linear-gradient(135deg, ${theme.accent} 0%, rgba(0,0,0,0.6) 100%)`,
          boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)'
        }}
      >
        {/* Animated sheen overlay */}
        {hasSheen && (
          <div 
            className="absolute inset-0 -translate-x-full animate-[sheenSweep_4s_ease-in-out_infinite]"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
              transform: 'skewX(-20deg) translateX(-150%)',
            }}
          />
        )}
      </div>

      {/* Centered Tier Icon */}
      <div className="relative z-10 flex items-center justify-center w-full h-full">
        <TierIcon 
          tier={tier} 
          className="text-white drop-shadow-md"
          style={{ width: size * 0.45, height: size * 0.45 }} 
        />
      </div>
    </div>
  );
}
