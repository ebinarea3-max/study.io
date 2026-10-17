'use client';

import React, { useState } from 'react';
import { Crown } from 'lucide-react';

export function DemoFlairTile() {
  const [isPremiumRow, setIsPremiumRow] = useState<boolean>(true);

  return (
    <div className="h-full flex flex-col justify-between p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-card transition-all">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Crown className="w-3.5 h-3.5 text-[#E6C15A] fill-current" />
            <h4 className="font-hud font-bold text-xs uppercase tracking-wider text-[var(--text)]">
              Scholar Crown Badge
            </h4>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.05] text-[var(--text-dim)] border border-[var(--border)]">
            Badge Preview
          </span>
        </div>

        <p className="text-xs text-[var(--text-dim)] mb-4">
          Stand out in collaborative study rooms and leaderboard rankings with your signature golden crown icon on the bottom left of your profile icon.
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
            Free Scholar Look
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
            Premium Crown Look
          </button>
        </div>

        {/* Sample Leaderboard Row Card */}
        <div className="p-3.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-between gap-3 relative overflow-hidden transition-all">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-hud font-extrabold text-sm text-[var(--text-dim)] w-5 text-center flex-shrink-0">
              #1
            </span>

            {/* Avatar with optional bottom-left crown */}
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-full border border-[var(--border)] bg-[#0E1017] flex items-center justify-center font-bold text-xs text-[var(--text)] shadow-sm">
                AR
              </div>
              {isPremiumRow && (
                <div
                  className="absolute -bottom-0.5 -left-0.5 z-10 w-4 h-4 rounded-full bg-gradient-to-tr from-[#B8892B] via-[#E6C15A] to-[#FDF4D4] border border-[#FFE898] shadow-md flex items-center justify-center text-[#1A1405]"
                  style={{
                    boxShadow: '0 1px 4px rgba(0,0,0,0.5), 0 0 8px rgba(230,193,90,0.4)',
                  }}
                  title="Premium Scholar"
                >
                  <Crown className="w-2.5 h-2.5 fill-current" />
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

      {/* Feature Explainer */}
      <div className="mt-4 pt-3 border-t border-[var(--border)] text-xs text-[var(--text-dim)] font-mono">
        <div className="flex items-center gap-1.5 text-[var(--text)] font-semibold mb-1">
          <Crown className="w-3.5 h-3.5 text-[#E6C15A] fill-current" />
          <span>Bottom-Left Profile Crown</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          Instantly recognizes verified premium scholars on all leaderboards, study room seatings, and chat feeds.
        </p>
      </div>
    </div>
  );
}
