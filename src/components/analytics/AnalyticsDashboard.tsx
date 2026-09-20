'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useStudy } from '../../context/StudyContext';
import { useAuth } from '../../context/AuthContext';
import {
  formatHoursAndMins,
  formatSeconds,
  getLocalStartOfDay,
  getLocalEndOfDay,
  getLocalDateString,
  parseLocalDateString,
} from '../../lib/utils';
import { exportDataAsJSON, exportSessionsAsCSV } from '../../lib/exportData';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Target,
  Award,
  Flame,
  Sparkles,
  Download,
  BarChart3,
  TrendingUp,
  FileSpreadsheet,
  FileJson,
  ChevronDown,
  Play,
  Layers,
} from 'lucide-react';

type ViewMode = 'day' | 'week' | 'month' | 'year';

type CalendarDayCell =
  | {
      isPadding: true;
      dayNumber: number;
      dateKey: string;
    }
  | {
      isPadding: false;
      dayNumber: number;
      dateKey: string;
      stats: { totalSeconds: number; sessionCount: number };
      intensity: number;
      hours: number;
      isSelectedDay: boolean;
      isToday: boolean;
      inActiveWeek: boolean;
      inActiveMonth: boolean;
    };

interface AnalyticsDashboardProps {
  onStartSession?: () => void;
}

export function AnalyticsDashboard({ onStartSession }: AnalyticsDashboardProps) {
  const { user } = useAuth();
  const { sessions, subjects, todos, selectedDate, setSelectedDate, refetchSessions } = useStudy();

  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Active inspected day (YYYY-MM-DD)
  const todayStr = getLocalDateString();
  const [activeDate, setActiveDate] = useState<string>(selectedDate || todayStr);

  // Calendar month state (first day of displayed month)
  const [displayedMonth, setDisplayedMonth] = useState<Date>(() => {
    const d = selectedDate ? parseLocalDateString(selectedDate) : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  // Calendar day tooltip hover/tap state
  const [hoveredDay, setHoveredDay] = useState<{
    dateStr: string;
    totalSeconds: number;
    count: number;
    topSubject?: string;
  } | null>(null);

  // Active hourly block tooltip in timeline
  const [activeHourTooltip, setActiveHourTooltip] = useState<string | null>(null);

  useEffect(() => {
    refetchSessions();
  }, [refetchSessions]);

  // Keep activeDate in sync if external selectedDate changes
  useEffect(() => {
    if (selectedDate && selectedDate !== activeDate) {
      setActiveDate(selectedDate);
      const d = parseLocalDateString(selectedDate);
      setDisplayedMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    }
  }, [selectedDate]);

  // Map of date string (YYYY-MM-DD) -> { totalSeconds, sessionCount, sessions }
  const sessionsByDateMap = useMemo(() => {
    const map: Record<
      string,
      { totalSeconds: number; sessionCount: number; topSubjectMap: Record<string, number> }
    > = {};

    sessions.forEach(s => {
      const dateKey = getLocalDateString(new Date(s.startTime));
      if (!map[dateKey]) {
        map[dateKey] = { totalSeconds: 0, sessionCount: 0, topSubjectMap: {} };
      }
      map[dateKey].totalSeconds += s.durationSeconds;
      map[dateKey].sessionCount += 1;

      const subName = s.subjectName || 'General';
      map[dateKey].topSubjectMap[subName] =
        (map[dateKey].topSubjectMap[subName] || 0) + s.durationSeconds;
    });

    return map;
  }, [sessions]);

  // Month navigation handlers
  const handlePrevMonth = () => {
    setDisplayedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setDisplayedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleJumpToToday = () => {
    const now = new Date();
    setDisplayedMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    setActiveDate(todayStr);
    setSelectedDate(todayStr);
  };

  // Week range computation for activeDate (Monday through Sunday)
  const weekRange = useMemo(() => {
    const d = parseLocalDateString(activeDate);
    const dayOfWeek = d.getDay(); // 0 is Sun, 1 is Mon
    // Offset to Monday
    const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() + diffToMon);
    const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);

    return {
      start: getLocalStartOfDay(monday),
      end: getLocalEndOfDay(sunday),
      startStr: getLocalDateString(monday),
      endStr: getLocalDateString(sunday),
    };
  }, [activeDate]);

  // Month range computation for displayedMonth
  const monthRange = useMemo(() => {
    const year = displayedMonth.getFullYear();
    const month = displayedMonth.getMonth();
    const start = new Date(year, month, 1, 0, 0, 0, 0);
    const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
    return {
      start,
      end,
      daysInMonth: end.getDate(),
    };
  }, [displayedMonth]);

  // Filter sessions based on current viewMode & active inspection window
  const activeSessions = useMemo(() => {
    if (viewMode === 'day') {
      const startOfDay = getLocalStartOfDay(activeDate);
      const endOfDay = getLocalEndOfDay(activeDate);
      return sessions.filter(s => {
        const t = new Date(s.startTime).getTime();
        return t >= startOfDay.getTime() && t <= endOfDay.getTime();
      });
    }

    if (viewMode === 'week') {
      return sessions.filter(s => {
        const t = new Date(s.startTime).getTime();
        return t >= weekRange.start.getTime() && t <= weekRange.end.getTime();
      });
    }

    if (viewMode === 'month') {
      return sessions.filter(s => {
        const t = new Date(s.startTime).getTime();
        return t >= monthRange.start.getTime() && t <= monthRange.end.getTime();
      });
    }

    if (viewMode === 'year') {
      const activeYear = displayedMonth.getFullYear();
      const startOfYear = new Date(activeYear, 0, 1, 0, 0, 0, 0);
      const endOfYear = new Date(activeYear, 11, 31, 23, 59, 59, 999);
      return sessions.filter(s => {
        const t = new Date(s.startTime).getTime();
        return t >= startOfYear.getTime() && t <= endOfYear.getTime();
      });
    }

    return [];
  }, [sessions, viewMode, activeDate, weekRange, monthRange, displayedMonth]);

  // Aggregates for the active window
  const periodTotalSeconds = useMemo(() => {
    return activeSessions.reduce((sum, s) => sum + s.durationSeconds, 0);
  }, [activeSessions]);

  const periodSessionCount = activeSessions.length;

  // Subject breakdown for active window
  const subjectBreakdown = useMemo(() => {
    const map: Record<
      string,
      {
        name: string;
        seconds: number;
        color: string;
        sessionCount: number;
      }
    > = {};

    subjects.forEach(sub => {
      map[sub.id] = {
        name: sub.name,
        seconds: 0,
        color: sub.color,
        sessionCount: 0,
      };
    });

    activeSessions.forEach(s => {
      if (map[s.subjectId]) {
        map[s.subjectId].seconds += s.durationSeconds;
        map[s.subjectId].sessionCount += 1;
      } else {
        map[s.subjectId] = {
          name: s.subjectName || 'Other',
          seconds: s.durationSeconds,
          color: s.subjectColor || '#10B981',
          sessionCount: 1,
        };
      }
    });

    const activeList = Object.values(map)
      .filter(item => item.seconds > 0)
      .map(item => ({
        ...item,
        percentage:
          periodTotalSeconds > 0
            ? Math.round((item.seconds / periodTotalSeconds) * 100)
            : 0,
      }))
      .sort((a, b) => b.seconds - a.seconds);

    return activeList;
  }, [subjects, activeSessions, periodTotalSeconds]);

  // Top subject
  const topSubject = subjectBreakdown.length > 0 ? subjectBreakdown[0] : null;

  // Goal calculation for active window
  const goalStats = useMemo(() => {
    const dailyTargetSec = (user.dailyGoalHours || 4) * 3600;
    let targetSec = dailyTargetSec;
    let goalLabel = `${user.dailyGoalHours || 4}h goal`;

    if (viewMode === 'week') {
      targetSec = dailyTargetSec * 7;
      goalLabel = `${(user.dailyGoalHours || 4) * 7}h week goal`;
    } else if (viewMode === 'month') {
      targetSec = dailyTargetSec * monthRange.daysInMonth;
      goalLabel = `${(user.dailyGoalHours || 4) * monthRange.daysInMonth}h month goal`;
    } else if (viewMode === 'year') {
      targetSec = dailyTargetSec * 365;
      goalLabel = `${(user.dailyGoalHours || 4) * 365}h year goal`;
    }

    const percentage = targetSec > 0 ? Math.round((periodTotalSeconds / targetSec) * 100) : 0;
    return {
      percentage,
      goalLabel,
    };
  }, [user.dailyGoalHours, viewMode, monthRange.daysInMonth, periodTotalSeconds]);

  // Selected period header title
  const activePeriodTitle = useMemo(() => {
    if (viewMode === 'day') {
      const d = parseLocalDateString(activeDate);
      const isToday = activeDate === todayStr;
      const dateFormatted = d.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      return isToday ? `Today (${dateFormatted})` : dateFormatted;
    }

    if (viewMode === 'week') {
      const mon = parseLocalDateString(weekRange.startStr);
      const sun = parseLocalDateString(weekRange.endStr);
      return `Week of ${mon.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })} – ${sun.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })}`;
    }

    if (viewMode === 'month') {
      return `Month of ${displayedMonth.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })}`;
    }

    if (viewMode === 'year') {
      return `Year ${displayedMonth.getFullYear()}`;
    }

    return '';
  }, [viewMode, activeDate, todayStr, weekRange, displayedMonth]);

  // Calendar Grid Cells Computation
  const calendarDays = useMemo(() => {
    const year = displayedMonth.getFullYear();
    const month = displayedMonth.getMonth();

    // Days in this month
    const totalDays = new Date(year, month + 1, 0).getDate();

    // Day of week of 1st day (0 = Sun, 1 = Mon ... 6 = Sat)
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    // Monday-first offset: Mon=0, Tue=1, ... Sun=6
    const leadBlankCount = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

    const days: CalendarDayCell[] = [];

    // Blank cells before month start
    for (let i = 0; i < leadBlankCount; i++) {
      days.push({ isPadding: true, dayNumber: 0, dateKey: `pad-${i}` });
    }

    // Actual month days
    for (let d = 1; d <= totalDays; d++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const stats = sessionsByDateMap[dateKey] || { totalSeconds: 0, sessionCount: 0 };
      const hours = stats.totalSeconds / 3600;

      // Intensity level: 0 (none), 1 (<1h), 2 (1-3h), 3 (3-5h), 4 (>5h)
      let intensity = 0;
      if (hours > 0 && hours < 1) intensity = 1;
      else if (hours >= 1 && hours < 3) intensity = 2;
      else if (hours >= 3 && hours < 5) intensity = 3;
      else if (hours >= 5) intensity = 4;

      // Highlight logic
      const isSelectedDay = dateKey === activeDate;
      const isToday = dateKey === todayStr;
      const inActiveWeek =
        viewMode === 'week' &&
        dateKey >= weekRange.startStr &&
        dateKey <= weekRange.endStr;
      const inActiveMonth = viewMode === 'month';

      days.push({
        isPadding: false,
        dayNumber: d,
        dateKey,
        stats,
        intensity,
        hours,
        isSelectedDay,
        isToday,
        inActiveWeek,
        inActiveMonth,
      });
    }

    return days;
  }, [
    displayedMonth,
    sessionsByDateMap,
    activeDate,
    todayStr,
    viewMode,
    weekRange.startStr,
    weekRange.endStr,
  ]);

  // Hourly distribution computation for timeline (0 to 23 hours)
  const hourlyData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      label: `${String(i).padStart(2, '0')}:00`,
      seconds: 0,
      sessions: [] as typeof activeSessions,
    }));

    activeSessions.forEach(s => {
      const start = new Date(s.startTime);
      const h = start.getHours();
      if (h >= 0 && h < 24) {
        hours[h].seconds += s.durationSeconds;
        hours[h].sessions.push(s);
      }
    });

    const maxSeconds = Math.max(...hours.map(h => h.seconds), 1);

    return hours.map(h => ({
      ...h,
      hoursFormatted: (h.seconds / 3600).toFixed(1),
      intensityPct: Math.min(100, Math.round((h.seconds / maxSeconds) * 100)),
    }));
  }, [activeSessions]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-5 sm:space-y-6">
      {/* 1. Top Hub Header & View Switcher */}
      <div className="rounded-3xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl p-4 sm:p-6 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">
            <CalendarIcon className="w-4 h-4" />
            <span>Activity & Performance Hub</span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
            Study Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Interactive calendar matrix, focus duration density, and hourly study patterns
          </p>
        </div>

        {/* View Mode Switcher + Export Menu */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
          {/* View Switch: [ Day | Week | Month | Year ] */}
          <div className="flex items-center p-1 rounded-2xl bg-slate-950/90 border border-slate-800 shadow-inner">
            {(['day', 'week', 'month', 'year'] as ViewMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all duration-200 cursor-pointer ${
                  viewMode === mode
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20 scale-[1.02]'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Export Data Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-2xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700/80 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
              title="Backup lifetime sessions"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Export</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-1.5 z-40 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800/80 mb-1">
                  Backup Sessions
                </div>
                <button
                  onClick={() => {
                    exportSessionsAsCSV(sessions, subjects);
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>Export as CSV</span>
                </button>
                <button
                  onClick={() => {
                    exportDataAsJSON(user, subjects, sessions, todos);
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <FileJson className="w-4 h-4 text-cyan-400" />
                  <span>Export as JSON</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Interactive Unified Calendar Section */}
      <div className="rounded-3xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl p-4 sm:p-6 shadow-2xl space-y-4">
        {/* Calendar Navigation Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevMonth}
              aria-label="Previous month"
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight min-w-[150px] sm:min-w-[180px] text-center">
              {displayedMonth.toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
              })}
            </h2>
            <button
              onClick={handleNextMonth}
              aria-label="Next month"
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Today Quick-Jump */}
            <button
              onClick={handleJumpToToday}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                activeDate === todayStr
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                  : 'bg-slate-800/80 hover:bg-slate-750 border-slate-700/60 text-slate-300 hover:text-white'
              }`}
            >
              Today
            </button>

            {/* Density Legend */}
            <div className="hidden md:flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-950/60 px-2.5 py-1.5 rounded-xl border border-slate-800/80">
              <span className="text-[10px] uppercase font-bold text-slate-500 mr-1">Intensity:</span>
              <span className="w-2 h-2 rounded-full bg-slate-800 border border-slate-700" title="0 hours" />
              <span className="w-2 h-2 rounded-full bg-emerald-500/30" title="< 1 hour" />
              <span className="w-2 h-2 rounded-full bg-emerald-500/70" title="1h - 3h" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" title="3h - 5h" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-emerald-300 shadow-[0_0_8px_rgba(52,211,153,1)]" title="5h+ Peak" />
            </div>
          </div>
        </div>

        {/* Calendar Weekday Column Headers */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
            <div key={day} className={idx >= 5 ? 'text-slate-500' : 'text-slate-400'}>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Month Grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {calendarDays.map((cell) => {
            if (cell.isPadding) {
              return (
                <div
                  key={cell.dateKey}
                  className="aspect-square rounded-xl bg-slate-950/20 border border-transparent opacity-10 pointer-events-none"
                />
              );
            }

            const {
              dateKey,
              dayNumber,
              stats,
              intensity,
              hours,
              isSelectedDay,
              isToday,
              inActiveWeek,
              inActiveMonth,
            } = cell;

            // Background & Border styling
            let cellBg = 'bg-slate-950/60 border-slate-800/80 text-slate-300';
            let dotEl = null;

            if (intensity === 1) {
              cellBg = 'bg-emerald-950/20 border-emerald-900/40 text-emerald-300';
              dotEl = <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/60" />;
            } else if (intensity === 2) {
              cellBg = 'bg-emerald-950/30 border-emerald-800/50 text-emerald-200';
              dotEl = (
                <div className="flex gap-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </div>
              );
            } else if (intensity === 3) {
              cellBg = 'bg-emerald-900/30 border-emerald-600/50 text-emerald-100 shadow-[inset_0_0_12px_rgba(16,185,129,0.15)]';
              dotEl = (
                <div className="flex gap-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.8)]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.8)]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.8)]" />
                </div>
              );
            } else if (intensity === 4) {
              cellBg = 'bg-emerald-800/40 border-emerald-500/70 text-white shadow-[0_0_12px_rgba(16,185,129,0.25)]';
              dotEl = (
                <span className="px-1 py-0.2 rounded-full bg-emerald-400 text-slate-950 text-[9px] font-black shadow-[0_0_8px_rgba(52,211,153,0.9)]">
                  {hours >= 10 ? `${Math.round(hours)}h` : `${hours.toFixed(1)}h`}
                </span>
              );
            }

            // In Week Highlight
            if (inActiveWeek) {
              cellBg += ' ring-1 ring-emerald-500/30 bg-emerald-950/25';
            }

            // In Month Highlight
            if (inActiveMonth && viewMode === 'month') {
              cellBg += ' ring-0.5 ring-emerald-500/20';
            }

            // Active Day Highlight (prominent emerald border & glow)
            if (isSelectedDay) {
              cellBg += ' !ring-2 !ring-emerald-400 !border-emerald-400 !shadow-[0_0_16px_rgba(16,185,129,0.5)] !z-10 scale-[1.02]';
            }

            return (
              <div
                key={dateKey}
                onClick={() => {
                  setActiveDate(dateKey);
                  setSelectedDate(dateKey);
                }}
                onMouseEnter={() =>
                  setHoveredDay({
                    dateStr: dateKey,
                    totalSeconds: stats.totalSeconds,
                    count: stats.sessionCount,
                  })
                }
                onMouseLeave={() => setHoveredDay(null)}
                className={`relative aspect-square rounded-xl border p-1 sm:p-1.5 flex flex-col justify-between transition-all duration-150 cursor-pointer hover:border-emerald-400/80 hover:scale-[1.04] ${cellBg}`}
              >
                {/* Top Row: Day Number & Today indicator */}
                <div className="flex items-center justify-between w-full leading-none">
                  <span
                    className={`text-[11px] sm:text-xs font-bold ${
                      isToday
                        ? 'text-cyan-300 font-extrabold flex items-center gap-0.5'
                        : isSelectedDay
                        ? 'text-emerald-300 font-extrabold'
                        : ''
                    }`}
                  >
                    {dayNumber}
                    {isToday && (
                      <span className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse" />
                    )}
                  </span>

                  {/* Intensity dots (on desktop/tablet) */}
                  <div className="hidden sm:flex items-center">{dotEl}</div>
                </div>

                {/* Bottom Row: Micro dot on mobile or duration display */}
                <div className="flex items-center justify-center sm:justify-start w-full leading-none">
                  <div className="sm:hidden flex items-center justify-center">
                    {intensity > 0 && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          intensity === 4
                            ? 'bg-emerald-300 shadow-[0_0_6px_rgba(52,211,153,1)]'
                            : intensity >= 2
                            ? 'bg-emerald-400'
                            : 'bg-emerald-500/60'
                        }`}
                      />
                    )}
                  </div>
                  {hours > 0 && (
                    <span className="hidden sm:inline text-[9px] font-mono font-semibold text-slate-400 truncate">
                      {formatHoursAndMins(stats.totalSeconds)}
                    </span>
                  )}
                </div>

                {/* Day Tooltip (on hover or tap) */}
                {hoveredDay && hoveredDay.dateStr === dateKey && (
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-50 pointer-events-none bg-slate-900/95 border border-slate-700/80 px-2.5 py-1.5 rounded-xl shadow-2xl text-[11px] whitespace-nowrap animate-in fade-in zoom-in-95 duration-100">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <span>{parseLocalDateString(dateKey).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}:</span>
                      <span className="text-emerald-400 font-mono">
                        {stats.totalSeconds > 0 ? formatHoursAndMins(stats.totalSeconds) : 'No study logged'}
                      </span>
                    </div>
                    {stats.sessionCount > 0 && (
                      <div className="text-[10px] text-slate-400">
                        {stats.sessionCount} session{stats.sessionCount !== 1 ? 's' : ''} completed
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Selected Period Overview Bar */}
      <div className="rounded-3xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl p-4 sm:p-5 shadow-2xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-800/80 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Selected Window:
            </span>
            <span className="text-sm font-extrabold text-white">
              {activePeriodTitle}
            </span>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Inspection Mode: <strong className="text-emerald-400 uppercase">{viewMode}</strong>
          </span>
        </div>

        {/* 4 Compact Stat Pills */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          {/* Pill 1: Total Focus Time */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Focus Time
              </div>
              <div className="text-lg sm:text-xl font-black text-white font-mono truncate">
                {formatHoursAndMins(periodTotalSeconds)}
              </div>
            </div>
          </div>

          {/* Pill 2: Sessions Completed */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
              <Award className="w-5 h-5 text-purple-400" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Sessions
              </div>
              <div className="text-lg sm:text-xl font-black text-white font-mono truncate">
                {periodSessionCount} {periodSessionCount === 1 ? 'block' : 'blocks'}
              </div>
            </div>
          </div>

          {/* Pill 3: Goal Progress */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
              <Target className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Goal Progress
              </div>
              <div className="text-lg sm:text-xl font-black text-cyan-300 font-mono truncate">
                {goalStats.percentage}%
              </div>
              <div className="text-[9px] text-slate-400 truncate">
                of {goalStats.goalLabel}
              </div>
            </div>
          </div>

          {/* Pill 4: Top Subject */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 shadow-sm flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border"
              style={{
                backgroundColor: topSubject ? `${topSubject.color}20` : '#10B98115',
                borderColor: topSubject ? `${topSubject.color}40` : '#10B98130',
              }}
            >
              <Sparkles
                className="w-5 h-5"
                style={{ color: topSubject ? topSubject.color : '#10B981' }}
              />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Top Subject
              </div>
              <div className="text-sm sm:text-base font-bold text-white truncate">
                {topSubject ? topSubject.name : 'None'}
              </div>
              {topSubject && (
                <div className="text-[9px] text-slate-400 font-mono">
                  {formatHoursAndMins(topSubject.seconds)} ({topSubject.percentage}%)
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Visual Breakdowns (Below Calendar): Subject Breakdown & Daily Hourly Timeline */}
      {periodSessionCount === 0 ? (
        /* Motivating Empty State */
        <div className="rounded-3xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl p-8 sm:p-12 shadow-2xl text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_24px_rgba(16,185,129,0.2)]">
            <Clock className="w-8 h-8 text-emerald-400" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-lg sm:text-xl font-extrabold text-white">
              No focus sessions logged on this {viewMode}
            </h3>
            <p className="text-xs sm:text-sm text-slate-400">
              Consistency builds greatness. Launch a timer session right now to maintain your study streak and earn Scholar rank XP!
            </p>
          </div>
          {onStartSession && (
            <button
              onClick={onStartSession}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 transition-all transform active:scale-95 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>Start Focus Session</span>
            </button>
          )}
        </div>
      ) : (
        /* Breakdown Cards Grid */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-start">
          {/* Left Card: Subject Breakdown */}
          <div className="p-4 sm:p-6 rounded-3xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm text-white">Subject Breakdown</h3>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                {subjectBreakdown.length} Subject{subjectBreakdown.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Subject List with Progress Bars */}
            <div className="space-y-3.5">
              {subjectBreakdown.map(item => (
                <div key={item.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-bold text-white truncate">{item.name}</span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        ({item.sessionCount} {item.sessionCount === 1 ? 'block' : 'blocks'})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-mono font-bold text-emerald-400">
                        {formatHoursAndMins(item.seconds)}
                      </span>
                      <span className="px-1.5 py-0.5 rounded-md bg-slate-800 text-[10px] font-bold text-slate-300">
                        {item.percentage}%
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Progress Bar */}
                  <div className="h-2 w-full rounded-full bg-slate-950/80 overflow-hidden border border-slate-800/80">
                    <div
                      className="h-full rounded-full transition-all duration-500 shadow-sm"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Card: Daily Hourly Timeline */}
          <div className="p-4 sm:p-6 rounded-3xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-sm text-white">Daily Hourly Timeline</h3>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                24-Hour Active Distribution
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Hours of the day when focus sessions occurred during this selection:
            </p>

            {/* 24-Hour Vertical Bar Chart / Slots Grid */}
            <div className="pt-2">
              <div className="h-44 w-full flex items-end gap-1 sm:gap-1.5 pb-2 border-b border-slate-800">
                {hourlyData.map(h => {
                  const hasActivity = h.seconds > 0;
                  const isHovered = activeHourTooltip === h.label;

                  return (
                    <div
                      key={h.hour}
                      onMouseEnter={() => setActiveHourTooltip(h.label)}
                      onMouseLeave={() => setActiveHourTooltip(null)}
                      className="flex-1 flex flex-col items-center justify-end h-full relative group cursor-pointer"
                    >
                      {/* Tooltip on Hover */}
                      {isHovered && (
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-30 pointer-events-none bg-slate-900 border border-slate-700 px-2 py-1 rounded-lg text-[10px] whitespace-nowrap shadow-xl">
                          <span className="text-white font-bold">{h.label}</span>:{' '}
                          <span className="text-cyan-400 font-mono">
                            {hasActivity ? formatHoursAndMins(h.seconds) : '0m'}
                          </span>
                        </div>
                      )}

                      {/* Bar fill */}
                      <div
                        className={`w-full rounded-t-sm transition-all duration-300 ${
                          hasActivity
                            ? 'bg-gradient-to-t from-cyan-600 to-emerald-400 group-hover:brightness-125 shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                            : 'bg-slate-800/40 group-hover:bg-slate-750'
                        }`}
                        style={{
                          height: hasActivity ? `${Math.max(12, h.intensityPct)}%` : '4px',
                        }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Hour X-Axis Labels */}
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1.5 px-0.5">
                <span>00:00</span>
                <span>06:00</span>
                <span>12:00</span>
                <span>18:00</span>
                <span>23:00</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
