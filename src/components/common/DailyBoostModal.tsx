'use client';

import React, { useMemo } from 'react';
import { Sparkles, Flame, Target, ArrowRight, X, Quote } from 'lucide-react';
import { getLocalDateString } from '../../lib/dateUtils';

export interface DailyBoostItem {
  quote: string;
  author?: string;
  tip?: string;
}

export const DAILY_BOOST_BANK: DailyBoostItem[] = [
  {
    quote: "Deep work is the superpower of the 21st century.",
    author: "Cal Newport",
    tip: "Eliminate low-value distractions early and protect your prime cognitive hours.",
  },
  {
    quote: "Small daily disciplines compound into monumental success.",
    author: "Robin Sharma",
    tip: "Even a single 25-minute focus session today keeps your momentum unbroken.",
  },
  {
    quote: "One focused hour beats four distracted hours.",
    author: "study.io Principle",
    tip: "Silence notifications and keep only your active focus material open.",
  },
  {
    quote: "The pain of discipline is far less than the pain of regret.",
    author: "Jim Rohn",
    tip: "Start now. Momentum builds immediately after clicking Start.",
  },
  {
    quote: "Focus on the process, not the outcome.",
    author: "James Clear",
    tip: "Show up for today's session; consistent repetitions create mastery.",
  },
  {
    quote: "Every long streak starts with one session.",
    author: "study.io",
    tip: "Keep the chain unbroken today by logging your planned session.",
  },
  {
    quote: "Lock in. The future you will thank you.",
    author: "Marcus Aurelius",
    tip: "Decide on your single highest-priority task before starting your timer.",
  },
  {
    quote: "Future you will thank you for starting now.",
    author: "Daily Motivation",
    tip: "Action breeds inspiration, not the other way around.",
  },
];

export function getDailyBoostForDate(dateStr: string): DailyBoostItem {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % DAILY_BOOST_BANK.length;
  return DAILY_BOOST_BANK[index];
}

interface DailyBoostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartFocusing: () => void;
  streakDays: number;
  dailyGoalHours: number;
}

export function DailyBoostModal({
  isOpen,
  onClose,
  onStartFocusing,
  streakDays,
  dailyGoalHours,
}: DailyBoostModalProps) {
  const boostItem = useMemo(() => {
    const todayStr = getLocalDateString();
    return getDailyBoostForDate(todayStr);
  }, []);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="daily-boost-title"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-3xl shadow-2xl p-6 sm:p-8 text-center overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-[100px] opacity-35 pointer-events-none bg-gradient-to-br from-amber-500/30 via-emerald-500/25 to-teal-500/20" />

        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close welcome boost"
          className="absolute top-4 right-4 p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content Body */}
        <div className="relative z-10 flex flex-col items-center">
          {/* Top Icon Badge */}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-emerald-500/20 to-teal-500/20 border border-amber-500/35 flex items-center justify-center shadow-lg shadow-amber-500/15 mb-3.5">
            <Sparkles className="w-7 h-7 text-amber-500 dark:text-amber-300 animate-pulse" />
          </div>

          {/* Top Pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-slate-800 dark:text-amber-300 text-[11px] font-black tracking-widest uppercase mb-3">
            <Flame className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Today&apos;s Boost</span>
          </div>

          {/* Quote & Author */}
          <div className="relative my-2 px-2">
            <Quote className="w-5 h-5 text-slate-400/70 dark:text-slate-600/70 absolute -top-3 -left-1 transform -scale-x-100 opacity-60" />
            <h2
              id="daily-boost-title"
              className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white tracking-tight leading-snug"
            >
              &ldquo;{boostItem.quote}&rdquo;
            </h2>
            {boostItem.author && (
              <p className="text-xs text-slate-700 dark:text-amber-400/90 font-medium mt-1">
                — {boostItem.author}
              </p>
            )}
          </div>

          {/* Actionable Focus Tip */}
          {boostItem.tip && (
            <div className="w-full mt-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/90 text-left">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mb-0.5">
                <Sparkles className="w-3 h-3" />
                <span>Focus Tip of the Day</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {boostItem.tip}
              </p>
            </div>
          )}

          {/* Sub-stats: Current Streak & Daily Goal */}
          <div className="my-4 w-full grid grid-cols-2 gap-3">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/90 flex items-center gap-2.5 text-left">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center flex-shrink-0">
                <Flame className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Current Streak
                </div>
                <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white font-mono truncate">
                  {streakDays} {streakDays === 1 ? 'day' : 'days'}
                </div>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/90 flex items-center gap-2.5 text-left">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center flex-shrink-0">
                <Target className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Daily Goal
                </div>
                <div className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 font-mono truncate">
                  {dailyGoalHours}H / day
                </div>
              </div>
            </div>
          </div>

          {/* Primary Action Button */}
          <button
            onClick={onStartFocusing}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm transition-all shadow-lg shadow-emerald-500/25 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Start Focusing</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
