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
}

const TIER_GLOW_RGB: Record<RankBadgeTier, string> = {
  silver: '160, 180, 230',
  gold: '255, 170, 40',
  platinum: '40, 200, 230',
  diamond: '150, 90, 255',
  bronze: '190, 120, 60',
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
 * Reusable RankBadge with subtle, calm idle animations:
 * 1. Float (all ranks): up and down 6px over 6s
 * 2. Glow breathing (all ranks): animated drop-shadow over 3.5s in rank color
 * 3. Shine sweep (all ranks): diagonal light streak masked to PNG silhouette over 5s
 * 4. Sparkles (gold & diamond only): 3 twinkling dots at staggered delays over 3s
 * 5. Orbit ring (platinum & diamond only): slow-rotating 20s thin dashed ring
 * 6. Hover: smooth scale to 1.06
 */
export function RankBadge({
  src,
  tier,
  delay = 0,
  size = 120,
  className = '',
  alt = 'Rank Badge',
  priority = false,
  showOrbitRing = true,
}: RankBadgeProps) {
  const tierKey: RankBadgeTier = tier || 'silver';
  const glowRgb = TIER_GLOW_RGB[tierKey] || TIER_GLOW_RGB.silver;
  const isSparkleTier = tierKey === 'gold' || tierKey === 'diamond';
  const isOrbitTier = tierKey === 'platinum' || tierKey === 'diamond';

  const pixelSize = typeof size === 'number' ? `${size}px` : size;

  return (
    <div
      className={`rank-badge-root rank-badge-animated rank-badge-interactive relative flex items-center justify-center select-none ${className}`}
      style={{
        width: pixelSize,
        height: pixelSize,
        minWidth: pixelSize,
        minHeight: pixelSize,
      }}
    >
      {/* 5. Orbit Ring (Platinum and Diamond only) */}
      {showOrbitRing && isOrbitTier && (
        <div className="absolute -inset-[8%] pointer-events-none flex items-center justify-center z-0">
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full"
            style={{
              animation: 'rankBadgeRotate 20s linear infinite',
              animationDelay: `${delay}s`,
              willChange: 'transform',
            }}
          >
            <circle
              cx="50"
              cy="50"
              r="47"
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
        className="relative w-full h-full flex items-center justify-center"
        style={{
          animation: 'rankBadgeFloat 6s ease-in-out infinite',
          animationDelay: `${delay}s`,
          willChange: 'transform',
        }}
      >
        {/* 2. Glow Breathing Wrapper (drop-shadow pulsing over 3.5s) */}
        <div
          className="relative w-full h-full flex items-center justify-center"
          style={{
            animation: `rankBadgeGlow-${tierKey} 3.5s ease-in-out infinite`,
            animationDelay: `${delay}s`,
            willChange: 'filter',
          }}
        >
          {/* Badge Image Base */}
          <img
            src={src}
            alt={alt}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            draggable={false}
            className="relative w-full h-full object-contain pointer-events-none select-none"
          />

          {/* 3. Shine Sweep (clipped to badge PNG shape via CSS mask) */}
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

          {/* 4. Sparkles (Gold and Diamond only: 3 tiny 4px glowing dots) */}
          {isSparkleTier && (
            <>
              {/* Sparkle 1 */}
              <div
                className="absolute w-1 h-1 rounded-full bg-white pointer-events-none"
                style={{
                  top: '20%',
                  left: '22%',
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
                  top: '26%',
                  right: '22%',
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
                  bottom: '22%',
                  left: '48%',
                  boxShadow: `0 0 6px 1px rgba(${glowRgb}, 0.85)`,
                  animation: 'rankBadgeSparkle 3s ease-in-out infinite',
                  animationDelay: `${delay + 2.0}s`,
                  willChange: 'transform, opacity',
                }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
