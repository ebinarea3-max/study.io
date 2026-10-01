'use client';

import React, { useMemo, useState } from 'react';
import { Trophy, ArrowRight, Sparkles, X } from 'lucide-react';
import { SeasonRecapData } from '../../types';
import confetti from 'canvas-confetti';

interface SeasonRecapBannerProps {
  recap: SeasonRecapData | null;
  onDismiss: () => void;
}

export function SeasonRecapBanner({ recap, onDismiss }: SeasonRecapBannerProps) {
  const [isExiting, setIsExiting] = useState(false);

  if (!recap) return null;

  const currentMonthName = useMemo(() => {
    if (!recap.newSeasonId) return '';
    const [year, month] = recap.newSeasonId.split('-');
    if (!year || !month) return '';
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleString('default', { month: 'long' });
  }, [recap.newSeasonId]);

  const previousMonthName = useMemo(() => {
    if (!recap.previousSeasonId) return '';
    const [year, month] = recap.previousSeasonId.split('-');
    if (!year || !month) return '';
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleString('default', { month: 'long' });
  }, [recap.previousSeasonId]);

  const handleDismiss = () => {
    if (isExiting) return;
    setIsExiting(true);
    setTimeout(() => {
      onDismiss();
    }, 450); // allow animate-out to finish
  };

  const handleClaim = () => {
    if (isExiting) return;
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.3 },
    });
    handleDismiss();
  };

  return (
    <div className={`relative w-full max-w-7xl mx-auto px-4 sm:px-6 pt-4 z-20 duration-500 ${isExiting ? 'animate-out slide-out-to-top-4 fade-out fill-mode-forwards' : 'animate-in slide-in-from-top-4'}`}>
      <div className="relative overflow-hidden bg-[#0c0d12]/90 border border-amber-500/20 rounded-2xl p-3.5 sm:p-4 backdrop-blur-md shadow-2xl shadow-amber-500/10">
        {/* Glow & Cybernetic Accent Lines */}
        <div className="absolute top-0 right-1/4 w-96 h-24 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Left: Icon & Description */}
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20 flex-shrink-0">
              <Trophy className="w-6 h-6 stroke-[2.5]" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] sm:text-xs font-black tracking-widest uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {currentMonthName ? `${currentMonthName.toUpperCase()} SEASON ACTIVE` : "SEASON RECAP"}
                </span>
              </div>

              <h4 className="text-sm sm:text-base font-extrabold text-white mt-0.5 flex items-center gap-2 flex-wrap">
                <span>Monthly Season Settlement</span>
                <span className="text-xs font-normal text-slate-300">
                  Previous: <span className="font-bold text-amber-300">{recap.previousTierTitle} ({recap.previousRP} RP)</span>
                </span>
              </h4>

              <p className="text-xs text-slate-400 mt-0.5">
                {previousMonthName} season concluded. Monthly soft reset applied. Your starting tier for {currentMonthName} is <span className="text-emerald-300 font-extrabold">{recap.newTierTitle}</span>. Ready for the new climb?
              </p>
            </div>
          </div>

          {/* Right: Placement Badge & Claim Action */}
          <div className="flex items-center gap-3 self-end md:self-center w-full md:w-auto justify-end">
            <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-white/10 text-right hidden sm:block">
              <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">New Starting Tier</div>
              <div className="text-xs font-black text-emerald-400 font-mono">{recap.newTierTitle} · {recap.newRP} RP</div>
            </div>

            <button
              onClick={handleClaim}
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:brightness-110 text-black font-semibold text-xs py-2 px-4 rounded-xl shadow-md uppercase tracking-wider transition-all active:scale-95 cursor-pointer flex items-center gap-2 whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>BEGIN NEW CLIMB</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </button>

            <button
              onClick={handleDismiss}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title="Dismiss recap"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
