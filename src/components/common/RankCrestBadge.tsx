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

/**
 * 4-Pointed Star Glint SVG for precious metal & diamond facets
 */
function StarGlint({
  className = '',
  style,
  color = '#ffffff',
  size = 14,
}: {
  className?: string;
  style?: React.CSSProperties;
  color?: string;
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
        fill={color}
      />
      <circle cx="12" cy="12" r="2.5" fill="#ffffff" />
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
  const [isHovered, setIsHovered] = useState(false);

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

  // Tier-tailored animation properties
  let breatheClass = 'rankBreatheBronze';
  let effectCycle = '4.5s';
  let sparklesCount = 0;
  let sparklesColor = '#D97706';
  let sparklesType: 'ember' | 'silver' | 'starlight' | 'plasma' | 'diamondStar' | 'royal' | 'voidEmber' | 'celestial' = 'ember';
  let auraColorPrimary = 'rgba(217, 119, 6, 0.35)';
  let auraColorSecondary = 'rgba(146, 64, 14, 0.15)';
  let hasGleam = true;
  let gleamColor = 'rgba(255, 255, 255, 0.4)';
  let gleamCycle = '5s';
  let hasConicSweep = false;
  let sweepCycle = '4s';
  let sweepColor = 'rgba(255,255,255,0.4)';
  let hasGlintStars = false;
  let hasCoronaRing = false;
  let hasDualOrbit = false;

  if (tier === 'Bronze') {
    breatheClass = 'rankBreatheBronze';
    effectCycle = '4.5s';
    sparklesCount = 3;
    sparklesColor = '#F59E0B';
    sparklesType = 'ember';
    auraColorPrimary = 'rgba(217, 119, 6, 0.35)';
    auraColorSecondary = 'rgba(146, 64, 14, 0.12)';
    gleamColor = 'rgba(251, 191, 36, 0.35)';
    gleamCycle = '6s';
  } else if (tier === 'Silver') {
    breatheClass = 'rankBreatheSilver';
    effectCycle = '4.5s';
    sparklesCount = 3;
    sparklesColor = '#F1F5F9';
    sparklesType = 'silver';
    hasGlintStars = true;
    auraColorPrimary = 'rgba(203, 213, 225, 0.4)';
    auraColorSecondary = 'rgba(148, 163, 184, 0.15)';
    gleamColor = 'rgba(255, 255, 255, 0.55)';
    gleamCycle = '5s';
  } else if (tier === 'Gold') {
    breatheClass = 'rankBreatheGold';
    effectCycle = '4s';
    sparklesCount = division === 'IV' ? 6 : (division === 'III' ? 5 : 4);
    sparklesColor = '#FACC15';
    sparklesType = 'starlight';
    auraColorPrimary = 'rgba(234, 179, 8, 0.45)';
    auraColorSecondary = 'rgba(161, 98, 7, 0.18)';
    gleamColor = 'rgba(254, 240, 138, 0.6)';
    gleamCycle = '4.5s';
  } else if (tier === 'Platinum') {
    breatheClass = 'rankBreathePlatinum';
    effectCycle = '3.5s';
    hasConicSweep = true;
    sweepCycle = '6s';
    sweepColor = 'rgba(6, 182, 212, 0.35)';
    sparklesCount = division === 'IV' ? 6 : (division === 'III' ? 5 : 4);
    sparklesColor = '#22D3EE';
    sparklesType = 'plasma';
    auraColorPrimary = 'rgba(6, 182, 212, 0.45)';
    auraColorSecondary = 'rgba(14, 116, 144, 0.2)';
    gleamColor = 'rgba(165, 243, 252, 0.65)';
    gleamCycle = '4s';
  } else if (tier === 'Diamond') {
    breatheClass = 'rankBreatheDiamond';
    effectCycle = '3s';
    hasConicSweep = true;
    sweepCycle = '5s';
    sweepColor = 'rgba(168, 85, 247, 0.4)';
    hasGlintStars = true;
    sparklesCount = division === 'IV' ? 8 : (division === 'III' ? 7 : 5);
    sparklesColor = '#E0F2FE';
    sparklesType = 'diamondStar';
    auraColorPrimary = 'rgba(168, 85, 247, 0.5)';
    auraColorSecondary = 'rgba(56, 189, 248, 0.25)';
    gleamColor = 'rgba(255, 255, 255, 0.75)';
    gleamCycle = '3.5s';
  } else if (tier === 'Champion') {
    breatheClass = 'rankBreatheChampion';
    effectCycle = '2.8s';
    hasCoronaRing = true;
    hasConicSweep = true;
    sweepCycle = '4s';
    sweepColor = 'rgba(250, 204, 21, 0.45)';
    sparklesCount = 7;
    sparklesColor = '#FACC15';
    sparklesType = 'royal';
    auraColorPrimary = 'rgba(178, 79, 232, 0.55)';
    auraColorSecondary = 'rgba(234, 179, 8, 0.25)';
    gleamColor = 'rgba(253, 224, 71, 0.8)';
    gleamCycle = '3s';
  } else if (tier === 'Master') {
    breatheClass = 'rankBreatheMaster';
    effectCycle = '2.4s';
    hasCoronaRing = true;
    hasConicSweep = true;
    sweepCycle = '3.5s';
    sweepColor = 'rgba(99, 102, 241, 0.5)';
    sparklesCount = 8;
    sparklesColor = '#F43F5E';
    sparklesType = 'voidEmber';
    auraColorPrimary = 'rgba(99, 102, 241, 0.6)';
    auraColorSecondary = 'rgba(225, 29, 72, 0.3)';
    gleamColor = 'rgba(244, 63, 94, 0.85)';
    gleamCycle = '2.8s';
  } else if (tier === 'Grandmaster') {
    breatheClass = 'rankBreatheGrandmaster';
    effectCycle = '2s';
    hasCoronaRing = true;
    hasDualOrbit = true;
    hasGlintStars = true;
    hasConicSweep = true;
    sweepCycle = '3s';
    sweepColor = 'rgba(255, 51, 102, 0.6)';
    sparklesCount = 8;
    sparklesColor = '#FF3366';
    sparklesType = 'celestial';
    auraColorPrimary = 'rgba(255, 51, 102, 0.65)';
    auraColorSecondary = 'rgba(234, 179, 8, 0.35)';
    gleamColor = 'rgba(255, 255, 255, 0.95)';
    gleamCycle = '2.4s';
  }

  // Precompute deterministic sparkle positions to ensure render purity
  const sparkleMotes = useMemo(() => {
    return Array.from({ length: 10 }).map((_, i) => ({
      left: 15 + ((i * 37) % 70),
      top: 25 + ((i * 43) % 55),
      delay: (i * 0.6) % 3.5,
      dur: 2.8 + ((i * 0.7) % 2.5),
      size: 2 + ((i * 0.8) % 2.5),
      driftX: ((i % 2 === 0 ? 1 : -1) * (4 + (i % 6))) + 'px',
    }));
  }, []);

  const staticFilter = isGhost && ghostColor
    ? `drop-shadow(0 0 10px ${ghostColor})`
    : `drop-shadow(0 4px 12px rgba(0,0,0,0.5))`;
  const tierLower = tier.toLowerCase();

  return (
    <div
      onMouseEnter={() => interactive && setIsHovered(true)}
      onMouseLeave={() => interactive && setIsHovered(false)}
      className={`group/badge relative flex items-center justify-center select-none ${
        interactive ? 'transition-transform duration-300 ease-out hover:scale-105 active:scale-95' : ''
      } ${className}`}
      style={{ width: actualSize, height: actualSize, minWidth: actualSize }}
    >
      {/* =========================================================================
          BACKGROUND AMBIENT BLOOM AURA
          ========================================================================= */}
      {showEffects ? (
        <div
          className="absolute inset-[10%] rounded-full blur-xl pointer-events-none transition-opacity duration-500"
          style={{
            background: `radial-gradient(circle, ${auraColorPrimary} 0%, ${auraColorSecondary} 55%, transparent 75%)`,
            animation: `rankAuraPulse ${effectCycle} ease-in-out infinite`,
            opacity: isHovered ? 0.95 : 0.6,
            zIndex: 0,
          }}
        />
      ) : (
        <div className="absolute inset-0" style={{ filter: staticFilter, zIndex: 0 }} />
      )}

      {/* =========================================================================
          EXPANDING CORONA SHOCKWAVE (Champion & Grandmaster)
          ========================================================================= */}
      {showEffects && hasCoronaRing && !isCompact && (
        <div
          className="absolute inset-[-4%] rounded-full border pointer-events-none z-[1]"
          style={{
            borderColor: theme.accent,
            boxShadow: `0 0 14px ${theme.accent}66, inset 0 0 10px ${theme.accent}44`,
            animation: `rankCoronaExpand ${tier === 'Grandmaster' ? '2.4s' : '3.2s'} cubic-bezier(0.16, 1, 0.3, 1) infinite`,
          }}
        />
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
          OPTIMIZED BADGE IMAGE WITH FORM-FITTING SILHOUETTE GLOW ANIMATION
          ========================================================================= */}
      <picture
        className="relative w-full h-full flex items-center justify-center z-10"
        style={{
          animation: showEffects ? `${breatheClass} ${effectCycle} ease-in-out infinite` : 'none',
          willChange: 'filter, transform',
          filter: isHovered && showEffects ? 'brightness(1.15) contrast(1.05)' : undefined,
          transition: 'filter 0.3s ease',
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
          className={`relative w-full h-full object-contain select-none transition-opacity duration-300 ${
            isLoaded && !hasError ? 'opacity-100' : 'opacity-0'
          }`}
          draggable={false}
        />
      </picture>

      {/* =========================================================================
          DIAGONAL SPECULAR GLEAM SHEEN
          ========================================================================= */}
      {showEffects && hasGleam && isLoaded && (
        <div
          className="absolute inset-[6%] rounded-full pointer-events-none mix-blend-screen overflow-hidden opacity-75 z-20"
          style={{
            maskImage: 'radial-gradient(circle at center, black 65%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(circle at center, black 65%, transparent 80%)',
          }}
        >
          <div
            className="w-[180%] h-[30%] -left-[40%] top-[35%] absolute rounded-full blur-[2px]"
            style={{
              background: `linear-gradient(90deg, transparent 0%, ${gleamColor} 50%, transparent 100%)`,
              animation: `rankGleamSweep ${gleamCycle} cubic-bezier(0.2, 0.8, 0.2, 1) infinite`,
              willChange: 'transform, opacity',
            }}
          />
        </div>
      )}

      {/* =========================================================================
          CONIC PLASMA SWEEP (Platinum, Diamond, Champion, Master, Grandmaster)
          ========================================================================= */}
      {showEffects && hasConicSweep && isLoaded && !isCompact && (
        <div
          className="absolute inset-[10%] rounded-full pointer-events-none mix-blend-overlay overflow-hidden opacity-60 z-20"
          style={{
            maskImage: 'radial-gradient(circle at center, black 65%, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(circle at center, black 65%, transparent 75%)',
          }}
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

      {/* =========================================================================
          CELESTIAL DUAL ORBITAL STARS (Grandmaster)
          ========================================================================= */}
      {showEffects && hasDualOrbit && !isCompact && (
        <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center">
          {/* Orbital Star 1: Clockwise */}
          <div
            className="absolute w-2.5 h-2.5 rounded-full"
            style={{
              backgroundColor: '#FFD700',
              boxShadow: '0 0 10px 3px rgba(255, 215, 0, 0.9), 0 0 18px 6px rgba(255, 51, 102, 0.6)',
              animation: 'orbitStarClockwise 5s linear infinite',
            }}
          />
          {/* Orbital Star 2: Counter-Clockwise */}
          <div
            className="absolute w-2 h-2 rounded-full"
            style={{
              backgroundColor: '#FF3366',
              boxShadow: '0 0 10px 3px rgba(255, 51, 102, 0.9), 0 0 16px 5px rgba(255, 215, 0, 0.6)',
              animation: 'orbitStarCounter 6.5s linear infinite',
            }}
          />
        </div>
      )}

      {/* =========================================================================
          PRECISION STAR GLINTS (Diamond, Silver, Grandmaster)
          ========================================================================= */}
      {showEffects && hasGlintStars && !isCompact && (
        <div className="absolute inset-0 pointer-events-none z-30">
          <StarGlint
            size={14}
            color={sparklesColor}
            style={{
              top: '20%',
              left: '22%',
              animation: 'rankStarGlint 5s ease-in-out infinite 0.5s',
            }}
          />
          <StarGlint
            size={12}
            color="#FFFFFF"
            style={{
              top: '28%',
              right: '20%',
              animation: 'rankStarGlint 4.2s ease-in-out infinite 2.2s',
            }}
          />
          <StarGlint
            size={10}
            color={theme.accent}
            style={{
              bottom: '24%',
              left: '48%',
              animation: 'rankStarGlint 6s ease-in-out infinite 3.8s',
            }}
          />
        </div>
      )}

      {/* =========================================================================
          PARTICLE MOTES / FORGE EMBERS / SOLAR DUST
          ========================================================================= */}
      {showEffects && sparklesCount > 0 && !isCompact && (
        <div className="absolute inset-[-15%] pointer-events-none z-20">
          {Array.from({ length: sparklesCount }).map((_, i) => {
            const mote = sparkleMotes[i % sparkleMotes.length];

            return (
              <div
                key={i}
                className="absolute rounded-full opacity-0 pointer-events-none"
                style={{
                  left: `${mote.left}%`,
                  top: `${mote.top}%`,
                  width: `${mote.size}px`,
                  height: `${mote.size}px`,
                  backgroundColor: sparklesColor,
                  boxShadow: `0 0 8px 2px ${sparklesColor}`,
                  animation: `driftUpward ${mote.dur}s ease-in infinite ${mote.delay}s`,
                  ['--drift-x' as any]: mote.driftX,
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
