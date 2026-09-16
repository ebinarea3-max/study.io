'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { soundFx } from '../lib/audio';
import confetti from 'canvas-confetti';
import {
  getRankTier,
  RankTierName,
  RankTierDetails,
} from '../lib/rankedSystem';
import { RankSettlementData } from '../types';

interface RankSettlementModalProps {
  isOpen: boolean;
  data: RankSettlementData | null;
  onContinue: () => void;
}

/**
 * Geometric Steel / Chrome Crest with Tier-Specific Metallic Inlay
 * Clean, architectural, and razor-sharp luxury finish.
 */
function GeometricCrestGraphic({
  tier,
  details,
}: {
  tier: RankTierName;
  details: RankTierDetails;
}) {
  const { config } = details;

  return (
    <div className="relative flex items-center justify-center w-48 h-48 sm:w-56 sm:h-56 select-none">
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full filter transition-all duration-500 drop-shadow-[0_12px_24px_rgba(0,0,0,0.6)]"
      >
        <defs>
          {/* Steel Light Chrome Bevel */}
          <linearGradient id="crestSteelLight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="30%" stopColor="#E2E8F0" />
            <stop offset="65%" stopColor="#94A3B8" />
            <stop offset="100%" stopColor="#64748B" />
          </linearGradient>

          {/* Steel Dark Brushed Shadow */}
          <linearGradient id="crestSteelDark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#94A3B8" />
            <stop offset="40%" stopColor="#64748B" />
            <stop offset="75%" stopColor="#334155" />
            <stop offset="100%" stopColor="#1E293B" />
          </linearGradient>

          {/* Bronze Metallic Inlay */}
          <linearGradient id="tierBronzeLight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="40%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>
          <linearGradient id="tierBronzeDark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D97706" />
            <stop offset="50%" stopColor="#92400E" />
            <stop offset="100%" stopColor="#451A03" />
          </linearGradient>

          {/* Silver Chrome Inlay */}
          <linearGradient id="tierSilverLight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="50%" stopColor="#E2E8F0" />
            <stop offset="100%" stopColor="#94A3B8" />
          </linearGradient>
          <linearGradient id="tierSilverDark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#94A3B8" />
            <stop offset="50%" stopColor="#64748B" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>

          {/* Gold Inlay */}
          <linearGradient id="tierGoldLight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FEF9C3" />
            <stop offset="40%" stopColor="#FACC15" />
            <stop offset="100%" stopColor="#CA8A04" />
          </linearGradient>
          <linearGradient id="tierGoldDark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EAB308" />
            <stop offset="50%" stopColor="#A16207" />
            <stop offset="100%" stopColor="#713F12" />
          </linearGradient>

          {/* Platinum Inlay */}
          <linearGradient id="tierPlatinumLight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E0F2FE" />
            <stop offset="40%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>
          <linearGradient id="tierPlatinumDark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0284C7" />
            <stop offset="50%" stopColor="#0369A1" />
            <stop offset="100%" stopColor="#075985" />
          </linearGradient>

          {/* Diamond Inlay (Crisp Ice-Blue / Diamond Chrome) */}
          <linearGradient id="tierDiamondLight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F0F9FF" />
            <stop offset="35%" stopColor="#BAE6FD" />
            <stop offset="70%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>
          <linearGradient id="tierDiamondDark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="45%" stopColor="#0369A1" />
            <stop offset="85%" stopColor="#1E3A8A" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>

          {/* Heroic Inlay (Ruby Steel) */}
          <linearGradient id="tierHeroicLight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FEE2E2" />
            <stop offset="40%" stopColor="#EF4444" />
            <stop offset="100%" stopColor="#B91C1C" />
          </linearGradient>
          <linearGradient id="tierHeroicDark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#B91C1C" />
            <stop offset="50%" stopColor="#7F1D1D" />
            <stop offset="100%" stopColor="#450A0A" />
          </linearGradient>

          {/* Grandmaster Inlay (Ember Gold & Obsidian) */}
          <linearGradient id="tierGrandmasterLight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFBEB" />
            <stop offset="40%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#EA580C" />
          </linearGradient>
          <linearGradient id="tierGrandmasterDark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EA580C" />
            <stop offset="50%" stopColor="#C2410C" />
            <stop offset="100%" stopColor="#431407" />
          </linearGradient>

          {/* Obsidian Inner Matte Base */}
          <radialGradient id="crestObsidian" cx="50%" cy="40%" r="65%">
            <stop offset="0%" stopColor="#171C26" />
            <stop offset="100%" stopColor="#0A0C10" />
          </radialGradient>
        </defs>

        {(() => {
          const accentLight =
            tier === 'Bronze' ? 'url(#tierBronzeLight)' :
            tier === 'Silver' ? 'url(#tierSilverLight)' :
            tier === 'Gold' ? 'url(#tierGoldLight)' :
            tier === 'Platinum' ? 'url(#tierPlatinumLight)' :
            tier === 'Diamond' ? 'url(#tierDiamondLight)' :
            tier === 'Heroic' ? 'url(#tierHeroicLight)' :
            'url(#tierGrandmasterLight)';

          const accentDark =
            tier === 'Bronze' ? 'url(#tierBronzeDark)' :
            tier === 'Silver' ? 'url(#tierSilverDark)' :
            tier === 'Gold' ? 'url(#tierGoldDark)' :
            tier === 'Platinum' ? 'url(#tierPlatinumDark)' :
            tier === 'Diamond' ? 'url(#tierDiamondDark)' :
            tier === 'Heroic' ? 'url(#tierHeroicDark)' :
            'url(#tierGrandmasterDark)';

          return (
            <g>
              {/* 1. Outer Precision Bevel: Left Half (Chrome Highlight) */}
              <polygon
                points="100,18 38,45 48,120 100,182 100,166 58,114 50,52 100,28"
                fill="url(#crestSteelLight)"
              />

              {/* 2. Outer Precision Bevel: Right Half (Steel Shadow) */}
              <polygon
                points="100,18 162,45 152,120 100,182 100,166 142,114 150,52 100,28"
                fill="url(#crestSteelDark)"
              />

              {/* 3. Outer Silhouette Border Line */}
              <polygon
                points="100,18 162,45 152,120 100,182 48,120 38,45"
                fill="none"
                stroke="rgba(255, 255, 255, 0.25)"
                strokeWidth="1"
              />

              {/* 4. Inner Recessed Obsidian Plate */}
              <polygon
                points="100,28 150,52 142,114 100,166 58,114 50,52"
                fill="url(#crestObsidian)"
                stroke="rgba(255, 255, 255, 0.12)"
                strokeWidth="1.2"
              />

              {/* 5. Center Symmetrical Bevel Crease */}
              <line
                x1="100"
                y1="28"
                x2="100"
                y2="166"
                stroke="rgba(255, 255, 255, 0.3)"
                strokeWidth="1"
              />

              {/* 6. Geometric Metallic Crest Emblem (Faceted Hex-Diamond) */}
              {/* Upper Left Facet (Light Accent) */}
              <polygon
                points="100,58 74,96 100,102"
                fill={accentLight}
              />

              {/* Upper Right Facet (Dark Accent) */}
              <polygon
                points="100,58 126,96 100,102"
                fill={accentDark}
              />

              {/* Lower Left Facet (Steel Reflection) */}
              <polygon
                points="74,96 100,144 100,102"
                fill="url(#crestSteelLight)"
              />

              {/* Lower Right Facet (Steel Shadow) */}
              <polygon
                points="126,96 100,144 100,102"
                fill="url(#crestSteelDark)"
              />

              {/* Inner Cut-Out Diamond Chevron Rim */}
              <polygon
                points="100,74 116,96 100,124 84,96"
                fill="#0A0C10"
                stroke="rgba(255, 255, 255, 0.4)"
                strokeWidth="1"
              />

              {/* Center Core Gem Pip */}
              <polygon
                points="100,88 106,96 100,104 94,96"
                fill={accentLight}
              />

              {/* Subtle Architectural Accent Lines on Shoulder Flanges */}
              <line x1="56" y1="62" x2="80" y2="72" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1" />
              <line x1="144" y1="62" x2="120" y2="72" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1" />
              <line x1="62" y1="110" x2="82" y2="126" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="1" />
              <line x1="138" y1="110" x2="118" y2="126" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="1" />
            </g>
          );
        })()}
      </svg>
    </div>
  );
}

export function RankSettlementModal({
  isOpen,
  data,
  onContinue,
}: RankSettlementModalProps) {
  const [animatingRP, setAnimatingRP] = useState(0);
  const [displayedGain, setDisplayedGain] = useState(0);
  const [progressRatio, setProgressRatio] = useState(0);

  const prevRP = data?.prevRP ?? 0;
  const newRP = data?.newRP ?? 0;
  const totalGained = data?.breakdown.totalGained ?? 0;
  const sessionRP = data?.breakdown.sessionRP ?? 0;
  const goalStreakBonus = data?.breakdown.goalStreakBonus ?? 0;
  const taskBonus = data?.breakdown.taskBonus ?? 0;

  // Get rank details for new RP
  const newRankDetails = useMemo(() => getRankTier(newRP), [newRP]);
  const prevRankDetails = useMemo(() => getRankTier(prevRP), [prevRP]);
  const isRankUp = newRankDetails.fullTitle !== prevRankDetails.fullTitle;

  // Smooth linear easing (0.8s duration) from start RP to end RP
  useEffect(() => {
    if (!isOpen) {
      setAnimatingRP(0);
      setDisplayedGain(0);
      setProgressRatio(0);
      return;
    }

    soundFx.playRankSettlementSound();

    if (isRankUp) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.55 },
        colors: [newRankDetails.config.badgeAccent, '#FFFFFF', '#94A3B8'],
      });
    }

    const startTime = performance.now();
    const duration = 800; // 0.8s precision animation
    let animationFrameId: number;

    const tick = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);

      const currentRP = Math.round(prevRP + (newRP - prevRP) * progress);
      const currentGain = Math.round(totalGained * progress);

      setAnimatingRP(currentRP);
      setDisplayedGain(currentGain);

      const tierMin = newRankDetails.minRP;
      const tierMax = newRankDetails.maxRP;
      const inTier = Math.max(0, currentRP - tierMin);
      const needed = Math.max(1, tierMax - tierMin);
      setProgressRatio(Math.min(1, inTier / needed));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(tick);
      } else {
        setAnimatingRP(newRP);
        setDisplayedGain(totalGained);
        const finalInTier = Math.max(0, newRP - tierMin);
        setProgressRatio(Math.min(1, finalInTier / needed));
      }
    };

    animationFrameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isOpen, prevRP, newRP, totalGained, isRankUp, newRankDetails]);

  if (!isOpen || !data) return null;

  const remainingRP = Math.max(0, newRankDetails.maxRP - newRP);
  const nextMilestoneText = newRankDetails.isMaxTier
    ? 'Peak Rank Achieved'
    : `Next Milestone: ${newRankDetails.nextTierTitle} (${remainingRP} RP remaining)`;

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0c10]/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 sm:p-6 select-none overflow-hidden animate-in fade-in duration-300">
      <div className="relative z-10 w-full max-w-xl flex flex-col items-center text-center">
        
        {/* 1. Header: Small, tracked-out label in muted slate */}
        <div className="text-xs tracking-[0.25em] text-slate-400 uppercase font-medium mb-1">
          {isRankUp ? 'TIER PROMOTION' : 'RANK SETTLEMENT'}
        </div>

        {/* 2. Crest & Badge: Sharp geometric shield with soft, centered radial backlight only */}
        <div className="relative flex items-center justify-center my-3 sm:my-4">
          {/* Subtle soft radial backlight centered behind badge only */}
          <div
            className="absolute w-44 h-44 sm:w-56 sm:h-56 rounded-full blur-[64px] opacity-20 pointer-events-none transition-all duration-700"
            style={{ backgroundColor: newRankDetails.config.badgeAccent }}
          />
          <GeometricCrestGraphic
            tier={newRankDetails.tier}
            details={newRankDetails}
          />
        </div>

        {/* 3. Rank Title: Crisp metallic text with zero comic drop shadows */}
        <h2 className="text-3xl sm:text-4xl font-bold tracking-wider text-white uppercase mt-1">
          {newRankDetails.fullTitle}
        </h2>

        {/* Subtext: Muted secondary text */}
        <p className="text-xs sm:text-sm text-slate-400 font-normal tracking-wide mt-1.5">
          {nextMilestoneText}
        </p>

        {/* 4. Progress & Stat Breakdown: Unified glassmorphic strip */}
        <div className="w-full max-w-xl mx-auto my-5 px-5 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-xs sm:text-sm text-slate-300">
          <span className="flex items-center gap-1.5">
            <span className="text-slate-400">Focus Time</span>
            <span className="font-mono font-medium text-emerald-400">+{sessionRP} RP</span>
          </span>

          {goalStreakBonus > 0 && (
            <>
              <span className="text-slate-600 select-none">•</span>
              <span className="flex items-center gap-1.5">
                <span className="text-slate-400">Streak Bonus</span>
                <span className="font-mono font-medium text-amber-400">+{goalStreakBonus} RP</span>
              </span>
            </>
          )}

          {taskBonus > 0 && (
            <>
              <span className="text-slate-600 select-none">•</span>
              <span className="flex items-center gap-1.5">
                <span className="text-slate-400">Task Bonus</span>
                <span className="font-mono font-medium text-cyan-400">+{taskBonus} RP</span>
              </span>
            </>
          )}

          <span className="text-slate-600 select-none">=</span>
          <span className="font-mono font-semibold text-white tracking-tight">
            +{displayedGain} RP Total
          </span>
        </div>

        {/* Slim, precision-engineered segmented progress bar */}
        <div className="w-full max-w-xl flex flex-col gap-2 mb-8">
          <div className="flex items-center justify-between text-xs text-slate-400 tracking-wider">
            <span className="uppercase tracking-[0.15em] font-medium text-[11px] text-slate-400">
              Tier Progress
            </span>
            <span className="font-mono text-slate-300 text-xs">
              <span className="text-white font-medium">{animatingRP.toLocaleString()}</span>
              <span className="text-slate-500"> / {newRankDetails.maxRP.toLocaleString()} RP</span>
            </span>
          </div>

          <div className="relative w-full h-2 bg-white/[0.06] rounded-full overflow-hidden border border-white/[0.06]">
            {/* Smooth linear easing fill */}
            <div
              className="h-full rounded-full transition-all duration-75"
              style={{
                width: `${Math.min(100, Math.max(1, progressRatio * 100))}%`,
                background: `linear-gradient(90deg, #94A3B8, ${newRankDetails.config.badgeAccent})`,
              }}
            />

            {/* Precision tick marks at 25%, 50%, 75% */}
            <div className="absolute inset-0 flex justify-between px-[25%] pointer-events-none">
              <div className="w-[1px] h-full bg-black/40" />
              <div className="w-[1px] h-full bg-black/40" />
            </div>
          </div>
        </div>

        {/* 5. Sleek, rectangular, slightly beveled "CONTINUE" button */}
        <div className="flex justify-center">
          <button
            onClick={onContinue}
            className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium tracking-wider px-8 py-3 rounded-lg transition-all active:scale-[0.98] cursor-pointer shadow-sm hover:shadow-md"
          >
            CONTINUE
          </button>
        </div>
      </div>
    </div>
  );
}
