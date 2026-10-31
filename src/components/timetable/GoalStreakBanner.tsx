'use client';

import React from 'react';
import { useTimetable } from '../../context/TimetableContext';
import { Flame, Trophy, CheckCircle2, Sparkles, Moon, Clock } from 'lucide-react';
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
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--surface)] to-[var(--surface-2)] border border-[var(--border)] shadow-2xl p-4 sm:p-6 transition-all">
      {/* Decorative ambient background glow */}
      <div
        className="absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-700"
        style={{
          background: isTodayGoalCompleted
            ? 'radial-gradient(circle, #F59E0B 0%, #10B981 70%)'
            : 'radial-gradient(circle, var(--accent) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left: Streak Counter & Status */}
        <div className="flex items-center gap-4 sm:gap-5">
          {/* Flame Icon Container with animated pulsing glow */}
          <div
            className={`relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border transition-all duration-500 shrink-0 ${
              isTodayGoalCompleted
                ? 'bg-amber-500/20 border-amber-400/50 shadow-[0_0_30px_rgba(245,158,11,0.4)] animate-bounce-subtle'
                : streak.currentStreak > 0
                ? 'bg-orange-500/15 border-orange-500/30 shadow-[0_0_20px_rgba(249,115,22,0.25)]'
                : 'bg-white/[0.04] border-white/10 opacity-70'
            }`}
          >
            <Flame
              className={`w-8 h-8 sm:w-9 sm:h-9 transition-all ${
                isTodayGoalCompleted
                  ? 'text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.8)] fill-amber-400'
                  : streak.currentStreak > 0
                  ? 'text-orange-400 drop-shadow-[0_0_8px_rgba(249,115,22,0.6)] fill-orange-400/60'
                  : 'text-neutral-500'
              }`}
            />
            {isTodayGoalCompleted && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border border-black items-center justify-center text-[9px] text-black font-black">
                  ✓
                </span>
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                DAILY GOAL STREAK
              </span>
              {streak.longestStreak > 0 && (
                <div className="flex items-center gap-1 text-[11px] font-mono text-[var(--text-dim)]">
                  <Trophy className="w-3 h-3 text-amber-400/80" />
                  <span>Best: {streak.longestStreak}d</span>
                </div>
              )}
            </div>

            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-2xl sm:text-3xl font-hud font-black tracking-wider text-[var(--text)] drop-shadow-md">
                {streak.currentStreak}{' '}
                <span className="text-base sm:text-lg font-sans font-medium text-[var(--text-dim)]">
                  {streak.currentStreak === 1 ? 'DAY STREAK' : 'DAYS STREAK'}
                </span>
              </h3>
            </div>

            <p className="text-xs text-[var(--text-dim)] mt-0.5 flex items-center gap-1.5 font-sans">
              {isTodayGoalCompleted ? (
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  All targets completed for today! Streak secured.
                </span>
              ) : todayCompletionPercent > 0 ? (
                <span className="text-amber-400/90 font-medium flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Today: {todayCompletionPercent}% completed · Keep going!
                </span>
              ) : (
                <span>Complete all scheduled subjects today to maintain streak</span>
              )}
            </p>
          </div>
        </div>

        {/* Right: 7-Day Mini Completion Indicator */}
        <div className="flex flex-col items-start md:items-end gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-[var(--border)]">
          <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[var(--text-dim)] flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-[var(--accent)]" />
            <span>THIS WEEK'S TARGETS</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5">
            {weekOverview.map(item => {
              const isSelected = selectedDay === item.day.key;

              return (
                <button
                  key={item.day.key}
                  type="button"
                  onClick={() => setSelectedDay(item.day.key)}
                  className={`group relative flex flex-col items-center justify-center w-8 sm:w-9 py-1.5 rounded-xl transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white/[0.12] ring-2 ring-[var(--accent)] shadow-md scale-105'
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
                    className={`text-[10px] font-mono font-bold uppercase transition-colors ${
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
                  <div className="mt-1 flex items-center justify-center w-5 h-5">
                    {item.isRestDay ? (
                      <Moon className="w-3 h-3 text-neutral-500" />
                    ) : item.isCompleted ? (
                      <div className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.4)]">
                        <CheckCircle2 className="w-3 h-3" />
                      </div>
                    ) : item.isToday ? (
                      <div className="relative w-4 h-4 rounded-full border border-amber-400/50 flex items-center justify-center">
                        <div
                          className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"
                          style={{ opacity: Math.max(0.3, item.percent / 100) }}
                        />
                      </div>
                    ) : item.isPast ? (
                      <div className="w-2 h-2 rounded-full bg-neutral-600 opacity-60" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-neutral-700 opacity-40" />
                    )}
                  </div>

                  {/* Tiny Today Indicator Bar */}
                  {item.isToday && (
                    <span className="absolute -bottom-1 w-3 h-0.5 rounded-full bg-amber-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
