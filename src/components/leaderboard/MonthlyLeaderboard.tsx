'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useStudy } from '../../context/StudyContext';
import { getSupabase } from '../../lib/supabase';
import { getRankFromRp, calculateRpFromSeconds, RankTierName, RankDivision, RankTier, RANKS } from '../../lib/ranks';
import { getRankTheme } from '../../lib/rankTheme';
import { getLevelFromLifetimeXP } from '../../lib/gamification';
import { LeaderboardEntry } from '../../types';
import { Clock, Trophy, Sparkles, ChevronRight } from 'lucide-react';
import { soundFx } from '../../lib/audio';
import { RankCrestBadge } from '../common/RankCrestBadge';
import { useRankTheme } from '../../hooks/useRankTheme';
import { Logo } from '../Logo';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { LeaderboardRow } from './LeaderboardRow';
import { FlairFrame, fetchFlairMap } from '../../lib/flair';
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

import { usePremium } from '../../context/PremiumContext';

export function MonthlyLeaderboard({ isEmbedded = false, isActiveTab = true }: MonthlyLeaderboardProps) {
  const { user } = useAuth();
  const { sessions } = useStudy();
  const { userRank } = useRankTheme();
  const { isPremium } = usePremium();

  const [timeframe, setTimeframe] = useState<LeaderboardTimeframe>('month');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [animationKey, setAnimationKey] = useState<number>(0);
  const [hasSeenRecap, setHasSeenRecap] = useState<boolean | null>(null);

  useEffect(() => {
    const currentSeason = new Date().toISOString().substring(0, 7);
    const seen = localStorage.getItem(`has_seen_recap_${currentSeason}`) === 'true';
    setHasSeenRecap(seen);
  }, []);

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
              
              let computedRank = getRankFromRp(0).name;
              try {
                const rpFromSeconds = row.total_seconds ? Math.floor(Number(row.total_seconds) / 60) : 0;
                const explicitRp = (row.season_rp !== undefined && row.season_rp !== null) ? Number(row.season_rp) : 
                                   (row.rp !== undefined && row.rp !== null) ? Number(row.rp) : 0;
                
                const bestRp = Math.max(rpFromSeconds, explicitRp);
                
                if (bestRp > 0) {
                  computedRank = getRankFromRp(bestRp).name;
                } else if (row.rank_title) {
                  computedRank = String(row.rank_title);
                }
              } catch (e) {}
              
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
                  let computedRank = getRankFromRp(0).name;
                  try {
                    const rpFromSeconds = userTotals[p.id] ? Math.floor(userTotals[p.id] / 60) : 0;
                    const explicitRp = (p.season_rp !== undefined && p.season_rp !== null) ? Number(p.season_rp) : 
                                       (p.rp !== undefined && p.rp !== null) ? Number(p.rp) : 0;
                    
                    const bestRp = Math.max(rpFromSeconds, explicitRp);
                    
                    if (bestRp > 0) {
                      computedRank = getRankFromRp(bestRp).name;
                    } else if (p.rank_title) {
                      computedRank = String(p.rank_title);
                    }
                  } catch (e) {}

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

  const shouldReduceMotion = useReducedMotion() ?? false;

  const monthYearLabel = useMemo(() => {
    const now = new Date();
    const m = now.toLocaleString('en-US', { month: 'long' });
    const y = now.getFullYear();
    return `${m} ${y}`;
  }, []);

  // Keep the list limited to the top 50
  const contenders = useMemo(() => {
    return leaderboard.slice(0, 50);
  }, [leaderboard]);

  const topSeconds = useMemo(() => {
    return contenders[0]?.total_seconds || 0;
  }, [contenders]);

  const deltaMap = useMemo(() => {
    const map: Record<string, { delta: number; isNew: boolean }> = {};
    contenders.forEach((row, idx) => {
      if (row?.user_id) {
        map[row.user_id] = getRankDelta(String(row.user_id), idx + 1, timeframe);
      }
    });
    return map;
  }, [contenders, timeframe]);

  const hasAnyDelta = useMemo(() => {
    return Object.values(deltaMap).some((info) => info.delta !== 0);
  }, [deltaMap]);

  // Batch-fetch flair for visible leaderboard scholars
  const [flairMap, setFlairMap] = useState<Record<string, FlairFrame>>({});
  useEffect(() => {
    const userIds = contenders.map((c) => c.user_id).filter(Boolean);
    if (userIds.length === 0) {
      setFlairMap({});
      return;
    }

    fetchFlairMap(userIds).then((map) => {
      if (isPremium && user?.id) {
        map[user.id] = map[user.id] || 'gold';
      }
      setFlairMap(map);
    });
  }, [contenders, isPremium, user?.id]);

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

  if (hasSeenRecap === null) {
    return (
      <div className="w-full min-h-[400px] flex items-center justify-center animate-pulse">
        <Logo className="w-10 h-10 opacity-50" />
      </div>
    );
  }

  if (hasSeenRecap === false) {
    return (
      <div className={`w-full text-slate-100 font-sans ${isEmbedded ? 'max-w-5xl mx-auto py-12' : 'bg-[var(--bg)] min-h-screen p-8 flex flex-col justify-center'} flex items-center justify-center relative`}>
        {!isEmbedded && (
          <>
            <div className="fixed inset-0 pointer-events-none bg-dot-grid z-0" />
            <div className="fixed inset-0 pointer-events-none bg-hud-grid opacity-[0.03] z-0" />
          </>
        )}
        <div className="relative z-10 bg-[var(--surface)] backdrop-blur-2xl border border-[var(--border)] rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-6 shadow-card max-w-lg w-full">
          <div className="w-20 h-20 rounded-full bg-[var(--accent-soft)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)] mb-2 relative animate-pulse">
            <Trophy className="w-10 h-10 stroke-[1.5]" />
          </div>
          <h2 className="text-2xl md:text-3xl font-black font-hud tracking-widest uppercase text-[var(--text)]">
            A New Season Has Begun
          </h2>
          <p className="text-[var(--text-dim)] font-hud tracking-wider text-sm mb-4">
            Discover your personalized performance recap and unlock the new season's leaderboard.
          </p>
          <Link
            href="/recap"
            onClick={() => {
              try {
                soundFx.resumeContext();
              } catch {}
            }}
            className="inline-block w-full py-4 rounded-xl font-hud font-bold tracking-widest transition-all shadow-lg active:scale-95 hover:brightness-110"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-contrast)', boxShadow: '0 4px 20px var(--glow)' }}
          >
            WATCH SEASON RECAP TO UNLOCK
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`w-full text-[var(--text)] font-sans ${
        isEmbedded
          ? 'max-w-[1100px] mx-auto flex flex-col gap-6 py-4'
          : 'bg-[var(--bg)] min-h-screen p-4 sm:p-6 flex flex-col items-center'
      } pb-28 sm:pb-12`}
    >
      <div className="w-full max-w-[1100px] flex flex-col gap-6 relative">
        {/* Loading State */}
        {isLoading ? (
          <div className="w-full flex flex-col gap-6">
            <div className="w-full bg-[var(--surface)] backdrop-blur-md border border-[var(--border)] rounded-2xl overflow-hidden divide-y divide-fg/[0.06] shadow-card">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="px-4 sm:px-6 py-4 flex items-center justify-between animate-pulse">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-7 h-7 rounded-full bg-fg/[0.04]" />
                    <div className="w-10 h-10 rounded-full bg-fg/[0.04]" />
                    <div className="flex flex-col gap-1.5">
                      <div className="w-28 sm:w-36 h-4 bg-fg/[0.05] rounded" />
                      <div className="w-20 h-3 bg-fg/[0.03] rounded" />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 sm:gap-8">
                    <div className="w-9 h-9 rounded-full bg-fg/[0.04]" />
                    <div className="w-16 h-4 bg-fg/[0.05] rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : leaderboard.length === 0 ? (
          /* Empty State */
          <div className="w-full bg-[var(--surface)] backdrop-blur-md border border-[var(--border)] rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3 shadow-card">
            <div className="w-12 h-12 rounded-full bg-fg/[0.04] border border-fg/[0.08] flex items-center justify-center text-[var(--text-dim)] mb-1">
              <Clock className="w-6 h-6 stroke-[1.75]" />
            </div>
            <h3 className="text-sm font-semibold text-[var(--text)] tracking-wide">
              No sessions recorded
            </h3>
            <p className="text-xs text-[var(--text-dim)] max-w-md">
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
            {/* PAGE HEADER & CONTROLS                                     */}
            {/* ══════════════════════════════════════════════════════════ */}
            <div className="w-full flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-1">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text)] font-sans">
                  Leaderboard
                </h1>
                <p className="text-sm text-[var(--text-dim)] mt-1">
                  {monthYearLabel} · ranked by focus time
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                <Link
                  href="/recap"
                  onClick={() => {
                    try {
                      soundFx.resumeContext();
                    } catch {}
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--surface)] hover:bg-[var(--surface-2)] border border-[var(--border)] text-xs font-mono text-[var(--text-dim)] hover:text-[var(--text)] transition-all duration-150 active:scale-95 cursor-pointer shrink-0 shadow-card"
                  title="Watch your recap from the previous completed season"
                >
                  <span>Last Season Recap</span>
                  <ChevronRight className="w-3.5 h-3.5 text-[var(--text-faint)]" />
                </Link>

                <div className="inline-flex items-center p-1 bg-fg/[0.03] border border-fg/[0.07] rounded-xl gap-1 relative overflow-x-auto max-w-full shadow-card">
                  {(
                    [
                      { label: 'Today', value: 'today' },
                      { label: 'This Week', value: 'week' },
                      { label: 'This Month', value: 'month' },
                      { label: 'All Time', value: 'all' },
                    ] as const
                  ).map((tab) => {
                    const isActive = timeframe === tab.value;
                    return (
                      <button
                        key={tab.value}
                        type="button"
                        onClick={() => setTimeframe(tab.value)}
                        className={`relative px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer shrink-0 z-10 ${
                          isActive ? 'text-[var(--text)] font-semibold' : 'text-[var(--text-dim)] hover:text-[var(--text)]'
                        }`}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="leaderboard-period-pill"
                            className="absolute inset-0 bg-fg/[0.1] [[data-theme='paper']_&]:bg-[var(--surface)] border border-fg/[0.15] [[data-theme='paper']_&]:border-[var(--border-strong)] rounded-lg shadow-card -z-10"
                            transition={{ type: 'tween', duration: 0.18, ease: 'easeOut' }}
                          />
                        )}
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sticky Current User Rank Indicator */}
            {currentUserEntry && !currentUserRowVisible && (
              <div className="sticky top-2 z-30 mb-2 flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)]/95 px-4 py-2 text-xs font-mono text-[var(--text)] backdrop-blur-md shadow-card">
                <span>
                  YOUR RANK: <strong style={{ color: 'var(--tier-accent-text)' }}>#{currentUserEntry.rank}</strong>
                </span>
                <button
                  onClick={() => myRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                  className="rounded bg-fg/10 hover:bg-fg/15 px-2.5 py-1 text-[var(--text)] cursor-pointer transition-colors"
                >
                  Jump to You ↓
                </button>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════ */}
            {/* RANKED LIST PANEL                                          */}
            {/* ══════════════════════════════════════════════════════════ */}
            {contenders.length > 0 && (
              <div className="w-full bg-[var(--surface)] backdrop-blur-md border border-[var(--border)] rounded-2xl overflow-hidden shadow-card divide-y divide-fg/[0.06]">
                {/* Column Labels */}
                <div className="px-4 sm:px-6 py-3 bg-[var(--surface-2)] text-xs text-[var(--text-dim)] font-normal flex items-center justify-between border-b border-[var(--border)] select-none">
                  <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                    <span className="w-7 text-center">#</span>
                    <span>Scholar</span>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                    <span className="w-12 sm:w-36 text-center sm:text-left">Tier</span>
                    <span className="w-20 sm:w-28 text-right">Focus time</span>
                  </div>
                </div>

                {/* Rows with animated fade-in on timeframe change */}
                <motion.div
                  key={timeframe}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ type: 'tween', duration: 0.2, ease: 'easeOut' }}
                  className="divide-y divide-fg/[0.06]"
                >
                  {contenders.map((row, idx) => {
                    if (!row) return null;
                    const actualRank = idx + 1;
                    const isCurrentUser = checkIsCurrentUser(row);
                    const deltaInfo = deltaMap[row.user_id];

                    return (
                      <LeaderboardRow
                        key={row.user_id}
                        rank={actualRank}
                        row={row}
                        isCurrentUser={isCurrentUser}
                        topSeconds={topSeconds}
                        hasAnyDelta={hasAnyDelta}
                        deltaInfo={deltaInfo}
                        userRankName={userRank?.name}
                        myRowRef={isCurrentUser ? myRowRef : undefined}
                        index={idx}
                        shouldReduceMotion={shouldReduceMotion}
                        flairFrame={flairMap[row.user_id]}
                      />
                    );
                  })}
                </motion.div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


