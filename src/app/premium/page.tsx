'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  ArrowRight,
  Check,
  ChevronDown,
  Shield,
  Palette,
  BarChart3,
  Crown,
  Settings,
  ArrowLeft,
  Lock,
  Target,
  Flame,
  TrendingUp,
} from 'lucide-react';
import { useReducedMotion } from 'framer-motion';
import { Logo } from '../../components/Logo';
import { useAuth } from '../../context/AuthContext';
import { usePremium } from '../../context/PremiumContext';
import { useRankTheme } from '../../hooks/useRankTheme';
import { RankCrestBadge } from '../../components/common/RankCrestBadge';
import { PAYMENTS_ENABLED } from '../../config/billing';
import {
  PREMIUM_GOLD_GRADIENT,
  PREMIUM_GOLD_BORDER,
  PREMIUM_GOLD_GLOW,
} from '../../lib/premium';

import { ComparisonTable } from '../../components/premium/showcase/ComparisonTable';
import { useRazorpayCheckout } from '../../hooks/useRazorpayCheckout';

export default function PremiumPage() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const { user, isAuthenticated } = useAuth();
  const { isPremium, premiumUntil } = usePremium();
  const { userRank } = useRankTheme();

  const [showFullComparison, setShowFullComparison] = useState(false);

  // Dynamic Razorpay checkout & live plan rates
  const {
    plans,
    isProcessing,
    startCheckout,
  } = useRazorpayCheckout();

  const monthlyFormatted = plans?.monthly?.formattedAmount || '₹499';
  const yearlyFormatted = plans?.yearly?.formattedAmount || '₹4,999';
  const monthlyAmount = plans?.monthly?.amount ? plans.monthly.amount / 100 : 499;
  const yearlyAmount = plans?.yearly?.amount ? plans.yearly.amount / 100 : 4999;
  const savingPercentage = Math.max(
    1,
    Math.round((1 - yearlyAmount / (monthlyAmount * 12)) * 100)
  );



  // Scroll to pricing section helper
  const handleScrollToPricing = () => {
    const el = document.getElementById(isPremium ? 'premium-status-section' : 'pricing');
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
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] selection:bg-[#E6C15A]/30 selection:text-[#F6EFD9] relative overflow-x-hidden">
      {/* Subtle Background Grid */}
      <div className="fixed inset-0 pointer-events-none bg-dot-grid opacity-60 z-0" />

      {/* Top Header / Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[var(--bg)]/90 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 text-[var(--text-dim)] hover:text-[var(--text)] transition-colors text-xs font-hud font-bold tracking-wider group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <div className="flex items-center gap-2">
              <Logo className="w-6 h-6" />
              <span className="hidden sm:inline">BACK TO DASHBOARD</span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {isPremium ? (
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-hud font-bold tracking-wider uppercase border text-[#1A1405]"
                style={{
                  background: PREMIUM_GOLD_GRADIENT,
                  borderColor: PREMIUM_GOLD_BORDER,
                  boxShadow: `0 0 12px ${PREMIUM_GOLD_GLOW}`,
                }}
              >
                <Crown className="w-3.5 h-3.5 fill-current" />
                <span>PREMIUM ACTIVE</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={handleScrollToPricing}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-hud font-bold tracking-wider uppercase text-[#1A1405] hover:opacity-95 active:scale-95 transition-all shadow-md cursor-pointer"
                style={{ background: PREMIUM_GOLD_GRADIENT }}
              >
                <Crown className="w-3.5 h-3.5 fill-current" />
                <span>UPGRADE</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* SECTION 1: HERO */}
        <section
          aria-labelledby="hero-heading"
          className="w-full py-10 sm:py-14 max-w-6xl mx-auto px-4 sm:px-6 flex flex-col items-center text-center relative"
        >
          {/* Ambient Gold Glow */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 sm:w-96 h-72 sm:h-96 rounded-full blur-[120px] pointer-events-none opacity-25"
            style={{ backgroundColor: '#E6C15A' }}
          />

          {/* User's Floating Rank Crest */}
          <div className="relative mb-6">
            <div
              className={`transition-transform duration-300 ${
                !shouldReduceMotion ? 'animate-crest-float' : ''
              }`}
              style={{
                animationDuration: '6s',
                animationIterationCount: 'infinite',
                animationTimingFunction: 'ease-in-out',
              }}
            >
              <RankCrestBadge
                tier={userRank.tier}
                division={userRank.division}
                size={96}
                className="drop-shadow-2xl"
              />
            </div>
            {/* Soft gold glow beneath crest */}
            <div
              className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-24 h-6 rounded-full blur-xl opacity-40 pointer-events-none"
              style={{ backgroundColor: '#E6C15A' }}
            />
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-[var(--border)] text-xs font-hud font-bold tracking-wider uppercase text-[#E6C15A] mb-4 shadow-sm backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5" />
            <span>study.io Premium</span>
          </div>

          {/* Headline & Subline */}
          <h1
            id="hero-heading"
            className="text-3xl sm:text-5xl md:text-6xl font-hud font-black text-[var(--text)] tracking-tight leading-[1.1] max-w-3xl"
          >
            Make every session count.
          </h1>

          <p className="text-sm sm:text-base text-[var(--text-dim)] mt-4 mb-8 max-w-xl leading-relaxed">
            Insights, goals, report cards, premium themes and flair, built for people who take studying seriously.
          </p>

          {/* Primary Action Button (with subtle 8s sheen sweep) */}
          <div className="relative">
            <button
              type="button"
              onClick={handleScrollToPricing}
              className="relative overflow-hidden px-7 py-3 rounded-2xl text-[#1A1405] font-hud font-extrabold text-xs sm:text-sm tracking-wider uppercase transition-all hover:scale-105 active:scale-95 shadow-xl cursor-pointer flex items-center gap-2"
              style={{
                background: PREMIUM_GOLD_GRADIENT,
                boxShadow: `0 0 24px ${PREMIUM_GOLD_GLOW}`,
              }}
            >
              <span>{isPremium ? 'VIEW YOUR BENEFITS' : 'SEE PRICING'}</span>
              <ArrowRight className="w-4 h-4" />

              {/* Subtle Sheen Sweep (every 8s) */}
              <div
                className="absolute inset-0 pointer-events-none button-sheen-sweep w-1/2 h-full -skew-x-12"
                style={{
                  background:
                    'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.7) 50%, transparent 100%)',
                }}
              />
            </button>
          </div>
        </section>

        {/* SECTION 2: STREAMLINED PREMIUM UPGRADES (BENTO SHOWCASE) */}
        <section
          aria-labelledby="features-heading"
          className="w-full py-12 sm:py-16 border-t border-[var(--border)] bg-gradient-to-b from-black/[0.25] via-transparent to-black/[0.15]"
        >
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-xl mx-auto mb-10 sm:mb-12">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E6C15A]/10 border border-[#E6C15A]/25 text-[11px] font-hud uppercase tracking-widest text-[#E6C15A] font-bold mb-3 shadow-sm">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Everything You Get</span>
              </div>
              <h2
                id="features-heading"
                className="text-2xl sm:text-4xl font-hud font-black tracking-tight text-[var(--text)]"
              >
                Four powerful upgrades. Zero fluff.
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-dim)] mt-2.5 leading-relaxed">
                Designed specifically for serious scholars who want deep focus analytics, handcrafted aesthetics, and prestige.
              </p>
            </div>

            {/* 4 Core Bento Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Feature 1: Deep Focus Analytics */}
              <div className="relative overflow-hidden rounded-3xl p-6 sm:p-7 bg-[var(--surface)] border border-[var(--border)] hover:border-[#E6C15A]/40 transition-all shadow-lg flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-2xl bg-[#E6C15A]/15 border border-[#E6C15A]/30 text-[#E6C15A] flex items-center justify-center shadow-[0_0_15px_rgba(230,193,90,0.2)]">
                      <BarChart3 className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-hud uppercase tracking-widest font-extrabold px-2.5 py-0.5 rounded-full bg-white/[0.05] text-[var(--text-dim)] border border-[var(--border)]">
                      Heatmaps &amp; Trends
                    </span>
                  </div>
                  <h3 className="font-hud font-bold text-lg sm:text-xl text-[var(--text)] mb-1.5">
                    Deep Focus Analytics
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--text-dim)] leading-relaxed">
                    12-week activity heatmap, peak productivity hour breakdown, and automated week-over-week performance reports.
                  </p>
                </div>

                {/* Micro Visual Graphic */}
                <div className="mt-6 p-4 rounded-2xl bg-[var(--surface-2)]/80 border border-[var(--border)]/70">
                  <div className="flex items-end justify-between h-14 px-2 gap-2">
                    {[
                      { day: 'M', h: '45%' },
                      { day: 'T', h: '65%' },
                      { day: 'W', h: '55%' },
                      { day: 'T', h: '75%' },
                      { day: 'F', h: '100%', peak: true },
                      { day: 'S', h: '60%' },
                      { day: 'S', h: '40%' },
                    ].map((bar) => (
                      <div key={bar.day} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                        <div
                          className={`w-full rounded-md transition-all ${
                            bar.peak
                              ? 'bg-gradient-to-t from-[#B8892B] to-[#F5E6A8] shadow-[0_0_10px_rgba(230,193,90,0.4)]'
                              : 'bg-white/10 group-hover:bg-white/15'
                          }`}
                          style={{ height: bar.h }}
                        />
                        <span className={`text-[10px] font-mono ${bar.peak ? 'text-[#E6C15A] font-bold' : 'text-[var(--text-dim)]'}`}>
                          {bar.day}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-[var(--border)]/50 flex items-center justify-between text-[11px] text-[var(--text-dim)]">
                    <span className="flex items-center gap-1 text-[#E6C15A] font-semibold">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>Peak: Friday (6h 15m)</span>
                    </span>
                    <span className="font-mono text-[var(--text)]">+18% vs last week</span>
                  </div>
                </div>
              </div>

              {/* Feature 2: Handcrafted Themes */}
              <div className="relative overflow-hidden rounded-3xl p-6 sm:p-7 bg-[var(--surface)] border border-[var(--border)] hover:border-[#E6C15A]/40 transition-all shadow-lg flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-2xl bg-[#E6C15A]/15 border border-[#E6C15A]/30 text-[#E6C15A] flex items-center justify-center shadow-[0_0_15px_rgba(230,193,90,0.2)]">
                      <Palette className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-hud uppercase tracking-widest font-extrabold px-2.5 py-0.5 rounded-full bg-white/[0.05] text-[var(--text-dim)] border border-[var(--border)]">
                      Exclusive Themes
                    </span>
                  </div>
                  <h3 className="font-hud font-bold text-lg sm:text-xl text-[var(--text)] mb-1.5">
                    Gold Leaf &amp; Crimson Aesthetics
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--text-dim)] leading-relaxed">
                    Handcrafted luxury color palettes tailored with warm gold tones and deep ruby velvets to eliminate eye fatigue.
                  </p>
                </div>

                {/* Micro Visual Graphic */}
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-[#14120B] border border-[#E6C15A]/40 relative overflow-hidden shadow-inner">
                    <div className="w-4 h-4 rounded-full bg-[#E6C15A] mb-2 shadow-[0_0_8px_rgba(230,193,90,0.6)]" />
                    <div className="font-hud font-bold text-xs text-[#F5E6A8]">Gold Leaf</div>
                    <div className="text-[10px] text-[#E6C15A]/70 mt-0.5">Warm amber &amp; gold luxury</div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#170C0F] border border-rose-500/40 relative overflow-hidden shadow-inner">
                    <div className="w-4 h-4 rounded-full bg-rose-500 mb-2 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                    <div className="font-hud font-bold text-xs text-rose-200">Crimson Velvet</div>
                    <div className="text-[10px] text-rose-400/70 mt-0.5">Deep wine focus tone</div>
                  </div>
                </div>
              </div>

              {/* Feature 3: Scholar Crown & Prestige */}
              <div className="relative overflow-hidden rounded-3xl p-6 sm:p-7 bg-[var(--surface)] border border-[var(--border)] hover:border-[#E6C15A]/40 transition-all shadow-lg flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-2xl bg-[#E6C15A]/15 border border-[#E6C15A]/30 text-[#E6C15A] flex items-center justify-center shadow-[0_0_15px_rgba(230,193,90,0.2)]">
                      <Crown className="w-5 h-5 fill-current" />
                    </div>
                    <span className="text-[10px] font-hud uppercase tracking-widest font-extrabold px-2.5 py-0.5 rounded-full bg-white/[0.05] text-[var(--text-dim)] border border-[var(--border)]">
                      Prestige Flair
                    </span>
                  </div>
                  <h3 className="font-hud font-bold text-lg sm:text-xl text-[var(--text)] mb-1.5">
                    Scholar Crown &amp; Avatar Frames
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--text-dim)] leading-relaxed">
                    Stand out across public study rooms and season rankings with an official gold crown badge and glowing profile frames.
                  </p>
                </div>

                {/* Micro Visual Graphic */}
                <div className="mt-6 p-3.5 rounded-2xl bg-[var(--surface-2)]/80 border border-[var(--border)]/70 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#B8892B] to-[#F5E6A8] p-[2px] shadow-[0_0_12px_rgba(230,193,90,0.3)]">
                        <div className="w-full h-full rounded-full bg-[var(--surface)] flex items-center justify-center text-xs font-bold font-hud text-[#E6C15A]">
                          SCH
                        </div>
                      </div>
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#E6C15A] text-[#1A1405] flex items-center justify-center shadow-md">
                        <Crown className="w-3 h-3 fill-current" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[var(--text)]">Verified Scholar</span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-hud font-bold uppercase bg-[#E6C15A]/15 text-[#E6C15A] border border-[#E6C15A]/30">
                          PRO
                        </span>
                      </div>
                      <div className="text-[10px] text-[var(--text-dim)]">Gold Aura Frame Active</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-hud font-bold text-[#E6C15A] uppercase tracking-wider">
                    Tier I
                  </span>
                </div>
              </div>

              {/* Feature 4: Focus Goals & Story Recaps */}
              <div className="relative overflow-hidden rounded-3xl p-6 sm:p-7 bg-[var(--surface)] border border-[var(--border)] hover:border-[#E6C15A]/40 transition-all shadow-lg flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-2xl bg-[#E6C15A]/15 border border-[#E6C15A]/30 text-[#E6C15A] flex items-center justify-center shadow-[0_0_15px_rgba(230,193,90,0.2)]">
                      <Target className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-hud uppercase tracking-widest font-extrabold px-2.5 py-0.5 rounded-full bg-white/[0.05] text-[var(--text-dim)] border border-[var(--border)]">
                      Streaks &amp; Exports
                    </span>
                  </div>
                  <h3 className="font-hud font-bold text-lg sm:text-xl text-[var(--text)] mb-1.5">
                    Goal Streaks &amp; Season Cards
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--text-dim)] leading-relaxed">
                    Set daily focus quotas, track unbroken streak counters, and export 1080×1920 high-res recap cards for social stories.
                  </p>
                </div>

                {/* Micro Visual Graphic */}
                <div className="mt-6 p-3.5 rounded-2xl bg-[var(--surface-2)]/80 border border-[var(--border)]/70 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-8 h-8 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400 flex items-center justify-center">
                      <Flame className="w-4 h-4 fill-current" />
                    </div>
                    <div>
                      <div className="font-bold text-[var(--text)]">14-Day Goal Streak</div>
                      <div className="text-[10px] text-[var(--text-dim)]">Daily quota: 4.0 hrs/day</div>
                    </div>
                  </div>
                  <div className="text-[10px] font-hud font-extrabold text-[#E6C15A] uppercase px-2.5 py-1 rounded-lg bg-[#E6C15A]/10 border border-[#E6C15A]/30">
                    Story Export
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Feature Checklist */}
            <div className="mt-10 pt-8 border-t border-[var(--border)]/60 text-center">
              <span className="text-[10px] font-hud uppercase tracking-widest text-[var(--text-dim)] font-bold block mb-4">
                Everything Included In Your Membership
              </span>
              <div className="flex flex-wrap justify-center items-center gap-2.5 max-w-3xl mx-auto">
                {[
                  '12-Week Focus Heatmap',
                  'Peak Focus Hours Telemetry',
                  'Gold Leaf & Crimson Themes',
                  'Scholar Crown Badge',
                  'Glowing Avatar Frames',
                  'Daily Goal Streak Tracking',
                  'Automated Weekly Reports',
                  '1080×1920 Story Cards',
                  'Unlimited History Access',
                ].map((feat) => (
                  <span
                    key={feat}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.03] border border-[var(--border)] text-xs font-medium text-[var(--text)] hover:border-[#E6C15A]/40 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5 text-[#E6C15A]" />
                    <span>{feat}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Optional Collapsible Side-by-Side Comparison */}
            <div className="mt-8 text-center">
              <button
                type="button"
                id="toggle-comparison-table-btn"
                onClick={() => setShowFullComparison(!showFullComparison)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-hud font-bold tracking-wider text-[var(--text-dim)] hover:text-[var(--text)] bg-[var(--surface-2)] border border-[var(--border)] hover:border-[var(--border-strong)] transition-all cursor-pointer"
              >
                <span>{showFullComparison ? 'Hide detailed feature table' : 'Compare Free vs Premium side-by-side'}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    showFullComparison ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {showFullComparison && (
                <div className="mt-6 text-left animate-in fade-in duration-300">
                  <ComparisonTable />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* SECTIONS 4 & 5: PRICING & FAQ (For Free Users) OR SECTION 6: YOU'RE PREMIUM (For Premium Users) */}
        {isPremium ? (
          /* SECTION 6: YOU'RE PREMIUM (Replaces Pricing & FAQ for active premium users) */
          <section
            id="premium-status-section"
            aria-labelledby="status-heading"
            className="w-full py-10 sm:py-14 border-t border-[var(--border)] bg-[#E6C15A]/[0.03]"
          >
            <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
              <div
                className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 border"
                style={{
                  background: PREMIUM_GOLD_GRADIENT,
                  borderColor: PREMIUM_GOLD_BORDER,
                  boxShadow: `0 0 20px ${PREMIUM_GOLD_GLOW}`,
                }}
              >
                <Crown className="w-7 h-7 text-[#1A1405] fill-current" />
              </div>

              <h2
                id="status-heading"
                className="text-2xl sm:text-4xl font-hud font-extrabold text-[var(--text)] tracking-tight"
              >
                You&apos;re Premium
              </h2>

              <p className="text-xs sm:text-sm text-[var(--text-dim)] mt-2 mb-8">
                {formattedDate
                  ? `Your subscription is active until ${formattedDate}. All handcrafted themes and analytics are unlocked.`
                  : 'Your subscription is active. All handcrafted themes and analytics are unlocked.'}
              </p>

              {/* Feature Shortcuts Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                {/* Shortcut 1: Themes */}
                <Link
                  href="/dashboard"
                  className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[#E6C15A]/40 transition-all block group"
                >
                  <div className="w-10 h-10 rounded-xl bg-[var(--surface-2)] flex items-center justify-center text-[#E6C15A] mb-3 group-hover:scale-110 transition-transform">
                    <Palette className="w-5 h-5" />
                  </div>
                  <h3 className="font-hud font-bold text-sm text-[var(--text)]">
                    Theme Picker
                  </h3>
                  <p className="text-xs text-[var(--text-dim)] mt-1">
                    Equip Gold Leaf or Crimson from settings.
                  </p>
                </Link>

                {/* Shortcut 2: Insights */}
                <Link
                  href="/dashboard"
                  className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[#E6C15A]/40 transition-all block group"
                >
                  <div className="w-10 h-10 rounded-xl bg-[var(--surface-2)] flex items-center justify-center text-[#E6C15A] mb-3 group-hover:scale-110 transition-transform">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <h3 className="font-hud font-bold text-sm text-[var(--text)]">
                    Study Insights
                  </h3>
                  <p className="text-xs text-[var(--text-dim)] mt-1">
                    Inspect your 12-week heatmap on the Stats tab.
                  </p>
                </Link>

                {/* Shortcut 3: Settings */}
                <Link
                  href="/dashboard"
                  className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[#E6C15A]/40 transition-all block group"
                >
                  <div className="w-10 h-10 rounded-xl bg-[var(--surface-2)] flex items-center justify-center text-[#E6C15A] mb-3 group-hover:scale-110 transition-transform">
                    <Settings className="w-5 h-5" />
                  </div>
                  <h3 className="font-hud font-bold text-sm text-[var(--text)]">
                    Preferences
                  </h3>
                  <p className="text-xs text-[var(--text-dim)] mt-1">
                    Manage your scholar profile and audio telemetry.
                  </p>
                </Link>
              </div>
            </div>
          </section>
        ) : (
          /* SECTIONS 4 & 5: PRICING & FAQ (For Free Users) */
          <>
            {/* SECTION 4: PRICING */}
            <section
              id="pricing"
              aria-labelledby="pricing-heading"
              className="w-full py-10 sm:py-14 border-t border-[var(--border)] bg-black/[0.15]"
            >
              <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
                <span className="text-[10px] font-hud uppercase tracking-widest text-[#E6C15A] font-bold block mb-1">
                  Simple Billing
                </span>
                <h2
                  id="pricing-heading"
                  className="text-2xl sm:text-3xl font-hud font-extrabold tracking-tight text-[var(--text)]"
                >
                  Membership Pricing
                </h2>
                <p className="text-xs sm:text-sm text-[var(--text-dim)] mt-2 mb-8 max-w-md mx-auto">
                  Invest in your study ritual with straightforward pricing and no hidden costs.
                </p>

                {!PAYMENTS_ENABLED ? (
                  /* Coming Soon State when PAYMENTS_ENABLED is false (no prices, disabled button) */
                  <div className="max-w-md mx-auto p-6 sm:p-8 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-xl flex flex-col items-center">
                    <div className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-[var(--border)] flex items-center justify-center text-[var(--text-dim)] mb-4">
                      <Lock className="w-6 h-6" />
                    </div>
                    <h3 className="font-hud font-extrabold text-lg text-[var(--text)] uppercase tracking-wide">
                      Premium isn&apos;t on sale yet
                    </h3>
                    <p className="text-xs text-[var(--text-dim)] mt-2 mb-6 leading-relaxed">
                      We are polishing the remaining features before opening public subscriptions. No payment processing is enabled at this time.
                    </p>
                    <button
                      type="button"
                      disabled
                      className="w-full py-3 px-4 rounded-xl font-hud font-bold text-xs uppercase tracking-wider bg-[var(--surface-2)] text-[var(--text-dim)] border border-[var(--border)] cursor-not-allowed select-none flex items-center justify-center gap-2 opacity-70"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Coming soon</span>
                    </button>
                  </div>
                ) : (
                  /* Active Pricing Cards when PAYMENTS_ENABLED is true */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl mx-auto text-left">
                    {/* Monthly */}
                    <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] flex flex-col justify-between">
                      <div>
                        <div className="font-hud font-bold text-xs uppercase tracking-wider text-[var(--text-dim)]">
                          Monthly
                        </div>
                        <div className="text-3xl font-hud font-extrabold text-[var(--text)] mt-2">
                          {monthlyFormatted}
                          <span className="text-xs font-mono text-[var(--text-dim)] font-normal"> / month</span>
                        </div>
                        <p className="text-xs text-[var(--text-dim)] mt-2">
                          Full access billed monthly. Cancel anytime.
                        </p>
                      </div>
                      <button
                        type="button"
                        id="subscribe-monthly-btn"
                        onClick={() => startCheckout('monthly')}
                        disabled={isProcessing}
                        className="mt-6 w-full py-2.5 rounded-xl font-hud font-bold text-xs uppercase tracking-wider bg-white/10 hover:bg-white/15 text-[var(--text)] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isProcessing ? 'Processing...' : 'Subscribe Monthly'}
                      </button>
                    </div>

                    {/* Yearly */}
                    <div
                      className="p-6 rounded-3xl bg-[var(--surface)] border flex flex-col justify-between relative overflow-hidden"
                      style={{ borderColor: PREMIUM_GOLD_BORDER }}
                    >
                      <div className="absolute top-3 right-3 text-[9px] font-hud uppercase tracking-widest font-extrabold px-2 py-0.5 rounded-full bg-[#E6C15A]/15 text-[#E6C15A] border border-[#E6C15A]/30">
                        Save {savingPercentage}%
                      </div>
                      <div>
                        <div className="font-hud font-bold text-xs uppercase tracking-wider text-[#E6C15A]">
                          Yearly
                        </div>
                        <div className="text-3xl font-hud font-extrabold text-[var(--text)] mt-2">
                          {yearlyFormatted}
                          <span className="text-xs font-mono text-[var(--text-dim)] font-normal"> / year</span>
                        </div>
                        <p className="text-xs text-[var(--text-dim)] mt-2">
                          Billed annually. Best overall value.
                        </p>
                      </div>
                      <button
                        type="button"
                        id="subscribe-yearly-btn"
                        onClick={() => startCheckout('yearly')}
                        disabled={isProcessing}
                        className="mt-6 w-full py-2.5 rounded-xl font-hud font-bold text-xs uppercase tracking-wider text-[#1A1405] transition-all cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ background: PREMIUM_GOLD_GRADIENT }}
                      >
                        {isProcessing ? 'Processing...' : 'Subscribe Yearly'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* SECTION 5: FAQ */}
            <section
              aria-labelledby="faq-heading"
              className="w-full py-10 sm:py-14 border-t border-[var(--border)]"
            >
              <div className="max-w-3xl mx-auto px-4 sm:px-6">
                <div className="text-center mb-8 sm:mb-12">
                  <span className="text-[10px] font-hud uppercase tracking-widest text-[#E6C15A] font-bold block mb-1">
                    Questions &amp; Answers
                  </span>
                  <h2
                    id="faq-heading"
                    className="text-2xl sm:text-3xl font-hud font-extrabold tracking-tight text-[var(--text)]"
                  >
                    Frequently Asked Questions
                  </h2>
                </div>

                <div className="space-y-4">
                  {/* Q1 */}
                  <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
                    <h3 className="font-hud font-bold text-sm text-[var(--text)]">
                      What happens when my subscription ends?
                    </h3>
                    <p className="text-xs text-[var(--text-dim)] mt-2 leading-relaxed">
                      Everything you created is kept. Your study logs, streak records, tasks, and rank standings remain completely intact. Premium-exclusive themes fall back to your rank colors in memory, and Insights reverts to the locked preview.
                    </p>
                  </div>

                  {/* Q2 */}
                  <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
                    <h3 className="font-hud font-bold text-sm text-[var(--text)]">
                      Can I cancel anytime?
                    </h3>
                    <p className="text-xs text-[var(--text-dim)] mt-2 leading-relaxed">
                      Yes. Once payments are active, you will be able to cancel anytime with one click in your settings. You retain full access until the end of your billing cycle.
                    </p>
                  </div>

                  {/* Q3 */}
                  <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
                    <h3 className="font-hud font-bold text-sm text-[var(--text)]">
                      What is the refund policy?
                    </h3>
                    <p className="text-xs text-[var(--text-dim)] mt-2 leading-relaxed font-mono">
                      [Refund policy placeholder: owner must fill in]
                    </p>
                  </div>

                  {/* Q4 */}
                  <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
                    <h3 className="font-hud font-bold text-sm text-[var(--text)]">
                      How is my study data handled?
                    </h3>
                    <p className="text-xs text-[var(--text-dim)] mt-2 leading-relaxed font-mono">
                      [Data policy placeholder: owner must confirm]
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-[var(--border)] py-8 bg-black/20 text-center text-xs text-[var(--text-dim)]">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Logo className="w-5 h-5" />
            <span className="font-hud font-bold tracking-wider text-[var(--text)]">study.io</span>
            <span>&bull; Built for deep focus</span>
          </div>
          <div className="text-[11px] font-mono">
            Honest productivity &bull; No artificial scarcity &bull; No hidden fees
          </div>
        </div>
      </footer>
    </div>
  );
}
