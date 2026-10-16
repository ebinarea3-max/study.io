'use client';

import React, { useState } from 'react';
import { Sparkles, Crown, User } from 'lucide-react';

type FrameStyle = 'gold' | 'aurora' | 'ember';

interface FrameConfig {
  id: FrameStyle;
  name: string;
  gradient: string;
  glow: string;
}

const FRAMES: FrameConfig[] = [
  {
    id: 'gold',
    name: 'Gold Leaf',
    gradient: 'linear-gradient(135deg, #F5E6A8 0%, #E6C15A 50%, #B8892B 100%)',
    glow: 'rgba(230, 193, 90, 0.4)',
  },
  {
    id: 'aurora',
    name: 'Aurora',
    gradient: 'linear-gradient(135deg, #38BFC4 0%, #2DD4BF 50%, #0D9488 100%)',
    glow: 'rgba(45, 212, 191, 0.4)',
  },
  {
    id: 'ember',
    name: 'Ember',
    gradient: 'linear-gradient(135deg, #F97316 0%, #EF4444 50%, #B91C1C 100%)',
    glow: 'rgba(249, 115, 22, 0.4)',
  },
];

export function DemoFlairTile() {
  const [selectedFrame, setSelectedFrame] = useState<FrameConfig>(FRAMES[0]);
  const [isPremiumRow, setIsPremiumRow] = useState<boolean>(true);

  return (
    <div className="h-full flex flex-col justify-between p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-card transition-all">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Crown className="w-3.5 h-3.5 text-[#E6C15A] fill-current" />
            <h4 className="font-hud font-bold text-xs uppercase tracking-wider text-[var(--text)]">
              Scholar Profile Flair
            </h4>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.05] text-[var(--text-dim)] border border-[var(--border)]">
            Frame Preview
          </span>
        </div>

        <p className="text-xs text-[var(--text-dim)] mb-4">
          Stand out in collaborative study rooms and leaderboard rankings with custom avatar frames and pro badges.
        </p>

        {/* Free vs Premium Row Toggle */}
        <div className="flex items-center justify-between p-1 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] mb-3 text-xs font-mono">
          <button
            type="button"
            onClick={() => setIsPremiumRow(false)}
            className={`flex-1 py-1 px-2 rounded-lg font-semibold transition-all cursor-pointer ${
              !isPremiumRow
                ? 'bg-white/10 text-[var(--text)] shadow-sm'
                : 'text-[var(--text-dim)] hover:text-[var(--text)]'
            }`}
          >
            Free Row Look
          </button>
          <button
            type="button"
            onClick={() => setIsPremiumRow(true)}
            className={`flex-1 py-1 px-2 rounded-lg font-semibold transition-all cursor-pointer ${
              isPremiumRow
                ? 'bg-[#E6C15A]/20 text-[#E6C15A] border border-[#E6C15A]/40 shadow-sm'
                : 'text-[var(--text-dim)] hover:text-[var(--text)]'
            }`}
          >
            Premium Flair Row
          </button>
        </div>

        {/* Sample Leaderboard Row Card */}
        <div className="p-3.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-between gap-3 relative overflow-hidden transition-all">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-hud font-extrabold text-sm text-[var(--text-dim)] w-5 text-center flex-shrink-0">
              #1
            </span>

            {/* Avatar with optional frame */}
            <div className="relative flex-shrink-0">
              {isPremiumRow ? (
                <div
                  className="w-10 h-10 rounded-full p-[2px] transition-all duration-300"
                  style={{
                    background: selectedFrame.gradient,
                    boxShadow: `0 0 10px ${selectedFrame.glow}`,
                  }}
                >
                  <div className="w-full h-full rounded-full bg-[#0E1017] flex items-center justify-center font-bold text-xs text-[var(--text)]">
                    AR
                  </div>
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full border border-[var(--border)] bg-[#0E1017] flex items-center justify-center font-bold text-xs text-[var(--text)]">
                  AR
                </div>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-xs font-bold text-[var(--text)] truncate">
                  Alex Rivers
                </span>
                {isPremiumRow && (
                  <span
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#E6C15A]/15 text-[#E6C15A] border border-[#E6C15A]/30 text-[9px] font-bold tracking-wider uppercase shrink-0"
                    title="Premium Scholar"
                  >
                    <Crown className="w-2.5 h-2.5 fill-current" />
                    <span>PRO</span>
                  </span>
                )}
              </div>
              <div className="text-[10px] text-[var(--text-dim)] font-mono truncate">
                Grandmaster &bull; 4,820 RP
              </div>
            </div>
          </div>

          <div className="text-right flex-shrink-0 font-mono text-xs font-bold text-[#E6C15A]">
            142h
          </div>
        </div>
      </div>

      {/* Frame Style Selector */}
      <div className="mt-4 pt-3 border-t border-[var(--border)]">
        <div className="text-[11px] font-mono text-[var(--text-dim)] mb-2 flex items-center justify-between">
          <span>Choose frame style:</span>
          <span className="font-semibold text-[var(--text)]">{selectedFrame.name}</span>
        </div>
        <div className="flex items-center gap-2">
          {FRAMES.map((f) => {
            const isSelected = selectedFrame.id === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  setSelectedFrame(f);
                  setIsPremiumRow(true);
                }}
                className={`flex-1 py-1.5 px-2 rounded-xl border text-[10px] font-hud font-bold tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  isSelected
                    ? 'ring-2 ring-offset-2 ring-offset-[var(--bg)] border-white text-white'
                    : 'border-[var(--border)] text-[var(--text-dim)] hover:text-[var(--text)] opacity-70 hover:opacity-100'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: f.gradient }}
                />
                <span className="truncate">{f.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
