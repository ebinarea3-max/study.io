'use client';

import React, { useState } from 'react';
import { Play, Sparkles, Check } from 'lucide-react';

interface Swatch {
  id: string;
  name: string;
  bg: string;
  surface: string;
  accent: string;
  accentContrast: string;
  border: string;
}

const SWATCHES: Swatch[] = [
  {
    id: 'goldleaf',
    name: 'Gold Leaf',
    bg: '#0C0A06',
    surface: '#17130A',
    accent: '#E6C15A',
    accentContrast: '#1A1405',
    border: 'rgba(230, 193, 90, 0.25)',
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    bg: '#080811',
    surface: '#121124',
    accent: '#00F0FF',
    accentContrast: '#04151C',
    border: 'rgba(0, 240, 255, 0.25)',
  },
  {
    id: 'sakura',
    name: 'Sakura',
    bg: '#0E0A12',
    surface: '#1A1220',
    accent: '#F472B6',
    accentContrast: '#200814',
    border: 'rgba(244, 114, 182, 0.25)',
  },
  {
    id: 'nordic',
    name: 'Nordic Frost',
    bg: '#070F18',
    surface: '#0E1B29',
    accent: '#38BDF8',
    accentContrast: '#031726',
    border: 'rgba(56, 189, 248, 0.25)',
  },
  {
    id: 'amethyst',
    name: 'Amethyst',
    bg: '#090612',
    surface: '#160E25',
    accent: '#A855F7',
    accentContrast: '#150524',
    border: 'rgba(168, 85, 247, 0.25)',
  },
  {
    id: 'crimson',
    name: 'Crimson',
    bg: '#0E0809',
    surface: '#1A0F11',
    accent: '#E5484D',
    accentContrast: '#1F0506',
    border: 'rgba(229, 72, 77, 0.25)',
  },
];

export function DemoThemesTile() {
  const [selectedSwatch, setSelectedSwatch] = useState<Swatch>(SWATCHES[0]);

  return (
    <div className="h-full flex flex-col justify-between p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-card transition-all">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedSwatch.accent }} />
            <h4 className="font-hud font-bold text-xs uppercase tracking-wider text-[var(--text)]">
              Premium Themes
            </h4>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.05] text-[var(--text-dim)] border border-[var(--border)]">
            Interactive
          </span>
        </div>
        <p className="text-xs text-[var(--text-dim)] mb-4">
          Handcrafted color palettes designed for deep focus without visual fatigue.
        </p>

        {/* Mini Timer Preview (isolated color styling) */}
        <div
          className="p-4 rounded-xl transition-colors duration-300 border flex flex-col items-center justify-center relative overflow-hidden"
          style={{
            backgroundColor: selectedSwatch.bg,
            borderColor: selectedSwatch.border,
          }}
        >
          {/* Subtle glow */}
          <div
            className="absolute -top-12 -right-12 w-28 h-28 rounded-full blur-2xl opacity-20 pointer-events-none"
            style={{ backgroundColor: selectedSwatch.accent }}
          />

          <div className="flex items-center justify-between w-full mb-3 text-[10px] font-mono">
            <span
              className="px-2 py-0.5 rounded-md font-semibold"
              style={{
                backgroundColor: selectedSwatch.surface,
                color: selectedSwatch.accent,
                border: `1px solid ${selectedSwatch.border}`,
              }}
            >
              Deep Work
            </span>
            <span style={{ color: selectedSwatch.accent }}>Pomodoro 25m</span>
          </div>

          <div
            className="font-hud font-extrabold text-3xl tracking-wider my-1"
            style={{ color: '#FFFFFF' }}
          >
            25:00
          </div>

          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden my-2">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: '65%', backgroundColor: selectedSwatch.accent }}
            />
          </div>

          <div className="flex items-center gap-2 mt-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm"
              style={{
                backgroundColor: selectedSwatch.accent,
                color: selectedSwatch.accentContrast,
              }}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Swatch Selector */}
      <div className="mt-4 pt-3 border-t border-[var(--border)]">
        <div className="text-[11px] font-mono text-[var(--text-dim)] mb-2 flex items-center justify-between">
          <span>Click to recolour preview:</span>
          <span className="font-semibold text-[var(--text)]">{selectedSwatch.name}</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {SWATCHES.map((swatch) => {
            const isSelected = selectedSwatch.id === swatch.id;
            return (
              <button
                key={swatch.id}
                type="button"
                onClick={() => setSelectedSwatch(swatch)}
                className={`flex-1 py-1.5 px-2 rounded-xl border text-xs font-hud font-bold tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  isSelected
                    ? 'ring-2 ring-offset-2 ring-offset-[var(--bg)] shadow-md'
                    : 'opacity-70 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: swatch.bg,
                  borderColor: swatch.accent,
                  color: '#FFFFFF',
                }}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: swatch.accent }}
                />
                <span className="text-[10px] truncate">{swatch.name}</span>
                {isSelected && <Check className="w-2.5 h-2.5 ml-auto text-[var(--text)]" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
