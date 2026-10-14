'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Ghost, ArrowRight, Sparkles } from 'lucide-react';
import { getSupabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface EmptyRecapFallbackProps {
  seasonDisplayName?: string;
  seasonKey?: string;
}

export default function EmptyRecapFallback({
  seasonDisplayName = 'Previous Season',
  seasonKey,
}: EmptyRecapFallbackProps) {
  const { user } = useAuth();

  useEffect(() => {
    try {
      const targetSeason = seasonKey || new Date().toISOString().substring(0, 7);
      localStorage.setItem(`has_seen_recap_${targetSeason}`, 'true');
      const safeKey = targetSeason.replace('-', '_');
      localStorage.setItem(`season_settlement_acknowledged_${safeKey}`, 'true');

      // Update last_acknowledged_season in profiles
      if (user?.id && !user.id.startsWith('user-scholar')) {
        const supabase = getSupabase();
        if (supabase) {
          supabase
            .from('profiles')
            .update({ last_acknowledged_season: targetSeason })
            .eq('id', user.id)
            .then(() => {});
        }
      }
    } catch {}
  }, [seasonKey, user?.id]);

  return (
    <div className="w-full text-slate-100 font-sans bg-[#07090e] min-h-screen p-8 flex flex-col justify-center items-center relative overflow-hidden select-none">
      {/* Background Ambience matches the app */}
      <div className="fixed inset-0 pointer-events-none bg-dot-grid z-0" />
      <div className="fixed inset-0 pointer-events-none bg-hud-grid opacity-[0.03] z-0" />
      <div className="absolute inset-0 bg-gradient-to-t from-amber-950/20 via-transparent to-transparent pointer-events-none" />

      <div className="relative z-10 bg-white/[0.03] backdrop-blur-2xl border border-white/[0.1] rounded-3xl p-10 sm:p-12 text-center flex flex-col items-center justify-center gap-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)] max-w-lg w-full">
        <div className="w-20 h-20 rounded-full bg-slate-500/10 border border-slate-500/20 flex items-center justify-center text-slate-400 mb-2 relative animate-pulse">
          <Ghost className="w-10 h-10 stroke-[1.5]" />
        </div>

        <div className="space-y-2">
          <div className="text-[11px] font-mono uppercase tracking-widest text-amber-400 font-bold">
            // {seasonDisplayName.toUpperCase()}
          </div>
          <h2 className="text-2xl md:text-3xl font-black font-hud tracking-widest uppercase text-white">
            NO SESSIONS LOGGED
          </h2>
          <p className="text-slate-400 font-mono text-xs leading-relaxed max-w-sm mx-auto">
            You did not record focus sessions during this season. Start the timer now to establish your standings for the current season!
          </p>
        </div>

        <div className="w-full space-y-3 pt-2">
          <Link
            href="/leaderboard"
            className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-400 hover:brightness-110 rounded-xl text-black font-hud font-bold tracking-widest transition-all shadow-lg shadow-amber-500/20 active:scale-95 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>UNLOCK LEADERBOARD</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/"
            className="inline-block text-xs font-mono text-zinc-400 hover:text-white transition-colors"
          >
            ← Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
