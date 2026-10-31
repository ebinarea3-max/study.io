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
  Sparkles,
} from 'lucide-react';
import { useRankTheme } from '../../hooks/useRankTheme';
import { useStudy } from '../../context/StudyContext';
import toast from 'react-hot-toast';
import { parseSmartTasks, isMultiTaskPaste } from '../../lib/smartTaskParser';

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
  const [bulkAddFeedback, setBulkAddFeedback] = useState<{ count: number; visible: boolean }>({ count: 0, visible: false });

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

  // 3a. Bulk Add Tasks: Optimistic batch update + Supabase batch insert + UUID replacement
  const handleBulkAddTasks = async (taskTitles: string[]) => {
    if (!taskTitles || taskTitles.length === 0) return;

    inFlightOpsRef.current += 1;
    const now = Date.now();

    const optimisticItems: DailyTodo[] = taskTitles.map((task, idx) => ({
      id: `temp-${now}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      task,
      is_completed: false,
      priority: taskPriority,
      subject_id: taskSubjectId === 'none' ? undefined : taskSubjectId,
      created_at: new Date(now + idx * 50).toISOString(),
    }));

    // Immediately update local state and fallback localStorage in a single batch
    setTodos(prev => {
      const updated = [...prev, ...optimisticItems];
      saveLocal(updated);
      return updated;
    });

    setTaskInput('');
    soundFx.playReactionPop();

    // Show temporary feedback indicator
    setBulkAddFeedback({
      count: taskTitles.length,
      visible: true,
    });
    setTimeout(() => {
      setBulkAddFeedback(prev => ({ ...prev, visible: false }));
    }, 4500);

    // Toast UX feedback
    toast.success(`Added ${taskTitles.length} task${taskTitles.length === 1 ? '' : 's'} to your list`, {
      icon: '✨',
      style: {
        borderRadius: '12px',
        background: 'var(--surface, #1e293b)',
        color: 'var(--text, #ffffff)',
        border: '1px solid var(--border, rgba(255, 255, 255, 0.1))',
        fontSize: '13px',
        fontWeight: '600',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
      },
      duration: 3500,
    });

    const supabase = getSupabase();
    if (!supabase) {
      inFlightOpsRef.current = Math.max(0, inFlightOpsRef.current - 1);
      return;
    }

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        inFlightOpsRef.current = Math.max(0, inFlightOpsRef.current - 1);
        return;
      }

      const rows = optimisticItems.map(item => ({
        task: item.task,
        is_completed: false,
        user_id: user.id,
        priority: item.priority,
        subject_id: item.subject_id || null,
        created_at: item.created_at,
      }));

      const { data, error } = await supabase
        .from('todos')
        .insert(rows)
        .select();

      if (error) {
        console.error('Supabase bulk insert error:', error);
      } else if (data && Array.isArray(data)) {
        const realTodos = data.map(normalizeTodo);
        const tempIdSet = new Set(optimisticItems.map(item => item.id));

        setTodos(prev => {
          const updated = prev.map(t => {
            if (!tempIdSet.has(t.id)) return t;
            const match = realTodos.find(r => r.task === t.task);
            return match ? { ...t, id: match.id, user_id: match.user_id } : t;
          });
          saveLocal(updated);
          return updated;
        });
      }
    } catch (err) {
      console.error('Supabase bulk insert exception:', err);
    } finally {
      inFlightOpsRef.current = Math.max(0, inFlightOpsRef.current - 1);
    }
  };

  // 3b. Intercept Multi-line Paste (onPaste)
  const handleInputPaste = async (e: React.ClipboardEvent<HTMLInputElement>) => {
    const clipboardText = e.clipboardData.getData('text');
    if (!clipboardText) return;

    if (isMultiTaskPaste(clipboardText)) {
      const parsedTasks = parseSmartTasks(clipboardText);
      if (parsedTasks.length > 1) {
        e.preventDefault();
        await handleBulkAddTasks(parsedTasks);
        return;
      } else if (parsedTasks.length === 1 && clipboardText.includes('\n')) {
        // Prevent raw newline block in single-line input, insert cleaned task title
        e.preventDefault();
        setTaskInput(parsedTasks[0]);
        return;
      }
    }
  };

  // 3c. Add Task: Supports single task or multi-line/smart split submission
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawInput = taskInput.trim();
    if (!rawInput) return;

    // Check if the input contains multiple tasks (e.g. pasted or typed with markers or newlines)
    const parsedTasks = parseSmartTasks(rawInput);
    if (parsedTasks.length > 1) {
      await handleBulkAddTasks(parsedTasks);
      return;
    }

    const newTaskText = parsedTasks.length === 1 ? parsedTasks[0] : rawInput;

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
    <div className="space-y-4 sm:space-y-6 relative flex flex-col min-h-[70vh] w-full">
      {/* HUD Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)] relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[var(--accent-soft)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)] shadow-[0_0_20px_var(--glow)]">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-hud font-bold tracking-widest uppercase text-[var(--text)] drop-shadow-md flex items-center gap-2">
              TO DO LIST
              {todos.length > 0 && progressPercent === 100 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse">ALL CLEARED</span>
              )}
            </h2>
            <div className="text-xs text-[var(--text-dim)] font-mono tracking-wider mt-0.5">
              <span className="text-[var(--accent)] font-bold">{completedTodos.length}</span> / {todos.length} COMPLETED
            </div>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {(['all', 'active', 'completed', 'high'] as const).map(f => (
            <button
              type="button"
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg font-hud-mono text-[10px] sm:text-xs font-bold tracking-wider uppercase transition-all whitespace-nowrap cursor-pointer shadow-card ${
                filter === f
                  ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-[0_0_15px_var(--glow)]'
                  : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]'
              }`}
            >
              {f === 'high' ? 'High Priority' : f}
            </button>
          ))}
        </div>
      </div>

      {/* Progress Bar */}
      {todos.length > 0 && (
        <div className="h-1.5 w-full rounded-full bg-[var(--surface-2)] overflow-hidden border border-[var(--border)] relative z-10 shadow-inner">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_var(--glow)]"
            style={{
              width: `${progressPercent}%`,
              backgroundColor: 'var(--accent)',
            }}
          />
        </div>
      )}

      {/* Quick Add Bar */}
      <form
        onSubmit={handleAddTask}
        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3 sm:p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-card focus-within:border-[var(--accent)] focus-within:ring-1 focus-within:ring-[var(--accent)]/30 transition-all relative z-10"
      >
        <div className="flex-1 flex items-center gap-3 px-1">
          <Plus className="w-5 h-5 text-[var(--text-dim)] flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={taskInput}
            onChange={e => setTaskInput(e.target.value)}
            onPaste={handleInputPaste}
            placeholder="Add mission objective... (or paste multi-line list)"
            className="w-full bg-transparent text-sm sm:text-base text-[var(--text)] placeholder:text-[var(--text-faint)] focus:outline-none font-sans py-1"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 pl-2 sm:pl-0 sm:border-l sm:border-fg/10 pt-2 sm:pt-0 border-t border-fg/10 sm:border-t-0">
          {/* Priority Toggle */}
          <button
            type="button"
            onClick={() => {
              const order: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];
              setTaskPriority(order[(order.indexOf(taskPriority) + 1) % 3]);
            }}
            className={`px-2.5 py-1.5 rounded-lg font-hud-mono text-[10px] font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 border cursor-pointer ${
              taskPriority === 'high'
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                : taskPriority === 'medium'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
            }`}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                taskPriority === 'high'
                  ? 'bg-rose-500'
                  : taskPriority === 'medium'
                  ? 'bg-amber-500'
                  : 'bg-blue-500'
              }`}
            />
            {taskPriority}
          </button>

          {/* Subject Selector */}
          <select
            value={taskSubjectId}
            onChange={e => setTaskSubjectId(e.target.value)}
            className="px-2 py-1.5 rounded-lg bg-fg/[0.05] border border-fg/10 text-[var(--text)] text-[10px] font-hud-mono uppercase tracking-wider focus:outline-none focus:border-[var(--accent)]/50 focus:ring-1 focus:ring-[var(--accent)]/20 cursor-pointer"
          >
            <option value="none" className="bg-[var(--surface)] text-[var(--text)]">General</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id} className="bg-[var(--surface)] text-[var(--text)]">
                {s.name}
              </option>
            ))}
          </select>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!taskInput.trim()}
            className="ml-auto sm:ml-2 px-4 py-1.5 text-xs font-hud-mono font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95 hover:brightness-110 shadow-sm"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-contrast)' }}
          >
            ADD <span className="hidden sm:inline font-sans text-[10px] opacity-60 ml-1">⏎</span>
          </button>
        </div>
      </form>

      {/* Bulk Add Feedback Banner */}
      {bulkAddFeedback.visible && (
        <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-hud-mono tracking-wider animate-in fade-in slide-in-from-top-2 duration-200 shadow-sm relative z-10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
            <span>
              Added <strong>{bulkAddFeedback.count}</strong> task{bulkAddFeedback.count === 1 ? '' : 's'} from your list!
            </span>
          </div>
          <button
            type="button"
            onClick={() => setBulkAddFeedback(prev => ({ ...prev, visible: false }))}
            className="text-amber-400/70 hover:text-amber-300 p-0.5 cursor-pointer text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Task List Container */}
      <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-1 sm:pr-2 select-none relative z-10">
        {/* Empty States */}
        {displayActiveTodos.length === 0 && displayCompletedTodos.length === 0 && filter === 'all' && (
          <div className="m-auto flex flex-col items-center justify-center text-center py-12 opacity-60">
            <div className="w-16 h-16 rounded-full border border-dashed border-fg/20 flex items-center justify-center mb-4 bg-fg/[0.02]">
              <CheckCircle2 className="w-8 h-8 text-[var(--text-dim)]" />
            </div>
            <p className="text-[var(--text-dim)] font-hud-mono font-bold tracking-widest uppercase">No Active Directives</p>
            <p className="text-xs text-[var(--text-faint)] mt-2 font-sans">Add an objective above to begin your mission.</p>
          </div>
        )}

        {displayActiveTodos.length === 0 && filter !== 'all' && displayCompletedTodos.length === 0 && (
          <div className="text-center py-8 text-[var(--text-faint)] font-hud-mono text-xs uppercase tracking-wider">
            No tasks match the current filter.
          </div>
        )}

        {/* Active (Uncompleted) Tasks */}
        {displayActiveTodos.length > 0 && (
          <div className="space-y-1.5">
            {displayActiveTodos.map(item => (
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
                className={`group flex items-center gap-3 px-3 py-2.5 sm:py-3 rounded-xl transition-all duration-200 relative overflow-hidden bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-2)] hover:border-[var(--border-strong)] shadow-card ${
                  draggingId === item.id
                    ? 'opacity-30 border-dashed !border-[var(--accent)]/50'
                    : dragOverId === item.id
                    ? dragOverPosition === 'above'
                      ? 'border-t-2 !border-t-[var(--accent)]'
                      : 'border-b-2 !border-b-[var(--accent)]'
                    : ''
                }`}
              >
                {/* Priority Left-Border Indicator */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${
                    item.priority === 'high'
                      ? 'bg-rose-500'
                      : item.priority === 'medium'
                      ? 'bg-amber-500'
                      : 'bg-blue-500'
                  }`}
                />

                {/* Grip Drag Handle */}
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
                  className="p-1.5 -ml-1 rounded cursor-grab active:cursor-grabbing text-[var(--text-faint)] hover:text-[var(--text)] opacity-40 group-hover:opacity-100 transition-all hover:bg-fg/[0.08] flex-shrink-0"
                >
                  <GripVertical className="w-4 h-4" />
                </div>

                {/* Cyberpunk Checkbox */}
                <button
                  type="button"
                  onClick={() => handleToggleTask(item.id, item.is_completed)}
                  aria-label="Mark task complete"
                  className="w-5 h-5 sm:w-6 sm:h-6 rounded-md border-2 border-[var(--border-strong)] hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] transition-all flex items-center justify-center flex-shrink-0 cursor-pointer active:scale-90 shadow-inner"
                />

                {/* Content */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <input
                    type="text"
                    value={item.task}
                    onChange={e => handleUpdateTaskText(item.id, e.target.value)}
                    className="w-full bg-transparent text-[13px] sm:text-[15px] text-fg/95 font-medium focus:text-[var(--text)] focus:outline-none py-0.5 tracking-wide leading-relaxed font-sans placeholder:text-fg/30"
                  />
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {item.subject_id && subjects.find(s => s.id === item.subject_id) && (
                      <span className="px-1.5 py-0.5 rounded bg-fg/10 text-fg/70 text-[9px] font-hud-mono tracking-wider uppercase border border-fg/5 truncate max-w-[120px]">
                        {subjects.find(s => s.id === item.subject_id)?.name}
                      </span>
                    )}
                    {item.priority === 'high' && (
                      <span className="text-[9px] font-black text-rose-400 font-hud-mono tracking-wider uppercase flex items-center gap-1">
                        <Flag className="w-2.5 h-2.5" /> HIGH PRIORITY
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Menu (Hover) */}
                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity pl-2">
                  <button
                    type="button"
                    onClick={() => handleFocusTask(item.subject_id)}
                    title="Focus this task"
                    className="p-1.5 rounded-lg text-emerald-500/70 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer flex-shrink-0"
                  >
                    <CircleDot className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteTask(item.id)}
                    title="Delete item"
                    className="p-1.5 rounded-lg text-[var(--text-faint)] hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Completed Items */}
        {displayCompletedTodos.length > 0 && (
          <div className="pt-4 mt-2 border-t border-fg/[0.05]">
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={() => setIsCompletedOpen(!isCompletedOpen)}
                className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-dim)] hover:text-[var(--text)] transition-colors cursor-pointer select-none uppercase tracking-widest font-hud-mono"
              >
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-300 ${isCompletedOpen ? '' : '-rotate-90'}`}
                />
                <span>COMPLETED ({displayCompletedTodos.length})</span>
              </button>
              <button
                type="button"
                onClick={handleClearCompleted}
                className="font-hud-mono text-[10px] uppercase font-bold text-[var(--text-faint)] hover:text-rose-400 transition-colors cursor-pointer tracking-wider px-2 py-1 rounded hover:bg-rose-500/10"
              >
                CLEAR ALL
              </button>
            </div>

            {isCompletedOpen && (
              <div className="space-y-1">
                {displayCompletedTodos.map(item => (
                  <div
                    key={item.id}
                    className="group flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[var(--surface-2)] transition-colors bg-[var(--surface)]/50 border border-transparent shadow-card relative overflow-hidden"
                  >
                    <div className="w-4 flex-shrink-0" />
                    {/* Checked Box */}
                    <button
                      type="button"
                      onClick={() => handleToggleTask(item.id, item.is_completed)}
                      aria-label="Mark task incomplete"
                      className="w-5 h-5 sm:w-6 sm:h-6 rounded-md flex items-center justify-center transition-all cursor-pointer shadow-[0_0_10px_var(--glow)] active:scale-95 flex-shrink-0 z-10"
                      style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-contrast)' }}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </button>
                    {/* Strikethrough Content */}
                    <div className="flex-1 min-w-0 opacity-40 group-hover:opacity-60 transition-opacity z-10">
                      <span className="block text-xs sm:text-[14px] text-[var(--text)] line-through py-0.5 tracking-wide leading-relaxed font-sans truncate">
                        {item.task}
                      </span>
                    </div>
                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleDeleteTask(item.id)}
                      title="Delete item"
                      className="opacity-0 group-hover:opacity-100 text-[var(--text-faint)] hover:text-rose-500 p-1.5 transition-all cursor-pointer flex-shrink-0 rounded-lg hover:bg-rose-500/10 z-10"
                    >
                      <Trash2 className="w-4 h-4" />
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
