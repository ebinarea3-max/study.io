/**
 * StudyPulse - Free Fire Ranked Season & RP Engine
 * 
 * Free Fire Rank Tiers & Divisions:
 * 1. Bronze: Bronze I (0-399), Bronze II (400-799), Bronze III (800-1199)
 * 2. Silver: Silver I (1200-1699), Silver II (1700-2199), Silver III (2200-2699)
 * 3. Gold: Gold I (2700-3299), Gold II (3300-3899), Gold III (3900-4499), Gold IV (4500-5099)
 * 4. Platinum: Platinum I (5100-5799), Platinum II (5800-6499), Platinum III (6500-7199), Platinum IV (7200-7899)
 * 5. Diamond: Diamond I (7900-8899), Diamond II (8900-9899), Diamond III (9900-10899), Diamond IV (10900-11999)
 * 6. Champion: 12000 - 16999
 * 7. Master: 17000 - 22999
 * 8. Grandmaster: 23000+
 * 
 * Monthly Soft-Reset Rules:
 * - Grandmaster / Master / Champion -> Gold II (3300 RP)
 * - Diamond (I - IV) -> Gold I (2700 RP)
 * - Platinum (I - IV) -> Silver II (1700 RP)
 * - Gold (I - IV) -> Silver I (1200 RP)
 * - Silver (I - III) -> Bronze II (400 RP)
 * - Bronze (I - III) -> Bronze I (0 RP)
 */

import { getLocalDateString } from './dateUtils';

export type RankTierName = 
  | 'Bronze'
  | 'Silver'
  | 'Gold'
  | 'Platinum'
  | 'Diamond'
  | 'Champion'
  | 'Master'
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
  // Bronze: 0 – 1,199 RP
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
    maxRP: 800,
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
    minRP: 800,
    maxRP: 1200,
    badgeAccent: '#F59E0B',
    badgeSecondary: '#B45309',
    glowColor: 'rgba(245, 158, 11, 0.5)',
    metallicGradient: 'from-amber-400 via-yellow-200 to-amber-600',
    borderGlow: 'border-amber-500/50',
    wingsAccent: '#F59E0B',
  },

  // Silver: 1,200 – 2,699 RP
  {
    tier: 'Silver',
    division: 'I',
    fullTitle: 'SILVER I',
    minRP: 1200,
    maxRP: 1700,
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
    minRP: 1700,
    maxRP: 2200,
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
    minRP: 2200,
    maxRP: 2700,
    badgeAccent: '#E2E8F0',
    badgeSecondary: '#94A3B8',
    glowColor: 'rgba(226, 232, 240, 0.5)',
    metallicGradient: 'from-slate-100 via-white to-slate-300',
    borderGlow: 'border-cyan-200/50',
    wingsAccent: '#F8FAFC',
  },

  // Gold: 2,700 – 5,099 RP
  {
    tier: 'Gold',
    division: 'I',
    fullTitle: 'GOLD I',
    minRP: 2700,
    maxRP: 3300,
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
    minRP: 3300,
    maxRP: 3900,
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
    minRP: 3900,
    maxRP: 4500,
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
    minRP: 4500,
    maxRP: 5100,
    badgeAccent: '#FBBF24',
    badgeSecondary: '#B45309',
    glowColor: 'rgba(251, 191, 36, 0.65)',
    metallicGradient: 'from-amber-200 via-yellow-100 to-amber-400',
    borderGlow: 'border-yellow-400/80',
    wingsAccent: '#FEF08A',
  },

  // Platinum: 5,100 – 7,899 RP
  {
    tier: 'Platinum',
    division: 'I',
    fullTitle: 'PLATINUM I',
    minRP: 5100,
    maxRP: 5800,
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
    minRP: 5800,
    maxRP: 6500,
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
    minRP: 6500,
    maxRP: 7200,
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
    minRP: 7200,
    maxRP: 7900,
    badgeAccent: '#38BDF8',
    badgeSecondary: '#0284C7',
    glowColor: 'rgba(56, 189, 248, 0.7)',
    metallicGradient: 'from-cyan-200 via-white to-sky-400',
    borderGlow: 'border-cyan-300/80',
    wingsAccent: '#A5F3FC',
  },

  // Diamond: 7,900 – 11,999 RP
  {
    tier: 'Diamond',
    division: 'I',
    fullTitle: 'DIAMOND I',
    minRP: 7900,
    maxRP: 8900,
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
    minRP: 8900,
    maxRP: 9900,
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
    minRP: 9900,
    maxRP: 10900,
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
    minRP: 10900,
    maxRP: 12000,
    badgeAccent: '#E879F9',
    badgeSecondary: '#A21CAF',
    glowColor: 'rgba(232, 121, 249, 0.75)',
    metallicGradient: 'from-fuchsia-200 via-pink-100 to-purple-400',
    borderGlow: 'border-fuchsia-300/85',
    wingsAccent: '#F5D0FE',
  },

  // Champion: 12,000 – 16,999 RP
  {
    tier: 'Champion',
    division: '',
    fullTitle: 'CHAMPION',
    minRP: 12000,
    maxRP: 17000,
    badgeAccent: '#B24FE8',
    badgeSecondary: '#7B35B8',
    glowColor: 'rgba(178, 79, 232, 0.8)',
    metallicGradient: 'from-purple-500 via-fuchsia-200 to-fuchsia-700',
    borderGlow: 'border-purple-500/80',
    wingsAccent: '#D2A4FB',
  },

  // Master: 17,000 – 22,999 RP
  {
    tier: 'Master',
    division: '',
    fullTitle: 'MASTER',
    minRP: 17000,
    maxRP: 23000,
    badgeAccent: '#5B4FE8',
    badgeSecondary: '#4135B3',
    glowColor: 'rgba(91, 79, 232, 0.85)',
    metallicGradient: 'from-indigo-500 via-blue-200 to-indigo-700',
    borderGlow: 'border-indigo-500/80',
    wingsAccent: '#9F8FFC',
  },

  // Grandmaster: 23,000+ RP
  {
    tier: 'Grandmaster',
    division: '',
    fullTitle: 'GRANDMASTER',
    minRP: 23000,
    maxRP: 30000,
    badgeAccent: '#FF3366',
    badgeSecondary: '#B81840',
    glowColor: 'rgba(255, 51, 102, 0.9)',
    metallicGradient: 'from-rose-500 via-pink-200 to-red-600',
    borderGlow: 'border-rose-500/90',
    wingsAccent: '#FF8AAB',
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

/** Minimum session duration (in seconds) required to earn RP and bonuses (5 minutes) */
export const MIN_RANKED_SESSION_SECONDS = 300;

export interface CalculateSessionRPOptions {
  hasStreakOrGoal?: boolean;
  hasCompletedTask?: boolean;
  lastStreakBonusDate?: string | null;
  todayString?: string;
}

/**
 * Calculate post-match RP rewards breakdown
 * Anti-Exploit Rules:
 * 1. Minimum Duration Threshold:
 *    - If durationSeconds < 300 (less than 5 minutes):
 *      * Award 0 RP for duration and 0 RP for streak/task bonuses (totalGained: 0)
 *      * Preserves durationSeconds for history/tracking, but eliminates 1-second rank farming.
 * 2. Daily Streak Bonus Restriction:
 *    - +50 RP streak bonus is awarded ONLY IF:
 *      * session meets the 5-minute threshold (>= 300s)
 *      * user has an active streak or reached daily goal
 *      * user has not already claimed the streak bonus today (lastStreakBonusDate !== todayString)
 */
export function calculateSessionRP(
  durationSeconds: number,
  options?: CalculateSessionRPOptions
) {
  const safeDuration = Math.max(0, durationSeconds || 0);
  const today = options?.todayString || getLocalDateString(new Date());
  const alreadyClaimedToday = Boolean(options?.lastStreakBonusDate && options.lastStreakBonusDate === today);
  const meetsMinThreshold = safeDuration >= MIN_RANKED_SESSION_SECONDS;

  // 1. Enforce minimum session threshold for RP & bonuses (< 300s / 5 mins)
  if (!meetsMinThreshold) {
    return {
      sessionRP: 0,
      goalStreakBonus: 0,
      taskBonus: 0,
      totalGained: 0,
      durationSeconds: safeDuration,
      isUnderMinDuration: true,
      streakBonusClaimedToday: alreadyClaimedToday,
    };
  }

  // 2. Base duration RP: 10 RP per focused minute
  const focusedMinutes = safeDuration / 60;
  const sessionRP = Math.round(focusedMinutes * 10);

  // 3. Streak bonus: restricted to once per calendar day
  const eligibleForStreak = Boolean(options?.hasStreakOrGoal);
  const goalStreakBonus = eligibleForStreak && !alreadyClaimedToday ? 50 : 0;
  const streakBonusClaimedToday = alreadyClaimedToday;

  const taskBonus = options?.hasCompletedTask ? 10 : 0;
  const totalGained = sessionRP + goalStreakBonus + taskBonus;

  return {
    sessionRP,
    goalStreakBonus,
    taskBonus,
    totalGained,
    durationSeconds: safeDuration,
    isUnderMinDuration: false,
    streakBonusClaimedToday,
  };
}

/**
 * Calculate Free Fire Monthly Soft Rank Reset
 * Rules (Aligned with updated tier boundaries):
 * - Grandmaster / Master / Champion -> Gold II (3300 RP)
 * - Diamond (I - IV)     -> Gold I (2700 RP)
 * - Platinum (I - IV)    -> Silver II (1700 RP)
 * - Gold (I - IV)        -> Silver I (1200 RP)
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
    case 'Master':
    case 'Champion':
      newRP = 3300; // Gold II
      break;
    case 'Diamond':
      newRP = 2700; // Gold I
      break;
    case 'Platinum':
      newRP = 1700; // Silver II
      break;
    case 'Gold':
      newRP = 1200; // Silver I
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
