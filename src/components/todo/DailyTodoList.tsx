'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getSupabase } from '../../lib/supabase';
import { soundFx } from '../../lib/audio';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Plus,
  Trash2,
  Check,
  ChevronDown,
  GripVertical,
  Target,
  Flag,
  CircleDot,
} from 'lucide-react';
import { useRankTheme } from '../../hooks/useRankTheme';
import { useStudy } from '../../context/StudyContext';

export interface DailyTodo {
  id: string;
  task: string;
  is_completed: boolean;
  priority?: 'low' | 'medium' | 'high';
  subject_id?: string;
  user_id?: string;
  created_at?: string;
}

function normalizeTodo(t: any): DailyTodo {
  return {
    id: t.id || `local-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    task: t.task || t.title || '',
    is_completed: Boolean(t.is_completed ?? t.completed),
    priority: t.priority || 'medium',
    subject_id: t.subject_id || undefined,
    user_id: t.user_id,
    created_at: t.created_at || new Date().toISOString(),
  };
}

export function DailyTodoList({ isEmbedded = false }: { isEmbedded?: boolean } = {}) {
  const [todos, setTodos] = useState<DailyTodo[]>([]);
  const [taskInput, setTaskInput] = useState('');
  const [isCompletedOpen, setIsCompletedOpen] = useState(true);
  const { theme } = useRankTheme();
  const { subjects, setSelectedSubjectId } = useStudy();

  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'high'>('all');
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [taskSubjectId, setTaskSubjectId] = useState<string>('none');

  const handleFocusTask = (subjectId?: string) => {
    if (subjectId && subjectId !== 'none') {
      setSelectedSubjectId(subjectId);
    }
    window.dispatchEvent(new CustomEvent('switch_tab', { detail: 'timer' }));
  };

  // Drag and drop reordering states
  const [draggableRowId, setDraggableRowId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<'above' | 'below'>('above');

  const inFlightOpsRef = useRef<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleItemDrop = (targetId: string) => {
    const sourceId = draggingId;
    if (!sourceId || sourceId === targetId) {
      setDraggingId(null);
      setDragOverId(null);
      setDraggableRowId(null);
      return;
    }

    setTodos(prev => {
      const sourceIndex = prev.findIndex(t => t.id === sourceId);
      const targetIndex = prev.findIndex(t => t.id === targetId);
      if (sourceIndex === -1 || targetIndex === -1) return prev;

      const next = [...prev];
      const [moved] = next.splice(sourceIndex, 1);

      let insertIndex = next.findIndex(t => t.id === targetId);
      if (dragOverPosition === 'below') {
        insertIndex += 1;
      }
      next.splice(insertIndex, 0, moved);

      saveLocal(next);
      soundFx.playReactionPop();
      return next;
    });

    setDraggingId(null);
    setDragOverId(null);
    setDraggableRowId(null);
  };

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
            queueMicrotask(() => {
              setTodos(parsed.map(normalizeTodo));
            });
          } else if (Array.isArray(parsed) && parsed.length === 0) {
            queueMicrotask(() => {
              setTodos([]);
            });
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
          .order('created_at', { ascending: true });

        if (error) {
          console.error(error);
          return;
        }

        // Avoid overwriting if an operation started while request was in-flight
        if (inFlightOpsRef.current > 0) return;

        if (data) {
          const remoteTodos = data.map(normalizeTodo);
          setTodos(prev => {
            const pendingLocal = prev.filter(t => t.id.startsWith('temp-') || t.id.startsWith('local-'));

            // If remote returned 0 items but local has items, do not wipe existing tasks
            if (remoteTodos.length === 0 && prev.length > 0) {
              return prev;
            }

            if (prev.length > 0) {
              const remoteMap = new Map(remoteTodos.map(r => [r.id, r]));
              const updatedExisting = prev.map(p => {
                const remote = remoteMap.get(p.id);
                return remote ? { ...p, ...remote } : p;
              });
              const existingIds = new Set(prev.map(p => p.id));
              const newFromRemote = remoteTodos.filter(r => !existingIds.has(r.id));
              const merged = [...updatedExisting, ...newFromRemote];
              saveLocal(merged);
              return merged;
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
      priority: taskPriority,
      subject_id: taskSubjectId === 'none' ? undefined : taskSubjectId,
      created_at: new Date().toISOString(),
    };

    // Immediately update local state and fallback localStorage
    setTodos(prev => {
      const updated = [...prev, optimisticItem];
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
        .insert({ 
          task: newTaskText, 
          is_completed: false, 
          user_id: user.id,
          priority: taskPriority,
          subject_id: taskSubjectId === 'none' ? null : taskSubjectId,
        })
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

  const completedTodos = todos.filter(t => t.is_completed);
  const progressPercent = todos.length > 0 ? Math.round((completedTodos.length / todos.length) * 100) : 0;

  const filteredTodos = todos.filter(t => {
    if (filter === 'active') return !t.is_completed;
    if (filter === 'completed') return t.is_completed;
    if (filter === 'high') return t.priority === 'high';
    return true;
  });

  const displayActiveTodos = filteredTodos.filter(t => !t.is_completed);
  const displayCompletedTodos = filteredTodos.filter(t => t.is_completed);

  return (
    <div className="max-w-[760px] w-full mx-auto flex flex-col gap-4 select-none animate-in fade-in duration-250">
      <style>{`
        @keyframes drawCheckPath {
          0% { stroke-dashoffset: 24; }
          100% { stroke-dashoffset: 0; }
        }
        .task-check-path {
          stroke-dasharray: 24;
          stroke-dashoffset: 0;
          animation: drawCheckPath 0.22s ease-out forwards;
        }
      `}</style>

      {/* Header Row: Title with Count + Neutral Segmented Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
        <div className="flex items-baseline gap-2.5">
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Tasks</h1>
          <span className="text-xs text-zinc-400 font-normal">
            {completedTodos.length} of {todos.length} done
          </span>
        </div>

        {/* Filter Segmented Control in Sentence Case */}
        <div className="inline-flex items-center p-1 bg-white/[0.04] border border-white/[0.08] rounded-full gap-0.5 self-start sm:self-auto overflow-x-auto scrollbar-none">
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'active', label: 'Active' },
              { id: 'completed', label: 'Done' },
              { id: 'high', label: 'High priority' },
            ] as const
          ).map(({ id, label }) => {
            const isActive = filter === id;
            return (
              <button
                type="button"
                key={id}
                onClick={() => setFilter(id)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-150 active:scale-[0.98] cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-white/[0.1] text-white border border-white/[0.15] shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Slim Progress Line - shown ONLY when at least one task exists */}
      {todos.length > 0 && (
        <div className="h-1 w-full rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${progressPercent}%`,
              backgroundColor: 'var(--tier-accent)',
            }}
          />
        </div>
      )}

      {/* Quick Add Row: One rounded input with ghost priority and subject dropdowns */}
      <form
        onSubmit={handleAddTask}
        className="flex items-center gap-2 p-1.5 sm:p-2 rounded-xl bg-white/[0.03] border border-white/[0.08] focus-within:border-white/[0.20] transition-all"
      >
        <div className="flex-1 flex items-center gap-2 px-2 min-w-0">
          <Plus className="w-4 h-4 text-zinc-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={taskInput}
            onChange={e => setTaskInput(e.target.value)}
            placeholder="Add a task…"
            className="w-full bg-transparent text-sm text-white placeholder:text-zinc-500 focus:outline-none py-1"
          />
        </div>

        <div className="flex items-center gap-1.5 shrink-0 pr-1">
          {/* Priority Ghost Dropdown */}
          <select
            value={taskPriority}
            onChange={e => setTaskPriority(e.target.value as any)}
            className="bg-transparent hover:bg-white/[0.04] text-zinc-400 hover:text-zinc-200 text-xs px-2 py-1 rounded-lg border-0 focus:outline-none cursor-pointer transition-colors"
          >
            <option value="low" className="bg-[#0f1115] text-zinc-300">Low</option>
            <option value="medium" className="bg-[#0f1115] text-zinc-300">Medium</option>
            <option value="high" className="bg-[#0f1115] text-zinc-300">High</option>
          </select>

          {/* Subject Ghost Dropdown */}
          <select
            value={taskSubjectId}
            onChange={e => setTaskSubjectId(e.target.value)}
            className="bg-transparent hover:bg-white/[0.04] text-zinc-400 hover:text-zinc-200 text-xs px-2 py-1 rounded-lg border-0 focus:outline-none cursor-pointer transition-colors max-w-[110px] truncate"
          >
            <option value="none" className="bg-[#0f1115] text-zinc-300">General</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id} className="bg-[#0f1115] text-zinc-300">
                {s.name}
              </option>
            ))}
          </select>

          {/* Add Button - quiet until text is typed, then accent-filled */}
          <button
            type="submit"
            disabled={!taskInput.trim()}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 flex items-center gap-1 active:scale-[0.98] ${
              taskInput.trim()
                ? 'bg-[var(--tier-accent)] text-slate-950 shadow-sm cursor-pointer hover:brightness-105'
                : 'bg-white/[0.04] text-zinc-500 border border-white/[0.05] cursor-not-allowed opacity-60'
            }`}
          >
            <span>Add</span>
            <span className="hidden sm:inline text-[10px] opacity-70">⏎</span>
          </button>
        </div>
      </form>

      {/* Task List Container with Hairline Separators */}
      <div className="flex flex-col flex-1 w-full pt-1">
        {/* Empty States */}
        {displayActiveTodos.length === 0 && displayCompletedTodos.length === 0 && filter === 'all' && (
          <div className="flex flex-col items-center justify-center text-center py-16 text-zinc-500">
            <CheckCircle2 className="w-8 h-8 text-zinc-600 mb-2 stroke-[1.5]" />
            <p className="text-sm text-zinc-400 font-normal">Nothing on your list. Add your first task above.</p>
          </div>
        )}

        {displayActiveTodos.length === 0 && filter !== 'all' && displayCompletedTodos.length === 0 && (
          <div className="text-center py-12 text-zinc-500 text-xs font-normal">
            No tasks found for this filter.
          </div>
        )}

        {/* Active Tasks List */}
        {displayActiveTodos.length > 0 && (
          <div className="divide-y divide-white/[0.06] border-y border-white/[0.06]">
            {displayActiveTodos.map(item => {
              const matchedSubject = item.subject_id ? subjects.find(s => s.id === item.subject_id) : null;
              const showSubject = matchedSubject && matchedSubject.name.trim().toLowerCase() !== item.task.trim().toLowerCase();

              return (
                <div
                  key={item.id}
                  data-todo-id={item.id}
                  draggable={draggableRowId === item.id}
                  onDragStart={e => {
                    if (
                      (e.target as HTMLElement).tagName === 'INPUT' ||
                      (e.target as HTMLElement).tagName === 'BUTTON' ||
                      (e.target as HTMLElement).tagName === 'SELECT' ||
                      (e.target as HTMLElement).closest('button')
                    ) {
                      e.preventDefault();
                      return;
                    }
                    setDraggingId(item.id);
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', item.id);
                  }}
                  onDragOver={e => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    if (draggingId && draggingId !== item.id) {
                      setDragOverId(item.id);
                      const rect = e.currentTarget.getBoundingClientRect();
                      const offset = e.clientY - rect.top;
                      setDragOverPosition(offset < rect.height / 2 ? 'above' : 'below');
                    }
                  }}
                  onDragLeave={e => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                      if (dragOverId === item.id) setDragOverId(null);
                    }
                  }}
                  onDrop={e => {
                    e.preventDefault();
                    handleItemDrop(item.id);
                  }}
                  onDragEnd={() => {
                    setDraggingId(null);
                    setDragOverId(null);
                    setDraggableRowId(null);
                  }}
                  className={`group flex items-center gap-3 py-3 px-2 sm:px-3 hover:bg-white/[0.02] transition-colors relative ${
                    draggingId === item.id
                      ? 'opacity-30'
                      : dragOverId === item.id
                      ? dragOverPosition === 'above'
                        ? 'border-t-2 !border-t-[var(--tier-accent)]'
                        : 'border-b-2 !border-b-[var(--tier-accent)]'
                      : ''
                  }`}
                >
                  {/* Drag Handle - visible on hover/focus and mobile touch */}
                  <div
                    role="button"
                    aria-label="Drag to reorder"
                    title="Drag to reorder"
                    draggable={true}
                    onMouseEnter={() => setDraggableRowId(item.id)}
                    onMouseLeave={() => {
                      if (!draggingId) setDraggableRowId(null);
                    }}
                    onDragStart={e => {
                      setDraggingId(item.id);
                      setDraggableRowId(item.id);
                      e.dataTransfer.effectAllowed = 'move';
                      e.dataTransfer.setData('text/plain', item.id);
                    }}
                    onTouchStart={() => {
                      setDraggingId(item.id);
                    }}
                    onTouchMove={e => {
                      const touch = e.touches[0];
                      const targetElem = document.elementFromPoint(touch.clientX, touch.clientY);
                      const rowElem = targetElem?.closest('[data-todo-id]');
                      if (rowElem) {
                        const targetId = rowElem.getAttribute('data-todo-id');
                        if (targetId && targetId !== item.id) {
                          setDragOverId(targetId);
                          const rect = rowElem.getBoundingClientRect();
                          setDragOverPosition(touch.clientY - rect.top < rect.height / 2 ? 'above' : 'below');
                        }
                      }
                    }}
                    onTouchEnd={() => {
                      if (dragOverId && draggingId && dragOverId !== draggingId) {
                        handleItemDrop(dragOverId);
                      } else {
                        setDraggingId(null);
                        setDragOverId(null);
                        setDraggableRowId(null);
                      }
                    }}
                    className="p-1 -ml-1 rounded cursor-grab active:cursor-grabbing text-zinc-500 hover:text-zinc-200 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 max-md:opacity-60 transition-opacity shrink-0"
                  >
                    <GripVertical className="w-3.5 h-3.5" />
                  </div>

                  {/* Clean Checkbox */}
                  <button
                    type="button"
                    onClick={() => handleToggleTask(item.id, item.is_completed)}
                    aria-label="Mark task complete"
                    className="w-4 h-4 rounded border border-white/20 hover:border-white/50 bg-white/[0.03] transition-colors flex items-center justify-center shrink-0 cursor-pointer active:scale-90"
                  />

                  {/* Priority Dot */}
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      item.priority === 'high'
                        ? 'bg-rose-400'
                        : item.priority === 'medium'
                        ? 'bg-amber-400'
                        : 'bg-blue-400'
                    }`}
                    title={`${item.priority || 'medium'} priority`}
                  />

                  {/* Title & Subject */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <input
                      type="text"
                      value={item.task}
                      onChange={e => handleUpdateTaskText(item.id, e.target.value)}
                      className="w-full bg-transparent text-sm text-white/90 font-normal focus:outline-none py-0.5 truncate"
                    />
                    {showSubject && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: matchedSubject.color || '#64748B' }}
                        />
                        <span className="text-[11px] text-zinc-400 font-normal truncate">
                          {matchedSubject.name}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Icons (Hover/Focus / Touch visible) */}
                  <div className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 max-md:opacity-100 flex items-center gap-1 transition-opacity shrink-0">
                    <button
                      type="button"
                      onClick={() => handleFocusTask(item.subject_id)}
                      title="Focus this task"
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                    >
                      <CircleDot className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTask(item.id)}
                      title="Delete task"
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Completed Tasks Accordion */}
        {displayCompletedTodos.length > 0 && (
          <div className="pt-5 mt-2">
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={() => setIsCompletedOpen(!isCompletedOpen)}
                className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer select-none font-medium"
              >
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${isCompletedOpen ? '' : '-rotate-90'}`}
                />
                <span>Completed ({displayCompletedTodos.length})</span>
              </button>
              <button
                type="button"
                onClick={handleClearCompleted}
                className="text-[11px] text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer px-2 py-0.5 rounded hover:bg-white/[0.04]"
              >
                Clear completed
              </button>
            </div>

            {isCompletedOpen && (
              <div className="divide-y divide-white/[0.04] border-y border-white/[0.04]">
                {displayCompletedTodos.map(item => (
                  <div
                    key={item.id}
                    className="group flex items-center gap-3 py-2.5 px-2 sm:px-3 hover:bg-white/[0.01] transition-colors relative"
                  >
                    <div className="w-3.5 shrink-0" />
                    {/* Checkbox filled with accent & drawn stroke-dashoffset checkmark */}
                    <button
                      type="button"
                      onClick={() => handleToggleTask(item.id, item.is_completed)}
                      aria-label="Mark task incomplete"
                      className="w-4 h-4 rounded flex items-center justify-center transition-all cursor-pointer active:scale-90 shrink-0"
                      style={{ backgroundColor: 'var(--tier-accent)' }}
                    >
                      <svg className="w-2.5 h-2.5 text-slate-950" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" className="task-check-path" />
                      </svg>
                    </button>

                    {/* Strikethrough Muted Title */}
                    <div className="flex-1 min-w-0">
                      <span className="block text-sm text-zinc-500 line-through truncate">
                        {item.task}
                      </span>
                    </div>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleDeleteTask(item.id)}
                      title="Delete task"
                      className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 max-md:opacity-100 text-zinc-500 hover:text-rose-400 p-1.5 transition-colors cursor-pointer shrink-0 rounded-lg"
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
