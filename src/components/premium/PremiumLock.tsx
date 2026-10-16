'use client';

import React from 'react';
import { Lock, Sparkles } from 'lucide-react';
import { PREMIUM_FEATURES, PremiumFeatureKey } from '../../lib/premium';
import { usePremium } from '../../context/PremiumContext';

interface PremiumLockProps {
  featureKey?: PremiumFeatureKey | string;
  featureName?: string;
  description?: string;
  className?: string;
}

export function PremiumLock({
  featureKey,
  featureName,
  description,
  className = '',
}: PremiumLockProps) {
  const { openPremiumModal, loading } = usePremium();

  // While loading, do not show locked states yet to avoid flicker
  if (loading) {
    return (
      <div
        className={`w-full p-6 sm:p-8 rounded-2xl bg-[var(--surface)] border border-[var(--border)] animate-pulse flex flex-col items-center justify-center min-h-[180px] ${className}`}
      >
        <div className="w-10 h-10 rounded-full bg-[var(--surface-2)] mb-3" />
        <div className="w-32 h-4 rounded-md bg-[var(--surface-2)] mb-2" />
        <div className="w-48 h-3 rounded-md bg-[var(--surface-2)] mb-4" />
        <div className="w-24 h-8 rounded-xl bg-[var(--surface-2)]" />
      </div>
    );
  }

  const feature = featureKey && featureKey in PREMIUM_FEATURES
    ? PREMIUM_FEATURES[featureKey as PremiumFeatureKey]
    : undefined;

  const displayName = featureName || feature?.name || 'Premium Feature';
  const displayDescription = description || feature?.description || 'Unlock this feature with study.io Premium.';

  return (
    <div
      className={`relative w-full p-6 sm:p-8 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-center flex flex-col items-center justify-center overflow-hidden shadow-card transition-all duration-200 ${className}`}
    >
      {/* Decorative subtle background aura */}
      <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-[var(--accent-soft)] blur-2xl pointer-events-none opacity-40" />

      {/* Lock Icon */}
      <div className="w-11 h-11 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)] mb-3.5 shadow-sm">
        <Lock className="w-5 h-5" />
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold text-[var(--text)] tracking-tight">
        {displayName}
      </h3>

      {/* One line of description */}
      <p className="text-xs text-[var(--text-dim)] mt-1.5 max-w-sm truncate leading-relaxed">
        {displayDescription}
      </p>

      {/* Action Button */}
      <button
        type="button"
        id={`see-premium-${featureKey || 'lock'}`}
        onClick={openPremiumModal}
        className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--accent)] text-[var(--accent-contrast)] hover:opacity-90 active:scale-[0.98] transition-all duration-150 inline-flex items-center gap-1.5 shadow-sm"
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span>See Premium</span>
      </button>
    </div>
  );
}
