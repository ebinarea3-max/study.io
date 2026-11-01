'use client';

export interface ThemeMetaEntry {
  themeColor: string;
  scheme: 'dark' | 'light';
}

interface OverrideStackEntry {
  id: string;
  color: string;
  scheme: 'dark' | 'light';
}

// Current base app theme (fallback when no overrides are active)
let currentAppTheme: ThemeMetaEntry = {
  themeColor: '#07090E',
  scheme: 'dark',
};

// Stack of active theme-color overrides (last in = top of stack)
const overrideStack: OverrideStackEntry[] = [];

/**
 * Updates the single theme-color meta tag, color-scheme meta tag,
 * apple status bar style meta tag, and documentElement backgroundColor.
 * Instant update (no animation).
 */
export function updateBrowserChrome(themeColor: string, scheme: 'dark' | 'light') {
  if (typeof document === 'undefined') return;

  // 1. Exactly one <meta name="theme-color" id="theme-color-meta">
  let metaTheme = document.getElementById('theme-color-meta') || document.querySelector('meta[name="theme-color"]');
  if (!metaTheme) {
    metaTheme = document.createElement('meta');
    metaTheme.setAttribute('name', 'theme-color');
    metaTheme.id = 'theme-color-meta';
    document.head.appendChild(metaTheme);
  }
  metaTheme.setAttribute('content', themeColor);

  // 2. Exactly one <meta name="color-scheme">
  let metaScheme = document.getElementById('color-scheme-meta') || document.querySelector('meta[name="color-scheme"]');
  if (!metaScheme) {
    metaScheme = document.createElement('meta');
    metaScheme.setAttribute('name', 'color-scheme');
    metaScheme.id = 'color-scheme-meta';
    document.head.appendChild(metaScheme);
  }
  metaScheme.setAttribute('content', scheme);

  // 3. Apple status bar style: "default" for light themes and "black-translucent" for dark themes
  let metaApple = document.getElementById('apple-status-bar-meta') || document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
  if (!metaApple) {
    metaApple = document.createElement('meta');
    metaApple.setAttribute('name', 'apple-mobile-web-app-status-bar-style');
    metaApple.id = 'apple-status-bar-meta';
    document.head.appendChild(metaApple);
  }
  metaApple.setAttribute('content', scheme === 'light' ? 'default' : 'black-translucent');

  // 4. Set document.documentElement.style.backgroundColor so overscroll and first paint match
  document.documentElement.style.backgroundColor = themeColor;
}

/**
 * Sets the active app theme. If no overrides are currently stacked,
 * immediately updates the browser chrome.
 */
export function setActiveAppTheme(themeColor: string, scheme: 'dark' | 'light') {
  currentAppTheme = { themeColor, scheme };
  if (overrideStack.length === 0) {
    updateBrowserChrome(themeColor, scheme);
  }
}

/**
 * Pushes or updates an override on the stack.
 * Overlapping overrides stack correctly (the last opened wins and restores in order).
 */
export function pushThemeColorOverride(id: string, color: string, scheme: 'dark' | 'light' = 'dark') {
  const existingIdx = overrideStack.findIndex(item => item.id === id);
  if (existingIdx !== -1) {
    if (existingIdx === overrideStack.length - 1) {
      overrideStack[existingIdx].color = color;
      overrideStack[existingIdx].scheme = scheme;
    } else {
      overrideStack.splice(existingIdx, 1);
      overrideStack.push({ id, color, scheme });
    }
  } else {
    overrideStack.push({ id, color, scheme });
  }

  const top = overrideStack[overrideStack.length - 1];
  updateBrowserChrome(top.color, top.scheme);
}

/**
 * Pops an override by ID from the stack and restores the prior override or base theme.
 */
export function popThemeColorOverride(id: string) {
  const idx = overrideStack.findIndex(item => item.id === id);
  if (idx !== -1) {
    overrideStack.splice(idx, 1);
  }

  if (overrideStack.length > 0) {
    const top = overrideStack[overrideStack.length - 1];
    updateBrowserChrome(top.color, top.scheme);
  } else {
    updateBrowserChrome(currentAppTheme.themeColor, currentAppTheme.scheme);
  }
}

