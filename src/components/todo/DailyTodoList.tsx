'use client';

import React, { useState } from 'react';
import { useStudy } from '../../context/StudyContext';
import { Check, Plus, Trash2, CheckCircle2, ListTodo } from 'lucide-react';
import { soundFx } from '../../lib/audio';
import confetti from 'canvas-confetti';

interface DailyTodoListProps {
  onLaunchTimer?: () => void;
}

export function DailyTodoList({ onLaunchTimer }: DailyTodoListProps = {}) {
  const { todos, addTodo, toggleTodo, deleteTodo } = useStudy();
  const [taskTitle, setTaskTitle] = useState('');

  const completedCount = todos.filter(t => t.completed).length;
  const totalCount = todos.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    addTodo({
      title: taskTitle.trim(),
      date: new Date().toISOString().slice(0, 10),
      completed: false,
      priority: 'medium',
    });

    setTaskTitle('');
  };

  const handleToggle = (id: string, currentlyCompleted: boolean) => {
    if (!currentlyCompleted) {
      soundFx.playReactionPop();
      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.6 },
      });
    }
    toggleTodo(id);
  };

  const handleClearCompleted = () => {
    todos.filter(t => t.completed).forEach(t => deleteTodo(t.id));
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Header card with progress */}
      <div className="rounded-3xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ListTodo className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white">Todo List</h1>
              <p className="text-xs text-slate-400">Simple task list for your study day</p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-2xl font-black font-mono text-emerald-400">
              {completedCount} <span className="text-sm text-slate-500 font-normal">/ {totalCount}</span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Completed</div>
          </div>
        </div>

        {/* Minimal Progress Bar */}
        {totalCount > 0 && (
          <div className="mt-4 h-2 w-full rounded-full bg-slate-950 overflow-hidden border border-slate-800/80">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 shadow-sm shadow-emerald-500/20"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>

      {/* Main Checklist Card */}
      <div className="rounded-3xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl p-6 shadow-2xl space-y-4">
        {/* Simple Add Task Input */}
        <form onSubmit={handleAdd} className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={taskTitle}
              onChange={e => setTaskTitle(e.target.value)}
              placeholder="Add a new task... (press Enter)"
              className="w-full pl-4 pr-10 py-3 bg-slate-950/80 border border-slate-700/80 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all shadow-inner"
            />
          </div>

          <button
            type="submit"
            disabled={!taskTitle.trim()}
            className="py-3 px-5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-2xl transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Task</span>
          </button>
        </form>

        {/* Checklist */}
        {todos.length === 0 ? (
          <div className="py-12 text-center rounded-2xl border border-dashed border-slate-800/80 bg-slate-950/30">
            <CheckCircle2 className="w-10 h-10 text-slate-700 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-300">Your checklist is empty</h3>
            <p className="text-xs text-slate-500 mt-1">
              Type a task above and press Enter to add it to your daily plan.
            </p>
          </div>
        ) : (
          <div className="space-y-2 pt-2">
            {todos.map(task => (
              <div
                key={task.id}
                className={`group flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                  task.completed
                    ? 'bg-slate-950/40 border-slate-800/50 opacity-75'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                }`}
              >
                {/* Checkbox + Task Title */}
                <div
                  onClick={() => handleToggle(task.id, task.completed)}
                  className="flex items-center gap-3.5 flex-1 min-w-0 cursor-pointer select-none"
                >
                  <button
                    type="button"
                    aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
                    className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all flex-shrink-0 ${
                      task.completed
                        ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-sm shadow-emerald-500/30'
                        : 'border-slate-700 hover:border-emerald-400 bg-slate-900 group-hover:scale-105'
                    }`}
                  >
                    {task.completed && <Check className="w-4 h-4 stroke-[3]" />}
                  </button>

                  <span
                    className={`text-sm transition-all truncate ${
                      task.completed
                        ? 'line-through text-slate-500 font-normal'
                        : 'text-slate-100 font-medium'
                    }`}
                  >
                    {task.title}
                  </span>
                </div>

                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => deleteTodo(task.id)}
                  title="Delete task"
                  className="p-1.5 text-slate-600 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors ml-2 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Footer: Clear completed */}
        {completedCount > 0 && (
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={handleClearCompleted}
              className="text-xs text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
            >
              Clear completed tasks ({completedCount})
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
