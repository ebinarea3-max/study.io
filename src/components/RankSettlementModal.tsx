'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Clock, Flame, CheckCircle2, ChevronRight, Zap, Sparkles } from 'lucide-react';
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
 * Esports Winged Battle Crest Vector Art for each Free Fire Tier
 */
function BattleCrestGraphic({
  tier,
  details,
}: {
  tier: RankTierName;
  details: RankTierDetails;
}) {
  const { config } = details;

  return (
    <div className="relative flex items-center justify-center w-56 h-56 sm:w-72 sm:h-72 select-none">
      {/* Background Shockwave Aura */}
      <div
        className="absolute inset-0 rounded-full blur-3xl opacity-40 animate-pulse pointer-events-none transition-all duration-1000"
        style={{ backgroundColor: config.badgeAccent }}
      />

      <svg
        viewBox="0 0 400 400"
        className="w-full h-full drop-shadow-[0_0_35px_rgba(0,0,0,0.8)] filter transition-all duration-500"
        style={{
          filter: `drop-shadow(0 0 25px ${config.glowColor}) drop-shadow(0 0 50px ${config.glowColor})`,
        }}
      >
        <defs>
          {/* Bronze Metallic Gradient */}
          <linearGradient id="bronzeMetal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="30%" stopColor="#D97706" />
            <stop offset="60%" stopColor="#78350F" />
            <stop offset="100%" stopColor="#451A03" />
          </linearGradient>

          {/* Silver Metallic Gradient */}
          <linearGradient id="silverMetal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="25%" stopColor="#E2E8F0" />
            <stop offset="50%" stopColor="#94A3B8" />
            <stop offset="75%" stopColor="#CBD5E1" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>

          {/* Gold Metallic Gradient */}
          <linearGradient id="goldMetal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="25%" stopColor="#FACC15" />
            <stop offset="50%" stopColor="#EAB308" />
            <stop offset="75%" stopColor="#CA8A04" />
            <stop offset="100%" stopColor="#713F12" />
          </linearGradient>

          {/* Platinum Metallic Gradient */}
          <linearGradient id="platinumMetal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E0F2FE" />
            <stop offset="20%" stopColor="#38BDF8" />
            <stop offset="50%" stopColor="#0284C7" />
            <stop offset="80%" stopColor="#0891B2" />
            <stop offset="100%" stopColor="#0E7490" />
          </linearGradient>

          {/* Diamond Metallic Gradient */}
          <linearGradient id="diamondMetal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F5D0FE" />
            <stop offset="25%" stopColor="#E879F9" />
            <stop offset="50%" stopColor="#C084FC" />
            <stop offset="75%" stopColor="#9333EA" />
            <stop offset="100%" stopColor="#581C87" />
          </linearGradient>

          {/* Heroic Metallic Gradient */}
          <linearGradient id="heroicMetal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FEE2E2" />
            <stop offset="25%" stopColor="#EF4444" />
            <stop offset="50%" stopColor="#DC2626" />
            <stop offset="80%" stopColor="#991B1B" />
            <stop offset="100%" stopColor="#450A0A" />
          </linearGradient>

          {/* Grandmaster Metallic Gradient */}
          <linearGradient id="grandmasterMetal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFBEB" />
            <stop offset="20%" stopColor="#F59E0B" />
            <stop offset="50%" stopColor="#EA580C" />
            <stop offset="80%" stopColor="#DC2626" />
            <stop offset="100%" stopColor="#7F1D1D" />
          </linearGradient>

          {/* Core Gem Radial Gradient */}
          <radialGradient id="gemGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="40%" stopColor={config.badgeAccent} stopOpacity="0.8" />
            <stop offset="100%" stopColor={config.badgeSecondary} stopOpacity="0.1" />
          </radialGradient>
        </defs>

        {/* Dynamic Tier SVG Graphics */}
        {(() => {
          const metalId = 
            tier === 'Bronze' ? 'url(#bronzeMetal)' :
            tier === 'Silver' ? 'url(#silverMetal)' :
            tier === 'Gold' ? 'url(#goldMetal)' :
            tier === 'Platinum' ? 'url(#platinumMetal)' :
            tier === 'Diamond' ? 'url(#diamondMetal)' :
            tier === 'Heroic' ? 'url(#heroicMetal)' :
            'url(#grandmasterMetal)';

          return (
            <g>
              {/* Outer Energy Burst Rays */}
              <g opacity="0.35" stroke={config.badgeAccent} strokeWidth="1.5">
                <line x1="200" y1="20" x2="200" y2="60" />
                <line x1="200" y1="340" x2="200" y2="380" />
                <line x1="20" y1="200" x2="60" y2="200" />
                <line x1="340" y1="200" x2="380" y2="200" />
                <line x1="70" y1="70" x2="100" y2="100" />
                <line x1="330" y1="70" x2="300" y2="100" />
                <line x1="70" y1="330" x2="100" y2="300" />
                <line x1="330" y1="330" x2="300" y2="300" />
              </g>

              {/* LEFT WING - Layer 1 (Back Wing Tip) */}
              <path
                d="M 170 190 C 130 140, 70 100, 20 120 C 50 150, 90 190, 150 215 Z"
                fill={metalId}
                opacity="0.8"
                stroke="#000"
                strokeWidth="1.5"
              />
              {/* LEFT WING - Layer 2 (Main Wing Blade) */}
              <path
                d="M 180 180 C 120 110, 60 70, 10 75 C 30 115, 80 160, 160 210 Z"
                fill={metalId}
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="1.5"
              />
              {/* LEFT WING - Layer 3 (Upper Primary Razor Feather) */}
              <path
                d="M 190 170 C 140 80, 90 40, 35 30 C 70 70, 110 130, 175 200 Z"
                fill={metalId}
                stroke="#FFFFFF"
                strokeWidth="2"
              />
              {/* LEFT WING - Layer 4 (Lower Feather Flange) */}
              <path
                d="M 160 210 C 110 220, 60 240, 30 260 C 60 250, 110 240, 155 230 Z"
                fill={metalId}
                opacity="0.9"
              />

              {/* RIGHT WING - Layer 1 (Back Wing Tip) */}
              <path
                d="M 230 190 C 270 140, 330 100, 380 120 C 350 150, 310 190, 250 215 Z"
                fill={metalId}
                opacity="0.8"
                stroke="#000"
                strokeWidth="1.5"
              />
              {/* RIGHT WING - Layer 2 (Main Wing Blade) */}
              <path
                d="M 220 180 C 280 110, 340 70, 390 75 C 370 115, 320 160, 240 210 Z"
                fill={metalId}
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="1.5"
              />
              {/* RIGHT WING - Layer 3 (Upper Primary Razor Feather) */}
              <path
                d="M 210 170 C 260 80, 310 40, 365 30 C 330 70, 290 130, 225 200 Z"
                fill={metalId}
                stroke="#FFFFFF"
                strokeWidth="2"
              />
              {/* RIGHT WING - Layer 4 (Lower Feather Flange) */}
              <path
                d="M 240 210 C 290 220, 340 240, 370 260 C 340 250, 290 240, 245 230 Z"
                fill={metalId}
                opacity="0.9"
              />

              {/* CENTER BATTLE SHIELD (Outer Spiked Frame) */}
              <polygon
                points="200,80 265,130 255,250 200,320 145,250 135,130"
                fill="#0F172A"
                stroke={metalId}
                strokeWidth="6"
              />

              {/* Inner Shield Bevel Rim */}
              <polygon
                points="200,98 250,140 240,240 200,298 160,240 150,140"
                fill="#090D16"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="2"
              />

              {/* Top Crest Crown / Horns */}
              {tier === 'Heroic' || tier === 'Grandmaster' ? (
                <g>
                  <polygon points="200,50 215,90 200,85 185,90" fill="#EF4444" stroke="#FFF" strokeWidth="1" />
                  <polygon points="175,65 190,95 175,90 160,95" fill={metalId} />
                  <polygon points="225,65 240,95 225,90 210,95" fill={metalId} />
                </g>
              ) : (
                <g>
                  <polygon points="200,55 212,85 200,80 188,85" fill={metalId} stroke="#FFF" strokeWidth="1" />
                  <polygon points="180,68 192,88 180,85 170,88" fill={metalId} />
                  <polygon points="220,68 230,88 220,85 208,88" fill={metalId} />
                </g>
              )}

              {/* Central Glowing Energy Gem Core */}
              <circle cx="200" cy="195" r="45" fill="url(#gemGlow)" />
              <polygon
                points="200,160 228,180 228,215 200,235 172,215 172,180"
                fill={metalId}
                stroke="#FFFFFF"
                strokeWidth="2.5"
              />

              {/* Inner Core Insignia */}
              <circle cx="200" cy="197" r="14" fill="#FFFFFF" opacity="0.95" />
              <polygon
                points="200,186 204,194 212,195 206,201 208,209 200,205 192,209 194,201 188,195 196,194"
                fill="#0F172A"
              />

              {/* Lower Tier Division Star Flanges */}
              <g transform="translate(0, 10)">
                <polygon points="200,265 208,280 200,277 192,280" fill="#FFF" />
              </g>
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
  const [hasImpacted, setHasImpacted] = useState(false);
  const [particles, setParticles] = useState<{ id: number; left: number; delay: number; duration: number; size: number }[]>([]);

  const prevRP = data?.prevRP ?? 0;
  const newRP = data?.newRP ?? 0;
  const totalGained = data?.breakdown.totalGained ?? 0;
  const sessionRP = data?.breakdown.sessionRP ?? 0;
  const goalStreakBonus = data?.breakdown.goalStreakBonus ?? 0;
  const taskBonus = data?.breakdown.taskBonus ?? 0;
  const durationSeconds = data?.breakdown.durationSeconds ?? 0;
  const durationMinutes = Math.max(1, Math.round(durationSeconds / 60));

  // Get rank details for new RP
  const newRankDetails = useMemo(() => getRankTier(newRP), [newRP]);
  const prevRankDetails = useMemo(() => getRankTier(prevRP), [prevRP]);
  const isRankUp = newRankDetails.fullTitle !== prevRankDetails.fullTitle;

  // Initialize drift particles
  useEffect(() => {
    const p = Array.from({ length: 24 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 3,
      duration: 3 + Math.random() * 4,
      size: 2 + Math.random() * 4,
    }));
    setParticles(p);
  }, []);

  // Impact entrance scale-down and 1.2s smooth RP animation
  useEffect(() => {
    if (!isOpen) {
      setAnimatingRP(0);
      setDisplayedGain(0);
      setProgressRatio(0);
      setHasImpacted(false);
      return;
    }

    // Trigger crest impact entrance (scale-125 -> scale-100)
    const impactTimer = setTimeout(() => {
      setHasImpacted(true);
    }, 40);

    // Play Victory Rank Settlement Fanfare Chime
    soundFx.playRankSettlementSound();

    if (isRankUp) {
      confetti({
        particleCount: 160,
        spread: 100,
        origin: { y: 0.55 },
        colors: [newRankDetails.config.badgeAccent, '#FFFFFF', '#F59E0B', '#38BDF8'],
      });
    }

    // Smooth count-up animation from prevRP to newRP over 1.2 seconds (1200ms)
    const startTime = performance.now();
    const duration = 1200;
    let animationFrameId: number;

    const tick = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);

      const currentRP = Math.round(prevRP + (newRP - prevRP) * ease);
      const currentGain = Math.round(totalGained * ease);

      setAnimatingRP(currentRP);
      setDisplayedGain(currentGain);

      // Current progress within the target tier
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
      }
    };

    animationFrameId = requestAnimationFrame(tick);

    return () => {
      clearTimeout(impactTimer);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isOpen, prevRP, newRP, totalGained, isRankUp, newRankDetails]);

  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#07090e]/95 backdrop-blur-md flex flex-col items-center justify-center select-none overflow-hidden animate-in fade-in duration-300">
      {/* 1. Backdrop Radial Atmosphere Glowing with Tier Accent */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-1000"
        style={{
          background: `radial-gradient(ellipse 70% 60% at 50% 35%, ${newRankDetails.config.glowColor}, rgba(7,9,14,0.98) 75%)`,
        }}
      />

      {/* 2. Esports Speed Blur Neon Lines */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        <div className="absolute top-1/4 -left-20 w-[140%] h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent -rotate-12 blur-[0.5px] animate-pulse" />
        <div className="absolute top-1/2 -left-20 w-[140%] h-[2px] bg-gradient-to-r from-transparent via-amber-300 to-transparent -rotate-6 blur-[1px] animate-pulse" />
        <div className="absolute top-3/4 -left-20 w-[140%] h-[1.5px] bg-gradient-to-r from-transparent via-rose-500 to-transparent 6 blur-[0.5px] animate-pulse" />
      </div>

      {/* 3. Floating Ambient Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map(p => (
          <div
            key={p.id}
            className="absolute rounded-full pointer-events-none animate-float-up"
            style={{
              left: `${p.left}%`,
              bottom: '-10px',
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: newRankDetails.config.badgeAccent,
              boxShadow: `0 0 10px ${newRankDetails.config.glowColor}`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              opacity: 0.5,
            }}
          />
        ))}
      </div>

      {/* Top Banner Header */}
      <div className="relative z-10 w-full max-w-3xl px-6 pt-4 sm:pt-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-[10px] sm:text-xs font-black tracking-[0.25em] text-slate-400 uppercase">
            STUDY.IO BATTLE SETTLEMENT
          </span>
        </div>
        <div className="text-[10px] sm:text-xs font-mono font-bold tracking-widest text-slate-400 px-3 py-1 rounded bg-white/[0.04] border border-white/[0.08]">
          SEASON 2026-09
        </div>
      </div>

      {/* Center Cinematic Victory Column */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center w-full max-w-3xl px-4 py-2">
        {/* Italic Bold "RANK UP!" or "MATCH SETTLEMENT" with neon glow */}
        <div className="flex flex-col items-center -mb-2">
          <div className="flex items-center gap-2 mb-1">
            <Zap className={`w-4 h-4 fill-current animate-bounce ${isRankUp ? 'text-amber-400' : 'text-cyan-400'}`} />
            <span
              className={`text-xs sm:text-sm font-black italic tracking-[0.35em] uppercase ${
                isRankUp
                  ? 'text-amber-400 drop-shadow-[0_0_15px_rgba(245,158,11,0.9)]'
                  : 'text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.9)]'
              }`}
            >
              {isRankUp ? 'TIER UPGRADE' : 'VICTORY SETTLEMENT'}
            </span>
            <Zap className={`w-4 h-4 fill-current animate-bounce ${isRankUp ? 'text-amber-400' : 'text-cyan-400'}`} />
          </div>

          <h1
            className={`text-4xl sm:text-6xl md:text-7xl font-black italic tracking-wider uppercase text-center text-transparent bg-clip-text ${
              isRankUp
                ? 'bg-gradient-to-b from-amber-100 via-amber-300 to-yellow-500 drop-shadow-[0_0_35px_rgba(245,158,11,0.85)]'
                : 'bg-gradient-to-b from-white via-cyan-100 to-cyan-400 drop-shadow-[0_0_35px_rgba(34,211,238,0.85)]'
            }`}
          >
            {isRankUp ? 'RANK UP!' : 'MATCH SETTLEMENT'}
          </h1>
        </div>

        {/* Center Crest: Impact scale-down entrance (scale-125 -> scale-100 with aura pulse) */}
        <div
          className={`relative my-2 sm:my-3 transition-all duration-700 ease-out transform ${
            hasImpacted ? 'scale-100 opacity-100' : 'scale-125 opacity-0'
          }`}
        >
          {/* Pulsing Aura Shockwave */}
          <div
            className="absolute inset-0 rounded-full blur-3xl opacity-50 animate-pulse pointer-events-none"
            style={{ backgroundColor: newRankDetails.config.badgeAccent }}
          />
          <BattleCrestGraphic
            tier={newRankDetails.tier}
            details={newRankDetails}
          />
        </div>

        {/* Sharp Metallic Division Title showing active rank */}
        <div className="flex flex-col items-center mb-4">
          <div
            className={`text-3xl sm:text-5xl font-black italic tracking-widest uppercase bg-gradient-to-b ${newRankDetails.config.metallicGradient} bg-clip-text text-transparent`}
            style={{
              filter: `drop-shadow(0 0 20px ${newRankDetails.config.glowColor})`,
            }}
          >
            {newRankDetails.fullTitle}
          </div>
          <div className="text-xs sm:text-sm font-bold tracking-widest text-slate-300 mt-1 flex items-center gap-1.5">
            <span className="text-slate-400">NEXT TIER:</span>
            <span style={{ color: newRankDetails.config.badgeAccent }} className="font-mono font-black">
              {newRankDetails.nextTierTitle}
            </span>
          </div>
        </div>

        {/* Breakdown List Cards */}
        <div className="w-full max-w-xl grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mb-5">
          {/* +{sessionRP} RP (Study Duration) */}
          <div className="relative overflow-hidden rounded-xl bg-slate-900/90 border border-slate-700/60 p-2.5 sm:p-3 flex flex-col items-center text-center shadow-lg group hover:border-cyan-500/50 transition-colors">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 mb-1 shadow-sm">
              <Clock className="w-4 h-4" />
            </div>
            <div className="text-base sm:text-xl font-black font-mono tracking-tight text-cyan-300">
              +{sessionRP} RP
            </div>
            <div className="text-[11px] sm:text-xs text-slate-300 font-semibold mt-0.5 leading-tight">
              (Study Duration)
            </div>
            <div className="text-[9px] text-slate-400 font-mono mt-0.5">
              {durationMinutes} min focused
            </div>
          </div>

          {/* +50 RP (Daily Streak Bonus) */}
          <div className="relative overflow-hidden rounded-xl bg-slate-900/90 border border-slate-700/60 p-2.5 sm:p-3 flex flex-col items-center text-center shadow-lg group hover:border-amber-500/50 transition-colors">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-1 shadow-sm">
              <Flame className="w-4 h-4" />
            </div>
            <div className="text-base sm:text-xl font-black font-mono tracking-tight text-amber-300">
              +{goalStreakBonus > 0 ? goalStreakBonus : 50} RP
            </div>
            <div className="text-[11px] sm:text-xs text-slate-300 font-semibold mt-0.5 leading-tight">
              (Daily Streak Bonus)
            </div>
            <div className="text-[9px] text-amber-400/80 font-mono mt-0.5">
              Streak Active
            </div>
          </div>

          {/* Task / Total Gained */}
          <div className="col-span-2 sm:col-span-1 relative overflow-hidden rounded-xl bg-slate-900/90 border border-slate-700/60 p-2.5 sm:p-3 flex flex-col items-center text-center shadow-lg group hover:border-emerald-500/50 transition-colors">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-1 shadow-sm">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="text-base sm:text-xl font-black font-mono tracking-tight text-emerald-300">
              +{taskBonus > 0 ? taskBonus : totalGained} RP
            </div>
            <div className="text-[11px] sm:text-xs text-slate-300 font-semibold mt-0.5 leading-tight">
              {taskBonus > 0 ? '(Task Bonus)' : '(Total Gained)'}
            </div>
            <div className="text-[9px] text-slate-400 font-mono mt-0.5">
              {taskBonus > 0 ? 'Completed task' : 'Match victory'}
            </div>
          </div>
        </div>

        {/* Progress Bar: Segmented angular bar animating smoothly over 1.2s with floating +XX RP counter */}
        <div className="w-full max-w-xl flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs sm:text-sm font-black tracking-wider">
            <div className="flex items-center gap-2 text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>TIER PROGRESS</span>
              {/* Floating +XX RP Counter */}
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 font-mono font-black text-xs shadow-[0_0_12px_rgba(16,185,129,0.5)] animate-bounce">
                +{displayedGain} RP
              </div>
            </div>
            <div className="font-mono text-slate-200">
              <span className="text-white font-extrabold">{animatingRP.toLocaleString()}</span>
              <span className="text-slate-400"> / {newRankDetails.maxRP.toLocaleString()} RP</span>
            </div>
          </div>

          {/* Segmented Angular Bar */}
          <div className="relative w-full h-8 bg-slate-950/90 rounded-lg p-1 border border-slate-800 shadow-inner flex items-center overflow-hidden">
            {/* Dynamic Smooth Fill */}
            <div
              className="h-full rounded-sm transition-all duration-75 relative overflow-hidden"
              style={{
                width: `${Math.min(100, Math.max(3, progressRatio * 100))}%`,
                background: `linear-gradient(90deg, ${newRankDetails.config.badgeSecondary}, ${newRankDetails.config.badgeAccent})`,
                boxShadow: `0 0 20px ${newRankDetails.config.glowColor}`,
              }}
            >
              {/* Inner High-Speed Light Sweep Streak */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
            </div>

            {/* Segmented Angular Notches (11 futuristic angled notches across the bar) */}
            <div className="absolute inset-0 pointer-events-none flex justify-between px-2 items-center">
              {Array.from({ length: 11 }).map((_, idx) => (
                <div
                  key={idx}
                  className="w-[2px] h-full bg-black/70 transform -skew-x-[25deg]"
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action: Glowing, Angled "CONTINUE" Button */}
      <div className="relative z-10 w-full max-w-xl pb-6 sm:pb-8 flex justify-center px-4">
        <button
          onClick={onContinue}
          className="group relative cursor-pointer select-none transition-all duration-300 transform active:scale-95 hover:scale-105"
        >
          {/* Glowing Ambient Halo */}
          <div
            className="absolute -inset-1 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity duration-300"
            style={{ backgroundColor: newRankDetails.config.badgeAccent }}
          />

          {/* Angled Futuristic Button Body */}
          <div className="relative px-12 sm:px-16 py-3.5 sm:py-4 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-base sm:text-lg italic tracking-[0.25em] uppercase rounded-xl border border-yellow-200/90 shadow-2xl flex items-center gap-3 transform -skew-x-12 hover:brightness-110">
            <span className="transform skew-x-12 flex items-center gap-2">
              <span>CONTINUE</span>
              <ChevronRight className="w-5 h-5 stroke-[3] group-hover:translate-x-1.5 transition-transform" />
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}
