'use client';

import React, { useEffect } from 'react';
import { Target, X } from 'lucide-react';
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
  
  const xpBonus = streakDays * 50; // simple calculation for UI purposes

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-none">
      <div 
        className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#0c0d12]/95 border border-white/10 backdrop-blur-md shadow-2xl relative overflow-hidden"
      >
        <div 
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{ boxShadow: `inset 0 0 20px ${theme.accent}` }}
        />
        <div 
          className="relative flex items-center justify-center w-8 h-8 rounded-full bg-white/5 border"
          style={{ borderColor: `${theme.accent}40`, color: theme.accent }}
        >
          <Target className="w-4 h-4 fill-current opacity-80" />
        </div>
        <div className="relative flex flex-col pr-4">
          <span className="text-[10px] font-hud font-bold tracking-widest text-slate-400 uppercase">
            DAILY DIRECTIVE LOGGED
          </span>
          <span className="text-sm font-bold text-white tracking-tight">
            Streak multiplier maintained: Day {streakDays} • +{xpBonus} XP
          </span>
        </div>
        <button
          onClick={onClose}
          className="relative p-1 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
