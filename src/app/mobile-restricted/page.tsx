'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Timer, Zap, Brain, Download, Monitor, ArrowUpRight, CheckCircle2, Sparkles } from 'lucide-react';
import { Logo } from '@/components/Logo';

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
    <main className="min-h-screen w-full bg-gray-950 text-white flex flex-col justify-between p-6 sm:p-8 relative overflow-hidden select-none">
      {/* Background Radial Glow & Ambient Lighting */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[460px] h-[340px] sm:h-[460px] bg-emerald-500/20 blur-[130px] rounded-full pointer-events-none"
      />
      <div 
        className="absolute -top-32 right-0 w-72 h-72 bg-emerald-600/10 blur-[100px] rounded-full pointer-events-none"
      />
      <div 
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-60"
      />

      {/* Top Header / Branding */}
      <header className="relative z-10 w-full max-w-sm mx-auto flex items-center justify-between animate-in fade-in duration-500">
        <div className="flex items-center gap-2.5">
          <Logo className="w-8 h-8 drop-shadow-md" />
          <span className="font-hud font-extrabold text-base tracking-wider uppercase text-white">
            STUDY<span className="text-emerald-400 font-mono">.IO</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-[10px] font-mono text-emerald-400">
          <Sparkles className="w-3 h-3 text-emerald-400" />
          <span>Native Only</span>
        </div>
      </header>

      {/* Main Glassmorphic Card */}
      <div className="relative z-10 w-full max-w-sm mx-auto my-auto py-4 animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-2xl relative overflow-hidden space-y-6">
          {/* Subtle Top Glowing Rim */}
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent" />

          {/* Typography */}
          <div className="space-y-2 text-center">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight font-hud">
              Experience Study.io Natively.
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 font-sans leading-relaxed">
              To keep your focus sharp and timers running in the background, Study.io is available exclusively on our native app or desktop web.
            </p>
          </div>

          {/* 3 Key Feature Rows */}
          <div className="space-y-2.5 pt-1">
            {/* Feature 1 */}
            <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
                <Timer className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide truncate">
                  Native Focus Timers
                </h3>
                <p className="text-[11px] text-neutral-400 font-sans truncate">
                  No background freezing or tab suspensions
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
                <Zap className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide truncate">
                  Real-Time Study Rooms
                </h3>
                <p className="text-[11px] text-neutral-400 font-sans truncate">
                  Live presence, shared rooms & synchronized chats
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
                <Brain className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide truncate">
                  AI Active Recall
                </h3>
                <p className="text-[11px] text-neutral-400 font-sans truncate">
                  Instant concept testing & study session analytics
                </p>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="space-y-3 pt-2 text-center">
            <button
              type="button"
              onClick={handleDownload}
              className="w-full py-4 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-gray-950 font-bold text-sm tracking-wide flex items-center justify-center gap-2.5 shadow-[0_0_28px_rgba(16,185,129,0.38)] transition-all cursor-pointer hover:shadow-[0_0_35px_rgba(16,185,129,0.5)]"
            >
              {isDownloaded ? (
                <>
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  <span>Download Initiated</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  <span>Download for Android</span>
                </>
              )}
            </button>

            {/* Muted Desktop Link */}
            <div className="pt-1">
              <Link
                href="/"
                className="text-xs text-neutral-400 hover:text-white transition-colors font-mono inline-flex items-center gap-1.5 group"
              >
                <Monitor className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                <span>Available on Desktop</span>
                <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-sm mx-auto text-center py-2 animate-in fade-in duration-500">
        <p className="text-[11px] text-neutral-600 font-mono">
          &copy; {new Date().getFullYear()} Study.io &bull; Precision Focus Infrastructure
        </p>
      </footer>
    </main>
  );
}
