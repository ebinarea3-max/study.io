'use client';

import React from 'react';

export type RankBadgeTier = 'silver' | 'gold' | 'platinum' | 'diamond' | 'bronze';

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
  silver: '160, 180, 230',
  gold: '255, 170, 40',
  platinum: '40, 200, 230',
  diamond: '150, 90, 255',
  bronze: '190, 120, 60',
};

// Normalized scales so visible shield width matches Silver (~145px) in a 160x160 box
const TIER_SCALES: Record<RankBadgeTier, number> = {
  silver: 1.0,
  gold: 1.08,
  platinum: 1.15,
  diamond: 1.18,
  bronze: 1.10,
};

// Distinct Aura colors for higher tiers (violet for diamond, indigo/blue for master/grandmaster)
const AURA_COLORS: Record<string, string> = {
  platinum: '40, 200, 230',    // cyan
  diamond: '150, 90, 255',     // violet
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
 * Derives the tier (silver | gold | platinum | diamond) from a rank title.
 * Silver I-IV = silver
 * Gold I-IV = gold
 * Platinum I-IV = platinum
 * Diamond and above (Diamond, Champion, Master, Grandmaster) = diamond
 */
export function getRankBadgeTier(rankTitle: string): 'silver' | 'gold' | 'platinum' | 'diamond' {
  const name = (rankTitle || '').toLowerCase();
  if (name.includes('gold')) return 'gold';
  if (name.includes('plat')) return 'platinum';
  if (name.includes('diamond') || name.includes('champ') || name.includes('master')) return 'diamond';
  return 'silver';
}

/**
 * Reusable RankBadge with subtle, calm idle animations scaled by tier:
 * - All ranks: Float (6s), Glow breathing (3.5s), Masked shine sweep (5s)
 * - Silver: nothing extra
 * - Gold: 3 smaller (3px), slower (4s) twinkling sparkles
 * - Platinum: Soft cyan aura pulse (4s) + 3 rising motes drifting ~40px (5s)
 * - Diamond and above: Violet/blue aura pulse + rising motes + 4-point facet glint (4s) + core pulse for brain emblem (3s) + stronger shine
 * - Completely removed all rotating rings
 * - Smooth hover scale to 1.06
 */
export function RankBadge({
  src,
  tier,
  delay = 0,
  size = 160,
  className = '',
  alt = 'Rank Badge',
  priority = false,
  scale,
  rankTitle = '',
}: RankBadgeProps) {
  const tierKey: RankBadgeTier = tier || 'silver';
  const glowRgb = TIER_GLOW_RGB[tierKey] || TIER_GLOW_RGB.silver;
  const badgeScale = scale !== undefined ? scale : (TIER_SCALES[tierKey] || 1.0);

  const titleLower = (rankTitle || alt || '').toLowerCase();
  const isGold = tierKey === 'gold';
  const isPlatinum = tierKey === 'platinum';
  const isDiamondOrAbove = tierKey === 'diamond';

  // Brain emblem ranks: Champion, Master, Grandmaster (and Diamond IV)
  const hasBrainEmblem =
    titleLower.includes('champ') ||
    titleLower.includes('master') ||
    (isDiamondOrAbove && (titleLower.includes('iv') || titleLower.includes('4')));

  // Aura colors: cyan for Platinum, violet for Diamond, blue/indigo for Champion/Master/Grandmaster
  let auraKey = 'platinum';
  if (titleLower.includes('grandmaster')) auraKey = 'grandmaster';
  else if (titleLower.includes('master')) auraKey = 'master';
  else if (titleLower.includes('champ')) auraKey = 'champion';
  else if (isDiamondOrAbove) auraKey = 'diamond';
  const auraRgb = AURA_COLORS[auraKey] || AURA_COLORS.platinum;

  const hasAura = isPlatinum || isDiamondOrAbove;
  const hasMotes = isPlatinum || isDiamondOrAbove;
  const hasGlint = isDiamondOrAbove;

  // Stagger glint corner across ranks so each card has its glint on a different corner
  const cornerIndex = Math.abs(Math.round(delay * 3.33)) % GLINT_CORNERS.length;
  const glintPos = GLINT_CORNERS[cornerIndex];

  const pixelSize = typeof size === 'number' ? `${size}px` : size;

  return (
    <div
      className={`rank-badge-root rank-badge-animated rank-badge-interactive relative flex items-center justify-center shrink-0 select-none overflow-visible ${className}`}
      style={{
        width: pixelSize,
        height: pixelSize,
        minWidth: pixelSize,
        minHeight: pixelSize,
        ['--badge-scale' as any]: badgeScale,
        ['--glint-x' as any]: glintPos.x,
        ['--glint-y' as any]: glintPos.y,
      }}
    >
      {/* Aura Pulse (Platinum and Diamond+): Soft blurred radial glow with no visible outline */}
      {hasAura && (
        <div
          className="absolute -inset-[14%] rounded-full pointer-events-none filter blur-2xl z-0"
          style={{
            background: `radial-gradient(circle at center, rgba(${auraRgb}, 0.75) 0%, rgba(${auraRgb}, 0.25) 45%, transparent 70%)`,
            animation: 'rankBadgeAuraPulse 4s ease-in-out infinite',
            animationDelay: `${delay}s`,
            willChange: 'transform, opacity',
          }}
        />
      )}

      {/* 1. Float Wrapper (drifts up and down 6px over 6s) */}
      <div
        className="relative w-full h-full flex items-center justify-center overflow-visible z-[1]"
        style={{
          animation: 'rankBadgeFloat 6s ease-in-out infinite',
          animationDelay: `${delay}s`,
          willChange: 'transform',
        }}
      >
        {/* 2. Glow Breathing Wrapper (drop-shadow pulsing over 3.5s) */}
        <div
          className="relative w-full h-full flex items-center justify-center overflow-visible"
          style={{
            animation: `rankBadgeGlow-${tierKey} 3.5s ease-in-out infinite`,
            animationDelay: `${delay}s`,
            willChange: 'filter',
          }}
        >
          {/* Inner Scale Wrapper: applies --badge-scale so shield matches Silver ~145px */}
          <div
            className="relative w-full h-full flex items-center justify-center overflow-visible"
            style={{
              transform: 'scale(var(--badge-scale, 1))',
              willChange: 'transform',
            }}
          >
            {/* Badge Image: 100% width/height with object-contain */}
            <img
              src={src}
              alt={alt}
              loading={priority ? 'eager' : 'lazy'}
              decoding="async"
              draggable={false}
              className="w-full h-full object-contain pointer-events-none select-none"
            />

            {/* 3. Masked Shine Sweep: Clipped to badge PNG via CSS mask */}
            <div
              className="absolute inset-0 pointer-events-none overflow-hidden"
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
                  background: isDiamondOrAbove
                    ? 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.70) 50%, transparent 100%)'
                    : 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.55) 50%, transparent 100%)',
                  animation: 'rankBadgeShine 5s cubic-bezier(0.4, 0, 0.2, 1) infinite',
                  animationDelay: `${delay + 1.2}s`,
                  willChange: 'transform, opacity',
                }}
              />
            </div>

            {/* Core Pulse: Soft glow pulse at center emblem for brain-emblem ranks every 3s */}
            {hasBrainEmblem && (
              <div
                className="absolute top-[48%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[46px] h-[46px] rounded-full pointer-events-none mix-blend-screen filter blur-md"
                style={{
                  background: `radial-gradient(circle, rgba(255, 255, 255, 0.65) 0%, rgba(${auraRgb}, 0.45) 50%, transparent 70%)`,
                  animation: 'rankBadgeCorePulse 3s ease-in-out infinite',
                  animationDelay: `${delay}s`,
                  willChange: 'filter, opacity, transform',
                }}
              />
            )}

            {/* Facet Glint (Diamond+): 4-point star flare popping on a corner of the shield every ~4s */}
            {hasGlint && (
              <div
                className="absolute pointer-events-none flex items-center justify-center w-[14px] h-[14px]"
                style={{
                  left: `var(--glint-x, ${glintPos.x})`,
                  top: `var(--glint-y, ${glintPos.y})`,
                  transform: 'translate(-50%, -50%)',
                  animation: 'rankBadgeFacetGlint 4s ease-in-out infinite',
                  animationDelay: `${delay + 1.2}s`,
                  willChange: 'transform, opacity',
                }}
              >
                {/* Horizontal Flare Ray */}
                <div
                  className="absolute w-[14px] h-[1.5px] rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, #FFFFFF 50%, transparent 100%)',
                    boxShadow: `0 0 4px rgba(${auraRgb}, 0.8)`,
                  }}
                />
                {/* Vertical Flare Ray */}
                <div
                  className="absolute w-[1.5px] h-[14px] rounded-full"
                  style={{
                    background: 'linear-gradient(180deg, transparent 0%, #FFFFFF 50%, transparent 100%)',
                    boxShadow: `0 0 4px rgba(${auraRgb}, 0.8)`,
                  }}
                />
                {/* Star Center Core */}
                <div className="absolute w-[2.5px] h-[2.5px] rounded-full bg-white shadow-[0_0_4px_#fff]" />
              </div>
            )}
          </div>

          {/* Gold Sparkles: 3 tiny 3px glowing dots twinkling over 4s */}
          {isGold && (
            <div className="absolute inset-0 pointer-events-none overflow-visible">
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

          {/* Rising Motes (Platinum & Diamond+): 3 tiny 3px dots slowly drifting up ~40px over 5s */}
          {hasMotes && (
            <div className="absolute inset-0 pointer-events-none overflow-visible">
              <div
                className="absolute w-[3px] h-[3px] rounded-full bg-white pointer-events-none"
                style={{
                  left: '28%',
                  bottom: '16%',
                  boxShadow: `0 0 6px 1px rgba(${auraRgb}, 0.85)`,
                  animation: 'rankBadgeMoteRise 5s ease-in-out infinite',
                  animationDelay: `${delay}s`,
                  willChange: 'transform, opacity',
                }}
              />
              <div
                className="absolute w-[3px] h-[3px] rounded-full bg-white pointer-events-none"
                style={{
                  left: '50%',
                  bottom: '12%',
                  boxShadow: `0 0 6px 1px rgba(${auraRgb}, 0.85)`,
                  animation: 'rankBadgeMoteRise 5s ease-in-out infinite',
                  animationDelay: `${delay + 1.6}s`,
                  willChange: 'transform, opacity',
                }}
              />
              <div
                className="absolute w-[3px] h-[3px] rounded-full bg-white pointer-events-none"
                style={{
                  left: '72%',
                  bottom: '18%',
                  boxShadow: `0 0 6px 1px rgba(${auraRgb}, 0.85)`,
                  animation: 'rankBadgeMoteRise 5s ease-in-out infinite',
                  animationDelay: `${delay + 3.2}s`,
                  willChange: 'transform, opacity',
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
