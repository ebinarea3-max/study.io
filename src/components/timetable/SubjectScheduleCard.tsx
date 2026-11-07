'use client';

import React, { useState } from 'react';
import { TimetableItem } from '../../types/timetable';
import { useTimetable } from '../../context/TimetableContext';
import { formatHoursAndMins } from '../../lib/utils';
import {
  Play,
  CheckCircle2,
  Clock,
  MoreVertical,
  Edit2,
  Trash2,
  Check,
  RotateCcw,
} from 'lucide-react';

interface SubjectScheduleCardProps {
  item: TimetableItem;
  onEdit: (item: TimetableItem) => void;
}

export function SubjectScheduleCard({ item, onEdit }: SubjectScheduleCardProps) {
  const {
    getItemProgress,
    focusOnSubject,
    setSubjectCompleted,
    deleteItem,
  } = useTimetable();

  const [showMenu, setShowMenu] = useState(false);

  const progress = getItemProgress(item);
  const isComplete = progress.isCompleted;

  return (
    <div
      className={`relative overflow-hidden rounded-xl border p-3.5 sm:p-4 transition-all shadow-card ${
        isComplete
          ? 'bg-[var(--surface)] border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
          : 'bg-[var(--surface)] border-[var(--border)] hover:border-white/20'
      }`}
    >
      {/* Top Accent line colored by item.color */}
      <div
        className="absolute top-0 left-0 right-0 h-1 transition-all"
        style={{
          background: isComplete
            ? 'linear-gradient(90deg, #10B981, #059669)'
            : item.color || 'var(--accent)',
          boxShadow: isComplete ? '0 0 10px #10B981' : undefined,
        }}
      />

      <div className="flex flex-col gap-3">
        {/* Row 1: Header (Title, Target Badge, Logged Time, Menu) */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Color Dot / Check Icon */}
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                isComplete
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                  : 'border'
              }`}
              style={{
                backgroundColor: isComplete ? undefined : `${item.color}15`,
                borderColor: isComplete ? undefined : `${item.color}40`,
                color: isComplete ? undefined : item.color,
              }}
            >
              {isComplete ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <div
                  className="w-3.5 h-3.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-base sm:text-lg font-hud font-bold tracking-wider text-[var(--text)]">
                  {item.subjectName}
                </h4>
                {isComplete && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    COMPLETED
                  </span>
                )}
              </div>
              <div className="text-xs text-[var(--text-dim)] font-mono flex items-center gap-1.5 mt-0.5">
                <Clock className="w-3 h-3 text-[var(--text-dim)]" />
                <span>
                  Target:{' '}
                  <strong className="text-[var(--text)]">
                    {formatHoursAndMins(item.targetSeconds)}
                  </strong>
                </span>
                <span>•</span>
                <span className={isComplete ? 'text-emerald-400 font-bold' : 'text-[var(--accent)] font-semibold'}>
                  {formatHoursAndMins(progress.loggedSeconds)} / {formatHoursAndMins(item.targetSeconds)}
                </span>
                <span>•</span>
                <span className="font-bold">{progress.percent}%</span>
              </div>
            </div>
          </div>

          {/* Right Action Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu(prev => !prev)}
              className="p-1.5 text-[var(--text-dim)] hover:text-[var(--text)] rounded-lg hover:bg-white/[0.06] transition-colors cursor-pointer"
              title="More options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-8 z-50 w-44 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] shadow-2xl py-1 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onEdit(item);
                    }}
                    className="w-full px-3 py-2 text-left text-xs font-mono text-[var(--text)] hover:bg-white/[0.08] flex items-center gap-2 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-blue-400" />
                    <span>Edit Schedule</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      setSubjectCompleted(item.id, !isComplete);
                    }}
                    className="w-full px-3 py-2 text-left text-xs font-mono text-[var(--text)] hover:bg-white/[0.08] flex items-center gap-2 cursor-pointer"
                  >
                    {isComplete ? (
                      <>
                        <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                        <span>Reset Today Progress</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Mark 100% Completed</span>
                      </>
                    )}
                  </button>
                  <div className="my-1 border-t border-[var(--border)]" />
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      deleteItem(item.id);
                    }}
                    className="w-full px-3 py-2 text-left text-xs font-mono text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Remove from Day</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Row 2: Live Progress Bar */}
        <div className="space-y-1.5">
          <div className="h-2.5 w-full rounded-full bg-[var(--surface-2)] overflow-hidden border border-[var(--border)] relative shadow-inner">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${progress.percent}%`,
                backgroundColor: isComplete ? '#10B981' : item.color || 'var(--accent)',
                boxShadow: isComplete
                  ? '0 0 12px rgba(16,185,129,0.8)'
                  : `0 0 10px ${item.color || 'var(--accent)'}`,
              }}
            />
          </div>
        </div>

        {/* Row 3: Action Controls */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/[0.06]">
          {/* Focus on This Button */}
          <button
            type="button"
            onClick={() => focusOnSubject(item)}
            className="px-3.5 py-1.5 rounded-lg bg-[var(--accent)] hover:opacity-95 text-[var(--accent-contrast)] font-hud-mono text-xs font-bold tracking-wider uppercase transition-all flex items-center gap-2 cursor-pointer shadow-[0_0_12px_var(--glow)] hover:scale-[1.02] active:scale-95"
            title="Switch to Timer with this subject selected"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Focus on This</span>
          </button>

          {/* Clean Right Status */}
          <div className="flex items-center gap-1.5 font-mono text-xs">
            {isComplete ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Completed</span>
              </span>
            ) : (
              <span className="text-[var(--text-dim)]">
                {progress.percent}% logged
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

