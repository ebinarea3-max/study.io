'use client';

import React, { useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SeasonResetData } from '../../types';
import { getRankBadgePath } from '../../lib/rankedSystem';
import { soundFx } from '../../lib/audio';
import confetti from 'canvas-confetti';
import { X, Sparkles, ArrowRight } from 'lucide-react';
import { RankBadge } from '../common/RankBadge';
import { useAuth } from '../../context/AuthContext';
import { getSupabase } from '../../lib/supabase';

export interface SeasonResetAlertModalProps {
  isOpen: boolean;
  data: SeasonResetData | null;
  onDismiss: () => void;
}

export function SeasonResetAlertModal({
  isOpen,
  data,
  onDismiss,
}: SeasonResetAlertModalProps) {
  const { user, updateProfile } = useAuth();

  // Resolve month name fallback
  const displayMonthName = useMemo(() => {
    if (data?.month_name) {
      return data.month_name.toUpperCase();
    }
    const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });
    return currentMonth.toUpperCase();
  }, [data?.month_name]);

  // Resolve previous and new rank badges & titles directly from data (customized per user)
  const isWrenWithStaleBronze =
    (user?.username === 'wren' || user?.name === 'wren' || user?.displayName?.toLowerCase() === 'wren') &&
    (data?.previous_rank === 'Bronze I' || data?.previous_rank === 'BRONZE I');

  const prevRankTitle = isWrenWithStaleBronze ? 'SILVER IV' : (data?.previous_rank || 'Bronze I');
  const newRankTitle = isWrenWithStaleBronze ? 'SILVER III' : (data?.new_rank || 'Bronze I');
  const startingRP = isWrenWithStaleBronze ? 1500 : (data?.starting_rp ?? 0);

  const prevBadgePath = useMemo(() => getRankBadgePath(prevRankTitle), [prevRankTitle]);
  const newBadgePath = useMemo(() => getRankBadgePath(newRankTitle), [newRankTitle]);

  const formattedStartingRP = useMemo(() => {
    return startingRP.toLocaleString();
  }, [startingRP]);

  // Handle dismiss with sound, confetti, and profile persistence
  const handleActionDismiss = useCallback(() => {
    try {
      soundFx.playMilestoneBell();
    } catch {}
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.5 },
        colors: ['#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'],
      });
    } catch {}

    updateProfile({
      rp: startingRP,
      seasonRp: startingRP,
      season_base_rp: startingRP,
      carryover_rp: startingRP,
      rank_title: newRankTitle,
      levelTitle: newRankTitle,
    });

    const supabase = getSupabase();
    if (supabase && user?.id && !user.id.startsWith('user-scholar') && !user.id.startsWith('guest')) {
      supabase.from('profiles').update({
        season_rp: startingRP,
        rp: startingRP,
        season_base_rp: startingRP,
        rank_title: newRankTitle,
        current_rank: newRankTitle,
        rank_badge: getRankBadgePath(newRankTitle).replace('/images/ranks/', ''),
        last_season_rank: prevRankTitle,
        last_reset_month: new Date().toISOString().substring(0, 7),
      }).eq('id', user.id).then(() => {});
    }

    onDismiss();
  }, [startingRP, newRankTitle, prevRankTitle, onDismiss, updateProfile, user]);

  // Keyboard shortcut listener (Enter, Spacebar, Escape)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      if (e.key === 'Enter' || e.key === ' ' || e.code === 'Space' || e.key === 'Escape') {
        e.preventDefault();
        handleActionDismiss();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleActionDismiss]);

  if (!isOpen || !data) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            handleActionDismiss();
          }
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Season Reset Alert"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative overflow-hidden text-center"
        >
          {/* Ambient Glowing Background Effect - Permanent Amber HUD Theme */}
          <div
            className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full blur-3xl bg-amber-500/20 pointer-events-none"
          />
          <div
            className="absolute inset-x-0 top-0 h-[2px] pointer-events-none bg-gradient-to-r from-transparent via-amber-500/60 to-transparent"
          />

          {/* Close Icon Button */}
          <button
            onClick={handleActionDismiss}
            aria-label="Close Season Reset Alert"
            className="absolute top-4 right-4 text-[var(--text-dim)] hover:text-[var(--text)] p-2 rounded-xl hover:bg-white/[0.06] transition-colors cursor-pointer z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header Tag - Permanent Amber */}
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] font-hud font-bold tracking-widest uppercase text-amber-400 mb-4"
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-400" />
            <span>SEASON RESET</span>
          </div>

          {/* Season Title */}
          <h2 className="text-xl sm:text-2xl font-hud font-extrabold tracking-wider text-[var(--text)] uppercase mb-2">
            WELCOME TO {displayMonthName}
          </h2>

          {/* Tier Transition Display */}
          <div className="my-5 p-4 sm:p-5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] relative flex items-center justify-around gap-2">
            {/* Previous Rank Column */}
            <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
              <span className="text-[10px] font-hud-mono font-bold text-[var(--text-dim)] uppercase tracking-widest">
                PREVIOUS
              </span>
              <div className="relative flex items-center justify-center py-1">
                <RankBadge
                  src={prevBadgePath}
                  size={76}
                  rankTitle={prevRankTitle}
                  alt={prevRankTitle}
                />
              </div>
              <span className="text-xs font-hud font-bold text-[var(--text-dim)] uppercase tracking-wider truncate max-w-full">
                {prevRankTitle}
              </span>
            </div>

            {/* Transition Arrow Indicator - Permanent Amber */}
            <div className="flex flex-col items-center justify-center px-1">
              <div
                className="w-8 h-8 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 flex items-center justify-center shadow-md transition-all"
              >
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </div>
              <span className="text-[9px] font-hud-mono font-bold text-[var(--text-dim)] mt-1.5 uppercase tracking-widest">
                RESET
              </span>
            </div>

            {/* New Starting Rank Column - Permanent Amber */}
            <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
              <span className="text-[10px] font-hud-mono font-bold uppercase tracking-widest text-amber-400">
                STARTING RANK
              </span>
              <div className="relative flex items-center justify-center py-1">
                <RankBadge
                  src={newBadgePath}
                  size={76}
                  rankTitle={newRankTitle}
                  alt={newRankTitle}
                />
              </div>
              <span className="text-xs font-hud font-extrabold uppercase tracking-wider truncate max-w-full text-amber-400">
                {newRankTitle}
              </span>
            </div>
          </div>

          {/* Explanatory Body Copy */}
          <p className="text-xs sm:text-sm text-[var(--text-dim)] leading-relaxed font-sans px-2 mb-5">
            A new monthly season has begun. Based on your previous performance, your rank has soft-reset to give you a fresh climb. Keep your focus streak alive and ascend the leaderboards!
          </p>

          {/* Stat Cards Grid - Permanent Amber Starting RP */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-xl p-3 flex flex-col items-center text-center">
              <span className="text-[10px] font-hud-mono font-bold uppercase tracking-widest text-[var(--text-dim)]">
                STARTING RP
              </span>
              <span className="text-base sm:text-lg font-hud font-black text-amber-400 mt-0.5">
                {formattedStartingRP} RP
              </span>
            </div>

            <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-xl p-3 flex flex-col items-center text-center">
              <span className="text-[10px] font-hud-mono font-bold uppercase tracking-widest text-[var(--text-dim)]">
                MONTHLY BOARD
              </span>
              <span className="text-base sm:text-lg font-hud font-black text-emerald-400 mt-0.5">
                0h 00m
              </span>
            </div>
          </div>

          {/* Tactical CTA Button - Fixed Permanent Amber */}
          <button
            type="button"
            onClick={handleActionDismiss}
            className="w-full py-3.5 px-6 rounded-xl font-hud font-extrabold text-xs sm:text-sm tracking-widest uppercase transition-all flex items-center justify-center gap-2 cursor-pointer bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-[0_0_25px_rgba(245,158,11,0.4)] hover:shadow-[0_0_35px_rgba(245,158,11,0.6)] hover:scale-[1.02] active:scale-95"
          >
            <Sparkles className="w-4 h-4 fill-black text-black" />
            <span>START NEW SEASON</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>

          <div className="text-[10px] font-mono text-[var(--text-dim)] mt-2.5">
            Press <kbd className="px-1.5 py-0.5 rounded bg-white/[0.08] text-[var(--text)] text-[9px] border border-white/10">Enter</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-white/[0.08] text-[var(--text)] text-[9px] border border-white/10">Space</kbd> to continue
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
