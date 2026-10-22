'use client';

import React, { useCallback, useRef, useEffect } from 'react';
import { useSceneCanvas } from './useSceneCanvas';

interface RestingDrop {
  x: number;
  y: number;
  r: number;
  tint: 'neutral' | 'warm' | 'cool';
}

interface RunningDrop {
  x: number;
  y: number;
  r: number;
  vy: number;
  vx: number;
  tint: 'neutral' | 'warm' | 'cool';
  trail: { x: number; y: number; r: number; alpha: number }[];
}

interface RainSprites {
  neutralBead: HTMLCanvasElement;
  warmBead: HTMLCanvasElement;
  coolBead: HTMLCanvasElement;
  trailStamp: HTMLCanvasElement;
}

function createRainSprites(): RainSprites | null {
  if (typeof document === 'undefined') return null;

  const makeBead = (tintGlow: string) => {
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 64;
    const ctx = c.getContext('2d');
    if (!ctx) return c;

    const cx = 32;
    const cy = 32;
    const r = 26;

    // 1. Drop shadow behind the bead
    const shadowGrad = ctx.createRadialGradient(cx, cy + 3, r * 0.7, cx, cy + 3, r * 1.15);
    shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
    shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.arc(cx, cy + 3, r * 1.15, 0, Math.PI * 2);
    ctx.fill();

    // 2. Dark refracted center of the droplet
    const centerGrad = ctx.createRadialGradient(cx - 2, cy - 2, 0, cx, cy, r);
    centerGrad.addColorStop(0, 'rgba(8, 14, 24, 0.35)');
    centerGrad.addColorStop(0.65, 'rgba(5, 10, 20, 0.65)');
    centerGrad.addColorStop(1, 'rgba(2, 5, 12, 0.85)');
    ctx.fillStyle = centerGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // 3. Bottom reflected tint (city light reflection)
    const tintGrad = ctx.createRadialGradient(cx, cy + r * 0.5, 0, cx, cy + r * 0.4, r * 0.8);
    tintGrad.addColorStop(0, tintGlow);
    tintGrad.addColorStop(0.7, 'rgba(255, 255, 255, 0.15)');
    tintGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = tintGrad;
    ctx.beginPath();
    ctx.arc(cx, cy + r * 0.1, r * 0.9, 0, Math.PI);
    ctx.fill();

    // 4. Bright thin crescent rim
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.beginPath();
    ctx.arc(cx, cy, r - 0.9, Math.PI * 0.75, Math.PI * 1.85);
    ctx.stroke();

    // Bottom softer rim
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.beginPath();
    ctx.arc(cx, cy, r - 0.9, 0, Math.PI);
    ctx.stroke();

    // 5. Specular highlight (crisp white dot)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
    ctx.beginPath();
    ctx.arc(cx - r * 0.35, cy - r * 0.35, r * 0.22, 0, Math.PI * 2);
    ctx.fill();

    // Secondary smaller highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.beginPath();
    ctx.arc(cx - r * 0.15, cy - r * 0.48, r * 0.1, 0, Math.PI * 2);
    ctx.fill();

    return c;
  };

  const neutralBead = makeBead('rgba(210, 235, 255, 0.35)');
  const warmBead = makeBead('rgba(251, 191, 36, 0.45)');
  const coolBead = makeBead('rgba(56, 189, 248, 0.45)');

  // Trail stamp - 16x16
  const trailStamp = document.createElement('canvas');
  trailStamp.width = 16;
  trailStamp.height = 16;
  const ctxTrail = trailStamp.getContext('2d');
  if (ctxTrail) {
    const tg = ctxTrail.createRadialGradient(8, 8, 0, 8, 8, 8);
    tg.addColorStop(0, 'rgba(224, 242, 254, 0.6)');
    tg.addColorStop(0.5, 'rgba(186, 230, 253, 0.3)');
    tg.addColorStop(1, 'rgba(186, 230, 253, 0)');
    ctxTrail.fillStyle = tg;
    ctxTrail.fillRect(0, 0, 16, 16);
  }

  return {
    neutralBead,
    warmBead,
    coolBead,
    trailStamp,
  };
}

export function RainScene({ speedMultiplier = 1 }: { speedMultiplier?: number }) {
  const restingDropsRef = useRef<RestingDrop[]>([]);
  const runningDropsRef = useRef<RunningDrop[]>([]);
  const spritesRef = useRef<RainSprites | null>(null);

  const lastSpawnTimeRef = useRef<number>(0);
  const nextSpawnDelayRef = useRef<number>(1.8);
  const lastDimensionsRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });

  useEffect(() => {
    spritesRef.current = createRainSprites();
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

      if (!spritesRef.current) {
        spritesRef.current = createRainSprites();
      }
      const sprites = spritesRef.current;
      if (!sprites) return;

      // Target droplet density (area / 16000, capped at 75)
      const targetCount = Math.max(
        22,
        Math.min(Math.floor(75 * quality), Math.floor((width * height) / 16000 * quality))
      );
      // Up to 8 running drops at once
      const maxRunning = Math.min(8, Math.max(3, Math.floor(8 * quality)));

      // Initialize or scale resting droplets
      if (
        restingDropsRef.current.length === 0 ||
        Math.abs(lastDimensionsRef.current.w - width) > 80 ||
        Math.abs(lastDimensionsRef.current.h - height) > 80
      ) {
        lastDimensionsRef.current = { w: width, h: height };
        const drops: RestingDrop[] = [];

        for (let i = 0; i < targetCount; i++) {
          // Vary sizes from 2 to 7px (many tiny, some larger)
          const sizeRand = Math.random();
          let radius: number;
          if (sizeRand < 0.6) {
            radius = 2.0 + Math.random() * 1.5; // tiny: 2.0 - 3.5px
          } else if (sizeRand < 0.88) {
            radius = 3.5 + Math.random() * 1.8; // medium: 3.5 - 5.3px
          } else {
            radius = 5.3 + Math.random() * 1.7; // large: 5.3 - 7.0px
          }

          // Tint distribution
          const tintRand = Math.random();
          const tint: 'neutral' | 'warm' | 'cool' =
            tintRand < 0.45 ? 'warm' : tintRand < 0.8 ? 'cool' : 'neutral';

          drops.push({
            x: Math.random() * (width - 30) + 15,
            y: Math.random() * (height - 30) + 15,
            r: radius,
            tint,
          });
        }
        restingDropsRef.current = drops;
      }

      // Spawn running drop (up to 8 at once)
      if (dt > 0) {
        lastSpawnTimeRef.current += dt;
        if (
          lastSpawnTimeRef.current >= nextSpawnDelayRef.current &&
          runningDropsRef.current.length < maxRunning &&
          restingDropsRef.current.length > 8
        ) {
          lastSpawnTimeRef.current = 0;
          nextSpawnDelayRef.current = 1.4 + Math.random() * 2.2;

          // Pick an eligible resting droplet in upper 65% of screen
          const eligibleIdx = restingDropsRef.current.findIndex(
            (d) => d.y < height * 0.65 && d.r >= 3.0
          );
          if (eligibleIdx !== -1) {
            const chosen = restingDropsRef.current.splice(eligibleIdx, 1)[0];
            runningDropsRef.current.push({
              x: chosen.x,
              y: chosen.y,
              r: chosen.r + 0.5,
              vy: 35 + Math.random() * 25,
              vx: (Math.random() - 0.5) * 6,
              tint: chosen.tint,
              trail: [],
            });
          }
        }
      }

      // Helper to draw pre-rendered droplet sprite
      const drawBead = (x: number, y: number, r: number, tint: 'neutral' | 'warm' | 'cool') => {
        const sprite =
          tint === 'warm'
            ? sprites.warmBead
            : tint === 'cool'
            ? sprites.coolBead
            : sprites.neutralBead;
        ctx.drawImage(sprite, x - r, y - r, r * 2, r * 2);
      };

      // 1. Draw resting droplets
      const restingDrops = restingDropsRef.current;
      for (let i = 0; i < restingDrops.length; i++) {
        const drop = restingDrops[i];
        drawBead(drop.x, drop.y, drop.r, drop.tint);
      }

      // 2. Update & Draw running drops (with 3s fading trail and merging)
      const remainingRunning: RunningDrop[] = [];

      for (let i = 0; i < runningDropsRef.current.length; i++) {
        const drop = runningDropsRef.current[i];

        if (dt > 0) {
          // Physics: acceleration downward + sideways jitter
          drop.vy += 150 * dt;
          drop.vx += (Math.random() - 0.5) * 25 * dt;
          drop.vx = Math.max(-12, Math.min(12, drop.vx));

          drop.y += drop.vy * dt;
          drop.x += drop.vx * dt;

          // Add trail point
          if (
            drop.trail.length === 0 ||
            Math.hypot(
              drop.x - drop.trail[drop.trail.length - 1].x,
              drop.y - drop.trail[drop.trail.length - 1].y
            ) > 7
          ) {
            drop.trail.push({
              x: drop.x,
              y: drop.y,
              r: Math.max(1.2, drop.r * 0.45),
              alpha: 0.55,
            });
          }

          // Trail fades over about 3 seconds
          const fadeSpeed = 1 / 3.0;
          for (let t = 0; t < drop.trail.length; t++) {
            drop.trail[t].alpha -= dt * fadeSpeed;
          }
          drop.trail = drop.trail.filter((t) => t.alpha > 0);

          // Optional merging: if running drop touches a resting droplet, absorb it!
          for (let rIdx = restingDropsRef.current.length - 1; rIdx >= 0; rIdx--) {
            const rd = restingDropsRef.current[rIdx];
            const dist = Math.hypot(drop.x - rd.x, drop.y - rd.y);
            if (dist < drop.r + rd.r) {
              drop.r = Math.min(7.5, drop.r + 0.25);
              restingDropsRef.current.splice(rIdx, 1);
            }
          }
        }

        // Draw trail stamps
        for (let t = 0; t < drop.trail.length; t++) {
          const pt = drop.trail[t];
          ctx.globalAlpha = pt.alpha;
          const ts = pt.r * 2.2;
          ctx.drawImage(sprites.trailStamp, pt.x - ts / 2, pt.y - ts / 2, ts, ts);
        }
        ctx.globalAlpha = 1.0;

        // Draw running head bead
        drawBead(drop.x, drop.y, drop.r, drop.tint);

        // Check if leaving bottom
        if (drop.y > height + 25) {
          // Respawns as resting droplet elsewhere
          const sizeRand = Math.random();
          const r = sizeRand < 0.6 ? 2.2 + Math.random() * 1.5 : 3.8 + Math.random() * 2.2;
          restingDropsRef.current.push({
            x: Math.random() * (width - 30) + 15,
            y: Math.random() * (height - 30) + 15,
            r,
            tint: Math.random() > 0.5 ? 'warm' : 'cool',
          });
        } else {
          remainingRunning.push(drop);
        }
      }

      runningDropsRef.current = remainingRunning;
    },
    []
  );

  const { canvasRef } = useSceneCanvas(draw, { speedMultiplier });

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none select-none"
      style={{
        // Dark blue-grey base gradient
        background: 'linear-gradient(180deg, #070c14 0%, #0e1726 50%, #060a12 100%)',
      }}
    >
      <style>{`
        @keyframes bokehPulse1 {
          0%, 100% { opacity: 0.22; transform: scale(1.0); }
          50% { opacity: 0.35; transform: scale(1.08); }
        }
        @keyframes bokehPulse2 {
          0%, 100% { opacity: 0.20; transform: scale(1.0); }
          50% { opacity: 0.34; transform: scale(1.1); }
        }
        @keyframes bokehPulse3 {
          0%, 100% { opacity: 0.18; transform: scale(1.0); }
          50% { opacity: 0.32; transform: scale(1.07); }
        }
      `}</style>

      {/* 10 to 14 Large clearly visible bokeh circles of city lights (warm amber, soft cyan, pink) at 18-35% opacity */}
      <div
        className="absolute w-[46vw] h-[46vw] max-w-[500px] max-h-[500px] rounded-full"
        style={{
          top: '6%',
          left: '10%',
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.32) 0%, rgba(245, 158, 11, 0.08) 55%, transparent 72%)',
          animation: 'bokehPulse1 14s ease-in-out infinite',
          animationDelay: '0s',
        }}
      />
      <div
        className="absolute w-[50vw] h-[50vw] max-w-[550px] max-h-[550px] rounded-full"
        style={{
          top: '30%',
          right: '8%',
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.30) 0%, rgba(56, 189, 248, 0.07) 50%, transparent 70%)',
          animation: 'bokehPulse2 18s ease-in-out infinite',
          animationDelay: '3s',
        }}
      />
      <div
        className="absolute w-[40vw] h-[40vw] max-w-[440px] max-h-[440px] rounded-full"
        style={{
          bottom: '16%',
          left: '22%',
          background: 'radial-gradient(circle, rgba(244, 63, 94, 0.28) 0%, rgba(244, 63, 94, 0.06) 45%, transparent 68%)',
          animation: 'bokehPulse3 16s ease-in-out infinite',
          animationDelay: '6s',
        }}
      />
      <div
        className="absolute w-[36vw] h-[36vw] max-w-[400px] max-h-[400px] rounded-full"
        style={{
          top: '18%',
          left: '52%',
          background: 'radial-gradient(circle, rgba(251, 191, 36, 0.29) 0%, rgba(251, 191, 36, 0.07) 50%, transparent 70%)',
          animation: 'bokehPulse1 13s ease-in-out infinite',
          animationDelay: '2s',
        }}
      />
      <div
        className="absolute w-[42vw] h-[42vw] max-w-[460px] max-h-[460px] rounded-full"
        style={{
          bottom: '10%',
          right: '25%',
          background: 'radial-gradient(circle, rgba(251, 146, 60, 0.31) 0%, rgba(251, 146, 60, 0.08) 50%, transparent 70%)',
          animation: 'bokehPulse2 21s ease-in-out infinite',
          animationDelay: '5s',
        }}
      />
      <div
        className="absolute w-[35vw] h-[35vw] max-w-[390px] max-h-[390px] rounded-full"
        style={{
          top: '52%',
          left: '6%',
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.27) 0%, rgba(6, 182, 212, 0.06) 48%, transparent 70%)',
          animation: 'bokehPulse3 17s ease-in-out infinite',
          animationDelay: '8s',
        }}
      />
      <div
        className="absolute w-[44vw] h-[44vw] max-w-[480px] max-h-[480px] rounded-full"
        style={{
          top: '3%',
          right: '28%',
          background: 'radial-gradient(circle, rgba(234, 179, 8, 0.28) 0%, rgba(234, 179, 8, 0.07) 48%, transparent 68%)',
          animation: 'bokehPulse1 19s ease-in-out infinite',
          animationDelay: '4s',
        }}
      />
      <div
        className="absolute w-[34vw] h-[34vw] max-w-[360px] max-h-[360px] rounded-full"
        style={{
          bottom: '32%',
          right: '12%',
          background: 'radial-gradient(circle, rgba(236, 72, 153, 0.26) 0%, rgba(236, 72, 153, 0.05) 45%, transparent 66%)',
          animation: 'bokehPulse2 15s ease-in-out infinite',
          animationDelay: '9s',
        }}
      />
      <div
        className="absolute w-[38vw] h-[38vw] max-w-[410px] max-h-[410px] rounded-full"
        style={{
          bottom: '2%',
          left: '42%',
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.33) 0%, rgba(245, 158, 11, 0.07) 50%, transparent 70%)',
          animation: 'bokehPulse3 23s ease-in-out infinite',
          animationDelay: '1s',
        }}
      />
      <div
        className="absolute w-[32vw] h-[32vw] max-w-[350px] max-h-[350px] rounded-full"
        style={{
          top: '38%',
          left: '32%',
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, rgba(56, 189, 248, 0.05) 45%, transparent 68%)',
          animation: 'bokehPulse1 16s ease-in-out infinite',
          animationDelay: '7s',
        }}
      />
      <div
        className="absolute w-[40vw] h-[40vw] max-w-[430px] max-h-[430px] rounded-full"
        style={{
          top: '68%',
          right: '38%',
          background: 'radial-gradient(circle, rgba(251, 191, 36, 0.29) 0%, rgba(251, 191, 36, 0.06) 48%, transparent 70%)',
          animation: 'bokehPulse2 20s ease-in-out infinite',
          animationDelay: '11s',
        }}
      />
      <div
        className="absolute w-[30vw] h-[30vw] max-w-[330px] max-h-[330px] rounded-full"
        style={{
          top: '12%',
          right: '4%',
          background: 'radial-gradient(circle, rgba(244, 63, 94, 0.26) 0%, rgba(244, 63, 94, 0.05) 45%, transparent 66%)',
          animation: 'bokehPulse3 14s ease-in-out infinite',
          animationDelay: '5s',
        }}
      />

      {/* Condensation haze on edges and vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, transparent 45%, rgba(180, 215, 245, 0.06) 80%, rgba(140, 185, 225, 0.12) 100%)',
        }}
      />

      {/* Droplets Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full" />

      {/* Stronger condensation fog haze near bottom */}
      <div
        className="absolute inset-x-0 bottom-0 h-56 pointer-events-none"
        style={{
          background:
            'linear-gradient(to top, rgba(160, 200, 235, 0.14) 0%, rgba(130, 180, 225, 0.05) 50%, transparent 100%)',
        }}
      />
    </div>
  );
}
