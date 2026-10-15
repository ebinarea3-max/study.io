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

/**
 * Custom SVG Flame mark for streak climax
 */
function CustomFlameMark({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M12 2C10.5 4.5 9 7.5 9 10.5C9 10.8 9.02 11.1 9.06 11.4C8.2 10.3 7.8 8.9 7.9 7.5C5.5 9.5 4 12.5 4 15.5C4 19.64 7.58 23 12 23C16.42 23 20 19.64 20 15.5C20 10.8 15.5 6 12 2Z"
        className="fill-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.9)]"
      />
      <path
        d="M12 20.5C9.79 20.5 8 18.71 8 16.5C8 14.8 9 13 10.5 12C10.8 13.5 11.8 14.8 13.2 15.2C13.8 13.8 14.5 12.5 15.8 11.8C15.9 12.5 16 13.2 16 14C16 17.59 14.21 20.5 12 20.5Z"
        className="fill-amber-100"
        opacity="0.9"
      />
    </svg>
  );
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

  // ══════════════════════════════════════════════════════════
  // SLIDE 3: CONSISTENCY CALENDAR & CHOREOGRAPHY STATE
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

    // Graceful synthetic fallback if activeDates was not provided
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
      isStreakEnd: boolean;
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
      const isStreakEnd = Boolean(resolvedStreakEnd && dateStr === resolvedStreakEnd);
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
        isStreakEnd,
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

  // Derived choreography timeline values
  const cElapsed = prefersReducedMotion ? 5000 : consistencyElapsedMs;

  // 0.0s to 0.5s: Eyebrow and headline slide up 12px, blur 6px to 0, staggered 100ms
  const eyebrowP = Math.min(1, Math.max(0, cElapsed / 400));
  const headlineP = Math.min(1, Math.max(0, (cElapsed - 100) / 400));

  // 0.5s to 0.8s: Weekdays and dim cells fade in
  const gridAppearP = Math.min(1, Math.max(0, (cElapsed - 500) / 300));

  // 0.8s to ~2.0s: Active cells light up in date order (~30ms apart)
  const activeInterval = calendarData.totalActive > 0 ? Math.min(40, Math.max(22, 1100 / calendarData.totalActive)) : 30;
  let litActiveCount = 0;
  for (const cell of calendarData.cells) {
    if (cell.isActive) {
      const startTime = 800 + cell.activeOrderIndex * activeInterval;
      if (cElapsed >= startTime) {
        litActiveCount++;
      }
    }
  }

  // 2.0s to 2.8s: Streak highlight sweep along cells (~20ms apart)
  const streakInterval = calendarData.totalStreak > 0 ? Math.min(28, Math.max(15, 750 / calendarData.totalStreak)) : 20;
  let litStreakCount = 0;
  for (const cell of calendarData.cells) {
    if (cell.isStreak) {
      const startTime = 2000 + cell.streakOrderIndex * streakInterval;
      if (cElapsed >= startTime) {
        litStreakCount++;
      }
    }
  }

  // Flame mark pop-in on the last streak day
  const flameStartTime = 2000 + Math.max(0, calendarData.totalStreak - 1) * streakInterval + 60;
  const flamePopP = calendarData.totalStreak > 0 ? Math.min(1, Math.max(0, (cElapsed - flameStartTime) / 220)) : 0;

  // 2.8s to 3.7s: Tasks number count-up with ease-out
  let tasksCountDisplay = 0;
  if (cElapsed >= 3700) {
    tasksCountDisplay = completedTasks;
  } else if (cElapsed > 2800) {
    const p = (cElapsed - 2800) / 900;
    const easeOut = 1 - Math.pow(1 - p, 3);
    tasksCountDisplay = Math.round(easeOut * completedTasks);
  }

  // 3.7s: Bottom line observation fades in
  const bottomLineOpacity = Math.min(1, Math.max(0, (cElapsed - 3700) / 350));

  // 4s ambient breathing glow behind calendar after settled (3.8s onwards)
  const ambientGlowPulse = cElapsed >= 3800
    ? 0.22 + Math.sin(((cElapsed - 3800) / 4000) * Math.PI * 2) * 0.08
    : 0.15;

  // Copy calculations based on real numbers
  const consistencyHeadline = useMemo(() => {
    const ratio = calendarData.daysInMonth > 0 ? activeDays / calendarData.daysInMonth : 0;
    if (ratio >= 0.8) return 'You barely missed a day.';
    if (ratio >= 0.5) return 'More days on than off.';
    return 'Every day you showed up counted.';
  }, [activeDays, calendarData.daysInMonth]);

  const consistencyObservation = useMemo(() => {
    if (completedTasks > 0 && activeDays > 0) {
      const perDay = (completedTasks / activeDays).toFixed(1).replace(/\.0$/, '');
      return `That's about ${perDay} ${perDay === '1' ? 'task' : 'tasks'} on every day you studied.`;
    }
    if (activeDays > 0) {
      const hrsPerDay = ((totalSeconds / 3600) / activeDays).toFixed(1).replace(/\.0$/, '');
      return `You dedicated an average of ${hrsPerDay} hours each time you showed up.`;
    }
    return 'Every study session added up to your season total.';
  }, [completedTasks, activeDays, totalSeconds]);

  const displayedActiveDays = prefersReducedMotion ? activeDays : litActiveCount;
  const displayedStreak = prefersReducedMotion ? (longestStreak || calendarData.totalStreak) : litStreakCount;
  const displayedTasks = prefersReducedMotion ? completedTasks : tasksCountDisplay;

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
                // TOTAL TIME IN FOCUS
              </motion.div>

              <h2 className="text-xl sm:text-3xl font-hud font-bold text-slate-300 tracking-wider">
                {totalHoursNum >= 50
                  ? 'You put in serious time this season.'
                  : totalHoursNum >= 15
                  ? 'You showed real dedication this season.'
                  : 'Every focused minute counted.'}
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

              <p className="text-xs sm:text-sm text-zinc-400 font-sans max-w-md">
                In {seasonDisplayName}, you dedicated {totalHoursNum} hours to sharpening your knowledge.
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
                // DOMINANT SUBJECT
              </div>

              <h2 className="text-xl sm:text-2xl font-hud font-bold text-slate-300 tracking-wide">
                {topSubject || 'General Study'} took the lion's share of your focus.
              </h2>

              <div className="text-4xl sm:text-6xl font-black font-hud text-white tracking-wide drop-shadow-md">
                {topSubject || 'General Study'}
              </div>

              <div className="text-sm font-sans font-medium text-amber-400">
                You spent {(topSubjectSeconds / 3600).toFixed(1)} hours on {topSubject || 'your top subject'}
                {totalSeconds > 0 ? ` — that's ${Math.round((topSubjectSeconds / totalSeconds) * 100)}% of your study time.` : '.'}
              </div>

              {/* Subject Breakdown Mini Bar Chart */}
              {subjectBreakdown.length > 0 && (
                <div className="w-full bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl p-5 space-y-3 mt-4 text-left">
                  <div className="text-[11px] font-sans uppercase tracking-wider text-zinc-500 font-semibold mb-2">
                    Subject breakdown
                  </div>
                  {subjectBreakdown.slice(0, 4).map((sub, i) => {
                    const ratio = topSubjectSeconds > 0 ? (sub.seconds / topSubjectSeconds) * 100 : 0;
                    const hours = (sub.seconds / 3600).toFixed(1);

                    return (
                      <div key={sub.name} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-sans text-zinc-300">
                          <span className="truncate max-w-[200px] font-semibold">{sub.name}</span>
                          <span className="text-zinc-400 font-mono">{hours}h</span>
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

              <h2 className="text-2xl sm:text-3xl font-hud font-black text-amber-400 tracking-wide">
                {bestWeekday} was when you were most in the zone.
              </h2>

              <p className="text-xs sm:text-sm text-zinc-400 font-sans">
                Most of your deep work happened on {bestWeekday}s, hitting peak momentum around{' '}
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

          {/* SLIDE 3: REDESIGNED CONSISTENCY CALENDAR & CHOREOGRAPHY */}
          {activeSlideId === 'consistency' && (
            <motion.div
              key="consistency"
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -20 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="w-full max-w-3xl flex flex-col items-center justify-center text-center space-y-6 sm:space-y-8"
            >
              {/* Header: Human Headline & Eyebrow with staggered slide/blur */}
              <div className="space-y-2 max-w-xl mx-auto">
                <div
                  className="text-xs font-mono tracking-widest uppercase text-amber-400 font-bold transition-all duration-300"
                  style={{
                    opacity: eyebrowP,
                    transform: `translateY(${(1 - eyebrowP) * 12}px)`,
                    filter: `blur(${(1 - eyebrowP) * 6}px)`,
                  }}
                >
                  How you showed up
                </div>

                <h2
                  className="text-2xl sm:text-4xl font-hud font-black text-slate-100 tracking-wide transition-all duration-300"
                  style={{
                    opacity: headlineP,
                    transform: `translateY(${(1 - headlineP) * 12}px)`,
                    filter: `blur(${(1 - headlineP) * 6}px)`,
                  }}
                >
                  {consistencyHeadline}
                </h2>
              </div>

              {/* Main Content: Desktop Left/Right, Mobile Top/Bottom */}
              <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-14 w-full">
                {/* 1. LEFT (DESKTOP) / TOP (MOBILE): 7-Column Season Calendar Grid */}
                <div className="relative flex flex-col items-center shrink-0">
                  {/* Ambient breathing glow behind calendar */}
                  <div
                    className="absolute -inset-6 rounded-3xl pointer-events-none transition-opacity duration-500 blur-2xl"
                    style={{
                      backgroundColor: `rgba(245, 158, 11, ${ambientGlowPulse})`,
                    }}
                  />

                  {/* Weekday Letters Row */}
                  <div
                    className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-2 text-center w-full transition-opacity duration-300"
                    style={{ opacity: gridAppearP }}
                  >
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((letter, i) => (
                      <div
                        key={i}
                        className="w-8 sm:w-9 text-[10px] sm:text-[11px] font-mono font-bold tracking-wider text-zinc-500 uppercase"
                      >
                        {letter}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Days Matrix */}
                  <div
                    className="grid grid-cols-7 gap-1.5 sm:gap-2 w-full transition-opacity duration-300"
                    style={{ opacity: gridAppearP }}
                  >
                    {/* Leading blanks for month offset */}
                    {Array.from({ length: calendarData.firstDayWeekday }).map((_, i) => (
                      <div key={`blank-${i}`} className="w-8 h-8 sm:w-9 sm:h-9" />
                    ))}

                    {/* Day Cells */}
                    {calendarData.cells.map((cell) => {
                      const cellStartTime = 800 + cell.activeOrderIndex * activeInterval;
                      const isLit = cell.isActive && cElapsed >= cellStartTime;
                      const flashAge = cell.isActive ? cElapsed - cellStartTime : -1;
                      const isFlashing = isLit && flashAge >= 0 && flashAge < 160;

                      const streakStartTime = 2000 + cell.streakOrderIndex * streakInterval;
                      const isStreakLit = cell.isStreak && cElapsed >= streakStartTime;

                      // Check if next day in row is also streak-lit (for horizontal ribbon connector)
                      const nextCell = calendarData.cells[cell.dayNum]; // next day is at index dayNum
                      const isNextStreakLit =
                        nextCell &&
                        nextCell.isStreak &&
                        cElapsed >= (2000 + nextCell.streakOrderIndex * streakInterval) &&
                        cell.colIndex < 6;

                      return (
                        <div
                          key={cell.dateStr}
                          className={`relative w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-[10px] sm:text-[11px] font-mono select-none transition-transform duration-150 ${
                            !cell.isActive
                              ? 'bg-white/[0.03] border border-white/[0.06] text-zinc-600'
                              : isFlashing
                              ? 'bg-amber-300 text-black font-black border-white shadow-[0_0_20px_rgba(251,191,36,0.9)] scale-110 z-10'
                              : isStreakLit
                              ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-black font-black border border-amber-300 shadow-[0_0_14px_rgba(245,158,11,0.65)]'
                              : isLit
                              ? 'bg-amber-500/25 border border-amber-400/50 text-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.35)]'
                              : 'bg-white/[0.03] border border-white/[0.06] text-zinc-600'
                          }`}
                        >
                          <span>{cell.dayNum}</span>

                          {/* Connected run: horizontal connector to next day in same week */}
                          {isStreakLit && isNextStreakLit && (
                            <div className="absolute top-1/2 -translate-y-1/2 right-[-6px] sm:right-[-8px] w-[6px] sm:w-[8px] h-1.5 sm:h-2 bg-gradient-to-r from-amber-400 to-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)] z-10 pointer-events-none" />
                          )}

                          {/* Flame mark on the last day of the run */}
                          {cell.isStreakEnd && flamePopP > 0 && (
                            <div
                              className="absolute -top-2.5 -right-2.5 sm:-top-3 sm:-right-3 z-20 pointer-events-none"
                              style={{
                                transform: `scale(${flamePopP})`,
                                transition: prefersReducedMotion ? 'none' : 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                              }}
                            >
                              <CustomFlameMark className="w-5 h-5 sm:w-6 sm:h-6" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. RIGHT (DESKTOP) / BOTTOM (MOBILE): Three Plain Stat Lines (No Boxes, No Icons) */}
                <div className="flex flex-col justify-center space-y-5 sm:space-y-7 text-left shrink-0">
                  {/* Stat 1: Days you showed up */}
                  <div className="flex flex-col sm:space-y-0.5">
                    <div className="text-4xl sm:text-5xl md:text-6xl font-black font-hud text-white tracking-tight leading-none">
                      {displayedActiveDays}
                    </div>
                    <div className="text-sm sm:text-base text-zinc-300 font-sans normal-case">
                      days you showed up
                    </div>
                  </div>

                  {/* Stat 2: Days in a row at your best */}
                  <div className="flex flex-col sm:space-y-0.5">
                    <div className="text-4xl sm:text-5xl md:text-6xl font-black font-hud text-amber-400 tracking-tight leading-none">
                      {displayedStreak}
                    </div>
                    <div className="text-sm sm:text-base text-zinc-300 font-sans normal-case">
                      days in a row at your best
                    </div>
                  </div>

                  {/* Stat 3: Tasks checked off */}
                  <div className="flex flex-col sm:space-y-0.5">
                    <div className="text-4xl sm:text-5xl md:text-6xl font-black font-hud text-emerald-400 tracking-tight leading-none">
                      {displayedTasks}
                    </div>
                    <div className="text-sm sm:text-base text-zinc-300 font-sans normal-case">
                      tasks checked off
                    </div>
                  </div>
                </div>
              </div>

              {/* Data-driven honest bottom line observation */}
              <div
                className="text-xs sm:text-sm text-zinc-400 font-sans max-w-md mx-auto text-center pt-2 transition-opacity duration-300"
                style={{ opacity: bottomLineOpacity }}
              >
                {consistencyObservation}
              </div>
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
      <footer className={`relative z-30 w-full max-w-4xl mx-auto px-4 flex items-center justify-between text-xs font-mono text-zinc-500 transition-all ${
        isDevPreview ? 'pb-24 sm:pb-28' : 'pb-8'
      }`}>
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
