'use client';

import React from 'react';
import {
  Timer,
  Trophy,
  CheckSquare,
  BarChart3,
  Sparkles,
} from 'lucide-react';
import { AuthCard } from './AuthCard';

export function IntroductionAndLogin() {
  return (
    <div className="min-h-screen bg-[#090A0C] text-slate-100 flex flex-col justify-between relative overflow-hidden selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Subtle Developer-grade Dot Grid Overlay */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px] z-0" />

      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Header */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 flex items-center justify-center font-black text-slate-950 text-xl shadow-lg shadow-emerald-500/25">
            ⚡
          </div>
          <div>
            <div className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
              <span>study.io</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Focus
              </span>
            </div>
            <div className="text-[10px] text-slate-400 -mt-0.5">Gamified Focus &amp; Productivity</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Login Required</span>
          </div>
        </div>
      </header>

      {/* Main Hero & Split Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 lg:py-12 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center relative z-10">
        {/* Left Column: Product Introduction */}
        <div className="lg:col-span-7 space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-bold text-emerald-400 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Next-Gen Study & Focus Platform</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-[1.15]">
              Master Your Focus. <br />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                Study With Purpose.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
              <strong className="text-emerald-300">study.io</strong> turns deep work into a rewarding progression system. Track focus sessions with precision timers, stay accountable with daily checklists, and climb competitive rank tiers from Bronze to Grandmaster.
            </p>
          </div>

          {/* 4 Feature Pillars Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Feature 1 */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all backdrop-blur-md space-y-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <Timer className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-white">Precision Timer &amp; Soundscapes</h3>
              <p className="text-xs text-slate-400 leading-normal">
                Stopwatch, Pomodoro (25/5 &amp; 50/10), and ambient background audio (Rain, Cafe, White Noise) with background-tab throttling protection.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all backdrop-blur-md space-y-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <Trophy className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-white">Rank Tiers &amp; RP System</h3>
              <p className="text-xs text-slate-400 leading-normal">
                Earn RP for every focused minute. Level up from Bronze to Grandmaster with post-session milestone breakdowns and monthly season resets.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all backdrop-blur-md space-y-2">
              <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
                <CheckSquare className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-white">Daily Task Checklist</h3>
              <p className="text-xs text-slate-400 leading-normal">
                Fast, keyboard-friendly checklist with streak tracking and session focus goals to eliminate distractions.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all backdrop-blur-md space-y-2">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-white">24-Hour Timeline &amp; Heatmaps</h3>
              <p className="text-xs text-slate-400 leading-normal">
                Inspect hourly study distributions, GitHub-style 12-week consistency heatmaps, and per-subject breakdown stats.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Sleek Auth Card */}
        <div className="lg:col-span-5 w-full max-w-md mx-auto">
          <AuthCard />
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 border-t border-slate-800/80 text-center text-xs text-slate-500 relative z-10 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div>study.io &copy; {new Date().getFullYear()} &bull; Built for deep focus & accountability</div>
        <div className="flex items-center gap-4 text-[11px]">
          <span>Pomodoro &bull; Stopwatch &bull; Ranked RP &bull; Planner &bull; Analytics</span>
        </div>
      </footer>
    </div>
  );
}
