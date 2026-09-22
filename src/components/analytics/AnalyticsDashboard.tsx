'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useStudy } from '../../context/StudyContext';
import { useAuth } from '../../context/AuthContext';
import { Subject } from '../../types';
import { Skeleton } from '../common/Skeleton';
import {
  formatHoursAndMins,
  getLocalStartOfDay,
  getLocalEndOfDay,
  getLocalDateString,
  parseLocalDateString,
} from '../../lib/utils';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  PieChart as PieIcon,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { useRankTheme } from '../../hooks/useRankTheme';

type Timeframe = 'daily' | 'weekly' | 'monthly' | 'yearly';

interface AnalyticsDashboardProps {
  onStartSession?: () => void;
}

export function AnalyticsDashboard({ onStartSession }: AnalyticsDashboardProps) {
  const { user, isLoading } = useAuth();
  const { sessions, subjects, selectedDate, setSelectedDate, refetchSessions, hasHydrated, isLoadingSessions } = useStudy();
  const { theme } = useRankTheme();

  const todayStr = getLocalDateString();

  // -------------------------------------------------------------
  // 1. Distribution Card State
  // -------------------------------------------------------------
  const [distTimeframe, setDistTimeframe] = useState<Timeframe>('daily');
  const [distAnchorDate, setDistAnchorDate] = useState<string>(selectedDate || todayStr);

  // -------------------------------------------------------------
  // 2. Focus Time Goal Calendar State
  // -------------------------------------------------------------
  const [calMonth, setCalMonth] = useState<Date>(() => {
    const d = selectedDate ? parseLocalDateString(selectedDate) : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [calSelectedDate, setCalSelectedDate] = useState<string>(selectedDate || todayStr);
  const [hoveredCalDay, setHoveredCalDay] = useState<{
    dateStr: string;
    totalSeconds: number;
  } | null>(null);

  // -------------------------------------------------------------
  // 3. Bottom Trend Chart State
  // -------------------------------------------------------------
  const [focusChartTimeframe, setFocusChartTimeframe] = useState<Timeframe>('daily');
  const [focusChartAnchorDate, setFocusChartAnchorDate] = useState<string>(todayStr);

  useEffect(() => {
    refetchSessions();
  }, [refetchSessions, user?.id]);

  // Keep calendar selection synced with external selectedDate
  useEffect(() => {
    if (selectedDate && selectedDate !== calSelectedDate) {
      setCalSelectedDate(selectedDate);
      setDistAnchorDate(selectedDate);
      const d = parseLocalDateString(selectedDate);
      setCalMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    }
  }, [selectedDate, calSelectedDate]);

  // Daily target seconds from user profile (default 3 hours)
  const dailyGoalHours = user.dailyGoalHours || 3;
  const dailyGoalSeconds = dailyGoalHours * 3600;

  // -------------------------------------------------------------
  // Helper: Precalculate date-keyed map for sessions
  // -------------------------------------------------------------
  const sessionsByDateMap = useMemo(() => {
    const map: Record<string, { totalSeconds: number; count: number; sessions: typeof sessions }> = {};
    sessions.forEach(s => {
      const rawName = ((s as any).subject_name || s.subjectName || (s as any).subject?.name || (s as any).subject || '').trim().toLowerCase();
      const duration = Number(s.durationSeconds ?? (s as any).duration_seconds ?? (s as any).duration ?? (s as any).seconds ?? 0);
      if (rawName === 'unassigned' || duration <= 0) {
        return;
      }
      const sessionDateStr = s.startTime || (s as any).started_at || s.createdAt || (s as any).created_at;
      if (!sessionDateStr) return;
      const dateKey = getLocalDateString(new Date(sessionDateStr));
      if (!map[dateKey]) {
        map[dateKey] = { totalSeconds: 0, count: 0, sessions: [] };
      }
      map[dateKey].totalSeconds += duration;
      map[dateKey].count += 1;
      map[dateKey].sessions.push(s);
    });
    return map;
  }, [sessions]);

  // -------------------------------------------------------------
  // Top Row: 3 Focus Time Metrics
  // -------------------------------------------------------------
  const topMetrics = useMemo(() => {
    const now = new Date();
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Current Week Bounds (Monday - Sunday)
    const dayOfWeek = now.getDay();
    const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const currentWeekMon = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMon);
    const currentWeekSun = new Date(currentWeekMon.getFullYear(), currentWeekMon.getMonth(), currentWeekMon.getDate() + 6);
    const weekMonStr = getLocalDateString(currentWeekMon);
    const weekSunStr = getLocalDateString(currentWeekSun);

    const validSessions = sessions.filter(s => {
      const rawName = ((s as any).subject_name || s.subjectName || (s as any).subject?.name || (s as any).subject || '').trim().toLowerCase();
      const duration = Number(s.durationSeconds ?? (s as any).duration_seconds ?? (s as any).duration ?? (s as any).seconds ?? 0);
      const sessionDateStr = s.startTime || (s as any).started_at || s.createdAt || (s as any).created_at;
      return rawName && rawName !== 'unassigned' && duration > 0 && Boolean(sessionDateStr);
    });

    // 1. Focus Time of This Month
    const thisMonthFocusSec = validSessions
      .filter(s => {
        const sessionDateStr = s.startTime || (s as any).started_at || s.createdAt || (s as any).created_at;
        const dStr = getLocalDateString(new Date(sessionDateStr));
        return dStr.startsWith(currentMonthPrefix);
      })
      .reduce((sum, s) => sum + Number(s.durationSeconds ?? (s as any).duration_seconds ?? 0), 0);

    // 2. Focus Time of This Week
    const thisWeekFocusSec = validSessions
      .filter(s => {
        const sessionDateStr = s.startTime || (s as any).started_at || s.createdAt || (s as any).created_at;
        const dStr = getLocalDateString(new Date(sessionDateStr));
        return dStr >= weekMonStr && dStr <= weekSunStr;
      })
      .reduce((sum, s) => sum + Number(s.durationSeconds ?? (s as any).duration_seconds ?? 0), 0);

    // 3. Focus Time of Today
    const todayLocalDate = new Date().toLocaleDateString();
    const todayFocusSec = validSessions
      .filter(s => {
        const sessionDate = s.startTime || (s as any).started_at || s.createdAt || (s as any).created_at;
        if (!sessionDate) return false;
        const d = new Date(sessionDate);
        return d.toLocaleDateString() === todayLocalDate || getLocalDateString(d) === todayStr;
      })
      .reduce((sum, s) => sum + Number(s.durationSeconds ?? (s as any).duration_seconds ?? 0), 0);

    return {
      thisMonthFocusSec,
      thisWeekFocusSec,
      todayFocusSec,
    };
  }, [sessions, todayStr]);

  // -------------------------------------------------------------
  // Distribution Card: Range Calculation & Data Filtering
  // -------------------------------------------------------------
  const distRange = useMemo(() => {
    const anchor = parseLocalDateString(distAnchorDate);

    if (distTimeframe === 'daily') {
      return {
        label: anchor.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        isToday: distAnchorDate === todayStr,
        start: getLocalStartOfDay(anchor),
        end: getLocalEndOfDay(anchor),
      };
    }

    if (distTimeframe === 'weekly') {
      const dayOfWeek = anchor.getDay();
      const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const mon = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + diffToMon);
      const sun = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + 6);
      const label = `${mon.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${sun.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      return {
        label,
        isToday: false,
        start: getLocalStartOfDay(mon),
        end: getLocalEndOfDay(sun),
      };
    }

    if (distTimeframe === 'monthly') {
      const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1, 0, 0, 0, 0);
      const end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0, 23, 59, 59, 999);
      const label = anchor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      return {
        label,
        isToday: false,
        start,
        end,
      };
    }

    // Yearly
    const start = new Date(anchor.getFullYear(), 0, 1, 0, 0, 0, 0);
    const end = new Date(anchor.getFullYear(), 11, 31, 23, 59, 59, 999);
    const label = `${anchor.getFullYear()}`;
    return {
      label,
      isToday: false,
      start,
      end,
    };
  }, [distTimeframe, distAnchorDate, todayStr]);

  // Distribution Sessions & Subject Breakdown
  const distSessions = useMemo(() => {
    const startTime = distRange.start.getTime();
    const endTime = distRange.end.getTime();
    const anchorDate = parseLocalDateString(distAnchorDate);
    const anchorLocalDate = anchorDate.toLocaleDateString();

    return sessions.filter(s => {
      // Exclude stray unassigned/dummy test sessions so donut chart resets cleanly
      const rawName = ((s as any).subject_name || s.subjectName || (s as any).subject?.name || (s as any).subject || '').trim().toLowerCase();
      const duration = Number(s.durationSeconds ?? (s as any).duration_seconds ?? (s as any).duration ?? (s as any).seconds ?? 0);
      if (rawName === 'unassigned' || duration <= 0) {
        return false;
      }
      const sessionDateStr = s.startTime || (s as any).started_at || s.createdAt || (s as any).created_at;
      if (!sessionDateStr) return false;
      const d = new Date(sessionDateStr);
      const t = d.getTime();

      if (distTimeframe === 'daily') {
        return d.toLocaleDateString() === anchorLocalDate || getLocalDateString(d) === distAnchorDate || (t >= startTime && t <= endTime);
      }

      return t >= startTime && t <= endTime;
    });
  }, [sessions, distRange, distTimeframe, distAnchorDate]);

  const distTotalSeconds = useMemo(() => {
    return distSessions.reduce((sum, s) => sum + Number(s.durationSeconds ?? (s as any).duration_seconds ?? 0), 0);
  }, [distSessions]);

  const distSubjectBreakdown = useMemo(() => {
    // If total focus time today is 0 or only empty sessions exist, show clean empty state ("No focus records logged for this range")
    if (distTotalSeconds <= 0 || distSessions.length === 0) {
      return [];
    }

    const map: Record<string, {
      name: string;
      subject_id: string;
      subject_name: string;
      subject_color?: string;
      seconds: number;
      color: string;
      sessionCount: number;
    }> = {};

    // Get subjects list with local storage fallback if state hasn't populated yet
    const subjectList: Subject[] = (() => {
      const list = Array.isArray(subjects) ? subjects : [];
      if (list.length > 0) return list;
      if (typeof window !== 'undefined') {
        try {
          const uid = user?.id || 'guest';
          const stored =
            localStorage.getItem(`study_io_subjects_${uid}`) ||
            localStorage.getItem('study_io_subjects_guest') ||
            localStorage.getItem('studypulse_subjects');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) return parsed;
          }
        } catch {}
      }
      return [];
    })();

    // Aggregate each session strictly by session.subject_name / subject_id
    distSessions.forEach(s => {
      const sessionSubjectName = ((s as any).subject_name || s.subjectName || (s as any).subject?.name || (s as any).subject || '').trim();
      const sessionSubjectId = (s.subjectId || (s as any).subject_id || '').trim();

      if (sessionSubjectName.toLowerCase() === 'unassigned') {
        return;
      }
      if (!sessionSubjectName && !sessionSubjectId) {
        return;
      }

      // Dynamic subject color lookup: Map each session to current active color from user's subjects list
      const matchedSubject = subjectList.find(
        (sub) =>
          sub && (
            (sessionSubjectId && sub.id === sessionSubjectId) ||
            (sessionSubjectName && sub.name && sub.name.trim().toLowerCase() === sessionSubjectName.toLowerCase())
          )
      );

      const subjectLabel = matchedSubject?.name || sessionSubjectName || 'General Focus';
      const rawSessionColor = (s.subjectColor && s.subjectColor !== '#5A6B6A' ? s.subjectColor : null) || (s as any).subject_color;
      const displayColor = matchedSubject?.color || rawSessionColor || '#10b981';

      const groupKey = (matchedSubject?.id || subjectLabel).toLowerCase();

      if (map[groupKey]) {
        map[groupKey].seconds += s.durationSeconds;
        map[groupKey].sessionCount += 1;
        if (matchedSubject?.name) {
          map[groupKey].name = matchedSubject.name;
        }
        if (matchedSubject?.id) {
          map[groupKey].subject_id = matchedSubject.id;
        }
        // Active subject color takes precedence
        map[groupKey].color = displayColor;
      } else {
        map[groupKey] = {
          name: matchedSubject?.name || subjectLabel,
          subject_id: matchedSubject?.id || sessionSubjectId,
          subject_name: matchedSubject?.name || sessionSubjectName,
          subject_color: rawSessionColor,
          seconds: s.durationSeconds,
          color: displayColor,
          sessionCount: 1,
        };
      }
    });

    // Map each grouped subject to its current active color from user's subjects list
    return Object.values(map)
      .filter(item => item.seconds > 0)
      .map(item => {
        const matchedSubject = subjectList.find(
          (s) =>
            s && (
              (item.subject_id && s.id === item.subject_id) ||
              (s.name && s.name.trim().toLowerCase() === (item.subject_name || item.name || '').trim().toLowerCase())
            )
        );
        const displayColor = matchedSubject?.color || item.subject_color || item.color || '#10b981';

        return {
          ...item,
          name: matchedSubject?.name || item.name,
          color: displayColor,
          percentage:
            distTotalSeconds > 0
              ? Math.round((item.seconds / distTotalSeconds) * 100)
              : 0,
        };
      })
      .sort((a, b) => b.seconds - a.seconds);
  }, [distSessions, distTotalSeconds, subjects, user?.id]);

  // Distribution Stepper Navigation Handlers
  const handleDistStep = (direction: 'prev' | 'next') => {
    const delta = direction === 'prev' ? -1 : 1;
    const current = parseLocalDateString(distAnchorDate);

    if (distTimeframe === 'daily') {
      current.setDate(current.getDate() + delta);
    } else if (distTimeframe === 'weekly') {
      current.setDate(current.getDate() + delta * 7);
    } else if (distTimeframe === 'monthly') {
      current.setMonth(current.getMonth() + delta);
    } else if (distTimeframe === 'yearly') {
      current.setFullYear(current.getFullYear() + delta);
    }

    const nextStr = getLocalDateString(current);
    setDistAnchorDate(nextStr);
    setSelectedDate(nextStr);
  };

  const handleDistJumpToday = () => {
    setDistAnchorDate(todayStr);
    setSelectedDate(todayStr);
  };

  // -------------------------------------------------------------
  // Calendar Card: Goal Days, Month Matrix, & Date Selection
  // -------------------------------------------------------------
  const calStats = useMemo(() => {
    const year = calMonth.getFullYear();
    const month = calMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let focusDays = 0;
    let completedGoalDays = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayData = sessionsByDateMap[dateKey];
      if (dayData && dayData.totalSeconds > 0) {
        focusDays += 1;
        if (dayData.totalSeconds >= dailyGoalSeconds) {
          completedGoalDays += 1;
        }
      }
    }

    const completionRate = focusDays > 0 ? Math.round((completedGoalDays / focusDays) * 100) : 0;

    return {
      focusDays,
      completedGoalDays,
      completionRate,
      daysInMonth,
    };
  }, [calMonth, sessionsByDateMap, dailyGoalSeconds]);

  // Calendar Day Cells
  const calDays = useMemo(() => {
    const year = calMonth.getFullYear();
    const month = calMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Monday first offset: Mon = 0, Sun = 6
    const firstDay = new Date(year, month, 1).getDay();
    const leadBlankCount = firstDay === 0 ? 6 : firstDay - 1;

    const cells: {
      isPadding: boolean;
      dayNumber: number;
      dateKey: string;
      totalSeconds: number;
      metGoal: boolean;
      hasActivity: boolean;
      isSelected: boolean;
      isToday: boolean;
    }[] = [];

    // Lead padding
    for (let i = 0; i < leadBlankCount; i++) {
      cells.push({
        isPadding: true,
        dayNumber: 0,
        dateKey: `pad-${i}`,
        totalSeconds: 0,
        metGoal: false,
        hasActivity: false,
        isSelected: false,
        isToday: false,
      });
    }

    // Actual month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const totalSeconds = sessionsByDateMap[dateKey]?.totalSeconds || 0;
      const metGoal = totalSeconds >= dailyGoalSeconds;
      const hasActivity = totalSeconds > 0;

      cells.push({
        isPadding: false,
        dayNumber: d,
        dateKey,
        totalSeconds,
        metGoal,
        hasActivity,
        isSelected: dateKey === calSelectedDate,
        isToday: dateKey === todayStr,
      });
    }

    return cells;
  }, [calMonth, sessionsByDateMap, dailyGoalSeconds, calSelectedDate, todayStr]);

  const handleCalSelectDay = (dateKey: string) => {
    setCalSelectedDate(dateKey);
    setDistAnchorDate(dateKey);
    setDistTimeframe('daily');
    setSelectedDate(dateKey);
  };

  const handleCalPrevMonth = () => {
    setCalMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleCalNextMonth = () => {
    setCalMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // -------------------------------------------------------------
  // Focus Time Chart (Bottom Left) Data Generation
  // -------------------------------------------------------------
  const focusChartData = useMemo(() => {
    const anchor = parseLocalDateString(focusChartAnchorDate);
    const data: { label: string; hours: number; rawSec: number; goalHours: number }[] = [];

    if (focusChartTimeframe === 'daily') {
      // 7 Days of the Week containing the anchor date
      const dayOfWeek = anchor.getDay();
      const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const mon = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + diffToMon);

      for (let i = 0; i < 7; i++) {
        const d = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + i);
        const dateKey = getLocalDateString(d);
        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
        const sec = sessionsByDateMap[dateKey]?.totalSeconds || 0;
        data.push({
          label: dayName,
          hours: parseFloat((sec / 3600).toFixed(1)),
          rawSec: sec,
          goalHours: dailyGoalHours,
        });
      }
    } else if (focusChartTimeframe === 'weekly') {
      // 5 Weeks leading up to the anchor month end
      const year = anchor.getFullYear();
      const month = anchor.getMonth();
      for (let w = 1; w <= 5; w++) {
        const startD = new Date(year, month, (w - 1) * 7 + 1);
        const endD = new Date(year, month, Math.min(new Date(year, month + 1, 0).getDate(), w * 7));
        const startStr = getLocalDateString(startD);
        const endStr = getLocalDateString(endD);

        let sec = 0;
        sessions.forEach(s => {
          const sessionDateStr = s.startTime || (s as any).started_at || s.createdAt || (s as any).created_at;
          if (!sessionDateStr) return;
          const dStr = getLocalDateString(new Date(sessionDateStr));
          const duration = Number(s.durationSeconds ?? (s as any).duration_seconds ?? 0);
          if (dStr >= startStr && dStr <= endStr) sec += duration;
        });

        data.push({
          label: `W${w}`,
          hours: parseFloat((sec / 3600).toFixed(1)),
          rawSec: sec,
          goalHours: dailyGoalHours * 7,
        });
      }
    } else if (focusChartTimeframe === 'monthly') {
      // 12 Months of the anchor year
      const year = anchor.getFullYear();
      for (let m = 0; m < 12; m++) {
        const mDate = new Date(year, m, 1);
        const monthShort = mDate.toLocaleDateString('en-US', { month: 'short' });
        let sec = 0;
        sessions.forEach(s => {
          const sessionDateStr = s.startTime || (s as any).started_at || s.createdAt || (s as any).created_at;
          if (!sessionDateStr) return;
          const d = new Date(sessionDateStr);
          const duration = Number(s.durationSeconds ?? (s as any).duration_seconds ?? 0);
          if (d.getFullYear() === year && d.getMonth() === m) {
            sec += duration;
          }
        });
        data.push({
          label: monthShort,
          hours: parseFloat((sec / 3600).toFixed(1)),
          rawSec: sec,
          goalHours: dailyGoalHours * 30,
        });
      }
    } else if (focusChartTimeframe === 'yearly') {
      // Past 5 Years
      const curYear = anchor.getFullYear();
      for (let y = curYear - 4; y <= curYear; y++) {
        let sec = 0;
        sessions.forEach(s => {
          const sessionDateStr = s.startTime || (s as any).started_at || s.createdAt || (s as any).created_at;
          if (!sessionDateStr) return;
          const d = new Date(sessionDateStr);
          const duration = Number(s.durationSeconds ?? (s as any).duration_seconds ?? 0);
          if (d.getFullYear() === y) {
            sec += duration;
          }
        });
        data.push({
          label: `${y}`,
          hours: parseFloat((sec / 3600).toFixed(1)),
          rawSec: sec,
          goalHours: dailyGoalHours * 365,
        });
      }
    }

    const maxSec = Math.max(...data.map(d => d.rawSec), 0);
    const avgSec = data.length > 0 ? Math.round(data.reduce((sum, d) => sum + d.rawSec, 0) / data.length) : 0;

    return {
      items: data,
      topFormatted: formatHoursAndMins(maxSec),
      avgFormatted: formatHoursAndMins(avgSec),
    };
  }, [focusChartAnchorDate, focusChartTimeframe, sessionsByDateMap, dailyGoalHours, sessions]);

  const handleFocusChartStep = (direction: 'prev' | 'next') => {
    const delta = direction === 'prev' ? -1 : 1;
    const current = parseLocalDateString(focusChartAnchorDate);
    if (focusChartTimeframe === 'daily') current.setDate(current.getDate() + delta * 7);
    else if (focusChartTimeframe === 'weekly' || focusChartTimeframe === 'monthly') current.setMonth(current.getMonth() + delta);
    else current.setFullYear(current.getFullYear() + delta);
    setFocusChartAnchorDate(getLocalDateString(current));
  };


  return (
    <div className="w-full space-y-5 sm:space-y-6 text-slate-100">
      {/* 1. Top Row — 3 Focus Time Metric Cards (Chronological Granularity: Today -> Week -> Month) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
        {/* Card 1 (Left): Focus Time of Today */}
        <div className="hud-surface hud-corner-frame border border-white/[0.08] rounded-2xl p-3.5 sm:p-4 relative flex flex-col justify-between overflow-hidden group">
          <div
            className="h-1 w-8 rounded-full mb-2.5 transition-all"
            style={{ backgroundColor: theme.accent, boxShadow: `0 0 10px ${theme.glow}` }}
          />
          <div className="font-hud-mono text-[10px] uppercase font-bold tracking-wider text-neutral-400 leading-tight">
            Focus Time // Today
          </div>
          <div className="font-hud font-bold text-2xl sm:text-3xl text-white tracking-wide mt-1 truncate tabular-nums">
            {(isLoading || isLoadingSessions) && !hasHydrated ? (
              <Skeleton className="h-7 w-24 my-0.5 bg-neutral-800" />
            ) : (
              formatHoursAndMins(topMetrics.todayFocusSec)
            )}
          </div>
        </div>

        {/* Card 2 (Center): Focus Time of This Week */}
        <div className="hud-surface hud-corner-frame border border-white/[0.08] rounded-2xl p-3.5 sm:p-4 relative flex flex-col justify-between overflow-hidden group">
          <div
            className="h-1 w-8 rounded-full mb-2.5 transition-all"
            style={{ backgroundColor: theme.accent, boxShadow: `0 0 10px ${theme.glow}` }}
          />
          <div className="font-hud-mono text-[10px] uppercase font-bold tracking-wider text-neutral-400 leading-tight">
            Focus Time // This Week
          </div>
          <div className="font-hud font-bold text-2xl sm:text-3xl text-white tracking-wide mt-1 truncate tabular-nums">
            {(isLoading || isLoadingSessions) && !hasHydrated ? (
              <Skeleton className="h-7 w-24 my-0.5 bg-neutral-800" />
            ) : (
              formatHoursAndMins(topMetrics.thisWeekFocusSec)
            )}
          </div>
        </div>

        {/* Card 3 (Right): Focus Time of This Month */}
        <div className="hud-surface hud-corner-frame border border-white/[0.08] rounded-2xl p-3.5 sm:p-4 relative flex flex-col justify-between overflow-hidden group">
          <div
            className="h-1 w-8 rounded-full mb-2.5 transition-all"
            style={{ backgroundColor: theme.accent, boxShadow: `0 0 10px ${theme.glow}` }}
          />
          <div className="font-hud-mono text-[10px] uppercase font-bold tracking-wider text-neutral-400 leading-tight">
            Focus Time // This Month
          </div>
          <div className="font-hud font-bold text-2xl sm:text-3xl text-white tracking-wide mt-1 truncate tabular-nums">
            {(isLoading || isLoadingSessions) && !hasHydrated ? (
              <Skeleton className="h-7 w-24 my-0.5 bg-neutral-800" />
            ) : (
              formatHoursAndMins(topMetrics.thisMonthFocusSec)
            )}
          </div>
        </div>
      </div>

      {/* 2. Middle Section — 2 Columns (Distribution & Calendar) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 items-stretch">
        {/* Left Card: Project / Subject Time Distribution (7 cols) */}
        <div className="md:col-span-7 hud-surface hud-corner-frame border border-white/[0.08] rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4 relative overflow-hidden">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <PieIcon className="w-4 h-4" style={{ color: theme.accent }} />
              <h2 className="font-hud-mono text-xs uppercase font-bold text-neutral-200 tracking-wider">
                Sector Time Allocation
              </h2>
            </div>

            {/* Timeframe Buttons & Navigation */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Stepper buttons */}
              <div className="flex items-center bg-black/60 border border-white/[0.08] rounded-xl p-0.5">
                <button
                  onClick={() => handleDistStep('prev')}
                  className="p-1 rounded-lg hover:bg-white/[0.08] text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  title="Previous period"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleDistJumpToday}
                  className="px-2 py-0.5 font-hud-mono text-[10px] font-bold text-neutral-300 hover:text-white transition-colors cursor-pointer tracking-wider"
                >
                  TODAY
                </button>
                <button
                  onClick={() => handleDistStep('next')}
                  className="p-1 rounded-lg hover:bg-white/[0.08] text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  title="Next period"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* [ Daily | Weekly | Monthly | Yearly ] */}
              <div className="flex items-center bg-black/60 border border-white/[0.08] rounded-xl p-0.5 text-[11px] font-bold">
                {(['daily', 'weekly', 'monthly', 'yearly'] as Timeframe[]).map(tf => (
                  <button
                    key={tf}
                    onClick={() => setDistTimeframe(tf)}
                    className={`px-2 sm:px-2.5 py-1 rounded-lg font-hud-mono uppercase text-[10px] tracking-wider transition-all cursor-pointer ${
                      distTimeframe === tf
                        ? 'text-slate-950 font-bold shadow-sm'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                    style={distTimeframe === tf ? { backgroundColor: theme.accent } : undefined}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Active Range Sub-bar */}
          <div className="flex items-center justify-between text-xs text-neutral-400 px-0.5">
            <span className="font-hud-mono text-xs text-neutral-300">{distRange.label}</span>
            <span className="font-hud-mono font-bold text-xs" style={{ color: theme.accent }}>
              TOTAL: {formatHoursAndMins(distTotalSeconds)}
            </span>
          </div>

          {/* Body: Donut Chart or Minimalist 3D Cube No Data State */}
          {distSubjectBreakdown.length === 0 ? (
            <div className="h-56 flex flex-col items-center justify-center text-center space-y-2">
              <svg
                className="w-14 h-14 mx-auto text-neutral-700 opacity-60"
                viewBox="0 0 64 64"
                fill="none"
              >
                <path
                  d="M32 8L52 19.5V42.5L32 54L12 42.5V19.5L32 8Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                <path
                  d="M32 8V31M52 19.5L32 31M12 19.5L32 31M32 31V54"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="font-hud-mono text-xs font-bold text-neutral-400 tracking-wider">TELEMETRY EMPTY</div>
              <p className="text-[11px] text-neutral-500 max-w-xs">
                No focus records logged for this temporal range.
              </p>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 min-h-56">
              {/* Donut Chart */}
              <div className="w-full sm:w-1/2 h-52 relative flex items-center justify-center">
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 pt-1">
                  <div className="font-hud font-bold text-white text-2xl tracking-tight">
                    {formatHoursAndMins(distTotalSeconds)}
                  </div>
                  <div className="font-hud-mono text-[10px] uppercase font-bold tracking-wider text-neutral-500">
                    Total
                  </div>
                </div>
                <ResponsiveContainer width="100%" height="100%" className="relative z-0">
                  <PieChart>
                    <Pie
                      data={distSubjectBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={3}
                      dataKey="seconds"
                    >
                      {distSubjectBreakdown.map((entry, index) => (
                        <Cell
                          key={`cell-${entry.name}-${entry.color}-${index}`}
                          fill={entry.color}
                          stroke="#14171D"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload;
                          return (
                            <div className="bg-[#0A0C10] border border-white/[0.1] p-2.5 rounded-xl shadow-2xl text-xs font-hud-mono">
                              <div className="flex items-center gap-1.5 font-bold text-white mb-0.5">
                                <span
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: item.color }}
                                />
                                <span>{item.name}</span>
                              </div>
                              <div className="font-bold" style={{ color: theme.accent }}>
                                {formatHoursAndMins(item.seconds)} ({item.percentage}%)
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Subject Breakdown Progress Bars List */}
              <div className="w-full sm:w-1/2 space-y-3.5 overflow-y-auto max-h-52 pr-1">
                {distSubjectBreakdown.map(sub => (
                  <div key={sub.name} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm"
                          style={{ backgroundColor: sub.color }}
                        />
                        <span className="font-bold text-white text-sm truncate">
                          {sub.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5 flex-shrink-0">
                        <span className="font-hud-mono text-white font-bold text-sm tabular-nums">
                          {formatHoursAndMins(sub.seconds)}
                        </span>
                        <span className="font-hud-mono text-xs text-neutral-400 font-bold tabular-nums">
                          {sub.percentage}%
                        </span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="h-2 w-full rounded-full bg-black/60 overflow-hidden border border-white/[0.05]">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${sub.percentage}%`,
                          backgroundColor: sub.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Card: Calendar (5 cols) */}
        <div className="md:col-span-5 hud-surface hud-corner-frame border border-white/[0.08] rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-3 relative overflow-hidden">
          {/* Header */}
          <div className="flex items-center pb-2.5 border-b border-white/[0.06]">
            <h2 className="font-hud-mono text-xs uppercase font-bold text-neutral-200 tracking-wider flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" style={{ color: theme.accent }} />
              <span>Target Discipline Matrix</span>
            </h2>
          </div>

          {/* Sub-stats bar */}
          <div className="grid grid-cols-3 gap-2 text-center bg-black/60 border border-white/[0.06] rounded-2xl p-3 sm:p-4 text-xs">
            <div>
              <div className="font-hud-mono text-neutral-500 uppercase text-[10px] sm:text-xs tracking-widest font-bold">Active Days</div>
              <div className="font-hud font-bold text-2xl sm:text-3xl text-white tabular-nums mt-1 sm:mt-1.5">
                {calStats.focusDays}
              </div>
            </div>
            <div className="border-x border-white/[0.06]">
              <div className="font-hud-mono text-neutral-500 uppercase text-[10px] sm:text-xs tracking-widest font-bold">Target Met</div>
              <div className="font-hud font-bold text-2xl sm:text-3xl tabular-nums mt-1 sm:mt-1.5" style={{ color: theme.accent }}>
                {calStats.completedGoalDays}
              </div>
            </div>
            <div>
              <div className="font-hud-mono text-neutral-500 uppercase text-[10px] sm:text-xs tracking-widest font-bold">Clearance Rate</div>
              <div className="font-hud font-bold text-2xl sm:text-3xl text-white tabular-nums mt-1 sm:mt-1.5">
                {calStats.completionRate}%
              </div>
            </div>
          </div>

          {/* Centered Month Stepper */}
          <div className="flex items-center justify-between px-1">
            <button
              onClick={handleCalPrevMonth}
              aria-label="Previous month"
              className="p-1.5 rounded-lg hover:bg-white/[0.08] text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-hud font-bold text-sm tracking-wider uppercase text-white">
              {calMonth.toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
              })}
            </span>
            <button
              onClick={handleCalNextMonth}
              aria-label="Next month"
              className="p-1.5 rounded-lg hover:bg-white/[0.08] text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Standard 7-Column Calendar Grid */}
          <div className="space-y-1.5">
            {/* Weekday Column Labels */}
            <div className="grid grid-cols-7 text-center font-hud-mono text-[10px] font-bold text-neutral-500">
              {['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'].map((d, i) => (
                <div key={d} className={i >= 5 ? 'text-neutral-600' : ''}>
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar Cells */}
            <div className="grid grid-cols-7 gap-1">
              {calDays.map(c => {
                if (c.isPadding) {
                  return (
                    <div
                      key={c.dateKey}
                      className="aspect-square rounded-lg opacity-10 pointer-events-none"
                    />
                  );
                }

                let cellClass =
                  'aspect-square rounded-xl flex flex-col items-center justify-center relative cursor-pointer text-sm sm:text-base font-hud-mono transition-all border ';

                let customStyle: React.CSSProperties = {};

                if (c.isSelected) {
                  cellClass += ' !ring-2 !ring-white !border-white bg-white/20 text-white font-bold scale-105 z-10 shadow-lg';
                } else if (c.metGoal) {
                  cellClass += ' font-bold';
                  customStyle = {
                    borderColor: `${theme.accent}80`,
                    backgroundColor: `${theme.accent}18`,
                    color: theme.accent,
                    boxShadow: `0 0 8px ${theme.glow}`,
                  };
                } else if (c.hasActivity) {
                  cellClass += ' border-neutral-700/80 bg-neutral-900/60 text-neutral-300 hover:border-neutral-500';
                } else {
                  cellClass += ' border-transparent text-neutral-600 hover:text-neutral-300 hover:bg-neutral-900/40';
                }

                return (
                  <div
                    key={c.dateKey}
                    onClick={() => handleCalSelectDay(c.dateKey)}
                    onMouseEnter={() =>
                      setHoveredCalDay({
                        dateStr: c.dateKey,
                        totalSeconds: c.totalSeconds,
                      })
                    }
                    onMouseLeave={() => setHoveredCalDay(null)}
                    className={cellClass}
                    style={customStyle}
                  >
                    <span
                      className={`leading-none ${
                        c.isToday ? 'font-bold underline decoration-white underline-offset-4' : ''
                      }`}
                    >
                      {c.dayNumber}
                    </span>

                    {/* Indicator: Under Goal shows a subtle orange pip */}
                    {c.hasActivity && !c.metGoal && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)] mt-1.5" />
                    )}

                    {/* Tooltip on hover */}
                    {hoveredCalDay && hoveredCalDay.dateStr === c.dateKey && (
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-50 pointer-events-none bg-[#0A0C10] border border-white/[0.1] px-2.5 py-1 rounded-lg text-[10px] font-hud-mono whitespace-nowrap shadow-2xl">
                        <span className="text-white font-bold">
                          {parseLocalDateString(c.dateKey).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        :{' '}
                        <span className="font-bold" style={{ color: theme.accent }}>
                          {c.totalSeconds > 0
                            ? formatHoursAndMins(c.totalSeconds)
                            : '0m'}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Section — Focus Time Chart (Full Width) */}
      <div className="w-full col-span-full hud-surface hud-corner-frame border border-white/[0.08] rounded-2xl p-4 sm:p-5 space-y-3 relative overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" style={{ color: theme.accent }} />
            <h3 className="font-hud-mono text-xs uppercase font-bold text-neutral-200 tracking-wider">Temporal Focus Spectrum</h3>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center bg-black/60 border border-white/[0.08] rounded-xl p-0.5">
              <button
                onClick={() => handleFocusChartStep('prev')}
                className="p-1 rounded-lg hover:bg-white/[0.08] text-neutral-400 hover:text-white transition-colors cursor-pointer"
                title="Previous period"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleFocusChartStep('next')}
                className="p-1 rounded-lg hover:bg-white/[0.08] text-neutral-400 hover:text-white transition-colors cursor-pointer"
                title="Next period"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center bg-black/60 border border-white/[0.08] rounded-xl p-0.5 text-[11px] font-bold">
              {(['daily', 'weekly', 'monthly', 'yearly'] as Timeframe[]).map(tf => (
                <button
                  key={tf}
                  onClick={() => setFocusChartTimeframe(tf)}
                  className={`px-2.5 py-0.5 rounded-lg font-hud-mono uppercase text-[10px] tracking-wider transition-all cursor-pointer ${
                    focusChartTimeframe === tf
                      ? 'text-slate-950 font-bold shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                  style={focusChartTimeframe === tf ? { backgroundColor: theme.accent } : undefined}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Top Stat Indicators */}
        <div className="flex items-center justify-between text-xs text-neutral-400 px-0.5 font-hud-mono">
          <div>
            PEAK : <span className="text-white font-bold">{focusChartData.topFormatted}</span>
          </div>
          <div>
            AVERAGE : <span className="font-bold" style={{ color: theme.accent }}>{focusChartData.avgFormatted}</span>
          </div>
        </div>

        {/* Vertical Bar Chart with Dashed Goal Reference Line */}
        <div className="w-full h-64 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={focusChartData.items}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              />
              <YAxis
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                tickFormatter={val => `${val}h`}
              />
              {focusChartData.items[0]?.goalHours && (
                <ReferenceLine
                  y={focusChartData.items[0].goalHours}
                  stroke={theme.accent}
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                />
              )}
              <RechartsTooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <div className="bg-[#0A0C10] border border-white/[0.1] p-2.5 rounded-xl shadow-2xl text-xs font-hud-mono">
                        <div className="font-bold text-white mb-0.5">{item.label}</div>
                        <div className="font-bold" style={{ color: theme.accent }}>
                          {formatHoursAndMins(item.rawSec)}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="hours" fill={theme.accent} radius={[4, 4, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
