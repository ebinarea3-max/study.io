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

  if (hasSeenRecap === null) {
    return (
      <div className="w-full min-h-[400px] flex items-center justify-center animate-pulse">
        <Logo className="w-10 h-10 opacity-50" />
      </div>
    );
  }

  if (hasSeenRecap === false) {
    return (
      <div className={`w-full text-slate-100 font-sans ${isEmbedded ? 'max-w-5xl mx-auto py-12' : 'bg-[#07090e] min-h-screen p-8 flex flex-col justify-center'} flex items-center justify-center relative`}>
        {!isEmbedded && (
          <>
            <div className="fixed inset-0 pointer-events-none bg-dot-grid z-0" />
            <div className="fixed inset-0 pointer-events-none bg-hud-grid opacity-[0.03] z-0" />
          </>
        )}
        <div className="relative z-10 bg-white/[0.03] backdrop-blur-2xl border border-white/[0.1] rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)] max-w-lg w-full">
          <div className="w-20 h-20 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-2 relative animate-pulse">
            <Trophy className="w-10 h-10 stroke-[1.5]" />
          </div>
          <h2 className="text-2xl md:text-3xl font-black font-hud tracking-widest uppercase">
            A New Season Has Begun
          </h2>
          <p className="text-slate-400 font-hud tracking-wider text-sm mb-4">
            Discover your personalized performance recap and unlock the new season's leaderboard.
          </p>
          <Link
            href="/recap"
            onClick={() => {
              try {
                soundFx.resumeContext();
              } catch {}
            }}
            className="inline-block w-full py-4 bg-amber-500 hover:bg-amber-400 rounded-xl text-black font-hud font-bold tracking-widest transition-all shadow-lg shadow-amber-500/20 active:scale-95"
          >
            WATCH SEASON RECAP TO UNLOCK
          </Link>
        </div>
      </div>
    );
  }

  // Check if at least one row has a real delta
  const hasAnyRealDelta = useMemo(() => {
    return contenders.some((row, idx) => {
      const movement = getRankDelta(String(row.user_id), idx + 1, timeframe);
      return movement.delta !== 0;
    });
  }, [contenders, timeframe]);

  const currentMonthYear = useMemo(() => {
    const now = new Date();
    const month = now.toLocaleString('en-US', { month: 'long' });
    const year = now.getFullYear();
    if (timeframe === 'month') return `${month} ${year} · ranked by focus time`;
    if (timeframe === 'today') return `Today · ranked by focus time`;
    if (timeframe === 'week') return `This week · ranked by focus time`;
    return `All time · ranked by focus time`;
  }, [timeframe]);

  return (
    <div
      className={`w-full text-white font-sans ${
        isEmbedded
          ? 'max-w-[1100px] mx-auto flex flex-col gap-5 py-4 px-4 sm:px-6'
          : 'bg-[#05070a] min-h-screen p-4 sm:p-8 flex flex-col items-center'
      } pb-28 sm:pb-12 animate-in fade-in duration-250`}
    >
      <style>{`
        @keyframes listRowFadeSlide {
          0%   { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="w-full max-w-[1100px] flex flex-col gap-5 relative">
        {/* Loading State */}
        {isLoading ? (
          <div className="w-full flex flex-col gap-4">
            <div className="w-full bg-white/[0.02] border border-white/[0.08] rounded-2xl overflow-hidden divide-y divide-white/[0.04]">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="px-6 py-4 flex items-center justify-between animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-4 bg-white/[0.05] rounded" />
                    <div className="w-8 h-8 rounded-full bg-white/[0.05]" />
                    <div className="w-32 h-4 bg-white/[0.05] rounded" />
                  </div>
                  <div className="w-20 h-4 bg-white/[0.05] rounded" />
                </div>
              ))}
            </div>
          </div>
        ) : leaderboard.length === 0 ? (
          /* Empty State */
          <div className="w-full bg-white/[0.02] border border-white/[0.08] rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-2.5">
            <Clock className="w-8 h-8 text-zinc-500 mb-1 stroke-[1.5]" />
            <h3 className="text-sm font-medium text-white">
              No sessions recorded
            </h3>
            <p className="text-xs text-zinc-400 max-w-sm">
              {emptyText}
            </p>
          </div>
        ) : (
          <div
            className={`w-full flex flex-col gap-4 transition-opacity duration-150 ${
              isFetching ? 'opacity-70' : 'opacity-100'
            }`}
          >
            {/* Header, Subtitle, Quiet Recap Link & Neutral Period Selector */}
            <div className="w-full flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-2 border-b border-white/[0.08]">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Leaderboard</h1>
                <p className="text-xs text-zinc-400 font-normal mt-0.5">{currentMonthYear}</p>
              </div>

              <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
                {/* Quiet text link with chevron, no dot */}
                <Link
                  href="/recap"
                  onClick={() => {
                    try {
                      soundFx.resumeContext();
                    } catch {}
                  }}
                  className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors inline-flex items-center gap-1 font-normal cursor-pointer"
                  title="Watch recap from the previous season"
                >
                  <span>Last season recap</span>
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                </Link>

                {/* Neutral Segmented Period Selector in Sentence Case */}
                <div className="inline-flex items-center p-1 bg-white/[0.04] border border-white/[0.08] rounded-full gap-0.5">
                  {(
                    [
                      { label: 'Today', value: 'today' },
                      { label: 'This week', value: 'week' },
                      { label: 'This month', value: 'month' },
                      { label: 'All time', value: 'all' },
                    ] as const
                  ).map((tab) => {
                    const isActive = timeframe === tab.value;
                    return (
                      <button
                        key={tab.value}
                        type="button"
                        onClick={() => setTimeframe(tab.value)}
                        className={`px-3 py-1 text-xs font-medium rounded-full transition-all duration-150 active:scale-[0.98] cursor-pointer whitespace-nowrap ${
                          isActive
                            ? 'text-white bg-white/[0.1] border border-white/[0.15] shadow-sm'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Current user sticky quick-jump pill */}
            {currentUserEntry && !currentUserRowVisible && (
              <div className="sticky top-2 z-30 mb-2 flex items-center justify-between rounded-xl border border-white/[0.12] bg-[#0c0e14]/90 px-4 py-2 text-xs text-zinc-300 backdrop-blur-md shadow-md">
                <span>Your rank: <strong className="text-white font-medium">{currentUserEntry.rank}</strong></span>
                <button
                  onClick={() => myRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                  className="rounded-lg bg-white/[0.08] hover:bg-white/[0.12] px-2.5 py-1 text-zinc-200 transition-colors cursor-pointer text-xs"
                >
                  Jump to you ↓
                </button>
              </div>
            )}

            {/* Leaderboard Table */}
            {contenders.length > 0 && (
              <div className="w-full bg-white/[0.02] border border-white/[0.08] rounded-2xl overflow-hidden divide-y divide-white/[0.06] shadow-sm">
                {/* Column Headers in Muted Plain Words */}
                <div className="px-4 sm:px-6 py-3 bg-white/[0.01] text-xs font-normal text-zinc-400 flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="w-7 text-left">#</span>
                    {hasAnyRealDelta && (
                      <span className="hidden sm:inline-block w-8 text-center text-[11px] text-zinc-500">Delta</span>
                    )}
                    <span>Scholar</span>
                  </div>
                  <div className="hidden sm:block w-36 text-center shrink-0">
                    <span>Tier</span>
                  </div>
                  <div className="text-right shrink-0 sm:w-32">
                    <span>Focus time</span>
                  </div>
                </div>

                {/* Roster Rows */}
                {contenders.map((row, idx) => {
                  if (!row) return null;

                  try {
                    const actualRank = idx + 1;
                    const isCurrentUser = checkIsCurrentUser(row);

                    const hoursStudied = (Number(row.total_seconds) || 0) / 3600;
                    let calculatedTierName = "Bronze I";
                    if (hoursStudied >= 10) calculatedTierName = "Silver I";
                    else if (hoursStudied >= 5) calculatedTierName = "Bronze III";
                    else if (hoursStudied >= 2) calculatedTierName = "Bronze II";

                    let tierConfig = getRankFromRp(0);
                    if (isCurrentUser && userRank) {
                      tierConfig = getMonthlyRankTierConfig(0, userRank.name);
                    } else {
                      const finalRankName = row.rank_title ? String(row.rank_title) : calculatedTierName;
                      tierConfig = getMonthlyRankTierConfig(row.total_seconds, finalRankName);
                    }

                    // Format tier name into muted sentence case (e.g., "Bronze I", "Silver II")
                    const rawTierTitle = String(tierConfig.name || 'Bronze I');
                    const displayTierSentence = rawTierTitle.replace(/\b[a-zA-Z]+\b/g, (w) => {
                      if (/^(I|II|III|IV|V)$/i.test(w)) return w.toUpperCase();
                      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
                    });

                    const displayName = String(row.display_name || row.name || row.username || 'Scholar');
                    const handle = row.username ? String(row.username) : displayName.toLowerCase().replace(/\s+/g, '');
                    const { h, m } = parseTimeHoursMinutes(Number(row.total_seconds) || 0);
                    const movement = getRankDelta(String(row.user_id), actualRank, timeframe);
                    const staggerDelay = idx < 10 ? idx * 30 : 0;
                    const isZeroFocus = Number(row.total_seconds) <= 0;

                    return (
                      <div
                        key={row.user_id}
                        ref={isCurrentUser ? myRowRef : null}
                        className={`flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 transition-all duration-150 cursor-default group ${
                          isCurrentUser
                            ? 'border-l-2 border-l-[var(--tier-accent)] bg-[var(--tier-accent)]/[0.04]'
                            : 'border-l-2 border-l-transparent hover:bg-white/[0.03]'
                        }`}
                        style={{
                          animation: 'listRowFadeSlide 0.25s ease-out both',
                          animationDelay: `${staggerDelay}ms`,
                        }}
                      >
                        {/* Rank Numeral + Optional Delta + Scholar Info */}
                        <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                          {/* Rank Numeral (without "#", top 3 tinted gold/silver/bronze) */}
                          <span
                            className={`w-7 text-left font-mono text-xs sm:text-sm shrink-0 flex items-center ${
                              actualRank === 1
                                ? 'text-amber-400 font-semibold'
                                : actualRank === 2
                                ? 'text-zinc-300 font-medium'
                                : actualRank === 3
                                ? 'text-amber-600 font-medium'
                                : 'text-zinc-500 font-normal'
                            }`}
                          >
                            <span>{actualRank}</span>
                            {actualRank === 1 && <span className="ml-1 text-xs">👑</span>}
                          </span>

                          {/* Delta column rendered only if at least one row has a real delta */}
                          {hasAnyRealDelta && (
                            <div className="hidden sm:flex w-8 items-center justify-center shrink-0">
                              {movement.delta > 0 ? (
                                <span className="text-emerald-400 font-medium text-xs">↑{movement.delta}</span>
                              ) : movement.delta < 0 ? (
                                <span className="text-rose-400 font-medium text-xs">↓{Math.abs(movement.delta)}</span>
                              ) : null}
                            </div>
                          )}

                          {/* Avatar */}
                          <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 flex items-center justify-center border border-white/10 bg-[#0c0e14]">
                            {row.avatar_url ? (
                              <img
                                src={row.avatar_url}
                                alt={displayName}
                                className="w-full h-full object-cover rounded-full"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className={`w-full h-full flex items-center justify-center font-medium bg-gradient-to-br ${getTierAvatarGradient(tierConfig.tier)} text-white text-[11px]`}>
                                {(displayName || 'S').trim().charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>

                          {/* Name + Handle */}
                          <div className="min-w-0 flex flex-col justify-center">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="font-medium text-white/90 text-sm tracking-tight truncate">
                                {displayName}
                              </span>
                              {isCurrentUser && (
                                <span className="text-[10px] text-zinc-400 font-normal px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] ml-1 shrink-0">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-zinc-400 truncate mt-0.5 font-normal">
                              @{handle}
                            </span>
                          </div>
                        </div>

                        {/* Tier Column: slightly smaller crest + muted sentence-case tier name */}
                        <div className="hidden sm:flex w-36 items-center justify-center shrink-0 gap-2">
                          <RankCrestBadge
                            tier={tierConfig.tier as RankTierName}
                            division={tierConfig.division as RankDivision}
                            size={24}
                          />
                          <span className="text-xs text-zinc-400 font-normal truncate">
                            {displayTierSentence}
                          </span>
                        </div>

                        {/* Focus time: right-aligned display numerals with smaller, dimmer units */}
                        <div className="w-24 sm:w-32 text-right shrink-0 flex items-baseline justify-end">
                          {isZeroFocus ? (
                            <span className="text-xs text-zinc-500 font-mono">0h 0m</span>
                          ) : (
                            <>
                              <span className="font-hud font-bold text-white text-base sm:text-lg">{h}</span>
                              <span className="text-[11px] text-zinc-400 font-normal ml-0.5 mr-1.5">h</span>
                              <span className="font-hud font-bold text-white text-base sm:text-lg">{m}</span>
                              <span className="text-[11px] text-zinc-400 font-normal ml-0.5">m</span>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  } catch (err) {
                    console.error("Leaderboard row render crash:", err, row);
                    return null;
                  }
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


