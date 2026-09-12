'use client';

import React from 'react';
import { StudySession } from '../../types';
import { formatHoursAndMins, getLocalDateString } from '../../lib/utils';
import { Flame, Calendar, Sparkles } from 'lucide-react';

interface StudyHeatmapProps {
  sessions: StudySession[];
  streakDays: number;
}

export function StudyHeatmap({ sessions, streakDays }: StudyHeatmapProps) {
  // Generate past 84 days (12 weeks of 7 days)
  const totalDays = 84;
  const now = new Date();
  const days = [];

  // Group session seconds by local calendar date YYYY-MM-DD
  const secondsByDate: Record<string, number> = {};
  sessions.forEach(s => {
    if (s.startTime) {
      const localDate = new Date(s.startTime);
      const dateKey = getLocalDateString(localDate);
      secondsByDate[dateKey] = (secondsByDate[dateKey] || 0) + s.durationSeconds;
    }
  });

  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const dateStr = getLocalDateString(d);
    const totalSec = secondsByDate[dateStr] || 0;
    const hours = totalSec / 3600;

    days.push({
      date: dateStr,
      dayOfWeek: d.getDay(),
      seconds: totalSec,
      hours,
    });
  }

  const getColorClass = (hours: number) => {
    if (hours === 0) return 'bg-slate-900 border-slate-800';
    if (hours < 2) return 'bg-emerald-950 border-emerald-900 text-emerald-300';
    if (hours < 4) return 'bg-emerald-800 border-emerald-700 text-emerald-200';
    if (hours < 6) return 'bg-emerald-600 border-emerald-500 text-slate-950';
    return 'bg-emerald-400 border-emerald-300 shadow-sm shadow-emerald-400/30';
  };

  const activeDaysCount = Object.keys(secondsByDate).filter(k => secondsByDate[k] > 0).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-400" />
          <h4 className="text-sm font-bold text-white">Study Consistency Heatmap (12 Weeks)</h4>
        </div>
        <div className="flex items-center gap-2 text-xs text-amber-400 font-bold">
          <Flame className="w-3.5 h-3.5 fill-amber-400" />
          <span>{streakDays} Days Consistent</span>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 overflow-x-auto">
        <div className="min-w-[500px]">
          <div className="grid grid-flow-col grid-rows-7 gap-1.5 justify-start">
            {days.map(d => (
              <div
                key={d.date}
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-sm border transition-all cursor-pointer relative group ${getColorClass(
                  d.hours
                )}`}
              >
                {/* Tooltip */}
                <div className="hidden group-hover:block absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 text-[10px] text-white p-2 rounded-xl shadow-2xl z-30 whitespace-nowrap pointer-events-none">
                  <div className="font-bold">{d.date}</div>
                  <div className="text-emerald-400 font-mono">
                    {d.seconds > 0 ? formatHoursAndMins(d.seconds) : 'No study logged'}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-4 pt-3 border-t border-slate-900">
            <span>{activeDaysCount} Active Days in Period</span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Less</span>
              <span className="w-3 h-3 rounded-sm bg-slate-900 border border-slate-800" />
              <span className="w-3 h-3 rounded-sm bg-emerald-950 border border-emerald-900" />
              <span className="w-3 h-3 rounded-sm bg-emerald-800 border border-emerald-700" />
              <span className="w-3 h-3 rounded-sm bg-emerald-600 border border-emerald-500" />
              <span className="w-3 h-3 rounded-sm bg-emerald-400 border border-emerald-300 shadow-sm" />
              <span className="text-slate-500">More (6h+)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
