'use client';

import { useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useStudy } from '../context/StudyContext';
import { getRankFromRp, RankTier } from '../lib/ranks';
import { RankThemePalette } from '../lib/rankTheme';

// ─── Permanent Fixed UI Palette ───────────────────────────────────────────────
// This palette is rank-independent and will NEVER change regardless of the
// user's current rank. All UI elements always use these fixed values.
const PERMANENT_THEME: RankThemePalette = {
  tier: 'Platinum',
  accent: '#10B981',
  glow: 'rgba(16, 185, 129, 0.35)',
  border: 'rgba(16, 185, 129, 0.2)',
  surface: '#0F1117',
  bg: '#08090C',
  base: '#08090C',
  cardTexture: 'none',
  icon: 'Sparkles',
  accentRgb: '16, 185, 129',
  accentHover: '#34D399',
  surfaceHigh: 'rgba(16, 185, 129, 0.08)',
  gradient: 'linear-gradient(135deg, #10B981 0%, #34D399 50%, #059669 100%)',
  badgeBg: 'rgba(16, 185, 129, 0.12)',
  textAccent: '#34D399',
};

export function useRankTheme(): {
  theme: RankThemePalette;
  userRank: RankTier;
  totalRP: number;
} {
  const { user } = useAuth();
  const { sessions } = useStudy();

  const totalRP = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    const currentMonthSeconds = (sessions || [])
      .filter((s: any) => {
        const sessionDate = new Date(s.startTime || s.started_at || s.created_at || s.date).getTime();
        return sessionDate >= startOfMonth;
      })
      .reduce((total: number, s: any) => total + (s.duration || s.durationSeconds || s.duration_seconds || 0), 0);

    const carryoverRp = (user as any)?.carryover_rp || (user as any)?.carryoverRp || 0;
    return carryoverRp + Math.floor(currentMonthSeconds / 60);
  }, [(user as any)?.carryover_rp, (user as any)?.carryoverRp, sessions]);

  const userRank = useMemo(() => {
    return getRankFromRp(totalRP);
  }, [totalRP]);

  // Always inject the permanent fixed CSS variables — never driven by rank tier
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    root.style.setProperty('--tier-accent', PERMANENT_THEME.accent);
    root.style.setProperty('--tier-glow', PERMANENT_THEME.glow);
    root.style.setProperty('--tier-border', PERMANENT_THEME.border);
    root.style.setProperty('--tier-accent-rgb', PERMANENT_THEME.accentRgb);
    root.style.setProperty('--tier-accent-hover', PERMANENT_THEME.accentHover);
    root.style.setProperty('--tier-gradient', PERMANENT_THEME.gradient);
    root.style.setProperty('--tier-badge-bg', PERMANENT_THEME.badgeBg);
    root.style.setProperty('--tier-text-accent', PERMANENT_THEME.textAccent);

    // Remove dynamic rank tier attribute so no CSS selectors can target it
    root.removeAttribute('data-rank-tier');
  }, []); // empty deps — runs once, sets permanent values

  return {
    theme: PERMANENT_THEME, // always returns the same fixed palette
    userRank,
    totalRP,
  };
}
