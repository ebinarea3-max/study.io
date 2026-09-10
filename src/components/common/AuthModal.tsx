'use client';

import React from 'react';
import { X } from 'lucide-react';
import { AuthCard } from './AuthCard';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'signin' | 'signup';
}

export function AuthModal({ isOpen, onClose, initialTab = 'signin' }: AuthModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800/90 rounded-3xl shadow-2xl p-6 sm:p-7 overflow-hidden">
        {/* Decorative ambient lighting */}
        <div className="absolute -top-24 -right-24 w-52 h-52 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-52 h-52 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400" />

        {/* Modal Close Button */}
        <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-400 flex items-center justify-center font-black text-slate-950 text-sm shadow-md shadow-emerald-500/20">
              ⚡
            </div>
            <span className="font-black text-base tracking-tight text-white">study.io</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auth Card embedded */}
        <AuthCard onSuccess={onClose} initialTab={initialTab} isModal />
      </div>
    </div>
  );
}
