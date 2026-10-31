'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { TimetableItem, DayOfWeek, TIMETABLE_COLOR_PRESETS, DAYS_OF_WEEK } from '../../types/timetable';
import { useTimetable } from '../../context/TimetableContext';
import { useStudy } from '../../context/StudyContext';
import { X, Clock, Palette, BookOpen, Check } from 'lucide-react';

interface EditSubjectScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingItem?: TimetableItem | null;
  defaultDay: DayOfWeek;
}

export function EditSubjectScheduleModal({
  isOpen,
  onClose,
  editingItem,
  defaultDay,
}: EditSubjectScheduleModalProps) {
  const { subjects } = useStudy();
  const { addItem, updateItem } = useTimetable();

  const [mounted, setMounted] = useState(false);
  const [subjectName, setSubjectName] = useState('');
  const [targetHours, setTargetHours] = useState(1);
  const [targetMinutes, setTargetMinutes] = useState(30);
  const [selectedColor, setSelectedColor] = useState(TIMETABLE_COLOR_PRESETS[0]);
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>(defaultDay);
  const [matchedSubjectId, setMatchedSubjectId] = useState<string | undefined>(undefined);

  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (editingItem) {
      setSubjectName(editingItem.subjectName);
      const totalMins = Math.round(editingItem.targetSeconds / 60);
      setTargetHours(Math.floor(totalMins / 60));
      setTargetMinutes(totalMins % 60);
      setSelectedColor(editingItem.color || TIMETABLE_COLOR_PRESETS[0]);
      setDayOfWeek(editingItem.dayOfWeek);
      setMatchedSubjectId(editingItem.subjectId);
    } else {
      setSubjectName('');
      setTargetHours(1);
      setTargetMinutes(30);
      setSelectedColor(
        TIMETABLE_COLOR_PRESETS[Math.floor(Math.random() * TIMETABLE_COLOR_PRESETS.length)]
      );
      setDayOfWeek(defaultDay);
      setMatchedSubjectId(undefined);
    }
  }, [editingItem, defaultDay, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        nameInputRef.current?.focus({ preventScroll: true });
      }, 50);
    }
  }, [isOpen]);

  // Handle selecting an existing subject from study context
  const handleSelectExistingSubject = (subId: string) => {
    const found = subjects.find(s => s.id === subId);
    if (found) {
      setSubjectName(found.name);
      setMatchedSubjectId(found.id);
      if (found.color) setSelectedColor(found.color);
      const subMins = found.daily_goal_minutes || found.targetMinutesPerDay || 90;
      setTargetHours(Math.floor(subMins / 60));
      setTargetMinutes(subMins % 60);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = subjectName.trim();
    if (!trimmed) return;

    const targetSeconds = Math.max(300, targetHours * 3600 + targetMinutes * 60);

    if (editingItem) {
      await updateItem(editingItem.id, {
        subjectName: trimmed,
        subjectId: matchedSubjectId,
        targetSeconds,
        color: selectedColor,
        dayOfWeek,
      });
    } else {
      await addItem({
        dayOfWeek,
        subjectName: trimmed,
        subjectId: matchedSubjectId,
        targetSeconds,
        color: selectedColor,
      });
    }

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
        className="relative w-full max-w-lg rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 p-5 sm:p-6 space-y-5"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${selectedColor}20`, color: selectedColor }}
            >
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-hud font-bold tracking-wider uppercase text-[var(--text)]">
                {editingItem ? 'Edit Scheduled Subject' : 'Add Subject to Schedule'}
              </h3>
              <p className="text-xs text-[var(--text-dim)] font-mono">
                Set study target and color for {DAYS_OF_WEEK.find(d => d.key === dayOfWeek)?.label}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quick Select from existing subjects */}
          {subjects.length > 0 && !editingItem && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-dim)]">
                Quick-Pick from Your Subjects:
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto scrollbar-none py-1">
                {subjects.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelectExistingSubject(s.id)}
                    className="px-2.5 py-1 rounded-lg bg-[var(--surface-2)] hover:bg-white/[0.08] border border-[var(--border)] text-xs font-mono text-[var(--text)] flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105 active:scale-95"
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: s.color || '#10B981' }}
                    />
                    <span>{s.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Subject Name Input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-dim)]">
              Subject Name *
            </label>
            <input
              ref={nameInputRef}
              type="text"
              required
              value={subjectName}
              onChange={e => {
                setSubjectName(e.target.value);
                // Check if matches an existing subject
                const match = subjects.find(
                  s => s.name.trim().toLowerCase() === e.target.value.trim().toLowerCase()
                );
                setMatchedSubjectId(match?.id);
              }}
              placeholder="e.g. Digital Logic, Data Structures, IoT"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm sm:text-base text-[var(--text)] placeholder:text-[var(--text-faint)] focus:outline-none focus:border-[var(--accent)] font-sans transition-all"
            />
          </div>

          {/* Day of Week Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-dim)]">
              Day of Week:
            </label>
            <div className="grid grid-cols-7 gap-1">
              {DAYS_OF_WEEK.map(d => (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => setDayOfWeek(d.key)}
                  className={`py-1.5 text-xs font-mono font-bold rounded-lg border transition-all cursor-pointer ${
                    dayOfWeek === d.key
                      ? 'bg-[var(--accent)] text-[var(--accent-contrast)] border-transparent shadow-sm'
                      : 'bg-[var(--surface-2)] text-[var(--text-dim)] border-[var(--border)] hover:text-[var(--text)]'
                  }`}
                >
                  {d.short}
                </button>
              ))}
            </div>
          </div>

          {/* Target Study Duration */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-dim)] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>Target Study Duration per Day:</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-[10px] font-mono text-[var(--text-dim)] mb-1">Hours:</div>
                <input
                  type="number"
                  min={0}
                  max={12}
                  value={targetHours}
                  onChange={e => setTargetHours(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] font-mono"
                />
              </div>
              <div>
                <div className="text-[10px] font-mono text-[var(--text-dim)] mb-1">Minutes:</div>
                <input
                  type="number"
                  min={0}
                  max={59}
                  step={5}
                  value={targetMinutes}
                  onChange={e => setTargetMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)] font-mono"
                />
              </div>
            </div>
            <div className="text-[11px] font-mono text-[var(--text-dim)]">
              Total Target:{' '}
              <strong className="text-[var(--accent)]">
                {targetHours}h {targetMinutes}m
              </strong>
            </div>
          </div>

          {/* Color Tag Picker */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-dim)] flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>Accent Color Tag:</span>
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {TIMETABLE_COLOR_PRESETS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-95 ${
                    selectedColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-black scale-110' : ''
                  }`}
                  style={{ backgroundColor: color }}
                >
                  {selectedColor === color && <Check className="w-3.5 h-3.5 text-black stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[var(--surface-2)] hover:bg-white/[0.08] text-[var(--text-dim)] hover:text-[var(--text)] font-hud-mono text-xs font-semibold tracking-wider uppercase transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!subjectName.trim()}
              className="px-5 py-2 rounded-xl bg-[var(--accent)] hover:opacity-90 disabled:opacity-40 text-[var(--accent-contrast)] font-hud-mono text-xs font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_var(--glow)]"
            >
              <span>{editingItem ? 'Save Changes' : 'Add to Schedule'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
