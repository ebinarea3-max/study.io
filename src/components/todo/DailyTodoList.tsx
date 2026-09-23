'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getSupabase } from '../../lib/supabase';
import { soundFx } from '../../lib/audio';
import confetti from 'canvas-confetti';
import {
  CheckSquare,
  CheckCircle2,
  Plus,
  Trash2,
  Check,
  ChevronDown,
  GripVertical,
} from 'lucide-react';
import { useRankTheme } from '../../hooks/useRankTheme';

export interface DailyTodo {
  id: string;
  task: string;
  is_completed: boolean;
  user_id?: string;
  created_at?: string;
}

function normalizeTodo(t: any): DailyTodo {
  return {
    id: t.id || `local-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    task: t.task || t.title || '',
    is_completed: Boolean(t.is_completed ?? t.completed),
    user_id: t.user_id,
    created_at: t.created_at || new Date().toISOString(),
  };
}

export function DailyTodoList() {
  const [todos, setTodos] = useState<DailyTodo[]>([]);
  const [taskInput, setTaskInput] = useState('');
  const [isCompletedOpen, setIsCompletedOpen] = useState(true);
  const { theme } = useRankTheme();

  const inFlightOpsRef = useRef<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Local storage persistence helper
  const saveLocal = (items: DailyTodo[]) => {
    try {
      localStorage.setItem('studypulse_todos', JSON.stringify(items));
      window.dispatchEvent(new Event('studypulse_todos_updated'));
    } catch (err) {
      console.warn('Failed to save todos to localStorage:', err);
    }
  };

  // 1. Initial load from localStorage (instant rendering, zero flash) + fetch from Supabase
  useEffect(() => {
    const syncFromLocal = () => {
      try {
        const saved = localStorage.getItem('studypulse_todos');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setTodos(parsed.map(normalizeTodo));
          } else if (Array.isArray(parsed) && parsed.length === 0) {
            setTodos([]);
          }
        }
      } catch (err) {
        console.warn('Failed to parse local todos:', err);
      }
    };

    syncFromLocal();
    window.addEventListener('studypulse_todos_updated', syncFromLocal);

    // 2. Fetch remote todos from Supabase with active session verification
    const fetchRemoteTodos = async () => {
      if (inFlightOpsRef.current > 0) return;

      const supabase = getSupabase();
      if (!supabase) return;

      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          // Unauthenticated or offline: gracefully preserve localStorage
          return;
        }

        const { data, error } = await supabase
          .from('todos')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error(error);
          return;
        }

        // Avoid overwriting if an operation started while request was in-flight
        if (inFlightOpsRef.current > 0) return;

        if (data) {
          const remoteTodos = data.map(normalizeTodo);
          setTodos(prev => {
            // Keep pending optimistic items (prefixed with temp-) or unsynced local items
            const pendingLocal = prev.filter(t => t.id.startsWith('temp-') || t.id.startsWith('local-'));

            // If remote returned 0 items but local has items, do not wipe existing tasks
            if (remoteTodos.length === 0 && prev.length > 0) {
              return prev;
            }

            const merged = [
              ...pendingLocal,
              ...remoteTodos.filter(r => !pendingLocal.some(p => p.task === r.task || p.id === r.id)),
            ];

            if (merged.length > 0 || prev.length === 0) {
              saveLocal(merged);
              return merged;
            }
            return prev;
          });
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchRemoteTodos();

    // Listen to Supabase auth state changes (e.g. login/logout) to refresh list
    const supabase = getSupabase();
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          fetchRemoteTodos();
        }
      });
      return () => {
        subscription.unsubscribe();
        window.removeEventListener('studypulse_todos_updated', syncFromLocal);
      };
    }
    
    return () => {
      window.removeEventListener('studypulse_todos_updated', syncFromLocal);
    };
  }, []);

  // 3. Add Task: Optimistic update + Supabase insert + UUID replacement
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const newTaskText = taskInput.trim();
    if (!newTaskText) return;

    inFlightOpsRef.current += 1;

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const optimisticItem: DailyTodo = {
      id: tempId,
      task: newTaskText,
      is_completed: false,
      created_at: new Date().toISOString(),
    };

    // Immediately update local state and fallback localStorage
    setTodos(prev => {
      const updated = [optimisticItem, ...prev];
      saveLocal(updated);
      return updated;
    });

    setTaskInput('');
    setTimeout(() => inputRef.current?.focus(), 20);

    const supabase = getSupabase();
    if (!supabase) {
      // Offline/local fallback: task remains safely in localStorage
      inFlightOpsRef.current = Math.max(0, inFlightOpsRef.current - 1);
      return;
    }

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        // Signed-out or local session: task remains safely in local state
        inFlightOpsRef.current = Math.max(0, inFlightOpsRef.current - 1);
        return;
      }

      const { data, error } = await supabase
        .from('todos')
        .insert({ task: newTaskText, is_completed: false, user_id: user.id })
        .select()
        .single();

      if (error) {
        console.error(error);
        // Do NOT clear or reset the task list silently on error!
      } else if (data) {
        // Replace the optimistic placeholder item with the real returned record from .select().single() containing the generated database id
        setTodos(prev => {
          const updated = prev.map(t => (t.id === tempId ? normalizeTodo(data) : t));
          saveLocal(updated);
          return updated;
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      inFlightOpsRef.current = Math.max(0, inFlightOpsRef.current - 1);
    }
  };

  // 4. Toggle Task Completion
  const handleToggleTask = async (id: string, currentCompleted: boolean) => {
    const nextCompleted = !currentCompleted;
    if (nextCompleted) {
      soundFx.playReactionPop();
      confetti({
        particleCount: 25,
        spread: 45,
        origin: { y: 0.6 },
      });
    }

    inFlightOpsRef.current += 1;

    // Immediate local state update without lag
    setTodos(prev => {
      const updated = prev.map(t => (t.id === id ? { ...t, is_completed: nextCompleted } : t));
      saveLocal(updated);
      return updated;
    });

    const supabase = getSupabase();
    if (supabase && !id.startsWith('temp-') && !id.startsWith('local-')) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { error } = await supabase
            .from('todos')
            .update({ is_completed: nextCompleted })
            .eq('id', id);

          if (error) {
            console.error(error);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }

    inFlightOpsRef.current = Math.max(0, inFlightOpsRef.current - 1);
  };

  // 5. Delete Task
  const handleDeleteTask = async (id: string) => {
    inFlightOpsRef.current += 1;

    // Immediate local update
    setTodos(prev => {
      const updated = prev.filter(t => t.id !== id);
      saveLocal(updated);
      return updated;
    });

    const supabase = getSupabase();
    if (supabase && !id.startsWith('temp-') && !id.startsWith('local-')) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { error } = await supabase
            .from('todos')
            .delete()
            .eq('id', id);

          if (error) {
            console.error(error);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }

    inFlightOpsRef.current = Math.max(0, inFlightOpsRef.current - 1);
  };

  // 6. In-place Edit of Task Text
  const handleUpdateTaskText = async (id: string, newText: string) => {
    setTodos(prev => {
      const updated = prev.map(t => (t.id === id ? { ...t, task: newText } : t));
      saveLocal(updated);
      return updated;
    });

    const supabase = getSupabase();
    if (supabase && !id.startsWith('temp-') && !id.startsWith('local-')) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { error } = await supabase.from('todos').update({ task: newText }).eq('id', id);
          if (error) console.error(error);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // 7. Clear All Completed Tasks
  const handleClearCompleted = async () => {
    inFlightOpsRef.current += 1;
    let completedIds: string[] = [];

    setTodos(prev => {
      completedIds = prev.filter(t => t.is_completed).map(t => t.id);
      const active = prev.filter(t => !t.is_completed);
      saveLocal(active);
      return active;
    });

    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          for (const id of completedIds) {
            if (!id.startsWith('temp-') && !id.startsWith('local-')) {
              await supabase.from('todos').delete().eq('id', id);
            }
          }
        }
      } catch (err) {
        console.error(err);
      }
    }

    inFlightOpsRef.current = Math.max(0, inFlightOpsRef.current - 1);
  };

  const activeTodos = todos.filter(t => !t.is_completed);
  const completedTodos = todos.filter(t => t.is_completed);
  const progressPercent = todos.length > 0 ? Math.round((completedTodos.length / todos.length) * 100) : 0;

  return (
    <div className="hud-surface border border-white/[0.08] rounded-2xl p-4 sm:p-5 space-y-3 relative overflow-hidden group">
      {/* Header Row */}
      <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.06] relative z-10">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-tier" />
          <span className="font-hud-mono text-xs uppercase font-bold text-white tracking-wider">
            TODO LIST
          </span>
        </div>
        <span
          className="px-2.5 py-0.5 rounded font-hud-mono text-[11px] font-bold border shadow-sm text-tier border-tier-muted bg-tier-muted"
        >
          <span className="font-bold">{completedTodos.length}</span> / {todos.length} COMPLETED
        </span>
      </div>

      {/* Progress Bar */}
      {todos.length > 0 && (
        <div className="h-1.5 w-full rounded-full bg-black/60 overflow-hidden border border-white/[0.05] relative z-10">
          <div
            className="h-full rounded-full transition-all duration-500 shadow-sm bg-tier glow-tier"
            style={{
              width: `${progressPercent}%`,
            }}
          />
        </div>
      )}

      {/* Task Input: Clean, borderless inline input at the top */}
      <form
        onSubmit={handleAddTask}
        className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-black/40 border border-white/[0.08] focus-within:border-white/30 focus-within:ring-1 focus-within:bg-black/60 transition-all relative z-10"
        style={{ '--tw-ring-color': theme.accent } as React.CSSProperties}
      >
        <Plus className="w-4 h-4 text-neutral-400 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={taskInput}
          onChange={e => setTaskInput(e.target.value)}
          placeholder="+ Take a note / Add an item..."
          className="w-full bg-transparent text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none font-sans py-0.5"
        />
        {taskInput.trim() && (
          <button
            type="submit"
            disabled={!taskInput.trim()}
            className="px-2.5 py-1 text-[11px] font-hud-mono font-bold text-slate-950 rounded-lg transition-all flex-shrink-0 cursor-pointer disabled:opacity-50 active:scale-95 bg-tier"
          >
            ADD
          </button>
        )}
      </form>

      {/* Items Container */}
      <div className="max-h-72 overflow-y-auto space-y-0.5 pr-0.5 select-none relative z-10">
        {/* Active (Uncompleted) Tasks */}
        {activeTodos.map(item => (
          <div
            key={item.id}
            className="group flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.04] transition-colors"
          >
            <GripVertical className="w-3.5 h-3.5 text-neutral-600 opacity-0 group-hover:opacity-40 transition-opacity flex-shrink-0 cursor-grab" />

            {/* Checkbox */}
            <button
              type="button"
              onClick={() => handleToggleTask(item.id, item.is_completed)}
              aria-label="Mark task complete"
              className="w-[18px] h-[18px] rounded-[4px] border-[1.5px] border-neutral-600 bg-black/40 transition-all flex items-center justify-center flex-shrink-0 cursor-pointer group-hover:border-neutral-400 active:scale-95"
            />

            {/* Inline Editable Task Title */}
            <input
              type="text"
              value={item.task}
              onChange={e => handleUpdateTaskText(item.id, e.target.value)}
              className="w-full bg-transparent text-xs text-neutral-200 focus:text-white focus:outline-none py-0.5 tracking-wide leading-relaxed font-sans"
            />

            {/* Delete button on hover */}
            <button
              type="button"
              onClick={() => handleDeleteTask(item.id)}
              title="Delete item"
              className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-rose-400 p-1 transition-opacity cursor-pointer flex-shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {/* Empty State message if 0 todos */}
        {todos.length === 0 && (
          <div className="py-6 text-center text-xs text-neutral-500 space-y-1">
            <CheckCircle2 className="w-7 h-7 text-neutral-600 mx-auto mb-1 opacity-70" />
            <p className="text-neutral-400 font-hud-mono font-bold tracking-wider">Your checklist is empty</p>
            <p className="text-[11px] text-neutral-500 mt-0.5">Type above in '+ Take a note / Add an item...' and press Enter</p>
          </div>
        )}

        {/* Completed Items Collapsible Section */}
        {completedTodos.length > 0 && (
          <div className="pt-2">
            <div className="border-t border-white/[0.08] pt-2 mb-1 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsCompletedOpen(!isCompletedOpen)}
                className="flex items-center gap-1.5 text-xs font-semibold text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer select-none"
              >
                <ChevronDown
                  className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${
                    isCompletedOpen ? '' : '-rotate-90'
                  }`}
                />
                <span className="flex items-center gap-1.5 font-hud-mono text-[11px] tracking-wide">
                  <Check className="w-3.5 h-3.5 stroke-[2.5] text-tier" />
                  <span>COMPLETED OBJECTIVES ({completedTodos.length})</span>
                </span>
              </button>

              <button
                type="button"
                onClick={handleClearCompleted}
                className="font-hud-mono text-[10px] uppercase font-bold text-neutral-500 hover:text-rose-400 transition-colors cursor-pointer tracking-wider"
              >
                CLEAR ALL
              </button>
            </div>

            {isCompletedOpen && (
              <div className="space-y-0.5">
                {completedTodos.map(item => (
                  <div
                    key={item.id}
                    className="group flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-neutral-800/20 transition-colors"
                  >
                    <div className="w-3.5 flex-shrink-0" />
                    <button
                      type="button"
                      onClick={() => handleToggleTask(item.id, item.is_completed)}
                      aria-label="Mark task incomplete"
                      className="w-[18px] h-[18px] rounded-[4px] text-slate-950 flex items-center justify-center transition-all flex-shrink-0 cursor-pointer shadow-sm active:scale-95"
                      style={{ backgroundColor: theme.accent }}
                    >
                      <Check className="w-3 h-3 stroke-[3]" />
                    </button>
                    <span className="w-full text-xs text-neutral-500 line-through py-0.5 tracking-wide leading-relaxed truncate font-sans">
                      {item.task}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteTask(item.id)}
                      title="Delete item"
                      className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-rose-400 p-1 transition-opacity cursor-pointer flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
