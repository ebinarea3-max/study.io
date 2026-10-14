'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { notFound } from 'next/navigation';
import {
  RANK_TIERS,
  RankTierConfig,
  getSeasonDisplayName,
  getSeasonUtcBoundaries,
  getPreviousSeasonId,
} from '../../../lib/rankedSystem';
import RecapPresentation, { RecapPresentationProps, RecapSubjectItem } from '../../../components/recap/RecapPresentation';
import EmptyRecapFallback from '../../../components/recap/EmptyRecapFallback';
import { useStudy } from '../../../context/StudyContext';
import { useAuth } from '../../../context/AuthContext';
import { getSupabase } from '../../../lib/supabase';
import toast from 'react-hot-toast';
import Link from 'next/link';
import {
  Sparkles,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  Gauge,
  Sliders,
  AlertTriangle,
  Flame,
  ArrowRight,
  ExternalLink,
  Calendar,
  Layers,
  Database,
  RefreshCw,
  Trophy,
  X,
  ChevronRight,
  Zap,
} from 'lucide-react';

// Preset scenarios definition
interface PresetScenario {
  id: string;
  title: string;
  tag: string;
  tagColor: string;
  description: string;
  isZero?: boolean;
  data?: Partial<RecapPresentationProps>;
}

const PRESETS: PresetScenario[] = [
  {
    id: 'first-season',
    title: 'First Season',
    tag: 'NEW REVEAL',
    tagColor: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
    description: 'No previous rank (unranked), unlock reveal only into Bronze I.',
    data: {
      seasonKey: '2026-09',
      seasonDisplayName: 'Season September 2026',
      totalSeconds: 36000, // 10h
      activeDays: 8,
      topSubject: 'Computer Science',
      topSubjectSeconds: 21600,
      subjectBreakdown: [
        { name: 'Computer Science', seconds: 21600 },
        { name: 'Mathematics', seconds: 14400 },
      ],
      bestWeekday: 'Tuesday',
      peakHour: 15,
      longestStreak: 4,
      completedTasks: 12,
      previousRank: null,
      previousRP: 0,
      currentRank: 'BRONZE I',
      startingRP: 0,
      currentLiveRP: 160,
      isFirstSeason: true,
      username: 'Novice Scholar',
    },
  },
  {
    id: 'returning-soft-reset',
    title: 'Returning, Normal Soft Reset',
    tag: 'STANDARD RESET',
    tagColor: 'bg-sky-500/15 border-sky-500/30 text-sky-400',
    description: 'Silver II drops to Bronze I after the monthly soft-reset.',
    data: {
      seasonKey: '2026-09',
      seasonDisplayName: 'Season September 2026',
      totalSeconds: 79200, // 22h
      activeDays: 14,
      topSubject: 'Physics',
      topSubjectSeconds: 43200,
      subjectBreakdown: [
        { name: 'Physics', seconds: 43200 },
        { name: 'Calculus', seconds: 21600 },
        { name: 'Chemistry', seconds: 14400 },
      ],
      bestWeekday: 'Thursday',
      peakHour: 20,
      longestStreak: 6,
      completedTasks: 25,
      previousRank: 'SILVER II',
      previousRP: 1750,
      currentRank: 'BRONZE I',
      startingRP: 0,
      currentLiveRP: 180,
      isFirstSeason: false,
      username: 'Silver Veteran',
    },
  },
  {
    id: 'returning-promoted',
    title: 'Returning, Promoted',
    tag: 'RANK PROMOTION',
    tagColor: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
    description: 'Climbed from Bronze III to Silver I with promotion banner.',
    data: {
      seasonKey: '2026-09',
      seasonDisplayName: 'Season September 2026',
      totalSeconds: 115200, // 32h
      activeDays: 20,
      topSubject: 'Biology',
      topSubjectSeconds: 64800,
      subjectBreakdown: [
        { name: 'Biology', seconds: 64800 },
        { name: 'Organic Chemistry', seconds: 32400 },
        { name: 'English Lit', seconds: 18000 },
      ],
      bestWeekday: 'Wednesday',
      peakHour: 14,
      longestStreak: 9,
      completedTasks: 38,
      previousRank: 'BRONZE III',
      previousRP: 900,
      currentRank: 'SILVER I',
      startingRP: 1200,
      currentLiveRP: 1350,
      isFirstSeason: false,
      username: 'Climbing Scholar',
    },
  },
  {
    id: 'big-drop',
    title: 'Big Drop (Grandmaster to Gold)',
    tag: 'HIGH ELO DROP',
    tagColor: 'bg-rose-500/15 border-rose-500/30 text-rose-400',
    description: 'Grandmaster (24,500 RP) compressed down to Gold II (3,300 RP).',
    data: {
      seasonKey: '2026-09',
      seasonDisplayName: 'Season September 2026',
      totalSeconds: 288000, // 80h
      activeDays: 29,
      topSubject: 'Competitive Programming',
      topSubjectSeconds: 180000,
      subjectBreakdown: [
        { name: 'Competitive Programming', seconds: 180000 },
        { name: 'Advanced Algorithms', seconds: 72000 },
        { name: 'Quantum Physics', seconds: 36000 },
      ],
      bestWeekday: 'Saturday',
      peakHour: 22,
      longestStreak: 25,
      completedTasks: 75,
      previousRank: 'GRANDMASTER',
      previousRP: 24500,
      currentRank: 'GOLD II',
      startingRP: 3300,
      currentLiveRP: 3450,
      isFirstSeason: false,
      username: 'Grandmaster Elite',
    },
  },
  {
    id: 'heavy-user',
    title: 'Heavy User (60+ Hours)',
    tag: 'POWER USER',
    tagColor: 'bg-purple-500/15 border-purple-500/30 text-purple-400',
    description: '65 hours, 6 subjects breakdown, 25 active days, 22 streak.',
    data: {
      seasonKey: '2026-09',
      seasonDisplayName: 'Season September 2026',
      totalSeconds: 234000, // 65h
      activeDays: 25,
      topSubject: 'Distributed Systems',
      topSubjectSeconds: 86400,
      subjectBreakdown: [
        { name: 'Distributed Systems', seconds: 86400 },
        { name: 'Machine Learning', seconds: 50400 },
        { name: 'Computer Architecture', seconds: 39600 },
        { name: 'Database Internals', seconds: 28800 },
        { name: 'Linear Algebra', seconds: 18000 },
        { name: 'Discrete Math', seconds: 10800 },
      ],
      bestWeekday: 'Sunday',
      peakHour: 10,
      longestStreak: 22,
      completedTasks: 64,
      previousRank: 'DIAMOND III',
      previousRP: 10200,
      currentRank: 'GOLD I',
      startingRP: 2700,
      currentLiveRP: 3100,
      isFirstSeason: false,
      username: 'Hardcore Scholar',
    },
  },
  {
    id: 'light-user',
    title: 'Light User (< 1 Hour)',
    tag: 'CASUAL',
    tagColor: 'bg-zinc-500/15 border-zinc-500/30 text-zinc-400',
    description: 'Under 1 hour (40 min), 1 subject, power-day slide skipped.',
    data: {
      seasonKey: '2026-09',
      seasonDisplayName: 'Season September 2026',
      totalSeconds: 2400, // 40m
      activeDays: 1,
      topSubject: 'Spanish',
      topSubjectSeconds: 2400,
      subjectBreakdown: [{ name: 'Spanish', seconds: 2400 }],
      bestWeekday: null,
      peakHour: 18,
      longestStreak: 1,
      completedTasks: 2,
      previousRank: 'BRONZE I',
      previousRP: 120,
      currentRank: 'BRONZE I',
      startingRP: 0,
      currentLiveRP: 35,
      isFirstSeason: false,
      username: 'Casual Scholar',
    },
  },
  {
    id: 'zero-sessions',
    title: 'Zero Sessions',
    tag: 'EMPTY STATE',
    tagColor: 'bg-amber-500/10 border-amber-500/20 text-amber-500',
    description: 'No sessions recorded during the month. Displays EmptyRecapFallback.',
    isZero: true,
  },
];

export default function DevRecapPreviewPage() {
  const [isClient, setIsClient] = useState(false);
  const { user } = useAuth();
  const { simulateSeasonReset } = useStudy();

  // Active presentation fixture state
  const [activeRecapProps, setActiveRecapProps] = useState<RecapPresentationProps | null>(null);
  const [showZeroFallback, setShowZeroFallback] = useState(false);

  // Playback helper state
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [forcedSlide, setForcedSlide] = useState<number | undefined>(undefined);
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [currentSlideIds, setCurrentSlideIds] = useState<string[]>([]);

  // Custom scenario controls state
  const [customPrevRank, setCustomPrevRank] = useState<string>('SILVER II');
  const [customCurrRank, setCustomCurrRank] = useState<string>('BRONZE I');
  const [customHours, setCustomHours] = useState<number>(18.5);
  const [customTopSubject, setCustomTopSubject] = useState<string>('Computer Science');
  const [customActiveDays, setCustomActiveDays] = useState<number>(12);
  const [customStreak, setCustomStreak] = useState<number>(5);

  // Real-flow tools state
  const [confirmBannerReset, setConfirmBannerReset] = useState(false);
  const [confirmSimulateReset, setConfirmSimulateReset] = useState(false);
  const [simulateScenario, setSimulateScenario] = useState<'returning' | 'first' | 'zero'>('returning');
  const [overrideDate, setOverrideDate] = useState<string>('2026-09-15');
  const [rpcLoading, setRpcLoading] = useState(false);
  const [rpcResult, setRpcResult] = useState<any>(null);
  const [isResettingBanner, setIsResettingBanner] = useState(false);

  // Target season for override
  const computedSeasonKey = useMemo(() => {
    try {
      return getPreviousSeasonId(new Date(overrideDate));
    } catch {
      return '2026-09';
    }
  }, [overrideDate]);

  const computedBoundaries = useMemo(() => {
    try {
      return getSeasonUtcBoundaries(computedSeasonKey);
    } catch {
      return { start: new Date(), end: new Date() };
    }
  }, [computedSeasonKey]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  // Route safety: 404 in production
  if (process.env.NODE_ENV === 'production') {
    notFound();
    return <div className="p-8 text-white font-mono">404 - Not Found</div>;
  }

  // Launch preset
  const handleLaunchPreset = (preset: PresetScenario) => {
    setForcedSlide(0);
    if (preset.isZero) {
      setActiveRecapProps(null);
      setShowZeroFallback(true);
      return;
    }

    setShowZeroFallback(false);
    setActiveRecapProps(preset.data as RecapPresentationProps);
  };

  // Launch custom scenario
  const handleLaunchCustom = () => {
    const isFirst = customPrevRank === 'none';
    const prevTierConfig = !isFirst ? RANK_TIERS.find((t) => t.fullTitle === customPrevRank) : null;
    const currTierConfig = RANK_TIERS.find((t) => t.fullTitle === customCurrRank) || RANK_TIERS[0];

    const prevRP = !isFirst ? (prevTierConfig ? prevTierConfig.minRP + 50 : 1200) : 0;
    const startingRP = currTierConfig.minRP;
    const totalSecs = Math.max(60, Math.round(customHours * 3600));
    const topSecs = Math.round(totalSecs * 0.6);

    const customProps: RecapPresentationProps = {
      seasonKey: '2026-09',
      seasonDisplayName: 'Season September 2026',
      totalSeconds: totalSecs,
      activeDays: Math.max(1, Math.min(31, customActiveDays)),
      topSubject: customTopSubject.trim() || 'General Study',
      topSubjectSeconds: topSecs,
      subjectBreakdown: [
        { name: customTopSubject.trim() || 'General Study', seconds: topSecs },
        { name: 'Secondary Subject', seconds: Math.round(totalSecs * 0.3) },
        { name: 'Elective', seconds: Math.max(0, totalSecs - topSecs - Math.round(totalSecs * 0.3)) },
      ],
      bestWeekday: totalSecs > 3600 ? 'Wednesday' : null,
      peakHour: 16,
      longestStreak: customStreak,
      completedTasks: 18,
      previousRank: isFirst ? null : customPrevRank,
      previousRP: prevRP,
      currentRank: customCurrRank,
      startingRP,
      currentLiveRP: startingRP + 80,
      isFirstSeason: isFirst,
      username: (user as any)?.username || (user as any)?.displayName || 'Scholar',
    };

    setForcedSlide(0);
    setShowZeroFallback(false);
    setActiveRecapProps(customProps);
  };

  // Real Flow: Reset Recap Banner and Cache in Supabase
  const handleResetBannerAndCache = async () => {
    if (!user?.id) {
      toast.error('You must be signed in to clear your Supabase profile row.');
      return;
    }
    setIsResettingBanner(true);
    try {
      const supabase = getSupabase();
      if (supabase && !user.id.startsWith('user-scholar') && !user.id.startsWith('guest')) {
        // 1. Clear last_acknowledged_season on profile
        const { error: profileErr } = await supabase
          .from('profiles')
          .update({ last_acknowledged_season: null })
          .eq('id', user.id);

        if (profileErr) console.warn('Profile clear error:', profileErr);

        // 2. Delete cached row in season_recaps if table exists
        try {
          await supabase.from('season_recaps').delete().eq('user_id', user.id);
        } catch {}
      }

      // 3. Clear localStorage keys
      try {
        Object.keys(localStorage).forEach((key) => {
          if (
            key.startsWith('has_seen_recap_') ||
            key.startsWith('season_settlement_acknowledged_') ||
            key === 'studypulse_season_recap'
          ) {
            localStorage.removeItem(key);
          }
        });
      } catch {}

      toast.success('Recap flags cleared! Real banner & /recap flow are ready to test.');
      setConfirmBannerReset(false);
    } catch (err: any) {
      toast.error('Failed to reset banner: ' + err.message);
    } finally {
      setIsResettingBanner(false);
    }
  };

  // Real Flow: Execute simulateSeasonReset()
  const handleExecuteSimulateReset = () => {
    simulateSeasonReset(simulateScenario);
    toast.success(`simulateSeasonReset('${simulateScenario}') triggered! Check dashboard banner.`);
    setConfirmSimulateReset(false);
  };

  // Real Flow: Test Live RPC get_season_recap with date override
  const handleTestRpcWithDate = async () => {
    if (!user?.id) {
      toast.error('Sign in to test RPC against your user account.');
      return;
    }
    setRpcLoading(true);
    setRpcResult(null);

    try {
      const targetDate = new Date(overrideDate);
      const targetSeasonKey = getPreviousSeasonId(targetDate);
      const { start, end } = getSeasonUtcBoundaries(targetSeasonKey);

      const supabase = getSupabase();
      if (!supabase) throw new Error('Supabase client unavailable');

      const { data, error } = await supabase.rpc('get_season_recap', {
        p_user_id: user.id,
        p_season_start: start.toISOString(),
        p_season_end: end.toISOString(),
      });

      if (error) {
        setRpcResult({ error: error.message, seasonKey: targetSeasonKey, start, end });
      } else {
        setRpcResult({ success: true, seasonKey: targetSeasonKey, boundaries: { start, end }, data });
      }
    } catch (err: any) {
      setRpcResult({ error: err.message });
    } finally {
      setRpcLoading(false);
    }
  };

  // Close active preview
  const handleClosePreview = () => {
    setActiveRecapProps(null);
    setShowZeroFallback(false);
  };


  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 font-sans p-4 sm:p-8 pb-36 relative select-none">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none bg-dot-grid z-0" />
      <div className="fixed inset-0 pointer-events-none bg-hud-grid opacity-[0.03] z-0" />

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        {/* Header Banner */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-hud font-bold tracking-widest uppercase px-2.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                DEVELOPER TOOLING · DEV ONLY
              </span>
              <span className="text-[10px] font-mono text-zinc-500">
                ROUTE: /dev/recap
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black font-hud text-white uppercase tracking-wider flex items-center gap-3">
              <span>Seasonal Recap Preview Tool</span>
            </h1>
            <p className="text-sm text-zinc-400 font-mono mt-1 max-w-2xl">
              Preview and verify the full seasonal recap slideshow instantly with fixture data.
              Zero network writes occur during preset simulations.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/dev/ranks"
              className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-mono text-zinc-300 hover:text-white transition-all flex items-center gap-2"
            >
              <span>/dev/ranks</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 border border-amber-500/40 text-amber-300 text-xs font-hud font-bold uppercase tracking-wider transition-all"
            >
              Back to App
            </Link>
          </div>
        </header>

        {/* ══════════════════════════════════════════════════════════ */}
        {/* SECTION 1: PRESET SCENARIOS                                */}
        {/* ══════════════════════════════════════════════════════════ */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h2 className="text-lg font-hud font-bold text-white uppercase tracking-wider">
                1. Preset Scenarios
              </h2>
            </div>
            <span className="text-xs font-mono text-zinc-500">
              7 Test Cases · Supabase Bypass
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PRESETS.map((preset) => (
              <div
                key={preset.id}
                className="bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.08] hover:border-amber-500/30 rounded-2xl p-5 transition-all flex flex-col justify-between gap-4 group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[10px] font-hud font-bold tracking-widest uppercase px-2 py-0.5 rounded border ${preset.tagColor}`}>
                      {preset.tag}
                    </span>
                    {preset.data?.previousRank && (
                      <span className="text-[10px] font-mono text-zinc-400 truncate">
                        {preset.data.previousRank} → {preset.data.currentRank}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                    {preset.title}
                  </h3>
                  <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                    {preset.description}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleLaunchPreset(preset)}
                  className="w-full py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 hover:border-amber-500/60 text-amber-300 font-hud font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-sm"
                >
                  <Play className="w-3.5 h-3.5 fill-amber-400" />
                  <span>Preview Scenario</span>
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════ */}
        {/* SECTION 2: CUSTOM CONTROLS                                */}
        {/* ══════════════════════════════════════════════════════════ */}
        <section className="space-y-4 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <h2 className="text-lg font-hud font-bold text-white uppercase tracking-wider">
                2. Custom Controls
              </h2>
            </div>
            <span className="text-xs font-mono text-zinc-500">
              Any Rank Combination (All 21 Ranks)
            </span>
          </div>

          <div className="bg-white/[0.02] border border-white/[0.08] rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Previous Rank Dropdown */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider block">
                  Previous Rank (Ending Season)
                </label>
                <select
                  value={customPrevRank}
                  onChange={(e) => setCustomPrevRank(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white font-mono text-xs focus:border-amber-500/60 focus:outline-none cursor-pointer"
                >
                  <option value="none">None (First Season · Unlock Reveal Only)</option>
                  {RANK_TIERS.map((tier) => (
                    <option key={tier.fullTitle} value={tier.fullTitle}>
                      {tier.fullTitle} ({tier.minRP} - {tier.maxRP} RP)
                    </option>
                  ))}
                </select>
              </div>

              {/* Current Rank Dropdown */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider block">
                  Current Rank (Starting Next Season)
                </label>
                <select
                  value={customCurrRank}
                  onChange={(e) => setCustomCurrRank(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-black/60 border border-emerald-500/30 text-white font-mono text-xs focus:border-emerald-500 focus:outline-none cursor-pointer"
                >
                  {RANK_TIERS.map((tier) => (
                    <option key={tier.fullTitle} value={tier.fullTitle}>
                      {tier.fullTitle} ({tier.minRP} - {tier.maxRP} RP)
                    </option>
                  ))}
                </select>
              </div>

              {/* Total Hours Input */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider block">
                  Total Focus Hours
                </label>
                <input
                  type="number"
                  min="0"
                  max="300"
                  step="0.5"
                  value={customHours}
                  onChange={(e) => setCustomHours(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white font-mono text-xs focus:border-amber-500/60 focus:outline-none"
                />
              </div>

              {/* Top Subject Name */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider block">
                  Top Subject Name
                </label>
                <input
                  type="text"
                  value={customTopSubject}
                  onChange={(e) => setCustomTopSubject(e.target.value)}
                  placeholder="e.g. Organic Chemistry"
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white font-mono text-xs focus:border-amber-500/60 focus:outline-none"
                />
              </div>

              {/* Active Days */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider block">
                  Active Days (1 - 31)
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={customActiveDays}
                  onChange={(e) => setCustomActiveDays(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white font-mono text-xs focus:border-amber-500/60 focus:outline-none"
                />
              </div>

              {/* Longest Streak */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider block">
                  Streak Days
                </label>
                <input
                  type="number"
                  min="0"
                  max="31"
                  value={customStreak}
                  onChange={(e) => setCustomStreak(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white font-mono text-xs focus:border-amber-500/60 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/10">
              <div className="text-xs text-zinc-400 font-mono">
                {customPrevRank === 'none' ? (
                  <span>Mode: <strong>First Season Unlock</strong> into <strong>{customCurrRank}</strong></span>
                ) : (
                  <span>Transition: <strong>{customPrevRank}</strong> → <strong>{customCurrRank}</strong></span>
                )}
              </div>

              <button
                type="button"
                onClick={handleLaunchCustom}
                className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:brightness-110 text-black font-hud font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-black" />
                <span>Play Custom Recap</span>
              </button>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════ */}
        {/* SECTION 3: REAL-FLOW TOOLS (CLEARLY LABELLED DANGER ZONE)  */}
        {/* ══════════════════════════════════════════════════════════ */}
        <section className="space-y-4 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <h2 className="text-lg font-hud font-bold text-rose-400 uppercase tracking-wider">
                3. Optional Real-Flow Tools (Requires Confirm)
              </h2>
            </div>
            <span className="text-xs font-mono text-rose-400/80">
              Live Database & State Interactions
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Tool 1: Reset Recap Banner */}
            <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-5 flex flex-col justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-rose-400 font-hud font-bold text-sm uppercase">
                  <RotateCcw className="w-4 h-4" />
                  <span>Show Banner Again</span>
                </div>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                  Clears <code>profiles.last_acknowledged_season</code> for your user and deletes cached row in <code>season_recaps</code>, so the real banner and <code>/recap</code> flow reappear on your dashboard.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setConfirmBannerReset(true)}
                className="w-full py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-hud font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Clear Flags & Show Banner</span>
              </button>
            </div>

            {/* Tool 2: simulateSeasonReset() */}
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 flex flex-col justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-hud font-bold text-sm uppercase">
                  <RefreshCw className="w-4 h-4" />
                  <span>simulateSeasonReset()</span>
                </div>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                  Calls the in-memory <code>simulateSeasonReset()</code> method on StudyContext to simulate monthly reset modal/banner without touching database tables.
                </p>
                <div className="pt-1">
                  <select
                    value={simulateScenario}
                    onChange={(e) => setSimulateScenario(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/10 text-white font-mono text-[11px]"
                  >
                    <option value="returning">Returning (Silver II → Bronze I)</option>
                    <option value="first">First Season (Unranked → Bronze I)</option>
                    <option value="zero">Zero Focus Sessions</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setConfirmSimulateReset(true)}
                className="w-full py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-hud font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Execute Simulation</span>
              </button>
            </div>

            {/* Tool 3: Date Override / Live RPC Test */}
            <div className="bg-sky-500/5 border border-sky-500/20 rounded-2xl p-5 flex flex-col justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sky-400 font-hud font-bold text-sm uppercase">
                  <Calendar className="w-4 h-4" />
                  <span>Date Override & Live RPC</span>
                </div>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                  Test the real <code>get_season_recap</code> RPC against chosen date boundaries, or open <code>/recap</code> with this month override.
                </p>
                <div className="space-y-1 pt-1">
                  <label className="text-[10px] font-mono text-zinc-400 uppercase">Simulated Current Date</label>
                  <input
                    type="date"
                    value={overrideDate}
                    onChange={(e) => setOverrideDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/10 text-white font-mono text-xs"
                  />
                  <div className="text-[10px] font-mono text-sky-300">
                    Previous Season Target: <strong>{computedSeasonKey}</strong>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleTestRpcWithDate}
                  disabled={rpcLoading}
                  className="flex-1 py-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 font-hud font-bold text-[11px] uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
                >
                  {rpcLoading ? 'Calling...' : 'Test RPC'}
                </button>
                <Link
                  href={`/recap?season=${computedSeasonKey}`}
                  target="_blank"
                  className="px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-zinc-300 hover:text-white font-mono text-[11px] flex items-center justify-center gap-1 transition-all"
                  title="Open live /recap page with this season key"
                >
                  <span>Open</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* Expandable Live RPC Results Output */}
          {rpcResult && (
            <div className="bg-black/80 border border-sky-500/30 rounded-2xl p-4 font-mono text-xs space-y-2 mt-4 animate-in fade-in">
              <div className="flex items-center justify-between text-sky-400 font-bold">
                <span>RPC Output for Season {rpcResult.seasonKey}:</span>
                <button
                  onClick={() => setRpcResult(null)}
                  className="text-zinc-500 hover:text-white"
                >
                  ✕ Close
                </button>
              </div>
              <pre className="overflow-x-auto text-zinc-300 max-h-48 scrollbar-thin p-2 rounded bg-black/50 text-[11px]">
                {JSON.stringify(rpcResult, null, 2)}
              </pre>
            </div>
          )}
        </section>
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* FULLSCREEN RECAP PRESENTATION PREVIEW MODAL                */}
      {/* ══════════════════════════════════════════════════════════ */}
      {activeRecapProps && (
        <div className="fixed inset-0 z-[100] bg-black">
          <RecapPresentation
            {...activeRecapProps}
            isDevPreview={true}
            onClose={handleClosePreview}
            forcedSlide={forcedSlide}
            speedMultiplier={speedMultiplier}
            soundEnabled={soundEnabled}
            onSlideChange={(slideIdx, total, slides) => {
              setCurrentSlideIndex(slideIdx);
              setCurrentSlideIds(slides);
            }}
          />

          {/* ══════════════════════════════════════════════════════════ */}
          {/* FLOATING PLAYBACK CONTROLS HUD                             */}
          {/* ══════════════════════════════════════════════════════════ */}
          <aside className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[110] bg-[#0c0e17]/95 border border-white/15 backdrop-blur-2xl rounded-2xl px-4 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.8)] flex items-center gap-3 sm:gap-4 max-w-[96vw] overflow-x-auto scrollbar-none animate-in slide-in-from-bottom-4 duration-200">
            {/* Replay Button */}
            <button
              type="button"
              onClick={() => setForcedSlide(0)}
              className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-hud font-bold uppercase tracking-wider text-amber-300 hover:text-amber-200 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95"
              title="Restart from Slide 0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Replay</span>
            </button>

            {/* Speed Toggle */}
            <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-white/10 shrink-0">
              <button
                type="button"
                onClick={() => setSpeedMultiplier(1)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  speedMultiplier === 1
                    ? 'bg-amber-500 text-black shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                1.0x
              </button>
              <button
                type="button"
                onClick={() => setSpeedMultiplier(0.5)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  speedMultiplier === 0.5
                    ? 'bg-amber-500 text-black shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                0.5x Slow
              </button>
            </div>

            {/* Jump to Slide Buttons */}
            <div className="flex items-center gap-1 shrink-0">
              {currentSlideIds.map((slideId, idx) => {
                const isActive = currentSlideIndex === idx;
                const isRank = slideId === 'rank';

                return (
                  <button
                    key={slideId}
                    type="button"
                    onClick={() => setForcedSlide(idx)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-hud font-bold tracking-wider uppercase transition-all cursor-pointer flex items-center gap-1 ${
                      isActive
                        ? isRank
                          ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-black shadow-md shadow-amber-500/30'
                          : 'bg-white text-black'
                        : isRank
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:bg-amber-500/30'
                        : 'bg-white/[0.05] text-zinc-400 hover:text-white border border-white/5'
                    }`}
                  >
                    {isRank && <span>★</span>}
                    <span>{idx}: {slideId}</span>
                  </button>
                );
              })}
            </div>

            {/* Sound Toggle */}
            <button
              type="button"
              onClick={() => setSoundEnabled((prev) => !prev)}
              className={`p-2 rounded-xl border transition-all cursor-pointer shrink-0 ${
                soundEnabled
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                  : 'bg-white/[0.05] border-white/10 text-zinc-400 hover:text-white'
              }`}
              title={soundEnabled ? 'Mute Audio' : 'Enable Audio'}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>

            {/* Exit Preview */}
            <button
              type="button"
              onClick={handleClosePreview}
              className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 hover:text-white transition-all cursor-pointer shrink-0"
              title="Close Preview & Return to Dev Panel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </aside>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* ZERO SESSIONS FALLBACK PREVIEW MODAL                       */}
      {/* ══════════════════════════════════════════════════════════ */}
      {showZeroFallback && (
        <div className="fixed inset-0 z-[100] bg-black">
          <EmptyRecapFallback
            seasonDisplayName="Season September 2026"
            seasonKey="2026-09"
            isDevPreview={true}
            onClose={handleClosePreview}
          />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* CONFIRMATION DIALOG: RESET BANNER & CACHE                   */}
      {/* ══════════════════════════════════════════════════════════ */}
      {confirmBannerReset && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0f111a] border border-rose-500/40 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-hud font-bold text-white text-base">Show Recap Banner Again?</h3>
                <p className="text-xs text-rose-400/80 font-mono">Live Database & Profile Update</p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 font-mono leading-relaxed">
              This will update your <code>profiles.last_acknowledged_season</code> to NULL, delete cached season recaps for your account, and clear local storage recap flags. The recap banner will appear on your dashboard.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmBannerReset(false)}
                disabled={isResettingBanner}
                className="flex-1 py-2.5 rounded-xl font-hud font-bold text-xs uppercase tracking-wider text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetBannerAndCache}
                disabled={isResettingBanner}
                className="flex-1 py-2.5 rounded-xl font-hud font-bold text-xs uppercase tracking-wider text-white bg-rose-600 hover:bg-rose-500 transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-rose-600/30"
              >
                <span>{isResettingBanner ? 'Clearing...' : 'Confirm Clear'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* CONFIRMATION DIALOG: SIMULATE SEASON RESET                  */}
      {/* ══════════════════════════════════════════════════════════ */}
      {confirmSimulateReset && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0f111a] border border-amber-500/40 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-hud font-bold text-white text-base">Run simulateSeasonReset()?</h3>
                <p className="text-xs text-amber-400/80 font-mono">StudyContext Simulation</p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 font-mono leading-relaxed">
              This will invoke <code>simulateSeasonReset(&apos;{simulateScenario}&apos;)</code> to simulate a season reset on your active local study session state.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmSimulateReset(false)}
                className="flex-1 py-2.5 rounded-xl font-hud font-bold text-xs uppercase tracking-wider text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteSimulateReset}
                className="flex-1 py-2.5 rounded-xl font-hud font-bold text-xs uppercase tracking-wider text-black bg-amber-400 hover:bg-amber-300 transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-amber-400/30"
              >
                <span>Confirm Run</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
