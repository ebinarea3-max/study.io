'use client';

import React from 'react';

export type RankBadgeTier =
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'platinum'
  | 'diamond'
  | 'champion'
  | 'master'
  | 'grandmaster';

export interface RankBadgeProps {
  src: string;
  tier: RankBadgeTier;
  delay?: number; // seconds, e.g. index * 0.3
  size?: number | string;
  className?: string;
  alt?: string;
  priority?: boolean;
  scale?: number;
  rankTitle?: string;
}

const TIER_GLOW_RGB: Record<RankBadgeTier, string> = {
  bronze: '190, 120, 60',
  silver: '160, 180, 230',
  gold: '255, 170, 40',
  platinum: '40, 200, 230',
  diamond: '150, 90, 255',
  champion: '168, 85, 247',
  master: '245, 158, 11',
  grandmaster: '251, 191, 36',
};

// Distinct Aura colors for higher tiers (cyan for platinum, violet for diamond, royal amethyst for champion, indigo for master, astral blue for grandmaster)
const AURA_COLORS: Record<string, string> = {
  platinum: '40, 200, 230',    // icy cyan
  diamond: '150, 90, 255',     // crystal violet
  champion: '168, 85, 247',    // royal violet
  master: '99, 102, 241',      // cosmic indigo-blue
  grandmaster: '79, 70, 229',  // deep astral blue
};

const GLINT_CORNERS = [
  { x: '22%', y: '24%' }, // Top-Left facet
  { x: '78%', y: '24%' }, // Top-Right facet
  { x: '50%', y: '16%' }, // Apex Crest point
  { x: '76%', y: '68%' }, // Bottom-Right facet
  { x: '24%', y: '68%' }, // Bottom-Left facet
];

/**
 * Derives the tier from a rank title.
 * Preserves high tiers: Diamond, Champion, Master, Grandmaster.
 */
export function getRankBadgeTier(rankTitle: string): RankBadgeTier {
  const name = (rankTitle || '').toLowerCase();
  if (name.includes('grandmaster')) return 'grandmaster';
  if (name.includes('master')) return 'master';
  if (name.includes('champ')) return 'champion';
  if (name.includes('diamond')) return 'diamond';
  if (name.includes('plat')) return 'platinum';
  if (name.includes('gold')) return 'gold';
  if (name.includes('bronze')) return 'bronze';
  return 'silver';
}

/**
 * Reusable RankBadge with Prestige Tiered Ambient Effects:
 * - All ranks: Smooth float, tier-scaled glow breathing (3.5s), polished metallic sheen sweep (5s)
 * - Bronze & Silver: Clean, crisp, polished metallic crest
 * - Gold: Warm golden glow + 3 twinkling stardust sparkles (4s)
 * - Platinum: Icy cyan radiant aura pulse + 3 drifting cyan stardust motes (5s)
 * - Diamond: Crystalline violet aura pulse + 4-point facet glint (4s) + 4 violet stardust motes + prismatic sheen
 * - Champion: Royal amethyst aura + rhythmic trophy core pulse (3s) + 5 drifting violet embers (6s) + prismatic sheen
 * - Master: Cosmic indigo aura + golden crown flare (5s) + warm emblem core pulse (3s) + 5 celestial stardust motes
 * - Grandmaster: Supreme astral blue/gold aura + pulsing celestial energy orb (3s) + golden crown flare (5s) + 6 celestial motes
 *
 * Keeps badge box fixed, object-contain, no scale transforms, adapts smoothly to compact sizes (<=48px).
 */
export function RankBadge({
  src,
  tier,
  delay = 0,
  size = 160,
  className = '',
  alt = 'Rank Badge',
  priority = false,
  scale = 1,
  rankTitle = '',
}: RankBadgeProps) {
  const titleLower = (rankTitle || alt || '').toLowerCase();

  // Resolve active tier taking into account either tier prop or rankTitle string
  let activeTier: RankBadgeTier = tier || 'silver';
  if (titleLower.includes('grandmaster') || activeTier === 'grandmaster') activeTier = 'grandmaster';
  else if (titleLower.includes('master') || activeTier === 'master') activeTier = 'master';
  else if (titleLower.includes('champ') || activeTier === 'champion') activeTier = 'champion';
  else if (titleLower.includes('diamond') || activeTier === 'diamond') activeTier = 'diamond';
  else if (titleLower.includes('plat') || activeTier === 'platinum') activeTier = 'platinum';
  else if (titleLower.includes('gold') || activeTier === 'gold') activeTier = 'gold';
  else if (titleLower.includes('bronze') || activeTier === 'bronze') activeTier = 'bronze';

  const isGold = activeTier === 'gold';
  const isPlatinum = activeTier === 'platinum';
  const isDiamond = activeTier === 'diamond';
  const isChampion = activeTier === 'champion';
  const isMaster = activeTier === 'master';
  const isGrandmaster = activeTier === 'grandmaster';
  const isDiamondOrAbove = isDiamond || isChampion || isMaster || isGrandmaster;

  const glowRgb = TIER_GLOW_RGB[activeTier] || TIER_GLOW_RGB.silver;

  // Aura colors & activation
  const hasAura = isPlatinum || isDiamondOrAbove;
  let auraKey = 'platinum';
  if (isGrandmaster) auraKey = 'grandmaster';
  else if (isMaster) auraKey = 'master';
  else if (isChampion) auraKey = 'champion';
  else if (isDiamond) auraKey = 'diamond';
  const auraRgb = AURA_COLORS[auraKey] || AURA_COLORS.platinum;

  // Stagger glint corner across ranks
  const cornerIndex = Math.abs(Math.round(delay * 3.33)) % GLINT_CORNERS.length;
  const glintPos = GLINT_CORNERS[cornerIndex];

  const numericSize = typeof size === 'number' ? size : parseInt(String(size), 10) || 160;
  const isCompact = numericSize <= 48;

  // Specific effect toggles
  const hasTrophyCore = isChampion || isMaster;
  const hasCenterOrbPulse = isGrandmaster;
  const hasCrownFlare = isMaster || isGrandmaster;
  const hasFacetGlint = isDiamond;
  const hasCyanMotes = isPlatinum;
  const hasDiamondMotes = isDiamond;
  const hasChampionEmbers = isChampion;
  const hasMasterMotes = isMaster;
  const hasGmMotes = isGrandmaster;

  // Polished metallic sheen sweep gradient
  let sheenGradient = 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.15) 35%, rgba(255, 255, 255, 0.85) 50%, rgba(255, 255, 255, 0.15) 65%, transparent 100%)';
  if (isGrandmaster || isMaster) {
    sheenGradient = 'linear-gradient(90deg, transparent 0%, rgba(251, 191, 36, 0.20) 25%, rgba(255, 255, 255, 0.45) 42%, rgba(255, 255, 255, 0.98) 50%, rgba(255, 255, 255, 0.45) 58%, rgba(254, 240, 138, 0.20) 75%, transparent 100%)';
  } else if (isChampion || isDiamond) {
    sheenGradient = 'linear-gradient(90deg, transparent 0%, rgba(192, 132, 252, 0.20) 25%, rgba(255, 255, 255, 0.45) 42%, rgba(255, 255, 255, 0.95) 50%, rgba(255, 255, 255, 0.45) 58%, rgba(56, 189, 248, 0.20) 75%, transparent 100%)';
  }

  const pixelSize = typeof size === 'number' ? `${size}px` : size;

  return (
    <div
      className={`rank-badge-root rank-badge-animated rank-badge-interactive relative flex items-center justify-center shrink-0 select-none overflow-visible ${className}`}
      style={{
        width: pixelSize,
        height: pixelSize,
        minWidth: pixelSize,
        minHeight: pixelSize,
        ['--glint-x' as any]: glintPos.x,
        ['--glint-y' as any]: glintPos.y,
      }}
    >
      {/* 1. Tiered Radiant Aura (Platinum and above): Soft blurred radial glow */}
      {hasAura && (
        <div
          className={`absolute pointer-events-none rounded-full z-0 ${
            isCompact ? '-inset-[8%] filter blur-md opacity-40' : '-inset-[16%] filter blur-2xl opacity-75'
          }`}
          style={{
            background: isGrandmaster
              ? `radial-gradient(circle at center, rgba(79, 70, 229, 0.55) 0%, rgba(251, 191, 36, 0.35) 40%, rgba(168, 85, 247, 0.20) 60%, transparent 75%)`
              : isMaster
              ? `radial-gradient(circle at center, rgba(99, 102, 241, 0.55) 0%, rgba(245, 158, 11, 0.30) 45%, transparent 70%)`
              : `radial-gradient(circle at center, rgba(${auraRgb}, 0.70) 0%, rgba(${auraRgb}, 0.25) 45%, transparent 70%)`,
            animation: 'rankBadgeAuraPulse 4s ease-in-out infinite',
            animationDelay: `${delay}s`,
            willChange: 'transform, opacity',
          }}
        />
      )}

      {/* 2. Float Wrapper: Drifts up and down (compact = 2px, normal = 6px) */}
      <div
        className="relative w-full h-full flex items-center justify-center overflow-visible z-[1]"
        style={{
          animation: isCompact
            ? 'rankBadgeFloatCompact 4s ease-in-out infinite'
            : 'rankBadgeFloat 6s ease-in-out infinite',
          animationDelay: `${delay}s`,
          willChange: 'transform',
        }}
      >
        {/* 3. Glow Breathing Wrapper: Drop-shadow pulsing over 3.5s */}
        <div
          className="relative w-full h-full flex items-center justify-center overflow-visible z-[2]"
          style={{
            animation: `rankBadgeGlow-${activeTier} 3.5s ease-in-out infinite`,
            animationDelay: `${delay}s`,
            willChange: 'filter',
          }}
        >
          {/* Inner Artwork Wrapper (Uniform Scale 1.0): Artwork normalized to exact width */}
          <div className="relative w-full h-full flex items-center justify-center overflow-visible">
            {/* Badge Image: 100% width/height with object-contain */}
            <img
              src={src}
              alt={alt}
              loading={priority ? 'eager' : 'lazy'}
              decoding="async"
              draggable={false}
              className="w-full h-full object-contain pointer-events-none select-none z-[3]"
            />

            {/* 4. Masked Metallic Sheen Sweep: Clipped precisely to badge PNG via CSS mask */}
            <div
              className="absolute inset-0 pointer-events-none overflow-hidden z-[4]"
              style={{
                maskImage: `url("${src}")`,
                WebkitMaskImage: `url("${src}")`,
                maskSize: 'contain',
                WebkitMaskSize: 'contain',
                maskRepeat: 'no-repeat',
                WebkitMaskRepeat: 'no-repeat',
                maskPosition: 'center',
                WebkitMaskPosition: 'center',
              }}
            >
              <div
                className="absolute top-0 left-0 w-[45%] h-[200%] -translate-y-1/4 pointer-events-none"
                style={{
                  background: sheenGradient,
                  animation: 'rankBadgeShine 5s cubic-bezier(0.4, 0, 0.2, 1) infinite',
                  animationDelay: `${delay + 1.2}s`,
                  willChange: 'transform, opacity',
                }}
              />
            </div>

            {/* Champion & Master: Rhythmic Inner Core Pulse at Center Emblem */}
            {hasTrophyCore && (
              <div
                className="absolute pointer-events-none mix-blend-screen filter blur-md z-[5]"
                style={{
                  top: '48%',
                  left: '50%',
                  width: isCompact ? '18px' : '44px',
                  height: isCompact ? '18px' : '44px',
                  borderRadius: '9999px',
                  transform: 'translate(-50%, -50%)',
                  background: isMaster
                    ? 'radial-gradient(circle, rgba(255, 255, 255, 0.75) 0%, rgba(245, 158, 11, 0.55) 50%, transparent 70%)'
                    : 'radial-gradient(circle, rgba(255, 255, 255, 0.70) 0%, rgba(168, 85, 247, 0.50) 50%, transparent 70%)',
                  animation: 'rankBadgeCorePulse 3s ease-in-out infinite',
                  animationDelay: `${delay}s`,
                  willChange: 'filter, opacity, transform',
                }}
              />
            )}

            {/* Grandmaster: Supreme Pulsing Celestial Energy Core Orb */}
            {hasCenterOrbPulse && (
              <div
                className="absolute pointer-events-none mix-blend-screen z-[5]"
                style={{
                  top: '49%',
                  left: '50%',
                  width: isCompact ? '16px' : '42px',
                  height: isCompact ? '16px' : '42px',
                  borderRadius: '9999px',
                  transform: 'translate(-50%, -50%)',
                  background: 'radial-gradient(circle, rgba(255, 255, 255, 0.90) 0%, rgba(251, 191, 36, 0.65) 40%, rgba(168, 85, 247, 0.45) 65%, transparent 75%)',
                  animation: 'rankBadgeOrbPulse 3s ease-in-out infinite',
                  animationDelay: `${delay}s`,
                  willChange: 'filter, opacity, transform',
                }}
              />
            )}

            {/* Master & Grandmaster: Golden Apex Crown Flare */}
            {hasCrownFlare && (
              <div
                className="absolute pointer-events-none flex items-center justify-center z-[6]"
                style={{
                  top: '18%',
                  left: '50%',
                  width: isCompact ? '10px' : '20px',
                  height: isCompact ? '10px' : '20px',
                  transform: 'translate(-50%, -50%)',
                  animation: 'rankBadgeCrownShimmer 5s ease-in-out infinite',
                  animationDelay: `${delay + 0.8}s`,
                  willChange: 'transform, opacity',
                }}
              >
                <div
                  className="absolute rounded-full"
                  style={{
                    width: isCompact ? '11px' : '22px',
                    height: isCompact ? '1px' : '1.5px',
                    background: 'linear-gradient(90deg, transparent 0%, #FFFFFF 50%, transparent 100%)',
                    boxShadow: '0 0 6px rgba(251, 191, 36, 0.9)',
                  }}
                />
                <div
                  className="absolute rounded-full"
                  style={{
                    width: isCompact ? '1px' : '1.5px',
                    height: isCompact ? '8px' : '16px',
                    background: 'linear-gradient(180deg, transparent 0%, #FFFFFF 50%, transparent 100%)',
                    boxShadow: '0 0 6px rgba(251, 191, 36, 0.9)',
                  }}
                />
                <div
                  className="absolute rounded-full bg-amber-100 shadow-[0_0_6px_#fef08a]"
                  style={{
                    width: isCompact ? '2px' : '3px',
                    height: isCompact ? '2px' : '3px',
                  }}
                />
              </div>
            )}

            {/* Diamond: 4-Point Facet Glint on Shield Corner */}
            {hasFacetGlint && (
              <div
                className="absolute pointer-events-none flex items-center justify-center z-[6]"
                style={{
                  left: `var(--glint-x, ${glintPos.x})`,
                  top: `var(--glint-y, ${glintPos.y})`,
                  width: isCompact ? '8px' : '14px',
                  height: isCompact ? '8px' : '14px',
                  transform: 'translate(-50%, -50%)',
                  animation: 'rankBadgeFacetGlint 4s ease-in-out infinite',
                  animationDelay: `${delay + 1.2}s`,
                  willChange: 'transform, opacity',
                }}
              >
                <div
                  className="absolute rounded-full"
                  style={{
                    width: isCompact ? '8px' : '14px',
                    height: isCompact ? '1px' : '1.5px',
                    background: 'linear-gradient(90deg, transparent 0%, #FFFFFF 50%, transparent 100%)',
                    boxShadow: `0 0 4px rgba(${auraRgb}, 0.8)`,
                  }}
                />
                <div
                  className="absolute rounded-full"
                  style={{
                    width: isCompact ? '1px' : '1.5px',
                    height: isCompact ? '8px' : '14px',
                    background: 'linear-gradient(180deg, transparent 0%, #FFFFFF 50%, transparent 100%)',
                    boxShadow: `0 0 4px rgba(${auraRgb}, 0.8)`,
                  }}
                />
                <div
                  className="absolute rounded-full bg-white shadow-[0_0_4px_#fff]"
                  style={{
                    width: isCompact ? '1.5px' : '2.5px',
                    height: isCompact ? '1.5px' : '2.5px',
                  }}
                />
              </div>
            )}
          </div>

          {/* Gold Sparkles: 3 tiny 3px glowing dots twinkling over 4s (disabled on compact) */}
          {isGold && !isCompact && (
            <div className="absolute inset-0 pointer-events-none overflow-visible z-[7]">
              <div
                className="absolute w-[3px] h-[3px] rounded-full bg-white pointer-events-none"
                style={{
                  top: '20%',
                  left: '22%',
                  boxShadow: `0 0 6px 1px rgba(${glowRgb}, 0.85)`,
                  animation: 'rankBadgeSparkle 4s ease-in-out infinite',
                  animationDelay: `${delay}s`,
                  willChange: 'transform, opacity',
                }}
              />
              <div
                className="absolute w-[3px] h-[3px] rounded-full bg-white pointer-events-none"
                style={{
                  top: '26%',
                  right: '22%',
                  boxShadow: `0 0 6px 1px rgba(${glowRgb}, 0.85)`,
                  animation: 'rankBadgeSparkle 4s ease-in-out infinite',
                  animationDelay: `${delay + 1.3}s`,
                  willChange: 'transform, opacity',
                }}
              />
              <div
                className="absolute w-[3px] h-[3px] rounded-full bg-white pointer-events-none"
                style={{
                  bottom: '22%',
                  left: '48%',
                  boxShadow: `0 0 6px 1px rgba(${glowRgb}, 0.85)`,
                  animation: 'rankBadgeSparkle 4s ease-in-out infinite',
                  animationDelay: `${delay + 2.6}s`,
                  willChange: 'transform, opacity',
                }}
              />
            </div>
          )}

          {/* Platinum: 3 Cyan Stardust Motes Drifting Upward (disabled on compact) */}
          {hasCyanMotes && !isCompact && (
            <div className="absolute inset-0 pointer-events-none overflow-visible z-[7]">
              <div
                className="absolute w-[3px] h-[3px] rounded-full bg-cyan-100 pointer-events-none"
                style={{
                  left: '28%',
                  bottom: '16%',
                  boxShadow: '0 0 6px 1px rgba(40, 200, 230, 0.85)',
                  animation: 'rankBadgeMoteRise 5s ease-in-out infinite',
                  animationDelay: `${delay}s`,
                  willChange: 'transform, opacity',
                }}
              />
              <div
                className="absolute w-[3px] h-[3px] rounded-full bg-cyan-100 pointer-events-none"
                style={{
                  left: '50%',
                  bottom: '12%',
                  boxShadow: '0 0 6px 1px rgba(40, 200, 230, 0.85)',
                  animation: 'rankBadgeMoteRise 5s ease-in-out infinite',
                  animationDelay: `${delay + 1.6}s`,
                  willChange: 'transform, opacity',
                }}
              />
              <div
                className="absolute w-[3px] h-[3px] rounded-full bg-cyan-100 pointer-events-none"
                style={{
                  left: '72%',
                  bottom: '18%',
                  boxShadow: '0 0 6px 1px rgba(40, 200, 230, 0.85)',
                  animation: 'rankBadgeMoteRise 5s ease-in-out infinite',
                  animationDelay: `${delay + 3.2}s`,
                  willChange: 'transform, opacity',
                }}
              />
            </div>
          )}

          {/* Diamond: 4 Violet / Crystal Stardust Motes Drifting Upward (disabled on compact) */}
          {hasDiamondMotes && !isCompact && (
            <div className="absolute inset-0 pointer-events-none overflow-visible z-[7]">
              {[
                { left: '26%', bottom: '16%', delayOffset: 0.0 },
                { left: '42%', bottom: '12%', delayOffset: 1.2 },
                { left: '58%', bottom: '14%', delayOffset: 2.4 },
                { left: '74%', bottom: '18%', delayOffset: 3.6 },
              ].map((mote, i) => (
                <div
                  key={i}
                  className="absolute w-[3px] h-[3px] rounded-full bg-purple-100 pointer-events-none"
                  style={{
                    left: mote.left,
                    bottom: mote.bottom,
                    boxShadow: '0 0 6px 1px rgba(168, 85, 247, 0.85)',
                    animation: 'rankBadgeMoteRise 5s ease-in-out infinite',
                    animationDelay: `${delay + mote.delayOffset}s`,
                    willChange: 'transform, opacity',
                  }}
                />
              ))}
            </div>
          )}

          {/* Champion: 5 Royal Violet Floating Embers Drifting Upward (disabled on compact) */}
          {hasChampionEmbers && !isCompact && (
            <div className="absolute inset-0 pointer-events-none overflow-visible z-[7]">
              {[
                { left: '28%', bottom: '18%', delayOffset: 0.0 },
                { left: '38%', bottom: '14%', delayOffset: 1.2 },
                { left: '50%', bottom: '20%', delayOffset: 2.4 },
                { left: '62%', bottom: '15%', delayOffset: 3.6 },
                { left: '72%', bottom: '18%', delayOffset: 4.8 },
              ].map((dot, i) => (
                <div
                  key={i}
                  className="absolute w-[3px] h-[3px] rounded-full bg-violet-100 pointer-events-none"
                  style={{
                    left: dot.left,
                    bottom: dot.bottom,
                    boxShadow: '0 0 6px 1px rgba(168, 85, 247, 0.85)',
                    animation: 'rankBadgeEmberRise 6s ease-in-out infinite',
                    animationDelay: `${delay + dot.delayOffset}s`,
                    willChange: 'transform, opacity',
                  }}
                />
              ))}
            </div>
          )}

          {/* Master: 5 Celestial Gold & Indigo Stardust Particles Drifting Upward (disabled on compact) */}
          {hasMasterMotes && !isCompact && (
            <div className="absolute inset-0 pointer-events-none overflow-visible z-[7]">
              {[
                { left: '26%', bottom: '18%', delayOffset: 0.0, color: '#fef08a', shadow: 'rgba(245, 158, 11, 0.85)' },
                { left: '38%', bottom: '14%', delayOffset: 1.2, color: '#c7d2fe', shadow: 'rgba(99, 102, 241, 0.85)' },
                { left: '50%', bottom: '22%', delayOffset: 2.4, color: '#fef08a', shadow: 'rgba(245, 158, 11, 0.85)' },
                { left: '62%', bottom: '15%', delayOffset: 3.6, color: '#c7d2fe', shadow: 'rgba(99, 102, 241, 0.85)' },
                { left: '74%', bottom: '18%', delayOffset: 4.8, color: '#fef08a', shadow: 'rgba(245, 158, 11, 0.85)' },
              ].map((dot, i) => (
                <div
                  key={i}
                  className="absolute w-[3px] h-[3px] rounded-full pointer-events-none"
                  style={{
                    left: dot.left,
                    bottom: dot.bottom,
                    backgroundColor: dot.color,
                    boxShadow: `0 0 6px 1px ${dot.shadow}`,
                    animation: 'rankBadgeEmberRise 6s ease-in-out infinite',
                    animationDelay: `${delay + dot.delayOffset}s`,
                    willChange: 'transform, opacity',
                  }}
                />
              ))}
            </div>
          )}

          {/* Grandmaster: 6 Luminous Astral & Solar Stardust Motes Drifting Upward (disabled on compact) */}
          {hasGmMotes && !isCompact && (
            <div className="absolute inset-0 pointer-events-none overflow-visible z-[7]">
              {[
                { left: '24%', bottom: '18%', delayOffset: 0.0, color: '#fff', shadow: 'rgba(251, 191, 36, 0.9)' },
                { left: '34%', bottom: '14%', delayOffset: 1.0, color: '#c7d2fe', shadow: 'rgba(79, 70, 229, 0.85)' },
                { left: '44%', bottom: '22%', delayOffset: 2.0, color: '#fff', shadow: 'rgba(251, 191, 36, 0.9)' },
                { left: '56%', bottom: '16%', delayOffset: 3.0, color: '#fef08a', shadow: 'rgba(251, 191, 36, 0.9)' },
                { left: '66%', bottom: '20%', delayOffset: 4.0, color: '#c7d2fe', shadow: 'rgba(79, 70, 229, 0.85)' },
                { left: '76%', bottom: '15%', delayOffset: 5.0, color: '#fff', shadow: 'rgba(251, 191, 36, 0.9)' },
              ].map((dot, i) => (
                <div
                  key={i}
                  className="absolute w-[3px] h-[3px] rounded-full pointer-events-none"
                  style={{
                    left: dot.left,
                    bottom: dot.bottom,
                    backgroundColor: dot.color,
                    boxShadow: `0 0 6px 1px ${dot.shadow}`,
                    animation: 'rankBadgeEmberRise 6s ease-in-out infinite',
                    animationDelay: `${delay + dot.delayOffset}s`,
                    willChange: 'transform, opacity',
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
