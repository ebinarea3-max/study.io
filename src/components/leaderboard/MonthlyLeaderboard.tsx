'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useAuth } from '../../context/AuthContext';
import { useStudy } from '../../context/StudyContext';
import { getSupabase } from '../../lib/supabase';
import { getRankBadgePath } from '../../lib/rankedSystem';
import { getLevelFromLifetimeXP } from '../../lib/gamification';
import { LeaderboardEntry } from '../../types';
import { Trophy, Clock, ArrowUp, Sparkles, AlertCircle } from 'lucide-react';

export function formatStudyTime(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.round(totalSeconds || 0));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

interface MonthlyLeaderboardProps {
  isEmbedded?: boolean;
}

export function MonthlyLeaderboard({ isEmbedded = false }: MonthlyLeaderboardProps) {
  const { user } = useAuth();
  const { sessions } = useStudy();

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Intersection observer state to detect whether current user's row is visible in the viewport
  const currentUserRowRef = useRef<HTMLDivElement | null>(null);
  const [isCurrentUserRowVisible, setIsCurrentUserRowVisible] = useState<boolean>(true);

  // Compute seasonal subtitle label (e.g. "OCTOBER 2026 // SEASONAL STANDINGS")
  const { monthName, seasonalSubtitle } = useMemo(() => {
    const now = new Date();
    const m = now.toLocaleString('en-US', { month: 'long' }).toUpperCase();
    const y = now.getFullYear();
    return {
      monthName: m,
      seasonalSubtitle: `${m} ${y} // SEASONAL STANDINGS`,
    };
  }, []);

  // Fetch monthly leaderboard from Supabase RPC get_monthly_leaderboard()
  const fetchLeaderboard = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);

    const supabase = getSupabase();
    let entries: LeaderboardEntry[] = [];
    let rpcSucceeded = false;

    if (supabase) {
      try {
        const { data, error } = await supabase.rpc('get_monthly_leaderboard');
        if (!error && Array.isArray(data)) {
          rpcSucceeded = true;
          entries = data.map((row: any) => ({
            user_id: String(row.user_id),
            name: String(row.name || 'Scholar'),
            username: row.username ? String(row.username) : null,
            avatar_url: row.avatar_url ? String(row.avatar_url) : null,
            lifetime_xp: Number(row.lifetime_xp || 0),
            rank_title: String(row.rank_title || 'Bronze I'),
            total_seconds: Number(row.total_seconds || 0),
            is_current_user: Boolean(row.is_current_user || (user?.id && row.user_id === user.id)),
          }));
        } else if (error) {
          console.warn('[Leaderboard] RPC get_monthly_leaderboard notice:', error.message);
        }
      } catch (err: any) {
        console.warn('[Leaderboard] RPC get_monthly_leaderboard call error:', err);
      }
    }

    // Graceful fallback for local development, offline mode, or if RPC is not yet executed in remote Supabase:
    if (!rpcSucceeded) {
      try {
        if (supabase && user?.id && !user.id.startsWith('user-scholar')) {
          // Query study_sessions directly for current month
          const startOfMonth = new Date();
          startOfMonth.setDate(1);
          startOfMonth.setHours(0, 0, 0, 0);

          const { data: dbSessions } = await supabase
            .from('study_sessions')
            .select('user_id, duration_seconds, started_at')
            .gte('started_at', startOfMonth.toISOString());

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
              .select('id, name, username, avatar_url, lifetime_xp, xp, rank_title')
              .in('id', uids);

            if (dbProfiles) {
              entries = dbProfiles.map((p: any) => ({
                user_id: p.id,
                name: p.name || 'Scholar',
                username: p.username || null,
                avatar_url: p.avatar_url || null,
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
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const currentMonthSeconds = sessions
          .filter((s) => new Date(s.startTime).getTime() >= startOfMonth.getTime())
          .reduce((sum, s) => sum + (s.durationSeconds || 0), 0);

        if (currentMonthSeconds > 0) {
          entries = [
            {
              user_id: user.id,
              name: user.displayName || user.name || 'You',
              username: user.username || null,
              avatar_url: user.avatarUrl || null,
              lifetime_xp: Number(user.lifetime_xp ?? user.lifetimeXp ?? user.xp ?? 0),
              rank_title: user.rank_title || 'Bronze I',
              total_seconds: currentMonthSeconds,
              is_current_user: true,
            },
          ];
        }
      }
    }

    setLeaderboard(entries);
    setIsLoading(false);
  }, [user?.id, user?.displayName, user?.name, user?.username, user?.avatarUrl, user?.lifetime_xp, user?.lifetimeXp, user?.xp, user?.rank_title, sessions]);

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
  }, [leaderboard, currentUserEntry]);

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
          ? 'max-w-4xl mx-auto flex flex-col gap-6 py-4'
          : 'bg-[#05070a] min-h-screen p-6 sm:p-10 flex flex-col items-center'
      }`}
    >
      <div className="w-full max-w-4xl flex flex-col gap-6 relative">
        {/* Header */}
        <header className="flex flex-col gap-1.5 pb-6 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-mono text-xs font-bold tracking-widest uppercase px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 inline-flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5" />
              <span>{seasonalSubtitle}</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight uppercase text-white drop-shadow-[0_2px_12px_rgba(255,255,255,0.08)]">
            MONTHLY LEADERBOARD
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed max-w-2xl">
            Rankings determined strictly by total focus hours logged this calendar month.
          </p>
        </header>

        {/* Content Section */}
        <section className="flex flex-col gap-3">
          {/* Loading Skeleton */}
          {isLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="w-full h-20 rounded-2xl bg-white/[0.03] border border-white/[0.06] animate-pulse flex items-center justify-between p-4"
                >
                  <div className="w-10 h-6 bg-white/[0.06] rounded-md" />
                  <div className="flex-1 px-4 flex flex-col gap-2">
                    <div className="w-32 h-4 bg-white/[0.06] rounded" />
                    <div className="w-24 h-3 bg-white/[0.04] rounded" />
                  </div>
                  <div className="w-16 h-10 bg-white/[0.06] rounded-lg mr-4" />
                  <div className="w-16 h-4 bg-white/[0.06] rounded" />
                </div>
              ))}
            </div>
          ) : leaderboard.length === 0 ? (
            /* Empty State */
            <div className="rounded-2xl bg-[#0b0e14]/90 border border-white/[0.08] p-10 text-center flex flex-col items-center justify-center gap-3 shadow-xl">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-1">
                <Clock className="w-6 h-6 stroke-[2]" />
              </div>
              <h3 className="text-base font-bold text-white font-mono uppercase tracking-wider">
                NO SESSIONS RECORDED
              </h3>
              <p className="text-xs sm:text-sm text-neutral-400 max-w-md">
                No sessions recorded this month yet. Start the timer to claim #1!
              </p>
            </div>
          ) : (
            /* Leaderboard Row List */
            <div className="flex flex-col gap-2.5 pb-20">
              {leaderboard.map((row, index) => {
                const isCurrentUser = Boolean(row.is_current_user || (user?.id && row.user_id === user.id));

                return (
                  <div
                    key={row.user_id || index}
                    ref={isCurrentUser ? currentUserRowRef : undefined}
                    className={`w-full flex items-center justify-between p-3.5 sm:p-4 rounded-2xl transition-all ${
                      isCurrentUser
                        ? 'border border-amber-500/40 bg-amber-500/5 shadow-lg shadow-amber-500/10'
                        : 'border border-white/[0.06] bg-[#0c0f17]/80 hover:bg-[#121622]/90'
                    }`}
                  >
                    {/* LEFT: Rank Placement Position */}
                    <div className="w-10 sm:w-14 flex-shrink-0 text-left">
                      {index === 0 ? (
                        <span className="font-mono font-black text-lg sm:text-xl text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]">
                          #1
                        </span>
                      ) : index === 1 ? (
                        <span className="font-mono font-black text-lg sm:text-xl text-slate-200 drop-shadow-[0_0_8px_rgba(226,232,240,0.6)]">
                          #2
                        </span>
                      ) : index === 2 ? (
                        <span className="font-mono font-black text-lg sm:text-xl text-amber-600 drop-shadow-[0_0_8px_rgba(217,119,6,0.5)]">
                          #3
                        </span>
                      ) : (
                        <span className="text-zinc-500 font-mono font-semibold text-sm sm:text-base">
                          #{index + 1}
                        </span>
                      )}
                    </div>

                    {/* MIDDLE-LEFT: Identity Block (Identity + Level below it) */}
                    <div className="flex-1 min-w-0 pr-3 sm:pr-4 flex flex-col justify-center">
                      <div className="font-semibold text-white text-sm sm:text-base truncate leading-snug">
                        {row.name || 'Scholar'}
                      </div>
                      <div className="text-xs text-zinc-400 font-mono flex items-center gap-1.5 truncate mt-0.5">
                        <span>@{row.username || (row.name ? row.name.toLowerCase().replace(/\s+/g, '') : 'scholar')}</span>
                        <span>•</span>
                        <span className="text-zinc-400">
                          Lv. {getLevelFromLifetimeXP(row.lifetime_xp || 0)}
                        </span>
                      </div>
                    </div>

                    {/* MIDDLE-RIGHT: Rank Shield & Tier */}
                    <div className="flex-shrink-0 flex flex-col items-center justify-center px-2 sm:px-6">
                      <div className="relative w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
                        <Image
                          src={getRankBadgePath(row.rank_title)}
                          alt={row.rank_title || 'Rank'}
                          width={40}
                          height={40}
                          className="object-contain max-h-full"
                        />
                      </div>
                      <span className="text-[10px] sm:text-xs font-mono font-bold tracking-wider text-neutral-300 uppercase truncate mt-0.5">
                        {row.rank_title || 'BRONZE I'}
                      </span>
                    </div>

                    {/* FAR RIGHT: Study Time */}
                    <div className="w-20 sm:w-28 flex-shrink-0 text-right font-mono font-medium text-white text-sm sm:text-base">
                      {formatStudyTime(row.total_seconds)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Sticky Pinned User Standing Strip (Displays when user's row is not in viewport) */}
        {!isCurrentUserRowVisible && currentUserEntry && (
          <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-4xl z-30 animate-in slide-in-from-bottom-3 duration-200">
            <div className="w-full flex flex-col">
              <div className="text-[9px] font-mono uppercase tracking-widest text-amber-400 mb-1 pl-3 font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span>YOUR CURRENT STANDING &bull; CLICK TO JUMP</span>
              </div>
              <div
                onClick={scrollToCurrentUser}
                className="w-full flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border border-amber-500/50 bg-[#0b0e14]/95 backdrop-blur-xl shadow-2xl shadow-amber-500/20 cursor-pointer hover:border-amber-400 transition-all"
                title="Click to jump to your row"
              >
                {/* LEFT: Rank Placement Position */}
                <div className="w-10 sm:w-14 flex-shrink-0 text-left">
                  {currentUserEntry.rankIndex === 0 ? (
                    <span className="font-mono font-black text-lg sm:text-xl text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]">
                      #1
                    </span>
                  ) : currentUserEntry.rankIndex === 1 ? (
                    <span className="font-mono font-black text-lg sm:text-xl text-slate-200 drop-shadow-[0_0_8px_rgba(226,232,240,0.6)]">
                      #2
                    </span>
                  ) : currentUserEntry.rankIndex === 2 ? (
                    <span className="font-mono font-black text-lg sm:text-xl text-amber-600 drop-shadow-[0_0_8px_rgba(217,119,6,0.5)]">
                      #3
                    </span>
                  ) : (
                    <span className="text-zinc-500 font-mono font-semibold text-sm sm:text-base">
                      #{currentUserEntry.rankIndex + 1}
                    </span>
                  )}
                </div>

                {/* MIDDLE-LEFT: Identity Block (Identity + Level below it) */}
                <div className="flex-1 min-w-0 pr-3 sm:pr-4 flex flex-col justify-center">
                  <div className="font-semibold text-white text-sm sm:text-base truncate leading-snug">
                    {currentUserEntry.entry.name || 'Scholar'}
                  </div>
                  <div className="text-xs text-zinc-400 font-mono flex items-center gap-1.5 truncate mt-0.5">
                    <span>
                      @{currentUserEntry.entry.username || (currentUserEntry.entry.name ? currentUserEntry.entry.name.toLowerCase().replace(/\s+/g, '') : 'scholar')}
                    </span>
                    <span>•</span>
                    <span className="text-zinc-400">
                      Lv. {getLevelFromLifetimeXP(currentUserEntry.entry.lifetime_xp || 0)}
                    </span>
                  </div>
                </div>

                {/* MIDDLE-RIGHT: Rank Shield & Tier */}
                <div className="flex-shrink-0 flex flex-col items-center justify-center px-2 sm:px-6">
                  <div className="relative w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
                    <Image
                      src={getRankBadgePath(currentUserEntry.entry.rank_title)}
                      alt={currentUserEntry.entry.rank_title || 'Rank'}
                      width={40}
                      height={40}
                      className="object-contain max-h-full"
                    />
                  </div>
                  <span className="text-[10px] sm:text-xs font-mono font-bold tracking-wider text-neutral-300 uppercase truncate mt-0.5">
                    {currentUserEntry.entry.rank_title || 'BRONZE I'}
                  </span>
                </div>

                {/* FAR RIGHT: Study Time */}
                <div className="w-20 sm:w-28 flex-shrink-0 text-right font-mono font-medium text-white text-sm sm:text-base">
                  {formatStudyTime(currentUserEntry.entry.total_seconds)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
