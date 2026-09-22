'use client';

import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useStudy } from '../../context/StudyContext';
import { DailyTodoList } from './DailyTodoList';
import {
  Sparkles,
  Flame,
  Radio,
} from 'lucide-react';
import {
  formatHoursAndMins,
} from '../../lib/utils';
import { isSessionToday, isSessionYesterday } from '../../lib/dateUtils';
import { Skeleton } from '../common/Skeleton';
import { useRankTheme } from '../../hooks/useRankTheme';

export function TasksOverview() {
  const { user, isLoading } = useAuth();
  const { sessions, hasHydrated, isLoadingSessions } = useStudy();
  const [overviewView, setOverviewView] = useState<'today' | 'yesterday'>('today');
  const { theme } = useRankTheme();

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
    <div className="w-full max-w-3xl mx-auto space-y-4 px-3.5 sm:px-6 py-4 pb-24 md:pb-12 animate-in fade-in duration-200">
      {/* 1. Operational Directive (Top of Tasks View) */}
      <div className="hud-surface hud-corner-frame border border-white/[0.08] rounded-2xl p-4 sm:p-4.5 space-y-2 relative overflow-hidden group">
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.06] relative z-10">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5" style={{ color: theme.accent }} />
            <span className="font-hud-mono text-[11px] font-bold uppercase tracking-wider text-neutral-300">
              TODAY'S BOOST // Objectives
            </span>
          </div>
          <span
            className="font-hud-mono text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded border"
            style={{
              color: theme.accent,
              borderColor: `${theme.accent}40`,
              backgroundColor: `${theme.accent}12`,
            }}
          >
            ACTIVE DISPATCH
          </span>
        </div>

        <div className="min-h-[34px] flex flex-col justify-center relative z-10">
          <p className="text-xs sm:text-[13px] font-medium text-neutral-200 leading-snug">
            {primaryBoostMessage}
          </p>
          {secondaryBoostMessage && (
            <p className="text-[11px] font-hud-mono mt-1 leading-normal" style={{ color: theme.accent }}>
              {secondaryBoostMessage}
            </p>
          )}
        </div>
      </div>

      {/* 2. Interactive To-Do List Checklist (Center) */}
      <div className="relative z-10">
        <DailyTodoList />
      </div>

      {/* 3. Daily Telemetry Overview (Below To-Do List) */}
      <div className="hud-surface hud-corner-frame border border-white/[0.08] rounded-2xl p-4 sm:p-5 space-y-3.5 relative overflow-hidden">
        {/* Header Row */}
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5" style={{ color: theme.accent }} />
            <span className="font-hud-mono text-xs uppercase tracking-wider font-bold text-neutral-300">
              Daily Overview
            </span>
          </div>

          {/* Toggle */}
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-black/60 border border-white/[0.08] text-[10px]">
            <button
              onClick={() => setOverviewView('today')}
              className={`px-2.5 py-1 rounded font-hud-mono font-bold tracking-wider transition-all cursor-pointer ${
                overviewView === 'today'
                  ? 'text-slate-950 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
              style={overviewView === 'today' ? { backgroundColor: theme.accent } : undefined}
            >
              TODAY
            </button>
            <button
              onClick={() => setOverviewView('yesterday')}
              className={`px-2.5 py-1 rounded font-hud-mono font-bold tracking-wider transition-all cursor-pointer ${
                overviewView === 'yesterday'
                  ? 'text-slate-950 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
              style={overviewView === 'yesterday' ? { backgroundColor: theme.accent } : undefined}
            >
              YESTERDAY
            </button>
          </div>
        </div>

        {/* 2 Metric Readout Panels */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-black/40 border border-white/[0.05] space-y-1">
            <div className="font-hud-mono text-[10px] uppercase font-bold tracking-wider text-neutral-400">
              Total Focus
            </div>
            <div className="font-hud font-bold text-2xl text-white tabular-nums tracking-wide">
              {(isLoading || isLoadingSessions) && !hasHydrated ? (
                <Skeleton className="h-7 w-20 my-0.5 bg-neutral-800" />
              ) : (
                formatHoursAndMins(overviewView === 'today' ? overviewTodaySeconds : yesterdayTotalSeconds)
              )}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-black/40 border border-white/[0.05] space-y-1">
            <div className="font-hud-mono text-[10px] uppercase font-bold tracking-wider text-neutral-400">
              Sessions
            </div>
            <div className="font-hud font-bold text-2xl text-white tabular-nums tracking-wide">
              {(isLoading || isLoadingSessions) && !hasHydrated ? (
                <Skeleton className="h-7 w-12 my-0.5 bg-neutral-800" />
              ) : (
                overviewView === 'today' ? overviewTodaySessionsCount : yesterdaySessionsCount
              )}
            </div>
          </div>
        </div>

        {/* Streak Footer */}
        <div className="pt-2 flex items-center justify-between border-t border-white/[0.05]">
          <span className="flex items-center gap-1.5 text-neutral-400 font-hud-mono text-xs">
            <Flame className="w-3.5 h-3.5 animate-ember-glow" style={{ color: '#F59E0B' }} />
            <span>STREAK CONTINUITY</span>
          </span>
          {(user?.streakDays ?? 0) > 0 ? (
            <span
              className="px-2.5 py-0.5 rounded font-hud-mono font-bold text-xs tracking-wider border shadow-sm"
              style={{
                color: '#FBBF24',
                borderColor: '#F59E0B60',
                backgroundColor: 'rgba(245, 158, 11, 0.12)',
              }}
            >
              {user?.streakDays ?? 0} {(user?.streakDays ?? 0) === 1 ? 'DAY' : 'DAYS'}
            </span>
          ) : (
            <span className="font-hud-mono font-bold text-neutral-500 text-xs tracking-wider">
              READY TO INITIALIZE
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
