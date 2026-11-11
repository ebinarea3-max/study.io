'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Timer, Users, Trophy, Download, ArrowUpRight } from 'lucide-react';
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
    <main className="h-screen h-dvh max-h-screen w-full bg-[#07090e] text-white overflow-hidden relative select-none flex flex-col justify-between px-6 py-6 sm:py-8 sm:px-8">
      {/* Background Dot-Grid & Atmospheric Glow */}
      <div className="fixed inset-0 pointer-events-none bg-dot-grid opacity-40 z-0" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[460px] h-[340px] sm:h-[460px] bg-[radial-gradient(circle,rgba(0,216,117,0.12)_0%,transparent_70%)] pointer-events-none z-0" />

      {/* Top Header: Authentic Logo + lowercase study.io */}
      <header className="relative z-10 w-full max-w-sm mx-auto flex items-center justify-between pt-1">
        <div className="flex items-center gap-2.5">
          <Logo className="w-8 h-8 drop-shadow-[0_0_12px_rgba(0,216,117,0.35)]" />
          <span className="text-base font-extrabold tracking-tight text-white font-sans lowercase">
            study<span className="text-[#00D875]">.io</span>
          </span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/10 text-[#00D875] tracking-wide">
          native app
        </span>
      </header>

      {/* Center Body: Title & 3 Classic Minimal Feature Cards */}
      <div className="relative z-10 w-full max-w-sm mx-auto flex flex-col items-center my-auto py-2">
        {/* Hero Title & Subtitle */}
        <div className="text-center space-y-2 mb-5 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight font-sans">
            experience <span className="text-[#00D875]">study.io</span> natively
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-xs mx-auto">
            Run timers and join live rooms without background browser freezes or audio cutoffs.
          </p>
        </div>

        {/* 3 Core Minimalist Feature Rows */}
        <div className="w-full space-y-2.5">
          {/* Feature 1: Timers */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.07] backdrop-blur-md">
            <div className="w-9 h-9 rounded-xl bg-[#00D875]/10 border border-[#00D875]/25 flex items-center justify-center text-[#00D875] shrink-0 shadow-[0_0_10px_rgba(0,216,117,0.2)]">
              <Timer className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white tracking-wide">Background Focus Timers</div>
              <div className="text-[11px] text-slate-400 truncate">Stopwatch, Pomodoro &amp; ambient audio</div>
            </div>
          </div>

          {/* Feature 2: Rooms */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.07] backdrop-blur-md">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 shrink-0 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
              <Users className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white tracking-wide">Live Study Rooms</div>
              <div className="text-[11px] text-slate-400 truncate">Real-time presence for up to 32 scholars</div>
            </div>
          </div>

          {/* Feature 3: Ranked */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.07] backdrop-blur-md">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 shrink-0 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
              <Trophy className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white tracking-wide">Ranked Seasons &amp; RP</div>
              <div className="text-[11px] text-slate-400 truncate">23 tiers, season resets &amp; daily streaks</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Download Button + Desktop Link */}
      <footer className="relative z-10 w-full max-w-sm mx-auto flex flex-col items-center gap-3 pb-2 sm:pb-3">
        <button
          type="button"
          onClick={handleDownload}
          className="w-full py-3.5 sm:py-4 px-6 rounded-2xl bg-gradient-to-r from-[#00D875] to-[#10B981] hover:brightness-105 active:scale-[0.98] text-[#07090E] font-bold text-sm tracking-wide flex items-center justify-center gap-2 shadow-[0_4px_24px_rgba(0,216,117,0.3)] transition-all cursor-pointer"
        >
          <Download className="w-4 h-4 stroke-[2.5]" />
          <span>{isDownloading ? 'starting download...' : 'download for android'}</span>
        </button>

        <div className="flex items-center justify-between w-full px-1 text-[11px] font-mono text-slate-400">
          <span>android &bull; v2.4</span>
          <Link
            href="/"
            className="text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1 group py-0.5"
          >
            <span>available on desktop</span>
            <ArrowUpRight className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
          </Link>
        </div>
      </footer>
    </main>
  );
}
