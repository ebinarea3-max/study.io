'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useStudy } from '../../context/StudyContext';
import { getSupabase } from '../../lib/supabase';
import { getRankFromRp, calculateRpFromSeconds, RankTierName, RankDivision, RankTier, RANKS } from '../../lib/ranks';
import { getRankTheme } from '../../lib/rankTheme';
import { getLevelFromLifetimeXP } from '../../lib/gamification';
import { LeaderboardEntry } from '../../types';
import { Clock } from 'lucide-react';
import { soundFx } from '../../lib/audio';
import { RankCrestBadge } from '../common/RankCrestBadge';
import { useRankTheme } from '../../hooks/useRankTheme';
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
  if (rankTitle) {
    const found = RANKS.find(r => r.name.toUpperCase() === rankTitle.toUpperCase());
    if (found) return found.name.toUpperCase();
  }
  return getRankFromRp(0).name.toUpperCase();
}

export function getMonthlyRankTierConfig(totalSeconds?: number, rankTitle?: string): RankTier {
  if (rankTitle) {
    const found = RANKS.find(r => r.name.toUpperCase() === rankTitle.toUpperCase());
    if (found) return found;
  }
  // Default to the base rank instead of dynamically calculating based on the period's duration
  return getRankFromRp(0);
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
  const { userRank } = useRankTheme();

  const [timeframe, setTimeframe] = useState<LeaderboardTimeframe>('month');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [animationKey, setAnimationKey] = useState<number>(0);

  const [currentUserRowVisible, setCurrentUserRowVisible] = useState(true);
  const myRowRef = useRef<HTMLDivElement | null>(null);

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
            entries = res.data.map((row: any) => {
              const isMe = Boolean(row.is_current_user || (currentUser?.id && row.user_id === currentUser.id));
              
              let computedRank = row.rank_title;
              if (row.season_rp !== undefined || row.rp !== undefined) {
                const rpToUse = Number(row.season_rp ?? row.rp ?? 0);
                computedRank = getRankFromRp(rpToUse).name;
              } else if (!computedRank || computedRank.trim() === '') {
                computedRank = getRankFromRp(0).name;
              }
              
              if (isMe && currentUser?.levelTitle) {
                computedRank = currentUser.levelTitle;
              }

              return {
                user_id: String(row.user_id),
                name: String(row.display_name || row.name || 'Scholar'),
                display_name: row.display_name || row.name || null,
                username: row.username ? String(row.username) : null,
                avatar_url: row.avatar_url ? String(row.avatar_url) : null,
                level: row.level ? Number(row.level) : undefined,
                lifetime_xp: Number(row.lifetime_xp || 0),
                rank_title: String(computedRank).toUpperCase(),
                total_seconds: Number(row.total_seconds || 0),
                is_current_user: isMe,
              };
            });
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
                .select('id, name, username, avatar_url, lifetime_xp, xp, rank_title, level, rp, season_rp')
                .in('id', uids);

              if (dbProfiles) {
                entries = dbProfiles.map((p: any) => {
                  const isMe = p.id === currentUser?.id;
                  let computedRank = p.rank_title;
                  if (p.season_rp !== undefined || p.rp !== undefined) {
                    const rpToUse = Number(p.season_rp ?? p.rp ?? 0);
                    computedRank = getRankFromRp(rpToUse).name;
                  } else if (!computedRank || computedRank.trim() === '') {
                    computedRank = getRankFromRp(0).name;
                  }

                  if (isMe && currentUser?.levelTitle) {
                    computedRank = currentUser.levelTitle;
                  }

                  return {
                    user_id: p.id,
                    name: p.name || 'Scholar',
                    display_name: p.name || 'Scholar',
                    username: p.username || null,
                    avatar_url: p.avatar_url || null,
                    level: p.level ? Number(p.level) : undefined,
                    lifetime_xp: Number(p.lifetime_xp ?? p.xp ?? 0),
                    rank_title: String(computedRank).toUpperCase(),
                    total_seconds: userTotals[p.id] || 0,
                    is_current_user: isMe,
                  };
                });
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

  // Keep the list limited to the top 50
  const contenders = useMemo(() => {
    return leaderboard.slice(0, 50);
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

  const currentUserEntry = useMemo(() => {
    if (!contenders || contenders.length === 0) return null;
    const idx = contenders.findIndex(row => checkIsCurrentUser(row));
    if (idx === -1) return null;
    
    const row = contenders[idx];
    const actualRank = idx + 1;
    const tierConfig = userRank 
      ? getMonthlyRankTierConfig(0, userRank.name) 
      : getMonthlyRankTierConfig(row.total_seconds, row.rank_title);
    const { h, m } = parseTimeHoursMinutes(row.total_seconds);
    
    return { rank: actualRank, row, h, m, tierConfig };
  }, [contenders, checkIsCurrentUser, userRank]);

  useEffect(() => {
    if (isLoading || isFetching) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]) {
          setCurrentUserRowVisible(entries[0].isIntersecting);
        }
      },
      { threshold: 0, rootMargin: '-10px 0px -10px 0px' }
    );

    if (myRowRef.current) {
      observer.observe(myRowRef.current);
    }

    return () => observer.disconnect();
  }, [isLoading, isFetching, leaderboard, contenders]);

  return (
    <div
      className={`w-full text-white font-sans ${
        isEmbedded
          ? 'max-w-5xl mx-auto flex flex-col gap-6 py-4'
          : 'bg-[#05070a] min-h-screen p-4 sm:p-8 flex flex-col items-center'
      } pb-28 sm:pb-12`}
    >
      {/* Keyframe Animations */}
      <style>{`
        @keyframes listRowFadeSlide {
          0%   { opacity: 0; transform: translateY(12px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="w-full max-w-5xl flex flex-col gap-6 relative">
        {/* Loading State */}
        {isLoading ? (
          <div className="w-full flex flex-col gap-6">
            {/* Table Skeleton */}
            {/* Table Skeleton */}
            <div className="w-full bg-white/[0.03] backdrop-blur-2xl border border-white/[0.1] rounded-2xl overflow-hidden divide-y divide-white/[0.04] shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
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
          <div className="w-full bg-white/[0.02] backdrop-blur-2xl border border-white/[0.1] rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
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
            {/* HEADER & PERIOD SELECTOR                                   */}
            {/* ══════════════════════════════════════════════════════════ */}
            <div className="w-full flex flex-wrap items-center justify-between gap-3 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-zinc-400 uppercase tracking-wider font-bold">
                  {trackerText}
                </span>
              </div>
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

            {/* ══════════════════════════════════════════════════════════ */}
            {/* RANKED LIST                                                */}
            {/* ══════════════════════════════════════════════════════════ */}
            {currentUserEntry && !currentUserRowVisible && (
              <div className="sticky top-2 z-30 mb-4 flex items-center justify-between rounded-xl border border-amber-500/30 bg-[#0c0e14]/90 px-4 py-2 text-xs font-mono text-zinc-300 backdrop-blur-md shadow-lg">
                <span>YOUR RANK: <strong className="text-amber-400">#{currentUserEntry.rank}</strong></span>
                <button 
                  onClick={() => myRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                  className="rounded bg-amber-500/20 px-2 py-1 text-amber-300 hover:bg-amber-500/30 cursor-pointer"
                >
                  Jump to You ↓
                </button>
              </div>
            )}
            
            {contenders.length > 0 && (
              <div className="w-full bg-white/[0.03] backdrop-blur-2xl border border-white/[0.1] rounded-2xl overflow-hidden divide-y divide-white/[0.04] shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                {/* Column Header Row */}
                <div className="px-4 sm:px-6 py-3 bg-white/[0.02] text-[10px] font-mono uppercase tracking-widest text-zinc-500 flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="hidden sm:inline-block w-10 text-left">POS</span>
                    <span className="hidden sm:inline-block w-10 text-center">DELTA</span>
                    <span>SCHOLAR</span>
                  </div>
                  <div className="hidden sm:block w-40 sm:w-48 text-center flex-shrink-0">
                    <span>TIER</span>
                  </div>
                  <div className="text-right flex-shrink-0 sm:w-32">
                    <span>RECORDED FOCUS</span>
                  </div>
                </div>

                {/* Roster Rows */}
                {contenders.map((row, idx) => {
                  const actualRank = idx + 1;
                  const isCurrentUser = checkIsCurrentUser(row);
                  
                  if (idx < 2) console.log('Leaderboard row data:', row);

                  let tierConfig = getMonthlyRankTierConfig(row.total_seconds, row.rank_title);
                  
                  if (isCurrentUser && userRank) {
                    // BRUTE-FORCE UNCONDITIONAL OVERRIDE:
                    // Always match the exact rank displayed in the header.
                    tierConfig = getMonthlyRankTierConfig(0, userRank.name);
                  }
                  const level = row.level ?? getLevelFromLifetimeXP(row.lifetime_xp || 0);

                  const displayTierTitle = tierConfig.name.toUpperCase();
                  const theme = getRankTheme(tierConfig.tier);
                  
                  const displayName = row.display_name || row.name || row.username || 'Scholar';
                  const handle = row.username || displayName.toLowerCase().replace(/\s+/g, '');
                  const { h, m } = parseTimeHoursMinutes(row.total_seconds);
                  const movement = getRankDelta(row.user_id, actualRank, timeframe);

                  return (
                    <div
                      key={row.user_id}
                      ref={isCurrentUser ? myRowRef : null}
                      className="flex flex-col transition-all duration-500 rounded-lg"
                      style={{
                        animation: 'listRowFadeSlide 0.4s ease-out both',
                        animationDelay: `${550 + idx * 40}ms`,
                      }}
                    >
                      {/* Mobile Row (< sm) */}
                      <div
                        className={`sm:hidden px-4 py-3 flex items-center justify-between transition-all duration-200 group border-l-2 relative cursor-default ${
                          isCurrentUser
                            ? 'border-l-amber-400 bg-amber-500/[0.08] shadow-[inset_0_0_24px_rgba(245,158,11,0.08)]'
                            : 'border-l-transparent hover:border-l-[var(--row-tier-color)] hover:bg-white/[0.04]'
                        }`}
                        style={{
                          '--row-tier-color': theme.accent,
                        } as React.CSSProperties}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {/* Rank Column */}
                          <span className={`w-9 font-mono text-xs font-bold text-center shrink-0 ${
                            actualRank === 1 ? 'text-amber-400' :
                            actualRank === 2 ? 'text-slate-300' :
                            actualRank === 3 ? 'text-amber-700' :
                            'text-zinc-400'
                          }`}>
                            #{actualRank < 10 ? `0${actualRank}` : actualRank}
                          </span>

                          {/* Fixed Avatar Slot */}
                          <div className="relative w-9 h-9 rounded-full overflow-hidden shrink-0 flex items-center justify-center border border-white/10 bg-[#0c0e14] shadow-md">
                            {row.avatar_url ? (
                              <img
                                src={row.avatar_url}
                                alt={displayName}
                                className="w-full h-full object-cover rounded-full"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                               <div className={`w-full h-full flex items-center justify-center font-mono font-bold bg-gradient-to-br ${getTierAvatarGradient(tierConfig.tier)} text-white text-[11px]`}>
                                {(displayName || 'S').trim().charAt(0).toUpperCase()}
                               </div>
                            )}
                          </div>

                          {/* User Details (Truncated) */}
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-white truncate flex items-center gap-1.5">
                              <span className="truncate">{displayName}</span>
                              {actualRank === 1 && <span className="shrink-0">👑</span>}
                            </div>
                            <div className="text-[11px] text-zinc-500 font-mono truncate">
                              @{handle} · {displayTierTitle}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 pl-2">
                          <RankCrestBadge
                            tier={tierConfig.tier as RankTierName}
                            division={tierConfig.division as RankDivision}
                            size={20}
                          />
                          <span className="text-sm font-mono font-black text-white">
                            {h}h {m}m
                          </span>
                        </div>
                      </div>

                      {/* Desktop Row (>= sm) */}
                      <div
                        className={`hidden sm:flex px-6 py-3.5 items-center transition-all duration-200 group border-l-2 relative cursor-default ${
                          isCurrentUser
                            ? 'border-l-amber-400 bg-amber-500/[0.08] shadow-[inset_0_0_24px_rgba(245,158,11,0.08)]'
                            : 'border-l-transparent hover:border-l-[var(--row-tier-color)] hover:bg-white/[0.04]'
                        }`}
                        style={{
                          '--row-tier-color': theme.accent,
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
                              {actualRank === 1 && (
                                <span className="text-[14px]" title="Champion">👑</span>
                              )}
                              {isCurrentUser && (
                                <span className="text-[9px] font-mono font-bold text-amber-400 uppercase px-1.5 py-0.2 rounded bg-amber-500/20 border border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.25)] flex-shrink-0">
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
                            style={{ color: theme.accent }}
                          >
                            {displayTierTitle}
                          </span>
                        </div>

                        {/* Recorded Focus Column */}
                        <div className="w-28 sm:w-32 text-right flex-shrink-0 font-mono flex items-baseline justify-end">
                          <span className="text-lg sm:text-xl font-black text-white tracking-tighter drop-shadow-sm">{h}</span>
                          <span className="text-lg sm:text-xl font-black text-zinc-500 tracking-tighter drop-shadow-sm ml-0.5 mr-1.5">H</span>
                          <span className="text-lg sm:text-xl font-black text-zinc-200 tracking-tighter drop-shadow-sm">{m}</span>
                          <span className="text-lg sm:text-xl font-black text-zinc-500 tracking-tighter drop-shadow-sm ml-0.5">M</span>
                        </div>
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


