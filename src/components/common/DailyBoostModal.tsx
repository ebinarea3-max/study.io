'use client';

import React, { useEffect } from 'react';
import { Flame, X } from 'lucide-react';
import { useRankTheme } from '../../hooks/useRankTheme';

interface DailyBoostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartFocusing?: () => void;
  streakDays: number;
  dailyGoalHours?: number;
}

export function DailyBoostModal({
  isOpen,
  onClose,
  streakDays,
}: DailyBoostModalProps) {
  const { theme } = useRankTheme();

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-none">
      <div 
        className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#0c0d12]/95 border backdrop-blur-xl shadow-2xl"
        style={{ borderColor: `${theme.accent}30` }}
      >
        <div 
          className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 border"
          style={{ borderColor: `${theme.accent}40`, color: theme.accent }}
        >
          <Flame className="w-4 h-4 fill-current" />
        </div>
        <div className="flex flex-col pr-4">
          <span className="text-[10px] font-hud font-bold tracking-widest text-slate-400 uppercase">
            DAILY CATALYST ACTIVE
          </span>
          <span className="text-sm font-bold text-white tracking-tight">
            🔥 Day {streakDays} Streak
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
