'use client';

import React, { useCallback } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { soundFx } from '../../lib/audio';

interface ThemeSwitchProps {
  className?: string;
  showLabels?: boolean;
}

export function ThemeSwitch({ className = '', showLabels = false }: ThemeSwitchProps) {
  const { theme, toggleTheme, isDark } = useTheme();

  const handleToggle = useCallback(() => {
    try {
      soundFx.playReactionPop();
    } catch {
      // Audio autoplay policy fallback
    }
    toggleTheme();
  }, [toggleTheme]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      {showLabels && (
        <span className="text-xs font-semibold text-slate-400 dark:text-slate-400">
          {isDark ? 'Dark Mode' : 'Light Mode'}
        </span>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer items-center rounded-full p-0.5 border transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
          isDark
            ? 'bg-slate-900/90 border-slate-700/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] hover:border-slate-600'
            : 'bg-amber-100/90 border-amber-300/80 shadow-[inset_0_1px_3px_rgba(217,119,6,0.15)] hover:border-amber-400'
        }`}
      >
        {/* Track Icons Underlay */}
        <div className="absolute inset-0 flex items-center justify-between px-1.5 pointer-events-none">
          {/* Sun icon on the left (light side) */}
          <Sun
            className={`w-3.5 h-3.5 transition-all duration-300 ${
              !isDark
                ? 'text-amber-500 opacity-90 scale-100'
                : 'text-slate-500 opacity-40 scale-90'
            }`}
          />
          {/* Moon icon on the right (dark side) */}
          <Moon
            className={`w-3.5 h-3.5 transition-all duration-300 ${
              isDark
                ? 'text-cyan-400 opacity-90 scale-100'
                : 'text-amber-700/40 opacity-40 scale-90'
            }`}
          />
        </div>

        {/* Sliding Thumb / Knob */}
        <div
          className={`relative z-10 flex items-center justify-center w-5 h-5 rounded-full shadow-md transform transition-all duration-300 cubic-bezier(0.34, 1.56, 0.64, 1) ${
            isDark
              ? 'translate-x-7 bg-slate-950 border border-cyan-500/40 text-cyan-300 shadow-cyan-500/20'
              : 'translate-x-0.5 bg-white border border-amber-400 text-amber-500 shadow-amber-400/25'
          }`}
        >
          {isDark ? (
            <Moon className="w-3 h-3 text-cyan-300 drop-shadow-[0_0_4px_rgba(34,211,238,0.6)]" />
          ) : (
            <Sun className="w-3 h-3 text-amber-500 drop-shadow-[0_0_4px_rgba(245,158,11,0.5)]" />
          )}
        </div>
      </button>
    </div>
  );
}
