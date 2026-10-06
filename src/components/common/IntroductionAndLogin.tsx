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
import { Logo } from '../Logo';

export function IntroductionAndLogin() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-slate-100 flex flex-col justify-between relative overflow-hidden selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Subtle Developer-grade Dot Grid Overlay */}
      <div className="fixed inset-0 pointer-events-none bg-dot-grid z-0" />

      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Header */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <Logo className="w-9 h-9" />
          <div>
            <div className="text-lg font-black tracking-tight text-white flex items-center gap-1.5 leading-none">
              <span>study.io</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 leading-none">
                Focus
              </span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Gamified Focus &amp; Productivity</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Login Required</span>
          </div>
        </div>
      </header>

      {/* Main Hero & Centered Layout */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-12 flex flex-col items-center justify-center relative z-10">
        <div className="text-center space-y-6 mb-10 max-w-3xl flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--surface)] border border-[var(--border)] text-xs font-bold text-emerald-400 shadow-sm backdrop-blur-md">
            <Sparkles className="w-4 h-4" />
            <span>Next-Gen Study & Focus Platform</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight leading-[1.1]">
            Master Your Focus. <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Study With Purpose.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-2xl">
            <strong className="text-emerald-400 font-semibold">study.io</strong> turns deep work into a rewarding progression system. Track focus sessions, stay accountable, and climb competitive rank tiers from Bronze to Grandmaster.
          </p>
        </div>

        {/* Auth Card Centered */}
        <div className="w-full max-w-md mx-auto mb-16 relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-[2rem] blur-xl" />
          <div className="relative">
            <AuthCard />
          </div>
        </div>

        {/* 4 Feature Pillars Grid (Centered below) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-6xl">
          {/* Feature 1 */}
          <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-emerald-500/30 transition-all backdrop-blur-xl flex flex-col items-center text-center space-y-3 group">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
              <Timer className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-200">Precision Timers</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Stopwatch, Pomodoro (25/5 & 50/10), and ambient background audio to keep you in the zone.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-amber-500/30 transition-all backdrop-blur-xl flex flex-col items-center text-center space-y-3 group">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
              <Trophy className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-200">Rank Tiers & RP</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Earn RP for every focused minute. Level up from Bronze to Grandmaster with monthly resets.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-teal-500/30 transition-all backdrop-blur-xl flex flex-col items-center text-center space-y-3 group">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
              <CheckSquare className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-200">Daily Checklist</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Keyboard-friendly checklist with streak tracking and session focus goals.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-purple-500/30 transition-all backdrop-blur-xl flex flex-col items-center text-center space-y-3 group">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-200">Advanced Analytics</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Inspect hourly distributions, consistency heatmaps, and per-subject breakdown stats.
            </p>
          </div>
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
