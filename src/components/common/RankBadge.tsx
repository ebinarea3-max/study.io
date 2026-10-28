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
  showOrbitRing?: boolean;
  scale?: number;
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
 * Reusable RankBadge with normalized shield sizing:
 * 1. Fixed-size box (default 160x160px) with flex centering and shrink-0
 * 2. Per-tier --badge-scale CSS variable on an inner wrapper to match Silver's ~145px shield
 * 3. Overflow visible so glow, sparkles, and baked-in rings are never clipped
 * 4. Shine sweep mask kept in sync inside the scaled wrapper
 * 5. Subtle idle animations (Float 6s, Glow breathing 3.5s, Masked shine 5s, Sparkles 3s, Orbit ring 20s)
 * 6. Smooth hover scale to 1.06
 */
export function RankBadge({
  src,
  tier,
  delay = 0,
  size = 160,
  className = '',
  alt = 'Rank Badge',
  priority = false,
  showOrbitRing = true,
  scale,
}: RankBadgeProps) {
  const tierKey: RankBadgeTier = tier || 'silver';
  const glowRgb = TIER_GLOW_RGB[tierKey] || TIER_GLOW_RGB.silver;
  const badgeScale = scale !== undefined ? scale : (TIER_SCALES[tierKey] || 1.0);
  const isSparkleTier = tierKey === 'gold' || tierKey === 'diamond';
  const isOrbitTier = tierKey === 'platinum' || tierKey === 'diamond';

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
      }}
    >
      {/* 5. Orbit Ring (Platinum and Diamond only) */}
      {showOrbitRing && isOrbitTier && (
        <div className="absolute -inset-[10%] pointer-events-none flex items-center justify-center overflow-visible z-0">
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full overflow-visible"
            style={{
              animation: 'rankBadgeRotate 20s linear infinite',
              animationDelay: `${delay}s`,
              willChange: 'transform',
            }}
          >
            <circle
              cx="50"
              cy="50"
              r="48"
              fill="none"
              stroke={`rgba(${glowRgb}, 0.35)`}
              strokeWidth="1"
              strokeDasharray="4 6"
            />
          </svg>
        </div>
      )}

      {/* 1. Float Wrapper (drifts up and down 6px over 6s) */}
      <div
        className="relative w-full h-full flex items-center justify-center overflow-visible"
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
          {/* Inner Scale Wrapper: applies --badge-scale so shield matches Silver ~145px without clobbering float/hover */}
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

            {/* 3. Shine Sweep: Clipped to badge PNG via CSS mask, perfectly synced inside scale wrapper */}
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
                  background:
                    'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.75) 50%, transparent 100%)',
                  animation: 'rankBadgeShine 5s cubic-bezier(0.4, 0, 0.2, 1) infinite',
                  animationDelay: `${delay + 1.2}s`,
                  willChange: 'transform, opacity',
                }}
              />
            </div>
          </div>

          {/* 4. Sparkles (Gold and Diamond only: 3 tiny 4px glowing dots) */}
          {isSparkleTier && (
            <div className="absolute inset-0 pointer-events-none overflow-visible">
              {/* Sparkle 1 */}
              <div
                className="absolute w-1 h-1 rounded-full bg-white pointer-events-none"
                style={{
                  top: '18%',
                  left: '20%',
                  boxShadow: `0 0 6px 1px rgba(${glowRgb}, 0.85)`,
                  animation: 'rankBadgeSparkle 3s ease-in-out infinite',
                  animationDelay: `${delay}s`,
                  willChange: 'transform, opacity',
                }}
              />
              {/* Sparkle 2 */}
              <div
                className="absolute w-1 h-1 rounded-full bg-white pointer-events-none"
                style={{
                  top: '24%',
                  right: '20%',
                  boxShadow: `0 0 6px 1px rgba(${glowRgb}, 0.85)`,
                  animation: 'rankBadgeSparkle 3s ease-in-out infinite',
                  animationDelay: `${delay + 1.0}s`,
                  willChange: 'transform, opacity',
                }}
              />
              {/* Sparkle 3 */}
              <div
                className="absolute w-1 h-1 rounded-full bg-white pointer-events-none"
                style={{
                  bottom: '20%',
                  left: '48%',
                  boxShadow: `0 0 6px 1px rgba(${glowRgb}, 0.85)`,
                  animation: 'rankBadgeSparkle 3s ease-in-out infinite',
                  animationDelay: `${delay + 2.0}s`,
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
