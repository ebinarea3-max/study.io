'use client';

import { useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useStudy } from '../context/StudyContext';
import { getRankTier, RankTierDetails } from '../lib/rankedSystem';
import { getRankTheme, RankThemePalette } from '../lib/rankTheme';

export function useRankTheme(): {
  theme: RankThemePalette;
  userRank: RankTierDetails;
  totalRP: number;
} {
  const { user } = useAuth();
  const { sessions } = useStudy();

  const totalSeconds = useMemo(() => {
    return (sessions || []).reduce(
      (sum, s) => sum + Number(s.durationSeconds ?? (s as any).duration_seconds ?? (s as any).duration ?? 0),
      0
    );
  }, [sessions]);

  const totalRP = useMemo(() => {
    const focusRP = Math.floor(totalSeconds / 60) * 10;
    const profileRP = Number((user as any)?.rp ?? user?.seasonRp ?? 0);
    return Math.max(focusRP, profileRP);
  }, [totalSeconds, (user as any)?.rp, user?.seasonRp]);

  const userRank = useMemo(() => {
    return getRankTier(totalRP);
  }, [totalRP]);

  const theme = useMemo(() => {
    return getRankTheme(userRank.tier);
  }, [userRank.tier]);

  // Inject CSS variables to documentElement for global tier reactive styles
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    root.style.setProperty('--tier-accent', theme.accent);
    root.style.setProperty('--tier-accent-rgb', theme.accentRgb);
    root.style.setProperty('--tier-accent-hover', theme.accentHover);
    root.style.setProperty('--tier-glow', theme.glow);
    root.style.setProperty('--tier-border', theme.border);
    root.style.setProperty('--tier-surface', theme.surface);
    root.style.setProperty('--tier-surface-high', theme.surfaceHigh);
    root.style.setProperty('--tier-base', theme.base);
    root.style.setProperty('--tier-gradient', theme.gradient);
    root.style.setProperty('--tier-badge-bg', theme.badgeBg);
    root.style.setProperty('--tier-text-accent', theme.textAccent);
    root.setAttribute('data-rank-tier', theme.tier.toLowerCase());
  }, [theme]);

  return {
    theme,
    userRank,
    totalRP,
  };
}
