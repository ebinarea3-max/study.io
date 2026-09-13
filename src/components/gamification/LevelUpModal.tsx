'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { soundFx } from '../../lib/audio';
import { getTierBadge } from '../../lib/gamification';
import { Sparkles, Trophy, ArrowRight, X } from 'lucide-react';

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
  useEffect(() => {
    if (!isOpen) return;

    // Trigger celebratory audio chime
    soundFx.playMilestoneBell();

    // Trigger celebratory fireworks/confetti burst
    const end = Date.now() + 2.5 * 1000;
    const colors = ['#10B981', '#06B6D4', '#8B5CF6', '#F59E0B', '#EC4899'];

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
  }, [isOpen]);

  if (!isOpen) return null;

  const tierBadge = getTierBadge(newLevel);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl p-6 sm:p-8 text-center overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Background glow effects */}
        <div
          className={`absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-[100px] opacity-40 pointer-events-none bg-gradient-to-br ${tierBadge.bgGradient}`}
        />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          title="Close celebration"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Celebration Header */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-emerald-500/20 to-cyan-500/20 border border-emerald-500/40 flex items-center justify-center text-3xl shadow-lg shadow-emerald-500/20 mb-3 animate-bounce">
            {tierBadge.icon || '⚡'}
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black tracking-widest uppercase mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Level Up!</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Congratulations!
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xs">
            Your focus and consistency have pushed you into a higher tier of mastery.
          </p>

          {/* Level Transition Pill */}
          <div className="my-6 w-full p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-around shadow-inner">
            <div className="text-center">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Previous</div>
              <div className="text-lg font-black text-slate-400 font-mono">Lv. {oldLevel}</div>
            </div>

            <div className="p-2 rounded-full bg-slate-800 text-emerald-400">
              <ArrowRight className="w-4 h-4" />
            </div>

            <div className="text-center">
              <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Current</div>
              <div className="text-2xl font-black text-white font-mono flex items-center justify-center gap-1">
                <span>Lv. {newLevel}</span>
              </div>
            </div>
          </div>

          {/* New Rank Badge */}
          <div className="w-full p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-xl shadow-sm">
                <Trophy className={`w-5 h-5 ${tierBadge.textColor}`} />
              </div>
              <div className="text-left">
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Unlocked Title</div>
                <div className={`text-base font-extrabold ${tierBadge.textColor}`}>
                  {title}
                </div>
              </div>
            </div>

            <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${tierBadge.badgeClass}`}>
              Tier Badge
            </span>
          </div>

          {/* Action Button */}
          <button
            onClick={onClose}
            className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm transition-all shadow-lg shadow-emerald-500/25 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <span>Keep Up The Momentum</span>
            <Sparkles className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
