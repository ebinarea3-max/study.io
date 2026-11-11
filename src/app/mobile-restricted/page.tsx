'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BookOpen, Timer, Zap, Brain, Download, ArrowUpRight } from 'lucide-react';

export default function MobileRestrictedPage() {
  const [isDownloaded, setIsDownloaded] = useState(false);

  const handleDownload = () => {
    setIsDownloaded(true);
    // Placeholder trigger for APK download or app store navigation
    const apkUrl = '/downloads/study-io.apk';
    const link = document.createElement('a');
    link.href = apkUrl;
    link.download = 'study-io.apk';
    // Link execution fallback
    setTimeout(() => {
      setIsDownloaded(false);
    }, 4000);
  };

  return (
    <main className="min-h-screen w-full bg-[#0B101A] text-white relative overflow-x-hidden flex flex-col justify-between px-6 pt-12 pb-44 select-none">
      {/* Ambient Top Center Radial Glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[380px] sm:w-[460px] h-[280px] bg-[radial-gradient(ellipse_at_top,rgba(0,216,117,0.15)_0%,transparent_70%)] pointer-events-none"
      />

      <div className="relative z-10 w-full max-w-sm mx-auto flex flex-col items-center animate-in fade-in duration-500">
        {/* Hero Section */}
        <div className="text-center flex flex-col items-center mt-2">
          {/* Study.io Logo Placeholder: Minimalist white open-book with #00D875 green accent */}
          <div className="relative inline-flex items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center shadow-inner relative">
              <BookOpen className="w-7 h-7 text-white stroke-[2]" />
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#00D875] shadow-[0_0_10px_#00D875]" />
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-hud mt-6 leading-tight">
            Experience Study.io Natively.
          </h1>

          <p className="text-sm text-slate-400 font-sans mt-3 max-w-xs mx-auto leading-relaxed">
            To keep your focus sharp and timers running in the background, Study.io is available exclusively on our native app or desktop web.
          </p>
        </div>

        {/* Feature List: Airy, borderless vertical list with generous gap-y-8 */}
        <div className="mt-12 space-y-8 w-full">
          {/* Feature 1 */}
          <div className="flex items-start gap-4">
            <div className="shrink-0 text-[#00D875] mt-0.5 drop-shadow-[0_0_10px_rgba(0,216,117,0.5)]">
              <Timer className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-white tracking-tight">
                Native Focus Timers
              </h3>
              <p className="text-xs text-slate-400 font-sans mt-1 leading-relaxed">
                No background freezing or tab suspensions
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="flex items-start gap-4">
            <div className="shrink-0 text-[#00D875] mt-0.5 drop-shadow-[0_0_10px_rgba(0,216,117,0.5)]">
              <Zap className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-white tracking-tight">
                Real-Time Study Rooms
              </h3>
              <p className="text-xs text-slate-400 font-sans mt-1 leading-relaxed">
                Live presence, shared rooms &amp; synchronized chats
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="flex items-start gap-4">
            <div className="shrink-0 text-[#00D875] mt-0.5 drop-shadow-[0_0_10px_rgba(0,216,117,0.5)]">
              <Brain className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-white tracking-tight">
                AI Active Recall
              </h3>
              <p className="text-xs text-slate-400 font-sans mt-1 leading-relaxed">
                Instant concept testing &amp; study session analytics
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Actions: Desktop link above sticky CTA pill button */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-sm z-30 flex flex-col items-center gap-3">
        <Link
          href="/"
          className="text-xs text-slate-400 hover:text-white transition-colors font-mono inline-flex items-center gap-1.5 py-0.5"
        >
          <span>Available on Desktop</span>
          <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
        </Link>

        <button
          onClick={handleDownload}
          className="w-full py-4 px-6 rounded-full bg-[#00D875] text-black font-bold text-sm tracking-wide shadow-lg shadow-[#00D875]/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer hover:brightness-105"
        >
          <Download className="w-4 h-4 stroke-[2.5]" />
          <span>{isDownloaded ? 'Downloading APK...' : 'Download for Android'}</span>
        </button>
      </div>
    </main>
  );
}
