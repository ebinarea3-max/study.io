'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RankCrestBadge } from '../common/RankCrestBadge';
import { RankTierName, getRankBadgePath } from '../../lib/rankedSystem';
import { getRankBadgeSources } from '../../lib/preloadRankBadges';
import { soundFx } from '../../lib/audio';
import Link from 'next/link';
import { Volume2, VolumeX, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { SeasonShareCard } from './SeasonShareCard';
import { useThemeColorOverride } from '../../hooks/useThemeColorOverride';

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
  // Consistency slide calendar data
  activeDates?: string[];
  streakStartDate?: string | null;
  streakEndDate?: string | null;
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
  activeDates,
  streakStartDate,
  streakEndDate,
  isDevPreview = false,
  onClose,
  forcedSlide,
  onSlideChange,
  speedMultiplier = 1,
  soundEnabled,
}: RecapPresentationProps) {
  useThemeColorOverride('#07090e');
  const [currentSlide, setCurrentSlide] = useState(forcedSlide !== undefined ? forcedSlide : 0);
  const [isHolding, setIsHolding] = useState(false);
  const [isMuted, setIsMuted] = useState(soundEnabled !== undefined ? !soundEnabled : false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [rankPhase, setRankPhase] = useState<'initial' | 'ended' | 'resetting' | 'impact' | 'settled'>('initial');
  const [showFirstSlideHint, setShowFirstSlideHint] = useState(true);

  // Responsive & Light Theme Scoping
  const [isMobile, setIsMobile] = useState(false);
  const [isLightTheme, setIsLightTheme] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkViewportAndTheme = () => {
      setIsMobile(window.innerWidth < 640);
      const theme = document.documentElement.dataset.theme;
      setIsLightTheme(
        theme === 'paper' ||
        theme === 'matcha' ||
        document.documentElement.classList.contains('light')
      );
    };
    checkViewportAndTheme();
    window.addEventListener('resize', checkViewportAndTheme);
    return () => window.removeEventListener('resize', checkViewportAndTheme);
  }, []);

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

  // Hide first slide hint after 4 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowFirstSlideHint(false);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

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
      const now = new Date();
      const currentMonth = now.toISOString().substring(0, 7);
      const safeKey = seasonKey.replace('-', '_');
      const safeCurrentKey = currentMonth.replace('-', '_');

      localStorage.setItem(`has_seen_recap_${seasonKey}`, 'true');
      localStorage.setItem(`has_seen_recap_${currentMonth}`, 'true');
      localStorage.setItem('has_seen_recap_current', 'true');
      localStorage.setItem('studypulse_recap_viewed', 'true');
      localStorage.setItem(`season_settlement_acknowledged_${safeKey}`, 'true');
      localStorage.setItem(`season_reset_alert_acknowledged_${safeCurrentKey}`, 'true');
    } catch {}
  }, [seasonKey, isDevPreview]);

  // Derived rank objects
  const prevParsed = useMemo(() => parseRank(previousRank), [previousRank]);
  const currParsed = useMemo(() => parseRank(currentRank), [currentRank]);

  // Preload rank crest badges immediately so Slide 5 images are instant
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const prevSources = getRankBadgeSources(prevParsed.tier as any, prevParsed.division as any);
      const currSources = getRankBadgeSources(currParsed.tier as any, currParsed.division as any);
      const list = [prevSources.webp, prevSources.png, currSources.webp, currSources.png];
      list.forEach((url) => {
        const img = new Image();
        img.src = url;
      });
    } catch {}
  }, [prevParsed.tier, prevParsed.division, currParsed.tier, currParsed.division]);

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
      ...(activeDays > 0 ? ['consistency'] : []),
      'rank',
      'cta',
    ];
    return list;
  }, [hasPowerDay, activeDays]);

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

  // Auto-advance progress timer (6.5s for consistency, 5.0s for others, paused on rank, cta, and hold)
  const [slideProgress, setSlideProgress] = useState(0);

  // Reset progress when currentSlide changes
  useEffect(() => {
    setSlideProgress(0);
  }, [currentSlide]);

  useEffect(() => {
    if (isRankSlide || isCtaSlide || isHolding) {
      return;
    }

    const intervalTime = 40;
    const currentDuration = (activeSlideId === 'consistency' ? 6500 : 5000) / Math.max(0.1, speedMultiplier);
    const increment = (intervalTime / currentDuration) * 100;

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
  }, [currentSlide, activeSlideId, isRankSlide, isCtaSlide, isHolding, handleNext, speedMultiplier]);

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

  // Rank Slide Calm Transition Sequence (No rank animations, static crests)
  useEffect(() => {
    if (!isRankSlide) {
      setRankPhase('initial');
      return;
    }

    const speed = Math.max(0.1, speedMultiplier);
    setRankPhase('ended');

    // Connector line draws smoothly and RP updates
    const timerReset = setTimeout(() => {
      setRankPhase('resetting');
    }, 300 / speed);

    const timerSettled = setTimeout(() => {
      setRankPhase('settled');
    }, 1200 / speed);

    return () => {
      clearTimeout(timerReset);
      clearTimeout(timerSettled);
    };
  }, [isRankSlide, speedMultiplier]);

  // RP tick down counter on rank slide
  const [rpDisplay, setRpDisplay] = useState(previousRP);
  useEffect(() => {
    if (!isRankSlide || isFirstSeason) return;

    if (rankPhase === 'ended') {
      setRpDisplay(previousRP);
    } else if (rankPhase === 'resetting' || rankPhase === 'impact' || rankPhase === 'settled') {
      let startTimestamp: number | null = null;
      const duration = 750 / Math.max(0.1, speedMultiplier);
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

  // ══════════════════════════════════════════════════════════
  // CONSISTENCY CALENDAR & CHOREOGRAPHY STATE
  // ══════════════════════════════════════════════════════════
  const [consistencyElapsedMs, setConsistencyElapsedMs] = useState(0);
  const lastConsistencyFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (activeSlideId !== 'consistency') {
      setConsistencyElapsedMs(0);
      lastConsistencyFrameRef.current = null;
      return;
    }

    if (prefersReducedMotion) {
      setConsistencyElapsedMs(5000);
      return;
    }

    setConsistencyElapsedMs(0);
    lastConsistencyFrameRef.current = null;

    let animId: number;
    const loop = (timestamp: number) => {
      if (lastConsistencyFrameRef.current === null) {
        lastConsistencyFrameRef.current = timestamp;
      }
      const delta = timestamp - lastConsistencyFrameRef.current;
      lastConsistencyFrameRef.current = timestamp;

      if (!isHolding) {
        setConsistencyElapsedMs((prev) => prev + delta * Math.max(0.1, speedMultiplier));
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      lastConsistencyFrameRef.current = null;
    };
  }, [activeSlideId, isHolding, speedMultiplier, prefersReducedMotion]);

  // Calendar matrix memo
  const calendarData = useMemo(() => {
    const [yStr, mStr] = (seasonKey || '2026-09').split('-');
    const year = parseInt(yStr, 10) || 2026;
    const month = parseInt(mStr, 10) || 9; // 1-12
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    // Monday = 0, Sunday = 6
    const firstDayWeekday = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;

    let activeSet = new Set<string>(activeDates || []);
    let resolvedStreakStart = streakStartDate || null;
    let resolvedStreakEnd = streakEndDate || null;

    // Synthetic fallback if activeDates was not provided
    if (activeSet.size === 0 && activeDays > 0) {
      const sLen = Math.min(longestStreak || Math.min(activeDays, 7), activeDays, daysInMonth);
      const sStartDay = Math.max(1, Math.min(5, daysInMonth - sLen + 1));
      const sEndDay = sStartDay + sLen - 1;
      resolvedStreakStart = `${year}-${String(month).padStart(2, '0')}-${String(sStartDay).padStart(2, '0')}`;
      resolvedStreakEnd = `${year}-${String(month).padStart(2, '0')}-${String(sEndDay).padStart(2, '0')}`;

      const synthDates: string[] = [];
      for (let d = sStartDay; d <= sEndDay; d++) {
        synthDates.push(`${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
      }
      let remaining = activeDays - synthDates.length;
      for (let d = 1; d <= daysInMonth && remaining > 0; d++) {
        const ds = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        if (!synthDates.includes(ds)) {
          synthDates.push(ds);
          remaining--;
        }
      }
      activeSet = new Set(synthDates);
    }

    interface DayCell {
      dayNum: number;
      dateStr: string;
      colIndex: number;
      rowIndex: number;
      isActive: boolean;
      isStreak: boolean;
      activeOrderIndex: number;
      streakOrderIndex: number;
    }

    const cells: DayCell[] = [];
    let currentActiveOrder = 0;
    let currentStreakOrder = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isActive = activeSet.has(dateStr);
      const isStreak = Boolean(
        resolvedStreakStart &&
        resolvedStreakEnd &&
        dateStr >= resolvedStreakStart &&
        dateStr <= resolvedStreakEnd &&
        isActive
      );
      const gridIndex = firstDayWeekday + (day - 1);
      const colIndex = gridIndex % 7;
      const rowIndex = Math.floor(gridIndex / 7);

      cells.push({
        dayNum: day,
        dateStr,
        colIndex,
        rowIndex,
        isActive,
        isStreak,
        activeOrderIndex: isActive ? currentActiveOrder++ : -1,
        streakOrderIndex: isStreak ? currentStreakOrder++ : -1,
      });
    }

    return {
      daysInMonth,
      firstDayWeekday,
      cells,
      totalActive: currentActiveOrder,
      totalStreak: currentStreakOrder,
      streakStart: resolvedStreakStart,
      streakEnd: resolvedStreakEnd,
    };
  }, [seasonKey, activeDates, streakStartDate, streakEndDate, activeDays, longestStreak]);

  const cElapsed = prefersReducedMotion ? 5000 : consistencyElapsedMs;

  // Active cells light up in date order ~25ms apart
  const activeInterval = 25;
  let litActiveCount = 0;
  for (const cell of calendarData.cells) {
    if (cell.isActive) {
      const startTime = 300 + cell.activeOrderIndex * activeInterval;
      if (cElapsed >= startTime) {
        litActiveCount++;
      }
    }
  }

  // Streak highlight interval
  const streakInterval = 22;
  let litStreakCount = 0;
  for (const cell of calendarData.cells) {
    if (cell.isStreak) {
      const startTime = 1200 + cell.streakOrderIndex * streakInterval;
      if (cElapsed >= startTime) {
        litStreakCount++;
      }
    }
  }

  // Tasks count up
  let tasksCountDisplay = 0;
  if (completedTasks > 0) {
    if (cElapsed >= 2600) {
      tasksCountDisplay = completedTasks;
    } else if (cElapsed > 1800) {
      const p = (cElapsed - 1800) / 800;
      const easeOut = 1 - Math.pow(1 - p, 3);
      tasksCountDisplay = Math.round(easeOut * completedTasks);
    }
  }

  const consistencyHeadline = useMemo(() => {
    const ratio = calendarData.daysInMonth > 0 ? activeDays / calendarData.daysInMonth : 0;
    if (ratio >= 0.8) return 'You barely missed a day.';
    if (ratio >= 0.5) return 'More days on than off.';
    return 'Every day you showed up counted.';
  }, [activeDays, calendarData.daysInMonth]);

  const displayedActiveDays = prefersReducedMotion ? activeDays : litActiveCount;
  const displayedStreak = prefersReducedMotion ? (longestStreak || calendarData.totalStreak) : litStreakCount;
  const displayedTasks = prefersReducedMotion ? completedTasks : tasksCountDisplay;

  return (
    <div
      style={{
        colorScheme: 'dark',
        ...(isLightTheme
          ? {
              '--bg': '#07090e',
              '--surface': '#0F1117',
              '--surface-2': '#141721',
              '--border': 'rgba(255, 255, 255, 0.1)',
              '--border-strong': 'rgba(255, 255, 255, 0.18)',
              '--text': '#FFFFFF',
              '--text-dim': '#94A3B8',
              '--text-faint': '#64748B',
              '--accent': '#F59E0B',
              '--accent-contrast': '#08090C',
              '--grid-dot': 'rgba(255, 255, 255, 0.06)',
              '--fg': '255 255 255',
            }
          : {}),
        backgroundColor: 'var(--bg, #07090e)',
        color: 'var(--text, #ffffff)',
      }}
      className="min-h-screen w-full flex flex-col justify-between relative overflow-hidden select-none cursor-pointer"
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
      {/* ══════════════════════════════════════════════════════════ */}
      {/* 1. PERSISTENT BACKGROUND LAYER                             */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div className="fixed inset-0 pointer-events-none bg-dot-grid opacity-60 z-0" />

      {/* One large soft glow in --accent at ~10% opacity that drifts slowly over 40s */}
      <motion.div
        animate={
          prefersReducedMotion
            ? { x: 0, y: 0 }
            : {
                x: [-35, 35, -25, 25, -35],
                y: [-25, 25, -35, 30, -25],
              }
        }
        transition={{
          duration: 40,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] sm:w-[800px] h-[650px] sm:h-[800px] rounded-full pointer-events-none z-0 blur-[140px]"
        style={{
          backgroundColor: 'var(--accent, #ffffff)',
          opacity: 0.1,
        }}
      />

      {/* Gentle vignette */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 45%, rgba(0, 0, 0, 0.65) 100%)',
        }}
      />

      {/* ══════════════════════════════════════════════════════════ */}
      {/* 2. TOP CHROME: PROGRESS BARS & CONTROLS                    */}
      {/* ══════════════════════════════════════════════════════════ */}
      <header className="relative z-30 w-full max-w-[820px] mx-auto pt-6 px-5 sm:px-8 flex flex-col gap-3">
        {/* Progress Segments: 4px tall, rounded, --fg at 14% upcoming, --accent done & current */}
        <div className="w-full flex items-center gap-1.5 sm:gap-2">
          {slides.map((_, idx) => {
            const isCompleted = idx < currentSlide;
            const isCurrent = idx === currentSlide;

            return (
              <div
                key={idx}
                className="flex-1 h-1 rounded-full overflow-hidden relative"
                style={{
                  backgroundColor: 'rgba(var(--fg, 255 255 255), 0.14)',
                }}
              >
                {isCompleted && (
                  <div
                    className="h-full w-full rounded-full"
                    style={{ backgroundColor: 'var(--accent, #ffffff)' }}
                  />
                )}
                {isCurrent && (
                  <div
                    className="h-full rounded-full transition-all duration-75"
                    style={{
                      width: isRankSlide || isCtaSlide ? '100%' : `${slideProgress}%`,
                      backgroundColor: 'var(--accent, #ffffff)',
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Top Bar: Neutral month chip & Quiet Icon Buttons */}
        <div className="flex items-center justify-between pt-1">
          {/* Neutral month chip (clean, sentence case, no yellow) */}
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-[var(--surface)] border border-[var(--border)] text-xs font-mono font-medium text-[var(--text-dim)] shadow-sm">
            <span>{seasonDisplayName}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Toggle (Quiet 36px icon button) */}
            <button
              type="button"
              onClick={toggleMute}
              className="w-9 h-9 rounded-xl bg-[var(--surface)] hover:bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-dim)] hover:text-[var(--text)] transition-all cursor-pointer flex items-center justify-center shadow-sm"
              title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Close Button (Quiet 36px icon button) */}
            {onClose ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="w-9 h-9 rounded-xl bg-[var(--surface)] hover:bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-dim)] hover:text-[var(--text)] transition-all cursor-pointer flex items-center justify-center shadow-sm"
                title="Exit Preview"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <Link
                href="/?tab=leaderboard"
                onClick={(e) => {
                  e.stopPropagation();
                  try {
                    const now = new Date();
                    const currentMonth = now.toISOString().substring(0, 7);
                    localStorage.setItem(`has_seen_recap_${seasonKey}`, 'true');
                    localStorage.setItem(`has_seen_recap_${currentMonth}`, 'true');
                    localStorage.setItem('has_seen_recap_current', 'true');
                    localStorage.setItem('studypulse_recap_viewed', 'true');
                  } catch {}
                }}
                className="w-9 h-9 rounded-xl bg-[var(--surface)] hover:bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-dim)] hover:text-[var(--text)] transition-all cursor-pointer flex items-center justify-center shadow-sm"
                title="Close Recap"
              >
                <X className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* 3. MAIN SLIDE STAGE (CONTENT COLUMN UP TO 820px)           */}
      {/* ══════════════════════════════════════════════════════════ */}
      <main className="relative z-10 w-full max-w-[820px] mx-auto px-5 sm:px-8 py-6 flex-1 flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {/* ────────────────────────────────────────────────────────── */}
          {/* SLIDE 1: HOOK (Total Study Hours)                          */}
          {/* ────────────────────────────────────────────────────────── */}
          {activeSlideId === 'hook' && (
            <motion.div
              key="hook"
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -16 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="w-full flex flex-col items-center justify-center text-center space-y-5"
            >
              {/* Headline (sentence case, 36 to 52px) */}
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.09, ease: 'easeOut' }}
                className="text-3xl sm:text-4xl md:text-5xl font-hud font-bold text-[var(--text)] tracking-tight"
              >
                Last season you studied
              </motion.h2>

              {/* Hero Number (96 to 150px) with Soft Accent Glow */}
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, delay: 0.18, ease: 'easeOut' }}
                className="relative py-4 flex items-baseline justify-center"
              >
                <div
                  className="absolute inset-0 rounded-full blur-[80px] pointer-events-none"
                  style={{
                    backgroundColor: 'var(--accent, #ffffff)',
                    opacity: 0.12,
                  }}
                />
                <span className="text-7xl sm:text-8xl md:text-9xl font-black font-hud text-[var(--text)] tracking-tight tabular-nums relative z-10">
                  {prefersReducedMotion ? totalHoursNum : `${animatedHours}.${animatedHoursDec}`}
                </span>
                <span className="text-2xl sm:text-4xl font-sans font-medium text-[var(--text-dim)] ml-3 sm:ml-4 relative z-10">
                  hours
                </span>
              </motion.div>

              {/* Supporting Line (12 words or fewer) */}
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.27, ease: 'easeOut' }}
                className="text-base sm:text-lg text-[var(--text-dim)] font-sans max-w-md mx-auto leading-relaxed"
              >
                Every dedicated minute added up across {seasonDisplayName}.
              </motion.p>
            </motion.div>
          )}

          {/* ────────────────────────────────────────────────────────── */}
          {/* SLIDE 2: TOP SUBJECT                                       */}
          {/* ────────────────────────────────────────────────────────── */}
          {activeSlideId === 'subject' && (
            <motion.div
              key="subject"
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -16 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="w-full max-w-xl flex flex-col items-center justify-center text-center space-y-5"
            >
              {/* Eyebrow: sentence case */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.09, ease: 'easeOut' }}
                className="text-xs sm:text-sm font-mono tracking-wider text-[var(--text-dim)] uppercase font-medium"
              >
                Your top subject
              </motion.div>

              {/* Subject Name Huge (36 to 52px) */}
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.18, ease: 'easeOut' }}
                className="text-3xl sm:text-5xl md:text-6xl font-black font-hud text-[var(--text)] tracking-tight truncate max-w-full px-2"
              >
                {topSubject || 'General Study'}
              </motion.h2>

              {/* One line sentence */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.27, ease: 'easeOut' }}
                className="text-base sm:text-lg font-sans text-[var(--text-dim)]"
              >
                {(topSubjectSeconds / 3600).toFixed(1)} hours
                {totalSeconds > 0
                  ? `, ${Math.round((topSubjectSeconds / totalSeconds) * 100)}% of your study time`
                  : ' recorded this season'}
              </motion.div>

              {/* Clean Panel: surface, hairline border, 16px radius, listing up to 4 subjects */}
              {subjectBreakdown.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.36, ease: 'easeOut' }}
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 space-y-3.5 mt-2 text-left shadow-card"
                >
                  {subjectBreakdown.slice(0, 4).map((sub, i) => {
                    const ratio = topSubjectSeconds > 0 ? (sub.seconds / topSubjectSeconds) * 100 : 0;
                    const hours = (sub.seconds / 3600).toFixed(1);

                    return (
                      <div key={sub.name} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs sm:text-sm font-sans">
                          <span className="truncate max-w-[240px] text-[var(--text)] font-medium">
                            {sub.name}
                          </span>
                          <span className="text-[var(--text-dim)] font-mono text-xs">
                            {hours}h
                          </span>
                        </div>
                        <div
                          className="w-full h-1 rounded-full overflow-hidden"
                          style={{ backgroundColor: 'rgba(var(--fg, 255 255 255), 0.08)' }}
                        >
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(6, Math.min(100, ratio))}%` }}
                            transition={{ duration: 0.5, delay: 0.2 + i * 0.07, ease: 'easeOut' }}
                            className="h-full rounded-full"
                            style={{
                              backgroundColor:
                                i === 0
                                  ? 'var(--accent, #ffffff)'
                                  : 'rgba(var(--fg, 255 255 255), 0.28)',
                              boxShadow:
                                i === 0 ? '0 0 10px var(--glow, rgba(255,255,255,0.3))' : 'none',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ────────────────────────────────────────────────────────── */}
          {/* SLIDE 3: BEST DAY                                          */}
          {/* ────────────────────────────────────────────────────────── */}
          {activeSlideId === 'powerday' && (
            <motion.div
              key="powerday"
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -16 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="w-full max-w-xl flex flex-col items-center justify-center text-center space-y-6"
            >
              {/* Eyebrow */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.09, ease: 'easeOut' }}
                className="text-xs sm:text-sm font-mono tracking-wider text-[var(--text-dim)] uppercase font-medium"
              >
                Your best day
              </motion.div>

              {/* Headline: Built from existing weekday text */}
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.18, ease: 'easeOut' }}
                className="text-3xl sm:text-4xl md:text-5xl font-hud font-bold text-[var(--text)] tracking-tight"
              >
                {bestWeekday ? `${bestWeekday}s were your strongest` : 'Consistent momentum every week'}
              </motion.h2>

              {/* 7-Bar Chart (bars 40 to 56px wide on desktop) */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.27, ease: 'easeOut' }}
                className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 sm:p-8 flex items-end justify-between gap-2.5 sm:gap-4 h-56 shadow-card"
              >
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                  const isPowerDay = bestWeekday?.toLowerCase().startsWith(day.toLowerCase().slice(0, 3));
                  const barHeight = isPowerDay ? 92 : 32 + ((day.charCodeAt(0) * 9) % 36);

                  return (
                    <div key={day} className="flex-1 max-w-[56px] flex flex-col items-center gap-2 h-full justify-end">
                      {/* Value above best bar */}
                      {isPowerDay && (
                        <span className="text-xs font-mono font-bold text-[var(--accent)] tracking-wider">
                          Peak
                        </span>
                      )}

                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${barHeight}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className="w-full rounded-t-lg transition-all"
                        style={{
                          backgroundColor: isPowerDay
                            ? 'var(--accent, #ffffff)'
                            : 'rgba(var(--fg, 255 255 255), 0.14)',
                          boxShadow: isPowerDay ? '0 0 16px var(--glow, rgba(255,255,255,0.35))' : 'none',
                        }}
                      />
                      <span
                        className={`text-xs font-mono uppercase tracking-wider font-semibold ${
                          isPowerDay ? 'text-[var(--text)]' : 'text-[var(--text-faint)]'
                        }`}
                      >
                        {day.charAt(0)}
                      </span>
                    </div>
                  );
                })}
              </motion.div>

              {/* Peak time as one small line */}
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.36, ease: 'easeOut' }}
                className="text-base text-[var(--text-dim)] font-sans"
              >
                Peak momentum around {peakHour !== null && peakHour !== undefined ? `${peakHour}:00` : '14:00'} UTC.
              </motion.p>
            </motion.div>
          )}

          {/* ────────────────────────────────────────────────────────── */}
          {/* SLIDE 4: CONSISTENCY                                       */}
          {/* ────────────────────────────────────────────────────────── */}
          {activeSlideId === 'consistency' && (
            <motion.div
              key="consistency"
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -16 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="w-full max-w-3xl flex flex-col items-center justify-center text-center space-y-6 sm:space-y-8"
            >
              {/* Header */}
              <div className="space-y-1.5 max-w-xl mx-auto">
                <div className="text-xs sm:text-sm font-mono tracking-wider text-[var(--text-dim)] uppercase font-medium">
                  How you showed up
                </div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-hud font-bold text-[var(--text)] tracking-tight">
                  {consistencyHeadline}
                </h2>
              </div>

              {/* Calendar on left (desktop) & Stats on right */}
              <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-14 w-full">
                {/* Calendar Grid */}
                <div className="relative flex flex-col items-center shrink-0">
                  {/* Weekday letters row */}
                  <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-2 text-center w-full">
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((letter, i) => (
                      <div
                        key={i}
                        className="w-[30px] sm:w-10 md:w-12 text-xs font-mono font-bold text-[var(--text-faint)] uppercase"
                      >
                        {letter}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Days Matrix (cells 40-48px desktop, 30px mobile) */}
                  <div className="grid grid-cols-7 gap-1.5 sm:gap-2 w-full">
                    {Array.from({ length: calendarData.firstDayWeekday }).map((_, i) => (
                      <div key={`blank-${i}`} className="w-[30px] h-[30px] sm:w-10 sm:h-10 md:w-12 md:h-12" />
                    ))}

                    {calendarData.cells.map((cell) => {
                      const cellStartTime = 300 + cell.activeOrderIndex * activeInterval;
                      const isLit = cell.isActive && cElapsed >= cellStartTime;

                      const streakStartTime = 1200 + cell.streakOrderIndex * streakInterval;
                      const isStreakLit = cell.isStreak && cElapsed >= streakStartTime;

                      const nextCell = calendarData.cells[cell.dayNum];
                      const isNextStreakLit =
                        nextCell &&
                        nextCell.isStreak &&
                        cElapsed >= (1200 + nextCell.streakOrderIndex * streakInterval) &&
                        cell.colIndex < 6;

                      return (
                        <div
                          key={cell.dateStr}
                          className={`relative w-[30px] h-[30px] sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center text-xs font-mono select-none transition-transform duration-150 ${
                            isStreakLit || isLit
                              ? 'scale-105 font-bold shadow-sm'
                              : 'font-normal'
                          }`}
                          style={{
                            backgroundColor: isStreakLit || isLit
                              ? 'var(--accent, #ffffff)'
                              : 'rgba(var(--fg, 255 255 255), 0.06)',
                            color: isStreakLit || isLit
                              ? 'var(--accent-contrast, #08090C)'
                              : 'var(--text-faint, #64748B)',
                            border: isStreakLit || isLit
                              ? '1px solid var(--accent, #ffffff)'
                              : '1px solid rgba(var(--fg, 255 255 255), 0.06)',
                          }}
                        >
                          <span>{cell.dayNum}</span>

                          {/* Thin accent line connecting consecutive streak days */}
                          {isStreakLit && isNextStreakLit && (
                            <div
                              className="absolute top-1/2 -translate-y-1/2 right-[-6px] sm:right-[-8px] w-[6px] sm:w-[8px] h-1.5 pointer-events-none z-10"
                              style={{ backgroundColor: 'var(--accent, #ffffff)' }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Stats to the right on desktop, below on mobile (HIDE any stat that is 0) */}
                <div className="flex flex-col justify-center space-y-6 text-left shrink-0">
                  {/* Stat 1: Days you showed up */}
                  {activeDays > 0 && (
                    <div className="flex flex-col">
                      <div className="text-4xl sm:text-5xl font-black font-hud text-[var(--text)] tracking-tight leading-none">
                        {displayedActiveDays}
                      </div>
                      <div className="text-sm sm:text-base text-[var(--text-dim)] font-sans mt-1">
                        days you showed up
                      </div>
                    </div>
                  )}

                  {/* Stat 2: Days in a row at your best */}
                  {(longestStreak > 0 || calendarData.totalStreak > 0) && (
                    <div className="flex flex-col">
                      <div className="text-4xl sm:text-5xl font-black font-hud text-[var(--text)] tracking-tight leading-none">
                        {displayedStreak}
                      </div>
                      <div className="text-sm sm:text-base text-[var(--text-dim)] font-sans mt-1">
                        days in a row at your best
                      </div>
                    </div>
                  )}

                  {/* Stat 3: Tasks checked off (HIDDEN if zero) */}
                  {completedTasks > 0 && (
                    <div className="flex flex-col">
                      <div className="text-4xl sm:text-5xl font-black font-hud text-[var(--text)] tracking-tight leading-none">
                        {displayedTasks}
                      </div>
                      <div className="text-sm sm:text-base text-[var(--text-dim)] font-sans mt-1">
                        tasks checked off
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Supporting observation */}
              <p className="text-sm text-[var(--text-dim)] font-sans max-w-md mx-auto text-center pt-2">
                Consistency builds rank over time.
              </p>
            </motion.div>
          )}

          {/* ────────────────────────────────────────────────────────── */}
          {/* SLIDE 5: RANK SLIDE (THE CLIMAX)                           */}
          {/* ────────────────────────────────────────────────────────── */}
          {activeSlideId === 'rank' && (
            <motion.div
              key="rank"
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -16 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="w-full max-w-3xl flex flex-col items-center justify-center text-center space-y-6"
            >
              {/* Header */}
              <div className="text-xs sm:text-sm font-mono tracking-wider text-[var(--text-dim)] uppercase font-medium">
                Season reset
              </div>

              {/* Two columns on desktop, stacked on mobile with connector */}
              <div className="w-full flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10 py-3">
                {/* 1. LEFT CREST: "Where you ended" */}
                <div className="flex flex-col items-center w-56 sm:w-64">
                  <div className="text-xs font-mono font-medium tracking-wider text-[var(--text-dim)] uppercase mb-3">
                    Where you ended
                  </div>

                  {/* Left crest: 60% opacity with NO glow */}
                  <div className="relative w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center opacity-60">
                    <RankCrestBadge
                      tier={prevParsed.tier}
                      division={prevParsed.division}
                      size={isMobile ? 130 : 190}
                      priority={true}
                      className="relative z-10"
                    />
                  </div>

                  <div className="text-2xl sm:text-3xl font-black font-hud text-[var(--text)] uppercase tracking-wider mt-2">
                    {previousRank || 'Bronze I'}
                  </div>
                  <div className="text-sm font-mono text-[var(--text-dim)] mt-0.5">
                    {previousRP} RP
                  </div>
                </div>

                {/* 2. CONNECTOR: Thin line with small "Season reset" pill on it */}
                <div className="flex flex-col items-center justify-center w-36 sm:w-44 py-2">
                  <div className="px-2.5 py-0.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[11px] font-mono uppercase tracking-wider text-[var(--text-dim)] font-medium mb-2 shadow-sm">
                    Season reset
                  </div>

                  {/* Thin line drawing left to right */}
                  <div
                    className="w-full h-1 rounded-full overflow-hidden my-2"
                    style={{ backgroundColor: 'rgba(var(--fg, 255 255 255), 0.12)' }}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: rankPhase === 'initial' || rankPhase === 'ended' ? '0%' : '100%',
                      }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: 'var(--accent, #ffffff)' }}
                    />
                  </div>

                  {/* RP number tick down */}
                  <div className="text-sm font-mono font-bold text-[var(--text-dim)] tabular-nums">
                    {rpDisplay} RP
                  </div>
                </div>

                {/* 3. RIGHT CREST: "Where you start" */}
                <div className="flex flex-col items-center w-56 sm:w-64">
                  <div className="text-xs font-mono font-medium tracking-wider text-[var(--text-dim)] uppercase mb-3">
                    Where you start
                  </div>

                  {/* Right crest: full brightness with soft glow in --tier-accent (static, zero animation) */}
                  <div className="relative w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center">
                    <div className="relative z-10 flex items-center justify-center">
                      {/* Soft glow in --tier-accent */}
                      <div
                        className="absolute inset-0 blur-[50px] rounded-full pointer-events-none"
                        style={{
                          backgroundColor: getTierAccent(currParsed.tier),
                          opacity: 0.35,
                        }}
                      />
                      <RankCrestBadge
                        tier={currParsed.tier}
                        division={currParsed.division}
                        size={isMobile ? 130 : 190}
                        priority={true}
                        className="relative z-10"
                      />
                    </div>
                  </div>

                  <div className="text-2xl sm:text-3xl font-black font-hud text-[var(--text)] uppercase tracking-wider mt-2">
                    {currentRank || 'Bronze I'}
                  </div>
                  <div className="text-sm font-mono text-[var(--text-dim)] mt-0.5">
                    {startingRP} RP
                  </div>
                </div>
              </div>

              {/* Status pill: "Promoted" or "New season, new climb." (Calm and static) */}
              <div className="min-h-[44px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-1">
                  {isPromoted ? (
                    <span
                      className="text-xs font-mono uppercase px-3.5 py-1 rounded-full font-bold shadow-sm"
                      style={{
                        backgroundColor: 'rgba(var(--fg, 255 255 255), 0.12)',
                        color: 'var(--accent, #ffffff)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      Promoted
                    </span>
                  ) : (
                    <span className="text-sm font-sans text-[var(--text-dim)]">
                      New season, new climb.
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ────────────────────────────────────────────────────────── */}
          {/* SLIDE 6: SHARE SLIDE                                       */}
          {/* ────────────────────────────────────────────────────────── */}
          {activeSlideId === 'cta' && (
            <motion.div
              key="cta"
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -16 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="w-full max-w-xl flex flex-col items-center justify-center text-center space-y-3.5 my-auto py-2"
            >
              {/* Heading & Supporting Line */}
              <div className="space-y-1">
                <h2 className="text-3xl sm:text-4xl font-hud font-bold text-[var(--text)] tracking-tight">
                  Share your season
                </h2>
                <p className="text-sm text-[var(--text-dim)] font-sans">
                  Save a card to post or send.
                </p>
              </div>

              {/* 1080x1920 Season Share Card Preview & Controls */}
              <SeasonShareCard
                seasonKey={seasonKey}
                seasonDisplayName={seasonDisplayName}
                totalSeconds={totalSeconds}
                activeDays={activeDays}
                topSubject={topSubject}
                previousRank={previousRank}
                currentRank={currentRank}
                username={username}
                isFirstSeason={isFirstSeason}
              />

              {/* Return link */}
              <div className="w-full flex items-center justify-center pt-2">
                {onClose ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onClose();
                    }}
                    className="text-xs font-mono text-[var(--text-dim)] hover:text-[var(--text)] transition-colors cursor-pointer"
                  >
                    ← Return to dev preview
                  </button>
                ) : (
                  <Link
                    href="/?tab=leaderboard"
                    onClick={(e) => {
                      e.stopPropagation();
                      try {
                        const now = new Date();
                        const currentMonth = now.toISOString().substring(0, 7);
                        localStorage.setItem(`has_seen_recap_${seasonKey}`, 'true');
                        localStorage.setItem(`has_seen_recap_${currentMonth}`, 'true');
                        localStorage.setItem('has_seen_recap_current', 'true');
                        localStorage.setItem('studypulse_recap_viewed', 'true');
                      } catch {}
                    }}
                    className="text-xs font-mono text-[var(--text-dim)] hover:text-[var(--text)] transition-colors cursor-pointer"
                  >
                    ← Back to leaderboard
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* 4. BOTTOM CONTROLS & FIRST-SLIDE HINT                      */}
      {/* ══════════════════════════════════════════════════════════ */}
      <footer
        className={`relative z-30 w-full max-w-[820px] mx-auto px-5 sm:px-8 flex items-center justify-between transition-all ${
          isDevPreview ? 'pb-24 sm:pb-28' : 'pb-8'
        }`}
      >
        {/* Previous Button (44px circular icon button, hidden on first slide) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handlePrev();
          }}
          disabled={currentSlide === 0}
          className={`w-11 h-11 rounded-full bg-[var(--surface)] hover:bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
            currentSlide === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
          title="Previous slide"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Temporary hint shown only on first slide for 4 seconds */}
        <div className="flex-1 text-center px-4">
          <AnimatePresence>
            {currentSlide === 0 && showFirstSlideHint && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="text-xs font-mono text-[var(--text-dim)]"
              >
                Tap or press → to continue. Hold to pause.
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Next Button (44px circular icon button, hidden on last slide) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          disabled={currentSlide === totalSlides - 1}
          className={`w-11 h-11 rounded-full bg-[var(--surface)] hover:bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
            currentSlide === totalSlides - 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
          title="Next slide"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </footer>
    </div>
  );
}
