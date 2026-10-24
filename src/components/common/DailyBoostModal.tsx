'use client';

import React, { useEffect, useState } from 'react';
import { Target, X, Quote as QuoteIcon } from 'lucide-react';
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="relative w-full max-w-md bg-[var(--surface)] border border-[var(--border)] backdrop-blur-3xl rounded-3xl shadow-card p-6 sm:p-8 text-center overflow-hidden animate-in zoom-in-95 duration-300 text-[var(--text)]"
      >
        {/* Background glow effects */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-[100px] opacity-20 pointer-events-none"
          style={{ backgroundColor: 'var(--accent)' }}
        />

        {/* Close Button */}
        <button
          onClick={handleAcknowledge}
          className="absolute top-4 right-4 p-2 text-[var(--text-dim)] hover:text-[var(--text)] rounded-xl hover:bg-fg/[0.08] transition-colors cursor-pointer"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="relative z-10 flex flex-col items-center mt-2">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--accent-soft)] border border-[var(--border)] text-[11px] font-hud font-black tracking-widest uppercase mb-6"
            style={{ color: 'var(--accent)' }}
          >
            <Target className="w-3.5 h-3.5" />
            <span>DAILY DIRECTIVE</span>
          </div>

          {/* Quote Section */}
          <div className="relative px-4 py-6 w-full flex flex-col items-center justify-center">
            <QuoteIcon
              className="absolute top-0 left-2 w-8 h-8 opacity-20 transform -scale-x-100 -translate-y-1/2"
              style={{ color: 'var(--accent)' }}
            />
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--text)] tracking-tight leading-snug text-center">
              &ldquo;{quoteData.text}&rdquo;
            </h2>
            <p className="mt-4 text-sm font-semibold tracking-wide text-[var(--text-dim)] uppercase">
              — {quoteData.author}
            </p>
          </div>
          
          <button
            onClick={handleStart}
            className="w-full mt-6 py-3.5 px-6 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-[0.98] hover:brightness-110"
            style={{
              backgroundColor: 'var(--accent)',
              color: 'var(--accent-contrast)',
              boxShadow: '0 4px 20px var(--glow)',
            }}
          >
            <span>Acknowledge & Begin</span>
          </button>
        </div>
      </div>
    </div>
  );
}
