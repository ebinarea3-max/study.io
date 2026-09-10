'use client';

import React, { useState } from 'react';
import { useRoom } from '../../context/RoomContext';
import { X, Lock, Globe, Plus, Sparkles, ShieldCheck } from 'lucide-react';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateRoomModal({ isOpen, onClose }: CreateRoomModalProps) {
  const { createRoom } = useRoom();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Room name is required.');
      return;
    }

    if (isPrivate && !passcode.trim()) {
      setError('Please provide a password for your private room.');
      return;
    }

    createRoom({
      name: trimmedName,
      description: description.trim() || 'Collaborative study space',
      category: 'general',
      tags: isPrivate ? ['Private', 'Focus'] : ['Public', 'Focus'],
      isPrivate,
      passcode: isPrivate ? passcode.trim() : undefined,
      maxMembers: 50,
      createdBy: 'user',
    });

    // Reset and close
    setName('');
    setDescription('');
    setIsPrivate(false);
    setPasscode('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-7 overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute -top-20 -right-20 w-44 h-44 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-white tracking-tight">Create Study Room</h3>
              <p className="text-xs text-slate-400">Launch a public or password-protected room</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Room Name */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
              Room Name <span className="text-emerald-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Midnight Coders 🌙 or Medical Sprint"
              className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              autoFocus
            />
          </div>

          {/* Description (Optional) */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
              Description / Focus Goal (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Silent focus on deep work and problem solving"
              className="w-full px-4 py-2 bg-slate-950/80 border border-slate-700/80 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Room Privacy Toggle */}
          <div className="pt-2 border-t border-slate-800/80">
            <label className="block text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">
              Access & Privacy
            </label>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setIsPrivate(false)}
                className={`p-3 rounded-2xl border text-left transition-all flex items-start gap-2.5 ${
                  !isPrivate
                    ? 'border-emerald-500 bg-emerald-500/10 text-white'
                    : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Globe className={`w-4 h-4 mt-0.5 flex-shrink-0 ${!isPrivate ? 'text-emerald-400' : 'text-slate-500'}`} />
                <div>
                  <div className="text-xs font-bold">Public Room</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Anyone can join instantly</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIsPrivate(true)}
                className={`p-3 rounded-2xl border text-left transition-all flex items-start gap-2.5 ${
                  isPrivate
                    ? 'border-amber-500 bg-amber-500/10 text-white'
                    : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Lock className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isPrivate ? 'text-amber-400' : 'text-slate-500'}`} />
                <div>
                  <div className="text-xs font-bold">Password Protected</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Requires passcode</div>
                </div>
              </button>
            </div>
          </div>

          {/* Password Input (if Private) */}
          {isPrivate && (
            <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-1.5 animate-in fade-in zoom-in-95 duration-150">
              <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Room Password / Passcode *</span>
              </label>
              <input
                type="text"
                required={isPrivate}
                value={passcode}
                onChange={e => setPasscode(e.target.value)}
                placeholder="e.g. 1234 or studypass"
                className="w-full px-3.5 py-2 bg-slate-950 border border-amber-500/40 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
              />
              <p className="text-[11px] text-slate-400">
                Only people who enter this password will be allowed to join.
              </p>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Create & Enter Room</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
