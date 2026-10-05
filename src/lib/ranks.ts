export type RankTierName = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Champion' | 'Master' | 'Grandmaster';
export type RankDivision = 'I' | 'II' | 'III' | 'IV' | '';

export interface RankTier {
  name: string;
  fullTitle: string;
  tier: RankTierName;
  division: RankDivision;
  badge: string;
  minRp: number;
  maxRp: number;
  resetRp: number;
  rp: number; // added dynamically
}

const RAW_RANKS = [
  { name: 'Bronze I', tier: 'Bronze', division: 'I', badge: '/images/ranks/bronze-1.png', minRp: 0, maxRp: 300, resetRp: 0 },
  { name: 'Bronze II', tier: 'Bronze', division: 'II', badge: '/images/ranks/bronze-2.png', minRp: 300, maxRp: 700, resetRp: 100 },
  { name: 'Bronze III', tier: 'Bronze', division: 'III', badge: '/images/ranks/bronze-3.png', minRp: 700, maxRp: 1200, resetRp: 200 },
  { name: 'Bronze IV', tier: 'Bronze', division: 'IV', badge: '/images/ranks/bronze-4.png', minRp: 1200, maxRp: 1800, resetRp: 300 },
  { name: 'Silver I', tier: 'Silver', division: 'I', badge: '/images/ranks/silver-1.png', minRp: 1800, maxRp: 2500, resetRp: 700 },
  { name: 'Silver II', tier: 'Silver', division: 'II', badge: '/images/ranks/silver-2.png', minRp: 2500, maxRp: 3300, resetRp: 1200 },
  { name: 'Silver III', tier: 'Silver', division: 'III', badge: '/images/ranks/silver-3.png', minRp: 3300, maxRp: 4200, resetRp: 1800 },
  { name: 'Silver IV', tier: 'Silver', division: 'IV', badge: '/images/ranks/silver-4.png', minRp: 4200, maxRp: 5200, resetRp: 2500 },
  { name: 'Gold I', tier: 'Gold', division: 'I', badge: '/images/ranks/gold-1.png', minRp: 5200, maxRp: 6300, resetRp: 3300 },
  { name: 'Gold II', tier: 'Gold', division: 'II', badge: '/images/ranks/gold-2.png', minRp: 6300, maxRp: 7500, resetRp: 4200 },
  { name: 'Gold III', tier: 'Gold', division: 'III', badge: '/images/ranks/gold-3.png', minRp: 7500, maxRp: 8800, resetRp: 5200 },
  { name: 'Gold IV', tier: 'Gold', division: 'IV', badge: '/images/ranks/gold-4.png', minRp: 8800, maxRp: 10200, resetRp: 6300 },
  { name: 'Platinum I', tier: 'Platinum', division: 'I', badge: '/images/ranks/platinum-1.png', minRp: 10200, maxRp: 11700, resetRp: 7500 },
  { name: 'Platinum II', tier: 'Platinum', division: 'II', badge: '/images/ranks/platinum-2.png', minRp: 11700, maxRp: 13300, resetRp: 8800 },
  { name: 'Platinum III', tier: 'Platinum', division: 'III', badge: '/images/ranks/platinum-3.png', minRp: 13300, maxRp: 15000, resetRp: 10200 },
  { name: 'Platinum IV', tier: 'Platinum', division: 'IV', badge: '/images/ranks/platinum-4.png', minRp: 15000, maxRp: 17000, resetRp: 11700 },
  { name: 'Diamond I', tier: 'Diamond', division: 'I', badge: '/images/ranks/diamond-1.png', minRp: 17000, maxRp: 19000, resetRp: 13300 },
  { name: 'Diamond II', tier: 'Diamond', division: 'II', badge: '/images/ranks/diamond-2.png', minRp: 19000, maxRp: 21200, resetRp: 15000 },
  { name: 'Diamond III', tier: 'Diamond', division: 'III', badge: '/images/ranks/diamond-3.png', minRp: 21200, maxRp: 23600, resetRp: 17000 },
  { name: 'Diamond IV', tier: 'Diamond', division: 'IV', badge: '/images/ranks/diamond-4.png', minRp: 23600, maxRp: 26000, resetRp: 19000 },
  { name: 'Champion', tier: 'Champion', division: '', badge: '/images/ranks/champion.png', minRp: 26000, maxRp: 29000, resetRp: 21200 },
  { name: 'Master', tier: 'Master', division: '', badge: '/images/ranks/master.png', minRp: 29000, maxRp: 33000, resetRp: 23600 },
  { name: 'Grandmaster', tier: 'Grandmaster', division: '', badge: '/images/ranks/grandmaster.png', minRp: 33000, maxRp: Infinity, resetRp: 23600 }
];

export const RANKS: RankTier[] = RAW_RANKS.map(r => ({
  ...r,
  fullTitle: r.name.toUpperCase(),
  tier: r.tier as RankTierName,
  division: r.division as RankDivision,
  rp: 0
}));

export function getRankFromRp(rp: number): RankTier {
  const currentRp = Math.max(0, rp);
  for (const rank of RANKS) {
    if (currentRp >= rank.minRp && currentRp < rank.maxRp) {
      return { ...rank, rp: currentRp };
    }
  }
  // Fallback to max rank
  return { ...RANKS[RANKS.length - 1], rp: currentRp };
}

export function getSoftResetRp(currentRp: number): number {
  const rank = getRankFromRp(currentRp);
  return rank.resetRp;
}

export function calculateRpFromSeconds(seconds: number): number {
  return Math.floor((seconds / 3600) * 100);
}
