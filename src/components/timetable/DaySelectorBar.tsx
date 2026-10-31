'use client';

import React from 'react';
import { useTimetable } from '../../context/TimetableContext';
import { DAYS_OF_WEEK, DayOfWeek, getTodayDayOfWeek } from '../../types/timetable';
import { formatHoursAndMins } from '../../lib/utils';
import { Plus, Copy, Calendar, Sparkles, Moon } from 'lucide-react';

interface DaySelectorBarProps {
  onAddSubject: () => void;
  onOpenCopyModal: () => void;
}

export function DaySelectorBar({ onAddSubject, onOpenCopyModal }: DaySelectorBarProps) {
  const { selectedDay, setSelectedDay, items, getDaySummary } = useTimetable();
  const todayKey = getTodayDayOfWeek();

  const selectedDaySummary = getDaySummary(selectedDay);

  return (
    <div className="space-y-4">
      {/* 7-Day Pill Tabs */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none">
        {DAYS_OF_WEEK.map(dayCfg => {
          const isSelected = selectedDay === dayCfg.key;
          const isToday = todayKey === dayCfg.key;
          const summary = getDaySummary(dayCfg.key);

          return (
            <button
              key={dayCfg.key}
              type="button"
              onClick={() => setSelectedDay(dayCfg.key)}
              className={`flex-1 min-w-[70px] sm:min-w-[88px] py-2.5 px-2 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer relative ${
                isSelected
                  ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-[0_0_20px_var(--glow)] font-bold'
                  : 'bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--text-dim)] hover:text-[var(--text)] border border-[var(--border)]'
              }`}
            >
              {/* Today Marker */}
              {isToday && (
                <span
                  className={`text-[9px] font-mono uppercase font-black tracking-widest px-1 rounded-sm mb-0.5 ${
                    isSelected ? 'bg-black/30 text-white' : 'bg-amber-500/20 text-amber-400'
                  }`}
                >
                  TODAY
                </span>
              )}

              {/* Day Label */}
              <span className="text-xs sm:text-sm font-hud font-bold tracking-wider uppercase">
                {dayCfg.short}
              </span>

              {/* Summary Subtext */}
              <span
                className={`text-[10px] font-mono mt-0.5 ${
                  isSelected
                    ? 'opacity-90'
                    : summary.isRestDay
                    ? 'text-neutral-500'
                    : 'text-[var(--text-dim)]'
                }`}
              >
                {summary.isRestDay ? (
                  <span className="flex items-center gap-0.5">
                    <Moon className="w-2.5 h-2.5 inline" /> Rest
                  </span>
                ) : (
                  `${summary.itemCount} ${summary.itemCount === 1 ? 'sub' : 'subs'}`
                )}
              </span>

              {/* Completion Dot */}
              {!summary.isRestDay && summary.isCompleted && (
                <span
                  className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full ${
                    isSelected ? 'bg-white' : 'bg-emerald-400 shadow-[0_0_6px_#10B981]'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Day Info & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)] shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-hud font-bold tracking-wider uppercase text-[var(--text)] flex items-center gap-2">
              <span>
                {DAYS_OF_WEEK.find(d => d.key === selectedDay)?.label} Schedule
              </span>
              {selectedDay === todayKey && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black font-mono bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  ACTIVE TODAY
                </span>
              )}
            </h4>
            <div className="text-xs text-[var(--text-dim)] font-mono flex items-center gap-2 mt-0.5">
              {selectedDaySummary.isRestDay ? (
                <span className="text-neutral-400 flex items-center gap-1">
                  <Moon className="w-3 h-3 text-neutral-400" /> Rest Day · No scheduled targets
                </span>
              ) : (
                <>
                  <span>
                    Total Planned:{' '}
                    <strong className="text-[var(--text)] font-semibold">
                      {formatHoursAndMins(selectedDaySummary.totalTargetSeconds)}
                    </strong>
                  </span>
                  <span>•</span>
                  <span>
                    Logged:{' '}
                    <strong
                      className={
                        selectedDaySummary.isCompleted ? 'text-emerald-400' : 'text-[var(--accent)]'
                      }
                    >
                      {formatHoursAndMins(selectedDaySummary.totalLoggedSeconds)}
                    </strong>{' '}
                    ({selectedDaySummary.percent}%)
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Copy Schedule */}
          <button
            type="button"
            onClick={onOpenCopyModal}
            className="px-3 py-1.5 rounded-lg bg-[var(--surface-2)] hover:bg-white/[0.08] text-[var(--text-dim)] hover:text-[var(--text)] border border-[var(--border)] font-hud-mono text-xs font-semibold tracking-wider uppercase transition-all flex items-center gap-1.5 cursor-pointer shadow-sm hover:scale-[1.02] active:scale-95"
            title="Copy this day's routine to other days of the week"
          >
            <Copy className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Copy Routine</span>
            <span className="sm:hidden">Copy</span>
          </button>

          {/* Add Subject */}
          <button
            type="button"
            onClick={onAddSubject}
            className="px-3 py-1.5 rounded-lg bg-[var(--accent)] hover:opacity-90 text-[var(--accent-contrast)] font-hud-mono text-xs font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_var(--glow)] hover:scale-[1.02] active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Subject</span>
          </button>
        </div>
      </div>
    </div>
  );
}
