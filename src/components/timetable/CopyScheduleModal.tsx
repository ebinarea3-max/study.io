'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { DayOfWeek, DAYS_OF_WEEK } from '../../types/timetable';
import { useTimetable } from '../../context/TimetableContext';
import { X, Copy, CheckSquare, Square, ArrowRight } from 'lucide-react';

interface CopyScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  fromDay: DayOfWeek;
}

export function CopyScheduleModal({ isOpen, onClose, fromDay }: CopyScheduleModalProps) {
  const { copyDaySchedule, items } = useTimetable();
  const [mounted, setMounted] = useState(false);
  const [selectedTargets, setSelectedTargets] = useState<DayOfWeek[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Default to weekdays other than fromDay
    if (isOpen) {
      const weekdays: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri'];
      setSelectedTargets(weekdays.filter(d => d !== fromDay));
    }
  }, [isOpen, fromDay]);

  const sourceDayLabel = DAYS_OF_WEEK.find(d => d.key === fromDay)?.label || fromDay;
  const sourceItemsCount = items.filter(it => it.dayOfWeek === fromDay).length;

  const toggleDay = (day: DayOfWeek) => {
    if (selectedTargets.includes(day)) {
      setSelectedTargets(selectedTargets.filter(d => d !== day));
    } else {
      setSelectedTargets([...selectedTargets, day]);
    }
  };

  const selectAllWeekdays = () => {
    const weekdays: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri'];
    setSelectedTargets(weekdays.filter(d => d !== fromDay));
  };

  const selectAllDays = () => {
    setSelectedTargets(DAYS_OF_WEEK.map(d => d.key).filter(d => d !== fromDay));
  };

  const handleCopy = async () => {
    if (selectedTargets.length === 0) return;
    await copyDaySchedule(fromDay, selectedTargets);
    onClose();
  };

  if (!isOpen || !mounted || typeof document === 'undefined') return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 p-5 sm:p-6 space-y-5"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/15 border border-[var(--accent)]/30 text-[var(--accent)] flex items-center justify-center">
              <Copy className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-hud font-bold tracking-wider uppercase text-[var(--text)]">
                Copy Schedule
              </h3>
              <p className="text-xs text-[var(--text-dim)] font-mono">
                Duplicate {sourceDayLabel}'s {sourceItemsCount} {sourceItemsCount === 1 ? 'subject' : 'subjects'} to other days
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-white/[0.08] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Selection Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={selectAllWeekdays}
            className="px-2.5 py-1 rounded-lg bg-[var(--surface-2)] hover:bg-white/[0.08] border border-[var(--border)] text-xs font-mono text-[var(--text-dim)] hover:text-[var(--text)] transition-colors cursor-pointer"
          >
            All Weekdays
          </button>
          <button
            type="button"
            onClick={selectAllDays}
            className="px-2.5 py-1 rounded-lg bg-[var(--surface-2)] hover:bg-white/[0.08] border border-[var(--border)] text-xs font-mono text-[var(--text-dim)] hover:text-[var(--text)] transition-colors cursor-pointer"
          >
            All 7 Days
          </button>
          <button
            type="button"
            onClick={() => setSelectedTargets([])}
            className="px-2.5 py-1 rounded-lg bg-[var(--surface-2)] hover:bg-white/[0.08] border border-[var(--border)] text-xs font-mono text-[var(--text-dim)] hover:text-[var(--text)] transition-colors cursor-pointer"
          >
            Clear
          </button>
        </div>

        {/* Days Checkbox Grid */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-dim)]">
            Select Destination Days:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {DAYS_OF_WEEK.map(d => {
              const isSource = d.key === fromDay;
              const isChecked = selectedTargets.includes(d.key);

              return (
                <button
                  key={d.key}
                  type="button"
                  disabled={isSource}
                  onClick={() => toggleDay(d.key)}
                  className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-mono transition-all text-left ${
                    isSource
                      ? 'opacity-40 bg-[var(--surface-2)] border-dashed border-[var(--border)] cursor-not-allowed'
                      : isChecked
                      ? 'bg-[var(--accent)]/15 border-[var(--accent)]/50 text-[var(--text)] shadow-sm'
                      : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-dim)] hover:text-[var(--text)] cursor-pointer'
                  }`}
                >
                  <span className="font-semibold">
                    {d.label} {isSource && '(Source)'}
                  </span>
                  {!isSource && (
                    <span>
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-[var(--accent)]" />
                      ) : (
                        <Square className="w-4 h-4 opacity-40" />
                      )}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Notice */}
        <p className="text-[11px] font-mono text-amber-400/80 bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5">
          ⚠️ Note: Copying will replace any existing scheduled subjects on the selected destination days.
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[var(--surface-2)] hover:bg-white/[0.08] text-[var(--text-dim)] hover:text-[var(--text)] font-hud-mono text-xs font-semibold tracking-wider uppercase transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={selectedTargets.length === 0}
            onClick={handleCopy}
            className="px-5 py-2 rounded-xl bg-[var(--accent)] hover:opacity-90 disabled:opacity-40 text-[var(--accent-contrast)] font-hud-mono text-xs font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_var(--glow)]"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Apply to {selectedTargets.length} {selectedTargets.length === 1 ? 'Day' : 'Days'}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
