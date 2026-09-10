'use client';

import React, { useState } from 'react';
import { useRoom } from '../../context/RoomContext';
import { StudyRoom } from '../../types';
import { Lock, X, KeyRound, AlertCircle, ArrowRight } from 'lucide-react';

interface PasswordPromptModalProps {
  room: StudyRoom | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PasswordPromptModal({ room, isOpen, onClose }: PasswordPromptModalProps) {
  const { enterRoom } = useRoom();
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !room) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) {
      setError('Please enter the room passcode.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const result = enterRoom(room.id, passcode);
    setIsSubmitting(false);

    if (result.success) {
      setPasscode('');
      setError('');
      onClose();
    } else {
      setError(result.error || 'Incorrect passcode. Access denied.');
    }
  };

  const handleClose = () => {
    setPasscode('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 overflow-hidden">
        {/* Ambient Amber Glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Lock className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Password Protected
            </span>
          </div>
          <button
            onClick={handleClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Room Info */}
        <div className="mt-4 mb-5 text-center">
          <h3 className="font-extrabold text-lg text-white tracking-tight">{room.name}</h3>
          <p className="text-xs text-slate-400 mt-1">
            This study room is private. Enter the passcode to join the study session.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <div className="relative">
            <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
            <input
              type="password"
              value={passcode}
              onChange={e => {
                setPasscode(e.target.value);
                if (error) setError('');
              }}
              placeholder="Enter passcode..."
              autoFocus
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !passcode.trim()}
              className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-extrabold text-xs transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5"
            >
              <span>Unlock</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
