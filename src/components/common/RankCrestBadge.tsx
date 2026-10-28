import React, { useEffect, useState, useMemo } from 'react';
import { RankTierName } from '../../lib/rankedSystem';
import { getRankTheme } from '../../lib/rankTheme';
import {
  getRankBadgeSources,
  isRankBadgeCached,
  markRankBadgeCached,
} from '../../lib/preloadRankBadges';

interface RankCrestBadgeProps {
  tier: RankTierName;
  division?: string;
  size?: number | string;
  className?: string;
  isGhost?: boolean;
  ghostColor?: string;
  isSettled?: boolean;
  priority?: boolean;
  interactive?: boolean;
}

const TIER_SCALES: Record<string, number> = {
  Bronze: 1.0,
  Silver: 1.06,
  Gold: 1.12,
  Platinum: 1.18,
  Diamond: 1.25,
  Champion: 1.38,
  Master: 1.44,
  Grandmaster: 1.50,
};

// Moving particle color configurations per rank tier
interface ParticleConfig {
  colors: string[];
  count: number;
}

const TIER_PARTICLES: Record<RankTierName, ParticleConfig> = {
  Bronze: {
    colors: ['#F59E0B', '#D97706', '#FBBF24'],
    count: 5,
  },
  Silver: {
    colors: ['#FFFFFF', '#E2E8F0', '#CBD5E1'],
    count: 5,
  },
  Gold: {
    colors: ['#FACC15', '#FEF08A', '#EAB308'],
    count: 6,
  },
  Platinum: {
    colors: ['#22D3EE', '#67E8F9', '#38BDF8'],
    count: 6,
  },
  Diamond: {
    colors: ['#E0F2FE', '#C084FC', '#A5F3FC'],
    count: 7,
  },
  Champion: {
    colors: ['#D8B4FE', '#FDE047', '#E879F9'],
    count: 7,
  },
  Master: {
    colors: ['#818CF8', '#FB7185', '#C084FC'],
    count: 8,
  },
  Grandmaster: {
    colors: ['#FF3366', '#FACC15', '#FFFFFF', '#FB7185'],
    count: 9,
  },
};

export function RankCrestBadge({
  tier,
  division,
  size = 72,
  className = '',
  isGhost = false,
  ghostColor,
  isSettled = true,
  priority = false,
  interactive = true,
}: RankCrestBadgeProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const scale = TIER_SCALES[tier] || 1.0;
  const actualSize = typeof size === 'number' ? size * scale : `calc(${size} * ${scale})`;
  const numericSize = typeof size === 'number' ? size : parseInt(String(size), 10) || 72;
  const isCompact = numericSize <= 42;

  const sources = getRankBadgeSources(tier, division);
  const theme = getRankTheme(tier);

  // Track dynamically loaded URLs in component state
  const [loadedMap, setLoadedMap] = useState<Record<string, boolean>>({});
  const [hasError, setHasError] = useState(false);

  // Instant display if already cached in browser memory, otherwise resolve via effect
  const isLoaded = Boolean(
    isRankBadgeCached(sources.webp) ||
    isRankBadgeCached(sources.png) ||
    loadedMap[sources.webp] ||
    loadedMap[sources.png]
  );

  useEffect(() => {
    if (isRankBadgeCached(sources.webp) || isRankBadgeCached(sources.png)) {
      return;
    }

    let active = true;
    const img = new Image();
    if (priority && 'fetchPriority' in img) {
      (img as HTMLImageElement & { fetchPriority: string }).fetchPriority = 'high';
    }
    img.onload = () => {
      markRankBadgeCached(sources.webp);
      markRankBadgeCached(sources.png);
      if (active) {
        setLoadedMap((prev) => ({ ...prev, [sources.webp]: true }));
      }
    };
    img.onerror = () => {
      const fallbackImg = new Image();
      fallbackImg.onload = () => {
        markRankBadgeCached(sources.png);
        if (active) {
          setLoadedMap((prev) => ({ ...prev, [sources.png]: true }));
        }
      };
      fallbackImg.onerror = () => {
        if (active) {
          setHasError(true);
        }
      };
      fallbackImg.src = sources.png;
    };
    img.src = sources.webp;

    return () => {
      active = false;
    };
  }, [sources.webp, sources.png, priority]);

  const showEffects = isSettled && !isGhost && !prefersReducedMotion;

  // Precompute deterministic moving particles for this rank tier
  const particleMotes = useMemo(() => {
    const config = TIER_PARTICLES[tier] || TIER_PARTICLES.Bronze;
    const count = isCompact ? Math.min(3, config.count) : config.count;

    return Array.from({ length: count }).map((_, i) => {
      const color = config.colors[i % config.colors.length];
      const left = 10 + ((i * 37) % 78);
      const bottom = 8 + ((i * 23) % 45);
      const sizePx = 2.5 + ((i * 0.8) % 2.5);
      const dur = 2.4 + ((i * 0.7) % 2.0);
      const delay = (i * 0.5) % 2.8;
      const driftX = ((i % 2 === 0 ? 1 : -1) * (4 + ((i * 3) % 8))) + 'px';
      const driftY = (-30 - ((i * 4) % 18)) + 'px';

      return {
        id: i,
        color,
        left: `${left}%`,
        bottom: `${bottom}%`,
        sizePx,
        dur,
        delay,
        driftX,
        driftY,
      };
    });
  }, [tier, isCompact]);

  const staticFilter = isGhost && ghostColor
    ? `drop-shadow(0 0 10px ${ghostColor})`
    : `drop-shadow(0 6px 14px rgba(0,0,0,0.45)) drop-shadow(0 0 8px ${theme.accent}33)`;
  const tierLower = tier.toLowerCase();

  return (
    <div
      className={`group/crest relative flex items-center justify-center select-none ${className}`}
      style={{ width: actualSize, height: actualSize, minWidth: actualSize }}
    >
      {/* =========================================================================
          SMOOTH LEVITATION & TACTILE HOVER WRAPPER
          ========================================================================= */}
      <div
        className={`relative w-full h-full flex items-center justify-center ${
          interactive ? 'transition-transform duration-400 ease-out group-hover/crest:-translate-y-1 group-hover/crest:scale-105 group-active/crest:scale-95' : ''
        }`}
        style={{
          animation: showEffects ? 'classicCrestFloat 5.5s ease-in-out infinite' : 'none',
          willChange: 'transform',
        }}
      >
        {/* Soft round dark tile behind crest in Paper theme only for contrast */}
        <div
          className="absolute inset-[8%] rounded-full pointer-events-none opacity-0 [[data-theme='paper']_&]:opacity-100 transition-opacity z-[5]"
          style={{
            background: 'radial-gradient(circle, rgba(27, 26, 24, 0.12) 0%, rgba(27, 26, 24, 0.04) 70%, transparent 100%)',
          }}
        />

        {/* =========================================================================
            IMMEDIATE FALLBACK / SKELETON PLACEHOLDER
            ========================================================================= */}
        <div
          className={`absolute inset-0 flex items-center justify-center pointer-events-none z-[6] transition-opacity duration-300 ${
            isLoaded && !hasError ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Radial ambient glow matching the tier's authentic accent color */}
            <div
              className="absolute inset-[15%] rounded-full blur-xl pointer-events-none"
              style={{
                background: `radial-gradient(circle, ${theme.accent}38 0%, ${theme.accent}12 55%, transparent 75%)`,
              }}
            />

            {/* Stylized Vector Crest Shield Silhouette */}
            <svg
              viewBox="0 0 100 100"
              className="w-[82%] h-[82%] overflow-visible"
              style={{
                filter: `drop-shadow(0 0 10px ${theme.accent}55)`,
              }}
            >
              <defs>
                <linearGradient id={`crest-bg-${tierLower}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={theme.accent} stopOpacity="0.25" />
                  <stop offset="50%" stopColor={theme.accent} stopOpacity="0.10" />
                  <stop offset="100%" stopColor={theme.accent} stopOpacity="0.03" />
                </linearGradient>
                <linearGradient id={`crest-border-${tierLower}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={theme.accent} stopOpacity="0.75" />
                  <stop offset="50%" stopColor={theme.accent} stopOpacity="0.35" />
                  <stop offset="100%" stopColor={theme.accent} stopOpacity="0.15" />
                </linearGradient>
                <clipPath id={`crest-clip-${tierLower}`}>
                  <path d="M50 8 L84 24 L76 72 L50 94 L24 72 L16 24 Z" />
                </clipPath>
              </defs>

              {/* Shield Outline Body */}
              <path
                d="M50 8 L84 24 L76 72 L50 94 L24 72 L16 24 Z"
                fill={`url(#crest-bg-${tierLower})`}
                stroke={`url(#crest-border-${tierLower})`}
                strokeWidth="2.2"
                strokeLinejoin="round"
              />

              {/* Inner faceted chevron lines */}
              <path
                d="M50 20 L72 32 L66 64 L50 80 L34 64 L28 32 Z"
                fill="none"
                stroke={theme.accent}
                strokeOpacity="0.25"
                strokeWidth="1.2"
                strokeDasharray="2 3"
              />

              {/* Shield Center Ribs */}
              <line x1="50" y1="12" x2="50" y2="86" stroke={theme.accent} strokeOpacity="0.2" strokeWidth="1" />
              <line x1="28" y1="50" x2="72" y2="50" stroke={theme.accent} strokeOpacity="0.15" strokeWidth="1" />

              {/* Center Tier / Division Monogram */}
              <text
                x="50"
                y="53"
                textAnchor="middle"
                dominantBaseline="central"
                fill={theme.accent}
                fontSize="14"
                fontWeight="700"
                letterSpacing="0.06em"
                opacity="0.7"
                className="font-mono select-none"
              >
                {division || tier.charAt(0)}
              </text>
            </svg>
          </div>
        </div>

        {/* =========================================================================
            BADGE IMAGE (Clean, sharp, static shadow - NO slow blinking)
            ========================================================================= */}
        <picture
          className="relative w-full h-full flex items-center justify-center z-10"
          style={{
            filter: staticFilter,
          }}
        >
          <source srcSet={sources.webp} type="image/webp" />
          <img
            src={sources.png}
            alt={`${tier} ${division || ''} Rank Badge`}
            loading="eager"
            decoding="async"
            onLoad={() => {
              markRankBadgeCached(sources.webp);
              markRankBadgeCached(sources.png);
              setLoadedMap((prev) => ({ ...prev, [sources.webp]: true, [sources.png]: true }));
            }}
            onError={() => {
              if (!isLoaded) {
                setHasError(true);
              }
            }}
            className={`relative w-full h-full object-contain select-none transition-all duration-400 ease-out group-hover/crest:brightness-105 ${
              isLoaded && !hasError ? 'opacity-100' : 'opacity-0'
            }`}
            draggable={false}
          />
        </picture>

        {/* =========================================================================
            MOVING PARTICLES (Tier-specific floating sparks & motes)
            ========================================================================= */}
        {showEffects && isLoaded && (
          <div className="absolute inset-[-15%] pointer-events-none z-20 overflow-visible">
            {particleMotes.map((p) => (
              <div
                key={p.id}
                className="absolute rounded-full pointer-events-none"
                style={{
                  left: p.left,
                  bottom: p.bottom,
                  width: `${p.sizePx}px`,
                  height: `${p.sizePx}px`,
                  backgroundColor: p.color,
                  boxShadow: `0 0 5px 1px ${p.color}, 0 0 10px ${p.color}88`,
                  animation: `rankParticleFloat ${p.dur}s ease-in-out infinite ${p.delay}s`,
                  ['--p-drift-x' as any]: p.driftX,
                  ['--p-drift-y' as any]: p.driftY,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
