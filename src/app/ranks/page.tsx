'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Play, Zap, Shield } from 'lucide-react';
import { RANK_TIERS, getRankTier, RankTierConfig } from '../../lib/rankedSystem';
import { RankCrestBadge } from '../../components/common/RankCrestBadge';
import { RankSettlementModal } from '../../components/RankSettlementModal';
import { RankSettlementData } from '../../types';

export default function RanksShowcasePage() {
  const [activeModalData, setActiveModalData] = useState<RankSettlementData | null>(null);

  // Quick Controls Bar State
  const [selectedRankIdx, setSelectedRankIdx] = useState<number>(0);
  const [arbitraryRP, setArbitraryRP] = useState<number>(180);
  const [isRankUpToggle, setIsRankUpToggle] = useState<boolean>(true);

  // Helper to open modal in standard completed session for a specific tier
  const handleTestModal = (config: RankTierConfig, idx: number) => {
    const minRP = config.minRP;
    const maxRP = config.maxRP;
    const span = Math.max(1, maxRP - minRP);

    // Position midway in current tier bracket
    const startInTier = Math.min(span - 50, Math.floor(span * 0.35));
    const prevRP = minRP + Math.max(0, startInTier);
    const sessionDurationMinutes = 45;
    const gainedRP = sessionDurationMinutes; // 1 min = 1 RP
    const newRP = prevRP + gainedRP;

    setActiveModalData({
      prevRP,
      newRP,
      breakdown: {
        sessionRP: gainedRP,
        goalStreakBonus: 0,
        taskBonus: 0,
        totalGained: gainedRP,
        durationSeconds: sessionDurationMinutes * 60,
        isUnderMinDuration: false,
        streakBonusClaimedToday: false,
      },
      subjectName: 'System Architecture',
      subjectColor: config.badgeAccent,
    });
  };

  // Helper to simulate crossing into a tier from previous tier
  const handleSimulateRankUp = (config: RankTierConfig, idx: number) => {
    if (idx === 0) {
      // For Bronze 1, simulate rank up into Bronze 2
      const targetConfig = RANK_TIERS[1];
      const threshold = targetConfig.minRP; // 180 RP
      const prevRP = threshold - 6; // 174 RP
      const gained = 12; // +12 RP -> 186 RP (Bronze 2 unlocked!)
      const newRP = prevRP + gained;

      setActiveModalData({
        prevRP,
        newRP,
        breakdown: {
          sessionRP: gained,
          goalStreakBonus: 0,
          taskBonus: 0,
          totalGained: gained,
          durationSeconds: gained * 60,
          isUnderMinDuration: false,
          streakBonusClaimedToday: false,
        },
        subjectName: 'Quantum Mechanics',
        subjectColor: targetConfig.badgeAccent,
      });
      return;
    }

    // Set doorstep at exact verge of this rank
    const threshold = config.minRP;
    const prevRP = Math.max(0, threshold - 5);
    const gained = 15; // +15 RP (crosses threshold with 10 RP into new tier)
    const newRP = prevRP + gained;

    setActiveModalData({
      prevRP,
      newRP,
      breakdown: {
        sessionRP: gained,
        goalStreakBonus: 0,
        taskBonus: 0,
        totalGained: gained,
        durationSeconds: gained * 60,
        isUnderMinDuration: false,
        streakBonusClaimedToday: false,
      },
      subjectName: 'Advanced Algorithms',
      subjectColor: config.badgeAccent,
    });
  };

  // Quick toolbar launch handler
  const handleToolbarLaunch = () => {
    const targetRP = Math.max(0, Number(arbitraryRP) || 0);

    if (isRankUpToggle) {
      const targetTier = getRankTier(targetRP);
      const prevTierMin = targetTier.minRP;
      // Start slightly below current tier threshold if not Bronze 1
      const prevRP = Math.max(0, prevTierMin > 0 ? prevTierMin - 8 : 0);
      const newRP = prevTierMin > 0 ? prevTierMin + 12 : 25;
      const gained = newRP - prevRP;

      setActiveModalData({
        prevRP,
        newRP,
        breakdown: {
          sessionRP: gained,
          goalStreakBonus: 0,
          taskBonus: 0,
          totalGained: gained,
          durationSeconds: gained * 60,
          isUnderMinDuration: false,
          streakBonusClaimedToday: false,
        },
        subjectName: 'Simulated Rank Promotion',
        subjectColor: targetTier.config.badgeAccent,
      });
    } else {
      const targetTier = getRankTier(targetRP);
      const gained = 30; // 30 min focus
      const prevRP = Math.max(0, targetRP - gained);
      const newRP = targetRP;

      setActiveModalData({
        prevRP,
        newRP,
        breakdown: {
          sessionRP: gained,
          goalStreakBonus: 0,
          taskBonus: 0,
          totalGained: gained,
          durationSeconds: gained * 60,
          isUnderMinDuration: false,
          streakBonusClaimedToday: false,
        },
        subjectName: 'Custom Session Test',
        subjectColor: targetTier.config.badgeAccent,
      });
    }
  };

  return (
    <div className="bg-[#05070a] text-white min-h-screen p-6 sm:p-10 font-sans selection:bg-amber-500/30 selection:text-amber-200">
      
      {/* Top Header Navigation */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-mono font-semibold text-neutral-300 hover:text-white transition-all active:scale-95"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </Link>
            <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold">
              DEV SHOWCASE
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-wider uppercase text-white drop-shadow-[0_2px_12px_rgba(255,255,255,0.1)]">
            STUDY.IO // RANK SHOWCASE &amp; ANIMATION LAB
          </h1>
          <p className="text-sm sm:text-base text-neutral-400 mt-1 max-w-3xl leading-relaxed">
            Interactive testing playground to preview all 23 competitive rank tiers, inspect official crest assets, check RP &amp; hours thresholds (1 min = 1 RP), and test post-session animations.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(245,158,11,0.25)] active:scale-95"
          >
            Open Timer
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto pt-8 flex flex-col gap-8">
        
        {/* Quick Testing Controls Toolbar */}
        <section className="bg-[#0b0e14]/90 border border-white/[0.08] rounded-2xl p-5 sm:p-6 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/[0.06]">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-bold tracking-widest uppercase text-white font-mono">
              QUICK TESTING TOOLBAR
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            {/* 1. Rank Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-semibold">
                Select Rank Preset
              </label>
              <select
                value={selectedRankIdx}
                onChange={(e) => {
                  const idx = Number(e.target.value);
                  setSelectedRankIdx(idx);
                  setArbitraryRP(RANK_TIERS[idx].minRP);
                }}
                className="w-full bg-[#121620] border border-white/10 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
              >
                {RANK_TIERS.map((tier, idx) => (
                  <option key={tier.fullTitle} value={idx}>
                    #{idx + 1} {tier.fullTitle} ({tier.minRP.toLocaleString()} RP)
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Arbitrary RP Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-semibold">
                Target RP Value
              </label>
              <input
                type="number"
                min={0}
                max={50000}
                value={arbitraryRP}
                onChange={(e) => setArbitraryRP(Number(e.target.value))}
                className="w-full bg-[#121620] border border-white/10 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500 transition-colors"
                placeholder="e.g. 11700"
              />
            </div>

            {/* 3. Rank-Up Toggle */}
            <div className="flex items-center gap-3 bg-[#121620] border border-white/10 rounded-xl px-4 py-2.5 h-[38px]">
              <input
                type="checkbox"
                id="rankUpToggle"
                checked={isRankUpToggle}
                onChange={(e) => setIsRankUpToggle(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-0 bg-transparent border-white/20 cursor-pointer"
              />
              <label
                htmlFor="rankUpToggle"
                className="text-xs font-medium text-neutral-300 cursor-pointer select-none"
              >
                Trigger as Rank-Up Event
              </label>
            </div>

            {/* 4. Launch Modal Button */}
            <button
              onClick={handleToolbarLaunch}
              className="w-full h-[38px] px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_16px_rgba(245,158,11,0.25)] active:scale-95 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Open Performance Modal</span>
            </button>
          </div>
        </section>

        {/* 23 Ranks Hierarchy Grid */}
        <section className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-500" />
              <h2 className="text-base sm:text-lg font-bold tracking-widest uppercase text-white font-mono">
                ALL 23 COMPETITIVE RANKS ({RANK_TIERS.length} TIERS)
              </h2>
            </div>
            <span className="text-xs font-mono text-neutral-400">
              1 min = 1 RP &bull; 60 RP = 1 hr
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {RANK_TIERS.map((config, idx) => {
              const hours = Math.round(config.minRP / 60);
              const isGrandmaster = config.tier === 'Grandmaster';
              const hoursLabel = isGrandmaster ? '300+ hrs' : `${hours} hrs`;
              const rpLabel = isGrandmaster ? '18,000+ RP' : `${config.minRP.toLocaleString()} RP`;

              return (
                <div
                  key={config.fullTitle}
                  className="group bg-[#0b0e14]/80 border border-white/[0.08] hover:border-amber-500/40 rounded-2xl p-5 flex flex-col items-center justify-between gap-4 transition-all duration-300 hover:shadow-[0_0_30px_rgba(245,158,11,0.12)] relative overflow-hidden backdrop-blur-md"
                >
                  {/* Subtle top rank accent glow */}
                  <div
                    className="absolute top-0 left-0 right-0 h-[2px] opacity-60 group-hover:opacity-100 transition-opacity"
                    style={{ backgroundColor: config.badgeAccent }}
                  />

                  {/* Rank Index Pill */}
                  <div className="w-full flex items-center justify-between text-[10px] font-mono text-neutral-500">
                    <span>RANK #{idx + 1}</span>
                    <span className="text-neutral-400 uppercase">{config.tier}</span>
                  </div>

                  {/* Rank Badge Visual */}
                  <div className="relative py-2 flex items-center justify-center transform group-hover:scale-105 transition-transform duration-300">
                    <RankCrestBadge
                      tier={config.tier}
                      division={config.division}
                      size={110}
                      isSettled={true}
                    />
                  </div>

                  {/* Rank Information */}
                  <div className="text-center w-full flex flex-col items-center gap-1.5">
                    <h3 className="text-base font-extrabold tracking-wider uppercase text-white font-sans">
                      {config.fullTitle}
                    </h3>

                    {/* Threshold Tags */}
                    <div className="flex items-center justify-center gap-2 w-full mt-1">
                      <span className="px-2.5 py-0.5 rounded-md bg-white/[0.04] border border-white/10 font-mono text-[11px] text-neutral-300 font-medium">
                        {hoursLabel}
                      </span>
                      <span
                        className="px-2.5 py-0.5 rounded-md font-mono text-[11px] font-bold border"
                        style={{
                          backgroundColor: `${config.badgeAccent}15`,
                          borderColor: `${config.badgeAccent}35`,
                          color: config.badgeAccent,
                        }}
                      >
                        {rpLabel}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 w-full pt-2 border-t border-white/[0.06]">
                    <button
                      onClick={() => handleTestModal(config, idx)}
                      className="px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-neutral-200 hover:text-white font-mono text-xs font-semibold transition-all active:scale-95 cursor-pointer text-center"
                      title={`Open performance review modal within ${config.fullTitle}`}
                    >
                      Test Modal
                    </button>
                    <button
                      onClick={() => handleSimulateRankUp(config, idx)}
                      className="px-3 py-2 rounded-xl border font-mono text-xs font-bold transition-all active:scale-95 cursor-pointer text-center flex items-center justify-center gap-1"
                      style={{
                        backgroundColor: `${config.badgeAccent}15`,
                        borderColor: `${config.badgeAccent}40`,
                        color: config.badgeAccent,
                      }}
                      title={`Simulate promotion into ${config.fullTitle}`}
                    >
                      <Zap className="w-3 h-3 fill-current" />
                      <span>Rank Up</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Interactive Performance Review / Rank Settlement Modal */}
      <RankSettlementModal
        isOpen={Boolean(activeModalData)}
        data={activeModalData}
        onContinue={() => setActiveModalData(null)}
      />
    </div>
  );
}
