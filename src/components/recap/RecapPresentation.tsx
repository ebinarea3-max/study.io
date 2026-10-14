'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RankCrestBadge } from '../common/RankCrestBadge';
import { RankTierName, getRankTier, getNextTierGapInfo, getRankBadgePath } from '../../lib/rankedSystem';
import { soundFx } from '../../lib/audio';
import Link from 'next/link';
import { Volume2, VolumeX, X, Trophy, Flame, CheckCircle2, Calendar, Share2, Sparkles, ArrowRight } from 'lucide-react';

export interface RecapSubjectItem {
  name: string;
  seconds: number;
}

export interface RecapPresentationProps {
  seasonKey: string;
  seasonDisplayName: string;
  totalSeconds: number;
  activeDays: number;
  topSubject: string;
  topSubjectSeconds: number;
  subjectBreakdown: RecapSubjectItem[];
  bestWeekday?: string | null;
  peakHour?: number | null;
  longestStreak?: number;
  completedTasks?: number;
  previousRank: string | null;
  previousRP: number;
  currentRank: string;
  startingRP: number;
  currentLiveRP: number;
  isFirstSeason?: boolean;
  username?: string;
  // Dev preview enhancements
  isDevPreview?: boolean;
  onClose?: () => void;
  forcedSlide?: number;
  onSlideChange?: (currentSlide: number, totalSlides: number, slideIds: string[]) => void;
  speedMultiplier?: number;
  soundEnabled?: boolean;
}

// Parse Rank Title (e.g. "BRONZE II" -> { tier: "Bronze", division: "II" })
function parseRank(title?: string | null): { tier: RankTierName; division: string } {
  if (!title) return { tier: 'Bronze', division: 'I' };
  const parts = title.trim().split(/\s+/);
  const rawTier = parts[0] || 'Bronze';
  const tier = (rawTier.charAt(0).toUpperCase() + rawTier.slice(1).toLowerCase()) as RankTierName;
  const rawDivision = parts[1] || '';
  const divMap: Record<string, string> = { '1': 'I', '2': 'II', '3': 'III', '4': 'IV' };
  const division = divMap[rawDivision] || rawDivision.toUpperCase();
  return { tier, division };
}

function getTierGlowColor(tier: RankTierName): string {
  switch (tier) {
    case 'Bronze': return 'rgba(217, 119, 6, 0.4)';
    case 'Silver': return 'rgba(148, 163, 184, 0.4)';
    case 'Gold': return 'rgba(234, 179, 8, 0.45)';
    case 'Platinum': return 'rgba(6, 182, 212, 0.45)';
    case 'Diamond': return 'rgba(168, 85, 247, 0.5)';
    case 'Champion': return 'rgba(236, 72, 153, 0.5)';
    case 'Master': return 'rgba(99, 102, 241, 0.55)';
    case 'Grandmaster': return 'rgba(239, 68, 68, 0.6)';
    default: return 'rgba(217, 119, 6, 0.4)';
  }
}

function getTierAccent(tier: RankTierName): string {
  switch (tier) {
    case 'Bronze': return '#f59e0b';
    case 'Silver': return '#cbd5e1';
    case 'Gold': return '#fbbf24';
    case 'Platinum': return '#22d3ee';
    case 'Diamond': return '#c084fc';
    case 'Champion': return '#f472b6';
    case 'Master': return '#818cf8';
    case 'Grandmaster': return '#f87171';
    default: return '#f59e0b';
  }
}

/**
 * Animated count-up hook with ease-out cubic interpolation
 */
function useCountUp(target: number, durationMs: number = 1200, enabled: boolean = true, speedMultiplier: number = 1) {
  const [value, setValue] = useState(enabled ? 0 : target);

  useEffect(() => {
    if (!enabled) {
      setValue(target);
      return;
    }
    let startTimestamp: number | null = null;
    let frameId: number;
    const effectiveDuration = durationMs / Math.max(0.1, speedMultiplier);

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / effectiveDuration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(easeOut * target));

      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      } else {
        setValue(target);
      }
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [target, durationMs, enabled, speedMultiplier]);

  return value;
}

export default function RecapPresentation({
  seasonKey,
  seasonDisplayName,
  totalSeconds,
  activeDays,
  topSubject,
  topSubjectSeconds,
  subjectBreakdown = [],
  bestWeekday,
  peakHour,
  longestStreak = 0,
  completedTasks = 0,
  previousRank,
  previousRP,
  currentRank,
  startingRP,
  currentLiveRP,
  isFirstSeason = false,
  username = 'Scholar',
  isDevPreview = false,
  onClose,
  forcedSlide,
  onSlideChange,
  speedMultiplier = 1,
  soundEnabled,
}: RecapPresentationProps) {
  const [currentSlide, setCurrentSlide] = useState(forcedSlide !== undefined ? forcedSlide : 0);
  const [isHolding, setIsHolding] = useState(false);
  const [isMuted, setIsMuted] = useState(soundEnabled !== undefined ? !soundEnabled : false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [rankPhase, setRankPhase] = useState<'initial' | 'ended' | 'resetting' | 'impact' | 'settled'>('initial');
  const [screenShake, setScreenShake] = useState(false);
  const [showRadialFlash, setShowRadialFlash] = useState(false);

  // Sync soundEnabled if controlled
  useEffect(() => {
    if (soundEnabled !== undefined) {
      setIsMuted(!soundEnabled);
    }
  }, [soundEnabled]);

  // Sync forcedSlide if controlled
  useEffect(() => {
    if (typeof forcedSlide === 'number' && forcedSlide >= 0) {
      setCurrentSlide(forcedSlide);
    }
  }, [forcedSlide]);

  // Check prefers-reduced-motion
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(media.matches);
    const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  // Mute preference persistence
  useEffect(() => {
    if (soundEnabled !== undefined) return;
    try {
      const saved = localStorage.getItem('studypulse_recap_muted');
      if (saved !== null) {
        setIsMuted(saved === 'true');
      }
    } catch {}
  }, [soundEnabled]);

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('studypulse_recap_muted', String(next));
      } catch {}
      return next;
    });
  };

  // Mark recap as seen in localStorage and notify profiles
  useEffect(() => {
    if (isDevPreview) return; // Do NOT write to localStorage in dev preview!
    try {
      localStorage.setItem(`has_seen_recap_${seasonKey}`, 'true');
      const safeKey = seasonKey.replace('-', '_');
      localStorage.setItem(`season_settlement_acknowledged_${safeKey}`, 'true');
    } catch {}
  }, [seasonKey, isDevPreview]);

  // Derived rank objects
  const prevParsed = useMemo(() => parseRank(previousRank), [previousRank]);
  const currParsed = useMemo(() => parseRank(currentRank), [currentRank]);

  // Gap to next rank
  const gapInfo = useMemo(() => {
    const activeRP = Math.max(startingRP, currentLiveRP);
    return getNextTierGapInfo(activeRP);
  }, [startingRP, currentLiveRP]);

  // Is user promoted or demoted
  const isPromoted = useMemo(() => {
    if (!previousRP || isFirstSeason) return false;
    return startingRP > previousRP;
  }, [startingRP, previousRP, isFirstSeason]);

  // Slide list definition
  const hasPowerDay = Boolean(bestWeekday && totalSeconds > 3600);
  const slides = useMemo(() => {
    const list = [
      'hook',
      'subject',
      ...(hasPowerDay ? ['powerday'] : []),
      'consistency',
      'rank',
      'cta',
    ];
    return list;
  }, [hasPowerDay]);

  const activeSlideId = slides[currentSlide] || 'hook';
  const totalSlides = slides.length;
  const isRankSlide = activeSlideId === 'rank';
  const isCtaSlide = activeSlideId === 'cta';

  // Report slide changes to external listener (e.g. dev preview controls)
  useEffect(() => {
    onSlideChange?.(currentSlide, totalSlides, slides);
  }, [currentSlide, totalSlides, slides, onSlideChange]);

  // Sound trigger helper
  const triggerSlideSwell = useCallback(() => {
    if (!isMuted) {
      soundFx.playSlideSwell();
    }
  }, [isMuted]);

  // Navigation handlers
  const handleNext = useCallback(() => {
    if (currentSlide < totalSlides - 1) {
      triggerSlideSwell();
      setCurrentSlide((prev) => prev + 1);
    }
  }, [currentSlide, totalSlides, triggerSlideSwell]);

  const handlePrev = useCallback(() => {
    if (currentSlide > 0) {
      triggerSlideSwell();
      setCurrentSlide((prev) => prev - 1);
    }
  }, [currentSlide, triggerSlideSwell]);

  // Auto-advance progress timer (5 seconds for slides 0-3, paused on rank and cta)
  const [slideProgress, setSlideProgress] = useState(0);
  useEffect(() => {
    if (isRankSlide || isCtaSlide || isHolding) {
      return;
    }
    setSlideProgress(0);
    const intervalTime = 50;
    const duration = 5000 / Math.max(0.1, speedMultiplier);
    const increment = (intervalTime / duration) * 100;

    const interval = setInterval(() => {
      setSlideProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          handleNext();
          return 100;
        }
        return prev + increment;
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, [currentSlide, isRankSlide, isCtaSlide, isHolding, handleNext, speedMultiplier]);

  // Keyboard navigation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleNext, handlePrev]);

  // Rank Slide Choreographed Sequence
  useEffect(() => {
    if (!isRankSlide) {
      setRankPhase('initial');
      setScreenShake(false);
      setShowRadialFlash(false);
      return;
    }

    const speed = Math.max(0.1, speedMultiplier);
    setRankPhase('ended');

    // 1. Line draws and RP count down begins
    const timerReset = setTimeout(() => {
      setRankPhase('resetting');
    }, 1400 / speed);

    // 2. Impact Hit: Current rank crest slams in with tween punch
    const timerImpact = setTimeout(() => {
      setRankPhase('impact');
      setShowRadialFlash(true);
      setScreenShake(true);
      if (!isMuted) {
        soundFx.playImpactThud();
      }
      setTimeout(() => setShowRadialFlash(false), 500 / speed);
      setTimeout(() => setScreenShake(false), 450 / speed);
    }, 2800 / speed);

    // 3. Settle: Show motivational gap text
    const timerSettled = setTimeout(() => {
      setRankPhase('settled');
    }, 3600 / speed);

    return () => {
      clearTimeout(timerReset);
      clearTimeout(timerImpact);
      clearTimeout(timerSettled);
    };
  }, [isRankSlide, isMuted, speedMultiplier]);

  // RP tick down counter on rank slide
  const [rpDisplay, setRpDisplay] = useState(previousRP);
  useEffect(() => {
    if (!isRankSlide || isFirstSeason) return;

    if (rankPhase === 'ended') {
      setRpDisplay(previousRP);
    } else if (rankPhase === 'resetting' || rankPhase === 'impact' || rankPhase === 'settled') {
      let startTimestamp: number | null = null;
      const duration = 1200 / Math.max(0.1, speedMultiplier);
      let frameId: number;

      const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 2);
        const currentVal = Math.round(previousRP - (previousRP - startingRP) * easeOut);
        setRpDisplay(currentVal);

        if (progress < 1) {
          frameId = requestAnimationFrame(step);
        } else {
          setRpDisplay(startingRP);
        }
      };

      frameId = requestAnimationFrame(step);
      return () => cancelAnimationFrame(frameId);
    }
  }, [isRankSlide, rankPhase, previousRP, startingRP, isFirstSeason, speedMultiplier]);

  // Total Hours calculation
  const totalHoursNum = Math.round((totalSeconds / 3600) * 10) / 10;
  const animatedHours = useCountUp(Math.floor(totalHoursNum), 1200, activeSlideId === 'hook', speedMultiplier);
  const animatedHoursDec = Math.round((totalHoursNum - Math.floor(totalHoursNum)) * 10);

  // Background radial color computation
  const radialColor = useMemo(() => {
    if (isRankSlide) {
      if (rankPhase === 'impact' || rankPhase === 'settled') {
        return getTierGlowColor(currParsed.tier);
      }
      return getTierGlowColor(prevParsed.tier);
    }
    if (activeSlideId === 'hook' || activeSlideId === 'subject') {
      return getTierGlowColor(currParsed.tier);
    }
    return 'rgba(217, 119, 6, 0.2)';
  }, [isRankSlide, rankPhase, currParsed.tier, prevParsed.tier, activeSlideId]);

  return (
    <div
      className={`min-h-screen w-full flex flex-col justify-between bg-[#07090e] text-slate-100 relative overflow-hidden select-none cursor-pointer transition-transform duration-100 ${
        screenShake ? 'scale-[0.99] translate-y-1' : ''
      }`}
      onMouseDown={() => setIsHolding(true)}
      onMouseUp={() => setIsHolding(false)}
      onTouchStart={() => setIsHolding(true)}
      onTouchEnd={() => setIsHolding(false)}
      onClick={(e) => {
        const { clientX, currentTarget } = e;
        const rect = currentTarget.getBoundingClientRect();
        const clickRatio = (clientX - rect.left) / rect.width;
        if (clickRatio < 0.35) {
          handlePrev();
        } else {
          handleNext();
        }
      }}
    >
      {/* Background Grid & Atmospheric Textures */}
      <div className="fixed inset-0 pointer-events-none bg-dot-grid z-0" />
      <div className="fixed inset-0 pointer-events-none bg-hud-grid opacity-[0.03] z-0" />

      {/* Dynamic Radial Ambient Glow */}
      <div
        className="fixed inset-0 pointer-events-none transition-all duration-1000 z-0"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${radialColor} 0%, rgba(7, 9, 14, 0.95) 75%)`,
        }}
      />

      {/* Radial Impact Flash on Rank Reveal */}
      {showRadialFlash && (
        <div
          className="fixed inset-0 pointer-events-none z-40 transition-opacity duration-500 animate-in fade-in"
          style={{
            backgroundColor: `${getTierAccent(currParsed.tier)}28`,
          }}
        />
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* TOP HEADER: PROGRESS BARS & CONTROLS                       */}
      {/* ══════════════════════════════════════════════════════════ */}
      <header className="relative z-30 w-full max-w-4xl mx-auto pt-6 px-4 sm:px-8 flex flex-col gap-3">
        {/* Story Progress Indicators */}
        <div className="w-full flex items-center gap-1.5 sm:gap-2">
          {slides.map((_, idx) => {
            const isCompleted = idx < currentSlide;
            const isCurrent = idx === currentSlide;

            return (
              <div
                key={idx}
                className="flex-1 h-1 sm:h-1.5 rounded-full bg-white/10 overflow-hidden relative"
              >
                {isCompleted && <div className="h-full w-full bg-white rounded-full" />}
                {isCurrent && (
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-300 rounded-full transition-all duration-75"
                    style={{
                      width: isRankSlide || isCtaSlide ? '100%' : `${slideProgress}%`,
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Top Control Bar */}
        <div className="flex items-center justify-between text-xs font-mono text-zinc-400 pt-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] tracking-widest uppercase font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
              {seasonDisplayName.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Toggle */}
            <button
              type="button"
              onClick={toggleMute}
              className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-zinc-300 hover:text-white transition-all cursor-pointer"
              title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>

            {/* Close / Return to Dashboard */}
            {onClose ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-zinc-300 hover:text-white transition-all cursor-pointer"
                title="Exit Preview"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <Link
                href="/"
                onClick={(e) => e.stopPropagation()}
                className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-zinc-300 hover:text-white transition-all cursor-pointer"
                title="Close Recap"
              >
                <X className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* MAIN SLIDE STAGE                                           */}
      {/* ══════════════════════════════════════════════════════════ */}
      <main className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-8 py-6 flex-1 flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {/* SLIDE 0: HOOK (Total Focus Hours) */}
          {activeSlideId === 'hook' && (
            <motion.div
              key="hook"
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -20 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="w-full flex flex-col items-center justify-center text-center space-y-6"
            >
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="text-xs sm:text-sm font-mono tracking-widest uppercase text-zinc-400 font-bold"
              >
                // SEASON PERFORMANCE DOSSIER
              </motion.div>

              <h2 className="text-xl sm:text-3xl font-hud font-bold text-slate-300 tracking-wider uppercase">
                Last season, you locked in for…
              </h2>

              <div className="relative py-4">
                <div
                  className="text-7xl sm:text-9xl font-black font-hud text-transparent bg-clip-text bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 drop-shadow-[0_0_45px_rgba(245,158,11,0.45)] tracking-tight"
                >
                  {prefersReducedMotion ? totalHoursNum : `${animatedHours}.${animatedHoursDec}`}
                  <span className="text-3xl sm:text-5xl ml-2 font-mono font-bold text-amber-300">
                    HRS
                  </span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-zinc-400 font-mono max-w-md">
                Every focused second forged your rank standings in {seasonDisplayName}.
              </p>
            </motion.div>
          )}

          {/* SLIDE 1: TOP SUBJECT */}
          {activeSlideId === 'subject' && (
            <motion.div
              key="subject"
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -20 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="w-full max-w-xl flex flex-col items-center justify-center text-center space-y-6"
            >
              <div className="text-xs font-mono tracking-widest uppercase text-zinc-400 font-bold">
                // INTELLECTUAL FOCUS
              </div>

              <h2 className="text-xl sm:text-2xl font-hud font-bold text-slate-300 tracking-wider uppercase">
                Your Dominant Subject Was
              </h2>

              <div className="text-4xl sm:text-6xl font-black font-hud text-white tracking-wide drop-shadow-md">
                {topSubject || 'General Study'}
              </div>

              <div className="text-sm font-mono font-bold text-amber-400">
                {(topSubjectSeconds / 3600).toFixed(1)} HOURS LOGGED
              </div>

              {/* Subject Breakdown Mini Bar Chart */}
              {subjectBreakdown.length > 0 && (
                <div className="w-full bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl p-5 space-y-3 mt-4 text-left">
                  <div className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 font-bold mb-2">
                    Subject Distribution
                  </div>
                  {subjectBreakdown.slice(0, 4).map((sub, i) => {
                    const ratio = topSubjectSeconds > 0 ? (sub.seconds / topSubjectSeconds) * 100 : 0;
                    const hours = (sub.seconds / 3600).toFixed(1);

                    return (
                      <div key={sub.name} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-mono text-zinc-300">
                          <span className="truncate max-w-[200px] font-semibold">{sub.name}</span>
                          <span className="text-zinc-400">{hours}h</span>
                        </div>
                        <div className="w-full bg-white/[0.05] h-2 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(5, Math.min(100, ratio))}%` }}
                            transition={{ duration: 0.6, delay: 0.15 + i * 0.1, ease: 'easeOut' }}
                            className={`h-full rounded-full ${
                              i === 0
                                ? 'bg-gradient-to-r from-amber-500 to-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                                : 'bg-white/30'
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* SLIDE 2: POWER DAY */}
          {activeSlideId === 'powerday' && (
            <motion.div
              key="powerday"
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -20 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="w-full max-w-xl flex flex-col items-center justify-center text-center space-y-6"
            >
              <div className="text-xs font-mono tracking-widest uppercase text-zinc-400 font-bold">
                // PEAK RHYTHM
              </div>

              <h2 className="text-2xl sm:text-3xl font-hud font-black text-amber-400 tracking-wider uppercase">
                {bestWeekday} Was Your Power Day
              </h2>

              <p className="text-xs sm:text-sm text-zinc-400 font-mono">
                Your highest focus density occurred on {bestWeekday}s, peaking around{' '}
                <strong className="text-white font-mono">{peakHour !== null && peakHour !== undefined ? `${peakHour}:00` : '14:00'} UTC</strong>.
              </p>

              {/* Weekday Visual Bars */}
              <div className="w-full bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl p-6 flex items-end justify-between gap-2 h-44 mt-4">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                  const isPowerDay = bestWeekday?.toLowerCase().startsWith(day.toLowerCase().slice(0, 3));
                  const barHeight = isPowerDay ? 95 : 35 + ((day.charCodeAt(0) * 7) % 35);

                  return (
                    <div key={day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${barHeight}%` }}
                        transition={{ duration: 0.7, ease: 'easeOut' }}
                        className={`w-full rounded-t-lg transition-colors ${
                          isPowerDay
                            ? 'bg-gradient-to-t from-amber-500 to-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.6)]'
                            : 'bg-white/15 hover:bg-white/25'
                        }`}
                      />
                      <span
                        className={`text-[10px] font-mono uppercase font-bold ${
                          isPowerDay ? 'text-amber-300' : 'text-zinc-500'
                        }`}
                      >
                        {day}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* SLIDE 3: CONSISTENCY & STATS */}
          {activeSlideId === 'consistency' && (
            <motion.div
              key="consistency"
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -20 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="w-full max-w-2xl flex flex-col items-center justify-center text-center space-y-6"
            >
              <div className="text-xs font-mono tracking-widest uppercase text-zinc-400 font-bold">
                // DISCIPLINE INDEX
              </div>

              <h2 className="text-xl sm:text-3xl font-hud font-bold text-slate-300 tracking-wider uppercase">
                Consistency That Builds Champions
              </h2>

              {/* 3 Cybernetic Stat Tiles */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mt-4">
                {/* Active Days */}
                <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl p-5 flex flex-col items-center justify-center space-y-2 hover:border-amber-500/30 transition-colors">
                  <Calendar className="w-5 h-5 text-amber-400" />
                  <div className="text-3xl sm:text-4xl font-black font-hud text-white">
                    {activeDays}
                  </div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold">
                    Active Days
                  </div>
                </div>

                {/* Longest Streak */}
                <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl p-5 flex flex-col items-center justify-center space-y-2 hover:border-amber-500/30 transition-colors">
                  <Flame className="w-5 h-5 text-orange-400" />
                  <div className="text-3xl sm:text-4xl font-black font-hud text-white">
                    {longestStreak || Math.min(activeDays, 7)}
                  </div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold">
                    Day Streak
                  </div>
                </div>

                {/* Tasks Completed */}
                <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl p-5 flex flex-col items-center justify-center space-y-2 hover:border-amber-500/30 transition-colors">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <div className="text-3xl sm:text-4xl font-black font-hud text-white">
                    {completedTasks}
                  </div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold">
                    Tasks Cleared
                  </div>
                </div>
              </div>

              <p className="text-xs text-zinc-500 font-mono">
                Consistency compounds faster than raw hours.
              </p>
            </motion.div>
          )}

          {/* SLIDE 4: THE RANK CLIMAX SLIDE */}
          {activeSlideId === 'rank' && (
            <motion.div
              key="rank"
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 1.04 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-3xl flex flex-col items-center justify-center text-center space-y-6"
            >
              <div className="text-xs font-mono tracking-widest uppercase text-amber-400 font-bold">
                // SEASON SETTLEMENT & PLACEMENT
              </div>

              {/* Side-by-Side Rank Crest Stage */}
              <div className="w-full flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 py-4">
                {/* 1. LEFT: PREVIOUS SEASON END RANK */}
                <div className="flex flex-col items-center w-60">
                  <div className="text-xs font-mono font-bold tracking-widest uppercase text-zinc-400 mb-2">
                    SEASON ENDED AT
                  </div>

                  {/* Fixed-size Crest Container */}
                  <div
                    className="relative w-44 h-44 flex items-center justify-center transition-all duration-700"
                    style={{
                      opacity: rankPhase === 'impact' || rankPhase === 'settled' ? 0.5 : 1,
                    }}
                  >
                    <div className="absolute inset-0 bg-amber-500/10 blur-[50px] rounded-full pointer-events-none" />
                    <RankCrestBadge
                      tier={prevParsed.tier}
                      division={prevParsed.division}
                      size={150}
                      className="relative z-10"
                    />
                  </div>

                  <div className="text-xl sm:text-2xl font-black font-hud text-white uppercase tracking-wider mt-2">
                    {previousRank || 'BRONZE I'}
                  </div>
                  <div className="text-xs font-mono text-amber-400 font-semibold">
                    {previousRP} RP
                  </div>
                </div>

                {/* 2. MIDDLE: CONNECTING RESET ARROW & RP COUNTER */}
                <div className="flex flex-col items-center justify-center w-40 py-2">
                  <div className="text-[10px] font-mono tracking-widest uppercase text-zinc-500 font-bold mb-1">
                    SEASON RESET
                  </div>

                  {/* Connecting Line */}
                  <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden my-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: rankPhase === 'initial' || rankPhase === 'ended' ? '0%' : '100%',
                      }}
                      transition={{ duration: 1.0, ease: 'easeInOut' }}
                      className="h-full bg-gradient-to-r from-amber-500 to-emerald-400"
                    />
                  </div>

                  {/* RP Tick Down Counter */}
                  <div className="text-sm font-mono font-bold text-zinc-300">
                    {rpDisplay} RP
                  </div>
                </div>

                {/* 3. RIGHT: CURRENT STARTING RANK (IMPACT HIT) */}
                <div className="flex flex-col items-center w-60">
                  <div className="text-xs font-mono font-bold tracking-widest uppercase text-emerald-400 mb-2">
                    YOU START THIS SEASON AT
                  </div>

                  {/* Fixed-size Crest Container with Tween Punch on Reveal */}
                  <div className="relative w-44 h-44 flex items-center justify-center">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={
                        rankPhase === 'impact' || rankPhase === 'settled'
                          ? prefersReducedMotion
                            ? { opacity: 1, scale: 1 }
                            : { opacity: 1, scale: [1, 0.85, 1.08, 1] }
                          : { opacity: 0, scale: 0.6 }
                      }
                      transition={{
                        duration: 0.5,
                        times: [0, 0.35, 0.7, 1],
                        ease: 'easeOut',
                      }}
                      className="relative z-10 flex items-center justify-center"
                    >
                      <div
                        className="absolute inset-0 blur-[60px] rounded-full pointer-events-none"
                        style={{ backgroundColor: getTierGlowColor(currParsed.tier) }}
                      />
                      <RankCrestBadge
                        tier={currParsed.tier}
                        division={currParsed.division}
                        size={150}
                        className="relative z-10"
                      />
                    </motion.div>
                  </div>

                  <div className="text-xl sm:text-2xl font-black font-hud text-white uppercase tracking-wider mt-2">
                    {currentRank || 'BRONZE I'}
                  </div>
                  <div className="text-xs font-mono text-emerald-400 font-semibold">
                    {startingRP} RP
                  </div>
                </div>
              </div>

              {/* Motivational Tier Gap Banner */}
              <div className="min-h-[50px] flex items-center justify-center">
                {(rankPhase === 'impact' || rankPhase === 'settled') && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col items-center gap-1.5"
                  >
                    {isPromoted ? (
                      <span className="text-xs font-mono uppercase px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                        PROMOTED TO NEW DIVISION!
                      </span>
                    ) : (
                      <span className="text-xs font-mono text-zinc-400">
                        New season. Climb back higher.
                      </span>
                    )}

                    {gapInfo && (
                      <span className="text-xs font-mono font-bold text-amber-300">
                        ⚔️ {gapInfo.rpNeeded} RP to {gapInfo.nextTierTitle}
                      </span>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* SLIDE 5: FINAL CTA SLIDE */}
          {activeSlideId === 'cta' && (
            <motion.div
              key="cta"
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 1.04 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-lg flex flex-col items-center justify-center text-center space-y-8"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-black font-black shadow-lg shadow-amber-500/30">
                <Trophy className="w-8 h-8 stroke-[2]" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl sm:text-4xl font-black font-hud text-white tracking-widest uppercase">
                  READY FOR THE NEW CLIMB?
                </h2>
                <p className="text-xs sm:text-sm text-zinc-400 font-mono max-w-md mx-auto">
                  Your season reset is complete. The ranked leaderboards are open for new personal bests.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/leaderboard"
                  onClick={(e) => e.stopPropagation()}
                  className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-400 hover:brightness-110 rounded-xl text-black font-hud font-bold tracking-widest transition-all shadow-lg shadow-amber-500/25 active:scale-95 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>START THE GRIND</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                {onClose ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onClose();
                    }}
                    className="w-full sm:w-auto px-6 py-4 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 rounded-xl text-amber-300 hover:text-amber-200 font-mono text-xs font-semibold tracking-wider transition-all active:scale-95 text-center cursor-pointer"
                  >
                    RETURN TO DEV PREVIEW
                  </button>
                ) : (
                  <Link
                    href="/"
                    onClick={(e) => e.stopPropagation()}
                    className="w-full sm:w-auto px-6 py-4 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 rounded-xl text-zinc-300 hover:text-white font-mono text-xs font-semibold tracking-wider transition-all active:scale-95 text-center"
                  >
                    RETURN TO DASHBOARD
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* BOTTOM FOOTER: TAP HINT & NAVIGATION CHEVRONS             */}
      {/* ══════════════════════════════════════════════════════════ */}
      <footer className="relative z-30 w-full max-w-4xl mx-auto pb-8 px-4 flex items-center justify-between text-xs font-mono text-zinc-500">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handlePrev();
          }}
          disabled={currentSlide === 0}
          className={`px-3 py-1.5 rounded-lg border border-white/10 transition-colors ${
            currentSlide === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/10 text-zinc-300'
          }`}
        >
          ← PREV
        </button>

        <div className="text-[11px] uppercase tracking-widest text-zinc-500 font-bold animate-pulse">
          {currentSlide === totalSlides - 1 ? 'SEASON COMPLETE' : 'TAP RIGHT TO ADVANCE · HOLD TO PAUSE'}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          disabled={currentSlide === totalSlides - 1}
          className={`px-3 py-1.5 rounded-lg border border-white/10 transition-colors ${
            currentSlide === totalSlides - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/10 text-zinc-300'
          }`}
        >
          NEXT →
        </button>
      </footer>
    </div>
  );
}
