'use client';

import React, { useState } from 'react';
import { useTimetable } from '../../context/TimetableContext';
import { GoalStreakBanner } from './GoalStreakBanner';
import { DaySelectorBar } from './DaySelectorBar';
import { SubjectScheduleCard } from './SubjectScheduleCard';
import { EditSubjectScheduleModal } from './EditSubjectScheduleModal';
import { CopyScheduleModal } from './CopyScheduleModal';
import { TimetableItem, DAYS_OF_WEEK } from '../../types/timetable';
import { Plus, Sparkles, Moon, RefreshCw, CheckCircle2 } from 'lucide-react';

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
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Daily Goal Streak Engine Banner */}
      <GoalStreakBanner />

      {/* 2. Day-of-Week Selector Bar */}
      <DaySelectorBar
        onAddSubject={handleOpenAdd}
        onOpenCopyModal={() => setIsCopyModalOpen(true)}
      />

      {/* 3. Subject Schedule Cards List */}
      <div className="space-y-3">
        {itemsForSelectedDay.length > 0 ? (
          itemsForSelectedDay.map(item => (
            <SubjectScheduleCard
              key={item.id}
              item={item}
              onEdit={handleOpenEdit}
            />
          ))
        ) : (
          /* Empty / Rest Day State */
          <div className="p-8 sm:p-12 rounded-2xl bg-[var(--surface)] border border-dashed border-[var(--border)] text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-neutral-400">
              <Moon className="w-7 h-7 text-neutral-400" />
            </div>

            <div>
              <h4 className="text-base sm:text-lg font-hud font-bold tracking-wider uppercase text-[var(--text)]">
                {selectedDayLabel} is a Rest Day
              </h4>
              <p className="text-xs sm:text-sm text-[var(--text-dim)] max-w-md mx-auto mt-1 font-sans">
                No subjects are scheduled for {selectedDayLabel}. Rest days protect your Daily Goal Streak from breaking!
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleOpenAdd}
                className="px-4 py-2 rounded-xl bg-[var(--accent)] hover:opacity-90 text-[var(--accent-contrast)] font-hud-mono text-xs font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_var(--glow)] hover:scale-105 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Schedule a Subject for {selectedDay.toUpperCase()}</span>
              </button>

              <button
                type="button"
                onClick={loadDefaultSchedule}
                className="px-4 py-2 rounded-xl bg-[var(--surface-2)] hover:bg-white/[0.08] text-[var(--text-dim)] hover:text-[var(--text)] border border-[var(--border)] font-hud-mono text-xs font-semibold tracking-wider uppercase transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Load Starter Routine</span>
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
        onClose={() => setIsAddEditModalOpen(false)}
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
