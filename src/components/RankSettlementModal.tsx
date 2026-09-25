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
import { ChevronRight } from 'lucide-react';
import { TierIcon } from './common/TierIcon';
import { RankCrestBadge } from './common/RankCrestBadge';
import Image from 'next/image';
import { getRankIconPath } from '../utils/rankIcons';
interface RankSettlementModalProps {
  isOpen: boolean;
  data: RankSettlementData | null;
  onContinue: () => void;
}

// Particle interface for radial spark burst on badge impact
interface SparkParticle {
  id: number;
  dx: number;
  dy: number;
  rot: number;
  size: number;
  opacity: number;
  color: string;
}

// Cubic bezier evaluator for cubic-bezier(0.22, 1, 0.36, 1) - fast start, graceful settle
function cubicBezierEase(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const x1 = 0.22, y1 = 1, x2 = 0.36, y2 = 1;
  let low = 0, high = 1, u = t;
  for (let i = 0; i < 8; i++) {
    const oneMinusU = 1 - u;
    const bx = 3 * oneMinusU * oneMinusU * u * x1 + 3 * oneMinusU * u * u * x2 + u * u * u;
    if (Math.abs(bx - t) < 0.001) break;
    if (bx < t) low = u;
    else high = u;
    u = (low + high) / 2;
  }
  const oneMinusU = 1 - u;
  return 3 * oneMinusU * oneMinusU * u * y1 + 3 * oneMinusU * u * u * y2 + u * u * u;
}


export function RankSettlementModal({
  isOpen,
  data,
  onContinue,
}: RankSettlementModalProps) {
  // Accessibility: Prefers-reduced-motion check
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Rank Details
  const prevRP = data?.prevRP ?? 0;
  const newRP = data?.newRP ?? 0;
  const totalGained = data?.breakdown.totalGained ?? 0;
  const sessionRP = data?.breakdown.sessionRP ?? 0;
  const goalStreakBonus = data?.breakdown.goalStreakBonus ?? 0;
  const taskBonus = data?.breakdown.taskBonus ?? 0;
  const durationSeconds = data?.breakdown.durationSeconds ?? 0;
  const streakBonusClaimedToday = Boolean(data?.breakdown.streakBonusClaimedToday);
  const isUnderMinDuration = Boolean(data?.breakdown.isUnderMinDuration ?? (durationSeconds < 300));

  const prevRankDetails = useMemo(() => getRankTier(prevRP), [prevRP]);
  const newRankDetails = useMemo(() => getRankTier(newRP), [newRP]);
  const isRankUp = newRankDetails.fullTitle !== prevRankDetails.fullTitle;
  const isMajorTierUp = newRankDetails.tier !== prevRankDetails.tier;

  const TIER_INTENSITY_MAP: Record<RankTierName, number> = {
    Bronze: 1, Silver: 2, Gold: 3, Platinum: 4, Diamond: 5, Champion: 6, Master: 7, Grandmaster: 8,
  };
  const intensity = isMajorTierUp ? TIER_INTENSITY_MAP[newRankDetails.tier] : (isRankUp ? 0.4 : 0);

  // Active crest details (morphs during tier up)
  const [displayRank, setDisplayRank] = useState<RankTierDetails>(
    isRankUp ? prevRankDetails : newRankDetails
  );

  // Stage & Feedback States
  const [animPhase, setAnimPhase] = useState<'slam' | 'impact' | 'title' | 'progress' | 'ready'>('slam');
  const [shakeOffset, setShakeOffset] = useState({ x: 0, y: 0 });
  const [showShockwave, setShowShockwave] = useState(false);
  const [showRadialFlash, setShowRadialFlash] = useState(false);
  const [particles, setParticles] = useState<SparkParticle[]>([]);
  const [showChromatic, setShowChromatic] = useState(false);
  const [showTitle, setShowTitle] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [showContinue, setShowContinue] = useState(false);

  // Flip Animation States
  const [flipPhase, setFlipPhase] = useState<'idle' | 'out' | 'in'>('idle');
  const [flipDuration, setFlipDuration] = useState(350);
  const [flipScaleDip, setFlipScaleDip] = useState(0.85);
  const [showRevealFlash, setShowRevealFlash] = useState(false);
  const [revealParticles, setRevealParticles] = useState<SparkParticle[]>([]);
  const [revealConfetti, setRevealConfetti] = useState(false);

  // RP Bar & Counter States
  const [animatingRP, setAnimatingRP] = useState(prevRP);
  const [displayedGain, setDisplayedGain] = useState(0);
  const [progressRatio, setProgressRatio] = useState(0);
  const [activeBarColor, setActiveBarColor] = useState(
    isRankUp ? prevRankDetails.config.badgeAccent : newRankDetails.config.badgeAccent
  );
  const [isBarFlashing, setIsBarFlashing] = useState(false);
  const [poppedSegment, setPoppedSegment] = useState<number | null>(null);
  const [counterPopped, setCounterPopped] = useState(false);

  // Format focus duration
  const formattedDuration = useMemo(() => {
    const minutes = Math.floor(durationSeconds / 60);
    const seconds = durationSeconds % 60;
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remMins = minutes % 60;
      return remMins > 0 ? `${hours}h ${remMins}m` : `${hours}h`;
    }
    if (minutes > 0) {
      return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
    }
    return `${seconds}s`;
  }, [durationSeconds]);

  // Ambient backdrop floating motes (generated once)
  const ambientMotes = useMemo(() => {
    return Array.from({ length: 16 }).map((_, i) => ({
      id: i,
      left: `${(i * 6.25 + 3) % 96}%`,
      top: `${(i * 13.7 + 10) % 85}%`,
      size: 2 + (i % 3),
      duration: 16 + (i % 6) * 2,
      delay: (i * 1.3) % 8,
      opacity: 0.12 + ((i % 4) * 0.06),
    }));
  }, []);

  // Keyboard navigation (Spacebar or Enter to dismiss)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ' || e.code === 'Enter' || e.key === 'Enter') {
        e.preventDefault();
        soundFx.resumeContext();
        onContinue();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onContinue]);

  // Main 5-Stage Cinematic Choreography
  const animFrameRef = useRef<number | null>(null);
  const shakeFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen || !data) {
      setAnimPhase('slam');
      setShakeOffset({ x: 0, y: 0 });
      setShowShockwave(false);
      setShowRadialFlash(false);
      setParticles([]);
      setShowChromatic(false);
      setShowTitle(false);
      setShowProgress(false);
      setShowContinue(false);
      setAnimatingRP(prevRP);
      setDisplayedGain(0);
      setProgressRatio(0);
      setIsBarFlashing(false);
      setPoppedSegment(null);
      setCounterPopped(false);
      setDisplayRank(isRankUp ? prevRankDetails : newRankDetails);
      setActiveBarColor(isRankUp ? prevRankDetails.config.badgeAccent : newRankDetails.config.badgeAccent);
      setFlipPhase('idle');
      setShowRevealFlash(false);
      setRevealParticles([]);
      setRevealConfetti(false);
      return;
    }

    // Attempt audio context resume on user screen opening gesture
    soundFx.resumeContext();

    // If prefers-reduced-motion, instantly show final resolved state
    if (prefersReducedMotion) {
      setAnimPhase('ready');
      setDisplayRank(newRankDetails);
      setActiveBarColor(newRankDetails.config.badgeAccent);
      setAnimatingRP(newRP);
      setDisplayedGain(totalGained);
      const tierMin = newRankDetails.minRP;
      const tierMax = newRankDetails.maxRP;
      const finalInTier = Math.max(0, newRP - tierMin);
      const needed = Math.max(1, tierMax - tierMin);
      setProgressRatio(Math.min(1, finalInTier / needed));
      setShowTitle(true);
      setShowProgress(true);
      setShowContinue(true);
      return;
    }

    const timers: NodeJS.Timeout[] = [];

    // Initial setup for the active tier
    const initialTier = isRankUp ? prevRankDetails : newRankDetails;
    setDisplayRank(initialTier);
    setActiveBarColor(initialTier.config.badgeAccent);

    const initialTierMin = initialTier.minRP;
    const initialTierMax = initialTier.maxRP;
    const initialInTier = Math.max(0, prevRP - initialTierMin);
    const initialNeeded = Math.max(1, initialTierMax - initialTierMin);
    setProgressRatio(Math.min(1, initialInTier / initialNeeded));
    setAnimatingRP(prevRP);
    setDisplayedGain(0);

    // ==========================================
    // STAGE 1 -> 2: IMPACT MOMENT at ~0.35s (340ms)
    // ==========================================
    timers.push(
      setTimeout(() => {
        setAnimPhase('impact');
        setShowShockwave(true);
        setShowRadialFlash(true);
        setShowChromatic(true);

        // Deep multi-layered sub-bass audio impact (sweep + crack + sub body)
        soundFx.playSubBassImpact();

        // Screen shake: decaying random offset
        const shakeStart = performance.now();
        const shakeDuration = 450;
        const shakeAmpBase = intensity >= 1 ? 10 + (intensity - 1) * (14 / 7) : 10;
        const runShake = (now: number) => {
          const elapsed = now - shakeStart;
          const p = Math.min(1, elapsed / shakeDuration);
          if (p < 1) {
            const amp = shakeAmpBase * Math.pow(1 - p, 2);
            const x = (Math.random() * 2 - 1) * amp;
            const y = (Math.random() * 2 - 1) * amp;
            setShakeOffset({ x, y });
            shakeFrameRef.current = requestAnimationFrame(runShake);
          } else {
            setShakeOffset({ x: 0, y: 0 });
          }
        };
        shakeFrameRef.current = requestAnimationFrame(runShake);

        // Generate 20 radial spark/shard particles emitted from crest center
        const generatedParticles: SparkParticle[] = Array.from({ length: 20 }).map((_, i) => {
          const angle = (i / 20) * 2 * Math.PI + (Math.random() - 0.5) * 0.35;
          const dist = 80 + Math.random() * 140; // 80 - 220px
          return {
            id: i,
            dx: Math.cos(angle) * dist,
            dy: Math.sin(angle) * dist + 35, // Gravity fall offset
            rot: Math.random() * 540 - 270,
            size: 3 + Math.random() * 4,
            opacity: 0.75 + Math.random() * 0.25,
            color: (i % 3 === 0) ? '#FFFFFF' : initialTier.config.badgeAccent,
          };
        });
        setParticles(generatedParticles);

        // Radial flash unmount after 250ms
        timers.push(setTimeout(() => setShowRadialFlash(false), 260));

        // Chromatic aberration unmount after 300ms
        timers.push(setTimeout(() => setShowChromatic(false), 310));

        // Shockwave rings unmount after 1.1s
        timers.push(setTimeout(() => setShowShockwave(false), 1100));

        // Particles unmount after 950ms
        timers.push(setTimeout(() => setParticles([]), 950));

        // FLIP-REVEAL SEQUENCE (if rank up)
        if (isRankUp) {
          const totalFlipDuration = intensity >= 1 ? 700 + (intensity - 1) * (600 / 7) : 700;
          const duration = totalFlipDuration / 2;
          const scaleDip = intensity >= 1 ? 0.85 - (intensity - 1) * (0.15 / 7) : 0.85;
          setFlipDuration(duration);
          setFlipScaleDip(scaleDip);
          setFlipPhase('out');

          // Swap image at 90 degrees
          timers.push(setTimeout(() => {
            setDisplayRank(newRankDetails);
            setActiveBarColor(newRankDetails.config.badgeAccent);
            setFlipPhase('in');

            // Complete flip and trigger reveal accent
            timers.push(setTimeout(() => {
              setFlipPhase('idle');
              setShowRevealFlash(true);
              const flashDur = intensity >= 6 ? 250 : 150;
              timers.push(setTimeout(() => setShowRevealFlash(false), flashDur));

              if (intensity >= 1) {
                soundFx.playTierUpFanfare(intensity);
              } else {
                soundFx.playTierUpFanfare(1);
              }

              if (intensity >= 6) {
                setRevealConfetti(true);
                timers.push(setTimeout(() => setRevealConfetti(false), 1500));
              }

              const pCount = intensity >= 1 ? Math.round(8 + (intensity - 1) * (22 / 7)) : 8;
              const generatedParticles = Array.from({ length: pCount }).map((_, i) => {
                const angle = (i / pCount) * 2 * Math.PI;
                const spreadRadius = intensity >= 1 ? 60 + (intensity - 1) * (60 / 7) : 60;
                const dist = spreadRadius + Math.random() * spreadRadius;
                return {
                  id: i,
                  dx: Math.cos(angle) * dist,
                  dy: Math.sin(angle) * dist,
                  rot: 0,
                  size: 2 + Math.random() * 3,
                  opacity: 0.8 + Math.random() * 0.2,
                  color: newRankDetails.config.badgeAccent,
                };
              });
              setRevealParticles(generatedParticles);
              timers.push(setTimeout(() => setRevealParticles([]), 500));
            }, duration));
          }, duration));
        }

      }, 340)
    );

    // Calculate delay offset to wait for flip to finish before showing title & progress
    const delayOffset = isRankUp ? (isMajorTierUp ? 1000 : 700) : 0;

    // ==========================================
    // STAGE 3: TEXT STAMP at 0.52s + offset
    // ==========================================
    timers.push(
      setTimeout(() => {
        setShowTitle(true);
        setAnimPhase('title');
      }, 520 + delayOffset)
    );

    // ==========================================
    // STAGE 4: EARNED RP BAR PROGRESS at 0.85s + offset
    // ==========================================
    timers.push(
      setTimeout(() => {
        setShowProgress(true);
        setAnimPhase('progress');

        const lastPoppedRef = { current: -1 };

        // Standard single tier fill logic (used for both normal and rank-ups now)
        const startTime = performance.now();
        const duration = 1200; // 1.2s smooth roll-up
        const tierMin = newRankDetails.minRP;
        const tierMax = newRankDetails.maxRP;
        const needed = Math.max(1, tierMax - tierMin);
        // If prevRP is below tierMin, startRatio is 0 (which is correct for rank up)
        const startRatio = Math.min(1, Math.max(0, prevRP - tierMin) / needed);
        const targetRatio = Math.min(1, Math.max(0, newRP - tierMin) / needed);

        const runProgress = (now: number) => {
          const elapsed = now - startTime;
          const progress = Math.min(1, elapsed / duration);
          const ease = cubicBezierEase(progress);

          const curRP = Math.round(prevRP + (newRP - prevRP) * ease);
          const curGain = Math.round(totalGained * ease);
          const curRatio = startRatio + (targetRatio - startRatio) * ease;

          setAnimatingRP(curRP);
          setDisplayedGain(curGain);
          setProgressRatio(curRatio);

          // Check segment pop (5 segments: 0.2 each)
          const currentSegment = Math.floor(curRatio / 0.2);
          if (currentSegment > lastPoppedRef.current && currentSegment < 5) {
            lastPoppedRef.current = currentSegment;
            setPoppedSegment(currentSegment);
            soundFx.playSegmentTick(curRatio);
            setTimeout(() => setPoppedSegment(null), 160);
          }

          if (progress < 1) {
            animFrameRef.current = requestAnimationFrame(runProgress);
          } else {
            setAnimatingRP(newRP);
            setDisplayedGain(totalGained);
            setProgressRatio(targetRatio);

            // Final tick: scale counter and play completion chime
            setCounterPopped(true);
            setTimeout(() => setCounterPopped(false), 250);
            soundFx.playRankFillCompletion();
          }
        };

        animFrameRef.current = requestAnimationFrame(runProgress);
      }, 850 + delayOffset)
    );

    // ==========================================
    // STAGE 5: CONTINUE BUTTON at 2.35s + offset
    // ==========================================
    timers.push(
      setTimeout(() => {
        setShowContinue(true);
        setAnimPhase('ready');
      }, 2350 + delayOffset)
    );

    return () => {
      timers.forEach(clearTimeout);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (shakeFrameRef.current) cancelAnimationFrame(shakeFrameRef.current);
    };
  }, [isOpen, data, prevRP, newRP, totalGained, isRankUp, newRankDetails, prevRankDetails, prefersReducedMotion]);

  if (!isOpen || !data) return null;

  const remainingRP = Math.max(0, displayRank.maxRP - animatingRP);

  const getFlipStyle = () => {
    if (prefersReducedMotion) return {};
    if (flipPhase === 'idle') {
      return {
        transform: 'rotateY(0deg) scale(1)',
        filter: 'blur(0px)',
        transition: `transform ${flipDuration}ms ease-out, filter ${flipDuration}ms ease-out`
      };
    } else if (flipPhase === 'out') {
      return {
        transform: `rotateY(90deg) scale(${flipScaleDip})`,
        filter: 'blur(4px)',
        transition: `transform ${flipDuration}ms ease-in, filter ${flipDuration}ms ease-in`
      };
    } else if (flipPhase === 'in') {
      return {
        transform: 'rotateY(0deg) scale(1)',
        filter: 'blur(0px)',
        transition: `transform ${flipDuration}ms ease-out, filter ${flipDuration}ms ease-out`
      };
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[var(--bg)]/95 backdrop-blur-md flex flex-col items-center justify-center select-none overflow-hidden animate-in fade-in duration-300">
      
      {/* 1. Backdrop Vignette: Darkening at screen edges to push focus to center */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 35%, rgba(4,6,12,0.65) 75%, rgba(2,3,7,0.95) 100%)',
        }}
      />

      {/* 2. Backdrop Radial Glow: Breathing opacity 0.5 <-> 0.75 on a 4s ease-in-out loop */}
      <div
        className="absolute inset-0 pointer-events-none z-0 transition-colors duration-700"
        style={{
          background: `radial-gradient(ellipse 65% 55% at 50% 36%, ${displayRank.config.glowColor}, rgba(6,8,15,0.98) 72%)`,
          animation: prefersReducedMotion ? 'none' : 'ffBreatheGlow 4s ease-in-out infinite',
          willChange: 'opacity, transform',
        }}
      />

      {/* 3. Ambient Drifting Light Motes / Dust in backdrop (20s gentle loop) */}
      {!prefersReducedMotion && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          {ambientMotes.map((mote) => (
            <div
              key={mote.id}
              className="absolute rounded-full bg-white"
              style={{
                left: mote.left,
                top: mote.top,
                width: `${mote.size}px`,
                height: `${mote.size}px`,
                opacity: mote.opacity,
                filter: 'blur(0.5px)',
                animation: `floatMoteDrift ${mote.duration}s linear ${mote.delay}s infinite`,
              }}
            />
          ))}
        </div>
      )}

      {/* 4. Fullscreen Radial Flash on landing impact (~0.35s, 0 -> 0.35 -> 0 over 0.25s) */}
      {(showRadialFlash || (isMajorTierUp && animPhase === 'title')) && !prefersReducedMotion && (
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background: `radial-gradient(circle at 50% 36%, ${displayRank.config.badgeAccent}66 0%, ${displayRank.config.badgeAccent}22 45%, transparent 75%)`,
            animation: showRadialFlash ? 'radialFlashAnim 0.25s ease-out forwards' : (intensity >= 6 ? 'majorTierFlashIntense 1.8s ease-out forwards' : 'majorTierFlash 1.5s ease-out forwards'),
            willChange: 'opacity',
          }}
        />
      )}

      {/* Academic Brand Watermark */}
      <div className="absolute top-6 left-6 sm:top-8 sm:left-8 flex items-center gap-2.5 select-none pointer-events-none z-20">
        <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
        <span className="text-xs uppercase tracking-[0.25em] text-slate-400 font-semibold">
          STUDY.IO PERFORMANCE
        </span>
      </div>

      {/* 5. Main Container with Dedicated Screen-Shake Translation (Text remains crisp on separate layers) */}
      <div
        className="relative z-10 w-full max-w-xl flex flex-col items-center text-center px-4"
        style={{
          transform: `translate3d(${shakeOffset.x}px, ${shakeOffset.y}px, 0)`,
          willChange: 'transform',
        }}
      >
        {/* ==========================================
            CREST SECTION: Mass Slam, Wobble, Shockwaves, Particles & Chromatic Aberration
            ========================================== */}
        <div className="relative flex items-center justify-center my-2 sm:my-3">

          {/* DUAL SHOCKWAVE RINGS (Triggered simultaneously at ~0.35s impact) */}
          {showShockwave && !prefersReducedMotion && (
            <>
              {/* Ring 1: scale 0.2 -> 2.4 over 0.7s, border color = rank tier */}
              <div
                className="absolute w-56 h-56 sm:w-72 sm:h-72 rounded-full pointer-events-none"
                style={{
                  borderColor: displayRank.config.badgeAccent,
                  boxShadow: `0 0 30px ${displayRank.config.badgeAccent}60`,
                  animation: 'shockwaveRing1 0.7s cubic-bezier(0.1, 0.85, 0.25, 1) forwards',
                  willChange: 'transform, opacity, border-width',
                }}
              />
              {/* Ring 2: scale 0.2 -> 3.6 over 1.0s with 0.08s delay */}
              <div
                className="absolute w-56 h-56 sm:w-72 sm:h-72 rounded-full pointer-events-none"
                style={{
                  borderColor: displayRank.config.badgeAccent,
                  boxShadow: `0 0 35px ${displayRank.config.badgeAccent}40`,
                  animation: 'shockwaveRing2 1.0s cubic-bezier(0.1, 0.85, 0.25, 1) 0.08s forwards',
                  willChange: 'transform, opacity, border-width',
                }}
              />
            </>
          )}

          {/* RADIAL PARTICLE BURST: 20 Shards/Sparks falling with gravity over 0.9s */}
          {particles.length > 0 && !prefersReducedMotion && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              {particles.map((p) => (
                <div
                  key={p.id}
                  className="absolute pointer-events-none"
                  style={{
                    width: `${p.size}px`,
                    height: `${p.size * 1.5}px`,
                    backgroundColor: p.color,
                    boxShadow: `0 0 6px ${p.color}`,
                    borderRadius: '1px',
                    // Pass trajectory data via CSS variables for smooth GPU animation
                    transform: 'translate(0, 0) scale(1) rotate(0deg)',
                    animation: `particleBurstAnim 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards`,
                    // Custom end coordinates
                    ['--target-x' as string]: `${p.dx}px`,
                    ['--target-y' as string]: `${p.dy}px`,
                    ['--target-rot' as string]: `${p.rot}deg`,
                    opacity: p.opacity,
                    willChange: 'transform, opacity',
                  }}
                />
              ))}
            </div>
          )}

          {/* Soft Centered Ambient Backlight */}
          <div
            className="absolute w-64 h-64 rounded-full blur-[80px] opacity-25 pointer-events-none transition-all duration-700"
            style={{ backgroundColor: displayRank.config.badgeAccent }}
          />

          {/* CHROMATIC ABERRATION PULSE & MASS SLAM REPLACED WITH NEW CREST */}
          <div className="relative mx-auto mb-4 flex items-center justify-center perspective-[1000px]">
            <div 
              style={getFlipStyle()}
              className="relative w-full h-full flex items-center justify-center transform-gpu"
            >
              <RankCrestBadge
                tier={displayRank.tier}
                division={displayRank.division}
                size={192}
                className="animate-in zoom-in spin-in-12 duration-700 ease-out"
                isSettled={animPhase !== 'slam' && animPhase !== 'impact' && flipPhase === 'idle'}
              />
              
              {/* REVEAL FLASH */}
              {showRevealFlash && !prefersReducedMotion && (
                <div
                  className="absolute inset-[-20%] rounded-full pointer-events-none z-10 mix-blend-screen"
                  style={{
                    background: `radial-gradient(circle at 50% 50%, ${displayRank.config.badgeAccent}99 0%, transparent 60%)`,
                    animation: `revealFlashAnim 0.15s ease-out forwards`,
                    willChange: 'opacity',
                    ['--flash-peak' as string]: intensity >= 1 ? `${0.25 + (intensity - 1) * (0.30 / 7)}` : '0.25',
                  }}
                />
              )}
              
              {/* REVEAL PARTICLES */}
              {revealParticles.length > 0 && !prefersReducedMotion && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                  {revealParticles.map((p) => (
                    <div
                      key={`rev-${p.id}`}
                      className="absolute pointer-events-none"
                      style={{
                        width: `${p.size}px`,
                        height: `${p.size}px`,
                        backgroundColor: p.color,
                        borderRadius: '50%',
                        boxShadow: `0 0 6px ${p.color}`,
                        transform: 'translate(0, 0)',
                        animation: `particleBurstAnim 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards`,
                        ['--target-x' as string]: `${p.dx}px`,
                        ['--target-y' as string]: `${p.dy}px`,
                        ['--target-rot' as string]: `0deg`,
                        opacity: p.opacity,
                        willChange: 'transform, opacity',
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* HIGH INTENSITY CONFETTI SHOWER (Intensity 6+) */}
        {revealConfetti && !prefersReducedMotion && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-20 flex justify-center">
            {Array.from({ length: 40 }).map((_, i) => (
              <div
                key={`conf-${i}`}
                className="absolute top-0 w-1.5 h-3"
                style={{
                  backgroundColor: Math.random() > 0.5 ? displayRank.config.badgeAccent : '#fff',
                  left: `${10 + Math.random() * 80}%`,
                  opacity: 0,
                  transform: `translateY(-20px) rotate(${Math.random() * 360}deg)`,
                  animation: `confettiFall 1.5s cubic-bezier(0.3, 0, 0.8, 1) ${Math.random() * 0.2}s forwards`,
                }}
              />
            ))}
          </div>
        )}

        {/* ==========================================
            TEXT REVEAL: Stamped Typography & Rule Wipe
            ========================================== */}
        <div
          className={`flex flex-col items-center transition-all duration-300 ${
            showTitle ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Header Status Label: Stamped letter-spacing 0.6em -> 0.15em with blur 6px -> 0 */}
          <div className="flex flex-col items-center gap-1 mb-1.5 relative">
            {isMajorTierUp && (
              <div className="relative">
                <span className={`uppercase font-bold text-amber-400 inline-block drop-shadow-[0_0_8px_rgba(251,191,36,0.8)] ${
                  intensity >= 3 ? 'text-sm' : 'text-xs'
                }`}
                      style={{ animation: `fadeOutLabel ${intensity >= 6 ? 1.4 : 1}s forwards 1s ${intensity >= 3 ? ', labelScalePop 0.4s ease-out' : ''}` }}>
                  NEW TIER UNLOCKED
                </span>
                {intensity >= 6 && (
                  <div className="absolute inset-0 pointer-events-none" style={{ animation: 'fadeOutLabel 1.4s forwards 1s' }}>
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="absolute w-1 h-1 bg-amber-400 rounded-full"
                           style={{
                             left: `${50 + (Math.random() - 0.5) * 120}%`,
                             top: `${50 + (Math.random() - 0.5) * 20}%`,
                             animation: `particleBurstAnim 1s ease-out infinite ${Math.random()}s`,
                             ['--target-x' as string]: `${(Math.random() - 0.5) * 30}px`,
                             ['--target-y' as string]: `${(Math.random() - 0.5) * 30}px`,
                             ['--target-rot' as string]: `0deg`,
                           }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
            <span
              className="text-xs uppercase font-semibold text-slate-400 inline-block"
              style={{
                animation: prefersReducedMotion ? 'none' : 'headerLetterStamp 0.4s ease-out forwards',
                willChange: 'letter-spacing, opacity, filter',
              }}
            >
              {isRankUp ? 'RANK ADVANCEMENT' : 'SESSION COMPLETE'}
            </span>
          </div>

          {/* Geometric High-Contrast Rank Title: Individual Character Stagger (0.03s apart, scale 1.3 -> 1.0) */}
          <h1 className="text-3xl sm:text-5xl font-sans font-bold tracking-[0.18em] uppercase text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.6)] flex items-center justify-center flex-wrap">
            {displayRank.fullTitle.split('').map((char, idx) => (
              <span
                key={`${displayRank.fullTitle}-${idx}`}
                className="inline-block"
                style={{
                  animation: prefersReducedMotion ? 'none' : `charStamp 0.22s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 30}ms both`,
                  willChange: 'transform, opacity',
                  minWidth: char === ' ' ? '0.35em' : undefined,
                }}
              >
                {char === ' ' ? '\u00A0' : char}
              </span>
            ))}
          </h1>

          {/* Thin Horizontal Rule: Wipes outward from center in active tier color */}
          <div
            className="w-32 sm:w-48 h-[1.5px] mt-2 mb-2 rounded-full"
            style={{
              background: `linear-gradient(90deg, transparent, ${displayRank.config.badgeAccent}, transparent)`,
              boxShadow: `0 0 10px ${displayRank.config.badgeAccent}80`,
              animation: prefersReducedMotion ? 'none' : 'ruleWipeOut 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              willChange: 'transform, opacity',
            }}
          />

          {/* Milestone Countdown */}
          <p className="text-xs sm:text-sm font-medium tracking-wider text-slate-400 mt-0.5">
            <span className="text-xs uppercase tracking-[0.25em] text-slate-400 font-semibold">NEXT MILESTONE: </span>
            <span style={{ color: displayRank.config.badgeAccent }} className="font-semibold text-slate-200">
              {displayRank.nextTierTitle}
            </span>
            <span className="text-slate-500 font-mono"> ({remainingRP.toLocaleString()} RP remaining)</span>
          </p>
        </div>

        {/* ==========================================
            EARNED RP BAR: Segmented Pops, Leading Edge Glow & Rolling Counter
            ========================================== */}
        <div
          className={`w-full max-w-xl transition-all duration-400 mt-4 ${
            showProgress ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
          }`}
        >
          {/* Consolidated Session Stats Glassmorphic Strip */}
          <div className="w-full mb-3 px-4 sm:px-5 py-2.5 rounded-lg bg-white/[0.03] border border-[var(--border)] backdrop-blur-md flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="text-slate-400">Focus Duration</span>
              <span className="font-medium text-slate-200">{formattedDuration}</span>
              <span className={`font-mono ${sessionRP > 0 ? 'text-emerald-400/90' : 'text-slate-400'}`}>+{sessionRP} RP</span>
              {isUnderMinDuration && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-300/90 border border-rose-500/20 font-sans font-medium">
                  &lt; 5m min
                </span>
              )}
            </span>

            {goalStreakBonus > 0 ? (
              <>
                <span className="text-slate-600 select-none">•</span>
                <span className="flex items-center gap-1.5">
                  <span className="text-slate-400">Streak Bonus</span>
                  <span className="font-mono text-amber-400/90">+{goalStreakBonus} RP</span>
                </span>
              </>
            ) : streakBonusClaimedToday ? (
              <>
                <span className="text-slate-600 select-none">•</span>
                <span className="flex items-center gap-1.5">
                  <span className="text-slate-400">Streak Bonus</span>
                  <span className="font-mono text-slate-400">0 RP</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300/90 border border-amber-500/20 font-sans font-medium">
                    Claimed Today
                  </span>
                </span>
              </>
            ) : null}

            {taskBonus > 0 && (
              <>
                <span className="text-slate-600 select-none">•</span>
                <span className="flex items-center gap-1.5">
                  <span className="text-slate-400">Task Bonus</span>
                  <span className="font-mono text-cyan-400/90">+{taskBonus} RP</span>
                </span>
              </>
            )}

            <span className="text-slate-600 select-none">=</span>
            <span className="flex items-center gap-1.5">
              <span className="text-slate-400">Total Gained</span>
              <span className={`font-mono font-bold ${totalGained > 0 ? 'text-white' : 'text-slate-400'}`}>+{totalGained} RP</span>
            </span>
          </div>

          {/* Progress Header with Rolling RP Counter */}
          <div className="flex items-center justify-between text-xs font-semibold tracking-wider mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-[0.25em] text-slate-400 font-semibold">
                TIER PROGRESS
              </span>
              <div className={`inline-flex items-center px-2 py-0.5 rounded ${
                totalGained > 0
                  ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-300'
                  : 'bg-slate-500/10 border border-slate-500/25 text-slate-400'
              } font-mono font-semibold text-[11px]`}>
                +{displayedGain} RP
              </div>
            </div>
            
            {/* Rolling Counter (pops 1.0 -> 1.15 -> 1.0 on final resolution tick) */}
            <div
              className={`font-mono text-xs text-slate-300 transition-transform duration-200 ${
                counterPopped ? 'scale-115 text-white' : 'scale-100'
              }`}
              style={{ willChange: 'transform' }}
            >
              <span className="text-white font-bold">{animatingRP.toLocaleString()}</span>
              <span className="text-slate-500"> / {displayRank.maxRP.toLocaleString()} RP</span>
            </div>
          </div>

          {/* 5-SEGMENT EARNED PROGRESS BAR TRACK */}
          <div
            className={`relative w-full h-3 sm:h-3.5 bg-white/[0.06] rounded-full p-[1.5px] border border-white/10 overflow-hidden shadow-inner transition-colors duration-300 ${
              isBarFlashing ? 'bg-white shadow-[0_0_20px_#ffffff]' : ''
            }`}
          >
            {/* 5 Distinct Track Segments with Discrete Pop Animations */}
            <div className="absolute inset-[1.5px] grid grid-cols-5 gap-[1.5px] pointer-events-none z-10">
              {[0, 1, 2, 3, 4].map((segIdx) => (
                <div
                  key={segIdx}
                  className={`h-full border-r border-black/30 last:border-r-0 transition-transform duration-150 ${
                    poppedSegment === segIdx ? 'scale-y-[1.28] bg-white/20' : 'scale-y-100'
                  }`}
                  style={{ willChange: 'transform' }}
                />
              ))}
            </div>

            {/* Continuous Smooth Cubic Fill Bar */}
            <div
              className="h-full rounded-full transition-all duration-75 relative z-0"
              style={{
                width: `${Math.min(100, Math.max(0, progressRatio * 100))}%`,
                background: `linear-gradient(90deg, ${displayRank.config.badgeSecondary}, ${activeBarColor})`,
                boxShadow: `0 0 14px ${activeBarColor}80`,
                willChange: 'width',
              }}
            >
              {/* Bright Leading-Edge Glow Highlight traveling at the fill head */}
              {progressRatio > 0.01 && progressRatio < 0.999 && (
                <div
                  className="absolute right-0 top-0 bottom-0 w-2.5 rounded-full bg-white pointer-events-none"
                  style={{
                    boxShadow: `0 0 10px #FFFFFF, 0 0 20px ${activeBarColor}, 0 0 30px ${activeBarColor}`,
                    transform: 'translateX(50%)',
                    willChange: 'transform',
                  }}
                />
              )}
            </div>

            {/* White Flash Overlay (Fired when crossing tier boundary at 100%) */}
            {isBarFlashing && (
              <div className="absolute inset-0 bg-white pointer-events-none z-20 animate-pulse" />
            )}
          </div>
        </div>

        {/* ==========================================
            STAGE 5: CONTINUE BUTTON (Slide up 12px + Pulsing Outline Glow)
            ========================================== */}
        <div
          className={`mt-6 sm:mt-7 flex flex-col items-center transition-all duration-350 transform ${
            showContinue
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-3 pointer-events-none'
          }`}
          style={{ willChange: 'transform, opacity' }}
        >
          <button
            onClick={() => {
              soundFx.resumeContext();
              onContinue();
            }}
            className="px-8 py-3.5 rounded-md border border-white/25 bg-white/10 hover:bg-white/20 text-white text-xs tracking-widest font-semibold uppercase transition-all cursor-pointer select-none active:scale-[0.98] shadow-sm flex items-center gap-2 relative"
            style={{
              animation: prefersReducedMotion ? 'none' : 'continuePulseOutline 2.4s ease-in-out infinite',
              willChange: 'box-shadow',
            }}
          >
            <span>CONTINUE</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 stroke-[2.5]" />
          </button>

          {/* Keyboard Hint */}
          <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase mt-3">
            PRESS SPACEBAR OR ENTER TO CONTINUE
          </span>
        </div>

      </div>

      {/* ==========================================
          GLOBAL CSS KEYFRAMES (High-Performance GPU Transitions)
          ========================================== */}
      <style jsx>{`
        /* 1. BADGE MASS SLAM: Phase A (0-0.32s) + Phase B (0.32-0.52s) Spring Overshoot */
        @keyframes badgeMassSlam {
          0% {
            transform: translateY(-40px) scale(2.2);
            opacity: 0;
            filter: blur(12px);
            animation-timing-function: cubic-bezier(0.7, 0, 0.84, 0);
          }
          61.5% {
            /* Landing moment at 0.32s */
            transform: translateY(0px) scale(0.92);
            opacity: 1;
            filter: blur(0px);
            animation-timing-function: ease-out;
          }
          80% {
            /* Spring overshoot at ~0.42s matching stiffness 380, damping 14, mass 1.2 */
            transform: translateY(0px) scale(1.028);
            opacity: 1;
            filter: blur(0px);
          }
          92% {
            transform: translateY(0px) scale(0.995);
            opacity: 1;
            filter: blur(0px);
          }
          100% {
            transform: translateY(0px) scale(1.0);
            opacity: 1;
            filter: blur(0px);
          }
        }

        /* 2. LANDING WOBBLE: 2-3 degree rotation wobble on landing that damps out over 0.6s */
        @keyframes landingWobble {
          0%, 34% {
            transform: rotate(0deg);
          }
          38% {
            transform: rotate(2.8deg);
          }
          48% {
            transform: rotate(-1.9deg);
          }
          62% {
            transform: rotate(0.9deg);
          }
          78% {
            transform: rotate(-0.35deg);
          }
          100% {
            transform: rotate(0deg);
          }
        }

        /* 3. DUAL SHOCKWAVE RINGS */
        @keyframes shockwaveRing1 {
          0% {
            transform: scale(0.2);
            opacity: 0.9;
            border-width: 4px;
          }
          100% {
            transform: scale(2.4);
            opacity: 0;
            border-width: 0px;
          }
        }

        @keyframes shockwaveRing2 {
          0% {
            transform: scale(0.2);
            opacity: 0.9;
            border-width: 4px;
          }
          100% {
            transform: scale(3.6);
            opacity: 0;
            border-width: 0px;
          }
        }

        @keyframes radialFlashAnim {
          0% { opacity: 0; }
          28% { opacity: 0.35; }
          100% { opacity: 0; }
        }

        @keyframes majorTierFlash {
          0% { opacity: 0; }
          15% { opacity: 0.6; }
          100% { opacity: 0; }
        }

        @keyframes majorTierFlashIntense {
          0% { opacity: 0; }
          15% { opacity: 0.85; }
          100% { opacity: 0; }
        }

        @keyframes revealFlashAnim {
          0% { opacity: 0; }
          50% { opacity: var(--flash-peak, 0.3); }
          100% { opacity: 0; }
        }

        @keyframes fadeOutLabel {
          to { opacity: 0; }
        }

        @keyframes labelScalePop {
          0% { transform: scale(0.5); opacity: 0; }
          70% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); }
        }

        @keyframes confettiFall {
          0% { opacity: 1; transform: translateY(-20px) rotate(0deg); }
          100% { opacity: 0; transform: translateY(200px) rotate(720deg); }
        }

        /* 5. RADIAL SPARK / SHARD BURST (Trajectory driven by CSS variables) */
        @keyframes particleBurstAnim {
          0% {
            transform: translate(0, 0) scale(1) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translate(var(--target-x), var(--target-y)) scale(0.3) rotate(var(--target-rot));
            opacity: 0;
          }
        }

        /* 6. CHROMATIC ABERRATION DECAY */
        @keyframes chromaticDecayCyan {
          0% {
            transform: translateX(-3px);
            opacity: 0.7;
          }
          100% {
            transform: translateX(0px);
            opacity: 0;
          }
        }

        @keyframes chromaticDecayRed {
          0% {
            transform: translateX(3px);
            opacity: 0.7;
          }
          100% {
            transform: translateX(0px);
            opacity: 0;
          }
        }

        /* 7. TEXT STAMP ANIMATIONS */
        @keyframes headerLetterStamp {
          0% {
            letter-spacing: 0.6em;
            opacity: 0;
            filter: blur(6px);
          }
          100% {
            letter-spacing: 0.15em;
            opacity: 1;
            filter: blur(0px);
          }
        }

        @keyframes charStamp {
          0% {
            transform: scale(1.3);
            opacity: 0;
          }
          100% {
            transform: scale(1.0);
            opacity: 1;
          }
        }

        @keyframes ruleWipeOut {
          0% {
            transform: scaleX(0);
            opacity: 0;
          }
          100% {
            transform: scaleX(1);
            opacity: 0.85;
          }
        }

        /* 8. AMBIENT LUSTER & MOTES */
        @keyframes conicSheenRotate {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes ffBreatheGlow {
          0%, 100% {
            opacity: 0.5;
            transform: scale(1);
          }
          50% {
            opacity: 0.75;
            transform: scale(1.06);
          }
        }

        @keyframes floatMoteDrift {
          0% {
            transform: translateY(0px) translateX(0px);
          }
          50% {
            transform: translateY(-40px) translateX(15px);
          }
          100% {
            transform: translateY(-80px) translateX(0px);
          }
        }

        /* 9. CONTINUE BUTTON PULSING OUTLINE GLOW */
        @keyframes continuePulseOutline {
          0%, 100% {
            box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.15), 0 0 12px rgba(255, 255, 255, 0.05);
          }
          50% {
            box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.45), 0 0 22px rgba(255, 255, 255, 0.3);
          }
        }

        /* 10. SIMPLE FADE IN (Reduced Motion Mode) */
        @keyframes simpleFadeIn {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
