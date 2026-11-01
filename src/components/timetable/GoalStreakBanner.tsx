'use client';

import React from 'react';
import { useTimetable } from '../../context/TimetableContext';
import { Flame, Trophy, CheckCircle2, Moon, Clock } from 'lucide-react';
import { useRankTheme } from '../../hooks/useRankTheme';

export function GoalStreakBanner() {
  const {
    streak,
    isTodayGoalCompleted,
    todayCompletionPercent,
    weekOverview,
    selectedDay,
    setSelectedDay,
  } = useTimetable();

  const { theme } = useRankTheme();

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--surface)] to-[var(--surface-2)] border border-[var(--border)] shadow-md py-3 px-3.5 sm:px-5 transition-all">
      {/* Decorative ambient background glow */}
      <div
        className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-2xl opacity-15 pointer-events-none transition-all duration-700"
        style={{
          background: isTodayGoalCompleted
            ? 'radial-gradient(circle, #F59E0B 0%, #10B981 70%)'
            : 'radial-gradient(circle, var(--accent) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        {/* Left: Flame Icon, Streak Count & Compact Status */}
        <div className="flex items-center gap-3">
          {/* Flame Icon Container */}
          <div
            className={`relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl border transition-all duration-500 shrink-0 ${
              isTodayGoalCompleted
                ? 'bg-amber-500/20 border-amber-400/50 shadow-[0_0_20px_rgba(245,158,11,0.35)]'
                : streak.currentStreak > 0
                ? 'bg-orange-500/15 border-orange-500/30 shadow-[0_0_12px_rgba(249,115,22,0.2)]'
                : 'bg-white/[0.04] border-white/10 opacity-70'
            }`}
          >
            <Flame
              className={`w-5 h-5 transition-all ${
                isTodayGoalCompleted
                  ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)] fill-amber-400'
                  : streak.currentStreak > 0
                  ? 'text-orange-400 drop-shadow-[0_0_6px_rgba(249,115,22,0.6)] fill-orange-400/60'
                  : 'text-neutral-500'
              }`}
            />
            {isTodayGoalCompleted && (
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border border-black items-center justify-center text-[8px] text-black font-black">
                  ✓
                </span>
              </span>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 leading-none">
                DAILY GOAL STREAK
              </span>
              {streak.longestStreak > 0 && (
                <div className="flex items-center gap-1 text-[10px] font-mono text-[var(--text-dim)]">
                  <Trophy className="w-2.5 h-2.5 text-amber-400/80" />
                  <span>Best: {streak.longestStreak}d</span>
                </div>
              )}
            </div>

            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-lg sm:text-xl font-hud font-black tracking-wider text-[var(--text)] leading-tight">
                {streak.currentStreak}{' '}
                <span className="text-xs sm:text-sm font-sans font-medium text-[var(--text-dim)]">
                  {streak.currentStreak === 1 ? 'DAY STREAK' : 'DAYS STREAK'}
                </span>
              </span>

              <span className="text-[11px] text-[var(--text-dim)] font-sans hidden md:inline truncate">
                {isTodayGoalCompleted ? (
                  <span className="text-emerald-400 font-semibold inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Goal secured today!
                  </span>
                ) : todayCompletionPercent > 0 ? (
                  <span className="text-amber-400/90 font-medium inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Today: {todayCompletionPercent}% completed
                  </span>
                ) : (
                  <span>· Complete today targets to maintain streak</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Right: 7-Day Compact Target Pills (No Sparkles Header) */}
        <div className="flex items-center gap-1 sm:gap-1.5 self-end sm:self-auto shrink-0">
          {weekOverview.map(item => {
            const isSelected = selectedDay === item.day.key;

            return (
              <button
                key={item.day.key}
                type="button"
                onClick={() => setSelectedDay(item.day.key)}
                className={`group relative flex flex-col items-center justify-center w-7 sm:w-7.5 py-1 rounded-lg transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white/[0.12] ring-1.5 ring-[var(--accent)] shadow-sm'
                    : 'bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06]'
                }`}
                title={`${item.day.label}: ${
                  item.isRestDay
                    ? 'Rest Day (No scheduled subjects)'
                    : item.isCompleted
                    ? '100% Completed! Goal Met'
                    : `${item.percent}% completed (${item.itemCount} subjects)`
                }`}
              >
                {/* Day Initial */}
                <span
                  className={`text-[9px] font-mono font-bold uppercase transition-colors ${
                    item.isToday
                      ? 'text-amber-400'
                      : isSelected
                      ? 'text-[var(--text)]'
                      : 'text-[var(--text-dim)] group-hover:text-[var(--text)]'
                  }`}
                >
                  {item.day.short.slice(0, 1)}
                </span>

                {/* Completion Indicator Dot / Icon */}
                <div className="mt-0.5 flex items-center justify-center w-3.5 h-3.5">
                  {item.isRestDay ? (
                    <Moon className="w-2.5 h-2.5 text-neutral-500" />
                  ) : item.isCompleted ? (
                    <div className="flex items-center justify-center w-3 h-3 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                    </div>
                  ) : item.isToday ? (
                    <div className="relative w-3 h-3 rounded-full border border-amber-400/50 flex items-center justify-center">
                      <div
                        className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"
                        style={{ opacity: Math.max(0.3, item.percent / 100) }}
                      />
                    </div>
                  ) : item.isPast ? (
                    <div className="w-1.5 h-1.5 rounded-full bg-neutral-600 opacity-60" />
                  ) : (
                    <div className="w-1 h-1 rounded-full bg-neutral-700 opacity-40" />
                  )}
                </div>

                {/* Tiny Today Indicator Bar */}
                {item.isToday && (
                  <span className="absolute -bottom-0.5 w-2 h-0.5 rounded-full bg-amber-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

