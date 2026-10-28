import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
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
  Silver: 1.0,
  Gold: 1.0,
  Platinum: 1.0,
  Diamond: 1.0,
  Champion: 1.0,
  Master: 1.0,
  Grandmaster: 1.0,
};

// Distinct VFX Configuration per Tier
interface TierVfxConfig {
  godRays?: boolean;
  godRayColor1: string;
  godRayColor2: string;
  energyRings?: boolean;
  ringColor: string;
  shockwave?: boolean;
  shockwaveColor: string;
  laserColor: string;
  comets?: boolean;
  particleColors: string[];
  particleCount: number;
}

const TIER_VFX: Record<RankTierName, TierVfxConfig> = {
  Bronze: {
    godRays: false,
    godRayColor1: 'rgba(217, 119, 6, 0.25)',
    godRayColor2: 'rgba(180, 83, 9, 0.1)',
    energyRings: false,
    ringColor: '#F59E0B',
    shockwave: false,
    shockwaveColor: '#D97706',
    laserColor: 'rgba(251, 191, 36, 0.7)',
    particleColors: ['#F59E0B', '#D97706', '#EF4444', '#FBBF24'],
    particleCount: 8,
  },
  Silver: {
    godRays: false,
    godRayColor1: 'rgba(203, 213, 225, 0.25)',
    godRayColor2: 'rgba(148, 163, 184, 0.1)',
    energyRings: false,
    ringColor: '#CBD5E1',
    shockwave: false,
    shockwaveColor: '#E2E8F0',
    laserColor: 'rgba(255, 255, 255, 0.85)',
    particleColors: ['#FFFFFF', '#E2E8F0', '#94A3B8', '#F8FAFC'],
    particleCount: 8,
  },
  Gold: {
    godRays: true,
    godRayColor1: 'rgba(234, 179, 8, 0.35)',
    godRayColor2: 'rgba(245, 158, 11, 0.15)',
    energyRings: false,
    ringColor: '#FACC15',
    shockwave: false,
    shockwaveColor: '#F59E0B',
    laserColor: 'rgba(254, 240, 138, 0.9)',
    particleColors: ['#FACC15', '#FEF08A', '#F59E0B', '#FFFFFF'],
    particleCount: 10,
  },
  Platinum: {
    godRays: true,
    godRayColor1: 'rgba(6, 182, 212, 0.35)',
    godRayColor2: 'rgba(20, 184, 166, 0.15)',
    energyRings: true,
    ringColor: '#22D3EE',
    shockwave: false,
    shockwaveColor: '#06B6D4',
    laserColor: 'rgba(165, 243, 252, 0.9)',
    particleColors: ['#22D3EE', '#67E8F9', '#06B6D4', '#A5F3FC'],
    particleCount: 10,
  },
  Diamond: {
    godRays: true,
    godRayColor1: 'rgba(168, 85, 247, 0.4)',
    godRayColor2: 'rgba(56, 189, 248, 0.25)',
    energyRings: true,
    ringColor: '#C084FC',
    shockwave: true,
    shockwaveColor: '#A855F7',
    laserColor: 'rgba(255, 255, 255, 0.95)',
    particleColors: ['#E0F2FE', '#C084FC', '#38BDF8', '#F472B6', '#FFFFFF'],
    particleCount: 12,
  },
  Champion: {
    godRays: true,
    godRayColor1: 'rgba(178, 79, 232, 0.45)',
    godRayColor2: 'rgba(234, 179, 8, 0.25)',
    energyRings: true,
    ringColor: '#E879F9',
    shockwave: true,
    shockwaveColor: '#FACC15',
    laserColor: 'rgba(253, 224, 71, 0.95)',
    particleColors: ['#D8B4FE', '#FDE047', '#E879F9', '#FACC15', '#FFFFFF'],
    particleCount: 12,
  },
  Master: {
    godRays: true,
    godRayColor1: 'rgba(99, 102, 241, 0.5)',
    godRayColor2: 'rgba(225, 29, 72, 0.3)',
    energyRings: true,
    ringColor: '#818CF8',
    shockwave: true,
    shockwaveColor: '#F43F5E',
    laserColor: 'rgba(251, 113, 133, 0.95)',
    particleColors: ['#818CF8', '#FB7185', '#C084FC', '#F43F5E', '#FFFFFF'],
    particleCount: 14,
  },
  Grandmaster: {
    godRays: true,
    godRayColor1: 'rgba(255, 51, 102, 0.55)',
    godRayColor2: 'rgba(234, 179, 8, 0.35)',
    energyRings: true,
    ringColor: '#FF3366',
    shockwave: true,
    shockwaveColor: '#FFD700',
    laserColor: 'rgba(255, 255, 255, 1)',
    comets: true,
    particleColors: ['#FF3366', '#FACC15', '#FFFFFF', '#FB7185', '#FFD700'],
    particleCount: 16,
  },
};

/**
 * 4-Pointed High-Intensity Starburst SVG
 */
function StarburstGlint({
  className = '',
  style,
  size = 18,
  color = '#FFFFFF',
}: {
  className?: string;
  style?: React.CSSProperties;
  size?: number;
  color?: string;
}) {
  const gradId = useMemo(() => `glintCore-${Math.random().toString(36).substring(2, 9)}`, []);

  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={`absolute pointer-events-none z-30 ${className}`}
      style={style}
    >
      <defs>
        <radialGradient id={gradId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
          <stop offset="40%" stopColor={color} stopOpacity="0.8" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* 4-Axis Primary Diamond Blades */}
      <path
        d="M16 0 C16 9 23 16 32 16 C23 16 16 23 16 32 C16 23 9 16 0 16 C9 16 16 9 16 0 Z"
        fill={`url(#${gradId})`}
      />
      {/* 4-Axis Diagonal Secondary Rays */}
      <path
        d="M16 5 C16 11 21 16 27 16 C21 16 16 21 16 27 C16 21 11 16 5 16 C11 16 16 11 16 5 Z"
        fill="#FFFFFF"
        opacity="0.75"
        transform="rotate(45 16 16)"
      />
      <circle cx="16" cy="16" r="3" fill="#FFFFFF" />
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
  const vfx = TIER_VFX[tier] || TIER_VFX.Bronze;

  // Track dynamically loaded URLs in component state
  const [loadedMap, setLoadedMap] = useState<Record<string, boolean>>({});
  const [hasError, setHasError] = useState(false);

  // 3D Parallax Tilt State
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || prefersReducedMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: x * 26, y: -y * 26 });
  }, [interactive, prefersReducedMotion]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

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

  // Precompute Crazy Particle Vortexes: Left-Arc, Right-Arc & Orbiting
  const particles = useMemo(() => {
    const count = isCompact ? Math.min(4, vfx.particleCount) : vfx.particleCount;

    return Array.from({ length: count }).map((_, i) => {
      const color = vfx.particleColors[i % vfx.particleColors.length];
      const type = i % 3 === 0 ? 'vortexLeft' : (i % 3 === 1 ? 'vortexRight' : 'orbit');
      const left = 15 + ((i * 31) % 70);
      const bottom = 12 + ((i * 27) % 50);
      const sizePx = 3 + ((i * 1.1) % 3.5);
      const dur = 2.0 + ((i * 0.4) % 1.8);
      const delay = (i * 0.35) % 2.5;
      const orbitR = 40 + ((i * 7) % 22) + 'px';

      return {
        id: i,
        color,
        type,
        left: `${left}%`,
        bottom: `${bottom}%`,
        sizePx,
        dur,
        delay,
        orbitR,
      };
    });
  }, [tier, vfx, isCompact]);

  const staticFilter = isGhost && ghostColor
    ? `drop-shadow(0 0 10px ${ghostColor})`
    : `drop-shadow(0 8px 18px rgba(0,0,0,0.5)) drop-shadow(0 0 10px ${theme.accent}44)`;
  const tierLower = tier.toLowerCase();

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`group/crest relative flex items-center justify-center select-none ${className}`}
      style={{
        width: actualSize,
        height: actualSize,
        minWidth: actualSize,
        perspective: '700px',
      }}
    >
      {/* =========================================================================
          3D PARALLAX TILT CONTAINER
          Tracks mouse coordinates in 3D space with fluid spring physics
          ========================================================================= */}
      <div
        className="relative w-full h-full flex items-center justify-center"
        style={{
          transform: `perspective(700px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg) scale3d(${
            isHovered ? 1.08 : 1
          }, ${isHovered ? 1.08 : 1}, 1)`,
          transition: isHovered
            ? 'transform 0.08s ease-out'
            : 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
          transformStyle: 'preserve-3d',
          willChange: 'transform',
          animation: showEffects ? 'classicCrestFloat 5.5s ease-in-out infinite' : 'none',
        }}
      >
        {/* =========================================================================
            ROTATING GOD-RAYS / SUNBURST ARRAY
            ========================================================================= */}
        {showEffects && vfx.godRays && !isCompact && (
          <div
            className="absolute -inset-[25%] pointer-events-none rounded-full blur-md opacity-45 group-hover/crest:opacity-85 transition-opacity duration-500 z-0"
            style={{
              background: `conic-gradient(from 0deg at 50% 50%,
                transparent 0deg, ${vfx.godRayColor1} 15deg, transparent 30deg,
                ${vfx.godRayColor2} 45deg, transparent 60deg,
                ${vfx.godRayColor1} 75deg, transparent 90deg,
                ${vfx.godRayColor2} 105deg, transparent 120deg,
                ${vfx.godRayColor1} 135deg, transparent 150deg,
                ${vfx.godRayColor2} 165deg, transparent 180deg,
                ${vfx.godRayColor1} 195deg, transparent 210deg,
                ${vfx.godRayColor2} 225deg, transparent 240deg,
                ${vfx.godRayColor1} 255deg, transparent 270deg,
                ${vfx.godRayColor2} 285deg, transparent 300deg,
                ${vfx.godRayColor1} 315deg, transparent 330deg,
                ${vfx.godRayColor2} 345deg, transparent 360deg)`,
              animation: 'rankGodRays 14s linear infinite',
              willChange: 'transform',
            }}
          />
        )}

        {/* =========================================================================
            CYBERNETIC & RUNIC ENERGY RINGS (Platinum to Grandmaster)
            ========================================================================= */}
        {showEffects && vfx.energyRings && !isCompact && (
          <div className="absolute -inset-[14%] pointer-events-none z-[2] flex items-center justify-center">
            {/* Outer Energy Ring: Clockwise */}
            <svg
              viewBox="0 0 100 100"
              className="absolute w-full h-full"
              style={{
                animation: 'rankEnergyRingClockwise 8s linear infinite',
                filter: `drop-shadow(0 0 8px ${vfx.ringColor})`,
              }}
            >
              <circle
                cx="50"
                cy="50"
                r="46"
                fill="none"
                stroke={vfx.ringColor}
                strokeWidth="1.6"
                strokeDasharray="14 18"
                opacity="0.8"
              />
            </svg>
            {/* Inner Energy Ring: Counter-Clockwise */}
            <svg
              viewBox="0 0 100 100"
              className="absolute w-[84%] h-[84%]"
              style={{
                animation: 'rankEnergyRingCounter 6s linear infinite',
                filter: `drop-shadow(0 0 6px ${vfx.ringColor})`,
              }}
            >
              <circle
                cx="50"
                cy="50"
                r="46"
                fill="none"
                stroke={vfx.ringColor}
                strokeWidth="1.2"
                strokeDasharray="8 22"
                opacity="0.6"
              />
            </svg>
          </div>
        )}

        {/* =========================================================================
            ERUPTING SHOCKWAVE CORONA (Diamond, Champion, Master, Grandmaster)
            ========================================================================= */}
        {showEffects && vfx.shockwave && !isCompact && (
          <div
            className="absolute inset-[-4%] rounded-full border pointer-events-none z-[1]"
            style={{
              borderColor: vfx.shockwaveColor,
              boxShadow: `0 0 16px ${vfx.shockwaveColor}88, inset 0 0 12px ${vfx.shockwaveColor}66`,
              animation: `rankShockwavePulse ${tier === 'Grandmaster' ? '2.2s' : '3.0s'} cubic-bezier(0.16, 1, 0.3, 1) infinite`,
            }}
          />
        )}

        {/* =========================================================================
            CELESTIAL HYPER-SPEED COMETS (Grandmaster)
            ========================================================================= */}
        {showEffects && vfx.comets && !isCompact && (
          <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center">
            {/* Comet 1: Solar Gold */}
            <div
              className="absolute w-3 h-3 rounded-full"
              style={{
                backgroundColor: '#FFD700',
                boxShadow: '0 0 12px 4px #FFD700, 0 0 24px 8px #FF3366',
                animation: 'rankCometClockwise 4.5s linear infinite',
              }}
            />
            {/* Comet 2: Crimson Supernova */}
            <div
              className="absolute w-2.5 h-2.5 rounded-full"
              style={{
                backgroundColor: '#FF3366',
                boxShadow: '0 0 12px 4px #FF3366, 0 0 22px 6px #FFD700',
                animation: 'rankCometCounter 5.8s linear infinite',
              }}
            />
          </div>
        )}

        {/* Soft round dark tile behind crest in Paper theme only for contrast */}
        <div
          className="absolute inset-[8%] rounded-full pointer-events-none opacity-0 [[data-theme='paper']_&]:opacity-100 transition-opacity z-[5]"
          style={{
            background: 'radial-gradient(circle, rgba(27, 26, 24, 0.12) 0%, rgba(27, 26, 24, 0.04) 70%, transparent 100%)',
          }}
        />

        {/* =========================================================================
            IMMEDIATE SKELETON VECTOR SHIELD PLACEHOLDER
            ========================================================================= */}
        <div
          className={`absolute inset-0 flex items-center justify-center pointer-events-none z-[6] transition-opacity duration-300 ${
            isLoaded && !hasError ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-[82%] h-[82%] overflow-visible">
              <path
                d="M50 8 L84 24 L76 72 L50 94 L24 72 L16 24 Z"
                fill={`${theme.accent}20`}
                stroke={theme.accent}
                strokeWidth="2.2"
                strokeLinejoin="round"
              />
              <text
                x="50"
                y="53"
                textAnchor="middle"
                dominantBaseline="central"
                fill={theme.accent}
                fontSize="14"
                fontWeight="700"
                className="font-mono select-none"
              >
                {division || tier.charAt(0)}
              </text>
            </svg>
          </div>
        </div>

        {/* =========================================================================
            MAIN BADGE CREST WITH STATIC FORM-FITTING DEPTH
            ========================================================================= */}
        <picture
          className="relative w-full h-full flex items-center justify-center z-10"
          style={{ filter: staticFilter }}
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
            className={`relative w-full h-full object-contain select-none transition-all duration-300 ${
              isHovered ? 'brightness-110 drop-shadow-[0_0_15px_currentColor]' : ''
            } ${isLoaded && !hasError ? 'opacity-100' : 'opacity-0'}`}
            style={{ color: theme.accent }}
            draggable={false}
          />
        </picture>

        {/* =========================================================================
            HOLOGRAPHIC TILT SPECULAR SHEEN (3D Mouse-Reactive Highlight)
            ========================================================================= */}
        {interactive && !prefersReducedMotion && (
          <div
            className="absolute inset-[4%] rounded-full pointer-events-none transition-opacity duration-300 mix-blend-color-dodge z-[15]"
            style={{
              opacity: isHovered ? 0.55 : 0,
              background: `radial-gradient(circle at ${50 + tilt.x * 1.5}% ${
                50 - tilt.y * 1.5
              }%, rgba(255, 255, 255, 0.85) 0%, ${theme.accent}66 30%, transparent 65%)`,
            }}
          />
        )}

        {/* =========================================================================
            HIGH-SPEED LASER SHEEN SWEEP
            ========================================================================= */}
        {showEffects && isLoaded && (
          <div
            className="absolute inset-[6%] rounded-full pointer-events-none mix-blend-screen overflow-hidden opacity-75 z-20"
            style={{
              maskImage: 'radial-gradient(circle at center, black 65%, transparent 80%)',
              WebkitMaskImage: 'radial-gradient(circle at center, black 65%, transparent 80%)',
            }}
          >
            <div
              className="w-[190%] h-[35%] -left-[45%] top-[32%] absolute rounded-full blur-[2px]"
              style={{
                background: `linear-gradient(90deg, transparent 0%, ${vfx.laserColor} 50%, transparent 100%)`,
                animation: 'rankLaserSweep 3.6s cubic-bezier(0.2, 0.8, 0.2, 1) infinite',
                willChange: 'transform, opacity',
              }}
            />
          </div>
        )}

        {/* =========================================================================
            BLINDING STARBURST DETONATIONS (Silver, Diamond, Grandmaster)
            ========================================================================= */}
        {showEffects && (tier === 'Silver' || tier === 'Diamond' || tier === 'Grandmaster') && isLoaded && !isCompact && (
          <div className="absolute inset-0 pointer-events-none z-30">
            <StarburstGlint
              size={18}
              color={theme.accent}
              style={{
                top: '18%',
                left: '20%',
                animation: 'rankStarburstFlash 4.5s ease-in-out infinite 0.4s',
              }}
            />
            <StarburstGlint
              size={16}
              color="#FFFFFF"
              style={{
                top: '24%',
                right: '18%',
                animation: 'rankStarburstFlash 3.8s ease-in-out infinite 2.2s',
              }}
            />
            <StarburstGlint
              size={14}
              color={vfx.ringColor}
              style={{
                bottom: '22%',
                left: '46%',
                animation: 'rankStarburstFlash 5.2s ease-in-out infinite 3.5s',
              }}
            />
          </div>
        )}

        {/* =========================================================================
            SWIRLING VORTEX PARTICLES (Esports Tier Sparks & Embers)
            ========================================================================= */}
        {showEffects && isLoaded && (
          <div className="absolute inset-[-20%] pointer-events-none z-20 overflow-visible">
            {particles.map((p) => {
              const animName =
                p.type === 'vortexLeft'
                  ? 'rankVortexLeft'
                  : p.type === 'vortexRight'
                  ? 'rankVortexRight'
                  : 'rankVortexOrbit';

              return (
                <div
                  key={p.id}
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    left: p.left,
                    bottom: p.bottom,
                    width: `${p.sizePx}px`,
                    height: `${p.sizePx}px`,
                    backgroundColor: p.color,
                    boxShadow: `0 0 6px 1px ${p.color}, 0 0 14px 3px ${p.color}aa`,
                    animation: `${animName} ${p.dur}s ease-in-out infinite ${p.delay}s`,
                    ['--orbit-r' as any]: p.orbitR,
                    willChange: 'transform, opacity',
                  }}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
