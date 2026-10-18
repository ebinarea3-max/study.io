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

import { DemoThemesTile } from '../../components/premium/showcase/DemoThemesTile';
import { DemoInsightsTile } from '../../components/premium/showcase/DemoInsightsTile';
import { DemoWeeklyReportTile } from '../../components/premium/showcase/DemoWeeklyReportTile';
import { DemoGoalsTile } from '../../components/premium/showcase/DemoGoalsTile';
import { DemoSeasonCardTile } from '../../components/premium/showcase/DemoSeasonCardTile';
import { DemoFlairTile } from '../../components/premium/showcase/DemoFlairTile';
import { ComparisonTable } from '../../components/premium/showcase/ComparisonTable';
import { useRazorpayCheckout } from '../../hooks/useRazorpayCheckout';

export default function PremiumPage() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const { user, isAuthenticated } = useAuth();
  const { isPremium, premiumUntil } = usePremium();
  const { userRank } = useRankTheme();

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

  // Tiles reveal once on scroll (IntersectionObserver, fade and rise 12px, 60ms stagger)
  const [tilesRevealed, setTilesRevealed] = useState(false);
  const tilesGridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (shouldReduceMotion) {
      setTilesRevealed(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTilesRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (tilesGridRef.current) {
      observer.observe(tilesGridRef.current);
    }

    return () => observer.disconnect();
  }, [shouldReduceMotion]);

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

        {/* SECTION 2: SEE IT IN ACTION (6 Interactive Demo Tiles) */}
        <section
          aria-labelledby="demo-heading"
          className="w-full py-10 sm:py-14 border-t border-[var(--border)] bg-black/[0.15]"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
              <span className="text-[10px] font-hud uppercase tracking-widest text-[#E6C15A] font-bold block mb-1">
                Interactive Previews
              </span>
              <h2
                id="demo-heading"
                className="text-2xl sm:text-3xl font-hud font-extrabold tracking-tight text-[var(--text)]"
              >
                See it in action
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-dim)] mt-2">
                Test-drive the premium toolset using live sample telemetry.
              </p>
            </div>

            {/* 6 Tiles Grid (Responsive: 1 col on mobile 390px, 2 col on tablet, 3 col on desktop) */}
            <div
              ref={tilesGridRef}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
            >
              {[
                { component: <DemoThemesTile />, key: 'themes' },
                { component: <DemoInsightsTile />, key: 'insights' },
                { component: <DemoWeeklyReportTile />, key: 'weekly' },
                { component: <DemoGoalsTile />, key: 'goals' },
                { component: <DemoSeasonCardTile />, key: 'season' },
                { component: <DemoFlairTile />, key: 'flair' },
              ].map((item, idx) => {
                const isRevealed = tilesRevealed || shouldReduceMotion;
                return (
                  <div
                    key={item.key}
                    className="h-full"
                    style={{
                      opacity: isRevealed ? 1 : 0,
                      transform: isRevealed
                        ? 'translateY(0px)'
                        : shouldReduceMotion
                        ? 'none'
                        : 'translateY(12px)',
                      transition: shouldReduceMotion
                        ? 'none'
                        : `opacity 0.45s ease-out ${idx * 60}ms, transform 0.45s ease-out ${idx * 60}ms`,
                    }}
                  >
                    {item.component}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* SECTION 3: COMPARISON TABLE */}
        <section
          aria-labelledby="comparison-heading"
          className="w-full py-10 sm:py-14 border-t border-[var(--border)]"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
              <span className="text-[10px] font-hud uppercase tracking-widest text-[#E6C15A] font-bold block mb-1">
                Transparency
              </span>
              <h2
                id="comparison-heading"
                className="text-2xl sm:text-3xl font-hud font-extrabold tracking-tight text-[var(--text)]"
              >
                Compare Free vs Premium
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-dim)] mt-2">
                Honest breakdown of everything included in study.io. All existing free tools stay free forever.
              </p>
            </div>

            <ComparisonTable />
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
