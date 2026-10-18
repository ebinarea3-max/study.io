'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Crown,
  Lock,
  Check,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  Loader2,
  Calendar,
  Flame,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { useReducedMotion } from 'framer-motion';
import { Logo } from '../../components/Logo';
import { useAuth } from '../../context/AuthContext';
import { usePremium } from '../../context/PremiumContext';
import { useRankTheme } from '../../hooks/useRankTheme';
import { RankCrestBadge } from '../../components/common/RankCrestBadge';
import { RankTierName } from '../../lib/rankedSystem';
import { useRazorpayCheckout } from '../../hooks/useRazorpayCheckout';
import { PAYMENTS_ENABLED } from '../../config/billing';

/* ═══════════════════════════════════════════════════════════════════════════
   COSMIC IRIS & AURORA PALETTE (Luminous Violet, Indigo & Celestial Cyan)
   ═══════════════════════════════════════════════════════════════════════════ */
const PREMIUM_GRADIENT =
  'linear-gradient(135deg, #C084FC 0%, #818CF8 50%, #38BDF8 100%)';
const PREMIUM_BUTTON_GRADIENT =
  'linear-gradient(135deg, #9333EA 0%, #6366F1 50%, #06B6D4 100%)';
const PREMIUM_HAIRLINE = 'rgba(129, 140, 248, 0.16)';
const PREMIUM_HAIRLINE_HOVER = 'rgba(129, 140, 248, 0.38)';
const PREMIUM_GLOW = 'rgba(99, 102, 241, 0.22)';
const PREMIUM_ACCENT = '#818CF8';

/* Hook for observing visibility so animations only run while on-screen */
function useTileVisibility(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
}

/* ═══════════════════════════════════════════════════════════════════════════
   SPOTLIGHT BENTO CARD WRAPPER
   ═══════════════════════════════════════════════════════════════════════════ */
interface BentoCardProps {
  children: React.ReactNode;
  title: string;
  caption: string;
  className?: string;
  isPremium: boolean;
  href?: string;
  delayIndex?: number;
}

function BentoCard({
  children,
  title,
  caption,
  className = '',
  isPremium,
  href,
  delayIndex = 0,
}: BentoCardProps) {
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null);
  const { ref: inViewRef, isVisible } = useTileVisibility(0.1);
  const shouldReduceMotion = useReducedMotion();

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (shouldReduceMotion) return;
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    setCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handlePointerLeave = () => {
    setCoords(null);
  };

  const handleClick = () => {
    if (isPremium && href) {
      router.push(href);
    }
  };

  return (
    <div
      ref={(el) => {
        cardRef.current = el;
        // @ts-ignore
        inViewRef.current = el;
      }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onClick={handleClick}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-white/[0.03] p-5 sm:p-6 transition-all duration-500 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06),0_12px_32px_-8px_rgba(0,0,0,0.6)] ${
        isPremium && href ? 'cursor-pointer hover:border-[rgba(129,140,248,0.4)]' : ''
      } ${className}`}
      style={{
        border: `1px solid ${PREMIUM_HAIRLINE}`,
        opacity: isVisible || shouldReduceMotion ? 1 : 0,
        transform:
          isVisible || shouldReduceMotion
            ? 'translateY(0px)'
            : 'translateY(12px)',
        transition: shouldReduceMotion
          ? 'none'
          : `opacity 0.45s ease-out ${delayIndex * 70}ms, transform 0.45s ease-out ${delayIndex * 70}ms, border-color 0.25s ease`,
      }}
    >
      {/* Spotlight highlight driven by pointer coordinates */}
      {coords && (
        <div
          className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
          style={{
            background: `radial-gradient(350px circle at ${coords.x}px ${coords.y}px, rgba(129, 140, 248, 0.12), transparent 80%)`,
          }}
        />
      )}

      {/* Top Bar: Preview tag & Status Badge */}
      <div className="relative z-10 flex items-center justify-between">
        <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[9px] font-mono uppercase tracking-widest text-indigo-300/80 border border-indigo-400/20">
          Preview
        </span>
        <div
          className={`flex h-6 w-6 items-center justify-center rounded-full border ${
            isPremium
              ? 'border-indigo-400/40 bg-indigo-500/15 text-indigo-300'
              : 'border-white/10 bg-white/5 text-white/40'
          }`}
          title={isPremium ? 'Unlocked' : 'Requires Premium'}
        >
          {isPremium ? (
            <Check className="h-3 w-3 stroke-[2.5]" />
          ) : (
            <Lock className="h-3 w-3" />
          )}
        </div>
      </div>

      {/* Visual Demo Section */}
      <div className="relative z-10 my-auto flex w-full items-center justify-center py-4">
        {children}
      </div>

      {/* Bottom Left Title & Caption */}
      <div className="relative z-10 pt-2 text-left">
        <h3 className="font-hud text-sm font-bold tracking-wide text-white">
          {title}
        </h3>
        <p className="mt-0.5 text-xs text-white/60 line-clamp-1">
          {caption}
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   LIVE DEMO 1: THEMES (Gold Leaf & Crimson Cross-fade)
   ═══════════════════════════════════════════════════════════════════════════ */
function ThemesDemo() {
  const { ref, isVisible } = useTileVisibility(0.2);
  const shouldReduceMotion = useReducedMotion();
  const [activeTheme, setActiveTheme] = useState<'gold' | 'crimson'>('gold');

  // Auto cross-fade every 3s when visible
  useEffect(() => {
    if (!isVisible || shouldReduceMotion) return;
    const interval = setInterval(() => {
      setActiveTheme((prev) => (prev === 'gold' ? 'crimson' : 'gold'));
    }, 3000);
    return () => clearInterval(interval);
  }, [isVisible, shouldReduceMotion]);

  const isGold = activeTheme === 'gold';

  return (
    <div ref={ref} className="w-full max-w-sm">
      {/* Mini App Window */}
      <div
        className="relative overflow-hidden rounded-2xl border p-3 transition-colors duration-700 shadow-md"
        style={{
          backgroundColor: isGold ? '#0C0A06' : '#0E0809',
          borderColor: isGold ? 'rgba(230,193,90,0.25)' : 'rgba(229,72,77,0.25)',
        }}
      >
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
          <div className="flex items-center gap-1.5">
            <div
              className="h-2 w-2 rounded-full transition-colors duration-700"
              style={{ backgroundColor: isGold ? '#E6C15A' : '#E5484D' }}
            />
            <span
              className="text-[10px] font-hud font-bold tracking-wider uppercase transition-colors duration-700"
              style={{ color: isGold ? '#E6C15A' : '#E5484D' }}
            >
              {isGold ? 'Gold Leaf' : 'Crimson'}
            </span>
          </div>
          <span className="text-[9px] font-mono text-white/40">25:00</span>
        </div>

        <div className="mt-2.5 flex items-center justify-between gap-2">
          <div className="h-2 flex-1 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: isGold ? '68%' : '84%',
                backgroundColor: isGold ? '#E6C15A' : '#E5484D',
              }}
            />
          </div>
          <span
            className="text-[9px] font-mono font-bold transition-colors duration-700"
            style={{ color: isGold ? '#F5E6A8' : '#FFA1A6' }}
          >
            {isGold ? '68%' : '84%'}
          </span>
        </div>
      </div>

      {/* Manual Swatch Selector */}
      <div className="mt-3 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => setActiveTheme('gold')}
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-mono transition-all cursor-pointer ${
            isGold
              ? 'border border-[#E6C15A]/60 bg-[#E6C15A]/15 text-[#E6C15A]'
              : 'border border-transparent text-white/40 hover:text-white'
          }`}
        >
          <span className="h-2 w-2 rounded-full bg-[#E6C15A]" />
          <span>Gold Leaf</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTheme('crimson')}
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-mono transition-all cursor-pointer ${
            !isGold
              ? 'border border-[#E5484D]/60 bg-[#E5484D]/15 text-[#E5484D]'
              : 'border border-transparent text-white/40 hover:text-white'
          }`}
        >
          <span className="h-2 w-2 rounded-full bg-[#E5484D]" />
          <span>Crimson</span>
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   LIVE DEMO 2: DAILY GOALS (Luminous Ring Filling to 72% + Streak)
   ═══════════════════════════════════════════════════════════════════════════ */
function DailyGoalsDemo() {
  const { ref, isVisible } = useTileVisibility(0.2);
  const shouldReduceMotion = useReducedMotion();
  const [progress, setProgress] = useState(72);

  useEffect(() => {
    if (!isVisible || shouldReduceMotion) return;
    const interval = setInterval(() => {
      setProgress((prev) => (prev === 72 ? 15 : 72));
    }, 3200);
    return () => clearInterval(interval);
  }, [isVisible, shouldReduceMotion]);

  const targetProgress = shouldReduceMotion ? 72 : progress;
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (targetProgress / 100) * circumference;

  return (
    <div ref={ref} className="relative flex flex-col items-center justify-center">
      <div className="relative flex h-24 w-24 items-center justify-center">
        <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 80 80">
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="5"
            fill="transparent"
          />
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke="url(#iris-gradient)"
            strokeWidth="5"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            style={{
              transition: shouldReduceMotion ? 'none' : 'stroke-dashoffset 1s ease-out',
            }}
          />
          <defs>
            <linearGradient id="iris-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#C084FC" />
              <stop offset="50%" stopColor="#818CF8" />
              <stop offset="100%" stopColor="#38BDF8" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center label */}
        <div className="absolute flex flex-col items-center">
          <span className="font-hud text-sm font-bold text-white">
            {targetProgress}%
          </span>
          <span className="text-[8px] font-mono uppercase text-indigo-300">
            Goal
          </span>
        </div>
      </div>

      {/* Streak badge */}
      <div className="mt-1.5 flex items-center gap-1 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-mono text-indigo-300">
        <Flame className="h-3 w-3 fill-current text-indigo-400" />
        <span>12d streak</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   LIVE DEMO 3: WEEKLY REPORT (Growing Bars + "+18%" Chip)
   ═══════════════════════════════════════════════════════════════════════════ */
function WeeklyReportDemo() {
  const { ref, isVisible } = useTileVisibility(0.2);
  const shouldReduceMotion = useReducedMotion();
  const [heightFactor, setHeightFactor] = useState(1);

  useEffect(() => {
    if (!isVisible || shouldReduceMotion) return;
    const interval = setInterval(() => {
      setHeightFactor((prev) => (prev === 1 ? 0.35 : 1));
    }, 2800);
    return () => clearInterval(interval);
  }, [isVisible, shouldReduceMotion]);

  const bars = [40, 65, 30, 85, 55, 95, 75];

  return (
    <div ref={ref} className="w-full max-w-[200px]">
      {/* Metric Chip */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[10px] font-mono text-white/40">vs last week</span>
        <span className="inline-flex items-center gap-1 rounded-full border border-cyan-400/30 bg-cyan-400/15 px-2 py-0.5 font-mono text-[10px] font-bold text-cyan-300">
          <TrendingUp className="h-3 w-3" />
          <span>+18%</span>
        </span>
      </div>

      {/* 7 Bars Container */}
      <div className="flex h-20 items-end justify-between gap-1.5 rounded-xl border border-white/[0.06] bg-black/40 p-2.5">
        {bars.map((pct, idx) => {
          const currentHeight = shouldReduceMotion ? pct : pct * heightFactor;
          return (
            <div key={idx} className="relative flex h-full w-full items-end justify-center">
              {/* Last week's faint bar */}
              <div
                className="absolute w-2 rounded-t-sm bg-white/10"
                style={{ height: `${pct * 0.75}%` }}
              />
              {/* This week's active bar */}
              <div
                className="relative z-10 w-2 rounded-t-sm bg-gradient-to-t from-indigo-500 to-cyan-400 transition-all duration-700 ease-out"
                style={{
                  height: `${currentHeight}%`,
                  boxShadow: '0 0 8px rgba(99,102,241,0.35)',
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   LIVE DEMO 4: TIME TRAVEL (Calendar Date Hopping & Month Flip)
   ═══════════════════════════════════════════════════════════════════════════ */
function TimeTravelDemo() {
  const { ref, isVisible } = useTileVisibility(0.2);
  const shouldReduceMotion = useReducedMotion();
  const [step, setStep] = useState(0);

  // Hop between calendar positions every 2s
  useEffect(() => {
    if (!isVisible || shouldReduceMotion) return;
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % 4);
    }, 2000);
    return () => clearInterval(interval);
  }, [isVisible, shouldReduceMotion]);

  const monthLabel = step < 2 ? 'OCTOBER' : 'NOVEMBER';
  const activeDay = step === 0 ? 14 : step === 1 ? 28 : step === 2 ? 4 : 18;

  const days = [
    [1, 2, 3, 4],
    [7, 8, 14, 18],
    [21, 22, 28, 29],
  ];

  return (
    <div ref={ref} className="w-full max-w-xs">
      <div className="rounded-2xl border border-white/[0.08] bg-black/40 p-3 shadow-inner">
        {/* Month Header */}
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
          <div className="flex items-center gap-1.5 text-indigo-300">
            <Calendar className="h-3.5 w-3.5" />
            <span className="font-hud text-[11px] font-bold tracking-wider">
              {monthLabel}
            </span>
          </div>
          <span className="text-[9px] font-mono text-white/40">2026</span>
        </div>

        {/* Mini Calendar Grid */}
        <div className="mt-2.5 grid grid-cols-4 gap-1.5 text-center font-mono text-[10px]">
          {days.flat().map((d, idx) => {
            const isTarget = d === activeDay;
            return (
              <div
                key={idx}
                className={`flex h-7 items-center justify-center rounded-lg transition-all duration-300 ${
                  isTarget
                    ? 'border border-indigo-400 bg-indigo-500 font-bold text-white shadow-[0_0_12px_rgba(99,102,241,0.6)]'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                {d}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   LIVE DEMO 5: SCHOLAR CROWN (Crown Drop-in + Shimmer)
   ═══════════════════════════════════════════════════════════════════════════ */
function ScholarCrownDemo() {
  const { ref, isVisible } = useTileVisibility(0.2);
  const shouldReduceMotion = useReducedMotion();
  const [hasDropped, setHasDropped] = useState(false);

  useEffect(() => {
    if (!isVisible || shouldReduceMotion) {
      setHasDropped(true);
      return;
    }
    const timer = setTimeout(() => setHasDropped(true), 300);
    return () => clearTimeout(timer);
  }, [isVisible, shouldReduceMotion]);

  return (
    <div ref={ref} className="w-full max-w-sm">
      <div className="rounded-2xl border border-white/[0.08] bg-black/40 p-3 shadow-inner">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs font-bold text-indigo-300">#1</span>
            <div className="h-8 w-8 rounded-full border border-indigo-400/40 bg-indigo-950/60 flex items-center justify-center font-bold text-xs text-indigo-300">
              S
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="font-hud text-xs font-bold text-white">
                  Scholar
                </span>
                {/* Crown SVG drops in with shimmer */}
                <span
                  className="inline-flex text-amber-400 transition-all duration-500 ease-out"
                  style={{
                    transform: hasDropped ? 'translateY(0)' : 'translateY(-8px)',
                    opacity: hasDropped ? 1 : 0,
                    filter: hasDropped
                      ? 'drop-shadow(0 0 6px rgba(251,191,36,0.8))'
                      : 'none',
                  }}
                >
                  <Crown className="h-3.5 w-3.5 fill-current" />
                </span>
              </div>
              <span className="text-[9px] font-mono text-white/40">
                128h focused
              </span>
            </div>
          </div>
          <span className="rounded-full bg-indigo-500/15 border border-indigo-400/30 px-2 py-0.5 text-[9px] font-mono font-bold text-indigo-300">
            Top 1%
          </span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   HERO PRODUCT MOCKUP (Right Column on Desktop)
   ═══════════════════════════════════════════════════════════════════════════ */
function HeroProductMockup({
  tier,
  division,
}: {
  tier: RankTierName;
  division?: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const shouldReduceMotion = useReducedMotion();

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (shouldReduceMotion) return;
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    // Up to 6 degrees tilt
    setTilt({
      x: -y * 12,
      y: x * 12,
    });
  };

  const handlePointerLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  return (
    <div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative flex items-center justify-center p-4"
    >
      {/* Background Soft Aurora Glow */}
      <div
        className="pointer-events-none absolute h-64 w-64 rounded-full blur-[100px] opacity-35"
        style={{ backgroundColor: '#6366F1' }}
      />

      {/* Floating Mockup Card */}
      <div
        className="relative w-full max-w-[340px] overflow-hidden rounded-3xl border p-6 shadow-2xl transition-transform duration-150 ease-out"
        style={{
          backgroundColor: '#0C0E17',
          borderColor: 'rgba(129, 140, 248, 0.25)',
          boxShadow:
            '0 25px 50px -12px rgba(0,0,0,0.8), 0 0 35px rgba(99,102,241,0.18)',
          transform: shouldReduceMotion
            ? 'none'
            : `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        }}
      >
        {/* Card Header: Scholar Identity with Crown & Crest */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <RankCrestBadge tier={tier} division={division} size={34} />
              <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-black">
                <Crown className="h-2.5 w-2.5 fill-current" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-hud text-xs font-bold text-white">
                  Scholar Pro
                </span>
              </div>
              <span className="text-[9px] font-mono text-indigo-300">
                Gold Leaf Active
              </span>
            </div>
          </div>
          <span className="rounded-full bg-indigo-500/15 border border-indigo-400/30 px-2.5 py-0.5 text-[9px] font-hud font-bold text-indigo-300 uppercase tracking-wider">
            Premium
          </span>
        </div>

        {/* Card Center: Timer with Filling Progress Ring */}
        <div className="my-6 flex flex-col items-center justify-center">
          <div className="relative flex h-36 w-36 items-center justify-center">
            <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="4"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="url(#hero-ring-grad)"
                strokeWidth="4"
                strokeDasharray={264}
                strokeDashoffset={66}
                strokeLinecap="round"
                fill="transparent"
                style={{
                  boxShadow: '0 0 12px rgba(99,102,241,0.5)',
                }}
              />
              <defs>
                <linearGradient id="hero-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#C084FC" />
                  <stop offset="50%" stopColor="#818CF8" />
                  <stop offset="100%" stopColor="#38BDF8" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="font-hud text-2xl font-black tracking-tight text-white">
                25:00
              </span>
              <span className="text-[9px] font-mono uppercase tracking-widest text-indigo-300">
                Deep Focus
              </span>
            </div>
          </div>
        </div>

        {/* Card Footer: Live Telemetry Indicator */}
        <div className="flex items-center justify-between rounded-xl bg-white/[0.03] border border-white/[0.05] p-2.5 text-[10px] font-mono text-white/60">
          <span className="flex items-center gap-1.5 text-white">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Session in flow</span>
          </span>
          <span className="text-cyan-300 font-bold">+18% Weekly Growth</span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN /PREMIUM PAGE COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
export default function PremiumPage() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const { isPremium, premiumUntil, loading: premiumLoading } = usePremium();
  const { userRank } = useRankTheme();

  // Dynamic Razorpay checkout & live plan rates
  const { plans, isProcessing, startCheckout } = useRazorpayCheckout();

  const monthlyFormatted = plans?.monthly?.formattedAmount || '₹499';
  const yearlyFormatted = plans?.yearly?.formattedAmount || '₹4,999';
  const monthlyAmount = plans?.monthly?.amount ? plans.monthly.amount / 100 : 499;
  const yearlyAmount = plans?.yearly?.amount ? plans.yearly.amount / 100 : 4999;
  const savingPercentage = Math.max(
    0,
    Math.round((1 - yearlyAmount / (monthlyAmount * 12)) * 100)
  );

  // Track if pricing section is visible on screen to hide mobile sticky bar
  const pricingRef = useRef<HTMLDivElement>(null);
  const [isPricingVisible, setIsPricingVisible] = useState(false);

  useEffect(() => {
    const el = pricingRef.current;
    if (!el || typeof window === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsPricingVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Smooth scroll helpers
  const handleScrollToPricing = () => {
    const el = document.getElementById(isPremium ? 'premium-status-section' : 'pricing');
    if (el) {
      el.scrollIntoView({ behavior: shouldReduceMotion ? 'auto' : 'smooth' });
    }
  };

  const handleScrollToFeatures = () => {
    const el = document.getElementById('features');
    if (el) {
      el.scrollIntoView({ behavior: shouldReduceMotion ? 'auto' : 'smooth' });
    }
  };

  const formattedDate = premiumUntil
    ? new Date(premiumUntil).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <div className="min-h-screen bg-[#08090E] text-white selection:bg-indigo-500/30 selection:text-white relative overflow-x-hidden pb-24 lg:pb-12">
      {/* Barely visible SVG film grain (~2.5% opacity) */}
      <svg
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[2] h-full w-full opacity-[0.025]"
      >
        <filter id="premium-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.75"
            numOctaves="3"
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#premium-grain)" />
      </svg>

      {/* Dotted grid background */}
      <div className="fixed inset-0 pointer-events-none bg-dot-grid opacity-25 z-0" />

      {/* Two soft cosmic radial ambient glows */}
      <div
        className="pointer-events-none fixed -top-24 left-1/3 h-[520px] w-[520px] -translate-x-1/2 rounded-full blur-[170px] opacity-20 z-0"
        style={{ backgroundColor: '#6366F1' }}
      />
      <div
        className="pointer-events-none fixed top-1/3 right-0 h-[480px] w-[480px] rounded-full blur-[170px] opacity-15 z-0"
        style={{ backgroundColor: '#06B6D4' }}
      />
      <div
        className="pointer-events-none fixed bottom-1/4 left-0 h-[420px] w-[420px] rounded-full blur-[170px] opacity-15 z-0"
        style={{ backgroundColor: '#9333EA' }}
      />

      {/* Slim Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#08090E]/85 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-xs font-hud font-bold tracking-wider group cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
            <div className="flex items-center gap-2">
              <Logo className="w-5 h-5" />
              <span>Back to dashboard</span>
            </div>
          </Link>

          {/* Status chip with skeleton fallback while loading */}
          <div>
            {premiumLoading ? (
              <div className="h-6 w-24 rounded-full bg-white/10 animate-pulse" />
            ) : isPremium ? (
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-hud font-bold tracking-wider uppercase text-white"
                style={{
                  background: PREMIUM_BUTTON_GRADIENT,
                  boxShadow: '0 0 14px rgba(99,102,241,0.4)',
                }}
              >
                <Crown className="w-3 h-3 fill-current text-amber-300" />
                <span>Premium Active</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={handleScrollToPricing}
                className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-xl text-[10px] font-hud font-bold tracking-wider uppercase text-white hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-sm"
                style={{ background: PREMIUM_BUTTON_GRADIENT }}
              >
                <Crown className="w-3 h-3 fill-current text-amber-300" />
                <span>Upgrade</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 1: ASYMMETRIC HERO
            ═══════════════════════════════════════════════════════════════════ */}
        <section
          aria-labelledby="hero-heading"
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center pt-10 sm:pt-16 pb-12 sm:pb-16"
        >
          {/* Left Column: Text & Buttons */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            {/* Small Radiant Pill */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-indigo-400/30 bg-indigo-500/10 text-[10px] font-hud font-bold uppercase tracking-widest text-indigo-300 mb-4 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
              <Crown className="w-3 h-3 fill-current text-amber-400" />
              <span>Premium</span>
            </div>

            {/* Display Headline */}
            <h1
              id="hero-heading"
              className="text-4xl sm:text-5xl lg:text-6xl font-hud font-black tracking-tight leading-[1.08] text-transparent bg-clip-text"
              style={{
                backgroundImage: 'linear-gradient(135deg, #FFFFFF 0%, #E0E7FF 45%, #A5F3FC 100%)',
              }}
            >
              Study with an unfair advantage.
            </h1>

            {/* Subline strictly 10 words or fewer */}
            <p className="mt-3.5 text-base sm:text-lg text-white/70 max-w-lg leading-snug">
              Themes, goals, reports and flair for serious studiers.
            </p>

            {/* Action Buttons: Skeleton while loading to prevent upsell flash */}
            <div className="mt-7 flex flex-wrap items-center gap-3">
              {premiumLoading ? (
                <div className="h-11 w-36 rounded-2xl bg-white/10 animate-pulse" />
              ) : isPremium ? (
                <button
                  type="button"
                  onClick={handleScrollToPricing}
                  className="px-6 py-3 rounded-2xl font-hud font-bold text-xs uppercase tracking-wider text-white hover:opacity-95 active:scale-95 transition-all shadow-lg cursor-pointer flex items-center gap-2"
                  style={{
                    background: PREMIUM_BUTTON_GRADIENT,
                    boxShadow: '0 0 24px rgba(99,102,241,0.35)',
                  }}
                >
                  <span>View your benefits</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleScrollToPricing}
                    className="px-6 py-3 rounded-2xl font-hud font-extrabold text-xs uppercase tracking-wider text-white hover:opacity-95 active:scale-95 transition-all shadow-lg cursor-pointer flex items-center gap-2"
                    style={{
                      background: PREMIUM_BUTTON_GRADIENT,
                      boxShadow: '0 0 24px rgba(99,102,241,0.35)',
                    }}
                  >
                    <span>Get Premium</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleScrollToFeatures}
                    className="px-5 py-3 rounded-2xl text-xs font-hud font-bold tracking-wider uppercase text-white/60 hover:text-white hover:bg-white/5 border border-white/10 transition-all cursor-pointer"
                  >
                    See what&apos;s included
                  </button>
                </>
              )}
            </div>

            {/* True facts line: No fake timers or countdowns */}
            <p className="mt-4 text-[11px] text-white/40">
              Billed via Razorpay • Cancel renewal anytime in Settings
            </p>
          </div>

          {/* Right Column: Floating CSS Product Mockup */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <HeroProductMockup
              tier={userRank.tier}
              division={userRank.division}
            />
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 2: FEATURE BENTO GRID (5 Features, Story Cards Removed)
            ═══════════════════════════════════════════════════════════════════ */}
        <section
          id="features"
          aria-labelledby="bento-heading"
          className="pt-10 sm:pt-14 pb-16 sm:pb-20"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* ROW 1: Themes (cols 1-7) */}
            <BentoCard
              title="Gold Leaf & Crimson"
              caption="Two exclusive themes."
              className="lg:col-span-7 min-h-[240px] sm:min-h-[260px]"
              isPremium={isPremium}
              href="/dashboard"
              delayIndex={0}
            >
              <ThemesDemo />
            </BentoCard>

            {/* ROW 1: Daily Goals (cols 8-12) */}
            <BentoCard
              title="Daily goals"
              caption="A gold ring that fills as you study."
              className="lg:col-span-5 min-h-[240px] sm:min-h-[260px]"
              isPremium={isPremium}
              href="/dashboard"
              delayIndex={1}
            >
              <DailyGoalsDemo />
            </BentoCard>

            {/* ROW 2: Weekly Report (cols 1-4) */}
            <BentoCard
              title="Weekly report"
              caption="This week vs last, at a glance."
              className="lg:col-span-4 min-h-[240px] sm:min-h-[260px]"
              isPremium={isPremium}
              href="/dashboard"
              delayIndex={2}
            >
              <WeeklyReportDemo />
            </BentoCard>

            {/* ROW 2: Time Travel (cols 5-8) */}
            <BentoCard
              title="Time travel"
              caption="Browse every past day and month."
              className="lg:col-span-4 min-h-[240px] sm:min-h-[260px]"
              isPremium={isPremium}
              href="/dashboard"
              delayIndex={3}
            >
              <TimeTravelDemo />
            </BentoCard>

            {/* ROW 2: Scholar Crown (cols 9-12) */}
            <BentoCard
              title="Scholar crown"
              caption="Shown beside your name everywhere."
              className="lg:col-span-4 min-h-[240px] sm:min-h-[260px]"
              isPremium={isPremium}
              href="/leaderboard"
              delayIndex={4}
            >
              <ScholarCrownDemo />
            </BentoCard>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 3: PRICING / STATUS (Exact Existing Source Logic)
            ═══════════════════════════════════════════════════════════════════ */}
        <section
          id="pricing"
          ref={pricingRef}
          aria-labelledby="pricing-heading"
          className="pt-8 pb-14 border-t border-white/[0.08]"
        >
          {premiumLoading ? (
            /* Skeleton while entitlements load: Prevents upsell flash! */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
              <div className="h-72 rounded-3xl bg-white/[0.03] border border-white/10 animate-pulse" />
              <div className="h-72 rounded-3xl bg-white/[0.03] border border-white/10 animate-pulse" />
            </div>
          ) : isPremium ? (
            /* Premium User Card */
            <div
              id="premium-status-section"
              className="max-w-xl mx-auto rounded-3xl p-6 sm:p-8 text-center bg-white/[0.03] shadow-xl"
              style={{
                border: `1px solid ${PREMIUM_HAIRLINE}`,
              }}
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/15 border border-indigo-400/30 text-indigo-300 mb-3">
                <Crown className="w-6 h-6 fill-current text-amber-300" />
              </div>
              <h2 className="font-hud text-xl sm:text-2xl font-bold text-white">
                You&apos;re Premium
              </h2>
              <p className="mt-1.5 text-xs text-white/60">
                {formattedDate
                  ? `Active until ${formattedDate}. All features are unlocked.`
                  : 'Your subscription is active. All features are unlocked.'}
              </p>

              <div className="mt-6 flex justify-center">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-indigo-400/30 bg-indigo-500/15 hover:bg-indigo-500/25 text-xs font-hud font-bold uppercase tracking-wider text-indigo-200 transition-colors shadow-sm"
                >
                  <span>Go to Settings</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            /* Free Users: Monthly & Yearly Cards */
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <h2
                  id="pricing-heading"
                  className="font-hud text-2xl font-bold text-white"
                >
                  Membership
                </h2>
                <p className="mt-1 text-xs text-white/50">
                  Straightforward plans. All features included.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-left">
                {/* Monthly Plan */}
                <div
                  className="rounded-3xl bg-white/[0.03] p-6 flex flex-col justify-between"
                  style={{ border: `1px solid ${PREMIUM_HAIRLINE}` }}
                >
                  <div>
                    <span className="font-hud text-xs font-bold uppercase text-white/60">
                      Monthly
                    </span>
                    <div className="mt-2 text-3xl font-hud font-bold text-white">
                      {monthlyFormatted}
                      <span className="text-xs font-mono font-normal text-white/40">
                        {' '}/ mo
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-white/50">
                      Billed monthly. Cancel anytime.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => startCheckout('monthly')}
                    disabled={isProcessing || !PAYMENTS_ENABLED}
                    className="mt-6 w-full py-2.5 rounded-xl text-xs font-hud font-bold uppercase tracking-wider bg-white/10 hover:bg-white/15 text-white transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <span>Subscribe Monthly</span>
                    )}
                  </button>
                </div>

                {/* Yearly Plan (Highlighted) */}
                <div
                  className="rounded-3xl bg-white/[0.04] p-6 flex flex-col justify-between relative overflow-hidden"
                  style={{
                    border: '1px solid rgba(129, 140, 248, 0.45)',
                    boxShadow: '0 0 30px rgba(99, 102, 241, 0.16)',
                  }}
                >
                  {/* Real Computed Saving Tag */}
                  {savingPercentage > 0 && (
                    <div className="absolute top-4 right-4 rounded-full bg-indigo-500/15 border border-indigo-400/30 px-2.5 py-0.5 text-[9px] font-mono font-bold text-indigo-300">
                      Save {savingPercentage}%
                    </div>
                  )}

                  <div>
                    <span className="font-hud text-xs font-bold uppercase text-indigo-300">
                      Yearly
                    </span>
                    <div className="mt-2 text-3xl font-hud font-bold text-white">
                      {yearlyFormatted}
                      <span className="text-xs font-mono font-normal text-white/40">
                        {' '}/ yr
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-white/50">
                      Billed annually. Best value.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => startCheckout('yearly')}
                    disabled={isProcessing || !PAYMENTS_ENABLED}
                    className="mt-6 w-full py-3 rounded-xl text-xs font-hud font-bold uppercase tracking-wider text-white transition-all cursor-pointer hover:opacity-95 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                    style={{
                      background: PREMIUM_BUTTON_GRADIENT,
                      boxShadow: '0 0 20px rgba(99,102,241,0.3)',
                    }}
                  >
                    {isProcessing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
                        <span>Subscribe Yearly</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 4: FAQ (Three 1-Sentence Collapsible Items)
            ═══════════════════════════════════════════════════════════════════ */}
        <section aria-labelledby="faq-heading" className="pt-6 pb-12 max-w-xl mx-auto">
          <h2
            id="faq-heading"
            className="font-hud text-lg font-bold text-white text-center mb-4"
          >
            FAQ
          </h2>

          <div className="space-y-2 text-left">
            {[
              {
                q: 'What happens when my subscription ends?',
                a: 'When your paid period ends, your account returns to the free tier and your data stays intact.',
              },
              {
                q: 'How do I cancel?',
                a: 'You can cancel renewal anytime in one click under Settings > Plan without any cancellation fee.',
              },
              {
                q: 'Can I request a refund?',
                a: '[owner to fill]',
              },
            ].map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between p-3.5 text-left text-xs font-hud font-bold text-white hover:text-indigo-300 transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-white/40 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-3.5 pb-3.5 text-xs text-white/60 leading-relaxed border-t border-white/[0.04] pt-2">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* ═══════════════════════════════════════════════════════════════════
          MOBILE STICKY BOTTOM BAR (Free Users Only, Hidden When Pricing Visible)
          ═══════════════════════════════════════════════════════════════════ */}
      {!isPremium && !premiumLoading && !isPricingVisible && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-3 bg-[#08090E]/90 backdrop-blur-lg border-t border-white/10 lg:hidden pb-safe">
          <button
            type="button"
            onClick={handleScrollToPricing}
            className="w-full py-3 rounded-xl font-hud font-bold text-xs uppercase tracking-wider text-white shadow-lg cursor-pointer flex items-center justify-center gap-2"
            style={{
              background: PREMIUM_BUTTON_GRADIENT,
              boxShadow: '0 0 20px rgba(99,102,241,0.4)',
            }}
          >
            <span>Get Premium</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
