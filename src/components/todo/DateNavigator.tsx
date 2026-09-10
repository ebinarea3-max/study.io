'use client';

import React from 'react';
import { useStudy } from '../../context/StudyContext';
import { ChevronLeft, ChevronRight, Calendar, Sparkles } from 'lucide-react';
import { getTodayDateString } from '../../lib/mockData';

export function DateNavigator() {
  const { selectedDate, setSelectedDate } = useStudy();

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const handleToday = () => {
    setSelectedDate(getTodayDateString(0));
  };

  const isToday = selectedDate === getTodayDateString(0);

  // Format date display (e.g., "Wednesday, Sep 9, 2026")
  const dateObj = new Date(`${selectedDate}T00:00:00`);
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl">
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <Calendar className="w-4 h-4" />
        </div>
        <div>
          <div className="text-xs font-bold text-white flex items-center gap-2">
            <span>{formattedDate}</span>
            {isToday && (
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                Today
              </span>
            )}
          </div>
          <div className="text-[10px] text-slate-400">Daily Study Planner & Checklist</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {!isToday && (
          <button
            onClick={handleToday}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-xs font-bold text-emerald-400 border border-emerald-500/30 transition-colors"
          >
            Jump to Today
          </button>
        )}

        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={handlePrevDay}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="bg-transparent text-xs text-slate-300 px-2 py-1 focus:outline-none cursor-pointer"
          />

          <button
            onClick={handleNextDay}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
