'use client';

import React, { useState } from 'react';
import { useStudy } from '../../context/StudyContext';
import { Subject } from '../../types';
import { X, Plus, Edit2, Trash2, BookOpen, Check, Palette } from 'lucide-react';

interface SubjectManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COLOR_PRESETS = [
  '#5A6B6A', // Muted Teal-Gray
  '#10B981', // Emerald
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F59E0B', // Amber
  '#06B6D4', // Cyan
  '#EF4444', // Red
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#6366F1', // Indigo
];

export function SubjectManagerModal({ isOpen, onClose }: SubjectManagerModalProps) {
  const { subjects, addSubject, updateSubject, deleteSubject } = useStudy();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLOR_PRESETS[0]);
  const [targetMinutes, setTargetMinutes] = useState(90);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartCreate = () => {
    setName('');
    setColor(COLOR_PRESETS[Math.floor(Math.random() * COLOR_PRESETS.length)]);
    setTargetMinutes(90);
    setEditingId(null);
    setErrorMessage(null);
    setDeletingId(null);
    setIsCreating(true);
  };

  const handleStartEdit = (sub: Subject) => {
    setName(sub.name);
    setColor(sub.color);
    setTargetMinutes(sub.targetMinutesPerDay || 90);
    setEditingId(sub.id);
    setErrorMessage(null);
    setDeletingId(null);
    setIsCreating(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    // Check duplicate name
    const isDuplicate = subjects.some(
      s => s.id !== editingId && s.name.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (isDuplicate) {
      setErrorMessage(`A subject named "${trimmed}" already exists.`);
      return;
    }
    setErrorMessage(null);

    if (editingId) {
      updateSubject(editingId, {
        name: trimmed,
        color,
        targetMinutesPerDay: Number(targetMinutes),
      });
      setEditingId(null);
    } else {
      addSubject({
        name: trimmed,
        color,
        targetMinutesPerDay: Number(targetMinutes),
      });
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await deleteSubject(id);
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
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
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Create / Edit Form */}
        {(isCreating || editingId) && (
          <form onSubmit={handleSubmit} className="my-4 p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                {editingId ? 'Edit Subject' : 'Add New Subject'}
              </h4>
              <button
                type="button"
                onClick={() => { setIsCreating(false); setEditingId(null); setErrorMessage(null); }}
                className="text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Subject Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => {
                  setName(e.target.value);
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
                    onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-full border-2 transition-transform ${
                      color === c ? 'scale-125 border-white shadow-lg' : 'border-transparent hover:scale-110'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <input
                  type="color"
                  value={color}
                  onChange={e => setColor(e.target.value)}
                  className="w-7 h-7 rounded-full cursor-pointer bg-transparent border-0"
                  title="Custom hex color"
                />
              </div>
            </div>

            {/* Target Daily Minutes */}
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Daily Target Time:</span>
                <span className="font-bold text-emerald-400">{Math.floor(targetMinutes / 60)}h {targetMinutes % 60}m</span>
              </div>
              <input
                type="range"
                min="15"
                max="360"
                step="15"
                value={targetMinutes}
                onChange={e => setTargetMinutes(parseInt(e.target.value))}
                className="w-full accent-emerald-500 bg-slate-900 cursor-pointer"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>{editingId ? 'Update Subject' : 'Create Subject'}</span>
            </button>
          </form>
        )}

        {/* Add button if not form open */}
        {!isCreating && !editingId && (
          <button
            type="button"
            onClick={handleStartCreate}
            className="w-full my-4 py-2.5 px-4 rounded-xl border border-dashed border-emerald-500/50 hover:border-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Subject</span>
          </button>
        )}

        {/* Subjects list */}
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {subjects.map(sub => (
            <div
              key={sub.id}
              className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between hover:border-slate-600 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div
                  className="w-4 h-4 rounded-full shadow-sm flex-shrink-0"
                  style={{ backgroundColor: sub.color }}
                />
                <div className="truncate">
                  <div className="font-bold text-sm text-white truncate">{sub.name}</div>
                  <div className="text-[11px] text-slate-400">
                    Target: {Math.floor((sub.targetMinutesPerDay || 60) / 60)}h {(sub.targetMinutesPerDay || 60) % 60}m / day
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                {deletingId === sub.id ? (
                  <div className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/30 px-2 py-1 rounded-lg text-xs animate-in fade-in">
                    <span className="text-rose-300 font-medium text-[11px]">Delete?</span>
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={() => handleDelete(sub.id)}
                      className="px-2 py-0.5 rounded bg-rose-500 hover:bg-rose-600 text-white font-semibold transition-colors disabled:opacity-50 text-[11px]"
                    >
                      {isDeleting ? '...' : 'Yes'}
                    </button>
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={() => setDeletingId(null)}
                      className="px-1.5 py-0.5 rounded text-slate-400 hover:text-white transition-colors text-[11px]"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleStartEdit(sub)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                      title="Edit Subject"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingId(sub.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition-colors"
                      title="Delete Subject"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 mt-4 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
