'use client';

import React, { useEffect, useState } from 'react';
import { Target, X, Quote as QuoteIcon } from 'lucide-react';
import { useRankTheme } from '../../hooks/useRankTheme';
import { getDailyQuote } from '../../lib/quotes';

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
  onStartFocusing,
  streakDays,
}: DailyBoostModalProps) {
  const { theme } = useRankTheme();
  const [quoteData, setQuoteData] = useState({ text: '', author: '' });

  const [hasDismissed, setHasDismissed] = useState(true); // default true to avoid flash

  useEffect(() => {
    setQuoteData(getDailyQuote());
    const key = 'directive_dismissed_' + new Date().toISOString().slice(0, 10);
    if (!localStorage.getItem(key)) {
      setHasDismissed(false);
    }
  }, []);

  if (!isOpen || hasDismissed) return null;

  const handleAcknowledge = () => {
    const key = 'directive_dismissed_' + new Date().toISOString().slice(0, 10);
    localStorage.setItem(key, 'true');
    setHasDismissed(true);
    onClose();
  };

  const handleStart = () => {
    const key = 'directive_dismissed_' + new Date().toISOString().slice(0, 10);
    localStorage.setItem(key, 'true');
    setHasDismissed(true);
    if (onStartFocusing) onStartFocusing();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="relative w-full max-w-md bg-[#0c0d12]/40 border backdrop-blur-3xl rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.7)] p-6 sm:p-8 text-center overflow-hidden animate-in zoom-in-95 duration-300"
        style={{ borderColor: `${theme.accent}40` }}
      >
        {/* Background glow effects */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-[100px] opacity-10 pointer-events-none"
          style={{ backgroundColor: theme.accent }}
        />

        {/* Close Button */}
        <button
          onClick={handleAcknowledge}
          className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="relative z-10 flex flex-col items-center mt-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-hud font-black tracking-widest uppercase mb-6" style={{ color: theme.accent }}>
            <Target className="w-3.5 h-3.5" />
            <span>DAILY DIRECTIVE</span>
          </div>

          {/* Quote Section */}
          <div className="relative px-4 py-6 w-full flex flex-col items-center justify-center">
            <QuoteIcon className="absolute top-0 left-2 w-8 h-8 opacity-20 transform -scale-x-100 -translate-y-1/2" style={{ color: theme.accent }} />
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug text-center" style={{ textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}>
              &ldquo;{quoteData.text}&rdquo;
            </h2>
            <p className="mt-4 text-sm font-semibold tracking-wide text-neutral-400 uppercase">
              — {quoteData.author}
            </p>
          </div>
          
          <button
            onClick={handleStart}
            className="w-full mt-6 py-3.5 px-6 rounded-2xl text-black font-black text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-[0.98]"
            style={{ background: theme.gradient, boxShadow: `0 4px 20px ${theme.accent}40` }}
          >
            <span>Acknowledge & Begin</span>
          </button>
        </div>
      </div>
    </div>
  );
}
