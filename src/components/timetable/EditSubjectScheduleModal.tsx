'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { TimetableItem, DayOfWeek, TIMETABLE_COLOR_PRESETS, DAYS_OF_WEEK } from '../../types/timetable';
import { useTimetable } from '../../context/TimetableContext';
import { useStudy } from '../../context/StudyContext';
import { Subject } from '../../types';
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

  const activeSubjects = useMemo(() => {
    return (Array.isArray(subjects) ? subjects : []).filter(s => s && !s.is_archived);
  }, [subjects]);

  const displayColors = useMemo(() => {
    if (
      selectedColor &&
      !TIMETABLE_COLOR_PRESETS.some(c => c.toLowerCase() === selectedColor.toLowerCase())
    ) {
      return [selectedColor, ...TIMETABLE_COLOR_PRESETS];
    }
    return TIMETABLE_COLOR_PRESETS;
  }, [selectedColor]);

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

      const matched = activeSubjects.find(
        s =>
          s.id === editingItem.subjectId ||
          s.name.trim().toLowerCase() === editingItem.subjectName.trim().toLowerCase()
      );
      setMatchedSubjectId(matched?.id || editingItem.subjectId);
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
  }, [editingItem, defaultDay, isOpen, activeSubjects]);

  // Handle selecting an existing subject from study context
  const handleSelectExistingSubject = (sub: Subject) => {
    setSubjectName(sub.name);
    setMatchedSubjectId(sub.id);
    if (sub.color) {
      setSelectedColor(sub.color);
    }
    const subMins = sub.daily_goal_minutes || sub.targetMinutesPerDay;
    if (subMins && subMins > 0) {
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
          {/* 1. Required Subject Selector (Chips) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-dim)] flex items-center gap-1.5">
                <span>Select a Subject *</span>
              </label>
              {subjectName ? (
                <span className="text-[11px] font-mono font-semibold text-emerald-400 flex items-center gap-1">
                  <Check className="w-3 h-3 stroke-[3]" />
                  <span>{subjectName}</span>
                </span>
              ) : (
                <span className="text-[10px] font-mono text-amber-400/90 font-medium">
                  Required
                </span>
              )}
            </div>

            {activeSubjects.length > 0 ? (
              <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto scrollbar-none py-1">
                {activeSubjects.map(s => {
                  const isSelected =
                    matchedSubjectId === s.id ||
                    (Boolean(subjectName) &&
                      s.name.trim().toLowerCase() === subjectName.trim().toLowerCase());

                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleSelectExistingSubject(s)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-mono flex items-center gap-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/20 border-amber-400 text-white shadow-[0_0_12px_rgba(245,158,11,0.25)] ring-1 ring-amber-400/50 scale-[1.02]'
                          : 'bg-[var(--surface-2)] hover:bg-white/[0.08] border-[var(--border)] text-[var(--text-dim)] hover:text-[var(--text)]'
                      }`}
                    >
                      <span
                        className={`w-2.5 h-2.5 rounded-full shrink-0 transition-transform ${
                          isSelected ? 'scale-110 ring-2 ring-white/60' : ''
                        }`}
                        style={{
                          backgroundColor: s.color || '#10B981',
                          boxShadow: isSelected ? `0 0 8px ${s.color || '#10B981'}` : undefined,
                        }}
                      />
                      <span className="font-semibold">{s.name}</span>
                      {isSelected && <Check className="w-3 h-3 text-amber-400 stroke-[3]" />}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-dashed border-[var(--border)] text-center space-y-2">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="text-xs text-[var(--text)] font-semibold">No Subjects Created Yet</div>
                <p className="text-[11px] text-[var(--text-dim)] max-w-xs mx-auto leading-relaxed">
                  Create subjects in the Timer tab first to schedule them on your weekly timetable.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    window.dispatchEvent(new CustomEvent('switch_tab', { detail: 'timer' }));
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent)] text-[var(--accent-contrast)] text-xs font-mono font-bold hover:opacity-90 transition-all cursor-pointer mt-1 shadow-sm"
                >
                  <span>Go to Timer</span>
                </button>
              </div>
            )}
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
              {displayColors.map(color => {
                const isSelected = selectedColor.toLowerCase() === color.toLowerCase();
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-95 ${
                      isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-black scale-110' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-black stroke-[3]" />}
                  </button>
                );
              })}
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
              className="px-5 py-2 rounded-xl bg-[var(--accent)] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-[var(--accent-contrast)] font-hud-mono text-xs font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_var(--glow)]"
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
