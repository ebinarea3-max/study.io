'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles, LayoutDashboard, Zap, CheckCircle2, RotateCcw } from 'lucide-react';
import { RANK_TIERS, RankTierConfig, HARD_RESET_CAP_RP } from '../../../lib/rankedSystem';
import { RankBadge, getRankBadgeTier } from '../../../components/common/RankBadge';
import { getRankBadgeSources, preloadAllRankBadgesImmediately } from '../../../lib/preloadRankBadges';
import { RankSettlementModal } from '../../../components/RankSettlementModal';
import { RankSettlementData } from '../../../types';
import {
  useDevRankPreview,
  setDevPreviewRp,
  clearDevPreviewRp,
  getSimulatedRpForTierIndex,
} from '../../../lib/devRankPreview';

export default function RankPreviewPage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [previewData, setPreviewData] = useState<RankSettlementData | null>(null);
  const [preloaded, setPreloaded] = useState(false);

  const { previewRp, isPreviewActive, currentTierIndex } = useDevRankPreview();

  useEffect(() => {
    setIsClient(true);
    // Instant preloading of all 23 badge PNGs
    preloadAllRankBadgesImmediately().then(() => {
      setPreloaded(true);
    });
  }, []);

  if (!isClient) return null;
  if (process.env.NODE_ENV === 'production') {
    return <div className="p-8 text-white">Not found</div>;
  }

  // Handle triggering full-screen Rank Advancement celebration modal for a specific rank
  const handlePreviewRankUp = (targetIdx: number) => {
    const targetTierConfig = RANK_TIERS[targetIdx];
    let prevRP: number;
    let newRP: number;

    if (targetIdx === 0) {
      // Bronze I
      prevRP = 0;
      newRP = 60;
    } else {
      // Land in target tier with +60 RP focus gain
      newRP = targetTierConfig.minRP + 40;
      prevRP = newRP - 60;
    }

    setPreviewData({
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

  // Preview target rank directly on the main Dashboard
  const handlePreviewOnDashboard = (targetIdx: number) => {
    const simulatedRp = getSimulatedRpForTierIndex(targetIdx);
    setDevPreviewRp(simulatedRp);
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-white p-4 sm:p-8 overflow-y-auto pb-36 font-sans">
      {/* Top Header & Navigation Bar */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-300 hover:text-white transition-all flex items-center gap-2 text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-hud font-bold tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  DEVELOPER SUITE V2
                </span>
                <span className="text-xs text-slate-400 font-mono">23 Official Tiers</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-hud font-black tracking-wide text-white mt-1">
                Study.io Ranked Progression Matrix
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {preloaded && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>23 Crests Cached</span>
              </div>
            )}
            {isPreviewActive && (
              <button
                onClick={clearDevPreviewRp}
                className="px-3.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Exit Preview ({previewRp?.toLocaleString()} RP)</span>
              </button>
            )}
          </div>
        </div>

        {/* System Specifications Callout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
            <div className="text-xs font-hud font-bold tracking-wider text-amber-400 uppercase">
              1. Base Conversion
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              <span className="text-slate-200 font-semibold">1 Hour = 100 RP</span> | 1 Minute = 1.67 RP | 1 Sec = 1/36 RP. Clean linear conversion across all study sessions.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
            <div className="text-xs font-hud font-bold tracking-wider text-cyan-400 uppercase">
              2. Progression Curve
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Bronze (0–799) to Silver (800–2,799) climbs quickly. Gold through Grandmaster (40,000+ RP) requires 400h+ competitive focus.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
            <div className="text-xs font-hud font-bold tracking-wider text-purple-400 uppercase">
              3. Hard Reset Cap
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Monthly soft resets decay higher tiers down gracefully. Carryover RP is strictly capped at <span className="text-slate-200 font-semibold">{HARD_RESET_CAP_RP.toLocaleString()} RP (Diamond IV)</span>.
            </p>
          </div>
        </div>
      </div>

      {/* 23 V2 Rank Cards Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {RANK_TIERS.map((config, idx) => {
          const sources = getRankBadgeSources(config.tier, config.division);
          const badgeTier = getRankBadgeTier(config.fullTitle);
          const isCurrentActivePreview = isPreviewActive && currentTierIndex === idx;

          const rpRange =
            config.tier === 'Grandmaster'
              ? '40,000+ RP'
              : `${config.minRP.toLocaleString()} – ${config.maxRP.toLocaleString()} RP`;

          const stepHours =
            config.tier === 'Grandmaster'
              ? '+100h'
              : `+${Math.round((config.maxRP - config.minRP) / 100)}h`;

          return (
            <div
              key={config.fullTitle}
              className={`rounded-2xl p-5 flex flex-col justify-between shadow-xl relative overflow-visible transition-all duration-200 ${
                isCurrentActivePreview
                  ? 'bg-[#131826] border-2 border-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.25)]'
                  : 'bg-[var(--surface)] hover:bg-[#121622] border border-[var(--border)] hover:border-white/20'
              }`}
            >
              {/* Active Preview Pill */}
              {isCurrentActivePreview && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-amber-400 text-black text-[10px] font-hud font-black tracking-widest uppercase shadow-md flex items-center gap-1 z-20">
                  <Zap className="w-3 h-3 fill-current" />
                  <span>PREVIEW ACTIVE</span>
                </div>
              )}

              {/* Top Details & Badge Container */}
              <div className="flex flex-col items-center">
                {/* Badge Container with Ambient Effects */}
                <div className="w-[150px] h-[150px] flex items-center justify-center shrink-0 overflow-visible relative my-2">
                  <RankBadge
                    src={sources.png}
                    tier={badgeTier}
                    delay={idx * 0.08}
                    size={150}
                    alt={config.fullTitle}
                    rankTitle={config.fullTitle}
                  />
                </div>

                {/* Title & RP Bracket */}
                <h3 className="text-white font-hud font-bold tracking-widest text-base text-center mt-3">
                  {config.fullTitle}
                </h3>
                <div className="mt-1 mb-4 px-3 py-0.5 rounded-full text-xs font-mono font-semibold bg-white/[0.06] border border-white/10 text-amber-300">
                  {rpRange}
                </div>

                {/* Micro-Stats Grid */}
                <div className="w-full grid grid-cols-2 gap-2 text-[11px] mb-5">
                  <div className="p-2 rounded-lg bg-black/40 border border-white/5 flex flex-col">
                    <span className="text-[10px] uppercase text-slate-500 font-semibold tracking-wider">
                      Min Focus
                    </span>
                    <span className="font-mono text-slate-200 font-bold mt-0.5">
                      {config.minHours}h focus
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-black/40 border border-white/5 flex flex-col">
                    <span className="text-[10px] uppercase text-slate-500 font-semibold tracking-wider">
                      Step Hours
                    </span>
                    <span className="font-mono text-cyan-400 font-bold mt-0.5">
                      {stepHours} step
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-black/40 border border-white/5 flex flex-col col-span-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase text-slate-500 font-semibold tracking-wider">
                        Soft Reset Target
                      </span>
                      <span className="text-[10px] font-mono text-amber-400 font-bold">
                        {config.softResetRP.toLocaleString()} RP
                      </span>
                    </div>
                    <span className="font-mono text-slate-300 text-[10px] mt-0.5 truncate">
                      → {config.softResetRank || 'BRONZE I'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
                <button
                  onClick={() => handlePreviewRankUp(idx)}
                  className="w-full py-2.5 px-3 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 rounded-xl text-xs font-semibold tracking-wider text-emerald-300 flex items-center justify-center gap-1.5 transition-all active:scale-95"
                  title="Trigger Full-Screen Rank Advancement Modal with +60 RP Pill"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>PREVIEW RANK-UP</span>
                </button>

                <button
                  onClick={() => handlePreviewOnDashboard(idx)}
                  className="w-full py-2.5 px-3 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 rounded-xl text-xs font-semibold tracking-wider text-amber-300 flex items-center justify-center gap-1.5 transition-all active:scale-95"
                  title="Preview this rank on the actual Study.io Dashboard"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-amber-400" />
                  <span>PREVIEW ON DASHBOARD</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Free Fire Style Full-Screen Rank Advancement Modal */}
      <RankSettlementModal
        isOpen={Boolean(previewData)}
        data={previewData}
        onContinue={() => setPreviewData(null)}
      />
    </div>
  );
}
