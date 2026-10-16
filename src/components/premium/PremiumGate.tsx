'use client';

import React, { ReactNode } from 'react';
import { usePremium } from '../../context/PremiumContext';
import { PremiumLock } from './PremiumLock';
import { PremiumFeatureKey } from '../../lib/premium';

interface PremiumGateProps {
  feature: PremiumFeatureKey | string;
  children: ReactNode;
  fallback?: ReactNode;
  loadingFallback?: ReactNode;
}

export function PremiumGate({
  feature,
  children,
  fallback,
  loadingFallback,
}: PremiumGateProps) {
  const { isPremium, loading } = usePremium();

  // While loading, treat as free for gating but do not show locked states yet (avoid flicker)
  if (loading) {
    return (
      <>
        {loadingFallback ?? (
          <div className="w-full p-8 rounded-2xl bg-[var(--surface)] border border-[var(--border)] animate-pulse flex flex-col items-center justify-center min-h-[160px]" />
        )}
      </>
    );
  }

  // Premium user: grant access to content
  if (isPremium) {
    return <>{children}</>;
  }

  // Free user: show tasteful lock card or custom fallback
  return <>{fallback ?? <PremiumLock featureKey={feature} />}</>;
}
