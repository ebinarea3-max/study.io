/**
 * StudyPulse - Free Fire Ranked Season & RP Engine
 * 
 * Free Fire Rank Tiers & Divisions:
 * 1. Bronze: Bronze I (0-399), Bronze II (400-599), Bronze III (600-799)
 * 2. Silver: Silver I (800-999), Silver II (1000-1149), Silver III (1150-1299)
 * 3. Gold: Gold I (1300-1449), Gold II (1450-1599), Gold III (1600-1749), Gold IV (1750-1899)
 * 4. Platinum: Platinum I (1900-2099), Platinum II (2100-2299), Platinum III (2300-2499), Platinum IV (2500-2699)
 * 5. Diamond: Diamond I (2700-2899), Diamond II (2900-3099), Diamond III (3100-3299), Diamond IV (3300-3499)
 * 6. Heroic: 3500 - 4999
 * 7. Grandmaster: 5000+
 * 
 * Monthly Soft-Reset Rules:
 * - Grandmaster / Heroic -> Gold II (1500 RP)
 * - Diamond (I - IV) -> Gold I (1350 RP)
 * - Platinum (I - IV) -> Silver II (1000 RP)
 * - Gold (I - IV) -> Silver I (800 RP)
 * - Silver (I - III) -> Bronze II (400 RP)
 * - Bronze (I - III) -> Bronze I (0 RP)
 */

export type RankTierName = 
  | 'Bronze'
  | 'Silver'
  | 'Gold'
  | 'Platinum'
  | 'Diamond'
  | 'Heroic'
  | 'Grandmaster';

export type RankDivision = 'I' | 'II' | 'III' | 'IV' | '';

export interface RankTierConfig {
  tier: RankTierName;
  division: RankDivision;
  fullTitle: string;
  minRP: number;
  maxRP: number;
  badgeAccent: string;
  badgeSecondary: string;
  glowColor: string;
  metallicGradient: string;
  borderGlow: string;
  wingsAccent: string;
}

export const RANK_TIERS: RankTierConfig[] = [
  // Bronze
  {
    tier: 'Bronze',
    division: 'I',
    fullTitle: 'BRONZE I',
    minRP: 0,
    maxRP: 400,
    badgeAccent: '#D97706',
    badgeSecondary: '#92400E',
    glowColor: 'rgba(217, 119, 6, 0.4)',
    metallicGradient: 'from-amber-600 via-amber-400 to-yellow-700',
    borderGlow: 'border-amber-700/50',
    wingsAccent: '#B45309',
  },
  {
    tier: 'Bronze',
    division: 'II',
    fullTitle: 'BRONZE II',
    minRP: 400,
    maxRP: 600,
    badgeAccent: '#D97706',
    badgeSecondary: '#92400E',
    glowColor: 'rgba(217, 119, 6, 0.45)',
    metallicGradient: 'from-amber-500 via-amber-300 to-amber-700',
    borderGlow: 'border-amber-600/50',
    wingsAccent: '#D97706',
  },
  {
    tier: 'Bronze',
    division: 'III',
    fullTitle: 'BRONZE III',
    minRP: 600,
    maxRP: 800,
    badgeAccent: '#F59E0B',
    badgeSecondary: '#B45309',
    glowColor: 'rgba(245, 158, 11, 0.5)',
    metallicGradient: 'from-amber-400 via-yellow-200 to-amber-600',
    borderGlow: 'border-amber-500/50',
    wingsAccent: '#F59E0B',
  },

  // Silver
  {
    tier: 'Silver',
    division: 'I',
    fullTitle: 'SILVER I',
    minRP: 800,
    maxRP: 1000,
    badgeAccent: '#94A3B8',
    badgeSecondary: '#475569',
    glowColor: 'rgba(148, 163, 184, 0.4)',
    metallicGradient: 'from-slate-300 via-white to-slate-400',
    borderGlow: 'border-slate-400/50',
    wingsAccent: '#CBD5E1',
  },
  {
    tier: 'Silver',
    division: 'II',
    fullTitle: 'SILVER II',
    minRP: 1000,
    maxRP: 1150,
    badgeAccent: '#CBD5E1',
    badgeSecondary: '#64748B',
    glowColor: 'rgba(203, 213, 225, 0.45)',
    metallicGradient: 'from-slate-200 via-white to-slate-400',
    borderGlow: 'border-slate-300/60',
    wingsAccent: '#E2E8F0',
  },
  {
    tier: 'Silver',
    division: 'III',
    fullTitle: 'SILVER III',
    minRP: 1150,
    maxRP: 1300,
    badgeAccent: '#E2E8F0',
    badgeSecondary: '#94A3B8',
    glowColor: 'rgba(226, 232, 240, 0.5)',
    metallicGradient: 'from-slate-100 via-white to-slate-300',
    borderGlow: 'border-cyan-200/50',
    wingsAccent: '#F8FAFC',
  },

  // Gold
  {
    tier: 'Gold',
    division: 'I',
    fullTitle: 'GOLD I',
    minRP: 1300,
    maxRP: 1450,
    badgeAccent: '#EAB308',
    badgeSecondary: '#A16207',
    glowColor: 'rgba(234, 179, 8, 0.5)',
    metallicGradient: 'from-yellow-400 via-amber-200 to-yellow-600',
    borderGlow: 'border-yellow-500/60',
    wingsAccent: '#FACC15',
  },
  {
    tier: 'Gold',
    division: 'II',
    fullTitle: 'GOLD II',
    minRP: 1450,
    maxRP: 1600,
    badgeAccent: '#F59E0B',
    badgeSecondary: '#B45309',
    glowColor: 'rgba(245, 158, 11, 0.55)',
    metallicGradient: 'from-amber-300 via-yellow-100 to-amber-500',
    borderGlow: 'border-amber-400/60',
    wingsAccent: '#FBBF24',
  },
  {
    tier: 'Gold',
    division: 'III',
    fullTitle: 'GOLD III',
    minRP: 1600,
    maxRP: 1750,
    badgeAccent: '#F59E0B',
    badgeSecondary: '#D97706',
    glowColor: 'rgba(245, 158, 11, 0.6)',
    metallicGradient: 'from-yellow-300 via-white to-amber-400',
    borderGlow: 'border-amber-300/70',
    wingsAccent: '#FDE047',
  },
  {
    tier: 'Gold',
    division: 'IV',
    fullTitle: 'GOLD IV',
    minRP: 1750,
    maxRP: 1900,
    badgeAccent: '#FBBF24',
    badgeSecondary: '#B45309',
    glowColor: 'rgba(251, 191, 36, 0.65)',
    metallicGradient: 'from-amber-200 via-yellow-100 to-amber-400',
    borderGlow: 'border-yellow-400/80',
    wingsAccent: '#FEF08A',
  },

  // Platinum
  {
    tier: 'Platinum',
    division: 'I',
    fullTitle: 'PLATINUM I',
    minRP: 1900,
    maxRP: 2100,
    badgeAccent: '#06B6D4',
    badgeSecondary: '#0E7490',
    glowColor: 'rgba(6, 182, 212, 0.55)',
    metallicGradient: 'from-cyan-400 via-teal-100 to-cyan-600',
    borderGlow: 'border-cyan-400/60',
    wingsAccent: '#22D3EE',
  },
  {
    tier: 'Platinum',
    division: 'II',
    fullTitle: 'PLATINUM II',
    minRP: 2100,
    maxRP: 2300,
    badgeAccent: '#06B6D4',
    badgeSecondary: '#155E75',
    glowColor: 'rgba(6, 182, 212, 0.6)',
    metallicGradient: 'from-cyan-300 via-sky-100 to-teal-500',
    borderGlow: 'border-cyan-300/70',
    wingsAccent: '#38BDF8',
  },
  {
    tier: 'Platinum',
    division: 'III',
    fullTitle: 'PLATINUM III',
    minRP: 2300,
    maxRP: 2500,
    badgeAccent: '#0EA5E9',
    badgeSecondary: '#0369A1',
    glowColor: 'rgba(14, 165, 233, 0.65)',
    metallicGradient: 'from-sky-300 via-cyan-100 to-blue-500',
    borderGlow: 'border-sky-400/70',
    wingsAccent: '#67E8F9',
  },
  {
    tier: 'Platinum',
    division: 'IV',
    fullTitle: 'PLATINUM IV',
    minRP: 2500,
    maxRP: 2700,
    badgeAccent: '#38BDF8',
    badgeSecondary: '#0284C7',
    glowColor: 'rgba(56, 189, 248, 0.7)',
    metallicGradient: 'from-cyan-200 via-white to-sky-400',
    borderGlow: 'border-cyan-300/80',
    wingsAccent: '#A5F3FC',
  },

  // Diamond
  {
    tier: 'Diamond',
    division: 'I',
    fullTitle: 'DIAMOND I',
    minRP: 2700,
    maxRP: 2900,
    badgeAccent: '#A855F7',
    badgeSecondary: '#6B21A8',
    glowColor: 'rgba(168, 85, 247, 0.6)',
    metallicGradient: 'from-purple-400 via-fuchsia-100 to-indigo-600',
    borderGlow: 'border-purple-500/70',
    wingsAccent: '#C084FC',
  },
  {
    tier: 'Diamond',
    division: 'II',
    fullTitle: 'DIAMOND II',
    minRP: 2900,
    maxRP: 3100,
    badgeAccent: '#C084FC',
    badgeSecondary: '#7E22CE',
    glowColor: 'rgba(192, 132, 252, 0.65)',
    metallicGradient: 'from-purple-300 via-violet-100 to-purple-500',
    borderGlow: 'border-purple-400/75',
    wingsAccent: '#D8B4FE',
  },
  {
    tier: 'Diamond',
    division: 'III',
    fullTitle: 'DIAMOND III',
    minRP: 3100,
    maxRP: 3300,
    badgeAccent: '#D946EF',
    badgeSecondary: '#86198F',
    glowColor: 'rgba(217, 70, 239, 0.7)',
    metallicGradient: 'from-fuchsia-300 via-white to-purple-500',
    borderGlow: 'border-fuchsia-400/80',
    wingsAccent: '#F0ABFC',
  },
  {
    tier: 'Diamond',
    division: 'IV',
    fullTitle: 'DIAMOND IV',
    minRP: 3300,
    maxRP: 3500,
    badgeAccent: '#E879F9',
    badgeSecondary: '#A21CAF',
    glowColor: 'rgba(232, 121, 249, 0.75)',
    metallicGradient: 'from-fuchsia-200 via-pink-100 to-purple-400',
    borderGlow: 'border-fuchsia-300/85',
    wingsAccent: '#F5D0FE',
  },

  // Heroic
  {
    tier: 'Heroic',
    division: '',
    fullTitle: 'HEROIC',
    minRP: 3500,
    maxRP: 5000,
    badgeAccent: '#EF4444',
    badgeSecondary: '#991B1B',
    glowColor: 'rgba(239, 68, 68, 0.8)',
    metallicGradient: 'from-rose-500 via-red-200 to-red-700',
    borderGlow: 'border-red-500/80',
    wingsAccent: '#F87171',
  },

  // Grandmaster
  {
    tier: 'Grandmaster',
    division: '',
    fullTitle: 'GRANDMASTER',
    minRP: 5000,
    maxRP: 7000,
    badgeAccent: '#F97316',
    badgeSecondary: '#9A3412',
    glowColor: 'rgba(249, 115, 22, 0.9)',
    metallicGradient: 'from-amber-400 via-orange-200 to-red-600',
    borderGlow: 'border-orange-500/90',
    wingsAccent: '#FB923C',
  },
];

export interface RankTierDetails {
  config: RankTierConfig;
  tier: RankTierName;
  division: RankDivision;
  fullTitle: string;
  rp: number;
  minRP: number;
  maxRP: number;
  rpInTier: number;
  rpNeededInTier: number;
  progressPercent: number; // 0 to 100
  isMaxTier: boolean;
  nextTierTitle: string;
}

/**
 * Get the current rank tier details for a given total RP
 */
export function getRankTier(rp: number): RankTierDetails {
  const safeRP = Math.max(0, Math.round(rp || 0));

  // Find matching tier
  let matchedConfig = RANK_TIERS[0];
  let nextConfig: RankTierConfig | null = RANK_TIERS[1] || null;

  for (let i = 0; i < RANK_TIERS.length; i++) {
    const config = RANK_TIERS[i];
    if (safeRP >= config.minRP) {
      matchedConfig = config;
      nextConfig = i < RANK_TIERS.length - 1 ? RANK_TIERS[i + 1] : null;
    } else {
      break;
    }
  }

  const minRP = matchedConfig.minRP;
  const maxRP = matchedConfig.maxRP;
  const rpInTier = safeRP - minRP;
  const rpNeededInTier = Math.max(1, maxRP - minRP);
  const progressPercent = Math.min(100, Math.max(0, (rpInTier / rpNeededInTier) * 100));
  const isMaxTier = matchedConfig.tier === 'Grandmaster' && safeRP >= matchedConfig.maxRP;
  const nextTierTitle = nextConfig ? nextConfig.fullTitle : 'TOP LEADERBOARD';

  return {
    config: matchedConfig,
    tier: matchedConfig.tier,
    division: matchedConfig.division,
    fullTitle: matchedConfig.fullTitle,
    rp: safeRP,
    minRP,
    maxRP,
    rpInTier,
    rpNeededInTier,
    progressPercent,
    isMaxTier,
    nextTierTitle,
  };
}

/**
 * Calculate post-match RP rewards breakdown
 * - Study Duration: 10 RP per focused minute
 * - Goal / Streak Bonus: +50 RP
 * - Task Completion: +10 RP
 */
export function calculateSessionRP(
  durationSeconds: number,
  options?: {
    hasStreakOrGoal?: boolean;
    hasCompletedTask?: boolean;
  }
) {
  const safeDuration = Math.max(0, durationSeconds || 0);
  const focusedMinutes = safeDuration / 60;
  
  // 10 RP per focused minute. For short testing sessions >= 10s, award minimum 2 RP
  let sessionRP = Math.round(focusedMinutes * 10);
  if (sessionRP === 0 && safeDuration >= 10) {
    sessionRP = Math.max(2, Math.ceil(focusedMinutes * 10));
  }

  const goalStreakBonus = options?.hasStreakOrGoal ? 50 : 0;
  const taskBonus = options?.hasCompletedTask ? 10 : 0;
  const totalGained = sessionRP + goalStreakBonus + taskBonus;

  return {
    sessionRP,
    goalStreakBonus,
    taskBonus,
    totalGained,
    durationSeconds: safeDuration,
  };
}

/**
 * Calculate Free Fire Monthly Soft Rank Reset
 * Rules:
 * - Grandmaster / Heroic -> Gold II (1500 RP)
 * - Diamond (I - IV)     -> Gold I (1350 RP)
 * - Platinum (I - IV)    -> Silver II (1000 RP)
 * - Gold (I - IV)        -> Silver I (800 RP)
 * - Silver (I - III)     -> Bronze II (400 RP)
 * - Bronze (I - III)     -> Bronze I (0 RP)
 */
export function calculateSeasonReset(previousRP: number): {
  newRP: number;
  previousTier: RankTierDetails;
  newTier: RankTierDetails;
} {
  const safeRP = Math.max(0, Math.round(previousRP || 0));
  const previousTier = getRankTier(safeRP);

  let newRP = 0;
  switch (previousTier.tier) {
    case 'Grandmaster':
    case 'Heroic':
      newRP = 1500; // Gold II
      break;
    case 'Diamond':
      newRP = 1350; // Gold I
      break;
    case 'Platinum':
      newRP = 1000; // Silver II
      break;
    case 'Gold':
      newRP = 800; // Silver I
      break;
    case 'Silver':
      newRP = 400; // Bronze II
      break;
    case 'Bronze':
    default:
      newRP = 0; // Bronze I
      break;
  }

  const newTier = getRankTier(newRP);

  return {
    newRP,
    previousTier,
    newTier,
  };
}

/**
 * Get current season ID (e.g. "2026-09")
 */
export function getCurrentSeasonId(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Human readable season title
 */
export function getSeasonDisplayName(seasonId: string): string {
  if (!seasonId || !seasonId.includes('-')) return 'Current Season';
  const [year, month] = seasonId.split('-');
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const mIndex = parseInt(month, 10) - 1;
  const monthName = monthNames[mIndex] || month;
  return `Season ${monthName} ${year}`;
}
