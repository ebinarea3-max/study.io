import React from 'react';
import { Flame, Shield, Star, Hexagon, Gem, Sparkles, Crown, Award, LucideProps } from 'lucide-react';
import { useRankTheme } from '../../hooks/useRankTheme';
import { getRankTheme, RankTierName } from '../../lib/rankTheme';

interface TierIconProps extends LucideProps {
  iconName?: string;
  tier?: string;
}

export function TierIcon({ iconName, tier, ...props }: TierIconProps) {
  const { theme } = useRankTheme();
  
  let name = iconName || theme.icon;
  if (tier) {
    name = getRankTheme(tier as RankTierName).icon;
  }

  switch (name) {
    case 'Flame': return <Flame {...props} />;
    case 'Shield': return <Shield {...props} />;
    case 'Star': return <Star {...props} />;
    case 'Hexagon': return <Hexagon {...props} />;
    case 'Gem': return <Gem {...props} />;
    case 'Sparkles': return <Sparkles {...props} />;
    case 'Crown': return <Crown {...props} />;
    case 'Award': return <Award {...props} />;
    default: return <Flame {...props} />;
  }
}
