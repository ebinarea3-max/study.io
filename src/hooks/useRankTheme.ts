'use client';

import { useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useStudy } from '../context/StudyContext';
import { getRankFromRp, RankTier } from '../lib/ranks';
import { getRankTheme, RankThemePalette } from '../lib/rankTheme';

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

  const rankPalette = useMemo(() => {
    return getRankTheme(userRank.tier);
  }, [userRank.tier]);

  // Coordinate tier-accent variables with theme selection
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    const syncThemeColors = () => {
      let currentTheme = 'rank';
      try {
        currentTheme = root.dataset.theme || localStorage.getItem('studyio-theme') || 'rank';
      } catch {
        currentTheme = 'rank';
      }

      // ALWAYS set --tier-accent and tier variables from user's rank
      root.style.setProperty('--tier-accent', rankPalette.accent);
      root.style.setProperty('--tier-glow', rankPalette.glow);
      root.style.setProperty('--tier-border', rankPalette.border);
      root.style.setProperty('--tier-accent-rgb', rankPalette.accentRgb || '255, 255, 255');
      root.style.setProperty('--tier-accent-hover', rankPalette.accentHover || rankPalette.accent);
      root.style.setProperty('--tier-gradient', rankPalette.gradient || 'none');
      root.style.setProperty('--tier-badge-bg', rankPalette.badgeBg || 'rgba(255, 255, 255, 0.08)');
      root.style.setProperty('--tier-text-accent', rankPalette.textAccent || rankPalette.accent);

      if (currentTheme === 'rank') {
        // Default "rank" theme: --accent follows tier
        root.style.setProperty('--accent', rankPalette.accent);
        root.style.setProperty('--glow', rankPalette.glow);
        root.style.setProperty('--accent-soft', `rgba(${rankPalette.accentRgb || '255, 255, 255'}, 0.12)`);
        root.style.setProperty('--accent-contrast', '#08090C');
      } else {
        // Other themes: remove inline overrides so theme's own CSS variables apply
        root.style.removeProperty('--accent');
        root.style.removeProperty('--glow');
        root.style.removeProperty('--accent-soft');
        root.style.removeProperty('--accent-contrast');
      }
    };

    syncThemeColors();

    const handleThemeChange = () => {
      syncThemeColors();
    };

    window.addEventListener('studyio-theme-change', handleThemeChange);
    return () => {
      window.removeEventListener('studyio-theme-change', handleThemeChange);
    };
  }, [rankPalette]);

  const activeTheme: RankThemePalette = useMemo(() => ({
    tier: userRank.tier,
    accent: 'var(--accent)',
    glow: 'var(--glow)',
    border: 'var(--border)',
    surface: 'var(--surface)',
    bg: 'var(--bg)',
    base: 'var(--bg)',
    cardTexture: 'none',
    icon: rankPalette.icon,
    accentRgb: rankPalette.accentRgb,
    accentHover: rankPalette.accentHover,
    surfaceHigh: 'var(--surface-2)',
    gradient: rankPalette.gradient,
    badgeBg: rankPalette.badgeBg,
    textAccent: rankPalette.textAccent,
  }), [userRank.tier, rankPalette]);

  return {
    theme: activeTheme,
    userRank,
    totalRP,
  };
}
