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
    accent: '#C98A4B',
    accentRgb: '201, 138, 75',
    accentHover: '#E09B58',
    glow: 'rgba(201, 138, 75, 0.35)',
    border: 'rgba(201, 138, 75, 0.28)',
    surface: '#14161B',
    surfaceHigh: '#1C1F26',
    base: '#0A0C10',
    gradient: 'linear-gradient(135deg, #C98A4B 0%, #EAA260 50%, #A66C35 100%)',
    badgeBg: 'rgba(201, 138, 75, 0.14)',
    textAccent: '#F3AD6C',
  },
  Silver: {
    tier: 'Silver',
    accent: '#A8B4C2',
    accentRgb: '168, 180, 194',
    accentHover: '#B9C6D6',
    glow: 'rgba(168, 180, 194, 0.35)',
    border: 'rgba(168, 180, 194, 0.28)',
    surface: '#13161D',
    surfaceHigh: '#1B2028',
    base: '#0A0C10',
    gradient: 'linear-gradient(135deg, #A8B4C2 0%, #FFFFFF 50%, #8391A0 100%)',
    badgeBg: 'rgba(168, 180, 194, 0.14)',
    textAccent: '#E0E8F0',
  },
  Gold: {
    tier: 'Gold',
    accent: '#D4A017',
    accentRgb: '212, 160, 23',
    accentHover: '#F0B61E',
    glow: 'rgba(212, 160, 23, 0.38)',
    border: 'rgba(212, 160, 23, 0.30)',
    surface: '#15161A',
    surfaceHigh: '#1F2026',
    base: '#0A0C10',
    gradient: 'linear-gradient(135deg, #D4A017 0%, #F8CC3E 50%, #A67B0E 100%)',
    badgeBg: 'rgba(212, 160, 23, 0.14)',
    textAccent: '#FBE270',
  },
  Platinum: {
    tier: 'Platinum',
    accent: '#38BFC4',
    accentRgb: '56, 191, 196',
    accentHover: '#46D6DB',
    glow: 'rgba(56, 191, 196, 0.40)',
    border: 'rgba(56, 191, 196, 0.30)',
    surface: '#12171E',
    surfaceHigh: '#19222C',
    base: '#0A0C10',
    gradient: 'linear-gradient(135deg, #38BFC4 0%, #87EAF0 50%, #1D9196 100%)',
    badgeBg: 'rgba(56, 191, 196, 0.14)',
    textAccent: '#68F1F6',
  },
  Diamond: {
    tier: 'Diamond',
    accent: '#6FA8DC',
    accentRgb: '111, 168, 220',
    accentHover: '#87BCF0',
    glow: 'rgba(111, 168, 220, 0.40)',
    border: 'rgba(111, 168, 220, 0.30)',
    surface: '#12171E',
    surfaceHigh: '#19222C',
    base: '#0A0C10',
    gradient: 'linear-gradient(135deg, #6FA8DC 0%, #A6D4FA 50%, #4684BB 100%)',
    badgeBg: 'rgba(111, 168, 220, 0.14)',
    textAccent: '#A1CFF8',
  },
  Heroic: {
    tier: 'Heroic',
    accent: '#5B4FE8',
    accentRgb: '91, 79, 232',
    accentHover: '#7366F5',
    glow: 'rgba(91, 79, 232, 0.42)',
    border: 'rgba(91, 79, 232, 0.32)',
    surface: '#15141D',
    surfaceHigh: '#1F1C2A',
    base: '#0A0C10',
    gradient: 'linear-gradient(135deg, #5B4FE8 0%, #9F8FFC 50%, #4135B3 100%)',
    badgeBg: 'rgba(91, 79, 232, 0.15)',
    textAccent: '#B2A4FB',
  },
  Grandmaster: {
    tier: 'Grandmaster',
    accent: '#5B4FE8',
    accentRgb: '91, 79, 232',
    accentHover: '#7366F5',
    glow: 'rgba(91, 79, 232, 0.45)',
    border: 'rgba(91, 79, 232, 0.35)',
    surface: '#15141D',
    surfaceHigh: '#1F1C2A',
    base: '#0A0C10',
    gradient: 'linear-gradient(135deg, #5B4FE8 0%, #F472B6 50%, #9333EA 100%)',
    badgeBg: 'rgba(91, 79, 232, 0.16)',
    textAccent: '#B2A4FB',
  },
};

export function getRankTheme(tier: string): RankThemePalette {
  const normalized = (tier.charAt(0).toUpperCase() + tier.slice(1).toLowerCase()) as RankTierName;
  return RANK_THEMES[normalized] || RANK_THEMES.Bronze;
}
