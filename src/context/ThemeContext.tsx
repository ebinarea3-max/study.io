'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { usePremium } from './PremiumContext';
import { THEMES, ThemeOption, DEFAULT_THEME_ID, DEFAULT_THEME } from '../lib/themes';
import { setActiveAppTheme } from '../lib/themeColorManager';
export { THEMES, DEFAULT_THEME_ID, DEFAULT_THEME };
export type { ThemeOption };
export { useThemeColorOverride } from '../hooks/useThemeColorOverride';

// NOTE: Themes are a cosmetic, client-side feature and therefore only softly gated.

interface ThemeContextType {
  theme: string;
  setTheme: (id: string) => void;
  themes: ThemeOption[];
  isMounted: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: DEFAULT_THEME_ID,
  setTheme: () => {},
  themes: THEMES,
  isMounted: false,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState<string>(DEFAULT_THEME_ID);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const { isPremium, loading: entitlementsLoading } = usePremium();

  // Read saved theme on mount
  useEffect(() => {
    setIsMounted(true);
    try {
      const saved = localStorage.getItem('studyio-theme');
      const targetTheme = THEMES.find(t => t.id === saved);
      if (saved && targetTheme) {
        setThemeId(saved);
        document.documentElement.dataset.theme = saved;
        if (targetTheme.scheme === 'light') {
          document.documentElement.classList.remove('dark');
          document.documentElement.classList.add('light');
        } else {
          document.documentElement.classList.remove('light');
          document.documentElement.classList.add('dark');
        }
        setActiveAppTheme(targetTheme.themeColor, targetTheme.scheme);
      } else {
        setThemeId(DEFAULT_THEME_ID);
        document.documentElement.dataset.theme = DEFAULT_THEME_ID;
        setActiveAppTheme(DEFAULT_THEME.themeColor, DEFAULT_THEME.scheme);
      }
    } catch {
      setThemeId(DEFAULT_THEME_ID);
      document.documentElement.dataset.theme = DEFAULT_THEME_ID;
      setActiveAppTheme(DEFAULT_THEME.themeColor, DEFAULT_THEME.scheme);
    }
  }, []);

  // Soft gating: If the saved theme is premium and the user is not premium,
  // apply the fallback theme "rank" in memory only AFTER entitlements have finished loading,
  // and do NOT overwrite the saved localStorage value (so a brief network failure doesn't lose their choice).
  useEffect(() => {
    if (entitlementsLoading || !isMounted) return;

    try {
      const saved = localStorage.getItem('studyio-theme');
      const savedPremiumTheme = THEMES.find(t => t.id === saved && t.isPremium);

      if (savedPremiumTheme) {
        if (!isPremium) {
          // Free user with saved premium theme -> apply "rank" in-memory only without touching localStorage
          setThemeId('rank');
          document.documentElement.dataset.theme = 'rank';
          document.documentElement.classList.remove('light');
          document.documentElement.classList.add('dark');
          setActiveAppTheme(DEFAULT_THEME.themeColor, DEFAULT_THEME.scheme);
        } else {
          // Premium user -> restore saved premium theme
          setThemeId(savedPremiumTheme.id);
          document.documentElement.dataset.theme = savedPremiumTheme.id;
          if (savedPremiumTheme.scheme === 'light') {
            document.documentElement.classList.remove('dark');
            document.documentElement.classList.add('light');
          } else {
            document.documentElement.classList.remove('light');
            document.documentElement.classList.add('dark');
          }
          setActiveAppTheme(savedPremiumTheme.themeColor, savedPremiumTheme.scheme);
        }
      }
    } catch {
      // ignore
    }
  }, [entitlementsLoading, isPremium, isMounted]);

  // Dev-only check that logs a warning if a theme's themeColor differs from its computed --bg
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
      const activeObj = THEMES.find(t => t.id === themeId);
      if (activeObj) {
        const computedBg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
        const normalize = (c: string) => {
          c = c.trim().toLowerCase();
          if (c.startsWith('#') && c.length === 4) {
            return `#${c[1]}${c[1]}${c[2]}${c[2]}${c[3]}${c[3]}`;
          }
          const rgb = c.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
          if (rgb) {
            const r = parseInt(rgb[1], 10).toString(16).padStart(2, '0');
            const g = parseInt(rgb[2], 10).toString(16).padStart(2, '0');
            const b = parseInt(rgb[3], 10).toString(16).padStart(2, '0');
            return `#${r}${g}${b}`;
          }
          return c;
        };
        const normComputed = normalize(computedBg);
        const normTheme = normalize(activeObj.themeColor);
        if (normComputed && normTheme && normComputed !== normTheme) {
          console.warn(
            `[ThemeDriftWarning] Theme "${activeObj.id}" themeColor (${activeObj.themeColor}) differs from computed --bg (${computedBg})`
          );
        }
      }
    }
  }, [themeId]);

  const setTheme = useCallback((id: string) => {
    const targetTheme = THEMES.find(t => t.id === id);
    if (!targetTheme) return;

    // A free user clicking a premium theme is prevented from applying it
    if (targetTheme.isPremium && !isPremium) {
      return;
    }

    const targetId = targetTheme.id;

    if (typeof window !== 'undefined') {
      // Smooth color transition unless prefers-reduced-motion
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!prefersReducedMotion) {
        document.documentElement.classList.add('theme-transitioning');
        window.setTimeout(() => {
          document.documentElement.classList.remove('theme-transitioning');
        }, 300);
      }

      document.documentElement.dataset.theme = targetId;
      if (targetTheme.scheme === 'light') {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      } else {
        document.documentElement.classList.remove('light');
        document.documentElement.classList.add('dark');
      }

      // Update browser chrome instantly (no animation)
      setActiveAppTheme(targetTheme.themeColor, targetTheme.scheme);

      try {
        localStorage.setItem('studyio-theme', targetId);
      } catch (err) {
        console.warn('Failed to save theme to localStorage:', err);
      }

      window.dispatchEvent(new CustomEvent('studyio-theme-change', { detail: targetId }));
    }

    setThemeId(targetId);
  }, [isPremium]);

  return (
    <ThemeContext.Provider value={{ theme: themeId, setTheme, themes: THEMES, isMounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
