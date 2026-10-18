'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  ArrowRight,
  Check,
  ChevronDown,
  ShieldCheck,
  Palette,
  BarChart3,
  Crown,
  Settings,
  ArrowLeft,
  Target,
  Flame,
  TrendingUp,
  Share2,
  Calendar,
  Lock,
  Loader2,
  HelpCircle,
} from 'lucide-react';
import { useReducedMotion } from 'framer-motion';
import { Logo } from '../../components/Logo';
import { useAuth } from '../../context/AuthContext';
import { usePremium } from '../../context/PremiumContext';
import { useRankTheme } from '../../hooks/useRankTheme';
import { RankCrestBadge } from '../../components/common/RankCrestBadge';
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

  // Scroll to section helpers
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
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] selection:bg-[#E6C15A]/30 selection:text-[#F6EFD9] relative overflow-x-hidden">
      {/* Background Lighting & Grid */}
      <div className="fixed inset-0 pointer-events-none bg-dot-grid opacity-50 z-0" />
      
      {/* Top Center Amber Mesh Glow */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[450px] rounded-full blur-[140px] pointer-events-none opacity-20 z-0"
        style={{ backgroundColor: '#E6C15A' }}
      />

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[var(--bg)]/85 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 text-[var(--text-dim)] hover:text-[var(--text)] transition-colors text-xs font-hud font-bold tracking-wider group cursor-pointer"
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
          className="w-full pt-12 pb-16 sm:pt-16 sm:pb-20 max-w-5xl mx-auto px-4 sm:px-6 flex flex-col items-center text-center relative"
        >
          {/* User's Floating Rank Crest */}
          <div className="relative mb-5">
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
                size={88}
                className="drop-shadow-2xl"
              />
            </div>
            {/* Soft gold glow beneath crest */}
            <div
              className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-20 h-5 rounded-full blur-xl opacity-50 pointer-events-none"
              style={{ backgroundColor: '#E6C15A' }}
            />
          </div>

          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#E6C15A]/15 to-[#B8892B]/10 border border-[#E6C15A]/30 text-xs font-hud font-bold tracking-widest uppercase text-[#F5E6A8] mb-4 shadow-[0_0_20px_rgba(230,193,90,0.12)] backdrop-blur-md">
            <Crown className="w-3.5 h-3.5 text-[#E6C15A] fill-current" />
            <span>study.io Premium</span>
          </div>

          {/* Headline */}
          <h1
            id="hero-heading"
            className="text-3xl sm:text-5xl md:text-6xl font-hud font-black text-[var(--text)] tracking-tight leading-[1.15] max-w-3xl"
          >
            Study with an unfair advantage.
          </h1>

          {/* Subtitle with exact value statement */}
          <p className="text-sm sm:text-base text-[var(--text-dim)] mt-4 mb-8 max-w-xl leading-relaxed">
            Unlock deep 12-week telemetry, handcrafted themes, daily focus goals, and verified scholar flair — designed for people who take learning seriously.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleScrollToPricing}
              className="w-full sm:w-auto relative overflow-hidden px-8 py-3.5 rounded-2xl text-[#1A1405] font-hud font-extrabold text-xs sm:text-sm tracking-wider uppercase transition-all hover:scale-105 active:scale-95 shadow-xl cursor-pointer flex items-center justify-center gap-2"
              style={{
                background: PREMIUM_GOLD_GRADIENT,
                boxShadow: `0 0 24px ${PREMIUM_GOLD_GLOW}`,
              }}
            >
              <span>{isPremium ? 'VIEW YOUR BENEFITS' : 'SEE PLANS & PRICING'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleScrollToFeatures}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl text-xs font-hud font-bold tracking-wider uppercase text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-white/[0.04] border border-[var(--border)] transition-all cursor-pointer"
            >
              Explore What&apos;s Included
            </button>
          </div>

          {/* Trust bullet row */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-[11px] text-[var(--text-dim)]">
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-[#E6C15A]" />
              <span>Instant Feature Activation</span>
            </span>
            <span className="text-[var(--border-strong)]">•</span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-[#E6C15A]" />
              <span>Cancel Anytime in Settings</span>
            </span>
            <span className="text-[var(--border-strong)]">•</span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-[#E6C15A]" />
              <span>Secured by Razorpay</span>
            </span>
          </div>
        </section>

        {/* SECTION 2: THE 6 REAL PREMIUM UPGRADES */}
        <section
          id="features"
          aria-labelledby="features-heading"
          className="w-full py-14 sm:py-20 border-t border-[var(--border)] bg-gradient-to-b from-black/[0.25] via-transparent to-black/[0.15]"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-14">
              <span className="text-[10px] font-hud uppercase tracking-widest text-[#E6C15A] font-bold block mb-1">
                Everything Included
              </span>
              <h2
                id="features-heading"
                className="text-2xl sm:text-4xl font-hud font-extrabold tracking-tight text-[var(--text)]"
              >
                Six powerful tools. Built for mastery.
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-dim)] mt-2.5 leading-relaxed">
                Here is the exact breakdown of every privilege unlocked with study.io Premium:
              </p>
            </div>

            {/* 6 Feature Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Feature 1: Handcrafted Themes */}
              <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] hover:border-[#E6C15A]/40 transition-all shadow-md flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-2xl bg-[#E6C15A]/15 border border-[#E6C15A]/30 text-[#E6C15A] flex items-center justify-center shadow-[0_0_15px_rgba(230,193,90,0.15)]">
                      <Palette className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-hud uppercase tracking-widest font-extrabold px-2.5 py-0.5 rounded-full bg-white/[0.04] text-[#E6C15A] border border-[#E6C15A]/25">
                      Aesthetics
                    </span>
                  </div>
                  <h3 className="font-hud font-bold text-base sm:text-lg text-[var(--text)] mb-2">
                    Gold Leaf &amp; Crimson Themes
                  </h3>
                  <p className="text-xs text-[var(--text-dim)] leading-relaxed">
                    Unlock exclusive handcrafted colorways with warm amber and deep ruby velvet tones, engineered to protect your eyes during long focus rituals.
                  </p>
                </div>

                {/* Swatch visual */}
                <div className="mt-5 grid grid-cols-2 gap-2.5">
                  <div className="p-2.5 rounded-xl bg-[#14120B] border border-[#E6C15A]/40 flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-full bg-[#E6C15A] shadow-[0_0_8px_rgba(230,193,90,0.6)]" />
                    <span className="text-[11px] font-hud font-bold text-[#F5E6A8]">Gold Leaf</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#170C0F] border border-rose-500/40 flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                    <span className="text-[11px] font-hud font-bold text-rose-200">Crimson</span>
                  </div>
                </div>
              </div>

              {/* Feature 2: Deep Study Insights */}
              <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] hover:border-[#E6C15A]/40 transition-all shadow-md flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-2xl bg-[#E6C15A]/15 border border-[#E6C15A]/30 text-[#E6C15A] flex items-center justify-center shadow-[0_0_15px_rgba(230,193,90,0.15)]">
                      <BarChart3 className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-hud uppercase tracking-widest font-extrabold px-2.5 py-0.5 rounded-full bg-white/[0.04] text-[#E6C15A] border border-[#E6C15A]/25">
                      Telemetry
                    </span>
                  </div>
                  <h3 className="font-hud font-bold text-base sm:text-lg text-[var(--text)] mb-2">
                    12-Week Study Heatmap
                  </h3>
                  <p className="text-xs text-[var(--text-dim)] leading-relaxed">
                    Inspect comprehensive study telemetry: your 12-week activity grid, peak focus hours of the day, and active weekday distributions.
                  </p>
                </div>

                {/* Heatmap visual */}
                <div className="mt-5 p-2.5 rounded-xl bg-[var(--surface-2)]/80 border border-[var(--border)] flex items-center justify-between text-[11px] text-[var(--text-dim)]">
                  <div className="flex items-center gap-1.5">
                    <div className="flex gap-1">
                      <div className="w-2.5 h-2.5 rounded-xs bg-[#E6C15A]/30" />
                      <div className="w-2.5 h-2.5 rounded-xs bg-[#E6C15A]/60" />
                      <div className="w-2.5 h-2.5 rounded-xs bg-[#E6C15A]" />
                    </div>
                    <span>84 Days Telemetry</span>
                  </div>
                  <span className="text-[#E6C15A] font-semibold">Peak: 6 PM – 9 PM</span>
                </div>
              </div>

              {/* Feature 3: Weekly Performance Reports */}
              <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] hover:border-[#E6C15A]/40 transition-all shadow-md flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-2xl bg-[#E6C15A]/15 border border-[#E6C15A]/30 text-[#E6C15A] flex items-center justify-center shadow-[0_0_15px_rgba(230,193,90,0.15)]">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-hud uppercase tracking-widest font-extrabold px-2.5 py-0.5 rounded-full bg-white/[0.04] text-[#E6C15A] border border-[#E6C15A]/25">
                      Reports
                    </span>
                  </div>
                  <h3 className="font-hud font-bold text-base sm:text-lg text-[var(--text)] mb-2">
                    Weekly Report Cards
                  </h3>
                  <p className="text-xs text-[var(--text-dim)] leading-relaxed">
                    Receive automated week-over-week performance reports, subject time breakdowns, active days counts, and longest session tracking.
                  </p>
                </div>

                {/* Metric visual */}
                <div className="mt-5 p-2.5 rounded-xl bg-[var(--surface-2)]/80 border border-[var(--border)] flex items-center justify-between text-[11px]">
                  <span className="text-emerald-400 font-semibold font-mono">+3h 40m vs last week</span>
                  <span className="text-[var(--text-dim)]">Top: Mathematics</span>
                </div>
              </div>

              {/* Feature 4: Daily Focus Goals & Streaks */}
              <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] hover:border-[#E6C15A]/40 transition-all shadow-md flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-2xl bg-[#E6C15A]/15 border border-[#E6C15A]/30 text-[#E6C15A] flex items-center justify-center shadow-[0_0_15px_rgba(230,193,90,0.15)]">
                      <Target className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-hud uppercase tracking-widest font-extrabold px-2.5 py-0.5 rounded-full bg-white/[0.04] text-[#E6C15A] border border-[#E6C15A]/25">
                      Goals
                    </span>
                  </div>
                  <h3 className="font-hud font-bold text-base sm:text-lg text-[var(--text)] mb-2">
                    Focus Goals &amp; Goal Streaks
                  </h3>
                  <p className="text-xs text-[var(--text-dim)] leading-relaxed">
                    Set daily minute quotas (from 30m to 8h), watch live progress rings inside the study timer, and build unbroken daily goal streaks.
                  </p>
                </div>

                {/* Streak visual */}
                <div className="mt-5 p-2.5 rounded-xl bg-[var(--surface-2)]/80 border border-[var(--border)] flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 text-orange-400 font-bold">
                    <Flame className="w-3.5 h-3.5 fill-current" />
                    <span>14-Day Goal Streak</span>
                  </span>
                  <span className="text-[var(--text-dim)]">4.0h Quota</span>
                </div>
              </div>

              {/* Feature 5: Scholar Crown & Avatar Flair */}
              <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] hover:border-[#E6C15A]/40 transition-all shadow-md flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-2xl bg-[#E6C15A]/15 border border-[#E6C15A]/30 text-[#E6C15A] flex items-center justify-center shadow-[0_0_15px_rgba(230,193,90,0.15)]">
                      <Crown className="w-5 h-5 fill-current" />
                    </div>
                    <span className="text-[10px] font-hud uppercase tracking-widest font-extrabold px-2.5 py-0.5 rounded-full bg-white/[0.04] text-[#E6C15A] border border-[#E6C15A]/25">
                      Prestige
                    </span>
                  </div>
                  <h3 className="font-hud font-bold text-base sm:text-lg text-[var(--text)] mb-2">
                    Scholar Crown &amp; Avatar Frames
                  </h3>
                  <p className="text-xs text-[var(--text-dim)] leading-relaxed">
                    Stand out in collaborative study rooms and leaderboard ladders with an exclusive Gold Crown mark and customizable Gold, Aurora, or Ember frames.
                  </p>
                </div>

                {/* Prestige visual */}
                <div className="mt-5 p-2.5 rounded-xl bg-[var(--surface-2)]/80 border border-[var(--border)] flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-[#E6C15A] text-[#1A1405] flex items-center justify-center font-bold text-[10px]">
                      👑
                    </div>
                    <span className="font-bold text-[var(--text)]">Verified Scholar</span>
                  </div>
                  <span className="text-[#E6C15A] font-hud font-bold">AURORA FRAME</span>
                </div>
              </div>

              {/* Feature 6: Season Story Cards */}
              <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] hover:border-[#E6C15A]/40 transition-all shadow-md flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-2xl bg-[#E6C15A]/15 border border-[#E6C15A]/30 text-[#E6C15A] flex items-center justify-center shadow-[0_0_15px_rgba(230,193,90,0.15)]">
                      <Share2 className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-hud uppercase tracking-widest font-extrabold px-2.5 py-0.5 rounded-full bg-white/[0.04] text-[#E6C15A] border border-[#E6C15A]/25">
                      Milestones
                    </span>
                  </div>
                  <h3 className="font-hud font-bold text-base sm:text-lg text-[var(--text)] mb-2">
                    1080×1920 Story Recap Cards
                  </h3>
                  <p className="text-xs text-[var(--text-dim)] leading-relaxed">
                    Export high-definition 1080×1920 seasonal milestone recap cards without watermarks or blur, ready to share on Instagram, WhatsApp, and socials.
                  </p>
                </div>

                {/* Export visual */}
                <div className="mt-5 p-2.5 rounded-xl bg-[var(--surface-2)]/80 border border-[var(--border)] flex items-center justify-between text-[11px]">
                  <span className="text-[#E6C15A] font-semibold">1080×1920 PNG Export</span>
                  <span className="text-emerald-400 font-bold">Unblurred HD</span>
                </div>
              </div>
            </div>

            {/* Quick Feature Checklist Bar */}
            <div className="mt-12 pt-8 border-t border-[var(--border)]/60 text-center">
              <span className="text-[10px] font-hud uppercase tracking-widest text-[var(--text-dim)] font-bold block mb-4">
                Full Summary of Included Privileges
              </span>
              <div className="flex flex-wrap justify-center items-center gap-2.5 max-w-4xl mx-auto">
                {[
                  '12-Week Focus Heatmap Grid',
                  'Peak Productivity Hours Telemetry',
                  'Gold Leaf & Crimson Themes',
                  'Verified Scholar Crown Badge',
                  'Gold, Aurora & Ember Avatar Frames',
                  'Custom Daily & Weekly Focus Goals',
                  'Consecutive Goal Streak Tracking',
                  'Automated Weekly Progress Reports',
                  '1080×1920 High-Res Story Cards',
                  'Zero Advertisements & Pure Focus',
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
          </div>
        </section>

        {/* SECTION 3: MEMBERSHIP PRICING */}
        <section
          id="pricing"
          aria-labelledby="pricing-heading"
          className="w-full py-16 sm:py-24 border-t border-[var(--border)] bg-gradient-to-b from-black/[0.3] to-transparent relative"
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <span className="text-[10px] font-hud uppercase tracking-widest text-[#E6C15A] font-bold block mb-1">
              Transparent Membership
            </span>
            <h2
              id="pricing-heading"
              className="text-2xl sm:text-4xl font-hud font-extrabold tracking-tight text-[var(--text)]"
            >
              Choose your plan. Elevate your study.
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-dim)] mt-2 mb-10 max-w-md mx-auto">
              Straightforward pricing with all 6 features included. No hidden tiers, no sudden upgrades.
            </p>

            {/* Pricing Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto text-left">
              {/* Monthly Plan */}
              <div className="p-7 rounded-3xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border-strong)] transition-all flex flex-col justify-between shadow-xl">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-hud font-bold text-xs uppercase tracking-wider text-[var(--text-dim)]">
                      Monthly
                    </span>
                    <span className="text-[10px] font-hud uppercase px-2 py-0.5 rounded-full bg-white/[0.05] text-[var(--text-dim)]">
                      Flexible
                    </span>
                  </div>
                  <div className="text-3xl sm:text-4xl font-hud font-extrabold text-[var(--text)] mt-2">
                    {monthlyFormatted}
                    <span className="text-xs font-mono text-[var(--text-dim)] font-normal"> / month</span>
                  </div>
                  <p className="text-xs text-[var(--text-dim)] mt-2">
                    Full access to all 6 premium features. Billed monthly, cancel anytime.
                  </p>

                  <ul className="mt-6 space-y-2.5 text-xs text-[var(--text-dim)] border-t border-[var(--border)]/70 pt-5">
                    <li className="flex items-center gap-2 text-[var(--text)]">
                      <Check className="w-4 h-4 text-[#E6C15A]" />
                      <span>All 6 Premium features included</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#E6C15A]" />
                      <span>Cancel anytime in 1 click</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#E6C15A]" />
                      <span>Instant account activation</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  id="subscribe-monthly-btn"
                  onClick={() => startCheckout('monthly')}
                  disabled={isProcessing}
                  className="mt-8 w-full py-3 rounded-xl font-hud font-bold text-xs uppercase tracking-wider bg-white/10 hover:bg-white/15 text-[var(--text)] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Initializing...</span>
                    </>
                  ) : (
                    <span>Subscribe Monthly</span>
                  )}
                </button>
              </div>

              {/* Yearly Plan (Featured) */}
              <div
                className="p-7 rounded-3xl bg-[var(--surface)] border flex flex-col justify-between relative overflow-hidden shadow-2xl"
                style={{
                  borderColor: PREMIUM_GOLD_BORDER,
                  boxShadow: `0 0 30px ${PREMIUM_GOLD_GLOW}`,
                }}
              >
                {/* Save Badge */}
                <div className="absolute top-4 right-4 text-[9px] font-hud uppercase tracking-widest font-extrabold px-2.5 py-1 rounded-full bg-[#E6C15A]/20 text-[#E6C15A] border border-[#E6C15A]/40 shadow-sm">
                  Save {savingPercentage}% • 2 Months Free
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-hud font-bold text-xs uppercase tracking-wider text-[#E6C15A]">
                      Yearly Plan
                    </span>
                  </div>
                  <div className="text-3xl sm:text-4xl font-hud font-extrabold text-[var(--text)] mt-2">
                    {yearlyFormatted}
                    <span className="text-xs font-mono text-[var(--text-dim)] font-normal"> / year</span>
                  </div>
                  <p className="text-xs text-[var(--text-dim)] mt-2">
                    Billed annually. Best value for dedicated scholars committed to their craft.
                  </p>

                  <ul className="mt-6 space-y-2.5 text-xs text-[var(--text-dim)] border-t border-[var(--border)]/70 pt-5">
                    <li className="flex items-center gap-2 text-[var(--text)] font-semibold">
                      <Check className="w-4 h-4 text-[#E6C15A]" />
                      <span>All 6 Premium features included</span>
                    </li>
                    <li className="flex items-center gap-2 text-[var(--text)]">
                      <Check className="w-4 h-4 text-[#E6C15A]" />
                      <span>Save {savingPercentage}% vs monthly billing</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#E6C15A]" />
                      <span>Cancel renewal anytime in Settings</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  id="subscribe-yearly-btn"
                  onClick={() => startCheckout('yearly')}
                  disabled={isProcessing}
                  className="mt-8 w-full py-3.5 rounded-xl font-hud font-bold text-xs uppercase tracking-wider text-[#1A1405] transition-all cursor-pointer shadow-lg hover:brightness-105 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ background: PREMIUM_GOLD_GRADIENT }}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Initializing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Subscribe Yearly</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Assurance footer */}
            <div className="mt-10 p-4 rounded-2xl bg-[var(--surface-2)]/60 border border-[var(--border)] max-w-xl mx-auto flex items-center justify-center gap-6 text-xs text-[var(--text-dim)]">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#E6C15A]" />
                <span>Encrypted Razorpay Checkout</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-[#E6C15A] fill-current" />
                <span>Instant Pro Status</span>
              </span>
            </div>

            {/* Collapsible Comparison Table Trigger */}
            <div className="mt-12 text-center">
              <button
                type="button"
                id="toggle-comparison-table-btn"
                onClick={() => setShowFullComparison(!showFullComparison)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-hud font-bold tracking-wider text-[var(--text-dim)] hover:text-[var(--text)] bg-[var(--surface-2)] border border-[var(--border)] hover:border-[var(--border-strong)] transition-all cursor-pointer shadow-sm"
              >
                <span>{showFullComparison ? 'Hide detailed feature breakdown' : 'Compare Free vs Premium side-by-side'}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    showFullComparison ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {showFullComparison && (
                <div className="mt-8 text-left animate-in fade-in duration-300">
                  <ComparisonTable />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* SECTION 4: FREQUENTLY ASKED QUESTIONS */}
        <section
          aria-labelledby="faq-heading"
          className="w-full py-14 sm:py-20 border-t border-[var(--border)] bg-black/[0.15]"
        >
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10 sm:mb-12">
              <span className="text-[10px] font-hud uppercase tracking-widest text-[#E6C15A] font-bold block mb-1">
                Got Questions?
              </span>
              <h2
                id="faq-heading"
                className="text-2xl sm:text-3xl font-hud font-extrabold tracking-tight text-[var(--text)]"
              >
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-3.5">
              {[
                {
                  q: 'Can I cancel my subscription anytime?',
                  a: 'Yes, absolutely. You can cancel at any time with a single click under Settings > Plan. You will retain full access to all premium features until the end of your paid billing period, and your card will never be charged again.',
                },
                {
                  q: 'Do the free study tools stay free forever?',
                  a: 'Yes, 100%. All core tools — precision focus timers, task checklists, community study rooms, and ranked monthly progression — are permanently free for all scholars.',
                },
                {
                  q: 'What payment methods are supported?',
                  a: 'We use Razorpay, which securely accepts credit and debit cards (Visa, Mastercard, RuPay, Amex), UPI mandates, and net banking.',
                },
                {
                  q: 'How do I access my premium features after purchasing?',
                  a: 'Your account is upgraded immediately upon verified payment. Your Gold Leaf and Crimson themes will be unlocked in Settings > Appearance, and your 12-week heatmap telemetry will become active on the Stats tab right away.',
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-left"
                >
                  <h3 className="font-hud font-bold text-sm text-[var(--text)] mb-2 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-[#E6C15A] shrink-0" />
                    <span>{item.q}</span>
                  </h3>
                  <p className="text-xs text-[var(--text-dim)] leading-relaxed pl-6">
                    {item.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 5: YOU'RE PREMIUM (Only visible if already active) */}
        {isPremium && (
          <section
            id="premium-status-section"
            aria-labelledby="status-heading"
            className="w-full py-12 sm:py-16 border-t border-[var(--border)] bg-[#E6C15A]/[0.03]"
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
                You&apos;re a Premium Scholar
              </h2>

              <p className="text-xs sm:text-sm text-[var(--text-dim)] mt-2 mb-8">
                {formattedDate
                  ? `Your subscription is active until ${formattedDate}. All 6 premium features are unlocked.`
                  : 'Your subscription is active. All 6 premium features are unlocked.'}
              </p>

              {/* Feature Shortcuts Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
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

                <Link
                  href="/dashboard"
                  className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[#E6C15A]/40 transition-all block group"
                >
                  <div className="w-10 h-10 rounded-xl bg-[var(--surface-2)] flex items-center justify-center text-[#E6C15A] mb-3 group-hover:scale-110 transition-transform">
                    <Settings className="w-5 h-5" />
                  </div>
                  <h3 className="font-hud font-bold text-sm text-[var(--text)]">
                    Manage Plan
                  </h3>
                  <p className="text-xs text-[var(--text-dim)] mt-1">
                    Check renewal status or cancel under Settings &gt; Plan.
                  </p>
                </Link>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
