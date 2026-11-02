'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Clock, Zap, Flame, Shield } from 'lucide-react';
import { getSupabase } from '../../lib/supabase';
import { FlairCrown } from './FlairBadge';
import { RankCrestBadge } from './RankCrestBadge';
import { getRankTier, RANKS, RankTier, RankTierName, RankDivision } from '../../lib/ranks';
import { getTierColor, formatTierTitle } from '../leaderboard/LeaderboardRow';
import { FlairFrame, fetchFlairMap } from '../../lib/flair';

export interface ScholarModalData {
  userId: string;
  name?: string | null;
  displayName?: string | null;
  username?: string | null;
  avatarUrl?: string | null;
  level?: number;
  lifetimeXp?: number;
  rankTitle?: string;
  isPro?: boolean;
  flairFrame?: FlairFrame | null;
  currentPeriodSeconds?: number;
  currentPeriodLabel?: string;
  streakDays?: number;
  seasonRp?: number;
}

interface ScholarProfileModalProps {
  scholar: ScholarModalData | null;
  isOpen: boolean;
  onClose: () => void;
  // Fallback for current logged in user sessions if available
  currentUserSessions?: Array<{ durationSeconds?: number; startTime?: string | Date }>;
}

function formatHoursMinutes(totalSeconds: number): { formatted: string; decimalHours: string } {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const decimal = (safe / 3600).toFixed(1);
  return {
    formatted: `${h}h ${m}m`,
    decimalHours: `${decimal} hrs`,
  };
}

export function ScholarProfileModal({
  scholar,
  isOpen,
  onClose,
  currentUserSessions,
}: ScholarProfileModalProps) {
  const [mounted, setMounted] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Loaded full statistics from DB
  const [totalStudySeconds, setTotalStudySeconds] = useState<number>(0);
  const [activeStudyDays, setActiveStudyDays] = useState<number>(0);
  const [avgDailySeconds, setAvgDailySeconds] = useState<number>(0);
  const [verifiedPro, setVerifiedPro] = useState<boolean>(false);
  const [profileDetails, setProfileDetails] = useState<{
    level?: number;
    streakDays?: number;
    seasonRp?: number;
    rankTitle?: string;
    xp?: number;
    createdAt?: string;
  }>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  // Keyboard escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Fetch complete profile and focus sessions when modal opens for a scholar
  useEffect(() => {
    if (!isOpen || !scholar?.userId) {
      setIsLoadingStats(true);
      return;
    }

    let active = true;
    setAvatarError(false);
    setIsLoadingStats(true);

    // Initial state from passed scholar data
    const initialSecs = scholar.currentPeriodSeconds ?? 0;
    setTotalStudySeconds(initialSecs);
    setVerifiedPro(Boolean(scholar.isPro || scholar.flairFrame));

    const loadScholarMetrics = async () => {
      try {
        const supabase = getSupabase();
        const uid = scholar.userId;

        // Check Pro status resolution in parallel
        fetchFlairMap([uid])
          .then((map) => {
            if (active && map[uid]) {
              setVerifiedPro(true);
            }
          })
          .catch(() => {});

        if (!supabase || uid.startsWith('guest') || uid.startsWith('user-scholar')) {
          // Fallback calculation from local sessions if current user
          if (currentUserSessions && currentUserSessions.length > 0) {
            const sumSecs = currentUserSessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
            const dateSet = new Set(
              currentUserSessions
                .map((s) => (s.startTime ? new Date(s.startTime).toISOString().slice(0, 10) : ''))
                .filter(Boolean)
            );
            const days = Math.max(1, dateSet.size);
            if (active) {
              setTotalStudySeconds(sumSecs);
              setActiveStudyDays(dateSet.size);
              setAvgDailySeconds(Math.round(sumSecs / days));
            }
          }
          if (active) setIsLoadingStats(false);
          return;
        }

        const [profRes, sessRes] = await Promise.all([
          supabase
            .from('profiles')
            .select('id, name, username, level, xp, season_rp, streak_days, rank_title, total_study_seconds, created_at')
            .eq('id', uid)
            .maybeSingle(),
          supabase
            .from('study_sessions')
            .select('duration_seconds, started_at')
            .eq('user_id', uid),
        ]);

        if (!active) return;

        if (profRes.data) {
          const p = profRes.data;
          setProfileDetails({
            level: p.level ? Number(p.level) : undefined,
            streakDays: p.streak_days !== undefined ? Number(p.streak_days) : undefined,
            seasonRp: p.season_rp !== undefined ? Number(p.season_rp) : undefined,
            rankTitle: p.rank_title || undefined,
            xp: p.xp !== undefined ? Number(p.xp) : undefined,
            createdAt: p.created_at || undefined,
          });
        }

        const sessions = sessRes.data || [];
        const sumSecs = sessions.reduce((acc, s) => acc + (Number(s.duration_seconds) || 0), 0);

        const dateSet = new Set(
          sessions
            .map((s) => (s.started_at ? String(s.started_at).slice(0, 10) : ''))
            .filter(Boolean)
        );
        const days = Math.max(1, dateSet.size);
        const avg = dateSet.size > 0 ? Math.round(sumSecs / days) : 0;

        // Use highest of session sum, profile total_study_seconds, or initialSecs
        const profileTotal = Number(profRes.data?.total_study_seconds || 0);
        const resolvedTotal = Math.max(sumSecs, profileTotal, initialSecs);

        setTotalStudySeconds(resolvedTotal);
        setActiveStudyDays(dateSet.size);
        setAvgDailySeconds(avg > 0 ? avg : Math.round(resolvedTotal / Math.max(1, dateSet.size)));
      } catch (err) {
        console.warn('[ScholarProfileModal] Error fetching metrics:', err);
      } finally {
        if (active) {
          setIsLoadingStats(false);
        }
      }
    };

    loadScholarMetrics();

    return () => {
      active = false;
    };
  }, [isOpen, scholar?.userId, scholar?.currentPeriodSeconds, scholar?.isPro, scholar?.flairFrame, currentUserSessions]);

  // Derived display attributes
  const displayName = scholar?.displayName || scholar?.name || scholar?.username || 'Scholar';
  const handle = scholar?.username || displayName.toLowerCase().replace(/\s+/g, '');
  const level = profileDetails.level ?? scholar?.level ?? 1;
  const streak = profileDetails.streakDays ?? scholar?.streakDays ?? 0;
  const rankTitle = profileDetails.rankTitle ?? scholar?.rankTitle ?? 'Silver I';

  // Tier configuration
  const tierConfig: RankTier = useMemo(() => {
    try {
      const found = RANKS.find((r) => r.name.toUpperCase() === String(rankTitle).toUpperCase());
      return found || getRankTier(0);
    } catch {
      return getRankTier(0);
    }
  }, [rankTitle]);

  const tierColor = getTierColor(tierConfig?.tier);
  const formattedTier = formatTierTitle(tierConfig?.name);

  // Formatted stats
  const totalStats = formatHoursMinutes(totalStudySeconds);
  const avgStats = formatHoursMinutes(avgDailySeconds);

  const initialLetter = displayName.charAt(0).toUpperCase();

  if (!mounted || !isOpen || !scholar || typeof document === 'undefined') return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar - Clean title and handle without crown icon */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[var(--border)] bg-[var(--surface-2)]/40 shrink-0">
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-hud font-bold tracking-wider uppercase text-[var(--text)] truncate">
              Scholar Profile
            </h3>
            <p className="text-xs text-[var(--text-dim)] font-mono truncate">
              @{handle}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-white/[0.08] transition-colors cursor-pointer shrink-0"
            aria-label="Close profile"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto scrollbar-thin">
          {/* 1. Scholar Identity Banner */}
          <div className="p-4 rounded-xl bg-[var(--surface-2)]/60 border border-[var(--border)] relative overflow-hidden flex items-center gap-3.5 sm:gap-4">
            {/* Subtle Tier Color Wash */}
            <div
              className="absolute -top-12 -right-12 w-36 h-36 rounded-full blur-2xl pointer-events-none opacity-15"
              style={{ backgroundColor: tierColor }}
            />

            {/* Avatar with Tier Ring */}
            <div className="relative shrink-0">
              <div
                className="w-16 h-16 rounded-full p-0.5 border-2 shadow-md flex items-center justify-center"
                style={{
                  borderColor: tierColor,
                  boxShadow: `0 0 12px ${tierColor}30`,
                }}
              >
                {scholar.avatarUrl && !avatarError ? (
                  <img
                    src={scholar.avatarUrl}
                    alt={displayName}
                    className="w-full h-full object-cover rounded-full"
                    referrerPolicy="no-referrer"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <div
                    className="w-full h-full rounded-full flex items-center justify-center font-mono font-bold text-xl text-white"
                    style={{
                      background: `linear-gradient(135deg, ${tierColor} 0%, #111827 100%)`,
                    }}
                  >
                    {initialLetter}
                  </div>
                )}
              </div>

              {/* Mini Rank Badge */}
              <div className="absolute -bottom-1 -right-1 bg-[var(--surface)] rounded-full p-0.5 border border-[var(--border)] shadow">
                <RankCrestBadge
                  tier={tierConfig.tier as RankTierName}
                  division={tierConfig.division as RankDivision}
                  size={22}
                />
              </div>
            </div>

            {/* Identity Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <h4 className="text-base sm:text-lg font-bold text-[var(--text)] truncate" title={displayName}>
                  {displayName}
                </h4>
                {verifiedPro && (
                  <FlairCrown frame="gold" size={15} strokeWidth={3.85} className="-ml-0.5 shrink-0" />
                )}
              </div>

              <p className="text-xs font-mono text-[var(--text-dim)] truncate">
                @{handle}
              </p>

              {/* Status Badges Row */}
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[var(--surface)] border border-[var(--border)] text-[var(--text)]">
                  Lv. {level}
                </span>

                <span
                  className="px-2 py-0.5 rounded-md text-[10px] font-medium border"
                  style={{
                    backgroundColor: `${tierColor}15`,
                    borderColor: `${tierColor}40`,
                    color: tierColor,
                  }}
                >
                  {formattedTier}
                </span>

                {streak > 0 && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-white/5 border border-white/10 text-white">
                    <Flame className="w-2.5 h-2.5 fill-current text-white/80" />
                    {streak}d Streak
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 2. Membership Status Card (Pro vs Free) - Clean Obsidian, No Yellow Colors & No Crown Icon */}
          {verifiedPro ? (
            <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/70 flex items-center justify-between gap-3 shadow-sm">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-hud font-bold text-xs tracking-wider uppercase text-[var(--text)]">
                    PRO SCHOLAR
                  </span>
                  <FlairCrown frame="gold" size={13} strokeWidth={3.85} />
                </div>
                <p className="text-[11px] font-mono text-[var(--text-dim)] truncate mt-0.5">
                  Verified Pro Membership · Active
                </p>
              </div>

              <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold tracking-wider uppercase bg-white/10 text-[var(--text)] border border-white/20 shrink-0">
                PRO ACTIVE
              </span>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/40 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <Shield className="w-4 h-4 text-[var(--text-dim)] shrink-0" />
                <div className="min-w-0">
                  <span className="font-hud font-bold text-xs tracking-wider uppercase text-[var(--text)]">
                    STANDARD SCHOLAR
                  </span>
                  <p className="text-[11px] font-mono text-[var(--text-dim)] truncate">
                    Free Scholar Tier
                  </p>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-medium tracking-wider uppercase bg-white/5 text-[var(--text-dim)] border border-[var(--border)] shrink-0">
                STANDARD
              </span>
            </div>
          )}

          {/* 3. Focus Analytics Section */}
          <div className="space-y-2.5">
            <label className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-dim)] flex items-center gap-1.5">
              <span>Focus Analytics</span>
            </label>

            <div className="grid grid-cols-2 gap-3">
              {/* Card 1: TOTAL FOCUS HOURS */}
              <div className="p-4 rounded-xl bg-[var(--surface-2)]/70 border border-[var(--border)] flex flex-col justify-between hover:border-[var(--border-strong)] transition-all relative overflow-hidden group">
                <div className="flex items-center justify-between text-[var(--text-dim)] mb-2">
                  <span className="text-[10px] font-hud font-bold tracking-wider uppercase text-[var(--text-dim)]">
                    Total Focus Time
                  </span>
                  <Clock className="w-3.5 h-3.5 text-white/70" />
                </div>

                {isLoadingStats ? (
                  <div className="animate-pulse space-y-1.5 my-1">
                    <div className="h-7 bg-white/10 rounded w-24"></div>
                    <div className="h-3.5 bg-white/5 rounded w-16"></div>
                  </div>
                ) : (
                  <div>
                    <div className="text-2xl sm:text-3xl font-mono font-bold text-[var(--text)] tracking-tight">
                      {totalStats.formatted}
                    </div>
                    <div className="text-[11px] font-mono font-medium text-[var(--text-dim)] mt-0.5">
                      {totalStats.decimalHours} total
                    </div>
                  </div>
                )}

                <p className="text-[10px] text-[var(--text-faint)] font-mono mt-2">
                  All-time focus logged
                </p>
              </div>

              {/* Card 2: DAILY AVERAGE FOCUS */}
              <div className="p-4 rounded-xl bg-[var(--surface-2)]/70 border border-[var(--border)] flex flex-col justify-between hover:border-[var(--border-strong)] transition-all relative overflow-hidden group">
                <div className="flex items-center justify-between text-[var(--text-dim)] mb-2">
                  <span className="text-[10px] font-hud font-bold tracking-wider uppercase text-[var(--text-dim)]">
                    Daily Average
                  </span>
                  <Zap className="w-3.5 h-3.5 text-white/70" />
                </div>

                {isLoadingStats ? (
                  <div className="animate-pulse space-y-1.5 my-1">
                    <div className="h-7 bg-white/10 rounded w-24"></div>
                    <div className="h-3.5 bg-white/5 rounded w-16"></div>
                  </div>
                ) : (
                  <div>
                    <div className="text-2xl sm:text-3xl font-mono font-bold text-[var(--text)] tracking-tight">
                      {avgStats.formatted}
                    </div>
                    <div className="text-[11px] font-mono font-medium text-[var(--text-dim)] mt-0.5">
                      {avgStats.decimalHours} / day
                    </div>
                  </div>
                )}

                <p className="text-[10px] text-[var(--text-faint)] font-mono mt-2">
                  {activeStudyDays > 0 ? `Across ${activeStudyDays} study days` : 'Recorded focus history'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end p-4 sm:p-5 border-t border-[var(--border)] bg-[var(--surface-2)]/40 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] hover:bg-white/[0.08] text-xs font-hud font-bold tracking-wider uppercase text-[var(--text)] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
