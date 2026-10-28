'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, ArrowUp, ArrowDown } from 'lucide-react';
import { LeaderboardEntry } from '../../types';
import { RankCrestBadge } from '../common/RankCrestBadge';
import { RankTierName, RankDivision, getRankTier, RANKS, RankTier } from '../../lib/ranks';
import { getLevelFromLifetimeXP } from '../../lib/gamification';
import { FlairFrame } from '../../lib/flair';
import { AvatarFlairRing, FlairCrown } from '../common/FlairBadge';

export const TIER_COLORS: Record<string, string> = {
  Bronze: '#C98A4B',
  Silver: '#A8B4C2',
  Gold: '#D4A017',
  Platinum: '#38BFC4',
  Diamond: '#6FA8DC',
  Champion: '#B24FE8',
  Master: '#5B4FE8',
  Grandmaster: '#FF3366',
};

export function getTierColor(tier?: string): string {
  if (!tier) return '#71717a';
  const normalized = tier.charAt(0).toUpperCase() + tier.slice(1).toLowerCase();
  return TIER_COLORS[normalized] || '#71717a';
}

export function formatTierTitle(name?: string): string {
  if (!name) return 'Bronze I';
  return name
    .toLowerCase()
    .split(' ')
    .map((word) => {
      if (/^(i|ii|iii|iv|v)$/i.test(word)) {
        return word.toUpperCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

export function hexToRgba(hex: string, alpha: number): string {
  const clean = (hex || '').replace('#', '');
  if (clean.length === 6) {
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return `rgba(255, 255, 255, ${alpha})`;
}

export function parseHoursMinutes(totalSeconds: number) {
  const safe = Math.max(0, Math.round(totalSeconds || 0));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  return {
    h: String(hours),
    m: String(minutes).padStart(2, '0'),
    hNum: hours,
    mNum: minutes,
  };
}

interface LeaderboardRowProps {
  rank: number;
  row: LeaderboardEntry;
  isCurrentUser: boolean;
  topSeconds: number;
  hasAnyDelta: boolean;
  deltaInfo?: { delta: number; isNew: boolean };
  userRankName?: string;
  myRowRef?: React.Ref<HTMLDivElement>;
  index: number;
  shouldReduceMotion?: boolean;
  flairFrame?: FlairFrame | null;
}

export const LeaderboardRow = React.memo(function LeaderboardRow({
  rank,
  row,
  isCurrentUser,
  topSeconds,
  hasAnyDelta,
  deltaInfo,
  userRankName,
  myRowRef,
  index,
  shouldReduceMotion = false,
  flairFrame,
}: LeaderboardRowProps) {
  const [avatarError, setAvatarError] = useState(false);

  if (!row) return null;

  // Derive display values defensively
  const displayName = String(row.display_name || row.name || row.username || 'Scholar');
  const handle = row.username ? String(row.username) : displayName.toLowerCase().replace(/\s+/g, '');
  const level = row.level ?? getLevelFromLifetimeXP(Number(row.lifetime_xp) || 0);

  // Derive tier configuration strictly from Season RP and single source of truth
  const totalSecs = Math.max(0, Number(row.total_seconds) || 0);
  const carryoverRp = Math.min(26000, Number((row as any).carryover_rp ?? (row as any).season_base_rp ?? 0));
  const earnedRp = Math.floor(totalSecs / 36);
  const computedSeasonRp = carryoverRp + earnedRp;
  const explicitRp = Number((row as any).season_rp ?? (row as any).rp ?? 0);
  const bestRp = Math.max(computedSeasonRp, explicitRp);

  let tierConfig: RankTier = getRankTier(bestRp);
  try {
    const targetName = isCurrentUser && userRankName ? userRankName : row.rank_title;
    if (targetName) {
      const found = RANKS.find((r) => r.name.toUpperCase() === String(targetName).toUpperCase());
      if (found) {
        tierConfig = found;
      }
    }
  } catch {
    tierConfig = getRankTier(bestRp);
  }

  const tierColor = getTierColor(tierConfig?.tier);
  const formattedTier = formatTierTitle(tierConfig?.name);
  const { h, m } = parseHoursMinutes(totalSecs);

  // Proportional focus bar ratio: (row focus / top row focus) * 100%
  const safeTop = Math.max(0, Number(topSeconds) || 0);
  const barRatio = safeTop > 0 && totalSecs > 0 ? Math.min(100, Math.max(0, (totalSecs / safeTop) * 100)) : 0;

  // Stagger animation: first 12 rows only (30ms per item)
  const staggerDelay = shouldReduceMotion ? 0 : Math.min(index, 12) * 0.03;

  // Top 3 medal styling
  const isTop3 = rank <= 3;
  const isFirst = rank === 1;

  // Row wash for top 3
  const washGradient =
    rank === 1
      ? 'linear-gradient(90deg, rgba(212, 160, 23, 0.08) 0%, rgba(212, 160, 23, 0) 65%)'
      : rank === 2
      ? 'linear-gradient(90deg, rgba(168, 180, 194, 0.06) 0%, rgba(168, 180, 194, 0) 65%)'
      : rank === 3
      ? 'linear-gradient(90deg, rgba(201, 138, 75, 0.07) 0%, rgba(201, 138, 75, 0) 65%)'
      : undefined;

  // #1 row static soft glow
  const rankOneGlow = isFirst
    ? 'inset 0 1px 0 rgba(212, 160, 23, 0.12), inset 0 -1px 0 rgba(212, 160, 23, 0.06), 0 0 24px rgba(212, 160, 23, 0.04)'
    : undefined;

  const initialLetter = (displayName || 'S').trim().charAt(0).toUpperCase();

  return (
    <motion.div
      ref={isCurrentUser ? myRowRef : undefined}
      initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'tween', duration: 0.25, ease: 'easeOut', delay: staggerDelay }}
      className={`relative w-full overflow-hidden transition-colors duration-150 flex items-center justify-between px-4 sm:px-6 cursor-default border-l-2 ${
        isTop3 ? 'min-h-[72px] py-3.5' : 'min-h-[60px] py-2.5'
      } ${
        isCurrentUser
          ? 'border-l-amber-400 bg-fg/[0.04] hover:bg-fg/[0.06]'
          : 'border-l-transparent hover:bg-fg/[0.03]'
      }`}
      style={{
        backgroundImage: washGradient,
        boxShadow: rankOneGlow,
      }}
    >
      {/* Soft one-time shimmer when row first appears for flair entries */}
      {flairFrame && !shouldReduceMotion && (
        <motion.div
          initial={{ x: '-100%', opacity: 0 }}
          animate={{ x: '200%', opacity: [0, 0.4, 0] }}
          transition={{ duration: 1.2, delay: 0.15 + staggerDelay, ease: 'easeOut' }}
          className="absolute inset-0 pointer-events-none z-10 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
        />
      )}

      {/* Soft Proportional Focus Bar Behind Row */}
      {barRatio > 0 && (
        <motion.div
          initial={shouldReduceMotion ? { width: `${barRatio}%` } : { width: '0%' }}
          animate={{ width: `${barRatio}%` }}
          transition={{ type: 'tween', duration: 0.6, ease: 'easeOut' }}
          className="absolute inset-y-0 left-0 pointer-events-none z-0"
          style={{
            background: `linear-gradient(90deg, ${hexToRgba(tierColor, 0.12)} 0%, ${hexToRgba(tierColor, 0)} 100%)`,
          }}
        />
      )}

      {/* Row Content Overlay */}
      <div className="relative z-10 w-full flex items-center justify-between gap-3 sm:gap-4">
        {/* Left Section: Position + Delta + Avatar + Scholar Info */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
          {/* Position Rank Badge or Numeral */}
          <div className="flex items-center shrink-0">
            {rank === 1 ? (
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold text-amber-300 shrink-0"
                style={{
                  background: 'radial-gradient(circle at 35% 35%, rgba(212, 160, 23, 0.35) 0%, rgba(212, 160, 23, 0.08) 100%)',
                  border: '1px solid rgba(212, 160, 23, 0.45)',
                  boxShadow: '0 0 10px rgba(212, 160, 23, 0.15)',
                }}
              >
                1
              </div>
            ) : rank === 2 ? (
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold text-slate-200 shrink-0"
                style={{
                  background: 'radial-gradient(circle at 35% 35%, rgba(168, 180, 194, 0.35) 0%, rgba(168, 180, 194, 0.08) 100%)',
                  border: '1px solid rgba(168, 180, 194, 0.45)',
                  boxShadow: '0 0 10px rgba(168, 180, 194, 0.12)',
                }}
              >
                2
              </div>
            ) : rank === 3 ? (
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold text-amber-400 shrink-0"
                style={{
                  background: 'radial-gradient(circle at 35% 35%, rgba(201, 138, 75, 0.35) 0%, rgba(201, 138, 75, 0.08) 100%)',
                  border: '1px solid rgba(201, 138, 75, 0.45)',
                  boxShadow: '0 0 10px rgba(201, 138, 75, 0.12)',
                }}
              >
                3
              </div>
            ) : (
              <div className="w-7 h-7 flex items-center justify-center font-mono text-xs font-medium text-zinc-500 shrink-0">
                {rank}
              </div>
            )}

            {/* Rank Movement Delta (Only shown if any row has real delta) */}
            {hasAnyDelta && deltaInfo && deltaInfo.delta !== 0 && (
              <span
                className={`inline-flex items-center text-[10px] font-mono font-bold ml-1 ${
                  deltaInfo.delta > 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
                title={deltaInfo.delta > 0 ? `+${deltaInfo.delta}` : `${deltaInfo.delta}`}
              >
                {deltaInfo.delta > 0 ? (
                  <>
                    <ArrowUp className="w-3 h-3 stroke-[2.5]" />
                    <span className="hidden sm:inline">{deltaInfo.delta}</span>
                  </>
                ) : (
                  <>
                    <ArrowDown className="w-3 h-3 stroke-[2.5]" />
                    <span className="hidden sm:inline">{Math.abs(deltaInfo.delta)}</span>
                  </>
                )}
              </span>
            )}
          </div>

          {/* Avatar (40px ringed in tier colour or flair gradient) */}
          <AvatarFlairRing frame={flairFrame} size={40}>
            <div
              className="w-10 h-10 rounded-full flex-shrink-0 relative overflow-hidden bg-[#0c0e14] flex items-center justify-center shadow-sm"
              style={{
                border: flairFrame ? 'none' : `1.5px solid ${tierColor}`,
              }}
            >
              {row.avatar_url && !avatarError ? (
                <img
                  src={row.avatar_url}
                  alt={displayName}
                  className="w-full h-full object-cover rounded-full"
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center font-mono font-bold text-xs text-white"
                  style={{
                    background: `linear-gradient(135deg, ${hexToRgba(tierColor, 0.7)} 0%, #18181b 100%)`,
                  }}
                >
                  {initialLetter}
                </div>
              )}
            </div>
          </AvatarFlairRing>

          {/* Scholar Details */}
          <div className="flex flex-col min-w-0 justify-center">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-semibold text-[var(--text)] text-sm sm:text-base truncate" title={displayName}>
                {displayName}
              </span>
              {flairFrame && <FlairCrown frame={flairFrame} />}
              {rank === 1 && (
                <span title="Season Leader (#1)" className="inline-flex items-center">
                  <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0 fill-amber-400/30 inline" />
                </span>
              )}
              {isCurrentUser && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-amber-400/15 text-amber-300 border border-amber-400/30 shrink-0">
                  You
                </span>
              )}
            </div>
            <div className="text-xs text-[var(--text-dim)] font-mono truncate mt-0.5">
              @{handle}
              <span className="hidden sm:inline"> · Lv. {level}</span>
            </div>
          </div>
        </div>

        {/* Center/Right Section: Tier Crest + Sentence Case Title */}
        <div className="w-12 sm:w-36 flex items-center justify-center sm:justify-start gap-2.5 shrink-0">
          <RankCrestBadge
            tier={tierConfig.tier as RankTierName}
            division={tierConfig.division as RankDivision}
            size={36}
          />
          <span
            className="text-xs font-normal hidden sm:inline truncate"
            style={{ color: `color-mix(in srgb, ${tierColor} var(--tier-mix-percent, 100%), black)` }}
          >
            {formattedTier}
          </span>
        </div>

        {/* Right Section: Focus Time */}
        <div className="w-20 sm:w-28 text-right flex-shrink-0 font-mono">
          <span className="text-base sm:text-lg font-bold text-[var(--text)] tracking-tight">{h}</span>
          <span className="text-xs sm:text-sm text-[var(--text-dim)] font-normal ml-0.5 mr-1 sm:mr-1.5">h</span>
          <span className="text-base sm:text-lg font-bold text-[var(--text)] tracking-tight">{m}</span>
          <span className="text-xs sm:text-sm text-[var(--text-dim)] font-normal ml-0.5">m</span>
        </div>
      </div>
    </motion.div>
  );
});
LeaderboardRow.displayName = 'LeaderboardRow';
