'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Lock,
  Award,
  Calendar,
  Clock,
  BookOpen,
} from 'lucide-react';
import { useReducedMotion } from 'framer-motion';
import { usePremium } from '../../context/PremiumContext';
import { getSupabase } from '../../lib/supabase';
import { useRankTheme } from '../../hooks/useRankTheme';

export interface WeeklyReportData {
  this_week_seconds: number;
  last_week_seconds: number;
  this_week_by_day: number[]; // 7 elements (Mon..Sun)
  last_week_by_day: number[]; // 7 elements (Mon..Sun)
  this_week_active_days: number;
  last_week_active_days: number;
  longest_session_seconds: number;
  top_subject: {
    subject_id: string | null;
    name: string;
    this_week_seconds: number;
    last_week_seconds: number;
    change_seconds: number;
  } | null;
  best_day: {
    day_index: number;
    day_name: string;
    seconds: number;
  } | null;
}

const SAMPLE_WEEKLY_REPORT: WeeklyReportData = {
  this_week_seconds: 88200, // 24.5 hrs
  last_week_seconds: 72000, // 20.0 hrs
  this_week_by_day: [14400, 19440, 12600, 16200, 10800, 14760, 0], // Mon..Sun (Tuesday = 5.4h)
  last_week_by_day: [10800, 14400, 10800, 12600, 10800, 7200, 5400],
  this_week_active_days: 5,
  last_week_active_days: 7,
  longest_session_seconds: 9000, // 2.5 hrs
  top_subject: {
    subject_id: 'sub-sample',
    name: 'Maths',
    this_week_seconds: 32400,
    last_week_seconds: 30000,
    change_seconds: 2400, // +40 mins
  },
  best_day: {
    day_index: 2,
    day_name: 'Tuesday',
    seconds: 19440, // 5.4 hrs
  },
};

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function formatHours(seconds: number): string {
  const hrs = seconds / 3600;
  return hrs >= 10 ? hrs.toFixed(1) : hrs.toFixed(1);
}

function formatBarHours(seconds: number): string {
  if (!seconds || seconds <= 0) return '0h';
  const hrs = seconds / 3600;
  if (hrs < 0.1) {
    const mins = Math.round(seconds / 60);
    return mins > 0 ? `${mins}m` : '0h';
  }
  return `${hrs.toFixed(1)}h`;
}

function formatMinutes(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function WeeklyReportCard() {
  const shouldReduceMotion = useReducedMotion();
  const { isPremium, loading: premiumLoading, refresh, openPremiumModal } = usePremium();
  const { theme } = useRankTheme();

  const [realData, setRealData] = useState<WeeklyReportData | null>(null);
  const [dataLoading, setDataLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hoveredDayIdx, setHoveredDayIdx] = useState<number | null>(null);

  const fetchWeeklyReport = useCallback(async () => {
    // Free users and loading states NEVER call get_my_weekly_report
    if (premiumLoading || !isPremium) return;

    const supabase = getSupabase();
    if (!supabase) return;

    setDataLoading(true);
    setErrorMessage(null);

    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      const { data, error } = await supabase.rpc('get_my_weekly_report', { p_tz: tz });

      if (error) {
        if (
          error.message?.includes('premium_required') ||
          error.code === '42501' ||
          (error as any)?.details?.includes('premium_required')
        ) {
          await refresh();
        } else {
          setErrorMessage('Could not load weekly report at this time.');
        }
        setRealData(null);
      } else if (data) {
        setRealData(data as WeeklyReportData);
      }
    } catch (err: any) {
      if (err?.message?.includes('premium_required')) {
        await refresh();
      } else {
        setErrorMessage('Unable to reach report service.');
      }
    } finally {
      setDataLoading(false);
    }
  }, [premiumLoading, isPremium, refresh]);

  useEffect(() => {
    if (!premiumLoading && isPremium) {
      fetchWeeklyReport();
    } else {
      setRealData(null);
    }
  }, [premiumLoading, isPremium, fetchWeeklyReport]);

  // Use real data for premium, fixed sample data for free
  const displayData = isPremium && realData ? realData : SAMPLE_WEEKLY_REPORT;

  // Percentage vs last week
  const changeComparison = useMemo(() => {
    const current = displayData.this_week_seconds;
    const previous = displayData.last_week_seconds;

    if (previous === 0 && current > 0) {
      return {
        type: 'first_week',
        label: 'First recorded week',
        percent: null,
      };
    }

    if (previous === 0 && current === 0) {
      return {
        type: 'neutral',
        label: '0% vs last week',
        percent: 0,
      };
    }

    const diff = current - previous;
    const pct = Math.round((Math.abs(diff) / previous) * 100);

    if (diff > 0) {
      return {
        type: 'positive',
        label: `+${pct}% vs last week`,
        percent: pct,
      };
    } else if (diff < 0) {
      return {
        type: 'negative',
        label: `-${pct}% vs last week`,
        percent: pct,
      };
    }
    return {
      type: 'neutral',
      label: '0% vs last week',
      percent: 0,
    };
  }, [displayData.this_week_seconds, displayData.last_week_seconds]);

  // Chart max calculation
  const maxDaySeconds = useMemo(() => {
    const thisMax = Math.max(...(displayData.this_week_by_day || [0]), 0);
    const lastMax = Math.max(...(displayData.last_week_by_day || [0]), 0);
    return Math.max(thisMax, lastMax, 3600); // at least 1 hour scale
  }, [displayData.this_week_by_day, displayData.last_week_by_day]);

  // Three short sentences generated strictly from the data
  const sentences = useMemo(() => {
    // Sentence 1: Best day
    let sentence1 = 'No sessions logged yet this week.';
    if (displayData.best_day && displayData.best_day.seconds > 0) {
      sentence1 = `${displayData.best_day.day_name} was your strongest day.`;
    }

    // Sentence 2: Active days
    const activeDays = displayData.this_week_active_days || 0;
    const sentence2 = `You studied on ${activeDays} of 7 days.`;

    // Sentence 3: Subject growth
    let sentence3 = 'Log sessions with subjects to track focus growth.';
    if (displayData.top_subject) {
      const { name, change_seconds, this_week_seconds } = displayData.top_subject;
      const changeMins = Math.round(Math.abs(change_seconds) / 60);

      if (displayData.last_week_seconds === 0 && this_week_seconds > 0) {
        sentence3 = `${name} led your study time with ${formatMinutes(this_week_seconds)}.`;
      } else if (change_seconds > 0) {
        sentence3 = `${name} grew by ${changeMins} minutes.`;
      } else if (change_seconds < 0) {
        sentence3 = `${name} dipped by ${changeMins} minutes vs last week.`;
      } else {
        sentence3 = `${name} held steady at ${formatMinutes(this_week_seconds)}.`;
      }
    }

    return [sentence1, sentence2, sentence3];
  }, [displayData]);

  return (
    <section
      aria-label="Weekly Report"
      className="mt-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-card overflow-hidden transition-all relative"
    >
      {/* Header */}
      <div className="p-5 sm:p-6 border-b border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-[#E6C15A] border border-[var(--border)] shadow-sm shrink-0"
            style={{ backgroundColor: 'rgba(230, 193, 90, 0.1)' }}
          >
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-hud font-bold text-base sm:text-lg text-[var(--text)] tracking-tight">
                Weekly Report
              </h3>
              {!isPremium ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-hud uppercase tracking-wider font-bold bg-[var(--surface-2)] text-[var(--text-dim)] border border-[var(--border)]">
                  <Lock className="w-2.5 h-2.5" />
                  <span>Sample</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-hud uppercase tracking-wider font-bold bg-[#E6C15A]/15 text-[#E6C15A] border border-[#E6C15A]/30">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>Premium</span>
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--text-dim)] mt-0.5">
              Monday through Sunday week-over-week performance analysis.
            </p>
          </div>
        </div>

        {isPremium && dataLoading && (
          <span className="text-xs font-mono text-[var(--text-dim)] animate-pulse">
            Refreshing report...
          </span>
        )}
      </div>

      {/* Main Content Area */}
      <div className="relative p-5 sm:p-6">
        {/* Report Card Body (blurred for free users) */}
        <div
          className={`transition-all duration-300 ${
            !isPremium
              ? 'filter blur-[5px] opacity-40 select-none pointer-events-none'
              : ''
          }`}
          aria-hidden={!isPremium}
        >
          {/* Top Metric Row: Big Total + Trend Comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {/* Metric 1: This Week Total Focus Time */}
            <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex flex-col justify-between">
              <span className="text-[10px] font-hud uppercase tracking-wider text-[var(--text-dim)]">
                This Week Total
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="font-hud font-black text-3xl sm:text-4xl text-[var(--text)] tracking-tight">
                  {formatHours(displayData.this_week_seconds)}
                </span>
                <span className="text-sm font-hud font-bold text-[#E6C15A]">
                  hours
                </span>
              </div>

              {/* Comparison badge & Last week total */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                <div className="flex items-center gap-1.5 font-semibold">
                  {changeComparison.type === 'positive' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>{changeComparison.label}</span>
                    </span>
                  )}
                  {changeComparison.type === 'negative' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      <TrendingDown className="w-3.5 h-3.5" />
                      <span>{changeComparison.label}</span>
                    </span>
                  )}
                  {changeComparison.type === 'first_week' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#E6C15A]/15 text-[#E6C15A] border border-[#E6C15A]/30">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{changeComparison.label}</span>
                    </span>
                  )}
                  {changeComparison.type === 'neutral' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 text-[var(--text-dim)] border border-[var(--border)]">
                      <Minus className="w-3.5 h-3.5" />
                      <span>{changeComparison.label}</span>
                    </span>
                  )}
                </div>

                <span
                  className="text-xs font-mono text-[var(--text-dim)]"
                  title={`Previous week total: ${formatHours(displayData.last_week_seconds)} hours`}
                >
                  Last week: {formatHours(displayData.last_week_seconds)} hrs
                </span>
              </div>
            </div>

            {/* Metric 2: Consistency & Active Days */}
            <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex flex-col justify-between">
              <span className="text-[10px] font-hud uppercase tracking-wider text-[var(--text-dim)] flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-[#E6C15A]" />
                <span>Active Days</span>
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="font-hud font-black text-3xl sm:text-4xl text-[var(--text)] tracking-tight">
                  {displayData.this_week_active_days}
                </span>
                <span className="text-sm font-mono text-[var(--text-dim)]">
                  of 7 days
                </span>
              </div>
              <div className="mt-3 text-xs font-mono text-[var(--text-dim)]">
                Last week: {displayData.last_week_active_days} days active
              </div>
            </div>

            {/* Metric 3: Longest Single Session */}
            <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex flex-col justify-between">
              <span className="text-[10px] font-hud uppercase tracking-wider text-[var(--text-dim)] flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-[#E6C15A]" />
                <span>Longest Focus Session</span>
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="font-hud font-black text-3xl sm:text-4xl text-[var(--text)] tracking-tight">
                  {formatMinutes(displayData.longest_session_seconds)}
                </span>
              </div>
              <div className="mt-3 text-xs font-mono text-[var(--text-dim)] truncate">
                {displayData.top_subject
                  ? `Top: ${displayData.top_subject.name}`
                  : 'Uninterrupted focus'}
              </div>
            </div>
          </div>

          {/* 7-Bar Chart: Side-by-side Last Week vs This Week with visible hours */}
          <div className="p-5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h4 className="font-hud font-bold text-xs uppercase tracking-wider text-[var(--text)]">
                  Day-by-Day Activity (Monday to Sunday)
                </h4>
                <p className="text-[11px] font-mono text-[var(--text-dim)] mt-0.5">
                  Side-by-side comparison of daily focus time (This Week vs Last Week).
                </p>
              </div>

              {/* Legend with total hours */}
              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-3 h-3 rounded-sm shadow-sm"
                    style={{ backgroundColor: theme.accent || '#E6C15A' }}
                  />
                  <span className="text-[var(--text)] font-semibold">This Week</span>
                  <span className="text-[var(--text-dim)] text-[11px]">({formatHours(displayData.this_week_seconds)}h)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-slate-600/90 border border-slate-500/70" />
                  <span className="text-slate-300 font-semibold">Last Week</span>
                  <span className="text-[var(--text-dim)] text-[11px]">({formatHours(displayData.last_week_seconds)}h)</span>
                </div>
              </div>
            </div>

            {/* Readout Banner */}
            <div className="h-6 mb-3 text-xs font-mono text-[var(--text-dim)] flex items-center">
              {hoveredDayIdx !== null ? (
                <div className="animate-in fade-in duration-100 flex items-center gap-2">
                  <span className="font-bold text-[var(--text)]">
                    {DAY_LABELS[hoveredDayIdx]}:
                  </span>
                  <span style={{ color: theme.accent || '#E6C15A' }} className="font-semibold">
                    {formatMinutes(displayData.this_week_by_day[hoveredDayIdx] || 0)} this week
                  </span>
                  <span>&bull;</span>
                  <span className="text-slate-300">
                    {formatMinutes(displayData.last_week_by_day[hoveredDayIdx] || 0)} last week
                  </span>
                </div>
              ) : (
                <span className="text-[11px] text-[var(--text-dim)] opacity-80">
                  Daily focus hours are displayed above each bar • Tap or hover for minutes
                </span>
              )}
            </div>

            {/* 7 Bars Layout with Side-by-Side Dual Bars and Visible Hours */}
            <div className="grid grid-cols-7 gap-1 sm:gap-3 h-56 items-end pt-6 pb-3 border-b border-[var(--border)]">
              {DAY_LABELS.map((day, idx) => {
                const thisSecs = displayData.this_week_by_day[idx] || 0;
                const lastSecs = displayData.last_week_by_day[idx] || 0;

                const thisHeightPct = Math.min(Math.round((thisSecs / maxDaySeconds) * 100), 100);
                const lastHeightPct = Math.min(Math.round((lastSecs / maxDaySeconds) * 100), 100);

                const isHovered = hoveredDayIdx === idx;

                return (
                  <div
                    key={day}
                    onMouseEnter={() => setHoveredDayIdx(idx)}
                    onMouseLeave={() => setHoveredDayIdx(null)}
                    onClick={() => setHoveredDayIdx(idx)}
                    className={`relative h-full flex flex-col justify-end items-center cursor-pointer transition-all rounded-xl py-1 px-0.5 sm:px-1 ${
                      isHovered ? 'bg-white/[0.04]' : ''
                    }`}
                  >
                    {/* Paired Bars Container */}
                    <div className="relative w-full h-full flex items-end justify-center gap-1 sm:gap-2">
                      {/* Last Week Bar Column */}
                      <div className="flex flex-col items-center justify-end h-full w-full max-w-[18px] sm:max-w-[28px]">
                        {/* Always visible hours label */}
                        <span
                          className={`text-[8.5px] sm:text-[10px] font-mono leading-none mb-1 text-center transition-colors ${
                            lastSecs > 0 ? 'text-slate-300 font-semibold' : 'text-slate-600'
                          }`}
                        >
                          {formatBarHours(lastSecs)}
                        </span>
                        <div
                          className={`w-full rounded-t-md transition-all duration-300 ${
                            lastSecs > 0
                              ? 'bg-slate-600/80 border border-slate-500/70 hover:bg-slate-500'
                              : 'bg-white/[0.05] border-t border-dashed border-white/20'
                          }`}
                          style={{
                            height: `${Math.max(lastHeightPct, 4)}%`,
                            minHeight: '4px',
                          }}
                        />
                      </div>

                      {/* This Week Bar Column */}
                      <div className="flex flex-col items-center justify-end h-full w-full max-w-[18px] sm:max-w-[28px]">
                        {/* Always visible hours label */}
                        <span
                          className={`text-[8.5px] sm:text-[10px] font-mono leading-none mb-1 text-center transition-colors ${
                            thisSecs > 0 ? 'font-bold' : 'text-slate-600'
                          }`}
                          style={{ color: thisSecs > 0 ? (theme.accent || '#E6C15A') : undefined }}
                        >
                          {formatBarHours(thisSecs)}
                        </span>
                        <div
                          className={`w-full rounded-t-md transition-all duration-300 z-10 ${
                            thisSecs > 0
                              ? 'hover:brightness-110'
                              : 'bg-white/[0.05] border-t border-dashed border-white/20'
                          }`}
                          style={{
                            height: `${Math.max(thisHeightPct, 4)}%`,
                            minHeight: '4px',
                            backgroundColor: thisSecs > 0 ? (theme.accent || '#E6C15A') : undefined,
                            boxShadow:
                              thisSecs > 0
                                ? `0 0 10px ${theme.glow || 'rgba(230, 193, 90, 0.35)'}`
                                : 'none',
                          }}
                        />
                      </div>
                    </div>

                    {/* Day label */}
                    <div className="flex flex-col items-center mt-2">
                      <span
                        className={`text-[10px] sm:text-xs font-mono font-bold transition-colors ${
                          isHovered ? 'text-[var(--text)]' : 'text-[var(--text-dim)]'
                        }`}
                      >
                        {day}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Three Short Sentences Digest */}
          <div className="p-4 sm:p-5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
            <span className="text-[10px] font-hud uppercase tracking-wider text-[#E6C15A] font-bold block mb-2.5">
              Weekly Digest Insights
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm font-sans text-[var(--text)]">
              {sentences.map((sentence, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex items-start gap-2.5"
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                    style={{ backgroundColor: theme.accent || '#E6C15A' }}
                  />
                  <p className="leading-relaxed font-medium">{sentence}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Free User Gated Lock Overlay */}
        {!isPremium && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4">
            <div className="p-6 sm:p-7 rounded-2xl bg-[var(--surface)]/95 border border-[var(--border)] shadow-2xl backdrop-blur-md flex flex-col items-center text-center max-w-sm">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] text-[11px] font-bold tracking-wider uppercase mb-3 border border-[var(--border)]">
                <Lock className="w-3 h-3" />
                <span>Sample</span>
              </div>

              <h4 className="text-base font-bold text-[var(--text)] tracking-tight">
                Unlock Weekly Report Card
              </h4>

              <p className="text-xs text-[var(--text-dim)] mt-1.5 mb-5 leading-relaxed">
                Compare week-over-week study hours with 7-day baseline charts, active day consistency, and automated performance digests.
              </p>

              <button
                type="button"
                id="unlock-weekly-report-btn"
                onClick={openPremiumModal}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-[var(--accent)] text-[var(--accent-contrast)] hover:opacity-90 active:scale-95 transition-all shadow-md inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Unlock with Premium</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
