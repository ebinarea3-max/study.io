/**
 * Preload and in-memory cache management for Study.io rank badges.
 * Ensures instant badge rendering and eliminates layout shifts or empty frames
 * during critical rank advancement animations.
 */

// Global in-memory registry of resolved/cached image URLs
const cachedImageUrls = new Set<string>();

export const ALL_RANK_TIERS = [
  'bronze',
  'silver',
  'gold',
  'platinum',
  'diamond',
  'champion',
  'master',
  'grandmaster',
] as const;

export const ALL_RANK_BADGES_WEBP: string[] = [
  // Bronze
  '/images/ranks/bronze-1.webp',
  '/images/ranks/bronze-2.webp',
  '/images/ranks/bronze-3.webp',
  '/images/ranks/bronze-4.webp',
  // Silver
  '/images/ranks/silver-1.webp',
  '/images/ranks/silver-2.webp',
  '/images/ranks/silver-3.webp',
  '/images/ranks/silver-4.webp',
  // Gold
  '/images/ranks/gold-1.webp',
  '/images/ranks/gold-2.webp',
  '/images/ranks/gold-3.webp',
  '/images/ranks/gold-4.webp',
  // Platinum
  '/images/ranks/platinum-1.webp',
  '/images/ranks/platinum-2.webp',
  '/images/ranks/platinum-3.webp',
  '/images/ranks/platinum-4.webp',
  // Diamond
  '/images/ranks/diamond-1.webp',
  '/images/ranks/diamond-2.webp',
  '/images/ranks/diamond-3.webp',
  '/images/ranks/diamond-4.webp',
  // Apex
  '/images/ranks/champion.webp',
  '/images/ranks/master.webp',
  '/images/ranks/grandmaster.webp',
];

export const ALL_RANK_BADGES_PNG: string[] = ALL_RANK_BADGES_WEBP.map((p) =>
  p.replace('.webp', '.png')
);

const DIVISION_MAP: Record<string, string> = {
  I: '1',
  II: '2',
  III: '3',
  IV: '4',
  '1': '1',
  '2': '2',
  '3': '3',
  '4': '4',
};

/**
 * Returns primary WebP and fallback PNG paths for a given tier and division.
 */
export function getRankBadgeSources(
  tier: string = 'Bronze',
  division?: string
): { webp: string; png: string; baseName: string } {
  const tierLower = (tier || 'bronze').toLowerCase().trim();
  let baseName = tierLower;

  if (division && !['champion', 'master', 'grandmaster'].includes(tierLower)) {
    const divNum = DIVISION_MAP[String(division).toUpperCase().trim()] || '1';
    baseName = `${tierLower}-${divNum}`;
  }

  return {
    webp: `/images/ranks/${baseName}.webp`,
    png: `/images/ranks/${baseName}.png`,
    baseName,
  };
}

/**
 * Check if an image URL is already resolved/cached in the current browser session.
 */
export function isRankBadgeCached(src: string): boolean {
  if (typeof window === 'undefined') return false;
  return cachedImageUrls.has(src);
}

/**
 * Mark an image URL as cached.
 */
export function markRankBadgeCached(src: string): void {
  if (src) cachedImageUrls.add(src);
}

/**
 * Preload a single image URL into browser memory cache.
 */
export function preloadImage(src: string, highPriority: boolean = false): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (cachedImageUrls.has(src)) return Promise.resolve(true);

  return new Promise((resolve) => {
    const img = new Image();
    if (highPriority && 'fetchPriority' in img) {
      (img as HTMLImageElement & { fetchPriority: string }).fetchPriority = 'high';
    }
    img.onload = () => {
      cachedImageUrls.add(src);
      resolve(true);
    };
    img.onerror = () => {
      // Don't fail the whole promise chain; resolve false
      resolve(false);
    };
    img.src = src;

    // Check if browser already loaded it synchronously from cache
    if (img.complete && img.naturalWidth > 0) {
      cachedImageUrls.add(src);
      resolve(true);
    }
  });
}

/**
 * Preloads both the WebP and PNG fallback for a given tier and division.
 */
export async function preloadTierBadge(
  tier: string,
  division?: string,
  highPriority: boolean = false
): Promise<void> {
  const { webp, png } = getRankBadgeSources(tier, division);
  await Promise.allSettled([
    preloadImage(webp, highPriority),
    preloadImage(png, highPriority),
  ]);
}

/**
 * High-priority preload for Rank Settlement / Advancement animation.
 * Loads both previous and upcoming rank badges immediately before modal reveals.
 */
export async function preloadRankAdvancement(
  prevTier: string,
  prevDivision?: string,
  newTier?: string,
  newDivision?: string
): Promise<void> {
  const tasks = [
    preloadTierBadge(prevTier, prevDivision, true),
  ];
  if (newTier) {
    tasks.push(preloadTierBadge(newTier, newDivision, true));
  }
  await Promise.allSettled(tasks);
}

/**
 * Preload badges relevant to the user's current rank and adjacent divisions.
 */
export async function preloadRankBadgesForUser(
  tier: string = 'Bronze',
  division?: string
): Promise<void> {
  const currentDiv = division || 'I';
  const tasks: Promise<void>[] = [
    preloadTierBadge(tier, currentDiv, true),
  ];

  // Preload all 4 divisions of current tier
  const tierLower = tier.toLowerCase();
  if (!['champion', 'master', 'grandmaster'].includes(tierLower)) {
    for (const d of ['I', 'II', 'III', 'IV']) {
      if (d !== currentDiv) {
        tasks.push(preloadTierBadge(tier, d, false));
      }
    }
  }

  await Promise.allSettled(tasks);
}

let allPreloaded = false;

/**
 * Preload all 23 rank crests in the background during idle time.
 * Prioritizes PNG badges followed by WebP so both are cached in browser memory
 * ensuring instant modal transitions and crest rendering with zero layout shift.
 */
export function preloadAllRankBadges(): void {
  if (typeof window === 'undefined' || allPreloaded) return;
  allPreloaded = true;

  const startPreload = () => {
    // Both PNG (primary asset specified) and WebP are preloaded into browser cache
    const badges = [...ALL_RANK_BADGES_PNG, ...ALL_RANK_BADGES_WEBP];
    let index = 0;

    const loadNextBatch = () => {
      if (index >= badges.length) return;
      const batch = badges.slice(index, index + 6);
      index += 6;

      Promise.allSettled(batch.map((src) => preloadImage(src, false))).then(() => {
        if ('requestIdleCallback' in window) {
          (window as Window & { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(loadNextBatch);
        } else {
          setTimeout(loadNextBatch, 50);
        }
      });
    };

    if ('requestIdleCallback' in window) {
      (window as Window & { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(loadNextBatch);
    } else {
      setTimeout(loadNextBatch, 80);
    }
  };

  if (document.readyState === 'complete') {
    startPreload();
  } else {
    window.addEventListener('load', startPreload, { once: true });
  }
}
