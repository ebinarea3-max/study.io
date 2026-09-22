'use client';

import React, { useState } from 'react';
import { useStudy } from '../../context/StudyContext';
import { useAuth } from '../../context/AuthContext';
import { Subject } from '../../types';
import { X, Plus, Edit2, Trash2, BookOpen, Check, Palette, AlertTriangle, Loader2 } from 'lucide-react';
import { createPortal } from 'react-dom';

interface SubjectManagerModalProps {
  isOpen?: boolean;
  onClose: () => void;
  subjects?: Subject[];
}

const COLOR_PRESETS = [
  '#10B981', // Emerald
  '#5A6B6A', // Muted Teal-Gray
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F59E0B', // Amber
  '#06B6D4', // Cyan
  '#EF4444', // Red
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#6366F1', // Indigo
];

export function SubjectManagerModal({ isOpen = true, onClose, subjects: propsSubjects }: SubjectManagerModalProps) {
  const { user } = useAuth();
  const { subjects: contextSubjects = [], addSubject, updateSubject, deleteSubject } = useStudy();

  // 2. Fallback State & Schema Defense inside SubjectManager
  const rawSubjects = propsSubjects ?? contextSubjects;
  const subjectsList = Array.isArray(rawSubjects) ? rawSubjects : [];
  const activeSubjects = subjectsList.filter(s => s && !s.is_archived);

  // Null-Safety for Active & Editing State: null initial state (never an empty object {})
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [colorInput, setColorInput] = useState('#10b981');
  const [targetMinutesInput, setTargetMinutesInput] = useState(60);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingSubject, setDeletingSubject] = useState<Subject | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If component is mounted with isOpen === false, return null
  if (!isOpen) return null;

  // 3. Fix the "Add New Subject" Handler with fallback defaults
  const handleCreateSubject = async (name: string, color = '#10b981', targetMinutes = 60) => {
    const trimmed = (name || '').trim();
    if (!trimmed) {
      setErrorMessage('Please enter a subject name.');
      return;
    }

    // Check duplicate name among active subjects
    const isDuplicate = activeSubjects.some(
      s => s && s.id !== editingSubject?.id && ((s.name || (s as any).title || '').trim().toLowerCase() === trimmed.toLowerCase())
    );
    if (isDuplicate) {
      setErrorMessage(`A subject named "${trimmed}" already exists.`);
      return;
    }
    setErrorMessage(null);

    const safeColor = color || '#10b981';
    const safeTarget = Number(targetMinutes) || 60;

    try {
      if (editingSubject?.id) {
        await updateSubject(editingSubject.id, {
          name: trimmed,
          color: safeColor,
          daily_goal_minutes: safeTarget,
          targetMinutesPerDay: safeTarget,
        });
        setEditingSubject(null);
      } else {
        const newSubject = {
          name: trimmed,
          color: safeColor,
          daily_goal_minutes: safeTarget,
          targetMinutesPerDay: safeTarget,
          userId: user?.id,
        };
        await addSubject(newSubject);
        setIsCreating(false);
      }
      setNameInput('');
    } catch (err: any) {
      console.error('Failed to create/update subject:', err);
      setErrorMessage(err?.message || 'Failed to save subject. Please try again.');
    }
  };

  const handleStartCreate = () => {
    setEditingSubject(null);
    setNameInput('');
    setColorInput(COLOR_PRESETS[Math.floor(Math.random() * COLOR_PRESETS.length)] || '#10b981');
    setTargetMinutesInput(60);
    setErrorMessage(null);
    setDeletingSubject(null);
    setIsCreating(true);
  };

  const handleStartEdit = (sub: Subject) => {
    if (!sub || typeof sub !== 'object') return;
    setEditingSubject(sub);
    setNameInput(sub.name || (sub as any).title || '');
    setColorInput(sub.color || '#10b981');
    const mins = sub.daily_goal_minutes ?? sub.targetMinutesPerDay ?? 60;
    setTargetMinutesInput(mins);
    setErrorMessage(null);
    setDeletingSubject(null);
    setIsCreating(false);
  };

  const handleCloseForm = () => {
    setIsCreating(false);
    setEditingSubject(null);
    setNameInput('');
    setErrorMessage(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingSubject?.id) return;
    setIsDeleting(true);
    try {
      await deleteSubject(deletingSubject.id);
      setDeletingSubject(null);
    } catch (err: any) {
      console.error('Failed to delete subject:', err);
      setErrorMessage(err?.message || 'Failed to delete subject.');
    } finally {
      setIsDeleting(false);
    }
  };

  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen) return null;
  
  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Manage Subjects</h3>
              <p className="text-xs text-slate-400">Add, customize, or remove study topics</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Create / Edit Form */}
        {(isCreating || editingSubject) && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCreateSubject(nameInput, colorInput, targetMinutesInput);
            }}
            className="my-4 p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                {editingSubject ? 'Edit Subject' : 'Add New Subject'}
              </h4>
              <button
                type="button"
                onClick={handleCloseForm}
                className="text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Subject Name</label>
              <input
                type="text"
                required
                value={nameInput}
                onChange={e => {
                  setNameInput(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="e.g. Organic Chemistry, Linear Algebra..."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
              />
              {errorMessage && (
                <p className="text-xs text-rose-400 font-medium mt-1">{errorMessage}</p>
              )}
            </div>

            {/* Color preset picker */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1">
                <Palette className="w-3.5 h-3.5 text-emerald-400" />
                <span>Subject Color Badge</span>
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {COLOR_PRESETS.map(c => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setColorInput(c)}
                    className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer ${
                      colorInput === c ? 'scale-125 border-white shadow-lg' : 'border-transparent hover:scale-110'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <input
                  type="color"
                  value={colorInput}
                  onChange={e => setColorInput(e.target.value)}
                  className="w-7 h-7 rounded-full cursor-pointer bg-transparent border-0"
                  title="Custom hex color"
                />
              </div>
            </div>

            {/* Target Daily Minutes */}
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Daily Target Time:</span>
                <span className="font-bold text-emerald-400">{Math.floor(targetMinutesInput / 60)}h {targetMinutesInput % 60}m</span>
              </div>
              <input
                type="range"
                min="15"
                max="360"
                step="15"
                value={targetMinutesInput}
                onChange={e => setTargetMinutesInput(parseInt(e.target.value) || 60)}
                className="w-full accent-emerald-500 bg-slate-900 cursor-pointer"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>{editingSubject ? 'Update Subject' : 'Create Subject'}</span>
            </button>
          </form>
        )}

        {/* 2. Fallback State & Schema Defense inside SubjectManager: Zero subjects view */}
        {activeSubjects.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-sm">
            No subjects yet. Add your first subject below!
          </div>
        ) : (
          /* Card list strictly guarded: maps safely with fallback title, color, and goal */
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {activeSubjects.map((subject) => {
              if (!subject || typeof subject !== 'object') return null;
              const title = subject.name || (subject as any).title || 'Untitled Subject';
              const color = subject.color || '#10b981';
              const goal = subject.daily_goal_minutes 
                ? `${Math.floor(subject.daily_goal_minutes / 60)}h ${subject.daily_goal_minutes % 60}m`
                : (subject.targetMinutesPerDay 
                  ? `${Math.floor(subject.targetMinutesPerDay / 60)}h ${subject.targetMinutesPerDay % 60}m`
                  : '1h 0m');

              return (
                <div
                  key={subject.id || Math.random()}
                  className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between hover:border-slate-600 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <span
                      style={{ backgroundColor: color }}
                      className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm inline-block mr-2"
                    />
                    <div className="truncate">
                      <div className="font-bold text-sm text-white truncate">{title}</div>
                      <div className="text-xs text-slate-400">Target: {goal} / day</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(subject)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
                      title="Edit Subject"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingSubject(subject)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition-colors cursor-pointer"
                      title="Delete Subject"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add button if not currently creating or editing */}
        {!isCreating && !editingSubject && (
          <button
            type="button"
            onClick={handleStartCreate}
            className="w-full my-4 py-2.5 px-4 rounded-xl border border-dashed border-emerald-500/50 hover:border-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add New Subject</span>
          </button>
        )}

        <div className="pt-4 mt-4 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deletingSubject && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm bg-[#0c0d12] border border-white/[0.1] rounded-2xl shadow-2xl p-5 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1 min-w-0">
                <h4 className="text-sm font-bold text-white tracking-tight">Delete Subject?</h4>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Are you sure you want to remove <span className="text-white font-semibold">{deletingSubject?.name || (deletingSubject as any)?.title || 'this subject'}</span>? It will be removed from your active list, but your past study records will be preserved.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.06]">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingSubject(null)}
                className="px-3.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-neutral-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white transition-all shadow-md shadow-rose-600/30 active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  
  if (!mounted || typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
}

// Export alias for compatibility
export const SubjectManager = SubjectManagerModal;
