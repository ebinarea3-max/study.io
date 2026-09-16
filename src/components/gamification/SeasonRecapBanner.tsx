'use client';

import React from 'react';
import { Trophy, ArrowRight, Sparkles, X, ShieldCheck } from 'lucide-react';
import { SeasonRecapData } from '../../types';
import confetti from 'canvas-confetti';

interface SeasonRecapBannerProps {
  recap: SeasonRecapData | null;
  onDismiss: () => void;
}

export function SeasonRecapBanner({ recap, onDismiss }: SeasonRecapBannerProps) {
  if (!recap) return null;

  const handleClaim = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.3 },
    });
    onDismiss();
  };

  return (
    <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 pt-4 z-20 animate-in slide-in-from-top-4 duration-500">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border border-amber-500/40 p-4 sm:p-5 shadow-2xl shadow-amber-500/10">
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
                  NEW RANKED SEASON
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {recap.previousSeasonId} ➔ {recap.newSeasonId}
                </span>
              </div>

              <h4 className="text-sm sm:text-base font-extrabold text-white mt-0.5 flex items-center gap-2 flex-wrap">
                <span>Monthly Ranked Settlement Applied</span>
                <span className="text-xs font-normal text-slate-300">
                  Previous: <span className="font-bold text-amber-300">{recap.previousTierTitle} ({recap.previousRP} RP)</span>
                </span>
              </h4>

              <p className="text-xs text-slate-400 mt-0.5">
                Your placement tier for <span className="text-amber-200 font-bold">{recap.newSeasonId}</span> is{' '}
                <span className="text-emerald-300 font-extrabold">{recap.newTierTitle}</span> ({recap.newRP} RP). Start your new climb!
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
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Claim & Climb</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onDismiss}
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
