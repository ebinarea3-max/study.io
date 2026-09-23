import { RankTierName as SystemRankTierName } from './rankedSystem';

export type RankTierName = SystemRankTierName;

export interface RankThemePalette {
  tier: RankTierName;
  accent: string;
  glow: string;
  border: string;
  surface: string;
  bg: string; // The solid background color for badges/elements
  base: string; // The app background
  cardTexture: string; // CSS background for cards
  icon: string; // Lucide icon name
  // Legacy fields for backward compatibility where needed
  accentRgb: string;
  accentHover: string;
  surfaceHigh: string;
  gradient: string;
  badgeBg: string;
  textAccent: string;
}

export const RANK_THEMES: Record<RankTierName, RankThemePalette> = {
  Bronze: {
    tier: 'Bronze',
    accent: '#C98A4B',
    glow: 'rgba(201,138,75,0.30)',
    bg: '#12100D',
    base: '#12100D',
    surface: '#1B1712',
    border: 'rgba(255,255,255,0.06)',
    cardTexture: 'radial-gradient(circle at bottom left, rgba(201,138,75,0.03) 0%, transparent 50%)',
    icon: 'Flame',
    // Fallbacks
    accentRgb: '201, 138, 75',
    accentHover: '#E09B58',
    surfaceHigh: '#221D17',
    gradient: 'linear-gradient(135deg, #C98A4B 0%, #EAA260 50%, #A66C35 100%)',
    badgeBg: 'rgba(201, 138, 75, 0.14)',
    textAccent: '#F3AD6C',
  },
  Silver: {
    tier: 'Silver',
    accent: '#A8B4C2',
    glow: 'rgba(168,180,194,0.28)',
    bg: '#0E1013',
    base: '#0E1013',
    surface: '#171B20',
    border: 'rgba(255,255,255,0.07)',
    cardTexture: 'linear-gradient(135deg, rgba(168,180,194,0.02) 0%, transparent 100%)',
    icon: 'Shield',
    // Fallbacks
    accentRgb: '168, 180, 194',
    accentHover: '#B9C6D6',
    surfaceHigh: '#1E2329',
    gradient: 'linear-gradient(135deg, #A8B4C2 0%, #FFFFFF 50%, #8391A0 100%)',
    badgeBg: 'rgba(168, 180, 194, 0.14)',
    textAccent: '#E0E8F0',
  },
  Gold: {
    tier: 'Gold',
    accent: '#D4A017',
    glow: 'rgba(212,160,23,0.38)',
    bg: '#120E06',
    base: '#120E06',
    surface: '#1C1608',
    border: 'rgba(255,215,120,0.09)',
    cardTexture: 'radial-gradient(circle at top right, rgba(212,160,23,0.06) 0%, transparent 60%)',
    icon: 'Star',
    // Fallbacks
    accentRgb: '212, 160, 23',
    accentHover: '#F0B61E',
    surfaceHigh: '#241D0B',
    gradient: 'linear-gradient(135deg, #D4A017 0%, #F8CC3E 50%, #A67B0E 100%)',
    badgeBg: 'rgba(212, 160, 23, 0.14)',
    textAccent: '#FBE270',
  },
  Platinum: {
    tier: 'Platinum',
    accent: '#38BFC4',
    glow: 'rgba(56,191,196,0.35)',
    bg: '#070F10',
    base: '#070F10',
    surface: '#0F1B1C',
    border: 'rgba(120,220,225,0.10)',
    cardTexture: 'radial-gradient(circle at bottom left, rgba(56,191,196,0.07) 0%, transparent 40%)',
    icon: 'Hexagon',
    // Fallbacks
    accentRgb: '56, 191, 196',
    accentHover: '#46D6DB',
    surfaceHigh: '#132425',
    gradient: 'linear-gradient(135deg, #38BFC4 0%, #87EAF0 50%, #1D9196 100%)',
    badgeBg: 'rgba(56, 191, 196, 0.14)',
    textAccent: '#68F1F6',
  },
  Diamond: {
    tier: 'Diamond',
    accent: '#6FA8DC',
    glow: 'rgba(111,168,220,0.35)',
    bg: '#060A10',
    base: '#060A10',
    surface: '#0E1620',
    border: 'rgba(140,190,235,0.10)',
    cardTexture: 'repeating-linear-gradient(45deg, rgba(111,168,220,0.015) 0px, rgba(111,168,220,0.015) 1px, transparent 1px, transparent 12px)',
    icon: 'Gem',
    // Fallbacks
    accentRgb: '111, 168, 220',
    accentHover: '#87BCF0',
    surfaceHigh: '#121C29',
    gradient: 'linear-gradient(135deg, #6FA8DC 0%, #A6D4FA 50%, #4684BB 100%)',
    badgeBg: 'rgba(111, 168, 220, 0.14)',
    textAccent: '#A1CFF8',
  },
  Heroic: {
    tier: 'Heroic',
    accent: '#B24FE8',
    glow: 'rgba(178,79,232,0.42)',
    bg: '#0A0812',
    base: '#0A0812',
    surface: '#16121F',
    border: 'rgba(190,130,240,0.12)',
    cardTexture: 'radial-gradient(circle at top center, rgba(178,79,232,0.06) 0%, transparent 50%), radial-gradient(circle at bottom right, rgba(178,79,232,0.04) 0%, transparent 50%)',
    icon: 'Sparkles',
    // Fallbacks
    accentRgb: '178, 79, 232',
    accentHover: '#C46BFA',
    surfaceHigh: '#1C1729',
    gradient: 'linear-gradient(135deg, #B24FE8 0%, #E39CFF 50%, #7B35B8 100%)',
    badgeBg: 'rgba(178, 79, 232, 0.15)',
    textAccent: '#D2A4FB',
  },
  Master: {
    tier: 'Master',
    accent: '#5B4FE8',
    glow: 'rgba(91,79,232,0.45)',
    bg: '#08071A',
    base: '#08071A',
    surface: '#121130',
    border: 'rgba(140,130,255,0.13)',
    cardTexture: 'radial-gradient(ellipse at top center, rgba(91,79,232,0.08) 0%, transparent 60%), radial-gradient(circle at bottom left, rgba(91,79,232,0.05) 0%, transparent 40%)',
    icon: 'Crown',
    // Fallbacks
    accentRgb: '91, 79, 232',
    accentHover: '#7366F5',
    surfaceHigh: '#181740',
    gradient: 'linear-gradient(135deg, #5B4FE8 0%, #9F8FFC 50%, #4135B3 100%)',
    badgeBg: 'rgba(91, 79, 232, 0.15)',
    textAccent: '#B2A4FB',
  },
  Grandmaster: {
    tier: 'Grandmaster',
    accent: '#FF3366',
    glow: 'rgba(255,51,102,0.48)',
    bg: '#12060A',
    base: '#12060A',
    surface: '#1F0C12',
    border: 'rgba(255,100,140,0.14)',
    cardTexture: 'radial-gradient(circle at center, rgba(255,51,102,0.06) 0%, transparent 70%), radial-gradient(circle at top left, rgba(255,51,102,0.04) 0%, transparent 40%), radial-gradient(circle at bottom right, rgba(255,51,102,0.04) 0%, transparent 40%)',
    icon: 'Award',
    // Fallbacks
    accentRgb: '255, 51, 102',
    accentHover: '#FF5C85',
    surfaceHigh: '#281018',
    gradient: 'linear-gradient(135deg, #FF3366 0%, #FFA8C2 50%, #B81840 100%)',
    badgeBg: 'rgba(255, 51, 102, 0.16)',
    textAccent: '#FFB2C8',
  }
} as Record<RankTierName, RankThemePalette & { bg: string }>;

export function getRankTheme(tier: string): RankThemePalette {
  const normalized = (tier.charAt(0).toUpperCase() + tier.slice(1).toLowerCase()) as RankTierName;
  return RANK_THEMES[normalized] || RANK_THEMES.Bronze;
}
