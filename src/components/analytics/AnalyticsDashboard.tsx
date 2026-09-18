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
} from '../../lib/utils';
import { SubjectDonutChart } from './SubjectDonutChart';
import { StudyBarChart } from './StudyBarChart';
import { StudyTimeline24h } from './StudyTimeline24h';
import { StudyHeatmap } from './StudyHeatmap';
import { SubjectBreakdownTable } from './SubjectBreakdownTable';
import { exportDataAsJSON, exportSessionsAsCSV } from '../../lib/exportData';
import {
  BarChart3,
  PieChart as PieIcon,
  Flame,
  Clock,
  Target,
  Award,
  Calendar,
  Layers,
  Sparkles,
  TrendingUp,
  Download,
  FileSpreadsheet,
  FileJson,
  ChevronDown,
} from 'lucide-react';

type Timeframe = 'day' | 'week' | 'month' | 'year';

export function AnalyticsDashboard() {
  const { user } = useAuth();
  const { sessions, subjects, todos, selectedDate, setSelectedDate, refetchSessions } = useStudy();
  const [showExportMenu, setShowExportMenu] = useState(false);

  const [timeframe, setTimeframe] = useState<Timeframe>('day');

  useEffect(() => {
    refetchSessions();
  }, [refetchSessions]);

  // Filter sessions based on timeframe using local browser timezone bounds
  const filteredSessions = useMemo(() => {
    const now = new Date();

    if (timeframe === 'day') {
      const targetDate = selectedDate || getLocalDateString();
      const startOfDay = getLocalStartOfDay(targetDate);
      const endOfDay = getLocalEndOfDay(targetDate);
      return sessions.filter(s => {
        const t = new Date(s.startTime).getTime();
        return t >= startOfDay.getTime() && t <= endOfDay.getTime();
      });
    } else if (timeframe === 'week') {
      // Past 7 local days (from 6 days ago startOfDay to today endOfDay)
      const startOfWeek = getLocalStartOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6));
      const endOfToday = getLocalEndOfDay(now);
      return sessions.filter(s => {
        const t = new Date(s.startTime).getTime();
        return t >= startOfWeek.getTime() && t <= endOfToday.getTime();
      });
    } else if (timeframe === 'month') {
      // Past 30 local days
      const startOfMonth = getLocalStartOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29));
      const endOfToday = getLocalEndOfDay(now);
      return sessions.filter(s => {
        const t = new Date(s.startTime).getTime();
        return t >= startOfMonth.getTime() && t <= endOfToday.getTime();
      });
    } else if (timeframe === 'year') {
      // Past 365 local days
      const startOfYear = getLocalStartOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 364));
      const endOfToday = getLocalEndOfDay(now);
      return sessions.filter(s => {
        const t = new Date(s.startTime).getTime();
        return t >= startOfYear.getTime() && t <= endOfToday.getTime();
      });
    }
    return sessions;
  }, [sessions, timeframe, selectedDate]);

  // Aggregate metrics
  const totalStudySeconds = filteredSessions.reduce((sum, s) => sum + s.durationSeconds, 0);
  const totalSessionsCount = filteredSessions.length;

  // Calculate daily average
  const daysInPeriod = timeframe === 'day' ? 1 : timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : 365;
  const dailyAverageSeconds = Math.round(totalStudySeconds / daysInPeriod);

  // Subject Breakdown calculation
  const subjectBreakdown = useMemo(() => {
    const map: Record<
      string,
      {
        name: string;
        seconds: number;
        color: string;
        sessionCount: number;
        targetMinutes: number;
      }
    > = {};

    // Initialize all subjects with 0
    subjects.forEach(sub => {
      map[sub.id] = {
        name: sub.name,
        seconds: 0,
        color: sub.color,
        sessionCount: 0,
        targetMinutes: sub.targetMinutesPerDay || 60,
      };
    });

    // Populate from sessions
    filteredSessions.forEach(s => {
      if (map[s.subjectId]) {
        map[s.subjectId].seconds += s.durationSeconds;
        map[s.subjectId].sessionCount += 1;
      } else {
        map[s.subjectId] = {
          name: s.subjectName || 'Other',
          seconds: s.durationSeconds,
          color: s.subjectColor || '#10B981',
          sessionCount: 1,
          targetMinutes: 60,
        };
      }
    });

    return Object.values(map).map(item => ({
      ...item,
      percentage:
        totalStudySeconds > 0
          ? Math.round((item.seconds / totalStudySeconds) * 100)
          : 0,
    })).sort((a, b) => b.seconds - a.seconds);
  }, [subjects, filteredSessions, totalStudySeconds]);

  // Bar chart trend data
  const trendData = useMemo(() => {
    const data = [];
    const now = new Date();

    if (timeframe === 'day') {
      // 4-hour intervals of the day
      const intervals = ['00-06h', '06-12h', '12-18h', '18-24h'];
      const hoursMap = [0, 0, 0, 0];

      filteredSessions.forEach(s => {
        const h = new Date(s.startTime).getHours();
        const idx = Math.min(3, Math.floor(h / 6));
        hoursMap[idx] += s.durationSeconds / 3600;
      });

      intervals.forEach((label, i) => {
        data.push({
          label,
          hours: parseFloat(hoursMap[i].toFixed(1)),
          goalHours: user.dailyGoalHours / 4,
        });
      });
    } else if (timeframe === 'week') {
      // Past 7 local calendar days
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const startD = getLocalStartOfDay(d);
        const endD = getLocalEndOfDay(d);
        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

        const sec = sessions
          .filter(s => {
            const t = new Date(s.startTime).getTime();
            return t >= startD.getTime() && t <= endD.getTime();
          })
          .reduce((sum, s) => sum + s.durationSeconds, 0);

        data.push({
          label: dayName,
          hours: parseFloat((sec / 3600).toFixed(1)),
          goalHours: user.dailyGoalHours,
        });
      }
    } else if (timeframe === 'month') {
      // 4 weeks of local days
      for (let w = 4; w >= 1; w--) {
        const startD = getLocalStartOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - w * 7 + 1));
        const endD = getLocalEndOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - (w - 1) * 7));

        const weekSec = sessions
          .filter(s => {
            const t = new Date(s.startTime).getTime();
            return t >= startD.getTime() && t <= endD.getTime();
          })
          .reduce((sum, s) => sum + s.durationSeconds, 0);

        data.push({
          label: `Wk ${5 - w}`,
          hours: parseFloat((weekSec / 3600).toFixed(1)),
          goalHours: user.dailyGoalHours * 7,
        });
      }
    } else if (timeframe === 'year') {
      // Past 12 local calendar months
      for (let m = 11; m >= 0; m--) {
        const firstOfMonth = new Date(now.getFullYear(), now.getMonth() - m, 1, 0, 0, 0, 0);
        const lastOfMonth = new Date(now.getFullYear(), now.getMonth() - m + 1, 0, 23, 59, 59, 999);
        const monthName = firstOfMonth.toLocaleDateString('en-US', { month: 'short' });

        const sec = sessions
          .filter(s => {
            const t = new Date(s.startTime).getTime();
            return t >= firstOfMonth.getTime() && t <= lastOfMonth.getTime();
          })
          .reduce((sum, s) => sum + s.durationSeconds, 0);

        data.push({
          label: monthName,
          hours: parseFloat((sec / 3600).toFixed(1)),
          goalHours: user.dailyGoalHours * 30,
        });
      }
    }

    return data;
  }, [timeframe, filteredSessions, sessions, user.dailyGoalHours]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Top Header & Timeframe Switcher */}
      <div className="rounded-3xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl p-4 sm:p-6 md:p-8 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>Study Analytics & Insights</span>
          </div>
          <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">
            Performance Breakdown
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Comprehensive study trends, subject distributions, and timeline tracking
          </p>
        </div>

        {/* Actions & Timeframe Switcher */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full md:w-auto">
          {/* Export Data Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-2xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700/80 text-white text-xs font-bold transition-all shadow-md"
              title="Export lifetime study sessions"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export Data</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showExportMenu && (
              <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-56 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-30 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 mb-1">
                  Lifetime Study Backup
                </div>
                <button
                  onClick={() => {
                    exportSessionsAsCSV(sessions, subjects);
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-2.5"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div>Export as CSV</div>
                    <div className="text-[10px] text-slate-400">Excel / Google Sheets format</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    exportDataAsJSON(user, subjects, sessions, todos);
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-2.5"
                >
                  <FileJson className="w-4 h-4 text-cyan-400" />
                  <div>
                    <div>Export as JSON</div>
                    <div className="text-[10px] text-slate-400">Full account & todos backup</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Day View Quick Selector: Today / Yesterday */}
          {timeframe === 'day' && (
            <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs">
              <button
                onClick={() => setSelectedDate(getLocalDateString(new Date(), 0))}
                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl font-bold transition-all cursor-pointer text-xs ${
                  selectedDate === getLocalDateString(new Date(), 0) || !selectedDate
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setSelectedDate(getLocalDateString(new Date(), -1))}
                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl font-bold transition-all cursor-pointer text-xs ${
                  selectedDate === getLocalDateString(new Date(), -1)
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Yesterday
              </button>
            </div>
          )}

          {/* Timeframe Pill Switcher */}
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-950/80 border border-slate-800 overflow-x-auto">
            {(['day', 'week', 'month', 'year'] as Timeframe[]).map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all ${
                  timeframe === tf
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4 Summary Cards - Vertical Stack on Mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Total Time */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>Total Study Time</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">
            {formatHoursAndMins(totalStudySeconds)}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>Active in {timeframe.toUpperCase()} view</span>
          </div>
        </div>

        {/* Daily Average */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>Daily Average</span>
            <Target className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">
            {formatHoursAndMins(dailyAverageSeconds)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Target: <span className="text-cyan-300 font-bold">{user.dailyGoalHours}h / day</span>
          </div>
        </div>

        {/* Consistency Streak */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>Study Streak</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
            {user.streakDays} Days 🔥
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Level {user.level} Focused Scholar</div>
        </div>

        {/* Sessions Completed */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>Completed Blocks</span>
            <Award className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">
            {totalSessionsCount} Blocks
          </div>
          <div className="text-[11px] text-purple-300 mt-1">
            Avg{' '}
            {totalSessionsCount > 0
              ? formatHoursAndMins(Math.round(totalStudySeconds / totalSessionsCount))
              : '0m'}{' '}
            / session
          </div>
        </div>
      </div>

      {/* Visual Charts Row: Donut Chart & Trend Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-start">
        {/* Subject Donut Chart */}
        <div className="p-4 sm:p-6 rounded-3xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-sm text-white">Subject Time Distribution (%)</h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">By Total Duration</span>
          </div>

          <SubjectDonutChart data={subjectBreakdown} />
        </div>

        {/* Study Bar Chart (Trends) */}
        <div className="p-4 sm:p-6 rounded-3xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              <h3 className="font-bold text-sm text-white">
                {timeframe === 'day'
                  ? 'Study Distribution by Time of Day'
                  : timeframe === 'week'
                  ? 'Daily Study Hours vs Goal'
                  : timeframe === 'month'
                  ? 'Weekly Progress'
                  : 'Monthly Consistency'}
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">In Hours</span>
          </div>

          <StudyBarChart data={trendData} />
        </div>
      </div>

      {/* 24-Hour Timeline Bar (Active in Day View or as Overview) */}
      <div className="p-4 sm:p-6 rounded-3xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl shadow-2xl">
        <StudyTimeline24h
          sessions={sessions}
          dateStr={selectedDate || getLocalDateString()}
        />
      </div>

      {/* Consistency Heatmap */}
      <div className="p-4 sm:p-6 rounded-3xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl shadow-2xl">
        <StudyHeatmap sessions={sessions} streakDays={user.streakDays} />
      </div>

      {/* Detailed Breakdown Table */}
      <div className="p-4 sm:p-6 rounded-3xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-sm text-white">Detailed Subject Breakdown Table</h3>
          </div>
          <span className="text-xs text-slate-400">
            {subjectBreakdown.length} Topics Tracked
          </span>
        </div>

        <SubjectBreakdownTable data={subjectBreakdown} totalSeconds={totalStudySeconds} />
      </div>
    </div>
  );
}
