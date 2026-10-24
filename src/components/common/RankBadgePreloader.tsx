'use client';

import { useEffect } from 'react';
import { useRankTheme } from '../../hooks/useRankTheme';
import {
  preloadRankBadgesForUser,
  preloadAllRankBadges,
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
    if (!userRank) return;

    // 1. High priority preload of current rank and immediate tier divisions
    preloadRankBadgesForUser(userRank.tier, userRank.division);

    // 2. Background preload of all rank badges during browser idle
    preloadAllRankBadges();
  }, [userRank]);

  if (!userRank) return null;

  const currentSources = getRankBadgeSources(userRank.tier, userRank.division);

  return (
    <>
      {/* High-priority browser hint for user's active rank badge */}
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
