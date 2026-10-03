'use client';

import React, { useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { SeasonResetData } from '../../types';
import { getRankBadgePath } from '../../lib/rankedSystem';
import { soundFx } from '../../lib/audio';
import confetti from 'canvas-confetti';
import { X, Sparkles, Trophy, ArrowRight } from 'lucide-react';

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
  // Resolve month name fallback
  const displayMonthName = useMemo(() => {
    if (data?.month_name) {
      return data.month_name.toUpperCase();
    }
    const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });
    return currentMonth.toUpperCase();
  }, [data?.month_name]);

  // Resolve previous and new rank badges & titles
  const prevRankTitle = data?.previous_rank || 'Bronze I';
  const newRankTitle = data?.new_rank || 'Bronze I';
  const prevBadgePath = useMemo(() => getRankBadgePath(prevRankTitle), [prevRankTitle]);
  const newBadgePath = useMemo(() => getRankBadgePath(newRankTitle), [newRankTitle]);
  const formattedStartingRP = useMemo(() => {
    return (data?.starting_rp ?? 0).toLocaleString();
  }, [data?.starting_rp]);

  // Handle dismiss with sound and confetti
  const handleActionDismiss = useCallback(() => {
    try {
      soundFx.playMilestoneBell();
    } catch {}
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.5 },
      });
    } catch {}
    onDismiss();
  }, [onDismiss]);

  // Keyboard shortcut listener (Enter, Spacebar, Escape)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid intercepting if typing inside an input or textarea
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
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
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
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="bg-[#0b0e14] border border-white/10 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative overflow-hidden text-center select-none"
        >
          {/* Ambient Obsidian & Amber Glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/80 to-transparent pointer-events-none" />

          {/* Close Icon Button */}
          <button
            onClick={handleActionDismiss}
            aria-label="Close Season Reset Alert"
            className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors cursor-pointer z-10"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header Tag */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 mb-3.5 shadow-sm shadow-amber-500/10">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-amber-400 font-mono text-xs font-semibold tracking-widest uppercase">
              • SEASON RESET •
            </span>
          </div>

          {/* Season Title */}
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase mb-2">
            WELCOME TO {displayMonthName}
          </h2>

          {/* Tier Transition Display */}
          <div className="my-5 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] relative flex items-center justify-around gap-2">
            {/* Previous Rank Column */}
            <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
              <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
                PREVIOUS
              </span>
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]">
                <Image
                  src={prevBadgePath}
                  alt={prevRankTitle}
                  width={80}
                  height={80}
                  className="object-contain max-h-full"
                  priority
                />
              </div>
              <span className="text-xs font-bold text-neutral-300 font-mono truncate max-w-full">
                {prevRankTitle}
              </span>
            </div>

            {/* Animated Arrow / Transition Indicator */}
            <div className="flex flex-col items-center justify-center px-1">
              <motion.div
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-md shadow-amber-500/15"
              >
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </motion.div>
              <span className="text-[9px] font-mono text-neutral-400 mt-1 uppercase tracking-widest">
                RESET
              </span>
            </div>

            {/* New Rolled-Back Starting Rank Column */}
            <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
              <span className="text-[10px] font-mono text-amber-400 font-semibold uppercase tracking-wider">
                STARTING RANK
              </span>
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center filter drop-shadow-[0_4px_14px_rgba(245,158,11,0.35)]">
                <Image
                  src={newBadgePath}
                  alt={newRankTitle}
                  width={80}
                  height={80}
                  className="object-contain max-h-full"
                  priority
                />
              </div>
              <span className="text-xs font-black text-amber-400 font-mono truncate max-w-full">
                {newRankTitle}
              </span>
            </div>
          </div>

          {/* Explanatory Body Copy */}
          <p className="text-xs sm:text-[13px] text-neutral-400 leading-relaxed px-1 sm:px-2 mb-5">
            A new monthly season has begun. Based on your performance last month, your rank has soft-reset to give you a head start for the new season. Keep your focus streak alive and climb back to the top!
          </p>

          {/* Stat Strip / Pill */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-3 mb-6 grid grid-cols-2 divide-x divide-white/[0.08] text-center">
            <div className="flex flex-col items-center px-2">
              <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
                Starting Base RP
              </span>
              <span className="text-xs sm:text-sm font-black text-white font-mono mt-0.5">
                Starting RP: <span className="text-amber-400">{formattedStartingRP} RP</span>
              </span>
            </div>

            <div className="flex flex-col items-center px-2">
              <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
                Status
              </span>
              <span className="text-xs sm:text-sm font-semibold text-neutral-200 font-mono mt-0.5">
                Monthly Leaderboard: <span className="text-emerald-400">0h 0m</span>
              </span>
            </div>
          </div>

          {/* Tactile CTA Action Button */}
          <button
            onClick={handleActionDismiss}
            className="w-full relative group overflow-hidden rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-black font-black font-mono text-sm py-3.5 px-6 shadow-lg shadow-amber-500/25 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-black group-hover:rotate-12 transition-transform" />
            <span className="tracking-wider">[ START NEW SEASON ]</span>
            <ArrowRight className="w-4 h-4 text-black group-hover:translate-x-0.5 transition-transform" />
          </button>
          <div className="text-[10px] font-mono text-neutral-400 mt-2">
            Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-neutral-300 text-[9px]">Enter</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-neutral-300 text-[9px]">Space</kbd> to continue
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
