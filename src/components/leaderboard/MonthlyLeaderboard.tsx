'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Image from 'next/image';
import confetti from 'canvas-confetti';
import { useAuth } from '../../context/AuthContext';
import { useStudy } from '../../context/StudyContext';
import { getSupabase } from '../../lib/supabase';
import { getRankBadgePath, getRankTier, getRankConfigByTitle } from '../../lib/rankedSystem';
import { getLevelFromLifetimeXP } from '../../lib/gamification';
import { soundFx } from '../../lib/audio';
import { LeaderboardEntry } from '../../types';
import {
  Trophy,
  Clock,
  ArrowUp,
  Sparkles,
  Crown,
  Flame,
  Zap,
  Swords,
  Medal,
  Search,
  X,
  Target,
  Users,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

export function formatStudyTime(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.round(totalSeconds || 0));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

/**
 * Resolves the display rank tier label from row data.
 * Prevents scholar titles from appearing in rank badge label.
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

function getAvatarGradient(name: string): string {
  const gradients = [
    'from-amber-500 to-orange-600',
    'from-cyan-500 to-blue-600',
    'from-purple-500 to-indigo-600',
    'from-emerald-500 to-teal-600',
    'from-rose-500 to-pink-600',
    'from-violet-500 to-fuchsia-600',
    'from-yellow-400 to-amber-600',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
}

interface MonthlyLeaderboardProps {
  isEmbedded?: boolean;
  isActiveTab?: boolean;
  onStartTimer?: () => void;
}

export function MonthlyLeaderboard({
  isEmbedded = false,
  isActiveTab = true,
  onStartTimer,
}: MonthlyLeaderboardProps) {
  const { user } = useAuth();
  const { sessions } = useStudy();

  const [timeframe, setTimeframe] = useState<LeaderboardTimeframe>('month');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'all' | 'top10'>('all');

  const currentUserRowRef = useRef<HTMLDivElement | null>(null);
  const [isCurrentUserRowVisible, setIsCurrentUserRowVisible] = useState<boolean>(true);

  const userRef = useRef(user);
  userRef.current = user;

  const sessionsRef = useRef(sessions);
  sessionsRef.current = sessions;

  const inFlightRef = useRef(false);

  // Compute seasonal tracker line and subtext
  const { trackerText, subtext, emptyText } = useMemo(() => {
    const now = new Date();
    const m = now.toLocaleString('en-US', { month: 'long' }).toUpperCase();
    const y = now.getFullYear();

    switch (timeframe) {
      case 'today':
        return {
          trackerText: '// DAILY STANDINGS',
          subtext: 'Real-time focus sprint for today. Push for the podium!',
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
          subtext: 'Official monthly ranked championship. Climb divisions and claim glory.',
          emptyText: 'No sessions recorded this month yet. Start the timer to claim #1!',
        };
      case 'all':
        return {
          trackerText: '// HALL OF FAME · ALL-TIME',
          subtext: 'Lifetime focus legends. Immortality earned one hour at a time.',
          emptyText: 'No sessions recorded yet. Start the timer to claim #1!',
        };
    }
  }, [timeframe]);

  // Fetch leaderboard data
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

      // Fallback
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

  // Current user entry and standing info
  const currentUserEntry = useMemo(() => {
    if (!user?.id) return null;
    const index = leaderboard.findIndex((item) => item.is_current_user || item.user_id === user.id);
    if (index === -1) return null;
    return {
      entry: leaderboard[index],
      rankIndex: index,
    };
  }, [leaderboard, user?.id]);

  // Target ahead to overtake
  const overtakeRival = useMemo(() => {
    if (!currentUserEntry || currentUserEntry.rankIndex === 0) return null;
    const rival = leaderboard[currentUserEntry.rankIndex - 1];
    if (!rival) return null;
    const diffSeconds = Math.max(0, rival.total_seconds - currentUserEntry.entry.total_seconds);
    const progressPercent = Math.min(
      99,
      Math.max(5, Math.round((currentUserEntry.entry.total_seconds / Math.max(1, rival.total_seconds)) * 100))
    );
    return {
      rival,
      diffSeconds,
      diffFormatted: formatStudyTime(diffSeconds),
      progressPercent,
      rivalRank: currentUserEntry.rankIndex, // 1-indexed rank of rival
    };
  }, [currentUserEntry, leaderboard]);

  // Lead ahead of #2 if user is #1
  const leadOverSecond = useMemo(() => {
    if (!currentUserEntry || currentUserEntry.rankIndex !== 0 || leaderboard.length < 2) return null;
    const runnerUp = leaderboard[1];
    const leadSeconds = Math.max(0, currentUserEntry.entry.total_seconds - runnerUp.total_seconds);
    return {
      runnerUp,
      leadFormatted: formatStudyTime(leadSeconds),
    };
  }, [currentUserEntry, leaderboard]);

  // Top 3 for Podium
  const topThree = useMemo(() => {
    return {
      first: leaderboard[0] || null,
      second: leaderboard[1] || null,
      third: leaderboard[2] || null,
    };
  }, [leaderboard]);

  // Filtered leaderboard entries for the table
  const displayedEntries = useMemo(() => {
    let list = leaderboard;
    if (filterMode === 'top10') {
      list = list.slice(0, 10);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((row) => {
        const name = (row.display_name || row.name || '').toLowerCase();
        const username = (row.username || '').toLowerCase();
        return name.includes(q) || username.includes(q);
      });
    }
    return list;
  }, [leaderboard, filterMode, searchQuery]);

  // Aggregate stats for marquee
  const seasonalStats = useMemo(() => {
    const totalSecs = leaderboard.reduce((acc, row) => acc + row.total_seconds, 0);
    const topSeconds = leaderboard[0]?.total_seconds || 1;
    return {
      totalTimeFormatted: formatStudyTime(totalSecs),
      activeScholarsCount: leaderboard.length,
      topSeconds,
    };
  }, [leaderboard]);

  // Setup IntersectionObserver for sticky user bottom dock
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
      { threshold: 0.1 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [leaderboard, currentUserEntry, isActiveTab]);

  const scrollToCurrentUser = () => {
    currentUserRowRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  };

  // Celebration Confetti Cannon
  const triggerConfetti = (e?: React.MouseEvent) => {
    soundFx.playReactionPop();
    const x = e ? e.clientX / window.innerWidth : 0.5;
    const y = e ? e.clientY / window.innerHeight : 0.4;
    confetti({
      particleCount: 40,
      spread: 70,
      origin: { x, y },
      colors: ['#F59E0B', '#FBBF24', '#F43F5E', '#8B5CF6', '#10B981', '#38BDF8'],
    });
  };

  const cheerChampion = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundFx.playMilestoneBell();
    confetti({
      particleCount: 70,
      spread: 90,
      origin: { x: 0.5, y: 0.35 },
      colors: ['#F59E0B', '#FBBF24', '#FFFFFF', '#FDE047'],
    });
  };

  return (
    <div
      className={`w-full text-white font-sans ${
        isEmbedded
          ? 'max-w-5xl mx-auto flex flex-col gap-6 py-4'
          : 'bg-[#05070a] min-h-screen p-4 sm:p-8 flex flex-col items-center'
      }`}
    >
      <div className="w-full max-w-5xl flex flex-col gap-6 relative">
        {/* HEADER SECTION WITH CYBER AMBIENCE */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-5 pb-3 border-b border-white/[0.08]">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase bg-amber-500/10 text-amber-400 border border-amber-500/25">
                <Flame className="w-3 h-3 text-amber-400 fill-amber-400 animate-pulse" />
                {trackerText}
              </span>
              <span className="text-[11px] font-mono text-zinc-500 tracking-wider">
                • {seasonalStats.activeScholarsCount} COMPETITORS
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white uppercase flex items-center gap-3">
              <span>LEADERBOARD</span>
              <span className="text-sm font-hud font-bold normal-case px-2.5 py-0.5 rounded-md bg-gradient-to-r from-amber-500/20 to-yellow-500/10 text-amber-300 border border-amber-500/30">
                ARENA
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl leading-relaxed">
              {subtext}
            </p>
          </div>

          {/* Timeframe Switcher Tabs */}
          <div className="inline-flex items-center p-1 bg-white/[0.03] backdrop-blur-md border border-white/[0.08] rounded-xl gap-1 self-start md:self-auto flex-shrink-0 shadow-lg">
            {(
              [
                { label: 'TODAY', value: 'today', icon: Zap },
                { label: 'THIS WEEK', value: 'week', icon: TrendingUp },
                { label: 'THIS MONTH', value: 'month', icon: Trophy },
                { label: 'ALL TIME', value: 'all', icon: Crown },
              ] as const
            ).map((tab) => {
              const isActive = timeframe === tab.value;
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => {
                    soundFx.playReactionPop();
                    setTimeframe(tab.value);
                  }}
                  className={
                    isActive
                      ? 'px-3.5 py-2 text-xs font-mono font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 rounded-lg shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-all cursor-pointer flex items-center gap-1.5'
                      : 'px-3.5 py-2 text-xs font-mono font-medium text-zinc-400 hover:text-white hover:bg-white/[0.03] transition-all rounded-lg cursor-pointer flex items-center gap-1.5'
                  }
                >
                  <TabIcon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-zinc-500'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </header>

        {/* SEASONAL DOPAMINE STATS TICKER */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-md flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Total Focus</div>
              <div className="text-sm font-mono font-bold text-white truncate">
                {seasonalStats.totalTimeFormatted}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-md flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 flex-shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Active Rivals</div>
              <div className="text-sm font-mono font-bold text-white truncate">
                {seasonalStats.activeScholarsCount} Scholars
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-md flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400 flex-shrink-0">
              <Crown className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Current Monarch</div>
              <div className="text-sm font-mono font-bold text-yellow-300 truncate">
                {topThree.first ? topThree.first.display_name || topThree.first.name : 'Unclaimed'}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-md flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Top Study Pace</div>
              <div className="text-sm font-mono font-bold text-purple-300 truncate">
                {topThree.first ? formatStudyTime(topThree.first.total_seconds) : '0h 0m'}
              </div>
            </div>
          </div>
        </div>

        {/* DOPAMINE BATTLE GROUND / OVERTAKE RADAR CARD */}
        {currentUserEntry ? (
          overtakeRival ? (
            /* User has someone directly ahead */
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-950/30 via-[#0f131a] to-amber-950/20 border border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.1)] flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 flex-shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                  <Swords className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">
                      OVERTAKE RADAR
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400">
                      Rank #{currentUserEntry.rankIndex + 1} ➔ #{overtakeRival.rivalRank}
                    </span>
                  </div>
                  <div className="text-sm sm:text-base font-semibold text-white mt-0.5">
                    Log <span className="text-amber-300 font-mono font-bold">{overtakeRival.diffFormatted}</span> to overtake{' '}
                    <span className="text-amber-200">
                      {overtakeRival.rival.display_name || overtakeRival.rival.name}
                    </span>{' '}
                    for #{overtakeRival.rivalRank}!
                  </div>
                  {/* Progress bar towards rival */}
                  <div className="mt-2 flex items-center gap-2.5 max-w-md">
                    <div className="w-full h-2 rounded-full bg-white/[0.08] overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500"
                        style={{ width: `${overtakeRival.progressPercent}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-mono font-bold text-amber-400 flex-shrink-0">
                      {overtakeRival.progressPercent}%
                    </span>
                  </div>
                </div>
              </div>

              {onStartTimer && (
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playReactionPop();
                    onStartTimer();
                  }}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-mono font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all active:scale-95 flex items-center justify-center gap-2 self-start md:self-auto flex-shrink-0 cursor-pointer"
                >
                  <Zap className="w-4 h-4 fill-black" />
                  <span>Start Focus Session</span>
                </button>
              )}
            </div>
          ) : leadOverSecond ? (
            /* User is #1 Defender */
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-yellow-950/40 via-[#0f131a] to-amber-950/30 border border-yellow-500/40 shadow-[0_0_35px_rgba(234,179,8,0.15)] flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center text-yellow-300 flex-shrink-0 shadow-[0_0_20px_rgba(234,179,8,0.35)]">
                  <Crown className="w-6 h-6 animate-bounce" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-yellow-400 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" />
                    <span>DEFENDING APEX CHAMPION</span>
                  </div>
                  <div className="text-sm sm:text-base font-semibold text-white mt-0.5">
                    You hold the #1 throne with a{' '}
                    <span className="text-yellow-300 font-mono font-bold">{leadOverSecond.leadFormatted} lead</span> over #2!
                  </div>
                  <div className="text-xs text-zinc-400 mt-0.5">
                    Keep your focus shield active so contenders can&apos;t steal your crown.
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={triggerConfetti}
                  className="px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-mono font-semibold text-yellow-300 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Celebrate</span>
                </button>
                {onStartTimer && (
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playReactionPop();
                      onStartTimer();
                    }}
                    className="px-4 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-mono font-bold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(234,179,8,0.4)] transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Flame className="w-4 h-4 fill-black" />
                    <span>Extend Lead</span>
                  </button>
                )}
              </div>
            </div>
          ) : null
        ) : (
          /* User not ranked yet */
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-950/30 via-[#0f131a] to-cyan-950/20 border border-cyan-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 flex-shrink-0">
                <Target className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-400">
                  SEASON STATUS · UNRANKED
                </div>
                <div className="text-sm sm:text-base font-semibold text-white mt-0.5">
                  Complete your first focus session today to claim a spot on the leaderboard!
                </div>
              </div>
            </div>

            {onStartTimer && (
              <button
                type="button"
                onClick={() => {
                  soundFx.playReactionPop();
                  onStartTimer();
                }}
                className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all cursor-pointer flex items-center gap-2 self-start md:self-auto"
              >
                <Zap className="w-4 h-4 fill-black" />
                <span>Enter The Arena</span>
              </button>
            )}
          </div>
        )}

        {/* TOP 3 OLYMPIC ESPORTS PODIUM */}
        {!isLoading && leaderboard.length >= 1 && (
          <div className="w-full flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <div className="text-[11px] font-mono uppercase tracking-widest text-zinc-400 flex items-center gap-1.5 font-semibold">
                <Medal className="w-3.5 h-3.5 text-amber-400" />
                <span>THE PODIUM OF GLORY</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">Top 3 Focus Legends</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 items-end">
              {/* RANK #2: SILVER RUNNER-UP (Left Column on Desktop) */}
              <div className="order-2 md:order-1 h-full">
                {topThree.second ? (
                  (() => {
                    const row = topThree.second;
                    const rankTierTitle = getMonthlyRankTierTitle(row.rank_title, row.total_seconds);
                    const rankBadgePath = getRankBadgePath(rankTierTitle);
                    const name = row.display_name || row.name || 'Scholar';
                    const handle = row.username || name.toLowerCase().replace(/\s+/g, '');
                    const level = row.level ?? getLevelFromLifetimeXP(row.lifetime_xp || 0);
                    const isUser = Boolean(
                      row.is_current_user || (user?.id && String(row.user_id) === String(user.id))
                    );

                    return (
                      <div className="h-full rounded-2xl bg-gradient-to-b from-slate-800/40 via-[#0e121a] to-[#0a0d13] border border-slate-400/30 p-5 flex flex-col items-center justify-between text-center relative overflow-hidden group hover:border-slate-300 transition-all shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                        {/* Ambient Silver Sheen */}
                        <div className="absolute -top-12 -left-12 w-28 h-28 rounded-full bg-slate-300/10 blur-2xl pointer-events-none" />

                        {/* Top Badge */}
                        <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-slate-300/10 border border-slate-300/30 text-slate-200 text-[10px] font-mono font-bold uppercase tracking-wider mb-3">
                          <span>🥈</span>
                          <span>#2 RUNNER-UP</span>
                        </div>

                        {/* Avatar */}
                        <div className="relative my-2">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-slate-400 to-slate-100 p-0.5 shadow-[0_0_20px_rgba(203,213,225,0.3)]">
                            <div className="w-full h-full rounded-full bg-[#0c1017] flex items-center justify-center overflow-hidden">
                              {row.avatar_url ? (
                                <img
                                  src={row.avatar_url}
                                  alt={name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div
                                  className={`w-full h-full flex items-center justify-center font-bold text-lg bg-gradient-to-br ${getAvatarGradient(
                                    name
                                  )} text-white`}
                                >
                                  {name.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                          </div>
                          {/* Mini Rank Badge floating */}
                          <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-black/80 border border-white/20 p-0.5 flex items-center justify-center">
                            <Image
                              src={rankBadgePath}
                              alt={rankTierTitle}
                              width={20}
                              height={20}
                              className="object-contain"
                            />
                          </div>
                        </div>

                        {/* Name & Handle */}
                        <div className="mt-2 min-w-0 w-full px-2">
                          <div className="font-bold text-white text-base truncate flex items-center justify-center gap-1.5">
                            <span className="truncate">{name}</span>
                            {isUser && (
                              <span className="text-[9px] font-mono text-slate-300 uppercase px-1 rounded bg-slate-400/20 shrink-0">
                                YOU
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-mono text-zinc-400 truncate mt-0.5">
                            @{handle} · Lv. {level}
                          </div>
                        </div>

                        {/* Time & Tier */}
                        <div className="mt-4 pt-3 border-t border-white/[0.06] w-full flex items-center justify-between px-2">
                          <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wide">
                            {rankTierTitle}
                          </span>
                          <span className="text-sm font-mono font-bold text-slate-200">
                            {formatStudyTime(row.total_seconds)}
                          </span>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="h-full min-h-[220px] rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center text-zinc-600 text-xs font-mono">
                    #2 UNCLAIMED
                  </div>
                )}
              </div>

              {/* RANK #1: THE APEX CHAMPION (Center, Elevated & Crowned) */}
              <div className="order-1 md:order-2 h-full -mt-2">
                {topThree.first ? (
                  (() => {
                    const row = topThree.first;
                    const rankTierTitle = getMonthlyRankTierTitle(row.rank_title, row.total_seconds);
                    const rankBadgePath = getRankBadgePath(rankTierTitle);
                    const name = row.display_name || row.name || 'Scholar';
                    const handle = row.username || name.toLowerCase().replace(/\s+/g, '');
                    const level = row.level ?? getLevelFromLifetimeXP(row.lifetime_xp || 0);
                    const isUser = Boolean(
                      row.is_current_user || (user?.id && String(row.user_id) === String(user.id))
                    );

                    return (
                      <div className="h-full rounded-2xl bg-gradient-to-b from-amber-600/30 via-yellow-950/20 to-[#0e1118] border-2 border-amber-400/50 p-6 flex flex-col items-center justify-between text-center relative overflow-hidden group shadow-[0_0_40px_rgba(245,158,11,0.25)] hover:border-amber-300 transition-all">
                        {/* Ambient Golden Rays */}
                        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full bg-amber-400/20 blur-3xl pointer-events-none" />

                        {/* Crown Header */}
                        <div className="flex flex-col items-center mb-1">
                          <Crown className="w-8 h-8 text-yellow-300 fill-yellow-400 drop-shadow-[0_0_12px_rgba(234,179,8,0.8)] animate-bounce" />
                          <div className="mt-1 flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-500/30 to-yellow-500/20 border border-amber-400/40 text-amber-200 text-[11px] font-mono font-extrabold uppercase tracking-widest shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                            <span>#1 APEX CHAMPION</span>
                          </div>
                        </div>

                        {/* Avatar */}
                        <div className="relative my-2">
                          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-300 to-amber-200 p-1 shadow-[0_0_30px_rgba(245,158,11,0.5)]">
                            <div className="w-full h-full rounded-full bg-[#0c1017] flex items-center justify-center overflow-hidden">
                              {row.avatar_url ? (
                                <img
                                  src={row.avatar_url}
                                  alt={name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div
                                  className={`w-full h-full flex items-center justify-center font-extrabold text-2xl bg-gradient-to-br ${getAvatarGradient(
                                    name
                                  )} text-white`}
                                >
                                  {name.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                          </div>
                          {/* Rank badge emblem */}
                          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-black/90 border border-amber-400/60 p-1 flex items-center justify-center shadow-lg">
                            <Image
                              src={rankBadgePath}
                              alt={rankTierTitle}
                              width={24}
                              height={24}
                              className="object-contain"
                            />
                          </div>
                        </div>

                        {/* Name & Handle */}
                        <div className="mt-2 min-w-0 w-full px-2">
                          <div className="font-extrabold text-lg text-white truncate flex items-center justify-center gap-1.5">
                            <span className="truncate">{name}</span>
                            {isUser && (
                              <span className="text-[10px] font-mono text-amber-300 uppercase px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 shrink-0">
                                YOU
                              </span>
                            )}
                          </div>
                          <div className="text-xs font-mono text-amber-200/80 truncate mt-0.5 font-medium">
                            @{handle} · Lv. {level}
                          </div>
                        </div>

                        {/* Focus Time Highlight */}
                        <div className="mt-4 pt-3 border-t border-amber-500/20 w-full flex items-center justify-between px-2">
                          <div className="text-left">
                            <div className="text-[10px] font-mono text-amber-400/80 uppercase">SEASON TIER</div>
                            <div className="text-xs font-mono font-bold text-white uppercase">{rankTierTitle}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] font-mono text-amber-400/80 uppercase">FOCUS TIME</div>
                            <div className="text-base font-mono font-black text-amber-300 flex items-center gap-1 justify-end">
                              <Flame className="w-4 h-4 fill-amber-400 text-amber-400" />
                              <span>{formatStudyTime(row.total_seconds)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Cheer button */}
                        <button
                          type="button"
                          onClick={cheerChampion}
                          className="mt-3 w-full py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Cheer Champion</span>
                        </button>
                      </div>
                    );
                  })()
                ) : (
                  <div className="h-full min-h-[250px] rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center text-zinc-600 text-xs font-mono">
                    #1 UNCLAIMED
                  </div>
                )}
              </div>

              {/* RANK #3: BRONZE CONTENDER (Right Column on Desktop) */}
              <div className="order-3 h-full">
                {topThree.third ? (
                  (() => {
                    const row = topThree.third;
                    const rankTierTitle = getMonthlyRankTierTitle(row.rank_title, row.total_seconds);
                    const rankBadgePath = getRankBadgePath(rankTierTitle);
                    const name = row.display_name || row.name || 'Scholar';
                    const handle = row.username || name.toLowerCase().replace(/\s+/g, '');
                    const level = row.level ?? getLevelFromLifetimeXP(row.lifetime_xp || 0);
                    const isUser = Boolean(
                      row.is_current_user || (user?.id && String(row.user_id) === String(user.id))
                    );

                    return (
                      <div className="h-full rounded-2xl bg-gradient-to-b from-amber-900/30 via-[#0e121a] to-[#0a0d13] border border-amber-700/30 p-5 flex flex-col items-center justify-between text-center relative overflow-hidden group hover:border-amber-600 transition-all shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                        {/* Ambient Bronze Sheen */}
                        <div className="absolute -top-12 -right-12 w-28 h-28 rounded-full bg-amber-700/15 blur-2xl pointer-events-none" />

                        {/* Top Badge */}
                        <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-700/15 border border-amber-700/30 text-amber-300 text-[10px] font-mono font-bold uppercase tracking-wider mb-3">
                          <span>🥉</span>
                          <span>#3 CONTENDER</span>
                        </div>

                        {/* Avatar */}
                        <div className="relative my-2">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-700 via-amber-600 to-yellow-700 p-0.5 shadow-[0_0_20px_rgba(217,119,6,0.25)]">
                            <div className="w-full h-full rounded-full bg-[#0c1017] flex items-center justify-center overflow-hidden">
                              {row.avatar_url ? (
                                <img
                                  src={row.avatar_url}
                                  alt={name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div
                                  className={`w-full h-full flex items-center justify-center font-bold text-lg bg-gradient-to-br ${getAvatarGradient(
                                    name
                                  )} text-white`}
                                >
                                  {name.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                          </div>
                          {/* Mini Rank Badge */}
                          <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-black/80 border border-white/20 p-0.5 flex items-center justify-center">
                            <Image
                              src={rankBadgePath}
                              alt={rankTierTitle}
                              width={20}
                              height={20}
                              className="object-contain"
                            />
                          </div>
                        </div>

                        {/* Name & Handle */}
                        <div className="mt-2 min-w-0 w-full px-2">
                          <div className="font-bold text-white text-base truncate flex items-center justify-center gap-1.5">
                            <span className="truncate">{name}</span>
                            {isUser && (
                              <span className="text-[9px] font-mono text-amber-400 uppercase px-1 rounded bg-amber-500/20 shrink-0">
                                YOU
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-mono text-zinc-400 truncate mt-0.5">
                            @{handle} · Lv. {level}
                          </div>
                        </div>

                        {/* Time & Tier */}
                        <div className="mt-4 pt-3 border-t border-white/[0.06] w-full flex items-center justify-between px-2">
                          <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wide">
                            {rankTierTitle}
                          </span>
                          <span className="text-sm font-mono font-bold text-amber-300">
                            {formatStudyTime(row.total_seconds)}
                          </span>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="h-full min-h-[220px] rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center text-zinc-600 text-xs font-mono">
                    #3 UNCLAIMED
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* CONTROLS BAR: SEARCH & FILTER TABS */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search scholar by name or @handle..."
              className="w-full pl-9 pr-9 py-2 bg-white/[0.03] border border-white/[0.08] focus:border-amber-500/50 rounded-xl text-xs font-mono text-white placeholder-zinc-500 outline-none transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-white/10 text-white font-bold border border-white/20'
                  : 'bg-transparent text-zinc-400 hover:text-white'
              }`}
            >
              All Scholars ({leaderboard.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('top10')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                filterMode === 'top10'
                  ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                  : 'bg-transparent text-zinc-400 hover:text-white'
              }`}
            >
              Top 10 Leaders
            </button>
          </div>
        </div>

        {/* FULL LEADERBOARD TABLE */}
        <div
          className={`w-full bg-[#0c0e14] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl transition-opacity duration-200 ${
            isFetching ? 'opacity-60' : 'opacity-100'
          }`}
        >
          {/* Table Header Bar */}
          <div className="px-5 sm:px-6 py-3 bg-white/[0.02] border-b border-white/[0.06] text-[11px] font-mono uppercase tracking-wider text-zinc-500 flex items-center justify-between">
            <div className="flex items-center gap-3.5 flex-1 min-w-0">
              <span className="w-12 flex-shrink-0 text-left">RANK</span>
              <span>SCHOLAR</span>
            </div>
            <div className="hidden sm:flex w-36 sm:w-44 items-center justify-center flex-shrink-0">
              <span>SEASON TIER</span>
            </div>
            <div className="w-32 sm:w-44 flex items-center justify-end gap-3 flex-shrink-0 text-right">
              <span className="hidden md:inline text-[10px] text-zinc-500">PACE BAR</span>
              <span>FOCUS TIME</span>
            </div>
          </div>

          {/* Loading Skeleton */}
          {isLoading ? (
            <div className="divide-y divide-white/[0.04]">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="px-6 py-4 flex items-center justify-between animate-pulse">
                  <div className="flex items-center gap-3.5 flex-1 min-w-0 pr-3">
                    <div className="w-12 h-6 bg-white/[0.05] rounded-lg" />
                    <div className="w-10 h-10 rounded-full bg-white/[0.05]" />
                    <div className="flex flex-col gap-1.5 min-w-0">
                      <div className="w-32 sm:w-44 h-4 bg-white/[0.05] rounded" />
                      <div className="w-20 sm:w-28 h-3 bg-white/[0.03] rounded" />
                    </div>
                  </div>
                  <div className="hidden sm:flex w-36 sm:w-44 items-center justify-center gap-2">
                    <div className="w-8 h-8 bg-white/[0.05] rounded-full" />
                    <div className="w-20 h-3 bg-white/[0.04] rounded" />
                  </div>
                  <div className="w-28 sm:w-32 flex justify-end">
                    <div className="w-16 h-5 bg-white/[0.05] rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : displayedEntries.length === 0 ? (
            /* Empty State */
            <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-1 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                <Clock className="w-6 h-6 stroke-[2]" />
              </div>
              <h3 className="text-base font-bold text-white font-mono uppercase tracking-wider">
                {searchQuery ? 'NO MATCHING SCHOLARS FOUND' : 'NO SESSIONS RECORDED YET'}
              </h3>
              <p className="text-xs text-zinc-400 max-w-md">
                {searchQuery ? 'Try clearing your search query to see all ranks.' : emptyText}
              </p>
              {onStartTimer && !searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playReactionPop();
                    onStartTimer();
                  }}
                  className="mt-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-mono font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg active:scale-95"
                >
                  Start First Session
                </button>
              )}
            </div>
          ) : (
            /* Rows */
            <div className="divide-y divide-white/[0.04]">
              {displayedEntries.map((row, index) => {
                const actualRankIndex = leaderboard.findIndex((item) => item.user_id === row.user_id);
                const rankNum = actualRankIndex !== -1 ? actualRankIndex + 1 : index + 1;

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

                // Relative race percentage compared to #1
                const maxSeconds = seasonalStats.topSeconds || 1;
                const relativePercent = Math.min(100, Math.round((row.total_seconds / maxSeconds) * 100));

                return (
                  <div
                    key={row.user_id || index}
                    ref={isCurrentUser ? currentUserRowRef : undefined}
                    className={`px-5 sm:px-6 py-3.5 flex items-center justify-between transition-all duration-150 group ${
                      isCurrentUser
                        ? 'bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-l-4 border-l-amber-400 shadow-[inset_0_0_20px_rgba(245,158,11,0.05)]'
                        : 'hover:bg-white/[0.03]'
                    }`}
                  >
                    {/* LEFT SECTION: Rank Medal + Avatar + Identity */}
                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 pr-3">
                      {/* Rank Number / Medal Badge */}
                      <div className="w-10 sm:w-12 flex-shrink-0 text-left">
                        {rankNum === 1 ? (
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 shadow-[0_0_12px_rgba(245,158,11,0.5)] flex items-center justify-center">
                            <span className="text-black font-mono font-black text-xs">#1</span>
                          </div>
                        ) : rankNum === 2 ? (
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-slate-400 to-slate-200 p-0.5 shadow-[0_0_10px_rgba(203,213,225,0.4)] flex items-center justify-center">
                            <span className="text-black font-mono font-black text-xs">#2</span>
                          </div>
                        ) : rankNum === 3 ? (
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-700 to-amber-600 p-0.5 shadow-[0_0_10px_rgba(180,83,9,0.4)] flex items-center justify-center">
                            <span className="text-white font-mono font-black text-xs">#3</span>
                          </div>
                        ) : (
                          <span className="text-zinc-500 font-mono text-sm font-semibold pl-1">
                            #{rankNum < 10 ? `0${rankNum}` : rankNum}
                          </span>
                        )}
                      </div>

                      {/* Avatar with dynamic colored gradient fallback */}
                      <div className="relative flex-shrink-0">
                        <div
                          className={`w-10 h-10 rounded-full p-0.5 ${
                            rankNum === 1
                              ? 'bg-gradient-to-tr from-amber-400 to-yellow-300 shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                              : rankNum === 2
                              ? 'bg-gradient-to-tr from-slate-400 to-slate-200'
                              : rankNum === 3
                              ? 'bg-gradient-to-tr from-amber-700 to-amber-500'
                              : isCurrentUser
                              ? 'bg-amber-400/80'
                              : 'bg-white/10'
                          }`}
                        >
                          <div className="w-full h-full rounded-full bg-[#0c1017] flex items-center justify-center overflow-hidden">
                            {row.avatar_url ? (
                              <img
                                src={row.avatar_url}
                                alt={displayName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div
                                className={`w-full h-full flex items-center justify-center font-bold text-xs bg-gradient-to-br ${getAvatarGradient(
                                  displayName
                                )} text-white`}
                              >
                                {displayName.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Online/activity dot */}
                        {row.total_seconds > 0 && (
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0c1017]" />
                        )}
                      </div>

                      {/* Identity Details */}
                      <div className="flex flex-col min-w-0 justify-center">
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className={`font-semibold text-sm tracking-tight truncate ${
                              isCurrentUser
                                ? 'text-amber-200'
                                : rankNum === 1
                                ? 'text-yellow-200 font-bold'
                                : 'text-white'
                            }`}
                          >
                            {displayName}
                          </span>
                          {isCurrentUser && (
                            <span className="text-[9px] font-mono font-bold text-amber-300 uppercase px-1.5 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 shrink-0">
                              YOU
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-mono text-zinc-500 truncate mt-0.5">
                          @{handle} · <span className="text-zinc-400">Lv. {level}</span>
                        </span>
                      </div>
                    </div>

                    {/* CENTER SECTION: Tier Badge & Label */}
                    <div className="hidden sm:flex w-36 sm:w-44 items-center justify-center flex-shrink-0">
                      <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                        <Image
                          src={rankBadgePath}
                          alt={rankTierTitle}
                          width={24}
                          height={24}
                          className="w-6 h-6 object-contain flex-shrink-0"
                        />
                        <span className="text-[10px] font-mono text-zinc-300 tracking-wider uppercase truncate font-medium">
                          {rankTierTitle}
                        </span>
                      </div>
                    </div>

                    {/* RIGHT SECTION: Progress Track & Focus Time */}
                    <div className="w-32 sm:w-44 flex items-center justify-end gap-3 flex-shrink-0 text-right">
                      {/* Race Mini Track */}
                      <div className="hidden md:flex flex-col items-end gap-1 w-20 flex-shrink-0">
                        <div className="w-full h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              rankNum === 1
                                ? 'bg-amber-400'
                                : rankNum === 2
                                ? 'bg-slate-300'
                                : rankNum === 3
                                ? 'bg-amber-600'
                                : 'bg-cyan-500'
                            }`}
                            style={{ width: `${relativePercent}%` }}
                          />
                        </div>
                        <span className="text-[9px] font-mono text-zinc-500">{relativePercent}%</span>
                      </div>

                      {/* Time text */}
                      <div className="text-right">
                        <div
                          className={`text-sm sm:text-base font-mono font-bold tracking-wide ${
                            rankNum === 1
                              ? 'text-yellow-300'
                              : rankNum === 2
                              ? 'text-slate-200'
                              : rankNum === 3
                              ? 'text-amber-400'
                              : isCurrentUser
                              ? 'text-amber-200'
                              : 'text-zinc-200'
                          }`}
                        >
                          {formatStudyTime(row.total_seconds)}
                        </div>
                      </div>

                      {/* Cheer quick-button */}
                      <button
                        type="button"
                        onClick={triggerConfetti}
                        title="Cheer this scholar"
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.15] text-zinc-400 hover:text-amber-300 cursor-pointer hidden sm:block"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* STICKY USER STANDING BAR (Appears only when user's row is scrolled out of viewport) */}
        {isActiveTab && !isCurrentUserRowVisible && currentUserEntry && (
          <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-4xl z-30 animate-in slide-in-from-bottom-4 duration-200">
            <div
              onClick={scrollToCurrentUser}
              className="w-full p-3.5 sm:p-4 bg-[#0e121a]/95 backdrop-blur-xl border border-amber-500/50 rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.85)] cursor-pointer hover:border-amber-400 hover:shadow-[0_0_25px_rgba(245,158,11,0.25)] transition-all flex items-center justify-between gap-3 group"
              title="Click to jump to your row"
            >
              {(() => {
                const entry = currentUserEntry.entry;
                const rankIndex = currentUserEntry.rankIndex;
                const rankTierTitle = getMonthlyRankTierTitle(entry.rank_title, entry.total_seconds);
                const rankBadgePath = getRankBadgePath(rankTierTitle);
                const displayName = entry.display_name || entry.name || entry.username || 'Scholar';
                const level = entry.level ?? getLevelFromLifetimeXP(entry.lifetime_xp || 0);

                return (
                  <>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono font-bold text-xs flex items-center justify-center flex-shrink-0">
                        #{rankIndex + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-bold text-xs sm:text-sm truncate">
                            {displayName} (YOU)
                          </span>
                          <span className="text-[10px] font-mono text-zinc-400">Lv. {level}</span>
                        </div>
                        <div className="text-[11px] font-mono text-amber-400/90 truncate">
                          {overtakeRival
                            ? `⚔️ ${overtakeRival.diffFormatted} behind #${overtakeRival.rivalRank}`
                            : '👑 Holding the throne'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="hidden sm:flex items-center gap-2">
                        <Image
                          src={rankBadgePath}
                          alt={rankTierTitle}
                          width={24}
                          height={24}
                          className="object-contain"
                        />
                        <span className="text-[11px] font-mono text-zinc-300 uppercase">{rankTierTitle}</span>
                      </div>

                      <div className="text-right">
                        <div className="text-xs sm:text-sm font-mono font-bold text-amber-300">
                          {formatStudyTime(entry.total_seconds)}
                        </div>
                        <div className="text-[9px] font-mono text-zinc-400 uppercase">Your Time</div>
                      </div>

                      <div className="w-7 h-7 rounded-full bg-white/[0.08] group-hover:bg-amber-400 group-hover:text-black flex items-center justify-center text-zinc-300 transition-colors">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
