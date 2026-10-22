'use client';

import React, { useCallback, useRef, useEffect, useState } from 'react';
import { useSceneCanvas } from './useSceneCanvas';

interface Star {
  x: number;
  y: number;
  size: number;
  baseAlpha: number;
  twinklePhase: number;
  twinkleSpeed: number;
  vx: number;
  vy: number;
  layer: 'far' | 'mid' | 'near';
  colorType: 'cool' | 'white' | 'warm';
  isHero?: boolean;
  hasSpike?: boolean;
}

interface ShootingStar {
  active: boolean;
  elapsed: number;
  duration: number; // 0.9s
  startX: number;
  startY: number;
  vx: number;
  vy: number;
  speed: number;
  angle: number;
  length: number;
}

interface StarSprites {
  glowCool: HTMLCanvasElement;
  glowWarm: HTMLCanvasElement;
  spike: HTMLCanvasElement;
  dotCool: HTMLCanvasElement;
  dotWhite: HTMLCanvasElement;
  dotWarm: HTMLCanvasElement;
  streak: HTMLCanvasElement;
}

function createStarSprites(): StarSprites | null {
  if (typeof document === 'undefined') return null;

  // 1. Soft Glow Sprite (Cool) - 48x48
  const glowCool = document.createElement('canvas');
  glowCool.width = 48;
  glowCool.height = 48;
  const ctxCool = glowCool.getContext('2d');
  if (ctxCool) {
    const g = ctxCool.createRadialGradient(24, 24, 0, 24, 24, 24);
    g.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    g.addColorStop(0.18, 'rgba(219, 234, 254, 0.85)');
    g.addColorStop(0.45, 'rgba(147, 197, 253, 0.35)');
    g.addColorStop(1, 'rgba(96, 165, 250, 0)');
    ctxCool.fillStyle = g;
    ctxCool.fillRect(0, 0, 48, 48);
  }

  // 2. Soft Glow Sprite (Warm) - 48x48
  const glowWarm = document.createElement('canvas');
  glowWarm.width = 48;
  glowWarm.height = 48;
  const ctxWarm = glowWarm.getContext('2d');
  if (ctxWarm) {
    const g = ctxWarm.createRadialGradient(24, 24, 0, 24, 24, 24);
    g.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    g.addColorStop(0.18, 'rgba(254, 240, 138, 0.9)');
    g.addColorStop(0.45, 'rgba(251, 191, 36, 0.35)');
    g.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctxWarm.fillStyle = g;
    ctxWarm.fillRect(0, 0, 48, 48);
  }

  // 3. Faint 4-Point Cross Spike Sprite - 64x64
  const spike = document.createElement('canvas');
  spike.width = 64;
  spike.height = 64;
  const ctxSpike = spike.getContext('2d');
  if (ctxSpike) {
    // Core glow
    const g = ctxSpike.createRadialGradient(32, 32, 0, 32, 32, 20);
    g.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    g.addColorStop(0.25, 'rgba(224, 242, 254, 0.7)');
    g.addColorStop(1, 'rgba(186, 230, 253, 0)');
    ctxSpike.fillStyle = g;
    ctxSpike.fillRect(12, 12, 40, 40);

    // Horizontal spike
    const hGrad = ctxSpike.createLinearGradient(0, 32, 64, 32);
    hGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    hGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.95)');
    hGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctxSpike.fillStyle = hGrad;
    ctxSpike.fillRect(0, 31.25, 64, 1.5);

    // Vertical spike
    const vGrad = ctxSpike.createLinearGradient(32, 0, 32, 64);
    vGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    vGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.95)');
    vGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctxSpike.fillStyle = vGrad;
    ctxSpike.fillRect(31.25, 0, 1.5, 64);
  }

  // 4. Clean Anti-aliased Dot Sprites (Cool, White, Warm) - 16x16
  const makeDot = (inner: string, mid: string) => {
    const c = document.createElement('canvas');
    c.width = 16;
    c.height = 16;
    const ctx = c.getContext('2d');
    if (ctx) {
      const g = ctx.createRadialGradient(8, 8, 0, 8, 8, 7.5);
      g.addColorStop(0, inner);
      g.addColorStop(0.6, mid);
      g.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 16, 16);
    }
    return c;
  };

  const dotCool = makeDot('rgba(255, 255, 255, 1)', 'rgba(219, 234, 254, 0.85)');
  const dotWhite = makeDot('rgba(255, 255, 255, 1)', 'rgba(255, 255, 255, 0.85)');
  const dotWarm = makeDot('rgba(255, 255, 255, 1)', 'rgba(254, 240, 138, 0.85)');

  // 5. Shooting Star Streak Sprite - 160x16
  const streak = document.createElement('canvas');
  streak.width = 160;
  streak.height = 16;
  const ctxStreak = streak.getContext('2d');
  if (ctxStreak) {
    const sGrad = ctxStreak.createLinearGradient(0, 8, 160, 8);
    sGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    sGrad.addColorStop(0.65, 'rgba(219, 234, 254, 0.45)');
    sGrad.addColorStop(0.95, 'rgba(255, 255, 255, 0.95)');
    sGrad.addColorStop(1, 'rgba(255, 255, 255, 1.0)');

    ctxStreak.fillStyle = sGrad;
    ctxStreak.beginPath();
    ctxStreak.moveTo(0, 8);
    ctxStreak.lineTo(155, 6.5);
    ctxStreak.lineTo(160, 8);
    ctxStreak.lineTo(155, 9.5);
    ctxStreak.closePath();
    ctxStreak.fill();

    // Head flare
    ctxStreak.beginPath();
    ctxStreak.arc(156, 8, 3, 0, Math.PI * 2);
    ctxStreak.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctxStreak.fill();
  }

  return {
    glowCool,
    glowWarm,
    spike,
    dotCool,
    dotWhite,
    dotWarm,
    streak,
  };
}

export function StarsScene({ speedMultiplier = 1 }: { speedMultiplier?: number }) {
  const starsRef = useRef<Star[]>([]);
  const spritesRef = useRef<StarSprites | null>(null);

  const shootingStarRef = useRef<ShootingStar>({
    active: false,
    elapsed: 0,
    duration: 0.9, // 900ms streak
    startX: 0,
    startY: 0,
    vx: 0,
    vy: 0,
    speed: 0,
    angle: 0,
    length: 140,
  });
  const shootingStarTimerRef = useRef<number>(18);
  const isTimerInitializedRef = useRef<boolean>(false);
  const lastDimensionsRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });

  // Desktop pointer parallax (at most 12px)
  const [parallaxOffset, setParallaxOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    // Pre-render sprites once
    spritesRef.current = createStarSprites();

    const handleMouseMove = (e: MouseEvent) => {
      if (typeof window === 'undefined') return;
      const xRatio = (e.clientX / window.innerWidth) - 0.5;
      const yRatio = (e.clientY / window.innerHeight) - 0.5;
      setParallaxOffset({
        x: xRatio * 12,
        y: yRatio * 12,
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const draw = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      width: number,
      height: number,
      dt: number,
      quality: number
    ) => {
      ctx.clearRect(0, 0, width, height);

      // Lazy sprite initialization fallback
      if (!spritesRef.current) {
        spritesRef.current = createStarSprites();
      }
      const sprites = spritesRef.current;
      if (!sprites) return;

      if (!isTimerInitializedRef.current) {
        isTimerInitializedRef.current = true;
        shootingStarTimerRef.current = 15 + Math.random() * 10; // 15 to 25 seconds
      }

      // Star count: about area / 3000, capped at 420 (halved by quality factor on low-tier screens)
      const targetDensity = (width * height) / 3000;
      const baseCap = 420;
      const targetTotal = Math.max(
        60,
        Math.min(Math.floor(baseCap * quality), Math.floor(targetDensity * quality))
      );

      // Re-populate stars on resize
      if (
        starsRef.current.length === 0 ||
        Math.abs(lastDimensionsRef.current.w - width) > 80 ||
        Math.abs(lastDimensionsRef.current.h - height) > 80
      ) {
        lastDimensionsRef.current = { w: width, h: height };
        const newStars: Star[] = [];

        const farCount = Math.floor(targetTotal * 0.55);
        const midCount = Math.floor(targetTotal * 0.32);
        const nearCount = targetTotal - farCount - midCount;

        // Color distribution
        const pickColor = (): 'cool' | 'white' | 'warm' => {
          const r = Math.random();
          if (r < 0.55) return 'cool';
          if (r < 0.85) return 'white';
          return 'warm';
        };

        // Far layer: 0.5 - 1.0px, slowest drift
        for (let i = 0; i < farCount; i++) {
          newStars.push({
            x: Math.random() * width,
            y: Math.random() * height,
            size: 0.5 + Math.random() * 0.6,
            baseAlpha: 0.25 + Math.random() * 0.3,
            twinklePhase: Math.random() * Math.PI * 2,
            twinkleSpeed: 0.6 + Math.random() * 0.9,
            vx: -3.5,
            vy: 2.2,
            layer: 'far',
            colorType: pickColor(),
          });
        }

        // Mid layer: 1.0 - 1.7px, moderate drift
        for (let i = 0; i < midCount; i++) {
          newStars.push({
            x: Math.random() * width,
            y: Math.random() * height,
            size: 1.0 + Math.random() * 0.7,
            baseAlpha: 0.45 + Math.random() * 0.35,
            twinklePhase: Math.random() * Math.PI * 2,
            twinkleSpeed: 0.9 + Math.random() * 1.2,
            vx: -7.0,
            vy: 4.5,
            layer: 'mid',
            colorType: pickColor(),
          });
        }

        // Near layer: 1.7 - 2.4px, fastest drift
        for (let i = 0; i < nearCount; i++) {
          newStars.push({
            x: Math.random() * width,
            y: Math.random() * height,
            size: 1.7 + Math.random() * 0.7,
            baseAlpha: 0.7 + Math.random() * 0.3,
            twinklePhase: Math.random() * Math.PI * 2,
            twinkleSpeed: 1.2 + Math.random() * 1.4,
            vx: -12.5,
            vy: 8.0,
            layer: 'near',
            colorType: pickColor(),
          });
        }

        // Assign 5 to 8 hero stars with pre-rendered soft glow, and 3 with 4-point cross spikes
        const heroIndices = new Set<number>();
        const heroTarget = Math.min(8, Math.max(5, Math.floor(7 * quality)));
        while (heroIndices.size < heroTarget) {
          heroIndices.add(Math.floor(Math.random() * newStars.length));
        }

        let spikeCount = 0;
        heroIndices.forEach((idx) => {
          newStars[idx].isHero = true;
          newStars[idx].size = Math.max(2.4, newStars[idx].size * 1.3);
          newStars[idx].baseAlpha = 0.95;
          if (spikeCount < 3) {
            newStars[idx].hasSpike = true;
            spikeCount++;
          }
        });

        starsRef.current = newStars;
      }

      // Draw all stars using pre-rendered offscreen sprites (zero shadowBlur / zero per-frame gradients!)
      const stars = starsRef.current;
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        if (dt > 0) {
          star.x += star.vx * dt;
          star.y += star.vy * dt;
          star.twinklePhase += star.twinkleSpeed * dt;

          if (star.x < -15) star.x += width + 30;
          if (star.x > width + 15) star.x -= width + 30;
          if (star.y > height + 15) star.y -= height + 30;
          if (star.y < -15) star.y += height + 30;
        }

        const alpha = Math.max(
          0.06,
          Math.min(1.0, star.baseAlpha * (0.55 + 0.45 * Math.sin(star.twinklePhase)))
        );

        ctx.globalAlpha = alpha;

        if (star.isHero) {
          // Hero star with soft glow sprite
          const glowSize = star.hasSpike ? 24 : 18;
          const glowCanvas = star.colorType === 'warm' ? sprites.glowWarm : sprites.glowCool;
          ctx.drawImage(
            glowCanvas,
            star.x - glowSize / 2,
            star.y - glowSize / 2,
            glowSize,
            glowSize
          );

          // Hero diffraction cross spike
          if (star.hasSpike) {
            const spikeSize = 34;
            ctx.drawImage(
              sprites.spike,
              star.x - spikeSize / 2,
              star.y - spikeSize / 2,
              spikeSize,
              spikeSize
            );
          }
        } else {
          // Standard star drawn via pre-rendered anti-aliased dot sprite
          const dotCanvas =
            star.colorType === 'cool'
              ? sprites.dotCool
              : star.colorType === 'warm'
              ? sprites.dotWarm
              : sprites.dotWhite;
          const s = Math.max(1.2, star.size * 2.2);
          ctx.drawImage(dotCanvas, star.x - s / 2, star.y - s / 2, s, s);
        }
      }

      // Shooting Star (every 15 to 25s, lasting about 900ms, gradient streak)
      const ss = shootingStarRef.current;
      if (dt > 0) {
        if (!ss.active) {
          shootingStarTimerRef.current -= dt;
          if (shootingStarTimerRef.current <= 0) {
            ss.active = true;
            ss.elapsed = 0;
            ss.duration = 0.9; // 900ms streak
            ss.startX = width * (0.35 + Math.random() * 0.55);
            ss.startY = height * (0.04 + Math.random() * 0.22);
            ss.angle = (132 + Math.random() * 22) * (Math.PI / 180);
            ss.speed = 1050 + Math.random() * 250;
            ss.vx = Math.cos(ss.angle) * ss.speed;
            ss.vy = Math.sin(ss.angle) * ss.speed;
            ss.length = 135 + Math.random() * 45;
          }
        } else {
          ss.elapsed += dt;
          if (ss.elapsed >= ss.duration) {
            ss.active = false;
            shootingStarTimerRef.current = 15 + Math.random() * 10; // reset 15 to 25s
          }
        }
      }

      if (ss.active) {
        const headX = ss.startX + ss.vx * ss.elapsed;
        const headY = ss.startY + ss.vy * ss.elapsed;

        let fade = 1.0;
        if (ss.elapsed < 0.15) {
          fade = ss.elapsed / 0.15;
        } else if (ss.elapsed > 0.6) {
          fade = Math.max(0, (ss.duration - ss.elapsed) / 0.3);
        }

        ctx.save();
        ctx.globalAlpha = fade;
        ctx.translate(headX, headY);
        ctx.rotate(ss.angle);
        // Draw the pre-rendered streak sprite trailing backward from (0,0)
        ctx.drawImage(sprites.streak, -ss.length, -8, ss.length, 16);
        ctx.restore();
      }

      ctx.globalAlpha = 1.0;
    },
    []
  );

  const { canvasRef } = useSceneCanvas(draw, { speedMultiplier });

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none select-none"
      style={{
        // 1. Sky vertical gradient: #0B1030 top -> #070A1C mid -> #03040B bottom
        background: 'linear-gradient(180deg, #0B1030 0%, #070A1C 52%, #03040B 100%)',
        transform: `translate3d(${parallaxOffset.x}px, ${parallaxOffset.y}px, 0)`,
        transition: 'transform 200ms cubic-bezier(0.1, 0.9, 0.2, 1)',
      }}
    >
      <style>{`
        @keyframes breathingScale {
          0%, 100% { transform: scale(1.0); }
          50% { transform: scale(1.03); }
        }
        @keyframes nebulaSlow1 {
          0% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(4vw, -3vh, 0); }
          100% { transform: translate3d(-3vw, 2vh, 0); }
        }
        @keyframes nebulaSlow2 {
          0% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(-5vw, 4vh, 0); }
          100% { transform: translate3d(3vw, -2vh, 0); }
        }
        @keyframes nebulaSlow3 {
          0% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(3vw, 3vh, 0); }
          100% { transform: translate3d(-4vw, -2vh, 0); }
        }
      `}</style>

      {/* Breathing scale wrapper (1.00 to 1.03 over 40s) */}
      <div
        className="absolute inset-0"
        style={{
          animation: 'breathingScale 40s ease-in-out infinite alternate',
        }}
      >
        {/* Faint diagonal "Milky Way" band (about 12% opacity, lighter and warmer in the middle) */}
        <div
          className="absolute w-[180vw] h-[45vh] -left-[40vw] top-[18vh] pointer-events-none"
          style={{
            transform: 'rotate(-32deg)',
            background:
              'linear-gradient(90deg, transparent 0%, rgba(186, 210, 255, 0.03) 25%, rgba(224, 215, 250, 0.12) 47%, rgba(255, 238, 220, 0.14) 53%, rgba(186, 210, 255, 0.04) 75%, transparent 100%)',
            opacity: 0.85,
            filter: 'blur(35px)',
          }}
        />

        {/* 3 Large Soft Nebula Clouds (violet, blue-teal, small magenta) at 8% to 14% opacity */}
        <div
          className="absolute w-[68vw] h-[68vw] max-w-[850px] max-h-[850px] rounded-full pointer-events-none"
          style={{
            top: '8%',
            left: '12%',
            background:
              'radial-gradient(circle, rgba(147, 51, 234, 0.13) 0%, rgba(126, 34, 206, 0.05) 45%, transparent 72%)',
            animation: 'nebulaSlow1 75s ease-in-out infinite alternate',
          }}
        />
        <div
          className="absolute w-[62vw] h-[62vw] max-w-[780px] max-h-[780px] rounded-full pointer-events-none"
          style={{
            bottom: '12%',
            right: '10%',
            background:
              'radial-gradient(circle, rgba(14, 165, 233, 0.12) 0%, rgba(20, 184, 166, 0.05) 50%, transparent 70%)',
            animation: 'nebulaSlow2 88s ease-in-out infinite alternate',
          }}
        />
        <div
          className="absolute w-[45vw] h-[45vw] max-w-[560px] max-h-[560px] rounded-full pointer-events-none"
          style={{
            top: '42%',
            left: '48%',
            background:
              'radial-gradient(circle, rgba(236, 72, 153, 0.09) 0%, rgba(219, 39, 119, 0.03) 45%, transparent 68%)',
            animation: 'nebulaSlow3 64s ease-in-out infinite alternate',
          }}
        />

        {/* Dynamic Starfield Canvas */}
        <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full" />
      </div>
    </div>
  );
}
