'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useStudy } from '../../context/StudyContext';
import { getSupabase } from '../../lib/supabase';
import { getRankBadgePath, getRankTier, getRankConfigByTitle, RankTierName, RankDivision } from '../../lib/rankedSystem';
import { getLevelFromLifetimeXP } from '../../lib/gamification';
import { LeaderboardEntry } from '../../types';
import { Clock } from 'lucide-react';
import { soundFx } from '../../lib/audio';
import { RankCrestBadge } from '../common/RankCrestBadge';

export function formatStudyTime(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.round(totalSeconds || 0));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

function parseTimeHoursMinutes(totalSeconds: number) {
  const safe = Math.max(0, Math.round(totalSeconds || 0));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  return {
    h: String(hours).padStart(2, '0'),
    m: String(minutes).padStart(2, '0'),
    hNum: hours,
    mNum: minutes,
  };
}

/**
 * Animated number component for smooth dopamine count-up on load.
 */
function AnimatedDigit({
  target,
  durationMs = 800,
  delayMs = 0,
}: {
  target: number;
  durationMs?: number;
  delayMs?: number;
}) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    let animationFrameId: number;

    const timeoutId = setTimeout(() => {
      const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / durationMs, 1);
        const easeOut = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        const val = Math.floor(easeOut * target);
        setCurrent(val);

        if (progress < 1) {
          animationFrameId = requestAnimationFrame(step);
        } else {
          setCurrent(target);
        }
      };

      animationFrameId = requestAnimationFrame(step);
    }, delayMs);

    return () => {
      clearTimeout(timeoutId);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [target, durationMs, delayMs]);

  return <>{String(current).padStart(2, '0')}</>;
}

/**
 * Resolves the display rank tier label from row data.
 * Ensures valid 23-rank monthly tiers (e.g. "BRONZE I", "SILVER II", "GOLD I").
 */
export function getMonthlyRankTierTitle(rankTitle?: string, totalSeconds?: number): string {
  const clean = (rankTitle || '').trim().toLowerCase();

  const isScholarTitle =
    clean.includes('scholar') ||
    clean.includes('mind') ||
    clean.includes('inquirer') ||
    clean.includes('polymath') ||
    clean.includes('philosopher') ||
    clean.includes('archon') ||
    clean.includes('sage') ||
    clean.includes('myth');

  if (isScholarTitle || !clean) {
    const rpFromMinutes = totalSeconds ? Math.floor(totalSeconds / 60) : 0;
    return getRankTier(rpFromMinutes).fullTitle;
  }

  return getRankConfigByTitle(clean).fullTitle;
}

export type LeaderboardTimeframe = 'today' | 'week' | 'month' | 'all';

function getFilterStartDate(timeframe: LeaderboardTimeframe): Date | null {
  const now = new Date();
  if (timeframe === 'today') {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (timeframe === 'week') {
    const d = new Date(now);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (timeframe === 'month') {
    const d = new Date(now.getFullYear(), now.getMonth(), 1);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  return null;
}

function getTierAvatarGradient(tier: string): string {
  switch (tier.toLowerCase()) {
    case 'bronze':
      return 'from-amber-700 via-amber-800 to-stone-900';
    case 'silver':
      return 'from-slate-400 via-slate-600 to-zinc-900';
    case 'gold':
      return 'from-yellow-400 via-amber-500 to-stone-900';
    case 'platinum':
      return 'from-cyan-400 via-teal-600 to-zinc-900';
    case 'diamond':
      return 'from-purple-400 via-fuchsia-600 to-zinc-900';
    case 'champion':
      return 'from-fuchsia-500 via-purple-600 to-slate-900';
    case 'master':
      return 'from-indigo-400 via-blue-600 to-zinc-900';
    case 'grandmaster':
      return 'from-rose-500 via-red-600 to-zinc-900';
    default:
      return 'from-amber-600 via-amber-700 to-stone-900';
  }
}

function ScholarAvatar({
  name,
  avatarUrl,
  tier = 'Bronze',
  sizeClass = 'w-10 h-10 text-xs',
}: {
  name: string;
  avatarUrl?: string | null;
  tier?: string;
  sizeClass?: string;
}) {
  const initial = (name || 'S').trim().charAt(0).toUpperCase();
  const gradient = getTierAvatarGradient(tier);

  return (
    <div
      className={`${sizeClass} rounded-full overflow-hidden bg-[#0c0e14] flex-shrink-0 flex items-center justify-center relative shadow-md`}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          className="w-full h-full object-cover absolute inset-0"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      ) : null}
      <div
        className={`w-full h-full flex items-center justify-center font-mono font-bold bg-gradient-to-br ${gradient} text-white`}
      >
        {initial}
      </div>
    </div>
  );
}

interface RankSnapshot {
  timestamp: number;
  ranks: Record<string, number>;
}

function getRankDelta(
  userId: string,
  currentRank: number,
  timeframe: string
): { delta: number; isNew: boolean } {
  if (typeof window === 'undefined') return { delta: 0, isNew: false };
  try {
    const key = `studypulse_rank_snap_${timeframe}`;
    const raw = localStorage.getItem(key);
    if (!raw) return { delta: 0, isNew: true };
    const snapshot: RankSnapshot = JSON.parse(raw);
    if (!snapshot.ranks || typeof snapshot.ranks !== 'object') return { delta: 0, isNew: true };
    const prevRank = snapshot.ranks[userId];
    if (prevRank === undefined) return { delta: 0, isNew: true };
    return { delta: prevRank - currentRank, isNew: false };
  } catch {
    return { delta: 0, isNew: false };
  }
}

function saveRankSnapshot(entries: LeaderboardEntry[], timeframe: string) {
  if (typeof window === 'undefined' || entries.length === 0) return;
  try {
    const key = `studypulse_rank_snap_${timeframe}`;
    const existing = localStorage.getItem(key);
    if (existing) {
      const parsed = JSON.parse(existing);
      // Keep baseline for 2 hours so users see rank movement during active sessions
      if (Date.now() - parsed.timestamp < 2 * 60 * 60 * 1000) {
        return;
      }
    }
    const ranks: Record<string, number> = {};
    entries.forEach((e, i) => {
      ranks[e.user_id] = i + 1;
    });
    localStorage.setItem(key, JSON.stringify({ timestamp: Date.now(), ranks }));
  } catch {
    // Ignore quota issues
  }
}

interface MonthlyLeaderboardProps {
  isEmbedded?: boolean;
  isActiveTab?: boolean;
}

export function MonthlyLeaderboard({ isEmbedded = false, isActiveTab = true }: MonthlyLeaderboardProps) {
  const { user } = useAuth();
  const { sessions } = useStudy();

  const [timeframe, setTimeframe] = useState<LeaderboardTimeframe>('month');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [animationKey, setAnimationKey] = useState<number>(0);

  const userRef = useRef(user);
  userRef.current = user;

  const sessionsRef = useRef(sessions);
  sessionsRef.current = sessions;

  const inFlightRef = useRef(false);
  const hasPlayedRevealRef = useRef(false);

  // Compute seasonal tracker line and subtext dynamically based on timeframe
  const { trackerText, subtext, emptyText } = useMemo(() => {
    const now = new Date();
    const m = now.toLocaleString('en-US', { month: 'long' }).toUpperCase();
    const y = now.getFullYear();

    switch (timeframe) {
      case 'today':
        return {
          trackerText: '// DAILY STANDINGS',
          subtext: 'Rankings determined strictly by focus hours logged today.',
          emptyText: 'No sessions recorded today yet. Start the timer to claim #1!',
        };
      case 'week':
        return {
          trackerText: '// WEEKLY SPRINT',
          subtext: 'Rankings determined by focus hours logged this week.',
          emptyText: 'No sessions recorded this week yet. Start the timer to claim #1!',
        };
      case 'month':
        return {
          trackerText: `// SEASONAL STANDINGS · ${m} ${y}`,
          subtext: 'Rankings determined strictly by focus hours logged this calendar month.',
          emptyText: 'No sessions recorded this month yet. Start the timer to claim #1!',
        };
      case 'all':
        return {
          trackerText: '// HALL OF FAME · ALL-TIME',
          subtext: 'Rankings determined by total lifetime focus hours.',
          emptyText: 'No sessions recorded yet. Start the timer to claim #1!',
        };
    }
  }, [timeframe]);

  // Fetch leaderboard data based on selected timeframe
  const fetchLeaderboard = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    if (leaderboard.length === 0) {
      setIsLoading(true);
    }
    setIsFetching(true);

    const supabase = getSupabase();
    let entries: LeaderboardEntry[] = [];
    let rpcSucceeded = false;
    const currentUser = userRef.current;
    const currentSessions = sessionsRef.current;

    try {
      if (supabase) {
        try {
          let res = await supabase.rpc('get_leaderboard', { timeframe });
          if (res.error && timeframe === 'month') {
            res = await supabase.rpc('get_monthly_leaderboard');
          }

          if (!res.error && Array.isArray(res.data)) {
            rpcSucceeded = true;
            entries = res.data.map((row: any) => ({
              user_id: String(row.user_id),
              name: String(row.display_name || row.name || 'Scholar'),
              display_name: row.display_name || row.name || null,
              username: row.username ? String(row.username) : null,
              avatar_url: row.avatar_url ? String(row.avatar_url) : null,
              level: row.level ? Number(row.level) : undefined,
              lifetime_xp: Number(row.lifetime_xp || 0),
              rank_title: String(row.rank_title || 'Bronze I'),
              total_seconds: Number(row.total_seconds || 0),
              is_current_user: Boolean(row.is_current_user || (currentUser?.id && row.user_id === currentUser.id)),
            }));
          } else if (res.error) {
            console.warn('[Leaderboard] RPC get_leaderboard notice:', res.error.message);
          }
        } catch (err: any) {
          console.warn('[Leaderboard] RPC get_leaderboard call error:', err);
        }
      }

      // Fallback for local development or offline mode
      if (!rpcSucceeded) {
        try {
          if (supabase && currentUser?.id && !currentUser.id.startsWith('user-scholar')) {
            const filterStartDate = getFilterStartDate(timeframe);

            let query = supabase
              .from('study_sessions')
              .select('user_id, duration_seconds, started_at');

            if (filterStartDate) {
              query = query.gte('started_at', filterStartDate.toISOString());
            }

            const { data: dbSessions } = await query;

            if (dbSessions && dbSessions.length > 0) {
              const userTotals: Record<string, number> = {};
              dbSessions.forEach((s: any) => {
                if (s.user_id) {
                  userTotals[s.user_id] = (userTotals[s.user_id] || 0) + Number(s.duration_seconds || 0);
                }
              });

              const uids = Object.keys(userTotals);
              const { data: dbProfiles } = await supabase
                .from('profiles')
                .select('id, name, username, avatar_url, lifetime_xp, xp, rank_title, level')
                .in('id', uids);

              if (dbProfiles) {
                entries = dbProfiles.map((p: any) => ({
                  user_id: p.id,
                  name: p.name || 'Scholar',
                  display_name: p.name || 'Scholar',
                  username: p.username || null,
                  avatar_url: p.avatar_url || null,
                  level: p.level ? Number(p.level) : undefined,
                  lifetime_xp: Number(p.lifetime_xp ?? p.xp ?? 0),
                  rank_title: p.rank_title || 'Bronze I',
                  total_seconds: userTotals[p.id] || 0,
                  is_current_user: p.id === currentUser?.id,
                }));
                entries.sort((a, b) => b.total_seconds - a.total_seconds);
              }
            }
          }
        } catch (fallbackErr) {
          console.warn('[Leaderboard] Fallback query error:', fallbackErr);
        }

        if (entries.length === 0 && currentUser?.id) {
          const filterStartDate = getFilterStartDate(timeframe);
          const currentPeriodSeconds = currentSessions
            .filter((s) => !filterStartDate || new Date(s.startTime).getTime() >= filterStartDate.getTime())
            .reduce((sum, s) => sum + (s.durationSeconds || 0), 0);

          if (currentPeriodSeconds > 0) {
            entries = [
              {
                user_id: currentUser.id,
                name: currentUser.displayName || currentUser.name || 'You',
                display_name: currentUser.displayName || currentUser.name || 'You',
                username: currentUser.username || null,
                avatar_url: currentUser.avatarUrl || null,
                level: currentUser.level,
                lifetime_xp: Number(currentUser.lifetime_xp ?? currentUser.lifetimeXp ?? currentUser.xp ?? 0),
                rank_title: currentUser.rank_title || 'Bronze I',
                total_seconds: currentPeriodSeconds,
                is_current_user: true,
              },
            ];
          }
        }
      }

      setLeaderboard(entries);
      saveRankSnapshot(entries, timeframe);
      setAnimationKey((prev) => prev + 1);
    } finally {
      setIsLoading(false);
      setIsFetching(false);
      inFlightRef.current = false;
    }
  }, [timeframe]);

  useEffect(() => {
    if (isActiveTab) {
      fetchLeaderboard();
    }
  }, [fetchLeaderboard, isActiveTab]);

  const prevSessionsCountRef = useRef(sessions.length);
  useEffect(() => {
    if (sessions.length !== prevSessionsCountRef.current) {
      prevSessionsCountRef.current = sessions.length;
      if (isActiveTab) {
        fetchLeaderboard();
      }
    }
  }, [sessions.length, isActiveTab, fetchLeaderboard]);

  // Subtle rising chime sound on podium reveal
  useEffect(() => {
    if (!isLoading && leaderboard.length > 0 && !hasPlayedRevealRef.current) {
      hasPlayedRevealRef.current = true;
      const soundTimer = setTimeout(() => {
        soundFx.playPodiumReveal();
      }, 500);
      return () => clearTimeout(soundTimer);
    }
  }, [isLoading, leaderboard.length]);

  // Split #1 Hero Champion, #2 and #3 Runners-up, and #4+ Ranked List (limited to top 50)
  const { hero, top2, top3, contenders } = useMemo(() => {
    return {
      hero: leaderboard[0] || null,
      top2: leaderboard[1] || null,
      top3: leaderboard[2] || null,
      contenders: leaderboard.slice(3, 53),
    };
  }, [leaderboard]);

  const checkIsCurrentUser = useCallback(
    (row: LeaderboardEntry | null) => {
      if (!row) return false;
      return Boolean(
        row.is_current_user ||
          (user?.id && String(row.user_id) === String(user.id)) ||
          (user?.username && row.username && user.username.toLowerCase() === row.username.toLowerCase())
      );
    },
    [user?.id, user?.username]
  );

  return (
    <div
      className={`w-full text-white font-sans ${
        isEmbedded
          ? 'max-w-5xl mx-auto flex flex-col gap-6 py-4'
          : 'bg-[#05070a] min-h-screen p-4 sm:p-8 flex flex-col items-center'
      }`}
    >
      {/* Keyframe Animations */}
      <style>{`
        @keyframes podiumSlideUp {
          0% {
            opacity: 0;
            transform: translateY(24px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes championSlamIn {
          0% {
            opacity: 0;
            transform: translateY(28px) scale(1.08);
          }
          65% {
            opacity: 1;
            transform: translateY(-4px) scale(1.02);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1.0);
          }
        }

        @keyframes ambientGlowPulse {
          0%, 100% {
            opacity: 0.35;
            transform: scale(0.98);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.03);
          }
        }

        @keyframes borderLightSweep {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes listRowFadeSlide {
          0% {
            opacity: 0;
            transform: translateY(12px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <div className="w-full max-w-5xl flex flex-col gap-6 relative">
        {/* Loading State */}
        {isLoading ? (
          <div className="w-full flex flex-col gap-6">
            {/* Hero Skeleton */}
            <div className="w-full h-72 rounded-3xl border border-white/[0.06] bg-[#0c0e14] p-6 animate-pulse" />
            {/* Runners-up Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              <div className="h-32 rounded-2xl border border-white/[0.06] bg-[#0c0e14] animate-pulse" />
              <div className="h-32 rounded-2xl border border-white/[0.06] bg-[#0c0e14] animate-pulse" />
            </div>
            {/* Table Skeleton */}
            <div className="w-full bg-[#090c12]/90 border border-white/[0.07] rounded-xl overflow-hidden divide-y divide-white/[0.04]">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="px-6 py-3.5 flex items-center justify-between animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-4 bg-white/[0.05] rounded" />
                    <div className="w-9 h-9 rounded-full bg-white/[0.05]" />
                    <div className="w-28 h-4 bg-white/[0.05] rounded" />
                  </div>
                  <div className="w-20 h-4 bg-white/[0.05] rounded" />
                </div>
              ))}
            </div>
          </div>
        ) : leaderboard.length === 0 ? (
          /* Empty State */
          <div className="w-full bg-[#0c0e14] border border-white/[0.08] rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-1">
              <Clock className="w-6 h-6 stroke-[2]" />
            </div>
            <h3 className="text-base font-bold text-white font-mono uppercase tracking-wider">
              NO SESSIONS RECORDED
            </h3>
            <p className="text-xs text-zinc-400 max-w-md">
              {emptyText}
            </p>
          </div>
        ) : (
          <div
            className={`w-full flex flex-col gap-6 transition-opacity duration-200 ${
              isFetching ? 'opacity-70' : 'opacity-100'
            }`}
          >
            {/* ══════════════════════════════════════════════════════════ */}
            {/* 1. HERO CHAMPION BLOCK (#1 only)                           */}
            {/* ══════════════════════════════════════════════════════════ */}
            {hero &&
              (() => {
                const rankTierTitle = getMonthlyRankTierTitle(hero.rank_title, hero.total_seconds);
                const tierConfig = getRankConfigByTitle(rankTierTitle);
                const displayName = hero.display_name || hero.name || 'Scholar';
                const handle = hero.username || displayName.toLowerCase().replace(/\s+/g, '');
                const level = hero.level ?? getLevelFromLifetimeXP(hero.lifetime_xp || 0);
                const isUser = checkIsCurrentUser(hero);
                const { h, m, hNum, mNum } = parseTimeHoursMinutes(hero.total_seconds);
                const periodLabel = timeframe === 'all' ? 'ALL TIME' : `THIS ${timeframe.toUpperCase()}`;

                return (
                  <div
                    key={`hero-${hero.user_id}-${animationKey}`}
                    className="relative w-full"
                    style={{
                      animation: 'championSlamIn 0.65s cubic-bezier(0.34, 1.3, 0.64, 1) 0.4s both',
                    }}
                  >
                    {/* Radial glow in champion's tier accent color */}
                    <div
                      className="absolute -inset-1 rounded-3xl blur-2xl pointer-events-none -z-10 transition-all duration-700 opacity-60"
                      style={{
                        background: `radial-gradient(ellipse at center, ${tierConfig.badgeAccent}50 0%, ${tierConfig.badgeAccent}15 45%, transparent 75%)`,
                        animation: 'ambientGlowPulse 3s ease-in-out infinite',
                      }}
                    />

                    {/* Full-Width Hero Card */}
                    <div
                      className={`relative w-full rounded-3xl overflow-hidden p-6 sm:p-8 border bg-[#090c12]/90 backdrop-blur-xl shadow-2xl transition-all duration-200 ${
                        isUser
                          ? 'border-amber-400 ring-2 ring-amber-400/80 shadow-[0_0_35px_rgba(245,158,11,0.25)]'
                          : 'border-white/[0.1] hover:border-white/[0.18]'
                      }`}
                    >
                      {/* Subtle Rotating Conic Light Sweep Border */}
                      <div className="absolute inset-0 rounded-3xl pointer-events-none overflow-hidden -z-0">
                        <div
                          className="absolute -inset-[100%] opacity-30"
                          style={{
                            background: `conic-gradient(from 0deg, transparent 0deg, ${tierConfig.badgeAccent} 60deg, transparent 120deg)`,
                            animation: 'borderLightSweep 8s linear infinite',
                          }}
                        />
                        <div className="absolute inset-[1px] rounded-3xl bg-[#090c12]/95 backdrop-blur-xl" />
                      </div>

                      {/* Header Row: Champion Badge on Left, Timeframe Tabs on Right */}
                      <div className="relative z-10 w-full flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-white/[0.08]">
                        <div className="flex items-center gap-2">
                          <div
                            className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border text-xs font-mono font-bold tracking-widest uppercase shadow-md"
                            style={{
                              backgroundColor: `${tierConfig.badgeAccent}18`,
                              borderColor: `${tierConfig.badgeAccent}50`,
                              color: tierConfig.badgeAccent,
                            }}
                          >
                            <span>👑 CHAMPION</span>
                            {isUser && (
                              <span className="text-[10px] text-amber-300 font-mono font-bold ml-1">
                                (you)
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider hidden sm:inline">
                            {trackerText}
                          </span>
                        </div>

                        {/* Period Selector Tabs (Today / Week / Month / All Time) */}
                        <div className="inline-flex items-center p-1 bg-white/[0.04] border border-white/[0.08] rounded-xl gap-1">
                          {(
                            [
                              { label: 'TODAY', value: 'today' },
                              { label: 'THIS WEEK', value: 'week' },
                              { label: 'THIS MONTH', value: 'month' },
                              { label: 'ALL TIME', value: 'all' },
                            ] as const
                          ).map((tab) => {
                            const isActive = timeframe === tab.value;
                            return (
                              <button
                                key={tab.value}
                                type="button"
                                onClick={() => setTimeframe(tab.value)}
                                className={
                                  isActive
                                    ? 'px-3 py-1.5 text-xs font-mono font-semibold text-white bg-white/[0.1] border border-white/[0.15] rounded-lg shadow-sm transition-all cursor-pointer'
                                    : 'px-3 py-1.5 text-xs font-mono font-medium text-zinc-400 hover:text-white transition-colors rounded-lg cursor-pointer'
                                }
                              >
                                {tab.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Hero Content: Scholar Identity + Kinetic Time Display */}
                      <div className="relative z-10 w-full pt-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        {/* Scholar Identity Group */}
                        <div className="flex items-center gap-4 sm:gap-6 min-w-0">
                          {/* Large Avatar Circle in Champion's Own Tier Color */}
                          <div className="relative flex-shrink-0">
                            <div
                              className="p-1 rounded-full border transition-all duration-300 shadow-xl"
                              style={{
                                borderColor: `${tierConfig.badgeAccent}80`,
                                background: `radial-gradient(circle, ${tierConfig.badgeAccent}25 0%, transparent 70%)`,
                              }}
                            >
                              <ScholarAvatar
                                name={displayName}
                                avatarUrl={hero.avatar_url}
                                tier={tierConfig.tier}
                                sizeClass="w-20 h-20 sm:w-28 sm:h-28 text-2xl sm:text-3xl"
                              />
                            </div>
                          </div>

                          {/* Name, Handle, and Rank Crest */}
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h2 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight truncate">
                                {displayName}
                              </h2>
                              {isUser && (
                                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.25)] shrink-0">
                                  [YOU]
                                </span>
                              )}
                            </div>
                            <div className="text-xs sm:text-sm font-mono text-zinc-400 truncate mt-1">
                              @{handle} · Lv. {level}
                            </div>

                            {/* Rank Tier Badge + Title Prominently Displayed */}
                            <div className="flex items-center gap-2.5 mt-2.5 flex-wrap">
                              <div className="flex-shrink-0">
                                <RankCrestBadge
                                  tier={tierConfig.tier as RankTierName}
                                  division={tierConfig.division as RankDivision}
                                  size={44}
                                  isSettled={true}
                                />
                              </div>
                              <span
                                className="font-mono text-xs sm:text-sm font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-md border"
                                style={{
                                  color: tierConfig.badgeAccent,
                                  borderColor: `${tierConfig.badgeAccent}50`,
                                  backgroundColor: `${tierConfig.badgeAccent}15`,
                                }}
                              >
                                {rankTierTitle}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Large Kinetic Focus Time Display */}
                        <div className="flex flex-col md:items-end justify-center pt-2 md:pt-0 border-t md:border-t-0 border-white/[0.06] flex-shrink-0">
                          <div className="flex items-baseline font-mono">
                            {hero.total_seconds >= 3600 ? (
                              <>
                                <span className="text-4xl sm:text-6xl font-mono font-black tracking-tight bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
                                  <AnimatedDigit target={hNum} durationMs={800} delayMs={450} key={`h-${hero.user_id}-${animationKey}`} />
                                </span>
                                <span className="text-xs sm:text-sm font-mono text-zinc-400 font-bold ml-1 mr-3">HR</span>
                                <span className="text-3xl sm:text-5xl font-mono font-extrabold text-zinc-300">
                                  <AnimatedDigit target={mNum} durationMs={800} delayMs={450} key={`m-${hero.user_id}-${animationKey}`} />
                                </span>
                                <span className="text-xs sm:text-sm font-mono text-zinc-400 font-bold ml-1">MIN</span>
                              </>
                            ) : (
                              <>
                                <span className="text-4xl sm:text-6xl font-mono font-black tracking-tight bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
                                  <AnimatedDigit target={mNum} durationMs={800} delayMs={450} key={`m-${hero.user_id}-${animationKey}`} />
                                </span>
                                <span className="text-xs sm:text-sm font-mono text-zinc-400 font-bold ml-1.5">MIN</span>
                              </>
                            )}
                          </div>
                          <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-widest mt-1">
                            RECORDED FOCUS {periodLabel}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

            {/* ══════════════════════════════════════════════════════════ */}
            {/* 2. RUNNERS-UP STRIP (#2 and #3)                             */}
            {/* ══════════════════════════════════════════════════════════ */}
            {(top2 || top3) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                {/* #2 Runner-Up Card */}
                {top2 &&
                  (() => {
                    const rankTierTitle = getMonthlyRankTierTitle(top2.rank_title, top2.total_seconds);
                    const tierConfig = getRankConfigByTitle(rankTierTitle);
                    const displayName = top2.display_name || top2.name || 'Scholar';
                    const handle = top2.username || displayName.toLowerCase().replace(/\s+/g, '');
                    const level = top2.level ?? getLevelFromLifetimeXP(top2.lifetime_xp || 0);
                    const isUser = checkIsCurrentUser(top2);
                    const { h, m, hNum, mNum } = parseTimeHoursMinutes(top2.total_seconds);
                    const movement = getRankDelta(top2.user_id, 2, timeframe);

                    return (
                      <div
                        key={`runner2-${top2.user_id}-${animationKey}`}
                        style={{ animation: 'podiumSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both' }}
                        className={`relative p-4 sm:p-5 rounded-2xl bg-[#090c12]/80 border backdrop-blur-md flex items-center justify-between gap-4 transition-all duration-200 hover:border-slate-300/40 shadow-lg ${
                          isUser
                            ? 'border-amber-400/80 ring-1 ring-amber-400/60 bg-amber-500/[0.05]'
                            : 'border-white/[0.08]'
                        }`}
                      >
                        {/* Left Info: Position Tag, Avatar, Name & Crest */}
                        <div className="flex items-center gap-3.5 min-w-0">
                          {/* Rank Position */}
                          <div className="flex flex-col items-center justify-center flex-shrink-0">
                            <span className="font-mono text-xs font-bold text-slate-300 px-2 py-0.5 rounded bg-slate-400/10 border border-slate-400/20">
                              #02
                            </span>
                            {/* Movement indicator */}
                            <span className="mt-1">
                              {movement.delta > 0 ? (
                                <span className="text-emerald-400 font-mono text-[10px] font-bold">▲ +{movement.delta}</span>
                              ) : movement.delta < 0 ? (
                                <span className="text-rose-400 font-mono text-[10px] font-bold">▼ {Math.abs(movement.delta)}</span>
                              ) : movement.isNew ? (
                                <span className="text-amber-400 font-mono text-[9px] font-bold">NEW</span>
                              ) : (
                                <span className="text-zinc-600 font-mono text-[10px]">—</span>
                              )}
                            </span>
                          </div>

                          {/* Avatar with Tier Gradient */}
                          <ScholarAvatar
                            name={displayName}
                            avatarUrl={top2.avatar_url}
                            tier={tierConfig.tier}
                            sizeClass="w-12 h-12 text-sm"
                          />

                          {/* Identity & Rank Crest */}
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="font-bold text-white text-sm truncate">
                                {displayName}
                              </span>
                              {isUser && (
                                <span className="text-[9px] font-mono font-bold text-amber-400 uppercase px-1.5 py-0.2 rounded bg-amber-500/20 border border-amber-500/40">
                                  (you)
                                </span>
                              )}
                            </div>
                            <span className="text-xs font-mono text-zinc-400 truncate">
                              @{handle} · Lv. {level}
                            </span>
                            <div className="flex items-center gap-1.5 mt-1">
                              <RankCrestBadge
                                tier={tierConfig.tier as RankTierName}
                                division={tierConfig.division as RankDivision}
                                size={28}
                              />
                              <span
                                className="text-[11px] font-mono font-bold tracking-wider uppercase"
                                style={{ color: tierConfig.badgeAccent }}
                              >
                                {rankTierTitle}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Recorded Focus Time */}
                        <div className="flex flex-col items-end justify-center font-mono flex-shrink-0">
                          <div className="flex items-baseline font-mono text-right">
                            <span className="text-xl sm:text-2xl font-mono font-bold text-white">
                              <AnimatedDigit target={hNum} durationMs={800} delayMs={150} key={`h-${top2.user_id}-${animationKey}`} />
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono ml-0.5 mr-1.5">H</span>
                            <span className="text-lg sm:text-xl font-mono font-bold text-zinc-300">
                              <AnimatedDigit target={mNum} durationMs={800} delayMs={150} key={`m-${top2.user_id}-${animationKey}`} />
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono ml-0.5">M</span>
                          </div>
                          <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
                            RECORDED FOCUS
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                {/* #3 Runner-Up Card */}
                {top3 &&
                  (() => {
                    const rankTierTitle = getMonthlyRankTierTitle(top3.rank_title, top3.total_seconds);
                    const tierConfig = getRankConfigByTitle(rankTierTitle);
                    const displayName = top3.display_name || top3.name || 'Scholar';
                    const handle = top3.username || displayName.toLowerCase().replace(/\s+/g, '');
                    const level = top3.level ?? getLevelFromLifetimeXP(top3.lifetime_xp || 0);
                    const isUser = checkIsCurrentUser(top3);
                    const { h, m, hNum, mNum } = parseTimeHoursMinutes(top3.total_seconds);
                    const movement = getRankDelta(top3.user_id, 3, timeframe);

                    return (
                      <div
                        key={`runner3-${top3.user_id}-${animationKey}`}
                        style={{ animation: 'podiumSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.22s both' }}
                        className={`relative p-4 sm:p-5 rounded-2xl bg-[#090c12]/80 border backdrop-blur-md flex items-center justify-between gap-4 transition-all duration-200 hover:border-amber-700/40 shadow-lg ${
                          isUser
                            ? 'border-amber-400/80 ring-1 ring-amber-400/60 bg-amber-500/[0.05]'
                            : 'border-white/[0.08]'
                        }`}
                      >
                        {/* Left Info: Position Tag, Avatar, Name & Crest */}
                        <div className="flex items-center gap-3.5 min-w-0">
                          {/* Rank Position */}
                          <div className="flex flex-col items-center justify-center flex-shrink-0">
                            <span className="font-mono text-xs font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-700/10 border border-amber-700/20">
                              #03
                            </span>
                            {/* Movement indicator */}
                            <span className="mt-1">
                              {movement.delta > 0 ? (
                                <span className="text-emerald-400 font-mono text-[10px] font-bold">▲ +{movement.delta}</span>
                              ) : movement.delta < 0 ? (
                                <span className="text-rose-400 font-mono text-[10px] font-bold">▼ {Math.abs(movement.delta)}</span>
                              ) : movement.isNew ? (
                                <span className="text-amber-400 font-mono text-[9px] font-bold">NEW</span>
                              ) : (
                                <span className="text-zinc-600 font-mono text-[10px]">—</span>
                              )}
                            </span>
                          </div>

                          {/* Avatar with Tier Gradient */}
                          <ScholarAvatar
                            name={displayName}
                            avatarUrl={top3.avatar_url}
                            tier={tierConfig.tier}
                            sizeClass="w-12 h-12 text-sm"
                          />

                          {/* Identity & Rank Crest */}
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="font-bold text-white text-sm truncate">
                                {displayName}
                              </span>
                              {isUser && (
                                <span className="text-[9px] font-mono font-bold text-amber-400 uppercase px-1.5 py-0.2 rounded bg-amber-500/20 border border-amber-500/40">
                                  (you)
                                </span>
                              )}
                            </div>
                            <span className="text-xs font-mono text-zinc-400 truncate">
                              @{handle} · Lv. {level}
                            </span>
                            <div className="flex items-center gap-1.5 mt-1">
                              <RankCrestBadge
                                tier={tierConfig.tier as RankTierName}
                                division={tierConfig.division as RankDivision}
                                size={28}
                              />
                              <span
                                className="text-[11px] font-mono font-bold tracking-wider uppercase"
                                style={{ color: tierConfig.badgeAccent }}
                              >
                                {rankTierTitle}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Recorded Focus Time */}
                        <div className="flex flex-col items-end justify-center font-mono flex-shrink-0">
                          <div className="flex items-baseline font-mono text-right">
                            <span className="text-xl sm:text-2xl font-mono font-bold text-white">
                              <AnimatedDigit target={hNum} durationMs={800} delayMs={250} key={`h-${top3.user_id}-${animationKey}`} />
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono ml-0.5 mr-1.5">H</span>
                            <span className="text-lg sm:text-xl font-mono font-bold text-zinc-300">
                              <AnimatedDigit target={mNum} durationMs={800} delayMs={250} key={`m-${top3.user_id}-${animationKey}`} />
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono ml-0.5">M</span>
                          </div>
                          <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
                            RECORDED FOCUS
                          </span>
                        </div>
                      </div>
                    );
                  })()}
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════ */}
            {/* 3. RANKED LIST (#4 and below, limited to 50 rows)          */}
            {/* ══════════════════════════════════════════════════════════ */}
            {contenders.length > 0 && (
              <div className="w-full bg-[#090c12]/90 backdrop-blur-md border border-white/[0.07] rounded-2xl overflow-hidden divide-y divide-white/[0.04] shadow-2xl">
                {/* Column Header Row */}
                <div className="px-6 py-3 bg-white/[0.02] text-[10px] font-mono uppercase tracking-widest text-zinc-500 flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="w-10 text-left">POS</span>
                    <span className="w-10 text-center">DELTA</span>
                    <span>SCHOLAR</span>
                  </div>
                  <div className="w-40 sm:w-48 text-center flex-shrink-0">
                    <span>TIER</span>
                  </div>
                  <div className="w-28 sm:w-32 text-right flex-shrink-0">
                    <span>RECORDED FOCUS</span>
                  </div>
                </div>

                {/* Roster Rows */}
                {contenders.map((row, idx) => {
                  const actualRank = idx + 4;
                  const isCurrentUser = checkIsCurrentUser(row);
                  const rankTierTitle = getMonthlyRankTierTitle(row.rank_title, row.total_seconds);
                  const tierConfig = getRankConfigByTitle(rankTierTitle);
                  const displayName = row.display_name || row.name || row.username || 'Scholar';
                  const handle = row.username || displayName.toLowerCase().replace(/\s+/g, '');
                  const level = row.level ?? getLevelFromLifetimeXP(row.lifetime_xp || 0);
                  const { h, m } = parseTimeHoursMinutes(row.total_seconds);
                  const movement = getRankDelta(row.user_id, actualRank, timeframe);

                  return (
                    <div
                      key={row.user_id || actualRank}
                      className={`px-6 py-3.5 flex items-center transition-all duration-200 group border-l-2 relative cursor-default ${
                        isCurrentUser
                          ? 'border-l-amber-400 bg-amber-500/[0.08] shadow-[inset_0_0_24px_rgba(245,158,11,0.08)]'
                          : 'border-l-transparent hover:border-l-[var(--row-tier-color)] hover:bg-white/[0.04]'
                      }`}
                      style={{
                        '--row-tier-color': tierConfig.badgeAccent || '#D97706',
                        animation: 'listRowFadeSlide 0.4s ease-out both',
                        animationDelay: `${550 + idx * 40}ms`,
                      } as React.CSSProperties}
                    >
                      {/* POS */}
                      <span className="w-10 text-left text-zinc-500 font-mono text-xs group-hover:text-zinc-300">
                        #{actualRank < 10 ? `0${actualRank}` : actualRank}
                      </span>

                      {/* Rank Movement Delta */}
                      <div className="w-10 text-center flex-shrink-0">
                        {movement.delta > 0 ? (
                          <span className="text-emerald-400 font-mono text-[10px] font-bold">▲ +{movement.delta}</span>
                        ) : movement.delta < 0 ? (
                          <span className="text-rose-400 font-mono text-[10px] font-bold">▼ {Math.abs(movement.delta)}</span>
                        ) : movement.isNew ? (
                          <span className="text-amber-400 font-mono text-[9px] font-bold uppercase">NEW</span>
                        ) : (
                          <span className="text-zinc-600 font-mono text-xs">—</span>
                        )}
                      </div>

                      {/* Scholar Info */}
                      <div className="flex items-center gap-3 flex-1 min-w-0 pr-3">
                        <ScholarAvatar
                          name={displayName}
                          avatarUrl={row.avatar_url}
                          tier={tierConfig.tier}
                          sizeClass="w-8 h-8 text-[11px]"
                        />

                        <div className="flex flex-col min-w-0 justify-center">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="font-semibold text-white text-sm tracking-tight truncate">
                              {displayName}
                            </span>
                            {isCurrentUser && (
                              <span className="text-[9px] font-mono font-bold text-amber-400 uppercase px-1.5 py-0.2 rounded bg-amber-500/20 border border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.25)]">
                                (you)
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-mono text-zinc-500 truncate mt-0.5">
                            @{handle} · Lv. {level}
                          </span>
                        </div>
                      </div>

                      {/* Tier Column with actual Rank Crest Badge + Title */}
                      <div className="w-40 sm:w-48 flex items-center justify-center flex-shrink-0 gap-2">
                        <RankCrestBadge
                          tier={tierConfig.tier as RankTierName}
                          division={tierConfig.division as RankDivision}
                          size={30}
                        />
                        <span
                          className="text-xs font-mono tracking-wider uppercase truncate font-semibold"
                          style={{ color: tierConfig.badgeAccent }}
                        >
                          {rankTierTitle}
                        </span>
                      </div>

                      {/* Recorded Focus Column */}
                      <div className="w-28 sm:w-32 text-right flex-shrink-0 font-mono">
                        <span className="text-sm font-bold text-white tracking-tight">{h}</span>
                        <span className="text-[10px] text-zinc-500 font-mono ml-0.5 mr-1.5">H</span>
                        <span className="text-xs font-semibold text-zinc-300">{m}</span>
                        <span className="text-[10px] text-zinc-500 font-mono ml-0.5">M</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
