'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { RANK_TIERS, RankTierConfig, getRankTier } from './rankedSystem';

export const DEV_PREVIEW_RP_KEY = 'studyio_dev_preview_rp';
export const DEV_PREVIEW_RP_EVENT = 'studyio-dev-preview-rp-change';

/**
 * Check if the application is currently running in a non-production development environment.
 */
export function isDevMode(): boolean {
  return process.env.NODE_ENV !== 'production';
}

/**
 * Read the simulated preview RP override from localStorage.
 * Returns null if not in development or no override is active.
 */
export function getDevPreviewRp(): number | null {
  if (typeof window === 'undefined' || !isDevMode()) return null;
  try {
    const raw = localStorage.getItem(DEV_PREVIEW_RP_KEY);
    if (raw === null || raw === '') return null;
    const num = Number(raw);
    return isNaN(num) ? null : Math.max(0, Math.round(num));
  } catch {
    return null;
  }
}

/**
 * Set a simulated preview RP override and notify all listening components.
 */
export function setDevPreviewRp(rp: number): void {
  if (typeof window === 'undefined' || !isDevMode()) return;
  try {
    const safeRp = Math.max(0, Math.round(rp));
    localStorage.setItem(DEV_PREVIEW_RP_KEY, String(safeRp));
    window.dispatchEvent(new CustomEvent(DEV_PREVIEW_RP_EVENT, { detail: safeRp }));
  } catch (err) {
    console.warn('[DevRankPreview] Failed to store simulated RP:', err);
  }
}

/**
 * Clear the simulated preview RP override and restore live database data.
 */
export function clearDevPreviewRp(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(DEV_PREVIEW_RP_KEY);
    window.dispatchEvent(new CustomEvent(DEV_PREVIEW_RP_EVENT, { detail: null }));
  } catch (err) {
    console.warn('[DevRankPreview] Failed to clear simulated RP:', err);
  }
}

/**
 * Calculates a representative RP for a given rank tier index (0 - 22).
 * Places the simulated progress cleanly at ~40% through the tier's bracket.
 */
export function getSimulatedRpForTierIndex(targetIdx: number): number {
  const safeIdx = Math.max(0, Math.min(RANK_TIERS.length - 1, targetIdx));
  const cfg = RANK_TIERS[safeIdx];
  if (cfg.tier === 'Grandmaster') {
    return 42500;
  }
  const spread = cfg.maxRP - cfg.minRP;
  return cfg.minRP + Math.round(spread * 0.4);
}

/**
 * Finds the tier index (0 - 22) for a given RP value.
 */
export function getTierIndexFromRp(rp: number): number {
  const safeRp = Math.max(0, Math.round(rp || 0));
  for (let i = RANK_TIERS.length - 1; i >= 0; i--) {
    if (safeRp >= RANK_TIERS[i].minRP) {
      return i;
    }
  }
  return 0;
}

/**
 * React hook to observe and manipulate simulated rank preview state live.
 */
export function useDevRankPreview() {
  const [previewRp, setPreviewRpState] = useState<number | null>(() => getDevPreviewRp());

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleSync = (e: Event) => {
      const custom = e as CustomEvent;
      if (custom.detail !== undefined) {
        setPreviewRpState(custom.detail);
      } else {
        setPreviewRpState(getDevPreviewRp());
      }
    };

    window.addEventListener(DEV_PREVIEW_RP_EVENT, handleSync);
    window.addEventListener('storage', handleSync);

    // Initial check on mount
    setPreviewRpState(getDevPreviewRp());

    return () => {
      window.removeEventListener(DEV_PREVIEW_RP_EVENT, handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const isPreviewActive = previewRp !== null && isDevMode();

  const currentTierIndex = useMemo(() => {
    if (previewRp === null) return 0;
    return getTierIndexFromRp(previewRp);
  }, [previewRp]);

  const currentTierConfig = useMemo((): RankTierConfig => {
    return RANK_TIERS[currentTierIndex] || RANK_TIERS[0];
  }, [currentTierIndex]);

  const setTierByIndex = useCallback((idx: number) => {
    const rp = getSimulatedRpForTierIndex(idx);
    setDevPreviewRp(rp);
  }, []);

  return {
    previewRp,
    isPreviewActive,
    currentTierIndex,
    currentTierConfig,
    setPreviewRp: setDevPreviewRp,
    clearPreviewRp: clearDevPreviewRp,
    setTierByIndex,
  };
}

