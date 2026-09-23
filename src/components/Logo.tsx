import React from 'react';
import { Flame, Shield, Star, Hexagon, Gem, Sparkles, Crown, Award } from 'lucide-react';
import { useRankTheme } from '../hooks/useRankTheme';

const TIER_GLOW_MAPPING: Record<string, string> = {
  Bronze: '0 0 8px var(--tier-glow)',
  Silver: '0 0 10px var(--tier-glow)',
  Gold: '0 0 12px var(--tier-glow)',
  Platinum: '0 0 14px var(--tier-glow)',
  Diamond: '0 0 16px var(--tier-glow)',
  Heroic: '0 0 20px var(--tier-glow)',
  Master: '0 0 24px var(--tier-glow)',
  Grandmaster: '0 0 32px var(--tier-glow)',
};

export function Logo({ className = "w-7 h-7" }: { className?: string }) {
  const { theme } = useRankTheme();

  const renderIcon = () => {
    switch (theme.icon) {
      case 'Flame': return <Flame className="w-[55%] h-[55%] text-white/90 drop-shadow-md transition-opacity duration-1000" />;
      case 'Shield': return <Shield className="w-[55%] h-[55%] text-white/90 drop-shadow-md transition-opacity duration-1000" />;
      case 'Star': return <Star className="w-[55%] h-[55%] text-white/90 drop-shadow-md transition-opacity duration-1000" />;
      case 'Hexagon': return <Hexagon className="w-[55%] h-[55%] text-white/90 drop-shadow-md transition-opacity duration-1000" />;
      case 'Gem': return <Gem className="w-[55%] h-[55%] text-white/90 drop-shadow-md transition-opacity duration-1000" />;
      case 'Sparkles': return <Sparkles className="w-[55%] h-[55%] text-white/90 drop-shadow-md transition-opacity duration-1000" />;
      case 'Crown': return <Crown className="w-[55%] h-[55%] text-white/90 drop-shadow-md transition-opacity duration-1000" />;
      case 'Award': return <Award className="w-[65%] h-[65%] text-white/95 drop-shadow-lg transition-opacity duration-1000" />;
      default: return <Flame className="w-[55%] h-[55%] text-white/90 drop-shadow-md transition-opacity duration-1000" />;
    }
  };

  const isGrandmaster = theme.tier === 'Grandmaster';

  return (
    <div 
      className={`relative flex items-center justify-center shrink-0 rounded-[28%] overflow-hidden ${className} ${isGrandmaster ? 'animate-gm-pulse' : ''}`}
      style={{ 
        background: `radial-gradient(circle at top left, var(--tier-accent) 0%, rgba(0,0,0,0.8) 150%)`,
        boxShadow: TIER_GLOW_MAPPING[theme.tier] || TIER_GLOW_MAPPING.Bronze,
        transition: 'background 1.2s ease, box-shadow 1.2s ease'
      }}
    >
      <div className="absolute inset-0 bg-black/20 mix-blend-multiply" />
      <div className="absolute inset-0 ring-1 ring-white/20 inset-ring rounded-[28%]" />
      <div className="relative z-10 flex items-center justify-center w-full h-full">
        {renderIcon()}
      </div>
    </div>
  );
}
