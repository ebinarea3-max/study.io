'use client';

import { useEffect, useRef } from 'react';

export type SceneDrawFn = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  dt: number,
  quality: number
) => void;

export interface UseSceneCanvasOptions {
  speedMultiplier?: number;
}

export function useSceneCanvas(draw: SceneDrawFn, options: UseSceneCanvasOptions = {}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawRef = useRef<SceneDrawFn>(draw);
  const speedMultiplierRef = useRef<number>(options.speedMultiplier ?? 1);

  // Keep latest draw and options updated in an effect without violating ref rules during render
  useEffect(() => {
    drawRef.current = draw;
    speedMultiplierRef.current = options.speedMultiplier ?? 1;
  });

  const isMountedRef = useRef<boolean>(false);
  const animFrameIdRef = useRef<number>(0);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const lastFrameTimeRef = useRef<number>(0);

  const widthRef = useRef<number>(0);
  const heightRef = useRef<number>(0);
  const dprRef = useRef<number>(1);
  const qualityRef = useRef<number>(1);
  const reducedMotionRef = useRef<boolean>(false);

  useEffect(() => {
    isMountedRef.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Check prefers-reduced-motion
    let motionQuery: MediaQueryList | null = null;
    if (typeof window !== 'undefined' && window.matchMedia) {
      motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      reducedMotionRef.current = motionQuery.matches;
    }

    const renderStaticFrame = () => {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const dpr = dprRef.current;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawRef.current(ctx, widthRef.current, heightRef.current, 0, qualityRef.current);
    };

    const targetInterval = 1000 / 30; // 30 fps cap (~33.33ms)

    const loop = (timestamp: number) => {
      if (!isMountedRef.current) return;
      if (reducedMotionRef.current) return;

      animFrameIdRef.current = requestAnimationFrame(loop);

      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        return;
      }

      const elapsed = timestamp - lastFrameTimeRef.current;
      if (elapsed >= targetInterval) {
        // Cap dt to 0.1s to prevent huge jumps after stutter
        const dt = Math.min(elapsed / 1000, 0.1) * (speedMultiplierRef.current ?? 1);
        lastFrameTimeRef.current = timestamp - (elapsed % targetInterval);

        const activeCanvas = canvasRef.current;
        if (!activeCanvas) return;
        const ctx = activeCanvas.getContext('2d');
        if (!ctx) return;

        const dpr = dprRef.current;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        drawRef.current(ctx, widthRef.current, heightRef.current, dt, qualityRef.current);
      }
    };

    const startAnimation = () => {
      if (reducedMotionRef.current) {
        renderStaticFrame();
        return;
      }
      if (!animFrameIdRef.current) {
        lastFrameTimeRef.current = performance.now();
        animFrameIdRef.current = requestAnimationFrame(loop);
      }
    };

    const stopAnimation = () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = 0;
      }
    };

    // Sizing via ResizeObserver
    const updateSize = () => {
      if (!canvas) return;
      const container = canvas.parentElement || canvas;
      const rect = container.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));

      // DPR capped at 1.5
      const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 1.5) : 1;

      // Quality factor: 0.5 on screens narrower than 600px or when hardwareConcurrency <= 4
      const isNarrow = w < 600;
      const isLowConcurrency =
        typeof navigator !== 'undefined' &&
        typeof navigator.hardwareConcurrency === 'number' &&
        navigator.hardwareConcurrency <= 4;
      const quality = isNarrow || isLowConcurrency ? 0.5 : 1.0;

      widthRef.current = w;
      heightRef.current = h;
      dprRef.current = dpr;
      qualityRef.current = quality;

      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      if (reducedMotionRef.current) {
        renderStaticFrame();
      }
    };

    updateSize();

    if (typeof ResizeObserver !== 'undefined') {
      const container = canvas.parentElement || canvas;
      resizeObserverRef.current = new ResizeObserver(() => {
        updateSize();
      });
      resizeObserverRef.current.observe(container);
    }

    // Visibility change handler: pauses when not visible, resumes cleanly
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        startAnimation();
      } else {
        stopAnimation();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Reduced motion change listener
    const handleMotionChange = (e: MediaQueryListEvent) => {
      reducedMotionRef.current = e.matches;
      if (e.matches) {
        stopAnimation();
        renderStaticFrame();
      } else {
        startAnimation();
      }
    };
    if (motionQuery?.addEventListener) {
      motionQuery.addEventListener('change', handleMotionChange);
    }

    startAnimation();

    return () => {
      isMountedRef.current = false;
      stopAnimation();
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (motionQuery?.removeEventListener) {
        motionQuery.removeEventListener('change', handleMotionChange);
      }
    };
  }, []);

  return { canvasRef };
}
