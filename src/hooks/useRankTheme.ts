'use client';

import { useMemo, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useStudy } from '../context/StudyContext';
import { getRankTier, RankTierDetails } from '../lib/rankedSystem';
import { getRankTheme, RankThemePalette } from '../lib/rankTheme';

export function useRankTheme(): {
  theme: RankThemePalette;
  userRank: RankTierDetails;
  totalRP: number;
  devTierOverride: string | null;
  setDevTierOverride: (tier: string | null) => void;
} {
  const { user } = useAuth();
  const { sessions } = useStudy();
  
  // Dev-only tier override
  const [devTierOverride, setDevTierOverride] = useState<string | null>(null);

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
    if (devTierOverride) {
      return getRankTheme(devTierOverride);
    }
    return getRankTheme(userRank.tier);
  }, [userRank.tier, devTierOverride]);

  // Inject CSS variables to documentElement for global tier reactive styles
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    // Enable crossfade transition for tier changes (badges/crests)
    root.style.transition = 'color 1.2s ease, border-color 1.2s ease, box-shadow 1.2s ease';

    root.style.setProperty('--tier-accent', theme.accent);
    root.style.setProperty('--tier-glow', theme.glow);
    root.style.setProperty('--tier-border', theme.border);
    
    // Legacy fallback variables
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
    devTierOverride,
    setDevTierOverride,
  };
}
