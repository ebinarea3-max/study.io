import {
  RANK_TIERS as SYSTEM_RANK_TIERS,
  RankTierName,
  RankDivision,
  RankTierConfig,
  HARD_RESET_CAP_RP,
} from './rankedSystem';

export interface RankTier {
  tier: RankTierName;
  division: RankDivision;
  name: string;
  minRp: number;
  maxRp: number;
  minHours: number;
  softResetRp: number;
  softResetRank?: string;
  badge: string;
  imagePath: string;
}

export { HARD_RESET_CAP_RP };

function getBadgeFilename(config: RankTierConfig): string {
  if (config.imagePath) {
    return config.imagePath.replace('/images/ranks/', '').replace('/ranks/', '');
  }
  const tierLower = config.tier.toLowerCase();
  if (['champion', 'master', 'grandmaster'].includes(tierLower)) {
    return `${tierLower}.png`;
  }
  const divMap: Record<string, string> = {
    'I': '1', 'II': '2', 'III': '3', 'IV': '4',
    '1': '1', '2': '2', '3': '3', '4': '4',
  };
  const num = divMap[config.division] || '1';
  return `${tierLower}-${num}.png`;
}

export const RANK_TIERS: RankTier[] = SYSTEM_RANK_TIERS.map((cfg) => ({
  tier: cfg.tier,
  division: cfg.division,
  name: cfg.division ? `${cfg.tier} ${cfg.division}` : cfg.tier,
  minRp: cfg.minRP,
  maxRp: cfg.maxRP,
  minHours: cfg.minHours ?? Math.round(cfg.minRP / 100),
  softResetRp: cfg.softResetRP ?? 0,
  softResetRank: cfg.softResetRank,
  badge: getBadgeFilename(cfg),
  imagePath: cfg.imagePath || `/images/ranks/${getBadgeFilename(cfg)}`,
}));

/**
 * Unified Monthly Formula:
 * Season RP = Carryover RP + Math.floor(Current Month Focus Seconds / 36)
 * - 1 Hour of Focus   = 100 RP
 * - 1 Minute of Focus = ~1.67 RP (100 / 60)
 * - 1 Second of Focus = 1 / 36 RP
 * - Carryover RP is strictly capped at 26,000 RP (Diamond IV)
 */
export function calculateSeasonRp(currentMonthSeconds: number, carryoverRp: number = 0): number {
  const safeCarryover = Math.min(HARD_RESET_CAP_RP, Math.max(0, Math.round(carryoverRp || 0)));
  const earnedRp = Math.floor(Math.max(0, currentMonthSeconds) / 36);
  return safeCarryover + earnedRp;
}

/**
 * Single source of truth to evaluate RankTier from total/season RP
 */
export function getRankTier(totalRp: number): RankTier {
  const safeRp = Math.max(0, Math.round(totalRp || 0));
  for (let i = RANK_TIERS.length - 1; i >= 0; i--) {
    if (safeRp >= RANK_TIERS[i].minRp) {
      return RANK_TIERS[i];
    }
  }
  return RANK_TIERS[0];
}

export function getMaxRpForTier(tierName: string): number {
  if (!tierName) return 999999;
  const clean = tierName.trim().toLowerCase();
  const idx = RANK_TIERS.findIndex(
    r => r.name.toLowerCase() === clean ||
         (r.division === '' && r.tier.toLowerCase() === clean)
  );
  if (idx === -1 || idx === RANK_TIERS.length - 1) return 999999;
  return RANK_TIERS[idx + 1].minRp;
}

export function getNextTier(tierName: string): RankTier | null {
  if (!tierName) return null;
  const clean = tierName.trim().toLowerCase();
  const idx = RANK_TIERS.findIndex(
    r => r.name.toLowerCase() === clean ||
         (r.division === '' && r.tier.toLowerCase() === clean)
  );
  if (idx === -1 || idx === RANK_TIERS.length - 1) return null;
  return RANK_TIERS[idx + 1];
}

// Backwards compatibility aliases
export type { RankTierName, RankDivision };

export const RANKS = RANK_TIERS;
export const getRankFromRp = getRankTier;
export const calculateRpFromSeconds = (seconds: number) => calculateSeasonRp(seconds, 0);
export const getSoftResetRp = (rp: number) => getRankTier(rp).softResetRp;


