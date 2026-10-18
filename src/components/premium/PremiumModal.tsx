'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  X,
  Sparkles,
  Palette,
  BarChart3,
  Crown,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Check,
} from 'lucide-react';
import { usePremium } from '../../context/PremiumContext';
import { useRazorpayCheckout } from '../../hooks/useRazorpayCheckout';
import {
  PREMIUM_GOLD_GRADIENT,
  PREMIUM_GOLD_BORDER,
} from '../../lib/premium';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PremiumModal({ isOpen, onClose }: PremiumModalProps) {
  const shouldReduceMotion = useReducedMotion();
  const { isPremium, premiumUntil } = usePremium();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');

  const {
    plans,
    loadingPlans,
    isProcessing,
    checkoutSuccess,
    startCheckout,
    setCheckoutSuccess,
  } = useRazorpayCheckout();

  // Reset success state when reopening modal
  useEffect(() => {
    if (isOpen) {
      setCheckoutSuccess(false);
    }
  }, [isOpen, setCheckoutSuccess]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isProcessing) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isProcessing]);

  const formattedDate = premiumUntil
    ? new Date(premiumUntil).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  const monthlyPrice = plans?.monthly?.formattedAmount || '₹499';
  const yearlyPrice = plans?.yearly?.formattedAmount || '₹4,999';

  const handlePayment = () => {
    startCheckout(selectedPlan, () => {
      // Keep modal open momentarily to celebrate, then auto-close
      setTimeout(() => {
        onClose();
      }, 2500);
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="premium-modal-title"
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={
              shouldReduceMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.96, y: 16 }
            }
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={
              shouldReduceMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.96, y: 16 }
            }
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative w-full max-w-[480px] bg-[var(--surface)] border border-[var(--border)] rounded-t-[28px] sm:rounded-[24px] shadow-2xl p-6 sm:p-7 overflow-hidden flex flex-col pb-8 sm:pb-7 max-h-[90vh] overflow-y-auto"
          >
            {/* Mobile sheet drag handle */}
            <div className="w-10 h-1 bg-[var(--border-strong)] rounded-full mx-auto mb-4 sm:hidden" />

            {/* Close button */}
            <button
              type="button"
              id="premium-modal-close"
              onClick={onClose}
              disabled={isProcessing}
              className="absolute top-5 right-5 p-2 rounded-xl text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
              aria-label="Close premium modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header Badge & Title */}
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-[#1A1405] shadow-md"
                style={{ background: PREMIUM_GOLD_GRADIENT }}
              >
                <Crown className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h2
                  id="premium-modal-title"
                  className="text-xl font-bold tracking-tight text-[var(--text)]"
                >
                  study.io Premium
                </h2>
                <p className="text-xs text-[var(--text-dim)]">
                  Unlock advanced analytics, custom themes &amp; flair
                </p>
              </div>
            </div>

            {/* Success celebratory banner */}
            {checkoutSuccess ? (
              <div className="my-6 p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-[var(--text)]">
                  Payment Successful!
                </h3>
                <p className="text-xs text-[var(--text-dim)] mt-1">
                  Your account is upgraded to study.io Premium.
                </p>
              </div>
            ) : isPremium ? (
              /* Already Premium Banner */
              <div className="my-4 p-3.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-[#E6C15A] font-semibold">
                  <Crown className="w-4 h-4 fill-current" />
                  <span>You have study.io Premium</span>
                </div>
                {formattedDate && (
                  <span className="text-[var(--text-dim)]">
                    Active until {formattedDate}
                  </span>
                )}
              </div>
            ) : (
              <>
                {/* Benefits List */}
                <div className="my-4 space-y-2.5">
                  <div className="flex items-start gap-3 p-2.5 rounded-xl bg-[var(--surface-2)]/60 border border-[var(--border)]">
                    <div className="p-1.5 rounded-lg bg-[var(--surface)] text-[#E6C15A] shrink-0 border border-[var(--border)]">
                      <Palette className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-[var(--text)]">
                        Premium Themes &amp; Custom Flair
                      </h3>
                      <p className="text-[11px] text-[var(--text-dim)] leading-relaxed">
                        Exclusive Gold Leaf, Crimson themes, and glowing scholar badges.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-2.5 rounded-xl bg-[var(--surface-2)]/60 border border-[var(--border)]">
                    <div className="p-1.5 rounded-lg bg-[var(--surface)] text-[#E6C15A] shrink-0 border border-[var(--border)]">
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-[var(--text)]">
                        Deep Analytics &amp; Weekly Insights
                      </h3>
                      <p className="text-[11px] text-[var(--text-dim)] leading-relaxed">
                        Weekly performance reports, subject progress breakdown, and historical date tracking.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Plan Selection Cards */}
                <div className="grid grid-cols-2 gap-3 my-3">
                  {/* Monthly Plan */}
                  <button
                    type="button"
                    onClick={() => setSelectedPlan('monthly')}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative ${
                      selectedPlan === 'monthly'
                        ? 'bg-[var(--surface-2)] border-[#E6C15A] shadow-md ring-1 ring-[#E6C15A]/40'
                        : 'bg-[var(--surface-2)]/40 border-[var(--border)] hover:border-[var(--border-strong)]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-hud font-bold tracking-wider uppercase text-[var(--text-dim)]">
                        Monthly
                      </span>
                      {selectedPlan === 'monthly' && (
                        <div className="w-4 h-4 rounded-full bg-[#E6C15A] text-[#1A1405] flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <div className="text-lg font-hud font-extrabold text-[var(--text)]">
                      {monthlyPrice}
                    </div>
                    <div className="text-[10px] text-[var(--text-dim)] mt-0.5">
                      Billed monthly
                    </div>
                  </button>

                  {/* Yearly Plan */}
                  <button
                    type="button"
                    onClick={() => setSelectedPlan('yearly')}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                      selectedPlan === 'yearly'
                        ? 'bg-[var(--surface-2)] border-[#E6C15A] shadow-md ring-1 ring-[#E6C15A]/40'
                        : 'bg-[var(--surface-2)]/40 border-[var(--border)] hover:border-[var(--border-strong)]'
                    }`}
                  >
                    <div className="absolute top-2 right-2 text-[8px] font-hud uppercase tracking-widest font-extrabold px-1.5 py-0.5 rounded-full bg-[#E6C15A]/15 text-[#E6C15A] border border-[#E6C15A]/30">
                      Best Value
                    </div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-hud font-bold tracking-wider uppercase text-[#E6C15A]">
                        Yearly
                      </span>
                    </div>
                    <div className="text-lg font-hud font-extrabold text-[var(--text)]">
                      {yearlyPrice}
                    </div>
                    <div className="text-[10px] text-[var(--text-dim)] mt-0.5">
                      Billed annually
                    </div>
                  </button>
                </div>
              </>
            )}

            {/* CTA Buttons */}
            <div className="mt-3 pt-3 border-t border-[var(--border)]">
              {isPremium ? (
                <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[var(--surface-2)] text-[#E6C15A] font-semibold text-xs border border-[var(--border)] select-none">
                  <Crown className="w-4 h-4 fill-current" />
                  <span>Premium Active{formattedDate ? ` • Until ${formattedDate}` : ''}</span>
                </div>
              ) : !checkoutSuccess ? (
                <div>
                  <button
                    type="button"
                    id="continue-to-payment-btn"
                    onClick={handlePayment}
                    disabled={isProcessing || loadingPlans}
                    className="w-full py-3.5 px-4 rounded-xl font-hud font-bold text-xs uppercase tracking-wider text-[#1A1405] transition-all cursor-pointer shadow-lg hover:brightness-105 active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ background: PREMIUM_GOLD_GRADIENT }}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Initializing Checkout...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Continue to payment</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                  <p className="text-[11px] text-[var(--text-dim)] text-center mt-2.5">
                    Secured by Razorpay • Instant activation • Cancel anytime
                  </p>
                </div>
              ) : null}

              {/* Showcase Link */}
              <div className="mt-3 text-center">
                <Link
                  href="/premium"
                  onClick={onClose}
                  className="inline-flex items-center gap-1.5 text-xs text-[#E6C15A] hover:underline font-hud font-semibold tracking-wider transition-colors cursor-pointer"
                >
                  <span>See full benefits breakdown</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
