/**
 * Study.io Unified Rank Badge Effects System (badgeFx.ts)
 * 
 * Configures per-tier visual effects:
 * - Silhouette glow (scaled to badge silhouette, zero circular halo)
 * - CSS-masked sheen (confined to badge metal)
 * - 4-point star glints at key crest points
 * - Procedural particles (embers, sparkles, specks)
 * - Division scaling (0 to 1 factor for I to IV)
 * - Seeded deterministic PRNG for SSR/hydration parity
 */

export type BadgeEffectsMode = 'full' | 'lite' | 'none';

export type ParticleType = 'ember' | 'sparkle' | 'crystal' | 'star' | 'speck';

export interface GlintCoord {
  id: string;
  name: string;
  x: number; // percentage (0 - 100)
  y: number; // percentage (0 - 100)
  delay: number; // seconds
  duration: number; // seconds
}

export interface ParticleConfig {
  x: number; // percentage (0 - 100)
  y: number; // percentage (0 - 100)
  size: number; // px at 160px base
  color: string;
  driftX: number; // px
  driftY: number; // px
  duration: number; // seconds
  delay: number; // seconds
}

export interface TierFxConfig {
  glowColor: string;
  glowMinOpacity: number;
  glowMaxOpacity: number;
  glowPeriod: number; // seconds
  sheenColor: string;
  sheenWidth: number; // percentage
  sheenPeriod: number; // seconds
  particleType: ParticleType;
  particleColor: string;
  particleCount: number; // base count for 160px
  particleSpeed: number; // duration in seconds
  particleOrigin: 'bottom' | 'top' | 'all';
  glints: GlintCoord[];
}

/**
 * Standard crest landmark points (percentage of badge width & height)
 * Tunable on /dev/ranks using the glint point crosshairs
 */
export const DEFAULT_GLINT_POINTS = {
  topSpike: { x: 50, y: 6, name: 'Top Spike' },
  leftWingTip: { x: 12, y: 40, name: 'Left Wing Tip' },
  rightWingTip: { x: 88, y: 40, name: 'Right Wing Tip' },
  centreGem: { x: 50, y: 50, name: 'Centre Gem' },
  bottomPoint: { x: 50, y: 94, name: 'Bottom Point' },
};

/**
 * Deterministic seeded PRNG (eliminates hydration mismatches)
 */
export function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function getSeededFloat(key: string, salt: number = 0): number {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  return seededRandom(hash + salt);
}

/**
 * Converts Roman or Arabic division string to numeric 1-4 and 0-1 factor
 */
export function getDivisionFactor(division?: string | null): { num: number; factor: number } {
  if (!division) return { num: 1, factor: 0 };
  const d = division.toUpperCase().trim();
  if (d === 'IV' || d === '4') return { num: 4, factor: 1.0 };
  if (d === 'III' || d === '3') return { num: 3, factor: 0.67 };
  if (d === 'II' || d === '2') return { num: 2, factor: 0.33 };
  return { num: 1, factor: 0 };
}

/**
 * Base Tier Configurations
 * Phase 1 specifies BRONZE, SILVER, and GOLD.
 * Other tiers contain balanced defaults (finalized in Phase 2).
 */
export const BASE_TIER_FX: Record<string, TierFxConfig> = {
  bronze: {
    // Quiet forge: warm copper silhouette glow, slow wide sheen, rising embers
    glowColor: 'rgba(217, 119, 6, 0.45)',
    glowMinOpacity: 0.25,
    glowMaxOpacity: 0.45,
    glowPeriod: 4.5,
    sheenColor: 'rgba(251, 191, 36, 0.45)',
    sheenWidth: 48,
    sheenPeriod: 7.0,
    particleType: 'ember',
    particleColor: '#F59E0B',
    particleCount: 3, // 4-5 at division IV
    particleSpeed: 4.2,
    particleOrigin: 'bottom',
    glints: [
      { id: 'b-top', name: 'Top Spike', x: 50, y: 6, delay: 0, duration: 6.0 },
      { id: 'b-gem', name: 'Centre Gem', x: 50, y: 50, delay: 3.0, duration: 6.0 },
    ],
  },
  silver: {
    // Polished steel: steel-blue glow, thin crisp bright sheen band, star glints, zero particles
    glowColor: 'rgba(186, 215, 245, 0.55)',
    glowMinOpacity: 0.28,
    glowMaxOpacity: 0.50,
    glowPeriod: 5.0,
    sheenColor: 'rgba(255, 255, 255, 0.85)',
    sheenWidth: 22,
    sheenPeriod: 6.0,
    particleType: 'sparkle',
    particleColor: '#E2E8F0',
    particleCount: 0, // No particles for Silver
    particleSpeed: 3.5,
    particleOrigin: 'bottom',
    glints: [
      { id: 's-top', name: 'Top Spike', x: 50, y: 6, delay: 0.5, duration: 5.5 },
      { id: 's-left', name: 'Left Wing', x: 12, y: 40, delay: 2.3, duration: 6.5 },
      { id: 's-right', name: 'Right Wing', x: 88, y: 40, delay: 4.1, duration: 7.2 },
    ],
  },
  gold: {
    // Radiance: warm gold glow, wide warm sheen, rising twinkles, multi-point glints
    glowColor: 'rgba(245, 158, 11, 0.65)',
    glowMinOpacity: 0.35,
    glowMaxOpacity: 0.60,
    glowPeriod: 4.0,
    sheenColor: 'rgba(254, 240, 138, 0.75)',
    sheenWidth: 42,
    sheenPeriod: 5.0,
    particleType: 'sparkle',
    particleColor: '#FBBF24',
    particleCount: 7, // 6 to 8 sparkles, +2 at division IV
    particleSpeed: 3.0,
    particleOrigin: 'bottom',
    glints: [
      { id: 'g-top', name: 'Top Spike', x: 50, y: 6, delay: 0.2, duration: 4.5 },
      { id: 'g-left', name: 'Left Wing', x: 12, y: 40, delay: 1.8, duration: 5.0 },
      { id: 'g-gem', name: 'Centre Gem', x: 50, y: 50, delay: 3.2, duration: 4.8 },
    ],
  },
  // Defaults for Phase 2 tiers (cool teal, violet, prismatic, etc.)
  platinum: {
    glowColor: 'rgba(34, 211, 238, 0.65)',
    glowMinOpacity: 0.32,
    glowMaxOpacity: 0.55,
    glowPeriod: 3.5,
    sheenColor: 'rgba(165, 243, 252, 0.75)',
    sheenWidth: 26,
    sheenPeriod: 4.5,
    particleType: 'crystal',
    particleColor: '#22D3EE',
    particleCount: 5,
    particleSpeed: 3.2,
    particleOrigin: 'bottom',
    glints: [
      { id: 'p-top', name: 'Top Spike', x: 50, y: 6, delay: 0.4, duration: 4.0 },
      { id: 'p-left', name: 'Left Wing', x: 12, y: 40, delay: 1.6, duration: 4.0 },
      { id: 'p-gem', name: 'Centre Gem', x: 50, y: 50, delay: 2.8, duration: 4.0 },
    ],
  },
  diamond: {
    glowColor: 'rgba(192, 132, 252, 0.70)',
    glowMinOpacity: 0.35,
    glowMaxOpacity: 0.60,
    glowPeriod: 3.2,
    sheenColor: 'rgba(244, 215, 255, 0.8)',
    sheenWidth: 32,
    sheenPeriod: 5.0,
    particleType: 'crystal',
    particleColor: '#C084FC',
    particleCount: 6,
    particleSpeed: 3.0,
    particleOrigin: 'bottom',
    glints: [
      { id: 'd-top', name: 'Top Spike', x: 50, y: 6, delay: 0.3, duration: 3.0 },
      { id: 'd-left', name: 'Left Wing', x: 12, y: 40, delay: 1.0, duration: 3.0 },
      { id: 'd-right', name: 'Right Wing', x: 88, y: 40, delay: 1.8, duration: 3.0 },
      { id: 'd-gem', name: 'Centre Gem', x: 50, y: 50, delay: 2.5, duration: 3.0 },
    ],
  },
  champion: {
    glowColor: 'rgba(232, 121, 249, 0.70)',
    glowMinOpacity: 0.36,
    glowMaxOpacity: 0.62,
    glowPeriod: 3.0,
    sheenColor: 'rgba(251, 191, 36, 0.8)',
    sheenWidth: 36,
    sheenPeriod: 4.5,
    particleType: 'sparkle',
    particleColor: '#F59E0B',
    particleCount: 7,
    particleSpeed: 2.8,
    particleOrigin: 'top',
    glints: [
      { id: 'c-top', name: 'Top Trophy', x: 50, y: 15, delay: 0.2, duration: 3.5 },
      { id: 'c-gem', name: 'Centre Gem', x: 50, y: 50, delay: 1.8, duration: 3.5 },
    ],
  },
  master: {
    glowColor: 'rgba(249, 115, 22, 0.75)',
    glowMinOpacity: 0.38,
    glowMaxOpacity: 0.65,
    glowPeriod: 3.5,
    sheenColor: 'rgba(254, 215, 170, 0.8)',
    sheenWidth: 38,
    sheenPeriod: 4.8,
    particleType: 'ember',
    particleColor: '#FB923C',
    particleCount: 9,
    particleSpeed: 3.0,
    particleOrigin: 'bottom',
    glints: [
      { id: 'm-left', name: 'Left Crown', x: 35, y: 12, delay: 0.5, duration: 4.0 },
      { id: 'm-right', name: 'Right Crown', x: 65, y: 12, delay: 2.2, duration: 4.0 },
    ],
  },
  grandmaster: {
    glowColor: 'rgba(168, 85, 247, 0.80)',
    glowMinOpacity: 0.42,
    glowMaxOpacity: 0.72,
    glowPeriod: 2.5,
    sheenColor: 'rgba(251, 191, 36, 0.85)',
    sheenWidth: 44,
    sheenPeriod: 4.0,
    particleType: 'star',
    particleColor: '#C084FC',
    particleCount: 12,
    particleSpeed: 2.6,
    particleOrigin: 'bottom',
    glints: [
      { id: 'gm-top', name: 'Top Spike', x: 50, y: 6, delay: 0.1, duration: 3.0 },
      { id: 'gm-left', name: 'Left Wing', x: 12, y: 40, delay: 0.7, duration: 3.0 },
      { id: 'gm-right', name: 'Right Wing', x: 88, y: 40, delay: 1.3, duration: 3.0 },
      { id: 'gm-gem', name: 'Centre Gem', x: 50, y: 50, delay: 1.9, duration: 3.0 },
      { id: 'gm-bot', name: 'Bottom Point', x: 50, y: 94, delay: 2.5, duration: 3.0 },
    ],
  },
};

/**
 * Resolves the active TierFxConfig scaling with division:
 * - Up to +10% glow opacity
 * - Up to 15% shorter sheen period
 * - Extra glints or particles based on division
 */
export function getTierDivisionFx(
  tier: string = 'bronze',
  division?: string | null,
  pixelSize: number = 160
): {
  glowColor: string;
  glowMinOpacity: number;
  glowMaxOpacity: number;
  glowPeriod: number;
  sheenColor: string;
  sheenWidth: number;
  sheenPeriod: number;
  particleColor: string;
  particleType: ParticleType;
  glints: GlintCoord[];
  particles: ParticleConfig[];
} {
  const tierKey = (tier || 'bronze').toLowerCase().trim();
  const base = BASE_TIER_FX[tierKey] || BASE_TIER_FX.bronze;
  const { num: divNum, factor: divFactor } = getDivisionFactor(division);

  // Glow opacity boosted up to +10% by division
  const glowMaxOpacity = Math.min(0.9, base.glowMaxOpacity * (1 + 0.1 * divFactor));
  const glowMinOpacity = base.glowMinOpacity * (1 + 0.08 * divFactor);

  // Sheen period shortened up to 15% by division
  const sheenPeriod = Math.max(2.5, base.sheenPeriod * (1 - 0.15 * divFactor));

  // Resolved glints
  let glints: GlintCoord[] = [...base.glints];

  if (tierKey === 'silver') {
    // Silver: star glints on top spike and both wings; one more glint at division III and IV
    if (divNum >= 3) {
      glints.push({
        id: 's-gem',
        name: 'Centre Gem',
        x: 50,
        y: 50,
        delay: 5.5,
        duration: 6.0,
      });
    }
  } else if (tierKey === 'gold') {
    // Gold: division IV adds a second glint rhythm
    if (divNum === 4) {
      glints.push({
        id: 'g-bot',
        name: 'Bottom Point',
        x: 50,
        y: 94,
        delay: 2.5,
        duration: 4.0,
      });
    }
  }

  // Particle count scaling
  let count = base.particleCount;
  if (tierKey === 'bronze') {
    // 3 tiny copper embers (4 or 5 at division IV)
    count = divNum === 4 ? 5 : divNum === 3 ? 4 : 3;
  } else if (tierKey === 'gold') {
    // 6 to 8 sparkles (+2 at division IV)
    count = divNum === 4 ? 10 : 7;
  }

  // Size scaling: particle counts scale with size relative to 160px
  const sizeRatio = Math.max(0.4, Math.min(1.5, pixelSize / 160));
  const effectiveCount = Math.round(count * sizeRatio);

  // Generate deterministic particles using seeded PRNG
  const particles: ParticleConfig[] = [];
  const seedPrefix = `${tierKey}-${divNum}`;

  for (let i = 0; i < effectiveCount; i++) {
    const s1 = getSeededFloat(seedPrefix, i * 6 + 1);
    const s2 = getSeededFloat(seedPrefix, i * 6 + 2);
    const s3 = getSeededFloat(seedPrefix, i * 6 + 3);
    const s4 = getSeededFloat(seedPrefix, i * 6 + 4);
    const s5 = getSeededFloat(seedPrefix, i * 6 + 5);

    // X position spread between 20% and 80% of width
    const x = 20 + s1 * 60;

    // Y position origin
    let y = 80 + s2 * 15; // default bottom
    if (base.particleOrigin === 'top') {
      y = 15 + s2 * 25;
    } else if (base.particleOrigin === 'all') {
      y = 20 + s2 * 60;
    }

    // Drift directions
    const driftX = (s3 - 0.5) * 36 * sizeRatio;
    const driftY = -(35 + s4 * 40) * sizeRatio;
    const duration = base.particleSpeed * (0.8 + s5 * 0.4);
    const delay = (i / Math.max(1, effectiveCount)) * duration;
    const particlePixelSize = Math.max(2, Math.round((2.5 + s2 * 2) * sizeRatio));

    particles.push({
      x,
      y,
      size: particlePixelSize,
      color: base.particleColor,
      driftX,
      driftY,
      duration,
      delay,
    });
  }

  return {
    glowColor: base.glowColor,
    glowMinOpacity,
    glowMaxOpacity,
    glowPeriod: base.glowPeriod,
    sheenColor: base.sheenColor,
    sheenWidth: base.sheenWidth,
    sheenPeriod,
    particleColor: base.particleColor,
    particleType: base.particleType,
    glints,
    particles,
  };
}

/**
 * Global shared IntersectionObserver for pausing off-screen badges
 */
type VisibilityListener = (isVisible: boolean) => void;
const observerSubscribers = new Map<Element, Set<VisibilityListener>>();

let sharedObserver: IntersectionObserver | null = null;
let isDocVisible = true;

function initSharedObserver() {
  if (typeof window === 'undefined') return;

  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const listeners = observerSubscribers.get(entry.target);
          if (listeners) {
            const isVisible = entry.isIntersecting && entry.intersectionRatio >= 0.1;
            for (const fn of listeners) {
              fn(isVisible && isDocVisible);
            }
          }
        }
      },
      { threshold: [0, 0.1] }
    );

    document.addEventListener('visibilitychange', () => {
      isDocVisible = !document.hidden;
      for (const [elem, listeners] of observerSubscribers.entries()) {
        for (const fn of listeners) {
          fn(isDocVisible);
        }
      }
    });
  }
}

export function subscribeBadgeVisibility(
  elem: Element,
  callback: VisibilityListener
): () => void {
  initSharedObserver();
  if (!sharedObserver) return () => {};

  if (!observerSubscribers.has(elem)) {
    observerSubscribers.set(elem, new Set());
    sharedObserver.observe(elem);
  }

  const set = observerSubscribers.get(elem)!;
  set.add(callback);

  return () => {
    set.delete(callback);
    if (set.size === 0) {
      observerSubscribers.delete(elem);
      sharedObserver?.unobserve(elem);
    }
  };
}
