'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { soundFx } from '../lib/audio';
import confetti from 'canvas-confetti';
import {
  getRankTier,
  RankTierName,
  RankTierDetails,
} from '../lib/rankedSystem';
import { RankSettlementData } from '../types';
import { ChevronRight, Sparkles, Zap } from 'lucide-react';

interface RankSettlementModalProps {
  isOpen: boolean;
  data: RankSettlementData | null;
  onContinue: () => void;
}

/**
 * Sharp, Metallic Esports Rank Crest:
 * Winged shield with faceted diamond/jewel center styled for the active tier.
 */
function EsportsRankCrest({
  tier,
  details,
}: {
  tier: RankTierName;
  details: RankTierDetails;
}) {
  const { config } = details;

  return (
    <div className="relative flex items-center justify-center w-56 h-56 sm:w-72 sm:h-72 select-none">
      <svg
        viewBox="0 0 340 320"
        className="w-full h-full filter transition-all duration-500 drop-shadow-[0_15px_35px_rgba(0,0,0,0.8)]"
      >
        <defs>
          {/* Steel Light Chrome Gradient */}
          <linearGradient id="crestSteelLight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="25%" stopColor="#F1F5F9" />
            <stop offset="60%" stopColor="#CBD5E1" />
            <stop offset="100%" stopColor="#64748B" />
          </linearGradient>

          {/* Steel Dark Brushed Shadow Gradient */}
          <linearGradient id="crestSteelDark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#94A3B8" />
            <stop offset="40%" stopColor="#64748B" />
            <stop offset="75%" stopColor="#334155" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>

          {/* Bronze Metallic Inlay */}
          <linearGradient id="tierBronzeLight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="35%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>
          <linearGradient id="tierBronzeDark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D97706" />
            <stop offset="55%" stopColor="#92400E" />
            <stop offset="100%" stopColor="#451A03" />
          </linearGradient>

          {/* Silver Chrome Inlay */}
          <linearGradient id="tierSilverLight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="45%" stopColor="#E2E8F0" />
            <stop offset="100%" stopColor="#94A3B8" />
          </linearGradient>
          <linearGradient id="tierSilverDark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#94A3B8" />
            <stop offset="50%" stopColor="#64748B" />
            <stop offset="100%" stopColor="#1E293B" />
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

          {/* Diamond Inlay (Crisp Ice-Blue Sapphire & Chrome) */}
          <linearGradient id="tierDiamondLight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="30%" stopColor="#BAE6FD" />
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

          {/* Grandmaster Inlay (Ember Gold & Fiery Obsidian) */}
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

          {/* Faceted Gem Core Radial Glow */}
          <radialGradient id="gemCoreGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="50%" stopColor={config.badgeAccent} stopOpacity="0.8" />
            <stop offset="100%" stopColor={config.badgeSecondary} stopOpacity="0.2" />
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
              {/* === 1. METALLIC ESPORTS WINGS === */}
              {/* LEFT WING: Upper Razor Blade */}
              <polygon
                points="150,140 100,75 40,48 70,88 120,150"
                fill="url(#crestSteelLight)"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="1"
              />
              <polygon
                points="120,150 70,88 40,48 60,110 135,170"
                fill="url(#crestSteelDark)"
              />
              {/* LEFT WING: Mid Razor Blade */}
              <polygon
                points="145,160 85,115 30,105 55,140 130,188"
                fill={accentLight}
              />
              <polygon
                points="130,188 55,140 30,105 45,160 125,205"
                fill={accentDark}
              />
              {/* LEFT WING: Lower Blade Flange */}
              <polygon
                points="140,195 90,170 45,175 75,205 135,225"
                fill="url(#crestSteelDark)"
              />

              {/* RIGHT WING: Upper Razor Blade */}
              <polygon
                points="190,140 240,75 300,48 270,88 220,150"
                fill="url(#crestSteelLight)"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="1"
              />
              <polygon
                points="220,150 270,88 300,48 280,110 205,170"
                fill="url(#crestSteelDark)"
              />
              {/* RIGHT WING: Mid Razor Blade */}
              <polygon
                points="195,160 255,115 310,105 285,140 210,188"
                fill={accentLight}
              />
              <polygon
                points="210,188 285,140 310,105 295,160 215,205"
                fill={accentDark}
              />
              {/* RIGHT WING: Lower Blade Flange */}
              <polygon
                points="200,195 250,170 295,175 265,205 205,225"
                fill="url(#crestSteelDark)"
              />

              {/* === 2. CENTER HEAVY COMBAT SHIELD === */}
              {/* Outer Chiseled Shield Frame (Left Highlight / Right Shadow) */}
              <polygon
                points="170,72 108,110 118,205 170,268 170,248 132,195 124,122 170,88"
                fill="url(#crestSteelLight)"
              />
              <polygon
                points="170,72 232,110 222,205 170,268 170,248 208,195 216,122 170,88"
                fill="url(#crestSteelDark)"
              />
              {/* Outer Sharp Border */}
              <polygon
                points="170,72 232,110 222,205 170,268 118,205 108,110"
                fill="none"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="1.2"
              />

              {/* Inner Recessed Obsidian Titanium Shield Plate */}
              <polygon
                points="170,88 216,122 208,195 170,248 132,195 124,122"
                fill="#070A0F"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="1"
              />

              {/* Center Crease */}
              <line
                x1="170"
                y1="88"
                x2="170"
                y2="248"
                stroke="rgba(255,255,255,0.25)"
                strokeWidth="1"
              />

              {/* === 3. TOP CROWN APEX === */}
              <polygon
                points="170,52 184,80 170,75 156,80"
                fill={accentLight}
                stroke="#FFFFFF"
                strokeWidth="1"
              />
              <polygon points="152,65 162,82 152,78 144,82" fill="url(#crestSteelLight)" />
              <polygon points="188,65 196,82 188,78 178,82" fill="url(#crestSteelDark)" />

              {/* === 4. FACETED DIAMOND / JEWEL CENTER === */}
              {/* Outer Gem Bevel Housing */}
              <polygon
                points="170,122 202,154 202,182 170,218 138,182 138,154"
                fill="#0B0F17"
                stroke={accentLight}
                strokeWidth="1.5"
              />

              {/* Radial Gem Glow */}
              <circle cx="170" cy="168" r="32" fill="url(#gemCoreGlow)" />

              {/* Faceted Cut Gem: Top-Left (Brilliant Highlight) */}
              <polygon
                points="170,126 142,156 170,168"
                fill={accentLight}
              />
              {/* Faceted Cut Gem: Top-Right (Accent Tone) */}
              <polygon
                points="170,126 198,156 170,168"
                fill={accentDark}
              />
              {/* Faceted Cut Gem: Bottom-Left (Specular Cut) */}
              <polygon
                points="142,156 170,214 170,168"
                fill="url(#crestSteelLight)"
              />
              {/* Faceted Cut Gem: Bottom-Right (Deep Shadow Reflection) */}
              <polygon
                points="198,156 170,214 170,168"
                fill="url(#crestSteelDark)"
              />

              {/* Inner Diamond Star Core Facet */}
              <polygon
                points="170,150 179,168 170,186 161,168"
                fill="#FFFFFF"
                opacity="0.92"
              />
              <polygon
                points="170,156 175,168 170,180 165,168"
                fill={accentLight}
              />
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
  // Animation Phase State Machine
  const [animPhase, setAnimPhase] = useState<'slam' | 'impact' | 'title' | 'progress' | 'ready'>('slam');
  const [isShaking, setIsShaking] = useState(false);
  const [showShockwave, setShowShockwave] = useState(false);
  const [showTitle, setShowTitle] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [showContinue, setShowContinue] = useState(false);

  // RP Counting & Bar state
  const prevRP = data?.prevRP ?? 0;
  const newRP = data?.newRP ?? 0;
  const totalGained = data?.breakdown.totalGained ?? 0;
  const sessionRP = data?.breakdown.sessionRP ?? 0;
  const goalStreakBonus = data?.breakdown.goalStreakBonus ?? 0;
  const taskBonus = data?.breakdown.taskBonus ?? 0;

  const [animatingRP, setAnimatingRP] = useState(prevRP);
  const [displayedGain, setDisplayedGain] = useState(0);
  const [progressRatio, setProgressRatio] = useState(0);

  // Get rank details for target tier
  const newRankDetails = useMemo(() => getRankTier(newRP), [newRP]);
  const prevRankDetails = useMemo(() => getRankTier(prevRP), [prevRP]);
  const isRankUp = newRankDetails.fullTitle !== prevRankDetails.fullTitle;

  // Sound throttler ref for RP micro-clicks
  const lastClickTimeRef = useRef(0);

  // 1. Spacebar listener for rapid dismissal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        onContinue();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onContinue]);

  // 2. Heavy "Slam-and-Impact" Sequence & Web Audio FX
  useEffect(() => {
    if (!isOpen) {
      setAnimPhase('slam');
      setIsShaking(false);
      setShowShockwave(false);
      setShowTitle(false);
      setShowProgress(false);
      setShowContinue(false);
      setAnimatingRP(prevRP);
      setDisplayedGain(0);
      setProgressRatio(0);
      return;
    }

    // Reset initial numbers
    const tierMin = newRankDetails.minRP;
    const tierMax = newRankDetails.maxRP;
    const initialInTier = Math.max(0, prevRP - tierMin);
    const needed = Math.max(1, tierMax - tierMin);
    setProgressRatio(Math.min(1, initialInTier / needed));
    setAnimatingRP(prevRP);
    setDisplayedGain(0);

    // Timeline triggers
    const timers: NodeJS.Timeout[] = [];

    // Phase 1 Impact at 0.35s (350ms):
    // Crest slams down, camera shakes for 150ms, shockwave expands, bass thud plays
    timers.push(
      setTimeout(() => {
        setAnimPhase('impact');
        setIsShaking(true);
        setShowShockwave(true);
        soundFx.playBassImpactThud();

        if (isRankUp) {
          confetti({
            particleCount: 100,
            spread: 80,
            origin: { y: 0.55 },
            colors: [newRankDetails.config.badgeAccent, '#FFFFFF', '#38BDF8'],
          });
        }
      }, 350)
    );

    // End camera shake at 500ms
    timers.push(
      setTimeout(() => {
        setIsShaking(false);
      }, 500)
    );

    // Phase 2: Title & Rank Reveal at 0.5s (500ms)
    timers.push(
      setTimeout(() => {
        setShowTitle(true);
        setAnimPhase('title');
        soundFx.playRankSettlementSound();
      }, 500)
    );

    // Phase 3: Segmented RP Fill & Sound (0.8s - 2.0s)
    let animationFrameId: number;
    timers.push(
      setTimeout(() => {
        setShowProgress(true);
        setAnimPhase('progress');

        const startTime = performance.now();
        const duration = 1200; // 1.2s smooth roll-up
        lastClickTimeRef.current = 0;

        const tick = (currentTime: number) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(1, elapsed / duration);
          // Smooth ease-out cubic
          const ease = 1 - Math.pow(1 - progress, 3);

          const currentRP = Math.round(prevRP + (newRP - prevRP) * ease);
          const currentGain = Math.round(totalGained * ease);

          setAnimatingRP(currentRP);
          setDisplayedGain(currentGain);

          // Play micro-click audio feedback throttled every ~70ms
          const now = performance.now();
          if (now - lastClickTimeRef.current >= 70 && progress < 1) {
            lastClickTimeRef.current = now;
            soundFx.playRankTickSound();
          }

          const inTier = Math.max(0, currentRP - tierMin);
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
      }, 800)
    );

    // Phase 4: Continue CTA at 2.1s (2100ms)
    timers.push(
      setTimeout(() => {
        setShowContinue(true);
        setAnimPhase('ready');
      }, 2100)
    );

    return () => {
      timers.forEach(clearTimeout);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isOpen, prevRP, newRP, totalGained, isRankUp, newRankDetails]);

  if (!isOpen || !data) return null;

  const remainingRP = Math.max(0, newRankDetails.maxRP - newRP);
  const nextMilestoneText = newRankDetails.isMaxTier
    ? 'Peak Rank Achieved'
    : `Next Milestone: ${newRankDetails.nextTierTitle} (${remainingRP} RP remaining)`;

  return (
    <div className="fixed inset-0 z-50 bg-[#080b12]/95 backdrop-blur-md flex flex-col items-center justify-center select-none overflow-hidden animate-in fade-in duration-300">
      
      {/* 1. Subtle Radial Speed-Lines & Center Backlight */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-1000"
        style={{
          background: `radial-gradient(ellipse 65% 55% at 50% 35%, ${newRankDetails.config.glowColor}, rgba(8,11,18,0.98) 75%)`,
        }}
      />

      {/* Subtle Radial Speed-Lines SVG */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-25">
        <g stroke="currentColor" strokeWidth="1" strokeDasharray="6,12">
          {/* Radial lines shooting outward from center (50%, 40%) */}
          <line x1="50%" y1="38%" x2="0%" y2="0%" className="text-cyan-400" />
          <line x1="50%" y1="38%" x2="25%" y2="0%" className="text-amber-300" />
          <line x1="50%" y1="38%" x2="50%" y2="0%" className="text-cyan-400" />
          <line x1="50%" y1="38%" x2="75%" y2="0%" className="text-amber-300" />
          <line x1="50%" y1="38%" x2="100%" y2="0%" className="text-cyan-400" />
          <line x1="50%" y1="38%" x2="100%" y2="35%" className="text-amber-300" />
          <line x1="50%" y1="38%" x2="100%" y2="70%" className="text-cyan-400" />
          <line x1="50%" y1="38%" x2="100%" y2="100%" className="text-amber-300" />
          <line x1="50%" y1="38%" x2="75%" y2="100%" className="text-cyan-400" />
          <line x1="50%" y1="38%" x2="50%" y2="100%" className="text-amber-300" />
          <line x1="50%" y1="38%" x2="25%" y2="100%" className="text-cyan-400" />
          <line x1="50%" y1="38%" x2="0%" y2="100%" className="text-amber-300" />
          <line x1="50%" y1="38%" x2="0%" y2="70%" className="text-cyan-400" />
          <line x1="50%" y1="38%" x2="0%" y2="35%" className="text-amber-300" />
        </g>
      </svg>

      {/* Container with Camera Shake & Slam Dynamics */}
      <div
        className={`relative z-10 w-full max-w-xl flex flex-col items-center text-center px-4 transition-transform duration-75 ${
          isShaking ? 'translate-x-1.5 -translate-y-1 scale-[1.015]' : 'translate-x-0 translate-y-0 scale-100'
        }`}
      >
        {/* Crest Section with Slam-Down Animation (scale 2.5 -> 1.0) & Expanding Shockwave */}
        <div className="relative flex items-center justify-center my-2 sm:my-3">
          
          {/* Expanding Shockwave Ripple Ring (emitted on impact at 0.35s) */}
          {showShockwave && (
            <div
              className="absolute w-56 h-56 sm:w-72 sm:h-72 rounded-full border-2 pointer-events-none transition-all duration-700 ease-out"
              style={{
                borderColor: newRankDetails.config.badgeAccent,
                boxShadow: `0 0 30px ${newRankDetails.config.badgeAccent}, inset 0 0 20px ${newRankDetails.config.badgeAccent}`,
                animation: 'ffShockwave 600ms cubic-bezier(0.1, 0.8, 0.3, 1) forwards',
              }}
            />
          )}

          {/* Soft Centered Radial Backlight strictly behind the badge */}
          <div
            className="absolute w-56 h-56 rounded-full blur-[70px] opacity-25 pointer-events-none transition-all duration-700"
            style={{ backgroundColor: newRankDetails.config.badgeAccent }}
          />

          {/* Heavy Slam-and-Impact Crest Container */}
          <div
            className={`transform transition-all duration-350 ease-[cubic-bezier(0.1,0.9,0.2,1.2)] ${
              animPhase === 'slam'
                ? 'scale-[2.5] opacity-0 blur-[10px]'
                : 'scale-100 opacity-100 blur-0'
            }`}
          >
            <EsportsRankCrest
              tier={newRankDetails.tier}
              details={newRankDetails}
            />
          </div>
        </div>

        {/* Phase 2: Title & Rank Reveal (Stamped into view at 0.5s) */}
        <div
          className={`flex flex-col items-center transition-all duration-300 transform ${
            showTitle ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
        >
          {/* Header Label */}
          <div className="flex items-center gap-2 mb-1">
            <Zap className={`w-3.5 h-3.5 fill-current ${isRankUp ? 'text-amber-400' : 'text-cyan-400'} animate-pulse`} />
            <span className="text-[11px] font-black tracking-[0.3em] uppercase text-cyan-400">
              {isRankUp ? 'TIER UPGRADE' : 'MATCH SETTLEMENT'}
            </span>
            <Zap className={`w-3.5 h-3.5 fill-current ${isRankUp ? 'text-amber-400' : 'text-cyan-400'} animate-pulse`} />
          </div>

          {/* Metallic Rank Title (e.g. "DIAMOND II") */}
          <h1
            className={`text-3xl sm:text-5xl font-black italic tracking-widest uppercase bg-gradient-to-b ${newRankDetails.config.metallicGradient} bg-clip-text text-transparent`}
            style={{
              filter: `drop-shadow(0 0 15px ${newRankDetails.config.glowColor})`,
            }}
          >
            {newRankDetails.fullTitle}
          </h1>

          {/* Subtext: Milestone countdown */}
          <p className="text-xs sm:text-sm font-bold tracking-wider text-slate-300 mt-1">
            <span className="text-slate-400">NEXT MILESTONE: </span>
            <span style={{ color: newRankDetails.config.badgeAccent }} className="font-mono font-black">
              {newRankDetails.nextTierTitle}
            </span>
            <span className="text-slate-400 font-mono"> ({remainingRP} RP remaining)</span>
          </p>
        </div>

        {/* Phase 3: Segmented RP Fill & Sound (0.8s - 2.0s) */}
        <div
          className={`w-full max-w-xl transition-all duration-400 transform mt-4 sm:mt-5 ${
            showProgress ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
          }`}
        >
          {/* Unified Stat Breakdown Glassmorphic Strip */}
          <div className="w-full mb-3 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-md flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="text-slate-400">Focus Time</span>
              <span className="font-mono font-bold text-emerald-400">+{sessionRP} RP</span>
            </span>

            {goalStreakBonus > 0 && (
              <>
                <span className="text-slate-600 select-none">•</span>
                <span className="flex items-center gap-1.5">
                  <span className="text-slate-400">Streak Bonus</span>
                  <span className="font-mono font-bold text-amber-400">+{goalStreakBonus} RP</span>
                </span>
              </>
            )}

            {taskBonus > 0 && (
              <>
                <span className="text-slate-600 select-none">•</span>
                <span className="flex items-center gap-1.5">
                  <span className="text-slate-400">Task Bonus</span>
                  <span className="font-mono font-bold text-cyan-400">+{taskBonus} RP</span>
                </span>
              </>
            )}

            <span className="text-slate-600 select-none">=</span>
            <span className="font-mono font-black text-white">
              +{totalGained} RP Total
            </span>
          </div>

          {/* Progress Header with Floating Glowing Indicator */}
          <div className="flex items-center justify-between text-xs sm:text-sm font-black tracking-wider mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-300 text-xs tracking-wider">TIER PROGRESS</span>
              {/* Floating +{displayedGain} RP Indicator */}
              <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 font-mono font-black text-xs shadow-[0_0_12px_rgba(16,185,129,0.4)] animate-pulse">
                +{displayedGain} RP GAINED
              </div>
            </div>
            <div className="font-mono text-slate-200 text-xs sm:text-sm">
              <span className="text-white font-extrabold">{animatingRP.toLocaleString()}</span>
              <span className="text-slate-400"> / {newRankDetails.maxRP.toLocaleString()} RP</span>
            </div>
          </div>

          {/* Angled Segmented Futuristic Progress Bar */}
          <div className="relative w-full h-7 sm:h-8 bg-black/85 rounded-md p-1 border border-white/[0.12] shadow-inner flex items-center overflow-hidden transform -skew-x-12">
            {/* Smooth Dynamic Fill */}
            <div
              className="h-full rounded-sm transition-all duration-75 relative overflow-hidden"
              style={{
                width: `${Math.min(100, Math.max(2, progressRatio * 100))}%`,
                background: `linear-gradient(90deg, ${newRankDetails.config.badgeSecondary}, ${newRankDetails.config.badgeAccent})`,
                boxShadow: `0 0 20px ${newRankDetails.config.glowColor}`,
              }}
            >
              {/* High-speed inner shimmer streak */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent animate-shimmer" />
            </div>

            {/* Segmented Angular Notches (12 futuristic dividers) */}
            <div className="absolute inset-0 pointer-events-none flex justify-between px-2 items-center">
              {Array.from({ length: 12 }).map((_, idx) => (
                <div
                  key={idx}
                  className="w-[1.5px] h-full bg-black/75 transform -skew-x-12"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Phase 4: Continue CTA (Fades in at 2.1s) */}
        <div
          className={`mt-6 sm:mt-8 flex flex-col items-center transition-all duration-400 transform ${
            showContinue ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
          }`}
        >
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
            <div className="relative px-12 sm:px-16 py-3.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-base italic tracking-[0.25em] uppercase rounded-xl border border-yellow-200/90 shadow-2xl flex items-center gap-3 transform -skew-x-12 hover:brightness-110">
              <span className="transform skew-x-12 flex items-center gap-2">
                <span>CONTINUE</span>
                <ChevronRight className="w-5 h-5 stroke-[3] group-hover:translate-x-1.5 transition-transform" />
              </span>
            </div>
          </button>

          {/* Spacebar keyboard hint */}
          <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase mt-3 opacity-75">
            PRESS SPACEBAR OR CLICK TO CONTINUE
          </span>
        </div>

      </div>

      {/* Global Inline Keyframes for Shockwave & Shake */}
      <style jsx>{`
        @keyframes ffShockwave {
          0% {
            transform: scale(0.8);
            opacity: 0.95;
          }
          100% {
            transform: scale(2.2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
