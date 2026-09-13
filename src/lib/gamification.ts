/**
 * StudyPulse - Gamification & Level Progression Engine
 * 
 * XP Rules:
 * - Focus Time: 1 minute of focus = 10 XP (0.167 XP per second)
 * - Todo Item: +25 XP per completed task
 * - Daily Streak: +50 XP bonus per streak day
 * 
 * Level Formula:
 * - Level = Math.floor(Math.sqrt(total_xp / 100)) + 1
 * - Level 1: 0 XP
 * - Level 2: 100 XP
 * - Level 3: 400 XP
 * - Level 4: 900 XP
 * - Level 5: 1,600 XP ...
 * 
 * Tier Badges:
 * - Level 1–3: "Novice Scholar"
 * - Level 4–7: "Deep Worker"
 * - Level 8–12: "Focus Master"
 * - Level 13+: "Grandmaster"
 */

export const GAMIFICATION_CONFIG = {
  XP_PER_MINUTE: 10,
  XP_PER_SECOND: 10 / 60,
  XP_PER_TODO: 25,
  XP_PER_STREAK_DAY: 50,
} as const;

export type TierBadge = {
  tier: 'novice' | 'worker' | 'master' | 'grandmaster';
  title: string;
  icon: string;
  badgeClass: string;
  glowClass: string;
  textColor: string;
  borderColor: string;
  bgGradient: string;
};

export interface LevelProgress {
  level: number;
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
  progressPercent: number; // 0 to 100
}

/**
 * Calculate XP earned from focus time
 */
export function calculateFocusXP(durationSeconds: number): number {
  if (!durationSeconds || durationSeconds <= 0) return 0;
  return Math.round(durationSeconds * GAMIFICATION_CONFIG.XP_PER_SECOND);
}

/**
 * Calculate XP earned from completed todos
 */
export function calculateTodoXP(completedCount: number): number {
  if (!completedCount || completedCount <= 0) return 0;
  return completedCount * GAMIFICATION_CONFIG.XP_PER_TODO;
}

/**
 * Calculate XP earned from maintaining a daily streak
 */
export function calculateStreakXP(streakDays: number): number {
  if (!streakDays || streakDays <= 0) return 0;
  return streakDays * GAMIFICATION_CONFIG.XP_PER_STREAK_DAY;
}

/**
 * Calculate total XP derived from all activities
 */
export function calculateTotalXP(
  totalDurationSeconds: number,
  completedTodosCount: number,
  streakDays: number
): number {
  const focus = calculateFocusXP(totalDurationSeconds);
  const todo = calculateTodoXP(completedTodosCount);
  const streak = calculateStreakXP(streakDays);
  return focus + todo + streak;
}

/**
 * Calculate Level from Total XP
 * Formula: Level = Math.floor(Math.sqrt(total_xp / 100)) + 1
 */
export function calculateLevel(totalXP: number): number {
  const safeXP = Math.max(0, totalXP || 0);
  return Math.max(1, Math.floor(Math.sqrt(safeXP / 100)) + 1);
}

/**
 * Get min XP required to reach a specific level
 */
export function getXPForLevel(level: number): number {
  const safeLevel = Math.max(1, level);
  return Math.pow(safeLevel - 1, 2) * 100;
}

/**
 * Get Tier title for a given level
 */
export function getLevelTitle(level: number): string {
  if (level <= 3) return 'Novice Scholar';
  if (level <= 7) return 'Deep Worker';
  if (level <= 12) return 'Focus Master';
  return 'Grandmaster';
}

/**
 * Get badge styling and metadata for a given level
 */
export function getTierBadge(level: number): TierBadge {
  if (level <= 3) {
    return {
      tier: 'novice',
      title: 'Novice Scholar',
      icon: '🌱',
      badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      glowClass: 'shadow-emerald-500/20',
      textColor: 'text-emerald-400',
      borderColor: 'border-emerald-500/40',
      bgGradient: 'from-emerald-500 to-teal-500',
    };
  }
  if (level <= 7) {
    return {
      tier: 'worker',
      title: 'Deep Worker',
      icon: '⚡',
      badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
      glowClass: 'shadow-cyan-500/20',
      textColor: 'text-cyan-400',
      borderColor: 'border-cyan-500/40',
      bgGradient: 'from-cyan-500 to-blue-500',
    };
  }
  if (level <= 12) {
    return {
      tier: 'master',
      title: 'Focus Master',
      icon: '🔮',
      badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
      glowClass: 'shadow-purple-500/20',
      textColor: 'text-purple-400',
      borderColor: 'border-purple-500/40',
      bgGradient: 'from-purple-500 to-indigo-500',
    };
  }
  return {
    tier: 'grandmaster',
    title: 'Grandmaster',
    icon: '🏆',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    glowClass: 'shadow-amber-500/25',
    textColor: 'text-amber-400',
    borderColor: 'border-amber-500/40',
    bgGradient: 'from-amber-400 to-orange-500',
  };
}

/**
 * Calculate comprehensive level progression data
 */
export function getLevelProgress(
  totalSeconds: number,
  completedTodosCount: number,
  streakDays: number
): LevelProgress {
  const focusXP = calculateFocusXP(totalSeconds);
  const todoXP = calculateTodoXP(completedTodosCount);
  const streakXP = calculateStreakXP(streakDays);
  const totalXP = focusXP + todoXP + streakXP;

  const level = calculateLevel(totalXP);
  const title = getLevelTitle(level);
  const tierBadge = getTierBadge(level);

  const currentLevelBaseXP = getXPForLevel(level);
  const nextLevelXP = getXPForLevel(level + 1);
  const xpNeededForNextLevel = Math.max(1, nextLevelXP - currentLevelBaseXP);
  const xpInCurrentLevel = Math.max(0, totalXP - currentLevelBaseXP);
  const xpRemaining = Math.max(0, nextLevelXP - totalXP);

  const progressPercent = Math.min(100, Math.max(0, (xpInCurrentLevel / xpNeededForNextLevel) * 100));

  return {
    level,
    title,
    tierBadge,
    totalXP,
    focusXP,
    todoXP,
    streakXP,
    currentLevelBaseXP,
    nextLevelXP,
    xpInCurrentLevel,
    xpNeededForNextLevel,
    xpRemaining,
    progressPercent,
  };
}
