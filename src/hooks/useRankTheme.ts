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
  tier: 'Bronze', // nominal tier label (unused for styling)
  accent: '#FFFFFF',
  glow: 'rgba(255, 255, 255, 0.25)',
  border: 'rgba(255, 255, 255, 0.12)',
  surface: '#0F1117',
  bg: '#08090C',
  base: '#08090C',
  cardTexture: 'none',
  icon: 'Star',
  accentRgb: '255, 255, 255',
  accentHover: '#E2E8F0',
  surfaceHigh: 'rgba(255, 255, 255, 0.08)',
  gradient: 'linear-gradient(135deg, #FFFFFF 0%, #E2E8F0 50%, #94A3B8 100%)',
  badgeBg: 'rgba(255, 255, 255, 0.08)',
  textAccent: '#FFFFFF',
};

export function useRankTheme(): {
  theme: RankThemePalette;
  userRank: RankTier;
  totalRP: number;
} {
  const { user } = useAuth();
  const { sessions } = useStudy();

  const totalRP = useMemo(() => {
    return Number((user as any)?.season_rp ?? user?.seasonRp ?? (user as any)?.rp ?? 0);
  }, [(user as any)?.season_rp, user?.seasonRp, (user as any)?.rp]);

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
