'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles, Clock, Calendar, BarChart3, Lock, Info } from 'lucide-react';
import { usePremium } from '../../context/PremiumContext';
import { getSupabase } from '../../lib/supabase';
import { formatHoursAndMins } from '../../lib/utils';

interface InsightsData {
  by_weekday: Record<string, number>;
  by_hour: Record<string, number>;
  by_day: Record<string, number>;
}

const WEEKDAY_NAMES: Record<number, string> = {
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
  7: 'Sunday',
};

// Fixed sample dataset for free users (realistic sample distribution)
const SAMPLE_INSIGHTS_DATA: InsightsData = {
  by_weekday: {
    '1': 32400, // 9h
    '2': 28800, // 8h
    '3': 39600, // 11h
    '4': 46800, // 13h (Best weekday)
    '5': 36000, // 10h
    '6': 21600, // 6h
    '7': 14400, // 4h
  },
  by_hour: {
    '8': 7200,
    '9': 14400,
    '10': 18000,
    '14': 14400,
    '15': 18000,
    '16': 21600,
    '19': 32400, // Best hour: 7 to 8 PM
    '20': 27000,
    '21': 19800,
  },
  by_day: (() => {
    const days: Record<string, number> = {};
    const now = new Date();
    // Populate last 84 days with representative sample pattern
    for (let i = 83; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const k = d.toISOString().split('T')[0];
      const dow = d.getDay();
      if (dow === 0 && i % 3 === 0) {
        days[k] = 0; // occasional rest day
      } else {
        const base = (i * 37) % 180;
        days[k] = (base + 45) * 60; // 45 to 225 mins
      }
    }
    return days;
  })(),
};

function formatHourRange(hour: number): string {
  const startPeriod = hour >= 12 ? 'PM' : 'AM';
  const endHour = (hour + 1) % 24;
  const endPeriod = endHour >= 12 ? 'PM' : 'AM';

  const start12 = hour % 12 === 0 ? 12 : hour % 12;
  const end12 = endHour % 12 === 0 ? 12 : endHour % 12;

  if (startPeriod === endPeriod) {
    return `${start12} to ${end12} ${endPeriod}`;
  }
  return `${start12} ${startPeriod} to ${end12} ${endPeriod}`;
}

export function StudyInsights() {
  const shouldReduceMotion = useReducedMotion();
  const { isPremium, loading: premiumLoading, refresh, openPremiumModal } = usePremium();

  const [realData, setRealData] = useState<InsightsData | null>(null);
  const [dataLoading, setDataLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{
    dateStr: string;
    minutes: number;
    formattedDate: string;
  } | null>(null);

  const fetchInsights = useCallback(async () => {
    // Neither free nor loading state can EVER call get_my_insights
    if (premiumLoading || !isPremium) return;

    const supabase = getSupabase();
    if (!supabase) return;

    setDataLoading(true);
    setErrorMessage(null);

    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      const { data, error } = await supabase.rpc('get_my_insights', { p_tz: tz });

      if (error) {
        // If RPC returns premium_required error, refresh entitlements and fallback
        if (
          error.message?.includes('premium_required') ||
          error.code === '42501' ||
          (error as any)?.details?.includes('premium_required')
        ) {
          await refresh();
        } else {
          setErrorMessage('Could not load insights at this time.');
        }
        setRealData(null);
      } else if (data) {
        setRealData(data as InsightsData);
      }
    } catch (err: any) {
      if (err?.message?.includes('premium_required')) {
        await refresh();
      } else {
        setErrorMessage('Unable to reach insights service.');
      }
    } finally {
      setDataLoading(false);
    }
  }, [premiumLoading, isPremium, refresh]);

  useEffect(() => {
    // Only call get_my_insights when entitlements loading is done AND isPremium is true
    if (!premiumLoading && isPremium) {
      fetchInsights();
    } else {
      setRealData(null);
      setDataLoading(false);
    }
  }, [premiumLoading, isPremium, fetchInsights]);

  // Active data source: real data for premium, fixed sample dataset for free
  const activeData = isPremium ? realData : SAMPLE_INSIGHTS_DATA;

  // Active days count for empty state (requires >= 3 active days for premium users)
  const activeDaysCount = useMemo(() => {
    if (!activeData?.by_day) return 0;
    return Object.values(activeData.by_day).filter((sec) => Number(sec) > 0).length;
  }, [activeData?.by_day]);

  // Compute Best Weekday
  const bestWeekdayInfo = useMemo(() => {
    if (!activeData?.by_weekday) return null;
    let maxSec = -1;
    let bestDayNum = 4; // default Thu
    for (const [dayStr, sec] of Object.entries(activeData.by_weekday)) {
      const numSec = Number(sec);
      if (numSec > maxSec) {
        maxSec = numSec;
        bestDayNum = Number(dayStr);
      }
    }
    if (maxSec <= 0) return null;
    return {
      dayName: WEEKDAY_NAMES[bestDayNum] || 'Thursday',
      seconds: maxSec,
      formattedTime: formatHoursAndMins(maxSec),
    };
  }, [activeData?.by_weekday]);

  // Compute Best Focus Hour
  const bestHourInfo = useMemo(() => {
    if (!activeData?.by_hour) return null;
    let maxSec = -1;
    let bestH = 19; // default 19
    for (const [hStr, sec] of Object.entries(activeData.by_hour)) {
      const numSec = Number(sec);
      if (numSec > maxSec) {
        maxSec = numSec;
        bestH = Number(hStr);
      }
    }
    if (maxSec <= 0) return null;
    return {
      hourLabel: formatHourRange(bestH),
      seconds: maxSec,
      formattedTime: formatHoursAndMins(maxSec),
    };
  }, [activeData?.by_hour]);

  // 12-Week Heatmap Grid Computation
  const { weeks, monthLabels, maxDayMinutes } = useMemo(() => {
    const byDay = activeData?.by_day || {};
    const now = new Date();

    // Find the Monday of current week (ISO weekday: 1=Mon .. 7=Sun)
    const currentIsoDow = now.getDay() === 0 ? 7 : now.getDay();
    const currentMonday = new Date(now);
    currentMonday.setDate(now.getDate() - (currentIsoDow - 1));
    currentMonday.setHours(0, 0, 0, 0);

    // 12 weeks total: start 11 weeks prior to current Monday
    const gridStartMonday = new Date(currentMonday);
    gridStartMonday.setDate(currentMonday.getDate() - 11 * 7);

    // Find max day minutes across dataset for dynamic 5-level scale
    let maxMin = 60;
    for (let w = 0; w < 12; w++) {
      for (let d = 0; d < 7; d++) {
        const cellDate = new Date(gridStartMonday);
        cellDate.setDate(gridStartMonday.getDate() + w * 7 + d);
        const k = cellDate.toISOString().split('T')[0];
        const sec = Number(byDay[k] || 0);
        const m = Math.round(sec / 60);
        if (m > maxMin) maxMin = m;
      }
    }

    const calculatedWeeks: {
      weekIndex: number;
      days: {
        dateStr: string;
        date: Date;
        minutes: number;
        level: number;
        isFuture: boolean;
        formattedDate: string;
      }[];
    }[] = [];

    const labels: { weekIndex: number; label: string }[] = [];
    let lastSeenMonth = -1;

    for (let w = 0; w < 12; w++) {
      const weekDays = [];
      const mondayDate = new Date(gridStartMonday);
      mondayDate.setDate(gridStartMonday.getDate() + w * 7);

      const mMonth = mondayDate.getMonth();
      if (mMonth !== lastSeenMonth) {
        labels.push({
          weekIndex: w,
          label: mondayDate.toLocaleDateString(undefined, { month: 'short' }),
        });
        lastSeenMonth = mMonth;
      }

      for (let d = 0; d < 7; d++) {
        const cellDate = new Date(gridStartMonday);
        cellDate.setDate(gridStartMonday.getDate() + w * 7 + d);
        const dateStr = cellDate.toISOString().split('T')[0];
        const seconds = Number(byDay[dateStr] || 0);
        const minutes = Math.round(seconds / 60);
        const isFuture = cellDate.getTime() > now.getTime();

        let level = 0;
        if (minutes > 0) {
          if (minutes <= maxMin * 0.25) level = 1;
          else if (minutes <= maxMin * 0.5) level = 2;
          else if (minutes <= maxMin * 0.75) level = 3;
          else level = 4;
        }

        weekDays.push({
          dateStr,
          date: cellDate,
          minutes,
          level,
          isFuture,
          formattedDate: cellDate.toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          }),
        });
      }
      calculatedWeeks.push({ weekIndex: w, days: weekDays });
    }

    return { weeks: calculatedWeeks, monthLabels: labels, maxDayMinutes: maxMin };
  }, [activeData?.by_day]);

  // Loading state (skeleton blocks)
  if (premiumLoading || (isPremium && dataLoading)) {
    return (
      <div className="w-full mt-6 p-5 sm:p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-card animate-pulse">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-[var(--surface-2)]" />
          <div>
            <div className="w-28 h-4 rounded bg-[var(--surface-2)] mb-1.5" />
            <div className="w-48 h-3 rounded bg-[var(--surface-2)]" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="h-20 rounded-xl bg-[var(--surface-2)]" />
          <div className="h-20 rounded-xl bg-[var(--surface-2)]" />
        </div>
        <div className="h-44 rounded-xl bg-[var(--surface-2)]" />
      </div>
    );
  }

  // Premium user with < 3 active study days: empty state
  if (isPremium && activeDaysCount < 3) {
    return (
      <section aria-labelledby="insights-heading" className="w-full mt-6">
        <div className="p-5 sm:p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-[var(--accent-soft)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3
                id="insights-heading"
                className="font-hud font-extrabold text-sm sm:text-base text-[var(--text)] tracking-wider uppercase"
              >
                Insights
              </h3>
              <p className="text-xs text-[var(--text-dim)] mt-0.5">
                Deep analytics on your study patterns and peak focus hours
              </p>
            </div>
          </div>

          <div className="p-8 rounded-xl bg-[var(--surface-2)]/60 border border-[var(--border)] text-center flex flex-col items-center justify-center my-2">
            <Calendar className="w-8 h-8 text-[var(--accent)] mb-3 opacity-80" />
            <p className="text-sm font-semibold text-[var(--text)]">
              Study on a few more days to see your patterns.
            </p>
            <p className="text-xs text-[var(--text-dim)] mt-1.5 max-w-sm">
              Your peak focus hours, best weekdays, and 12-week consistency heatmap will appear after 3 active study days.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="insights-heading" className="w-full mt-6">
      <div className="relative p-5 sm:p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-card overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--accent-soft)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3
                  id="insights-heading"
                  className="font-hud font-extrabold text-sm sm:text-base text-[var(--text)] tracking-wider uppercase"
                >
                  Insights
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--border)]">
                  Premium
                </span>
              </div>
              <p className="text-xs text-[var(--text-dim)] mt-0.5">
                Deep analytics on your study patterns and peak focus hours
              </p>
            </div>
          </div>
        </div>

        {/* Quiet error notification if non-critical error occurred */}
        {errorMessage && (
          <div className="my-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Content Container (Gated for free users with sample overlay) */}
        <div className="relative mt-4">
          <div
            className={
              !isPremium
                ? 'filter blur-[3.5px] select-none pointer-events-none opacity-50 transition-all duration-300'
                : ''
            }
          >
            {/* Plain sentences: Best Hour and Best Weekday */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-6">
              {/* Best Focus Hour Card */}
              <div className="p-4 rounded-xl bg-[var(--surface-2)]/70 border border-[var(--border)] flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--accent)] shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] font-hud uppercase tracking-wider text-[var(--text-dim)] font-bold">
                    Peak Focus Window
                  </div>
                  <p className="text-xs sm:text-sm text-[var(--text)] mt-1 leading-relaxed">
                    You focus best between{' '}
                    <strong className="text-[var(--accent)] font-semibold">
                      {bestHourInfo ? bestHourInfo.hourLabel : '7 to 8 PM'}
                    </strong>
                    {bestHourInfo && (
                      <>
                        , with{' '}
                        <span className="font-semibold">{bestHourInfo.formattedTime}</span> of total focus time.
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Best Weekday Card */}
              <div className="p-4 rounded-xl bg-[var(--surface-2)]/70 border border-[var(--border)] flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--accent)] shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] font-hud uppercase tracking-wider text-[var(--text-dim)] font-bold">
                    Most Productive Day
                  </div>
                  <p className="text-xs sm:text-sm text-[var(--text)] mt-1 leading-relaxed">
                    Your most active day is{' '}
                    <strong className="text-[var(--accent)] font-semibold">
                      {bestWeekdayInfo ? bestWeekdayInfo.dayName : 'Thursday'}
                    </strong>
                    {bestWeekdayInfo && (
                      <>
                        , totaling{' '}
                        <span className="font-semibold">{bestWeekdayInfo.formattedTime}</span> of study time.
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* 12-Week Heatmap Container */}
            <div className="p-4 rounded-xl bg-[var(--surface-2)]/50 border border-[var(--border)]">
              {/* Heatmap Header & Interactive Tooltip readout */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-3.5 h-3.5 text-[var(--accent)]" />
                  <span className="text-xs font-bold font-hud uppercase tracking-wider text-[var(--text)]">
                    12-Week Study Heatmap
                  </span>
                </div>
                {/* Live hover/tap tooltip badge */}
                <div className="text-[11px] font-mono text-[var(--text-dim)] h-5 flex items-center">
                  {hoveredCell ? (
                    <span className="animate-in fade-in duration-100 text-[var(--text)] font-semibold">
                      {hoveredCell.formattedDate}:{' '}
                      <span className="text-[var(--accent)]">
                        {hoveredCell.minutes > 0 ? `${hoveredCell.minutes} mins` : 'No study'}
                      </span>
                    </span>
                  ) : (
                    <span className="hidden sm:inline text-[var(--text-dim)]">
                      Hover or tap cell for details
                    </span>
                  )}
                </div>
              </div>

              {/* Heatmap Grid (Fits 390px screens without horizontal scroll) */}
              <div className="w-full flex justify-center sm:justify-start overflow-x-hidden py-1">
                <div className="inline-flex gap-2">
                  {/* Weekday Row Labels (Mon, Wed, Fri) */}
                  <div className="flex flex-col justify-between pt-5 pb-0.5 text-[9px] font-mono text-[var(--text-dim)] leading-none select-none">
                    <span className="h-3 flex items-center">Mon</span>
                    <span className="h-3 flex items-center">Wed</span>
                    <span className="h-3 flex items-center">Fri</span>
                    <span className="h-3 flex items-center">Sun</span>
                  </div>

                  {/* 12 Columns */}
                  <div className="flex gap-1 sm:gap-1.5">
                    {weeks.map((week, colIndex) => {
                      const monthLabelObj = monthLabels.find((m) => m.weekIndex === colIndex);

                      return (
                        <div key={week.weekIndex} className="flex flex-col items-center">
                          {/* Month Header Label */}
                          <div className="h-4 text-[9px] font-mono text-[var(--text-dim)] select-none uppercase">
                            {monthLabelObj?.label || ''}
                          </div>

                          {/* 7 Days of the Week (Monday first, d=0..6) */}
                          <div className="flex flex-col gap-1 sm:gap-1.5 mt-1">
                            {week.days.map((day) => {
                              const isHovered = hoveredCell?.dateStr === day.dateStr;

                              return (
                                <motion.button
                                  key={day.dateStr}
                                  type="button"
                                  initial={
                                    shouldReduceMotion
                                      ? false
                                      : { opacity: 0, scale: 0.85 }
                                  }
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{
                                    duration: 0.2,
                                    delay: shouldReduceMotion ? 0 : colIndex * 0.006,
                                    ease: 'easeOut',
                                  }}
                                  onMouseEnter={() =>
                                    setHoveredCell({
                                      dateStr: day.dateStr,
                                      minutes: day.minutes,
                                      formattedDate: day.formattedDate,
                                    })
                                  }
                                  onMouseLeave={() => setHoveredCell(null)}
                                  onClick={() =>
                                    setHoveredCell({
                                      dateStr: day.dateStr,
                                      minutes: day.minutes,
                                      formattedDate: day.formattedDate,
                                    })
                                  }
                                  aria-label={`${day.formattedDate}: ${day.minutes} minutes`}
                                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-[3px] sm:rounded-[4px] transition-all duration-150 cursor-pointer ${
                                    isHovered
                                      ? 'ring-2 ring-[var(--accent)] scale-110 z-10'
                                      : ''
                                  } ${
                                    day.isFuture
                                      ? 'opacity-20 bg-[var(--surface-2)] border border-[var(--border)] cursor-default'
                                      : day.level === 0
                                      ? 'bg-[var(--surface-2)]/80 border border-[var(--border)]'
                                      : day.level === 1
                                      ? 'bg-[var(--accent)]/20 border border-[var(--accent)]/30'
                                      : day.level === 2
                                      ? 'bg-[var(--accent)]/45 border border-[var(--accent)]/55'
                                      : day.level === 3
                                      ? 'bg-[var(--accent)]/70 border border-[var(--accent)]/80'
                                      : 'bg-[var(--accent)] border border-[var(--accent)] shadow-[0_0_8px_var(--glow)]'
                                  }`}
                                />
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center justify-end gap-1.5 mt-3 pt-2 text-[10px] font-mono text-[var(--text-dim)] border-t border-[var(--border)]">
                <span>Less</span>
                <span className="w-2.5 h-2.5 rounded-[2px] bg-[var(--surface-2)] border border-[var(--border)]" />
                <span className="w-2.5 h-2.5 rounded-[2px] bg-[var(--accent)]/20 border border-[var(--accent)]/30" />
                <span className="w-2.5 h-2.5 rounded-[2px] bg-[var(--accent)]/45 border border-[var(--accent)]/55" />
                <span className="w-2.5 h-2.5 rounded-[2px] bg-[var(--accent)]/70 border border-[var(--accent)]/80" />
                <span className="w-2.5 h-2.5 rounded-[2px] bg-[var(--accent)] border border-[var(--accent)]" />
                <span>More</span>
              </div>
            </div>
          </div>

          {/* Free User Gated Lock Overlay */}
          {!isPremium && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4">
              <div className="p-5 sm:p-6 rounded-2xl bg-[var(--surface)]/95 border border-[var(--border)] shadow-2xl backdrop-blur-md flex flex-col items-center text-center max-w-sm">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] text-[11px] font-bold tracking-wider uppercase mb-3 border border-[var(--border)]">
                  <Lock className="w-3 h-3" />
                  <span>Sample</span>
                </div>
                <h4 className="text-sm font-bold text-[var(--text)] tracking-tight">
                  Unlock Study Insights
                </h4>
                <p className="text-xs text-[var(--text-dim)] mt-1 mb-4 leading-relaxed">
                  Discover your peak focus hours, best days of the week, and 12-week consistency heatmaps.
                </p>
                <button
                  type="button"
                  id="unlock-insights-premium-btn"
                  onClick={openPremiumModal}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--accent)] text-[var(--accent-contrast)] hover:opacity-90 active:scale-95 transition-all shadow-md inline-flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Unlock with Premium</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
