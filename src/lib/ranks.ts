import {
  RANK_TIERS as SYSTEM_RANK_TIERS,
  RankTierName,
  RankDivision,
  RankTierConfig,
} from './rankedSystem';

export interface RankTier {
  tier: RankTierName;
  division: RankDivision;
  name: string;
  minRp: number;
  minHours: number;
  softResetRp: number;
  badge: string;
}

const SOFT_RESET_MAP: Record<RankTierName, number> = {
  Grandmaster: 3300,
  Master: 3300,
  Champion: 3300,
  Diamond: 2700,
  Platinum: 1260,
  Gold: 900,
  Silver: 180,
  Bronze: 0,
};

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
  minHours: Math.round(cfg.minRP / 60),
  softResetRp: SOFT_RESET_MAP[cfg.tier] ?? 0,
  badge: getBadgeFilename(cfg),
}));

export function calculateSeasonRp(currentMonthSeconds: number, carryoverRp: number = 0): number {
  const earnedRp = Math.floor(currentMonthSeconds / 60);
  return carryoverRp + earnedRp;
}

export function getRankTier(totalRp: number): RankTier {
  const safeRp = Math.max(0, totalRp);
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

