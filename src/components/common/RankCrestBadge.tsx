import React, { useEffect, useState } from 'react';
import { RankTierName, RANK_TIERS } from '../../lib/rankedSystem';

interface RankCrestBadgeProps {
  tier: RankTierName;
  division?: string;
  size?: number | string;
  className?: string;
  isGhost?: boolean;
  ghostColor?: string;
  isSettled?: boolean;
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

const DIVISION_MAP: Record<string, string> = {
  'I': '1', 'II': '2', 'III': '3', 'IV': '4'
};

export function RankCrestBadge({
  tier,
  division,
  size = 72,
  className = '',
  isGhost = false,
  ghostColor,
  isSettled = true,
}: RankCrestBadgeProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const scale = TIER_SCALES[tier] || 1.0;
  const actualSize = typeof size === 'number' ? size * scale : `calc(${size} * ${scale})`;

  const tierLower = tier.toLowerCase();
  let imageFileName = `${tierLower}.png`;
  
  if (division && !['Champion', 'Master', 'Grandmaster'].includes(tier)) {
      const divisionNumber = DIVISION_MAP[division] || '1';
      imageFileName = `${tierLower}-${divisionNumber}.png`;
  }
  const imageSrc = `/images/ranks/${imageFileName}`;

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

  const staticFilter = isGhost && ghostColor ? `drop-shadow(0 0 10px ${ghostColor})` : `drop-shadow(0 4px 12px rgba(0,0,0,0.5))`;

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
            zIndex: 0
          }}
        />
      ) : (
        <div className="absolute inset-0" style={{ filter: staticFilter, zIndex: 0 }} />
      )}
      
      {/* Grandmaster Rotating Ring removed as requested */}

      <img
        src={imageSrc}
        alt={`${tier} ${division || ''} Rank Badge`}
        className="relative w-full h-full object-contain transition-all duration-500 z-10"
        draggable={false}
      />

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
                    className="absolute w-1.5 h-1.5 rounded-full"
                    style={{
                      backgroundColor: sparklesColor,
                      boxShadow: `0 0 6px ${sparklesColor}`,
                      animation: `orbitStar 8s linear infinite`,
                      animationDelay: `-${i * (8 / sparklesCount)}s`
                    }}
                  />
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
            
            const left = 20 + Math.random() * 60;
            const top = 30 + Math.random() * 50;
            const delay = Math.random() * 4;
            const dur = 3 + Math.random() * 3;
            const size = 2 + Math.random() * 2;
            
            return (
              <div
                key={i}
                className="absolute rounded-full opacity-0"
                style={{
                  left: `${left}%`,
                  top: `${top}%`,
                  width: `${size}px`,
                  height: `${size}px`,
                  backgroundColor: sparklesColor,
                  boxShadow: `0 0 6px ${sparklesColor}`,
                  animation: `driftUpward ${dur}s ease-in infinite ${delay}s`
                }}
              />
            )
          })}
        </div>
      )}

      {/* Diamond Glint */}
      {showEffects && hasGlint && (
        <div 
          className="absolute top-[25%] right-[30%] w-3 h-3 rounded-full bg-white opacity-0 z-30 pointer-events-none"
          style={{
            boxShadow: '0 0 15px 5px rgba(255,255,255,0.8)',
            animation: 'glintFlash 8s infinite 2s'
          }}
        />
      )}
    </div>
  );
}
