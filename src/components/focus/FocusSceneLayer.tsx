'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically load scene components with ssr: false so they are not in the main bundle
const DynamicRainScene = dynamic(
  () => import('./scenes/RainScene').then((m) => m.RainScene),
  { ssr: false }
);

const DynamicStarsScene = dynamic(
  () => import('./scenes/StarsScene').then((m) => m.StarsScene),
  { ssr: false }
);

function DefaultScene() {
  return (
    <div
      className="absolute inset-0 pointer-events-none select-none"
      style={{
        background: '#000000',
      }}
    />
  );
}

function renderSceneItem(id: string, speedMultiplier: number) {
  switch (id) {
    case 'rain':
      return <DynamicRainScene speedMultiplier={speedMultiplier} />;
    case 'stars':
      return <DynamicStarsScene speedMultiplier={speedMultiplier} />;
    case 'default':
    default:
      return <DefaultScene />;
  }
}

interface FocusSceneLayerProps {
  sceneId: string;
  dim?: number; // 0 to 60 (default 20)
  speedMultiplier?: number;
}

export function FocusSceneLayer({
  sceneId,
  dim = 20,
  speedMultiplier = 1,
}: FocusSceneLayerProps) {
  // Track current scene and any previous scene being cross-faded
  const [sceneState, setSceneState] = useState<{
    current: string;
    previous: string | null;
  }>({
    current: sceneId,
    previous: null,
  });

  // When sceneId prop changes, update transition state during render (standard React 19 pattern)
  if (sceneState.current !== sceneId) {
    setSceneState({
      current: sceneId,
      previous: sceneState.current,
    });
  }

  // Clear previous scene after 600ms cross-fade completes
  useEffect(() => {
    if (!sceneState.previous) return;

    const timer = setTimeout(() => {
      setSceneState((prev) => ({
        current: prev.current,
        previous: null,
      }));
    }, 600);

    return () => clearTimeout(timer);
  }, [sceneState.previous]);

  // Clamp dim between 0 and 60
  const clampedDim = Math.max(0, Math.min(60, dim));
  const dimOpacity = clampedDim / 100;

  return (
    <div className="fixed inset-0 z-0 pointer-events-none select-none overflow-hidden">
      <style>{`
        @keyframes focusSceneFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes focusSceneFadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `}</style>

      {/* Previous Scene Fading Out over 600ms */}
      {sceneState.previous && (
        <div
          key={`prev-${sceneState.previous}`}
          className="absolute inset-0 pointer-events-none"
          style={{
            animation: 'focusSceneFadeOut 600ms cubic-bezier(0.4, 0, 0.2, 1) forwards',
          }}
        >
          {renderSceneItem(sceneState.previous, speedMultiplier)}
        </div>
      )}

      {/* Current Active Scene Fading In over 600ms */}
      <div
        key={`curr-${sceneState.current}`}
        className="absolute inset-0 pointer-events-none"
        style={{
          animation: sceneState.previous
            ? 'focusSceneFadeIn 600ms cubic-bezier(0.4, 0, 0.2, 1) forwards'
            : 'none',
        }}
      >
        {renderSceneItem(sceneState.current, speedMultiplier)}
      </div>

      {/* Dark overlay whose opacity comes from the Dim setting */}
      <div
        className="absolute inset-0 bg-black pointer-events-none"
        style={{
          opacity: dimOpacity,
          transition: 'opacity 200ms ease',
        }}
      />

      {/* Soft Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 50%, transparent 40%, rgba(0, 0, 0, 0.65) 100%)',
        }}
      />

      {/* Gentle darker radial area behind the timer digits so the time is always easy to read */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 65% 45% at 50% 50%, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.25) 45%, transparent 75%)',
        }}
      />
    </div>
  );
}
