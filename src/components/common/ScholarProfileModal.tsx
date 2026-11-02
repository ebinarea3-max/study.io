'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Zap, Crown, Flame, Award, Shield, Sparkles } from 'lucide-react';
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
            .select('id, name, username, level, xp, season_rp, streak_days, rank_title, total_study_seconds')
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

  if (!mounted || !isOpen || !scholar) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop Blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ type: 'spring', damping: 25, stiffness: 320 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md bg-[#0c1017] border border-white/10 rounded-3xl shadow-[0_24px_64px_rgba(0,0,0,0.85)] p-5 sm:p-6 z-10 overflow-hidden"
          style={{
            boxShadow: verifiedPro
              ? '0 20px 60px rgba(0,0,0,0.9), 0 0 35px rgba(230, 193, 90, 0.12)'
              : '0 20px 60px rgba(0,0,0,0.9)',
          }}
        >
          {/* Ambient Glow matching Pro status or Tier Color */}
          <div
            className="absolute -top-20 -left-20 w-56 h-56 rounded-full blur-3xl pointer-events-none opacity-20"
            style={{
              backgroundColor: verifiedPro ? '#E6C15A' : tierColor,
            }}
          />

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/15 text-white/60 hover:text-white transition-colors cursor-pointer z-20"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Scholar Identity Section */}
          <div className="flex flex-col items-center text-center mt-2 relative z-10">
            {/* Avatar with Tier Ring */}
            <div className="relative mb-3">
              <div
                className="w-20 h-20 rounded-full p-1 border-2 shadow-xl flex items-center justify-center"
                style={{
                  borderColor: verifiedPro ? '#E6C15A' : tierColor,
                  boxShadow: verifiedPro
                    ? '0 0 20px rgba(230, 193, 90, 0.35)'
                    : `0 0 16px ${tierColor}40`,
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
                    className="w-full h-full rounded-full flex items-center justify-center font-mono font-bold text-2xl text-white"
                    style={{
                      background: `linear-gradient(135deg, ${tierColor} 0%, #111827 100%)`,
                    }}
                  >
                    {initialLetter}
                  </div>
                )}
              </div>

              {/* Small Rank Crest Overlay at avatar bottom right */}
              <div className="absolute -bottom-1 -right-1 bg-[#0c1017] rounded-full p-0.5 border border-white/15 shadow-md">
                <RankCrestBadge
                  tier={tierConfig.tier as RankTierName}
                  division={tierConfig.division as RankDivision}
                  size={26}
                />
              </div>
            </div>

            {/* Scholar Name + Verified Tick */}
            <div className="flex items-center justify-center gap-1.5 min-w-0 px-4">
              <h3 className="text-lg sm:text-xl font-bold text-white truncate max-w-[280px]">
                {displayName}
              </h3>
              {verifiedPro && (
                <FlairCrown frame="gold" size={16} strokeWidth={3.85} className="-ml-0.5" />
              )}
            </div>

            {/* Handle & Badges */}
            <p className="text-xs font-mono text-slate-400 mt-0.5">@{handle}</p>

            <div className="flex items-center gap-2 mt-2 flex-wrap justify-center">
              {/* Level Pill */}
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-white/5 border border-white/10 text-slate-300">
                Lv. {level}
              </span>

              {/* Tier Title Pill */}
              <span
                className="px-2 py-0.5 rounded-full text-[11px] font-medium border"
                style={{
                  backgroundColor: `${tierColor}15`,
                  borderColor: `${tierColor}40`,
                  color: tierColor,
                }}
              >
                {formattedTier}
              </span>

              {/* Streak Pill */}
              {streak > 0 && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-amber-500/10 border border-amber-500/25 text-amber-400">
                  <Flame className="w-3 h-3 fill-current" />
                  {streak}d Streak
                </span>
              )}
            </div>
          </div>

          {/* Membership Status Badge Card (Pro vs Free) */}
          <div className="mt-5 relative z-10">
            {verifiedPro ? (
              <div
                className="w-full rounded-2xl p-3 sm:p-3.5 border transition-all flex items-center justify-between gap-3"
                style={{
                  background: 'linear-gradient(135deg, rgba(230, 193, 90, 0.14) 0%, rgba(184, 137, 43, 0.06) 100%)',
                  borderColor: 'rgba(230, 193, 90, 0.45)',
                  boxShadow: '0 0 20px rgba(230, 193, 90, 0.12)',
                }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0">
                    <Crown className="w-5 h-5 text-amber-300 fill-amber-300" />
                  </div>
                  <div className="min-w-0 text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="font-hud font-bold text-xs tracking-wider uppercase text-amber-300">
                        PRO SCHOLAR
                      </span>
                      <FlairCrown frame="gold" size={13} strokeWidth={3.85} />
                    </div>
                    <p className="text-[11px] text-amber-200/70 truncate">
                      Active Verified Membership
                    </p>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/35 shrink-0">
                  PRO
                </span>
              </div>
            ) : (
              <div className="w-full rounded-2xl p-3 sm:p-3.5 border border-white/10 bg-white/[0.03] flex items-center justify-between gap-3 text-left">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <Shield className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-hud font-bold text-xs tracking-wider uppercase text-slate-300">
                      STANDARD SCHOLAR
                    </span>
                    <p className="text-[11px] text-slate-400 truncate">
                      Free Account
                    </p>
                  </div>
                </div>

                <span className="px-2 py-1 rounded-lg text-[10px] font-mono font-medium uppercase tracking-wider bg-white/5 text-slate-400 border border-white/10 shrink-0">
                  FREE
                </span>
              </div>
            )}
          </div>

          {/* Focus Metrics Grid: Total Hours & Daily Average Hours */}
          <div className="grid grid-cols-2 gap-3 mt-4 relative z-10">
            {/* Total Focus Hours Card */}
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-3.5 flex flex-col justify-between text-left relative overflow-hidden group hover:border-amber-400/30 transition-colors">
              <div className="flex items-center justify-between text-amber-400/90 mb-2">
                <span className="text-[10px] font-hud font-bold tracking-wider uppercase text-slate-400">
                  TOTAL FOCUS
                </span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>

              {isLoadingStats ? (
                <div className="animate-pulse space-y-1.5 my-1">
                  <div className="h-6 bg-white/10 rounded w-20"></div>
                  <div className="h-3 bg-white/5 rounded w-14"></div>
                </div>
              ) : (
                <div>
                  <div className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">
                    {totalStats.formatted}
                  </div>
                  <div className="text-[11px] font-mono text-amber-300/80 mt-0.5">
                    {totalStats.decimalHours} total
                  </div>
                </div>
              )}

              <p className="text-[10px] text-slate-500 mt-2">
                All-time study sessions logged
              </p>
            </div>

            {/* Daily Average Focus Hours Card */}
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-3.5 flex flex-col justify-between text-left relative overflow-hidden group hover:border-teal-400/30 transition-colors">
              <div className="flex items-center justify-between text-teal-400/90 mb-2">
                <span className="text-[10px] font-hud font-bold tracking-wider uppercase text-slate-400">
                  DAILY AVERAGE
                </span>
                <Zap className="w-4 h-4 text-teal-400" />
              </div>

              {isLoadingStats ? (
                <div className="animate-pulse space-y-1.5 my-1">
                  <div className="h-6 bg-white/10 rounded w-20"></div>
                  <div className="h-3 bg-white/5 rounded w-14"></div>
                </div>
              ) : (
                <div>
                  <div className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">
                    {avgStats.formatted}
                  </div>
                  <div className="text-[11px] font-mono text-teal-300/80 mt-0.5">
                    {avgStats.decimalHours} / active day
                  </div>
                </div>
              )}

              <p className="text-[10px] text-slate-500 mt-2">
                {activeStudyDays > 0 ? `Across ${activeStudyDays} study days` : 'Based on recorded focus'}
              </p>
            </div>
          </div>

          {/* Current Period / Season Snapshot Footer */}
          {scholar.currentPeriodSeconds !== undefined && scholar.currentPeriodSeconds > 0 && (
            <div className="mt-3.5 px-3.5 py-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs text-slate-300 relative z-10">
              <span className="text-[11px] text-slate-400 font-mono">
                {scholar.currentPeriodLabel || 'This Month'}:
              </span>
              <span className="font-mono font-bold text-amber-300">
                {formatHoursMinutes(scholar.currentPeriodSeconds).formatted}
              </span>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
