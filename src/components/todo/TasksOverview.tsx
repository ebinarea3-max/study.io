'use client';

import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useStudy } from '../../context/StudyContext';
import { DailyTodoList } from './DailyTodoList';
import {
  Sparkles,
  MessageCircle,
  Flame,
} from 'lucide-react';
import {
  formatHoursAndMins,
  getLocalStartOfDay,
  getLocalEndOfDay,
  getYesterdayRange,
} from '../../lib/utils';
import { isSessionToday, isSessionYesterday } from '../../lib/dateUtils';
import { Skeleton } from '../common/Skeleton';

export function TasksOverview() {
  const { user, isLoading } = useAuth();
  const { sessions, hasHydrated, isLoadingSessions } = useStudy();
  const [overviewView, setOverviewView] = useState<'today' | 'yesterday'>('today');

  // Filtered sessions for Today (browser-local timezone)
  const todaySessions = useMemo(() => {
    return sessions.filter(s => {
      const duration = Number(s.durationSeconds ?? (s as any).duration_seconds ?? (s as any).duration ?? 0);
      if (duration <= 0) return false;
      const rawName = (s.subject_name || s.subjectName || (s as any).subject?.name || (s as any).subject || '').trim().toLowerCase();
      if (rawName === 'unassigned') return false;
      return isSessionToday(s);
    });
  }, [sessions]);

  // Filtered sessions for Yesterday (browser-local timezone)
  const yesterdaySessions = useMemo(() => {
    return sessions.filter(s => {
      const duration = Number(s.durationSeconds ?? (s as any).duration_seconds ?? (s as any).duration ?? 0);
      if (duration <= 0) return false;
      const rawName = (s.subject_name || s.subjectName || (s as any).subject?.name || (s as any).subject || '').trim().toLowerCase();
      if (rawName === 'unassigned') return false;
      return isSessionYesterday(s);
    });
  }, [sessions]);

  // Overview metrics (Today & Yesterday)
  const overviewTodaySeconds = useMemo(() => {
    return todaySessions.reduce((sum, s) => sum + s.durationSeconds, 0);
  }, [todaySessions]);
  const overviewTodaySessionsCount = todaySessions.length;

  const yesterdayTotalSeconds = useMemo(() => {
    return yesterdaySessions.reduce((sum, s) => sum + s.durationSeconds, 0);
  }, [yesterdaySessions]);
  const yesterdaySessionsCount = yesterdaySessions.length;

  // Motivation & Boost Messaging
  const { primaryBoostMessage, secondaryBoostMessage } = useMemo(() => {
    if (isLoading) {
      return {
        primaryBoostMessage: 'Ready to tackle your tasks today.',
        secondaryBoostMessage: '',
      };
    }

    const currentStreak = user?.streakDays ?? 0;
    const focusMinutes = Math.floor(overviewTodaySeconds / 60);

    let primary = '';
    let secondary = '';

    if (currentStreak >= 30) {
      primary = "🔥 30-day streak! You've basically made this a lifestyle.";
    } else if (currentStreak >= 14) {
      primary = "🔥 Two weeks strong — this is becoming a habit now.";
    } else if (currentStreak >= 7) {
      primary = "🔥 7-day streak! Consistency is compounding.";
    } else if (currentStreak >= 3) {
      primary = `🔥 You're on a ${currentStreak}-day streak — don't break the chain.`;
    } else if (currentStreak === 2) {
      primary = "🔥 You're on a 2-day streak — keep it going today.";
    } else if (currentStreak === 1) {
      primary = "🔥 Day 1 logged. Check off tasks to build momentum.";
    }

    if (focusMinutes >= 240) {
      secondary = '4+ hours today. Seriously — consider a break.';
    } else if (focusMinutes >= 120) {
      secondary = '2 hours of deep focus already. Great pace.';
    } else if (focusMinutes >= 25) {
      secondary = 'Nice, you completed a full focus block today.';
    }

    if (!primary) {
      primary = 'Every completed task moves you one step closer to mastery.';
    }

    return { primaryBoostMessage: primary, secondaryBoostMessage: secondary };
  }, [isLoading, user?.streakDays, overviewTodaySeconds]);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-5 px-3.5 sm:px-6 py-4 pb-24 md:pb-12 animate-in fade-in duration-200">
      {/* 1. Today's Boost / Motivation Card (Top of Tasks View) */}
      <div className="rounded-3xl bg-amber-950/15 border border-amber-500/25 hover:border-amber-500/40 backdrop-blur-xl p-4 sm:p-5 shadow-xl space-y-2.5 transition-all relative overflow-hidden group">
        <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

        <div className="flex items-center gap-2 pb-2 border-b border-amber-500/15 relative z-10">
          <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500 dark:text-amber-400 flex-shrink-0">
            <MessageCircle className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-slate-800 dark:text-amber-300 tracking-tight uppercase">Today&apos;s Boost</span>
        </div>

        <div className="min-h-[36px] flex flex-col justify-center relative z-10">
          <p className="text-sm sm:text-[15px] font-semibold text-slate-800 dark:text-amber-100/95 leading-snug tracking-tight">
            {primaryBoostMessage}
          </p>
          {secondaryBoostMessage && (
            <p className="text-xs text-slate-700 dark:text-amber-300/80 mt-1 leading-normal font-medium">
              {secondaryBoostMessage}
            </p>
          )}
        </div>
      </div>

      {/* 2. Interactive To-Do List Checklist (Center) */}
      <div className="relative z-10">
        <DailyTodoList />
      </div>

      {/* 3. Daily Overview Stats Card (Below To-Do List) */}
      <div className="rounded-3xl bg-neutral-900/50 border border-white/[0.08] hover:border-violet-500/30 backdrop-blur-xl p-4 sm:p-5 shadow-xl space-y-3.5 transition-all relative overflow-hidden group">
        <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-violet-600/10 blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between pb-2.5 border-b border-violet-500/15 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-500 dark:text-violet-400 flex-shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-violet-200 tracking-tight uppercase">Daily Overview</span>
          </div>

          {/* Today vs Yesterday Toggle */}
          <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-100 dark:bg-violet-950/50 border border-slate-200 dark:border-violet-800/40 text-[10px]">
            <button
              onClick={() => setOverviewView('today')}
              className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                overviewView === 'today'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-violet-300/70 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setOverviewView('yesterday')}
              className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                overviewView === 'yesterday'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-violet-300/70 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Yesterday
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-violet-300/70 font-semibold font-mono relative z-10">
          <span>{overviewView === 'today' ? "Today's Activity" : "Yesterday's Activity"}</span>
          <span>
            {overviewView === 'today'
              ? new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
              : new Date(Date.now() - 86400000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 relative z-10">
          <div className="p-3 rounded-2xl bg-slate-100 dark:bg-violet-950/20 border border-slate-200 dark:border-violet-800/30 hover:border-violet-500/30 transition-colors space-y-1">
            <div className="text-[10px] uppercase font-semibold tracking-wider text-slate-500 dark:text-violet-300/70">Total Focus</div>
            <div className="text-lg font-bold text-slate-900 dark:text-violet-100 font-mono tabular-nums tracking-tight">
              {(isLoading || isLoadingSessions) && !hasHydrated ? (
                <Skeleton className="h-6 w-20 my-0.5 bg-slate-200 dark:bg-violet-900/50" />
              ) : (
                formatHoursAndMins(overviewView === 'today' ? overviewTodaySeconds : yesterdayTotalSeconds)
              )}
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-100 dark:bg-violet-950/20 border border-slate-200 dark:border-violet-800/30 hover:border-violet-500/30 transition-colors space-y-1">
            <div className="text-[10px] uppercase font-semibold tracking-wider text-slate-500 dark:text-violet-300/70">Sessions</div>
            <div className="text-lg font-bold text-slate-900 dark:text-violet-100 font-mono tabular-nums tracking-tight">
              {(isLoading || isLoadingSessions) && !hasHydrated ? (
                <Skeleton className="h-6 w-12 my-0.5 bg-slate-200 dark:bg-violet-900/50" />
              ) : (
                overviewView === 'today' ? overviewTodaySessionsCount : yesterdaySessionsCount
              )}
            </div>
          </div>
        </div>

        <div className="pt-1 flex items-center justify-between text-xs relative z-10">
          <span className="flex items-center gap-1.5 text-slate-600 dark:text-neutral-400">
            <Flame className="w-3.5 h-3.5 text-[#f97316] fill-[#f97316]" />
            <span className="font-medium">Streak</span>
          </span>
          {(user?.streakDays ?? 0) > 0 ? (
            <span className="px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-700/40 text-orange-700 dark:text-[#f97316] font-mono font-bold text-xs tabular-nums shadow-sm shadow-orange-950/30">
              {user?.streakDays ?? 0} {(user?.streakDays ?? 0) === 1 ? 'day' : 'days'}
            </span>
          ) : (
            <span className="font-mono font-bold text-slate-500 dark:text-neutral-400 tabular-nums">Start today</span>
          )}
        </div>
      </div>
    </div>
  );
}
