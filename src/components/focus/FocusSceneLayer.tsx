'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { getSvgScene } from './scenes/svgScenes';

interface FocusSceneLayerProps {
  sceneId: string;
  dim?: number; // 0 to 60 (default 20)
  speedMultiplier?: number;
}

function resolveSceneKey(id: string): string {
  if (id === 'rain') return 'neon';
  if (id === 'stars') return 'dusk';
  return id;
}

export function FocusSceneLayer({
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
    >
      <style>{`
        /* Core procedural SVG animations from design reference */
        @keyframes drift {
          to { transform: translateX(var(--x)); }
        }
        .drift {
          animation: drift var(--d) ease-in-out infinite alternate;
        }

        @keyframes tw {
          0%, 100% { opacity: var(--o1); }
          50% { opacity: var(--o2); }
        }
        .tw {
          animation: tw var(--d) ease-in-out infinite;
          animation-delay: var(--l);
        }

        @keyframes ffm {
          to { transform: translate(var(--dx), var(--dy)); }
        }
        @keyframes ffg {
          0%, 100% { opacity: 0.12; }
          50% { opacity: 1; }
        }
        .ff {
          animation: ffm var(--t) ease-in-out infinite alternate, ffg var(--g) ease-in-out infinite;
          animation-delay: var(--l);
        }

        @keyframes rain {
          to { transform: translate(-60px, 1100px); }
        }
        .rain {
          animation: rain var(--d) linear infinite;
          animation-delay: var(--l);
        }

        @keyframes wave {
          to { transform: translateX(-1600px); }
        }
        .wv {
          animation: wave var(--d) linear infinite;
        }

        @keyframes au {
          from { transform: translateX(-50px) scaleY(0.9); }
          to { transform: translateX(50px) scaleY(1.1); }
        }
        .au {
          animation: au var(--d) ease-in-out infinite alternate;
          transform-origin: 800px 300px;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.55; }
          50% { opacity: 1; }
        }
        .pu {
          animation: pulse var(--d) ease-in-out infinite;
        }

        @keyframes shim {
          0%, 100% { opacity: 0.12; }
          50% { opacity: 0.7; }
        }
        .sh {
          animation: shim var(--d) ease-in-out infinite;
          animation-delay: var(--l);
        }

        /* 0.9s ease scene cross-fade */
        @keyframes sceneFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes sceneFadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }

        /* Reduced motion compliance */
        @media (prefers-reduced-motion: reduce) {
          svg * { animation: none !important; }
        }

        /* Pause GPU animations when document is hidden */
        .scene-hidden svg * {
          animation-play-state: paused !important;
        }
      `}</style>

      {/* Previous Scene Layer Fading Out over 900ms */}
      {sceneState.previous && previousSvg && (
        <div
          key={`prev-${sceneState.previous}`}
          className="absolute inset-0 pointer-events-none select-none [&_svg]:w-full [&_svg]:h-full"
          style={{
            animation: 'sceneFadeOut 900ms ease forwards',
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
          }}
        />
      )}

      {/* Dual Radial Vignette from concept design */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(0,0,0,.24) 0, transparent 36%), radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,.55) 100%)',
        }}
      />

      {/* Background Dim Layer (0 to 60%) */}
      <div
        className="absolute inset-0 bg-black pointer-events-none"
        style={{
          opacity: dimOpacity,
          transition: 'opacity 200ms ease',
        }}
      />
    </div>
  );
}
