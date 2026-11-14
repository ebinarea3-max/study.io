'use client';

import React, { useState } from 'react';
import { Crown, Sparkles, Gem, Check, Lock } from 'lucide-react';
import {
  PREMIUM_COLLECTIBLES,
  VAULT_CATEGORIES,
  PREMIUM_AVATAR_MAP,
} from '@/lib/avatars';

export default function DevAvatarsPage() {
  const [selectedAvatar, setSelectedAvatar] = useState<string>(
    PREMIUM_COLLECTIBLES[0].id
  );
  const [isProMode, setIsProMode] = useState<boolean>(true);

  const premiumCat = VAULT_CATEGORIES[0];

  return (
    <div className="min-h-screen bg-[#07090e] text-white p-6 sm:p-10 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-hud font-bold uppercase mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Premium Scholar Avatars Showcase</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-hud font-bold text-white tracking-wider">
              COLLECTIBLE AVATAR VAULT
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Test Epic &amp; Legendary tiers in both Pro (Unlocked) and Free (Locked) states.
            </p>
          </div>

          {/* Pro / Free State Toggle */}
          <div className="flex items-center gap-2 p-1.5 rounded-xl bg-white/[0.05] border border-white/10">
            <button
              type="button"
              onClick={() => setIsProMode(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-hud font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                isProMode
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Pro (Unlocked)</span>
            </button>
            <button
              type="button"
              onClick={() => setIsProMode(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-hud font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                !isProMode
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Free (Locked)</span>
            </button>
          </div>
        </div>

        {/* The Exact Vault Modal Section */}
        <div className="bg-white/[0.07] backdrop-blur-3xl border border-amber-500/20 rounded-2xl p-6 sm:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.7)] space-y-6">
          <style>{`
            @keyframes legendary-border-shimmer {
              0%, 100% { border-color: rgba(245, 158, 11, 0.4); }
              50% { border-color: rgba(253, 230, 138, 0.85); box-shadow: 0 0 10px rgba(245, 158, 11, 0.25); }
            }
            @keyframes premium-shine-sweep {
              0% { transform: translateX(-160%) rotate(35deg); opacity: 0; }
              30% { opacity: 0.6; }
              100% { transform: translateX(260%) rotate(35deg); opacity: 0; }
            }
            @media (prefers-reduced-motion: no-preference) {
              .anim-legendary-shimmer {
                animation: legendary-border-shimmer 8s ease-in-out infinite;
              }
              .group:hover .anim-shine-sweep {
                animation: premium-shine-sweep 1.2s ease-out 1 forwards;
              }
            }
          `}</style>

          {/* Upgraded Section Header */}
          <div className="flex items-center justify-between pl-1 pb-1">
            <div>
              <div className="flex items-center gap-2">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <h4 className="text-[11px] font-mono font-bold uppercase tracking-widest text-amber-400">
                  {premiumCat.name}
                </h4>
              </div>
              <p className="text-[10px] text-slate-400 font-mono pl-5.5 mt-0.5">
                12 exclusive collectible portraits
              </p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider uppercase bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-amber-500/20 text-amber-300 border border-amber-400/40 shadow-[0_0_12px_rgba(245,158,11,0.15)] flex items-center gap-1.5">
              <Sparkles className="w-2.5 h-2.5 text-amber-300" />
              {isProMode ? 'PRO UNLOCKED' : 'PRO EXCLUSIVE'}
            </span>
          </div>

          {/* 12 Premium Collectibles Grid */}
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
            {premiumCat.avatars.map((url, i) => {
              const meta = PREMIUM_AVATAR_MAP[url];
              const isEpic = meta.rarity === 'Epic';
              const isActive = selectedAvatar === url;
              const isLocked = !isProMode;

              return (
                <button
                  type="button"
                  key={i}
                  aria-label={`${meta.name} avatar, ${meta.rarity}`}
                  onClick={() => {
                    if (isLocked) {
                      alert(`Study.io Pro unlocks ${meta.name}! ✨`);
                      return;
                    }
                    setSelectedAvatar(url);
                  }}
                  className={`group aspect-square rounded-xl flex items-center justify-center overflow-hidden cursor-pointer relative transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 hover:-translate-y-[2px] ${
                    isActive
                      ? isEpic
                        ? 'ring-2 ring-purple-400 border-[1.5px] border-purple-400 shadow-[0_0_18px_rgba(192,132,252,0.5)] scale-105 z-10'
                        : 'ring-2 ring-amber-400 border-[1.5px] border-amber-400 shadow-[0_0_18px_rgba(245,158,11,0.5)] scale-105 z-10'
                      : isEpic
                      ? 'border-[1.5px] border-purple-500/40 hover:border-purple-400/80 hover:shadow-[0_6px_20px_rgba(168,85,247,0.35)]'
                      : 'border-[1.5px] border-amber-400/40 hover:border-amber-300/80 hover:shadow-[0_6px_20px_rgba(245,158,11,0.35)] anim-legendary-shimmer'
                  }`}
                  style={{
                    background: `radial-gradient(circle at 50% 30%, ${meta.glowColor} 0%, rgba(13, 17, 26, 0.95) 75%)`,
                    boxShadow: `inset 0 0 12px ${meta.glowColor}`,
                  }}
                >
                  {/* Avatar Image */}
                  <img
                    src={meta.image}
                    alt={`${meta.name} avatar`}
                    loading="lazy"
                    className="w-full h-full object-cover p-1 transition-transform duration-300 group-hover:scale-105"
                  />

                  {/* Top Right Refined Gem or Crown Icon */}
                  <div
                    className={`absolute top-1.5 right-1.5 z-20 pointer-events-none ${
                      isEpic
                        ? 'text-purple-300 drop-shadow-[0_0_6px_rgba(192,132,252,0.8)]'
                        : 'text-amber-300 drop-shadow-[0_0_6px_rgba(245,158,11,0.8)]'
                    }`}
                    title={`${meta.rarity} Collectible`}
                  >
                    {isEpic ? (
                      <Gem className="w-3.5 h-3.5" />
                    ) : (
                      <Crown className="w-3.5 h-3.5 fill-amber-300/40" />
                    )}
                  </div>

                  {/* Selected Check Badge */}
                  {isActive && (
                    <div className="absolute top-1.5 left-1.5 w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-md z-20">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}

                  {/* Locked State: Frosted pill at bottom reading "PRO" */}
                  {isLocked && (
                    <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-amber-400/30 text-amber-300 text-[9px] font-hud font-bold tracking-wider uppercase flex items-center gap-1 shadow-lg pointer-events-none z-20">
                      <Lock className="w-2.5 h-2.5 text-amber-400" />
                      <span>PRO</span>
                    </div>
                  )}

                  {/* Hover Diagonal Shine Sweep */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  >
                    <div
                      className="w-[45%] h-[220%] -top-1/2 absolute bg-gradient-to-r from-transparent via-white/25 to-transparent anim-shine-sweep"
                      style={{
                        transform: 'translateX(-160%) rotate(35deg)',
                      }}
                    />
                  </div>

                  {/* Tooltip on Hover */}
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-30 px-2 py-0.5 rounded-md bg-[#0a0d14]/95 border border-white/15 text-[10px] font-hud font-semibold text-white whitespace-nowrap shadow-xl">
                    <span className={isEpic ? 'text-purple-300' : 'text-amber-300'}>
                      {meta.name}
                    </span>
                    <span className="text-slate-400 ml-1">· {meta.rarity}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Rarity Legend */}
          <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs font-mono text-slate-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                <span className="text-purple-300 font-bold">1–6 Epic</span> (Refined Purple Gem)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                <span className="text-amber-300 font-bold">7–12 Legendary</span> (Gold Crown &amp; Shimmer)
              </span>
            </div>
            <span>Selected: {PREMIUM_AVATAR_MAP[selectedAvatar]?.name || 'None'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
