'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { getSvgScene } from './scenes/svgScenes';

interface FocusSceneLayerProps {
  sceneId: string;
  dim?: number; // 0 to 60 (default 20)
  speedMultiplier?: number;
}

function resolveSceneKey(id: string): string {
  if (id === 'sea') return 'sakura';
  if (id === 'aurora') return 'campfire';
  if (id === 'rain') return 'neon';
  if (id === 'stars') return 'dusk';
  return id;
}

function FocusSceneLayerComponent({
  sceneId,
  dim = 20,
}: FocusSceneLayerProps) {
  // Track current scene and any previous scene being cross-faded over 900ms
  const [sceneState, setSceneState] = useState<{
    current: string;
    previous: string | null;
  }>({
    current: sceneId,
    previous: null,
  });

  // Pause animations when document tab is hidden to save 100% of GPU/battery
  const [isPageHidden, setIsPageHidden] = useState(false);
  useEffect(() => {
    const handleVisibility = () => {
      setIsPageHidden(document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // When sceneId prop changes, update transition state during render (React 19 pattern)
  if (sceneState.current !== sceneId) {
    setSceneState({
      current: sceneId,
      previous: sceneState.current,
    });
  }

  // Clear previous scene after 900ms cross-fade completes
  useEffect(() => {
    if (!sceneState.previous) return;

    const timer = setTimeout(() => {
      setSceneState((prev) => ({
        current: prev.current,
        previous: null,
      }));
    }, 900);

    return () => clearTimeout(timer);
  }, [sceneState.previous]);

  // Clamp dim between 0 and 60
  const clampedDim = Math.max(0, Math.min(60, dim));
  const dimOpacity = clampedDim / 100;

  // Retrieve SVG markup (pure, deterministic, and cached)
  const currentKey = resolveSceneKey(sceneState.current);
  const previousKey = sceneState.previous ? resolveSceneKey(sceneState.previous) : null;

  const currentSvg = useMemo(() => getSvgScene(currentKey), [currentKey]);
  const previousSvg = useMemo(
    () => (previousKey ? getSvgScene(previousKey) : null),
    [previousKey]
  );

  return (
    <div
      className={`fixed inset-0 z-0 pointer-events-none select-none overflow-hidden bg-[#05060a] ${
        isPageHidden ? 'scene-hidden' : ''
      }`}
      style={{
        contain: 'strict',
        transform: 'translate3d(0, 0, 0)',
        willChange: 'transform',
        isolation: 'isolate',
      }}
    >
      {/* Previous Scene Layer Fading Out over 900ms */}
      {sceneState.previous && previousSvg && (
        <div
          key={`prev-${sceneState.previous}`}
          className="absolute inset-0 pointer-events-none select-none [&_svg]:w-full [&_svg]:h-full"
          style={{
            animation: 'sceneFadeOut 900ms ease forwards',
            contain: 'strict',
            transform: 'translate3d(0, 0, 0)',
            willChange: 'opacity',
          }}
          dangerouslySetInnerHTML={{ __html: previousSvg }}
        />
      )}

      {/* Current Active Scene Layer Fading In over 900ms */}
      {currentSvg ? (
        <div
          key={`curr-${sceneState.current}`}
          className="absolute inset-0 pointer-events-none select-none [&_svg]:w-full [&_svg]:h-full"
          style={{
            animation: sceneState.previous ? 'sceneFadeIn 900ms ease forwards' : 'none',
            contain: 'strict',
            transform: 'translate3d(0, 0, 0)',
            willChange: sceneState.previous ? 'opacity' : 'auto',
          }}
          dangerouslySetInnerHTML={{ __html: currentSvg }}
        />
      ) : (
        /* Default Scene: Pure focus obsidian background */
        <div
          key="curr-default"
          className="absolute inset-0 pointer-events-none select-none"
          style={{
            background:
              'radial-gradient(ellipse at 50% 50%, #171b29 0%, #0c0e17 60%, #05060a 100%)',
            animation: sceneState.previous ? 'sceneFadeIn 900ms ease forwards' : 'none',
            contain: 'strict',
            transform: 'translate3d(0, 0, 0)',
          }}
        />
      )}

      {/* Dual Radial Vignette from concept design */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(0,0,0,.24) 0, transparent 36%), radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,.55) 100%)',
          contain: 'strict',
          transform: 'translate3d(0, 0, 0)',
        }}
      />

      {/* Background Dim Layer (0 to 60%) */}
      <div
        className="absolute inset-0 bg-black pointer-events-none"
        style={{
          opacity: dimOpacity,
          transition: 'opacity 200ms ease',
          contain: 'strict',
          transform: 'translate3d(0, 0, 0)',
        }}
      />
    </div>
  );
}

// React.memo prevents FocusSceneLayer from re-rendering every second when elapsedSeconds ticks in the parent modal
export const FocusSceneLayer = React.memo(
  FocusSceneLayerComponent,
  (prev, next) => prev.sceneId === next.sceneId && prev.dim === next.dim
);

