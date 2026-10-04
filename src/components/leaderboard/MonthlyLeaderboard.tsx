'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useAuth } from '../../context/AuthContext';
import { useStudy } from '../../context/StudyContext';
import { getSupabase } from '../../lib/supabase';
import { getRankBadgePath, getRankTier, getRankConfigByTitle } from '../../lib/rankedSystem';
import { getLevelFromLifetimeXP } from '../../lib/gamification';
import { LeaderboardEntry } from '../../types';
import { Crown, Clock } from 'lucide-react';

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
  };
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

function ScholarAvatar({
  name,
  avatarUrl,
  sizeClass = 'w-9 h-9 text-xs',
}: {
  name: string;
  avatarUrl?: string | null;
  sizeClass?: string;
}) {
  const initial = (name || 'S').trim().charAt(0).toUpperCase();
  const gradients = [
    'from-amber-600 to-amber-950',
    'from-zinc-600 to-zinc-950',
    'from-amber-700 to-yellow-950',
    'from-slate-700 to-slate-950',
  ];
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = (name || '').charCodeAt(i) + ((hash << 5) - hash);
  }
  const gradient = gradients[Math.abs(hash) % gradients.length];

  return (
    <div
      className={`${sizeClass} rounded-full overflow-hidden bg-[#0c0e14] flex-shrink-0 flex items-center justify-center relative`}
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

  const userRef = useRef(user);
  userRef.current = user;

  const sessionsRef = useRef(sessions);
  sessionsRef.current = sessions;

  const inFlightRef = useRef(false);

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

  // Split top 3 scholars for Olympic stepped podium vs contenders (#4 and beyond)
  const { top1, top2, top3, contenders } = useMemo(() => {
    return {
      top1: leaderboard[0] || null,
      top2: leaderboard[1] || null,
      top3: leaderboard[2] || null,
      contenders: leaderboard.slice(3),
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
      <div className="w-full max-w-5xl flex flex-col gap-6 relative">
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

        {/* Loading State */}
        {isLoading ? (
          <div className="w-full flex flex-col gap-6">
            {/* Podium Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4 items-end">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`rounded-2xl border border-white/[0.06] bg-[#0c0e14] p-5 animate-pulse ${
                    i === 2 ? 'h-80 md:-translate-y-3' : 'h-72'
                  }`}
                />
              ))}
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
          <div className="w-full bg-[#0c0e14] border border-white/[0.08] rounded-xl p-12 text-center flex flex-col items-center justify-center gap-2.5">
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
          <div
            className={`w-full flex flex-col gap-6 transition-opacity duration-200 ${
              isFetching ? 'opacity-70' : 'opacity-100'
            }`}
          >
            {/* 1. THE OLYMPIC STEPPED PODIUM (Top 3) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4 items-end">
              {/* #2 SILVER (Left on Desktop, Mid-Height min-h-[300px]) */}
              <div className="order-2 md:order-1 h-full">
                {top2 ? (
                  (() => {
                    const rankTierTitle = getMonthlyRankTierTitle(top2.rank_title, top2.total_seconds);
                    const rankBadgePath = getRankBadgePath(rankTierTitle);
                    const displayName = top2.display_name || top2.name || 'Scholar';
                    const handle = top2.username || displayName.toLowerCase().replace(/\s+/g, '');
                    const level = top2.level ?? getLevelFromLifetimeXP(top2.lifetime_xp || 0);
                    const isUser = checkIsCurrentUser(top2);
                    const { h, m } = parseTimeHoursMinutes(top2.total_seconds);

                    return (
                      <div
                        className={`h-full min-h-[260px] md:min-h-[300px] bg-gradient-to-b from-slate-400/[0.08] via-[#0d1017]/80 to-[#080a0f] border border-slate-400/20 rounded-2xl relative overflow-hidden p-5 sm:p-6 flex flex-col items-center justify-between text-center transition-all duration-200 hover:border-slate-300/40 shadow-lg ${
                          isUser ? 'ring-1 ring-amber-400/60' : ''
                        }`}
                      >
                        {/* Corner Crosshairs */}
                        <span className="absolute top-2.5 left-2.5 text-[10px] font-mono text-zinc-600 select-none pointer-events-none">+</span>
                        <span className="absolute bottom-2.5 right-2.5 text-[10px] font-mono text-zinc-600 select-none pointer-events-none">+</span>

                        {/* Top Sleek Silver Numeral Tag */}
                        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-400/10 border border-slate-400/30 text-slate-300 font-mono text-[10px] font-bold tracking-widest uppercase">
                          <span>// 02</span>
                          {isUser && (
                            <span className="text-[9px] text-amber-400 font-mono font-bold ml-1">
                              [YOU]
                            </span>
                          )}
                        </div>

                        {/* Avatar with Luminous Double-Ring */}
                        <div className="relative my-3">
                          <div className="p-1 rounded-full border border-slate-400/30 bg-gradient-to-tr from-slate-400/20 via-zinc-200/10 to-transparent">
                            <div className="p-0.5 rounded-full border border-slate-400/70 bg-[#090c12] shadow-[0_0_15px_rgba(200,200,200,0.15)] flex items-center justify-center">
                              <ScholarAvatar
                                name={displayName}
                                avatarUrl={top2.avatar_url}
                                sizeClass="w-14 h-14 sm:w-16 sm:h-16 text-base"
                              />
                            </div>
                          </div>
                          {/* Floating tier shield at bottom-right intersection */}
                          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#090c12] border border-white/20 p-0.5 flex items-center justify-center shadow-md">
                            <Image
                              src={rankBadgePath}
                              alt={rankTierTitle}
                              width={22}
                              height={22}
                              className="w-4 h-4 object-contain"
                            />
                          </div>
                        </div>

                        {/* Scholar Name + Handle */}
                        <div className="w-full px-2">
                          <div className="font-semibold text-white text-sm sm:text-base truncate flex items-center justify-center gap-1">
                            <span className="truncate">{displayName}</span>
                          </div>
                          <div className="text-[11px] font-mono text-zinc-400 truncate mt-0.5">
                            @{handle} · Lv. {level}
                          </div>
                        </div>

                        {/* Focus Time Display */}
                        <div className="mt-4 pt-3 border-t border-white/[0.06] w-full flex flex-col items-center">
                          <div className="flex items-baseline justify-center font-mono">
                            <span className="text-3xl font-mono font-bold tracking-tight text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.2)]">
                              {h}
                            </span>
                            <span className="text-xs text-zinc-500 font-mono ml-1 mr-2">H</span>
                            <span className="text-2xl font-mono font-bold text-zinc-300">
                              {m}
                            </span>
                            <span className="text-xs text-zinc-500 font-mono ml-1">M</span>
                          </div>
                          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider mt-0.5">
                            {rankTierTitle}
                          </span>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="h-full min-h-[220px] rounded-2xl border border-white/[0.06] bg-[#0c0e14] p-5 flex items-center justify-center text-zinc-600 font-mono text-xs">
                    // 02 UNCLAIMED
                  </div>
                )}
              </div>

              {/* #1 CHAMPION (Center on Desktop, Taller min-h-[340px], Elevated -translate-y-3 with Golden Atmospheric Bloom) */}
              <div className="order-1 md:order-2 h-full md:-translate-y-3">
                {top1 ? (
                  (() => {
                    const rankTierTitle = getMonthlyRankTierTitle(top1.rank_title, top1.total_seconds);
                    const rankBadgePath = getRankBadgePath(rankTierTitle);
                    const displayName = top1.display_name || top1.name || 'Scholar';
                    const handle = top1.username || displayName.toLowerCase().replace(/\s+/g, '');
                    const level = top1.level ?? getLevelFromLifetimeXP(top1.lifetime_xp || 0);
                    const isUser = checkIsCurrentUser(top1);
                    const { h, m } = parseTimeHoursMinutes(top1.total_seconds);

                    return (
                      <div
                        className={`h-full min-h-[290px] md:min-h-[340px] bg-gradient-to-b from-amber-500/[0.12] via-[#0d1017]/90 to-[#080a0f] border border-amber-500/40 shadow-[0_0_40px_rgba(245,158,11,0.12)] rounded-2xl relative overflow-hidden p-5 sm:p-6 flex flex-col items-center justify-between text-center transition-all duration-200 hover:border-amber-400/80 ${
                          isUser ? 'ring-1 ring-amber-400' : ''
                        }`}
                      >
                        {/* Corner Crosshairs */}
                        <span className="absolute top-2.5 left-2.5 text-[10px] font-mono text-zinc-600 select-none pointer-events-none">+</span>
                        <span className="absolute bottom-2.5 right-2.5 text-[10px] font-mono text-zinc-600 select-none pointer-events-none">+</span>

                        {/* Top Indicator */}
                        <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-[10px] font-bold tracking-widest uppercase">
                          <span>// 01 · CHAMPION</span>
                          {isUser && (
                            <span className="text-[9px] text-amber-200 font-mono font-bold ml-1">
                              [YOU]
                            </span>
                          )}
                        </div>

                        {/* Avatar with Luminous Laurel/Crown Floating Above & Golden Double-Ring */}
                        <div className="relative my-3 flex flex-col items-center">
                          {/* Luminous Gold Crown Floating Above Avatar */}
                          <div className="-mb-2.5 z-10 w-7 h-7 rounded-full bg-amber-500/20 border border-amber-400/60 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.4)]">
                            <Crown className="w-3.5 h-3.5 text-amber-300 fill-amber-300 drop-shadow-[0_0_6px_rgba(245,158,11,0.9)]" />
                          </div>

                          <div className="p-1 rounded-full border border-amber-500/50 bg-gradient-to-tr from-amber-500/20 via-yellow-400/20 to-transparent">
                            <div className="p-0.5 rounded-full border border-amber-400/80 bg-[#090c12] shadow-[0_0_20px_rgba(245,158,11,0.3)] flex items-center justify-center">
                              <ScholarAvatar
                                name={displayName}
                                avatarUrl={top1.avatar_url}
                                sizeClass="w-18 h-18 sm:w-20 sm:h-20 text-lg"
                              />
                            </div>
                          </div>
                          {/* Floating tier shield with ambient glow */}
                          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#090c12] border border-amber-500/60 p-0.5 flex items-center justify-center shadow-lg drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]">
                            <Image
                              src={rankBadgePath}
                              alt={rankTierTitle}
                              width={26}
                              height={26}
                              className="w-5 h-5 object-contain"
                            />
                          </div>
                        </div>

                        {/* Scholar Name + Handle */}
                        <div className="w-full px-2">
                          <div className="font-bold text-white text-base sm:text-lg truncate flex items-center justify-center gap-1">
                            <span className="truncate">{displayName}</span>
                          </div>
                          <div className="text-xs font-mono text-zinc-400 truncate mt-0.5">
                            @{handle} · Lv. {level}
                          </div>
                        </div>

                        {/* Prominent High-Contrast Digital Monospace Time */}
                        <div className="mt-4 pt-3 border-t border-amber-500/20 w-full flex flex-col items-center">
                          <div className="flex items-baseline justify-center font-mono">
                            <span className="text-3xl sm:text-4xl font-mono font-bold tracking-tight text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.2)]">
                              {h}
                            </span>
                            <span className="text-xs text-amber-400 font-mono font-bold ml-1 mr-2">H</span>
                            <span className="text-2xl sm:text-3xl font-mono font-bold text-zinc-200">
                              {m}
                            </span>
                            <span className="text-xs text-amber-400 font-mono font-bold ml-1">M</span>
                          </div>
                          <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider mt-0.5 font-medium">
                            {rankTierTitle}
                          </span>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="h-full min-h-[250px] rounded-2xl border border-white/[0.06] bg-[#0c0e14] p-5 flex items-center justify-center text-zinc-600 font-mono text-xs">
                    // 01 UNCLAIMED
                  </div>
                )}
              </div>

              {/* #3 BRONZE (Right on Desktop, Lower Height min-h-[280px]) */}
              <div className="order-3 h-full">
                {top3 ? (
                  (() => {
                    const rankTierTitle = getMonthlyRankTierTitle(top3.rank_title, top3.total_seconds);
                    const rankBadgePath = getRankBadgePath(rankTierTitle);
                    const displayName = top3.display_name || top3.name || 'Scholar';
                    const handle = top3.username || displayName.toLowerCase().replace(/\s+/g, '');
                    const level = top3.level ?? getLevelFromLifetimeXP(top3.lifetime_xp || 0);
                    const isUser = checkIsCurrentUser(top3);
                    const { h, m } = parseTimeHoursMinutes(top3.total_seconds);

                    return (
                      <div
                        className={`h-full min-h-[240px] md:min-h-[280px] bg-gradient-to-b from-amber-800/[0.08] via-[#0d1017]/80 to-[#080a0f] border border-amber-700/20 rounded-2xl relative overflow-hidden p-5 sm:p-6 flex flex-col items-center justify-between text-center transition-all duration-200 hover:border-amber-600/40 shadow-lg ${
                          isUser ? 'ring-1 ring-amber-400/60' : ''
                        }`}
                      >
                        {/* Corner Crosshairs */}
                        <span className="absolute top-2.5 left-2.5 text-[10px] font-mono text-zinc-600 select-none pointer-events-none">+</span>
                        <span className="absolute bottom-2.5 right-2.5 text-[10px] font-mono text-zinc-600 select-none pointer-events-none">+</span>

                        {/* Top Bronze Numeral Tag */}
                        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-700/10 border border-amber-700/30 text-amber-400 font-mono text-[10px] font-bold tracking-widest uppercase">
                          <span>// 03</span>
                          {isUser && (
                            <span className="text-[9px] text-amber-200 font-mono font-bold ml-1">
                              [YOU]
                            </span>
                          )}
                        </div>

                        {/* Avatar with Luminous Double-Ring */}
                        <div className="relative my-3">
                          <div className="p-1 rounded-full border border-amber-700/30 bg-gradient-to-tr from-amber-700/20 via-yellow-700/10 to-transparent">
                            <div className="p-0.5 rounded-full border border-amber-700/70 bg-[#090c12] shadow-[0_0_15px_rgba(180,83,9,0.15)] flex items-center justify-center">
                              <ScholarAvatar
                                name={displayName}
                                avatarUrl={top3.avatar_url}
                                sizeClass="w-14 h-14 sm:w-16 sm:h-16 text-base"
                              />
                            </div>
                          </div>
                          {/* Floating tier shield at bottom-right intersection */}
                          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#090c12] border border-white/20 p-0.5 flex items-center justify-center shadow-md">
                            <Image
                              src={rankBadgePath}
                              alt={rankTierTitle}
                              width={22}
                              height={22}
                              className="w-4 h-4 object-contain"
                            />
                          </div>
                        </div>

                        {/* Scholar Name + Handle */}
                        <div className="w-full px-2">
                          <div className="font-semibold text-white text-sm sm:text-base truncate flex items-center justify-center gap-1">
                            <span className="truncate">{displayName}</span>
                          </div>
                          <div className="text-[11px] font-mono text-zinc-400 truncate mt-0.5">
                            @{handle} · Lv. {level}
                          </div>
                        </div>

                        {/* Focus Time Display */}
                        <div className="mt-4 pt-3 border-t border-white/[0.06] w-full flex flex-col items-center">
                          <div className="flex items-baseline justify-center font-mono">
                            <span className="text-3xl font-mono font-bold tracking-tight text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.2)]">
                              {h}
                            </span>
                            <span className="text-xs text-zinc-500 font-mono ml-1 mr-2">H</span>
                            <span className="text-2xl font-mono font-bold text-zinc-300">
                              {m}
                            </span>
                            <span className="text-xs text-zinc-500 font-mono ml-1">M</span>
                          </div>
                          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider mt-0.5">
                            {rankTierTitle}
                          </span>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="h-full min-h-[200px] rounded-2xl border border-white/[0.06] bg-[#0c0e14] p-5 flex items-center justify-center text-zinc-600 font-mono text-xs">
                    // 03 UNCLAIMED
                  </div>
                )}
              </div>
            </div>

            {/* 2. CONTENDERS FLIGHT-BOARD (#4 to #100) */}
            {contenders.length > 0 && (
              <div className="w-full bg-[#090c12]/90 backdrop-blur-md border border-white/[0.07] rounded-xl overflow-hidden divide-y divide-white/[0.04] shadow-2xl">
                {/* Header Row */}
                <div className="px-6 py-2.5 bg-white/[0.02] text-[10px] font-mono uppercase tracking-widest text-zinc-500 flex items-center">
                  <span className="w-12 text-left">POS</span>
                  <span className="flex-1 min-w-0">SCHOLAR</span>
                  <span className="w-36 sm:w-44 text-center">TIER</span>
                  <span className="w-28 sm:w-32 text-right">RECORDED FOCUS</span>
                </div>

                {/* Roster Rows */}
                {contenders.map((row, idx) => {
                  const actualRank = idx + 4;
                  const isCurrentUser = checkIsCurrentUser(row);
                  const rankTierTitle = getMonthlyRankTierTitle(row.rank_title, row.total_seconds);
                  const rankBadgePath = getRankBadgePath(rankTierTitle);
                  const displayName = row.display_name || row.name || row.username || 'Scholar';
                  const handle = row.username || displayName.toLowerCase().replace(/\s+/g, '');
                  const level = row.level ?? getLevelFromLifetimeXP(row.lifetime_xp || 0);
                  const { h, m } = parseTimeHoursMinutes(row.total_seconds);

                  return (
                    <div
                      key={row.user_id || actualRank}
                      className={`px-6 py-3 flex items-center transition-all duration-150 group hover:bg-white/[0.03] ${
                        isCurrentUser
                          ? 'border-l-2 border-l-amber-400 bg-amber-500/[0.04]'
                          : ''
                      }`}
                    >
                      {/* POS */}
                      <span className="w-12 text-left text-zinc-500 font-mono text-xs group-hover:text-zinc-300">
                        #{actualRank < 10 ? `0${actualRank}` : actualRank}
                      </span>

                      {/* Scholar Column */}
                      <div className="flex items-center gap-3 flex-1 min-w-0 pr-3">
                        <ScholarAvatar
                          name={displayName}
                          avatarUrl={row.avatar_url}
                          sizeClass="w-8 h-8 text-[11px]"
                        />

                        <div className="flex flex-col min-w-0 justify-center">
                          <span className="font-semibold text-white text-sm tracking-tight truncate">
                            {displayName}
                          </span>
                          <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-500 truncate mt-0.5">
                            <span>@{handle} · Lv. {level}</span>
                            {isCurrentUser && (
                              <span className="text-[9px] font-mono font-bold text-amber-400 uppercase px-1 py-0.2 rounded bg-amber-500/20 border border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.25)]">
                                [YOU]
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Tier Column */}
                      <div className="w-36 sm:w-44 flex items-center justify-center flex-shrink-0 gap-2">
                        <Image
                          src={rankBadgePath}
                          alt={rankTierTitle}
                          width={22}
                          height={22}
                          className="w-5 h-5 object-contain flex-shrink-0 drop-shadow-[0_0_4px_rgba(255,255,255,0.1)]"
                        />
                        <span className="text-xs text-zinc-400 font-mono tracking-wider uppercase truncate">
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
