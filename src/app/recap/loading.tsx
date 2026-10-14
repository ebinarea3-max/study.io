import React from 'react';

export default function RecapLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#07090e] text-slate-100 relative overflow-hidden select-none">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none bg-dot-grid z-0" />
      <div className="fixed inset-0 pointer-events-none bg-hud-grid opacity-[0.03] z-0" />
      <div className="absolute inset-0 bg-gradient-to-t from-amber-950/20 via-amber-900/5 to-transparent pointer-events-none" />

      {/* Central Radial Glow */}
      <div className="absolute w-[450px] h-[450px] rounded-full bg-amber-500/10 blur-[120px] pointer-events-none animate-pulse" />

      {/* Skeleton Content */}
      <div className="relative z-10 w-full max-w-lg px-6 flex flex-col items-center justify-center text-center space-y-8">
        {/* Status Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span className="text-[11px] font-mono font-bold tracking-widest text-amber-300 uppercase">
            DECRYPTING SEASON DOSSIER
          </span>
        </div>

        {/* Pulsing Crest Shield Placeholder */}
        <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full border border-amber-500/30 bg-gradient-to-b from-amber-500/10 via-black/40 to-black/80 flex items-center justify-center shadow-[0_0_50px_rgba(245,158,11,0.2)] animate-pulse">
          <div className="w-36 h-36 rounded-full border border-amber-400/20 bg-amber-500/5 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full border border-dashed border-amber-400/30 animate-spin" style={{ animationDuration: '8s' }} />
          </div>
        </div>

        {/* Shimmer Bar & Labels */}
        <div className="space-y-3 w-full max-w-xs flex flex-col items-center">
          <div className="h-6 w-48 bg-white/10 rounded-md animate-pulse" />
          <div className="h-4 w-32 bg-white/5 rounded-md animate-pulse" />
          <div className="w-full bg-white/5 rounded-full h-1 overflow-hidden mt-2">
            <div className="h-full bg-gradient-to-r from-transparent via-amber-400 to-transparent w-full animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
