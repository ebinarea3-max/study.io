'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Sparkles, X, Eye, ExternalLink, Zap } from 'lucide-react';
import { RANK_TIERS, RankTierConfig } from '../../lib/rankedSystem';
import { useDevRankPreview, isDevMode } from '../../lib/devRankPreview';
import { preloadAllRankBadgesImmediately } from '../../lib/preloadRankBadges';
import { RankSettlementModal } from '../RankSettlementModal';
import { RankSettlementData } from '../../types';
import { RankBadge, getRankBadgeTier } from './RankBadge';
import { getRankBadgeSources } from '../../lib/preloadRankBadges';

export function DevRankSwitcher() {
  const [mounted, setMounted] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [settlementData, setSettlementData] = useState<RankSettlementData | null>(null);

  const {
    previewRp,
    isPreviewActive,
    currentTierIndex,
    currentTierConfig,
    setTierByIndex,
    clearPreviewRp,
  } = useDevRankPreview();

  useEffect(() => {
    setMounted(true);
    preloadAllRankBadgesImmediately();
  }, []);

  if (!mounted || !isDevMode()) return null;

  // If not currently previewing and minimized, show subtle floating pill
  if (!isPreviewActive && isMinimized) {
    return (
      <button
        onClick={() => {
          setIsMinimized(false);
          setTierByIndex(0);
        }}
        title="Open Dev Rank Simulator"
        className="fixed bottom-24 md:bottom-6 right-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/80 hover:bg-black text-amber-400 border border-amber-500/40 backdrop-blur-md shadow-xl text-xs font-mono font-semibold transition-all hover:scale-105 active:scale-95"
      >
        <Zap className="w-3.5 h-3.5" />
        <span>SIMULATE RANK</span>
      </button>
    );
  }

  // If not previewing and not minimized, show activation pill
  if (!isPreviewActive) {
    return (
      <div className="fixed bottom-24 md:bottom-6 right-4 z-50 flex items-center gap-2 p-2 rounded-xl bg-black/90 text-white border border-amber-500/30 backdrop-blur-md shadow-2xl text-xs font-hud">
        <button
          onClick={() => setTierByIndex(currentTierIndex || 0)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-semibold transition-all"
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>PREVIEW RANKS</span>
        </button>
        <Link
          href="/dev/ranks"
          className="px-2.5 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 transition-all flex items-center gap-1"
          title="Go to /dev/ranks matrix"
        >
          <span>/dev/ranks</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
        <button
          onClick={() => setIsMinimized(true)}
          className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors"
          title="Minimize"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // Handle previous/next tier navigation
  const handlePrev = () => {
    if (currentTierIndex > 0) {
      setTierByIndex(currentTierIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentTierIndex < RANK_TIERS.length - 1) {
      setTierByIndex(currentTierIndex + 1);
    }
  };

  // Trigger full-screen Rank Advancement celebration modal over Dashboard
  const handleTriggerRankUpModal = () => {
    const targetConfig = RANK_TIERS[currentTierIndex];
    let prevRP: number;
    let newRP: number;

    if (currentTierIndex === 0) {
      // Bronze I initial advancement
      prevRP = 0;
      newRP = 60;
    } else {
      // Land cleanly inside target tier with +60 RP focus gain
      newRP = targetConfig.minRP + 40;
      prevRP = newRP - 60;
    }

    setSettlementData({
      prevRP,
      newRP,
      breakdown: {
        sessionRP: 60,
        goalStreakBonus: 0,
        taskBonus: 0,
        totalGained: 60,
        durationSeconds: 2160,
        isUnderMinDuration: false,
        streakBonusClaimedToday: false,
      },
    });
  };

  const currentSources = getRankBadgeSources(currentTierConfig.tier, currentTierConfig.division);
  const badgeTier = getRankBadgeTier(currentTierConfig.fullTitle);

  return (
    <>
      <div className="fixed bottom-24 md:bottom-6 right-4 z-50 w-80 max-w-[calc(100vw-2rem)] bg-[#0b0d13]/95 border border-amber-500/40 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.8)] backdrop-blur-xl p-3.5 text-white font-sans transition-all">
        {/* Header Strip */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
            <span className="text-[11px] font-hud font-bold tracking-wider text-amber-400">
              DASHBOARD RANK SIMULATOR
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Link
              href="/dev/ranks"
              className="text-[10px] text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-1"
              title="All 23 Ranks Matrix"
            >
              <span>/dev/ranks</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </Link>
            <button
              onClick={() => setIsMinimized(true)}
              className="text-slate-400 hover:text-white p-0.5 transition-colors"
              title="Minimize Switcher"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Current Simulated Rank Display Card */}
        <div className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.04] border border-white/5 mb-3">
          <div className="w-10 h-10 shrink-0 flex items-center justify-center">
            <RankBadge
              src={currentSources.png}
              tier={badgeTier}
              size={40}
              alt={currentTierConfig.fullTitle}
              rankTitle={currentTierConfig.fullTitle}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-white tracking-wider truncate">
                {currentTierConfig.fullTitle}
              </div>
              <span className="text-[10px] text-amber-400/90 font-mono font-semibold">
                Tier {currentTierIndex + 1}/23
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              Simulated: <span className="text-white font-semibold">{previewRp?.toLocaleString()} RP</span>
            </div>
          </div>
        </div>

        {/* Rank Stepper & Dropdown Selector */}
        <div className="flex items-center gap-1.5 mb-2.5">
          <button
            onClick={handlePrev}
            disabled={currentTierIndex === 0}
            className="p-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] disabled:opacity-30 disabled:pointer-events-none transition-colors border border-white/5"
            title="Previous Rank"
          >
            <ChevronLeft className="w-4 h-4 text-slate-300" />
          </button>

          <select
            value={currentTierIndex}
            onChange={(e) => setTierByIndex(Number(e.target.value))}
            className="flex-1 bg-black/60 border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-amber-400 cursor-pointer"
          >
            {RANK_TIERS.map((tier, idx) => (
              <option key={tier.fullTitle} value={idx} className="bg-[#121520] text-white">
                #{idx + 1} {tier.fullTitle} ({tier.minRP.toLocaleString()} – {tier.maxRP.toLocaleString()} RP)
              </option>
            ))}
          </select>

          <button
            onClick={handleNext}
            disabled={currentTierIndex === RANK_TIERS.length - 1}
            className="p-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] disabled:opacity-30 disabled:pointer-events-none transition-colors border border-white/5"
            title="Next Rank"
          >
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleTriggerRankUpModal}
            className="flex-1 py-1.5 px-2.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95"
            title="Trigger Fullscreen Rank Advancement Modal"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Rank-Up Modal</span>
          </button>

          <button
            onClick={clearPreviewRp}
            className="py-1.5 px-2.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold transition-all active:scale-95"
            title="Clear preview override and restore live Supabase database rank"
          >
            Exit Preview
          </button>
        </div>
      </div>

      {/* Floating Rank Advancement modal triggerable directly over Dashboard */}
      <RankSettlementModal
        isOpen={Boolean(settlementData)}
        data={settlementData}
        onContinue={() => setSettlementData(null)}
      />
    </>
  );
}

