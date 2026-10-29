'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { usePremium } from './PremiumContext';

// NOTE: Themes are a cosmetic, client-side feature and therefore only softly gated.

export interface ThemeOption {
  id: string;
  name: string;
  description: string;
  previewColors: [string, string, string]; // [bg, surface, accent]
  isLight?: boolean;
  isPremium?: boolean;
}

export const THEMES: ThemeOption[] = [
  {
    id: 'rank',
    name: 'Rank colors',
    description: 'Follows your rank',
    previewColors: ['#07090E', '#0F1117', '#D4A017'],
  },
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Cool blue on deep navy',
    previewColors: ['#090B10', '#12151D', '#5B8CFF'],
  },
  {
    id: 'ember',
    name: 'Ember',
    description: 'Warm amber on charcoal',
    previewColors: ['#0F0B09', '#1A1410', '#F0924A'],
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Calm green on dark moss',
    previewColors: ['#070D0B', '#0F1A16', '#3DBE8B'],
  },
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Clear cyan on deep sea',
    previewColors: ['#060B12', '#0E1824', '#4DB6E8'],
  },
  {
    id: 'rose',
    name: 'Rose',
    description: 'Soft pink on dark plum',
    previewColors: ['#0E0A0C', '#1A1216', '#F0709A'],
  },
  {
    id: 'nebula',
    name: 'Nebula',
    description: 'Violet on cosmic dark',
    previewColors: ['#0A0812', '#15111F', '#9B8CFF'],
  },
  {
    id: 'graphite',
    name: 'Graphite',
    description: 'Pure monochrome',
    previewColors: ['#0B0B0C', '#151516', '#E8E8E8'],
  },
  {
    id: 'paper',
    name: 'Paper',
    description: 'Bright and warm, light mode',
    previewColors: ['#F5F2EC', '#FFFFFF', '#B45309'],
    isLight: true,
  },
  // Premium Themes (added at the end of the Appearance grid)
  {
    id: 'goldleaf',
    name: 'Gold Leaf',
    description: 'Warm gold on dark leather',
    previewColors: ['#0C0A06', '#17130A', '#E6C15A'],
    isPremium: true,
  },
  {
    id: 'crimson',
    name: 'Crimson',
    description: 'Deep red on near black',
    previewColors: ['#0E0809', '#1A0F11', '#E5484D'],
    isPremium: true,
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    description: 'Electric neon cyan & fuchsia on hyperdark void',
    previewColors: ['#080811', '#121124', '#00F0FF'],
    isPremium: true,
  },
  {
    id: 'sakura',
    name: 'Sakura',
    description: 'Delicate cherry blossom on twilight ink',
    previewColors: ['#0E0A12', '#1A1220', '#F472B6'],
    isPremium: true,
  },
  {
    id: 'nordic',
    name: 'Nordic Frost',
    description: 'Glacial cyan on arctic polar night',
    previewColors: ['#070F18', '#0E1B29', '#38BDF8'],
    isPremium: true,
  },
  {
    id: 'amethyst',
    name: 'Amethyst',
    description: 'Luminous royal violet on dark velvet',
    previewColors: ['#090612', '#160E25', '#A855F7'],
    isPremium: true,
  },
  {
    id: 'espresso',
    name: 'Espresso',
    description: 'Warm roasted caramel on dark cocoa',
    previewColors: ['#0E0B08', '#1A1410', '#D4A373'],
    isPremium: true,
  },
  {
    id: 'emerald',
    name: 'Emerald',
    description: 'Imperial luminous jade on obsidian',
    previewColors: ['#05100B', '#0B1E15', '#10B981'],
    isPremium: true,
  },
  {
    id: 'abyss',
    name: 'OLED Abyss',
    description: 'True pitch black for maximum focus',
    previewColors: ['#000000', '#0E0E0E', '#FFFFFF'],
    isPremium: true,
  },
  {
    id: 'matcha',
    name: 'Matcha',
    description: 'Creamy green tea, warm pastel light mode',
    previewColors: ['#F4F6F0', '#FFFFFF', '#4D7C0F'],
    isLight: true,
    isPremium: true,
  },
];

interface ThemeContextType {
  theme: string;
  setTheme: (id: string) => void;
  themes: ThemeOption[];
  isMounted: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'rank',
  setTheme: () => {},
  themes: THEMES,
  isMounted: false,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState<string>('rank');
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const { isPremium, loading: entitlementsLoading } = usePremium();

  // Read saved theme on mount
  useEffect(() => {
    setIsMounted(true);
    try {
      const saved = localStorage.getItem('studyio-theme');
      if (saved && THEMES.some(t => t.id === saved)) {
        setThemeId(saved);
        document.documentElement.dataset.theme = saved;
        const isLight = THEMES.some(t => t.id === saved && t.isLight);
        if (isLight) {
          document.documentElement.classList.remove('dark');
          document.documentElement.classList.add('light');
        } else {
          document.documentElement.classList.remove('light');
          document.documentElement.classList.add('dark');
        }
      } else {
        setThemeId('rank');
        document.documentElement.dataset.theme = 'rank';
      }
    } catch {
      setThemeId('rank');
      document.documentElement.dataset.theme = 'rank';
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
        } else {
          // Premium user -> restore saved premium theme
          setThemeId(savedPremiumTheme.id);
          document.documentElement.dataset.theme = savedPremiumTheme.id;
          if (savedPremiumTheme.isLight) {
            document.documentElement.classList.remove('dark');
            document.documentElement.classList.add('light');
          } else {
            document.documentElement.classList.remove('light');
            document.documentElement.classList.add('dark');
          }
        }
      }
    } catch {
      // ignore
    }
  }, [entitlementsLoading, isPremium, isMounted]);

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
      if (targetTheme.isLight) {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      } else {
        document.documentElement.classList.remove('light');
        document.documentElement.classList.add('dark');
      }

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
