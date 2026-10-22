'use client';

import React, { useCallback, useRef } from 'react';
import { useSceneCanvas } from './useSceneCanvas';

interface Star {
  x: number;
  y: number;
  r: number;
  baseAlpha: number;
  twinklePhase: number;
  twinkleSpeed: number;
  vx: number;
  vy: number;
  layer: 'far' | 'mid' | 'near';
  color: string;
}

interface ShootingStar {
  active: boolean;
  elapsed: number;
  duration: number; // 0.7s
  startX: number;
  startY: number;
  vx: number;
  vy: number;
  speed: number;
  length: number;
}

export function StarsScene({ speedMultiplier = 1 }: { speedMultiplier?: number }) {
  const starsRef = useRef<Star[]>([]);
  const shootingStarRef = useRef<ShootingStar>({
    active: false,
    elapsed: 0,
    duration: 0.7,
    startX: 0,
    startY: 0,
    vx: 0,
    vy: 0,
    speed: 0,
    length: 120,
  });
  // Initialized with a static number to preserve component purity during render
  const shootingStarTimerRef = useRef<number>(30);
  const isTimerInitializedRef = useRef<boolean>(false);
  const lastDimensionsRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });

  const draw = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      width: number,
      height: number,
      dt: number,
      quality: number
    ) => {
      ctx.clearRect(0, 0, width, height);

      if (!isTimerInitializedRef.current) {
        isTimerInitializedRef.current = true;
        shootingStarTimerRef.current = 25 + Math.random() * 20; // 25 to 45 seconds
      }

      const targetTotal = Math.max(
        25,
        Math.min(Math.floor(160 * quality), Math.floor((width * height) / 9000 * quality))
      );

      // Re-initialize stars if count changed or dimensions changed significantly
      if (
        starsRef.current.length === 0 ||
        Math.abs(lastDimensionsRef.current.w - width) > 100 ||
        Math.abs(lastDimensionsRef.current.h - height) > 100
      ) {
        lastDimensionsRef.current = { w: width, h: height };
        const newStars: Star[] = [];

        const farCount = Math.floor(targetTotal * 0.6);
        const midCount = Math.floor(targetTotal * 0.28);
        const nearCount = targetTotal - farCount - midCount;

        // Far layer
        for (let i = 0; i < farCount; i++) {
          newStars.push({
            x: Math.random() * width,
            y: Math.random() * height,
            r: 0.6 + Math.random() * 0.4,
            baseAlpha: 0.25 + Math.random() * 0.2,
            twinklePhase: Math.random() * Math.PI * 2,
            twinkleSpeed: 0.8 + Math.random() * 1.0,
            vx: -5,
            vy: 3.5,
            layer: 'far',
            color: '220, 235, 255',
          });
        }

        // Mid layer
        for (let i = 0; i < midCount; i++) {
          newStars.push({
            x: Math.random() * width,
            y: Math.random() * height,
            r: 1.1 + Math.random() * 0.6,
            baseAlpha: 0.45 + Math.random() * 0.3,
            twinklePhase: Math.random() * Math.PI * 2,
            twinkleSpeed: 1.1 + Math.random() * 1.2,
            vx: -9,
            vy: 6.0,
            layer: 'mid',
            color: Math.random() > 0.3 ? '240, 245, 255' : '255, 240, 215',
          });
        }

        // Near layer
        for (let i = 0; i < nearCount; i++) {
          newStars.push({
            x: Math.random() * width,
            y: Math.random() * height,
            r: 1.8 + Math.random() * 1.0,
            baseAlpha: 0.75 + Math.random() * 0.2,
            twinklePhase: Math.random() * Math.PI * 2,
            twinkleSpeed: 1.3 + Math.random() * 1.4,
            vx: -15,
            vy: 10.0,
            layer: 'near',
            color: Math.random() > 0.4 ? '255, 255, 255' : '225, 245, 255',
          });
        }

        starsRef.current = newStars;
      }

      // Update & Draw stars
      for (let i = 0; i < starsRef.current.length; i++) {
        const star = starsRef.current[i];

        if (dt > 0) {
          // Slow diagonal drift
          star.x += star.vx * dt;
          star.y += star.vy * dt;

          // Twinkle phase
          star.twinklePhase += star.twinkleSpeed * dt;

          // Wrap edges
          if (star.x < -10) star.x += width + 20;
          if (star.x > width + 10) star.x -= width + 20;
          if (star.y > height + 10) star.y -= height + 20;
          if (star.y < -10) star.y += height + 20;
        }

        // Sine twinkle alpha
        const currentAlpha = Math.max(
          0.05,
          Math.min(1.0, star.baseAlpha * (0.55 + 0.45 * Math.sin(star.twinklePhase)))
        );

        // Near layer soft glow
        if (star.layer === 'near') {
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.r * 2.4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${star.color}, ${(currentAlpha * 0.18).toFixed(3)})`;
          ctx.fill();
        }

        // Star core
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${star.color}, ${currentAlpha.toFixed(3)})`;
        ctx.fill();
      }

      // Update & Draw shooting star (25 to 45s interval, ~700ms duration, never more than one)
      const ss = shootingStarRef.current;
      if (dt > 0) {
        if (!ss.active) {
          shootingStarTimerRef.current -= dt;
          if (shootingStarTimerRef.current <= 0) {
            // Trigger new shooting star
            ss.active = true;
            ss.elapsed = 0;
            ss.duration = 0.7; // Exactly 700ms
            ss.startX = width * (0.35 + Math.random() * 0.55);
            ss.startY = height * (0.05 + Math.random() * 0.25);
            const angle = (130 + Math.random() * 25) * (Math.PI / 180); // Diagonal angle
            ss.speed = 1100 + Math.random() * 300;
            ss.vx = Math.cos(angle) * ss.speed;
            ss.vy = Math.sin(angle) * ss.speed;
            ss.length = 100 + Math.random() * 50;
          }
        } else {
          ss.elapsed += dt;
          if (ss.elapsed >= ss.duration) {
            ss.active = false;
            shootingStarTimerRef.current = 25 + Math.random() * 20; // Reset 25 to 45s
          }
        }
      }

      if (ss.active) {
        const headX = ss.startX + ss.vx * ss.elapsed;
        const headY = ss.startY + ss.vy * ss.elapsed;

        const dirX = ss.vx / ss.speed;
        const dirY = ss.vy / ss.speed;

        const tailX = headX - dirX * ss.length;
        const tailY = headY - dirY * ss.length;

        // Fade in (first 0.12s) and fade out (last 0.2s)
        let alpha = 1.0;
        if (ss.elapsed < 0.12) {
          alpha = ss.elapsed / 0.12;
        } else if (ss.elapsed > 0.5) {
          alpha = Math.max(0, (ss.duration - ss.elapsed) / 0.2);
        }

        const gradient = ctx.createLinearGradient(tailX, tailY, headX, headY);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
        gradient.addColorStop(0.65, `rgba(200, 230, 255, ${(0.35 * alpha).toFixed(3)})`);
        gradient.addColorStop(1, `rgba(255, 255, 255, ${(0.95 * alpha).toFixed(3)})`);

        ctx.save();
        ctx.lineWidth = 1.8;
        ctx.lineCap = 'round';
        ctx.strokeStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(headX, headY);
        ctx.stroke();

        // Bright head point
        ctx.beginPath();
        ctx.arc(headX, headY, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${(0.95 * alpha).toFixed(3)})`;
        ctx.fill();

        // Soft head halo
        ctx.beginPath();
        ctx.arc(headX, headY, 6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180, 220, 255, ${(0.3 * alpha).toFixed(3)})`;
        ctx.fill();
        ctx.restore();
      }
    },
    []
  );

  const { canvasRef } = useSceneCanvas(draw, { speedMultiplier });

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none select-none"
      style={{
        background: 'linear-gradient(135deg, #020308 0%, #060917 50%, #03040b 100%)',
      }}
    >
      {/* Subtle faint cosmic dust / nebula background clouds */}
      <div
        className="absolute w-[60vw] h-[60vw] rounded-full opacity-20 pointer-events-none"
        style={{
          top: '-10%',
          left: '15%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute w-[50vw] h-[50vw] rounded-full opacity-15 pointer-events-none"
        style={{
          bottom: '5%',
          right: '10%',
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.22) 0%, transparent 70%)',
        }}
      />

      <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full" />
    </div>
  );
}
