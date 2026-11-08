'use client';

import React from 'react';
import { DailyTodoList } from './DailyTodoList';
import { useIntro } from '../../context/IntroContext';
import { INTRO_CONTENT } from '../../lib/introContent';
import { Sparkles, X } from 'lucide-react';

export function TasksOverview() {
  const { isHintVisible, dismissHint } = useIntro();
  const showHint = isHintVisible('tasks');

  return (
    <div className="w-full h-full max-w-4xl mx-auto px-2 sm:px-6 py-3 sm:py-4 pb-20 md:pb-24 animate-in fade-in duration-200 space-y-3">
      {/* One-time dismissible intro hint (if active) */}
      {showHint && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-mono text-amber-300 flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{INTRO_CONTENT.hints.tasks.text}</span>
          </div>
          <button
            type="button"
            onClick={() => dismissHint('tasks')}
            className="p-1 rounded-lg hover:bg-amber-500/20 text-amber-400/70 hover:text-amber-300 transition-colors cursor-pointer"
            aria-label="Dismiss tip"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Pure To-Do List */}
      <DailyTodoList />
    </div>
  );
}
