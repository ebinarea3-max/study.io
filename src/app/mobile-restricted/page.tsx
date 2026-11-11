'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Timer,
  Users,
  Trophy,
  BarChart3,
  Download,
  ArrowUpRight,
  Sparkles,
  Flame,
  Headphones,
  ShieldCheck,
  Check,
  Smartphone,
  Radio,
} from 'lucide-react';
import { Logo } from '@/components/Logo';

export default function MobileRestrictedPage() {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = () => {
    setIsDownloading(true);
    const apkUrl = '/downloads/study-io.apk';
    const link = document.createElement('a');
    link.href = apkUrl;
    link.download = 'study-io.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => {
      setIsDownloading(false);
    }, 4000);
  };

  return (
    <div className="min-h-screen w-full bg-[#07090e] text-slate-100 relative overflow-x-hidden flex flex-col justify-between selection:bg-[#00D875]/30 selection:text-[#00D875]">
      {/* Background Micro Dot-Grid Pattern */}
      <div className="fixed inset-0 pointer-events-none bg-dot-grid opacity-50 z-0" />

      {/* Atmospheric Ambient Radial Lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[520px] h-[340px] bg-[radial-gradient(ellipse_at_top,rgba(0,216,117,0.18)_0%,transparent_70%)] pointer-events-none z-0" />
      <div className="absolute top-64 right-[-100px] w-72 h-72 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-40 left-[-80px] w-80 h-80 bg-[#00D875]/8 rounded-full blur-[140px] pointer-events-none z-0" />

      {/* Main Scrollable Canvas */}
      <div className="relative z-10 w-full max-w-lg mx-auto px-5 pt-7 pb-48 flex flex-col">
        {/* Navigation / Brand Header */}
        <header className="flex items-center justify-between py-2 mb-8">
          <div className="flex items-center gap-3">
            <Logo className="w-9 h-9 drop-shadow-[0_0_12px_rgba(0,216,117,0.35)]" />
            <div className="flex flex-col">
              <div className="text-base font-hud font-extrabold tracking-wider text-white flex items-center gap-1.5 leading-none">
                <span>STUDY</span>
                <span className="text-[#00D875] font-mono">.IO</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono tracking-tight mt-0.5">
                Precision Focus Engine
              </span>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-[10px] font-mono text-[#00D875]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00D875] animate-pulse" />
            <span>NATIVE CLIENT</span>
          </div>
        </header>

        {/* Hero Section */}
        <section className="text-center flex flex-col items-center mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.03] border border-[#00D875]/25 text-[11px] font-hud font-bold tracking-widest text-[#00D875] uppercase mb-4 backdrop-blur-md shadow-[0_0_15px_rgba(0,216,117,0.1)]">
            <Sparkles className="w-3.5 h-3.5 text-[#00D875]" />
            <span>UNINTERRUPTED FOCUS RUNTIME</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight font-hud leading-[1.15] max-w-sm">
            Master Deep Work. <br />
            <span className="bg-gradient-to-r from-white via-emerald-200 to-[#00D875] bg-clip-text text-transparent">
              Exclusively On Mobile.
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-400 font-sans mt-3.5 max-w-sm leading-relaxed">
            Mobile browsers aggressively suspend background timers, kill soundscapes, and drop live rooms when your screen sleeps. Study.io runs natively for unthrottled focus.
          </p>
        </section>

        {/* Authentic In-App Live HUD Teaser Card */}
        <section className="mb-10 w-full">
          <div className="relative rounded-3xl bg-[#0F1117]/85 border border-white/10 p-5 shadow-2xl backdrop-blur-2xl overflow-hidden">
            {/* Subtle card glow edge */}
            <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#00D875]/70 to-transparent" />
            <div className="absolute -right-16 -top-16 w-36 h-36 bg-[#00D875]/10 rounded-full blur-2xl pointer-events-none" />

            {/* Teaser Header: Live Room Status */}
            <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.06]">
              <div className="flex items-center gap-2 min-w-0">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00D875] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00D875]" />
                </span>
                <span className="text-xs font-hud font-bold tracking-wider text-white uppercase truncate">
                  Deep Work Chamber
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/10 text-slate-300 shrink-0">
                18 / 32 Scholars
              </span>
            </div>

            {/* Teaser Center: Timer Dial Display */}
            <div className="py-5 flex flex-col items-center justify-center text-center relative">
              <div className="relative w-36 h-36 rounded-full border border-white/10 flex items-center justify-center shadow-inner bg-[#07090E]/60">
                {/* Dial glow */}
                <div className="absolute inset-0 rounded-full border-2 border-[#00D875]/40 shadow-[0_0_20px_rgba(0,216,117,0.25)]" />
                <div className="flex flex-col items-center justify-center">
                  <span className="text-3xl font-hud font-black tracking-widest text-white leading-none">
                    25:00
                  </span>
                  <span className="text-[9px] font-hud font-bold tracking-widest text-[#00D875] uppercase mt-1">
                    DEEP WORK
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4 text-[11px] font-mono text-slate-400">
                <span className="flex items-center gap-1 text-emerald-400">
                  <Headphones className="w-3.5 h-3.5" />
                  <span>Rain Ambient Sound</span>
                </span>
                <span>&bull;</span>
                <span className="text-slate-400">Screen-Off Active</span>
              </div>
            </div>

            {/* Teaser Footer: Live Season Progression */}
            <div className="pt-3 border-t border-white/[0.06] grid grid-cols-2 gap-2 text-left">
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <div className="text-[10px] text-slate-400 font-hud tracking-wide uppercase">Rank Tier</div>
                <div className="text-xs font-bold text-amber-300 font-mono mt-0.5 flex items-center gap-1">
                  <Trophy className="w-3 h-3 text-amber-400" />
                  <span>SILVER I &bull; 824 RP</span>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <div className="text-[10px] text-slate-400 font-hud tracking-wide uppercase">Active Streak</div>
                <div className="text-xs font-bold text-orange-400 font-mono mt-0.5 flex items-center gap-1">
                  <Flame className="w-3 h-3 text-orange-500 fill-orange-500" />
                  <span>7 DAYS IN A ROW</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section Title: Real App Features */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xs font-hud font-bold tracking-widest text-slate-400 uppercase">
            Core Study.io Capabilities
          </h2>
          <span className="text-[10px] font-mono text-[#00D875]">4 Focus Pillars</span>
        </div>

        {/* 4 Core Pillars Grid */}
        <section className="space-y-3.5 w-full">
          {/* Feature 1 */}
          <div className="p-4 rounded-2xl bg-[#0F1117]/70 border border-white/10 hover:border-[#00D875]/30 transition-colors backdrop-blur-xl flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#00D875]/10 border border-[#00D875]/25 flex items-center justify-center text-[#00D875] shrink-0 shadow-[0_0_12px_rgba(0,216,117,0.2)]">
              <Timer className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-hud font-bold tracking-wide text-white uppercase">
                  Unthrottled Focus Timers
                </h3>
                <span className="text-[9px] font-mono text-[#00D875] bg-[#00D875]/10 px-1.5 py-0.5 rounded">
                  NO SLEEP
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans mt-1 leading-relaxed">
                Stopwatch, Pomodoro (25/5 & 50/10) with 6 built-in ambient noise soundscapes that stay active even when your screen is locked.
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="p-4 rounded-2xl bg-[#0F1117]/70 border border-white/10 hover:border-cyan-500/30 transition-colors backdrop-blur-xl flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 shrink-0 shadow-[0_0_12px_rgba(6,182,212,0.2)]">
              <Users className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-hud font-bold tracking-wide text-white uppercase">
                  Live Multiplayer Study Rooms
                </h3>
                <span className="text-[9px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">
                  UP TO 32
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans mt-1 leading-relaxed">
                Study in real-time rooms with live status indicators, host moderation tools, and low-latency synchronized room chat.
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="p-4 rounded-2xl bg-[#0F1117]/70 border border-white/10 hover:border-amber-500/30 transition-colors backdrop-blur-xl flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 shrink-0 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
              <Trophy className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-hud font-bold tracking-wide text-white uppercase">
                  23 Ranked Tiers &amp; Seasons
                </h3>
                <span className="text-[9px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                  100 RP / HR
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans mt-1 leading-relaxed">
                Turn focus hours into competitive RP. Climb from Bronze to Grandmaster with monthly resets, badges, and season recaps.
              </p>
            </div>
          </div>

          {/* Feature 4 */}
          <div className="p-4 rounded-2xl bg-[#0F1117]/70 border border-white/10 hover:border-purple-500/30 transition-colors backdrop-blur-xl flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400 shrink-0 shadow-[0_0_12px_rgba(168,85,247,0.2)]">
              <BarChart3 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-hud font-bold tracking-wide text-white uppercase">
                  Matrix Tasks &amp; Analytics
                </h3>
                <span className="text-[9px] font-mono text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">
                  HEATMAPS
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans mt-1 leading-relaxed">
                Task checklists with streak multipliers, 24h timeline distributions, subject allocation charts, and daily directives.
              </p>
            </div>
          </div>
        </section>

        {/* Why Native Security & Performance Guarantee */}
        <div className="mt-8 p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-[#00D875] shrink-0" />
          <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
            <strong className="text-slate-200">Zero Battery Throttling:</strong> Native Android foreground service prevents OS memory killers from pausing your active study countdowns.
          </p>
        </div>
      </div>

      {/* Sticky Bottom Glass Dock Navigation & Download CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#07090E]/90 backdrop-blur-2xl border-t border-white/10 px-5 pt-3.5 pb-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
        <div className="w-full max-w-sm mx-auto flex flex-col items-center gap-2.5">
          {/* Main Action Pill */}
          <button
            type="button"
            onClick={handleDownload}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#00D875] to-[#10B981] hover:from-[#05E880] hover:to-[#0EA874] active:scale-[0.98] text-[#07090E] font-hud font-extrabold text-base tracking-wider uppercase flex items-center justify-center gap-2.5 shadow-[0_4px_28px_rgba(0,216,117,0.35)] transition-all cursor-pointer"
          >
            <Download className="w-5 h-5 stroke-[2.5]" />
            <span>{isDownloading ? 'Starting Download...' : 'Download for Android'}</span>
          </button>

          {/* Subtitle Details & Desktop Fallback Link */}
          <div className="flex items-center justify-between w-full px-1 text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1 text-slate-400">
              <Smartphone className="w-3.5 h-3.5 opacity-70" />
              <span>v2.4 &bull; Direct APK (~18MB)</span>
            </span>

            <Link
              href="/"
              className="text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1 group py-0.5"
            >
              <span>Desktop Web</span>
              <ArrowUpRight className="w-3 h-3 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
