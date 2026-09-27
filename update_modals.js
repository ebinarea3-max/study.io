const fs = require('fs');
const path = require('path');

function updateModals() {
    // 1. Update DailyBoostModal.tsx
    const dailyBoostPath = path.join(__dirname, 'src/components/common/DailyBoostModal.tsx');
    const newDailyBoostContent = `'use client';

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
        style={{ borderColor: \`\${theme.accent}30\` }}
      >
        <div 
          className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 border"
          style={{ borderColor: \`\${theme.accent}40\`, color: theme.accent }}
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
`;
    fs.writeFileSync(dailyBoostPath, newDailyBoostContent, 'utf8');
    console.log('Updated DailyBoostModal.tsx');


    // 2. Update LevelUpModal.tsx
    const levelUpPath = path.join(__dirname, 'src/components/gamification/LevelUpModal.tsx');
    const newLevelUpContent = `'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { soundFx } from '../../lib/audio';
import { getTierBadge } from '../../lib/gamification';
import { Sparkles, Trophy, ArrowRight, X } from 'lucide-react';
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
        className="relative w-full max-w-sm bg-[#0c0d12]/95 border backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-8 text-center overflow-hidden animate-in zoom-in-95 duration-200"
        style={{ borderColor: \`\${theme.accent}30\` }}
      >
        {/* Background glow effects */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-[100px] opacity-20 pointer-events-none"
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
            <span>Level Up!</span>
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
          <div className="mt-8 mb-2">
            <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">
              New Title Unlocked
            </div>
            <div className="text-xl font-extrabold tracking-widest text-white uppercase drop-shadow-sm">
              {title}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
`;
    fs.writeFileSync(levelUpPath, newLevelUpContent, 'utf8');
    console.log('Updated LevelUpModal.tsx');


    // 3. Update StudyTimer.tsx to rename TODAY'S BOOST to DAILY CATALYST
    const timerPath = path.join(__dirname, 'src/components/timer/StudyTimer.tsx');
    let timerContent = fs.readFileSync(timerPath, 'utf8');
    
    // We want to replace the whole "Today's Boost / Motivation Card" block
    const oldCardRegex = /\{\/\* 3\. Today's Boost \/ Motivation Card \*\/\}[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;
    
    const newCardBlock = `{/* 3. Daily Catalyst / Motivation Card */}
        <div
          className="rounded-2xl bg-[var(--surface)] backdrop-blur-xl border border-[var(--border)] p-5 shadow-xl space-y-3 transition-all relative overflow-hidden"
          style={{ borderTop: "1px solid rgba(255, 255, 255, 0.1)" }}
        >
          <div className="hud-corner-bracket hud-corner-tl" />
          <div className="hud-corner-bracket hud-corner-tr" />
          <div className="hud-corner-bracket hud-corner-bl" />
          <div className="hud-corner-bracket hud-corner-br" />

          <div className="flex items-center gap-2 pb-2.5 border-b border-[var(--border)] relative z-10">
            <Sparkles className="w-4 h-4" style={{ color: "var(--accent)" }} />
            <span className="text-xs font-hud font-bold text-white tracking-widest uppercase">
              DAILY CATALYST
            </span>
          </div>

          <div className="min-h-[40px] flex flex-col justify-center relative z-10">
            <p className="text-[14px] font-semibold text-[#E2E8F0] leading-snug tracking-tight">
              Day {user?.streakDays || 1} logged. Return tomorrow to elevate your multiplier.
            </p>
          </div>
        </div>
      </div>
    </div>`;

    timerContent = timerContent.replace(oldCardRegex, newCardBlock);
    fs.writeFileSync(timerPath, timerContent, 'utf8');
    console.log('Updated StudyTimer.tsx');
}

updateModals();
