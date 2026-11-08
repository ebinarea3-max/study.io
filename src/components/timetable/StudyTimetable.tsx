'use client';

import React, { useState } from 'react';
import { useTimetable } from '../../context/TimetableContext';
import { GoalStreakBanner } from './GoalStreakBanner';
import { DaySelectorBar } from './DaySelectorBar';
import { SubjectScheduleCard } from './SubjectScheduleCard';
import { EditSubjectScheduleModal } from './EditSubjectScheduleModal';
import { CopyScheduleModal } from './CopyScheduleModal';
import { TimetableItem, DAYS_OF_WEEK } from '../../types/timetable';
import { Plus, Moon, RefreshCw, CheckCircle2 } from 'lucide-react';

export function StudyTimetable() {
  const {
    selectedDay,
    itemsForSelectedDay,
    loadDefaultSchedule,
    syncStatus,
  } = useTimetable();

  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TimetableItem | null>(null);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);

  const selectedDayLabel = DAYS_OF_WEEK.find(d => d.key === selectedDay)?.label || selectedDay;

  const handleOpenAdd = () => {
    setEditingItem(null);
    setIsAddEditModalOpen(true);
  };

  const handleOpenEdit = (item: TimetableItem) => {
    setEditingItem(item);
    setIsAddEditModalOpen(true);
  };

  return (
    <div className="space-y-3.5 animate-in fade-in duration-200">
      {/* 1. Day-of-Week Selector Bar & Compact Schedule Header */}
      <DaySelectorBar
        onAddSubject={handleOpenAdd}
        onOpenCopyModal={() => setIsCopyModalOpen(true)}
      />

      {/* 2. Subject Schedule Cards List (Prominently at the TOP) */}
      <div className="space-y-2.5">
        {itemsForSelectedDay.length > 0 ? (
          itemsForSelectedDay.map(item => (
            <SubjectScheduleCard
              key={item.id}
              item={item}
              onEdit={handleOpenEdit}
            />
          ))
        ) : (
          /* Empty / Rest Day State (Compact) */
          <div className="p-5 sm:p-7 rounded-xl bg-[var(--surface)] border border-dashed border-[var(--border)] text-center space-y-3">
            <div className="w-10 h-10 mx-auto rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-neutral-400">
              <Moon className="w-5 h-5 text-neutral-400" />
            </div>

            <div>
              <h4 className="text-sm sm:text-base font-hud font-bold tracking-wider uppercase text-[var(--text)]">
                {selectedDayLabel} is a Rest Day
              </h4>
              <p className="text-xs text-[var(--text-dim)] max-w-md mx-auto mt-0.5 font-sans">
                No subjects are scheduled for {selectedDayLabel}. Rest days protect your Daily Goal Streak from breaking!
              </p>
            </div>

            <div className="flex items-center justify-center pt-1">
              <button
                type="button"
                onClick={handleOpenAdd}
                className="px-3.5 py-1.5 rounded-lg bg-[var(--accent)] hover:opacity-90 text-[var(--accent-contrast)] font-hud-mono text-xs font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_var(--glow)] hover:scale-105 active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Schedule a Subject for {selectedDay.toUpperCase()}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sync Status Badge */}
      <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-faint)] px-1">
        <span className="flex items-center gap-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              syncStatus === 'synced'
                ? 'bg-emerald-400'
                : syncStatus === 'saving'
                ? 'bg-amber-400 animate-ping'
                : 'bg-neutral-500'
            }`}
          />
          <span>
            {syncStatus === 'synced'
              ? 'Timetable synced'
              : syncStatus === 'saving'
              ? 'Saving changes...'
              : 'Offline mode (saved locally)'}
          </span>
        </span>

        <span className="text-[10px]">
          Live sync with Focus Timer & Season RP active
        </span>
      </div>

      {/* Modals */}
      <EditSubjectScheduleModal
        isOpen={isAddEditModalOpen}
        onClose={() => {
          setIsAddEditModalOpen(false);
          setEditingItem(null);
        }}
        editingItem={editingItem}
        defaultDay={selectedDay}
      />

      <CopyScheduleModal
        isOpen={isCopyModalOpen}
        onClose={() => setIsCopyModalOpen(false)}
        fromDay={selectedDay}
      />
    </div>
  );
}

