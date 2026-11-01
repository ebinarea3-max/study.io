'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  BadgeEffectsMode,
  getTierDivisionFx,
  subscribeBadgeVisibility,
} from '../../lib/badgeFx';

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
  tier?: RankBadgeTier | string;
  division?: string;
  delay?: number;
  size?: number | string | 'sm' | 'md' | 'lg';
  compact?: boolean;
  className?: string;
  alt?: string;
  priority?: boolean;
  scale?: number;
  rankTitle?: string;
  // Visual effects props
  effects?: BadgeEffectsMode;
  interactive?: boolean;
  showGlintPoints?: boolean;
  forcePaused?: boolean;
  replayEntrance?: boolean;
  onFlex?: () => void;
}

/**
 * Derives the tier from a rank title or fallback string.
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
 * RankBadge: The unified, hardware-accelerated rank crest component.
 * Features:
 * - 3-level nested architecture: Entrance wrapper -> Tilt wrapper -> Idle wrapper
 * - True silhouette glow (zero circular rings or halos)
 * - CSS-masked metallic sheen sweep
 * - 4-point star glints
 * - Deterministic seeded particles (SSR safe)
 * - Shared IntersectionObserver & visibility pause
 * - Interactive 3D perspective tilt & click/tap flex burst
 */
export function RankBadge({
  src,
  tier,
  division,
  size = 160,
  compact = false,
  className = '',
  alt = 'Rank Badge',
  priority = false,
  rankTitle = '',
  effects,
  interactive = false,
  showGlintPoints = false,
  forcePaused = false,
  replayEntrance,
  onFlex,
}: RankBadgeProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // 1. Resolve active tier and division
  const titleLower = (rankTitle || alt || '').toLowerCase();
  let resolvedTier: RankBadgeTier = (tier as RankBadgeTier) || 'silver';
  if (titleLower.includes('grandmaster') || resolvedTier === 'grandmaster') resolvedTier = 'grandmaster';
  else if (titleLower.includes('master') || resolvedTier === 'master') resolvedTier = 'master';
  else if (titleLower.includes('champ') || resolvedTier === 'champion') resolvedTier = 'champion';
  else if (titleLower.includes('diamond') || resolvedTier === 'diamond') resolvedTier = 'diamond';
  else if (titleLower.includes('plat') || resolvedTier === 'platinum') resolvedTier = 'platinum';
  else if (titleLower.includes('gold') || resolvedTier === 'gold') resolvedTier = 'gold';
  else if (titleLower.includes('bronze') || resolvedTier === 'bronze') resolvedTier = 'bronze';

  // Extract division if not explicitly provided
  let resolvedDivision = division;
  if (!resolvedDivision) {
    if (titleLower.includes('iv') || titleLower.endsWith(' 4')) resolvedDivision = 'IV';
    else if (titleLower.includes('iii') || titleLower.endsWith(' 3')) resolvedDivision = 'III';
    else if (titleLower.includes('ii') || titleLower.endsWith(' 2')) resolvedDivision = 'II';
    else if (titleLower.includes('i') || titleLower.endsWith(' 1')) resolvedDivision = 'I';
  }

  // 2. Numeric sizing
  const isSm = size === 'sm' || compact === true;
  const numericSize = isSm
    ? 32
    : typeof size === 'number'
    ? size
    : parseInt(String(size), 10) || 160;
  const pixelSize = `${numericSize}px`;

  // 3. Accessibility & hardware capability check
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isLowEndDevice, setIsLowEndDevice] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);

    if (typeof navigator !== 'undefined' && navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) {
      setIsLowEndDevice(true);
    }

    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // 4. Effects mode resolution (Full >= 96px, Lite 48-95px, None < 48px)
  let defaultEffects: BadgeEffectsMode = 'full';
  if (numericSize < 48) {
    defaultEffects = 'none';
  } else if (numericSize < 96 || isLowEndDevice) {
    defaultEffects = 'lite';
  }

  const activeEffects: BadgeEffectsMode = prefersReducedMotion
    ? 'none'
    : effects !== undefined
    ? isLowEndDevice && effects === 'full'
      ? 'lite'
      : effects
    : defaultEffects;

  // 5. Visibility and Pause management
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (activeEffects === 'none' || !containerRef.current) return;
    const unsub = subscribeBadgeVisibility(containerRef.current, (visible) => {
      setIsVisible(visible);
    });
    return unsub;
  }, [activeEffects]);

  const isPaused = forcePaused || !isVisible;

  // 6. Entrance sequence tracking
  const [hasEntered, setHasEntered] = useState(false);
  const [entranceKey, setEntranceKey] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion || activeEffects === 'none') {
      setHasEntered(true);
      return;
    }
    setHasEntered(false);
    const timer = setTimeout(() => {
      setHasEntered(true);
    }, 450);
    return () => clearTimeout(timer);
  }, [replayEntrance, prefersReducedMotion, activeEffects]);

  useEffect(() => {
    if (replayEntrance !== undefined) {
      setEntranceKey((prev) => prev + 1);
    }
  }, [replayEntrance]);

  // 7. Interactive Tilt, Glare and Flex
  const [isHovered, setIsHovered] = useState(false);
  const [tiltStyle, setTiltStyle] = useState<React.CSSProperties>({});
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50 });
  const [isFlexing, setIsFlexing] = useState(false);
  const [flexBurstParticles, setFlexBurstParticles] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const lastFlexTimeRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if ((!interactive && !isHovered) || activeEffects === 'none' || prefersReducedMotion) return;

    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const px = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const py = Math.max(0, Math.min(100, (y / rect.height) * 100));

    // Tilt up to 10 degrees toward pointer with perspective
    const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * 10;
    const rotateX = -((y - rect.height / 2) / (rect.height / 2)) * 10;

    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
    }

    rafIdRef.current = requestAnimationFrame(() => {
      setGlarePos({ x: px, y: py });
      setTiltStyle({
        transform: `perspective(600px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale(1.04)`,
        transition: 'transform 0.08s ease-out',
      });
    });
  }, [interactive, isHovered, activeEffects, prefersReducedMotion]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    setTiltStyle({
      transform: 'perspective(600px) rotateX(0deg) rotateY(0deg) scale(1)',
      transition: 'transform 0.35s ease-out',
    });
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleFocus = useCallback(() => {
    if (!interactive || prefersReducedMotion) return;
    setIsHovered(true);
    setTiltStyle({
      transform: 'perspective(600px) scale(1.04)',
      transition: 'transform 0.25s ease-out',
    });
  }, [interactive, prefersReducedMotion]);

  const handleBlur = useCallback(() => {
    setIsHovered(false);
    setTiltStyle({
      transform: 'perspective(600px) scale(1)',
      transition: 'transform 0.35s ease-out',
    });
  }, []);

  // Flex on click / tap (rate limited to once per 600ms)
  const handleBadgeClick = useCallback(() => {
    if (activeEffects === 'none') return;
    const now = Date.now();
    if (now - lastFlexTimeRef.current < 600) return;
    lastFlexTimeRef.current = now;

    setIsFlexing(true);

    const count = 8;
    const burst: Array<{ id: number; x: number; y: number }> = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * 2 * Math.PI;
      const dist = (numericSize * 0.25) + (i % 3) * (numericSize * 0.08);
      burst.push({
        id: i,
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
      });
    }
    setFlexBurstParticles(burst);

    if (onFlex) onFlex();

    setTimeout(() => {
      setIsFlexing(false);
      setFlexBurstParticles([]);
    }, 450);
  }, [activeEffects, numericSize, onFlex]);

  // 8. Tier FX configuration resolution (Phase 1: Bronze, Silver, Gold calibrated)
  const fx = useMemo(() => {
    return getTierDivisionFx(resolvedTier, resolvedDivision, numericSize);
  }, [resolvedTier, resolvedDivision, numericSize]);

  // Plain public image path for masking & silhouette
  const plainImagePath = src || '/images/ranks/bronze-1.png';
  const webpImagePath = plainImagePath.replace(/\.png$/, '.webp');

  return (
    <div
      ref={containerRef}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onClick={handleBadgeClick}
      className={`relative flex items-center justify-center shrink-0 select-none overflow-visible ${
        interactive ? 'cursor-pointer focus:outline-none' : ''
      } ${isPaused ? 'badge-paused' : ''} ${className}`}
      style={{
        width: pixelSize,
        height: pixelSize,
        minWidth: pixelSize,
        minHeight: pixelSize,
      }}
    >
      {/* ────────────────────────────────────────────────────────── */}
      {/* LAYER 1: ENTRANCE WRAPPER (Fade & Scale 0.94 -> 1 on load)  */}
      {/* ────────────────────────────────────────────────────────── */}
      <div
        key={entranceKey}
        className="w-full h-full relative badge-entrance-wrapper flex items-center justify-center"
        style={{
          animation:
            prefersReducedMotion || activeEffects === 'none'
              ? 'none'
              : 'badgeEntrance 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          transformOrigin: 'center center',
        }}
      >
        {/* ────────────────────────────────────────────────────────── */}
        {/* LAYER 2: TILT WRAPPER (Interactive mouse tilt & flex tween)*/}
        {/* ────────────────────────────────────────────────────────── */}
        <div
          className="w-full h-full relative badge-tilt-wrapper flex items-center justify-center"
          style={{
            ...tiltStyle,
            animation: isFlexing ? 'badgeFlexScale 0.45s ease-out' : 'none',
            transformOrigin: 'center center',
          }}
        >
          {/* ────────────────────────────────────────────────────────── */}
          {/* LAYER 3: IDLE WRAPPER (Houses all crest effects layers)   */}
          {/* ────────────────────────────────────────────────────────── */}
          <div className="w-full h-full relative badge-idle-wrapper flex items-center justify-center">
            {/* b. SILHOUETTE GLOW (No circular ring or halo: duplicate of badge blurred) */}
            {activeEffects !== 'none' && (
              <div
                className="absolute inset-0 pointer-events-none select-none flex items-center justify-center silhouette-glow-layer"
                style={{
                  '--glow-min-op': fx.glowMinOpacity,
                  '--glow-max-op': fx.glowMaxOpacity,
                  animation: isPaused
                    ? 'none'
                    : `badgeSilhouetteGlow ${fx.glowPeriod}s ease-in-out infinite`,
                  transformOrigin: 'center center',
                  willChange: isPaused ? 'auto' : 'transform, opacity',
                } as React.CSSProperties}
              >
                <img
                  src={plainImagePath}
                  alt=""
                  aria-hidden="true"
                  loading="eager"
                  decoding="sync"
                  draggable={false}
                  className="w-full h-full object-contain pointer-events-none select-none block"
                  style={{
                    filter: `blur(14px) brightness(1.3) drop-shadow(0 0 8px ${fx.glowColor}) drop-shadow(0 0 16px ${fx.glowColor})`,
                  }}
                />
              </div>
            )}

            {/* c. THE MAIN BADGE IMAGE */}
            <img
              src={plainImagePath}
              alt={alt || rankTitle || 'Rank Badge'}
              loading="eager"
              decoding="sync"
              draggable={false}
              className="w-full h-full object-contain pointer-events-none select-none relative z-10 block"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.endsWith('/images/ranks/bronze-1.png')) {
                  target.src = '/images/ranks/bronze-1.png';
                }
              }}
            />

            {/* d. SHEEN: Masked diagonal band moving across metal */}
            {activeEffects !== 'none' && (
              <div
                className="absolute inset-0 pointer-events-none select-none overflow-hidden z-20"
                style={{
                  WebkitMaskImage: `url(${plainImagePath})`,
                  maskImage: `url(${plainImagePath})`,
                  WebkitMaskSize: 'contain',
                  maskSize: 'contain',
                  WebkitMaskRepeat: 'no-repeat',
                  maskRepeat: 'no-repeat',
                  WebkitMaskPosition: 'center',
                  maskPosition: 'center',
                }}
              >
                <div
                  className="absolute top-0 bottom-0 sheen-bar"
                  style={{
                    left: '-100%',
                    width: `${fx.sheenWidth}%`,
                    background: `linear-gradient(105deg, transparent 0%, ${fx.sheenColor} 50%, transparent 100%)`,
                    animation: isPaused
                      ? 'none'
                      : `badgeSheenSweep ${
                          activeEffects === 'lite' ? fx.sheenPeriod * 1.4 : fx.sheenPeriod
                        }s ease-in-out infinite`,
                    willChange: isPaused ? 'auto' : 'transform, opacity',
                  }}
                />
              </div>
            )}

            {/* g. GLARE: Masked radial highlight following pointer on hover */}
            {activeEffects !== 'none' && !prefersReducedMotion && (
              <div
                className="absolute inset-0 pointer-events-none select-none z-22 transition-opacity duration-200"
                style={{
                  opacity: isHovered ? 0.35 : 0,
                  WebkitMaskImage: `url(${plainImagePath})`,
                  maskImage: `url(${plainImagePath})`,
                  WebkitMaskSize: 'contain',
                  maskSize: 'contain',
                  WebkitMaskRepeat: 'no-repeat',
                  maskRepeat: 'no-repeat',
                  WebkitMaskPosition: 'center',
                  maskPosition: 'center',
                  background: `radial-gradient(circle ${Math.max(
                    40,
                    numericSize * 0.4
                  )}px at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.85) 0%, transparent 80%)`,
                }}
              />
            )}

            {/* e. GLINTS: 4-point star flares (Full mode only) */}
            {activeEffects === 'full' && (
              <div className="absolute inset-0 pointer-events-none select-none z-30">
                {fx.glints.map((g) => (
                  <div
                    key={g.id}
                    className="absolute pointer-events-none glint-flare"
                    style={{
                      left: `${g.x}%`,
                      top: `${g.y}%`,
                      width: `${Math.max(14, Math.round(numericSize * 0.12))}px`,
                      height: `${Math.max(14, Math.round(numericSize * 0.12))}px`,
                      animation: isPaused
                        ? 'none'
                        : `badgeGlintAnim ${g.duration}s ease-in-out infinite`,
                      animationDelay: `${g.delay}s`,
                      willChange: isPaused ? 'auto' : 'transform, opacity',
                    }}
                  >
                    {/* Horizontal ray */}
                    <div
                      className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-[1.5px] rounded-full"
                      style={{
                        background:
                          'linear-gradient(90deg, transparent 0%, #ffffff 50%, transparent 100%)',
                      }}
                    />
                    {/* Vertical ray */}
                    <div
                      className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-[1.5px] rounded-full"
                      style={{
                        background:
                          'linear-gradient(180deg, transparent 0%, #ffffff 50%, transparent 100%)',
                      }}
                    />
                    {/* Centre bright dot */}
                    <div
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
                      style={{
                        backgroundColor: '#ffffff',
                        boxShadow: `0 0 6px ${fx.glowColor}`,
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* f. PARTICLES: Procedural embers/sparkles (Full mode only) */}
            {activeEffects === 'full' && fx.particles.length > 0 && (
              <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-25">
                {fx.particles.map((p, i) => (
                  <span
                    key={`p-${i}`}
                    className="absolute rounded-full badge-particle pointer-events-none"
                    style={{
                      left: `${p.x}%`,
                      top: `${p.y}%`,
                      width: `${p.size}px`,
                      height: `${p.size}px`,
                      backgroundColor: p.color,
                      boxShadow: `0 0 4px ${p.color}`,
                      '--drift-x': `${p.driftX}px`,
                      '--drift-y': `${p.driftY}px`,
                      animation: isPaused
                        ? 'none'
                        : `badgeParticleDrift ${p.duration}s ease-out infinite`,
                      animationDelay: `${p.delay}s`,
                      willChange: isPaused ? 'auto' : 'transform, opacity',
                    } as React.CSSProperties}
                  />
                ))}
              </div>
            )}

            {/* FLEX CLICK BURST (One bright sheen sweep & burst of particles) */}
            {isFlexing && (
              <>
                <div
                  className="absolute inset-0 pointer-events-none z-35 overflow-hidden"
                  style={{
                    WebkitMaskImage: `url(${plainImagePath})`,
                    maskImage: `url(${plainImagePath})`,
                    WebkitMaskSize: 'contain',
                    maskSize: 'contain',
                    WebkitMaskRepeat: 'no-repeat',
                    maskRepeat: 'no-repeat',
                    WebkitMaskPosition: 'center',
                    maskPosition: 'center',
                  }}
                >
                  <div
                    className="absolute top-0 bottom-0 left-[-100%] w-[50%] bg-gradient-to-r from-transparent via-white to-transparent"
                    style={{
                      animation: 'badgeFlexSweep 0.45s ease-out forwards',
                    }}
                  />
                </div>

                {flexBurstParticles.length > 0 && (
                  <div className="absolute inset-0 pointer-events-none z-35 flex items-center justify-center">
                    {flexBurstParticles.map((b) => (
                      <span
                        key={`burst-${b.id}`}
                        className="absolute w-2 h-2 rounded-full badge-flex-burst pointer-events-none"
                        style={{
                          backgroundColor: fx.particleColor,
                          boxShadow: `0 0 6px ${fx.glowColor}`,
                          '--burst-x': `${b.x}px`,
                          '--burst-y': `${b.y}px`,
                          animation: 'badgeFlexBurst 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                        } as React.CSSProperties}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ENTRANCE SHEEN SWEEP (First time entering view or replay) */}
            {!hasEntered && activeEffects !== 'none' && !prefersReducedMotion && (
              <div
                className="absolute inset-0 pointer-events-none z-35 overflow-hidden"
                style={{
                  WebkitMaskImage: `url(${plainImagePath})`,
                  maskImage: `url(${plainImagePath})`,
                  WebkitMaskSize: 'contain',
                  maskSize: 'contain',
                  WebkitMaskRepeat: 'no-repeat',
                  maskRepeat: 'no-repeat',
                  WebkitMaskPosition: 'center',
                  maskPosition: 'center',
                }}
              >
                <div
                  className="absolute top-0 bottom-0 left-[-100%] w-[50%] bg-gradient-to-r from-transparent via-white/80 to-transparent"
                  style={{
                    animation: 'badgeFlexSweep 0.4s ease-out forwards',
                  }}
                />
              </div>
            )}

            {/* SHOW GLINT POINTS CROSSHAIRS OVERLAY (for tuning coordinates) */}
            {showGlintPoints && (
              <div className="absolute inset-0 pointer-events-none z-50">
                {fx.glints.map((g) => (
                  <div
                    key={`crosshair-${g.id}`}
                    className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none"
                    style={{ left: `${g.x}%`, top: `${g.y}%` }}
                  >
                    <div className="relative w-4 h-4 flex items-center justify-center">
                      <div className="absolute w-full h-[1px] bg-rose-500 shadow-sm" />
                      <div className="absolute h-full w-[1px] bg-rose-500 shadow-sm" />
                      <div className="w-1.5 h-1.5 rounded-full border border-rose-400 bg-white" />
                    </div>
                    <span className="text-[9px] font-mono font-bold bg-black/85 text-rose-300 px-1 rounded shadow whitespace-nowrap -mt-0.5">
                      {g.x},{g.y}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
