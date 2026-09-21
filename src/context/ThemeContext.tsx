'use client';

import React, { createContext, useContext } from 'react';

export type Theme = 'dark';
export type ResolvedTheme = 'dark';

export interface ThemeContextType {
  theme: 'dark';
  resolvedTheme: 'dark';
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: any) => void;
}

const darkContextValue: ThemeContextType = {
  theme: 'dark',
  resolvedTheme: 'dark',
  isDark: true,
  toggleTheme: () => {},
  setTheme: () => {},
};

const ThemeContext = createContext<ThemeContextType>(darkContextValue);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeContext.Provider value={darkContextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  return context || darkContextValue;
}

