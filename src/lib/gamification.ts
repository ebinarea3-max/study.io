/**
 * StudyPulse - 7-Year Exponential, Uncapped Lifetime Level & XP Progression Engine
 * 
 * XP Rules:
 * - Focus Time: Purely tied to focus time. Award 10 XP per full minute of recorded focus time:
 *   Math.floor(duration_seconds / 60) * 10
 * - Duration gate: If session duration is under 60 seconds (< 1 min), earned focus XP is strictly 0.
 * - Tasks: Completing/checking off tasks awards 0 XP.
 * - Daily consistency streak bonus: +100 XP on user's first valid session (>= 60s) of the day.
 * - Lifetime XP: Uncapped, permanently accumulated in database/profile state. Never resets across seasons.
 * 
 * Level Formula:
 * - Calibrated so Level 100 requires ~3.9M XP (~6,500 hours / ~7 years of daily study)
 * - Cumulative XP for Level L: Math.floor(60 * Math.pow(level - 1, 2.4))
 * - Level from Cumulative XP: Math.floor(Math.pow(lifetimeXP / 60, 1 / 2.4)) + 1
 */

import React from 'react';
import { Sprout, Zap, Hexagon, Sparkles, BookOpen, Shield, Star, Trophy } from 'lucide-react';

export const GAMIFICATION_CONFIG = {
  XP_PER_MINUTE: 10,
  DAILY_STREAK_BONUS_XP: 100,
  MIN_SESSION_SECONDS_FOR_XP: 60,
} as const;

export type TierBadge = {
  tier: 'novice' | 'worker' | 'master' | 'grandmaster';
  title: string;
  icon: React.ReactNode;
  badgeClass: string;
  glowClass: string;
  textColor: string;
  borderColor: string;
  bgGradient: string;
};

export interface LevelProgress {
  level: number;
  scholarTitle: string;
  currentProgressXP: number;
  xpNeededForNext: number;
  progressPercent: number; // 0 to 100
  displayText: string;

  // Compatible aliases for existing UI components (Navbar, LevelUpModal)
  title: string;
  tierBadge: TierBadge;
  totalXP: number;
  focusXP: number;
  todoXP: number;
  streakXP: number;
  currentLevelBaseXP: number;
  nextLevelXP: number;
  xpInCurrentLevel: number;
  xpNeededForNextLevel: number;
  xpRemaining: number;
}

/**
 * Cumulative XP required to reach Level L (L >= 1)
 * Calibrated so Level 100 requires ~3.9M XP (~6,500 hours / ~7 years of daily study)
 */
export function getCumulativeXPForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(60 * Math.pow(level - 1, 2.4));
}

/**
 * Exact level calculation from cumulative lifetime XP (Infinite / Uncapped)
 */
export function getLevelFromLifetimeXP(lifetimeXP: number): number {
  if (!lifetimeXP || lifetimeXP <= 0) return 1;
  const calculatedLevel = Math.floor(Math.pow(lifetimeXP / 60, 1 / 2.4)) + 1;
  return Math.max(1, calculatedLevel);
}

/**
 * Uncapped prestige scholar titles
 */
export function getScholarTitle(level: number): string {
  if (level >= 200) return "Transcendent Myth";
  if (level >= 150) return "Cosmic Sage";
  if (level >= 100) return "Eternal Archon";
  if (level >= 75) return "Grand Philosopher";
  if (level >= 50) return "Master Polymath";
  if (level >= 25) return "Adept Inquirer";
  if (level >= 10) return "Apprentice Mind";
  return "Novice Scholar";
}

/**
 * Dynamic XP progress for the circular SVG ring and counters
 */
export function getLevelProgress(
  lifetimeXPOrTotalSeconds: number,
  _completedTodosCount?: number,
  _streakDays?: number
): LevelProgress {
  const safeXP = Math.max(0, lifetimeXPOrTotalSeconds || 0);
  const currentLevel = getLevelFromLifetimeXP(safeXP);
  const currentLevelBaseXP = getCumulativeXPForLevel(currentLevel);
  const nextLevelBaseXP = getCumulativeXPForLevel(currentLevel + 1);

  const bracketSpan = nextLevelBaseXP - currentLevelBaseXP;
  const currentProgressXP = safeXP - currentLevelBaseXP;

  const progressPercent = bracketSpan > 0
    ? Math.min(100, Math.max(0, (currentProgressXP / bracketSpan) * 100))
    : 0;

  const scholarTitle = getScholarTitle(currentLevel);
  const tierBadge = getTierBadge(currentLevel);

  return {
    level: currentLevel,
    scholarTitle,
    currentProgressXP,
    xpNeededForNext: bracketSpan,
    progressPercent,
    displayText: `${currentProgressXP.toLocaleString()} / ${bracketSpan.toLocaleString()} XP`,

    // Compatible aliases for existing UI components
    title: scholarTitle,
    tierBadge,
    totalXP: safeXP,
    focusXP: safeXP,
    todoXP: 0,
    streakXP: 0,
    currentLevelBaseXP,
    nextLevelXP: nextLevelBaseXP,
    xpInCurrentLevel: currentProgressXP,
    xpNeededForNextLevel: bracketSpan,
    xpRemaining: Math.max(0, bracketSpan - currentProgressXP),
  };
}

/**
 * Calculate XP earned from focus time
 * Anti-exploit rule: Under 60s (< 1 min) awards strictly 0 XP.
 * Rate: 10 XP per full minute of recorded focus time.
 */
export function calculateFocusXP(durationSeconds: number): number {
  if (!durationSeconds || durationSeconds < GAMIFICATION_CONFIG.MIN_SESSION_SECONDS_FOR_XP) {
    return 0;
  }
  return Math.floor(durationSeconds / 60) * GAMIFICATION_CONFIG.XP_PER_MINUTE;
}

/**
 * Calculate XP earned from completed todos (Rule: Tasks award 0 XP)
 */
export function calculateTodoXP(_completedCount?: number): number {
  return 0;
}

/**
 * Calculate Level from Total XP (Alias for getLevelFromLifetimeXP)
 */
export function calculateLevel(totalXP: number): number {
  return getLevelFromLifetimeXP(totalXP);
}

/**
 * Get min XP required to reach a specific level (Alias for getCumulativeXPForLevel)
 */
export function getXPForLevel(level: number): number {
  return getCumulativeXPForLevel(level);
}

/**
 * Get Tier title for a given level (Alias for getScholarTitle)
 */
export function getLevelTitle(level: number): string {
  return getScholarTitle(level);
}

/**
 * Get badge styling and metadata for prestige levels
 */
export function getTierBadge(level: number): TierBadge {
  const title = getScholarTitle(level);

  if (level < 10) {
    return {
      tier: 'novice',
      title,
      icon: React.createElement(Sprout, { className: "w-[1em] h-[1em]" }),
      badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      glowClass: 'shadow-emerald-500/20',
      textColor: 'text-emerald-400',
      borderColor: 'border-emerald-500/40',
      bgGradient: 'from-emerald-500 to-teal-500',
    };
  }

  if (level < 25) {
    return {
      tier: 'worker',
      title,
      icon: React.createElement(Zap, { className: "w-[1em] h-[1em]" }),
      badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
      glowClass: 'shadow-cyan-500/20',
      textColor: 'text-cyan-400',
      borderColor: 'border-cyan-500/40',
      bgGradient: 'from-cyan-500 to-blue-500',
    };
  }

  if (level < 50) {
    return {
      tier: 'worker',
      title,
      icon: React.createElement(Hexagon, { className: "w-[1em] h-[1em]" }),
      badgeClass: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
      glowClass: 'shadow-blue-500/20',
      textColor: 'text-blue-400',
      borderColor: 'border-blue-500/40',
      bgGradient: 'from-blue-500 to-indigo-500',
    };
  }

  if (level < 75) {
    return {
      tier: 'master',
      title,
      icon: React.createElement(Sparkles, { className: "w-[1em] h-[1em]" }),
      badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
      glowClass: 'shadow-purple-500/20',
      textColor: 'text-purple-400',
      borderColor: 'border-purple-500/40',
      bgGradient: 'from-purple-500 to-fuchsia-500',
    };
  }

  if (level < 100) {
    return {
      tier: 'master',
      title,
      icon: React.createElement(BookOpen, { className: "w-[1em] h-[1em]" }),
      badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      glowClass: 'shadow-amber-500/25',
      textColor: 'text-amber-400',
      borderColor: 'border-amber-500/40',
      bgGradient: 'from-amber-400 to-orange-500',
    };
  }

  if (level < 150) {
    return {
      tier: 'grandmaster',
      title,
      icon: React.createElement(Shield, { className: "w-[1em] h-[1em]" }),
      badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
      glowClass: 'shadow-rose-500/25',
      textColor: 'text-rose-400',
      borderColor: 'border-rose-500/40',
      bgGradient: 'from-rose-500 to-pink-500',
    };
  }

  if (level < 200) {
    return {
      tier: 'grandmaster',
      title,
      icon: React.createElement(Star, { className: "w-[1em] h-[1em]" }),
      badgeClass: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
      glowClass: 'shadow-violet-500/25',
      textColor: 'text-violet-400',
      borderColor: 'border-violet-500/40',
      bgGradient: 'from-violet-500 to-cyan-500',
    };
  }

  return {
    tier: 'grandmaster',
    title,
    icon: React.createElement(Trophy, { className: "w-[1em] h-[1em]" }),
    badgeClass: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
    glowClass: 'shadow-yellow-500/30',
    textColor: 'text-yellow-400',
    borderColor: 'border-yellow-500/50',
    bgGradient: 'from-yellow-400 via-amber-300 to-orange-500',
  };
}
