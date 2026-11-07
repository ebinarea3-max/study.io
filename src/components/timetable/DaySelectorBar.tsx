'use client';

import React from 'react';
import { useTimetable } from '../../context/TimetableContext';
import { DAYS_OF_WEEK, DayOfWeek, getTodayDayOfWeek } from '../../types/timetable';
import { formatHoursAndMins } from '../../lib/utils';
import { Plus, Copy, Calendar, Moon } from 'lucide-react';

interface DaySelectorBarProps {
  onAddSubject: () => void;
  onOpenCopyModal: () => void;
}

export function DaySelectorBar({ onAddSubject, onOpenCopyModal }: DaySelectorBarProps) {
  const { selectedDay, setSelectedDay, items, getDaySummary } = useTimetable();
  const todayKey = getTodayDayOfWeek();

  const selectedDaySummary = getDaySummary(selectedDay);

  return (
    <div className="space-y-2.5">
      {/* 7-Day Compact Pill Tabs */}
      <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
        {DAYS_OF_WEEK.map(dayCfg => {
          const isSelected = selectedDay === dayCfg.key;
          const isToday = todayKey === dayCfg.key;
          const summary = getDaySummary(dayCfg.key);

          return (
            <button
              key={dayCfg.key}
              type="button"
              onClick={() => setSelectedDay(dayCfg.key)}
              className={`flex-1 min-w-[48px] sm:min-w-[60px] py-1.5 px-1 sm:px-2 rounded-lg flex flex-col items-center justify-center transition-all cursor-pointer relative ${
                isSelected
                  ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-[0_0_15px_var(--glow)] font-bold'
                  : 'bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--text-dim)] hover:text-[var(--text)] border border-[var(--border)]'
              }`}
            >
              {/* Today Marker */}
              {isToday && (
                <span
                  className={`text-[8px] font-mono uppercase font-black tracking-widest px-1 rounded-sm leading-none mb-0.5 ${
                    isSelected ? 'bg-black/30 text-white' : 'bg-amber-500/20 text-amber-400'
                  }`}
                >
                  TODAY
                </span>
              )}

              {/* Day Label */}
              <span className="text-xs font-hud font-bold tracking-wider uppercase leading-tight">
                {dayCfg.short}
              </span>

              {/* Summary Subtext */}
              <span
                className={`text-[9px] font-mono leading-tight mt-0.5 ${
                  isSelected
                    ? 'opacity-90'
                    : summary.isRestDay
                    ? 'text-neutral-500'
                    : 'text-[var(--text-dim)]'
                }`}
              >
                {summary.isRestDay ? (
                  <span className="flex items-center gap-0.5">
                    <Moon className="w-2 h-2 inline" /> Rest
                  </span>
                ) : (
                  `${summary.itemCount} ${summary.itemCount === 1 ? 'sub' : 'subs'}`
                )}
              </span>

              {/* Completion Dot */}
              {!summary.isRestDay && summary.isCompleted && (
                <span
                  className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${
                    isSelected ? 'bg-white' : 'bg-emerald-400 shadow-[0_0_6px_#10B981]'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Day Compact Info & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)] shrink-0">
            <Calendar className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-hud font-bold tracking-wider uppercase text-[var(--text)] truncate">
                {DAYS_OF_WEEK.find(d => d.key === selectedDay)?.label} Schedule
              </h4>
              {selectedDay === todayKey && (
                <span className="px-1.5 py-0.2 rounded text-[8px] font-black font-mono bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                  ACTIVE TODAY
                </span>
              )}
            </div>
            <div className="text-[11px] text-[var(--text-dim)] font-mono flex items-center gap-1.5 truncate">
              {selectedDaySummary.isRestDay ? (
                <span className="text-neutral-400 flex items-center gap-1">
                  <Moon className="w-2.5 h-2.5 text-neutral-400" /> Rest Day · No scheduled targets
                </span>
              ) : (
                <>
                  <span>
                    Planned:{' '}
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
        <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
          {/* Copy Schedule */}
          <button
            type="button"
            onClick={onOpenCopyModal}
            className="px-2.5 py-1 rounded-lg bg-[var(--surface-2)] hover:bg-white/[0.08] text-[var(--text-dim)] hover:text-[var(--text)] border border-[var(--border)] font-hud-mono text-[11px] font-semibold tracking-wider uppercase transition-all flex items-center gap-1 cursor-pointer shadow-sm hover:scale-[1.02] active:scale-95"
            title="Copy this day's routine to other days of the week"
          >
            <Copy className="w-3 h-3" />
            <span className="hidden sm:inline">Copy Routine</span>
            <span className="sm:hidden">Copy</span>
          </button>

          {/* Add Subject */}
          <button
            type="button"
            onClick={onAddSubject}
            className="px-3 py-1 rounded-lg bg-[var(--accent)] hover:opacity-90 text-[var(--accent-contrast)] font-hud-mono text-[11px] font-bold tracking-wider uppercase transition-all flex items-center gap-1 cursor-pointer shadow-[0_0_12px_var(--glow)] hover:scale-[1.02] active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Subject</span>
          </button>
        </div>
      </div>
    </div>
  );
}

