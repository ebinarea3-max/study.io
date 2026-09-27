'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { soundFx } from '../../lib/audio';
import { Sparkles, ArrowRight, X } from 'lucide-react';
import { useRankTheme } from '../../hooks/useRankTheme';

interface LevelUpModalProps {
  isOpen: boolean;
  oldLevel: number;
  newLevel: number;
  title: string;
  onClose: () => void;
}

export function LevelUpModal({
  isOpen,
  oldLevel,
  newLevel,
  title,
  onClose,
}: LevelUpModalProps) {
  const { theme } = useRankTheme();

  useEffect(() => {
    if (!isOpen) return;

    soundFx.playMilestoneBell();

    const end = Date.now() + 2.5 * 1000;
    const colors = [theme.accent, '#FFFFFF', '#64748b'];

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.65 },
        colors: colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.65 },
        colors: colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, [isOpen, theme.accent]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-sm bg-[#0c0d12]/95 border border-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-8 text-center overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Background glow effects */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-[100px] opacity-15 pointer-events-none"
          style={{ backgroundColor: theme.accent }}
        />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          style={{ color: theme.accent }}
          title="Close celebration"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Celebration Header */}
        <div className="relative z-10 flex flex-col items-center mt-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-black tracking-widest uppercase mb-4" style={{ color: theme.accent }}>
            <Sparkles className="w-3.5 h-3.5" />
            <span>LEVEL UP</span>
          </div>

          {/* Level Transition Indicator */}
          <div className="flex items-center justify-center gap-4 my-2">
            <span className="text-lg font-black text-slate-500 font-mono">Lv. {oldLevel}</span>
            <ArrowRight className="w-4 h-4 text-slate-400" />
            <div className="relative">
              <div className="absolute inset-0 blur-md opacity-50" style={{ backgroundColor: theme.accent }} />
              <span className="relative text-5xl font-black text-white font-mono drop-shadow-md">
                {newLevel}
              </span>
            </div>
          </div>

          {/* Unlocked Title */}
          <div className="mt-8 mb-6">
            <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">
              New Title Unlocked
            </div>
            <div className="text-xl font-extrabold tracking-widest text-white uppercase drop-shadow-sm">
              {title}
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="w-full py-3 px-6 rounded-2xl text-black font-black text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-[0.98]"
            style={{ background: theme.gradient, boxShadow: `0 4px 20px ${theme.accent}40` }}
          >
            <span>Confirm & Continue</span>
          </button>
        </div>
      </div>
    </div>
  );
}
