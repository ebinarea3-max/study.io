'use client';

import { useState, useEffect, useCallback, useRef, useSyncExternalStore } from 'react';
import { usePremium } from '../../context/PremiumContext';
import { FOCUS_SCENES, getSceneById, DEFAULT_SCENE_ID } from './scenes/registry';

const SCENE_STORAGE_KEY = 'studyio-focus-scene';
const DIM_STORAGE_KEY = 'studyio-focus-dim';
const DEFAULT_DIM = 20;
const STORAGE_EVENT = 'studyio-focus-storage-update';

function subscribeStorage(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', callback);
  window.addEventListener(STORAGE_EVENT, callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(STORAGE_EVENT, callback);
  };
}

function notifyStorageChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(STORAGE_EVENT));
  }
}

function getSavedSceneSnapshot(): string {
  if (typeof window === 'undefined') return DEFAULT_SCENE_ID;
  try {
    const saved = localStorage.getItem(SCENE_STORAGE_KEY);
    if (saved && FOCUS_SCENES.some((s) => s.id === saved)) {
      return saved;
    }
  } catch {
    // ignore
  }
  return DEFAULT_SCENE_ID;
}

function getServerSceneSnapshot(): string {
  return DEFAULT_SCENE_ID;
}

function getDimSnapshot(): number {
  if (typeof window === 'undefined') return DEFAULT_DIM;
  try {
    const savedDim = localStorage.getItem(DIM_STORAGE_KEY);
    if (savedDim !== null) {
      const parsed = parseInt(savedDim, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 60) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return DEFAULT_DIM;
}

function getServerDimSnapshot(): number {
  return DEFAULT_DIM;
}

export function useFocusScene() {
  // Scenes are a cosmetic client-side feature, so they are softly gated.
  const { isPremium, loading: entitlementsLoading, openPremiumModal } = usePremium();

  // Read saved scene and dim reactively via useSyncExternalStore (clean SSR + no hydration mismatch)
  const savedSceneId = useSyncExternalStore(
    subscribeStorage,
    getSavedSceneSnapshot,
    getServerSceneSnapshot
  );

  const dim = useSyncExternalStore(
    subscribeStorage,
    getDimSnapshot,
    getServerDimSnapshot
  );

  // Update Dim and persist to localStorage
  const setDim = useCallback((newDim: number) => {
    const clamped = Math.max(0, Math.min(60, newDim));
    try {
      localStorage.setItem(DIM_STORAGE_KEY, String(clamped));
      notifyStorageChange();
    } catch {
      // ignore storage failure
    }
  }, []);

  // Preview state for free users clicking locked scenes
  const [previewSceneId, setPreviewSceneId] = useState<string | null>(null);
  const [previewSecondsLeft, setPreviewSecondsLeft] = useState<number>(0);
  const previewTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Derived active scene respecting soft-gating rules:
  // - During free user preview: use previewSceneId
  // - If saved scene is free: use savedSceneId
  // - If saved scene is premium:
  //     - While entitlements are loading: show 'default' in memory
  //     - After loading, if user is premium: show savedSceneId
  //     - After loading, if user is free: fallback to 'default' in memory without overwriting localStorage
  const savedScene = getSceneById(savedSceneId);
  let activeSceneId = DEFAULT_SCENE_ID;
  if (previewSceneId) {
    activeSceneId = previewSceneId;
  } else if (!savedScene.premium) {
    activeSceneId = savedScene.id;
  } else if (!entitlementsLoading && isPremium) {
    activeSceneId = savedScene.id;
  } else {
    activeSceneId = DEFAULT_SCENE_ID;
  }

  // Clean up preview timers on unmount
  const clearPreviewTimers = useCallback(() => {
    if (previewTimerRef.current) {
      clearTimeout(previewTimerRef.current);
      previewTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearPreviewTimers();
    };
  }, [clearPreviewTimers]);

  // Cancel preview manually
  const cancelPreview = useCallback(() => {
    clearPreviewTimers();
    setPreviewSceneId(null);
    setPreviewSecondsLeft(0);
  }, [clearPreviewTimers]);

  // Handle scene selection
  const selectScene = useCallback(
    (sceneId: string) => {
      const targetScene = getSceneById(sceneId);
      if (!targetScene) return;

      // Premium user OR non-premium scene:
      // Persists in localStorage and becomes active
      if (!targetScene.premium || isPremium) {
        clearPreviewTimers();
        setPreviewSceneId(null);
        setPreviewSecondsLeft(0);
        try {
          localStorage.setItem(SCENE_STORAGE_KEY, sceneId);
          notifyStorageChange();
        } catch {
          // ignore storage failure
        }
        return;
      }

      // Free user clicking locked scene:
      // Starts an 8-second PREVIEW of it (not saved in localStorage).
      // Never open any popup or modal by itself!
      clearPreviewTimers();
      setPreviewSceneId(sceneId);
      setPreviewSecondsLeft(8);

      countdownIntervalRef.current = setInterval(() => {
        setPreviewSecondsLeft((prev) => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Revert after 8 seconds
      previewTimerRef.current = setTimeout(() => {
        clearPreviewTimers();
        setPreviewSceneId(null);
        setPreviewSecondsLeft(0);
      }, 8000);
    },
    [isPremium, clearPreviewTimers]
  );

  return {
    activeSceneId,
    savedSceneId,
    dim,
    setDim,
    selectScene,
    isPremium,
    entitlementsLoading,
    previewSceneId,
    previewSecondsLeft,
    cancelPreview,
    openPremiumModal,
  };
}
