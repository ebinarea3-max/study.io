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

export function RankCrestBadge({
  tier,
  division,
  size = 72,
  className = '',
  isGhost = false,
  ghostColor,
  isSettled = true,
  priority = false,
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
      // Fallback to png if webp failed
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

  // Animation classes
  let breatheClass = '';
  let effectCycle = '4s';
  let sparklesCount = 0;
  let sparklesColor = '#fff';
  let sparklesType = 'drift';
  let hasSweep = false;
  let sweepCycle = '4s';
  let sweepColor = 'rgba(255,255,255,0.4)';
  let hasGlint = false;
  let hasOrbit = false;

  if (tier === 'Bronze') {
    breatheClass = 'rankBreatheBronze'; effectCycle = '5s';
  } else if (tier === 'Silver') {
    breatheClass = 'rankBreatheSilver'; effectCycle = '5s';
    sparklesCount = 1; sparklesColor = '#fff'; sparklesType = 'path';
  } else if (tier === 'Gold') {
    breatheClass = 'rankBreatheGold'; effectCycle = '4s';
    sparklesCount = division === 'IV' ? 5 : 3; sparklesColor = '#FFD700';
  } else if (tier === 'Platinum') {
    breatheClass = 'rankBreathePlatinum'; effectCycle = '3.5s';
    hasSweep = true; sweepCycle = '8s'; sweepColor = 'rgba(0,255,255,0.3)';
    sparklesCount = division === 'IV' ? 6 : (division === 'III' ? 5 : (division === 'II' ? 4 : 3));
    sparklesColor = '#00FFFF';
  } else if (tier === 'Diamond') {
    breatheClass = 'rankBreatheDiamond'; effectCycle = '3s';
    hasSweep = true; sweepCycle = '5s'; sweepColor = 'rgba(255,255,255,0.6)';
    hasGlint = true;
    sparklesCount = division === 'IV' ? 8 : (division === 'III' ? 7 : (division === 'II' ? 6 : 5));
    sparklesColor = '#E0F7FA';
  } else if (tier === 'Champion') {
    breatheClass = 'rankBreatheChampion'; effectCycle = '2.5s';
    hasSweep = true; sweepCycle = '4s'; sweepColor = 'rgba(255,215,0,0.5)';
    sparklesCount = 7; sparklesColor = '#FFD700';
  } else if (tier === 'Master') {
    breatheClass = 'rankBreatheMaster'; effectCycle = '2.5s';
    hasSweep = true; sweepCycle = '4s'; sweepColor = 'rgba(255,100,50,0.5)';
    sparklesCount = 8; sparklesColor = '#FF4500'; sparklesType = 'ember';
  } else if (tier === 'Grandmaster') {
    breatheClass = 'rankBreatheGrandmaster'; effectCycle = '2s';
    hasOrbit = true; sparklesCount = 4; sparklesColor = '#FFD700';
  }

  // Precompute deterministic sparkle positions to ensure render purity
  const sparkleMotes = useMemo(() => {
    return Array.from({ length: 8 }).map((_, i) => ({
      left: 20 + ((i * 37) % 60),
      top: 30 + ((i * 43) % 50),
      delay: (i * 0.7) % 4,
      dur: 3 + ((i * 0.9) % 3),
      size: 2 + ((i * 0.8) % 2.5),
    }));
  }, []);

  const staticFilter = isGhost && ghostColor ? `drop-shadow(0 0 10px ${ghostColor})` : `drop-shadow(0 4px 12px rgba(0,0,0,0.5))`;
  const tierLower = tier.toLowerCase();

  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{ width: actualSize, height: actualSize, minWidth: actualSize }}
    >
      {/* Glow Layer */}
      {showEffects ? (
        <div
          className="absolute inset-0 rounded-full"
          style={{
            animation: `${breatheClass} ${effectCycle} ease-in-out infinite`,
            willChange: 'filter',
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
        <div className="relative w-full h-full flex items-center justify-center animate-crest-pulse">
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

            {/* Dynamic Light Shimmer Sweep across the shield */}
            {!prefersReducedMotion && (
              <g clipPath={`url(#crest-clip-${tierLower})`}>
                <rect
                  x="-80"
                  y="-30"
                  width="45"
                  height="160"
                  fill="white"
                  opacity="0.15"
                  className="animate-crest-shimmer pointer-events-none"
                />
              </g>
            )}

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
          OPTIMIZED BADGE IMAGE: Primary WebP with PNG fallback
          ========================================================================= */}
      <picture className="relative w-full h-full flex items-center justify-center z-10">
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
            // If primary image fails, mark error so the crisp vector skeleton remains
            if (!isLoaded) {
              setHasError(true);
            }
          }}
          className={`relative w-full h-full object-contain select-none transition-opacity duration-300 ${
            isLoaded && !hasError ? 'opacity-100' : 'opacity-0'
          }`}
          draggable={false}
        />
      </picture>

      {/* Sweep Layer */}
      {showEffects && hasSweep && (
        <div
          className="absolute inset-[10%] rounded-full pointer-events-none mix-blend-overlay overflow-hidden opacity-60 z-20"
          style={{ maskImage: 'radial-gradient(circle at center, black 65%, transparent 75%)', WebkitMaskImage: 'radial-gradient(circle at center, black 65%, transparent 75%)' }}
        >
          <div
            className="w-full h-full rounded-full"
            style={{
              background: `conic-gradient(from 0deg at 50% 50%, transparent 0deg, ${sweepColor} 45deg, transparent 90deg)`,
              animation: `sweepConic ${sweepCycle} linear infinite`,
              willChange: 'transform',
            }}
          />
        </div>
      )}

      {/* Particles */}
      {showEffects && sparklesCount > 0 && (
        <div className="absolute inset-[-20%] pointer-events-none z-30">
          {Array.from({ length: sparklesCount }).map((_, i) => {
            if (hasOrbit) {
              return (
                <div key={i} className="absolute inset-0 flex items-center justify-center">
                  <div
                    className="absolute w-[80%] h-[80%]"
                    style={{
                      animation: `spin 8s linear infinite`,
                      animationDelay: `-${i * (8 / sparklesCount)}s`,
                    }}
                  >
                    <div
                      className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full"
                      style={{
                        backgroundColor: sparklesColor,
                        boxShadow: `0 0 6px ${sparklesColor}`,
                      }}
                    />
                  </div>
                </div>
              );
            }
            if (sparklesType === 'path') {
              return (
                <div key={i} className="absolute inset-0 flex items-center justify-center">
                  <div
                    className="absolute w-[2px] h-[2px] rounded-full bg-white opacity-0"
                    style={{ animation: 'silverSparkPath 4s ease-in-out infinite' }}
                  />
                </div>
              );
            }

            const mote = sparkleMotes[i % sparkleMotes.length];

            return (
              <div
                key={i}
                className="absolute rounded-full opacity-0"
                style={{
                  left: `${mote.left}%`,
                  top: `${mote.top}%`,
                  width: `${mote.size}px`,
                  height: `${mote.size}px`,
                  backgroundColor: sparklesColor,
                  boxShadow: `0 0 6px ${sparklesColor}`,
                  animation: `driftUpward ${mote.dur}s ease-in infinite ${mote.delay}s`,
                }}
              />
            );
          })}
        </div>
      )}

      {/* Diamond Glint */}
      {showEffects && hasGlint && (
        <div
          className="absolute top-[25%] right-[30%] w-3 h-3 rounded-full bg-white opacity-0 z-30 pointer-events-none"
          style={{
            boxShadow: '0 0 15px 5px rgba(255,255,255,0.8)',
            animation: 'glintFlash 8s infinite 2s',
          }}
        />
      )}
    </div>
  );
}
