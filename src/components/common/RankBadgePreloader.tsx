'use client';

import { useEffect } from 'react';
import { useRankTheme } from '../../hooks/useRankTheme';
import {
  preloadRankBadgesForUser,
  preloadAllRankBadges,
  preloadAllRankBadgesImmediately,
  getRankBadgeSources,
} from '../../lib/preloadRankBadges';

/**
 * RankBadgePreloader
 * Headless client component mounted on app startup in Providers.
 * 1. Immediately preloads user's active rank badge and surrounding tier divisions.
 * 2. Background-preloads all remaining rank badges during idle cycles.
 * 3. Injects <link rel="preload"> for the current user rank badge.
 */
export function RankBadgePreloader() {
  const { userRank } = useRankTheme();

  useEffect(() => {
    // 1. Immediately trigger background preload of all 23 rank badge assets into browser memory cache
    if (process.env.NODE_ENV !== 'production') {
      preloadAllRankBadgesImmediately();
    } else {
      preloadAllRankBadges();
    }

    // 2. High priority preload of active rank and surrounding tier divisions
    if (userRank) {
      preloadRankBadgesForUser(userRank.tier, userRank.division);
    }
  }, [userRank]);

  if (!userRank) return null;

  const currentSources = getRankBadgeSources(userRank.tier, userRank.division);

  return (
    <>
      {/* High-priority browser hints for user's active rank badge (both PNG and WebP) */}
      <link
        rel="preload"
        as="image"
        type="image/png"
        href={currentSources.png}
        fetchPriority="high"
      />
      <link
        rel="preload"
        as="image"
        type="image/webp"
        href={currentSources.webp}
        fetchPriority="high"
      />
    </>
  );
}
