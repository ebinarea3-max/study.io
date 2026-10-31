'use client';

import React, { useState, useEffect } from 'react';
import { DailyTodoList } from './DailyTodoList';
import { StudyTimetable } from '../timetable/StudyTimetable';
import { useTimetable } from '../../context/TimetableContext';
import { useStudy } from '../../context/StudyContext';
import { Calendar, CheckSquare, Layers, Flame, Sparkles } from 'lucide-react';

export function TasksOverview() {
  const { streak, isTodayGoalCompleted } = useTimetable();
  const { todos } = useStudy();

  const [viewMode, setViewMode] = useState<'timetable' | 'todos' | 'both'>('timetable');

  // Remember user's preferred sub-view
  useEffect(() => {
    try {
      const saved = localStorage.getItem('studypulse_tasks_view_mode') as 'timetable' | 'todos' | 'both' | null;
      if (saved && ['timetable', 'todos', 'both'].includes(saved)) {
        setViewMode(saved);
      }
    } catch {}
  }, []);

  const handleSelectView = (mode: 'timetable' | 'todos' | 'both') => {
    setViewMode(mode);
    try {
      localStorage.setItem('studypulse_tasks_view_mode', mode);
    } catch {}
  };

  const completedTodosCount = todos.filter(t => t.completed).length;

  return (
    <div className="w-full h-full max-w-4xl mx-auto px-2 sm:px-6 py-6 pb-28 md:pb-28 animate-in fade-in duration-200 space-y-6">
      {/* Top Sub-Navigation Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-1.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-card">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none w-full sm:w-auto">
          {/* Timetable Tab */}
          <button
            type="button"
            onClick={() => handleSelectView('timetable')}
            className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl font-hud-mono text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
              viewMode === 'timetable'
                ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-[0_0_15px_var(--glow)]'
                : 'text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-white/[0.04]'
            }`}
          >
            <Calendar className="w-4 h-4 shrink-0" />
            <span>Weekly Timetable</span>
            {streak.currentStreak > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-black flex items-center gap-0.5 ${
                  viewMode === 'timetable'
                    ? 'bg-black/30 text-white'
                    : 'bg-amber-500/20 text-amber-400'
                }`}
              >
                <Flame className="w-2.5 h-2.5 fill-current" />
                {streak.currentStreak}d
              </span>
            )}
          </button>

          {/* Mission To-Do List Tab */}
          <button
            type="button"
            onClick={() => handleSelectView('todos')}
            className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl font-hud-mono text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
              viewMode === 'todos'
                ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-[0_0_15px_var(--glow)]'
                : 'text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-white/[0.04]'
            }`}
          >
            <CheckSquare className="w-4 h-4 shrink-0" />
            <span>Mission Tasks</span>
            {todos.length > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                  viewMode === 'todos'
                    ? 'bg-black/30 text-white'
                    : 'bg-white/10 text-[var(--text-dim)]'
                }`}
              >
                {completedTodosCount}/{todos.length}
              </span>
            )}
          </button>

          {/* Both / Stacked View Tab */}
          <button
            type="button"
            onClick={() => handleSelectView('both')}
            className={`hidden sm:flex px-3 py-2 rounded-xl font-hud-mono text-xs font-bold tracking-wider uppercase transition-all items-center gap-1.5 cursor-pointer ${
              viewMode === 'both'
                ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-[0_0_15px_var(--glow)]'
                : 'text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-white/[0.04]'
            }`}
            title="View both Timetable and To-Do List stacked"
          >
            <Layers className="w-3.5 h-3.5 shrink-0" />
            <span>All-In-One</span>
          </button>
        </div>

        {/* Quick Streak Tip on Desktop */}
        <div className="hidden sm:flex items-center gap-2 px-3 text-[11px] font-mono text-[var(--text-dim)]">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>
            {isTodayGoalCompleted
              ? 'Goal secured today 🔥'
              : 'Complete today targets to maintain streak'}
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'timetable' && (
        <div className="animate-in fade-in duration-150">
          <StudyTimetable />
        </div>
      )}

      {viewMode === 'todos' && (
        <div className="animate-in fade-in duration-150">
          <DailyTodoList />
        </div>
      )}

      {viewMode === 'both' && (
        <div className="space-y-10 animate-in fade-in duration-150">
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <h3 className="text-xs font-mono uppercase font-bold tracking-widest text-[var(--text-dim)]">
                SCHEDULED STUDY TIMETABLE
              </h3>
            </div>
            <StudyTimetable />
          </section>

          <section className="space-y-4 pt-6 border-t border-[var(--border)]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <h3 className="text-xs font-mono uppercase font-bold tracking-widest text-[var(--text-dim)]">
                DAILY MISSION OBJECTIVES
              </h3>
            </div>
            <DailyTodoList />
          </section>
        </div>
      )}
    </div>
  );
}
