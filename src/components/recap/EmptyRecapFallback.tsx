'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Trophy } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getSupabase } from '../../lib/supabase';
import { useThemeColorOverride } from '../../hooks/useThemeColorOverride';

export interface EmptyRecapFallbackProps {
  seasonDisplayName: string;
  seasonKey?: string;
  isDevPreview?: boolean;
  onClose?: () => void;
}

export default function EmptyRecapFallback({
  seasonDisplayName,
  seasonKey,
  isDevPreview = false,
  onClose,
}: EmptyRecapFallbackProps) {
  useThemeColorOverride('#07090e');
  const { user } = useAuth();

  useEffect(() => {
    if (isDevPreview) return; // Do NOT write to Supabase or localStorage in dev preview
    try {
      const now = new Date();
      const currentMonth = now.toISOString().substring(0, 7);
      const targetSeason = seasonKey || currentMonth;
      const safeKey = targetSeason.replace('-', '_');
      const safeCurrentKey = currentMonth.replace('-', '_');

      localStorage.setItem(`has_seen_recap_${targetSeason}`, 'true');
      localStorage.setItem(`has_seen_recap_${currentMonth}`, 'true');
      localStorage.setItem('has_seen_recap_current', 'true');
      localStorage.setItem('studypulse_recap_viewed', 'true');
      localStorage.setItem(`season_settlement_acknowledged_${safeKey}`, 'true');
      localStorage.setItem(`season_reset_alert_acknowledged_${safeCurrentKey}`, 'true');

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
  }, [seasonKey, user?.id, isDevPreview]);

  return (
    <div
      style={{
        colorScheme: 'dark',
        backgroundColor: 'var(--bg, #07090e)',
        color: 'var(--text, #ffffff)',
      }}
      className="w-full font-sans min-h-screen p-6 sm:p-8 flex flex-col justify-center items-center relative overflow-hidden select-none"
    >
      {/* Background Ambience: base + dot grid + accent glow + vignette */}
      <div className="fixed inset-0 pointer-events-none bg-dot-grid opacity-60 z-0" />
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(circle at 50% 50%, var(--glow, rgba(255,255,255,0.08)) 0%, transparent 65%)',
        }}
      />
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0, 0, 0, 0.6) 100%)',
        }}
      />

      <div className="relative z-10 bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-8 sm:p-12 text-center flex flex-col items-center justify-center gap-6 shadow-card max-w-lg w-full">
        {/* Soft Trophy Icon Container */}
        <div className="w-16 h-16 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)] mb-1">
          <Trophy className="w-8 h-8 stroke-[1.5]" />
        </div>

        <div className="space-y-2">
          <div className="text-xs font-mono tracking-wider text-[var(--text-dim)] uppercase">
            {seasonDisplayName}
          </div>
          <h2 className="text-2xl sm:text-3xl font-black font-hud tracking-wide text-[var(--text)]">
            No study sessions logged
          </h2>
          <p className="text-[var(--text-dim)] font-sans text-sm leading-relaxed max-w-sm mx-auto">
            You did not record focus sessions during this season. Start the timer now to climb the leaderboard this month.
          </p>
        </div>

        <div className="w-full space-y-3 pt-2">
          <Link
            href="/?tab=leaderboard"
            onClick={() => {
              try {
                const now = new Date();
                const currentMonth = now.toISOString().substring(0, 7);
                localStorage.setItem(`has_seen_recap_${seasonKey || currentMonth}`, 'true');
                localStorage.setItem(`has_seen_recap_${currentMonth}`, 'true');
                localStorage.setItem('has_seen_recap_current', 'true');
                localStorage.setItem('studypulse_recap_viewed', 'true');
              } catch {}
            }}
            className="w-full py-3.5 rounded-xl font-hud font-bold text-sm tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:brightness-110"
            style={{
              backgroundColor: 'var(--accent, #ffffff)',
              color: 'var(--accent-contrast, #08090C)',
            }}
          >
            <span>Unlock leaderboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="inline-block text-xs font-mono text-[var(--text-dim)] hover:text-[var(--text)] transition-colors cursor-pointer pt-1"
            >
              ← Return to dev preview
            </button>
          ) : (
            <Link
              href="/?tab=leaderboard"
              onClick={() => {
                try {
                  const now = new Date();
                  const currentMonth = now.toISOString().substring(0, 7);
                  localStorage.setItem(`has_seen_recap_${seasonKey || currentMonth}`, 'true');
                  localStorage.setItem(`has_seen_recap_${currentMonth}`, 'true');
                  localStorage.setItem('has_seen_recap_current', 'true');
                  localStorage.setItem('studypulse_recap_viewed', 'true');
                } catch {}
              }}
              className="inline-block text-xs font-mono text-[var(--text-dim)] hover:text-[var(--text)] transition-colors cursor-pointer pt-1"
            >
              ← Back to leaderboard
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
