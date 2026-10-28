/**
 * Study.io - Official Monthly Ranked System Specification (V2 - Rebalanced Curve)
 * 
 * 1. Base Conversion:
 *    - 1 Hour of Focus   = 100 RP (Rank Points)
 *    - 1 Minute of Focus = ~1.67 RP (100 / 60)
 *    - 1 Second of Focus = ~0.0278 RP (1 / 36 RP)
 * 
 * 2. Unified Monthly Formula:
 *    Season RP = Carryover RP + Math.floor(Current Month Focus Seconds / 36)
 * 
 * 3. Master Rank Progression & Soft Reset:
 *    - Fast Early Climb (Bronze I -> Silver IV): 1h to 5h per division (0h to 20h total, 0 to 2,799 RP)
 *    - Steep Competitive Grind (Gold I -> Grandmaster): 8h to 55h per tier (28h to 400h+ total, 2,800 to 40,000+ RP)
 *    - Hard Reset Cap strictly enforced at 26,000 RP (Diamond IV)
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
  minHours: number;
  minRP: number;
  maxRP: number;
  softResetRP: number;
  softResetRank?: string;
  imagePath?: string;
  badgeAccent: string;
  badgeSecondary: string;
  glowColor: string;
  metallicGradient: string;
  borderGlow: string;
  wingsAccent: string;
}

export const HARD_RESET_CAP_RP = 26000;

export const RANK_TIERS: RankTierConfig[] = [
  // Bronze: 0 – 799 RP
  {
    tier: 'Bronze',
    division: 'I',
    fullTitle: 'BRONZE I',
    minHours: 0,
    minRP: 0,
    maxRP: 100,
    softResetRP: 0,
    softResetRank: 'BRONZE I',
    imagePath: '/images/ranks/bronze-1.png',
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
    minHours: 1,
    minRP: 100,
    maxRP: 300,
    softResetRP: 0,
    softResetRank: 'BRONZE I',
    imagePath: '/images/ranks/bronze-2.png',
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
    minHours: 3,
    minRP: 300,
    maxRP: 500,
    softResetRP: 100,
    softResetRank: 'BRONZE II',
    imagePath: '/images/ranks/bronze-3.png',
    badgeAccent: '#F59E0B',
    badgeSecondary: '#B45309',
    glowColor: 'rgba(245, 158, 11, 0.5)',
    metallicGradient: 'from-amber-400 via-yellow-200 to-amber-600',
    borderGlow: 'border-amber-500/50',
    wingsAccent: '#F59E0B',
  },
  {
    tier: 'Bronze',
    division: 'IV',
    fullTitle: 'BRONZE IV',
    minHours: 5,
    minRP: 500,
    maxRP: 800,
    softResetRP: 300,
    softResetRank: 'BRONZE III',
    imagePath: '/images/ranks/bronze-4.png',
    badgeAccent: '#F59E0B',
    badgeSecondary: '#B45309',
    glowColor: 'rgba(245, 158, 11, 0.55)',
    metallicGradient: 'from-amber-400 via-yellow-200 to-amber-600',
    borderGlow: 'border-amber-500/50',
    wingsAccent: '#F59E0B',
  },

  // Silver: 800 – 2,799 RP
  {
    tier: 'Silver',
    division: 'I',
    fullTitle: 'SILVER I',
    minHours: 8,
    minRP: 800,
    maxRP: 1100,
    softResetRP: 500,
    softResetRank: 'BRONZE IV',
    imagePath: '/images/ranks/silver-1.png',
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
    minHours: 11,
    minRP: 1100,
    maxRP: 1500,
    softResetRP: 800,
    softResetRank: 'SILVER I',
    imagePath: '/images/ranks/silver-2.png',
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
    minHours: 15,
    minRP: 1500,
    maxRP: 2000,
    softResetRP: 1100,
    softResetRank: 'SILVER II',
    imagePath: '/images/ranks/silver-3.png',
    badgeAccent: '#E2E8F0',
    badgeSecondary: '#94A3B8',
    glowColor: 'rgba(226, 232, 240, 0.5)',
    metallicGradient: 'from-slate-100 via-white to-slate-300',
    borderGlow: 'border-cyan-200/50',
    wingsAccent: '#F8FAFC',
  },
  {
    tier: 'Silver',
    division: 'IV',
    fullTitle: 'SILVER IV',
    minHours: 20,
    minRP: 2000,
    maxRP: 2800,
    softResetRP: 1500,
    softResetRank: 'SILVER III',
    imagePath: '/images/ranks/silver-4.png',
    badgeAccent: '#E2E8F0',
    badgeSecondary: '#94A3B8',
    glowColor: 'rgba(226, 232, 240, 0.55)',
    metallicGradient: 'from-slate-100 via-white to-slate-300',
    borderGlow: 'border-cyan-200/50',
    wingsAccent: '#F8FAFC',
  },

  // Gold: 2,800 – 7,999 RP
  {
    tier: 'Gold',
    division: 'I',
    fullTitle: 'GOLD I',
    minHours: 28,
    minRP: 2800,
    maxRP: 3800,
    softResetRP: 1500,
    softResetRank: 'SILVER III',
    imagePath: '/images/ranks/gold-1.png',
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
    minHours: 38,
    minRP: 3800,
    maxRP: 5000,
    softResetRP: 2000,
    softResetRank: 'SILVER IV',
    imagePath: '/images/ranks/gold-2.png',
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
    minHours: 50,
    minRP: 5000,
    maxRP: 6400,
    softResetRP: 2800,
    softResetRank: 'GOLD I',
    imagePath: '/images/ranks/gold-3.png',
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
    minHours: 64,
    minRP: 6400,
    maxRP: 8000,
    softResetRP: 3800,
    softResetRank: 'GOLD II',
    imagePath: '/images/ranks/gold-4.png',
    badgeAccent: '#FBBF24',
    badgeSecondary: '#B45309',
    glowColor: 'rgba(251, 191, 36, 0.65)',
    metallicGradient: 'from-amber-200 via-yellow-100 to-amber-400',
    borderGlow: 'border-yellow-400/80',
    wingsAccent: '#FEF08A',
  },

  // Platinum: 8,000 – 16,499 RP
  {
    tier: 'Platinum',
    division: 'I',
    fullTitle: 'PLATINUM I',
    minHours: 80,
    minRP: 8000,
    maxRP: 9800,
    softResetRP: 5000,
    softResetRank: 'GOLD III',
    imagePath: '/images/ranks/platinum-1.png',
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
    minHours: 98,
    minRP: 9800,
    maxRP: 11800,
    softResetRP: 6400,
    softResetRank: 'GOLD IV',
    imagePath: '/images/ranks/platinum-2.png',
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
    minHours: 118,
    minRP: 11800,
    maxRP: 14000,
    softResetRP: 8000,
    softResetRank: 'PLATINUM I',
    imagePath: '/images/ranks/platinum-3.png',
    badgeAccent: '#0EA5E9',
    badgeSecondary: '#0369A1',
    glowColor: 'rgba(14px, 165, 233, 0.65)',
    metallicGradient: 'from-sky-300 via-cyan-100 to-blue-500',
    borderGlow: 'border-sky-400/70',
    wingsAccent: '#67E8F9',
  },
  {
    tier: 'Platinum',
    division: 'IV',
    fullTitle: 'PLATINUM IV',
    minHours: 140,
    minRP: 14000,
    maxRP: 16500,
    softResetRP: 9800,
    softResetRank: 'PLATINUM II',
    imagePath: '/images/ranks/platinum-4.png',
    badgeAccent: '#38BDF8',
    badgeSecondary: '#0284C7',
    glowColor: 'rgba(56, 189, 248, 0.7)',
    metallicGradient: 'from-cyan-200 via-white to-sky-400',
    borderGlow: 'border-cyan-300/80',
    wingsAccent: '#A5F3FC',
  },

  // Diamond: 16,500 – 29,999 RP
  {
    tier: 'Diamond',
    division: 'I',
    fullTitle: 'DIAMOND I',
    minHours: 165,
    minRP: 16500,
    maxRP: 19300,
    softResetRP: 11800,
    softResetRank: 'PLATINUM III',
    imagePath: '/images/ranks/diamond-1.png',
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
    minHours: 193,
    minRP: 19300,
    maxRP: 22500,
    softResetRP: 14000,
    softResetRank: 'PLATINUM IV',
    imagePath: '/images/ranks/diamond-2.png',
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
    minHours: 225,
    minRP: 22500,
    maxRP: 26000,
    softResetRP: 16500,
    softResetRank: 'DIAMOND I',
    imagePath: '/images/ranks/diamond-3.png',
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
    minHours: 260,
    minRP: 26000,
    maxRP: 30000,
    softResetRP: 19300,
    softResetRank: 'DIAMOND II',
    imagePath: '/images/ranks/diamond-4.png',
    badgeAccent: '#E879F9',
    badgeSecondary: '#A21CAF',
    glowColor: 'rgba(232, 121, 249, 0.75)',
    metallicGradient: 'from-fuchsia-200 via-pink-100 to-purple-400',
    borderGlow: 'border-fuchsia-300/85',
    wingsAccent: '#F5D0FE',
  },

  // Champion: 30,000 – 34,499 RP
  {
    tier: 'Champion',
    division: '',
    fullTitle: 'CHAMPION',
    minHours: 300,
    minRP: 30000,
    maxRP: 34500,
    softResetRP: 22500,
    softResetRank: 'DIAMOND III',
    imagePath: '/images/ranks/champion.png',
    badgeAccent: '#B24FE8',
    badgeSecondary: '#7B35B8',
    glowColor: 'rgba(178, 79, 232, 0.8)',
    metallicGradient: 'from-purple-500 via-fuchsia-200 to-fuchsia-700',
    borderGlow: 'border-purple-500/80',
    wingsAccent: '#D2A4FB',
  },

  // Master: 34,500 – 39,999 RP
  {
    tier: 'Master',
    division: '',
    fullTitle: 'MASTER',
    minHours: 345,
    minRP: 34500,
    maxRP: 40000,
    softResetRP: 26000,
    softResetRank: 'DIAMOND IV',
    imagePath: '/images/ranks/master.png',
    badgeAccent: '#5B4FE8',
    badgeSecondary: '#4135B3',
    glowColor: 'rgba(91, 79, 232, 0.85)',
    metallicGradient: 'from-indigo-500 via-blue-200 to-indigo-700',
    borderGlow: 'border-indigo-500/80',
    wingsAccent: '#9F8FFC',
  },

  // Grandmaster: 40,000+ RP
  {
    tier: 'Grandmaster',
    division: '',
    fullTitle: 'GRANDMASTER',
    minHours: 400,
    minRP: 40000,
    maxRP: 50000,
    softResetRP: 26000,
    softResetRank: 'DIAMOND IV',
    imagePath: '/images/ranks/grandmaster.png',
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
  const maxRP = nextConfig ? nextConfig.minRP : matchedConfig.maxRP;
  const rpInTier = safeRP - minRP;
  const rpNeededInTier = Math.max(1, maxRP - minRP);
  const progressPercent = Math.min(100, Math.max(0, (rpInTier / rpNeededInTier) * 100));
  const isMaxTier = matchedConfig.tier === 'Grandmaster';
  const nextTierTitle = nextConfig ? nextConfig.fullTitle : 'MAX RANK REACHED';

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

/** Minimum session duration (in seconds) required to earn RP (1 minute = 60s) */
export const MIN_RANKED_SESSION_SECONDS = 60;

export interface CalculateSessionRPOptions {
  hasStreakOrGoal?: boolean;
  hasCompletedTask?: boolean;
  lastStreakBonusDate?: string | null;
  todayString?: string;
}

/**
 * Calculate post-match RP rewards breakdown
 * V2 Unified Progression:
 * 1 Hour of Focus   = 100 RP
 * 1 Minute of Focus = ~1.67 RP (100 / 60)
 * 1 Second of Focus = 1 / 36 RP
 * - Under 60s (< 1 min): gained RP is 0, isUnderMinDuration: true
 * - >= 60s: Math.floor(safeDuration / 36)
 */
export function calculateSessionRP(
  durationSeconds: number,
  options?: CalculateSessionRPOptions
) {
  const safeDuration = Math.max(0, durationSeconds || 0);
  const isUnderMinDuration = safeDuration < MIN_RANKED_SESSION_SECONDS;

  // 1. Enforce minimum session threshold (< 60s / 1 min)
  if (isUnderMinDuration) {
    return {
      sessionRP: 0,
      goalStreakBonus: 0,
      taskBonus: 0,
      totalGained: 0,
      durationSeconds: safeDuration,
      isUnderMinDuration: true,
      streakBonusClaimedToday: false,
    };
  }

  // 2. Base duration RP: 1 Hour = 100 RP -> Math.floor(safeDuration / 36)
  const sessionRP = Math.floor(safeDuration / 36);
  const totalGained = sessionRP;

  return {
    sessionRP,
    goalStreakBonus: 0,
    taskBonus: 0,
    totalGained,
    durationSeconds: safeDuration,
    isUnderMinDuration: false,
    streakBonusClaimedToday: false,
  };
}

/**
 * Calculate Monthly Soft Rank Reset
 * Strictly follows the V2 Master Soft Reset Table with 26,000 RP Hard Reset Cap
 */
export function calculateSeasonReset(previousRP: number): {
  newRP: number;
  previousTier: RankTierDetails;
  newTier: RankTierDetails;
} {
  const safeRP = Math.max(0, Math.round(previousRP || 0));
  const previousTier = getRankTier(safeRP);

  const carryover = previousTier.config.softResetRP ?? 0;
  // Strictly enforce Hard Reset Cap at 26,000 RP (Diamond IV)
  const newRP = Math.min(HARD_RESET_CAP_RP, carryover);
  const newTier = getRankTier(newRP);

  return {
    newRP,
    previousTier,
    newTier,
  };
}


/**
 * Get current season ID (e.g. "2026-10")
 */
export function getCurrentSeasonId(date: Date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Get previous completed season ID (e.g. "2026-09" when current is "2026-10")
 */
export function getPreviousSeasonId(date: Date = new Date()): string {
  const prevMonthDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - 1, 1));
  const year = prevMonthDate.getUTCFullYear();
  const month = String(prevMonthDate.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Compute strict UTC start and end timestamps for a season key (e.g. "2026-09")
 */
export function getSeasonUtcBoundaries(seasonKey: string): { start: Date; end: Date } {
  const parts = seasonKey.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
  return { start, end };
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

/**
 * Calculates RP needed to reach the next tier/division
 */
export function getNextTierGapInfo(currentRP: number): { nextTierTitle: string; rpNeeded: number } | null {
  const safeRP = Math.max(0, Math.round(currentRP || 0));
  const currentTier = getRankTier(safeRP);
  const currentIndex = RANK_TIERS.findIndex(t => t.fullTitle.toUpperCase() === currentTier.fullTitle.toUpperCase());
  if (currentIndex === -1 || currentIndex >= RANK_TIERS.length - 1) {
    return null;
  }
  const nextTier = RANK_TIERS[currentIndex + 1];
  const rpNeeded = Math.max(1, nextTier.minRP - safeRP);
  return {
    nextTierTitle: nextTier.fullTitle,
    rpNeeded,
  };
}

/**
 * Resolve rank badge image path from rank name/title (e.g. "Gold 2", "GOLD II", "Silver II")
 */
export function getRankBadgePath(rankTitleOrTier?: string): string {
  if (!rankTitleOrTier) return '/images/ranks/bronze-1.png';
  const str = rankTitleOrTier.trim();

  if (str.startsWith('/images/ranks/')) return str;
  if (str.startsWith('/ranks/')) {
    return str.replace('/ranks/', '/images/ranks/');
  }

  const clean = str.toLowerCase().replace(/_/g, ' ').replace(/-/g, ' ');

  // Direct match against RANK_TIERS fullTitle or tier
  const directMatch = RANK_TIERS.find(
    (t) =>
      t.fullTitle.toLowerCase() === clean ||
      t.tier.toLowerCase() === clean ||
      `${t.tier.toLowerCase()} ${t.division.toLowerCase()}`.trim() === clean
  );
  if (directMatch?.imagePath) return directMatch.imagePath;

  const romanToNum: Record<string, string> = {
    iv: '4',
    '4': '4',
    iii: '3',
    '3': '3',
    ii: '2',
    '2': '2',
    i: '1',
    '1': '1',
  };

  const tiers = [
    'grandmaster',
    'master',
    'champion',
    'diamond',
    'platinum',
    'gold',
    'silver',
    'bronze',
  ];

  for (const tier of tiers) {
    if (clean.includes(tier)) {
      if (['grandmaster', 'master', 'champion'].includes(tier)) {
        return `/images/ranks/${tier}.png`;
      }
      for (const [key, num] of Object.entries(romanToNum)) {
        const regex = new RegExp(`(^|\\s|-)(${key})($|\\s|-)`, 'i');
        if (regex.test(clean)) {
          return `/images/ranks/${tier}-${num}.png`;
        }
      }
      return `/images/ranks/${tier}-1.png`;
    }
  }

  return '/images/ranks/bronze-1.png';
}

/**
 * Resolve rank configuration by title or tier
 */
export function getRankConfigByTitle(rankTitleOrTier?: string): RankTierConfig {
  if (!rankTitleOrTier) return RANK_TIERS[0];
  const clean = rankTitleOrTier.trim().toLowerCase().replace(/_/g, ' ').replace(/-/g, ' ');

  // Direct match
  const directMatch = RANK_TIERS.find(
    (t) =>
      t.fullTitle.toLowerCase() === clean ||
      t.tier.toLowerCase() === clean ||
      `${t.tier.toLowerCase()} ${t.division.toLowerCase()}`.trim() === clean
  );
  if (directMatch) return directMatch;

  const numToRoman: Record<string, string> = {
    '1': 'i',
    '2': 'ii',
    '3': 'iii',
    '4': 'iv',
    'i': 'i',
    'ii': 'ii',
    'iii': 'iii',
    'iv': 'iv',
  };

  const tiers = [
    'grandmaster',
    'master',
    'champion',
    'diamond',
    'platinum',
    'gold',
    'silver',
    'bronze',
  ];

  for (const tier of tiers) {
    if (clean.includes(tier)) {
      if (['grandmaster', 'master', 'champion'].includes(tier)) {
        return RANK_TIERS.find((t) => t.tier.toLowerCase() === tier) || RANK_TIERS[0];
      }
      for (const [key, roman] of Object.entries(numToRoman)) {
        const regex = new RegExp(`(^|\\s|-)(${key})($|\\s|-)`, 'i');
        if (regex.test(clean)) {
          const match = RANK_TIERS.find(
            (t) => t.tier.toLowerCase() === tier && t.division.toLowerCase() === roman
          );
          if (match) return match;
        }
      }
      const defaultDiv = RANK_TIERS.find((t) => t.tier.toLowerCase() === tier);
      if (defaultDiv) return defaultDiv;
    }
  }

  return RANK_TIERS[0];
}

