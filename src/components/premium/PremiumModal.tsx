'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, Sparkles, Palette, BarChart3, Crown, Lock, ArrowRight } from 'lucide-react';
import { PAYMENTS_ENABLED } from '../../config/billing';
import { usePremium } from '../../context/PremiumContext';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PremiumModal({ isOpen, onClose }: PremiumModalProps) {
  const shouldReduceMotion = useReducedMotion();
  const { isPremium, premiumUntil } = usePremium();

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const formattedDate = premiumUntil
    ? new Date(premiumUntil).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="premium-modal-title"
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/65 backdrop-blur-sm"
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
            className="relative w-full max-w-[460px] bg-[var(--surface)] border border-[var(--border)] rounded-t-[28px] sm:rounded-[24px] shadow-2xl p-6 sm:p-7 overflow-hidden flex flex-col pb-8 sm:pb-7"
          >
            {/* Mobile sheet drag handle */}
            <div className="w-10 h-1 bg-[var(--border-strong)] rounded-full mx-auto mb-4 sm:hidden" />

            {/* Close button */}
            <button
              type="button"
              id="premium-modal-close"
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-xl text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
              aria-label="Close premium modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header Badge & Title */}
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-[var(--accent-soft)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)]">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2
                  id="premium-modal-title"
                  className="text-xl font-bold tracking-tight text-[var(--text)]"
                >
                  study.io Premium
                </h2>
                <p className="text-xs text-[var(--text-dim)]">
                  Elevate your daily study ritual
                </p>
              </div>
            </div>

            {/* Current Status banner if user is already premium */}
            {isPremium && (
              <div className="my-4 p-3.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-[var(--accent)] font-semibold">
                  <Crown className="w-4 h-4 fill-current" />
                  <span>You have study.io Premium</span>
                </div>
                {formattedDate && (
                  <span className="text-[var(--text-dim)]">
                    Active until {formattedDate}
                  </span>
                )}
              </div>
            )}

            {/* Benefits List (matches ONLY existing features: premium themes, Insights, Premium badge) */}
            <div className="my-5 space-y-3.5">
              {/* 1. Premium Themes */}
              <div className="flex items-start gap-3.5 p-3 rounded-xl bg-[var(--surface-2)]/60 border border-[var(--border)]">
                <div className="p-2 rounded-lg bg-[var(--surface)] text-[var(--accent)] shrink-0 border border-[var(--border)]">
                  <Palette className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text)]">
                    Premium Themes
                  </h3>
                  <p className="text-xs text-[var(--text-dim)] mt-0.5 leading-relaxed">
                    Access handcrafted themes including Gold Leaf and Crimson.
                  </p>
                </div>
              </div>

              {/* 2. Insights */}
              <div className="flex items-start gap-3.5 p-3 rounded-xl bg-[var(--surface-2)]/60 border border-[var(--border)]">
                <div className="p-2 rounded-lg bg-[var(--surface)] text-[var(--accent)] shrink-0 border border-[var(--border)]">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text)]">
                    Insights
                  </h3>
                  <p className="text-xs text-[var(--text-dim)] mt-0.5 leading-relaxed">
                    Deep analytics, peak focus hours, and 12-week activity patterns.
                  </p>
                </div>
              </div>

              {/* 3. Premium Badge */}
              <div className="flex items-start gap-3.5 p-3 rounded-xl bg-[var(--surface-2)]/60 border border-[var(--border)]">
                <div className="p-2 rounded-lg bg-[var(--surface)] text-[var(--accent)] shrink-0 border border-[var(--border)]">
                  <Crown className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text)]">
                    Premium Badge
                  </h3>
                  <p className="text-xs text-[var(--text-dim)] mt-0.5 leading-relaxed">
                    Distinctive crown badge displayed beside your scholar profile.
                  </p>
                </div>
              </div>
            </div>

            {/* Purchase CTA / Active state */}
            <div className="mt-2 pt-3 border-t border-[var(--border)]">
              {isPremium ? (
                <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[var(--surface-2)] text-[var(--accent)] font-semibold text-xs border border-[var(--border)] select-none">
                  <Crown className="w-4 h-4 fill-current" />
                  <span>Premium Active{formattedDate ? ` • Until ${formattedDate}` : ''}</span>
                </div>
              ) : !PAYMENTS_ENABLED ? (
                <div>
                  <button
                    type="button"
                    disabled
                    id="premium-cta-disabled"
                    className="w-full py-3 px-4 rounded-xl font-medium text-sm bg-[var(--surface-2)] text-[var(--text-faint)] border border-[var(--border)] cursor-not-allowed flex items-center justify-center gap-2 select-none"
                  >
                    <Lock className="w-4 h-4 text-[var(--text-faint)]" />
                    <span>Coming soon</span>
                  </button>
                  <p className="text-[11px] text-[var(--text-dim)] text-center mt-2.5">
                    Premium isn&apos;t available to buy yet.
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  id="premium-cta-active"
                  className="w-full py-3 px-4 rounded-xl font-medium text-sm bg-[var(--accent)] text-[var(--accent-contrast)] hover:opacity-95 transition-opacity"
                >
                  Upgrade to Premium
                </button>
              )}

              {/* Showcase Link */}
              <div className="mt-3.5 text-center">
                <Link
                  href="/premium"
                  onClick={onClose}
                  className="inline-flex items-center gap-1.5 text-xs text-[#E6C15A] hover:underline font-hud font-semibold tracking-wider transition-colors cursor-pointer"
                >
                  <span>See everything in Premium</span>
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
