'use client';

import { useEffect, useRef } from 'react';
import { pushThemeColorOverride, popThemeColorOverride } from '../lib/themeColorManager';

let nextOverrideSeq = 1;

/**
 * Hook to temporarily set the meta theme-color while a full-screen overlay is open,
 * and restore the active theme's colour when it closes (including on unmount).
 * Overlapping overrides stack correctly (the last opened wins and restores in order).
 */
export function useThemeColorOverride(color: string | null, scheme: 'dark' | 'light' = 'dark') {
  const idRef = useRef<string | null>(null);
  if (!idRef.current) {
    idRef.current = `theme_override_${nextOverrideSeq++}`;
  }

  useEffect(() => {
    const id = idRef.current!;
    if (color) {
      pushThemeColorOverride(id, color, scheme);
    } else {
      popThemeColorOverride(id);
    }

    return () => {
      popThemeColorOverride(id);
    };
  }, [color, scheme]);
}
