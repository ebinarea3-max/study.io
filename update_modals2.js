const fs = require('fs');
const path = require('path');

function updateModals2() {
    // 1. Update DailyBoostModal.tsx (Toast)
    const dailyBoostPath = path.join(__dirname, 'src/components/common/DailyBoostModal.tsx');
    const newDailyBoostContent = `'use client';

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
          style={{ boxShadow: \`inset 0 0 20px \${theme.accent}\` }}
        />
        <div 
          className="relative flex items-center justify-center w-8 h-8 rounded-full bg-white/5 border"
          style={{ borderColor: \`\${theme.accent}40\`, color: theme.accent }}
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
`;
    fs.writeFileSync(dailyBoostPath, newDailyBoostContent, 'utf8');
    console.log('Updated DailyBoostModal.tsx (Toast)');

    // 2. Update LevelUpModal.tsx
    const levelUpPath = path.join(__dirname, 'src/components/gamification/LevelUpModal.tsx');
    const newLevelUpContent = `'use client';

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
            style={{ background: theme.gradient, boxShadow: \`0 4px 20px \${theme.accent}40\` }}
          >
            <span>Confirm & Continue</span>
          </button>
        </div>
      </div>
    </div>
  );
}
`;
    fs.writeFileSync(levelUpPath, newLevelUpContent, 'utf8');
    console.log('Updated LevelUpModal.tsx');


    // 3. Update StudyTimer.tsx to rename DAILY CATALYST to DAILY DIRECTIVE
    const timerPath = path.join(__dirname, 'src/components/timer/StudyTimer.tsx');
    let timerContent = fs.readFileSync(timerPath, 'utf8');
    
    // Using import Target from lucide-react if needed, but it's likely not imported in StudyTimer.tsx if not used yet.
    // Let's check if Target is imported. It's safe to just import it if it's missing, or we can use crosshair/compass if imported. 
    // Wait, I can just do a regex replace to add Target to the lucide-react imports if it's missing.
    if (!timerContent.includes('Target,')) {
        timerContent = timerContent.replace(/import\s+\{([^}]+)\}\s+from\s+'lucide-react';/, "import {$1, Target} from 'lucide-react';");
    }

    const oldCardRegex = /\{\/\* 3\. Daily Catalyst \/ Motivation Card \*\/\}[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;
    
    const newCardBlock = `{/* 3. Daily Directive / Motivation Card */}
        <div
          className="rounded-2xl bg-[var(--surface)] backdrop-blur-xl border border-[var(--border)] p-5 shadow-xl space-y-3 transition-all relative overflow-hidden"
          style={{ borderTop: "1px solid rgba(255, 255, 255, 0.1)" }}
        >
          <div className="hud-corner-bracket hud-corner-tl" />
          <div className="hud-corner-bracket hud-corner-tr" />
          <div className="hud-corner-bracket hud-corner-bl" />
          <div className="hud-corner-bracket hud-corner-br" />

          <div className="flex items-center gap-2 pb-2.5 border-b border-[var(--border)] relative z-10">
            <Target className="w-4 h-4" style={{ color: "var(--accent)" }} />
            <span className="text-xs font-semibold tracking-wider text-neutral-300 uppercase">
              DAILY DIRECTIVE
            </span>
          </div>

          <div className="min-h-[40px] flex flex-col justify-center relative z-10">
            <p className="text-[14px] font-semibold text-[#E2E8F0] leading-snug tracking-tight">
              {(user?.streakDays || 1) > 1 
                ? \`Day \${user?.streakDays || 1} directive active. Complete your scheduled focus blocks to maintain momentum.\`
                : "Day 1 logged. Return tomorrow to maintain your active streak."
              }
            </p>
          </div>
        </div>
      </div>
    </div>`;

    timerContent = timerContent.replace(oldCardRegex, newCardBlock);
    fs.writeFileSync(timerPath, timerContent, 'utf8');
    console.log('Updated StudyTimer.tsx');
}

updateModals2();
