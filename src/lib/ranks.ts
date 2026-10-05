export interface RankTier {
  tier: RankTierName;
  division: RankDivision;
  name: string;
  minRp: number;
  minHours: number;
  softResetRp: number;
  badge: string;
}

export const RANK_TIERS: RankTier[] = [
  { tier: 'Bronze',      division: 'I',   name: 'Bronze I',      minRp: 0,      minHours: 0,   softResetRp: 0,     badge: 'bronze-1.png' },
  { tier: 'Bronze',      division: 'II',  name: 'Bronze II',     minRp: 300,    minHours: 3,   softResetRp: 100,   badge: 'bronze-2.png' },
  { tier: 'Bronze',      division: 'III', name: 'Bronze III',    minRp: 700,    minHours: 7,   softResetRp: 200,   badge: 'bronze-3.png' },
  { tier: 'Bronze',      division: 'IV',  name: 'Bronze IV',     minRp: 1200,   minHours: 12,  softResetRp: 300,   badge: 'bronze-4.png' },
  { tier: 'Silver',      division: 'I',   name: 'Silver I',      minRp: 1800,   minHours: 18,  softResetRp: 700,   badge: 'silver-1.png' },
  { tier: 'Silver',      division: 'II',  name: 'Silver II',     minRp: 2500,   minHours: 25,  softResetRp: 1200,  badge: 'silver-2.png' },
  { tier: 'Silver',      division: 'III', name: 'Silver III',    minRp: 3300,   minHours: 33,  softResetRp: 1800,  badge: 'silver-3.png' },
  { tier: 'Silver',      division: 'IV',  name: 'Silver IV',     minRp: 4200,   minHours: 42,  softResetRp: 2500,  badge: 'silver-4.png' },
  { tier: 'Gold',        division: 'I',   name: 'Gold I',        minRp: 5200,   minHours: 52,  softResetRp: 3300,  badge: 'gold-1.png' },
  { tier: 'Gold',        division: 'II',  name: 'Gold II',       minRp: 6300,   minHours: 63,  softResetRp: 4200,  badge: 'gold-2.png' },
  { tier: 'Gold',        division: 'III', name: 'Gold III',      minRp: 7500,   minHours: 75,  softResetRp: 5200,  badge: 'gold-3.png' },
  { tier: 'Gold',        division: 'IV',  name: 'Gold IV',       minRp: 8800,   minHours: 88,  softResetRp: 6300,  badge: 'gold-4.png' },
  { tier: 'Platinum',    division: 'I',   name: 'Platinum I',    minRp: 10200,  minHours: 102, softResetRp: 7500,  badge: 'platinum-1.png' },
  { tier: 'Platinum',    division: 'II',  name: 'Platinum II',   minRp: 11700,  minHours: 117, softResetRp: 8800,  badge: 'platinum-2.png' },
  { tier: 'Platinum',    division: 'III', name: 'Platinum III',  minRp: 13300,  minHours: 133, softResetRp: 10200, badge: 'platinum-3.png' },
  { tier: 'Platinum',    division: 'IV',  name: 'Platinum IV',   minRp: 15000,  minHours: 150, softResetRp: 11700, badge: 'platinum-4.png' },
  { tier: 'Diamond',     division: 'I',   name: 'Diamond I',     minRp: 17000,  minHours: 170, softResetRp: 13300, badge: 'diamond-1.png' },
  { tier: 'Diamond',     division: 'II',  name: 'Diamond II',    minRp: 19000,  minHours: 190, softResetRp: 15000, badge: 'diamond-2.png' },
  { tier: 'Diamond',     division: 'III', name: 'Diamond III',   minRp: 21200,  minHours: 212, softResetRp: 17000, badge: 'diamond-3.png' },
  { tier: 'Diamond',     division: 'IV',  name: 'Diamond IV',    minRp: 23600,  minHours: 236, softResetRp: 19000, badge: 'diamond-4.png' },
  { tier: 'Champion',    division: '',    name: 'Champion',      minRp: 26000,  minHours: 260, softResetRp: 21200, badge: 'champion.png' },
  { tier: 'Master',      division: '',    name: 'Master',        minRp: 29000,  minHours: 290, softResetRp: 23600, badge: 'master.png' },
  { tier: 'Grandmaster', division: '',    name: 'Grandmaster',   minRp: 33000,  minHours: 330, softResetRp: 23600, badge: 'grandmaster.png' },
];

export function calculateSeasonRp(currentMonthSeconds: number, carryoverRp: number = 0): number {
  const earnedRp = Math.floor(currentMonthSeconds / 36);
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
  const idx = RANK_TIERS.findIndex(r => r.name === tierName);
  if (idx === -1 || idx === RANK_TIERS.length - 1) return 999999;
  return RANK_TIERS[idx + 1].minRp;
}

export function getNextTier(tierName: string): RankTier | null {
  const idx = RANK_TIERS.findIndex(r => r.name === tierName);
  if (idx === -1 || idx === RANK_TIERS.length - 1) return null;
  return RANK_TIERS[idx + 1];
}

// Backwards compatibility aliases
export type RankTierName = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Champion' | 'Master' | 'Grandmaster';
export type RankDivision = 'I' | 'II' | 'III' | 'IV' | '';

export const RANKS = RANK_TIERS as RankTier[];
export const getRankFromRp = getRankTier;
export const calculateRpFromSeconds = (seconds: number) => calculateSeasonRp(seconds, 0);
export const getSoftResetRp = (rp: number) => getRankTier(rp).softResetRp;
