'use client';

import React from 'react';
import { TodoItem } from '../../types';
import { useStudy } from '../../context/StudyContext';
import { Check, Trash2, Play, Clock, Sparkles } from 'lucide-react';

interface TaskItemProps {
  task: TodoItem;
  onLaunchTimer?: () => void;
}

export function TaskItem({ task, onLaunchTimer }: TaskItemProps) {
  const { toggleTodo, deleteTodo, startTimer, setSelectedSubjectId } = useStudy();

  const handleStudyNow = () => {
    if (task.subjectId) {
      setSelectedSubjectId(task.subjectId);
    }
    startTimer(task.subjectId, task.id);
    if (onLaunchTimer) {
      onLaunchTimer();
    }
  };

  const priorityColors = {
    high: 'bg-rose-500/15 border-rose-500/30 text-rose-400',
    medium: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
    low: 'bg-blue-500/15 border-blue-500/30 text-blue-400',
  };

  return (
    <div
      className={`group p-4 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        task.completed
          ? 'bg-slate-900/40 border-slate-800/60 opacity-60'
          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 shadow-sm'
      }`}
    >
      {/* Left: Checkbox & Task info */}
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <button
          onClick={() => toggleTodo(task.id)}
          className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all mt-0.5 flex-shrink-0 ${
            task.completed
              ? 'bg-emerald-500 border-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'border-slate-700 bg-slate-950 hover:border-emerald-500/60'
          }`}
        >
          {task.completed && <Check className="w-4 h-4 stroke-[3]" />}
        </button>

        <div className="flex-1 min-w-0">
          <div
            className={`text-sm font-semibold transition-all ${
              task.completed ? 'line-through text-slate-400' : 'text-white'
            }`}
          >
            {task.title}
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            {/* Subject pill */}
            {task.subjectName && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border"
                style={{
                  backgroundColor: `${task.subjectColor || '#10B981'}15`,
                  borderColor: `${task.subjectColor || '#10B981'}30`,
                  color: task.subjectColor || '#10B981',
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: task.subjectColor || '#10B981' }}
                />
                <span>{task.subjectName}</span>
              </span>
            )}

            {/* Priority tag */}
            <span
              className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border ${
                priorityColors[task.priority] || priorityColors.medium
              }`}
            >
              {task.priority}
            </span>

            {/* Estimated time */}
            {task.estimatedMinutes && (
              <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3 text-slate-500" />
                <span>{task.estimatedMinutes}m est</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 self-end sm:self-center">
        {!task.completed && (
          <button
            onClick={handleStudyNow}
            className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-300 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
            title="Start timer for this task"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Study Now</span>
          </button>
        )}

        <button
          onClick={() => deleteTodo(task.id)}
          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
          title="Delete task"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
