'use client';

import React, { useState } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Logo } from '../Logo';
import { AuthCard } from './AuthCard';
import { AppFeaturesModal } from './AppFeaturesModal';

export function IntroductionAndLogin() {
  const [showFeaturesModal, setShowFeaturesModal] = useState(false);

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full overflow-hidden flex flex-col justify-between select-none bg-[#08090c] text-white relative">
      {/* Subtle Dot-Matrix Background Texture */}
      <div className="fixed inset-0 pointer-events-none bg-dot-grid opacity-20 z-0" />

      {/* Understated Silver / Indigo Ambient Radial Glow behind Center Hero */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[460px] h-[340px] sm:h-[460px] rounded-full bg-indigo-500/[0.04] blur-[110px] z-0"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[240px] sm:w-[320px] h-[240px] sm:h-[320px] rounded-full bg-slate-300/[0.03] blur-[70px] z-0"
      />

      {/* 1. Top Header: Logo on Left, Explore Features Button on Right */}
      <header className="w-full max-w-4xl mx-auto pt-7 sm:pt-9 px-6 flex items-center justify-between relative z-10 shrink-0">
        <div className="flex items-center gap-2.5">
          <Logo className="w-8 h-8 shrink-0 drop-shadow-sm" />
          <span className="text-lg font-bold tracking-tight text-white font-sans">
            study.io
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowFeaturesModal(true)}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] active:scale-[0.98] border border-white/[0.08] hover:border-white/20 text-xs font-medium text-slate-300 hover:text-white transition-all backdrop-blur-md cursor-pointer shadow-sm group"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400 group-hover:rotate-12 transition-transform" />
          <span>Explore Features</span>
        </button>
      </header>

      {/* 2. Center Hero: Minimalist Timer Ring Graphic & Headline */}
      <div className="w-full max-w-lg mx-auto px-6 flex flex-col items-center justify-center text-center relative z-10 my-auto">
        {/* Sleek Minimalist Timer Ring Graphic */}
        <div
          aria-hidden="true"
          className="relative w-[136px] sm:w-[148px] h-[136px] sm:h-[148px] mx-auto flex items-center justify-center mb-5 sm:mb-6 shrink-0"
        >
          {/* Soft inner ambient glow */}
          <div className="absolute inset-0 rounded-full bg-white/[0.02] blur-xl pointer-events-none" />

          {/* Minimalist Dial SVG */}
          <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
            {/* Subtle background track */}
            <circle
              cx="80"
              cy="80"
              r="68"
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="2.5"
            />
            {/* Partially filled clean silver arc */}
            <circle
              cx="80"
              cy="80"
              r="68"
              fill="none"
              stroke="rgba(255,255,255,0.85)"
              strokeWidth="2.5"
              strokeDasharray="427.26"
              strokeDashoffset="115"
              strokeLinecap="round"
              style={{
                filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.35))',
              }}
            />
            {/* Sleek leading accent indicator dot */}
            <circle
              cx="80"
              cy="12"
              r="3"
              fill="#FFFFFF"
              style={{
                filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.8))',
              }}
            />
          </svg>

          {/* Center Digital Typography */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none">
            <span className="font-mono text-3xl sm:text-4xl font-bold text-white tracking-tight leading-none tabular-nums">
              25:00
            </span>
            <span className="text-[10px] sm:text-[11px] font-mono tracking-widest text-slate-400 font-semibold uppercase mt-1.5 leading-none">
              DEEP FOCUS
            </span>
          </div>
        </div>

        {/* Clean Bold Two-Line Headline */}
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-[1.12] text-center mb-2.5">
          <span className="block text-white">Master your focus.</span>
          <span className="block bg-gradient-to-r from-zinc-200 via-slate-100 to-zinc-400 bg-clip-text text-transparent">
            Study with purpose.
          </span>
        </h1>

        {/* Concise Single-Line Subtitle */}
        <p className="text-sm sm:text-base text-slate-400 max-w-sm sm:max-w-md mx-auto text-center font-normal leading-relaxed">
          Timers, live study rooms, and competitive ranks.
        </p>

        {/* Aesthetic callout button to open features */}
        <button
          type="button"
          onClick={() => setShowFeaturesModal(true)}
          className="mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.03] hover:bg-white/[0.08] active:scale-[0.98] border border-white/[0.08] hover:border-white/20 text-xs text-slate-300 hover:text-white transition-all cursor-pointer group backdrop-blur-sm"
        >
          <span>See all features &amp; ranks</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 group-hover:text-emerald-400 transition-all" />
        </button>
      </div>

      {/* 3. Bottom Sign-In Dock: Anchored Glassmorphic Card */}
      <div className="w-full max-w-md mx-auto px-6 pb-8 sm:pb-10 relative z-10 shrink-0">
        <AuthCard />
      </div>

      {/* 4. Interactive Aesthetic Features & Overview Modal */}
      <AppFeaturesModal
        isOpen={showFeaturesModal}
        onClose={() => setShowFeaturesModal(false)}
      />
    </div>
  );
}
