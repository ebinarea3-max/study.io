"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Ghost } from 'lucide-react';

export default function EmptyRecapFallback() {
  // We automatically mark the recap as seen when they reach this page,
  // matching the behavior of the main RecapPresentation.
  useEffect(() => {
    try {
      const currentSeason = new Date().toISOString().substring(0, 7);
      localStorage.setItem(`has_seen_recap_${currentSeason}`, 'true');
    } catch {}
  }, []);

  return (
    <div className="w-full text-slate-100 font-sans bg-[#07090e] min-h-screen p-8 flex flex-col justify-center items-center relative overflow-hidden">
      {/* Background Ambience matches the app */}
      <div className="fixed inset-0 pointer-events-none bg-dot-grid z-0" />
      <div className="fixed inset-0 pointer-events-none bg-hud-grid opacity-[0.03] z-0" />
      <div className="absolute inset-0 bg-gradient-to-t from-amber-900/10 via-transparent to-transparent pointer-events-none" />

      <div className="relative z-10 bg-white/[0.03] backdrop-blur-2xl border border-white/[0.1] rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)] max-w-lg w-full">
        <div className="w-20 h-20 rounded-full bg-slate-500/10 border border-slate-500/20 flex items-center justify-center text-slate-400 mb-2 relative animate-pulse">
          <Ghost className="w-10 h-10 stroke-[1.5]" />
        </div>
        <h2 className="text-2xl md:text-3xl font-black font-hud tracking-widest uppercase">
          NO SEASON DATA FOUND
        </h2>
        <p className="text-slate-400 font-hud tracking-wider text-sm mb-4">
          You need to log study sessions this season to generate a personalized recap.
        </p>
        <Link
          href="/leaderboard"
          className="inline-block w-full py-4 bg-amber-500 hover:bg-amber-400 rounded-xl text-black font-hud font-bold tracking-widest transition-all shadow-lg shadow-amber-500/20 active:scale-95"
        >
          UNLOCK LEADERBOARD & START GRINDING
        </Link>
      </div>
    </div>
  );
}
