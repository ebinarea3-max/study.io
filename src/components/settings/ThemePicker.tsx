'use client';

import React, { useRef, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Check, Sparkles, RotateCcw } from 'lucide-react';

export function ThemePicker() {
  const { theme, setTheme, themes, isMounted } = useTheme();
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Arrow key navigation between responsive theme cards
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      let targetIndex = index;
      const total = themes.length;

      // Determine responsive columns count: 2 on mobile, 3 on sm/md, 4 on lg/desktop
      const width = typeof window !== 'undefined' ? window.innerWidth : 1024;
      const cols = width >= 1024 ? 4 : width >= 640 ? 3 : 2;

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          targetIndex = (index + 1) % total;
          break;
        case 'ArrowLeft':
          e.preventDefault();
          targetIndex = (index - 1 + total) % total;
          break;
        case 'ArrowDown':
          e.preventDefault();
          targetIndex = (index + cols) % total;
          break;
        case 'ArrowUp':
          e.preventDefault();
          targetIndex = (index - cols + total) % total;
          break;
        case 'Home':
          e.preventDefault();
          targetIndex = 0;
          break;
        case 'End':
          e.preventDefault();
          targetIndex = total - 1;
          break;
        default:
          return;
      }

      if (targetIndex !== index) {
        const nextBtn = cardRefs.current[targetIndex];
        if (nextBtn) {
          nextBtn.focus();
          setTheme(themes[targetIndex].id);
        }
      }
    },
    [themes, setTheme]
  );

  return (
    <section aria-labelledby="appearance-heading" className="w-full">
      <div className="p-5 sm:p-6 rounded-2xl hud-surface border border-[var(--border)] relative overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border"
              style={{
                backgroundColor: 'var(--accent-soft)',
                borderColor: 'var(--border)',
                color: 'var(--accent)',
              }}
            >
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3
                id="appearance-heading"
                className="font-hud font-extrabold text-sm sm:text-base text-[var(--text)] tracking-wider uppercase"
              >
                Appearance
              </h3>
              <p className="text-xs text-[var(--text-dim)] mt-0.5">
                Choose how study.io looks.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setTheme('rank')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border)] bg-transparent hover:bg-white/[0.04] text-xs font-mono text-[var(--text-dim)] hover:text-[var(--text)] transition-colors cursor-pointer active:scale-95"
            title="Reset theme to Rank colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to default</span>
          </button>
        </div>

        {/* Responsive Grid: 2 cols on mobile, 3 on tablet, 4 on wide screens */}
        <div
          role="radiogroup"
          aria-label="Theme selection"
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-4"
        >
          {themes.map((t, index) => {
            const isSelected = isMounted && theme === t.id;
            const isRank = t.id === 'rank';
            const [bgCol, surfaceCol, accentCol] = t.previewColors;

            return (
              <button
                key={t.id}
                ref={(el) => {
                  cardRefs.current[index] = el;
                }}
                type="button"
                role="radio"
                aria-checked={isSelected}
                aria-pressed={isSelected}
                tabIndex={isSelected || (!isMounted && index === 0) ? 0 : -1}
                onClick={() => setTheme(t.id)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className={`relative rounded-[14px] p-3 text-left transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] active:scale-[0.98] ${
                  isSelected
                    ? 'border-2 border-[var(--accent)] shadow-[0_0_16px_var(--glow)] bg-[var(--surface-2)]'
                    : 'border border-[var(--border)] hover:border-[var(--border-strong)] bg-[var(--surface)] hover:bg-[var(--surface-2)]'
                }`}
                style={{ borderRadius: '14px' }}
              >
                {/* Selected Check Badge */}
                {isSelected && (
                  <div
                    className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center shadow-md z-20 animate-in zoom-in-75 duration-150"
                    style={{
                      backgroundColor: 'var(--accent)',
                      color: 'var(--accent-contrast)',
                    }}
                    aria-hidden="true"
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}

                {/* Mini Preview Box */}
                <div
                  className="w-full h-16 rounded-[10px] p-2 relative overflow-hidden flex flex-col justify-between mb-2.5 border"
                  style={{
                    backgroundColor: bgCol,
                    borderColor: t.isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)',
                  }}
                  aria-hidden="true"
                >
                  {/* Surface Bar */}
                  <div
                    className="w-full h-4 rounded-[6px] px-1.5 flex items-center gap-1.5 border"
                    style={{
                      backgroundColor: surfaceCol,
                      borderColor: t.isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.06)',
                    }}
                  >
                    {isRank ? (
                      /* Multi-tier gradient swatch representing all rank tiers */
                      <div
                        className="w-full h-1.5 rounded-full"
                        style={{
                          background:
                            'linear-gradient(90deg, #C98A4B 0%, #A8B4C2 16%, #D4A017 32%, #38BFC4 48%, #6FA8DC 64%, #B24FE8 80%, #E11D48 100%)',
                        }}
                      />
                    ) : (
                      <>
                        <div
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: accentCol }}
                        />
                        <div
                          className="h-1.5 rounded-full flex-1 max-w-[42px]"
                          style={{ backgroundColor: accentCol }}
                        />
                      </>
                    )}
                  </div>

                  {/* Accent Highlight Bar */}
                  <div
                    className="h-1.5 rounded-full"
                    style={{
                      width: isRank ? '75%' : '45%',
                      background: isRank
                        ? 'linear-gradient(90deg, #C98A4B, #D4A017, #38BFC4, #B24FE8)'
                        : accentCol,
                    }}
                  />
                </div>

                {/* Theme Name & Caption */}
                <div className="w-full min-w-0 pr-5">
                  <div className="font-hud font-bold text-xs sm:text-sm text-[var(--text)] tracking-wide truncate">
                    {t.name}
                  </div>
                  {isRank ? (
                    <div className="text-[10px] text-[var(--text-dim)] font-mono truncate mt-0.5">
                      {t.caption}
                    </div>
                  ) : (
                    <div className="text-[10px] text-[var(--text-faint)] font-mono truncate mt-0.5">
                      {t.isLight ? 'Light neutral' : 'Dark obsidian'}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
