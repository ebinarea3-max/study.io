export type RankTierName = 
  | 'Bronze'
  | 'Silver'
  | 'Gold'
  | 'Platinum'
  | 'Diamond'
  | 'Heroic'
  | 'Grandmaster';

export interface RankThemePalette {
  tier: RankTierName;
  accent: string;       // Primary tier accent color
  accentRgb: string;    // R, G, B for rgba() usage
  accentHover: string;
  glow: string;
  border: string;
  surface: string;      // #14171D with subtle tier tint
  surfaceHigh: string;  // #1B2028 with subtle tint
  base: string;         // #0A0C10 base background
  gradient: string;
  badgeBg: string;
  textAccent: string;
}

export const RANK_THEMES: Record<RankTierName, RankThemePalette> = {
  Bronze: {
    tier: 'Bronze',
    accent: '#C97C3D',
    accentRgb: '201, 124, 61',
    accentHover: '#DB8B4B',
    glow: 'rgba(201, 124, 61, 0.35)',
    border: 'rgba(201, 124, 61, 0.28)',
    surface: '#14161B',
    surfaceHigh: '#1C1F26',
    base: '#0A0C10',
    gradient: 'linear-gradient(135deg, #C97C3D 0%, #E69D5E 50%, #9C5722 100%)',
    badgeBg: 'rgba(201, 124, 61, 0.14)',
    textAccent: '#EAA972',
  },
  Silver: {
    tier: 'Silver',
    accent: '#C4CDD6',
    accentRgb: '196, 205, 214',
    accentHover: '#DCE2E8',
    glow: 'rgba(196, 205, 214, 0.35)',
    border: 'rgba(196, 205, 214, 0.28)',
    surface: '#13161D',
    surfaceHigh: '#1B2028',
    base: '#0A0C10',
    gradient: 'linear-gradient(135deg, #C4CDD6 0%, #FFFFFF 50%, #8895A5 100%)',
    badgeBg: 'rgba(196, 205, 214, 0.14)',
    textAccent: '#E2E8F0',
  },
  Gold: {
    tier: 'Gold',
    accent: '#E8B923',
    accentRgb: '232, 185, 35',
    accentHover: '#F5C83C',
    glow: 'rgba(232, 185, 35, 0.38)',
    border: 'rgba(232, 185, 35, 0.30)',
    surface: '#15161A',
    surfaceHigh: '#1F2026',
    base: '#0A0C10',
    gradient: 'linear-gradient(135deg, #E8B923 0%, #FDE047 50%, #B4860B 100%)',
    badgeBg: 'rgba(232, 185, 35, 0.14)',
    textAccent: '#F6CF56',
  },
  Platinum: {
    tier: 'Platinum',
    accent: '#4FD8E8',
    accentRgb: '79, 216, 232',
    accentHover: '#6DE2F0',
    glow: 'rgba(79, 216, 232, 0.40)',
    border: 'rgba(79, 216, 232, 0.30)',
    surface: '#12171E',
    surfaceHigh: '#19222C',
    base: '#0A0C10',
    gradient: 'linear-gradient(135deg, #4FD8E8 0%, #A5F3FC 50%, #0891B2 100%)',
    badgeBg: 'rgba(79, 216, 232, 0.14)',
    textAccent: '#7BE7F4',
  },
  Diamond: {
    tier: 'Diamond',
    accent: '#4FD8E8',
    accentRgb: '79, 216, 232',
    accentHover: '#6DE2F0',
    glow: 'rgba(79, 216, 232, 0.40)',
    border: 'rgba(79, 216, 232, 0.30)',
    surface: '#12171E',
    surfaceHigh: '#19222C',
    base: '#0A0C10',
    gradient: 'linear-gradient(135deg, #4FD8E8 0%, #BAE6FD 50%, #0284C7 100%)',
    badgeBg: 'rgba(79, 216, 232, 0.14)',
    textAccent: '#7BE7F4',
  },
  Heroic: {
    tier: 'Heroic',
    accent: '#B24FE8',
    accentRgb: '178, 79, 232',
    accentHover: '#C46FF0',
    glow: 'rgba(178, 79, 232, 0.42)',
    border: 'rgba(178, 79, 232, 0.32)',
    surface: '#15141D',
    surfaceHigh: '#1F1C2A',
    base: '#0A0C10',
    gradient: 'linear-gradient(135deg, #B24FE8 0%, #E879F9 50%, #7E22CE 100%)',
    badgeBg: 'rgba(178, 79, 232, 0.15)',
    textAccent: '#D285F5',
  },
  Grandmaster: {
    tier: 'Grandmaster',
    accent: '#B24FE8',
    accentRgb: '178, 79, 232',
    accentHover: '#C46FF0',
    glow: 'rgba(178, 79, 232, 0.45)',
    border: 'rgba(178, 79, 232, 0.35)',
    surface: '#15141D',
    surfaceHigh: '#1F1C2A',
    base: '#0A0C10',
    gradient: 'linear-gradient(135deg, #B24FE8 0%, #F472B6 50%, #9333EA 100%)',
    badgeBg: 'rgba(178, 79, 232, 0.16)',
    textAccent: '#D285F5',
  },
};

export function getRankTheme(tier: string): RankThemePalette {
  const normalized = (tier.charAt(0).toUpperCase() + tier.slice(1).toLowerCase()) as RankTierName;
  return RANK_THEMES[normalized] || RANK_THEMES.Bronze;
}
