'use client';

import { useMemo, useEffect, useState } from 'react';
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
  
  // Dev-only tier override
  const devTierOverride = null;

  const totalSeconds = useMemo(() => {
    return (sessions || []).reduce(
      (sum, s) => sum + Number(s.durationSeconds ?? (s as any).duration_seconds ?? (s as any).duration ?? 0),
      0
    );
  }, [sessions]);

  const totalRP = useMemo(() => {
    return Number((user as any)?.season_rp ?? user?.seasonRp ?? (user as any)?.rp ?? 0);
  }, [(user as any)?.season_rp, user?.seasonRp, (user as any)?.rp]);

  const userRank = useMemo(() => {
    return getRankFromRp(totalRP);
  }, [totalRP]);

  const theme = useMemo(() => {
    
    return getRankTheme(userRank.tier);
  }, [userRank.tier, devTierOverride]);

  // Inject CSS variables to documentElement for global tier reactive styles
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    // Enable crossfade transition for tier changes (badges/crests/backgrounds)
    root.style.transition = 'background-color 0.35s ease, border-color 0.35s ease, color 0.35s ease, box-shadow 0.35s ease';
    document.body.style.transition = 'background-color 0.35s ease, border-color 0.35s ease';

    // Inject CSS variables to documentElement for global tier reactive styles (RESTRICTED TO BADGES/CRESTS ONLY)
    
    // We only set the --tier-* variables here so the main app background remains static.
    // Keep legacy variables for backwards compatibility
    root.style.setProperty('--tier-accent', theme.accent);
    root.style.setProperty('--tier-glow', theme.glow);
    root.style.setProperty('--tier-border', theme.border);
    root.style.setProperty('--tier-accent-rgb', theme.accentRgb || '255,255,255');
    root.style.setProperty('--tier-accent-hover', theme.accentHover || theme.accent);
    root.style.setProperty('--tier-gradient', theme.gradient || 'none');
    root.style.setProperty('--tier-badge-bg', theme.badgeBg || 'transparent');
    root.style.setProperty('--tier-text-accent', theme.textAccent || theme.accent);

    root.setAttribute('data-rank-tier', theme.tier.toLowerCase());
  }, [theme]);

  return {
    theme,
    userRank,
    totalRP,
  };
}
