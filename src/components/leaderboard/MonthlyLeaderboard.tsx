'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useAuth } from '../../context/AuthContext';
import { useStudy } from '../../context/StudyContext';
import { getSupabase } from '../../lib/supabase';
import { getRankBadgePath, getRankTier, getRankConfigByTitle } from '../../lib/rankedSystem';
import { getLevelFromLifetimeXP } from '../../lib/gamification';
import { LeaderboardEntry } from '../../types';
import { Trophy, Clock, ArrowUp, Sparkles, AlertCircle } from 'lucide-react';

export function formatStudyTime(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.round(totalSeconds || 0));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

/**
 * Resolves the display rank tier label from row data.
 * Prevents scholar titles (e.g. "Novice Scholar") from appearing in the rank shield label,
 * ensuring valid 23-rank monthly tiers (e.g. "BRONZE I", "SILVER II", "GOLD I").
 */
export function getMonthlyRankTierTitle(rankTitle?: string, totalSeconds?: number): string {
  const clean = (rankTitle || '').trim().toLowerCase();
  
  // If the stored title was accidentally a scholar prestige title rather than a monthly rank
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
    // 1 min focus = 1 RP
    const rpFromMinutes = totalSeconds ? Math.floor(totalSeconds / 60) : 0;
    return getRankTier(rpFromMinutes).fullTitle;
  }

  // Resolve against 23-rank hierarchy (e.g. "Bronze 1" -> "BRONZE I", "Diamond 2" -> "DIAMOND II")
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
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as start of week
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
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Intersection observer state to detect whether current user's row is visible in the viewport
  const currentUserRowRef = useRef<HTMLDivElement | null>(null);
  const [isCurrentUserRowVisible, setIsCurrentUserRowVisible] = useState<boolean>(true);

  // Compute seasonal tracker line and subtext dynamically based on timeframe
  const { trackerText, subtext, emptyText } = useMemo(() => {
    const now = new Date();
    const m = now.toLocaleString('en-US', { month: 'long' }).toUpperCase();
    const y = now.getFullYear();

    switch (timeframe) {
      case 'today':
        return {
          trackerText: '// DAILY STANDINGS',
          subtext: 'Rankings determined by focus hours logged today.',
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
    if (leaderboard.length === 0) {
      setIsLoading(true);
    }
    setIsFetching(true);
    setFetchError(null);

    const supabase = getSupabase();
    let entries: LeaderboardEntry[] = [];
    let rpcSucceeded = false;

    if (supabase) {
      try {
        // Call RPC get_leaderboard with timeframe parameter
        let res = await supabase.rpc('get_leaderboard', { timeframe });
        if (res.error && timeframe === 'month') {
          // Backward compatibility fallback to get_monthly_leaderboard if get_leaderboard is not yet deployed
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
            is_current_user: Boolean(row.is_current_user || (user?.id && row.user_id === user.id)),
          }));
        } else if (res.error) {
          console.warn('[Leaderboard] RPC get_leaderboard notice:', res.error.message);
        }
      } catch (err: any) {
        console.warn('[Leaderboard] RPC get_leaderboard call error:', err);
      }
    }

    // Graceful fallback for local development, offline mode, or unmigrated Supabase database:
    if (!rpcSucceeded) {
      try {
        if (supabase && user?.id && !user.id.startsWith('user-scholar')) {
          const filterStartDate = getFilterStartDate(timeframe);

          let query = supabase
            .from('study_sessions')
            .select('user_id, duration_seconds, started_at');

          if (filterStartDate) {
            query = query.gte('started_at', filterStartDate.toISOString());
          }

          const { data: dbSessions } = await query;

          if (dbSessions && dbSessions.length > 0) {
            // Aggregate totals by user_id
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
                is_current_user: p.id === user?.id,
              }));
              entries.sort((a, b) => b.total_seconds - a.total_seconds);
            }
          }
        }
      } catch (fallbackErr) {
        console.warn('[Leaderboard] Fallback query error:', fallbackErr);
      }

      // If still empty and user has logged sessions in current state, include user's local sessions
      if (entries.length === 0 && user?.id) {
        const filterStartDate = getFilterStartDate(timeframe);

        const currentPeriodSeconds = sessions
          .filter((s) => !filterStartDate || new Date(s.startTime).getTime() >= filterStartDate.getTime())
          .reduce((sum, s) => sum + (s.durationSeconds || 0), 0);

        if (currentPeriodSeconds > 0) {
          entries = [
            {
              user_id: user.id,
              name: user.displayName || user.name || 'You',
              display_name: user.displayName || user.name || 'You',
              username: user.username || null,
              avatar_url: user.avatarUrl || null,
              level: user.level,
              lifetime_xp: Number(user.lifetime_xp ?? user.lifetimeXp ?? user.xp ?? 0),
              rank_title: user.rank_title || 'Bronze I',
              total_seconds: currentPeriodSeconds,
              is_current_user: true,
            },
          ];
        }
      }
    }

    setLeaderboard(entries);
    setIsLoading(false);
    setIsFetching(false);
  }, [timeframe, user?.id, user?.displayName, user?.name, user?.username, user?.avatarUrl, user?.lifetime_xp, user?.lifetimeXp, user?.xp, user?.rank_title, user?.level, sessions]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Find current user's entry and ranking index
  const currentUserEntry = useMemo(() => {
    if (!user?.id) return null;
    const index = leaderboard.findIndex((item) => item.is_current_user || item.user_id === user.id);
    if (index === -1) return null;
    return {
      entry: leaderboard[index],
      rankIndex: index,
    };
  }, [leaderboard, user?.id]);

  // Setup IntersectionObserver on current user's row in the list
  useEffect(() => {
    if (!isActiveTab) {
      setIsCurrentUserRowVisible(true);
      return;
    }

    const target = currentUserRowRef.current;
    if (!target) {
      setIsCurrentUserRowVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsCurrentUserRowVisible(entry.isIntersecting);
      },
      {
        threshold: 0.1,
      }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [leaderboard, currentUserEntry, isActiveTab]);

  // Smooth scroll to user row when clicking the sticky bottom bar
  const scrollToCurrentUser = () => {
    currentUserRowRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  };

  return (
    <div
      className={`w-full text-white font-sans ${
        isEmbedded
          ? 'max-w-4xl mx-auto flex flex-col gap-5 py-4'
          : 'bg-[#05070a] min-h-screen p-6 sm:p-10 flex flex-col items-center'
      }`}
    >
      <div className="w-full max-w-4xl flex flex-col gap-6 relative">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-white/[0.06]">
          <div className="flex flex-col gap-1">
            <div className="text-xs font-mono text-amber-500/90 tracking-widest uppercase">
              {trackerText}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white uppercase">
              LEADERBOARD
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 leading-relaxed">
              {subtext}
            </p>
          </div>

          {/* Timeframe Selector Tabs */}
          <div className="inline-flex items-center p-1 bg-white/[0.03] border border-white/[0.08] rounded-lg gap-1 self-start sm:self-auto flex-shrink-0">
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
                      ? 'px-3 py-1.5 text-xs font-mono font-medium text-white bg-white/[0.08] border border-white/[0.1] rounded-md shadow-sm transition-all cursor-pointer'
                      : 'px-3 py-1.5 text-xs font-mono font-medium text-zinc-400 hover:text-white transition-colors rounded-md cursor-pointer'
                  }
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </header>

        {/* Single Unified Container (Like TODO LIST panel) */}
        <div
          className={`w-full bg-[#0c0e14] border border-white/[0.08] rounded-xl overflow-hidden shadow-2xl divide-y divide-white/[0.05] transition-opacity duration-200 ${
            isFetching ? 'opacity-60' : 'opacity-100'
          }`}
        >
          {/* Table Header Bar */}
          <div className="px-6 py-2.5 bg-white/[0.02] text-[11px] font-mono uppercase tracking-wider text-zinc-500 flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <span className="w-10 flex-shrink-0 text-left">#</span>
              <span>SCHOLAR</span>
            </div>
            <div className="w-36 sm:w-44 flex items-center justify-center flex-shrink-0">
              <span>TIER</span>
            </div>
            <div className="w-20 sm:w-24 text-right flex-shrink-0">
              <span>TIME</span>
            </div>
          </div>

          {/* Loading Skeleton */}
          {isLoading ? (
            <div className="divide-y divide-white/[0.05]">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="px-6 py-3.5 flex items-center justify-between animate-pulse"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0 pr-3">
                    <div className="w-10 h-4 bg-white/[0.05] rounded" />
                    <div className="flex flex-col gap-1.5 min-w-0">
                      <div className="w-28 sm:w-36 h-4 bg-white/[0.05] rounded" />
                      <div className="w-20 sm:w-24 h-3 bg-white/[0.03] rounded" />
                    </div>
                  </div>
                  <div className="w-36 sm:w-44 flex items-center justify-center gap-2">
                    <div className="w-7 h-7 bg-white/[0.05] rounded" />
                    <div className="w-16 h-3 bg-white/[0.04] rounded" />
                  </div>
                  <div className="w-20 sm:w-24 flex justify-end">
                    <div className="w-14 h-4 bg-white/[0.05] rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : leaderboard.length === 0 ? (
            /* Empty State */
            <div className="p-10 text-center flex flex-col items-center justify-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-1">
                <Clock className="w-5 h-5 stroke-[2]" />
              </div>
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                NO SESSIONS RECORDED
              </h3>
              <p className="text-xs text-zinc-400 max-w-md">
                {emptyText}
              </p>
            </div>
          ) : (
            /* Row Design & Alignment */
            leaderboard.map((row, index) => {
              const isCurrentUser = Boolean(
                row.is_current_user ||
                (user?.id && String(row.user_id) === String(user.id)) ||
                (user?.username && row.username && user.username.toLowerCase() === row.username.toLowerCase())
              );

              const rankTierTitle = getMonthlyRankTierTitle(row.rank_title, row.total_seconds);
              const rankBadgePath = getRankBadgePath(rankTierTitle);
              const displayName = row.display_name || row.name || row.username || 'Scholar';
              const handle = row.username || displayName.toLowerCase().replace(/\s+/g, '');
              const level = row.level ?? getLevelFromLifetimeXP(row.lifetime_xp || 0);

              return (
                <div
                  key={row.user_id || index}
                  ref={isCurrentUser ? currentUserRowRef : undefined}
                  className={`px-6 py-3.5 flex items-center justify-between transition-colors ${
                    isCurrentUser
                      ? 'bg-amber-500/[0.05] border-l-2 border-l-amber-500 hover:bg-amber-500/[0.08]'
                      : 'hover:bg-white/[0.02]'
                  }`}
                >
                  {/* LEFT SECTION: Rank + Identity */}
                  <div className="flex items-center gap-3 flex-1 min-w-0 pr-3">
                    {/* Rank Number */}
                    <div className="w-10 flex-shrink-0 text-left">
                      {index === 0 ? (
                        <span className="text-amber-400 font-mono font-bold text-base">#1</span>
                      ) : index === 1 ? (
                        <span className="text-zinc-300 font-mono font-semibold text-sm">#2</span>
                      ) : index === 2 ? (
                        <span className="text-amber-600 font-mono font-semibold text-sm">#3</span>
                      ) : (
                        <span className="text-zinc-500 font-mono text-sm">#{index + 1}</span>
                      )}
                    </div>

                    {/* Identity Group (Display Name + handle & level) */}
                    <div className="flex flex-col min-w-0 justify-center">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-medium text-white text-sm tracking-tight truncate">
                          {displayName}
                        </span>
                        {isCurrentUser && (
                          <span className="text-[10px] font-mono text-amber-400/80 uppercase ml-2 shrink-0">
                            (YOU)
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-mono text-zinc-500 truncate mt-0.5">
                        @{handle} · Lv. {level}
                      </span>
                    </div>
                  </div>

                  {/* CENTER SECTION (Tier & Badge) */}
                  <div className="w-36 sm:w-44 flex items-center justify-center flex-shrink-0">
                    <Image
                      src={rankBadgePath}
                      alt={rankTierTitle}
                      width={28}
                      height={28}
                      className="w-7 h-7 object-contain flex-shrink-0"
                    />
                    <span className="text-[11px] font-mono text-zinc-400 tracking-wider uppercase ml-2.5 truncate">
                      {rankTierTitle}
                    </span>
                  </div>

                  {/* RIGHT SECTION (Focus Time) */}
                  <div className="w-20 sm:w-24 text-right flex-shrink-0 text-sm font-mono font-medium text-zinc-200 tracking-wide">
                    {formatStudyTime(row.total_seconds)}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Sticky Pinned User Standing Strip (Displays ONLY when actively viewing Leaderboard AND user's row is not in viewport) */}
        {isActiveTab && !isCurrentUserRowVisible && currentUserEntry && (
          <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-4xl z-30 animate-in slide-in-from-bottom-3 duration-200">
            <div className="w-full flex flex-col">
              <div className="text-[10px] font-mono uppercase tracking-widest text-amber-400 mb-1.5 pl-3 font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span>YOUR CURRENT STANDING · CLICK TO JUMP</span>
              </div>
              <div
                onClick={scrollToCurrentUser}
                className="w-full bg-[#0c0e14] border border-amber-500/40 rounded-xl overflow-hidden shadow-2xl cursor-pointer hover:border-amber-400 transition-all"
                title="Click to jump to your row"
              >
                {(() => {
                  const entry = currentUserEntry.entry;
                  const rankIndex = currentUserEntry.rankIndex;
                  const rankTierTitle = getMonthlyRankTierTitle(entry.rank_title, entry.total_seconds);
                  const rankBadgePath = getRankBadgePath(rankTierTitle);
                  const displayName = entry.display_name || entry.name || entry.username || 'Scholar';
                  const handle = entry.username || displayName.toLowerCase().replace(/\s+/g, '');
                  const level = entry.level ?? getLevelFromLifetimeXP(entry.lifetime_xp || 0);

                  return (
                    <div className="px-6 py-3.5 flex items-center justify-between bg-amber-500/[0.05] border-l-2 border-l-amber-500">
                      {/* LEFT SECTION */}
                      <div className="flex items-center gap-3 flex-1 min-w-0 pr-3">
                        <div className="w-10 flex-shrink-0 text-left">
                          {rankIndex === 0 ? (
                            <span className="text-amber-400 font-mono font-bold text-base">#1</span>
                          ) : rankIndex === 1 ? (
                            <span className="text-zinc-300 font-mono font-semibold text-sm">#2</span>
                          ) : rankIndex === 2 ? (
                            <span className="text-amber-600 font-mono font-semibold text-sm">#3</span>
                          ) : (
                            <span className="text-zinc-500 font-mono text-sm">#{rankIndex + 1}</span>
                          )}
                        </div>

                        <div className="flex flex-col min-w-0 justify-center">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="font-medium text-white text-sm tracking-tight truncate">
                              {displayName}
                            </span>
                            <span className="text-[10px] font-mono text-amber-400/80 uppercase ml-2 shrink-0">
                              (YOU)
                            </span>
                          </div>
                          <span className="text-xs font-mono text-zinc-500 truncate mt-0.5">
                            @{handle} · Lv. {level}
                          </span>
                        </div>
                      </div>

                      {/* CENTER SECTION */}
                      <div className="w-36 sm:w-44 flex items-center justify-center flex-shrink-0">
                        <Image
                          src={rankBadgePath}
                          alt={rankTierTitle}
                          width={28}
                          height={28}
                          className="w-7 h-7 object-contain flex-shrink-0"
                        />
                        <span className="text-[11px] font-mono text-zinc-400 tracking-wider uppercase ml-2.5 truncate">
                          {rankTierTitle}
                        </span>
                      </div>

                      {/* RIGHT SECTION */}
                      <div className="w-20 sm:w-24 text-right flex-shrink-0 text-sm font-mono font-medium text-zinc-200 tracking-wide">
                        {formatStudyTime(entry.total_seconds)}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
