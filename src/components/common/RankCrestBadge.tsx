import React, { useEffect, useState } from 'react';
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

/**
 * Classic 4-pointed jewel star glint SVG for precious gemstones & metals
 */
function ClassicStarGlint({
  className = '',
  style,
  size = 13,
}: {
  className?: string;
  style?: React.CSSProperties;
  size?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={`absolute pointer-events-none ${className}`}
      style={style}
    >
      <path
        d="M12 0 C12 6.6 17.4 12 24 12 C17.4 12 12 17.4 12 24 C12 17.4 6.6 12 0 12 C6.6 12 12 6.6 12 0 Z"
        fill="#FFFFFF"
      />
      <circle cx="12" cy="12" r="2.2" fill="#FFFFFF" />
    </svg>
  );
}

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

  // Classic Aesthetic Tier Configuration
  let glowClass = 'classicGlowBronze';
  let auraGradient = 'radial-gradient(circle at 50% 50%, rgba(180, 83, 9, 0.45) 0%, rgba(120, 53, 15, 0.15) 55%, transparent 75%)';
  let sheenGradient = 'linear-gradient(105deg, transparent 20%, rgba(251, 191, 36, 0.25) 45%, rgba(255, 255, 255, 0.55) 50%, rgba(251, 191, 36, 0.25) 55%, transparent 80%)';
  let hasJewelGlint = false;
  let glintPos: React.CSSProperties = { top: '20%', right: '24%' };

  if (tier === 'Bronze') {
    glowClass = 'classicGlowBronze';
    auraGradient = 'radial-gradient(circle at 50% 50%, rgba(180, 83, 9, 0.42) 0%, rgba(120, 53, 15, 0.12) 55%, transparent 75%)';
    sheenGradient = 'linear-gradient(105deg, transparent 20%, rgba(245, 158, 11, 0.2) 45%, rgba(255, 255, 255, 0.5) 50%, rgba(245, 158, 11, 0.2) 55%, transparent 80%)';
  } else if (tier === 'Silver') {
    glowClass = 'classicGlowSilver';
    auraGradient = 'radial-gradient(circle at 50% 50%, rgba(203, 213, 225, 0.42) 0%, rgba(148, 163, 184, 0.12) 55%, transparent 75%)';
    sheenGradient = 'linear-gradient(105deg, transparent 20%, rgba(255, 255, 255, 0.3) 45%, rgba(255, 255, 255, 0.75) 50%, rgba(255, 255, 255, 0.3) 55%, transparent 80%)';
  } else if (tier === 'Gold') {
    glowClass = 'classicGlowGold';
    auraGradient = 'radial-gradient(circle at 50% 50%, rgba(234, 179, 8, 0.46) 0%, rgba(161, 98, 7, 0.15) 55%, transparent 75%)';
    sheenGradient = 'linear-gradient(105deg, transparent 20%, rgba(250, 204, 21, 0.35) 45%, rgba(255, 255, 255, 0.8) 50%, rgba(250, 204, 21, 0.35) 55%, transparent 80%)';
  } else if (tier === 'Platinum') {
    glowClass = 'classicGlowPlatinum';
    auraGradient = 'radial-gradient(circle at 50% 50%, rgba(45, 212, 191, 0.46) 0%, rgba(13, 148, 136, 0.15) 55%, transparent 75%)';
    sheenGradient = 'linear-gradient(105deg, transparent 20%, rgba(103, 232, 249, 0.35) 45%, rgba(255, 255, 255, 0.8) 50%, rgba(103, 232, 249, 0.35) 55%, transparent 80%)';
  } else if (tier === 'Diamond') {
    glowClass = 'classicGlowDiamond';
    auraGradient = 'radial-gradient(circle at 50% 50%, rgba(168, 85, 247, 0.48) 0%, rgba(56, 189, 248, 0.18) 55%, transparent 75%)';
    sheenGradient = 'linear-gradient(105deg, transparent 20%, rgba(192, 132, 252, 0.35) 45%, rgba(255, 255, 255, 0.85) 50%, rgba(125, 211, 252, 0.35) 55%, transparent 80%)';
    hasJewelGlint = true;
    glintPos = { top: '22%', right: '22%' };
  } else if (tier === 'Champion') {
    glowClass = 'classicGlowChampion';
    auraGradient = 'radial-gradient(circle at 50% 50%, rgba(168, 85, 247, 0.52) 0%, rgba(234, 179, 8, 0.2) 55%, transparent 75%)';
    sheenGradient = 'linear-gradient(105deg, transparent 20%, rgba(250, 204, 21, 0.38) 45%, rgba(255, 255, 255, 0.85) 50%, rgba(192, 132, 252, 0.38) 55%, transparent 80%)';
    hasJewelGlint = true;
    glintPos = { top: '18%', right: '26%' };
  } else if (tier === 'Master') {
    glowClass = 'classicGlowMaster';
    auraGradient = 'radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.52) 0%, rgba(225, 29, 72, 0.22) 55%, transparent 75%)';
    sheenGradient = 'linear-gradient(105deg, transparent 20%, rgba(129, 140, 248, 0.38) 45%, rgba(255, 255, 255, 0.85) 50%, rgba(244, 63, 94, 0.38) 55%, transparent 80%)';
    hasJewelGlint = true;
    glintPos = { top: '16%', right: '28%' };
  } else if (tier === 'Grandmaster') {
    glowClass = 'classicGlowGrandmaster';
    auraGradient = 'radial-gradient(circle at 50% 50%, rgba(244, 63, 94, 0.55) 0%, rgba(234, 179, 8, 0.25) 55%, transparent 75%)';
    sheenGradient = 'linear-gradient(105deg, transparent 20%, rgba(251, 113, 133, 0.42) 45%, rgba(255, 255, 255, 0.95) 50%, rgba(250, 204, 21, 0.42) 55%, transparent 80%)';
    hasJewelGlint = true;
    glintPos = { top: '14%', right: '30%' };
  }

  const staticFilter = isGhost && ghostColor
    ? `drop-shadow(0 0 10px ${ghostColor})`
    : `drop-shadow(0 4px 12px rgba(0,0,0,0.5))`;
  const tierLower = tier.toLowerCase();

  return (
    <div
      className={`group/crest relative flex items-center justify-center select-none ${className}`}
      style={{ width: actualSize, height: actualSize, minWidth: actualSize }}
    >
      {/* =========================================================================
          SMOOTH LEVITATION & TACTILE HOVER WRAPPER
          Clean, weighted 3D micro-float with smooth elevation on hover.
          ========================================================================= */}
      <div
        className={`relative w-full h-full flex items-center justify-center ${
          interactive ? 'transition-transform duration-500 ease-out group-hover/crest:-translate-y-1 group-hover/crest:scale-105 group-active/crest:scale-95' : ''
        }`}
        style={{
          animation: showEffects ? 'classicCrestFloat 5.5s ease-in-out infinite' : 'none',
          willChange: 'transform',
        }}
      >
        {/* =========================================================================
            ATMOSPHERIC AMBIENT BACK-BLOOM (Soft luxury background halo)
            ========================================================================= */}
        {showEffects ? (
          <div
            className="absolute inset-[10%] rounded-full blur-2xl pointer-events-none transition-all duration-700 ease-out group-hover/crest:scale-115 group-hover/crest:opacity-90"
            style={{
              background: auraGradient,
              animation: 'classicAuraBreathe 6s ease-in-out infinite',
              willChange: 'transform, opacity',
              zIndex: 0,
            }}
          />
        ) : (
          <div className="absolute inset-0" style={{ filter: staticFilter, zIndex: 0 }} />
        )}

        {/* Soft round dark tile behind crest in Paper theme only for contrast */}
        <div
          className="absolute inset-[8%] rounded-full pointer-events-none opacity-0 [[data-theme='paper']_&]:opacity-100 transition-opacity z-[5]"
          style={{
            background: 'radial-gradient(circle, rgba(27, 26, 24, 0.12) 0%, rgba(27, 26, 24, 0.04) 70%, transparent 100%)',
          }}
        />

        {/* =========================================================================
            IMMEDIATE FALLBACK / SKELETON PLACEHOLDER
            Displays a glowing vector crest shield with active shimmer so there is
            never an empty void or layout shift while the image is loading.
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
            OPTIMIZED BADGE IMAGE WITH TIER-AUTHENTIC FORM-FITTING SILHOUETTE GLOW
            ========================================================================= */}
        <picture
          className="relative w-full h-full flex items-center justify-center z-10"
          style={{
            animation: showEffects ? `${glowClass} 5s ease-in-out infinite` : 'none',
            willChange: 'filter',
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
            className={`relative w-full h-full object-contain select-none transition-all duration-500 ease-out group-hover/crest:brightness-105 ${
              isLoaded && !hasError ? 'opacity-100' : 'opacity-0'
            }`}
            draggable={false}
          />
        </picture>

        {/* =========================================================================
            CLASSIC SPECULAR LIGHT SHEEN (The "Liquid Light" Metal Sweep)
            ========================================================================= */}
        {showEffects && isLoaded && (
          <div
            className="absolute inset-[6%] rounded-full pointer-events-none mix-blend-screen overflow-hidden opacity-60 group-hover/crest:opacity-90 transition-opacity duration-500 z-20"
            style={{
              maskImage: 'radial-gradient(circle at center, black 65%, transparent 80%)',
              WebkitMaskImage: 'radial-gradient(circle at center, black 65%, transparent 80%)',
            }}
          >
            <div
              className="w-[180%] h-[32%] -left-[40%] top-[34%] absolute rounded-full blur-[2px]"
              style={{
                background: sheenGradient,
                animation: 'classicMetalSheen 6s cubic-bezier(0.2, 0.8, 0.2, 1) infinite',
                willChange: 'transform, opacity',
              }}
            />
          </div>
        )}

        {/* =========================================================================
            DELICATE JEWEL STAR GLINT (Diamond, Champion, Master, Grandmaster)
            ========================================================================= */}
        {showEffects && hasJewelGlint && isLoaded && !isCompact && (
          <div className="absolute inset-0 pointer-events-none z-30">
            <ClassicStarGlint
              size={13}
              style={{
                ...glintPos,
                animation: 'classicJewelGlint 5.5s ease-in-out infinite 2s',
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
