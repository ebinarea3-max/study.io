'use client';

import React, { useCallback, useRef } from 'react';
import { useSceneCanvas } from './useSceneCanvas';

interface RestingDrop {
  x: number;
  y: number;
  r: number;
  wobble: number;
}

interface RunningDrop {
  x: number;
  y: number;
  r: number;
  vy: number;
  vx: number;
  trail: { x: number; y: number; r: number; alpha: number }[];
}

export function RainScene({ speedMultiplier = 1 }: { speedMultiplier?: number }) {
  const restingDropsRef = useRef<RestingDrop[]>([]);
  const runningDropsRef = useRef<RunningDrop[]>([]);
  const lastSpawnTimeRef = useRef<number>(0);
  const nextSpawnDelayRef = useRef<number>(2.5);
  const lastDimensionsRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });

  const draw = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      width: number,
      height: number,
      dt: number,
      quality: number
    ) => {
      // Clear entire canvas frame
      ctx.clearRect(0, 0, width, height);

      const targetCount = Math.max(
        12,
        Math.min(Math.floor(45 * quality), Math.floor((width * height) / 22000 * quality))
      );
      const maxRunning = Math.min(6, Math.max(2, Math.floor(6 * quality)));

      // Initialize or scale resting drops if dimensions changed
      if (
        restingDropsRef.current.length === 0 ||
        Math.abs(lastDimensionsRef.current.w - width) > 100 ||
        Math.abs(lastDimensionsRef.current.h - height) > 100
      ) {
        lastDimensionsRef.current = { w: width, h: height };
        const drops: RestingDrop[] = [];
        for (let i = 0; i < targetCount; i++) {
          drops.push({
            x: Math.random() * (width - 30) + 15,
            y: Math.random() * (height - 30) + 15,
            r: 1.5 + Math.random() * 2.5,
            wobble: Math.random() * Math.PI * 2,
          });
        }
        restingDropsRef.current = drops;
      }

      // Check running drops spawn
      if (dt > 0) {
        lastSpawnTimeRef.current += dt;
        if (
          lastSpawnTimeRef.current >= nextSpawnDelayRef.current &&
          runningDropsRef.current.length < maxRunning &&
          restingDropsRef.current.length > 5
        ) {
          lastSpawnTimeRef.current = 0;
          nextSpawnDelayRef.current = 2.0 + Math.random() * 3.0;

          // Pick a resting drop from top 65% to start running
          const eligibleIdx = restingDropsRef.current.findIndex((d) => d.y < height * 0.65);
          if (eligibleIdx !== -1) {
            const chosen = restingDropsRef.current.splice(eligibleIdx, 1)[0];
            runningDropsRef.current.push({
              x: chosen.x,
              y: chosen.y,
              r: chosen.r + 0.8,
              vy: 35 + Math.random() * 25,
              vx: (Math.random() - 0.5) * 8,
              trail: [],
            });
          }
        }
      }

      // Draw resting droplets
      for (let i = 0; i < restingDropsRef.current.length; i++) {
        const drop = restingDropsRef.current[i];

        // Bottom refraction shadow
        ctx.beginPath();
        ctx.arc(drop.x, drop.y + drop.r * 0.25, drop.r, 0, Math.PI);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.fill();

        // Droplet body
        ctx.beginPath();
        ctx.arc(drop.x, drop.y, drop.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(195, 220, 245, 0.25)';
        ctx.fill();

        // Top crescent highlight
        ctx.beginPath();
        ctx.arc(drop.x, drop.y - drop.r * 0.2, drop.r * 0.65, Math.PI * 1.15, Math.PI * 1.85);
        ctx.lineWidth = Math.max(0.7, drop.r * 0.35);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.stroke();

        // Tiny specular dot
        ctx.beginPath();
        ctx.arc(drop.x + drop.r * 0.15, drop.y - drop.r * 0.25, Math.max(0.5, drop.r * 0.2), 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fill();
      }

      // Update & Draw running droplets
      const remainingRunning: RunningDrop[] = [];

      for (let i = 0; i < runningDropsRef.current.length; i++) {
        const drop = runningDropsRef.current[i];

        if (dt > 0) {
          // Physics: accelerate downward + sideways jitter
          drop.vy += 160 * dt;
          drop.vx += (Math.random() - 0.5) * 30 * dt;
          drop.vx = Math.max(-15, Math.min(15, drop.vx));

          drop.y += drop.vy * dt;
          drop.x += drop.vx * dt;

          // Add trail point every few pixels
          if (
            drop.trail.length === 0 ||
            Math.hypot(
              drop.x - drop.trail[drop.trail.length - 1].x,
              drop.y - drop.trail[drop.trail.length - 1].y
            ) > 8
          ) {
            drop.trail.push({
              x: drop.x,
              y: drop.y,
              r: Math.max(0.8, drop.r * 0.45),
              alpha: 0.45,
            });
          }

          // Age trail
          for (let t = 0; t < drop.trail.length; t++) {
            drop.trail[t].alpha -= dt * 0.35;
          }
          drop.trail = drop.trail.filter((t) => t.alpha > 0);
        }

        // Draw trail
        for (let t = 0; t < drop.trail.length; t++) {
          const pt = drop.trail[t];
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(200, 225, 250, ${pt.alpha.toFixed(3)})`;
          ctx.fill();
        }

        // Draw running head droplet (tear/oval shape)
        ctx.save();
        ctx.beginPath();
        ctx.arc(drop.x, drop.y + drop.r * 0.3, drop.r, 0, Math.PI);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fill();

        ctx.beginPath();
        ctx.ellipse(drop.x, drop.y, drop.r * 0.85, drop.r * 1.25, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(210, 235, 255, 0.35)';
        ctx.fill();

        // Highlight
        ctx.beginPath();
        ctx.arc(drop.x, drop.y - drop.r * 0.3, drop.r * 0.6, Math.PI * 1.1, Math.PI * 1.9);
        ctx.lineWidth = Math.max(0.8, drop.r * 0.35);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.stroke();
        ctx.restore();

        // Check if leaving bottom
        if (drop.y > height + 20) {
          // Respawns as resting droplet elsewhere
          restingDropsRef.current.push({
            x: Math.random() * (width - 30) + 15,
            y: Math.random() * (height - 30) + 15,
            r: 1.5 + Math.random() * 2.5,
            wobble: Math.random() * Math.PI * 2,
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
        background: 'linear-gradient(180deg, #070c14 0%, #0d1624 50%, #080d16 100%)',
      }}
    >
      <style>{`
        @keyframes slowBokehPulse {
          0%, 100% { opacity: 0.22; transform: scale(1); }
          50% { opacity: 0.52; transform: scale(1.08); }
        }
      `}</style>

      {/* 6 to 8 Soft bokeh circles in muted warm and cool tones pulsing slowly */}
      <div
        className="absolute w-[44vw] h-[44vw] max-w-[500px] max-h-[500px] rounded-full"
        style={{
          top: '8%',
          left: '12%',
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.18) 0%, rgba(245, 158, 11, 0) 70%)',
          animation: 'slowBokehPulse 14s ease-in-out infinite',
          animationDelay: '0s',
        }}
      />
      <div
        className="absolute w-[48vw] h-[48vw] max-w-[540px] max-h-[540px] rounded-full"
        style={{
          top: '32%',
          right: '10%',
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, rgba(56, 189, 248, 0) 70%)',
          animation: 'slowBokehPulse 17s ease-in-out infinite',
          animationDelay: '3s',
        }}
      />
      <div
        className="absolute w-[38vw] h-[38vw] max-w-[420px] max-h-[420px] rounded-full"
        style={{
          bottom: '18%',
          left: '25%',
          background: 'radial-gradient(circle, rgba(244, 63, 94, 0.12) 0%, rgba(244, 63, 94, 0) 70%)',
          animation: 'slowBokehPulse 19s ease-in-out infinite',
          animationDelay: '7s',
        }}
      />
      <div
        className="absolute w-[36vw] h-[36vw] max-w-[400px] max-h-[400px] rounded-full"
        style={{
          top: '20%',
          left: '55%',
          background: 'radial-gradient(circle, rgba(20, 184, 166, 0.14) 0%, rgba(20, 184, 166, 0) 70%)',
          animation: 'slowBokehPulse 15s ease-in-out infinite',
          animationDelay: '2s',
        }}
      />
      <div
        className="absolute w-[40vw] h-[40vw] max-w-[460px] max-h-[460px] rounded-full"
        style={{
          bottom: '8%',
          right: '22%',
          background: 'radial-gradient(circle, rgba(251, 146, 60, 0.16) 0%, rgba(251, 146, 60, 0) 70%)',
          animation: 'slowBokehPulse 16s ease-in-out infinite',
          animationDelay: '5s',
        }}
      />
      <div
        className="absolute w-[35vw] h-[35vw] max-w-[380px] max-h-[380px] rounded-full"
        style={{
          top: '55%',
          left: '5%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.13) 0%, rgba(99, 102, 241, 0) 70%)',
          animation: 'slowBokehPulse 18s ease-in-out infinite',
          animationDelay: '9s',
        }}
      />
      <div
        className="absolute w-[42vw] h-[42vw] max-w-[450px] max-h-[450px] rounded-full"
        style={{
          top: '4%',
          right: '30%',
          background: 'radial-gradient(circle, rgba(234, 179, 8, 0.14) 0%, rgba(234, 179, 8, 0) 70%)',
          animation: 'slowBokehPulse 20s ease-in-out infinite',
          animationDelay: '4s',
        }}
      />

      {/* Canvas for droplets */}
      <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full" />

      {/* Very faint fog haze layer at the bottom */}
      <div
        className="absolute inset-x-0 bottom-0 h-44 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, rgba(160, 195, 230, 0.08) 0%, rgba(130, 170, 210, 0.02) 60%, transparent 100%)',
        }}
      />
    </div>
  );
}
